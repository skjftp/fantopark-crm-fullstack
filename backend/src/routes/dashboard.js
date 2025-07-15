const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET dashboard stats with currency support
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Get counts from all collections
    const [leads, inventory, orders, receivables] = await Promise.all([
      db.collection(collections.leads).get(),
      db.collection(collections.inventory).get(),
      db.collection(collections.orders).get(),
      db.collection(collections.receivables).get()
    ]);
    
    // Calculate revenue using INR fields
    let totalRevenue = 0;
    let thisMonthRevenue = 0;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    orders.docs.forEach(doc => {
      const data = doc.data();
      // Use INR fields for calculation, fallback to regular fields if not available
      const amount = data.final_amount_inr || data.final_amount || 0;
      
      if (data.status === 'approved' || data.status === 'completed') {
        totalRevenue += amount;
        
        // Check if order is from current month
        const orderDate = new Date(data.created_date);
        if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
          thisMonthRevenue += amount;
        }
      }
    });
    
    // Calculate inventory value using INR fields
    let totalInventoryValue = 0;
    let availableInventoryCount = 0;
    
    inventory.docs.forEach(doc => {
      const data = doc.data();
      
      if (data.categories && Array.isArray(data.categories)) {
        // Multi-category inventory
        data.categories.forEach(cat => {
          const sellingPrice = cat.selling_price_inr || cat.selling_price || 0;
          const availableTickets = parseInt(cat.available_tickets) || 0;
          totalInventoryValue += sellingPrice * availableTickets;
          availableInventoryCount += availableTickets;
        });
      } else {
        // Legacy single-category inventory
        const sellingPrice = data.selling_price_inr || data.selling_price || 0;
        const availableTickets = parseInt(data.available_tickets) || 0;
        totalInventoryValue += sellingPrice * availableTickets;
        availableInventoryCount += availableTickets;
      }
    });
    
    // Calculate stats
    const stats = {
      totalLeads: leads.size,
      activeDeals: leads.docs.filter(doc => 
        ['qualified', 'hot', 'warm'].includes(doc.data().status)
      ).length,
      totalInventory: availableInventoryCount,
      totalInventoryValue: totalInventoryValue,
      pendingOrders: orders.docs.filter(doc => 
        doc.data().status === 'pending_approval'
      ).length,
      totalReceivables: receivables.docs.reduce((sum, doc) => 
        sum + (doc.data().amount || 0), 0
      ),
      thisMonthRevenue: thisMonthRevenue,
      totalRevenue: totalRevenue,
      currency: 'INR' // Always report in INR
    };
    
    res.json({ data: stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ NEW: Dashboard charts endpoint for optimized chart rendering
router.get('/charts', async (req, res) => {
  try {
    const { filter_type, sales_person_id, event_name } = req.query;
    
    console.log('📊 Dashboard charts API called with filters:', { filter_type, sales_person_id, event_name });
    
    // Build query for Firestore using existing collections config
    let query = db.collection(collections.leads);
    
    // Apply filters based on frontend selection
    if (filter_type === 'salesPerson' && sales_person_id) {
      try {
        // Map user ID to email for filtering
        const userDoc = await db.collection('crm_users').doc(sales_person_id).get();
        if (userDoc.exists) {
          const userEmail = userDoc.data().email;
          query = query.where('assigned_to', '==', userEmail);
        }
      } catch (userError) {
        console.warn('User lookup failed:', userError.message);
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
// HELPER FUNCTIONS
// ===============================================

// Chart metrics calculation function
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

module.exports = router;
