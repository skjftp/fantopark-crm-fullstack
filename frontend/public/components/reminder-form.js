// ===== REMINDER FORM COMPONENT =====
// File: components/reminder-form.js
// Add this as a new file to your components directory

window.renderReminderForm = () => {
  if (!window.showReminderForm) {
    return null;
  }

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => {
      if (e.target === e.currentTarget) {
        window.setShowReminderForm(false);
      }
    }
  },
    React.createElement('div', {
      className: 'bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto',
      onClick: (e) => e.stopPropagation()
    },
      // Header
      React.createElement('div', { className: 'flex justify-between items-center mb-6' },
        React.createElement('h2', { className: 'text-xl font-bold text-gray-900 dark:text-white' }, 
          '🔔 Create New Reminder'
        ),
        React.createElement('button', {
          onClick: () => window.setShowReminderForm(false),
          className: 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
        }, '✕')
      ),

      // Form
      React.createElement('form', {
        onSubmit: async (e) => {
          e.preventDefault();
          try {
            const formData = new FormData(e.target);
            const reminderData = {
              title: formData.get('title'),
              description: formData.get('description'),
              due_date: formData.get('due_date'),
              priority: formData.get('priority'),
              assigned_to: formData.get('assigned_to'),
              lead_id: formData.get('lead_id') || null
            };

            await window.createReminder(reminderData);
            window.setShowReminderForm(false);
            
            // Reset form
            e.target.reset();
          } catch (error) {
            console.error('Error creating reminder:', error);
          }
        }
      },
        // Title Field
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { 
            className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' 
          }, 'Title *'),
          React.createElement('input', {
            type: 'text',
            name: 'title',
            required: true,
            placeholder: 'Enter reminder title...',
            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500'
          })
        ),

        // Description Field
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { 
            className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' 
          }, 'Description'),
          React.createElement('textarea', {
            name: 'description',
            rows: 3,
            placeholder: 'Enter reminder description...',
            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500'
          })
        ),

        // Due Date Field
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { 
            className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' 
          }, 'Due Date & Time *'),
          React.createElement('input', {
            type: 'datetime-local',
            name: 'due_date',
            required: true,
            min: new Date().toISOString().slice(0, 16),
            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500'
          })
        ),

        // Priority Field
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { 
            className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' 
          }, 'Priority *'),
          React.createElement('select', {
            name: 'priority',
            required: true,
            defaultValue: 'medium',
            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500'
          },
            React.createElement('option', { value: 'low' }, '🟢 Low'),
            React.createElement('option', { value: 'medium' }, '🟡 Medium'),
            React.createElement('option', { value: 'high' }, '🟠 High'),
            React.createElement('option', { value: 'urgent' }, '🔴 Urgent')
          )
        ),

        // Assigned To Field
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { 
            className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' 
          }, 'Assigned To'),
          React.createElement('input', {
            type: 'email',
            name: 'assigned_to',
            defaultValue: window.user?.email || '',
            placeholder: 'Enter email address...',
            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500'
          })
        ),

        // Link to Lead (Optional)
        React.createElement('div', { className: 'mb-6' },
          React.createElement('label', { 
            className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' 
          }, 'Link to Lead (Optional)'),
          React.createElement('select', {
            name: 'lead_id',
            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500'
          },
            React.createElement('option', { value: '' }, 'No lead selected'),
            // Populate with leads if available
            ...(window.leads || []).map(lead => 
              React.createElement('option', { 
                key: lead.id, 
                value: lead.id 
              }, `${lead.name} - ${lead.lead_for_event || 'Event'}`)
            )
          )
        ),

        // Action Buttons
        React.createElement('div', { className: 'flex justify-end space-x-3' },
          React.createElement('button', {
            type: 'button',
            onClick: () => window.setShowReminderForm(false),
            className: 'px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }, 'Cancel'),
          React.createElement('button', {
            type: 'submit',
            className: 'px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
          }, '🔔 Create Reminder')
        )
      )
    )
  );
};

// ===== UPDATED REMINDERS CONTENT WITH CREATE BUTTON =====
// Update your existing reminders.js file with this enhanced version

window.renderRemindersContentWithCreateButton = () => {
  return React.createElement('div', { className: 'space-y-6' },
    // Header with actions (UPDATED TO INCLUDE CREATE BUTTON)
    React.createElement('div', { className: 'flex justify-between items-center' },
      React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' }, 'Reminders'),
      React.createElement('div', { className: 'flex gap-3' },
        // NEW: Create Reminder Button
        React.createElement('button', {
          onClick: () => window.setShowReminderForm(true),
          className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2'
        }, 
          React.createElement('span', null, '➕'),
          'Create Reminder'
        ),
        React.createElement('button', {
          onClick: () => window.fetchReminders(),
          className: 'px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700'
        }, '🔄 Refresh')
      )
    ),

    // Quick stats (keep existing stats display)
    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-4' },
      React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 shadow' },
        React.createElement('div', { className: 'text-3xl font-bold text-blue-600' }, 
          window.reminderStats?.total || 0
        ),
        React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-400' }, 'Total Reminders')
      ),
      React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 shadow' },
        React.createElement('div', { className: 'text-3xl font-bold text-red-600' }, 
          window.reminderStats?.overdue || 0
        ),
        React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-400' }, 'Overdue')
      ),
      React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 shadow' },
        React.createElement('div', { className: 'text-3xl font-bold text-orange-600' }, 
          window.reminderStats?.due_today || 0
        ),
        React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-400' }, 'Due Today')
      ),
      React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 shadow' },
        React.createElement('div', { className: 'text-3xl font-bold text-green-600' }, 
          window.reminderStats?.pending || 0
        ),
        React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-400' }, 'Pending')
      )
    ),

    // Reminders table (keep existing table)
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow' },
      React.createElement('div', { className: 'px-6 py-4 border-b border-gray-200 dark:border-gray-700' },
        React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 dark:text-white' }, 'All Reminders')
      ),
      React.createElement('div', { className: 'overflow-x-auto' },
        React.createElement('table', { className: 'min-w-full divide-y divide-gray-200 dark:divide-gray-700' },
          React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-700' },
            React.createElement('tr', null,
              ['TITLE', 'DUE DATE', 'STATUS', 'PRIORITY', 'ASSIGNED TO', 'ACTIONS'].map(header =>
                React.createElement('th', {
                  key: header,
                  className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'
                }, header)
              )
            )
          ),
          React.createElement('tbody', { className: 'bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700' },
            (window.reminders && window.reminders.length > 0) ?
              window.reminders.map(reminder => {
                const lead = window.leads?.find(l => l.id === reminder.lead_id);
                return React.createElement('tr', { key: reminder.id },
                  React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white' },
                    reminder.title
                  ),
                  React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400' },
                    reminder.due_date ? new Date(reminder.due_date).toLocaleDateString() : 'No date'
                  ),
                  React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                    React.createElement('span', { 
                      className: `px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        reminder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        reminder.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`
                    }, reminder.status?.toUpperCase() || 'PENDING')
                  ),
                  React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                    React.createElement('span', { 
                      className: `px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        reminder.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        reminder.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        reminder.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`
                    }, (reminder.priority || 'low').toUpperCase())
                  ),
                  React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white' },
                    reminder.assigned_to
                  ),
                  React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm font-medium' },
                    React.createElement('div', { className: 'flex space-x-2' },
                      reminder.status === 'pending' && React.createElement('button', {
                        onClick: () => window.completeReminder(reminder.id, 'Completed'),
                        className: 'text-green-600 hover:text-green-900'
                      }, '✓ Complete'),
                      reminder.status === 'pending' && React.createElement('button', {
                        onClick: () => window.snoozeReminder(reminder.id, 24),
                        className: 'text-blue-600 hover:text-blue-900'
                      }, '⏰ Snooze'),
                      React.createElement('button', {
                        onClick: () => window.deleteReminder(reminder.id),
                        className: 'text-red-600 hover:text-red-900'
                      }, '🗑️ Delete'),
                      lead && React.createElement('button', {
                        onClick: () => {
                          window.setCurrentLead(lead);
                          window.setShowEditForm(true);
                          window.setActiveTab('leads');
                        },
                        className: 'text-indigo-600 hover:text-indigo-900'
                      }, '👤 View Lead')
                    )
                  )
                );
              }) : 
              React.createElement('tr', null,
                React.createElement('td', { 
                  colSpan: 6, 
                  className: 'px-6 py-8 text-center text-gray-500 dark:text-gray-400' 
                }, 
                  React.createElement('div', { className: 'text-center' },
                    React.createElement('div', { className: 'text-4xl mb-2' }, '🔔'),
                    React.createElement('div', { className: 'text-lg font-medium' }, 'No reminders found'),
                    React.createElement('div', { className: 'text-sm' }, 'Create your first reminder to get started')
                  )
                )
              )
          )
        )
      )
    )
  );
};

console.log('✅ Manual Reminder Creation Components loaded successfully');
