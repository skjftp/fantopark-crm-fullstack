// backend/src/routes/marketRates.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const marketRateService = require('../services/marketRateService');

// Middleware to check inventory read permission
const checkInventoryPermission = (req, res, next) => {
  if (!req.user.permissions?.inventory?.read) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

// Get market rates for an event
router.get('/:inventoryId', authenticateToken, checkInventoryPermission, async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { eventName, alternativeName, partners } = req.query;
    
    if (!eventName) {
      return res.status(400).json({ error: 'Event name is required' });
    }

    console.log(`📊 Fetching market rates for event: ${eventName}`);
    
    // Parse partners if provided
    const partnerList = partners ? partners.split(',') : ['xs2event'];
    
    // Fetch market rates
    const results = await marketRateService.fetchMarketRates(eventName, {
      partners: partnerList,
      alternativeName
    });

    res.json({
      success: true,
      inventoryId,
      eventName,
      alternativeName,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching market rates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch market rates',
      message: error.message 
    });
  }
});

// Search with custom parameters
router.post('/search', authenticateToken, checkInventoryPermission, async (req, res) => {
  try {
    const { eventName, alternativeName, partners = ['xs2event'] } = req.body;
    
    if (!eventName) {
      return res.status(400).json({ error: 'Event name is required' });
    }

    const results = await marketRateService.fetchMarketRates(eventName, {
      partners,
      alternativeName
    });

    res.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in market rate search:', error);
    res.status(500).json({ 
      error: 'Search failed',
      message: error.message 
    });
  }
});

// Get rate limit status
router.get('/status/rate-limits', authenticateToken, checkInventoryPermission, async (req, res) => {
  try {
    const { partner = 'xs2event' } = req.query;
    
    const status = marketRateService.getRateLimitStatus(partner);
    
    res.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting rate limit status:', error);
    res.status(500).json({ 
      error: 'Failed to get rate limit status',
      message: error.message 
    });
  }
});

// Clear cache (admin only)
router.post('/cache/clear', authenticateToken, async (req, res) => {
  try {
    // Check if user has admin permissions
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { eventName } = req.body;
    
    marketRateService.clearCache(eventName);
    
    res.json({
      success: true,
      message: eventName ? `Cache cleared for event: ${eventName}` : 'All cache cleared',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ 
      error: 'Failed to clear cache',
      message: error.message 
    });
  }
});

module.exports = router;
