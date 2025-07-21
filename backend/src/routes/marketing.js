// Marketing routes for Facebook/Instagram impressions data
const express = require('express');
const router = express.Router();
const { authenticateToken, checkPermission } = require('../middleware/auth');
const { db, collections } = require('../config/db');

// Mock data for Facebook/Instagram impressions
// In production, this would integrate with Facebook Graph API
const mockImpressions = {
  // By source
  'Facebook': 567500,
  'Instagram': 100000,
  
  // By ad sets
  'FB_Summer_Campaign_2024': 125000,
  'FB_Diwali_Special_2024': 87500,
  'FB_New_Year_2025': 95000,
  'FB_Valentine_Special': 110000,
  'FB_IPL_Season_2024': 145000,
  
  'IG_Influencer_Collab_2024': 78000,
  'IG_Reels_Campaign': 92000,
  'IG_Story_Ads_2024': 65000,
  'IG_Feed_Posts_2024': 83000,
  'IG_IGTV_Campaign': 54000,
  
  'default': 0
};

// Define touch-based statuses
const touchBasedStatuses = [
  'contacted', 'attempt_1', 'attempt_2', 'attempt_3',
  'qualified', 'unqualified', 'junk', 'warm', 'hot', 'cold',
  'interested', 'not_interested', 'on_hold', 'dropped',
  'converted', 'invoiced', 'payment_received', 'payment_post_service'
];

// Get impressions for specific ad sets or sources
router.get('/facebook-impressions', authenticateToken, checkPermission('finance', 'read'), async (req, res) => {
  try {
    const { ad_set, source, date_from, date_to } = req.query;
    
    console.log('📊 Fetching impressions for:', { ad_set, source, date_from, date_to });
    
    // If specific ad set is requested
    if (ad_set && ad_set !== 'all') {
      const impressions = mockImpressions[ad_set] || mockImpressions['default'];
      return res.json({
        success: true,
        data: {
          [ad_set]: impressions
        }
      });
    }
    
    // If fetching by source (Facebook or Instagram)
    if (source === 'Facebook' || source === 'Instagram') {
      // Get all leads with this source to find unique ad sets
      const leadsSnapshot = await db.collection(collections.leads)
        .where('source', '==', source)
        .get();
      
      const adSetImpressions = {};
      const uniqueAdSets = new Set();
      
      leadsSnapshot.forEach(doc => {
        const lead = doc.data();
        if (lead.ad_set || lead.adset_name) {
          uniqueAdSets.add(lead.ad_set || lead.adset_name);
        }
      });
      
      // Assign impressions to each ad set
      uniqueAdSets.forEach(adSet => {
        adSetImpressions[adSet] = mockImpressions[adSet] || mockImpressions['default'];
      });
      
      return res.json({
        success: true,
        data: adSetImpressions
      });
    }
    
    // Return all impressions data
    res.json({
      success: true,
      data: mockImpressions
    });
    
  } catch (error) {
    console.error('Error fetching Facebook impressions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching impressions data',
      error: error.message
    });
  }
});

// Get aggregated impressions by source
router.get('/impressions-by-source', authenticateToken, checkPermission('finance', 'read'), async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    
    // In production, this would fetch from Facebook Graph API with date filters
    const impressionsBySource = {
      'Facebook': 567500,  // Sum of all FB campaigns
      'Instagram': 372000, // Sum of all IG campaigns
      'Google': 0,         // No impressions for non-social sources
      'Website': 0,
      'Direct': 0,
      'Referral': 0,
      'Other': 0
    };
    
    res.json({
      success: true,
      data: impressionsBySource
    });
    
  } catch (error) {
    console.error('Error fetching impressions by source:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching impressions data',
      error: error.message
    });
  }
});

// Comprehensive marketing performance endpoint - everything in one call
router.get('/performance', authenticateToken, checkPermission('finance', 'read'), async (req, res) => {
  try {
    const { date_from, date_to, event, source, ad_set } = req.query;
    
    console.log('📊 Fetching marketing performance:', { date_from, date_to, event, source, ad_set });
    console.log('📊 Collections config:', collections);
    
    // Build query for leads - simplified to avoid Firestore index issues
    let query = db.collection(collections.leads);
    
    // Only apply date filters to avoid compound index requirements
    if (date_from) {
      query = query.where('date_of_enquiry', '>=', date_from);
    }
    if (date_to) {
      query = query.where('date_of_enquiry', '<=', date_to);
    }
    
    // Note: Other filters will be applied in memory to avoid Firestore index issues
    
    const leadsSnapshot = await query.get();
    let leads = [];
    leadsSnapshot.forEach(doc => {
      leads.push({ id: doc.id, ...doc.data() });
    });
    
    // Apply other filters in memory
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
    
    console.log(`Found ${leads.length} leads for marketing performance`);
    if (leads.length > 0) {
      console.log('📊 Sample lead structure:', Object.keys(leads[0]));
    }
    
    // Determine grouping logic
    const groupBy = ad_set && ad_set !== 'all' ? 'ad_set' :
                   source && source !== 'all' ? 'source' :
                   event && event !== 'all' ? 'event' :
                   'source'; // Default grouping
    
    // Group and calculate metrics
    const grouped = {};
    const allEvents = new Set();
    const allSources = new Set();
    const allAdSets = new Set();
    
    leads.forEach(lead => {
      // Collect filter options
      if (lead.lead_for_event || lead.event_name) {
        allEvents.add(lead.lead_for_event || lead.event_name);
      }
      if (lead.source) {
        allSources.add(lead.source);
      }
      if (lead.ad_set || lead.adset_name) {
        allAdSets.add(lead.ad_set || lead.adset_name);
      }
      
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
        
        if (lead.status === 'qualified') {
          grouped[key].qualified++;
        } else if (lead.status === 'junk') {
          grouped[key].junk++;
        } else if (lead.status === 'dropped') {
          grouped[key].dropped++;
        } else if (['converted', 'invoiced', 'payment_received', 'payment_post_service'].includes(lead.status)) {
          grouped[key].converted++;
        }
      } else {
        grouped[key].notTouchBased++;
      }
    });
    
    // Add impressions and calculate percentages
    const marketingData = Object.entries(grouped).map(([key, data]) => {
      // Get impressions based on grouping
      let impressions = 0;
      if (groupBy === 'source' && (key === 'Facebook' || key === 'Instagram')) {
        impressions = mockImpressions[key] || 0;
      } else if (groupBy === 'ad_set') {
        impressions = mockImpressions[key] || mockImpressions['default'];
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
      
      return {
        ...data,
        impressions,
        qualifiedPercent,
        convertedPercent,
        junkPercent
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
      return acc;
    }, {
      totalImpressions: 0,
      totalLeads: 0,
      touchBased: 0,
      notTouchBased: 0,
      qualified: 0,
      junk: 0,
      dropped: 0,
      converted: 0
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
    
    // Prepare filter options
    const filterOptions = {
      events: Array.from(allEvents).sort(),
      sources: Array.from(allSources).sort(),
      adSets: Array.from(allAdSets).sort()
    };
    
    console.log(`✅ Marketing performance calculated: ${marketingData.length} rows, ${totals.totalLeads} total leads`);
    
    res.json({
      success: true,
      data: {
        marketingData,
        totals: {
          ...totals,
          totalQualifiedPercent,
          totalConvertedPercent,
          totalJunkPercent
        },
        filterOptions,
        groupBy,
        appliedFilters: {
          date_from,
          date_to,
          event: event || 'all',
          source: source || 'all',
          ad_set: ad_set || 'all'
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

module.exports = router;