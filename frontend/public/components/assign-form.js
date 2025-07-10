// Assign Form Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

window.renderAssignForm = () => {
  if (!window.showAssignForm || !window.currentLead) return null;
  
  const teamMembers = formData.assigned_team === 'supply' 
    ? (users || []).filter(u => ['supply_executive', 'supply_sales_service_manager'].includes(u.role)) 
    : (users || []).filter(u => ['sales_executive', 'sales_manager'].includes(u.role));

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => e.target === e.currentTarget && closeForm()
  },
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md' },
      React.createElement('div', { className: 'flex justify-between items-center mb-6' },
        React.createElement('h2', { className: 'text-xl font-bold text-gray-900 dark:text-white' }, 
          'Assign Lead: ' + (currentLead.name)
        ),
        React.createElement('button', {
          onClick: closeForm,
          className: 'text-gray-400 hover:text-gray-600 text-2xl'
        }, '✕')
      ),
      React.createElement('form', { onSubmit: handleAssignLead },
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 
            'Team'
          ),
          React.createElement('select', {
            value: formData.assigned_team || 'sales',
            onChange: (e) => handleInputChange('assigned_team', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
            required: true
          },
            React.createElement('option', { value: 'sales' }, 'Sales Team'),
            React.createElement('option', { value: 'supply' }, 'Supply Team')
          )
        ),
        React.createElement('div', { className: 'mb-6' },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 
            'Assign To'
          ),
          React.createElement('select', {
            value: formData.assigned_to || '',
            onChange: (e) => handleInputChange('assigned_to', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
            required: true
          },
            React.createElement('option', { value: '' }, 'Select Team Member'),
            teamMembers.map(user =>
              React.createElement('option', { key: user.id, value: user.email }, user.name)
            )
          )
        ),
        React.createElement('div', { className: 'flex space-x-4' },
          React.createElement('button', {
            type: 'button',
            onClick: closeForm,
            className: 'flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50'
          }, 'Cancel'),
          React.createElement('button', {
            type: 'submit',
            disabled: loading,
            className: 'flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50'
          }, loading ? 'Assigning...' : 'Assign')
        )
      )
    )
  );
};

console.log('✅ Assign Form component loaded successfully');
