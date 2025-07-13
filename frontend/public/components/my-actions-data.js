// =============================================================================
// FIXED MY ACTIONS DATA FETCHING - REPLACE components/my-actions-data.js
// =============================================================================
// Enhanced with proper state synchronization to fix UI display issues

// Comprehensive My Actions data fetching function
window.fetchMyActions = async function() {
  console.log('===== fetchMyActions CALLED =====');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Current user:', window.user);
  console.log('User email:', window.user?.email);
  console.log('User role:', window.user?.role);

  if (!window.user) {
    console.error('No user object - cannot fetch actions');
    return;
  }

  try {
    window.setLoading && window.setLoading(true);
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

    console.log('=== API RESPONSES RECEIVED ===');
    console.log('Leads response:', leadsResponse?.data?.length || 0, 'items');
    console.log('Orders response:', ordersResponse?.data?.length || 0, 'items');
    console.log('Deliveries response:', deliveriesResponse?.data?.length || 0, 'items');
    console.log('Receivables response:', receivablesResponse?.data?.length || 0, 'items');

    // Create order lookup for customer names
    const orderLookup = {};
    if (ordersResponse?.data) {
      console.log('Processing orders for customer name lookup...');
      ordersResponse.data.forEach(order => {
        orderLookup[order.id] = order;
      });
    }

    // =============================================================================
    // FILTER AND PROCESS LEADS
    // =============================================================================
    let assignedLeads = [];
    let quoteRequestedLeads = [];
    
    if (leadsResponse?.data) {
      const userEmail = window.user.email;
      const userRole = window.user.role;
      
      // Filter assigned leads
      assignedLeads = leadsResponse.data.filter(lead => {
        const isAssigned = lead.assigned_to === userEmail;
        if (isAssigned) {
          console.log('✅ Lead assigned to me:', lead.company_name || lead.name, 'Status:', lead.status);
        }
        return isAssigned;
      });

      // Filter quote requests for supply team
      if (userRole === 'supply_sales_service_manager' || userRole === 'supply_manager') {
        quoteRequestedLeads = leadsResponse.data.filter(lead => {
          const isQuoteRequest = lead.status === 'quote_requested';
          if (isQuoteRequest) {
            console.log('✅ Quote request for supply team:', lead.company_name || lead.name);
          }
          return isQuoteRequest;
        });
      }
    }

    // =============================================================================
    // FILTER AND PROCESS ORDERS
    // =============================================================================
    let myFilteredOrders = [];
if (ordersResponse?.data) {
  const userEmail = window.user.email;
  const userRole = window.user.role;
  
  // Use role-based filtering instead of direct assignment filtering
  myFilteredOrders = window.filterOrdersByRole(ordersResponse.data, userRole, userEmail);
  
  console.log('✅ Orders filtered by role:', userRole, 'Found:', myFilteredOrders.length, 'orders');
}

    // =============================================================================
    // FILTER AND PROCESS DELIVERIES WITH CUSTOMER NAMES
    // =============================================================================
    let enhancedDeliveries = [];
    if (deliveriesResponse?.data) {
      const userEmail = window.user.email;
      const assignedDeliveries = deliveriesResponse.data.filter(delivery => 
        delivery.assigned_to === userEmail
      );

      // Enhance deliveries with customer names from orders
      enhancedDeliveries = assignedDeliveries.map(delivery => {
        const relatedOrder = orderLookup[delivery.order_id];
        const customerName = relatedOrder?.customer_name || 
                           relatedOrder?.client_name ||
                           delivery.customer_name ||
                           'Unknown Customer';
        
        console.log('✅ Enhanced delivery', delivery.id, 'with customer:', customerName);
        
        return {
          ...delivery,
          customer_name: customerName
        };
      });
    }

    // =============================================================================
    // FILTER RECEIVABLES
    // =============================================================================
    let overdueReceivables = [];
    if (receivablesResponse?.data) {
      const today = new Date();
      overdueReceivables = receivablesResponse.data.filter(rec => {
        if (rec.status === 'paid') return false;
        const dueDate = new Date(rec.due_date);
        return dueDate < today;
      });
    }

    // =============================================================================
    // UPDATE STATE AND GLOBAL VARIABLES
    // =============================================================================
    console.log('Assigned leads:', assignedLeads.length);
    console.log('Quote requested for me:', quoteRequestedLeads.length);  
    console.log('My orders:', myFilteredOrders.length);
    console.log('My deliveries (enhanced):', enhancedDeliveries.length);
    console.log('Overdue receivables:', overdueReceivables.length);

    // ✅ CRITICAL FIX: Update both React state AND global window variables
    if (window.setMyLeads) {
      window.setMyLeads(assignedLeads);
    }
    window.myLeads = assignedLeads; // ← DIRECT GLOBAL UPDATE

    if (window.setMyQuoteRequested) {
      window.setMyQuoteRequested(quoteRequestedLeads);
    }
    window.myQuoteRequested = quoteRequestedLeads; // ← DIRECT GLOBAL UPDATE

    if (window.setMyOrders) {
      window.setMyOrders(myFilteredOrders);
    }
    window.myOrders = myFilteredOrders; // ← DIRECT GLOBAL UPDATE

    if (window.setMyDeliveries) {
      window.setMyDeliveries(enhancedDeliveries);
    }
    window.myDeliveries = enhancedDeliveries; // ← DIRECT GLOBAL UPDATE

    if (window.setMyReceivables) {
      window.setMyReceivables(overdueReceivables);
    }
    window.myReceivables = overdueReceivables; // ← DIRECT GLOBAL UPDATE

    // Log final summary
    console.log('📊 My Actions Summary:', {
      leads: assignedLeads.length,
      quoteRequested: quoteRequestedLeads.length,
      orders: myFilteredOrders.length,
      deliveries: enhancedDeliveries.length,
      receivables: overdueReceivables.length
    });

    // ✅ FORCE UI REFRESH
    if (window.activeTab === 'myactions') {
      console.log('🔄 Forcing My Actions UI refresh...');
      // Trigger a small state change to force re-render
      if (window.setLoading) {
        window.setLoading(false);
        setTimeout(() => {
          if (window.setActiveTab) {
            window.setActiveTab('myactions'); // Force re-render
          }
        }, 100);
      }
    }

    window.setLoading && window.setLoading(false);
  } catch (error) {
    console.error('Error in fetchMyActions:', error);
    window.setLoading && window.setLoading(false);
  }
};

// =============================================================================
// ROLE-BASED FILTERING UTILITIES
// =============================================================================

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
    case 'supply_service_manager':
    case 'supply_manager':
    case 'supply_executive':
      // Supply team members can see all orders assigned to ANY supply team member
      return orders.filter(order => {
        if (order.status !== 'approved') return false;
        
        // Check if assigned to any supply team member
        const supplyRoles = ['supply_manager', 'supply_service_manager', 'supply_sales_service_manager', 'supply_executive'];
        const assignedUser = window.users?.find(user => user.email === order.assigned_to);
        
        return assignedUser && supplyRoles.includes(assignedUser.role);
      });
    
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

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

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
  console.log('🔄 Refreshing My Actions data...');
  await window.fetchMyActions();
};

// Initialize My Actions system
window.initializeMyActions = function() {
  console.log('✅ Initializing My Actions system...');
  
  // Initial data fetch if on My Actions tab
  if (window.activeTab === 'myactions' && window.isLoggedIn) {
    window.fetchMyActions();
  }
};

console.log('✅ Enhanced My Actions Data Fetching System loaded successfully with STATE SYNC FIXES');
