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

// ✅ ENHANCED ORDER APPROVAL FUNCTION
window.handleEnhancedOrderApproval = async function(orderId, action, notes = '') {
  if (!window.hasPermission('orders', 'approve')) {
    alert('You do not have permission to approve orders');
    return;
  }

  window.setLoading(true);

  try {
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    window.setOrders(prev => 
      prev.map(order => {
        if (order.id === orderId) {
          const updatedOrder = { 
            ...order, 
            status: newStatus, 
            approved_date: new Date().toISOString().split('T')[0],
            approval_notes: notes,
            approved_by: window.user.name
          };

          // Generate GST invoice if approved
          if (action === 'approve' && order.requires_gst_invoice) {
            const invoiceNumber = 'STTS/INV/' + new Date().getFullYear() + '/' + String(Date.now()).slice(-6);

            const newInvoice = {
              id: Date.now(),
              invoice_number: invoiceNumber,
              order_id: orderId,
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
              base_amount: order.base_amount,
              gst_calculation: order.gst_calculation,
              total_tax: order.total_tax,
              final_amount: order.final_amount,
              invoice_date: new Date().toISOString().split('T')[0],
              due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: 'generated',
              generated_by: window.user.name
            };

            window.setInvoices(prev => [...prev, newInvoice]);
            updatedOrder.invoice_id = newInvoice.id;
            updatedOrder.invoice_number = invoiceNumber;
          }

          return updatedOrder;
        }
        return order;
      })
    );

    alert(action === 'approve' 
      ? 'Order approved successfully! GST Invoice has been generated.' 
      : 'Order rejected successfully.'
    );
  } catch (error) {
    alert('Failed to update order status');
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
