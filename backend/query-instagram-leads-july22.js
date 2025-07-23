#!/usr/bin/env node

/**
 * Query Instagram leads for July 22nd, 2025, grouped by ad set
 */

const { db, collections } = require('./src/config/db');

async function queryInstagramLeadsJuly22() {
  console.log('📱 Instagram Leads Report - July 22nd, 2025');
  console.log('=' .repeat(50));
  console.log();
  
  // Define the date range for July 22nd, 2025
  // Using UTC start/end to ensure we capture all leads regardless of timezone
  const startDate = new Date('2025-07-22T00:00:00Z');
  const endDate = new Date('2025-07-22T23:59:59Z');
  
  console.log(`Date Range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
  console.log();
  
  try {
    // Query leads with source = 'Instagram' and date_of_enquiry on July 22nd
    const snapshot = await db.collection(collections.leads)
      .where('source', '==', 'Instagram')
      .where('date_of_enquiry', '>=', startDate.toISOString())
      .where('date_of_enquiry', '<=', endDate.toISOString())
      .get();
    
    if (snapshot.empty) {
      console.log('❌ No Instagram leads found for July 22nd, 2025');
      return;
    }
    
    // Group leads by ad set
    const adSetGroups = {};
    const allLeads = [];
    
    snapshot.forEach(doc => {
      const lead = { id: doc.id, ...doc.data() };
      allLeads.push(lead);
      
      // Get ad set name (check both ad_set and adset_name fields)
      const adSetName = lead.ad_set || lead.adset_name || lead.ad_set_name || 'Unknown Ad Set';
      
      if (!adSetGroups[adSetName]) {
        adSetGroups[adSetName] = [];
      }
      
      adSetGroups[adSetName].push({
        name: lead.name || 'N/A',
        phone: lead.phone || lead.mobile || 'N/A',
        email: lead.email || 'N/A',
        date: lead.date_of_enquiry,
        campaign: lead.campaign_name || 'N/A',
        form: lead.form_name || 'N/A'
      });
    });
    
    // Sort ad sets by count (descending)
    const sortedAdSets = Object.entries(adSetGroups)
      .sort((a, b) => b[1].length - a[1].length);
    
    // Display results
    console.log(`📊 Total Instagram Leads: ${allLeads.length}`);
    console.log(`📋 Total Ad Sets: ${sortedAdSets.length}`);
    console.log();
    console.log('-'.repeat(80));
    
    // Display each ad set with its leads
    sortedAdSets.forEach(([adSetName, leads], index) => {
      console.log();
      console.log(`${index + 1}. Ad Set: "${adSetName}"`);
      console.log(`   Count: ${leads.length} leads`);
      console.log();
      console.log('   Leads:');
      
      leads.forEach((lead, leadIndex) => {
        console.log(`   ${leadIndex + 1}. Name: ${lead.name}`);
        console.log(`      Phone: ${lead.phone}`);
        console.log(`      Email: ${lead.email}`);
        console.log(`      Campaign: ${lead.campaign}`);
        console.log(`      Form: ${lead.form}`);
        console.log(`      Time: ${new Date(lead.date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
        console.log();
      });
      
      console.log('-'.repeat(80));
    });
    
    // Summary statistics
    console.log();
    console.log('📈 Summary Statistics:');
    console.log('===================');
    console.log(`Total Instagram Leads: ${allLeads.length}`);
    console.log(`Number of Ad Sets: ${sortedAdSets.length}`);
    console.log(`Average Leads per Ad Set: ${(allLeads.length / sortedAdSets.length).toFixed(2)}`);
    console.log();
    
    // Top 5 ad sets
    console.log('🏆 Top 5 Ad Sets by Lead Count:');
    sortedAdSets.slice(0, 5).forEach(([adSetName, leads], index) => {
      console.log(`${index + 1}. "${adSetName}" - ${leads.length} leads`);
    });
    
    // Export to CSV format
    console.log();
    console.log('📄 CSV Export (copy below for spreadsheet):');
    console.log('Ad Set,Lead Count,Names,Phones');
    sortedAdSets.forEach(([adSetName, leads]) => {
      const names = leads.map(l => l.name).join('; ');
      const phones = leads.map(l => l.phone).join('; ');
      console.log(`"${adSetName}",${leads.length},"${names}","${phones}"`);
    });
    
  } catch (error) {
    console.error('❌ Error querying leads:', error);
    throw error;
  }
}

// Run the query
queryInstagramLeadsJuly22()
  .then(() => {
    console.log();
    console.log('✅ Query completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });