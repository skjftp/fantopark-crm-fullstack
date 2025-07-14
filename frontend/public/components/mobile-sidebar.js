// Add this to your main-app-component.js after other state declarations

// Mobile menu state
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

// Add to window.appState object
window.appState = {
  // ... existing state ...
  isMobileMenuOpen, setIsMobileMenuOpen,
};

// Mobile Responsive Sidebar Component
window.renderMobileSidebar = () => {
  const { activeTab, setActiveTab, user, isMobileMenuOpen, setIsMobileMenuOpen } = window.appState;
  
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'leads', label: 'Leads', icon: '👥' },
    { id: 'inventory', label: 'Inventory', icon: '📦' },
    { id: 'orders', label: 'Orders', icon: '📋' },
    { id: 'delivery', label: 'Delivery', icon: '🚚' },
    { id: 'financials', label: 'Financials', icon: '💰' },
    { id: 'stadiums', label: 'Stadiums', icon: '🏟️' },
    { id: 'sports-calendar', label: 'Sports Calendar', icon: '📅' },
    { id: 'reminders', label: 'Reminders', icon: '🔔' },
    { id: 'myactions', label: 'My Actions', icon: '📌' }
  ];
  
  // Add role-specific items
  if (user?.role === 'super_admin' || user?.role === 'admin') {
    navigationItems.push(
      { id: 'assignment-rules', label: 'Assignment Rules', icon: '🔄' },
      { id: 'user-management', label: 'User Management', icon: '👤' }
    );
  }
  
  if (user?.role === 'super_admin') {
    navigationItems.push({ id: 'role-management', label: 'Role Management', icon: '🛡️' });
  }

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false); // Close menu on mobile after selection
  };

  return React.createElement('div', null,
    // Mobile Menu Button - Only visible on mobile
    React.createElement('div', { 
      className: 'lg:hidden fixed top-4 left-4 z-50'
    },
      React.createElement('button', {
        onClick: () => setIsMobileMenuOpen(!isMobileMenuOpen),
        className: 'p-2 rounded-md bg-white shadow-lg hover:bg-gray-100'
      },
        React.createElement('svg', {
          className: 'w-6 h-6',
          fill: 'none',
          stroke: 'currentColor',
          viewBox: '0 0 24 24'
        },
          isMobileMenuOpen ? 
            React.createElement('path', {
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              strokeWidth: 2,
              d: 'M6 18L18 6M6 6l12 12'
            }) :
            React.createElement('path', {
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              strokeWidth: 2,
              d: 'M4 6h16M4 12h16M4 18h16'
            })
        )
      )
    ),
    
    // Overlay for mobile - closes menu when clicked
    isMobileMenuOpen && React.createElement('div', {
      className: 'lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40',
      onClick: () => setIsMobileMenuOpen(false)
    }),
    
    // Sidebar
    React.createElement('div', {
      className: `fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`
    },
      // Logo/Header
      React.createElement('div', { className: 'p-4 border-b dark:border-gray-700' },
        React.createElement('div', { className: 'flex items-center space-x-3' },
          React.createElement('img', {
            src: '/favicon.ico',
            alt: 'FanToPark',
            className: 'w-8 h-8'
          }),
          React.createElement('h1', { className: 'text-xl font-bold' }, 'FanToPark CRM')
        )
      ),
      
      // User Info
      React.createElement('div', { className: 'p-4 border-b dark:border-gray-700' },
        React.createElement('div', { className: 'text-sm' },
          React.createElement('p', { className: 'font-semibold' }, user?.name || 'User'),
          React.createElement('p', { className: 'text-gray-500 text-xs' }, user?.role || 'Role')
        )
      ),
      
      // Navigation
      React.createElement('nav', { className: 'flex-1 overflow-y-auto p-4' },
        React.createElement('ul', { className: 'space-y-2' },
          navigationItems.map(item =>
            React.createElement('li', { key: item.id },
              React.createElement('button', {
                onClick: () => handleNavClick(item.id),
                className: `w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              },
                React.createElement('span', { className: 'text-lg' }, item.icon),
                React.createElement('span', { className: 'text-sm font-medium' }, item.label)
              )
            )
          )
        )
      ),
      
      // Logout Button
      React.createElement('div', { className: 'p-4 border-t dark:border-gray-700' },
        React.createElement('button', {
          onClick: window.handleLogout,
          className: 'w-full flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600'
        },
          React.createElement('span', null, '🚪'),
          React.createElement('span', { className: 'text-sm font-medium' }, 'Logout')
        )
      )
    )
  );
};
