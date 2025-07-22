/**
 * Date Helper Functions for consistent IST timestamp handling
 * 
 * IMPORTANT: All timestamps are stored as UTC ISO strings in the database
 * but date comparisons and display logic account for IST timezone
 */

/**
 * Convert any date to IST-aware timestamp
 * Returns UTC ISO string that when displayed in IST shows the correct time
 * @param {string|Date} dateInput - Date in any format
 * @param {string} metaCreatedTime - Optional Meta created time for accuracy
 * @returns {string} ISO string in UTC
 */
function convertToIST(dateInput, metaCreatedTime = null) {
  try {
    let dateToConvert;
    
    // If we have meta_created_time, prefer that for accuracy
    if (metaCreatedTime) {
      dateToConvert = metaCreatedTime;
    } else if (dateInput) {
      dateToConvert = dateInput;
    } else {
      // Default to current time
      dateToConvert = new Date();
    }
    
    // Handle various formats
    if (typeof dateToConvert === 'string') {
      // If it's just a date (YYYY-MM-DD), assume noon IST
      if (dateToConvert.length === 10) {
        // Noon IST = 6:30 AM UTC
        dateToConvert = `${dateToConvert}T06:30:00Z`;
      }
      // If it has +0000, replace with Z
      else if (dateToConvert.includes('+0000')) {
        dateToConvert = dateToConvert.replace('+0000', 'Z');
      }
      // If it has T but no Z, assume UTC and add Z
      else if (dateToConvert.includes('T') && !dateToConvert.endsWith('Z')) {
        dateToConvert = dateToConvert + 'Z';
      }
    }
    
    const utcDate = new Date(dateToConvert);
    
    // Validate date
    if (isNaN(utcDate.getTime())) {
      console.warn(`⚠️ Invalid date: ${dateInput}, using current time`);
      return new Date().toISOString();
    }
    
    // Return UTC ISO string (database will store as-is)
    return utcDate.toISOString();
    
  } catch (error) {
    console.error('❌ Error converting date:', error);
    // Return current time as fallback
    return new Date().toISOString();
  }
}

/**
 * Convert date filter for queries (handles both date-only and timestamps)
 * Adjusts for IST timezone to ensure correct date boundary queries
 * @param {string} dateStr - Date string from filter
 * @param {string} type - 'start' or 'end'
 * @returns {string} Properly formatted date for query
 */
function formatDateForQuery(dateStr, type = 'start') {
  if (!dateStr) return null;
  
  // If it's just a date (YYYY-MM-DD), we need to handle IST boundaries
  if (dateStr.length === 10) {
    if (type === 'start') {
      // Start of day in IST = previous day 18:30 UTC
      const date = new Date(`${dateStr}T00:00:00+05:30`);
      return date.toISOString();
    } else {
      // End of day in IST = same day 18:29:59 UTC
      const date = new Date(`${dateStr}T23:59:59+05:30`);
      return date.toISOString();
    }
  }
  
  // Already a timestamp, return as is
  return dateStr;
}

/**
 * Get IST date string (YYYY-MM-DD) from any date
 * @param {string|Date} dateInput - Date in any format
 * @returns {string} Date string in IST
 */
function getISTDateString(dateInput) {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    return '';
  }
  
  // Convert to IST by adding 5:30
  const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
  
  // Format as YYYY-MM-DD
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Check if a date falls on a specific IST date
 * @param {string} dateToCheck - Date to check
 * @param {string} targetDate - Target date (YYYY-MM-DD)
 * @returns {boolean}
 */
function isOnISTDate(dateToCheck, targetDate) {
  const istDateStr = getISTDateString(dateToCheck);
  return istDateStr === targetDate;
}

/**
 * Convert UTC date to IST display format
 * @param {string|Date} utcDate - UTC date
 * @returns {string} IST formatted date string
 */
function displayInIST(utcDate) {
  const date = new Date(utcDate);
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  // Use India timezone
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

module.exports = {
  convertToIST,
  formatDateForQuery,
  getISTDateString,
  isOnISTDate,
  displayInIST
};