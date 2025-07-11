// Lead Status Management System Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Handles lead status updates, progression logic, and choice handling

window.updateLeadStatus = async function(leadId, newStatus) {
  if (!window.hasPermission('leads', 'progress')) {
    alert('You do not have permission to progress leads');
    return;
  }

  try {
    window.setLoading(true);

    // CRITICAL: Get the full lead object first
    const currentLead = window.leads.find(l => l.id === leadId);
    if (!currentLead) {
      alert('Lead not found');
      window.setLoading(false);
      return;
    }

    const oldStatus = currentLead.status; // Store old status for reminder logic

    // Include ALL fields from current lead
    const updateData = {
      ...currentLead,  // This includes EVERYTHING
      status: newStatus,
      last_contact_date: new Date().toISOString(),
      [newStatus + '_date']: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };

    console.log('Updating lead with full data:', updateData);

    // API call to update lead status
    const response = await window.apiCall('/leads/' + leadId, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });

    // Update local state with response from server
    console.log("Status update response:", response);
    window.setLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === leadId ? response.data : lead
      )
    );

    // Update current lead if in detail view
    if (window.showLeadDetail && currentLead?.id === leadId) {
      window.setCurrentLead(response.data);
    }

// Complex lead progression function with advanced logic
window.handleLeadProgression = function(lead) {
  if (!window.hasPermission('leads', 'progress')) {
    alert('You do not have permission to progress leads');
    return;
  }

  const currentStatus = lead.status;
  const nextOptions = window.LEAD_STATUSES[currentStatus]?.next || [];

  if (nextOptions.length === 0) {
    alert('This lead is already at the final stage.');
    return;
  }

  // Check if any of the next options require follow-up date (like pickup_later)
  const hasFollowUpOptions = nextOptions.some(status => 
    window.LEAD_STATUSES[status]?.requires_followup_date
  );

  if (nextOptions.length === 1) {
    const nextStatus = nextOptions[0];

    // Handle pickup_later status (requires follow-up date)
    if (nextStatus === 'pickup_later') {
      window.setCurrentLead(lead);
      window.setShowStatusProgressModal(true);
      window.setStatusProgressOptions([{
        value: 'pickup_later',
        label: window.LEAD_STATUSES['pickup_later'].label,
        color: window.LEAD_STATUSES['pickup_later'].color,
        requires_followup_date: true
      }]);
      return;
    }

    // Handle payment status (existing logic)
    if (nextStatus === 'payment') {
      if (currentStatus === 'payment_post_service') {
        // Coming from payment_post_service, collect payment
        const receivable = window.receivables.find(r => r.lead_id === lead.id && r.status === 'pending');
        if (receivable) {
          window.collectPostServicePayment(receivable);
        } else {
          window.openPaymentForm(lead);
        }
      } else {
        window.openPaymentForm(lead);
      }
      return;
    }

    // For other single status transitions (including attempts)
    window.updateLeadStatus(lead.id, nextStatus);
  } else {
    // Multiple options available - need to show choice modal

    // Handle special case for converted status with payment options (existing logic)
    if (currentStatus === 'converted' && 
        nextOptions.includes('payment') && 
        nextOptions.includes('payment_post_service')) {

      // Check if pickup_later is also an option
      if (nextOptions.includes('pickup_later')) {
        // Show enhanced choice modal with pickup_later option
        window.setCurrentLeadForChoice(lead);
        window.setChoiceOptions([
          { value: 'payment', label: 'Collect Payment Now', icon: '💳' },
          { value: 'payment_post_service', label: 'Payment Post Service', icon: '📅' },
          { value: 'pickup_later', label: 'Pick Up Later', icon: '⏰', requires_followup_date: true }
        ]);
        window.setShowChoiceModal(true);
      } else {
        // Original logic for payment choices
        window.setCurrentLeadForChoice(lead);
        window.setChoiceOptions([
          { value: 'payment', label: 'Collect Payment Now', icon: '💳' },
          { value: 'payment_post_service', label: 'Payment Post Service', icon: '📅' }
        ]);
        window.setShowChoiceModal(true);
      }
    } 
    // If any option requires follow-up date, use the enhanced modal
    else if (hasFollowUpOptions) {
      window.setCurrentLead(lead);
      window.setShowStatusProgressModal(true);
      window.setStatusProgressOptions(nextOptions.map(status => ({
        value: status,
        label: window.LEAD_STATUSES[status].label,
        color: window.LEAD_STATUSES[status].color,
        requires_followup_date: window.LEAD_STATUSES[status].requires_followup_date,
        icon: window.getStatusIcon(status) // Helper function for icons
      })));
    } 
    // Otherwise use the existing choice modal (this handles attempts and all other flows)
    else {
      window.setCurrentLeadForChoice(lead);
      window.setChoiceOptions(nextOptions.map(status => ({
        value: status,
        label: window.LEAD_STATUSES[status].label,
        icon: window.getStatusIcon(status)
      })));
      window.setShowChoiceModal(true);
    }
  }
};

// Quote request stage handler with temperature preservation
window.handleQuoteRequestStage = async function(lead, newStatus) {
  try {
    window.setLoading(true);

    // Preserve temperature when moving to quote_requested
    const currentTemperature = window.getLeadTemperature(lead);

    const updateData = {
      ...lead,
      status: newStatus,
      temperature: currentTemperature, // Preserve the temperature
      quote_requested_date: new Date().toISOString(),
      last_contact_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      // Dual assignment: keep original assignee and add sales service manager
      quote_assigned_to: window.user.role === 'supply_manager' ? window.user.email : 'supply.service@fantopark.com', // Auto-assign based on role
      dual_assignment: true
    };

    const response = await window.apiCall(`/leads/${lead.id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });

    // Update local state
    window.setLeads(prevLeads => 
      prevLeads.map(l => 
        l.id === lead.id ? response.data : l
      )
    );

    // Update current lead if in detail view
    if (window.showLeadDetail && window.currentLead?.id === lead.id) {
      window.setCurrentLead(response.data);
    }

    window.setLoading(false);
    alert('Lead moved to Quote Requested stage and assigned to Sales Service Manager!');
  } catch (error) {
    console.error('Error updating lead to quote requested:', error);
    window.setLoading(false);
    alert('Failed to update lead status: ' + error.message);
  }
};

// Enhanced Choice Modal Handler to support pickup_later and other advanced options
window.handleChoiceSelection = async function(choice) {
  try {
    window.setLoading(true);

    // If choice requires follow-up date, switch to the enhanced modal
    if (choice.requires_followup_date) {
      window.setShowChoiceModal(false);
      window.setCurrentLead(window.currentLeadForChoice);
      window.setShowStatusProgressModal(true);
      window.setStatusProgressOptions([{
        value: choice.value,
        label: choice.label,
        color: window.LEAD_STATUSES[choice.value]?.color || 'bg-gray-100 text-gray-800',
        requires_followup_date: true
      }]);
      window.setLoading(false);
      return;
    }

    // Handle payment choices (existing logic)
    if (choice.value === 'payment') {
      window.setShowChoiceModal(false);
      window.openPaymentForm(window.currentLeadForChoice);
      window.setLoading(false);
      return;
    }

    if (choice.value === 'payment_post_service') {
      window.setShowChoiceModal(false);
      window.openPaymentPostServiceForm(window.currentLeadForChoice);
      window.setLoading(false);
      return;
    }

    // For regular status updates
    await window.updateLeadStatus(window.currentLeadForChoice.id, choice.value);
    window.setShowChoiceModal(false);
    window.setLoading(false);
  } catch (error) {
    console.error('Error handling choice selection:', error);
    window.setLoading(false);
    alert('Failed to update lead status: ' + error.message);
  }
};

// Status progression validation
window.validateStatusProgression = function(currentStatus, newStatus) {
  const statusConfig = window.LEAD_STATUSES[currentStatus];
  if (!statusConfig) {
    return { valid: false, reason: 'Current status not found' };
  }

  const allowedNext = statusConfig.next || [];
  if (!allowedNext.includes(newStatus)) {
    return { 
      valid: false, 
      reason: `Cannot progress from ${currentStatus} to ${newStatus}. Allowed: ${allowedNext.join(', ')}` 
    };
  }

  return { valid: true };
};

// Bulk status update function
window.handleBulkStatusUpdate = async function(leadIds, newStatus) {
  if (!window.hasPermission('leads', 'progress')) {
    alert('You do not have permission to progress leads');
    return;
  }

  if (!confirm(`Update ${leadIds.length} leads to status "${newStatus}"?`)) {
    return;
  }

  window.setLoading(true);
  let successCount = 0;
  let errorCount = 0;

  try {
    for (const leadId of leadIds) {
      try {
        const lead = window.leads.find(l => l.id === leadId);
        if (!lead) {
          errorCount++;
          continue;
        }

        // Validate progression
        const validation = window.validateStatusProgression(lead.status, newStatus);
        if (!validation.valid) {
          console.log(`Skipping lead ${leadId}: ${validation.reason}`);
          errorCount++;
          continue;
        }

        await window.updateLeadStatus(leadId, newStatus);
        successCount++;
      } catch (error) {
        console.error(`Error updating lead ${leadId}:`, error);
        errorCount++;
      }
    }

    alert(`Bulk update completed!\n✅ ${successCount} leads updated\n❌ ${errorCount} failed`);
  } catch (error) {
    console.error('Bulk status update error:', error);
    alert('Error during bulk update: ' + error.message);
  } finally {
    window.setLoading(false);
  }
};

// Status history tracking
window.addStatusHistoryEntry = async function(leadId, oldStatus, newStatus, reason = '') {
  try {
    const historyEntry = {
      lead_id: leadId,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: window.user.email,
      changed_date: new Date().toISOString(),
      reason: reason,
      user_name: window.user.name
    };

    const response = await window.apiCall('/leads/status-history', {
      method: 'POST',
      body: JSON.stringify(historyEntry)
    });

    console.log('Status history recorded:', response);
    return response;
  } catch (error) {
    console.error('Failed to record status history:', error);
    // Non-critical - don't block the status update
  }
};

// Get available status options for a lead
window.getAvailableStatusOptions = function(currentStatus) {
  const statusConfig = window.LEAD_STATUSES[currentStatus];
  if (!statusConfig) return [];

  return (statusConfig.next || []).map(status => ({
    value: status,
    label: window.LEAD_STATUSES[status]?.label || status,
    color: window.LEAD_STATUSES[status]?.color || 'bg-gray-100 text-gray-800',
    description: window.LEAD_STATUSES[status]?.description || '',
    requires_followup_date: window.LEAD_STATUSES[status]?.requires_followup_date || false
  }));
};

// Status change reason tracking
window.promptForStatusChangeReason = function(oldStatus, newStatus) {
  const criticalTransitions = ['qualified_to_junk', 'converted_to_junk', 'hot_to_cold'];
  const transitionKey = `${oldStatus}_to_${newStatus}`;
  
  if (criticalTransitions.includes(transitionKey)) {
    const reason = prompt(`Please provide a reason for changing status from ${oldStatus} to ${newStatus}:`);
    return reason || 'No reason provided';
  }
  
  return '';
};

// Enhanced status progression with automatic notifications
window.handleStatusProgressionWithNotifications = async function(lead, newStatus) {
  const oldStatus = lead.status;
  const reason = window.promptForStatusChangeReason(oldStatus, newStatus);

  try {
    // Update status
    await window.updateLeadStatus(lead.id, newStatus);

    // Record status history
    await window.addStatusHistoryEntry(lead.id, oldStatus, newStatus, reason);

    // Send notifications if required
    if (window.shouldNotifyOnStatusChange(oldStatus, newStatus)) {
      await window.sendStatusChangeNotification(lead, oldStatus, newStatus);
    }

    // Auto-create reminders if needed
    if (window.shouldCreateReminderOnStatusChange(newStatus)) {
      await window.createStatusChangeReminder(lead, newStatus);
    }

  } catch (error) {
    console.error('Error in enhanced status progression:', error);
    throw error;
  }
};

// Check if notification should be sent
window.shouldNotifyOnStatusChange = function(oldStatus, newStatus) {
  const notificationTriggers = ['converted', 'payment', 'junk', 'qualified'];
  return notificationTriggers.includes(newStatus);
};

// Check if reminder should be created
window.shouldCreateReminderOnStatusChange = function(newStatus) {
  const reminderStatuses = ['follow_up', 'pickup_later', 'quote_requested'];
  return reminderStatuses.includes(newStatus);
};

// Send status change notification
window.sendStatusChangeNotification = async function(lead, oldStatus, newStatus) {
  try {
    const notificationData = {
      lead_id: lead.id,
      lead_name: lead.name,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: window.user.name,
      changed_date: new Date().toISOString(),
      recipient: lead.assigned_to || window.user.email
    };

    const response = await window.apiCall('/notifications/status-change', {
      method: 'POST',
      body: JSON.stringify(notificationData)
    });

    console.log('Status change notification sent:', response);
  } catch (error) {
    console.error('Failed to send status change notification:', error);
  }
};

// Create reminder for status change
window.createStatusChangeReminder = async function(lead, newStatus) {
  try {
    const reminderData = {
      lead_id: lead.id,
      title: `Follow up on ${lead.name} - ${newStatus}`,
      description: `Lead status changed to ${newStatus}. Follow up required.`,
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      priority: 'medium',
      assigned_to: lead.assigned_to || window.user.email,
      created_by: window.user.name,
      auto_generated: true
    };

    const response = await window.apiCall('/reminders', {
      method: 'POST',
      body: JSON.stringify(reminderData)
    });

    console.log('Status change reminder created:', response);
  } catch (error) {
    console.error('Failed to create status change reminder:', error);
  }
};

console.log('✅ Lead Status Management System component loaded successfully');
