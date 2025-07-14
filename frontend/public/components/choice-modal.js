// Choice Modal Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

window.renderChoiceModal = () => {
  // ✅ FIXED: Extract all required variables from window globals
  const {
    showChoiceModal = window.showChoiceModal || window.appState?.showChoiceModal,
    currentLeadForChoice = window.currentLeadForChoice || window.appState?.currentLeadForChoice,
    choiceOptions = window.choiceOptions || window.appState?.choiceOptions || [],
    loading = window.loading || window.appState?.loading || false
  } = window.appState || {};

  // ✅ FIXED: Use proper state reference pattern
  if (!showChoiceModal) {
    console.log("🔍 Choice modal not showing:", { showChoiceModal });
    return null;
  }

  console.log("🎯 Rendering choice modal for lead:", currentLeadForChoice?.name);
  console.log("🔍 Available choice options:", choiceOptions);

  // ✅ FIXED: Extract required functions from window with original logic preserved
  const handleChoiceSelection = window.handleChoiceSelection || ((option) => {
    console.log("🚀 Choice selected:", option);
    
    if (!option) {
      console.warn("⚠️ No option provided to handleChoiceSelection");
      return;
    }

    // ✅ PRESERVE ORIGINAL LOGIC: Check for follow-up date requirement
    if (option.requires_followup_date) {
      console.log("📅 Option requires follow-up date - opening enhanced modal");
      
      // Close choice modal and open status progress modal
      if (window.setShowChoiceModal) {
        window.setShowChoiceModal(false);
      }
      
      if (window.setCurrentLead) {
        window.setCurrentLead(currentLeadForChoice);
      }
      
      if (window.setShowStatusProgressModal) {
        window.setShowStatusProgressModal(true);
      }
      
      if (window.setStatusProgressOptions) {
        window.setStatusProgressOptions([{
          value: option.value,
          label: option.label,
          color: option.color || 'bg-gray-100 text-gray-800',
          requires_followup_date: true
        }]);
      }
      
      if (window.setLoading) {
        window.setLoading(false);
      }
      return;
    }

    // ✅ PRESERVE ORIGINAL LOGIC: Handle payment choices
    if (option.value === 'payment') {
      console.log("💳 Opening payment form");
      if (window.setShowChoiceModal) {
        window.setShowChoiceModal(false);
      }
      if (window.openPaymentForm && currentLeadForChoice) {
        window.openPaymentForm(currentLeadForChoice);
      }
      if (window.setLoading) {
        window.setLoading(false);
      }
      return;
    }

    if (option.value === 'payment_post_service') {
      console.log("💳 Opening payment post service form");
      if (window.setShowChoiceModal) {
        window.setShowChoiceModal(false);
      }
      if (window.openPaymentPostServiceForm && currentLeadForChoice) {
        window.openPaymentPostServiceForm(currentLeadForChoice);
      }
      if (window.setLoading) {
        window.setLoading(false);
      }
      return;
    }

    // ✅ NEW: Handle proforma invoice generation
    if (option.value === 'generate_proforma') {
      console.log("📄 Opening proforma invoice form");
      if (window.setShowChoiceModal) {
        window.setShowChoiceModal(false);
      }
      if (window.openProformaInvoiceForm && currentLeadForChoice) {
        window.openProformaInvoiceForm(currentLeadForChoice);
      }
      if (window.setLoading) {
        window.setLoading(false);
      }
      return;
    }

    // ✅ PRESERVE ORIGINAL LOGIC: For regular status updates
    if (window.updateLeadStatus && currentLeadForChoice) {
      console.log("🔄 Updating lead status to:", option.value);
      window.updateLeadStatus(currentLeadForChoice.id, option.value);
    }
    
    if (window.setShowChoiceModal) {
      window.setShowChoiceModal(false);
    }
    
    if (window.setLoading) {
      window.setLoading(false);
    }
  });

  const setShowChoiceModal = window.setShowChoiceModal || ((show) => {
    console.log("🔄 Setting choice modal visibility:", show);
    // Fallback if setter not available
  });

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => {
      if (e.target === e.currentTarget) {
        console.log("🔄 Clicked outside choice modal - closing");
        setShowChoiceModal(false);
      }
    }
  },
    React.createElement('div', { 
      className: 'bg-white rounded-lg p-6 w-full max-w-md',
      onClick: (e) => e.stopPropagation() // Prevent closing when clicking inside modal
    },
      React.createElement('h3', { 
        className: 'text-lg font-medium text-gray-900 mb-4' 
      }, 'Choose Next Step for: ' + (currentLeadForChoice?.name || 'Unknown Lead')),

      React.createElement('div', { className: 'space-y-2' },
        choiceOptions.length > 0 ? choiceOptions.map((option, index) =>
          React.createElement('button', {
            key: index,
            onClick: () => {
              console.log("🎯 Choice button clicked:", option.label);
              handleChoiceSelection(option);
            },
            disabled: loading,
            className: `w-full p-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors ${
              option.requires_followup_date ? 'border-indigo-300 bg-indigo-50' : ''
            } ${
              option.value === 'generate_proforma' ? 'border-purple-300 bg-purple-50 hover:bg-purple-100' : ''
            }`
          },
            React.createElement('div', { className: 'flex items-center justify-between' },
              React.createElement('span', { className: 'flex items-center' },
                React.createElement('span', { className: 'text-lg mr-2' }, option.icon || '📝'),
                React.createElement('span', { className: 'font-medium' }, option.label || option.value)
              ),
              option.requires_followup_date && 
                React.createElement('span', { 
                  className: 'text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded' 
                }, 'Requires Follow-up Date'),
              option.value === 'generate_proforma' && 
                React.createElement('span', { 
                  className: 'text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded' 
                }, 'Proforma')
            )
          )
        ) : React.createElement('div', { className: 'text-center py-4 text-gray-500' },
          'No options available'
        )
      ),

      React.createElement('div', { className: 'mt-6 flex justify-end' },
        React.createElement('button', {
          onClick: () => {
            console.log("🚫 Cancel button clicked");
            setShowChoiceModal(false);
          },
          className: 'px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50'
        }, 'Cancel')
      ),

      // ✅ ENHANCED: Debug info in development
      React.createElement('div', { className: 'mt-4 text-xs text-gray-500' },
        React.createElement('details', null,
          React.createElement('summary', { className: 'cursor-pointer' }, 'Debug Info'),
          React.createElement('pre', { className: 'mt-2 p-2 bg-gray-100 rounded text-xs' },
            JSON.stringify({
              leadId: currentLeadForChoice?.id,
              leadName: currentLeadForChoice?.name,
              optionsCount: choiceOptions.length,
              loading: loading,
              hasProformaFunction: !!window.openProformaInvoiceForm
            }, null, 2)
          )
        )
      )
    )
  );
};

console.log('✅ Choice Modal component loaded successfully with proforma invoice support');
