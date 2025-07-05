const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const { authenticateToken, checkPermission } = require('../middleware/auth');

const db = admin.firestore();

// Get all roles
router.get('/', authenticateToken, checkPermission('users', 'manage_roles'), async (req, res) => {
    try {
        const snapshot = await db.collection('crm_roles').get();
        const roles = [];
        
        snapshot.forEach(doc => {
            roles.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        res.json({ data: roles });
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
});

// DELETE role by ID
router.delete('/:id', authenticateToken, checkPermission('users', 'manage_roles'), async (req, res) => {
    try {
        const roleId = req.params.id;
        console.log(`DELETE request for role: ${roleId}`);
        
        // Check if role exists
        const roleDoc = await db.collection('crm_roles').doc(roleId).get();
        if (!roleDoc.exists) {
            console.log(`Role not found: ${roleId}`);
            return res.status(404).json({ error: 'Role not found' });
        }
        
        const roleData = roleDoc.data();
        console.log(`Role data:`, roleData);
        
        // Check if any users have this role
        const usersSnapshot = await db.collection('crm_users')
            .where('role', '==', roleData.name)
            .limit(1)
            .get();
        
        if (!usersSnapshot.empty) {
            console.log(`Cannot delete role ${roleData.name} - users are assigned to it`);
            return res.status(400).json({ 
                error: 'Cannot delete role that is assigned to users',
                details: `Role "${roleData.label}" is currently assigned to one or more users`
            });
        }
        
        // Allow deletion of system roles only for super_admin (for cleanup purposes)
        if (roleData.is_system && req.user.role !== 'super_admin') {
            console.log(`Non-super_admin attempting to delete system role: ${roleData.name}`);
            return res.status(403).json({ 
                error: 'Only super admins can delete system roles',
                details: `Role "${roleData.label}" is a system role`
            });
        }
        
        // Delete the role
        await db.collection('crm_roles').doc(roleId).delete();
        console.log(`Role deleted successfully: ${roleId}`);
        
        res.json({ 
            success: true,
            message: 'Role deleted successfully',
            deleted_role: {
                id: roleId,
                name: roleData.name,
                label: roleData.label
            }
        });
        
    } catch (error) {
        console.error('DELETE role error:', error);
        res.status(500).json({ 
            error: 'Failed to delete role',
            details: error.message 
        });
    }
});

// Initialize default roles
router.post('/initialize', authenticateToken, checkPermission('users', 'manage_roles'), async (req, res) => {
    try {
        const defaultRoles = [
            {
                name: 'super_admin',
                label: 'Super Admin',
                description: 'Full system access',
                permissions: {
                    dashboard: { read: true, write: true, delete: true },
                    leads: { read: true, write: true, delete: true },
                    inventory: { read: true, write: true, delete: true },
                    orders: { read: true, write: true, delete: true },
                    finance: { read: true, write: true, delete: true },
                    delivery: { read: true, write: true, delete: true },
                    users: { read: true, write: true, delete: true, manage_roles: true }
                },
                is_system: true
            },
            {
                name: 'admin',
                label: 'Admin',
                description: 'Administrative access without role management',
                permissions: {
                    dashboard: { read: true, write: true, delete: true },
                    leads: { read: true, write: true, delete: true },
                    inventory: { read: true, write: true, delete: true },
                    orders: { read: true, write: true, delete: true },
                    finance: { read: true, write: true, delete: true },
                    delivery: { read: true, write: true, delete: true },
                    users: { read: true, write: true, delete: true, manage_roles: false }
                },
                is_system: true
            },
            {
                name: 'sales_manager',
                label: 'Sales Manager',
                description: 'Manages sales team and leads',
                permissions: {
                    dashboard: { read: true },
                    leads: { read: true, write: true, delete: true, assign: true },
                    inventory: { read: true },
                    orders: { read: true, write: true },
                    finance: { read: false },
                    delivery: { read: true },
                    users: { read: true }
                },
                is_system: true
            },
            {
                name: 'sales_executive',
                label: 'Sales Executive',
                description: 'Creates and manages leads',
                permissions: {
                    dashboard: { read: true },
                    leads: { read: true, write: true, progress: true },
                    inventory: { read: true },
                    orders: { read: true, write: true },
                    finance: { read: false },
                    delivery: { read: true },
                    users: { read: false }
                },
                is_system: true
            },
            {
                name: 'supply_sales_service_manager',
                label: 'Supply Sales Service Manager',
                description: 'Manages inventory and deliveries',
                permissions: {
                    dashboard: { read: true },
                    leads: { read: true },
                    inventory: { read: true, write: true, delete: true, allocate: true },
                    orders: { read: true },
                    finance: { read: false },
                    delivery: { read: true, write: true, delete: true },
                    users: { read: false }
                },
                is_system: true
            },
            {
                name: 'finance_manager',
                label: 'Finance Manager',
                description: 'Manages financial operations',
                permissions: {
                    dashboard: { read: true },
                    leads: { read: true },
                    inventory: { read: true },
                    orders: { read: true, approve: true },
                    finance: { read: true, write: true, delete: true, approve: true },
                    delivery: { read: true },
                    users: { read: false }
                },
                is_system: true
            },
            {
                name: 'viewer',
                label: 'Viewer',
                description: 'Read-only access',
                permissions: {
                    dashboard: { read: true },
                    leads: { read: true },
                    inventory: { read: true },
                    orders: { read: true },
                    finance: { read: true },
                    delivery: { read: true },
                    users: { read: false }
                },
                is_system: true
            }
        ];

        const batch = db.batch();
        
        for (const role of defaultRoles) {
            const docRef = db.collection('crm_roles').doc(role.name);
            batch.set(docRef, {
                ...role,
                created_at: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        
        await batch.commit();
        
        res.json({ 
            success: true, 
            message: 'Default roles initialized successfully',
            data: defaultRoles
        });
    } catch (error) {
        console.error('Error initializing roles:', error);
        res.status(500).json({ error: 'Failed to initialize roles' });
    }
});

module.exports = router;
