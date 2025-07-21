// Mobile Navigation Component for FanToPark CRM
// Bottom tab navigation for better mobile UX

window.MobileBottomNavigation = function() {
  console.log('MobileBottomNavigation rendering');
  const state = window.appState;
  const { activeTab, user } = state;

  // Define navigation items based on user permissions
  const getNavigationItems = () => {
    const items = [
      {
        id: 'dashboard',
        label: 'Home',
        icon: '🏠',
        show: true
      },
      {
        id: 'leads',
        label: 'Leads',
        icon: '👥',
        show: true // Always show for now
      },
      {
        id: 'inventory',
        label: 'Inventory',
        icon: '📦',
        show: true // Always show for now
      },
      {
        id: 'orders',
        label: 'Orders',
        icon: '🎫',
        show: true // Always show for now
      },
      {
        id: 'more',
        label: 'More',
        icon: '⋯',
        show: true
      }
    ];

    console.log('Mobile nav items:', items);
    return items.filter(item => item.show);
  };

  const handleNavClick = (tabId) => {
    if (tabId === 'more') {
      // Show more menu
      state.setShowMobileMenu(true);
    } else {
      state.setActiveTab(tabId);
      // Close any open modals/menus
      if (state.setShowMobileMenu) {
        state.setShowMobileMenu(false);
      }
    }
  };

  const navItems = getNavigationItems();

  return React.createElement('nav', {
    className: 'mobile-bottom-nav'
  },
    navItems.map(item => 
      React.createElement('div', {
        key: item.id,
        className: `mobile-nav-item ${activeTab === item.id ? 'active' : ''} touchable`,
        onClick: () => handleNavClick(item.id)
      },
        React.createElement('span', { className: 'mobile-nav-icon' }, item.icon),
        React.createElement('span', { className: 'mobile-nav-label' }, item.label)
      )
    )
  );
};

// Mobile Header Component
window.MobileHeader = function() {
  const state = window.appState;
  const { activeTab, user } = state;

  const getPageTitle = () => {
    const titles = {
      'dashboard': 'Dashboard',
      'leads': 'Leads',
      'inventory': 'Inventory',
      'orders': 'Orders',
      'delivery': 'Deliveries',
      'financials': 'Financials',
      'sales-performance': 'Sales Performance',
      'marketing-performance': 'Marketing Performance',
      'stadiums': 'Stadiums',
      'sports-calendar': 'Sports Calendar',
      'reminders': 'Reminders',
      'myactions': 'My Actions',
      'assignment-rules': 'Assignment Rules',
      'user-management': 'Users',
      'role-management': 'Roles'
    };
    return titles[activeTab] || 'FanToPark CRM';
  };

  const handleActionClick = () => {
    // Handle page-specific actions
    switch(activeTab) {
      case 'leads':
        if (window.hasPermission('leads', 'create')) {
          state.setShowAddForm(true);
          state.setCurrentForm('lead');
        }
        break;
      case 'inventory':
        if (window.hasPermission('inventory', 'create')) {
          state.setShowInventoryForm(true);
        }
        break;
      case 'orders':
        // Orders are created from leads
        break;
      default:
        break;
    }
  };

  const showActionButton = () => {
    switch(activeTab) {
      case 'leads':
        return window.hasPermission('leads', 'create');
      case 'inventory':
        return window.hasPermission('inventory', 'create');
      default:
        return false;
    }
  };

return React.createElement('header', {
    className: 'mobile-header mobile-only',
    style: { 
      display: 'flex', 
      alignItems: 'center',
      height: '56px' // Ensure consistent height
    }
  },
    // Empty left side for proper centering
    React.createElement('div', { 
      className: 'mobile-header-action',
      style: { 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        width: '40px',
        height: '40px'
      }
    }),
    
    // Page title with proper vertical centering
    React.createElement('h1', { 
      className: 'mobile-header-title',
      style: { 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        margin: 0,
        padding: 0,
        flex: 1,
        fontSize: '18px',
        fontWeight: 600,
        color: '#111827'
      }
    }, 
      React.createElement('span', { 
        className: 'flex items-center gap-2',
        style: { 
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }
      },
        // Add an icon before the title
        activeTab === 'dashboard' && React.createElement('svg', {
            className: 'w-5 h-5',
            style: { 
              width: '20px', 
              height: '20px',
              flexShrink: 0 
            },
            fill: 'currentColor',
            viewBox: '0 0 20 20'
        },
            React.createElement('path', {
                d: 'M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z'
            })
        ),
        getPageTitle()
      )
    ),
    
    // Action button (add new)
    showActionButton() ?
      React.createElement('div', {
        className: 'mobile-header-action touchable',
        style: { 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: '40px',
          height: '40px'
        },
        onClick: handleActionClick
      },
        React.createElement('span', { 
          style: { 
            fontSize: '20px',
            lineHeight: 1
          } 
        }, '+')
      ) :
      React.createElement('div', { 
        className: 'mobile-header-action',
        style: { 
          width: '40px',
          height: '40px'
        }
      })
  );
};

// Mobile More Menu (Sheet)
window.MobileMoreMenu = function() {
  const state = window.appState;
  const { showMobileMenu, user } = state;

  if (!showMobileMenu) return null;

  const menuItems = [
    {
      id: 'delivery',
      label: 'Deliveries',
      icon: '🚚',
      show: window.hasPermission('deliveries', 'view')
    },
    {
      id: 'financials',
      label: 'Financials',
      icon: '💰',
      show: window.hasPermission('finance', 'view')
    },
    {
      id: 'sales-performance',
      label: 'Sales Performance',
      icon: '📊',
      show: window.hasPermission('reports', 'view')
    },
    {
      id: 'marketing-performance',
      label: 'Marketing Performance',
      icon: '📈',
      show: window.hasPermission('reports', 'view')
    },
    {
      id: 'stadiums',
      label: 'Stadiums',
      icon: '🏟️',
      show: window.hasPermission('stadiums', 'view')
    },
    {
      id: 'sports-calendar',
      label: 'Sports Calendar',
      icon: '📅',
      show: window.hasPermission('events', 'view')
    },
    {
      id: 'assignment-rules',
      label: 'Assignment Rules',
      icon: '🎯',
      show: window.hasPermission('leads', 'assign')
    },
    {
      id: 'myactions',
      label: 'My Actions',
      icon: '📋',
      show: true
    },
    {
      id: 'reminders',
      label: 'Reminders',
      icon: '🔔',
      show: window.hasPermission('reminders', 'view')
    },
    {
      divider: true
    },
    {
      id: 'change-password',
      label: 'Change Password',
      icon: '🔑',
      show: true,
      action: () => {
        state.setShowChangePassword(true);
        state.setShowMobileMenu(false);
      }
    },
    {
      id: 'user-management',
      label: 'User Management',
      icon: '👤',
      show: user?.role === 'super_admin' || user?.role === 'admin'
    },
    {
      id: 'role-management',
      label: 'Role Management',
      icon: '🔐',
      show: user?.role === 'super_admin'
    },
    {
      divider: true
    },
    {
      id: 'dark-mode',
      label: state.darkMode ? 'Light Mode' : 'Dark Mode',
      icon: state.darkMode ? '☀️' : '🌙',
      show: true,
      action: () => {
        const newDarkMode = !state.darkMode;
        state.setDarkMode(newDarkMode);
        localStorage.setItem('crm_dark_mode', newDarkMode);
        document.documentElement.classList.toggle('dark', newDarkMode);
      }
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: '🚪',
      show: true,
      action: () => {
        if (confirm('Are you sure you want to logout?')) {
          window.logout();
        }
      }
    }
  ].filter(item => !item.divider ? item.show : true);

  const handleItemClick = (item) => {
    if (item.action) {
      item.action();
    } else {
      state.setActiveTab(item.id);
      state.setShowMobileMenu(false);
    }
  };

  return React.createElement('div', {
    className: 'mobile-modal'
  },
    // Backdrop
    React.createElement('div', {
      className: 'mobile-modal-backdrop',
      onClick: () => state.setShowMobileMenu(false)
    }),

    // Menu content
    React.createElement('div', {
      className: 'mobile-modal-content'
    },
      // Handle
      React.createElement('div', { className: 'mobile-modal-handle' }),

      // Header
      React.createElement('div', { className: 'mobile-modal-header' },
        React.createElement('h2', { className: 'text-lg font-semibold' }, 'Menu'),
        React.createElement('button', {
          onClick: () => state.setShowMobileMenu(false),
          className: 'mobile-header-action'
        }, '✕')
      ),

      // Menu items
      React.createElement('div', { className: 'mobile-modal-body' },
        menuItems.map((item, index) => 
          item.divider ?
            React.createElement('div', {
              key: `divider-${index}`,
              className: 'h-px bg-gray-200 dark:bg-gray-700 my-2'
            }) :
            React.createElement('div', {
              key: item.id,
              className: 'mobile-list-item touchable',
              onClick: () => handleItemClick(item)
            },
              React.createElement('span', { 
                className: 'text-xl mr-3'
              }, item.icon),
              React.createElement('span', { 
                className: 'flex-1 font-medium'
              }, item.label),
              !item.action && React.createElement('span', { 
                className: 'text-gray-400'
              }, '›')
            )
        )
      )
    )
  );
};

// Mobile Floating Action Button
window.MobileFAB = function() {
  const state = window.appState;
  const { activeTab } = state;

  const showFAB = () => {
    switch(activeTab) {
      case 'leads':
        return window.hasPermission('leads', 'create');
      case 'inventory':
        return window.hasPermission('inventory', 'create');
      case 'reminders':
        return window.hasPermission('reminders', 'create');
      default:
        return false;
    }
  };

  const handleFABClick = () => {
    switch(activeTab) {
      case 'leads':
        state.setShowAddForm(true);
        state.setCurrentForm('lead');
        break;
      case 'inventory':
        state.setShowInventoryForm(true);
        break;
      case 'reminders':
        state.setShowReminderForm(true);
        break;
    }
  };

  if (!showFAB()) return null;

  return React.createElement('button', {
    className: 'mobile-fab mobile-only touchable',
    onClick: handleFABClick
  },
    React.createElement('span', { className: 'mobile-fab-icon' }, '+')
  );
};

// Initialize mobile navigation state safely
if (typeof window.appState !== 'undefined') {
  if (!window.appState.showMobileMenu) {
    window.appState.showMobileMenu = false;
    window.appState.setShowMobileMenu = (value) => {
      window.appState.showMobileMenu = value;
      if (window.forceUpdate) window.forceUpdate();
    };
  }

  if (!window.appState.showMobileFilters) {
    window.appState.showMobileFilters = false;
    window.appState.setShowMobileFilters = (value) => {
      window.appState.showMobileFilters = value;
      if (window.forceUpdate) window.forceUpdate();
    };
  }
} else {
  // Defer initialization
  window.addEventListener('DOMContentLoaded', () => {
    if (window.appState) {
      if (!window.appState.showMobileMenu) {
        window.appState.showMobileMenu = false;
        window.appState.setShowMobileMenu = (value) => {
          window.appState.showMobileMenu = value;
          if (window.forceUpdate) window.forceUpdate();
        };
      }

      if (!window.appState.showMobileFilters) {
        window.appState.showMobileFilters = false;
        window.appState.setShowMobileFilters = (value) => {
          window.appState.showMobileFilters = value;
          if (window.forceUpdate) window.forceUpdate();
        };
      }
    }
  });
}

console.log('✅ Mobile Navigation component loaded');
