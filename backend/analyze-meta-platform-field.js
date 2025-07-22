#!/usr/bin/env node

/**
 * Analyze the Meta platform field to understand patterns
 */

const { db, collections } = require('./src/config/db');

async function analyzeMetaPlatformField() {
  console.log('🔍 Analyzing Meta Platform Field Usage\n');
  
  // Get all leads with platform field
  const snapshot = await db.collection(collections.leads)
    .orderBy('created_date', 'desc')
    .limit(200)
    .get();
  
  const analysis = {
    totalLeads: 0,
    withPlatform: 0,
    platformValues: {},
    sourceVsPlatform: {},
    mismatchedLeads: []
  };
  
  snapshot.forEach(doc => {
    const lead = doc.data();
    analysis.totalLeads++;
    
    if (lead.platform) {
      analysis.withPlatform++;
      
      // Count platform values
      const platform = lead.platform;
      analysis.platformValues[platform] = (analysis.platformValues[platform] || 0) + 1;
      
      // Track source vs platform
      const key = `${lead.source} -> ${platform}`;
      analysis.sourceVsPlatform[key] = (analysis.sourceVsPlatform[key] || 0) + 1;
      
      // Find mismatches
      if (lead.source === 'Facebook' && lead.platform === 'instagram') {
        analysis.mismatchedLeads.push({
          id: doc.id,
          name: lead.name,
          source: lead.source,
          platform: lead.platform,
          created_by: lead.created_by,
          campaign: lead.campaign_name || 'N/A',
          form: lead.form_name || 'N/A',
          date: lead.date_of_enquiry
        });
      }
    }
  });
  
  console.log('📊 Overall Analysis:');
  console.log('===================');
  console.log(`Total leads analyzed: ${analysis.totalLeads}`);
  console.log(`Leads with platform field: ${analysis.withPlatform}`);
  console.log(`Percentage with platform: ${(analysis.withPlatform / analysis.totalLeads * 100).toFixed(1)}%\n`);
  
  console.log('📱 Platform Values:');
  console.log('==================');
  Object.entries(analysis.platformValues).forEach(([platform, count]) => {
    console.log(`${platform}: ${count} leads`);
  });
  
  console.log('\n🔄 Source vs Platform Mapping:');
  console.log('==============================');
  Object.entries(analysis.sourceVsPlatform).forEach(([mapping, count]) => {
    console.log(`${mapping}: ${count} leads`);
  });
  
  if (analysis.mismatchedLeads.length > 0) {
    console.log('\n⚠️  Mismatched Leads (Source=Facebook, Platform=instagram):');
    console.log('===========================================================');
    analysis.mismatchedLeads.slice(0, 10).forEach(lead => {
      console.log(`\n- ${lead.name}`);
      console.log(`  Campaign: ${lead.campaign}`);
      console.log(`  Form: ${lead.form}`);
      console.log(`  Created By: ${lead.created_by}`);
      console.log(`  Date: ${lead.date}`);
    });
    
    if (analysis.mismatchedLeads.length > 10) {
      console.log(`\n... and ${analysis.mismatchedLeads.length - 10} more mismatched leads`);
    }
  }
  
  // Check for patterns in campaign data
  console.log('\n\n🔍 Campaign Data Analysis for Instagram Platform Leads:');
  console.log('=======================================================');
  
  const instagramPlatformLeads = [];
  snapshot.forEach(doc => {
    const lead = doc.data();
    if (lead.platform === 'instagram') {
      instagramPlatformLeads.push(lead);
    }
  });
  
  // Analyze campaign presence
  const withCampaign = instagramPlatformLeads.filter(l => l.campaign_id || l.campaign_name).length;
  const withoutCampaign = instagramPlatformLeads.length - withCampaign;
  
  console.log(`Instagram platform leads: ${instagramPlatformLeads.length}`);
  console.log(`- With campaign data: ${withCampaign}`);
  console.log(`- Without campaign data: ${withoutCampaign}`);
  
  // Check created_by patterns
  const createdByPatterns = {};
  instagramPlatformLeads.forEach(lead => {
    const key = lead.created_by || 'Unknown';
    createdByPatterns[key] = (createdByPatterns[key] || 0) + 1;
  });
  
  console.log('\nCreated By patterns for Instagram platform leads:');
  Object.entries(createdByPatterns)
    .sort((a, b) => b[1] - a[1])
    .forEach(([created_by, count]) => {
      console.log(`- ${created_by}: ${count} leads`);
    });
}

analyzeMetaPlatformField()
  .then(() => {
    console.log('\n✅ Analysis complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });