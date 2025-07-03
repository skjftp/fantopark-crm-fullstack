const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// Get payables for finance dashboard
router.get('/payables', authenticateToken, checkPermission('finance', 'read'), async (req, res) => {
  try {
    const snapshot = await db.collection('crm_payables')
      .where('status', 'in', ['pending', 'overdue'])
      .get();
    
    const payables = [];
    snapshot.forEach(doc => {
      payables.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({ data: payables });
  } catch (error) {
    console.error('Error fetching payables:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create payable
router.post('/payables', authenticateToken, checkPermission('finance', 'create'), async (req, res) => {
  try {
    const payableData = {
      ...req.body,
      created_date: new Date().toISOString(),
      status: req.body.status || 'pending'
    };
    
    const docRef = await db.collection('crm_payables').add(payableData);
    res.status(201).json({ data: { id: docRef.id, ...payableData } });
  } catch (error) {
    console.error('Error creating payable:', error);
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;
