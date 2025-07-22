// Test script to verify Facebook webhook configuration
const fetch = require('node-fetch');
require('dotenv').config();

const ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN;
const APP_ID = process.env.FACEBOOK_APP_ID;
const WEBHOOK_URL = 'https://fantopark-backend-150582227311.us-central1.run.app/webhooks/meta-leads';

async function testWebhook() {
  console.log('🧪 Testing Facebook Webhook Configuration\n');
  
  // 1. Test Access Token
  console.log('1️⃣ Testing Access Token...');
  try {
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${ACCESS_TOKEN}`
    );
    const tokenData = await tokenResponse.json();
    
    if (tokenResponse.ok) {
      console.log('✅ Access token is valid');
      console.log('   Page ID:', tokenData.id);
      console.log('   Page Name:', tokenData.name);
    } else {
      console.log('❌ Access token is invalid:', tokenData.error?.message);
      return;
    }
  } catch (error) {
    console.log('❌ Failed to validate token:', error.message);
    return;
  }

  // 2. Check Token Permissions
  console.log('\n2️⃣ Checking Token Permissions...');
  try {
    const permResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/permissions?access_token=${ACCESS_TOKEN}`
    );
    const permData = await permResponse.json();
    
    if (permResponse.ok && permData.data) {
      const permissions = permData.data.map(p => p.permission);
      console.log('   Current permissions:', permissions.join(', '));
      
      const requiredPerms = ['pages_manage_metadata', 'leads_retrieval', 'pages_read_engagement'];
      const missingPerms = requiredPerms.filter(p => !permissions.includes(p));
      
      if (missingPerms.length > 0) {
        console.log('⚠️  Missing required permissions:', missingPerms.join(', '));
      } else {
        console.log('✅ All required permissions are granted');
      }
    }
  } catch (error) {
    console.log('❌ Failed to check permissions:', error.message);
  }

  // 3. Get Page Subscribed Apps
  console.log('\n3️⃣ Checking Webhook Subscriptions...');
  try {
    const pageId = (await (await fetch(`https://graph.facebook.com/v18.0/me?access_token=${ACCESS_TOKEN}`)).json()).id;
    
    const subResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/subscribed_apps?access_token=${ACCESS_TOKEN}`
    );
    const subData = await subResponse.json();
    
    console.log('   Raw subscription data:', JSON.stringify(subData, null, 2));
    
    if (subResponse.ok && subData.data) {
      if (subData.data.length === 0) {
        console.log('❌ No apps are subscribed to this page');
        console.log('   You need to subscribe your app to receive webhooks');
      } else {
        console.log(`   Found ${subData.data.length} subscribed app(s)`);
        
        subData.data.forEach(app => {
          console.log(`\n   App ID: ${app.id}`);
          console.log(`   Subscribed fields: ${app.subscribed_fields?.join(', ') || 'None'}`);
          
          if (app.id === APP_ID) {
            console.log('   ✅ This is your app!');
            
            if (!app.subscribed_fields?.includes('leadgen')) {
              console.log('   ⚠️  Warning: "leadgen" field is NOT subscribed!');
              console.log('   You need to subscribe to the leadgen field to receive leads');
            } else {
              console.log('   ✅ "leadgen" field is subscribed');
            }
          }
        });
        
        if (!subData.data.find(app => app.id === APP_ID)) {
          console.log(`\n❌ Your app (${APP_ID}) is NOT subscribed to this page`);
        }
      }
    }
  } catch (error) {
    console.log('❌ Failed to check subscriptions:', error.message);
  }

  // 4. Get Recent Lead Forms
  console.log('\n4️⃣ Checking Lead Forms...');
  try {
    const pageId = (await (await fetch(`https://graph.facebook.com/v18.0/me?access_token=${ACCESS_TOKEN}`)).json()).id;
    
    const formsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/leadgen_forms?limit=5&access_token=${ACCESS_TOKEN}`
    );
    const formsData = await formsResponse.json();
    
    if (formsResponse.ok && formsData.data) {
      console.log(`   Found ${formsData.data.length} lead forms`);
      
      formsData.data.forEach((form, index) => {
        console.log(`\n   Form ${index + 1}:`);
        console.log(`   - Name: ${form.name}`);
        console.log(`   - ID: ${form.id}`);
        console.log(`   - Status: ${form.status}`);
        console.log(`   - Created: ${new Date(form.created_time).toLocaleDateString()}`);
      });
      
      if (formsData.data.length === 0) {
        console.log('⚠️  No lead forms found. Create a lead form in Facebook Ads Manager.');
      }
    }
  } catch (error) {
    console.log('❌ Failed to fetch lead forms:', error.message);
  }

  // 5. Test Webhook Endpoint
  console.log('\n5️⃣ Testing Your Webhook Endpoint...');
  try {
    const testResponse = await fetch(`${WEBHOOK_URL}?hub.mode=subscribe&hub.verify_token=fantopark-webhook-verify-2024&hub.challenge=test123`);
    const testResult = await testResponse.text();
    
    if (testResponse.ok && testResult === 'test123') {
      console.log('✅ Webhook verification endpoint is working');
    } else {
      console.log('❌ Webhook verification failed');
      console.log('   Response:', testResult);
    }
  } catch (error) {
    console.log('❌ Failed to reach webhook endpoint:', error.message);
    console.log('   Make sure your backend is deployed and accessible');
  }

  // 6. Check for Recent Leads
  console.log('\n6️⃣ Checking for Recent Leads...');
  try {
    const pageId = (await (await fetch(`https://graph.facebook.com/v18.0/me?access_token=${ACCESS_TOKEN}`)).json()).id;
    
    // Get forms first
    const formsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/leadgen_forms?limit=3&access_token=${ACCESS_TOKEN}`
    );
    const formsData = await formsResponse.json();
    
    if (formsResponse.ok && formsData.data && formsData.data.length > 0) {
      // Check leads for each form
      for (const form of formsData.data) {
        const leadsResponse = await fetch(
          `https://graph.facebook.com/v18.0/${form.id}/leads?limit=5&access_token=${ACCESS_TOKEN}`
        );
        const leadsData = await leadsResponse.json();
        
        if (leadsResponse.ok && leadsData.data && leadsData.data.length > 0) {
          console.log(`\n   Form "${form.name}" has ${leadsData.data.length} recent leads`);
          console.log('   Most recent lead:', new Date(leadsData.data[0].created_time).toLocaleString());
        }
      }
    }
  } catch (error) {
    console.log('❌ Failed to check for leads:', error.message);
  }

  console.log('\n\n📋 Summary:');
  console.log('- Webhook URL:', WEBHOOK_URL);
  console.log('- Verify Token: fantopark-webhook-verify-2024');
  console.log('\n💡 Next Steps:');
  console.log('1. Make sure your app is subscribed to the page with "leadgen" field');
  console.log('2. Ensure your webhook URL is correctly configured in Facebook App Dashboard');
  console.log('3. Test with a real lead form submission');
  console.log('4. Monitor your backend logs for incoming webhook calls');
}

// Run the test
testWebhook().catch(console.error);