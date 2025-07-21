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

// DELETE delivery
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    console.log('DELETE request for delivery:', req.params.id);
    
    // Check if delivery exists
    const doc = await db.collection(collections.deliveries).doc(req.params.id).get();
    if (!doc.exists) {
      console.log('Delivery not found:', req.params.id);
      return res.status(404).json({ error: 'Delivery not found' });
    }
    
    // Delete the delivery
    await db.collection(collections.deliveries).doc(req.params.id).delete();
    console.log('Delivery deleted successfully:', req.params.id);
    
    res.json({ message: 'Delivery deleted successfully' });
  } catch (error) {
    console.error('DELETE delivery error:', error);
    res.status(500).json({ error: error.message });
  }
});


// DELETE all deliveries (bulk delete for test mode)
router.delete('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can perform bulk delete' });
    }
    
    // Bulk delete is disabled
    return res.status(403).json({ error: 'Bulk delete functionality has been disabled' });
    
    const snapshot = await db.collection(collections.deliveries).get();
    
    if (snapshot.empty) {
      return res.json({ message: 'No deliveries to delete', count: 0 });
    }
    
    const batch = db.batch();
    let count = 0;
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });
    
    await batch.commit();
    
    res.json({ 
      message: `Successfully deleted ${count} deliveries`,
      count: count 
    });
  } catch (error) {
    console.error('Bulk delete deliveries error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
