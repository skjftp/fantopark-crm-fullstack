// Allocation Management Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

window.renderAllocationManagement = () => {
  if (!showAllocationManagement || !allocationManagementInventory) return null;

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
  },
    React.createElement('div', { 
      className: 'bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto'
    },
      React.createElement('div', { className: 'flex justify-between items-center mb-4' },
        React.createElement('h2', { className: 'text-xl font-bold' }, 
          'Allocations for ' + allocationManagementInventory.event_name
        ),
        React.createElement('button', {
          onClick: () => setShowAllocationManagement(false),
          className: 'text-gray-500 hover:text-gray-700'
        }, '✕')
      ),

      React.createElement('div', { className: 'mb-4 p-4 bg-gray-50 rounded' },
        React.createElement('h3', { className: 'font-semibold' }, 'Inventory Details'),
        React.createElement('p', null, 'Total Tickets: ' + (allocationManagementInventory.total_tickets || 'N/A')),
        React.createElement('p', null, 'Available Tickets: ' + (allocationManagementInventory.available_tickets || 0)),
        React.createElement('p', null, 'Allocated Tickets: ' + ((allocationManagementInventory.total_tickets || 0) - (allocationManagementInventory.available_tickets || 0)))
      ),

      currentAllocations.length === 0 ? 
      React.createElement('div', { className: 'text-center py-8 text-gray-500' },
        'No allocations found for this inventory item.'
      ) :
      React.createElement('div', { className: 'overflow-x-auto' },
        React.createElement('table', { className: 'min-w-full bg-white border border-gray-300' },
          React.createElement('thead', { className: 'bg-gray-50' },
            React.createElement('tr', null,
              React.createElement('th', { className: 'px-4 py-2 border text-left' }, 'Lead Name'),
              React.createElement('th', { className: 'px-4 py-2 border text-left' }, 'Email'),
              React.createElement('th', { className: 'px-4 py-2 border text-left' }, 'Tickets Allocated'),
              React.createElement('th', { className: 'px-4 py-2 border text-left' }, 'Allocation Date'),
              React.createElement('th', { className: 'px-4 py-2 border text-left' }, 'Notes'),
              React.createElement('th', { className: 'px-4 py-2 border text-left' }, 'Actions')
            )
          ),
          React.createElement('tbody', null,
            currentAllocations.map(allocation =>
              React.createElement('tr', { key: allocation.id, className: 'hover:bg-gray-50' },
                React.createElement('td', { className: 'px-4 py-2 border' },
                  allocation.lead_details ? allocation.lead_details.name : (allocation.lead_name || 'Unknown')
                ),
                React.createElement('td', { className: 'px-4 py-2 border' },
                  allocation.lead_details ? allocation.lead_details.email : (allocation.lead_email || 'N/A')
                ),
                React.createElement('td', { className: 'px-4 py-2 border' }, allocation.tickets_allocated),
                React.createElement('td', { className: 'px-4 py-2 border' },
                  new Date(allocation.allocation_date).toLocaleDateString()
                ),
                React.createElement('td', { className: 'px-4 py-2 border' }, allocation.notes || 'No notes'),
                React.createElement('td', { className: 'px-4 py-2 border' },
                  React.createElement('button', {
                    onClick: () => handleUnallocate(allocation.id, allocation.tickets_allocated),
                    className: 'bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600',
                    disabled: loading
                  }, 'Unallocate')
                )
              )
            )
          )
        )
      ),

      React.createElement('div', { className: 'mt-6 flex justify-between' },
        React.createElement('button', {
          onClick: () => openAllocationForm(allocationManagementInventory),
          className: 'bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600',
          disabled: allocationManagementInventory.available_tickets <= 0
        }, 'Add New Allocation'),
        React.createElement('button', {
          onClick: () => setShowAllocationManagement(false),
          className: 'bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600'
        }, 'Close')
      )
    )
  );
};

console.log('✅ Allocation Management component loaded successfully');
