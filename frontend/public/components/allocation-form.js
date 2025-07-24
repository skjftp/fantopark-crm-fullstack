// ===============================================
// OPTIMIZED ALLOCATION FORM COMPONENT - WITH CATEGORY SUPPORT
// ===============================================
// Allocation Form Component for FanToPark CRM
// Reduced logging and improved performance + allocation display + CATEGORY SELECTION

// Conditional logging control

// Initialize global state for allocation form search (avoiding React hooks issues)
window.allocationFormState = window.allocationFormState || {
  leadSearch: '',
  showLeadDropdown: false,
  eventFilter: '',
  statusFilter: 'all',
  searchResults: [],
  searching: false,
  selectedLead: null,
  formMounted: false
};

window.renderAllocationForm = () => {
  // Mark form as mounted
  window.allocationFormState.formMounted = true;
  
  // ✅ PATTERN 1: State Variable Extraction (OPTIMIZED) - NO HOOKS
  const {
    showAllocationForm = window.appState?.showAllocationForm || window.showAllocationForm,
    currentInventory = window.appState?.currentInventory || window.currentInventory,
    allocationData = window.appState?.allocationData || window.allocationData || {},
    leads = window.appState?.leads || window.leads || [],
    allLeadsForAllocation = window.appState?.allLeadsForAllocation || [],
    loading = window.appState?.loading || window.loading,
    currentAllocations = window.appState?.currentAllocations || window.currentAllocations || []
  } = window.appState || {};
  
  // Use dynamic search results instead of static lead lists
  const leadSearch = window.allocationFormState.leadSearch;
  const showLeadDropdown = window.allocationFormState.showLeadDropdown;
  const searchResults = window.allocationFormState.searchResults || [];
  const searching = window.allocationFormState.searching;
  
  // State management functions with proper re-rendering
  const setLeadSearch = (value) => {
    console.error('🔍 SET LEAD SEARCH CALLED:', value);
    window.allocationFormState.leadSearch = value;
    // Trigger search if value has content
    if (value.trim().length >= 2) {
      console.error('🔍 TRIGGERING SEARCH FOR:', value);
      searchLeadsForAllocation(value);
    } else {
      console.error('🔍 CLEARING SEARCH RESULTS');
      window.allocationFormState.searchResults = [];
    }
    // Force re-render
    if (window.appState?.forceUpdate) {
      window.appState.forceUpdate();
    } else if (window.forceUpdate) {
      window.forceUpdate();
    }
  };
  
  const setShowLeadDropdown = (value) => {
    window.allocationFormState.showLeadDropdown = value;
    // Force re-render
    if (window.appState?.forceUpdate) {
      window.appState.forceUpdate();
    } else if (window.forceUpdate) {
      window.forceUpdate();
    }
  };
  
  // Simplified handlers
  const handleSearchFocus = () => setShowLeadDropdown(true);
  const handleSearchBlur = () => {
    // Delay to allow click on dropdown items
    setTimeout(() => setShowLeadDropdown(false), 150);
  };

  // ✅ PATTERN 2: Function References with Fallbacks
  const closeForm = window.closeForm || (() => {
    window.log.debug("closeForm not implemented - using fallback");
    window.setShowAllocationForm && window.setShowAllocationForm(false);
  });

  const handleAllocation = window.handleAllocation || ((e) => {
    e.preventDefault();
    console.warn("handleAllocation not implemented");
    alert("Allocation functionality will be implemented!");
  });

  const handleAllocationInputChange = window.handleAllocationInputChange || ((field, value) => {
    window.log.debug("handleAllocationInputChange not implemented");
    window.log.debug("Would change:", field, "to:", value);
  });

  // Conditional check - parent component handles rendering logic now
  if (!currentInventory) {
    return React.createElement('div', { className: 'text-center p-4' }, 'No inventory selected');
  }

  // ✅ OPTIMIZED: Only log essential info on form show
  window.log.debug("📦 Allocation form rendering for:", currentInventory?.event_name);
  window.log.debug("🔍 Search results:", searchResults?.length || 0);

  // NEW: Check if inventory has categories
  const hasCategories = currentInventory.categories && Array.isArray(currentInventory.categories) && currentInventory.categories.length > 0;
  
  // NEW: Get selected category details
  const selectedCategory = hasCategories && allocationData.category_index !== undefined && allocationData.category_index !== ''
    ? currentInventory.categories[allocationData.category_index]
    : null;

  // NEW: Calculate available tickets based on category or total
  const availableTickets = selectedCategory 
    ? selectedCategory.available_tickets 
    : currentInventory.available_tickets || 0;

  // Get selected lead details from stored selection
  const selectedLead = window.allocationFormState.selectedLead;

  // Ensure quantity has a default value
  const currentQuantity = allocationData.quantity || 1;

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => {
      if (e.target === e.currentTarget) {
        window.log.debug("🔄 Clicked outside, closing allocation form");
        closeForm();
      }
    }
  },
    React.createElement('div', {
      className: 'bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto'
    },
      React.createElement('div', { className: 'flex justify-between items-start mb-6' },
        React.createElement('div', null,
          React.createElement('h2', { className: 'text-xl font-bold text-gray-900 dark:text-white' },
            `Allocate Tickets - ${currentInventory.event_name}`
          ),
          React.createElement('div', { className: 'text-sm text-gray-500 mt-1' },
            `Search leads by typing in the field below`
          )
        ),
        React.createElement('button', {
          onClick: closeForm,
          className: 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl'
        }, '✕')
      ),

      // Debug Information (temporary)
      React.createElement('div', { className: 'bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-4 border border-yellow-300' },
        React.createElement('h4', { className: 'font-bold text-yellow-800 dark:text-yellow-200 mb-2' }, '🔍 Debug Information'),
        React.createElement('div', { className: 'text-sm text-yellow-700 dark:text-yellow-300 space-y-1' },
          React.createElement('div', null, `Current category value: "${allocationData.category_name || 'none'}"`),
          React.createElement('div', null, `Current category index: ${allocationData.category_index !== undefined ? allocationData.category_index : 'none'}`),
          React.createElement('div', null, `Has categories: ${hasCategories}`),
          React.createElement('div', null, `Number of categories: ${currentInventory.categories ? currentInventory.categories.length : 0}`),
          React.createElement('div', null, `Selected category object: ${selectedCategory ? `${selectedCategory.name} (index ${allocationData.category_index})` : 'none'}`),
          React.createElement('div', null, `Available tickets: ${availableTickets}`)
        )
      ),

      // Event Information Summary
      React.createElement('div', { className: 'bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6' },
        React.createElement('div', { className: 'grid grid-cols-2 gap-4 text-sm' },
          React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'Available Tickets: '),
            React.createElement('span', { className: 'text-green-600 dark:text-green-400 font-bold' }, 
              availableTickets
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
              hasCategories ? 'Multiple Categories' : (currentInventory.category_of_ticket || 'General')
            )
          ),
          React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'Price: '),
            React.createElement('span', { className: 'text-gray-900 dark:text-white font-bold' }, 
              selectedCategory 
                ? `₹${selectedCategory.selling_price || 0}`
                : `₹${currentInventory.selling_price || 0}`
            )
          )
        )
      ),

      // ⭐ NEW: Existing Allocations Section (updated to show categories)
      React.createElement('div', { className: 'mb-6' },
        React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 dark:text-white mb-3' },
          'Existing Allocations'
        ),
        React.createElement('div', { className: 'space-y-2 max-h-48 overflow-y-auto' },
          currentAllocations.length === 0 ?
            React.createElement('p', { className: 'text-gray-500 dark:text-gray-400 text-center py-4' },
              'No allocations found for this inventory item.'
            ) :
            currentAllocations.map((allocation, index) =>
              React.createElement('div', {
                key: allocation.id || index,
                className: 'p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600'
              },
                React.createElement('div', { className: 'flex justify-between items-start' },
                  React.createElement('div', null,
                    React.createElement('p', { className: 'font-medium text-gray-900 dark:text-white' },
                      allocation.lead_name || allocation.client_name || `Allocation #${index + 1}`
                    ),
                    React.createElement('p', { className: 'text-sm text-gray-600 dark:text-gray-400' },
                      `${allocation.tickets_allocated || allocation.quantity || 0} tickets`,
                      allocation.category_name && React.createElement('span', { className: 'ml-2' },
                        `(${allocation.category_name})`
                      )
                    )
                  ),
                  React.createElement('div', { className: 'text-right' },
                    React.createElement('p', { className: 'text-sm text-gray-500 dark:text-gray-400' },
                      new Date(allocation.allocation_date || allocation.created_at).toLocaleDateString()
                    )
                  )
                )
              )
            )
        )
      ),

      React.createElement('form', { onSubmit: handleAllocation },
        // Searchable Lead Selection
        React.createElement('div', { className: 'mb-6 lead-search-container' },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' },
            'Search and Select Lead'
          ),
          
          // Search Input
          React.createElement('div', { className: 'relative' },
            React.createElement('input', {
              type: 'text',
              placeholder: selectedLead && selectedLead.name !== 'Loading...' ? 
                `Selected: ${selectedLead.name} (${selectedLead.status || 'Unknown'})` : 
                'Type to search leads by name, email, phone, company, or event...',
              value: leadSearch || '',
              onChange: (e) => {
                console.log('Search input changed:', e.target.value);
                setLeadSearch(e.target.value);
              },
              onFocus: handleSearchFocus,
              onBlur: handleSearchBlur,
              className: `w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 ${selectedLead && selectedLead.name !== 'Loading...' ? 'bg-green-50 dark:bg-green-900' : ''}`
            }),
            
            // Search Icon
            React.createElement('div', { 
              className: 'absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none' 
            },
              React.createElement('span', { className: 'text-gray-400' }, '🔍')
            )
          ),
          
          // Selected Lead Display
          selectedLead && React.createElement('div', { 
            className: 'mt-2 p-3 bg-blue-50 dark:bg-blue-900 rounded-md border-l-4 border-blue-500' 
          },
            React.createElement('div', { className: 'flex justify-between items-center' },
              React.createElement('div', null,
                React.createElement('div', { className: 'font-medium text-blue-900 dark:text-blue-100' },
                  selectedLead.name
                ),
                React.createElement('div', { className: 'text-sm text-blue-700 dark:text-blue-300' },
                  `${selectedLead.email || selectedLead.phone || 'No contact'} • ${selectedLead.status} • ${selectedLead.event_name || selectedLead.lead_for_event || 'No event'}`
                )
              ),
              React.createElement('button', {
                type: 'button',
                onClick: () => {
                  // Clear selected lead and ID
                  window.allocationFormState.selectedLead = null;
                  handleAllocationInputChange('lead_id', '');
                  setLeadSearch('');
                },
                className: 'text-blue-600 hover:text-blue-800 text-sm font-medium'
              }, 'Change')
            )
          ),
          
          // Dropdown Results
          (showLeadDropdown && (leadSearch || searching)) && React.createElement('div', { 
            className: 'absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto' 
          },
            searching ? React.createElement('div', { 
              className: 'p-3 text-center text-gray-500 dark:text-gray-400' 
            }, 'Searching...') :
            searchResults.length > 0 ? searchResults.slice(0, 10).map(lead =>
              React.createElement('div', {
                key: lead.id,
                onMouseDown: (e) => {
                  e.preventDefault(); // Prevent blur event
                  // Store complete lead object and ID
                  window.allocationFormState.selectedLead = lead;
                  handleAllocationInputChange('lead_id', lead.id);
                  setShowLeadDropdown(false);
                  setLeadSearch('');
                  // Force re-render to show selected lead
                  if (window.appState?.forceUpdate) {
                    window.appState.forceUpdate();
                  } else if (window.forceUpdate) {
                    window.forceUpdate();
                  }
                },
                className: 'p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600'
              },
                React.createElement('div', { className: 'font-medium text-gray-900 dark:text-white' },
                  lead.name
                ),
                React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-400' },
                  `${lead.email || lead.phone || 'No contact'} • ${lead.status}`,
                  lead.event_name && React.createElement('span', { className: 'ml-2' },
                    `• ${lead.event_name}`
                  )
                )
              )
            ) : React.createElement('div', { 
              className: 'p-3 text-gray-500 dark:text-gray-400 text-center' 
            }, 
              leadSearch.length >= 2 ? 'No leads found matching your search' : 'Type at least 2 characters to search leads'
            )
          )
        ),

        // NEW: Category Selection (only if inventory has categories)
        hasCategories && React.createElement('div', { className: 'mb-6' },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' },
            'Select Ticket Category'
          ),
          React.createElement('select', {
            value: allocationData.category_index !== undefined ? allocationData.category_index : '',
            onChange: (e) => {
              const selectedIndex = parseInt(e.target.value);
              const selectedOption = e.target.options[e.target.selectedIndex];
              
              console.log('=== CATEGORY SELECTION DEBUG ===');
              console.log('Selected index value:', selectedIndex);
              console.log('Selected option text:', selectedOption ? selectedOption.text : 'none');
              
              if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < currentInventory.categories.length) {
                const selectedCategory = currentInventory.categories[selectedIndex];
                console.log('Selected category object:', selectedCategory);
                
                // Store both the index and the category name
                window.updateAllocationData({
                  category_index: selectedIndex,
                  category_name: selectedCategory.name
                });
                
                // Log after change
                setTimeout(() => {
                  console.log('Allocation data after change:', window.allocationData);
                  console.log('=== END CATEGORY DEBUG ===');
                }, 200);
              } else {
                // Clear selection
                window.updateAllocationData({
                  category_index: '',
                  category_name: ''
                });
              }
            },
            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
            required: hasCategories
          },
            React.createElement('option', { value: '' }, 'Select a category...'),
            currentInventory.categories.map((category, index) =>
              React.createElement('option', { 
                key: `category-${index}`, 
                value: index
                // REMOVED: disabled attribute - allow all selections
              },
                `${category.name} - ${category.section || 'General'} (${category.available_tickets} available @ ₹${category.selling_price})`
              )
            )
          ),
          selectedCategory && React.createElement('div', { className: 'mt-2 p-3 bg-blue-50 dark:bg-blue-900 rounded text-sm' },
            React.createElement('p', { className: 'text-blue-800 dark:text-blue-200' },
              `${selectedCategory.name}: ${selectedCategory.available_tickets} tickets available`
            ),
            selectedCategory.inclusions && React.createElement('p', { className: 'text-blue-700 dark:text-blue-300 text-xs mt-1' },
              `Inclusions: ${selectedCategory.inclusions}`
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
              max: availableTickets,
              value: currentQuantity,
              onChange: (e) => {
                const value = parseInt(e.target.value) || 0;
                handleAllocationInputChange('quantity', value);
              },
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

        // Total Amount Calculation (updated to use category pricing)
        currentQuantity > 0 && React.createElement('div', { className: 'bg-blue-50 dark:bg-blue-900 rounded-lg p-4 mb-6' },
          React.createElement('div', { className: 'flex justify-between items-center' },
            React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 
              'Total Amount:'
            ),
            React.createElement('span', { className: 'text-2xl font-bold text-blue-600 dark:text-blue-400' },
              `₹${(currentQuantity * (selectedCategory ? selectedCategory.selling_price : (currentInventory.selling_price || 0))).toLocaleString()}`
            )
          ),
          React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-400 mt-1' },
            `${currentQuantity} tickets × ₹${(selectedCategory ? selectedCategory.selling_price : (currentInventory.selling_price || 0)).toLocaleString()} each`
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
            disabled: loading, // REMOVED other validations - allow submission to see validation errors
            className: 'flex-1 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 font-medium'
          }, loading ? 'Processing...' : 'Allocate and Create Entry')
        )
      )
    )
  );
};

// ✅ OPTIMIZED ALLOCATION HANDLERS

// Enhanced allocation input change handler with throttling
let allocationInputTimeout;
window.handleAllocationInputChange = (field, value, skipDebounce = false) => {
  console.log(`🔍 handleAllocationInputChange called: ${field} = ${value}`);
  
  const updateData = () => {
    console.log(`📝 Processing allocation field change: ${field} = ${value}`);
    window.log.debug(`📝 Allocation field changed: ${field} = ${value}`);
    
    if (window.setAllocationData) {
      console.log('Using setAllocationData');
      window.setAllocationData(prev => {
        const newData = {
          ...prev,
          [field]: value
        };
        console.log('New allocation data:', newData);
        return newData;
      });
    } else {
      console.log('Using fallback - updating window.allocationData directly');
      // Fallback: update window globals directly
      window.allocationData = window.allocationData || {};
      window.allocationData[field] = value;
      if (window.appState) {
        window.appState.allocationData = window.allocationData;
      }
      window.log.debug("⚠️ setAllocationData not available, using fallback");
    }
    
    // Force re-render
    if (window.forceUpdate) {
      console.log('Forcing update after change');
      window.forceUpdate();
    }
  };
  
  if (skipDebounce) {
    updateData();
  } else {
    clearTimeout(allocationInputTimeout);
    allocationInputTimeout = setTimeout(updateData, 100); // Throttle input changes
  }
};

// New function to handle multiple field updates at once
window.updateAllocationData = (updates) => {
  console.log('📝 Updating multiple allocation fields:', updates);
  
  if (window.setAllocationData) {
    window.setAllocationData(prev => {
      const newData = {
        ...prev,
        ...updates
      };
      console.log('New allocation data:', newData);
      return newData;
    });
  } else {
    // Fallback
    window.allocationData = window.allocationData || {};
    Object.assign(window.allocationData, updates);
    if (window.appState) {
      window.appState.allocationData = window.allocationData;
    }
  }
  
  // Force re-render
  if (window.forceUpdate) {
    window.forceUpdate();
  }
};

// Enhanced allocation submission handler (updated to include category)
window.handleAllocation = async (e) => {
  e.preventDefault();
  
  // Permission check
  if (!window.hasPermission('inventory', 'allocate')) {
    alert('You do not have permission to allocate inventory');
    return;
  }

  // Get current quantity with fallback and validation
  const quantity = parseInt(window.allocationData.quantity) || 1;

  // Enhanced validation with detailed error messages
  if (!window.allocationData.lead_id) {
    alert('Validation Error: Please select a lead');
    return;
  }

  if (!window.currentInventory || !window.currentInventory.id) {
    alert('Validation Error: No inventory selected for allocation');
    return;
  }

  console.error('🔍 PRE-ALLOCATION DEBUG:', {
    leadId: window.allocationData.lead_id,
    quantity,
    inventoryId: window.currentInventory.id,
    hasSelectedLead: !!window.allocationFormState.selectedLead,
    allocationData: window.allocationData,
    selectedLead: window.allocationFormState.selectedLead
  });

  // NEW: Validate category selection if inventory has categories
  const hasCategories = window.currentInventory.categories && Array.isArray(window.currentInventory.categories) && window.currentInventory.categories.length > 0;
  if (hasCategories && !window.allocationData.category_name) {
    alert('Validation Error: Please select a ticket category');
    return;
  }

  if (quantity < 1) {
    alert('Validation Error: Please enter a valid quantity (at least 1)');
    return;
  }

  // NEW: Validate against category-specific availability
  const selectedCategory = hasCategories && window.allocationData.category_index !== undefined && window.allocationData.category_index !== ''
    ? window.currentInventory.categories[window.allocationData.category_index]
    : null;
  
  const availableTickets = selectedCategory 
    ? selectedCategory.available_tickets 
    : window.currentInventory.available_tickets;

  // Check if category has 0 tickets available
  if (selectedCategory && selectedCategory.available_tickets === 0) {
    alert(`Validation Error: The selected category "${selectedCategory.name}" has 0 tickets available. Please select a different category.`);
    return;
  }

  if (quantity > availableTickets) {
    alert(`Validation Error: Quantity (${quantity}) exceeds available tickets (${availableTickets}) for the selected category "${selectedCategory ? selectedCategory.name : 'General'}".`);
    return;
  }

  window.setLoading(true);

  try {
    window.log.debug('🔄 Creating allocation...', window.allocationData);

    // Get the selected lead from our stored selection
    const selectedLead = window.allocationFormState.selectedLead;
    if (!selectedLead || !selectedLead.id) {
      throw new Error('Please select a lead first');
    }
    
    // Verify the lead ID matches what's stored in allocation data
    if (selectedLead.id !== window.allocationData.lead_id) {
      throw new Error('Lead selection mismatch. Please select the lead again.');
    }

    // Validate lead status - backend only allows certain statuses
    const allowedStatuses = ['converted', 'payment_received', 'payment_post_service'];
    if (!allowedStatuses.includes(selectedLead.status)) {
      alert(`Validation Error: Cannot allocate to lead with status "${selectedLead.status}". Lead must be in one of these statuses: ${allowedStatuses.join(', ')}`);
      return;
    }
    
    console.log(`✅ Allocating to lead: ${selectedLead.name} (${selectedLead.status}) - Status valid for allocation`);

    // Create the allocation request - start with minimal essential fields
    const allocationRequest = {
      lead_id: window.allocationData.lead_id,
      tickets_allocated: parseInt(quantity),
      allocation_date: window.allocationData.allocation_date || new Date().toISOString().split('T')[0],
      notes: window.allocationData.notes || ''
    };

    // Add category if inventory has categories
    if (window.allocationData.category_name && window.allocationData.category_name !== null) {
      allocationRequest.category_name = window.allocationData.category_name;
    }

    // Try a simpler version first - with both field name variations
    const simpleAllocationRequest = {
      lead_id: window.allocationData.lead_id,
      quantity: parseInt(quantity),
      tickets_allocated: parseInt(quantity)
    };

    console.error('🔍 TRYING SIMPLE REQUEST FIRST:', JSON.stringify(simpleAllocationRequest, null, 2));

    let response;
    try {
      // Try the simple request first
      response = await window.apiCall(`/inventory/${window.currentInventory.id}/allocate`, {
        method: 'POST',
        body: JSON.stringify(simpleAllocationRequest)
      });
      console.error('📡 API RESPONSE (SUCCESS):', JSON.stringify(response, null, 2));
    } catch (apiError) {
      console.error('📡 SIMPLE REQUEST FAILED, TRYING FULL REQUEST:', apiError.message);
      
      // If simple request fails, try the full request
      try {
        console.error('🔍 TRYING FULL REQUEST:', JSON.stringify(allocationRequest, null, 2));
        response = await window.apiCall(`/inventory/${window.currentInventory.id}/allocate`, {
          method: 'POST',
          body: JSON.stringify(allocationRequest)
        });
        console.error('📡 FULL REQUEST SUCCESS:', JSON.stringify(response, null, 2));
      } catch (fullRequestError) {
        console.error('📡 BOTH REQUESTS FAILED:', fullRequestError.message);
        throw apiError; // Throw the original error
      }
    }
    
    if (response.error) {
      console.error('❌ API returned error:', response.error);
      throw new Error(response.error);
    }
    
    if (!response.success && !response.data) {
      console.error('❌ Unexpected API response:', response);
      throw new Error('Invalid API response format');
    }

    // Extract allocated tickets from response (should be > 0 if successful)
    const allocatedTickets = parseInt(response.message.match(/allocated (\d+) tickets/)?.[1] || 0);
    const remainingTickets = response.remaining_tickets;
    
    console.log(`📊 Allocation result: ${allocatedTickets} tickets allocated, ${remainingTickets} remaining`);

    if (allocatedTickets === 0) {
      console.warn('⚠️ Warning: API returned success but 0 tickets were allocated');
    }

    // Update inventory available tickets with response data
    if (window.setInventory) {
      window.setInventory(prev => prev.map(item =>
        item.id === window.currentInventory.id
          ? { ...item, available_tickets: remainingTickets }
          : item
      ));
    }

    // Update current inventory object
    window.currentInventory.available_tickets = remainingTickets;

    // Reset allocation data and form state
    window.allocationData = {};
    if (window.setAllocationData) {
      window.setAllocationData({});
    }
    
    // Reset allocation form state
    window.allocationFormState.selectedLead = null;
    window.allocationFormState.leadSearch = '';
    window.allocationFormState.searchResults = [];

    // Show success message with allocated count
    const successMessage = allocatedTickets > 0 
      ? `Successfully allocated ${allocatedTickets} ticket(s) to ${selectedLead.name}!`
      : `Allocation created but 0 tickets were allocated. Please check the allocation details.`;
    
    alert(successMessage);

    // Mark form as unmounted and close
    window.allocationFormState.formMounted = false;
    window.setShowAllocationForm(false);
    
    // Note: We don't refresh allocations here to avoid React DOM conflicts
    // If user needs to see updated allocations, they can open allocation management

  } catch (error) {
    console.error('Allocation error:', error);
    alert('Error: ' + error.message);
  } finally {
    window.setLoading(false);
    // Ensure form is marked as unmounted on any exit
    window.allocationFormState.formMounted = false;
  }
};

// ⭐ NEW: Function to search leads dynamically with API calls
let searchTimeout;
async function searchLeadsForAllocation(searchTerm) {
  // Clear previous timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  
  // Set searching state
  window.allocationFormState.searching = true;
  
  // Debounce search to avoid too many API calls
  searchTimeout = setTimeout(async () => {
    try {
      console.error('🔍 SEARCHING LEADS FOR ALLOCATION:', searchTerm);
      
      // Build query parameters for search
      const queryParams = new URLSearchParams({
        search: searchTerm,
        limit: 50, // Reasonable limit for dropdown
        page: 1
      });
      
      // Add filters if they exist
      if (window.allocationFormState.eventFilter && window.allocationFormState.eventFilter !== 'all') {
        queryParams.append('event', window.allocationFormState.eventFilter);
      }
      if (window.allocationFormState.statusFilter && window.allocationFormState.statusFilter !== 'all') {
        queryParams.append('status', window.allocationFormState.statusFilter);
      }
      
      const response = await window.apiCall(`/leads/paginated?${queryParams.toString()}`);
      
      if (response.success && response.data) {
        console.log(`✅ Found ${response.data.length} leads matching search`);
        
        // Update search results
        window.allocationFormState.searchResults = response.data;
        window.allocationFormState.searching = false;
        
        // Force re-render
        if (window.appState?.forceUpdate) {
          window.appState.forceUpdate();
        } else if (window.forceUpdate) {
          window.forceUpdate();
        }
        
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to search leads');
      }
    } catch (error) {
      console.error('❌ Failed to search leads for allocation:', error);
      
      // Set empty results on error
      window.allocationFormState.searchResults = [];
      window.allocationFormState.searching = false;
      
      // Force re-render
      if (window.appState?.forceUpdate) {
        window.appState.forceUpdate();
      } else if (window.forceUpdate) {
        window.forceUpdate();
      }
      
      return [];
    }
  }, 500); // 500ms debounce
}

// ⭐ NEW: Function to fetch allocations for an inventory item
async function fetchInventoryAllocations(inventoryId) {
  try {
    console.log(`📡 Fetching allocations for inventory ${inventoryId}...`);
    
    // Use the correct endpoint pattern we discovered
    const response = await window.apiCall(`/inventory/${inventoryId}/allocations`);
    console.log('Allocations response:', response);
    
    // Extract allocations from the response
    let allocations = [];
    if (response.data && response.data.allocations) {
      allocations = response.data.allocations;
    } else if (Array.isArray(response)) {
      allocations = response;
    }
    
    // Update state with the fetched allocations
    if (window.setCurrentAllocations) {
      window.setCurrentAllocations(allocations);
    } else {
      // Fallback: set directly on window
      window.currentAllocations = allocations;
      if (window.appState) {
        window.appState.currentAllocations = allocations;
      }
    }
    
    console.log(`✅ Loaded ${allocations.length} allocations`);
    
    // Skip force updates to prevent React DOM conflicts
    // Force updates can cause reconciliation errors when components are unmounting
    console.log('Skipping force update to prevent DOM conflicts');
    
    return allocations;
    
  } catch (error) {
    console.error('❌ Failed to fetch allocations:', error);
    // Set empty array on error
    if (window.setCurrentAllocations) {
      window.setCurrentAllocations([]);
    } else {
      window.currentAllocations = [];
    }
    return [];
  }
}

// ⭐ ENHANCED: Initialize allocation data with category support
window.openAllocationForm = (inventory) => {
  console.log('📦 Opening allocation form for:', inventory?.event_name);
  
  // Check if inventory has categories
  const hasCategories = inventory.categories && Array.isArray(inventory.categories) && inventory.categories.length > 0;
  
  // Reset search state
  window.allocationFormState = {
    leadSearch: '',
    showLeadDropdown: false,
    eventFilter: inventory.event_name || '', // Default to current event
    statusFilter: 'all',
    searchResults: [],
    searching: false,
    selectedLead: null,
    formMounted: true
  };
  
  // Initialize allocation data with default values
  window.allocationData = {
    lead_id: '',
    quantity: 1,
    allocation_date: new Date().toISOString().split('T')[0],
    notes: '',
    // NEW: Add category selection - no default to avoid selection issues
    category_name: '',
    category_index: ''
  };
  
  // Update state if setters are available
  if (window.setAllocationData) {
    window.setAllocationData(window.allocationData);
  }
  
  window.currentInventory = inventory;
  if (window.setCurrentInventory) {
    window.setCurrentInventory(inventory);
  }
  
  window.setShowAllocationForm(true);
  
  // Note: Removed fetchInventoryAllocations call to prevent React DOM conflicts
  // Existing allocations will be shown as empty initially
  // User can refresh via allocation management if needed
};

// Add event listener for search changes to force re-render
window.addEventListener('allocation-search-changed', () => {
  if (window.appState?.forceUpdate) {
    window.appState.forceUpdate();
  } else if (window.forceUpdate) {
    window.forceUpdate();
  } else {
    // Fallback: trigger a state change to force React re-render
    const event = new Event('state-changed');
    document.dispatchEvent(event);
  }
});

// ⭐ Function to fetch selected lead details if not in current results
async function fetchLeadDetails(leadId) {
  try {
    const response = await window.apiCall(`/leads/${leadId}`);
    if (response.success && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error('Failed to fetch lead details:', error);
  }
  return null;
}

window.log.debug('✅ Optimized Allocation Form with Dynamic Search loaded');
console.log('🎫 Allocation Form v5.0 - Dynamic API Search & Filtering');
