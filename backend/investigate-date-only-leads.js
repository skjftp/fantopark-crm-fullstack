#!/usr/bin/env node

/**
 * Investigate leads with date-only timestamps
 */

const { db, collections } = require('./src/config/db');

async function investigateDateOnlyLeads() {
  console.log('🔍 Investigating Leads with Date-Only Timestamps\n');
  
  const dateOnlyLeads = [
    'Harman',
    'G Reddy', 
    'Nirupa Gadhavi',
    'Ankur Sharma',
    'Rishabh Somani'
  ];
  
  for (const name of dateOnlyLeads) {
    const snapshot = await db.collection(collections.leads)
      .where('name', '==', name)
      .get();
    
    if (!snapshot.empty) {
      // Get the most recent one if multiple
      let mostRecent = null;
      snapshot.forEach(doc => {
        const lead = { id: doc.id, ...doc.data() };
        if (!mostRecent || new Date(lead.created_date) > new Date(mostRecent.created_date)) {
          mostRecent = lead;
        }
      });
      
      console.log(`\n📋 ${name}:`);
      console.log('='.repeat(40));
      console.log(`date_of_enquiry: ${mostRecent.date_of_enquiry}`);
      console.log(`created_date: ${mostRecent.created_date}`);
      console.log(`meta_created_time: ${mostRecent.meta_created_time || 'N/A'}`);
      console.log(`created_by: ${mostRecent.created_by || 'N/A'}`);
      console.log(`source: ${mostRecent.source}`);
      console.log(`meta_lead_id: ${mostRecent.meta_lead_id || 'N/A'}`);
      
      // Check if it's a date-only format
      if (mostRecent.date_of_enquiry && mostRecent.date_of_enquiry.length === 10) {
        console.log('⚠️  DATE-ONLY FORMAT DETECTED');
        
        // Try to find the actual time from other fields
        if (mostRecent.meta_created_time) {
          console.log(`\nActual time from meta_created_time: ${mostRecent.meta_created_time}`);
          const metaDate = new Date(mostRecent.meta_created_time.replace('+0000', 'Z'));
          console.log(`IST: ${metaDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
        } else if (mostRecent.created_date) {
          const createdDate = new Date(mostRecent.created_date);
          console.log(`\nUsing created_date as reference: ${createdDate.toISOString()}`);
          console.log(`IST: ${createdDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
        }
      }
    }
  }
  
  // Check for other date-only leads
  console.log('\n\n🔍 Searching for all date-only timestamp leads...\n');
  
  const allLeadsSnapshot = await db.collection(collections.leads)
    .where('source', '==', 'Instagram')
    .get();
  
  const dateOnlyCount = { total: 0, withMetaId: 0, withoutMetaId: 0 };
  const examples = [];
  
  allLeadsSnapshot.forEach(doc => {
    const lead = doc.data();
    if (lead.date_of_enquiry && lead.date_of_enquiry.length === 10) {
      dateOnlyCount.total++;
      if (lead.meta_lead_id) {
        dateOnlyCount.withMetaId++;
      } else {
        dateOnlyCount.withoutMetaId++;
      }
      
      if (examples.length < 5) {
        examples.push({
          name: lead.name,
          date_of_enquiry: lead.date_of_enquiry,
          created_by: lead.created_by,
          has_meta_id: !!lead.meta_lead_id
        });
      }
    }
  });
  
  console.log('📊 Date-Only Format Summary:');
  console.log(`Total Instagram leads with date-only format: ${dateOnlyCount.total}`);
  console.log(`- With Meta Lead ID: ${dateOnlyCount.withMetaId}`);
  console.log(`- Without Meta Lead ID: ${dateOnlyCount.withoutMetaId}`);
  
  if (examples.length > 0) {
    console.log('\nExamples:');
    examples.forEach(lead => {
      console.log(`- ${lead.name}: ${lead.date_of_enquiry} (${lead.created_by}) [Meta ID: ${lead.has_meta_id}]`);
    });
  }
}

investigateDateOnlyLeads()
  .then(() => {
    console.log('\n✅ Investigation complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });