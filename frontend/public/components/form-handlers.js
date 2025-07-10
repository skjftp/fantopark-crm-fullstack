// ADD THESE MISSING FUNCTIONS TO THE END OF YOUR form-handlers.js FILE:

// ✅ PAYMENT POST SERVICE INPUT CHANGE HANDLER
window.handlePaymentPostServiceInputChange = function(field, value) {
  console.log("📝 Payment Post Service Input Change:", field, value);
  window.setPaymentPostServiceData(prev => ({ ...prev, [field]: value }));
};

// ✅ PAYMENT POST SERVICE FORM SUBMISSION HANDLER
window.handlePaymentPostServiceSubmit = async function(e) {
  e.preventDefault();

  if (!window.hasPermission('leads', 'write')) {
    alert('You do not have permission to manage payment post service');
    return;
  }

  window.setLoading(true);

  try {
    console.log('🔍 Payment Post Service Data:', window.paymentPostServiceData);
    console.log('🔍 Current Lead:', window.currentLead);

    // Update lead status via API
    const leadResponse = await window.apiCall('/leads/' + window.currentLead.id, {
      method: 'PUT',
      body: JSON.stringify({
        ...window.currentLead,
        status: 'payment_post_service',
        payment_post_service_details: window.paymentPostServiceData,
        payment_post_service_date: new Date().toISOString()
      })
    });

    // Update local state
    window.setLeads(prev => 
      prev.map(lead => 
        lead.id === window.currentLead.id ? leadResponse.data : lead
      )
    );

    // Create order with all required fields
    const newOrder = {
      order_number: 'ORD-' + Date.now(),
      lead_id: window.currentLead.id,
      client_name: window.currentLead.name,
      client_email: window.currentLead.email,
      client_phone: window.currentLead.phone,

      // Required order fields for backend
      event_name: window.currentLead?.lead_for_event || 'Post Service Payment',
      event_date: window.paymentPostServiceData.service_date || new Date().toISOString().split('T')[0],
      tickets_allocated: 1,
      ticket_category: 'Post Service',
      price_per_ticket: parseFloat(window.paymentPostServiceData.expected_amount) || 0,
      total_amount: parseFloat(window.paymentPostServiceData.expected_amount) || 0,

      // Payment post service specific fields
      expected_amount: parseFloat(window.paymentPostServiceData.expected_amount),
      expected_payment_date: window.paymentPostServiceData.expected_payment_date,
      service_description: window.paymentPostServiceData.service_details,
      notes: window.paymentPostServiceData.notes,
      payment_terms: window.paymentPostServiceData.payment_terms,

      // Order metadata
      order_type: 'payment_post_service',
      payment_status: 'pending',
      status: 'pending_approval',
      requires_gst_invoice: true,
      created_date: new Date().toISOString(),
      created_by: window.user.name,
      assigned_to: ''  // Will be assigned later
    };

    // Create order in backend
    try {
      console.log('Creating payment post service order:', JSON.stringify(newOrder, null, 2));
      const orderResponse = await window.apiCall('/orders', {
        method: 'POST',
        body: JSON.stringify(newOrder)
      });
      console.log('Order created in backend (Post Service):', orderResponse);

      // Use the response data or fallback to newOrder
      const finalOrder = orderResponse.data || orderResponse || newOrder;
      if (!finalOrder.id && newOrder.order_number) {
        finalOrder.id = newOrder.order_number;
      }

      window.setOrders(prev => [...prev, finalOrder]);

      window.setLoading(false);
      alert('Payment Post Service order created successfully! Awaiting approval.');
      window.closeForm();
    } catch (orderError) {
      console.error('Failed to create order in backend:', orderError);

      // Add to local state with the order_number as id
      newOrder.id = newOrder.order_number;
      window.setOrders(prev => [...prev, newOrder]);

      window.setLoading(false);
      alert('Warning: Order may not have been saved to server. Please check orders page.');
      window.closeForm();
    }
  } catch (error) {
    window.setLoading(false);
    alert('Failed to process payment post service. Please try again.');
    console.error('Payment post service error:', error);
  }
};

// ✅ PAYMENT INPUT CHANGE HANDLER
window.handlePaymentInputChange = function(field, value) {
  console.log("📝 Payment Input Change:", field, value);
  window.setPaymentData(prev => ({ ...prev, [field]: value }));
};

// ✅ PAYMENT FORM SUBMISSION HANDLER
window.handlePaymentSubmit = async function(e) {
  e.preventDefault();

  if (!window.hasPermission('orders', 'create')) {
    alert('You do not have permission to create orders');
    return;
  }

  window.setLoading(true);

  try {
    console.log('🔍 Payment Data:', window.paymentData);
    console.log('🔍 Current Lead:', window.currentLead);

    // Calculate GST and TCS based on payment data
    const invoiceTotal = window.paymentData.invoice_items?.reduce((sum, item) => 
      sum + ((item.quantity || 0) * (item.rate || 0)), 0
    ) || 0;

    const baseAmount = window.paymentData.type_of_sale === 'Service Fee' 
      ? (parseFloat(window.paymentData.service_fee_amount) || 0)
      : invoiceTotal;

    const calculation = window.calculateGSTAndTCS(baseAmount, window.paymentData);

    // Create comprehensive order object
    const newOrder = {
      order_number: 'ORD-' + Date.now(),
      lead_id: window.currentLead.id,
      client_name: window.paymentData.legal_name || window.currentLead.name,
      client_email: window.currentLead.email,
      client_phone: window.currentLead.phone,

      // Enhanced payment fields
      payment_method: window.paymentData.payment_method,
      transaction_id: window.paymentData.transaction_id,
      payment_date: window.paymentData.payment_date,
      advance_amount: parseFloat(window.paymentData.advance_amount) || 0,

      // GST and Legal details
      gstin: window.paymentData.gstin,
      legal_name: window.paymentData.legal_name,
      category_of_sale: window.paymentData.category_of_sale,
      type_of_sale: window.paymentData.type_of_sale,
      registered_address: window.paymentData.registered_address,
      indian_state: window.paymentData.indian_state,
      is_outside_india: window.paymentData.is_outside_india,

      // Enhanced tax classification
      customer_type: window.paymentData.customer_type,
      event_location: window.paymentData.event_location,
      payment_currency: window.paymentData.payment_currency,

      // Invoice items and calculations
      invoice_items: window.paymentData.invoice_items || [],
      base_amount: baseAmount,
      gst_calculation: calculation.gst,
      tcs_calculation: calculation.tcs,
      total_tax: calculation.gst.amount + calculation.tcs.amount,
      final_amount: calculation.finalAmount,

      // Service fee specific
      service_fee_amount: window.paymentData.service_fee_amount ? parseFloat(window.paymentData.service_fee_amount) : null,

      // Documents
      gst_certificate: window.paymentData.gst_certificate,
      pan_card: window.paymentData.pan_card,

      // Order metadata
      status: 'pending_approval',
      requires_gst_invoice: true,
      payment_status: window.paymentData.from_receivable ? 'completed' : 'partial',
      created_date: new Date().toISOString(),
      created_by: window.user.name,
      notes: window.paymentData.notes
    };

    // Create order via API
    const orderResponse = await window.apiCall('/orders', {
      method: 'POST',
      body: JSON.stringify(newOrder)
    });

    console.log('Order created successfully:', orderResponse);

    // Update local orders state
    const finalOrder = orderResponse.data || orderResponse || newOrder;
    if (!finalOrder.id && newOrder.order_number) {
      finalOrder.id = newOrder.order_number;
    }
    window.setOrders(prev => [...prev, finalOrder]);

    // Update lead status to payment_received
    const leadUpdateResponse = await window.apiCall('/leads/' + window.currentLead.id, {
      method: 'PUT',
      body: JSON.stringify({
        ...window.currentLead,
        status: window.paymentData.from_receivable ? 'payment_received' : 'payment_partial',
        payment_date: window.paymentData.payment_date,
        advance_amount: parseFloat(window.paymentData.advance_amount) || 0,
        final_amount: calculation.finalAmount
      })
    });

    // Update local leads state
    window.setLeads(prev => 
      prev.map(lead => 
        lead.id === window.currentLead.id ? leadUpdateResponse.data : lead
      )
    );

    alert('Payment processed successfully! Order created and awaiting approval.');
    window.closeForm();

  } catch (error) {
    console.error('Payment processing error:', error);
    alert('Failed to process payment: ' + error.message);
  } finally {
    window.setLoading(false);
  }
};

console.log("🔧 Payment handler functions added to form-handlers.js");
