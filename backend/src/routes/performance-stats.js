const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const statsAggregationService = require('../services/statsAggregationService');

/**
 * Performance Stats API
 * Serves pre-calculated stats from crm_performance_stats collection
 * Ultra-fast response times as data is pre-aggregated
 */

// Get financials for all periods (replaces sales-performance/all-periods for financials)
router.get('/financials', authenticateToken, async (req, res) => {
  try {
    const statsDoc = await db.collection('crm_performance_stats').doc('latest').get();
    
    if (!statsDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Stats not available. Please wait for aggregation to complete.'
      });
    }
    
    const stats = statsDoc.data();
    const financials = stats.financials;
    
    res.json({
      success: true,
      periods: {
        current_fy: financials.current_fy,
        current_month: financials.current_month,
        last_month: financials.last_month
      },
      lastUpdated: stats.lastUpdated,
      nextUpdateIn: getNextUpdateTime(stats.timestamp)
    });
    
  } catch (error) {
    console.error('Error fetching financial stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get sales performance data (replaces sales-performance endpoint)
router.get('/sales-performance', authenticateToken, async (req, res) => {
  try {
    const { period = 'lifetime' } = req.query;
    
    const statsDoc = await db.collection('crm_performance_stats').doc('latest').get();
    
    if (!statsDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Stats not available. Please wait for aggregation to complete.'
      });
    }
    
    const stats = statsDoc.data();
    const salesPerformance = stats.salesPerformance;
    
    // Transform to match existing API format
    const salesTeam = Object.values(salesPerformance).map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      target: user.target || 0,
      totalSales: user.periods[period].totalSales / 10000000, // Convert to crores
      actualizedSales: user.periods[period].actualizedSales / 10000000,
      totalMargin: user.periods[period].totalMargin / 10000000,
      actualizedMargin: user.periods[period].actualizedMargin / 10000000,
      marginPercentage: user.periods[period].marginPercentage,
      actualizedMarginPercentage: user.periods[period].actualizedMarginPercentage,
      retailPipeline: user.periods[period].retailPipeline,
      corporatePipeline: user.periods[period].corporatePipeline,
      overallPipeline: user.periods[period].overallPipeline,
      orderCount: user.periods[period].orderCount
    }));
    
    // Sort by total sales
    salesTeam.sort((a, b) => b.totalSales - a.totalSales);
    
    res.json({
      success: true,
      salesTeam,
      period,
      lastUpdated: stats.lastUpdated,
      nextUpdateIn: getNextUpdateTime(stats.timestamp),
      responseTime: 0 // Instant response
    });
    
  } catch (error) {
    console.error('Error fetching sales performance stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get retail tracker data (replaces sales-performance/retail-tracker)
router.get('/retail-tracker', authenticateToken, async (req, res) => {
  try {
    const statsDoc = await db.collection('crm_performance_stats').doc('latest').get();
    
    if (!statsDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Stats not available. Please wait for aggregation to complete.'
      });
    }
    
    const stats = statsDoc.data();
    const retailTracker = stats.retailTracker;
    
    // Transform to array format
    const retailData = Object.values(retailTracker);
    
    res.json({
      success: true,
      retailData,
      totalSystemLeads: stats.metadata.dataSourceCounts.leads,
      lastUpdated: stats.lastUpdated,
      nextUpdateIn: getNextUpdateTime(stats.timestamp),
      responseTime: 0
    });
    
  } catch (error) {
    console.error('Error fetching retail tracker stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get marketing performance data
router.get('/marketing-performance', authenticateToken, async (req, res) => {
  try {
    const statsDoc = await db.collection('crm_performance_stats').doc('latest').get();
    
    if (!statsDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Stats not available. Please wait for aggregation to complete.'
      });
    }
    
    const stats = statsDoc.data();
    const marketingPerformance = stats.marketingPerformance;
    
    res.json({
      success: true,
      sources: marketingPerformance.sources,
      campaigns: marketingPerformance.campaigns,
      lastUpdated: stats.lastUpdated,
      nextUpdateIn: getNextUpdateTime(stats.timestamp),
      responseTime: 0
    });
    
  } catch (error) {
    console.error('Error fetching marketing performance stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all stats metadata
router.get('/metadata', authenticateToken, async (req, res) => {
  try {
    const statsDoc = await db.collection('crm_performance_stats').doc('latest').get();
    
    if (!statsDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Stats not available.'
      });
    }
    
    const stats = statsDoc.data();
    
    res.json({
      success: true,
      lastUpdated: stats.lastUpdated,
      timestamp: stats.timestamp,
      nextUpdateIn: getNextUpdateTime(stats.timestamp),
      processingTimeMs: stats.metadata.processingTimeMs,
      dataSourceCounts: stats.metadata.dataSourceCounts
    });
    
  } catch (error) {
    console.error('Error fetching stats metadata:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Manual trigger for stats aggregation (admin only)
router.post('/aggregate', authenticateToken, async (req, res) => {
  try {
    // Check if user is super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Only super admin can trigger aggregation'
      });
    }
    
    // Check if aggregation is already running
    const runningDoc = await db.collection('crm_performance_stats').doc('running').get();
    if (runningDoc.exists && runningDoc.data().isRunning) {
      return res.status(409).json({
        success: false,
        error: 'Aggregation is already running'
      });
    }
    
    // Mark as running
    await db.collection('crm_performance_stats').doc('running').set({
      isRunning: true,
      startedAt: new Date().toISOString(),
      startedBy: req.user.email
    });
    
    // Run aggregation
    statsAggregationService.aggregateAllStats()
      .then(async () => {
        // Mark as completed
        await db.collection('crm_performance_stats').doc('running').set({
          isRunning: false,
          completedAt: new Date().toISOString()
        });
      })
      .catch(async (error) => {
        console.error('Aggregation error:', error);
        // Mark as failed
        await db.collection('crm_performance_stats').doc('running').set({
          isRunning: false,
          failedAt: new Date().toISOString(),
          error: error.message
        });
      });
    
    res.json({
      success: true,
      message: 'Aggregation started in background'
    });
    
  } catch (error) {
    console.error('Error triggering aggregation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function to calculate next update time
function getNextUpdateTime(lastUpdateTimestamp) {
  const lastUpdate = new Date(lastUpdateTimestamp);
  const nextUpdate = new Date(lastUpdate.getTime() + (2 * 60 * 60 * 1000)); // 2 hours
  const now = new Date();
  
  if (nextUpdate > now) {
    const diffMs = nextUpdate - now;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    
    if (diffHours > 0) {
      return `${diffHours}h ${remainingMins}m`;
    } else {
      return `${remainingMins}m`;
    }
  }
  
  return 'Due now';
}

module.exports = router;