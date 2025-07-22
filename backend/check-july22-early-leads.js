#!/usr/bin/env node

/**
 * Check early July 22 leads that might be late July 21 IST
 */

const { db, collections } = require('./src/config/db');

async function checkJuly22EarlyLeads() {
  console.log('🔍 Checking Early July 22 Leads (Late July 21 IST)\n');
  
  // Get leads from July 21 18:30 UTC to July 22 05:30 UTC
  // This covers July 22 00:00 to 11:00 IST
  const startDate = new Date('2025-07-21T18:30:00Z');
  const endDate = new Date('2025-07-22T05:30:00Z');
  
  const snapshot = await db.collection(collections.leads)
    .where('date_of_enquiry', '>=', startDate.toISOString())
    .where('date_of_enquiry', '<=', endDate.toISOString())
    .get();
  
  const instagramLeads = [];
  snapshot.forEach(doc => {
    const lead = doc.data();
    if (lead.source === 'Instagram') {
      instagramLeads.push(lead);
    }
  });
  
  console.log(`Found ${instagramLeads.length} Instagram leads from late July 21 / early July 22\n`);
  
  console.log('📋 Lead Details:');
  console.log('===============');
  
  instagramLeads.forEach((lead, idx) => {
    const enquiryDate = new Date(lead.date_of_enquiry);
    console.log(`\n${idx + 1}. ${lead.name}`);
    console.log(`   date_of_enquiry: ${lead.date_of_enquiry}`);
    console.log(`   UTC: ${enquiryDate.toUTCString()}`);
    console.log(`   IST: ${enquiryDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    console.log(`   Meta Lead ID: ${lead.meta_lead_id}`);
    console.log(`   Created By: ${lead.created_by}`);
  });
  
  // Check total Instagram leads for full July 21 IST (including late night)
  const fullJuly21Start = new Date('2025-07-20T18:30:00Z');
  const fullJuly21End = new Date('2025-07-21T18:29:59Z');
  
  const july21Snapshot = await db.collection(collections.leads)
    .where('date_of_enquiry', '>=', fullJuly21Start.toISOString())
    .where('date_of_enquiry', '<=', fullJuly21End.toISOString())
    .get();
  
  let july21InstagramCount = 0;
  july21Snapshot.forEach(doc => {
    if (doc.data().source === 'Instagram') {
      july21InstagramCount++;
    }
  });
  
  console.log('\n\n📊 Summary:');
  console.log('===========');
  console.log(`July 21 IST Instagram leads (00:00-23:59 IST): ${july21InstagramCount}`);
  console.log(`Late July 21 / Early July 22 leads shown above: ${instagramLeads.length}`);
  
  // If we extend to include more of July 22
  const extendedEnd = new Date('2025-07-22T00:00:00Z');
  const extendedSnapshot = await db.collection(collections.leads)
    .where('date_of_enquiry', '>=', fullJuly21Start.toISOString())
    .where('date_of_enquiry', '<=', extendedEnd.toISOString())
    .get();
  
  let extendedInstagramCount = 0;
  extendedSnapshot.forEach(doc => {
    if (doc.data().source === 'Instagram') {
      extendedInstagramCount++;
    }
  });
  
  console.log(`\nIf we include up to July 22 00:00 UTC (5:30 AM IST): ${extendedInstagramCount} Instagram leads`);
}

checkJuly22EarlyLeads()
  .then(() => {
    console.log('\n✅ Analysis complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });