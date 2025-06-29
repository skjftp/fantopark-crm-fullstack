const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET dashboard stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Get counts from all collections
    const [leads, inventory, orders, receivables] = await Promise.all([
      db.collection(collections.leads).get(),
      db.collection(collections.inventory).get(),
      db.collection(collections.orders).get(),
      db.collection(collections.receivables).get()
    ]);
    
    // Calculate stats
    const stats = {
      totalLeads: leads.size,
      activeDeals: leads.docs.filter(doc => 
        ['qualified', 'hot', 'warm'].includes(doc.data().status)
      ).length,
      totalInventory: inventory.size,
      pendingOrders: orders.docs.filter(doc => 
        doc.data().status === 'pending_approval'
      ).length,
      totalReceivables: receivables.docs.reduce((sum, doc) => 
        sum + (doc.data().amount || 0), 0
      ),
      thisMonthRevenue: 0 // Calculate based on your logic
    };
    
    res.json({ data: stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
