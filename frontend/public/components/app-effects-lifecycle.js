// App Effects and Lifecycle Management for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

window.renderAppEffects = function() {
  
  // Access app state and business logic
  const state = window.appState;
  const handlers = window.renderAppBusinessLogic();
  
  if (!state || !handlers) {
    console.error('App state or handlers not available');
    return;
  }

  const { useEffect } = React;
  const {
    isLoggedIn, activeTab, viewMode, leads, users, testMode, currentUser,
    darkMode, receivables, user, emailNotifications, allUsers, deliveries,
    dashboardFilter, selectedSalesPerson, selectedEvent, chartInstances,
    statusDropdownRef, showStatusFilterDropdown, setShowStatusFilterDropdown,
    setUser, setCurrentUser, setIsLoggedIn, setUsers, setActiveTab,
    rolesLoaded, dynamicRoles, setDynamicRoles, setRolesLoaded
  } = state;

  const {
    fetchData, calculateDashboardStats, extractFiltersData, fetchUserRoles
  } = handlers;

  // Main data fetching effect
  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
    console.log('useEffect triggered - activeTab:', activeTab, 'isLoggedIn:', isLoggedIn);
    if (activeTab === 'myactions') {
      console.log('My Actions tab is active, calling fetchMyActions...');
      window.fetchMyActions && window.fetchMyActions();
    } else if (activeTab === 'finance') {
      console.log('Finance tab active, fetching financial data...');
      window.fetchFinancialData && window.fetchFinancialData();
    }
  }, [isLoggedIn, activeTab]);

  // Reminders fetching and auto-refresh
  useEffect(() => {
    if (isLoggedIn) {
      window.fetchReminders && window.fetchReminders();
      const interval = setInterval(() => {
        window.fetchReminders && window.fetchReminders();
      }, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  // Client data fetching
  useEffect(() => {
    if (viewMode === 'clients' && isLoggedIn) {
      handlers.fetchClients();
    }
  }, [viewMode, isLoggedIn]);

  // Test mode effect
  useEffect(() => {
    console.log('Test mode state:', testMode);
    console.log('Current user:', currentUser);
    console.log('Is super admin:', currentUser?.role === 'super_admin');
    console.log('User object:', JSON.stringify(currentUser));

    if (currentUser && currentUser.role === 'super_admin') {
      console.log('Super admin logged in - test mode toggle should be visible');
    }
  }, [testMode, currentUser]);

  // Stadium fetching effect
  React.useEffect(() => {
    if (isLoggedIn) {
      fetchData();
      window.fetchStadiums && window.fetchStadiums();
    }
  }, [isLoggedIn]); 

  // Auth state restoration
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('crm_user');
      const savedLoginState = localStorage.getItem('crm_auth_token');

      if (savedUser && savedLoginState) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setCurrentUser(userData);
        authToken = savedLoginState;
        setIsLoggedIn(true);
        window.fetchUsers && window.fetchUsers();
        setUsers([]);
      }
    } catch (e) {
      console.log('Failed to restore auth state:', e);
    }
  }, []);

  // Active tab persistence
  useEffect(() => {
    localStorage.setItem('crm_active_tab', activeTab);
  }, [activeTab]);

  // Dashboard stats calculation
  useEffect(() => {
    if (isLoggedIn) {
      calculateDashboardStats();
    }
  }, [isLoggedIn]);

  // Status dropdown click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setShowStatusFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Extract filter data when leads or users change
  useEffect(() => {
    if (leads.length > 0 || users.length > 0) {
      extractFiltersData();
    }
  }, [leads, users]);

  // Update stats when filter changes
  useEffect(() => {
    if (leads.length > 0) {
      calculateDashboardStats();
    }
  }, [dashboardFilter, selectedSalesPerson, selectedEvent, leads]);

  // Chart initialization and management
  useEffect(() => {
    console.log('Chart initialization useEffect triggered', {
      activeTab,
      leadsCount: leads.length,
      chartExists: typeof Chart !== 'undefined'
    });

    if (activeTab === 'dashboard' && leads.length > 0 && typeof Chart !== 'undefined') {
      const timeoutId = setTimeout(() => {
        console.log('Attempting to initialize charts...');

        const canvas1 = document.getElementById('leadSplitChart');
        const canvas2 = document.getElementById('tempCountChart');  
        const canvas3 = document.getElementById('tempValueChart');

        console.log('Canvas elements found:', {
          leadSplit: !!canvas1,
          tempCount: !!canvas2,
          tempValue: !!canvas3
        });

        if (canvas1 && canvas2 && canvas3) {
          window.initializeChartsAdvanced && window.initializeChartsAdvanced();

          setTimeout(() => {
            const filteredLeads = window.getFilteredLeads && window.getFilteredLeads() || leads;
            window.updateCharts && window.updateCharts(filteredLeads);
          }, 100);
        } else {
          console.log('Canvas elements not ready yet, retrying...');
          setTimeout(() => {
            window.initializeChartsAdvanced && window.initializeChartsAdvanced();
            const filteredLeads = window.getFilteredLeads && window.getFilteredLeads() || leads;
            window.updateCharts && window.updateCharts(filteredLeads);
          }, 500);
        }
      }, 200);

      return () => clearTimeout(timeoutId);
    }

    // Cleanup when leaving dashboard
    if (activeTab !== 'dashboard') {
      if (chartInstances.leadSplit) {
        chartInstances.leadSplit.destroy();
        chartInstances.leadSplit = null;
      }
      if (chartInstances.tempCount) {
        chartInstances.tempCount.destroy();
        chartInstances.tempCount = null;
      }
      if (chartInstances.tempValue) {
        chartInstances.tempValue.destroy();
        chartInstances.tempValue = null;
      }
    }
  }, [activeTab, leads.length]);

  // Stats update when filter changes
  useEffect(() => {
    if (leads.length > 0) {
      calculateDashboardStats();
    }
  }, [dashboardFilter, selectedSalesPerson, selectedEvent]);

  // Dark mode application
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Financial chart initialization
  useEffect(() => {
    if (isLoggedIn && window.hasPermission('finance', 'read')) {
      const chartElement = document.getElementById('receivablesPieChart');
      if (chartElement && receivables.filter(r => r.status === 'pending').length > 0) {
        const ctx = chartElement.getContext('2d');

        if (window.receivablesChart) {
          window.receivablesChart.destroy();
        }

        const receivablesBySalesperson = {};
        receivables
          .filter(r => r.status === 'pending')
          .forEach(receivable => {
            const salesperson = receivable.assigned_to || 'Unassigned';
            receivablesBySalesperson[salesperson] = (receivablesBySalesperson[salesperson] || 0) + receivable.expected_amount;
          });

        window.receivablesChart = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: Object.keys(receivablesBySalesperson),
            datasets: [{
              data: Object.values(receivablesBySalesperson),
              backgroundColor: [
                '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
                '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
              ]
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false
          }
        });
      }
    }
  }, [isLoggedIn, receivables, user]);

  // Scheduled notifications checker
  useEffect(() => {
    const checkScheduledNotifications = () => {
      const now = new Date();
      emailNotifications
        .filter(n => n.status === 'scheduled' && new Date(n.scheduled_date) <= now)
        .forEach(notification => {
          handlers.sendEmailNotification(notification);
        });
    };

    const interval = setInterval(checkScheduledNotifications, 60000);
    return () => clearInterval(interval);
  }, [emailNotifications]);

  // Default users initialization
  useEffect(() => {
    if (users.length === 0) {
      setUsers(window.DEFAULT_USERS);
    }
  }, []);

  // All users fetching
  useEffect(() => {
    if (isLoggedIn && allUsers.length === 0) {
      window.fetchUsers && window.fetchUsers();
    }
  }, [isLoggedIn]);

  // Deliveries persistence
  useEffect(() => {
    try {
      localStorage.setItem('crm_deliveries', JSON.stringify(deliveries));
    } catch (e) {
      console.log('Failed to save deliveries:', e);
    }
  }, [deliveries]);

  // Receivables persistence
  useEffect(() => {
    try {
      localStorage.setItem('crm_receivables', JSON.stringify(receivables));
    } catch (e) {
      console.log('Failed to save receivables:', e);
    }
  }, [receivables]);

  // Email notifications persistence
  useEffect(() => {
    try {
      localStorage.setItem('crm_email_notifications', JSON.stringify(emailNotifications));
    } catch (e) {
      console.log('Failed to save notifications:', e);
    }
  }, [emailNotifications]);

  console.log('✅ All app effects initialized successfully');
};

console.log('✅ App Effects and Lifecycle Management loaded successfully');
