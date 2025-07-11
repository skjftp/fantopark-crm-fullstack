// Reminders Component for FanToPark CRM
// Reminders data array
window.reminders = window.reminders || [];
// Reminder stats state
window.reminderStats = window.reminderStats || {
    totalReminders: 0,
    overdueReminders: 0,
    upcomingReminders: 0,
    completedReminders: 0
};
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

// Main Reminders Content Function
window.renderRemindersContent = () => {
  return React.createElement('div', { className: 'space-y-6' },
    // Header with actions
    React.createElement('div', { className: 'flex justify-between items-center' },
      React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' }, 'Reminders'),
      React.createElement('div', { className: 'flex gap-3' },
      React.createElement('button', {
      onClick: () => window.setShowReminderForm(true),
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
        React.createElement('div', { className: 'text-3xl font-bold text-blue-600' }, window.reminderStats.totalReminders),
        React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-400' }, 'Total Reminders')
      ),
      React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 shadow' },
        React.createElement('div', { className: 'text-3xl font-bold text-red-600' }, window.reminderStats.overdueReminders),
        React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-400' }, 'Overdue')
      ),
      React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 shadow' },
        React.createElement('div', { className: 'text-3xl font-bold text-orange-600' }, reminderStats.due_today),
        React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-400' }, 'Due Today')
      ),
      React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 shadow' },
        React.createElement('div', { className: 'text-3xl font-bold text-green-600' }, reminderStats.pending),
        React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-400' }, 'Pending')
      )
    ),

    // Reminders table
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
            (window.reminders || []).length > 0 ? (window.reminders || []).map(reminder => {
              const isOverdue = new Date(reminder.due_date) < new Date() && reminder.status === 'pending';
              const lead = leads.find(l => l.id === reminder.lead_id);

              return React.createElement('tr', { 
                key: reminder.id,
                className: isOverdue ? 'bg-red-50 dark:bg-red-900/20' : ''
              },
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                  React.createElement('div', null,
                    React.createElement('div', { className: 'text-sm font-medium text-gray-900 dark:text-white' }, reminder.title),
                    React.createElement('div', { className: 'text-sm text-gray-500' }, reminder.description),
                    reminder.auto_generated && React.createElement('span', { 
                      className: 'inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 mt-1' 
                    }, 'Auto-generated')
                  )
                ),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                  React.createElement('div', { className: 'text-sm text-gray-900 dark:text-white' }, 
                    new Date(reminder.due_date).toLocaleDateString()
                  ),
                  React.createElement('div', { 
                    className: `text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}` 
                  }, 
                    isOverdue ? 'OVERDUE' : formatRelativeTime(reminder.due_date)
                  )
                ),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                  React.createElement('span', { 
                    className: `inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      reminder.status === 'pending' ? (isOverdue ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800') :
                      reminder.status === 'completed' ? 'bg-green-100 text-green-800' :
                      reminder.status === 'snoozed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`
                  }, reminder.status.toUpperCase())
                ),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                  React.createElement('span', { 
                    className: `inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      reminder.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      reminder.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      reminder.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`
                  }, reminder.priority.toUpperCase())
                ),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white' },
                  reminder.assigned_to
                ),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm font-medium' },
                  React.createElement('div', { className: 'flex space-x-2' },
                    reminder.status === 'pending' && React.createElement('button', {
                      onClick: () => completeReminder(reminder.id, 'Completed'),
                      className: 'text-green-600 hover:text-green-900'
                    }, '✓ Complete'),
                    reminder.status === 'pending' && React.createElement('button', {
                      onClick: () => snoozeReminder(reminder.id, 24),
                      className: 'text-blue-600 hover:text-blue-900'
                    }, '⏰ Snooze'),
                    React.createElement('button', {
                      onClick: () => deleteReminder(reminder.id),
                      className: 'text-red-600 hover:text-red-900'
                    }, '🗑️ Delete'),
                    lead && React.createElement('button', {
  onClick: () => {
    window.setCurrentLead(lead);
    window.setShowLeadDetail(true);  // ← Open detail view instead of edit form
    window.setActiveTab('leads');
  },
  className: 'text-indigo-600 hover:text-indigo-900'
}, '👤 View Lead')
                  )
                )
              );
            }) : React.createElement('tr', null,
              React.createElement('td', { 
                colSpan: 6, 
                className: 'px-6 py-4 text-center text-gray-500 dark:text-gray-400' 
              }, 'No reminders found')
            )
          )
        )
      )
    )
  );
};

console.log('✅ Reminders component loaded successfully');
