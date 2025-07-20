// ===============================================
// ENHANCED RECENT ACTIVITY COMPONENT - API VERSION
// File: components/enhanced-recent-activity.js
// ===============================================

// Create the React component
const EnhancedRecentActivityComponent = () => {
  console.log('🔄 Rendering Enhanced Recent Activity (API Version)...');
  
  // State management
  const [recentLeads, setRecentLeads] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  // Fetch recent activity from API
  const fetchRecentActivity = React.useCallback(async () => {
    console.log('📡 Fetching recent activity from API...');
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${window.API_CONFIG.API_URL}/dashboard/recent-activity?limit=10`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('crm_auth_token'),
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch recent activity');
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        console.log('✅ Recent activity data received:', result.data.length, 'leads');
        setRecentLeads(result.data);
      } else {
        throw new Error(result.error || 'Failed to load recent activity');
      }
    } catch (error) {
      console.error('❌ Error fetching recent activity:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data on component mount
  React.useEffect(() => {
    fetchRecentActivity();
  }, [fetchRecentActivity]);

  // Helper function to get status color and icon
  const getStatusDisplay = (status) => {
    const statusConfig = window.LEAD_STATUSES && window.LEAD_STATUSES[status];
    if (statusConfig) {
      return {
        color: statusConfig.color || 'bg-gray-100 text-gray-800',
        label: statusConfig.label || status,
        icon: getStatusIcon(status)
      };
    }
    return {
      color: 'bg-gray-100 text-gray-800',
      label: status || 'Unknown',
      icon: '📋'
    };
  };

  // Helper function to get status icons
  const getStatusIcon = (status) => {
    const iconMap = {
      'new': '🆕',
      'contacted': '📞',
      'qualified': '✅',
      'hot': '🔥',
      'warm': '🌡️',
      'cold': '❄️',
      'junk': '🗑️',
      'converted': '💰',
      'pickup_later': '⏰',
      'not_interested': '❌'
    };
    return iconMap[status] || '📋';
  };

  // Helper function to format relative time
  const getRelativeTime = (dateString) => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Helper function to get temperature display
  const getTemperatureDisplay = (lead) => {
    const temp = lead.temperature || lead.status;
    const tempMap = {
      'hot': { icon: '🔥', color: 'text-red-600', label: 'Hot' },
      'warm': { icon: '🌡️', color: 'text-orange-600', label: 'Warm' },
      'cold': { icon: '❄️', color: 'text-blue-600', label: 'Cold' },
      'qualified': { icon: '🔥', color: 'text-red-600', label: 'Hot' }
    };
    return tempMap[temp] || { icon: '📊', color: 'text-gray-600', label: 'Unknown' };
  };

  // Quick action handlers
  const handleQuickCall = (lead) => {
    console.log('📞 Quick call for lead:', lead.name);
    if (lead.phone) {
      window.open(`tel:${lead.phone}`);
    } else {
      alert('No phone number available for this lead');
    }
  };

  const handleQuickEmail = (lead) => {
    console.log('📧 Quick email for lead:', lead.name);
    if (lead.email) {
      window.open(`mailto:${lead.email}`);
    } else {
      alert('No email address available for this lead');
    }
  };

  const handleQuickEdit = (lead) => {
    console.log('✏️ Quick edit for lead:', lead.name);
    if (window.editLead) {
      window.editLead(lead);
    } else {
      alert('Edit function not available');
    }
  };

  const handleQuickProgress = (lead) => {
    console.log('⏭️ Quick progress for lead:', lead.name);
    if (window.progressLead) {
      window.progressLead(lead);
    } else {
      alert('Progress function not available');
    }
  };

  const handleViewDetails = (lead) => {
    console.log('👁️ View details for lead:', lead.name);
    if (window.openLeadDetail) {
      window.openLeadDetail(lead);
    } else {
      alert('Lead detail function not available');
    }
  };

  // Render component
  return React.createElement('div', { 
    className: 'bg-white dark:bg-gray-800 rounded-lg shadow border'
  },
    // Header with actions
    React.createElement('div', { 
      className: 'p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between'
    },
      React.createElement('div', { className: 'flex items-center space-x-2' },
        React.createElement('h3', { 
          className: 'text-lg font-semibold text-gray-900 dark:text-white'
        }, 'Recent Activity'),
        !isLoading && React.createElement('span', {
          className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'
        }, `${recentLeads.length} leads`)
      ),
      React.createElement('div', { className: 'flex items-center space-x-2' },
        React.createElement('button', {
          onClick: fetchRecentActivity,
          disabled: isLoading,
          className: 'inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
        },
          React.createElement('span', { 
            className: isLoading ? 'mr-1 animate-spin' : 'mr-1' 
          }, '🔄'),
          'Refresh'
        )
      )
    ),

    // Recent Activity List
    React.createElement('div', { className: 'p-6' },
      // Loading state
      isLoading ? 
        React.createElement('div', { className: 'text-center py-12' },
          React.createElement('div', { className: 'animate-pulse' },
            React.createElement('div', { className: 'h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4' }),
            React.createElement('div', { className: 'h-4 bg-gray-200 rounded w-1/2 mx-auto' })
          ),
          React.createElement('p', { className: 'text-gray-500 mt-4' }, 'Loading recent activity...')
        ) :
      
      // Error state
      error ?
        React.createElement('div', { className: 'text-center py-12' },
          React.createElement('div', { className: 'text-4xl mb-4' }, '⚠️'),
          React.createElement('h3', { className: 'text-lg font-medium text-gray-900 mb-2' }, 'Error Loading Activity'),
          React.createElement('p', { className: 'text-gray-500 mb-4' }, error),
          React.createElement('button', {
            onClick: fetchRecentActivity,
            className: 'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          },
            React.createElement('span', { className: 'mr-2' }, '🔄'),
            'Try Again'
          )
        ) :
      
      // Data state
      recentLeads.length > 0 ?
        React.createElement('div', { className: 'space-y-4' },
          recentLeads.map((lead, index) => {
            const statusDisplay = getStatusDisplay(lead.status);
            const tempDisplay = getTemperatureDisplay(lead);
            const timeAgo = getRelativeTime(lead.updated_date || lead.created_date);
            
            return React.createElement('div', {
              key: lead.id || index,
              className: 'border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
            },
              // Lead info row
              React.createElement('div', { className: 'flex items-start justify-between mb-3' },
                React.createElement('div', { className: 'flex-1' },
                  React.createElement('div', { className: 'flex items-center space-x-2 mb-1' },
                    React.createElement('h4', { 
                      className: 'font-medium text-gray-900 dark:text-white cursor-pointer hover:text-blue-600',
                      onClick: () => handleViewDetails(lead)
                    }, lead.name || 'Unknown Lead'),
                    
                    // Status badge
                    React.createElement('span', {
                      className: `inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusDisplay.color}`
                    },
                      React.createElement('span', { className: 'mr-1' }, statusDisplay.icon),
                      statusDisplay.label
                    ),
                    
                    // Temperature indicator
                    React.createElement('span', {
                      className: `${tempDisplay.color} text-sm`
                    },
                      React.createElement('span', null, tempDisplay.icon),
                      React.createElement('span', { className: 'ml-1' }, tempDisplay.label)
                    )
                  ),
                  
                  // Contact info
                  React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-400' },
                    lead.phone && React.createElement('span', { className: 'mr-3' }, 
                      '📱 ', lead.phone
                    ),
                    lead.email && React.createElement('span', null, 
                      '✉️ ', lead.email
                    )
                  )
                ),
                
                // Time indicator
                React.createElement('div', { 
                  className: 'text-xs text-gray-500 dark:text-gray-400'
                }, timeAgo)
              ),
              
              // Additional info row
              React.createElement('div', { className: 'flex items-center justify-between text-sm' },
                React.createElement('div', { className: 'flex items-center space-x-4 text-gray-600 dark:text-gray-400' },
                  lead.lead_for_event && React.createElement('span', null,
                    '🎯 ', lead.lead_for_event
                  ),
                  lead.source && React.createElement('span', null,
                    '📍 ', lead.source
                  ),
                  lead.potential_value && React.createElement('span', null,
                    '💰 ₹', parseFloat(lead.potential_value).toLocaleString()
                  )
                ),
                
                // Quick actions
                React.createElement('div', { className: 'flex items-center space-x-1' },
                  React.createElement('button', {
                    onClick: () => handleQuickCall(lead),
                    className: 'p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                    title: 'Quick Call'
                  }, '📞'),
                  
                  React.createElement('button', {
                    onClick: () => handleQuickEmail(lead),
                    className: 'p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                    title: 'Quick Email'
                  }, '📧'),
                  
                  React.createElement('button', {
                    onClick: () => handleQuickEdit(lead),
                    className: 'p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                    title: 'Quick Edit'
                  }, '✏️'),
                  
                  React.createElement('button', {
                    onClick: () => handleQuickProgress(lead),
                    className: 'p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                    title: 'Progress Lead'
                  }, '⏭️')
                )
              ),
              
              // Assigned to info
              lead.assigned_to && React.createElement('div', { 
                className: 'mt-2 text-xs text-gray-500 dark:text-gray-400'
              },
                '👤 Assigned to: ',
                window.getUserDisplayName ? 
                  window.getUserDisplayName(lead.assigned_to, window.users) : lead.assigned_to
              )
            );
          })
        ) :
        
        // Empty state
        React.createElement('div', { className: 'text-center py-12' },
          React.createElement('div', { className: 'text-4xl mb-4' }, '📭'),
          React.createElement('h3', { className: 'text-lg font-medium text-gray-900 mb-2' }, 'No Recent Activity'),
          React.createElement('p', { className: 'text-gray-500' }, 'No leads found with recent activity.'),
          React.createElement('button', {
            onClick: fetchRecentActivity,
            className: 'mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          },
            React.createElement('span', { className: 'mr-2' }, '🔄'),
            'Refresh Activity'
          )
        )
    )
  );
};

// Create the wrapper function that returns the React component
window.renderEnhancedRecentActivity = function() {
  return React.createElement(EnhancedRecentActivityComponent);
};

console.log('✅ Enhanced Recent Activity Component (API Version) loaded successfully');
