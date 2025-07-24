// Test script for Facebook Forms Service
// Run with: node test-facebook-forms.js

require('dotenv').config();
const facebookFormsService = require('./src/services/facebookFormsService');

async function testFacebookFormsService() {
  console.log('🧪 Testing Facebook Forms Service...\n');
  
  try {
    // Test 1: Connection test
    console.log('1️⃣ Testing Facebook API connection...');
    const connectionTest = await facebookFormsService.testConnection();
    console.log('Connection result:', connectionTest);
    console.log('');
    
    // Test 2: Get cache status (should be empty initially)
    console.log('2️⃣ Testing cache status (should be empty)...');
    const cacheStatus = facebookFormsService.getCacheStatus();
    console.log('Cache status:', cacheStatus);
    console.log('');
    
    // Test 3: Fetch forms (first time - should hit API)
    console.log('3️⃣ Testing forms fetch (first time - should hit API)...');
    const formsResult1 = await facebookFormsService.getForms();
    console.log('Forms result 1:', {
      success: formsResult1.success,
      count: formsResult1.data.length,
      cached: formsResult1.cached,
      fallbackUsed: formsResult1.fallbackUsed,
      apiError: formsResult1.apiError
    });
    
    if (formsResult1.data.length > 0) {
      console.log('Sample forms:', formsResult1.data.slice(0, 3).map(f => ({
        id: f.id,
        name: f.name,
        source: f.source,
        status: f.status
      })));
    }
    console.log('');
    
    // Test 4: Fetch forms again (should use cache)
    console.log('4️⃣ Testing forms fetch (second time - should use cache)...');
    const formsResult2 = await facebookFormsService.getForms();
    console.log('Forms result 2:', {
      success: formsResult2.success,
      count: formsResult2.data.length,
      cached: formsResult2.cached,
      cacheAge: formsResult2.cacheAge,
      fallbackUsed: formsResult2.fallbackUsed
    });
    console.log('');
    
    // Test 5: Cache status after fetching
    console.log('5️⃣ Testing cache status after fetching...');
    const cacheStatus2 = facebookFormsService.getCacheStatus();
    console.log('Cache status after fetch:', cacheStatus2);
    console.log('');
    
    // Test 6: Search functionality
    console.log('6️⃣ Testing search functionality...');
    const searchResult = await facebookFormsService.searchForm('test');
    console.log('Search result for "test":', {
      success: searchResult.success,
      count: searchResult.data?.length || 0,
      results: searchResult.data?.slice(0, 2).map(f => ({ id: f.id, name: f.name })) || []
    });
    console.log('');
    
    // Test 7: Add custom form
    console.log('7️⃣ Testing add custom form...');
    const customFormResult = await facebookFormsService.addCustomForm('test_123456', 'Test Custom Form');
    console.log('Custom form result:', {
      success: customFormResult.success,
      error: customFormResult.error,
      formData: customFormResult.data ? {
        id: customFormResult.data.id,
        name: customFormResult.data.name,
        source: customFormResult.data.source
      } : null
    });
    console.log('');
    
    // Test 8: Clear cache
    console.log('8️⃣ Testing cache clear...');
    const clearResult = facebookFormsService.clearCache();
    console.log('Clear cache result:', clearResult);
    
    const cacheStatus3 = facebookFormsService.getCacheStatus();
    console.log('Cache status after clear:', cacheStatus3);
    console.log('');
    
    console.log('✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the tests
testFacebookFormsService();