const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function cleanupOldDeliveries() {
  console.log('Starting cleanup of old deliveries with DEL- prefixes...\n');
  
  try {
    // Get all deliveries
    const deliveriesRef = db.collection('deliveries');
    const snapshot = await deliveriesRef.get();
    
    if (snapshot.empty) {
      console.log('No deliveries found in the database.');
      return;
    }
    
    console.log(`Found ${snapshot.size} total deliveries\n`);
    
    let deleteCount = 0;
    let keepCount = 0;
    const deletePromises = [];
    
    // Check each delivery
    snapshot.forEach(doc => {
      const data = doc.data();
      const docId = doc.id;
      
      // Check if the document has an 'id' field with DEL- prefix
      if (data.id && data.id.startsWith('DEL-')) {
        console.log(`Found old delivery to delete:`);
        console.log(`  Document ID: ${docId}`);
        console.log(`  Old ID field: ${data.id}`);
        console.log(`  Order ID: ${data.order_id || 'N/A'}`);
        console.log(`  Status: ${data.status || 'N/A'}`);
        console.log(`  Created: ${data.created_date || 'N/A'}\n`);
        
        // Add to delete queue
        deletePromises.push(doc.ref.delete());
        deleteCount++;
      } else {
        keepCount++;
      }
    });
    
    if (deleteCount === 0) {
      console.log('✅ No old deliveries with DEL- prefixes found. Database is clean!');
      return;
    }
    
    // Confirm before deleting
    console.log(`\nSummary:`);
    console.log(`- Deliveries to delete: ${deleteCount}`);
    console.log(`- Deliveries to keep: ${keepCount}`);
    console.log(`\nDeleting ${deleteCount} old deliveries...`);
    
    // Execute all deletes
    await Promise.all(deletePromises);
    
    console.log(`\n✅ Successfully deleted ${deleteCount} old deliveries!`);
    console.log(`✅ ${keepCount} deliveries remain in the database.`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    // Terminate the admin app
    await admin.app().delete();
    process.exit(0);
  }
}

// Run the cleanup
cleanupOldDeliveries();
