const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const admin = require('../config/firebase');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// Create inventory
router.post('/', authenticateToken, checkPermission('inventory', 'create'), async (req, res) => {
  try {
    const inventoryData = {
      ...req.body,
      created_by: req.user.name,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };
    
    const docRef = await db.collection('crm_inventory').add(inventoryData);
    
    // Create payable if payment is pending
    if (inventoryData.paymentStatus === 'pending' && inventoryData.totalPurchaseAmount > 0) {
      try {
        const payableData = {
          inventoryId: docRef.id,
          supplierName: inventoryData.supplierName || inventoryData.vendor_name || 'Unknown Supplier',
          eventName: inventoryData.event_name,
          amount: (parseFloat(inventoryData.totalPurchaseAmount) || 0) - (parseFloat(inventoryData.amountPaid) || 0),
          amountPaid: parseFloat(inventoryData.amountPaid) || 0,
          balance: (parseFloat(inventoryData.totalPurchaseAmount) || 0) - (parseFloat(inventoryData.amountPaid) || 0),
          dueDate: inventoryData.paymentDueDate || null,
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: req.user.id,
          description: `Payment for inventory: ${inventoryData.event_name}`
        };
        
        const payableRef = await db.collection('crm_payables').add(payableData);
        console.log('Payable created with ID:', payableRef.id);
      } catch (payableError) {
        console.error('Error creating payable:', payableError);
        // Don't fail the inventory creation if payable fails
      }
    }
    
    res.status(201).json({ 
      data: { 
        id: docRef.id, 
        ...inventoryData 
      } 
    });
  } catch (error) {
    console.error('Error creating inventory:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all inventory
router.get('/', authenticateToken, checkPermission('inventory', 'read'), async (req, res) => {
  try {
    const snapshot = await db.collection('crm_inventory').get();
    const inventory = [];
    snapshot.forEach(doc => {
      inventory.push({
        id: doc.id,
        ...doc.data()
      });
    });
    res.json({ data: inventory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update inventory
  try {
    const { id } = req.params;
    console.log('=== INVENTORY UPDATE DEBUG ===');
    console.log('Inventory ID:', id);
    console.log('Update data:', JSON.stringify(req.body, null, 2));
    
    const updateData = {
      ...req.body,
      updated_date: new Date().toISOString()
    };
    
    // Check if payment status changed and update related payables
    const oldDoc = await db.collection('crm_inventory').doc(id).get();
    const oldData = oldDoc.data();
    
    await db.collection('crm_inventory').doc(id).update(updateData);
    
    // Update related payables if payment info changed
    if (updateData.paymentStatus !== undefined || 
        updateData.amountPaid !== undefined || 
        updateData.totalPurchaseAmount !== undefined) {
      try {
        console.log('Inventory payment info changed, updating payables...');
        console.log('Searching for payables with inventoryId:', id);
        const payablesSnapshot = await db.collection('crm_payables')
          .where('inventoryId', '==', id)
          .where('status', '!=', 'paid')
          .get();
        
        console.log('Payables query result:', payablesSnapshot.size, 'documents found');
        if (!payablesSnapshot.empty) {
            payablesSnapshot.forEach(doc => {
                console.log('Payable found:', { id: doc.id, data: doc.data() });
            });
        }
        if (!payablesSnapshot.empty) {
          console.log(`Found ${payablesSnapshot.size} payables to update`);
          
          const newTotalAmount = parseFloat(updateData.totalPurchaseAmount !== undefined ? updateData.totalPurchaseAmount : oldData.totalPurchaseAmount) || 0;
          const newAmountPaid = parseFloat(updateData.amountPaid !== undefined ? updateData.amountPaid : oldData.amountPaid) || 0;
          const newBalance = newTotalAmount - newAmountPaid;
          
          console.log('Calculation:', { 
            oldTotal: oldData.totalPurchaseAmount,
            oldPaid: oldData.amountPaid,
            newTotal: newTotalAmount, 
            newPaid: newAmountPaid, 
            newBalance: newBalance 
          });
          
          const batch = db.batch();
          payablesSnapshot.forEach(doc => {
            if (newBalance <= 0 || updateData.paymentStatus === 'paid') {
              batch.update(doc.ref, {
                status: 'paid',
                paid_date: new Date().toISOString(),
                amount: 0,
                payment_notes: 'Paid through inventory update'
              });
            } else {
              batch.update(doc.ref, {
                amount: newBalance,
                updated_date: new Date().toISOString(),
                payment_notes: `Balance updated to ₹${newBalance.toFixed(2)} (Total: ₹${newTotalAmount} - Paid: ₹${newAmountPaid})`
              });
            }
          });
          await batch.commit();
          console.log('Payables updated successfully');
        }
      } catch (payableError) {
        console.error('Error updating payables:', payableError);
      }
    }
    
    res.json({ data: { id, ...updateData } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete inventory
router.delete('/:id', authenticateToken, checkPermission('inventory', 'delete'), async (req, res) => {
  try {
    await db.collection('crm_inventory').doc(req.params.id).delete();
    res.json({ data: { message: 'Inventory deleted successfully' } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unpaid inventory for payables tracking
router.get('/unpaid', authenticateToken, checkPermission('finance', 'read'), async (req, res) => {
  try {
    const snapshot = await db.collection('crm_inventory')
      .where('paymentStatus', 'in', ['pending', 'partial'])
      .get();
    
    const unpaidInventory = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.totalPurchaseAmount > 0) {
        unpaidInventory.push({
          id: doc.id,
          ...data,
          balance: data.totalPurchaseAmount - (data.amountPaid || 0)
        });
      }
    });
    
    res.json({ data: unpaidInventory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// DELETE all inventory (bulk delete for test mode)
router.delete('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is super_admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can perform bulk delete' });
    }
    
    // Check if bulk delete headers are present
    if (req.headers['x-delete-all'] !== 'true' || req.headers['x-test-mode'] !== 'true') {
      return res.status(403).json({ error: 'Bulk delete requires test mode headers' });
    }
    
    console.log('Bulk delete inventory requested by:', req.user.email);
    
    // Get all inventory
    const snapshot = await db.collection(collections.inventory).get();
    
    if (snapshot.empty) {
      return res.json({ message: 'No inventory to delete', count: 0 });
    }
    
    // Delete in batches
    const batch = db.batch();
    let count = 0;
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });
    
    await batch.commit();
    
    console.log(`Deleted ${count} inventory items`);
    res.json({ 
      message: `Successfully deleted ${count} inventory items`,
      count: count 
    });
    
  } catch (error) {
    console.error('Bulk delete inventory error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Enhanced PUT route with payables sync
module.exports = router;
// Enhanced PUT route with payables sync
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get old data first
    const oldDoc = await db.collection('crm_inventory').doc(id).get();
    if (!oldDoc.exists) {
      return res.status(404).json({ error: 'Inventory not found' });
    }
    const oldData = oldDoc.data();
    
    const updateData = {
      ...req.body,
      updated_date: new Date().toISOString()
    };
    
    // Validate payment amounts
    const totalAmount = parseFloat(updateData.totalPurchaseAmount || oldData.totalPurchaseAmount || 0);
    const amountPaid = parseFloat(updateData.amountPaid || oldData.amountPaid || 0);
    
    if (amountPaid > totalAmount) {
      return res.status(400).json({ 
        error: 'Amount paid cannot exceed total purchase amount',
        details: { total: totalAmount, paid: amountPaid }
      });
    }
    
    // Auto-set payment status
    if (amountPaid >= totalAmount) {
      updateData.paymentStatus = 'paid';
    } else if (amountPaid > 0) {
      updateData.paymentStatus = 'partial';
    } else {
      updateData.paymentStatus = 'pending';
    }
    
    // Update inventory
    await db.collection('crm_inventory').doc(id).update(updateData);
    
    // Check if payment-related fields changed
    const paymentFieldsChanged = 
      updateData.paymentStatus !== undefined || 
      updateData.amountPaid !== undefined || 
      updateData.totalPurchaseAmount !== undefined;
    
    if (paymentFieldsChanged) {
      console.log('Payment fields changed, syncing payables...');
      
      try {
        // Find related payables
        const payablesSnapshot = await db.collection('crm_payables')
          .where('inventoryId', '==', id)
          .get();
        
        if (!payablesSnapshot.empty) {
          const newTotalAmount = parseFloat(updateData.totalPurchaseAmount !== undefined ? 
            updateData.totalPurchaseAmount : oldData.totalPurchaseAmount) || 0;
          const newAmountPaid = parseFloat(updateData.amountPaid !== undefined ? 
            updateData.amountPaid : oldData.amountPaid) || 0;
          const newBalance = newTotalAmount - newAmountPaid;
          
          console.log('Payable sync calculation:', {
            total: newTotalAmount,
            paid: newAmountPaid,
            balance: newBalance,
            paymentStatus: updateData.paymentStatus
          });
          
          const batch = db.batch();
          
          payablesSnapshot.forEach(doc => {
            const payableUpdate = {
              updated_date: new Date().toISOString(),
              updated_by: req.user?.email || 'system'
            };
            
            if (newBalance <= 0 || updateData.paymentStatus === 'paid') {
              payableUpdate.status = 'paid';
              payableUpdate.amount = 0;
              payableUpdate.paid_date = new Date().toISOString();
              payableUpdate.payment_notes = `Paid via inventory update. Total: ₹${newTotalAmount}, Paid: ₹${newAmountPaid}`;
            } else {
              payableUpdate.status = 'pending';
              payableUpdate.amount = newBalance;
              payableUpdate.payment_notes = `Balance updated: ₹${newBalance.toFixed(2)} (Total: ₹${newTotalAmount} - Paid: ₹${newAmountPaid})`;
            }
            
            batch.update(doc.ref, payableUpdate);
          });
          
          await batch.commit();
          console.log(`Updated ${payablesSnapshot.size} related payables`);
        }
      } catch (payableError) {
        console.error('Error syncing payables:', payableError);
      }
    }
    
    res.json({ 
      data: { id, ...updateData },
      message: paymentFieldsChanged ? 'Inventory updated and payables synced' : 'Inventory updated'
    });
    
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update inventory payment and sync with payables
// This will be replaced by the enhanced version
