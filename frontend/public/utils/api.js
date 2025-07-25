/**
 * FanToPark CRM - API Utilities
 * Centralized API communication functions
 */

// Main API helper function - Single source of truth
window.apiCall = async function(endpoint, options = {}) {
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
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
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
  
  // Implementation remains the same but with better logging
  if (documentType === 'quote') {
    const formData = new FormData();
    formData.append('quote_pdf', file);
    formData.append('notes', window.quoteUploadData?.notes || '');
    
    const response = await fetch(`${window.API_CONFIG.API_URL}/leads/${window.currentLead.id}/quote/upload`, {
      method: 'POST',
      headers: {
        'Authorization': window.authToken ? `Bearer ${window.authToken}` : ''
      },
      body: formData
    });
    
    return response.json();
  }
  
  // General file upload logic here...
};

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { apiCall: window.apiCall, uploadFileToGCS: window.uploadFileToGCS };
}

console.log('✅ API utilities loaded');
