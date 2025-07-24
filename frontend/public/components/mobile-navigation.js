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
        id: 'myactions',
        label: 'My Actions',
        icon: '📋',
        show: true // Always show for now
      },
      {
        id: 'inventory',
        label: 'Inventory',
        icon: '📦',
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

  // Get brand colors based on theme
  const getBrandColors = () => {
    const isDark = document.documentElement.classList.contains('dark');
    return {
      primary: isDark ? '#3B82F6' : '#2563EB',
      text: isDark ? '#F3F4F6' : '#111827',
      background: isDark ? '#1F2937' : '#FFFFFF',
      border: isDark ? '#374151' : '#E5E7EB',
      secondaryText: isDark ? '#9CA3AF' : '#6B7280'
    };
  };

  const colors = getBrandColors();

  return React.createElement('header', {
    className: 'mobile-header mobile-only',
    style: { 
      display: 'flex', 
      alignItems: 'center',
      height: '56px',
      background: colors.background,
      borderBottom: `1px solid ${colors.border}`,
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1100,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }
  },
    // Logo section - centered
    React.createElement('div', { 
      className: 'mobile-header-logo',
      style: { 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flex: 1,
        height: '40px'
      }
    },
      React.createElement('img', {
        src: 'images/logo.png',
        alt: 'FanToPark',
        style: {
          height: 'auto',
          width: 'auto',
          maxHeight: '32px',
          maxWidth: '200px',
          objectFit: 'contain',
          transform: 'scale(0.8)'
        }
      })
    ),
    
  );
};

// Mobile More Menu (Sheet)
window.MobileMoreMenu = function() {
  const state = window.appState;
  const { showMobileMenu, user } = state;

  if (!showMobileMenu) return null;

  const menuItems = [
    {
      id: 'orders',
      label: 'Orders',
      icon: '🎫',
      show: window.hasPermission('orders', 'read')
    },
    {
      id: 'delivery',
      label: 'Deliveries',
      icon: '🚚',
      show: window.hasPermission('delivery', 'read')
    },
    {
      id: 'financials',
      label: 'Financials',
      icon: '💰',
      show: window.hasPermission('finance', 'read')
    },
    {
      id: 'sales-performance',
      label: 'Sales Performance',
      icon: '📊',
      show: window.hasPermission('finance', 'read')
    },
    {
      id: 'marketing-performance',
      label: 'Marketing Performance',
      icon: '📈',
      show: window.hasPermission('finance', 'read')
    },
    {
      id: 'stadiums',
      label: 'Stadiums',
      icon: '🏟️',
      show: window.hasPermission('stadiums', 'read')
    },
    {
      id: 'sports-calendar',
      label: 'Sports Calendar',
      icon: '📅',
      show: true // Sports calendar is typically available to all
    },
    {
      id: 'assignment-rules',
      label: 'Assignment Rules',
      icon: '🎯',
      show: window.hasPermission('leads', 'assign')
    },
    {
      id: 'reminders',
      label: 'Reminders',
      icon: '🔔',
      show: window.hasPermission('leads', 'read')
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
        state.setActiveTab('changePassword');
        state.setShowMobileMenu(false);
      }
    },
    {
      id: 'user-management',
      label: 'User Management',
      icon: '👤',
      show: user?.role === 'super_admin' || user?.role === 'admin',
      action: () => {
        state.setActiveTab('users');
        state.setShowMobileMenu(false);
      }
    },
    {
      id: 'role-management',
      label: 'Role Management',
      icon: '🔐',
      show: user?.role === 'super_admin',
      action: () => {
        state.setActiveTab('roles');
        state.setShowMobileMenu(false);
      }
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
      case 'stadiums':
        return window.hasPermission('stadiums', 'create');
      case 'reminders':
        return window.hasPermission('reminders', 'create');
      default:
        return false;
    }
  };

  const handleFABClick = () => {
    console.log('🔵 FAB clicked on tab:', activeTab);
    switch(activeTab) {
      case 'leads':
        console.log('🔵 Opening lead form');
        state.setShowAddForm(true);
        state.setCurrentForm('lead');
        break;
      case 'inventory':
        console.log('🔵 Attempting to open inventory form');
        if (window.openAddInventoryForm) {
          console.log('🔵 Calling window.openAddInventoryForm()');
          window.openAddInventoryForm();
        } else if (window.setShowInventoryForm) {
          console.log('🔵 Fallback - calling window.setShowInventoryForm(true)');
          window.setShowInventoryForm(true);
        } else if (state.setShowInventoryForm) {
          console.log('🔵 Fallback - calling state.setShowInventoryForm(true)');
          state.setShowInventoryForm(true);
        } else {
          console.log('❌ Inventory form function not found');
        }
        break;
      case 'stadiums':
        console.log('🔵 Opening stadium form');
        state.setShowStadiumForm(true);
        break;
      case 'reminders':
        console.log('🔵 Opening reminder form');
        state.setShowReminderForm(true);
        break;
      default:
        console.log('🔵 Unknown tab:', activeTab);
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
