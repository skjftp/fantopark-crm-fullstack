#!/usr/bin/env node

/**
 * Detailed analysis of July 21 Instagram leads
 */

const { db, collections } = require('./src/config/db');

async function analyzeJuly21InstagramLeads() {
  console.log('🔍 Detailed Analysis of July 21 Instagram Leads\n');
  
  const startDate = new Date('2025-07-21T00:00:00Z');
  const endDate = new Date('2025-07-21T23:59:59Z');
  
  // Get all leads from July 21
  const snapshot = await db.collection(collections.leads)
    .where('date_of_enquiry', '>=', startDate.toISOString())
    .where('date_of_enquiry', '<=', endDate.toISOString())
    .get();
  
  const instagramLeads = [];
  const otherLeads = [];
  
  snapshot.forEach(doc => {
    const lead = { id: doc.id, ...doc.data() };
    if (lead.source === 'Instagram') {
      instagramLeads.push(lead);
    } else {
      otherLeads.push(lead);
    }
  });
  
  console.log(`Total leads on July 21: ${snapshot.size}`);
  console.log(`Instagram: ${instagramLeads.length}`);
  console.log(`Other sources: ${otherLeads.length}\n`);
  
  // Analyze Instagram leads for patterns
  console.log('📊 Instagram Lead Analysis:');
  console.log('===========================\n');
  
  const patterns = {
    withMetaId: 0,
    withCampaignData: 0,
    withPlatformField: 0,
    byCreatedBy: {},
    byFormName: {},
    suspicious: []
  };
  
  instagramLeads.forEach((lead, idx) => {
    // Count patterns
    if (lead.meta_lead_id) patterns.withMetaId++;
    if (lead.campaign_id || lead.campaign_name) patterns.withCampaignData++;
    if (lead.platform) patterns.withPlatformField++;
    
    // Group by created_by
    const createdBy = lead.created_by || 'Unknown';
    patterns.byCreatedBy[createdBy] = (patterns.byCreatedBy[createdBy] || 0) + 1;
    
    // Group by form name
    const formName = lead.form_name || 'No Form';
    patterns.byFormName[formName] = (patterns.byFormName[formName] || 0) + 1;
    
    // Check for suspicious patterns
    const isSuspicious = 
      !lead.meta_lead_id && 
      !lead.platform &&
      lead.created_by !== 'Instagram Lead Form';
    
    if (isSuspicious) {
      patterns.suspicious.push(lead);
    }
    
    // Show first 3 leads in detail
    if (idx < 3) {
      console.log(`${idx + 1}. ${lead.name}`);
      console.log(`   Email: ${lead.email}`);
      console.log(`   Created By: ${lead.created_by || 'N/A'}`);
      console.log(`   Meta Lead ID: ${lead.meta_lead_id || 'N/A'}`);
      console.log(`   Platform Field: ${lead.platform || 'N/A'}`);
      console.log(`   Campaign: ${lead.campaign_name || 'N/A'}`);
      console.log(`   Form: ${lead.form_name || 'N/A'}`);
      console.log(`   Created Date: ${lead.created_date}`);
      console.log('');
    }
  });
  
  if (instagramLeads.length > 3) {
    console.log(`... and ${instagramLeads.length - 3} more Instagram leads\n`);
  }
  
  console.log('📈 Pattern Summary:');
  console.log('==================');
  console.log(`With Meta Lead ID: ${patterns.withMetaId}/${instagramLeads.length}`);
  console.log(`With Campaign Data: ${patterns.withCampaignData}/${instagramLeads.length}`);
  console.log(`With Platform Field: ${patterns.withPlatformField}/${instagramLeads.length}`);
  
  console.log('\nCreated By breakdown:');
  Object.entries(patterns.byCreatedBy).forEach(([createdBy, count]) => {
    console.log(`- ${createdBy}: ${count} leads`);
  });
  
  console.log('\nForm Name breakdown:');
  Object.entries(patterns.byFormName).slice(0, 5).forEach(([formName, count]) => {
    console.log(`- ${formName}: ${count} leads`);
  });
  
  if (patterns.suspicious.length > 0) {
    console.log('\n⚠️  Suspicious Leads (possibly manual):');
    console.log('=====================================');
    patterns.suspicious.forEach((lead, idx) => {
      console.log(`\n${idx + 1}. ${lead.name}`);
      console.log(`   Email: ${lead.email}`);
      console.log(`   Created By: ${lead.created_by || 'Unknown'}`);
      console.log(`   No Meta ID: ${!lead.meta_lead_id}`);
      console.log(`   No Platform: ${!lead.platform}`);
      console.log(`   No Campaign: ${!lead.campaign_id}`);
    });
  } else {
    console.log('\n✅ All Instagram leads appear legitimate (from Meta API)');
  }
  
  if (otherLeads.length > 0) {
    console.log('\n\n📋 Other Source Leads on July 21:');
    console.log('==================================');
    otherLeads.forEach((lead, idx) => {
      console.log(`${idx + 1}. ${lead.name} - Source: ${lead.source || 'Unknown'}`);
    });
  }
}

analyzeJuly21InstagramLeads()
  .then(() => {
    console.log('\n✅ Analysis complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });