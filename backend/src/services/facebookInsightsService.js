// backend/src/services/facebookInsightsService.js
const fetch = require('node-fetch');

class FacebookInsightsService {
  constructor() {
    this.accessToken = process.env.META_PAGE_ACCESS_TOKEN;
    this.appId = process.env.FACEBOOK_APP_ID;
    this.baseUrl = 'https://graph.facebook.com/v18.0';
    
    // Cache for storing insights data
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
    
    console.log('🔵 Facebook Insights Service initialized');
    console.log('🔑 Access token present:', !!this.accessToken);
    console.log('📱 App ID:', this.appId);
  }

  // Get cache key
  getCacheKey(params) {
    return JSON.stringify(params);
  }

  // Check if cache is valid
  isCacheValid(cacheEntry) {
    if (!cacheEntry) return false;
    return Date.now() - cacheEntry.timestamp < this.cacheExpiry;
  }

  // Test Facebook API connection
  async testConnection() {
    try {
      console.log('🧪 Testing Facebook API connection...');
      
      const response = await fetch(
        `${this.baseUrl}/me?fields=id,name,fan_count&access_token=${this.accessToken}`
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Facebook API test failed:', data);
        return { success: false, error: data.error };
      }
      
      console.log('✅ Facebook API connection successful:', data);
      return { success: true, data };
      
    } catch (error) {
      console.error('❌ Facebook API connection error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get page insights (works with Page Access Token)
  async getPageInsights(dateFrom, dateTo) {
    try {
      console.log('🚀 Fetching page insights...');
      
      // For Page Access Tokens, we can get page-level insights
      let url = `${this.baseUrl}/me/insights?metric=page_impressions,page_impressions_by_story_type,page_impressions_by_city_unique`;
      
      if (dateFrom && dateTo) {
        url += `&since=${dateFrom}&until=${dateTo}`;
      }
      
      const response = await fetch(`${url}&access_token=${this.accessToken}`);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Page insights error:', error);
        return { 'Facebook': 0, 'Instagram': 0 };
      }
      
      const data = await response.json();
      let totalImpressions = 0;
      
      if (data.data && data.data[0] && data.data[0].values) {
        data.data[0].values.forEach(value => {
          totalImpressions += parseInt(value.value || 0);
        });
      }
      
      // For now, attribute all to Facebook (can be refined later)
      return { 'Facebook': totalImpressions, 'Instagram': 0 };
      
    } catch (error) {
      console.error('❌ Error getting page insights:', error);
      return { 'Facebook': 0, 'Instagram': 0 };
    }
  }

  // Get insights by source - simplified for Page tokens
  async getInsightsBySource(dateFrom, dateTo) {
    const cacheKey = this.getCacheKey({ type: 'source', dateFrom, dateTo });
    const cachedData = this.cache.get(cacheKey);
    
    if (this.isCacheValid(cachedData)) {
      console.log('📊 Returning cached source insights');
      return cachedData.data;
    }

    try {
      console.log('🚀 Fetching insights by source...');
      
      // Try to get Instagram insights if connected
      let facebookImpressions = 0;
      let instagramImpressions = 0;
      
      // Get Facebook page insights
      const pageInsights = await this.getPageInsights(dateFrom, dateTo);
      facebookImpressions = pageInsights.Facebook;
      
      // Try to get Instagram insights
      try {
        const igResponse = await fetch(
          `${this.baseUrl}/me?fields=instagram_business_account&access_token=${this.accessToken}`
        );
        
        if (igResponse.ok) {
          const igData = await igResponse.json();
          if (igData.instagram_business_account) {
            const igId = igData.instagram_business_account.id;
            
            // Get Instagram insights
            let igUrl = `${this.baseUrl}/${igId}/insights?metric=impressions,reach`;
            if (dateFrom && dateTo) {
              igUrl += `&period=day&since=${dateFrom}&until=${dateTo}`;
            }
            
            const igInsightsResponse = await fetch(`${igUrl}&access_token=${this.accessToken}`);
            if (igInsightsResponse.ok) {
              const igInsightsData = await igInsightsResponse.json();
              if (igInsightsData.data && igInsightsData.data[0]) {
                igInsightsData.data[0].values.forEach(value => {
                  instagramImpressions += parseInt(value.value || 0);
                });
              }
            }
          }
        }
      } catch (igError) {
        console.log('⚠️ Could not fetch Instagram insights:', igError.message);
      }
      
      const sourceInsights = {
        'Facebook': facebookImpressions,
        'Instagram': instagramImpressions
      };
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: sourceInsights,
        timestamp: Date.now()
      });
      
      console.log('✅ Fetched insights by source:', sourceInsights);
      return sourceInsights;
      
    } catch (error) {
      console.error('❌ Error fetching source insights:', error);
      return { 'Facebook': 0, 'Instagram': 0 };
    }
  }

  // Get campaign insights - returns empty for Page tokens
  async getCampaignInsights(dateFrom, dateTo) {
    console.log('⚠️ Campaign insights not available with Page Access Token');
    return {};
  }

  // Get ad set insights - returns empty for Page tokens
  async getAdSetInsights(dateFrom, dateTo) {
    console.log('⚠️ Ad set insights not available with Page Access Token');
    return {};
  }

  // Get specific ad set insights - returns zeros for Page tokens
  async getSpecificAdSetInsights(adSetNames, dateFrom, dateTo) {
    console.log('⚠️ Ad set insights not available with Page Access Token');
    const zeros = {};
    adSetNames.forEach(name => { zeros[name] = 0; });
    return zeros;
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    console.log('🧹 Facebook insights cache cleared');
  }
}

// Export singleton instance
module.exports = new FacebookInsightsService();
