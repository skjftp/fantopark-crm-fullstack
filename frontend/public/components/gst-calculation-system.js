// FIXED: GST/TCS Calculation System Component for FanToPark CRM
// Handles all GST and TCS calculations with corrected logic
// ✅ Tour Package = 5% GST | Service = 18% GST
// ✅ TCS on GST-inclusive amount | B2B never gets TCS

// ===== FIXED: Enhanced GST and TCS Calculation Function =====
window.calculateGSTAndTCS = (baseAmount, paymentData) => {
  const isIntraState = paymentData.indian_state === 'Haryana' && !paymentData.is_outside_india;
  const isOutsideIndia = paymentData.event_location === 'outside_india';
  const isIndian = paymentData.customer_type === 'indian';
  const isNRIOrForeigner = ['nri', 'foreigner'].includes(paymentData.customer_type);
  const isINRPayment = paymentData.payment_currency === 'INR';
  const isCorporate = paymentData.category_of_sale === 'Corporate'; // B2B
  const isRetail = paymentData.category_of_sale === 'Retail'; // B2C
  
  // Get invoice total for Service Fee type
  let invoiceTotal = 0;
  if (paymentData.type_of_sale === 'Service Fee') {
    invoiceTotal = (paymentData.invoice_items || []).reduce((sum, item) => 
      sum + ((item.quantity || 0) * (item.rate || 0)), 0
    );
  }
  
  // ===== FIXED: Simplified GST Logic per requirements =====
  let gstApplicable = false;
  let gstRate = 0;
  
  // Determine GST applicability first (when GST should apply)
  if (isIndian) {
    // Indian customers always get GST regardless of location
    gstApplicable = true;
  } else if (isNRIOrForeigner) {
    // International customers
    if (!isOutsideIndia) {
      // Event in India = GST applicable
      gstApplicable = true;
    } else if (isOutsideIndia && isINRPayment) {
      // Event outside India but paying in INR = GST applicable
      gstApplicable = true;
    }
    // Event outside India + foreign currency = No GST
  }
  
  // ===== FIXED: Simplified GST Rate Logic =====
  if (gstApplicable) {
    // Check type of sale to determine rate
    if (paymentData.type_of_sale === 'Service Fee' || paymentData.type_of_sale === 'Service') {
      // ✅ Service = 18% GST always
      gstRate = 18;
    } else {
      // ✅ Tour Package = 5% GST always  
      gstRate = 5;
    }
  }

  // ===== FIXED: TCS Logic per requirements =====
  let tcsApplicable = false;
  let tcsRate = paymentData.tcs_rate || 5; // Standard TCS rate

  // ✅ B2B clients NEVER get TCS
  if (isCorporate) {
    tcsApplicable = false;
  } else {
    // Only B2C (Retail) clients can get TCS
    if (isOutsideIndia) {
      // Event outside India
      if (isIndian) {
        // Indian B2C clients pay TCS for events outside India
        tcsApplicable = true;
      } else if (isNRIOrForeigner && isINRPayment) {
        // NRI/Foreigner B2C clients pay TCS only if they pay in INR
        tcsApplicable = true;
      }
    }
    // If event is in India, NO ONE pays TCS
  }

  // ===== CALCULATE GST AMOUNTS =====
  const gstAmount = gstApplicable ? (baseAmount * gstRate) / 100 : 0;
  const cgstAmount = gstApplicable && isIntraState ? gstAmount / 2 : 0;
  const sgstAmount = gstApplicable && isIntraState ? gstAmount / 2 : 0;
  const igstAmount = gstApplicable && !isIntraState ? gstAmount : 0;

  // ===== FIXED: TCS CALCULATION ON GST-INCLUSIVE AMOUNT =====
  const gstInclusiveAmount = baseAmount + gstAmount; // Base + GST
  const tcsAmount = tcsApplicable ? (gstInclusiveAmount * tcsRate) / 100 : 0;

  console.log('🔍 GST/TCS Calculation Debug:', {
    baseAmount,
    gstInclusiveAmount,
    gstRate,
    gstAmount,
    tcsRate,
    tcsAmount,
    isCorporate,
    typeOfSale: paymentData.type_of_sale,
    invoiceTotal
  });

  // For Service Fee type: Final Amount = Invoice Total + Service Fee + GST + TCS
  const finalAmount = paymentData.type_of_sale === 'Service Fee' 
    ? invoiceTotal + baseAmount + gstAmount + tcsAmount
    : baseAmount + gstAmount + tcsAmount;

  return {
    gst: {
      applicable: gstApplicable,
      rate: gstRate,
      cgst: cgstAmount,
      sgst: sgstAmount,
      igst: igstAmount,
      total: gstAmount,
      amount: gstAmount // For compatibility
    },
    tcs: {
      applicable: tcsApplicable,
      rate: tcsRate,
      amount: tcsAmount,
      base_for_calculation: gstInclusiveAmount // Show what TCS was calculated on
    },
    finalAmount: finalAmount
  };
};

// ===== FIXED: GST Rate Determination Helper =====
window.determineGSTRate = (paymentData) => {
  const isIndian = paymentData.customer_type === 'indian';
  const isNRIOrForeigner = ['nri', 'foreigner'].includes(paymentData.customer_type);
  const isOutsideIndia = paymentData.event_location === 'outside_india';
  const isINRPayment = paymentData.payment_currency === 'INR';
  
  // Check if GST is applicable first
  let gstApplicable = false;
  if (isIndian) {
    gstApplicable = true;
  } else if (isNRIOrForeigner) {
    if (!isOutsideIndia || (isOutsideIndia && isINRPayment)) {
      gstApplicable = true;
    }
  }
  
  if (!gstApplicable) return 0;
  
  // ✅ FIXED: Simple rate logic
  if (paymentData.type_of_sale === 'Service Fee' || paymentData.type_of_sale === 'Service') {
    return 18; // Service = 18%
  } else {
    return 5;  // Tour Package = 5%
  }
};

// ===== FIXED: TCS Applicability Helper =====
window.determineTCSApplicability = (paymentData) => {
  const isCorporate = paymentData.category_of_sale === 'Corporate';
  const isOutsideIndia = paymentData.event_location === 'outside_india';
  const isIndian = paymentData.customer_type === 'indian';
  const isNRIOrForeigner = ['nri', 'foreigner'].includes(paymentData.customer_type);
  const isINRPayment = paymentData.payment_currency === 'INR';

  // ✅ B2B clients NEVER get TCS
  if (isCorporate) {
    return false;
  }

  // Only for B2C clients and events outside India
  if (!isOutsideIndia) {
    return false; // Event in India = No TCS for anyone
  }

  if (isIndian) {
    return true; // Indian B2C client, event outside India = TCS applicable
  }

  if (isNRIOrForeigner && isINRPayment) {
    return true; // NRI/Foreigner B2C client paying in INR = TCS applicable
  }

  return false; // All other cases = No TCS
};

// ===== ENHANCED: GST and TCS Calculation Preview Function =====
window.renderEnhancedGSTCalculationPreview = () => {
  const invoiceTotal = window.paymentData.invoice_items?.reduce((sum, item) => 
    sum + ((item.quantity || 0) * (item.rate || 0)), 0
  ) || 0;
  
  const baseAmount = window.getBaseAmount(window.paymentData);
  const calculation = window.calculateGSTAndTCS(baseAmount, window.paymentData);
  const isIntraState = window.paymentData.indian_state === 'Haryana' && !window.paymentData.is_outside_india;
  const advanceAmount = parseFloat(window.paymentData.advance_amount) || 0;
  const isReceivablePayment = window.paymentData.from_receivable || window.paymentData.payment_post_service;

  // Calculate final amount with custom TCS rate if manually set
  const customTcsRate = window.paymentData.tcs_rate || calculation.tcs.rate;
  const finalTcsAmount = calculation.tcs.applicable ? 
    ((baseAmount + calculation.gst.total) * customTcsRate) / 100 : 0;
  
  const finalAmount = baseAmount + calculation.gst.total + finalTcsAmount;

  return React.createElement('div', { className: 'bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4' },
    React.createElement('h3', { className: 'text-lg font-semibold text-blue-900 mb-3' }, '💰 Tax Calculation Preview'),
    
    // Base Amount
    React.createElement('div', { className: 'grid grid-cols-2 gap-4 mb-4' },
      React.createElement('div', null,
        React.createElement('label', { className: 'text-sm font-medium text-gray-700' }, 'Base Amount:'),
        React.createElement('div', { className: 'text-lg font-semibold text-gray-900' }, `₹${baseAmount.toLocaleString()}`)
      ),
      React.createElement('div', null,
        React.createElement('label', { className: 'text-sm font-medium text-gray-700' }, 'Sale Type:'),
        React.createElement('div', { className: 'text-sm text-gray-600' }, 
          window.paymentData.type_of_sale || 'Tour Package'
        )
      )
    ),

    // ===== ENHANCED: GST Section with clearer logic =====
    React.createElement('div', { className: 'border-t pt-3 mb-3' },
      React.createElement('h4', { className: 'font-medium text-gray-900 mb-2' }, '📊 GST Calculation'),
      React.createElement('div', { className: 'grid grid-cols-2 gap-4 mb-2' },
        React.createElement('div', null,
          React.createElement('div', { className: 'flex items-center gap-2' },
            React.createElement('span', null, 'GST:'),
            React.createElement('span', { 
              className: `px-2 py-1 rounded text-xs ${calculation.gst.applicable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`
            }, calculation.gst.applicable ? `${calculation.gst.rate}% Applicable` : 'Not Applicable')
          ),
          React.createElement('div', { className: 'text-xs text-gray-600 mt-1' },
            (() => {
              if (!calculation.gst.applicable) return 'GST not applicable for this configuration';
              
              if (window.paymentData.type_of_sale === 'Service Fee' || window.paymentData.type_of_sale === 'Service') {
                return '✅ Service Fee/Service → 18% GST (Fixed)';
              } else {
                return '✅ Tour Package → 5% GST (Fixed)';
              }
            })()
          )
        ),
        calculation.gst.applicable && React.createElement('div', null,
          React.createElement('div', { className: 'text-right' },
            React.createElement('div', { className: 'text-lg font-semibold text-green-600' }, 
              `₹${calculation.gst.total.toLocaleString()}`
            ),
            isIntraState && React.createElement('div', { className: 'text-xs text-gray-600' },
              `CGST: ₹${calculation.gst.cgst.toLocaleString()} | SGST: ₹${calculation.gst.sgst.toLocaleString()}`
            ),
            !isIntraState && React.createElement('div', { className: 'text-xs text-gray-600' },
              `IGST: ₹${calculation.gst.igst.toLocaleString()}`
            )
          )
        )
      )
    ),

    // ===== ENHANCED: TCS Section with clearer logic =====
    React.createElement('div', { className: 'border-t pt-3 mb-3' },
      React.createElement('h4', { className: 'font-medium text-gray-900 mb-2' }, '🏛️ TCS Calculation'),
      React.createElement('div', { className: 'grid grid-cols-2 gap-4 mb-2' },
        React.createElement('div', null,
          React.createElement('div', { className: 'flex items-center gap-2' },
            React.createElement('span', null, 'TCS:'),
            React.createElement('span', { 
              className: `px-2 py-1 rounded text-xs ${calculation.tcs.applicable ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`
            }, calculation.tcs.applicable ? `${customTcsRate}% Applicable` : 'Not Applicable')
          ),
          React.createElement('div', { className: 'text-xs text-gray-600 mt-1' },
            (() => {
              const isCorporate = window.paymentData.category_of_sale === 'Corporate';
              const isOutsideIndia = window.paymentData.event_location === 'outside_india';
              
              if (isCorporate) {
                return '❌ B2B clients never pay TCS';
              } else if (!isOutsideIndia) {
                return '❌ Events in India: No TCS applicable';
              } else if (calculation.tcs.applicable) {
                return `✅ TCS calculated on ₹${calculation.tcs.base_for_calculation.toLocaleString()} (GST-inclusive)`;
              } else {
                return '❌ TCS not applicable for this configuration';
              }
            })()
          )
        ),
        calculation.tcs.applicable && React.createElement('div', null,
          React.createElement('div', { className: 'text-right' },
            React.createElement('div', { className: 'text-lg font-semibold text-yellow-600' }, 
              `₹${finalTcsAmount.toLocaleString()}`
            ),
            React.createElement('div', { className: 'text-xs text-gray-600' },
              `On ₹${(baseAmount + calculation.gst.total).toLocaleString()} (Base + GST)`
            )
          )
        )
      )
    ),

    // Final Amount
    React.createElement('div', { className: 'border-t pt-3' },
      React.createElement('div', { className: 'flex justify-between items-center' },
        React.createElement('span', { className: 'text-lg font-semibold text-gray-900' }, 'Total Amount:'),
        React.createElement('span', { className: 'text-2xl font-bold text-blue-600' }, `₹${finalAmount.toLocaleString()}`)
      ),
      
      // Breakdown
      React.createElement('div', { className: 'text-sm text-gray-600 mt-2' },
        React.createElement('div', null, `Base Amount: ₹${baseAmount.toLocaleString()}`),
        calculation.gst.applicable && React.createElement('div', null, 
          `+ GST (${calculation.gst.rate}%): ₹${calculation.gst.total.toLocaleString()}`
        ),
        calculation.tcs.applicable && React.createElement('div', null, 
          `+ TCS (${customTcsRate}%): ₹${finalTcsAmount.toLocaleString()}`
        )
      )
    ),

    // ===== NEW: Quick Info Panel =====
    React.createElement('div', { className: 'mt-4 p-3 bg-white border border-blue-200 rounded' },
      React.createElement('h5', { className: 'font-medium text-gray-900 mb-2' }, '📋 Quick Reference'),
      React.createElement('div', { className: 'text-xs text-gray-600 space-y-1' },
        React.createElement('div', null, '• Tour Package: 5% GST | Service: 18% GST'),
        React.createElement('div', null, '• TCS calculated on GST-inclusive amount'),
        React.createElement('div', null, '• B2B clients never pay TCS'),
        React.createElement('div', null, '• TCS only for events outside India')
      )
    )
  );
};

// ===== HELPER: Tax calculation summary =====
window.getTaxSummary = (paymentData) => {
  const baseAmount = window.getBaseAmount(paymentData);
  const calculation = window.calculateGSTAndTCS(baseAmount, paymentData);
  
  return {
    baseAmount: baseAmount,
    gstAmount: calculation.gst.total,
    tcsAmount: calculation.tcs.amount,
    finalAmount: calculation.finalAmount,
    gstRate: calculation.gst.rate,
    tcsRate: calculation.tcs.rate,
    gstApplicable: calculation.gst.applicable,
    tcsApplicable: calculation.tcs.applicable,
    tcsBaseAmount: calculation.tcs.base_for_calculation // GST-inclusive amount
  };
};

// ===== DEBUG: Test function for tax calculations =====
window.testTaxCalculation = function(testData = {}) {
  console.log('🧪 Testing tax calculation...');
  
  const defaultTestData = {
    type_of_sale: 'Tour',
    category_of_sale: 'Retail',
    customer_type: 'indian',
    event_location: 'india',
    payment_currency: 'INR',
    indian_state: 'Haryana',
    is_outside_india: false,
    ...testData
  };
  
  const baseAmount = 100000; // ₹1,00,000
  const result = window.calculateGSTAndTCS(baseAmount, defaultTestData);
  
  console.log('Test Data:', defaultTestData);
  console.log('Result:', result);
  console.log('Expected for Tour Package B2C India: 5% GST, No TCS');
  
  return result;
};

console.log('✅ FIXED: GST/TCS Calculation System with corrected logic loaded successfully');
console.log('🔧 To test: window.testTaxCalculation({ type_of_sale: "Service", category_of_sale: "Corporate" })');
