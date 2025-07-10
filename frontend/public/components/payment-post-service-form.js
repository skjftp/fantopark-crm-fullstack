// Payment Post Service Form Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

window.renderPaymentPostServiceForm = () => {
  // ✅ COMPONENT INTEGRATION PATTERN: Extract state from window globals
  const {
    showPaymentPostServiceForm = window.showPaymentPostServiceForm,
    currentLead = window.currentLead,
    paymentPostServiceData = window.paymentPostServiceData || {},
    loading = window.loading
  } = window.appState || {};

  // ✅ COMPONENT INTEGRATION PATTERN: Function references with fallbacks
  const handlePaymentPostServiceSubmit = window.handlePaymentPostServiceSubmit || ((e) => {
    e.preventDefault();
    console.warn("⚠️ handlePaymentPostServiceSubmit not implemented");
  });

  const handlePaymentPostServiceInputChange = window.handlePaymentPostServiceInputChange || ((field, value) => {
    console.warn("⚠️ handlePaymentPostServiceInputChange not implemented:", field, value);
  });

  const closeForm = window.closeForm || (() => {
    console.warn("⚠️ closeForm not implemented");
  });

  if (!showPaymentPostServiceForm || !currentLead) return null;

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => e.target === e.currentTarget && closeForm()
  },
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[95vh] overflow-y-auto' },
      React.createElement('div', { className: 'flex justify-between items-center mb-6' },
        React.createElement('h2', { className: 'text-xl font-bold text-gray-900 dark:text-white' }, 
          'Payment Post Service: ' + (currentLead.name)
        ),
        React.createElement('button', {
          onClick: closeForm,
          className: 'text-gray-400 hover:text-gray-600 text-2xl'
        }, '✕')
      ),

      React.createElement('div', { className: 'mb-4 p-4 bg-purple-50 rounded-lg' },
        React.createElement('p', { className: 'text-sm text-purple-800' }, 
          '📅 This option allows service delivery before payment collection. The order will require approval and payment will be tracked as receivable.'
        )
      ),

      React.createElement('form', { onSubmit: handlePaymentPostServiceSubmit },
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-6' },
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Expected Payment Amount (₹) - Inclusive of GST *'),
            React.createElement('input', {
              type: 'number',
              value: paymentPostServiceData.expected_amount || '',
              onChange: (e) => handlePaymentPostServiceInputChange('expected_amount', e.target.value),
              className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
              required: true,
              min: 0
            })
          ),
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Expected Payment Date *'),
            React.createElement('input', {
              type: 'date',
              value: paymentPostServiceData.expected_payment_date || '',
              onChange: (e) => handlePaymentPostServiceInputChange('expected_payment_date', e.target.value),
              className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
              required: true,
              min: new Date().toISOString().split('T')[0]
            })
          ),
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Service Date *'),
            React.createElement('input', {
              type: 'date',
              value: paymentPostServiceData.service_date || '',
              onChange: (e) => handlePaymentPostServiceInputChange('service_date', e.target.value),
              className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
              required: true
            })
          ),
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Payment Terms'),
            React.createElement('select', {
              value: paymentPostServiceData.payment_terms || '30 days',
              onChange: (e) => handlePaymentPostServiceInputChange('payment_terms', e.target.value),
              className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500'
            },
              React.createElement('option', { value: '7 days' }, '7 days'),
              React.createElement('option', { value: '15 days' }, '15 days'),
              React.createElement('option', { value: '30 days' }, '30 days'),
              React.createElement('option', { value: '45 days' }, '45 days'),
              React.createElement('option', { value: '60 days' }, '60 days'),
              React.createElement('option', { value: 'custom' }, 'Custom')
            )
          )
        ),

        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Service Details *'),
          React.createElement('textarea', {
            value: paymentPostServiceData.service_details || '',
            onChange: (e) => handlePaymentPostServiceInputChange('service_details', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
            rows: 3,
            required: true,
            placeholder: 'Describe the service to be delivered'
          })
        ),

        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Send Payment Reminder'),
          React.createElement('div', { className: 'flex items-center space-x-4' },
            React.createElement('select', {
              value: paymentPostServiceData.reminder_days || '7',
              onChange: (e) => handlePaymentPostServiceInputChange('reminder_days', e.target.value),
              className: 'px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
            },
              React.createElement('option', { value: '3' }, '3 days before'),
              React.createElement('option', { value: '7' }, '7 days before'),
              React.createElement('option', { value: '14' }, '14 days before'),
              React.createElement('option', { value: '30' }, '30 days before')
            ),
            React.createElement('span', { className: 'text-sm text-gray-600 dark:text-gray-400' }, 'payment due date')
          )
        ),

        React.createElement('div', { className: 'mb-6' },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Additional Notes'),
          React.createElement('textarea', {
            value: paymentPostServiceData.notes || '',
            onChange: (e) => handlePaymentPostServiceInputChange('notes', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
            rows: 3,
            placeholder: 'Any additional notes or special conditions'
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
            className: 'flex-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50'
          }, loading ? 'Creating...' : 'Create Payment Post Service Order')
        )
      )
    )
  );
};

console.log('✅ Payment Post Service Form component loaded successfully with window function references');
