// Script to fix GRP Media allocation lead_id mismatch
const admin = require('./src/config/firebase');
const db = admin.firestore();

async function fixGRPMediaAllocations() {
  try {
    console.log('🔍 Finding GRP Media allocations with wrong lead_id...');
    
    // Get all allocations for GRP Media and KKR vs RCB event
    const allocationsSnapshot = await db.collection('crm_allocations')
      .where('lead_name', '==', 'GRP Media')
      .where('inventory_event', '==', 'KKR vs RCB - IPL\'25')
      .get();
    
    console.log(`Found ${allocationsSnapshot.size} allocations to fix`);
    
    const batch = db.batch();
    let fixedCount = 0;
    
    allocationsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`Allocation ${doc.id}: current lead_id = ${data.lead_id}`);
      
      // Only fix if it has the wrong lead_id
      if (data.lead_id === '5iL5SDeE3LNPyyVAA3Jc') {
        console.log(`  ✏️  Updating to correct lead_id: zVjdkJW0uaY49hCHFNsV`);
        batch.update(doc.ref, {
          lead_id: 'zVjdkJW0uaY49hCHFNsV',
          updated_date: admin.firestore.FieldValue.serverTimestamp(),
          fix_notes: 'Fixed lead_id mismatch - changed from 5iL5SDeE3LNPyyVAA3Jc to zVjdkJW0uaY49hCHFNsV for correct KKR vs RCB event matching'
        });
        fixedCount++;
      }
    });
    
    if (fixedCount > 0) {
      console.log(`🚀 Committing ${fixedCount} allocation fixes...`);
      await batch.commit();
      console.log('✅ Successfully fixed allocations');
    } else {
      console.log('ℹ️  No allocations needed fixing');
    }
    
    // Verify the fix
    console.log('🔍 Verifying fix...');
    const verifySnapshot = await db.collection('crm_allocations')
      .where('lead_name', '==', 'GRP Media')
      .where('inventory_event', '==', 'KKR vs RCB - IPL\'25')
      .get();
    
    verifySnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`✓ Allocation ${doc.id}: lead_id = ${data.lead_id}`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing allocations:', error);
  }
}

// Run the fix
fixGRPMediaAllocations().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});