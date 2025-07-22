#!/usr/bin/env node

const { db, collections } = require('./src/config/db');

async function updateBuyingPricesFromAllocations() {
  try {
    console.log('🔧 Updating order buying prices from allocations...\n');
    
    // Get all orders without buying price
    const ordersSnapshot = await db.collection(collections.orders).get();
    
    let ordersProcessed = 0;
    let ordersUpdated = 0;
    let ordersSkipped = 0;
    let ordersWithNoAllocations = 0;
    let errors = 0;
    
    console.log(`📊 Processing ${ordersSnapshot.size} orders...\n`);
    
    for (const orderDoc of ordersSnapshot.docs) {
      const order = orderDoc.data();
      const orderId = orderDoc.id;
      const currentBuyingPrice = parseFloat(order.buying_price || 0);
      
      // Skip if already has buying price and it's reasonable
      if (currentBuyingPrice > 0 && currentBuyingPrice < parseFloat(order.total_amount || 0)) {
        ordersSkipped++;
        continue;
      }
      
      ordersProcessed++;
      
      try {
        // Find allocations for this order
        if (!order.lead_id) {
          console.log(`⚠️  Order ${orderId} has no lead_id`);
          continue;
        }
        
        const allocationsSnapshot = await db.collection('crm_allocations')
          .where('lead_id', '==', order.lead_id)
          .get();
        
        if (allocationsSnapshot.empty) {
          ordersWithNoAllocations++;
          continue;
        }
        
        // Calculate total buying price from allocations
        let totalBuyingPrice = 0;
        let allocationsInfo = [];
        
        for (const allocDoc of allocationsSnapshot.docs) {
          const allocation = allocDoc.data();
          
          // Check if allocation matches the order's event (if possible)
          if (order.event_name && allocation.inventory_event && 
              allocation.inventory_event !== order.event_name) {
            continue;
          }
          
          let allocationBuyingPrice = 0;
          
          // Use total_buying_price if available
          if (allocation.total_buying_price) {
            allocationBuyingPrice = parseFloat(allocation.total_buying_price || 0);
          } else if (allocation.buying_price_per_ticket && allocation.tickets_allocated) {
            // Calculate from per-ticket price
            allocationBuyingPrice = parseFloat(allocation.buying_price_per_ticket) * parseInt(allocation.tickets_allocated);
          }
          
          if (allocationBuyingPrice > 0) {
            totalBuyingPrice += allocationBuyingPrice;
            allocationsInfo.push({
              park: allocation.park_name || allocation.inventory_event || 'Unknown',
              tickets: allocation.tickets_allocated || 0,
              buyingPrice: allocationBuyingPrice,
              category: allocation.category_name || 'N/A'
            });
          }
        }
        
        // Update order if we found buying prices
        if (totalBuyingPrice > 0) {
          await db.collection(collections.orders).doc(orderId).update({
            buying_price: totalBuyingPrice,
            buying_price_updated_from_allocations: true,
            buying_price_update_date: new Date().toISOString()
          });
          
          console.log(`✅ Updated order ${orderId}:`);
          console.log(`   Customer: ${order.customer_name || order.client_name || order.lead_name || 'N/A'}`);
          console.log(`   Sales Person: ${order.sales_person || order.created_by || 'N/A'}`);
          console.log(`   Event: ${order.event_name || 'N/A'}`);
          console.log(`   Total Amount: ₹${(order.total_amount || 0).toLocaleString()}`);
          console.log(`   Previous Buying Price: ₹${currentBuyingPrice.toLocaleString()}`);
          console.log(`   New Buying Price: ₹${totalBuyingPrice.toLocaleString()}`);
          console.log(`   Margin: ₹${((order.base_amount || order.total_amount || 0) - totalBuyingPrice).toLocaleString()}`);
          console.log(`   Allocations:`, allocationsInfo);
          console.log('');
          
          ordersUpdated++;
        } else if (allocationsInfo.length > 0) {
          console.log(`⚠️  Order ${orderId} has allocations but no buying prices`);
          console.log(`   Customer: ${order.customer_name || order.lead_name || 'N/A'}`);
          console.log(`   Allocations:`, allocationsInfo);
          console.log('');
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
    console.log(`Orders already with good buying price: ${ordersSkipped}`);
    console.log(`Orders processed: ${ordersProcessed}`);
    console.log(`Orders updated: ${ordersUpdated}`);
    console.log(`Orders with no allocations: ${ordersWithNoAllocations}`);
    console.log(`Errors: ${errors}`);
    console.log('\n✅ Update complete!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
  
  process.exit(0);
}

updateBuyingPricesFromAllocations();