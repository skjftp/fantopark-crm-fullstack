#!/usr/bin/env node

/**
 * Fix webhook date conversion for leads where meta_created_time shows a different IST date
 * than what's stored in date_of_enquiry
 */

const { db, collections } = require('./src/config/db');
const { getISTDateString } = require('./src/utils/dateHelpers');

async function fixWebhookDateConversion(dryRun = true) {
  console.log(`🔧 ${dryRun ? 'DRY RUN -' : ''} Fixing webhook date conversion issues...\n`);
  
  try {
    // Query leads that have meta_created_time
    const snapshot = await db.collection(collections.leads)
      .where('meta_created_time', '!=', null)
      .get();
    
    console.log(`Found ${snapshot.size} leads with meta_created_time\n`);
    
    let needsFix = 0;
    let fixed = 0;
    const updates = [];
    
    for (const doc of snapshot.docs) {
      const lead = { id: doc.id, ...doc.data() };
      
      // Skip if no meta_created_time
      if (!lead.meta_created_time) {
        continue;
      }
      
      // Get IST date from meta_created_time
      const metaCreatedTime = lead.meta_created_time;
      const istDateFromMeta = getISTDateString(metaCreatedTime);
      
      // Get current date_of_enquiry
      const currentDateOfEnquiry = lead.date_of_enquiry;
      let currentDateOnly = '';
      
      if (currentDateOfEnquiry) {
        // Extract just the date part (YYYY-MM-DD)
        if (currentDateOfEnquiry.includes('T')) {
          currentDateOnly = currentDateOfEnquiry.split('T')[0];
        } else {
          currentDateOnly = currentDateOfEnquiry;
        }
      }
      
      // Check if they match
      if (istDateFromMeta !== currentDateOnly) {
        needsFix++;
        
        console.log(`🔍 Lead: ${lead.name} (${lead.id})`);
        console.log(`   Meta created time: ${metaCreatedTime}`);
        console.log(`   IST date from meta: ${istDateFromMeta}`);
        console.log(`   Current date_of_enquiry: ${currentDateOfEnquiry}`);
        console.log(`   Current date only: ${currentDateOnly}`);
        console.log(`   Needs fix: ${istDateFromMeta} != ${currentDateOnly}`);
        
        // Create proper date_of_enquiry with IST date but UTC time
        // We want to store the IST date at midnight UTC
        const fixedDateOfEnquiry = `${istDateFromMeta}T00:00:00.000Z`;
        
        updates.push({
          id: doc.id,
          name: lead.name,
          oldDate: currentDateOfEnquiry,
          newDate: fixedDateOfEnquiry,
          metaCreatedTime: metaCreatedTime,
          istDate: istDateFromMeta
        });
        
        if (!dryRun) {
          await doc.ref.update({
            date_of_enquiry: fixedDateOfEnquiry
          });
          fixed++;
        }
        
        console.log(`   Fixed to: ${fixedDateOfEnquiry}\n`);
      }
    }
    
    // Summary
    console.log('\n📊 Summary:');
    console.log('='.repeat(50));
    console.log(`Total leads with meta_created_time: ${snapshot.size}`);
    console.log(`Leads needing fix: ${needsFix}`);
    console.log(`Leads fixed: ${fixed}`);
    
    if (dryRun && needsFix > 0) {
      console.log('\n⚠️  This was a DRY RUN - no changes were made');
      console.log('Run fixWebhookDateConversion(false) to apply changes');
      
      // Export results
      const fs = require('fs');
      const filename = `webhook-date-fix-${Date.now()}.json`;
      fs.writeFileSync(filename, JSON.stringify({ updates }, null, 2));
      console.log(`\n📁 Fix details saved to: ${filename}`);
    } else if (!dryRun) {
      console.log('\n✅ Fixes applied successfully');
    }
    
    return {
      total: snapshot.size,
      needsFix,
      fixed,
      updates
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
}

// Run with command line arguments
const args = process.argv.slice(2);
const dryRun = args[0] !== '--apply';

fixWebhookDateConversion(dryRun)
  .then(result => {
    if (result) {
      console.log('\n✅ Process completed');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });