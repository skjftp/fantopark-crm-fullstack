// Main App Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

window.renderMainApp = function() {
  const { useState, useEffect, useRef } = React;
  window.authToken = window.authToken || localStorage.getItem('crm_auth_token') || '';
  window.forceUpdate = () => {
    // Generic force update function that triggers React re-render
    try {
      // Update orders filters if available
      if (setOrdersFilters && window.ordersFilters) {
        setOrdersFilters({...window.ordersFilters});
      }
      if (setOrdersPagination && window.ordersPagination) {
        setOrdersPagination({...window.ordersPagination});
      }
      if (setOrdersSorting && window.ordersSorting) {
        setOrdersSorting({...window.ordersSorting});
      }
      if (setOrdersShowFilters !== undefined && window.ordersShowFilters !== undefined) {
        setOrdersShowFilters(window.ordersShowFilters);
      }
      
      // Force allocation form re-render by updating a dummy state
      if (window.allocationFormState) {
        const timestamp = Date.now();
        window.allocationFormState._timestamp = timestamp;
      }
      
      console.log('🔄 Force update triggered');
    } catch (error) {
      console.error('❌ Error in forceUpdate:', error);
    }
  };
  
  // Extract all useState declarations
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [user, setUser] = useState(null);
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('crm_active_tab');
    return savedTab || 'dashboard';
  });
  const [loading, setLoading] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);
  const [tabLoadingMessage, setTabLoadingMessage] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Add resize listener for mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync activeTab with window object for content router
  useEffect(() => {
    window.activeTab = activeTab;
    localStorage.setItem("crm_active_tab", activeTab);
  }, [activeTab]);
  const [leads, setLeads] = useState([]);
  const [allLeadsForAllocation, setAllLeadsForAllocation] = useState([]);
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
  // Add these NEW state variables for leads pagination
const [leadsPagination, setLeadsPagination] = useState({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false
});

const [leadsFilterOptions, setLeadsFilterOptions] = useState({
  sources: [],
  businessTypes: [],
  events: [],
  users: [],
  statuses: []
});  
// Add this state for tracking if we're using paginated mode
const [usePaginatedLeads, setUsePaginatedLeads] = useState(
  localStorage.getItem('usePaginatedLeads') === 'true'
);
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
  const [showFinanceInvoiceModal, setShowFinanceInvoiceModal] = useState(false);
const [currentOrderForInvoice, setCurrentOrderForInvoice] = useState(null);
const [financeInvoiceNumber, setFinanceInvoiceNumber] = useState('');
  const [calendarView, setCalendarView] = useState("month");
  const [myActionsFilters, setMyActionsFilters] = useState({
  searchQuery: '',
  statusFilter: 'all',
  priorityFilter: 'all'
});

// My Actions pagination state  
const [myActionsPagination, setMyActionsPagination] = useState({
  leads: { currentPage: 1, itemsPerPage: 5 },
  orders: { currentPage: 1, itemsPerPage: 5 },
  deliveries: { currentPage: 1, itemsPerPage: 5 },
  quotes: { currentPage: 1, itemsPerPage: 5 },
  receivables: { currentPage: 1, itemsPerPage: 5 }
});

  const [financialPagination, setFinancialPagination] = useState({
  activesales: { currentPage: 1, itemsPerPage: 10 },
  sales: { currentPage: 1, itemsPerPage: 10 },
  receivables: { currentPage: 1, itemsPerPage: 10 },
  payables: { currentPage: 1, itemsPerPage: 10 },
  expiring: { currentPage: 1, itemsPerPage: 10 }
});
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showOrderAssignModal, setShowOrderAssignModal] = useState(false);
  const [showAllocationManagement, setShowAllocationManagement] = React.useState(false);
  const [showInventoryDetail, setShowInventoryDetail] = useState(false);
  const [currentInventoryDetail, setCurrentInventoryDetail] = useState(null);
  const [expandedInventoryItems, setExpandedInventoryItems] = useState(new Set());
  const [currentAllocations, setCurrentAllocations] = React.useState([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [inventoryEventTypeFilter, setInventoryEventTypeFilter] = useState('all');
  const [inventorySortField, setInventorySortField] = useState('event_date');
  const [inventorySortDirection, setInventorySortDirection] = useState('desc');
  const [allocationManagementInventory, setAllocationManagementInventory] = React.useState(null);
  const [showReassignModal, setShowReassignModal] = React.useState(false);
  const [selectedAllocation, setSelectedAllocation] = React.useState(null);
  const [availableOrders, setAvailableOrders] = React.useState([]);
  const [leadsSourceFilter, setLeadsSourceFilter] = useState('all');
  const [leadsBusinessTypeFilter, setLeadsBusinessTypeFilter] = useState('all');
  const [leadsEventFilter, setLeadsEventFilter] = useState('all');
  const [leadsSortField, setLeadsSortField] = useState('created_date');
  const [leadsSortDirection, setLeadsSortDirection] = useState('desc');
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [bulkAssignSelections, setBulkAssignSelections] = useState({});
  const [bulkAssignLoading, setBulkAssignLoading] = useState(false);
  const [selectedStatusFilters, setSelectedStatusFilters] = useState([]);
  const [showStatusFilterDropdown, setShowStatusFilterDropdown] = useState(false);
  const [leadsSalesPersonFilter, setLeadsSalesPersonFilter] = useState('all');
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
  const [isMobileView, setIsMobileView] = React.useState(window.innerWidth <= 768);
  const [selectedStadiumForNotes, setSelectedStadiumForNotes] = React.useState(null);
const [showStadiumNotesModal, setShowStadiumNotesModal] = React.useState(false);
  const [showStadiumImageLightbox, setShowStadiumImageLightbox] = React.useState(false);
  // Mobile menu state
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
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
  const [selectedOrder, setSelectedOrder] = useState(null);
const [showJourneyGenerator, setShowJourneyGenerator] = useState(false);
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
  // Check localStorage on initialization
  const savedDarkMode = localStorage.getItem('crm_dark_mode');
  const isDark = savedDarkMode === 'true';
  
  // Apply the dark class immediately on initialization
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  return isDark;
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
  const [showSalesPersonEditModal, setShowSalesPersonEditModal] = useState(false);
  const [currentOrderForSalesPersonEdit, setCurrentOrderForSalesPersonEdit] = useState(null);
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
  window.setShowStadiumImageLightbox = setShowStadiumImageLightbox;
  window.setSelectedStadiumForNotes = setSelectedStadiumForNotes;
window.setShowStadiumNotesModal = setShowStadiumNotesModal;

  window.leadsSalesPersonFilter = leadsSalesPersonFilter;
window.setLeadsSalesPersonFilter = setLeadsSalesPersonFilter;
  window.isMobileView = isMobileView;
window.setIsMobileView = setIsMobileView;
  window.appState = {
    isLoggedIn, setIsLoggedIn,
    user, setUser,
    email, setEmail,
    password, setPassword,
    activeTab, setActiveTab,
    loading, setLoading,
    tabLoading, setTabLoading,
    tabLoadingMessage, setTabLoadingMessage,
    isMobile, setIsMobile,
      ordersFilters, setOrdersFilters,
  ordersPagination, setOrdersPagination,
  ordersSorting, setOrdersSorting,
  ordersShowFilters, setOrdersShowFilters,
    leads, setLeads,
    allLeadsForAllocation, setAllLeadsForAllocation,
    inventory, setInventory,
    inventorySearchQuery, setInventorySearchQuery,
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
    showReassignModal, setShowReassignModal,
    selectedAllocation, setSelectedAllocation,
    availableOrders, setAvailableOrders,
    leadsSourceFilter, setLeadsSourceFilter,
    leadsBusinessTypeFilter, setLeadsBusinessTypeFilter,
    leadsEventFilter, setLeadsEventFilter,
    leadsSortField, setLeadsSortField,
    leadsFilterOptions, setLeadsFilterOptions,
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
    leadsPagination, setLeadsPagination,
usePaginatedLeads, setUsePaginatedLeads,
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
    expandedInventoryItems, setExpandedInventoryItems,
    showStadiumImageLightbox, setShowStadiumImageLightbox,
    roles, setRoles,
    showRoleForm, setShowRoleForm,
    rolesInitialized, setRolesInitialized,
    financialData, setFinancialData,
    financialFilters, setFinancialFilters,
    activeFinancialTab, setActiveFinancialTab,
    financialStats, setFinancialStats,
    selectedOrder, setSelectedOrder,
showJourneyGenerator, setShowJourneyGenerator,
    editingRole, setEditingRole,
    roleFormData, setRoleFormData,
    editingUser, setEditingUser,
    showCSVUploadModal, setShowCSVUploadModal,
    leadsSalesPersonFilter, setLeadsSalesPersonFilter,
    selectedStadiumForNotes, setSelectedStadiumForNotes,
showStadiumNotesModal, setShowStadiumNotesModal,
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
    showSalesPersonEditModal, setShowSalesPersonEditModal,
    currentOrderForSalesPersonEdit, setCurrentOrderForSalesPersonEdit,
    dashboardStats, setDashboardStats,
    dashboardFilter, setDashboardFilter,
    selectedSalesPerson, setSelectedSalesPerson,
    selectedEvent, setSelectedEvent,
    events, setEvents,
    salesPeople, setSalesPeople,
    chartInstances, setChartInstances,
    setCurrentEventsPage,
    showFinanceInvoiceModal, setShowFinanceInvoiceModal,
currentOrderForInvoice, setCurrentOrderForInvoice,
financeInvoiceNumber, setFinanceInvoiceNumber,
setEventsPerPage,
currentEventsPage,
eventsPerPage,
    financialPagination, setFinancialPagination,
    isMobileMenuOpen, setIsMobileMenuOpen,
    showMobileMenu, setShowMobileMenu,
    showMobileFilters, setShowMobileFilters,
  };

  // Stadium Notes Modal Helper Functions
window.openStadiumNotesModal = (stadium) => {
  window.appState.selectedStadiumForNotes = stadium;
  window.appState.showStadiumNotesModal = true;
  if (window.setSelectedStadiumForNotes) {
    window.setSelectedStadiumForNotes(stadium);
  }
  if (window.setShowStadiumNotesModal) {
    window.setShowStadiumNotesModal(true);
  }
};

window.closeStadiumNotesModal = () => {
  window.appState.selectedStadiumForNotes = null;
  window.appState.showStadiumNotesModal = false;
  if (window.setSelectedStadiumForNotes) {
    window.setSelectedStadiumForNotes(null);
  }
  if (window.setShowStadiumNotesModal) {
    window.setShowStadiumNotesModal(false);
  }
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
  window.showFinanceInvoiceModal = showFinanceInvoiceModal;
window.setShowFinanceInvoiceModal = setShowFinanceInvoiceModal;
window.currentOrderForInvoice = currentOrderForInvoice;
window.setCurrentOrderForInvoice = setCurrentOrderForInvoice;
window.financeInvoiceNumber = financeInvoiceNumber;
window.setFinanceInvoiceNumber = setFinanceInvoiceNumber;
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
window.setShowSalesPersonEditModal = setShowSalesPersonEditModal;
window.showSalesPersonEditModal = showSalesPersonEditModal;
window.setCurrentOrderForSalesPersonEdit = setCurrentOrderForSalesPersonEdit;
window.currentOrderForSalesPersonEdit = currentOrderForSalesPersonEdit;

  // Return the state object to be used by App component
  window.setViewMode = setViewMode;
  return window.appState;
};

console.log('✅ Main App Component loaded successfully');
