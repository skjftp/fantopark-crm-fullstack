// ===============================================
// OPTIMIZED ASSIGN FORM COMPONENT - PERFORMANCE ENHANCED
// ===============================================
// Assign Form Component for FanToPark CRM
// Cleaned version with unified logging

window.renderAssignForm = () => {
  // ✅ FIXED: Extract all required variables from window globals
  const {
    showAssignForm = window.appState?.showAssignForm,
    currentLead = window.currentLead || window.appState?.currentLead,
    formData = window.formData || window.appState?.formData || {},
    users = window.users || window.appState?.users || [],
    loading = window.loading || window.appState?.loading || false
  } = window.appState || {};

  // ✅ CRITICAL: Check for required data BEFORE using it
  if (!showAssignForm || !currentLead) {
    return null;
  }

  // Reset the hidden flag when form is showing

  // ✅ OPTIMIZED: Log only essential info, not every render
  window.log.debug("Rendering assign form for lead:", currentLead.name);
  window.log.debug("Available users:", users.length);

  // ✅ FIXED: Get team members with CORRECT role filtering and status check
  const teamMembers = (formData.assigned_team === 'supply' || formData.assigned_team === 'Supply')
    ? users.filter(u => 
        ['supply_manager', 'supply_sales_service_manager'].includes(u.role) && 
        u.status === 'active'
      ) 
    : users.filter(u => 
        ['sales_executive', 'sales_manager'].includes(u.role) && 
        u.status === 'active'
      );

  window.log.debug("Team members for", formData.assigned_team || 'sales', "team:", teamMembers.length);
  
  // ✅ DEBUG: Log available users and their roles for troubleshooting (only in debug mode)
  window.log.debug("All users breakdown:", users.map(user => ({
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status
  })));
  
  window.log.debug("Filtered team members:", teamMembers.map(user => ({
    name: user.name,
    email: user.email,
    role: user.role
  })));

  // ✅ FIXED: Extract required functions from window
  const handleInputChange = window.handleFormDataChange || window.handleInputChange || ((field, value) => {
    window.log.debug("Input changed:", field, "=", value);
    if (window.setFormData) {
      window.setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  });

  const handleAssignLead = window.handleAssignLead || ((e) => {
    window.log.debug("Assign lead form submitted");
    e.preventDefault();
    console.warn("⚠️ handleAssignLead function not implemented");
  });

  const closeForm = window.closeForm || (() => {
    window.log.debug("Closing assign form");
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
        window.log.debug("Clicked outside, closing form");
        closeForm();
      }
    }
  },
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md' },
      React.createElement('div', { className: 'flex justify-between items-center mb-6' },
        React.createElement('h2', { className: 'text-xl font-bold text-gray-900 dark:text-white' }, 
          `Assign Lead: ${currentLead.name}`
        ),
        React.createElement('button', {
          onClick: closeForm,
          className: 'text-gray-400 hover:text-gray-600 text-2xl'
        }, '✕')
      ),

      React.createElement('form', { onSubmit: handleAssignLead },
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' }, 
            'Assign to Team'
          ),
          React.createElement('select', {
            value: formData.assigned_team || 'sales',
            onChange: (e) => {
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

        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' }, 
            'Assign to Person'
          ),
          React.createElement('select', {
            value: formData.assigned_to || '',
            onChange: (e) => handleInputChange('assigned_to', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
            required: true
          },
            React.createElement('option', { value: '' }, 'Select Person'),
            teamMembers.map(user => 
              React.createElement('option', { key: user.id, value: user.email }, user.name)
            )
          )
        ),

        // ✅ ADDED: Show helpful message when no team members are available
        teamMembers.length === 0 && React.createElement('div', { 
          className: 'mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md' 
        },
          React.createElement('p', { className: 'text-sm text-yellow-800' },
            `No active users found for ${formData.assigned_team || 'sales'} team. Please check user roles and status.`
          )
        ),

        React.createElement('div', { className: 'mb-6' },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' }, 
            'Assignment Notes'
          ),
          React.createElement('textarea', {
            value: formData.assignment_notes || '',
            onChange: (e) => handleInputChange('assignment_notes', e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
            rows: 3,
            placeholder: 'Add any notes for the assignment...'
          })
        ),

        React.createElement('div', { className: 'flex space-x-4' },
          React.createElement('button', {
            type: 'button',
            onClick: closeForm,
            className: 'flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-300'
          }, 'Cancel'),
          React.createElement('button', {
            type: 'submit',
            disabled: loading || !formData.assigned_to || teamMembers.length === 0,
            className: 'flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium'
          }, loading ? 'Assigning...' : 'Assign Lead')
        )
      )
    )
  );
};

// ✅ OPTIMIZED ASSIGNMENT HANDLER
window.handleAssignLead = async function(e) {
  e.preventDefault();

  // Only log essential debug info
  window.log.debug('Assignment starting:', {
    leadId: window.currentLead?.id,
    assignedTo: window.formData?.assigned_to,
    team: window.formData?.assigned_team
  });

  if (!window.hasPermission('leads', 'assign')) {
    alert('You do not have permission to assign leads');
    return;
  }

  window.setLoading(true);

  try {
    const response = await window.apiCall(`/leads/${window.currentLead.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        assigned_to: window.formData.assigned_to,
        assigned_team: window.formData.assigned_team,
        assignment_notes: window.formData.assignment_notes,
        status: 'assigned'
      })
    });

    if (response.error) {
      throw new Error(response.error);
    }

    // Update local state
    window.setLeads(prev => prev.map(lead => 
      lead.id === window.currentLead.id 
        ? { ...lead, assigned_to: window.formData.assigned_to, status: 'assigned' }
        : lead
    ));

    alert('Lead assigned successfully!');

    // Close form
    window.setShowAssignForm(false);
    window.setCurrentLead(null);
    window.setFormData({});

  } catch (error) {
    console.error('Assignment error:', error);
    alert('Error: ' + error.message);
  } finally {
    window.setLoading(false);
  }
};

// Log component loaded (only once)
window.log.success('Assign Form Component loaded');
