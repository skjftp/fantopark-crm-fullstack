// Choice Modal Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

window.renderChoiceModal = () => {
  if (!showChoiceModal) return null;
  
  return React.createElement('div', { 
    className: 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50' 
  },
    React.createElement('div', { 
      className: 'bg-white rounded-lg p-6 w-full max-w-md' 
    },
      React.createElement('h3', { 
        className: 'text-lg font-medium text-gray-900 mb-4' 
      }, 'Choose Next Step for: ' + (currentLeadForChoice?.name || '')),
      React.createElement('div', { className: 'space-y-2' },
        choiceOptions.map((option, index) =>
          React.createElement('button', {
            key: index,
            onClick: () => handleChoiceSelection(option),
            disabled: loading,
            className: `w-full p-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
              option.requires_followup_date ? 'border-indigo-300 bg-indigo-50' : ''
            }`
          },
            React.createElement('div', { className: 'flex items-center justify-between' },
              React.createElement('span', { className: 'flex items-center' },
                React.createElement('span', { className: 'text-lg mr-2' }, option.icon || '📝'),
                React.createElement('span', { className: 'font-medium' }, option.label)
              ),
              option.requires_followup_date && 
                React.createElement('span', { 
                  className: 'text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded' 
                }, 'Requires Follow-up Date')
            )
          )
        )
      ),
      React.createElement('div', { className: 'mt-6 flex justify-end' },
        React.createElement('button', {
          onClick: () => setShowChoiceModal(false),
          className: 'px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50'
        }, 'Cancel')
      )
    )
  );
};

console.log('✅ Choice Modal component loaded successfully');
