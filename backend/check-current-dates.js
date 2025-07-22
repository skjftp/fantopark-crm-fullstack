const { db, collections } = require('./src/config/db');

async function checkCurrentDates() {
  console.log('🔍 Checking current date values in database\n');
  
  try {
    // Get all Instagram leads
    const snapshot = await db.collection(collections.leads)
      .where('source', '==', 'Instagram')
      .get();
    
    console.log(`📊 Total Instagram leads: ${snapshot.size}\n`);
    
    // Group by date format
    const dateFormats = {};
    const july21Leads = [];
    
    snapshot.forEach(doc => {
      const lead = doc.data();
      const dateValue = lead.date_of_enquiry;
      
      // Categorize by format
      if (!dateValue) {
        dateFormats['null/undefined'] = (dateFormats['null/undefined'] || 0) + 1;
      } else if (dateValue === '2025-07-21') {
        dateFormats['plain date string'] = (dateFormats['plain date string'] || 0) + 1;
      } else if (dateValue.includes('T') && dateValue.includes('Z')) {
        dateFormats['ISO timestamp'] = (dateFormats['ISO timestamp'] || 0) + 1;
      } else {
        dateFormats['other format'] = (dateFormats['other format'] || 0) + 1;
      }
      
      // Collect July 21 leads
      if (dateValue && dateValue.toString().includes('2025-07-21')) {
        july21Leads.push({
          name: lead.name,
          date_of_enquiry: dateValue,
          date_fixed: lead.date_fixed
        });
      }
    });
    
    console.log('📋 Date formats in database:');
    Object.entries(dateFormats).forEach(([format, count]) => {
      console.log(`  ${format}: ${count} leads`);
    });
    
    console.log(`\n🎯 July 21 leads found: ${july21Leads.length}`);
    console.log('\nFirst 5 July 21 leads:');
    july21Leads.slice(0, 5).forEach((lead, i) => {
      console.log(`${i + 1}. ${lead.name}`);
      console.log(`   Value: ${lead.date_of_enquiry}`);
      console.log(`   Fixed: ${lead.date_fixed || false}`);
    });
    
    // Check how marketing report might query
    console.log('\n💡 Marketing Report Query Issue:');
    console.log('If the report is looking for exact match "2025-07-21", it will find 0 leads');
    console.log('because all dates are now full ISO timestamps like "2025-07-21T07:30:37Z"');
    
    console.log('\n🔧 SOLUTION:');
    console.log('The marketing report needs to be updated to use date range queries:');
    console.log('  For July 21 IST: >= "2025-07-20T18:30:00Z" AND < "2025-07-21T18:30:00Z"');
    console.log('  For July 21 UTC: >= "2025-07-21T00:00:00Z" AND < "2025-07-22T00:00:00Z"');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkCurrentDates();