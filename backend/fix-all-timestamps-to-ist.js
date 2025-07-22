const { db, collections } = require('./src/config/db');

async function convertUTCtoIST(utcDateStr) {
  try {
    // Handle various date formats
    let dateToConvert = utcDateStr;
    
    // If it's just a date (YYYY-MM-DD), add time
    if (dateToConvert.length === 10) {
      dateToConvert = `${dateToConvert}T00:00:00Z`;
    }
    
    // If it has +0000, replace with Z
    if (dateToConvert.includes('+0000')) {
      dateToConvert = dateToConvert.replace('+0000', 'Z');
    }
    
    // If it doesn't end with Z and has T, add Z
    if (dateToConvert.includes('T') && !dateToConvert.endsWith('Z')) {
      dateToConvert = dateToConvert + 'Z';
    }
    
    const utcDate = new Date(dateToConvert);
    
    // Check if date is valid
    if (isNaN(utcDate.getTime())) {
      console.warn(`⚠️  Invalid date: ${utcDateStr}`);
      return utcDateStr; // Return original if can't parse
    }
    
    const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
    return istDate.toISOString();
  } catch (error) {
    console.warn(`⚠️  Error converting date ${utcDateStr}:`, error.message);
    return utcDateStr;
  }
}

async function fixAllTimestampsToIST() {
  const isDryRun = !process.argv.includes('--live');
  
  console.log('🔧 Converting all timestamps to IST (July 15 - present)...');
  console.log(`📊 Mode: ${isDryRun ? 'DRY RUN' : 'LIVE UPDATE'}\n`);
  
  try {
    // Get all leads from July 15 onwards
    const startDate = '2025-07-15';
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`📅 Date range: ${startDate} to ${today}\n`);
    
    const snapshot = await db.collection(collections.leads).get();
    const batch = db.batch();
    
    let stats = {
      total: 0,
      needsUpdate: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      byDate: {},
      bySource: {}
    };
    
    const updates = [];
    
    for (const doc of snapshot.docs) {
      const lead = doc.data();
      const dateStr = (lead.date_of_enquiry || '').toString();
      
      // Skip if no date
      if (!dateStr) {
        continue;
      }
      
      // Skip if already converted
      if (lead.date_converted_to_ist === true) {
        stats.skipped++;
        continue;
      }
      
      // Extract just the date part for comparison
      const datePart = dateStr.substring(0, 10);
      
      // Check if date is in our range
      if (datePart >= startDate && datePart <= today) {
        stats.total++;
        
        // Count by source
        const source = lead.source || 'Unknown';
        stats.bySource[source] = (stats.bySource[source] || 0) + 1;
        
        // Check if this needs IST conversion
        let needsUpdate = false;
        let newDate = dateStr;
        
        try {
          // If it's already an ISO timestamp with Z (UTC), convert to IST
          if (dateStr.includes('T') && (dateStr.endsWith('Z') || dateStr.includes('+0000'))) {
            // This is UTC, needs conversion
            needsUpdate = true;
            newDate = await convertUTCtoIST(dateStr);
          } else if (dateStr.length === 10) {
            // This is just a date (YYYY-MM-DD), needs proper timestamp
            if (lead.meta_created_time) {
              // Use meta_created_time if available
              newDate = await convertUTCtoIST(lead.meta_created_time);
              needsUpdate = true;
            } else {
              // Default to noon IST (6:30 AM UTC)
              newDate = await convertUTCtoIST(`${dateStr}T06:30:00Z`);
              needsUpdate = true;
            }
          }
          
          if (needsUpdate && newDate !== dateStr) {
            stats.needsUpdate++;
            
            const istDate = new Date(newDate);
            const istDateOnly = istDate.toISOString().split('T')[0];
            
            // Count by IST date
            stats.byDate[istDateOnly] = (stats.byDate[istDateOnly] || 0) + 1;
            
            updates.push({
              id: doc.id,
              name: lead.name,
              oldDate: dateStr,
              newDate: newDate,
              source: lead.source
            });
            
            if (!isDryRun && updates.length <= 500) { // Firestore batch limit
              const docRef = db.collection(collections.leads).doc(doc.id);
              batch.update(docRef, {
                date_of_enquiry: newDate,
                date_converted_to_ist: true,
                date_conversion_date: new Date().toISOString(),
                original_utc_date: dateStr
              });
            }
          }
        } catch (error) {
          console.warn(`⚠️  Error processing lead ${lead.name}:`, error.message);
          stats.errors++;
        }
      }
    }
    
    // Show preview of changes
    console.log(`📊 Analysis Complete:`);
    console.log(`   Total leads in date range: ${stats.total}`);
    console.log(`   Leads needing IST conversion: ${stats.needsUpdate}`);
    console.log(`   Already converted (skipped): ${stats.skipped}`);
    console.log(`   Errors: ${stats.errors}`);
    console.log('');
    
    if (stats.needsUpdate > 0) {
      console.log('📅 Leads by Date (after conversion):');
      Object.entries(stats.byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([date, count]) => {
          console.log(`   ${date}: ${count} leads`);
        });
      
      console.log('\n📊 Leads by Source:');
      Object.entries(stats.bySource).forEach(([source, count]) => {
        console.log(`   ${source}: ${count} leads`);
      });
      
      console.log('\n🔄 Sample of changes (first 10):');
      updates.slice(0, 10).forEach((update, i) => {
        console.log(`\n${i + 1}. ${update.name} (${update.source})`);
        console.log(`   Old: ${update.oldDate}`);
        console.log(`   New: ${update.newDate}`);
        try {
          const oldDate = new Date(update.oldDate.includes('T') ? update.oldDate : `${update.oldDate}T00:00:00Z`);
          const newDate = new Date(update.newDate);
          console.log(`   UTC date: ${oldDate.toISOString().split('T')[0]} → IST date: ${newDate.toISOString().split('T')[0]}`);
        } catch (e) {
          // Ignore date parsing errors in display
        }
      });
      
      if (!isDryRun) {
        if (updates.length > 500) {
          console.log(`\n⚠️  Too many updates (${updates.length}). Processing first 500 only.`);
          console.log('Run the script again to process remaining leads.');
        }
        
        console.log('\n🚀 Applying updates...');
        await batch.commit();
        stats.updated = Math.min(updates.length, 500);
        console.log(`✅ Successfully updated ${stats.updated} leads to IST timestamps`);
      } else {
        console.log('\n⚠️  This was a DRY RUN - no changes made');
        console.log('Run with --live to apply changes');
      }
    } else {
      console.log('✅ No leads need timestamp conversion');
    }
    
    console.log('\n💡 Impact:');
    console.log('• All dates will be stored in IST');
    console.log('• Marketing reports will show correct data when filtering by date');
    console.log('• No timezone confusion between UTC and IST');
    console.log('• Future leads from webhooks will automatically be in IST');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

fixAllTimestampsToIST();