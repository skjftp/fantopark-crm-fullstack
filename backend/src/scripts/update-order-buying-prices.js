const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || 'enduring-wharf-464005-h7'
  });
}

const db = admin.firestore();

async function updateOrderBuyingPrices() {
  console.log('Starting to update order buying prices from allocations...');
  
  try {
    // Get all orders
    const ordersSnapshot = await db.collection('crm_orders').get();
    console.log(`Found ${ordersSnapshot.size} orders to process`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const orderDoc of ordersSnapshot.docs) {
      const order = orderDoc.data();
      const orderId = orderDoc.id;
      
      try {
        // Find allocations for this order's lead and event
        const allocationsSnapshot = await db.collection('crm_allocations')
          .where('lead_id', '==', order.lead_id)
          .where('inventory_event', '==', order.event_name)
          .get();
        
        if (allocationsSnapshot.empty) {
          console.log(`No allocations found for order ${orderId} (Lead: ${order.lead_name}, Event: ${order.event_name})`);
          continue;
        }
        
        // Calculate total buying price from allocations
        let totalBuyingPrice = 0;
        let totalAllocatedTickets = 0;
        
        for (const allocationDoc of allocationsSnapshot.docs) {
          const allocation = allocationDoc.data();
          
          // If allocation already has buying price info
          if (allocation.total_buying_price) {
            totalBuyingPrice += parseFloat(allocation.total_buying_price) || 0;
            totalAllocatedTickets += parseInt(allocation.tickets_allocated) || 0;
          } else {
            // Need to get buying price from inventory
            const inventoryId = allocation.inventory_id;
            if (inventoryId) {
              const inventoryDoc = await db.collection('crm_inventory').doc(inventoryId).get();
              
              if (inventoryDoc.exists) {
                const inventory = inventoryDoc.data();
                let buyingPricePerTicket = 0;
                
                // Check if categorized inventory
                if (inventory.categories && Array.isArray(inventory.categories)) {
                  const category = inventory.categories.find(cat => cat.name === allocation.category_name);
                  if (category) {
                    buyingPricePerTicket = parseFloat(category.buying_price) || 0;
                  }
                } else {
                  // Legacy inventory
                  buyingPricePerTicket = parseFloat(inventory.buying_price) || 0;
                }
                
                const allocationBuyingPrice = buyingPricePerTicket * (parseInt(allocation.tickets_allocated) || 0);
                totalBuyingPrice += allocationBuyingPrice;
                totalAllocatedTickets += parseInt(allocation.tickets_allocated) || 0;
                
                // Update allocation with buying price info
                await db.collection('crm_allocations').doc(allocationDoc.id).update({
                  buying_price_per_ticket: buyingPricePerTicket,
                  total_buying_price: allocationBuyingPrice,
                  updated_date: new Date().toISOString()
                });
                
                console.log(`Updated allocation ${allocationDoc.id} with buying price: ${buyingPricePerTicket} per ticket`);
              }
            }
          }
        }
        
        // Update order with calculated buying price
        const updateData = {
          buying_price: totalBuyingPrice,
          total_allocated_tickets: totalAllocatedTickets,
          updated_date: new Date().toISOString(),
          buying_price_updated_from_allocations: true
        };
        
        await db.collection('crm_orders').doc(orderId).update(updateData);
        
        console.log(`✅ Updated order ${orderId} (${order.lead_name}): Buying price = ₹${totalBuyingPrice}, Tickets = ${totalAllocatedTickets}`);
        updatedCount++;
        
      } catch (error) {
        console.error(`❌ Error processing order ${orderId}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n=== Summary ===');
    console.log(`Total orders processed: ${ordersSnapshot.size}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Skipped (no allocations): ${ordersSnapshot.size - updatedCount - errorCount}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    // Exit the process
    process.exit(0);
  }
}

// Run the update
updateOrderBuyingPrices();