#!/usr/bin/env node

/**
 * Analyze lead data to understand platform attribution patterns
 */

const { db, collections } = require('./src/config/db');

async function analyzeLeadData() {
  console.log('🔍 Analyzing Lead Platform Data\n');
  
  // Get leads from July 19-21
  const startDate = new Date('2025-07-19T00:00:00Z');
  const endDate = new Date('2025-07-21T23:59:59Z');
  
  const snapshot = await db.collection(collections.leads)
    .where('date_of_enquiry', '>=', startDate.toISOString())
    .where('date_of_enquiry', '<=', endDate.toISOString())
    .orderBy('date_of_enquiry', 'asc')
    .get();
  
  console.log(`Found ${snapshot.size} leads from July 19-21\n`);
  
  // Group by date and analyze
  const dateAnalysis = {
    '2025-07-19': { Facebook: [], Instagram: [], Other: [] },
    '2025-07-20': { Facebook: [], Instagram: [], Other: [] },
    '2025-07-21': { Facebook: [], Instagram: [], Other: [] }
  };
  
  snapshot.forEach(doc => {
    const lead = doc.data();
    const dateStr = lead.date_of_enquiry.split('T')[0];
    const source = lead.source || 'Other';
    
    if (dateAnalysis[dateStr] && dateAnalysis[dateStr][source]) {
      dateAnalysis[dateStr][source].push({
        name: lead.name,
        form_name: lead.form_name || '',
        campaign_name: lead.campaign_name || '',
        adset_name: lead.adset_name || '',
        ad_name: lead.ad_name || '',
        has_campaign_id: !!lead.campaign_id,
        has_adset_id: !!lead.adset_id,
        created_by: lead.created_by || ''
      });
    }
  });
  
  // Display analysis
  Object.entries(dateAnalysis).forEach(([date, sources]) => {
    console.log(`\n📅 ${date}`);
    console.log('=' .repeat(80));
    
    Object.entries(sources).forEach(([source, leads]) => {
      if (leads.length > 0) {
        console.log(`\n${source} (${leads.length} leads):`);
        console.log('-'.repeat(40));
        
        // Show first 3 leads as samples
        leads.slice(0, 3).forEach((lead, idx) => {
          console.log(`\n${idx + 1}. ${lead.name}`);
          console.log(`   Form: "${lead.form_name}"`);
          console.log(`   Campaign: "${lead.campaign_name}"`);
          console.log(`   AdSet: "${lead.adset_name}"`);
          console.log(`   Ad: "${lead.ad_name}"`);
          console.log(`   Has IDs: Campaign=${lead.has_campaign_id}, AdSet=${lead.has_adset_id}`);
          console.log(`   Created by: ${lead.created_by}`);
        });
        
        if (leads.length > 3) {
          console.log(`\n   ... and ${leads.length - 3} more`);
        }
      }
    });
  });
  
  // Check for patterns
  console.log('\n\n📊 Pattern Analysis:');
  console.log('===================');
  
  // Check if Facebook leads have specific patterns
  const allFacebookLeads = [];
  const allInstagramLeads = [];
  
  Object.values(dateAnalysis).forEach(sources => {
    allFacebookLeads.push(...sources.Facebook);
    allInstagramLeads.push(...sources.Instagram);
  });
  
  console.log(`\nFacebook leads (${allFacebookLeads.length} total):`);
  const fbWithCampaign = allFacebookLeads.filter(l => l.has_campaign_id).length;
  const fbWithoutCampaign = allFacebookLeads.filter(l => !l.has_campaign_id).length;
  console.log(`- With campaign data: ${fbWithCampaign}`);
  console.log(`- Without campaign data: ${fbWithoutCampaign}`);
  
  console.log(`\nInstagram leads (${allInstagramLeads.length} total):`);
  const igWithCampaign = allInstagramLeads.filter(l => l.has_campaign_id).length;
  const igWithoutCampaign = allInstagramLeads.filter(l => !l.has_campaign_id).length;
  console.log(`- With campaign data: ${igWithCampaign}`);
  console.log(`- Without campaign data: ${igWithoutCampaign}`);
  
  // Check for common patterns in created_by field
  console.log('\n\nCreated By Patterns:');
  const createdByCount = {};
  [...allFacebookLeads, ...allInstagramLeads].forEach(lead => {
    const key = `${lead.created_by} (${lead.has_campaign_id ? 'with campaign' : 'no campaign'})`;
    createdByCount[key] = (createdByCount[key] || 0) + 1;
  });
  
  Object.entries(createdByCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([key, count]) => {
      console.log(`- ${key}: ${count} leads`);
    });
}

analyzeLeadData()
  .then(() => {
    console.log('\n✅ Analysis complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });