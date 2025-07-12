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

deliveryLog('✅ Optimized Delivery Form component loaded');
console.log('🚚 Delivery Form v2.0 - Performance Optimized');
