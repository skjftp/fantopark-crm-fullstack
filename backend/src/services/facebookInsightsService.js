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

  // Get ad account ID from page
  async getAdAccountId() {
    try {
      const response = await fetch(
        `${this.baseUrl}/me/adaccounts?fields=id,name&access_token=${this.accessToken}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to get ad accounts: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        return data.data[0].id; // Return first ad account
      }
      
      throw new Error('No ad accounts found');
    } catch (error) {
      console.error('Error getting ad account:', error);
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
      const adAccountId = await this.getAdAccountId();
      
      const timeRange = dateFrom && dateTo ? 
        `&time_range={'since':'${dateFrom}','until':'${dateTo}'}` : '';
      
      const response = await fetch(
        `${this.baseUrl}/${adAccountId}/campaigns?` +
        `fields=id,name,status,insights{impressions,reach,clicks,spend,ctr,conversions,cost_per_conversion}` +
        `${timeRange}&access_token=${this.accessToken}`
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Facebook API Error: ${JSON.stringify(error)}`);
      }
      
      const data = await response.json();
      
      // Process the data
      const campaigns = {};
      if (data.data) {
        data.data.forEach(campaign => {
          if (campaign.insights && campaign.insights.data && campaign.insights.data[0]) {
            const insights = campaign.insights.data[0];
            campaigns[campaign.name] = {
              id: campaign.id,
              name: campaign.name,
              status: campaign.status,
              impressions: parseInt(insights.impressions || 0),
              reach: parseInt(insights.reach || 0),
              clicks: parseInt(insights.clicks || 0),
              spend: parseFloat(insights.spend || 0),
              ctr: parseFloat(insights.ctr || 0),
              conversions: parseInt(insights.conversions || 0),
              cost_per_conversion: parseFloat(insights.cost_per_conversion || 0)
            };
          }
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
      const adAccountId = await this.getAdAccountId();
      
      const timeRange = dateFrom && dateTo ? 
        `&time_range={'since':'${dateFrom}','until':'${dateTo}'}` : '';
      
      const campaignFilter = campaignId ? 
        `&filtering=[{'field':'campaign_id','operator':'IN','value':['${campaignId}']}]` : '';
      
      const response = await fetch(
        `${this.baseUrl}/${adAccountId}/adsets?` +
        `fields=id,name,status,campaign_id,campaign{name},insights{impressions,reach,clicks,spend,ctr,conversions,cost_per_conversion}` +
        `${timeRange}${campaignFilter}&access_token=${this.accessToken}`
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Facebook API Error: ${JSON.stringify(error)}`);
      }
      
      const data = await response.json();
      
      // Process the data
      const adSets = {};
      if (data.data) {
        data.data.forEach(adSet => {
          if (adSet.insights && adSet.insights.data && adSet.insights.data[0]) {
            const insights = adSet.insights.data[0];
            adSets[adSet.name] = {
              id: adSet.id,
              name: adSet.name,
              status: adSet.status,
              campaign_id: adSet.campaign_id,
              campaign_name: adSet.campaign?.name,
              impressions: parseInt(insights.impressions || 0),
              reach: parseInt(insights.reach || 0),
              clicks: parseInt(insights.clicks || 0),
              spend: parseFloat(insights.spend || 0),
              ctr: parseFloat(insights.ctr || 0),
              conversions: parseInt(insights.conversions || 0),
              cost_per_conversion: parseFloat(insights.cost_per_conversion || 0)
            };
          }
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
      const adAccountId = await this.getAdAccountId();
      
      const timeRange = dateFrom && dateTo ? 
        `&time_range={'since':'${dateFrom}','until':'${dateTo}'}` : '';
      
      // Get insights broken down by publisher platform
      const response = await fetch(
        `${this.baseUrl}/${adAccountId}/insights?` +
        `fields=impressions,reach,clicks,spend,ctr,conversions,cost_per_conversion` +
        `&breakdowns=publisher_platform` +
        `${timeRange}&access_token=${this.accessToken}`
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Facebook API Error: ${JSON.stringify(error)}`);
      }
      
      const data = await response.json();
      
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
      throw error;
    }
  }

  // Get insights for specific ad sets by their IDs
  async getSpecificAdSetInsights(adSetNames, dateFrom, dateTo) {
    try {
      // First, get all ad sets to find matching IDs
      const allAdSets = await this.getAdSetInsights(dateFrom, dateTo);
      
      const matchingInsights = {};
      adSetNames.forEach(name => {
        if (allAdSets[name]) {
          matchingInsights[name] = allAdSets[name].impressions;
        } else {
          // If exact match not found, try partial match
          Object.keys(allAdSets).forEach(adSetName => {
            if (adSetName.toLowerCase().includes(name.toLowerCase()) || 
                name.toLowerCase().includes(adSetName.toLowerCase())) {
              matchingInsights[name] = allAdSets[adSetName].impressions;
            }
          });
        }
      });
      
      return matchingInsights;
      
    } catch (error) {
      console.error('❌ Error fetching specific ad set insights:', error);
      throw error;
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
