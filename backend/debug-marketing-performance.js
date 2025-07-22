  const { db, collections } = require('./src/config/db');
  const facebookInsightsService = require('./src/services/facebookInsightsService');

  async function debugMarketingPerformance() {
    console.log('🔍 Debugging Marketing Performance Discrepancy\n');

    try {
      // 1. Check all July 21 Instagram leads
      const snapshot = await db.collection(collections.leads).get();
      const july21Leads = [];

      snapshot.forEach(doc => {
        const lead = doc.data();
        const dateStr = (lead.date_of_enquiry || '').toString();

        if (dateStr.includes('2025-07-21') && lead.source === 'Instagram') {
          july21Leads.push({
            id: doc.id,
            name: lead.name,
            email: lead.email,
            status: lead.status,
            stage: lead.stage,
            date_of_enquiry: lead.date_of_enquiry,
            campaign_name: lead.campaign_name,
            campaign_id: lead.campaign_id,
            touch_based: lead.touch_based !== false,
            created_date: lead.created_date,
            assigned_date: lead.assigned_date
          });
        }
      });

      console.log(`📊 Total Instagram leads on July 21: ${july21Leads.length}\n`);

      // 2. Group by status
      const statusCount = {};
      july21Leads.forEach(lead => {
        const status = lead.status || 'unassigned';
        statusCount[status] = (statusCount[status] || 0) + 1;
      });

      console.log('📋 Leads by Status:');
      Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });

      // 3. Check which leads might be excluded
      console.log('\n🔍 Checking for excluded leads:');

      // Check for test leads
      const testLeads = july21Leads.filter(lead =>
        lead.email.includes('test') ||
        lead.name.toLowerCase().includes('test')
      );
      console.log(`  Test leads: ${testLeads.length}`);

      // Check for unassigned leads
      const unassignedLeads = july21Leads.filter(lead =>
        lead.status === 'unassigned' || !lead.status
      );
      console.log(`  Unassigned leads: ${unassignedLeads.length}`);

      // Check touch-based
      const nonTouchBased = july21Leads.filter(lead => lead.touch_based === false);
      console.log(`  Non-touch based: ${nonTouchBased.length}`);

      // 4. List all leads with their status
      console.log('\n📋 All July 21 Instagram Leads:');
      july21Leads.forEach((lead, i) => {
        console.log(`${i + 1}. ${lead.name} - Status: ${lead.status || 'unassigned'}, Touch: ${lead.touch_based}`);
      });

      // 5. Check campaign IDs used in marketing report
      const campaignIds = [...new Set(july21Leads.map(l => l.campaign_id).filter(Boolean))];
      console.log(`\n🎯 Unique Campaign IDs: ${campaignIds.join(', ')}`);

      // 6. Try to get Facebook insights for the same date
      console.log('\n📊 Fetching Facebook Insights for July 21...');
      try {
        const insights = await facebookInsightsService.getInsightsBySource('2025-07-21', '2025-07-21');
        console.log('Facebook Insights:', insights);

        const campaignInsights = await facebookInsightsService.getCampaignInsights('2025-07-21', '2025-07-21');
        console.log('\nCampaign Insights:', campaignInsights);
      } catch (error) {
        console.log('Unable to fetch insights:', error.message);
      }

      // 7. Check date filtering
      console.log('\n📅 Date Analysis:');
      const dateGroups = {};
      july21Leads.forEach(lead => {
        const date = new Date(lead.date_of_enquiry);
        const hour = date.getUTCHours();
        const key = `Hour ${hour}:00-${hour}:59 UTC`;
        dateGroups[key] = (dateGroups[key] || 0) + 1;
      });

      console.log('Leads by hour (UTC):');
      Object.entries(dateGroups).sort().forEach(([hour, count]) => {
        console.log(`  ${hour}: ${count} leads`);
      });

      // 8. Summary
      console.log('\n📊 SUMMARY:');
      console.log(`CRM Total Instagram Leads (July 21): ${july21Leads.length}`);
      console.log(`Marketing Report Shows: 12 leads`);
      console.log(`Difference: ${july21Leads.length - 12} leads`);
      console.log('\nPossible reasons for discrepancy:');
      console.log('1. Marketing report might exclude unassigned leads');
      console.log('2. Marketing report might use different date/timezone filtering');
      console.log('3. Some leads might be filtered out based on status');
      console.log('4. Impressions data might be cached or delayed');

    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }

  debugMarketingPerformance();
