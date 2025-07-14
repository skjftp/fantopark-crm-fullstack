// Simplified Inventory Form - No React Hooks
// This version uses existing patterns from your codebase

window.renderInventoryForm = () => {
  // Access state from window globals
  const showInventoryForm = window.showInventoryForm || window.appState?.showInventoryForm;
  const editingInventory = window.editingInventory || window.appState?.editingInventory;
  const formData = window.formData || window.appState?.formData || {};
  const loading = window.loading || window.appState?.loading;
  const stadiums = window.stadiums || window.appState?.stadiums || [];
  
  // Early return if form should not show
  if (!showInventoryForm) return null;

  // Function references
  const closeInventoryForm = window.closeInventoryForm || (() => {
    console.warn("closeInventoryForm not implemented");
  });
  
  const handleFormDataChange = window.handleFormDataChange || ((field, value) => {
    console.warn("handleFormDataChange not implemented");
  });
  
  const handleInventoryFormSubmit = window.handleInventoryFormSubmit || ((e) => {
    e.preventDefault();
    console.warn("handleInventoryFormSubmit not implemented");
  });

  const title = editingInventory?.id ? 
    `Edit Event - ${editingInventory.event_name || 'Event'}` : 
    'Add New Event';

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => e.target === e.currentTarget && closeInventoryForm()
  },
    React.createElement('div', { 
      className: 'bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto'
    },
      // Header
      React.createElement('div', { className: 'flex justify-between items-center mb-6' },
        React.createElement('h2', { className: 'text-xl font-bold text-gray-900 dark:text-white' }, title),
        React.createElement('button', {
          onClick: closeInventoryForm,
          className: 'text-gray-400 hover:text-gray-600 text-2xl'
        }, '✕')
      ),

      React.createElement('form', { onSubmit: handleInventoryFormSubmit },
        // Event Basic Information
        React.createElement('div', { className: 'mb-6' },
          React.createElement('h3', { className: 'text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200' }, 
            '📅 Event Information'
          ),
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
            // Event Name
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 
                'Event Name *'
              ),
              React.createElement('input', {
                type: 'text',
                value: formData.event_name || '',
                onChange: (e) => handleFormDataChange('event_name', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                required: true,
                placeholder: 'e.g., Abu Dhabi Grand Prix'
              })
            ),
            
            // Venue
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 
                'Venue *'
              ),
              React.createElement('select', {
                value: formData.venue || '',
                onChange: (e) => handleFormDataChange('venue', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                required: true
              },
                React.createElement('option', { value: '' }, 'Select Venue'),
                stadiums.map(stadium => 
                  React.createElement('option', { 
                    key: stadium.id, 
                    value: stadium.name 
                  }, `${stadium.name} - ${stadium.city}`)
                )
              )
            ),
            
            // Event Date
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 
                'Event Date *'
              ),
              React.createElement('input', {
                type: 'date',
                value: formData.event_date || '',
                onChange: (e) => handleFormDataChange('event_date', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                required: true
              })
            ),
            
            // Sports
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 
                'Sports *'
              ),
              React.createElement('select', {
                value: formData.sports || '',
                onChange: (e) => handleFormDataChange('sports', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                required: true
              },
                React.createElement('option', { value: '' }, 'Select Sport'),
                ['Football', 'Formula 1', 'Cricket', 'Tennis', 'Basketball', 'Rugby', 'Golf'].map(sport =>
                  React.createElement('option', { key: sport, value: sport }, sport)
                )
              )
            )
          )
        ),

        // NEW: Single Category Section (simplified for now)
        React.createElement('div', { className: 'mb-6' },
          React.createElement('h3', { className: 'text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200' }, 
            '🎫 Ticket Information'
          ),
          React.createElement('div', { className: 'bg-blue-50 dark:bg-blue-900 p-3 rounded mb-4' },
            React.createElement('p', { className: 'text-sm text-blue-800 dark:text-blue-200' },
              '💡 Note: You can now add multiple ticket categories (General, Premium, VIP, etc.) for a single event!'
            )
          ),
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
            // Total Tickets
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 
                'Total Tickets *'
              ),
              React.createElement('input', {
                type: 'number',
                value: formData.total_tickets || '',
                onChange: (e) => handleFormDataChange('total_tickets', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                required: true,
                min: '0'
              })
            ),

            // Available Tickets
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 
                'Available Tickets *'
              ),
              React.createElement('input', {
                type: 'number',
                value: formData.available_tickets || '',
                onChange: (e) => handleFormDataChange('available_tickets', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                required: true,
                min: '0'
              })
            ),

            // Buying Price
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 
                'Buying Price *'
              ),
              React.createElement('input', {
                type: 'number',
                value: formData.buyingPrice || formData.buying_price || '',
                onChange: (e) => handleFormDataChange('buyingPrice', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                required: true,
                min: '0',
                step: '0.01'
              })
            ),

            // Selling Price
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 
                'Selling Price *'
              ),
              React.createElement('input', {
                type: 'number',
                value: formData.sellingPrice || formData.selling_price || '',
                onChange: (e) => handleFormDataChange('sellingPrice', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                required: true,
                min: '0',
                step: '0.01'
              })
            )
          )
        ),

        // Additional Fields
        React.createElement('div', { className: 'mb-6' },
          React.createElement('h3', { className: 'text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200' }, 
            '📝 Additional Information'
          ),
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
            // Event Type
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 
                'Event Type'
              ),
              React.createElement('select', {
                value: formData.event_type || '',
                onChange: (e) => handleFormDataChange('event_type', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500'
              },
                React.createElement('option', { value: '' }, 'Select Type'),
                ['match', 'tournament', 'concert', 'exhibition'].map(type =>
                  React.createElement('option', { key: type, value: type }, 
                    type.charAt(0).toUpperCase() + type.slice(1)
                  )
                )
              )
            ),

            // Booking Person
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 
                'Booking Person'
              ),
              React.createElement('input', {
                type: 'text',
                value: formData.booking_person || '',
                onChange: (e) => handleFormDataChange('booking_person', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                placeholder: 'Person responsible for booking'
              })
            ),

            // Notes (full width)
            React.createElement('div', { className: 'md:col-span-2' },
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 
                'Notes'
              ),
              React.createElement('textarea', {
                value: formData.notes || '',
                onChange: (e) => handleFormDataChange('notes', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                rows: 3,
                placeholder: 'Any additional notes about this event'
              })
            )
          )
        ),

        // Form Actions
        React.createElement('div', { className: 'flex space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-600' },
          React.createElement('button', {
            type: 'button',
            onClick: closeInventoryForm,
            className: 'flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 font-medium'
          }, 'Cancel'),
          React.createElement('button', {
            type: 'submit',
            disabled: loading,
            className: 'flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium'
          }, loading ? 'Saving...' : (editingInventory?.id ? 'Update Event' : 'Create Event'))
        )
      )
    )
  );
};

console.log('✅ Simple Inventory Form loaded successfully - no hooks version');
