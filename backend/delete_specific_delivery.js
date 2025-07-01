const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteSpecificDelivery(documentId) {
  if (!documentId) {
    console.log('❌ Error: Please provide a document ID as an argument');
    console.log('Usage: node delete_specific_delivery.js <DOCUMENT_ID>');
    process.exit(1);
  }
  
  console.log(`Attempting to delete delivery with document ID: ${documentId}\n`);
  
  try {
    const docRef = db.collection('deliveries').doc(documentId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      console.log('❌ Error: Delivery not found with that document ID');
      return;
    }
    
    const data = doc.data();
    console.log('Found delivery:');
    console.log(`  Document ID: ${documentId}`);
    console.log(`  Data ID: ${data.id || 'N/A'}`);
    console.log(`  Order ID: ${data.order_id || 'N/A'}`);
    console.log(`  Status: ${data.status || 'N/A'}`);
    console.log(`  Created: ${data.created_date || 'N/A'}\n`);
    
    // Delete the document
    await docRef.delete();
    console.log('✅ Delivery deleted successfully!');
    
  } catch (error) {
    console.error('❌ Error deleting delivery:', error);
  } finally {
    await admin.app().delete();
    process.exit(0);
  }
}

// Get document ID from command line argument
const docId = process.argv[2];
deleteSpecificDelivery(docId);
