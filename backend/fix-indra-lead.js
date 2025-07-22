#!/usr/bin/env node

/**
 * Fix the Indra lead that was incorrectly marked as Facebook
 */

const { db, collections } = require('./src/config/db');

async function fixIndraLead() {
  console.log('🔧 Fixing Indra Lead Attribution\n');
  
  // Find the Indra lead
  const snapshot = await db.collection(collections.leads)
    .where('name', '==', 'Indra')
    .where('platform', '==', 'instagram')
    .where('source', '==', 'Facebook')
    .get();
  
  if (snapshot.empty) {
    console.log('❌ Indra lead not found or already fixed');
    return;
  }
  
  console.log(`Found ${snapshot.size} lead(s) to fix\n`);
  
  snapshot.forEach(async (doc) => {
    const lead = doc.data();
    console.log('Lead Details:');
    console.log('=============');
    console.log('Name:', lead.name);
    console.log('Current Source:', lead.source);
    console.log('Platform:', lead.platform);
    console.log('Campaign:', lead.campaign_name);
    console.log('Created By:', lead.created_by);
    console.log('Date:', lead.date_of_enquiry);
    
    console.log('\n✅ Updating source from Facebook to Instagram...');
    
    await db.collection(collections.leads).doc(doc.id).update({
      source: 'Instagram',
      platform_fix_note: 'Fixed based on Meta platform field analysis - Meta sends all leads as Instagram',
      platform_fix_date: new Date().toISOString()
    });
    
    console.log('✅ Lead updated successfully!');
  });
}

fixIndraLead()
  .then(() => {
    console.log('\n👋 Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });