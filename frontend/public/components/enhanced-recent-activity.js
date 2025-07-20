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
      setError(error.message || 'Failed to load recent activity');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on mount
  React.useEffect(() => {
    fetchRecentActivity();
  }, [fetchRecentActivity]);

  // Helper functions
  const getStatusDisplay = (status) => {
    const statusConfig = window.LEAD_STATUSES?.[status] || {
      label: status || 'Unknown',
      color: 'bg-gray-100 text-gray-800',
      icon: '📋'
    };
    return statusConfig;
  };

  const getTemperatureDisplay = (lead) => {
    const temp = lead.temperature?.toLowerCase();
    const tempConfig = {
      hot: { icon: '🔥', color: 'text-red-600 bg-red-50' },
      warm: { icon: '☀️', color: 'text-yellow-600 bg-yellow-50' },
      cold: { icon: '❄️', color: 'text-blue-600 bg-blue-50' }
    };
    return tempConfig[temp] || null;
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return 'Unknown time';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 30) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Action handlers
  const handleQuickCall = (lead) => {
    console.log('📞 Quick call for lead:', lead.name);
    if (lead.phone) {
      window.location.href = `tel:${lead.phone}`;
    } else {
      alert('No phone number available for this lead');
    }
  };

  const handleQuickEmail = (lead) => {
    console.log('📧 Quick email for lead:', lead.name);
    if (lead.email) {
      window.location.href = `mailto:${lead.email}`;
    } else {
      alert('No email available for this lead');
    }
  };

  const handleQuickEdit = (lead) => {
    console.log('✏️ Quick edit for lead:', lead.name);
    if (window.openEditForm) {
      window.openEditForm(lead);
    } else {
      alert('Edit function not available');
    }
  };

  const handleQuickProgress = (lead) => {
    console.log('⏭️ Progress lead:', lead.name);
    if (window.handleLeadProgression) {
      window.handleLeadProgression(lead);
    } else {
      alert('Lead progression function not available');
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
              className: 'border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer',
              onClick: (e) => {
                // Prevent click if clicking on action buttons
                if (e.target.closest('button')) return;
                handleViewDetails(lead);
              }
            },
              // Lead info row
              React.createElement('div', { className: 'flex items-start justify-between mb-3' },
                React.createElement('div', { className: 'flex-1' },
                  React.createElement('div', { className: 'flex items-center space-x-2 mb-1' },
                    React.createElement('h4', { 
                      className: 'font-medium text-gray-900 dark:text-white hover:text-blue-600'
                    }, lead.name || 'Unknown Lead'),
                    
                    // Status badge
                    React.createElement('span', {
                      className: `inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusDisplay.color}`
                    },
                      React.createElement('span', { className: 'mr-1' }, statusDisplay.icon),
                      statusDisplay.label
                    ),
                    
                    // Temperature indicator
                    tempDisplay && React.createElement('span', {
                      className: `inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${tempDisplay.color}`
                    },
                      React.createElement('span', { className: 'mr-1' }, tempDisplay.icon),
                      lead.temperature
                    )
                  ),
                  
                  // Lead details
                  React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-400 space-y-1' },
                    lead.email && React.createElement('div', null, 
                      '📧 ', lead.email
                    ),
                    lead.phone && React.createElement('div', null, 
                      '📱 ', lead.phone
                    ),
                    lead.lead_for_event && React.createElement('div', null, 
                      '🎫 ', lead.lead_for_event
                    ),
                    lead.potential_value && React.createElement('div', { 
                      className: 'font-medium text-green-600 dark:text-green-400' 
                    }, 
                      '₹ ', parseInt(lead.potential_value).toLocaleString()
                    )
                  )
                ),
                
                // Quick actions
                React.createElement('div', { className: 'flex items-center space-x-1' },
                  React.createElement('button', {
                    onClick: (e) => {
                      e.stopPropagation();
                      handleQuickCall(lead);
                    },
                    className: 'p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                    title: 'Quick Call'
                  }, '📞'),
                  
                  React.createElement('button', {
                    onClick: (e) => {
                      e.stopPropagation();
                      handleQuickEmail(lead);
                    },
                    className: 'p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                    title: 'Quick Email'
                  }, '📧'),
                  
                  React.createElement('button', {
                    onClick: (e) => {
                      e.stopPropagation();
                      handleQuickEdit(lead);
                    },
                    className: 'p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                    title: 'Quick Edit'
                  }, '✏️'),
                  
                  React.createElement('button', {
                    onClick: (e) => {
                      e.stopPropagation();
                      handleQuickProgress(lead);
                    },
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
