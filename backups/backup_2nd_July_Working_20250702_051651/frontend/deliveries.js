const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET all deliveries
router.get('/', authenticateToken, async (req, res) => {
  try {
    const snapshot = await db.collection(collections.deliveries)
      .orderBy('created_date', 'desc')
      .get();
    const deliveries = [];
    snapshot.forEach(doc => {
      deliveries.push({ id: doc.id, ...doc.data() });
    });
    res.json({ data: deliveries });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create delivery
router.post('/', authenticateToken, async (req, res) => {
  try {
    const deliveryData = {
      ...req.body,
      status: 'pending',
      created_date: new Date().toISOString()
    };
    
    const docRef = await db.collection(collections.deliveries).add(deliveryData);
    res.status(201).json({ data: { id: docRef.id, ...deliveryData } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update delivery status
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updates = {
      ...req.body,
      updated_date: new Date().toISOString()
    };
    
    await db.collection(collections.deliveries).doc(req.params.id).update(updates);
    res.json({ data: { id: req.params.id, ...updates } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
