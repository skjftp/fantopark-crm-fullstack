// Lead Status Management System Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Handles lead status updates, progression logic, and choice handling

// ===== FIXED: Enhanced lead status update function with automatic reminder creation =====
// ====== UPDATED QUOTE REQUEST ASSIGNMENT LOGIC ======
// File: lead-status-management.js

// ✅ SUPPLY SALES SERVICE MANAGER ASSIGNMENT FUNCTION (for payment post service orders)
// Add this function to lead-status-management.js or orders.js

window.getSupplySalesServiceManager = async function() {
  console.log('🔍 === DEBUG getSupplySalesServiceManager CALLED ===');
  console.log('🔍 window.users length:', window.users?.length || 'undefined');
  console.log('🔍 window.users:', window.users);
  
  try {
    // Get ONLY supply_sales_service_manager users (NOT supply_service_manager)
    const supplySalesServiceManagers = window.users.filter(user => {
      const isSupplySalesServiceRole = user.role === 'supply_sales_service_manager';
      const isActive = user.status === 'active';
      
      console.log('🔍 Checking user:', user.email, 'role:', user.role, 'status:', user.status, 'isSupplySalesService:', isSupplySalesServiceRole, 'isActive:', isActive);
      
      return isSupplySalesServiceRole && isActive;
    });
    
    console.log('🔍 Found supply sales service managers:', supplySalesServiceManagers);
    
    if (supplySalesServiceManagers.length === 0) {
      console.warn('⚠️ No active supply_sales_service_manager found, checking for fallback options');
      
      // Fallback 1: Look for active supply_manager
      const supplyManagers = window.users.filter(user => 
        user.role === 'supply_manager' && user.status === 'active'
      );
      
      if (supplyManagers.length > 0) {
        console.log('🔄 Using supply_manager as fallback:', supplyManagers[0].email);
        return supplyManagers[0].email;
      }
      
      // Fallback 2: Look for active admins
      const adminUsers = window.users.filter(user => 
        ['admin', 'super_admin'].includes(user.role) && user.status === 'active'
      );
      
      if (adminUsers.length > 0) {
        console.log('🔄 Using admin as fallback:', adminUsers[0].email);
        return adminUsers[0].email;
      }
      
      // Last resort: return the first active user
      const activeUsers = window.users.filter(user => user.status === 'active');
      if (activeUsers.length > 0) {
        console.log('🔄 Using first active user as last resort:', activeUsers[0].email);
        return activeUsers[0].email;
      }
      
      throw new Error('No active users found for supply_sales_service_manager assignment');
    }
    
    console.log('✅ Found', supplySalesServiceManagers.length, 'supply sales service managers');
    
    // Use round-robin if multiple supply_sales_service_managers exist
    let selectedManager;
    if (supplySalesServiceManagers.length > 1) {
      const managerIndex = (Date.now() % supplySalesServiceManagers.length);
      selectedManager = supplySalesServiceManagers[managerIndex];
      console.log('🎯 Selected supply sales service manager via round-robin:', selectedManager.email);
    } else {
      selectedManager = supplySalesServiceManagers[0];
      console.log('🎯 Selected only available supply sales service manager:', selectedManager.email);
    }
    
    console.log('🎯 Final assignment to:', selectedManager.email, '(' + selectedManager.name + ')');
    
    return selectedManager.email;
    
  } catch (error) {
    console.error('❌ Error getting supply sales service manager:', error);
    
    // Emergency fallback: try to find ANY active user
    try {
      const emergencyUser = window.users.find(user => user.status === 'active');
      if (emergencyUser) {
        console.log('🚨 Emergency fallback to:', emergencyUser.email);
        return emergencyUser.email;
      }
    } catch (fallbackError) {
      console.error('❌ Emergency fallback also failed:', fallbackError);
    }
    
    throw new Error('Failed to assign to any supply_sales_service_manager');
  }
};

// ✅ FIXED: Enhanced getSupplyTeamMember with user loading check
// Replace the existing getSupplyTeamMember function

window.getSupplyTeamMember = async function() {
  console.log('🔍 === DEBUG getSupplyTeamMember CALLED ===');
  console.log('🔍 window.users length:', window.users?.length || 'undefined');
  console.log('🔍 window.users:', window.users);
  
  try {
    // 🔧 FIXED: If users are not loaded, fetch them first
    if (!window.users || window.users.length === 0) {
      console.log('🔄 Users not loaded, fetching users first...');
      
      // Try to fetch users
      if (window.fetchUsers && typeof window.fetchUsers === 'function') {
        await window.fetchUsers();
        console.log('✅ Users fetched, new length:', window.users?.length);
      } else {
        // Manual API call if fetchUsers function not available
        try {
          const usersResponse = await window.apiCall('/users');
          window.users = usersResponse.data || usersResponse || [];
          window.setUsers && window.setUsers(window.users);
          console.log('✅ Users fetched manually, length:', window.users.length);
        } catch (fetchError) {
          console.error('❌ Failed to fetch users:', fetchError);
        }
      }
    }
    
    // Get all supply team members
    const supplyTeamMembers = window.users.filter(user => {
      const isSupplyRole = ['supply_manager', 'supply_service_manager', 'supply_sales_service_manager'].includes(user.role);
      const isActive = user.status === 'active';
      
      console.log('🔍 Checking user:', user.email, 'role:', user.role, 'status:', user.status, 'isSupply:', isSupplyRole, 'isActive:', isActive);
      
      return isSupplyRole && isActive;
    });
    
    console.log('🔍 Found supply team members:', supplyTeamMembers);
    
    if (supplyTeamMembers.length === 0) {
      console.warn('⚠️ No active supply team members found, using fallback');
      
      // Enhanced fallback - try to find any admin or manager
      const fallbackUsers = window.users.filter(user => 
        user.status === 'active' && 
        ['admin', 'super_admin', 'supply_manager'].includes(user.role)
      );
      
      if (fallbackUsers.length > 0) {
        console.log('🔄 Using fallback user:', fallbackUsers[0].email);
        return fallbackUsers[0].email;
      }
      
      // Last resort fallback
      return 'akshay@fantopark.com';
    }
    
    console.log('✅ Found', supplyTeamMembers.length, 'supply team members');
    
    const selectedMember = supplyTeamMembers[0];
    console.log('🎯 Assigning to:', selectedMember.email, '(' + selectedMember.name + ')');
    
    return selectedMember.email;
    
  } catch (error) {
    console.error('❌ Error getting supply team member:', error);
    return 'akshay@fantopark.com'; // fallback
  }
};

// Add this function to your lead-status-management.js file
window.getFinanceManager = async function() {
  console.log('🔍 === DEBUG getFinanceManager CALLED ===');
  console.log('🔍 window.users length:', window.users?.length || 'undefined');
  console.log('🔍 window.users:', window.users);
  
  try {
    // Get all finance team members
    const financeTeamMembers = window.users.filter(user => {
      const isFinanceRole = ['finance_manager', 'finance_executive'].includes(user.role);
      const isActive = user.status === 'active';
      
      console.log('🔍 Checking user:', user.email, 'role:', user.role, 'status:', user.status, 'isFinance:', isFinanceRole, 'isActive:', isActive);
      
      return isFinanceRole && isActive;
    });
    
    console.log('🔍 Found finance team members:', financeTeamMembers);
    
    if (financeTeamMembers.length === 0) {
      console.warn('⚠️ No active finance team members found, checking for admins as fallback');
      
      // Fallback: Look for active admins
      const adminUsers = window.users.filter(user => 
        ['admin', 'super_admin'].includes(user.role) && user.status === 'active'
      );
      
      if (adminUsers.length > 0) {
        console.log('🔄 Using admin as fallback:', adminUsers[0].email);
        return adminUsers[0].email;
      }
      
      // Last resort: return the first active user
      const activeUsers = window.users.filter(user => user.status === 'active');
      if (activeUsers.length > 0) {
        console.log('🔄 Using first active user as last resort:', activeUsers[0].email);
        return activeUsers[0].email;
      }
      
      throw new Error('No active users found for finance assignment');
    }
    
    console.log('✅ Found', financeTeamMembers.length, 'finance team members');
    
    // Prioritize finance_manager over finance_executive
    const financeManagers = financeTeamMembers.filter(user => user.role === 'finance_manager');
    const financeExecutives = financeTeamMembers.filter(user => user.role === 'finance_executive');
    
    let selectedMember;
    
    if (financeManagers.length > 0) {
      // Use round-robin for finance managers if multiple exist
      const managerIndex = (Date.now() % financeManagers.length);
      selectedMember = financeManagers[managerIndex];
      console.log('🎯 Selected finance manager via round-robin:', selectedMember.email);
    } else {
      // Use first finance executive if no managers
      selectedMember = financeExecutives[0];
      console.log('🎯 Selected finance executive (no managers available):', selectedMember.email);
    }
    
    console.log('🎯 Final assignment to:', selectedMember.email, '(' + selectedMember.name + ')');
    
    return selectedMember.email;
    
  } catch (error) {
    console.error('❌ Error getting finance manager:', error);
    
    // Emergency fallback: try to find ANY active user
    try {
      const emergencyUser = window.users.find(user => user.status === 'active');
      if (emergencyUser) {
        console.log('🚨 Emergency fallback to:', emergencyUser.email);
        return emergencyUser.email;
      }
    } catch (fallbackError) {
      console.error('❌ Emergency fallback also failed:', fallbackError);
    }
    
    throw new Error('Failed to assign to any finance manager');
  }
};

// ===== DEBUG VERSION: Add this to lead-status-management.js =====
window.updateLeadStatus = async function(leadId, newStatus) {
  console.log('🔍 === DEBUG updateLeadStatus CALLED ===');
  console.log('🔍 leadId:', leadId);
  console.log('🔍 newStatus:', newStatus);
  console.log('🔍 Function location:', 'lead-status-management.js');
  
  if (!window.hasPermission('leads', 'progress')) {
    alert('You do not have permission to progress leads');
    return;
  }

  try {
    window.setLoading(true);

    // CRITICAL: Get the full lead object first
    // Check both window.leads (main leads page) and window.myLeads (My Actions)
    let currentLead = window.leads ? window.leads.find(l => l.id === leadId) : null;
    
    // If not found in leads, check myLeads (when called from My Actions)
    if (!currentLead && window.myLeads) {
      currentLead = window.myLeads.find(l => l.id === leadId);
    }
    
    console.log('🔍 currentLead found:', currentLead);
    
    if (!currentLead) {
      alert('Lead not found');
      window.setLoading(false);
      return;
    }

    const oldStatus = currentLead.status;
    console.log('🔍 oldStatus:', oldStatus);
    console.log('🔍 newStatus:', newStatus);

    // ✅ QUOTE WORKFLOW LOGIC
    let updateData = {
      ...currentLead,
      status: newStatus,
      last_contact_date: new Date().toISOString(),
      [newStatus + '_date']: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };

    console.log('🔍 Initial updateData:', updateData);

    // Handle quote_requested -> auto-assign to Supply Team and store original assignee
    if (newStatus === 'quote_requested') {
      console.log('🎯 ENTERING QUOTE_REQUESTED LOGIC');
      console.log('🔍 currentLead.assigned_to:', currentLead.assigned_to);
      
      // Check if getSupplyTeamMember function exists
      if (typeof window.getSupplyTeamMember !== 'function') {
        console.error('❌ window.getSupplyTeamMember function not found!');
        alert('getSupplyTeamMember function missing!');
        return;
      }
      
      try {
        const supplyMember = await window.getSupplyTeamMember();
        console.log('🔍 getSupplyTeamMember returned:', supplyMember);
        
        updateData.original_assignee = currentLead.assigned_to;
        updateData.assigned_to = supplyMember;
        updateData.assigned_team = 'supply';
        
        console.log('🎯 QUOTE ASSIGNMENT APPLIED:');
        console.log('🔍 original_assignee:', updateData.original_assignee);
        console.log('🔍 new assigned_to:', updateData.assigned_to);
        console.log('🔍 assigned_team:', updateData.assigned_team);
        
      } catch (supplyError) {
        console.error('❌ Error in getSupplyTeamMember:', supplyError);
        alert('Failed to get supply team member: ' + supplyError.message);
        return;
      }
    }

    // Handle quote_received -> restore original assignee  
    if (oldStatus === 'quote_requested' && newStatus === 'quote_received') {
  console.log('🔍 === QUOTE_RECEIVED WORKFLOW DEBUG ===');
  console.log('🔍 oldStatus:', oldStatus);
  console.log('🔍 newStatus:', newStatus);
  console.log('🔍 About to open quote upload modal...');
  
  updateData.assigned_to = currentLead.original_assignee || currentLead.assigned_to;
  console.log('🔍 Restored assigned_to:', updateData.assigned_to);
  
  // Check if openQuoteUploadModal function exists
  if (typeof window.openQuoteUploadModal !== 'function') {
    console.error('❌ window.openQuoteUploadModal function does NOT exist!');
    console.log('🔍 Available window functions with "quote":', 
      Object.keys(window).filter(key => key.toLowerCase().includes('quote')));
    alert('ERROR: Quote upload modal function not found!');
    window.setLoading(false);
    return;
  }
  
  console.log('✅ window.openQuoteUploadModal function exists');
  
  // Check if modal state variables exist
  const modalStates = {
    showQuoteUploadModal: typeof window.showQuoteUploadModal,
    setShowQuoteUploadModal: typeof window.setShowQuoteUploadModal,
    quoteUploadData: typeof window.quoteUploadData,
    setQuoteUploadData: typeof window.setQuoteUploadData
  };
  
  console.log('🔍 Modal state variables:', modalStates);
  
  window.setLoading(false);
  
  console.log('🚀 Calling window.openQuoteUploadModal...');
  try {
    window.openQuoteUploadModal(currentLead);
    console.log('✅ window.openQuoteUploadModal called successfully');
  } catch (error) {
    console.error('❌ Error calling openQuoteUploadModal:', error);
    alert('Error opening quote upload modal: ' + error.message);
  }
  
  return;
}

    console.log('🔍 Final updateData before API call:', updateData);

    // API call to update lead status
    const response = await window.apiCall('/leads/' + leadId, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });

    console.log('🔍 API Response:', response);
    console.log('🔍 API Response Data:', response.data);

    // Update local state with response from server
    if (window.setLeads) {
      window.setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === leadId ? response.data : lead
        )
      );
    }
    
    // Also update myLeads if we're in My Actions
    if (window.myLeads && window.setMyLeads) {
      window.setMyLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === leadId ? response.data : lead
        )
      );
    }

    // Update current lead if in detail view
    if (window.showLeadDetail && window.currentLead?.id === leadId) {
      window.setCurrentLead(response.data);
    }

    // Check if My Actions refresh is needed
    if (window.activeTab === 'myactions' && window.fetchMyActions) {
      console.log('🔄 Refreshing My Actions');
      window.fetchMyActions();
    }

    window.setLoading(false);
    alert('Lead status updated successfully!');
  } catch (error) {
    console.error('❌ Error updating lead status:', error);
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
    { value: 'generate_proforma', label: 'Generate Proforma Invoice', icon: '📄', color: 'purple' },
    { value: 'pickup_later', label: 'Pick Up Later', icon: '⏰', requires_followup_date: true }
  ]);
        window.setShowChoiceModal(true);
      } else {
        // Original logic for payment choices
        window.setCurrentLeadForChoice(lead);
        window.setChoiceOptions([
  { value: 'payment', label: 'Collect Payment Now', icon: '💳' },
  { value: 'payment_post_service', label: 'Payment Post Service', icon: '📅' },
  { value: 'generate_proforma', label: 'Generate Proforma Invoice', icon: '📄', color: 'purple' }
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

// Replace the handleQuoteUpload function in lead-status-management.js with this:

// Replace the handleQuoteUpload function in lead-status-management.js with this:

window.handleQuoteUpload = async function(e) {
  e.preventDefault();
  
  console.log('📄 Quote upload started');
  console.log('📄 Current lead:', window.currentLead);
  console.log('📄 Quote upload data:', window.quoteUploadData);
  
  const hasFile = window.quoteUploadData.pdf && window.quoteUploadData.pdf.name;
  console.log('📄 Has file to upload:', hasFile);

  window.setLoading(true);
  
  try {
    if (hasFile) {
      // FIXED: Call the actual backend upload endpoint instead of local storage
      console.log('📤 Uploading file via backend endpoint...');
      
      const formData = new FormData();
      formData.append('quote_pdf', window.quoteUploadData.pdf); // Backend expects 'quote_pdf'
      formData.append('notes', window.quoteUploadData.notes || '');
      
      const uploadResponse = await fetch(`${window.API_CONFIG.API_URL}/leads/${window.currentLead.id}/quote/upload`, {
        method: 'POST',
        headers: {
          'Authorization': window.authToken ? 'Bearer ' + window.authToken : ''
          // Don't set Content-Type for FormData
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || `Upload failed with status ${uploadResponse.status}`);
      }

      const uploadResult = await uploadResponse.json();
      console.log('📄 Upload successful:', uploadResult);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }
      
      // The backend endpoint already updates the lead with file info and status
      // Just update our local state with the response
      window.setLeads(prev => prev.map(l => 
        l.id === window.currentLead.id ? uploadResult.data : l
      ));
      
      // Update current lead if in detail view
      if (window.showLeadDetail && window.currentLead?.id === uploadResult.data.id) {
        window.setCurrentLead(uploadResult.data);
      }
      
      console.log('📄 Lead updated from backend response');
      
    } else {
      // No file - just update notes and status
      console.log('📄 No file - updating status only...');
      
      const originalAssignee = window.currentLead.original_assignee || window.currentLead.assigned_to;
      
      const updateData = {
        ...window.currentLead,
        status: 'quote_received',
        assigned_to: originalAssignee,
        assigned_team: null,
        quote_notes: window.quoteUploadData.notes || '',
        quote_uploaded_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
      };

      const response = await window.apiCall(`/leads/${window.currentLead.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      window.setLeads(prev => prev.map(l => 
        l.id === window.currentLead.id ? response.data : l
      ));
      
      if (window.showLeadDetail && window.currentLead?.id === response.data.id) {
        window.setCurrentLead(response.data);
      }
    }
    
    // Refresh My Actions if we're on that tab
    if (window.activeTab === 'myactions' && window.fetchMyActions) {
      window.fetchMyActions();
    }
    
    // Close modal and show success
    window.setShowQuoteUploadModal(false);
    window.setQuoteUploadData({ notes: '', pdf: null });
    
    const fileInfo = hasFile ? `\nFile: ${window.quoteUploadData.pdf.name} ✅ Uploaded to Google Cloud Storage` : '\nNo file uploaded';
    const notesInfo = window.quoteUploadData.notes ? `\nNotes: ${window.quoteUploadData.notes}` : '';
    
    alert(`✅ Quote processed successfully!\n\nLead: ${window.currentLead.name}\nStatus: Quote Received${fileInfo}${notesInfo}`);
    
    console.log('📄 Quote upload workflow completed successfully');
    
  } catch (error) {
    console.error('❌ Quote upload error:', error);
    alert(`Failed to process quote: ${error.message}`);
  } finally {
    window.setLoading(false);
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
      setShowChoiceModal(false);
      // Instead of openPaymentPostServiceForm, open proforma form
      window.openProformaInvoiceForm(currentLeadForChoice);
      setLoading(false);
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
  
  console.log('📄 Quote upload started');
  console.log('📄 Current lead:', window.currentLead);
  console.log('📄 Quote upload data:', window.quoteUploadData);
  
  // File upload is now OPTIONAL
  const hasFile = window.quoteUploadData.pdf && window.quoteUploadData.pdf.name;
  console.log('📄 Has file to upload:', hasFile);

  window.setLoading(true);
  
  try {
    // Get the original assignee from the current lead
    const originalAssignee = window.currentLead.original_assignee || window.currentLead.assigned_to;
    
    console.log('📄 Restoring assignment to:', originalAssignee);
    
    // Update lead status to quote_received and restore original assignee
    const updateData = {
      ...window.currentLead,
      status: 'quote_received',
      assigned_to: originalAssignee, // Restore to original assignee
      assigned_team: null, // Clear supply team assignment
      quote_notes: window.quoteUploadData.notes || '',
      quote_uploaded_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };

    // ===== NEW: ACTUALLY UPLOAD THE FILE TO GOOGLE CLOUD STORAGE =====
    if (hasFile) {
  console.log('📄 Uploading file to Google Cloud Storage...');
  console.log('📄 Using uploadFileToGCS function...');
  
  try {
    // Use the fixed uploadFileToGCS function - it handles everything
    const uploadResult = await window.uploadFileToGCS(window.quoteUploadData.pdf, 'quote');
    console.log('✅ File uploaded via uploadFileToGCS:', uploadResult);
    
    // The backend already updated the lead, so just refresh local state
    const updatedLead = await window.apiCall(`/leads/${window.currentLead.id}`);
    
    window.setLeads(prev => prev.map(l => 
      l.id === window.currentLead.id ? updatedLead.data : l
    ));
    
    if (window.showLeadDetail && window.currentLead?.id === updatedLead.data.id) {
      window.setCurrentLead(updatedLead.data);
    }
    
  } catch (uploadError) {
    console.error('❌ File upload failed:', uploadError);
    alert('Failed to upload file: ' + uploadError.message);
    window.setLoading(false);
    return;
  }
} else {
  console.log('📄 No file selected - proceeding without file upload');
  
  // No file case - just update status via API  
  const response = await window.apiCall(`/leads/${window.currentLead.id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData)
  });

  window.setLeads(prev => prev.map(l => 
    l.id === window.currentLead.id ? response.data : l
  ));
  
  if (window.showLeadDetail && window.currentLead?.id === response.data.id) {
    window.setCurrentLead(response.data);
  }
}

    console.log('📄 Updating lead with data:', updateData);

    // Update the lead via the standard API (if not already handled by backend)
    const response = await window.apiCall(`/leads/${window.currentLead.id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });

    console.log('📄 Lead update response:', response);

    // Update local state
    window.setLeads(prev => prev.map(l => 
      l.id === window.currentLead.id ? response.data : l
    ));
    
    // Update current lead if in detail view
    if (window.showLeadDetail && window.currentLead?.id === response.data.id) {
      window.setCurrentLead(response.data);
    }
    
    // Refresh My Actions if we're on that tab
    if (window.activeTab === 'myactions' && window.fetchMyActions) {
      window.fetchMyActions();
    }
    
    // Close modal and show success
    window.setShowQuoteUploadModal(false);
    window.setQuoteUploadData({ notes: '', pdf: null });
    
    // Create success message
    const fileInfo = hasFile ? `\nFile: ${updateData.quote_pdf_filename}` : '\nNo file uploaded';
    const notesInfo = window.quoteUploadData.notes ? `\nNotes: ${window.quoteUploadData.notes}` : '';
    
    alert(`✅ Quote processed successfully!\n\nLead: ${window.currentLead.name}\nStatus: Quote Received\nAssigned back to: ${originalAssignee}${fileInfo}${notesInfo}`);
    
    console.log('📄 Quote upload workflow completed successfully');
    
  } catch (error) {
    console.error('❌ Quote upload error:', error);
    alert('Failed to process quote: ' + error.message);
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
