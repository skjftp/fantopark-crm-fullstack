// backend/src/services/facebookFormsService.js
// Facebook Forms API Service with 15-minute cache
const fetch = require('node-fetch');

class FacebookFormsService {
  constructor() {
    this.accessToken = process.env.META_PAGE_ACCESS_TOKEN;
    this.appId = process.env.FACEBOOK_APP_ID;
    this.baseUrl = 'https://graph.facebook.com/v18.0';
    
    // Cache for storing forms data with 15-minute expiry
    this.cache = new Map();
    this.cacheExpiry = 15 * 60 * 1000; // 15 minutes in milliseconds
    
    // Fallback hardcoded forms (from existing implementation)
    this.fallbackForms = [
      { id: '4186748481542102', name: 'Test 17 Jul 2025' },
      { id: '1361858031771489', name: 'Wimbledon_090625_LV' },
      { id: '4195550474007198', name: 'ENG vsIND_090625_LV' },
      { id: '1006049624527097', name: 'Wimbledon_090625_LV_copy' },
      { id: '1048078150633985', name: 'ENG vs NED_080625_LV' },
      { id: '1561492171449067', name: 'ENG vs NED_080625_LV_copy' },
      { id: '831648302437896', name: 'Test 07 Jun 2025' },
      { id: '1175866460503088', name: 'Eid Mubarak ' },
      { id: '502977965627085', name: 'ICC WTC 2025_080625_SV' },
      { id: '1161951871883113', name: 'ENG vs IND_080625_SV' },
      { id: '932135978602077', name: 'ICC WTC 2025_080625_LV' },
      { id: '538099682154851', name: 'test 5 june' },
      { id: '442155992028644', name: 'Test 3 Jun' },
      { id: '485055524143946', name: 'test 31 may' },
      { id: '3789895631233863', name: 'pakistan zindabad Lead Campaign' },
      { id: '501588535822002', name: 'ENG vs IND_310525_LV' },
      { id: '514004984591628', name: 'IPL FINAL_250525_LV' },
      { id: '8102885213133831', name: 'ENG vs PAK_250525_SV' },
      { id: '1179468056506113', name: 'ENG vs PAK_250525_LV' },
      { id: '950644110409797', name: 'IPL FINAL_250525_SV' },
      { id: '8096641830399488', name: 'Test 24 May' },
      { id: '471847355668094', name: 'Test Lead Campaign' },
      { id: '1045859040543845', name: 'Test Lead Campaign' },
      { id: '546494481313468', name: 'Test Lead Campaign' },
      { id: '540052832288071', name: 'Test Lead Campaign' },
      { id: '426756600460316', name: 'Test Lead Campaign' },
      { id: '402816786229845', name: 'Test Lead Campaign' }
    ];
    
    console.log('🔵 Facebook Forms Service initialized');
    console.log('🔑 Access token present:', !!this.accessToken);
    console.log('📱 App ID:', this.appId);
  }

  // Get cache key for forms
  getCacheKey() {
    return 'facebook_forms_list';
  }

  // Check if cache is valid (15 minutes)
  isCacheValid(cacheEntry) {
    if (!cacheEntry) return false;
    return Date.now() - cacheEntry.timestamp < this.cacheExpiry;
  }

  // Get ad account ID
  async getAdAccountId() {
    try {
      // Use the same ad account as the insights service
      const AD_ACCOUNT_WITH_CAMPAIGNS = 'act_8731185783571850';
      console.log(`✅ Using ad account: ${AD_ACCOUNT_WITH_CAMPAIGNS}`);
      return AD_ACCOUNT_WITH_CAMPAIGNS;
    } catch (error) {
      console.error('❌ Error getting ad account:', error);
      throw error;
    }
  }

  // Test Facebook API connection
  async testConnection() {
    try {
      console.log('🧪 Testing Facebook API connection for forms...');
      
      const response = await fetch(
        `${this.baseUrl}/me?fields=id,name&access_token=${this.accessToken}`
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Facebook API test failed:', data);
        return { success: false, error: data.error };
      }
      
      console.log('✅ Facebook API connection successful for forms');
      return { success: true, data };
      
    } catch (error) {
      console.error('❌ Facebook API connection error:', error);
      return { success: false, error: error.message };
    }
  }

  // Fetch lead forms from Facebook Ads Manager
  async fetchFormsFromAPI() {
    try {
      console.log('🚀 Fetching lead forms from Facebook Ads Manager...');
      
      // Validate prerequisites
      if (!this.accessToken) {
        throw new Error('Facebook access token not configured');
      }
      
      const adAccountId = await this.getAdAccountId();
      
      // Get all lead forms from the ad account
      // Try the correct endpoint for lead forms
      const url = `${this.baseUrl}/${adAccountId}/lead_gen_forms?fields=id,name,status,created_time,updated_time,locale&access_token=${this.accessToken}`;
      
      console.log(`🔗 Making request to: ${url.replace(this.accessToken, '[REDACTED]')}`);
      
      const response = await fetch(url, {
        timeout: 25000, // 25 second timeout
        headers: {
          'User-Agent': 'FanToPark-CRM/1.0'
        }
      });
      
      console.log(`📡 Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        let errorDetails = `HTTP ${response.status}`;
        
        try {
          const errorData = await response.json();
          console.error('❌ Lead forms API error response:', errorData);
          
          if (errorData.error) {
            const fbError = errorData.error;
            errorDetails = `${fbError.message || fbError.type || 'Unknown Facebook error'} (Code: ${fbError.code || response.status})`;
            
            // Handle specific Facebook error codes
            if (fbError.code === 190) {
              errorDetails = 'Facebook access token expired or invalid';
            } else if (fbError.code === 100) {
              errorDetails = 'Invalid Facebook API parameters or permissions';
            } else if (fbError.code === 200) {
              errorDetails = 'Insufficient Facebook API permissions for lead forms';
            }
          }
        } catch (parseError) {
          console.warn('⚠️ Could not parse error response:', parseError);
          errorDetails = `HTTP ${response.status} - ${response.statusText}`;
        }
        
        throw new Error(`Facebook API Error: ${errorDetails}`);
      }
      
      const data = await response.json();
      console.log(`📋 Raw API response: Found ${data.data?.length || 0} total lead forms`);
      
      // Handle pagination if needed
      let allForms = data.data || [];
      if (data.paging && data.paging.next) {
        console.log('📄 Forms are paginated, fetching additional pages...');
        // Note: For now, we'll just use the first page
        // In production, you might want to fetch all pages
      }
      
      // Process and format the forms
      const forms = [];
      if (allForms.length > 0) {
        allForms.forEach(form => {
          try {
            // Include all forms, not just active ones (user might want to see inactive forms too)
            const processedForm = {
              id: form.id,
              name: form.name || `Form ${form.id}`,
              status: form.status || 'UNKNOWN',
              created_time: form.created_time,
              updated_time: form.updated_time,
              locale: form.locale,
              source: 'api' // Mark as API-fetched
            };
            
            forms.push(processedForm);
            console.log(`✅ Form: ${processedForm.name} (${processedForm.id}) - Status: ${processedForm.status}`);
            
          } catch (formError) {
            console.warn(`⚠️ Error processing form ${form.id}:`, formError);
            // Continue with other forms
          }
        });
      }
      
      console.log(`✅ Successfully processed ${forms.length} lead forms from Facebook API`);
      
      if (forms.length === 0) {
        console.warn('⚠️ No lead forms found in Facebook ad account');
      }
      
      return forms;
      
    } catch (error) {
      console.error('❌ Error fetching forms from Facebook API:', error);
      
      // Enhance error message for common issues
      let enhancedError = error.message;
      
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        enhancedError = 'Network connection failed - unable to reach Facebook API';
      } else if (error.code === 'ETIMEDOUT') {
        enhancedError = 'Facebook API request timed out';
      } else if (error.message.includes('fetch is not defined')) {
        enhancedError = 'Node.js fetch not available - please update Node.js version';
      }
      
      throw new Error(enhancedError);
    }
  }

  // Get all available lead forms (with cache)
  async getForms() {
    const cacheKey = this.getCacheKey();
    const cachedData = this.cache.get(cacheKey);
    
    // Return cached data if valid
    if (this.isCacheValid(cachedData)) {
      console.log('📋 Returning cached lead forms');
      return {
        success: true,
        data: cachedData.data,
        cached: true,
        cacheAge: Math.round((Date.now() - cachedData.timestamp) / 1000 / 60), // age in minutes
        apiError: cachedData.apiError || null
      };
    }

    try {
      console.log('🔄 Cache expired or empty, fetching fresh lead forms...');
      
      // Try to fetch from API first with timeout
      let forms = [];
      let apiError = null;
      
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('API request timeout (30s)')), 30000);
        });
        
        forms = await Promise.race([
          this.fetchFormsFromAPI(),
          timeoutPromise
        ]);
        
      } catch (error) {
        console.warn('⚠️ API fetch failed, checking fallback options:', error.message);
        apiError = error.message;
        
        // Try to use stale cache if available
        if (cachedData && cachedData.data && cachedData.data.length > 0) {
          console.log('📋 Using stale cached data due to API failure');
          
          // Extend cache timestamp to avoid repeated failures
          this.cache.set(cacheKey, {
            ...cachedData,
            timestamp: Date.now() - (10 * 60 * 1000), // Mark as 10 minutes old
            apiError: error.message,
            staleData: true
          });
          
          return {
            success: true,
            data: cachedData.data,
            cached: true,
            stale: true,
            cacheAge: Math.round((Date.now() - cachedData.timestamp) / 1000 / 60),
            apiError: error.message,
            fallbackUsed: false
          };
        }
      }
      
      // If API failed or returned no forms, use fallback
      if (forms.length === 0) {
        console.log('📋 Using fallback forms list');
        forms = this.fallbackForms.map(form => ({
          ...form,
          source: 'fallback',
          status: 'UNKNOWN'
        }));
      }
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: forms,
        timestamp: Date.now(),
        apiError: apiError,
        source: forms.length > 0 ? forms[0].source : 'unknown'
      });
      
      console.log(`✅ Cached ${forms.length} lead forms for 15 minutes`);
      
      return {
        success: true,
        data: forms,
        cached: false,
        apiError: apiError,
        fallbackUsed: forms.length > 0 && forms[0].source === 'fallback'
      };
      
    } catch (error) {
      console.error('❌ Critical error getting lead forms:', error);
      
      // Last resort: check if we have any cached data at all
      if (cachedData && cachedData.data) {
        console.log('🚨 Using expired cache as emergency fallback');
        return {
          success: true,
          data: cachedData.data,
          cached: true,
          expired: true,
          cacheAge: Math.round((Date.now() - cachedData.timestamp) / 1000 / 60),
          error: error.message,
          emergencyFallback: true
        };
      }
      
      // Final fallback: return hardcoded forms
      return {
        success: false,
        data: this.fallbackForms.map(form => ({
          ...form,
          source: 'emergency_fallback',
          status: 'UNKNOWN'
        })),
        error: error.message,
        fallbackUsed: true,
        emergencyFallback: true
      };
    }
  }

  // Search for specific form by ID or name
  async searchForm(query) {
    try {
      const formsResult = await this.getForms();
      const forms = formsResult.data || [];
      
      const results = forms.filter(form => 
        form.id.includes(query) || 
        form.name.toLowerCase().includes(query.toLowerCase())
      );
      
      return {
        success: true,
        data: results,
        total: results.length
      };
      
    } catch (error) {
      console.error('❌ Error searching forms:', error);
      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  }

  // Add a custom form manually (for forms not found in API)
  async addCustomForm(formId, formName) {
    try {
      console.log(`📝 Adding custom form: ${formName} (${formId})`);
      
      // Get current forms
      const formsResult = await this.getForms();
      const currentForms = formsResult.data || [];
      
      // Check if form already exists
      const existingForm = currentForms.find(form => form.id === formId);
      if (existingForm) {
        return {
          success: false,
          error: 'Form with this ID already exists',
          existing: existingForm
        };
      }
      
      // Create new form entry
      const newForm = {
        id: formId,
        name: formName,
        source: 'manual',
        status: 'UNKNOWN',
        created_time: new Date().toISOString(),
        updated_time: new Date().toISOString()
      };
      
      // Add to current list and update cache
      const updatedForms = [...currentForms, newForm];
      
      const cacheKey = this.getCacheKey();
      this.cache.set(cacheKey, {
        data: updatedForms,
        timestamp: Date.now(),
        manuallyUpdated: true
      });
      
      console.log(`✅ Added custom form: ${formName}`);
      
      return {
        success: true,
        data: newForm,
        total: updatedForms.length
      };
      
    } catch (error) {
      console.error('❌ Error adding custom form:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Clear cache manually
  clearCache() {
    this.cache.clear();
    console.log('🧹 Facebook forms cache cleared');
    return { success: true, message: 'Cache cleared' };
  }

  // Get cache status
  getCacheStatus() {
    const cacheKey = this.getCacheKey();
    const cachedData = this.cache.get(cacheKey);
    
    if (!cachedData) {
      return {
        cached: false,
        empty: true
      };
    }
    
    const ageMs = Date.now() - cachedData.timestamp;
    const ageMinutes = Math.round(ageMs / 1000 / 60);
    
    return {
      cached: true,
      valid: this.isCacheValid(cachedData),
      ageMinutes: ageMinutes,
      formsCount: cachedData.data?.length || 0,
      expiresInMinutes: Math.max(0, 15 - ageMinutes)
    };
  }
}

// Export singleton instance
module.exports = new FacebookFormsService();