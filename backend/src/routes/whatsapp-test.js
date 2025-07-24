const express = require('express');
const router = express.Router();
const axios = require('axios');

// Test endpoint for WhatsApp message sending
router.post('/test-message', async (req, res) => {
  try {
    const { testPhone, customerName = 'Test Customer', repName = 'Sumit', repPhone = '9810272027', preferredTime = '10 AM - 12 PM' } = req.body;
    
    // Use provided test phone or default
    const phoneNumber = testPhone || '919955100649'; // Adding 91 for India
    
    // WhatsApp Cloud API configuration
    const WHATSAPP_API_URL = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN;
    
    console.log('📱 Sending test WhatsApp message to:', phoneNumber);
    console.log('🔧 Using Phone Number ID:', process.env.WHATSAPP_PHONE_NUMBER_ID);
    
    // Prepare the message payload
    const messagePayload = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'template',
      template: {
        name: 'lead_welcome_v1',
        language: {
          code: 'en_US' // Change to 'en' if your template uses that
        },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: customerName },
              { type: 'text', text: repName },
              { type: 'text', text: repPhone },
              { type: 'text', text: preferredTime }
            ]
          }
        ]
      }
    };
    
    console.log('📤 Message payload:', JSON.stringify(messagePayload, null, 2));
    
    // Send the message
    const response = await axios.post(WHATSAPP_API_URL, messagePayload, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ WhatsApp API response:', response.data);
    
    res.json({
      success: true,
      message: 'Test message sent successfully',
      response: response.data,
      sentTo: phoneNumber
    });
    
  } catch (error) {
    console.error('❌ Error sending WhatsApp test message:', error.response?.data || error.message);
    
    res.status(500).json({
      success: false,
      error: error.response?.data?.error || error.message,
      details: error.response?.data
    });
  }
});

// Test endpoint to check configuration
router.get('/test-config', (req, res) => {
  res.json({
    configured: {
      phoneNumberId: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
      accessToken: !!process.env.META_PAGE_ACCESS_TOKEN,
      businessAccountId: !!process.env.WHATSAPP_BUSINESS_ACCOUNT_ID
    },
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ? 'Configured' : 'Missing',
    testEndpoint: '/api/whatsapp-test/test-message',
    testPayload: {
      testPhone: '919955100649',
      customerName: 'Test Customer',
      repName: 'Sumit',
      repPhone: '9810272027',
      preferredTime: '10 AM - 12 PM'
    }
  });
});

// Debug endpoint to check WhatsApp Business Account permissions
router.get('/debug-permissions', async (req, res) => {
  try {
    const ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN;
    
    // Check WhatsApp Business Account
    const wabaSresponse = await axios.get(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}`,
      {
        params: {
          access_token: ACCESS_TOKEN,
          fields: 'id,name,currency,timezone_id,business_verification_status'
        }
      }
    );
    
    // Check phone number details
    const phoneResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}`,
      {
        params: {
          access_token: ACCESS_TOKEN,
          fields: 'display_phone_number,verified_name,code_verification_status,quality_rating'
        }
      }
    );
    
    // Check assigned users
    const usersResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/assigned_users`,
      {
        params: {
          access_token: ACCESS_TOKEN
        }
      }
    );
    
    res.json({
      success: true,
      businessAccount: wabaSresponse.data,
      phoneNumber: phoneResponse.data,
      assignedUsers: usersResponse.data,
      tokenInfo: {
        hasToken: !!ACCESS_TOKEN,
        tokenPrefix: ACCESS_TOKEN ? ACCESS_TOKEN.substring(0, 20) + '...' : null
      }
    });
    
  } catch (error) {
    console.error('Debug error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error || error.message,
      details: error.response?.data
    });
  }
});

module.exports = router;