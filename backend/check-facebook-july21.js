  const { db, collections } = require('./src/config/db');
  async function checkFacebookLeads() {
    console.log('🔍 Checking for Facebook platform leads on July 21, 2025...\n');
    try {
      // Get all leads from July 21
      const snapshot = await db.collection(collections.leads).get();
      let facebookLeads = [];
      let allJuly21 = [];
      snapshot.forEach(doc => {
        const lead = doc.data();
        const dateStr = (lead.date_of_enquiry || '').toString();
        if (dateStr.includes('2025-07-21')) {
          allJuly21.push(lead);
          // Check multiple ways to identify Facebook
          if (lead.source === 'Facebook' ||
              lead.platform === 'facebook' ||
              (lead.created_by && lead.created_by.includes('Facebook'))) {
            facebookLeads.push(lead);
          }
        }
      });
      console.log(`📊 July 21 Lead Summary:`);
      console.log(`  Total: ${allJuly21.length}`);
      console.log(`  Instagram: ${allJuly21.filter(l => l.source === 'Instagram').length}`);
      console.log(`  Facebook: ${facebookLeads.length}`);
      console.log(`  Other/Manual: ${allJuly21.filter(l => !l.source || (l.source !== 'Instagram' && l.source !== 'Facebook')).length}`);
      if (facebookLeads.length > 0) {
        console.log('\n📘 Facebook Leads Found:');
        facebookLeads.forEach(lead => {
          console.log(`  - ${lead.name} (${lead.email})`);
        });
      }
      // Check webhook logs or recent errors
      console.log('\n🔍 Possible reasons for missing lead:');
      console.log('1. Webhook processing error');
      console.log('2. Lead came from Facebook placement (not Instagram)');
      console.log('3. Timing issue (lead created late on July 21)');
      // Check if Facebook Ads API is showing placement breakdown
      console.log('\n💡 Recommendations:');
      console.log('1. Check Facebook Ads Manager placement breakdown');
      console.log('2. Look for any webhook error logs from July 21');
      console.log('3. Verify if the missing lead is from Facebook placement');
      // Show Meta Lead IDs for cross-reference
      console.log('\n📋 Meta Lead IDs from CRM (for cross-reference with Ads Manager):');
      allJuly21.filter(l => l.meta_lead_id).forEach(lead => {
        console.log(`  ${lead.meta_lead_id} - ${lead.name}`);
      });
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
  checkFacebookLeads();
