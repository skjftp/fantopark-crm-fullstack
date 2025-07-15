// Enhanced Inventory Form with REAL Categories Implementation
// Uses your existing patterns without React hooks

// Enhanced Currency Section for Inventory Form
// Add this to your inventory-form.js file

// 1. Currency Selection Section - Add this after the event basic details
window.renderInventoryCurrencySection = () => {
  const formData = window.formData || {};
  
  // Get current exchange rates from the currency ticker
  const currentRates = window.currentExchangeRates || {
    USD: 83.50,
    EUR: 90.20,
    GBP: 105.50,
    AED: 22.75,
    AUD: 55.25
  };
  
  // Use purchase_currency and purchase_exchange_rate (matching our initialization)
  const currency = formData.purchase_currency || 'INR';
  const exchangeRate = formData.purchase_exchange_rate || currentRates[currency] || 1;
  
  return React.createElement('div', { className: 'mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700' },
    React.createElement('h3', { className: 'text-lg font-semibold text-purple-800 dark:text-purple-200 mb-4' }, 
      '💱 Currency & Pricing Configuration'
    ),
    
    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-4' },
      // Currency Selection
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 
          'Purchase Currency *'
        ),
        React.createElement('select', {
          value: formData.purchase_currency || 'INR',
          onChange: (e) => {
            const newCurrency = e.target.value;
            window.handleFormDataChange('purchase_currency', newCurrency);
            
            // Auto-update exchange rate when currency changes
            if (newCurrency !== 'INR') {
              const rate = currentRates[newCurrency] || 1;
              window.handleFormDataChange('purchase_exchange_rate', rate);
            } else {
              window.handleFormDataChange('purchase_exchange_rate', 1);
            }
          },
          className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-purple-500'
        },
          React.createElement('option', { value: 'INR' }, 'INR (Indian Rupees)'),
          React.createElement('option', { value: 'USD' }, 'USD (US Dollars)'),
          React.createElement('option', { value: 'EUR' }, 'EUR (Euros)'),
          React.createElement('option', { value: 'GBP' }, 'GBP (British Pounds)'),
          React.createElement('option', { value: 'AED' }, 'AED (UAE Dirham)'),
          React.createElement('option', { value: 'AUD' }, 'AUD (Australian Dollars)')
        )
      ),
      
      // Exchange Rate (Only show for non-INR)
      currency !== 'INR' && React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 
          'Exchange Rate (1 ' + currency + ' = ₹)'
        ),
        React.createElement('div', { className: 'flex items-center gap-2' },
          React.createElement('input', {
            type: 'number',
            value: formData.purchase_exchange_rate || exchangeRate,
            onChange: (e) => {
              window.handleFormDataChange('purchase_exchange_rate', parseFloat(e.target.value) || 0);
            },
            className: 'flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-purple-500',
            step: 0.01,
            min: 0
          }),
          React.createElement('button', {
            type: 'button',
            onClick: () => {
              const currentRate = currentRates[currency] || 1;
              window.handleFormDataChange('purchase_exchange_rate', currentRate);
            },
            className: 'px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm',
            title: 'Use current market rate'
          }, '↻')
        )
      ),
      
      // Currency Info
      currency !== 'INR' && React.createElement('div', { className: 'flex items-center p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded' },
        React.createElement('div', { className: 'text-sm' },
          React.createElement('div', { className: 'font-medium text-yellow-800 dark:text-yellow-200' }, 
            '💡 Multi-Currency Mode Active'
          ),
          React.createElement('div', { className: 'text-xs text-yellow-700 dark:text-yellow-300 mt-1' }, 
            'All amounts will be converted to INR for reporting'
          )
        )
      )
    ),
    
    // Note about pricing
    React.createElement('div', { className: 'mt-3 text-xs text-gray-600 dark:text-gray-400' },
      '📌 Enter all prices in ', currency, '. INR equivalents will be calculated automatically and stored for financial reporting.'
    )
  );
};

// 3. Enhanced Payment Section with Currency
window.renderEnhancedPaymentSection = () => {
  const formData = window.formData || {};
  const isFromPayables = window.editingInventory?._payableContext?.fromPayables;
  const currency = formData.purchase_currency || 'INR';  // Changed from price_currency
  const exchangeRate = formData.purchase_exchange_rate || 1;  // Changed from exchange_rate
  
  // Calculate amount paid in INR
  const amountPaid = parseFloat(formData.amountPaid) || 0;
  const amountPaidINR = currency === 'INR' ? amountPaid : amountPaid * exchangeRate;
  
  return React.createElement('div', { className: 'mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg' },
    React.createElement('h3', { className: 'text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center' }, 
      '💰 Payment Information',
      isFromPayables && React.createElement('span', { 
        className: 'ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded' 
      }, 'From Payables')
    ),
    
    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
      // Payment Status
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 
          'Payment Status *'
        ),
        React.createElement('select', {
          value: formData.paymentStatus || 'pending',
          onChange: (e) => window.handleFormDataChange('paymentStatus', e.target.value),
          className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-orange-500',
          required: true
        },
          React.createElement('option', { value: 'pending' }, 'Pending'),
          React.createElement('option', { value: 'paid' }, 'Paid')
        )
      ),
      
      // Total Purchase Amount (readonly, calculated)
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 
          `Total Purchase Amount (${currency})`
        ),
        React.createElement('input', {
          type: 'number',
          value: formData.totalPurchaseAmount || 0,
          className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-100 dark:text-gray-400 rounded-md',
          readOnly: true
        }),
        currency !== 'INR' && React.createElement('div', { 
          className: 'text-xs text-green-600 dark:text-green-400 mt-1' 
        }, 
          '₹ ' + ((formData.totalPurchaseAmount || 0) * exchangeRate).toFixed(2)
        )
      ),
      
      // Amount Paid
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 
          `Amount Paid (${currency})`
        ),
        React.createElement('input', {
          type: 'number',
          value: formData.amountPaid || '',
          onChange: (e) => {
            const value = parseFloat(e.target.value) || 0;
            window.handleFormDataChange('amountPaid', value);
            window.handleFormDataChange('amountPaid_inr', currency === 'INR' ? value : value * exchangeRate);
          },
          className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-orange-500',
          min: 0,
          step: 0.01
        }),
        currency !== 'INR' && React.createElement('div', { 
          className: 'text-xs text-green-600 dark:text-green-400 mt-1' 
        }, 
          '₹ ' + amountPaidINR.toFixed(2)
        )
      ),
      
      // Payment Due Date
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 
          'Payment Due Date'
        ),
        React.createElement('input', {
          type: 'date',
          value: formData.paymentDueDate || '',
          onChange: (e) => window.handleFormDataChange('paymentDueDate', e.target.value),
          className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-orange-500'
        })
      ),
      
      // Supplier Name
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 
          'Supplier Name'
        ),
        React.createElement('input', {
          type: 'text',
          value: formData.supplierName || '',
          onChange: (e) => window.handleFormDataChange('supplierName', e.target.value),
          className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-orange-500'
        })
      ),
      
      // Supplier Invoice
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 
          'Supplier Invoice #'
        ),
        React.createElement('input', {
          type: 'text',
          value: formData.supplierInvoice || '',
          onChange: (e) => window.handleFormDataChange('supplierInvoice', e.target.value),
          className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-orange-500'
        })
      )
    ),
    
    // Balance calculation
    React.createElement('div', { className: 'mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded' },
      React.createElement('div', { className: 'flex justify-between items-center' },
        React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 
          'Balance Due:'
        ),
        React.createElement('span', { className: 'font-bold text-lg text-red-600 dark:text-red-400' }, 
          currency + ' ' + ((formData.totalPurchaseAmount || 0) - (formData.amountPaid || 0)).toFixed(2),
          currency !== 'INR' && React.createElement('span', { className: 'text-sm ml-2' },
            '(₹ ' + (((formData.totalPurchaseAmount || 0) - (formData.amountPaid || 0)) * exchangeRate).toFixed(2) + ')'
          )
        )
      )
    )
  );
};

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

  // Get currency info - FIXED to use purchase_currency
  const currency = window.formData.purchase_currency || 'INR';
  const exchangeRate = window.formData.purchase_exchange_rate || 1;

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
      const updatedCategories = window.formData.categories.filter((_, i) => i !== index);
      window.handleFormDataChange('categories', updatedCategories);
    } else {
      alert('You must have at least one ticket category');
    }
  };

  const updateCategory = (index, field, value) => {
    // Create a new array to trigger React re-render
    const updatedCategories = [...window.formData.categories];
    updatedCategories[index] = {
      ...updatedCategories[index],
      [field]: value
    };

    // Calculate INR values if currency is not INR
    if (currency !== 'INR') {
      if (field === 'buying_price') {
        updatedCategories[index].buying_price_inr = (parseFloat(value) || 0) * exchangeRate;
      } else if (field === 'selling_price') {
        updatedCategories[index].selling_price_inr = (parseFloat(value) || 0) * exchangeRate;
      }
    }

    // Use handleFormDataChange to properly update state
    window.handleFormDataChange('categories', updatedCategories);
    
    // Update totals when ticket numbers or prices change
    if (['total_tickets', 'available_tickets', 'buying_price', 'selling_price'].includes(field)) {
      // Delay this slightly to ensure state is updated first
      setTimeout(() => updateInventoryTotals(), 0);
    }
  };

  // Update main inventory totals based on categories
  const updateInventoryTotals = () => {
    const totals = window.formData.categories.reduce((acc, cat) => {
      const totalTickets = parseInt(cat.total_tickets) || 0;
      const availableTickets = parseInt(cat.available_tickets) || 0;
      const buyingPrice = parseFloat(cat.buying_price) || 0;
      const buyingPriceINR = currency === 'INR' ? buyingPrice : buyingPrice * exchangeRate;
      
      return {
        totalTickets: acc.totalTickets + totalTickets,
        availableTickets: acc.availableTickets + availableTickets,
        totalCost: acc.totalCost + (buyingPrice * totalTickets),
        totalCostINR: acc.totalCostINR + (buyingPriceINR * totalTickets)
      };
    }, { totalTickets: 0, availableTickets: 0, totalCost: 0, totalCostINR: 0 });

    // Update main form fields
    window.handleFormDataChange('total_tickets', totals.totalTickets);
    window.handleFormDataChange('available_tickets', totals.availableTickets);
    window.handleFormDataChange('totalPurchaseAmount', totals.totalCost);
    window.handleFormDataChange('totalPurchaseAmount_inr', totals.totalCostINR);
  };

  const categories = window.formData.categories || [];

  // Calculate totals for display - FIXED to use purchase_currency
  const calculateTotals = () => {
    const categories = window.formData.categories || [];
    const currency = window.formData.purchase_currency || 'INR';  // Changed
    const exchangeRate = window.formData.purchase_exchange_rate || 1;  // Changed
    
    return categories.reduce((acc, category) => {
      const totalTickets = parseInt(category.total_tickets) || 0;
      const availableTickets = parseInt(category.available_tickets) || 0;
      const buyingPrice = parseFloat(category.buying_price) || 0;
      const sellingPrice = parseFloat(category.selling_price) || 0;
      
      // Calculate INR values
      const buyingPriceINR = currency === 'INR' ? buyingPrice : buyingPrice * exchangeRate;
      const sellingPriceINR = currency === 'INR' ? sellingPrice : sellingPrice * exchangeRate;
      
      return {
        totalTickets: acc.totalTickets + totalTickets,
        availableTickets: acc.availableTickets + availableTickets,
        totalCost: acc.totalCost + (buyingPrice * totalTickets),
        totalCostINR: acc.totalCostINR + (buyingPriceINR * totalTickets),
        potentialRevenue: acc.potentialRevenue + (sellingPrice * totalTickets),
        potentialRevenueINR: acc.potentialRevenueINR + (sellingPriceINR * totalTickets)
      };
    }, { totalTickets: 0, availableTickets: 0, totalCost: 0, totalCostINR: 0, potentialRevenue: 0, potentialRevenueINR: 0 });
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
        
        // Currency Configuration Section
        window.renderInventoryCurrencySection(),

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

                // Buying Price with INR display - FIXED
                React.createElement('div', null,
                  React.createElement('label', { className: 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1' }, 
                    `Buying Price (${window.formData.purchase_currency || 'INR'}) *`  // Changed
                  ),
                  React.createElement('input', {
                    type: 'number',
                    value: category.buying_price,
                    onChange: (e) => updateCategory(index, 'buying_price', e.target.value),
                    className: 'w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-1 focus:ring-blue-500',
                    required: true,
                    min: '0',
                    step: '0.01'
                  }),
                  (window.formData.purchase_currency || 'INR') !== 'INR' && React.createElement('div', { 
                    className: 'text-xs text-green-600 dark:text-green-400 mt-1' 
                  }, 
                    '₹ ' + ((parseFloat(category.buying_price) || 0) * (parseFloat(window.formData.purchase_exchange_rate) || 1)).toFixed(2)
                  )
                ),

                // Selling Price with INR display - FIXED
                React.createElement('div', null,
                  React.createElement('label', { className: 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1' }, 
                    `Selling Price (${window.formData.purchase_currency || 'INR'}) *`  // Changed
                  ),
                  React.createElement('input', {
                    type: 'number',
                    value: category.selling_price,
                    onChange: (e) => updateCategory(index, 'selling_price', e.target.value),
                    className: 'w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded focus:ring-1 focus:ring-blue-500',
                    required: true,
                    min: '0',
                    step: '0.01'
                  }),
                  (window.formData.purchase_currency || 'INR') !== 'INR' && React.createElement('div', { 
                    className: 'text-xs text-green-600 dark:text-green-400 mt-1' 
                  }, 
                    '₹ ' + ((parseFloat(category.selling_price) || 0) * (parseFloat(window.formData.purchase_exchange_rate) || 1)).toFixed(2)
                  )
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
              ),
              
              // Category margin display
              currency !== 'INR' && React.createElement('div', { 
                className: 'mt-3 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs' 
              },
                React.createElement('div', { className: 'flex justify-between' },
                  React.createElement('span', { className: 'text-gray-600 dark:text-gray-400' }, 
                    'Margin per ticket:'
                  ),
                  React.createElement('span', { className: 'font-medium' }, 
                    currency + ' ' + ((parseFloat(category.selling_price) || 0) - (parseFloat(category.buying_price) || 0)).toFixed(2) +
                    ' (₹ ' + (((parseFloat(category.selling_price) || 0) - (parseFloat(category.buying_price) || 0)) * exchangeRate).toFixed(2) + ')'
                  )
                )
              )
            )
          ),

          // Summary Stats with INR
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
                React.createElement('div', { className: 'font-semibold text-blue-900 dark:text-blue-100' }, 
                  currency + ' ' + totals.totalCost.toFixed(2),
                  currency !== 'INR' && React.createElement('div', { className: 'text-xs text-green-600' },
                    '(₹ ' + totals.totalCostINR.toFixed(2) + ')'
                  )
                )
              ),
              React.createElement('div', null,
                React.createElement('span', { className: 'text-blue-700 dark:text-blue-300' }, 'Potential Revenue: '),
                React.createElement('div', { className: 'font-semibold text-blue-900 dark:text-blue-100' }, 
                  currency + ' ' + totals.potentialRevenue.toFixed(2),
                  currency !== 'INR' && React.createElement('div', { className: 'text-xs text-green-600' },
                    '(₹ ' + totals.potentialRevenueINR.toFixed(2) + ')'
                  )
                )
              )
            )
          )
        ),

        // Enhanced Payment Section
        window.renderEnhancedPaymentSection(),

        // EXISTING FORM FIELDS
        React.createElement('div', { className: 'mt-6' },
          React.createElement('h3', { className: 'text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200' }, 
            '📅 Event Details'
          ),
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' },
            window.inventoryFormFields.map(field => {
              // Skip fields that are now handled by categories or payment section
              if (['category_of_ticket', 'total_tickets', 'available_tickets', 'mrp_of_ticket', 
                   'buying_price', 'selling_price', 'stand', 'inclusions', 
                   'paymentStatus', 'supplierName', 'supplierInvoice', 'purchasePrice',
                   'totalPurchaseAmount', 'amountPaid', 'paymentDueDate',
                   'purchase_currency', 'purchase_exchange_rate'].includes(field.name)) {
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
