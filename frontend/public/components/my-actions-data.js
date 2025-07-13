// =============================================================================
// ENHANCED MY ACTIONS DATA FETCHING - REPLACE components/my-actions-data.js
// =============================================================================
// Fixed customer name fetching and enhanced data processing

// Comprehensive My Actions data fetching function with customer name fix
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

    // Process orders first (needed for delivery customer names)
    const allOrders = ordersResponse?.data || [];
    console.log('Processing orders for customer name lookup...');
    
    // Create order lookup for customer names
    const orderLookup = {};
    allOrders.forEach(order => {
      orderLookup[order.id] = {
        customer_name: order.client_name || order.customer_name,
        client_name: order.client_name,
        client_email: order.client_email,
        event_name: order.event_name
      };
    });

    // Filter leads assigned to me
    if (leadsResponse && leadsResponse.data) {
      const assignedLeads = leadsResponse.data.filter(lead => {
        const isAssigned = lead.assigned_to === window.user.email || lead.assignedTo === window.user.email;
        if (isAssigned) {
          console.log('✅ Lead assigned to me:', lead.name, 'Status:', lead.status);
        }
        return isAssigned;
      });

      // Filter quote requested leads for supply managers and supply sales service managers
      const quoteRequestedLeads = leadsResponse.data.filter(lead => {
        if (lead.status === 'quote_requested') {
          // Check if user is supply_manager or has supply_sales_service role
          const hasSupplyRole = window.user.role === 'supply_manager' || 
                                window.user.role === 'supply_sales_service_manager' ||
                                lead.quote_assigned_to === window.user.email;
          
          if (hasSupplyRole) {
            console.log('✅ Quote request for supply team:', lead.name);
          }
          return hasSupplyRole;
        }
        return false;
      });

      console.log('Assigned leads:', assignedLeads.length);
      console.log('Quote requested for me:', quoteRequestedLeads.length);

      window.myLeads = assignedLeads;
      window.myQuoteRequested = quoteRequestedLeads;
    } else {
      window.myLeads = [];
      window.myQuoteRequested = [];
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
      } else if (window.user.role === 'admin' || window.user.role === 'super_admin') {
        assignedOrders = ordersResponse.data; // Admins see all orders
      } else {
        assignedOrders = ordersResponse.data.filter(order => order.assigned_to === window.user.email);
      }

      console.log('My orders:', assignedOrders.length);
      window.myOrders = assignedOrders;
    } else {
      window.myOrders = [];
    }

    // Enhanced deliveries processing with customer names
    if (deliveriesResponse && deliveriesResponse.data) {
      let assignedDeliveries = [];

      if (window.user.role === 'supply_sales_service_manager' || 
          window.user.role === 'supply_executive' || 
          window.user.role === 'delivery_executive') {
        assignedDeliveries = deliveriesResponse.data.filter(delivery => 
          delivery.assigned_to === window.user.email
        );
      } else if (window.user.role === 'admin' || window.user.role === 'super_admin') {
        assignedDeliveries = deliveriesResponse.data; // Admins see all deliveries
      } else {
        assignedDeliveries = deliveriesResponse.data.filter(delivery => 
          delivery.assigned_to === window.user.email
        );
      }

      // ENHANCED: Add customer names from orders
      const enhancedDeliveries = assignedDeliveries.map(delivery => {
        const orderInfo = orderLookup[delivery.order_id];
        
        if (orderInfo) {
          console.log(`✅ Enhanced delivery ${delivery.id} with customer:`, orderInfo.customer_name);
          return {
            ...delivery,
            customer_name: orderInfo.customer_name || orderInfo.client_name,
            client_name: orderInfo.client_name,
            client_email: orderInfo.client_email,
            order_event_name: orderInfo.event_name
          };
        } else {
          console.warn(`⚠️ No order found for delivery ${delivery.id}, order_id: ${delivery.order_id}`);
          return {
            ...delivery,
            customer_name: delivery.customer_name || delivery.client_name || 'Unknown Customer'
          };
        }
      });

      console.log('My deliveries (enhanced):', enhancedDeliveries.length);
      window.myDeliveries = enhancedDeliveries;
    } else {
      window.myDeliveries = [];
    }

    // Get overdue receivables
    if (receivablesResponse && receivablesResponse.data) {
      const today = new Date();
      let overdueReceivables = [];

      if (window.user.role === 'finance_manager' || window.user.role === 'finance_executive') {
        // Finance team sees all overdue receivables
        overdueReceivables = receivablesResponse.data.filter(rec => {
          if (rec.status === 'paid') return false;
          const dueDate = new Date(rec.due_date);
          return dueDate < today;
        });
      } else if (window.user.role === 'sales_executive' || window.user.role === 'sales_manager') {
        // Sales team sees their assigned overdue receivables
        overdueReceivables = receivablesResponse.data.filter(rec => {
          if (rec.status === 'paid') return false;
          if (rec.assigned_to !== window.user.email) return false;
          const dueDate = new Date(rec.due_date);
          return dueDate < today;
        });
      } else if (window.user.role === 'admin' || window.user.role === 'super_admin') {
        overdueReceivables = receivablesResponse.data.filter(rec => {
          if (rec.status === 'paid') return false;
          const dueDate = new Date(rec.due_date);
          return dueDate < today;
        });
      }

      console.log('Overdue receivables:', overdueReceivables.length);
      window.myReceivables = overdueReceivables;
    } else {
      window.myReceivables = [];
    }

    // Calculate and log summary
    const summary = {
      leads: window.myLeads.length,
      quoteRequested: window.myQuoteRequested.length,
      orders: window.myOrders.length,
      deliveries: window.myDeliveries.length,
      receivables: window.myReceivables.length
    };

    console.log('📊 My Actions Summary:', summary);

    // Trigger any callbacks
    if (window.onMyActionsUpdated) {
      window.onMyActionsUpdated(summary);
    }

  } catch (error) {
    console.error('Error in fetchMyActions:', error);
    alert('Failed to fetch your actions: ' + error.message);
  } finally {
    window.setLoading && window.setLoading(false);
  }
};

// Enhanced role-based data filtering utilities
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

// Enhanced delivery status update with better error handling
window.updateDeliveryStatusInData = function(deliveryId, newStatus) {
  console.log(`Updating delivery ${deliveryId} status to ${newStatus}`);
  
  // Update in myDeliveries
  window.myDeliveries = window.myDeliveries.map(delivery => 
    delivery.id === deliveryId 
      ? { 
          ...delivery, 
          status: newStatus,
          updated_date: new Date().toISOString(),
          updated_by: window.user?.email || 'system'
        }
      : delivery
  );
  
  // Also update main deliveries array if it exists
  if (window.deliveries) {
    window.deliveries = window.deliveries.map(delivery => 
      delivery.id === deliveryId 
        ? { 
            ...delivery, 
            status: newStatus,
            updated_date: new Date().toISOString(),
            updated_by: window.user?.email || 'system'
          }
        : delivery
    );
  }
  
  console.log(`✅ Updated delivery ${deliveryId} status locally`);
};

console.log('✅ Enhanced My Actions Data Fetching System loaded successfully with customer name fixes');
