const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET sales team performance data
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Fetching sales performance data...');
    
    // Get all sales team users
    const usersSnapshot = await db.collection('crm_users')
      .where('role', 'in', ['sales_person', 'sales_manager', 'sales_head'])
      .get();
    
    const salesTeam = [];
    
    // For each sales person, calculate their metrics
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userEmail = userData.email;
      
      // Get orders assigned to this user
      const ordersSnapshot = await db.collection(collections.orders)
        .where('assigned_to', '==', userEmail)
        .get();
      
      // Calculate metrics
      let totalSales = 0;
      let actualizedSales = 0;
      let totalMargin = 0;
      let actualizedMargin = 0;
      
      const now = new Date();
      
      ordersSnapshot.docs.forEach(doc => {
        const order = doc.data();
        const orderAmount = parseFloat(order.total_amount || 0);
        const buyingPrice = parseFloat(order.buying_price || 0);
        const sellingPrice = parseFloat(order.selling_price || 0);
        const margin = sellingPrice - buyingPrice;
        
        // Add to total sales
        totalSales += orderAmount;
        totalMargin += margin;
        
        // Check if event date has passed for actualized sales
        if (order.event_date) {
          const eventDate = new Date(order.event_date);
          if (eventDate < now) {
            actualizedSales += orderAmount;
            actualizedMargin += margin;
          }
        }
      });
      
      // Get pipeline data (leads assigned to this user)
      const leadsSnapshot = await db.collection(collections.leads)
        .where('assigned_to', '==', userEmail)
        .get();
      
      let salesPersonPipeline = 0;
      let retailPipeline = 0;
      let corporatePipeline = 0;
      
      leadsSnapshot.docs.forEach(doc => {
        const lead = doc.data();
        const potentialValue = parseFloat(lead.potential_value || 0);
        
        // Add to pipeline based on lead type or status
        if (lead.lead_type === 'retail') {
          retailPipeline += potentialValue;
        } else if (lead.lead_type === 'corporate') {
          corporatePipeline += potentialValue;
        } else {
          salesPersonPipeline += potentialValue;
        }
      });
      
      const overallPipeline = salesPersonPipeline + retailPipeline + corporatePipeline;
      
      // Get target (you might want to store this in a separate collection)
      const target = userData.sales_target || 0;
      
      salesTeam.push({
        id: userDoc.id,
        name: userData.name,
        email: userEmail,
        target: target / 10000000, // Convert to Crores
        totalSales: totalSales / 10000000,
        actualizedSales: actualizedSales / 10000000,
        totalMargin: totalMargin / 10000000,
        actualizedMargin: actualizedMargin / 10000000,
        salesPersonPipeline: salesPersonPipeline / 10000000,
        retailPipeline: retailPipeline / 10000000,
        corporatePipeline: corporatePipeline / 10000000,
        overallPipeline: overallPipeline / 10000000
      });
    }
    
    res.json({
      success: true,
      salesTeam: salesTeam
    });
    
  } catch (error) {
    console.error('❌ Sales performance error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET retail tracker data
router.get('/retail-tracker', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    // Get retail team members
    const retailTeam = await db.collection('crm_users')
      .where('department', '==', 'retail')
      .get();
    
    const retailData = [];
    
    for (const userDoc of retailTeam.docs) {
      const userData = userDoc.data();
      const userEmail = userData.email;
      
      // Build date query
      let leadsQuery = db.collection(collections.leads)
        .where('assigned_to', '==', userEmail);
      
      if (start_date && end_date) {
        leadsQuery = leadsQuery
          .where('created_date', '>=', start_date)
          .where('created_date', '<=', end_date);
      }
      
      const leadsSnapshot = await leadsQuery.get();
      
      // Calculate metrics
      const metrics = {
        assigned: leadsSnapshot.size,
        touchbased: 0,
        qualified: 0,
        hotWarm: 0,
        converted: 0,
        notTouchbased: 0
      };
      
      leadsSnapshot.docs.forEach(doc => {
        const lead = doc.data();
        
        if (lead.last_contact_date) metrics.touchbased++;
        if (lead.status === 'qualified') metrics.qualified++;
        if (lead.temperature === 'hot' || lead.temperature === 'warm') metrics.hotWarm++;
        if (lead.status === 'converted' || lead.status === 'won') metrics.converted++;
        if (!lead.last_contact_date) metrics.notTouchbased++;
      });
      
      retailData.push({
        id: userDoc.id,
        salesMember: userData.name,
        ...metrics
      });
    }
    
    res.json({
      success: true,
      retailData: retailData
    });
    
  } catch (error) {
    console.error('❌ Retail tracker error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// UPDATE sales target
router.put('/target/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { target } = req.body;
    
    await db.collection('crm_users').doc(userId).update({
      sales_target: target * 10000000 // Convert from Crores to actual value
    });
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Update target error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
