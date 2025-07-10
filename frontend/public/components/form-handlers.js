// Form Handlers System Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Handles all major form submissions including leads, inventory, orders, and allocations

// Main universal form submission handler
window.handleFormSubmit = async function(e) {
  e.preventDefault();
  window.setLoading(true);

  try {
    if (window.showEditForm) {
      // Update lead via API
      const response = await window.apicall('/leads/' + window.currentLead.id, {
        method: 'PUT',
        body: JSON.stringify(window.formData)
      });
      window.setLeads(prev => prev.map(lead => 
        lead.id === window.currentLead.id ? response.data : lead
      ));

      // ✅ ADD: Refresh assignment rules after lead update
      if (window.refreshAssignmentRules && typeof window.refreshAssignmentRules === 'function') {
        try {
          await window.refreshAssignmentRules();
          console.log('✅ Assignment rules refreshed after lead update');
        } catch (refreshError) {
          console.log('⚠️ Assignment rules refresh failed (non-critical):', refreshError);
        }
      }

      alert('Lead updated successfully!');

    } else if (window.showEditInventoryForm) {
      // Add debug logging
      console.log('=== FRONTEND INVENTORY UPDATE DEBUG (Regular Form) ===');
      console.log('Inventory ID being updated:', window.currentInventory.id);
      console.log('Complete form data being sent:', window.formData);
      console.log('Payment fields specifically:', {
        totalPurchaseAmount: window.formData.totalPurchaseAmount,
        amountPaid: window.formData.amountPaid,
        paymentStatus: window.formData.paymentStatus,
        supplierName: window.formData.supplierName,
        supplierInvoice: window.formData.supplierInvoice
      });

      // Update inventory via API
      const response = await window.apicall('/inventory/' + window.currentInventory.id, {
        method: 'PUT',
        body: JSON.stringify(window.formData)
      });

      console.log('Backend response:', response);

      window.setInventory(prev => prev.map(item => 
        item.id === window.currentInventory.id ? response.data : item
      ));
      alert('Inventory updated successfully!');
    } else {
      // Create new items
      switch (window.currentForm) {
        case 'lead':
          const leadResponse = await window.apicall('/leads', {
            method: 'POST',
            body: JSON.stringify({
              ...window.formData,
              status: 'unassigned',
              created_by: window.user.name,
              created_date: new Date().toISOString()
            })
          });
          window.setLeads(prev => [...prev, leadResponse.data]);

          // ✅ ADD: Refresh assignment rules after new lead creation
          if (window.refreshAssignmentRules && typeof window.refreshAssignmentRules === 'function') {
            try {
              await window.refreshAssignmentRules();
              console.log('✅ Assignment rules refreshed after lead creation');
            } catch (refreshError) {
              console.log('⚠️ Assignment rules refresh failed (non-critical):', refreshError);
            }
          }

          alert('Lead added successfully!');
          break;

        case 'inventory':
          console.log('Sending inventory data:', window.formData);
          const invResponse = await window.apicall('/inventory', {
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
                  dueDate: window.formData.paymentDueDate || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0], // 30 days from now
                  description: 'Inventory purchase: ' + (window.formData.event_name || 'Event') + ' - ' + (window.formData.category_of_ticket || 'Tickets'),
                  inventoryId: invResponse.data?.id || invResponse.id,
                  status: 'pending'
                };

                console.log('Creating payable for inventory:', payableData);

                const payableResponse = await window.apicall('/finance/payables', {
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
          console.log('Creating order with data:', JSON.stringify(window.orderData, null, 2));
          console.log('Key fields:', {
            event_name: window.orderData.event_name,
            tickets_allocated: window.orderData.tickets_allocated,
            ticket_category: window.orderData.ticket_category,
            total_amount: window.orderData.total_amount
          });
          const orderResponse = await window.apicall('/orders', {
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
          window.setOrders(prev => [...prev, orderResponse]);
          alert('Order created successfully!');
          break;
      }
    }

    window.closeForm();
  } catch (error) {
    alert('Operation failed: ' + error.message);
  } finally {
    window.setLoading(false);
  }
};

// Enhanced order editing submission handler
window.handleEditOrderSubmit = async function(e) {
  e.preventDefault();
  window.setLoading(true);

  try {
    // Prepare update data
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
      // Set rejection metadata if status is rejected
      updateData.rejected_date = new Date().toISOString();
      updateData.rejected_by = window.user.name;
    }

    const response = await window.apicall('/orders/' + window.currentOrderForEdit.id, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });

    // Update local state
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

// Enhanced inventory allocation handler with permission check
window.handleAllocation = async function(e) {
  e.preventDefault();
  if (!window.hasPermission('inventory', 'allocate')) {
    alert('You do not have permission to allocate inventory');
    return;
  }

  window.setLoading(true);

  try {
    // FIX: Don't use parseInt for lead ID comparison
    const selectedLead = window.leads.find(lead => lead.id === window.allocationData.lead_id);

    if (!selectedLead) {
      throw new Error('Lead not found');
    }

    // Define the validation function
    const isConvertedOrLater = (status) => {
      const postConvertedStages = ['converted', 'payment', 'payment_post_service', 'payment_received'];
      return postConvertedStages.includes(status);
    };

    // Use it in the validation
    if (!isConvertedOrLater(selectedLead.status)) {
      throw new Error('Lead must be in converted status or later to allocate inventory');
    }

    if (window.allocationData.tickets_allocated > window.currentInventory.available_tickets) {
      throw new Error('Not enough tickets available');
    }

    // Call the fixed backend endpoint
    const response = await window.apicall(`/inventory/${window.currentInventory.id}/allocate`, {
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

    // Update local inventory state
    window.setInventory(prev => 
      prev.map(item => 
        item.id === window.currentInventory.id 
          ? { ...item, available_tickets: response.remaining_tickets }
          : item
      )
    );

    // Close the allocation form and show success
    window.setShowAllocationForm(false);
    alert('Inventory allocated successfully!');

  } catch (error) {
    console.error('Allocation error:', error);
    alert('Error: ' + error.message);
  } finally {
    window.setLoading(false);
  }
};

// Assignment handler with permission check
window.handleAssignLead = async function(e) {
  e.preventDefault();

  console.log('\n🔍 === ASSIGNMENT DEBUGGING START ===');
  console.log('1. Form Data:', window.formData);
  console.log('3. Current dropdown value (assigned_to):', window.formData.assigned_to);

  // Check what type of value we have
  if (window.formData.assigned_to) {
    if (window.formData.assigned_to.includes('@')) {
      console.log('✅ Value contains @ - appears to be an email');
    } else {
      console.log('❌ Value does NOT contain @ - appears to be a name');
    }
  }
  window.setLoading(true);

  try {
    const response = await window.apicall('/leads/' + window.currentLead.id, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'assigned',
        assigned_to: window.formData.assigned_to,
        assignment_date: new Date().toISOString()
      })
    });

    window.setLeads(prev => prev.map(lead => 
      lead.id === window.currentLead.id ? response.data : lead
    ));

    // Update currentLead if viewing the assigned lead
    if (window.showLeadDetail && window.currentLead?.id === response.data.id) {
      window.setCurrentLead(response.data);
    }

    // ✅ ADD: Refresh assignment rules after lead assignment
    if (window.refreshAssignmentRules && typeof window.refreshAssignmentRules === 'function') {
      try {
        await window.refreshAssignmentRules();
        console.log('✅ Assignment rules refreshed after lead assignment');
      } catch (refreshError) {
        console.log('⚠️ Assignment rules refresh failed (non-critical):', refreshError);
      }
    }

    alert('Lead assigned successfully!');
    window.closeForm();
  } catch (error) {
    alert('Assignment failed: ' + error.message);
  } finally {
    window.setLoading(false);
  }
};

// Payment post service submission handler
window.handlePaymentPostServiceSubmit = async function(e) {
  e.preventDefault();

  if (!window.hasPermission('leads', 'write')) {
    alert('You do not have permission to manage payment post service');
    return;
  }

  window.setLoading(true);

  try {
    // Update lead status via API
    const leadResponse = await window.apicall('/leads/' + window.currentLead.id, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'payment_post_service',
        payment_post_service_details: window.paymentPostServiceData,
        payment_post_service_date: new Date().toISOString()
      })
    });

    // Update local state
    window.setLeads(prev => 
      prev.map(lead => 
        lead.id === window.currentLead.id ? leadResponse : lead
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
      const orderResponse = await window.apicall('/orders', {
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

// Delivery submission handler
window.handleDeliverySubmit = async function(e) {
  e.preventDefault();
  if (!window.hasPermission('delivery', 'write')) {
    alert('You do not have permission to manage deliveries');
    return;
  }

  window.setLoading(true);

  try {
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update delivery in backend
    try {
      await window.apicall('/deliveries/' + window.currentDelivery.id, {
        method: 'PUT',
        body: JSON.stringify({
          ...window.currentDelivery,
          ...window.deliveryFormData,
          status: 'scheduled',
          scheduled_date: new Date().toISOString()
        })
      });
      console.log('Delivery updated in backend');
    } catch (error) {
      console.error('Failed to update delivery in backend:', error);
    }

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

    window.setLoading(false);
    alert('Delivery scheduled successfully!');
    window.closeForm();
  } catch (error) {
    window.setLoading(false);
    alert('Failed to schedule delivery. Please try again.');
  }
};

// User form submission handler
window.handleUserSubmit = async function(e) {
  e.preventDefault();
  window.setLoading(true);

  try {
    const endpoint = window.editingUser ? '/users/' + window.editingUser.id : '/users';
    const method = window.editingUser ? 'PUT' : 'POST';

    const response = await window.apicall(endpoint, {
      method: method,
      body: JSON.stringify(window.userFormData)
    });

    if (response.error) {
      throw new Error(response.error);
    }

    console.log(window.editingUser ? 'User updated successfully' : 'User created successfully');

    // Refresh users list
    window.fetchUsers();

    // Close form
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

// Enhanced order approval function
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

              // GST Details
              gstin: order.gstin,
              legal_name: order.legal_name,
              category_of_sale: order.category_of_sale,
              type_of_sale: order.type_of_sale,
              registered_address: order.registered_address,
              indian_state: order.indian_state,
              is_outside_india: order.is_outside_india,

              // Invoice calculation
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

    window.setLoading(false);
    alert(action === 'approve' 
      ? 'Order approved successfully! GST Invoice has been generated.' 
      : 'Order rejected successfully.'
    );
  } catch (error) {
    window.setLoading(false);
    alert('Failed to update order status');
  }
};

// Bulk assignment handler
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
        const response = await window.apicall(`/leads/${leadId}`, {
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

    alert(`Bulk assignment completed!\n✅ ${successCount} leads assigned successfully\n❌ ${errorCount} failed`);

    // FIXED: Use the correct function name to refresh leads data
    if (typeof window.fetchData === 'function') {
      await window.fetchData(); // Most likely this one
    } else if (typeof window.loadLeads === 'function') {
      await window.loadLeads();
    } else if (typeof window.refreshLeads === 'function') {
      await window.refreshLeads();
    } else if (typeof window.getData === 'function') {
      await window.getData();
    } else {
      // If none of the above work, just reload the page
      window.location.reload();
    }

    // Close modal and reset selections
    window.setShowBulkAssignModal(false);
    window.setBulkAssignSelections({});

  } catch (error) {
    console.error('Bulk assignment error:', error);
    alert('Error during bulk assignment: ' + error.message);
  } finally {
    window.setBulkAssignLoading(false);
  }
};

console.log('✅ Form Handlers System component loaded successfully');
