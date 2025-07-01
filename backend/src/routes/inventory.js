const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const { authenticateToken } = require('../middleware/auth');

// GET all inventory
router.get('/', authenticateToken, async (req, res) => {
  try {
    const inventory = await Inventory.getAll();
    res.json({ data: inventory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single inventory item
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Inventory.getById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.json({ data: item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create inventory
router.post('/', authenticateToken, async (req, res) => {
  try {
    const inventory = new Inventory(req.body);
    const saved = await inventory.save();
    res.status(201).json({ data: saved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update inventory
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updated = await Inventory.update(req.params.id, req.body);
    res.json({ data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST allocate inventory
router.post('/:id/allocate', authenticateToken, async (req, res) => {
  try {
    const result = await Inventory.allocate(req.params.id, req.body);
    res.json({ data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE inventory
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await Inventory.delete(req.params.id);
    res.json({ data: { message: 'Inventory deleted successfully' } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// Add endpoint to get unpaid inventory for payables tracking
router.get('/unpaid', authenticateToken, checkPermission('finance', 'read'), async (req, res) => {
    try {
        const snapshot = await db.collection('crm_inventory')
            .where('paymentStatus', 'in', ['pending', 'partial'])
            .get();
        
        const unpaidInventory = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const pendingAmount = (data.totalPurchaseAmount || 0) - (data.amountPaid || 0);
            
            unpaidInventory.push({
                id: doc.id,
                ...data,
                pendingAmount: pendingAmount,
                daysOverdue: data.paymentDueDate ? 
                    Math.floor((new Date() - new Date(data.paymentDueDate)) / (1000 * 60 * 60 * 24)) : 0
            });
        });
        
        res.json({ data: unpaidInventory });
    } catch (error) {
        console.error('Error fetching unpaid inventory:', error);
        res.status(500).json({ error: 'Failed to fetch unpaid inventory' });
    }
});

// Add endpoint to update payment status
router.put('/:id/payment', authenticateToken, checkPermission('finance', 'write'), async (req, res) => {
    try {
        const { amountPaid, paymentStatus } = req.body;
        
        const docRef = db.collection('crm_inventory').doc(req.params.id);
        const doc = await docRef.get();
        
        if (!doc.exists) {
            return res.status(404).json({ error: 'Inventory not found' });
        }
        
        const currentData = doc.data();
        const totalPaid = parseFloat(currentData.amountPaid || 0) + parseFloat(amountPaid || 0);
        const totalAmount = parseFloat(currentData.totalPurchaseAmount || 0);
        
        const update = {
            amountPaid: totalPaid,
            paymentStatus: paymentStatus || (totalPaid >= totalAmount ? 'paid' : 'partial'),
            lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: req.user.uid
        };
        
        await docRef.update(update);
        
        // If fully paid, update any related payable
        if (update.paymentStatus === 'paid') {
            const payablesSnapshot = await db.collection('crm_payables')
                .where('inventoryId', '==', req.params.id)
                .where('status', '!=', 'paid')
                .get();
            
            const batch = db.batch();
            payablesSnapshot.forEach(doc => {
                batch.update(doc.ref, {
                    status: 'paid',
                    paidDate: admin.firestore.FieldValue.serverTimestamp(),
                    updatedBy: req.user.uid
                });
            });
            await batch.commit();
        }
        
        res.json({ success: true, message: 'Payment status updated successfully' });
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({ error: 'Failed to update payment status' });
    }
});
