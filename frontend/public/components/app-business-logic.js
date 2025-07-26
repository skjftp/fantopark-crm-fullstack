// App Business Logic Handlers for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

// Feature flag helper - add this at the top of app-business-logic.js
window.enablePaginatedLeads = function(enable = true) {
  localStorage.setItem('usePaginatedLeads', enable ? 'true' : 'false');
  window.appState.setUsePaginatedLeads(enable);
  window.log.info(`Paginated leads ${enable ? 'enabled' : 'disabled'}. Refreshing...`);
  window.location.reload();
};


window.renderAppBusinessLogic = function() {  
  // Access app state
  const state = window.appState;
  if (!state) {
    window.log.error('App state not available');
    return {};
  }

    // Force enable paginated mode immediately
  if (localStorage.getItem('usePaginatedLeads') !== 'true') {
    localStorage.setItem('usePaginatedLeads', 'true');
    window.log.info('🚀 Auto-enabled paginated leads mode');
  }

  const {
    user, setUser, setCurrentUser, setIsLoggedIn, setUsers, setEmail, setPassword, setActiveTab,
    loading, setLoading, leads, setLeads, inventory, setInventory, orders, setOrders,
    invoices, setInvoices, deliveries, setDeliveries, clients, setClients,
    paymentData, setPaymentData, currentLead, setCurrentLead, currentInventory, setCurrentInventory,
    showEditOrderForm, setShowEditOrderForm, currentOrderForEdit, setCurrentOrderForEdit,
    orderEditData, setOrderEditData, editingInventory, setEditingInventory,
    showInventoryForm, setShowInventoryForm, formData, setFormData,
    clientsLoading, setClientsLoading, dynamicRoles, setDynamicRoles, rolesLoaded, setRolesLoaded,
    selectedStatusFilters, setSelectedStatusFilters, statusDropdownRef,
    stadiums, setStadiums, editingStadium, setEditingStadium, stadiumFormData, setStadiumFormData,
    showStadiumForm, setShowStadiumForm, phoneCheckLoading, setPhoneCheckLoading,
    clientSuggestion, setClientSuggestion, showClientSuggestion, setShowClientSuggestion,
    phoneCheckTimeout, setPhoneCheckTimeout, receivables, setReceivables,
    dashboardFilter, selectedSalesPerson, selectedEvent, dashboardStats, setDashboardStats,
    events, setEvents, salesPeople, setSalesPeople, rolesInitialized, setRolesInitialized,
    users, allUsers, setAllUsers, emailNotifications, setEmailNotifications,
    reminders, setReminders, reminderStats, setReminderStats, currentOrderDetail, setCurrentOrderDetail,
    showOrderDetail, setShowOrderDetail, currentDelivery, setCurrentDelivery,
    deliveryFormData, setDeliveryFormData, showDeliveryForm, setShowDeliveryForm,
    paymentPostServiceData, setPaymentPostServiceData, showPaymentPostServiceForm, setShowPaymentPostServiceForm,
    currentInventoryDetail, setCurrentInventoryDetail, showInventoryDetail, setShowInventoryDetail,
    allocationManagementInventory, setAllocationManagementInventory, currentAllocations, setCurrentAllocations,
    showAllocationManagement, setShowAllocationManagement, currentInvoice, setCurrentInvoice,
    showInvoicePreview, setShowInvoicePreview, selectedOrderForAssignment, setSelectedOrderForAssignment,
    showOrderAssignmentModal, setShowOrderAssignmentModal, currentEvent, setCurrentEvent,
    eventFormData, setEventFormData, showEventForm, setShowEventForm, showEventDetail, setShowEventDetail,
    sportsEvents, setSportsEvents, showLeadDetail, setShowLeadDetail, showAllocationForm, setShowAllocationForm,
    allocationData, setAllocationData, showEditInventoryForm, setShowEditInventoryForm,
    showUserManagement, setShowUserManagement, showAddForm, setShowAddForm, currentForm, setCurrentForm,
    showEditForm, setShowEditForm, showAssignForm, setShowAssignForm, showPaymentForm, setShowPaymentForm,
    showChoiceModal, setShowChoiceModal, currentLeadForChoice, setCurrentLeadForChoice,
    choiceOptions, setChoiceOptions, userFormData, setUserFormData, showUserForm, setShowUserForm,
    showStatusProgressModal, setShowStatusProgressModal, statusProgressOptions, setStatusProgressOptions
  } = state;
  // ✅ NEW: togglePremiumStatus function - FOLLOWING INTEGRATION PATTERN
  const togglePremiumStatus = async (leadId, isPremium) => {
    try {
      setLoading(true);
      
      const response = await window.apiCall(`/leads/${leadId}`, {
        method: 'PUT',
        body: JSON.stringify({ is_premium: isPremium })
      });
      
      // Update the leads list
      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? { ...lead, is_premium: isPremium } : lead
      ));
      
      // Update currentLead if viewing the lead details
      if (showLeadDetail && currentLead?.id === leadId) {
        setCurrentLead(prev => ({ ...prev, is_premium: isPremium }));
      }
      
      window.log.info(`✅ Lead ${leadId} premium status updated to ${isPremium}`);
      
    } catch (error) {
      window.log.error('Error updating premium status:', error);
      alert('Failed to update premium status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ CRITICAL: Enhanced Choice Modal Handler (ORIGINAL SOPHISTICATED LOGIC RESTORED)
  const handleChoiceSelection = async (choice) => {
    try {
      setLoading(true);

      // If choice requires follow-up date, switch to the enhanced modal
      if (choice.requires_followup_date) {
        setShowChoiceModal(false);
        setCurrentLead(currentLeadForChoice);
        setShowStatusProgressModal(true);
        setStatusProgressOptions([{
          value: choice.value,
          label: choice.label,
          color: window.LEAD_STATUSES[choice.value]?.color || 'bg-gray-100 text-gray-800',
          requires_followup_date: true
        }]);
        setLoading(false);
        return;
      }

      // Handle payment choices (existing logic)
      if (choice.value === 'payment') {
        setShowChoiceModal(false);
        openPaymentForm(currentLeadForChoice);
        setLoading(false);
        return;
      }

if (choice.value === 'payment_post_service') {
  setShowChoiceModal(false);
  // Instead of openPaymentPostServiceForm, open proforma form
  window.openProformaInvoiceForm(currentLeadForChoice);
  setLoading(false);
  return;
}
      // For regular status updates
      await window.updateLeadStatus(currentLeadForChoice.id, choice.value);
      setShowChoiceModal(false);
      setLoading(false);
    } catch (error) {
      window.log.error('Error handling choice selection:', error);
      setLoading(false);
      alert('Failed to update lead status: ' + error.message);
    }
  };

  // Helper function for status icons
  const getStatusIcon = (status) => {
    const statusMap = {
      'unassigned': '📝',
      'assigned': '👤',
      'contacted': '📞',
      'attempt_1': '📞',
      'attempt_2': '📞',
      'attempt_3': '📞',
      'qualified': '✅',
      'junk': '🗑️',
      'hot': '🔥',
      'warm': '🌟',
      'cold': '❄️',
      'converted': '💰',
      'dropped': '❌',
      'payment': '💳',
      'payment_post_service': '📅',
      'payment_received': '✅',
      'pickup_later': '⏰'
    };
    return statusMap[status] || '📋';
  };

  // ✅ CRITICAL: handleLeadProgression with FIXED MODAL SWITCHING LOGIC 
  const handleLeadProgression = (lead) => {
    // FIXED: Handle unassigned leads first - open assignment form instead of progressing
    if (lead.status === 'unassigned' && !lead.assigned_to) {
      window.log.debug('📝 Opening assignment form for unassigned lead:', lead.name);
      openAssignForm(lead);
      return;
    }

    if (!window.hasPermission('leads', 'progress')) {
      alert('You do not have permission to progress leads');
      return;
    }

    const currentStatus = lead.status;
    const nextOptions = window.LEAD_STATUSES[currentStatus]?.next || [];

    if (nextOptions.length === 0) {
      alert('This lead is already at the final stage.');
      return;
    }

    // Check if any of the next options require follow-up date (like pickup_later)
    const hasFollowUpOptions = nextOptions.some(status => 
      window.LEAD_STATUSES[status]?.requires_followup_date
    );

    // ✅ CRITICAL FIX: ADD MISSING MODAL SWITCHING LOGIC
    // Early stages (unassigned, assigned, attempts) → Use Choice Modal (button list)  
    // After contacted → Use Status Progress Modal (dropdown system)
    const earlyStageStatuses = ['unassigned', 'assigned', 'attempt_1', 'attempt_2', 'attempt_3'];
    const useChoiceModal = earlyStageStatuses.includes(currentStatus);

    window.log.debug('🎯 Modal decision:', {
      currentStatus,
      isEarlyStage: useChoiceModal,
      nextOptions,
      modalType: useChoiceModal ? 'Choice Modal (Buttons)' : 'Status Progress Modal (Dropdown)'
    });

    if (nextOptions.length === 1) {
      const nextStatus = nextOptions[0];

      // Handle pickup_later status (requires follow-up date)
      if (nextStatus === 'pickup_later') {
        setCurrentLead(lead);
        setShowStatusProgressModal(true);
        setStatusProgressOptions([{
          value: 'pickup_later',
          label: window.LEAD_STATUSES['pickup_later'].label,
          color: window.LEAD_STATUSES['pickup_later'].color,
          requires_followup_date: true
        }]);
        return;
      }

      // Handle payment status (existing logic)
      if (nextStatus === 'payment') {
        if (currentStatus === 'payment_post_service') {
          // Coming from payment_post_service, collect payment
          const receivable = receivables.find(r => r.lead_id === lead.id && r.status === 'pending');
          if (receivable) {
            collectPostServicePayment(receivable);
          } else {
            openPaymentForm(lead);
          }
        } else {
          openPaymentForm(lead);
        }
        return;
      }

      // For other single status transitions (including attempts)
      window.updateLeadStatus(lead.id, nextStatus);
    } else {
      // Multiple options available - decide which modal to use

      // Handle special case for converted status with payment options (existing logic)
      if (currentStatus === 'converted' && 
          nextOptions.includes('payment') && 
          nextOptions.includes('payment_post_service')) {

        // Check if pickup_later is also an option
        if (nextOptions.includes('pickup_later')) {
          // Show enhanced choice modal with pickup_later option
          setCurrentLeadForChoice(lead);
          setChoiceOptions([
            { value: 'payment', label: 'Collect Payment Now', icon: '💳' },
            { value: 'payment_post_service', label: 'Payment Post Service', icon: '📅' },
            { value: 'pickup_later', label: 'Pick Up Later', icon: '⏰', requires_followup_date: true }
          ]);
          setShowChoiceModal(true);
        } else {
          // Original logic for payment choices
          setCurrentLeadForChoice(lead);
          setChoiceOptions([
            { value: 'payment', label: 'Collect Payment Now', icon: '💳' },
            { value: 'payment_post_service', label: 'Payment Post Service', icon: '📅' }
          ]);
          setShowChoiceModal(true);
        }
      } 
      // If any option requires follow-up date, use the enhanced modal
      else if (hasFollowUpOptions) {
        setCurrentLead(lead);
        setShowStatusProgressModal(true);
        setStatusProgressOptions(nextOptions.map(status => ({
          value: status,
          label: window.LEAD_STATUSES[status].label,
          color: window.LEAD_STATUSES[status].color,
          requires_followup_date: window.LEAD_STATUSES[status].requires_followup_date,
          icon: getStatusIcon(status) // Helper function for icons
        })));
      } 
      // ✅ CRITICAL FIX: ADD THE MISSING MODAL SWITCHING LOGIC
      else if (useChoiceModal) {
        // Early stages: Show Choice Modal with button list (beautiful icons ✏️📞⏰)
        window.log.debug('✨ Using Choice Modal for early stage:', currentStatus);
        setCurrentLeadForChoice(lead);
        setChoiceOptions(nextOptions.map(status => ({
          value: status,
          label: window.LEAD_STATUSES[status].label,
          icon: getStatusIcon(status)
        })));
        setShowChoiceModal(true);
      } else {
        // Later stages: Show Status Progress Modal with dropdown system  
        window.log.debug('📋 Using Status Progress Modal for later stage:', currentStatus);
        setCurrentLead(lead);
        setShowStatusProgressModal(true);
        setStatusProgressOptions(nextOptions.map(status => ({
          value: status,
          label: window.LEAD_STATUSES[status].label,
          color: window.LEAD_STATUSES[status].color,
          requires_followup_date: window.LEAD_STATUSES[status].requires_followup_date,
          icon: getStatusIcon(status)
        })));
      }
    }
  };

  // ✅ MISSING FUNCTION: progressLead (alias for handleLeadProgression)
  const progressLead = handleLeadProgression;

  // ✅ MISSING FUNCTION: editLead 
  const editLead = (lead) => {
    window.log.debug("📝 editLead called with:", lead);
    openEditForm(lead);
  };

  // ✅ MISSING FUNCTION: deleteLead
  const deleteLead = async (leadId) => {
    if (!window.hasPermission('leads', 'write')) {
      alert('You do not have permission to delete leads');
      return;
    }

    if (!confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      
      await window.apiCall('/leads/' + leadId, {
        method: 'DELETE'
      });

      setLeads(prev => prev.filter(lead => lead.id !== leadId));
      
      // Close lead detail if it's the one being deleted
      if (showLeadDetail && currentLead?.id === leadId) {
        setShowLeadDetail(false);
        setCurrentLead(null);
      }

      alert('Lead deleted successfully!');
    } catch (error) {
      window.log.error('Error deleting lead:', error);
      alert('Failed to delete lead: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ MISSING FUNCTION: assignLead
  const assignLead = (lead) => {
    window.log.debug("👤 assignLead called with:", lead);
    openAssignForm(lead);
  };

 const fetchUsers = async () => {
    try {
      const response = await window.apiCall('/users');
      
      // Set directly without relying on any setUsers function
      window.users = response.data || [];
      window.allUsers = response.data || [];
      if (!window.appState) window.appState = {};
      window.appState.users = response.data || [];
      
      // ✅ NEW: Backup to localStorage for persistence
      if (response.data && response.data.length > 0) {
        localStorage.setItem('crm_users_backup', JSON.stringify(response.data));
        window.log.info(`💾 Backed up ${response.data.length} users to localStorage`);
      }
      
      // Also call React setters if they exist
      if (setUsers) setUsers(response.data || []);
      if (setAllUsers) setAllUsers(response.data || []);
      
      window.log.debug(`Fetched ${response.data?.length || 0} users to all locations`);
    } catch (error) {
      window.log.error('Failed to fetch users:', error);
      
      // ✅ NEW: Try to restore from backup on error
      try {
        const backup = localStorage.getItem('crm_users_backup');
        if (backup) {
          const users = JSON.parse(backup);
          window.users = users;
          window.allUsers = users;
          if (!window.appState) window.appState = {};
          window.appState.users = users;
          window.log.info("🔄 Restored", users.length, "users from localStorage backup");
        }
      } catch (restoreError) {
        window.log.error("Failed to restore users from backup:", restoreError);
      }
    }
  };

  // ✅ UPDATED: fetchLeads to use paginated API
const fetchLeads = async () => {
    try {
        // Always use paginated API
        return window.LeadsAPI.fetchPaginatedLeads({ page: 1 });
    } catch (error) {
        window.log.error('Failed to fetch leads:', error);
    }
};

  // [ALL THE WORKING FUNCTIONS FROM YOUR ORIGINAL FILE - UNCHANGED]
  const openEditOrderForm = (order) => {
    if (!order) {
      alert('Order data not found');
      return;
    }
    if (!window.hasPermission('orders', 'write')) {
      alert('You do not have permission to edit orders');
      return;
    }
    setCurrentOrderForEdit(order);
    setOrderEditData({
      ...order,
      status: order.status || 'pending_approval',
      rejection_reason: order.rejection_reason || '',
      assigned_to: order.assigned_to || ''
    });
    setShowEditOrderForm(true);
  };

  const fetchClients = async () => {
    setClientsLoading(true);
    try {
        // Always reset to page 1 when fetching clients
        if (window.ClientsAPI) {
            // Reset pagination state first
            if (window.appState?.setClientsPagination) {
                window.appState.setClientsPagination({
                    page: 1,
                    totalPages: 1,
                    total: 0,
                    hasNext: false,
                    hasPrev: false,
                    perPage: 20
                });
            }
            
            // Reset current page
            window.ClientsAPI.currentPage = 1;
            
            // Fetch first page
            const response = await window.ClientsAPI.fetchPaginatedClients({ page: 1 });
            
            // Log the response for debugging
            console.log('📊 fetchClients response:', {
                success: response.success,
                dataLength: response.data?.length,
                pagination: response.pagination
            });
        } else {
            // Fallback
            const response = await window.apiCall('/clients?page=1&limit=20');
            setClients(response.data || []);
        }
    } catch (error) {
        window.log.error('Failed to fetch clients:', error);
        setClients([]);
    } finally {
        setClientsLoading(false);
    }
};

  const fetchUserRoles = async () => {
    try {
      const response = await window.apiCall('/roles');
      const roleMap = {};

      response.data.forEach(role => {
        roleMap[role.name] = {
          label: role.label,
          permissions: role.permissions
        };
      });
      setDynamicRoles(roleMap);
      setRolesLoaded(true);
    } catch (error) {
      window.log.error('Failed to fetch roles:', error);
      setDynamicRoles(window.USER_ROLES);
      setRolesLoaded(true);
    }
  };

  const handleStatusFilterToggle = (status) => {
    setSelectedStatusFilters(prev => {
      const newFilters = prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status];
      
      // Trigger API call after state update
      setTimeout(() => {
        if (window.LeadsAPI && window.LeadsAPI.fetchPaginatedLeads) {
          window.LeadsAPI.fetchPaginatedLeads({ page: 1 });
        }
      }, 50);
      
      return newFilters;
    });
  };

  const handleSelectAllStatuses = () => {
    const allStatuses = Object.keys(window.LEAD_STATUSES);
    const newFilters = selectedStatusFilters.length === allStatuses.length ? [] : allStatuses;
    setSelectedStatusFilters(newFilters);
    
    // Trigger API call after state update
    setTimeout(() => {
      if (window.LeadsAPI && window.LeadsAPI.fetchPaginatedLeads) {
        window.LeadsAPI.fetchPaginatedLeads({ page: 1 });
      }
    }, 50);
  };

  const checkPhoneForClient = async (phone) => {
    if (!phone || phone.length < 10) {
      setClientSuggestion(null);
      setShowClientSuggestion(false);
      return;
    }
    const normalizedPhone = phone.replace(/[\s\-\+]/g, '').replace(/^91/, '');

    if (normalizedPhone.length < 10) {
      setClientSuggestion(null);
      setShowClientSuggestion(false);
      return;
    }
    setPhoneCheckLoading(true);
    try {
      const response = await window.apiCall(`/leads/check-phone/${normalizedPhone}`);
      if (response.exists && response.suggestion) {
        setClientSuggestion(response.suggestion);
        setShowClientSuggestion(true);
      } else {
        setClientSuggestion(null);
        setShowClientSuggestion(false);
      }
    } catch (error) {
      window.log.error('Error checking phone:', error);
      setClientSuggestion(null);
      setShowClientSuggestion(false);
    } finally {
      setPhoneCheckLoading(false);
    }
  };

  const handlePhoneChange = (value) => {
    setLeadFormData(prev => ({ ...prev, phone: value }));

    if (phoneCheckTimeout) {
      clearTimeout(phoneCheckTimeout);
    }

    const newTimeout = setTimeout(() => {
      checkPhoneForClient(value);
    }, 500);

    setPhoneCheckTimeout(newTimeout);
  };
    
  const applyClientSuggestion = () => {
    if (clientSuggestion) {
      setLeadFormData(prev => ({
        ...prev,
        assigned_to: clientSuggestion.suggested_assigned_to,
        company: clientSuggestion.client_history[0]?.company || prev.company,
        city_of_residence: clientSuggestion.client_history[0]?.city_of_residence || prev.city_of_residence,
        country_of_residence: clientSuggestion.client_history[0]?.country_of_residence || prev.country_of_residence,
        business_type: clientSuggestion.client_history[0]?.business_type || prev.business_type,
        annual_income_bracket: clientSuggestion.client_history[0]?.annual_income_bracket || prev.annual_income_bracket
      }));
      setShowClientSuggestion(false);
      alert('Client information applied! This lead will be linked to the existing client.');
    }
  };

  const handleClearAllStatuses = () => {
    setSelectedStatusFilters([]);
    
    // Trigger API call after state update
    setTimeout(() => {
      if (window.LeadsAPI && window.LeadsAPI.fetchPaginatedLeads) {
        window.LeadsAPI.fetchPaginatedLeads({ page: 1 });
      }
    }, 50);
  };

  const getStatusFilterDisplayText = () => {
    if (selectedStatusFilters.length === 0) {
      return 'All Statuses';
    } else if (selectedStatusFilters.length === 1) {
      return window.LEAD_STATUSES[selectedStatusFilters[0]].label;
    } else if (selectedStatusFilters.length === Object.keys(window.LEAD_STATUSES).length) {
      return 'All Statuses';
    } else {
      return `${selectedStatusFilters.length} statuses selected`;
    }
  }; 

  const openStadiumForm = (stadium = null) => {
    setEditingStadium(stadium);
    setStadiumFormData(stadium || {});
    setShowStadiumForm(true);
  };

  const closeStadiumForm = () => {
    setShowStadiumForm(false);
    setEditingStadium(null);
    setStadiumFormData({});
  };

  const handleStadiumInputChange = (name, value) => {
    setStadiumFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add this to your existing app-business-logic.js file

// Replace the fetchData function's lead fetching logic with this:

const fetchData = async () => {
    const authToken = localStorage.getItem('crm_auth_token') || window.authToken;
    
    if (!state.isLoggedIn || !authToken) return;
    
    try {
        window.log.debug('🔍 fetchData starting');
        
        // Fetch other data
        const [inventoryData, ordersData, invoicesData, deliveriesData, clientsData] = await Promise.all([
            window.apiCall('/inventory').catch(() => ({ data: [] })),
            window.apiCall('/orders').catch(() => ({ data: [] })),
            window.apiCall('/invoices').catch(() => ({ data: [] })),
            window.apiCall('/deliveries').catch(() => ({ data: [] })),
            window.apiCall('/clients').catch(() => ({ data: [] }))
        ]);
        
        // Set other data
        setInventory(inventoryData.data || []);
        setOrders(ordersData.data || []);
        setInvoices(invoicesData.data || []);
        setDeliveries(deliveriesData.data || []);
        setClients(clientsData.data || []);

    // Dashboard charts will be initialized by the dashboard component itself
      
        // ✅ ADD THIS: Initialize leads module after other data is loaded
        if (window.initializeLeadsModule && !window.leadsInitialized) {
            window.log.info('🚀 Initializing leads module from fetchData');
            setTimeout(() => {
                window.initializeLeadsModule();
            }, 500);
        }
        
        window.log.success('✅ Data loaded - leads will initialize separately');
        
    } catch (error) {
        window.log.error('Error fetching data:', error);
    }
};

// Function to automatically update orders pagination
const updateOrdersPagination = (orders) => {
  if (!window.appState?.ordersFilters || !window.appState?.ordersPagination) {
    return;
  }
  
  const ordersFilters = window.appState.ordersFilters;
  const ordersPagination = window.appState.ordersPagination;
  
  // Apply the same filtering logic as the component
  let filteredOrders = [...(orders || [])];
  
  // Apply filters
  if (ordersFilters.searchQuery) {
    const query = ordersFilters.searchQuery.toLowerCase();
    filteredOrders = filteredOrders.filter(order =>
      (order.client_name && order.client_name.toLowerCase().includes(query)) ||
      (order.client_phone && order.client_phone.includes(query)) ||
      (order.order_number && order.order_number.toLowerCase().includes(query)) ||
      (order.event_name && order.event_name.toLowerCase().includes(query))
    );
  }
  
  if (ordersFilters.statusFilter !== 'all') {
    filteredOrders = filteredOrders.filter(order => order.status === ordersFilters.statusFilter);
  }
  
  if (ordersFilters.assignedToFilter !== 'all') {
    if (ordersFilters.assignedToFilter === 'unassigned') {
      filteredOrders = filteredOrders.filter(order => !order.assigned_to);
    } else {
      filteredOrders = filteredOrders.filter(order => order.assigned_to === ordersFilters.assignedToFilter);
    }
  }
  
  if (ordersFilters.eventFilter !== 'all') {
    filteredOrders = filteredOrders.filter(order => order.event_name === ordersFilters.eventFilter);
  }
  
  if (ordersFilters.clientFilter) {
    const clientQuery = ordersFilters.clientFilter.toLowerCase();
    filteredOrders = filteredOrders.filter(order =>
      order.client_name && order.client_name.toLowerCase().includes(clientQuery)
    );
  }
  
  if (ordersFilters.orderNumberFilter) {
    const orderQuery = ordersFilters.orderNumberFilter.toLowerCase();
    filteredOrders = filteredOrders.filter(order =>
      order.order_number && order.order_number.toLowerCase().includes(orderQuery)
    );
  }
  
  if (ordersFilters.paymentStatusFilter !== 'all') {
    filteredOrders = filteredOrders.filter(order => order.payment_status === ordersFilters.paymentStatusFilter);
  }
  
  if (ordersFilters.dateFromFilter) {
    filteredOrders = filteredOrders.filter(order => 
      new Date(order.created_date) >= new Date(ordersFilters.dateFromFilter)
    );
  }
  
  if (ordersFilters.dateToFilter) {
    filteredOrders = filteredOrders.filter(order => 
      new Date(order.created_date) <= new Date(ordersFilters.dateToFilter)
    );
  }
  
  // Calculate correct pagination
  const totalItems = filteredOrders.length;
  const itemsPerPage = ordersPagination.itemsPerPage || 10;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentPage = Math.min(ordersPagination.currentPage || 1, totalPages || 1);
  
  // Update pagination state
  const newPagination = {
    ...ordersPagination,
    totalItems,
    totalPages,
    currentPage
  };
  
  if (window.appState?.setOrdersPagination) {
    window.appState.setOrdersPagination(newPagination);
    window.log.debug('📈 Auto-updated orders pagination:', { totalItems, totalPages, currentPage });
  }
};
  const assignOrderToService = async (orderId, assignee) => {
    setLoading(true);
    try {
      const updateData = {
        assigned_to: assignee,
        status: 'service_assigned',
        assigned_date: new Date().toISOString()
      };

      await window.apiCall('/orders/' + (orderId), {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, ...updateData }
            : order
        )
      );

      const order = orders.find(o => o.id === orderId);
      if (order) {
        const newDelivery = {
          order_id: orderId,
          order_number: order.order_number,
          client_name: order.client_name,
          client_email: order.client_email,
          client_phone: order.client_phone,
          event_name: order.event_name || 'N/A',
          event_date: order.event_date || new Date().toISOString().split('T')[0],
          tickets_count: order.tickets_allocated || 0,
          amount: order.total_amount || 0,
          delivery_type: 'offline',
          pickup_location: '',
          pickup_date: '',
          pickup_time: '',
          delivery_location: order.delivery_address || order.client_address || '',
          delivery_date: '',
          delivery_time: '',
          delivery_person: assignee,
          delivery_notes: '',
          online_platform: '',
          online_link: '',
          assigned_to: assignee,
          status: 'pending',
          created_date: new Date().toISOString().split('T')[0],
          created_by: user.name
        };

        setDeliveries(prev => [...prev, newDelivery]);

        try {
          const deliveryResponse = await window.apiCall('/deliveries', {
            method: 'POST',
            body: JSON.stringify(newDelivery)
          });
          if (deliveryResponse && deliveryResponse.data && deliveryResponse.data.id) {
            setDeliveries(prev => prev.map(d => 
              d.id === newDelivery.id ? { ...d, id: deliveryResponse.data.id } : d
            ));
          }
        } catch (error) {
          window.log.error('Failed to save delivery to backend:', error);
        }
      }

      alert('Order assigned to ' + (assignee) + ' successfully!');
    } catch (error) {
      window.log.error('Error assigning order:', error);
      alert('Failed to assign order');
    } finally {
      setLoading(false);
    }
  };

  const openOrderDetail = (order) => {
    setCurrentOrderDetail(order);
    setShowOrderDetail(true);
  };

  const calculateDashboardStats = () => {
    let filteredLeads = leads;

    if (dashboardFilter === 'salesPerson' && selectedSalesPerson) {
      filteredLeads = leads.filter(l => l.assigned_to === selectedSalesPerson);
    } else if (dashboardFilter === 'event' && selectedEvent) {
      filteredLeads = leads.filter(l => l.lead_for_event === selectedEvent);
    }

    const stats = {
      totalLeads: filteredLeads.length,
      activeDeals: filteredLeads.filter(l => ['hot', 'warm', 'qualified'].includes(l.status)).length,
      thisMonthRevenue: 0,
      pendingDeliveries: deliveries.filter(d => d.status === 'pending').length,
      inventoryValue: inventory.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };

    setDashboardStats(stats);
    window.updateCharts && window.updateCharts(filteredLeads);
  };

  const extractFiltersData = () => {
    const uniqueEvents = [...new Set(leads.map(l => l.lead_for_event).filter(e => e))];
    setEvents(uniqueEvents);

    const salesUsers = users.filter(u => 
      u.role === 'sales_executive' || u.role === 'sales_manager'
    );
    setSalesPeople(salesUsers);
  };

  // Authentication handlers
  const handleLogin = async (e) => {
  window.log.debug('LOGIN_START', { email: state.email, timestamp: Date.now() });
  e.preventDefault();
  setLoading(true);

  try {
    const response = await window.apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: state.email, password: state.password })
    });

    if (response.token && response.user) {
  // ✅ FIX: Set authToken properly in localStorage and window object
  localStorage.setItem('crm_auth_token', response.token);
  window.authToken = response.token; // Also set on window object for consistency
  localStorage.setItem('crm_user', JSON.stringify(response.user));
  setUser(response.user);
  setCurrentUser(response.user);
  setIsLoggedIn(true);

  // Dashboard will be initialized by its own component    
  
  // Initialize leads module after login
  if (window.initializeLeadsModule) {
    setTimeout(() => {
      window.initializeLeadsModule();
    }, 500);
  }
  
  await fetchUserRoles();
  setUsers([]);
  setEmail('');
  setPassword('');
}
  } catch (error) {
    window.log.error("Login failed:", error.message || "Invalid credentials");
  } finally {
    setLoading(false);
  }
};

  const handleLogout = () => {
  setIsLoggedIn(false);
  setUser(null);
  setCurrentUser(null);
  setEmail('');
  setPassword('');
  setActiveTab('dashboard');
  try {
    localStorage.removeItem('crm_user');
    localStorage.removeItem('crm_auth_token');
    // ✅ FIX: Clear window.authToken instead of undefined authToken variable
    window.authToken = null;
  } catch (e) {
    window.log.debug('Failed to clear auth state:', e);
  }
};

  const openUserManagement = () => {
    if (!window.hasPermission('users', 'read')) {
      alert('You do not have permission to access user management');
      return;
    }
    setShowUserManagement(true);
  };

  // Form handlers with permission checks
  const openAddForm = (type) => {
    if (!window.hasPermission(type === 'lead' ? 'leads' : (type === 'order' ? 'orders' : type), 'write')) {
      alert('You do not have permission to create ' + (type) + 's');
      return;
    }
    setCurrentForm(type);
    setFormData({});
    setShowAddForm(true);
  };

  const openEditForm = (lead) => {
    if (!window.hasPermission('leads', 'write')) {
      alert('You do not have permission to edit leads');
      return;
    }

    setCurrentLead(lead);

    const processedLead = { ...lead };
    if (processedLead.date_of_enquiry) {
      try {
        const date = new Date(processedLead.date_of_enquiry);
        if (!isNaN(date.getTime())) {
          processedLead.date_of_enquiry = date.toISOString().split('T')[0];
        }
      } catch (error) {
        window.log.warn('Could not parse date:', processedLead.date_of_enquiry);
        const now = new Date();
        processedLead.date_of_enquiry = now.toISOString().split('T')[0];
      }
    }

    setFormData(processedLead);
    setShowEditForm(true);
  };

  const openAssignForm = (lead) => {
    if (!window.hasPermission('leads', 'assign')) {
      alert('You do not have permission to assign leads');
      return;
    }
    setCurrentLead(lead);
    setFormData({ assigned_team: 'sales', assigned_to: '' });
    setShowAssignForm(true);
  };

  const openPaymentForm = (lead) => {
    setCurrentLead(lead);
    
    // Load stadiums if not already loaded (needed for venue country mapping)
    if (stadiums.length === 0) {
      window.fetchStadiums();
    }
    
    // ✅ NEW: Check for existing order and pre-load data
    // Debug: Find all orders for this lead
    const allOrdersForLead = orders.filter(order => 
      order.lead_id === lead.id && 
      order.status !== 'rejected'
    );
    
    console.log(`📋 Found ${allOrdersForLead.length} orders for lead ${lead.id}:`, allOrdersForLead);
    
    // Get the most recent order (highest timestamp or order number)
    const existingOrder = allOrdersForLead.length > 0 
      ? allOrdersForLead.reduce((latest, order) => {
          const latestTime = new Date(latest.created_date || latest.created_at || 0).getTime();
          const orderTime = new Date(order.created_date || order.created_at || 0).getTime();
          return orderTime > latestTime ? order : latest;
        })
      : null;

    let initialPaymentData;

    if (existingOrder) {
      // ✅ PRE-LOAD from existing order
      window.log.debug('💰 Pre-loading payment form from existing order:', existingOrder.id);
      window.log.debug('📍 Existing order event_location:', existingOrder.event_location);
      window.log.debug('🎾 Event name:', existingOrder.event_name || existingOrder.inventory_name || lead.lead_for_event);
      window.log.debug('👤 Customer type from order:', existingOrder.customer_type);
      
      // Log the entire existing order to debug customer_type
      window.log.debug('🔍 Existing order full data:', existingOrder);
      window.log.debug('🔍 Customer type value:', existingOrder.customer_type);
      
      initialPaymentData = {
        // Payment details
        payment_method: existingOrder.payment_method || '',
        transaction_id: existingOrder.transaction_id || '',
        payment_date: existingOrder.payment_date || new Date().toISOString().split('T')[0],
        advance_amount: existingOrder.advance_amount || existingOrder.payment_amount || '',
        payment_proof: existingOrder.payment_proof || null,
        
        // GST and Legal details (pre-filled from order)
        gstin: existingOrder.gstin || '',
        legal_name: existingOrder.legal_name || existingOrder.client_name || lead.name,
        category_of_sale: existingOrder.category_of_sale || 'Retail',
        type_of_sale: existingOrder.type_of_sale || 'Tour',
        registered_address: existingOrder.registered_address || '',
        indian_state: existingOrder.indian_state || 'Haryana',
        is_outside_india: existingOrder.is_outside_india || false,
        
        // Customer classification - Fix event_location mapping
        customer_type: existingOrder.customer_type || 'indian',
        event_location: (() => {
          // First check if existing order has event_location
          if (existingOrder.event_location) {
            if (existingOrder.event_location === 'domestic') return 'india';
            if (existingOrder.event_location === 'outside_india') return 'outside_india';
            if (existingOrder.event_location === 'india') return 'india';
            return existingOrder.event_location;
          }
          
          // If not, try to determine from venue/stadium
          let eventLocation = 'india'; // Default
          
          if ((lead.lead_for_event || existingOrder.event_name) && inventory && stadiums) {
            const eventName = existingOrder.event_name || existingOrder.inventory_name || lead.lead_for_event;
            const eventInventory = inventory.find(item => 
              item.event_name === eventName || 
              item.name === eventName
            );
            
            if (eventInventory && eventInventory.venue) {
              const venue = stadiums.find(s => 
                s.name === eventInventory.venue || 
                s.stadium_name === eventInventory.venue
              );
              
              if (venue && venue.country) {
                eventLocation = venue.country.toLowerCase() === 'india' ? 'india' : 'outside_india';
                window.log.debug('📍 Mapped event location from venue for existing order:', venue.name, venue.country, '->', eventLocation);
              }
            }
          }
          
          return eventLocation;
        })(),
        payment_currency: existingOrder.payment_currency || 'INR',
        exchange_rate: existingOrder.exchange_rate || 1,
        
        // Documents
        gst_certificate: existingOrder.gst_certificate || null,
        pan_card: existingOrder.pan_card || null,
        
        // Invoice items (pre-filled from order)
        invoice_items: existingOrder.invoice_items || [{
          description: lead.lead_for_event || 'Travel Package',
          additional_info: '',
          quantity: lead.number_of_people || 1,
          rate: lead.last_quoted_price || existingOrder.price_per_ticket || 0
        }],
        
        // Calculated fields
        gst_rate: existingOrder.gst_rate || 5,
        service_fee_amount: existingOrder.service_fee_amount || 0,
        tcs_applicable: existingOrder.tcs_calculation?.applicable || false,
        tcs_rate: existingOrder.tcs_calculation?.rate || 0,
        tcs_amount: existingOrder.tcs_calculation?.amount || 0,
        
        // Order context
        from_receivable: false,
        payment_post_service: false,
        receivable_id: null,
        receivable_amount: 0,
        updating_existing_order: true, // ✅ Flag to indicate this is an update
        existing_order_id: existingOrder.id
      };
      
    } else {
      // ✅ NEW order - use original logic
      window.log.debug('💰 Creating new payment form for lead:', lead.id);
      
      // Try to determine event location from venue/stadium
      let eventLocation = 'india'; // Default to India
      
      if (lead.lead_for_event && inventory && stadiums) {
        // Find the inventory item for this event
        const eventInventory = inventory.find(item => 
          item.event_name === lead.lead_for_event || 
          item.name === lead.lead_for_event
        );
        
        if (eventInventory && eventInventory.venue) {
          // Find the stadium/venue details
          const venue = stadiums.find(s => 
            s.name === eventInventory.venue || 
            s.stadium_name === eventInventory.venue
          );
          
          if (venue && venue.country) {
            // Map country to event location
            eventLocation = venue.country.toLowerCase() === 'india' ? 'india' : 'outside_india';
            window.log.debug('📍 Mapped event location from venue:', venue.name, venue.country, '->', eventLocation);
          }
        }
      }
      
      initialPaymentData = {
        payment_method: '',
        transaction_id: '',
        payment_date: new Date().toISOString().split('T')[0],
        advance_amount: '',
        payment_proof: null,
        gstin: '',
        legal_name: lead.name,
        category_of_sale: lead.business_type === 'B2B' ? 'Corporate' : 'Retail',
        type_of_sale: 'Tour',
        registered_address: lead.registered_address || '',
        indian_state: 'Haryana',
        is_outside_india: eventLocation === 'outside_india',
        customer_type: 'indian', // Default, user can change in form
        event_location: eventLocation,
        payment_currency: 'INR',
        exchange_rate: 1, // Default exchange rate for INR
        gst_certificate: null,
        pan_card: null,
        invoice_items: [{
          description: lead.lead_for_event || 'Travel Package',
          additional_info: '',
          quantity: lead.number_of_people || 1,
          rate: lead.last_quoted_price || 0
        }],
        gst_rate: 5,
        service_fee_amount: 0,
        from_receivable: false,
        payment_post_service: false,
        receivable_id: null,
        receivable_amount: 0,
        updating_existing_order: false, // ✅ Flag for new order
        existing_order_id: null
      };
    }
    
    // Calculate GST and TCS
    const baseAmount = initialPaymentData.invoice_items.reduce((sum, item) => 
      sum + ((item.quantity || 0) * (item.rate || 0)), 0
    );
    
    if (baseAmount > 0) {
      const calculation = window.calculateGSTAndTCS(baseAmount, initialPaymentData);
      initialPaymentData.tcs_applicable = calculation.tcs.applicable;
      initialPaymentData.tcs_rate = calculation.tcs.rate;
      initialPaymentData.tcs_amount = calculation.tcs.amount;
    }
    
    setPaymentData(initialPaymentData);
    setShowPaymentForm(true);
  };

const handleMarkPaymentFromReceivable = async (receivable) => {
  window.log.debug('Mark Payment clicked for receivable:', receivable);

  // Extract lead ID from various possible fields
  const leadId = receivable.lead_id || receivable.leadId || receivable.lead;

  // First attempt: Try to get lead ID from the receivable directly
  if (!leadId && receivable.order_id) {
    // If no direct lead ID, try to get it from the associated order
    const order = orders.find(o => o.id === receivable.order_id);
    if (order && order.lead_id) {
      // Found lead ID from order, now fetch the lead
      await fetchAndProcessLead(order.lead_id, receivable);
      return;
    }
  }

  if (!leadId) {
    window.log.error('No lead ID found in receivable:', receivable);
    alert('Cannot find associated lead for this receivable. Please ensure the receivable has a valid lead reference.');
    return;
  }

  // Always fetch from API instead of checking local state first
  // This ensures we get the most up-to-date lead data
  await fetchAndProcessLead(leadId, receivable);
};

// Helper function to fetch lead from API and process payment
const fetchAndProcessLead = async (leadId, receivable) => {
  try {
    window.log.debug('Fetching lead from API:', leadId);
    window.setLoading(true);
    
    const response = await window.apiCall(`/leads/${leadId}`);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    const leadData = response.data || response;
    
    if (!leadData || !leadData.id) {
      throw new Error('Invalid lead data received from API');
    }
    
    // Update local state with the fetched lead
    setCurrentLead(leadData);
    
    // Optionally, add this lead to the local leads array if it's not there
    // This helps with subsequent operations without needing to fetch again
    setLeads(prevLeads => {
      const exists = prevLeads.some(l => l.id === leadData.id);
      if (!exists) {
        return [...prevLeads, leadData];
      }
      return prevLeads;
    });
    
    // Open payment form with the fetched lead
    openPaymentForm(leadData);
    
    // Set payment data with receivable information
    // Note: openPaymentForm already set the payment data with proper event_location
    setPaymentData(prev => ({
      ...prev,
      payment_post_service: true,
      advance_amount: receivable.balance_amount || receivable.expected_amount || receivable.amount || '',
      from_receivable: true,
      receivable_id: receivable.id,
      receivable_amount: receivable.balance_amount || receivable.expected_amount || receivable.amount || 0
      // Preserve event_location that was set in openPaymentForm
    }));
    
    window.log.debug('Successfully opened payment form for lead:', leadData.name || leadData.company_name);
    
  } catch (error) {
    window.log.error('Error fetching lead:', error);
    
    // Provide more specific error messages
    if (error.message.includes('404')) {
      alert(`Lead not found. The lead associated with this receivable may have been deleted. Lead ID: ${leadId}`);
    } else if (error.message.includes('network')) {
      alert('Network error. Please check your connection and try again.');
    } else {
      alert(`Could not load lead information: ${error.message}`);
    }
  } finally {
    window.setLoading(false);
  }
};



  const openLeadDetail = (lead) => {
    setCurrentLead(lead);
    setShowLeadDetail(true);
  };

  const openAllocationForm = (inventoryItem) => {
    if (!window.hasPermission('inventory', 'allocate')) {
      alert('You do not have permission to allocate inventory');
      return;
    }
    setCurrentInventory(inventoryItem);
    setAllocationData({
      lead_id: '',
      tickets_allocated: 1,
      allocation_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowAllocationForm(true);
  };

  // In app-business-logic.js, add this function BEFORE the return handlers statement:

  // Function to open allocation management with data fetching
  const openAllocationManagement = async (inventoryItem) => {
    window.log.debug("👁️ openAllocationManagement called with:", inventoryItem?.event_name);
    
    try {
      setLoading(true);
      // REMOVED: Duplicate setAllocationManagementInventory - let utils/helpers.js handle it

      // CHANGED: Delegate to utils/helpers.js version to prevent duplicate fetches
      console.log("🔄 [APP-LOGIC] Delegating allocation fetch to utils/helpers.js version");
      console.log("🔍 [APP-LOGIC] Current window.openAllocationManagement:", typeof window.openAllocationManagement);
      console.log("🔍 [APP-LOGIC] window.openAllocationManagement._source:", window.openAllocationManagement?._source);
      console.log("🔍 [APP-LOGIC] window.openAllocationManagement._isAuthoritative:", window.openAllocationManagement?._isAuthoritative);
      console.log("🔍 [APP-LOGIC] This openAllocationManagement:", typeof openAllocationManagement);
      console.log("🔍 [APP-LOGIC] Are they the same?", window.openAllocationManagement === openAllocationManagement);
      
      // Release our loading state and delegate to the global version
      setLoading(false);
      
      // Call the global version which has React-safe timing
      if (window.openAllocationManagement && 
          window.openAllocationManagement !== openAllocationManagement &&
          window.openAllocationManagement._isAuthoritative) {
        console.log("✅ Calling authoritative global openAllocationManagement from:", window.openAllocationManagement._source);
        return await window.openAllocationManagement(inventoryItem);
      }
      
      // Fallback: Just show the modal without data but fetch allocations directly
      console.warn("⚠️ [APP-LOGIC] No authoritative global openAllocationManagement found, fetching allocations directly");
      
      // Use React-safe approach with requestAnimationFrame to prevent DOM conflicts
      requestAnimationFrame(async () => {
        try {
          const response = await window.apiCall(`/inventory/${inventoryItem.id}/allocations`);
          if (!response.error) {
            const rawAllocations = response.data?.allocations || [];
            console.log("🔍 [APP-LOGIC] Raw allocations fetched:", rawAllocations);
            
            const allocations = window.normalizeAllocationData ? 
              window.normalizeAllocationData(rawAllocations) : 
              rawAllocations;
            console.log("🔍 [APP-LOGIC] Normalized allocations:", allocations);
            
            // Use functional update to prevent conflicts
            if (window.setCurrentAllocations) {
              window.setCurrentAllocations(() => allocations);
            }
          } else {
            console.warn("⚠️ [APP-LOGIC] API returned error:", response.error);
            if (window.setCurrentAllocations) {
              window.setCurrentAllocations([]);
            }
          }
        } catch (error) {
          console.error('❌ [APP-LOGIC] Error fetching allocations directly:', error);
          if (window.setCurrentAllocations) {
            window.setCurrentAllocations([]);
          }
        }
      });
      
      // Show modal immediately
      setShowAllocationManagement(true);

    } catch (error) {
      window.log.error('❌ Error fetching allocations:', error);
      alert('Error fetching allocations: ' + error.message);
      
      // Still show modal but with empty allocations
      setCurrentAllocations([]);
      setShowAllocationManagement(true);
    } finally {
      setLoading(false);
    }
  };

  // REMOVED: Legacy handleUnallocate function - now handled by allocation-management.js only
  const handleUnallocate = null; // Placeholder to prevent undefined errors

  const openEditInventoryForm = (inventoryItem) => {
    if (!window.hasPermission('inventory', 'write')) {
      alert('You do not have permission to edit inventory');
      return;
    }
    setCurrentInventory(inventoryItem);
    setFormData(inventoryItem);
    setShowEditInventoryForm(true);
  };

  const handleEditInventory = async (inventoryData) => {
    try {
      setLoading(true);

      window.log.debug('Updating inventory with data:', inventoryData);

      const totalAmount = parseFloat(inventoryData.totalPurchaseAmount || 0);
      const amountPaid = parseFloat(inventoryData.amountPaid || 0);

      if (amountPaid > totalAmount) {
        alert('Amount paid cannot be greater than total purchase amount.');
        setLoading(false);
        return;
      }

      if (amountPaid >= totalAmount) {
        inventoryData.paymentStatus = 'paid';
      } else if (amountPaid > 0) {
        inventoryData.paymentStatus = 'partial';
      } else {
        inventoryData.paymentStatus = 'pending';
      }

      const response = await window.apiCall(`/inventory/${editingInventory.id}`, {
        method: 'PUT',
        body: JSON.stringify(inventoryData)
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setInventory(prev => prev.map(item => 
        item.id === editingInventory.id 
          ? { ...item, ...inventoryData }
          : item
      ));

      if (window.hasPermission('finance', 'read')) {
        await window.fetchFinancialData();
      }

      alert(response.message || 'Inventory updated successfully! Payables have been synced automatically.');
      setShowInventoryForm(false);
      setEditingInventory(null);

    } catch (error) {
      window.log.error('Error updating inventory:', error);
      alert('Failed to update inventory: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const openInventoryDetail = (inventoryItem) => {
    setCurrentInventoryDetail(inventoryItem);
    setShowInventoryDetail(true);
  };

  const closeInventoryDetail = () => {
    setShowInventoryDetail(false);
    setCurrentInventoryDetail(null);
  };

  const openAddInventoryForm = () => {
    window.log.debug('openAddInventoryForm called');

    if (stadiums.length === 0) {
      window.fetchStadiums();
    }

    setEditingInventory({ 
      id: null,
      event_name: '',
      event_date: '',
      event_type: '',
      sports: '',
      venue: '',
    });

    setFormData({
      event_name: '',
      event_date: '',
      event_type: '',
      sports: '',
      venue: '',
      day_of_match: '',
      category_of_ticket: '',
      total_tickets: '',
      available_tickets: '',
      mrp_of_ticket: '',
      buying_price: '',
      selling_price: '',
      stand: '',
      inclusions: '',
      booking_person: '',
      procurement_type: '',
      notes: '',
      paymentStatus: 'pending',
      supplierName: '',
      supplierInvoice: '',
      totalPurchaseAmount: '',
      purchase_currency: 'INR',
      purchase_exchange_rate: '1',
      amountPaid: '',
      paymentDueDate: '',
      form_ids: []  // ADD THIS LINE
    });

    setShowInventoryForm(true);
    window.log.debug('Inventory form should now be visible with empty form data');
  };

  const handleCopyInventory = async (item) => {
    try {
      setLoading(true);

      const copiedData = {
        ...item,
        id: undefined,
        created_date: undefined,
        updated_date: undefined,
        event_name: item.event_name + ' (Copy)',
        available_tickets: item.total_tickets,
        paymentStatus: 'pending',
        amountPaid: 0,
        supplierInvoice: '',
        created_by: JSON.parse(localStorage.getItem('crm_user') || '{}').name || 'Unknown User',
        notes: (item.notes || '') + (item.notes ? '\n\n' : '') + 'Copied from original inventory on ' + new Date().toLocaleDateString()
      };

      window.log.debug('Creating copy of inventory:', copiedData);

      const response = await window.apiCall('/inventory', {
        method: 'POST',
        body: JSON.stringify(copiedData)
      });

      if (response.error) {
        throw new Error(response.error);
      }

      window.log.info('Copy created successfully:', response.data);

      setInventory(prev => [...prev, response.data]);

      alert(`✅ Inventory copied successfully!\n\nNew event: "${copiedData.event_name}"\nTotal tickets: ${copiedData.total_tickets}\nAvailable tickets: ${copiedData.available_tickets}`);

    } catch (error) {
      window.log.error('Error copying inventory:', error);
      alert('❌ Failed to copy inventory: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const openDeliveryForm = (delivery) => {
    if (!window.hasPermission('delivery', 'write')) {
      alert('You do not have permission to manage deliveries');
      return;
    }
    setCurrentDelivery(delivery);
    setDeliveryFormData({
      delivery_type: delivery.delivery_type || 'offline',
      pickup_location: delivery.pickup_location || '',
      delivery_location: delivery.delivery_location || '',
      pickup_date: '',
      pickup_time: '',
      delivery_date: '',
      delivery_time: '',
      delivery_person: delivery.assigned_to || '',
      delivery_notes: '',
      online_platform: '',
      online_link: ''
    });
    setShowDeliveryForm(true);
  };

  const openPaymentPostServiceForm = (lead) => {
    if (!window.hasPermission('leads', 'write')) {
      alert('You do not have permission to manage payment post service');
      return;
    }
    setCurrentLead(lead);
    setPaymentPostServiceData({
      expected_payment_date: '',
      expected_amount: lead.last_quoted_price || 0,
      service_date: '',
      service_details: '',
      payment_terms: '30 days',
      reminder_days: '7',
      notes: ''
    });
    setShowPaymentPostServiceForm(true);
  };

  const handlePaymentPostServiceInputChange = (field, value) => {
    setPaymentPostServiceData(prev => ({ ...prev, [field]: value }));
  };

  const collectPostServicePayment = (receivable) => {
    const lead = leads.find(l => l.id === receivable.lead_id);
    if (lead) {
      setCurrentLead(lead);
      setPaymentData({
        ...paymentData,
        advance_amount: receivable.expected_amount,
        payment_post_service: true,
        from_receivable: true,
        receivable_id: receivable.id,
        receivable_amount: receivable.expected_amount || receivable.balance_amount || receivable.amount || 0
      });
      setShowPaymentForm(true);
    }
  };

  const sendEmailNotification = (notification) => {
    window.log.debug('Email Notification:', {
      to: notification.recipient,
      subject: notification.subject,
      body: notification.body,
      sent_at: new Date().toISOString()
    });

    setEmailNotifications(prev => 
      prev.map(n => 
        n.id === notification.id 
          ? { ...n, status: 'sent', sent_date: new Date().toISOString() }
          : n
      )
    );
  };

  const deleteDelivery = async (deliveryId) => {
    if (!window.hasPermission('delivery', 'write')) {
      alert('You do not have permission to delete deliveries');
      return;
    }

    if (!confirm('Are you sure you want to delete this delivery? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      await window.apiCall('/deliveries/' + (deliveryId), {
        method: 'DELETE'
      });

      setDeliveries(prev => prev.filter(d => d.id !== deliveryId));

      alert('Delivery deleted successfully!');
    } catch (error) {
      window.log.error('Failed to delete delivery:', error);
      alert('Failed to delete delivery. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  window.deleteDelivery = deleteDelivery;
  window.log.debug('🔍 deleteDelivery available:', typeof window.deleteDelivery === 'function');

  const closeForm = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    setShowAssignForm(false);
    setShowPaymentForm(false);
    setShowLeadDetail(false);
    setShowAllocationForm(false);
    setShowEditInventoryForm(false);
    setShowChoiceModal(false);
    setShowStatusProgressModal(false); // ✅ ADD: Close Status Progress Modal too
    setShowInvoicePreview(false);
    setShowDeliveryForm(false);
    setShowPaymentPostServiceForm(false);
    setCurrentForm('');
    setCurrentLead(null);
    setCurrentInventory(null);
    setCurrentLeadForChoice(null);
    setCurrentInvoice(null);
    setCurrentDelivery(null);
    setChoiceOptions([]);
    setStatusProgressOptions([]); // ✅ ADD: Clear Status Progress Options
    setFormData({});
    setPaymentData({});
    setAllocationData({});
    setDeliveryFormData({});
    setPaymentPostServiceData({});
  };

  const handleInputChange = (field, value, itemIndex = null, itemField = null) => {
    if (itemIndex !== null && itemField !== null) {
      window.updateInvoiceItem(itemIndex, itemField, value);
    } else {
      setPaymentData(prevData => ({
        ...prevData,
        [field]: value
      }));
    }
  };

  const handleFormDataChange = (field, value) => {
    window.log.debug('Form field changed:', field, '=', value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }; 

  const handleUserInputChange = (field, value) => {
    setUserFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAllocationInputChange = (field, value) => {
    setAllocationData(prev => ({ ...prev, [field]: value }));
  };

  const handleDeliveryInputChange = (field, value) => {
    setDeliveryFormData(prev => ({ ...prev, [field]: value }));
  };

  // ✅ ADD: openInvoicePreview function
  const openInvoicePreview = (invoice) => {
    window.log.debug('📄 Opening invoice preview for:', invoice);
    setCurrentInvoice(invoice);
    setShowInvoicePreview(true);
  };

  // Expose the function to window
  window.openInvoicePreview = openInvoicePreview;

  // ✅ RETURN ALL HANDLERS INCLUDING THE MISSING FORM HANDLER REFERENCES
  return {
    // ✅ CRITICAL SOPHISTICATED WORKFLOW FUNCTIONS RESTORED WITH PROPER MODAL SWITCHING
    handleLeadProgression,
    handleChoiceSelection,
    progressLead,
    editLead,
    deleteLead,
    assignLead,
    fetchUsers,
    fetchLeads,
    getStatusIcon,
    togglePremiumStatus, // ✅ NEW: Added togglePremiumStatus function
    
    // ✅ MISSING: ADD FORM HANDLER REFERENCES FROM window OBJECT
    handleOrderApproval: window.handleOrderApproval,           // ✅ FIX: Reference to window function
    handleFormSubmit: window.handleFormSubmit,                 // ✅ ADD: Universal form submit handler  
    handleEditOrderSubmit: window.handleEditOrderSubmit,       // ✅ ADD: Order edit handler
    handleAllocation: window.handleAllocation,                 // ✅ ADD: Allocation handler
    handleAssignLead: window.handleAssignLead,                 // ✅ ADD: Lead assignment handler
    handlePaymentPostService: window.handlePaymentPostService, // ✅ ADD: Payment post service handler
    handleDeliverySubmit: window.handleDeliverySubmit,         // ✅ ADD: Delivery submit handler
    handleUserSubmit: window.handleUserSubmit,                 // ✅ ADD: User submit handler
    handleBulkAssignSubmit: window.handleBulkAssignSubmit,     // ✅ ADD: Bulk assign handler
    handlePaymentSubmit: window.handlePaymentSubmit,           // ✅ ADD: Payment submit handler
    handlePaymentPostServiceSubmit: window.handlePaymentPostServiceSubmit, // ✅ ADD: Payment post service submit
    calculateGSTAndTCS: window.calculateGSTAndTCS,             // ✅ ADD: GST calculation utility
    openInvoicePreview: openInvoicePreview,                    // ✅ ADD: Invoice preview handler
    fetchFinancialData: window.fetchFinancialData, // ✅ Reference existing function from financials.js
    
    // ✅ ALL WORKING FUNCTIONS FROM ORIGINAL FILE
    openEditOrderForm,
    fetchClients,
    fetchUserRoles,
    fetchStadiums: async () => {
      try {
        const response = await window.apiCall('/stadiums');
        setStadiums(response.data || []);
        window.log.info('✅ Loaded', response.data?.length || 0, 'stadiums');
        return response.data || [];
      } catch (error) {
        window.log.error('❌ Error fetching stadiums:', error);
        setStadiums([]);
        return [];
      }
    },
    handleStatusFilterToggle,
    handleSelectAllStatuses,
    checkPhoneForClient,
    handlePhoneChange,
    applyClientSuggestion,
    handleClearAllStatuses,
    getStatusFilterDisplayText,
    openStadiumForm,
    closeStadiumForm,
    handleStadiumInputChange,
    fetchData,
    updateOrdersPagination,
    assignOrderToService,
    openOrderDetail,
    calculateDashboardStats,
    extractFiltersData,
    handleLogin,
    handleLogout,
    openUserManagement,
    openAddForm,
    openEditForm,
    openAssignForm,
    openPaymentForm,
    handleMarkPaymentFromReceivable,
    openLeadDetail,
    openAllocationForm,
    // Use global authoritative version if available, otherwise use local version
    openAllocationManagement: window.openAllocationManagement?._isAuthoritative ? 
      window.openAllocationManagement : 
      openAllocationManagement,
    // handleUnallocate: REMOVED - handled exclusively by allocation-management.js
    openEditInventoryForm,
    handleEditInventory,
    openInventoryDetail,
    closeInventoryDetail,
    openAddInventoryForm,
    handleCopyInventory,
    openDeliveryForm,
    openPaymentPostServiceForm,
    handlePaymentPostServiceInputChange,
    collectPostServicePayment,
    sendEmailNotification,
    deleteDelivery,
    closeForm,
    handleInputChange,
    handleFormDataChange,
    handleUserInputChange,
    handleAllocationInputChange,
    handleDeliveryInputChange
  };
};
