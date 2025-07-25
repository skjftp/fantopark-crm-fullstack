// components/inventory.js
// Complete Enhanced Inventory Content Component with Search Functionality
// FanToPark CRM - Full replacement for existing inventory.js

// Initialize search state if not already present
window.inventorySearchQuery = window.inventorySearchQuery || '';

// Refresh inventory function
window.refreshInventory = async () => {
  console.log('🔄 Refreshing inventory...');
  try {
    if (window.fetchData) {
      await window.fetchData();
    }
    if (window.renderApp) {
      window.renderApp();
    }
  } catch (error) {
    console.error('Error refreshing inventory:', error);
  }
};

// Initialize filter states if not already present
window.inventoryEventFilter = window.inventoryEventFilter || 'all';
window.inventoryEventTypeFilter = window.inventoryEventTypeFilter || 'all';
window.inventoryDueDateFilter = window.inventoryDueDateFilter || 'all';
window.inventorySortField = window.inventorySortField || 'event_date';
window.inventorySortDirection = window.inventorySortDirection || 'asc';
window.currentInventoryPage = window.currentInventoryPage || 1;
window.itemsPerPage = window.itemsPerPage || 10;

// Search state setter
window.setInventorySearchQuery = window.setInventorySearchQuery || ((query) => {
  console.log("🔍 setInventorySearchQuery called with:", query);
  window.inventorySearchQuery = query;
  if (window.state && window.state.setInventorySearchQuery) {
    window.state.setInventorySearchQuery(query);
  }
  // Reset to first page when search changes
  window.setCurrentInventoryPage(1);
});

// Enhanced filtering function with search capability
window.getFilteredInventory = () => {
  return (window.inventory || []).filter(item => {
    const daysUntilEvent = window.getInventoryDueInDays(item.event_date);

    // Text search across multiple fields
    if (window.inventorySearchQuery && window.inventorySearchQuery.trim()) {
      const searchTerm = window.inventorySearchQuery.toLowerCase().trim();
      const searchableFields = [
        item.event_name || '',
        item.event_type || '',
        item.sports || '',
        item.venue || '',
        item.category_of_ticket || '',
        item.stand || '',
        item.booking_person || '',
        item.procurement_type || '',
        item.notes || '',
        item.supplierName || '',
        item.supplierInvoice || '',
        item.inclusions || ''
      ];
      
      const matchesSearch = searchableFields.some(field => 
        field.toLowerCase().includes(searchTerm)
      );
      
      if (!matchesSearch) {
        return false;
      }
    }

    // Event name filter
    if (window.inventoryEventFilter !== 'all' && item.event_name !== window.inventoryEventFilter) {
      return false;
    }

    // Event type filter
    if (window.inventoryEventTypeFilter !== 'all' && item.event_type !== window.inventoryEventTypeFilter) {
      return false;
    }

    // Due date filter
    switch (window.inventoryDueDateFilter) {
      case '3days':
        return daysUntilEvent >= 0 && daysUntilEvent <= 3;
      case '7days':
        return daysUntilEvent >= 0 && daysUntilEvent <= 7;
      case '15days':
        return daysUntilEvent >= 0 && daysUntilEvent <= 15;
      case '30days':
        return daysUntilEvent >= 0 && daysUntilEvent <= 30;
      case 'all':
      default:
        return true;
    }
  });
};

// Revenue calculation function (missing utility)
window.calculateInventoryRevenue = (item) => {
  const sellingPrice = parseFloat(item.selling_price || 0);
  const buyingPrice = parseFloat(item.buying_price || item.totalPurchaseAmount || 0);
  const totalTickets = parseInt(item.total_tickets || 0);
  const availableTickets = parseInt(item.available_tickets || 0);
  const soldTickets = totalTickets - availableTickets;

  return {
    potential: sellingPrice * totalTickets, // Total potential revenue
    actual: sellingPrice * soldTickets, // Actual revenue from sold tickets
    cost: buyingPrice, // Total cost
    profit: (sellingPrice * soldTickets) - buyingPrice // Actual profit
  };
};

// Permission check utility (with fallback)
window.hasPermission = window.hasPermission || ((module, action) => {
  // Fallback - if no permission system, allow all actions for now
  console.log(`Permission check: ${module}.${action} - fallback allowing`);
  return true;
});

// Missing function fallbacks
window.openInventoryDetail = window.openInventoryDetail || ((item) => {
  console.log('openInventoryDetail called with:', item);
  alert('Inventory detail functionality not yet implemented');
});

window.openEditInventoryForm = window.openEditInventoryForm || ((item) => {
  console.log('openEditInventoryForm called with:', item);
  alert('Edit inventory functionality not yet implemented');
});

window.openAllocationManagement = window.openAllocationManagement || ((item) => {
  console.log('openAllocationManagement called with:', item);
  alert('Allocation management functionality not yet implemented');
});

window.handleDeleteInventory = window.handleDeleteInventory || ((itemId) => {
  console.log('handleDeleteInventory called with:', itemId);
  if (confirm('Are you sure you want to delete this inventory item?')) {
    alert('Delete functionality not yet implemented');
  }
});

window.openInventoryCSVUpload = window.openInventoryCSVUpload || (() => {
  console.log('openInventoryCSVUpload called');
  alert('CSV upload functionality not yet implemented');
});

window.openAddInventoryForm = window.openAddInventoryForm || (() => {
  console.log('openAddInventoryForm called');
  alert('Add inventory functionality not yet implemented');
});

// Search input component
window.renderInventorySearchInput = () => {
  return React.createElement('div', { className: 'flex-1' },
    React.createElement('label', { 
      className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' 
    }, '🔍 Search Inventory'),
    React.createElement('div', { className: 'relative' },
      React.createElement('input', {
        type: 'text',
        placeholder: 'Search by event name, venue, sports, category, booking person, notes...',
        value: window.inventorySearchQuery || '',
        onChange: (e) => window.setInventorySearchQuery(e.target.value),
        className: 'w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
      }),
      React.createElement('div', {
        className: 'absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'
      },
        React.createElement('svg', {
          className: 'h-5 w-5 text-gray-400',
          fill: 'none',
          viewBox: '0 0 24 24',
          stroke: 'currentColor'
        },
          React.createElement('path', {
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeWidth: 2,
            d: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
          })
        )
      ),
      // Clear search button
      window.inventorySearchQuery && React.createElement('button', {
        onClick: () => window.setInventorySearchQuery(''),
        className: 'absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
      },
        React.createElement('svg', {
          className: 'h-5 w-5',
          fill: 'none',
          viewBox: '0 0 24 24',
          stroke: 'currentColor'
        },
          React.createElement('path', {
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeWidth: 2,
            d: 'M6 18L18 6M6 6l12 12'
          })
        )
      )
    )
  );
};

// Main inventory content render function
window.renderInventoryContent = () => {
    // Use the new filtering function
    const filteredInventory = window.getFilteredInventory();

    // ENHANCED SORTING - works on ALL filtered data before pagination
    const sortedInventory = filteredInventory.sort((a, b) => {
        let aValue, bValue;

        switch (window.inventorySortField) {
            case 'event_date':
                aValue = new Date(a.event_date);
                bValue = new Date(b.event_date);
                break;
            case 'event_name':
                aValue = a.event_name.toLowerCase();
                bValue = b.event_name.toLowerCase();
                break;
            case 'event_type':
                aValue = (a.event_type || '').toLowerCase();
                bValue = (b.event_type || '').toLowerCase();
                break;
            case 'available_tickets':
                aValue = parseInt(a.available_tickets) || 0;
                bValue = parseInt(b.available_tickets) || 0;
                break;
            default:
                aValue = new Date(a.event_date);
                bValue = new Date(b.event_date);
        }

        if (window.inventorySortDirection === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    // Pagination logic for inventory (applied AFTER filtering and sorting)
    const indexOfLastInventory = window.currentInventoryPage * window.itemsPerPage;
    const indexOfFirstInventory = indexOfLastInventory - window.itemsPerPage;
    const currentInventoryItems = sortedInventory.slice(indexOfFirstInventory, indexOfLastInventory);
    const totalInventoryPages = Math.ceil(sortedInventory.length / window.itemsPerPage);

    return React.createElement('div', { className: 'space-y-6' },
        // Header section
        React.createElement('div', { className: 'flex justify-between items-center flex-wrap gap-4' },
            React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' }, 'Inventory Management'),
            React.createElement('div', { className: 'flex gap-2' },
                window.hasPermission('inventory', 'write') && React.createElement('button', { 
                    className: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors',
                    onClick: window.openAddInventoryForm
                }, '+ Add New Event'),
                React.createElement('button', {
                    onClick: window.openInventoryCSVUpload,
                    className: 'bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors'
                }, 
                    React.createElement('svg', {
                        className: 'w-5 h-5',
                        fill: 'none',
                        stroke: 'currentColor',
                        viewBox: '0 0 24 24'
                    },
                        React.createElement('path', {
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round',
                            strokeWidth: 2,
                            d: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
                        })
                    ),
                    'Upload CSV'
                ),
                React.createElement('button', {
                    onClick: () => window.openBulkAllocationUpload && window.openBulkAllocationUpload(),
                    className: 'bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors',
                    title: 'Bulk allocate tickets to leads via CSV'
                }, 
                    React.createElement('span', { className: 'text-lg' }, '🎫'),
                    'Bulk Allocate'
                )
            )
        ),

        // ENHANCED FILTERS SECTION WITH SEARCH AND SORT IN SAME ROW
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow border p-4 mb-4' },
            // First row - Search bar (full width)
            React.createElement('div', { className: 'mb-4' },
                window.renderInventorySearchInput()
            ),
            
            // Second row - Filters AND Sort in same row
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4' },
             
                // Due Date Filter
                React.createElement('div', { className: 'flex-1' },
                    React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' }, 'Filter by Due Date'),
                    React.createElement('select', {
                        value: window.inventoryDueDateFilter,
                        onChange: (e) => {
                            window.setInventoryDueDateFilter(e.target.value);
                            window.setCurrentInventoryPage(1);
                        },
                        className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500'
                    },
                        React.createElement('option', { value: 'all' }, 'All Inventory'),
                        React.createElement('option', { value: '3days' }, 'Due in 3 Days'),
                        React.createElement('option', { value: '7days' }, 'Due in 7 Days'),
                        React.createElement('option', { value: '15days' }, 'Due in 15 Days'),
                        React.createElement('option', { value: '30days' }, 'Due in 1 Month')
                    )
                ),

                // Event Name Filter
                React.createElement('div', { className: 'flex-1' },
                    React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' }, 'Filter by Event'),
                    React.createElement('select', {
                        value: window.inventoryEventFilter,
                        onChange: (e) => {
                            window.setInventoryEventFilter(e.target.value);
                            window.setCurrentInventoryPage(1);
                        },
                        className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500'
                    },
                        React.createElement('option', { value: 'all' }, 'All Events'),
                        ...Array.from(new Set((window.inventory || []).map(item => item.event_name))).sort().map(event =>
                            React.createElement('option', { key: event, value: event }, event)
                        )
                    )
                ),

                // Event Type Filter
                React.createElement('div', { className: 'flex-1' },
                    React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' }, 'Filter by Event Type'),
                    React.createElement('select', {
                        value: window.inventoryEventTypeFilter,
                        onChange: (e) => {
                            window.setInventoryEventTypeFilter(e.target.value);
                            window.setCurrentInventoryPage(1);
                        },
                        className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500'
                    },
                        React.createElement('option', { value: 'all' }, 'All Event Types'),
                        ...Array.from(new Set((window.inventory || []).map(item => item.event_type).filter(Boolean))).sort().map(eventType =>
                            React.createElement('option', { key: eventType, value: eventType }, eventType)
                        )
                    )
                ),

                // Sort By Dropdown - NOW IN SAME ROW
                React.createElement('div', { className: 'flex-1' },
                    React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' }, 'Sort by'),
                    React.createElement('div', { className: 'flex gap-2' },
                        React.createElement('select', {
                            value: window.inventorySortField,
                            onChange: (e) => {
                                window.setInventorySortField(e.target.value);
                                window.setCurrentInventoryPage(1);
                            },
                            className: 'flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500'
                        },
                            React.createElement('option', { value: 'event_date' }, 'Event Date'),
                            React.createElement('option', { value: 'event_name' }, 'Event Name'),
                            React.createElement('option', { value: 'event_type' }, 'Event Type'),
                            React.createElement('option', { value: 'available_tickets' }, 'Available Tickets')
                        ),
                        React.createElement('button', {
                            onClick: () => {
                                window.setInventorySortDirection(window.inventorySortDirection === 'asc' ? 'desc' : 'asc');
                                window.setCurrentInventoryPage(1);
                            },
                            className: 'px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-blue-500',
                            title: window.inventorySortDirection === 'asc' ? 'Sort Descending' : 'Sort Ascending'
                        }, window.inventorySortDirection === 'asc' ? '↑' : '↓')
                    )
                )
            ),

            // Filter Status Summary with search info
            React.createElement('div', { className: 'mt-4 flex justify-between items-center' },
                React.createElement('div', { className: 'flex flex-col' },
                    React.createElement('span', { className: 'text-sm text-gray-600 dark:text-gray-400' },
                        `Showing ${sortedInventory.length} of ${(window.inventory || []).length} events`
                    ),
                    window.inventorySearchQuery && React.createElement('span', { className: 'text-xs text-blue-600 dark:text-blue-400 mt-1' },
                        `Search: "${window.inventorySearchQuery}"`
                    )
                ),
                (window.inventoryEventFilter !== 'all' || 
                 window.inventoryEventTypeFilter !== 'all' || 
                 window.inventoryDueDateFilter !== 'all' || 
                 window.inventorySearchQuery) &&
                React.createElement('button', {
                    onClick: () => {
                        window.setInventoryEventFilter('all');
                        window.setInventoryEventTypeFilter('all');
                        window.setInventoryDueDateFilter('all');
                        window.setInventorySearchQuery('');
                        window.setCurrentInventoryPage(1);
                    },
                    className: 'text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline transition-colors'
                }, 'Clear All Filters')
            )
        ),

        // INVENTORY TABLE
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow border' },
            (window.inventory || []).length > 0 ? 
            React.createElement('div', { className: 'overflow-x-auto' },
                React.createElement('table', { className: 'w-full' },
                    React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-900' },
                        React.createElement('tr', null,
                            React.createElement('th', { className: 'w-10 px-2' }, ''), // Empty header for expand button
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider' }, 'Event'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider' }, 'Sports'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider' }, 'Category'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider' }, 'Date'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider' }, 'Available'),
                            window.hasPermission('finance', 'read') && React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider' }, 'Revenue'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider' }, 'Status'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider' }, 'Actions')
                        )
                    ),
                    React.createElement('tbody', { className: 'bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700' },
                        currentInventoryItems.map(item => {
                            const daysUntilEvent = window.getInventoryDueInDays(item.event_date);
                            const statusColor = daysUntilEvent <= 0 ? 'text-red-600' : 
                                              daysUntilEvent <= 3 ? 'text-orange-600' : 
                                              daysUntilEvent <= 7 ? 'text-yellow-600' : 'text-green-600';
                            
                            const revenueData = window.calculateInventoryRevenue(item);
                            
                            // NEW: Check if this item has categories and if it's expanded
                            const hasCategories = item.categories && Array.isArray(item.categories) && item.categories.length > 0;
                            const isExpanded = window.isInventoryExpanded(item.id);
                            
                            // Return a Fragment to allow multiple rows (main + category rows)
                            return React.createElement(React.Fragment, { key: item.id },
                                // Main inventory row
                                React.createElement('tr', { 
                                    className: `hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isExpanded ? 'bg-gray-50 dark:bg-gray-700' : ''}`
                                },
                                    // NEW: Expand/collapse button cell
                                    React.createElement('td', { className: 'w-10 px-2 py-4' },
                                        hasCategories ? React.createElement('button', {
                                            onClick: (e) => {
                                                e.stopPropagation();
                                                window.toggleInventoryExpansion(item.id);
                                            },
                                            className: 'p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors',
                                            title: isExpanded ? 'Collapse categories' : `Expand categories (${item.categories.length})`
                                        },
                                            React.createElement('svg', {
                                                className: `w-4 h-4 text-gray-600 dark:text-gray-400 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`,
                                                fill: 'none',
                                                viewBox: '0 0 24 24',
                                                stroke: 'currentColor'
                                            },
                                                React.createElement('path', {
                                                    strokeLinecap: 'round',
                                                    strokeLinejoin: 'round',
                                                    strokeWidth: 2,
                                                    d: 'M9 5l7 7-7 7'
                                                })
                                            )
                                        ) : null
                                    ),
                                    
                                    // Event Details (modified to show category count)
                                    React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                                        React.createElement('div', { className: 'text-sm font-medium text-gray-900 dark:text-white' },
                                            item.event_name || 'Unnamed Event',
                                            // Show category count badge if has categories
                                            hasCategories && React.createElement('span', { 
                                                className: 'ml-2 inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full' 
                                            }, item.categories.length)
                                        ),
                                        React.createElement('div', { className: 'text-sm text-gray-500 dark:text-gray-400' },
                                            item.venue
                                        )
                                    ),
                                    
                                    // Sports
                                    React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                                        React.createElement('span', { 
                                            className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                        }, item.sports || 'N/A')
                                    ),
                                    
                                    // Category (show aggregate if has categories)
                                    React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                                        React.createElement('div', { className: 'text-sm text-gray-900 dark:text-white' },
                                            hasCategories ? 'Multiple' : (item.category_of_ticket || 'N/A')
                                        ),
                                        React.createElement('div', { className: 'text-sm text-gray-500 dark:text-gray-400' },
                                            hasCategories ? `${item.categories.length} categories` : item.stand
                                        )
                                    ),
                                    
                                    // Date
                                    React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                                        React.createElement('div', { className: `text-sm font-medium ${statusColor}` },
                                            window.formatDate(item.event_date)
                                        ),
                                        React.createElement('div', { className: `text-xs ${statusColor}` },
                                            daysUntilEvent >= 0 ? `${daysUntilEvent} days left` : `${Math.abs(daysUntilEvent)} days ago`
                                        )
                                    ),
                                    
                                    // Available Tickets
                                    React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                                        React.createElement('div', { className: 'text-sm text-gray-900 dark:text-white' },
                                            `${item.available_tickets || 0} / ${item.total_tickets || 0}`
                                        ),
                                        React.createElement('div', { className: 'w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1' },
                                            React.createElement('div', {
                                                className: 'bg-blue-600 h-2 rounded-full',
                                                style: { 
                                                    width: `${((item.available_tickets || 0) / (item.total_tickets || 1)) * 100}%` 
                                                }
                                            })
                                        )
                                    ),
                                    
                                    // Revenue (if permission)
                                    window.hasPermission('finance', 'read') && React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                                        React.createElement('div', { className: 'text-sm font-medium text-gray-900 dark:text-white' },
                                            `₹${(window.formatNumber ? window.formatNumber(revenueData.potential) : revenueData.potential.toLocaleString())}`
                                        ),
                                        React.createElement('div', { className: 'text-xs text-gray-500 dark:text-gray-400' },
                                            `Cost: ₹${(window.formatNumber ? window.formatNumber(revenueData.cost) : revenueData.cost.toLocaleString())}`
                                        )
                                    ),
                                    
                                    // Payment Status
                                    React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                                        React.createElement('span', {
                                            className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                item.paymentStatus === 'paid' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                                                item.paymentStatus === 'partial' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                                                'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                            }`
                                        }, item.paymentStatus || 'unpaid')
                                    ),
                                    
                                    // Actions
                                    React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-right text-sm font-medium' },
                                        React.createElement('div', { className: 'flex items-center gap-2' },
                                            // View Details Button
                                            React.createElement('button', {
                                                onClick: () => window.openInventoryDetail(item),
                                                className: 'text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors',
                                                title: 'View Details'
                                            },
                                                React.createElement('svg', {
                                                    className: 'w-5 h-5',
                                                    fill: 'none',
                                                    stroke: 'currentColor',
                                                    viewBox: '0 0 24 24'
                                                },
                                                    React.createElement('path', {
                                                        strokeLinecap: 'round',
                                                        strokeLinejoin: 'round',
                                                        strokeWidth: 2,
                                                        d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                                                    }),
                                                    React.createElement('path', {
                                                        strokeLinecap: 'round',
                                                        strokeLinejoin: 'round',
                                                        strokeWidth: 2,
                                                        d: 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                                                    })
                                                )
                                            ),
                                            
                                            // Edit Button (if permission)
                                            window.hasPermission('inventory', 'write') && React.createElement('button', {
                                                onClick: () => window.openEditInventoryForm(item),
                                                className: 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 transition-colors',
                                                title: 'Edit Event'
                                            },
                                                React.createElement('svg', {
                                                    className: 'w-5 h-5',
                                                    fill: 'none',
                                                    stroke: 'currentColor',
                                                    viewBox: '0 0 24 24'
                                                },
                                                    React.createElement('path', {
                                                        strokeLinecap: 'round',
                                                        strokeLinejoin: 'round',
                                                        strokeWidth: 2,
                                                        d: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                                                    })
                                                )
                                            ),
                                            
                                            // Allocation Management Button
                                            React.createElement('button', {
                                                onClick: () => window.openAllocationManagement(item),
                                                className: 'text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 transition-colors',
                                                title: 'Manage Allocations'
                                            },
                                                React.createElement('svg', {
                                                    className: 'w-5 h-5',
                                                    fill: 'none',
                                                    stroke: 'currentColor',
                                                    viewBox: '0 0 24 24'
                                                },
                                                    React.createElement('path', {
                                                        strokeLinecap: 'round',
                                                        strokeLinejoin: 'round',
                                                        strokeWidth: 2,
                                                        d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                                                    })
                                                )
                                            ),
                                            
                                            // Delete Button (if permission)
                                            window.hasPermission('inventory', 'delete') && React.createElement('button', {
                                                onClick: () => window.handleDeleteInventory(item.id),
                                                className: 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors',
                                                title: 'Delete Event'
                                            },
                                                React.createElement('svg', {
                                                    className: 'w-5 h-5',
                                                    fill: 'none',
                                                    stroke: 'currentColor',
                                                    viewBox: '0 0 24 24'
                                                },
                                                    React.createElement('path', {
                                                        strokeLinecap: 'round',
                                                        strokeLinejoin: 'round',
                                                        strokeWidth: 2,
                                                        d: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                                                    })
                                                )
                                            )
                                        )
                                    )
                                ),
                                
                                // Category rows when expanded
                                isExpanded && hasCategories && item.categories.map((category, catIndex) => 
                                    React.createElement('tr', {
                                        key: `${item.id}-cat-${catIndex}`,
                                        className: 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-l-4 border-blue-500'
                                    },
                                        // Empty cell for expand column
                                        React.createElement('td', { className: 'w-10 px-2 py-2' }, ''),
                                        
                                        // Category details cell
                                        React.createElement('td', { 
                                            className: 'px-6 py-2',
                                            colSpan: 3 // Spans Event, Sports, Category columns
                                        },
                                            React.createElement('div', { className: 'flex items-center justify-between' },
                                                React.createElement('div', null,
                                                    React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 
                                                        category.name
                                                    ),
                                                    category.section && React.createElement('span', { 
                                                        className: 'ml-2 text-sm text-gray-500 dark:text-gray-400' 
                                                    }, `(${category.section})`)
                                                ),
                                                React.createElement('div', { className: 'text-xs text-gray-500' },
                                                    category.inclusions || 'No inclusions'
                                                )
                                            )
                                        ),
                                        
                                        // Date cell (empty for category rows)
                                        React.createElement('td', { className: 'px-6 py-2' }, ''),
                                        
                                        // Available tickets for this category
                                        React.createElement('td', { className: 'px-6 py-2' },
                                            React.createElement('div', { className: 'text-sm' },
                                                `${category.available_tickets || 0} / ${category.total_tickets || 0}`
                                            )
                                        ),
                                        
                                        // Revenue for this category (if permission)
                                        window.hasPermission('finance', 'read') && React.createElement('td', { className: 'px-6 py-2' },
                                            React.createElement('div', { className: 'text-sm' },
                                                React.createElement('div', null, `₹${((category.selling_price || 0) * (category.total_tickets || 0)).toLocaleString()}`),
                                                React.createElement('div', { className: 'text-xs text-gray-500' }, 
                                                    `₹${category.selling_price || 0} per ticket`
                                                )
                                            )
                                        ),
                                        
                                        // Status cell (shows pricing)
                                        React.createElement('td', { className: 'px-6 py-2' },
                                            React.createElement('div', { className: 'text-xs' },
                                                React.createElement('div', null, `Buy: ₹${category.buying_price || 0}`),
                                                React.createElement('div', null, `Sell: ₹${category.selling_price || 0}`)
                                            )
                                        ),
                                        
                                        // Actions (empty for category rows)
                                        React.createElement('td', { className: 'px-6 py-2' }, '')
                                    )
                                )
                            );
                        })
                    )
                )
            ) : 
            React.createElement('div', { className: 'text-center py-12' },
                React.createElement('svg', {
                    className: 'mx-auto h-12 w-12 text-gray-400',
                    fill: 'none',
                    viewBox: '0 0 24 24',
                    stroke: 'currentColor'
                },
                    React.createElement('path', {
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round',
                        strokeWidth: 2,
                        d: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
                    })
                ),
                React.createElement('h3', { className: 'mt-2 text-sm font-medium text-gray-900 dark:text-white' }, 'No inventory items'),
                React.createElement('p', { className: 'mt-1 text-sm text-gray-500 dark:text-gray-400' }, 'Get started by adding a new event to your inventory.'),
                window.hasPermission('inventory', 'write') && React.createElement('div', { className: 'mt-6' },
                    React.createElement('button', {
                        onClick: window.openAddInventoryForm,
                        className: 'inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    },
                        React.createElement('svg', {
                            className: '-ml-1 mr-2 h-5 w-5',
                            fill: 'none',
                            viewBox: '0 0 24 24',
                            stroke: 'currentColor'
                        },
                            React.createElement('path', {
                                strokeLinecap: 'round',
                                strokeLinejoin: 'round',
                                strokeWidth: 2,
                                d: 'M12 6v6m0 0v6m0-6h6m-6 0H6'
                            })
                        ),
                        'Add New Event'
                    )
                )
            )
        ),

        // PAGINATION
        sortedInventory.length > 0 && React.createElement('div', { className: 'bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6 rounded-lg shadow' },
            React.createElement('div', { className: 'flex-1 flex justify-between sm:hidden' },
                React.createElement('button', {
                    onClick: () => window.setCurrentInventoryPage(Math.max(1, window.currentInventoryPage - 1)),
                    disabled: window.currentInventoryPage === 1,
                    className: 'relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                }, 'Previous'),
                React.createElement('button', {
                    onClick: () => window.setCurrentInventoryPage(Math.min(totalInventoryPages, window.currentInventoryPage + 1)),
                    disabled: window.currentInventoryPage === totalInventoryPages,
                    className: 'ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                }, 'Next')
            ),
            React.createElement('div', { className: 'hidden sm:flex-1 sm:flex sm:items-center sm:justify-between' },
                React.createElement('div', null,
                    React.createElement('p', { className: 'text-sm text-gray-700 dark:text-gray-300' },
                        'Showing ',
                        React.createElement('span', { className: 'font-medium' }, indexOfFirstInventory + 1),
                        ' to ',
                        React.createElement('span', { className: 'font-medium' }, Math.min(indexOfLastInventory, sortedInventory.length)),
                        ' of ',
                        React.createElement('span', { className: 'font-medium' }, sortedInventory.length),
                        ' results'
                    )
                ),
                React.createElement('div', null,
                    React.createElement('nav', { className: 'relative z-0 inline-flex rounded-md shadow-sm -space-x-px' },
                        React.createElement('button', {
                            onClick: () => window.setCurrentInventoryPage(Math.max(1, window.currentInventoryPage - 1)),
                            disabled: window.currentInventoryPage === 1,
                            className: 'relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                        },
                            React.createElement('svg', {
                                className: 'h-5 w-5',
                                fill: 'none',
                                viewBox: '0 0 24 24',
                                stroke: 'currentColor'
                            },
                                React.createElement('path', {
                                    strokeLinecap: 'round',
                                    strokeLinejoin: 'round',
                                    strokeWidth: 2,
                                    d: 'M15 19l-7-7 7-7'
                                })
                            )
                        ),
                        
                        // Page numbers
                        Array.from({ length: Math.min(5, totalInventoryPages) }, (_, i) => {
                            let pageNum;
                            if (totalInventoryPages <= 5) {
                                pageNum = i + 1;
                            } else {
                                if (window.currentInventoryPage <= 3) {
                                    pageNum = i + 1;
                                } else if (window.currentInventoryPage >= totalInventoryPages - 2) {
                                    pageNum = totalInventoryPages - 4 + i;
                                } else {
                                    pageNum = window.currentInventoryPage - 2 + i;
                                }
                            }
                            
                            return React.createElement('button', {
                                key: pageNum,
                                onClick: () => window.setCurrentInventoryPage(pageNum),
                                className: `relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    pageNum === window.currentInventoryPage 
                                        ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 text-blue-600 dark:text-blue-200' 
                                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                                }`
                            }, pageNum);
                        }),
                        
                        React.createElement('button', {
                            onClick: () => window.setCurrentInventoryPage(Math.min(totalInventoryPages, window.currentInventoryPage + 1)),
                            disabled: window.currentInventoryPage === totalInventoryPages,
                            className: 'relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                        },
                            React.createElement('svg', {
                                className: 'h-5 w-5',
                                fill: 'none',
                                viewBox: '0 0 24 24',
                                stroke: 'currentColor'
                            },
                                React.createElement('path', {
                                    strokeLinecap: 'round',
                                    strokeLinejoin: 'round',
                                    strokeWidth: 2,
                                    d: 'M9 5l7 7-7 7'
                                })
                            )
                        )
                    )
                )
            )
        )
    );
};

console.log('✅ Complete Enhanced Inventory Component with Search loaded successfully');
