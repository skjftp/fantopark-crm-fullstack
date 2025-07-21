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
        `${this.baseUrl}/me?fields=id,name&access_token=${this.accessToken}`
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

  // Get ad account ID from user
  async getAdAccountId() {
    try {
      console.log('🔍 Fetching ad account ID...');
      
      const response = await fetch(
        `${this.baseUrl}/me/adaccounts?fields=id,name,account_status,currency,account_id&access_token=${this.accessToken}`
      );
      
      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Failed to get ad accounts:', error);
        throw new Error(`Failed to get ad accounts: ${JSON.stringify(error)}`);
      }
      
      const data = await response.json();
      console.log('📊 Ad accounts response:', data);
      
      if (data.data && data.data.length > 0) {
        // Use the first active ad account
        const activeAccount = data.data.find(acc => acc.account_status === 1) || data.data[0];
        console.log('✅ Using ad account:', activeAccount);
        return activeAccount.id;
      }
      
      throw new Error('No ad accounts found');
    } catch (error) {
      console.error('❌ Error getting ad account:', error);
      throw error;
    }
  }

  // Get insights for all campaigns
  async getCampaignInsights(dateFrom, dateTo) {
    const cacheKey = this.getCacheKey({ type: 'campaigns', dateFrom, dateTo });
    const cachedData = this.cache.get(cacheKey);
    
    if (this.isCacheValid(cachedData)) {
      console.log('📊 Returning cached campaign insights');
      return cachedData.data;
    }

    try {
      console.log('🚀 Fetching campaign insights...', { dateFrom, dateTo });
      
      const adAccountId = await this.getAdAccountId();
      
      let url = `${this.baseUrl}/${adAccountId}/insights?fields=campaign_name,campaign_id,impressions,reach,clicks,spend,ctr&level=campaign`;
      
      if (dateFrom && dateTo) {
        url += `&time_range={'since':'${dateFrom}','until':'${dateTo}'}`;
      }
      
      const response = await fetch(`${url}&access_token=${this.accessToken}`);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Campaign insights error:', error);
        throw new Error(`Facebook API Error: ${JSON.stringify(error)}`);
      }
      
      const data = await response.json();
      console.log(`📊 Found ${data.data?.length || 0} campaigns with insights`);
      
      // Process the data
      const campaigns = {};
      if (data.data) {
        data.data.forEach(insight => {
          campaigns[insight.campaign_name] = {
            id: insight.campaign_id,
            name: insight.campaign_name,
            impressions: parseInt(insight.impressions || 0),
            reach: parseInt(insight.reach || 0),
            clicks: parseInt(insight.clicks || 0),
            spend: parseFloat(insight.spend || 0),
            ctr: parseFloat(insight.ctr || 0)
          };
          console.log(`✅ Campaign: ${insight.campaign_name} - ${insight.impressions} impressions`);
        });
      }
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: campaigns,
        timestamp: Date.now()
      });
      
      console.log(`✅ Fetched insights for ${Object.keys(campaigns).length} campaigns`);
      return campaigns;
      
    } catch (error) {
      console.error('❌ Error fetching campaign insights:', error);
      throw error;
    }
  }

  // Get insights for all ad sets
  async getAdSetInsights(dateFrom, dateTo, campaignId = null) {
    const cacheKey = this.getCacheKey({ type: 'adsets', dateFrom, dateTo, campaignId });
    const cachedData = this.cache.get(cacheKey);
    
    if (this.isCacheValid(cachedData)) {
      console.log('📊 Returning cached ad set insights');
      return cachedData.data;
    }

    try {
      console.log('🚀 Fetching ad set insights...', { dateFrom, dateTo, campaignId });
      
      const adAccountId = await this.getAdAccountId();
      
      let url = `${this.baseUrl}/${adAccountId}/insights?fields=adset_name,adset_id,campaign_name,campaign_id,impressions,reach,clicks,spend,ctr&level=adset`;
      
      if (dateFrom && dateTo) {
        url += `&time_range={'since':'${dateFrom}','until':'${dateTo}'}`;
      }
      
      if (campaignId) {
        url += `&filtering=[{'field':'campaign_id','operator':'IN','value':['${campaignId}']}]`;
      }
      
      const response = await fetch(`${url}&access_token=${this.accessToken}`);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Ad set insights error:', error);
        throw new Error(`Facebook API Error: ${JSON.stringify(error)}`);
      }
      
      const data = await response.json();
      console.log(`📊 Found ${data.data?.length || 0} ad sets with insights`);
      
      // Process the data
      const adSets = {};
      if (data.data) {
        data.data.forEach(insight => {
          adSets[insight.adset_name] = {
            id: insight.adset_id,
            name: insight.adset_name,
            campaign_id: insight.campaign_id,
            campaign_name: insight.campaign_name,
            impressions: parseInt(insight.impressions || 0),
            reach: parseInt(insight.reach || 0),
            clicks: parseInt(insight.clicks || 0),
            spend: parseFloat(insight.spend || 0),
            ctr: parseFloat(insight.ctr || 0)
          };
          console.log(`✅ Ad Set: ${insight.adset_name} - ${insight.impressions} impressions`);
        });
      }
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: adSets,
        timestamp: Date.now()
      });
      
      console.log(`✅ Fetched insights for ${Object.keys(adSets).length} ad sets`);
      return adSets;
      
    } catch (error) {
      console.error('❌ Error fetching ad set insights:', error);
      throw error;
    }
  }

  // Get aggregated insights by source (Facebook vs Instagram)
  async getInsightsBySource(dateFrom, dateTo) {
    const cacheKey = this.getCacheKey({ type: 'source', dateFrom, dateTo });
    const cachedData = this.cache.get(cacheKey);
    
    if (this.isCacheValid(cachedData)) {
      console.log('📊 Returning cached source insights');
      return cachedData.data;
    }

    try {
      console.log('🚀 Fetching insights by source...', { dateFrom, dateTo });
      
      const adAccountId = await this.getAdAccountId();
      
      let url = `${this.baseUrl}/${adAccountId}/insights?fields=impressions&breakdowns=publisher_platform`;
      
      if (dateFrom && dateTo) {
        url += `&time_range={'since':'${dateFrom}','until':'${dateTo}'}`;
      }
      
      const response = await fetch(`${url}&access_token=${this.accessToken}`);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Source insights error:', error);
        throw new Error(`Facebook API Error: ${JSON.stringify(error)}`);
      }
      
      const data = await response.json();
      console.log('📊 Source insights raw data:', data);
      
      // Process the data
      const sourceInsights = {
        'Facebook': 0,
        'Instagram': 0
      };
      
      if (data.data) {
        data.data.forEach(insight => {
          const platform = insight.publisher_platform;
          if (platform === 'facebook') {
            sourceInsights['Facebook'] += parseInt(insight.impressions || 0);
          } else if (platform === 'instagram') {
            sourceInsights['Instagram'] += parseInt(insight.impressions || 0);
          }
        });
      }
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: sourceInsights,
        timestamp: Date.now()
      });
      
      console.log('✅ Fetched insights by source:', sourceInsights);
      return sourceInsights;
      
    } catch (error) {
      console.error('❌ Error fetching source insights:', error);
      // Return zeros instead of throwing
      return { 'Facebook': 0, 'Instagram': 0 };
    }
  }

  // Get insights for specific ad sets by their IDs
  async getSpecificAdSetInsights(adSetNames, dateFrom, dateTo) {
    try {
      console.log('🔍 Getting insights for specific ad sets:', adSetNames);
      
      // First, get all ad sets to find matching IDs
      const allAdSets = await this.getAdSetInsights(dateFrom, dateTo);
      
      const matchingInsights = {};
      adSetNames.forEach(name => {
        // Try exact match first
        if (allAdSets[name]) {
          matchingInsights[name] = allAdSets[name].impressions;
          console.log(`✅ Found exact match for ${name}: ${allAdSets[name].impressions} impressions`);
        } else {
          // Try partial match
          let found = false;
          Object.keys(allAdSets).forEach(adSetName => {
            if (!found && (
              adSetName.toLowerCase().includes(name.toLowerCase()) || 
              name.toLowerCase().includes(adSetName.toLowerCase())
            )) {
              matchingInsights[name] = allAdSets[adSetName].impressions;
              console.log(`✅ Found partial match for ${name} -> ${adSetName}: ${allAdSets[adSetName].impressions} impressions`);
              found = true;
            }
          });
          
          if (!found) {
            console.log(`⚠️ No match found for ad set: ${name}`);
            matchingInsights[name] = 0;
          }
        }
      });
      
      return matchingInsights;
      
    } catch (error) {
      console.error('❌ Error fetching specific ad set insights:', error);
      // Return zeros for all requested ad sets
      const zeros = {};
      adSetNames.forEach(name => { zeros[name] = 0; });
      return zeros;
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    console.log('🧹 Facebook insights cache cleared');
  }
}

// Export singleton instance
module.exports = new FacebookInsightsService();
