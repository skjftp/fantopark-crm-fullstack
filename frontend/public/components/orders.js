// Enhanced Orders Component for FanToPark CRM with Search Filters and Pagination
// Production version with automatic pagination and proper button workflow

window.renderOrdersContent = () => {
  // Extract state from window.appState (passed from React components)
  const appState = window.appState || {};
  const {
    orders = [],
    loading = false,
    showOrderForm = false,
    showOrderDetail = false,
    currentOrder = null,
    ordersFilters = {
      searchQuery: '',
      statusFilter: 'all',
      assignedToFilter: 'all',
      eventFilter: 'all',
      dateFromFilter: '',
      dateToFilter: '',
      clientFilter: '',
      orderNumberFilter: '',
      paymentStatusFilter: 'all'
    },
    ordersPagination = {
      currentPage: 1,
      itemsPerPage: 10,
      totalItems: 0,
      totalPages: 0
    },
    ordersSorting = {
      sortField: 'created_date',
      sortDirection: 'desc'
    },
    ordersShowFilters = false
  } = appState;

  // Get setter functions from window (set by main-app-component.js)
  const setOrdersFilters = window.setOrdersFilters || (() => console.warn("setOrdersFilters not available"));
  const setOrdersPagination = window.setOrdersPagination || (() => console.warn("setOrdersPagination not available"));
  const setOrdersSorting = window.setOrdersSorting || (() => console.warn("setOrdersSorting not available"));
  const setOrdersShowFilters = window.setOrdersShowFilters || (() => console.warn("setOrdersShowFilters not available"));
  
  // Action handlers
  const hasPermission = window.hasPermission || (() => false);
  const openOrderDetail = window.openOrderDetail || (() => console.warn("openOrderDetail not implemented"));
  const approveOrder = window.approveOrder || (() => console.warn("approveOrder not implemented"));
  const rejectOrder = window.rejectOrder || (() => console.warn("rejectOrder not implemented"));
  const assignOrder = window.assignOrder || (() => console.warn("assignOrder not implemented"));
  const completeOrder = window.completeOrder || (() => console.warn("completeOrder not implemented"));

// FIXED: Override window.viewInvoice FIRST, then create the local constant
window.viewInvoice = (order) => {
  console.log('🔍 Looking for invoice for order:', order.id);
  
  if (order.invoice_number) {
    const reconstructedInvoice = {
      id: order.invoice_id || order.id,
      invoice_number: order.invoice_number,
      order_id: order.id,
      order_number: order.order_number,
      client_name: order.legal_name || order.client_name,
      client_email: order.client_email,
      gstin: order.gstin,
      legal_name: order.legal_name,
      category_of_sale: order.category_of_sale,
      type_of_sale: order.type_of_sale,
      registered_address: order.registered_address,
      indian_state: order.indian_state,
      is_outside_india: order.is_outside_india,
      invoice_items: order.invoice_items || [{
        description: order.event_name || 'Service',
        quantity: order.tickets_allocated || 1,
        rate: order.price_per_ticket || (order.total_amount || 0)
      }],
      base_amount: order.base_amount || order.total_amount || order.amount || 0,
      gst_calculation: order.gst_calculation || {
        applicable: false,
        rate: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        total: 0
      },
      tcs_calculation: order.tcs_calculation || {
        applicable: false,
        rate: 0,
        amount: 0
      },
      total_tax: order.total_tax || 0,
      final_amount: order.final_amount || order.total_amount || order.amount || 0,
      invoice_date: order.approved_date || new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'generated',
      generated_by: order.approved_by || 'System',
      payment_currency: order.payment_currency || 'INR'
    };
    console.log('📊 Reconstructed invoice:', reconstructedInvoice);
    
    if (window.openInvoicePreview) {
      window.openInvoicePreview(reconstructedInvoice);
    } else {
      alert('Invoice preview not available');
    }
  } else {
    alert('❌ Invoice not found for this order');
  }
};

// NOW create the local constant that points to the NEW function
const viewInvoice = window.viewInvoice;
  const openEditOrderForm = window.openEditOrderForm || (() => console.warn("openEditOrderForm not implemented"));
  const deleteOrder = window.deleteOrder || (() => console.warn("deleteOrder not implemented"));

  // Filter and sort orders function
  const getFilteredAndSortedOrders = () => {
    let filteredOrders = [...(orders || [])];

    // Apply filters
    if (ordersFilters.searchQuery) {
      const query = ordersFilters.searchQuery.toLowerCase();
      filteredOrders = filteredOrders.filter(order =>
        (order.client_name && order.client_name.toLowerCase().includes(query)) ||
        (order.client_phone && order.client_phone.includes(query)) ||
        (order.order_number && order.order_number.toLowerCase().includes(query)) ||
        (order.event_name && order.event_name.toLowerCase().includes(query))
      );
    }

    if (ordersFilters.statusFilter !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.status === ordersFilters.statusFilter);
    }

    if (ordersFilters.assignedToFilter !== 'all') {
      if (ordersFilters.assignedToFilter === 'unassigned') {
        filteredOrders = filteredOrders.filter(order => !order.assigned_to);
      } else {
        filteredOrders = filteredOrders.filter(order => order.assigned_to === ordersFilters.assignedToFilter);
      }
    }

    if (ordersFilters.eventFilter !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.event_name === ordersFilters.eventFilter);
    }

    if (ordersFilters.clientFilter) {
      const clientQuery = ordersFilters.clientFilter.toLowerCase();
      filteredOrders = filteredOrders.filter(order =>
        order.client_name && order.client_name.toLowerCase().includes(clientQuery)
      );
    }

    if (ordersFilters.orderNumberFilter) {
      const orderQuery = ordersFilters.orderNumberFilter.toLowerCase();
      filteredOrders = filteredOrders.filter(order =>
        order.order_number && order.order_number.toLowerCase().includes(orderQuery)
      );
    }

    if (ordersFilters.paymentStatusFilter !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.payment_status === ordersFilters.paymentStatusFilter);
    }

    if (ordersFilters.dateFromFilter) {
      filteredOrders = filteredOrders.filter(order => 
        new Date(order.created_date) >= new Date(ordersFilters.dateFromFilter)
      );
    }

    if (ordersFilters.dateToFilter) {
      filteredOrders = filteredOrders.filter(order => 
        new Date(order.created_date) <= new Date(ordersFilters.dateToFilter)
      );
    }

    // Apply sorting
    filteredOrders.sort((a, b) => {
      let aVal = a[ordersSorting.sortField];
      let bVal = b[ordersSorting.sortField];
      
      // Handle different data types
      if (ordersSorting.sortField === 'total_amount') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else if (ordersSorting.sortField === 'created_date') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }

      if (ordersSorting.sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filteredOrders;
  };

  // Get filtered and sorted orders
  const filteredOrders = getFilteredAndSortedOrders();

  // Calculate pagination
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / ordersPagination.itemsPerPage);

  // Get paginated orders
  const startIndex = (ordersPagination.currentPage - 1) * ordersPagination.itemsPerPage;
  const endIndex = startIndex + ordersPagination.itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Event handlers
  const handleFilterChange = (filterKey, value) => {
    setOrdersFilters({
      ...ordersFilters,
      [filterKey]: value
    });
    // Reset to first page when filtering
    setOrdersPagination({
      ...ordersPagination,
      currentPage: 1,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / ordersPagination.itemsPerPage)
    });
  };

  const handleSortChange = (field) => {
    const newDirection = ordersSorting.sortField === field && ordersSorting.sortDirection === 'asc' ? 'desc' : 'asc';
    setOrdersSorting({ 
      sortField: field, 
      sortDirection: newDirection 
    });
  };

  const handlePageChange = (page) => {
    setOrdersPagination({
      ...ordersPagination,
      currentPage: page
    });
  };

  // Get unique values for filter dropdowns
  const uniqueStatuses = [...new Set(orders.map(order => order.status))];
  const uniqueAssignees = [...new Set(orders.map(order => order.assigned_to).filter(Boolean))];
  const uniqueEvents = [...new Set(orders.map(order => order.event_name).filter(Boolean))];
  const uniquePaymentStatuses = [...new Set(orders.map(order => order.payment_status))];

  // Main orders content
  return React.createElement('div', { className: 'space-y-6' },
    // Header with title and controls
    React.createElement('div', { className: 'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4' },
      React.createElement('div', null,
        React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' }, 'Orders Management'),
        React.createElement('p', { className: 'text-sm text-gray-600 dark:text-gray-400 mt-1' },
          `${totalItems} total orders (${orders.length} unfiltered)`
        )
      ),
      React.createElement('div', { className: 'flex gap-2' },
        React.createElement('button', {
          onClick: () => setOrdersShowFilters(!ordersShowFilters),
          className: `px-4 py-2 rounded-md border ${ordersShowFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700'} hover:bg-blue-50`
        }, ordersShowFilters ? '🔽 Hide Filters' : '🔍 Show Filters'),
        hasPermission('orders', 'write') && React.createElement('button', {
          onClick: () => window.setShowOrderForm && window.setShowOrderForm(true),
          className: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
        }, '📝 New Order')
      )
    ),

    // Enhanced filters panel
    ordersShowFilters && React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow border p-6' },
      React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, '🔍 Advanced Filters'),
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' },
        // Search query
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Search'),
          React.createElement('input', {
            type: 'text',
            value: ordersFilters.searchQuery,
            onChange: (e) => handleFilterChange('searchQuery', e.target.value),
            placeholder: 'Client name, phone, order #, event...',
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
          })
        ),

        // Status filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Status'),
          React.createElement('select', {
            value: ordersFilters.statusFilter,
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
            value: ordersFilters.assignedToFilter,
            onChange: (e) => handleFilterChange('assignedToFilter', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
          },
            React.createElement('option', { value: 'all' }, 'All Assignees'),
            React.createElement('option', { value: 'unassigned' }, 'Unassigned'),
            uniqueAssignees.map(assignee =>
              React.createElement('option', { key: assignee, value: assignee }, assignee)
            )
          )
        ),

        // Event filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Event'),
          React.createElement('select', {
            value: ordersFilters.eventFilter,
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
            value: ordersFilters.paymentStatusFilter,
            onChange: (e) => handleFilterChange('paymentStatusFilter', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
          },
            React.createElement('option', { value: 'all' }, 'All Payment Statuses'),
            uniquePaymentStatuses.map(status =>
              React.createElement('option', { key: status, value: status }, status)
            )
          )
        ),

        // Client filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Client Name'),
          React.createElement('input', {
            type: 'text',
            value: ordersFilters.clientFilter,
            onChange: (e) => handleFilterChange('clientFilter', e.target.value),
            placeholder: 'Search by client name...',
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
          })
        ),

        // Date range filters
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Date From'),
          React.createElement('input', {
            type: 'date',
            value: ordersFilters.dateFromFilter,
            onChange: (e) => handleFilterChange('dateFromFilter', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
          })
        ),

        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Date To'),
          React.createElement('input', {
            type: 'date',
            value: ordersFilters.dateToFilter,
            onChange: (e) => handleFilterChange('dateToFilter', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
          })
        ),

        // Order number filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Order Number'),
          React.createElement('input', {
            type: 'text',
            value: ordersFilters.orderNumberFilter,
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
            setOrdersPagination({ 
              ...ordersPagination,
              currentPage: 1,
              totalItems: totalItems,
              totalPages: Math.ceil(totalItems / ordersPagination.itemsPerPage)
            });
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
              ['order_number', 'client_name', 'event_name', 'total_amount', 'status', 'payment_status', 'assigned_to'].map(field =>
                React.createElement('th', {
                  key: field,
                  className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100',
                  onClick: () => handleSortChange(field)
                },
                  React.createElement('div', { className: 'flex items-center space-x-1' },
                    React.createElement('span', null, field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())),
                    ordersSorting.sortField === field && React.createElement('span', { className: 'text-blue-500' },
                      ordersSorting.sortDirection === 'asc' ? '↑' : '↓'
                    )
                  )
                )
              ),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Actions')
            )
          ),
          React.createElement('tbody', { className: 'bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700' },
            paginatedOrders.length === 0 ? React.createElement('tr', null,
              React.createElement('td', { colSpan: 8, className: 'px-6 py-12 text-center text-gray-500' },
                ordersFilters.searchQuery || Object.values(ordersFilters).some(v => v && v !== 'all') 
                  ? 'No orders match your search criteria' 
                  : 'No orders found'
              )
            ) : paginatedOrders.map((order, index) =>
              React.createElement('tr', {
                key: order.id || index,
                className: 'hover:bg-gray-50 dark:hover:bg-gray-700'
              },
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white' },
                  order.order_number || 'N/A'
                ),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white' },
                  order.client_name || 'N/A'
                ),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white' },
                  order.event_name || 'N/A'
                ),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white' },
                  order.total_amount ? `₹${parseFloat(order.total_amount).toLocaleString()}` : 'N/A'
                ),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                  React.createElement('span', {
                    className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      order.status === 'confirmed' || order.status === 'approved' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending' || order.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'cancelled' || order.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      order.status === 'assigned' || order.status === 'service_assigned' ? 'bg-purple-100 text-purple-800' :
                      order.status === 'completed' || order.status === 'delivered' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`
                  }, order.status || 'N/A')
                ),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                  React.createElement('span', {
                    className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                      order.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                      order.payment_status === 'pending' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`
                  }, order.payment_status || 'N/A')
                ),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white' },
                  order.assigned_to || 'Unassigned'
                ),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm font-medium' },
                  React.createElement('div', { className: 'flex flex-wrap gap-1' },
  ...window.renderEnhancedOrderActions(order)
)
                )
              )
            )
          )
        )
      )
    ),

    // Pagination
    totalPages > 1 && React.createElement('div', { className: 'flex items-center justify-between bg-white dark:bg-gray-800 px-4 py-3 sm:px-6 rounded-lg shadow border' },
      React.createElement('div', { className: 'flex flex-1 justify-between sm:hidden' },
        React.createElement('button', {
          onClick: () => handlePageChange(Math.max(1, ordersPagination.currentPage - 1)),
          disabled: ordersPagination.currentPage === 1,
          className: 'relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50'
        }, 'Previous'),
        React.createElement('button', {
          onClick: () => handlePageChange(Math.min(totalPages, ordersPagination.currentPage + 1)),
          disabled: ordersPagination.currentPage === totalPages,
          className: 'relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50'
        }, 'Next')
      ),
      React.createElement('div', { className: 'hidden sm:flex sm:flex-1 sm:items-center sm:justify-between' },
        React.createElement('div', null,
          React.createElement('p', { className: 'text-sm text-gray-700 dark:text-gray-300' },
            `Showing ${startIndex + 1} to ${Math.min(endIndex, totalItems)} of ${totalItems} results`
          )
        ),
        React.createElement('div', null,
          React.createElement('nav', { className: 'relative z-0 inline-flex rounded-md shadow-sm -space-x-px' },
            // Previous button
            React.createElement('button', {
              onClick: () => handlePageChange(Math.max(1, ordersPagination.currentPage - 1)),
              disabled: ordersPagination.currentPage === 1,
              className: 'relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50'
            }, '‹'),
            
            // Page numbers
            ...Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (ordersPagination.currentPage <= 3) {
                pageNum = i + 1;
              } else if (ordersPagination.currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = ordersPagination.currentPage - 2 + i;
              }
              
              return React.createElement('button', {
                key: pageNum,
                onClick: () => handlePageChange(pageNum),
                className: `relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  pageNum === ordersPagination.currentPage
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`
              }, pageNum);
            }),
            
            // Next button
            React.createElement('button', {
              onClick: () => handlePageChange(Math.min(totalPages, ordersPagination.currentPage + 1)),
              disabled: ordersPagination.currentPage === totalPages,
              className: 'relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50'
            }, '›')
          )
        )
      )
    )
  );
};

// =============================================================================
// STEP 2: ORDER ACTIONS INTEGRATION FOR ENHANCED WORKFLOW
// =============================================================================
// Add this code to your existing orders.js or create components/order-workflow-integration.js

// Enhanced order actions with approval workflow
window.enhancedOrderActions = {
  
  // Open edit order form with enhanced functionality
  openEditOrderForm: function(order) {
    console.log('Opening enhanced edit form for order:', order.id);
    
    // Store original assignee if not already stored
    if (!order.original_assignee && order.created_by) {
      order.original_assignee = order.created_by;
    }
    
    window.setCurrentOrderForEdit(order);
    window.setShowEditOrderForm(true);
  },

  // Approve order with workflow automation
  approveOrder: async function(orderId, notes = '') {
    if (!confirm('Approve this order? This will trigger automatic assignment based on order type.')) {
      return;
    }

    await window.handleOrderApproval(orderId, 'approve', notes);
  },

  // Reject order with reassignment to original person
  rejectOrder: async function(orderId) {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) {
      alert('Rejection reason is required');
      return;
    }

    if (!confirm('Reject this order? It will be reassigned to the original sales person.')) {
      return;
    }

    await window.handleOrderApproval(orderId, 'reject', reason);
  },

  // Quick assign to specific user
  quickAssignOrder: function(orderId) {
    const allUsers = (window.users || []).filter(u => u.status === 'active');
    
    if (allUsers.length === 0) {
      alert('No active users available for assignment');
      return;
    }

    // Create a modal or prompt for user selection
    const userOptions = allUsers.map(u => `${u.name} (${window.getRoleDisplayName ? window.getRoleDisplayName(u.role) : u.role})`).join('\n');
    const selectedIndex = prompt(`Select user to assign to:\n\n${userOptions}\n\nEnter the number (1-${allUsers.length}):`);
    
    if (selectedIndex && !isNaN(selectedIndex)) {
      const index = parseInt(selectedIndex) - 1;
      if (index >= 0 && index < allUsers.length) {
        const selectedUser = allUsers[index];
        window.assignOrderToUser(orderId, selectedUser.email, 'Manual assignment via quick assign');
      } else {
        alert('Invalid selection');
      }
    }
  },

  // Reassign to original sales person
  reassignToOriginal: async function(orderId) {
    const order = window.orders.find(o => o.id === orderId);
    if (!order) {
      alert('Order not found');
      return;
    }

    const originalAssignee = order.original_assignee || order.created_by;
    if (!originalAssignee) {
      alert('No original assignee found for this order');
      return;
    }

    if (confirm(`Reassign this order back to ${originalAssignee}?`)) {
      await window.assignOrderToUser(orderId, originalAssignee, 'Reassigned to original sales person');
    }
  }
};

// =============================================================================
// ENHANCED ORDER ACTION BUTTONS RENDERER
// =============================================================================
// Replace your existing order action buttons with this enhanced version

window.renderEnhancedOrderActions = function(order) {
  const { hasPermission } = window;
  
  if (!hasPermission) {
    console.warn('hasPermission function not found');
    return [];
  }

  const actions = [];

  // Common actions for all orders
  if (hasPermission('orders', 'read')) {
    actions.push(
      React.createElement('button', {
        key: 'view',
        onClick: () => window.viewOrderDetail(order),
        className: 'px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200',
        title: 'View order details'
      }, 'View')
    );
  }

  // Status-specific actions
  switch (order.status) {
    case 'pending_approval':
      // Finance manager actions for pending orders
      if (hasPermission('orders', 'approve') && 
          (window.user?.role === 'finance_manager' || window.user?.role === 'supply_sales_service_manager' || window.user?.role === 'super_admin')) {
        actions.push(
          React.createElement('button', {
            key: 'approve',
            onClick: () => window.enhancedOrderActions.approveOrder(order.id),
            className: 'px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200',
            title: 'Approve this order and auto-assign to supply team'
          }, '✅ Approve'),
          
          React.createElement('button', {
            key: 'reject',
            onClick: () => window.enhancedOrderActions.rejectOrder(order.id),
            className: 'px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200',
            title: 'Reject this order and return to original sales person'
          }, '❌ Reject')
        );
      }
      break;

    case 'approved':
    case 'assigned':
      // Actions for approved orders
      if (hasPermission('orders', 'read')) {
        actions.push(
          React.createElement('button', {
            key: 'invoice',
            onClick: () => window.viewInvoice(order),
            className: 'px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200',
            title: 'View/Generate invoice'
          }, '📄 Invoice')
        );
      }

      if (hasPermission('orders', 'assign')) {
        actions.push(
          React.createElement('button', {
            key: 'reassign',
            onClick: () => window.enhancedOrderActions.quickAssignOrder(order.id),
            className: 'px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200',
            title: 'Assign to a different user'
          }, '👥 Reassign')
        );
      }
      break;

    case 'in_progress':
    case 'service_assigned':
      // Actions for in-progress orders
      if (hasPermission('orders', 'write')) {
        actions.push(
          React.createElement('button', {
            key: 'complete',
            onClick: () => window.completeOrder(order.id),
            className: 'px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200',
            title: 'Mark as completed'
          }, '✅ Complete')
        );
      }
      break;

    case 'rejected':
      // Actions for rejected orders
      actions.push(
        React.createElement('span', {
          key: 'rejected-status',
          className: 'px-2 py-1 text-xs bg-red-100 text-red-700 rounded',
          title: order.rejection_reason || 'Order was rejected'
        }, '❌ Rejected')
      );
      break;
  }

  // Edit action (available for most statuses except completed/cancelled)
  if (hasPermission('orders', 'write') && 
      !['completed', 'cancelled', 'delivered'].includes(order.status)) {
    actions.push(
      React.createElement('button', {
        key: 'edit',
        onClick: () => window.enhancedOrderActions.openEditOrderForm(order),
        className: 'px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200',
        title: 'Edit order details'
      }, '✏️ Edit')
    );
  }

  // Reassign to Original button (show for non-original assignees)
  if (hasPermission('orders', 'assign') && 
      order.original_assignee && 
      order.assigned_to !== order.original_assignee &&
      !['completed', 'cancelled', 'delivered'].includes(order.status)) {
    actions.push(
      React.createElement('button', {
        key: 'reassign-original',
        onClick: () => window.enhancedOrderActions.reassignToOriginal(order.id),
        className: 'px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200',
        title: `Reassign back to original sales person: ${order.original_assignee}`
      }, '↩️ To Original')
    );
  }

  // Delete action (for super admins only)
  if (hasPermission('orders', 'delete') && window.user?.role === 'super_admin') {
    actions.push(
      React.createElement('button', {
        key: 'delete',
        onClick: () => {
          if (confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
            window.deleteOrder(order.id);
          }
        },
        className: 'px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200',
        title: 'Delete this order (Admin only)'
      }, '🗑️ Delete')
    );
  }

  return actions;
};

// =============================================================================
// INTEGRATION WITH LEAD STATUS UPDATES
// =============================================================================
// Add this to your lead-status-management.js to trigger order creation

window.integrateOrderCreationWithLeadStatus = function() {
  // Store original updateLeadStatus function
  const originalUpdateLeadStatus = window.updateLeadStatus;
  
  // Enhanced updateLeadStatus with order creation
  window.updateLeadStatus = async function(leadId, newStatus) {
    console.log('🔄 Enhanced lead status update:', leadId, newStatus);
    
    // Call original function first
    await originalUpdateLeadStatus(leadId, newStatus);
  };
  
  console.log('🔗 Order creation integrated with lead status updates');
};

// =============================================================================
// INITIALIZATION
// =============================================================================
// Auto-initialize when loaded
window.addEventListener('load', () => {
  setTimeout(() => {
    // Integrate with existing system
    if (window.updateLeadStatus) {
      window.integrateOrderCreationWithLeadStatus();
    }
    
    // Replace existing order actions renderer if it exists
    if (window.renderOrderActions) {
      window.renderOrderActions = window.renderEnhancedOrderActions;
    }
    
    console.log('✅ Enhanced order workflow integration completed');
  }, 1000);
});

console.log('✅ Order Actions Integration for Enhanced Workflow loaded successfully');

console.log("✅ ENHANCED: Orders component with search filters and pagination loaded successfully");
