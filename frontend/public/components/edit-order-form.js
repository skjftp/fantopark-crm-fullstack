// ✅ FIXED: Edit Order Form - Removed force re-render patterns

window.renderEditOrderForm = () => {
  // ✅ Check if form should be shown
  const showEditOrderForm = window.showEditOrderForm || window.appState?.showEditOrderForm;
  const currentOrderForEdit = window.currentOrderForEdit || window.appState?.currentOrderForEdit;
  
  if (!showEditOrderForm || !currentOrderForEdit) {
    return null;
  }

  // ✅ FIXED: Use React-style state management
  // Initialize with React useState pattern
  if (!window.editOrderState) {
    window.editOrderState = {
      ...currentOrderForEdit,
      lastUpdate: Date.now()
    };
  }

  // ✅ Get users for dropdown
  const users = window.users || window.allUsers || [];
  if (users.length === 0 && window.fetchUsers) {
    window.fetchUsers();
  }

  // ✅ FIXED: Proper state update handler without force re-render
  const handleInputChange = (field, value) => {
    console.log(`🔄 Updating ${field} to:`, value);
    
    // Update both the edit state and the global orderEditData
    window.editOrderState = { 
      ...window.editOrderState, 
      [field]: value,
      lastUpdate: Date.now() // This forces React to see a change
    };
    
    window.orderEditData = { ...window.editOrderState };
    
    console.log(`✅ Updated ${field}:`, window.editOrderState[field]);
    
    // ✅ FIXED: Trigger re-render using proper React mechanism
    if (window.renderApp) {
      // Use the main app render function instead of setLoading hack
      window.renderApp();
    } else if (window.setShowEditOrderForm) {
      // Alternative: toggle the form state to trigger re-render
      const currentState = window.showEditOrderForm;
      window.setShowEditOrderForm(currentState);
    }
  };

  // ✅ Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (window.handleEditOrderSubmit) {
      // Make sure orderEditData has the latest state
      window.orderEditData = { ...window.editOrderState };
      await window.handleEditOrderSubmit(e);
    }
  };

  // ✅ Close form handler
  const closeForm = () => {
    window.setShowEditOrderForm(false);
    window.orderEditData = null;
    window.editOrderState = null; // Clear the state
  };

  // ✅ Current values with fallbacks
  const currentStatus = window.editOrderState?.status || currentOrderForEdit?.status || '';
  const currentAssignedTo = window.editOrderState?.assigned_to || currentOrderForEdit?.assigned_to || '';
  const currentTotalAmount = window.editOrderState?.total_amount || window.editOrderState?.final_amount || currentOrderForEdit?.total_amount || currentOrderForEdit?.final_amount || '';
  const currentNotes = window.editOrderState?.notes || currentOrderForEdit?.notes || '';

  console.log('🔍 Rendering form with values:', {
    status: currentStatus,
    assigned_to: currentAssignedTo,
    total_amount: currentTotalAmount,
    lastUpdate: window.editOrderState?.lastUpdate
  });

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => e.target === e.currentTarget && closeForm()
  },
    React.createElement('div', { 
      className: 'bg-white rounded-lg p-6 w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-xl',
      key: `edit-form-${window.editOrderState?.lastUpdate || Date.now()}` // Force re-render with key
    },
      // Header
      React.createElement('div', { className: 'flex justify-between items-center mb-6' },
        React.createElement('h2', { className: 'text-2xl font-bold text-gray-900' }, 'Edit Order'),
        React.createElement('button', {
          onClick: closeForm,
          className: 'text-gray-400 hover:text-gray-600 text-2xl'
        }, '✕')
      ),

      // Form
      React.createElement('form', { onSubmit: handleSubmit },
        
        // Order Number - READ ONLY
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Order Number'),
          React.createElement('input', {
            type: 'text',
            value: currentOrderForEdit?.order_number || '',
            readOnly: true,
            className: 'w-full px-3 py-2 border rounded-md bg-gray-50'
          })
        ),

        // Client Name - READ ONLY
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Client Name'),
          React.createElement('input', {
            type: 'text',
            value: currentOrderForEdit?.client_name || '',
            readOnly: true,
            className: 'w-full px-3 py-2 border rounded-md bg-gray-50'
          })
        ),

        // Event Name - READ ONLY
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Event'),
          React.createElement('input', {
            type: 'text',
            value: currentOrderForEdit?.event_name || '',
            readOnly: true,
            className: 'w-full px-3 py-2 border rounded-md bg-gray-50'
          })
        ),

        // Status - EDITABLE
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Status'),
          React.createElement('select', {
            value: currentStatus,
            onChange: (e) => handleInputChange('status', e.target.value),
            className: 'w-full px-3 py-2 border rounded-md'
          },
            React.createElement('option', { value: 'pending' }, 'Pending'),
            React.createElement('option', { value: 'approved' }, 'Approved'),
            React.createElement('option', { value: 'confirmed' }, 'Confirmed'),
            React.createElement('option', { value: 'rejected' }, 'Rejected'),
            React.createElement('option', { value: 'delivered' }, 'Delivered'),
            React.createElement('option', { value: 'cancelled' }, 'Cancelled')
          )
        ),

        // Assigned To - EDITABLE  
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Assigned To'),
          React.createElement('select', {
            value: currentAssignedTo,
            onChange: (e) => handleInputChange('assigned_to', e.target.value),
            className: 'w-full px-3 py-2 border rounded-md'
          },
            React.createElement('option', { value: '' }, 'Select Assignee'),
            users.filter(u => u.status === 'active').map(user =>
              React.createElement('option', { 
                key: user.id || user.email, 
                value: user.email 
              }, user.name)
            )
          )
        ),

        // Total Amount - EDITABLE
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Total Amount'),
          React.createElement('input', {
            type: 'number',
            value: currentTotalAmount,
            onChange: (e) => handleInputChange('total_amount', e.target.value),
            className: 'w-full px-3 py-2 border rounded-md',
            step: '0.01'
          })
        ),

        // Notes - EDITABLE
        React.createElement('div', { className: 'mb-6' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Notes'),
          React.createElement('textarea', {
            value: currentNotes,
            onChange: (e) => handleInputChange('notes', e.target.value),
            className: 'w-full px-3 py-2 border rounded-md',
            rows: 3,
            placeholder: 'Add any notes about this order...'
          })
        ),

        // Buttons
        React.createElement('div', { className: 'flex justify-end space-x-3' },
          React.createElement('button', {
            type: 'button',
            onClick: closeForm,
            className: 'px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600'
          }, 'Cancel'),
          
          React.createElement('button', {
            type: 'submit',
            disabled: window.loading,
            className: 'px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50'
          }, window.loading ? 'Updating...' : 'Update Order')
        )
      )
    )
  );
};

console.log('✅ Edit Order Form - FIXED with proper state management');

// ✅ ALSO ADD: Reset function to clear state when opening form
window.openEditOrderForm = function(order) {
  console.log('✏️ Opening edit form for order:', order.id);
  
  // Clear any existing state
  window.editOrderState = null;
  window.orderEditData = null;
  
  // Set the order to edit
  window.setCurrentOrderForEdit(order);
  window.setShowEditOrderForm(true);
  
  // Initialize fresh state
  setTimeout(() => {
    window.editOrderState = {
      ...order,
      lastUpdate: Date.now()
    };
    window.orderEditData = { ...order };
  }, 100);
};
