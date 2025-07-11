// Fixed Allocation Management Component for FanToPark CRM
// Applied proven integration pattern for window globals

window.renderAllocationManagement = () => {
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
  
  const openAllocationForm = window.openAllocationForm || ((inventory) => {
    console.warn("openAllocationForm not implemented");
    console.log("Would open allocation form for:", inventory);
  });
  
  const handleUnallocate = window.handleUnallocate || ((allocationId, tickets) => {
    console.warn("handleUnallocate not implemented"); 
    console.log("Would unallocate:", allocationId, tickets);
  });

  // ✅ Enhanced Debug Logging
  console.log("🔍 ALLOCATION MANAGEMENT DEBUG:");
  console.log("showAllocationManagement:", showAllocationManagement);
  console.log("allocationManagementInventory:", allocationManagementInventory?.event_name);
  console.log("currentAllocations count:", currentAllocations?.length || 0);

  if (!showAllocationManagement || !allocationManagementInventory) {
    console.log("❌ Not showing allocation management:", {
      showAllocationManagement,
      hasInventory: !!allocationManagementInventory
    });
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
          'Allocations for ' + (allocationManagementInventory.event_name || 'Unknown Event')
        ),
        React.createElement('button', {
          onClick: () => setShowAllocationManagement(false),
          className: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
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

      currentAllocations.length === 0 ? 
      React.createElement('div', { className: 'text-center py-8 text-gray-500 dark:text-gray-400' },
        'No allocations found for this inventory item.'
      ) :
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
                  allocation.tickets_allocated || 0
                ),
                React.createElement('td', { className: 'px-4 py-2 border dark:border-gray-600 dark:text-gray-300' },
                  allocation.allocation_date ? new Date(allocation.allocation_date).toLocaleDateString() : 'N/A'
                ),
                React.createElement('td', { className: 'px-4 py-2 border dark:border-gray-600 dark:text-gray-300' }, 
                  allocation.notes || 'No notes'
                ),
                React.createElement('td', { className: 'px-4 py-2 border dark:border-gray-600' },
                  React.createElement('button', {
                    onClick: () => handleUnallocate(allocation.id, allocation.tickets_allocated),
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
          disabled: (allocationManagementInventory.available_tickets || 0) <= 0
        }, 'Add New Allocation'),
        React.createElement('button', {
          onClick: () => setShowAllocationManagement(false),
          className: 'bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600'
        }, 'Close')
      )
    )
  );
};

console.log('✅ Fixed Allocation Management component with integration pattern loaded successfully');
