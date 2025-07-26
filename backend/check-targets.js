require('dotenv').config();
const { db } = require('./src/config/db');

async function checkTargets() {
  try {
    console.log('🎯 Checking sales performance member targets...\n');
    
    // Get all sales performance members
    const membersSnapshot = await db.collection('sales_performance_members').get();
    
    console.log(`Found ${membersSnapshot.size} sales team members:\n`);
    
    membersSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`${data.name || 'Unknown'}:`);
      console.log(`  - ID: ${doc.id}`);
      console.log(`  - Email: ${data.email || 'Not set'}`);
      console.log(`  - Target: ${data.target || 0} Cr`);
      console.log(`  - Has target field: ${data.hasOwnProperty('target')}`);
      console.log('');
    });
    
    // Check if any member has a non-zero target
    const hasTargets = membersSnapshot.docs.some(doc => {
      const data = doc.data();
      return data.target && data.target > 0;
    });
    
    if (!hasTargets) {
      console.log('❗ No targets have been set for any team member.');
      console.log('✅ You can set targets by clicking on the target field in the sales performance table.');
    } else {
      console.log('✅ Some targets are already set.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
}

checkTargets();