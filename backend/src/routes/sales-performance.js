const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET sales team performance data - OPTIMIZED VERSION
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Fetching sales performance data...');
    
    // 1. Get all users first
    const usersSnapshot = await db.collection('crm_users')
      .where('role', 'in', ['sales_person', 'sales_manager', 'sales_head'])
      .get();
    
    // Get manually added members
    let manualMemberIds = [];
    try {
      const manualMembersSnapshot = await db.collection('sales_performance_members').get();
      manualMemberIds = manualMembersSnapshot.docs.map(doc => doc.data().userId);
    } catch (err) {
      console.log('No manual members collection yet');
    }
    
    // Get user details for manually added members
    const manualUsersDocs = [];
    for (const id of manualMemberIds) {
      try {
        const doc = await db.collection('crm_users').doc(id).get();
        if (doc.exists) {
          manualUsersDocs.push(doc);
        }
      } catch (err) {
        console.log(`Failed to fetch user ${id}`);
      }
    }
    
    // Combine all users
    const allUserDocs = [...usersSnapshot.docs];
    manualUsersDocs.forEach(doc => {
      if (!allUserDocs.find(d => d.id === doc.id)) {
        allUserDocs.push(doc);
      }
    });
    
    // 2. Get ALL orders at once (more efficient)
    const allOrdersSnapshot = await db.collection(collections.orders).get();
    console.log(`Found ${allOrdersSnapshot.size} total orders`);
    
    // 3. Get ALL leads at once
    const allLeadsSnapshot = await db.collection(collections.leads).get();
    console.log(`Found ${allLeadsSnapshot.size} total leads`);
    
    // 4. Create maps for quick lookup
    const ordersByUser = new Map();
    const leadsByUser = new Map();
    
    // Map orders to users - check multiple fields to find the sales person
    allOrdersSnapshot.docs.forEach(doc => {
      const order = doc.data();
      
      // Try to find the sales person from various fields
      let salesPerson = null;
      
      // Priority 1: original_assignee field
      if (order.original_assignee) {
        salesPerson = order.original_assignee;
      }
      // Priority 2: created_by field
      else if (order.created_by) {
        salesPerson = order.created_by;
      }
      // Priority 3: sales_person field
      else if (order.sales_person) {
        salesPerson = order.sales_person;
      }
      // Priority 4: Check order history/logs if available
      else if (order.history && Array.isArray(order.history)) {
        const firstEntry = order.history[0];
        if (firstEntry && firstEntry.by) {
          salesPerson = firstEntry.by;
        }
      }
      
      if (salesPerson) {
        if (!ordersByUser.has(salesPerson)) {
          ordersByUser.set(salesPerson, []);
        }
        ordersByUser.get(salesPerson).push(order);
      }
    });
    
    // Map leads to users
    allLeadsSnapshot.docs.forEach(doc => {
      const lead = doc.data();
      const assignedTo = lead.assigned_to;
      
      if (assignedTo) {
        if (!leadsByUser.has(assignedTo)) {
          leadsByUser.set(assignedTo, []);
        }
        leadsByUser.get(assignedTo).push(lead);
      }
    });
    
    // 5. Process each user with their data
    const salesTeam = [];
    const now = new Date();
    
    for (const userDoc of allUserDocs) {
      const userData = userDoc.data();
      const userEmail = userData.email;
      
      // Get user's orders
      const userOrders = ordersByUser.get(userEmail) || [];
      console.log(`User ${userData.name} has ${userOrders.length} orders`);
      
      // Calculate metrics from orders
      let totalSales = 0;
      let actualizedSales = 0;
      let totalMargin = 0;
      let actualizedMargin = 0;
      
      userOrders.forEach(order => {
        const orderAmount = parseFloat(order.total_amount || 0);
        const quantity = parseFloat(order.quantity || 1);
        const buyingPrice = parseFloat(order.buying_price || 0);
        const sellingPrice = parseFloat(order.selling_price || 0);
        
        // Calculate margin per unit * quantity
        const margin = (sellingPrice - buyingPrice) * quantity;
        
        totalSales += orderAmount;
        totalMargin += margin;
        
        // Check if event date has passed
        if (order.event_date) {
          const eventDate = new Date(order.event_date);
          if (eventDate < now) {
            actualizedSales += orderAmount;
            actualizedMargin += margin;
          }
        }
      });
      
      // Get user's leads for pipeline
      const userLeads = leadsByUser.get(userEmail) || [];
      
      let salesPersonPipeline = 0;
      let retailPipeline = 0;
      let corporatePipeline = 0;
      
      userLeads.forEach(lead => {
        const potentialValue = parseFloat(lead.potential_value || 0);
        
        if (lead.lead_type === 'retail' || lead.client_type === 'Retail') {
          retailPipeline += potentialValue;
        } else if (lead.lead_type === 'corporate' || lead.client_type === 'Corporate') {
          corporatePipeline += potentialValue;
        } else {
          salesPersonPipeline += potentialValue;
        }
      });
      
      const overallPipeline = salesPersonPipeline + retailPipeline + corporatePipeline;
      
      // Get target
      let target = userData.sales_target || 0;
      try {
        const targetDoc = await db.collection('sales_targets').doc(userDoc.id).get();
        if (targetDoc.exists) {
          target = targetDoc.data().target;
        }
      } catch (err) {
        // Use default
      }
      
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
    
    console.log(`Returning ${salesTeam.length} team members`);
    
    res.json({
      success: true,
      salesTeam: salesTeam
    });
    
  } catch (error) {
    console.error('❌ Sales performance error:', error);
    console.error('Stack trace:', error.stack);
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
    
    // Get retail team members by department
    const retailTeamSnapshot = await db.collection('crm_users')
      .where('department', '==', 'retail')
      .get();
    
    // Get manually added retail members
    const manualRetailSnapshot = await db.collection('retail_tracker_members').get();
    const manualRetailIds = manualRetailSnapshot.docs.map(doc => doc.data().userId);
    
    // Get user details for manually added retail members
    const manualRetailPromises = manualRetailIds.map(id => 
      db.collection('crm_users').doc(id).get()
    );
    const manualRetailDocs = await Promise.all(manualRetailPromises);
    
    // Combine all retail users (avoid duplicates)
    const allRetailDocs = [...retailTeamSnapshot.docs];
    manualRetailDocs.forEach(doc => {
      if (doc.exists && !allRetailDocs.find(d => d.id === doc.id)) {
        allRetailDocs.push(doc);
      }
    });
    
    const retailData = [];
    
    for (const userDoc of allRetailDocs) {
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
    
    // Save to both user document and separate targets collection
    await db.collection('sales_targets').doc(userId).set({
      target: target * 10000000, // Convert from Crores to actual value
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.email
    });
    
    // Also update in user document if it exists
    await db.collection('crm_users').doc(userId).update({
      sales_target: target * 10000000
    }).catch(() => {
      // Ignore error if user doesn't have this field
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

// ADD sales team member manually
router.post('/add-member', authenticateToken, async (req, res) => {
  try {
    const { userId, type } = req.body;
    
    if (type === 'sales') {
      // Add to sales_performance_members collection
      await db.collection('sales_performance_members').doc(userId).set({
        userId: userId,
        type: 'sales',
        addedAt: new Date().toISOString(),
        addedBy: req.user.email
      });
    } else if (type === 'retail') {
      // Add to retail_tracker_members collection
      await db.collection('retail_tracker_members').doc(userId).set({
        userId: userId,
        type: 'retail',
        addedAt: new Date().toISOString(),
        addedBy: req.user.email
      });
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Add member error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// REMOVE member
router.delete('/remove-member/:userId/:type', authenticateToken, async (req, res) => {
  try {
    const { userId, type } = req.params;
    
    if (type === 'sales') {
      await db.collection('sales_performance_members').doc(userId).delete();
    } else if (type === 'retail') {
      await db.collection('retail_tracker_members').doc(userId).delete();
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Remove member error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
