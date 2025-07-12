// ===============================================
// ENHANCED RECENT ACTIVITY COMPONENT
// File: components/enhanced-recent-activity.js
// ===============================================

window.renderEnhancedRecentActivity = function() {
  console.log('🔄 Rendering Enhanced Recent Activity...');
  
  // Get recent leads (last 10, sorted by most recent activity)
  const getRecentLeads = () => {
    const allLeads = window.getFilteredLeads ? window.getFilteredLeads() : (window.leads || []);
    
    return allLeads
      .sort((a, b) => {
        const dateA = new Date(a.updated_date || a.created_date || 0);
        const dateB = new Date(b.updated_date || b.created_date || 0);
        return dateB - dateA; // Most recent first
      })
      .slice(0, 10); // Show last 10 activities
  };

  const recentLeads = getRecentLeads();

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
        React.createElement('span', {
          className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'
        }, `${recentLeads.length} leads`)
      ),
      React.createElement('div', { className: 'flex items-center space-x-2' },
        React.createElement('button', {
          onClick: () => window.fetchLeads && window.fetchLeads(),
          className: 'inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        },
          React.createElement('span', { className: 'mr-1' }, '🔄'),
          'Refresh'
        )
      )
    ),

    // Recent Activity List
    React.createElement('div', { className: 'p-6' },
      recentLeads.length > 0 ?
        React.createElement('div', { className: 'space-y-4' },
          recentLeads.map((lead, index) => {
            const statusDisplay = getStatusDisplay(lead.status);
            const tempDisplay = getTemperatureDisplay(lead);
            const lastActivity = getRelativeTime(lead.updated_date || lead.created_date);
            
            return React.createElement('div', {
              key: lead.id,
              className: 'group relative bg-gradient-to-r from-gray-50 to-white hover:from-blue-50 hover:to-white border border-gray-200 rounded-lg p-4 transition-all duration-200 hover:shadow-md cursor-pointer',
              onClick: () => handleViewDetails(lead)
            },
              // Main content row
              React.createElement('div', { className: 'flex items-center justify-between' },
                // Left side - Lead info
                React.createElement('div', { className: 'flex items-center space-x-4 flex-1' },
                  // Avatar or icon
                  React.createElement('div', {
                    className: 'flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm'
                  }, (lead.name || 'Unknown').charAt(0).toUpperCase()),
                  
                  // Lead details
                  React.createElement('div', { className: 'flex-1 min-w-0' },
                    React.createElement('div', { className: 'flex items-center space-x-2' },
                      React.createElement('h4', {
                        className: 'text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600'
                      }, lead.name || 'Unknown Lead'),
                      React.createElement('span', {
                        className: `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusDisplay.color}`
                      }, statusDisplay.icon, ' ', statusDisplay.label)
                    ),
                    
                    React.createElement('div', { className: 'mt-1 flex items-center space-x-4 text-xs text-gray-500' },
                      // Company
                      lead.company && React.createElement('span', {
                        className: 'flex items-center'
                      }, 
                        React.createElement('span', { className: 'mr-1' }, '🏢'),
                        lead.company
                      ),
                      
                      // Phone
                      lead.phone && React.createElement('span', {
                        className: 'flex items-center'
                      },
                        React.createElement('span', { className: 'mr-1' }, '📞'),
                        lead.phone
                      ),
                      
                      // Email
                      lead.email && React.createElement('span', {
                        className: 'flex items-center truncate'
                      },
                        React.createElement('span', { className: 'mr-1' }, '📧'),
                        lead.email
                      )
                    )
                  )
                ),

                // Center - Temperature & Value
                React.createElement('div', { className: 'flex items-center space-x-6 text-sm' },
                  // Temperature
                  React.createElement('div', { className: 'text-center' },
                    React.createElement('div', { className: `text-lg ${tempDisplay.color}` }, tempDisplay.icon),
                    React.createElement('div', { className: 'text-xs text-gray-500' }, tempDisplay.label)
                  ),
                  
                  // Value
                  React.createElement('div', { className: 'text-center' },
                    React.createElement('div', { className: 'font-semibold text-green-600' }, 
                      lead.potential_value ? `₹${(parseFloat(lead.potential_value) || 0).toLocaleString()}` : '₹0'
                    ),
                    React.createElement('div', { className: 'text-xs text-gray-500' }, 'Value')
                  ),
                  
                  // Last activity
                  React.createElement('div', { className: 'text-center' },
                    React.createElement('div', { className: 'text-xs font-medium text-gray-700' }, lastActivity),
                    React.createElement('div', { className: 'text-xs text-gray-500' }, 'Last activity')
                  )
                ),

                // Right side - Quick actions
                React.createElement('div', { 
                  className: 'flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity',
                  onClick: (e) => e.stopPropagation() // Prevent triggering the main click
                },
                  // Call button
                  lead.phone && React.createElement('button', {
                    onClick: () => handleQuickCall(lead),
                    className: 'p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors',
                    title: 'Quick Call'
                  }, '📞'),
                  
                  // Email button
                  lead.email && React.createElement('button', {
                    onClick: () => handleQuickEmail(lead),
                    className: 'p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors',
                    title: 'Quick Email'
                  }, '📧'),
                  
                  // Edit button
                  React.createElement('button', {
                    onClick: () => handleQuickEdit(lead),
                    className: 'p-2 text-orange-600 hover:bg-orange-50 rounded-full transition-colors',
                    title: 'Quick Edit'
                  }, '✏️'),
                  
                  // Progress button
                  React.createElement('button', {
                    onClick: () => handleQuickProgress(lead),
                    className: 'p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors',
                    title: 'Progress Lead'
                  }, '⏭️')
                )
              ),

              // Assignment info (if assigned)
              lead.assigned_to && React.createElement('div', { 
                className: 'mt-2 pt-2 border-t border-gray-100 flex items-center text-xs text-gray-500'
              },
                React.createElement('span', { className: 'mr-1' }, '👤'),
                'Assigned to: ',
                React.createElement('span', { className: 'font-medium text-gray-700 ml-1' },
                  window.getUserDisplayName ? window.getUserDisplayName(lead.assigned_to, window.users) : lead.assigned_to
                )
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
            onClick: () => window.fetchLeads && window.fetchLeads(),
            className: 'mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          },
            React.createElement('span', { className: 'mr-2' }, '🔄'),
            'Refresh Leads'
          )
        )
    )
  );
};

console.log('✅ Enhanced Recent Activity Component loaded successfully');
