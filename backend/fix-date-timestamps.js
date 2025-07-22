  const { db, collections } = require('./src/config/db');
  async function fixDateTimestamps() {
    const isDryRun = !process.argv.includes('--live');
    console.log('🔧 Fixing date timestamps for July 21 leads...');
    console.log(`📊 Mode: ${isDryRun ? 'DRY RUN' : 'LIVE UPDATE'}\n`);
    try {
      const snapshot = await db.collection(collections.leads).get();
      const batch = db.batch();
      let updateCount = 0;
      snapshot.forEach(doc => {
        const lead = doc.data();
        const dateStr = (lead.date_of_enquiry || '').toString();
        // Only fix July 21 leads that don't have time component
        if (dateStr === '2025-07-21' && lead.meta_created_time) {
          updateCount++;
          
          // Use meta_created_time for accurate timestamp
          const metaTime = lead.meta_created_time.replace('+0000', 'Z');
          
          console.log(`📅 ${lead.name}:`);
          console.log(`   Current: ${lead.date_of_enquiry}`);
          console.log(`   Will update to: ${metaTime}`);
          
          if (!isDryRun) {
            const docRef = db.collection(collections.leads).doc(doc.id);
            batch.update(docRef, {
              date_of_enquiry: metaTime,
              date_fixed: true,
              date_fix_reason: 'Updated to use Meta created_time for accurate timezone handling'
            });
          }
        }
      });
      
      console.log(`\n📊 Found ${updateCount} leads to update`);
      
      if (!isDryRun && updateCount > 0) {
        await batch.commit();
        console.log('✅ Successfully updated date timestamps');
      } else if (isDryRun) {
        console.log('\n⚠️  This was a DRY RUN - no changes made');
        console.log('Run with --live to apply changes');
      }
      
      console.log('\n💡 After this fix:');
      console.log('• All leads will have accurate timestamps from Meta');
      console.log('• Marketing reports will correctly filter by timezone');
      console.log('• Date-based analytics will be more accurate');
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
  fixDateTimestamps();
