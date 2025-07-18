// backend/src/config/websiteApi.js

const websiteApiConfig = {
  baseUrl: 'https://api.fantopark.club/ftp',
  endpoints: {
    login: '/admin/login',  // FIXED: Changed from /auth/login to /admin/login
    leads: '/admin/leads'
  },
  credentials: {
    // Store these in environment variables for security
    email: process.env.WEBSITE_API_USERNAME || '',  // Using email as the field name
    password: process.env.WEBSITE_API_PASSWORD || ''
  },
  // Lead filtering configuration
  leadFiltering: {
    // Minimum lead ID to fetch (to prevent importing old data)
    defaultMinLeadId: 794
  },
  // Token management
  tokenStore: {
    token: null,
    expiresAt: null
  }
};

// Helper function to check if token is valid
const isTokenValid = () => {
  if (!websiteApiConfig.tokenStore.token || !websiteApiConfig.tokenStore.expiresAt) {
    return false;
  }
  return new Date() < new Date(websiteApiConfig.tokenStore.expiresAt);
};

// Helper function to set token
const setToken = (token, expiresInMinutes = 60) => {
  websiteApiConfig.tokenStore.token = token;
  websiteApiConfig.tokenStore.expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  console.log('✅ Website API token set, expires at:', websiteApiConfig.tokenStore.expiresAt);
};

// Helper function to get token
const getToken = () => websiteApiConfig.tokenStore.token;

module.exports = {
  websiteApiConfig,
  isTokenValid,
  setToken,
  getToken
};
