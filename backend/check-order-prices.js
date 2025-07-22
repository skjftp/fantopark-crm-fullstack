#!/usr/bin/env node

const { db, collections } = require('./src/config/db');

async function checkOrderPrices() {
  try {
    console.log('🔍 Checking order prices...\n');
    
    // Get last 10 orders
    const ordersSnapshot = await db.collection('crm_orders')
      .orderBy('created_date', 'desc')
      .limit(10)
      .get();
    
    console.log(`Found ${ordersSnapshot.size} recent orders\n`);
    
    ordersSnapshot.forEach(doc => {
      const order = doc.data();
      
      // Extract pricing fields
      const totalAmount = parseFloat(order.total_amount || 0);
      const baseAmount = parseFloat(order.base_amount || 0);
      const buyingPrice = parseFloat(order.buying_price || 0);
      const buyingPriceInclusions = parseFloat(order.buying_price_inclusions || 0);
      const totalBuyingPrice = buyingPrice + buyingPriceInclusions;
      
      // Calculate margin
      const sellingPrice = baseAmount || totalAmount;
      const margin = sellingPrice - totalBuyingPrice;
      
      console.log(`Order ID: ${doc.id}`);
      console.log(`Customer: ${order.customer_name || 'N/A'}`);
      console.log(`Sales Person: ${order.sales_person || order.created_by || 'N/A'}`);
      console.log(`Total Amount: ₹${totalAmount.toLocaleString()}`);
      console.log(`Base Amount: ₹${baseAmount.toLocaleString()}`);
      console.log(`Buying Price (Tickets): ₹${buyingPrice.toLocaleString()}`);
      console.log(`Buying Price (Inclusions): ₹${buyingPriceInclusions.toLocaleString()}`);
      console.log(`Total Buying Price: ₹${totalBuyingPrice.toLocaleString()}`);
      console.log(`Selling Price Used: ₹${sellingPrice.toLocaleString()}`);
      console.log(`Calculated Margin: ₹${margin.toLocaleString()}`);
      console.log(`Margin %: ${sellingPrice > 0 ? ((margin / sellingPrice) * 100).toFixed(2) : 0}%`);
      
      // Check allocations if they exist
      if (order.allocations && order.allocations.length > 0) {
        console.log(`\n  Allocations (${order.allocations.length}):`);
        let totalAllocBuyingPrice = 0;
        order.allocations.forEach((alloc, idx) => {
          const allocBuyingPrice = parseFloat(alloc.buying_price || 0);
          totalAllocBuyingPrice += allocBuyingPrice;
          console.log(`    ${idx + 1}. Park: ${alloc.park_name || 'N/A'}, Buying Price: ₹${allocBuyingPrice.toLocaleString()}`);
        });
        console.log(`    Total from allocations: ₹${totalAllocBuyingPrice.toLocaleString()}`);
      }
      
      console.log('\n' + '-'.repeat(80) + '\n');
    });
    
    // Also check aggregated stats
    console.log('\n📊 AGGREGATED STATS:\n');
    
    let ordersWithBuyingPrice = 0;
    let ordersWithoutBuyingPrice = 0;
    let ordersWithInclusions = 0;
    
    const allOrdersSnapshot = await db.collection('crm_orders').get();
    
    allOrdersSnapshot.forEach(doc => {
      const order = doc.data();
      const buyingPrice = parseFloat(order.buying_price || 0);
      const buyingPriceInclusions = parseFloat(order.buying_price_inclusions || 0);
      
      if (buyingPrice > 0) {
        ordersWithBuyingPrice++;
      } else {
        ordersWithoutBuyingPrice++;
      }
      
      if (buyingPriceInclusions > 0) {
        ordersWithInclusions++;
      }
    });
    
    console.log(`Total Orders: ${allOrdersSnapshot.size}`);
    console.log(`Orders WITH buying_price > 0: ${ordersWithBuyingPrice} (${((ordersWithBuyingPrice / allOrdersSnapshot.size) * 100).toFixed(1)}%)`);
    console.log(`Orders WITHOUT buying_price: ${ordersWithoutBuyingPrice} (${((ordersWithoutBuyingPrice / allOrdersSnapshot.size) * 100).toFixed(1)}%)`);
    console.log(`Orders WITH inclusions price > 0: ${ordersWithInclusions} (${((ordersWithInclusions / allOrdersSnapshot.size) * 100).toFixed(1)}%)`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

checkOrderPrices();