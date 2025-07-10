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

  const handleStatusUpdate = async () => {
    if (!selectedStatus) {
      alert('Please select a status');
      return;
    }

    const selectedStatusConfig = window.LEAD_STATUSES[selectedStatus];

    // Check if follow-up date is required
    if (selectedStatusConfig.requires_followup_date && !followUpDate) {
      alert('Follow-up date is required for this status');
      return;
    }

    try {
      setLoading(true);

      // Handle payment status specially
      if (selectedStatus === 'payment') {
        setShowStatusProgressModal(false);
        openPaymentForm(currentLead);
        setLoading(false);
        return;
      }

      if (selectedStatus === 'payment_post_service') {
        setShowStatusProgressModal(false);
        openPaymentPostServiceForm(currentLead);
        setLoading(false);
        return;
      }

      // Prepare update data
      const updateData = {
        ...currentLead,
        status: selectedStatus,
        last_contact_date: new Date().toISOString(),
        [(selectedStatus) + '_date']: new Date().toISOString(),
        updated_date: new Date().toISOString()
      };

      // Add follow-up specific fields if applicable
      if (selectedStatusConfig.requires_followup_date && followUpDate) {
        updateData.next_follow_up_date = followUpDate;
        updateData.follow_up_notes = followUpNotes;
        updateData.follow_up_reason = selectedStatus === 'pickup_later' ? 'Pick up later' : 'Follow up required';

        // Store previous status for pickup_later
        if (selectedStatus === 'pickup_later') {
          updateData.previous_status = currentLead.status;
        }
      }

      // Update lead status
      const response = await window.apiCall('/leads/' + currentLead.id, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      // Update local state
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === currentLead.id ? response.data : lead
        )
      );

      // Update current lead if in detail view
      if (showLeadDetail && currentLead?.id === currentLead.id) {
        setCurrentLead(response.data);
      }

      setLoading(false);
      setShowStatusProgressModal(false);

      // Clear the form after successful update
      setSelectedStatus('');
      setFollowUpDate('');
      setFollowUpNotes('');

      // Show success message with follow-up info
      if (selectedStatusConfig.requires_followup_date && followUpDate) {
        alert(`Lead status updated successfully! Follow-up scheduled for ${new Date(followUpDate).toLocaleString()}`);
      } else {
        alert('Lead status updated successfully!');
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
      setLoading(false);
      alert('Failed to update lead status: ' + error.message);
    }
  };

  const handleModalClose = () => {
    setShowStatusProgressModal(false);
    // Clear form when closing
    setSelectedStatus('');
    setFollowUpDate('');
    setFollowUpNotes('');
  };

  if (!showStatusProgressModal) return null;

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50' 
  },
    React.createElement('div', { 
      className: 'bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto' 
    },
      React.createElement('h3', { 
        className: 'text-lg font-medium text-gray-900 mb-4' 
      }, 'Progress Lead: ' + (currentLead?.name || '')),

      React.createElement('p', { 
        className: 'text-sm text-gray-600 mb-4' 
      }, 'Current Status: ' + window.LEAD_STATUSES[currentLead?.status]?.label),

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

console.log('✅ Status Progress Modal component loaded successfully');
