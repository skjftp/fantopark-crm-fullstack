// Order Detail Modal Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

window.renderOrderDetailModal = () => {
  // ✅ EXTRACT FUNCTIONS WITH FALLBACKS (integration pattern)
  const {
    showOrderDetail = window.showOrderDetail,
    currentOrderDetail = window.currentOrderDetail,
    setShowOrderDetail = window.setShowOrderDetail || (() => {
      console.warn("setShowOrderDetail not implemented");
    }),
    handleOrderApproval = window.handleOrderApproval || (() => {
      console.warn("handleOrderApproval not implemented");
    }),
    hasPermission = window.hasPermission || (() => false)
  } = window.appState || {};

  if (!showOrderDetail || !currentOrderDetail) return null;
  
  // Helper function to get status color and styling
  const getStatusStyling = (status) => {
    const statusMap = {
      'pending_approval': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending Approval' },
      'approved': { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      'rejected': { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      'service_assigned': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Service Assigned' },
      'completed': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Completed' }
    };
    return statusMap[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
  };

  const statusStyle = getStatusStyling(currentOrderDetail.status);

  // Enhanced order information extraction
  const getEventDisplay = (order) => {
    if (order.invoice_items && Array.isArray(order.invoice_items) && order.invoice_items.length > 0) {
      return order.invoice_items[0].description;
    }
    return order.event_name || 'N/A';
  };

  const getTicketsDisplay = (order) => {
    if (order.invoice_items && Array.isArray(order.invoice_items)) {
      const totalQuantity = order.invoice_items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      return `${totalQuantity} - ${order.category_of_sale || 'Retail'}`;
    }
    return `${order.tickets_allocated || 0} - ${order.ticket_category || 'Retail'}`;
  };

  const getTotalAmount = (order) => {
    return order.final_amount || order.total_amount || order.amount || 0;
  };

  const getAdvanceAmount = (order) => {
    return order.advance_received || order.advance_amount || 0;
  };

  const getBalanceAmount = (order) => {
    const total = getTotalAmount(order);
    const advance = getAdvanceAmount(order);
    return total - advance;
  };

  const getTotalTax = (order) => {
    if (order.gst_calculation && order.gst_calculation.total) {
      let totalTax = order.gst_calculation.total;
      if (order.tcs_calculation && order.tcs_calculation.applicable) {
        totalTax += order.tcs_calculation.amount || 0;
      }
      return totalTax;
    }
    return order.total_tax || 0;
  };

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => e.target === e.currentTarget && setShowOrderDetail(false)
  },
    React.createElement('div', { 
      className: 'bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl' 
    },
      // Header
      React.createElement('div', { className: 'flex justify-between items-center p-6 border-b border-gray-200' },
        React.createElement('h2', { className: 'text-2xl font-bold text-gray-900 dark:text-white' }, 
          'Order Details: ' + (currentOrderDetail.order_number || currentOrderDetail.id)
        ),
        React.createElement('button', {
          onClick: () => setShowOrderDetail(false),
          className: 'text-gray-400 hover:text-gray-600 text-2xl font-bold'
        }, '✕')
      ),

      // Content
      React.createElement('div', { className: 'p-6 space-y-6' },
        
        // Client Information Section
        React.createElement('div', null,
          React.createElement('div', { className: 'flex items-center mb-3' },
            React.createElement('span', { className: 'text-blue-600 text-lg mr-2' }, '👤'),
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 dark:text-white' }, 'Client Information')
          ),
          React.createElement('div', { className: 'grid grid-cols-2 gap-4 text-sm' },
            React.createElement('div', null,
              React.createElement('p', { className: 'mb-2' }, 
                React.createElement('strong', { className: 'text-gray-600' }, 'Legal Name: '),
                React.createElement('span', { className: 'text-gray-900' }, currentOrderDetail.legal_name || currentOrderDetail.client_name || 'N/A')
              ),
              React.createElement('p', { className: 'mb-2' }, 
                React.createElement('strong', { className: 'text-gray-600' }, 'Phone: '),
                React.createElement('span', { className: 'text-gray-900' }, currentOrderDetail.client_phone || 'N/A')
              ),
              React.createElement('p', { className: 'mb-2' }, 
                React.createElement('strong', { className: 'text-gray-600' }, 'Category: '),
                React.createElement('span', { className: 'text-gray-900' }, currentOrderDetail.category_of_sale || 'Retail')
              ),
              React.createElement('p', { className: 'mb-2' }, 
                React.createElement('strong', { className: 'text-gray-600' }, 'Address: '),
                React.createElement('span', { className: 'text-gray-900' }, currentOrderDetail.registered_address || 'N/A')
              )
            ),
            React.createElement('div', null,
              React.createElement('p', { className: 'mb-2' }, 
                React.createElement('strong', { className: 'text-gray-600' }, 'Email: '),
                React.createElement('span', { className: 'text-gray-900' }, currentOrderDetail.client_email || 'N/A')
              ),
              React.createElement('p', { className: 'mb-2' }, 
                React.createElement('strong', { className: 'text-gray-600' }, 'GSTIN: '),
                React.createElement('span', { className: 'text-gray-900' }, currentOrderDetail.gstin || 'Not Provided')
              ),
              React.createElement('p', { className: 'mb-2' }, 
                React.createElement('strong', { className: 'text-gray-600' }, 'State: '),
                React.createElement('span', { className: 'text-gray-900' }, currentOrderDetail.indian_state || 'N/A')
              )
            )
          )
        ),

        // Order Information Section
        React.createElement('div', null,
          React.createElement('div', { className: 'flex items-center mb-3' },
            React.createElement('span', { className: 'text-green-600 text-lg mr-2' }, '📋'),
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 dark:text-white' }, 'Order Information')
          ),
          React.createElement('div', { className: 'grid grid-cols-2 gap-4 text-sm' },
            React.createElement('div', null,
              React.createElement('p', { className: 'mb-2' }, 
                React.createElement('strong', { className: 'text-gray-600' }, 'Event: '),
                React.createElement('span', { className: 'text-gray-900' }, getEventDisplay(currentOrderDetail))
              ),
              React.createElement('p', { className: 'mb-2' }, 
                React.createElement('strong', { className: 'text-gray-600' }, 'Tickets: '),
                React.createElement('span', { className: 'text-gray-900' }, getTicketsDisplay(currentOrderDetail))
              )
            ),
            React.createElement('div', null,
              React.createElement('p', { className: 'mb-2' }, 
                React.createElement('strong', { className: 'text-gray-600' }, 'Event Date: '),
                React.createElement('span', { className: 'text-gray-900' }, 
                  currentOrderDetail.event_date ? new Date(currentOrderDetail.event_date).toLocaleDateString() : 'N/A'
                )
              ),
              React.createElement('p', { className: 'mb-2' }, 
                React.createElement('strong', { className: 'text-gray-600' }, 'Status: '),
                React.createElement('span', { 
                  className: `px-2 py-1 rounded text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`
                }, statusStyle.label)
              )
            )
          )
        ),

        // Financial Details Section
        React.createElement('div', null,
          React.createElement('div', { className: 'flex items-center mb-3' },
            React.createElement('span', { className: 'text-yellow-600 text-lg mr-2' }, '💰'),
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 dark:text-white' }, 'Financial Details')
          ),
          React.createElement('div', { className: 'grid grid-cols-2 gap-4 text-sm' },
            React.createElement('div', null,
              React.createElement('p', { className: 'mb-2' }, 
                React.createElement('strong', { className: 'text-gray-600' }, 'Total Amount: '),
                React.createElement('span', { className: 'text-gray-900 font-semibold' }, '₹' + getTotalAmount(currentOrderDetail).toLocaleString())
              ),
              React.createElement('p', { className: 'mb-2' }, 
                React.createElement('strong', { className: 'text-gray-600' }, 'Balance Due: '),
                React.createElement('span', { className: 'text-red-600 font-semibold' }, '₹' + getBalanceAmount(currentOrderDetail).toLocaleString())
              ),
              React.createElement('p', { className: 'mb-2' }, 
                React.createElement('strong', { className: 'text-gray-600' }, 'Payment Method: '),
                React.createElement('span', { className: 'text-gray-900' }, currentOrderDetail.payment_method || 'Online Payment')
              )
            ),
            React.createElement('div', null,
              React.createElement('p', { className: 'mb-2' }, 
                React.createElement('strong', { className: 'text-gray-600' }, 'Advance Received: '),
                React.createElement('span', { className: 'text-green-600 font-semibold' }, '₹' + getAdvanceAmount(currentOrderDetail).toLocaleString())
              ),
              React.createElement('p', { className: 'mb-2' }, 
                React.createElement('strong', { className: 'text-gray-600' }, 'Total Tax: '),
                React.createElement('span', { className: 'text-gray-900' }, '₹' + getTotalTax(currentOrderDetail).toLocaleString())
              ),
              React.createElement('p', { className: 'mb-2' }, 
                React.createElement('strong', { className: 'text-gray-600' }, 'Transaction ID: '),
                React.createElement('span', { className: 'text-gray-900' }, currentOrderDetail.transaction_id || currentOrderDetail.order_number || 'N/A')
              )
            )
          )
        ),

        // Uploaded Documents Section
        React.createElement('div', null,
          React.createElement('div', { className: 'flex items-center mb-3' },
            React.createElement('span', { className: 'text-purple-600 text-lg mr-2' }, '📎'),
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 dark:text-white' }, 'Uploaded Documents')
          ),
          React.createElement('div', { className: 'grid grid-cols-2 gap-4 text-sm' },
            React.createElement('div', null,
              React.createElement('p', { className: 'mb-2' }, 
                React.createElement('strong', { className: 'text-gray-600' }, 'GST Certificate: '),
                React.createElement('span', { 
                  className: currentOrderDetail.gst_certificate ? 'text-green-600' : 'text-orange-600'
                }, currentOrderDetail.gst_certificate ? 'Uploaded' : 'Not uploaded')
              )
            ),
            React.createElement('div', null,
              React.createElement('p', { className: 'mb-2' }, 
                React.createElement('strong', { className: 'text-gray-600' }, 'PAN Card: '),
                React.createElement('span', { 
                  className: currentOrderDetail.pan_card ? 'text-green-600' : 'text-orange-600'
                }, currentOrderDetail.pan_card ? 'Uploaded' : 'Not uploaded')
              )
            )
          )
        ),

        // Approval Notes (if present)
        currentOrderDetail.approval_notes && React.createElement('div', null,
          React.createElement('div', { className: 'flex items-center mb-3' },
            React.createElement('span', { className: 'text-gray-600 text-lg mr-2' }, '📝'),
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 dark:text-white' }, 'Approval Notes')
          ),
          React.createElement('div', { className: 'bg-gray-50 dark:bg-gray-700 p-4 rounded-lg' },
            React.createElement('p', { className: 'text-gray-900 dark:text-white' }, currentOrderDetail.approval_notes)
          )
        ),

        // Action Buttons
        React.createElement('div', { className: 'flex justify-end space-x-3 pt-4 border-t border-gray-200' },
          currentOrderDetail.status === 'pending_approval' && hasPermission('orders', 'approve') && [
            React.createElement('button', {
              key: 'approve',
              className: 'bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors',
              onClick: () => {
                handleOrderApproval(currentOrderDetail.id, 'approve');
                setShowOrderDetail(false);
              }
            }, '✓ Approve Order'),
            React.createElement('button', {
              key: 'reject',
              className: 'bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors',
              onClick: () => {
                handleOrderApproval(currentOrderDetail.id, 'reject');
                setShowOrderDetail(false);
              }
            }, '✗ Reject Order')
          ]
        )
      )
    )
  );
};

console.log('✅ Enhanced Order Detail Modal component loaded successfully');
