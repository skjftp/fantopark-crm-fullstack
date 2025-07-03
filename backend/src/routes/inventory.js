const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/db');
const admin = require('../config/firebase');
const { authenticateToken, checkPermission } = require('../middleware/auth');
// Don't import Inventory model since we're using direct database access

// Helper function to sanitize and validate inventory data
const sanitizeInventoryData = (data) => {
  const sanitized = {
    // Basic Event Information
    event_name: data.event_name || '',
    event_date: data.event_date || '',
    event_type: data.event_type || '',
    sports: data.sports || '',
    venue: data.venue || '',
    day_of_match: data.day_of_match || 'Not Applicable',
    
    // Ticket Details
    category_of_ticket: data.category_of_ticket || '',
    stand: data.stand || '',
    total_tickets: parseInt(data.total_tickets) || 0,
    available_tickets: parseInt(data.available_tickets) || 0,
    
    // Pricing Information
    mrp_of_ticket: parseFloat(data.mrp_of_ticket) || 0,
    buying_price: parseFloat(data.buying_price) || 0,
    selling_price: parseFloat(data.selling_price) || 0,
    
    // Additional Information
    inclusions: data.inclusions || '',
    booking_person: data.booking_person || '',
    procurement_type: data.procurement_type || 'pre_inventory',
    notes: data.notes || '',
    
    // Payment Information - EXACT FIELD NAMES
    paymentStatus: data.paymentStatus || 'pending',
    supplierName: data.supplierName || '',
    supplierInvoice: data.supplierInvoice || '',
    purchasePrice: parseFloat(data.purchasePrice) || 0,
    totalPurchaseAmount: parseFloat(data.totalPurchaseAmount) || 0,
    amountPaid: parseFloat(data.amountPaid) || 0,
    paymentDueDate: data.paymentDueDate || '',
    
    // Legacy fields for backward compatibility
    vendor_name: data.vendor_name || data.supplierName || '',
    price_per_ticket: parseFloat(data.price_per_ticket) || parseFloat(data.selling_price) || 0,
    number_of_tickets: parseInt(data.number_of_tickets) || parseInt(data.total_tickets) || 0,
    total_value_of_tickets: parseFloat(data.total_value_of_tickets) || 0,
    currency: data.currency || 'INR',
    base_amount_inr: parseFloat(data.base_amount_inr) || 0,
    gst_18_percent: parseFloat(data.gst_18_percent) || 0,
    selling_price_per_ticket: parseFloat(data.selling_price_per_ticket) || parseFloat(data.selling_price) || 0,
    payment_due_date: data.payment_due_date || data.paymentDueDate || '',
    supplier_name: data.supplier_name || data.supplierName || '',
    ticket_source: data.ticket_source || 'Primary',
    status: data.status || 'available',
    allocated_to_order: data.allocated_to_order || ''
  };
  
  // Auto-calculate fields if not provided
  if (!sanitized.totalPurchaseAmount && sanitized.purchasePrice && sanitized.total_tickets) {
    sanitized.totalPurchaseAmount = sanitized.purchasePrice * sanitized.total_tickets;
  }
  
  if (!sanitized.totalPurchaseAmount && sanitized.buying_price && sanitized.total_tickets) {
    sanitized.totalPurchaseAmount = sanitized.buying_price * sanitized.total_tickets;
  }
  
  if (!sanitized.total_value_of_tickets && sanitized.selling_price && sanitized.total_tickets) {
    sanitized.total_value_of_tickets = sanitized.selling_price * sanitized.total_tickets;
  }
  
  // Ensure available tickets don't exceed total tickets
  if (sanitized.available_tickets > sanitized.total_tickets) {
    sanitized.available_tickets = sanitized.total_tickets;
  }
  
  return sanitized;
};

// Create inventory - DIRECT DATABASE SAVE
router.post('/', authenticateToken, checkPermission('inventory', 'create'), async (req, res) => {
  try {
    console.log('Creating inventory with data:', JSON.stringify(req.body, null, 2));
    
    const sanitizedData = sanitizeInventoryData(req.body);
    
    const inventoryData = {
      ...sanitizedData,
      created_by: req.user.name,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };
    
    console.log('Sanitized inventory data:', JSON.stringify(inventoryData, null, 2));
    console.log('Payment fields being saved:');
    console.log('  paymentStatus:', inventoryData.paymentStatus);
    console.log('  supplierName:', inventoryData.supplierName);
    console.log('  totalPurchaseAmount:', inventoryData.totalPurchaseAmount);
    
    // DIRECT DATABASE SAVE - Same as CSV upload
    const docRef = await db.collection('crm_inventory').add(inventoryData);
    
    // Verify saved data
    const savedDoc = await db.collection('crm_inventory').doc(docRef.id).get();
    const savedData = savedDoc.data();
    
    console.log('✅ Inventory saved with payment fields:');
    console.log('  paymentStatus:', savedData.paymentStatus);
    console.log('  supplierName:', savedData.supplierName);
    console.log('  totalPurchaseAmount:', savedData.totalPurchaseAmount);
    
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

// Get all inventory - DIRECT DATABASE ACCESS
router.get('/', authenticateToken, checkPermission('inventory', 'read'), async (req, res) => {
  try {
    const snapshot = await db.collection('crm_inventory')
      .orderBy('event_date', 'desc')
      .get();
    const inventory = [];
    snapshot.forEach(doc => {
      inventory.push({
        id: doc.id,
        ...doc.data()
      });
    });
    res.json({ data: inventory });
  } catch (error) {
    console.error('Error fetching inventory:', error);
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
    
    // Sanitize the update data
    const sanitizedData = sanitizeInventoryData(req.body);
    
    const updateData = {
      ...sanitizedData,
      updated_date: new Date().toISOString()
    };
    
    console.log('Sanitized update data:', JSON.stringify(updateData, null, 2));
    
    // Update inventory first
    await db.collection('crm_inventory').doc(id).update(updateData);
    
    // Update related payables if payment info changed
    if (updateData.paymentStatus !== undefined || 
        updateData.amountPaid !== undefined || 
        updateData.totalPurchaseAmount !== undefined) {
      
      try {
        console.log('Inventory payment info changed, updating payables...');
        
        // Calculate new values with proper fallbacks and safety checks
        console.log('DEBUG: About to calculate values...');
        const newTotalAmount = parseFloat((updateData && updateData.totalPurchaseAmount !== undefined) ? updateData.totalPurchaseAmount : (oldData && oldData.totalPurchaseAmount)) || 0;
        console.log('DEBUG: newTotalAmount calculated:', newTotalAmount);
        const newAmountPaid = parseFloat((updateData && updateData.amountPaid !== undefined) ? updateData.amountPaid : (oldData && oldData.amountPaid)) || 0;
        console.log('DEBUG: newAmountPaid calculated:', newAmountPaid);
        let newBalance = newTotalAmount - newAmountPaid;
        console.log('DEBUG: newBalance calculated:', newBalance);        
       
        // Ensure we don't have negative balances
        if (newBalance < 0) {
          console.warn('Warning: Amount paid exceeds total amount! Setting balance to 0');
          newBalance = 0;
        }
        
        console.log('Payment calculation:', { 
          newTotal: newTotalAmount, 
          newPaid: newAmountPaid, 
          newBalance: newBalance 
        });

        // Find existing payables for this inventory
        console.log('Searching for payables with inventoryId:', id);
        const payablesSnapshot = await db.collection('crm_payables')
          .where('inventoryId', '==', id)
          .get();
        
        console.log('Payables query result:', payablesSnapshot.size, 'documents found');
        
        if (!payablesSnapshot.empty) {
          // UPDATE EXISTING PAYABLES
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
          console.log('Existing payables updated successfully');
          
        } else {
          // CREATE NEW PAYABLE IF NONE EXISTS AND BALANCE > 0
          if (newBalance > 0 && updateData.paymentStatus !== 'paid') {
            console.log(`No existing payables found. Creating new payable for pending balance: ${newBalance}`);
            
            const newPayable = {
              inventoryId: id,
              amount: newBalance,
              status: 'pending',
              supplierName: updateData.supplierName || oldData.supplierName || updateData.vendor_name || oldData.vendor_name || 'Unknown Supplier',
              event_name: updateData.event_name || oldData.event_name || 'Unknown Event',
              event_date: updateData.event_date || oldData.event_date || null,
              totalPurchaseAmount: newTotalAmount,
              amountPaid: newAmountPaid,
              created_date: new Date().toISOString(),
              payment_notes: `Created from inventory update - Balance: ₹${newBalance.toFixed(2)} (Total: ₹${newTotalAmount} - Paid: ₹${newAmountPaid})`,
              priority: 'medium',
              dueDate: updateData.paymentDueDate || oldData.paymentDueDate || null
            };
            
            console.log('About to create payable with data:', JSON.stringify(newPayable, null, 2));
            const docRef = await db.collection('crm_payables').add(newPayable);
            console.log(`✅ New payable created with ID: ${docRef.id} Amount: ${newBalance}`);
          } else {
            console.log('No payable needed - balance is 0 or item is fully paid');
          }
        }
        
      } catch (payableError) {
        console.error('Error in payables logic:', payableError);
        console.error('Error stack:', payableError.stack);
      }
    } else {
      console.log('No payment-related fields changed, skipping payable sync');
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
    
    console.log('Allocation request:', { id, tickets_allocated, lead_id, allocation_date, notes });
    
    // Verify lead exists and is converted
    const leadDoc = await db.collection('crm_leads').doc(lead_id).get();
    if (!leadDoc.exists) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    const leadData = leadDoc.data();
    if (leadData.status !== 'converted') {
      return res.status(400).json({ error: 'Lead must be in converted status to allocate inventory' });
    }
    
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
    
    // Create allocation record
    const allocationData = {
      inventory_id: id,
      lead_id: lead_id,
      tickets_allocated: allocatedTickets,
      allocation_date: allocation_date || new Date().toISOString().split('T')[0],
      notes: notes || '',
      created_date: new Date().toISOString(),
      created_by: req.user.id,
      lead_name: leadData.name,
      lead_email: leadData.email,
      inventory_event: inventoryData.event_name
    };
    
    const allocationRef = await db.collection('crm_allocations').add(allocationData);
    
    console.log(`Successfully allocated ${allocatedTickets} tickets to lead ${leadData.name}`);
    
    res.json({ 
      success: true, 
      message: `Successfully allocated ${allocatedTickets} tickets to ${leadData.name}`,
      allocation_id: allocationRef.id,
      remaining_tickets: newAvailableTickets
    });
  } catch (error) {
    console.error('Error allocating inventory:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get allocations for a specific inventory item
router.get('/:id/allocations', authenticateToken, checkPermission('inventory', 'read'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get allocations for this inventory
    const allocationsSnapshot = await db.collection('crm_allocations')
      .where('inventory_id', '==', id)
      .get();
    
    const allocations = [];
    for (const doc of allocationsSnapshot.docs) {
      const allocationData = doc.data();
      
      // Get lead details
      let leadDetails = null;
      if (allocationData.lead_id) {
        try {
          const leadDoc = await db.collection('crm_leads').doc(allocationData.lead_id).get();
          if (leadDoc.exists) {
            leadDetails = { id: leadDoc.id, ...leadDoc.data() };
          }
        } catch (leadError) {
          console.error('Error fetching lead details:', leadError);
        }
      }
      
      allocations.push({
        id: doc.id,
        ...allocationData,
        lead_details: leadDetails
      });
    }
    
    // Get inventory details
    const inventoryDoc = await db.collection('crm_inventory').doc(id).get();
    const inventoryData = inventoryDoc.exists ? inventoryDoc.data() : null;
    
    res.json({ 
      data: {
        inventory: { id, ...inventoryData },
        allocations: allocations
      }
    });
  } catch (error) {
    console.error('Error fetching allocations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Unallocate tickets (remove allocation)
router.delete('/:id/allocations/:allocationId', authenticateToken, checkPermission('inventory', 'write'), async (req, res) => {
  try {
    const { id, allocationId } = req.params;
    
    // Get allocation details
    const allocationDoc = await db.collection('crm_allocations').doc(allocationId).get();
    if (!allocationDoc.exists) {
      return res.status(404).json({ error: 'Allocation not found' });
    }
    
    const allocationData = allocationDoc.data();
    const ticketsToReturn = parseInt(allocationData.tickets_allocated) || 0;
    
    // Get current inventory
    const inventoryDoc = await db.collection('crm_inventory').doc(id).get();
    if (!inventoryDoc.exists) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    const inventoryData = inventoryDoc.data();
    const currentAvailable = parseInt(inventoryData.available_tickets) || 0;
    const newAvailable = currentAvailable + ticketsToReturn;
    
    // Update inventory (add tickets back)
    await db.collection('crm_inventory').doc(id).update({
      available_tickets: newAvailable,
      updated_date: new Date().toISOString()
    });
    
    // Delete allocation record
    await db.collection('crm_allocations').doc(allocationId).delete();
    
    console.log(`Unallocated ${ticketsToReturn} tickets from inventory ${id}`);
    
    res.json({ 
      success: true, 
      message: `Successfully unallocated ${ticketsToReturn} tickets`,
      tickets_returned: ticketsToReturn,
      new_available_tickets: newAvailable
    });
  } catch (error) {
    console.error('Error unallocating tickets:', error);
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
