#!/usr/bin/env node

const { db, collections } = require('./src/config/db');

async function fixOrderBuyingPrices() {
  try {
    console.log('🔧 Starting to fix order buying prices...\n');
    
    // Get all orders
    const ordersSnapshot = await db.collection(collections.orders).get();
    console.log(`📊 Found ${ordersSnapshot.size} total orders\n`);
    
    let ordersWithoutBuyingPrice = 0;
    let ordersFixed = 0;
    let ordersWithAllocations = 0;
    let ordersWithoutAllocations = 0;
    let errors = 0;
    
    for (const orderDoc of ordersSnapshot.docs) {
      const order = orderDoc.data();
      const orderId = orderDoc.id;
      const currentBuyingPrice = parseFloat(order.buying_price || 0);
      
      // Skip if already has buying price
      if (currentBuyingPrice > 0) {
        continue;
      }
      
      ordersWithoutBuyingPrice++;
      
      try {
        // Check if order has allocations array
        if (order.allocations && Array.isArray(order.allocations) && order.allocations.length > 0) {
          ordersWithAllocations++;
          
          // Calculate total buying price from allocations
          let totalBuyingPrice = 0;
          let debugInfo = [];
          
          for (const allocation of order.allocations) {
            const allocBuyingPrice = parseFloat(allocation.buying_price || 0);
            totalBuyingPrice += allocBuyingPrice;
            
            debugInfo.push({
              park: allocation.park_name || 'Unknown',
              tickets: allocation.tickets || 0,
              buyingPrice: allocBuyingPrice
            });
          }
          
          if (totalBuyingPrice > 0) {
            // Update the order with the calculated buying price
            await db.collection(collections.orders).doc(orderId).update({
              buying_price: totalBuyingPrice,
              buying_price_updated_from_allocations: true,
              buying_price_update_date: new Date().toISOString()
            });
            
            console.log(`✅ Fixed order ${orderId}:`);
            console.log(`   Customer: ${order.customer_name || 'N/A'}`);
            console.log(`   Sales Person: ${order.sales_person || order.created_by || 'N/A'}`);
            console.log(`   Total Amount: ₹${order.total_amount || 0}`);
            console.log(`   New Buying Price: ₹${totalBuyingPrice}`);
            console.log(`   Allocations:`, debugInfo);
            console.log('');
            
            ordersFixed++;
          }
        } else {
          // No allocations in order document
          ordersWithoutAllocations++;
          
          // Try to find allocations in separate collection if lead_id exists
          if (order.lead_id && order.event_name) {
            const allocationsSnapshot = await db.collection('crm_allocations')
              .where('lead_id', '==', order.lead_id)
              .where('inventory_event', '==', order.event_name)
              .get();
            
            if (!allocationsSnapshot.empty) {
              console.log(`⚠️  Order ${orderId} has no allocations array but found ${allocationsSnapshot.size} allocations in separate collection`);
              console.log(`   Lead: ${order.lead_name || order.customer_name || 'N/A'}`);
              console.log(`   Event: ${order.event_name}`);
              console.log(`   This order needs manual review or migration of allocations\n`);
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error processing order ${orderId}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY:');
    console.log('='.repeat(80));
    console.log(`Total orders: ${ordersSnapshot.size}`);
    console.log(`Orders without buying_price: ${ordersWithoutBuyingPrice}`);
    console.log(`Orders with allocations array: ${ordersWithAllocations}`);
    console.log(`Orders without allocations array: ${ordersWithoutAllocations}`);
    console.log(`Orders fixed: ${ordersFixed}`);
    console.log(`Errors: ${errors}`);
    console.log('\n✅ Fix complete!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
  
  process.exit(0);
}

fixOrderBuyingPrices();