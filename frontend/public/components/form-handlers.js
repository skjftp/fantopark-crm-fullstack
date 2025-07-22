// Form Handlers System Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Handles all major form submissions including leads, inventory, orders, and allocations

// ✅ MAIN UNIVERSAL FORM SUBMISSION HANDLER - CLEANED AND FIXED

// ✅ COMPLETE: Enhanced assignOrderToSupplyTeam function with delivery creation
// Replace the existing function in form-handlers.js

window.assignOrderToSupplyTeam = async function(orderId) {
  console.log('🔄 Starting assignment + delivery creation for order:', orderId);
  
  if (!window.hasPermission('orders', 'assign')) {
    alert('You do not have permission to assign orders');
    return;
  }
  
  try {
    window.setLoading(true);
    
    // Step 1: Get supply team member
    const assignee = await window.getSupplyTeamMember();
    console.log('🎯 Assignee selected:', assignee);
    
    // Step 2: Find the order
    const order = window.orders.find(o => o.id === orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    // Step 3: Update order assignment
    const updateData = {
      assigned_to: assignee,
      status: 'service_assigned',
      assigned_date: new Date().toISOString(),
      assignment_notes: 'Auto-assigned to supply team for service delivery'
    };
    
    const response = await window.apiCall(`/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify({...order, ...updateData})
    });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    // Step 4: Update local orders state
    window.setOrders(prev => prev.map(o => 
      o.id === orderId ? {...o, ...updateData} : o
    ));
    
    // Step 5: Create delivery record
    const newDelivery = {
      order_id: orderId,
      order_number: order.order_number,
      client_name: order.client_name,
      client_email: order.client_email,
      client_phone: order.client_phone,
      event_name: order.event_name || 'N/A',
      event_date: order.event_date || new Date().toISOString().split('T')[0],
      tickets_count: order.tickets_allocated || 0,
      amount: order.total_amount || 0,
      delivery_type: 'offline',
      pickup_location: '',
      pickup_date: '',
      pickup_time: '',
      delivery_location: order.delivery_address || order.client_address || '',
      delivery_date: '',
      delivery_time: '',
      delivery_person: assignee,
      delivery_notes: 'Auto-created from order assignment',
      online_platform: '',
      online_link: '',
      assigned_to: assignee,
      status: 'pending',
      created_date: new Date().toISOString().split('T')[0],
      created_by: window.user?.name || 'System'
    };
    
    // Add delivery to local state
    window.setDeliveries(prev => [...prev, newDelivery]);
    
    // Save delivery to backend
    try {
      const deliveryResponse = await window.apiCall('/deliveries', {
        method: 'POST',
        body: JSON.stringify(newDelivery)
      });
      
      // Update delivery with backend ID if provided
      if (deliveryResponse?.data?.id) {
        window.setDeliveries(prev => prev.map(d => 
          d.order_id === orderId && !d.id ? { ...d, id: deliveryResponse.data.id } : d
        ));
      }
    } catch (deliveryError) {
      console.error('Failed to save delivery to backend:', deliveryError);
      // Don't fail the whole operation - delivery is in local state
    }
    
    // Refresh My Actions if available
    if (window.fetchMyActions) {
      await window.fetchMyActions();
    }
    
    alert(`✅ Order assigned to ${assignee} successfully!\n🚚 Delivery record created`);
    console.log('🎉 Assignment + delivery creation completed');
    
  } catch (error) {
    window.handleError(error, 'saving lead');
  } finally {
    window.setLoading(false);
  }
};

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
          created_by: window.user.name,
          created_date: new Date().toISOString()
        })
      });
      
      // Refresh the leads list to show the new lead in the correct sort order
      // Use the paginated API to fetch the updated list
      try {
        const paginatedResponse = await window.apiCall('/leads/paginated?page=1&limit=20&sort=created_date&sortOrder=desc');
        
        if (paginatedResponse.success && paginatedResponse.data) {
          window.setLeads(paginatedResponse.data);
          console.log('✅ Refreshed leads list after creation, showing newest first');
        } else {
          // Fallback: add to existing list
          window.setLeads(prev => [leadResponse.data, ...prev]);
        }
      } catch (error) {
        console.error('Failed to refresh paginated leads:', error);
        // Fallback: add to existing list
        window.setLeads(prev => [leadResponse.data, ...prev]);
      }
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
    window.handleError(error, 'Operation Failed');
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
    window.handleError(error, 'error updating order');
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
    window.handleError(error, 'allocation error');
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
    window.handleError(error, 'failed to assign lead');
  } finally {
    window.setLoading(false);
  }
};

window.generateProformaInvoice = async function(order) {
  try {
    const invoiceNumber = 'STTS/PRO/' + new Date().getFullYear() + '/' + String(Date.now()).slice(-6);
    
    const proformaInvoice = {
      id: Date.now(),
      invoice_number: invoiceNumber,
      order_id: order.id || order.order_number,
      order_number: order.order_number,
      client_name: order.legal_name || order.client_name,
      client_email: order.client_email,
      gstin: order.gstin,
      legal_name: order.legal_name,
      category_of_sale: order.category_of_sale,
      type_of_sale: order.type_of_sale,
      registered_address: order.registered_address,
      indian_state: order.indian_state,
      is_outside_india: order.is_outside_india,
      invoice_items: order.invoice_items,
      base_amount: order.base_amount || order.expected_amount || 0,
      gst_calculation: order.gst_calculation || { applicable: false, rate: 0, amount: 0, cgst: 0, sgst: 0, igst: 0 },
      tcs_calculation: order.tcs_calculation || { applicable: false, rate: 0, amount: 0 },
      total_tax: order.total_tax || 0,
      final_amount: order.final_amount || order.expected_amount || 0,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: order.expected_payment_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'proforma',
      invoice_type: 'proforma', // Add this flag to distinguish proforma invoices
      generated_by: window.user.name
    };

    try {
      console.log('📄 Generating proforma invoice:', invoiceNumber);
      const invoiceResponse = await window.apiCall('/invoices', {
        method: 'POST',
        body: JSON.stringify(proformaInvoice)
      });
      
      const savedInvoice = invoiceResponse.data || invoiceResponse || proformaInvoice;
      window.setInvoices(prev => [...prev, savedInvoice]);
      console.log('📄 Proforma invoice generated successfully:', invoiceNumber);
      
      // Update order with invoice reference
      await window.apiCall(`/orders/${order.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          invoice_number: invoiceNumber,
          invoice_id: savedInvoice.id
        })
      });
      
      return savedInvoice;
    } catch (invoiceError) {
      console.error('❌ Failed to save proforma invoice:', invoiceError);
      window.setInvoices(prev => [...prev, proformaInvoice]);
      return proformaInvoice;
    }
  } catch (error) {
    window.handleError(error, 'failed to generate proforma invoice');
    throw error;
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
   window.handleError(error, 'failed to schedule delivery');
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
    window.handleError(error, 'failed to save user');
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

        // ✅ FIX: Save invoice to backend AND local state
try {
  console.log('📄 Saving invoice to backend:', invoiceNumber);
  const invoiceResponse = await window.apiCall('/invoices', {
    method: 'POST',
    body: JSON.stringify(newInvoice)
  });
  
  // Use the response data or fallback to newInvoice
  const savedInvoice = invoiceResponse.data || invoiceResponse || newInvoice;
  
  // Add to local state
  window.setInvoices(prev => [...prev, savedInvoice]);
  console.log('📄 Invoice saved successfully:', invoiceNumber);
} catch (invoiceError) {
  console.error('❌ Failed to save invoice to backend:', invoiceError);
  // Still add to local state as fallback
  window.setInvoices(prev => [...prev, newInvoice]);
  console.log('📄 Invoice generated locally only:', invoiceNumber);
}
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
    window.handleError(error, ` Error ${action}ing order:`);
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
        window.handleError(error, `Error assigning lead ${leadId}:`);
        errorCount++;
      }
    }

    // Refresh leads list
    if (window.LeadsAPI) {
    window.LeadsAPI.refresh();
} else if (window.fetchLeads) {
    window.fetchLeads();
}

    alert(`Bulk assignment completed! ${successCount} leads assigned successfully. ${errorCount} failed.`);
    window.setBulkAssignSelections({});
    window.setShowBulkAssignModal(false);
  } catch (error) {
    window.handleError(error, 'bulk assignment error');
  } finally {
    window.setBulkAssignLoading(false);
  }
};

// ✅ PAYMENT POST SERVICE INPUT CHANGE HANDLER
window.handlePaymentPostServiceInputChange = function(field, value) {
  console.log("📝 Payment Post Service Input Change:", field, value);
  window.setPaymentPostServiceData(prev => ({ ...prev, [field]: value }));
};

window.handlePaymentPostServiceSubmit = async function(e) {
  e.preventDefault();
  console.log('📋 Processing payment post service submission...');

  if (!window.hasPermission('orders', 'create')) {
    alert('You do not have permission to create orders');
    return;
  }

  window.setLoading(true);

  try {
    const supplySalesServiceManager = await window.getSupplySalesServiceManager();
    console.log('🎯 Assigning payment post service order to:', supplySalesServiceManager);

    // Calculate GST and TCS for the expected amount
    const baseAmount = parseFloat(window.paymentPostServiceData.expected_amount) || 0;
    const calculation = window.calculateGSTAndTCS(baseAmount, {
      ...window.paymentPostServiceData,
      customer_type: window.paymentPostServiceData.customer_type || 'indian',
      category_of_sale: window.paymentPostServiceData.category_of_sale || 'Individual',
      type_of_sale: window.paymentPostServiceData.type_of_sale || 'Tour'
    });

    const newOrder = {
      order_number: 'PST-' + Date.now(),
      lead_id: window.currentLead.id,
      client_name: window.paymentPostServiceData.legal_name || window.currentLead.name,
      client_email: window.currentLead.email,
      client_phone: window.currentLead.phone,
      
      // GST and legal details
      gstin: window.paymentPostServiceData.gstin,
      legal_name: window.paymentPostServiceData.legal_name,
      category_of_sale: window.paymentPostServiceData.category_of_sale,
      type_of_sale: window.paymentPostServiceData.type_of_sale,
      registered_address: window.paymentPostServiceData.registered_address,
      indian_state: window.paymentPostServiceData.indian_state,
      is_outside_india: window.paymentPostServiceData.is_outside_india,
      customer_type: window.paymentPostServiceData.customer_type,
      event_location: window.paymentPostServiceData.event_location,
      payment_currency: window.paymentPostServiceData.payment_currency,
      
      // Payment post service specific fields
      expected_amount: parseFloat(window.paymentPostServiceData.expected_amount),
      expected_payment_date: window.paymentPostServiceData.expected_payment_date,
      service_description: window.paymentPostServiceData.service_details,
      notes: window.paymentPostServiceData.notes,
      payment_terms: window.paymentPostServiceData.payment_terms,
      
      // Invoice items
      invoice_items: window.paymentPostServiceData.invoice_items || [{
        description: window.paymentPostServiceData.service_details || 'Service',
        quantity: 1,
        rate: baseAmount
      }],
      
      // Calculations
      base_amount: baseAmount,
      gst_calculation: calculation.gst,
      tcs_calculation: calculation.tcs,
      total_tax: calculation.gst.amount + calculation.tcs.amount,
      final_amount: calculation.finalAmount,

      // Order metadata
      order_type: 'payment_post_service',
      payment_status: 'pending',
      status: 'pending_approval',
      requires_gst_invoice: true,
      created_date: new Date().toISOString(),
      created_by: window.user.name,
      sales_person: window.user.email, // Add this line
      
      assigned_to: supplySalesServiceManager,
      assigned_team: 'supply',
      original_assignee: window.currentLead.assigned_to || window.user.name
    };

    // Create order in backend
    try {
      console.log('Creating payment post service order:', JSON.stringify(newOrder, null, 2));
      const orderResponse = await window.apiCall('/orders', {
        method: 'POST',
        body: JSON.stringify(newOrder)
      });
      console.log('Order created in backend (Post Service):', orderResponse);

      const finalOrder = orderResponse.data || orderResponse || newOrder;
      if (!finalOrder.id && newOrder.order_number) {
        finalOrder.id = newOrder.order_number;
      }

      window.setOrders(prev => [...prev, finalOrder]);
      
      // Generate proforma invoice immediately for post service orders
      try {
        const proformaInvoice = await window.generateProformaInvoice(finalOrder);
        console.log('Proforma invoice generated:', proformaInvoice.invoice_number);
        
        // Update order with invoice reference
        finalOrder.invoice_number = proformaInvoice.invoice_number;
        finalOrder.invoice_id = proformaInvoice.id;
        
        window.setOrders(prev => prev.map(o => 
          o.id === finalOrder.id ? finalOrder : o
        ));
        
        alert(`Payment Post Service order created successfully!\nProforma Invoice: ${proformaInvoice.invoice_number}\nAssigned to: ${supplySalesServiceManager}`);
      } catch (invoiceError) {
        console.error('Failed to generate proforma invoice:', invoiceError);
        alert(`Payment Post Service order created successfully!\nAssigned to: ${supplySalesServiceManager}\nNote: Proforma invoice generation failed.`);
      }
      
      window.closeForm();
    } catch (orderError) {
      console.error('Failed to create order in backend:', orderError);
      newOrder.id = newOrder.order_number;
      window.setOrders(prev => [...prev, newOrder]);
      window.setLoading(false);
      alert('Warning: Order may not have been saved to server. Please check orders page.');
      window.closeForm();
    }
  } catch (error) {
    window.setLoading(false);
    window.handleError(error, 'failed to process payment service');
  } finally {
    window.setLoading(false);
  }
};

// ✅ PAYMENT POST SERVICE HANDLER - FIXED ASSIGNMENT  
// Replace the existing handlePaymentPostService function in form-handlers.js

window.handlePaymentPostService = async function(lead) {
  if (!window.hasPermission('orders', 'create')) {
    alert('You do not have permission to create orders');
    return;
  }

  window.setLoading(true);

  try {
    // 🔧 FIXED: Get supply_sales_service_manager for assignment
    const supplySalesServiceManager = await window.getSupplySalesServiceManager();
    console.log('🎯 Assigning payment post service order to:', supplySalesServiceManager);

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
      sales_person: window.user.email, // Add this line
      
      // 🔧 FIXED: Assign to supply_sales_service_manager instead of empty string
      assigned_to: supplySalesServiceManager,
      assigned_team: 'supply',
      original_assignee: lead.assigned_to || window.user.name,
      order_type: 'payment_post_service'
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
      alert(`Payment Post Service order created successfully!\nAssigned to: ${supplySalesServiceManager}\nAwaiting approval.`);
      window.closeForm();
    } catch (orderError) {
      console.error('Failed to create order in backend:', orderError);
      newOrder.id = newOrder.order_number;
      window.setOrders(prev => [...prev, newOrder]);
      alert('Warning: Order may not have been saved to server. Please check orders page.');
      window.closeForm();
    }
  } catch (error) {
    window.handleError(error, 'failed to process payment post service');
  } finally {
    window.setLoading(false);
  }
};

// ✅ PAYMENT INPUT CHANGE HANDLER
window.handlePaymentInputChange = function(field, value) {
  console.log("📝 Payment Input Change:", field, value);
  window.setPaymentData(prev => ({ ...prev, [field]: value }));
};

// ✅ PAYMENT FORM SUBMISSION HANDLER
// Update your handlePaymentSubmit function
// Updated handlePaymentSubmit function
window.handlePaymentSubmit = async function(e) {
  e.preventDefault();
  console.log('=== PAYMENT SUBMIT DEBUG ===');
  console.log('Full paymentData:', window.paymentData);

  if (!window.hasPermission('orders', 'create')) {
    alert('You do not have permission to process payments');
    return;
  }

  window.setLoading(true);

  try {
    // Check if we're updating an existing order (payment collection for post service)
    const existingOrderId = window.paymentData.existing_order_id || window.paymentData.order_id;
    
    if (existingOrderId) {
      console.log('💰 Processing payment for existing order:', existingOrderId);
      
      // Find the existing order
      const existingOrder = window.orders?.find(o => o.id === existingOrderId);
      
      if (!existingOrder) {
        throw new Error('Order not found: ' + existingOrderId);
      }
      
      console.log('Found existing order:', existingOrder);
      
      // Determine if this is converting a proforma to tax invoice
      const isConvertingProforma = existingOrder.invoice_type === 'proforma' || 
                                   existingOrder.order_type === 'payment_post_service';
      
      // Prepare update data
      const updateData = {
        // Payment details
        payment_method: window.paymentData.payment_method,
        transaction_id: window.paymentData.transaction_id,
        payment_date: window.paymentData.payment_date,
        advance_amount: parseFloat(window.paymentData.advance_amount) || existingOrder.final_amount || 0,
        
        // CRITICAL: Update invoice type and status for proforma conversion
        invoice_type: 'tax',  // Convert to tax invoice
        payment_status: 'completed',
        status: 'payment_received',
        
        // Keep proforma reference if converting
        ...(isConvertingProforma && {
          proforma_invoice_number: existingOrder.invoice_number || existingOrder.order_number,
          proforma_order_number: existingOrder.order_number,
          // Generate new order number for tax invoice
          order_number: 'ORD-' + Date.now(),
        }),
        
        // Update order type to standard if it was payment_post_service
        ...(existingOrder.order_type === 'payment_post_service' && {
          order_type: 'standard',
          original_order_type: 'payment_post_service'
        }),
        
        // GST and other details from payment form
        gstin: window.paymentData.gstin || existingOrder.gstin,
        legal_name: window.paymentData.legal_name || existingOrder.legal_name,
        registered_address: window.paymentData.registered_address || existingOrder.registered_address,
        category_of_sale: window.paymentData.category_of_sale || existingOrder.category_of_sale,
        type_of_sale: window.paymentData.type_of_sale || existingOrder.type_of_sale,
        indian_state: window.paymentData.indian_state || existingOrder.indian_state,
        is_outside_india: window.paymentData.is_outside_india || existingOrder.is_outside_india,
        
        // Keep financial calculations
        base_amount: existingOrder.base_amount,
        gst_calculation: existingOrder.gst_calculation,
        tcs_calculation: existingOrder.tcs_calculation,
        total_tax: existingOrder.total_tax,
        final_amount: existingOrder.final_amount,
        
        // Metadata
        payment_collected_date: new Date().toISOString(),
        payment_collected_by: window.user.name,
        updated_date: new Date().toISOString(),
        updated_by: window.user.name
      };
      
      console.log('Update data being sent:', updateData);
      
      // Update order via API
      const response = await window.apiCall(`/orders/${existingOrderId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      
      console.log('Order update response:', response);
      
      // Update local state
      const updatedOrder = response.data || response;
      window.setOrders(prev => prev.map(o => 
        o.id === existingOrderId ? { ...o, ...updatedOrder, id: existingOrderId } : o
      ));
      
      // Update receivable if from receivable
      if (window.paymentData.from_receivable && window.paymentData.receivable_id) {
        await window.apiCall(`/receivables/${window.paymentData.receivable_id}`, {
          method: 'PUT',
          body: JSON.stringify({
            status: 'collected',
            payment_date: window.paymentData.payment_date,
            payment_method: window.paymentData.payment_method,
            transaction_id: window.paymentData.transaction_id,
            collected_by: window.user.name,
            collected_date: new Date().toISOString()
          })
        });
        
        window.setReceivables(prev => prev.map(r => 
          r.id === window.paymentData.receivable_id 
            ? { ...r, status: 'collected' }
            : r
        ));
      }
      
      alert(isConvertingProforma 
        ? '✅ Payment collected! Proforma invoice converted to tax invoice.'
        : '✅ Payment collected successfully!'
      );
      
    } else {
      // Create new order logic (keep existing)
      console.log('Creating new order with payment...');
      
      // Calculate GST and TCS
      const invoiceTotal = window.paymentData.invoice_items?.reduce((sum, item) => 
        sum + ((item.quantity || 0) * (item.rate || 0)), 0
      ) || 0;

      const baseAmount = window.paymentData.type_of_sale === 'Service Fee' 
        ? (parseFloat(window.paymentData.service_fee_amount) || 0)
        : invoiceTotal;

      const calculation = window.calculateGSTAndTCS(baseAmount, window.paymentData);
      
      const newOrder = {
        order_number: 'ORD-' + Date.now(),
        lead_id: window.currentLead.id,
        client_name: window.paymentData.legal_name || window.currentLead.name,
        client_email: window.currentLead.email,
        client_phone: window.currentLead.phone,

        // Payment fields
        payment_method: window.paymentData.payment_method,
        transaction_id: window.paymentData.transaction_id,
        payment_date: window.paymentData.payment_date,
        advance_amount: parseFloat(window.paymentData.advance_amount) || 0,

        // GST details
        gstin: window.paymentData.gstin,
        legal_name: window.paymentData.legal_name,
        category_of_sale: window.paymentData.category_of_sale,
        type_of_sale: window.paymentData.type_of_sale,
        registered_address: window.paymentData.registered_address,
        indian_state: window.paymentData.indian_state,
        is_outside_india: window.paymentData.is_outside_india,
        
        // Financial calculations
        invoice_items: window.paymentData.invoice_items || [],
        base_amount: baseAmount,
        gst_calculation: calculation.gst,
        tcs_calculation: calculation.tcs,
        total_tax: calculation.gst.amount + calculation.tcs.amount,
        final_amount: calculation.finalAmount,

        // Order metadata
        status: 'payment_received',
        payment_status: 'completed',
        invoice_type: 'tax',
        order_type: 'standard',
        created_date: new Date().toISOString(),
        created_by: window.user.name
      };

      const orderResponse = await window.apiCall('/orders', {
        method: 'POST',
        body: JSON.stringify(newOrder)
      });

      const finalOrder = orderResponse.data || orderResponse;
      window.setOrders(prev => [...prev, finalOrder]);
      
      alert('Payment processed successfully! Order created.');
    }

    // Update lead status
    await window.updateLeadStatus(window.currentLead.id, 'payment_received');

    // Refresh orders
    console.log('Refreshing orders after update...');
    await window.fetchOrders();

    window.closeForm();

  } catch (error) {
    window.handleError(error, 'payment processing error');
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

// =============================================================================
// ✅ FIXED: ORDER ACTION FUNCTIONS - CRITICAL FIX FOR VIEW BUTTON ISSUE
// =============================================================================

// ✅ CORRECT: View button function that connects to the modal system
window.viewOrderDetail = function(order) {
  console.log('📋 viewOrderDetail called for order:', order.id);
  
  // Call the actual modal opening function
  if (window.openOrderDetail) {
    window.openOrderDetail(order);
  } else {
    // Direct modal opening if openOrderDetail doesn't exist
    window.currentOrderDetail = order;
    window.showOrderDetail = true;
    
    if (window.setCurrentOrderDetail) window.setCurrentOrderDetail(order);
    if (window.setShowOrderDetail) window.setShowOrderDetail(true);
    
    // Force re-render
    if (window.setLoading) {
      window.setLoading(true);
      setTimeout(() => window.setLoading(false), 10);
    }
  }
};

// ✅ CORRECT: The actual modal opening function
window.openOrderDetail = function(order) {
  console.log('📋 openOrderDetail called for order:', order.id);
  
  // Set the order data
  window.currentOrderDetail = order;
  window.showOrderDetail = true;
  
  // Update app state if available  
  if (window.appState) {
    window.appState.currentOrderDetail = order;
    window.appState.showOrderDetail = true;
  }
  
  // Call React state setters
  if (window.setCurrentOrderDetail) {
    window.setCurrentOrderDetail(order);
  }
  if (window.setShowOrderDetail) {
    window.setShowOrderDetail(true);
  }
  
  // Force re-render
  if (window.setLoading) {
    window.setLoading(true);
    setTimeout(() => window.setLoading(false), 10);
  }
  
  console.log('✅ Order modal state set successfully');
};

// ✅ SIMPLE WRAPPER FUNCTIONS - Connect orders.js buttons to existing functions

// Connect orders.js approve button to existing handleOrderApproval
window.approveOrder = async function(orderId) {
  await window.handleOrderApproval(orderId, 'approve');
};

// Connect orders.js reject button to existing handleOrderApproval  
window.rejectOrder = async function(orderId) {
  const reason = prompt('Please provide a reason for rejection:');
  if (reason) {
    await window.handleOrderApproval(orderId, 'reject', reason);
  }
};

// Connect orders.js "View Invoice" button to existing openInvoicePreview
window.viewInvoice = function(order) {
  console.log('📄 viewInvoice called with order:', order);
  
  if (!order) {
    console.error('❌ No order object provided');
    alert('Error: No order data available');
    return;
  }
  
  console.log('Order state:', {
    id: order.id,
    order_type: order.order_type,
    status: order.status,
    payment_status: order.payment_status,
    invoice_type: order.invoice_type,
    original_order_type: order.original_order_type
  });
  
  // Check if this should show as proforma
  // Only show proforma if explicitly marked AND payment is pending
  const isProforma = order.invoice_type === 'proforma' && 
                     order.payment_status !== 'completed';
  
  console.log('Invoice type determined as:', isProforma ? 'PROFORMA' : 'TAX');
  
  // For tax invoices that don't have finance invoice number
  if (!isProforma && !order.finance_invoice_number) {
    console.log('📝 Tax invoice needs finance invoice number');
    
    if (window.setCurrentOrderForInvoice && window.setFinanceInvoiceNumber && window.setShowFinanceInvoiceModal) {
      window.setCurrentOrderForInvoice(order);
      window.setFinanceInvoiceNumber(order.finance_invoice_number || '');
      window.setShowFinanceInvoiceModal(true);
      return;
    }
  }
  
  // Show invoice preview
  window.openInvoicePreviewDirectly(order);
};

// Direct invoice preview function
window.openInvoicePreviewDirectly = function(order) {
  const isProformaOrder = (order.order_type === 'payment_post_service' || 
                          order.invoice_type === 'proforma' ||
                          order.status === 'proforma') &&
                          order.payment_status !== 'completed';
  
  // Construct invoice data
  const invoiceData = {
    // Basic identifiers
    id: order.id || Date.now(),
    
    // Handle different invoice number scenarios
    order_number: order.proforma_order_number || order.order_number || order.invoice_number,
    invoice_number: isProformaOrder 
      ? (order.invoice_number || order.order_number || ('PI-' + Date.now()))
      : (order.finance_invoice_number || order.invoice_number),
    
    // Store all reference numbers
    original_invoice_number: !isProformaOrder ? (order.invoice_number || order.order_number) : null,
    proforma_invoice_number: order.proforma_invoice_number,
    finance_invoice_number: order.finance_invoice_number,
    
    order_id: order.id,
    
    // Invoice type based on payment status
    invoice_type: isProformaOrder ? 'proforma' : 'tax',
    status: isProformaOrder ? 'proforma' : 'generated',
    
    // Rest of the invoice data (keep all existing fields)...
    client_name: order.legal_name || order.client_name || 'N/A',
    client_email: order.client_email || '',
    client_phone: order.client_phone || '',
    legal_name: order.legal_name || order.client_name || 'N/A',
    
    // GST details
    gstin: order.gstin || '',
    category_of_sale: order.category_of_sale || 'Retail',
    type_of_sale: order.type_of_sale || 'Tour',
    registered_address: order.registered_address || 'N/A',
    indian_state: order.indian_state || 'Haryana',
    is_outside_india: order.is_outside_india || false,
    pan: order.pan || 'N/A',
    
    // Tax classification
    customer_type: order.customer_type || 'indian',
    event_location: order.event_location || 'domestic',
    payment_currency: order.payment_currency || 'INR',
    
    // Invoice items
    invoice_items: order.invoice_items && order.invoice_items.length > 0 
      ? order.invoice_items 
      : [{
          description: order.description || order.event_name || 'Service',
          additional_info: '',
          quantity: order.tickets_allocated || 1,
          rate: order.price_per_ticket || order.base_amount || order.total_amount || 0
        }],
    
    // Financial details
    base_amount: order.base_amount || order.total_amount || 0,
    
    // GST calculation
    gst_calculation: order.gst_calculation || { 
      applicable: false, 
      rate: 0, 
      amount: 0,
      total: 0,
      cgst: 0, 
      sgst: 0, 
      igst: 0 
    },
    
    // TCS calculation
    tcs_calculation: order.tcs_calculation || { 
      applicable: false, 
      rate: 0, 
      amount: 0 
    },
    
    // Totals
    total_tax: order.total_tax || 0,
    final_amount: order.final_amount || order.total_amount || 0,
    
    // Dates
    invoice_date: order.invoice_date || order.created_date || new Date().toISOString(),
    created_date: order.created_date || new Date().toISOString(),
    due_date: order.due_date || order.expected_payment_date || 
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    
    // Proforma specific fields
    payment_terms: order.payment_terms || (isProformaOrder ? '50% advance, 50% before service' : ''),
    expected_payment_date: order.expected_payment_date || '',
    
    // Payment details for tax invoices
    payment_method: order.payment_method,
    transaction_id: order.transaction_id,
    payment_date: order.payment_date,
    
    // Metadata
    generated_by: order.created_by || order.generated_by || window.user?.name || 'System'
  };
  
  // Ensure gst_calculation has the total field
  if (invoiceData.gst_calculation && !invoiceData.gst_calculation.total) {
    invoiceData.gst_calculation.total = invoiceData.gst_calculation.amount || 
      (invoiceData.gst_calculation.cgst + invoiceData.gst_calculation.sgst + invoiceData.gst_calculation.igst) || 0;
  }
  
  console.log('Opening invoice preview with data:', invoiceData);
  
  // Open the invoice preview
  window.openInvoicePreview(invoiceData);
};

// ✅ OTHER SUPPORT FUNCTIONS

window.assignOrder = function(order) {
  console.log('👥 Assign clicked for order:', order.id);
  
  // Use the existing enhanced order actions quick assign function
  if (window.enhancedOrderActions && window.enhancedOrderActions.quickAssignOrder) {
    window.enhancedOrderActions.quickAssignOrder(order.id);
  } else {
    // Fallback to manual assignment if enhanced actions not available
    console.log('Enhanced order actions not available, using fallback');
    
    const allUsers = (window.users || []).filter(u => u.status === 'active');
    
    if (allUsers.length === 0) {
      alert('No active users available for assignment');
      return;
    }

    // Create a user selection prompt
    const userOptions = allUsers.map((u, index) => `${index + 1}. ${u.name} (${u.role})`).join('\n');
    const selectedIndex = prompt(`Select user to assign order to:\n\n${userOptions}\n\nEnter the number (1-${allUsers.length}):`);
    
    if (selectedIndex && !isNaN(selectedIndex)) {
      const index = parseInt(selectedIndex) - 1;
      if (index >= 0 && index < allUsers.length) {
        const selectedUser = allUsers[index];
        
        if (window.assignOrderToUser) {
          window.assignOrderToUser(order.id, selectedUser.email, 'Manual assignment');
        } else {
          alert('Order assignment function not available. Please refresh the page.');
        }
      } else {
        alert('Invalid selection');
      }
    }
  }
};
window.completeOrder = async function(orderId) {
  console.log('✅ Complete clicked for order:', orderId);
  
  if (!window.hasPermission('orders', 'write')) {
    alert('You do not have permission to complete orders');
    return;
  }

  // Find the order
  const order = window.orders?.find(o => o.id === orderId);
  if (!order) {
    alert('Order not found');
    return;
  }

  // Confirm completion
  const confirmMessage = `Mark this order as completed?\n\nOrder: ${order.order_number || orderId}\nClient: ${order.client_name || 'Unknown'}\nEvent: ${order.event_name || 'N/A'}`;
  
  if (!confirm(confirmMessage)) {
    return;
  }

  window.setLoading(true);

  try {
    // Prepare completion data
    const completionData = {
      status: 'completed',
      completed_by: window.user?.name || window.user?.email,
      completed_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };

    console.log('🔄 Completing order with data:', completionData);

    // Make API call to update order status
    const response = await window.apiCall(`/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(completionData)
    });

    if (response.error) {
      throw new Error(response.error);
    }

    // Update local orders state
    window.setOrders(prev => prev.map(o => 
      o.id === orderId 
        ? { 
            ...o, 
            ...completionData,
            ...(response.data || response)
          }
        : o
    ));

    // If viewing this order in detail modal, update that too
    if (window.showOrderDetail && window.currentOrderDetail?.id === orderId) {
      window.setCurrentOrderDetail(prev => ({
        ...prev,
        ...completionData,
        ...(response.data || response)
      }));
    }

    // Show success message
    alert('Order marked as completed successfully!');
    
    console.log(`✅ Order ${orderId} completed successfully`);

    // Refresh orders if needed
    if (window.fetchOrders && typeof window.fetchOrders === 'function') {
      await window.fetchOrders();
    }

  } catch (error) {
    window.handleError(error, 'error completing order');
  } finally {
    window.setLoading(false);
  }
};

window.deleteOrder = function(orderId) {
  console.log('🗑️ Delete clicked for order:', orderId);
  
  // Find the order to get its details for the confirmation message
  const order = window.orders?.find(o => o.id === orderId);
  const orderName = order 
    ? `Order ${order.order_number || orderId} (${order.client_name || 'Unknown Client'})` 
    : `Order ${orderId}`;
  
  // Call the existing comprehensive handleDelete function
  // This function already handles deletion of order + receivables + sales entries
  if (window.handleDelete) {
    window.handleDelete('orders', orderId, orderName);
  } else {
    console.error('handleDelete function not found');
    alert('Delete function not available. Please refresh the page.');
  }
};

// ✅ ORDER EDIT FUNCTIONS

window.openEditOrderForm = window.openEditOrderForm || function(order) {
  console.log('✏️ Edit order clicked:', order.id);
  window.setCurrentOrderForEdit(order);
  window.setShowEditOrderForm(true);
};

window.setCurrentOrderForEdit = window.setCurrentOrderForEdit || function(order) {
  window.currentOrderForEdit = order;
  window.orderEditData = order ? { ...order } : null;
};

window.setShowEditOrderForm = window.setShowEditOrderForm || function(show) {
  window.showEditOrderForm = show;
  // Force re-render
  if (window.setActiveTab) {
    window.setActiveTab(window.activeTab);
  }
};

window.assignOrderToUser = async function(orderId, assigneeEmail, notes = '') {
  console.log(`🔄 assignOrderToUser: Assigning order ${orderId} to ${assigneeEmail}`);
  
  if (!window.hasPermission('orders', 'assign')) {
    alert('You do not have permission to assign orders');
    return;
  }

  window.setLoading(true);

  try {
    // Find the order first
    const order = window.orders.find(o => o.id === orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Make API call to update the order assignment
    const response = await window.apiCall(`/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...order,
        assigned_to: assigneeEmail,
        assignment_notes: notes,
        assignment_date: new Date().toISOString(),
        status: order.status === 'pending_approval' ? 'assigned' : order.status
      })
    });

    if (response.error) {
      throw new Error(response.error);
    }

    // Update local orders state
    window.setOrders(prev => prev.map(o => 
      o.id === orderId 
        ? { 
            ...o, 
            assigned_to: assigneeEmail, 
            assignment_notes: notes,
            assignment_date: new Date().toISOString(),
            status: o.status === 'pending_approval' ? 'assigned' : o.status
          }
        : o
    ));

    // Show success message
    alert(`Order successfully assigned to ${assigneeEmail}`);
    
    console.log(`✅ Order ${orderId} assigned successfully to ${assigneeEmail}`);

    // Refresh orders if needed
    if (window.fetchOrders && typeof window.fetchOrders === 'function') {
      await window.fetchOrders();
    }

  } catch (error) {
    window.handleError(error, 'error assigning order');
  } finally {
    window.setLoading(false);
  }
};

// ========== PROFORMA INVOICE INTEGRATION CODE ==========
// Add this entire section at the bottom of form-handlers.js

// 1. Button to render in lead actions
window.renderProformaInvoiceButton = (lead) => {
  return React.createElement('button', {
    onClick: () => window.openProformaInvoiceForm(lead),
    className: 'w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center justify-center',
    title: 'Generate Proforma Invoice'
  },
    React.createElement('span', null, '📄 Generate Proforma Invoice')
  );
};

// 2. Convert proforma to tax invoice when payment is received
window.convertProformaToTaxInvoice = async (proformaOrderId) => {
  try {
    const order = window.orders.find(o => o.id === proformaOrderId);
    if (!order || order.invoice_type !== 'proforma') {
      alert('Invalid proforma invoice');
      return;
    }
    
    // Generate new tax invoice number
    const taxInvoiceNumber = 'STTS/INV/' + new Date().getFullYear() + '/' + String(Date.now()).slice(-6);
    
    const updateData = {
      invoice_type: 'tax',
      invoice_number: taxInvoiceNumber,
      status: 'approved',
      payment_status: 'completed',
      requires_gst_invoice: true,
      approved_date: new Date().toISOString(),
      approved_by: window.user.name
    };
    
    const response = await window.apiCall(`/orders/${proformaOrderId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    
    // Update local state
    window.setOrders(prev => prev.map(o => 
      o.id === proformaOrderId ? { ...o, ...updateData } : o
    ));
    
    alert('✅ Proforma invoice converted to tax invoice successfully!');
    
    // Open the new tax invoice
    window.viewInvoice({ ...order, ...updateData });
    
  } catch (error) {
    window.handleError(error, 'failed to convert proforma invoice');
  }
};

// 3. Check if an order has a proforma invoice
window.hasProformaInvoice = (order) => {
  return order.invoice_type === 'proforma' || order.status === 'proforma';
};

// 4. Render proforma actions in order row
window.renderProformaActions = (order) => {
  if (!window.hasProformaInvoice(order)) return null;
  
  return React.createElement('div', { className: 'flex space-x-2' },
    // View Proforma button
    React.createElement('button', {
      onClick: () => window.viewInvoice(order),
      className: 'text-purple-600 hover:text-purple-800',
      title: 'View Proforma Invoice'
    }, '📄 View'),
    
    // Convert to Tax Invoice button (if payment received)
    order.payment_status === 'completed' && 
    React.createElement('button', {
      onClick: () => window.convertProformaToTaxInvoice(order.id),
      className: 'text-green-600 hover:text-green-800',
      title: 'Convert to Tax Invoice'
    }, '🔄 Convert')
  );
};

// 5. Quick test function
window.testProformaInvoice = () => {
  const testLead = window.leads?.[0] || {
    id: 'test-lead',
    name: 'Test Client',
    email: 'test@example.com',
    phone: '9999999999',
    lead_for_event: 'Test Event',
    number_of_people: 2,
    last_quoted_price: 10000
  };
  
  window.openProformaInvoiceForm(testLead);
};
// Finance Invoice Number Modal
window.renderFinanceInvoiceModal = () => {
  const { showFinanceInvoiceModal, currentOrderForInvoice, financeInvoiceNumber } = window.appState || {};
  
  if (!showFinanceInvoiceModal) return null;
  
  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => {
      if (e.target === e.currentTarget) {
        window.setShowFinanceInvoiceModal(false);
      }
    }
  },
    React.createElement('div', {
      className: 'bg-white rounded-lg p-6 w-full max-w-md'
    },
      React.createElement('h3', {
        className: 'text-lg font-semibold mb-4'
      }, 'Enter Finance Invoice Number'),
      
      React.createElement('div', { className: 'mb-4' },
        React.createElement('label', {
          className: 'block text-sm font-medium text-gray-700 mb-1'
        }, 'Order Number'),
        React.createElement('input', {
          type: 'text',
          value: currentOrderForInvoice?.invoice_number || currentOrderForInvoice?.order_number || '',
          disabled: true,
          className: 'w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100'
        })
      ),
      
      React.createElement('div', { className: 'mb-4' },
        React.createElement('label', {
          className: 'block text-sm font-medium text-gray-700 mb-1'
        }, 'Finance Invoice Number *'),
        React.createElement('input', {
          type: 'text',
          value: financeInvoiceNumber || '',
          onChange: (e) => window.setFinanceInvoiceNumber(e.target.value),
          className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500',
          placeholder: 'e.g., STTS/INV/2025/001',
          required: true,
          autoFocus: true
        })
      ),
      
      React.createElement('div', { className: 'flex justify-end space-x-3' },
        React.createElement('button', {
          onClick: () => {
            window.setShowFinanceInvoiceModal(false);
            window.setFinanceInvoiceNumber('');
          },
          className: 'px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50'
        }, 'Cancel'),
        
        React.createElement('button', {
          onClick: async () => {
            if (!financeInvoiceNumber?.trim()) {
              alert('Please enter a finance invoice number');
              return;
            }
            
            await window.saveFinanceInvoiceNumber(currentOrderForInvoice, financeInvoiceNumber);
            window.setShowFinanceInvoiceModal(false);
          },
          className: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700',
          disabled: !financeInvoiceNumber?.trim()
        }, 'Save & View Invoice')
      )
    )
  );
};

// Function to save finance invoice number
window.saveFinanceInvoiceNumber = async (order, financeInvoiceNumber) => {
  try {
    window.setLoading(true);
    
    // Update the order with finance invoice number
    const updateData = {
      finance_invoice_number: financeInvoiceNumber,
      finance_invoice_date: new Date().toISOString(),
      finance_invoice_by: window.user?.name || window.user?.email
    };
    
    const response = await window.apiCall(`/orders/${order.id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    
    // Update local state
    window.setOrders(prev => prev.map(o => 
      o.id === order.id ? { ...o, ...updateData } : o
    ));
    
    // Now open the invoice with the finance number
    const updatedOrder = { ...order, ...updateData };
    window.openInvoicePreviewDirectly(updatedOrder);
    
  } catch (error) {
    window.handleError(error, 'failed to save finance invoice number');
  } finally {
    window.setLoading(false);
  }
};

// ✅ UPDATE ORDER SALES PERSON FUNCTION
window.updateOrderSalesPerson = async function(orderId, salesPerson) {
  console.log('🔄 Updating sales person for order:', orderId, 'to:', salesPerson);
  
  if (!window.hasPermission('orders', 'write')) {
    alert('You do not have permission to update orders');
    return;
  }
  
  if (!salesPerson || !salesPerson.trim()) {
    alert('Please provide a valid sales person email');
    return;
  }
  
  window.setLoading(true);
  
  try {
    // Call the API to update only the sales_person field
    const response = await window.apiCall(`/orders/${orderId}/sales-person`, {
      method: 'PUT',
      body: JSON.stringify({ sales_person: salesPerson.trim() })
    });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    console.log('✅ Sales person updated successfully');
    
    // Update local state
    window.setOrders(prev => prev.map(o => 
      o.id === orderId ? { ...o, sales_person: salesPerson.trim() } : o
    ));
    
    // Update current order detail if it's open
    if (window.currentOrderDetail && window.currentOrderDetail.id === orderId) {
      window.setCurrentOrderDetail(prev => ({
        ...prev,
        sales_person: salesPerson.trim()
      }));
    }
    
    alert('Sales person updated successfully!');
    
  } catch (error) {
    window.handleError(error, 'error updating sales person');
  } finally {
    window.setLoading(false);
  }
};
