// Create Proforma Invoice Form - Reusing Payment Form with modifications
window.openProformaInvoiceForm = (lead, existingOrder = null) => {
  console.log('📄 Opening Proforma Invoice Form for lead:', lead.name);
  
  // Set current lead context
  window.setCurrentLead(lead);
  window.setCurrentForm('proforma_invoice');
  
  // Initialize proforma data (similar to payment data)
  const initialProformaData = {
    // GST and Legal details
    gstin: existingOrder?.gstin || '',
    legal_name: existingOrder?.legal_name || lead.name,
    category_of_sale: existingOrder?.category_of_sale || 'Retail',
    type_of_sale: existingOrder?.type_of_sale || 'Tour',
    registered_address: existingOrder?.registered_address || '',
    indian_state: existingOrder?.indian_state || 'Haryana',
    is_outside_india: existingOrder?.is_outside_india || false,
    
    // Customer classification
    customer_type: existingOrder?.customer_type || 'indian',
    event_location: existingOrder?.event_location || 'domestic',
    payment_currency: existingOrder?.payment_currency || 'INR',
    
    // Documents
    gst_certificate: existingOrder?.gst_certificate || null,
    pan_card: existingOrder?.pan_card || null,
    
    // Invoice items
    invoice_items: existingOrder?.invoice_items || [{
      description: lead.lead_for_event || 'Travel Package',
      additional_info: '',
      quantity: lead.number_of_people || 1,
      rate: lead.last_quoted_price || 0
    }],
    
    // Service fee
    service_fee_amount: existingOrder?.service_fee_amount || 0,
    
    // Proforma specific fields
    expected_payment_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    payment_terms: existingOrder?.payment_terms || '50% advance, 50% before service',
    
    // Notes
    notes: existingOrder?.notes || '',
    
    // Hidden payment fields with dummy values
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'pending',
    transaction_id: 'PROFORMA-' + Date.now(),
    advance_amount: 0, // Will be calculated from invoice total
    
    // Flags
    is_proforma: true,
    from_receivable: false,
    payment_post_service: false
  };
  
  window.setPaymentData(initialProformaData);
  window.setShowPaymentForm(true);
};

// Modified render function for Proforma Invoice Form
window.renderProformaInvoiceForm = () => {
  const { showPaymentForm, paymentData, currentLead } = window.appState || {};
  
  if (!showPaymentForm || !currentLead || !paymentData?.is_proforma) {
    return null;
  }
  
  const handleInputChange = window.handlePaymentInputChange;
  const calculateGSTAndTCS = window.calculateGSTAndTCS;
  
  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',
    onClick: (e) => {
      if (e.target === e.currentTarget) window.closeForm();
    }
  },
    React.createElement('div', {
      className: 'bg-white rounded-lg w-full max-w-6xl max-h-[95vh] flex flex-col'
    },
      // Header
      React.createElement('div', {
        className: 'p-6 border-b flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg'
      },
        React.createElement('h2', { className: 'text-2xl font-bold' }, 
          '📅 Payment Post Service Details'
        ),
        React.createElement('button', {
          onClick: window.closeForm,
          className: 'text-white hover:text-gray-200'
        }, '✕')
      ),
      
      // Form Content
      React.createElement('div', { className: 'flex-1 overflow-y-auto p-6' },
        React.createElement('form', {
          onSubmit: (e) => handleProformaInvoiceSubmit(e),
          className: 'space-y-6'
        },
          // Client Info Section
          React.createElement('div', { className: 'bg-blue-50 p-4 rounded-lg mb-4' },
            React.createElement('h3', { className: 'font-semibold text-blue-900 mb-2' }, 
              `Client: ${currentLead.name}`
            ),
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-4 text-sm' },
              React.createElement('div', null,
                React.createElement('span', { className: 'text-gray-600' }, 'Email: '),
                React.createElement('span', { className: 'font-medium' }, currentLead.email)
              ),
              React.createElement('div', null,
                React.createElement('span', { className: 'text-gray-600' }, 'Phone: '),
                React.createElement('span', { className: 'font-medium' }, currentLead.phone)
              ),
              React.createElement('div', null,
                React.createElement('span', { className: 'text-gray-600' }, 'Event: '),
                React.createElement('span', { className: 'font-medium' }, currentLead.lead_for_event)
              )
            )
          ),
          
          // Proforma Specific Fields
          React.createElement('div', { className: 'mb-6 p-4 bg-green-50 rounded-lg' },
            React.createElement('h3', { className: 'text-lg font-semibold text-green-800 mb-4' }, 
              '📅 Proforma Invoice Details'
            ),
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                  'Expected Payment Date *'
                ),
                React.createElement('input', {
                  type: 'date',
                  value: paymentData.expected_payment_date || '',
                  onChange: (e) => handleInputChange('expected_payment_date', e.target.value),
                  className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500',
                  required: true,
                  min: new Date().toISOString().split('T')[0]
                })
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                  'Payment Terms *'
                ),
                React.createElement('textarea', {
                  value: paymentData.payment_terms || '',
                  onChange: (e) => handleInputChange('payment_terms', e.target.value),
                  className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500',
                  required: true,
                  rows: 2,
                  placeholder: 'e.g., 50% advance, 50% before service delivery'
                })
              )
            )
          ),
          
          // Reuse all GST/Legal sections from payment form
          // GST Details Section (identical to payment form)
          React.createElement('div', { className: 'mb-6 p-4 bg-yellow-50 rounded-lg' },
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-800 mb-4' }, 
              '🏢 GST & Legal Details'
            ),
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                  'GSTIN'
                ),
                React.createElement('input', {
                  type: 'text',
                  value: paymentData.gstin || '',
                  onChange: (e) => handleInputChange('gstin', e.target.value),
                  className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500',
                  placeholder: '22AAAAA0000A1Z5',
                  pattern: '[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}',
                  title: 'Enter valid GSTIN'
                })
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                  'Legal Name *'
                ),
                React.createElement('input', {
                  type: 'text',
                  value: paymentData.legal_name || '',
                  onChange: (e) => handleInputChange('legal_name', e.target.value),
                  className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500',
                  required: true
                })
              )
            ),
            // Category and Type of Sale
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4 mt-4' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                  'Category of Sale *'
                ),
                React.createElement('select', {
                  value: paymentData.category_of_sale || 'Retail',
                  onChange: (e) => handleInputChange('category_of_sale', e.target.value),
                  className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500',
                  required: true
                },
                  React.createElement('option', { value: 'Retail' }, 'Retail (B2C)'),
                  React.createElement('option', { value: 'Corporate' }, 'Corporate (B2B)')
                )
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                  'Type of Sale *'
                ),
                React.createElement('select', {
                  value: paymentData.type_of_sale || 'Tour',
                  onChange: (e) => handleInputChange('type_of_sale', e.target.value),
                  className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500',
                  required: true
                },
                  React.createElement('option', { value: 'Tour' }, 'Tour'),
                  React.createElement('option', { value: 'Hotel' }, 'Hotel'),
                  React.createElement('option', { value: 'Travel Tickets' }, 'Travel Tickets'),
                  React.createElement('option', { value: 'Service Fee' }, 'Service Fee')
                )
              )
            ),
            // Address and State
            React.createElement('div', { className: 'mt-4' },
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Registered Address *'
              ),
              React.createElement('textarea', {
                value: paymentData.registered_address || '',
                onChange: (e) => handleInputChange('registered_address', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500',
                required: true,
                rows: 2
              })
            ),
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4 mt-4' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                  'State *'
                ),
                React.createElement('select', {
                  value: paymentData.indian_state || 'Haryana',
                  onChange: (e) => handleInputChange('indian_state', e.target.value),
                  className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500',
                  required: true,
                  disabled: paymentData.is_outside_india
                },
                  window.indianStates?.map(state => 
                    React.createElement('option', { key: state, value: state }, state)
                  )
                )
              ),
              React.createElement('div', { className: 'flex items-center mt-6' },
                React.createElement('input', {
                  type: 'checkbox',
                  checked: paymentData.is_outside_india || false,
                  onChange: (e) => handleInputChange('is_outside_india', e.target.checked),
                  className: 'mr-2'
                }),
                React.createElement('label', { className: 'text-sm font-medium text-gray-700' }, 
                  'Customer is outside India'
                )
              )
            )
          ),
          
          // Invoice Items Section (identical to payment form)
          React.createElement('div', { className: 'mb-6' },
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-800 mb-4' }, 
              '📋 Invoice Items'
            ),
            // Render invoice items table
            window.renderInvoiceItemsTable && window.renderInvoiceItemsTable()
          ),
          
          // Service Fee Section (if applicable)
          paymentData.type_of_sale === 'Service Fee' && window.renderServiceFeeSection && window.renderServiceFeeSection(),
          
          // Tax Classification Section
          window.renderTaxClassificationSection && window.renderTaxClassificationSection(),
          
          // Tax Calculation Preview
          window.renderEnhancedGSTCalculationPreview && window.renderEnhancedGSTCalculationPreview(),
          
          // Notes Section
          React.createElement('div', { className: 'mb-6' },
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
              'Additional Notes'
            ),
            React.createElement('textarea', {
              value: paymentData.notes || '',
              onChange: (e) => handleInputChange('notes', e.target.value),
              className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500',
              rows: 3,
              placeholder: 'Any additional notes for the proforma invoice...'
            })
          ),
          
          // Submit Buttons
          React.createElement('div', { className: 'flex justify-end space-x-3 pt-4 border-t' },
            React.createElement('button', {
              type: 'button',
              onClick: window.closeForm,
              className: 'px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50'
            }, 'Cancel'),
            React.createElement('button', {
              type: 'submit',
              className: 'px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center',
              disabled: window.loading
            },
              window.loading ? 'Generating...' : '📄 Generate Proforma Invoice'
            )
          )
        )
      )
    )
  );
};

window.handleProformaInvoiceSubmit = async (e) => {
  e.preventDefault();
  
  if (!window.hasPermission('orders', 'create')) {
    alert('You do not have permission to create orders');
    return;
  }
  
  window.setLoading(true);
  
  try {
    // Calculate invoice total and taxes (keep existing calculation code)
    const invoiceTotal = window.paymentData.invoice_items?.reduce((sum, item) => 
      sum + ((item.quantity || 0) * (item.rate || 0)), 0
    ) || 0;
    
    const baseAmount = window.paymentData.type_of_sale === 'Service Fee' 
      ? (parseFloat(window.paymentData.service_fee_amount) || 0)
      : invoiceTotal;
    
    const calculation = window.calculateGSTAndTCS(baseAmount, window.paymentData);
    
    // Generate order number as PST (Payment Service Transaction)
    const orderNumber = 'PST-' + Date.now();
    
    // Create order with payment_post_service type
    const proformaOrder = {
      order_number: orderNumber,
      lead_id: window.currentLead.id,
      client_name: window.paymentData.legal_name || window.currentLead.name,
      client_email: window.currentLead.email,
      client_phone: window.currentLead.phone,
      
      // All your existing GST and calculation fields...
      gstin: window.paymentData.gstin,
      legal_name: window.paymentData.legal_name,
      category_of_sale: window.paymentData.category_of_sale,
      type_of_sale: window.paymentData.type_of_sale,
      registered_address: window.paymentData.registered_address,
      indian_state: window.paymentData.indian_state,
      is_outside_india: window.paymentData.is_outside_india,
      
      // Tax classification
      customer_type: window.paymentData.customer_type,
      event_location: window.paymentData.event_location,
      payment_currency: window.paymentData.payment_currency,
      
      // Invoice items and calculations
      invoice_items: window.paymentData.invoice_items,
      base_amount: baseAmount,
      gst_calculation: calculation.gst,
      tcs_calculation: calculation.tcs,
      total_tax: calculation.gst.amount + calculation.tcs.amount,
      final_amount: calculation.finalAmount,
      
      // Payment post service specific
      order_type: 'payment_post_service',
      invoice_type: 'proforma',
      expected_payment_date: window.paymentData.expected_payment_date,
      payment_terms: window.paymentData.payment_terms,
      
      // Order status
      status: 'pending_approval',
      payment_status: 'pending',
      requires_gst_invoice: false,
      
      // Metadata
      created_date: new Date().toISOString(),
      created_by: window.user.name,
      notes: window.paymentData.notes,
      description: 'Post-service payment for: ' + window.currentLead.name
    };
    
    // Save order via API
    const response = await window.apiCall('/orders', {
      method: 'POST',
      body: JSON.stringify(proformaOrder)
    });
    
    const savedOrder = response.data || response;
    
    // Update local state
    window.setOrders(prev => [...prev, savedOrder]);
    
    // DON'T open invoice preview immediately - just show success
    alert('✅ Payment Post Service order created successfully! Awaiting approval.');
    
    // Update lead status to payment_post_service
    await window.updateLeadStatus(window.currentLead.id, 'payment_post_service');
    
    window.closeForm();
    
  } catch (error) {
    console.error('Error creating payment post service order:', error);
    alert('Failed to create order: ' + error.message);
  } finally {
    window.setLoading(false);
  }
};

// Helper to check if we should show proforma form
window.shouldShowProformaForm = () => {
  const { showPaymentForm, paymentData, currentForm } = window.appState || {};
  return showPaymentForm && (paymentData?.is_proforma || currentForm === 'proforma_invoice');
};

