// My Actions Data Fetching System Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Handles role-based data fetching, filtering, and assignment logic for My Actions tab

// Comprehensive My Actions data fetching function
window.fetchMyActions = async function() {
  console.log('===== fetchMyActions CALLED =====');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Current user:', window.user);
  console.log('User email:', window.user?.email);
  console.log('User role:', window.user?.role);
  console.log('Is logged in:', window.isLoggedIn);
  console.log('Loading state:', window.loading);

  if (!window.user) {
    console.error('No user object - cannot fetch actions');
    return;
  }

  if (!window.user) {
    console.log('No user logged in');
    return;
  }

  try {
    window.setLoading(true);
    console.log('Fetching actions for:', window.user.name, '(' + window.user.email + ')');

    // Fetch all data in parallel
    const [leadsResponse, ordersResponse, deliveriesResponse, receivablesResponse] = await Promise.all([
      window.apiCall('/leads').catch(err => { 
        console.error('Failed to fetch leads:', err); 
        return { data: [] }; 
      }),
      window.apiCall('/orders').catch(err => { 
        console.error('Failed to fetch orders:', err); 
        return { data: [] }; 
      }),
      window.apiCall('/deliveries').catch(err => { 
        console.error('Failed to fetch deliveries:', err); 
        return { data: [] }; 
      }),
      window.apiCall('/receivables').catch(err => { 
        console.error('Failed to fetch receivables:', err); 
        return { data: [] }; 
      })
    ]);

    // Debug: Log all API responses
    console.log('=== API RESPONSES RECEIVED ===');
    console.log('Leads response:', leadsResponse);
    console.log('Number of leads:', leadsResponse?.data?.length || 0);
    if (leadsResponse?.data?.length > 0) {
      console.log('First lead full data:', leadsResponse.data[0]);
      console.log('Lead assignment field:', leadsResponse.data[0].assigned_to || leadsResponse.data[0].assignedTo || 'NOT FOUND');
    }

    // Filter leads assigned to me
    if (leadsResponse && leadsResponse.data) {
      const assignedLeads = leadsResponse.data.filter(lead => {
        console.log('\n--- Checking Lead ---');
        console.log('Lead:', lead);
        console.log('Lead name:', lead.name);
        console.log('Lead assigned_to:', lead.assigned_to);
        console.log('Lead assignedTo:', lead.assignedTo);
        console.log('My email:', window.user.email);

        const isAssigned = lead.assigned_to === window.user.email;
        console.log('Match result:', isAssigned);

        return isAssigned;
      });

      // Filter quote requested leads for supply managers and supply sales service managers
      const quoteRequestedLeads = leadsResponse.data.filter(lead => {
        if (lead.status === 'quote_requested') {
          // Check if user is supply_manager or has supply_sales_service role
          return (window.user.role === 'supply_manager' || 
                  window.user.role === 'supply_sales_service_manager' ||
                  lead.quote_assigned_to === window.user.email);
        }
        return false;
      });

      console.log('\n=== FILTER RESULTS ===');
      console.log('Total leads:', leadsResponse.data.length);
      console.log('Assigned to me:', assignedLeads.length);
      console.log('Quote requested for me:', quoteRequestedLeads.length);
      console.log('Assigned leads:', assignedLeads);
      console.log('Quote requested leads:', quoteRequestedLeads);

      window.setMyLeads(assignedLeads);
      window.setMyQuoteRequested(quoteRequestedLeads);
    } else {
      window.setMyLeads([]);
      window.setMyQuoteRequested([]);
    }

    // Filter orders based on role
    if (ordersResponse && ordersResponse.data) {
      let assignedOrders = [];

      if (window.user.role === 'supply_sales_service_manager' || window.user.role === 'supply_executive') {
        assignedOrders = ordersResponse.data.filter(order => 
          order.status === 'approved' && order.assigned_to === window.user.email
        );
      } else if (window.user.role === 'finance_manager' || window.user.role === 'finance_executive') {
        assignedOrders = ordersResponse.data.filter(order => 
          order.status === 'pending_approval'
        );
      }

      console.log('My orders:', assignedOrders.length);
      window.setMyOrders(assignedOrders);
    } else {
      window.setMyOrders([]);
    }

    // Filter deliveries
    if (deliveriesResponse && deliveriesResponse.data) {
      const assignedDeliveries = deliveriesResponse.data.filter(delivery => 
        delivery.assigned_to === window.user.email
      );
      console.log('My deliveries:', assignedDeliveries.length);
      window.setMyDeliveries(assignedDeliveries);
    } else {
      window.setMyDeliveries([]);
    }

    // Get overdue receivables
    if (receivablesResponse && receivablesResponse.data) {
      const today = new Date();
      const overdueReceivables = receivablesResponse.data.filter(rec => {
        if (rec.status === 'paid') return false;
        const dueDate = new Date(rec.due_date);
        return dueDate < today;
      });
      console.log('Overdue receivables:', overdueReceivables.length);
      window.setMyReceivables(overdueReceivables);
    } else {
      window.setMyReceivables([]);
    }

    window.setLoading(false);
  } catch (error) {
    console.error('Error in fetchMyActions:', error);
    window.setLoading(false);
  }
};

// Role-based data filtering utilities
window.filterLeadsByRole = function(leads, userRole, userEmail) {
  console.log('Filtering leads by role:', userRole, 'for user:', userEmail);
  
  switch (userRole) {
    case 'sales_executive':
    case 'sales_manager':
      return leads.filter(lead => lead.assigned_to === userEmail);
    
    case 'supply_manager':
    case 'supply_sales_service_manager':
      // Get both assigned leads and quote requested leads
      const assignedLeads = leads.filter(lead => lead.assigned_to === userEmail);
      const quoteLeads = leads.filter(lead => 
        lead.status === 'quote_requested' && 
        (lead.quote_assigned_to === userEmail || !lead.quote_assigned_to)
      );
      return [...assignedLeads, ...quoteLeads];
    
    case 'admin':
    case 'super_admin':
      return leads; // Admins see all leads
    
    default:
      return leads.filter(lead => lead.assigned_to === userEmail);
  }
};

window.filterOrdersByRole = function(orders, userRole, userEmail) {
  console.log('Filtering orders by role:', userRole, 'for user:', userEmail);
  
  switch (userRole) {
    case 'supply_sales_service_manager':
    case 'supply_executive':
      return orders.filter(order => 
        order.status === 'approved' && order.assigned_to === userEmail
      );
    
    case 'finance_manager':
    case 'finance_executive':
      return orders.filter(order => order.status === 'pending_approval');
    
    case 'sales_executive':
    case 'sales_manager':
      return orders.filter(order => 
        order.created_by === userEmail || order.sales_person === userEmail
      );
    
    case 'admin':
    case 'super_admin':
      return orders; // Admins see all orders
    
    default:
      return orders.filter(order => order.assigned_to === userEmail);
  }
};

window.filterDeliveriesByRole = function(deliveries, userRole, userEmail) {
  console.log('Filtering deliveries by role:', userRole, 'for user:', userEmail);
  
  switch (userRole) {
    case 'supply_sales_service_manager':
    case 'supply_executive':
    case 'delivery_executive':
      return deliveries.filter(delivery => delivery.assigned_to === userEmail);
    
    case 'admin':
    case 'super_admin':
      return deliveries; // Admins see all deliveries
    
    default:
      return deliveries.filter(delivery => delivery.assigned_to === userEmail);
  }
};

window.filterReceivablesByRole = function(receivables, userRole, userEmail) {
  console.log('Filtering receivables by role:', userRole, 'for user:', userEmail);
  
  const today = new Date();
  
  switch (userRole) {
    case 'finance_manager':
    case 'finance_executive':
      // Finance team sees all overdue receivables
      return receivables.filter(rec => {
        if (rec.status === 'paid') return false;
        const dueDate = new Date(rec.due_date);
        return dueDate < today;
      });
    
    case 'sales_executive':
    case 'sales_manager':
      // Sales team sees their assigned overdue receivables
      return receivables.filter(rec => {
        if (rec.status === 'paid') return false;
        if (rec.assigned_to !== userEmail) return false;
        const dueDate = new Date(rec.due_date);
        return dueDate < today;
      });
    
    case 'admin':
    case 'super_admin':
      return receivables.filter(rec => {
        if (rec.status === 'paid') return false;
        const dueDate = new Date(rec.due_date);
        return dueDate < today;
      });
    
    default:
      return receivables.filter(rec => {
        if (rec.status === 'paid') return false;
        if (rec.assigned_to !== userEmail) return false;
        const dueDate = new Date(rec.due_date);
        return dueDate < today;
      });
  }
};

// My Actions data processing and statistics
window.calculateMyActionsStats = function(myData) {
  const stats = {
    totalLeads: myData.leads?.length || 0,
    totalQuoteRequested: myData.quoteRequested?.length || 0,
    totalOrders: myData.orders?.length || 0,
    totalDeliveries: myData.deliveries?.length || 0,
    totalReceivables: myData.receivables?.length || 0,
    urgentItems: 0,
    totalValue: 0
  };

  // Calculate urgent items (overdue or high priority)
  if (myData.leads) {
    stats.urgentItems += myData.leads.filter(lead => 
      lead.priority === 'urgent' || lead.temperature === 'hot'
    ).length;
  }

  if (myData.receivables) {
    stats.urgentItems += myData.receivables.length; // All overdue receivables are urgent
  }

  // Calculate total potential value
  if (myData.leads) {
    stats.totalValue += myData.leads.reduce((sum, lead) => 
      sum + (parseFloat(lead.potential_value) || 0), 0
    );
  }

  if (myData.orders) {
    stats.totalValue += myData.orders.reduce((sum, order) => 
      sum + (parseFloat(order.total_amount) || 0), 0
    );
  }

  return stats;
};

// Priority-based sorting for My Actions items
window.sortMyActionsItems = function(items, type) {
  if (!items || !Array.isArray(items)) return [];

  return items.sort((a, b) => {
    // Sort by priority/urgency first
    if (type === 'leads') {
      // Hot leads first, then warm, then cold
      const tempOrder = { hot: 3, warm: 2, cold: 1 };
      const aPriority = tempOrder[a.temperature] || 0;
      const bPriority = tempOrder[b.temperature] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
    }

    if (type === 'receivables') {
      // Sort by how overdue (most overdue first)
      const today = new Date();
      const aDaysOverdue = Math.floor((today - new Date(a.due_date)) / (1000 * 60 * 60 * 24));
      const bDaysOverdue = Math.floor((today - new Date(b.due_date)) / (1000 * 60 * 60 * 24));
      
      if (aDaysOverdue !== bDaysOverdue) {
        return bDaysOverdue - aDaysOverdue;
      }
    }

    // Then sort by date (most recent first)
    const aDate = new Date(a.created_date || a.date_of_enquiry || a.created_at || 0);
    const bDate = new Date(b.created_date || b.date_of_enquiry || b.created_at || 0);
    
    return bDate - aDate;
  });
};

// Get My Actions summary for dashboard
window.getMyActionsSummary = function() {
  const summary = {
    leads: window.myLeads?.length || 0,
    quoteRequested: window.myQuoteRequested?.length || 0,
    orders: window.myOrders?.length || 0,
    deliveries: window.myDeliveries?.length || 0,
    receivables: window.myReceivables?.length || 0,
    urgent: 0
  };

  // Count urgent items
  if (window.myLeads) {
    summary.urgent += window.myLeads.filter(lead => 
      lead.temperature === 'hot' || lead.priority === 'urgent'
    ).length;
  }

  if (window.myReceivables) {
    summary.urgent += window.myReceivables.length; // All overdue receivables are urgent
  }

  return summary;
};

// Refresh My Actions data
window.refreshMyActions = async function() {
  console.log('Refreshing My Actions data...');
  await window.fetchMyActions();
};

// Auto-refresh My Actions data periodically
window.setupMyActionsAutoRefresh = function() {
  // Refresh every 5 minutes
  const refreshInterval = 5 * 60 * 1000;
  
  setInterval(() => {
    if (window.activeTab === 'myactions' && window.isLoggedIn) {
      console.log('Auto-refreshing My Actions data...');
      window.refreshMyActions();
    }
  }, refreshInterval);
};

// Initialize My Actions system
window.initializeMyActions = function() {
  console.log('Initializing My Actions system...');
  
  // Setup auto-refresh
  window.setupMyActionsAutoRefresh();
  
  // Initial data fetch if on My Actions tab
  if (window.activeTab === 'myactions' && window.isLoggedIn) {
    window.fetchMyActions();
  }
};

// Get role-specific action items
window.getRoleSpecificActions = function(userRole) {
  const roleActions = {
    sales_executive: [
      'Follow up on assigned leads',
      'Progress hot leads to conversion',
      'Update lead temperatures and notes',
      'Collect pending payments'
    ],
    sales_manager: [
      'Review team performance',
      'Assign new leads to executives',
      'Monitor pipeline progression',
      'Approve high-value quotes'
    ],
    supply_sales_service_manager: [
      'Process quote requests',
      'Coordinate with suppliers',
      'Manage inventory allocation',
      'Handle service delivery'
    ],
    finance_manager: [
      'Approve pending orders',
      'Process payment receipts',
      'Follow up on overdue receivables',
      'Generate financial reports'
    ],
    admin: [
      'Manage user accounts',
      'Monitor system health',
      'Review assignment rules',
      'Generate system reports'
    ]
  };

  return roleActions[userRole] || [];
};

console.log('✅ My Actions Data Fetching System component loaded successfully');
