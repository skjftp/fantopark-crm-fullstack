// Allocation Form Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

window.renderAllocationForm = () => {
  // ✅ PATTERN 1: State Variable Extraction (CRITICAL FIX)
  const {
    showAllocationForm = window.appState?.showAllocationForm || window.showAllocationForm,
    currentInventory = window.appState?.currentInventory || window.currentInventory,
    allocationData = window.appState?.allocationData || window.allocationData || {},
    leads = window.appState?.leads || window.leads || [],
    loading = window.appState?.loading || window.loading
  } = window.appState || {};

  // ✅ PATTERN 2: Function References with Fallbacks
  const closeForm = window.closeForm || (() => {
    console.warn("closeForm not implemented");
    window.setShowAllocationForm && window.setShowAllocationForm(false);
  });

  const handleAllocation = window.handleAllocation || ((e) => {
    e.preventDefault();
    console.warn("handleAllocation not implemented");
    alert("Allocation functionality will be implemented!");
  });

  const handleAllocationInputChange = window.handleAllocationInputChange || ((field, value) => {
    console.warn("handleAllocationInputChange not implemented");
    console.log("Would change:", field, "to:", value);
  });

  // ✅ Enhanced Debug Logging
  console.log("🔍 ALLOCATION FORM DEBUG:");
  console.log("showAllocationForm:", showAllocationForm);
  console.log("currentInventory:", currentInventory?.event_name);
  console.log("allocationData:", allocationData);
  console.log("leads count:", leads?.length || 0);

  if (!showAllocationForm || !currentInventory) {
    console.log("❌ Not showing allocation form:", {
      showAllocationForm,
      hasInventory: !!currentInventory
    });
    return null;
  }

  // Filter converted leads (as per original logic)
  const convertedLeads = leads.filter(lead => 
    ['converted', 'payment', 'payment_post_service', 'payment_received'].includes(lead.status)
  );

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => e.target === e.currentTarget && closeForm()
  },
    React.createElement('div', { 
      className: 'bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md' 
    },
      React.createElement('div', { className: 'flex justify-between items-center mb-6' },
        React.createElement('h2', { className: 'text-xl font-bold text-gray-900 dark:text-white' }, 
          'Allocate: ' + (currentInventory.event_name)
        ),
        React.createElement('button', {
          onClick: closeForm,
          className: 'text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 text-2xl'
        }, '✕')
      ),

      React.createElement('div', { className: 'mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded' },
        React.createElement('p', { className: 'text-sm text-blue-800 dark:text-blue-200' }, 
          'Available Tickets: ' + (currentInventory.available_tickets)
        ),
        React.createElement('p', { className: 'text-sm text-blue-800 dark:text-blue-200' }, 
          'Price per Ticket: ₹' + (currentInventory.selling_price?.toLocaleString())
        )
      ),

      React.createElement('form', { onSubmit: handleAllocation },
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' }, 
            'Select Lead (Converted or Later) *'
          ),
          React.createElement('select', {
            value: allocationData.lead_id || '',
            onChange: (e) => handleAllocationInputChange('lead_id', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
            required: true
          },
            React.createElement('option', { value: '' }, 'Select Lead'),
            convertedLeads.map(lead =>
              React.createElement('option', { key: lead.id, value: lead.id }, 
                (lead.name) + ' - ' + (lead.number_of_people) + ' people'
              )
            )
          )
        ),

        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' }, 
            'Tickets to Allocate *'
          ),
          React.createElement('input', {
            type: 'number',
            value: allocationData.tickets_allocated || '',
            onChange: (e) => handleAllocationInputChange('tickets_allocated', parseInt(e.target.value)),
            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
            min: '1',
            max: currentInventory.available_tickets,
            required: true
          })
        ),

        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' }, 
            'Allocation Date *'
          ),
          React.createElement('input', {
            type: 'date',
            value: allocationData.allocation_date || new Date().toISOString().split('T')[0],
            onChange: (e) => handleAllocationInputChange('allocation_date', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
            required: true
          })
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

        React.createElement('div', { className: 'flex space-x-4' },
          React.createElement('button', {
            type: 'button',
            onClick: closeForm,
            className: 'flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-300'
          }, 'Cancel'),
          React.createElement('button', {
            type: 'submit',
            disabled: loading,
            className: 'flex-1 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 font-medium'
          }, loading ? 'Processing...' : 'Allocate & Create Order')
        )
      )
    )
  );
};

// ✅ ALLOCATION FORM HANDLERS - Extracted from original index.html

// Enhanced allocation input change handler
window.handleAllocationInputChange = (field, value) => {
  console.log(`📝 Allocation field changed: ${field} = ${value}`);
  
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
    console.warn("⚠️ setAllocationData not available, using fallback");
  }
};

// Enhanced allocation submission handler (from original index.html)
window.handleAllocation = async (e) => {
  e.preventDefault();
  
  // Permission check
  if (!window.hasPermission('inventory', 'allocate')) {
    alert('You do not have permission to allocate inventory');
    return;
  }

  if (window.setLoading) {
    window.setLoading(true);
  }

  try {
    const allocationData = window.allocationData || {};
    const currentInventory = window.currentInventory;
    const leads = window.leads || [];

    // Enhanced debug logging
    console.log('=== ALLOCATION SUBMISSION DEBUG ===');
    console.log('Allocation data:', allocationData);
    console.log('Current inventory:', currentInventory?.event_name);
    console.log('Available tickets:', currentInventory?.available_tickets);

    // Find selected lead (don't use parseInt for ID comparison)
    const selectedLead = leads.find(lead => lead.id === allocationData.lead_id);

    if (!selectedLead) {
      throw new Error('Lead not found');
    }

    // Validate lead status
    const isConvertedOrLater = (status) => {
      const postConvertedStages = ['converted', 'payment', 'payment_post_service', 'payment_received'];
      return postConvertedStages.includes(status);
    };

    if (!isConvertedOrLater(selectedLead.status)) {
      throw new Error('Lead must be in converted status or later to allocate inventory');
    }

    // Validate ticket availability
    if (allocationData.tickets_allocated > currentInventory.available_tickets) {
      throw new Error('Not enough tickets available');
    }

    // Call backend API
    const response = await window.apiCall(`/inventory/${currentInventory.id}/allocate`, {
      method: 'POST',
      body: JSON.stringify({
        lead_id: allocationData.lead_id,
        tickets_allocated: parseInt(allocationData.tickets_allocated),
        allocation_date: allocationData.allocation_date,
        notes: allocationData.notes
      })
    });

    console.log('Backend response:', response);

    if (response.error) {
      throw new Error(response.error);
    }

    // Update local inventory state
    if (window.setInventory) {
      window.setInventory(prev => 
        prev.map(item => 
          item.id === currentInventory.id 
            ? { ...item, available_tickets: response.remaining_tickets }
            : item
        )
      );
    }

    // Close the allocation form and show success
    window.setShowAllocationForm && window.setShowAllocationForm(false);
    alert('✅ Inventory allocated successfully!');

    // Refresh allocations if management modal is open
    if (window.showAllocationManagement && window.fetchAllocations) {
      window.fetchAllocations(currentInventory.id);
    }

  } catch (error) {
    console.error('❌ Allocation error:', error);
    alert('❌ Error allocating inventory: ' + error.message);
  } finally {
    if (window.setLoading) {
      window.setLoading(false);
    }
  }
};

console.log('✅ Allocation Form component loaded successfully with enhanced integration pattern');
