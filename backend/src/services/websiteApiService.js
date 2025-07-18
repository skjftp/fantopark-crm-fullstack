// backend/src/services/websiteApiService.js

const fetch = require('node-fetch');
const { websiteApiConfig, isTokenValid, setToken, getToken } = require('../config/websiteApi');

class WebsiteApiService {
  constructor() {
    this.baseURL = websiteApiConfig.baseUrl;
    this.defaultHeaders = {
      'accept': 'application/json, text/plain, */*',
      'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
      'access-control-allow-origin': '*',
      'origin': 'https://admin.fantopark.com',
      'referer': 'https://admin.fantopark.com/',
      'user-agent': 'FanToPark CRM Integration'
    };
  }

  // Authenticate and get token
  async authenticate() {
    try {
      console.log('🔐 Authenticating with website API...');
      
      const response = await fetch(this.baseURL + websiteApiConfig.endpoints.login, {
        method: 'POST',
        headers: {
          ...this.defaultHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: websiteApiConfig.credentials.username,
          password: websiteApiConfig.credentials.password
        })
      });

      const data = await response.json();

      if (response.ok && data.token) {
        setToken(data.token);
        console.log('✅ Authentication successful');
        return data.token;
      } else {
        throw new Error(data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('❌ Website API authentication failed:', error.message);
      throw error;
    }
  }

  // Ensure valid token before making requests
  async ensureAuthenticated() {
    if (!isTokenValid()) {
      console.log('🔄 Token expired or missing, re-authenticating...');
      await this.authenticate();
    }
    return getToken();
  }

  // Fetch leads from website
  async fetchLeads(page = 1, pageSize = 100, minLeadId = 794) {
    try {
      await this.ensureAuthenticated();
      
      console.log(`📥 Fetching leads from website (page: ${page}, size: ${pageSize})`);
      
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString()
      });

      const response = await fetch(
        `${this.baseURL}${websiteApiConfig.endpoints.leads}?${params}`, 
        {
          method: 'GET',
          headers: {
            ...this.defaultHeaders,
            'auth_token': getToken()
          }
        }
      );

      const data = await response.json();

      if (response.ok && data.status === 200) {
        // Filter leads to only include those with ID >= minLeadId
        const filteredLeads = (data.data.leadsList || []).filter(lead => 
          lead.id >= minLeadId
        );
        
        console.log(`✅ Fetched ${data.data.leadsList.length} leads, filtered to ${filteredLeads.length} (ID >= ${minLeadId})`);
        return filteredLeads;
      } else if (response.status === 401) {
        // Auth error, retry once
        console.log('🔄 Auth token expired, retrying...');
        await this.authenticate();
        return this.fetchLeads(page, pageSize, minLeadId);
      } else {
        throw new Error('Failed to fetch leads: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Failed to fetch website leads:', error.message);
      throw error;
    }
  }

  // Fetch all leads (with pagination)
  async fetchAllLeads(minLeadId = 794) {
    try {
      let allLeads = [];
      let page = 1;
      let hasMore = true;

      console.log(`📋 Fetching all leads with ID >= ${minLeadId}`);

      while (hasMore) {
        const leads = await this.fetchLeads(page, 100, minLeadId);
        
        if (leads && leads.length > 0) {
          allLeads = allLeads.concat(leads);
          page++;
          
          // If we got less than pageSize, we've reached the end
          if (leads.length < 100) {
            hasMore = false;
          }
          
          // Also stop if we've fetched a reasonable amount to prevent endless loops
          if (allLeads.length >= 1000) {
            console.log('⚠️ Reached 1000 leads limit, stopping pagination');
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      console.log(`✅ Fetched total ${allLeads.length} leads with ID >= ${minLeadId}`);
      return allLeads;
    } catch (error) {
      console.error('❌ Failed to fetch all website leads:', error);
      throw error;
    }
  }
}

module.exports = new WebsiteApiService();
