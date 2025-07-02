const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET all payables
// Test endpoint
router.get('/test', (req, res) => res.json({ message: 'Payables router is working' }));
router.get('/', authenticateToken, async (req, res) => {
  try {
    const snapshot = await db.collection('crm_payables').get();
    const payables = [];
    snapshot.forEach(doc => {
      payables.push({ id: doc.id, ...doc.data() });
    });
    res.json({ data: payables });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Diagnostic endpoint to check all payables structure
router.get('/diagnostic', authenticateToken, async (req, res) => {
  try {
    console.log('Diagnostic endpoint called');
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
        supplierName: data.supplierName,
        created_date: data.created_date
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
    console.error('Diagnostic error:', error);
    res.status(500).json({ error: error.message });
  }
});

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

// POST create payable
router.post('/', authenticateToken, async (req, res) => {
  try {
    const payableData = {
      ...req.body,
      created_date: new Date().toISOString()
    };
    
    const docRef = await db.collection('crm_payables').add(payableData);
    res.status(201).json({ data: { id: docRef.id, ...payableData } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update payable
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const payableRef = db.collection('crm_payables').doc(id);
    const payable = await payableRef.get();
    
    if (!payable.exists) {
      return res.status(404).json({ error: 'Payable not found' });
    }
    
    const updateData = {
      ...req.body,
      updated_date: new Date().toISOString(),
      updated_by: req.user.email
    };
    
    await payableRef.update(updateData);
    
    // If marking as paid and has inventoryId, update the related inventory
    if (updateData.status === 'paid' && payable.data().inventoryId) {
      try {
        const inventoryRef = db.collection('crm_inventory').doc(payable.data().inventoryId);
        const inventory = await inventoryRef.get();
        
        if (inventory.exists) {
          const inventoryData = inventory.data();
          const currentPaid = parseFloat(inventoryData.amountPaid || 0);
          const paymentAmount = parseFloat(updateData.paymentAmount || payable.data().amount || 0);
          const newAmountPaid = currentPaid + paymentAmount;
          const totalAmount = parseFloat(inventoryData.totalPurchaseAmount || 0);
          
          await inventoryRef.update({
            amountPaid: newAmountPaid,
            paymentStatus: newAmountPaid >= totalAmount ? 'paid' : 'pending',
            updated_date: new Date().toISOString()
          });
          
          console.log(`Updated inventory ${payable.data().inventoryId} - Amount paid: ${newAmountPaid}`);
        }
      } catch (invError) {
        console.error('Error updating related inventory:', invError);
      }
    }
    
    res.json({ data: { id, ...payable.data(), ...updateData } });
  } catch (error) {
    console.error('Error updating payable:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE payable
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('crm_payables').doc(id).delete();
    res.json({ message: 'Payable deleted successfully', id });
  } catch (error) {
    console.error('Error deleting payable:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
