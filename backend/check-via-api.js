// Check lead and inventory via API
const fetch = require('node-fetch');

async function checkViaAPI() {
  const leadId = 'GTgfjY6yJNpnQQWGA3y8';
  const inventoryId = 'jx2GQ4Sf7pqGiJe1Nnwl';
  
  // Use the production API
  const baseUrl = 'https://fantopark-backend-150582227311.us-central1.run.app/api';
  
  // You would need a valid auth token here
  // For now, let's output the curl commands you can run
  
  console.log('🔍 API Commands to check lead and inventory:\n');
  
  console.log('1. First, get an auth token by logging in:');
  console.log('curl -X POST https://fantopark-backend-150582227311.us-central1.run.app/api/auth/login \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"email": "your-email", "password": "your-password"}\'');
  console.log('\n');
  
  console.log('2. Check the lead details:');
  console.log(`curl -H "Authorization: Bearer YOUR_TOKEN" \\`);
  console.log(`  ${baseUrl}/leads/${leadId}`);
  console.log('\n');
  
  console.log('3. Check the inventory details:');
  console.log(`curl -H "Authorization: Bearer YOUR_TOKEN" \\`);
  console.log(`  ${baseUrl}/inventory/${inventoryId}`);
  console.log('\n');
  
  console.log('4. Check existing allocations for this inventory:');
  console.log(`curl -H "Authorization: Bearer YOUR_TOKEN" \\`);
  console.log(`  ${baseUrl}/inventory/${inventoryId}/allocations`);
  console.log('\n');
  
  console.log('Replace YOUR_TOKEN with the token you get from the login response.');
}

checkViaAPI();