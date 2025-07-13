// Main App Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

window.renderMainApp = function() {
  const { useState, useEffect, useRef } = React;
  window.authToken = window.authToken || localStorage.getItem('crm_auth_token') || '';
  // ✅ ALSO UPDATE YOUR apiCall FUNCTION to use the window.authToken consistently
window.apiCall = window.apiCall || ((endpoint, options = {}) => {
  console.log("🌐 apiCall:", endpoint, options);
  const url = (window.API_CONFIG?.API_URL || window.API_URL) + endpoint;
  
  // ✅ FIX: Ensure authToken is always current from localStorage
  const authToken = localStorage.getItem('crm_auth_token') || window.authToken;
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authToken ? 'Bearer ' + authToken : '',
      ...options.headers
    }
  }).then(response => response.json());
});



  window.forceUpdate = () => {
  // This will be called from the fixed orders.js when filters change
  setOrdersFilters({...window.ordersFilters});
  setOrdersPagination({...window.ordersPagination});
  setOrdersSorting({...window.ordersSorting});
  setOrdersShowFilters(window.ordersShowFilters);
};
  
  // Extract all useState declarations
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [testMode, setTestMode] = useState(() => {
    return localStorage.getItem('testMode') === 'true';
  });
  const [user, setUser] = useState(null);
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('crm_active_tab');
    return savedTab || 'dashboard';
  });
  const [loading, setLoading] = useState(false);

  // Sync activeTab with window object for content router
  useEffect(() => {
    window.activeTab = activeTab;
    localStorage.setItem("crm_active_tab", activeTab);
  }, [activeTab]);
  const [leads, setLeads] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [editingInventory, setEditingInventory] = useState(null);
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [orders, setOrders] = useState([]);
  const [orderToAssign, setOrderToAssign] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [showReminderDashboard, setShowReminderDashboard] = useState(false);
  const [currentEventsPage, setCurrentEventsPage] = useState(1);
const [eventsPerPage, setEventsPerPage] = useState(10);
  const [reminderStats, setReminderStats] = useState({
    total: 0,
    overdue: 0,
    due_today: 0,
    pending: 0
  }); 
  const [sportsEvents, setSportsEvents] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [eventFormData, setEventFormData] = useState({
    title: "",
    date: "",
    time: "",
    venue: "",
    category: "cricket",
    description: "",
    ticket_available: false,
    fantopark_package: ""
  });
  const [calendarView, setCalendarView] = useState("month");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showOrderAssignModal, setShowOrderAssignModal] = useState(false);
  const [showAllocationManagement, setShowAllocationManagement] = React.useState(false);
  const [showInventoryDetail, setShowInventoryDetail] = useState(false);
  const [currentInventoryDetail, setCurrentInventoryDetail] = useState(null);
  const [currentAllocations, setCurrentAllocations] = React.useState([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [inventoryEventTypeFilter, setInventoryEventTypeFilter] = useState('all');
  const [inventorySortField, setInventorySortField] = useState('event_date');
  const [inventorySortDirection, setInventorySortDirection] = useState('desc');
  const [allocationManagementInventory, setAllocationManagementInventory] = React.useState(null);
  const [leadsSourceFilter, setLeadsSourceFilter] = useState('all');
  const [leadsBusinessTypeFilter, setLeadsBusinessTypeFilter] = useState('all');
  const [leadsEventFilter, setLeadsEventFilter] = useState('all');
  const [leadsSortField, setLeadsSortField] = useState('date_of_enquiry');
  const [leadsSortDirection, setLeadsSortDirection] = useState('desc');
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [bulkAssignSelections, setBulkAssignSelections] = useState({});
  const [bulkAssignLoading, setBulkAssignLoading] = useState(false);
  const [selectedStatusFilters, setSelectedStatusFilters] = useState([]);
  const [showStatusFilterDropdown, setShowStatusFilterDropdown] = useState(false);
  const statusDropdownRef = React.useRef(null);
  const [stadiums, setStadiums] = useState([]);
  const [showStadiumForm, setShowStadiumForm] = useState(false);
  const [editingStadium, setEditingStadium] = useState(null);
  const [stadiumFormData, setStadiumFormData] = useState({});
  const [stadiumSortField, setStadiumSortField] = useState('name');
  const [stadiumSortDirection, setStadiumSortDirection] = useState('asc');
  const [stadiumSearchQuery, setStadiumSearchQuery] = useState('');
  const [stadiumSportFilter, setStadiumSportFilter] = useState('all');
  const [dynamicRoles, setDynamicRoles] = useState({});
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const [viewMode, setViewMode] = useState('leads');
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientDetail, setShowClientDetail] = useState(false);
  const [phoneCheckLoading, setPhoneCheckLoading] = useState(false);
  const [clientSuggestion, setClientSuggestion] = useState(null);
  const [showClientSuggestion, setShowClientSuggestion] = useState(false);
  const [phoneCheckTimeout, setPhoneCheckTimeout] = useState(null);
  const [showStatusProgressModal, setShowStatusProgressModal] = useState(false);
  const [statusProgressOptions, setStatusProgressOptions] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [uploadPreview, setUploadPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [proceedAfterPreview, setProceedAfterPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [clientDetectionResults, setClientDetectionResults] = useState([]);
  const [showClientDetectionResults, setShowClientDetectionResults] = useState(false);
  const [calendarFilters, setCalendarFilters] = React.useState({});
  const [showImportModal, setShowImportModal] = React.useState(false);
  const [paymentData, setPaymentData] = useState({
    legal_name: '',
    gstin: '',
    registered_address: '',
    category_of_sale: 'Corporate',
    type_of_sale: 'Tour',
    indian_state: 'Haryana',
    is_outside_india: false,
    customer_type: 'indian',
    event_location: 'india',
    payment_currency: 'INR',
    advance_amount: '',
    payment_method: 'bank_transfer',
    transaction_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_proof: '',
    notes: '',
    gst_certificate: '',
    pan_card: '',
    invoice_items: [{
      description: '',
      additional_info: '',
      quantity: 1,
      rate: 0
    }],
    service_fee_amount: '',
    gst_rate: 5,
    tcs_applicable: false,
    tcs_rate: 5,
    tcs_amount: 0,
    tcs_rate_editable: true,
  });

  // Additional state variables
  const [invoices, setInvoices] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [receivables, setReceivables] = useState([]);
  const [emailNotifications, setEmailNotifications] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [myLeads, setMyLeads] = useState([]);
  const [myQuoteRequested, setMyQuoteRequested] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [myReceivables, setMyReceivables] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showQuoteUploadModal, setShowQuoteUploadModal] = useState(false);
  const [quoteUploadData, setQuoteUploadData] = useState({ notes: '', pdf: null });
  const [selectedOrderForAssignment, setSelectedOrderForAssignment] = useState(null);
  const [showOrderAssignmentModal, setShowOrderAssignmentModal] = useState(false);
  const [showEditOrderForm, setShowEditOrderForm] = useState(false);
  const [currentOrderForEdit, setCurrentOrderForEdit] = useState(null);
  const [orderEditData, setOrderEditData] = useState({});
  const [inventoryDueDateFilter, setInventoryDueDateFilter] = useState('all');
  const [inventoryEventFilter, setInventoryEventFilter] = useState('all');
  const [currentLeadsPage, setCurrentLeadsPage] = useState(1);
  const [currentInventoryPage, setCurrentInventoryPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [currentOrderDetail, setCurrentOrderDetail] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showLeadDetail, setShowLeadDetail] = useState(false);
  const [showAllocationForm, setShowAllocationForm] = useState(false);
  const [showEditInventoryForm, setShowEditInventoryForm] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [roles, setRoles] = useState([]);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [rolesInitialized, setRolesInitialized] = useState(false);
  const [financialData, setFinancialData] = useState({
    activeSales: [],
    sales: [],
    receivables: [],
    payables: [],
    expiringInventory: []
  });
  const [financialFilters, setFinancialFilters] = useState({
    clientName: '',
    assignedPerson: '',
    dateFrom: '',
    dateTo: '',
    status: 'all',
    expiringDays: 7,
  });
  // ✅ FIX: Change default from 'sales' to 'activesales' to match financials.js tabs
  const [activeFinancialTab, setActiveFinancialTab] = useState('activesales');
  const [financialStats, setFinancialStats] = useState({
    totalSales: 0,
    totalReceivables: 0,
    totalPayables: 0,
    expiringValue: 0
  });
  const [editingRole, setEditingRole] = useState(null);
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    label: '',
    description: '',
    permissions: {
        dashboard: { read: false, write: false, delete: false, manage_users: false },
        leads: { read: false, write: false, delete: false, assign: false, progress: false },
        inventory: { read: false, write: false, delete: false, allocate: false },
        orders: { read: false, write: false, delete: false, approve: false, assign: false },
        finance: { read: false, write: false, delete: false, approve: false },
        delivery: { read: false, write: false, delete: false },
        stadiums: { read: false, write: false, delete: false },  // ✅ ADD THIS LINE
        users: { read: false, write: false, delete: false, manage_roles: false }
    }
  });
  const [editingUser, setEditingUser] = useState(null);
  const [showCSVUploadModal, setShowCSVUploadModal] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [csvUploadType, setCSVUploadType] = useState('');
  const [currentForm, setCurrentForm] = useState('');
  const [currentLead, setCurrentLead] = useState(null);
  const [currentInventory, setCurrentInventory] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('crm_dark_mode') === 'true';
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [allocationData, setAllocationData] = useState({});
  const [userFormData, setUserFormData] = useState({});
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [currentDelivery, setCurrentDelivery] = useState(null);
  const [deliveryFormData, setDeliveryFormData] = useState({});
  const [showPaymentPostServiceForm, setShowPaymentPostServiceForm] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [paymentPostServiceData, setPaymentPostServiceData] = useState({});
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [currentLeadForChoice, setCurrentLeadForChoice] = useState(null);
  const [choiceOptions, setChoiceOptions] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalLeads: 0,
    activeDeals: 0,
    thisMonthRevenue: 0,
    pendingDeliveries: 0,
    inventoryValue: 0
  });
  const [dashboardFilter, setDashboardFilter] = useState('overall');
  const [selectedSalesPerson, setSelectedSalesPerson] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [events, setEvents] = useState([]);
  const [salesPeople, setSalesPeople] = useState([]);
  const [chartInstances, setChartInstances] = useState({
    leadSplit: null,
    tempCount: null,
    tempValue: null
  });

  // Orders filtering state
const [ordersFilters, setOrdersFilters] = useState({
  searchQuery: '',
  statusFilter: 'all',
  assignedToFilter: 'all',
  eventFilter: 'all',
  dateFromFilter: '',
  dateToFilter: '',
  clientFilter: '',
  orderNumberFilter: '',
  paymentStatusFilter: 'all'
});

// Orders pagination state
const [ordersPagination, setOrdersPagination] = useState({
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 0,
  totalPages: 0
});

// Orders sorting state
const [ordersSorting, setOrdersSorting] = useState({
  sortField: 'created_date',
  sortDirection: 'desc'
});

// Orders UI state
const [ordersShowFilters, setOrdersShowFilters] = useState(false);

  // Make state available globally for other components
  window.appState = {
    isLoggedIn, setIsLoggedIn,
    testMode, setTestMode,
    user, setUser,
    email, setEmail,
    password, setPassword,
    activeTab, setActiveTab,
    loading, setLoading,
      ordersFilters, setOrdersFilters,
  ordersPagination, setOrdersPagination,
  ordersSorting, setOrdersSorting,
  ordersShowFilters, setOrdersShowFilters,
    leads, setLeads,
    inventory, setInventory,
    editingInventory, setEditingInventory,
    showInventoryForm, setShowInventoryForm,
    orders, setOrders,
    orderToAssign, setOrderToAssign,
    reminders, setReminders,
    showReminderDashboard, setShowReminderDashboard,
    reminderStats, setReminderStats,
    sportsEvents, setSportsEvents,
    showEventForm, setShowEventForm,
    showEventDetail, setShowEventDetail,
    currentEvent, setCurrentEvent,
    eventFormData, setEventFormData,
    calendarView, setCalendarView,
    selectedDate, setSelectedDate,
    showOrderAssignModal, setShowOrderAssignModal,
    showAllocationManagement, setShowAllocationManagement,
    showInventoryDetail, setShowInventoryDetail,
    currentInventoryDetail, setCurrentInventoryDetail,
    currentAllocations, setCurrentAllocations,
    showOrderForm, setShowOrderForm,
    inventoryEventTypeFilter, setInventoryEventTypeFilter,
    inventorySortField, setInventorySortField,
    inventorySortDirection, setInventorySortDirection,
    allocationManagementInventory, setAllocationManagementInventory,
    leadsSourceFilter, setLeadsSourceFilter,
    leadsBusinessTypeFilter, setLeadsBusinessTypeFilter,
    leadsEventFilter, setLeadsEventFilter,
    leadsSortField, setLeadsSortField,
    leadsSortDirection, setLeadsSortDirection,
    showBulkAssignModal, setShowBulkAssignModal,
    bulkAssignSelections, setBulkAssignSelections,
    bulkAssignLoading, setBulkAssignLoading,
    selectedStatusFilters, setSelectedStatusFilters,
    showStatusFilterDropdown, setShowStatusFilterDropdown,
    statusDropdownRef,
    stadiums, setStadiums,
    showStadiumForm, setShowStadiumForm,
    editingStadium, setEditingStadium,
    stadiumFormData, setStadiumFormData,
    stadiumSortField, setStadiumSortField,
    stadiumSortDirection, setStadiumSortDirection,
    stadiumSearchQuery, setStadiumSearchQuery,
    stadiumSportFilter, setStadiumSportFilter,
    dynamicRoles, setDynamicRoles,
    viewMode, setViewMode,
    rolesLoaded, setRolesLoaded,
    clients, setClients,
    clientsLoading, setClientsLoading,
    selectedClient, setSelectedClient,
    showClientDetail, setShowClientDetail,
    phoneCheckLoading, setPhoneCheckLoading,
    clientSuggestion, setClientSuggestion,
    showClientSuggestion, setShowClientSuggestion,
    phoneCheckTimeout, setPhoneCheckTimeout,
    showStatusProgressModal, setShowStatusProgressModal,
    statusProgressOptions, setStatusProgressOptions,
    selectedStatus, setSelectedStatus,
    followUpDate, setFollowUpDate,
    followUpNotes, setFollowUpNotes,
    uploadPreview, setUploadPreview,
    showPreview, setShowPreview,
    proceedAfterPreview, setProceedAfterPreview,
    previewLoading, setPreviewLoading,
    clientDetectionResults, setClientDetectionResults,
    showClientDetectionResults, setShowClientDetectionResults,
    calendarFilters, setCalendarFilters,
    showImportModal, setShowImportModal,
    paymentData, setPaymentData,
    invoices, setInvoices,
    deliveries, setDeliveries,
    receivables, setReceivables,
    emailNotifications, setEmailNotifications,
    allUsers, setAllUsers,
    users, setUsers,
    myActionsFilters, setMyActionsFilters,
  myActionsPagination, setMyActionsPagination,
    myLeads, setMyLeads,
    myQuoteRequested, setMyQuoteRequested,
    myOrders, setMyOrders,
    myDeliveries, setMyDeliveries,
    myReceivables, setMyReceivables,
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    showOrderDetail, setShowOrderDetail,
    selectedOrderForAssignment, setSelectedOrderForAssignment,
    showOrderAssignmentModal, setShowOrderAssignmentModal,
    showEditOrderForm, setShowEditOrderForm,
    currentOrderForEdit, setCurrentOrderForEdit,
    orderEditData, setOrderEditData,
    inventoryDueDateFilter, setInventoryDueDateFilter,
    inventoryEventFilter, setInventoryEventFilter,
    currentLeadsPage, setCurrentLeadsPage,
    currentInventoryPage, setCurrentInventoryPage,
    itemsPerPage,
    currentOrderDetail, setCurrentOrderDetail,
    showAddForm, setShowAddForm,
    showEditForm, setShowEditForm,
    showAssignForm, setShowAssignForm,
    showPaymentForm, setShowPaymentForm,
    showLeadDetail, setShowLeadDetail,
    showAllocationForm, setShowAllocationForm,
    showEditInventoryForm, setShowEditInventoryForm,
    showUserManagement, setShowUserManagement,
    showUserForm, setShowUserForm,
    roles, setRoles,
    showRoleForm, setShowRoleForm,
    rolesInitialized, setRolesInitialized,
    financialData, setFinancialData,
    financialFilters, setFinancialFilters,
    activeFinancialTab, setActiveFinancialTab,
    financialStats, setFinancialStats,
    editingRole, setEditingRole,
    roleFormData, setRoleFormData,
    editingUser, setEditingUser,
    showCSVUploadModal, setShowCSVUploadModal,
    availableRoles, setAvailableRoles,
    csvUploadType, setCSVUploadType,
    currentForm, setCurrentForm,
    currentLead, setCurrentLead,
    currentInventory, setCurrentInventory,
    darkMode, setDarkMode,
    currentUser, setCurrentUser,
    formData, setFormData,
    allocationData, setAllocationData,
    userFormData, setUserFormData,
    showInvoicePreview, setShowInvoicePreview,
    currentInvoice, setCurrentInvoice,
    showDeliveryForm, setShowDeliveryForm,
    currentDelivery, setCurrentDelivery,
    deliveryFormData, setDeliveryFormData,
    showPaymentPostServiceForm, setShowPaymentPostServiceForm,
    showHelpGuide, setShowHelpGuide,
    paymentPostServiceData, setPaymentPostServiceData,
    showChoiceModal, setShowChoiceModal,
    currentLeadForChoice, setCurrentLeadForChoice,
    choiceOptions, setChoiceOptions,
    dashboardStats, setDashboardStats,
    dashboardFilter, setDashboardFilter,
    selectedSalesPerson, setSelectedSalesPerson,
    selectedEvent, setSelectedEvent,
    events, setEvents,
    salesPeople, setSalesPeople,
    chartInstances, setChartInstances,
    setCurrentEventsPage,
setEventsPerPage,
currentEventsPage,
eventsPerPage,
  };

  window.inventorySearchQuery = inventorySearchQuery;
window.setInventorySearchQuery = setInventorySearchQuery;

  // ✅ EXPOSE INANCIAL VARIABLES DIRECTLY TO WINDOW (for financials.js component)
  window.activeFinancialTab = activeFinancialTab;
  window.setActiveFinancialTab = setActiveFinancialTab;
  window.financialFilters = financialFilters;
  window.setFinancialFilters = setFinancialFilters;
  window.financialData = financialData;
  window.setFinancialData = setFinancialData;
  window.financialStats = financialStats;
  window.setFinancialStats = setFinancialStats;
  window.setShowReminderForm = setShowReminderForm;
window.showReminderForm = showReminderForm;
  window.ordersFilters = ordersFilters;
window.setOrdersFilters = setOrdersFilters;
window.ordersPagination = ordersPagination;
window.setOrdersPagination = setOrdersPagination;
window.ordersSorting = ordersSorting;
window.setOrdersSorting = setOrdersSorting;
window.ordersShowFilters = ordersShowFilters;
window.setOrdersShowFilters = setOrdersShowFilters;
  window.setShowQuoteUploadModal = setShowQuoteUploadModal;
window.setQuoteUploadData = setQuoteUploadData;
window.showQuoteUploadModal = showQuoteUploadModal;
window.quoteUploadData = quoteUploadData;

  // Return the state object to be used by App component
  window.setViewMode = setViewMode;
  return window.appState;
};

console.log('✅ Main App Component loaded successfully');
