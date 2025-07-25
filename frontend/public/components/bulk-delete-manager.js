// Bulk Delete Manager Component for Super Admin
// Allows filtered bulk deletion of leads and orders with safety checks

window.renderBulkDeleteManager = () => {
  const {
    showBulkDeleteManager = window.appState?.showBulkDeleteManager || window.showBulkDeleteManager,
    user = window.appState?.user || window.user,
    events = window.appState?.events || window.events || []
  } = window.appState || {};

  // Check permissions
  if (!user || user.role !== 'super_admin') {
    return null;
  }

  if (!showBulkDeleteManager) {
    return null;
  }

  // State management using React hooks
  const [deleteType, setDeleteType] = React.useState('leads'); // 'leads' or 'orders'
  const [selectedEvent, setSelectedEvent] = React.useState('');
  const [dateRange, setDateRange] = React.useState({ start: '', end: '' });
  const [previewData, setPreviewData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState('');

  // Fetch preview of items to be deleted
  const fetchPreview = async () => {
    if (!selectedEvent) {
      alert('Please select an event');
      return;
    }

    setLoading(true);
    try {
      const filters = {
        event: selectedEvent,
        ...(dateRange.start && { start_date: dateRange.start }),
        ...(dateRange.end && { end_date: dateRange.end })
      };

      const endpoint = deleteType === 'leads' ? '/leads/preview-delete' : '/orders/preview-delete';
      const response = await window.apiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify(filters)
      });

      if (!response.error) {
        setPreviewData(response.data);
      } else {
        alert('Error fetching preview: ' + response.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Execute bulk delete
  const executeBulkDelete = async () => {
    if (confirmText !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }

    if (!previewData || previewData.count === 0) {
      alert('No items to delete');
      return;
    }

    const confirmed = window.confirm(
      `⚠️ FINAL WARNING ⚠️\n\n` +
      `You are about to permanently delete ${previewData.count} ${deleteType}.\n` +
      `This action CANNOT be undone.\n\n` +
      `Are you absolutely sure?`
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const filters = {
        event: selectedEvent,
        ...(dateRange.start && { start_date: dateRange.start }),
        ...(dateRange.end && { end_date: dateRange.end })
      };

      const endpoint = deleteType === 'leads' ? '/leads/bulk-delete' : '/orders/bulk-delete';
      const response = await window.apiCall(endpoint, {
        method: 'DELETE',
        body: JSON.stringify(filters)
      });

      if (!response.error) {
        alert(`Successfully deleted ${response.data.deletedCount} ${deleteType}`);
        // Reset form
        setPreviewData(null);
        setConfirmText('');
        setSelectedEvent('');
        setDateRange({ start: '', end: '' });
      } else {
        alert('Error during deletion: ' + response.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
  },
    React.createElement('div', {
      className: 'bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto'
    },
      // Header
      React.createElement('div', { className: 'flex justify-between items-center mb-6' },
        React.createElement('h2', { className: 'text-2xl font-bold text-red-600' }, 
          '⚠️ Bulk Delete Manager'
        ),
        React.createElement('button', {
          onClick: () => window.setShowBulkDeleteManager(false),
          className: 'text-gray-500 hover:text-gray-700'
        }, '✕')
      ),

      // Warning Banner
      React.createElement('div', { 
        className: 'bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6'
      },
        React.createElement('p', { className: 'text-red-800 font-semibold' },
          '🚨 CRITICAL WARNING: This tool permanently deletes data from the database. Use with extreme caution!'
        )
      ),

      // Delete Type Selection
      React.createElement('div', { className: 'mb-6' },
        React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 
          'What do you want to delete?'
        ),
        React.createElement('div', { className: 'flex space-x-4' },
          React.createElement('label', { className: 'flex items-center' },
            React.createElement('input', {
              type: 'radio',
              name: 'deleteType',
              value: 'leads',
              checked: deleteType === 'leads',
              onChange: (e) => {
                setDeleteType(e.target.value);
                setPreviewData(null);
              },
              className: 'mr-2'
            }),
            React.createElement('span', null, 'Leads')
          ),
          React.createElement('label', { className: 'flex items-center' },
            React.createElement('input', {
              type: 'radio',
              name: 'deleteType',
              value: 'orders',
              checked: deleteType === 'orders',
              onChange: (e) => {
                setDeleteType(e.target.value);
                setPreviewData(null);
              },
              className: 'mr-2'
            }),
            React.createElement('span', null, 'Orders')
          )
        )
      ),

      // Filters
      React.createElement('div', { className: 'space-y-4 mb-6' },
        // Event Selection
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 
            'Event Name *'
          ),
          React.createElement('select', {
            value: selectedEvent,
            onChange: (e) => {
              setSelectedEvent(e.target.value);
              setPreviewData(null);
            },
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500',
            disabled: loading
          },
            React.createElement('option', { value: '' }, 'Select an event...'),
            events.map(event => 
              React.createElement('option', { key: event.id, value: event.name }, 
                event.name
              )
            )
          )
        ),

        // Date Range (Optional)
        React.createElement('div', { className: 'grid grid-cols-2 gap-4' },
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 
              'Start Date (Optional)'
            ),
            React.createElement('input', {
              type: 'date',
              value: dateRange.start,
              onChange: (e) => {
                setDateRange(prev => ({ ...prev, start: e.target.value }));
                setPreviewData(null);
              },
              className: 'w-full px-3 py-2 border border-gray-300 rounded-md',
              disabled: loading
            })
          ),
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 
              'End Date (Optional)'
            ),
            React.createElement('input', {
              type: 'date',
              value: dateRange.end,
              onChange: (e) => {
                setDateRange(prev => ({ ...prev, end: e.target.value }));
                setPreviewData(null);
              },
              className: 'w-full px-3 py-2 border border-gray-300 rounded-md',
              disabled: loading
            })
          )
        )
      ),

      // Preview Button
      React.createElement('button', {
        onClick: fetchPreview,
        disabled: loading || !selectedEvent,
        className: 'w-full bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50 mb-6'
      }, loading ? 'Loading...' : 'Preview Items to Delete'),

      // Preview Results
      previewData && React.createElement('div', { 
        className: 'bg-gray-50 rounded-lg p-4 mb-6'
      },
        React.createElement('h3', { className: 'font-semibold mb-2' }, 
          `Found ${previewData.count} ${deleteType} to delete`
        ),
        
        // Show sample items
        previewData.items && previewData.items.length > 0 && 
        React.createElement('div', { className: 'space-y-2' },
          React.createElement('p', { className: 'text-sm text-gray-600' }, 
            'Sample items (showing first 5):'
          ),
          React.createElement('ul', { className: 'text-sm space-y-1' },
            previewData.items.slice(0, 5).map((item, index) => 
              React.createElement('li', { key: index, className: 'pl-4' },
                deleteType === 'leads' 
                  ? `• ${item.name || 'Unknown'} - ${item.phone || 'No phone'} - ${item.date_of_enquiry || 'No date'}`
                  : `• Order #${item.order_id || 'Unknown'} - ${item.lead_name || 'Unknown'} - ₹${item.final_amount || 0}`
              )
            )
          ),
          previewData.count > 5 && 
          React.createElement('p', { className: 'text-sm text-gray-500 italic' }, 
            `... and ${previewData.count - 5} more`
          )
        )
      ),

      // Delete Confirmation
      previewData && previewData.count > 0 && React.createElement('div', { 
        className: 'bg-red-50 border-2 border-red-300 rounded-lg p-4'
      },
        React.createElement('p', { className: 'font-semibold mb-3' }, 
          'Type DELETE to confirm bulk deletion:'
        ),
        React.createElement('input', {
          type: 'text',
          value: confirmText,
          onChange: (e) => setConfirmText(e.target.value),
          placeholder: 'Type DELETE here',
          className: 'w-full px-3 py-2 border border-red-300 rounded-md mb-3',
          disabled: loading
        }),
        React.createElement('button', {
          onClick: executeBulkDelete,
          disabled: loading || confirmText !== 'DELETE',
          className: 'w-full bg-red-600 text-white px-4 py-3 rounded hover:bg-red-700 disabled:opacity-50 font-semibold'
        }, 
          loading ? 'Deleting...' : `Permanently Delete ${previewData.count} ${deleteType}`
        )
      ),

      // Footer
      React.createElement('div', { className: 'mt-6 flex justify-end' },
        React.createElement('button', {
          onClick: () => window.setShowBulkDeleteManager(false),
          className: 'bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600'
        }, 'Close')
      )
    )
  );
};

console.log('✅ Bulk Delete Manager loaded');