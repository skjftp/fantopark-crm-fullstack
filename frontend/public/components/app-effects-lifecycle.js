// =============================================================================
// FIXED APP EFFECTS LIFECYCLE - REPLACE components/app-effects-lifecycle.js
// =============================================================================
// Enhanced with proper My Actions state synchronization and FIXED localStorage keys

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
    rolesLoaded, dynamicRoles, setDynamicRoles, setRolesLoaded,
    // My Actions state
    myLeads, myOrders, myDeliveries, myQuoteRequested, myReceivables,
    setMyLeads, setMyOrders, setMyDeliveries, setMyQuoteRequested, setMyReceivables
  } = state;

  const {
    fetchData, calculateDashboardStats, extractFiltersData, fetchUserRoles
  } = handlers;

  // ✅ ENHANCED: My Actions state synchronization effect
  useEffect(() => {
    console.log('🔄 My Actions state sync effect triggered');
    
    // Sync React state with global window variables
    if (myLeads !== undefined) {
      window.myLeads = myLeads || [];
      console.log('📊 Synced myLeads:', window.myLeads.length);
    }
    
    if (myOrders !== undefined) {
      window.myOrders = myOrders || [];
      console.log('📊 Synced myOrders:', window.myOrders.length);
    }
    
    if (myDeliveries !== undefined) {
      window.myDeliveries = myDeliveries || [];
      console.log('📊 Synced myDeliveries:', window.myDeliveries.length);
    }
    
    if (myQuoteRequested !== undefined) {
      window.myQuoteRequested = myQuoteRequested || [];
      console.log('📊 Synced myQuoteRequested:', window.myQuoteRequested.length);
    }
    
    if (myReceivables !== undefined) {
      window.myReceivables = myReceivables || [];
      console.log('📊 Synced myReceivables:', window.myReceivables.length);
    }

    // Store state setter functions globally for fetchMyActions to use
    window.setMyLeads = setMyLeads;
    window.setMyOrders = setMyOrders;
    window.setMyDeliveries = setMyDeliveries;
    window.setMyQuoteRequested = setMyQuoteRequested;
    window.setMyReceivables = setMyReceivables;
    
  }, [myLeads, myOrders, myDeliveries, myQuoteRequested, myReceivables, 
      setMyLeads, setMyOrders, setMyDeliveries, setMyQuoteRequested, setMyReceivables]);

  // Main data fetching effect
  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
    console.log('useEffect triggered - activeTab:', activeTab, 'isLoggedIn:', isLoggedIn);
    
    if (activeTab === 'myactions') {
      console.log('My Actions tab is active, calling fetchMyActions...');
      // ✅ ENHANCED: Add delay to ensure state is ready
      setTimeout(() => {
        if (window.fetchMyActions) {
          window.fetchMyActions();
        } else {
          console.warn('fetchMyActions function not available yet');
        }
      }, 100);
    } else if (activeTab === 'finance') {
      console.log('Finance tab active, fetching financial data...');
      window.fetchFinancialData && window.fetchFinancialData();
    }
  }, [isLoggedIn, activeTab]);

  // ✅ ENHANCED: My Actions specific effect with better timing
  useEffect(() => {
    console.log('🔍 My Actions specific effect - conditions:', {
      activeTab,
      isLoggedIn,
      fetchRemindersExists: !!window.fetchReminders,
      fetchMyActionsExists: !!window.fetchMyActions,
      userExists: !!window.user
    });
    
    if (activeTab === 'myactions' && isLoggedIn && window.user) {
      console.log('🎯 Triggering My Actions data fetch...');
      // Add a small delay to ensure all components are loaded
      setTimeout(() => {
        if (window.fetchMyActions) {
          window.fetchMyActions();
        }
      }, 200);
    }
    
    if (activeTab === 'reminders' && isLoggedIn && window.fetchReminders) {
      console.log('🔔 Auto-loading reminders...');
      window.fetchReminders();
    }
  }, [activeTab, isLoggedIn, user]);

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

  // ✅ FIXED: Auth state restoration with correct localStorage keys
  useEffect(() => {
    try {
      // ✅ FIX: Use the correct localStorage keys that match what login function saves
      const savedUser = localStorage.getItem('crm_user');        // was: 'fantopark_user'
      const savedToken = localStorage.getItem('crm_auth_token'); // was: 'fantopark_token'
      
      if (savedUser && savedToken) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setCurrentUser(userData);
        setIsLoggedIn(true);
        window.authToken = savedToken;
        window.user = userData;
        window.currentUser = userData;
        window.isLoggedIn = true;
        console.log('Auth state restored from localStorage');
      }
    } catch (error) {
      console.error('Error restoring auth state:', error);
      // ✅ FIX: Clean up the correct keys if restoration fails
      localStorage.removeItem('crm_user');        // was: 'fantopark_user'
      localStorage.removeItem('crm_auth_token');  // was: 'fantopark_token'
    }
  }, [setUser, setCurrentUser, setIsLoggedIn]);

  // ✅ FIXED: Dark mode persistence with correct localStorage key
  useEffect(() => {
    try {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('crm_dark_mode', 'true');     // was: 'fantopark_darkMode'
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('crm_dark_mode', 'false');    // was: 'fantopark_darkMode'
      }
    } catch (error) {
      console.error('Error managing dark mode:', error);
    }
  }, [darkMode]);

  // User roles fetching effect
  useEffect(() => {
    if (isLoggedIn && !rolesLoaded) {
      fetchUserRoles();
    }
  }, [isLoggedIn, rolesLoaded, fetchUserRoles]);

  // Email notifications fetching effect
  useEffect(() => {
    if (isLoggedIn && window.fetchEmailNotifications) {
      window.fetchEmailNotifications();
    }
  }, [isLoggedIn]);

  // Global state synchronization effect
  useEffect(() => {
    // Sync React state with window globals for CDN compatibility
    window.isLoggedIn = isLoggedIn;
    window.activeTab = activeTab;
    window.user = user;
    window.currentUser = currentUser;
    window.leads = leads;
    window.users = users;
    window.allUsers = allUsers;
    window.deliveries = deliveries;
    window.receivables = receivables;
    window.emailNotifications = emailNotifications;
    window.testMode = testMode;
    window.darkMode = darkMode;
    window.dashboardFilter = dashboardFilter;
    window.selectedSalesPerson = selectedSalesPerson;
    window.selectedEvent = selectedEvent;
    window.chartInstances = chartInstances;
    window.dynamicRoles = dynamicRoles;
    window.rolesLoaded = rolesLoaded;
    
    // ✅ CRITICAL: Sync state setters for other components to use
    window.setActiveTab = setActiveTab;
    window.setUser = setUser;
    window.setCurrentUser = setCurrentUser;
    window.setIsLoggedIn = setIsLoggedIn;
    window.setUsers = setUsers;
    window.setDynamicRoles = setDynamicRoles;
    window.setRolesLoaded = setRolesLoaded;
    
  }, [isLoggedIn, activeTab, user, currentUser, leads, users, allUsers, 
      deliveries, receivables, emailNotifications, testMode, darkMode,
      dashboardFilter, selectedSalesPerson, selectedEvent, chartInstances,
      dynamicRoles, rolesLoaded, setActiveTab, setUser, setCurrentUser, 
      setIsLoggedIn, setUsers, setDynamicRoles, setRolesLoaded]);

  // ✅ ENHANCED: Chart initialization with better timing
  useEffect(() => {
    console.log('Chart initialization useEffect triggered', {
      activeTab, 
      leadsCount: leads?.length || 0, 
      chartExists: !!window.createCharts
    });
    
    if (activeTab === 'dashboard') {
      console.log('🎯 Initializing charts...');
      if (window.createCharts) {
        // Add delay to ensure DOM is ready
        setTimeout(() => {
          window.createCharts();
        }, 300);
      }
    } else {
      console.log('⏭️ Not on dashboard tab, skipping chart init');
    }
  }, [activeTab, leads]);

  // ✅ ENHANCED: My Actions initialization effect
  useEffect(() => {
    if (window.initializeMyActions && isLoggedIn) {
      console.log('🔧 Initializing My Actions system...');
      window.initializeMyActions();
    }
  }, [isLoggedIn]);

  // Component cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup any intervals or subscriptions
      if (window.myActionsRefreshInterval) {
        clearInterval(window.myActionsRefreshInterval);
      }
    };
  }, []);

  console.log('✅ All app effects initialized successfully');
};

console.log('✅ FIXED App Effects and Lifecycle Management loaded successfully with My Actions state sync');
