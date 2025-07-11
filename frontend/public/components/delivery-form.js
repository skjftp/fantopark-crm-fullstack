// ============================================================================
// DELIVERY FORM COMPONENT - Extracted from index.html with Integration Pattern
// ============================================================================
// This component manages delivery scheduling and configuration forms

// Main Delivery Form Renderer
window.renderDeliveryForm = () => {
  // ✅ EXTRACT STATE FROM APP STATE (Fix integration pattern)
  const {
    showDeliveryForm = false,
    currentDelivery = null,
    deliveryFormData = {},
    setCurrentDelivery = window.setCurrentDelivery || (() => {}),
    setShowDeliveryForm = window.setShowDeliveryForm || (() => {}),
    setDeliveryFormData = window.setDeliveryFormData || (() => {}),
    closeForm = window.closeForm || (() => {
      console.warn("closeForm not implemented");
    }),
    loading = false
  } = window.appState || {};

  // ✅ EXTRACT FUNCTIONS WITH FALLBACKS (Fix integration pattern)
  const {
    handleDeliverySubmit = window.handleDeliverySubmit || (async (e) => {
      e.preventDefault();
      console.warn("handleDeliverySubmit not implemented");
      alert("Delivery form submission will be implemented in next update!");
    }),
    handleDeliveryInputChange = window.handleDeliveryInputChange || ((field, value) => {
      console.log(`📝 Delivery field changed: ${field} = ${value}`);
      setDeliveryFormData(prev => ({
        ...prev,
        [field]: value
      }));
    })
  } = window.appState || {};

  // 🔍 DEBUG: Log delivery form state
  console.log('🔍 DELIVERY FORM DEBUG:');
  console.log('🔍 showDeliveryForm:', showDeliveryForm);
  console.log('🔍 currentDelivery:', currentDelivery);
  console.log('🔍 deliveryFormData:', deliveryFormData);

  if (!showDeliveryForm || !currentDelivery) {
    console.log('❌ Not showing delivery form:', { showDeliveryForm, hasDelivery: !!currentDelivery });
    return null;
  }

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => e.target === e.currentTarget && closeForm()
  },
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[95vh] overflow-y-auto' },
      React.createElement('div', { className: 'flex justify-between items-center mb-6' },
        React.createElement('h2', { className: 'text-xl font-bold text-gray-900 dark:text-white' }, 
          'Schedule Delivery: ' + (currentDelivery.order_number)
        ),
        React.createElement('button', {
          onClick: closeForm,
          className: 'text-gray-400 hover:text-gray-600 text-2xl'
        }, '✕')
      ),

      // Order Details Section
      React.createElement('div', { className: 'mb-6 p-4 bg-gray-50 rounded-lg' },
        React.createElement('h3', { className: 'text-lg font-semibold text-gray-800 mb-3' }, '📋 Order Details'),
        React.createElement('div', { className: 'grid grid-cols-2 gap-4 text-sm' },
          React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700' }, 'Client: '),
            React.createElement('span', { className: 'text-gray-900' }, currentDelivery.client_name)
          ),
          React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700' }, 'Event: '),
            React.createElement('span', { className: 'text-gray-900' }, currentDelivery.event_name)
          ),
          React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700' }, 'Tickets: '),
            React.createElement('span', { className: 'text-gray-900' }, currentDelivery.tickets_count)
          ),
          React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700' }, 'Event Date: '),
            React.createElement('span', { className: 'text-gray-900' }, 
              new Date(currentDelivery.event_date).toLocaleDateString()
            )
          )
        )
      ),

      React.createElement('form', { onSubmit: handleDeliverySubmit },
        // Delivery Type Selection
        React.createElement('div', { className: 'mb-6' },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Delivery Type *'),
          React.createElement('div', { className: 'flex space-x-4' },
            React.createElement('label', { className: 'flex items-center' },
              React.createElement('input', {
                type: 'radio',
                name: 'delivery_type',
                value: 'online',
                checked: deliveryFormData.delivery_type === 'online',
                onChange: (e) => handleDeliveryInputChange('delivery_type', e.target.value),
                className: 'mr-2'
              }),
              React.createElement('span', { className: 'text-sm' }, 'Online Delivery')
            ),
            React.createElement('label', { className: 'flex items-center' },
              React.createElement('input', {
                type: 'radio',
                name: 'delivery_type',
                value: 'offline',
                checked: deliveryFormData.delivery_type === 'offline',
                onChange: (e) => handleDeliveryInputChange('delivery_type', e.target.value),
                className: 'mr-2'
              }),
              React.createElement('span', { className: 'text-sm' }, 'Offline Delivery')
            )
          )
        ),

        // Online Delivery Fields
        deliveryFormData.delivery_type === 'online' && React.createElement('div', { className: 'mb-6 p-4 bg-blue-50 rounded-lg' },
          React.createElement('h4', { className: 'text-md font-semibold text-gray-800 mb-3' }, '💻 Online Delivery Details'),
          React.createElement('div', { className: 'grid grid-cols-1 gap-4' },
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Platform *'),
              React.createElement('select', {
                value: deliveryFormData.online_platform || '',
                onChange: (e) => handleDeliveryInputChange('online_platform', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                required: deliveryFormData.delivery_type === 'online'
              },
                React.createElement('option', { value: '' }, 'Select Platform'),
                React.createElement('option', { value: 'email' }, 'Email'),
                React.createElement('option', { value: 'whatsapp' }, 'WhatsApp'),
                React.createElement('option', { value: 'portal' }, 'Client Portal'),
                React.createElement('option', { value: 'other' }, 'Other')
              )
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Delivery Link/Details'),
              React.createElement('input', {
                type: 'text',
                value: deliveryFormData.online_link || '',
                onChange: (e) => handleDeliveryInputChange('online_link', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                placeholder: 'Enter link or delivery details'
              })
            )
          )
        ),

        // Offline Delivery Fields
        deliveryFormData.delivery_type === 'offline' && React.createElement('div', { className: 'mb-6 p-4 bg-green-50 rounded-lg' },
          React.createElement('h4', { className: 'text-md font-semibold text-gray-800 mb-3' }, '🚚 Offline Delivery Details'),
          React.createElement('div', { className: 'grid grid-cols-1 gap-4' },
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Pickup Location (Optional)'),
              React.createElement('textarea', {
                value: deliveryFormData.pickup_location || '',
                onChange: (e) => handleDeliveryInputChange('pickup_location', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                rows: 2,
                placeholder: 'Enter pickup location if tickets need to be collected'
              })
            ),
            React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Pickup Date'),
                React.createElement('input', {
                  type: 'date',
                  value: deliveryFormData.pickup_date || '',
                  onChange: (e) => handleDeliveryInputChange('pickup_date', e.target.value),
                  className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500'
                })
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Pickup Time'),
                React.createElement('input', {
                  type: 'time',
                  value: deliveryFormData.pickup_time || '',
                  onChange: (e) => handleDeliveryInputChange('pickup_time', e.target.value),
                  className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500'
                })
              )
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Delivery Location *'),
              React.createElement('textarea', {
                value: deliveryFormData.delivery_location || '',
                onChange: (e) => handleDeliveryInputChange('delivery_location', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                rows: 2,
                placeholder: 'Enter delivery address',
                required: deliveryFormData.delivery_type === 'offline'
              })
            ),
            React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Delivery Date *'),
                React.createElement('input', {
                  type: 'date',
                  value: deliveryFormData.delivery_date || '',
                  onChange: (e) => handleDeliveryInputChange('delivery_date', e.target.value),
                  className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                  required: deliveryFormData.delivery_type === 'offline'
                })
              ),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Delivery Time'),
                React.createElement('input', {
                  type: 'time',
                  value: deliveryFormData.delivery_time || '',
                  onChange: (e) => handleDeliveryInputChange('delivery_time', e.target.value),
                  className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500'
                })
              )
            )
          )
        ),

        // Common Fields
        React.createElement('div', { className: 'mb-6' },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Delivery Notes'),
          React.createElement('textarea', {
            value: deliveryFormData.delivery_notes || '',
            onChange: (e) => handleDeliveryInputChange('delivery_notes', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
            rows: 3,
            placeholder: 'Any special instructions or notes'
          })
        ),

        React.createElement('div', { className: 'flex space-x-4 pt-4 border-t' },
          React.createElement('button', {
            type: 'button',
            onClick: closeForm,
            className: 'flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50'
          }, 'Cancel'),
          React.createElement('button', {
            type: 'submit',
            disabled: loading,
            className: 'flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50'
          }, loading ? 'Scheduling...' : 'Schedule Delivery')
        )
      )
    )
  );
};

console.log('✅ Delivery Form component loaded successfully with complete functionality');
