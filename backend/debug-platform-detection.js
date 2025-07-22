#!/usr/bin/env node

/**
 * Debug script to analyze platform detection for recent leads
 */

const { db, collections } = require('./src/config/db');

async function debugPlatformDetection() {
  console.log('🔍 Analyzing Platform Detection for Recent Leads\n');
  
  // Get leads from July 19-21
  const startDate = new Date('2025-07-19T00:00:00Z');
  const endDate = new Date('2025-07-21T23:59:59Z');
  
  const snapshot = await db.collection(collections.leads)
    .where('date_of_enquiry', '>=', startDate.toISOString())
    .where('date_of_enquiry', '<=', endDate.toISOString())
    .orderBy('date_of_enquiry', 'asc')
    .get();
  
  console.log(`Found ${snapshot.size} leads from July 19-21\n`);
  
  // Group by date and source
  const stats = {
    '2025-07-19': { Facebook: 0, Instagram: 0, Other: 0 },
    '2025-07-20': { Facebook: 0, Instagram: 0, Other: 0 },
    '2025-07-21': { Facebook: 0, Instagram: 0, Other: 0 }
  };
  
  const platformClues = {
    '2025-07-19': { Facebook: [], Instagram: [] },
    '2025-07-20': { Facebook: [], Instagram: [] },
    '2025-07-21': { Facebook: [], Instagram: [] }
  };
  
  const sampleLeads = {
    Facebook: [],
    Instagram: []
  };
  
  snapshot.forEach(doc => {
    const lead = doc.data();
    const dateStr = lead.date_of_enquiry.split('T')[0];
    
    if (stats[dateStr]) {
      stats[dateStr][lead.source] = (stats[dateStr][lead.source] || 0) + 1;
      
      // Collect samples for analysis
      if (lead.source === 'Facebook' && sampleLeads.Facebook.length < 3) {
        sampleLeads.Facebook.push({
          id: doc.id,
          date: dateStr,
          name: lead.name,
          form_name: lead.form_name,
          campaign_name: lead.campaign_name,
          adset_name: lead.adset_name,
          ad_name: lead.ad_name,
          campaign_id: lead.campaign_id,
          adset_id: lead.adset_id
        });
      } else if (lead.source === 'Instagram' && sampleLeads.Instagram.length < 10) {
        sampleLeads.Instagram.push({
          id: doc.id,
          date: dateStr,
          name: lead.name,
          form_name: lead.form_name,
          campaign_name: lead.campaign_name,
          adset_name: lead.adset_name,
          ad_name: lead.ad_name,
          campaign_id: lead.campaign_id,
          adset_id: lead.adset_id
        });
      }
      
      // Analyze what might indicate platform
      const formName = (lead.form_name || '').toLowerCase();
      const campaignName = (lead.campaign_name || '').toLowerCase();
      const adsetName = (lead.adset_name || '').toLowerCase();
      const adName = (lead.ad_name || '').toLowerCase();
      
      if (formName.includes('facebook') || formName.includes('fb') ||
          campaignName.includes('facebook') || campaignName.includes('fb') ||
          adsetName.includes('facebook') || adsetName.includes('fb') ||
          adName.includes('facebook') || adName.includes('fb')) {
        platformClues[dateStr].Facebook.push(lead.name);
      }
      
      if (formName.includes('instagram') || formName.includes('ig') ||
          campaignName.includes('instagram') || campaignName.includes('ig') ||
          adsetName.includes('instagram') || adsetName.includes('ig') ||
          adName.includes('instagram') || adName.includes('ig')) {
        platformClues[dateStr].Instagram.push(lead.name);
      }
    }
  });
  
  // Display stats
  console.log('📊 Lead Count by Date and Platform:');
  console.log('=====================================');
  Object.entries(stats).forEach(([date, sources]) => {
    console.log(`\n${date}:`);
    Object.entries(sources).forEach(([source, count]) => {
      if (count > 0) {
        console.log(`  ${source}: ${count}`);
      }
    });
  });
  
  // Display sample leads
  console.log('\n\n📋 Sample Facebook Leads:');
  console.log('=========================');
  sampleLeads.Facebook.forEach(lead => {
    console.log(`\nDate: ${lead.date}`);
    console.log(`Name: ${lead.name}`);
    console.log(`Form: ${lead.form_name || 'N/A'}`);
    console.log(`Campaign: ${lead.campaign_name || 'N/A'}`);
    console.log(`AdSet: ${lead.adset_name || 'N/A'}`);
    console.log(`Ad: ${lead.ad_name || 'N/A'}`);
    console.log(`Has Campaign ID: ${!!lead.campaign_id}`);
    console.log(`Has AdSet ID: ${!!lead.adset_id}`);
  });
  
  console.log('\n\n📋 Sample Instagram Leads:');
  console.log('==========================');
  sampleLeads.Instagram.slice(0, 5).forEach(lead => {
    console.log(`\nDate: ${lead.date}`);
    console.log(`Name: ${lead.name}`);
    console.log(`Form: ${lead.form_name || 'N/A'}`);
    console.log(`Campaign: ${lead.campaign_name || 'N/A'}`);
    console.log(`AdSet: ${lead.adset_name || 'N/A'}`);
    console.log(`Ad: ${lead.ad_name || 'N/A'}`);
    console.log(`Has Campaign ID: ${!!lead.campaign_id}`);
    console.log(`Has AdSet ID: ${!!lead.adset_id}`);
  });
  
  // Check for platform indicators
  console.log('\n\n🔍 Platform Indicators Found:');
  console.log('==============================');
  Object.entries(platformClues).forEach(([date, platforms]) => {
    console.log(`\n${date}:`);
    if (platforms.Facebook.length > 0) {
      console.log(`  Facebook indicators found in ${platforms.Facebook.length} leads`);
    }
    if (platforms.Instagram.length > 0) {
      console.log(`  Instagram indicators found in ${platforms.Instagram.length} leads`);
    }
  });
  
  // Analyze the problem
  console.log('\n\n🔍 Analysis:');
  console.log('============');
  console.log('1. July 19 had proper Facebook/Instagram split');
  console.log('2. July 20 & 21 all leads marked as Instagram');
  console.log('\nPossible causes:');
  console.log('- Platform detection logic defaulting incorrectly');
  console.log('- Missing campaign/adset data causing Instagram default');
  console.log('- Form/campaign names not containing platform indicators');
}

debugPlatformDetection()
  .then(() => {
    console.log('\n✅ Analysis complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });