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
        React.createElement('div', { className: 'relative flex-1' },
          React.createElement('input', {
            type: 'text',
            className: 'mobile-search-input w-full',
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
            className: 'absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700'
          }, '✕')
        ),
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
    'sports-calendar': window.MobileSportsCalendarView,
    'myactions': window.MobileMyActionsView
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

// Mobile Deliveries View with Card Design
window.MobileDeliveriesView = function() {
  const state = window.appState;
  const { deliveries = [], loading } = state;
  
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  
  // Delivery status definitions
  const DELIVERY_STATUSES = {
    'pending': { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
    'scheduled': { label: 'Scheduled', color: 'bg-blue-100 text-blue-800', icon: '📅' },
    'in_transit': { label: 'In Transit', color: 'bg-purple-100 text-purple-800', icon: '🚚' },
    'delivered': { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: '✅' },
    'failed': { label: 'Failed', color: 'bg-red-100 text-red-800', icon: '❌' }
  };
  
  // Filter deliveries
  const filteredDeliveries = React.useMemo(() => {
    let filtered = [...deliveries];
    
    // Search filter
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      filtered = filtered.filter(delivery =>
        delivery.delivery_number?.toLowerCase().includes(search) ||
        delivery.order_number?.toLowerCase().includes(search) ||
        delivery.client_name?.toLowerCase().includes(search) ||
        delivery.event_name?.toLowerCase().includes(search)
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(delivery => delivery.status === statusFilter);
    }
    
    return filtered;
  }, [deliveries, searchQuery, statusFilter]);
  
  // Pagination
  const totalPages = Math.ceil(filteredDeliveries.length / itemsPerPage);
  const paginatedDeliveries = filteredDeliveries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Handle status update
  const updateDeliveryStatus = async (deliveryId, newStatus) => {
    if (window.updateDeliveryStatus) {
      await window.updateDeliveryStatus(deliveryId, newStatus);
    } else {
      // Fallback - update locally
      state.setDeliveries(prev => 
        prev.map(d => d.id === deliveryId ? { ...d, status: newStatus } : d)
      );
    }
  };
  
  if (loading) {
    return React.createElement(window.MobileLoadingState || 'div', null, 'Loading deliveries...');
  }
  
  return React.createElement('div', { className: 'mobile-content-wrapper' },
    // Header with search
    React.createElement('div', { 
      className: 'sticky top-0 bg-white dark:bg-gray-900 z-10 pb-3 border-b'
    },
      React.createElement('h2', { 
        className: 'text-lg font-semibold mb-3'
      }, 'Deliveries'),
      
      // Search bar
      React.createElement('div', { className: 'px-4 mb-3' },
        React.createElement('div', { className: 'relative' },
          React.createElement('input', {
            type: 'text',
            placeholder: 'Search deliveries...',
            value: searchQuery,
            onChange: (e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            },
            className: 'w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm'
          }),
          React.createElement('span', { 
            className: 'absolute left-3 top-2.5 text-gray-400'
          }, '🔍')
        )
      ),
      
      // Status filter tabs
      React.createElement('div', { className: 'flex overflow-x-auto no-scrollbar px-4 gap-2' },
        React.createElement('button', {
          onClick: () => {
            setStatusFilter('all');
            setCurrentPage(1);
          },
          className: `px-3 py-1 text-xs rounded-full whitespace-nowrap ${
            statusFilter === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700'
          }`
        }, 'All'),
        Object.entries(DELIVERY_STATUSES).map(([status, config]) =>
          React.createElement('button', {
            key: status,
            onClick: () => {
              setStatusFilter(status);
              setCurrentPage(1);
            },
            className: `px-3 py-1 text-xs rounded-full whitespace-nowrap flex items-center gap-1 ${
              statusFilter === status 
                ? config.color 
                : 'bg-gray-100 text-gray-700'
            }`
          }, 
            React.createElement('span', null, config.icon),
            config.label
          )
        )
      )
    ),
    
    // Deliveries list
    React.createElement('div', { className: 'p-4' },
      paginatedDeliveries.length > 0 ?
        React.createElement('div', { className: 'space-y-4' },
          paginatedDeliveries.map(delivery => {
            const status = DELIVERY_STATUSES[delivery.status] || DELIVERY_STATUSES.pending;
            
            return React.createElement('div', {
              key: delivery.id,
              className: 'bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 transform transition-all duration-200 hover:scale-[1.02] hover:shadow-xl border border-gray-100 dark:border-gray-700',
              style: {
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              },
              onClick: () => {
                if (window.openDeliveryDetail) {
                  window.openDeliveryDetail(delivery);
                }
              }
            },
              // Header with delivery number and status
              React.createElement('div', { className: 'flex justify-between items-start mb-3' },
                React.createElement('div', null,
                  React.createElement('div', { className: 'font-bold text-gray-900 dark:text-white' },
                    delivery.delivery_number || `Delivery #${delivery.id}`
                  ),
                  React.createElement('div', { className: 'text-xs text-gray-500 mt-1' },
                    new Date(delivery.created_date || delivery.created_at).toLocaleDateString()
                  )
                ),
                React.createElement('div', { 
                  className: `px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`
                },
                  React.createElement('span', null, status.icon),
                  status.label
                )
              ),
              
              // Order and client info
              React.createElement('div', { className: 'space-y-2 mb-3' },
                React.createElement('div', { className: 'flex items-center gap-2 text-sm' },
                  React.createElement('span', { className: 'text-gray-500' }, '📋'),
                  React.createElement('span', { className: 'font-medium' }, 
                    delivery.order_number || 'No order number'
                  )
                ),
                React.createElement('div', { className: 'flex items-center gap-2 text-sm' },
                  React.createElement('span', { className: 'text-gray-500' }, '🎪'),
                  React.createElement('span', null, delivery.event_name || 'Unknown event')
                ),
                React.createElement('div', { className: 'flex items-center gap-2 text-sm' },
                  React.createElement('span', { className: 'text-gray-500' }, '👤'),
                  React.createElement('span', null, delivery.client_name || 'Unknown client')
                ),
                delivery.client_phone && React.createElement('div', { 
                  className: 'flex items-center gap-2 text-sm' 
                },
                  React.createElement('span', { className: 'text-gray-500' }, '📞'),
                  React.createElement('span', null, delivery.client_phone)
                )
              ),
              
              // Delivery details
              React.createElement('div', { className: 'grid grid-cols-2 gap-3 mb-3' },
                React.createElement('div', { 
                  className: 'bg-gray-50 dark:bg-gray-900 rounded-lg p-2 text-center'
                },
                  React.createElement('div', { className: 'text-xs text-gray-500' }, 'Type'),
                  React.createElement('div', { className: 'text-sm font-medium' },
                    delivery.delivery_type ? 
                      (delivery.delivery_type === 'online' ? '💻 Online' : '📍 Offline') : 
                      '- Not set'
                  )
                ),
                React.createElement('div', { 
                  className: 'bg-gray-50 dark:bg-gray-900 rounded-lg p-2 text-center'
                },
                  React.createElement('div', { className: 'text-xs text-gray-500' }, 'Tickets'),
                  React.createElement('div', { className: 'text-sm font-medium' },
                    delivery.tickets_count || '0'
                  )
                )
              ),
              
              // Assigned to
              delivery.assigned_to && React.createElement('div', { 
                className: 'text-xs text-gray-500 mb-3' 
              },
                'Assigned to: ',
                React.createElement('span', { className: 'font-medium text-gray-700' },
                  delivery.assigned_to
                )
              ),
              
              // Action buttons
              React.createElement('div', { className: 'flex gap-2 flex-wrap' },
                window.hasPermission('delivery', 'write') && delivery.status === 'pending' &&
                React.createElement('button', {
                  className: 'flex-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors',
                  onClick: (e) => {
                    e.stopPropagation();
                    if (window.openDeliveryForm) {
                      window.openDeliveryForm(delivery);
                    }
                  }
                }, '📅 Schedule'),
                
                window.hasPermission('delivery', 'write') && delivery.status === 'scheduled' &&
                React.createElement('button', {
                  className: 'flex-1 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors',
                  onClick: (e) => {
                    e.stopPropagation();
                    updateDeliveryStatus(delivery.id, 'in_transit');
                  }
                }, '🚚 '),
                
                window.hasPermission('delivery', 'write') && delivery.status === 'in_transit' &&
                React.createElement('button', {
                  className: 'flex-1 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors',
                  onClick: (e) => {
                    e.stopPropagation();
                    updateDeliveryStatus(delivery.id, 'delivered');
                  }
                }, '✅ Mark '),
                
                React.createElement('button', {
                  className: 'px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors',
                  onClick: (e) => {
                    e.stopPropagation();
                    if (window.openDeliveryDetail) {
                      window.openDeliveryDetail(delivery);
                    }
                  }
                }, '👁️ View Details')
              )
            );
          })
        ) :
        React.createElement(window.MobileEmptyState || 'div', {
          icon: '📦',
          title: 'No deliveries found',
          message: searchQuery ? 'Try adjusting your search' : 'Deliveries will appear here when created'
        })
    ),
    
    // Pagination
    totalPages > 1 && React.createElement('div', { 
      className: 'flex items-center justify-between px-4 pb-4'
    },
      React.createElement('button', {
        onClick: () => setCurrentPage(Math.max(1, currentPage - 1)),
        disabled: currentPage === 1,
        className: `px-3 py-1 text-sm rounded-lg ${
          currentPage === 1 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`
      }, 'Previous'),
      
      React.createElement('span', { className: 'text-sm text-gray-600' },
        `Page ${currentPage} of ${totalPages}`
      ),
      
      React.createElement('button', {
        onClick: () => setCurrentPage(Math.min(totalPages, currentPage + 1)),
        disabled: currentPage === totalPages,
        className: `px-3 py-1 text-sm rounded-lg ${
          currentPage === totalPages 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`
      }, 'Next')
    )
  );
};

// Mobile Financials View
window.MobileFinancialsView = function() {
  const state = window.appState;
  const { 
    financialData = {
      activeSales: [],
      sales: [],
      receivables: [],
      payables: [],
      expiringInventory: []
    },
    financialFilters = {
      clientName: '',
      assignedPerson: '',
      dateFrom: '',
      dateTo: '',
      status: 'all',
      expiringDays: 7
    },
    activeFinancialTab = 'activesales',
    setActiveFinancialTab,
    setFinancialFilters
  } = state;
  
  const [showFilters, setShowFilters] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  
  // Pagination state for mobile
  const [currentPage, setCurrentPage] = React.useState({
    activesales: 1,
    sales: 1,
    receivables: 1,
    payables: 1,
    expiring: 1
  });
  const itemsPerPage = 10;
  
  // Ensure financial data is loaded
  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (window.loadFinancialData) {
          await window.loadFinancialData();
        } else if (window.fetchFinancialData) {
          await window.fetchFinancialData();
        }
        
        // If expiring tab, ensure expiring inventory is loaded
        if (activeFinancialTab === 'expiring' && window.getEnhancedExpiringInventory) {
          const expiringData = window.getEnhancedExpiringInventory();
          if (window.appState && window.appState.setFinancialData) {
            window.appState.setFinancialData(prev => ({
              ...prev,
              expiringInventory: expiringData
            }));
          }
        }
      } catch (error) {
        console.error('Error loading financial data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Get current tab data
  const getCurrentTabData = () => {
    let currentData = [];
    
    if (activeFinancialTab === 'expiring' && window.getEnhancedExpiringInventory) {
      currentData = window.getEnhancedExpiringInventory() || [];
    } else {
      // Map tab names to data property names
      const dataKeyMap = {
        'activesales': 'activeSales',
        'sales': 'sales',
        'receivables': 'receivables',
        'payables': 'payables',
        'expiring': 'expiringInventory'
      };
      const dataKey = dataKeyMap[activeFinancialTab] || activeFinancialTab;
      currentData = financialData[dataKey] || [];
    }
    
    // Apply filters
    let filteredData = [...currentData];
    
    if (financialFilters.clientName) {
      filteredData = filteredData.filter(item => 
        (item.client_name || item.supplier_name || item.event_name || '').toLowerCase().includes(financialFilters.clientName.toLowerCase())
      );
    }
    
    if (financialFilters.assignedPerson && activeFinancialTab !== 'payables' && activeFinancialTab !== 'expiring') {
      filteredData = filteredData.filter(item => 
        (item.assigned_to || item.assigned_to_name || '').toLowerCase().includes(financialFilters.assignedPerson.toLowerCase())
      );
    }
    
    if (financialFilters.status !== 'all' && activeFinancialTab !== 'expiring') {
      filteredData = filteredData.filter(item => item.status === financialFilters.status);
    }
    
    // Date filters
    if (financialFilters.dateFrom) {
      filteredData = filteredData.filter(item => {
        const itemDate = new Date(item.date || item.due_date || item.created_at || item.order_date || item.event_date);
        return itemDate >= new Date(financialFilters.dateFrom);
      });
    }
    
    if (financialFilters.dateTo) {
      filteredData = filteredData.filter(item => {
        const itemDate = new Date(item.date || item.due_date || item.created_at || item.order_date || item.event_date);
        return itemDate <= new Date(financialFilters.dateTo);
      });
    }
    
    return filteredData;
  };
  
  // Get financial metrics
  const metrics = window.calculateEnhancedFinancialMetricsSync ? 
    window.calculateEnhancedFinancialMetricsSync() : 
    {
      totalSales: 0,
      totalActiveSales: 0,
      totalPayables: 0,
      totalReceivables: 0,
      totalMargin: 0,
      marginPercentage: 0
    };
  
  const tabs = ['activesales', 'sales', 'receivables', 'payables', 'expiring'];
  const tabLabels = {
    'activesales': 'Active Sales',
    'sales': 'Sales',
    'receivables': 'Receivables',
    'payables': 'Payables',
    'expiring': 'Expiring'
  };
  
  const currentTabData = getCurrentTabData();
  
  // Pagination logic
  const getPaginatedData = () => {
    const startIndex = (currentPage[activeFinancialTab] - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return currentTabData.slice(startIndex, endIndex);
  };
  
  const totalPages = Math.ceil(currentTabData.length / itemsPerPage);
  const paginatedData = getPaginatedData();
  
  // Reset page when tab changes
  React.useEffect(() => {
    setCurrentPage(prev => ({ ...prev, [activeFinancialTab]: 1 }));
  }, [activeFinancialTab]);
  
  if (loading) {
    return React.createElement(window.MobileLoadingState || 'div', null, 'Loading financial data...');
  }
  
  return React.createElement('div', { className: 'mobile-content-wrapper' },
    // Sticky header with stats
    React.createElement('div', { 
      className: 'sticky top-0 bg-white dark:bg-gray-900 z-10'
    },
      // Financial Stats Summary - single line format
      React.createElement('div', { className: 'p-3 border-b' },
        React.createElement('div', { className: 'grid grid-cols-2 gap-2' },
          [
            { label: 'Active Sales', value: window.formatCurrency(metrics.totalActiveSales), color: 'text-blue-600' },
            { label: 'Total Sales', value: window.formatCurrency(metrics.totalSales), color: 'text-green-600' },
            { label: 'Receivables', value: window.formatCurrency(metrics.totalReceivables), color: 'text-yellow-600' },
            { label: 'Payables', value: window.formatCurrency(metrics.totalPayables), color: 'text-red-600' }
          ].map((stat, idx) => 
            React.createElement('div', { 
              key: idx,
              className: 'bg-gray-50 dark:bg-gray-800 p-2 rounded flex items-center justify-between'
            },
              React.createElement('span', { className: 'text-xs text-gray-500' }, stat.label),
              React.createElement('span', { className: `text-sm font-bold ${stat.color}` }, stat.value)
            )
          )
        )
      ),
      
      // Tabs
      React.createElement('div', { className: 'flex overflow-x-auto no-scrollbar border-b' },
        tabs.map(tab => 
          React.createElement('button', {
            key: tab,
            onClick: () => setActiveFinancialTab(tab),
            className: `px-3 py-2 text-xs font-medium whitespace-nowrap ${
              activeFinancialTab === tab 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500'
            }`
          }, tabLabels[tab])
        )
      ),
      
      // Filters section
      React.createElement('div', { 
        className: 'p-2 border-b flex items-center justify-between'
      },
        React.createElement('button', {
          onClick: () => setShowFilters(!showFilters),
          className: `px-3 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 ${showFilters ? 'text-blue-600' : 'text-gray-600'}`
        }, '⚙️ Filters'),
        React.createElement('span', { className: 'text-xs text-gray-500' },
          `Showing ${currentTabData.length} items`
        )
      ),
      
      // Expanded filters
      showFilters && React.createElement('div', { 
        className: 'bg-gray-50 dark:bg-gray-800 p-3 space-y-2 border-b'
      },
        // Client/Supplier Name
        React.createElement('input', {
          type: 'text',
          placeholder: activeFinancialTab === 'payables' ? 'Search supplier...' : 'Search client...',
          value: financialFilters.clientName,
          onChange: (e) => setFinancialFilters({...financialFilters, clientName: e.target.value}),
          className: 'w-full px-3 py-2 text-sm rounded border'
        }),
        
        // Assigned Person
        activeFinancialTab !== 'payables' && React.createElement('input', {
          type: 'text',
          placeholder: 'Search by assigned person...',
          value: financialFilters.assignedPerson,
          onChange: (e) => setFinancialFilters({...financialFilters, assignedPerson: e.target.value}),
          className: 'w-full px-3 py-2 text-sm rounded border'
        }),
        
        // Status filter
        React.createElement('select', {
          value: financialFilters.status,
          onChange: (e) => setFinancialFilters({...financialFilters, status: e.target.value}),
          className: 'w-full px-3 py-2 text-sm rounded border'
        },
          React.createElement('option', { value: 'all' }, 'All Status'),
          React.createElement('option', { value: 'pending' }, 'Pending'),
          React.createElement('option', { value: 'partial' }, 'Partial'),
          React.createElement('option', { value: 'paid' }, 'Paid'),
          React.createElement('option', { value: 'overdue' }, 'Overdue')
        )
      )
    ),
    
    // Content area with 3D cards
    React.createElement('div', { className: 'p-4' },
      currentTabData.length > 0 ?
        React.createElement('div', { className: 'space-y-4 px-2' },
          paginatedData.map((item, index) => {
            // Different rendering based on tab
            if (activeFinancialTab === 'activesales' || activeFinancialTab === 'sales') {
              return React.createElement('div', {
                key: item.id || index,
                className: 'bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 transform transition-all duration-200 hover:scale-[1.02] hover:shadow-xl border border-gray-100 dark:border-gray-700',
                style: {
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }
              },
                React.createElement('div', { className: 'flex justify-between items-start mb-2' },
                  React.createElement('div', { className: 'flex-1' },
                    React.createElement('div', { className: 'font-medium text-sm' }, 
                      item.client_name || item.clientName || item.client || 'Unknown Client'
                    ),
                    React.createElement('div', { className: 'text-xs text-gray-500' }, 
                      `Order: ${item.order_number || item.order_id || item.id}`
                    ),
                    item.event_name && React.createElement('div', { className: 'text-xs text-gray-500' }, 
                      item.event_name
                    )
                  ),
                  React.createElement('div', { className: 'text-right' },
                    React.createElement('div', { 
                      className: 'text-sm font-bold text-green-600'
                    }, window.formatCurrency(item.amount || item.total_amount || 0)),
                    React.createElement('div', { 
                      className: `text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${
                        item.status === 'completed' || item.status === 'paid' ? 
                          'bg-green-100 text-green-800' : 
                          'bg-yellow-100 text-yellow-800'
                      }`
                    }, item.status || 'pending')
                  )
                ),
                React.createElement('div', { className: 'grid grid-cols-2 gap-2 text-xs' },
                  React.createElement('div', null,
                    React.createElement('span', { className: 'text-gray-500' }, 'Date: '),
                    new Date(item.created_at || item.order_date || item.date).toLocaleDateString()
                  ),
                  item.assigned_to && React.createElement('div', null,
                    React.createElement('span', { className: 'text-gray-500' }, 'Assigned: '),
                    item.assigned_to_name || item.assigned_to
                  )
                )
              );
            } else if (activeFinancialTab === 'receivables') {
              return React.createElement('div', {
                key: item.id || index,
                className: 'bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 transform transition-all duration-200 hover:scale-[1.02] hover:shadow-xl border border-gray-100 dark:border-gray-700',
                style: {
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }
              },
                React.createElement('div', { className: 'flex justify-between items-start mb-2' },
                  React.createElement('div', { className: 'flex-1' },
                    React.createElement('div', { className: 'font-medium text-sm' }, 
                      item.client_name || item.clientName || item.client || 'Unknown Client'
                    ),
                    React.createElement('div', { className: 'text-xs text-gray-500' }, 
                      `Invoice: ${item.invoice_number || item.order_number || item.id}`
                    ),
                    React.createElement('div', { className: 'text-xs text-gray-500' }, 
                      `Order: ${item.order_number || item.order_id || '-'}`
                    )
                  ),
                  React.createElement('div', { className: 'text-right' },
                    React.createElement('div', { 
                      className: 'text-sm font-bold text-yellow-600'
                    }, window.formatCurrency(item.balance_amount || item.amount || 0)),
                    React.createElement('div', { 
                      className: `text-xs ${
                        new Date(item.due_date) < new Date() ? 'text-red-600 font-medium' : 'text-gray-500'
                      }`
                    }, new Date(item.due_date) < new Date() ? 'OVERDUE' : 'Due: ' + new Date(item.due_date).toLocaleDateString())
                  )
                ),
                React.createElement('div', { className: 'grid grid-cols-2 gap-2 text-xs' },
                  React.createElement('div', null,
                    React.createElement('span', { className: 'text-gray-500' }, 'Total: '),
                    window.formatCurrency(item.total_amount || 0)
                  ),
                  React.createElement('div', null,
                    React.createElement('span', { className: 'text-gray-500' }, 'Paid: '),
                    window.formatCurrency(item.paid_amount || 0)
                  )
                )
              );
            } else if (activeFinancialTab === 'payables') {
              return React.createElement('div', {
                key: item.id || index,
                className: 'bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 transform transition-all duration-200 hover:scale-[1.02] hover:shadow-xl border border-gray-100 dark:border-gray-700',
                style: {
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }
              },
                React.createElement('div', { className: 'flex justify-between items-start mb-2' },
                  React.createElement('div', { className: 'flex-1' },
                    React.createElement('div', { className: 'font-medium text-sm' }, 
                      item.supplier_name || item.supplierName || item.supplier || item.event_name || 'Unknown Supplier'
                    ),
                    React.createElement('div', { className: 'text-xs text-gray-500' }, 
                      `Invoice: ${item.invoice_number || item.id}`
                    ),
                    item.description && React.createElement('div', { className: 'text-xs text-gray-500' }, 
                      item.description
                    )
                  ),
                  React.createElement('div', { className: 'text-right' },
                    React.createElement('div', { 
                      className: 'text-sm font-bold text-red-600'
                    }, window.formatCurrency(item.amount || 0)),
                    React.createElement('div', { 
                      className: `text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${
                        item.status === 'paid' ? 'bg-green-100 text-green-800' : 
                        item.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`
                    }, item.status || 'pending')
                  )
                ),
                React.createElement('div', { className: 'text-xs text-gray-500' },
                  'Due: ', new Date(item.due_date || item.date).toLocaleDateString()
                )
              );
            } else if (activeFinancialTab === 'expiring') {
              return React.createElement('div', {
                key: item.id || index,
                className: 'bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 transform transition-all duration-200 hover:scale-[1.02] hover:shadow-xl border border-gray-100 dark:border-gray-700',
                style: {
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }
              },
                React.createElement('div', { className: 'flex justify-between items-start' },
                  React.createElement('div', { className: 'flex-1' },
                    React.createElement('div', { className: 'font-medium text-sm' }, 
                      item.event_name || 'Unknown Event'
                    ),
                    React.createElement('div', { className: 'text-xs text-gray-500' }, 
                      `${item.available_tickets || 0} tickets available`
                    ),
                    React.createElement('div', { className: 'text-xs text-gray-500' }, 
                      'Expires: ', new Date(item.event_date).toLocaleDateString()
                    )
                  ),
                  React.createElement('div', { className: 'text-right' },
                    React.createElement('div', { 
                      className: 'text-sm font-bold text-purple-600'
                    }, window.formatCurrency(item.inventory_value || 0)),
                    React.createElement('div', { className: 'text-xs text-gray-500' },
                      `${item.days_until_expiry || 0} days left`
                    )
                  )
                )
              );
            }
          })
        ) :
        React.createElement('div', { 
          className: 'text-center py-8 text-gray-500'
        }, 
          React.createElement('p', null, `No ${tabLabels[activeFinancialTab].toLowerCase()} data available`),
          React.createElement('p', { className: 'text-sm mt-2' }, 'Try adjusting your filters or check back later')
        ),
      
      // Pagination controls
      currentTabData.length > itemsPerPage && React.createElement('div', { 
        className: 'flex items-center justify-between mt-6 px-2'
      },
        React.createElement('button', {
          onClick: () => setCurrentPage(prev => ({
            ...prev,
            [activeFinancialTab]: Math.max(1, prev[activeFinancialTab] - 1)
          })),
          disabled: currentPage[activeFinancialTab] === 1,
          className: `px-3 py-1 text-sm rounded-lg ${
            currentPage[activeFinancialTab] === 1 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`
        }, 'Previous'),
        
        React.createElement('span', { className: 'text-sm text-gray-600' },
          `Page ${currentPage[activeFinancialTab]} of ${totalPages}`
        ),
        
        React.createElement('button', {
          onClick: () => setCurrentPage(prev => ({
            ...prev,
            [activeFinancialTab]: Math.min(totalPages, prev[activeFinancialTab] + 1)
          })),
          disabled: currentPage[activeFinancialTab] === totalPages,
          className: `px-3 py-1 text-sm rounded-lg ${
            currentPage[activeFinancialTab] === totalPages 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`
        }, 'Next')
      )
    )
  );
};

// Mobile Sales Performance View
window.MobileSalesPerformanceView = function() {
  const [salesData, setSalesData] = React.useState([]);
  const [retailData, setRetailData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [period, setPeriod] = React.useState('lifetime');
  const [availablePeriods, setAvailablePeriods] = React.useState([]);
  const [activeTab, setActiveTab] = React.useState('target'); // 'target' or 'retail'
  const [dateRange, setDateRange] = React.useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [totalSystemLeads, setTotalSystemLeads] = React.useState(0);
  
  // Fetch periods
  React.useEffect(() => {
    const fetchPeriods = async () => {
      try {
        const token = localStorage.getItem('crm_auth_token');
        const response = await fetch(`${window.API_CONFIG.API_URL}/sales-performance/periods`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const result = await response.json();
          setAvailablePeriods(result.periods || []);
        }
      } catch (error) {
        console.error('Error fetching periods:', error);
      }
    };
    
    fetchPeriods();
  }, []);
  
  // Fetch sales performance data
  const fetchSalesPerformance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('crm_auth_token');
      
      // Fetch sales team data
      const salesResponse = await fetch(`${window.API_CONFIG.API_URL}/sales-performance?period=${period}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (salesResponse.ok) {
        const salesResult = await salesResponse.json();
        setSalesData(salesResult.salesTeam || []);
      }
      
      // Fetch retail tracker data
      const retailResponse = await fetch(`${window.API_CONFIG.API_URL}/sales-performance/retail-tracker?start_date=${dateRange.start}&end_date=${dateRange.end}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (retailResponse.ok) {
        const retailResult = await retailResponse.json();
        setRetailData(retailResult.retailData || []);
        setTotalSystemLeads(retailResult.totalSystemLeadsInDateRange || 0);
      }
    } catch (error) {
      console.error('Error fetching sales performance:', error);
    } finally {
      setLoading(false);
    }
  };
  
  React.useEffect(() => {
    fetchSalesPerformance();
  }, [period]);
  
  React.useEffect(() => {
    if (!loading) {
      fetchSalesPerformance();
    }
  }, [dateRange.start, dateRange.end]);
  
  if (loading) {
    return React.createElement(window.MobileLoadingState);
  }
  
  // Sort data alphabetically by name
  const sortedSalesData = [...salesData].sort((a, b) => 
    (a.name || '').localeCompare(b.name || '')
  );
  
  const sortedRetailData = [...retailData].sort((a, b) => 
    (a.salesMember || '').localeCompare(b.salesMember || '')
  );
  
  // Calculate totals
  const totals = salesData.reduce((acc, person) => ({
    target: acc.target + (person.target || 0),
    totalSales: acc.totalSales + (person.totalSales || 0),
    actualizedSales: acc.actualizedSales + (person.actualizedSales || 0),
    totalMargin: acc.totalMargin + (person.totalMargin || 0),
    actualizedMargin: acc.actualizedMargin + (person.actualizedMargin || 0),
    salesPersonPipeline: acc.salesPersonPipeline + (person.salesPersonPipeline || 0),
    retailPipeline: acc.retailPipeline + (person.retailPipeline || 0),
    corporatePipeline: acc.corporatePipeline + (person.corporatePipeline || 0),
    overallPipeline: acc.overallPipeline + (person.overallPipeline || 0)
  }), { 
    target: 0, totalSales: 0, actualizedSales: 0, totalMargin: 0, 
    actualizedMargin: 0, salesPersonPipeline: 0, retailPipeline: 0, 
    corporatePipeline: 0, overallPipeline: 0 
  });
  
  const calculateRetailMetrics = (row) => {
    const qualTouchbasedDenominator = row.touchbased + row.qualified;
    const qualTouchbased = qualTouchbasedDenominator > 0 ? 
      (row.qualified / qualTouchbasedDenominator * 100).toFixed(0) : 0;
    
    const convertedQualDenominator = row.converted + row.qualified;
    const convertedQual = convertedQualDenominator > 0 ? 
      (row.converted / convertedQualDenominator * 100).toFixed(0) : 0;
    
    return { qualTouchbased, convertedQual };
  };

  return React.createElement('div', { className: 'mobile-content-wrapper' },
    // Header with tab switcher
    React.createElement('div', { 
      className: 'sticky top-0 bg-white dark:bg-gray-900 z-10 pb-3 border-b'
    },
      React.createElement('h2', { 
        className: 'text-lg font-semibold mb-3'
      }, 'Sales Performance'),
      
      // Tab switcher
      React.createElement('div', { className: 'flex gap-2' },
        React.createElement('button', {
          onClick: () => setActiveTab('target'),
          className: `flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'target' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`
        }, 'Target vs Achievement'),
        React.createElement('button', {
          onClick: () => setActiveTab('retail'),
          className: `flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'retail' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`
        }, 'Retail Tracker')
      ),
      
      // Period selector for target tab
      activeTab === 'target' && availablePeriods.length > 0 && React.createElement('select', {
        value: period,
        onChange: (e) => setPeriod(e.target.value),
        className: 'w-full mt-3 px-3 py-2 border rounded-lg text-sm'
      },
        availablePeriods.map(p => 
          React.createElement('option', { key: p.value, value: p.value }, p.label)
        )
      )
    ),
    
    // Content based on active tab
    activeTab === 'target' ? 
      // Target vs Achievement Tab
      React.createElement('div', { className: 'space-y-4 mt-4' },
        // Summary cards - single line format
        React.createElement('div', { 
          className: 'grid grid-cols-2 gap-3 mb-4'
        },
          React.createElement('div', { className: 'mobile-card p-3 flex items-center justify-between' },
            React.createElement('span', { className: 'text-xs text-gray-500' },
              'Actualized Sales (Crs)'
            ),
            React.createElement('span', { className: 'text-xl font-bold text-blue-600' },
              (totals.actualizedSales || 0).toFixed(2)
            )
          ),
          React.createElement('div', { className: 'mobile-card p-3 flex items-center justify-between' },
            React.createElement('span', { className: 'text-xs text-gray-500' },
              'Overall Achievement'
            ),
            React.createElement('span', { className: 'text-xl font-bold text-green-600' },
              totals.target > 0 ? 
                Math.round(totals.actualizedSales / totals.target * 100) + '%' : '0%'
            )
          )
        ),
        
        // Individual sales person cards with 3D effect
        React.createElement('div', { className: 'space-y-4 px-2' },
          sortedSalesData.length > 0 ?
            sortedSalesData.map(person => {
              const achievement = person.target > 0 ? 
                Math.round((person.actualizedSales || 0) / person.target * 100) : 0;
              
              return React.createElement('div', {
                key: person.id,
                className: 'bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 transform transition-all duration-200 hover:scale-[1.02] hover:shadow-xl border border-gray-100 dark:border-gray-700',
                style: {
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }
              },
                // Header with name and achievement badge
                React.createElement('div', { className: 'flex items-start justify-between mb-4' },
                  React.createElement('div', null,
                    React.createElement('h3', { 
                      className: 'font-bold text-lg text-gray-900 dark:text-white'
                    }, person.name),
                    React.createElement('div', { 
                      className: 'text-sm text-gray-600 dark:text-gray-400 mt-1'
                    }, `Target: ${(person.target || 0).toFixed(2)} Crs`)
                  ),
                  React.createElement('div', { 
                    className: `px-3 py-1 rounded-full text-xs font-bold ${
                      achievement >= 100 ? 'bg-green-100 text-green-800' : 
                      achievement >= 75 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`
                  }, `${achievement}%`)
                ),
                
                // Achievement progress bar
                React.createElement('div', { className: 'mb-4' },
                  React.createElement('div', { 
                    className: 'bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden'
                  },
                    React.createElement('div', {
                      className: `h-full rounded-full transition-all duration-500 ${
                        achievement >= 100 ? 'bg-gradient-to-r from-green-400 to-green-600' : 
                        achievement >= 75 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 
                        'bg-gradient-to-r from-red-400 to-red-600'
                      }`,
                      style: { 
                        width: `${Math.min(achievement, 100)}%` 
                      }
                    })
                  )
                ),
                
                // Achievement metrics grid
                React.createElement('div', { className: 'grid grid-cols-2 gap-3 mb-4' },
                  React.createElement('div', { 
                    className: 'bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3'
                  },
                    React.createElement('div', { className: 'text-xs text-blue-600 dark:text-blue-400' }, 
                      'Total Sales'
                    ),
                    React.createElement('div', { className: 'text-sm font-bold text-blue-900 dark:text-blue-100' }, 
                      (person.totalSales || 0).toFixed(2) + ' Crs'
                    )
                  ),
                  React.createElement('div', { 
                    className: 'bg-green-50 dark:bg-green-900/20 rounded-lg p-3'
                  },
                    React.createElement('div', { className: 'text-xs text-green-600 dark:text-green-400' }, 
                      'Actualized Sales'
                    ),
                    React.createElement('div', { className: 'text-sm font-bold text-green-900 dark:text-green-100' }, 
                      (person.actualizedSales || 0).toFixed(2) + ' Crs'
                    )
                  ),
                  React.createElement('div', { 
                    className: 'bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3'
                  },
                    React.createElement('div', { className: 'text-xs text-purple-600 dark:text-purple-400' }, 
                      'Total Margin'
                    ),
                    React.createElement('div', { className: 'text-sm font-bold text-purple-900 dark:text-purple-100' }, 
                      (person.totalMargin || 0).toFixed(2) + ' Crs'
                    )
                  ),
                  React.createElement('div', { 
                    className: 'bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3'
                  },
                    React.createElement('div', { className: 'text-xs text-orange-600 dark:text-orange-400' }, 
                      'Actualized Margin'
                    ),
                    React.createElement('div', { className: 'text-sm font-bold text-orange-900 dark:text-orange-100' }, 
                      (person.actualizedMargin || 0).toFixed(2) + ' Crs'
                    )
                  )
                ),
                
                // Pipeline section with gradient background
                React.createElement('div', { 
                  className: 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-3'
                },
                  React.createElement('div', { 
                    className: 'text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider' 
                  }, 'Pipeline (Crs)'),
                  React.createElement('div', { className: 'grid grid-cols-2 gap-x-4 gap-y-2' },
                    React.createElement('div', { className: 'flex justify-between items-center' },
                      React.createElement('span', { className: 'text-xs text-gray-600 dark:text-gray-400' }, 
                        'Sales Person:'
                      ),
                      React.createElement('span', { className: 'text-sm font-bold text-gray-900 dark:text-white' }, 
                        (person.salesPersonPipeline || 0).toFixed(2)
                      )
                    ),
                    React.createElement('div', { className: 'flex justify-between items-center' },
                      React.createElement('span', { className: 'text-xs text-gray-600 dark:text-gray-400' }, 
                        'Retail:'
                      ),
                      React.createElement('span', { className: 'text-sm font-bold text-gray-900 dark:text-white' }, 
                        (person.retailPipeline || 0).toFixed(2)
                      )
                    ),
                    React.createElement('div', { className: 'flex justify-between items-center' },
                      React.createElement('span', { className: 'text-xs text-gray-600 dark:text-gray-400' }, 
                        'Corporate:'
                      ),
                      React.createElement('span', { className: 'text-sm font-bold text-gray-900 dark:text-white' }, 
                        (person.corporatePipeline || 0).toFixed(2)
                      )
                    ),
                    React.createElement('div', { 
                      className: 'flex justify-between items-center pt-2 border-t border-gray-300 dark:border-gray-600'
                    },
                      React.createElement('span', { className: 'text-xs font-bold text-gray-700 dark:text-gray-300' }, 
                        'Overall:'
                      ),
                      React.createElement('span', { className: 'text-sm font-bold text-blue-600 dark:text-blue-400' }, 
                        (person.overallPipeline || 0).toFixed(2)
                      )
                    )
                  )
                )
              );
            }) :
            React.createElement('p', { 
              className: 'text-center text-gray-500 py-8'
            }, 'No sales team members found')
        ),
        
        // Total row
        sortedSalesData.length > 0 && React.createElement('div', { 
          className: 'mobile-card p-4 bg-gray-100 dark:bg-gray-800'
        },
          React.createElement('h3', { 
            className: 'font-bold text-gray-900 dark:text-white mb-3'
          }, 'Total Sales'),
          React.createElement('div', { className: 'grid grid-cols-2 gap-2 text-xs' },
            React.createElement('div', null,
              React.createElement('span', { className: 'text-gray-600 block' }, 'Target'),
              React.createElement('span', { className: 'font-bold text-lg' }, 
                totals.target.toFixed(2) + ' Crs'
              )
            ),
            React.createElement('div', null,
              React.createElement('span', { className: 'text-gray-600 block' }, 'Actualized Sales'),
              React.createElement('span', { className: 'font-bold text-lg text-green-600' }, 
                totals.actualizedSales.toFixed(2) + ' Crs'
              )
            )
          )
        )
      ) :
      // Retail Tracker Tab
      React.createElement('div', { className: 'space-y-4 mt-4' },
        // Date range selector
        React.createElement('div', { className: 'flex gap-2 mb-4' },
          React.createElement('input', {
            type: 'date',
            value: dateRange.start,
            onChange: (e) => setDateRange({ ...dateRange, start: e.target.value }),
            className: 'flex-1 px-3 py-2 border rounded-lg text-sm'
          }),
          React.createElement('input', {
            type: 'date',
            value: dateRange.end,
            onChange: (e) => setDateRange({ ...dateRange, end: e.target.value }),
            className: 'flex-1 px-3 py-2 border rounded-lg text-sm'
          })
        ),
        
        // Total System Leads
        totalSystemLeads !== undefined && React.createElement('div', { 
          className: 'mobile-card p-3 bg-blue-50 dark:bg-blue-900/20 border-blue-200'
        },
          React.createElement('div', { className: 'text-sm text-blue-800 dark:text-blue-200' },
            React.createElement('span', { className: 'font-semibold' }, 'Total System Leads: '),
            React.createElement('span', { className: 'text-lg font-bold' }, 
              totalSystemLeads || 0
            )
          ),
          React.createElement('div', { className: 'text-xs text-blue-600 dark:text-blue-300' }, 
            'All leads in the system for selected date range'
          )
        ),
        
        // Retail team member cards with 3D effect
        React.createElement('div', { className: 'space-y-4 px-2' },
          sortedRetailData.length > 0 ?
            sortedRetailData.map(member => {
              const metrics = calculateRetailMetrics(member);
              const conversionRate = member.assigned > 0 ? 
                Math.round((member.converted || 0) / member.assigned * 100) : 0;
              
              return React.createElement('div', {
                key: member.id,
                className: 'bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 transform transition-all duration-200 hover:scale-[1.02] hover:shadow-xl border border-gray-100 dark:border-gray-700',
                style: {
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }
              },
                // Header with name and conversion badge
                React.createElement('div', { className: 'flex items-start justify-between mb-4' },
                  React.createElement('h3', { 
                    className: 'font-bold text-lg text-gray-900 dark:text-white'
                  }, member.salesMember),
                  React.createElement('div', { 
                    className: `px-3 py-1 rounded-full text-xs font-bold ${
                      conversionRate >= 20 ? 'bg-green-100 text-green-800' : 
                      conversionRate >= 10 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`
                  }, `${conversionRate}% Conv`)
                ),
                
                // Primary lead stats in colored boxes
                React.createElement('div', { className: 'grid grid-cols-3 gap-3 mb-4' },
                  React.createElement('div', { 
                    className: 'bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center'
                  },
                    React.createElement('div', { className: 'text-2xl font-bold text-blue-600 dark:text-blue-400' }, 
                      member.assigned || 0
                    ),
                    React.createElement('div', { className: 'text-xs text-blue-700 dark:text-blue-300' }, 
                      'Assigned'
                    )
                  ),
                  React.createElement('div', { 
                    className: 'bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center'
                  },
                    React.createElement('div', { className: 'text-2xl font-bold text-green-600 dark:text-green-400' }, 
                      member.touchbased || 0
                    ),
                    React.createElement('div', { className: 'text-xs text-green-700 dark:text-green-300' }, 
                      'Touchbased'
                    )
                  ),
                  React.createElement('div', { 
                    className: 'bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center'
                  },
                    React.createElement('div', { className: 'text-2xl font-bold text-purple-600 dark:text-purple-400' }, 
                      member.qualified || 0
                    ),
                    React.createElement('div', { className: 'text-xs text-purple-700 dark:text-purple-300' }, 
                      'Qualified'
                    )
                  )
                ),
                
                // Conversion funnel visualization
                React.createElement('div', { className: 'mb-4' },
                  React.createElement('div', { className: 'text-xs font-bold text-gray-700 dark:text-gray-300 mb-2' }, 
                    'CONVERSION FUNNEL'
                  ),
                  React.createElement('div', { className: 'space-y-2' },
                    // Touchbased percentage bar
                    React.createElement('div', null,
                      React.createElement('div', { className: 'flex justify-between text-xs mb-1' },
                        React.createElement('span', { className: 'text-gray-600 dark:text-gray-400' }, 
                          'Touchbased Rate'
                        ),
                        React.createElement('span', { className: 'font-medium' }, 
                          member.assigned > 0 ? 
                            Math.round(member.touchbased / member.assigned * 100) + '%' : '0%'
                        )
                      ),
                      React.createElement('div', { 
                        className: 'bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden'
                      },
                        React.createElement('div', {
                          className: 'h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full',
                          style: { 
                            width: member.assigned > 0 ? 
                              `${Math.round(member.touchbased / member.assigned * 100)}%` : '0%'
                          }
                        })
                      )
                    ),
                    // Qualified percentage bar
                    React.createElement('div', null,
                      React.createElement('div', { className: 'flex justify-between text-xs mb-1' },
                        React.createElement('span', { className: 'text-gray-600 dark:text-gray-400' }, 
                          'Qual/Touchbased'
                        ),
                        React.createElement('span', { className: 'font-medium text-purple-600' }, 
                          metrics.qualTouchbased + '%'
                        )
                      ),
                      React.createElement('div', { 
                        className: 'bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden'
                      },
                        React.createElement('div', {
                          className: 'h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full',
                          style: { 
                            width: `${metrics.qualTouchbased}%`
                          }
                        })
                      )
                    ),
                    // Converted percentage bar
                    React.createElement('div', null,
                      React.createElement('div', { className: 'flex justify-between text-xs mb-1' },
                        React.createElement('span', { className: 'text-gray-600 dark:text-gray-400' }, 
                          'Converted/Qual'
                        ),
                        React.createElement('span', { className: 'font-medium text-green-600' }, 
                          metrics.convertedQual + '%'
                        )
                      ),
                      React.createElement('div', { 
                        className: 'bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden'
                      },
                        React.createElement('div', {
                          className: 'h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full',
                          style: { 
                            width: `${metrics.convertedQual}%`
                          }
                        })
                      )
                    )
                  )
                ),
                
                // Additional metrics in gradient box
                React.createElement('div', { 
                  className: 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-3'
                },
                  React.createElement('div', { className: 'grid grid-cols-2 gap-x-4 gap-y-2' },
                    React.createElement('div', { className: 'flex justify-between items-center' },
                      React.createElement('span', { className: 'text-xs text-gray-600 dark:text-gray-400' }, 
                        'Hot + Warm:'
                      ),
                      React.createElement('span', { className: 'text-sm font-bold text-orange-600 dark:text-orange-400' }, 
                        member.hotWarm || 0
                      )
                    ),
                    React.createElement('div', { className: 'flex justify-between items-center' },
                      React.createElement('span', { className: 'text-xs text-gray-600 dark:text-gray-400' }, 
                        'Converted:'
                      ),
                      React.createElement('span', { className: 'text-sm font-bold text-green-600 dark:text-green-400' }, 
                        member.converted || 0
                      )
                    ),
                    React.createElement('div', { className: 'flex justify-between items-center' },
                      React.createElement('span', { className: 'text-xs text-gray-600 dark:text-gray-400' }, 
                        'Not Touchbased:'
                      ),
                      React.createElement('span', { className: 'text-sm font-bold text-gray-700 dark:text-gray-300' }, 
                        member.notTouchbased || 0
                      )
                    ),
                    React.createElement('div', { className: 'flex justify-between items-center' },
                      React.createElement('span', { className: 'text-xs text-gray-600 dark:text-gray-400' }, 
                        'Success Rate:'
                      ),
                      React.createElement('span', { 
                        className: `text-sm font-bold ${
                          conversionRate >= 20 ? 'text-green-600' : 
                          conversionRate >= 10 ? 'text-yellow-600' : 
                          'text-red-600'
                        }`
                      }, 
                        conversionRate + '%'
                      )
                    )
                  )
                )
              );
            }) :
            React.createElement('p', { 
              className: 'text-center text-gray-500 py-8'
            }, 'No retail tracking data found')
        )
      )
  );
};

// Mobile Marketing Performance View
window.MobileMarketingPerformanceView = function() {
  const [state, setState] = React.useState({
    loading: true,
    data: null,
    error: null,
    filters: {
      dateFrom: new Date(new Date().setDate(new Date().getDate() - 14)).toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
      event: 'all',
      source: 'all',
      sources: [],
      adSet: 'all'
    },
    activeView: 'metrics', // 'metrics' or 'chart'
    showFilters: false
  });
  
  // Fetch marketing data from backend
  const fetchMarketingData = async (filters) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const queryParams = new URLSearchParams({
        date_from: filters.dateFrom,
        date_to: filters.dateTo
      });
      
      if (filters.event !== 'all') queryParams.append('event', filters.event);
      
      // Handle multi-select sources
      if (filters.sources && filters.sources.length > 0) {
        queryParams.append('sources', filters.sources.join(','));
      } else if (filters.source !== 'all') {
        queryParams.append('source', filters.source);
      }
      
      if (filters.adSet !== 'all') queryParams.append('ad_set', filters.adSet);
      
      const response = await window.apiCall(`/marketing/performance?${queryParams}`);
      
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          data: response.data, 
          loading: false 
        }));
      } else {
        throw new Error(response.message || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching marketing data:', error);
      setState(prev => ({ 
        ...prev, 
        error: error.message, 
        loading: false 
      }));
    }
  };
  
  // Initial fetch
  React.useEffect(() => {
    fetchMarketingData(state.filters);
  }, []);
  
  if (state.loading) {
    return React.createElement(window.MobileLoadingState);
  }
  
  if (state.error) {
    return React.createElement(window.MobileErrorState, {
      error: state.error,
      onRetry: () => fetchMarketingData(state.filters)
    });
  }
  
  const data = state.data || {};
  const marketingData = data.marketingData || [];
  const totals = data.totals || {};
  
  return React.createElement('div', { className: 'mobile-content-wrapper' },
    // Header with date filter
    React.createElement('div', { 
      className: 'sticky top-0 bg-white dark:bg-gray-900 z-10 border-b'
    },
      React.createElement('div', { className: 'p-4' },
        React.createElement('div', { className: 'flex items-center justify-between mb-3' },
          React.createElement('h2', { 
            className: 'text-lg font-semibold'
          }, 'Marketing Performance'),
          React.createElement('button', {
            onClick: () => setState(prev => ({ ...prev, showFilters: !prev.showFilters })),
            className: 'text-blue-600 text-sm'
          }, state.showFilters ? 'Hide Filters' : 'Show Filters')
        ),
        
        // Date range filters (always visible)
        React.createElement('div', { className: 'flex gap-2' },
          React.createElement('input', {
            type: 'date',
            value: state.filters.dateFrom,
            onChange: (e) => {
              const newFilters = { ...state.filters, dateFrom: e.target.value };
              setState(prev => ({ ...prev, filters: newFilters }));
              fetchMarketingData(newFilters);
            },
            className: 'px-3 py-1 text-sm rounded border flex-1'
          }),
          React.createElement('input', {
            type: 'date',
            value: state.filters.dateTo,
            onChange: (e) => {
              const newFilters = { ...state.filters, dateTo: e.target.value };
              setState(prev => ({ ...prev, filters: newFilters }));
              fetchMarketingData(newFilters);
            },
            className: 'px-3 py-1 text-sm rounded border flex-1'
          })
        )
      ),
      
      // Additional filters (collapsible)
      state.showFilters && React.createElement('div', { 
        className: 'p-4 bg-gray-50 dark:bg-gray-800 border-t'
      },
        React.createElement('div', { className: 'space-y-2' },
          // Event filter
          React.createElement('select', {
            value: state.filters.event,
            onChange: (e) => {
              const newFilters = { ...state.filters, event: e.target.value };
              setState(prev => ({ ...prev, filters: newFilters }));
              fetchMarketingData(newFilters);
            },
            className: 'w-full px-3 py-2 text-sm rounded border'
          },
            React.createElement('option', { value: 'all' }, 'All Events'),
            data.events && data.events.map(event => 
              React.createElement('option', { key: event, value: event }, event)
            )
          ),
          
          // Source filter
          React.createElement('select', {
            value: state.filters.source,
            onChange: (e) => {
              const newFilters = { ...state.filters, source: e.target.value, sources: [] };
              setState(prev => ({ ...prev, filters: newFilters }));
              fetchMarketingData(newFilters);
            },
            className: 'w-full px-3 py-2 text-sm rounded border'
          },
            React.createElement('option', { value: 'all' }, 'All Sources'),
            data.sources && data.sources.map(source => 
              React.createElement('option', { key: source, value: source }, source)
            )
          )
        )
      )
    ),
    
    // Summary Stats - single line format
    React.createElement('div', { 
      className: 'grid grid-cols-2 gap-3 p-4'
    },
      React.createElement('div', { className: 'mobile-card p-3 flex items-center justify-between' },
        React.createElement('span', { className: 'text-xs text-gray-500' },
          'Total Leads'
        ),
        React.createElement('span', { className: 'text-xl font-bold text-blue-600' },
          totals.totalLeads || 0
        )
      ),
      React.createElement('div', { className: 'mobile-card p-3 flex items-center justify-between' },
        React.createElement('span', { className: 'text-xs text-gray-500' },
          'Qualified'
        ),
        React.createElement('span', { className: 'text-xl font-bold text-green-600' },
          totals.qualified || 0
        )
      ),
      React.createElement('div', { className: 'mobile-card p-3 flex items-center justify-between' },
        React.createElement('span', { className: 'text-xs text-gray-500' },
          'Converted'
        ),
        React.createElement('span', { className: 'text-xl font-bold text-purple-600' },
          totals.converted || 0
        )
      ),
      React.createElement('div', { className: 'mobile-card p-3 flex items-center justify-between' },
        React.createElement('span', { className: 'text-xs text-gray-500' },
          'Avg CPL'
        ),
        React.createElement('span', { className: 'text-xl font-bold text-red-600' },
          totals.totalCPL ? `₹${parseFloat(totals.totalCPL).toFixed(0)}` : '₹0'
        )
      )
    ),
    
    // Marketing Metrics
    React.createElement('div', { className: 'p-4' },
      React.createElement('h3', { 
        className: 'text-lg font-semibold mb-3 text-gray-900 dark:text-white'
      }, 'Marketing Metrics'),
      
      React.createElement('div', { className: 'space-y-4 px-2' },
        marketingData.length > 0 ?
          (() => {
            // Sort data to put Instagram and Facebook first
            const sortedData = [...marketingData].sort((a, b) => {
              const aName = (a.name || '').toLowerCase();
              const bName = (b.name || '').toLowerCase();
              
              // Instagram first
              if (aName.includes('instagram')) return -1;
              if (bName.includes('instagram')) return 1;
              
              // Facebook second
              if (aName.includes('facebook')) return -1;
              if (bName.includes('facebook')) return 1;
              
              // Rest alphabetically
              return aName.localeCompare(bName);
            });
            
            return sortedData.map((row, index) => {
              const isInstagram = (row.name || '').toLowerCase().includes('instagram');
              const isFacebook = (row.name || '').toLowerCase().includes('facebook');
              const qualifiedRate = row.totalLeads > 0 ? 
                Math.round((row.qualified || 0) / row.totalLeads * 100) : 0;
              
              return React.createElement('div', {
                key: `${row.name}-${index}`,
                className: 'bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 transform transition-all duration-200 hover:scale-[1.02] hover:shadow-xl border border-gray-100 dark:border-gray-700',
                style: {
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }
              },
                // Header with source name and performance badge
                React.createElement('div', { className: 'flex items-start justify-between mb-4' },
                  React.createElement('div', null,
                    React.createElement('h3', { 
                      className: 'font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2'
                    }, 
                      isInstagram && React.createElement('span', { className: 'text-purple-600' }, '📷'),
                      isFacebook && React.createElement('span', { className: 'text-blue-600' }, '👤'),
                      row.name
                    ),
                    row.impressions > 0 && React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-400 mt-1' },
                      window.formatIndianNumber ? window.formatIndianNumber(row.impressions) : row.impressions.toLocaleString(),
                      ' impressions'
                    )
                  ),
                  React.createElement('div', { 
                    className: `px-3 py-1 rounded-full text-xs font-bold ${
                      qualifiedRate >= 30 ? 'bg-green-100 text-green-800' : 
                      qualifiedRate >= 15 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`
                  }, `${qualifiedRate}% Qual`)
                ),
                
                // Total leads with visual indicator
                React.createElement('div', { className: 'mb-4' },
                  React.createElement('div', { 
                    className: 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-3 text-center'
                  },
                    React.createElement('div', { className: 'text-3xl font-bold text-blue-600 dark:text-blue-400' }, 
                      row.totalLeads || 0
                    ),
                    React.createElement('div', { className: 'text-xs text-blue-700 dark:text-blue-300' }, 
                      'Total Leads'
                    )
                  )
                ),
                
                // Key metrics in colored boxes
                React.createElement('div', { className: 'grid grid-cols-3 gap-3 mb-4' },
                  React.createElement('div', { 
                    className: 'bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center'
                  },
                    React.createElement('div', { className: 'text-lg font-bold text-green-600 dark:text-green-400' }, 
                      row.cpl > 0 ? `₹${parseFloat(row.cpl).toFixed(0)}` : '-'
                    ),
                    React.createElement('div', { className: 'text-xs text-green-700 dark:text-green-300' }, 'CPL')
                  ),
                  React.createElement('div', { 
                    className: 'bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center'
                  },
                    React.createElement('div', { className: 'text-lg font-bold text-purple-600 dark:text-purple-400' }, 
                      row.ctr > 0 ? `${row.ctr}%` : '-'
                    ),
                    React.createElement('div', { className: 'text-xs text-purple-700 dark:text-purple-300' }, 'CTR')
                  ),
                  React.createElement('div', { 
                    className: 'bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center'
                  },
                    React.createElement('div', { className: 'text-lg font-bold text-orange-600 dark:text-orange-400' }, 
                      row.cpm > 0 ? `₹${parseFloat(row.cpm).toFixed(0)}` : '-'
                    ),
                    React.createElement('div', { className: 'text-xs text-orange-700 dark:text-orange-300' }, 'CPM')
                  )
                ),
                
                // Lead funnel visualization
                React.createElement('div', { className: 'mb-4' },
                  React.createElement('div', { className: 'text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider' }, 
                    'Lead Funnel'
                  ),
                  React.createElement('div', { className: 'space-y-2' },
                    // Touchbased bar
                    React.createElement('div', null,
                      React.createElement('div', { className: 'flex justify-between text-xs mb-1' },
                        React.createElement('span', { className: 'text-gray-600 dark:text-gray-400' }, 
                          'Touch Based'
                        ),
                        React.createElement('span', { className: 'font-medium' }, 
                          `${row.touchBased || 0} (${row.totalLeads > 0 ? 
                            Math.round(row.touchBased / row.totalLeads * 100) : 0}%)`
                        )
                      ),
                      React.createElement('div', { 
                        className: 'bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden'
                      },
                        React.createElement('div', {
                          className: 'h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full',
                          style: { 
                            width: row.totalLeads > 0 ? 
                              `${Math.round(row.touchBased / row.totalLeads * 100)}%` : '0%'
                          }
                        })
                      )
                    ),
                    // Qualified bar
                    React.createElement('div', null,
                      React.createElement('div', { className: 'flex justify-between text-xs mb-1' },
                        React.createElement('span', { className: 'text-gray-600 dark:text-gray-400' }, 
                          'Qualified'
                        ),
                        React.createElement('span', { className: 'font-medium text-green-600' }, 
                          `${row.qualified || 0} (${row.qualifiedPercent || 0}%)`
                        )
                      ),
                      React.createElement('div', { 
                        className: 'bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden'
                      },
                        React.createElement('div', {
                          className: 'h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full',
                          style: { 
                            width: `${row.qualifiedPercent || 0}%`
                          }
                        })
                      )
                    ),
                    // Converted bar
                    React.createElement('div', null,
                      React.createElement('div', { className: 'flex justify-between text-xs mb-1' },
                        React.createElement('span', { className: 'text-gray-600 dark:text-gray-400' }, 
                          'Converted'
                        ),
                        React.createElement('span', { className: 'font-medium text-blue-600' }, 
                          `${row.converted || 0} (${row.convertedPercent || 0}%)`
                        )
                      ),
                      React.createElement('div', { 
                        className: 'bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden'
                      },
                        React.createElement('div', {
                          className: 'h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full',
                          style: { 
                            width: `${row.convertedPercent || 0}%`
                          }
                        })
                      )
                    )
                  )
                ),
                
                // Additional metrics in gradient box
                React.createElement('div', { 
                  className: 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-3'
                },
                  React.createElement('div', { className: 'grid grid-cols-2 gap-x-4 gap-y-2' },
                    React.createElement('div', { className: 'flex justify-between items-center' },
                      React.createElement('span', { className: 'text-xs text-gray-600 dark:text-gray-400' }, 
                        'Not Touch Based:'
                      ),
                      React.createElement('span', { className: 'text-sm font-bold text-gray-700 dark:text-gray-300' }, 
                        row.notTouchBased || 0
                      )
                    ),
                    React.createElement('div', { className: 'flex justify-between items-center' },
                      React.createElement('span', { className: 'text-xs text-gray-600 dark:text-gray-400' }, 
                        'Junk:'
                      ),
                      React.createElement('span', { className: 'text-sm font-bold text-red-600 dark:text-red-400' }, 
                        `${row.junk || 0} (${row.junkPercent || 0}%)`
                      )
                    ),
                    React.createElement('div', { className: 'flex justify-between items-center' },
                      React.createElement('span', { className: 'text-xs text-gray-600 dark:text-gray-400' }, 
                        'Dropped:'
                      ),
                      React.createElement('span', { className: 'text-sm font-bold text-orange-600 dark:text-orange-400' }, 
                        row.dropped || 0
                      )
                    ),
                    React.createElement('div', { className: 'flex justify-between items-center' },
                      React.createElement('span', { className: 'text-xs text-gray-600 dark:text-gray-400' }, 
                        'Hot + Warm:'
                      ),
                      React.createElement('span', { className: 'text-sm font-bold text-yellow-600 dark:text-yellow-400' }, 
                        row.hotWarm || 0
                      )
                    )
                  )
                )
              );
            });
          })() :
          React.createElement('div', { 
            className: 'text-center py-8 text-gray-500'
          }, 
            React.createElement('div', { className: 'text-4xl mb-2' }, '📊'),
            React.createElement('p', null, 'No marketing data available'),
            React.createElement('p', { className: 'text-sm' }, 'Try adjusting your filters')
          )
      ),
      
      // Total summary card
      totals && totals.totalLeads > 0 && React.createElement('div', { 
        className: 'mobile-card p-4 mt-4 bg-gray-100 dark:bg-gray-800'
      },
        React.createElement('h4', { 
          className: 'font-bold text-gray-900 dark:text-white mb-3'
        }, 'TOTAL'),
        React.createElement('div', { className: 'grid grid-cols-2 gap-2 text-xs' },
          React.createElement('div', null,
            React.createElement('span', { className: 'text-gray-600 block' }, 'Total Leads'),
            React.createElement('span', { className: 'font-bold text-lg' }, 
              totals.totalLeads || 0
            )
          ),
          React.createElement('div', null,
            React.createElement('span', { className: 'text-gray-600 block' }, 'Qualified'),
            React.createElement('span', { className: 'font-bold text-lg text-green-600' }, 
              `${totals.qualified || 0} (${totals.totalQualifiedPercent || 0}%)`
            )
          ),
          React.createElement('div', null,
            React.createElement('span', { className: 'text-gray-600 block' }, 'Converted'),
            React.createElement('span', { className: 'font-bold text-lg text-blue-600' }, 
              `${totals.converted || 0} (${totals.totalConvertedPercent || 0}%)`
            )
          ),
          React.createElement('div', null,
            React.createElement('span', { className: 'text-gray-600 block' }, 'Avg CPL'),
            React.createElement('span', { className: 'font-bold text-lg' }, 
              totals.totalCPL ? `₹${parseFloat(totals.totalCPL).toFixed(0)}` : '₹0'
            )
          )
        )
      )
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

// Mobile My Actions View with Card Design
window.MobileMyActionsView = function() {
  const state = window.appState;
  const { 
    myLeads = [], 
    myQuoteRequested = [], 
    myOrders = [], 
    myDeliveries = [], 
    myReceivables = [],
    loading 
  } = state;
  
  const [activeSection, setActiveSection] = React.useState('leads');
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Load My Actions data on mount
  React.useEffect(() => {
    if (window.fetchMyActions && !window.myActionsDataLoaded) {
      window.myActionsDataLoaded = true;
      window.fetchMyActions();
    }
  }, []);
  
  // Clear search when switching tabs to prevent confusion
  React.useEffect(() => {
    setSearchQuery('');
  }, [activeSection]);
  
  // Filter data based on search
  const filterData = (data) => {
    if (!searchQuery) return data;
    const search = searchQuery.toLowerCase();
    return data.filter(item => {
      const searchableText = [
        item.name,
        item.client_name,
        item.lead_name,
        item.email,
        item.event_name,
        item.order_number,
        item.delivery_number
      ].filter(Boolean).join(' ').toLowerCase();
      return searchableText.includes(search);
    });
  };
  
  // Get section data with proper filtering
  const getSectionData = (sectionId) => {
    const dataMap = {
      'leads': myLeads,
      'quotes': myQuoteRequested,
      'orders': myOrders,
      'deliveries': myDeliveries,
      'receivables': myReceivables
    };
    return filterData(dataMap[sectionId] || []);
  };
  
  const currentData = getSectionData(activeSection);
  
  // Get count for each section independently
  const getSectionCount = (sectionId) => {
    const dataMap = {
      'leads': myLeads,
      'quotes': myQuoteRequested,
      'orders': myOrders,
      'deliveries': myDeliveries,
      'receivables': myReceivables
    };
    return (dataMap[sectionId] || []).length;
  };
  
  // Section configuration
  const sections = [
    { id: 'leads', label: 'Leads', icon: '👥', color: 'blue' },
    { id: 'quotes', label: 'Quotes', icon: '📋', color: 'purple' },
    { id: 'orders', label: 'Orders', icon: '📦', color: 'green' },
    { id: 'deliveries', label: 'Deliveries', icon: '🚚', color: 'orange' },
    { id: 'receivables', label: 'Receivables', icon: '💰', color: 'yellow' }
  ];
  
  if (loading) {
    return React.createElement(window.MobileLoadingState || 'div', null, 'Loading my actions...');
  }
  
  return React.createElement('div', { className: 'mobile-content-wrapper' },
    // Header
    React.createElement('div', { 
      className: 'sticky top-0 bg-white dark:bg-gray-900 z-10 pb-3 border-b'
    },
      React.createElement('h2', { 
        className: 'text-lg font-semibold mb-3 px-4'
      }, 'My Actions'),
      
      // Search bar
      React.createElement('div', { className: 'px-4 mb-3' },
        React.createElement('div', { className: 'relative' },
          React.createElement('input', {
            type: 'text',
            placeholder: 'Search across all actions...',
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            className: 'w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm'
          }),
          React.createElement('span', { 
            className: 'absolute left-3 top-2.5 text-gray-400'
          }, '🔍')
        )
      ),
      
      // Section tabs
      React.createElement('div', { className: 'flex overflow-x-auto no-scrollbar px-4 gap-2' },
        sections.map(section => {
          // Define color classes based on section
          const activeColors = {
            'leads': 'bg-blue-600 text-white',
            'quotes': 'bg-purple-600 text-white',
            'orders': 'bg-green-600 text-white',
            'deliveries': 'bg-orange-600 text-white',
            'receivables': 'bg-yellow-600 text-white'
          };
          
          return React.createElement('button', {
            key: section.id,
            onClick: () => setActiveSection(section.id),
            className: `px-3 py-1.5 text-xs rounded-full whitespace-nowrap flex items-center gap-1 ${
              activeSection === section.id 
                ? activeColors[section.id] 
                : 'bg-gray-100 text-gray-700'
            }`
          }, 
            React.createElement('span', null, section.icon),
            section.label,
            React.createElement('span', { 
              className: `ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                activeSection === section.id 
                  ? 'bg-white/20' 
                  : 'bg-gray-200'
              }`
            }, getSectionCount(section.id))
          );
        })
      )
    ),
    
    // Content - with key to force re-render on tab change
    React.createElement('div', { className: 'p-4', key: activeSection },
      currentData.length > 0 ?
        React.createElement('div', { className: 'space-y-4' },
          currentData.map((item, index) => {
            // Render different cards based on section
            if (activeSection === 'leads') {
              return React.createElement('div', {
                key: item.id || index,
                className: 'bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 transform transition-all duration-200 hover:scale-[1.02] hover:shadow-xl border border-gray-100 dark:border-gray-700',
                style: {
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                },
                onClick: () => window.openLeadDetail && window.openLeadDetail(item)
              },
                React.createElement('div', { className: 'flex justify-between items-start mb-3' },
                  React.createElement('div', null,
                    React.createElement('div', { className: 'font-bold text-gray-900' },
                      item.name || 'Unknown Lead'
                    ),
                    React.createElement('div', { className: 'text-xs text-gray-500' },
                      item.email || item.phone
                    )
                  ),
                  React.createElement('div', { 
                    className: `px-2 py-1 rounded-full text-xs font-medium ${
                      item.temperature === 'hot' ? 'bg-red-100 text-red-800' :
                      item.temperature === 'warm' ? 'bg-orange-100 text-orange-800' :
                      item.temperature === 'cold' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`
                  }, item.temperature || 'New')
                ),
                React.createElement('div', { className: 'space-y-1 text-sm' },
                  item.event_name && React.createElement('div', { className: 'flex items-center gap-2' },
                    React.createElement('span', { className: 'text-gray-500' }, '🎪'),
                    item.event_name
                  ),
                  item.business_type && React.createElement('div', { className: 'flex items-center gap-2' },
                    React.createElement('span', { className: 'text-gray-500' }, '🏢'),
                    item.business_type
                  ),
                  React.createElement('div', { className: 'flex items-center gap-2' },
                    React.createElement('span', { className: 'text-gray-500' }, '📅'),
                    new Date(item.date_of_enquiry || item.created_at).toLocaleDateString()
                  )
                ),
                // Action buttons for leads
                React.createElement('div', { className: 'flex gap-2 mt-3' },
                  React.createElement('button', {
                    className: 'flex-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors',
                    onClick: (e) => {
                      e.stopPropagation();
                      if (window.openLeadEditForm) {
                        window.openLeadEditForm(item);
                      }
                    }
                  }, '✏️ '),
                  React.createElement('button', {
                    className: 'flex-1 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors',
                    onClick: (e) => {
                      e.stopPropagation();
                      if (window.convertLeadToOrder) {
                        window.convertLeadToOrder(item);
                      }
                    }
                  }, '📦 '),
                  React.createElement('button', {
                    className: 'flex-1 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors',
                    onClick: (e) => {
                      e.stopPropagation();
                      if (window.setCurrentLead && window.setShowChoiceModal) {
                        window.setCurrentLead(item);
                        window.setShowChoiceModal(true);
                      }
                    }
                  }, '🎯 ')
                )
              );
            } else if (activeSection === 'quotes') {
              return React.createElement('div', {
                key: item.id || index,
                className: 'bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 transform transition-all duration-200 hover:scale-[1.02] hover:shadow-xl border border-gray-100 dark:border-gray-700',
                style: {
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }
              },
                React.createElement('div', { className: 'flex justify-between items-start mb-3' },
                  React.createElement('div', null,
                    React.createElement('div', { className: 'font-bold text-gray-900' },
                      item.client_name || item.lead_name || 'Unknown Client'
                    ),
                    React.createElement('div', { className: 'text-xs text-gray-500' },
                      'Quote #', item.id
                    )
                  ),
                  React.createElement('div', { 
                    className: 'px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800'
                  }, 'Pending')
                ),
                React.createElement('div', { className: 'space-y-1 text-sm' },
                  item.event_name && React.createElement('div', { className: 'flex items-center gap-2' },
                    React.createElement('span', { className: 'text-gray-500' }, '🎪'),
                    item.event_name
                  ),
                  React.createElement('div', { className: 'flex items-center gap-2' },
                    React.createElement('span', { className: 'text-gray-500' }, '🎫'),
                    item.quantity || 0, ' tickets'
                  ),
                  React.createElement('div', { className: 'flex items-center gap-2' },
                    React.createElement('span', { className: 'text-gray-500' }, '💰'),
                    window.formatCurrency(item.amount || 0)
                  )
                ),
                React.createElement('button', {
                  className: 'mt-3 w-full px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors',
                  onClick: (e) => {
                    e.stopPropagation();
                    if (window.openQuoteUploadModal) {
                      window.openQuoteUploadModal(item);
                    }
                  }
                }, '📤 ')
              );
            } else if (activeSection === 'orders') {
              return React.createElement('div', {
                key: item.id || index,
                className: 'bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 transform transition-all duration-200 hover:scale-[1.02] hover:shadow-xl border border-gray-100 dark:border-gray-700',
                style: {
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                },
                onClick: () => window.openOrderDetail && window.openOrderDetail(item)
              },
                React.createElement('div', { className: 'flex justify-between items-start mb-3' },
                  React.createElement('div', null,
                    React.createElement('div', { className: 'font-bold text-gray-900' },
                      item.order_number || `Order #${item.id}`
                    ),
                    React.createElement('div', { className: 'text-xs text-gray-500' },
                      item.client_name || 'Unknown Client'
                    )
                  ),
                  React.createElement('div', { 
                    className: `px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                      item.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`
                  }, item.status === 'pending_approval' ? 'Pending' : item.status)
                ),
                React.createElement('div', { className: 'space-y-1 text-sm' },
                  item.event_name && React.createElement('div', { className: 'flex items-center gap-2' },
                    React.createElement('span', { className: 'text-gray-500' }, '🎪'),
                    item.event_name
                  ),
                  React.createElement('div', { className: 'flex items-center gap-2' },
                    React.createElement('span', { className: 'text-gray-500' }, '🎫'),
                    item.tickets_allocated || item.quantity || 0, ' tickets'
                  ),
                  React.createElement('div', { className: 'flex items-center gap-2' },
                    React.createElement('span', { className: 'text-gray-500' }, '💰'),
                    window.formatCurrency(item.final_amount || item.total_amount || 0)
                  )
                ),
                // Action buttons for orders
                React.createElement('div', { className: 'flex gap-2 mt-3 flex-wrap' },
                  window.hasPermission('orders', 'write') && React.createElement('button', {
                    className: 'px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors',
                    onClick: (e) => {
                      e.stopPropagation();
                      if (window.openEditOrderForm) {
                        window.openEditOrderForm(item);
                      } else if (window.openOrderEdit) {
                        window.openOrderEdit(item);
                      } else {
                        console.error('No order edit function available');
                      }
                    }
                  }, '✏️ '),
                  window.hasPermission('orders', 'invoice') && React.createElement('button', {
                    className: 'px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors',
                    onClick: (e) => {
                      e.stopPropagation();
                      if (window.handleInvoiceClick) {
                        window.handleInvoiceClick(item);
                      } else if (window.openInvoicePreviewDirectly) {
                        window.openInvoicePreviewDirectly(item);
                      } else if (window.handleGenerateInvoice) {
                        window.handleGenerateInvoice(item);
                      } else {
                        console.error('No invoice function available');
                      }
                    }
                  }, '📄 '),
                  window.hasPermission('orders', 'approve') && item.status === 'pending_approval' && React.createElement('button', {
                    className: 'px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors',
                    onClick: (e) => {
                      e.stopPropagation();
                      if (window.handleOrderApproval) {
                        window.handleOrderApproval(item.id, 'approve');
                      }
                    }
                  }, '✓ '),
                  window.hasPermission('orders', 'write') && window.JourneyGenerator && React.createElement('button', {
                    className: 'px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors',
                    onClick: (e) => {
                      e.stopPropagation();
                      console.log('Journey button clicked for order:', item.id);
                      
                      // Remove any existing modal
                      const existing = document.getElementById('journey-modal-container');
                      if (existing) existing.remove();
                      
                      // Create new modal
                      const div = document.createElement('div');
                      div.id = 'journey-modal-container';
                      document.body.appendChild(div);
                      
                      ReactDOM.render(
                        React.createElement(window.JourneyGenerator, {
                          order: item,
                          onClose: () => {
                            ReactDOM.unmountComponentAtNode(div);
                            div.remove();
                          }
                        }),
                        div
                      );
                    }
                  }, '✨')
                )
              );
            } else if (activeSection === 'deliveries') {
              return React.createElement('div', {
                key: item.id || index,
                className: 'bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 transform transition-all duration-200 hover:scale-[1.02] hover:shadow-xl border border-gray-100 dark:border-gray-700',
                style: {
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                },
                onClick: () => window.openDeliveryDetail && window.openDeliveryDetail(item)
              },
                React.createElement('div', { className: 'flex justify-between items-start mb-3' },
                  React.createElement('div', null,
                    React.createElement('div', { className: 'font-bold text-gray-900' },
                      item.delivery_number || `Delivery #${item.id}`
                    ),
                    React.createElement('div', { className: 'text-xs text-gray-500' },
                      item.client_name || 'Unknown Client'
                    )
                  ),
                  React.createElement('div', { 
                    className: `px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      item.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`
                  }, item.status || 'Pending')
                ),
                React.createElement('div', { className: 'space-y-1 text-sm' },
                  item.order_number && React.createElement('div', { className: 'flex items-center gap-2' },
                    React.createElement('span', { className: 'text-gray-500' }, '📋'),
                    'Order: ', item.order_number
                  ),
                  item.delivery_date && React.createElement('div', { className: 'flex items-center gap-2' },
                    React.createElement('span', { className: 'text-gray-500' }, '📅'),
                    'Scheduled: ', new Date(item.delivery_date).toLocaleDateString()
                  ),
                  React.createElement('div', { className: 'flex items-center gap-2' },
                    React.createElement('span', { className: 'text-gray-500' }, '📦'),
                    item.tickets_count || 0, ' tickets'
                  )
                ),
                // Action buttons for deliveries
                React.createElement('div', { className: 'flex gap-2 mt-3 flex-wrap' },
                  // View button
                  React.createElement('button', {
                    className: 'px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors',
                    onClick: (e) => {
                      e.stopPropagation();
                      if (window.openDeliveryDetail) {
                        window.openDeliveryDetail(item);
                      }
                    }
                  }, '👁️ '),
                  
                  // Start Transit button
                  item.status === 'scheduled' && window.hasPermission('delivery', 'write') &&
                  React.createElement('button', {
                    className: 'px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors',
                    onClick: (e) => {
                      e.stopPropagation();
                      if (window.updateDeliveryStatus) {
                        window.updateDeliveryStatus(item.id, 'in_transit');
                      }
                    }
                  }, '🚚 '),
                  
                  // Mark Delivered button
                  item.status === 'in_transit' && window.hasPermission('delivery', 'write') &&
                  React.createElement('button', {
                    className: 'px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors',
                    onClick: (e) => {
                      e.stopPropagation();
                      if (window.updateDeliveryStatus) {
                        window.updateDeliveryStatus(item.id, 'delivered');
                      }
                    }
                  }, '✅ '),
                  
                  // Mark Failed button
                  item.status === 'in_transit' && window.hasPermission('delivery', 'write') &&
                  React.createElement('button', {
                    className: 'px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors',
                    onClick: (e) => {
                      e.stopPropagation();
                      if (window.updateDeliveryStatus) {
                        window.updateDeliveryStatus(item.id, 'failed');
                      }
                    }
                  }, '❌ '),
                  
                  // Retry Delivery button
                  item.status === 'failed' && window.hasPermission('delivery', 'write') &&
                  React.createElement('button', {
                    className: 'px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors',
                    onClick: (e) => {
                      e.stopPropagation();
                      if (window.updateDeliveryStatus) {
                        window.updateDeliveryStatus(item.id, 'scheduled');
                      }
                    }
                  }, '🔄 '),
                  
                  // Update Status button (always available)
                  window.hasPermission('delivery', 'write') &&
                  React.createElement('button', {
                    className: 'px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors',
                    onClick: (e) => {
                      e.stopPropagation();
                      if (window.updateDeliveryStatus) {
                        window.updateDeliveryStatus(item.id);
                      }
                    }
                  }, '📝 ')
                )
              );
            } else if (activeSection === 'receivables') {
              return React.createElement('div', {
                key: item.id || index,
                className: 'bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 transform transition-all duration-200 hover:scale-[1.02] hover:shadow-xl border border-gray-100 dark:border-gray-700',
                style: {
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }
              },
                React.createElement('div', { className: 'flex justify-between items-start mb-3' },
                  React.createElement('div', null,
                    React.createElement('div', { className: 'font-bold text-gray-900' },
                      item.invoice_number || `Invoice #${item.id}`
                    ),
                    React.createElement('div', { className: 'text-xs text-gray-500' },
                      item.client_name || 'Unknown Client'
                    )
                  ),
                  React.createElement('div', { 
                    className: `px-2 py-1 rounded-full text-xs font-medium ${
                      new Date(item.due_date) < new Date() ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`
                  }, new Date(item.due_date) < new Date() ? 'Overdue' : 'Pending')
                ),
                React.createElement('div', { className: 'space-y-1 text-sm' },
                  React.createElement('div', { className: 'flex items-center gap-2' },
                    React.createElement('span', { className: 'text-gray-500' }, '💰'),
                    'Balance: ', window.formatCurrency(item.balance_amount || item.amount || 0)
                  ),
                  React.createElement('div', { className: 'flex items-center gap-2' },
                    React.createElement('span', { className: 'text-gray-500' }, '📅'),
                    'Due: ', new Date(item.due_date).toLocaleDateString()
                  ),
                  item.order_number && React.createElement('div', { className: 'flex items-center gap-2' },
                    React.createElement('span', { className: 'text-gray-500' }, '📋'),
                    'Order: ', item.order_number
                  )
                ),
                // Action buttons for receivables
                React.createElement('div', { className: 'flex gap-2 mt-3 flex-wrap' },
                  // View Invoice button
                  React.createElement('button', {
                    className: 'px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors',
                    onClick: (e) => {
                      e.stopPropagation();
                      if (window.openInvoicePreview) {
                        window.openInvoicePreview(item);
                      }
                    }
                  }, '📄 View '),
                  
                  // Mark as Paid button
                  window.hasPermission('finance', 'write') &&
                  React.createElement('button', {
                    className: 'px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors',
                    onClick: (e) => {
                      e.stopPropagation();
                      if (window.handleMarkAsPaid) {
                        window.handleMarkAsPaid(item.id);
                      } else if (window.markAsPaid) {
                        window.markAsPaid(item.id);
                      }
                    }
                  }, '✅ '),
                  
                  // Send Reminder button
                  window.hasPermission('finance', 'write') &&
                  React.createElement('button', {
                    className: 'px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors',
                    onClick: (e) => {
                      e.stopPropagation();
                      if (window.sendPaymentReminder) {
                        window.sendPaymentReminder(item);
                      }
                    }
                  }, '📧 '),
                  
                  // Download Invoice button
                  React.createElement('button', {
                    className: 'px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors',
                    onClick: (e) => {
                      e.stopPropagation();
                      if (window.downloadInvoice) {
                        window.downloadInvoice(item.invoice_id || item.id);
                      }
                    }
                  }, '⬇️ '),
                  
                  // Record Partial Payment button
                  window.hasPermission('finance', 'write') &&
                  React.createElement('button', {
                    className: 'px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors',
                    onClick: (e) => {
                      e.stopPropagation();
                      if (window.recordPartialPayment) {
                        window.recordPartialPayment(item);
                      }
                    }
                  }, '💳 ')
                )
              );
            }
          })
        ) :
        React.createElement(window.MobileEmptyState || 'div', {
          icon: sections.find(s => s.id === activeSection)?.icon || '📋',
          title: `No ${sections.find(s => s.id === activeSection)?.label.toLowerCase()} found`,
          message: searchQuery ? 'Try adjusting your search' : 'Items assigned to you will appear here'
        })
    )
  );
};

console.log('✅ Mobile Views components loaded');