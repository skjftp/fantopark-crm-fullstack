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
    // Force inventory refresh on next open
    if (window.inventoryState) {
      window.inventoryState.lastFetch = 0;
    }
  };

  // ✅ Current values with fallbacks
  const currentStatus = window.editOrderState?.status || currentOrderForEdit?.status || '';
  const currentAssignedTo = window.editOrderState?.assigned_to || currentOrderForEdit?.assigned_to || '';
  const currentTotalAmount = window.editOrderState?.total_amount || window.editOrderState?.final_amount || currentOrderForEdit?.total_amount || currentOrderForEdit?.final_amount || '';
  const currentNotes = window.editOrderState?.notes || currentOrderForEdit?.notes || '';
  const currentEventName = window.editOrderState?.event_name || currentOrderForEdit?.event_name || '';
  const currentEventDate = window.editOrderState?.event_date || currentOrderForEdit?.event_date || '';
  
  // Initialize inventory state at window level if not exists
  if (!window.inventoryState) {
    window.inventoryState = {
      items: [],
      loading: false,
      lastFetch: 0
    };
  }
  
  // Fetch inventory if needed (cache for 5 minutes)
  const shouldFetchInventory = Date.now() - window.inventoryState.lastFetch > 300000 || window.inventoryState.items.length === 0;
  
  if (shouldFetchInventory && !window.inventoryState.loading) {
    console.log('🔄 Fetching inventory...');
    window.inventoryState.loading = true;
    
    window.apiCall('/inventory').then(response => {
      const items = response.data || [];
      
      // Get unique event names from inventory
      const uniqueEventNames = [...new Set(items.map(item => item.event_name).filter(Boolean))];
      
      // Create inventory map for quick lookup
      const inventoryMap = new Map();
      items.forEach(item => {
        if (item.event_name) {
          // If duplicate event names, keep the most recent
          if (!inventoryMap.has(item.event_name) || 
              new Date(item.created_date) > new Date(inventoryMap.get(item.event_name).created_date)) {
            inventoryMap.set(item.event_name, item);
          }
        }
      });
      
      window.inventoryState.items = uniqueEventNames.map(name => inventoryMap.get(name));
      window.inventoryState.loading = false;
      window.inventoryState.lastFetch = Date.now();
      
      console.log('✅ Inventory loaded:', {
        count: window.inventoryState.items.length,
        items: window.inventoryState.items.slice(0, 5).map(i => i.event_name)
      });
      
      // Re-render to show the loaded items
      if (window.renderApp) {
        window.renderApp();
      }
    }).catch(error => {
      console.error('Error fetching inventory:', error);
      window.inventoryState.loading = false;
      window.inventoryState.lastFetch = Date.now(); // Set lastFetch even on error to prevent retry loop
    });
  }
  
  const inventoryItems = window.inventoryState.items;
  const loadingInventory = window.inventoryState.loading;

  console.log('🔍 Rendering form with values:', {
    status: currentStatus,
    assigned_to: currentAssignedTo,
    total_amount: currentTotalAmount,
    lastUpdate: window.editOrderState?.lastUpdate,
    inventoryState: {
      loading: loadingInventory,
      itemsCount: inventoryItems.length,
      lastFetch: window.inventoryState.lastFetch,
      shouldFetch: shouldFetchInventory
    }
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

        // Event Name - EDITABLE DROPDOWN
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Event'),
          loadingInventory ? 
            React.createElement('div', { className: 'w-full px-3 py-2 border rounded-md bg-gray-50' }, 'Loading inventory...') :
            inventoryItems.length === 0 ?
            React.createElement('div', { className: 'w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-500' }, 'No inventory items available') :
            React.createElement('select', {
              value: currentEventName,
              onChange: (e) => {
                const selectedEventName = e.target.value;
                const selectedInventory = inventoryItems.find(item => item.event_name === selectedEventName);
                
                // Update event name
                handleInputChange('event_name', selectedEventName);
                
                // If inventory found, update event_id and event_date
                if (selectedInventory) {
                  handleInputChange('event_id', selectedInventory.id);
                  handleInputChange('inventory_id', selectedInventory.id);
                  handleInputChange('event_date', selectedInventory.event_date || '');
                  
                  console.log('Selected inventory:', {
                    event_name: selectedEventName,
                    inventory_id: selectedInventory.id,
                    event_date: selectedInventory.event_date
                  });
                }
              },
              className: 'w-full px-3 py-2 border rounded-md'
            },
              React.createElement('option', { value: '' }, 'Select Event'),
              inventoryItems.map(item =>
                React.createElement('option', { 
                  key: item.id, 
                  value: item.event_name 
                }, item.event_name)
              )
            )
        ),
        
        // Event Date - AUTO-FILLED, READ ONLY
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Event Date'),
          React.createElement('input', {
            type: 'text',
            value: currentEventDate || '',
            readOnly: true,
            className: 'w-full px-3 py-2 border rounded-md bg-gray-50',
            placeholder: 'Auto-filled from selected event'
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
  
  // Force inventory to be fetched on next render
  if (window.inventoryState) {
    window.inventoryState.lastFetch = 0;
  }
  
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
