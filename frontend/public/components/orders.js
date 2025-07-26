// Enhanced Orders Component for FanToPark CRM with Search Filters and Pagination
// Production version with automatic pagination and proper button workflow

// =============================================================================
// ASSIGNMENT FUNCTIONS FOR ORDER WORKFLOW
// =============================================================================

// ✅ FINANCE TEAM ASSIGNMENT FUNCTION (for payment_received orders):
window.getFinanceManager = async function() {
  //console.log('🔍 === DEBUG getFinanceManager CALLED ===');
  //console.log('🔍 window.users length:', window.users?.length || 'undefined');
  //console.log('🔍 window.users:', window.users);
  
  try {
    // Get all finance team members
    const financeTeamMembers = window.users.filter(user => {
      const isFinanceRole = ['finance_manager', 'finance_executive'].includes(user.role);
      const isActive = user.status === 'active';
      
      //console.log('🔍 Checking user:', user.email, 'role:', user.role, 'status:', user.status, 'isFinance:', isFinanceRole, 'isActive:', isActive);
      
      return isFinanceRole && isActive;
    });
    
    //console.log('🔍 Found finance team members:', financeTeamMembers);
    
    if (financeTeamMembers.length === 0) {
      console.warn('⚠️ No active finance team members found, checking for admins as fallback');
      
      // Fallback: Look for active admins
      const adminUsers = window.users.filter(user => 
        ['admin', 'super_admin'].includes(user.role) && user.status === 'active'
      );
      
      if (adminUsers.length > 0) {
        //console.log('🔄 Using admin as fallback:', adminUsers[0].email);
        return adminUsers[0].email;
      }
      
      // Last resort: return the first active user
      const activeUsers = window.users.filter(user => user.status === 'active');
      if (activeUsers.length > 0) {
        //console.log('🔄 Using first active user as last resort:', activeUsers[0].email);
        return activeUsers[0].email;
      }
      
      throw new Error('No active users found for finance assignment');
    }
    
    //console.log('✅ Found', financeTeamMembers.length, 'finance team members');
    
    // Prioritize finance_manager over finance_executive
    const financeManagers = financeTeamMembers.filter(user => user.role === 'finance_manager');
    const financeExecutives = financeTeamMembers.filter(user => user.role === 'finance_executive');
    
    let selectedMember;
    
    if (financeManagers.length > 0) {
      // Use round-robin for finance managers if multiple exist
      const managerIndex = (Date.now() % financeManagers.length);
      selectedMember = financeManagers[managerIndex];
      //console.log('🎯 Selected finance manager via round-robin:', selectedMember.email);
    } else {
      // Use first finance executive if no managers
      selectedMember = financeExecutives[0];
      //console.log('🎯 Selected finance executive (no managers available):', selectedMember.email);
    }
    
    //console.log('🎯 Final assignment to:', selectedMember.email, '(' + selectedMember.name + ')');
    
    return selectedMember.email;
    
  } catch (error) {
    console.error('❌ Error getting finance manager:', error);
    
    // Emergency fallback: try to find ANY active user
    try {
      const emergencyUser = window.users.find(user => user.status === 'active');
      if (emergencyUser) {
        //console.log('🚨 Emergency fallback to:', emergencyUser.email);
        return emergencyUser.email;
      }
    } catch (fallbackError) {
      console.error('❌ Emergency fallback also failed:', fallbackError);
    }
    
    throw new Error('Failed to assign to any finance manager');
  }
};

// ✅ FIXED: Enhanced getSupplyTeamMember with user loading check
// Replace the existing getSupplyTeamMember function

window.getSupplyTeamMember = async function() {
  //console.log('🔍 === DEBUG getSupplyTeamMember CALLED ===');
  //console.log('🔍 window.users length:', window.users?.length || 'undefined');
  //console.log('🔍 window.users:', window.users);
  
  try {
    // 🔧 FIXED: If users are not loaded, fetch them first
    if (!window.users || window.users.length === 0) {
      //console.log('🔄 Users not loaded, fetching users first...');
      
      // Try to fetch users
      if (window.fetchUsers && typeof window.fetchUsers === 'function') {
        await window.fetchUsers();
        //console.log('✅ Users fetched, new length:', window.users?.length);
      } else {
        // Manual API call if fetchUsers function not available
        try {
          const usersResponse = await window.apiCall('/users');
          window.users = usersResponse.data || usersResponse || [];
          window.setUsers && window.setUsers(window.users);
          //console.log('✅ Users fetched manually, length:', window.users.length);
        } catch (fetchError) {
          console.error('❌ Failed to fetch users:', fetchError);
        }
      }
    }
    
    // Get all supply team members
    const supplyTeamMembers = window.users.filter(user => {
      const isSupplyRole = ['supply_manager', 'supply_service_manager', 'supply_sales_service_manager'].includes(user.role);
      const isActive = user.status === 'active';
      
      //console.log('🔍 Checking user:', user.email, 'role:', user.role, 'status:', user.status, 'isSupply:', isSupplyRole, 'isActive:', isActive);
      
      return isSupplyRole && isActive;
    });
    
    //console.log('🔍 Found supply team members:', supplyTeamMembers);
    
    if (supplyTeamMembers.length === 0) {
      console.warn('⚠️ No active supply team members found, using fallback');
      
      // Enhanced fallback - try to find any admin or manager
      const fallbackUsers = window.users.filter(user => 
        user.status === 'active' && 
        ['admin', 'super_admin', 'supply_manager'].includes(user.role)
      );
      
      if (fallbackUsers.length > 0) {
        //console.log('🔄 Using fallback user:', fallbackUsers[0].email);
        return fallbackUsers[0].email;
      }
      
      // Last resort fallback
      return 'akshay@fantopark.com';
    }
    
    //console.log('✅ Found', supplyTeamMembers.length, 'supply team members');
    
    const selectedMember = supplyTeamMembers[0];
    //console.log('🎯 Assigning to:', selectedMember.email, '(' + selectedMember.name + ')');
    
    return selectedMember.email;
    
  } catch (error) {
    console.error('❌ Error getting supply team member:', error);
    return 'akshay@fantopark.com'; // fallback
  }
};

// =============================================================================
// MAIN ORDERS COMPONENT
// =============================================================================

const OrdersContent = () => {
  // State for bulk selection
  const [selectedOrders, setSelectedOrders] = React.useState(new Set());
  const [bulkActionMode, setBulkActionMode] = React.useState(false);
  
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
window.viewInvoice = function(order) {
  console.log('📄 viewInvoice called with order:', order);
  console.log('Order state:', {
    id: order.id,
    order_type: order.order_type,
    status: order.status,
    payment_status: order.payment_status,
    invoice_type: order.invoice_type,
    finance_invoice_number: order.finance_invoice_number
  });
  
  // Check if this should show as proforma
  const isProforma = order.invoice_type === 'proforma' && 
                     order.payment_status !== 'completed';
  
  console.log('Invoice type determined as:', isProforma ? 'PROFORMA' : 'TAX');
  console.log('Finance invoice number:', order.finance_invoice_number);
  
  // For tax invoices that don't have finance invoice number
  if (!isProforma && !order.finance_invoice_number) {
    console.log('📝 Tax invoice needs finance invoice number');
    
    // Check if modal functions are available
    if (window.setCurrentOrderForInvoice && window.setFinanceInvoiceNumber && window.setShowFinanceInvoiceModal) {
      console.log('✅ Opening finance invoice modal');
      window.setCurrentOrderForInvoice(order);
      window.setFinanceInvoiceNumber(order.finance_invoice_number || '');
      window.setShowFinanceInvoiceModal(true);
      return;
    } else {
      console.log('❌ Modal functions not available');
      alert('Finance invoice number is required. Please contact admin.');
      return;
    }
  }
  
  // Show invoice preview directly
  window.openInvoicePreviewDirectly(order);
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
        }, '📝 New Order'),
        // CSV Export button - for super_admin, supply_sales_service_manager, finance_manager
        (window.user?.role === 'super_admin' || 
         window.user?.role === 'supply_sales_service_manager' || 
         window.user?.role === 'finance_manager') && 
        React.createElement('button', {
          onClick: () => window.exportOrdersToCSV && window.exportOrdersToCSV(filteredOrders),
          className: 'px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700',
          title: 'Export filtered orders to CSV'
        }, '📥 Export CSV'),
        // CSV Import button for invoice numbers - for super_admin, finance_manager
        (window.user?.role === 'super_admin' || 
         window.user?.role === 'finance_manager') && 
        React.createElement('button', {
          onClick: () => window.showInvoiceCSVImport && window.showInvoiceCSVImport(),
          className: 'px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700',
          title: 'Import finance invoice numbers from CSV'
        }, '📤 Import Invoice CSV'),
        // Bulk Actions toggle - for super_admin, finance_manager
        (window.user?.role === 'super_admin' || 
         window.user?.role === 'finance_manager') && 
        React.createElement('button', {
          onClick: () => {
            setBulkActionMode(!bulkActionMode);
            setSelectedOrders(new Set()); // Clear selections when toggling
          },
          className: `px-4 py-2 rounded-md ${bulkActionMode ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-gray-600 text-white hover:bg-gray-700'}`,
          title: 'Enable bulk actions'
        }, bulkActionMode ? '✖️ Cancel Bulk' : '☑️ Bulk Actions')
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

    // Bulk action bar - shows when orders are selected
    bulkActionMode && selectedOrders.size > 0 && React.createElement('div', { 
      className: 'bg-blue-50 dark:bg-blue-900 rounded-lg shadow border p-4' 
    },
      React.createElement('div', { className: 'flex items-center justify-between' },
        React.createElement('div', { className: 'flex items-center space-x-4' },
          React.createElement('span', { className: 'font-medium text-blue-900 dark:text-blue-100' }, 
            `${selectedOrders.size} order${selectedOrders.size > 1 ? 's' : ''} selected`
          ),
          React.createElement('button', {
            onClick: () => {
              // Only select pending_approval orders on the current page
              const pendingOrderIds = paginatedOrders
                .filter(o => o.status === 'pending_approval')
                .map(o => o.id);
              setSelectedOrders(new Set(pendingOrderIds));
            },
            className: 'text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400'
          }, 'Select All Pending on Page'),
          React.createElement('button', {
            onClick: () => setSelectedOrders(new Set()),
            className: 'text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400'
          }, 'Clear Selection')
        ),
        React.createElement('div', { className: 'flex items-center space-x-2' },
          React.createElement('button', {
            onClick: async () => {
              const eligibleOrders = Array.from(selectedOrders).map(id => 
                orders.find(o => o.id === id)
              ).filter(o => o && o.status === 'pending_approval');
              
              if (eligibleOrders.length === 0) {
                alert('No pending approval orders selected for approval');
                return;
              }
              if (confirm(`Approve ${eligibleOrders.length} order${eligibleOrders.length > 1 ? 's' : ''}?`)) {
                await window.bulkApproveOrders(Array.from(selectedOrders));
                setSelectedOrders(new Set());
                setBulkActionMode(false);
              }
            },
            className: 'px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700',
            title: 'Bulk approve selected pending orders'
          }, `✅ Approve (${Array.from(selectedOrders).filter(id => {
            const order = orders.find(o => o.id === id);
            return order && order.status === 'pending_approval';
          }).length})`)
        )
      )
    ),

    // Orders table
    React.createElement('div', { 
      className: 'bg-white dark:bg-gray-800 rounded-lg shadow border overflow-hidden',
      key: 'orders-table-container'
    },
      loading ? React.createElement('div', { className: 'text-center py-12' },
        React.createElement('div', { className: 'text-gray-500' }, 'Loading orders...')
      ) : React.createElement('div', { className: 'overflow-x-auto', key: 'orders-table-wrapper' },
        React.createElement('table', { className: 'w-full divide-y divide-gray-200 dark:divide-gray-700' },
          React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-900' },
            React.createElement('tr', null,
              // Add checkbox column when in bulk mode
              bulkActionMode && React.createElement('th', { 
                className: 'px-6 py-3 w-12' 
              },
                React.createElement('input', {
                  type: 'checkbox',
                  checked: paginatedOrders.length > 0 && paginatedOrders.every(o => selectedOrders.has(o.id)),
                  onChange: (e) => {
                    if (e.target.checked) {
                      const newSelection = new Set(selectedOrders);
                      paginatedOrders.forEach(o => newSelection.add(o.id));
                      setSelectedOrders(newSelection);
                    } else {
                      const newSelection = new Set(selectedOrders);
                      paginatedOrders.forEach(o => newSelection.delete(o.id));
                      setSelectedOrders(newSelection);
                    }
                  },
                  className: 'w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500'
                })
              ),
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
            !paginatedOrders || paginatedOrders.length === 0 ? React.createElement('tr', null,
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
                // Add checkbox column when in bulk mode
                bulkActionMode && React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                  React.createElement('div', { className: 'flex items-center' },
                    React.createElement('input', {
                      type: 'checkbox',
                      checked: selectedOrders.has(order.id),
                      onChange: (e) => {
                        const newSelection = new Set(selectedOrders);
                        if (e.target.checked) {
                          newSelection.add(order.id);
                        } else {
                          newSelection.delete(order.id);
                        }
                        setSelectedOrders(newSelection);
                      },
                      className: 'w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500'
                    }),
                    order.status !== 'pending_approval' && React.createElement('span', { 
                      className: 'ml-2 text-xs text-gray-500',
                      title: 'Only pending approval orders can be approved'
                    }, '⚠️')
                  )
                ),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white' },
                  order.order_number || 'N/A'
                ),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white' },
                  order.client_name || 'N/A'
                ),
                React.createElement('td', { 
  className: 'px-6 py-4 text-sm text-gray-900 dark:text-white',
  style: { maxWidth: '300px' }
},
  React.createElement('div', {
    style: {
      overflow: 'hidden',
      display: '-webkit-box',
      WebkitBoxOrient: 'vertical',
      WebkitLineClamp: 2,
      lineHeight: '1.5',
      maxHeight: '3em',
      wordBreak: 'break-word'
    },
    title: order.event_name || 'N/A' // Show full text on hover
  },
    // Truncate to 80 characters
    (order.event_name || 'N/A').length > 80 
      ? (order.event_name || 'N/A').substring(0, 80) + '...'
      : (order.event_name || 'N/A')
  )
),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white' },
                  order.total_amount ? window.formatCurrency(order.total_amount, order.payment_currency || order.currency || 'INR') : 'N/A'
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

// Wrapper function to render the Orders component
window.renderOrdersContent = () => {
  return React.createElement(OrdersContent);
};

// =============================================================================
// STEP 2: ORDER ACTIONS INTEGRATION FOR ENHANCED WORKFLOW
// =============================================================================

// Enhanced order actions with approval workflow
window.enhancedOrderActions = {
  
  // Open edit order form with enhanced functionality
  openEditOrderForm: function(order) {
    //console.log('Opening enhanced edit form for order:', order.id);
    
    // Store original assignee if not already stored
    if (!order.original_assignee && order.created_by) {
      order.original_assignee = order.created_by;
    }
    
    window.setCurrentOrderForEdit(order);
    window.setShowEditOrderForm(true);
  },

  // 🔧 FIXED: Approve order with finance → supply workflow
  // In frontend/public/components/orders.js
// Replace the entire approveOrder function inside window.enhancedOrderActions:

  approveOrder: async function(orderId, notes = '') {
    if (!notes) {
      notes = prompt('Add approval notes (optional):');
    }

    if (!confirm('Approve this order? This will assign it to the supply team for processing.')) {
      return;
    }

    try {
      window.setLoading(true);

      // Get the order being approved
      const order = window.orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Get supply team member for assignment
      const supplyMember = await window.getSupplyTeamMember();

      // Update order with approval and supply assignment
      const updateData = {
        ...order,
        status: 'approved',
        assigned_to: supplyMember,
        assigned_team: 'supply',
        approved_by: window.user.email,
        approved_date: new Date().toISOString(),
        approval_notes: notes,
        original_assignee: order.original_assignee || order.created_by,
        updated_date: new Date().toISOString()
      };

      // Call the API to update the order
      const response = await window.apiCall(`/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Update local state
      const updatedOrder = response.data || updateData;
      window.setOrders(prev => prev.map(o => 
        o.id === orderId ? updatedOrder : o
      ));

      // ADDED: Create receivable for payment_post_service orders
      let receivableCreated = false;
      if (order.order_type === 'payment_post_service') {
        console.log('Creating receivable for payment_post_service order:', order.order_number);
        
        const expectedAmount = parseFloat(
          order.expected_amount || 
          order.final_amount || 
          order.total_amount || 
          0
        );
        
        if (expectedAmount > 0) {
          const receivableData = {
            order_id: order.id,
            lead_id: order.lead_id,
            client_name: order.client_name || order.legal_name,
            invoice_number: order.invoice_number || order.order_number,
            amount: expectedAmount,
            expected_amount: expectedAmount,
            balance_amount: expectedAmount,
            due_date: order.expected_payment_date || new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
            expected_payment_date: order.expected_payment_date || new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
            assigned_to: order.original_assignee || order.created_by,
            status: 'pending',
            payment_status: 'pending',
            notes: 'Payment post service - ' + (order.description || ''),
            created_date: new Date().toISOString(),
            created_by: window.user.email
          };

          try {
            console.log('Creating receivable with data:', receivableData);
            const receivableResponse = await window.apiCall('/receivables', {
              method: 'POST',
              body: JSON.stringify(receivableData)
            });

            if (receivableResponse.error) {
              console.error('Failed to create receivable:', receivableResponse.error);
            } else {
              console.log('✅ Receivable created successfully:', receivableResponse);
              receivableCreated = true;
              
              // Update local receivables state
              if (window.setReceivables) {
                window.setReceivables(prev => [...prev, receivableResponse.data || receivableResponse]);
              }
              
              // Refresh financial data
              if (window.fetchFinancialData) {
                await window.fetchFinancialData();
              }
            }
          } catch (receivableError) {
            console.error('Error creating receivable:', receivableError);
          }
        }
      }

      // Refresh My Actions if available
      if (window.fetchMyActions) {
        await window.fetchMyActions();
      }

      // Show success message with receivable info if applicable
      let alertMessage = `✅ Order approved successfully!\n\nOrder: ${order.order_number}\nAssigned to: ${supplyMember}\nStatus: Approved`;
      
      if (order.order_type === 'payment_post_service') {
        if (receivableCreated) {
          alertMessage += `\n\n💰 Receivable created for post-service payment.`;
        } else {
          alertMessage += `\n\n⚠️ Please create receivable manually for post-service payment.`;
        }
      }
      
      alert(alertMessage);

    } catch (error) {
      console.error('Error approving order:', error);
      alert(`Failed to approve order: ${error.message}`);
    } finally {
      window.setLoading(false);
    }
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

    try {
      window.setLoading(true);

      const order = window.orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const updateData = {
        ...order,
        status: 'rejected',
        assigned_to: order.original_assignee || order.created_by,
        assigned_team: 'sales',
        rejected_by: window.user.email,
        rejected_date: new Date().toISOString(),
        rejection_reason: reason,
        updated_date: new Date().toISOString()
      };

      const response = await window.apiCall(`/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Update local state
      const updatedOrder = response.data || updateData;
      window.setOrders(prev => prev.map(o => 
        o.id === orderId ? updatedOrder : o
      ));

      alert(`❌ Order rejected and reassigned to ${updateData.assigned_to}`);

    } catch (error) {
      console.error('❌ Error rejecting order:', error);
      alert(`Failed to reject order: ${error.message}`);
    } finally {
      window.setLoading(false);
    }
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
      }, '👁️')
    );
  }

  // Status-specific actions
  switch (order.status) {
    case 'pending_approval':
      // Show Proforma Invoice for payment_post_service orders
      if ((order.invoice_type === 'proforma' || order.order_type === 'payment_post_service') && 
          hasPermission('orders', 'read')) {
        actions.push(
          React.createElement('button', {
            key: 'proforma-invoice',
            onClick: () => window.viewInvoice(order),
            className: 'px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200',
            title: 'View Proforma Invoice'
          }, '📄')
        );
      }
      
      // Finance manager actions for pending orders
      if (hasPermission('orders', 'approve') && 
          (window.user?.role === 'finance_manager' || window.user?.role === 'finance_executive' || window.user?.role === 'super_admin')) {
        actions.push(
          React.createElement('button', {
            key: 'approve',
            onClick: () => window.enhancedOrderActions.approveOrder(order.id),
            className: 'px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200',
            title: 'Approve this order and auto-assign to supply team'
          }, '✅'),
          
          React.createElement('button', {
            key: 'reject',
            onClick: () => window.enhancedOrderActions.rejectOrder(order.id),
            className: 'px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200',
            title: 'Reject this order and return to original sales person'
          }, '❌')
        );
      }
      break;

    case 'approved':
    case 'assigned':
    case 'service_assigned':
      // Actions for approved orders
      if (hasPermission('orders', 'read')) {
        actions.push(
          React.createElement('button', {
            key: 'invoice',
            onClick: () => window.viewInvoice(order),
            className: 'px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200',
            title: 'View/Generate Tax Invoice'
          }, '📄')
        );
      }

        // ADD JOURNEY BUTTON HERE
// Journey Experience button
if (hasPermission('orders', 'write')) {
  actions.push(
    React.createElement('button', {
      key: 'journey',
      onClick: () => {
        console.log('Journey button clicked for order:', order.id);
        
        // Remove any existing modal
        const existing = document.getElementById('journey-modal-container');
        if (existing) existing.remove();
        
        // Create new modal
        const div = document.createElement('div');
        div.id = 'journey-modal-container';
        document.body.appendChild(div);
        
        ReactDOM.render(
          React.createElement(window.JourneyGenerator, {
            order: order,
            onClose: () => {
              ReactDOM.unmountComponentAtNode(div);
              div.remove();
            }
          }),
          div
        );
      },
      className: 'px-2 py-1 text-xs bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded hover:from-yellow-600 hover:to-yellow-700',
      title: 'Generate Premium Journey'
    }, '✨')
  );
}

      if (hasPermission('orders', 'assign')) {
        actions.push(
          React.createElement('button', {
            key: 'assign',
            onClick: () => window.assignOrderToSupplyTeam(order.id),
            className: 'px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200',
            title: 'Assign to supply team and create delivery record'
          }, '➡️')
        );
      }
      break;

    case 'payment_received':
      // Show invoice button for payment_received orders
      if (hasPermission('orders', 'read')) {
        actions.push(
          React.createElement('button', {
            key: 'invoice',
            onClick: () => window.viewInvoice(order),
            className: 'px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200',
            title: order.invoice_type === 'proforma' ? 'View Proforma Invoice' : 'View Tax Invoice'
          }, '📄')
        );
      }

      // If not assigned, show assign button
      if (hasPermission('orders', 'assign') && (!order.assigned_to || order.assigned_to === 'Unassigned')) {
        actions.push(
          React.createElement('button', {
            key: 'assign',
            onClick: () => window.assignOrderToSupplyTeam(order.id),
            className: 'px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200',
            title: 'Assign to supply team and create delivery record'
          }, '➡️')
        );
      }

      // Show complete button
      if (hasPermission('orders', 'write')) {
        actions.push(
          React.createElement('button', {
            key: 'complete',
            onClick: () => window.completeOrder(order.id),
            className: 'px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200',
            title: 'Mark as completed'
          }, '✅')
        );
      }
      break;

    case 'in_progress':
      // Actions for in-progress orders
      if (hasPermission('orders', 'write')) {
        actions.push(
          React.createElement('button', {
            key: 'complete',
            onClick: () => window.completeOrder(order.id),
            className: 'px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200',
            title: 'Mark as completed'
          }, '✅')
        );
      }
      break;

    case 'rejected':
      // Actions for rejected orders
      actions.push(
        React.createElement('span', {
          key: 'rejected-status',
          className: 'px-2 py-1 text-xs bg-red-100 text-red-700 rounded cursor-help',
          title: order.rejection_reason || 'Order was rejected'
        }, '❌')
      );
      break;

    case 'completed':
    case 'delivered':
      // Show invoice for completed orders
      if (hasPermission('orders', 'read')) {
        actions.push(
          React.createElement('button', {
            key: 'invoice',
            onClick: () => window.viewInvoice(order),
            className: 'px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200',
            title: 'View Invoice'
          }, '📄')
        );
      }

      // Journey Experience button for completed orders
      if (hasPermission('orders', 'write')) {
        actions.push(
          React.createElement('button', {
            key: 'journey',
            onClick: () => {
              console.log('Journey button clicked for order:', order.id);
              
              // Remove any existing modal
              const existing = document.getElementById('journey-modal-container');
              if (existing) existing.remove();
              
              // Create new modal
              const div = document.createElement('div');
              div.id = 'journey-modal-container';
              document.body.appendChild(div);
              
              ReactDOM.render(
                React.createElement(window.JourneyGenerator, {
                  order: order,
                  onClose: () => {
                    ReactDOM.unmountComponentAtNode(div);
                    div.remove();
                  }
                }),
                div
              );
            },
            className: 'px-2 py-1 text-xs bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded hover:from-yellow-600 hover:to-yellow-700',
            title: 'Generate Premium Journey'
          }, '✨')
        );
      }
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
      }, '✏️')
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
      }, '↩️')
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
      }, '🗑️')
    );
  }

  return actions;
};

// =============================================================================
// INTEGRATION WITH LEAD STATUS UPDATES
// =============================================================================

window.integrateOrderCreationWithLeadStatus = function() {
  // Store original updateLeadStatus function
  const originalUpdateLeadStatus = window.updateLeadStatus;
  
  // Enhanced updateLeadStatus with order creation
  window.updateLeadStatus = async function(leadId, newStatus) {
    //console.log('🔄 Enhanced lead status update:', leadId, newStatus);
    
    // Call original function first if it exists
    if (typeof originalUpdateLeadStatus === 'function') {
      await originalUpdateLeadStatus(leadId, newStatus);
    } else {
      console.error('❌ originalUpdateLeadStatus is not a function:', typeof originalUpdateLeadStatus);
      throw new Error('updateLeadStatus function not available');
    }
  };
  
  //console.log('🔗 Order creation integrated with lead status updates');
};

// =============================================================================
// INITIALIZATION
// =============================================================================

// Auto-initialize when loaded
window.addEventListener('load', () => {
  // Use longer timeout to ensure lead-status-management.js is loaded first
  setTimeout(() => {
    // Integrate with existing system only if updateLeadStatus function is available
    if (window.updateLeadStatus && typeof window.updateLeadStatus === 'function') {
      console.log('🔗 Integrating order creation with lead status updates');
      window.integrateOrderCreationWithLeadStatus();
    } else {
      console.warn('⚠️ updateLeadStatus function not available for integration');
    }
    
    // Replace existing order actions renderer if it exists
    if (window.renderOrderActions) {
      window.renderOrderActions = window.renderEnhancedOrderActions;
    }
    
    //console.log('✅ Enhanced order workflow integration completed');
  }, 2000);
});

//console.log('✅ Order Actions Integration for Enhanced Workflow loaded successfully');
//console.log("✅ ENHANCED: Orders component with search filters and pagination loaded successfully");

// =============================================================================
// CSV EXPORT FUNCTIONALITY
// =============================================================================

window.exportOrdersToCSV = function(orders) {
  console.log('📥 Exporting orders to CSV:', orders.length);
  
  // Define CSV headers
  const headers = [
    'Order ID',
    'Order Number',
    'Event ID',
    'Client Name',
    'Client Phone',
    'Event Name',
    'Event Date',
    'Total Amount',
    'Currency',
    'Status',
    'Payment Status',
    'Payment Terms',
    'Order Type',
    'Invoice Type',
    'Finance Invoice Number',
    'Sales Person',
    'Assigned To',
    'Original Assignee',
    'Created Date',
    'Created By',
    'Notes'
  ];
  
  // Convert orders to CSV rows
  const rows = orders.map(order => [
    order.id || '',
    order.order_number || '',
    order.event_id || '',
    order.client_name || '',
    order.client_phone || '',
    order.event_name || '',
    order.event_date || '',
    order.total_amount || '0',
    order.currency || order.payment_currency || 'INR',  // Use actual currency field
    order.status || '',
    order.payment_status || '',
    order.payment_terms || '',
    order.order_type || '',
    order.invoice_type || '',
    order.finance_invoice_number || '',
    order.sales_person || '',
    order.assigned_to || '',
    order.original_assignee || '',
    order.created_date || '',
    order.created_by || '',
    (order.notes || '').replace(/"/g, '""') // Escape quotes in notes
  ]);
  
  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log('✅ CSV export completed');
};

// =============================================================================
// CSV IMPORT FUNCTIONALITY FOR INVOICE NUMBERS
// =============================================================================

window.showInvoiceCSVImport = function() {
  console.log('📤 Opening invoice CSV import modal');
  
  // Create modal container
  const modalContainer = document.createElement('div');
  modalContainer.id = 'invoice-csv-import-modal';
  modalContainer.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
  
  // Modal content
  modalContainer.innerHTML = `
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Import Finance Invoice Numbers</h3>
        
        <div class="mt-2 mb-4">
          <p class="text-sm text-gray-500 mb-2">
            Upload a CSV file with two columns:
          </p>
          <ul class="text-sm text-gray-500 list-disc list-inside mb-4">
            <li>Order ID</li>
            <li>Finance Invoice Number</li>
          </ul>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <input type="file" id="invoice-csv-file" accept=".csv" 
                   class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
                          file:rounded-full file:border-0 file:text-sm file:font-semibold 
                          file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
          </div>
          
          <div class="mb-4">
            <a href="#" id="download-sample-csv" class="text-sm text-blue-600 hover:text-blue-800">
              📥 Download Sample CSV Template
            </a>
          </div>
        </div>
        
        <div class="flex justify-end gap-2">
          <button id="cancel-import" class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
            Cancel
          </button>
          <button id="upload-csv" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Upload & Import
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modalContainer);
  
  // Event handlers
  document.getElementById('cancel-import').addEventListener('click', () => {
    modalContainer.remove();
  });
  
  document.getElementById('download-sample-csv').addEventListener('click', (e) => {
    e.preventDefault();
    const sampleCSV = 'Order ID,Finance Invoice Number\n1001,FIN-INV-2024-001\n1002,FIN-INV-2024-002';
    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'invoice_import_template.csv';
    link.click();
  });
  
  document.getElementById('upload-csv').addEventListener('click', async () => {
    const fileInput = document.getElementById('invoice-csv-file');
    const file = fileInput.files[0];
    
    if (!file) {
      alert('Please select a CSV file');
      return;
    }
    
    try {
      const text = await file.text();
      const rows = text.split('\n').map(row => row.trim()).filter(row => row);
      
      if (rows.length < 2) {
        alert('CSV file must have headers and at least one data row');
        return;
      }
      
      // Parse CSV (skip header row)
      const updates = [];
      for (let i = 1; i < rows.length; i++) {
        const [orderId, invoiceNumber] = rows[i].split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
        if (orderId && invoiceNumber) {
          updates.push({ order_id: orderId, finance_invoice_number: invoiceNumber });
        }
      }
      
      if (updates.length === 0) {
        alert('No valid data found in CSV');
        return;
      }
      
      // Send to backend
      await window.updateFinanceInvoiceNumbers(updates);
      
      modalContainer.remove();
      
      // Refresh orders
      if (window.loadOrders) {
        window.loadOrders();
      }
      
    } catch (error) {
      console.error('Error processing CSV:', error);
      alert('Error processing CSV file: ' + error.message);
    }
  });
};

// Function to update finance invoice numbers via API
window.updateFinanceInvoiceNumbers = async function(updates) {
  console.log('📤 Updating finance invoice numbers:', updates);
  
  try {
    const response = await fetch('/api/orders/update-finance-invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({ updates })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update invoice numbers');
    }
    
    const result = await response.json();
    console.log('✅ Invoice numbers updated:', result);
    
    alert(`Successfully updated ${result.updated} invoice numbers`);
    
  } catch (error) {
    console.error('❌ Error updating invoice numbers:', error);
    alert('Error updating invoice numbers: ' + error.message);
    throw error;
  }
};

// Bulk approve orders function
window.bulkApproveOrders = async function(orderIds) {
  console.log('🚀 Starting bulk approval for orders:', orderIds);
  
  if (!window.hasPermission('orders', 'approve')) {
    alert('You do not have permission to approve orders');
    return;
  }
  
  window.setLoading(true);
  
  try {
    // Filter only pending_approval orders
    const pendingOrders = window.orders.filter(o => 
      orderIds.includes(o.id) && o.status === 'pending_approval'
    );
    
    if (pendingOrders.length === 0) {
      alert('No pending approval orders found in selection');
      window.setLoading(false);
      return;
    }
    
    console.log(`📋 Processing ${pendingOrders.length} pending orders for approval`);
    
    const results = {
      approved: [],
      failed: [],
      deliveries: [],
      assignments: []
    };
    
    // Process each order
    for (const order of pendingOrders) {
      try {
        console.log(`Processing order ${order.order_number}...`);
        
        // Step 1: Approve the order
        const approvedBy = window.user?.email || window.currentUser?.email || 
                          (window.user?.id || window.currentUser?.id) || 'admin';
        
        console.log(`📝 Approving order ${order.id} by ${approvedBy}`);
        
        const approvalData = {
          status: 'approved',
          approved_by: approvedBy,
          approved_date: new Date().toISOString(),
          approval_notes: 'Bulk approved'
        };
        
        console.log('📤 Sending approval data:', approvalData);
        
        const approvalResponse = await window.apiCall(`/orders/${order.id}`, {
          method: 'PUT',
          body: approvalData
        });
        
        console.log(`📥 Order ${order.id} approval response:`, approvalResponse);
        
        if (!approvalResponse || approvalResponse.error) {
          throw new Error(approvalResponse?.error || 'Failed to approve order');
        }
        
        results.approved.push(order.order_number);
        
        // Step 2: Generate invoice if required
        if (order.requires_gst_invoice) {
          console.log('📄 Generating invoice for order:', order.order_number);
          
          try {
            const invoiceNumber = 'STTS/INV/' + new Date().getFullYear() + '/' + String(Date.now()).slice(-6);
            
            const newInvoice = {
              invoice_number: invoiceNumber,
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
              invoice_items: order.invoice_items,
              base_amount: order.base_amount,
              gst_amount: order.gst_amount,
              igst_amount: order.igst_amount,
              cgst_amount: order.cgst_amount,
              sgst_amount: order.sgst_amount,
              tcs_amount: order.tcs_amount,
              total_amount: order.total_amount,
              exchange_rate: order.exchange_rate,
              payment_currency: order.payment_currency || 'INR',
              invoice_date: new Date().toISOString().split('T')[0],
              invoice_status: 'issued'
            };
            
            const invoiceResponse = await window.apiCall('/invoices', {
              method: 'POST',
              body: newInvoice
            });
            
            if (invoiceResponse && !invoiceResponse.error) {
              console.log('✅ Invoice created:', invoiceNumber);
            }
          } catch (invoiceError) {
            console.error('❌ Invoice generation failed:', invoiceError);
            // Continue with the process even if invoice fails
          }
        }
        
        // Step 3: Assign to supply team and create delivery record
        try {
          console.log('🚚 Creating delivery record and assigning to supply team...');
          
          // Get supply team member
          const assignee = await window.getSupplyTeamMember();
          
          if (assignee) {
            // Update order assignment
            const assignmentData = {
              assigned_to: assignee,
              status: 'service_assigned',
              assigned_date: new Date().toISOString(),
              assignment_notes: 'Auto-assigned during bulk approval'
            };
            
            const assignResponse = await window.apiCall(`/orders/${order.id}`, {
              method: 'PUT',
              body: assignmentData
            });
            
            if (assignResponse && !assignResponse.error) {
              results.assignments.push(order.order_number);
            }
            
            // Create delivery record
            const createdBy = window.user?.email || window.currentUser?.email || 
                             (window.user?.id || window.currentUser?.id) || 'admin';
            
            const newDelivery = {
              order_id: order.id,
              order_number: order.order_number,
              client_name: order.client_name,
              client_email: order.client_email,
              client_phone: order.client_phone,
              event_name: order.event_name || 'N/A',
              event_date: order.event_date || new Date().toISOString().split('T')[0],
              tickets_count: order.tickets_allocated || 0,
              amount: order.total_amount || 0,
              status: 'pending',
              assigned_to: assignee,
              assigned_date: new Date().toISOString(),
              payment_currency: order.payment_currency || 'INR',
              created_by: createdBy,
              created_date: new Date().toISOString()
            };
            
            const deliveryResponse = await window.apiCall('/deliveries', {
              method: 'POST',
              body: newDelivery
            });
            
            if (deliveryResponse && !deliveryResponse.error) {
              results.deliveries.push(order.order_number);
              console.log('✅ Delivery record created for order:', order.order_number);
            }
          }
        } catch (assignError) {
          console.error('❌ Assignment/delivery failed:', assignError);
          // Continue with the process
        }
        
      } catch (orderError) {
        console.error(`❌ Failed to process order ${order.order_number}:`, orderError);
        results.failed.push({
          order: order.order_number,
          error: orderError.message
        });
      }
    }
    
    // Update local state - refresh orders
    if (window.fetchData && typeof window.fetchData === 'function') {
      await window.fetchData();
    } else if (window.setOrders && typeof window.setOrders === 'function') {
      // Manually refresh orders
      try {
        const response = await window.apiCall('/orders');
        window.setOrders(response.data || []);
        window.orders = response.data || [];
      } catch (error) {
        console.error('Failed to refresh orders:', error);
      }
    }
    
    // Show results summary
    let message = `Bulk Approval Complete!\n\n`;
    message += `✅ Approved: ${results.approved.length} orders\n`;
    if (results.assignments.length > 0) {
      message += `👥 Assigned to supply team: ${results.assignments.length} orders\n`;
    }
    if (results.deliveries.length > 0) {
      message += `🚚 Delivery records created: ${results.deliveries.length}\n`;
    }
    if (results.failed.length > 0) {
      message += `\n❌ Failed: ${results.failed.length} orders\n`;
      results.failed.forEach(f => {
        message += `  - ${f.order}: ${f.error}\n`;
      });
    }
    
    alert(message);
    
  } catch (error) {
    console.error('❌ Bulk approval error:', error);
    alert('Error during bulk approval: ' + error.message);
  } finally {
    window.setLoading(false);
  }
};
