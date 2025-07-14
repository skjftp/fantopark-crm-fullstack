// ===============================================
// OPTIMIZED ALLOCATION FORM COMPONENT - PERFORMANCE ENHANCED
// ===============================================
// Allocation Form Component for FanToPark CRM
// Reduced logging and improved performance

// Conditional logging control
const ENABLE_ALLOCATION_DEBUG = false; // Set to false to reduce logs
const allocLog = ENABLE_ALLOCATION_DEBUG ? console.log : () => {};

window.renderAllocationForm = () => {
  // ✅ PATTERN 1: State Variable Extraction (OPTIMIZED)
  const {
    showAllocationForm = window.appState?.showAllocationForm || window.showAllocationForm,
    currentInventory = window.appState?.currentInventory || window.currentInventory,
    allocationData = window.appState?.allocationData || window.allocationData || {},
    leads = window.appState?.leads || window.leads || [],
    loading = window.appState?.loading || window.loading
  } = window.appState || {};

  // ✅ PATTERN 2: Function References with Fallbacks
  const closeForm = window.closeForm || (() => {
    allocLog("closeForm not implemented - using fallback");
    window.setShowAllocationForm && window.setShowAllocationForm(false);
  });

  const handleAllocation = window.handleAllocation || ((e) => {
    e.preventDefault();
    console.warn("handleAllocation not implemented");
    alert("Allocation functionality will be implemented!");
  });

  const handleAllocationInputChange = window.handleAllocationInputChange || ((field, value) => {
    allocLog("handleAllocationInputChange not implemented");
    allocLog("Would change:", field, "to:", value);
  });

  // ✅ OPTIMIZED: Only log when form state changes (not every render)
  if (!showAllocationForm || !currentInventory) {
    // Only log once when state changes
    if (ENABLE_ALLOCATION_DEBUG && !window._allocationFormLoggedHidden) {
      allocLog("❌ Not showing allocation form:", {
        showAllocationForm,
        hasInventory: !!currentInventory
      });
      window._allocationFormLoggedHidden = true;
    }
    return null;
  }

  // Reset the hidden flag when form is showing
  window._allocationFormLoggedHidden = false;

  // ✅ OPTIMIZED: Only log essential info on form show
  allocLog("📦 Allocation form rendering for:", currentInventory?.event_name);
  allocLog("👥 Available leads:", leads?.length || 0);

  // Filter qualified leads for allocation
  const qualifiedLeads = leads.filter(lead => 
    lead.status === 'qualified' || 
    lead.status === 'hot' || 
    lead.status === 'warm'
  );

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => {
      if (e.target === e.currentTarget) {
        allocLog("🔄 Clicked outside, closing allocation form");
        closeForm();
      }
    }
  },
    React.createElement('div', {
      className: 'bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto'
    },
      React.createElement('div', { className: 'flex justify-between items-center mb-6' },
        React.createElement('h2', { className: 'text-xl font-bold text-gray-900 dark:text-white' },
          `Allocate Tickets - ${currentInventory.event_name}`
        ),
        React.createElement('button', {
          onClick: closeForm,
          className: 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl'
        }, '✕')
      ),

      // Event Information Summary
      React.createElement('div', { className: 'bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6' },
        React.createElement('div', { className: 'grid grid-cols-2 gap-4 text-sm' },
          React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'Available Tickets: '),
            React.createElement('span', { className: 'text-green-600 dark:text-green-400 font-bold' }, 
              currentInventory.available_tickets || 0
            )
          ),
          React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'Event Date: '),
            React.createElement('span', { className: 'text-gray-900 dark:text-white' }, 
              new Date(currentInventory.event_date).toLocaleDateString()
            )
          ),
          React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'Category: '),
            React.createElement('span', { className: 'text-gray-900 dark:text-white' }, 
              currentInventory.category_of_ticket
            )
          ),
          React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'Price: '),
            React.createElement('span', { className: 'text-gray-900 dark:text-white font-bold' }, 
              `₹${currentInventory.selling_price || 0}`
            )
          )
        )
      ),

      React.createElement('form', { onSubmit: handleAllocation },
        React.createElement('div', { className: 'mb-6' },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' },
            'Select Lead'
          ),
           React.createElement('select', {
          value: allocationData.lead_id || '',
          onChange: (e) => handleAllocationInputChange('lead_id', e.target.value),
          className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
          required: true
        },
          React.createElement('option', { value: '' }, 'Select a lead...'),
          qualifiedLeads.map(lead =>
            React.createElement('option', { key: lead.id, value: lead.id },
              `${lead.name} - ${lead.event_name || lead.lead_for_event || 'No Event'} (${lead.status})`
            )
          )
        )
        ),

        React.createElement('div', { className: 'grid grid-cols-2 gap-4 mb-6' },
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' },
              'Number of Tickets'
            ),
            React.createElement('input', {
              type: 'number',
              min: '1',
              max: currentInventory.available_tickets,
              value: allocationData.quantity || 1,
              onChange: (e) => handleAllocationInputChange('quantity', parseInt(e.target.value)),
              className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
              required: true
            })
          ),
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' },
              'Allocation Date'
            ),
            React.createElement('input', {
              type: 'date',
              value: allocationData.allocation_date || new Date().toISOString().split('T')[0],
              onChange: (e) => handleAllocationInputChange('allocation_date', e.target.value),
              className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
              required: true
            })
          )
        ),

        React.createElement('div', { className: 'mb-6' },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' },
            'Allocation Notes'
          ),
          React.createElement('textarea', {
            value: allocationData.notes || '',
            onChange: (e) => handleAllocationInputChange('notes', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
            rows: 3,
            placeholder: 'Any special notes for this allocation...'
          })
        ),

        // Total Amount Calculation
        allocationData.quantity && React.createElement('div', { className: 'bg-blue-50 dark:bg-blue-900 rounded-lg p-4 mb-6' },
          React.createElement('div', { className: 'flex justify-between items-center' },
            React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 
              'Total Amount:'
            ),
            React.createElement('span', { className: 'text-2xl font-bold text-blue-600 dark:text-blue-400' },
              `₹${((allocationData.quantity || 1) * (currentInventory.selling_price || 0)).toLocaleString()}`
            )
          ),
          React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-400 mt-1' },
            `${allocationData.quantity || 1} tickets × ₹${(currentInventory.selling_price || 0).toLocaleString()} each`
          )
        ),

        React.createElement('div', { className: 'flex space-x-4' },
          React.createElement('button', {
            type: 'button',
            onClick: closeForm,
            className: 'flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-300'
          }, 'Cancel'),
          React.createElement('button', {
            type: 'submit',
            disabled: loading || !allocationData.lead_id || !allocationData.quantity,
            className: 'flex-1 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 font-medium'
          }, loading ? 'Processing...' : 'Allocate & Create Order')
        )
      )
    )
  );
};

// ✅ OPTIMIZED ALLOCATION HANDLERS

// Enhanced allocation input change handler with throttling
let allocationInputTimeout;
window.handleAllocationInputChange = (field, value) => {
  clearTimeout(allocationInputTimeout);
  allocationInputTimeout = setTimeout(() => {
    allocLog(`📝 Allocation field changed: ${field} = ${value}`);
    
    if (window.setAllocationData) {
      window.setAllocationData(prev => ({
        ...prev,
        [field]: value
      }));
    } else {
      // Fallback: update window globals directly
      window.allocationData = window.allocationData || {};
      window.allocationData[field] = value;
      if (window.appState) {
        window.appState.allocationData = window.allocationData;
      }
      allocLog("⚠️ setAllocationData not available, using fallback");
    }
  }, 100); // Throttle input changes
};

// Enhanced allocation submission handler
window.handleAllocation = async (e) => {
  e.preventDefault();
  
  // Permission check
  if (!window.hasPermission('inventory', 'allocate')) {
    alert('You do not have permission to allocate inventory');
    return;
  }

  // Validation
  if (!window.allocationData.lead_id) {
    alert('Please select a lead');
    return;
  }

  if (!window.allocationData.quantity || window.allocationData.quantity <= 0) {
    alert('Please enter a valid quantity');
    return;
  }

  if (window.allocationData.quantity > window.currentInventory.available_tickets) {
    alert('Quantity exceeds available tickets');
    return;
  }

  window.setLoading(true);

  try {
    allocLog('🔄 Creating allocation...', window.allocationData);

    // Find the selected lead
    const selectedLead = window.leads.find(l => l.id === window.allocationData.lead_id);
    if (!selectedLead) {
      throw new Error('Selected lead not found');
    }

    // Create the allocation/order
    const allocationRequest = {
      lead_id: window.allocationData.lead_id,
      inventory_id: window.currentInventory.id,
      quantity: window.allocationData.quantity,
      allocation_date: window.allocationData.allocation_date,
      notes: window.allocationData.notes,
      status: 'allocated',
      total_amount: window.allocationData.quantity * window.currentInventory.selling_price
    };

    const response = await window.apiCall('/allocations', {
      method: 'POST',
      body: JSON.stringify(allocationRequest)
    });

    if (response.error) {
      throw new Error(response.error);
    }

    // Update inventory available tickets
    const newAvailableTickets = window.currentInventory.available_tickets - window.allocationData.quantity;
    
    window.setInventory(prev => prev.map(item =>
      item.id === window.currentInventory.id
        ? { ...item, available_tickets: newAvailableTickets }
        : item
    ));

    alert('Inventory allocated successfully!');
    window.closeForm();

  } catch (error) {
    console.error('Allocation error:', error);
    alert('Error: ' + error.message);
  } finally {
    window.setLoading(false);
  }
};

allocLog('✅ Optimized Allocation Form component loaded');
console.log('🎫 Allocation Form v2.0 - Performance Optimized');
