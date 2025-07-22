  const { db, collections } = require('./src/config/db');
  async function checkLeadDates() {
    console.log('🔍 Checking lead dates in the database...\n');
    try {
      // Get a sample of recent leads
      const snapshot = await db.collection(collections.leads)
        .orderBy('date_of_enquiry', 'desc')
        .limit(20)
        .get();
      console.log(`📊 Sample of ${snapshot.size} most recent leads:\n`);
      const dateFormats = new Set();
      const sources = {};
      let july21Count = 0;
      snapshot.forEach(doc => {
        const lead = doc.data();
        const date = lead.date_of_enquiry;
        // Check date format
        if (date) {
          dateFormats.add(typeof date);
          // Check if it's July 21, 2025 in any format
          const dateStr = date.toString();
          if (dateStr.includes('2025-07-21') || dateStr.includes('21/07/2025') || 
  dateStr.includes('07/21/2025')) {
            july21Count++;
            console.log(`🎯 July 21 lead found: ${lead.name} - Date: ${date} - Source: 
  ${lead.source}`);
          }
        }
        
        // Count sources
        const source = lead.source || 'undefined';
        sources[source] = (sources[source] || 0) + 1;
      });
      
      // Show all dates
      console.log('\n📅 All dates found:');
      snapshot.forEach(doc => {
        const lead = doc.data();
        console.log(`  ${lead.date_of_enquiry} - ${lead.name} (${lead.source})`);
      });
      
      console.log(`\n📊 Date formats found: ${Array.from(dateFormats).join(', ')}`);
      console.log(`\n📊 Sources distribution: ${JSON.stringify(sources, null, 2)}`);
      console.log(`\n🎯 July 21, 2025 leads in this sample: ${july21Count}`);
      
      // Try different date queries
      console.log('\n🔍 Testing different date query formats...\n');
      
      // Test 1: String comparison
      const test1 = await db.collection(collections.leads)
        .where('date_of_enquiry', '>=', '2025-07-21')
        .where('date_of_enquiry', '<', '2025-07-22')
        .limit(5)
        .get();
      console.log(`Test 1 (string comparison): Found ${test1.size} leads`);
      
      // Test 2: Get all leads and filter manually
      console.log('\n🔍 Searching all leads for July 21 manually...');
      const allLeads = await db.collection(collections.leads)
        .get();
      
      let manualJuly21Count = 0;
      let july21Leads = [];
      
      allLeads.forEach(doc => {
        const lead = doc.data();
        const dateStr = (lead.date_of_enquiry || '').toString();
        
        if (dateStr.includes('2025-07-21')) {
          manualJuly21Count++;
          july21Leads.push({
            name: lead.name,
            email: lead.email,
            source: lead.source,
            date: lead.date_of_enquiry,
            campaign: lead.campaign_name
          });
        }
      });
      
      console.log(`\n✅ Total leads in database: ${allLeads.size}`);
      console.log(`🎯 July 21, 2025 leads found: ${manualJuly21Count}`);
      
      if (july21Leads.length > 0) {
        console.log('\n📋 July 21 leads details:');
        july21Leads.forEach((lead, i) => {
          console.log(`${i + 1}. ${lead.name} (${lead.email})`);
          console.log(`   Source: ${lead.source}`);
          console.log(`   Date: ${lead.date}`);
          console.log(`   Campaign: ${lead.campaign || 'N/A'}`);
        });
      }
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
  checkLeadDates();
