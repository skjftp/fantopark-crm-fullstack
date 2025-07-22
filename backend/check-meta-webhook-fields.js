#!/usr/bin/env node

/**
 * Check what fields Meta is actually sending in webhook data
 */

const { db, collections } = require('./src/config/db');

async function checkMetaWebhookFields() {
  console.log('🔍 Checking Meta Webhook Fields in Recent Leads\n');
  
  // Get recent leads
  const snapshot = await db.collection(collections.leads)
    .orderBy('created_date', 'desc')
    .limit(50)
    .get();
  
  // Filter for Facebook and Instagram leads
  const metaLeads = [];
  snapshot.forEach(doc => {
    const lead = doc.data();
    if (lead.source === 'Facebook' || lead.source === 'Instagram') {
      metaLeads.push({ id: doc.id, ...lead });
    }
  });
  
  console.log(`Found ${metaLeads.length} Meta leads to analyze...`);
  
  console.log(`Analyzing ${metaLeads.length} recent Meta leads...\n`);
  
  const fieldAnalysis = {
    hasLeadSourceDetails: 0,
    hasPlatformField: 0,
    hasMetaPlatform: 0,
    platformValues: new Set(),
    formNames: new Set(),
    campaignNames: new Set()
  };
  
  metaLeads.forEach(lead => {
    
    if (lead.lead_source_details) {
      fieldAnalysis.hasLeadSourceDetails++;
    }
    
    if (lead.platform) {
      fieldAnalysis.hasPlatformField++;
      fieldAnalysis.platformValues.add(lead.platform);
    }
    
    if (lead.meta_platform) {
      fieldAnalysis.hasMetaPlatform++;
    }
    
    if (lead.form_name) {
      fieldAnalysis.formNames.add(lead.form_name);
    }
    
    if (lead.campaign_name) {
      fieldAnalysis.campaignNames.add(lead.campaign_name);
    }
    
    // Show first lead in detail
    if (fieldAnalysis.hasLeadSourceDetails === 1) {
      console.log('📋 Sample Lead Details:');
      console.log('========================');
      console.log(`Name: ${lead.name}`);
      console.log(`Source: ${lead.source}`);
      console.log(`Platform: ${lead.platform || 'N/A'}`);
      console.log(`Meta Platform: ${lead.meta_platform || 'N/A'}`);
      console.log(`Form: ${lead.form_name || 'N/A'}`);
      console.log(`Campaign: ${lead.campaign_name || 'N/A'}`);
      console.log(`Created By: ${lead.created_by || 'N/A'}`);
      
      if (lead.lead_source_details) {
        console.log('\nLead Source Details:');
        console.log(JSON.stringify(lead.lead_source_details, null, 2));
      }
    }
  });
  
  console.log('\n\n📊 Field Analysis:');
  console.log('==================');
  console.log(`Leads with lead_source_details: ${fieldAnalysis.hasLeadSourceDetails}/${metaLeads.length}`);
  console.log(`Leads with platform field: ${fieldAnalysis.hasPlatformField}/${metaLeads.length}`);
  console.log(`Leads with meta_platform field: ${fieldAnalysis.hasMetaPlatform}/${metaLeads.length}`);
  
  console.log('\nPlatform values found:', Array.from(fieldAnalysis.platformValues));
  console.log('\nUnique form names:', Array.from(fieldAnalysis.formNames).slice(0, 5));
  console.log('\nUnique campaign names:', Array.from(fieldAnalysis.campaignNames).slice(0, 5));
  
  // Check for Facebook indicators
  console.log('\n\n🔍 Facebook Detection Analysis:');
  console.log('================================');
  
  const facebookPatterns = {
    inFormName: 0,
    inCampaignName: 0,
    inAdsetName: 0,
    noIndicators: 0
  };
  
  metaLeads.forEach(lead => {
    const formName = (lead.form_name || '').toLowerCase();
    const campaignName = (lead.campaign_name || '').toLowerCase();
    const adsetName = (lead.adset_name || '').toLowerCase();
    
    let hasIndicator = false;
    
    if (formName.includes('facebook') || formName.includes('fb')) {
      facebookPatterns.inFormName++;
      hasIndicator = true;
    }
    
    if (campaignName.includes('facebook') || campaignName.includes('fb')) {
      facebookPatterns.inCampaignName++;
      hasIndicator = true;
    }
    
    if (adsetName.includes('facebook') || adsetName.includes('fb')) {
      facebookPatterns.inAdsetName++;
      hasIndicator = true;
    }
    
    if (!hasIndicator && lead.source === 'Facebook') {
      facebookPatterns.noIndicators++;
      console.log(`\nFacebook lead without indicators: ${lead.name}`);
      console.log(`  Form: "${lead.form_name || 'N/A'}"`);
      console.log(`  Campaign: "${lead.campaign_name || 'N/A'}"`);
      console.log(`  Created: ${lead.created_date}`);
    }
  });
  
  console.log('\nFacebook indicator patterns:');
  console.log(`- In form name: ${facebookPatterns.inFormName}`);
  console.log(`- In campaign name: ${facebookPatterns.inCampaignName}`);
  console.log(`- In adset name: ${facebookPatterns.inAdsetName}`);
  console.log(`- Facebook leads with NO indicators: ${facebookPatterns.noIndicators}`);
}

checkMetaWebhookFields()
  .then(() => {
    console.log('\n✅ Analysis complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });