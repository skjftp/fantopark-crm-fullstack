require('dotenv').config();
const { db } = require('./src/config/db');

async function checkStats() {
  try {
    console.log('🔍 Checking stats in Firestore...');
    
    // Check if stats exist
    const statsDoc = await db.collection('crm_performance_stats').doc('latest').get();
    
    if (!statsDoc.exists) {
      console.log('❌ No stats found! Need to run aggregation.');
      return;
    }
    
    const data = statsDoc.data();
    console.log('✅ Stats found');
    console.log('📅 Last updated:', data.timestamp);
    console.log('📊 Financials periods:', Object.keys(data.financials || {}));
    
    // Check current FY data
    if (data.financials?.current_fy) {
      const fy = data.financials.current_fy;
      console.log('\n📈 Current FY Stats:');
      console.log('  - Total Sales:', fy.totalSales);
      console.log('  - Active Sales:', fy.activeSales);
      console.log('  - Total Margin:', fy.totalMargin);
      console.log('  - Margin %:', fy.marginPercentage?.toFixed(2) + '%');
      console.log('  - Order Count:', fy.orderCount);
    }
    
    // Check current month
    if (data.financials?.current_month) {
      const month = data.financials.current_month;
      console.log('\n📅 Current Month Stats:');
      console.log('  - Total Sales:', month.totalSales);
      console.log('  - Active Sales:', month.activeSales);
      console.log('  - Total Margin:', month.totalMargin);
      console.log('  - Order Count:', month.orderCount);
    }
    
    // Check if there are any orders in the system
    const ordersSnapshot = await db.collection('crm_orders').limit(5).get();
    console.log('\n📦 Total orders in system (sample):', ordersSnapshot.size);
    
    // Check date ranges
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const fyYear = currentMonth >= 3 ? currentYear : currentYear - 1;
    
    console.log('\n📅 Date Ranges:');
    console.log('  - Current FY starts:', new Date(fyYear, 3, 1).toISOString());
    console.log('  - Current Month starts:', new Date(currentYear, currentMonth, 1).toISOString());
    
    // Sample some orders with event dates
    const ordersWithDates = await db.collection('crm_orders')
      .where('event_date', '>=', new Date(fyYear, 3, 1).toISOString())
      .limit(10)
      .get();
    
    console.log('\n📊 Orders in current FY:', ordersWithDates.size);
    ordersWithDates.forEach(doc => {
      const order = doc.data();
      console.log(`  - Order ${doc.id}: event_date=${order.event_date}, amount=${order.base_amount || order.total_amount}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
}

checkStats();