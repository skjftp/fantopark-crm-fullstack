// =============================================================================
// FIXED EDIT ORDER FORM - REPLACE components/edit-order-form.js
// =============================================================================

window.renderEditOrderForm = () => {
  if (!window.showEditOrderForm || !window.currentOrderForEdit) return null;

  // ✅ NO useState - use simple state management
  const orderEditData = window.orderEditData || window.currentOrderForEdit || {};
  
  const setOrderEditData = (newData) => {
    if (typeof newData === 'function') {
      window.orderEditData = newData(window.orderEditData || window.currentOrderForEdit || {});
    } else {
      window.orderEditData = newData;
    }
    // Force re-render
    if (window.setActiveTab) {
      window.setActiveTab(window.activeTab);
    }
  };

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
      window.orderEditData = null;
      
    } catch (error) {
      console.error('Edit order error:', error);
      alert('Failed to update order: ' + error.message);
    } finally {
      window.setLoading(false);
    }
  };

  const handleReassignToOriginal = () => {
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
    onClick: (e) => {
      if (e.target === e.currentTarget) {
        window.setShowEditOrderForm(false);
        window.orderEditData = null;
      }
    }
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
              window.orderEditData = null;
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

console.log('✅ FIXED Edit Order Form loaded - React Error #310 resolved');
