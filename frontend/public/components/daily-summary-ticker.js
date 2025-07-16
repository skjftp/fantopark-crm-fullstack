// Daily Summary Ticker Component for FanToPark CRM
// Shows real-time daily metrics below the currency ticker

// Initialize state
window.dailySummaryState = {
  stats: {
    leadsLoggedToday: 0,
    leadsQualified: 0,
    potentialValueToday: 0,
    mostLeadsProgressedBy: { name: 'Loading...', count: 0 },
    successfulConversions: 0,
    revenueLocked: 0
  },
  loading: false,
  error: null,
  updateInterval: null,
  initialized: false
};

// Fetch daily statistics
window.fetchDailyStats = async function() {
  const authToken = localStorage.getItem('crm_auth_token');
  if (!authToken) return;

  window.dailySummaryState.loading = true;
  
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startDate = today.toISOString();
    const endDate = tomorrow.toISOString();
    
    // Fetch leads logged today
    const leadsResponse = await fetch(`${window.API_CONFIG.API_URL}/leads?start_date=${startDate}&end_date=${endDate}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const leadsData = await leadsResponse.json();
    
    // Fetch all leads for qualified count
    const allLeadsResponse = await fetch(`${window.API_CONFIG.API_URL}/leads`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const allLeadsData = await allLeadsResponse.json();
    
    // Fetch orders for conversion data
    const ordersResponse = await fetch(`${window.API_CONFIG.API_URL}/orders?start_date=${startDate}&end_date=${endDate}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const ordersData = await ordersResponse.json();
    
    // Calculate statistics
    const todaysLeads = leadsData.data || [];
    const allLeads = allLeadsData.data || [];
    const todaysOrders = ordersData.data || [];
    
    // Leads logged today
    const leadsLoggedToday = todaysLeads.length;
    
    // Qualified leads today
    const qualifiedStatuses = ['qualified', 'order_placed', 'win'];
    const leadsQualified = todaysLeads.filter(lead => 
      qualifiedStatuses.includes(lead.status?.toLowerCase())
    ).length;
    
    // Potential value logged today
    const potentialValueToday = todaysLeads.reduce((sum, lead) => 
      sum + (parseFloat(lead.lead_value) || 0), 0
    );
    
    // Most leads progressed by
    const progressionCounts = {};
    todaysLeads.forEach(lead => {
      if (lead.assigned_to_name) {
        progressionCounts[lead.assigned_to_name] = (progressionCounts[lead.assigned_to_name] || 0) + 1;
      }
    });
    
    const topProgressor = Object.entries(progressionCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    const mostLeadsProgressedBy = topProgressor ? {
      name: topProgressor[0],
      count: topProgressor[1]
    } : { name: 'N/A', count: 0 };
    
    // Successful conversions (orders created today)
    const successfulConversions = todaysOrders.filter(order => 
      order.status === 'confirmed' || order.status === 'delivered'
    ).length;
    
    // Revenue locked (confirmed orders today)
    const revenueLocked = todaysOrders
      .filter(order => order.status === 'confirmed' || order.status === 'delivered')
      .reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0);
    
    // Update state
    window.dailySummaryState.stats = {
      leadsLoggedToday,
      leadsQualified,
      potentialValueToday,
      mostLeadsProgressedBy,
      successfulConversions,
      revenueLocked
    };
    
    window.dailySummaryState.loading = false;
    window.dailySummaryState.error = null;
    
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    window.dailySummaryState.loading = false;
    window.dailySummaryState.error = 'Failed to load daily statistics';
  }
  
  // Force update
  if (window.forceUpdate) window.forceUpdate();
};

// Initialize the daily summary ticker
window.initializeDailySummary = function() {
  if (window.dailySummaryState.initialized) return;
  
  window.dailySummaryState.initialized = true;
  
  // Fetch initial stats
  window.fetchDailyStats();
  
  // Set up auto-refresh every 5 minutes
  if (window.dailySummaryState.updateInterval) {
    clearInterval(window.dailySummaryState.updateInterval);
  }
  window.dailySummaryState.updateInterval = setInterval(
    window.fetchDailyStats, 
    5 * 60 * 1000 // 5 minutes
  );
};

// Main render function
window.renderDailySummaryTicker = () => {
  const state = window.dailySummaryState;
  
  // Initialize on first render
  if (!state.initialized) {
    window.initializeDailySummary();
  }
  
  const { stats } = state;
  
  // Format currency in Indian format
  const formatINR = (amount) => {
    return '₹' + amount.toLocaleString('en-IN');
  };
  
  return React.createElement('div', { className: 'bg-gray-800 text-white overflow-hidden border-t border-gray-700' },
    React.createElement('div', { 
      className: 'ticker-wrapper',
      style: {
        display: 'flex',
        animation: 'scroll-summary 40s linear infinite'
      }
    },
      // First set of items
      React.createElement('div', { className: 'flex items-center whitespace-nowrap px-4 py-2' },
        // Leads Logged Today
        React.createElement('div', { className: 'flex items-center mr-8' },
          React.createElement('span', { className: 'text-gray-400 text-sm mr-2' }, 'Leads Logged Today:'),
          React.createElement('span', { className: 'text-green-400 font-semibold' }, stats.leadsLoggedToday)
        ),
        
        React.createElement('div', { className: 'w-px h-4 bg-gray-600 mr-8' }),
        
        // Leads Qualified
        React.createElement('div', { className: 'flex items-center mr-8' },
          React.createElement('span', { className: 'text-gray-400 text-sm mr-2' }, 'Leads Qualified:'),
          React.createElement('span', { className: 'text-blue-400 font-semibold' }, stats.leadsQualified)
        ),
        
        React.createElement('div', { className: 'w-px h-4 bg-gray-600 mr-8' }),
        
        // Potential Value
        React.createElement('div', { className: 'flex items-center mr-8' },
          React.createElement('span', { className: 'text-gray-400 text-sm mr-2' }, 'Potential Value Logged Today:'),
          React.createElement('span', { className: 'text-yellow-400 font-semibold' }, formatINR(stats.potentialValueToday))
        ),
        
        React.createElement('div', { className: 'w-px h-4 bg-gray-600 mr-8' }),
        
        // Most Leads Progressed By
        React.createElement('div', { className: 'flex items-center mr-8' },
          React.createElement('span', { className: 'text-gray-400 text-sm mr-2' }, 'Most Leads Progressed By:'),
          React.createElement('span', { className: 'text-white font-semibold' }, 
            `${stats.mostLeadsProgressedBy.name} (${stats.mostLeadsProgressedBy.count})`
          )
        ),
        
        React.createElement('div', { className: 'w-px h-4 bg-gray-600 mr-8' }),
        
        // Successful Conversions
        React.createElement('div', { className: 'flex items-center mr-8' },
          React.createElement('span', { className: 'text-gray-400 text-sm mr-2' }, 'Successful Conversions:'),
          React.createElement('span', { className: 'text-green-400 font-semibold' }, stats.successfulConversions)
        ),
        
        React.createElement('div', { className: 'w-px h-4 bg-gray-600 mr-8' }),
        
        // Revenue Locked
        React.createElement('div', { className: 'flex items-center mr-8' },
          React.createElement('span', { className: 'text-gray-400 text-sm mr-2' }, 'Revenue Locked:'),
          React.createElement('span', { className: 'text-green-400 font-semibold' }, formatINR(stats.revenueLocked))
        )
      ),
      
      // Duplicate for seamless scrolling
      React.createElement('div', { className: 'flex items-center whitespace-nowrap px-4 py-2' },
        // Repeat all items for seamless scrolling
        React.createElement('div', { className: 'flex items-center mr-8' },
          React.createElement('span', { className: 'text-gray-400 text-sm mr-2' }, 'Leads Logged Today:'),
          React.createElement('span', { className: 'text-green-400 font-semibold' }, stats.leadsLoggedToday)
        ),
        
        React.createElement('div', { className: 'w-px h-4 bg-gray-600 mr-8' }),
        
        React.createElement('div', { className: 'flex items-center mr-8' },
          React.createElement('span', { className: 'text-gray-400 text-sm mr-2' }, 'Leads Qualified:'),
          React.createElement('span', { className: 'text-blue-400 font-semibold' }, stats.leadsQualified)
        ),
        
        React.createElement('div', { className: 'w-px h-4 bg-gray-600 mr-8' }),
        
        React.createElement('div', { className: 'flex items-center mr-8' },
          React.createElement('span', { className: 'text-gray-400 text-sm mr-2' }, 'Potential Value Logged Today:'),
          React.createElement('span', { className: 'text-yellow-400 font-semibold' }, formatINR(stats.potentialValueToday))
        ),
        
        React.createElement('div', { className: 'w-px h-4 bg-gray-600 mr-8' }),
        
        React.createElement('div', { className: 'flex items-center mr-8' },
          React.createElement('span', { className: 'text-gray-400 text-sm mr-2' }, 'Most Leads Progressed By:'),
          React.createElement('span', { className: 'text-white font-semibold' }, 
            `${stats.mostLeadsProgressedBy.name} (${stats.mostLeadsProgressedBy.count})`
          )
        ),
        
        React.createElement('div', { className: 'w-px h-4 bg-gray-600 mr-8' }),
        
        React.createElement('div', { className: 'flex items-center mr-8' },
          React.createElement('span', { className: 'text-gray-400 text-sm mr-2' }, 'Successful Conversions:'),
          React.createElement('span', { className: 'text-green-400 font-semibold' }, stats.successfulConversions)
        ),
        
        React.createElement('div', { className: 'w-px h-4 bg-gray-600 mr-8' }),
        
        React.createElement('div', { className: 'flex items-center mr-8' },
          React.createElement('span', { className: 'text-gray-400 text-sm mr-2' }, 'Revenue Locked:'),
          React.createElement('span', { className: 'text-green-400 font-semibold' }, formatINR(stats.revenueLocked))
        )
      )
    ),
    
    // CSS for animation
    React.createElement('style', null, `
      @keyframes scroll-summary {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      .ticker-wrapper:hover {
        animation-play-state: paused;
      }
    `)
  );
};

// Cleanup function
window.cleanupDailySummaryTicker = function() {
  if (window.dailySummaryState.updateInterval) {
    clearInterval(window.dailySummaryState.updateInterval);
    window.dailySummaryState.updateInterval = null;
  }
};

console.log('✅ Daily Summary Ticker component loaded successfully');
