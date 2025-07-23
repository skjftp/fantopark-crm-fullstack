// ===== INDIAN NUMBER FORMAT FOR FANTOPARK CRM FINANCIALS =====
// Add this to your main JavaScript file or create a separate utilities file

// Enhanced Indian Currency Formatter - No Decimals
window.formatCurrency = function(amount, currencyOrOptions = 'INR') {
  if (amount === null || amount === undefined || isNaN(amount)) {
    // If currency is passed as string, use appropriate symbol
    if (typeof currencyOrOptions === 'string' && currencyOrOptions !== 'INR') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyOrOptions,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(0);
    }
    return '₹0';
  }

  // Handle both string currency code and options object
  let options = {};
  let currencyCode = 'INR';
  
  if (typeof currencyOrOptions === 'string') {
    currencyCode = currencyOrOptions;
    options = {
      showDecimals: false,
      currency: currencyCode === 'INR' ? '₹' : currencyCode,
      showFullForm: false
    };
  } else {
    options = currencyOrOptions;
    currencyCode = options.currency === '₹' ? 'INR' : (options.currency || 'INR');
  }

  // For non-INR currencies, use Intl.NumberFormat
  if (currencyCode !== 'INR' && currencyCode !== '₹') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: options.showDecimals ? 2 : 0,
      maximumFractionDigits: options.showDecimals ? 2 : 0
    }).format(amount);
  }

  const {
    showDecimals = false,  // Set to false for no decimals
    currency = '₹',
    showFullForm = false   // Show "Lakhs"/"Crores" text
  } = options;

  // Convert to number and remove decimals if needed
  let number = Math.round(Number(amount));
  
  // Handle negative numbers
  const isNegative = number < 0;
  number = Math.abs(number);
  
  // Convert number to string for manipulation
  let numberStr = number.toString();
  
  // Indian number system grouping
  if (numberStr.length > 3) {
    // First, separate the last 3 digits
    let lastThree = numberStr.substring(numberStr.length - 3);
    let otherNumbers = numberStr.substring(0, numberStr.length - 3);
    
    // Add commas every 2 digits for the remaining part (Indian style)
    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }
    
    // Process the remaining digits in groups of 2
    let result = '';
    for (let i = otherNumbers.length; i > 0; i -= 2) {
      let start = Math.max(0, i - 2);
      let chunk = otherNumbers.substring(start, i);
      
      if (result === '') {
        result = chunk;
      } else {
        result = chunk + ',' + result;
      }
    }
    
    numberStr = result + lastThree;
  }

  // Add currency symbol and handle negative
  let formatted = `${currency}${numberStr}`;
  if (isNegative) {
    formatted = `-${formatted}`;
  }

  return formatted;
};

// Alternative formatter with Lakhs/Crores text
window.formatCurrencyWithText = function(amount, options = {}) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }

  const {
    currency = '₹',
    precision = 1
  } = options;

  let number = Number(amount);
  const isNegative = number < 0;
  number = Math.abs(number);

  let formatted;
  let suffix = '';

  if (number >= 10000000) { // 1 Crore and above
    formatted = (number / 10000000).toFixed(precision);
    suffix = ' Cr';
  } else if (number >= 100000) { // 1 Lakh and above
    formatted = (number / 100000).toFixed(precision);
    suffix = ' L';
  } else if (number >= 1000) { // 1 Thousand and above
    formatted = (number / 1000).toFixed(precision);
    suffix = ' K';
  } else {
    formatted = number.toString();
  }

  // Remove unnecessary .0
  if (formatted.endsWith('.0')) {
    formatted = formatted.slice(0, -2);
  }

  return `${isNegative ? '-' : ''}${currency}${formatted}${suffix}`;
};

// Enhanced Number Formatter (without currency symbol)
window.formatNumber = function(number, useIndianFormat = true) {
  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }

  if (useIndianFormat) {
    // Use Indian number format
    return window.formatCurrency(number, { currency: '' }).slice(0); // Remove ₹ symbol
  } else {
    // Use standard international format
    return Number(number).toLocaleString('en-US');
  }
};

// Specific formatters for different financial metrics
window.formatFinancialAmount = function(amount, type = 'currency') {
  switch (type) {
    case 'currency':
      return window.formatCurrency(amount);
    case 'compact':
      return window.formatCurrencyWithText(amount);
    case 'number':
      return window.formatNumber(amount);
    default:
      return window.formatCurrency(amount);
  }
};

// Apply to existing financial dashboard elements
window.updateFinancialDisplay = function() {
  // Update Total Sales
  const totalSalesElement = document.querySelector('[data-metric="total-sales"]');
  if (totalSalesElement && window.financialData?.totalSales) {
    totalSalesElement.textContent = window.formatCurrency(window.financialData.totalSales);
  }

  // Update Total Receivables
  const receivablesElement = document.querySelector('[data-metric="total-receivables"]');
  if (receivablesElement && window.financialData?.totalReceivables) {
    receivablesElement.textContent = window.formatCurrency(window.financialData.totalReceivables);
  }

  // Update Total Payables
  const payablesElement = document.querySelector('[data-metric="total-payables"]');
  if (payablesElement && window.financialData?.totalPayables) {
    payablesElement.textContent = window.formatCurrency(window.financialData.totalPayables);
  }

  // Update Total Margin
  const marginElement = document.querySelector('[data-metric="total-margin"]');
  if (marginElement && window.financialData?.totalMargin) {
    marginElement.textContent = window.formatCurrency(window.financialData.totalMargin);
  }
};

// Override the existing formatCurrency if it exists
if (typeof window.formatCurrency !== 'undefined') {
  //console.log('✅ formatCurrency function updated with Indian number format (no decimals)');
} else {
  //console.log('✅ formatCurrency function created with Indian number format (no decimals)');
}

// Auto-apply to financials tab when it loads
document.addEventListener('DOMContentLoaded', function() {
  // Apply formatting when financials tab is accessed
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        const financialsTab = document.querySelector('[data-tab="financials"], #financials-content');
        if (financialsTab && financialsTab.style.display !== 'none') {
          setTimeout(window.updateFinancialDisplay, 100);
        }
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});

// Export for manual use
window.indianNumberFormat = {
  formatCurrency: window.formatCurrency,
  formatCurrencyWithText: window.formatCurrencyWithText,
  formatNumber: window.formatNumber,
  updateDisplay: window.updateFinancialDisplay
};
