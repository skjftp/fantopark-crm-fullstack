// ===============================================
// OPTIMIZED DELIVERY FORM COMPONENT - PERFORMANCE ENHANCED
// ===============================================
// Delivery Form Component for FanToPark CRM
// Reduced logging and improved performance

// Conditional logging control
const ENABLE_DELIVERY_DEBUG = false; // Set to false to reduce logs
const deliveryLog = ENABLE_DELIVERY_DEBUG ? console.log : () => {};

// Main Delivery Form Renderer - OPTIMIZED
window.renderDeliveryForm = () => {
  // ✅ EXTRACT STATE FROM APP STATE (Optimized pattern)
  const {
    showDeliveryForm = false,
    currentDelivery = null,
    deliveryFormData = {},
    setCurrentDelivery = window.setCurrentDelivery || (() => {}),
    setShowDeliveryForm = window.setShowDeliveryForm || (() => {}),
    setDeliveryFormData = window.setDeliveryFormData || (() => {}),
    closeForm = window.closeForm || (() => {
      deliveryLog("closeForm not implemented - using fallback");
      setShowDeliveryForm(false);
    }),
    loading = false
  } = window.appState || {};

  // ✅ EXTRACT FUNCTIONS WITH FALLBACKS
  const {
    handleDeliverySubmit = window.handleDeliverySubmit || (async (e) => {
      e.preventDefault();
      console.warn("handleDeliverySubmit not implemented");
      alert("Delivery form submission will be implemented in next update!");
    }),
    handleDeliveryInputChange = window.handleDeliveryInputChange || ((field, value) => {
      deliveryLog(`📝 Delivery field changed: ${field} = ${value}`);
      setDeliveryFormData(prev => ({
        ...prev,
        [field]: value
      }));
    })
  } = window.appState || {};

  // ✅ OPTIMIZED: Only log when form state changes (not every render)
  if (!showDeliveryForm || !currentDelivery) {
    // Only log once when state changes
    if (ENABLE_DELIVERY_DEBUG && !window._deliveryFormLoggedHidden) {
      deliveryLog('❌ Not showing delivery form:', { 
        showDeliveryForm, 
        hasDelivery: !!currentDelivery 
      });
      window._deliveryFormLoggedHidden = true;
    }
    return null;
  }

  // Reset the hidden flag when form is showing
  window._deliveryFormLoggedHidden = false;

  // ✅ OPTIMIZED: Only log essential info on form show
  deliveryLog('📦 Delivery form rendering for order:', currentDelivery?.order_id);
  deliveryLog('📋 Current form data:', deliveryFormData);

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => {
      if (e.target === e.currentTarget) {
        deliveryLog("🔄 Clicked outside, closing delivery form");
        closeForm();
      }
    }
  },
    React.createElement('div', {
      className: 'bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto'
    },
      React.createElement('div', { className: 'flex justify-between items-center mb-6' },
        React.createElement('h2', { className: 'text-xl font-bold text-gray-900 dark:text-white' },
          `Schedule Delivery - Order #${currentDelivery.order_id || 'N/A'}`
        ),
        React.createElement('button', {
          onClick: closeForm,
          className: 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl'
        }, '✕')
      ),

      // Order Information Summary
      React.createElement('div', { className: 'bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6' },
        React.createElement('div', { className: 'grid grid-cols-2 gap-4 text-sm' },
          React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'Client: '),
            React.createElement('span', { className: 'text-gray-900 dark:text-white' }, 
              currentDelivery.client_name || 'N/A'
            )
          ),
          React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'Event: '),
            React.createElement('span', { className: 'text-gray-900 dark:text-white' }, 
              currentDelivery.event_name || 'N/A'
            )
          ),
          React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'Quantity: '),
            React.createElement('span', { className: 'text-gray-900 dark:text-white font-bold' }, 
              currentDelivery.quantity || 0
            )
          ),
          React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'Amount: '),
            React.createElement('span', { className: 'text-green-600 dark:text-green-400 font-bold' }, 
              `₹${(currentDelivery.total_amount || 0).toLocaleString()}`
            )
          )
        )
      ),

      React.createElement('form', { onSubmit: handleDeliverySubmit },
        // Delivery Type Selection
        React.createElement('div', { className: 'mb-6' },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' },
            'Delivery Type'
          ),
          React.createElement('select', {
            value: deliveryFormData.delivery_type || 'online',
            onChange: (e) => handleDeliveryInputChange('delivery_type', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
            required: true
          },
            React.createElement('option', { value: 'online' }, 'Online (Email/WhatsApp)'),
            React.createElement('option', { value: 'offline' }, 'Offline (Physical/Pickup)')
          )
        ),

        // Conditional Fields Based on Delivery Type
        deliveryFormData.delivery_type === 'online' ? 
          // Online Delivery Fields
          React.createElement('div', { className: 'space-y-4 mb-6' },
            React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' },
                  'Delivery Method'
                ),
                React.createElement('select', {
                  value: deliveryFormData.delivery_method || 'email',
                  onChange: (e) => handleDeliveryInputChange('delivery_method', e.target.value),
                  className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500'
                },
                  React.createElement('option', { value: 'email' }, 'Email'),
                  React.createElement('option', { value: 'whatsapp' }, 'WhatsApp'),
                  React.createElement('option', { value: 'both' }, 'Both Email & WhatsApp')
                )
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' },
                  'Contact Details'
                ),
                React.createElement('input', {
                  type: 'text',
                  value: deliveryFormData.contact_details || currentDelivery.client_email || '',
                  onChange: (e) => handleDeliveryInputChange('contact_details', e.target.value),
                  className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                  placeholder: 'Email or phone number',
                  required: true
                })
              )
            )
          ) :
          // Offline Delivery Fields
          React.createElement('div', { className: 'space-y-4 mb-6' },
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' },
                'Delivery Address'
              ),
              React.createElement('textarea', {
                value: deliveryFormData.delivery_address || '',
                onChange: (e) => handleDeliveryInputChange('delivery_address', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                rows: 3,
                placeholder: 'Enter complete delivery address...',
                required: deliveryFormData.delivery_type === 'offline'
              })
            ),
            React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' },
                  'Delivery Date'
                ),
                React.createElement('input', {
                  type: 'date',
                  value: deliveryFormData.delivery_date || '',
                  onChange: (e) => handleDeliveryInputChange('delivery_date', e.target.value),
                  className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                  required: deliveryFormData.delivery_type === 'offline'
                })
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' },
                  'Delivery Time'
                ),
                React.createElement('input', {
                  type: 'time',
                  value: deliveryFormData.delivery_time || '',
                  onChange: (e) => handleDeliveryInputChange('delivery_time', e.target.value),
                  className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500'
                })
              )
            )
          ),

        // Common Fields
        React.createElement('div', { className: 'mb-6' },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' },
            'Delivery Notes'
          ),
          React.createElement('textarea', {
            value: deliveryFormData.delivery_notes || '',
            onChange: (e) => handleDeliveryInputChange('delivery_notes', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
            rows: 3,
            placeholder: 'Any special instructions or notes'
          })
        ),

        React.createElement('div', { className: 'flex space-x-4 pt-4 border-t dark:border-gray-600' },
          React.createElement('button', {
            type: 'button',
            onClick: closeForm,
            className: 'flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-300'
          }, 'Cancel'),
          React.createElement('button', {
            type: 'submit',
            disabled: loading,
            className: 'flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium'
          }, loading ? 'Scheduling...' : 'Schedule Delivery')
        )
      )
    )
  );
};

// ✅ OPTIMIZED DELIVERY HANDLERS

// Enhanced delivery input change handler with throttling
let deliveryInputTimeout;
window.handleDeliveryInputChange = (field, value) => {
  clearTimeout(deliveryInputTimeout);
  deliveryInputTimeout = setTimeout(() => {
    deliveryLog(`📝 Delivery field changed: ${field} = ${value}`);
    
    if (window.setDeliveryFormData) {
      window.setDeliveryFormData(prev => ({
        ...prev,
        [field]: value
      }));
    } else {
      // Fallback: update window globals directly
      window.deliveryFormData = window.deliveryFormData || {};
      window.deliveryFormData[field] = value;
      if (window.appState) {
        window.appState.deliveryFormData = window.deliveryFormData;
      }
      deliveryLog("⚠️ setDeliveryFormData not available, using fallback");
    }
  }, 100); // Throttle input changes
};

// Enhanced delivery submission handler
window.handleDeliverySubmit = async (e) => {
  e.preventDefault();

  // Permission check
  if (!window.hasPermission('orders', 'manage_delivery')) {
    alert('You do not have permission to schedule deliveries');
    return;
  }

  // Validation
  if (!window.deliveryFormData.delivery_type) {
    alert('Please select a delivery type');
    return;
  }

  if (window.deliveryFormData.delivery_type === 'offline' && !window.deliveryFormData.delivery_address) {
    alert('Please enter delivery address for offline delivery');
    return;
  }

  if (window.deliveryFormData.delivery_type === 'online' && !window.deliveryFormData.contact_details) {
    alert('Please enter contact details for online delivery');
    return;
  }

  window.setLoading(true);

  try {
    deliveryLog('🔄 Creating delivery schedule...', window.deliveryFormData);

    const deliveryRequest = {
      order_id: window.currentDelivery.order_id,
      delivery_type: window.deliveryFormData.delivery_type,
      delivery_method: window.deliveryFormData.delivery_method,
      contact_details: window.deliveryFormData.contact_details,
      delivery_address: window.deliveryFormData.delivery_address,
      delivery_date: window.deliveryFormData.delivery_date,
      delivery_time: window.deliveryFormData.delivery_time,
      delivery_notes: window.deliveryFormData.delivery_notes,
      status: 'scheduled',
      scheduled_by: window.user?.email || 'Unknown',
      scheduled_date: new Date().toISOString()
    };

    const response = await window.apiCall('/deliveries', {
      method: 'POST',
      body: JSON.stringify(deliveryRequest)
    });

    if (response.error) {
      throw new Error(response.error);
    }

    // Update order status to indicate delivery is scheduled
    if (window.setOrders) {
      window.setOrders(prev => prev.map(order =>
        order.id === window.currentDelivery.order_id
          ? { ...order, delivery_status: 'scheduled' }
          : order
      ));
    }

    alert('Delivery scheduled successfully!');
    window.closeForm();

  } catch (error) {
    console.error('Delivery scheduling error:', error);
    alert('Error scheduling delivery: ' + error.message);
  } finally {
    window.setLoading(false);
  }
};

// Main Delivery Content Renderer - THE MISSING FUNCTION
window.renderDeliveryContent = () => {
  console.log('🚚 Rendering Delivery Content');

  // Get state from app or use defaults
  const {
    deliveries = [],
    setDeliveries = window.setDeliveries || (() => {}),
    loading = false,
    setLoading = window.setLoading || (() => {}),
    user = window.user,
    activeTab = window.activeTab
  } = window.appState || {};

  // Initialize deliveries state if not exists
  React.useEffect(() => {
    if (!window.deliveries) {
      window.deliveries = [];
    }
  }, []);

  // Local state for delivery management
  const [deliveryFilters, setDeliveryFilters] = React.useState({
    searchQuery: '',
    statusFilter: 'all',
    deliveryDateFilter: '',
    assignedToFilter: 'all'
  });

  const [deliveryPagination, setDeliveryPagination] = React.useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0
  });

  const [showDeliveryFilters, setShowDeliveryFilters] = React.useState(false);
  const [selectedDeliveries, setSelectedDeliveries] = React.useState([]);

  // Fetch deliveries function
  const fetchDeliveries = React.useCallback(async () => {
    if (!window.hasPermission('delivery', 'read')) {
      console.log('❌ No permission to fetch deliveries');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Fetching deliveries...');
      const response = await window.apiCall('/deliveries');
      
      if (response.error) {
        throw new Error(response.error);
      }

      const deliveriesData = response.data || [];
      setDeliveries(deliveriesData);
      window.deliveries = deliveriesData;
      
      // Update pagination
      setDeliveryPagination(prev => ({
        ...prev,
        totalItems: deliveriesData.length,
        totalPages: Math.ceil(deliveriesData.length / prev.itemsPerPage)
      }));

      console.log('✅ Deliveries fetched:', deliveriesData.length);
    } catch (error) {
      console.error('❌ Error fetching deliveries:', error);
      // Set empty array as fallback
      setDeliveries([]);
      window.deliveries = [];
    } finally {
      setLoading(false);
    }
  }, [setDeliveries, setLoading]);

  // Fetch deliveries on component mount
  React.useEffect(() => {
    if (activeTab === 'delivery') {
      fetchDeliveries();
    }
  }, [activeTab, fetchDeliveries]);

  // Filter and paginate deliveries
  const filteredDeliveries = React.useMemo(() => {
    let filtered = deliveries || [];

    // Apply search filter
    if (deliveryFilters.searchQuery) {
      const query = deliveryFilters.searchQuery.toLowerCase();
      filtered = filtered.filter(delivery =>
        (delivery.order_id && delivery.order_id.toString().includes(query)) ||
        (delivery.customer_name && delivery.customer_name.toLowerCase().includes(query)) ||
        (delivery.delivery_address && delivery.delivery_address.toLowerCase().includes(query)) ||
        (delivery.contact_details && delivery.contact_details.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (deliveryFilters.statusFilter !== 'all') {
      filtered = filtered.filter(delivery => delivery.status === deliveryFilters.statusFilter);
    }

    // Apply assigned to filter
    if (deliveryFilters.assignedToFilter !== 'all') {
      filtered = filtered.filter(delivery => delivery.assigned_to === deliveryFilters.assignedToFilter);
    }

    // Apply date filter
    if (deliveryFilters.deliveryDateFilter) {
      filtered = filtered.filter(delivery => {
        const deliveryDate = new Date(delivery.delivery_date);
        const filterDate = new Date(deliveryFilters.deliveryDateFilter);
        return deliveryDate.toDateString() === filterDate.toDateString();
      });
    }

    return filtered;
  }, [deliveries, deliveryFilters]);

  // Get current page deliveries
  const currentDeliveries = React.useMemo(() => {
    const startIndex = (deliveryPagination.currentPage - 1) * deliveryPagination.itemsPerPage;
    const endIndex = startIndex + deliveryPagination.itemsPerPage;
    return filteredDeliveries.slice(startIndex, endIndex);
  }, [filteredDeliveries, deliveryPagination.currentPage, deliveryPagination.itemsPerPage]);

  // Handle delivery status update
  const handleStatusUpdate = async (deliveryId, newStatus) => {
    if (!window.hasPermission('delivery', 'update')) {
      alert('You do not have permission to update delivery status');
      return;
    }

    try {
      setLoading(true);
      const response = await window.apiCall(`/deliveries/${deliveryId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Update local state
      setDeliveries(prev => prev.map(delivery =>
        delivery.id === deliveryId ? { ...delivery, status: newStatus } : delivery
      ));

      console.log('✅ Delivery status updated:', deliveryId, newStatus);
    } catch (error) {
      console.error('❌ Error updating delivery status:', error);
      alert('Error updating delivery status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle delivery deletion
  const handleDeleteDelivery = async (deliveryId) => {
    if (!window.hasPermission('delivery', 'delete')) {
      alert('You do not have permission to delete deliveries');
      return;
    }

    if (!confirm('Are you sure you want to delete this delivery?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await window.apiCall(`/deliveries/${deliveryId}`, {
        method: 'DELETE'
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Update local state
      setDeliveries(prev => prev.filter(delivery => delivery.id !== deliveryId));
      console.log('✅ Delivery deleted:', deliveryId);
    } catch (error) {
      console.error('❌ Error deleting delivery:', error);
      alert('Error deleting delivery: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Get status badge style
  const getStatusBadgeStyle = (status) => {
    const styles = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'scheduled': 'bg-blue-100 text-blue-800',
      'in_transit': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'failed': 'bg-red-100 text-red-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  // Format date display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Render main delivery content
  return React.createElement('div', { className: 'space-y-6' },
    // Header
    React.createElement('div', { className: 'flex justify-between items-center' },
      React.createElement('div', null,
        React.createElement('h1', { className: 'text-2xl font-bold text-gray-900 dark:text-white' }, 'Delivery Management'),
        React.createElement('p', { className: 'text-gray-600 dark:text-gray-400' }, 
          `Manage and track all deliveries (${filteredDeliveries.length} total)`
        )
      ),
      React.createElement('div', { className: 'flex space-x-3' },
        React.createElement('button', {
          onClick: () => setShowDeliveryFilters(!showDeliveryFilters),
          className: 'px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200'
        }, showDeliveryFilters ? 'Hide Filters' : 'Show Filters'),
        React.createElement('button', {
          onClick: fetchDeliveries,
          className: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
        }, 'Refresh')
      )
    ),

    // Filters (if shown)
    showDeliveryFilters && React.createElement('div', { 
      className: 'bg-white dark:bg-gray-800 p-4 rounded-lg shadow border' 
    },
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-4' },
        // Search Query
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Search'),
          React.createElement('input', {
            type: 'text',
            value: deliveryFilters.searchQuery,
            onChange: (e) => setDeliveryFilters(prev => ({ ...prev, searchQuery: e.target.value })),
            placeholder: 'Search deliveries...',
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
          })
        ),
        
        // Status Filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Status'),
          React.createElement('select', {
            value: deliveryFilters.statusFilter,
            onChange: (e) => setDeliveryFilters(prev => ({ ...prev, statusFilter: e.target.value })),
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
          },
            React.createElement('option', { value: 'all' }, 'All Status'),
            React.createElement('option', { value: 'pending' }, 'Pending'),
            React.createElement('option', { value: 'scheduled' }, 'Scheduled'),
            React.createElement('option', { value: 'in_transit' }, 'In Transit'),
            React.createElement('option', { value: 'delivered' }, 'Delivered'),
            React.createElement('option', { value: 'cancelled' }, 'Cancelled')
          )
        ),

        // Assigned To Filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Assigned To'),
          React.createElement('select', {
            value: deliveryFilters.assignedToFilter,
            onChange: (e) => setDeliveryFilters(prev => ({ ...prev, assignedToFilter: e.target.value })),
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
          },
            React.createElement('option', { value: 'all' }, 'All Users'),
            React.createElement('option', { value: user?.email }, 'My Deliveries')
          )
        ),

        // Date Filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Delivery Date'),
          React.createElement('input', {
            type: 'date',
            value: deliveryFilters.deliveryDateFilter,
            onChange: (e) => setDeliveryFilters(prev => ({ ...prev, deliveryDateFilter: e.target.value })),
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
          })
        )
      )
    ),

    // Deliveries Table
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden' },
      // Table Header
      React.createElement('div', { className: 'px-6 py-4 border-b border-gray-200' },
        React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 dark:text-white' }, 
          `Deliveries (${currentDeliveries.length} of ${filteredDeliveries.length})`
        )
      ),

      // Table
      React.createElement('div', { className: 'overflow-x-auto' },
        React.createElement('table', { className: 'w-full' },
          React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-700' },
            React.createElement('tr', null,
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Order ID'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Customer'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Delivery Date'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Status'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Assigned To'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
            )
          ),
          React.createElement('tbody', { className: 'divide-y divide-gray-200 dark:divide-gray-700' },
            loading ? 
              React.createElement('tr', null,
                React.createElement('td', { colSpan: 6, className: 'px-6 py-8 text-center' },
                  React.createElement('div', { className: 'text-gray-500' }, 'Loading deliveries...')
                )
              ) :
            currentDeliveries.length > 0 ?
              currentDeliveries.map(delivery => 
                React.createElement('tr', { key: delivery.id, className: 'hover:bg-gray-50 dark:hover:bg-gray-600' },
                  React.createElement('td', { className: 'px-6 py-4 font-medium' }, 
                    '#' + (delivery.order_id || delivery.id)
                  ),
                  React.createElement('td', { className: 'px-6 py-4' }, 
                    delivery.customer_name || delivery.client_name || '-'
                  ),
                  React.createElement('td', { className: 'px-6 py-4' }, 
                    formatDate(delivery.delivery_date)
                  ),
                  React.createElement('td', { className: 'px-6 py-4' },
                    React.createElement('span', { 
                      className: `px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeStyle(delivery.status)}` 
                    }, delivery.status || 'pending')
                  ),
                  React.createElement('td', { className: 'px-6 py-4 text-sm' }, 
                    delivery.assigned_to || '-'
                  ),
                  React.createElement('td', { className: 'px-6 py-4' },
                    React.createElement('div', { className: 'flex space-x-2' },
                      React.createElement('button', {
                        onClick: () => handleStatusUpdate(delivery.id, 'delivered'),
                        className: 'text-green-600 hover:text-green-800 text-sm'
                      }, 'Mark Delivered'),
                      window.hasPermission('delivery', 'delete') && React.createElement('button', {
                        onClick: () => handleDeleteDelivery(delivery.id),
                        className: 'text-red-600 hover:text-red-800 text-sm'
                      }, 'Delete')
                    )
                  )
                )
              ) :
              React.createElement('tr', null,
                React.createElement('td', { colSpan: 6, className: 'px-6 py-8 text-center' },
                  React.createElement('div', { className: 'text-gray-500' }, 
                    filteredDeliveries.length === 0 ? 'No deliveries found' : 'No deliveries match the current filters'
                  )
                )
              )
          )
        )
      )
    ),

    // Pagination
    filteredDeliveries.length > deliveryPagination.itemsPerPage && React.createElement('div', { 
      className: 'flex justify-between items-center' 
    },
      React.createElement('div', { className: 'text-sm text-gray-600' },
        `Showing ${(deliveryPagination.currentPage - 1) * deliveryPagination.itemsPerPage + 1} to ${Math.min(deliveryPagination.currentPage * deliveryPagination.itemsPerPage, filteredDeliveries.length)} of ${filteredDeliveries.length} deliveries`
      ),
      React.createElement('div', { className: 'flex space-x-2' },
        React.createElement('button', {
          onClick: () => setDeliveryPagination(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) })),
          disabled: deliveryPagination.currentPage === 1,
          className: 'px-3 py-1 bg-gray-100 text-gray-700 rounded disabled:opacity-50'
        }, 'Previous'),
        React.createElement('span', { className: 'px-3 py-1' },
          `Page ${deliveryPagination.currentPage} of ${Math.ceil(filteredDeliveries.length / deliveryPagination.itemsPerPage)}`
        ),
        React.createElement('button', {
          onClick: () => setDeliveryPagination(prev => ({ ...prev, currentPage: Math.min(Math.ceil(filteredDeliveries.length / deliveryPagination.itemsPerPage), prev.currentPage + 1) })),
          disabled: deliveryPagination.currentPage >= Math.ceil(filteredDeliveries.length / deliveryPagination.itemsPerPage),
          className: 'px-3 py-1 bg-gray-100 text-gray-700 rounded disabled:opacity-50'
        }, 'Next')
      )
    )
  );
};
