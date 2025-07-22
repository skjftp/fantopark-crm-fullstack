#!/usr/bin/env node

/**
 * Fix leads that were double-converted to IST
 */

const { db, collections } = require('./src/config/db');

async function fixDoubleISTConversion() {
  console.log('🔧 Fixing Double IST Conversion Issue\n');
  
  // Get all leads that were converted on July 22
  const snapshot = await db.collection(collections.leads)
    .where('date_converted_to_ist', '==', true)
    .get();
  
  console.log(`Found ${snapshot.size} leads with IST conversion flag\n`);
  
  const toFix = [];
  let analyzed = 0;
  
  snapshot.forEach(doc => {
    const lead = { id: doc.id, ...doc.data() };
    analyzed++;
    
    if (lead.date_of_enquiry && lead.created_date) {
      const enquiryDate = new Date(lead.date_of_enquiry);
      const createdDate = new Date(lead.created_date);
      
      // Check if date_of_enquiry is ~5.5 hours ahead of created_date
      const diffHours = (enquiryDate - createdDate) / (1000 * 60 * 60);
      
      // If difference is between 5 and 6 hours, it's likely double-converted
      if (diffHours >= 5 && diffHours <= 6) {
        toFix.push({
          id: lead.id,
          name: lead.name,
          current_date_of_enquiry: lead.date_of_enquiry,
          created_date: lead.created_date,
          original_utc_date: lead.original_utc_date,
          diff_hours: diffHours.toFixed(2)
        });
      }
    }
  });
  
  console.log(`Analyzed ${analyzed} leads`);
  console.log(`Found ${toFix.length} leads with double IST conversion\n`);
  
  if (toFix.length > 0) {
    console.log('📋 Leads to Fix:');
    console.log('================');
    
    // Show first 10
    toFix.slice(0, 10).forEach((lead, idx) => {
      console.log(`\n${idx + 1}. ${lead.name}`);
      console.log(`   Current date_of_enquiry: ${lead.current_date_of_enquiry}`);
      console.log(`   Created date (correct): ${lead.created_date}`);
      console.log(`   Time difference: ${lead.diff_hours} hours`);
      
      // Calculate the correct date_of_enquiry
      const correctDate = lead.original_utc_date || lead.created_date;
      console.log(`   Should be: ${correctDate}`);
    });
    
    if (toFix.length > 10) {
      console.log(`\n... and ${toFix.length - 10} more leads`);
    }
    
    console.log('\n\n⚠️  Ready to fix these leads by setting date_of_enquiry = created_date');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n🔄 Fixing leads...');
    
    const batch = db.batch();
    let batchCount = 0;
    
    for (const lead of toFix) {
      const docRef = db.collection(collections.leads).doc(lead.id);
      const correctDate = lead.original_utc_date || lead.created_date;
      
      batch.update(docRef, {
        date_of_enquiry: correctDate,
        double_ist_fix_applied: true,
        double_ist_fix_date: new Date().toISOString()
      });
      
      batchCount++;
      
      if (batchCount >= 500) {
        await batch.commit();
        console.log(`  Committed batch of ${batchCount} updates`);
        batchCount = 0;
      }
    }
    
    if (batchCount > 0) {
      await batch.commit();
      console.log(`  Committed final batch of ${batchCount} updates`);
    }
    
    console.log('\n✅ Fixed double IST conversion for ' + toFix.length + ' leads');
  } else {
    console.log('✅ No leads found with double IST conversion');
  }
}

fixDoubleISTConversion()
  .then(() => {
    console.log('\n👋 Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });