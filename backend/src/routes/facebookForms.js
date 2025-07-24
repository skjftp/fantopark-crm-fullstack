// backend/src/routes/facebookForms.js
// API routes for Facebook Forms management
const express = require('express');
const router = express.Router();
const facebookFormsService = require('../services/facebookFormsService');
const auth = require('../middleware/auth');

// ==========================================
// FACEBOOK FORMS API ROUTES
// ==========================================

// GET /api/facebook-forms - Get all available lead forms
router.get('/', auth, async (req, res) => {
  try {
    console.log('📋 API: Getting Facebook lead forms...');
    
    const result = await facebookFormsService.getForms();
    
    console.log(`✅ API: Returning ${result.data?.length || 0} forms`);
    
    res.json({
      success: result.success,
      data: result.data,
      cached: result.cached,
      cacheAge: result.cacheAge,
      apiError: result.apiError,
      fallbackUsed: result.fallbackUsed,
      count: result.data?.length || 0
    });
    
  } catch (error) {
    console.error('❌ API: Error getting Facebook forms:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: []
    });
  }
});

// GET /api/facebook-forms/search?q=query - Search forms by ID or name
router.get('/search', auth, async (req, res) => {
  try {
    const query = req.query.q;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query parameter "q" is required'
      });
    }
    
    console.log(`🔍 API: Searching forms for query: "${query}"`);
    
    const result = await facebookFormsService.searchForm(query);
    
    console.log(`✅ API: Found ${result.data?.length || 0} matching forms`);
    
    res.json({
      success: result.success,
      data: result.data,
      total: result.total,
      query: query
    });
    
  } catch (error) {
    console.error('❌ API: Error searching Facebook forms:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: []
    });
  }
});

// POST /api/facebook-forms/custom - Add a custom form manually
router.post('/custom', auth, async (req, res) => {
  try {
    const { formId, formName } = req.body;
    
    if (!formId || !formName) {
      return res.status(400).json({
        success: false,
        error: 'Both formId and formName are required'
      });
    }
    
    console.log(`📝 API: Adding custom form: ${formName} (${formId})`);
    
    const result = await facebookFormsService.addCustomForm(formId, formName);
    
    if (result.success) {
      console.log(`✅ API: Custom form added successfully`);
      res.status(201).json(result);
    } else {
      console.log(`⚠️ API: Failed to add custom form: ${result.error}`);
      res.status(400).json(result);
    }
    
  } catch (error) {
    console.error('❌ API: Error adding custom form:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/facebook-forms/cache/status - Get cache status
router.get('/cache/status', auth, async (req, res) => {
  try {
    console.log('🔍 API: Getting cache status...');
    
    const status = facebookFormsService.getCacheStatus();
    
    res.json({
      success: true,
      cache: status
    });
    
  } catch (error) {
    console.error('❌ API: Error getting cache status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/facebook-forms/cache/clear - Clear cache manually
router.post('/cache/clear', auth, async (req, res) => {
  try {
    console.log('🧹 API: Clearing forms cache...');
    
    const result = facebookFormsService.clearCache();
    
    console.log('✅ API: Cache cleared successfully');
    
    res.json({
      success: true,
      message: 'Facebook forms cache cleared successfully'
    });
    
  } catch (error) {
    console.error('❌ API: Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/facebook-forms/test - Test Facebook API connection
router.get('/test', auth, async (req, res) => {
  try {
    console.log('🧪 API: Testing Facebook API connection...');
    
    const result = await facebookFormsService.testConnection();
    
    if (result.success) {
      console.log('✅ API: Facebook connection test successful');
      res.json({
        success: true,
        message: 'Facebook API connection successful',
        data: result.data
      });
    } else {
      console.log('❌ API: Facebook connection test failed');
      res.status(502).json({
        success: false,
        message: 'Facebook API connection failed',
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('❌ API: Error testing Facebook connection:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/facebook-forms/stats - Get forms statistics
router.get('/stats', auth, async (req, res) => {
  try {
    console.log('📊 API: Getting forms statistics...');
    
    const formsResult = await facebookFormsService.getForms();
    const forms = formsResult.data || [];
    
    // Calculate statistics
    const stats = {
      total: forms.length,
      bySource: {
        api: forms.filter(f => f.source === 'api').length,
        fallback: forms.filter(f => f.source === 'fallback').length,
        manual: forms.filter(f => f.source === 'manual').length,
        emergency_fallback: forms.filter(f => f.source === 'emergency_fallback').length
      },
      byStatus: {
        active: forms.filter(f => f.status === 'ACTIVE').length,
        unknown: forms.filter(f => f.status === 'UNKNOWN').length
      },
      cache: facebookFormsService.getCacheStatus()
    };
    
    console.log('✅ API: Forms statistics calculated');
    
    res.json({
      success: true,
      stats: stats,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ API: Error getting forms statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;