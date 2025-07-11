// Form Handlers System Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Handles all major form submissions including leads, inventory, orders, and allocations

// ✅ MAIN UNIVERSAL FORM SUBMISSION HANDLER - CLEANED AND FIXED
window.handleFormSubmit = async function(e) {
  console.log("🔍 Form submission started - showAddForm:", window.appState.showAddForm, "showEditForm:", window.appState.showEditForm);
  e.preventDefault();
  window.setLoading(true);

  try {
    // ✅ EDIT LEAD PATH (WORKING)
    if (window.appState.showEditForm) {
      console.log("📝 Processing Edit Lead with data:", window.formData);
      
      const response = await window.apiCall('/leads/' + window.currentLead.id, {
        method: 'PUT',
        body: JSON.stringify(window.formData)
      });
      
      window.setLeads(prev => prev.map(lead => 
        lead.id === window.currentLead.id ? response.data : lead
      ));

      // ✅ Refresh assignment rules after lead update
      if (window.refreshAssignmentRules && typeof window.refreshAssignmentRules === 'function') {
        try {
          await window.refreshAssignmentRules();
          console.log('✅ Assignment rules refreshed after lead update');
        } catch (refreshError) {
          console.log('⚠️ Assignment rules refresh failed (non-critical):', refreshError);
        }
      }

      alert('Lead updated successfully!');
    }
    // ✅ CREATE NEW LEAD PATH (FIXED)
    else if (window.appState.showAddForm) {
      console.log("📝 Processing Create Lead with data:", window.formData);
      
      const leadResponse = await window.apiCall("/leads", {
        method: "POST",
        body: JSON.stringify({
          ...window.formData,
          status: "unassigned",
          created_by: window.user.name,
          created_date: new Date().toISOString()
        })
      });
      
      window.setLeads(prev => [...prev, leadResponse.data]);
      alert("Lead created successfully!");
    }
    // ✅ EDIT INVENTORY PATH
    else if (window.showEditInventoryForm) {
      console.log('=== FRONTEND INVENTORY UPDATE DEBUG ===');
      console.log('Inventory ID being updated:', window.currentInventory.id);
      console.log('Complete form data being sent:', window.formData);

      const response = await window.apiCall('/inventory/' + window.currentInventory.id, {
        method: 'PUT',
        body: JSON.stringify(window.formData)
      });

      window.setInventory(prev => prev.map(item => 
        item.id === window.currentInventory.id ? response.data : item
      ));
      alert('Inventory updated successfully!');
    }
    // ✅ CREATE NEW ITEMS BY TYPE
    else if (window.currentForm) {
      console.log("📝 Processing new item creation for type:", window.currentForm);
      
      switch (window.currentForm) {
        case 'inventory':
          console.log("Creating inventory with data:", JSON.stringify(window.formData, null, 2));
          
          const invResponse = await window.apiCall('/inventory', {
            method: 'POST',
            body: JSON.stringify({
              ...window.formData,
              created_by: window.user.name,
              created_date: new Date().toISOString()
            })
          });
          
          console.log("Inventory API Response:", invResponse);
          window.setInventory(prev => [...prev, invResponse.data]);
          alert('Inventory added successfully!');

          // Create payable entry if payment is pending or partial
          if (window.formData.paymentStatus === 'pending' || window.formData.paymentStatus === 'partial') {
            try {
              const pendingAmount = parseFloat(window.formData.totalPurchaseAmount || 0) - parseFloat(window.formData.amountPaid || 0);

              if (pendingAmount > 0) {
                const payableData = {
                  supplierName: window.formData.supplierName || 'Unknown Supplier',
                  invoiceNumber: window.formData.supplierInvoice || 'INV-' + Date.now(),
                  amount: pendingAmount,
                  dueDate: window.formData.paymentDueDate || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
                  description: 'Inventory purchase: ' + (window.formData.event_name || 'Event') + ' - ' + (window.formData.category_of_ticket || 'Tickets'),
                  inventoryId: invResponse.data?.id || invResponse.id,
                  status: 'pending'
                };

                const payableResponse = await window.apiCall('/finance/payables', {
                  method: 'POST',
                  body: JSON.stringify(payableData)
                });

                console.log('Payable created:', payableResponse);
              }
            } catch (payableError) {
              console.error('Failed to create payable:', payableError);
              // Don't show error to user - payable creation is secondary
            }
          }
          break;

        case 'order':
          console.log('Creating order with data:', JSON.stringify(window.formData, null, 2));
          
          const orderResponse = await window.apiCall('/orders', {
            method: 'POST',
            body: JSON.stringify({
              ...window.formData,
              order_number: 'ORD-' + Date.now(),
              status: 'pending_approval',
              requires_gst_invoice: true,
              total_amount: window.formData.tickets_allocated * window.formData.price_per_ticket,
              created_by: window.user.name,
              created_date: new Date().toISOString()
            })
          });
          
          window.setOrders(prev => [...prev, orderResponse.data]);
          alert('Order created successfully!');
          break;

        default:
          console.warn('Unknown form type:', window.currentForm);
          alert('Unknown form type: ' + window.currentForm);
          break;
      }
    }
    else {
      console.warn('No valid form state detected');
      alert('No valid form state detected');
    }

    // ✅ Close form after successful submission
    window.closeForm();
  } catch (error) {
    console.error('Form submission error:', error);
    alert('Operation failed: ' + error.message);
  } finally {
    window.setLoading(false);
  }
};

// ✅ ENHANCED ORDER EDITING SUBMISSION HANDLER
window.handleEditOrderSubmit = async function(e) {
  e.preventDefault();
  window.setLoading(true);

  try {
    const updateData = {
      ...window.orderEditData,
      updated_date: new Date().toISOString(),
      updated_by: window.user.name
    };

    // Clear rejection fields if status is not rejected
    if (window.orderEditData.status !== 'rejected') {
      updateData.rejection_reason = null;
      updateData.rejected_date = null;
      updateData.rejected_by = null;
    } else if (window.orderEditData.status === 'rejected' && window.orderEditData.rejection_reason) {
      updateData.rejected_date = new Date().toISOString();
      updateData.rejected_by = window.user.name;
    }

    const response = await window.apiCall('/orders/' + window.currentOrderForEdit.id, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });

    window.setOrders(prev => prev.map(order => 
      order.id === window.currentOrderForEdit.id 
        ? { ...order, ...updateData }
        : order
    ));

    window.setShowEditOrderForm(false);
    alert('Order updated successfully!');
  } catch (error) {
    console.error('Error updating order:', error);
    alert('Failed to update order');
  } finally {
    window.setLoading(false);
  }
};

// ✅ INVENTORY ALLOCATION HANDLER WITH PERMISSION CHECK
window.handleAllocation = async function(e) {
  e.preventDefault();
  if (!window.hasPermission('inventory', 'allocate')) {
    alert('You do not have permission to allocate inventory');
    return;
  }

  window.setLoading(true);

  try {
    const selectedLead = window.leads.find(lead => lead.id === window.allocationData.lead_id);

    if (!selectedLead) {
      throw new Error('Lead not found');
    }

    // Validate lead status
    const isConvertedOrLater = (status) => {
      const postConvertedStages = ['converted', 'payment', 'payment_post_service', 'payment_received'];
      return postConvertedStages.includes(status);
    };

    if (!isConvertedOrLater(selectedLead.status)) {
      throw new Error('Lead must be in converted status or later to allocate inventory');
    }

    if (window.allocationData.tickets_allocated > window.currentInventory.available_tickets) {
      throw new Error('Not enough tickets available');
    }

    const response = await window.apiCall(`/inventory/${window.currentInventory.id}/allocate`, {
      method: 'POST',
      body: JSON.stringify({
        lead_id: window.allocationData.lead_id,
        tickets_allocated: parseInt(window.allocationData.tickets_allocated),
        allocation_date: window.allocationData.allocation_date,
        notes: window.allocationData.notes
      })
    });

    if (response.error) {
      throw new Error(response.error);
    }

    window.setInventory(prev => 
      prev.map(item => 
        item.id === window.currentInventory.id 
          ? { ...item, available_tickets: response.remaining_tickets }
          : item
      )
    );

    window.setShowAllocationForm(false);
    alert('Inventory allocated successfully!');

  } catch (error) {
    console.error('Allocation error:', error);
    alert('Error: ' + error.message);
  } finally {
    window.setLoading(false);
  }
};

// ✅ ASSIGNMENT HANDLER WITH PERMISSION CHECK
window.handleAssignLead = async function(e) {
  e.preventDefault();

  console.log('\n🔍 === ASSIGNMENT DEBUGGING START ===');
  console.log('1. Form Data:', window.formData);
  console.log('3. Current dropdown value (assigned_to):', window.formData.assigned_to);

  if (!window.hasPermission('leads', 'assign')) {
    alert('You do not have permission to assign leads');
    return;
  }

  window.setLoading(true);

  try {
    if (window.formData.assigned_to) {
      if (window.formData.assigned_to.includes('@')) {
        console.log('✅ Value contains @ - appears to be an email');
      } else {
        console.log('⚠️ Value does not contain @ - may be a name');
      }
    }

    const response = await window.apiCall(`/leads/${window.currentLead.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        assigned_to: window.formData.assigned_to,
        status: 'assigned'
      })
    });

    window.setLeads(prev => prev.map(lead => 
      lead.id === window.currentLead.id 
        ? { ...lead, assigned_to: window.formData.assigned_to, status: 'assigned' }
        : lead
    ));

    alert('Lead assigned successfully!');
    window.closeForm();
  } catch (error) {
    console.error('Assignment error:', error);
    alert('Failed to assign lead: ' + error.message);
  } finally {
    window.setLoading(false);
  }
};

// ✅ PAYMENT POST SERVICE HANDLER
window.handlePaymentPostService = async function(lead) {
  if (!window.hasPermission('orders', 'create')) {
    alert('You do not have permission to create orders');
    return;
  }

  window.setLoading(true);

  try {
    const newOrder = {
      order_number: 'PST-' + Date.now(),
      client_name: lead.name,
      client_email: lead.email,
      client_phone: lead.phone,
      lead_id: lead.id,
      service_date: new Date().toISOString().split('T')[0],
      description: 'Post-service payment for: ' + lead.name,
      status: 'pending_approval',
      requires_gst_invoice: true,
      total_amount: lead.potential_value || 0,
      created_date: new Date().toISOString(),
      created_by: window.user.name,
      assigned_to: ''
    };

    try {
      console.log('Creating payment post service order:', JSON.stringify(newOrder, null, 2));
      const orderResponse = await window.apiCall('/orders', {
        method: 'POST',
        body: JSON.stringify(newOrder)
      });

      const finalOrder = orderResponse.data || orderResponse || newOrder;
      if (!finalOrder.id && newOrder.order_number) {
        finalOrder.id = newOrder.order_number;
      }

      window.setOrders(prev => [...prev, finalOrder]);
      alert('Payment Post Service order created successfully! Awaiting approval.');
      window.closeForm();
    } catch (orderError) {
      console.error('Failed to create order in backend:', orderError);
      newOrder.id = newOrder.order_number;
      window.setOrders(prev => [...prev, newOrder]);
      alert('Warning: Order may not have been saved to server. Please check orders page.');
      window.closeForm();
    }
  } catch (error) {
    alert('Failed to process payment post service. Please try again.');
    console.error('Payment post service error:', error);
  } finally {
    window.setLoading(false);
  }
};

// ✅ DELIVERY SUBMISSION HANDLER
window.handleDeliverySubmit = async function(e) {
  e.preventDefault();
  if (!window.hasPermission('delivery', 'write')) {
    alert('You do not have permission to manage deliveries');
    return;
  }

  window.setLoading(true);

  try {
    await window.apiCall('/deliveries/' + window.currentDelivery.id, {
      method: 'PUT',
      body: JSON.stringify({
        ...window.currentDelivery,
        ...window.deliveryFormData,
        status: 'scheduled',
        scheduled_date: new Date().toISOString()
      })
    });

    window.setDeliveries(prev => 
      prev.map(delivery => 
        delivery.id === window.currentDelivery.id 
          ? { 
              ...delivery, 
              ...window.deliveryFormData,
              status: 'scheduled',
              scheduled_date: new Date().toISOString().split('T')[0]
            } 
          : delivery
      )
    );

    alert('Delivery scheduled successfully!');
    window.closeForm();
  } catch (error) {
    alert('Failed to schedule delivery. Please try again.');
  } finally {
    window.setLoading(false);
  }
};

// ✅ USER FORM SUBMISSION HANDLER
window.handleUserSubmit = async function(e) {
  e.preventDefault();
  window.setLoading(true);

  try {
    const endpoint = window.editingUser ? '/users/' + window.editingUser.id : '/users';
    const method = window.editingUser ? 'PUT' : 'POST';

    const response = await window.apiCall(endpoint, {
      method: method,
      body: JSON.stringify(window.userFormData)
    });

    if (response.error) {
      throw new Error(response.error);
    }

    console.log(window.editingUser ? 'User updated successfully' : 'User created successfully');
    window.fetchUsers();

    window.setShowUserForm(false);
    window.setEditingUser(null);
    window.setUserFormData({
      name: '',
      email: '',
      password: '',
      role: 'viewer',
      department: '',
      payment_status: 'paid'
    });
  } catch (error) {
    console.error('Error saving user:', error);
    alert(error.message || 'Failed to save user');
  } finally {
    window.setLoading(false);
  }
};

// ✅ FIXED ORDER APPROVAL FUNCTION - WITH API CALLS FOR BOTH APPROVE AND REJECT
window.handleOrderApproval = async function(orderId, action, notes = '') {
  console.log(`🔄 handleOrderApproval: ${action} order ${orderId}`);

  if (!window.hasPermission('orders', 'approve')) {
    alert('You do not have permission to approve/reject orders');
    return;
  }

  if (!confirm(`Are you sure you want to ${action} this order?`)) {
    return;
  }

  window.setLoading(true);

  try {
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    // Get current order for context
    const currentOrder = window.orders.find(order => order.id === orderId);
    if (!currentOrder) {
      throw new Error('Order not found');
    }

    // Prepare update data
    const updateData = {
      status: newStatus,
      approved_by: window.user.name || window.user.email,
      approval_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };

    // Add rejection-specific fields
    if (action === 'reject') {
      updateData.rejected_by = window.user.name || window.user.email;
      updateData.rejected_date = new Date().toISOString();
      updateData.rejection_reason = notes || 'No reason provided';
    }

    console.log('🔄 Sending API request to update order:', { orderId, updateData });

    // ✅ API CALL - Using the correct endpoint pattern from your existing code
    const response = await window.apiCall(`/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });

    console.log('✅ Order approval API response:', response);

    // Update local state after successful API call
    window.setOrders(prev => 
      prev.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              ...updateData,
              // Include any additional data from server response
              ...(response.data || response)
            }
          : order
      )
    );

    // If viewing this order in detail modal, update that too
    if (window.showOrderDetail && window.currentOrderDetail?.id === orderId) {
      window.setCurrentOrderDetail(prev => ({
        ...prev,
        ...updateData,
        ...(response.data || response)
      }));
    }

    // Generate invoice if approved (following your existing pattern)
    if (action === 'approve' && currentOrder.requires_gst_invoice) {
      console.log('📄 Generating invoice for approved order...');
      
      try {
        const invoiceNumber = 'STTS/INV/' + new Date().getFullYear() + '/' + String(Date.now()).slice(-6);

        const newInvoice = {
          id: Date.now(),
          invoice_number: invoiceNumber,
          order_id: orderId,
          order_number: currentOrder.order_number,
          client_name: currentOrder.legal_name || currentOrder.client_name,
          client_email: currentOrder.client_email,
          gstin: currentOrder.gstin,
          legal_name: currentOrder.legal_name,
          category_of_sale: currentOrder.category_of_sale,
          type_of_sale: currentOrder.type_of_sale,
          registered_address: currentOrder.registered_address,
          indian_state: currentOrder.indian_state,
          is_outside_india: currentOrder.is_outside_india,
          invoice_items: currentOrder.invoice_items,
          base_amount: currentOrder.base_amount,
          gst_calculation: currentOrder.gst_calculation,
          total_tax: currentOrder.total_tax,
          final_amount: currentOrder.final_amount,
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'generated',
          generated_by: window.user.name
        };

        window.setInvoices(prev => [...prev, newInvoice]);
        console.log('📄 Invoice generated locally:', invoiceNumber);
      } catch (invoiceError) {
        console.error('Failed to generate invoice:', invoiceError);
        // Don't fail the approval for invoice generation issues
      }
    }

    const actionText = action === 'approve' ? 'approved' : 'rejected';
    const message = action === 'approve' 
      ? 'Order approved successfully! Invoice has been generated.' 
      : 'Order rejected successfully.';
    
    alert(message);
    console.log(`✅ Order ${orderId} ${actionText} successfully`);

  } catch (error) {
    console.error(`❌ Error ${action}ing order:`, error);
    alert(`Failed to ${action} order: ${error.message}`);
  } finally {
    window.setLoading(false);
  }
};

// ✅ BULK ASSIGNMENT HANDLER
window.handleBulkAssignSubmit = async function() {
  if (Object.keys(window.bulkAssignSelections).length === 0) {
    alert('Please select at least one lead to assign.');
    return;
  }

  window.setBulkAssignLoading(true);
  let successCount = 0;
  let errorCount = 0;

  try {
    for (const [leadId, assigneeEmail] of Object.entries(window.bulkAssignSelections)) {
      try {
        const response = await window.apiCall(`/leads/${leadId}`, {
          method: 'PUT',
          body: JSON.stringify({
            assigned_to: assigneeEmail,
            status: 'assigned'
          })
        });

        if (response.error) {
          console.error(`Failed to assign lead ${leadId}:`, response.error);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        console.error(`Error assigning lead ${leadId}:`, error);
        errorCount++;
      }
    }

    // Refresh leads list
    window.fetchLeads();

    alert(`Bulk assignment completed! ${successCount} leads assigned successfully. ${errorCount} failed.`);
    window.setBulkAssignSelections({});
    window.setShowBulkAssignModal(false);
  } catch (error) {
    console.error('Bulk assignment error:', error);
    alert('Bulk assignment failed: ' + error.message);
  } finally {
    window.setBulkAssignLoading(false);
  }
};

console.log("🔧 form-handlers.js loaded - All form submission handlers ready");

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

// ✅ GST AND TCS CALCULATION HELPER FUNCTION  
window.calculateGSTAndTCS = function(baseAmount, paymentData) {
  const result = {
    gst: { applicable: false, rate: 0, amount: 0, cgst: 0, sgst: 0, igst: 0 },
    tcs: { applicable: false, rate: 0, amount: 0 },
    finalAmount: baseAmount
  };

  if (paymentData.type_of_sale === 'Service Fee') {
    result.gst.applicable = true;
    result.gst.rate = 18;
  } else {
    const isIndian = paymentData.customer_type === 'indian';
    const isCorporate = paymentData.category_of_sale === 'Corporate';
    const isOutsideIndia = paymentData.event_location === 'outside_india';
    const isINRPayment = paymentData.payment_currency === 'INR';

    if (isIndian || (!isOutsideIndia) || (isOutsideIndia && isINRPayment)) {
      result.gst.applicable = true;
      result.gst.rate = (isIndian && isCorporate) ? 18 : 5;
    }
  }

  if (result.gst.applicable) {
    result.gst.amount = (baseAmount * result.gst.rate) / 100;
    const isIntraState = paymentData.indian_state === 'Haryana' && !paymentData.is_outside_india;
    
    if (isIntraState) {
      result.gst.cgst = result.gst.amount / 2;
      result.gst.sgst = result.gst.amount / 2;
    } else {
      result.gst.igst = result.gst.amount;
    }
  }

  const isOutsideIndia = paymentData.event_location === 'outside_india';
  const isIndian = paymentData.customer_type === 'indian';
  const isINRPayment = paymentData.payment_currency === 'INR';
  
  if (isOutsideIndia && (isIndian || isINRPayment)) {
    result.tcs.applicable = true;
    result.tcs.rate = paymentData.tcs_rate || 5;
    result.tcs.amount = (baseAmount * result.tcs.rate) / 100;
  }

  result.finalAmount = baseAmount + result.gst.amount + result.tcs.amount;
  return result;
};

console.log("🔧 Payment handler functions added to form-handlers.js");
