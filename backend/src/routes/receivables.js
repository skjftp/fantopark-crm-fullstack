const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET all receivables
router.get('/', authenticateToken, async (req, res) => {
  try {
    const snapshot = await db.collection(collections.receivables).get();
    const receivables = [];
    snapshot.forEach(doc => {
      receivables.push({ id: doc.id, ...doc.data() });
    });
    res.json(receivables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create receivable
router.post('/', authenticateToken, async (req, res) => {
  try {
    const receivableData = {
      ...req.body,
      created_date: new Date().toISOString()
    };
    
    const docRef = await db.collection(collections.receivables).add(receivableData);
    res.status(201).json({ id: docRef.id, ...receivableData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
