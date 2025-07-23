// Mobile View Components for FanToPark CRM
// Optimized list views and layouts for mobile

// Mobile Leads View
window.MobileLeadsView = function() {
  const state = window.appState;
  const { leads, loading, searchQuery, leadsSourceFilter, leadsPagination, leadsFilterOptions } = state;
  const pagination = leadsPagination || { page: 1, totalPages: 1, total: 0, hasNext: false, hasPrev: false };

  // Don't filter leads locally since they're already paginated from the server
  const displayLeads = leads || [];

  // Fetch filter options and initial leads on mount
  React.useEffect(() => {
    if (window.LeadsAPI) {
      // Fetch filter options
      if (window.LeadsAPI.fetchFilterOptions) {
        window.LeadsAPI.fetchFilterOptions();
      }
      // Fetch initial leads data
      if (window.LeadsAPI.fetchPaginatedLeads) {
        window.LeadsAPI.fetchPaginatedLeads({ page: 1 });
      }
    }
  }, []);

  const handleLeadClick = (lead) => {
    state.setCurrentLead(lead);
    state.setShowLeadDetail(true);
  };

  const [searchInput, setSearchInput] = React.useState(searchQuery || '');
  
  const handleSearch = (value) => {
    if (window.LeadsAPI && window.LeadsAPI.handleFilterChange) {
      window.LeadsAPI.handleFilterChange('search', value);
    } else {
      state.setSearchQuery(value);
    }
  };
  
  const handleSearchSubmit = () => {
    handleSearch(searchInput);
  };

  const handleStatusFilter = (filter) => {
    if (window.LeadsAPI && window.LeadsAPI.handleFilterChange) {
      window.LeadsAPI.handleFilterChange('status', filter === 'all' ? 'all' : filter);
    } else if (state.setLeadsStatusFilter) {
      state.setLeadsStatusFilter(filter === 'all' ? '' : filter);
    }
  };

  const handlePageChange = (newPage) => {
    if (window.LeadsAPI && window.LeadsAPI.changePage) {
      window.LeadsAPI.changePage(newPage);
    }
  };

  const [showFilters, setShowFilters] = React.useState(false);
  const filterOptions = leadsFilterOptions || window.filterOptions || { sources: [], businessTypes: [], events: [], users: [] };

  if (loading) {
    return React.createElement(window.MobileLoadingState);
  }

  return React.createElement('div', { className: 'mobile-content-wrapper pb-20' },
    // Search bar with filter toggle
    React.createElement('div', { className: 'mobile-search-bar' },
      React.createElement('div', { className: 'flex gap-2' },
        React.createElement('input', {
          type: 'text',
          className: 'mobile-search-input flex-1',
          placeholder: 'Search leads...',
          value: searchInput,
          onChange: (e) => setSearchInput(e.target.value),
          onKeyPress: (e) => {
            if (e.key === 'Enter') {
              handleSearchSubmit();
            }
          },
          style: {
            paddingLeft: '16px',
            paddingRight: searchInput ? '40px' : '16px'
          }
        }),
        searchInput && React.createElement('button', {
          onClick: () => {
            setSearchInput('');
            handleSearch('');
          },
          className: 'absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700',
          style: { right: '120px' }
        }, '✕'),
        React.createElement('button', {
          onClick: handleSearchSubmit,
          className: 'px-4 py-2 rounded-lg bg-blue-600 text-white font-medium'
        }, 'Search'),
        React.createElement('button', {
          onClick: () => setShowFilters(!showFilters),
          className: `px-3 py-2 rounded-lg ${showFilters ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'}`
        }, '⚙️')
      )
    ),

    // Expanded filters section
    showFilters && React.createElement('div', { 
      className: 'bg-gray-50 dark:bg-gray-800 p-4 space-y-3 border-b'
    },
      // Status Filter
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1' }, 'Status'),
        React.createElement('select', {
          value: state.statusFilter || 'all',
          onChange: (e) => window.LeadsAPI?.handleFilterChange('status', e.target.value),
          className: 'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg'
        },
          React.createElement('option', { value: 'all' }, 'All Statuses'),
          // Get all unique statuses from filter options
          (() => {
            const allStatuses = new Set([
              ...(filterOptions.statuses || []),
              ...(filterOptions.standardStatuses || [])
            ]);
            return Array.from(allStatuses)
              .filter(status => window.LEAD_STATUSES?.[status])
              .sort((a, b) => {
                const orderA = window.LEAD_STATUSES[a]?.order || 999;
                const orderB = window.LEAD_STATUSES[b]?.order || 999;
                if (orderA !== orderB) return orderA - orderB;
                return a.localeCompare(b);
              })
              .map(status =>
                React.createElement('option', { key: status, value: status }, 
                  window.LEAD_STATUSES[status].label
                )
              );
          })()
        )
      ),

      // Source Filter
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1' }, 'Source'),
        React.createElement('select', {
          value: state.leadsSourceFilter || 'all',
          onChange: (e) => window.LeadsAPI?.handleFilterChange('source', e.target.value),
          className: 'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg'
        },
          React.createElement('option', { value: 'all' }, 'All Sources'),
          (filterOptions.sources || []).map(source =>
            React.createElement('option', { key: source, value: source }, source)
          )
        )
      ),

      // Business Type Filter
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1' }, 'Business Type'),
        React.createElement('select', {
          value: state.leadsBusinessTypeFilter || 'all',
          onChange: (e) => window.LeadsAPI?.handleFilterChange('business_type', e.target.value),
          className: 'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg'
        },
          React.createElement('option', { value: 'all' }, 'All Business Types'),
          (filterOptions.businessTypes || filterOptions.business_types || []).map(type =>
            React.createElement('option', { key: type, value: type }, type)
          )
        )
      ),

      // Event Filter
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1' }, 'Event'),
        React.createElement('select', {
          value: state.leadsEventFilter || 'all',
          onChange: (e) => window.LeadsAPI?.handleFilterChange('event', e.target.value),
          className: 'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg'
        },
          React.createElement('option', { value: 'all' }, 'All Events'),
          (filterOptions.events || []).map(event =>
            React.createElement('option', { key: event, value: event }, event)
          )
        )
      ),

      // Sales Person Filter
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1' }, 'Sales Person'),
        React.createElement('select', {
          value: window.leadsSalesPersonFilter || state.leadsSalesPersonFilter || 'all',
          onChange: (e) => window.LeadsAPI?.handleFilterChange('assigned_to', e.target.value),
          className: 'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg'
        },
          React.createElement('option', { value: 'all' }, 'All Sales Persons'),
          React.createElement('option', { value: 'unassigned' }, 'Unassigned'),
          (filterOptions.users || []).map(user =>
            React.createElement('option', { key: user.email, value: user.email }, 
              user.name || user.email
            )
          )
        )
      ),

      // Sort controls
      React.createElement('div', { className: 'flex gap-2' },
        React.createElement('div', { className: 'flex-1' },
          React.createElement('label', { className: 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1' }, 'Sort By'),
          React.createElement('select', {
            value: state.leadsSortField || 'date_of_enquiry',
            onChange: (e) => window.LeadsAPI?.updateFilter('sort_by', e.target.value),
            className: 'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg'
          },
            React.createElement('option', { value: 'date_of_enquiry' }, 'Date'),
            React.createElement('option', { value: 'name' }, 'Name'),
            React.createElement('option', { value: 'status' }, 'Status'),
            React.createElement('option', { value: 'potential_value' }, 'Value')
          )
        ),
        React.createElement('div', { className: 'flex-1' },
          React.createElement('label', { className: 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1' }, 'Order'),
          React.createElement('select', {
            value: state.leadsSortDirection || 'desc',
            onChange: (e) => window.LeadsAPI?.updateFilter('sort_order', e.target.value),
            className: 'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg'
          },
            React.createElement('option', { value: 'desc' }, 'Newest First'),
            React.createElement('option', { value: 'asc' }, 'Oldest First')
          )
        )
      )
    ),

    // Page info
    React.createElement('div', { 
      className: 'px-4 py-2 text-sm text-gray-600 dark:text-gray-400'
    }, 
      `Showing ${displayLeads.length} of ${pagination.total || displayLeads.length} leads • Page ${pagination.page || 1} of ${pagination.totalPages || 1}`
    ),

    // Leads list
    React.createElement('div', { className: 'mt-2 space-y-3' },
      displayLeads.length > 0 ?
        displayLeads.map(lead =>
          React.createElement(window.MobileLeadCard, {
            key: lead.id,
            lead: lead,
            onClick: handleLeadClick
          })
        ) :
        React.createElement(window.MobileEmptyState, {
          icon: '👥',
          title: 'No leads found',
          message: searchQuery ? 'Try adjusting your search' : 'Start by adding your first lead',
          action: window.hasPermission('leads', 'create') ? {
            label: 'Add Lead',
            onClick: () => {
              state.setShowAddForm(true);
              state.setCurrentForm('lead');
            }
          } : null
        })
    ),

    // Pagination controls
    pagination.totalPages > 1 && React.createElement('div', {
      className: 'fixed bottom-16 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-3'
    },
      React.createElement('div', { className: 'flex items-center justify-between' },
        // Previous button
        React.createElement('button', {
          onClick: () => handlePageChange(pagination.page - 1),
          disabled: !pagination.hasPrev && pagination.page <= 1,
          className: 'px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed'
        }, '← Previous'),

        // Page indicator
        React.createElement('div', { className: 'flex items-center gap-2' },
          // Show first page
          pagination.page > 2 && React.createElement('button', {
            onClick: () => handlePageChange(1),
            className: 'w-8 h-8 text-sm rounded-md border border-gray-300 dark:border-gray-600'
          }, '1'),
          
          // Show dots if needed
          pagination.page > 3 && React.createElement('span', null, '...'),
          
          // Show current page and neighbors
          Array.from({ length: 3 }, (_, i) => {
            const pageNum = pagination.page - 1 + i;
            if (pageNum < 1 || pageNum > pagination.totalPages) return null;
            return React.createElement('button', {
              key: pageNum,
              onClick: () => handlePageChange(pageNum),
              className: `w-8 h-8 text-sm rounded-md border ${
                pageNum === pagination.page 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'border-gray-300 dark:border-gray-600'
              }`
            }, pageNum);
          }).filter(Boolean),
          
          // Show dots if needed
          pagination.page < pagination.totalPages - 2 && React.createElement('span', null, '...'),
          
          // Show last page
          pagination.page < pagination.totalPages - 1 && React.createElement('button', {
            onClick: () => handlePageChange(pagination.totalPages),
            className: 'w-8 h-8 text-sm rounded-md border border-gray-300 dark:border-gray-600'
          }, pagination.totalPages)
        ),

        // Next button
        React.createElement('button', {
          onClick: () => handlePageChange(pagination.page + 1),
          disabled: !pagination.hasNext && pagination.page >= pagination.totalPages,
          className: 'px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed'
        }, 'Next →')
      )
    )
  );
};

// Mobile Inventory View
window.MobileInventoryView = function() {
  const state = window.appState;
  const { inventory, loading, inventorySearchQuery, inventoryDueDateFilter, inventoryEventFilter, inventoryEventTypeFilter, inventorySortField, inventorySortDirection } = state;
  
  const [showFilters, setShowFilters] = React.useState(false);

  // Apply filters and sort
  const filteredInventory = React.useMemo(() => {
    let filtered = [...(inventory || [])];

    // Search filter
    if (inventorySearchQuery) {
      const search = inventorySearchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.event_name?.toLowerCase().includes(search) ||
        item.venue?.toLowerCase().includes(search) ||
        item.sports?.toLowerCase().includes(search) ||
        item.category_of_ticket?.toLowerCase().includes(search)
      );
    }

    // Due date filter
    if (inventoryDueDateFilter && inventoryDueDateFilter !== 'all') {
      const today = new Date();
      filtered = filtered.filter(item => {
        if (!item.event_date) return false;
        const eventDate = new Date(item.event_date);
        const daysUntil = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
        
        switch(inventoryDueDateFilter) {
          case '3days': return daysUntil <= 3 && daysUntil >= 0;
          case '7days': return daysUntil <= 7 && daysUntil >= 0;
          case '15days': return daysUntil <= 15 && daysUntil >= 0;
          case '30days': return daysUntil <= 30 && daysUntil >= 0;
          default: return true;
        }
      });
    }

    // Event filter
    if (inventoryEventFilter && inventoryEventFilter !== 'all') {
      filtered = filtered.filter(item => item.event_name === inventoryEventFilter);
    }

    // Event type filter
    if (inventoryEventTypeFilter && inventoryEventTypeFilter !== 'all') {
      filtered = filtered.filter(item => item.event_type === inventoryEventTypeFilter);
    }

    // Sort
    const sortField = inventorySortField || 'event_date';
    const sortDir = inventorySortDirection || 'asc';
    
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'event_date') {
        aVal = new Date(aVal || 0);
        bVal = new Date(bVal || 0);
      }
      
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [inventory, inventorySearchQuery, inventoryDueDateFilter, inventoryEventFilter, inventoryEventTypeFilter, inventorySortField, inventorySortDirection]);

  const handleItemClick = (item) => {
    state.setCurrentInventory(item);
    state.setShowInventoryDetail(true);
  };

  // Get unique values for filters
  const uniqueEvents = React.useMemo(() => 
    Array.from(new Set((inventory || []).map(item => item.event_name).filter(Boolean))).sort(),
    [inventory]
  );

  const uniqueEventTypes = React.useMemo(() => 
    Array.from(new Set((inventory || []).map(item => item.event_type).filter(Boolean))).sort(),
    [inventory]
  );

  if (loading) {
    return React.createElement(window.MobileLoadingState);
  }

  return React.createElement('div', { className: 'mobile-content-wrapper' },
    // Search bar with filter toggle
    React.createElement('div', { className: 'mobile-search-bar' },
      React.createElement('div', { className: 'flex gap-2' },
        React.createElement('input', {
          type: 'text',
          className: 'mobile-search-input flex-1',
          placeholder: 'Search inventory...',
          value: inventorySearchQuery || '',
          onChange: (e) => state.setInventorySearchQuery(e.target.value),
          style: {
            paddingLeft: '16px',
            paddingRight: inventorySearchQuery ? '40px' : '16px'
          }
        }),
        inventorySearchQuery && React.createElement('button', {
          onClick: () => state.setInventorySearchQuery(''),
          className: 'absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700',
          style: { right: '60px' }
        }, '✕'),
        React.createElement('button', {
          onClick: () => setShowFilters(!showFilters),
          className: `px-3 py-2 rounded-lg ${showFilters ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'}`
        }, '⚙️')
      )
    ),

    // Expanded filters section
    showFilters && React.createElement('div', { 
      className: 'bg-gray-50 dark:bg-gray-800 p-4 space-y-3 border-b'
    },
      // Due Date Filter
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1' }, 'Filter by Due Date'),
        React.createElement('select', {
          value: inventoryDueDateFilter || 'all',
          onChange: (e) => state.setInventoryDueDateFilter(e.target.value),
          className: 'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg'
        },
          React.createElement('option', { value: 'all' }, 'All Inventory'),
          React.createElement('option', { value: '3days' }, 'Due in 3 Days'),
          React.createElement('option', { value: '7days' }, 'Due in 7 Days'),
          React.createElement('option', { value: '15days' }, 'Due in 15 Days'),
          React.createElement('option', { value: '30days' }, 'Due in 1 Month')
        )
      ),

      // Event Filter
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1' }, 'Filter by Event'),
        React.createElement('select', {
          value: inventoryEventFilter || 'all',
          onChange: (e) => state.setInventoryEventFilter(e.target.value),
          className: 'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg'
        },
          React.createElement('option', { value: 'all' }, 'All Events'),
          uniqueEvents.map(event =>
            React.createElement('option', { key: event, value: event }, event)
          )
        )
      ),

      // Event Type Filter
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1' }, 'Filter by Event Type'),
        React.createElement('select', {
          value: inventoryEventTypeFilter || 'all',
          onChange: (e) => state.setInventoryEventTypeFilter(e.target.value),
          className: 'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg'
        },
          React.createElement('option', { value: 'all' }, 'All Event Types'),
          uniqueEventTypes.map(eventType =>
            React.createElement('option', { key: eventType, value: eventType }, eventType)
          )
        )
      ),

      // Sort controls
      React.createElement('div', { className: 'flex gap-2' },
        React.createElement('div', { className: 'flex-1' },
          React.createElement('label', { className: 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1' }, 'Sort By'),
          React.createElement('select', {
            value: inventorySortField || 'event_date',
            onChange: (e) => state.setInventorySortField(e.target.value),
            className: 'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg'
          },
            React.createElement('option', { value: 'event_date' }, 'Event Date'),
            React.createElement('option', { value: 'event_name' }, 'Event Name'),
            React.createElement('option', { value: 'event_type' }, 'Event Type'),
            React.createElement('option', { value: 'available_tickets' }, 'Available Tickets')
          )
        ),
        React.createElement('button', {
          onClick: () => state.setInventorySortDirection(inventorySortDirection === 'asc' ? 'desc' : 'asc'),
          className: 'px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg'
        }, inventorySortDirection === 'asc' ? '↑ Asc' : '↓ Desc')
      )
    ),

    // Results summary
    React.createElement('div', { 
      className: 'px-4 py-2 text-sm text-gray-600 dark:text-gray-400'
    }, 
      `Showing ${filteredInventory.length} of ${(inventory || []).length} events`
    ),

    // Inventory list
    React.createElement('div', { className: 'mt-2 space-y-3' },
      filteredInventory.length > 0 ?
        filteredInventory.map(item =>
          React.createElement(window.MobileInventoryCard, {
            key: item.id,
            item: item,
            onClick: handleItemClick
          })
        ) :
        React.createElement(window.MobileEmptyState, {
          icon: '📦',
          title: 'No inventory found',
          message: inventorySearchQuery ? 'Try adjusting your search' : 'Start by adding inventory',
          action: window.hasPermission('inventory', 'create') ? {
            label: 'Add Inventory',
            onClick: () => state.setShowInventoryForm(true)
          } : null
        })
    )
  );
};

// Mobile Orders View
window.MobileOrdersView = function() {
  const state = window.appState;
  const { orders, loading, ordersSearchQuery, ordersFilters } = state;
  
  const [showFilters, setShowFilters] = React.useState(false);
  const filters = ordersFilters || {
    searchQuery: '',
    statusFilter: 'all',
    assignedToFilter: 'all',
    eventFilter: 'all',
    paymentStatusFilter: 'all',
    clientFilter: '',
    dateFromFilter: '',
    dateToFilter: '',
    orderNumberFilter: ''
  };

  // Get unique values for filters
  const uniqueStatuses = React.useMemo(() => 
    Array.from(new Set(orders.map(o => o.status).filter(Boolean))).sort(),
    [orders]
  );

  const uniqueAssignees = React.useMemo(() => 
    Array.from(new Set(orders.map(o => o.assigned_to).filter(Boolean))).sort(),
    [orders]
  );

  const uniqueEvents = React.useMemo(() => 
    Array.from(new Set(orders.map(o => o.inventory_name || o.event_name).filter(Boolean))).sort(),
    [orders]
  );

  const uniquePaymentStatuses = React.useMemo(() => 
    Array.from(new Set(orders.map(o => o.payment_status).filter(Boolean))).sort(),
    [orders]
  );

  // Filter orders
  const filteredOrders = React.useMemo(() => {
    return orders.filter(order => {
      // Search query filter
      if (filters.searchQuery) {
        const search = filters.searchQuery.toLowerCase();
        if (!order.client_name?.toLowerCase().includes(search) &&
            !order.inventory_name?.toLowerCase().includes(search) &&
            !order.event_name?.toLowerCase().includes(search) &&
            !order.phone?.includes(search) &&
            !order.id?.toLowerCase().includes(search) &&
            !order.order_number?.toLowerCase().includes(search)) {
          return false;
        }
      }

      // Status filter
      if (filters.statusFilter !== 'all' && order.status !== filters.statusFilter) return false;

      // Assigned to filter
      if (filters.assignedToFilter !== 'all') {
        if (filters.assignedToFilter === 'unassigned' && order.assigned_to) return false;
        if (filters.assignedToFilter !== 'unassigned' && order.assigned_to !== filters.assignedToFilter) return false;
      }

      // Event filter
      if (filters.eventFilter !== 'all') {
        const eventName = order.inventory_name || order.event_name;
        if (eventName !== filters.eventFilter) return false;
      }

      // Payment status filter
      if (filters.paymentStatusFilter !== 'all' && order.payment_status !== filters.paymentStatusFilter) return false;

      // Client filter
      if (filters.clientFilter && !order.client_name?.toLowerCase().includes(filters.clientFilter.toLowerCase())) return false;

      // Order number filter
      if (filters.orderNumberFilter && !order.order_number?.toLowerCase().includes(filters.orderNumberFilter.toLowerCase())) return false;

      // Date range filters
      if (filters.dateFromFilter || filters.dateToFilter) {
        const orderDate = new Date(order.created_at || order.order_date);
        if (filters.dateFromFilter && orderDate < new Date(filters.dateFromFilter)) return false;
        if (filters.dateToFilter && orderDate > new Date(filters.dateToFilter)) return false;
      }

      return true;
    });
  }, [orders, filters]);

  const handleOrderClick = (order) => {
    // Set the current order detail
    if (state.setCurrentOrderDetail) {
      state.setCurrentOrderDetail(order);
    } else if (window.setCurrentOrderDetail) {
      window.setCurrentOrderDetail(order);
    } else if (window.appState) {
      window.appState.currentOrderDetail = order;
    }
    
    // Show the order detail modal
    if (state.setShowOrderDetail) {
      state.setShowOrderDetail(true);
    } else if (window.setShowOrderDetail) {
      window.setShowOrderDetail(true);
    } else if (window.appState) {
      window.appState.showOrderDetail = true;
    }
  };

  const handleFilterChange = (key, value) => {
    if (state.setOrdersFilters) {
      state.setOrdersFilters({ ...filters, [key]: value });
    }
  };

  if (loading) {
    return React.createElement(window.MobileLoadingState);
  }

  return React.createElement('div', { className: 'mobile-content-wrapper' },
    // Quick stats
    React.createElement('div', { 
      className: 'grid grid-cols-2 gap-3 mb-4'
    },
      React.createElement('div', { 
        className: 'mobile-card p-3'
      },
        React.createElement('div', { className: 'text-2xl font-bold text-gray-900 dark:text-white' },
          orders.filter(o => o.status === 'pending').length
        ),
        React.createElement('div', { className: 'text-xs text-gray-500 dark:text-gray-400' },
          'Pending'
        )
      ),
      React.createElement('div', { 
        className: 'mobile-card p-3'
      },
        React.createElement('div', { className: 'text-2xl font-bold text-gray-900 dark:text-white' },
          orders.filter(o => o.payment_status === 'paid').length
        ),
        React.createElement('div', { className: 'text-xs text-gray-500 dark:text-gray-400' },
          'Paid'
        )
      )
    ),

    // Search bar with filter toggle
    React.createElement('div', { className: 'mobile-search-bar' },
      React.createElement('div', { className: 'flex gap-2' },
        React.createElement('input', {
          type: 'text',
          className: 'mobile-search-input flex-1',
          placeholder: 'Search orders...',
          value: filters.searchQuery || '',
          onChange: (e) => handleFilterChange('searchQuery', e.target.value),
          style: {
            paddingLeft: '16px',
            paddingRight: filters.searchQuery ? '40px' : '16px'
          }
        }),
        filters.searchQuery && React.createElement('button', {
          onClick: () => handleFilterChange('searchQuery', ''),
          className: 'absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700',
          style: { right: '60px' }
        }, '✕'),
        React.createElement('button', {
          onClick: () => setShowFilters(!showFilters),
          className: `px-3 py-2 rounded-lg ${showFilters ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600'}`
        }, '⚙️')
      )
    ),

    // Expanded filters section
    showFilters && React.createElement('div', { 
      className: 'bg-gray-50 dark:bg-gray-800 p-4 space-y-3 border-b'
    },
      // Status Filter
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1' }, 'Status'),
        React.createElement('select', {
          value: filters.statusFilter,
          onChange: (e) => handleFilterChange('statusFilter', e.target.value),
          className: 'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg'
        },
          React.createElement('option', { value: 'all' }, 'All Statuses'),
          uniqueStatuses.map(status =>
            React.createElement('option', { key: status, value: status }, status)
          )
        )
      ),

      // Assigned To Filter
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1' }, 'Assigned To'),
        React.createElement('select', {
          value: filters.assignedToFilter,
          onChange: (e) => handleFilterChange('assignedToFilter', e.target.value),
          className: 'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg'
        },
          React.createElement('option', { value: 'all' }, 'All Assignees'),
          React.createElement('option', { value: 'unassigned' }, 'Unassigned'),
          uniqueAssignees.map(assignee =>
            React.createElement('option', { key: assignee, value: assignee }, assignee)
          )
        )
      ),

      // Event Filter
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1' }, 'Event'),
        React.createElement('select', {
          value: filters.eventFilter,
          onChange: (e) => handleFilterChange('eventFilter', e.target.value),
          className: 'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg'
        },
          React.createElement('option', { value: 'all' }, 'All Events'),
          uniqueEvents.map(event =>
            React.createElement('option', { key: event, value: event }, event)
          )
        )
      ),

      // Payment Status Filter
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1' }, 'Payment Status'),
        React.createElement('select', {
          value: filters.paymentStatusFilter,
          onChange: (e) => handleFilterChange('paymentStatusFilter', e.target.value),
          className: 'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg'
        },
          React.createElement('option', { value: 'all' }, 'All Payment Statuses'),
          uniquePaymentStatuses.map(status =>
            React.createElement('option', { key: status, value: status }, status)
          )
        )
      ),

      // Date Range
      React.createElement('div', { className: 'grid grid-cols-2 gap-2' },
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1' }, 'Date From'),
          React.createElement('input', {
            type: 'date',
            value: filters.dateFromFilter,
            onChange: (e) => handleFilterChange('dateFromFilter', e.target.value),
            className: 'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg'
          })
        ),
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1' }, 'Date To'),
          React.createElement('input', {
            type: 'date',
            value: filters.dateToFilter,
            onChange: (e) => handleFilterChange('dateToFilter', e.target.value),
            className: 'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg'
          })
        )
      )
    ),

    // Results summary
    React.createElement('div', { 
      className: 'px-4 py-2 text-sm text-gray-600 dark:text-gray-400'
    }, 
      `Showing ${filteredOrders.length} of ${orders.length} orders`
    ),

    // Orders list
    React.createElement('div', { className: 'mt-2 space-y-3' },
      filteredOrders.length > 0 ?
        filteredOrders.map(order =>
          React.createElement(window.MobileOrderCard, {
            key: order.id,
            order: order,
            onClick: handleOrderClick
          })
        ) :
        React.createElement(window.MobileEmptyState, {
          icon: '🎫',
          title: 'No orders found',
          message: 'Orders will appear here when leads are converted'
        })
    )
  );
};

// Mobile Dashboard View
window.MobileDashboardView = function() {
  const state = window.appState;
  const { leads, orders, deliveries, invoices } = state;
  const [recentLeadsFromAPI, setRecentLeadsFromAPI] = React.useState([]);
  const [dashboardData, setDashboardData] = React.useState({
    summary: {
      totalLeads: 0,
      hotLeads: 0,
      qualifiedLeads: 0,
      totalPipelineValue: 0
    },
    charts: {
      leadSplit: { labels: [], data: [], colors: [] },
      temperatureCount: { labels: [], data: [], colors: [] },
      temperatureValue: { labels: [], data: [], colors: [] }
    }
  });
  const [dashboardFilter, setDashboardFilter] = React.useState('overall');
  const [selectedSalesPerson, setSelectedSalesPerson] = React.useState('');
  const [selectedEvent, setSelectedEvent] = React.useState('');
  
  // Fetch dashboard data from API
  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Build query parameters based on filters
        const params = new URLSearchParams();
        
        if (dashboardFilter === 'salesPerson' && selectedSalesPerson) {
          params.append('filter_type', 'salesPerson');
          params.append('sales_person_id', selectedSalesPerson);
        } else if (dashboardFilter === 'event' && selectedEvent) {
          params.append('filter_type', 'event');
          params.append('event_name', selectedEvent);
        }
        
        const response = await fetch(`${window.API_CONFIG.API_URL}/dashboard/charts?${params}`, {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('crm_auth_token'),
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            console.log('📱 Mobile Dashboard Data:', {
              totalLeads: result.data.summary.totalLeads,
              hotLeads: result.data.summary.hotLeads,
              hotWarmLeads: result.data.summary.hotWarmLeads,
              qualifiedLeads: result.data.summary.qualifiedLeads,
              totalPipelineValue: result.data.summary.totalPipelineValue,
              filters: result.data.filters
            });
            setDashboardData(result.data);
          } else {
            console.error('📱 Mobile Dashboard: Invalid API response:', result);
          }
        } else {
          console.error('📱 Mobile Dashboard: API request failed:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    
    fetchDashboardData();
  }, [dashboardFilter, selectedSalesPerson, selectedEvent]);
  
  // Fetch recent activity from API
  React.useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        const response = await fetch(`${window.API_CONFIG.API_URL}/dashboard/recent-activity?limit=5`, {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('crm_auth_token'),
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setRecentLeadsFromAPI(result.data);
          }
        }
      } catch (error) {
        console.error('Error fetching recent activity:', error);
      }
    };
    
    fetchRecentActivity();
  }, []);

  // Helper functions for lead display
  const getStatusDisplay = (status) => {
    const statusConfig = window.LEAD_STATUSES?.[status] || {
      label: status || 'Unknown',
      color: 'bg-gray-100 text-gray-800',
      icon: '📋'
    };
    return statusConfig;
  };

  const getTemperatureDisplay = (lead) => {
    const temp = lead.temperature?.toLowerCase();
    const tempConfig = {
      hot: { icon: '🔥', color: 'text-red-600 bg-red-50' },
      warm: { icon: '☀️', color: 'text-yellow-600 bg-yellow-50' },
      cold: { icon: '❄️', color: 'text-blue-600 bg-blue-50' }
    };
    return tempConfig[temp] || null;
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return 'Unknown time';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 30) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Create mini pie chart component
  const MiniPieChart = ({ data, labels, colors, title }) => {
    const canvasRef = React.useRef(null);
    const [hoveredSegment, setHoveredSegment] = React.useState(null);
    const [touchPoint, setTouchPoint] = React.useState(null);
    
    // Store segment paths for hit detection
    const segmentPaths = React.useRef([]);
    
    React.useEffect(() => {
      if (!canvasRef.current || !data || data.length === 0) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Calculate total
      const total = data.reduce((sum, value) => sum + value, 0);
      if (total === 0) return;
      
      // Draw pie chart
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 40;
      
      let currentAngle = -Math.PI / 2;
      segmentPaths.current = [];
      
      data.forEach((value, index) => {
        const sliceAngle = (value / total) * 2 * Math.PI;
        
        // Store segment info for hit detection
        segmentPaths.current.push({
          startAngle: currentAngle,
          endAngle: currentAngle + sliceAngle,
          index: index,
          value: value,
          label: labels[index]
        });
        
        // Draw slice
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = colors[index];
        ctx.fill();
        
        // Add border for better visibility
        ctx.strokeStyle = window.matchMedia('(prefers-color-scheme: dark)').matches ? '#374151' : '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        currentAngle += sliceAngle;
      });
      
      // Draw center circle for donut effect
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI);
      ctx.fillStyle = window.matchMedia('(prefers-color-scheme: dark)').matches ? '#1f2937' : '#ffffff';
      ctx.fill();
      
    }, [data, colors, labels]);
    
    // Handle mouse/touch events
    const handleInteraction = (e) => {
      if (!canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      
      let x, y;
      if (e.type.includes('touch')) {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      } else {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      }
      
      // Scale coordinates to canvas size
      x = x * (canvas.width / rect.width);
      y = y * (canvas.height / rect.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 30;
      
      // Calculate distance from center
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Check if within the donut ring
      if (distance < radius && distance > radius * 0.55) {
        // Calculate angle
        let angle = Math.atan2(dy, dx);
        // Normalize to 0-2PI range starting from top
        angle = angle + Math.PI / 2;
        if (angle < 0) angle += 2 * Math.PI;
        
        // Find which segment
        const segment = segmentPaths.current.find(seg => 
          angle >= seg.startAngle && angle < seg.endAngle
        );
        
        if (segment) {
          setHoveredSegment(segment.index);
          if (e.type.includes('touch')) {
            setTouchPoint({ x: e.touches[0].clientX, y: e.touches[0].clientY });
          }
        }
      } else {
        setHoveredSegment(null);
        setTouchPoint(null);
      }
    };
    
    const handleLeave = () => {
      setHoveredSegment(null);
      setTouchPoint(null);
    };
    
    return React.createElement('div', { className: 'relative flex flex-col items-center' },
      React.createElement('h4', { className: 'text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' }, title),
      React.createElement('div', { className: 'relative inline-block' },
        React.createElement('canvas', {
          ref: canvasRef,
          width: 280,
          height: 280,
          className: 'cursor-pointer',
          onMouseMove: handleInteraction,
          onMouseLeave: handleLeave,
          onTouchStart: handleInteraction,
          onTouchMove: handleInteraction,
          onTouchEnd: handleLeave,
          style: { touchAction: 'none' }
        }),
        
        // Tooltip for hover/touch
        hoveredSegment !== null && React.createElement('div', {
          className: 'absolute z-10 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg whitespace-nowrap',
          style: touchPoint ? {
            left: '50%',
            top: '-30px',
            transform: 'translateX(-50%)'
          } : {
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none'
          }
        },
          labels[hoveredSegment],
          ': ',
          data[hoveredSegment]
        )
      ),
      
      // Compact Horizontal Legend
      React.createElement('div', { className: 'mt-2 flex flex-wrap gap-3 justify-center' },
        labels.map((label, index) => 
          data[index] > 0 && React.createElement('div', {
            key: index,
            className: `flex items-center gap-1 text-xs ${
              hoveredSegment === index ? 'font-semibold' : ''
            }`
          },
            React.createElement('span', {
              className: 'inline-block w-3 h-3 rounded-full',
              style: { backgroundColor: colors[index] }
            }),
            React.createElement('span', { className: 'whitespace-nowrap' }, 
              `${label}: ${data[index]}`
            )
          )
        )
      )
    );
  };

  return React.createElement('div', { className: 'mobile-content-wrapper' },
    // Filters section - moved to top
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6' },
      React.createElement('div', { className: 'space-y-3' },
        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300' }, 'View by:'),
        
        // Main Filter
        React.createElement('select', {
          className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
          value: dashboardFilter,
          onChange: (e) => {
            setDashboardFilter(e.target.value);
            setSelectedSalesPerson('');
            setSelectedEvent('');
          }
        },
          React.createElement('option', { value: 'overall' }, 'Overall'),
          React.createElement('option', { value: 'salesPerson' }, 'By Sales Person'),
          React.createElement('option', { value: 'event' }, 'By Event')
        ),

        // Sales Person Filter
        dashboardFilter === 'salesPerson' && React.createElement('select', {
          className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
          value: selectedSalesPerson,
          onChange: (e) => setSelectedSalesPerson(e.target.value)
        },
          React.createElement('option', { value: '' }, 'Select Sales Person'),
          (window.users || []).map(user =>
            React.createElement('option', { key: user.id, value: user.id }, user.name)
          )
        ),

        // Event Filter
        dashboardFilter === 'event' && React.createElement('select', {
          className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
          value: selectedEvent,
          onChange: (e) => setSelectedEvent(e.target.value)
        },
          React.createElement('option', { value: '' }, 'Select Event'),
          (window.appState?.leadsFilterOptions?.events || 
           [...new Set((window.leads || []).map(lead => lead.lead_for_event).filter(Boolean))]
          ).map(event =>
            React.createElement('option', { key: event, value: event }, event)
          )
        )
      )
    ),

    // Pie Charts Section - moved above stats
    React.createElement('div', { className: 'grid grid-cols-1 gap-4 mb-6' },
      // Lead Split Chart
      React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-3 rounded-lg shadow border' },
        React.createElement(MiniPieChart, {
          title: 'Lead Split',
          data: dashboardData.charts.leadSplit.data,
          labels: dashboardData.charts.leadSplit.labels,
          colors: dashboardData.charts.leadSplit.colors
        })
      ),

      // Temperature Count Chart
      React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-3 rounded-lg shadow border' },
        React.createElement(MiniPieChart, {
          title: 'Lead Temperature Count',
          data: dashboardData.charts.temperatureCount.data,
          labels: dashboardData.charts.temperatureCount.labels,
          colors: dashboardData.charts.temperatureCount.colors
        })
      ),

      // Temperature Value Chart
      React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-3 rounded-lg shadow border' },
        React.createElement(MiniPieChart, {
          title: 'Lead Temperature Value',
          data: dashboardData.charts.temperatureValue.data,
          labels: dashboardData.charts.temperatureValue.labels.map((label, i) => 
            `${label} (₹${(dashboardData.charts.temperatureValue.data[i] || 0).toLocaleString('en-IN')})`
          ),
          colors: dashboardData.charts.temperatureValue.colors
        })
      )
    ),
    
    // Dashboard Stats Cards - moved below pie charts
    React.createElement('div', { 
      className: 'grid grid-cols-2 gap-3 mb-6'
    },
      // Total Leads Card
      React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-4 rounded-lg shadow border' },
        React.createElement('div', { className: 'flex items-center' },
          React.createElement('div', { className: 'p-2 bg-blue-100 dark:bg-blue-900 rounded-lg' },
            React.createElement('svg', {
              className: 'w-5 h-5 text-blue-600 dark:text-blue-400',
              fill: 'none',
              stroke: 'currentColor',
              viewBox: '0 0 24 24'
            },
              React.createElement('path', {
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                strokeWidth: 2,
                d: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
              })
            )
          ),
          React.createElement('div', { className: 'ml-3' },
            React.createElement('h3', { 
              className: 'text-lg font-semibold text-gray-900 dark:text-white'
            }, dashboardData.summary.totalLeads),
            React.createElement('p', { className: 'text-xs text-gray-500 dark:text-gray-400' }, 'Total Leads')
          )
        )
      ),

      // Hot Leads Card
      React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-4 rounded-lg shadow border' },
        React.createElement('div', { className: 'flex items-center' },
          React.createElement('div', { className: 'p-2 bg-red-100 dark:bg-red-900 rounded-lg' },
            React.createElement('svg', {
              className: 'w-5 h-5 text-red-600 dark:text-red-400',
              fill: 'none',
              stroke: 'currentColor',
              viewBox: '0 0 24 24'
            },
              React.createElement('path', {
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                strokeWidth: 2,
                d: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z'
              })
            )
          ),
          React.createElement('div', { className: 'ml-3' },
            React.createElement('h3', { 
              className: 'text-lg font-semibold text-gray-900 dark:text-white'
            }, dashboardData.summary.hotWarmLeads || dashboardData.summary.hotLeads),
            React.createElement('p', { className: 'text-xs text-gray-500 dark:text-gray-400' }, 'Hot + Warm Leads')
          )
        )
      ),

      // Qualified Leads Card
      React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-4 rounded-lg shadow border' },
        React.createElement('div', { className: 'flex items-center' },
          React.createElement('div', { className: 'p-2 bg-green-100 dark:bg-green-900 rounded-lg' },
            React.createElement('svg', {
              className: 'w-5 h-5 text-green-600 dark:text-green-400',
              fill: 'none',
              stroke: 'currentColor',
              viewBox: '0 0 24 24'
            },
              React.createElement('path', {
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                strokeWidth: 2,
                d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
              })
            )
          ),
          React.createElement('div', { className: 'ml-3' },
            React.createElement('h3', { 
              className: 'text-lg font-semibold text-gray-900 dark:text-white'
            }, dashboardData.summary.qualifiedLeads),
            React.createElement('p', { className: 'text-xs text-gray-500 dark:text-gray-400' }, 'Qualified Leads')
          )
        )
      ),

      // Pipeline Value Card
      React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-4 rounded-lg shadow border' },
        React.createElement('div', { className: 'flex items-center' },
          React.createElement('div', { className: 'p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg' },
            React.createElement('span', { className: 'text-xl' }, '₹')
          ),
          React.createElement('div', { className: 'ml-3' },
            React.createElement('h3', { 
              className: 'text-lg font-semibold text-gray-900 dark:text-white'
            }, `₹${dashboardData.summary.totalPipelineValue.toLocaleString('en-IN')}`),
            React.createElement('p', { className: 'text-xs text-gray-500 dark:text-gray-400' }, 'Total Pipeline Value')
          )
        )
      )
    ),

    // Recent activity
    React.createElement('div', { className: 'mb-6' },
      React.createElement('div', { 
        className: 'flex items-center justify-between mb-3'
      },
        React.createElement('h2', { 
          className: 'text-lg font-semibold text-gray-900 dark:text-white'
        }, 'Recent Activity'),
        React.createElement('button', {
          onClick: () => state.setActiveTab('leads'),
          className: 'text-xs text-blue-600 dark:text-blue-400'
        }, 'View All →')
      ),
      
      React.createElement('div', { className: 'space-y-3' },
        recentLeadsFromAPI.length > 0 ?
          recentLeadsFromAPI.slice(0, 5).map((lead, index) => {
            const statusDisplay = getStatusDisplay(lead.status);
            const tempDisplay = getTemperatureDisplay(lead);
            const timeAgo = getRelativeTime(lead.updated_date || lead.created_date);
            
            return React.createElement('div', {
              key: lead.id || index,
              className: 'mobile-card p-4 touchable',
              onClick: () => {
                if (window.openLeadDetail) {
                  window.openLeadDetail(lead);
                } else {
                  state.setActiveTab('leads');
                }
              }
            },
              // Lead header
              React.createElement('div', { className: 'flex items-start justify-between mb-2' },
                React.createElement('div', { className: 'flex-1' },
                  // Name and badges
                  React.createElement('div', { className: 'flex items-center gap-2 flex-wrap mb-1' },
                    React.createElement('h4', { 
                      className: 'font-medium text-gray-900 dark:text-white'
                    }, lead.name || 'Unknown Lead'),
                    
                    // Status badge
                    React.createElement('span', {
                      className: `inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusDisplay.color}`
                    },
                      statusDisplay.icon,
                      ' ',
                      statusDisplay.label
                    ),
                    
                    // Temperature
                    tempDisplay && React.createElement('span', {
                      className: `inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${tempDisplay.color}`
                    }, tempDisplay.icon)
                  ),
                  
                  // Lead details
                  React.createElement('div', { className: 'text-xs text-gray-600 dark:text-gray-400 space-y-0.5' },
                    lead.phone && React.createElement('div', null, '📱 ', lead.phone),
                    lead.email && React.createElement('div', { className: 'truncate' }, '📧 ', lead.email),
                    lead.lead_for_event && React.createElement('div', null, '🎫 ', lead.lead_for_event),
                    lead.potential_value > 0 && React.createElement('div', { 
                      className: 'font-medium text-green-600 dark:text-green-400' 
                    }, '₹', parseInt(lead.potential_value).toLocaleString())
                  )
                ),
                
                // Time
                React.createElement('div', { 
                  className: 'text-xs text-gray-500 dark:text-gray-400 text-right'
                }, timeAgo)
              ),
              
              // Quick actions
              React.createElement('div', { 
                className: 'flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700'
              },
                // Assigned to
                React.createElement('div', { 
                  className: 'text-xs text-gray-500 dark:text-gray-400'
                },
                  lead.assigned_to ? `👤 ${window.getUserDisplayName ? 
                    window.getUserDisplayName(lead.assigned_to, window.users) : 
                    lead.assigned_to}` : 'Unassigned'
                ),
                
                // Action buttons
                React.createElement('div', { className: 'flex items-center gap-2' },
                  lead.phone && React.createElement('button', {
                    onClick: (e) => {
                      e.stopPropagation();
                      window.location.href = `tel:${lead.phone}`;
                    },
                    className: 'p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }, '📞'),
                  
                  lead.email && React.createElement('button', {
                    onClick: (e) => {
                      e.stopPropagation();
                      window.location.href = `mailto:${lead.email}`;
                    },
                    className: 'p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }, '✉️')
                )
              )
            );
          }) :
          React.createElement('p', { 
            className: 'text-center text-gray-500 dark:text-gray-400 py-4'
          }, 'No recent activity')
      )
    ),

    // Quick actions
    React.createElement('div', { className: 'grid grid-cols-2 gap-3' },
      window.hasPermission('leads', 'create') &&
        React.createElement('button', {
          className: 'mobile-button mobile-button-primary',
          onClick: () => {
            state.setActiveTab('leads');
            state.setShowAddForm(true);
            state.setCurrentForm('lead');
          }
        }, '+ New Lead'),
      
      window.hasPermission('inventory', 'view') &&
        React.createElement('button', {
          className: 'mobile-button mobile-button-secondary',
          onClick: () => state.setActiveTab('inventory')
        }, 'View Inventory')
    )
  );
};

// Mobile Content Router
window.MobileSweetsContent = function() {
  const state = window.appState;
  const { activeTab } = state;

  // For tabs with mobile views
  const mobileViews = {
    'dashboard': window.MobileDashboardView,
    'leads': window.MobileLeadsView,
    'inventory': window.MobileInventoryView,
    'orders': window.MobileOrdersView,
    'delivery': window.MobileDeliveriesView,
    'financials': window.MobileFinancialsView,
    'sales-performance': window.MobileSalesPerformanceView,
    'marketing-performance': window.MobileMarketingPerformanceView,
    'stadiums': window.MobileStadiumsView,
    'sports-calendar': window.MobileSportsCalendarView
  };
  
  // If mobile view exists, use it
  if (mobileViews[activeTab]) {
    return React.createElement(mobileViews[activeTab]);
  }
  
  // For all other tabs, wrap the desktop content in a mobile container
  return React.createElement('div', { 
    className: 'mobile-content-wrapper',
    style: { 
      paddingTop: '60px', // Space for header
      paddingBottom: '60px', // Space for bottom nav
      minHeight: '100vh',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch'
    }
  }, 
    window.renderContent()
  );
};

// Mobile Deliveries View
window.MobileDeliveriesView = function() {
  const state = window.appState;
  const { deliveries, loading } = state;

  if (loading) {
    return React.createElement('div', { className: 'mobile-loading' },
      React.createElement('div', { className: 'loading-spinner' })
    );
  }

  return React.createElement('div', { className: 'mobile-deliveries-view' },
    React.createElement('div', { className: 'mobile-list-header' },
      React.createElement('h2', { className: 'text-lg font-semibold' }, 'Deliveries'),
      React.createElement('span', { className: 'text-sm text-gray-500' }, 
        `${deliveries?.length || 0} deliveries`
      )
    ),
    
    React.createElement('div', { className: 'mobile-list' },
      !deliveries || deliveries.length === 0 ? 
        React.createElement('div', { className: 'mobile-empty-state' },
          React.createElement('p', null, '📦'),
          React.createElement('p', null, 'No deliveries found'),
          React.createElement('p', { className: 'text-sm text-gray-500' }, 
            'Deliveries will appear here when created'
          )
        ) :
        deliveries.map(delivery => 
          React.createElement(window.MobileDeliveryCard || 'div', { 
            key: delivery.id,
            delivery: delivery,
            onClick: () => {
              state.setCurrentDeliveryDetail(delivery);
              state.setShowDeliveryDetail(true);
            }
          }, `Delivery #${delivery.id}`)
        )
    )
  );
};

// Mobile Financials View
window.MobileFinancialsView = function() {
  const state = window.appState;
  const { financialData, activeFinancialTab, financialsFilters } = state;
  
  const [showFilters, setShowFilters] = React.useState(false);
  
  // Get filter values
  const filters = financialsFilters || {
    dateRange: 'this_month',
    stadium: 'all',
    event: 'all',
    type: 'all'
  };
  
  // Ensure financial data is loaded
  React.useEffect(() => {
    if ((!financialData || !financialData.sales) && window.fetchFinancialData) {
      window.fetchFinancialData();
    }
  }, []);
  
  // Calculate financial metrics
  const calculateMetrics = () => {
    if (!financialData) return {
      totalSales: 0,
      totalReceivables: 0,
      totalPayables: 0,
      totalMargin: 0
    };
    
    return {
      totalSales: financialData.totalSales || 0,
      totalReceivables: financialData.totalReceivables || 0,
      totalPayables: financialData.totalPayables || 0,
      totalMargin: financialData.totalMargin || 0
    };
  };
  
  const metrics = calculateMetrics();
  const tabs = ['overview', 'sales', 'receivables', 'payables'];
  const currentTab = activeFinancialTab || 'overview';
  
  return React.createElement('div', { className: 'mobile-content-wrapper' },
    // Header with filter button
    React.createElement('div', { 
      className: 'sticky top-0 bg-white dark:bg-gray-900 z-10'
    },
      // Filter button row
      React.createElement('div', { 
        className: 'flex justify-end p-2 border-b'
      },
        React.createElement('button', {
          onClick: () => setShowFilters(!showFilters),
          className: `px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${showFilters ? 'text-blue-600' : 'text-gray-600'}`
        }, '⚙️ Filters')
      ),
      
      // Expanded filters section
      showFilters && React.createElement('div', { 
        className: 'bg-gray-50 dark:bg-gray-800 p-4 space-y-3 border-b'
      },
        // Date range filter
        React.createElement('select', {
          value: filters.dateRange,
          onChange: (e) => state.setFinancialsFilters?.({ ...filters, dateRange: e.target.value }),
          className: 'w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700'
        },
          React.createElement('option', { value: 'today' }, 'Today'),
          React.createElement('option', { value: 'this_week' }, 'This Week'),
          React.createElement('option', { value: 'this_month' }, 'This Month'),
          React.createElement('option', { value: 'last_month' }, 'Last Month'),
          React.createElement('option', { value: 'this_year' }, 'This Year')
        )
      ),
      
      // Tabs
      React.createElement('div', { className: 'flex overflow-x-auto no-scrollbar border-b' },
        tabs.map(tab => 
          React.createElement('button', {
            key: tab,
            onClick: () => state.setActiveFinancialTab(tab),
            className: `px-4 py-3 text-sm font-medium whitespace-nowrap ${
              currentTab === tab 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500'
            }`
          }, tab.charAt(0).toUpperCase() + tab.slice(1))
        )
      )
    ),
    
    // Content based on tab
    currentTab === 'overview' && React.createElement('div', { className: 'space-y-4' },
      // Metrics cards
      React.createElement('div', { className: 'grid grid-cols-2 gap-3' },
        [
          { label: 'Total Sales', value: metrics.totalSales, color: 'bg-green-500' },
          { label: 'Receivables', value: metrics.totalReceivables, color: 'bg-yellow-500' },
          { label: 'Payables', value: metrics.totalPayables, color: 'bg-red-500' },
          { label: 'Margin', value: metrics.totalMargin, color: 'bg-blue-500' }
        ].map((metric, index) => 
          React.createElement('div', {
            key: index,
            className: 'mobile-card p-4'
          },
            React.createElement('div', { 
              className: `text-xs text-gray-600 dark:text-gray-400 mb-2`
            }, metric.label),
            React.createElement('div', { 
              className: 'text-lg font-bold text-gray-900 dark:text-white'
            }, window.formatCurrency(metric.value))
          )
        )
      )
    ),
    
    currentTab === 'sales' && React.createElement('div', { className: 'space-y-3' },
      React.createElement('h3', { className: 'font-semibold mb-3' }, 'Sales'),
      financialData?.sales && financialData.sales.length > 0 ?
        financialData.sales.slice(0, 10).map((sale, index) => 
          React.createElement('div', {
            key: sale.id || index,
            className: 'mobile-card p-3'
          },
            React.createElement('div', { className: 'flex justify-between items-start' },
              React.createElement('div', { className: 'flex-1' },
                React.createElement('div', { className: 'font-medium' }, 
                  sale.client_name || 'Unknown Client'
                ),
                React.createElement('div', { className: 'text-xs text-gray-500' }, 
                  `Order #${sale.order_id || sale.id}`
                ),
                sale.event_name && React.createElement('div', { className: 'text-xs text-gray-500' }, 
                  sale.event_name
                ),
                React.createElement('div', { className: 'text-xs text-gray-500' }, 
                  new Date(sale.created_at || sale.order_date).toLocaleDateString()
                )
              ),
              React.createElement('div', { className: 'text-right' },
                React.createElement('div', { 
                  className: 'text-sm font-medium text-green-600'
                }, window.formatCurrency(sale.total_amount || sale.amount)),
                sale.status && React.createElement('div', { 
                  className: `text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${
                    sale.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`
                }, sale.status)
              )
            )
          )
        ) :
        React.createElement('p', { className: 'text-center text-gray-500 py-8' }, 'No sales data')
    ),
    
    currentTab === 'receivables' && React.createElement('div', { className: 'space-y-3' },
      React.createElement('h3', { className: 'font-semibold mb-3' }, 'Receivables'),
      financialData?.receivables && financialData.receivables.length > 0 ?
        financialData.receivables.slice(0, 10).map((receivable, index) => 
          React.createElement('div', {
            key: receivable.id || index,
            className: 'mobile-card p-3'
          },
            React.createElement('div', { className: 'flex justify-between items-start' },
              React.createElement('div', { className: 'flex-1' },
                React.createElement('div', { className: 'font-medium' }, 
                  receivable.client_name || 'Unknown Client'
                ),
                React.createElement('div', { className: 'text-xs text-gray-500' }, 
                  `Invoice #${receivable.invoice_number || receivable.id}`
                ),
                React.createElement('div', { className: 'text-xs text-gray-500' }, 
                  `Due: ${new Date(receivable.due_date).toLocaleDateString()}`
                )
              ),
              React.createElement('div', { className: 'text-right' },
                React.createElement('div', { 
                  className: 'text-sm font-medium text-yellow-600'
                }, window.formatCurrency(receivable.amount || receivable.total_amount)),
                React.createElement('div', { 
                  className: `text-xs ${
                    new Date(receivable.due_date) < new Date() ? 'text-red-600' : 'text-gray-500'
                  }`
                }, new Date(receivable.due_date) < new Date() ? 'Overdue' : 'Pending')
              )
            )
          )
        ) :
        React.createElement('p', { className: 'text-center text-gray-500 py-8' }, 'No receivables')
    ),
    
    currentTab === 'payables' && React.createElement('div', { className: 'space-y-3' },
      React.createElement('h3', { className: 'font-semibold mb-3' }, 'Payables'),
      financialData?.payables && financialData.payables.length > 0 ?
        financialData.payables.slice(0, 10).map((payable, index) => 
          React.createElement('div', {
            key: payable.id || index,
            className: 'mobile-card p-3'
          },
            React.createElement('div', { className: 'flex justify-between items-start' },
              React.createElement('div', { className: 'flex-1' },
                React.createElement('div', { className: 'font-medium' }, 
                  payable.inventory_item || 'Unknown Item'
                ),
                React.createElement('div', { className: 'text-xs text-gray-500' }, 
                  `Supplier: ${payable.supplier || 'Unknown'}`
                ),
                React.createElement('div', { className: 'text-xs text-gray-500' }, 
                  `Due: ${new Date(payable.due_date).toLocaleDateString()}`
                )
              ),
              React.createElement('div', { className: 'text-right' },
                React.createElement('div', { 
                  className: 'text-sm font-medium text-red-600'
                }, window.formatCurrency(payable.amount || payable.total_amount)),
                React.createElement('button', {
                  onClick: () => window.handleMarkAsPaid && window.handleMarkAsPaid(payable),
                  className: 'text-xs text-blue-600 mt-1'
                }, 'Mark as Paid')
              )
            )
          )
        ) :
        React.createElement('p', { className: 'text-center text-gray-500 py-8' }, 'No payables')
    )
  );
};

// Mobile Sales Performance View
window.MobileSalesPerformanceView = function() {
  const state = window.appState;
  const { orders, users } = state;
  
  // Calculate sales by user
  const salesByUser = {};
  if (orders && users) {
    orders.forEach(order => {
      if (order.assigned_to && (order.status === 'completed' || order.status === 'delivered')) {
        if (!salesByUser[order.assigned_to]) {
          salesByUser[order.assigned_to] = {
            count: 0,
            total: 0,
            name: window.getUserDisplayName ? 
              window.getUserDisplayName(order.assigned_to, users) : 
              order.assigned_to
          };
        }
        salesByUser[order.assigned_to].count++;
        salesByUser[order.assigned_to].total += parseFloat(order.total_amount) || 0;
      }
    });
  }
  
  const topPerformers = Object.values(salesByUser)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
  
  return React.createElement('div', { className: 'mobile-content-wrapper' },
    React.createElement('h2', { 
      className: 'text-lg font-semibold mb-4'
    }, 'Sales Performance'),
    
    React.createElement('div', { className: 'space-y-3' },
      topPerformers.length > 0 ?
        topPerformers.map((performer, index) => 
          React.createElement('div', {
            key: index,
            className: 'mobile-card p-4'
          },
            React.createElement('div', { className: 'flex items-center justify-between' },
              React.createElement('div', null,
                React.createElement('div', { className: 'font-medium' }, performer.name),
                React.createElement('div', { className: 'text-sm text-gray-500' }, 
                  `${performer.count} sales`
                )
              ),
              React.createElement('div', { 
                className: 'text-lg font-bold text-green-600'
              }, window.formatCurrency(performer.total))
            ),
            // Progress bar
            React.createElement('div', { 
              className: 'mt-2 bg-gray-200 rounded-full h-2'
            },
              React.createElement('div', {
                className: 'bg-blue-500 h-2 rounded-full',
                style: { 
                  width: `${(performer.total / topPerformers[0].total) * 100}%` 
                }
              })
            )
          )
        ) :
        React.createElement('p', { 
          className: 'text-center text-gray-500 py-8'
        }, 'No sales data available')
    )
  );
};

// Mobile Marketing Performance View
window.MobileMarketingPerformanceView = function() {
  const state = window.appState;
  const { leads } = state;
  const [performanceData, setPerformanceData] = React.useState({
    overview: {
      totalLeads: 0,
      facebookLeads: 0,
      instagramLeads: 0,
      otherSourceLeads: 0,
      conversionRate: 0,
      avgCostPerLead: 0
    },
    sourceBreakdown: []
  });
  
  // Calculate marketing performance metrics
  React.useEffect(() => {
    if (!leads || leads.length === 0) return;
    
    const sourceStats = {};
    let totalLeads = leads.length;
    let convertedLeads = 0;
    
    leads.forEach(lead => {
      const source = lead.source || lead.lead_source || 'Unknown';
      
      if (!sourceStats[source]) {
        sourceStats[source] = {
          name: source,
          count: 0,
          converted: 0,
          potential_value: 0
        };
      }
      
      sourceStats[source].count++;
      sourceStats[source].potential_value += parseFloat(lead.potential_value) || 0;
      
      if (lead.status === 'converted' || lead.status === 'qualified') {
        sourceStats[source].converted++;
        convertedLeads++;
      }
    });
    
    const sourceBreakdown = Object.values(sourceStats)
      .sort((a, b) => b.count - a.count)
      .map(source => ({
        ...source,
        conversionRate: source.count > 0 ? ((source.converted / source.count) * 100).toFixed(1) : '0.0',
        percentage: ((source.count / totalLeads) * 100).toFixed(1)
      }));
    
    setPerformanceData({
      overview: {
        totalLeads,
        facebookLeads: sourceStats['Facebook']?.count || 0,
        instagramLeads: sourceStats['Instagram']?.count || 0,
        otherSourceLeads: totalLeads - (sourceStats['Facebook']?.count || 0) - (sourceStats['Instagram']?.count || 0),
        conversionRate: totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0.0',
        avgCostPerLead: 0 // This would need to be calculated from actual ad spend data
      },
      sourceBreakdown
    });
  }, [leads]);
  
  return React.createElement('div', { className: 'mobile-content-wrapper' },
    // Performance Overview Cards
    React.createElement('div', { 
      className: 'grid grid-cols-2 gap-3 mb-6'
    },
      // Total Leads
      React.createElement('div', { className: 'mobile-card p-3' },
        React.createElement('div', { className: 'text-2xl font-bold text-blue-600' },
          performanceData.overview.totalLeads
        ),
        React.createElement('div', { className: 'text-xs text-gray-500' },
          'Total Leads'
        )
      ),
      
      // Conversion Rate
      React.createElement('div', { className: 'mobile-card p-3' },
        React.createElement('div', { className: 'text-2xl font-bold text-green-600' },
          performanceData.overview.conversionRate + '%'
        ),
        React.createElement('div', { className: 'text-xs text-gray-500' },
          'Conversion Rate'
        )
      ),
      
      // Facebook Leads
      React.createElement('div', { className: 'mobile-card p-3' },
        React.createElement('div', { className: 'text-2xl font-bold text-blue-500' },
          performanceData.overview.facebookLeads
        ),
        React.createElement('div', { className: 'text-xs text-gray-500' },
          'Facebook Leads'
        )
      ),
      
      // Instagram Leads
      React.createElement('div', { className: 'mobile-card p-3' },
        React.createElement('div', { className: 'text-2xl font-bold text-purple-500' },
          performanceData.overview.instagramLeads
        ),
        React.createElement('div', { className: 'text-xs text-gray-500' },
          'Instagram Leads'
        )
      )
    ),
    
    // Source Breakdown
    React.createElement('div', { className: 'mb-6' },
      React.createElement('h3', { 
        className: 'text-lg font-semibold mb-3 text-gray-900 dark:text-white'
      }, 'Lead Sources'),
      
      React.createElement('div', { className: 'space-y-3' },
        performanceData.sourceBreakdown.length > 0 ?
          performanceData.sourceBreakdown.map((source, index) => 
            React.createElement('div', {
              key: source.name,
              className: 'mobile-card p-4'
            },
              React.createElement('div', { className: 'flex items-start justify-between mb-2' },
                React.createElement('div', { className: 'flex-1' },
                  React.createElement('h4', { 
                    className: 'font-medium text-gray-900 dark:text-white'
                  }, source.name),
                  React.createElement('div', { className: 'text-sm text-gray-500 dark:text-gray-400' },
                    `${source.count} leads (${source.percentage}%)`
                  )
                ),
                React.createElement('div', { className: 'text-right' },
                  React.createElement('div', { 
                    className: 'text-sm font-medium text-green-600'
                  }, `${source.conversionRate}%`),
                  React.createElement('div', { className: 'text-xs text-gray-500' },
                    'conversion'
                  )
                )
              ),
              
              // Progress bar for lead count
              React.createElement('div', { 
                className: 'mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2'
              },
                React.createElement('div', {
                  className: `bg-gradient-to-r ${
                    source.name.toLowerCase().includes('facebook') ? 'from-blue-400 to-blue-600' :
                    source.name.toLowerCase().includes('instagram') ? 'from-purple-400 to-purple-600' :
                    'from-gray-400 to-gray-600'
                  } h-2 rounded-full transition-all duration-300`,
                  style: { 
                    width: `${Math.max(5, parseFloat(source.percentage))}%`
                  }
                })
              ),
              
              // Potential value
              source.potential_value > 0 && React.createElement('div', { 
                className: 'mt-2 text-xs text-gray-600 dark:text-gray-400'
              },
                `Potential Value: ₹${source.potential_value.toLocaleString('en-IN')}`
              )
            )
          ) :
          React.createElement('div', { 
            className: 'text-center py-8 text-gray-500'
          }, 
            React.createElement('div', { className: 'text-4xl mb-2' }, '📊'),
            React.createElement('p', null, 'No marketing data available'),
            React.createElement('p', { className: 'text-sm' }, 'Lead sources will appear here when data is available')
          )
      )
    ),
    
    // Quick Actions
    React.createElement('div', { className: 'grid grid-cols-1 gap-3' },
      React.createElement('button', {
        className: 'mobile-button mobile-button-primary',
        onClick: () => {
          if (window.refreshMarketingData) {
            window.refreshMarketingData();
          }
        }
      }, '🔄 Refresh Data'),
      
      React.createElement('button', {
        className: 'mobile-button mobile-button-secondary', 
        onClick: () => state.setActiveTab('leads')
      }, '📋 View All Leads')
    )
  );
};

// Mobile Stadiums View
window.MobileStadiumsView = function() {
  const state = window.appState;
  const { stadiums, stadiumsSearchQuery } = state;
  
  const [showFilters, setShowFilters] = React.useState(false);
  
  // Apply search filter
  const filteredStadiums = React.useMemo(() => {
    if (!stadiums) return [];
    
    let filtered = [...stadiums];
    
    // Search filter
    if (stadiumsSearchQuery) {
      const query = stadiumsSearchQuery.toLowerCase();
      filtered = filtered.filter(stadium => 
        stadium.name?.toLowerCase().includes(query) ||
        stadium.location?.toLowerCase().includes(query) ||
        stadium.city?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [stadiums, stadiumsSearchQuery]);
  
  return React.createElement('div', { className: 'mobile-content-wrapper' },
    // Search and filter bar
    React.createElement('div', { 
      className: 'sticky top-0 bg-white dark:bg-gray-900 border-b pb-3 mb-4 -mx-4 px-4 pt-3'
    },
      React.createElement('div', { className: 'flex gap-2' },
        React.createElement('input', {
          type: 'text',
          placeholder: 'Search stadiums...',
          value: stadiumsSearchQuery || '',
          onChange: (e) => state.setStadiumsSearchQuery?.(e.target.value),
          className: 'flex-1 px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 text-sm'
        }),
        React.createElement('button', {
          onClick: () => setShowFilters(!showFilters),
          className: `px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${showFilters ? 'text-blue-600' : 'text-gray-600'}`
        }, '⚙️')
      )
    ),

    // Header
    React.createElement('div', { 
      className: 'mb-4'
    },
      React.createElement('h2', { 
        className: 'text-lg font-semibold'
      }, 'Stadiums')
    ),
    
    React.createElement('div', { className: 'space-y-3' },
      filteredStadiums && filteredStadiums.length > 0 ?
        filteredStadiums.map(stadium => 
          React.createElement('div', {
            key: stadium.id,
            className: 'mobile-card'
          },
            // Clickable upper section
            React.createElement('div', {
              className: 'cursor-pointer',
              onClick: () => {
                if (state.setSelectedStadium && state.setShowStadiumDetail) {
                  state.setSelectedStadium(stadium);
                  state.setShowStadiumDetail(true);
                } else if (window.openStadiumDetail) {
                  window.openStadiumDetail(stadium);
                } else {
                  console.log('Stadium detail view:', stadium);
                  // Fallback - could show an alert or basic info
                  alert(`Stadium: ${stadium.name}\nCity: ${stadium.city || 'N/A'}\nCapacity: ${stadium.capacity || 'N/A'}`);
                }
              }
            },
              React.createElement('div', { className: 'flex items-start justify-between mb-3' },
                React.createElement('div', { className: 'flex-1' },
                  React.createElement('h3', { 
                    className: 'font-semibold text-base text-gray-900 dark:text-white mb-1'
                  }, stadium.name),
                  React.createElement('div', { 
                    className: 'text-sm text-gray-600 dark:text-gray-400 space-y-1'
                  },
                    stadium.city && React.createElement('div', null, '📍 ', stadium.city),
                    stadium.sport_type && React.createElement('div', null, '🏃 ', stadium.sport_type),
                    stadium.capacity && React.createElement('div', null, 
                      '💺 ', parseInt(stadium.capacity).toLocaleString(), ' seats'
                    )
                  )
                )
              )
            ),
            
            // Quick action buttons
            React.createElement('div', {
              className: 'flex items-center gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700'
            },
              // Notes button
              React.createElement('button', {
                className: 'action-button px-2 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors',
                onClick: () => {
                  if (window.openStadiumNotesModal) {
                    window.openStadiumNotesModal(stadium);
                  } else {
                    console.log('Stadium notes view:', stadium);
                    alert(`Stadium: ${stadium.name}\nNotes functionality not available`);
                  }
                },
                title: 'Stadium Notes'
              }, '📝'),
              
              // Edit button
              window.hasPermission('stadiums', 'write') && React.createElement('button', {
                className: 'action-button px-2 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded transition-colors',
                onClick: () => {
                  if (window.openEditStadiumForm) {
                    window.openEditStadiumForm(stadium);
                  } else if (window.setEditingStadium && window.setShowStadiumForm) {
                    window.setEditingStadium(stadium);
                    window.setShowStadiumForm(true);
                  } else if (state.setShowStadiumForm) {
                    state.setShowStadiumForm(true);
                  } else {
                    console.log('Edit stadium:', stadium);
                    alert('Edit functionality not available');
                  }
                },
                title: 'Edit Stadium'
              }, '✏️'),
              
              // Delete button
              window.hasPermission('stadiums', 'delete') && React.createElement('button', {
                className: 'action-button px-2 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors',
                onClick: () => {
                  if (window.handleDeleteStadium) {
                    window.handleDeleteStadium(stadium.id);
                  } else if (window.handleDelete) {
                    window.handleDelete('stadiums', stadium.id, stadium.name);
                  } else {
                    if (confirm(`Are you sure you want to delete ${stadium.name}?`)) {
                      // Handle deletion
                      console.log('Delete stadium:', stadium.id);
                    }
                  }
                },
                title: 'Delete Stadium'
              }, '🗑️')
            )
          )
        ) :
        React.createElement('div', { 
          className: 'text-center py-8 text-gray-500'
        }, 'No stadiums found')
    )
  );
};

// Mobile Sports Calendar View
window.MobileSportsCalendarView = function() {
  const state = window.appState;
  const { sportsCalendar, sportsCalendarFilters } = state;
  
  const [showFilters, setShowFilters] = React.useState(false);
  
  // Get filter values
  const filters = sportsCalendarFilters || {
    sport: 'all',
    stadium: 'all',
    dateRange: 'upcoming'
  };
  
  // Apply filters
  const filteredEvents = React.useMemo(() => {
    if (!sportsCalendar) return [];
    
    let filtered = [...sportsCalendar];
    
    // Sport filter
    if (filters.sport && filters.sport !== 'all') {
      filtered = filtered.filter(event => event.sport_type === filters.sport);
    }
    
    // Stadium filter
    if (filters.stadium && filters.stadium !== 'all') {
      filtered = filtered.filter(event => event.stadium_id === filters.stadium);
    }
    
    // Date range filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (filters.dateRange === 'today') {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === today.toDateString();
      });
    } else if (filters.dateRange === 'upcoming') {
      filtered = filtered.filter(event => new Date(event.date) >= today);
    } else if (filters.dateRange === 'past') {
      filtered = filtered.filter(event => new Date(event.date) < today);
    }
    
    // Sort by date
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return filtered;
  }, [sportsCalendar, filters]);
  
  return React.createElement('div', { className: 'mobile-content-wrapper' },
    // Search and filter bar
    React.createElement('div', { 
      className: 'sticky top-0 bg-white dark:bg-gray-900 border-b pb-3 mb-4 -mx-4 px-4 pt-3'
    },
      React.createElement('div', { className: 'flex justify-between items-center' },
        React.createElement('h2', { 
          className: 'text-lg font-semibold'
        }, 'Sports Calendar'),
        React.createElement('button', {
          onClick: () => setShowFilters(!showFilters),
          className: `px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${showFilters ? 'text-blue-600' : 'text-gray-600'}`
        }, '⚙️')
      )
    ),

    // Expanded filters section
    showFilters && React.createElement('div', { 
      className: 'bg-gray-50 dark:bg-gray-800 p-4 space-y-3 border-b -mx-4 mb-4'
    },
      // Date range filter
      React.createElement('select', {
        value: filters.dateRange,
        onChange: (e) => state.setSportsCalendarFilters?.({ ...filters, dateRange: e.target.value }),
        className: 'w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700'
      },
        React.createElement('option', { value: 'today' }, 'Today'),
        React.createElement('option', { value: 'upcoming' }, 'Upcoming'),
        React.createElement('option', { value: 'past' }, 'Past'),
        React.createElement('option', { value: 'all' }, 'All Events')
      ),
      
      // Sport type filter
      React.createElement('select', {
        value: filters.sport,
        onChange: (e) => state.setSportsCalendarFilters?.({ ...filters, sport: e.target.value }),
        className: 'w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700'
      },
        React.createElement('option', { value: 'all' }, 'All Sports'),
        React.createElement('option', { value: 'cricket' }, 'Cricket'),
        React.createElement('option', { value: 'football' }, 'Football'),
        React.createElement('option', { value: 'basketball' }, 'Basketball'),
        React.createElement('option', { value: 'tennis' }, 'Tennis'),
        React.createElement('option', { value: 'other' }, 'Other')
      )
    ),
    
    React.createElement('div', { className: 'space-y-3' },
      filteredEvents && filteredEvents.length > 0 ?
        filteredEvents.map(event => 
          React.createElement('div', {
            key: event.id,
            className: 'mobile-card p-4 touchable',
            onClick: () => {
              state.setSelectedEvent?.(event);
              state.setShowEventDetail?.(true);
            }
          },
            React.createElement('div', { className: 'flex items-start justify-between' },
              React.createElement('div', { className: 'flex-1' },
                React.createElement('h3', { 
                  className: 'font-medium text-gray-900 dark:text-white'
                }, event.name || event.event_name),
                React.createElement('div', { 
                  className: 'text-sm text-gray-600 dark:text-gray-400 mt-1 space-y-1'
                },
                  event.sport_type && React.createElement('div', null, '🏃 ', event.sport_type),
                  event.stadium_name && React.createElement('div', null, '🏟️ ', event.stadium_name),
                  event.date && React.createElement('div', null, 
                    '📅 ', new Date(event.date).toLocaleDateString()
                  ),
                  event.time && React.createElement('div', null, '⏰ ', event.time)
                )
              ),
              React.createElement('span', { 
                className: 'text-gray-400'
              }, '>')
            )
          )
        ) :
        React.createElement('div', { 
          className: 'text-center py-8 text-gray-500'
        }, 'No events found')
    )
  );
};

console.log('✅ Mobile Views components loaded');