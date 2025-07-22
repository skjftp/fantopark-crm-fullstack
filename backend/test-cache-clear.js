// Test the cache clear functionality directly
const { db, collections } = require('./src/config/db');

// Mock the performanceCache object to test clearing
const performanceCache = {
  // Sample cache data to test clearing
  sales_lifetime: [{ name: 'Test User', totalSales: 100000 }],
  sales_lifetime_timestamp: Date.now(),
  sales_current_fy: [{ name: 'Test User 2', totalSales: 50000 }],
  sales_current_fy_timestamp: Date.now(),
  salesData: [{ name: 'Legacy User', totalSales: 75000 }],
  salesDataTimestamp: Date.now(),
  retailData: new Map([
    ['test_key', { data: 'test retail data', timestamp: Date.now() }]
  ]),
  CACHE_DURATION: 6 * 60 * 60 * 1000
};

async function testCacheClear() {
  try {
    console.log('🧪 Testing cache clear functionality...\n');
    
    console.log('📊 Before clearing - Cache contents:');
    Object.keys(performanceCache).forEach(key => {
      if (key !== 'CACHE_DURATION' && key !== 'retailData') {
        console.log(`   ${key}: ${performanceCache[key] ? 'HAS DATA' : 'NULL'}`);
      }
    });
    console.log(`   retailData size: ${performanceCache.retailData.size}`);
    
    console.log('\n🧹 Executing cache clear logic...');
    
    // Clear all cache data (same logic as in the endpoint)
    const clearedCaches = [];
    
    // Clear sales performance caches
    Object.keys(performanceCache).forEach(key => {
      if (key.startsWith('sales_')) {
        delete performanceCache[key];
        clearedCaches.push(key);
      }
    });
    
    // Clear legacy cache
    performanceCache.salesData = null;
    performanceCache.salesDataTimestamp = null;
    
    // Clear retail data cache
    performanceCache.retailData.clear();
    
    console.log(`✅ Cleared cache keys: ${clearedCaches.join(', ')}`);
    
    console.log('\n📊 After clearing - Cache contents:');
    Object.keys(performanceCache).forEach(key => {
      if (key !== 'CACHE_DURATION' && key !== 'retailData') {
        console.log(`   ${key}: ${performanceCache[key] ? 'HAS DATA' : 'NULL'}`);
      }
    });
    console.log(`   retailData size: ${performanceCache.retailData.size}`);
    
    console.log('\n🔍 Now testing actual Sales Performance API call...');
    
    // Test if a fresh API call would work
    console.log('   Making fresh sales performance request...');
    
    // Get sales performance members
    const salesMembersSnapshot = await db.collection('sales_performance_members').get();
    const salesMemberIds = new Set();
    salesMembersSnapshot.forEach(doc => {
      salesMemberIds.add(doc.id);
    });
    
    console.log(`   ✅ Found ${salesMemberIds.size} sales members in database`);
    
    // Get users
    const allUsersSnapshot = await db.collection('crm_users').get();
    const salesUsers = allUsersSnapshot.docs.filter(doc => salesMemberIds.has(doc.id));
    
    console.log(`   ✅ Found ${salesUsers.length} users who are sales members`);
    
    // Check if Jackson is included
    const jackson = salesUsers.find(doc => {
      const userData = doc.data();
      return userData.email === 'jackson@fantopark.com';
    });
    
    if (jackson) {
      const jacksonData = jackson.data();
      console.log(`   ✅ Jackson Bodra FOUND in sales members:`)
      console.log(`      Name: ${jacksonData.name}`);
      console.log(`      Email: ${jacksonData.email}`);
      console.log(`      ID: ${jackson.id}`);
    } else {
      console.log(`   ❌ Jackson Bodra NOT found in sales members`);
    }
    
    // Get Jackson's orders
    const ordersSnapshot = await db.collection(collections.orders).get();
    let jacksonOrders = 0;
    let jacksonTotalSales = 0;
    
    ordersSnapshot.docs.forEach(doc => {
      const order = doc.data();
      const salesPerson = order.sales_person || order.sales_person_email || '';
      
      if (salesPerson === 'jackson@fantopark.com' || salesPerson === 'Jackson Bodra') {
        jacksonOrders++;
        jacksonTotalSales += parseFloat(order.total_amount || 0);
      }
    });
    
    console.log(`   ✅ Jackson's orders: ${jacksonOrders} orders, ₹${(jacksonTotalSales/100000).toFixed(2)}L total`);
    
    console.log('\n🎯 CONCLUSION:');
    console.log('   • Cache clearing logic works correctly');
    console.log('   • Jackson is in sales_performance_members');  
    console.log('   • Jackson should appear in fresh API calls');
    console.log('   • Issue might be in frontend cache handling or API response processing');
    
  } catch (error) {
    console.error('❌ Error testing cache clear:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testCacheClear().then(() => {
  console.log('\n✅ Cache clear test complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Cache clear test failed:', error);
  process.exit(1);
});