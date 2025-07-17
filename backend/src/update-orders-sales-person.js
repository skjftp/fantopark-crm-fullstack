const { db, collections } = require('../config/db');

async function updateOrdersWithSalesPerson() {
  try {
    console.log('🔄 Starting to update orders with sales_person field...');
    
    const ordersSnapshot = await db.collection(collections.orders).get();
    console.log(`Found ${ordersSnapshot.size} orders to process`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const doc of ordersSnapshot.docs) {
      const order = doc.data();
      
      // Skip if already has sales_person
      if (order.sales_person) {
        skipped++;
        continue;
      }
      
      // Determine the sales person
      let salesPerson = null;
      
      // Try created_by first
      if (order.created_by) {
        salesPerson = order.created_by;
      }
      // Check if assigned_to is NOT a finance person
      else if (order.assigned_to) {
        // List of finance team emails to exclude
        const financeTeam = ['jaya@fantopark.com', 'rishabh@fantopark.com'];
        if (!financeTeam.includes(order.assigned_to)) {
          salesPerson = order.assigned_to;
        }
      }
      
      if (salesPerson) {
        await db.collection(collections.orders).doc(doc.id).update({
          sales_person: salesPerson
        });
        updated++;
        console.log(`✅ Updated order ${doc.id} with sales_person: ${salesPerson}`);
      } else {
        console.log(`⚠️ Could not determine sales_person for order ${doc.id}`);
      }
    }
    
    console.log(`✅ Update complete! Updated: ${updated}, Skipped: ${skipped}`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error updating orders:', error);
    process.exit(1);
  }
}

// Run the update
updateOrdersWithSalesPerson();
