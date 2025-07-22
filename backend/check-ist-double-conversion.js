#!/usr/bin/env node

/**
 * Check if we're double-converting IST timestamps
 */

const { db, collections } = require('./src/config/db');

async function checkISTDoubleConversion() {
  console.log('🔍 Checking for IST Double Conversion Issue\n');
  
  // Get a few sample leads to understand the timestamp format
  const snapshot = await db.collection(collections.leads)
    .orderBy('created_date', 'desc')
    .limit(10)
    .get();
  
  console.log('📊 Sample Lead Timestamps:');
  console.log('=========================\n');
  
  snapshot.forEach(doc => {
    const lead = doc.data();
    console.log(`Lead: ${lead.name}`);
    console.log(`date_of_enquiry: ${lead.date_of_enquiry}`);
    
    // Parse the date
    const enquiryDate = new Date(lead.date_of_enquiry);
    console.log(`UTC time: ${enquiryDate.toUTCString()}`);
    console.log(`IST time: ${enquiryDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    
    // Check if it's already IST
    const utcHour = enquiryDate.getUTCHours();
    const utcMinutes = enquiryDate.getUTCMinutes();
    console.log(`UTC Hour: ${utcHour}:${utcMinutes}`);
    
    // If the timestamp is storing IST as UTC, we'd see patterns like:
    // - Leads created at 1 AM IST would show as 19:30 UTC (previous day)
    // - Leads created at 12 PM IST would show as 06:30 UTC
    console.log('---\n');
  });
  
  // Now check the specific leads causing issues
  console.log('\n🔍 Checking July 20-21 Boundary Leads:');
  console.log('=====================================\n');
  
  const boundaryLeads = [
    'Amit nahar',
    'Arun singh',
    'Sharad Porwal'
  ];
  
  for (const name of boundaryLeads) {
    const leadSnapshot = await db.collection(collections.leads)
      .where('name', '==', name)
      .limit(1)
      .get();
    
    if (!leadSnapshot.empty) {
      const lead = leadSnapshot.docs[0].data();
      console.log(`\n${lead.name}:`);
      console.log(`date_of_enquiry: ${lead.date_of_enquiry}`);
      
      const enquiryDate = new Date(lead.date_of_enquiry);
      console.log(`Parsed as UTC: ${enquiryDate.toUTCString()}`);
      console.log(`In IST: ${enquiryDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
      
      // Check the actual date in IST
      const istDate = new Date(enquiryDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      console.log(`IST Date only: ${istDate.toISOString().split('T')[0]}`);
    }
  }
}

checkISTDoubleConversion()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });