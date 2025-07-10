// Inventory Detail Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

window.renderInventoryDetail = () => {
  if (!window.showInventoryDetail || !currentInventoryDetail) return null;

  const item = window.currentInventoryDetail;
  const daysUntilEvent = Math.ceil((new Date(item.event_date) - new Date()) / (1000 * 60 * 60 * 24));
  const marginAmount = (item.selling_price || 0) - (item.buying_price || 0);
  const marginPercentage = item.buying_price > 0 ? ((marginAmount / item.selling_price) * 100) : 0;

  // Status based on availability
  const getAvailabilityStatus = () => {
    if (item.available_tickets <= 0) return { label: 'Sold Out', color: 'bg-red-100 text-red-800' };
    if (item.available_tickets === item.total_tickets) return { label: 'Available', color: 'bg-green-100 text-green-800' };
    if (item.available_tickets > 5) return { label: 'Limited', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Nearly Sold', color: 'bg-orange-100 text-orange-800' };
  };

  const availabilityStatus = getAvailabilityStatus();

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => e.target === e.currentTarget && closeInventoryDetail()
  },
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg w-full max-w-5xl max-h-[95vh] overflow-y-auto' },
      React.createElement('div', { className: 'sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center' },
        React.createElement('div', null,
          React.createElement('h2', { className: 'text-2xl font-bold text-gray-900' }, item.event_name),
          React.createElement('div', { className: 'flex items-center mt-2 space-x-4' },
            React.createElement('span', {
              className: `px-3 py-1 text-sm rounded-full ${availabilityStatus.color}`
            }, availabilityStatus.label),
            React.createElement('span', { className: 'text-sm text-gray-600' }, 
              `${item.available_tickets}/${item.total_tickets} tickets available`
            ),
            daysUntilEvent >= 0 && React.createElement('span', { 
              className: `text-sm px-2 py-1 rounded ${daysUntilEvent <= 7 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`
            }, `${daysUntilEvent} days until event`)
          )
        ),
        React.createElement('button', {
          onClick: closeInventoryDetail,
          className: 'text-gray-400 hover:text-gray-600 text-2xl'
        }, '✕')
      ),

      React.createElement('div', { className: 'p-6' },
        // Action Buttons
        React.createElement('div', { className: 'mb-6 flex flex-wrap gap-2' },
          window.hasPermission('inventory', 'write') && React.createElement('button', { 
            className: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700',
            onClick: () => {
              closeInventoryDetail();
              setTimeout(() => openEditInventoryForm(item), 100);
            }
          }, '✏️ Edit Inventory'),
          window.hasPermission('inventory', 'write') && React.createElement('button', { 
            className: 'bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700',
            onClick: () => {
              closeInventoryDetail();
              setTimeout(() => handleCopyInventory(item), 100);
            }
          }, '📋 Copy Inventory'),
          window.hasPermission('inventory', 'allocate') && item.available_tickets > 0 && React.createElement('button', { 
            className: 'bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700',
            onClick: () => {
              closeInventoryDetail();
              setTimeout(() => openAllocationForm(item), 100);
            }
          }, '🎫 Allocate Tickets'),
          window.hasPermission('inventory', 'read') && React.createElement('button', { 
            className: 'bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700',
            onClick: () => {
              closeInventoryDetail();
              setTimeout(() => openAllocationManagement(item), 100);
            }
          }, '👁️ View Allocations')
        ),

        // Main Content Grid
        React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6' },
          // Event Information
          React.createElement('div', { className: 'bg-gray-50 rounded-lg p-4' },
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-3' }, '🎪 Event Information'),
            React.createElement('div', { className: 'space-y-2' },
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Event Type: '),
                React.createElement('span', { className: 'text-gray-900' }, item.event_type || 'Not specified')
              ),
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Sports: '),
                React.createElement('span', { className: 'text-gray-900' }, item.sports || 'Not specified')
              ),
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Venue: '),
                React.createElement('span', { className: 'text-gray-900' }, item.venue || 'Not specified')
              ),
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Event Date: '),
                React.createElement('span', { className: 'text-gray-900' }, new Date(item.event_date).toLocaleDateString('en-US', { 
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                }))
              ),
              item.day_of_match && item.day_of_match !== 'Not Applicable' && React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Day of Match: '),
                React.createElement('span', { className: 'text-gray-900' }, item.day_of_match)
              ),
              item.stand && React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Stand/Section: '),
                React.createElement('span', { className: 'text-gray-900' }, item.stand)
              )
            )
          ),

          // Ticket Information
          React.createElement('div', { className: 'bg-gray-50 rounded-lg p-4' },
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-3' }, '🎫 Ticket Information'),
            React.createElement('div', { className: 'space-y-2' },
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Category: '),
                React.createElement('span', { className: 'text-gray-900' }, item.category_of_ticket || 'Not specified')
              ),
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Total Tickets: '),
                React.createElement('span', { className: 'text-gray-900 font-bold' }, item.total_tickets?.toLocaleString() || '0')
              ),
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Available: '),
                React.createElement('span', { className: `font-bold ${item.available_tickets > 5 ? 'text-green-600' : 'text-red-600'}` }, 
                  item.available_tickets?.toLocaleString() || '0'
                )
              ),
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Allocated: '),
                React.createElement('span', { className: 'text-gray-900 font-bold' }, 
                  ((item.total_tickets || 0) - (item.available_tickets || 0)).toLocaleString()
                )
              ),
              item.inclusions && React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Inclusions: '),
                React.createElement('span', { className: 'text-gray-900' }, item.inclusions)
              )
            )
          ),

          // Financial Information
          window.hasPermission('finance', 'read') && React.createElement('div', { className: 'bg-gray-50 rounded-lg p-4' },
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-3' }, '💰 Financial Information'),
            React.createElement('div', { className: 'space-y-2' },
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'MRP per Ticket: '),
                React.createElement('span', { className: 'text-gray-900' }, '₹' + (item.mrp_of_ticket?.toLocaleString() || '0'))
              ),
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Buying Price: '),
                React.createElement('span', { className: 'text-gray-900' }, '₹' + (item.buying_price?.toLocaleString() || '0'))
              ),
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Selling Price: '),
                React.createElement('span', { className: 'text-gray-900' }, '₹' + (item.selling_price?.toLocaleString() || '0'))
              ),
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Margin per Ticket: '),
                React.createElement('span', { className: `font-bold ${marginAmount > 0 ? 'text-green-600' : 'text-red-600'}` }, 
                  '₹' + marginAmount.toLocaleString() + ` (${marginPercentage.toFixed(1)}%)`
                )
              ),
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Total Revenue Potential: '),
                React.createElement('span', { className: 'text-gray-900 font-bold' }, 
                  '₹' + ((item.selling_price || 0) * (item.total_tickets || 0)).toLocaleString()
                )
              )
            )
          ),

          // Procurement Information
          React.createElement('div', { className: 'bg-gray-50 rounded-lg p-4' },
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-3' }, '📦 Procurement Information'),
            React.createElement('div', { className: 'space-y-2' },
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Booking Person: '),
                React.createElement('span', { className: 'text-gray-900' }, item.booking_person || 'Not specified')
              ),
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Procurement Type: '),
                React.createElement('span', { className: 'px-2 py-1 text-xs rounded bg-blue-100 text-blue-800' }, 
                  (item.procurement_type || 'not_specified').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                )
              ),
              item.supplierName && React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Supplier: '),
                React.createElement('span', { className: 'text-gray-900' }, item.supplierName)
              ),
              item.paymentStatus && React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Payment Status: '),
                React.createElement('span', { 
                  className: `px-2 py-1 text-xs rounded ${item.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`
                }, (item.paymentStatus || 'unknown').charAt(0).toUpperCase() + (item.paymentStatus || 'unknown').slice(1))
              ),
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Created: '),
                React.createElement('span', { className: 'text-gray-900' }, 
                  new Date(item.created_date || Date.now()).toLocaleDateString('en-US', { 
                    year: 'numeric', month: 'short', day: 'numeric' 
                  })
                )
              ),
              item.created_by && React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Created By: '),
                React.createElement('span', { className: 'text-gray-900' }, item.created_by)
              )
            )
          )
        ),

        // Notes Section (Full Width)
        item.notes && React.createElement('div', { className: 'mt-6 bg-gray-50 rounded-lg p-4' },
          React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-3' }, '📝 Notes'),
          React.createElement('p', { className: 'text-gray-900 whitespace-pre-wrap' }, item.notes)
        )
      )
    )
  );
};

console.log('✅ Inventory Detail component loaded successfully');
