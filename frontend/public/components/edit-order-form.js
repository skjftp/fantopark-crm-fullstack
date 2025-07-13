// Edit Order Form Component - EXACT match to screenshot with working state
window.renderEditOrderForm = () => {
  // ✅ Check if form should be shown
  const showEditOrderForm = window.showEditOrderForm || window.appState?.showEditOrderForm;
  const currentOrderForEdit = window.currentOrderForEdit || window.appState?.currentOrderForEdit;
  
  if (!showEditOrderForm || !currentOrderForEdit) {
    return null;
  }

  // ✅ FIXED: Initialize orderEditData with actual order data
  if (!window.orderEditData) {
    window.orderEditData = { ...currentOrderForEdit };
  }

  // ✅ Get users for dropdown
  const users = window.users || window.allUsers || [];
  if (users.length === 0 && window.fetchUsers) {
    window.fetchUsers();
  }

  // ✅ FIXED: Working input change handler
  const handleInputChange = (field, value) => {
  console.log(`🔄 Updating ${field} to:`, value);
  
  // Update the order edit data
  window.orderEditData = { ...window.orderEditData, [field]: value };
  
  console.log(`✅ Updated orderEditData.${field}:`, window.orderEditData[field]);
  
  // ✅ FORCE REACT RE-RENDER - This is the key fix!
  if (window.setActiveTab && window.activeTab) {
    const currentTab = window.activeTab;
    // Trigger minimal state change to force React to re-render
    setTimeout(() => window.setActiveTab(currentTab), 1);
  }
};


  // ✅ Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (window.handleEditOrderSubmit) {
      await window.handleEditOrderSubmit(e);
    }
  };

  // ✅ Close form handler
  const closeForm = () => {
    window.setShowEditOrderForm(false);
    window.orderEditData = null;
  };

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => e.target === e.currentTarget && closeForm()
  },
    React.createElement('div', { 
      className: 'bg-white rounded-lg p-6 w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-xl' 
    },
      // Header
      React.createElement('h2', { className: 'text-xl font-bold mb-4' }, 'Edit Order'),
      
      // Form - EXACT match to screenshot
      React.createElement('form', { onSubmit: handleSubmit },
        
        // Order Number - POPULATED
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Order Number'),
          React.createElement('input', {
            type: 'text',
            value: currentOrderForEdit.order_number || currentOrderForEdit.id || '',
            disabled: true,
            className: 'w-full px-3 py-2 border rounded-md bg-gray-100'
          })
        ),

        // Client Name - POPULATED
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Client Name'),
          React.createElement('input', {
            type: 'text',
            value: currentOrderForEdit.client_name || currentOrderForEdit.legal_name || '',
            disabled: true,
            className: 'w-full px-3 py-2 border rounded-md bg-gray-100'
          })
        ),

        // Current Status - POPULATED
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Current Status'),
          React.createElement('input', {
            type: 'text',
            value: currentOrderForEdit.status || '',
            disabled: true,
            className: 'w-full px-3 py-2 border rounded-md bg-gray-100'
          })
        ),

        // Status Change - NEW
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Change Status'),
          React.createElement('select', {
            value: window.orderEditData?.status || '',
            onChange: (e) => handleInputChange('status', e.target.value),
            className: 'w-full px-3 py-2 border rounded-md'
          },
            React.createElement('option', { value: 'pending_approval' }, 'Pending Approval'),
            React.createElement('option', { value: 'approved' }, 'Approved'),
            React.createElement('option', { value: 'service_assigned' }, 'Service Assigned'),
            React.createElement('option', { value: 'completed' }, 'Completed'),
            React.createElement('option', { value: 'rejected' }, 'Rejected')
          )
        ),

        // Assignment Options Section - EXACT match
        React.createElement('div', { className: 'mb-6' },
          React.createElement('h3', { className: 'text-lg font-medium mb-4' }, 'Assignment Options'),
          
          React.createElement('div', { className: 'mb-4' },
            React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Assign to User'),
            React.createElement('select', {
              value: window.orderEditData?.assigned_to || '',
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
          )
        ),

        // Total Amount - EDITABLE
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Total Amount'),
          React.createElement('input', {
            type: 'number',
            value: window.orderEditData?.total_amount || window.orderEditData?.final_amount || '',
            onChange: (e) => handleInputChange('total_amount', e.target.value),
            className: 'w-full px-3 py-2 border rounded-md',
            step: '0.01'
          })
        ),

        // Notes - EDITABLE
        React.createElement('div', { className: 'mb-6' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Notes'),
          React.createElement('textarea', {
            value: window.orderEditData?.notes || '',
            onChange: (e) => handleInputChange('notes', e.target.value),
            className: 'w-full px-3 py-2 border rounded-md',
            rows: 3,
            placeholder: 'Add any notes about this order...'
          })
        ),

        // Buttons - EXACT match to screenshot
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

console.log('✅ Edit Order Form - EXACT screenshot match with populated fields');
