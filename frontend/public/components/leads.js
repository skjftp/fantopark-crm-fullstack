// Complete Updated leads.js File with Proper React Components
// Simplified version - Only uses paginated backend API

const spinnerStyles = React.createElement('style', {}, `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`);

// Initialize global filter states (for persistence between view switches)
window.clientSearchQuery = window.clientSearchQuery || '';
window.clientStatusFilter = window.clientStatusFilter || 'all';
window.clientAssignedFilter = window.clientAssignedFilter || 'all';
window.clientMultiLeadFilter = window.clientMultiLeadFilter || 'all';
window.leadsSalesPersonFilter = window.leadsSalesPersonFilter || 'all';

// Replace the initialization section in your leads.js with this:

// Initialize paginated mode only
const initializePaginatedMode = () => {
  if (!window.leadsInitialized) {
    window.leadsInitialized = true;
    
    // Function to safely initialize when everything is ready
    const safeInitialize = () => {
      // Check all required dependencies INCLUDING login status
      const dependenciesReady = 
        window.appState && 
        window.LeadsAPI && 
        window.appState.setLeads &&
        window.appState.setLeadsPagination &&
        typeof window.appState.setLeadsFilterOptions === 'function' &&
        (window.isLoggedIn || window.appState?.isLoggedIn); // ADD THIS CHECK
      
      if (dependenciesReady) {
        window.log.info('🚀 Initializing leads module - all dependencies ready and user logged in');
        
        // IMPORTANT: Clear any existing leads data to prevent showing all leads
        window.appState.setLeads([]);
        
        // Initialize filter options state
        window.appState.setLeadsFilterOptions = window.appState.setLeadsFilterOptions || (() => {
          window.appState.leadsFilterOptions = arguments[0];
        });
        
        // Set initial pagination state
        window.appState.setLeadsPagination({
          page: 1,
          totalPages: 1,
          total: 0,
          hasNext: false,
          hasPrev: false,
          perPage: 20
        });
        
        // Fetch paginated data and filter options ONLY if logged in
        window.log.info('📋 Fetching initial paginated data...');
        window.LeadsAPI.fetchPaginatedLeads({ page: 1 });
        window.LeadsAPI.fetchFilterOptions();
      } else {
        // Log what's missing
        if (!window.appState) window.log.debug('Waiting for appState...');
        if (!window.LeadsAPI) window.log.debug('Waiting for LeadsAPI...');
        if (!window.appState?.setLeads) window.log.debug('Waiting for setLeads...');
        if (!window.isLoggedIn && !window.appState?.isLoggedIn) window.log.debug('Waiting for user login...');
        
        // Retry after a short delay
        setTimeout(safeInitialize, 500);
      }
    };
    
    // Start initialization process
    setTimeout(safeInitialize, 1000);
  }
};

// Don't run initialization on DOM ready - let it be triggered after login
// Comment out or remove these lines:
// if (document.readyState === 'loading') {
//   document.addEventListener('DOMContentLoaded', initializePaginatedMode);
// } else {
//   setTimeout(initializePaginatedMode, 500);
// }

// Instead, expose the initialization function to be called after login
window.initializeLeadsModule = initializePaginatedMode;

const ClientViewContent = () => {
  console.log("🔍 Rendering Production Client View Content");

  // React hooks for filter states - this ensures proper updates
  const [localClientSearchQuery, setLocalClientSearchQuery] = React.useState(window.clientSearchQuery || '');
  const [localClientStatusFilter, setLocalClientStatusFilter] = React.useState(window.clientStatusFilter || 'all');
  const [localClientAssignedFilter, setLocalClientAssignedFilter] = React.useState(window.clientAssignedFilter || 'all');
  const [localClientMultiLeadFilter, setLocalClientMultiLeadFilter] = React.useState(window.clientMultiLeadFilter || 'all');

  // Update global values when local state changes
  React.useEffect(() => { window.clientSearchQuery = localClientSearchQuery; }, [localClientSearchQuery]);
  React.useEffect(() => { window.clientStatusFilter = localClientStatusFilter; }, [localClientStatusFilter]);
  React.useEffect(() => { window.clientAssignedFilter = localClientAssignedFilter; }, [localClientAssignedFilter]);
  React.useEffect(() => { window.clientMultiLeadFilter = localClientMultiLeadFilter; }, [localClientMultiLeadFilter]);

// Pagination state
const [clientsPage, setClientsPage] = React.useState(1);
const [clientsPagination, setClientsPagination] = React.useState({
    page: 1,
    totalPages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false,
    perPage: 20
});

// State Variable Extraction from window globals - MOVED UP
const {
    clientsLoading = window.clientsLoading || window.appState?.clientsLoading || false,
    clients = window.clients || window.appState?.clients || [],
} = window.appState || {};

// ADDED: Debug effect to see pagination state - NOW AFTER clients is defined
React.useEffect(() => {
    console.log('📊 Current pagination state:', {
        page: clientsPage,
        totalPages: clientsPagination.totalPages,
        total: clientsPagination.total,
        hasNext: clientsPagination.hasNext,
        perPage: clientsPagination.perPage,
        clientsLength: clients.length
    });
}, [clientsPagination, clientsPage, clients.length]);

// Make pagination setter available globally
React.useEffect(() => {
    if (!window.appState) window.appState = {};
    window.appState.setClientsPagination = setClientsPagination;
    console.log('✅ ClientsPagination setter registered');
}, []);

React.useEffect(() => {
    // Create a function to check and sync pagination
    const syncPagination = () => {
        if (window.appState?.clientsPagination) {
            const appPagination = window.appState.clientsPagination;
            // Only update if values actually changed
            setClientsPagination(prev => {
                if (prev.total !== appPagination.total || 
                    prev.totalPages !== appPagination.totalPages ||
                    prev.page !== appPagination.page) {
                    console.log('📥 Syncing pagination from appState:', appPagination);
                    return { ...appPagination };
                }
                return prev;
            });
        }
    };

    // Set up an interval to check for updates
    const interval = setInterval(syncPagination, 100);
    
    // Also sync immediately
    syncPagination();
    
    return () => clearInterval(interval);
}, []); // Empty dependency array
// Store total clients count globally
React.useEffect(() => {
    if (clientsPagination.total > 0) {
        window.appState.totalClients = clientsPagination.total;
    }
}, [clientsPagination.total]);

// Initial mount effect
React.useEffect(() => {
    let mounted = true;
    let initialFetchDone = false;
    
    const initializeClients = async () => {
        if (!window.ClientsAPI || !window.appState?.isLoggedIn || initialFetchDone) {
            return;
        }
        
        console.log('📋 Component mounted, fetching initial clients...');
        initialFetchDone = true;
        
        // Reset to page 1
        setClientsPage(1);
        window.ClientsAPI.currentPage = 1;
        
        try {
            const response = await window.ClientsAPI.fetchPaginatedClients({ page: 1 });
            
            if (mounted && response.success) {
                console.log('✅ Initial clients loaded');
                
                // Force update pagination state
                if (window.appState?.clientsPagination) {
                    const pagination = window.appState.clientsPagination;
                    console.log('📊 Setting initial pagination:', pagination);
                    setClientsPagination({
                        page: pagination.page || 1,
                        totalPages: pagination.totalPages || 1,
                        total: pagination.total || 0,
                        hasNext: pagination.hasNext || false,
                        hasPrev: pagination.hasPrev || false,
                        perPage: pagination.perPage || 20
                    });
                }
            }
        } catch (error) {
            console.error('Failed to load initial clients:', error);
        }
    };
    
    // Delay slightly to ensure all state setters are registered
    setTimeout(initializeClients, 100);
    
    return () => {
        mounted = false;
    };
}, []); // Only on mount

React.useEffect(() => {
    if (!window.ClientsAPI || !window.appState?.isLoggedIn || clientsPage === 0) {
        return;
    }
    
    // Skip if this is the initial render
    const isInitialRender = clientsPage === 1 && clientsPagination.total === 0;
    if (isInitialRender) {
        console.log('⏩ Skipping initial render fetch');
        return;
    }
    
    console.log('📋 Page changed to:', clientsPage);
    
    // Use debouncing to prevent rapid calls
    const timeoutId = setTimeout(() => {
        window.ClientsAPI.fetchPaginatedClients({ page: clientsPage });
    }, 100);
    
    return () => clearTimeout(timeoutId);
}, [clientsPage]); // Only watch clientsPage


React.useEffect(() => {
    const handlePaginationUpdate = (event) => {
        console.log('📨 Received pagination update event:', event.detail);
        setClientsPagination({ ...event.detail });
    };
    
    window.addEventListener('clientsPaginationUpdated', handlePaginationUpdate);
    
    return () => {
        window.removeEventListener('clientsPaginationUpdated', handlePaginationUpdate);
    };
}, []);
    
  // Function References with fallbacks
  const setViewMode = window.setViewMode || (() => {
    console.warn("⚠️ setViewMode not implemented");
  });
  const setSelectedClient = window.setSelectedClient || (() => {
    console.warn("⚠️ setSelectedClient not implemented");
  });
  const setShowClientDetail = window.setShowClientDetail || (() => {
    console.warn("⚠️ setShowClientDetail not implemented");
  });
  const hasPermission = window.hasPermission || (() => {
    console.warn("⚠️ hasPermission not implemented");
    return false;
  });

  console.log("📊 Client View - clientsLoading:", clientsLoading, "clients count:", clients.length);

  if (clientsLoading) {
    return React.createElement('div', { className: 'text-center py-12' },
      React.createElement('div', { className: 'text-gray-500' }, 'Loading clients...')
    );
  }

  if (clients.length === 0 && clientsPage === 1) {
    return React.createElement('div', { className: 'bg-white rounded-lg shadow-sm border p-8 text-center' },
      React.createElement('div', { className: 'text-gray-500 text-lg mb-2' }, 'No clients found'),
      React.createElement('p', { className: 'text-gray-400' }, 'Clients will appear here when you have leads with phone numbers'),
      React.createElement('div', { className: 'mt-4' },
        React.createElement('button', {
          onClick: () => setViewMode('leads'),
          className: 'text-blue-600 hover:text-blue-800 underline'
        }, 'Go to Lead View to create leads')
      )
    );
  }

  // Helper function to get unique sales persons from clients
  const getUniqueSalesPersonsFromClients = () => {
    const assignedEmails = new Set();
    
    clients.forEach(client => {
      if (client.assigned_to && client.assigned_to.trim()) {
        assignedEmails.add(client.assigned_to);
      }
    });
    
    const salesPersons = Array.from(assignedEmails)
      .map(email => window.users?.find(user => user.email === email))
      .filter(user => user && user.status === 'active')
      .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));
    
    return salesPersons;
  };

  // Apply filters to clients using local state values
  let filteredClients = [...clients];
  
  // Search filter
  if (localClientSearchQuery) {
    const query = localClientSearchQuery.toLowerCase();
    filteredClients = filteredClients.filter(client => {
      const primaryLead = client.leads && client.leads[0] ? client.leads[0] : {
        name: client.name || 'Unknown',
        phone: client.phone || client.client_phone || 'No Phone',
        email: client.email || 'No Email'
      };
      
      return (primaryLead.name && primaryLead.name.toLowerCase().includes(query)) ||
             (primaryLead.phone && primaryLead.phone.includes(query)) ||
             (primaryLead.email && primaryLead.email.toLowerCase().includes(query));
    });
  }
  
  // Status filter
  if (localClientStatusFilter !== 'all') {
    filteredClients = filteredClients.filter(client => 
      (client.status || 'active') === localClientStatusFilter
    );
  }
  
  // Assigned to filter
  if (localClientAssignedFilter !== 'all') {
    if (localClientAssignedFilter === 'unassigned') {
      filteredClients = filteredClients.filter(client => !client.assigned_to);
    } else {
      filteredClients = filteredClients.filter(client => client.assigned_to === localClientAssignedFilter);
    }
  }

  // Multi-Lead Filter
  if (localClientMultiLeadFilter === 'multi') {
    filteredClients = filteredClients.filter(client => 
      client.total_leads > 1 || (client.leads && client.leads.length > 1)
    );
  } else if (localClientMultiLeadFilter === 'single') {
    filteredClients = filteredClients.filter(client => 
      client.total_leads === 1 || (client.leads && client.leads.length === 1) || 
      (!client.total_leads && (!client.leads || client.leads.length <= 1))
    );
  }

  return React.createElement('div', { className: 'space-y-6' },

    // Filters Section with Multi-Lead Filter
    React.createElement('div', { className: 'bg-white p-6 rounded-lg shadow-md border' },
      React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 'Filters & Search'),
      
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-5 gap-4' },
        // Search Box (working with local state)
        React.createElement('div', { className: 'col-span-2' },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Search'),
          React.createElement('input', {
            type: 'text',
            value: localClientSearchQuery,
            onChange: (e) => setLocalClientSearchQuery(e.target.value),
            placeholder: 'Search by name, phone, or email...',
            className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
          })
        ),
        
        // Status Filter (working with local state)
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Status'),
          React.createElement('select', {
            value: localClientStatusFilter,
            onChange: (e) => setLocalClientStatusFilter(e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
          },
            React.createElement('option', { value: 'all' }, 'All Statuses'),
            React.createElement('option', { value: 'active' }, 'Active'),
            React.createElement('option', { value: 'inactive' }, 'Inactive'),
            React.createElement('option', { value: 'converted' }, 'Converted'),
            React.createElement('option', { value: 'dropped' }, 'Dropped')
          )
        ),
        
        // Assigned To Filter (working with local state)
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Sales Person'),
          React.createElement('select', {
            value: localClientAssignedFilter,
            onChange: (e) => setLocalClientAssignedFilter(e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
          },
            React.createElement('option', { value: 'all' }, 'All Sales Persons'),
            React.createElement('option', { value: 'unassigned' }, 'Unassigned'),
            ...getUniqueSalesPersonsFromClients().map(user => 
              React.createElement('option', { 
                key: user.id, 
                value: user.email 
              }, user.name || user.email)
            )
          )
        ),
        
        // Multi-Lead Filter (working with local state)
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Lead Count'),
          React.createElement('select', {
            value: localClientMultiLeadFilter,
            onChange: (e) => setLocalClientMultiLeadFilter(e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
          },
            React.createElement('option', { value: 'all' }, 'All Clients'),
            React.createElement('option', { value: 'multi' }, 'Multi-Lead Clients'),
            React.createElement('option', { value: 'single' }, 'Single Lead Clients')
          )
        )
      ),
      
      // Filter Summary - FIXED: Show correct counts
      React.createElement('div', { className: 'mt-4 flex justify-between items-center' },
        React.createElement('span', { className: 'text-sm text-gray-600' },
          `Showing ${clients.length} of ${clientsPagination.total || 0} clients (Page ${clientsPage} of ${clientsPagination.totalPages || 1})`
        ),
        (localClientSearchQuery || localClientStatusFilter !== 'all' || 
         localClientAssignedFilter !== 'all' || localClientMultiLeadFilter !== 'all') &&
        React.createElement('button', {
          onClick: () => {
            setLocalClientSearchQuery('');
            setLocalClientStatusFilter('all');
            setLocalClientAssignedFilter('all');
            setLocalClientMultiLeadFilter('all');
          },
          className: 'text-sm text-blue-600 hover:text-blue-800 underline'
        }, 'Clear All Filters')
      )
    ),

    // Client Statistics Summary
    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-4' },
      React.createElement('div', { className: 'bg-blue-50 border border-blue-200 rounded-lg p-4' },
        React.createElement('div', { className: 'text-2xl font-bold text-blue-900' }, 
          clientsPagination.total || window.appState?.clientsPagination?.total || 0
        ),
        React.createElement('div', { className: 'text-sm text-blue-700' }, 'Total Clients')
      ),
      React.createElement('div', { className: 'bg-green-50 border border-green-200 rounded-lg p-4' },
        React.createElement('div', { className: 'text-2xl font-bold text-green-900' }, 
          filteredClients.filter(c => c.total_leads > 1).length
        ),
        React.createElement('div', { className: 'text-sm text-green-700' }, 'Multi-Lead Clients (This Page)')
      ),
      React.createElement('div', { className: 'bg-purple-50 border border-purple-200 rounded-lg p-4' },
        React.createElement('div', { className: 'text-2xl font-bold text-purple-900' }, 
          filteredClients.reduce((sum, c) => sum + (c.total_leads || 1), 0)
        ),
        React.createElement('div', { className: 'text-sm text-purple-700' }, 'Total Leads (This Page)')
      ),
      React.createElement('div', { className: 'bg-orange-50 border border-orange-200 rounded-lg p-4' },
        React.createElement('div', { className: 'text-2xl font-bold text-orange-900' }, 
          '₹' + filteredClients.reduce((sum, c) => sum + (parseFloat(c.total_value) || 0), 0).toLocaleString()
        ),
        React.createElement('div', { className: 'text-sm text-orange-700' }, 'Total Value (This Page)')
      )
    ),

    // Client Table
    React.createElement('div', { className: 'bg-white rounded-lg shadow-sm border overflow-hidden' },
      React.createElement('div', { className: 'px-6 py-4 border-b border-gray-200 bg-gray-50' },
        React.createElement('h3', { className: 'text-lg font-medium text-gray-900' }, 'Clients Overview'),
        React.createElement('p', { className: 'text-sm text-gray-600 mt-1' }, 
          'Leads grouped by phone number - Click to see complete client timeline'
        )
      ),
      React.createElement('div', { className: 'overflow-x-auto' },
        React.createElement('table', { className: 'w-full' },
          React.createElement('thead', { className: 'bg-gray-50' },
            React.createElement('tr', null,
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Client'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Leads'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Events'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Assigned To'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Status'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Value'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
            )
          ),
          React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
            filteredClients.map(client => {
              const primaryLead = client.leads && client.leads[0] ? client.leads[0] : {
                name: client.name || 'Unknown',
                phone: client.phone || client.client_phone || 'No Phone',
                email: client.email || 'No Email'
              };
              
              // Get assigned user for display
              const assignedUser = window.users?.find(u => u.email === client.assigned_to);
              
              return React.createElement('tr', { key: client.client_id || client.phone || Math.random(), className: 'hover:bg-gray-50' },
                React.createElement('td', { className: 'px-6 py-4' },
                  React.createElement('div', { 
                    className: 'cursor-pointer hover:text-blue-600',
                    onClick: () => {
                      console.log("🔍 Client clicked:", client);
                      setSelectedClient(client);
                      setShowClientDetail(true);
                    }
                  },
                    React.createElement('div', { className: 'text-sm font-medium text-gray-900 hover:text-blue-600' }, 
                      primaryLead.name
                    ),
                    React.createElement('div', { className: 'text-sm text-gray-500' }, primaryLead.phone),
                    React.createElement('div', { className: 'text-xs text-gray-400' }, 
                      `First contact: ${new Date(client.first_contact || client.created_date || Date.now()).toLocaleDateString()}`
                    )
                  )
                ),
                React.createElement('td', { className: 'px-6 py-4' },
                  React.createElement('div', { className: 'flex items-center' },
                    React.createElement('span', { 
                      className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (client.total_leads > 1 || (client.leads && client.leads.length > 1)) ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`
                    }, 
                      client.total_leads || (client.leads ? client.leads.length : 1),
                      (client.total_leads > 1 || (client.leads && client.leads.length > 1)) && React.createElement('span', { className: 'ml-1' }, '🔗')
                    )
                  )
                ),
                React.createElement('td', { className: 'px-6 py-4' },
                  React.createElement('div', { className: 'text-sm text-gray-900' },
                    client.events && client.events.length > 0 ? client.events.slice(0, 2).join(', ') : '-'
                  ),
                  client.events && client.events.length > 2 && React.createElement('div', { className: 'text-xs text-gray-500' },
                    `+${client.events.length - 2} more`
                  )
                ),
                React.createElement('td', { className: 'px-6 py-4 text-sm text-gray-900' },
                  assignedUser ? assignedUser.name || assignedUser.email : 'Unassigned'
                ),
                React.createElement('td', { className: 'px-6 py-4' },
                  React.createElement('span', { 
                    className: `px-2 py-1 text-xs rounded-full ${
                      client.status === 'converted' ? 'bg-green-100 text-green-800' :
                      client.status === 'dropped' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`
                  }, client.status || 'active')
                ),
                React.createElement('td', { className: 'px-6 py-4 text-sm text-gray-900' },
                  client.total_value ? `₹${(parseFloat(client.total_value) || 0).toLocaleString()}` : '-'
                ),
                React.createElement('td', { className: 'px-6 py-4 text-sm font-medium space-x-2' },
                  React.createElement('button', {
                    onClick: () => {
                      console.log("📋 View Timeline clicked for client:", client);
                      setSelectedClient(client);
                      setShowClientDetail(true);
                    },
                    className: 'text-blue-600 hover:text-blue-900'
                  }, 'View Timeline'),
                  hasPermission('leads', 'assign') && (client.total_leads > 1 || (client.leads && client.leads.length > 1)) &&
                    React.createElement('button', {
                      onClick: () => {
                        alert(`Bulk reassign for ${client.total_leads || client.leads.length} leads coming in next update!`);
                      },
                      className: 'text-green-600 hover:text-green-900 ml-2'
                    }, 'Reassign All')
                )
              );
            })
          )
        )
      )
    ),

    // Pagination Controls - FIXED: Improved visibility and display
    React.createElement('div', { className: 'bg-white rounded-lg shadow-sm border p-4' },
      React.createElement('div', { className: 'flex items-center justify-between' },
        // Left side - showing info - FIXED: Show correct range
        React.createElement('div', { className: 'text-sm text-gray-600' },
          clientsPagination.total > 0 ? 
            `Showing ${Math.min(clients.length, clientsPagination.perPage)} of ${clientsPagination.total} clients (Page ${clientsPage} of ${clientsPagination.totalPages})` :
            'No clients to display'
        ),
        
        // Right side - pagination controls - FIXED: Show when total > perPage OR totalPages > 1
        (clientsPagination.total > clientsPagination.perPage || clientsPagination.totalPages > 1) && 
        React.createElement('div', { className: 'flex items-center gap-2' },
          // Previous button
          React.createElement('button', {
            onClick: () => {
              const newPage = Math.max(1, clientsPage - 1);
              console.log('⬅️ Previous clicked, going to page:', newPage);
              setClientsPage(newPage);
            },
            disabled: clientsPage <= 1,
            className: 'px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
          }, 'Previous'),
          
          // Page numbers
          (() => {
            const totalPages = clientsPagination.totalPages || Math.ceil(clientsPagination.total / clientsPagination.perPage) || 1;
            const currentPage = clientsPage;
            const pages = [];
            
            console.log('📄 Generating page numbers:', { totalPages, currentPage });
            
            // Generate page numbers with proper logic
            const generatePageNumbers = () => {
              const pageNumbers = [];
              const maxVisible = 7; // Maximum number of page buttons to show
              
              if (totalPages <= maxVisible) {
                // Show all pages if total is small
                for (let i = 1; i <= totalPages; i++) {
                  pageNumbers.push(i);
                }
              } else {
                // Always show first page
                pageNumbers.push(1);
                
                // Calculate range around current page
                let startPage = Math.max(2, currentPage - 2);
                let endPage = Math.min(totalPages - 1, currentPage + 2);
                
                // Add ellipsis if needed before range
                if (startPage > 2) {
                  pageNumbers.push('...');
                }
                
                // Add pages in range
                for (let i = startPage; i <= endPage; i++) {
                  pageNumbers.push(i);
                }
                
                // Add ellipsis if needed after range
                if (endPage < totalPages - 1) {
                  pageNumbers.push('...');
                }
                
                // Always show last page
                if (totalPages > 1) {
                  pageNumbers.push(totalPages);
                }
              }
              
              return pageNumbers;
            };
            
            const pageNumbers = generatePageNumbers();
            
            return pageNumbers.map((pageNum, index) => {
              if (pageNum === '...') {
                return React.createElement('span', { 
                  key: `ellipsis-${index}`, 
                  className: 'px-2 text-gray-400' 
                }, '...');
              }
              
              return React.createElement('button', {
                key: pageNum,
                onClick: () => {
                  console.log('📄 Page', pageNum, 'clicked');
                  setClientsPage(pageNum);
                },
                className: `px-3 py-1 border rounded ${
                  currentPage === pageNum ? 
                  'bg-blue-500 text-white' : 
                  'hover:bg-gray-100'
                }`
              }, pageNum.toString());
            });
          })(),
          
          // Next button
          React.createElement('button', {
            onClick: () => {
              const totalPages = clientsPagination.totalPages || Math.ceil(clientsPagination.total / clientsPagination.perPage) || 1;
              const newPage = Math.min(totalPages, clientsPage + 1);
              console.log('➡️ Next clicked, going to page:', newPage);
              setClientsPage(newPage);
            },
            disabled: !clientsPagination.hasNext && clientsPage >= clientsPagination.totalPages,
            className: 'px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
          }, 'Next')
        )
      )
    )
  );
};

// Wrap the component in a function that creates the React element
window.renderClientViewContent = function() {
  return React.createElement(ClientViewContent);
};

console.log('✅ Production Client View component loaded successfully with working filters');

// Lead View Component - SIMPLIFIED VERSION
const LeadsContent = () => {
    // React hook for sales person filter
    const [localLeadsSalesPersonFilter, setLocalLeadsSalesPersonFilter] = React.useState(window.leadsSalesPersonFilter || 'all');
  // Loader component
const LoadingOverlay = () => {
    return React.createElement('div', {
        style: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '0.5rem',
            zIndex: 10
        }
    },
        React.createElement('div', {
            style: {
                textAlign: 'center'
            }
        },
            // Spinner
            React.createElement('div', {
                style: {
                    width: '40px',
                    height: '40px',
                    margin: '0 auto',
                    border: '3px solid #e5e7eb',
                    borderTopColor: '#3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }
            }),
            // Text
            React.createElement('p', {
                style: {
                    marginTop: '1rem',
                    color: '#4b5563',
                    fontSize: '14px',
                    fontWeight: '500'
                }
            }, 'Loading...')
        )
    );
};
    
    // Update global value when local state changes
    React.useEffect(() => {
      window.leadsSalesPersonFilter = localLeadsSalesPersonFilter;
    }, [localLeadsSalesPersonFilter]);

    // Helper function: Get next status options for a lead
    const getLeadProgressionOptions = (lead) => {
        const currentStatus = lead.status;
        const statusConfig = window.LEAD_STATUSES[currentStatus];
        
        if (!statusConfig || !statusConfig.next) {
            return [];
        }
        
        return statusConfig.next.map(nextStatus => ({
            status: nextStatus,
            label: window.LEAD_STATUSES[nextStatus]?.label || nextStatus,
            color: window.LEAD_STATUSES[nextStatus]?.color || 'bg-gray-100 text-gray-800'
        }));
    };

    // Use the sophisticated handleLeadProgression from app-business-logic.js
    const handleLeadProgressionClick = (lead) => {
        console.log("🔄 Lead progression clicked for:", lead.name, "Current status:", lead.status);
        
        if (window.handleLeadProgression && typeof window.handleLeadProgression === 'function') {
            console.log("✅ Using sophisticated handleLeadProgression from app-business-logic.js");
            window.handleLeadProgression(lead);
        } else {
            console.warn("⚠️ Fallback: app-business-logic not loaded, using simple progression");
            
            if (lead.status === 'unassigned' && !lead.assigned_to) {
                console.log("📝 Opening assign form for unassigned lead");
                window.openAssignForm(lead);
                return;
            }

            const progressionOptions = getLeadProgressionOptions(lead);
            
            if (progressionOptions.length === 0) {
                alert(`No progression options available for status: ${lead.status}`);
                return;
            }
            
            if (progressionOptions.length === 1) {
                const nextStatus = progressionOptions[0].status;
                console.log("🚀 Direct progression to:", nextStatus);
                if (window.updateLeadStatus && typeof window.updateLeadStatus === 'function') {
                    window.updateLeadStatus(lead.id, nextStatus);
                }
                return;
            }
            
            console.log("🎯 Fallback: Opening choice modal with options:", progressionOptions);
            window.setCurrentLeadForChoice(lead);
            window.setChoiceOptions(progressionOptions.map(opt => ({
                value: opt.status,
                label: opt.label,
                color: opt.color
            })));
            window.setShowChoiceModal(true);
        }
    };

    // SIMPLIFIED - Always use paginated data
    const currentLeads = window.appState.leads || [];
    const pagination = window.appState.leadsPagination || { page: 1, totalPages: 1, total: 0 };
    const filterOptions = window.appState.leadsFilterOptions || {};

    // Count unassigned leads from current page
    const unassignedLeads = currentLeads.filter(lead => !lead.assigned_to || lead.assigned_to === '' || lead.status === 'unassigned');

return React.createElement('div', { className: 'space-y-6' },
    spinnerStyles,  // Add this line

        // View Mode Toggle Section
        React.createElement('div', { className: 'bg-white rounded-lg shadow-sm border p-4 lead-client-toggle-container' },
            React.createElement('div', { className: 'flex items-center justify-between mb-4' },
                React.createElement('h2', { className: 'text-2xl font-bold text-gray-900' }, 'Lead & Client Management'),

                // Toggle Buttons
                React.createElement('div', { className: 'flex bg-gray-100 rounded-lg p-1' },
                    React.createElement('button', {
                        onClick: () => window.setViewMode('leads'),
                        className: `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            window.appState.viewMode === 'leads' 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`
                    }, 
                        React.createElement('span', { className: 'mr-2' }, '📋'),
                        `Lead View (${pagination.total || 0})`
                    ),
                    React.createElement('button', {
                        onClick: () => window.setViewMode('clients'),
                        className: `px-4 py-2 rounded-md text-sm font-medium transition-colors ml-1 ${
                            window.appState.viewMode === 'clients' 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`
                    }, 
                        React.createElement('span', { className: 'mr-2' }, '👥'),
                        clientsPagination.total || window.ClientsAPI?.paginationData?.total || 0
                    )
                )
            ),

            // Mode Description
            React.createElement('p', { className: 'text-sm text-gray-600' },
                window.appState.viewMode === 'leads' 
                ? 'Individual lead management - Create, assign, and track each lead separately with advanced filtering'
                : 'Client-based view - See all leads grouped by phone number for complete client history and relationships'
            )
        ),

        // Conditional Content Based on View Mode
        window.appState.viewMode === 'leads' ? 
        // LEAD VIEW CONTENT
        React.createElement('div', { className: 'space-y-6' },
            // Header with buttons
            React.createElement('div', { className: 'flex justify-between items-center' },
                React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' }, 'Lead Management'),
                React.createElement('div', { className: 'flex gap-2' },
                    window.hasPermission('leads', 'write') && React.createElement('button', { 
                        className: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700',
                        onClick: () => window.openAddForm('lead')
                    }, '+ Add New Lead'),

                    window.hasPermission('leads', 'assign') && unassignedLeads.length > 0 && React.createElement('button', {
                        onClick: () => window.setShowBulkAssignModal(true),
                        className: 'bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2'
                    }, 
                        React.createElement('span', null, '👥'),
                        `Bulk Assign (${unassignedLeads.length})`
                    ),
                    
                    window.hasPermission('leads', 'write') && window.WebsiteLeadsImport && React.createElement(window.WebsiteLeadsImport),

                    React.createElement('button', {
                        onClick: () => {
                            window.setCSVUploadType('leads');
                            window.setShowCSVUploadModal(true);
                        },
                        className: 'bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded flex items-center gap-2'
                    }, 
                        React.createElement('svg', {
                            className: 'w-5 h-5',
                            fill: 'none',
                            stroke: 'currentColor',
                            viewBox: '0 0 24 24'
                        },
                            React.createElement('path', {
                                strokeLinecap: 'round',
                                strokeLinejoin: 'round',
                                strokeWidth: 2,
                                d: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
                            })
                        ),
                        'Upload CSV'
                    )
                )
            ),

            // FILTERS SECTION - SIMPLIFIED FOR PAGINATED MODE
            React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow border p-4 filters-search-container' },
                React.createElement('h2', { className: 'text-lg font-semibold text-gray-900 dark:text-white mb-4' }, 'Filters & Search'),
                React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4' },
                    // Search Input
                    React.createElement('div', { className: 'search-input-container' },
                        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Search'),
                        React.createElement('input', {
                            type: 'text',
                            placeholder: 'Name, email, company...',
                            value: window.appState.searchQuery,
                            onChange: (e) => window.LeadsAPI.handleFilterChange('search', e.target.value),
                            className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                        })
                    ),

                    // Multi-Select Status Filter
                    React.createElement('div', null,
                        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Status'),
                        React.createElement('div', { className: 'relative', ref: window.statusDropdownRef },
                            React.createElement('button', {
                                onClick: () => window.setShowStatusFilterDropdown(!window.showStatusFilterDropdown),
                                className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white flex items-center justify-between text-left'
                            },
                                React.createElement('span', { className: 'truncate' }, window.getStatusFilterDisplayText()),
                                React.createElement('svg', {
                                    className: `w-5 h-5 transition-transform ${window.showStatusFilterDropdown ? 'rotate-180' : ''}`,
                                    fill: 'none',
                                    stroke: 'currentColor',
                                    viewBox: '0 0 24 24'
                                },
                                    React.createElement('path', {
                                        strokeLinecap: 'round',
                                        strokeLinejoin: 'round',
                                        strokeWidth: 2,
                                        d: 'M19 9l-7 7-7-7'
                                    })
                                )
                            ),

                            // Status Dropdown
                            window.showStatusFilterDropdown && React.createElement('div', {
                                className: 'absolute z-10 w-80 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto filter-dropdown'
                            },
                                // Select/Deselect All Controls
                                React.createElement('div', { className: 'border-b border-gray-200 p-3 bg-gray-50' },
                                    React.createElement('div', { className: 'flex justify-between' },
                                        React.createElement('button', {
                                            onClick: window.handleSelectAllStatuses,
                                            className: 'text-sm text-blue-600 hover:text-blue-800 font-medium'
                                        }, window.selectedStatusFilters.length === Object.keys(window.LEAD_STATUSES).length ? 'Deselect All' : 'Select All'),
                                        React.createElement('button', {
                                            onClick: window.handleClearAllStatuses,
                                            className: 'text-sm text-red-600 hover:text-red-800 font-medium'
                                        }, 'Clear All')
                                    )
                                ),

                                // Status Options Grouped
                                React.createElement('div', { className: 'py-1' },
                                    // Initial Contact Group
                                    React.createElement('div', { className: 'px-3 py-2 bg-gray-100 text-xs font-semibold text-gray-700 uppercase' }, 'Initial Contact'),
                                    ['unassigned', 'assigned', 'contacted', 'attempt_1', 'attempt_2', 'attempt_3'].map(status =>
                                        window.LEAD_STATUSES[status] && React.createElement('label', {
                                            key: status,
                                            className: 'flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer'
                                        },
                                            React.createElement('input', {
                                                type: 'checkbox',
                                                checked: window.selectedStatusFilters.includes(status),
                                                onChange: () => {
                                                    window.handleStatusFilterToggle(status);
                                                    // Apply filter after toggle
                                                    setTimeout(() => {
                                                        const selectedStatus = window.selectedStatusFilters.length > 0 ? 
                                                            window.selectedStatusFilters[0] : 'all';
                                                        window.LeadsAPI.handleFilterChange('status', selectedStatus);
                                                    }, 50);
                                                },
                                                className: 'mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                                            }),
                                            React.createElement('span', {
                                                className: `px-2 py-1 rounded-full text-xs font-medium mr-2 ${window.LEAD_STATUSES[status].color}`
                                            }, window.LEAD_STATUSES[status].label)
                                        )
                                    ),

                                    // Other status groups follow the same pattern...
                                    // Qualification Group
                                    React.createElement('div', { className: 'px-3 py-2 bg-gray-100 text-xs font-semibold text-gray-700 uppercase' }, 'Qualification'),
                                    ['qualified', 'junk'].map(status =>
                                        window.LEAD_STATUSES[status] && React.createElement('label', {
                                            key: status,
                                            className: 'flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer'
                                        },
                                            React.createElement('input', {
                                                type: 'checkbox',
                                                checked: window.selectedStatusFilters.includes(status),
                                                onChange: () => {
                                                    window.handleStatusFilterToggle(status);
                                                    setTimeout(() => {
                                                        const selectedStatus = window.selectedStatusFilters.length > 0 ? 
                                                            window.selectedStatusFilters[0] : 'all';
                                                        window.LeadsAPI.handleFilterChange('status', selectedStatus);
                                                    }, 50);
                                                },
                                                className: 'mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                                            }),
                                            React.createElement('span', {
                                                className: `px-2 py-1 rounded-full text-xs font-medium mr-2 ${window.LEAD_STATUSES[status].color}`
                                            }, window.LEAD_STATUSES[status].label)
                                        )
                                    )
                                )
                            )
                        ),

                        // Filter Indicator
                        window.selectedStatusFilters.length > 0 && React.createElement('div', {
                            className: 'mt-1 text-xs text-blue-600 font-medium'
                        }, `Filtering by ${window.selectedStatusFilters.length} status${window.selectedStatusFilters.length !== 1 ? 'es' : ''}`)
                    ),

                    // Find the filter dropdowns section in your leads.js and replace with this:

                    // Source Filter - Using cached options
                    React.createElement('div', null,
                        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Source'),
                        React.createElement('select', {
                            value: window.appState.leadsSourceFilter || 'all',
                            onChange: (e) => {
                                window.log.debug('Source filter changed to:', e.target.value);
                                window.LeadsAPI.handleFilterChange('source', e.target.value);
                            },
                            className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                        },
                            React.createElement('option', { value: 'all' }, 'All Sources'),
                            ...(filterOptions.sources || []).map(source =>
                                React.createElement('option', { key: source, value: source }, source)
                            )
                        )
                    ),
                    
                    // Business Type Filter - Using cached options
                    React.createElement('div', null,
                        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Business Type'),
                        React.createElement('select', {
                            value: window.appState.leadsBusinessTypeFilter || 'all',
                            onChange: (e) => {
                                window.log.debug('Business type filter changed to:', e.target.value);
                                window.LeadsAPI.handleFilterChange('business_type', e.target.value);
                            },
                            className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                        },
                            React.createElement('option', { value: 'all' }, 'All Business Types'),
                            ...(filterOptions.businessTypes || filterOptions.business_types || []).map(type =>
                                React.createElement('option', { key: type, value: type }, type)
                            )
                        )
                    ),
                    
                    // Event Filter - Using cached options
                    React.createElement('div', null,
                        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Event'),
                        React.createElement('select', {
                            value: window.appState.leadsEventFilter || 'all',
                            onChange: (e) => {
                                window.log.debug('Event filter changed to:', e.target.value);
                                window.LeadsAPI.handleFilterChange('event', e.target.value);
                            },
                            className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                        },
                            React.createElement('option', { value: 'all' }, 'All Events'),
                            ...(filterOptions.events || []).map(event =>
                                React.createElement('option', { key: event, value: event }, event)
                            )
                        )
                    ),
                    
                    // Sales Person Filter - Fixed to use proper state sync
                    React.createElement('div', null,
                        React.createElement('label', { 
                            htmlFor: 'sales-person-filter',
                            className: 'block text-sm font-medium text-gray-700 mb-2' 
                        }, 'Sales Person'),
                        React.createElement('select', {
                            id: 'sales-person-filter',
                            value: window.leadsSalesPersonFilter || localLeadsSalesPersonFilter || 'all',
                            onChange: (e) => {
                                const value = e.target.value;
                                window.log.debug('Sales person filter changed to:', value);
                                setLocalLeadsSalesPersonFilter(value);
                                window.leadsSalesPersonFilter = value; // Set global value
                                window.LeadsAPI.handleFilterChange('assigned_to', value);
                            },
                            className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                        },
                            React.createElement('option', { value: 'all' }, 'All Sales Persons'),
                            React.createElement('option', { value: 'unassigned' }, 'Unassigned'),
                            ...(filterOptions.users || []).map(user => 
                                React.createElement('option', { 
                                    key: user.email, 
                                    value: user.email 
                                }, user.name || user.email)
                            )
                        )
                    ),

                    // Sort Controls
                    React.createElement('div', null,
                        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Sort By'),
                        React.createElement('div', { className: 'flex gap-2' },
                            React.createElement('select', {
                                value: window.appState.leadsSortField,
                                onChange: (e) => window.LeadsAPI.handleFilterChange('sort_by', e.target.value),
                                className: 'flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                            },
                                React.createElement('option', { value: 'date_of_enquiry' }, 'Date'),
                                React.createElement('option', { value: 'name' }, 'Name'),
                                React.createElement('option', { value: 'potential_value' }, 'Value'),
                                React.createElement('option', { value: 'company' }, 'Company')
                            ),
                            React.createElement('button', {
                                onClick: () => {
                                    const newDirection = window.appState.leadsSortDirection === 'asc' ? 'desc' : 'asc';
                                    window.LeadsAPI.handleFilterChange('sort_order', newDirection);
                                },
                                className: 'px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500',
                                title: window.appState.leadsSortDirection === 'asc' ? 'Sort Descending' : 'Sort Ascending'
                            }, window.appState.leadsSortDirection === 'asc' ? '↑' : '↓')
                        )
                    )
                ),

                React.createElement('div', { className: 'mt-4 flex justify-between items-center' },
                    React.createElement('span', { className: 'text-sm text-gray-600' },
                        `Showing ${currentLeads.length} of ${pagination.total || currentLeads.length} leads`
                    ),
                    (window.appState.searchQuery !== '' || window.selectedStatusFilters.length > 0 || 
                     window.appState.leadsSourceFilter !== 'all' || window.appState.leadsBusinessTypeFilter !== 'all' || 
                     window.appState.leadsEventFilter !== 'all' || localLeadsSalesPersonFilter !== 'all') &&
                    React.createElement('button', {
                        onClick: () => {
                            setLocalLeadsSalesPersonFilter('all');
                            window.LeadsAPI.clearAllFilters();
                        },
                        className: 'text-sm text-blue-600 hover:text-blue-800 underline'
                    }, 'Clear All Filters')
                )
            ),

            // Workflow Hint
            React.createElement('div', { className: 'bg-blue-50 border border-blue-200 rounded-lg p-4' },
                React.createElement('div', { className: 'flex items-center text-sm text-blue-800' },
                    React.createElement('span', { className: 'mr-2 text-lg' }, '💡'),
                    React.createElement('span', { className: 'font-medium mr-2' }, 'Lead Workflow:'),
                    React.createElement('span', null, 'Unassigned → Assigned → Contacted → Qualified/Junk → Hot/Warm/Cold → Converted/Dropped → Payment'),
                    React.createElement('span', { className: 'ml-4 font-mono bg-white px-2 py-1 rounded border' }, '→'),
                    React.createElement('span', { className: 'ml-1' }, 'Click arrow to progress leads')
                )
            ),

            // Table
            React.createElement('div', { 
    className: 'bg-white dark:bg-gray-800 rounded-lg shadow border', 
    style: { position: 'relative', minHeight: '400px' } 
},
    // Add loader here
    window.appState.loading && React.createElement(LoadingOverlay),
                currentLeads.length > 0 ? React.createElement('div', { className: 'overflow-x-auto' },
                    React.createElement('table', { className: 'w-full' },
                        React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-900' },
                            React.createElement('tr', null,
                                React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Contact'),
                                React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Event'),
                                React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Assignment'),
                                React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Status'),
                                window.hasPermission('finance', 'read') && React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Value'),
                                React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
                            )
                        ),
                        React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
                            currentLeads.map(lead => {
                                const status = window.LEAD_STATUSES[lead.status] || { label: lead.status, color: 'bg-gray-100 text-gray-800', next: [] };
                                const progressionOptions = getLeadProgressionOptions(lead);

                                return React.createElement('tr', { key: lead.id, className: `hover:bg-gray-50 ${lead.is_premium ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-l-4 border-yellow-400' : ''}` },
                                    React.createElement('td', { className: 'px-6 py-4' },
                                        React.createElement('div', { 
                                            className: 'cursor-pointer hover:text-blue-600',
                                            onClick: () => window.openLeadDetail(lead)
                                        },
                                            React.createElement('div', { className: `text-sm font-medium ${lead.is_premium ? 'text-yellow-800' : 'text-gray-900'} hover:text-blue-600 flex items-center gap-2` }, 
                                                lead.is_premium && React.createElement('span', { className: 'text-yellow-500' }, '👑'),
                                                lead.name,
                                                lead.is_premium && React.createElement('span', { className: 'px-2 py-1 text-xs bg-yellow-200 text-yellow-800 rounded-full font-semibold' }, 'PREMIUM')
                                            ),
                                            React.createElement('div', { className: 'text-sm text-gray-500' }, lead.email),
                                            lead.company && React.createElement('div', { className: 'text-xs text-gray-400' }, lead.company),
                                            React.createElement('div', { className: 'flex items-center justify-between mt-1' },
                                                React.createElement('div', { className: 'text-xs text-blue-600' }, '👁️ Click to view details'),
                                                React.createElement('button', {
                                                    onClick: (e) => {
                                                        e.stopPropagation();
                                                        window.togglePremiumStatus(lead.id, !lead.is_premium);
                                                    },
                                                    className: `text-sm px-2 py-1 rounded ${
                                                        lead.is_premium 
                                                            ? 'text-yellow-600 hover:text-yellow-800 bg-yellow-100 hover:bg-yellow-200' 
                                                            : 'text-gray-400 hover:text-yellow-600 bg-gray-100 hover:bg-yellow-100'
                                                    }`,
                                                    title: lead.is_premium ? 'Remove Premium Status' : 'Mark as Premium'
                                                }, 
                                                    lead.is_premium ? '⭐' : '☆'
                                                )
                                            )
                                        )
                                    ),
                                    React.createElement('td', { className: 'px-6 py-4' },
                                        React.createElement('div', { className: 'text-sm text-gray-900' }, 
                                            lead.lead_for_event || 'Not specified'
                                        ),
                                        lead.number_of_people && React.createElement('div', { className: 'text-xs text-gray-500' }, 
                                            lead.number_of_people + ' people'
                                        ),
                                        React.createElement('div', { className: 'text-xs text-gray-500' }, 
                                            (lead.city_of_residence) + ', ' + (lead.country_of_residence || 'Unknown')
                                        )
                                    ),
                                    React.createElement('td', { className: 'px-6 py-4' },
                                        lead.assigned_to ? React.createElement('div', null,
                                            React.createElement('div', { className: 'text-sm font-medium text-blue-600' }, window.getUserDisplayName(lead.assigned_to, window.users)),
                                            React.createElement('div', { className: 'text-xs text-gray-500' }, 
                                                lead.assigned_team === 'supply' ? 'Supply Team' : 'Sales Team'
                                            )
                                        ) : React.createElement('span', { className: 'text-sm text-gray-400' }, 'Unassigned')
                                    ),
                                    React.createElement('td', { className: 'px-6 py-4' },
                                        React.createElement('div', { className: 'flex flex-col gap-1' },
                                            React.createElement('span', {
                                                className: 'px-2 py-1 text-xs rounded ' + (status.color)
                                            }, status.label),
                                            
                                            lead.quote_pdf_url && React.createElement('div', { className: 'flex items-center gap-1' },
                                                React.createElement('span', { title: 'Quote uploaded' }, '📄'),
                                                React.createElement('a', {
                                                    href: lead.quote_pdf_url,
                                                    target: '_blank',
                                                    className: 'text-blue-600 text-xs hover:underline',
                                                    onClick: (e) => e.stopPropagation()
                                                }, 'Quote'),
                                                lead.quote_notes && React.createElement('span', { 
                                                    title: lead.quote_notes,
                                                    className: 'text-xs text-gray-500 ml-1'
                                                }, '💬')
                                            ),
                                            
                                            lead.status === 'rejected' && lead.rejection_reason && React.createElement('div', {
                                                className: 'mt-1 text-xs text-red-600 italic'
                                            }, 'Reason: ' + (lead.rejection_reason))
                                        )
                                    ),
                                    window.hasPermission('finance', 'read') && React.createElement('td', { className: 'px-6 py-4' },
                                        React.createElement('div', { className: 'text-sm font-medium text-gray-900' }, 
                                            '₹' + (lead.potential_value || 0).toLocaleString()
                                        ),
                                        lead.last_quoted_price && React.createElement('div', { className: 'text-xs text-green-600' }, 
                                            'Quoted: ₹' + lead.last_quoted_price.toLocaleString()
                                        )
                                    ),
                                    React.createElement('td', { className: 'px-6 py-4' },
                                        React.createElement('div', { className: 'flex flex-wrap gap-1' },
                                            window.hasPermission('leads', 'write') && React.createElement('button', { 
                                                className: 'text-blue-600 hover:text-blue-900 text-xs px-2 py-1 rounded border border-blue-200 hover:bg-blue-50',
                                                onClick: () => window.openEditForm(lead)
                                            }, '✏️'),
                                            window.hasPermission('leads', 'assign') && !lead.assigned_to && lead.status === 'unassigned' &&
                                                React.createElement('button', { 
                                                    className: 'text-green-600 hover:text-green-900 text-xs px-2 py-1 rounded border border-green-200 hover:bg-green-50',
                                                    onClick: () => window.openAssignForm(lead)
                                                }, '👤'),
                                            window.hasPermission('leads', 'progress') && React.createElement('button', {
                                                className: `text-purple-600 hover:text-purple-900 text-xs px-2 py-1 rounded border border-purple-200 hover:bg-purple-50 ${
                                                    progressionOptions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                                                }`,
                                                onClick: () => handleLeadProgressionClick(lead),
                                                disabled: window.loading || progressionOptions.length === 0,
                                                title: lead.status === 'unassigned' && !lead.assigned_to 
                                                    ? 'Assign lead first' 
                                                    : progressionOptions.length === 0 
                                                    ? 'No progression options available'
                                                    : progressionOptions.length === 1 
                                                    ? `Progress to ${progressionOptions[0].label}`
                                                    : `Choose next stage (${progressionOptions.length} options)`
                                            }, window.loading ? '...' : '→'),
                                            window.hasPermission('leads', 'write') && (() => {
                                                const hasOrder = window.orders && window.orders.some(order => 
                                                    order.lead_id === lead.id && 
                                                    order.status !== 'rejected'
                                                );
                                                return lead.status === 'converted' || hasOrder;
                                            })() &&
                                            React.createElement('button', { 
                                                className: 'text-green-600 hover:text-green-900 text-xs px-2 py-1 rounded border border-green-200 hover:bg-green-50',
                                                onClick: () => window.openPaymentForm(lead),
                                                title: 'Collect Payment'
                                            }, '💳'),
                                            window.hasPermission('leads', 'delete') && React.createElement('button', { 
                                                className: 'text-red-600 hover:text-red-900 text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50',
                                                onClick: () => window.handleDelete('leads', lead.id, lead.name),
                                                disabled: window.loading
                                            }, '🗑️')
                                        )
                                    )
                                );
                            })
                        )
                    ),
                    // Pagination - SIMPLIFIED
                    React.createElement('div', { className: 'flex justify-between items-center px-6 py-3 bg-gray-50 border-t' },
    React.createElement('div', { className: 'text-sm text-gray-700' },
        `Page ${pagination.page || 1} of ${pagination.totalPages || 1} (${pagination.total || currentLeads.length} total leads)`
    ),
                    React.createElement('div', { className: 'flex space-x-2' },
                        React.createElement('button', {
                            onClick: () => window.LeadsAPI.changePage((pagination.page || 1) - 1),
                            disabled: !(pagination.hasPrev || (pagination.page > 1)),
                            className: 'px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
                        }, 'Previous'),
                        
                        // Page numbers
                        (() => {
                            const currentPage = pagination.page || 1;
                            const totalPages = pagination.totalPages || 1;
                            const pages = [];
                            
                            // Always show first page
                            pages.push(React.createElement('button', {
                                key: 1,
                                onClick: () => window.LeadsAPI.changePage(1),
                                className: `px-3 py-1 border rounded ${currentPage === 1 ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`
                            }, '1'));
                            
                            // Show dots if needed
                            if (currentPage > 3) {
                                pages.push(React.createElement('span', { key: 'dots1', className: 'px-2' }, '...'));
                            }
                            
                            // Show current page and neighbors
                            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                                pages.push(React.createElement('button', {
                                    key: i,
                                    onClick: () => window.LeadsAPI.changePage(i),
                                    className: `px-3 py-1 border rounded ${currentPage === i ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`
                                }, i.toString()));
                            }
                            
                            // Show dots if needed
                            if (currentPage < totalPages - 2) {
                                pages.push(React.createElement('span', { key: 'dots2', className: 'px-2' }, '...'));
                            }
                            
                            // Always show last page if more than 1 page
                            if (totalPages > 1) {
                                pages.push(React.createElement('button', {
                                    key: totalPages,
                                    onClick: () => window.LeadsAPI.changePage(totalPages),
                                    className: `px-3 py-1 border rounded ${currentPage === totalPages ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`
                                }, totalPages.toString()));
                            }
                            
                            return pages;
                        })(),
                        
                        React.createElement('button', {
                            onClick: () => window.LeadsAPI.changePage((pagination.page || 1) + 1),
                            disabled: !(pagination.hasNext || (pagination.page < pagination.totalPages)),
                            className: 'px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
                        }, 'Next')
                    )
                )
                ) : React.createElement('div', { className: 'p-6 text-center text-gray-500' }, 
                    'No leads found. Add your first lead or adjust your filters!'
                )
            )
        ) :
        // Client View Content
        window.renderClientViewContent()
    );
};

// Wrap the component in a function that creates the React element
window.renderLeadsContent = () => {
  return React.createElement(LeadsContent);
};

console.log('✅ Leads component loaded - Paginated mode only');
