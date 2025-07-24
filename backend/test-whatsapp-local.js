#!/usr/bin/env node

// Test WhatsApp message sending locally
// Usage: node test-whatsapp-local.js

const axios = require('axios');

// Configuration
const API_URL = 'https://fantopark-backend-150582227311.us-central1.run.app/api/whatsapp-test/test-message';
const TEST_PHONE = '919955100649'; // Your test number with country code

async function testWhatsAppMessage() {
  console.log('🚀 Testing WhatsApp message sending...');
  console.log(`📱 Sending to: ${TEST_PHONE}`);
  
  try {
    const response = await axios.post(API_URL, {
      testPhone: TEST_PHONE,
      customerName: 'Test Customer',
      repName: 'Amisha',
      repPhone: '8422994352',
      preferredTime: '10 AM - 12 PM'
    });
    
    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data?.details) {
      console.error('Details:', JSON.stringify(error.response.data.details, null, 2));
    }
  }
}

// First check configuration
async function checkConfig() {
  try {
    const response = await axios.get('https://fantopark-backend-150582227311.us-central1.run.app/api/whatsapp-test/test-config');
    console.log('📋 Current configuration:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('\n');
  } catch (error) {
    console.error('❌ Could not check configuration:', error.message);
  }
}

// Run the test
(async () => {
  await checkConfig();
  await testWhatsAppMessage();
})();