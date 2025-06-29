const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET all invoices
router.get('/', authenticateToken, async (req, res) => {
  try {
    const snapshot = await db.collection(collections.invoices)
      .orderBy('created_date', 'desc')
      .get();
    const invoices = [];
    snapshot.forEach(doc => {
      invoices.push({ id: doc.id, ...doc.data() });
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create invoice
router.post('/', authenticateToken, async (req, res) => {
  try {
    const invoiceData = {
      ...req.body,
      invoice_number: `INV-${Date.now()}`,
      created_date: new Date().toISOString()
    };
    
    const docRef = await db.collection(collections.invoices).add(invoiceData);
    res.status(201).json({ id: docRef.id, ...invoiceData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
