/**
 * FanToPark CRM - API Utilities
 * Phase 2: Utility Functions Extraction
 * 
 * API calling functions, file upload utilities, and communication helpers
 */

// ===== API COMMUNICATION UTILITIES =====

// Main API helper function
window.apiCall = async function(endpoint, options = {}) {
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(localStorage.getItem('crm_auth_token') ? { 'Authorization': `Bearer ${localStorage.getItem('crm_auth_token')}` } : {}),
      ...options.headers
    }
  };

  try {
    const response = await fetch(`${window.API_CONFIG.API_URL}${endpoint}`, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Debug logging function
window.debugLog = function(event, data) {
  try {
    let logs = JSON.parse(sessionStorage.getItem('debugLogs') || '[]');
    logs.push({ time: new Date().toISOString(), key: event, data });
    sessionStorage.setItem('debugLogs', JSON.stringify(logs));
    console.log('[' + event + ']', data);
  } catch (error) {
    console.error('Debug logging failed:', error);
  }
};

// ===== FILE UPLOAD UTILITIES =====

// Google Cloud Storage upload function
window.uploadFileToGCS = async function(file, documentType = 'general') {
  const UPLOAD_URL_FUNCTION = 'https://us-central1-enduring-wharf-464005-h7.cloudfunctions.net/generateUploadUrl';

  try {
    // Step 1: Get signed upload URL
    const { uploadUrl, filePath, publicUrl } = await window.getUploadUrl(
      file.name,
      file.type,
      documentType
    );

    // Step 2: Upload file directly to GCS
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type
      },
      body: file
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file to storage');
    }

    // Return file information
    return {
      filePath,
      publicUrl,
      originalName: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

// Get upload URL for GCS
window.getUploadUrl = async function(fileName, fileType, documentType) {
  const UPLOAD_URL_FUNCTION = 'https://us-central1-enduring-wharf-464005-h7.cloudfunctions.net/generateUploadUrl';
  
  try {
    const response = await fetch(UPLOAD_URL_FUNCTION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName,
        fileType,
        documentType
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get upload URL');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting upload URL:', error);
    throw error;
  }
};

// Get signed URL for reading/viewing files
window.getFileViewUrl = async function(filePath) {
  const READ_URL_FUNCTION = 'https://us-central1-enduring-wharf-464005-h7.cloudfunctions.net/generateReadUrl';
  
  try {
    const response = await fetch(READ_URL_FUNCTION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ filePath })
    });

    if (!response.ok) {
      throw new Error('Failed to get file URL');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error getting file URL:', error);
    return null;
  }
};

// ===== DOWNLOAD UTILITIES =====

// Download sample CSV function
window.downloadSampleCSV = function(type) {
  let csvContent, filename;
  
  if (type === 'leads') {
    csvContent = `Company Name,Contact Person,Email,Phone,Address,City,State,Country,Event,Size of Group,Family Travel,Accommodation,Travel Assistance,Budget Category,Budget Amount,Status,Assigned To,Probability,Temperature,Notes
Acme Corp,John Doe,john@acme.com,+91-9876543210,123 Main St,Mumbai,Maharashtra,India,Cricket World Cup 2024,2,No,Required,Yes,₹1 Lakh - ₹5 Lakhs,500000,unassigned,,0,Hot,Looking for premium experience
Global Sports,Jane Smith,jane@globalsports.com,+91-8765432109,456 Oak Ave,Delhi,Delhi,India,Olympics 2024,8,Yes,Required,No,₹5 Lakhs - ₹10 Lakhs,750000,unassigned,,0,Warm,Corporate event planning
Adventure Tours,Mike Johnson,mike@adventure.com,+91-7654321098,789 Pine Rd,Bangalore,Karnataka,India,FIFA World Cup 2026,4,Not Sure,Required,Yes,₹50 Lakhs - ₹1 Crore,1000000,unassigned,,0,Family trip planned`;
    filename = 'sample_leads.csv';
  } else if (type === 'inventory') {
    csvContent = `Event Name,Event Date,Event Type,Sports,Venue,Day of Match,Category of Ticket,Price per Ticket,Number of Tickets,Total Value of Tickets,Currency,Base Amount INR,GST 18%,Selling Price per Ticket,Payment Due Date,Supplier Name,Ticket Source,Status,Allocated to Order,Notes
IPL 2025 Final,2025-05-28,cricket,Cricket,Wankhede Stadium,Not Applicable,VIP,15000,10,150000,INR,150000,27000,17700,2025-04-15,Ticket Master,Primary,available,,Premium seats
FIFA World Cup 2026,2026-06-15,football,Football,MetLife Stadium,Not Applicable,Premium,25000,20,500000,USD,2000000,360000,118000,2026-03-01,FIFA Official,Primary,available,,Group stage match`;
    filename = 'sample_inventory.csv';
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


// ===== DELETE UTILITY FUNCTIONS =====

// Delete Receivable Function
window.deleteReceivable = async function(receivableId, setLoading, setReceivables, fetchData) {
  if (!window.confirm('Are you sure you want to delete this receivable? This action cannot be undone.')) {
    return;
  }

  try {
    setLoading(true);

    const response = await window.apiCall(`/receivables/${receivableId}`, {
      method: 'DELETE'
    });

    // Update local state - remove the deleted receivable
    setReceivables(prev => prev.filter(r => r.id !== receivableId));

    // Update analytics by recalculating totals
    await fetchData(); // This will refresh all data including analytics

    alert('Receivable deleted successfully!');

  } catch (error) {
    console.error('Error deleting receivable:', error);
    alert('Failed to delete receivable: ' + error.message);
  } finally {
    setLoading(false);
  }
};

// Delete Payable Function  
window.deletePayable = async function(payableId, setLoading, setFinancialData, fetchData) {
  if (!window.confirm('Are you sure you want to delete this payable? This action cannot be undone.')) {
    return;
  }

  try {
    setLoading(true);

    const response = await window.apiCall(`/payables/${payableId}`, {
      method: 'DELETE'
    });

    // Update financialData state instead of separate payables state
    setFinancialData(prev => ({
      ...prev,
      payables: prev.payables ? prev.payables.filter(p => p.id !== payableId) : []
    }));

    // Update analytics by recalculating totals
    await fetchData(); // This will refresh all data including analytics

    alert('Payable deleted successfully!');

  } catch (error) {
    console.error('Error deleting payable:', error);
    alert('Failed to delete payable: ' + error.message);
  } finally {
    setLoading(false);
  }
};
