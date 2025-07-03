const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const { authenticateToken, checkPermission } = require('../middleware/auth');

const db = admin.firestore();

// Admin health check
router.get('/health', authenticateToken, checkPermission('admin', 'read'), async (req, res) => {
    res.json({ status: 'OK', admin: true });
});

router.post('/update-supply-manager-role', authenticateToken, async (req, res) => {
  try {
    // Check if user is super_admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can update roles' });
    }

    const { db } = require('../config/db');
    
    console.log('Starting supply_manager role update...');
    
    // 1. Update the role definition in crm_roles collection
    const rolesSnapshot = await db.collection('crm_roles')
      .where('name', '==', 'supply_manager')
      .get();
    
    if (!rolesSnapshot.empty) {
      const batch = db.batch();
      rolesSnapshot.forEach(doc => {
        batch.update(doc.ref, {
          name: 'supply_sales_service_manager',
          label: 'Supply Sales Service Manager',
          description: 'Full access manager for supply, sales, and service operations',
          permissions: {
            dashboard: { read: true, write: true, delete: true, manage_users: true },
            leads: { read: true, write: true, delete: true, assign: true, progress: true },
            inventory: { read: true, write: true, delete: true, allocate: true },
            orders: { read: true, write: true, delete: true, approve: true, assign: true },
            finance: { read: true, write: true, delete: true, approve: true },
            delivery: { read: true, write: true, delete: true },
            users: { read: true, write: true, delete: false, manage_roles: false }
          },
          updated_date: new Date().toISOString()
        });
      });
      await batch.commit();
      console.log('✅ Updated role definition');
    }

    // 2. Update all users with supply_manager role
    const usersSnapshot = await db.collection('crm_users')
      .where('role', '==', 'supply_manager')
      .get();
    
    let updatedUsers = 0;
    if (!usersSnapshot.empty) {
      const userBatch = db.batch();
      usersSnapshot.forEach(doc => {
        userBatch.update(doc.ref, {
          role: 'supply_sales_service_manager',
          updated_date: new Date().toISOString()
        });
        updatedUsers++;
      });
      await userBatch.commit();
      console.log(`✅ Updated ${updatedUsers} users`);
    }

    // 3. Update any order assignments
    const ordersSnapshot = await db.collection('crm_orders')
      .get();
    
    let updatedOrders = 0;
    const orderBatch = db.batch();
    ordersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.assigned_to_role === 'supply_manager') {
        orderBatch.update(doc.ref, {
          assigned_to_role: 'supply_sales_service_manager',
          updated_date: new Date().toISOString()
        });
        updatedOrders++;
      }
    });
    
    if (updatedOrders > 0) {
      await orderBatch.commit();
      console.log(`✅ Updated ${updatedOrders} order assignments`);
    }

    res.json({
      success: true,
      message: 'Role updated successfully',
      updated: {
        roles: rolesSnapshot.size,
        users: updatedUsers,
        orders: updatedOrders
      }
    });

  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
