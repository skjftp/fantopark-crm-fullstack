// Check for recent Instagram leads and webhook activity
const { db } = require('./src/config/db');

async function checkRecentLeads() {
  console.log('🔍 Checking for recent Instagram leads...\n');
  
  try {
    // 1. Check for Instagram leads in the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentLeads = await db.collection('crm_leads')
      .where('source', '==', 'Instagram')
      .where('created_date', '>=', yesterday)
      .orderBy('created_date', 'desc')
      .limit(10)
      .get();
    
    console.log(`📊 Instagram leads in last 24 hours: ${recentLeads.size}`);
    
    if (recentLeads.size > 0) {
      console.log('\nRecent Instagram leads:');
      recentLeads.forEach(doc => {
        const lead = doc.data();
        console.log(`- ${lead.name} (${lead.email}) - ${new Date(lead.created_date.toDate()).toLocaleString()}`);
        console.log(`  Form: ${lead.form_name || 'N/A'}`);
        console.log(`  Campaign: ${lead.campaign_name || 'N/A'}`);
      });
    }
    
    // 2. Check for all Instagram leads
    const allInstagramLeads = await db.collection('crm_leads')
      .where('source', '==', 'Instagram')
      .orderBy('created_date', 'desc')
      .limit(5)
      .get();
    
    console.log(`\n📈 Total Instagram leads (last 5): ${allInstagramLeads.size}`);
    
    if (allInstagramLeads.size > 0) {
      console.log('\nLast 5 Instagram leads:');
      allInstagramLeads.forEach(doc => {
        const lead = doc.data();
        const date = lead.created_date?.toDate ? new Date(lead.created_date.toDate()) : new Date(lead.created_date);
        console.log(`- ${lead.name} - ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`);
      });
    } else {
      console.log('\n⚠️  No Instagram leads found in the database');
    }
    
    // 3. Check activity logs for webhook activity
    const webhookLogs = await db.collection('crm_activity_logs')
      .where('metadata.source', '==', 'Instagram')
      .where('created_date', '>=', yesterday)
      .orderBy('created_date', 'desc')
      .limit(10)
      .get();
    
    console.log(`\n📝 Webhook activity logs in last 24 hours: ${webhookLogs.size}`);
    
    if (webhookLogs.size > 0) {
      console.log('\nRecent webhook activity:');
      webhookLogs.forEach(doc => {
        const log = doc.data();
        console.log(`- ${log.description} - ${new Date(log.created_date.toDate()).toLocaleString()}`);
      });
    }
    
    // 4. Check the last lead from any source
    const lastLead = await db.collection('crm_leads')
      .orderBy('created_date', 'desc')
      .limit(1)
      .get();
    
    if (!lastLead.empty) {
      const lead = lastLead.docs[0].data();
      const date = lead.created_date?.toDate ? new Date(lead.created_date.toDate()) : new Date(lead.created_date);
      console.log(`\n🕐 Last lead created (any source):`);
      console.log(`   Name: ${lead.name}`);
      console.log(`   Source: ${lead.source}`);
      console.log(`   Date: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking leads:', error);
  } finally {
    process.exit(0);
  }
}

checkRecentLeads();