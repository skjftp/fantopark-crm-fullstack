const { Firestore } = require('@google-cloud/firestore');

// Use the same configuration as your backend
const db = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT
});

// Collection names matching your backend
const collections = {
  deliveries: 'crm_deliveries'
};

async function listDeliveries() {
  console.log('Listing all deliveries in the database...\n');
  
  try {
    const deliveriesRef = db.collection(collections.deliveries);
    const snapshot = await deliveriesRef.get();
    
    if (snapshot.empty) {
      console.log('No deliveries found in the database.');
      return;
    }
    
    console.log(`Found ${snapshot.size} deliveries:\n`);
    
    let oldDeliveries = [];
    let newDeliveries = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const docId = doc.id;
      
      const deliveryInfo = {
        docId: docId,
        dataId: data.id || 'NO_ID_FIELD',
        orderId: data.order_id || 'N/A',
        status: data.status || 'N/A',
        created: data.created_date || 'N/A'
      };
      
      if (data.id && data.id.startsWith('DEL-')) {
        oldDeliveries.push(deliveryInfo);
      } else {
        newDeliveries.push(deliveryInfo);
      }
    });
    
    console.log('=== OLD DELIVERIES (with DEL- prefix) ===');
    if (oldDeliveries.length === 0) {
      console.log('None found! ✅\n');
    } else {
      oldDeliveries.forEach((delivery, index) => {
        console.log(`\n${index + 1}. Document ID: ${delivery.docId}`);
        console.log(`   Data ID: ${delivery.dataId}`);
        console.log(`   Order ID: ${delivery.orderId}`);
        console.log(`   Status: ${delivery.status}`);
        console.log(`   Created: ${delivery.created}`);
      });
      console.log(`\nTotal: ${oldDeliveries.length} old deliveries\n`);
    }
    
    console.log('\n=== NEW DELIVERIES (proper Firestore IDs) ===');
    if (newDeliveries.length === 0) {
      console.log('None found.\n');
    } else {
      newDeliveries.forEach((delivery, index) => {
        console.log(`\n${index + 1}. Document ID: ${delivery.docId}`);
        console.log(`   Order ID: ${delivery.orderId}`);
        console.log(`   Status: ${delivery.status}`);
        console.log(`   Created: ${delivery.created}`);
      });
      console.log(`\nTotal: ${newDeliveries.length} new deliveries\n`);
    }
    
  } catch (error) {
    console.error('❌ Error listing deliveries:', error);
  }
}

// Run the listing
listDeliveries();
