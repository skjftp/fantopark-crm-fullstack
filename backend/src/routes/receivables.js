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
    res.json({ data: receivables });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single receivable
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const doc = await db.collection(collections.receivables).doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Receivable not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
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
    res.status(201).json({ data: { id: docRef.id, ...receivableData } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update receivable
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updated_date: new Date().toISOString()
    };
    
    await db.collection(collections.receivables).doc(id).update(updateData);
    res.json({ id, ...updateData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT record payment for receivable
router.put('/record-payment/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_amount, payment_date, payment_mode, transaction_id } = req.body;
    
    const receivableRef = db.collection(collections.receivables).doc(id);
    const receivable = await receivableRef.get();
    
    if (!receivable.exists) {
      return res.status(404).json({ error: 'Receivable not found' });
    }
    
    const data = receivable.data();
    const updateData = {
      status: 'paid',
      payment_amount: payment_amount || data.expected_amount,
      payment_date: payment_date || new Date().toISOString(),
      payment_mode: payment_mode || 'bank_transfer',
      transaction_id: transaction_id || '',
      updated_at: new Date().toISOString(),
      updated_by: req.user.email
    };
    
    await receivableRef.update(updateData);
    
    // Update the related order if exists
    if (data.order_id) {
      await db.collection('crm_orders').doc(data.order_id).update({
        payment_status: 'paid',
        status: 'completed',
        payment_date: updateData.payment_date
      });
    }
    
    res.json({ id, ...data, ...updateData });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// DELETE receivable
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Attempting to delete receivable: ${id}`);
    
    // Check if receivable exists
    const receivableRef = db.collection(collections.receivables).doc(id);
    const receivable = await receivableRef.get();
    
    if (!receivable.exists) {
      console.log(`Receivable not found: ${id}`);
      return res.status(404).json({ error: 'Receivable not found' });
    }
    
    // Delete the receivable
    await receivableRef.delete();
    
    console.log(`Successfully deleted receivable: ${id}`);
    res.json({ message: 'Receivable deleted successfully', id });
  } catch (error) {
    console.error('Error deleting receivable:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
