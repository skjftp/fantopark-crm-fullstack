// Enhanced Inventory Detail Component for FanToPark CRM
// Shows comprehensive category breakdown for multi-category inventory items
// Includes Market Rate Tab for external marketplace pricing
// Maintains window globals pattern for CDN-based React compatibility

// Ensure formatting functions exist
window.formatNumber = window.formatNumber || ((num) => {
  if (num === null || num === undefined) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
});

window.formatCurrency = window.formatCurrency || ((amount) => {
  if (amount === null || amount === undefined) return '₹0';
  return '₹' + window.formatNumber(amount);
});

window.formatIndianNumber = window.formatIndianNumber || window.formatNumber;

// Create a wrapper component that properly handles state
window.InventoryDetailComponent = function() {
  const [activeTab, setActiveTab] = React.useState('details');
  const [lastItemId, setLastItemId] = React.useState(null);
  
  const item = window.currentInventoryDetail;
  
  // Reset tab when item changes
  React.useEffect(() => {
    if (item && item.id !== lastItemId) {
      setActiveTab('details');
      setLastItemId(item.id);
    }
  }, [item, lastItemId]);
  
  if (!window.showInventoryDetail || !item) return null;

  const daysUntilEvent = Math.ceil((new Date(item.event_date) - new Date()) / (1000 * 60 * 60 * 24));
  
  // Calculate total available and total tickets across all categories
  const totalAvailable = item.categories?.reduce((sum, cat) => sum + (cat.available_tickets || 0), 0) || item.available_tickets || 0;
  const totalTickets = item.categories?.reduce((sum, cat) => sum + (cat.total_tickets || 0), 0) || item.total_tickets || 0;
  
  // Calculate total revenue potential across all categories
  const totalRevenuePotential = item.categories?.reduce((sum, cat) => 
    sum + ((cat.total_tickets || 0) * (cat.selling_price || 0)), 0
  ) || (item.total_tickets * item.selling_price) || 0;

  // Status based on availability
  const getAvailabilityStatus = () => {
    if (totalAvailable <= 0) return { label: 'Sold Out', color: 'bg-red-100 text-red-800' };
    if (totalAvailable === totalTickets) return { label: 'Available', color: 'bg-green-100 text-green-800' };
    if (totalAvailable > 5) return { label: 'Limited', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Nearly Sold', color: 'bg-orange-100 text-orange-800' };
  };

  const availabilityStatus = getAvailabilityStatus();

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => e.target === e.currentTarget && window.closeInventoryDetail()
  },
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-xl flex flex-col' },
      // Header
      React.createElement('div', { className: 'bg-white dark:bg-gray-800 border-b px-6 py-4 flex justify-between items-center' },
        React.createElement('div', null,
          React.createElement('h2', { className: 'text-2xl font-bold text-gray-900 dark:text-white' }, item.event_name),
          React.createElement('div', { className: 'flex items-center mt-2 space-x-4' },
            React.createElement('span', {
              className: `px-3 py-1 text-sm rounded-full ${availabilityStatus.color}`
            }, availabilityStatus.label),
            React.createElement('span', { className: 'text-sm text-gray-600 dark:text-gray-400' }, 
              `${window.formatNumber(totalAvailable)}/${window.formatNumber(totalTickets)} tickets available`
            ),
            daysUntilEvent >= 0 ? React.createElement('span', { 
              className: `text-sm px-2 py-1 rounded ${daysUntilEvent <= 7 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`
            }, `${daysUntilEvent} days until event`) : null
          )
        ),
        React.createElement('div', { className: 'flex gap-2' },
          // Close Button
          React.createElement('button', {
            onClick: window.closeInventoryDetail,
            className: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-xl'
          }, '✕')
        )
      ),

      // Tab Navigation
      React.createElement('div', { 
        className: 'border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
      },
        React.createElement('nav', { 
          className: 'flex -mb-px'
        },
          [
            { id: 'details', label: '📋 Details', icon: '📋' },
            { id: 'market-rates', label: '💹 Market Rates', icon: '💹' }
          ].map(tab =>
            React.createElement('button', {
              key: tab.id,
              onClick: () => setActiveTab(tab.id),
              className: `
                px-6 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === tab.id 
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'}
              `
            }, tab.label)
          )
        )
      ),

      // Tab Content
      React.createElement('div', { 
        className: 'flex-1 overflow-y-auto bg-white dark:bg-gray-800'
      },
        // Details Tab (Original Content)
        activeTab === 'details' ? React.createElement('div', { className: 'p-6' },
          // Action Buttons Row
          React.createElement('div', { className: 'flex gap-2 mb-6' },
            // Edit Inventory Button
            window.hasPermission && window.hasPermission('inventory', 'write') ? React.createElement('button', {
              onClick: () => {
                window.closeInventoryDetail();
                window.editInventory(item);
              },
              className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2'
            }, 
              React.createElement('span', null, '✏️'),
              'Edit Inventory'
            ) : null,
            // Copy Inventory Button
            React.createElement('button', {
              onClick: () => window.handleCopyInventory(item),
              className: 'px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2'
            }, 
              React.createElement('span', null, '📋'),
              'Copy'
            ),
            // View Allocations Button
            React.createElement('button', {
              onClick: () => {
                window.closeInventoryDetail();
                window.openAllocationManagement(item);
              },
              className: 'px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2'
            }, 
              React.createElement('span', null, '📊'),
              'View Allocations'
            )
          ),

          // Event Information Section
          React.createElement('div', { className: 'mb-6' },
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center' },
              React.createElement('span', { className: 'text-blue-600 mr-2' }, '📅'),
              'Event Information'
            ),
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' },
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'Event Type: '),
                React.createElement('span', { className: 'text-gray-900 dark:text-white' }, item.event_type || 'Not specified')
              ),
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'Sports: '),
                React.createElement('span', { className: 'text-gray-900 dark:text-white' }, item.sports || 'Not specified')
              ),
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'Venue: '),
                React.createElement('span', { className: 'text-gray-900 dark:text-white' }, item.venue || 'Not specified')
              ),
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'Event Date: '),
                React.createElement('span', { className: 'text-gray-900 dark:text-white' }, 
                  new Date(item.event_date).toLocaleDateString('en-US', { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                  })
                )
              )
            )
          ),

          // Ticket Categories Section
          React.createElement('div', { className: 'mb-6' },
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center' },
              React.createElement('span', { className: 'text-green-600 mr-2' }, '🎫'),
              'Ticket Categories'
            ),
            
            item.categories && item.categories.length > 0 ? 
              React.createElement('div', { className: 'space-y-4' },
                item.categories.map((category, index) => {
                  const marginAmount = (category.selling_price || 0) - (category.buying_price || 0);
                  const marginPercentage = category.selling_price > 0 ? 
                    ((marginAmount / category.selling_price) * 100).toFixed(1) : 0;
                  
                  return React.createElement('div', { 
                    key: index,
                    className: 'bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600'
                  },
                    // Category Header
                    React.createElement('div', { className: 'flex justify-between items-start mb-3' },
                      React.createElement('div', null,
                        React.createElement('h4', { className: 'font-semibold text-gray-900 dark:text-white text-lg' }, 
                          category.name || 'Category ' + (index + 1)
                        ),
                        category.section ? React.createElement('p', { className: 'text-sm text-gray-600 dark:text-gray-400' }, 
                          'Section: ' + category.section
                        ) : null
                      ),
                      React.createElement('div', { className: 'text-right' },
                        React.createElement('span', { 
                          className: `px-3 py-1 text-sm rounded-full ${
                            category.available_tickets === 0 ? 'bg-red-100 text-red-800' :
                            category.available_tickets < 5 ? 'bg-orange-100 text-orange-800' :
                            category.available_tickets < 20 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`
                        }, 
                          category.available_tickets === 0 ? 'Sold Out' :
                          `${category.available_tickets} available`
                        )
                      )
                    ),
                    
                    // Category Details Grid
                    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' },
                      // Ticket Information
                      React.createElement('div', null,
                        React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300 block text-sm' }, 
                          'Total Tickets'
                        ),
                        React.createElement('span', { className: 'text-lg font-semibold text-gray-900 dark:text-white' }, 
                          window.formatNumber(category.total_tickets || 0)
                        )
                      ),
                      React.createElement('div', null,
                        React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300 block text-sm' }, 
                          'Available'
                        ),
                        React.createElement('span', { className: 'text-lg font-semibold text-gray-900 dark:text-white' }, 
                          window.formatNumber(category.available_tickets || 0)
                        )
                      ),
                      React.createElement('div', null,
                        React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300 block text-sm' }, 
                          'Allocated'
                        ),
                        React.createElement('span', { className: 'text-lg font-semibold text-gray-900 dark:text-white' }, 
                          window.formatNumber((category.total_tickets || 0) - (category.available_tickets || 0))
                        )
                      ),
                      
                      // Pricing Information
                      React.createElement('div', null,
                        React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300 block text-sm' }, 
                          'Buying Price'
                        ),
                        React.createElement('span', { className: 'text-lg font-semibold text-gray-900 dark:text-white' }, 
                          window.formatCurrency(category.buying_price || 0)
                        )
                      ),
                      React.createElement('div', null,
                        React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300 block text-sm' }, 
                          'Selling Price'
                        ),
                        React.createElement('span', { className: 'text-lg font-semibold text-gray-900 dark:text-white' }, 
                          window.formatCurrency(category.selling_price || 0)
                        )
                      ),
                      React.createElement('div', null,
                        React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300 block text-sm' }, 
                          'Margin'
                        ),
                        React.createElement('span', { 
                          className: `text-lg font-semibold ${marginAmount > 0 ? 'text-green-600' : 'text-red-600'}`
                        }, 
                          window.formatCurrency(marginAmount) + ` (${marginPercentage}%)`
                        )
                      )
                    ),
                    
                    // Inclusions if available
                    category.inclusions ? React.createElement('div', { className: 'mt-3 pt-3 border-t border-gray-200 dark:border-gray-600' },
                      React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300 text-sm' }, 
                        'Inclusions: '
                      ),
                      React.createElement('span', { className: 'text-sm text-gray-900 dark:text-white' }, 
                        category.inclusions
                      )
                    ) : null
                  );
                })
              ) :
              // Fallback for old single-category format
              React.createElement('div', { className: 'bg-gray-50 dark:bg-gray-700 rounded-lg p-4' },
                React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-4' },
                  React.createElement('div', null,
                    React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300 block' }, 'Total Tickets'),
                    React.createElement('span', { className: 'text-lg font-semibold text-gray-900 dark:text-white' }, 
                      window.formatNumber(item.total_tickets || 0)
                    )
                  ),
                  React.createElement('div', null,
                    React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300 block' }, 'Available'),
                    React.createElement('span', { className: 'text-lg font-semibold text-gray-900 dark:text-white' }, 
                      window.formatNumber(item.available_tickets || 0)
                    )
                  ),
                  React.createElement('div', null,
                    React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300 block' }, 'Allocated'),
                    React.createElement('span', { className: 'text-lg font-semibold text-gray-900 dark:text-white' }, 
                      window.formatNumber((item.total_tickets || 0) - (item.available_tickets || 0))
                    )
                  )
                )
              )
          ),

          // Financial Information Section
          React.createElement('div', { className: 'mb-6' },
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center' },
              React.createElement('span', { className: 'text-yellow-600 mr-2' }, '💰'),
              'Financial Information'
            ),
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' },
              item.categories && item.categories.length > 0 ? 
                // Show category-based financial summary
                React.createElement(React.Fragment, null,
                  React.createElement('div', null,
                    React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'MRP per Ticket: '),
                    React.createElement('span', { className: 'text-gray-900 dark:text-white' }, 
                      item.categories.map(cat => 
                        `${cat.name}: ₹${window.formatNumber(cat.mrp || 0)}`
                      ).join(', ') || '₹0'
                    )
                  ),
                  React.createElement('div', null,
                    React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'Buying Price Range: '),
                    React.createElement('span', { className: 'text-gray-900 dark:text-white' }, 
                      '₹' + window.formatNumber(Math.min(...item.categories.map(c => c.buying_price || 0))) +
                      ' - ₹' + window.formatNumber(Math.max(...item.categories.map(c => c.buying_price || 0)))
                    )
                  ),
                  React.createElement('div', null,
                    React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'Selling Price Range: '),
                    React.createElement('span', { className: 'text-gray-900 dark:text-white' }, 
                      '₹' + window.formatNumber(Math.min(...item.categories.map(c => c.selling_price || 0))) +
                      ' - ₹' + window.formatNumber(Math.max(...item.categories.map(c => c.selling_price || 0)))
                    )
                  )
                ) :
                // Show single price for old format
                React.createElement(React.Fragment, null,
                  React.createElement('div', null,
                    React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'MRP per Ticket: '),
                    React.createElement('span', { className: 'text-gray-900 dark:text-white' }, 
                      '₹' + window.formatNumber(item.mrp_of_ticket || 0)
                    )
                  ),
                  React.createElement('div', null,
                    React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'Buying Price: '),
                    React.createElement('span', { className: 'text-gray-900 dark:text-white' }, 
                      '₹' + window.formatNumber(item.buying_price || 0)
                    )
                  ),
                  React.createElement('div', null,
                    React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'Selling Price: '),
                    React.createElement('span', { className: 'text-gray-900 dark:text-white' }, 
                      '₹' + window.formatNumber(item.selling_price || 0)
                    )
                  )
                ),
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'Total Revenue Potential: '),
                React.createElement('span', { className: 'text-green-600 font-semibold text-lg' }, 
                  window.formatCurrency(totalRevenuePotential)
                )
              )
            )
          ),

          // Procurement Information Section
          React.createElement('div', { className: 'mb-6' },
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center' },
              React.createElement('span', { className: 'text-purple-600 mr-2' }, '🛒'),
              'Procurement Information'
            ),
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' },
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'Booking Person: '),
                React.createElement('span', { className: 'text-gray-900 dark:text-white' }, item.booking_person || 'Not specified')
              ),
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'Procurement Type: '),
                React.createElement('span', { className: 'text-gray-900 dark:text-white capitalize' }, 
                  item.procurement_type || 'Not specified'
                )
              ),
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'Payment Status: '),
                React.createElement('span', { 
                  className: `px-2 py-1 text-sm rounded ${
                    item.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 
                    item.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`
                }, (item.paymentStatus || 'Pending').charAt(0).toUpperCase() + (item.paymentStatus || 'pending').slice(1))
              ),
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'Created: '),
                React.createElement('span', { className: 'text-gray-900 dark:text-white' }, 
                  new Date(item.created_date || Date.now()).toLocaleDateString('en-US', { 
                    year: 'numeric', month: 'short', day: 'numeric' 
                  })
                )
              ),
              item.created_by ? React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'Created By: '),
                React.createElement('span', { className: 'text-gray-900 dark:text-white' }, item.created_by)
              ) : null
            )
          ),

          // Notes Section (Full Width)
          item.notes ? React.createElement('div', { className: 'bg-gray-50 dark:bg-gray-700 rounded-lg p-4' },
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 dark:text-white mb-3' }, '📝 Notes'),
            React.createElement('p', { className: 'text-gray-900 dark:text-white whitespace-pre-wrap' }, item.notes)
          ) : null
        ) : null,

        // Market Rates Tab
        activeTab === 'market-rates' ? (
          window.MarketRateTab ? 
            React.createElement(window.MarketRateTab, { inventory: item }) :
            React.createElement('div', { className: 'p-6 text-center' },
              React.createElement('p', { className: 'text-gray-500 dark:text-gray-400' }, 
                'Market Rate feature is not loaded. Please ensure market-rate-tab.js is included.'
              )
            )
        ) : null
      )
    )
  );
};

// Main render function that returns the component
window.renderInventoryDetail = () => {
  return React.createElement(window.InventoryDetailComponent);
};

// Helper function to close the inventory detail modal
window.closeInventoryDetail = () => {
  window.setShowInventoryDetail(false);
  window.setCurrentInventoryDetail(null);
};

console.log('✅ Enhanced Inventory Detail with Market Rate Tab loaded successfully');
