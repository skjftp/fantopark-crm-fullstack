// Marketing routes for Facebook/Instagram impressions data
const express = require('express');
const router = express.Router();
const { authenticateToken, checkPermission } = require('../middleware/auth');
const { db, collections } = require('../config/db');

// Mock data for Facebook/Instagram impressions
// In production, this would integrate with Facebook Graph API
const mockImpressions = {
  // Facebook ad sets
  'FB_Summer_Campaign_2024': 125000,
  'FB_Diwali_Special_2024': 87500,
  'FB_New_Year_2025': 95000,
  'FB_Valentine_Special': 110000,
  'FB_IPL_Season_2024': 145000,
  
  // Instagram ad sets
  'IG_Influencer_Collab_2024': 78000,
  'IG_Reels_Campaign': 92000,
  'IG_Story_Ads_2024': 65000,
  'IG_Feed_Posts_2024': 83000,
  'IG_IGTV_Campaign': 54000,
  
  // Default impressions for unknown ad sets
  'default': 50000
};

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

module.exports = router;