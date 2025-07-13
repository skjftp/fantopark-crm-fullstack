// =============================================================================
// ENHANCED EDIT ORDER FORM - REPLACE components/edit-order-form.js
// =============================================================================
// Enhanced Edit Order Form Component with Full User List and Reassignment Options

window.renderEditOrderForm = () => {
  if (!window.showEditOrderForm || !window.currentOrderForEdit) return null;

  const { useState } = React;
  const [orderEditData, setOrderEditData] = useState(window.currentOrderForEdit || {});

  const handleEditOrderSubmit = async (e) => {
    e.preventDefault();
    
    if (!window.hasPermission('orders', 'write')) {
      alert('You do not have permission to edit orders');
      return;
    }

    try {
      window.setLoading(true);
      
      const response = await window.apiCall(`/orders/${orderEditData.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...orderEditData,
          updated_date: new Date().toISOString(),
          updated_by: window.user.name || window.user.email
        })
      });

      // Update local state
      window.setOrders(prev => 
        prev.map(order => 
          order.id === orderEditData.id ? (response.data || response || orderEditData) : order
        )
      );

      alert('Order updated successfully!');
      window.setShowEditOrderForm(false);
      window.setCurrentOrderForEdit(null);
      
    } catch (error) {
      console.error('Edit order error:', error);
      alert('Failed to update order: ' + error.message);
    } finally {
      window.setLoading(false);
    }
  };

  const handleReassignToOriginal = async () => {
    const originalAssignee = orderEditData.original_assignee || orderEditData.created_by;
    
    if (!originalAssignee) {
      alert('No original assignee found for this order');
      return;
    }

    if (confirm(`Reassign this order back to ${originalAssignee}?`)) {
      setOrderEditData(prev => ({ 
        ...prev, 
        assigned_to: originalAssignee,
        reassigned_to_original: true,
        reassignment_date: new Date().toISOString(),
        reassigned_by: window.user.name || window.user.email
      }));
    }
  };

  // Get all active users for assignment
  const allUsers = (window.users || []).filter(u => u.status === 'active');

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => e.target === e.currentTarget && window.setShowEditOrderForm(false)
  },
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[95vh] overflow-y-auto' },
      React.createElement('h2', { className: 'text-xl font-bold mb-4 text-gray-900 dark:text-white' }, 'Edit Order'),
      
      React.createElement('form', { onSubmit: handleEditOrderSubmit },
        // Order Number (Read-only)
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300' }, 'Order Number'),
          React.createElement('input', {
            type: 'text',
            value: orderEditData.order_number || '',
            disabled: true,
            className: 'w-full px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          })
        ),

        // Client Name (Read-only)
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300' }, 'Client Name'),
          React.createElement('input', {
            type: 'text',
            value: orderEditData.client_name || orderEditData.lead_name || '',
            disabled: true,
            className: 'w-full px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          })
        ),

        // Current Status (Read-only)
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300' }, 'Current Status'),
          React.createElement('input', {
            type: 'text',
            value: orderEditData.status || '',
            disabled: true,
            className: 'w-full px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          })
        ),

        // Assignment Section
        React.createElement('div', { className: 'mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg' },
          React.createElement('h3', { className: 'text-lg font-medium mb-4 text-gray-900 dark:text-white' }, 'Assignment Options'),
          
          // Current Assignee Info
          orderEditData.assigned_to && React.createElement('div', { className: 'mb-3 text-sm text-gray-600 dark:text-gray-400' },
            `Currently assigned to: ${orderEditData.assigned_to}`
          ),

          // Original Assignee Info
          (orderEditData.original_assignee || orderEditData.created_by) && React.createElement('div', { className: 'mb-3 text-sm text-gray-600 dark:text-gray-400' },
            `Original assignee: ${orderEditData.original_assignee || orderEditData.created_by}`
          ),

          // Reassign to Original Button
          (orderEditData.original_assignee || orderEditData.created_by) && 
          React.createElement('button', {
            type: 'button',
            onClick: handleReassignToOriginal,
            className: 'mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mr-3',
            title: 'Reassign to the original sales person who created this order'
          }, '↩️ Reassign to Original Person'),

          // Assign to Any User Dropdown
          React.createElement('div', { className: 'mb-4' },
            React.createElement('label', { className: 'block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300' }, 'Assign to User'),
            React.createElement('select', {
              value: orderEditData.assigned_to || '',
              onChange: (e) => setOrderEditData(prev => ({ ...prev, assigned_to: e.target.value })),
              className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500'
            },
              React.createElement('option', { value: '' }, 'Select Assignee'),
              allUsers.map(user =>
                React.createElement('option', { 
                  key: user.id || user.email, 
                  value: user.email 
                }, `${user.name} (${window.getRoleDisplayName ? window.getRoleDisplayName(user.role) : user.role})`)
              )
            )
          )
        ),

        // Order Details Section
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300' }, 'Total Amount'),
          React.createElement('input', {
            type: 'number',
            value: orderEditData.total_amount || orderEditData.final_amount || '',
            onChange: (e) => setOrderEditData(prev => ({ ...prev, total_amount: e.target.value })),
            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
            step: '0.01'
          })
        ),

        // Notes Section
        React.createElement('div', { className: 'mb-6' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300' }, 'Notes'),
          React.createElement('textarea', {
            value: orderEditData.notes || '',
            onChange: (e) => setOrderEditData(prev => ({ ...prev, notes: e.target.value })),
            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
            rows: 3,
            placeholder: 'Add any notes about this order...'
          })
        ),

        // Action Buttons
        React.createElement('div', { className: 'flex justify-end space-x-3' },
          React.createElement('button', {
            type: 'button',
            onClick: () => {
              window.setShowEditOrderForm(false);
              window.setCurrentOrderForEdit(null);
            },
            className: 'px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors'
          }, 'Cancel'),
          
          React.createElement('button', {
            type: 'submit',
            className: 'px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors'
          }, 'Update Order')
        )
      )
    )
  );
};

// =============================================================================
// ORDER WORKFLOW AUTOMATION FUNCTIONS
// =============================================================================

// Auto-assignment logic for new orders
window.autoAssignOrderBasedOnType = async function(order, leadStatus) {
  console.log('🔄 Auto-assigning order based on type:', order.order_type, 'Lead status:', leadStatus);

  let assignees = [];
  let newStatus = order.status;

  try {
    if (leadStatus === 'payment_received') {
      // Payment received orders go to finance managers
      assignees = window.users.filter(u => 
        u.role === 'finance_manager' && u.status === 'active'
      );
      newStatus = 'pending_approval';
      
    } else if (leadStatus === 'payment_post_service' || order.order_type === 'payment_post_service') {
      // Post service payment orders go to supply_sales_service_manager ONLY for initial approval
      assignees = window.users.filter(u => 
        u.role === 'supply_sales_service_manager' && u.status === 'active'
      );
      newStatus = 'pending_approval';
    }

    if (assignees.length > 0) {
      // Use round-robin or assign to first available
      const selectedAssignee = assignees[0];
      
      const updateData = {
        assigned_to: selectedAssignee.email,
        status: newStatus,
        auto_assigned: true,
        auto_assignment_date: new Date().toISOString(),
        auto_assignment_reason: `Auto-assigned based on ${leadStatus} status`
      };

      // Update order
      const response = await window.apiCall(`/orders/${order.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      console.log('✅ Order auto-assigned to:', selectedAssignee.email);
      return response.data || response;
    }

  } catch (error) {
    console.error('❌ Auto-assignment failed:', error);
  }

  return order;
};

// Order approval workflow
window.handleOrderApproval = async function(orderId, action, notes = '') {
  if (!window.hasPermission('orders', 'approve')) {
    alert('You do not have permission to approve/reject orders');
    return;
  }

  try {
    window.setLoading(true);
    
    const currentOrder = window.orders.find(o => o.id === orderId);
    if (!currentOrder) {
      throw new Error('Order not found');
    }

    const isApproval = action === 'approve';
    let updateData = {
      status: isApproval ? 'approved' : 'rejected',
      [isApproval ? 'approved_by' : 'rejected_by']: window.user.name || window.user.email,
      [isApproval ? 'approval_date' : 'rejection_date']: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };

    if (!isApproval) {
      updateData.rejection_reason = notes || 'No reason provided';
      
      // On rejection, reassign to original sales person
      if (currentOrder.original_assignee || currentOrder.created_by) {
        updateData.assigned_to = currentOrder.original_assignee || currentOrder.created_by;
        updateData.reassigned_to_original = true;
        updateData.reassignment_reason = 'Order rejected, returned to original assignee';
      }
    } else {
      // On approval, auto-assign based on order type
      if (currentOrder.order_type === 'payment_post_service') {
        // Post service payment approved → assign to BOTH supply roles for execution
        const supplyManagers = window.users.filter(u => 
          (u.role === 'supply_sales_service_manager' || u.role === 'supply_service_manager') && 
          u.status === 'active'
        );
        if (supplyManagers.length > 0) {
          updateData.assigned_to = supplyManagers[0].email;
          updateData.auto_assigned_after_approval = true;
        }
      } else {
        // Regular payment received order approved → assign to BOTH supply roles
        const supplyManagers = window.users.filter(u => 
          (u.role === 'supply_sales_service_manager' || u.role === 'supply_service_manager') && 
          u.status === 'active'
        );
        if (supplyManagers.length > 0) {
          updateData.assigned_to = supplyManagers[0].email;
          updateData.auto_assigned_after_approval = true;
        }
      }
    }

    // API call to update order
    const response = await window.apiCall(`/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });

    // Update local state
    window.setOrders(prev => 
      prev.map(order => 
        order.id === orderId 
          ? { ...order, ...updateData, ...(response.data || response) }
          : order
      )
    );

    const message = isApproval 
      ? '✅ Order approved successfully!' 
      : '❌ Order rejected and returned to original assignee';
    
    alert(message);
    
    // Refresh data to ensure consistency
    if (window.fetchOrders) {
      window.fetchOrders();
    }

  } catch (error) {
    console.error('Order approval/rejection error:', error);
    alert('Failed to process order: ' + error.message);
  } finally {
    window.setLoading(false);
  }
};

// Enhanced order assignment function
window.assignOrderToUser = async function(orderId, userEmail, reason = '') {
  if (!window.hasPermission('orders', 'assign')) {
    alert('You do not have permission to assign orders');
    return;
  }

  try {
    window.setLoading(true);
    
    const updateData = {
      assigned_to: userEmail,
      assignment_date: new Date().toISOString(),
      assigned_by: window.user.name || window.user.email,
      assignment_reason: reason || 'Manual assignment',
      updated_date: new Date().toISOString()
    };

    const response = await window.apiCall(`/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });

    // Update local state
    window.setOrders(prev => 
      prev.map(order => 
        order.id === orderId 
          ? { ...order, ...updateData, ...(response.data || response) }
          : order
      )
    );

    alert('Order assigned successfully!');
    
  } catch (error) {
    console.error('Order assignment error:', error);
    alert('Failed to assign order: ' + error.message);
  } finally {
    window.setLoading(false);
  }
};

// Enhanced order creation with proper workflow integration
window.createOrderFromLead = async function(lead, orderType = 'standard') {
  try {
    // Store original assignee for workflow purposes
    const originalAssignee = lead.assigned_to;
    
    const orderData = {
      order_number: (orderType === 'payment_post_service' ? 'PST-' : 'ORD-') + Date.now(),
      lead_id: lead.id,
      client_name: lead.name,
      client_email: lead.email,
      client_phone: lead.phone,
      event_name: lead.lead_for_event || 'Service',
      event_date: lead.event_date || new Date().toISOString().split('T')[0],
      total_amount: lead.potential_value || 0,
      order_type: orderType,
      status: 'pending_approval',
      created_date: new Date().toISOString(),
      created_by: window.user.name || window.user.email,
      original_assignee: originalAssignee, // Store for workflow
      assigned_to: '', // Will be auto-assigned by workflow
      requires_gst_invoice: true
    };

    // Create order
    const response = await window.apiCall('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });

    const newOrder = response.data || response || orderData;
    
    // Auto-assign based on workflow
    const finalOrder = await window.autoAssignOrderBasedOnType(newOrder, lead.status);
    
    // Update local state
    window.setOrders(prev => [...prev, finalOrder]);
    
    return finalOrder;
    
  } catch (error) {
    console.error('Order creation failed:', error);
    throw error;
  }
};

console.log('✅ Enhanced Order Assignment Workflow System loaded successfully');
