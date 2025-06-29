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
    res.json(orders);
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
    res.status(201).json({ id: docRef.id, ...orderData });
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
    res.json({ id: req.params.id, ...updates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
