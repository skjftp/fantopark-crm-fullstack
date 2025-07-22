#!/usr/bin/env node

const { db, collections } = require('./src/config/db');

async function verifyJuly21Fix() {
  console.log('🔍 Verifying July 21 Lead Count After Fix\n');
  
  // Get leads with actual July 21 date_of_enquiry
  const startDate = new Date('2025-07-21T00:00:00Z');
  const endDate = new Date('2025-07-21T23:59:59Z');
  
  const snapshot = await db.collection(collections.leads)
    .where('date_of_enquiry', '>=', startDate.toISOString())
    .where('date_of_enquiry', '<=', endDate.toISOString())
    .get();
  
  const counts = { Instagram: 0, Facebook: 0, Unknown: 0, Other: 0 };
  const instagramLeads = [];
  
  snapshot.forEach(doc => {
    const lead = doc.data();
    const source = lead.source || 'Other';
    counts[source] = (counts[source] || 0) + 1;
    
    if (source === 'Instagram') {
      instagramLeads.push({
        name: lead.name,
        date_of_enquiry: lead.date_of_enquiry,
        created_date: lead.created_date
      });
    }
  });
  
  console.log('📊 July 21 UTC Date Counts:');
  console.log('==========================');
  console.log(`Instagram: ${counts.Instagram}`);
  console.log(`Facebook: ${counts.Facebook}`);
  console.log(`Unknown: ${counts.Unknown}`);
  console.log(`Total: ${snapshot.size}`);
  
  // Check the three specific leads
  console.log('\n\n🔍 Checking Previously Problematic Leads:');
  const problemLeads = ['Amit nahar', 'Arun singh', 'Sharad Porwal'];
  
  for (const name of problemLeads) {
    const leadSnap = await db.collection(collections.leads)
      .where('name', '==', name)
      .limit(1)
      .get();
    
    if (!leadSnap.empty) {
      const lead = leadSnap.docs[0].data();
      const enquiryDate = new Date(lead.date_of_enquiry);
      console.log(`\n${name}:`);
      console.log(`  date_of_enquiry: ${lead.date_of_enquiry}`);
      console.log(`  Date: ${enquiryDate.toISOString().split('T')[0]}`);
      console.log(`  IST: ${enquiryDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    }
  }
}

verifyJuly21Fix()
  .then(() => {
    console.log('\n✅ Verification complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });