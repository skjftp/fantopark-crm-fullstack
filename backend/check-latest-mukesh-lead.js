#!/usr/bin/env node

const { db, collections } = require('./src/config/db');

async function checkLatestLead() {
  console.log('🔍 Checking Latest Lead (Mukesh)\n');
  
  const snapshot = await db.collection(collections.leads)
    .where('name', '==', 'Mukesh')
    .where('email', '==', 'nomadtechie007@gmail.com')
    .limit(1)
    .get();
  
  if (!snapshot.empty) {
    const lead = snapshot.docs[0].data();
    console.log('Lead Details:');
    console.log('============');
    console.log('Name:', lead.name);
    console.log('Email:', lead.email);
    console.log('date_of_enquiry:', lead.date_of_enquiry);
    console.log('created_date:', lead.created_date);
    console.log('meta_created_time:', lead.meta_created_time);
    console.log('first_touchbase_date:', lead.first_touchbase_date);
    console.log('source:', lead.source);
    console.log('created_by:', lead.created_by);
    
    if (lead.date_of_enquiry) {
      const enquiryDate = new Date(lead.date_of_enquiry);
      console.log('\nDate Analysis:');
      console.log('UTC:', enquiryDate.toUTCString());
      console.log('IST:', enquiryDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    }
  } else {
    console.log('Lead not found - checking by phone number...');
    
    // Try searching by phone
    const phoneSnapshot = await db.collection(collections.leads)
      .where('phone', '==', '917619116846')
      .limit(1)
      .get();
    
    if (!phoneSnapshot.empty) {
      const lead = phoneSnapshot.docs[0].data();
      console.log('\nFound by phone number!');
      console.log('Lead Details:');
      console.log('============');
      console.log('Name:', lead.name);
      console.log('Email:', lead.email);
      console.log('Phone:', lead.phone);
      console.log('date_of_enquiry:', lead.date_of_enquiry);
      console.log('created_date:', lead.created_date);
      console.log('meta_created_time:', lead.meta_created_time);
      console.log('source:', lead.source);
      console.log('created_by:', lead.created_by);
      
      console.log('\nAll timestamp fields:');
      Object.entries(lead).forEach(([key, value]) => {
        if (key.includes('date') || key.includes('time')) {
          console.log(`${key}: ${value}`);
        }
      });
    }
  }
}

checkLatestLead()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });