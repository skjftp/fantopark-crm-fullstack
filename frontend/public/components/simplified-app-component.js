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
  
  // ✅ NEW: togglePremiumStatus function exposure - ADDED
  window.togglePremiumStatus = handlers.togglePremiumStatus || ((leadId, isPremium) => {
    console.log("⭐ togglePremiumStatus called:", leadId, isPremium);
    console.warn("⚠️ togglePremiumStatus not implemented in handlers");
  });
  
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

  // ✅ CRITICAL: handleChoiceSelection function exposure - MISSING AND NOW FIXED
  window.handleChoiceSelection = handlers.handleChoiceSelection || ((choice) => {
    console.log("🎯 handleChoiceSelection called with:", choice);
    console.warn("⚠️ handleChoiceSelection not implemented in handlers");
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

  // ✅ MISSING UTILITY FUNCTION EXPOSURES - NEWLY ADDED
window.formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
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

// ✅ NEW: Add these missing function exposures
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

  // ✅ INVENTORY FUNCTION EXPOSURES - NEWLY ADDED
window.openInventoryDetail = handlers.openInventoryDetail || ((inventory) => {
  console.log("📦 openInventoryDetail called with:", inventory);
  state.setCurrentInventoryDetail && state.setCurrentInventoryDetail(inventory);
  state.setShowInventoryDetail && state.setShowInventoryDetail(true);
});

window.openEditInventoryForm = handlers.openEditInventoryForm || ((inventory) => {
  console.log("✏️ openEditInventoryForm called with:", inventory);
  state.setCurrentInventory && state.setCurrentInventory(inventory);
  state.setShowEditInventoryForm && state.setShowEditInventoryForm(true);
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

window.openAddInventoryForm = handlers.openAddInventoryForm || (() => {
  console.log("➕ openAddInventoryForm called");
  state.setShowInventoryForm && state.setShowInventoryForm(true);
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

  // ✅ CRITICAL FIX: MISSING LEADS FILTER STATE VARIABLES - NEWLY ADDED
  window.appState.searchQuery = state.searchQuery || '';
  window.appState.leadsSourceFilter = state.leadsSourceFilter || 'all';
  window.appState.leadsBusinessTypeFilter = state.leadsBusinessTypeFilter || 'all';
  window.appState.leadsEventFilter = state.leadsEventFilter || 'all';
  window.appState.leadsSortField = state.leadsSortField || 'date_of_enquiry';
  window.appState.leadsSortDirection = state.leadsSortDirection || 'desc';
  window.appState.currentLeadsPage = state.currentLeadsPage || 1;
  window.appState.itemsPerPage = state.itemsPerPage || 20;
  window.appState.viewMode = state.viewMode || 'leads';
  window.appState.leads = state.leads || [];

  // ✅ CSV PREVIEW STATE IN APPSTATE - NEWLY ADDED
  window.appState.showPreview = state.showPreview || false;
  window.appState.uploadPreview = state.uploadPreview || null;
  window.appState.previewLoading = state.previewLoading || false;

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

  // ✅ CRITICAL MISSING ADDITION - PAYMENT POST SERVICE FORM SETTERS
  window.setShowPaymentPostServiceForm = state.setShowPaymentPostServiceForm;
  window.showPaymentPostServiceForm = state.showPaymentPostServiceForm;

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

  // ✅ CRITICAL MISSING: Payment Post Service Data Handlers
  window.setPaymentPostServiceData = state.setPaymentPostServiceData;
  window.paymentPostServiceData = state.paymentPostServiceData;

  // ✅ CRITICAL MISSING: Payment Post Service Form Handlers - NEWLY ADDED
  window.handlePaymentPostServiceSubmit = handlers.handlePaymentPostServiceSubmit || window.handlePaymentPostServiceSubmit;
  window.handlePaymentPostServiceInputChange = handlers.handlePaymentPostServiceInputChange || window.handlePaymentPostServiceInputChange;

  // ✅ CRITICAL MISSING: Payment Form Handlers - NEWLY ADDED
  window.handlePaymentSubmit = handlers.handlePaymentSubmit || window.handlePaymentSubmit;
  window.handlePaymentInputChange = handlers.handlePaymentInputChange || window.handlePaymentInputChange;

  // ✅ CRITICAL MISSING: Choice Modal State Setters - FIXED
  window.setCurrentLeadForChoice = state.setCurrentLeadForChoice;
  window.setChoiceOptions = state.setChoiceOptions;
  window.setShowChoiceModal = state.setShowChoiceModal;

  // ✅ CRITICAL MISSING: Status Progress Modal State Setters - FIXED
  window.setShowStatusProgressModal = state.setShowStatusProgressModal;
  window.setStatusProgressOptions = state.setStatusProgressOptions;
  window.setSelectedStatus = state.setSelectedStatus;
  window.setFollowUpDate = state.setFollowUpDate;
  window.setFollowUpNotes = state.setFollowUpNotes;

  // ✅ CRITICAL FIX: MISSING LEADS FILTER FUNCTION EXPOSURES - NEWLY ADDED
  window.setSearchQuery = state.setSearchQuery || ((query) => {
    console.log("🔍 setSearchQuery called with:", query);
    console.warn("⚠️ setSearchQuery not implemented in state");
  });
  
  window.setLeadsSourceFilter = state.setLeadsSourceFilter || ((filter) => {
    console.log("🏷️ setLeadsSourceFilter called with:", filter);
    console.warn("⚠️ setLeadsSourceFilter not implemented in state");
  });
  
  window.setLeadsBusinessTypeFilter = state.setLeadsBusinessTypeFilter || ((filter) => {
    console.log("🏢 setLeadsBusinessTypeFilter called with:", filter);
    console.warn("⚠️ setLeadsBusinessTypeFilter not implemented in state");
  });
  
  window.setLeadsEventFilter = state.setLeadsEventFilter || ((filter) => {
    console.log("📅 setLeadsEventFilter called with:", filter);
    console.warn("⚠️ setLeadsEventFilter not implemented in state");
  });
  
  window.setLeadsSortField = state.setLeadsSortField || ((field) => {
    console.log("📊 setLeadsSortField called with:", field);
    console.warn("⚠️ setLeadsSortField not implemented in state");
  });
  
  window.setLeadsSortDirection = state.setLeadsSortDirection || ((direction) => {
    console.log("🔄 setLeadsSortDirection called with:", direction);
    console.warn("⚠️ setLeadsSortDirection not implemented in state");
  });

  // ✅ CRITICAL FIX: MISSING INVENTORY FILTER FUNCTION EXPOSURES - NEWLY ADDED
  window.setInventoryEventFilter = state.setInventoryEventFilter || ((filter) => {
    console.log("🎫 setInventoryEventFilter called with:", filter);
    window.inventoryEventFilter = filter;
    if (state.setInventoryEventFilter) {
      state.setInventoryEventFilter(filter);
    } else {
      console.warn("⚠️ setInventoryEventFilter not implemented in state");
    }
  });
  
  window.setInventoryEventTypeFilter = state.setInventoryEventTypeFilter || ((filter) => {
    console.log("🏷️ setInventoryEventTypeFilter called with:", filter);
    window.inventoryEventTypeFilter = filter;
    if (state.setInventoryEventTypeFilter) {
      state.setInventoryEventTypeFilter(filter);
    } else {
      console.warn("⚠️ setInventoryEventTypeFilter not implemented in state");
    }
  });
  
  window.setInventoryDueDateFilter = state.setInventoryDueDateFilter || ((filter) => {
    console.log("📅 setInventoryDueDateFilter called with:", filter);
    window.inventoryDueDateFilter = filter;
    if (state.setInventoryDueDateFilter) {
      state.setInventoryDueDateFilter(filter);
    } else {
      console.warn("⚠️ setInventoryDueDateFilter not implemented in state");
    }
  });
  
  window.setInventorySortField = state.setInventorySortField || ((field) => {
    console.log("📊 setInventorySortField called with:", field);
    window.inventorySortField = field;
    if (state.setInventorySortField) {
      state.setInventorySortField(field);
    } else {
      console.warn("⚠️ setInventorySortField not implemented in state");
    }
  });
  
  window.setInventorySortDirection = state.setInventorySortDirection || ((direction) => {
    console.log("🔄 setInventorySortDirection called with:", direction);
    window.inventorySortDirection = direction;
    if (state.setInventorySortDirection) {
      state.setInventorySortDirection(direction);
    } else {
      console.warn("⚠️ setInventorySortDirection not implemented in state");
    }
  });

  // ✅ INVENTORY FILTER STATE VARIABLES - NEWLY ADDED
  window.inventoryEventFilter = state.inventoryEventFilter || 'all';
  window.inventoryEventTypeFilter = state.inventoryEventTypeFilter || 'all';
  window.inventoryDueDateFilter = state.inventoryDueDateFilter || 'all';
  window.inventorySortField = state.inventorySortField || 'event_date';
  window.inventorySortDirection = state.inventorySortDirection || 'asc';

  // ✅ ADD TO APPSTATE FOR COMPONENT COMPATIBILITY - NEWLY ADDED
  window.appState.inventoryEventFilter = state.inventoryEventFilter || 'all';
  window.appState.inventoryEventTypeFilter = state.inventoryEventTypeFilter || 'all';
  window.appState.inventoryDueDateFilter = state.inventoryDueDateFilter || 'all';
  window.appState.inventorySortField = state.inventorySortField || 'event_date';
  window.appState.inventorySortDirection = state.inventorySortDirection || 'asc';

  // ✅ CRITICAL FIX: VIEW MODE SETTER - NEWLY ADDED  
  window.setViewMode = state.setViewMode || ((mode) => {
    console.log("👁️ setViewMode called with:", mode);
    console.warn("⚠️ setViewMode not implemented in state");
  });

  // ✅ CRITICAL FIX: CLIENT SUGGESTION FUNCTIONS - NEWLY ADDED
  window.applyClientSuggestion = handlers.applyClientSuggestion || (() => {
    console.log("🎯 applyClientSuggestion called");
    
    if (window.clientSuggestion && window.setFormData) {
      // Apply the suggested assignment
      window.setFormData(prev => ({
        ...prev,
        assigned_to: window.clientSuggestion.suggested_assigned_to
      }));
      
      // Hide the client suggestion banner
      window.setShowClientSuggestion && window.setShowClientSuggestion(false);
      
      console.log("✅ Applied client suggestion:", window.clientSuggestion.suggested_assigned_to);
    } else {
      console.warn("⚠️ No client suggestion available or setFormData not found");
    }
  });

  window.setShowClientSuggestion = state.setShowClientSuggestion || ((show) => {
    console.log("👁️ setShowClientSuggestion called with:", show);
    console.warn("⚠️ setShowClientSuggestion not implemented in state");
  });

  // ✅ CRITICAL FIX: CLIENT MANAGEMENT FUNCTIONS - NEWLY ADDED
  window.fetchClients = handlers.fetchClients || (() => {
    console.log("👥 fetchClients called");
    // Return a promise for compatibility with .then() chains
    return new Promise((resolve, reject) => {
      if (handlers.fetchClients && typeof handlers.fetchClients === 'function') {
        return handlers.fetchClients().then(resolve).catch(reject);
      } else {
        console.warn("⚠️ fetchClients not implemented in handlers");
        // Resolve with existing clients array as fallback
        window.clients = window.clients || [];
        resolve(window.clients);
      }
    });
  });

  window.setSelectedClient = state.setSelectedClient || ((client) => {
    console.log("👤 setSelectedClient called with:", client);
    window.selectedClient = client;
    if (state.setSelectedClient) {
      state.setSelectedClient(client);
    } else {
      console.warn("⚠️ setSelectedClient not implemented in state");
    }
  });

  window.setShowClientDetail = state.setShowClientDetail || ((show) => {
    console.log("👁️ setShowClientDetail called with:", show);
    window.showClientDetail = show;
    if (state.setShowClientDetail) {
      state.setShowClientDetail(show);
    } else {
      console.warn("⚠️ setShowClientDetail not implemented in state");
    }
  });

  // ✅ CLIENT DATA VARIABLE
  window.clients = state.clients || [];
  window.selectedClient = state.selectedClient || null;
  window.showClientDetail = state.showClientDetail || false;
  window.clientsLoading = state.clientsLoading || false;

  // ✅ ENHANCED CLIENT FINDER FUNCTION - WORKS WITH MULTIPLE DATA STRUCTURES
  window.findClientByPhone = (phone) => {
    console.log("🔍 Looking for client with phone:", phone);
    
    if (!window.clients || !phone) {
      console.log("❌ No clients data or phone number provided");
      return null;
    }

    // Try multiple data structure patterns
    let foundClient = null;

    // Pattern 1: Direct phone match in client object
    foundClient = window.clients.find(c => c.phone === phone);
    if (foundClient) {
      console.log("✅ Found client by direct phone match:", foundClient.name || foundClient.id);
      return foundClient;
    }

    // Pattern 2: Client has leads array with phone numbers
    foundClient = window.clients.find(c => 
      c.leads && Array.isArray(c.leads) && c.leads.some(l => l.phone === phone)
    );
    if (foundClient) {
      console.log("✅ Found client by leads phone match:", foundClient.name || foundClient.id);
      return foundClient;
    }

    // Pattern 3: Check if clients is grouped by phone (common pattern)
    foundClient = window.clients.find(c => c.client_phone === phone);
    if (foundClient) {
      console.log("✅ Found client by client_phone match:", foundClient.name || foundClient.id);
      return foundClient;
    }

    // Pattern 4: Search in nested contact information
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

  // ✅ CRITICAL MISSING: Choice Modal State Variables - FIXED
  window.currentLeadForChoice = state.currentLeadForChoice;
  window.choiceOptions = state.choiceOptions;
  window.showChoiceModal = state.showChoiceModal;

  // ✅ CRITICAL MISSING: Status Progress Modal State Variables - FIXED
  window.showStatusProgressModal = state.showStatusProgressModal;
  window.statusProgressOptions = state.statusProgressOptions;
  window.selectedStatus = state.selectedStatus;
  window.followUpDate = state.followUpDate;
  window.followUpNotes = state.followUpNotes;

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

  // ✅ ENHANCED CLOSE FORM FUNCTION - UPDATED WITH PAYMENT POST SERVICE
  window.closeForm = () => {
    console.log("🔄 closeForm called - closing all forms");
    state.setShowLeadDetail && state.setShowLeadDetail(false);
    state.setShowEditForm && state.setShowEditForm(false);
    state.setShowAddForm && state.setShowAddForm(false);
    state.setShowAssignForm && state.setShowAssignForm(false);
    state.setShowPaymentForm && state.setShowPaymentForm(false);
    state.setShowPaymentPostServiceForm && state.setShowPaymentPostServiceForm(false);
    state.setShowInventoryForm && state.setShowInventoryForm(false);
    state.setShowAllocationForm && state.setShowAllocationForm(false);
    state.setShowDeliveryForm && state.setShowDeliveryForm(false);
    state.setShowChoiceModal && state.setShowChoiceModal(false);
    state.setShowStatusProgressModal && state.setShowStatusProgressModal(false);
    state.setFormData && state.setFormData({});
    state.setCurrentLead && state.setCurrentLead(null);
    state.setCurrentInventory && state.setCurrentInventory(null);
    state.setCurrentDelivery && state.setCurrentDelivery(null);
    state.setCurrentLeadForChoice && state.setCurrentLeadForChoice(null);
    state.setChoiceOptions && state.setChoiceOptions([]);
    state.setStatusProgressOptions && state.setStatusProgressOptions([]);
  };

  // ✅ STATUS FILTER FUNCTIONS
  window.setShowStatusFilterDropdown = state.setShowStatusFilterDropdown;
  window.showStatusFilterDropdown = state.showStatusFilterDropdown;
  window.statusDropdownRef = state.statusDropdownRef;
  window.statusFilter = state.statusFilter;
  window.setStatusFilter = state.setStatusFilter;
  window.selectedStatusFilters = state.selectedStatusFilters;
  window.setSelectedStatusFilters = state.setSelectedStatusFilters;

  // ✅ STATUS FILTER HELPER FUNCTIONS
  window.handleStatusFilterToggle = handlers.handleStatusFilterToggle;
  window.handleSelectAllStatuses = handlers.handleSelectAllStatuses;
  window.handleClearAllStatuses = handlers.handleClearAllStatuses;

  // ✅ BULK OPERATIONS SUPPORT
  window.bulkAssignSelections = state.bulkAssignSelections || {};
  window.setBulkAssignSelections = state.setBulkAssignSelections || ((selections) => {
    console.log("👥 setBulkAssignSelections called with:", Object.keys(selections || {}).length, "selections");
    window.bulkAssignSelections = selections;
    if (state.setBulkAssignSelections) {
      state.setBulkAssignSelections(selections);
    } else {
      console.warn("⚠️ setBulkAssignSelections not implemented in state");
    }
  });
  
  window.setBulkAssignLoading = state.setBulkAssignLoading || ((loading) => {
    console.log("⏳ setBulkAssignLoading called with:", loading);
    window.bulkAssignLoading = loading;
    if (state.setBulkAssignLoading) {
      state.setBulkAssignLoading(loading);
    } else {
      console.warn("⚠️ setBulkAssignLoading not implemented in state");
    }
  });
  
  window.setShowBulkAssignModal = state.setShowBulkAssignModal || ((show) => {
    console.log("👥 setShowBulkAssignModal called with:", show);
    window.showBulkAssignModal = show;
    if (state.setShowBulkAssignModal) {
      state.setShowBulkAssignModal(show);
    } else {
      console.warn("⚠️ setShowBulkAssignModal not implemented in state");
    }
  });

  window.handleBulkAssignSubmit = handlers.handleBulkAssignSubmit || (() => {
    console.log("🚀 handleBulkAssignSubmit called");
    console.warn("⚠️ handleBulkAssignSubmit not implemented in handlers");
    alert("Bulk assign functionality will be implemented in next update!");
  });

  // ✅ BULK ASSIGN STATE VARIABLES
  window.bulkAssignLoading = state.bulkAssignLoading || false;

  // ✅ CRITICAL FIX: CSV UPLOAD FUNCTIONS - NEWLY ADDED
  window.setCSVUploadType = state.setCSVUploadType || ((type) => {
    console.log("📄 setCSVUploadType called with:", type);
    window.csvUploadType = type;
    if (state.setCSVUploadType) {
      state.setCSVUploadType(type);
    } else {
      console.warn("⚠️ setCSVUploadType not implemented in state");
    }
  });

  window.setShowCSVUploadModal = state.setShowCSVUploadModal || ((show) => {
    console.log("📤 setShowCSVUploadModal called with:", show);
    window.showCSVUploadModal = show;
    if (state.setShowCSVUploadModal) {
      state.setShowCSVUploadModal(show);
    } else {
      console.warn("⚠️ setShowCSVUploadModal not implemented in state");
    }
  });

  // ✅ CSV UPLOAD STATE VARIABLES
  window.csvUploadType = state.csvUploadType || '';
  window.showCSVUploadModal = state.showCSVUploadModal || false;
  window.showBulkAssignModal = state.showBulkAssignModal || false;

  // ✅ CRITICAL FIX: CSV PREVIEW AND LOADING FUNCTIONS - NEWLY ADDED
  window.setPreviewLoading = state.setPreviewLoading || ((loading) => {
    console.log("⏳ setPreviewLoading called with:", loading);
    window.previewLoading = loading;
    if (state.setPreviewLoading) {
      state.setPreviewLoading(loading);
    } else {
      console.warn("⚠️ setPreviewLoading not implemented in state");
    }
  });

  window.setShowPreview = state.setShowPreview || ((show) => {
    console.log("👁️ setShowPreview called with:", show);
    window.showPreview = show;
    if (state.setShowPreview) {
      state.setShowPreview(show);
    } else {
      // Manual state update as fallback
      window.appState = window.appState || {};
      window.appState.showPreview = show;
      console.warn("⚠️ setShowPreview not implemented in state - using fallback");
    }
  });

  window.setPreviewData = state.setPreviewData || ((data) => {
    console.log("📊 setPreviewData called with:", data?.length || 0, "items");
    window.previewData = data;
    if (state.setPreviewData) {
      state.setPreviewData(data);
    } else {
      console.warn("⚠️ setPreviewData not implemented in state");
    }
  });

  // ✅ CRITICAL FIX: UPLOAD PREVIEW FUNCTION - LIKELY MISSING
  window.setUploadPreview = state.setUploadPreview || ((preview) => {
    console.log("📤 setUploadPreview called with:", preview);
    window.uploadPreview = preview;
    if (state.setUploadPreview) {
      state.setUploadPreview(preview);
    } else {
      // Manual state update as fallback
      window.appState = window.appState || {};
      window.appState.uploadPreview = preview;
      console.warn("⚠️ setUploadPreview not implemented in state - using fallback");
    }
  });

  // ✅ POTENTIAL TYPO FIX: setuploadpreview (lowercase, no camelCase)
  window.setuploadpreview = window.setUploadPreview;

  // ✅ CRITICAL FIX: PREVIEW UPLOAD HANDLER FUNCTIONS - NEWLY ADDED
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

  // ✅ CSV PREVIEW STATE VARIABLES
  window.previewLoading = state.previewLoading || false;
  window.showPreview = state.showPreview || false;
  window.previewData = state.previewData || [];
  window.uploadPreview = state.uploadPreview || null;

  // ✅ CRITICAL FIX: AUTH TOKEN EXPOSURE FOR CSV UPLOAD
  window.authToken = window.authToken || localStorage.getItem('crm_auth_token') || '';
  window.API_URL = window.API_URL || 'https://fantopark-backend-150582227311.us-central1.run.app/api';
  
  // ✅ CRITICAL FIX: API CONFIG OBJECT - NEWLY ADDED
  window.API_CONFIG = window.API_CONFIG || {
    API_URL: window.API_URL
  };

  // ✅ CSV UPLOAD ADDITIONAL FUNCTIONS - NEWLY ADDED
  window.setClientDetectionResults = state.setClientDetectionResults || ((results) => {
    console.log("🔍 setClientDetectionResults called with:", results?.length || 0, "results");
    window.clientDetectionResults = results;
    if (state.setClientDetectionResults) {
      state.setClientDetectionResults(results);
    } else {
      console.warn("⚠️ setClientDetectionResults not implemented in state");
    }
  });

  window.setShowClientDetectionResults = state.setShowClientDetectionResults || ((show) => {
    console.log("👁️ setShowClientDetectionResults called with:", show);
    window.showClientDetectionResults = show;
    if (state.setShowClientDetectionResults) {
      state.setShowClientDetectionResults(show);
    } else {
      console.warn("⚠️ setShowClientDetectionResults not implemented in state");
    }
  });

  // ✅ UPLOAD STATE MANAGEMENT - NEWLY ADDED
  window.setUploading = state.setUploading || ((uploading) => {
    console.log("⏳ setUploading called with:", uploading);
    window.uploading = uploading;
    if (state.setUploading) {
      state.setUploading(uploading);
    } else {
      console.warn("⚠️ setUploading not implemented in state");
    }
  });

  // ✅ CRITICAL FIX: PROCEED FROM PREVIEW FUNCTION - NEWLY ADDED
  window.handleProceedFromPreview = handlers.handleProceedFromPreview || (() => {
    console.log("🚀 handleProceedFromPreview called");
    
    // Close the preview modal
    window.setShowPreview(false);
    
    // Get the current upload file
    const file = window.currentUploadFile;
    if (!file) {
      alert('No file selected for upload');
      return;
    }
    
    console.log("📤 Starting upload process for:", file.name);
    
    // Trigger the upload directly
    const uploadFunction = async () => {
      try {
        // Set uploading state (assuming there's a setter for this)
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
          
          // Handle smart client detection results
          if (result.clientDetectionResults && result.clientDetectionResults.length > 0) {
            window.setClientDetectionResults(result.clientDetectionResults);
            window.setShowClientDetectionResults(true);
          }
          
          // Refresh leads data
          if (window.fetchLeads && typeof window.fetchLeads === 'function') {
            window.fetchLeads();
          }
          
          // Show success message
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
    
    // Execute upload
    uploadFunction();
  });

  // ✅ CLIENT DETECTION STATE VARIABLES
  window.clientDetectionResults = state.clientDetectionResults || [];
  window.showClientDetectionResults = state.showClientDetectionResults || false;
  window.uploading = state.uploading || false;

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

console.log('✅ Simplified App Component loaded successfully with LEADS FILTER FUNCTION EXPOSURES FIXED + togglePremiumStatus exposure added');
