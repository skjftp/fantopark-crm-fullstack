// Helper function to get tab title
function getTabTitle(tab) {
  const titles = {
    'dashboard': 'Dashboard',
    'leads': 'Leads',
    'inventory': 'Inventory',
    'orders': 'Orders',
    'delivery': 'Delivery',
    'financials': 'Financials',
    'stadiums': 'Stadiums',
    'sports-calendar': 'Sports Calendar',
    'reminders': 'Reminders',
    'myactions': 'My Actions',
    'assignment-rules': 'Assignment Rules',
    'user-management': 'User Management',
    'role-management': 'Role Management'
  };
  return titles[tab] || 'FanToPark CRM';
}

// Replace the sidebar and main content section in SimplifiedApp component with this responsive version
window.renderResponsiveLayout = () => {
  const { activeTab, loading, user, isMobileMenuOpen } = window.appState;
  
  return React.createElement('div', { className: 'min-h-screen bg-gray-50 dark:bg-gray-900' },
    // Mobile Header - Only visible on mobile
    React.createElement('div', { 
      className: 'lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 shadow-md z-30 flex items-center justify-between px-4'
    },
      // Menu button space (actual button is rendered by sidebar)
      React.createElement('div', { className: 'w-10' }),
      
      // Title
      React.createElement('h1', { 
        className: 'text-lg font-semibold text-gray-900 dark:text-white tracking-tight'
      }, getTabTitle(activeTab)), // <-- FIXED: Added comma here
      
      // User avatar/menu
      React.createElement('div', { className: 'w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center' },
        React.createElement('span', { className: 'text-sm font-medium' }, 
          user?.name?.charAt(0)?.toUpperCase() || 'U'
        )
      )
    ),
    
    // Sidebar
    window.renderMobileSidebar && window.renderMobileSidebar(), // Added check
    
    // Main Content Area
    React.createElement('div', {
      className: `transition-all duration-300 ${
        isMobileMenuOpen ? 'lg:ml-64' : 'lg:ml-64'
      }`
    },
      // Content Container with proper padding for mobile
      React.createElement('div', {
        className: 'p-4 lg:p-6 pt-20 lg:pt-6' // Extra top padding on mobile for fixed header
      },
        loading ? 
          React.createElement('div', { className: 'flex items-center justify-center h-64' },
            React.createElement('div', { className: 'text-lg' }, 'Loading...')
          ) :
          window.renderContent && window.renderContent() // Added check
      )
    )
  );
};

// Update the SimplifiedApp component to use the responsive layout
window.updateSimplifiedAppForMobile = () => {
  const originalSimplifiedApp = window.SimplifiedApp;
  
  window.SimplifiedApp = () => {
    const { isLoggedIn, loading } = window.appState;
    
    if (!isLoggedIn) {
      return window.renderLogin();
    }
    
    // Use responsive layout instead of the old layout
    return window.renderResponsiveLayout();
  };
};
