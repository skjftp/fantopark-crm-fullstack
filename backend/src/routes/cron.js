const express = require('express');
const router = express.Router();
const statsAggregationService = require('../services/statsAggregationService');
const { db } = require('../config/db');

/**
 * Cron endpoint for Google Cloud Scheduler
 * This endpoint will be called every 2 hours to update stats
 */
router.post('/update-stats', async (req, res) => {
  try {
    // Verify the request is from Cloud Scheduler (optional security)
    const cronToken = req.headers['x-cloudscheduler-token'];
    const expectedToken = process.env.CRON_TOKEN;
    
    if (expectedToken && cronToken !== expectedToken) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    console.log('⏰ Cron job triggered for stats aggregation');
    
    // Check if aggregation is already running
    const runningDoc = await db.collection('crm_performance_stats').doc('running').get();
    if (runningDoc.exists && runningDoc.data().isRunning) {
      console.log('⚠️  Aggregation already running, skipping');
      return res.json({
        success: true,
        message: 'Aggregation already running, skipped'
      });
    }
    
    // Mark as running
    await db.collection('crm_performance_stats').doc('running').set({
      isRunning: true,
      startedAt: new Date().toISOString(),
      startedBy: 'cron'
    });
    
    // Run aggregation
    const startTime = Date.now();
    const stats = await statsAggregationService.aggregateAllStats();
    
    // Mark as completed
    await db.collection('crm_performance_stats').doc('running').set({
      isRunning: false,
      completedAt: new Date().toISOString(),
      processingTimeMs: Date.now() - startTime
    });
    
    res.json({
      success: true,
      message: 'Stats aggregation completed',
      processingTimeMs: Date.now() - startTime,
      timestamp: stats.timestamp
    });
    
  } catch (error) {
    console.error('❌ Cron job error:', error);
    
    // Mark as failed
    await db.collection('crm_performance_stats').doc('running').set({
      isRunning: false,
      failedAt: new Date().toISOString(),
      error: error.message
    }).catch(console.error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint for monitoring
router.get('/health', async (req, res) => {
  try {
    const statsDoc = await db.collection('crm_performance_stats').doc('latest').get();
    const runningDoc = await db.collection('crm_performance_stats').doc('running').get();
    
    const lastUpdate = statsDoc.exists ? new Date(statsDoc.data().timestamp) : null;
    const timeSinceUpdate = lastUpdate ? Date.now() - lastUpdate.getTime() : null;
    
    // Alert if stats are older than 3 hours (should update every 2 hours)
    const isHealthy = timeSinceUpdate && timeSinceUpdate < (3 * 60 * 60 * 1000);
    
    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      lastUpdate: lastUpdate ? lastUpdate.toISOString() : null,
      timeSinceUpdateMs: timeSinceUpdate,
      isRunning: runningDoc.exists ? runningDoc.data().isRunning : false,
      message: isHealthy ? 'Stats are up to date' : 'Stats are stale'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;