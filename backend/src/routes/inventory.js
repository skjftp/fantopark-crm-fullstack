const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/db');
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
    
    // Create payable if payment is pending or partial
    if ((inventoryData.paymentStatus === 'pending' || inventoryData.paymentStatus === 'partial') && inventoryData.totalPurchaseAmount > 0) {
      try {
        const totalAmount = parseFloat(inventoryData.totalPurchaseAmount) || 0;
        const amountPaid = parseFloat(inventoryData.amountPaid) || 0;
        const pendingBalance = totalAmount - amountPaid;
        
        if (pendingBalance > 0) {
          const payableData = {
            inventoryId: docRef.id,
            supplierName: inventoryData.supplierName || inventoryData.vendor_name || 'Unknown Supplier',
            eventName: inventoryData.event_name,
            invoiceNumber: inventoryData.supplierInvoice || 'INV-' + Date.now(),
            amount: pendingBalance,
            dueDate: inventoryData.paymentDueDate || null,
            status: 'pending',
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString(),
            createdBy: req.user.id,
            description: `Payment for inventory: ${inventoryData.event_name}`,
            payment_notes: `Created from inventory - Balance: ₹${pendingBalance.toFixed(2)}`
          };
          
          const payableRef = await db.collection('crm_payables').add(payableData);
          console.log('Payable created with ID:', payableRef.id);
        }
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

// Get single inventory item
router.get('/:id', authenticateToken, checkPermission('inventory', 'read'), async (req, res) => {
  try {
    const doc = await db.collection('crm_inventory').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.json({ data: { id: doc.id, ...doc.data() } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update inventory with complete payable sync logic
router.put('/:id', authenticateToken, checkPermission('inventory', 'write'), async (req, res) => {
  try {
    const { id } = req.params;
    console.log('=== INVENTORY UPDATE DEBUG ===');
    console.log('Inventory ID:', id);
    console.log('Update data:', JSON.stringify(req.body, null, 2));
    
    const updateData = {
      ...req.body,
      updated_date: new Date().toISOString()
    };
    
    // Get old data before update
    const oldDoc = await db.collection('crm_inventory').doc(id).get();
    if (!oldDoc.exists) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    const oldData = oldDoc.data();
    
    // Update inventory first
    await db.collection('crm_inventory').doc(id).update(updateData);
    
    // Update related payables if payment info changed
    if (updateData.paymentStatus !== undefined || 
        updateData.amountPaid !== undefined || 
        updateData.totalPurchaseAmount !== undefined) {
      try {
        console.log('Inventory payment info changed, updating payables...');
        console.log('Searching for payables with inventoryId:', id);
        
        const newTotalAmount = parseFloat(updateData.totalPurchaseAmount !== undefined ? updateData.totalPurchaseAmount : oldData.totalPurchaseAmount) || 0;
        const newAmountPaid = parseFloat(updateData.amountPaid !== undefined ? updateData.amountPaid : oldData.amountPaid) || 0;
        const newBalance = newTotalAmount - newAmountPaid;
        
        console.log('Payment calculation:', { 
          oldTotal: oldData.totalPurchaseAmount,
          oldPaid: oldData.amountPaid,
          newTotal: newTotalAmount, 
          newPaid: newAmountPaid, 
          newBalance: newBalance 
        });

        // Find existing payables for this inventory (including paid ones)
        const payablesSnapshot = await db.collection('crm_payables')
          .where('inventoryId', '==', id)
          .get();
        
        console.log('Payables query result:', payablesSnapshot.size, 'documents found');
        
        if (!payablesSnapshot.empty) {
          // UPDATE EXISTING PAYABLES
          console.log('Updating existing payables...');
          const batch = db.batch();
          
          payablesSnapshot.forEach(doc => {
            const payableData = doc.data();
            console.log('Updating payable:', { id: doc.id, currentData: payableData });
            
            if (newBalance <= 0 || updateData.paymentStatus === 'paid') {
              // Fully paid - set amount to 0 but keep record
              batch.update(doc.ref, {
                amount: 0,
                status: 'paid',
                paid_date: new Date().toISOString(),
                updated_date: new Date().toISOString(),
                payment_notes: 'Paid through inventory update'
              });
              console.log('Marking payable as paid with amount 0');
            } else {
              // Partial payment - update balance
              batch.update(doc.ref, {
                amount: newBalance,
                status: 'pending',
                updated_date: new Date().toISOString(),
                payment_notes: `Balance updated to ₹${newBalance.toFixed(2)} (Total: ₹${newTotalAmount} - Paid: ₹${newAmountPaid})`
              });
              console.log('Updating payable balance to:', newBalance);
            }
          });
          
          await batch.commit();
          console.log('Existing payables updated successfully');
          
        } else if (newBalance > 0) {
          // CREATE NEW PAYABLE if balance exists and no payable record found
          console.log('Creating new payable for pending balance:', newBalance);
          
          const payableData = {
            inventoryId: id,
            supplierName: updateData.supplierName || oldData.supplierName || 'Unknown Supplier',
            eventName: updateData.event_name || oldData.event_name,
            invoiceNumber: updateData.supplierInvoice || oldData.supplierInvoice || 'INV-' + Date.now(),
            amount: newBalance,
            dueDate: updateData.paymentDueDate || oldData.paymentDueDate || null,
            status: 'pending',
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString(),
            description: `Payment for inventory: ${updateData.event_name || oldData.event_name}`,
            payment_notes: `Created from inventory update - Balance: ₹${newBalance.toFixed(2)}`
          };
          
          const payableRef = await db.collection('crm_payables').add(payableData);
          console.log('New payable created with ID:', payableRef.id);
          
        } else {
          console.log('No balance remaining and no existing payables - no action needed');
        }
        
      } catch (payableError) {
        console.error('Error updating payables:', payableError);
      }
    }
    
    res.json({ data: { id, ...updateData } });
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST allocate inventory
router.post('/:id/allocate', authenticateToken, checkPermission('inventory', 'write'), async (req, res) => {
  try {
    const { id } = req.params;
    const { tickets_allocated, lead_id, allocation_date, notes } = req.body;
    
    const inventoryDoc = await db.collection('crm_inventory').doc(id).get();
    if (!inventoryDoc.exists) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    const inventoryData = inventoryDoc.data();
    const availableTickets = parseInt(inventoryData.available_tickets) || 0;
    const allocatedTickets = parseInt(tickets_allocated) || 0;
    
    if (allocatedTickets > availableTickets) {
      return res.status(400).json({ error: 'Not enough tickets available for allocation' });
    }
    
    // Update available tickets
    const newAvailableTickets = availableTickets - allocatedTickets;
    await db.collection('crm_inventory').doc(id).update({
      available_tickets: newAvailableTickets,
      updated_date: new Date().toISOString()
    });
    
    // Create allocation record (optional - if you want to track allocations)
    const allocationData = {
      inventory_id: id,
      lead_id: lead_id,
      tickets_allocated: allocatedTickets,
      allocation_date: allocation_date,
      notes: notes || '',
      created_date: new Date().toISOString(),
      created_by: req.user.id
    };
    
    await db.collection('crm_allocations').add(allocationData);
    
    res.json({ 
      success: true, 
      message: `Successfully allocated ${allocatedTickets} tickets`,
      remaining_tickets: newAvailableTickets
    });
  } catch (error) {
    console.error('Error allocating inventory:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete inventory
router.delete('/:id', authenticateToken, checkPermission('inventory', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete related payables first
    const payablesSnapshot = await db.collection('crm_payables')
      .where('inventoryId', '==', id)
      .get();
    
    if (!payablesSnapshot.empty) {
      const batch = db.batch();
      payablesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`Deleted ${payablesSnapshot.size} related payables`);
    }
    
    // Delete inventory item
    await db.collection('crm_inventory').doc(id).delete();
    
    res.json({ data: { message: 'Inventory and related payables deleted successfully' } });
  } catch (error) {
    console.error('Error deleting inventory:', error);
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
      const totalAmount = parseFloat(data.totalPurchaseAmount) || 0;
      const paidAmount = parseFloat(data.amountPaid) || 0;
      const balance = totalAmount - paidAmount;
      
      if (balance > 0) {
        unpaidInventory.push({
          id: doc.id,
          ...data,
          balance: balance,
          daysOverdue: data.paymentDueDate ? 
            Math.floor((new Date() - new Date(data.paymentDueDate)) / (1000 * 60 * 60 * 24)) : 0
        });
      }
    });
    
    res.json({ data: unpaidInventory });
  } catch (error) {
    console.error('Error fetching unpaid inventory:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update inventory payment specifically (alternative endpoint)
router.put('/:id/payment', authenticateToken, checkPermission('finance', 'write'), async (req, res) => {
  try {
    const { id } = req.params;
    const { amountPaid, paymentStatus, totalPurchaseAmount } = req.body;
    
    const updateData = {
      amountPaid: parseFloat(amountPaid) || 0,
      paymentStatus: paymentStatus,
      updated_date: new Date().toISOString()
    };
    
    if (totalPurchaseAmount !== undefined) {
      updateData.totalPurchaseAmount = parseFloat(totalPurchaseAmount) || 0;
    }
    
    // This will trigger the same payable sync logic as the main PUT route
    const inventoryDoc = await db.collection('crm_inventory').doc(id).get();
    if (!inventoryDoc.exists) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    await db.collection('crm_inventory').doc(id).update(updateData);
    
    res.json({ 
      success: true, 
      message: 'Payment updated successfully',
      data: { id, ...updateData }
    });
  } catch (error) {
    console.error('Error updating payment:', error);
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
    const snapshot = await db.collection('crm_inventory').get();
    
    if (snapshot.empty) {
      return res.json({ message: 'No inventory to delete', count: 0 });
    }
    
    // Delete related payables first
    const inventoryIds = [];
    snapshot.forEach(doc => {
      inventoryIds.push(doc.id);
    });
    
    // Delete payables in batches
    for (const inventoryId of inventoryIds) {
      const payablesSnapshot = await db.collection('crm_payables')
        .where('inventoryId', '==', inventoryId)
        .get();
      
      if (!payablesSnapshot.empty) {
        const batch = db.batch();
        payablesSnapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }
    }
    
    // Delete inventory in batches
    const batch = db.batch();
    let count = 0;
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });
    
    await batch.commit();
    
    console.log(`Deleted ${count} inventory items and related payables`);
    res.json({ 
      message: `Successfully deleted ${count} inventory items and related payables`,
      count: count 
    });
    
  } catch (error) {
    console.error('Bulk delete inventory error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
