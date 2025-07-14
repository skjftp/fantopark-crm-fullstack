// Enhanced Allocation Management Component with data fetching
// Update your allocation-management.js file with this version

window.renderAllocationManagement = () => {
  const { useEffect, useState } = React;
  
  // ✅ PATTERN 1: State Variable Extraction (CRITICAL FIX)
  const {
    showAllocationManagement = window.appState?.showAllocationManagement || window.showAllocationManagement,
    allocationManagementInventory = window.appState?.allocationManagementInventory || window.allocationManagementInventory,
    currentAllocations = window.appState?.currentAllocations || window.currentAllocations || [],
    loading = window.appState?.loading || window.loading
  } = window.appState || {};

  // ✅ PATTERN 2: Function References with Fallbacks
  const setShowAllocationManagement = window.setShowAllocationManagement || (() => {
    console.warn("setShowAllocationManagement not implemented");
  });
  
  const setCurrentAllocations = window.setCurrentAllocations || (() => {
    console.warn("setCurrentAllocations not implemented");
  });
  
  const setLoading = window.setLoading || (() => {
    console.warn("setLoading not implemented");
  });
  
  const openAllocationForm = window.openAllocationForm || ((inventory) => {
    console.warn("openAllocationForm not implemented");
    console.log("Would open allocation form for:", inventory);
  });
  
  const handleUnallocate = window.handleUnallocate || ((allocationId, tickets) => {
    console.warn("handleUnallocate not implemented"); 
    console.log("Would unallocate:", allocationId, tickets);
  });

  const apiCall = window.apiCall || ((endpoint) => {
    console.warn("apiCall not implemented");
    return Promise.reject(new Error("apiCall not implemented"));
  });

  // ✅ CRITICAL: Add useEffect to fetch allocations when modal opens
  useEffect(() => {
    if (showAllocationManagement && allocationManagementInventory && allocationManagementInventory.id) {
      console.log("🔄 Modal opened, fetching allocations for:", allocationManagementInventory.event_name);
      
      const fetchAllocations = async () => {
        try {
          setLoading(true);
          
          const response = await apiCall(`/inventory/${allocationManagementInventory.id}/allocations`);
          
          if (response.error) {
            throw new Error(response.error);
          }
          
          const allocations = response.data?.allocations || [];
          console.log("✅ Fetched allocations in component:", allocations.length);
          setCurrentAllocations(allocations);
          
        } catch (error) {
          console.error('❌ Error fetching allocations in component:', error);
          // Don't show alert here as it might be duplicate with openAllocationManagement
          setCurrentAllocations([]);
        } finally {
          setLoading(false);
        }
      };
      
      // Only fetch if currentAllocations is empty (avoid duplicate fetches)
      if (currentAllocations.length === 0) {
        fetchAllocations();
      }
    }
  }, [showAllocationManagement, allocationManagementInventory?.id]);

  // ✅ Enhanced Debug Logging
  console.log("🔍 ALLOCATION MANAGEMENT DEBUG:");
  console.log("showAllocationManagement:", showAllocationManagement);
  console.log("allocationManagementInventory:", allocationManagementInventory?.event_name);
  console.log("currentAllocations count:", currentAllocations?.length || 0);
  console.log("loading:", loading);

  if (!showAllocationManagement || !allocationManagementInventory) {
    return null;
  }

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
  },
    React.createElement('div', { 
      className: 'bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto'
    },
      React.createElement('div', { className: 'flex justify-between items-center mb-4' },
        React.createElement('h2', { className: 'text-xl font-bold dark:text-white' }, 
          'Allocations for ' + allocationManagementInventory.event_name
        ),
        React.createElement('button', {
          onClick: () => setShowAllocationManagement(false),
          className: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
        }, '✕')
      ),

      React.createElement('div', { className: 'mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded' },
        React.createElement('h3', { className: 'font-semibold dark:text-white' }, 'Inventory Details'),
        React.createElement('p', { className: 'dark:text-gray-300' }, 
          'Total Tickets: ' + (allocationManagementInventory.total_tickets || 'N/A')
        ),
        React.createElement('p', { className: 'dark:text-gray-300' }, 
          'Available Tickets: ' + (allocationManagementInventory.available_tickets || 0)
        ),
        React.createElement('p', { className: 'dark:text-gray-300' }, 
          'Allocated Tickets: ' + ((allocationManagementInventory.total_tickets || 0) - (allocationManagementInventory.available_tickets || 0))
        )
      ),

      // Loading state
      loading ? 
        React.createElement('div', { className: 'text-center py-8' },
          React.createElement('div', { className: 'inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white' }),
          React.createElement('p', { className: 'mt-2 text-gray-600 dark:text-gray-400' }, 'Loading allocations...')
        ) :
      
      // No allocations message
      currentAllocations.length === 0 ? 
        React.createElement('div', { className: 'text-center py-8 text-gray-500 dark:text-gray-400' },
          'No allocations found for this inventory item.'
        ) :
      
      // Allocations table
      React.createElement('div', { className: 'overflow-x-auto' },
        React.createElement('table', { className: 'min-w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600' },
          React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-700' },
            React.createElement('tr', null,
              React.createElement('th', { className: 'px-4 py-2 border dark:border-gray-600 text-left dark:text-white' }, 'Lead Name'),
              React.createElement('th', { className: 'px-4 py-2 border dark:border-gray-600 text-left dark:text-white' }, 'Email'),
              React.createElement('th', { className: 'px-4 py-2 border dark:border-gray-600 text-left dark:text-white' }, 'Tickets Allocated'),
              React.createElement('th', { className: 'px-4 py-2 border dark:border-gray-600 text-left dark:text-white' }, 'Allocation Date'),
              React.createElement('th', { className: 'px-4 py-2 border dark:border-gray-600 text-left dark:text-white' }, 'Notes'),
              React.createElement('th', { className: 'px-4 py-2 border dark:border-gray-600 text-left dark:text-white' }, 'Actions')
            )
          ),
          React.createElement('tbody', null,
            currentAllocations.map((allocation, index) =>
              React.createElement('tr', { 
                key: allocation.id || index, 
                className: 'hover:bg-gray-50 dark:hover:bg-gray-700' 
              },
                React.createElement('td', { className: 'px-4 py-2 border dark:border-gray-600 dark:text-gray-300' },
                  allocation.lead_details ? allocation.lead_details.name : (allocation.lead_name || 'Unknown')
                ),
                React.createElement('td', { className: 'px-4 py-2 border dark:border-gray-600 dark:text-gray-300' },
                  allocation.lead_details ? allocation.lead_details.email : (allocation.lead_email || 'N/A')
                ),
                React.createElement('td', { className: 'px-4 py-2 border dark:border-gray-600 dark:text-gray-300' }, 
                  allocation.tickets_allocated || allocation.quantity || 0
                ),
                React.createElement('td', { className: 'px-4 py-2 border dark:border-gray-600 dark:text-gray-300' },
                  allocation.allocation_date ? new Date(allocation.allocation_date).toLocaleDateString() : 'N/A'
                ),
                React.createElement('td', { className: 'px-4 py-2 border dark:border-gray-600 dark:text-gray-300' }, 
                  allocation.notes || 'No notes'
                ),
                React.createElement('td', { className: 'px-4 py-2 border dark:border-gray-600' },
                  React.createElement('button', {
                    onClick: () => handleUnallocate(allocation.id, allocation.tickets_allocated || allocation.quantity),
                    className: 'bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 disabled:opacity-50',
                    disabled: loading
                  }, loading ? 'Processing...' : 'Unallocate')
                )
              )
            )
          )
        )
      ),

      React.createElement('div', { className: 'mt-6 flex justify-between' },
        React.createElement('button', {
          onClick: () => openAllocationForm(allocationManagementInventory),
          className: 'bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50',
          disabled: (allocationManagementInventory.available_tickets || 0) <= 0 || loading
        }, 'Add New Allocation'),
        React.createElement('button', {
          onClick: () => setShowAllocationManagement(false),
          className: 'bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600'
        }, 'Close')
      )
    )
  );
};

console.log('✅ Enhanced Allocation Management component with data fetching loaded successfully');
