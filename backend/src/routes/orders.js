const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

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
    const orderData = {
      ...req.body,
      status: req.body.status || 'pending_approval',
      created_by: req.user.name,
      created_date: new Date().toISOString()
    };
    
    const docRef = await db.collection(collections.orders).add(orderData);
    res.status(201).json({ data: { id: docRef.id, ...orderData } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update order
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updates = {
      ...req.body,
      updated_date: new Date().toISOString()
    };
    
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

module.exports = router;
