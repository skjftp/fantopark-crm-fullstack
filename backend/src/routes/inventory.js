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
        
        console.log('Creating payable on inventory creation:', {
          totalAmount,
          amountPaid,
          pendingBalance
        });
        
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
          console.log('Payable created with ID:', payableRef.id, 'Amount:', pendingBalance);
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
    console.log('Update data received:', JSON.stringify(req.body, null, 2));
    
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
    
    console.log('Old inventory data:', {
      totalPurchaseAmount: oldData.totalPurchaseAmount,
      amountPaid: oldData.amountPaid,
      paymentStatus: oldData.paymentStatus
    });
    
    // Update inventory first
    await db.collection('crm_inventory').doc(id).update(updateData);
    
    // Update related payables if payment info changed
    if (updateData.paymentStatus !== undefined || 
        updateData.amountPaid !== undefined || 
        updateData.totalPurchaseAmount !== undefined) {
      try {
        console.log('Inventory payment info changed, updating payables...');
        
console.log('DEBUG: Basic variables check...');
console.log('updateData type:', typeof updateData);
console.log('oldData type:', typeof oldData);
console.log('updateData keys:', Object.keys(updateData || {}));
console.log('oldData keys:', Object.keys(oldData || {}));

console.log('DEBUG: Checking individual values...');
console.log('updateData.totalPurchaseAmount:', updateData.totalPurchaseAmount);
console.log('updateData.amountPaid:', updateData.amountPaid);
console.log('oldData.totalPurchaseAmount:', oldData.totalPurchaseAmount);
console.log('oldData.amountPaid:', oldData.amountPaid);

console.log('DEBUG: About to start parseFloat operations...');

console.log('DEBUG: Step A - Starting calculations...');
// Calculate new values with proper fallbacks
const newTotalAmount = parseFloat(updateData.totalPurchaseAmount !== undefined ? updateData.totalPurchaseAmount : oldData.totalPurchaseAmount) || 0;
const newAmountPaid = parseFloat(updateData.amountPaid !== undefined ? updateData.amountPaid : oldData.amountPaid) || 0;
let newBalance = newTotalAmount - newAmountPaid;

console.log('DEBUG: Step B - Calculations completed:', { newTotalAmount, newAmountPaid, newBalance });

// Ensure we don't have negative balances
if (newBalance < 0) {
  console.warn('Warning: Amount paid exceeds total amount! Setting balance to 0');
  newBalance = 0;
}

console.log('DEBUG: Step C - About to query payables...');
console.log('Searching for payables with inventoryId:', id);
const payablesSnapshot = await db.collection('crm_payables')
  .where('inventoryId', '==', id)
  .get();

console.log('DEBUG: Step D - Payables query completed');
console.log('Payables query result:', payablesSnapshot.size, 'documents found');
        // Calculate new values with proper fallbacks
        const newTotalAmount = parseFloat(updateData.totalPurchaseAmount !== undefined ? updateData.totalPurchaseAmount : oldData.totalPurchaseAmount) || 0;
        const newAmountPaid = parseFloat(updateData.amountPaid !== undefined ? updateData.amountPaid : oldData.amountPaid) || 0;
        let newBalance = newTotalAmount - newAmountPaid;
        
        // Ensure we don't have negative balances
        if (newBalance < 0) {
          console.warn('Warning: Amount paid exceeds total amount! Setting balance to 0');
          newBalance = 0;
        }
        
        console.log('Payment calculation:', { 
          oldTotal: oldData.totalPurchaseAmount,
          oldPaid: oldData.amountPaid,
          newTotal: newTotalAmount, 
          newPaid: newAmountPaid, 
          newBalance: newBalance,
          updateDataReceived: {
            totalPurchaseAmount: updateData.totalPurchaseAmount,
            amountPaid: updateData.amountPaid,
            paymentStatus: updateData.paymentStatus
          }
        });

        console.log('Searching for payables with inventoryId:', id);
        const payablesSnapshot = await db.collection('crm_payables')
          .where('inventoryId', '==', id)
          .get();
        
        console.log('Payables query result:', payablesSnapshot.size, 'documents found');
        if (!payablesSnapshot.empty) {
            payablesSnapshot.forEach(doc => {
                console.log('Payable found:', { id: doc.id, data: doc.data() });
            });
        }
        
        if (!payablesSnapshot.empty) {
          console.log(`Found ${payablesSnapshot.size} payables to update`);
          
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
        } else {
          // CREATE NEW PAYABLE IF NONE EXISTS AND BALANCE > 0
          if (newBalance > 0 && updateData.paymentStatus !== 'paid') {
            console.log(`No existing payables found. Creating new payable for pending balance: ${newBalance}`);

try {
  console.log('Step 1: Preparing payable data...');
  const newPayable = {
    inventoryId: id,
    amount: newBalance,
    status: 'pending',
    supplierName: updateData.supplierName || oldData.supplierName || 'Unknown Supplier',
    event_name: updateData.event_name || oldData.event_name || 'Unknown Event',
    event_date: updateData.event_date || oldData.event_date || null,
    totalPurchaseAmount: newTotalAmount,
    amountPaid: newAmountPaid,
    created_date: new Date().toISOString(),
    payment_notes: `Created from inventory update - Balance: ₹${newBalance.toFixed(2)}`,
    priority: 'medium',
    dueDate: null
  };
  
  console.log('Step 2: Payable data prepared:', JSON.stringify(newPayable, null, 2));
  
  console.log('Step 3: About to call db.collection...');
  const docRef = await db.collection('crm_payables').add(newPayable);
  console.log('Step 4: Database call completed successfully');
  
  console.log(`✅ New payable created with ID: ${docRef.id} Amount: ${newBalance}`);
} catch (payableCreateError) {
  console.error('PAYABLE CREATION ERROR:', payableCreateError);
  console.error('Error stack:', payableCreateError.stack);
}
            
            const newPayable = {
              inventoryId: id,
              amount: newBalance,
              status: 'pending',
              supplierName: updateData.supplierName || oldData.supplierName || 'Unknown Supplier',
              event_name: updateData.event_name || oldData.event_name || 'Unknown Event',
              event_date: updateData.event_date || oldData.event_date || null,
              totalPurchaseAmount: newTotalAmount,
              amountPaid: newAmountPaid,
              created_date: new Date().toISOString(),
              payment_notes: `Created from inventory update - Balance: ₹${newBalance.toFixed(2)} (Total: ₹${newTotalAmount} - Paid: ₹${newAmountPaid})`,
              priority: 'medium',
              dueDate: null
            };
            
            const docRef = await db.collection('crm_payables').add(newPayable);
            console.log(`✅ New payable created with ID: ${docRef.id} Amount: ${newBalance}`);
          } else {
            console.log('No payable needed - balance is 0 or item is fully paid');
          }
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
    
    console.log('=== PAYMENT ENDPOINT CALLED ===');
    console.log('Inventory ID:', id);
    console.log('Payment data:', { amountPaid, paymentStatus, totalPurchaseAmount });
    
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
    
    // Update related payable if it exists
    const payablesSnapshot = await db.collection('crm_payables')
      .where('inventoryId', '==', id)
      .get();
    
    if (!payablesSnapshot.empty) {
      const batch = db.batch();
      payablesSnapshot.forEach(doc => {
        batch.update(doc.ref, {
          status: paymentStatus === 'paid' ? 'paid' : 'pending',
          updated_date: new Date().toISOString()
        });
      });
      await batch.commit();
    }
    
    res.json({ 
      success: true, 
      message: 'Payment updated and synced',
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
    let payablesDeleted = 0;
    for (const inventoryId of inventoryIds) {
      const payablesSnapshot = await db.collection('crm_payables')
        .where('inventoryId', '==', inventoryId)
        .get();
      
      if (!payablesSnapshot.empty) {
        const batch = db.batch();
        payablesSnapshot.forEach(doc => {
          batch.delete(doc.ref);
          payablesDeleted++;
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
    
    console.log(`Deleted ${count} inventory items and ${payablesDeleted} related payables`);
    res.json({ 
      message: `Successfully deleted ${count} inventory items and ${payablesDeleted} related payables`,
      count: count,
      payablesDeleted: payablesDeleted
    });
    
  } catch (error) {
    console.error('Bulk delete inventory error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
