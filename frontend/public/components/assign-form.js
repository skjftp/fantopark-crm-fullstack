// Assign Form Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

window.renderAssignForm = () => {
  // ✅ FIXED: Extract all required variables from window globals
  const {
    showAssignForm = window.appState?.showAssignForm,
    currentLead = window.currentLead || window.appState?.currentLead,
    formData = window.formData || window.appState?.formData || {},
    users = window.users || window.appState?.users || [],
    loading = window.loading || window.appState?.loading || false
  } = window.appState || {};

  // ✅ FIXED: Use proper state reference pattern
  if (!showAssignForm || !currentLead) {
    console.log("🔍 Assign form not showing:", { showAssignForm, currentLead: !!currentLead });
    return null;
  }

  console.log("🎯 Rendering assign form for lead:", currentLead.name);
  console.log("🔍 Available users:", users.length);
  console.log("🔍 Current form data:", formData);

  // ✅ FIXED: Get team members with proper filtering
  const teamMembers = (formData.assigned_team === 'supply' || formData.assigned_team === 'Supply')
    ? users.filter(u => ['supply_executive', 'supply_sales_service_manager'].includes(u.role)) 
    : users.filter(u => ['sales_executive', 'sales_manager'].includes(u.role));

  console.log("👥 Team members for", formData.assigned_team || 'sales', "team:", teamMembers.length);

  // ✅ FIXED: Extract required functions from window
  const handleInputChange = window.handleFormDataChange || window.handleInputChange || ((field, value) => {
    console.log("📝 Input changed:", field, "=", value);
    if (window.setFormData) {
      window.setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  });

  const handleAssignLead = window.handleAssignLead || ((e) => {
    console.log("🚀 Assign lead form submitted");
    e.preventDefault();
    console.warn("⚠️ handleAssignLead function not implemented");
  });

  const closeForm = window.closeForm || (() => {
    console.log("🔄 Closing assign form");
    if (window.setShowAssignForm) {
      window.setShowAssignForm(false);
    }
    if (window.setCurrentLead) {
      window.setCurrentLead(null);
    }
    if (window.setFormData) {
      window.setFormData({});
    }
  });

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => {
      if (e.target === e.currentTarget) {
        console.log("🔄 Clicked outside assign form - closing");
        closeForm();
      }
    }
  },
    React.createElement('div', { 
      className: 'bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md',
      onClick: (e) => e.stopPropagation() // Prevent closing when clicking inside modal
    },
      React.createElement('div', { className: 'flex justify-between items-center mb-6' },
        React.createElement('h2', { className: 'text-xl font-bold text-gray-900 dark:text-white' }, 
          'Assign Lead: ' + (currentLead.name || 'Unknown Lead')
        ),
        React.createElement('button', {
          onClick: () => {
            console.log("❌ Close button clicked");
            closeForm();
          },
          className: 'text-gray-400 hover:text-gray-600 text-2xl'
        }, '✕')
      ),

      React.createElement('form', { 
        onSubmit: (e) => {
          console.log("📝 Assign form submitted");
          handleAssignLead(e);
        }
      },
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' }, 
            'Team'
          ),
          React.createElement('select', {
            value: formData.assigned_team || 'sales',
            onChange: (e) => {
              console.log("🏢 Team changed to:", e.target.value);
              handleInputChange('assigned_team', e.target.value);
              // Clear assigned_to when team changes
              handleInputChange('assigned_to', '');
            },
            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
            required: true
          },
            React.createElement('option', { value: 'sales' }, 'Sales Team'),
            React.createElement('option', { value: 'supply' }, 'Supply Team')
          )
        ),

        React.createElement('div', { className: 'mb-6' },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' }, 
            'Assign To'
          ),
          React.createElement('select', {
            value: formData.assigned_to || '',
            onChange: (e) => {
              console.log("👤 Assignee changed to:", e.target.value);
              handleInputChange('assigned_to', e.target.value);
            },
            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
            required: true
          },
            React.createElement('option', { value: '' }, 'Select Team Member'),
            teamMembers.length > 0 ? teamMembers.map(user =>
              React.createElement('option', { 
                key: user.id || user.email, 
                value: user.email 
              }, user.name || user.email)
            ) : React.createElement('option', { value: '', disabled: true }, 
              `No ${formData.assigned_team || 'sales'} team members found`
            )
          )
        ),

        // ✅ ENHANCED: Show current assignment info if available
        currentLead.assigned_to && React.createElement('div', { className: 'mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded' },
          React.createElement('p', { className: 'text-sm text-yellow-800' },
            React.createElement('strong', null, 'Current Assignment: '),
            window.getUserDisplayName ? window.getUserDisplayName(currentLead.assigned_to, users) : currentLead.assigned_to
          )
        ),

        React.createElement('div', { className: 'flex space-x-4' },
          React.createElement('button', {
            type: 'button',
            onClick: () => {
              console.log("🚫 Cancel button clicked");
              closeForm();
            },
            className: 'flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700'
          }, 'Cancel'),
          React.createElement('button', {
            type: 'submit',
            disabled: loading || !formData.assigned_to,
            className: 'flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
          }, loading ? 'Assigning...' : 'Assign')
        )
      ),

      // ✅ ENHANCED: Debug info in development
      React.createElement('div', { className: 'mt-4 text-xs text-gray-500' },
        React.createElement('details', null,
          React.createElement('summary', { className: 'cursor-pointer' }, 'Debug Info'),
          React.createElement('pre', { className: 'mt-2 p-2 bg-gray-100 rounded text-xs' },
            JSON.stringify({
              leadId: currentLead.id,
              leadName: currentLead.name,
              currentTeam: formData.assigned_team || 'sales',
              selectedAssignee: formData.assigned_to,
              availableUsers: teamMembers.length,
              loading: loading
            }, null, 2)
          )
        )
      )
    )
  );
};

console.log('✅ Assign Form component loaded successfully with proper state integration');
