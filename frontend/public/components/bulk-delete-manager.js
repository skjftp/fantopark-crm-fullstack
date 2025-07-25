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

  // State management using window state (React hooks not available in this setup)
  if (!window.bulkDeleteState) {
    window.bulkDeleteState = {
      deleteType: 'leads',
      selectedEvent: '',
      dateRange: { start: '', end: '' },
      previewData: null,
      loading: false,
      confirmText: ''
    };
  }
  
  const state = window.bulkDeleteState;
  
  // Helper function to update state and re-render
  const updateState = (updates) => {
    Object.assign(window.bulkDeleteState, updates);
    // Force re-render by calling renderApp from the parent page
    if (window.renderApp) {
      window.renderApp();
    }
  };

  // Fetch preview of items to be deleted
  const fetchPreview = async () => {
    if (!state.selectedEvent) {
      alert('Please select an event');
      return;
    }

    updateState({ loading: true });
    try {
      const filters = {
        event: state.selectedEvent,
        ...(state.dateRange.start && { start_date: state.dateRange.start }),
        ...(state.dateRange.end && { end_date: state.dateRange.end })
      };

      const endpoint = state.deleteType === 'leads' ? '/leads/preview-delete' : '/orders/preview-delete';
      const response = await window.apiCall(endpoint, {
        method: 'POST',
        body: JSON.stringify(filters)
      });

      if (!response.error) {
        updateState({ previewData: response.data });
      } else {
        alert('Error fetching preview: ' + response.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      updateState({ loading: false });
    }
  };

  // Execute bulk delete
  const executeBulkDelete = async () => {
    if (state.confirmText !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }

    if (!state.previewData || state.previewData.count === 0) {
      alert('No items to delete');
      return;
    }

    const confirmed = window.confirm(
      `⚠️ FINAL WARNING ⚠️\n\n` +
      `You are about to permanently delete ${state.previewData.count} ${state.deleteType}.\n` +
      `This action CANNOT be undone.\n\n` +
      `Are you absolutely sure?`
    );

    if (!confirmed) return;

    updateState({ loading: true });
    try {
      const filters = {
        event: state.selectedEvent,
        ...(state.dateRange.start && { start_date: state.dateRange.start }),
        ...(state.dateRange.end && { end_date: state.dateRange.end })
      };

      const endpoint = state.deleteType === 'leads' ? '/leads/bulk-delete' : '/orders/bulk-delete';
      const response = await window.apiCall(endpoint, {
        method: 'DELETE',
        body: JSON.stringify(filters)
      });

      if (!response.error) {
        alert(`Successfully deleted ${response.data.deletedCount} ${state.deleteType}`);
        // Reset form
        updateState({
          previewData: null,
          confirmText: '',
          selectedEvent: '',
          dateRange: { start: '', end: '' }
        });
      } else {
        alert('Error during deletion: ' + response.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      updateState({ loading: false });
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
              checked: state.deleteType === 'leads',
              onChange: (e) => {
                updateState({
                  deleteType: e.target.value,
                  previewData: null
                });
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
              checked: state.deleteType === 'orders',
              onChange: (e) => {
                updateState({
                  deleteType: e.target.value,
                  previewData: null
                });
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
            value: state.selectedEvent,
            onChange: (e) => {
              updateState({
                selectedEvent: e.target.value,
                previewData: null
              });
            },
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500',
            disabled: state.loading
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
              value: state.dateRange.start,
              onChange: (e) => {
                updateState({
                  dateRange: { ...state.dateRange, start: e.target.value },
                  previewData: null
                });
              },
              className: 'w-full px-3 py-2 border border-gray-300 rounded-md',
              disabled: state.loading
            })
          ),
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 
              'End Date (Optional)'
            ),
            React.createElement('input', {
              type: 'date',
              value: state.dateRange.end,
              onChange: (e) => {
                updateState({
                  dateRange: { ...state.dateRange, end: e.target.value },
                  previewData: null
                });
              },
              className: 'w-full px-3 py-2 border border-gray-300 rounded-md',
              disabled: state.loading
            })
          )
        )
      ),

      // Preview Button
      React.createElement('button', {
        onClick: fetchPreview,
        disabled: state.loading || !state.selectedEvent,
        className: 'w-full bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50 mb-6'
      }, state.loading ? 'Loading...' : 'Preview Items to Delete'),

      // Preview Results
      state.previewData && React.createElement('div', { 
        className: 'bg-gray-50 rounded-lg p-4 mb-6'
      },
        React.createElement('h3', { className: 'font-semibold mb-2' }, 
          `Found ${state.previewData.count} ${state.deleteType} to delete`
        ),
        
        // Show sample items
        state.previewData.items && state.previewData.items.length > 0 && 
        React.createElement('div', { className: 'space-y-2' },
          React.createElement('p', { className: 'text-sm text-gray-600' }, 
            'Sample items (showing first 5):'
          ),
          React.createElement('ul', { className: 'text-sm space-y-1' },
            state.previewData.items.slice(0, 5).map((item, index) => 
              React.createElement('li', { key: index, className: 'pl-4' },
                state.deleteType === 'leads' 
                  ? `• ${item.name || 'Unknown'} - ${item.phone || 'No phone'} - ${item.date_of_enquiry || 'No date'}`
                  : `• Order #${item.order_id || 'Unknown'} - ${item.lead_name || 'Unknown'} - ₹${item.final_amount || 0}`
              )
            )
          ),
          state.previewData.count > 5 && 
          React.createElement('p', { className: 'text-sm text-gray-500 italic' }, 
            `... and ${state.previewData.count - 5} more`
          )
        )
      ),

      // Delete Confirmation
      state.previewData && state.previewData.count > 0 && React.createElement('div', { 
        className: 'bg-red-50 border-2 border-red-300 rounded-lg p-4'
      },
        React.createElement('p', { className: 'font-semibold mb-3' }, 
          'Type DELETE to confirm bulk deletion:'
        ),
        React.createElement('input', {
          type: 'text',
          value: state.confirmText,
          onChange: (e) => updateState({ confirmText: e.target.value }),
          placeholder: 'Type DELETE here',
          className: 'w-full px-3 py-2 border border-red-300 rounded-md mb-3',
          disabled: state.loading
        }),
        React.createElement('button', {
          onClick: executeBulkDelete,
          disabled: state.loading || state.confirmText !== 'DELETE',
          className: 'w-full bg-red-600 text-white px-4 py-3 rounded hover:bg-red-700 disabled:opacity-50 font-semibold'
        }, 
          state.loading ? 'Deleting...' : `Permanently Delete ${state.previewData.count} ${state.deleteType}`
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