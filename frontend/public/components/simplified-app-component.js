// Simplified App Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

window.SimplifiedApp = function() {
  // Initialize all state and handlers
  const state = window.renderMainApp();
  const handlers = window.renderAppBusinessLogic();
  
  // Initialize all effects
  window.renderAppEffects();

  // Make handlers available globally
  window.appHandlers = handlers;

  // ✅ CORE FUNCTION EXPOSURES - FIXED AND CLEANED
  window.getStatusFilterDisplayText = handlers.getStatusFilterDisplayText;
  window.openLeadDetail = handlers.openLeadDetail;
  window.editLead = handlers.editLead;
  window.deleteLead = handlers.deleteLead;
  window.assignLead = handlers.assignLead;
  window.progressLead = handlers.progressLead;
  
  // ✅ CRITICAL FIX: Lead progression functions - properly connected
  window.handleLeadProgression = handlers.handleLeadProgression || handlers.progressLead || ((leadId, newStatus) => {
    console.log("🔄 handleLeadProgression called:", leadId, newStatus);
    if (handlers.updateLeadStatus) {
      return handlers.updateLeadStatus(leadId, newStatus);
    } else {
      console.warn("⚠️ updateLeadStatus handler not available");
    }
  });
  
  window.updateLeadStatus = handlers.updateLeadStatus || ((leadId, newStatus) => {
    console.log("🔄 updateLeadStatus called:", leadId, newStatus);
    console.warn("⚠️ updateLeadStatus not implemented in handlers");
  });

  // ✅ FORM FUNCTION EXPOSURES - CLEANED UP DUPLICATES
  window.openAddForm = handlers.openAddForm || ((type) => {
    console.log("🔍 openAddForm called with type:", type);
    if (type === 'lead') {
      state.setShowAddForm(true);
      state.setCurrentForm('lead');
      state.setFormData({});
    } else {
      console.log("openAddForm not fully implemented for type:", type);
    }
  });
  
  window.openEditForm = (lead) => { 
    console.log("🔍 openEditForm called with lead:", lead); 
    try { 
      const result = handlers.openEditForm(lead); 
      console.log("🔍 openEditForm completed successfully"); 
      return result; 
    } catch (error) { 
      console.error("🔍 openEditForm error:", error); 
    } 
  };
  
  window.openAssignForm = handlers.openAssignForm || ((lead) => {
    console.log("🔍 openAssignForm called with lead:", lead);
    state.setCurrentLead(lead);
    state.setShowAssignForm(true);
  });

  // ✅ SPECIALIZED FORM EXPOSURES - SINGLE DEFINITIONS
  window.openPaymentForm = handlers.openPaymentForm || ((lead) => {
    console.log("💰 openPaymentForm called with lead:", lead);
    state.setCurrentLead(lead);
    state.setShowPaymentForm(true);
  });
  
  window.openAllocationForm = handlers.openAllocationForm || ((inventory) => {
    console.log("📦 openAllocationForm called with inventory:", inventory);
    state.setCurrentInventory(inventory);
    state.setShowAllocationForm(true);
  });
  
  window.openDeliveryForm = handlers.openDeliveryForm || ((delivery) => {
    console.log("🚚 openDeliveryForm called with delivery:", delivery);
    state.setCurrentDelivery(delivery);
    state.setShowDeliveryForm(true);
  });
  
  window.openInventoryForm = handlers.openInventoryForm || (() => {
    console.log("📦 openInventoryForm called");
    state.setShowInventoryForm(true);
  });

  // ✅ UTILITY FUNCTION EXPOSURES
  window.getUserDisplayName = handlers.getUserDisplayName || ((userId, usersList) => {
    if (!userId) return 'Unassigned';
    const user = (usersList || state.users || []).find(u => u.email === userId || u.id === userId);
    return user ? user.name : userId;
  });

  // ✅ STATE EXPOSURES - COMPLETE SET
  window.appState = window.appState || {};
  
  // Modal state variables
  window.appState.showAddForm = state.showAddForm;
  window.appState.showEditForm = state.showEditForm;
  window.appState.showAssignForm = state.showAssignForm;
  window.appState.showPaymentForm = state.showPaymentForm;
  window.appState.showLeadDetail = state.showLeadDetail;
  window.appState.showInventoryForm = state.showInventoryForm;
  window.appState.showAllocationForm = state.showAllocationForm;
  window.appState.showDeliveryForm = state.showDeliveryForm;
  
  // Form data state variables
  window.appState.showClientSuggestion = state.showClientSuggestion;
  window.appState.clientSuggestion = state.clientSuggestion;
  window.appState.formData = state.formData;
  window.appState.currentLead = state.currentLead;
  window.appState.phoneCheckLoading = state.phoneCheckLoading;
  
  // ✅ DIRECT WINDOW VARIABLES - FOR COMPONENT COMPATIBILITY
  window.showClientSuggestion = state.showClientSuggestion;
  window.clientSuggestion = state.clientSuggestion;
  window.formData = state.formData;
  window.currentLead = state.currentLead;
  window.currentInventory = state.currentInventory;
  window.currentDelivery = state.currentDelivery;
  window.currentForm = state.currentForm;
  window.user = state.user;
  window.phoneCheckLoading = state.phoneCheckLoading;
  window.loading = state.loading;
  window.leads = state.leads;
  window.inventory = state.inventory;
  window.orders = state.orders;
  window.deliveries = state.deliveries;
  window.users = state.users || [];
  window.events = state.events || [];
  window.invoices = state.invoices || [];

  // ✅ CRITICAL STATE SETTERS - COMPLETE SET
  window.setLoading = state.setLoading;
  window.setLeads = state.setLeads;
  window.setInventory = state.setInventory;
  window.setOrders = state.setOrders;
  window.setUsers = state.setUsers;
  window.setDeliveries = state.setDeliveries;
  window.setInvoices = state.setInvoices;
  window.setCurrentLead = state.setCurrentLead;
  window.setCurrentInventory = state.setCurrentInventory;
  window.setCurrentDelivery = state.setCurrentDelivery;
  window.setCurrentForm = state.setCurrentForm;
  window.setFormData = state.setFormData;
  window.setClientSuggestion = state.setClientSuggestion;
  window.setPhoneCheckTimeout = state.setPhoneCheckTimeout;
  window.setShowClientDetail = state.setShowClientDetail;
  window.setShowClientSuggestion = state.setShowClientSuggestion;
  window.setShowInventoryForm = state.setShowInventoryForm;
  window.setShowAllocationForm = state.setShowAllocationForm;
  window.setShowPaymentForm = state.setShowPaymentForm;
  window.setShowAssignForm = state.setShowAssignForm;
  window.setShowAddForm = state.setShowAddForm;
  window.setShowEditForm = state.setShowEditForm;
  window.setShowLeadDetail = state.setShowLeadDetail;
  window.setShowDeliveryForm = state.setShowDeliveryForm;

  // ✅ ADDITIONAL STATE SETTERS FOR FORMS
  window.setAllocationData = state.setAllocationData;
  window.setPaymentData = state.setPaymentData;
  window.setDeliveryFormData = state.setDeliveryFormData;
  window.setOrderData = state.setOrderData;
  window.setOrderEditData = state.setOrderEditData;
  window.setCurrentOrderForEdit = state.setCurrentOrderForEdit;
  window.setShowEditOrderForm = state.setShowEditOrderForm;
  window.setUserFormData = state.setUserFormData;
  window.setEditingUser = state.setEditingUser;
  window.setShowUserForm = state.setShowUserForm;

  // ✅ ADDITIONAL VARIABLES NEEDED BY COMPONENTS
  window.phoneCheckTimeout = state.phoneCheckTimeout;
  window.allocationData = state.allocationData;
  window.paymentData = state.paymentData;
  window.deliveryFormData = state.deliveryFormData;
  window.orderData = state.orderData;
  window.orderEditData = state.orderEditData;
  window.currentOrderForEdit = state.currentOrderForEdit;
  window.showEditOrderForm = state.showEditOrderForm;
  window.showEditInventoryForm = state.showEditInventoryForm;
  window.userFormData = state.userFormData;
  window.editingUser = state.editingUser;

  // ✅ HELPER FUNCTIONS FOR COMPONENTS
  window.checkPhoneForClient = handlers.checkPhoneForClient || ((phone) => {
    console.log("📞 checkPhoneForClient called with:", phone);
    // Implement basic client checking logic or mark as not implemented
  });

  window.apiCall = window.apiCall || ((endpoint, options) => {
    console.log("🌐 apiCall:", endpoint, options);
    return window.fetch(window.API_URL + endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': window.authToken ? 'Bearer ' + window.authToken : '',
        ...options.headers
      }
    }).then(response => response.json());
  });

  // ✅ ENHANCED CLOSE FORM FUNCTION
  window.closeForm = () => {
    console.log("🔄 closeForm called - closing all forms");
    state.setShowLeadDetail && state.setShowLeadDetail(false);
    state.setShowEditForm && state.setShowEditForm(false);
    state.setShowAddForm && state.setShowAddForm(false);
    state.setShowAssignForm && state.setShowAssignForm(false);
    state.setShowPaymentForm && state.setShowPaymentForm(false);
    state.setShowInventoryForm && state.setShowInventoryForm(false);
    state.setShowAllocationForm && state.setShowAllocationForm(false);
    state.setShowDeliveryForm && state.setShowDeliveryForm(false);
    state.setFormData && state.setFormData({});
    state.setCurrentLead && state.setCurrentLead(null);
    state.setCurrentInventory && state.setCurrentInventory(null);
    state.setCurrentDelivery && state.setCurrentDelivery(null);
  };

  // ✅ STATUS FILTER FUNCTIONS
  window.setShowStatusFilterDropdown = state.setShowStatusFilterDropdown;
  window.showStatusFilterDropdown = state.showStatusFilterDropdown;
  window.statusDropdownRef = state.statusDropdownRef;
  window.statusFilter = state.statusFilter;
  window.setStatusFilter = state.setStatusFilter;
  window.selectedStatusFilters = state.selectedStatusFilters;
  window.setSelectedStatusFilters = state.setSelectedStatusFilters;

  // ✅ BULK OPERATIONS SUPPORT
  window.bulkAssignSelections = state.bulkAssignSelections || {};
  window.setBulkAssignSelections = state.setBulkAssignSelections;
  window.setBulkAssignLoading = state.setBulkAssignLoading;
  window.setShowBulkAssignModal = state.setShowBulkAssignModal;

  // ✅ FETCHING FUNCTIONS
  window.fetchUsers = handlers.fetchUsers || (() => {
    console.log("👥 fetchUsers called");
    // Implementation will be in handlers
  });
  
  window.fetchLeads = handlers.fetchLeads || (() => {
    console.log("👥 fetchLeads called");
    // Implementation will be in handlers
  });

  // ✅ PERMISSION AND ACCESS CONTROL
  window.hasPermission = function(module, action) {
    if (state.user?.role === 'super_admin') return true;
    if (!state.user || !state.user.role) {
      console.log('No user or role found');
      return false;
    }

    const availableRoles = state.rolesLoaded ? state.dynamicRoles : window.USER_ROLES;
    const userRole = availableRoles[state.user.role];

    if (!userRole) {
      console.log('Role not found in available roles:', state.user.role);
      console.log('Available roles:', Object.keys(availableRoles));
      return false;
    }

    const modulePermissions = userRole.permissions[module];
    if (!modulePermissions) {
      console.log('Module permissions not found:', module);
      return false;
    }

    const hasAccess = modulePermissions[action] === true;
    console.log(`Permission check: ${state.user.role} -> ${module}.${action} = ${hasAccess}`);
    return hasAccess;
  };

  const canAccessTab = (tabId) => {
    if (!state.user) return false;
    if (tabId === 'myactions') return true;
    if (tabId === 'reminders') return window.hasPermission('leads', 'read');
    if (tabId === 'sports-calendar') return window.hasPermission('leads', 'read');
    return window.hasPermission(tabId, 'read');
  };

  // ✅ DASHBOARD AND CHART FUNCTIONS
  window.chartInstances = state.chartInstances;
  window.calculateDashboardStats = handlers.calculateDashboardStats;

  // Helper functions
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date - now;
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      const pastHours = Math.abs(diffHours);
      const pastDays = Math.abs(diffDays);

      if (pastDays > 0) {
        return `${pastDays} day${pastDays > 1 ? 's' : ''} overdue`;
      } else {
        return `${pastHours} hour${pastHours > 1 ? 's' : ''} overdue`;
      }
    } else {
      if (diffDays > 0) {
        return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
      } else if (diffHours > 0) {
        return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
      } else {
        return 'now';
      }
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getInventoryDueInDays = (eventDate) => {
    const today = new Date();
    const event = new Date(eventDate);
    const diffTime = event - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getFilteredLeads = () => {
    let filteredLeads = [...state.leads];

    if (state.dashboardFilter === 'salesperson' && state.selectedSalesPerson) {
      filteredLeads = filteredLeads.filter(lead => lead.assigned_to === state.selectedSalesPerson);
    }

    if (state.dashboardFilter === 'event' && state.selectedEvent) {
      filteredLeads = filteredLeads.filter(lead => lead.lead_for_event === state.selectedEvent);
    }

    return filteredLeads;
  };

  // Make functions globally available
  window.getFilteredLeads = getFilteredLeads;

  // Order assignment modal renderer
  const renderOrderAssignmentModal = () => {
    if (!state.showOrderAssignmentModal || !state.selectedOrderForAssignment) return null;

    const supplyTeamUsers = (state.users || []).filter(u => 
      ['supply_executive', 'supply_sales_service_manager'].includes(u.role)
    );

    return React.createElement('div', { 
      className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
      onClick: (e) => {
        if (e.target === e.currentTarget) {
          state.setShowOrderAssignmentModal(false);
          state.setSelectedOrderForAssignment(null);
        }
      }
    },
      React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full' },
        React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 
          'Assign Order to Supply Team'
        ),
        React.createElement('div', { className: 'space-y-2' },
          supplyTeamUsers.map(user =>
            React.createElement('button', {
              key: user.email,
              className: 'w-full text-left px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
              onClick: () => {
                handlers.assignOrderToService(state.selectedOrderForAssignment.id, user.email);
                state.setShowOrderAssignmentModal(false);
                state.setSelectedOrderForAssignment(null);
              }
            },
              React.createElement('div', { className: 'font-medium' }, user.name),
              React.createElement('div', { className: 'text-sm text-gray-500' }, user.role)
            )
          )
        ),
        React.createElement('button', {
          className: 'mt-4 w-full text-center text-gray-500 hover:text-gray-700',
          onClick: () => {
            state.setShowOrderAssignmentModal(false);
            state.setSelectedOrderForAssignment(null);
          }
        }, 'Cancel')
      )
    );
  };

  // Enhanced sidebar renderer
  const renderSidebar = () => {
    const menuItems = [
      { id: 'dashboard', label: 'Dashboard', icon: '📊' },
      { id: 'leads', label: 'Leads', icon: '👥' },
      { id: 'inventory', label: 'Inventory', icon: '🎫' },
      { id: 'orders', label: 'Orders', icon: '📋' },
      { id: 'delivery', label: 'Delivery', icon: '🚚' },
      { id: 'finance', label: 'Financials', icon: '💰' },
      { id: 'stadiums', label: 'Stadiums', icon: '🏟️' },
      { id: 'sports-calendar', label: 'Sports Calendar', icon: '📅' },
      { id: 'reminders', label: 'Reminders', icon: '🔔' },
      { id: 'myactions', label: 'My Actions', icon: '📌' },
      { id: 'assignment-rules', label: 'Assignment Rules', icon: '⚙️' }
    ];

    return React.createElement('div', { className: 'w-64 bg-white shadow-lg' },
      React.createElement('div', { className: 'p-4' },
        React.createElement('div', { className: 'flex items-center space-x-3' },
          React.createElement('div', { className: 'w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center' },
            React.createElement('span', { className: 'text-white' }, '🏆')
          ),
          React.createElement('h2', { className: 'text-xl font-bold text-gray-900 dark:text-white' }, 'FanToPark CRM')
        ),
        state.user && React.createElement('div', { className: 'mt-4 p-3 bg-blue-50 rounded-lg' },
          React.createElement('div', { className: 'text-sm font-medium text-blue-900' }, state.user.name),
          React.createElement('div', { className: 'text-xs text-blue-600' }, window.USER_ROLES[state.user.role]?.label || state.user.role),
          React.createElement('div', { className: 'text-xs text-blue-500' }, state.user.department)
        )
      ),
      React.createElement('nav', { className: 'mt-8' },
        menuItems.filter(item => canAccessTab(item.id)).map(item =>
          React.createElement('button', {
            key: item.id,
            onClick: () => { state.setActiveTab(item.id); if(item.id === 'leads') state.setViewMode('leads'); },
            className: 'w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 ' + (state.activeTab === item.id ? 'bg-blue-50 border-r-2 border-blue-600 text-blue-600' : 'text-gray-700')
          },
            React.createElement('span', { className: 'mr-3' }, item.icon),
            item.label
          )
        ),
        window.hasPermission('users', 'read') && React.createElement('button', {
          onClick: handlers.openUserManagement,
          className: 'w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 text-gray-700'
        },
          React.createElement('span', { className: 'mr-3' }, '👤'),
          'User Management'
        ),
        state.user && state.user.role === 'super_admin' && React.createElement('button', {
          onClick: () => state.setActiveTab('roles'),
          className: 'w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 text-gray-700'
        },
          React.createElement('span', { className: 'mr-3' }, '🛡️'),
          'Role Management'
        )
      ),
      React.createElement('div', { className: 'mt-auto p-4' },
        React.createElement('button', {
          onClick: handlers.handleLogout,
          className: 'w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded overflow-hidden'
        },
          React.createElement('span', { className: 'mr-3' }, '🚪'),
          'Logout'
        )
      )
    );
  };

  // Action handlers for approval, etc.
  const updateDeliveryStatus = (deliveryId) => {
    alert('Delivery status update coming soon!');
  };

  const approveOrder = async (orderId) => {
    if (confirm('Are you sure you want to approve this order?')) {
      try {
        await window.apiCall('/orders/' + (orderId), {
          method: 'PUT',
          body: JSON.stringify({ status: 'approved' })
        });
        alert('Order approved successfully!');
        window.fetchMyActions && window.fetchMyActions();
      } catch (error) {
        alert('Failed to approve order: ' + error.message);
      }
    }
  };

  const viewOrderDetails = (order) => {
    state.setCurrentOrderDetail(order);
    state.setShowOrderDetail(true);
  };

  const viewLeadDetails = (lead) => {
    state.setCurrentLead(lead);
    state.setShowLeadDetail(true);
  };

  // Assignment Rules Tab
  const AssignmentRulesTab = React.useMemo(() => {
    return window.hasPermission('leads', 'assign') ? 
      React.createElement(window.AssignmentRulesManager, { 
        key: 'assignment-rules-stable',
        currentUser: state.user 
      }) :
      React.createElement('div', { className: 'text-center py-12' },
        React.createElement('p', { className: 'text-red-500 text-lg' }, 
          'Access Denied: You do not have permission to manage assignment rules.'
        )
      );
  }, [state.user]);

  // Login screen
  if (!state.isLoggedIn) {
    return React.createElement('div', { className: 'min-h-screen bg-gray-100 flex items-center justify-center'},
      React.createElement('div', { className: 'max-w-md w-full bg-white rounded-lg shadow-md p-6' },
        React.createElement('div', { className: 'text-center mb-8' },
          React.createElement('div', { className: 'w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4' },
            React.createElement('span', { className: 'text-white text-xl' }, '🏆')
          ),
          React.createElement('h2', { className: 'text-2xl font-bold text-gray-900' }, 'FanToPark CRM'),
          React.createElement('p', { className: 'text-gray-600' }, 'Sign in to your account')
        ),
        React.createElement('form', { onSubmit: handlers.handleLogin },
          React.createElement('div', { className: 'mb-4' },
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Email'),
            React.createElement('input', {
              type: 'email',
              value: state.email,
              onChange: (e) => state.setEmail(e.target.value),
              className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
              required: true
            })
          ),
          React.createElement('div', { className: 'mb-6' },
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Password'),
            React.createElement('input', {
              type: 'password',
              autoComplete: 'current-password',
              value: state.password,
              onChange: (e) => state.setPassword(e.target.value),
              className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
              required: true
            })
          ),
          React.createElement('button', {
            type: 'submit',
            disabled: state.loading,
            className: 'w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50'
          }, state.loading ? 'Signing in...' : 'Sign In')
        ),
        React.createElement('div', { className: 'mt-6 text-sm text-gray-600' },
          React.createElement('p', { className: 'font-medium mb-2' }, 'Demo Accounts:'),
          React.createElement('div', { className: 'space-y-1 text-xs' },
            React.createElement('p', null, React.createElement('strong', null, 'Super Admin:'), ' admin@fantopark.com / admin123'),
            React.createElement('p', null, React.createElement('strong', null, 'Sales Manager:'), ' varun@fantopark.com / sales123'),
            React.createElement('p', null, React.createElement('strong', null, 'Sales Executive:'), ' pratik@fantopark.com / sales123'),
            React.createElement('p', null, React.createElement('strong', null, 'Supply Manager:'), ' akshay@fantopark.com / supply123'),
            React.createElement('p', null, React.createElement('strong', null, 'Finance Manager:'), ' finance@fantopark.com / finance123')
          )
        )
      )
    );
  }

  // Main application layout
  return React.createElement('div', { className: 'flex h-screen bg-gray-100 dark:bg-gray-900' },
    renderSidebar(),
    React.createElement('div', { className: 'flex-1 flex flex-col overflow-hidden' },
      React.createElement('header', { className: 'bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 px-6 py-4' },
        React.createElement('div', { className: 'flex items-center justify-between' },
          React.createElement('div', null,
            React.createElement('h1', { className: 'text-lg font-semibold' }, 'Welcome, ' + (state.user?.name || 'Admin User')),
            React.createElement('p', { className: 'text-sm text-gray-600 dark:text-gray-400' }, window.USER_ROLES[state.user?.role]?.label + ' • ' + state.user?.department)
          ),
          React.createElement('div', { className: 'flex items-center space-x-4' },
            React.createElement('span', { className: 'text-lg' }, '🔔'),
            React.createElement('button', {
              onClick: () => state.setShowHelpGuide(true),
              className: 'p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
              title: 'How to use CRM'
            }, '❓'),
            React.createElement('button', {
              onClick: () => {
                state.setDarkMode(!state.darkMode);
                document.documentElement.classList.toggle('dark');
                localStorage.setItem('crm_dark_mode', !state.darkMode);
              },
              className: 'p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
              title: state.darkMode ? 'Switch to light mode' : 'Switch to dark mode'
            }, state.darkMode ? '☀️' : '🌙'),
            React.createElement('div', { className: 'w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center' },
              React.createElement('span', { className: 'text-white text-sm' }, (state.user?.name || 'A')[0])
            ),
            state.currentUser && state.currentUser.role === 'super_admin' && React.createElement('div', { 
              className: 'flex items-center gap-2 ml-4'
            },
              React.createElement('button', {
                onClick: () => {
                  const newMode = !state.testMode;
                  state.setTestMode(newMode);
                  localStorage.setItem('testMode', newMode.toString());
                  if (newMode) {
                    document.body.classList.add('test-mode-active');
                  } else {
                    document.body.classList.remove('test-mode-active');
                  }
                },
                className: 'relative inline-flex h-6 w-12 items-center rounded-full transition-colors ' + 
                  (state.testMode ? 'bg-red-600' : 'bg-gray-300'),
                title: 'Toggle Test Mode'
              },
                React.createElement('span', {
                  className: 'inline-block h-4 w-4 transform rounded-full bg-white transition-transform ' +
                    (state.testMode ? 'translate-x-6' : 'translate-x-1')
                })
              ),
              state.testMode && React.createElement('span', { 
                className: 'text-red-600 font-bold text-sm ml-2'
              }, 'TEST MODE')
            )
          )
        )
      ),
      React.createElement('main', { className: 'flex-1 overflow-y-auto p-6' },
        state.testMode && state.user.role === 'super_admin' && React.createElement('div', {
          className: 'bg-red-100 border-2 border-red-500 text-red-700 p-4 rounded-lg mb-4 text-center font-bold animate-pulse'
        }, 
          '⚠️ TEST MODE ACTIVE - Delete buttons and test data fills are enabled!'
        ),
        window.renderContent()
      )
    ),

    // ✅ MODAL FORMS - ALL EXISTING MODALS PRESERVED
    window.renderReminderDashboard && window.renderReminderDashboard(),
    window.renderInventoryForm && window.renderInventoryForm(),
    window.renderForm && window.renderForm(),
    state.showCSVUploadModal && React.createElement(window.CSVUploadModal, {
      isOpen: state.showCSVUploadModal,
      onClose: () => {
        state.setShowCSVUploadModal(false);
        state.setCSVUploadType('');
      },
      type: state.csvUploadType,
      authToken: authToken
    }),
    window.renderAssignForm && window.renderAssignForm(),
    window.renderBulkAssignModal && window.renderBulkAssignModal(),
    window.renderPaymentForm && window.renderPaymentForm(),
    window.renderLeadDetail && window.renderLeadDetail(),
    state.showInventoryDetail && window.renderInventoryDetail && window.renderInventoryDetail(),
    window.renderAllocationForm && window.renderAllocationForm(),
    window.renderAllocationManagement && window.renderAllocationManagement(),
    window.renderStadiumForm && window.renderStadiumForm(),
    window.renderChoiceModal && window.renderChoiceModal(),
    window.renderUserManagement && window.renderUserManagement(),
    window.renderStatusProgressModal && window.renderStatusProgressModal(),
    window.renderUserForm && window.renderUserForm(),
    window.renderGSTInvoicePreview && window.renderGSTInvoicePreview(),
    window.renderOrderDetailModal && window.renderOrderDetailModal(),
    renderOrderAssignmentModal(),
    window.renderDeliveryForm && window.renderDeliveryForm(),
    window.renderOrderDetail && window.renderOrderDetail(),
    window.renderEditOrderForm && window.renderEditOrderForm(),
    window.renderPaymentPostServiceForm && window.renderPaymentPostServiceForm(),
    window.renderPaymentSubmitHandler && window.renderPaymentSubmitHandler(),
    window.renderInventoryFormSubmitHandler && window.renderInventoryFormSubmitHandler(),
    window.renderDeleteHandler && window.renderDeleteHandler(),
    window.renderHelpGuide && window.renderHelpGuide(),
    state.showClientDetail && window.renderClientDetailModal && window.renderClientDetailModal(),
    state.showEventDetail && window.renderEventDetailModal && window.renderEventDetailModal(),
    state.showPreview && React.createElement(window.UploadPreviewModal),
    state.showClientDetectionResults && React.createElement(window.ClientDetectionResultsModal),
    state.showEventForm && window.renderEventFormModal && window.renderEventFormModal()
  );
};

console.log('✅ Simplified App Component loaded successfully with complete function exposures');
