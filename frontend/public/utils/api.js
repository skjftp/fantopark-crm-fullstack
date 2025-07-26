/**
 * FanToPark CRM - API Utilities
 * Centralized API communication functions
 */

// Token expiry check helper
window.isTokenExpired = function() {
  const token = localStorage.getItem('crm_auth_token');
  if (!token) return true;
  
  try {
    // Decode JWT token (simple base64 decode, not verification)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    
    // Check if token expires in next 5 minutes
    return currentTime >= (expiryTime - 5 * 60 * 1000);
  } catch (error) {
    console.error('Error checking token expiry:', error);
    return true;
  }
};

// Handle authentication errors
window.handleAuthError = function(status) {
  if (status === 401 || status === 403) {
    // Clear auth data
    localStorage.removeItem('crm_auth_token');
    localStorage.removeItem('crm_user');
    
    // Show user-friendly message
    const message = status === 403 
      ? 'Your session has expired. Please log in again to continue.'
      : 'Authentication required. Please log in.';
    
    // Store current location for redirect after login
    localStorage.setItem('redirect_after_login', window.location.hash || '/');
    
    // Show alert
    alert(message);
    
    // Instead of redirecting, update app state to show login form
    if (window.setIsLoggedIn) {
      window.setIsLoggedIn(false);
    }
    if (window.setUser) {
      window.setUser(null);
    }
    if (window.renderApp) {
      window.renderApp();
    }
    
    return true;
  }
  return false;
};

// Main API helper function - Single source of truth
window.apiCall = async function(endpoint, options = {}) {
  // Check token expiry before making request
  if (window.isTokenExpired()) {
    window.handleAuthError(403);
    throw new Error('Token expired');
  }
  
  // Automatically stringify body if it's an object
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    options.body = JSON.stringify(options.body);
  }
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(localStorage.getItem('crm_auth_token') ? { 
        'Authorization': `Bearer ${localStorage.getItem('crm_auth_token')}` 
      } : {}),
      ...options.headers
    }
  };

  try {
    window.log.time(`API: ${endpoint}`);
    const response = await fetch(`${window.API_CONFIG.API_URL}${endpoint}`, config);
    
    // Handle auth errors
    if (window.handleAuthError(response.status)) {
      throw new Error(`Authentication error: ${response.status}`);
    }
    
    if (!response.ok) {
      // Try to get error message from response body
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // If response body is not JSON, use default error message
      }
      
      console.error(`API Error ${response.status} for ${endpoint}:`, errorMessage);
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    window.log.timeEnd(`API: ${endpoint}`);
    return data;
    
  } catch (error) {
    window.log.error('API call failed:', { endpoint, error: error.message });
    throw error;
  }
};

// File upload to Google Cloud Storage
window.uploadFileToGCS = async function(file, documentType = 'general') {
  window.log.debug('Uploading file:', file.name, 'type:', documentType);
  
  // Check token expiry before upload
  if (window.isTokenExpired()) {
    window.handleAuthError(403);
    throw new Error('Token expired');
  }
  
  // Implementation remains the same but with better logging
  if (documentType === 'quote') {
    const formData = new FormData();
    formData.append('quote_pdf', file);
    formData.append('notes', window.quoteUploadData?.notes || '');
    
    const response = await fetch(`${window.API_CONFIG.API_URL}/leads/${window.currentLead.id}/quote/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('crm_auth_token')}`
      },
      body: formData
    });
    
    // Handle auth errors
    if (window.handleAuthError(response.status)) {
      throw new Error(`Authentication error: ${response.status}`);
    }
    
    return response.json();
  }
  
  // General file upload logic here...
};

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { apiCall: window.apiCall, uploadFileToGCS: window.uploadFileToGCS };
}

// Get remaining session time
window.getSessionTimeRemaining = function() {
  const token = localStorage.getItem('crm_auth_token');
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000;
    const currentTime = Date.now();
    const remainingMs = expiryTime - currentTime;
    
    if (remainingMs <= 0) return null;
    
    const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { days, hours, minutes, totalMinutes: Math.floor(remainingMs / (1000 * 60)) };
  } catch (error) {
    console.error('Error calculating session time:', error);
    return null;
  }
};

// Session warning system
window.initSessionWarning = function() {
  // Check every minute
  setInterval(() => {
    const timeRemaining = window.getSessionTimeRemaining();
    
    if (!timeRemaining) return;
    
    // Warn when 30 minutes left
    if (timeRemaining.totalMinutes === 30) {
      alert('Your session will expire in 30 minutes. Please save your work.');
    }
    
    // Warn when 5 minutes left
    if (timeRemaining.totalMinutes === 5) {
      if (confirm('Your session will expire in 5 minutes. Would you like to stay logged in?')) {
        // User can refresh the page to get a new token by re-authenticating
        window.location.reload();
      }
    }
  }, 60000); // Check every minute
};

// Initialize session warning on load
if (localStorage.getItem('crm_auth_token')) {
  window.initSessionWarning();
}

console.log('✅ API utilities loaded with enhanced auth handling');
