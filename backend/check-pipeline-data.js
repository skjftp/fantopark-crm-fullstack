require('dotenv').config();
const { db } = require('./src/config/db');

async function checkPipelineData() {
  try {
    console.log('🔍 Checking pipeline data...\n');
    
    // Get leads with potential_value > 0 and hot/warm status
    const leadsSnapshot = await db.collection('crm_leads')
      .where('potential_value', '>', 0)
      .limit(20)
      .get();
    
    console.log(`Found ${leadsSnapshot.size} leads with potential value > 0:\n`);
    
    const hotWarmLeads = [];
    
    leadsSnapshot.forEach(doc => {
      const lead = doc.data();
      const status = (lead.status || '').toLowerCase();
      const temperature = (lead.temperature || '').toLowerCase();
      
      const isHotWarm = status === 'hot' || status === 'warm' || status === 'cold' ||
        ((status === 'quote_requested' || status === 'quote_received') && 
         (temperature === 'hot' || temperature === 'warm' || temperature === 'cold'));
      
      if (isHotWarm) {
        hotWarmLeads.push({
          id: doc.id,
          name: lead.name,
          assigned_to: lead.assigned_to,
          status: lead.status,
          temperature: lead.temperature,
          potential_value: lead.potential_value,
          business_type: lead.business_type
        });
      }
    });
    
    console.log(`\nHot/Warm/Cold leads with pipeline value:`);
    console.log('========================================');
    
    hotWarmLeads.forEach(lead => {
      console.log(`\n${lead.name}:`);
      console.log(`  - Status: ${lead.status}`);
      console.log(`  - Temperature: ${lead.temperature || 'Not set'}`);
      console.log(`  - Potential Value: ₹${(lead.potential_value || 0).toLocaleString()}`);
      console.log(`  - Business Type: ${lead.business_type || 'Not set'}`);
      console.log(`  - Assigned To: ${lead.assigned_to || 'Unassigned'}`);
    });
    
    // Check status distribution
    console.log('\n\nStatus Distribution:');
    console.log('===================');
    const statusCounts = {};
    const allLeads = await db.collection('crm_leads').get();
    
    allLeads.forEach(doc => {
      const status = doc.data().status || 'no_status';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    Object.entries(statusCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count]) => {
        console.log(`${status}: ${count}`);
      });
    
    // Check how many leads have potential_value set
    let withValue = 0;
    let withoutValue = 0;
    
    allLeads.forEach(doc => {
      const pv = doc.data().potential_value;
      if (pv && pv > 0) {
        withValue++;
      } else {
        withoutValue++;
      }
    });
    
    console.log(`\n\nPotential Value Stats:`);
    console.log(`- With value: ${withValue}`);
    console.log(`- Without value: ${withoutValue}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
}

checkPipelineData();