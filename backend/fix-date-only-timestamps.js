#!/usr/bin/env node

/**
 * Fix date-only timestamps by using meta_created_time
 */

const { db, collections } = require('./src/config/db');

async function fixDateOnlyTimestamps() {
  console.log('🔧 Fixing Date-Only Timestamps\n');
  
  // Get all Instagram leads with date-only format
  const snapshot = await db.collection(collections.leads)
    .where('source', '==', 'Instagram')
    .get();
  
  const toFix = [];
  
  snapshot.forEach(doc => {
    const lead = { id: doc.id, ...doc.data() };
    
    // Check if date_of_enquiry is date-only format
    if (lead.date_of_enquiry && 
        typeof lead.date_of_enquiry === 'string' && 
        lead.date_of_enquiry.length === 10 &&
        lead.meta_created_time) {
      
      toFix.push({
        id: lead.id,
        name: lead.name,
        current_date: lead.date_of_enquiry,
        meta_created_time: lead.meta_created_time,
        created_date: lead.created_date
      });
    }
  });
  
  console.log(`Found ${toFix.length} leads with date-only format to fix\n`);
  
  if (toFix.length > 0) {
    console.log('📋 Leads to Fix:');
    console.log('================');
    
    // Show first 10
    toFix.slice(0, 10).forEach((lead, idx) => {
      const metaDate = new Date(lead.meta_created_time.replace('+0000', 'Z'));
      console.log(`\n${idx + 1}. ${lead.name}`);
      console.log(`   Current: ${lead.current_date} (date-only)`);
      console.log(`   Meta time: ${lead.meta_created_time}`);
      console.log(`   Will set to: ${metaDate.toISOString()}`);
    });
    
    if (toFix.length > 10) {
      console.log(`\n... and ${toFix.length - 10} more leads`);
    }
    
    console.log('\n\n⚠️  Ready to fix these leads using meta_created_time');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n🔄 Fixing leads...');
    
    const batch = db.batch();
    let batchCount = 0;
    let fixed = 0;
    
    for (const lead of toFix) {
      try {
        // Convert meta_created_time to proper ISO format
        let correctDate;
        if (lead.meta_created_time.includes('+0000')) {
          correctDate = new Date(lead.meta_created_time.replace('+0000', 'Z')).toISOString();
        } else {
          correctDate = new Date(lead.meta_created_time).toISOString();
        }
        
        const docRef = db.collection(collections.leads).doc(lead.id);
        batch.update(docRef, {
          date_of_enquiry: correctDate,
          date_only_fix_applied: true,
          date_only_fix_date: new Date().toISOString()
        });
        
        batchCount++;
        fixed++;
        
        if (batchCount >= 500) {
          await batch.commit();
          console.log(`  Committed batch of ${batchCount} updates`);
          batchCount = 0;
        }
      } catch (error) {
        console.error(`  Error fixing ${lead.name}: ${error.message}`);
      }
    }
    
    if (batchCount > 0) {
      await batch.commit();
      console.log(`  Committed final batch of ${batchCount} updates`);
    }
    
    console.log(`\n✅ Fixed ${fixed} leads with date-only timestamps`);
  } else {
    console.log('✅ No leads found with date-only timestamps');
  }
}

fixDateOnlyTimestamps()
  .then(() => {
    console.log('\n👋 Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });