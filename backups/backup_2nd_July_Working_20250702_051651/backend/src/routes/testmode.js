const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/firebase');
const { authenticateToken } = require('../middleware/auth');

// Middleware to check if user is super_admin and test mode is enabled
const checkTestMode = (req, res, next) => {
    if (req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Only super admins can use test mode' });
    }
    
    if (req.headers['x-test-mode'] !== 'true') {
        return res.status(403).json({ error: 'Test mode is not enabled' });
    }
    
    next();
};

// DELETE all leads
router.delete('/leads', authenticateToken, checkTestMode, async (req, res) => {
    try {
        const snapshot = await db.collection(collections.leads).get();
        const batch = db.batch();
        
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        
        res.json({ 
            message: `Deleted ${snapshot.size} leads`,
            count: snapshot.size 
        });
    } catch (error) {
        console.error('Delete all leads error:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE all inventory
router.delete('/inventory', authenticateToken, checkTestMode, async (req, res) => {
    try {
        const snapshot = await db.collection(collections.inventory).get();
        const batch = db.batch();
        
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        
        res.json({ 
            message: `Deleted ${snapshot.size} inventory items`,
            count: snapshot.size 
        });
    } catch (error) {
        console.error('Delete all inventory error:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE all orders
router.delete('/orders', authenticateToken, checkTestMode, async (req, res) => {
    try {
        const snapshot = await db.collection(collections.orders).get();
        const batch = db.batch();
        
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        
        res.json({ 
            message: `Deleted ${snapshot.size} orders`,
            count: snapshot.size 
        });
    } catch (error) {
        console.error('Delete all orders error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
