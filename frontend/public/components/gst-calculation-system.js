// GST/TCS Calculation System Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Handles all GST and TCS calculations and preview components

// Enhanced GST and TCS Calculation Function
window.calculateGSTAndTCS = (baseAmount, paymentData) => {
  const isIntraState = paymentData.indian_state === 'Haryana' && !paymentData.is_outside_india;
  const isOutsideIndia = paymentData.event_location === 'outside_india';
  const isIndian = paymentData.customer_type === 'indian';
  const isNRIOrForeigner = ['nri', 'foreigner'].includes(paymentData.customer_type);
  const isINRPayment = paymentData.payment_currency === 'INR';
  const isCorporate = paymentData.category_of_sale === 'Corporate';
  const isServiceFee = paymentData.type_of_sale === 'Service Fee';

  let gstApplicable = false;
  let gstRate = 0;
  let tcsApplicable = false;
  let tcsRate = paymentData.tcs_rate || 5; // Standard TCS rate

  // TCS Logic: CORRECTED
  if (isOutsideIndia) {
    // Event outside India
    if (isIndian) {
      // All Indian clients pay TCS for events outside India
      tcsApplicable = true;
    } else if (isNRIOrForeigner && isINRPayment) {
      // NRI/Foreigner pay TCS only if they pay in INR
      tcsApplicable = true;
    }
  }
  // If event is in India, NO ONE pays TCS

  // GST Logic: CORRECTED with Service Fee handling
  if (isServiceFee) {
    // Service Fee: Always 18% GST regardless of customer type or location
    gstApplicable = true;
    gstRate = 18;
  } else {
    // Tour Package: Variable rates based on customer type and location
    if (isIndian) {
      // Domestic clients (Indian)
      if (isCorporate) {
        // B2B: Always 18% regardless of event location
        gstApplicable = true;
        gstRate = 18;
      } else {
        // B2C: Always 5% regardless of event location  
        gstApplicable = true;
        gstRate = 5;
      }
    } else if (isNRIOrForeigner) {
      // International clients (NRI/Foreigner)
      if (!isOutsideIndia) {
        // Event in India: Always 5% GST for international clients
        gstApplicable = true;
        gstRate = 5;
      } else {
        // Event outside India
        if (isINRPayment) {
          // Pay in INR: 5% GST
          gstApplicable = true;
          gstRate = 5;
        } else {
          // Pay in foreign currency: No GST
          gstApplicable = false;
        }
      }
    }
  }

  // Calculate amounts
  const gstAmount = gstApplicable ? (baseAmount * gstRate) / 100 : 0;
  const cgstAmount = gstApplicable && isIntraState ? gstAmount / 2 : 0;
  const sgstAmount = gstApplicable && isIntraState ? gstAmount / 2 : 0;
  const igstAmount = gstApplicable && !isIntraState ? gstAmount : 0;

  const tcsAmount = tcsApplicable ? (baseAmount * tcsRate) / 100 : 0;

  return {
    gst: {
      applicable: gstApplicable,
      rate: gstRate,
      cgst: cgstAmount,
      sgst: sgstAmount,
      igst: igstAmount,
      total: gstAmount
    },
    tcs: {
      applicable: tcsApplicable,
      rate: tcsRate,
      amount: tcsAmount
    },
    finalAmount: baseAmount + gstAmount + tcsAmount
  };
};

// Enhanced GST and TCS Calculation Preview Function
window.renderEnhancedGSTCalculationPreview = () => {
  // ADD: Calculate invoiceTotal first
  const invoiceTotal = window.paymentData.invoice_items?.reduce((sum, item) => 
    sum + ((item.quantity || 0) * (item.rate || 0)), 0
  ) || 0;
  
  const baseAmount = window.getBaseAmount(window.paymentData);
  const calculation = window.calculateGSTAndTCS(baseAmount, window.paymentData);
  const isIntraState = window.paymentData.indian_state === 'Haryana' && !window.paymentData.is_outside_india;
  const advanceAmount = parseFloat(window.paymentData.advance_amount) || 0;
  const isReceivablePayment = window.paymentData.from_receivable || window.paymentData.payment_post_service;

  // CALCULATE: Final amount with custom TCS rate
  const finalAmount = baseAmount + calculation.gst.total + 
    (calculation.tcs.applicable ? (baseAmount * (window.paymentData.tcs_rate || calculation.tcs.rate)) / 100 : 0);

  return React.createElement('div', { className: 'mb-6 p-4 bg-gray-50 rounded-lg' },
    React.createElement('h3', { className: 'text-lg font-semibold text-gray-800 mb-4' }, 
      '🧮 Enhanced Tax Calculation Preview'
    ),
    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },

      // Left Column - Basic Amounts
      React.createElement('div', { className: 'space-y-3' },
        React.createElement('h4', { className: 'font-medium text-gray-700 border-b pb-2' }, 'Base Amounts'),
        React.createElement('div', { className: 'space-y-2 text-sm' },
          React.createElement('div', { className: 'flex justify-between' },
            React.createElement('span', null, 'Invoice Total:'),
            React.createElement('span', { className: 'font-medium' }, 
              (window.paymentData.payment_currency || 'INR'), ' ', invoiceTotal.toFixed(2)
            )
          ),
          window.paymentData.type_of_sale === 'Service Fee' && 
          React.createElement('div', { className: 'flex justify-between border-t pt-2' },
            React.createElement('span', null, 'Service Fee:'),
            React.createElement('span', { className: 'font-medium' }, 
              (window.paymentData.payment_currency || 'INR'), ' ', (parseFloat(window.paymentData.service_fee_amount) || 0).toFixed(2)
            )
          ),
          React.createElement('div', { className: 'flex justify-between font-medium border-t pt-2' },
            React.createElement('span', null, 'Taxable Amount:'),
            React.createElement('span', null, 
              (window.paymentData.payment_currency || 'INR'), ' ', baseAmount.toFixed(2)
            )
          )
        )
      ),

      // Right Column - Tax Breakdown
      React.createElement('div', { className: 'space-y-3' },
        React.createElement('h4', { className: 'font-medium text-gray-700 border-b pb-2' }, 'Tax Breakdown'),
        React.createElement('div', { className: 'space-y-2 text-sm' },

          // GST Section
          calculation.gst.applicable ? [
            isIntraState ? [
              React.createElement('div', { key: 'cgst', className: 'flex justify-between' },
                React.createElement('span', null, `CGST (${calculation.gst.rate/2}%):`),
                React.createElement('span', { className: 'font-medium' }, 
                  (window.paymentData.payment_currency || 'INR'), ' ', calculation.gst.cgst.toFixed(2)
                )
              ),
              React.createElement('div', { key: 'sgst', className: 'flex justify-between' },
                React.createElement('span', null, `SGST (${calculation.gst.rate/2}%):`),
                React.createElement('span', { className: 'font-medium' }, 
                  (window.paymentData.payment_currency || 'INR'), ' ', calculation.gst.sgst.toFixed(2)
                )
              )
            ] : React.createElement('div', { key: 'igst', className: 'flex justify-between' },
              React.createElement('span', null, `IGST (${calculation.gst.rate}%):`),
              React.createElement('span', { className: 'font-medium' }, 
                (window.paymentData.payment_currency || 'INR'), ' ', calculation.gst.igst.toFixed(2)
              )
            )
          ] : React.createElement('div', { key: 'no-gst', className: 'flex justify-between text-gray-500' },
            React.createElement('span', null, 'GST:'),
            React.createElement('span', null, 'Not Applicable')
          ),

          // TCS Section with dynamic rate
          calculation.tcs.applicable ? 
          React.createElement('div', { className: 'flex justify-between text-yellow-700' },
            React.createElement('span', null, `TCS (${window.paymentData.tcs_rate || calculation.tcs.rate}%):`),
            React.createElement('span', { className: 'font-medium' }, 
              window.paymentData.payment_currency || 'INR', ' ', 
              ((baseAmount * (window.paymentData.tcs_rate || calculation.tcs.rate)) / 100).toFixed(2)
            )
          ) : React.createElement('div', { className: 'flex justify-between text-gray-500' },
            React.createElement('span', null, 'TCS:'),
            React.createElement('span', null, 'Not Applicable')
          ),

          // Final Amount with custom TCS rate
          React.createElement('div', { className: 'flex justify-between text-lg font-bold border-t pt-2 mt-2' },
            React.createElement('span', null, 'Final Amount:'),
            React.createElement('span', null, 
              window.paymentData.payment_currency || 'INR', ' ', finalAmount.toFixed(2)
            )
          ),

          // Payment Information
          !isReceivablePayment && React.createElement('div', { className: 'flex justify-between border-t pt-2' },
            React.createElement('span', { className: 'font-semibold' }, 'Advance Received:'),
            React.createElement('span', { className: 'font-semibold text-blue-600' }, 
              (window.paymentData.payment_currency || 'INR'), ' ', advanceAmount.toFixed(2)
            )
          ),
          !isReceivablePayment && React.createElement('div', { className: 'flex justify-between' },
            React.createElement('span', { className: 'font-bold' }, 'Balance Due:'),
            React.createElement('span', { className: 'font-bold text-orange-600' }, 
              (window.paymentData.payment_currency || 'INR'), ' ', (finalAmount - advanceAmount).toFixed(2)
            )
          ),
          isReceivablePayment && React.createElement('div', { className: 'flex justify-between border-t pt-2' },
            React.createElement('span', { className: 'font-bold' }, 'Payment Being Collected:'),
            React.createElement('span', { className: 'font-bold text-green-600' }, 
              (window.paymentData.payment_currency || 'INR'), ' ', advanceAmount.toFixed(2)
            )
          )
        )
      )
    )
  );
};

// Helper function for currency formatting
window.formatCurrency = (amount) => {
  return amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Safe number formatting helper
window.safeFormatNumber = (value) => {
  const num = parseFloat(value) || 0;
  return num.toLocaleString('en-IN');
};

// Payment input change handler with GST/TCS auto-calculation
window.handlePaymentInputChange = (field, value) => {
  window.setPaymentData(prev => {
    const updated = { ...prev, [field]: value };
    
    // Auto-update GST rate based on type_of_sale
    if (field === 'type_of_sale') {
      if (value === 'Service Fee') {
        updated.gst_rate = 18;
      } else if (value === 'Tour') {
        updated.gst_rate = 5;
      } else {
        updated.gst_rate = 18;
      }
    }
    
    // Handle TCS rate changes manually
    if (field === 'tcs_rate') {
      const baseAmount = window.getBaseAmount(updated);
      const newTcsAmount = updated.tcs_applicable ? (baseAmount * parseFloat(value)) / 100 : 0;
      updated.tcs_amount = newTcsAmount;
      // Mark that rate was manually selected
      updated.tcs_rate_manual = true;
    }
    
    // Auto-determine TCS applicability when customer type or currency changes
    if (['customer_type', 'event_location', 'payment_currency'].includes(field)) {
      const baseAmount = window.getBaseAmount(updated);
      const calculation = window.calculateGSTAndTCS(baseAmount, updated);
      updated.tcs_applicable = calculation.tcs.applicable;
      
      // Only update TCS rate if it wasn't manually set, or if customer type changed
      if (!updated.tcs_rate_manual || field === 'customer_type') {
        updated.tcs_rate = calculation.tcs.rate;
        updated.tcs_rate_manual = false; // Reset manual flag when customer type changes
      }
      
      // Recalculate TCS amount with current (possibly manual) rate
      const currentTcsRate = updated.tcs_rate || calculation.tcs.rate;
      updated.tcs_amount = calculation.tcs.applicable ? (baseAmount * currentTcsRate) / 100 : 0;
    }
    
    // Recalculate TCS when invoice items or service fee amount changes
    if (['invoice_items', 'service_fee_amount'].includes(field)) {
      const baseAmount = window.getBaseAmount(updated);
      if (updated.tcs_applicable) {
        const currentTcsRate = updated.tcs_rate || 5;
        updated.tcs_amount = (baseAmount * currentTcsRate) / 100;
      }
    }
    
    return updated;
  });
};

// Invoice item management functions
window.addInvoiceItem = () => {
  const newItems = [...(window.paymentData.invoice_items || [])];
  newItems.push({
    description: '',
    additional_info: '',
    quantity: 1,
    rate: 0
  });
  window.handlePaymentInputChange('invoice_items', newItems);
};

window.removeInvoiceItem = (index) => {
  if (window.paymentData.invoice_items.length <= 1) {
    alert('At least one invoice item is required');
    return;
  }
  const newItems = window.paymentData.invoice_items.filter((_, i) => i !== index);
  window.handlePaymentInputChange('invoice_items', newItems);
};

// Fixed version for post-deployment input issues
window.updateInvoiceItem = (index, field, value) => {
  // Create a completely new array to ensure React detects the change
  const newItems = JSON.parse(JSON.stringify(window.paymentData.invoice_items || []));
  newItems[index][field] = value;

  // Force a state update with new reference
  window.setPaymentData(prevData => ({
    ...prevData,
    invoice_items: newItems
  }));
};

// GST rate determination helper
window.determineGSTRate = (paymentData) => {
  const isIndian = paymentData.customer_type === 'indian';
  const isCorporate = paymentData.category_of_sale === 'Corporate';
  const isServiceFee = paymentData.type_of_sale === 'Service Fee';
  const isOutsideIndia = paymentData.event_location === 'outside_india';
  const isINRPayment = paymentData.payment_currency === 'INR';

  if (isServiceFee) {
    return 18; // Service Fee: Always 18%
  }

  if (isIndian) {
    return isCorporate ? 18 : 5; // Indian: B2B=18%, B2C=5%
  } else {
    // NRI/Foreigner
    if (isOutsideIndia && !isINRPayment) {
      return 0; // Event outside India, foreign currency = No GST
    }
    return 5; // All other cases for NRI/Foreigner = 5%
  }
};

// TCS applicability determination helper
window.determineTCSApplicability = (paymentData) => {
  const isOutsideIndia = paymentData.event_location === 'outside_india';
  const isIndian = paymentData.customer_type === 'indian';
  const isNRIOrForeigner = ['nri', 'foreigner'].includes(paymentData.customer_type);
  const isINRPayment = paymentData.payment_currency === 'INR';

  if (!isOutsideIndia) {
    return false; // Event in India = No TCS for anyone
  }

  if (isIndian) {
    return true; // Indian client, event outside India = TCS applicable
  }

  if (isNRIOrForeigner && isINRPayment) {
    return true; // NRI/Foreigner paying in INR = TCS applicable
  }

  return false; // All other cases = No TCS
};

// Tax calculation summary helper
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
    tcsApplicable: calculation.tcs.applicable
  };
};

console.log('✅ GST/TCS Calculation System component loaded successfully');
