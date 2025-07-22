#!/usr/bin/env node

/**
 * Fix platform attribution for leads from July 20-21 that were incorrectly marked as Instagram
 */

const { db, collections } = require('./src/config/db');
const { getISTDateString } = require('./src/utils/dateHelpers');

async function fixPlatformAttribution() {
  console.log('🔧 Fixing Platform Attribution for July 20-21 Leads\n');
  
  const startDate = new Date('2025-07-20T00:00:00Z');
  const endDate = new Date('2025-07-21T23:59:59Z');
  
  // Get all leads in date range first
  const snapshot = await db.collection(collections.leads)
    .where('date_of_enquiry', '>=', startDate.toISOString())
    .where('date_of_enquiry', '<=', endDate.toISOString())
    .get();
  
  // Filter for Instagram leads in memory
  const instagramLeads = [];
  snapshot.forEach(doc => {
    const lead = doc.data();
    if (lead.source === 'Instagram') {
      instagramLeads.push({ id: doc.id, ...lead });
    }
  });
  
  console.log(`Found ${instagramLeads.length} Instagram leads from July 20-21 to analyze\n`);
  
  const updates = [];
  let fbCount = 0;
  
  // Analyze each Instagram lead
  instagramLeads.forEach(lead => {
    const shouldBeFacebook = detectIfShouldBeFacebook(lead);
    
    if (shouldBeFacebook) {
      updates.push({
        id: lead.id,
        name: lead.name,
        current: lead.source,
        form_name: lead.form_name || 'N/A',
        campaign_name: lead.campaign_name || 'N/A',
        adset_name: lead.adset_name || 'N/A',
        ad_name: lead.ad_name || 'N/A',
        has_campaign_data: !!(lead.campaign_id || lead.campaign_name)
      });
      fbCount++;
    }
  });
  
  console.log(`📊 Analysis Results:`);
  console.log(`- Total Instagram leads: ${instagramLeads.length}`);
  console.log(`- Should be Facebook: ${fbCount}`);
  console.log(`- Correctly Instagram: ${instagramLeads.length - fbCount}\n`);
  
  if (updates.length > 0) {
    console.log('📋 Leads to be updated to Facebook:');
    console.log('=====================================');
    updates.forEach((update, idx) => {
      console.log(`\n${idx + 1}. ${update.name}`);
      console.log(`   Form: ${update.form_name}`);
      console.log(`   Campaign: ${update.campaign_name}`);
      console.log(`   Has Campaign Data: ${update.has_campaign_data}`);
    });
    
    console.log('\n\n⚠️  Ready to update these leads from Instagram to Facebook.');
    console.log('This will affect the marketing report data.');
    console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to proceed...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n🔄 Updating leads...');
    
    // Perform updates in batches
    const batch = db.batch();
    let batchCount = 0;
    
    for (const update of updates) {
      const docRef = db.collection(collections.leads).doc(update.id);
      batch.update(docRef, { 
        source: 'Facebook',
        platform_fix_applied: true,
        platform_fix_date: new Date().toISOString()
      });
      batchCount++;
      
      if (batchCount >= 500) {
        await batch.commit();
        console.log(`  Committed batch of ${batchCount} updates`);
        batchCount = 0;
      }
    }
    
    if (batchCount > 0) {
      await batch.commit();
      console.log(`  Committed final batch of ${batchCount} updates`);
    }
    
    console.log('\n✅ Platform attribution fixed successfully!');
    console.log(`Updated ${updates.length} leads from Instagram to Facebook`);
    
  } else {
    console.log('✅ No leads need platform attribution fixes');
  }
}

function detectIfShouldBeFacebook(lead) {
  // Check for Facebook indicators
  const formName = (lead.form_name || '').toLowerCase();
  const campaignName = (lead.campaign_name || '').toLowerCase();
  const adsetName = (lead.adset_name || '').toLowerCase();
  const adName = (lead.ad_name || '').toLowerCase();
  
  // If any field explicitly mentions Facebook
  if (formName.includes('facebook') || formName.includes('fb') ||
      campaignName.includes('facebook') || campaignName.includes('fb') ||
      adsetName.includes('facebook') || adsetName.includes('fb') ||
      adName.includes('facebook') || adName.includes('fb')) {
    return true;
  }
  
  // Check if it's an organic lead (no campaign data) that was incorrectly marked as Instagram
  const hasCampaignData = lead.campaign_id || lead.campaign_name || 
                         lead.adset_id || lead.adset_name ||
                         lead.ad_id || lead.ad_name;
  
  if (!hasCampaignData) {
    // Organic leads without campaign data should be Facebook (as per new logic)
    return true;
  }
  
  return false;
}

// Run the fix
fixPlatformAttribution()
  .then(() => {
    console.log('\n👋 Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });