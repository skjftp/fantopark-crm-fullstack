// Enhanced Reminders Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility
// ENHANCED: Smart text truncation for long descriptions

// Reminders data array
window.reminders = window.reminders || [];

// Reminder stats state
window.reminderStats = window.reminderStats || {
    totalReminders: 0,
    overdueReminders: 0,
    upcomingReminders: 0,
    completedReminders: 0
};

window.reminderSearchQuery = window.reminderSearchQuery || '';
window.reminderStatusFilter = window.reminderStatusFilter || 'all';
window.reminderPriorityFilter = window.reminderPriorityFilter || 'all';
window.reminderTypeFilter = window.reminderTypeFilter || 'all';
window.reminderDateFilter = window.reminderDateFilter || 'all';
window.reminderSortBy = window.reminderSortBy || 'due_date';
window.reminderSortOrder = window.reminderSortOrder || 'asc';

// ===== NEW: Smart Text Truncation Component =====
window.TruncatedText = ({ text, maxLength = 80 }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  if (!text) return React.createElement('span', { className: 'text-gray-400 italic' }, 'No description');
  
  const shouldTruncate = text.length > maxLength;
  const displayText = shouldTruncate && !isExpanded 
    ? text.substring(0, maxLength) + '...' 
    : text;

  return React.createElement('div', { className: 'max-w-md' },
    React.createElement('span', { 
      className: 'text-sm text-gray-500 break-words' 
    }, displayText),
    
    shouldTruncate && React.createElement('button', {
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsExpanded(!isExpanded);
      },
      className: 'ml-2 text-blue-600 hover:text-blue-800 text-xs font-medium underline focus:outline-none'
    }, isExpanded ? 'Show less' : 'Show more')
  );
};

// Add after TruncatedText component
window.ReminderFilters = () => {
  const [localSearchQuery, setLocalSearchQuery] = React.useState(window.reminderSearchQuery || '');

  const handleSearchChange = (value) => {
    setLocalSearchQuery(value);
    window.reminderSearchQuery = value;
    if (window.fetchReminders) window.fetchReminders();
  };

  const handleFilterChange = (filterType, value) => {
    switch(filterType) {
      case 'status':
        window.reminderStatusFilter = value;
        break;
      case 'priority':
        window.reminderPriorityFilter = value;
        break;
      case 'type':
        window.reminderTypeFilter = value;
        break;
      case 'date':
        window.reminderDateFilter = value;
        break;
    }
    if (window.fetchReminders) window.fetchReminders();
  };

  return React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6' },
    // Search Bar
    React.createElement('div', { className: 'mb-4' },
      React.createElement('input', {
        type: 'text',
        value: localSearchQuery,
        onChange: (e) => handleSearchChange(e.target.value),
        placeholder: 'Search reminders by title, description, or lead name...',
        className: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
      })
    ),

    // Filter Controls
    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-3' },
      // Status Filter
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 'Status'),
        React.createElement('select', {
          value: window.reminderStatusFilter,
          onChange: (e) => handleFilterChange('status', e.target.value),
          className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
        },
          React.createElement('option', { value: 'all' }, 'All Status'),
          React.createElement('option', { value: 'pending' }, 'Pending'),
          React.createElement('option', { value: 'completed' }, 'Completed'),
          React.createElement('option', { value: 'snoozed' }, 'Snoozed'),
          React.createElement('option', { value: 'overdue' }, 'Overdue')
        )
      ),

      // Priority Filter
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 'Priority'),
        React.createElement('select', {
          value: window.reminderPriorityFilter,
          onChange: (e) => handleFilterChange('priority', e.target.value),
          className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
        },
          React.createElement('option', { value: 'all' }, 'All Priorities'),
          React.createElement('option', { value: 'urgent' }, 'Urgent'),
          React.createElement('option', { value: 'high' }, 'High'),
          React.createElement('option', { value: 'medium' }, 'Medium'),
          React.createElement('option', { value: 'low' }, 'Low')
        )
      ),

      // Type Filter
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 'Type'),
        React.createElement('select', {
          value: window.reminderTypeFilter,
          onChange: (e) => handleFilterChange('type', e.target.value),
          className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
        },
          React.createElement('option', { value: 'all' }, 'All Types'),
          React.createElement('option', { value: 'follow_up' }, 'Follow Up'),
          React.createElement('option', { value: 'call_back' }, 'Call Back'),
          React.createElement('option', { value: 'quote_follow_up' }, 'Quote Follow Up'),
          React.createElement('option', { value: 'manual' }, 'Manual')
        )
      ),

      // Date Filter
      React.createElement('div', null,
        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 'Due Date'),
        React.createElement('select', {
          value: window.reminderDateFilter,
          onChange: (e) => handleFilterChange('date', e.target.value),
          className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
        },
          React.createElement('option', { value: 'all' }, 'All Dates'),
          React.createElement('option', { value: 'overdue' }, 'Overdue'),
          React.createElement('option', { value: 'today' }, 'Due Today'),
          React.createElement('option', { value: 'tomorrow' }, 'Due Tomorrow'),
          React.createElement('option', { value: 'week' }, 'This Week'),
          React.createElement('option', { value: 'month' }, 'This Month')
        )
      )
    ),
    
    // Reset Filters Button
    React.createElement('div', { className: 'mt-4 flex justify-end' },
      React.createElement('button', {
        onClick: () => {
          window.reminderSearchQuery = '';
          window.reminderStatusFilter = 'all';
          window.reminderPriorityFilter = 'all';
          window.reminderTypeFilter = 'all';
          window.reminderDateFilter = 'all';
          setLocalSearchQuery('');
          if (window.fetchReminders) window.fetchReminders();
        },
        className: 'px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
      }, '🔄 Reset Filters')
    )
  );
};

// Enhanced filter function that combines all filters
window.getFilteredReminders = function() {
  let filtered = [...(window.reminders || [])];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24*60*60*1000);
  const weekEnd = new Date(today.getTime() + 7*24*60*60*1000);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  // Search filter
  if (window.reminderSearchQuery && window.reminderSearchQuery.trim()) {
    const searchLower = window.reminderSearchQuery.toLowerCase();
    filtered = filtered.filter(r => {
      // Search in reminder fields
      const titleMatch = r.title && r.title.toLowerCase().includes(searchLower);
      const descMatch = r.description && r.description.toLowerCase().includes(searchLower);
      
      // Search in associated lead name
      const lead = window.leads?.find(l => l.id === r.lead_id);
      const leadMatch = lead && lead.name && lead.name.toLowerCase().includes(searchLower);
      
      return titleMatch || descMatch || leadMatch;
    });
  }

  // Status filter
  if (window.reminderStatusFilter && window.reminderStatusFilter !== 'all') {
    if (window.reminderStatusFilter === 'overdue') {
      filtered = filtered.filter(r => 
        r.status === 'pending' && new Date(r.due_date) < now
      );
    } else {
      filtered = filtered.filter(r => r.status === window.reminderStatusFilter);
    }
  }

  // Priority filter
  if (window.reminderPriorityFilter && window.reminderPriorityFilter !== 'all') {
    filtered = filtered.filter(r => r.priority === window.reminderPriorityFilter);
  }

  // Type filter
  if (window.reminderTypeFilter && window.reminderTypeFilter !== 'all') {
    filtered = filtered.filter(r => r.reminder_type === window.reminderTypeFilter);
  }

  // Date filter
  if (window.reminderDateFilter && window.reminderDateFilter !== 'all') {
    switch(window.reminderDateFilter) {
      case 'overdue':
        filtered = filtered.filter(r => new Date(r.due_date) < now);
        break;
      case 'today':
        filtered = filtered.filter(r => {
          const dueDate = new Date(r.due_date);
          return dueDate >= today && dueDate < tomorrow;
        });
        break;
      case 'tomorrow':
        filtered = filtered.filter(r => {
          const dueDate = new Date(r.due_date);
          return dueDate >= tomorrow && dueDate < new Date(tomorrow.getTime() + 24*60*60*1000);
        });
        break;
      case 'week':
        filtered = filtered.filter(r => {
          const dueDate = new Date(r.due_date);
          return dueDate >= today && dueDate <= weekEnd;
        });
        break;
      case 'month':
        filtered = filtered.filter(r => {
          const dueDate = new Date(r.due_date);
          return dueDate >= today && dueDate <= monthEnd;
        });
        break;
    }
  }

  // Sort
  filtered.sort((a, b) => {
    let compareValue = 0;
    
    switch(window.reminderSortBy) {
      case 'due_date':
        compareValue = new Date(a.due_date) - new Date(b.due_date);
        break;
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        compareValue = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        break;
      case 'created_date':
        compareValue = new Date(b.created_date) - new Date(a.created_date);
        break;
    }
    
    return window.reminderSortOrder === 'desc' ? -compareValue : compareValue;
  });

  return filtered;
};

// ===== ENHANCED: Main Reminders Content Function with Smart Text Display =====
window.renderRemindersContent = () => {
  const leads = window.leads || [];

  // Helper function for relative time
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      const overdueDays = Math.abs(diffDays);
      const overdueHours = Math.abs(diffHours);
      if (overdueDays > 0) return `${overdueDays} day${overdueDays > 1 ? 's' : ''} overdue`;
      if (overdueHours > 0) return `${overdueHours} hour${overdueHours > 1 ? 's' : ''} overdue`;
      return 'Overdue';
    }
    
    if (diffDays > 0) return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    return 'Soon';
  };

  // Helper functions
  const completeReminder = async (reminderId, notes = '') => {
    if (window.completeReminder) {
      await window.completeReminder(reminderId, notes);
    }
  };

  const snoozeReminder = async (reminderId, hours = 24) => {
    if (window.snoozeReminder) {
      await window.snoozeReminder(reminderId, hours);
    }
  };

  const deleteReminder = async (reminderId) => {
    if (window.deleteReminder) {
      await window.deleteReminder(reminderId);
    }
  };

  const fetchReminders = () => {
    if (window.fetchReminders) {
      window.fetchReminders();
    }
  };

  return React.createElement('div', { className: 'space-y-6' },
    // Header with actions
    React.createElement('div', { className: 'flex justify-between items-center' },
      React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' }, 'Reminders'),
      React.createElement('div', { className: 'flex gap-3' },
        React.createElement('button', {
          onClick: () => window.setShowReminderForm && window.setShowReminderForm(true),
          className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2'
        }, 
          React.createElement('span', null, '➕'),
          'Create Reminder'
        ),
        React.createElement('button', {
          onClick: () => fetchReminders(),
          className: 'px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700'
        }, '🔄 Refresh')
      )
    ),

    // Quick stats
    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-4' },
      React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 shadow' },
        React.createElement('div', { className: 'text-3xl font-bold text-blue-600' }, window.reminderStats.total || 0),
        React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-400' }, 'Total Reminders')
      ),
      React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 shadow' },
        React.createElement('div', { className: 'text-3xl font-bold text-red-600' }, window.reminderStats.overdue || 0),
        React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-400' }, 'Overdue')
      ),
      React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 shadow' },
        React.createElement('div', { className: 'text-3xl font-bold text-orange-600' }, window.reminderStats.due_today || 0),
        React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-400' }, 'Due Today')
      ),
      React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 shadow' },
        React.createElement('div', { className: 'text-3xl font-bold text-green-600' }, window.reminderStats.pending || 0),
        React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-400' }, 'Pending')
      )
    ),

    React.createElement(window.ReminderFilters),
    
    // ===== ENHANCED: Reminders table with smart text truncation =====
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow' },
      React.createElement('div', { className: 'px-6 py-4 border-b border-gray-200 dark:border-gray-700' },
        React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 dark:text-white' }, 'All Reminders')
      ),
      React.createElement('div', { className: 'overflow-x-auto' },
        React.createElement('table', { className: 'w-full' },
          React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-700' },
            React.createElement('tr', null,
              // Title - not sortable
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Title'),
              
              // Due Date - sortable
              React.createElement('th', { 
                className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700',
                onClick: () => {
                  window.reminderSortBy = 'due_date';
                  window.reminderSortOrder = window.reminderSortOrder === 'asc' ? 'desc' : 'asc';
                  if (window.fetchReminders) window.fetchReminders();
                }
              }, 
                React.createElement('span', { className: 'flex items-center gap-1' },
                  'Due Date',
                  window.reminderSortBy === 'due_date' && React.createElement('span', null, window.reminderSortOrder === 'asc' ? '↑' : '↓')
                )
              ),
              
              // Status - not sortable
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Status'),
              
              // Priority - sortable
              React.createElement('th', { 
                className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700',
                onClick: () => {
                  window.reminderSortBy = 'priority';
                  window.reminderSortOrder = window.reminderSortOrder === 'asc' ? 'desc' : 'asc';
                  if (window.fetchReminders) window.fetchReminders();
                }
              }, 
                React.createElement('span', { className: 'flex items-center gap-1' },
                  'Priority',
                  window.reminderSortBy === 'priority' && React.createElement('span', null, window.reminderSortOrder === 'asc' ? '↑' : '↓')
                )
              ),
              
              // Assigned To - not sortable
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Assigned To'),
              
              // Actions - not sortable
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Actions')
            )
          ),
          React.createElement('tbody', { className: 'bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700' },
            (window.getFilteredReminders ? window.getFilteredReminders() : window.reminders || []).length > 0 ?
            (window.getFilteredReminders ? window.getFilteredReminders() : window.reminders || []).map(reminder => {
              const isOverdue = new Date(reminder.due_date) < new Date() && reminder.status === 'pending';
              const lead = leads.find(l => l.id === reminder.lead_id);

              return React.createElement('tr', { 
                key: reminder.id,
                className: `hover:bg-gray-50 dark:hover:bg-gray-600 ${isOverdue ? 'bg-red-50 dark:bg-red-900/20' : ''}`
              },
                // ===== ENHANCED: Title column with smart text handling =====
                React.createElement('td', { className: 'px-6 py-4' },
                  React.createElement('div', { className: 'space-y-1' },
                    // Title with icon based on reminder type
                    React.createElement('div', { className: 'flex items-center gap-2' },
                      React.createElement('span', { className: 'text-lg' },
                        reminder.reminder_type === 'pickup_later' ? '📞' :
                        reminder.reminder_type === 'communication_followup' ? '💬' :
                        reminder.reminder_type === 'status_change' ? '🔄' :
                        reminder.reminder_type === 'quote_requested' ? '📋' :
                        reminder.auto_generated ? '🤖' : '📌'
                      ),
                      React.createElement('div', { className: 'text-sm font-medium text-gray-900 dark:text-white max-w-xs' },
                        reminder.title || 'No title'
                      )
                    ),
                    
                    // ===== NEW: Smart description with truncation =====
                    React.createElement(window.TruncatedText, {
                      text: reminder.description,
                      maxLength: 100
                    }),
                    
                    // Auto-generated indicator
                    reminder.auto_generated && React.createElement('span', { 
                      className: 'inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800' 
                    }, 
                      React.createElement('span', { className: 'mr-1' }, '🤖'),
                      'Auto-generated'
                    )
                  )
                ),

                // Due Date column
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                  React.createElement('div', { className: 'space-y-1' },
                    React.createElement('div', { className: 'text-sm text-gray-900 dark:text-white' }, 
                      new Date(reminder.due_date).toLocaleDateString()
                    ),
                    React.createElement('div', { className: 'text-xs text-gray-500' },
                      new Date(reminder.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    ),
                    React.createElement('div', { 
                      className: `text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-gray-500'}` 
                    }, 
                      isOverdue ? 'OVERDUE' : formatRelativeTime(reminder.due_date)
                    )
                  )
                ),

                // Status column
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                  React.createElement('span', { 
                    className: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      reminder.status === 'pending' ? (isOverdue ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800') :
                      reminder.status === 'completed' ? 'bg-green-100 text-green-800' :
                      reminder.status === 'snoozed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`
                  }, 
                    reminder.status === 'pending' && isOverdue ? 'OVERDUE' : reminder.status.toUpperCase()
                  )
                ),

                // Priority column
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                  React.createElement('span', { 
                    className: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      reminder.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      reminder.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      reminder.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`
                  }, 
                    React.createElement('span', { className: 'mr-1' },
                      reminder.priority === 'urgent' ? '🚨' :
                      reminder.priority === 'high' ? '⚠️' :
                      reminder.priority === 'medium' ? '📝' : '✅'
                    ),
                    reminder.priority.toUpperCase()
                  )
                ),

                // Assigned To column
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white' },
                  reminder.assigned_to?.split('@')[0] || 'Unassigned'
                ),

                // ===== ENHANCED: Actions column with better spacing =====
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm font-medium' },
                  React.createElement('div', { className: 'flex flex-col space-y-1' },
                    // Action buttons row 1
                    React.createElement('div', { className: 'flex space-x-2' },
                      reminder.status === 'pending' && React.createElement('button', {
                        onClick: () => completeReminder(reminder.id, 'Completed'),
                        className: 'text-green-600 hover:text-green-900 text-xs'
                      }, '✓ Complete'),
                      reminder.status === 'pending' && React.createElement('button', {
                        onClick: () => snoozeReminder(reminder.id, 24),
                        className: 'text-blue-600 hover:text-blue-900 text-xs'
                      }, '⏰ Snooze')
                    ),
                    
                    // Action buttons row 2
                    React.createElement('div', { className: 'flex space-x-2' },
                      React.createElement('button', {
                        onClick: () => deleteReminder(reminder.id),
                        className: 'text-red-600 hover:text-red-900 text-xs'
                      }, '🗑️ Delete'),
                      
                      lead && React.createElement('button', {
                        onClick: () => {
                          window.setCurrentLead(lead);
                          window.setShowLeadDetail(true);
                        },
                        className: 'text-indigo-600 hover:text-indigo-900 text-xs'
                      }, '👤 View Lead')
                    )
                  )
                )
              );
            }) : 
            React.createElement('tr', null,
              React.createElement('td', { 
                colSpan: 6, 
                className: 'px-6 py-8 text-center text-gray-500 dark:text-gray-400' 
              }, 
                React.createElement('div', { className: 'space-y-2' },
                  React.createElement('div', { className: 'text-4xl' }, '📝'),
                  React.createElement('div', null, 'No reminders found'),
                  React.createElement('div', { className: 'text-sm' }, 'Create a reminder or refresh to see updates')
                )
              )
            )
          )
        )
      )
    )
  );
};

// ===== ENHANCED: Quick Actions Component =====
window.ReminderQuickActions = () => {
  const overdueReminders = (window.reminders || []).filter(r => 
    new Date(r.due_date) < new Date() && r.status === 'pending'
  );

  const dueTodayReminders = (window.reminders || []).filter(r => {
    const today = new Date();
    const reminderDate = new Date(r.due_date);
    return reminderDate.toDateString() === today.toDateString() && r.status === 'pending';
  });

  if (overdueReminders.length === 0 && dueTodayReminders.length === 0) {
    return null;
  }

  return React.createElement('div', { className: 'bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6' },
    React.createElement('h3', { className: 'text-lg font-semibold text-yellow-800 mb-3 flex items-center gap-2' },
      React.createElement('span', null, '⚠️'),
      'Quick Actions'
    ),
    React.createElement('div', { className: 'space-y-2' },
      overdueReminders.length > 0 && React.createElement('div', { className: 'text-sm' },
        React.createElement('span', { className: 'font-medium text-red-600' }, 
          `${overdueReminders.length} overdue reminder${overdueReminders.length > 1 ? 's' : ''}`
        ),
        React.createElement('button', {
          onClick: () => {
            overdueReminders.forEach(r => window.completeReminder && window.completeReminder(r.id));
          },
          className: 'ml-3 text-red-600 underline text-xs'
        }, 'Mark all complete')
      ),
      dueTodayReminders.length > 0 && React.createElement('div', { className: 'text-sm' },
        React.createElement('span', { className: 'font-medium text-orange-600' }, 
          `${dueTodayReminders.length} reminder${dueTodayReminders.length > 1 ? 's' : ''} due today`
        )
      )
    )
  );
};

console.log('✅ ENHANCED: Reminders component with filters and search loaded successfully');
