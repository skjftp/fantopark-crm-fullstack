// backend/src/services/websiteApiService.js

const axios = require('axios');
const { websiteApiConfig, isTokenValid, setToken, getToken } = require('../config/websiteApi');

class WebsiteApiService {
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: websiteApiConfig.baseUrl,
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'access-control-allow-origin': '*',
        'origin': 'https://admin.fantopark.com',
        'referer': 'https://admin.fantopark.com/',
        'user-agent': 'FanToPark CRM Integration'
      }
    });
  }

  // Authenticate and get token
  async authenticate() {
    try {
      console.log('🔐 Authenticating with website API...');
      
      const response = await this.axiosInstance.post(websiteApiConfig.endpoints.login, {
        username: websiteApiConfig.credentials.username,
        password: websiteApiConfig.credentials.password
      });

      if (response.data && response.data.token) {
        setToken(response.data.token);
        console.log('✅ Authentication successful');
        return response.data.token;
      } else {
        throw new Error('No token received from authentication');
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
  async fetchLeads(page = 1, pageSize = 100, fromDate = null) {
    try {
      await this.ensureAuthenticated();
      
      console.log(`📥 Fetching leads from website (page: ${page}, size: ${pageSize})`);
      
      const params = {
        page,
        page_size: pageSize
      };

      // Add date filter if provided
      if (fromDate) {
        params.from_date = fromDate;
      }

      const response = await this.axiosInstance.get(websiteApiConfig.endpoints.leads, {
        params,
        headers: {
          'auth_token': getToken()
        }
      });

      if (response.data && response.data.status === 200) {
        console.log(`✅ Fetched ${response.data.data.leadsList.length} leads`);
        return response.data.data.leadsList;
      } else {
        throw new Error('Failed to fetch leads: ' + (response.data?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Failed to fetch website leads:', error.message);
      
      // If auth error, retry once
      if (error.response?.status === 401) {
        console.log('🔄 Auth token expired, retrying...');
        await this.authenticate();
        return this.fetchLeads(page, pageSize, fromDate);
      }
      
      throw error;
    }
  }

  // Fetch all leads (with pagination)
  async fetchAllLeads(fromDate = null) {
    try {
      let allLeads = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const leads = await this.fetchLeads(page, 100, fromDate);
        
        if (leads && leads.length > 0) {
          allLeads = allLeads.concat(leads);
          page++;
          
          // If we got less than pageSize, we've reached the end
          if (leads.length < 100) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      console.log(`✅ Fetched total ${allLeads.length} leads from website`);
      return allLeads;
    } catch (error) {
      console.error('❌ Failed to fetch all website leads:', error);
      throw error;
    }
  }
}

module.exports = new WebsiteApiService();
