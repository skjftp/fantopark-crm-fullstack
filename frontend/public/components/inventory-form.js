// Enhanced Inventory Form with REAL Categories Implementation
// Uses your existing patterns without React hooks

window.renderInventoryForm = () => {
  if (!window.showInventoryForm || !window.editingInventory) return null;

  // Check if opened from payables (your existing functionality)
  const isFromPayables = window.editingInventory._payableContext?.fromPayables;
  const payableAmount = window.editingInventory._payableContext?.payableAmount || 0;

  const title = isFromPayables 
    ? '💰 Update Payment Status - ' + (window.editingInventory.event_name || 'Event')
    : (window.editingInventory.id ? 'Edit Event - ' + (window.editingInventory.event_name || 'Event') : 'Add New Event');

  // Initialize categories in formData if not exists
  if (!window.formData.categories) {
    // If editing and has old single category data, convert it
    if (window.editingInventory.id && window.editingInventory.category_of_ticket) {
      window.formData.categories = [{
        id: Date.now(),
        name: window.editingInventory.category_of_ticket || 'General',
        section: window.editingInventory.stand || '',
        total_tickets: window.editingInventory.total_tickets || '',
        available_tickets: window.editingInventory.available_tickets || '',
        buying_price: window.editingInventory.buying_price || window.editingInventory.buyingPrice || '',
        selling_price: window.editingInventory.selling_price || window.editingInventory.sellingPrice || '',
        inclusions: window.editingInventory.inclusions || ''
      }];
    } else {
      // New event - start with one empty category
      window.formData.categories = [{
        id: Date.now(),
        name: '',
        section: '',
        total_tickets: '',
        available_tickets: '',
        buying_price: '',
        selling_price: '',
        inclusions: ''
      }];
    }
  }

  // Category management functions
  const addCategory = () => {
    const newCategory = {
      id: Date.now() + Math.random(),
      name: '',
      section: '',
      total_tickets: '',
      available_tickets: '',
      buying_price: '',
      selling_price: '',
      inclusions: ''
    };
    
    window.formData.categories = [...(window.formData.categories || []), newCategory];
    // Force re-render by updating formData
    window.handleFormDataChange('categories', window.formData.categories);
  };

  const removeCategory = (index) => {
    if (window.formData.categories.length > 1) {
      window.formData.categories = window.formData.categories.filter((_, i) => i !== index);
      window.handleFormDataChange('categories', window.formData.categories);
    } else {
      alert('You must have at least one ticket category');
    }
  };

  const updateCategory = (index, field, value) => {
    window.formData.categories[index] = {
      ...window.formData.categories[index],
      [field]: value
    };
    // Update totals when ticket numbers change
    if (['total_tickets', 'available_tickets'].includes(field)) {
      updateInventoryTotals();
    }
  };

  // Update main inventory totals based on categories
  const updateInventoryTotals = () => {
    const totals = window.formData.categories.reduce((acc, cat) => {
      const totalTickets = parseInt(cat.total_tickets) || 0;
      const availableTickets = parseInt(cat.available_tickets) || 0;
      const buyingPrice = parseFloat(cat.buying_price) || 0;
      
      return {
        totalTickets: acc.totalTickets + totalTickets,
        availableTickets: acc.availableTickets + availableTickets,
        totalCost: acc.totalCost + (buyingPrice * totalTickets)
      };
    }, { totalTickets: 0, availableTickets: 0, totalCost: 0 });

    // Update main form fields
    window.handleFormDataChange('total_tickets', totals.totalTickets);
    window.handleFormDataChange('available_tickets', totals.availableTickets);
    window.handleFormDataChange('totalPurchaseAmount', totals.totalCost);
  };

  const categories = window.formData.categories || [];

  // Calculate totals for display
  const calculateTotals = () => {
    return categories.reduce((acc, cat) => {
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
  };

  const totals = calculateTotals();

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => e.target === e.currentTarget && window.closeInventoryForm()
  },
    React.createElement('div', { 
      className: 'bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto'
    },
      React.createElement('div', { className: 'flex justify-between items-center mb-6' },
        React.createElement('h2', { className: 'text-xl font-bold text-gray-900 dark:text-white' }, title),
        React.createElement('button', {
          onClick: window.closeInventoryForm,
          className: 'text-gray-400 hover:text-gray-600 text-2xl'
        }, '✕')
      ),

      React.createElement('form', { onSubmit: window.handleInventoryFormSubmit },
        // CATEGORIES SECTION
        React.createElement('div', { className: 'mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg' },
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
              className: 'bg-white dark:bg-gray-800 p-4 rounded-lg mb-3 border border-gray-200 dark:border-gray-600'
            },
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
                    className: 'w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-1 focus:ring-blue-500',
                    required: true,
                    placeholder: 'e.g., General, Premium, VIP'
                  })
                ),

                // Section/Stand
                React.createElement('div', null,
                  React.createElement('label', { className: 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1' }, 
                    'Section/Stand'
                  ),
                  React.createElement('input', {
                    type: 'text',
                    value: category.section,
                    onChange: (e) => updateCategory(index, 'section', e.target.value),
                    className: 'w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-1 focus:ring-blue-500',
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
                    className: 'w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-1 focus:ring-blue-500',
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
                    className: 'w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-1 focus:ring-blue-500',
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
                    className: 'w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-1 focus:ring-blue-500',
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
                    className: 'w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-1 focus:ring-blue-500',
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
                    className: 'w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-1 focus:ring-blue-500',
                    rows: 2,
                    placeholder: 'e.g., Grandstand seat, event program, parking'
                  })
                )
              )
            )
          ),

          // Summary Stats
          React.createElement('div', { className: 'bg-blue-50 dark:bg-blue-900 p-4 rounded-lg' },
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

        // EXISTING FORM FIELDS
        React.createElement('div', { className: 'mt-6' },
          React.createElement('h3', { className: 'text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200' }, 
            '📅 Event Details'
          ),
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' },
            window.inventoryFormFields.map(field => {
              // Skip fields that are now handled by categories
              if (['category_of_ticket', 'total_tickets', 'available_tickets', 'mrp_of_ticket', 
                   'buying_price', 'selling_price', 'stand', 'inclusions'].includes(field.name)) {
                return null;
              }
              
              return React.createElement('div', { 
                key: field.name,
                className: field.type === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''
              },
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 
                  field.label + (field.required ? ' *' : '')
                ),
                React.createElement('div', {
                  className: isFromPayables && ['totalPurchaseAmount', 'amountPaid', 'paymentStatus'].includes(field.name) 
                    ? 'ring-2 ring-blue-500 rounded-lg p-1' : ''
                },
                  field.type === 'select' ?
                    React.createElement('select', {
                      value: window.formData[field.name] || '',
                      onChange: (e) => window.handleFormDataChange(field.name, e.target.value),
                      className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                      required: field.required
                    },
                      React.createElement('option', { value: '' }, 'Select ' + field.label),
                      field.name === 'venue' ? 
                        window.stadiums.map(stadium => 
                          React.createElement('option', { 
                            key: stadium.id, 
                            value: stadium.name 
                          }, `${stadium.name} - ${stadium.city}`)
                        ) :
                        (field.options && field.options !== 'dynamic' ? field.options : []).map(option =>
                          React.createElement('option', { key: option, value: option }, 
                            (typeof option === 'string' ? option.charAt(0).toUpperCase() + option.slice(1) : option).replace('_', ' ')
                          )
                        )
                    ) :
                    field.type === 'textarea' ?
                      React.createElement('textarea', {
                        value: window.formData[field.name] || '',
                        onChange: (e) => window.handleFormDataChange(field.name, e.target.value),
                        className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                        rows: 3,
                        required: field.required,
                        placeholder: field.placeholder || ''
                      }) :
                      React.createElement('input', {
                        type: field.type,
                        value: window.formData[field.name] || '',
                        onChange: (e) => window.handleFormDataChange(field.name, e.target.value),
                        className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                        required: field.required,
                        placeholder: field.placeholder || '',
                        min: field.min || undefined
                      })
                )
              );
            })
          )
        ),
        
        // Form Actions
        React.createElement('div', { className: 'flex space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-600' },
          React.createElement('button', {
            type: 'button',
            onClick: window.closeInventoryForm,
            className: 'flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 font-medium'
          }, 'Cancel'),
          React.createElement('button', {
            type: 'submit',
            disabled: window.loading,
            className: 'flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium'
          }, window.loading ? 'Saving...' : (window.editingInventory.id ? 'Update Event' : 'Create Event'))
        )
      )
    )
  );
};

console.log('✅ Enhanced Inventory Form with REAL categories loaded successfully');
