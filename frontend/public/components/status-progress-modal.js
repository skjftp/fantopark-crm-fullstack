// Status Progress Modal Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

window.renderStatusProgressModal = () => {
  // Extract state variables from window globals (Pattern 1: State Variable Extraction)
  const {
    showStatusProgressModal = window.appState?.showStatusProgressModal,
    selectedStatus = window.appState?.selectedStatus || '',
    followUpDate = window.appState?.followUpDate || '',
    followUpNotes = window.appState?.followUpNotes || '',
    currentLead = window.currentLead || window.appState?.currentLead,
    loading = window.appState?.loading || false,
    showLeadDetail = window.appState?.showLeadDetail,
    statusProgressOptions = window.appState?.statusProgressOptions || [],
    leads = window.appState?.leads || []
  } = window.appState || {};

  // Extract setter functions from window globals (Pattern 2: Function References)
  const setShowStatusProgressModal = window.setShowStatusProgressModal || (() => {
    console.warn("setShowStatusProgressModal not implemented");
  });
  const setSelectedStatus = window.setSelectedStatus || (() => {
    console.warn("setSelectedStatus not implemented");
  });
  const setFollowUpDate = window.setFollowUpDate || (() => {
    console.warn("setFollowUpDate not implemented");
  });
  const setFollowUpNotes = window.setFollowUpNotes || (() => {
    console.warn("setFollowUpNotes not implemented");
  });
  const setLoading = window.setLoading || (() => {
    console.warn("setLoading not implemented");
  });
  const setLeads = window.setLeads || (() => {
    console.warn("setLeads not implemented");
  });
  const setCurrentLead = window.setCurrentLead || (() => {
    console.warn("setCurrentLead not implemented");
  });

  // Extract business logic functions from window globals
  const openPaymentForm = window.openPaymentForm || (() => {
    console.warn("openPaymentForm not implemented");
  });
  const openPaymentPostServiceForm = window.openPaymentPostServiceForm || (() => {
    console.warn("openPaymentPostServiceForm not implemented");
  });

  // ===== ADD THIS DEBUG CODE TO status-progress-modal.js =====
// Find the handleStatusUpdate function and replace it with this:

const handleStatusUpdate = async () => {
  console.log('🔍 === STATUS PROGRESS MODAL DEBUG ===');
  console.log('🔍 selectedStatus:', selectedStatus);
  console.log('🔍 currentLead:', currentLead);
  console.log('🔍 About to check if window.updateLeadStatus exists...');
  
  if (!selectedStatus) {
    alert('Please select a status');
    return;
  }

  // Check if the correct function exists
  if (typeof window.updateLeadStatus !== 'function') {
    console.error('❌ window.updateLeadStatus is NOT a function!');
    console.log('🔍 Type of window.updateLeadStatus:', typeof window.updateLeadStatus);
    console.log('🔍 Available window functions starting with "update":', 
      Object.keys(window).filter(key => key.toLowerCase().includes('update')));
    alert('ERROR: window.updateLeadStatus function not found!');
    return;
  }

  console.log('✅ window.updateLeadStatus exists and is a function');

  const selectedStatusConfig = window.LEAD_STATUSES[selectedStatus];

  // Check if follow-up date is required
  if (selectedStatusConfig?.requires_followup_date && !followUpDate) {
    alert('Please select a follow-up date');
    return;
  }

  try {
    setLoading(true);
    
    console.log('🎯 STATUS PROGRESS MODAL: About to call window.updateLeadStatus');
    console.log('🎯 Lead ID:', currentLead?.id);
    console.log('🎯 Lead Name:', currentLead?.name);
    console.log('🎯 New Status:', selectedStatus);
    
    // ✅ CRITICAL: Call the correct window.updateLeadStatus function
    console.log('🚀 CALLING window.updateLeadStatus NOW...');
    await window.updateLeadStatus(currentLead.id, selectedStatus);
    console.log('✅ window.updateLeadStatus call completed');
    
    // Handle follow-up date if provided
    if (followUpDate) {
      const updateData = {
        next_follow_up_date: followUpDate,
        follow_up_notes: followUpNotes
      };
      
      console.log('📅 Adding follow-up date:', followUpDate);
      
      // Update the lead with follow-up information
      await window.apiCall(`/leads/${currentLead.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      
      // Update local state
      setLeads(prev => prev.map(lead => 
        lead.id === currentLead.id 
          ? { ...lead, ...updateData }
          : lead
      ));
      
      if (window.showLeadDetail && window.currentLead?.id === currentLead.id) {
        setCurrentLead(prev => ({ ...prev, ...updateData }));
      }
    }

    // Close modal and reset form
    setShowStatusProgressModal(false);
    setSelectedStatus('');
    setFollowUpDate('');
    setFollowUpNotes('');
    setLoading(false);

    // Success message
    if (followUpDate) {
      alert(`Lead status updated successfully!\nFollow-up scheduled for ${new Date(followUpDate).toLocaleString()}`);
    } else {
      alert('Lead status updated successfully!');
    }
  } catch (error) {
    console.error('❌ Error in Status Progress Modal:', error);
    setLoading(false);
    alert('Failed to update lead status: ' + error.message);
  }
};

// ===== ALSO ADD THIS TEST FUNCTION TO VERIFY =====
// Add this at the bottom of status-progress-modal.js
console.log('🔍 Testing window.updateLeadStatus availability from modal...');
console.log('🔍 window.updateLeadStatus type:', typeof window.updateLeadStatus);
if (typeof window.updateLeadStatus === 'function') {
  console.log('✅ window.updateLeadStatus is available in modal');
} else {
  console.error('❌ window.updateLeadStatus NOT available in modal');
}

  const handleModalClose = () => {
    setShowStatusProgressModal(false);
    // Clear form when closing
    setSelectedStatus('');
    setFollowUpDate('');
    setFollowUpNotes('');
  };

  if (!showStatusProgressModal) return null;

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[70]' 
  },
    React.createElement('div', { 
      className: 'bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto' 
    },
      React.createElement('h3', { 
        className: 'text-lg font-medium text-gray-900 mb-4' 
      }, 'Progress Lead: ' + (currentLead?.name || '')),

      React.createElement('p', { 
        className: 'text-sm text-gray-600 mb-4' 
      }, 'Current Status: ' + (window.LEAD_STATUSES[currentLead?.status]?.label || currentLead?.status)),

      // Status selection
      React.createElement('div', { className: 'mb-4' },
        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Select New Status:'),
        React.createElement('select', {
          value: selectedStatus,
          onChange: (e) => setSelectedStatus(e.target.value),
          className: 'w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
        },
          React.createElement('option', { value: '' }, 'Choose status...'),
          statusProgressOptions.map(option =>
            React.createElement('option', { 
              key: option.value, 
              value: option.value 
            }, `${option.icon || ''} ${option.label}`)
          )
        )
      ),

      // Follow-up date field (shown when required)
      selectedStatus && window.LEAD_STATUSES[selectedStatus]?.requires_followup_date && 
      React.createElement('div', { className: 'mb-4' },
        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 
          '📅 Follow-up Date: *'
        ),
        React.createElement('input', {
          type: 'datetime-local',
          value: followUpDate,
          onChange: (e) => setFollowUpDate(e.target.value),
          className: 'w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500',
          min: new Date().toISOString().slice(0, 16) // Prevent past dates
        }),
        React.createElement('p', { className: 'text-xs text-gray-500 mt-1' },
          'This will create an automatic reminder for follow-up'
        )
      ),

      // Follow-up notes field (shown when follow-up date is required)
      selectedStatus && window.LEAD_STATUSES[selectedStatus]?.requires_followup_date && 
      React.createElement('div', { className: 'mb-4' },
        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 
          '📝 Follow-up Notes:'
        ),
        React.createElement('textarea', {
          value: followUpNotes,
          onChange: (e) => setFollowUpNotes(e.target.value),
          placeholder: selectedStatus === 'pickup_later' 
            ? 'Why are we picking this up later? Add context for future reference...'
            : 'Add notes for the follow-up...',
          rows: 3,
          className: 'w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
        })
      ),

      // Enhanced info section for pickup_later
      selectedStatus === 'pickup_later' && 
      React.createElement('div', { className: 'mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md' },
        React.createElement('div', { className: 'flex items-start' },
          React.createElement('div', { className: 'flex-shrink-0' },
            React.createElement('span', { className: 'text-yellow-400 text-lg' }, '⏰')
          ),
          React.createElement('div', { className: 'ml-3' },
            React.createElement('h4', { className: 'text-sm font-medium text-yellow-800' }, 'Pick Up Later'),
            React.createElement('p', { className: 'text-sm text-yellow-700 mt-1' },
              'This will create a high-priority reminder and preserve the current status for easy reactivation.'
            )
          )
        )
      ),

      // Action buttons
      React.createElement('div', { className: 'flex justify-end space-x-3 mt-6' },
        React.createElement('button', {
          type: 'button',
          onClick: handleModalClose,
          className: 'px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500'
        }, 'Cancel'),
        React.createElement('button', {
          type: 'button',
          onClick: handleStatusUpdate,
          disabled: loading,
          className: 'px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 focus:ring-2 focus:ring-blue-500'
        }, loading ? 'Updating...' : 'Update Status')
      )
    )
  );
};

console.log('✅ FIXED: Status Progress Modal with Reminder Creation loaded successfully');
