// Enhanced Orders Component for FanToPark CRM with Search Filters and Pagination
// Fixed version - Follows project pattern by extracting state from window.appState
// No React hooks in content rendering function

// ===== ENHANCED: Orders state management (stored in window for persistence) =====
window.ordersFilters = window.ordersFilters || {
  searchQuery: '',
  statusFilter: 'all',
  assignedToFilter: 'all',
  eventFilter: 'all',
  dateFromFilter: '',
  dateToFilter: '',
  clientFilter: '',
  orderNumberFilter: '',
  paymentStatusFilter: 'all'
};

window.ordersPagination = window.ordersPagination || {
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 0,
  totalPages: 0
};

window.ordersSorting = window.ordersSorting || {
  sortField: 'created_date',
  sortDirection: 'desc'
};

// ===== ENHANCED: Orders Content Function - Fixed to follow project pattern =====
window.renderOrdersContent = () => {
  // ✅ PATTERN 1: Extract state from window.appState (NO React hooks)
  const {
    orders = window.orders || [],
    loading = window.loading || false,
    showOrderForm = window.appState?.showOrderForm || false,
    showOrderDetail = window.appState?.showOrderDetail || false,
    currentOrder = window.appState?.currentOrder || null
  } = window.appState || {};

  // ✅ PATTERN 2: Extract filters and pagination from window globals
  const filters = window.ordersFilters;
  const pagination = window.ordersPagination;
  const sorting = window.ordersSorting;
  const showFilters = window.ordersShowFilters || false;

  // ✅ PATTERN 3: Function references with fallbacks
  const setOrdersFilters = window.setOrdersFilters || ((newFilters) => {
    window.ordersFilters = { ...window.ordersFilters, ...newFilters };
    window.forceUpdate && window.forceUpdate();
  });

  const setOrdersPagination = window.setOrdersPagination || ((newPagination) => {
    window.ordersPagination = { ...window.ordersPagination, ...newPagination };
    window.forceUpdate && window.forceUpdate();
  });

  const setOrdersSorting = window.setOrdersSorting || ((newSorting) => {
    window.ordersSorting = { ...window.ordersSorting, ...newSorting };
    window.forceUpdate && window.forceUpdate();
  });

  const setOrdersShowFilters = window.setOrdersShowFilters || ((show) => {
    window.ordersShowFilters = show;
    window.forceUpdate && window.forceUpdate();
  });

  const hasPermission = window.hasPermission || (() => false);
  const openOrderDetail = window.openOrderDetail || (() => console.warn("openOrderDetail not implemented"));
  const approveOrder = window.approveOrder || (() => console.warn("approveOrder not implemented"));
  const openEditOrderForm = window.openEditOrderForm || (() => console.warn("openEditOrderForm not implemented"));
  const deleteOrder = window.deleteOrder || (() => console.warn("deleteOrder not implemented"));

  // ===== ENHANCED: Filter and sort orders function =====
  const getFilteredAndSortedOrders = () => {
    let filteredOrders = [...(orders || [])];

    // Apply filters
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filteredOrders = filteredOrders.filter(order =>
        (order.customer_name && order.customer_name.toLowerCase().includes(query)) ||
        (order.customer_phone && order.customer_phone.includes(query)) ||
        (order.order_number && order.order_number.toLowerCase().includes(query)) ||
        (order.event_name && order.event_name.toLowerCase().includes(query))
      );
    }

    if (filters.statusFilter !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.status === filters.statusFilter);
    }

    if (filters.assignedToFilter !== 'all') {
      if (filters.assignedToFilter === 'unassigned') {
        filteredOrders = filteredOrders.filter(order => !order.assigned_to);
      } else {
        filteredOrders = filteredOrders.filter(order => order.assigned_to === filters.assignedToFilter);
      }
    }

    if (filters.eventFilter !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.event_name === filters.eventFilter);
    }

    if (filters.paymentStatusFilter !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.payment_status === filters.paymentStatusFilter);
    }

    if (filters.dateFromFilter) {
      filteredOrders = filteredOrders.filter(order => 
        new Date(order.created_date) >= new Date(filters.dateFromFilter)
      );
    }

    if (filters.dateToFilter) {
      filteredOrders = filteredOrders.filter(order => 
        new Date(order.created_date) <= new Date(filters.dateToFilter)
      );
    }

    if (filters.clientFilter) {
      const clientQuery = filters.clientFilter.toLowerCase();
      filteredOrders = filteredOrders.filter(order =>
        (order.customer_name && order.customer_name.toLowerCase().includes(clientQuery)) ||
        (order.customer_phone && order.customer_phone.includes(clientQuery))
      );
    }

    if (filters.orderNumberFilter) {
      const orderQuery = filters.orderNumberFilter.toLowerCase();
      filteredOrders = filteredOrders.filter(order =>
        order.order_number && order.order_number.toLowerCase().includes(orderQuery)
      );
    }

    // Apply sorting
    filteredOrders.sort((a, b) => {
      let aValue = a[sorting.sortField];
      let bValue = b[sorting.sortField];

      // Handle different data types
      if (sorting.sortField === 'created_date' || sorting.sortField === 'updated_date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue && bValue.toLowerCase();
      }

      if (sorting.sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Update pagination
    const totalItems = filteredOrders.length;
    const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    // Update pagination state
    if (pagination.totalItems !== totalItems || pagination.totalPages !== totalPages) {
      setOrdersPagination({ totalItems, totalPages });
    }

    return paginatedOrders;
  };

  const filteredOrders = getFilteredAndSortedOrders();

  // ===== ENHANCED: Event handlers =====
  const handleFilterChange = (filterName, value) => {
    setOrdersFilters({ [filterName]: value });
    setOrdersPagination({ currentPage: 1 }); // Reset to first page
  };

  const handleSortChange = (field) => {
    const newDirection = sorting.sortField === field && sorting.sortDirection === 'asc' ? 'desc' : 'asc';
    setOrdersSorting({ sortField: field, sortDirection: newDirection });
  };

  const handlePageChange = (page) => {
    setOrdersPagination({ currentPage: page });
  };

  // Get unique values for filter dropdowns
  const uniqueStatuses = [...new Set(orders.map(order => order.status))];
  const uniqueAssignees = [...new Set(orders.map(order => order.assigned_to).filter(Boolean))];
  const uniqueEvents = [...new Set(orders.map(order => order.event_name).filter(Boolean))];
  const uniquePaymentStatuses = [...new Set(orders.map(order => order.payment_status))];

  // ===== RENDER: Main orders content =====
  return React.createElement('div', { className: 'space-y-6' },
    // Header with title and controls
    React.createElement('div', { className: 'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4' },
      React.createElement('div', null,
        React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' }, 'Orders Management'),
        React.createElement('p', { className: 'text-sm text-gray-600 dark:text-gray-400 mt-1' },
          `${pagination.totalItems || orders.length} total orders`
        )
      ),
      React.createElement('div', { className: 'flex gap-2' },
        React.createElement('button', {
          onClick: () => setOrdersShowFilters(!showFilters),
          className: `px-4 py-2 rounded-md border ${showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700'} hover:bg-blue-50`
        }, showFilters ? '🔽 Hide Filters' : '🔍 Show Filters'),
        hasPermission('orders', 'write') && React.createElement('button', {
          onClick: () => window.setShowOrderForm && window.setShowOrderForm(true),
          className: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
        }, '📝 New Order')
      )
    ),

    // Enhanced filters panel
    showFilters && React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow border p-6' },
      React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, '🔍 Advanced Filters'),
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' },
        // Search query
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Search'),
          React.createElement('input', {
            type: 'text',
            value: filters.searchQuery,
            onChange: (e) => handleFilterChange('searchQuery', e.target.value),
            placeholder: 'Customer, phone, order #, event...',
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
          })
        ),

        // Status filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Status'),
          React.createElement('select', {
            value: filters.statusFilter,
            onChange: (e) => handleFilterChange('statusFilter', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
          },
            React.createElement('option', { value: 'all' }, 'All Statuses'),
            uniqueStatuses.map(status =>
              React.createElement('option', { key: status, value: status }, status)
            )
          )
        ),

        // Assigned to filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Assigned To'),
          React.createElement('select', {
            value: filters.assignedToFilter,
            onChange: (e) => handleFilterChange('assignedToFilter', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
          },
            React.createElement('option', { value: 'all' }, 'All Assignees'),
            React.createElement('option', { value: 'unassigned' }, 'Unassigned'),
            uniqueAssignees.map(assignee =>
              React.createElement('option', { key: assignee, value: assignee }, 
                assignee.split('@')[0]
              )
            )
          )
        ),

        // Event filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Event'),
          React.createElement('select', {
            value: filters.eventFilter,
            onChange: (e) => handleFilterChange('eventFilter', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
          },
            React.createElement('option', { value: 'all' }, 'All Events'),
            uniqueEvents.map(event =>
              React.createElement('option', { key: event, value: event }, event)
            )
          )
        ),

        // Payment status filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Payment Status'),
          React.createElement('select', {
            value: filters.paymentStatusFilter,
            onChange: (e) => handleFilterChange('paymentStatusFilter', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
          },
            React.createElement('option', { value: 'all' }, 'All Payment Statuses'),
            uniquePaymentStatuses.map(status =>
              React.createElement('option', { key: status, value: status }, 
                status.charAt(0).toUpperCase() + status.slice(1)
              )
            )
          )
        ),

        // Date from filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Date From'),
          React.createElement('input', {
            type: 'date',
            value: filters.dateFromFilter,
            onChange: (e) => handleFilterChange('dateFromFilter', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
          })
        ),

        // Date to filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Date To'),
          React.createElement('input', {
            type: 'date',
            value: filters.dateToFilter,
            onChange: (e) => handleFilterChange('dateToFilter', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
          })
        ),

        // Order number filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Order Number'),
          React.createElement('input', {
            type: 'text',
            value: filters.orderNumberFilter,
            onChange: (e) => handleFilterChange('orderNumberFilter', e.target.value),
            placeholder: 'Search by order number...',
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
          })
        )
      ),

      // Clear filters button
      React.createElement('div', { className: 'mt-4 flex justify-end' },
        React.createElement('button', {
          onClick: () => {
            setOrdersFilters({
              searchQuery: '',
              statusFilter: 'all',
              assignedToFilter: 'all',
              eventFilter: 'all',
              dateFromFilter: '',
              dateToFilter: '',
              clientFilter: '',
              orderNumberFilter: '',
              paymentStatusFilter: 'all'
            });
            setOrdersPagination({ currentPage: 1 });
          },
          className: 'px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600'
        }, '🔄 Clear All Filters')
      )
    ),

    // Orders table
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow border overflow-hidden' },
      loading ? React.createElement('div', { className: 'text-center py-12' },
        React.createElement('div', { className: 'text-gray-500' }, 'Loading orders...')
      ) : React.createElement('div', { className: 'overflow-x-auto' },
        React.createElement('table', { className: 'w-full divide-y divide-gray-200 dark:divide-gray-700' },
          React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-900' },
            React.createElement('tr', null,
              ['order_number', 'customer_name', 'event_name', 'total_amount', 'status', 'payment_status', 'assigned_to'].map(field =>
                React.createElement('th', {
                  key: field,
                  className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100',
                  onClick: () => handleSortChange(field)
                },
                  React.createElement('div', { className: 'flex items-center space-x-1' },
                    React.createElement('span', null, field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())),
                    sorting.sortField === field && React.createElement('span', { className: 'text-blue-500' },
                      sorting.sortDirection === 'asc' ? '↑' : '↓'
                    )
                  )
                )
              ),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Actions')
            )
          ),
          React.createElement('tbody', { className: 'bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700' },
            filteredOrders.length > 0 ? filteredOrders.map(order => {
              return React.createElement('tr', { key: order.id, className: 'hover:bg-gray-50 dark:hover:bg-gray-700' },
                React.createElement('td', { className: 'px-6 py-4 text-sm font-medium text-gray-900 dark:text-white' },
                  order.order_number || `ORD-${order.id}`
                ),
                React.createElement('td', { className: 'px-6 py-4 text-sm text-gray-900 dark:text-gray-300' },
                  React.createElement('div', null,
                    React.createElement('div', { className: 'font-medium' }, order.customer_name || 'N/A'),
                    React.createElement('div', { className: 'text-xs text-gray-500' }, order.customer_phone || '')
                  )
                ),
                React.createElement('td', { className: 'px-6 py-4 text-sm text-gray-900 dark:text-gray-300' },
                  order.event_name || 'N/A'
                ),
                React.createElement('td', { className: 'px-6 py-4 text-sm text-gray-900 dark:text-gray-300' },
                  order.total_amount ? `₹${parseFloat(order.total_amount).toLocaleString()}` : 'N/A'
                ),
                React.createElement('td', { className: 'px-6 py-4' },
                  React.createElement('span', {
                    className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`
                  }, order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown')
                ),
                React.createElement('td', { className: 'px-6 py-4' },
                  React.createElement('span', {
                    className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                      order.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                      order.payment_status === 'refunded' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`
                  }, order.payment_status === 'paid' ? 'Paid' : 
                       order.payment_status === 'partial' ? 'Partial' :
                       order.payment_status === 'refunded' ? 'Refunded' : 'Pending')
                ),
                React.createElement('td', { className: 'px-6 py-4 text-sm text-gray-900 dark:text-gray-300' },
                  order.assigned_to ? order.assigned_to.split('@')[0] : 'Unassigned'
                ),
                React.createElement('td', { className: 'px-6 py-4 text-sm font-medium' },
                  React.createElement('div', { className: 'flex space-x-2' },
                    React.createElement('button', {
                      onClick: () => openOrderDetail(order),
                      className: 'text-blue-600 hover:text-blue-900'
                    }, '👁️ View'),
                    hasPermission('orders', 'approve') && order.status === 'pending_approval' && 
                    React.createElement('button', {
                      onClick: () => approveOrder(order.id),
                      className: 'text-green-600 hover:text-green-900'
                    }, '✅ Approve'),
                    hasPermission('orders', 'write') && 
                    React.createElement('button', {
                      onClick: () => openEditOrderForm(order),
                      className: 'text-yellow-600 hover:text-yellow-900'
                    }, '✏️ Edit'),
                    hasPermission('orders', 'write') && 
                    React.createElement('button', {
                      onClick: () => deleteOrder(order.id),
                      className: 'text-red-600 hover:text-red-900'
                    }, '🗑️ Delete')
                  )
                )
              );
            }) : React.createElement('tr', null,
              React.createElement('td', { 
                colSpan: 8, 
                className: 'px-6 py-8 text-center text-gray-500' 
              },
                React.createElement('div', { className: 'space-y-2' },
                  React.createElement('div', { className: 'text-4xl' }, '📋'),
                  React.createElement('div', null, 'No orders found'),
                  React.createElement('div', { className: 'text-sm' }, 
                    filters.searchQuery || filters.statusFilter !== 'all' || filters.clientFilter ?
                    'Try adjusting your filters to see more orders.' :
                    'Orders will appear here when customers place orders.'
                  )
                )
              )
            )
          )
        )
      )
    ),

    // Enhanced pagination
    pagination.totalPages > 1 && React.createElement('div', { className: 'bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 rounded-b-lg' },
      React.createElement('div', { className: 'flex-1 flex justify-between sm:hidden' },
        React.createElement('button', {
          onClick: () => pagination.currentPage > 1 && handlePageChange(pagination.currentPage - 1),
          disabled: pagination.currentPage === 1,
          className: 'relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50'
        }, 'Previous'),
        React.createElement('button', {
          onClick: () => pagination.currentPage < pagination.totalPages && handlePageChange(pagination.currentPage + 1),
          disabled: pagination.currentPage === pagination.totalPages,
          className: 'ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50'
        }, 'Next')
      ),
      React.createElement('div', { className: 'hidden sm:flex-1 sm:flex sm:items-center sm:justify-between' },
        React.createElement('div', null,
          React.createElement('p', { className: 'text-sm text-gray-700 dark:text-gray-300' },
            'Showing ', React.createElement('span', { className: 'font-medium' }, (pagination.currentPage - 1) * pagination.itemsPerPage + 1),
            ' to ', React.createElement('span', { className: 'font-medium' }, Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)),
            ' of ', React.createElement('span', { className: 'font-medium' }, pagination.totalItems),
            ' results'
          )
        ),
        React.createElement('div', null,
          React.createElement('nav', { className: 'relative z-0 inline-flex rounded-md shadow-sm -space-x-px' },
            React.createElement('button', {
              onClick: () => pagination.currentPage > 1 && handlePageChange(pagination.currentPage - 1),
              disabled: pagination.currentPage === 1,
              className: 'relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50'
            }, '‹'),
            Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 7) {
                pageNum = i + 1;
              } else if (pagination.currentPage <= 4) {
                pageNum = i + 1;
              } else if (pagination.currentPage >= pagination.totalPages - 3) {
                pageNum = pagination.totalPages - 6 + i;
              } else {
                pageNum = pagination.currentPage - 3 + i;
              }
              
              return React.createElement('button', {
                key: pageNum,
                onClick: () => handlePageChange(pageNum),
                className: `relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  pageNum === pagination.currentPage
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`
              }, pageNum);
            }),
            React.createElement('button', {
              onClick: () => pagination.currentPage < pagination.totalPages && handlePageChange(pagination.currentPage + 1),
              disabled: pagination.currentPage === pagination.totalPages,
              className: 'relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50'
            }, '›')
          )
        )
      )
    )
  );
};

console.log('✅ ENHANCED: Orders component with search filters and pagination loaded successfully');
