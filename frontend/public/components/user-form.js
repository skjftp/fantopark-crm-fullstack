// User Form Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

window.renderUserForm = () => {
  if (!window.showUserForm) return null;

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => e.target === e.currentTarget && closeUserForm()
  },
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg' },
      React.createElement('div', { className: 'flex justify-between items-center mb-6' },
        React.createElement('h2', { className: 'text-xl font-bold text-gray-900 dark:text-white' }, 
          currentUser ? 'Edit User' : 'Add New User'
        ),
        React.createElement('button', {
          onClick: () => closeUserForm(),
          className: 'text-gray-400 hover:text-gray-600 text-2xl'
        }, '✕')
      ),
      React.createElement('form', { onSubmit: handleUserSubmit },
        React.createElement('div', { className: 'space-y-4' },
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Full Name *'),
            React.createElement('input', {
            type: 'text',
            autoComplete: 'name',
            value: userFormData.name || '',
            onChange: (e) => handleUserInputChange('name', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
            required: true
          })
          ),
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Email *'),
            React.createElement('input', {
            type: 'email',
            autoComplete: 'email',
            value: userFormData.email || '',
            onChange: (e) => handleUserInputChange('email', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
            required: true
          })
          ),
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
              currentUser ? 'Password (leave blank to keep current)' : 'Password *'
            ),
            React.createElement('input', {
              type: 'password',
              autoComplete: 'current-password',
              value: userFormData.password || '',
              onChange: (e) => handleUserInputChange('password', e.target.value),
              className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
              required: !currentUser
            })
          ),
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Role *'),
            React.createElement('select', {
              value: userFormData.role || 'viewer',
              onChange: (e) => handleUserInputChange('role', e.target.value),
              className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
              required: true
            },
              roles.map(role =>
                React.createElement('option', { key: role.name, value: role.name }, role.label)
              )
            )
          ),
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Department'),
            React.createElement('select', {
              value: userFormData.department || '',
              onChange: (e) => handleUserInputChange('department', e.target.value),
              className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500'
            },
              React.createElement('option', { value: '' }, 'Select Department'),
              ['Administration', 'Sales', 'Supply Chain', 'Finance', 'Marketing', 'Operations'].map(dept =>
                React.createElement('option', { key: dept, value: dept }, dept)
              )
            )
          ),
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Status *'),
            React.createElement('select', {
              value: userFormData.status || 'active',
              onChange: (e) => handleUserInputChange('status', e.target.value),
              className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
              required: true
            },
              React.createElement('option', { value: 'active' }, 'Active'),
              React.createElement('option', { value: 'inactive' }, 'Inactive'),
              React.createElement('option', { value: 'suspended' }, 'Suspended')
            )
          )
        ),
        React.createElement('div', { className: 'flex space-x-4 mt-6 pt-4 border-t' },
          React.createElement('button', {
            type: 'button',
            onClick: () => closeUserForm(),
            className: 'flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50'
          }, 'Cancel'),
          React.createElement('button', {
            type: 'submit',
            disabled: loading,
            className: 'flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50'
          }, loading ? 'Saving...' : (currentUser ? 'Update User' : 'Create User'))
        )
      )
    )
  );
};

console.log('✅ User Form component loaded successfully');
