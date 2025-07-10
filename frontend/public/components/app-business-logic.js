// App Business Logic Handlers for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

window.renderAppBusinessLogic = function() {
  
  // Access app state
  const state = window.appState;
  if (!state) {
    console.error('App state not available');
    return {};
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
    choiceOptions, setChoiceOptions, userFormData, setUserFormData, showUserForm, setShowUserForm
  } = state;

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
      const response = await window.apicall('/clients');
      setClients(response.data || []);
      console.log(`Fetched ${response.data?.length || 0} clients`);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      alert('Failed to load clients: ' + error.message);
    } finally {
      setClientsLoading(false);
    }
  };

  const fetchUserRoles = async () => {
    try {
      const response = await window.apicall('/roles');
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
      console.error('Failed to fetch roles:', error);
      setDynamicRoles(window.USER_ROLES);
      setRolesLoaded(true);
    }
  };

  const handleStatusFilterToggle = (status) => {
    setSelectedStatusFilters(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  const handleSelectAllStatuses = () => {
    if (selectedStatusFilters.length === Object.keys(window.LEAD_STATUSES).length) {
      setSelectedStatusFilters([]);
    } else {
      setSelectedStatusFilters(Object.keys(window.LEAD_STATUSES));
    }
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
      const response = await window.apicall(`/leads/check-phone/${normalizedPhone}`);
      if (response.exists && response.suggestion) {
        setClientSuggestion(response.suggestion);
        setShowClientSuggestion(true);
      } else {
        setClientSuggestion(null);
        setShowClientSuggestion(false);
      }
    } catch (error) {
      console.error('Error checking phone:', error);
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

  const fetchData = async () => {
    if (!state.isLoggedIn || !authToken) return;
    try {
      const [leadsData, inventoryData, ordersData, invoicesData, deliveriesData, clientsData] = await Promise.all([
        window.apicall('/leads').catch(() => ({ data: [] })),
        window.apicall('/inventory').catch(() => ({ data: [] })),
        window.apicall('/orders').catch(() => ({ data: [] })),
        window.apicall('/invoices').catch(() => ({ data: [] })),
        window.apicall('/deliveries').catch(() => ({ data: [] })),
        window.apicall('/clients').catch(() => ({ data: [] }))
      ]);
      setLeads(leadsData.data || []);
      setInventory(inventoryData.data || []);
      setOrders(ordersData.data || []);
      setInvoices(invoicesData.data || []);
      setDeliveries(deliveriesData.data || []);
      setClients(clientsData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
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

      await window.apicall('/orders/' + (orderId), {
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
          const deliveryResponse = await window.apicall('/deliveries', {
            method: 'POST',
            body: JSON.stringify(newDelivery)
          });
          if (deliveryResponse && deliveryResponse.data && deliveryResponse.data.id) {
            setDeliveries(prev => prev.map(d => 
              d.id === newDelivery.id ? { ...d, id: deliveryResponse.data.id } : d
            ));
          }
        } catch (error) {
          console.error('Failed to save delivery to backend:', error);
        }
      }

      alert('Order assigned to ' + (assignee) + ' successfully!');
    } catch (error) {
      console.error('Error assigning order:', error);
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
    window.debugLog('LOGIN_START', { email: state.email, timestamp: Date.now() });
    e.preventDefault();
    setLoading(true);

    try {
      const response = await window.apicall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: state.email, password: state.password })
      });

      if (response.token && response.user) {
        authToken = response.token;
        localStorage.setItem('crm_auth_token', response.token);
        localStorage.setItem('crm_user', JSON.stringify(response.user));
        setUser(response.user);
        setCurrentUser(response.user);
        setIsLoggedIn(true);
        await fetchUserRoles();
        setUsers([]);
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      console.error("Login failed:", error.message || "Invalid credentials");
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
      authToken = null;
    } catch (e) {
      console.log('Failed to clear auth state:', e);
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
        console.warn('Could not parse date:', processedLead.date_of_enquiry);
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
    if (!window.hasPermission('leads', 'write')) {
      alert('You do not have permission to manage payments');
      return;
    }
    
    setCurrentLead(lead);
    
    const initialPaymentData = {
      advance_amount: '',
      payment_method: 'bank_transfer',
      transaction_id: '',
      payment_date: new Date().toISOString().split('T')[0],
      payment_proof: '',
      notes: '',
      customer_type: 'indian',
      event_location: 'india',
      payment_currency: 'INR',
      tcs_applicable: false,
      tcs_rate: 5,
      tcs_amount: 0,
      tcs_rate_manual: false,
      gstin: lead.gstin || '',
      legal_name: lead.legal_name || lead.name || '',
      category_of_sale: lead.business_type === 'B2B' ? 'Corporate' : 'Retail',
      type_of_sale: 'Tour',
      registered_address: lead.registered_address || '',
      indian_state: 'Haryana',
      is_outside_india: false,
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
      receivable_amount: 0
    };
    
    const baseAmount = lead.last_quoted_price * (lead.number_of_people || 1) || 0;
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
    console.log('Mark Payment clicked for receivable:', receivable);

    const leadId = receivable.lead_id || receivable.leadId || receivable.lead;

    if (!leadId) {
      if (receivable.order_id) {
        const order = orders.find(o => o.id === receivable.order_id);
        if (order && order.lead_id) {
          const lead = leads.find(l => l.id === order.lead_id);
          if (lead) {
            setCurrentLead(lead);
            openPaymentForm(lead);
            setPaymentData(prev => ({
              ...prev,
              payment_post_service: true,
              advance_amount: receivable.balance_amount || receivable.expected_amount || receivable.amount || '',
              from_receivable: true,
              receivable_id: receivable.id,
              receivable_amount: receivable.balance_amount || receivable.expected_amount || receivable.amount || 0
            }));
            return;
          }
        }
      }

      alert('Cannot find associated lead for this receivable.');
      console.error('Receivable structure:', receivable);
      return;
    }

    const lead = leads.find(l => l.id === leadId);

    if (!lead) {
      try {
        console.log('Fetching lead from API:', leadId);
        const response = await window.apicall('/leads/' + leadId);
        const leadData = response.data || response;

        setCurrentLead(leadData);
        openPaymentForm(leadData);
        setPaymentData(prev => ({
          ...prev,
          payment_post_service: true,
          advance_amount: receivable.balance_amount || receivable.expected_amount || receivable.amount || '',
          from_receivable: true,
          receivable_id: receivable.id,
          receivable_amount: receivable.balance_amount || receivable.expected_amount || receivable.amount || 0
        }));
      } catch (error) {
        console.error('Error fetching lead:', error);
        alert('Could not find associated lead: ' + error.message);
      }
    } else {
      setCurrentLead(lead);
      openPaymentForm(lead);
      setPaymentData(prev => ({
        ...prev,
        payment_post_service: true,
        advance_amount: receivable.balance_amount || receivable.expected_amount || receivable.amount || '',
        from_receivable: true,
        receivable_id: receivable.id,
        receivable_amount: receivable.balance_amount || receivable.expected_amount || receivable.amount || 0
      }));
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

      console.log('Updating inventory with data:', inventoryData);

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

      const response = await window.apicall(`/inventory/${editingInventory.id}`, {
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
      console.error('Error updating inventory:', error);
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
    console.log('openAddInventoryForm called');

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
      amountPaid: '',
      paymentDueDate: ''
    });

    setShowInventoryForm(true);
    console.log('Inventory form should now be visible with empty form data');
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

      console.log('Creating copy of inventory:', copiedData);

      const response = await window.apicall('/inventory', {
        method: 'POST',
        body: JSON.stringify(copiedData)
      });

      if (response.error) {
        throw new Error(response.error);
      }

      console.log('Copy created successfully:', response.data);

      setInventory(prev => [...prev, response.data]);

      alert(`✅ Inventory copied successfully!\n\nNew event: "${copiedData.event_name}"\nTotal tickets: ${copiedData.total_tickets}\nAvailable tickets: ${copiedData.available_tickets}`);

    } catch (error) {
      console.error('Error copying inventory:', error);
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
    console.log('Email Notification:', {
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
      await window.apicall('/deliveries/' + (deliveryId), {
        method: 'DELETE'
      });

      setDeliveries(prev => prev.filter(d => d.id !== deliveryId));

      alert('Delivery deleted successfully!');
    } catch (error) {
      console.error('Failed to delete delivery:', error);
      alert('Failed to delete delivery. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeForm = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    setShowAssignForm(false);
    setShowPaymentForm(false);
    setShowLeadDetail(false);
    setShowAllocationForm(false);
    setShowEditInventoryForm(false);
    setShowChoiceModal(false);
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
    console.log('Form field changed:', field, '=', value);
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

  // Return all handlers
  return {
    openEditOrderForm,
    fetchClients,
    fetchUserRoles,
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

console.log('✅ App Business Logic Handlers loaded successfully');
