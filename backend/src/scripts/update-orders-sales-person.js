// Load environment variables
require('dotenv').config();

// Initialize Firebase Admin
const admin = require('firebase-admin');

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || 'enduring-wharf-464005-h7'
  });
}

const db = admin.firestore();

async function updateOrdersWithSalesPerson() {
  try {
    console.log('🔄 Starting to update orders with sales_person field...');
    
    // Use the correct collection name
    const ordersSnapshot = await db.collection('crm_orders').get();
    console.log(`Found ${ordersSnapshot.size} orders to process`);
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const doc of ordersSnapshot.docs) {
      try {
        const order = doc.data();
        
        // Skip if already has sales_person
        if (order.sales_person) {
          skipped++;
          console.log(`⏭️ Skipped order ${doc.id} - already has sales_person`);
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
          const financeTeam = ['jaya@fantopark.com', 'rishabh@fantopark.com'];
          if (!financeTeam.includes(order.assigned_to)) {
            salesPerson = order.assigned_to;
          }
        }
        
        if (salesPerson) {
          await db.collection('crm_orders').doc(doc.id).update({
            sales_person: salesPerson
          });
          updated++;
          console.log(`✅ Updated order ${doc.id} with sales_person: ${salesPerson}`);
        } else {
          console.log(`⚠️ Could not determine sales_person for order ${doc.id}`);
          errors++;
        }
      } catch (docError) {
        console.error(`❌ Error processing order ${doc.id}:`, docError.message);
        errors++;
      }
    }
    
    console.log('\n📊 Update Summary:');
    console.log(`✅ Updated: ${updated} orders`);
    console.log(`⏭️ Skipped: ${skipped} orders (already had sales_person)`);
    console.log(`⚠️ Errors: ${errors} orders`);
    console.log('\n✅ Update complete!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error updating orders:', error);
    process.exit(1);
  }
}

// Run the update
updateOrdersWithSalesPerson();
