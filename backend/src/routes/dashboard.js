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
    
    // Qualified statuses - matching marketing performance logic
    const qualifiedStatuses = ['qualified', 'hot', 'warm', 'cold', 'pickup_later', 
      'quote_requested', 'quote_received', 'converted', 'invoiced', 
      'payment_received', 'payment_post_service', 'dropped'];
    
    // Calculate stats
    console.log(`📊 Dashboard Stats - Total leads: ${leads.size}`);
    const stats = {
      totalLeads: leads.size,
      activeDeals: leads.docs.filter(doc => 
        qualifiedStatuses.includes(doc.data().status)
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

// Enhanced Dashboard charts endpoint for optimized chart rendering
router.get('/charts', async (req, res) => {
  try {
    const { filter_type, sales_person_id, event_name } = req.query;
    
    console.log('📊 Dashboard charts API called with filters:', { filter_type, sales_person_id, event_name });
    
    // Build query for Firestore
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
    
    // Fetch ALL leads without field selection to ensure we get everything
    const snapshot = await query.get();
    
    console.log(`📊 Processing ${snapshot.size} leads for charts`);
    
    // Calculate chart data efficiently
    const leads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Debug: Log status distribution
    const statusCounts = {};
    leads.forEach(lead => {
      const status = lead.status || 'no_status';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    console.log('📊 Status distribution:', statusCounts);
    
    const chartData = calculateChartMetrics(leads);
    
    // Return structured response with all chart data
    res.json({
      success: true,
      data: {
        // Metadata
        totalLeads: leads.length,
        filters: { filter_type, sales_person_id, event_name },
        
        // All chart data in one response
        charts: {
          // Lead Split Chart Data
          leadSplit: {
            labels: ['Qualified', 'Junk'],
            data: [chartData.leadSplit.qualified, chartData.leadSplit.junk],
            colors: ['#10B981', '#EF4444'],
            counts: {
              qualified: chartData.leadSplit.qualified,
              junk: chartData.leadSplit.junk
            }
          },
          
          // Temperature Count Chart Data
          temperatureCount: {
            labels: ['Hot', 'Warm', 'Cold'],
            data: [chartData.temperatureCount.hot, chartData.temperatureCount.warm, chartData.temperatureCount.cold],
            colors: ['#EF4444', '#F59E0B', '#3B82F6'],
            counts: {
              hot: chartData.temperatureCount.hot,
              warm: chartData.temperatureCount.warm,
              cold: chartData.temperatureCount.cold
            }
          },
          
          // Temperature Value Chart Data
          temperatureValue: {
            labels: ['Hot Value', 'Warm Value', 'Cold Value'],
            data: [chartData.temperatureValue.hot, chartData.temperatureValue.warm, chartData.temperatureValue.cold],
            colors: ['#EF4444', '#F59E0B', '#3B82F6'],
            values: {
              hot: chartData.temperatureValue.hot,
              warm: chartData.temperatureValue.warm,
              cold: chartData.temperatureValue.cold,
              total: chartData.totalPipelineValue
            }
          }
        },
        
        // Summary statistics
        summary: {
          totalLeads: leads.length,
          totalPipelineValue: chartData.totalPipelineValue,
          qualifiedLeads: chartData.leadSplit.qualified,
          hotLeads: chartData.temperatureCount.hot,
          hotWarmLeads: chartData.temperatureCount.hot + chartData.temperatureCount.warm, // Combined hot+warm like sales performance
          averageDealSize: leads.length > 0 ? Math.round(chartData.totalPipelineValue / leads.length) : 0
        },
        
        // Cache timestamp
        generatedAt: new Date().toISOString()
      }
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

function calculateChartMetrics(leads) {
  console.log(`📊 calculateChartMetrics called with ${leads.length} leads`);
  
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

  // Statuses that should be excluded from pipeline value
  const excludedStatuses = ['converted', 'junk', 'payment_received', 'payment_post_service', 'dropped'];

  // Qualified statuses - matching marketing performance logic
  const qualifiedStatuses = ['qualified', 'hot', 'warm', 'cold', 'pickup_later', 
    'quote_requested', 'quote_received', 'converted', 'invoiced', 
    'payment_received', 'payment_post_service', 'dropped'];
  
  console.log('📊 Qualified statuses:', qualifiedStatuses);
  
  // Single pass through leads for all calculations
  leads.forEach(lead => {
    const status = (lead.status || '').toLowerCase();
    const temperature = lead.temperature ? lead.temperature.toLowerCase() : null;
    const potentialValue = parseFloat(lead.potential_value) || 0;
    
    // Lead Split calculations - using marketing performance logic
    if (qualifiedStatuses.includes(status)) {
      qualifiedCount++;
      if (qualifiedCount <= 5) {
        console.log(`  Qualified lead #${qualifiedCount}: status="${status}"`);
      }
    } else if (status === 'junk') {
      junkCount++;
    }
    
    // Temperature Count calculations - new unified logic
    // Hot: status is hot OR (status is quote_requested/quote_received AND temperature is hot)
    if (status === 'hot' || 
        ((status === 'quote_requested' || status === 'quote_received') && temperature === 'hot')) {
      hotCount++;
      // Add to hotValue for hot status OR quote statuses with hot temperature
      if (status === 'hot' || 
          ((status === 'quote_requested' || status === 'quote_received') && temperature === 'hot')) {
        hotValue += potentialValue;
      }
    }
    // Warm: status is warm OR (status is quote_requested/quote_received AND temperature is warm)
    else if (status === 'warm' || 
             ((status === 'quote_requested' || status === 'quote_received') && temperature === 'warm')) {
      warmCount++;
      // Add to warmValue for warm status OR quote statuses with warm temperature
      if (status === 'warm' || 
          ((status === 'quote_requested' || status === 'quote_received') && temperature === 'warm')) {
        warmValue += potentialValue;
      }
    }
    // Cold: status is cold OR (status is quote_requested/quote_received AND temperature is cold)
    else if (status === 'cold' || 
             ((status === 'quote_requested' || status === 'quote_received') && temperature === 'cold')) {
      coldCount++;
      // Add to coldValue for cold status OR quote statuses with cold temperature
      if (status === 'cold' || 
          ((status === 'quote_requested' || status === 'quote_received') && temperature === 'cold')) {
        coldValue += potentialValue;
      }
    }
    
    // Pipeline value calculation - includes hot/warm/cold statuses AND quote statuses with temperature
    // This matches the temperature value pie chart
    if (status === 'hot' || status === 'warm' || status === 'cold' ||
        ((status === 'quote_requested' || status === 'quote_received') && 
         (temperature === 'hot' || temperature === 'warm' || temperature === 'cold'))) {
      totalPipelineValue += potentialValue;
    }
  });
  
  console.log(`📊 Final counts - Qualified: ${qualifiedCount}, Junk: ${junkCount}, Hot: ${hotCount}, Warm: ${warmCount}, Cold: ${coldCount}`);
  console.log(`📊 Hot+Warm combined would be: ${hotCount + warmCount}`);
  console.log(`📊 Pipeline values - Hot: ₹${hotValue}, Warm: ₹${warmValue}, Cold: ₹${coldValue}`);
  console.log(`📊 Total Pipeline (Hot+Warm+Cold): ₹${totalPipelineValue} (should equal ₹${hotValue + warmValue + coldValue})`);
  
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

function getLeadTemperature(lead) {
  // Only use the temperature field if it exists
  // Do NOT fallback to status-based logic
  if (lead.temperature) {
    return lead.temperature.toLowerCase();
  }
  
  // If no temperature field, this lead is not temperature-categorized
  // Return null or a default - but do NOT derive from status
  return null; // This lead won't be counted in temperature charts
}

// GET recent activity
router.get('/recent-activity', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Get all leads
    const leadsSnapshot = await db.collection(collections.leads).get();
    const leads = [];
    
    leadsSnapshot.forEach(doc => {
      leads.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by most recent activity (updated_date or created_date)
    const sortedLeads = leads
      .sort((a, b) => {
        const dateA = new Date(a.updated_date || a.created_date || 0);
        const dateB = new Date(b.updated_date || b.created_date || 0);
        return dateB - dateA;
      })
      .slice(0, limit);
    
    res.json({
      success: true,
      data: sortedLeads
    });
    
  } catch (error) {
    console.error('❌ Recent activity API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent activity',
      message: error.message
    });
  }
});

module.exports = router;
