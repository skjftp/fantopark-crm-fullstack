// Simplified App Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility
// ORGANIZED VERSION - Related functionality grouped together

window.SimplifiedApp = function() {
  // ===== CORE SETUP & INITIALIZATION =====
  const state = window.renderMainApp();
  const handlers = window.renderAppBusinessLogic();
  
  // ✅ CRITICAL DEBUG: Check what state setters are available
  console.log("🔍 DEBUGGING STATE SETTERS:");
  console.log("state.setShowInventoryForm:", typeof state.setShowInventoryForm, state.setShowInventoryForm);
  console.log("state.setEditingInventory:", typeof state.setEditingInventory, state.setEditingInventory);
  console.log("state.setShowAllocationManagement:", typeof state.setShowAllocationManagement, state.setShowAllocationManagement);
  console.log("state.setShowEditInventoryForm:", typeof state.setShowEditInventoryForm, state.setShowEditInventoryForm);
  
  // Log available setters
  const availableSetters = Object.keys(state).filter(key => key.startsWith('set') && key.includes('Inventory'));
  console.log("📋 Available inventory-related setters:", availableSetters);
  
  // Initialize all effects
  window.renderAppEffects();

  // Make handlers available globally
  window.appHandlers = handlers;

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

  // Leads Filter States
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

  // Inventory Filter States
  window.appState.inventoryEventFilter = state.inventoryEventFilter || 'all';
  window.appState.inventoryEventTypeFilter = state.inventoryEventTypeFilter || 'all';
  window.appState.inventoryDueDateFilter = state.inventoryDueDateFilter || 'all';
  window.appState.inventorySortField = state.inventorySortField || 'event_date';
  window.appState.inventorySortDirection = state.inventorySortDirection || 'asc';

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

  // ===== STATE SETTERS =====

  // Core State Setters
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

  // ✅ CRITICAL: Ensure setEditingInventory is available globally
  window.setEditingInventory = state.setEditingInventory;
  if (!window.setEditingInventory) {
    console.error("❌ CRITICAL: setEditingInventory not found in state!");
    window.setEditingInventory = (inventory) => {
      console.log("⚠️ FALLBACK setEditingInventory called with:", inventory);
      window.editingInventory = inventory;
      window.appState.editingInventory = inventory;
    };
  }

  // Modal State Setters
  window.setShowClientDetail = state.setShowClientDetail;
  window.setShowClientSuggestion = state.setShowClientSuggestion;
  window.setShowPaymentForm = state.setShowPaymentForm;
  window.setShowPaymentPostServiceForm = state.setShowPaymentPostServiceForm;
  window.setShowAssignForm = state.setShowAssignForm;
  window.setShowAddForm = state.setShowAddForm;
  window.setShowEditForm = state.setShowEditForm;
  window.setShowLeadDetail = state.setShowLeadDetail;
  window.setShowDeliveryForm = state.setShowDeliveryForm;
  window.setShowAllocationForm = state.setShowAllocationForm;

  // ✅ CRITICAL FIX: INVENTORY MODAL STATE SETTERS
  window.setShowInventoryForm = state.setShowInventoryForm || ((show) => {
    console.log("📦 setShowInventoryForm FALLBACK called with:", show);
    console.error("❌ CRITICAL: Real React state setter not found! This won't trigger re-renders.");
    console.log("🔍 Available state setters:", Object.keys(state).filter(key => key.startsWith('set')));
    window.showInventoryForm = show;
    window.appState = window.appState || {};
    window.appState.showInventoryForm = show;
  });

  window.setShowEditInventoryForm = state.setShowEditInventoryForm || ((show) => {
    console.log("✏️ setShowEditInventoryForm FALLBACK called with:", show);
    console.error("❌ CRITICAL: Real React state setter not found! This won't trigger re-renders.");
    window.showEditInventoryForm = show;
    window.appState = window.appState || {};
    window.appState.showEditInventoryForm = show;
  });

  window.setShowAllocationManagement = state.setShowAllocationManagement || ((show) => {
    console.log("👁️ setShowAllocationManagement FALLBACK called with:", show);
    console.error("❌ CRITICAL: Real React state setter not found! This won't trigger re-renders.");
    window.showAllocationManagement = show;
    window.appState = window.appState || {};
    window.appState.showAllocationManagement = show;
  });

  // ✅ DIRECT REACT STATE SETTER ACCESS - BYPASS FALLBACKS
  if (state.setShowInventoryForm) {
    window.setShowInventoryForm = state.setShowInventoryForm;
    console.log("✅ Using REAL React state setter for setShowInventoryForm");
  }
  
  if (state.setShowEditInventoryForm) {
    window.setShowEditInventoryForm = state.setShowEditInventoryForm;
    console.log("✅ Using REAL React state setter for setShowEditInventoryForm");
  }
  
  if (state.setShowAllocationManagement) {
    window.setShowAllocationManagement = state.setShowAllocationManagement;
    console.log("✅ Using REAL React state setter for setShowAllocationManagement");
  }

  if (state.setEditingInventory) {
    window.setEditingInventory = state.setEditingInventory;
    console.log("✅ Using REAL React state setter for setEditingInventory");
  }

  // Choice Modal State Setters
  window.setCurrentLeadForChoice = state.setCurrentLeadForChoice;
  window.setChoiceOptions = state.setChoiceOptions;
  window.setShowChoiceModal = state.setShowChoiceModal;

  // Status Progress Modal State Setters
  window.setShowStatusProgressModal = state.setShowStatusProgressModal;
  window.setStatusProgressOptions = state.setStatusProgressOptions;
  window.setSelectedStatus = state.setSelectedStatus;
  window.setFollowUpDate = state.setFollowUpDate;
  window.setFollowUpNotes = state.setFollowUpNotes;

  // Stadium State Setters
  window.setStadiums = state.setStadiums;
  window.setEditingStadium = state.setEditingStadium;
  window.setStadiumFormData = state.setStadiumFormData;
  window.setShowStadiumForm = state.setShowStadiumForm;

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
  window.setOrderEditData = state.setOrderEditData;
  window.setCurrentOrderForEdit = state.setCurrentOrderForEdit;
  window.setShowEditOrderForm = state.setShowEditOrderForm;
  window.setUserFormData = state.setUserFormData;
  window.setEditingUser = state.setEditingUser;
  window.setShowUserForm = state.setShowUserForm;

  // Leads Filter State Setters
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

  // Inventory Filter State Setters
  window.setInventoryEventFilter = state.setInventoryEventFilter || ((filter) => {
    console.log("🎫 setInventoryEventFilter called with:", filter);
    window.inventoryEventFilter = filter;
    if (state.setInventoryEventFilter) {
      state.setInventoryEventFilter(filter);
    } else {
      console.warn("⚠️ setInventoryEventFilter not implemented in state");
    }
    window.updateCurrentInventoryItems && window.updateCurrentInventoryItems();
  });
  
  window.setInventoryEventTypeFilter = state.setInventoryEventTypeFilter || ((filter) => {
    console.log("🏷️ setInventoryEventTypeFilter called with:", filter);
    window.inventoryEventTypeFilter = filter;
    if (state.setInventoryEventTypeFilter) {
      state.setInventoryEventTypeFilter(filter);
    } else {
      console.warn("⚠️ setInventoryEventTypeFilter not implemented in state");
    }
    window.updateCurrentInventoryItems && window.updateCurrentInventoryItems();
  });
  
  window.setInventoryDueDateFilter = state.setInventoryDueDateFilter || ((filter) => {
    console.log("📅 setInventoryDueDateFilter called with:", filter);
    window.inventoryDueDateFilter = filter;
    if (state.setInventoryDueDateFilter) {
      state.setInventoryDueDateFilter(filter);
    } else {
      console.warn("⚠️ setInventoryDueDateFilter not implemented in state");
    }
    window.updateCurrentInventoryItems && window.updateCurrentInventoryItems();
  });
  
  window.setInventorySortField = state.setInventorySortField || ((field) => {
    console.log("📊 setInventorySortField called with:", field);
    window.inventorySortField = field;
    if (state.setInventorySortField) {
      state.setInventorySortField(field);
    } else {
      console.warn("⚠️ setInventorySortField not implemented in state");
    }
    window.updateCurrentInventoryItems && window.updateCurrentInventoryItems();
  });
  
  window.setInventorySortDirection = state.setInventorySortDirection || ((direction) => {
    console.log("🔄 setInventorySortDirection called with:", direction);
    window.inventorySortDirection = direction;
    if (state.setInventorySortDirection) {
      state.setInventorySortDirection(direction);
    } else {
      console.warn("⚠️ setInventorySortDirection not implemented in state");
    }
    window.updateCurrentInventoryItems && window.updateCurrentInventoryItems();
  });

  window.setCurrentInventoryPage = state.setCurrentInventoryPage || ((page) => {
    console.log("📄 setCurrentInventoryPage called with:", page);
    window.currentInventoryPage = typeof page === 'function' ? page(window.currentInventoryPage) : page;
    if (state.setCurrentInventoryPage) {
      state.setCurrentInventoryPage(page);
    } else {
      console.warn("⚠️ setCurrentInventoryPage not implemented in state");
    }
  });

  // View Mode Setter
  window.setViewMode = state.setViewMode || ((mode) => {
    console.log("👁️ setViewMode called with:", mode);
    console.warn("⚠️ setViewMode not implemented in state");
  });

  // Bulk Operations Setters
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

  // CSV Upload State Setters
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

  window.setUploadPreview = state.setUploadPreview || ((preview) => {
    console.log("📤 setUploadPreview called with:", preview);
    window.uploadPreview = preview;
    if (state.setUploadPreview) {
      state.setUploadPreview(preview);
    } else {
      window.appState = window.appState || {};
      window.appState.uploadPreview = preview;
      console.warn("⚠️ setUploadPreview not implemented in state - using fallback");
    }
  });

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

  window.setUploading = state.setUploading || ((uploading) => {
    console.log("⏳ setUploading called with:", uploading);
    window.uploading = uploading;
    if (state.setUploading) {
      state.setUploading(uploading);
    } else {
      console.warn("⚠️ setUploading not implemented in state");
    }
  });

  // Status Filter Setters
  window.setShowStatusFilterDropdown = state.setShowStatusFilterDropdown;
  window.setStatusFilter = state.setStatusFilter;
  window.setSelectedStatusFilters = state.setSelectedStatusFilters;

  // ===== FUNCTION EXPOSURES =====

  // Core Lead Management Functions
  window.getStatusFilterDisplayText = handlers.getStatusFilterDisplayText;
  window.openLeadDetail = handlers.openLeadDetail;
  window.editLead = handlers.editLead;
  window.deleteLead = handlers.deleteLead;
  window.assignLead = handlers.assignLead;
  window.progressLead = handlers.progressLead;
  
  // Lead Progression Functions
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
  
  window.openDeliveryForm = handlers.openDeliveryForm || ((delivery) => {
    console.log("🚚 openDeliveryForm called with delivery:", delivery);
    state.setCurrentDelivery(delivery);
    state.setShowDeliveryForm(true);
  });

  // ✅ INVENTORY FUNCTIONS - ORGANIZED TOGETHER
  window.openInventoryForm = handlers.openInventoryForm || (() => {
    console.log("📦 openInventoryForm called");
    window.setShowInventoryForm(true);
  });

  window.openAddInventoryForm = handlers.openAddInventoryForm || (() => {
    console.log("➕ openAddInventoryForm called - FIXED VERSION");
    
    // Set editing inventory first
    const defaultInventory = { 
      id: null,
      event_name: '',
      event_date: '',
      event_type: '',
      sports: '',
      venue: ''
    };
    
    console.log("🔧 Setting editingInventory to:", defaultInventory);
    if (window.setEditingInventory) {
      window.setEditingInventory(defaultInventory);
    } else {
      console.error("❌ setEditingInventory not available!");
    }
    
    // Then show the form
    console.log("🔧 Setting showInventoryForm to true");
    if (window.setShowInventoryForm) {
      window.setShowInventoryForm(true);
    } else {
      console.error("❌ setShowInventoryForm not available!");
    }
    
    console.log("✅ openAddInventoryForm completed");
  });

  window.openInventoryDetail = handlers.openInventoryDetail || ((inventory) => {
    console.log("📦 openInventoryDetail called with:", inventory);
    if (window.setCurrentInventoryDetail) {
      window.setCurrentInventoryDetail(inventory);
      window.setShowInventoryDetail(true);
    } else {
      console.error("❌ Inventory detail setters not available!");
    }
  });

  window.openEditInventoryForm = handlers.openEditInventoryForm || ((inventory) => {
    console.log("✏️ openEditInventoryForm called with:", inventory);
    if (window.setCurrentInventory && window.setShowEditInventoryForm) {
      window.setCurrentInventory(inventory);
      window.setShowEditInventoryForm(true);
    } else {
      console.error("❌ Edit inventory setters not available!");
    }
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

  window.openAllocationManagement = handlers.openAllocationManagement || ((inventory) => {
    console.log("👁️ openAllocationManagement called with:", inventory);
    if (window.setCurrentInventory && window.setShowAllocationManagement) {
      window.setCurrentInventory(inventory);
      window.setShowAllocationManagement(true);
    } else {
      console.error("❌ Allocation management setters not available!");
    }
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
          
          if (window.fetchLeads && typeof window.fetchLeads === 'function') {
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

  // Status Filter Functions
  window.handleStatusFilterToggle = handlers.handleStatusFilterToggle;
  window.handleSelectAllStatuses = handlers.handleSelectAllStatuses;
  window.handleClearAllStatuses = handlers.handleClearAllStatuses;

  // Dashboard Functions
  window.chartInstances = state.chartInstances;
  window.calculateDashboardStats = handlers.calculateDashboardStats;

  // ===== UTILITY FUNCTIONS =====

  window.getUserDisplayName = handlers.getUserDisplayName || ((userId, usersList) => {
    if (!userId) return 'Unassigned';
    const user = (usersList || state.users || []).find(u => u.email === userId || u.id === userId);
    return user ? user.name : userId;
  });

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

  // ===== HELPER FUNCTIONS FOR MAIN APP =====

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

  // ===== MAIN RENDER LOGIC =====

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

    // All Modal Forms
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
      authToken: window.authToken
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

console.log('✅ Organized Simplified App Component loaded successfully with INVENTORY MODAL FIXES APPLIED');
