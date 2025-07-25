// Reassign Allocation Modal Component
// Allows reassigning allocations between orders (including split orders)

window.renderReassignAllocationModal = () => {
  // Check both appState and window for state variables
  const showReassignModal = window.appState?.showReassignModal || window.showReassignModal;
  const selectedAllocation = window.appState?.selectedAllocation || window.selectedAllocation;
  const availableOrders = window.appState?.availableOrders || window.availableOrders || [];
  const loading = window.appState?.loading || window.loading || false;

  if (!showReassignModal || !selectedAllocation) {
    return null;
  }

  // Debug logging
  console.log('🔍 Reassign Modal - selectedAllocation:', selectedAllocation);
  console.log('🔍 Reassign Modal - order_ids:', selectedAllocation.order_ids);
  console.log('🔍 Reassign Modal - availableOrders:', availableOrders);

  // Define close function
  const closeModal = () => {
    console.log('🔄 Closing reassign allocation modal');
    
    // Use proper setter functions
    if (window.setShowReassignModal) {
      window.setShowReassignModal(false);
    } else {
      window.showReassignModal = false;
      if (window.appState) {
        window.appState.showReassignModal = false;
      }
    }
    
    if (window.setSelectedAllocation) {
      window.setSelectedAllocation(null);
    } else {
      window.selectedAllocation = null;
      if (window.appState) {
        window.appState.selectedAllocation = null;
      }
    }
    
    if (window.setAvailableOrders) {
      window.setAvailableOrders([]);
    } else {
      window.availableOrders = [];
      if (window.appState) {
        window.appState.availableOrders = [];
      }
    }
    
    // Restore allocation modal z-index
    const allocationModal = document.querySelector('.z-40');
    if (allocationModal && window._originalAllocationZIndex) {
      allocationModal.style.zIndex = window._originalAllocationZIndex;
      window._originalAllocationZIndex = null;
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
      
      // Refresh allocations if inventory is loaded
      if (window.loadAllocationsForInventory && window.allocationManagementInventory) {
        await window.loadAllocationsForInventory(window.allocationManagementInventory.id);
      }
      
      // Close modal and refresh
      closeModal();
      
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

  // Don't use portal - render directly with very high z-index
  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center',
    style: { 
      zIndex: 2147483647, // Maximum z-index
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    },
    onClick: (e) => {
      // Close on backdrop click
      if (e.target === e.currentTarget) {
        closeModal();
      }
    }
  },
    React.createElement('div', {
      className: 'bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto',
      style: { position: 'relative', zIndex: 2147483647 },
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
        React.createElement('h3', { className: 'font-semibold mb-2' }, 'Available Orders'),
        availableOrders.length === 0 ? 
          React.createElement('div', { className: 'p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800' },
            React.createElement('p', { className: 'font-semibold' }, 'No orders found for this lead and event.'),
            React.createElement('p', { className: 'mt-1' }, 'You may need to create an order first before linking this allocation.')
          ) :
        React.createElement('div', { className: 'space-y-2' },
          availableOrders.filter(order => 
            !(selectedAllocation.order_ids || []).includes(order.id)
          ).length === 0 ?
            React.createElement('p', { className: 'text-sm text-gray-500 dark:text-gray-400' }, 
              'All available orders are already linked to this allocation.'
            ) :
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
  console.log('🔄 Opening reassign allocation modal for:', allocation);
  
  // Set up reassign modal data using proper setter functions
  if (window.setSelectedAllocation) {
    window.setSelectedAllocation(allocation);
  } else {
    window.selectedAllocation = allocation;
    if (window.appState) {
      window.appState.selectedAllocation = allocation;
    }
  }
  
  if (window.setShowReassignModal) {
    window.setShowReassignModal(true);
  } else {
    window.showReassignModal = true;
    if (window.appState) {
      window.appState.showReassignModal = true;
    }
  }
  
  // Temporarily reduce z-index of allocation modal
  const allocationModal = document.querySelector('.z-40');
  if (allocationModal) {
    allocationModal.style.zIndex = '1';
    window._originalAllocationZIndex = '40';
  }
  
  // Load available orders for this lead and event
  try {
    console.log('📋 Fetching orders for allocation:', {
      lead_id: allocation.lead_id,
      event_name: allocation.inventory_event
    });
    
    const response = await window.apiCall(`/orders/for-allocation?lead_id=${allocation.lead_id}&event_name=${encodeURIComponent(allocation.inventory_event)}`);
    console.log('📋 Orders API response:', response);
    
    if (!response.error && response.data) {
      if (window.setAvailableOrders) {
        window.setAvailableOrders(response.data);
      } else {
        window.availableOrders = response.data;
        if (window.appState) {
          window.appState.availableOrders = response.data;
        }
      }
      console.log(`✅ Loaded ${response.data.length} orders`);
    } else {
      console.warn('⚠️ No orders found or error in response');
      if (window.setAvailableOrders) {
        window.setAvailableOrders([]);
      } else {
        window.availableOrders = [];
        if (window.appState) {
          window.appState.availableOrders = [];
        }
      }
    }
  } catch (error) {
    console.error('❌ Error loading orders:', error);
    if (window.setAvailableOrders) {
      window.setAvailableOrders([]);
    } else {
      window.availableOrders = [];
      if (window.appState) {
        window.appState.availableOrders = [];
      }
    }
  }
  
  if (window.renderApp) {
    window.renderApp();
  }
};

console.log('✅ Reassign Allocation Modal loaded');