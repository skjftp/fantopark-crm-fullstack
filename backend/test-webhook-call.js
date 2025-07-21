// Simulate a Facebook webhook call to test if it's working
const fetch = require('node-fetch');
const crypto = require('crypto');

const WEBHOOK_URL = 'https://fantopark-backend-150582227311.us-central1.run.app/webhooks/meta-leads';
const APP_SECRET = process.env.META_APP_SECRET || '7611662ab8e4e65375347effda257067';

// Sample webhook payload (similar to what Facebook sends)
const payload = {
  entry: [{
    id: "10161336626146640",
    time: Date.now() / 1000,
    changes: [{
      field: "leadgen",
      value: {
        leadgen_id: "123456789",
        page_id: "10161336626146640",
        form_id: "987654321",
        created_time: Date.now() / 1000,
        ad_id: "111111",
        adgroup_id: "222222"
      }
    }]
  }]
};

// Generate Facebook signature
const payloadString = JSON.stringify(payload);
const signature = `sha256=${crypto.createHmac('sha256', APP_SECRET).update(payloadString).digest('hex')}`;

async function testWebhook() {
  console.log('🚀 Sending test webhook call...\n');
  console.log('URL:', WEBHOOK_URL);
  console.log('Payload:', JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hub-Signature-256': signature
      },
      body: payloadString
    });
    
    console.log('\n📡 Response Status:', response.status, response.statusText);
    const responseText = await response.text();
    console.log('Response Body:', responseText || '(empty)');
    
    if (response.status === 200) {
      console.log('\n✅ Webhook endpoint is working correctly!');
      console.log('Check your backend logs to see if the webhook was processed.');
    } else {
      console.log('\n❌ Webhook returned an error status');
    }
    
  } catch (error) {
    console.error('\n❌ Error calling webhook:', error.message);
    console.log('\nThis could mean:');
    console.log('1. The backend is not deployed or accessible');
    console.log('2. There\'s a network/firewall issue');
    console.log('3. The URL is incorrect');
  }
}

testWebhook();