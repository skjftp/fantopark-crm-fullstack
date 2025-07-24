# WhatsApp Business API Setup Guide

## Current Status
- ✅ WhatsApp Business Account ID: `609901035292191`
- ✅ Phone Number: `9810272027`
- ⏳ Phone Number ID: **Still needed from Meta Business Manager**

## Steps to Complete Setup

### 1. Get Phone Number ID from Meta Business Manager

1. Go to [Meta Business Manager](https://business.facebook.com)
2. Navigate to **WhatsApp Manager** → **Phone Numbers**
3. Find your phone number `9810272027`
4. Copy the **Phone Number ID** (it will be a long numeric ID)
5. Add it to `.env` file:
   ```
   WHATSAPP_PHONE_NUMBER_ID=<your_phone_number_id>
   ```

### 2. Create Message Templates

You need to create these templates in Meta Business Manager:

#### Template 1: `lead_welcome_v1`
- **Name**: `lead_welcome_v1`
- **Category**: Marketing
- **Language**: English
- **Body Text**:
  ```
  Hi {{1}}, thank you for showing interest in our sports events! 
  
  Your relationship manager {{2}} ({{3}}) will reach out to you at {{4}}.
  
  Meanwhile, you can check out our upcoming events and exclusive offers.
  ```
- **Parameters**:
  1. Customer Name
  2. Sales Rep Name
  3. Sales Rep Phone
  4. Preferred Time

#### Template 2: `lead_qualification_v1`
- **Name**: `lead_qualification_v1`
- **Category**: Marketing
- **Language**: English
- **Body Text**:
  ```
  To help us serve you better, I'd like to ask you a few quick questions about your requirements. This will only take 2 minutes.
  ```

### 3. Configure Webhook in Meta Business Manager

1. Go to **WhatsApp Manager** → **Configuration**
2. Set up webhook:
   - **Callback URL**: `https://fantopark-backend-150582227311.us-central1.run.app/api/whatsapp/webhook`
   - **Verify Token**: `fantopark-webhook-verify-2024`
3. Subscribe to webhook fields:
   - ✅ messages
   - ✅ message_status
   - ✅ message_template_status_update

### 4. Verify Phone Number

If not already verified:
1. Go to **Phone Numbers** section
2. Click on your number
3. Follow verification process
4. Enable the number for WhatsApp Business API

### 5. Test the Integration

Once setup is complete:

1. **Test Webhook Connection**:
   ```bash
   curl https://fantopark-backend-150582227311.us-central1.run.app/api/whatsapp/webhook
   ```

2. **Test Manual Message Send**:
   - Go to CRM
   - Open any lead detail
   - Go to WhatsApp tab
   - Click "Send Message" button

3. **Test Auto-Assignment Flow**:
   - Create a new lead from Facebook/Instagram
   - Check if welcome message is sent when assigned

## Troubleshooting

### Common Issues:

1. **"Phone number ID not configured"**
   - Make sure `WHATSAPP_PHONE_NUMBER_ID` is set in `.env`

2. **"Template not found"**
   - Ensure templates are approved in Meta Business Manager
   - Template names must match exactly

3. **"Invalid token"**
   - Check that `META_PAGE_ACCESS_TOKEN` has WhatsApp permissions
   - May need to regenerate token with WhatsApp scope

### Monitoring:

- Check backend logs for WhatsApp-related messages
- Look for "📱 WhatsApp welcome message triggered" in logs
- Monitor webhook responses in Meta Business Manager

## API Limits

- **Messaging**: 1000 business-initiated conversations per day (can be increased)
- **Template Messages**: Unlimited to opted-in users
- **Interactive Messages**: Must be within 24-hour session window

## Next Features to Consider

1. **Rich Media Messages**: Send images/PDFs of event details
2. **Quick Replies**: Pre-defined responses for common questions
3. **Catalog Integration**: Show event inventory directly in WhatsApp
4. **Payment Integration**: Accept payments through WhatsApp