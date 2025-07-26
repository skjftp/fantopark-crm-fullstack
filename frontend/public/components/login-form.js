// ============================================================================
// LOGIN FORM COMPONENT
// ============================================================================

window.renderLogin = function() {
  const { email = '', password = '', loading = false } = window.appState || {};
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!window.handleLogin) {
      console.error('handleLogin function not available');
      alert('Login system is initializing. Please try again in a moment.');
      return;
    }
    
    await window.handleLogin(e);
  };
  
  const handleInputChange = (field, value) => {
    if (window.setState) {
      window.setState(prev => ({ ...prev, [field]: value }));
    }
  };
  
  return React.createElement('div', {
    className: 'min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4'
  },
    React.createElement('div', {
      className: 'max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8'
    },
      React.createElement('div', { className: 'text-center mb-8' },
        React.createElement('h1', { 
          className: 'text-3xl font-bold text-gray-900 dark:text-white mb-2' 
        }, 'Fantopark CRM'),
        React.createElement('p', { 
          className: 'text-gray-600 dark:text-gray-400' 
        }, 'Sign in to your account')
      ),
      
      React.createElement('form', { onSubmit: handleSubmit, className: 'space-y-6' },
        React.createElement('div', null,
          React.createElement('label', {
            htmlFor: 'email',
            className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
          }, 'Email Address'),
          React.createElement('input', {
            type: 'email',
            id: 'email',
            value: email,
            onChange: (e) => handleInputChange('email', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white',
            placeholder: 'you@example.com',
            required: true,
            autoComplete: 'email',
            disabled: loading
          })
        ),
        
        React.createElement('div', null,
          React.createElement('label', {
            htmlFor: 'password',
            className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
          }, 'Password'),
          React.createElement('input', {
            type: 'password',
            id: 'password',
            value: password,
            onChange: (e) => handleInputChange('password', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white',
            placeholder: '••••••••',
            required: true,
            autoComplete: 'current-password',
            disabled: loading
          })
        ),
        
        React.createElement('div', null,
          React.createElement('button', {
            type: 'submit',
            disabled: loading,
            className: `w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`
          }, loading ? 'Signing in...' : 'Sign In')
        )
      ),
      
      // Session expiry note
      window.localStorage.getItem('redirect_after_login') && 
      React.createElement('div', {
        className: 'mt-4 text-center text-sm text-gray-600 dark:text-gray-400'
      }, 'Your session expired. Please sign in again to continue.')
    )
  );
};

console.log('✅ Login form component loaded');