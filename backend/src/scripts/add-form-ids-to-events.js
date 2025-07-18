const { Firestore } = require('@google-cloud/firestore');

// Initialize Firestore with project ID
const db = new Firestore({
  projectId: 'enduring-wharf-464005-h7'
});

async function addFormIdsField() {
  try {
    console.log('Adding form_ids field to events...');
    
    const eventsRef = db.collection('crm_events');
    const snapshot = await eventsRef.get();
    
    console.log(`Found ${snapshot.size} events`);
    
    let updated = 0;
    const batch = db.batch();
    
    snapshot.forEach(doc => {
      if (!doc.data().form_ids) {
        batch.update(doc.ref, {
          form_ids: [],
          updated_date: new Date().toISOString()
        });
        updated++;
      }
    });
    
    if (updated > 0) {
      await batch.commit();
      console.log(`✅ Updated ${updated} events with form_ids field`);
    } else {
      console.log('✅ All events already have form_ids field');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addFormIdsField();
