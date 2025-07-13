// =============================================================================
// FIXED ORDERS COMPONENT - Updated with proper invoice preview logic
// =============================================================================
// This fixes the invoice preview by using the same logic as production.html

// Orders Component for FanToPark CRM
window.renderOrdersContent = () => {
  console.log("🛍️ Rendering Orders Content");

  // Extract required state and functions from app state
  const {
    orders = [],
    ordersFilters = {},
    ordersPagination = {},
    loading = false,
    hasPermission = () => false,
    setLoading = () => {},
    setOrders = () => {},
    setShowOrderDetail = () => {},
    setCurrentOrderDetail = () => {},
    setShowEditOrderForm = () => {},
    setCurrentOrderForEdit = () => {},
    setOrderEditData = () => {},
    setSelectedOrderForAssignment = () => {},
    setShowOrderAssignmentModal = () => {},
    handleDelete = () => {},
    user = {},
    // ADD: Invoice preview functions
    setCurrentInvoice = () => {},
    setShowInvoicePreview = () => {},
    openInvoicePreview = window.openInvoicePreview || (() => console.warn("openInvoicePreview not available"))
  } = window.appState || {};

  // FIXED: Replace placeholder functions with working implementations
  const approveOrder = window.handleOrderApproval || (() => console.warn("handleOrderApproval not implemented"));
  const rejectOrder = window.rejectOrder || (() => console.warn("rejectOrder not implemented"));
  const assignOrder = window.assignOrder || (() => console.warn("assignOrder not implemented"));
  const completeOrder = window.completeOrder || (() => console.warn("completeOrder not implemented"));
  
  // FIXED: Replace viewInvoice with proper invoice preview logic from production.html
  const viewInvoice = (order) => {
    console.log('🔍 Looking for invoice for order:', order.id);
    console.log('📄 Order details:', order);

    // ENHANCED: Better invoice reconstruction for new format (copied from production.html)
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
        // ENHANCED: Handle both old and new invoice formats
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
        // ENHANCED: Add payment currency for new format
        payment_currency: order.payment_currency || 'INR'
      };

      console.log('📊 Reconstructed invoice:', reconstructedInvoice);
      
      // Call the proper invoice preview function
      if (openInvoicePreview && typeof openInvoicePreview === 'function') {
        openInvoicePreview(reconstructedInvoice);
      } else if (setCurrentInvoice && setShowInvoicePreview) {
        setCurrentInvoice(reconstructedInvoice);
        setShowInvoicePreview(true);
      } else {
        console.error('❌ Invoice preview functions not available');
        alert('Invoice preview not available. Please check the system configuration.');
      }
    } else {
      alert('❌ Invoice not found for this order');
    }
  };

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

    // Sort by creation date (newest first)
    filteredOrders.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));

    return filteredOrders;
  };

  // Get filtered and paginated orders
  const filteredOrders = getFilteredAndSortedOrders();
  const totalPages = Math.ceil(filteredOrders.length / (ordersPagination.itemsPerPage || 10));
  const currentPage = ordersPagination.currentPage || 1;
  const startIndex = (currentPage - 1) * (ordersPagination.itemsPerPage || 10);
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + (ordersPagination.itemsPerPage || 10));

  const handlePageChange = (page) => {
    console.log("📄 Changing to page:", page);
    if (window.setOrdersPagination) {
      window.setOrdersPagination(prev => ({ ...prev, currentPage: page }));
    }
  };

  // Enhanced order detail view function
  const viewOrderDetail = (order) => {
    console.log("👁️ Viewing order detail:", order.order_number);
    setCurrentOrderDetail(order);
    setShowOrderDetail(true);
  };

  return React.createElement('div', { className: 'space-y-6' },
    // Header
    React.createElement('div', { className: 'flex justify-between items-center' },
      React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' }, 'Order Management'),
      React.createElement('div', { className: 'flex space-x-2' },
        hasPermission('orders', 'write') && React.createElement('button', { 
          className: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700',
          onClick: () => {
            console.log("➕ Opening add order form");
            window.openAddForm && window.openAddForm('order');
          }
        }, '+ Manual Order')
      )
    ),

    // Orders Table
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow border' },
      paginatedOrders.length > 0 ? React.createElement('div', { className: 'overflow-x-auto' },
        React.createElement('table', { className: 'w-full' },
          React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-900' },
            React.createElement('tr', null,
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Order#'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Client'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Event'),
              hasPermission('finance', 'read') && React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Amount'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Status'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Assigned To'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
            )
          ),
          React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
            paginatedOrders.map(order => {
              const status = window.ORDER_STATUSES && window.ORDER_STATUSES[order.status] || { 
                label: order.status, 
                color: 'bg-gray-100 text-gray-800', 
                next: [] 
              };

              // Enhanced order display handling
              const orderNumber = order.order_number || order.id || 'N/A';
              const clientName = order.client_name || order.lead_name || 'Unknown Client';
              const clientEmail = order.client_email || order.lead_email || '';
              const clientPhone = order.client_phone || order.lead_phone || '';

              // Enhanced event display for multi-item orders
              const getEventDisplay = (order) => {
                if (order.invoice_items && Array.isArray(order.invoice_items) && order.invoice_items.length > 0) {
                  const firstItem = order.invoice_items[0].description;
                  const itemCount = order.invoice_items.length;
                  return itemCount > 1 ? `${firstItem} (+${itemCount - 1} more)` : firstItem;
                }
                return order.event_name || 'N/A';
              };

              return React.createElement('tr', { 
                key: order.id,
                className: 'hover:bg-gray-50 dark:hover:bg-gray-700'
              },
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                  React.createElement('div', { className: 'flex items-center' },
                    React.createElement('button', {
                      onClick: () => viewOrderDetail(order),
                      className: 'text-blue-600 hover:text-blue-900 font-medium',
                      title: 'View order details'
                    }, orderNumber)
                  )
                ),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                  React.createElement('div', { className: 'text-sm font-medium text-gray-900' }, clientName),
                  clientEmail && React.createElement('div', { className: 'text-sm text-gray-500' }, clientEmail),
                  clientPhone && React.createElement('div', { className: 'text-sm text-gray-500' }, clientPhone)
                ),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                  React.createElement('div', { className: 'text-sm text-gray-900' }, getEventDisplay(order))
                ),
                hasPermission('finance', 'read') && React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                  React.createElement('div', { className: 'text-sm font-medium text-gray-900' }, 
                    window.formatCurrency ? window.formatCurrency(order.final_amount || order.total_amount || order.amount || 0) :
                    `₹${(order.final_amount || order.total_amount || order.amount || 0).toLocaleString()}`
                  )
                ),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                  React.createElement('span', { className: `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}` }, 
                    status.label
                  )
                ),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-500' },
                  order.assigned_to || 'Unassigned'
                ),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm font-medium' },
                  React.createElement('div', { className: 'flex space-x-2 flex-wrap' },
                    // STAGE 1: Pending approval (pending_approval) - View, Approve, Reject, Delete
                    order.status === 'pending_approval' && [
                      hasPermission('orders', 'read') && React.createElement('button', {
                        key: 'view',
                        onClick: () => viewOrderDetail(order),
                        className: 'px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200',
                        title: 'View order details'
                      }, 'View'),
                      
                      hasPermission('orders', 'approve') && React.createElement('button', {
                        key: 'approve',
                        onClick: () => approveOrder(order.id, 'approve'),
                        className: 'px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200',
                        title: 'Approve this order'
                      }, 'Approve'),
                      
                      hasPermission('orders', 'approve') && React.createElement('button', {
                        key: 'reject',
                        onClick: () => approveOrder(order.id, 'reject'),
                        className: 'px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200',
                        title: 'Reject this order'
                      }, 'Reject'),
                      
                      hasPermission('orders', 'delete') && React.createElement('button', {
                        key: 'delete',
                        onClick: () => deleteOrder(order.id),
                        className: 'px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200',
                        title: 'Delete this order'
                      }, 'Delete')
                    ],
                    
                    // STAGE 2: After approval (approved/confirmed) - View, View Invoice, Assign, Edit, Delete
                    (order.status === 'approved' || order.status === 'confirmed') && [
                      hasPermission('orders', 'read') && React.createElement('button', {
                        key: 'view',
                        onClick: () => viewOrderDetail(order),
                        className: 'px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200',
                        title: 'View order details'
                      }, 'View'),
                      
                      // FIXED: View Invoice button with proper logic
                      hasPermission('orders', 'read') && order.invoice_number && React.createElement('button', {
                        key: 'invoice',
                        onClick: () => viewInvoice(order),
                        className: 'px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200',
                        title: 'View/Generate invoice'
                      }, 'View Invoice'),
                      
                      hasPermission('orders', 'assign') && React.createElement('button', {
                        key: 'assign',
                        onClick: () => assignOrder(order),
                        className: 'px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200',
                        title: 'Assign to service team'
                      }, 'Assign'),
                      
                      hasPermission('orders', 'write') && React.createElement('button', {
                        key: 'edit',
                        onClick: () => openEditOrderForm(order),
                        className: 'px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200',
                        title: 'Edit order details'
                      }, 'Edit'),
                      
                      hasPermission('orders', 'delete') && React.createElement('button', {
                        key: 'delete',
                        onClick: () => deleteOrder(order.id),
                        className: 'px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200',
                        title: 'Delete this order'
                      }, 'Delete')
                    ],
                    
                    // STAGE 3: After assign (assigned/service_assigned) - View, View Invoice, Complete, Edit, Delete
                    (order.status === 'assigned' || order.status === 'service_assigned' || order.status === 'in_progress') && [
                      hasPermission('orders', 'read') && React.createElement('button', {
                        key: 'view',
                        onClick: () => viewOrderDetail(order),
                        className: 'px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200',
                        title: 'View order details'
                      }, 'View'),
                      
                      // FIXED: View Invoice button with proper logic
                      hasPermission('orders', 'read') && order.invoice_number && React.createElement('button', {
                        key: 'invoice',
                        onClick: () => viewInvoice(order),
                        className: 'px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200',
                        title: 'View invoice'
                      }, 'View Invoice'),
                      
                      hasPermission('orders', 'write') && React.createElement('button', {
                        key: 'complete',
                        onClick: () => completeOrder(order.id),
                        className: 'px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200',
                        title: 'Mark as completed'
                      }, 'Complete'),
                      
                      hasPermission('orders', 'write') && React.createElement('button', {
                        key: 'edit',
                        onClick: () => openEditOrderForm(order),
                        className: 'px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200',
                        title: 'Edit order details'
                      }, 'Edit'),
                      
                      hasPermission('orders', 'delete') && React.createElement('button', {
                        key: 'delete',
                        onClick: () => deleteOrder(order.id),
                        className: 'px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200',
                        title: 'Delete this order'
                      }, 'Delete')
                    ],
                    
                    // STAGE 4: After completion (completed/delivered) - View, View Invoice, Edit, Delete
                    (order.status === 'completed' || order.status === 'delivered') && [
                      hasPermission('orders', 'read') && React.createElement('button', {
                        key: 'view',
                        onClick: () => viewOrderDetail(order),
                        className: 'px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200',
                        title: 'View order details'
                      }, 'View'),
                      
                      // FIXED: View Invoice button with proper logic
                      hasPermission('orders', 'read') && order.invoice_number && React.createElement('button', {
                        key: 'invoice',
                        onClick: () => viewInvoice(order),
                        className: 'px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200',
                        title: 'View invoice'
                      }, 'View Invoice'),
                      
                      hasPermission('orders', 'write') && React.createElement('button', {
                        key: 'edit',
                        onClick: () => openEditOrderForm(order),
                        className: 'px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200',
                        title: 'Edit order details'
                      }, 'Edit'),
                      
                      hasPermission('orders', 'delete') && React.createElement('button', {
                        key: 'delete',
                        onClick: () => deleteOrder(order.id),
                        className: 'px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200',
                        title: 'Delete this order'
                      }, 'Delete')
                    ]
                  )
                )
              )
            })
          )
        )
      ) : React.createElement('div', { className: 'p-6 text-center text-gray-500' }, 'No orders found.')
    ),

    // Pagination
    totalPages > 1 && React.createElement('div', { className: 'flex items-center justify-between bg-white dark:bg-gray-800 px-4 py-3 sm:px-6 rounded-lg shadow border' },
      React.createElement('div', { className: 'flex flex-1 justify-between sm:hidden' },
        React.createElement('button', {
          onClick: () => handlePageChange(Math.max(1, currentPage - 1)),
          disabled: currentPage === 1,
          className: 'relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50'
        }, 'Previous'),
        React.createElement('button', {
          onClick: () => handlePageChange(Math.min(totalPages, currentPage + 1)),
          disabled: currentPage === totalPages,
          className: 'relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50'
        }, 'Next')
      ),
      React.createElement('div', { className: 'hidden sm:flex sm:flex-1 sm:items-center sm:justify-between' },
        React.createElement('div', null,
          React.createElement('p', { className: 'text-sm text-gray-700' },
            'Showing ', ((currentPage - 1) * (ordersPagination.itemsPerPage || 10) + 1), ' to ',
            Math.min(currentPage * (ordersPagination.itemsPerPage || 10), filteredOrders.length), ' of ',
            filteredOrders.length, ' results'
          )
        ),
        React.createElement('div', null,
          React.createElement('nav', { className: 'relative z-0 inline-flex rounded-md shadow-sm -space-x-px' },
            Array.from({ length: totalPages }, (_, i) => i + 1).map(page =>
              React.createElement('button', {
                key: page,
                onClick: () => handlePageChange(page),
                className: `relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                  page === currentPage
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                } border`,
                'aria-current': page === currentPage ? 'page' : undefined
              }, page)
            )
          )
        )
      )
    )
  );
};

console.log('✅ Fixed Orders component loaded with proper invoice preview functionality!');
