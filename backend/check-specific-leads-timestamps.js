#!/usr/bin/env node

/**
 * Check specific leads to understand timestamp storage
 */

const { db, collections } = require('./src/config/db');

async function checkSpecificLeadsTimestamps() {
  console.log('🔍 Checking Specific Lead Timestamps\n');
  
  const leadNames = [
    'Amit nahar',
    'Arun singh', 
    'Sharad Porwal'
  ];
  
  for (const name of leadNames) {
    const snapshot = await db.collection(collections.leads)
      .where('name', '==', name)
      .limit(1)
      .get();
    
    if (!snapshot.empty) {
      const lead = snapshot.docs[0].data();
      console.log(`\n📋 Lead: ${lead.name}`);
      console.log('==================================');
      
      // Show all timestamp fields
      console.log('\n🕐 Timestamp Fields:');
      console.log(`date_of_enquiry: ${lead.date_of_enquiry}`);
      console.log(`created_date: ${lead.created_date}`);
      console.log(`meta_created_time: ${lead.meta_created_time}`);
      console.log(`meta_created_time_utc: ${lead.meta_created_time_utc}`);
      
      // Parse date_of_enquiry
      const enquiryDate = new Date(lead.date_of_enquiry);
      console.log('\n📊 Date of Enquiry Analysis:');
      console.log(`Raw value: ${lead.date_of_enquiry}`);
      console.log(`As UTC: ${enquiryDate.toUTCString()}`);
      console.log(`As IST: ${enquiryDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
      
      // Check if it looks like IST stored as UTC
      const hour = enquiryDate.getUTCHours();
      const minutes = enquiryDate.getUTCMinutes();
      console.log(`\nUTC Hour: ${hour}:${String(minutes).padStart(2, '0')}`);
      
      // If this is 19:12 UTC and the user says it's actually 19:12 IST,
      // then the correct UTC time should be 13:42 UTC
      const correctUTCIfIST = new Date(enquiryDate.getTime() - (5.5 * 60 * 60 * 1000));
      console.log(`\nIf ${hour}:${String(minutes).padStart(2, '0')} is IST, then UTC should be: ${correctUTCIfIST.toUTCString()}`);
      console.log(`Which would be date: ${correctUTCIfIST.toISOString().split('T')[0]}`);
      
      // Check created_date for comparison
      if (lead.created_date) {
        const createdDate = new Date(lead.created_date);
        console.log('\n📊 Created Date Analysis:');
        console.log(`Raw value: ${lead.created_date}`);
        console.log(`As UTC: ${createdDate.toUTCString()}`);
        console.log(`As IST: ${createdDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
      }
      
      // Check for conversion flags
      console.log('\n🔍 Conversion Flags:');
      console.log(`date_converted_to_ist: ${lead.date_converted_to_ist || 'undefined'}`);
      console.log(`date_conversion_date: ${lead.date_conversion_date || 'undefined'}`);
      console.log(`original_utc_date: ${lead.original_utc_date || 'undefined'}`);
    }
  }
}

checkSpecificLeadsTimestamps()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });