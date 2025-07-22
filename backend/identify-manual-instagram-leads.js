#!/usr/bin/env node

/**
 * Identify manually created leads that were incorrectly marked as Instagram
 */

const { db, collections } = require('./src/config/db');

async function identifyManualInstagramLeads() {
  console.log('🔍 Identifying Manual Leads Marked as Instagram\n');
  
  // Get Instagram leads from July 21
  const startDate = new Date('2025-07-21T00:00:00Z');
  const endDate = new Date('2025-07-21T23:59:59Z');
  
  // First get all leads from July 21
  const snapshot = await db.collection(collections.leads)
    .where('date_of_enquiry', '>=', startDate.toISOString())
    .where('date_of_enquiry', '<=', endDate.toISOString())
    .get();
  
  // Then filter for Instagram in memory
  const instagramLeads = [];
  snapshot.forEach(doc => {
    const lead = doc.data();
    if (lead.source === 'Instagram') {
      instagramLeads.push({ id: doc.id, ...lead });
    }
  });
  
  console.log(`Found ${instagramLeads.length} Instagram leads on July 21\n`);
  
  const manualLeads = [];
  const apiLeads = [];
  
  instagramLeads.forEach(lead => {
    
    // Identify manual leads by checking various indicators
    const isManual = 
      // No Meta lead ID
      !lead.meta_lead_id &&
      // Not created by Instagram Lead Form
      lead.created_by !== 'Instagram Lead Form' &&
      // No campaign data from Meta
      !lead.campaign_id &&
      !lead.adset_id &&
      !lead.ad_id &&
      // No lead source details
      !lead.lead_source_details &&
      // No platform field (Meta always sends this)
      !lead.platform;
    
    if (isManual) {
      manualLeads.push({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        created_by: lead.created_by || 'Unknown',
        created_date: lead.created_date,
        date_of_enquiry: lead.date_of_enquiry,
        has_meta_id: !!lead.meta_lead_id,
        has_campaign: !!lead.campaign_id,
        has_platform: !!lead.platform,
        form_name: lead.form_name || 'N/A'
      });
    } else {
      apiLeads.push({
        name: lead.name,
        created_by: lead.created_by,
        meta_lead_id: lead.meta_lead_id,
        campaign: lead.campaign_name || 'N/A'
      });
    }
  });
  
  console.log('📊 Analysis Results:');
  console.log('===================');
  console.log(`Total Instagram leads: ${instagramLeads.length}`);
  console.log(`API/Webhook leads: ${apiLeads.length}`);
  console.log(`Manual leads (to be fixed): ${manualLeads.length}\n`);
  
  if (manualLeads.length > 0) {
    console.log('📋 Manual Leads to Update to "Other":');
    console.log('======================================');
    manualLeads.forEach((lead, idx) => {
      console.log(`\n${idx + 1}. ${lead.name}`);
      console.log(`   Email: ${lead.email}`);
      console.log(`   Created By: ${lead.created_by}`);
      console.log(`   Created Date: ${lead.created_date}`);
      console.log(`   Form: ${lead.form_name}`);
      console.log(`   Has Meta ID: ${lead.has_meta_id}`);
      console.log(`   Has Campaign: ${lead.has_campaign}`);
      console.log(`   Has Platform: ${lead.has_platform}`);
    });
    
    console.log('\n\n✅ API/Webhook Leads (keeping as Instagram):');
    console.log('=============================================');
    apiLeads.slice(0, 5).forEach((lead, idx) => {
      console.log(`${idx + 1}. ${lead.name} - Created by: ${lead.created_by}`);
    });
    if (apiLeads.length > 5) {
      console.log(`... and ${apiLeads.length - 5} more API leads`);
    }
    
    return manualLeads;
  } else {
    console.log('✅ All Instagram leads appear to be from Meta API/Webhook');
    return [];
  }
}

// Run the identification
identifyManualInstagramLeads()
  .then(manualLeads => {
    if (manualLeads.length > 0) {
      console.log('\n\n📝 To fix these leads, run: node fix-manual-instagram-leads.js');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });