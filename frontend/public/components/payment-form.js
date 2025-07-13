// Payment Form Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

window.renderEnhancedPaymentForm = () => {
  // ✅ COMPONENT INTEGRATION PATTERN: Extract state from window globals
  const {
    showPaymentForm = window.showPaymentForm,
    currentLead = window.currentLead,
    paymentData = window.paymentData || {},
    loading = window.loading
  } = window.appState || {};

  // ✅ COMPONENT INTEGRATION PATTERN: Function references with fallbacks
  const handlePaymentSubmit = window.handlePaymentSubmit || ((e) => {
    e.preventDefault();
    console.warn("⚠️ handlePaymentSubmit not implemented");
  });

  const handlePaymentInputChange = window.handlePaymentInputChange || ((field, value) => {
    console.warn("⚠️ handlePaymentInputChange not implemented:", field, value);
  });

  const closeForm = window.closeForm || (() => {
    console.warn("⚠️ closeForm not implemented");
  });

  const calculateGSTAndTCS = window.calculateGSTAndTCS || ((baseAmount, paymentData) => {
    console.warn("⚠️ calculateGSTAndTCS not implemented");
    return {
      gst: { applicable: false, rate: 0, amount: 0, cgst: 0, sgst: 0, igst: 0 },
      tcs: { applicable: false, rate: 0, amount: 0 },
      finalAmount: baseAmount
    };
  });

  const setLoading = window.setLoading || ((loading) => {
    console.warn("⚠️ setLoading not implemented:", loading);
  });

  const uploadFileToGCS = window.uploadFileToGCS || ((file, type) => {
    console.warn("⚠️ uploadFileToGCS not implemented:", file, type);
    return Promise.reject(new Error("Upload function not implemented"));
  });

  // ✅ ADD MISSING HELPER FUNCTIONS
  const addInvoiceItem = window.addInvoiceItem || (() => {
    const currentItems = paymentData.invoice_items || [];
    const newItem = {
      description: '',
      quantity: 1,
      rate: 0,
      additional_info: ''
    };
    handlePaymentInputChange('invoice_items', [...currentItems, newItem]);
  });

  const removeInvoiceItem = window.removeInvoiceItem || ((index) => {
    const currentItems = paymentData.invoice_items || [];
    const newItems = currentItems.filter((_, i) => i !== index);
    handlePaymentInputChange('invoice_items', newItems);
  });

  if (!showPaymentForm || !currentLead) return null;

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => e.target === e.currentTarget && closeForm()
  },
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-5xl max-h-[95vh] overflow-y-auto' },
      React.createElement('div', { className: 'flex justify-between items-center mb-6' },
        React.createElement('h2', { className: 'text-xl font-bold text-gray-900 dark:text-white' }, 
  (paymentData.updating_existing_order ? '✏️ Update Payment: ' : '💰 Payment Details: ') + (currentLead.name)
),
        React.createElement('button', {
          onClick: closeForm,
          className: 'text-gray-400 hover:text-gray-600 text-2xl'
        }, '✕')
      ),
      React.createElement('form', { onSubmit: handlePaymentSubmit },

        // NEW: Enhanced Customer Classification Section
        React.createElement('div', { className: 'mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200' },
          React.createElement('h3', { className: 'text-lg font-semibold text-gray-800 mb-4' }, 
            '🌍 Customer & Event Classification'
          ),
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-4' },

            // Customer Type
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Customer Type *'
              ),
              React.createElement('select', {
                value: paymentData.customer_type || 'indian',
                onChange: (e) => handlePaymentInputChange('customer_type', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500',
                required: true
              },
                React.createElement('option', { value: 'indian' }, 'Indian'),
                React.createElement('option', { value: 'nri' }, 'NRI (Non-Resident Indian)'),
                React.createElement('option', { value: 'foreigner' }, 'Foreigner')
              )
            ),

            // Event Location
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Event Location *'
              ),
              React.createElement('select', {
                value: paymentData.event_location || 'india',
                onChange: (e) => handlePaymentInputChange('event_location', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500',
                required: true
              },
                React.createElement('option', { value: 'india' }, 'India'),
                React.createElement('option', { value: 'outside_india' }, 'Outside India')
              )
            ),

            // Payment Currency
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Payment Currency *'
              ),
              React.createElement('select', {
                value: paymentData.payment_currency || 'INR',
                onChange: (e) => handlePaymentInputChange('payment_currency', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500',
                required: true
              },
                React.createElement('option', { value: 'INR' }, 'INR (Indian Rupees)'),
                React.createElement('option', { value: 'USD' }, 'USD (US Dollars)'),
                React.createElement('option', { value: 'EUR' }, 'EUR (Euros)'),
                React.createElement('option', { value: 'GBP' }, 'GBP (British Pounds)')
              )
            )
          ),

          // Tax Applicability Info
          React.createElement('div', { className: 'mt-4 p-3 bg-white rounded border border-indigo-300' },
            React.createElement('h4', { className: 'text-sm font-medium text-indigo-800 mb-2' }, 
              '📊 Tax Applicability Preview'
            ),
            (() => {
              const invoiceTotal = paymentData.invoice_items?.reduce((sum, item) => 
                sum + ((item.quantity || 0) * (item.rate || 0)), 0
              ) || 0;

              const baseAmount = paymentData.type_of_sale === 'Service Fee' 
                ? (parseFloat(paymentData.service_fee_amount) || 0)
                : invoiceTotal;

              const calculation = calculateGSTAndTCS(baseAmount, paymentData);

              return React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4 text-sm' },
                React.createElement('div', null,
                  React.createElement('div', { className: 'flex items-center gap-2' },
                    React.createElement('span', null, 'GST:'),
                    React.createElement('span', { 
                      className: `px-2 py-1 rounded text-xs ${calculation.gst.applicable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`
                    }, calculation.gst.applicable ? `${calculation.gst.rate}% Applicable` : 'Not Applicable')
                  ),
                  React.createElement('div', { className: 'text-xs text-gray-600 mt-1' },
                    (() => {
                      const isIndian = paymentData.customer_type === 'indian';
                      const isCorporate = paymentData.category_of_sale === 'Corporate';
                      const isOutsideIndia = paymentData.event_location === 'outside_india';
                      const isINRPayment = paymentData.payment_currency === 'INR';
                      const isServiceFee = paymentData.type_of_sale === 'Service Fee';

                      if (isServiceFee) {
                        return 'Service Fee: Always 18% GST';
                      } else if (isIndian) {
                        return isCorporate ? 'Tour Package - Domestic B2B: 18%' : 'Tour Package - Domestic B2C: 5%';
                      } else {
                        if (!isOutsideIndia) {
                          return 'Tour Package - International in India: 5%';
                        } else {
                          return isINRPayment ? 'Tour Package - International outside India (INR): 5%' : 'Tour Package - International outside India (Foreign): No GST';
                        }
                      }
                    })()
                  )
                ),
                React.createElement('div', null,
                  React.createElement('div', { className: 'flex items-center gap-2' },
                    React.createElement('span', null, 'TCS:'),
                    React.createElement('span', { 
                      className: `px-2 py-1 rounded text-xs ${calculation.tcs.applicable ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`
                    }, calculation.tcs.applicable ? `${calculation.tcs.rate}% Applicable` : 'Not Applicable')
                  ),
                  React.createElement('div', { className: 'text-xs text-gray-600 mt-1' },
                    (() => {
                      const isIndian = paymentData.customer_type === 'indian';
                      const isOutsideIndia = paymentData.event_location === 'outside_india';
                      const isINRPayment = paymentData.payment_currency === 'INR';

                      if (!isOutsideIndia) {
                        return 'Event in India: No TCS';
                      } else {
                        if (isIndian) {
                          return 'Indian client, event outside India: TCS applies';
                        } else {
                          return isINRPayment ? 'International client, event outside India (INR): TCS applies' : 'International client, event outside India (Foreign): No TCS';
                        }
                      }
                    })()
                  )
                )
              );
            })()
          )
        ),

        // ADD THIS: TCS Rate Selection Dropdown as a SEPARATE section
        (() => {
          const invoiceTotal = paymentData.invoice_items?.reduce((sum, item) => 
            sum + ((item.quantity || 0) * (item.rate || 0)), 0
          ) || 0;
          
          const baseAmount = paymentData.type_of_sale === 'Service Fee' 
            ? (parseFloat(paymentData.service_fee_amount) || 0)
            : invoiceTotal;
            
          const calculation = calculateGSTAndTCS(baseAmount, paymentData);
          
          return calculation.tcs.applicable && React.createElement('div', { className: 'mt-4 p-3 bg-orange-50 rounded border border-orange-200' },
            React.createElement('h4', { className: 'text-sm font-medium text-orange-800 mb-3' }, 
              '🎯 TCS Rate Selection'
            ),
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                  'TCS Rate *'
                ),
                React.createElement('select', {
                  value: paymentData.tcs_rate || 5,
                  onChange: (e) => handlePaymentInputChange('tcs_rate', parseFloat(e.target.value)),
                  className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                },
                  React.createElement('option', { value: 5 }, '5% - Standard Rate'),
                  React.createElement('option', { value: 20 }, '20% - Higher Income Bracket')
                )
              ),
              React.createElement('div', { className: 'flex items-center p-3 bg-orange-100 rounded' },
                React.createElement('div', null,
                  React.createElement('div', { className: 'text-sm font-medium text-orange-800' }, 
                    `TCS Amount: ₹${((baseAmount * (paymentData.tcs_rate || 5)) / 100).toFixed(2)}`
                  ),
                  React.createElement('div', { className: 'text-xs text-orange-700 mt-1' }, 
                    'Rate depends on individual income level - select appropriate rate'
                  )
                )
              )
            )
          );
        })(),  

        // Payment Details Section (PRESERVED EXACTLY)
        React.createElement('div', { className: 'mb-6 p-4 bg-blue-50 rounded-lg' },
          React.createElement('h3', { className: 'text-lg font-semibold text-gray-800 mb-4' }, '💳 Payment Details'),
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Payment Method *'),
              React.createElement('select', {
                value: paymentData.payment_method || '',
                onChange: (e) => handlePaymentInputChange('payment_method', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                required: true
              },
                React.createElement('option', { value: '' }, 'Select Payment Method'),
                ['Bank Transfer', 'UPI', 'Credit Card', 'Debit Card', 'Cheque', 'Cash', 'Online Payment'].map(method =>
                  React.createElement('option', { key: method, value: method }, method)
                )
              )
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                paymentData.from_receivable ? 'Payment Amount (₹) *' : 'Advance Amount (₹) *'
              ),
              React.createElement('input', {
                type: 'number',
                value: paymentData.advance_amount || '',
                onChange: (e) => handlePaymentInputChange('advance_amount', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                required: true,
                placeholder: paymentData.from_receivable ? 'Enter payment amount for receivable' : 'Enter advance amount received'
              })
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Transaction ID *'),
              React.createElement('input', {
                type: 'text',
                value: paymentData.transaction_id || '',
                onChange: (e) => handlePaymentInputChange('transaction_id', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                required: true,
                placeholder: 'Enter transaction/reference ID'
              })
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Payment Date *'),
              React.createElement('input', {
                type: 'date',
                value: paymentData.payment_date || '',
                onChange: (e) => handlePaymentInputChange('payment_date', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                required: true
              })
            )
          )
        ),

        // GST and Legal Details Section
        React.createElement('div', { className: 'mb-6 p-4 bg-green-50 rounded-lg' },
          React.createElement('h3', { className: 'text-lg font-semibold text-gray-800 mb-4' }, '📋 GST & Legal Details'),
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'GSTIN'),
              React.createElement('input', {
                type: 'text',
                value: paymentData.gstin || '',
                onChange: (e) => handlePaymentInputChange('gstin', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                placeholder: 'Enter GST Number (if applicable)'
              })
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Legal Name *'),
              React.createElement('input', {
                type: 'text',
                value: paymentData.legal_name || currentLead.name,
                onChange: (e) => handlePaymentInputChange('legal_name', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                required: true,
                placeholder: 'Legal name for invoice'
              })
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Category of Sale *'),
              React.createElement('select', {
                value: paymentData.category_of_sale || 'Retail',
                onChange: (e) => handlePaymentInputChange('category_of_sale', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                required: true
              },
                React.createElement('option', { value: 'Retail' }, 'Retail (B2C)'),
                React.createElement('option', { value: 'Corporate' }, 'Corporate (B2B)')
              )
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Type of Sale *'),
              React.createElement('select', {
                value: paymentData.type_of_sale || 'Tour',
                onChange: (e) => handlePaymentInputChange('type_of_sale', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                required: true
              },
                React.createElement('option', { value: 'Tour' }, 'Tour Package'),
                React.createElement('option', { value: 'Service Fee' }, 'Service Fee'),
                React.createElement('option', { value: 'Other' }, 'Other Services')
              ),
              React.createElement('div', { className: 'text-xs text-gray-500 mt-1' },
                paymentData.type_of_sale === 'Service Fee' 
                  ? '⚠️ Service fees always attract 18% GST regardless of customer type or location'
                  : 'Tour packages have variable GST rates based on customer classification'
              )
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'GST Rate'),
              React.createElement('input', {
                type: 'text',
                value: (() => {
                  if (paymentData.type_of_sale === 'Service Fee') return '18% (Fixed)';
                  const calculation = calculateGSTAndTCS(0, paymentData);
                  return calculation.gst.applicable ? `${calculation.gst.rate}% (Dynamic)` : 'Not Applicable';
                })(),
                className: 'w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100',
                disabled: true
              })
            )
          ),
          React.createElement('div', { className: 'mt-4' },
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Registered Address *'),
            React.createElement('textarea', {
              value: paymentData.registered_address || '',
              onChange: (e) => handlePaymentInputChange('registered_address', e.target.value),
              className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
              rows: 2,
              required: true,
              placeholder: 'Complete registered address'
            })
          ),
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4 mt-4' },
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'State/Location *'),
              React.createElement('select', {
                value: paymentData.indian_state || 'Haryana',
                onChange: (e) => handlePaymentInputChange('indian_state', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                required: true
              },
                (window.INDIAN_STATES || ['Haryana', 'Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu']).map(state =>
                  React.createElement('option', { key: state, value: state }, state)
                ),
                React.createElement('option', { value: 'Outside India' }, 'Outside India')
              )
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'flex items-center mt-6' },
                React.createElement('input', {
                  type: 'checkbox',
                  checked: paymentData.is_outside_india || false,
                  onChange: (e) => handlePaymentInputChange('is_outside_india', e.target.checked),
                  className: 'mr-2'
                }),
                React.createElement('span', { className: 'text-sm font-medium text-gray-700' }, 'Customer is outside India')
              )
            )
          )
        ),

        // Document Upload Section
        React.createElement('div', { className: 'mb-6 p-4 bg-yellow-50 rounded-lg' },
          React.createElement('h3', { className: 'text-lg font-semibold text-gray-800 mb-4' }, '📎 Document Upload'),
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'GST Certificate'),
              React.createElement('input', {
                type: 'file',
                accept: '.pdf,.jpg,.jpeg,.png',
                onChange: async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      alert('File size must be less than 5MB');
                      e.target.value = '';
                      return;
                    }

                    setLoading(true);
                    try {
                      const uploadResult = await uploadFileToGCS(file, 'gst');
                      handlePaymentInputChange('gst_certificate', uploadResult);
                      alert('GST Certificate uploaded successfully!');
                    } catch (error) {
                      alert('Failed to upload GST Certificate: ' + error.message);
                      e.target.value = '';
                    }
                    setLoading(false);
                  }
                },
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                disabled: loading
              }),
              paymentData.gst_certificate && React.createElement('div', { className: 'mt-2' },
                React.createElement('span', { className: 'text-sm text-green-600' }, 
                  '✓ Uploaded: ' + paymentData.gst_certificate.originalName
                ),
                React.createElement('button', {
                  type: 'button',
                  className: 'ml-2 text-xs text-red-600 hover:underline',
                  onClick: () => {
                    handlePaymentInputChange('gst_certificate', null);
                    alert('GST Certificate removed');
                  }
                }, 'Remove')
              )
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'PAN Card'),
              React.createElement('input', {
                type: 'file',
                accept: '.pdf,.jpg,.jpeg,.png',
                onChange: async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    console.log('=== FILE UPLOAD START ===');
                    console.log('Uploading file:', file.name);
                    if (file.size > 5 * 1024 * 1024) {
                      alert('File size must be less than 5MB');
                      e.target.value = '';
                      return;
                    }

                    setLoading(true);
                    try {
                      const uploadResult = await uploadFileToGCS(file, 'pan');
                      console.log('Upload result:', uploadResult);
                      handlePaymentInputChange('pan_card', uploadResult);
                      console.log('Payment data after update:', paymentData);
                      alert('PAN Card uploaded successfully!');
                    } catch (error) {
                      alert('Failed to upload PAN Card: ' + error.message);
                      e.target.value = '';
                    }
                    setLoading(false);
                  }
                },
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                disabled: loading
              }),
              paymentData.pan_card && React.createElement('div', { className: 'mt-2' },
                React.createElement('span', { className: 'text-sm text-green-600' }, 
                  '✓ Uploaded: ' + paymentData.pan_card.originalName
                ),
                React.createElement('button', {
                  type: 'button',
                  className: 'ml-2 text-xs text-red-600 hover:underline',
                  onClick: () => {
                    handlePaymentInputChange('pan_card', null);
                    alert('PAN Card removed');
                  }
                }, 'Remove')
              )
            )
          )
        ),

        // ENHANCED: Invoice Items Section with Multi-Row Support
        React.createElement('div', { className: 'mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200' },
          React.createElement('div', { className: 'flex justify-between items-center mb-4' },
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-800' }, 
              '📋 Invoice Items'
            ),
            React.createElement('button', {
              type: 'button',
              onClick: addInvoiceItem,
              className: 'px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 flex items-center gap-1'
            }, 
              React.createElement('span', null, '+'),
              'Add Item'
            )
          ),

          // Invoice Items List
          React.createElement('div', { className: 'space-y-4' },
            (paymentData.invoice_items || []).map((item, index) =>
              React.createElement('div', { 
                key: index, 
                className: 'border border-gray-200 rounded-lg p-4 bg-white'
              },
                // Item Header with Remove Button
                React.createElement('div', { className: 'flex justify-between items-center mb-3' },
                  React.createElement('h4', { className: 'font-medium text-gray-700' }, 
                    `Item ${index + 1}`
                  ),
                  paymentData.invoice_items.length > 1 && 
                    React.createElement('button', {
                      type: 'button',
                      onClick: () => removeInvoiceItem(index),
                      className: 'text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded border border-red-300 hover:bg-red-50'
                    }, '🗑️ Remove')
                ),

                // Item Fields Grid
                React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-4' },

                  // Description Field (spans 2 columns)
                  React.createElement('div', { className: 'md:col-span-2' },
                    React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                      'Event/Service Description *'
                    ),
                    React.createElement('input', {
                      type: 'text',
                      value: item.description || '',
                      onChange: (e) => {
                        const newItems = JSON.parse(JSON.stringify(paymentData.invoice_items || []));
                        newItems[index].description = e.target.value;
                        handlePaymentInputChange('invoice_items', newItems);
                      },
                      className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500',
                      required: true,
                      placeholder: 'e.g., Match Tickets (RCB vs RR- 24th April, 2025)'
                    })
                  ),

                  // Quantity Field
                  React.createElement('div', null,
                    React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                      'Quantity *'
                    ),
                    React.createElement('input', {
                      type: 'number',
                      value: item.quantity || '',
                      onChange: (e) => {
                        const newItems = JSON.parse(JSON.stringify(paymentData.invoice_items || []));
                        newItems[index].quantity = parseFloat(e.target.value) || 0;
                        handlePaymentInputChange('invoice_items', newItems);
                      },
                      className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500',
                      required: true,
                      min: 0,
                      step: 1
                    })
                  ),

                  // Rate Field
                  React.createElement('div', null,
                    React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                      'Rate (₹) *'
                    ),
                    React.createElement('input', {
                      type: 'number',
                      value: item.rate || '',
                      onChange: (e) => {
                        const newItems = JSON.parse(JSON.stringify(paymentData.invoice_items || []));
                        newItems[index].rate = parseFloat(e.target.value) || 0;
                        handlePaymentInputChange('invoice_items', newItems);
                      },
                      className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500',
                      required: true,
                      min: 0,
                      step: 0.01
                    })
                  )
                ),

                // Additional Info Field (Full Width)
                React.createElement('div', { className: 'mt-3' },
                  React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                    'Additional Info (Optional)',
                    React.createElement('span', { className: 'text-xs text-gray-500 ml-2' }, 
                      'Will appear in brackets below event description on invoice'
                    )
                  ),
                  React.createElement('input', {
                    type: 'text',
                    value: item.additional_info || '',
                    onChange: (e) => {
                      const newItems = JSON.parse(JSON.stringify(paymentData.invoice_items || []));
                      newItems[index].additional_info = e.target.value;
                      handlePaymentInputChange('invoice_items', newItems);
                    },
                    className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500',
                    placeholder: 'e.g., Qatar Airways Rahul Dravid Platinum Lounge- VIP'
                  })
                ),

                // Item Total Display
                React.createElement('div', { className: 'mt-3 flex justify-end' },
                  React.createElement('div', { className: 'text-sm font-medium text-gray-700 bg-gray-100 px-3 py-2 rounded' },
                    'Item Total: ₹', ((item.quantity || 0) * (item.rate || 0)).toFixed(2)
                  )
                )
              )
            )
          ),

          // Invoice Summary
          React.createElement('div', { className: 'mt-4 p-3 bg-purple-100 rounded border-t-2 border-purple-500' },
            React.createElement('div', { className: 'flex justify-between text-lg font-semibold' },
              React.createElement('span', null, 'Invoice Subtotal:'),
              React.createElement('span', null, 
                '₹', (paymentData.invoice_items?.reduce((sum, item) => 
                  sum + ((item.quantity || 0) * (item.rate || 0)), 0
                ) || 0).toFixed(2)
              )
            )
          )
        ),

        // Service Fee Section
        paymentData.type_of_sale === 'Service Fee' && 
          React.createElement('div', { className: 'mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200' },
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-800 mb-4' }, 
              '💼 Service Fee Details'
            ),
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                  'Service Fee Amount (₹) *'
                ),
                React.createElement('input', {
                  type: 'number',
                  value: paymentData.service_fee_amount || '',
                  onChange: (e) => handlePaymentInputChange('service_fee_amount', e.target.value),
                  className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500',
                  required: paymentData.type_of_sale === 'Service Fee',
                  min: 0,
                  step: 0.01,
                  placeholder: 'Enter service fee amount'
                })
              ),
              React.createElement('div', { className: 'flex items-center p-3 bg-yellow-100 rounded border border-yellow-300' },
                React.createElement('div', null,
                  React.createElement('div', { className: 'text-sm font-medium text-yellow-800' }, 
                    '🏷️ GST Rate: 18% (Fixed)'
                  ),
                  React.createElement('div', { className: 'text-xs text-yellow-700 mt-1' }, 
                    'Service fees always attract 18% GST regardless of other settings'
                  )
                )
              )
            )
          ),

        // Tax Calculation Preview with TCS Support
        React.createElement('div', { className: 'mb-6 p-4 bg-gray-50 rounded-lg' },
          React.createElement('h3', { className: 'text-lg font-semibold text-gray-800 mb-4' }, '🧮 Enhanced Tax Calculation Preview'),
          (() => {
            const invoiceTotal = paymentData.invoice_items?.reduce((sum, item) => 
              sum + ((item.quantity || 0) * (item.rate || 0)), 0
            ) || 0;

            const baseAmount = paymentData.type_of_sale === 'Service Fee' 
              ? (parseFloat(paymentData.service_fee_amount) || 0)
              : invoiceTotal;

            // Enhanced calculation with TCS support
            const calculation = calculateGSTAndTCS(baseAmount, paymentData);
            const isIntraState = paymentData.indian_state === 'Haryana' && !paymentData.is_outside_india;
            const advanceAmount = parseFloat(paymentData.advance_amount) || 0;
            const isReceivablePayment = paymentData.from_receivable || paymentData.payment_post_service;

            return React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },

              // Left Column - Basic Amounts
              React.createElement('div', { className: 'space-y-3' },
                React.createElement('h4', { className: 'font-medium text-gray-700 border-b pb-2' }, 'Base Amounts'),
                React.createElement('div', { className: 'space-y-2 text-sm' },
                  React.createElement('div', { className: 'flex justify-between' },
                    React.createElement('span', null, 'Invoice Total:'),
                    React.createElement('span', { className: 'font-medium' }, 
                      paymentData.payment_currency || 'INR', ' ', invoiceTotal.toFixed(2)
                    )
                  ),
                  paymentData.type_of_sale === 'Service Fee' && 
                    React.createElement('div', { className: 'flex justify-between border-t pt-2' },
                      React.createElement('span', null, 'Service Fee:'),
                      React.createElement('span', { className: 'font-medium' }, 
                        paymentData.payment_currency || 'INR', ' ', (parseFloat(paymentData.service_fee_amount) || 0).toFixed(2)
                      )
                    ),
                  React.createElement('div', { className: 'flex justify-between font-medium border-t pt-2' },
                    React.createElement('span', null, 'Taxable Amount:'),
                    React.createElement('span', null, 
                      paymentData.payment_currency || 'INR', ' ', baseAmount.toFixed(2)
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
                          paymentData.payment_currency || 'INR', ' ', calculation.gst.cgst.toFixed(2)
                        )
                      ),
                      React.createElement('div', { key: 'sgst', className: 'flex justify-between' },
                        React.createElement('span', null, `SGST (${calculation.gst.rate/2}%):`),
                        React.createElement('span', { className: 'font-medium' }, 
                          paymentData.payment_currency || 'INR', ' ', calculation.gst.sgst.toFixed(2)
                        )
                      )
                    ] : React.createElement('div', { key: 'igst', className: 'flex justify-between' },
                      React.createElement('span', null, `IGST (${calculation.gst.rate}%):`),
                      React.createElement('span', { className: 'font-medium' }, 
                        paymentData.payment_currency || 'INR', ' ', calculation.gst.igst.toFixed(2)
                      )
                    )
                  ] : React.createElement('div', { key: 'no-gst', className: 'flex justify-between text-gray-500' },
                    React.createElement('span', null, 'GST:'),
                    React.createElement('span', null, 'Not Applicable')
                  ),

                  // TCS Section
                  calculation.tcs.applicable ? 
                    React.createElement('div', { className: 'flex justify-between text-yellow-700' },
                      React.createElement('span', null, `TCS (${calculation.tcs.rate}%):`),
                      React.createElement('span', { className: 'font-medium' }, 
                        paymentData.payment_currency || 'INR', ' ', calculation.tcs.amount.toFixed(2)
                      )
                    ) : React.createElement('div', { className: 'flex justify-between text-gray-500' },
                      React.createElement('span', null, 'TCS:'),
                      React.createElement('span', null, 'Not Applicable')
                    ),

                  // Final Amount
                  React.createElement('div', { className: 'flex justify-between border-t pt-2 font-semibold text-base text-green-700' },
                    React.createElement('span', null, 'Final Amount:'),
                    React.createElement('span', null, 
                      paymentData.payment_currency || 'INR', ' ', calculation.finalAmount.toFixed(2)
                    )
                  ),

                  // Payment Information
                  !isReceivablePayment && React.createElement('div', { className: 'flex justify-between border-t pt-2' },
                    React.createElement('span', { className: 'font-semibold' }, 'Advance Received:'),
                    React.createElement('span', { className: 'font-semibold text-blue-600' }, 
                      paymentData.payment_currency || 'INR', ' ', advanceAmount.toFixed(2)
                    )
                  ),
                  !isReceivablePayment && React.createElement('div', { className: 'flex justify-between' },
                    React.createElement('span', { className: 'font-bold' }, 'Balance Due:'),
                    React.createElement('span', { className: 'font-bold text-orange-600' }, 
                      paymentData.payment_currency || 'INR', ' ', (calculation.finalAmount - advanceAmount).toFixed(2)
                    )
                  ),
                  isReceivablePayment && React.createElement('div', { className: 'flex justify-between border-t pt-2' },
                    React.createElement('span', { className: 'font-bold' }, 'Payment Being Collected:'),
                    React.createElement('span', { className: 'font-bold text-green-600' }, 
                      paymentData.payment_currency || 'INR', ' ', advanceAmount.toFixed(2)
                    )
                  )
                )
              )
            );
          })(),
        ),

        // Additional Notes
        React.createElement('div', { className: 'mb-6' },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Additional Notes'),
          React.createElement('textarea', {
            value: paymentData.notes || '',
            onChange: (e) => handlePaymentInputChange('notes', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
            rows: 3,
            placeholder: 'Any additional payment details or notes'
          })
        ),

        // Submit Buttons
        React.createElement('div', { className: 'flex space-x-4 pt-4 border-t' },
          React.createElement('button', {
            type: 'button',
            onClick: closeForm,
            className: 'flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50'
          }, 'Cancel'),
          React.createElement('button', {
  type: 'submit',
  disabled: loading,
  className: 'flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50'
}, loading ? 'Processing...' : (paymentData.updating_existing_order ? 'Update Order' : 'Submit Payment & Create Order'))
        )
      )
    )
  );
};

// Wrapper function to maintain compatibility
window.renderPaymentForm = () => {
  return renderEnhancedPaymentForm();
};

console.log('✅ Payment Form component loaded successfully with window function references');
