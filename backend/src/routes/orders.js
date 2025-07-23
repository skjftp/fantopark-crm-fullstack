const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

/**
 * Ensures all currency fields are properly set with INR equivalents
 * @param {Object} orderData - The order data from frontend
 * @returns {Object} - Order data with INR fields populated
 */
function ensureCurrencyFields(orderData) {
  const currency = orderData.payment_currency || 'INR';
  const exchangeRate = orderData.exchange_rate || 1;
  
  // If currency is INR, ensure exchange rate is 1
  if (currency === 'INR') {
    orderData.exchange_rate = 1;
  }
  
  // Calculate INR equivalents
  const invoiceTotal = orderData.invoice_total || 0;
  const advanceAmount = parseFloat(orderData.advance_amount) || 0;
  const serviceFeeAmount = parseFloat(orderData.service_fee_amount) || 0;
  
  // Add INR fields
  orderData.inr_equivalent = currency === 'INR' ? invoiceTotal : invoiceTotal * exchangeRate;
  orderData.advance_amount_inr = currency === 'INR' ? advanceAmount : advanceAmount * exchangeRate;
  orderData.service_fee_amount_inr = currency === 'INR' ? serviceFeeAmount : serviceFeeAmount * exchangeRate;
  
  // Add conversion date if not present
  if (!orderData.conversion_date && currency !== 'INR') {
    orderData.conversion_date = new Date().toISOString();
  }
  
  // Calculate tax amounts in INR
  if (orderData.gst_amount) {
    orderData.gst_amount_inr = currency === 'INR' ? orderData.gst_amount : orderData.gst_amount * exchangeRate;
  }
  
  if (orderData.tcs_amount) {
    orderData.tcs_amount_inr = currency === 'INR' ? orderData.tcs_amount : orderData.tcs_amount * exchangeRate;
  }
  
  // Calculate final amount in INR
  if (orderData.final_amount) {
    orderData.final_amount_inr = currency === 'INR' ? orderData.final_amount : orderData.final_amount * exchangeRate;
  }
  
  return orderData;
}

// GET all orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Extract date filters from query parameters
    const { from_date, to_date } = req.query;
    
    let query = db.collection(collections.orders);
    
    // Apply date filters if provided
    if (from_date || to_date) {
      // Filter by event_date when date parameters are provided
      query = query.orderBy('event_date', 'asc');
      
      if (from_date) {
        // Convert from_date to ISO string format for comparison
        const fromDateISO = new Date(from_date).toISOString();
        query = query.where('event_date', '>=', fromDateISO);
        console.log('Filtering orders with event_date from:', fromDateISO);
      }
      
      if (to_date) {
        // Add 1 day to to_date to include the entire day
        const toDateEnd = new Date(to_date);
        toDateEnd.setDate(toDateEnd.getDate() + 1);
        const toDateISO = toDateEnd.toISOString();
        query = query.where('event_date', '<', toDateISO);
        console.log('Filtering orders with event_date to:', toDateISO);
      }
    } else {
      // No date filters, use default ordering by created_date
      query = query.orderBy('created_date', 'desc');
    }
    
    const snapshot = await query.get();
    const orders = [];
    snapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    
    // console.log(`Returning ${orders.length} orders with event_date filters:`, { from_date, to_date });
    res.json({ data: orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST create order
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('📥 Raw request body:', JSON.stringify(req.body, null, 2));
    console.log('📥 customer_type from request:', req.body.customer_type);
    
    let orderData = {
      ...req.body,
      status: req.body.status || 'pending_approval',
      created_by: req.user.name,
      sales_person: req.body.sales_person || req.user.email, // Add this line
      created_date: new Date().toISOString(),
      // Initialize buying price fields
      buying_price: parseFloat(req.body.buying_price) || 0,
      buying_price_inclusions: parseFloat(req.body.buying_price_inclusions) || 0,
      total_allocated_tickets: 0,
      // Explicitly include customer classification fields
      customer_type: (() => {
        const ct = req.body.customer_type;
        console.log('🔍 Customer type value check:', { 
          value: ct, 
          type: typeof ct, 
          truthiness: !!ct,
          defaulting: !ct ? 'YES' : 'NO'
        });
        return ct || 'indian';
      })(),
      event_location: req.body.event_location || 'india',
      payment_currency: req.body.payment_currency || 'INR'
    };
    
    // Look up inventory_id (event_id) if event_name is provided
    if (orderData.event_name && !orderData.event_id) {
      try {
        const inventorySnapshot = await db.collection('crm_inventory')
          .where('event_name', '==', orderData.event_name)
          .limit(1)
          .get();
        
        if (!inventorySnapshot.empty) {
          orderData.event_id = inventorySnapshot.docs[0].id;
          orderData.inventory_id = inventorySnapshot.docs[0].id; // Also store as inventory_id for clarity
          console.log(`Found inventory_id ${orderData.event_id} for event_name: ${orderData.event_name}`);
        } else {
          console.log(`No inventory found with event_name: ${orderData.event_name}`);
        }
      } catch (error) {
        console.error('Error looking up inventory_id:', error);
        // Continue without event_id if lookup fails
      }
    }
    
    // Ensure currency fields are properly set
    orderData = ensureCurrencyFields(orderData);
    
    // Generate order number if not provided
    if (!orderData.order_number) {
      const timestamp = Date.now();
      orderData.order_number = `ORD-${timestamp}`;
    }
    
    console.log('Creating order with currency support:', {
      currency: orderData.payment_currency,
      exchange_rate: orderData.exchange_rate,
      inr_equivalent: orderData.inr_equivalent,
      advance_amount_inr: orderData.advance_amount_inr
    });
    
    console.log('🔍 Customer classification fields:', {
      customer_type: orderData.customer_type,
      event_location: orderData.event_location,
      payment_currency: orderData.payment_currency
    });
    
    // Log the exact data being saved
    console.log('📤 Order data being saved to Firebase:', JSON.stringify({
      customer_type: orderData.customer_type,
      event_location: orderData.event_location,
      payment_currency: orderData.payment_currency
    }, null, 2));
    
    const docRef = await db.collection(collections.orders).add(orderData);
    
    // Fetch the created document to ensure we have all fields
    const createdDoc = await docRef.get();
    const createdOrder = { id: docRef.id, ...createdDoc.data() };
    
    console.log('✅ Order created with customer_type:', createdOrder.customer_type);
    console.log('📥 Order retrieved from Firebase:', JSON.stringify({
      customer_type: createdOrder.customer_type,
      event_location: createdOrder.event_location,
      payment_currency: createdOrder.payment_currency
    }, null, 2));
    
    // Create receivable if needed (using INR amounts)
    if (orderData.payment_post_service || orderData.lead_status === 'payment_post_service') {
      const receivableAmount = (orderData.final_amount_inr || orderData.final_amount) - (orderData.advance_amount_inr || 0);
      
      if (receivableAmount > 0) {
        const receivableData = {
          order_id: docRef.id,
          order_number: orderData.order_number,
          client_name: orderData.client_name,
          client_email: orderData.client_email,
          client_phone: orderData.client_phone,
          amount: receivableAmount, // Always in INR
          payment_currency: 'INR', // Receivables are always tracked in INR
          status: 'pending',
          created_date: new Date().toISOString(),
          due_date: orderData.expected_payment_date || null,
          notes: `Post-service payment for order ${orderData.order_number}`
        };
        
        await db.collection(collections.receivables).add(receivableData);
        console.log('Receivable created for amount (INR):', receivableAmount);
      }
    }
    
    res.status(201).json({ data: createdOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update order
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    let updates = {
      ...req.body,
      updated_date: new Date().toISOString()
    };
    
    // Explicitly ensure customer classification fields are included if provided
    console.log('🔍 UPDATE route - customer_type from request:', req.body.customer_type);
    console.log('🔍 UPDATE route - full request body:', JSON.stringify(req.body, null, 2));
    
    if (req.body.customer_type !== undefined) {
      updates.customer_type = req.body.customer_type;
      console.log('✅ Setting customer_type in updates:', updates.customer_type);
    }
    if (req.body.event_location !== undefined) {
      updates.event_location = req.body.event_location;
    }
    if (req.body.payment_currency !== undefined) {
      updates.payment_currency = req.body.payment_currency;
    }
    
    // Look up inventory_id (event_id) if event_name is provided and event_id is not
    if (updates.event_name && !updates.event_id) {
      try {
        const inventorySnapshot = await db.collection('crm_inventory')
          .where('event_name', '==', updates.event_name)
          .limit(1)
          .get();
        
        if (!inventorySnapshot.empty) {
          updates.event_id = inventorySnapshot.docs[0].id;
          updates.inventory_id = inventorySnapshot.docs[0].id; // Also store as inventory_id for clarity
          console.log(`Found inventory_id ${updates.event_id} for event_name: ${updates.event_name}`);
        }
      } catch (error) {
        console.error('Error looking up inventory_id:', error);
        // Continue without event_id if lookup fails
      }
    }
    
    // If updating payment/currency fields, ensure INR equivalents are updated
    if (updates.payment_currency || updates.exchange_rate || updates.advance_amount || updates.final_amount) {
      updates = ensureCurrencyFields(updates);
    }
    
    console.log('Updating order with customer_type:', updates.customer_type);
    
    await db.collection(collections.orders).doc(req.params.id).update(updates);
    
    // Fetch the updated document to return the complete data
    const updatedDoc = await db.collection(collections.orders).doc(req.params.id).get();
    const updatedData = { id: req.params.id, ...updatedDoc.data() };
    
    res.json({ data: updatedData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update only sales_person field
router.put('/:id/sales-person', authenticateToken, async (req, res) => {
  try {
    // Check permissions - only admin/managers can update sales_person
    if (!['super_admin', 'finance_manager', 'sales_manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only admin and managers can update sales person' });
    }
    
    const { sales_person } = req.body;
    
    if (!sales_person || !sales_person.trim()) {
      return res.status(400).json({ error: 'Sales person email is required' });
    }
    
    // Check if order exists
    const orderDoc = await db.collection(collections.orders).doc(req.params.id).get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const currentOrder = orderDoc.data();
    
    // Update only the sales_person field
    const updateData = {
      sales_person: sales_person.trim(),
      updated_date: new Date().toISOString(),
      updated_by: req.user.email
    };
    
    await db.collection(collections.orders).doc(req.params.id).update(updateData);
    
    // Log the change
    console.log(`Sales person updated for order ${req.params.id}: ${currentOrder.sales_person || 'none'} → ${sales_person} by ${req.user.email}`);
    
    res.json({ 
      data: { 
        id: req.params.id, 
        sales_person: sales_person.trim(),
        previous_sales_person: currentOrder.sales_person || null,
        updated_by: req.user.email,
        updated_date: updateData.updated_date
      } 
    });
    
  } catch (error) {
    console.error('Error updating sales person:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE order
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if order exists
    const orderDoc = await db.collection(collections.orders).doc(req.params.id).get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Delete the order
    await db.collection(collections.orders).doc(req.params.id).delete();
    
    res.json({ data: { message: 'Order deleted successfully' } });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: error.message });
  }
});


// DELETE all orders (bulk delete for test mode)
router.delete('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can perform bulk delete' });
    }
    
    // Bulk delete is disabled
    return res.status(403).json({ error: 'Bulk delete functionality has been disabled' });
    
    const snapshot = await db.collection(collections.orders).get();
    
    if (snapshot.empty) {
      return res.json({ message: 'No orders to delete', count: 0 });
    }
    
    const batch = db.batch();
    let count = 0;
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });
    
    await batch.commit();
    
    res.json({ 
      message: `Successfully deleted ${count} orders`,
      count: count 
    });
  } catch (error) {
    console.error('Bulk delete orders error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Auto-update order status based on event date
router.get('/update-status-by-date', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const snapshot = await db.collection(collections.orders)
      .where('status', '==', 'approved')
      .get();
    
    const batch = db.batch();
    let updatedCount = 0;
    
    snapshot.forEach(doc => {
      const order = doc.data();
      const eventDate = new Date(order.event_date);
      eventDate.setHours(0, 0, 0, 0);
      
      if (eventDate < today) {
        batch.update(doc.ref, {
          status: 'completed',
          completed_date: new Date().toISOString(),
          completed_reason: 'Event date passed'
        });
        updatedCount++;
      }
    });
    
    if (updatedCount > 0) {
      await batch.commit();
    }
    
    res.json({ 
      success: true, 
      message: `Updated ${updatedCount} orders to completed status` 
    });
    
  } catch (error) {
    console.error('Error updating order statuses:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bulk update finance invoice numbers via CSV
router.post('/update-finance-invoices', authenticateToken, async (req, res) => {
  try {
    // Check if user has permission (super_admin or finance_manager)
    if (req.user.role !== 'super_admin' && req.user.role !== 'finance_manager') {
      return res.status(403).json({ 
        error: 'Only super admins and finance managers can update finance invoice numbers' 
      });
    }
    
    const { updates } = req.body;
    
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    
    const batch = db.batch();
    let updatedCount = 0;
    const errors = [];
    
    // Process each update
    for (const update of updates) {
      const { order_id, finance_invoice_number } = update;
      
      if (!order_id || !finance_invoice_number) {
        errors.push(`Invalid update: missing order_id or finance_invoice_number`);
        continue;
      }
      
      try {
        // Check if order exists
        const orderRef = db.collection(collections.orders).doc(order_id);
        const orderDoc = await orderRef.get();
        
        if (!orderDoc.exists) {
          errors.push(`Order ${order_id} not found`);
          continue;
        }
        
        // Update the finance invoice number
        batch.update(orderRef, {
          finance_invoice_number: finance_invoice_number.trim(),
          finance_invoice_updated_date: new Date().toISOString(),
          finance_invoice_updated_by: req.user.email
        });
        
        updatedCount++;
        
      } catch (error) {
        errors.push(`Error updating order ${order_id}: ${error.message}`);
      }
    }
    
    // Commit the batch update
    if (updatedCount > 0) {
      await batch.commit();
      console.log(`Finance invoice numbers updated: ${updatedCount} orders by ${req.user.email}`);
    }
    
    res.json({ 
      success: true,
      updated: updatedCount,
      total: updates.length,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error updating finance invoice numbers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bulk update event_id and event_date for all orders
router.post('/bulk-update-event-ids', authenticateToken, async (req, res) => {
  try {
    // Check if user has permission (super_admin or finance_manager)
    if (req.user.role !== 'super_admin' && req.user.role !== 'finance_manager') {
      return res.status(403).json({ 
        error: 'Only super admins and finance managers can perform bulk updates' 
      });
    }
    
    console.log('Starting bulk update of event IDs...');
    
    // Get all orders
    const ordersSnapshot = await db.collection(collections.orders).get();
    
    // Get all inventory items and create a map for quick lookup
    const inventorySnapshot = await db.collection('crm_inventory').get();
    const inventoryMap = new Map();
    const duplicateInventory = new Map();
    
    inventorySnapshot.forEach(doc => {
      const inventory = doc.data();
      const eventName = inventory.event_name;
      
      if (inventoryMap.has(eventName)) {
        // Track duplicates
        if (!duplicateInventory.has(eventName)) {
          duplicateInventory.set(eventName, [inventoryMap.get(eventName)]);
        }
        duplicateInventory.get(eventName).push({
          id: doc.id,
          event_date: inventory.event_date,
          created_date: inventory.created_date
        });
      } else {
        inventoryMap.set(eventName, {
          id: doc.id,
          event_date: inventory.event_date,
          created_date: inventory.created_date
        });
      }
    });
    
    console.log(`Found ${inventoryMap.size} unique event names in inventory`);
    if (duplicateInventory.size > 0) {
      console.log(`Warning: Found ${duplicateInventory.size} event names with multiple inventory items`);
      duplicateInventory.forEach((items, name) => {
        console.log(`  - "${name}" has ${items.length} inventory entries`);
      });
    }
    
    const batch = db.batch();
    let updateCount = 0;
    let skipCount = 0;
    let noMatchCount = 0;
    const errors = [];
    
    // Process each order
    ordersSnapshot.forEach(doc => {
      const order = doc.data();
      
      // Skip if order already has event_id (check for empty strings too)
      if (order.event_id && order.event_id.trim() !== '') {
        skipCount++;
        return;
      }
      
      // Skip if no event_name
      if (!order.event_name) {
        noMatchCount++;
        return;
      }
      
      // Look up inventory by event name
      let inventoryData = inventoryMap.get(order.event_name);
      
      // Handle duplicates - use the most recent inventory
      if (!inventoryData && duplicateInventory.has(order.event_name)) {
        const duplicates = duplicateInventory.get(order.event_name);
        // Sort by created_date descending and pick the most recent
        duplicates.sort((a, b) => {
          const dateA = new Date(a.created_date || '1900-01-01');
          const dateB = new Date(b.created_date || '1900-01-01');
          return dateB - dateA;
        });
        inventoryData = duplicates[0];
        console.log(`Using most recent inventory for duplicate "${order.event_name}": ${inventoryData.id}`);
      }
      
      if (inventoryData) {
        // Update order with inventory_id (as event_id) and event_date
        batch.update(doc.ref, {
          event_id: inventoryData.id,
          inventory_id: inventoryData.id, // Also store as inventory_id for clarity
          event_date: inventoryData.event_date || order.event_date,
          event_id_updated_date: new Date().toISOString(),
          event_id_updated_by: req.user.email
        });
        updateCount++;
      } else {
        noMatchCount++;
        console.log(`No inventory found for order ${doc.id} with event_name: ${order.event_name}`);
      }
    });
    
    // Commit the batch update
    if (updateCount > 0) {
      await batch.commit();
      console.log(`Bulk update completed: ${updateCount} orders updated`);
    }
    
    res.json({
      success: true,
      totalProcessed: ordersSnapshot.size,
      updated: updateCount,
      skipped: skipCount,
      noMatch: noMatchCount,
      duplicateInventoryNames: duplicateInventory.size,
      message: `Successfully updated ${updateCount} orders with inventory IDs`,
      duplicates: duplicateInventory.size > 0 ? Array.from(duplicateInventory.entries()).map(([name, items]) => ({
        eventName: name,
        count: items.length,
        note: 'Used most recent inventory for matching'
      })) : undefined,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error in bulk update:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
