const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { db } = require('../config/db');

// Middleware to check if user is super admin
const requireSuperAdmin = (req, res, next) => {
    if (req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }
    next();
};

// DELETE all leads
router.delete('/leads', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const leadsRef = db.collection('crm_leads');
        const snapshot = await leadsRef.get();
        
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        res.json({ message: `Deleted ${snapshot.size} leads` });
    } catch (error) {
        console.error('Delete all leads error:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE all inventory
router.delete('/inventory', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const inventoryRef = db.collection('crm_inventory');
        const snapshot = await inventoryRef.get();
        
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        res.json({ message: `Deleted ${snapshot.size} inventory items` });
    } catch (error) {
        console.error('Delete all inventory error:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE all orders
router.delete('/orders', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const ordersRef = db.collection('crm_orders');
        const snapshot = await ordersRef.get();
        
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        res.json({ message: `Deleted ${snapshot.size} orders` });
    } catch (error) {
        console.error('Delete all orders error:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE all financial data
router.delete('/financial/all', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const collections = ['crm_invoices', 'crm_receivables', 'crm_payables'];
        let totalDeleted = 0;
        
        for (const collection of collections) {
            const ref = db.collection(collection);
            const snapshot = await ref.get();
            
            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            totalDeleted += snapshot.size;
        }
        
        res.json({ message: `Deleted ${totalDeleted} financial records` });
    } catch (error) {
        console.error('Delete all financial data error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
