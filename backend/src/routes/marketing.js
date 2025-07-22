// Marketing routes for Facebook/Instagram impressions data
const express = require('express');
const router = express.Router();
const { authenticateToken, checkPermission } = require('../middleware/auth');
const { db, collections } = require('../config/db');
const facebookInsights = require('../services/facebookInsightsService');
const { formatDateForQuery } = require('../utils/dateHelpers');

// Define touch-based statuses
const touchBasedStatuses = [
  'contacted', 'attempt_1', 'attempt_2', 'attempt_3',
  'qualified', 'unqualified', 'junk', 'warm', 'hot', 'cold',
  'interested', 'not_interested', 'on_hold', 'dropped',
  'converted', 'invoiced', 'payment_received', 'payment_post_service',
  'pickup_later', 'quote_requested', 'quote_received'
];

// Comprehensive marketing performance endpoint - everything in one call
router.get('/performance', authenticateToken, checkPermission('finance', 'read'), async (req, res) => {
  try {
    const { date_from, date_to, event, source, ad_set } = req.query;
    
    console.log('📊 Fetching marketing performance:', { date_from, date_to, event, source, ad_set });
    
    // Build query for leads - simplified to avoid Firestore index issues
    let query = db.collection(collections.leads);
    
    // Only apply date filters to avoid compound index requirements
    // Handle both date-only strings and ISO timestamps with IST conversion
    if (date_from) {
      const fromDate = formatDateForQuery(date_from, 'start');
      query = query.where('date_of_enquiry', '>=', fromDate);
    }
    if (date_to) {
      const toDate = formatDateForQuery(date_to, 'end');
      query = query.where('date_of_enquiry', '<=', toDate);
    }
    
    const leadsSnapshot = await query.get();
    let allLeadsData = [];
    leadsSnapshot.forEach(doc => {
      allLeadsData.push({ id: doc.id, ...doc.data() });
    });
    
    // IMPORTANT: Collect all filter options BEFORE filtering
    const allEvents = new Set();
    const allSources = new Set();
    const allAdSets = new Set();
    const uniqueAdSetNames = new Set(); // For fetching from Facebook
    
    // Collect ALL available options from ALL leads (before filtering)
    allLeadsData.forEach(lead => {
      if (lead.lead_for_event || lead.event_name) {
        allEvents.add(lead.lead_for_event || lead.event_name);
      }
      if (lead.source) {
        allSources.add(lead.source);
      }
      if (lead.ad_set || lead.adset_name) {
        const adSetName = lead.ad_set || lead.adset_name;
        allAdSets.add(adSetName);
        if (lead.source === 'Facebook' || lead.source === 'Instagram') {
          uniqueAdSetNames.add(adSetName);
        }
      }
    });
    
    // Fetch real impressions data from Facebook
    let facebookImpressions = {};
    let facebookMetrics = {}; // Store full metrics including spend, clicks
    let sourceImpressions = {};
    let fullSourceInsights = {}; // Store full source metrics
    let facebookApiStatus = 'not_attempted';
    let facebookApiError = null;
    
    try {
      console.log('📊 Attempting to fetch Facebook impressions...');
      
      // Test connection first
      const connectionTest = await facebookInsights.testConnection();
      if (!connectionTest.success) {
        throw new Error(`Connection test failed: ${connectionTest.error?.message || 'Unknown error'}`);
      }
      
      // Get impressions by source (Facebook vs Instagram)
      sourceImpressions = await facebookInsights.getInsightsBySource(date_from, date_to);
      fullSourceInsights = await facebookInsights.getFullSourceInsights(date_from, date_to);
      console.log('📊 Source impressions:', sourceImpressions);
      console.log('📊 Full source insights:', fullSourceInsights);
      
      // Get impressions for specific ad sets if we're filtering by ad set
      if (ad_set && ad_set !== 'all') {
        const allAdSetInsights = await facebookInsights.getAdSetInsights(date_from, date_to);
        if (allAdSetInsights[ad_set]) {
          facebookMetrics[ad_set] = allAdSetInsights[ad_set];
          facebookImpressions[ad_set] = allAdSetInsights[ad_set].impressions;
        }
      } else {
        // Get all ad set insights
        const allAdSetInsights = await facebookInsights.getAdSetInsights(date_from, date_to);
        console.log('📊 All ad set insights:', Object.keys(allAdSetInsights));
        
        // Map the insights to our ad set names
        uniqueAdSetNames.forEach(name => {
          // Try exact match first
          if (allAdSetInsights[name]) {
            facebookMetrics[name] = allAdSetInsights[name];
            facebookImpressions[name] = allAdSetInsights[name].impressions;
          } else {
            // Try to find a matching ad set with similar name
            Object.keys(allAdSetInsights).forEach(fbAdSetName => {
              if (fbAdSetName.toLowerCase().includes(name.toLowerCase()) || 
                  name.toLowerCase().includes(fbAdSetName.toLowerCase())) {
                facebookMetrics[name] = allAdSetInsights[fbAdSetName];
                facebookImpressions[name] = allAdSetInsights[fbAdSetName].impressions;
              }
            });
          }
        });
      }
      
      facebookApiStatus = 'success';
      console.log('✅ Fetched Facebook impressions:', {
        sources: sourceImpressions,
        adSets: Object.keys(facebookImpressions).length,
        totalImpressions: Object.values(sourceImpressions).reduce((a, b) => a + b, 0)
      });
      
    } catch (fbError) {
      facebookApiStatus = 'error';
      facebookApiError = fbError.message;
      console.error('⚠️ Facebook API error:', fbError.message);
      console.error('Full error:', fbError);
      // Use fallback data if Facebook API fails
      sourceImpressions = { 'Facebook': 0, 'Instagram': 0 };
      fullSourceInsights = {
        'Facebook': { impressions: 0, clicks: 0, spend: 0 },
        'Instagram': { impressions: 0, clicks: 0, spend: 0 }
      };
    }
    
    // Now apply filters to get the subset of leads for display
    let leads = [...allLeadsData]; // Create a copy for filtering
    
    if (event && event !== 'all') {
      leads = leads.filter(lead => 
        lead.lead_for_event === event || lead.event_name === event
      );
    }
    if (source && source !== 'all') {
      leads = leads.filter(lead => lead.source === source);
    }
    if (ad_set && ad_set !== 'all') {
      leads = leads.filter(lead => 
        lead.ad_set === ad_set || lead.adset_name === ad_set
      );
    }
    
    console.log(`Found ${leads.length} leads for marketing performance (from ${allLeadsData.length} total)`);
    
    // Determine grouping logic
    const groupBy = ad_set && ad_set !== 'all' ? 'ad_set' :
                   source && source !== 'all' ? 'source' :
                   event && event !== 'all' ? 'event' :
                   'source'; // Default grouping
    
    // Group and calculate metrics (only for filtered leads)
    const grouped = {};
    
    leads.forEach(lead => {
      // Determine grouping key
      let key = 'Unknown';
      if (groupBy === 'event') {
        key = lead.lead_for_event || lead.event_name || 'Unknown';
      } else if (groupBy === 'ad_set') {
        key = lead.ad_set || lead.adset_name || 'Unknown';
      } else {
        key = lead.source || 'Unknown';
      }
      
      // Initialize group if not exists
      if (!grouped[key]) {
        grouped[key] = {
          name: key,
          totalLeads: 0,
          touchBased: 0,
          notTouchBased: 0,
          qualified: 0,
          junk: 0,
          dropped: 0,
          converted: 0,
          impressions: 0
        };
      }
      
      // Count metrics
      grouped[key].totalLeads++;
      
      if (touchBasedStatuses.includes(lead.status)) {
        grouped[key].touchBased++;
        
        // Updated qualified logic - includes qualified, temperature statuses, quote statuses, converted, and dropped
        if (['qualified', 'hot', 'warm', 'cold', 'pickup_later', 'quote_requested', 'quote_received', 'converted', 'invoiced', 'payment_received', 'payment_post_service', 'dropped'].includes(lead.status)) {
          grouped[key].qualified++;
        } else if (lead.status === 'junk') {
          grouped[key].junk++;
        }
        
        // Count dropped separately (even though it's also in qualified)
        if (lead.status === 'dropped') {
          grouped[key].dropped++;
        }
        
        // Converted includes only actual conversions
        if (['converted', 'invoiced', 'payment_received', 'payment_post_service'].includes(lead.status)) {
          grouped[key].converted++;
        }
      } else {
        grouped[key].notTouchBased++;
      }
    });
    
    // First, ensure we have entries for both Facebook and Instagram if we're grouping by source
    if (groupBy === 'source') {
      // Initialize both sources with zero values if they don't exist
      ['Facebook', 'Instagram'].forEach(source => {
        if (!grouped[source] && (sourceImpressions[source] > 0 || fullSourceInsights[source])) {
          grouped[source] = {
            name: source,
            totalLeads: 0,
            touchBased: 0,
            notTouchBased: 0,
            qualified: 0,
            junk: 0,
            dropped: 0,
            converted: 0,
            impressions: 0
          };
        }
      });
    }
    
    // Add impressions and calculate percentages
    const marketingData = Object.entries(grouped).map(([key, data]) => {
      // Get impressions and metrics based on grouping
      let impressions = 0;
      let spend = 0;
      let clicks = 0;
      
      if (groupBy === 'source' && (key === 'Facebook' || key === 'Instagram')) {
        impressions = sourceImpressions[key] || 0;
        // Use full source insights for spend and clicks
        if (fullSourceInsights[key]) {
          spend = fullSourceInsights[key].spend || 0;
          clicks = fullSourceInsights[key].clicks || 0;
        }
      } else if (groupBy === 'ad_set') {
        const metrics = facebookMetrics[key];
        if (metrics) {
          impressions = metrics.impressions || 0;
          spend = metrics.spend || 0;
          clicks = metrics.clicks || 0;
        }
      } else if (groupBy === 'event') {
        // For events, sum metrics from all ad sets associated with this event
        leads.filter(lead => {
          const leadEvent = lead.lead_for_event || lead.event_name;
          return leadEvent === key;
        }).forEach(lead => {
          const adSetName = lead.ad_set || lead.adset_name;
          if (adSetName && facebookMetrics[adSetName]) {
            impressions += facebookMetrics[adSetName].impressions || 0;
            spend += facebookMetrics[adSetName].spend || 0;
            clicks += facebookMetrics[adSetName].clicks || 0;
          }
        });
      }
      
      // Calculate percentages
      const qualifiedPercent = data.touchBased > 0 
        ? ((data.qualified + data.dropped) / data.touchBased * 100).toFixed(2) 
        : '0.00';
      const convertedPercent = data.touchBased > 0 
        ? (data.converted / data.touchBased * 100).toFixed(2) 
        : '0.00';
      const junkPercent = data.touchBased > 0 
        ? (data.junk / data.touchBased * 100).toFixed(2) 
        : '0.00';
      
      // Calculate new metrics
      const cpl = data.totalLeads > 0 ? (spend / data.totalLeads).toFixed(2) : '0.00';
      const cpm = impressions > 0 ? ((spend / impressions) * 1000).toFixed(2) : '0.00';
      const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0.00';
      
      return {
        ...data,
        impressions,
        spend,
        clicks,
        qualifiedPercent,
        convertedPercent,
        junkPercent,
        cpl, // Cost Per Lead
        cpm, // Cost Per Mille (thousand impressions)
        ctr  // Click Through Rate
      };
    });
    
    // Calculate totals
    const totals = marketingData.reduce((acc, row) => {
      acc.totalImpressions += row.impressions;
      acc.totalLeads += row.totalLeads;
      acc.touchBased += row.touchBased;
      acc.notTouchBased += row.notTouchBased;
      acc.qualified += row.qualified;
      acc.junk += row.junk;
      acc.dropped += row.dropped;
      acc.converted += row.converted;
      acc.totalSpend += row.spend;
      acc.totalClicks += row.clicks;
      return acc;
    }, {
      totalImpressions: 0,
      totalLeads: 0,
      touchBased: 0,
      notTouchBased: 0,
      qualified: 0,
      junk: 0,
      dropped: 0,
      converted: 0,
      totalSpend: 0,
      totalClicks: 0
    });
    
    // Calculate total percentages
    const totalQualifiedPercent = totals.touchBased > 0 
      ? ((totals.qualified + totals.dropped) / totals.touchBased * 100).toFixed(2) 
      : '0.00';
    const totalConvertedPercent = totals.touchBased > 0 
      ? (totals.converted / totals.touchBased * 100).toFixed(2) 
      : '0.00';
    const totalJunkPercent = totals.touchBased > 0 
      ? (totals.junk / totals.touchBased * 100).toFixed(2) 
      : '0.00';
    
    // Calculate total CPL, CPM, CTR
    const totalCPL = totals.totalLeads > 0 ? (totals.totalSpend / totals.totalLeads).toFixed(2) : '0.00';
    const totalCPM = totals.totalImpressions > 0 ? ((totals.totalSpend / totals.totalImpressions) * 1000).toFixed(2) : '0.00';
    const totalCTR = totals.totalImpressions > 0 ? ((totals.totalClicks / totals.totalImpressions) * 100).toFixed(2) : '0.00';
    
    // Prepare filter options - using ALL available options (not just from filtered data)
    const filterOptions = {
      events: Array.from(allEvents).sort(),
      sources: Array.from(allSources).sort(),
      adSets: Array.from(allAdSets).sort()
    };
    
    console.log(`✅ Marketing performance calculated: ${marketingData.length} rows, ${totals.totalLeads} total leads`);
    console.log(`📋 Filter options: ${filterOptions.events.length} events, ${filterOptions.sources.length} sources, ${filterOptions.adSets.length} ad sets`);
    
    res.json({
      success: true,
      data: {
        marketingData,
        totals: {
          ...totals,
          totalQualifiedPercent,
          totalConvertedPercent,
          totalJunkPercent,
          totalCPL,
          totalCPM,
          totalCTR
        },
        filterOptions,
        groupBy,
        appliedFilters: {
          date_from,
          date_to,
          event: event || 'all',
          source: source || 'all',
          ad_set: ad_set || 'all'
        },
        facebookApi: {
          status: facebookApiStatus,
          error: facebookApiError,
          hasImpressions: Object.values(sourceImpressions).some(v => v > 0),
          debugInfo: {
            sourceImpressions,
            adSetCount: Object.keys(facebookImpressions).length,
            totalFbImpressions: sourceImpressions.Facebook || 0,
            totalIgImpressions: sourceImpressions.Instagram || 0
          }
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching marketing performance:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error fetching marketing performance data',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Force refresh Facebook insights cache
router.post('/refresh-insights', authenticateToken, checkPermission('finance', 'read'), async (req, res) => {
  try {
    facebookInsights.clearCache();
    res.json({
      success: true,
      message: 'Facebook insights cache cleared. Next request will fetch fresh data.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get Facebook campaign list (for debugging)
router.get('/facebook-campaigns', authenticateToken, checkPermission('finance', 'read'), async (req, res) => {
  try {
    const campaigns = await facebookInsights.getCampaignInsights(
      req.query.date_from, 
      req.query.date_to
    );
    
    res.json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get Facebook ad sets list (for debugging)
router.get('/facebook-adsets', authenticateToken, checkPermission('finance', 'read'), async (req, res) => {
  try {
    const adSets = await facebookInsights.getAdSetInsights(
      req.query.date_from, 
      req.query.date_to,
      req.query.campaign_id
    );
    
    res.json({
      success: true,
      data: adSets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test Facebook API connection and permissions
router.get('/test-facebook-connection', authenticateToken, checkPermission('finance', 'read'), async (req, res) => {
  try {
    console.log('🧪 Testing Facebook API connection...');
    
    // Test basic connection
    const connectionTest = await facebookInsights.testConnection();
    
    // Try to get ad account
    let adAccountTest = { success: false, error: 'Not tested' };
    try {
      const adAccountId = await facebookInsights.getAdAccountId();
      adAccountTest = { success: true, adAccountId };
    } catch (error) {
      adAccountTest = { success: false, error: error.message };
    }
    
    // Try to get some insights
    let insightsTest = { success: false, error: 'Not tested' };
    try {
      const sourceInsights = await facebookInsights.getInsightsBySource();
      insightsTest = { success: true, data: sourceInsights };
    } catch (error) {
      insightsTest = { success: false, error: error.message };
    }
    
    res.json({
      success: true,
      tests: {
        connection: connectionTest,
        adAccount: adAccountTest,
        insights: insightsTest,
        environment: {
          hasAccessToken: !!process.env.META_PAGE_ACCESS_TOKEN,
          hasAppId: !!process.env.FACEBOOK_APP_ID,
          tokenLength: process.env.META_PAGE_ACCESS_TOKEN?.length || 0
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Facebook connection test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
