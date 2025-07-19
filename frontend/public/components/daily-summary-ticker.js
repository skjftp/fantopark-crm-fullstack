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
  initialized: false,
  lastUpdate: null
};

// Fetch daily statistics
window.fetchDailyStats = async function() {
  const authToken = localStorage.getItem('crm_auth_token');
  if (!authToken) return;

  window.dailySummaryState.loading = true;
  
  try {
    // Get today's date range (in local timezone)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Also get UTC range for comparison
    const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
    const tomorrowUTC = new Date(todayUTC);
    tomorrowUTC.setUTCDate(tomorrowUTC.getUTCDate() + 1);
    
    console.log('📅 Date ranges:', {
      localToday: today.toString(),
      localTomorrow: tomorrow.toString(),
      utcToday: todayUTC.toISOString(),
      utcTomorrow: tomorrowUTC.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
    
    // Fetch ALL leads to filter by created_date
    const allLeadsResponse = await fetch(`${window.API_CONFIG.API_URL}/leads`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (!allLeadsResponse.ok) {
      throw new Error('Failed to fetch leads');
    }
    
    const allLeadsData = await allLeadsResponse.json();
    
    // Filter leads created today (handle timezone differences)
    const todaysLeads = (allLeadsData.data || []).filter(lead => {
      if (!lead.created_date && !lead.created_at) return false;
      
      // Try both created_date and created_at fields
      const dateField = lead.created_date || lead.created_at;
      const leadDate = new Date(dateField);
      
      // Check if the lead was created today in either local or UTC timezone
      const isLocalToday = leadDate >= today && leadDate < tomorrow;
      const isUTCToday = leadDate >= todayUTC && leadDate < tomorrowUTC;
      // Additional check: compare date strings directly
      const todayDateString = now.toISOString().split('T')[0];
      const leadDateString = leadDate.toISOString().split('T')[0];
      const isDateStringMatch = leadDateString === todayDateString;
      
      const isToday = isLocalToday || isUTCToday || isDateStringMatch;
      
      // Debug log for first few leads
      if ((allLeadsData.data || []).indexOf(lead) < 3) {
        console.log('Lead date check:', {
          leadId: lead.id,
          dateField: dateField,
          leadDate: leadDate.toString(),
          leadDateString: leadDateString,
          todayDateString: todayDateString,
          isLocalToday,
          isUTCToday,
          isDateStringMatch,
          isToday
        });
      }
      
      return isToday;
    });
    
    console.log('📊 Leads created today:', todaysLeads.length);
    
    // Fetch ALL orders to filter by created_date
    const allOrdersResponse = await fetch(`${window.API_CONFIG.API_URL}/orders`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (!allOrdersResponse.ok) {
      throw new Error('Failed to fetch orders');
    }
    
    const allOrdersData = await allOrdersResponse.json();
    
    // Filter orders created today (handle timezone differences)
    const todaysOrders = (allOrdersData.data || []).filter(order => {
      if (!order.created_date && !order.created_at) return false;
      
      // Try both created_date and created_at fields
      const dateField = order.created_date || order.created_at;
      const orderDate = new Date(dateField);
      
      // Check if the order was created today in either local or UTC timezone
      const isLocalToday = orderDate >= today && orderDate < tomorrow;
      const isUTCToday = orderDate >= todayUTC && orderDate < tomorrowUTC;
      // Additional check: compare date strings directly
      const todayDateString = now.toISOString().split('T')[0];
      const orderDateString = orderDate.toISOString().split('T')[0];
      const isDateStringMatch = orderDateString === todayDateString;
      
      const isToday = isLocalToday || isUTCToday || isDateStringMatch;
      
      return isToday;
    });
    
    console.log('📦 Orders created today:', todaysOrders.length);
    
    // Calculate statistics FROM TODAY'S DATA ONLY
    
    // 1. Leads logged today (created today)
    const leadsLoggedToday = todaysLeads.length;
    
    // 2. Qualified leads today (leads created AND qualified today)
    const qualifiedStatuses = ['qualified', 'order_placed', 'win'];
    const leadsQualified = todaysLeads.filter(lead => 
      qualifiedStatuses.includes(lead.status?.toLowerCase())
    ).length;
    
    // 3. Potential value logged today (sum of today's leads)
    const potentialValueToday = todaysLeads.reduce((sum, lead) => 
      sum + (parseFloat(lead.lead_value) || 0), 0
    );
    
    // 4. Most leads progressed by (who created most leads today)
    const progressionCounts = {};
    todaysLeads.forEach(lead => {
      const assignee = lead.assigned_to_name || lead.created_by_name || 'Unassigned';
      progressionCounts[assignee] = (progressionCounts[assignee] || 0) + 1;
    });
    
    const topProgressor = Object.entries(progressionCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    const mostLeadsProgressedBy = topProgressor ? {
      name: topProgressor[0],
      count: topProgressor[1]
    } : { name: 'N/A', count: 0 };
    
    // 5. Successful conversions (orders created AND confirmed today)
    const successfulConversions = todaysOrders.filter(order => 
      order.status === 'confirmed' || order.status === 'delivered'
    ).length;
    
    // 6. Revenue locked (total from confirmed orders created today)
    const revenueLocked = todaysOrders
      .filter(order => order.status === 'confirmed' || order.status === 'delivered')
      .reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0);
    
    // Update state with today's statistics
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
    window.dailySummaryState.lastUpdate = new Date();
    
    console.log('📈 Daily stats updated:', window.dailySummaryState.stats);
    
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    window.dailySummaryState.loading = false;
    window.dailySummaryState.error = 'Failed to load daily statistics';
  }
  
  // Safer force update
  if (window.forceUpdate && typeof window.forceUpdate === 'function') {
    try {
      window.forceUpdate();
    } catch (e) {
      console.warn('ForceUpdate failed, will retry:', e);
      setTimeout(() => {
        if (window.renderApp) window.renderApp();
      }, 100);
    }
  }
};

// Initialize the daily summary ticker
window.initializeDailySummary = function() {
  if (window.dailySummaryState.initialized) return;
  
  window.dailySummaryState.initialized = true;
  
  // Fetch initial stats
  window.fetchDailyStats();
  
  // Set up auto-refresh every 2 minutes (more frequent than currency)
  if (window.dailySummaryState.updateInterval) {
    clearInterval(window.dailySummaryState.updateInterval);
  }
  window.dailySummaryState.updateInterval = setInterval(
    window.fetchDailyStats, 
    2 * 60 * 1000 // 2 minutes
  );
};

// Main render function
window.renderDailySummaryTicker = () => {
  const state = window.dailySummaryState;

    // Don't render on mobile
  if (window.isMobileView) {
    return null;
  }
  
  // Initialize on first render
  if (!state.initialized) {
    window.initializeDailySummary();
  }
  
  const { stats } = state;
  
  // Format currency in Indian format
  const formatINR = (amount) => {
    return '₹' + amount.toLocaleString('en-IN');
  };
  
  return React.createElement('div', { 
    className: 'bg-gray-800 text-white overflow-hidden border-t border-gray-700 cursor-pointer relative',
    onClick: () => {
      console.log('🔄 Manual daily stats refresh triggered');
      window.fetchDailyStats();
    },
    title: `Click to refresh • Last updated: ${state.lastUpdate ? state.lastUpdate.toLocaleTimeString() : 'Never'}`
  },
    // Add a subtle timestamp indicator
    state.lastUpdate && React.createElement('div', {
      className: 'absolute top-0 right-0 text-xs text-gray-500 p-1'
    }, state.lastUpdate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })),
    
    // Show error message if there's an error
    state.error ? React.createElement('div', {
      className: 'flex items-center justify-center h-8 text-red-400 text-sm'
    }, '⚠️ Unable to load daily statistics. Click to retry.') :
    React.createElement('div', { 
      className: 'ticker-wrapper',
      style: {
        display: 'flex',
        animation: state.loading ? 'none' : 'scroll-summary 40s linear infinite',
        opacity: state.loading ? 0.5 : 1
      }
    },
      // First set of items
      React.createElement('div', { className: 'flex items-center whitespace-nowrap px-4 py-2' },
        // Today's date indicator with timezone info
        React.createElement('div', { className: 'flex items-center mr-8 text-yellow-400' },
          React.createElement('span', { 
            className: 'text-sm font-semibold',
            title: `Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`
          }, 
            '📅 Today: ' + new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
          )
        ),
        
        React.createElement('div', { className: 'w-px h-4 bg-gray-600 mr-8' }),
        
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
            stats.mostLeadsProgressedBy.count > 0 
              ? `${stats.mostLeadsProgressedBy.name} (${stats.mostLeadsProgressedBy.count})`
              : 'No activity yet'
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
        // Today's date indicator with timezone info
        React.createElement('div', { className: 'flex items-center mr-8 text-yellow-400' },
          React.createElement('span', { 
            className: 'text-sm font-semibold',
            title: `Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`
          }, 
            '📅 Today: ' + new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
          )
        ),
        
        React.createElement('div', { className: 'w-px h-4 bg-gray-600 mr-8' }),
        
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
            stats.mostLeadsProgressedBy.count > 0 
              ? `${stats.mostLeadsProgressedBy.name} (${stats.mostLeadsProgressedBy.count})`
              : 'No activity yet'
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

// Manual refresh function for testing
window.refreshDailyStats = function() {
  console.log('🔄 Manual refresh of daily stats');
  window.fetchDailyStats();
};

// Debug helper to check date distribution
window.checkLeadDates = function() {
  const authToken = localStorage.getItem('crm_auth_token');
  if (!authToken) {
    console.log('Not logged in');
    return;
  }
  
  fetch(`${window.API_CONFIG.API_URL}/leads`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  })
  .then(res => res.json())
  .then(data => {
    const dateCounts = {};
    (data.data || []).forEach(lead => {
      const dateField = lead.created_date || lead.created_at;
      if (dateField) {
        const date = new Date(dateField).toISOString().split('T')[0];
        dateCounts[date] = (dateCounts[date] || 0) + 1;
      }
    });
    
    console.log('📊 Lead distribution by date:');
    Object.entries(dateCounts)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 7)
      .forEach(([date, count]) => {
        console.log(`${date}: ${count} leads`);
      });
  });
};

// Test function to check stats for a specific date
window.checkStatsForDate = function(dateString) {
  // dateString format: 'YYYY-MM-DD'
  const authToken = localStorage.getItem('crm_auth_token');
  if (!authToken) {
    console.log('Not logged in');
    return;
  }
  
  Promise.all([
    fetch(`${window.API_CONFIG.API_URL}/leads`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    }).then(res => res.json()),
    fetch(`${window.API_CONFIG.API_URL}/orders`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    }).then(res => res.json())
  ]).then(([leadsData, ordersData]) => {
    const targetDate = new Date(dateString);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const leads = (leadsData.data || []).filter(lead => {
      const dateField = lead.created_date || lead.created_at;
      if (!dateField) return false;
      const leadDate = new Date(dateField);
      return leadDate >= targetDate && leadDate < nextDate;
    });
    
    const orders = (ordersData.data || []).filter(order => {
      const dateField = order.created_date || order.created_at;
      if (!dateField) return false;
      const orderDate = new Date(dateField);
      return orderDate >= targetDate && orderDate < nextDate;
    });
    
    console.log(`📊 Stats for ${dateString}:`);
    console.log(`- Leads: ${leads.length}`);
    console.log(`- Orders: ${orders.length}`);
    console.log(`- Lead Value: ₹${leads.reduce((sum, l) => sum + (parseFloat(l.lead_value) || 0), 0).toLocaleString()}`);
    console.log(`- Order Value: ₹${orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0).toLocaleString()}`);
  });
};

console.log('✅ Daily Summary Ticker component loaded successfully');
console.log('💡 To manually refresh stats, run: window.refreshDailyStats()');
console.log('💡 To check current stats, run: window.dailySummaryState.stats');
console.log('💡 To check lead date distribution, run: window.checkLeadDates()');
console.log('💡 To check stats for specific date, run: window.checkStatsForDate("2025-01-15")');
