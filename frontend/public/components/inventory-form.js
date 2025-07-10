// Inventory Form Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

window.renderInventoryForm = () => {
  if (!window.showInventoryForm || !window.editingInventory) return null;

  // Check if opened from payables (payment context)
  const isFromPayables = editingInventory._payableContext?.fromPayables;
  const payableAmount = editingInventory._payableContext?.payableAmount || 0;

  const title = isFromPayables 
    ? '💰 Update Payment Status - ' + (editingInventory.event_name || 'Event')
    : (editingInventory.id ? 'Edit Event - ' + (editingInventory.event_name || 'Event') : 'Add New Event');

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => e.target === e.currentTarget && closeInventoryForm()
  },
    React.createElement('div', { 
      className: 'bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto'
    },
      React.createElement('div', { className: 'flex justify-between items-center mb-6' },
        React.createElement('h2', { className: 'text-xl font-bold text-gray-900 dark:text-white' }, title),
        React.createElement('button', {
          onClick: closeInventoryForm,
          className: 'text-gray-400 hover:text-gray-600 text-2xl'
        }, '✕')
      ),

      React.createElement('form', { onSubmit: handleInventoryFormSubmit },
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' },
          inventoryFormFields.map(field =>
            React.createElement('div', { 
              key: field.name,
              className: field.type === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''
            },
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                field.label + (field.required ? ' *' : '')
              ),
              React.createElement('div', {
                className: isFromPayables && ['totalPurchaseAmount', 'amountPaid', 'paymentStatus'].includes(field.name) 
                  ? 'ring-2 ring-blue-500 rounded-lg p-1' : ''
              },
                field.type === 'select' ?
                  React.createElement('select', {
                    value: formData[field.name] || '',
                    onChange: (e) => handleFormDataChange(field.name, e.target.value),
                    className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                    required: field.required
                  },
                    React.createElement('option', { value: '' }, 'Select ' + field.label),
                    // Handle dynamic options for venue (stadiums)
                    field.name === 'venue' ? 
                      stadiums.map(stadium => 
                        React.createElement('option', { 
                          key: stadium.id, 
                          value: stadium.name 
                        }, `${stadium.name} - ${stadium.city}`)
                      ) :
                      // Regular static options for other fields
                      (field.options && field.options !== 'dynamic' ? field.options : []).map(option =>
                        React.createElement('option', { key: option, value: option }, 
                          (typeof option === 'string' ? option.charAt(0).toUpperCase() + option.slice(1) : option).replace('_', ' ')
                        )
                      )
                  ) :
                  field.type === 'textarea' ?
                    React.createElement('textarea', {
                      value: formData[field.name] || '',
                      onChange: (e) => handleFormDataChange(field.name, e.target.value),
                      className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                      rows: 3,
                      required: field.required,
                      placeholder: field.placeholder || ''
                    }) :
                    React.createElement('input', {
                      type: field.type,
                      value: formData[field.name] || '',
                      onChange: (e) => handleFormDataChange(field.name, e.target.value),
                      className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                      required: field.required,
                      placeholder: field.placeholder || '',
                      min: field.min || undefined
                    })
              )
            )
          )
        ),
        React.createElement('div', { className: 'flex space-x-4 mt-8 pt-6 border-t border-gray-200' },
          React.createElement('button', {
            type: 'button',
            onClick: closeInventoryForm,
            className: 'flex-1 px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 font-medium'
          }, 'Cancel'),
          React.createElement('button', {
            type: 'submit',
            disabled: loading,
            className: 'flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium'
          }, loading ? (editingInventory.id ? 'Updating...' : 'Creating...') : (isFromPayables ? 'Update Payment' : (editingInventory.id ? 'Save Changes' : 'Create Event')))
        )
      )
    )
  );
};

console.log('✅ Inventory Form component loaded successfully');
