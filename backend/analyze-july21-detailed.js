  const { db, collections } = require('./src/config/db');
  async function analyzeJuly21Detailed() {
    console.log('🔍 Detailed analysis of July 21, 2025 leads...\n');
    try {
      // Get all July 21 leads
      const snapshot = await db.collection(collections.leads).get();
      const july21Leads = [];
      snapshot.forEach(doc => {
        const lead = doc.data();
        const dateStr = (lead.date_of_enquiry || '').toString();
        if (dateStr.includes('2025-07-21')) {
          july21Leads.push({ id: doc.id, ...lead });
        }
      });
      console.log(`📊 Found ${july21Leads.length} leads for July 21, 2025\n`);
      // Analyze each lead in detail
      july21Leads.forEach((lead, index) => {
        console.log(`${index + 1}. ${lead.name} (${lead.email})`);
        console.log(`   Source: ${lead.source || 'undefined'}`);
        console.log(`   Date: ${lead.date_of_enquiry}`);
        console.log(`   Form Name: ${lead.form_name || 'N/A'}`);
        console.log(`   Form ID: ${lead.form_id || 'N/A'}`);
        console.log(`   Campaign: ${lead.campaign_name || 'N/A'}`);
        console.log(`   Campaign ID: ${lead.campaign_id || 'N/A'}`);
        console.log(`   AdSet: ${lead.adset_name || 'N/A'}`);
        console.log(`   AdSet ID: ${lead.adset_id || 'N/A'}`);
        console.log(`   Ad Name: ${lead.ad_name || 'N/A'}`);
        console.log(`   Ad ID: ${lead.ad_id || 'N/A'}`);
        console.log(`   Created By: ${lead.created_by || 'N/A'}`);
        console.log(`   Meta Lead ID: ${lead.meta_lead_id || 'N/A'}`);
        console.log(`   Platform: ${lead.platform || 'N/A'}`);
        // Check lead_source_details
        if (lead.lead_source_details) {
          console.log('   Lead Source Details:');
          Object.entries(lead.lead_source_details).forEach(([key, value]) => {
            if (value) console.log(`     ${key}: ${value}`);
          });
        }
        console.log('');
      });
      // Look for any platform indicators
      console.log('🔍 Platform Analysis:');
      let hasFormNames = 0;
      let hasCampaignInfo = 0;
      let hasMetaIds = 0;
      july21Leads.forEach(lead => {
        if (lead.form_name) hasFormNames++;
        if (lead.campaign_id || lead.adset_id) hasCampaignInfo++;
        if (lead.meta_lead_id) hasMetaIds++;
      });
      console.log(`  Leads with form names: ${hasFormNames}`);
      console.log(`  Leads with campaign/adset IDs: ${hasCampaignInfo}`);
      console.log(`  Leads with Meta lead IDs: ${hasMetaIds}`);
      // Check if we're missing the 17th lead
      console.log('\n📊 Lead Count Discrepancy:');
      console.log('  Facebook Ads Manager: 17 leads');
      console.log(`  CRM: ${july21Leads.length} leads`);
      console.log(`  Missing: ${17 - july21Leads.length} lead(s)`);
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
  analyzeJuly21Detailed();
