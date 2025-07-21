/**
 * FanToPark CRM - Helper Utilities
 * Phase 2: Utility Functions Extraction
 * 
 * Date formatting, calculations, validation helpers, and general utilities
 */

// ===== DATE FORMATTING UTILITIES =====

// Format date for HTML input (YYYY-MM-DD)
window.formatDateForInput = function(dateValue) {
  if (!dateValue) return '';

  try {
    // Handle different date formats
    let date;

    // If it's already a Date object
    if (dateValue instanceof Date) {
      date = dateValue;
    }
    // If it's an ISO string (from CSV upload)
    else if (typeof dateValue === 'string' && dateValue.includes('T')) {
      date = new Date(dateValue);
    }
    // If it's a simple date string (YYYY-MM-DD)
    else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    }
    // If it's a Firestore timestamp object
    else if (typeof dateValue === 'object' && dateValue._seconds) {
      date = new Date(dateValue._seconds * 1000);
    }
    else {
      return '';
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }

    // Convert to YYYY-MM-DD format for HTML input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Date formatting error:', error);
    return '';
  }
};

// Format date for display (DD/MM/YYYY)
window.formatDateForDisplay = function(dateValue) {
  if (!dateValue) return 'Not Set';

  try {
    let date;

    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'string' && dateValue.includes('T')) {
      date = new Date(dateValue);
    } else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else if (typeof dateValue === 'object' && dateValue._seconds) {
      date = new Date(dateValue._seconds * 1000);
    } else {
      return 'Invalid Date';
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    // Convert to DD/MM/YYYY format
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Date display formatting error:', error);
    return 'Invalid Date';
  }
};

// Parse date from various formats to ISO string
window.parseDateToISO = function(dateValue) {
  if (!dateValue) return null;

  try {
    // Log input for debugging
    console.log('📅 Parsing date input:', typeof dateValue, dateValue);
    
    // Handle null, undefined, or empty string
    if (dateValue === null || dateValue === undefined || dateValue === '') {
      console.log('⚠️ Empty or null date value');
      return new Date().toISOString();
    }
    
    // If it's already a Date object
    if (dateValue instanceof Date) {
      console.log('✅ Date object detected');
      return dateValue.toISOString();
    }
    
    // If it's a Firestore timestamp object
    if (typeof dateValue === 'object' && dateValue._seconds) {
      console.log('✅ Firestore timestamp detected');
      return new Date(dateValue._seconds * 1000).toISOString();
    }
    
    // If it's a string, try various parsing methods
    if (typeof dateValue === 'string') {
      const trimmedValue = dateValue.trim();
      console.log('📝 String date detected, trimmed:', trimmedValue);
      
      // Try ISO format first
      if (trimmedValue.includes('T') || trimmedValue.includes('Z')) {
        console.log('✅ ISO format detected');
        const parsed = new Date(trimmedValue);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString();
        }
      }
      
      // Try YYYY-MM-DD format
      if (trimmedValue.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) {
        console.log('✅ YYYY-MM-DD format detected');
        const parsed = new Date(trimmedValue + 'T00:00:00.000Z');
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString();
        }
      }
      
      // Try DD/MM/YYYY format
      if (trimmedValue.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        console.log('✅ DD/MM/YYYY format detected');
        const [day, month, year] = trimmedValue.split('/');
        const parsed = new Date(year, month - 1, day);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString();
        }
      }
      
      // Try general Date parsing as fallback
      const parsed = new Date(trimmedValue);
      if (!isNaN(parsed.getTime())) {
        console.log('✅ Successfully parsed with Date constructor');
        return parsed.toISOString();
      }
      
      console.log('⚠️ String date parsing failed for:', trimmedValue, 'using current date');
    }
    
    // If it's a number (Excel serial date), convert it
    if (typeof dateValue === 'number' && dateValue > 0) {
      console.log('✅ Excel serial number detected:', dateValue);
      // Excel date serial number (days since 1900-01-01)
      const excelEpoch = new Date(1900, 0, 1);
      const msPerDay = 24 * 60 * 60 * 1000;
      const date = new Date(excelEpoch.getTime() + (dateValue - 2) * msPerDay);
      console.log('✅ Excel date converted to:', date.toISOString());
      return date.toISOString();
    }
    
    // Default to current date if parsing fails
    console.log('⚠️ All parsing methods failed, using current date');
    return new Date().toISOString();
  } catch (error) {
    console.error('Date parsing error:', error);
    return new Date().toISOString();
  }
};

// ===== CALCULATION UTILITIES =====

// Get base amount from order/invoice data
window.getBaseAmount = function(data) {
  if (data.type_of_sale === 'Service Fee') {
    return parseFloat(data.service_fee_amount) || 0;
  }
  return data.invoice_items?.reduce((sum, item) => 
    sum + ((item.quantity || 0) * (item.rate || 0)), 0
  ) || 0;
};

// Calculate GST amount
window.calculateGST = function(baseAmount, gstRate = 18) {
  return (baseAmount * gstRate) / 100;
};

// Calculate total amount with GST
window.calculateTotalWithGST = function(baseAmount, gstRate = 18) {
  const gstAmount = window.calculateGST(baseAmount, gstRate);
  return baseAmount + gstAmount;
};

// Format currency for display
window.formatCurrency = function(amount, currency = 'INR') {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  
  if (currency === 'INR') {
    return '₹' + Number(amount).toLocaleString('en-IN');
  }
  
  return Number(amount).toLocaleString('en-US', {
    style: 'currency',
    currency: currency
  });
};

// ===== VALIDATION UTILITIES =====

// Validate email format
window.validateEmail = function(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (Indian format)
window.validatePhone = function(phone) {
  const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
};

// Validate required fields
window.validateRequiredFields = function(data, requiredFields) {
  const errors = [];
  
  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push(`${field} is required`);
    }
  });
  
  return errors;
};

// ===== STRING UTILITIES =====

// Capitalize first letter of each word
window.capitalizeWords = function(str) {
  if (!str) return '';
  return str.replace(/\b\w/g, l => l.toUpperCase());
};

// Convert snake_case to Title Case
window.snakeToTitle = function(str) {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Generate random ID
window.generateRandomId = function(prefix = 'id') {
  return prefix + '_' + Math.random().toString(36).substr(2, 9);
};

// ===== ARRAY UTILITIES =====

// Remove duplicates from array
window.removeDuplicates = function(array, key = null) {
  if (!key) {
    return [...new Set(array)];
  }
  
  const seen = new Set();
  return array.filter(item => {
    const keyValue = item[key];
    if (seen.has(keyValue)) {
      return false;
    }
    seen.add(keyValue);
    return true;
  });
};

// Sort array by key
window.sortByKey = function(array, key, direction = 'asc') {
  return array.sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (direction === 'desc') {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
    return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
  });
};

// ===== UTILITY HELPERS =====

// Deep clone object
window.deepClone = function(obj) {
  return JSON.parse(JSON.stringify(obj));
};

// Check if object is empty
window.isEmpty = function(obj) {
  if (obj === null || obj === undefined) return true;
  if (typeof obj === 'string') return obj.trim() === '';
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

// Safe JSON parse
window.safeJSONParse = function(str, defaultValue = null) {
  try {
    return JSON.parse(str);
  } catch (error) {
    console.error('JSON parse error:', error);
    return defaultValue;
  }
};

// ===== USER DISPLAY HELPERS =====

// Helper function to display user names instead of emails
window.getUserDisplayName = function(email, usersList) {
  if (!email || !usersList) return email || 'Unassigned';
  const user = usersList.find(u => u.email === email);
  return user ? user.name : email;
};

// ===== PRIORITY STYLING HELPERS =====

window.getPriorityStyles = function(priority) {
  switch (priority) {
    case "P1":
      return "bg-red-100 border-l-4 border-red-500 text-red-800";
    case "P2":
      return "bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800";
    case "P3":
      return "bg-green-100 border-l-4 border-green-500 text-green-800";
    default:
      return "bg-gray-100 border-l-4 border-gray-500 text-gray-800";
  }
};

window.getPriorityBadgeColor = function(priority) {
  switch (priority) {
    case "P1":
      return "bg-red-500 text-white";
    case "P2":
      return "bg-yellow-500 text-white";
    case "P3":
      return "bg-green-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
};

// Add this utility function to handle field name differences
// Add to app-business-logic.js or utils/helpers.js

window.normalizeAllocationData = (allocations) => {
  return allocations.map(allocation => {
    // Handle both old and new category systems
    const normalizedCategory = allocation.category_name || allocation.category_of_ticket || 'General';
    
    return {
      ...allocation,
      // Ensure we have tickets_allocated field
      tickets_allocated: allocation.tickets_allocated || allocation.quantity || 0,
      // Ensure we have quantity field (for backward compatibility)
      quantity: allocation.quantity || allocation.tickets_allocated || 0,
      // Normalize category field to use category_name consistently
      category_name: normalizedCategory,
      // Keep original field for backward compatibility
      category_of_ticket: allocation.category_of_ticket || normalizedCategory
    };
  });
};

// Update the openAllocationManagement function to use this normalizer:
// Mark this as the authoritative version
const authoritativeOpenAllocationManagement = async (inventory) => {
  console.log("👁️ [UTILS] openAllocationManagement called with:", inventory?.event_name);
  
  // Check if we're already in allocation management to prevent conflicts
  if (window.showAllocationManagement || window.appState?.showAllocationManagement) {
    console.log("⚠️ Allocation management already open, using existing data");
    return;
  }
  
  try {
    // Set loading state
    if (window.setLoading) {
      window.setLoading(true);
    }
    
    // Set the inventory for allocation management
    if (window.setAllocationManagementInventory) {
      window.setAllocationManagementInventory(inventory);
    }
    
    // CRITICAL FIX: Fetch allocations from API with React-safe timing
    console.log("🔄 Fetching allocations for inventory:", inventory.id);
    
    // Use requestAnimationFrame to ensure React is ready
    requestAnimationFrame(async () => {
      try {
        const response = await window.apiCall(`/inventory/${inventory.id}/allocations`);
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        // Normalize allocation data to handle field name differences
        const rawAllocations = response.data?.allocations || [];
        console.log("🔍 Raw allocation data from API:", rawAllocations);
        
        const allocations = window.normalizeAllocationData ? 
          window.normalizeAllocationData(rawAllocations) : 
          rawAllocations;
        
        console.log("✅ Fetched and normalized allocations:", allocations.length);
        console.log("🔍 First normalized allocation:", allocations[0]);
        
        // Use functional update to prevent conflicts
        if (window.setCurrentAllocations) {
          window.setCurrentAllocations(() => allocations);
        }
        
      } catch (error) {
        console.error('❌ Error fetching allocations:', error);
        if (window.setCurrentAllocations) {
          window.setCurrentAllocations([]);
        }
      }
    });
    
    // Show the modal immediately 
    if (window.setShowAllocationManagement) {
      window.setShowAllocationManagement(true);
    }
    
    console.log("✅ Allocation management modal setup initiated");
    
  } catch (error) {
    console.error('❌ Error in openAllocationManagement:', error);
    alert('Error opening allocation management: ' + error.message);
    
  } finally {
    if (window.setLoading) {
      window.setLoading(false);
    }
  }
};

// Assign to global scope with protection against overwrites
window.openAllocationManagement = authoritativeOpenAllocationManagement;

// Add a marker to identify the authoritative version
window.openAllocationManagement._source = 'utils/helpers.js';
window.openAllocationManagement._isAuthoritative = true;

console.log('✅ Authoritative openAllocationManagement loaded from utils/helpers.js');

// Consolidated user display name function
window.getUserDisplayName = function(userId, usersList = null) {
  if (!userId) return 'Unassigned';
  
  // Try multiple sources for users list
  const users = usersList || window.users || window.appState?.users || [];
  
  // Find user by email or ID
  const user = users.find(u => u.email === userId || u.id === userId);
  
  if (!user) return userId; // Return the ID if user not found
  
  // Build display name
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return fullName || user.name || user.email || userId;
};

// Centralized error handler
window.handleError = function(error, context = '', options = {}) {
  const {
    showUser = true,
    severity = 'error',
    fallbackMessage = 'An unexpected error occurred'
  } = options;
  
  // Log error with context
  window.log[severity](`Error in ${context}:`, {
    message: error.message,
    stack: error.stack,
    context: context,
    timestamp: new Date().toISOString()
  });
  
  // Extract user-friendly message
  const userMessage = error.response?.data?.message || 
                     error.response?.data?.error ||
                     error.message || 
                     fallbackMessage;
  
  // Show to user if needed
  if (showUser) {
    // Use your notification system if available
    if (window.showNotification) {
      window.showNotification(userMessage, severity);
    } else if (window.showError) {
      window.showError(userMessage);
    } else {
      // Fallback to alert for errors
      if (severity === 'error') {
        alert(`Error: ${userMessage}`);
      }
    }
  }
  
  // Return structured error info for further handling
  return {
    error,
    userMessage,
    context,
    handled: true
  };
};

window.log.success('Helper functions loaded');
