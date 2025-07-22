// backend/src/services/facebookConversionsService.js
const fetch = require('node-fetch');

class FacebookConversionsService {
  constructor() {
    this.pixelId = process.env.FACEBOOK_PIXEL_ID;
    this.accessToken = process.env.FACEBOOK_CONVERSIONS_ACCESS_TOKEN;
    this.apiVersion = 'v18.0';
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}/${this.pixelId}/events`;
  }

  // Send conversion event to Facebook
  async sendConversionEvent(eventData) {
    try {
      const payload = {
        data: [
          {
            event_name: eventData.event_name, // 'Lead', 'CompleteRegistration', 'Purchase'
            event_time: Math.floor(Date.now() / 1000), // Unix timestamp
            event_source_url: eventData.source_url || process.env.BASE_URL || 'https://crm.fantopark.com',
            user_data: this.hashUserData({
              email: eventData.email,
              phone: eventData.phone,
              first_name: eventData.first_name,
              last_name: eventData.last_name,
              city: eventData.city,
              country: eventData.country
            }),
            custom_data: {
              value: eventData.value || 0,
              currency: eventData.currency || 'INR',
              content_category: eventData.category || 'sports_events',
              content_name: eventData.content_name || '',
              num_items: eventData.num_people || 1
            },
            // Link back to original ad
            action_source: 'website'
            // Note: campaign_id, adset_id, ad_id are NOT included in event data
            // Facebook automatically attributes events to campaigns via user matching
          }
        ],
        test_event_code: process.env.NODE_ENV === 'development' ? process.env.FACEBOOK_TEST_EVENT_CODE : undefined
      };

      console.log('🚀 Sending Facebook conversion event:', {
        pixel_id: this.pixelId,
        event_name: eventData.event_name,
        user_email: eventData.email,
        value: eventData.value,
        test_mode: !!payload.test_event_code
      });

      const response = await fetch(`${this.baseUrl}?access_token=${this.accessToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`Facebook API Error: ${JSON.stringify(result)}`);
      }

      console.log('✅ Conversion event sent to Facebook:', {
        event: eventData.event_name,
        email: eventData.email,
        events_received: result.events_received || 0,
        fbtrace_id: result.fbtrace_id
      });

      return result;
    } catch (error) {
      console.error('❌ Error sending conversion to Facebook:', error);
      throw error;
    }
  }

  // Hash user data for privacy (required by Facebook)
  hashUserData(userData) {
    const crypto = require('crypto');
    const hashedData = {};

    // Map field names to Facebook's required format
    const fieldMapping = {
      'email': 'em',
      'phone': 'ph',
      'first_name': 'fn',
      'last_name': 'ln',
      'city': 'ct',
      'country': 'country'
    };

    Object.keys(userData).forEach(key => {
      if (userData[key]) {
        // Normalize and hash the data
        let value = userData[key].toString().toLowerCase().trim();
        if (key === 'phone') {
          // Remove non-numeric characters from phone
          value = value.replace(/[^0-9]/g, '');
        }
        
        // Use Facebook's required field name
        const fbFieldName = fieldMapping[key] || key;
        hashedData[fbFieldName] = crypto.createHash('sha256').update(value).digest('hex');
      }
    });

    return hashedData;
  }

  // Send qualified lead event
  async sendQualifiedLeadEvent(leadData) {
    const [firstName, ...lastNameParts] = (leadData.name || '').split(' ');
    const lastName = lastNameParts.join(' ');

    return this.sendConversionEvent({
      event_name: 'CompleteRegistration', // Facebook standard event
      email: leadData.email,
      phone: leadData.phone,
      first_name: firstName,
      last_name: lastName,
      city: leadData.city_of_residence,
      country: leadData.country_of_residence,
      value: leadData.potential_value || 0,
      currency: 'INR',
      content_name: leadData.lead_for_event,  // Changed from event_name to content_name
      category: 'qualified_lead',
      num_people: leadData.number_of_people,
      campaign_data: {
        campaign_id: leadData.campaign_id,
        adset_id: leadData.adset_id,
        ad_id: leadData.ad_id
      }
    });
  }

  // Send converted lead event
  async sendConvertedLeadEvent(leadData, conversionValue) {
    const [firstName, ...lastNameParts] = (leadData.name || '').split(' ');
    const lastName = lastNameParts.join(' ');

    return this.sendConversionEvent({
      event_name: 'Purchase', // Facebook standard event for conversions
      email: leadData.email,
      phone: leadData.phone,
      first_name: firstName,
      last_name: lastName,
      city: leadData.city_of_residence,
      country: leadData.country_of_residence,
      value: conversionValue || leadData.last_quoted_price || 0,
      currency: 'INR',
      content_name: leadData.lead_for_event,  // Changed from event_name to content_name
      category: 'conversion',
      num_people: leadData.number_of_people,
      campaign_data: {
        campaign_id: leadData.campaign_id,
        adset_id: leadData.adset_id,
        ad_id: leadData.ad_id
      }
    });
  }

  // Send initiate checkout event when quote is requested
  async sendInitiateCheckoutEvent(leadData) {
    const [firstName, ...lastNameParts] = (leadData.name || '').split(' ');
    const lastName = lastNameParts.join(' ');

    return this.sendConversionEvent({
      event_name: 'InitiateCheckout', // Facebook standard event for quote requests
      email: leadData.email,
      phone: leadData.phone,
      first_name: firstName,
      last_name: lastName,
      city: leadData.city_of_residence,
      country: leadData.country_of_residence,
      value: leadData.potential_value || leadData.last_quoted_price || 0,
      currency: 'INR',
      content_name: leadData.lead_for_event,  // Changed from event_name to content_name
      category: 'quote_requested',
      num_people: leadData.number_of_people,
      campaign_data: {
        campaign_id: leadData.campaign_id,
        adset_id: leadData.adset_id,
        ad_id: leadData.ad_id
      }
    });
  }
}

module.exports = FacebookConversionsService;
