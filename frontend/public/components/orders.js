// Enhanced Orders Component for FanToPark CRM with Search Filters and Pagination
// Extracted from index.html - maintains 100% functionality
// Enhanced with comprehensive filtering and pagination

// ===== ENHANCED: Orders state management =====
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

// ===== ENHANCED: Orders Content Function with Filters and Pagination =====
window.renderOrdersContent = () => {
  const [filters, setFilters] = React.useState(window.ordersFilters);
  const [pagination, setPagination] = React.useState(window.ordersPagination);
  const [sortField, setSortField] = React.useState('created_date');
  const [sortDirection, setSortDirection] = React.useState('desc');
  const [showFilters, setShowFilters] = React.useState(false);

  // Update global state when filters change
  React.useEffect(() => {
    window.ordersFilters = filters;
  }, [filters]);

  React.useEffect(() => {
    window.ordersPagination = pagination;
  }, [pagination]);

  // ===== ENHANCED: Filter and sort orders =====
  const getFilteredAndSortedOrders = React.useCallback(() => {
    let filteredOrders = [...(window.orders || [])];

    // Apply filters
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filteredOrders = filteredOrders.filter(order => 
        (order.client_name || '').toLowerCase().includes(query) ||
        (order.order_number || '').toLowerCase().includes(query) ||
        (order.event_name || '').toLowerCase().includes(query) ||
        (order.client_email || '').toLowerCase().includes(query) ||
        (order.client_phone || '').includes(query)
      );
    }

    if (filters.orderNumberFilter) {
      filteredOrders = filteredOrders.filter(order => 
        (order.order_number || '').toLowerCase().includes(filters.orderNumberFilter.toLowerCase())
      );
    }

    if (filters.clientFilter) {
      filteredOrders = filteredOrders.filter(order => 
        (order.client_name || '').toLowerCase().includes(filters.clientFilter.toLowerCase())
      );
    }

    if (filters.statusFilter !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.status === filters.statusFilter);
    }

    if (filters.paymentStatusFilter !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.payment_status === filters.paymentStatusFilter);
    }

    if (filters.assignedToFilter !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.assigned_to === filters.assignedToFilter);
    }

    if (filters.eventFilter !== 'all') {
      filteredOrders = filteredOrders.filter(order => 
        (order.event_name || '').toLowerCase().includes(filters.eventFilter.toLowerCase())
      );
    }

    if (filters.dateFromFilter) {
      filteredOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.created_date || order.created_at);
        const fromDate = new Date(filters.dateFromFilter);
        return orderDate >= fromDate;
      });
    }

    if (filters.dateToFilter) {
      filteredOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.created_date || order.created_at);
        const toDate = new Date(filters.dateToFilter);
        toDate.setHours(23, 59, 59, 999); // End of day
        return orderDate <= toDate;
      });
    }

    // Apply sorting
    filteredOrders.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'created_date':
          aValue = new Date(a.created_date || a.created_at || 0);
          bValue = new Date(b.created_date || b.created_at || 0);
          break;
        case 'client_name':
          aValue = (a.client_name || '').toLowerCase();
          bValue = (b.client_name || '').toLowerCase();
          break;
        case 'amount':
          aValue = parseFloat(a.final_amount || a.total_amount || 0);
          bValue = parseFloat(b.final_amount || b.total_amount || 0);
          break;
        case 'event_date':
          aValue = new Date(a.event_date || 0);
          bValue = new Date(b.event_date || 0);
          break;
        default:
          aValue = a[sortField] || '';
          bValue = b[sortField] || '';
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filteredOrders;
  }, [window.orders, filters, sortField, sortDirection]);

  // ===== ENHANCED: Pagination logic =====
  const getPaginatedOrders = React.useCallback(() => {
    const filteredOrders = getFilteredAndSortedOrders();
    const totalItems = filteredOrders.length;
    const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
    
    // Update pagination totals
    setPagination(prev => ({
      ...prev,
      totalItems,
      totalPages,
      currentPage: Math.min(prev.currentPage, totalPages || 1)
    }));

    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    
    return filteredOrders.slice(startIndex, endIndex);
  }, [getFilteredAndSortedOrders, pagination.itemsPerPage, pagination.currentPage]);

  const paginatedOrders = getPaginatedOrders();

  // ===== ENHANCED: Filter handlers =====
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({
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
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // ===== ENHANCED: Pagination handlers =====
  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleItemsPerPageChange = (itemsPerPage) => {
    setPagination(prev => ({ 
      ...prev, 
      itemsPerPage, 
      currentPage: 1 
    }));
  };

  // ===== ENHANCED: Get unique filter values =====
  const getUniqueValues = (key) => {
    const values = [...new Set((window.orders || [])
      .map(order => order[key])
      .filter(Boolean))];
    return values.sort();
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return React.createElement('div', { className: 'space-y-6' },
    // ===== ENHANCED: Header with search and actions =====
    React.createElement('div', { className: 'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4' },
      React.createElement('div', null,
        React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' }, 'Order Management'),
        React.createElement('p', { className: 'text-gray-600 dark:text-gray-400 mt-1' }, 
          `${pagination.totalItems} orders found`
        )
      ),
      React.createElement('div', { className: 'flex gap-3' },
        React.createElement('button', {
          onClick: () => setShowFilters(!showFilters),
          className: `px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
            showFilters ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`
        }, 
          React.createElement('span', null, '🔍'),
          'Filters'
        ),
        window.hasPermission && window.hasPermission('orders', 'write') && 
        React.createElement('button', {
          onClick: () => window.setShowOrderForm && window.setShowOrderForm(true),
          className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2'
        }, 
          React.createElement('span', null, '➕'),
          'Manual Order'
        )
      )
    ),

    // ===== ENHANCED: Search and Filter Section =====
    showFilters && React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-6' },
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' },
        // Global search
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, '🔍 Quick Search'),
          React.createElement('input', {
            type: 'text',
            value: filters.searchQuery,
            onChange: (e) => handleFilterChange('searchQuery', e.target.value),
            placeholder: 'Search orders, clients, events...',
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
          })
        ),

        // Order number filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, '📋 Order Number'),
          React.createElement('input', {
            type: 'text',
            value: filters.orderNumberFilter,
            onChange: (e) => handleFilterChange('orderNumberFilter', e.target.value),
            placeholder: 'Filter by order number...',
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
          })
        ),

        // Client filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, '👤 Client Name'),
          React.createElement('input', {
            type: 'text',
            value: filters.clientFilter,
            onChange: (e) => handleFilterChange('clientFilter', e.target.value),
            placeholder: 'Filter by client name...',
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
          })
        ),

        // Status filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, '📊 Order Status'),
          React.createElement('select', {
            value: filters.statusFilter,
            onChange: (e) => handleFilterChange('statusFilter', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
          },
            React.createElement('option', { value: 'all' }, 'All Statuses'),
            React.createElement('option', { value: 'pending_approval' }, 'Pending Approval'),
            React.createElement('option', { value: 'approved' }, 'Approved'),
            React.createElement('option', { value: 'service_assigned' }, 'Service Assigned'),
            React.createElement('option', { value: 'in_progress' }, 'In Progress'),
            React.createElement('option', { value: 'completed' }, 'Completed'),
            React.createElement('option', { value: 'cancelled' }, 'Cancelled'),
            React.createElement('option', { value: 'rejected' }, 'Rejected')
          )
        ),

        // Payment status filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, '💳 Payment Status'),
          React.createElement('select', {
            value: filters.paymentStatusFilter,
            onChange: (e) => handleFilterChange('paymentStatusFilter', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
          },
            React.createElement('option', { value: 'all' }, 'All Payment Status'),
            React.createElement('option', { value: 'pending' }, 'Pending'),
            React.createElement('option', { value: 'paid' }, 'Paid'),
            React.createElement('option', { value: 'partial' }, 'Partial'),
            React.createElement('option', { value: 'refunded' }, 'Refunded')
          )
        ),

        // Assigned to filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, '👨‍💼 Assigned To'),
          React.createElement('select', {
            value: filters.assignedToFilter,
            onChange: (e) => handleFilterChange('assignedToFilter', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
          },
            React.createElement('option', { value: 'all' }, 'All Assignees'),
            ...getUniqueValues('assigned_to').map(assignee =>
              React.createElement('option', { key: assignee, value: assignee }, 
                assignee || 'Unassigned'
              )
            )
          )
        ),

        // Date from filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, '📅 From Date'),
          React.createElement('input', {
            type: 'date',
            value: filters.dateFromFilter,
            onChange: (e) => handleFilterChange('dateFromFilter', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
          })
        ),

        // Date to filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, '📅 To Date'),
          React.createElement('input', {
            type: 'date',
            value: filters.dateToFilter,
            onChange: (e) => handleFilterChange('dateToFilter', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
          })
        )
      ),

      // Filter actions
      React.createElement('div', { className: 'flex justify-between items-center mt-4 pt-4 border-t' },
        React.createElement('div', { className: 'text-sm text-gray-600' },
          `Showing ${paginatedOrders.length} of ${pagination.totalItems} orders`
        ),
        React.createElement('div', { className: 'flex gap-2' },
          React.createElement('button', {
            onClick: clearFilters,
            className: 'px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300'
          }, 'Clear Filters'),
          React.createElement('button', {
            onClick: () => setShowFilters(false),
            className: 'px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700'
          }, 'Hide Filters')
        )
      )
    ),

    // ===== ENHANCED: Orders Table with Sorting =====
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden' },
      // Pagination controls (top)
      React.createElement('div', { className: 'px-6 py-4 border-b border-gray-200 flex justify-between items-center' },
        React.createElement('div', { className: 'flex items-center gap-4' },
          React.createElement('div', { className: 'text-sm text-gray-600' },
            `Page ${pagination.currentPage} of ${pagination.totalPages}`
          ),
          React.createElement('div', { className: 'flex items-center gap-2' },
            React.createElement('label', { className: 'text-sm text-gray-600' }, 'Show:'),
            React.createElement('select', {
              value: pagination.itemsPerPage,
              onChange: (e) => handleItemsPerPageChange(parseInt(e.target.value)),
              className: 'px-2 py-1 border border-gray-300 rounded text-sm'
            },
              React.createElement('option', { value: 5 }, '5'),
              React.createElement('option', { value: 10 }, '10'),
              React.createElement('option', { value: 20 }, '20'),
              React.createElement('option', { value: 50 }, '50'),
              React.createElement('option', { value: 100 }, '100')
            )
          )
        ),
        React.createElement('div', { className: 'flex gap-1' },
          React.createElement('button', {
            onClick: () => handlePageChange(pagination.currentPage - 1),
            disabled: pagination.currentPage === 1,
            className: 'px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300'
          }, '← Previous'),
          React.createElement('button', {
            onClick: () => handlePageChange(pagination.currentPage + 1),
            disabled: pagination.currentPage === pagination.totalPages,
            className: 'px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300'
          }, 'Next →')
        )
      ),

      React.createElement('div', { className: 'overflow-x-auto' },
        React.createElement('table', { className: 'w-full' },
          React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-900' },
            React.createElement('tr', null,
              React.createElement('th', { 
                className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100',
                onClick: () => handleSort('order_number')
              }, 
                React.createElement('div', { className: 'flex items-center gap-1' },
                  'Order#',
                  React.createElement('span', null, getSortIcon('order_number'))
                )
              ),
              React.createElement('th', { 
                className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100',
                onClick: () => handleSort('client_name')
              }, 
                React.createElement('div', { className: 'flex items-center gap-1' },
                  'Client',
                  React.createElement('span', null, getSortIcon('client_name'))
                )
              ),
              React.createElement('th', { 
                className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100',
                onClick: () => handleSort('event_name')
              }, 
                React.createElement('div', { className: 'flex items-center gap-1' },
                  'Event',
                  React.createElement('span', null, getSortIcon('event_name'))
                )
              ),
              window.hasPermission && window.hasPermission('finance', 'read') && React.createElement('th', { 
                className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100',
                onClick: () => handleSort('amount')
              }, 
                React.createElement('div', { className: 'flex items-center gap-1' },
                  'Amount',
                  React.createElement('span', null, getSortIcon('amount'))
                )
              ),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Status'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Payment'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Assigned To'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
            )
          ),
          React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
            paginatedOrders.length > 0 ? paginatedOrders.map(order => {
              const status = window.ORDER_STATUSES && window.ORDER_STATUSES[order.status] || { 
                label: order.status, 
                color: 'bg-gray-100 text-gray-800', 
                next: [] 
              };

              // Handle both old and new order formats
              const orderNumber = order.order_number || order.id || 'N/A';
              const clientName = order.client_name || order.lead_name || 'Unknown Client';
              const clientEmail = order.client_email || order.email || '';
              const clientPhone = order.client_phone || order.phone || '';

              // Enhanced event display for both formats
              const getEventDisplay = (order) => {
                if (order.invoice_items && Array.isArray(order.invoice_items)) {
                  const itemCount = order.invoice_items.length;
                  const firstItem = order.invoice_items[0]?.description || 'Item';
                  return itemCount > 1 ? `${firstItem} (+${itemCount-1} more)` : firstItem;
                } else {
                  return order.event_name || 'No Event';
                }
              };

              // Enhanced amount display
              const getAmountDisplay = (order) => {
                if (order.final_amount) return order.final_amount;
                if (order.total_amount) return order.total_amount;
                if (order.amount) return order.amount;
                if (order.base_amount) return order.base_amount;
                return 0;
              };

              // Enhanced tickets display
              const getTicketDisplay = (order) => {
                if (order.invoice_items && Array.isArray(order.invoice_items)) {
                  const totalQuantity = order.invoice_items.reduce((sum, item) => sum + (item.quantity || 0), 0);
                  return `${totalQuantity} items - ${order.category_of_sale || 'Mixed'}`;
                } else {
                  return `${order.tickets_allocated || 0} tickets - ${order.ticket_category || ""}`;
                }
              };

              return React.createElement('tr', { 
                key: order.id, 
                className: 'hover:bg-gray-50',
                style: order.invoice_items ? { backgroundColor: '#fefbff' } : {}
              },
                React.createElement('td', { className: 'px-6 py-4' },
                  React.createElement('div', { className: 'text-sm font-medium text-gray-900' }, orderNumber),
                  React.createElement('div', { className: 'text-xs text-gray-500' }, 
                    new Date(order.created_date || order.created_at || Date.now()).toLocaleDateString()
                  ),
                  order.invoice_items && React.createElement('div', { className: 'text-xs text-blue-600 font-medium' }, 
                    '✓ Multi-Item'
                  )
                ),
                React.createElement('td', { className: 'px-6 py-4' },
                  React.createElement('div', { className: 'text-sm font-medium text-gray-900' }, clientName),
                  clientEmail && React.createElement('div', { className: 'text-xs text-gray-500' }, clientEmail),
                  clientPhone && React.createElement('div', { className: 'text-xs text-gray-500' }, clientPhone)
                ),
                React.createElement('td', { className: 'px-6 py-4' },
                  React.createElement('div', { className: 'text-sm text-gray-900' }, getEventDisplay(order)),
                  React.createElement('div', { className: 'text-xs text-gray-500' }, getTicketDisplay(order)),
                  order.event_date && React.createElement('div', { className: 'text-xs text-blue-600' }, 
                    new Date(order.event_date).toLocaleDateString()
                  )
                ),
                window.hasPermission && window.hasPermission('finance', 'read') && React.createElement('td', { className: 'px-6 py-4' },
                  React.createElement('div', { className: 'text-sm font-medium text-gray-900' }, 
                    '₹' + getAmountDisplay(order).toLocaleString()
                  ),
                  order.gst_calculation && React.createElement('div', { className: 'text-xs text-green-600' }, 
                    `+GST: ₹${(order.gst_calculation.total || 0).toLocaleString()}`
                  ),
                  order.tcs_calculation && order.tcs_calculation.applicable && React.createElement('div', { className: 'text-xs text-yellow-600' }, 
                    `+TCS: ₹${(order.tcs_calculation.amount || 0).toLocaleString()}`
                  )
                ),
                React.createElement('td', { className: 'px-6 py-4' },
                  React.createElement('span', { 
                    className: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.color}`
                  }, status.label)
                ),
                React.createElement('td', { className: 'px-6 py-4' },
                  React.createElement('span', { 
                    className: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                      order.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                      order.payment_status === 'refunded' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`
                  }, order.payment_status === 'paid' ? 'Paid' : 
                       order.payment_status === 'partial' ? 'Partial' :
                       order.payment_status === 'refunded' ? 'Refunded' : 'Pending')
                ),
                React.createElement('td', { className: 'px-6 py-4 text-sm text-gray-900' },
                  order.assigned_to ? order.assigned_to.split('@')[0] : 'Unassigned'
                ),
                React.createElement('td', { className: 'px-6 py-4 text-sm font-medium' },
                  React.createElement('div', { className: 'flex space-x-2' },
                    React.createElement('button', {
                      onClick: () => window.openOrderDetail && window.openOrderDetail(order),
                      className: 'text-blue-600 hover:text-blue-900'
                    }, '👁️ View'),
                    window.hasPermission && window.hasPermission('orders', 'approve') && order.status === 'pending_approval' && 
                    React.createElement('button', {
                      onClick: () => window.approveOrder && window.approveOrder(order.id),
                      className: 'text-green-600 hover:text-green-900'
                    }, '✅ Approve'),
                    window.hasPermission && window.hasPermission('orders', 'write') && 
                    React.createElement('button', {
                      onClick: () => window.openEditOrderForm && window.openEditOrderForm(order),
                      className: 'text-yellow-600 hover:text-yellow-900'
                    }, '✏️ Edit'),
                    window.hasPermission && window.hasPermission('orders', 'write') && 
                    React.createElement('button', {
                      onClick: () => window.deleteOrder && window.deleteOrder(order.id),
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
                    'Try adjusting your filters' : 'No orders have been created yet'
                  )
                )
              )
            )
          )
        )
      ),

      // Pagination controls (bottom)
      pagination.totalPages > 1 && React.createElement('div', { className: 'px-6 py-4 border-t border-gray-200' },
        React.createElement('div', { className: 'flex justify-between items-center' },
          React.createElement('div', { className: 'text-sm text-gray-600' },
            `Showing ${((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to ${Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of ${pagination.totalItems} entries`
          ),
          React.createElement('div', { className: 'flex gap-1' },
            // First page
            pagination.currentPage > 2 && React.createElement('button', {
              onClick: () => handlePageChange(1),
              className: 'px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300'
            }, '1'),
            
            // Previous pages
            pagination.currentPage > 3 && React.createElement('span', { className: 'px-2 text-gray-500' }, '...'),
            
            // Current page - 1
            pagination.currentPage > 1 && React.createElement('button', {
              onClick: () => handlePageChange(pagination.currentPage - 1),
              className: 'px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300'
            }, pagination.currentPage - 1),
            
            // Current page
            React.createElement('button', {
              className: 'px-3 py-1 text-sm bg-blue-600 text-white rounded'
            }, pagination.currentPage),
            
            // Current page + 1
            pagination.currentPage < pagination.totalPages && React.createElement('button', {
              onClick: () => handlePageChange(pagination.currentPage + 1),
              className: 'px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300'
            }, pagination.currentPage + 1),
            
            // Next pages
            pagination.currentPage < pagination.totalPages - 2 && React.createElement('span', { className: 'px-2 text-gray-500' }, '...'),
            
            // Last page
            pagination.currentPage < pagination.totalPages - 1 && React.createElement('button', {
              onClick: () => handlePageChange(pagination.totalPages),
              className: 'px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300'
            }, pagination.totalPages)
          )
        )
      )
    ),

    // ===== ENHANCED: Quick Stats =====
    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-4' },
      React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-4 shadow' },
        React.createElement('div', { className: 'text-2xl font-bold text-blue-600' }, pagination.totalItems),
        React.createElement('div', { className: 'text-sm text-gray-600' }, 'Total Orders')
      ),
      React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-4 shadow' },
        React.createElement('div', { className: 'text-2xl font-bold text-yellow-600' }, 
          (window.orders || []).filter(o => o.status === 'pending_approval').length
        ),
        React.createElement('div', { className: 'text-sm text-gray-600' }, 'Pending Approval')
      ),
      React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-4 shadow' },
        React.createElement('div', { className: 'text-2xl font-bold text-green-600' }, 
          (window.orders || []).filter(o => o.status === 'approved').length
        ),
        React.createElement('div', { className: 'text-sm text-gray-600' }, 'Approved')
      ),
      React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-4 shadow' },
        React.createElement('div', { className: 'text-2xl font-bold text-purple-600' }, 
          (window.orders || []).filter(o => o.payment_status === 'paid').length
        ),
        React.createElement('div', { className: 'text-sm text-gray-600' }, 'Paid Orders')
      )
    )
  );
};

console.log('✅ ENHANCED: Orders component with search filters and pagination loaded successfully');
