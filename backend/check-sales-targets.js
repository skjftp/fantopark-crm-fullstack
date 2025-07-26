require('dotenv').config();
const { db } = require('./src/config/db');

async function checkSalesTargets() {
  try {
    console.log('🎯 Checking sales targets...\n');
    
    // Get all sales targets
    const targetsSnapshot = await db.collection('sales_targets').get();
    
    console.log(`Found ${targetsSnapshot.size} sales targets:\n`);
    
    // Get user details for each target
    for (const doc of targetsSnapshot.docs) {
      const targetData = doc.data();
      const userId = doc.id;
      
      // Get user info
      const userDoc = await db.collection('crm_users').doc(userId).get();
      const userData = userDoc.exists ? userDoc.data() : {};
      
      console.log(`${userData.name || 'Unknown User'}:`);
      console.log(`  - User ID: ${userId}`);
      console.log(`  - Email: ${userData.email || 'Not found'}`);
      console.log(`  - Target: ₹${targetData.target / 10000000} Cr`);
      console.log(`  - Updated: ${targetData.updatedAt}`);
      console.log(`  - Updated by: ${targetData.updatedBy}`);
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
}

checkSalesTargets();