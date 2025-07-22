#!/usr/bin/env node

/**
 * Find missing July 21 Instagram leads
 */

const { db, collections } = require('./src/config/db');

async function findMissingJuly21Leads() {
  console.log('🔍 Finding Missing July 21 Instagram Leads\n');
  
  // Get all Instagram leads from July 20-22 to see the full picture
  const startDate = new Date('2025-07-20T00:00:00Z');
  const endDate = new Date('2025-07-22T23:59:59Z');
  
  const snapshot = await db.collection(collections.leads)
    .where('date_of_enquiry', '>=', startDate.toISOString())
    .where('date_of_enquiry', '<=', endDate.toISOString())
    .get();
  
  const instagramLeads = [];
  snapshot.forEach(doc => {
    const lead = doc.data();
    if (lead.source === 'Instagram') {
      instagramLeads.push({ id: doc.id, ...lead });
    }
  });
  
  // Group by actual date and IST date
  const byDate = {
    '2025-07-20': { utc: [], ist: [] },
    '2025-07-21': { utc: [], ist: [] },
    '2025-07-22': { utc: [], ist: [] }
  };
  
  instagramLeads.forEach(lead => {
    const enquiryDate = new Date(lead.date_of_enquiry);
    const utcDateStr = enquiryDate.toISOString().split('T')[0];
    
    // Calculate IST date
    const istDate = new Date(enquiryDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const istDateStr = `${istDate.getFullYear()}-${String(istDate.getMonth() + 1).padStart(2, '0')}-${String(istDate.getDate()).padStart(2, '0')}`;
    
    if (byDate[utcDateStr]) {
      byDate[utcDateStr].utc.push(lead);
    }
    
    if (byDate[istDateStr]) {
      byDate[istDateStr].ist.push(lead);
    }
  });
  
  console.log('📊 Instagram Lead Distribution:');
  console.log('==============================\n');
  
  Object.entries(byDate).forEach(([date, counts]) => {
    console.log(`${date}:`);
    console.log(`  UTC count: ${counts.utc.length}`);
    console.log(`  IST count: ${counts.ist.length}`);
  });
  
  // Show July 21 IST leads in detail
  console.log('\n\n📋 July 21 IST Instagram Leads:');
  console.log('================================');
  
  const july21ISTLeads = byDate['2025-07-21'].ist;
  july21ISTLeads.forEach((lead, idx) => {
    const enquiryDate = new Date(lead.date_of_enquiry);
    console.log(`\n${idx + 1}. ${lead.name}`);
    console.log(`   date_of_enquiry: ${lead.date_of_enquiry}`);
    console.log(`   UTC: ${enquiryDate.toUTCString()}`);
    console.log(`   IST: ${enquiryDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    console.log(`   Meta Lead ID: ${lead.meta_lead_id || 'N/A'}`);
  });
  
  console.log(`\nTotal July 21 IST Instagram leads: ${july21ISTLeads.length}`);
  
  // Check for leads that might be missing Meta lead IDs
  console.log('\n\n🔍 Checking for Leads Without Meta IDs:');
  console.log('======================================');
  
  const withoutMetaId = instagramLeads.filter(lead => !lead.meta_lead_id);
  if (withoutMetaId.length > 0) {
    console.log(`Found ${withoutMetaId.length} Instagram leads without Meta IDs:`);
    withoutMetaId.forEach(lead => {
      console.log(`- ${lead.name} (${lead.date_of_enquiry})`);
    });
  } else {
    console.log('All Instagram leads have Meta IDs');
  }
  
  // Check for any leads that were created on July 20-21 but have wrong dates
  console.log('\n\n🔍 Checking Created Date vs Date of Enquiry:');
  console.log('===========================================');
  
  const createdOnJuly2021 = instagramLeads.filter(lead => {
    if (!lead.created_date) return false;
    const createdDate = new Date(lead.created_date);
    const createdDateStr = createdDate.toISOString().split('T')[0];
    return createdDateStr === '2025-07-20' || createdDateStr === '2025-07-21';
  });
  
  console.log(`Found ${createdOnJuly2021.length} Instagram leads created on July 20-21`);
}

findMissingJuly21Leads()
  .then(() => {
    console.log('\n✅ Analysis complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });