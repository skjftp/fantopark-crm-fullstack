const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { authenticateToken, checkPermission } = require('../middleware/auth');
const admin = require('../config/firebase');

// Get all payables
router.get('/', authenticateToken, checkPermission('finance', 'read'), async (req, res) => {
  try {
    const snapshot = await db.collection('crm_payables').get();
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

// Create a new payable
router.post('/', authenticateToken, checkPermission('finance', 'create'), async (req, res) => {
  try {
    const payableData = {
      ...req.body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: req.user.id,
      status: req.body.status || 'pending'
    };
    
    const docRef = await db.collection('crm_payables').add(payableData);
    
    res.status(201).json({
      data: {
        id: docRef.id,
        ...payableData
      }
    });
  } catch (error) {
    console.error('Error creating payable:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update payable
router.put('/:id', authenticateToken, checkPermission('finance', 'update'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: req.user.id
    };
    
    await db.collection('crm_payables').doc(id).update(updateData);
    
    res.json({ data: { id, ...updateData } });
  } catch (error) {
    console.error('Error updating payable:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete payable
router.delete('/:id', authenticateToken, checkPermission('finance', 'delete'), async (req, res) => {
  try {
    await db.collection('crm_payables').doc(req.params.id).delete();
    res.json({ data: { message: 'Payable deleted successfully' } });
  } catch (error) {
    console.error('Error deleting payable:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// GET payables by inventory ID (for debugging)
router.get('/by-inventory/:inventoryId', authenticateToken, async (req, res) => {
  try {
    const { inventoryId } = req.params;
    console.log('Searching payables for inventory:', inventoryId);
    
    const snapshot = await db.collection('crm_payables')
      .where('inventoryId', '==', inventoryId)
      .get();
    
    const payables = [];
    snapshot.forEach(doc => {
      payables.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`Found ${payables.length} payables for inventory ${inventoryId}`);
    res.json({ data: payables });
  } catch (error) {
    console.error('Error fetching payables by inventory:', error);
    res.status(500).json({ error: error.message });
  }
});

// Diagnostic endpoint to check all payables structure
router.get('/diagnostic', authenticateToken, async (req, res) => {
  try {
    const snapshot = await db.collection('crm_payables').get();
    const payables = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      payables.push({
        id: doc.id,
        hasInventoryId: !!data.inventoryId,
        inventoryId: data.inventoryId || 'NOT SET',
        amount: data.amount,
        status: data.status,
        supplierName: data.supplierName
      });
    });
    
    const summary = {
      total: payables.length,
      withInventoryId: payables.filter(p => p.hasInventoryId).length,
      withoutInventoryId: payables.filter(p => !p.hasInventoryId).length,
      payables: payables
    };
    
    console.log('Payables diagnostic:', summary);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
