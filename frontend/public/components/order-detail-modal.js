// Order Detail Modal Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

window.renderOrderDetailModal = () => {
  if (!window.showOrderDetail || !window.currentOrderDetail) return null;
  
  return React.createElement('div', { 
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => e.target === e.currentTarget && setShowOrderDetail(false)
  },
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6' },
      React.createElement('div', { className: 'flex justify-between items-center mb-4' },
        React.createElement('h2', { className: 'text-2xl font-bold' }, 
          'Order Details: ' + (currentOrderDetail.order_number)
        ),
        React.createElement('button', {
          onClick: () => setShowOrderDetail(false),
          className: 'text-gray-400 hover:text-gray-600 text-2xl'
        }, '✕')
      ),
      React.createElement('div', { className: 'space-y-4' },
        React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
          React.createElement('div', null,
            React.createElement('h3', { className: 'font-semibold mb-2' }, 'Client Information'),
            React.createElement('p', null, React.createElement('strong', null, 'Name: '), currentOrderDetail.client_name),
            React.createElement('p', null, React.createElement('strong', null, 'Email: '), currentOrderDetail.client_email),
            React.createElement('p', null, React.createElement('strong', null, 'Phone: '), currentOrderDetail.client_phone)
          ),
          React.createElement('div', null,
            React.createElement('h3', { className: 'font-semibold mb-2' }, 'Order Information'),
            React.createElement('p', null, React.createElement('strong', null, 'Event: '), currentOrderDetail.event_name || 'N/A'),
            React.createElement('p', null, React.createElement('strong', null, 'Tickets: '), currentOrderDetail.tickets_allocated || 0),
            React.createElement('p', null, React.createElement('strong', null, 'Amount: '), '₹' + (currentOrderDetail.total_amount || 0))
          )
        ),
        currentOrderDetail.approval_notes && React.createElement('div', { className: 'bg-gray-100 dark:bg-gray-700 p-4 rounded' },
          React.createElement('h3', { className: 'font-semibold mb-2' }, 'Approval Notes'),
          React.createElement('p', null, currentOrderDetail.approval_notes)
        ),
        React.createElement('div', { className: 'flex justify-end space-x-2 mt-6' },
          currentOrderDetail.status === 'pending_approval' && window.hasPermission('orders', 'approve') && [
            React.createElement('button', {
              key: 'approve',
              className: 'bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700',
              onClick: () => {
                handleOrderApproval(currentOrderDetail.id, 'approve');
                setShowOrderDetail(false);
              }
            }, 'Approve Order'),
            React.createElement('button', {
              key: 'reject',
              className: 'bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700',
              onClick: () => {
                handleOrderApproval(currentOrderDetail.id, 'reject');
                setShowOrderDetail(false);
              }
            }, 'Reject Order')
          ]
        )
      )
    )
  );
};

console.log('✅ Order Detail Modal component loaded successfully');
