// Test Facebook Pixel Access
const fetch = require('node-fetch');
require('dotenv').config();

async function testPixelAccess() {
    const pixelId = process.env.FACEBOOK_PIXEL_ID;
    const accessToken = process.env.FACEBOOK_CONVERSIONS_ACCESS_TOKEN;
    const appId = process.env.FACEBOOK_APP_ID;
    
    console.log('🔍 Testing Facebook Pixel Access...\n');
    console.log('Configuration:');
    console.log('- Pixel ID:', pixelId);
    console.log('- App ID:', appId);
    console.log('- Access Token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'NOT SET');
    console.log('\n-----------------------------------\n');
    
    // Test 1: Check if pixel exists and is accessible
    console.log('Test 1: Checking pixel accessibility...');
    try {
        const pixelResponse = await fetch(
            `https://graph.facebook.com/v18.0/${pixelId}?fields=id,name,is_unavailable&access_token=${accessToken}`
        );
        const pixelData = await pixelResponse.json();
        
        if (pixelResponse.ok) {
            console.log('✅ Pixel is accessible!');
            console.log('- Pixel ID:', pixelData.id);
            console.log('- Pixel Name:', pixelData.name || 'No name set');
            console.log('- Is Available:', !pixelData.is_unavailable);
        } else {
            console.log('❌ Cannot access pixel');
            console.log('Error:', pixelData.error?.message);
        }
    } catch (error) {
        console.log('❌ Network error:', error.message);
    }
    
    console.log('\n-----------------------------------\n');
    
    // Test 2: Send a test event
    console.log('Test 2: Sending test event...');
    const testEvent = {
        data: [{
            event_name: 'TestEvent',
            event_time: Math.floor(Date.now() / 1000),
            event_source_url: 'https://fantopark.com/test',
            action_source: 'website',
            user_data: {
                em: ['309a0a5c4e30e3b7d8b93ad67cea5f48f5406140b1e568c51f09ad69e8d8056e'], // Hashed test@example.com (in array format)
            },
            custom_data: {
                test_event: true,
                test_time: new Date().toISOString()
            }
        }],
        test_event_code: 'TEST_' + Date.now()
    };
    
    try {
        const response = await fetch(
            `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testEvent)
            }
        );
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Test event sent successfully!');
            console.log('- Events Received:', result.events_received);
            console.log('- Trace ID:', result.fbtrace_id);
            console.log('\n📊 Check Test Events in Facebook Events Manager:');
            console.log(`https://business.facebook.com/events_manager2/list/pixel/${pixelId}/test_events`);
            console.log(`\nTest Event Code: ${testEvent.test_event_code}`);
        } else {
            console.log('❌ Failed to send test event');
            console.log('Error Code:', result.error?.code);
            console.log('Error Message:', result.error?.message);
            console.log('Error Type:', result.error?.type);
            
            if (result.error?.error_user_msg) {
                console.log('\nUser Message:', result.error.error_user_msg);
            }
        }
    } catch (error) {
        console.log('❌ Network error:', error.message);
    }
    
    console.log('\n-----------------------------------\n');
    
    // Test 3: Check token permissions
    console.log('Test 3: Checking access token permissions...');
    try {
        const debugResponse = await fetch(
            `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${accessToken}`
        );
        const debugData = await debugResponse.json();
        
        if (debugResponse.ok && debugData.data) {
            console.log('✅ Token is valid');
            console.log('- App ID:', debugData.data.app_id);
            console.log('- Type:', debugData.data.type);
            console.log('- Valid:', debugData.data.is_valid);
            console.log('- Expires:', debugData.data.expires_at ? new Date(debugData.data.expires_at * 1000).toLocaleString() : 'Never');
            console.log('- Scopes:', debugData.data.scopes?.join(', ') || 'No scopes');
        } else {
            console.log('❌ Cannot debug token');
            console.log('Error:', debugData.error?.message);
        }
    } catch (error) {
        console.log('❌ Network error:', error.message);
    }
}

testPixelAccess().catch(console.error);