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
    const snapshot = await db.collection(collections.orders)
      .orderBy('created_date', 'desc')
      .get();
    const orders = [];
    snapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    res.json({ data: orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create order
router.post('/', authenticateToken, async (req, res) => {
  try {
    let orderData = {
      ...req.body,
      status: req.body.status || 'pending_approval',
      created_by: req.user.name,
      created_date: new Date().toISOString()
    };
    
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
    
    const docRef = await db.collection(collections.orders).add(orderData);
    
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
    
    res.status(201).json({ data: { id: docRef.id, ...orderData } });
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
    
    // If updating payment/currency fields, ensure INR equivalents are updated
    if (updates.payment_currency || updates.exchange_rate || updates.advance_amount || updates.final_amount) {
      updates = ensureCurrencyFields(updates);
    }
    
    await db.collection(collections.orders).doc(req.params.id).update(updates);
    res.json({ data: { id: req.params.id, ...updates } });
  } catch (error) {
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
    
    if (req.headers['x-delete-all'] !== 'true' || req.headers['x-test-mode'] !== 'true') {
      return res.status(403).json({ error: 'Bulk delete requires test mode headers' });
    }
    
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

module.exports = router;
