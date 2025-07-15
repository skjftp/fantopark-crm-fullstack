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

    // ===== ENHANCED: Reminders table with smart text truncation =====
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow' },
      React.createElement('div', { className: 'px-6 py-4 border-b border-gray-200 dark:border-gray-700' },
        React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 dark:text-white' }, 'All Reminders')
      ),
      React.createElement('div', { className: 'overflow-x-auto' },
        React.createElement('table', { className: 'w-full' },
          React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-700' },
            React.createElement('tr', null,
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Title'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Due Date'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Status'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Priority'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Assigned To'),
              React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Actions')
            )
          ),
          React.createElement('tbody', { className: 'bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700' },
            (window.reminders || []).length > 0 ?
            (window.reminders || []).map(reminder => {
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

// Enhanced Reminders Component with Filters
window.renderReminders = () => {
  const {
    reminders = [],
    reminderFilters = {
      searchQuery: '',
      status: 'all',
      dateRange: 'all',
      startDate: '',
      endDate: '',
      type: 'all',
      priority: 'all',
      assignedTo: 'all'
    },
    setReminderFilters = () => {}
  } = window.appState || {};

  // Get today's date for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter function
  const getFilteredReminders = () => {
    return reminders.filter(reminder => {
      // Search query filter
      if (reminderFilters.searchQuery) {
        const query = reminderFilters.searchQuery.toLowerCase();
        const matchesSearch = 
          (reminder.title && reminder.title.toLowerCase().includes(query)) ||
          (reminder.description && reminder.description.toLowerCase().includes(query)) ||
          (reminder.client_name && reminder.client_name.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Status filter
      if (reminderFilters.status !== 'all') {
        const reminderDate = new Date(reminder.reminder_date);
        const isOverdue = reminderDate < today && reminder.status !== 'completed';
        
        switch (reminderFilters.status) {
          case 'pending':
            if (reminder.status === 'completed' || isOverdue) return false;
            break;
          case 'completed':
            if (reminder.status !== 'completed') return false;
            break;
          case 'overdue':
            if (!isOverdue || reminder.status === 'completed') return false;
            break;
        }
      }

      // Date range filter
      if (reminderFilters.dateRange !== 'all') {
        const reminderDate = new Date(reminder.reminder_date);
        reminderDate.setHours(0, 0, 0, 0);
        
        switch (reminderFilters.dateRange) {
          case 'today':
            if (reminderDate.toDateString() !== today.toDateString()) return false;
            break;
          case 'thisWeek':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            if (reminderDate < weekStart || reminderDate > weekEnd) return false;
            break;
          case 'thisMonth':
            if (reminderDate.getMonth() !== today.getMonth() || 
                reminderDate.getFullYear() !== today.getFullYear()) return false;
            break;
          case 'custom':
            if (reminderFilters.startDate) {
              const startDate = new Date(reminderFilters.startDate);
              if (reminderDate < startDate) return false;
            }
            if (reminderFilters.endDate) {
              const endDate = new Date(reminderFilters.endDate);
              if (reminderDate > endDate) return false;
            }
            break;
        }
      }

      // Type filter
      if (reminderFilters.type !== 'all' && reminder.type !== reminderFilters.type) {
        return false;
      }

      // Priority filter
      if (reminderFilters.priority !== 'all' && reminder.priority !== reminderFilters.priority) {
        return false;
      }

      // Assigned to filter
      if (reminderFilters.assignedTo !== 'all') {
        if (reminderFilters.assignedTo === 'me') {
          if (reminder.assigned_to !== window.user?.email) return false;
        } else {
          if (reminder.assigned_to !== reminderFilters.assignedTo) return false;
        }
      }

      return true;
    });
  };

  const filteredReminders = getFilteredReminders();

  // Group reminders by date
  const groupRemindersByDate = (reminders) => {
    const groups = {
      overdue: [],
      today: [],
      thisWeek: [],
      upcoming: []
    };

    reminders.forEach(reminder => {
      const reminderDate = new Date(reminder.reminder_date);
      reminderDate.setHours(0, 0, 0, 0);
      
      if (reminderDate < today && reminder.status !== 'completed') {
        groups.overdue.push(reminder);
      } else if (reminderDate.toDateString() === today.toDateString()) {
        groups.today.push(reminder);
      } else if (reminderDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
        groups.thisWeek.push(reminder);
      } else {
        groups.upcoming.push(reminder);
      }
    });

    return groups;
  };

  const groupedReminders = groupRemindersByDate(filteredReminders);

  return React.createElement('div', { className: 'p-6 space-y-6' },
    // Header
    React.createElement('div', { className: 'flex justify-between items-center mb-6' },
      React.createElement('h2', { className: 'text-2xl font-bold text-gray-900 dark:text-white' }, 
        'Reminders'
      ),
      React.createElement('button', {
        onClick: () => window.openAddReminderModal && window.openAddReminderModal(),
        className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2'
      }, 
        React.createElement('span', null, '+'),
        'Add Reminder'
      )
    ),

    // Filters Section
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-6' },
      React.createElement('div', { className: 'flex items-center justify-between mb-4' },
        React.createElement('h3', { className: 'text-lg font-semibold' }, 'Filters'),
        React.createElement('button', {
          onClick: () => setReminderFilters({
            searchQuery: '',
            status: 'all',
            dateRange: 'all',
            startDate: '',
            endDate: '',
            type: 'all',
            priority: 'all',
            assignedTo: 'all'
          }),
          className: 'text-sm text-blue-600 hover:text-blue-800'
        }, 'Clear Filters')
      ),

      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4' },
        // Search
        React.createElement('div', { className: 'lg:col-span-2' },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' }, 
            'Search'
          ),
          React.createElement('input', {
            type: 'text',
            value: reminderFilters.searchQuery,
            onChange: (e) => setReminderFilters({ ...reminderFilters, searchQuery: e.target.value }),
            placeholder: 'Search reminders...',
            className: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none'
          })
        ),

        // Status Filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' }, 
            'Status'
          ),
          React.createElement('select', {
            value: reminderFilters.status,
            onChange: (e) => setReminderFilters({ ...reminderFilters, status: e.target.value }),
            className: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none'
          },
            React.createElement('option', { value: 'all' }, 'All Status'),
            React.createElement('option', { value: 'pending' }, 'Pending'),
            React.createElement('option', { value: 'completed' }, 'Completed'),
            React.createElement('option', { value: 'overdue' }, 'Overdue')
          )
        ),

        // Date Range Filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' }, 
            'Date Range'
          ),
          React.createElement('select', {
            value: reminderFilters.dateRange,
            onChange: (e) => setReminderFilters({ ...reminderFilters, dateRange: e.target.value }),
            className: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none'
          },
            React.createElement('option', { value: 'all' }, 'All Dates'),
            React.createElement('option', { value: 'today' }, 'Today'),
            React.createElement('option', { value: 'thisWeek' }, 'This Week'),
            React.createElement('option', { value: 'thisMonth' }, 'This Month'),
            React.createElement('option', { value: 'custom' }, 'Custom Range')
          )
        ),

        // Custom Date Range (shown only when custom is selected)
        reminderFilters.dateRange === 'custom' && React.createElement(React.Fragment, null,
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' }, 
              'Start Date'
            ),
            React.createElement('input', {
              type: 'date',
              value: reminderFilters.startDate,
              onChange: (e) => setReminderFilters({ ...reminderFilters, startDate: e.target.value }),
              className: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none'
            })
          ),
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' }, 
              'End Date'
            ),
            React.createElement('input', {
              type: 'date',
              value: reminderFilters.endDate,
              onChange: (e) => setReminderFilters({ ...reminderFilters, endDate: e.target.value }),
              className: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none'
            })
          )
        ),

        // Type Filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' }, 
            'Type'
          ),
          React.createElement('select', {
            value: reminderFilters.type,
            onChange: (e) => setReminderFilters({ ...reminderFilters, type: e.target.value }),
            className: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none'
          },
            React.createElement('option', { value: 'all' }, 'All Types'),
            React.createElement('option', { value: 'follow_up' }, 'Follow Up'),
            React.createElement('option', { value: 'meeting' }, 'Meeting'),
            React.createElement('option', { value: 'payment' }, 'Payment'),
            React.createElement('option', { value: 'deadline' }, 'Deadline'),
            React.createElement('option', { value: 'other' }, 'Other')
          )
        ),

        // Priority Filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' }, 
            'Priority'
          ),
          React.createElement('select', {
            value: reminderFilters.priority,
            onChange: (e) => setReminderFilters({ ...reminderFilters, priority: e.target.value }),
            className: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none'
          },
            React.createElement('option', { value: 'all' }, 'All Priorities'),
            React.createElement('option', { value: 'high' }, 'High'),
            React.createElement('option', { value: 'medium' }, 'Medium'),
            React.createElement('option', { value: 'low' }, 'Low')
          )
        )
      )
    ),

    // Results Summary
    React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-400' },
      `Showing ${filteredReminders.length} of ${reminders.length} reminders`
    ),

    // Reminders Groups
    React.createElement('div', { className: 'space-y-6' },
      // Overdue Reminders
      groupedReminders.overdue.length > 0 && React.createElement('div', null,
        React.createElement('h3', { className: 'text-lg font-semibold text-red-600 mb-3' }, 
          `Overdue (${groupedReminders.overdue.length})`
        ),
        React.createElement('div', { className: 'space-y-3' },
          groupedReminders.overdue.map(reminder => renderReminderCard(reminder))
        )
      ),

      // Today's Reminders
      groupedReminders.today.length > 0 && React.createElement('div', null,
        React.createElement('h3', { className: 'text-lg font-semibold text-blue-600 mb-3' }, 
          `Today (${groupedReminders.today.length})`
        ),
        React.createElement('div', { className: 'space-y-3' },
          groupedReminders.today.map(reminder => renderReminderCard(reminder))
        )
      ),

      // This Week
      groupedReminders.thisWeek.length > 0 && React.createElement('div', null,
        React.createElement('h3', { className: 'text-lg font-semibold text-gray-700 mb-3' }, 
          `This Week (${groupedReminders.thisWeek.length})`
        ),
        React.createElement('div', { className: 'space-y-3' },
          groupedReminders.thisWeek.map(reminder => renderReminderCard(reminder))
        )
      ),

      // Upcoming
      groupedReminders.upcoming.length > 0 && React.createElement('div', null,
        React.createElement('h3', { className: 'text-lg font-semibold text-gray-700 mb-3' }, 
          `Upcoming (${groupedReminders.upcoming.length})`
        ),
        React.createElement('div', { className: 'space-y-3' },
          groupedReminders.upcoming.map(reminder => renderReminderCard(reminder))
        )
      ),

      // No reminders message
      filteredReminders.length === 0 && React.createElement('div', { 
        className: 'text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg' 
      },
        React.createElement('p', { className: 'text-gray-500' }, 
          reminderFilters.searchQuery || reminderFilters.status !== 'all' || reminderFilters.dateRange !== 'all' 
            ? 'No reminders match your filters' 
            : 'No reminders yet'
        )
      )
    )
  );
};

// Reminder Card Component
function renderReminderCard(reminder) {
  const reminderDate = new Date(reminder.reminder_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = reminderDate < today && reminder.status !== 'completed';
  
  const priorityColors = {
    high: 'border-red-500 bg-red-50',
    medium: 'border-yellow-500 bg-yellow-50',
    low: 'border-green-500 bg-green-50'
  };

  const typeIcons = {
    follow_up: '📞',
    meeting: '👥',
    payment: '💰',
    deadline: '⏰',
    other: '📌'
  };

  return React.createElement('div', {
    key: reminder.id,
    className: `p-4 bg-white dark:bg-gray-800 rounded-lg shadow border-l-4 ${
      priorityColors[reminder.priority] || 'border-gray-500 bg-gray-50'
    } ${isOverdue ? 'opacity-90' : ''}`
  },
    React.createElement('div', { className: 'flex justify-between items-start' },
      React.createElement('div', { className: 'flex-1' },
        React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
          React.createElement('span', { className: 'text-lg' }, 
            typeIcons[reminder.type] || '📌'
          ),
          React.createElement('h4', { 
            className: `font-semibold ${reminder.status === 'completed' ? 'line-through text-gray-500' : ''}` 
          }, reminder.title || 'Reminder'),
          reminder.priority === 'high' && React.createElement('span', { 
            className: 'text-xs bg-red-100 text-red-600 px-2 py-1 rounded' 
          }, 'High Priority')
        ),
        
        reminder.description && React.createElement('p', { 
          className: 'text-sm text-gray-600 dark:text-gray-400 mb-2' 
        }, reminder.description),
        
        React.createElement('div', { className: 'flex items-center gap-4 text-sm text-gray-500' },
          React.createElement('span', { className: 'flex items-center gap-1' },
            '📅',
            reminderDate.toLocaleDateString()
          ),
          reminder.time && React.createElement('span', { className: 'flex items-center gap-1' },
            '⏰',
            reminder.time
          ),
          reminder.client_name && React.createElement('span', { className: 'flex items-center gap-1' },
            '👤',
            reminder.client_name
          )
        )
      ),
      
      React.createElement('div', { className: 'flex items-center gap-2' },
        reminder.status !== 'completed' && React.createElement('button', {
          onClick: () => window.markReminderComplete && window.markReminderComplete(reminder.id),
          className: 'text-green-600 hover:text-green-800',
          title: 'Mark as complete'
        }, '✓'),
        
        React.createElement('button', {
          onClick: () => window.editReminder && window.editReminder(reminder),
          className: 'text-blue-600 hover:text-blue-800',
          title: 'Edit'
        }, '✏️'),
        
        React.createElement('button', {
          onClick: () => window.deleteReminder && window.deleteReminder(reminder.id),
          className: 'text-red-600 hover:text-red-800',
          title: 'Delete'
        }, '🗑️')
      )
    )
  );
}

// Mark reminder as complete
window.markReminderComplete = async (reminderId) => {
  try {
    await window.apiCall(`/reminders/${reminderId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'completed' })
    });
    
    // Refresh reminders
    if (window.fetchReminders) {
      window.fetchReminders();
    }
  } catch (error) {
    console.error('Error marking reminder complete:', error);
    alert('Failed to update reminder');
  }
};

// Delete reminder
window.deleteReminder = async (reminderId) => {
  if (!confirm('Are you sure you want to delete this reminder?')) return;
  
  try {
    await window.apiCall(`/reminders/${reminderId}`, {
      method: 'DELETE'
    });
    
    // Refresh reminders
    if (window.fetchReminders) {
      window.fetchReminders();
    }
  } catch (error) {
    console.error('Error deleting reminder:', error);
    alert('Failed to delete reminder');
  }
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

console.log('✅ ENHANCED: Reminders component with smart text truncation loaded successfully');
