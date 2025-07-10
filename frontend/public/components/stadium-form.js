// Stadium Form Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

window.renderStadiumForm = () => {
  if (!showStadiumForm) return null;

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
  },
    React.createElement('div', {
      className: 'bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto'
    },
      React.createElement('div', { className: 'flex justify-between items-center mb-6' },
        React.createElement('h2', { className: 'text-xl font-bold text-gray-900 dark:text-white' },
          editingStadium ? `Edit Stadium: ${editingStadium.name}` : 'Add New Stadium'
        ),
        React.createElement('button', {
          onClick: closeStadiumForm,
          className: 'text-gray-400 hover:text-gray-600 text-2xl'
        }, '✕')
      ),

      React.createElement('form', { onSubmit: handleStadiumFormSubmit },
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
          window.stadiumFormFields.map(field =>
            React.createElement('div', {
              key: field.name,
              className: field.type === 'textarea' ? 'md:col-span-2' : ''
            },
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' },
                field.label + (field.required ? ' *' : '')
              ),
              field.type === 'select' ?
              React.createElement('select', {
                value: stadiumFormData[field.name] || '',
                onChange: (e) => handleStadiumInputChange(field.name, e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                required: field.required
              },
                React.createElement('option', { value: '' }, `Select ${field.label}`),
                field.options.map(option =>
                  React.createElement('option', { key: option, value: option }, option)
                )
              ) :
              field.type === 'textarea' ?
              React.createElement('textarea', {
                value: stadiumFormData[field.name] || '',
                onChange: (e) => handleStadiumInputChange(field.name, e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                rows: 3,
                placeholder: field.placeholder,
                required: field.required
              }) :
              React.createElement('input', {
                type: field.type,
                value: stadiumFormData[field.name] || '',
                onChange: (e) => handleStadiumInputChange(field.name, e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                required: field.required,
                placeholder: field.placeholder,
                min: field.type === 'number' ? 0 : undefined
              })
            )
          )
        ),
        React.createElement('div', { className: 'flex space-x-4 mt-6 pt-4 border-t border-gray-200' },
          React.createElement('button', {
            type: 'button',
            onClick: closeStadiumForm,
            className: 'flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700'
          }, 'Cancel'),
          React.createElement('button', {
            type: 'submit',
            disabled: loading,
            className: 'flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50'
          }, loading ? 'Saving...' : (editingStadium ? 'Update Stadium' : 'Add Stadium'))
        )
      )
    )
  );
};

console.log('✅ Stadium Form component loaded successfully');
