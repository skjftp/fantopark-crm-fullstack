// Reassign Allocation Modal Component
// Allows reassigning allocations between orders (including split orders)

window.renderReassignAllocationModal = () => {
  const {
    showReassignModal = window.showReassignModal,
    selectedAllocation = window.selectedAllocation,
    availableOrders = window.availableOrders || [],
    loading = window.loading || false
  } = window.appState || {};

  if (!showReassignModal || !selectedAllocation) {
    return null;
  }

  // Define close function
  const closeModal = () => {
    window.showReassignModal = false;
    window.selectedAllocation = null;
    window.availableOrders = [];
    if (window.appState) {
      window.appState.showReassignModal = false;
      window.appState.selectedAllocation = null;
      window.appState.availableOrders = [];
    }
    if (window.renderApp) window.renderApp();
  };

  const handleReassign = async (newOrderId, removeFromOrderId) => {
    if (window.setLoading) {
      window.setLoading(true);
    }

    try {
      const response = await window.apiCall(`/orders/allocations/${selectedAllocation.id}/reassign`, {
        method: 'PUT',
        body: JSON.stringify({
          newOrderId,
          removeFromOrderId
        })
      });

      if (response.error) {
        throw new Error(response.error);
      }

      alert('Allocation reassigned successfully!');
      
      // Close modal and refresh
      closeModal();
      
      // Refresh allocations
      if (window.loadAllocations) {
        window.loadAllocations();
      }
      
      // Force re-render
      if (window.renderApp) {
        window.renderApp();
      }
    } catch (error) {
      alert('Error reassigning allocation: ' + error.message);
    } finally {
      if (window.setLoading) {
        window.setLoading(false);
      }
    }
  };

  const handleCreateSplitOrder = async () => {
    const primaryOrderId = selectedAllocation.primary_order_id || (selectedAllocation.order_ids && selectedAllocation.order_ids[0]);
    
    // Get split configuration from user
    const splitSuffix = prompt('Enter suffix for split order (e.g., "A", "B", "1"):');
    if (!splitSuffix) return;
    
    const splitAmount = prompt('Enter amount for this split order:');
    if (!splitAmount || isNaN(splitAmount)) return;

    if (window.setLoading) {
      window.setLoading(true);
    }

    try {
      // Create split order
      const response = await window.apiCall(`/orders/${primaryOrderId}/split`, {
        method: 'POST',
        body: JSON.stringify({
          splitOrders: [{
            split_suffix: splitSuffix,
            final_amount: parseFloat(splitAmount),
            invoice_total: parseFloat(splitAmount)
          }]
        })
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const newOrderId = response.data.splitOrders[0].id;
      
      // Reassign allocation to new split order
      await handleReassign(newOrderId, primaryOrderId);
    } catch (error) {
      alert('Error creating split order: ' + error.message);
      if (window.setLoading) {
        window.setLoading(false);
      }
    }
  };

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]',
    style: { zIndex: 9999 }, // Ensure it's on top
    onClick: (e) => {
      // Close on backdrop click
      if (e.target === e.currentTarget) {
        closeModal();
      }
    }
  },
    React.createElement('div', {
      className: 'bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto',
      onClick: (e) => e.stopPropagation() // Prevent closing when clicking inside modal
    },
      // Header
      React.createElement('div', { className: 'flex justify-between items-center mb-4' },
        React.createElement('h2', { className: 'text-xl font-bold dark:text-white' }, 
          'Reassign Allocation'
        ),
        React.createElement('button', {
          onClick: closeModal,
          className: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        }, '✕')
      ),

      // Allocation Info
      React.createElement('div', { className: 'bg-gray-50 dark:bg-gray-700 p-4 rounded mb-4' },
        React.createElement('h3', { className: 'font-semibold mb-2' }, 'Allocation Details'),
        React.createElement('div', { className: 'space-y-1 text-sm' },
          React.createElement('p', null, `Lead: ${selectedAllocation.lead_name}`),
          React.createElement('p', null, `Tickets: ${selectedAllocation.tickets_allocated}`),
          React.createElement('p', null, `Category: ${selectedAllocation.category_name}`),
          selectedAllocation.order_ids && selectedAllocation.order_ids.length > 0 &&
          React.createElement('p', null, `Current Orders: ${selectedAllocation.order_ids.length}`)
        )
      ),

      // Current Orders
      selectedAllocation.order_ids && selectedAllocation.order_ids.length > 0 &&
      React.createElement('div', { className: 'mb-4' },
        React.createElement('h3', { className: 'font-semibold mb-2' }, 'Current Orders'),
        React.createElement('div', { className: 'space-y-2' },
          selectedAllocation.order_ids.map(orderId => 
            React.createElement('div', { 
              key: orderId,
              className: 'flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded'
            },
              React.createElement('span', { className: 'text-sm' }, `Order: ${orderId}`),
              React.createElement('button', {
                onClick: () => handleReassign(null, orderId),
                className: 'text-red-600 hover:text-red-800 text-sm',
                disabled: loading
              }, 'Remove')
            )
          )
        )
      ),

      // Available Orders
      React.createElement('div', { className: 'mb-4' },
        React.createElement('h3', { className: 'font-semibold mb-2' }, 'Assign to Order'),
        React.createElement('div', { className: 'space-y-2' },
          availableOrders.filter(order => 
            !(selectedAllocation.order_ids || []).includes(order.id)
          ).map(order => 
            React.createElement('div', { 
              key: order.id,
              className: 'flex justify-between items-center p-2 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700'
            },
              React.createElement('div', { className: 'text-sm' },
                React.createElement('p', null, `${order.order_number}`),
                React.createElement('p', { className: 'text-xs text-gray-500' }, 
                  `Amount: ₹${order.final_amount || 0}`
                ),
                order.is_split_order && React.createElement('span', { 
                  className: 'text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded'
                }, 'Split Order')
              ),
              React.createElement('button', {
                onClick: () => handleReassign(order.id, selectedAllocation.primary_order_id),
                className: 'bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600',
                disabled: loading
              }, 'Assign')
            )
          )
        )
      ),

      // Create Split Order Option
      React.createElement('div', { className: 'border-t pt-4' },
        React.createElement('button', {
          onClick: handleCreateSplitOrder,
          className: 'w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50',
          disabled: loading || !selectedAllocation.primary_order_id
        }, '➕ Create New Split Order & Assign')
      ),

      // Footer
      React.createElement('div', { className: 'mt-6 flex justify-end' },
        React.createElement('button', {
          onClick: closeModal,
          className: 'bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600'
        }, 'Close')
      )
    )
  );
};

// Helper function to show the modal
window.showReassignAllocationModal = async (allocation) => {
  window.selectedAllocation = allocation;
  window.showReassignModal = true;
  
  // Load available orders for this lead and event
  try {
    const response = await window.apiCall(`/orders/for-allocation?lead_id=${allocation.lead_id}&event_name=${encodeURIComponent(allocation.inventory_event)}`);
    if (!response.error) {
      window.availableOrders = response.data;
    }
  } catch (error) {
    console.error('Error loading orders:', error);
    window.availableOrders = [];
  }
  
  if (window.renderApp) {
    window.renderApp();
  }
};

console.log('✅ Reassign Allocation Modal loaded');