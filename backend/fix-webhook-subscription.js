// Script to fix Facebook webhook subscription
const fetch = require('node-fetch');
require('dotenv').config();

const USER_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN; // This seems to be a user token
const APP_ID = process.env.FACEBOOK_APP_ID;
const APP_SECRET = process.env.META_APP_SECRET;

async function fixWebhookSubscription() {
  console.log('🔧 Fixing Facebook Webhook Subscription\n');
  
  try {
    // Step 1: Get Page ID and Page Access Token
    console.log('1️⃣ Getting Page Information...');
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${USER_ACCESS_TOKEN}`
    );
    const pagesData = await pagesResponse.json();
    
    if (!pagesResponse.ok || !pagesData.data) {
      console.error('❌ Error getting pages:', pagesData.error?.message);
      return;
    }
    
    if (pagesData.data.length === 0) {
      console.error('❌ No pages found for this user');
      return;
    }
    
    console.log(`Found ${pagesData.data.length} page(s):\n`);
    
    // For each page, check and fix subscription
    for (const page of pagesData.data) {
      console.log(`\n📄 Page: ${page.name} (ID: ${page.id})`);
      console.log(`   Access Token: ${page.access_token ? '✅ Available' : '❌ Missing'}`);
      
      if (!page.access_token) {
        console.log('   ⚠️  No page access token available for this page');
        continue;
      }
      
      // Step 2: Check current subscriptions
      console.log('\n   Checking current subscriptions...');
      const subCheckResponse = await fetch(
        `https://graph.facebook.com/v18.0/${page.id}/subscribed_apps?access_token=${page.access_token}`
      );
      const subCheckData = await subCheckResponse.json();
      
      if (subCheckResponse.ok && subCheckData.data) {
        const existingApp = subCheckData.data.find(app => app.id === APP_ID);
        
        if (existingApp) {
          console.log(`   ✅ App is already subscribed`);
          console.log(`   Subscribed fields: ${existingApp.subscribed_fields?.join(', ') || 'None'}`);
          
          if (!existingApp.subscribed_fields?.includes('leadgen')) {
            console.log('   ⚠️  "leadgen" field is NOT subscribed - fixing...');
          } else {
            console.log('   ✅ "leadgen" field is already subscribed');
            continue; // Skip to next page
          }
        } else {
          console.log('   ❌ App is NOT subscribed - subscribing now...');
        }
      }
      
      // Step 3: Subscribe to webhook with leadgen field
      console.log('\n   Subscribing to leadgen webhook...');
      
      const subscribeUrl = `https://graph.facebook.com/v18.0/${page.id}/subscribed_apps`;
      const subscribeParams = new URLSearchParams({
        subscribed_fields: 'leadgen',
        access_token: page.access_token
      });
      
      const subscribeResponse = await fetch(subscribeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: subscribeParams
      });
      
      const subscribeData = await subscribeResponse.json();
      
      if (subscribeResponse.ok && subscribeData.success) {
        console.log('   ✅ Successfully subscribed to leadgen webhook!');
        
        // Verify subscription
        const verifyResponse = await fetch(
          `https://graph.facebook.com/v18.0/${page.id}/subscribed_apps?access_token=${page.access_token}`
        );
        const verifyData = await verifyResponse.json();
        
        if (verifyResponse.ok && verifyData.data) {
          const app = verifyData.data.find(a => a.id === APP_ID);
          if (app) {
            console.log(`   ✅ Verified: Subscribed fields: ${app.subscribed_fields?.join(', ')}`);
          }
        }
      } else {
        console.error('   ❌ Failed to subscribe:', subscribeData.error?.message || 'Unknown error');
      }
      
      // Step 4: Update .env with Page Access Token if needed
      if (page.name === 'Sumit Kumar Jha' || page.id === '10161336626146640') {
        console.log('\n   💡 This appears to be your main page.');
        console.log('   Consider updating META_PAGE_ACCESS_TOKEN in .env with this page access token');
        console.log('   to ensure it\'s using a Page token instead of User token.');
      }
    }
    
    console.log('\n\n✅ Webhook Configuration Summary:');
    console.log('- Webhook URL: https://fantopark-backend-150582227311.us-central1.run.app/webhooks/meta-leads');
    console.log('- Verify Token: fantopark-webhook-verify-2024');
    console.log('\n📝 Next Steps:');
    console.log('1. Make sure the webhook URL above is configured in Facebook App Dashboard');
    console.log('2. Test with a real lead form submission');
    console.log('3. Monitor your backend logs for incoming webhooks');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixWebhookSubscription();