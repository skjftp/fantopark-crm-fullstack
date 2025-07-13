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

// ===============================================
// ADD TO YOUR EXISTING BACKEND ROUTES FILE
// Add this to routes/dashboard.js OR routes/leads.js
// ===============================================

// If you have a routes/dashboard.js file, add this:
router.get('/dashboard/charts', async (req, res) => {
  try {
    const { filter_type, sales_person_id, event_name } = req.query;
    
    console.log('📊 Dashboard charts API called with filters:', { filter_type, sales_person_id, event_name });
    
    // Build query for Firestore
    let query = db.collection('crm_leads');
    
    // Apply filters based on frontend selection
    if (filter_type === 'salesPerson' && sales_person_id) {
      // Map user ID to email for filtering
      const userDoc = await db.collection('crm_users').doc(sales_person_id).get();
      if (userDoc.exists) {
        const userEmail = userDoc.data().email;
        query = query.where('assigned_to', '==', userEmail);
      }
    } else if (filter_type === 'event' && event_name) {
      query = query.where('lead_for_event', '==', event_name);
    }
    
    // Fetch leads with only necessary fields for performance
    const snapshot = await query.select('status', 'temperature', 'potential_value').get();
    
    console.log(`📊 Processing ${snapshot.size} leads for charts`);
    
    // Calculate chart data efficiently
    const leads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const chartData = calculateChartMetrics(leads);
    
    // Return structured response
    res.json({
      success: true,
      data: {
        totalLeads: leads.length,
        filters: { filter_type, sales_person_id, event_name },
        charts: {
          leadSplit: chartData.leadSplit,
          temperatureCount: chartData.temperatureCount,
          temperatureValue: chartData.temperatureValue
        },
        summary: {
          totalPipelineValue: chartData.totalPipelineValue,
          qualifiedLeads: chartData.leadSplit.qualified,
          hotLeads: chartData.temperatureCount.hot
        }
      },
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Dashboard charts API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard chart data',
      message: error.message
    });
  }
});

// ===============================================
// CHART METRICS CALCULATION FUNCTION
// Add this helper function to the same file
// ===============================================
function calculateChartMetrics(leads) {
  // Initialize counters
  let qualifiedCount = 0;
  let junkCount = 0;
  
  let hotCount = 0;
  let warmCount = 0;
  let coldCount = 0;
  
  let hotValue = 0;
  let warmValue = 0;
  let coldValue = 0;
  
  let totalPipelineValue = 0;
  
  // Single pass through leads for all calculations
  leads.forEach(lead => {
    const status = (lead.status || '').toLowerCase();
    const temperature = getLeadTemperature(lead);
    const potentialValue = parseFloat(lead.potential_value) || 0;
    
    // Lead Split calculations
    if (status === 'qualified') {
      qualifiedCount++;
    } else if (status === 'junk') {
      junkCount++;
    }
    
    // Temperature Count calculations
    if (temperature === 'hot') {
      hotCount++;
      hotValue += potentialValue;
    } else if (temperature === 'warm') {
      warmCount++;
      warmValue += potentialValue;
    } else {
      coldCount++;
      coldValue += potentialValue;
    }
    
    totalPipelineValue += potentialValue;
  });
  
  return {
    leadSplit: {
      qualified: qualifiedCount,
      junk: junkCount,
      labels: ['Qualified', 'Junk'],
      data: [qualifiedCount, junkCount],
      colors: ['#10B981', '#EF4444']
    },
    temperatureCount: {
      hot: hotCount,
      warm: warmCount,
      cold: coldCount,
      labels: ['Hot', 'Warm', 'Cold'],
      data: [hotCount, warmCount, coldCount],
      colors: ['#EF4444', '#F59E0B', '#3B82F6']
    },
    temperatureValue: {
      hot: hotValue,
      warm: warmValue,
      cold: coldValue,
      labels: ['Hot Value', 'Warm Value', 'Cold Value'],
      data: [hotValue, warmValue, coldValue],
      colors: ['#EF4444', '#F59E0B', '#3B82F6']
    },
    totalPipelineValue
  };
}

// Helper function to determine lead temperature
function getLeadTemperature(lead) {
  if (lead.temperature) {
    return lead.temperature.toLowerCase();
  }
  
  if (lead.status) {
    const status = lead.status.toLowerCase();
    if (status === 'qualified' || status === 'hot') return 'hot';
    if (status === 'warm') return 'warm';
    return 'cold';
  }
  
  return 'cold';
}

// ===============================================
// IF YOU DON'T HAVE A DASHBOARD ROUTES FILE
// Add this to your main routes/index.js or app.js
// ===============================================

// In your main routes file, add:
const express = require('express');
const router = express.Router();

// ... your existing routes ...

// Add the dashboard charts endpoint here
router.get('/dashboard/charts', async (req, res) => {
  // ... copy the entire endpoint code from above ...
});

module.exports = router;
