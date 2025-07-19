// Complete Updated leads.js File with Proper React Components
// Fixed React Hook Error by Converting to Components

// Initialize global filter states (for persistence between view switches)
window.clientSearchQuery = window.clientSearchQuery || '';
window.clientStatusFilter = window.clientStatusFilter || 'all';
window.clientAssignedFilter = window.clientAssignedFilter || 'all';
window.clientMultiLeadFilter = window.clientMultiLeadFilter || 'all';
window.leadsSalesPersonFilter = window.leadsSalesPersonFilter || 'all';

// Initialize paginated mode if enabled - with proper checks
const initializePaginatedMode = () => {
  const shouldUsePaginated = localStorage.getItem('usePaginatedLeads') === 'true';
  
  if (shouldUsePaginated && !window.leadsInitialized) {
    window.leadsInitialized = true;
    
    // Function to safely initialize when everything is ready
    const safeInitialize = () => {
      if (window.appState && window.LeadsAPI && window.appState.setLeads) {
        window.log.info('🚀 Initializing paginated leads mode - all dependencies ready');
        window.LeadsAPI.fetchPaginatedLeads();
        window.LeadsAPI.fetchFilterOptions();
      } else {
        // Log what's missing
        if (!window.appState) window.log.debug('Waiting for appState...');
        if (!window.LeadsAPI) window.log.debug('Waiting for LeadsAPI...');
        
        // Retry after a short delay
        setTimeout(safeInitialize, 500);
      }
    };
    
    // Start initialization process
    setTimeout(safeInitialize, 1000);
  }
};

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePaginatedMode);
} else {
  // DOM already loaded, initialize after a short delay
  setTimeout(initializePaginatedMode, 500);
}


// Client View Component
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

  // State Variable Extraction from window globals
  const {
    clientsLoading = window.clientsLoading || window.appState?.clientsLoading || false,
    clients = window.clients || window.appState?.clients || [],
  } = window.appState || {};

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

  if (clients.length === 0) {
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
      
      // Filter Summary
      React.createElement('div', { className: 'mt-4 flex justify-between items-center' },
        React.createElement('span', { className: 'text-sm text-gray-600' },
          `Showing ${filteredClients.length} of ${clients.length} clients`
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
        React.createElement('div', { className: 'text-2xl font-bold text-blue-900' }, filteredClients.length),
        React.createElement('div', { className: 'text-sm text-blue-700' }, 'Total Clients')
      ),
      React.createElement('div', { className: 'bg-green-50 border border-green-200 rounded-lg p-4' },
        React.createElement('div', { className: 'text-2xl font-bold text-green-900' }, 
          filteredClients.filter(c => c.total_leads > 1).length
        ),
        React.createElement('div', { className: 'text-sm text-green-700' }, 'Multi-Lead Clients')
      ),
      React.createElement('div', { className: 'bg-purple-50 border border-purple-200 rounded-lg p-4' },
        React.createElement('div', { className: 'text-2xl font-bold text-purple-900' }, 
          filteredClients.reduce((sum, c) => sum + (c.total_leads || 1), 0)
        ),
        React.createElement('div', { className: 'text-sm text-purple-700' }, 'Total Leads')
      ),
      React.createElement('div', { className: 'bg-orange-50 border border-orange-200 rounded-lg p-4' },
        React.createElement('div', { className: 'text-2xl font-bold text-orange-900' }, 
          '₹' + filteredClients.reduce((sum, c) => sum + (parseFloat(c.total_value) || 0), 0).toLocaleString()
        ),
        React.createElement('div', { className: 'text-sm text-orange-700' }, 'Total Client Value')
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
    )
  );
};

// Wrap the component in a function that creates the React element
window.renderClientViewContent = function() {
  return React.createElement(ClientViewContent);
};

console.log('✅ Production Client View component loaded successfully with working filters');

// Lead View Component
const LeadsContent = () => {
    // React hook for sales person filter
    const [localLeadsSalesPersonFilter, setLocalLeadsSalesPersonFilter] = React.useState(window.leadsSalesPersonFilter || 'all');
    
    // Update global value when local state changes
    React.useEffect(() => {
      window.leadsSalesPersonFilter = localLeadsSalesPersonFilter;
    }, [localLeadsSalesPersonFilter]);

    // Helper function to get unique sales persons from leads
    const getUniqueSalesPersons = () => {
      const assignedEmails = new Set();
      
      // Get all unique assigned_to emails from leads
      (window.appState.leads || []).forEach(lead => {
        if (lead.assigned_to && lead.assigned_to.trim()) {
          assignedEmails.add(lead.assigned_to);
        }
      });
      
      // Map emails to user objects and filter active users
      const salesPersons = Array.from(assignedEmails)
        .map(email => window.users?.find(user => user.email === email))
        .filter(user => user && user.status === 'active')
        .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));
      
      return salesPersons;
    };

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

   // ENHANCED FILTERING LOGIC - Conditional based on pagination mode
    let filteredLeads, sortedLeads;

    if (window.appState.usePaginatedLeads) {
        // In paginated mode, backend already filtered and sorted
        filteredLeads = window.appState.leads || [];
        sortedLeads = filteredLeads; // No need to sort, already sorted by backend
    } else {
        // Traditional mode - apply frontend filtering
        filteredLeads = (window.appState.leads || []).filter(lead => {
            // Search filter
            const matchesSearch = (!window.appState.searchQuery || window.appState.searchQuery === '') || 
                lead.name?.toLowerCase().includes(window.appState.searchQuery?.toLowerCase()) ||
                lead.email?.toLowerCase().includes(window.appState.searchQuery?.toLowerCase()) ||
                (lead.company && lead.company?.toLowerCase().includes(window.appState.searchQuery?.toLowerCase())) ||
                (lead.phone && lead.phone.includes(window.appState.searchQuery));

            // Status filter
            let matchesStatus = true;
            if (window.selectedStatusFilters.length > 0) {
                matchesStatus = window.selectedStatusFilters.includes(lead.status);
            } else if (window.statusFilter !== 'all') {
                matchesStatus = lead.status === window.statusFilter;
            }

            // Source filter
            const matchesSource = window.appState.leadsSourceFilter === 'all' || lead.source === window.appState.leadsSourceFilter;

            // Business type filter
            const matchesBusinessType = window.appState.leadsBusinessTypeFilter === 'all' || lead.business_type === window.appState.leadsBusinessTypeFilter;

            // Event filter
            const matchesEvent = window.appState.leadsEventFilter === 'all' || lead.lead_for_event === window.appState.leadsEventFilter;

            // Sales Person Filter (using local state)
            let matchesSalesPerson = true;
            if (localLeadsSalesPersonFilter && localLeadsSalesPersonFilter !== 'all') {
                if (localLeadsSalesPersonFilter === 'unassigned') {
                    matchesSalesPerson = !lead.assigned_to;
                } else {
                    matchesSalesPerson = lead.assigned_to === localLeadsSalesPersonFilter;
                }
            }

            return matchesSearch && matchesStatus && matchesSource && matchesBusinessType && matchesEvent && matchesSalesPerson;
        });

        // Traditional mode - apply frontend sorting
        sortedLeads = filteredLeads.sort((a, b) => {
            let aValue, bValue;

            switch (window.appState.leadsSortField) {
                case 'date_of_enquiry':
                    aValue = new Date(a.date_of_enquiry || a.created_date);
                    bValue = new Date(b.date_of_enquiry || b.created_date);
                    break;
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'potential_value':
                    aValue = parseFloat(a.potential_value) || 0;
                    bValue = parseFloat(b.potential_value) || 0;
                    break;
                case 'company':
                    aValue = (a.company || '').toLowerCase();
                    bValue = (b.company || '').toLowerCase();
                    break;
                default:
                    aValue = new Date(a.date_of_enquiry || a.created_date);
                    bValue = new Date(b.date_of_enquiry || b.created_date);
            }

            if (window.appState.leadsSortDirection === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    }

// PAGINATION LOGIC - UPDATED FOR BACKEND PAGINATION
let indexOfLastItem, indexOfFirstItem, currentLeads, totalPages;

if (window.appState.usePaginatedLeads) {
    // In paginated mode, use the leads as-is (already paginated by backend)
    currentLeads = sortedLeads; // Use all the leads returned by backend
    indexOfFirstItem = 0;
    indexOfLastItem = sortedLeads.length;
    totalPages = window.appState.leadsPagination?.totalPages || 1;
} else {
    // Traditional mode - apply frontend pagination
    indexOfLastItem = window.appState.currentLeadsPage * window.appState.itemsPerPage;
    indexOfFirstItem = indexOfLastItem - window.appState.itemsPerPage;
    currentLeads = sortedLeads.slice(indexOfFirstItem, indexOfLastItem);
    totalPages = Math.ceil(sortedLeads.length / window.appState.itemsPerPage);
}

    const unassignedLeads = sortedLeads.filter(lead => !lead.assigned_to || lead.assigned_to === '' || lead.status === 'unassigned');

    return React.createElement('div', { className: 'space-y-6' },

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
                        `Lead View (${(window.appState.leads || []).length})`
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
                        `Client View (${(window.clients || []).length})`
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
        // LEAD VIEW CONTENT WITH WORKING SALES PERSON FILTER
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

            // ENHANCED FILTERS SECTION WITH WORKING SALES PERSON FILTER
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
                onChange: (e) => {
                    if (window.appState.usePaginatedLeads) {
                        window.LeadsAPI.handleFilterChange('search', e.target.value);
                    } else {
                        window.setSearchQuery(e.target.value);
                        window.appState.setCurrentLeadsPage(1);
                    }
                },
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
                                        // Apply filter after toggle if in paginated mode
                                        if (window.appState.usePaginatedLeads) {
                                            setTimeout(() => {
                                                // Use the first selected status or 'all'
                                                const selectedStatus = window.selectedStatusFilters.length > 0 ? 
                                                    window.selectedStatusFilters[0] : 'all';
                                                window.LeadsAPI.handleFilterChange('status', selectedStatus);
                                            }, 50);
                                        }
                                    },
                                    className: 'mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                                }),
                                React.createElement('span', {
                                    className: `px-2 py-1 rounded-full text-xs font-medium mr-2 ${window.LEAD_STATUSES[status].color}`
                                }, window.LEAD_STATUSES[status].label)
                            )
                        ),

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
                                        if (window.appState.usePaginatedLeads) {
                                            setTimeout(() => {
                                                const selectedStatus = window.selectedStatusFilters.length > 0 ? 
                                                    window.selectedStatusFilters[0] : 'all';
                                                window.LeadsAPI.handleFilterChange('status', selectedStatus);
                                            }, 50);
                                        }
                                    },
                                    className: 'mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                                }),
                                React.createElement('span', {
                                    className: `px-2 py-1 rounded-full text-xs font-medium mr-2 ${window.LEAD_STATUSES[status].color}`
                                }, window.LEAD_STATUSES[status].label)
                            )
                        ),

                        // Temperature Group
                        React.createElement('div', { className: 'px-3 py-2 bg-gray-100 text-xs font-semibold text-gray-700 uppercase' }, 'Temperature'),
                        ['hot', 'warm', 'cold'].map(status =>
                            window.LEAD_STATUSES[status] && React.createElement('label', {
                                key: status,
                                className: 'flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer'
                            },
                                React.createElement('input', {
                                    type: 'checkbox',
                                    checked: window.selectedStatusFilters.includes(status),
                                    onChange: () => {
                                        window.handleStatusFilterToggle(status);
                                        if (window.appState.usePaginatedLeads) {
                                            setTimeout(() => {
                                                const selectedStatus = window.selectedStatusFilters.length > 0 ? 
                                                    window.selectedStatusFilters[0] : 'all';
                                                window.LeadsAPI.handleFilterChange('status', selectedStatus);
                                            }, 50);
                                        }
                                    },
                                    className: 'mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                                }),
                                React.createElement('span', {
                                    className: `px-2 py-1 rounded-full text-xs font-medium mr-2 ${window.LEAD_STATUSES[status].color}`
                                }, window.LEAD_STATUSES[status].label)
                            )
                        ),

                        // Sales Process Group
                        React.createElement('div', { className: 'px-3 py-2 bg-gray-100 text-xs font-semibold text-gray-700 uppercase' }, 'Sales Process'),
                        ['quote_requested', 'converted', 'dropped'].map(status =>
                            window.LEAD_STATUSES[status] && React.createElement('label', {
                                key: status,
                                className: 'flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer'
                            },
                                React.createElement('input', {
                                    type: 'checkbox',
                                    checked: window.selectedStatusFilters.includes(status),
                                    onChange: () => {
                                        window.handleStatusFilterToggle(status);
                                        if (window.appState.usePaginatedLeads) {
                                            setTimeout(() => {
                                                const selectedStatus = window.selectedStatusFilters.length > 0 ? 
                                                    window.selectedStatusFilters[0] : 'all';
                                                window.LeadsAPI.handleFilterChange('status', selectedStatus);
                                            }, 50);
                                        }
                                    },
                                    className: 'mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                                }),
                                React.createElement('span', {
                                    className: `px-2 py-1 rounded-full text-xs font-medium mr-2 ${window.LEAD_STATUSES[status].color}`
                                }, window.LEAD_STATUSES[status].label)
                            )
                        ),

                        // Payment Group
                        React.createElement('div', { className: 'px-3 py-2 bg-gray-100 text-xs font-semibold text-gray-700 uppercase' }, 'Payment'),
                        ['payment', 'payment_post_service', 'payment_received'].map(status =>
                            window.LEAD_STATUSES[status] && React.createElement('label', {
                                key: status,
                                className: 'flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer'
                            },
                                React.createElement('input', {
                                    type: 'checkbox',
                                    checked: window.selectedStatusFilters.includes(status),
                                    onChange: () => {
                                        window.handleStatusFilterToggle(status);
                                        if (window.appState.usePaginatedLeads) {
                                            setTimeout(() => {
                                                const selectedStatus = window.selectedStatusFilters.length > 0 ? 
                                                    window.selectedStatusFilters[0] : 'all';
                                                window.LeadsAPI.handleFilterChange('status', selectedStatus);
                                            }, 50);
                                        }
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

        // Source Filter
        React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Source'),
            React.createElement('select', {
                value: window.appState.leadsSourceFilter,
                onChange: (e) => {
                    if (window.appState.usePaginatedLeads) {
                        window.LeadsAPI.handleFilterChange('source', e.target.value);
                    } else {
                        window.setLeadsSourceFilter(e.target.value);
                        window.appState.setCurrentLeadsPage(1);
                    }
                },
                className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
            },
                React.createElement('option', { value: 'all' }, 'All Sources'),
                ...(window.appState.usePaginatedLeads && window.appState.leadsFilterOptions?.sources || 
                    Array.from(new Set(window.appState.leads.map(lead => lead.source).filter(Boolean))).sort()
                ).map(source =>
                    React.createElement('option', { key: source, value: source }, source)
                )
            )
        ),

        // Business Type Filter
        React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Business Type'),
            React.createElement('select', {
                value: window.appState.leadsBusinessTypeFilter,
                onChange: (e) => {
                    if (window.appState.usePaginatedLeads) {
                        window.LeadsAPI.handleFilterChange('business_type', e.target.value);
                    } else {
                        window.setLeadsBusinessTypeFilter(e.target.value);
                        window.appState.setCurrentLeadsPage(1);
                    }
                },
                className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
            },
                React.createElement('option', { value: 'all' }, 'All Business Types'),
                ...(window.appState.usePaginatedLeads && window.appState.leadsFilterOptions?.businessTypes || 
                    Array.from(new Set(window.appState.leads.map(lead => lead.business_type).filter(Boolean))).sort()
                ).map(type =>
                    React.createElement('option', { key: type, value: type }, type)
                )
            )
        ),

        // Event Filter
        React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Event'),
            React.createElement('select', {
                value: window.appState.leadsEventFilter,
                onChange: (e) => {
                    if (window.appState.usePaginatedLeads) {
                        window.LeadsAPI.handleFilterChange('event', e.target.value);
                    } else {
                        window.setLeadsEventFilter(e.target.value);
                        window.appState.setCurrentLeadsPage(1);
                    }
                },
                className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
            },
                React.createElement('option', { value: 'all' }, 'All Events'),
                ...(window.appState.usePaginatedLeads && window.appState.leadsFilterOptions?.events || 
                    Array.from(new Set(window.appState.leads.map(lead => lead.lead_for_event).filter(Boolean))).sort()
                ).map(event =>
                    React.createElement('option', { key: event, value: event }, event)
                )
            )
        ),

        // Sales Person Filter (WORKING WITH LOCAL STATE)
        React.createElement('div', null,
            React.createElement('label', { 
                htmlFor: 'sales-person-filter',
                className: 'block text-sm font-medium text-gray-700 mb-2' 
            }, 'Sales Person'),
            React.createElement('select', {
                id: 'sales-person-filter',
                value: localLeadsSalesPersonFilter,
                onChange: (e) => {
                    setLocalLeadsSalesPersonFilter(e.target.value);
                    if (window.appState.usePaginatedLeads) {
                        window.LeadsAPI.handleFilterChange('assigned_to', e.target.value);
                    } else {
                        window.appState.setCurrentLeadsPage(1);
                    }
                },
                className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
            },
                React.createElement('option', { value: 'all' }, 'All Sales Persons'),
                React.createElement('option', { value: 'unassigned' }, 'Unassigned'),
                ...(window.appState.usePaginatedLeads && window.appState.leadsFilterOptions?.users || 
                    getUniqueSalesPersons()
                ).map(user => 
                    React.createElement('option', { 
                        key: user.id || user.email, 
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
                    onChange: (e) => {
                        if (window.appState.usePaginatedLeads) {
                            window.LeadsAPI.handleFilterChange('sort_by', e.target.value);
                        } else {
                            window.setLeadsSortField(e.target.value);
                            window.appState.setCurrentLeadsPage(1);
                        }
                    },
                    className: 'flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                },
                    React.createElement('option', { value: 'date_of_enquiry' }, 'Date'),
                    React.createElement('option', { value: 'name' }, 'Name'),
                    React.createElement('option', { value: 'potential_value' }, 'Value'),
                    React.createElement('option', { value: 'company' }, 'Company')
                ),
                React.createElement('button', {
                    onClick: () => {
                        if (window.appState.usePaginatedLeads) {
                            const newDirection = window.appState.leadsSortDirection === 'asc' ? 'desc' : 'asc';
                            window.LeadsAPI.handleFilterChange('sort_order', newDirection);
                        } else {
                            window.setLeadsSortDirection(window.appState.leadsSortDirection === 'asc' ? 'desc' : 'asc');
                            window.appState.setCurrentLeadsPage(1);
                        }
                    },
                    className: 'px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500',
                    title: window.appState.leadsSortDirection === 'asc' ? 'Sort Descending' : 'Sort Ascending'
                }, window.appState.leadsSortDirection === 'asc' ? '↑' : '↓')
            )
        )
    ),

    // Filter Status Summary
    React.createElement('div', { className: 'mt-4 flex justify-between items-center' },
        React.createElement('span', { className: 'text-sm text-gray-600' },
            window.appState.usePaginatedLeads ?
                `Showing ${(window.appState.leads || []).length} of ${window.appState.leadsPagination?.total || 0} leads` :
                `Showing ${sortedLeads.length} of ${(window.appState.leads || []).length} leads`
        ),
        (window.appState.searchQuery !== '' || window.selectedStatusFilters.length > 0 || window.statusFilter !== 'all' || 
         window.appState.leadsSourceFilter !== 'all' || window.appState.leadsBusinessTypeFilter !== 'all' || 
         window.appState.leadsEventFilter !== 'all' || localLeadsSalesPersonFilter !== 'all') &&
        React.createElement('button', {
            onClick: () => {
                if (window.appState.usePaginatedLeads) {
                    setLocalLeadsSalesPersonFilter('all');
                    window.LeadsAPI.clearAllFilters();
                } else {
                    window.setSearchQuery('');
                    window.setStatusFilter('all');
                    window.setSelectedStatusFilters([]);
                    window.setLeadsSourceFilter('all');
                    window.setLeadsBusinessTypeFilter('all');
                    window.setLeadsEventFilter('all');
                    setLocalLeadsSalesPersonFilter('all');
                    window.appState.setCurrentLeadsPage(1);
                }
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
            React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow border' },
                filteredLeads.length > 0 ? React.createElement('div', { className: 'overflow-x-auto' },
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
                    // Pagination
                    // Pagination
(window.appState.usePaginatedLeads ? 
  (window.appState.leadsPagination?.totalPages > 1) : 
  (sortedLeads.length > window.appState.itemsPerPage)
) && React.createElement('div', { className: 'flex justify-between items-center px-6 py-3 bg-gray-50 border-t' },
    React.createElement('div', { className: 'text-sm text-gray-700' },
        window.appState.usePaginatedLeads ?
            `Page ${window.appState.leadsPagination?.page || 1} of ${window.appState.leadsPagination?.totalPages || 1} (${window.appState.leadsPagination?.total || 0} total leads)` :
            'Showing ' + (indexOfFirstItem + 1) + ' to ' + (Math.min(indexOfLastItem, sortedLeads.length)) + ' of ' + (sortedLeads.length) + ' leads'
    ),
    React.createElement('div', { className: 'flex space-x-2' },
        React.createElement('button', {
            onClick: () => {
                if (window.appState.usePaginatedLeads) {
                    window.LeadsAPI.changePage((window.appState.leadsPagination?.page || 1) - 1);
                } else {
                    window.appState.setCurrentLeadsPage(prev => Math.max(prev - 1, 1));
                }
            },
            disabled: window.appState.usePaginatedLeads ? 
                !window.appState.leadsPagination?.hasPrev : 
                window.appState.currentLeadsPage === 1,
            className: 'px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50'
        }, 'Previous'),
        
        // Page indicator
        React.createElement('span', { className: 'px-3 py-1' }, 
            window.appState.usePaginatedLeads ?
                `Page ${window.appState.leadsPagination?.page || 1} of ${window.appState.leadsPagination?.totalPages || 1}` :
                'Page ' + (window.appState.currentLeadsPage) + ' of ' + (totalPages)
        ),
        
        React.createElement('button', {
            onClick: () => {
                if (window.appState.usePaginatedLeads) {
                    window.LeadsAPI.changePage((window.appState.leadsPagination?.page || 1) + 1);
                } else {
                    window.appState.setCurrentLeadsPage(prev => Math.min(prev + 1, totalPages));
                }
            },
            disabled: window.appState.usePaginatedLeads ? 
                !window.appState.leadsPagination?.hasNext : 
                window.appState.currentLeadsPage === totalPages,
            className: 'px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50'
        }, 'Next')
    )
)
                ) : React.createElement('div', { className: 'p-6 text-center text-gray-500' }, 
                    sortedLeads.length === 0 && (window.appState.leads || []).length > 0 ? 
                    'No leads match your current filters.' : 
                    'No leads found. Add your first lead!'
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

console.log('✅ Leads component loaded with proper React components and working filters');
