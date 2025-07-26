require('dotenv').config();
const { db } = require('./src/config/db');

async function checkAnilPipeline() {
  try {
    console.log('🔍 Checking Anil\'s pipeline specifically...\n');
    
    // Get all leads assigned to Anil
    const anilLeads = await db.collection('crm_leads')
      .where('assigned_to', '==', 'anil@fantopark.com')
      .get();
    
    console.log(`Total leads assigned to Anil: ${anilLeads.size}\n`);
    
    let retailPipeline = 0;
    let corporatePipeline = 0;
    const pipelineLeads = [];
    
    anilLeads.forEach(doc => {
      const lead = doc.data();
      const potentialValue = parseFloat(lead.potential_value || 0);
      const status = (lead.status || '').toLowerCase();
      const temperature = (lead.temperature || '').toLowerCase();
      
      const isHotWarmCold = status === 'hot' || status === 'warm' || status === 'cold' ||
        ((status === 'quote_requested' || status === 'quote_received') && 
         (temperature === 'hot' || temperature === 'warm' || temperature === 'cold'));
      
      if (isHotWarmCold && potentialValue > 0) {
        pipelineLeads.push({
          name: lead.name,
          status: lead.status,
          temperature: lead.temperature,
          potential_value: potentialValue,
          business_type: lead.business_type
        });
        
        if (lead.business_type === 'B2C') {
          retailPipeline += potentialValue;
        } else if (lead.business_type === 'B2B') {
          corporatePipeline += potentialValue;
        } else {
          retailPipeline += potentialValue;
        }
      }
    });
    
    console.log('Pipeline Leads:');
    console.log('==============');
    pipelineLeads.forEach(lead => {
      console.log(`- ${lead.name}: ₹${lead.potential_value.toLocaleString()} (${lead.status}, ${lead.business_type || 'No type'})`);
    });
    
    console.log(`\nTotal Pipeline:`);
    console.log(`- Retail (B2C): ₹${retailPipeline.toLocaleString()}`);
    console.log(`- Corporate (B2B): ₹${corporatePipeline.toLocaleString()}`);
    console.log(`- Overall: ₹${(retailPipeline + corporatePipeline).toLocaleString()}`);
    console.log(`- In Crores: ₹${((retailPipeline + corporatePipeline) / 10000000).toFixed(2)} Cr`);
    
    // Check user info
    const userSnapshot = await db.collection('crm_users')
      .where('email', '==', 'anil@fantopark.com')
      .limit(1)
      .get();
    
    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      console.log(`\nUser Info:`);
      console.log(`- Name: ${userData.name}`);
      console.log(`- ID: ${userSnapshot.docs[0].id}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
}

checkAnilPipeline();