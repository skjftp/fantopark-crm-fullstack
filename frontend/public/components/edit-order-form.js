// Edit Order Form Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

window.renderEditOrderForm = () => {
  if (!showEditOrderForm || !currentOrderForEdit) return null;

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => e.target === e.currentTarget && setShowEditOrderForm(false)
  },
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[95vh] overflow-y-auto' },
      React.createElement('h2', { className: 'text-xl font-bold mb-4' }, 'Edit Order'),
      React.createElement('form', { onSubmit: handleEditOrderSubmit },
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Order Number'),
          React.createElement('input', {
            type: 'text',
            value: orderEditData.order_number || '',
            disabled: true,
            className: 'w-full px-3 py-2 border rounded-md bg-gray-100'
          })
        ),
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Client Name'),
          React.createElement('input', {
            type: 'text',
            value: orderEditData.client_name || '',
            disabled: true,
            className: 'w-full px-3 py-2 border rounded-md bg-gray-100'
          })
        ),
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Assigned To'),
          React.createElement('select', {
            value: orderEditData.assigned_to || '',
            onChange: (e) => setOrderEditData(prev => ({ ...prev, assigned_to: e.target.value })),
            className: 'w-full px-3 py-2 border rounded-md',
            required: true
          },
            React.createElement('option', { value: '' }, 'Select Assignee'),
            ...(users || []).filter(u => ['supply_executive', 'supply_sales_service_manager'].includes(u.role)).map(user =>
              React.createElement('option', { key: user.id || user.email, value: user.email }, user.name)
            )
          )
        ),
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Status'),
          React.createElement('select', {
            value: orderEditData.status || '',
            onChange: (e) => setOrderEditData(prev => ({ ...prev, status: e.target.value })),
            className: 'w-full px-3 py-2 border rounded-md'
          },
            Object.keys(window.ORDER_STATUSES).map(status =>
              React.createElement('option', { key: status, value: status }, 
                window.ORDER_STATUSES[status].label
              )
            )
          )
        ),
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Rejection Reason'),
          React.createElement('textarea', {
            value: orderEditData.rejection_reason || '',
            onChange: (e) => setOrderEditData(prev => ({ ...prev, rejection_reason: e.target.value })),
            className: 'w-full px-3 py-2 border rounded-md',
            rows: 3,
            placeholder: orderEditData.status === 'rejected' ? 'Please provide a reason for rejection' : 'Add rejection reason if applicable',
            required: orderEditData.status === 'rejected'
          })
        ),
        React.createElement('div', { className: 'flex justify-end gap-2' },
          React.createElement('button', {
            type: 'button',
            onClick: () => setShowEditOrderForm(false),
            className: 'px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700'
          }, 'Cancel'),
          React.createElement('button', {
            type: 'submit',
            disabled: loading,
            className: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
          }, loading ? 'Updating...' : 'Update Order')
        )
      )
    )
  );
};

console.log('✅ Edit Order Form component loaded successfully');
