#!/usr/bin/env node

/**
 * Debug why marketing performance shows 20 Instagram leads instead of 17
 */

const { db, collections } = require('./src/config/db');
const { formatDateForQuery } = require('./src/utils/dateHelpers');

async function debugJuly21Marketing() {
  console.log('🔍 Debugging July 21 Marketing Performance Count\n');
  
  // Test different date filtering approaches
  const date_from = '2025-07-21';
  const date_to = '2025-07-21';
  
  console.log('📅 Date Filter Testing:');
  console.log('======================');
  console.log('Input dates:', { date_from, date_to });
  
  // Test formatDateForQuery function
  const fromDate = formatDateForQuery(date_from, 'start');
  const toDate = formatDateForQuery(date_to, 'end');
  
  console.log('Formatted dates:');
  console.log('- Start:', fromDate);
  console.log('- End:', toDate);
  
  // Query using the same logic as marketing.js
  console.log('\n📊 Running Marketing Query:');
  console.log('===========================');
  
  let query = db.collection(collections.leads);
  query = query.where('date_of_enquiry', '>=', fromDate);
  query = query.where('date_of_enquiry', '<=', toDate);
  
  const snapshot = await query.get();
  
  const leadsBySource = {};
  const leadDetails = [];
  
  snapshot.forEach(doc => {
    const lead = doc.data();
    const source = lead.source || 'Unknown';
    
    if (!leadsBySource[source]) {
      leadsBySource[source] = [];
    }
    
    leadsBySource[source].push({
      name: lead.name,
      email: lead.email,
      date_of_enquiry: lead.date_of_enquiry,
      created_date: lead.created_date,
      created_by: lead.created_by || 'N/A'
    });
    
    leadDetails.push({
      name: lead.name,
      source: source,
      date_of_enquiry: lead.date_of_enquiry
    });
  });
  
  console.log(`\nTotal leads found: ${snapshot.size}`);
  
  Object.entries(leadsBySource).forEach(([source, leads]) => {
    console.log(`\n${source}: ${leads.length} leads`);
    console.log('------------------------');
    leads.forEach((lead, idx) => {
      console.log(`${idx + 1}. ${lead.name}`);
      console.log(`   Email: ${lead.email}`);
      console.log(`   Date of Enquiry: ${lead.date_of_enquiry}`);
      console.log(`   Created Date: ${lead.created_date}`);
      console.log(`   Created By: ${lead.created_by}`);
    });
  });
  
  // Check for boundary issues
  console.log('\n\n🔍 Checking for Date Boundary Issues:');
  console.log('====================================');
  
  // Get leads from July 20 that might be bleeding into July 21
  const july20Start = formatDateForQuery('2025-07-20', 'start');
  const july20End = formatDateForQuery('2025-07-20', 'end');
  
  const july20Query = db.collection(collections.leads)
    .where('date_of_enquiry', '>=', july20Start)
    .where('date_of_enquiry', '<=', july20End);
  
  const july20Snapshot = await july20Query.get();
  
  const july20LeadsNearBoundary = [];
  july20Snapshot.forEach(doc => {
    const lead = doc.data();
    const enquiryDate = new Date(lead.date_of_enquiry);
    
    // Check if this lead is near the July 20/21 boundary
    if (enquiryDate.getUTCHours() >= 18) { // After 6 PM UTC
      july20LeadsNearBoundary.push({
        name: lead.name,
        source: lead.source,
        date_of_enquiry: lead.date_of_enquiry,
        utc_hour: enquiryDate.getUTCHours()
      });
    }
  });
  
  if (july20LeadsNearBoundary.length > 0) {
    console.log('\nJuly 20 leads near boundary (after 6 PM UTC):');
    july20LeadsNearBoundary.forEach(lead => {
      console.log(`- ${lead.name} (${lead.source}) - ${lead.date_of_enquiry} (UTC hour: ${lead.utc_hour})`);
    });
  }
  
  // Check IST conversion
  console.log('\n\n🕐 IST Conversion Check:');
  console.log('========================');
  console.log('Marketing uses formatDateForQuery which converts to IST boundaries');
  console.log(`July 21 IST start: ${fromDate} (includes July 20 18:30 UTC onwards)`);
  console.log(`July 21 IST end: ${toDate} (includes up to July 21 18:29:59 UTC)`);
}

debugJuly21Marketing()
  .then(() => {
    console.log('\n✅ Debug complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });