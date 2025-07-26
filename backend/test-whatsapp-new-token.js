#!/usr/bin/env node

// Test WhatsApp message with new token
const axios = require('axios');

// Your provided token
const ACCESS_TOKEN = 'EAAiYOriHXGEBPIDuPtuq1ACyqozl1sZA7NeP6vpyHlZBjMV0bZBBV5YZAzbIUloaCZBWAKpXwKBkRl2bDl1FOeQYMgUc0j3QqZChM7ZCg7ZBSEv8FNsdaoMiAnUimwJFs4o7G7iH64shvB8KXr3GIKp6ZAroPq5TKj4mvhZBTSy4SSffpEDDsmAzb8ZBKlcHZCEZC81P9EgZDZD';

// You'll need to provide your WhatsApp Phone Number ID
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || 'YOUR_PHONE_NUMBER_ID';

async function testMessage() {
  console.log('🚀 Testing WhatsApp message with new token...');
  
  // Test configuration first
  try {
    // First, let's check if the token is valid by fetching the phone number details
    const configUrl = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}`;
    console.log('📋 Checking phone number configuration...');
    
    const configResponse = await axios.get(configUrl, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      }
    });
    
    console.log('✅ Phone number config:', configResponse.data);
    
  } catch (error) {
    console.error('❌ Configuration check failed:', error.response?.data || error.message);
    console.log('\n⚠️  Please make sure to set the correct PHONE_NUMBER_ID');
    return;
  }
  
  // Now try to send a test message
  try {
    const messageUrl = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;
    const testPhone = '919955100649'; // Test number
    
    const messagePayload = {
      messaging_product: 'whatsapp',
      to: testPhone,
      type: 'text',
      text: {
        body: 'Hello! This is a test message from FanToPark CRM using the new WhatsApp token.'
      }
    };
    
    console.log('\n📱 Sending test message to:', testPhone);
    
    const response = await axios.post(messageUrl, messagePayload, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Message sent successfully!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ Message send failed:', error.response?.data || error.message);
    
    if (error.response?.data?.error) {
      const err = error.response.data.error;
      console.log('\nError details:');
      console.log('- Code:', err.code);
      console.log('- Type:', err.type);
      console.log('- Message:', err.message);
      
      if (err.code === 190) {
        console.log('\n⚠️  Token might be invalid or expired');
      } else if (err.code === 100) {
        console.log('\n⚠️  Parameter error - check phone number ID or message format');
      }
    }
  }
}

// Check if PHONE_NUMBER_ID is provided
if (process.argv[2]) {
  PHONE_NUMBER_ID = process.argv[2];
}

console.log('📌 Using Phone Number ID:', PHONE_NUMBER_ID);
console.log('🔑 Token:', ACCESS_TOKEN.substring(0, 20) + '...');

testMessage();