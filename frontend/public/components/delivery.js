// ============================================================================
// DELIVERY COMPONENT - Extracted from index.html - FIXED INTEGRATION PATTERN
// ============================================================================
// This component manages delivery tracking and management with logistics,
// scheduling, and comprehensive delivery workflow processing.

// Main Delivery Content Renderer
window.renderDeliveryContent = () => {
    // ✅ EXTRACT FUNCTIONS WITH FALLBACKS (Fix integration pattern)
    const {
        openDeliveryForm = window.openDeliveryForm || (() => {
            console.warn("openDeliveryForm not implemented");
        }),
        deleteDelivery = window.deleteDelivery || (() => {
            console.warn("deleteDelivery not implemented");
        }),
        setDeliveries = window.setDeliveries || (() => {
            console.warn("setDeliveries not implemented");
        }),
        hasPermission = window.hasPermission || (() => false),
        loading = window.loading || false
    } = window.appState || {};

    // ✅ EXTRACT STATE VARIABLES WITH FALLBACKS (Fix integration pattern)
    const {
        deliveries = window.deliveries || [],
        showDeliveryScheduleModal = window.appState?.showDeliveryScheduleModal || false,
        currentDeliveryOrder = window.appState?.currentDeliveryOrder || null
    } = window.appState || {};

    const DELIVERY_STATUSES = {
        pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
        scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
        in_transit: { label: 'In Transit', color: 'bg-purple-100 text-purple-800' },
        delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800' },
        failed: { label: 'Failed', color: 'bg-red-100 text-red-800' }
    };

    // 🔍 DEBUG: Log delivery state
    console.log('🔍 DELIVERY DEBUG:');
    console.log('🔍 deliveries count:', (deliveries || []).length);
    console.log('🔍 hasPermission function available:', typeof hasPermission === 'function');
    console.log('🔍 openDeliveryForm function available:', typeof openDeliveryForm === 'function');

    return React.createElement('div', { className: 'space-y-6' },
        React.createElement('div', { className: 'flex justify-between items-center' },
            React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' }, 'Delivery Management'),
            React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-400' },
                'Track and manage ticket deliveries'
            )
        ),

        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow border' },
            (deliveries || []).length > 0 ? React.createElement('div', { className: 'overflow-x-auto' },
                React.createElement('table', { className: 'w-full' },
                    React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-900' },
                        React.createElement('tr', null,
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Delivery#'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Order Details'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Client'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Type'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Assigned To'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Status'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
                        )
                    ),
                    React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
                        (deliveries || []).map(delivery => {
                            const status = DELIVERY_STATUSES[delivery.status] || { label: delivery.status, color: 'bg-gray-100 text-gray-800' };

                            return React.createElement('tr', { key: delivery.id, className: 'hover:bg-gray-50' },
                                React.createElement('td', { className: 'px-6 py-4' },
                                    React.createElement('div', { className: 'text-sm font-medium text-gray-900' }, delivery.delivery_number),
                                    React.createElement('div', { className: 'text-xs text-gray-500' }, 
                                        new Date(delivery.created_date).toLocaleDateString()
                                    )
                                ),
                                React.createElement('td', { className: 'px-6 py-4' },
                                    React.createElement('div', { className: 'text-sm text-gray-900' }, delivery.order_number),
                                    React.createElement('div', { className: 'text-xs text-gray-500' }, delivery.event_name),
                                    React.createElement('div', { className: 'text-xs text-blue-600' }, 
                                        (delivery.tickets_count) + ' tickets'
                                    )
                                ),
                                React.createElement('td', { className: 'px-6 py-4' },
                                    React.createElement('div', { className: 'text-sm font-medium text-gray-900' }, delivery.client_name),
                                    React.createElement('div', { className: 'text-xs text-gray-500' }, delivery.client_phone)
                                ),
                                React.createElement('td', { className: 'px-6 py-4' },
                                    delivery.delivery_type ? React.createElement('span', {
                                        className: `px-2 py-1 text-xs rounded ${
                                            delivery.delivery_type === 'online' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                        }`
                                    }, delivery.delivery_type.charAt(0).toUpperCase() + delivery.delivery_type.slice(1)) :
                                    React.createElement('span', { className: 'text-xs text-gray-400' }, 'Not Set')
                                ),
                                React.createElement('td', { className: 'px-6 py-4' },
                                    React.createElement('div', { className: 'text-sm font-medium text-blue-600' }, delivery.assigned_to),
                                    React.createElement('div', { className: 'text-xs text-gray-500' }, 'Supply Team')
                                ),
                                React.createElement('td', { className: 'px-6 py-4' },
                                    React.createElement('span', {
                                        className: 'px-2 py-1 text-xs rounded ' + (status.color)
                                    }, status.label)
                                ),
                                React.createElement('td', { className: 'px-6 py-4' },
                                    React.createElement('div', { className: 'flex flex-wrap gap-1' },
                                        // ✅ FIXED: Schedule button with proper function reference and debug
                                        hasPermission('delivery', 'write') && delivery.status === 'pending' && 
                                        React.createElement('button', {
                                            className: 'text-blue-600 hover:text-blue-900 text-xs px-2 py-1 rounded border border-blue-200 hover:bg-blue-50',
                                            onClick: () => {
                                                console.log('🔍 Schedule button clicked for delivery:', delivery.id);
                                                console.log('🔍 openDeliveryForm function:', openDeliveryForm);
                                                openDeliveryForm(delivery);
                                            }
                                        }, '📅 Schedule'),

                                        // ✅ FIXED: Delete button with proper function reference
                                        hasPermission('delivery', 'write') && 
                                        React.createElement('button', {
                                            className: 'text-red-600 hover:text-red-900 text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50',
                                            onClick: () => {
                                                console.log('🔍 Delete button clicked for delivery:', delivery.id);
                                                deleteDelivery(delivery.id);
                                            },
                                            disabled: loading
                                        }, '🗑️ Delete'),

                                        // ✅ FIXED: Start Transit button with proper function reference
                                        hasPermission('delivery', 'write') && delivery.status === 'scheduled' && 
                                        React.createElement('button', {
                                            className: 'text-purple-600 hover:text-purple-900 text-xs px-2 py-1 rounded border border-purple-200 hover:bg-purple-50',
                                            onClick: () => {
                                                console.log('🔍 Start Transit button clicked for delivery:', delivery.id);
                                                setDeliveries(prev => 
                                                    prev.map(d => 
                                                        d.id === delivery.id 
                                                            ? { ...d, status: 'in_transit' }
                                                            : d
                                                    )
                                                );
                                                alert('Delivery marked as in transit!');
                                            }
                                        }, '🚚 Start'),

                                        // ✅ FIXED: Complete button with proper function reference
                                        hasPermission('delivery', 'write') && delivery.status === 'in_transit' && 
                                        React.createElement('button', {
                                            className: 'text-green-600 hover:text-green-900 text-xs px-2 py-1 rounded border border-green-200 hover:bg-green-50',
                                            onClick: () => {
                                                console.log('🔍 Complete button clicked for delivery:', delivery.id);
                                                setDeliveries(prev => 
                                                    prev.map(d => 
                                                        d.id === delivery.id 
                                                            ? { ...d, status: 'delivered', delivered_date: new Date().toISOString().split('T')[0] }
                                                            : d
                                                    )
                                                );
                                                alert('Delivery completed successfully!');
                                            }
                                        }, '✅ Complete'),

                                        // ✅ FIXED: View Details button with enhanced functionality
                                        delivery.status === 'scheduled' && delivery.delivery_type && 
                                        React.createElement('button', {
                                            className: 'text-gray-600 hover:text-gray-900 text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50',
                                            onClick: () => {
                                                console.log('🔍 View Details button clicked for delivery:', delivery.id);
                                                let details = 'Delivery Type: ' + (delivery.delivery_type) + '\n';
                                                if (delivery.delivery_type === 'online') {
                                                    details += 'Platform: ' + (delivery.online_platform) + '\n';
                                                    details += 'Link: ' + (delivery.online_link);
                                                } else {
                                                    details += 'Delivery Location: ' + (delivery.delivery_location) + '\n';
                                                    details += 'Date: ' + (delivery.delivery_date) + ' ' + (delivery.delivery_time);
                                                    if (delivery.pickup_location) {
                                                        details += '\nPickup: ' + (delivery.pickup_location);
                                                    }
                                                }
                                                alert(details);
                                            }
                                        }, '👁️ View Details')
                                    )
                                )
                            );
                        })
                    )
                )
            ) : React.createElement('div', { className: 'p-6 text-center text-gray-500' }, 
                'No deliveries found. Deliveries will appear here when orders are assigned to supply team.'
            )
        )
    );
};

console.log('✅ Delivery component loaded successfully - INTEGRATION PATTERN APPLIED');

// ============================================================================
// DELIVERY FORM COMPONENT - Optimized Version
// ============================================================================

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
      window.log.debug("closeForm not implemented - using fallback");
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
      window.log.debug(`📝 Delivery field changed: ${field} = ${value}`);
      setDeliveryFormData(prev => ({
        ...prev,
        [field]: value
      }));
    })
  } = window.appState || {};

<<<<<<< HEAD
  // ✅ OPTIMIZED: Only log when form state changes (not every render)
  if (!showDeliveryForm || !currentDelivery) {
    // Only log once when state changes
    if (ENABLE_DELIVERY_DEBUG && !window._deliveryFormLoggedHidden) {
      window.log.debug('❌ Not showing delivery form:', { 
        showDeliveryForm, 
        hasDelivery: !!currentDelivery 
      });
      window._deliveryFormLoggedHidden = true;
    }
    return null;
  }

=======
>>>>>>> 952b6d3e5250ff9a1bfbccb005f0098608997206
  // Reset the hidden flag when form is showing
  window._deliveryFormLoggedHidden = false;

  // ✅ OPTIMIZED: Only log essential info on form show
  window.log.debug('📦 Delivery form rendering for order:', currentDelivery?.order_id);
  window.log.debug('📋 Current form data:', deliveryFormData);

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => {
      if (e.target === e.currentTarget) {
        window.log.debug("🔄 Clicked outside, closing delivery form");
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

// ============================================================================
// DELIVERY HANDLERS
// ============================================================================

// Enhanced delivery input change handler with throttling
let deliveryInputTimeout;
window.handleDeliveryInputChange = (field, value) => {
  clearTimeout(deliveryInputTimeout);
  deliveryInputTimeout = setTimeout(() => {
    window.log.debug(`📝 Delivery field changed: ${field} = ${value}`);
    
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
      window.log.debug("⚠️ setDeliveryFormData not available, using fallback");
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
    window.log.debug('🔄 Creating delivery schedule...', window.deliveryFormData);

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

window.log.debug('✅ Optimized Delivery Form component loaded');
console.log('🚚 Delivery Form v2.0 - Performance Optimized');
