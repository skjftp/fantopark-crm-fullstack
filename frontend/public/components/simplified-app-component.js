window.SimplifiedApp = function() {
  // ===== CORE SETUP & INITIALIZATION =====
  const state = window.renderMainApp();
  const handlers = window.renderAppBusinessLogic();
  

  // Log available setter
  const availableSetters = Object.keys(state).filter(key => key.startsWith('set') && key.includes('Inventory'));
  
  // Initialize all effects
  window.renderAppEffects();

  // Make handlers available globall
  
  window.appHandlers = handlers;

  // ✅ ENSURE USER FORM GLOBALS ARE AVAILABLE
window.loading = state.loading || false;
window.currentUser = state.currentUser || null;
window.userFormData = state.userFormData || {};
window.roles = state.roles || [];

// ✅ ASSIGNMENT RULES HELPER FUNCTIONS
window.refreshAssignmentRules = async () => {
  console.log("🔄 refreshAssignmentRules called");
  try {
    if (window.hasPermission('leads', 'assign')) {
      // Force re-render of assignment rules component
      console.log("✅ Assignment rules refresh completed");
    }
  } catch (error) {
    console.error("❌ Error refreshing assignment rules:", error);
  }
};

// Debug function to test assignment rules
window.testAssignmentRulesAPI = async () => {
  try {
    console.log("🧪 Testing assignment rules API...");
    const response = await window.apiCall('/assignment-rules');
    console.log("✅ Assignment rules API working:", response);
    return response;
  } catch (error) {
    console.error("❌ Assignment rules API error:", error);
    return null;
  }
};

  // ✅ ADD THIS: Assignment Rules Button Debugging
window.debugAssignmentRulesButtons = () => {
  console.log("🔍 Assignment Rules Debug:");
  console.log("AssignmentRulesManager exists:", typeof window.AssignmentRulesManager);
  console.log("AssignmentRulesTab exists:", typeof window.AssignmentRulesTab);
  console.log("apiCall exists:", typeof window.apiCall);
  console.log("hasPermission exists:", typeof window.hasPermission);
  console.log("Current user:", window.user);
  console.log("Permissions for leads assign:", window.hasPermission('leads', 'assign'));
};

// Test the buttons work
window.testAssignmentRulesButtons = () => {
  console.log("🧪 Testing Assignment Rules button functionality");
  // This will help us see if the functions are accessible
};

  // ===== STATE VARIABLES =====
  
  // Modal States
  window.appState = window.appState || {};
  window.appState.showAddForm = state.showAddForm;
  window.appState.showEditForm = state.showEditForm;
  window.appState.showAssignForm = state.showAssignForm;
  window.appState.showPaymentForm = state.showPaymentForm;
  window.appState.showPaymentPostServiceForm = state.showPaymentPostServiceForm;
  window.appState.showLeadDetail = state.showLeadDetail;
  window.appState.showInventoryForm = state.showInventoryForm;
  window.appState.showEditInventoryForm = state.showEditInventoryForm;
  window.appState.showAllocationForm = state.showAllocationForm;
  window.appState.showAllocationManagement = state.showAllocationManagement;
  window.appState.showDeliveryForm = state.showDeliveryForm;
  window.appState.showChoiceModal = state.showChoiceModal;
  window.appState.showStatusProgressModal = state.showStatusProgressModal;

  // Form Data States
  window.appState.showClientSuggestion = state.showClientSuggestion;
  window.appState.clientSuggestion = state.clientSuggestion;
  window.appState.formData = state.formData;
  window.appState.currentLead = state.currentLead;
  window.appState.currentInventory = state.currentInventory;
  window.appState.currentDelivery = state.currentDelivery;
  window.appState.phoneCheckLoading = state.phoneCheckLoading;

  // ✅ CRITICAL MISSING: Allocation Management Inventory
  window.appState.allocationManagementInventory = state.allocationManagementInventory;
  window.appState.currentAllocations = state.currentAllocations;
  window.appState.editingInventory = state.editingInventory;

  // Leads Filter States
  window.appState.searchQuery = state.searchQuery || '';
  window.appState.leadsSourceFilter = state.leadsSourceFilter || 'all';
  window.appState.leadsBusinessTypeFilter = state.leadsBusinessTypeFilter || 'all';
  window.appState.leadsEventFilter = state.leadsEventFilter || 'all';
  window.appState.leadsSortField = state.leadsSortField || 'created_date';
  window.appState.leadsSortDirection = state.leadsSortDirection || 'desc';
  window.appState.currentLeadsPage = state.currentLeadsPage || 1;
  window.appState.itemsPerPage = state.itemsPerPage || 20;
  window.appState.viewMode = state.viewMode || 'leads';
  window.appState.leads = state.leads || [];

  // Inventory Filter States
  window.appState.inventoryEventFilter = state.inventoryEventFilter || 'all';
  window.appState.inventoryEventTypeFilter = state.inventoryEventTypeFilter || 'all';
  window.appState.inventoryDueDateFilter = state.inventoryDueDateFilter || 'all';
  window.appState.inventorySortField = state.inventorySortField || 'event_date';
  window.appState.inventorySortDirection = state.inventorySortDirection || 'asc';

  // Stadium Filter States
  window.appState.stadiumSearchQuery = state.stadiumSearchQuery || '';
  window.appState.stadiumSportFilter = state.stadiumSportFilter || 'all';
  window.appState.stadiumSortField = state.stadiumSortField || 'name';
  window.appState.stadiumSortDirection = state.stadiumSortDirection || 'asc';

  // Sports Calendar States
// Sports Calendar States
window.appState.sportsEvents = state.sportsEvents || [];
window.appState.selectedDate = state.selectedDate || new Date();
window.appState.calendarView = state.calendarView || "month";
window.appState.calendarFilters = state.calendarFilters || {};
window.appState.currentEvent = state.currentEvent || null;
window.appState.showEventForm = state.showEventForm || false;
window.appState.showImportModal = state.showImportModal || false;
window.appState.showEventDetail = state.showEventDetail || false;
// ✅ NEW: Sports Calendar Pagination States
window.appState.currentEventsPage = state.currentEventsPage || 1;
window.appState.eventsPerPage = state.eventsPerPage || 10;

  // ✅ ADD THESE LINES: Roles Management States
window.appState.roles = state.roles || [];
window.appState.rolesInitialized = state.rolesInitialized || false;
window.appState.showRoleForm = state.showRoleForm || false;
window.appState.editingRole = state.editingRole || null;
window.appState.roleFormData = state.roleFormData || {};

 // ✅ ADD THESE LINES: User Management States
window.appState.showUserManagement = state.showUserManagement || false;
window.appState.showUserForm = state.showUserForm || false;
window.appState.editingUser = state.editingUser || null;
window.appState.userFormData = state.userFormData || {};
window.appState.currentUser = state.currentUser || null; 

  // CSV Upload States
  window.appState.showPreview = state.showPreview || false;
  window.appState.uploadPreview = state.uploadPreview || null;
  window.appState.previewLoading = state.previewLoading || false;

  // ===== DIRECT WINDOW VARIABLES =====
  
  // Core Data
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

  // ✅ ADD THE MY ACTIONS ARRAYS HERE:
window.myLeads = state.myLeads || [];
window.myQuoteRequested = state.myQuoteRequested || [];
window.myOrders = state.myOrders || [];
window.myDeliveries = state.myDeliveries || [];
window.myReceivables = state.myReceivables || [];

  // Modal States - Direct Window Variables
  window.showAddForm = state.showAddForm;
  window.showEditForm = state.showEditForm;
  window.showAssignForm = state.showAssignForm;
  window.showPaymentForm = state.showPaymentForm;
  window.showPaymentPostServiceForm = state.showPaymentPostServiceForm;
  window.showLeadDetail = state.showLeadDetail;
  window.showInventoryForm = state.showInventoryForm || false;
  window.showEditInventoryForm = state.showEditInventoryForm || false;
  window.showAllocationForm = state.showAllocationForm;
  window.showAllocationManagement = state.showAllocationManagement || false;
  window.showDeliveryForm = state.showDeliveryForm;
  window.showInventoryDetail = state.showInventoryDetail || false;

  // Choice Modal States
  window.currentLeadForChoice = state.currentLeadForChoice;
  window.choiceOptions = state.choiceOptions;
  window.showChoiceModal = state.showChoiceModal;

  // Status Progress Modal States
  window.showStatusProgressModal = state.showStatusProgressModal;
  window.statusProgressOptions = state.statusProgressOptions;
  window.selectedStatus = state.selectedStatus;
  window.followUpDate = state.followUpDate;
  window.followUpNotes = state.followUpNotes;

  // Stadium States
  window.stadiums = state.stadiums || [];
  window.editingStadium = state.editingStadium || null;
  window.stadiumFormData = state.stadiumFormData || {};
  window.showStadiumForm = state.showStadiumForm || false;
  window.stadiumSearchQuery = state.stadiumSearchQuery || '';
  window.stadiumSportFilter = state.stadiumSportFilter || 'all';
  window.stadiumSortField = state.stadiumSortField || 'name';
  window.stadiumSortDirection = state.stadiumSortDirection || 'asc';

  // ✅ ADD THESE LINES: Roles States
window.roles = state.roles || [];
window.rolesInitialized = state.rolesInitialized || false;
window.showRoleForm = state.showRoleForm || false;
window.editingRole = state.editingRole || null;
window.roleFormData = state.roleFormData || {};

// ✅ ADD THESE LINES: User Management States
window.showUserManagement = state.showUserManagement || false;
window.showUserForm = state.showUserForm || false;
window.editingUser = state.editingUser || null;
window.userFormData = state.userFormData || {};
window.currentUser = state.currentUser || null;  

// Sports Calendar States
window.sportsEvents = state.sportsEvents || [];
window.selectedDate = state.selectedDate || new Date();
window.calendarView = state.calendarView || "month";
window.calendarFilters = state.calendarFilters || {};
window.currentEvent = state.currentEvent || null;
window.showEventForm = state.showEventForm || false;
window.showImportModal = state.showImportModal || false;
window.showEventDetail = state.showEventDetail || false;
// ✅ NEW: Sports Calendar Pagination States
window.currentEventsPage = state.currentEventsPage || 1;
window.eventsPerPage = state.eventsPerPage || 10;

  // Client States
  window.clients = state.clients || [];
  window.selectedClient = state.selectedClient || null;
  window.showClientDetail = state.showClientDetail || false;
  window.clientsLoading = state.clientsLoading || false;

  // Bulk Operations States
  window.bulkAssignSelections = state.bulkAssignSelections || {};
  window.bulkAssignLoading = state.bulkAssignLoading || false;
  window.showBulkAssignModal = state.showBulkAssignModal || false;

  // CSV Upload States
  window.csvUploadType = state.csvUploadType || '';
  window.showCSVUploadModal = state.showCSVUploadModal || false;
  window.previewLoading = state.previewLoading || false;
  window.showPreview = state.showPreview || false;
  window.previewData = state.previewData || [];
  window.uploadPreview = state.uploadPreview || null;
  window.clientDetectionResults = state.clientDetectionResults || [];
  window.showClientDetectionResults = state.showClientDetectionResults || false;
  window.uploading = state.uploading || false;

  // Filter States
  window.inventoryEventFilter = state.inventoryEventFilter || 'all';
  window.inventoryEventTypeFilter = state.inventoryEventTypeFilter || 'all';
  window.inventoryDueDateFilter = state.inventoryDueDateFilter || 'all';
  window.inventorySortField = state.inventorySortField || 'event_date';
  window.inventorySortDirection = state.inventorySortDirection || 'asc';
  window.currentInventoryPage = state.currentInventoryPage || 1;
  window.itemsPerPage = state.itemsPerPage || 20;

  // Status Filter States
  window.showStatusFilterDropdown = state.showStatusFilterDropdown;
  window.statusDropdownRef = state.statusDropdownRef;
  window.statusFilter = state.statusFilter;
  window.selectedStatusFilters = state.selectedStatusFilters;

  // Additional Form States
  window.phoneCheckTimeout = state.phoneCheckTimeout;
  window.allocationData = state.allocationData;
  window.paymentData = state.paymentData;
  window.paymentPostServiceData = state.paymentPostServiceData;
  window.deliveryFormData = state.deliveryFormData;
  window.orderData = state.orderData;
  window.orderEditData = state.orderEditData;
  window.currentOrderForEdit = state.currentOrderForEdit;
  window.showEditOrderForm = state.showEditOrderForm;
  window.userFormData = state.userFormData;
  window.editingUser = state.editingUser;

  // ✅ CRITICAL MISSING: Allocation Management Variables
  window.allocationManagementInventory = state.allocationManagementInventory || null;
  window.currentAllocations = state.currentAllocations || [];
  window.editingInventory = state.editingInventory || null;
  window.currentInventoryDetail = state.currentInventoryDetail || null;

  // Expanded inventory items tracking
window.expandedInventoryItems = state.expandedInventoryItems || new Set();
window.setExpandedInventoryItems = state.setExpandedInventoryItems || ((items) => {
  console.log("📊 setExpandedInventoryItems called with:", items);
  window.expandedInventoryItems = items;
});

  // ✅ CRITICAL MISSING: Order Management Variables
  window.currentOrderDetail = state.currentOrderDetail || null;
  window.showOrderDetail = state.showOrderDetail || false;
  window.selectedOrderForAssignment = state.selectedOrderForAssignment || null;
  window.showOrderAssignmentModal = state.showOrderAssignmentModal || false;

  // ===== COMPREHENSIVE STATE SETTERS FIX =====

  // ✅ ENHANCED SYNC FUNCTION - handles ALL modal states
  const syncStateToWindow = () => {
    setTimeout(() => {
      // Preserve ALL modal states during sync (CRITICAL)
      const modalStates = {
        // Inventory modals
        showInventoryForm: window.appState?.showInventoryForm,
        showEditInventoryForm: window.appState?.showEditInventoryForm,
        showAllocationManagement: window.appState?.showAllocationManagement,
        showInventoryDetail: window.appState?.showInventoryDetail,
        showAllocationForm: window.appState?.showAllocationForm,
        
        // Lead modals 
        showAddForm: window.appState?.showAddForm,
        showEditForm: window.appState?.showEditForm,
        showAssignForm: window.appState?.showAssignForm,
        showLeadDetail: window.appState?.showLeadDetail,
        
        // Payment modals
        showPaymentForm: window.appState?.showPaymentForm,
        showPaymentPostServiceForm: window.appState?.showPaymentPostServiceForm,
        
        // Order modals
        showOrderDetail: window.appState?.showOrderDetail,
        showEditOrderForm: window.appState?.showEditOrderForm,
        showOrderAssignmentModal: window.appState?.showOrderAssignmentModal,
        
        // Sports Calendar modals
        showEventForm: window.appState?.showEventForm,
        showImportModal: window.appState?.showImportModal,
        showEventDetail: window.appState?.showEventDetail,
        
        // Other modals
        showDeliveryForm: window.appState?.showDeliveryForm,
        showChoiceModal: window.appState?.showChoiceModal,
        showStatusProgressModal: window.appState?.showStatusProgressModal,
        showBulkAssignModal: window.appState?.showBulkAssignModal,
        showCSVUploadModal: window.appState?.showCSVUploadModal,
        showStadiumForm: window.appState?.showStadiumForm,
        showClientDetail: window.appState?.showClientDetail,
        showClientSuggestion: window.appState?.showClientSuggestion,
        showPreview: window.appState?.showPreview,
        showClientDetectionResults: window.appState?.showClientDetectionResults,
        showUserForm: window.appState?.showUserForm
      };

      // Apply all modal states to window
      Object.keys(modalStates).forEach(key => {
        window[key] = modalStates[key];
      });

      // Apply data states
      window.editingInventory = window.appState?.editingInventory;
      window.allocationManagementInventory = window.appState?.allocationManagementInventory;
      window.currentAllocations = window.appState?.currentAllocations;
      window.currentInventoryDetail = window.appState?.currentInventoryDetail;
      window.currentOrderDetail = window.appState?.currentOrderDetail;
      window.selectedOrderForAssignment = window.appState?.selectedOrderForAssignment;
      window.currentEvent = window.appState?.currentEvent;
      window.selectedDate = window.appState?.selectedDate;
      window.calendarView = window.appState?.calendarView;
      window.calendarFilters = window.appState?.calendarFilters;
      
      console.log("🔄 Enhanced syncStateToWindow completed for all modals including sports calendar");
    }, 10);
  };
  // ✅ ADD THIS FUNCTION: User Management Page Component (not modal)
window.renderUserManagementContent = () => {
  console.log("🔍 renderUserManagementContent called");
  
  // Fetch users if not already loaded
  if (!window.users || window.users.length === 0) {
    window.fetchUsers && window.fetchUsers();
  }

  return React.createElement('div', { className: 'space-y-6' },
    // Header
    React.createElement('div', { className: 'flex justify-between items-center' },
      React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' }, 'User Management'),
      React.createElement('div', { className: 'flex space-x-2' },
        window.hasPermission('users', 'write') && React.createElement('button', {
          onClick: () => {
            console.log('🔍 Add User button clicked');
            window.openUserForm && window.openUserForm();
          },
          className: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'
        }, '+ Add User'),
        React.createElement('button', {
          onClick: () => {
            console.log('🔍 Export Users button clicked');
            window.exportUsersData && window.exportUsersData(window.users || []);
          },
          className: 'bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700'
        }, '📥 Export Users')
      )
    ),

    // Users Table
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow' },
      React.createElement('div', { className: 'overflow-x-auto' },
        React.createElement('table', { className: 'w-full' },
          React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-900' },
            React.createElement('tr', null,
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'User'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Role'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Status'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Created'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
            )
          ),
          React.createElement('tbody', { className: 'divide-y divide-gray-200 dark:divide-gray-700' },
            (window.users || []).length > 0 ?
              (window.users || []).map((user, index) => 
                React.createElement('tr', { key: user.id || index, className: 'hover:bg-gray-50 dark:hover:bg-gray-700' },
                  // User Info
                  React.createElement('td', { className: 'px-6 py-4' },
                    React.createElement('div', null,
                      React.createElement('div', { className: 'text-sm font-medium text-gray-900 dark:text-white' }, user.name),
                      React.createElement('div', { className: 'text-sm text-gray-500' }, user.email)
                    )
                  ),
                  
                  // Role
                  React.createElement('td', { className: 'px-6 py-4 text-sm text-gray-900 dark:text-white' },
                    window.getRoleDisplayName ? window.getRoleDisplayName(user.role) : user.role
                  ),
                  
                  // Status
                  React.createElement('td', { className: 'px-6 py-4' },
                    React.createElement('span', { 
                      className: `px-2 py-1 text-xs font-medium rounded-full ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`
                    }, user.status || 'active')
                  ),
                  
                  // Created Date
                  React.createElement('td', { className: 'px-6 py-4 text-sm text-gray-900 dark:text-white' },
                    user.created_date ? new Date(user.created_date).toLocaleDateString() : 'N/A'
                  ),
                  
                  // Actions
                  React.createElement('td', { className: 'px-6 py-4' },
                    React.createElement('div', { className: 'flex items-center space-x-2' },
                      // Edit Button
                      window.hasPermission('users', 'write') && React.createElement('button', {
                        onClick: () => {
                          console.log('🔍 Edit User clicked:', user.name);
                          window.openUserForm && window.openUserForm(user);
                        },
                        className: 'text-blue-600 hover:text-blue-900 text-sm px-3 py-1 rounded border border-blue-200 hover:bg-blue-50'
                      }, '✏️ Edit'),
                      
                      // Toggle Status Button
                      window.hasPermission('users', 'write') && React.createElement('button', {
                        onClick: () => {
                          console.log('🔍 Toggle Status clicked for:', user.name);
                          window.toggleUserStatus && window.toggleUserStatus(user.id, user.status);
                        },
                        className: `text-sm px-3 py-1 rounded border ${
                          user.status === 'active' 
                            ? 'text-red-600 border-red-200 hover:bg-red-50' 
                            : 'text-green-600 border-green-200 hover:bg-green-50'
                        }`
                      }, user.status === 'active' ? '🚫 Deactivate' : '✅ Activate'),
                      
                      // Delete Button
                      window.hasPermission('users', 'delete') && React.createElement('button', {
                        onClick: () => {
                          console.log('🔍 Delete User clicked:', user.name);
                          window.handleDeleteUser && window.handleDeleteUser(user.id, user.name);
                        },
                        className: 'text-red-600 hover:text-red-900 text-sm px-3 py-1 rounded border border-red-200 hover:bg-red-50'
                      }, '🗑️ Delete')
                    )
                  )
                )
              ) :
              React.createElement('tr', null,
                React.createElement('td', { 
                  colSpan: 5, 
                  className: 'px-6 py-8 text-center text-gray-500' 
                }, 
                  React.createElement('div', { className: 'text-center' },
                    React.createElement('div', { className: 'text-4xl mb-2' }, '👥'),
                    React.createElement('div', { className: 'text-lg font-medium' }, 'No users found'),
                    React.createElement('div', { className: 'text-sm' }, 'Add new users to get started')
                  )
                )
              )
          )
        )
      )
    )
  );
};

  // ✅ REMINDER DASHBOARD MODAL - EXTRACTED FROM EXISTING REMINDERS.JS
window.renderReminderDashboard = () => {
  if (!window.showReminderDashboard) {
    return null;
  }

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => {
      if (e.target === e.currentTarget) {
        window.setShowReminderDashboard(false);
      }
    }
  },
    React.createElement('div', {
      className: 'bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden',
      onClick: (e) => e.stopPropagation()
    },
      // Header
      React.createElement('div', {
        className: 'flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700'
      },
        React.createElement('h2', {
          className: 'text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2'
        },
          React.createElement('span', null, '🔔'),
          'Reminder Dashboard'
        ),
        React.createElement('button', {
          onClick: () => window.setShowReminderDashboard(false),
          className: 'text-gray-400 hover:text-gray-600 text-2xl'
        }, '×')
      ),
      
      // Content - Using existing reminder content structure
      React.createElement('div', { className: 'p-6 overflow-y-auto max-h-[80vh]' },
        // Quick stats (copied from reminders.js)
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-4 mb-6' },
          React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 shadow' },
            React.createElement('div', { className: 'text-3xl font-bold text-blue-600' }, window.reminderStats?.total || 0),
            React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-400' }, 'Total Reminders')
          ),
          React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 shadow' },
            React.createElement('div', { className: 'text-3xl font-bold text-red-600' }, window.reminderStats?.overdue || 0),
            React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-400' }, 'Overdue')
          ),
          React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 shadow' },
            React.createElement('div', { className: 'text-3xl font-bold text-orange-600' }, window.reminderStats?.due_today || 0),
            React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-400' }, 'Due Today')
          ),
          React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 shadow' },
            React.createElement('div', { className: 'text-3xl font-bold text-green-600' }, window.reminderStats?.pending || 0),
            React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-400' }, 'Pending')
          )
        ),

        // Action buttons
        React.createElement('div', { className: 'flex gap-3 mb-6' },
          React.createElement('button', {
            onClick: () => window.fetchReminders && window.fetchReminders(),
            className: 'px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700'
          }, '🔄 Refresh')
        ),

        // Reminders table (copied structure from reminders.js)
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow' },
          React.createElement('div', { className: 'px-6 py-4 border-b border-gray-200 dark:border-gray-700' },
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 dark:text-white' }, 'All Reminders')
          ),
          React.createElement('div', { className: 'overflow-x-auto' },
            (window.reminders && window.reminders.length > 0) ? 
              // Use existing table structure from reminders.js
              React.createElement('table', { className: 'w-full' },
                React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-700' },
                  React.createElement('tr', null,
                    React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Title'),
                    React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Due Date'),
                    React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Priority'),
                    React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Actions')
                  )
                ),
                React.createElement('tbody', { className: 'bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700' },
                  window.reminders.map((reminder, index) => 
                    React.createElement('tr', { key: reminder.id || index, className: 'hover:bg-gray-50 dark:hover:bg-gray-600' },
                      React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white' }, 
                        reminder.title || 'No title'
                      ),
                      React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white' }, 
                        reminder.due_date ? new Date(reminder.due_date).toLocaleDateString() : 'No date'
                      ),
                      React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                        React.createElement('span', { 
                          className: `px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            reminder.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            reminder.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            reminder.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`
                        }, (reminder.priority || 'low').toUpperCase())
                      ),
                      React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm font-medium' },
                        React.createElement('div', { className: 'flex space-x-2' },
                          reminder.status === 'pending' && React.createElement('button', {
                            onClick: () => window.completeReminder && window.completeReminder(reminder.id, 'Completed'),
                            className: 'text-green-600 hover:text-green-900'
                          }, '✓ Complete'),
                          React.createElement('button', {
                            onClick: () => window.deleteReminder && window.deleteReminder(reminder.id),
                            className: 'text-red-600 hover:text-red-900'
                          }, '🗑️ Delete')
                        )
                      )
                    )
                  )
                )
              ) :
              React.createElement('div', { className: 'p-8 text-center text-gray-500' },
                React.createElement('p', null, 'No reminders found'),
                React.createElement('p', { className: 'text-sm mt-2' }, 'Click "🔄 Refresh" to load your reminders')
              )
          )
        )
      )
    )
  );
};
  
  // ✅ UNIVERSAL MODAL STATE SETTER FACTORY
  const createEnhancedModalSetter = (setterName, stateKey, reactStateSetter) => {
    return reactStateSetter ? (value) => {
      console.log(`🎯 ENHANCED ${setterName} called with:`, value);
      
      // Step 1: Set React state
      reactStateSetter(value);
      
      // Step 2: Set window globals immediately
      window.appState[stateKey] = value;
      window[stateKey] = value;
      
      // Step 3: Force immediate sync for modals (CRITICAL FIX)
      if (value && stateKey.includes('show')) {
        setTimeout(() => {
          window.appState[stateKey] = value;
          window[stateKey] = value;
          console.log(`🔄 ${setterName} force-synced to:`, value);
        }, 10);
        
        // Step 4: Force React re-render if opening modal
        console.log(`🚀 Forcing React re-render for ${setterName}...`);
        const currentLoading = window.loading;
        window.setLoading && window.setLoading(true);
        setTimeout(() => {
          window.setLoading && window.setLoading(currentLoading);
          setTimeout(() => {
            window.appState[stateKey] = value;
            window[stateKey] = value;
            console.log(`✅ ${setterName} final state check:`, {
              window: window[stateKey],
              appState: window.appState?.[stateKey]
            });
          }, 20);
        }, 50);
      } else {
        syncStateToWindow();
      }
      
    } : (value) => {
      console.log(`🎯 ${setterName} FALLBACK called with:`, value);
      window[stateKey] = value;
      window.appState[stateKey] = value;
    };
  };

  // Core State Setters (keep as-is)
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

// ✅ ADD THE MY ACTIONS SETTERS HERE:  
window.setMyLeads = state.setMyLeads;
window.setMyQuoteRequested = state.setMyQuoteRequested;
window.setMyOrders = state.setMyOrders;
window.setMyDeliveries = state.setMyDeliveries;
window.setMyReceivables = state.setMyReceivables;

  // ✅ REMINDERS STATE SETTERS - MISSING EXPOSURES FIXED
window.setReminders = state.setReminders;
window.setReminderStats = state.setReminderStats;
window.setShowReminderDashboard = createEnhancedModalSetter('setShowReminderDashboard', 'showReminderDashboard', state.setShowReminderDashboard);

  // ✅ ENHANCED MODAL STATE SETTERS - Lead Management
  window.setShowAddForm = createEnhancedModalSetter('setShowAddForm', 'showAddForm', state.setShowAddForm);
  window.setShowEditForm = createEnhancedModalSetter('setShowEditForm', 'showEditForm', state.setShowEditForm);
  window.setShowAssignForm = createEnhancedModalSetter('setShowAssignForm', 'showAssignForm', state.setShowAssignForm);
  window.setShowLeadDetail = createEnhancedModalSetter('setShowLeadDetail', 'showLeadDetail', state.setShowLeadDetail);

  // ✅ ENHANCED MODAL STATE SETTERS - Payment Forms  
  window.setShowPaymentForm = createEnhancedModalSetter('setShowPaymentForm', 'showPaymentForm', state.setShowPaymentForm);
  window.setShowPaymentPostServiceForm = createEnhancedModalSetter('setShowPaymentPostServiceForm', 'showPaymentPostServiceForm', state.setShowPaymentPostServiceForm);

  // ✅ ENHANCED MODAL STATE SETTERS - Inventory Forms (already working but standardizing)
  window.setShowInventoryForm = createEnhancedModalSetter('setShowInventoryForm', 'showInventoryForm', state.setShowInventoryForm);
  window.setShowEditInventoryForm = createEnhancedModalSetter('setShowEditInventoryForm', 'showEditInventoryForm', state.setShowEditInventoryForm);
  window.setShowAllocationManagement = createEnhancedModalSetter('setShowAllocationManagement', 'showAllocationManagement', state.setShowAllocationManagement);
  window.setShowInventoryDetail = createEnhancedModalSetter('setShowInventoryDetail', 'showInventoryDetail', state.setShowInventoryDetail);
  window.setShowAllocationForm = createEnhancedModalSetter('setShowAllocationForm', 'showAllocationForm', state.setShowAllocationForm);

  // ✅ ENHANCED MODAL STATE SETTERS - Order Management
  window.setShowOrderDetail = createEnhancedModalSetter('setShowOrderDetail', 'showOrderDetail', state.setShowOrderDetail);
  window.setShowEditOrderForm = createEnhancedModalSetter('setShowEditOrderForm', 'showEditOrderForm', state.setShowEditOrderForm);
  window.setShowOrderAssignmentModal = createEnhancedModalSetter('setShowOrderAssignmentModal', 'showOrderAssignmentModal', state.setShowOrderAssignmentModal);

  // ✅ ENHANCED MODAL STATE SETTERS - Sports Calendar
  window.setShowEventForm = createEnhancedModalSetter('setShowEventForm', 'showEventForm', state.setShowEventForm);
  window.setShowImportModal = createEnhancedModalSetter('setShowImportModal', 'showImportModal', state.setShowImportModal);
  window.setShowEventDetail = createEnhancedModalSetter('setShowEventDetail', 'showEventDetail', state.setShowEventDetail);

  // ✅ NEW: Sports Calendar Pagination Setters
window.setCurrentEventsPage = (page) => {
  console.log("🔍 setCurrentEventsPage called:", page);
  state.setCurrentEventsPage && state.setCurrentEventsPage(page);
  window.currentEventsPage = page;
  window.appState.currentEventsPage = page;
};

window.setEventsPerPage = (perPage) => {
  console.log("🔍 setEventsPerPage called:", perPage);
  state.setEventsPerPage && state.setEventsPerPage(perPage);
  window.eventsPerPage = perPage;
  window.appState.eventsPerPage = perPage;
  window.setCurrentEventsPage(1); // Reset to first page when changing items per page
};

  // ✅ ENHANCED MODAL STATE SETTERS - Other Forms
  window.setShowDeliveryForm = createEnhancedModalSetter('setShowDeliveryForm', 'showDeliveryForm', state.setShowDeliveryForm);
  window.setShowChoiceModal = createEnhancedModalSetter('setShowChoiceModal', 'showChoiceModal', state.setShowChoiceModal);
  window.setShowStatusProgressModal = createEnhancedModalSetter('setShowStatusProgressModal', 'showStatusProgressModal', state.setShowStatusProgressModal);
  window.setShowBulkAssignModal = createEnhancedModalSetter('setShowBulkAssignModal', 'showBulkAssignModal', state.setShowBulkAssignModal);
  window.setShowCSVUploadModal = createEnhancedModalSetter('setShowCSVUploadModal', 'showCSVUploadModal', state.setShowCSVUploadModal);
  window.setShowStadiumForm = createEnhancedModalSetter('setShowStadiumForm', 'showStadiumForm', state.setShowStadiumForm);
  window.setShowClientDetail = createEnhancedModalSetter('setShowClientDetail', 'showClientDetail', state.setShowClientDetail);
  window.setShowClientSuggestion = createEnhancedModalSetter('setShowClientSuggestion', 'showClientSuggestion', state.setShowClientSuggestion);
  window.setShowUserForm = createEnhancedModalSetter('setShowUserForm', 'showUserForm', state.setShowUserForm);

  // ✅ ENHANCED DATA STATE SETTERS
  window.setEditingInventory = state.setEditingInventory ? (inventory) => {
    console.log("📝 ENHANCED setEditingInventory called with:", inventory);
    state.setEditingInventory(inventory);
    window.appState.editingInventory = inventory;
    window.editingInventory = inventory;
    syncStateToWindow();
  } : (inventory) => {
    console.log("⚠️ FALLBACK setEditingInventory called with:", inventory);
    window.editingInventory = inventory;
    window.appState.editingInventory = inventory;
  };

  window.setAllocationManagementInventory = state.setAllocationManagementInventory ? (inventory) => {
    console.log("📦 ENHANCED setAllocationManagementInventory called with:", inventory);
    state.setAllocationManagementInventory(inventory);
    window.appState.allocationManagementInventory = inventory;
    window.allocationManagementInventory = inventory;
    syncStateToWindow();
  } : (inventory) => {
    console.log("📦 FALLBACK setAllocationManagementInventory called with:", inventory);
    window.allocationManagementInventory = inventory;
    window.appState.allocationManagementInventory = inventory;
  };

  window.setCurrentAllocations = state.setCurrentAllocations ? (allocations) => {
    console.log("📋 ENHANCED setCurrentAllocations called with:", allocations?.length || 0, "allocations");
    state.setCurrentAllocations(allocations);
    window.appState.currentAllocations = allocations;
    window.currentAllocations = allocations;
    syncStateToWindow();
  } : (allocations) => {
    console.log("📋 FALLBACK setCurrentAllocations called with:", allocations?.length || 0, "allocations");
    window.currentAllocations = allocations;
    window.appState.currentAllocations = allocations;
  };

  window.setCurrentInventoryDetail = state.setCurrentInventoryDetail ? (inventory) => {
    console.log("📄 ENHANCED setCurrentInventoryDetail called with:", inventory);
    state.setCurrentInventoryDetail(inventory);
    window.appState.currentInventoryDetail = inventory;
    window.currentInventoryDetail = inventory;
    syncStateToWindow();
  } : (inventory) => {
    console.log("📄 FALLBACK setCurrentInventoryDetail called with:", inventory);
    window.currentInventoryDetail = inventory;
    window.appState.currentInventoryDetail = inventory;
  };

  // ✅ SPORTS CALENDAR DATA STATE SETTERS
  window.setCurrentEvent = state.setCurrentEvent ? (event) => {
    console.log("📅 ENHANCED setCurrentEvent called with:", event?.title || event?.event_name);
    state.setCurrentEvent(event);
    window.appState.currentEvent = event;
    window.currentEvent = event;
    syncStateToWindow();
  } : (event) => {
    console.log("📅 FALLBACK setCurrentEvent called with:", event?.title || event?.event_name);
    window.currentEvent = event;
    window.appState.currentEvent = event;
  };

  window.setSelectedDate = state.setSelectedDate ? (date) => {
    console.log("📅 ENHANCED setSelectedDate called with:", date);
    state.setSelectedDate(date);
    window.appState.selectedDate = date;
    window.selectedDate = date;
    syncStateToWindow();
  } : (date) => {
    console.log("📅 FALLBACK setSelectedDate called with:", date);
    window.selectedDate = date;
    window.appState.selectedDate = date;
  };

  window.setCalendarView = state.setCalendarView ? (view) => {
    console.log("📅 ENHANCED setCalendarView called with:", view);
    state.setCalendarView(view);
    window.appState.calendarView = view;
    window.calendarView = view;
    syncStateToWindow();
  } : (view) => {
    console.log("📅 FALLBACK setCalendarView called with:", view);
    window.calendarView = view;
    window.appState.calendarView = view;
  };

  window.setCalendarFilters = state.setCalendarFilters ? (filters) => {
    console.log("📅 ENHANCED setCalendarFilters called with:", filters);
    const newFilters = { ...window.calendarFilters, ...filters };
    state.setCalendarFilters(newFilters);
    window.appState.calendarFilters = newFilters;
    window.calendarFilters = newFilters;
    syncStateToWindow();
  } : (filters) => {
    console.log("📅 FALLBACK setCalendarFilters called with:", filters);
    window.calendarFilters = { ...window.calendarFilters, ...filters };
    window.appState.calendarFilters = window.calendarFilters;
  };

  // ✅ NEW: Order Management Data Setters
  window.setCurrentOrderDetail = state.setCurrentOrderDetail ? (order) => {
    console.log("📋 ENHANCED setCurrentOrderDetail called with:", order);
    state.setCurrentOrderDetail(order);
    window.appState.currentOrderDetail = order;
    window.currentOrderDetail = order;
    syncStateToWindow();
  } : (order) => {
    console.log("📋 FALLBACK setCurrentOrderDetail called with:", order);
    window.currentOrderDetail = order;
    window.appState.currentOrderDetail = order;
  };

  window.setSelectedOrderForAssignment = state.setSelectedOrderForAssignment ? (order) => {
    console.log("📋 ENHANCED setSelectedOrderForAssignment called with:", order);
    state.setSelectedOrderForAssignment(order);
    window.appState.selectedOrderForAssignment = order;
    window.selectedOrderForAssignment = order;
    syncStateToWindow();
  } : (order) => {
    console.log("📋 FALLBACK setSelectedOrderForAssignment called with:", order);
    window.selectedOrderForAssignment = order;
    window.appState.selectedOrderForAssignment = order;
  };

  window.setCurrentOrderForEdit = state.setCurrentOrderForEdit || ((order) => {
    console.log("✏️ setCurrentOrderForEdit called with:", order);
    window.currentOrderForEdit = order;
    window.appState.currentOrderForEdit = order;
  });

  window.setOrderEditData = state.setOrderEditData || ((data) => {
    console.log("📝 setOrderEditData called with:", data);
    window.orderEditData = data;
    window.appState.orderEditData = data;
  });

  // Choice Modal State Setters
  window.setCurrentLeadForChoice = state.setCurrentLeadForChoice;
  window.setChoiceOptions = state.setChoiceOptions;

  // Status Progress Modal State Setters
  window.setStatusProgressOptions = state.setStatusProgressOptions;
  window.setSelectedStatus = state.setSelectedStatus;
  window.setFollowUpDate = state.setFollowUpDate;
  window.setFollowUpNotes = state.setFollowUpNotes;

  // Stadium State Setters
  window.setStadiums = state.setStadiums;
  window.setEditingStadium = state.setEditingStadium;
  window.setStadiumFormData = state.setStadiumFormData;

  // ✅ ADD THESE LINES: Roles State Setters
  window.setRoles = state.setRoles;
  window.setRolesInitialized = state.setRolesInitialized;
  window.setShowRoleForm = state.setShowRoleForm;
  window.setEditingRole = state.setEditingRole;
  window.setRoleFormData = state.setRoleFormData;

  // ✅ ADD THESE LINES: User Management State Setters
window.setShowUserManagement = state.setShowUserManagement;
window.setShowUserForm = state.setShowUserForm;
window.setEditingUser = state.setEditingUser;
window.setUserFormData = state.setUserFormData;
window.setCurrentUser = state.setCurrentUser;

  // ✅ STADIUM FILTER STATE SETTERS
  window.setStadiumSearchQuery = state.setStadiumSearchQuery || ((query) => {
    console.log("🔍 setStadiumSearchQuery called with:", query);
    window.stadiumSearchQuery = query;
    window.appState.stadiumSearchQuery = query;
    if (state.setStadiumSearchQuery) {
      state.setStadiumSearchQuery(query);
    }
  });

  window.setStadiumSportFilter = state.setStadiumSportFilter || ((filter) => {
    console.log("🏷️ setStadiumSportFilter called with:", filter);
    window.stadiumSportFilter = filter;
    window.appState.stadiumSportFilter = filter;
    if (state.setStadiumSportFilter) {
      state.setStadiumSportFilter(filter);
    }
  });

  window.setStadiumSortField = state.setStadiumSortField || ((field) => {
    console.log("📊 setStadiumSortField called with:", field);
    window.stadiumSortField = field;
    window.appState.stadiumSortField = field;
    if (state.setStadiumSortField) {
      state.setStadiumSortField(field);
    }
  });

  window.setStadiumSortDirection = state.setStadiumSortDirection || ((direction) => {
    console.log("🔄 setStadiumSortDirection called with:", direction);
    window.stadiumSortDirection = direction;
    window.appState.stadiumSortDirection = direction;
    if (state.setStadiumSortDirection) {
      state.setStadiumSortDirection(direction);
    }
  });

  // Client State Setters
  window.setSelectedClient = state.setSelectedClient || ((client) => {
    console.log("👤 setSelectedClient called with:", client);
    window.selectedClient = client;
    if (state.setSelectedClient) {
      state.setSelectedClient(client);
    } else {
      console.warn("⚠️ setSelectedClient not implemented in state");
    }
  });

  // Form Data Setters
  window.setClientSuggestion = state.setClientSuggestion;
  window.setPhoneCheckTimeout = state.setPhoneCheckTimeout;
  window.setAllocationData = state.setAllocationData;
  window.setPaymentData = state.setPaymentData;
  window.setPaymentPostServiceData = state.setPaymentPostServiceData;
  window.setDeliveryFormData = state.setDeliveryFormData;
  window.setOrderData = state.setOrderData;
  window.setUserFormData = state.setUserFormData;
  window.setEditingUser = state.setEditingUser;
  // ✅ ADD THESE MISSING USER FORM FUNCTIONS:
window.handleUserInputChange = (field, value) => {
  console.log("📝 User input change:", field, value);
  window.setUserFormData(prev => ({ ...prev, [field]: value }));
};

window.closeUserForm = () => {
  console.log("🔄 closeUserForm called");
  window.setShowUserForm(false);
  window.setEditingUser(null);
  window.setUserFormData({
    name: '',
    email: '',
    password: '',
    role: 'viewer',
    department: '',
    status: 'active'
  });
};

window.currentUser = state.currentUser || null;
window.userFormData = state.userFormData || {};

  // Filter State Setters (with fallbacks)
  window.setSearchQuery = state.setSearchQuery || ((query) => {
    console.log("🔍 setSearchQuery called with:", query);
    window.searchQuery = query;
  });
  
  window.setLeadsSourceFilter = state.setLeadsSourceFilter || ((filter) => {
    console.log("🏷️ setLeadsSourceFilter called with:", filter);
    window.leadsSourceFilter = filter;
  });
  
  window.setLeadsBusinessTypeFilter = state.setLeadsBusinessTypeFilter || ((filter) => {
    console.log("🏢 setLeadsBusinessTypeFilter called with:", filter);
    window.leadsBusinessTypeFilter = filter;
  });
  
  window.setLeadsEventFilter = state.setLeadsEventFilter || ((filter) => {
    console.log("📅 setLeadsEventFilter called with:", filter);
    window.leadsEventFilter = filter;
  });
  
  window.setLeadsSortField = state.setLeadsSortField || ((field) => {
    console.log("📊 setLeadsSortField called with:", field);
    window.leadsSortField = field;
  });
  
  window.setLeadsSortDirection = state.setLeadsSortDirection || ((direction) => {
    console.log("🔄 setLeadsSortDirection called with:", direction);
    window.leadsSortDirection = direction;
  });

  // Inventory Filter State Setters
  window.setInventoryEventFilter = state.setInventoryEventFilter || ((filter) => {
    console.log("🎫 setInventoryEventFilter called with:", filter);
    window.inventoryEventFilter = filter;
    if (state.setInventoryEventFilter) {
      state.setInventoryEventFilter(filter);
    }
    window.updateCurrentInventoryItems && window.updateCurrentInventoryItems();
  });
  
  window.setInventoryEventTypeFilter = state.setInventoryEventTypeFilter || ((filter) => {
    console.log("🏷️ setInventoryEventTypeFilter called with:", filter);
    window.inventoryEventTypeFilter = filter;
    if (state.setInventoryEventTypeFilter) {
      state.setInventoryEventTypeFilter(filter);
    }
    window.updateCurrentInventoryItems && window.updateCurrentInventoryItems();
  });
  
  window.setInventoryDueDateFilter = state.setInventoryDueDateFilter || ((filter) => {
    console.log("📅 setInventoryDueDateFilter called with:", filter);
    window.inventoryDueDateFilter = filter;
    if (state.setInventoryDueDateFilter) {
      state.setInventoryDueDateFilter(filter);
    }
    window.updateCurrentInventoryItems && window.updateCurrentInventoryItems();
  });
  
  window.setInventorySortField = state.setInventorySortField || ((field) => {
    console.log("📊 setInventorySortField called with:", field);
    window.inventorySortField = field;
    if (state.setInventorySortField) {
      state.setInventorySortField(field);
    }
    window.updateCurrentInventoryItems && window.updateCurrentInventoryItems();
  });
  
  window.setInventorySortDirection = state.setInventorySortDirection || ((direction) => {
    console.log("🔄 setInventorySortDirection called with:", direction);
    window.inventorySortDirection = direction;
    if (state.setInventorySortDirection) {
      state.setInventorySortDirection(direction);
    }
    window.updateCurrentInventoryItems && window.updateCurrentInventoryItems();
  });

  window.setCurrentInventoryPage = state.setCurrentInventoryPage || ((page) => {
    console.log("📄 setCurrentInventoryPage called with:", page);
    window.currentInventoryPage = typeof page === 'function' ? page(window.currentInventoryPage) : page;
    if (state.setCurrentInventoryPage) {
      state.setCurrentInventoryPage(page);
    }
  });

  // View Mode Setter
  window.setViewMode = state.setViewMode || ((mode) => {
    console.log("👁️ setViewMode called with:", mode);
    window.viewMode = mode;
  });

  // Bulk Operations Setters (with fallbacks)
  window.setBulkAssignSelections = state.setBulkAssignSelections || ((selections) => {
    console.log("👥 setBulkAssignSelections called with:", Object.keys(selections || {}).length, "selections");
    window.bulkAssignSelections = selections;
  });
  
  window.setBulkAssignLoading = state.setBulkAssignLoading || ((loading) => {
    console.log("⏳ setBulkAssignLoading called with:", loading);
    window.bulkAssignLoading = loading;
  });

  // CSV Upload State Setters (with fallbacks)
  window.setCSVUploadType = state.setCSVUploadType || ((type) => {
    console.log("📄 setCSVUploadType called with:", type);
    window.csvUploadType = type;
  });

  window.setPreviewLoading = state.setPreviewLoading || ((loading) => {
    console.log("⏳ setPreviewLoading called with:", loading);
    window.previewLoading = loading;
  });

  window.setShowPreview = createEnhancedModalSetter('setShowPreview', 'showPreview', state.setShowPreview);

  window.setPreviewData = state.setPreviewData || ((data) => {
    console.log("📊 setPreviewData called with:", data?.length || 0, "items");
    window.previewData = data;
  });

  window.setUploadPreview = state.setUploadPreview || ((preview) => {
    console.log("📤 setUploadPreview called with:", preview);
    window.uploadPreview = preview;
    window.appState.uploadPreview = preview;
  });

  window.setClientDetectionResults = state.setClientDetectionResults || ((results) => {
    console.log("🔍 setClientDetectionResults called with:", results?.length || 0, "results");
    window.clientDetectionResults = results;
  });

  window.setShowClientDetectionResults = createEnhancedModalSetter('setShowClientDetectionResults', 'showClientDetectionResults', state.setShowClientDetectionResults);

  window.setUploading = state.setUploading || ((uploading) => {
    console.log("⏳ setUploading called with:", uploading);
    window.uploading = uploading;
  });

  // Status Filter Setters
  window.setShowStatusFilterDropdown = state.setShowStatusFilterDropdown;
  window.setStatusFilter = state.setStatusFilter;
  window.setSelectedStatusFilters = state.setSelectedStatusFilters;

  // ===== FUNCTION EXPOSURES =====
  // ✅ REMINDERS FUNCTION EXPOSURES - MISSING INTEGRATIONS FIXED
// Don't override fetchReminders if it already exists from reminder-management.js
if (!window.fetchReminders) {
  window.fetchReminders = (() => {
    console.log("🔔 fetchReminders fallback called");
    console.warn("⚠️ fetchReminders not fully implemented");
  });
}
window.completeReminder = window.completeReminder || ((id, notes) => {
  console.log("✅ completeReminder called:", id, notes);
  console.warn("⚠️ completeReminder not fully implemented");
});
window.snoozeReminder = window.snoozeReminder || ((id, hours) => {
  console.log("⏰ snoozeReminder called:", id, hours);
  console.warn("⚠️ snoozeReminder not fully implemented");
});
window.deleteReminder = window.deleteReminder || ((id) => {
  console.log("🗑️ deleteReminder called:", id);
  console.warn("⚠️ deleteReminder not fully implemented");
});

  // ✅ REMINDERS DATA ARRAYS - MISSING WINDOW SYNC FIXED
window.reminders = state.reminders || [];
window.reminderStats = state.reminderStats || { total: 0, overdue: 0, due_today: 0, pending: 0 };
window.showReminderDashboard = state.showReminderDashboard || false;

  // ✅ ADD THESE MISSING MY ACTIONS FUNCTION EXPOSURES:
window.setActiveTab = state.setActiveTab;
window.viewLeadDetails = handlers.openLeadDetail || window.openLeadDetail || ((lead) => {
  console.log("🔍 viewLeadDetails called with lead:", lead);
  window.setCurrentLead(lead);
  window.setShowLeadDetail(true);
});
  
  // Lead Progression Functions
  window.handleLeadProgression = handlers.handleLeadProgression || handlers.progressLead || ((leadId, newStatus) => {
    console.log("🔄 handleLeadProgression called:", leadId, newStatus);
    if (window.updateLeadStatus) {
  return window.updateLeadStatus(leadId, newStatus);
    } else {
      console.warn("⚠️ updateLeadStatus handler not available");
    }
  });
  window.handleChoiceSelection = handlers.handleChoiceSelection || ((choice) => {
    console.log("🎯 handleChoiceSelection called with:", choice);
    console.warn("⚠️ handleChoiceSelection not implemented in handlers");
  });

  window.togglePremiumStatus = handlers.togglePremiumStatus || ((leadId, isPremium) => {
    console.log("⭐ togglePremiumStatus called:", leadId, isPremium);
    console.warn("⚠️ togglePremiumStatus not implemented in handlers");
  });

  // Form Opening Functions
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

  // Specialized Form Functions
  window.openPaymentForm = handlers.openPaymentForm || ((lead) => {
    console.log("💰 openPaymentForm called with lead:", lead);
    state.setCurrentLead(lead);
    state.setShowPaymentForm(true);
  });

  window.openPaymentPostServiceForm = handlers.openPaymentPostServiceForm || ((lead) => {
    console.log("📅 openPaymentPostServiceForm called with lead:", lead);
    state.setCurrentLead(lead);
    state.setShowPaymentPostServiceForm(true);
  });
  
  window.openAllocationForm = handlers.openAllocationForm || ((inventory) => {
    console.log("📦 openAllocationForm called with inventory:", inventory);
    state.setCurrentInventory(inventory);
    state.setShowAllocationForm(true);
  });
  
// ✅ FIXED: Delivery Form Functions - Use Enhanced Window Setters
window.openDeliveryForm = handlers.openDeliveryForm || ((delivery) => {
  console.log("🚚 ENHANCED openDeliveryForm called with delivery:", delivery);
  
  // ✅ Permission check
  if (!window.hasPermission('delivery', 'write')) {
    alert('You do not have permission to manage deliveries');
    return;
  }
  
  // ✅ Use enhanced window setters (not direct state setters)
  window.setCurrentDelivery(delivery);
  window.setShowDeliveryForm(true);
  
  console.log("✅ Enhanced delivery form opened with sync and re-render logic");
});

  // ✅ INVENTORY FUNCTIONS - FIXED WITH FORCE RE-RENDER
  window.openInventoryForm = handlers.openInventoryForm || (() => {
    console.log("📦 openInventoryForm called");
    window.setShowInventoryForm(true);
  });

  window.openAddInventoryForm = handlers.openAddInventoryForm || (() => {
    console.log("➕ openAddInventoryForm called - ENHANCED VERSION");
    
    // Set editing inventory first
    const defaultInventory = { 
      id: null,
      event_name: '',
      event_date: '',
      event_type: '',
      sports: '',
      venue: '',
      form_ids: []
    };
    
    console.log("🔧 Setting editingInventory to:", defaultInventory);
    window.setEditingInventory(defaultInventory);
    
    // Pre-fill form data
    if (window.setFormData) {
      window.setFormData(defaultInventory);
      console.log("✅ setFormData called successfully");
    }
    
    // Show the form
    console.log("🔧 Setting showInventoryForm to true");
    window.setShowInventoryForm(true);
    
    console.log("✅ openAddInventoryForm completed with enhanced sync");
  });

  // ✅ CRITICAL FIX: Edit function with force React re-render
  window.openEditInventoryForm = (inventory) => {
    console.log("✏️ FIXED openEditInventoryForm called with:", inventory?.event_name);
    
    // Permission check (keep from original)
    if (!window.hasPermission('inventory', 'write')) {
      alert('You do not have permission to edit inventory');
      return;
    }
    
    // ✅ STEP 1: Set window variables directly
    window.showInventoryForm = true;
    window.editingInventory = inventory;
    
    // ✅ STEP 2: Call React state setters
    if (window.setEditingInventory) {
      window.setEditingInventory(inventory);
    }
    if (window.setFormData) {
  window.setFormData({
    ...inventory,
    purchase_currency: inventory.purchase_currency || 'INR',
    purchase_exchange_rate: inventory.purchase_exchange_rate || '1',
    form_ids: inventory.form_ids || []  // ADD THIS LINE
  });
}
    if (window.setShowInventoryForm) {
      window.setShowInventoryForm(true);
    }
    
    // ✅ STEP 3: Force React re-render (CRITICAL FIX)
    if (window.setLoading) {
      window.setLoading(true);
      setTimeout(() => {
        window.setLoading(false);
      }, 50);
    }
    
    console.log("✅ Fixed edit function completed with force re-render");
  };

  window.openInventoryDetail = handlers.openInventoryDetail || ((inventory) => {
    console.log("📦 openInventoryDetail called with:", inventory?.event_name);
    
    // Set the current inventory detail
    window.setCurrentInventoryDetail(inventory);
    
    // Show the detail modal
    window.setShowInventoryDetail(true);
    
    console.log("✅ Inventory detail modal setup completed");
  });

  window.openAllocationManagement = handlers.openAllocationManagement || ((inventory) => {
    console.log("👁️ openAllocationManagement called with:", inventory?.event_name);
    
    // Set the inventory for allocation management
    window.setAllocationManagementInventory(inventory);
    
    // Initialize with empty allocations (will be loaded by the modal)
    window.setCurrentAllocations([]);
    
    // Show the modal
    window.setShowAllocationManagement(true);
    
    console.log("✅ Allocation management modal setup completed");
  });

  window.handleDeleteInventory = handlers.handleDeleteInventory || ((inventoryId) => {
    console.log("🗑️ handleDeleteInventory called with:", inventoryId);
    if (window.handleDelete) {
      return window.handleDelete('inventory', inventoryId, 'inventory item');
    } else {
      console.warn("⚠️ handleDeleteInventory not implemented");
    }
  });

  window.handleCopyInventory = handlers.handleCopyInventory || ((inventory) => {
    console.log("📋 handleCopyInventory called with:", inventory);
    console.warn("⚠️ handleCopyInventory not implemented in handlers");
  });

  // ✅ ORDER WORKFLOW FUNCTIONS
  window.handleOrderApproval = handlers.handleOrderApproval || ((orderId, action) => {
    console.log("✅ handleOrderApproval called:", orderId, action);
    console.warn("⚠️ handleOrderApproval not implemented in handlers");
  });

  window.openInvoicePreview = handlers.openInvoicePreview || ((invoice) => {
    console.log("📄 openInvoicePreview called with:", invoice);
    console.warn("⚠️ openInvoicePreview not implemented in handlers");
  });

  // ===== SPORTS CALENDAR BUSINESS LOGIC FUNCTIONS =====

  // ✅ FETCH ALL EVENTS FUNCTION
  window.fetchAllEvents = handlers.fetchAllEvents || (async () => {
    console.log("📅 fetchAllEvents called");
    try {
      window.setLoading && window.setLoading(true);
      
      const response = await window.apiCall("/events");
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      window.sportsEvents = response.data || response || [];
      window.appState.sportsEvents = window.sportsEvents;
      
      console.log("✅ Sports events loaded:", window.sportsEvents.length);
      
      // Update React state if available
      if (state.setSportsEvents) {
        state.setSportsEvents(window.sportsEvents);
      }
      
    } catch (error) {
      console.error("❌ Error fetching sports events:", error);
      window.sportsEvents = [];
      window.appState.sportsEvents = [];
      alert("Failed to fetch events: " + error.message);
    } finally {
      window.setLoading && window.setLoading(false);
    }
  });

  // ✅ EXPORT EVENTS TO EXCEL FUNCTION
  window.exportEventsToExcel = handlers.exportEventsToExcel || (async () => {
    console.log("📅 exportEventsToExcel called");
    try {
      // Build query parameters from current filters
      const params = new URLSearchParams();
      if (window.calendarFilters?.geography) {
        params.append('geography', window.calendarFilters.geography);
      }
      if (window.calendarFilters?.sport_type) {
        params.append('sport_type', window.calendarFilters.sport_type);
      }
      if (window.calendarFilters?.priority) {
        params.append('priority', window.calendarFilters.priority);
      }
      params.append('sort_by', 'date'); // Default sort by date

      const response = await fetch(`${window.API_CONFIG.API_URL}/events/export/excel?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${window.authToken}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `events_calendar_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        alert('✅ Events exported successfully!');
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('❌ Export error:', error);
      alert('Failed to export events: ' + error.message);
    }
  });

// ✅ IMPORT EVENTS FROM EXCEL FUNCTION - FIXED
window.importEventsFromExcel = handlers.importEventsFromExcel || (async (file) => {
  console.log("📅 importEventsFromExcel called with file:", file?.name);
  try {
    window.setLoading && window.setLoading(true);
    
    // Parse Excel file on frontend first
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        // Parse Excel file using XLSX library
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        console.log('📊 Parsed Excel data:', jsonData.length, 'rows');
        console.log('🔍 Sample data:', jsonData.slice(0, 2));

        // Send parsed JSON data to backend
        const response = await fetch(`${window.API_CONFIG.API_URL}/events/import/excel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.authToken}`
          },
          body: JSON.stringify({ excelData: jsonData })
        });

        console.log('📤 Response status:', response.status, response.statusText);
        const result = await response.json();
        console.log('📥 Response data:', result);
        
        if (result.success || response.ok) {
          alert(`✅ Successfully imported ${result.imported_count || jsonData.length || 'unknown number of'} events!`);
          window.setShowImportModal && window.setShowImportModal(false);
          await window.fetchAllEvents(); // Refresh the events
        } else {
          throw new Error(result.error || result.message || 'Import failed');
        }
      } catch (error) {
        console.error('❌ Import processing error:', error);
        alert('Failed to process Excel file: ' + error.message);
      } finally {
        window.setLoading && window.setLoading(false);
      }
    };
    
    // Read the file as array buffer
    reader.readAsArrayBuffer(file);
    
  } catch (error) {
    console.error('❌ Import error:', error);
    alert('Failed to import events: ' + error.message);
    window.setLoading && window.setLoading(false);
  }
});

  // ✅ DELETE EVENT FUNCTION
  window.deleteEvent = handlers.deleteEvent || (async (eventId) => {
    console.log("📅 deleteEvent called with ID:", eventId);
    
    if (!window.hasPermission('events', 'delete')) {
      alert('You do not have permission to delete events');
      return;
    }
    
    try {
      window.setLoading && window.setLoading(true);
      
      const response = await window.apiCall(`/events/${eventId}`, {
        method: 'DELETE'
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Remove from local state
      window.sportsEvents = window.sportsEvents.filter(event => event.id !== eventId);
      window.appState.sportsEvents = window.sportsEvents;
      
      // Update React state if available
      if (state.setSportsEvents) {
        state.setSportsEvents(window.sportsEvents);
      }
      
      alert('✅ Event deleted successfully!');
      
    } catch (error) {
      console.error('❌ Error deleting event:', error);
      alert('❌ Error deleting event: ' + error.message);
    } finally {
      window.setLoading && window.setLoading(false);
    }
  });

 // ✅ EVENT FORM HANDLERS - FIXED WITH FORM DATA POPULATION
window.openEventForm = handlers.openEventForm || ((event = null) => {
  console.log("📅 openEventForm called with:", event?.title || event?.event_name || 'new event');
  
  // Set current event for editing (null for new event)
  window.setCurrentEvent(event);
  
  // ✅ FIX: Pre-populate form data when editing
  if (event && window.setEventFormData) {
    console.log("🔧 Pre-populating form data for edit:", event.event_name || event.title);
    window.setEventFormData({
      event_name: event.event_name || event.title || '',
      event_type: event.event_type || '',
      sport_type: event.sport_type || event.category || '',
      geography: event.geography || '',
      start_date: event.start_date || event.date || '',
      end_date: event.end_date || '',
      start_time: event.start_time || event.time || '',
      end_time: event.end_time || '',
      venue: event.venue || '',
      venue_capacity: event.venue_capacity || '',
      venue_address: event.venue_address || '',
      official_ticketing_partners: event.official_ticketing_partners || '',
      primary_source: event.primary_source || '',
      secondary_source: event.secondary_source || '',
      ticket_available: event.ticket_available || false,
      priority: event.priority || '',
      status: event.status || 'upcoming',
      sold_out_potential: event.sold_out_potential || '',
      remarks: event.remarks || '',
      fantopark_package: event.fantopark_package || '',
      description: event.description || ''
    });
  } else if (!event && window.setEventFormData) {
    // Reset form for new event
    console.log("🔧 Resetting form data for new event");
    window.setEventFormData({
      event_name: '',
      event_type: '',
      sport_type: '',
      geography: '',
      start_date: '',
      end_date: '',
      start_time: '',
      end_time: '',
      venue: '',
      venue_capacity: '',
      venue_address: '',
      official_ticketing_partners: '',
      primary_source: '',
      secondary_source: '',
      ticket_available: false,
      priority: '',
      status: 'upcoming',
      sold_out_potential: '',
      remarks: '',
      fantopark_package: '',
      description: ''
    });
  }
  
  // Show the event form
  window.setShowEventForm(true);
  
  console.log("✅ Event form opened with form data populated");
});

  window.closeEventForm = handlers.closeEventForm || (() => {
    console.log("📅 closeEventForm called");
    window.setShowEventForm(false);
    window.setCurrentEvent(null);
  });

  window.openEventDetail = handlers.openEventDetail || ((event) => {
    console.log("📅 openEventDetail called with:", event?.title || event?.event_name);
    
    // Set current event
    window.setCurrentEvent(event);
    
    // Show event detail modal
    window.setShowEventDetail(true);
    
    console.log("✅ Event detail opened");
  });

  window.closeEventDetail = handlers.closeEventDetail || (() => {
    console.log("📅 closeEventDetail called");
    window.setShowEventDetail(false);
    window.setCurrentEvent(null);
  });

  // Stadium Functions
  window.fetchStadiums = handlers.fetchStadiums || (() => {
    console.log("🏟️ fetchStadiums called");
    return new Promise((resolve, reject) => {
      if (handlers.fetchStadiums && typeof handlers.fetchStadiums === 'function') {
        return handlers.fetchStadiums().then(resolve).catch(reject);
      } else {
        console.warn("⚠️ fetchStadiums not implemented in handlers");
        window.stadiums = window.stadiums || [];
        resolve(window.stadiums);
      }
    });
  });

  window.openStadiumForm = handlers.openStadiumForm || ((stadium = null) => {
    console.log("🏟️ openStadiumForm called with:", stadium);
    state.setEditingStadium && state.setEditingStadium(stadium);
    state.setStadiumFormData && state.setStadiumFormData(stadium || {});
    state.setShowStadiumForm && state.setShowStadiumForm(true);
  });

  window.closeStadiumForm = handlers.closeStadiumForm || (() => {
    console.log("🏟️ closeStadiumForm called");
    state.setShowStadiumForm && state.setShowStadiumForm(false);
    state.setEditingStadium && state.setEditingStadium(null);
    state.setStadiumFormData && state.setStadiumFormData({});
  });

  // ✅ STADIUM FORM HANDLERS
  window.handleStadiumInputChange = (fieldName, value) => {
    console.log(`📝 Stadium field changed: ${fieldName} = ${value}`);
    const newFormData = { ...window.stadiumFormData, [fieldName]: value };
    window.stadiumFormData = newFormData;
    window.appState.stadiumFormData = newFormData;
    if (window.setStadiumFormData) {
      window.setStadiumFormData(newFormData);
    }
  };

  window.handleStadiumFormSubmit = async (e) => {
  e.preventDefault();
  
  try {
    window.setLoading(true);
    
    console.log('🏟️ Stadium form submission started');
    console.log('Editing stadium:', window.editingStadium);
    console.log('Form data:', window.stadiumFormData);
    
    // Prepare the data - include all fields including categorized notes
    const submitData = {
      ...window.stadiumFormData
    };
    
    if (!window.editingStadium || !window.editingStadium.id) {
      // CREATE NEW STADIUM
      console.log('Creating new stadium...');
      
      submitData.created_by = window.user?.name || 'Unknown User';
      submitData.created_date = new Date().toISOString();
      
      const response = await window.apiCall('/stadiums', {
        method: 'POST',
        body: JSON.stringify(submitData)
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Add to local state
      window.setStadiums(prev => [...prev, response.data || response]);
      alert('✅ Stadium created successfully!');
      
    } else {
      // UPDATE EXISTING STADIUM
      console.log('Updating existing stadium...');
      
      const response = await window.apiCall(`/stadiums/${window.editingStadium.id}`, {
        method: 'PUT',
        body: JSON.stringify(submitData)
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Update local state
      window.setStadiums(prev => prev.map(stadium => 
        stadium.id === window.editingStadium.id ? response.data : stadium
      ));
      
      alert('✅ Stadium updated successfully!');
    }
    
    // Close the form
    window.closeStadiumForm();
    
    // Refresh the stadiums list
    await window.fetchStadiums();
    
  } catch (error) {
    console.error('❌ Error saving stadium:', error);
    alert(`Error: ${error.message}`);
  } finally {
    window.setLoading(false);
  }
};

  // ✅ STADIUM CRUD FUNCTIONS
  window.handleDeleteStadium = async (stadiumId, stadiumName) => {
    console.log("🗑️ handleDeleteStadium called:", stadiumId, stadiumName);
    
    if (!window.hasPermission('stadiums', 'delete')) {
      alert('You do not have permission to delete stadiums');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete "${stadiumName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      window.setLoading(true);
      
      const response = await window.apiCall(`/stadiums/${stadiumId}`, {
        method: 'DELETE'
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Remove from local state
      window.setStadiums(prev => prev.filter(stadium => stadium.id !== stadiumId));
      
      alert('✅ Stadium deleted successfully!');
      
    } catch (error) {
      console.error('❌ Error deleting stadium:', error);
      alert('❌ Error deleting stadium: ' + error.message);
    } finally {
      window.setLoading(false);
    }
  };

  window.populateDefaultStadiums = async () => {
    console.log("🏟️ populateDefaultStadiums called");
    
    if (!window.hasPermission('stadiums', 'write')) {
      alert('You do not have permission to add stadiums');
      return;
    }
    
    const defaultStadiums = [
      {
        name: "Wankhede Stadium",
        city: "Mumbai",
        state: "Maharashtra", 
        country: "India",
        capacity: 33108,
        sport_type: "Cricket",
        opened_year: 1974,
        nickname: "Home of Indian Cricket"
      },
      {
        name: "Eden Gardens",
        city: "Kolkata",
        state: "West Bengal",
        country: "India", 
        capacity: 66000,
        sport_type: "Cricket",
        opened_year: 1864,
        nickname: "Cricket's Colosseum"
      },
      {
        name: "M. Chinnaswamy Stadium",
        city: "Bangalore",
        state: "Karnataka",
        country: "India",
        capacity: 40000,
        sport_type: "Cricket",
        opened_year: 1969
      },
      {
        name: "Camp Nou",
        city: "Barcelona",
        state: "Catalonia",
        country: "Spain",
        capacity: 99354,
        sport_type: "Football",
        opened_year: 1957,
        nickname: "Més que un club"
      },
      {
        name: "Wembley Stadium",
        city: "London",
        state: "England", 
        country: "United Kingdom",
        capacity: 90000,
        sport_type: "Football",
        opened_year: 2007,
        nickname: "The Home of Football"
      }
    ];
    
    try {
      window.setLoading(true);
      
      let addedCount = 0;
      for (const stadiumData of defaultStadiums) {
        // Check if stadium already exists
        const exists = window.stadiums.some(s => 
          s.name === stadiumData.name && s.city === stadiumData.city
        );
        
        if (!exists) {
          const response = await window.apiCall('/stadiums', {
            method: 'POST',
            body: JSON.stringify({
              ...stadiumData,
              created_by: window.user?.name || 'System',
              created_date: new Date().toISOString()
            })
          });
          
          if (!response.error) {
            window.setStadiums(prev => [...prev, response.data || response]);
            addedCount++;
          }
        }
      }
      
      if (addedCount > 0) {
        alert(`✅ Added ${addedCount} popular stadiums successfully!`);
      } else {
        alert('ℹ️ All popular stadiums are already in your database.');
      }
      
    } catch (error) {
      console.error('❌ Error adding default stadiums:', error);
      alert('❌ Error adding stadiums: ' + error.message);
    } finally {
      window.setLoading(false);
    }
  };

  // Client Management Functions
  window.fetchClients = handlers.fetchClients || (() => {
    console.log("👥 fetchClients called");
    return new Promise((resolve, reject) => {
      if (handlers.fetchClients && typeof handlers.fetchClients === 'function') {
        return handlers.fetchClients().then(resolve).catch(reject);
      } else {
        console.warn("⚠️ fetchClients not implemented in handlers");
        window.clients = window.clients || [];
        resolve(window.clients);
      }
    });
  });

  window.applyClientSuggestion = handlers.applyClientSuggestion || (() => {
    console.log("🎯 applyClientSuggestion called");
    
    if (window.clientSuggestion && window.setFormData) {
      window.setFormData(prev => ({
        ...prev,
        assigned_to: window.clientSuggestion.suggested_assigned_to
      }));
      
      window.setShowClientSuggestion && window.setShowClientSuggestion(false);
      
      console.log("✅ Applied client suggestion:", window.clientSuggestion.suggested_assigned_to);
    } else {
      console.warn("⚠️ No client suggestion available or setFormData not found");
    }
  });

  // Payment Form Handlers
  window.handlePaymentPostServiceSubmit = handlers.handlePaymentPostServiceSubmit || window.handlePaymentPostServiceSubmit;
  window.handlePaymentPostServiceInputChange = handlers.handlePaymentPostServiceInputChange || window.handlePaymentPostServiceInputChange;
  window.handlePaymentSubmit = handlers.handlePaymentSubmit || window.handlePaymentSubmit;
  window.handlePaymentInputChange = handlers.handlePaymentInputChange || window.handlePaymentInputChange;
  window.handleMarkPaymentFromReceivable = handlers.handleMarkPaymentFromReceivable || (() => {
  console.warn("handleMarkPaymentFromReceivable not implemented");
});

  // Bulk Operations Functions
  window.handleBulkAssignSubmit = handlers.handleBulkAssignSubmit || (() => {
    console.log("🚀 handleBulkAssignSubmit called");
    console.warn("⚠️ handleBulkAssignSubmit not implemented in handlers");
    alert("Bulk assign functionality will be implemented in next update!");
  });

  // CSV Upload Functions
  window.handlePreview = handlers.handlePreview || (() => {
    console.log("🔍 handlePreview called");
    console.warn("⚠️ handlePreview not implemented in handlers");
  });

  window.previewUpload = handlers.previewUpload || (() => {
    console.log("📋 previewUpload called");
    console.warn("⚠️ previewUpload not implemented in handlers");
  });

  window.handleUploadPreview = handlers.handleUploadPreview || (() => {
    console.log("📊 handleUploadPreview called");
    console.warn("⚠️ handleUploadPreview not implemented in handlers");
  });

  window.handlePreviewClick = handlers.handlePreviewClick || (() => {
    console.log("👆 handlePreviewClick called");
    console.warn("⚠️ handlePreviewClick not implemented in handlers");
  });

  window.handleProceedFromPreview = handlers.handleProceedFromPreview || (() => {
    console.log("🚀 handleProceedFromPreview called");
    
    window.setShowPreview(false);
    
    const file = window.currentUploadFile;
    if (!file) {
      alert('No file selected for upload');
      return;
    }
    
    console.log("📤 Starting upload process for:", file.name);
    
    const uploadFunction = async () => {
      try {
        window.setUploading && window.setUploading(true);
        
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${window.API_CONFIG.API_URL}/upload/leads/csv`, {
          method: 'POST',
          headers: {
            'Authorization': window.authToken ? 'Bearer ' + window.authToken : undefined
          },
          body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
          console.log("✅ Upload successful:", result);
          
          if (result.clientDetectionResults && result.clientDetectionResults.length > 0) {
            window.setClientDetectionResults(result.clientDetectionResults);
            window.setShowClientDetectionResults(true);
          }
          
         if (window.LeadsAPI && window.LeadsAPI.refresh) {
    window.LeadsAPI.refresh();
} else if (window.fetchLeads && typeof window.fetchLeads === 'function') {
    window.fetchLeads();
}
          
          alert(`✅ Upload completed!\n✅ Successfully imported: ${result.successCount} leads\n${result.clientDetectionCount ? `🔍 Existing clients found: ${result.clientDetectionCount}\n` : ''}${result.autoAssignmentCount ? `🎯 Auto-assignments: ${result.autoAssignmentCount}` : ''}`);
          
        } else {
          console.error("❌ Upload failed:", result);
          alert('Upload failed: ' + (result.error || 'Unknown error'));
        }
        
      } catch (error) {
        console.error("❌ Upload error:", error);
        alert('Upload error: ' + error.message);
      } finally {
        window.setUploading && window.setUploading(false);
      }
    };
    
    uploadFunction();
  });

  // Data Fetching Functions
  window.fetchUsers = handlers.fetchUsers || (() => {
    console.log("👥 fetchUsers called");
  });
  
  window.fetchLeads = handlers.fetchLeads || (() => {
    console.log("👥 fetchLeads called");
  });

  // ✅ FINANCIAL FUNCTIONS
  // DON'T override fetchFinancialData - it's implemented in enhanced-financial-system.js
  if (!window.fetchFinancialData) {
    window.fetchFinancialData = handlers.fetchFinancialData || (() => {
      console.log("💰 fetchFinancialData called");
      console.warn("⚠️ fetchFinancialData not implemented in handlers");
    });
  }

  // Status Filter Functions
  window.handleStatusFilterToggle = handlers.handleStatusFilterToggle;
  window.handleSelectAllStatuses = handlers.handleSelectAllStatuses;
  window.handleClearAllStatuses = handlers.handleClearAllStatuses;

  // Dashboard Functions
  window.chartInstances = state.chartInstances;
  window.calculateDashboardStats = handlers.calculateDashboardStats;

   // Core Lead Management Functions
  window.getStatusFilterDisplayText = handlers.getStatusFilterDisplayText;
  window.openLeadDetail = handlers.openLeadDetail;
  window.editLead = handlers.editLead;
  window.deleteLead = handlers.deleteLead;
  window.assignLead = handlers.assignLead;
  window.progressLead = handlers.progressLead;

  // ===== UTILITY FUNCTIONS =====

  window.getUserDisplayName = handlers.getUserDisplayName || window.getUserDisplayName;

  window.formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  window.getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    const statusColors = {
      'Available': 'bg-green-100 text-green-800',
      'Low Stock': 'bg-yellow-100 text-yellow-800', 
      'Sold Out': 'bg-red-100 text-red-800',
      'Coming Soon': 'bg-blue-100 text-blue-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  window.formatNumber = (number) => {
    if (number === null || number === undefined) return '0';
    return Number(number).toLocaleString();
  };
  
  window.getInventoryStatus = (item) => {
    if (!item) return 'Unknown';
    if (item.available_tickets <= 0) return 'Sold Out';
    if (item.available_tickets < 10) return 'Low Stock';
    return 'Available';
  };

  window.calculateMargin = (item) => {
    if (!item || !item.selling_price || !item.buying_price) return 0;
    return ((item.selling_price - item.buying_price) / item.selling_price * 100).toFixed(1);
  };

  window.getUserName = (email) => {
    if (!email) return 'Unknown';
    const user = window.users?.find(u => u.email === email);
    return user ? user.name : email.split('@')[0];
  };

  window.getInventoryDueInDays = (eventDate) => {
    const today = new Date();
    const event = new Date(eventDate);
    const diffTime = event - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  window.formatRelativeTime = (dateString) => {
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

  window.getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // ✅ SPORTS CALENDAR PRIORITY STYLES
  window.getPriorityStyles = window.getPriorityStyles || ((priority) => {
    switch (priority) {
      case 'P1':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'P2':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'P3':
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  });

  window.findClientByPhone = (phone) => {
    console.log("🔍 Looking for client with phone:", phone);
    
    if (!window.clients || !phone) {
      console.log("❌ No clients data or phone number provided");
      return null;
    }

    let foundClient = null;

    foundClient = window.clients.find(c => c.phone === phone);
    if (foundClient) {
      console.log("✅ Found client by direct phone match:", foundClient.name || foundClient.id);
      return foundClient;
    }

    foundClient = window.clients.find(c => 
      c.leads && Array.isArray(c.leads) && c.leads.some(l => l.phone === phone)
    );
    if (foundClient) {
      console.log("✅ Found client by leads phone match:", foundClient.name || foundClient.id);
      return foundClient;
    }

    foundClient = window.clients.find(c => c.client_phone === phone);
    if (foundClient) {
      console.log("✅ Found client by client_phone match:", foundClient.name || foundClient.id);
      return foundClient;
    }

    foundClient = window.clients.find(c => 
      (c.contact && c.contact.phone === phone) ||
      (c.contactInfo && c.contactInfo.phone === phone)
    );
    if (foundClient) {
      console.log("✅ Found client by nested contact phone:", foundClient.name || foundClient.id);
      return foundClient;
    }

    console.log("❌ Client not found for phone:", phone);
    console.log("📊 Available clients sample:", window.clients.slice(0, 2));
    return null;
  };

  // ===== INVENTORY PROCESSING FUNCTIONS =====

  window.currentInventoryItems = (() => {
    if (!window.inventory) return [];
    
    return window.inventory.filter(item => {
      if (window.inventoryDueDateFilter && window.inventoryDueDateFilter !== 'all') {
        const daysUntilEvent = window.getInventoryDueInDays(item.event_date);
        if (window.inventoryDueDateFilter === 'overdue' && daysUntilEvent >= 0) return false;
        if (window.inventoryDueDateFilter === 'today' && daysUntilEvent !== 0) return false;
        if (window.inventoryDueDateFilter === 'week' && (daysUntilEvent < 0 || daysUntilEvent > 7)) return false;
      }
      
      if (window.inventoryEventFilter && window.inventoryEventFilter !== 'all' && 
          item.event_name !== window.inventoryEventFilter) return false;
      
      if (window.inventoryEventTypeFilter && window.inventoryEventTypeFilter !== 'all' && 
          item.event_type !== window.inventoryEventTypeFilter) return false;
      
      return true;
    }).sort((a, b) => {
      const field = window.inventorySortField || 'event_date';
      const direction = window.inventorySortDirection || 'asc';
      
      let aVal = a[field];
      let bVal = b[field];
      
      if (field === 'event_date') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  })();

  window.updateCurrentInventoryItems = () => {
    window.currentInventoryItems = (() => {
      if (!window.inventory) return [];
      
      return window.inventory.filter(item => {
        if (window.inventoryDueDateFilter && window.inventoryDueDateFilter !== 'all') {
          const daysUntilEvent = window.getInventoryDueInDays(item.event_date);
          if (window.inventoryDueDateFilter === 'overdue' && daysUntilEvent >= 0) return false;
          if (window.inventoryDueDateFilter === 'today' && daysUntilEvent !== 0) return false;
          if (window.inventoryDueDateFilter === 'week' && (daysUntilEvent < 0 || daysUntilEvent > 7)) return false;
        }
        
        if (window.inventoryEventFilter && window.inventoryEventFilter !== 'all' && 
            item.event_name !== window.inventoryEventFilter) return false;
        
        if (window.inventoryEventTypeFilter && window.inventoryEventTypeFilter !== 'all' && 
            item.event_type !== window.inventoryEventTypeFilter) return false;
        
        return true;
      }).sort((a, b) => {
        const field = window.inventorySortField || 'event_date';
        const direction = window.inventorySortDirection || 'asc';
        
        let aVal = a[field];
        let bVal = b[field];
        
        if (field === 'event_date') {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        }
        
        if (direction === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    })();
  };

  // ===== API AND CONFIGURATION =====

  window.authToken = window.authToken || localStorage.getItem('crm_auth_token') || '';
  window.API_URL = window.API_URL || 'https://fantopark-backend-150582227311.us-central1.run.app/api';
  window.API_CONFIG = window.API_CONFIG || {
    API_URL: window.API_URL
  };

  window.checkPhoneForClient = handlers.checkPhoneForClient || ((phone) => {
    console.log("📞 checkPhoneForClient called with:", phone);
  });

  // ✅ CRITICAL MISSING: Allocation Management Functions
  window.handleUnallocate = handlers.handleUnallocate || ((allocationId, ticketsToReturn) => {
    console.log("🗑️ handleUnallocate called with:", allocationId, ticketsToReturn);
    console.warn("⚠️ handleUnallocate not implemented in handlers");
    alert("Unallocate functionality will be implemented in next update!");
  });

  // ===== PERMISSION SYSTEM =====

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
      //console.log('Module permissions not found:', module);
      return false;
    }

    const hasAccess = modulePermissions[action] === true;
    // Removed permission check logging for production
    return hasAccess;
  };

  const canAccessTab = (tabId) => {
    if (!state.user) return false;
    if (tabId === 'myactions') return true;
    if (tabId === 'reminders') return window.hasPermission('leads', 'read');
    if (tabId === 'sports-calendar') return window.hasPermission('leads', 'read');
    return window.hasPermission(tabId, 'read');
  };

  // ===== FORM CLOSE FUNCTION =====

  window.closeForm = () => {
    console.log("🔄 closeForm called - closing all forms");
    state.setShowLeadDetail && state.setShowLeadDetail(false);
    state.setShowEditForm && state.setShowEditForm(false);
    state.setShowAddForm && state.setShowAddForm(false);
    state.setShowAssignForm && state.setShowAssignForm(false);
    state.setShowPaymentForm && state.setShowPaymentForm(false);
    state.setShowPaymentPostServiceForm && state.setShowPaymentPostServiceForm(false);
    window.setShowInventoryForm(false);
    window.setShowEditInventoryForm(false);
    state.setShowAllocationForm && state.setShowAllocationForm(false);
    window.setShowAllocationManagement(false);
    window.setShowInventoryDetail(false);
    state.setShowDeliveryForm && state.setShowDeliveryForm(false);
    state.setShowChoiceModal && state.setShowChoiceModal(false);
    state.setShowStatusProgressModal && state.setShowStatusProgressModal(false);
    window.setShowOrderDetail(false);
    window.setShowEditOrderForm(false);
    window.setShowOrderAssignmentModal(false);
    window.setShowStadiumForm(false);
    // ✅ Sports Calendar modals
    window.setShowEventForm(false);
    window.setShowImportModal(false);
    window.setShowEventDetail(false);
    
    state.setFormData && state.setFormData({});
    state.setCurrentLead && state.setCurrentLead(null);
    state.setCurrentInventory && state.setCurrentInventory(null);
    state.setCurrentDelivery && state.setCurrentDelivery(null);
    state.setCurrentLeadForChoice && state.setCurrentLeadForChoice(null);
    state.setChoiceOptions && state.setChoiceOptions([]);
    state.setStatusProgressOptions && state.setStatusProgressOptions([]);
    window.setEditingInventory && window.setEditingInventory(null);
    window.setCurrentInventoryDetail && window.setCurrentInventoryDetail(null);
    window.setAllocationManagementInventory && window.setAllocationManagementInventory(null);
    window.setCurrentAllocations && window.setCurrentAllocations([]);
    window.setCurrentOrderDetail && window.setCurrentOrderDetail(null);
    window.setCurrentOrderForEdit && window.setCurrentOrderForEdit(null);
    window.setSelectedOrderForAssignment && window.setSelectedOrderForAssignment(null);
    window.setEditingStadium && window.setEditingStadium(null);
    window.showFinanceInvoiceModal && window.renderFinanceInvoiceModal()
    window.setStadiumFormData && window.setStadiumFormData({});
    // ✅ Sports Calendar data reset
    window.setCurrentEvent && window.setCurrentEvent(null);
  };

  // ✅ CRITICAL MISSING FUNCTIONS - Enhanced with State Sync
  window.closeInventoryForm = () => {
    console.log("🔄 closeInventoryForm called");
    window.setShowInventoryForm(false);
    window.setEditingInventory(null);
    window.setFormData && window.setFormData({});
  };

  window.closeEditInventoryForm = () => {
    console.log("🔄 closeEditInventoryForm called");
    window.setShowEditInventoryForm(false);
    window.setCurrentInventory(null);
    window.setFormData && window.setFormData({});
  };

  window.closeAllocationManagement = () => {
    console.log("🔄 closeAllocationManagement called");
    window.setShowAllocationManagement(false);
    window.setAllocationManagementInventory(null);
    window.setCurrentAllocations([]);
  };

  window.closeInventoryDetail = () => {
    console.log("🔄 closeInventoryDetail called");
    window.setShowInventoryDetail(false);
    window.setCurrentInventoryDetail(null);
  };

  // ===== FORM CONFIGURATIONS =====

  // ✅ STADIUM FORM FIELDS CONFIGURATION
  window.stadiumFormFields = [
    { name: 'name', label: 'Stadium Name', type: 'text', required: true, placeholder: 'e.g., Wankhede Stadium' },
    { name: 'nickname', label: 'Nickname', type: 'text', required: false, placeholder: 'e.g., Home of Cricket' },
    { name: 'city', label: 'City', type: 'text', required: true, placeholder: 'e.g., Mumbai' },
    { name: 'state', label: 'State/Province', type: 'text', required: false, placeholder: 'e.g., Maharashtra' },
    { name: 'country', label: 'Country', type: 'text', required: true, placeholder: 'e.g., India' },
    { name: 'capacity', label: 'Capacity', type: 'number', required: false, placeholder: 'Total seating capacity' },
    { name: 'sport_type', label: 'Primary Sport', type: 'select', required: true, options: ['Cricket', 'Football', 'Basketball', 'Tennis', 'Hockey', 'Formula 1', 'Multi-Sport', 'Other'] },
    { name: 'opened_year', label: 'Opened Year', type: 'number', required: false, placeholder: 'e.g., 1974' },
    { name: 'website', label: 'Official Website', type: 'url', required: false, placeholder: 'https://...' },
    { name: 'address', label: 'Address', type: 'textarea', required: false, placeholder: 'Full address of the stadium' },
    { name: 'description', label: 'Description', type: 'textarea', required: false, placeholder: 'Brief description or notable features' }
  ];

  // ✅ INVENTORY FORM CONFIGURATION
  window.inventoryFormFields = [
    { name: 'event_name', label: 'Event Name', type: 'text', required: true },
    { name: 'event_date', label: 'Event Date', type: 'date', required: true },
    { name: 'event_type', label: 'Event Type', type: 'select', options: ['IPL', 'India Cricket + ICC', 'Football', 'Tennis', 'F1', 'Miscellaneous'], required: true },
    { name: 'sports', label: 'Sports Category', type: 'select', options: ['Cricket', 'Football', 'Tennis', 'Formula 1', 'Olympics', 'Basketball', 'Badminton', 'Hockey', 'Golf', 'Wrestling', 'Miscellaneous'], required: true },
    { name: 'venue', label: 'Venue', type: 'select', options: 'dynamic', required: true },
    { name: 'day_of_match', label: 'Day of Match (for Test/Multi-day)', type: 'select', options: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Not Applicable'], required: false },
    { name: 'category_of_ticket', label: 'Category of Ticket', type: 'select', options: ['VIP', 'Premium', 'Gold', 'Silver', 'Bronze', 'General', 'Corporate Box', 'Hospitality'], required: true },
    { name: 'stand', label: 'Stand/Section', type: 'text', required: false, placeholder: 'e.g., North Stand, East Pavilion' },
    { name: 'total_tickets', label: 'Total Tickets', type: 'number', required: true },
    { name: 'available_tickets', label: 'Available Tickets', type: 'number', required: true },
    { name: 'mrp_of_ticket', label: 'MRP of Ticket (₹)', type: 'number', required: true },
    { name: 'buying_price', label: 'Buying Price (₹)', type: 'number', required: true },
    { name: 'selling_price', label: 'Selling Price (₹)', type: 'number', required: true },
    { name: 'inclusions', label: 'Inclusions', type: 'textarea', required: false, placeholder: 'e.g., Food, Beverages, Parking, Merchandise, Meet & Greet' },
    { name: 'booking_person', label: 'Booking Person (Who Purchased)', type: 'text', required: true, placeholder: 'Name of person/company who purchased inventory' },
    { name: 'procurement_type', label: 'Procurement Type', type: 'select', options: ['pre_inventory', 'on_demand', 'partnership', 'direct_booking'], required: true },
    { name: 'notes', label: 'Additional Notes', type: 'textarea', required: false, placeholder: 'Any special conditions, restrictions, or notes' },
   { name: 'paymentStatus', label: 'Payment Status', type: 'select', options: ['paid', 'partial', 'pending'], required: true },
    { name: 'supplierName', label: 'Supplier Name', type: 'text', required: false },
    { name: 'supplierInvoice', label: 'Supplier Invoice #', type: 'text', required: false },
    { name: 'purchasePrice', label: 'Purchase Price (per ticket)', type: 'number', required: false },
    { name: 'totalPurchaseAmount', label: 'Total Purchase Amount', type: 'number', required: false },
    { name: 'purchase_currency', label: 'Purchase Currency', type: 'select', options: ['INR', 'USD', 'EUR', 'GBP', 'AED', 'AUD'], required: false },
    { name: 'purchase_exchange_rate', label: 'Exchange Rate to INR', type: 'number', required: false },
    { name: 'amountPaid', label: 'Amount Paid', type: 'number', required: false },
    { name: 'paymentDueDate', label: 'Payment Due Date', type: 'date', required: false }
  ];
  // ✅ FORM DATA CHANGE HANDLER
  window.handleFormDataChange = (fieldName, value) => {
    console.log(`📝 Form field changed: ${fieldName} = ${value}`);
    if (window.setFormData) {
      window.setFormData(prev => ({
        ...prev,
        [fieldName]: value
      }));
    } else {
      console.warn("⚠️ setFormData not available");
    }
  };

  // ✅ FIXED FORM SUBMIT HANDLER
// ✅ FIXED FORM SUBMIT HANDLER
window.handleInventoryFormSubmit = async (e) => {
  e.preventDefault();
  
  try {
    window.setLoading(true);
    
    // Calculate and save INR values if using foreign currency
    const currency = window.formData.purchase_currency || 'INR';  // Fixed field name
    const exchangeRate = window.formData.purchase_exchange_rate || 1;  // Fixed field name
    
    console.log('=== CURRENCY CALCULATION DEBUG ===');
    console.log('Currency:', currency);
    console.log('Exchange Rate:', exchangeRate);
    
    if (currency !== 'INR') {
      // Update INR values for all categories
      const updatedCategories = (window.formData.categories || []).map(cat => ({
        ...cat,
        buying_price_inr: (parseFloat(cat.buying_price) || 0) * exchangeRate,
        selling_price_inr: (parseFloat(cat.selling_price) || 0) * exchangeRate
      }));
      
      window.formData.categories = updatedCategories;
      
      // Update totals in INR
      window.formData.totalPurchaseAmount_inr = (parseFloat(window.formData.totalPurchaseAmount) || 0) * exchangeRate;
      window.formData.amountPaid_inr = (parseFloat(window.formData.amountPaid) || 0) * exchangeRate;
      
      console.log('INR Calculations:', {
        totalPurchaseAmount_inr: window.formData.totalPurchaseAmount_inr,
        amountPaid_inr: window.formData.amountPaid_inr,
        categories: updatedCategories
      });
    }
    
    // Enhanced debug logging
    console.log('=== FRONTEND INVENTORY SUBMISSION DEBUG ===');
    console.log('Inventory ID:', window.editingInventory?.id);
    console.log('Complete form data being sent:', window.formData);
    console.log('Currency fields:', {
      purchase_currency: window.formData?.purchase_currency,
      purchase_exchange_rate: window.formData?.purchase_exchange_rate,
      totalPurchaseAmount: window.formData?.totalPurchaseAmount,
      totalPurchaseAmount_inr: window.formData?.totalPurchaseAmount_inr,
      amountPaid: window.formData?.amountPaid,
      amountPaid_inr: window.formData?.amountPaid_inr
    });
    console.log('Is from payables?', window.editingInventory?._payableContext?.fromPayables);
    console.log('Payable amount:', window.editingInventory?._payableContext?.payableAmount);
    
    if (!window.editingInventory?.id || window.editingInventory.id === null || window.editingInventory.id === undefined) {
      // CREATE NEW INVENTORY
      console.log('Creating new inventory item...');
      
      const response = await window.apiCall('/inventory', {
        method: 'POST',
        body: JSON.stringify({
          ...window.formData,
          created_by: window.user?.name || 'Unknown User',
          created_date: new Date().toISOString()
        })
      });
      
      console.log('Backend response:', response);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Add to local state
      window.setInventory(prev => [...prev, response.data || response]);
      alert('✅ Inventory created successfully!');
      
    } else {
      // UPDATE EXISTING INVENTORY
      console.log('Updating existing inventory...');
      
      const response = await window.apiCall(`/inventory/${window.editingInventory.id}`, {
        method: 'PUT',
        body: JSON.stringify(window.formData)
      });
      
      console.log('Backend response:', response);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Update local state
      window.setInventory(prev => prev.map(item => 
        item.id === window.editingInventory.id ? { ...item, ...window.formData } : item
      ));
      
      // Refresh financial data to show updated payables
      if (window.fetchFinancialData) {
        await window.fetchFinancialData();
      }
      
      alert('✅ Inventory updated successfully! Payables have been synced automatically.');
    }
    
    // Close the form
    window.closeInventoryForm();
    
  } catch (error) {
    console.error('❌ Error with inventory submission:', error);
    alert('❌ Error saving inventory: ' + error.message);
  } finally {
    window.setLoading(false);
  }
};

  console.log("✅ Original inventory form fields loaded:", window.inventoryFormFields.length, "fields");
  console.log("✅ Fixed inventory form submission - removed placeholder, added complete implementation");

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

  window.getFilteredLeads = getFilteredLeads;

  // ✅ FIXED: Add this function to your existing simplified-app-component.js
window.openInvoicePreview = handlers.openInvoicePreview || ((invoice) => {
  console.log("📄 openInvoicePreview called with:", invoice);
  
  if (!invoice) {
    console.error("❌ No invoice data provided");
    alert("No invoice data available");
    return;
  }

  console.log("📊 Invoice details:", {
    invoice_number: invoice.invoice_number,
    client_name: invoice.client_name || invoice.legal_name,
    final_amount: invoice.final_amount
  });

  // Set the invoice data in app state
  if (window.setCurrentInvoice && window.setShowInvoicePreview) {
    window.setCurrentInvoice(invoice);
    window.setShowInvoicePreview(true);
    console.log("✅ Invoice preview opened via app state");
  } else {
    // Fallback: Set directly on window for backward compatibility
    window.currentInvoice = invoice;
    window.showInvoicePreview = true;
    console.log("✅ Invoice preview opened via window fallback");
    
    // Force a re-render if the function is available
    if (window.forceRender) {
      window.forceRender();
    }
  }
});

  // ✅ SPORTS CALENDAR FALLBACK FUNCTION - Ensures always available
window.renderSportsCalendarContent = window.renderSportsCalendarContent || (() => {
  console.log("🔍 FALLBACK: renderSportsCalendarContent called");
  
  // Extract state with fallbacks
  const {
    sportsEvents = window.sportsEvents || [],
    selectedDate = window.selectedDate || new Date(),
    calendarView = window.calendarView || "month",
    calendarFilters = window.calendarFilters || {},
    showEventForm = window.appState?.showEventForm || false,
    showImportModal = window.appState?.showImportModal || false,
    currentEvent = window.appState?.currentEvent || null,
    showEventDetail = window.appState?.showEventDetail || false,
    loading = window.loading || false
  } = window.appState || {};

  // Extract functions with enhanced fallbacks
  const {
    setShowEventForm = window.setShowEventForm || ((show) => {
      console.log("🔍 setShowEventForm called:", show);
      window.showEventForm = show;
      window.appState.showEventForm = show;
    }),
    setShowImportModal = window.setShowImportModal || ((show) => {
      console.log("🔍 setShowImportModal called:", show);
      window.showImportModal = show;
      window.appState.showImportModal = show;
    }),
    setCurrentEvent = window.setCurrentEvent || ((event) => {
      console.log("🔍 setCurrentEvent called:", event);
      window.currentEvent = event;
      window.appState.currentEvent = event;
    }),
    setCalendarFilters = window.setCalendarFilters || ((filters) => {
      console.log("🔍 setCalendarFilters called:", filters);
      window.calendarFilters = { ...window.calendarFilters, ...filters };
      window.appState.calendarFilters = window.calendarFilters;
    }),
    fetchAllEvents = window.fetchAllEvents || (() => {
      console.log("🔍 fetchAllEvents called");
      console.warn("⚠️ fetchAllEvents not implemented");
    }),
    exportEventsToExcel = window.exportEventsToExcel || (() => {
      console.log("🔍 exportEventsToExcel called");
      console.warn("⚠️ exportEventsToExcel not implemented");
    })
  } = window;

  // Filter events
  const filteredEvents = sportsEvents.filter(event => {
    const eventDate = new Date(event.date || event.start_date);
    const selectedMonth = selectedDate.getMonth();
    const selectedYear = selectedDate.getFullYear();

    let passesFilter = true;

    // Date filter for month view
    if (calendarView === 'month') {
      passesFilter = eventDate.getMonth() === selectedMonth && eventDate.getFullYear() === selectedYear;
    }

    // Geography filter
    if (calendarFilters.geography && passesFilter) {
      passesFilter = event.geography === calendarFilters.geography;
    }

    // Sport type filter
    if (calendarFilters.sport_type && passesFilter) {
      passesFilter = event.sport_type === calendarFilters.sport_type || event.category === calendarFilters.sport_type;
    }

    // Priority filter
    if (calendarFilters.priority && passesFilter) {
      passesFilter = event.priority === calendarFilters.priority;
    }

    return passesFilter;
  });

  return React.createElement('div', { className: 'space-y-6' },
    // Header
    React.createElement('div', { className: 'flex justify-between items-center' },
      React.createElement('div', null,
        React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' }, '📅 Sports Calendar'),
        React.createElement('p', { className: 'text-gray-600 dark:text-gray-400 mt-1' }, 'Manage your sporting events with advanced filters and Excel integration'),
        React.createElement('div', { className: 'flex items-center mt-2 text-sm' },
          React.createElement('span', { 
            className: `px-2 py-1 rounded-full text-xs ${(sportsEvents || []).length > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`
          }, (sportsEvents || []).length > 0 ? `${filteredEvents.length}/${(sportsEvents || []).length} Events` : 'Loading Events...')
        )
      ),
      React.createElement('div', { className: 'flex flex-wrap gap-2' },
        React.createElement('button', {
          onClick: () => {
            console.log('🔍 Add Event button clicked');
            window.openEventForm();
          },
          className: 'bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2'
        }, 
          React.createElement('span', null, '➕'),
          'Add Event'
        ),
        React.createElement('button', {
          onClick: () => {
            console.log('🔍 Export Excel button clicked');
            exportEventsToExcel();
          },
          className: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2'
        }, 
          React.createElement('span', null, '📥'),
          'Export Excel'
        ),
        React.createElement('button', {
          onClick: () => {
            console.log('🔍 Import Excel button clicked');
            setShowImportModal(true);
          },
          className: 'bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2'
        }, 
          React.createElement('span', null, '📤'),
          'Import Excel'
        )
      )
    ),

    // Calendar Filters
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4' },
      React.createElement('h3', { className: 'text-lg font-semibold mb-3' }, '🔍 Filters'),
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-4' },
        // Geography Filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Geography'),
          React.createElement('select', {
            value: calendarFilters.geography || '',
            onChange: (e) => {
              console.log('🔍 Geography filter changed:', e.target.value);
              setCalendarFilters({...calendarFilters, geography: e.target.value});
            },
            className: 'w-full p-2 border border-gray-300 rounded-lg'
          },
            React.createElement('option', { value: '' }, 'All Locations'),
            React.createElement('option', { value: 'India' }, 'India'),
            React.createElement('option', { value: 'UAE - Dubai' }, 'UAE - Dubai'),
            React.createElement('option', { value: 'UK' }, 'UK'),
            React.createElement('option', { value: 'USA' }, 'USA'),
            React.createElement('option', { value: 'Australia' }, 'Australia')
          )
        ),
        // Sport Type Filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Sport Type'),
          React.createElement('select', {
            value: calendarFilters.sport_type || '',
            onChange: (e) => {
              console.log('🔍 Sport type filter changed:', e.target.value);
              setCalendarFilters({...calendarFilters, sport_type: e.target.value});
            },
            className: 'w-full p-2 border border-gray-300 rounded-lg'
          },
            React.createElement('option', { value: '' }, 'All Sports'),
            React.createElement('option', { value: 'Cricket' }, 'Cricket'),
            React.createElement('option', { value: 'Football' }, 'Football'),
            React.createElement('option', { value: 'Tennis' }, 'Tennis'),
            React.createElement('option', { value: 'Golf' }, 'Golf'),
            React.createElement('option', { value: 'Formula 1' }, 'Formula 1'),
            React.createElement('option', { value: 'Basketball' }, 'Basketball')
          )
        ),
        // Priority Filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Priority'),
          React.createElement('select', {
            value: calendarFilters.priority || '',
            onChange: (e) => {
              console.log('🔍 Priority filter changed:', e.target.value);
              setCalendarFilters({...calendarFilters, priority: e.target.value});
            },
            className: 'w-full p-2 border border-gray-300 rounded-lg'
          },
            React.createElement('option', { value: '' }, 'All Priorities'),
            React.createElement('option', { value: 'P1' }, 'P1 - High'),
            React.createElement('option', { value: 'P2' }, 'P2 - Medium'),
            React.createElement('option', { value: 'P3' }, 'P3 - Low')
          )
        ),
        // Reset Filters Button
        React.createElement('div', { className: 'flex items-end' },
          React.createElement('button', {
            onClick: () => {
              console.log('🔍 Reset filters clicked');
              setCalendarFilters({
                geography: '',
                sport_type: '',
                priority: ''
              });
            },
            className: 'w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg'
          }, 'Reset Filters')
        )
      )
    ),

    // Basic Events List
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-4' },
      React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 'Events'),
      filteredEvents.length > 0 ? 
        React.createElement('div', { className: 'space-y-2' },
          filteredEvents.map(event =>
            React.createElement('div', { 
              key: event.id,
              className: 'p-3 border border-gray-200 rounded-lg hover:bg-gray-50'
            },
              React.createElement('div', { className: 'flex justify-between items-start' },
                React.createElement('div', null,
                  React.createElement('h4', { className: 'font-medium' }, event.event_name || event.title),
                  React.createElement('p', { className: 'text-sm text-gray-500' }, event.venue),
                  React.createElement('p', { className: 'text-sm text-gray-500' }, 
                    new Date(event.start_date || event.date).toLocaleDateString()
                  )
                ),
                React.createElement('div', { className: 'flex gap-2' },
                  React.createElement('button', {
                    onClick: () => {
                      console.log('🔍 Edit event clicked:', event.event_name || event.title);
                      window.openEventForm(event);
                    },
                    className: 'text-indigo-600 hover:text-indigo-900 text-sm'
                  }, 'Edit'),
                  React.createElement('button', {
                    onClick: () => {
                      console.log('🔍 Delete event clicked:', event.event_name || event.title);
                      if (confirm('Delete this event?')) {
                        window.deleteEvent(event.id);
                      }
                    },
                    className: 'text-red-600 hover:text-red-900 text-sm'
                  }, 'Delete')
                )
              )
            )
          )
        ) :
        React.createElement('div', { className: 'text-center py-8 text-gray-500' },
          'No events found for the selected filters'
        )
    )
  );
});

  // ===== RENDER FUNCTIONS =====

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
 const renderSidebar = () => {
  const menuGroups = [
    {
      name: 'Main Operations',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'leads', label: 'Leads', icon: '👥' },
        { id: 'inventory', label: 'Inventory', icon: '🎫' },
        { id: 'orders', label: 'Orders', icon: '📋' },
        { id: 'delivery', label: 'Delivery', icon: '🚚' }
      ]
    },
    {
      name: 'Finance & Analytics',
      items: [
        { id: 'finance', label: 'Financials', icon: '💰' },
        { id: 'sales-performance', label: 'Sales Performance', icon: '📈' }
      ]
    },
    {
      name: 'Settings & Configuration',
      items: [
        { id: 'stadiums', label: 'Stadiums', icon: '🏟️' },
        { id: 'sports-calendar', label: 'Sports Calendar', icon: '📅' },
        { id: 'assignment-rules', label: 'Assignment Rules', icon: '⚙️' }
      ]
    },
    {
      name: 'Personal',
      items: [
        { id: 'myactions', label: 'My Actions', icon: '📌' },
        { id: 'reminders', label: 'Reminders', icon: '🔔' }
      ]
    }
  ];

  return React.createElement('div', { className: 'w-64 bg-white shadow-lg overflow-y-auto' },
    React.createElement('div', { className: 'p-4' },
      React.createElement('div', { className: 'flex items-center space-x-3' },
        React.createElement('div', { className: 'w-12 h-8 bg-white rounded flex items-center justify-center p-1 shadow-sm border' },
          React.createElement('img', { 
            src: 'images/logo.png',
            alt: 'FanToPark Logo',
            className: 'w-full h-full object-contain',
            onError: (e) => {
              e.target.style.display = 'none';
              e.target.parentElement.className = 'w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center';
              e.target.parentElement.innerHTML = '<span class="text-white text-lg">🏆</span>';
            }
          })
        ),
        React.createElement('h2', { className: 'text-xl font-bold text-gray-900 dark:text-white' }, 'FanToPark CRM')
      ),
      state.user && React.createElement('div', { className: 'mt-4 p-3 bg-blue-50 rounded-lg' },
        React.createElement('div', { className: 'text-sm font-medium text-blue-900' }, state.user.name),
        React.createElement('div', { className: 'text-xs text-blue-600' }, window.USER_ROLES[state.user.role]?.label || state.user.role),
        React.createElement('div', { className: 'text-xs text-blue-500' }, state.user.department)
      )
    ),
    React.createElement('nav', { className: 'mt-8 pb-4' },
      // Grouped menu items
      menuGroups.map(group =>
        React.createElement('div', { key: group.name, className: 'mb-6' },
          React.createElement('h3', { 
            className: 'px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2' 
          }, group.name),
          React.createElement('div', { className: 'space-y-1' },
            group.items.filter(item => canAccessTab(item.id)).map(item =>
              React.createElement('button', {
                key: item.id,
                onClick: () => { 
                  state.setActiveTab(item.id); 
                  if(item.id === 'leads') state.setViewMode('leads'); 
                },
                className: 'w-full flex items-center px-4 py-2 text-sm rounded-md transition-colors ' + 
                  (state.activeTab === item.id 
                    ? 'bg-blue-50 border-r-2 border-blue-600 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50')
              },
                React.createElement('span', { className: 'mr-3' }, item.icon),
                item.label
              )
            )
          )
        )
      ),
      // System section
      React.createElement('div', { className: 'mt-6 pt-6 border-t border-gray-200' },
        React.createElement('h3', { 
          className: 'px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2' 
        }, 'System'),
        React.createElement('div', { className: 'space-y-1' },
          window.hasPermission('users', 'read') && React.createElement('button', {
            onClick: handlers.openUserManagement,
            className: 'w-full flex items-center px-4 py-2 text-sm rounded-md transition-colors text-gray-700 hover:bg-gray-50'
          },
            React.createElement('span', { className: 'mr-3' }, '👤'),
            'User Management'
          ),
          state.user && state.user.role === 'super_admin' && React.createElement('button', {
            onClick: () => state.setActiveTab('roles'),
            className: 'w-full flex items-center px-4 py-2 text-sm rounded-md transition-colors text-gray-700 hover:bg-gray-50'
          },
            React.createElement('span', { className: 'mr-3' }, '🛡️'),
            'Role Management'
          ),
          React.createElement('button', {
            onClick: (e) => {
              e.preventDefault();
              window.setActiveTab('changePassword');
            },
            className: 'w-full flex items-center px-4 py-2 text-sm rounded-md transition-colors ' +
              (state.activeTab === 'changePassword' 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'text-gray-700 hover:bg-gray-100')
          },
            React.createElement('span', { className: 'mr-3' }, '🔐'),
            'Change Password'
          )
        )
      )
    ),
    React.createElement('div', { className: 'mt-auto p-4 border-t border-gray-200' },
      React.createElement('button', {
        onClick: handlers.handleLogout,
        className: 'w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded'
      },
        React.createElement('span', { className: 'mr-3' }, '🚪'),
        'Logout'
      )
    )
  );
};

  // ✅ ENHANCED Assignment Rules Tab with better error handling
const AssignmentRulesTab = React.useMemo(() => {
  console.log("🔍 AssignmentRulesTab rendering - user:", state.user?.role);
  console.log("🔍 Has assign permission:", window.hasPermission('leads', 'assign'));
  
  if (!window.AssignmentRulesManager) {
    console.error("❌ AssignmentRulesManager component not found");
    return React.createElement('div', { className: 'text-center py-12' },
      React.createElement('p', { className: 'text-red-500 text-lg' }, 'Assignment Rules component not loaded properly.')
    );
  }
  
  return window.hasPermission('leads', 'assign') ?
    React.createElement(window.AssignmentRulesManager, { 
      key: 'assignment-rules-component',
      currentUser: state.user 
    }) :
    React.createElement('div', { className: 'text-center py-12' },
      React.createElement('p', { className: 'text-red-500 text-lg' }, 'Access Denied: You do not have permission to manage assignment rules.')
    );
}, [state.user]);

// ✅ Expose AssignmentRulesTab to window with debugging
window.AssignmentRulesTab = AssignmentRulesTab;
console.log("✅ AssignmentRulesTab exposed to window");

  // ===== MAIN RENDER LOGIC =====

  if (!state.isLoggedIn) {
    return React.createElement('div', { className: 'min-h-screen bg-gray-100 flex items-center justify-center'},
      React.createElement('div', { className: 'max-w-md w-full bg-white rounded-lg shadow-md p-6' },
        React.createElement('div', { className: 'text-center mb-8' },
         React.createElement('div', { className: 'w-16 h-16 bg-white rounded-lg flex items-center justify-center mx-auto mb-4 p-2 shadow-md border' },
  React.createElement('img', { 
    src: 'images/logo.png',
    alt: 'FanToPark Logo',
    className: 'w-full h-full object-contain',
    onError: (e) => {
      // Fallback if logo doesn't load
      e.target.style.display = 'none';
      e.target.parentElement.innerHTML = '<span class="text-blue-600 text-2xl">🏆</span>';
    }
  })
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
     //   React.createElement('div', { className: 'mt-6 text-sm text-gray-600' },
       //   React.createElement('p', { className: 'font-medium mb-2' }, 'Demo Accounts:'),
         // React.createElement('div', { className: 'space-y-1 text-xs' },
           // React.createElement('p', null, React.createElement('strong', null, 'Super Admin:'), ' admin@fantopark.com / admin123'),
            //React.createElement('p', null, React.createElement('strong', null, 'Sales Manager:'), ' varun@fantopark.com / sales123'),
            //React.createElement('p', null, React.createElement('strong', null, 'Sales Executive:'), ' pratik@fantopark.com / sales123'),
            //React.createElement('p', null, React.createElement('strong', null, 'Supply Manager:'), ' akshay@fantopark.com / supply123'),
            //React.createElement('p', null, React.createElement('strong', null, 'Finance Manager:'), ' finance@fantopark.com / finance123')
         // )
       // )
      )
    );
  }

  // Check if mobile view
  const isMobile = window.innerWidth <= 768;
  
  // Add resize listener to update view
  React.useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth <= 768;
      if (newIsMobile !== isMobile) {
        window.forceUpdate && window.forceUpdate();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Main application layout
  return React.createElement('div', { className: isMobile ? 'min-h-screen bg-gray-50 dark:bg-gray-900' : 'flex h-screen bg-gray-100 dark:bg-gray-900' },
    state.isLoggedIn && state.user && React.createElement(window.BirthdayCheck, { user: state.user }),
    
    // Mobile Layout
    isMobile && state.isLoggedIn ? React.createElement(React.Fragment, null,
      // Mobile Header
      window.MobileHeader && React.createElement(window.MobileHeader),
      
      // Mobile Main Content
      React.createElement('main', { className: 'mobile-main-content' },
        window.MobileSweetsContent ? 
          React.createElement(window.MobileSweetsContent) : 
          window.renderContent()
      ),
      
      // Mobile Bottom Navigation
      window.MobileBottomNavigation && React.createElement(window.MobileBottomNavigation),
      
      // Mobile FAB
      window.MobileFAB && React.createElement(window.MobileFAB),
      
      // Mobile More Menu
      window.MobileMoreMenu && React.createElement(window.MobileMoreMenu),
      
      // Mobile Filter Sheet
      window.renderMobileFilterSheet && window.renderMobileFilterSheet()
    ) :
    // Desktop Layout
    React.createElement(React.Fragment, null,
      renderSidebar(),
      React.createElement('div', { className: 'flex-1 flex flex-col overflow-hidden' },
        React.createElement('header', { className: 'bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 px-6 py-2' },
  React.createElement('div', { className: 'flex items-center justify-between' },
    // Left section - Welcome message
    React.createElement('div', { className: 'flex items-center flex-shrink-0 min-w-[200px]' },
      React.createElement('button', {
        className: 'lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded mr-4',
        onClick: () => window.toggleMobileMenu && window.toggleMobileMenu()
      },
        React.createElement('svg', {
          width: '24',
          height: '24',
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '2'
        },
          React.createElement('path', { d: 'M3 12h18M3 6h18M3 18h18' })
        )
      ),
      React.createElement('div', null,
        React.createElement('h1', { className: 'text-lg font-semibold' }, 'Welcome, ' + (state.user?.name || 'Admin User')),
        React.createElement('p', { className: 'text-sm text-gray-600 dark:text-gray-400' }, window.USER_ROLES[state.user?.role]?.label + ' • ' + state.user?.department)
      )
    ),
    
    // Middle section - Tickers in pyramid style (centered)
    React.createElement('div', { className: 'flex-1 flex justify-center items-center' },
      React.createElement('div', { className: 'flex flex-col items-center gap-1' },
        // Currency ticker - narrower
        React.createElement('div', { className: 'max-w-lg' },
          window.renderCurrencyTicker && window.renderCurrencyTicker()
        ),
        // Daily summary ticker - wider
        React.createElement('div', { className: 'max-w-3xl' },
          window.renderDailySummaryTicker && window.renderDailySummaryTicker()
        )
      )
    ),
    
    // Right section - Icons (flex-shrink-0 prevents them from disappearing)
    React.createElement('div', { className: 'flex items-center space-x-4 flex-shrink-0 min-w-[200px] justify-end' },
      React.createElement('span', { className: 'text-lg' }, '🔔'),
      React.createElement('button', {
        onClick: () => state.setShowHelpGuide(true),
        className: 'p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
        title: 'How to use CRM'
      }, '❓'),
      React.createElement('button', {
        onClick: () => {
          // Toggle the state
          const newDarkMode = !state.darkMode;
          state.setDarkMode(newDarkMode);
          
          // Immediately update DOM and localStorage as a fallback
          // This ensures the change happens even if useEffect doesn't trigger
          if (newDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('crm_dark_mode', 'true');
          } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('crm_dark_mode', 'false');
          }
          
          // Also update the global window state for consistency
          window.darkMode = newDarkMode;
          window.appState.darkMode = newDarkMode;
        },
        className: 'p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
        title: state.darkMode ? 'Switch to light mode' : 'Switch to dark mode'
      }, state.darkMode ? '☀️' : '🌙'),
      React.createElement('div', { className: 'w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center' },
        React.createElement('span', { className: 'text-white text-sm' }, (state.user?.name || 'A')[0])
      )
    )
  )
),
        React.createElement('main', { className: 'flex-1 overflow-y-auto p-6' },
          window.renderContent()
        )
      )
    )),

    // All Modal Forms
    window.renderReminderDashboard && window.renderReminderDashboard(),
    window.renderReminderForm && window.renderReminderForm(),                         
    window.renderInventoryForm && window.renderInventoryForm(),
    window.renderForm && window.renderForm(),
    state.showCSVUploadModal && React.createElement(window.CSVUploadModal, {
      isOpen: state.showCSVUploadModal,
      onClose: () => {
        state.setShowCSVUploadModal(false);
        state.setCSVUploadType('');
      },
      type: state.csvUploadType,
      authToken: window.authToken
    }),
    window.renderAssignForm && window.renderAssignForm(),
    window.renderBulkAssignModal && window.renderBulkAssignModal(),
    window.showPaymentForm && !paymentData?.is_proforma && window.renderPaymentForm(),
    window.showFinanceInvoiceModal && window.renderFinanceInvoiceModal && window.renderFinanceInvoiceModal(),                         
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
    window.PaymentHistoryModal && React.createElement(window.PaymentHistoryModal),                         
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
    state.showEventForm && window.renderEventFormModal && window.renderEventFormModal(),
    window.renderQuoteUploadModal && window.renderQuoteUploadModal()
  );
}; // End of SimplifiedApp function

// SIMPLE MOBILE RESPONSIVE FIX
// Add this to the bottom of your simplified-app-component.js file

// Mobile styles - add these styles to make your app responsive
const mobileStyles = `
    /* Mobile Navigation */
    @media (max-width: 1024px) {
        /* Hide sidebar on mobile by default */
        .sidebar {
            position: fixed;
            left: -100%;
            top: 0;
            height: 100vh;
            width: 250px;
            transition: left 0.3s ease;
            z-index: 50;
        }
        
        /* Show sidebar when menu is open */
        .sidebar.open {
            left: 0;
        }
        
        /* Mobile overlay */
        .mobile-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 40;
        }
        
        .mobile-overlay.show {
            display: block;
        }
        
        /* Main content takes full width on mobile */
        .main-content {
            margin-left: 0 !important;
            padding-top: 60px; /* Space for mobile header */
        }
        
        /* Mobile header */
        .mobile-header {
            display: flex;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: white;
            border-bottom: 1px solid #e5e7eb;
            align-items: center;
            padding: 0 1rem;
            z-index: 30;
        }
        
        /* Tables - make them scrollable */
        .table-container {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
        }
        
        table {
            min-width: 600px;
        }
        
        /* Responsive grid */
        .grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
        }
        
        /* Responsive padding */
        .p-6 {
            padding: 1rem !important;
        }
        
        /* Stack filters vertically */
        .filters-grid {
            grid-template-columns: 1fr !important;
        }
    }
    
    /* Desktop - show sidebar */
    @media (min-width: 1025px) {
        .mobile-header {
            display: none !important;
        }
        
        .mobile-overlay {
            display: none !important;
        }
        
        .sidebar {
            position: static !important;
            left: 0 !important;
        }
    }
`;

// Add styles to document
if (!document.getElementById('mobile-responsive-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'mobile-responsive-styles';
    styleSheet.textContent = mobileStyles;
    document.head.appendChild(styleSheet);
}

// Simple mobile menu toggle function with close button
// Add this to your simplified-app-component.js file

// UPDATE your existing toggleMobileMenu function
window.toggleMobileMenu = function() {
    const sidebar = document.querySelector('.w-64.bg-white, .w-64.bg-gray-800');
    const overlay = document.getElementById('mobile-overlay');
    
    if (sidebar) {
        const isOpen = sidebar.classList.contains('mobile-open');
        
        if (!isOpen) {
            // Opening sidebar
            sidebar.classList.add('mobile-open');
            if (overlay) {
                overlay.classList.add('show');
            }
            document.body.style.overflow = 'hidden'; // Prevent body scroll when menu open
            
            // Add close button if it doesn't exist
            if (!sidebar.querySelector('.mobile-close-btn')) {
                const closeBtn = document.createElement('button');
                closeBtn.className = 'mobile-close-btn';
                closeBtn.innerHTML = '✕';
                closeBtn.style.cssText = `
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    width: 32px;
                    height: 32px;
                    background: #f3f4f6;
                    border: none;
                    border-radius: 4px;
                    font-size: 20px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 100;
                    color: #374151;
                `;
                closeBtn.onclick = function() {
                    sidebar.classList.remove('mobile-open');
                    if (overlay) {
                        overlay.classList.remove('show');
                    }
                    document.body.style.overflow = ''; // Restore body scroll
                };
                sidebar.insertBefore(closeBtn, sidebar.firstChild);
            }
        } else {
            // Closing sidebar
            sidebar.classList.remove('mobile-open');
            if (overlay) {
                overlay.classList.remove('show');
            }
            document.body.style.overflow = ''; // Restore body scroll
        }
    }
};

// Additional function to ensure horizontal scroll is prevented
window.preventHorizontalScroll = function() {
    // This function runs periodically to catch any dynamic content
    if (window.innerWidth <= 768) {
        // Find all elements that might be causing horizontal scroll
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.right > window.innerWidth || rect.left < 0) {
                console.warn('Element causing horizontal scroll:', el);
                el.style.maxWidth = '100%';
                el.style.overflowX = 'hidden';
            }
        });
        
        // Double-check specific problematic elements
        const problematicSelectors = [
            '.overflow-x-auto',
            'table',
            '.flex',
            '.grid',
            '[class*="w-full"]'
        ];
        
        problematicSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (el.offsetWidth > window.innerWidth) {
                    el.style.maxWidth = '100vw';
                    el.style.overflowX = 'auto';
                }
            });
        });
    }
};

// Run the horizontal scroll prevention
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.preventHorizontalScroll);
} else {
    window.preventHorizontalScroll();
}

// Run it again after a delay to catch dynamic content
setTimeout(window.preventHorizontalScroll, 500);
setTimeout(window.preventHorizontalScroll, 1500);

// Also run on window resize
window.addEventListener('resize', window.preventHorizontalScroll);

// Update your mobile header function to ensure overlay is clickable
window.addMobileHeader = function() {
    const oldSimplifiedApp = window.SimplifiedApp;
    
    window.SimplifiedApp = function() {
        const result = oldSimplifiedApp();
        
        if (!result || !window.appState.isLoggedIn) return result;
        
        // Wrap the existing content and add mobile header
        return React.createElement('div', null,
            // Mobile Header
            React.createElement('div', { className: 'mobile-header lg:hidden' },
                React.createElement('button', {
                    onClick: window.toggleMobileMenu,
                    className: 'p-2 hover:bg-gray-100 rounded'
                },
                    React.createElement('svg', {
                        width: '24',
                        height: '24',
                        viewBox: '0 0 24 24',
                        fill: 'none',
                        stroke: 'currentColor',
                        strokeWidth: '2'
                    },
                        React.createElement('path', {
                            d: 'M3 12h18M3 6h18M3 18h18'
                        })
                    )
                ),
                React.createElement('h1', { className: 'text-lg font-semibold flex-1 text-center' }, 
                    'FanToPark CRM'
                ),
                React.createElement('div', { className: 'w-10' }) // Spacer for balance
            ),
            
            // Mobile Overlay - clickable to close menu
            React.createElement('div', {
                id: 'mobile-overlay',
                className: 'mobile-overlay',
                onClick: window.toggleMobileMenu
            }),
            
            // Original content
            result
        );
    };
};

// Update your SimplifiedApp component to add mobile header
window.addMobileHeader = function() {
    const oldSimplifiedApp = window.SimplifiedApp;
    
    window.SimplifiedApp = function() {
        const result = oldSimplifiedApp();
        
        if (!result || !window.appState.isLoggedIn) return result;
        
        // Wrap the existing content and add mobile header
        return React.createElement('div', null,
            // Mobile Header
            React.createElement('div', { className: 'mobile-header lg:hidden' },
                React.createElement('button', {
                    onClick: window.toggleMobileMenu,
                    className: 'p-2 hover:bg-gray-100 rounded'
                },
                    React.createElement('svg', {
                        width: '24',
                        height: '24',
                        viewBox: '0 0 24 24',
                        fill: 'none',
                        stroke: 'currentColor',
                        strokeWidth: '2'
                    },
                        React.createElement('path', {
                            d: 'M3 12h18M3 6h18M3 18h18'
                        })
                    )
                ),
                React.createElement('h1', { className: 'text-lg font-semibold flex-1 text-center' }, 
                    'FanToPark CRM'
                ),
                React.createElement('div', { className: 'w-10' }) // Spacer for balance
            ),
            
            // Mobile Overlay
            React.createElement('div', {
    id: 'mobile-overlay',
    className: 'mobile-overlay',
    onClick: window.toggleMobileMenu  // Make sure this line is present
}),
            
            // Original content
            result
        );
    };
};

// Add necessary classes to existing elements
window.addResponsiveClasses = function() {
    // Add sidebar class
    const sidebar = document.querySelector('.w-64.bg-white');
    if (sidebar) {
        sidebar.classList.add('sidebar');
    }
    
    // Add main-content class
    const mainContent = document.querySelector('.flex-1.overflow-auto');
    if (mainContent) {
        mainContent.classList.add('main-content');
    }
    
    // Add table-container class to tables
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
        if (!table.parentElement.classList.contains('table-container')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'table-container';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        }
    });
    
    // Add grid class to dashboard cards
    const dashboardCards = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.xl\\:grid-cols-5');
    if (dashboardCards) {
        dashboardCards.classList.add('grid');
    }
};

// Initialize mobile responsive design
window.initializeMobileResponsive = function() {
    console.log('🔄 Initializing simple mobile responsive design...');
    
    // Add mobile header wrapper
    window.addMobileHeader();
    
    // Add responsive classes after a short delay
    setTimeout(() => {
        window.addResponsiveClasses();
        
        // Re-apply classes on route changes
        const observer = new MutationObserver(() => {
            window.addResponsiveClasses();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }, 1000);
    
    // Force re-render
    if (window.renderApp) {
        window.renderApp();
    }
    
    console.log('✅ Simple mobile responsive design initialized');
};

// Auto-initialize when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initializeMobileResponsive);
} else {
    window.initializeMobileResponsive();
}

// Add helper functions for inventory expansion
window.toggleInventoryExpansion = (inventoryId) => {
  console.log("🔄 Toggling expansion for inventory:", inventoryId);
  window.setExpandedInventoryItems(prev => {
    const newSet = new Set(prev);
    if (newSet.has(inventoryId)) {
      newSet.delete(inventoryId);
      console.log("➖ Collapsed inventory:", inventoryId);
    } else {
      newSet.add(inventoryId);
      console.log("➕ Expanded inventory:", inventoryId);
    }
    return newSet;
  });
  
  // Force re-render by triggering a state update
  if (window.setLoading) {
    window.setLoading(true);
    setTimeout(() => window.setLoading(false), 0);
  }
};

window.debugInventoryCategories = (inventoryId) => {
  const item = window.inventory.find(i => i.id === inventoryId);
  console.log('Item:', item);
  console.log('Has categories:', item?.categories);
  console.log('Is expanded:', window.isInventoryExpanded(inventoryId));
};

// Add helper to check if an item is expanded
window.isInventoryExpanded = (inventoryId) => {
  return window.expandedInventoryItems && window.expandedInventoryItems.has(inventoryId);
};

// Run on resize
window.addEventListener('resize', window.hideTickersOnMobile);

console.log("✅ Inventory expansion helpers loaded");
