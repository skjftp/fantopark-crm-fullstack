// Lead Status Management System Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Handles lead status updates, progression logic, and choice handling

// ===== FIXED: Enhanced lead status update function with automatic reminder creation =====


// ====== UPDATED QUOTE REQUEST ASSIGNMENT LOGIC ======
// File: lead-status-management.js

// ADD THIS NEW HELPER FUNCTION at the top of the file:
window.getSupplyTeamMember = async function() {
  try {
    // Get all supply team members
    const supplyTeamMembers = window.users.filter(user => 
      ['supply_manager', 'supply_service_manager', 'supply_sales_service_manager'].includes(user.role) &&
      user.status === 'active'
    );
    
    if (supplyTeamMembers.length === 0) {
      console.warn('⚠️ No active supply team members found, using fallback');
      return 'akshay@fantopark.com'; // fallback
    }
    
    console.log('✅ Found', supplyTeamMembers.length, 'supply team members');
    
    // TODO: Implement more sophisticated assignment logic here
    // Options: round-robin, least busy, by specialization, etc.
    const selectedMember = supplyTeamMembers[0];
    console.log('🎯 Assigning to:', selectedMember.email, '(' + selectedMember.name + ')');
    
    return selectedMember.email;
    
  } catch (error) {
    console.error('❌ Error getting supply team member:', error);
    return 'akshay@fantopark.com'; // fallback
  }
};

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

    // ✅ QUOTE WORKFLOW LOGIC
let updateData = {
  ...currentLead,
  status: newStatus,
  last_contact_date: new Date().toISOString(),
  [newStatus + '_date']: new Date().toISOString(),
  updated_date: new Date().toISOString()
};

// Handle quote_requested -> auto-assign to Akshay and store original assignee
if (newStatus === 'quote_requested') {
  updateData.original_assignee = currentLead.assigned_to; // Store who it was assigned to
  updateData.assigned_to = await window.getSupplyTeamMember(); // Auto-assign to Supply Team member
  updateData.assigned_team = 'supply'; // Mark as supply team assignment
}

// Handle quote_received -> restore original assignee  
if (oldStatus === 'quote_requested' && newStatus === 'quote_received') {
  updateData.assigned_to = currentLead.original_assignee || currentLead.assigned_to;
  // Don't proceed with normal update - open quote upload modal instead
  window.setLoading(false);
  window.openQuoteUploadModal(currentLead);
  return;
}

    if (newStatus === 'quote_requested') {
  console.log('📋 QUOTE REQUEST WORKFLOW:');
  console.log('Original assignee:', currentLead.assigned_to);
  console.log('New assignee (Supply Team):', updateData.assigned_to);
  console.log('Stored original_assignee:', updateData.original_assignee);
}

if (oldStatus === 'quote_requested' && newStatus === 'quote_received') {
  console.log('📄 QUOTE RECEIVED WORKFLOW:');
  console.log('Opening quote upload modal for lead:', currentLead.name);
  console.log('Will restore to original assignee:', currentLead.original_assignee);
}
    
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

    // ===== FIX 2: ADD MISSING REMINDER CREATION LOGIC =====
    console.log(`🔔 Checking if reminder needed for status change: ${oldStatus} → ${newStatus}`);
    
    // Auto-create reminders if needed
    if (window.shouldCreateReminderOnStatusChange(newStatus)) {
      console.log(`✅ Creating automatic reminder for status: ${newStatus}`);
      try {
        await window.createStatusChangeReminder(response.data, newStatus);
        console.log('🎯 Automatic reminder created successfully');
      } catch (reminderError) {
        console.error('❌ Failed to create automatic reminder:', reminderError);
        // Don't fail the whole operation if reminder creation fails
      }
    }

    // Send notifications if required
    if (window.shouldNotifyOnStatusChange(oldStatus, newStatus)) {
      try {
        await window.sendStatusChangeNotification(response.data, oldStatus, newStatus);
        console.log('📧 Status change notification sent');
      } catch (notificationError) {
        console.error('❌ Failed to send notification:', notificationError);
        // Don't fail the whole operation if notification fails
      }
    }

    window.setLoading(false);
    alert('Lead status updated successfully!');
  } catch (error) {
    console.error('Error updating lead status:', error);
if (window.activeTab === 'myactions' && window.fetchMyActions) {
  window.fetchMyActions();
}
    
    window.setLoading(false);
    alert('Failed to update lead status: ' + error.message);
  }
};

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
        icon: window.getStatusIcon ? window.getStatusIcon(status) : '📋' // Helper function for icons
      })));
    } 
    // Otherwise use the existing choice modal (this handles attempts and all other flows)
    else {
      window.setCurrentLeadForChoice(lead);
      window.setChoiceOptions(nextOptions.map(status => ({
        value: status,
        label: window.LEAD_STATUSES[status].label,
        icon: window.getStatusIcon ? window.getStatusIcon(status) : '📋'
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
    const currentTemperature = window.getLeadTemperature ? window.getLeadTemperature(lead) : lead.temperature;

const supplyTeamMember = await window.getSupplyTeamMember();
const updateData = {
  ...lead,
  status: newStatus,
  temperature: currentTemperature, // Preserve the temperature
  quote_requested_date: new Date().toISOString(),
  last_contact_date: new Date().toISOString(),
  updated_date: new Date().toISOString(),
  // Supply team assignment logic
  quote_assigned_to: supplyTeamMember,
  assigned_to: supplyTeamMember,
  original_assignee: lead.assigned_to,
  assigned_team: 'supply',
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
    alert('Lead moved to Quote Requested stage and assigned to Supply Team!');
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

// ===== FIX 5: Enhanced reminder creation check =====
window.shouldCreateReminderOnStatusChange = function(newStatus) {
  const reminderStatuses = ['follow_up', 'pickup_later', 'quote_requested'];
  const shouldCreate = reminderStatuses.includes(newStatus);
  console.log(`🔍 Should create reminder for ${newStatus}:`, shouldCreate);
  return shouldCreate;
};

// ===== FIXED: Send status change notification with corrected API call =====
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

    // FIXED: Use consistent API function name (was window.apicall)
    const response = await window.apiCall('/notifications/status-change', {
      method: 'POST',
      body: JSON.stringify(notificationData)
    });

    console.log('Status change notification sent:', response);
  } catch (error) {
    console.error('Failed to send status change notification:', error);
  }
};

// ===== FIX 5: Enhanced Create reminder for status change with pickup_later support =====
window.createStatusChangeReminder = async function(lead, newStatus) {
  try {
    console.log(`🔔 Creating status change reminder for ${lead.name} - ${newStatus}`);
    
    // Create more specific reminders based on status type
    let reminderData;
    
    if (newStatus === 'pickup_later') {
      // Special handling for pickup_later with follow-up date
      const followUpDate = lead.next_follow_up_date 
        ? new Date(lead.next_follow_up_date)
        : new Date(Date.now() + 24 * 60 * 60 * 1000); // Default 24 hours

      reminderData = {
        lead_id: lead.id,
        title: `📞 Pick up ${lead.name} later`,
        description: `Follow up with ${lead.name} for ${lead.lead_for_event || 'event'}. ${lead.follow_up_notes ? 'Notes: ' + lead.follow_up_notes : ''}`,
        due_date: followUpDate.toISOString(),
        priority: 'high', // Higher priority for pickup later
        assigned_to: lead.assigned_to || window.user.email,
        created_by: window.user.name || 'System',
        auto_generated: true,
        reminder_type: 'pickup_later'
      };
    } else if (newStatus === 'follow_up') {
      // Enhanced follow-up reminder
      reminderData = {
        lead_id: lead.id,
        title: `📞 Follow up with ${lead.name}`,
        description: `Regular follow-up required for ${lead.name} - ${lead.lead_for_event || 'event'}`,
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        priority: 'medium',
        assigned_to: lead.assigned_to || window.user.email,
        created_by: window.user.name || 'System',
        auto_generated: true,
        reminder_type: 'follow_up'
      };
    } else if (newStatus === 'quote_requested') {
      // Quote request reminder
      reminderData = {
        lead_id: lead.id,
        title: `📋 Prepare quote for ${lead.name}`,
        description: `Quote requested for ${lead.name} - ${lead.lead_for_event || 'event'}. Prepare and send quote.`,
        due_date: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now for urgent quotes
        priority: 'high',
        assigned_to: lead.quote_assigned_to || lead.assigned_to || window.user.email,
        created_by: window.user.name || 'System',
        auto_generated: true,
        reminder_type: 'quote_requested'
      };
    } else {
      // Default reminder for other statuses
      reminderData = {
        lead_id: lead.id,
        title: `Follow up on ${lead.name} - ${newStatus}`,
        description: `Lead status changed to ${newStatus}. Follow up required.`,
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        priority: 'medium',
        assigned_to: lead.assigned_to || window.user.email,
        created_by: window.user.name || 'System',
        auto_generated: true,
        reminder_type: 'status_change'
      };
    }

    // FIXED: Use consistent API function name (was window.apicall)
    const response = await window.apiCall('/reminders', {
      method: 'POST',
      body: JSON.stringify(reminderData)
    });

    console.log('✅ Status change reminder created:', response);
    
    // Update local reminders state if it exists
    if (window.reminders && window.setReminders) {
      window.setReminders(prev => [...prev, response.data]);
    }
    
    // Refresh reminder stats
    if (window.fetchReminders) {
      window.fetchReminders();
    }
    
    return response;
  } catch (error) {
    console.error('❌ Failed to create status change reminder:', error);
    throw error;
  }
};

// ===== BONUS: Debug function to test reminder creation =====
window.testPickupLaterReminder = async function(leadId) {
  console.log('🧪 Testing pickup_later reminder creation...');
  
  const testLead = window.leads?.find(l => l.id === leadId);
  if (!testLead) {
    console.error('Lead not found');
    alert('Lead not found. Please provide a valid lead ID.');
    return;
  }
  
  // Create a test reminder
  const testReminder = {
    lead_id: leadId,
    title: `TEST: Pick up ${testLead.name} later`,
    description: 'This is a test reminder for pickup_later functionality',
    due_date: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
    priority: 'high',
    assigned_to: window.user?.email || 'test@example.com',
    created_by: 'Test System',
    auto_generated: true,
    reminder_type: 'test_pickup_later'
  };
  
  try {
    const response = await window.apiCall('/reminders', {
      method: 'POST',
      body: JSON.stringify(testReminder)
    });
    console.log('✅ Test reminder created:', response);
    alert('Test reminder created successfully! Check your reminders dashboard.');
    
    // Refresh reminders if function exists
    if (window.fetchReminders) {
      window.fetchReminders();
    }
  } catch (error) {
    console.error('❌ Test reminder failed:', error);
    alert('Test reminder failed: ' + error.message);
  }
};

// ===== QUOTE UPLOAD MODAL =====
window.openQuoteUploadModal = function(lead) {
  window.setCurrentLead(lead);
  window.setShowQuoteUploadModal(true);
  window.setQuoteUploadData({ notes: '', pdf: null });
};

window.handleQuoteUpload = async function(e) {
  e.preventDefault();
  
  if (!window.quoteUploadData.pdf) {
    alert('Please upload a quote PDF');
    return;
  }

  window.setLoading(true);
  
  try {
    // Upload PDF first (you'll need to implement file upload API)
    const formData = new FormData();
    formData.append('quote_pdf', window.quoteUploadData.pdf);
    formData.append('lead_id', window.currentLead.id);
    
    const uploadResponse = await window.apiCall('/leads/upload-quote', {
      method: 'POST',
      body: formData
    });

    // Update lead status to quote_received with quote info
    const updateData = {
      ...window.currentLead,
      status: 'quote_received',
      assigned_to: window.currentLead.original_assignee || window.currentLead.assigned_to,
      quote_pdf_url: uploadResponse.data.quote_url,
      quote_notes: window.quoteUploadData.notes,
      quote_uploaded_date: new Date().toISOString()
    };

    const response = await window.apiCall(`/leads/${window.currentLead.id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });

    // Update local state
    window.setLeads(prev => prev.map(l => l.id === window.currentLead.id ? response.data : l));
    
    window.setShowQuoteUploadModal(false);
    alert('Quote uploaded and lead moved to Quote Received!');
  } catch (error) {
    console.error('Quote upload error:', error);
    alert('Failed to upload quote: ' + error.message);
  } finally {
    window.setLoading(false);
  }
};

// FORCE OVERRIDE: Ensure this function is used over app-business-logic version
setTimeout(() => {
  console.log("🔧 Forcing lead-status-management.js updateLeadStatus to be primary");
  
  // This ensures our assignment logic version is always used
  if (window.updateLeadStatus.toString().includes('getSupplyTeamMember')) {
    console.log("✅ Assignment logic version is active");
  } else {
    console.error("❌ Wrong updateLeadStatus function is active!");
  }
}, 1000);
