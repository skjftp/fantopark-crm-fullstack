// Enhanced Edit Order Form Component for FanToPark CRM
// COMPLETE VERSION - Preserves all original functionality, fixes only state management

window.renderEditOrderForm = () => {
  // ✅ Check if form should be shown
  const showEditOrderForm = window.showEditOrderForm || window.appState?.showEditOrderForm;
  const currentOrderForEdit = window.currentOrderForEdit || window.appState?.currentOrderForEdit;
  
  if (!showEditOrderForm || !currentOrderForEdit) {
    return null;
  }

  // ✅ FIXED: Initialize orderEditData properly but use window state instead of React useState
  if (!window.orderEditData) {
    window.orderEditData = { ...currentOrderForEdit };
  }

  // ✅ Get users and ensure they're loaded
  const users = window.users || window.allUsers || [];
  if (users.length === 0 && window.fetchUsers) {
    window.fetchUsers();
  }

  // ✅ FIXED: State setter that works with window state
  const setOrderEditData = (updater) => {
    if (typeof updater === 'function') {
      window.orderEditData = updater(window.orderEditData || currentOrderForEdit);
    } else {
      window.orderEditData = updater;
    }
    
    // Force re-render by toggling loading briefly
    if (window.setLoading) {
      window.setLoading(true);
      setTimeout(() => window.setLoading(false), 1);
    }
  };

  // ✅ ORIGINAL: Form submission handler
  const handleEditOrderSubmit = async (e) => {
    e.preventDefault();
    
    if (!window.hasPermission('orders', 'write')) {
      alert('You do not have permission to edit orders');
      return;
    }

    try {
      window.setLoading(true);
      
      const response = await window.apiCall(`/orders/${window.orderEditData.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...window.orderEditData,
          updated_date: new Date().toISOString(),
          updated_by: window.user.name || window.user.email
        })
      });

      // Update local state
      window.setOrders(prev => 
        prev.map(order => 
          order.id === window.orderEditData.id ? (response.data || response || window.orderEditData) : order
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

  // ✅ ORIGINAL: Reassign to original functionality
  const handleReassignToOriginal = async () => {
    const originalAssignee = window.orderEditData.original_assignee || window.orderEditData.created_by;
    
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

  // ✅ ORIGINAL: Filter users appropriately
  const allUsers = (users || []).filter(u => u.status === 'active');
  const supplyUsers = allUsers.filter(u => ['supply_executive', 'supply_sales_service_manager'].includes(u.role));
  const financeUsers = allUsers.filter(u => ['finance_manager', 'finance_executive'].includes(u.role));

  // ✅ ORIGINAL: Close form handler
  const closeForm = () => {
    window.setShowEditOrderForm(false);
    window.setCurrentOrderForEdit(null);
    window.orderEditData = null;
  };

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => e.target === e.currentTarget && closeForm()
  },
    React.createElement('div', { 
      className: 'bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-xl' 
    },
      // ✅ ORIGINAL: Header with close button
      React.createElement('div', { className: 'flex justify-between items-center mb-6' },
        React.createElement('h2', { className: 'text-xl font-bold text-gray-900 dark:text-white' }, 'Edit Order'),
        React.createElement('button', {
          onClick: closeForm,
          className: 'text-gray-400 hover:text-gray-600 text-2xl'
        }, '✕')
      ),
      
      // ✅ ORIGINAL: Form with all sections
      React.createElement('form', { onSubmit: handleEditOrderSubmit },
        
        // ✅ ORIGINAL: Order Number (Read-only)
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300' }, 'Order Number'),
          React.createElement('input', {
            type: 'text',
            value: window.orderEditData?.order_number || '',
            disabled: true,
            className: 'w-full px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          })
        ),

        // ✅ ORIGINAL: Client Name (Read-only)
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300' }, 'Client Name'),
          React.createElement('input', {
            type: 'text',
            value: window.orderEditData?.client_name || window.orderEditData?.lead_name || '',
            disabled: true,
            className: 'w-full px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          })
        ),

        // ✅ ORIGINAL: Current Status (Read-only)
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300' }, 'Current Status'),
          React.createElement('input', {
            type: 'text',
            value: window.orderEditData?.status || '',
            disabled: true,
            className: 'w-full px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          })
        ),

        // ✅ ORIGINAL: Assignment Section with all functionality
        React.createElement('div', { className: 'mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg' },
          React.createElement('h3', { className: 'text-lg font-medium mb-4 text-gray-900 dark:text-white' }, 'Assignment Options'),
          
          // ✅ ORIGINAL: Current Assignee Info
          window.orderEditData?.assigned_to && React.createElement('div', { className: 'mb-3 text-sm text-gray-600 dark:text-gray-400' },
            `Currently assigned to: ${window.orderEditData.assigned_to}`
          ),

          // ✅ ORIGINAL: Original Assignee Info
          (window.orderEditData?.original_assignee || window.orderEditData?.created_by) && 
          React.createElement('div', { className: 'mb-3 text-sm text-gray-600 dark:text-gray-400' },
            `Original assignee: ${window.orderEditData.original_assignee || window.orderEditData.created_by}`
          ),

          // ✅ ORIGINAL: Reassign to Original Button
          (window.orderEditData?.original_assignee || window.orderEditData?.created_by) && 
          window.orderEditData?.assigned_to !== (window.orderEditData?.original_assignee || window.orderEditData?.created_by) &&
          React.createElement('button', {
            type: 'button',
            onClick: handleReassignToOriginal,
            className: 'mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mr-3',
            title: 'Reassign to the original sales person who created this order'
          }, '↩️ Reassign to Original Person'),

          // ✅ ORIGINAL: Quick Assignment Buttons for Supply Team
          window.orderEditData?.status === 'approved' && React.createElement('div', { className: 'mb-4' },
            React.createElement('label', { className: 'block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300' }, 'Quick Assign to Supply Team'),
            React.createElement('div', { className: 'flex flex-wrap gap-2 mb-3' },
              supplyUsers.map(user =>
                React.createElement('button', {
                  key: user.email,
                  type: 'button',
                  onClick: () => setOrderEditData(prev => ({ ...prev, assigned_to: user.email })),
                  className: `px-3 py-1 text-xs rounded-full transition-colors ${
                    window.orderEditData?.assigned_to === user.email 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`,
                  title: `Assign to ${user.name} (${user.role})`
                }, user.name)
              )
            )
          ),

          // ✅ ORIGINAL: Finance Team Assignment for pending orders
          window.orderEditData?.status === 'pending_approval' && React.createElement('div', { className: 'mb-4' },
            React.createElement('label', { className: 'block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300' }, 'Assign to Finance Team'),
            React.createElement('div', { className: 'flex flex-wrap gap-2 mb-3' },
              financeUsers.map(user =>
                React.createElement('button', {
                  key: user.email,
                  type: 'button',
                  onClick: () => setOrderEditData(prev => ({ ...prev, assigned_to: user.email })),
                  className: `px-3 py-1 text-xs rounded-full transition-colors ${
                    window.orderEditData?.assigned_to === user.email 
                      ? 'bg-green-600 text-white' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`,
                  title: `Assign to ${user.name} (${user.role})`
                }, user.name)
              )
            )
          ),

          // ✅ ORIGINAL: Full User Dropdown
          React.createElement('div', { className: 'mb-4' },
            React.createElement('label', { className: 'block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300' }, 'Assign to Any User'),
            React.createElement('select', {
              value: window.orderEditData?.assigned_to || '',
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
          ),

          // ✅ ORIGINAL: Assignment Notes
          React.createElement('div', { className: 'mb-4' },
            React.createElement('label', { className: 'block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300' }, 'Assignment Notes'),
            React.createElement('textarea', {
              value: window.orderEditData?.assignment_notes || '',
              onChange: (e) => setOrderEditData(prev => ({ ...prev, assignment_notes: e.target.value })),
              className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
              rows: 2,
              placeholder: 'Add notes about this assignment...'
            })
          )
        ),

        // ✅ ORIGINAL: Order Details Section
        React.createElement('div', { className: 'mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg' },
          React.createElement('h3', { className: 'text-lg font-medium mb-4 text-gray-900 dark:text-white' }, 'Order Details'),
          
          // ✅ ORIGINAL: Event Information
          React.createElement('div', { className: 'grid grid-cols-2 gap-4 mb-4' },
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300' }, 'Event Name'),
              React.createElement('input', {
                type: 'text',
                value: window.orderEditData?.event_name || '',
                onChange: (e) => setOrderEditData(prev => ({ ...prev, event_name: e.target.value })),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500'
              })
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300' }, 'Event Date'),
              React.createElement('input', {
                type: 'date',
                value: window.orderEditData?.event_date || '',
                onChange: (e) => setOrderEditData(prev => ({ ...prev, event_date: e.target.value })),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500'
              })
            )
          ),

          // ✅ ORIGINAL: Financial Information
          React.createElement('div', { className: 'grid grid-cols-2 gap-4 mb-4' },
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300' }, 'Total Amount'),
              React.createElement('input', {
                type: 'number',
                value: window.orderEditData?.total_amount || window.orderEditData?.final_amount || '',
                onChange: (e) => setOrderEditData(prev => ({ ...prev, total_amount: e.target.value })),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                step: '0.01'
              })
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300' }, 'Advance Amount'),
              React.createElement('input', {
                type: 'number',
                value: window.orderEditData?.advance_amount || '',
                onChange: (e) => setOrderEditData(prev => ({ ...prev, advance_amount: e.target.value })),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                step: '0.01'
              })
            )
          ),

          // ✅ ORIGINAL: Tickets Information
          React.createElement('div', { className: 'grid grid-cols-2 gap-4 mb-4' },
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300' }, 'Tickets Allocated'),
              React.createElement('input', {
                type: 'number',
                value: window.orderEditData?.tickets_allocated || '',
                onChange: (e) => setOrderEditData(prev => ({ ...prev, tickets_allocated: e.target.value })),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500'
              })
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300' }, 'Price per Ticket'),
              React.createElement('input', {
                type: 'number',
                value: window.orderEditData?.price_per_ticket || '',
                onChange: (e) => setOrderEditData(prev => ({ ...prev, price_per_ticket: e.target.value })),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                step: '0.01'
              })
            )
          )
        ),

        // ✅ ORIGINAL: Priority and Category Section
        React.createElement('div', { className: 'mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg' },
          React.createElement('h3', { className: 'text-lg font-medium mb-4 text-gray-900 dark:text-white' }, 'Order Classification'),
          
          React.createElement('div', { className: 'grid grid-cols-2 gap-4 mb-4' },
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300' }, 'Priority'),
              React.createElement('select', {
                value: window.orderEditData?.priority || 'medium',
                onChange: (e) => setOrderEditData(prev => ({ ...prev, priority: e.target.value })),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500'
              },
                React.createElement('option', { value: 'low' }, 'Low'),
                React.createElement('option', { value: 'medium' }, 'Medium'),
                React.createElement('option', { value: 'high' }, 'High'),
                React.createElement('option', { value: 'urgent' }, 'Urgent')
              )
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300' }, 'Category'),
              React.createElement('select', {
                value: window.orderEditData?.category_of_sale || '',
                onChange: (e) => setOrderEditData(prev => ({ ...prev, category_of_sale: e.target.value })),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500'
              },
                React.createElement('option', { value: '' }, 'Select Category'),
                React.createElement('option', { value: 'B2C' }, 'B2C - Individual'),
                React.createElement('option', { value: 'Corporate' }, 'Corporate'),
                React.createElement('option', { value: 'Group' }, 'Group Booking'),
                React.createElement('option', { value: 'VIP' }, 'VIP Package')
              )
            )
          )
        ),

        // ✅ ORIGINAL: Notes Section
        React.createElement('div', { className: 'mb-6' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300' }, 'Order Notes'),
          React.createElement('textarea', {
            value: window.orderEditData?.notes || '',
            onChange: (e) => setOrderEditData(prev => ({ ...prev, notes: e.target.value })),
            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
            rows: 4,
            placeholder: 'Add any notes about this order...'
          })
        ),

        // ✅ ORIGINAL: Internal Notes (Admin Only)
        window.hasPermission('orders', 'admin') && React.createElement('div', { className: 'mb-6' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300' }, 'Internal Notes (Admin Only)'),
          React.createElement('textarea', {
            value: window.orderEditData?.internal_notes || '',
            onChange: (e) => setOrderEditData(prev => ({ ...prev, internal_notes: e.target.value })),
            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 bg-yellow-50 dark:bg-yellow-900',
            rows: 3,
            placeholder: 'Internal notes visible only to administrators...'
          })
        ),

        // ✅ ORIGINAL: Action Buttons
        React.createElement('div', { className: 'flex justify-end space-x-3 pt-4 border-t border-gray-200' },
          React.createElement('button', {
            type: 'button',
            onClick: closeForm,
            className: 'px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors'
          }, 'Cancel'),
          
          React.createElement('button', {
            type: 'submit',
            disabled: window.loading,
            className: 'px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50'
          }, window.loading ? 'Updating...' : 'Update Order')
        )
      )
    )
  );
};

console.log('✅ COMPLETE Edit Order Form loaded - All original functionality preserved with working state management');
