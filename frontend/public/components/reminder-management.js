// Reminder Management Functions Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Handles reminder fetching, completion, snoozing, and deletion

// Comprehensive reminder fetching function with role-based filtering
window.fetchReminders = async function() {
  if (!window.isLoggedIn) return;

  try {
    const response = await window.apicall('/reminders');
    if (response.data) {
      const userReminders = response.data.filter(r => 
        r.assigned_to === window.user.email || 
        ['sales_manager', 'admin', 'super_admin'].includes(window.user.role)
      );

      window.setReminders(userReminders);

      // Calculate stats
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const stats = {
        total: userReminders.length,
        overdue: userReminders.filter(r => new Date(r.due_date) < now && r.status === 'pending').length,
        due_today: userReminders.filter(r => {
          const dueDate = new Date(r.due_date);
          return dueDate >= today && dueDate < new Date(today.getTime() + 24*60*60*1000) && r.status === 'pending';
        }).length,
        pending: userReminders.filter(r => r.status === 'pending').length
      };

      window.setReminderStats(stats);
    }
  } catch (error) {
    console.error('Error fetching reminders:', error);
  }
};

// Complete a reminder with optional notes
window.completeReminder = async function(reminderId, notes = '') {
  try {
    await window.apicall(`/reminders/${reminderId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    });

    window.setReminders(prev => prev.map(r => 
      r.id === reminderId 
        ? { ...r, status: 'completed', completed_date: new Date().toISOString() }
        : r
    ));

    alert('✅ Reminder completed successfully!');
    await window.fetchReminders();
  } catch (error) {
    console.error('Error completing reminder:', error);
    alert('❌ Failed to complete reminder');
  }
};

// Snooze a reminder for specified hours
window.snoozeReminder = async function(reminderId, hours = 24) {
  try {
    const snoozeUntil = new Date();
    snoozeUntil.setHours(snoozeUntil.getHours() + hours);

    await window.apicall(`/reminders/${reminderId}/snooze`, {
      method: 'POST',
      body: JSON.stringify({ snooze_until: snoozeUntil.toISOString() })
    });

    alert(`⏰ Reminder snoozed for ${hours} hours`);
    await window.fetchReminders();
  } catch (error) {
    console.error('Error snoozing reminder:', error);
    alert('❌ Failed to snooze reminder');
  }
};

// Delete a reminder with confirmation
window.deleteReminder = async function(reminderId) {
  // Confirm before deleting
  if (!confirm('Are you sure you want to delete this reminder? This action cannot be undone.')) {
    return;
  }

  try {
    await window.apicall(`/reminders/${reminderId}`, {
      method: 'DELETE'
    });

    // Update local state to remove the deleted reminder
    window.setReminders(prevReminders => 
      prevReminders.filter(r => r.id !== reminderId)
    );

    // Update reminder stats
    await window.fetchReminders();

    alert('🗑️ Reminder deleted successfully!');
  } catch (error) {
    console.error('Error deleting reminder:', error);
    alert('❌ Failed to delete reminder: ' + error.message);
  }
};

// Additional reminder management utilities
window.createReminder = async function(reminderData) {
  try {
    const response = await window.apicall('/reminders', {
      method: 'POST',
      body: JSON.stringify({
        ...reminderData,
        created_by: window.user.email,
        created_date: new Date().toISOString(),
        status: 'pending'
      })
    });

    if (response.data) {
      window.setReminders(prev => [...prev, response.data]);
      await window.fetchReminders(); // Refresh stats
      alert('✅ Reminder created successfully!');
      return response.data;
    }
  } catch (error) {
    console.error('Error creating reminder:', error);
    alert('❌ Failed to create reminder: ' + error.message);
    throw error;
  }
};

// Update reminder details
window.updateReminder = async function(reminderId, updateData) {
  try {
    const response = await window.apicall(`/reminders/${reminderId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...updateData,
        updated_date: new Date().toISOString(),
        updated_by: window.user.email
      })
    });

    if (response.data) {
      window.setReminders(prev => prev.map(r => 
        r.id === reminderId ? response.data : r
      ));
      await window.fetchReminders(); // Refresh stats
      alert('✅ Reminder updated successfully!');
      return response.data;
    }
  } catch (error) {
    console.error('Error updating reminder:', error);
    alert('❌ Failed to update reminder: ' + error.message);
    throw error;
  }
};

// Get overdue reminders count
window.getOverdueRemindersCount = function(reminders) {
  const now = new Date();
  return reminders.filter(r => 
    new Date(r.due_date) < now && r.status === 'pending'
  ).length;
};

// Get reminders due today
window.getRemindersDueToday = function(reminders) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24*60*60*1000);
  
  return reminders.filter(r => {
    if (r.status !== 'pending') return false;
    const dueDate = new Date(r.due_date);
    return dueDate >= today && dueDate < tomorrow;
  });
};

// Filter reminders by priority
window.filterRemindersByPriority = function(reminders, priority) {
  if (priority === 'all') return reminders;
  return reminders.filter(r => r.priority === priority);
};

// Filter reminders by status
window.filterRemindersByStatus = function(reminders, status) {
  if (status === 'all') return reminders;
  return reminders.filter(r => r.status === status);
};

// Sort reminders by due date
window.sortRemindersByDueDate = function(reminders, ascending = true) {
  return [...reminders].sort((a, b) => {
    const dateA = new Date(a.due_date);
    const dateB = new Date(b.due_date);
    return ascending ? dateA - dateB : dateB - dateA;
  });
};

// Get reminder urgency level
window.getReminderUrgency = function(reminder) {
  if (reminder.status !== 'pending') return 'completed';
  
  const now = new Date();
  const dueDate = new Date(reminder.due_date);
  const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);
  
  if (hoursUntilDue < 0) return 'overdue';
  if (hoursUntilDue < 2) return 'urgent';
  if (hoursUntilDue < 24) return 'soon';
  return 'normal';
};

// Get reminder color based on urgency
window.getReminderColor = function(reminder) {
  const urgency = window.getReminderUrgency(reminder);
  
  const colors = {
    overdue: 'bg-red-100 text-red-800 border-red-200',
    urgent: 'bg-orange-100 text-orange-800 border-orange-200',
    soon: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    normal: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200'
  };
  
  return colors[urgency] || colors.normal;
};

// Bulk operations for reminders
window.bulkCompleteReminders = async function(reminderIds) {
  if (!reminderIds.length) return;
  
  if (!confirm(`Complete ${reminderIds.length} reminders?`)) return;
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const reminderId of reminderIds) {
    try {
      await window.completeReminder(reminderId);
      successCount++;
    } catch (error) {
      errorCount++;
    }
  }
  
  alert(`Bulk complete finished!\n✅ ${successCount} completed\n❌ ${errorCount} failed`);
};

window.bulkDeleteReminders = async function(reminderIds) {
  if (!reminderIds.length) return;
  
  if (!confirm(`Delete ${reminderIds.length} reminders? This cannot be undone.`)) return;
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const reminderId of reminderIds) {
    try {
      await window.deleteReminder(reminderId);
      successCount++;
    } catch (error) {
      errorCount++;
    }
  }
  
  alert(`Bulk delete finished!\n✅ ${successCount} deleted\n❌ ${errorCount} failed`);
};

// Auto-create reminders for lead actions
window.createLeadReminder = async function(leadId, reminderType, daysFromNow = 1) {
  const lead = window.leads?.find(l => l.id === leadId);
  if (!lead) return;
  
  const reminderTypes = {
    follow_up: {
      title: `Follow up with ${lead.name}`,
      description: `Follow up on lead for ${lead.lead_for_event || 'event'}`,
      priority: 'medium'
    },
    quote_follow_up: {
      title: `Quote follow up - ${lead.name}`,
      description: `Follow up on quote request for ${lead.lead_for_event || 'event'}`,
      priority: 'high'
    },
    payment_follow_up: {
      title: `Payment follow up - ${lead.name}`,
      description: `Follow up on pending payment`,
      priority: 'urgent'
    }
  };
  
  const reminderConfig = reminderTypes[reminderType];
  if (!reminderConfig) return;
  
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + daysFromNow);
  
  const reminderData = {
    lead_id: leadId,
    title: reminderConfig.title,
    description: reminderConfig.description,
    due_date: dueDate.toISOString(),
    priority: reminderConfig.priority,
    assigned_to: lead.assigned_to || window.user.email,
    auto_generated: true
  };
  
  return await window.createReminder(reminderData);
};

// Initialize reminder system
window.initializeReminderSystem = function() {
  console.log('Initializing reminder system...');
  
  // Fetch reminders on initialization
  if (window.isLoggedIn) {
    window.fetchReminders();
    
    // Set up auto-refresh every 5 minutes
    setInterval(() => {
      if (window.isLoggedIn) {
        window.fetchReminders();
      }
    }, 5 * 60 * 1000);
  }
};

console.log('✅ Reminder Management Functions component loaded successfully');
