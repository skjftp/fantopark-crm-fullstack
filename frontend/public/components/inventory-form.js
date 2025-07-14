// Enhanced Inventory Form Component with Multiple Ticket Categories
// Maintains all existing functionality while adding category support

window.renderInventoryForm = () => {
  const { useState, useEffect } = React;
  
  // Access state from window globals
  const {
    showInventoryForm = window.appState?.showInventoryForm || window.showInventoryForm,
    editingInventory = window.appState?.editingInventory || window.editingInventory,
    formData = window.appState?.formData || window.formData || {},
    loading = window.appState?.loading || window.loading,
    stadiums = window.appState?.stadiums || window.stadiums || []
  } = window.appState || {};

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

  // NEW: State for managing ticket categories
  const [categories, setCategories] = useState(() => {
    // If editing and has categories, use them
    if (editingInventory?.categories && editingInventory.categories.length > 0) {
      return editingInventory.categories;
    }
    // Otherwise start with one empty category
    return [{
      id: Date.now(),
      name: '',
      section: '',
      total_tickets: '',
      available_tickets: '',
      buying_price: '',
      selling_price: '',
      inclusions: ''
    }];
  });

  // NEW: Update formData when categories change
  useEffect(() => {
    if (window.setFormData) {
      window.setFormData(prev => ({
        ...prev,
        categories: categories
      }));
    }
  }, [categories]);

  // NEW: Add a new category
  const addCategory = () => {
    setCategories([...categories, {
      id: Date.now() + Math.random(), // Unique ID
      name: '',
      section: '',
      total_tickets: '',
      available_tickets: '',
      buying_price: '',
      selling_price: '',
      inclusions: ''
    }]);
  };

  // NEW: Remove a category
  const removeCategory = (index) => {
    if (categories.length > 1) {
      setCategories(categories.filter((_, i) => i !== index));
    } else {
      alert('You must have at least one ticket category');
    }
  };

  // NEW: Update a specific category field
  const updateCategory = (index, field, value) => {
    const updatedCategories = [...categories];
    updatedCategories[index] = {
      ...updatedCategories[index],
      [field]: value
    };
    setCategories(updatedCategories);
  };

  // NEW: Calculate totals across all categories
  const calculateTotals = () => {
    const totals = categories.reduce((acc, cat) => {
      const totalTickets = parseInt(cat.total_tickets) || 0;
      const availableTickets = parseInt(cat.available_tickets) || 0;
      const buyingPrice = parseFloat(cat.buying_price) || 0;
      const sellingPrice = parseFloat(cat.selling_price) || 0;
      
      return {
        totalTickets: acc.totalTickets + totalTickets,
        availableTickets: acc.availableTickets + availableTickets,
        totalCost: acc.totalCost + (buyingPrice * totalTickets),
        potentialRevenue: acc.potentialRevenue + (sellingPrice * totalTickets)
      };
    }, { totalTickets: 0, availableTickets: 0, totalCost: 0, potentialRevenue: 0 });
    
    return totals;
  };

  const totals = calculateTotals();

  if (!showInventoryForm) return null;

  // Check if from payables context (existing functionality)
  const isFromPayables = editingInventory?._payableContext?.fromPayables;
  const title = editingInventory?.id ? 
    `Edit Event - ${editingInventory.event_name || 'Event'}` : 
    'Add New Event';

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => e.target === e.currentTarget && closeInventoryForm()
  },
    React.createElement('div', { 
      className: 'bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto'
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

        // NEW: Ticket Categories Section
        React.createElement('div', { className: 'mb-6' },
          React.createElement('div', { className: 'flex justify-between items-center mb-4' },
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-800 dark:text-gray-200' }, 
              '🎫 Ticket Categories'
            ),
            React.createElement('button', {
              type: 'button',
              onClick: addCategory,
              className: 'bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm'
            }, '+ Add Category')
          ),

          // Categories List
          categories.map((category, index) => 
            React.createElement('div', { 
              key: category.id,
              className: 'bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4 border-2 border-gray-200 dark:border-gray-600'
            },
              // Category Header
              React.createElement('div', { className: 'flex justify-between items-center mb-3' },
                React.createElement('h4', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 
                  `Category ${index + 1}${category.name ? ': ' + category.name : ''}`
                ),
                categories.length > 1 && React.createElement('button', {
                  type: 'button',
                  onClick: () => removeCategory(index),
                  className: 'text-red-500 hover:text-red-700 text-sm'
                }, '🗑️ Remove')
              ),

              // Category Fields Grid
              React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3' },
                // Category Name
                React.createElement('div', null,
                  React.createElement('label', { className: 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1' }, 
                    'Category Name *'
                  ),
                  React.createElement('input', {
                    type: 'text',
                    value: category.name,
                    onChange: (e) => updateCategory(index, 'name', e.target.value),
                    className: 'w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded focus:ring-1 focus:ring-blue-500',
                    required: true,
                    placeholder: 'e.g., General, Premium, VIP'
                  })
                ),

                // Section
                React.createElement('div', null,
                  React.createElement('label', { className: 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1' }, 
                    'Section/Area'
                  ),
                  React.createElement('input', {
                    type: 'text',
                    value: category.section,
                    onChange: (e) => updateCategory(index, 'section', e.target.value),
                    className: 'w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded focus:ring-1 focus:ring-blue-500',
                    placeholder: 'e.g., North Grandstand'
                  })
                ),

                // Total Tickets
                React.createElement('div', null,
                  React.createElement('label', { className: 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1' }, 
                    'Total Tickets *'
                  ),
                  React.createElement('input', {
                    type: 'number',
                    value: category.total_tickets,
                    onChange: (e) => updateCategory(index, 'total_tickets', e.target.value),
                    className: 'w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded focus:ring-1 focus:ring-blue-500',
                    required: true,
                    min: '0'
                  })
                ),

                // Available Tickets
                React.createElement('div', null,
                  React.createElement('label', { className: 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1' }, 
                    'Available Tickets *'
                  ),
                  React.createElement('input', {
                    type: 'number',
                    value: category.available_tickets,
                    onChange: (e) => updateCategory(index, 'available_tickets', e.target.value),
                    className: 'w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded focus:ring-1 focus:ring-blue-500',
                    required: true,
                    min: '0',
                    max: category.total_tickets || '999999'
                  })
                ),

                // Buying Price
                React.createElement('div', null,
                  React.createElement('label', { className: 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1' }, 
                    'Buying Price *'
                  ),
                  React.createElement('input', {
                    type: 'number',
                    value: category.buying_price,
                    onChange: (e) => updateCategory(index, 'buying_price', e.target.value),
                    className: 'w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded focus:ring-1 focus:ring-blue-500',
                    required: true,
                    min: '0',
                    step: '0.01'
                  })
                ),

                // Selling Price
                React.createElement('div', null,
                  React.createElement('label', { className: 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1' }, 
                    'Selling Price *'
                  ),
                  React.createElement('input', {
                    type: 'number',
                    value: category.selling_price,
                    onChange: (e) => updateCategory(index, 'selling_price', e.target.value),
                    className: 'w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded focus:ring-1 focus:ring-blue-500',
                    required: true,
                    min: '0',
                    step: '0.01'
                  })
                ),

                // Inclusions (full width)
                React.createElement('div', { className: 'md:col-span-2 lg:col-span-3' },
                  React.createElement('label', { className: 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1' }, 
                    'Inclusions'
                  ),
                  React.createElement('textarea', {
                    value: category.inclusions,
                    onChange: (e) => updateCategory(index, 'inclusions', e.target.value),
                    className: 'w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white rounded focus:ring-1 focus:ring-blue-500',
                    rows: 2,
                    placeholder: 'e.g., Grandstand seat, event program, parking'
                  })
                )
              )
            )
          ),

          // Summary Stats
          React.createElement('div', { className: 'bg-blue-50 dark:bg-blue-900 p-4 rounded-lg mt-4' },
            React.createElement('h4', { className: 'font-medium text-blue-900 dark:text-blue-100 mb-2' }, 
              '📊 Summary'
            ),
            React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-4 gap-4 text-sm' },
              React.createElement('div', null,
                React.createElement('span', { className: 'text-blue-700 dark:text-blue-300' }, 'Total Tickets: '),
                React.createElement('span', { className: 'font-semibold text-blue-900 dark:text-blue-100' }, 
                  totals.totalTickets
                )
              ),
              React.createElement('div', null,
                React.createElement('span', { className: 'text-blue-700 dark:text-blue-300' }, 'Available: '),
                React.createElement('span', { className: 'font-semibold text-blue-900 dark:text-blue-100' }, 
                  totals.availableTickets
                )
              ),
              React.createElement('div', null,
                React.createElement('span', { className: 'text-blue-700 dark:text-blue-300' }, 'Total Cost: '),
                React.createElement('span', { className: 'font-semibold text-blue-900 dark:text-blue-100' }, 
                  '₹' + totals.totalCost.toLocaleString('en-IN')
                )
              ),
              React.createElement('div', null,
                React.createElement('span', { className: 'text-blue-700 dark:text-blue-300' }, 'Potential Revenue: '),
                React.createElement('span', { className: 'font-semibold text-blue-900 dark:text-blue-100' }, 
                  '₹' + totals.potentialRevenue.toLocaleString('en-IN')
                )
              )
            )
          )
        ),

        // Additional Fields (existing)
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

console.log('✅ Enhanced Inventory Form with categories loaded successfully');
