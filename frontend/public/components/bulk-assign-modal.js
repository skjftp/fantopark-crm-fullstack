// Bulk Assign Modal Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

window.renderBulkAssignModal = () => {
  if (!showBulkAssignModal) return null;

  const unassignedLeads = leads.filter(lead => !lead.assigned_to || lead.assigned_to === '' || lead.status === 'unassigned');
  const salesUsers = users.filter(u => 
    ['sales_executive', 'sales_manager', 'supply_executive', 'supply_sales_service_manager'].includes(u.role) && 
    u.status === 'active'
  );

  const handleCheckboxChange = (leadId, userEmail, isChecked) => {
    setBulkAssignSelections(prev => {
      const newSelections = { ...prev };
      if (isChecked) {
        newSelections[leadId] = userEmail;
      } else {
        delete newSelections[leadId];
      }
      return newSelections;
    });
  };

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => e.target === e.currentTarget && setShowBulkAssignModal(false)
  },
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-7xl max-h-[90vh] overflow-hidden' },
      React.createElement('div', { className: 'flex justify-between items-center mb-6' },
        React.createElement('h2', { className: 'text-2xl font-bold text-gray-900' }, `Bulk Assign Leads (${unassignedLeads.length} unassigned)`),
        React.createElement('button', {
          onClick: () => setShowBulkAssignModal(false),
          className: 'text-gray-400 hover:text-gray-600 text-2xl'
        }, '✕')
      ),

      React.createElement('div', { className: 'overflow-auto max-h-96' },
        React.createElement('table', { className: 'w-full border-collapse' },
          React.createElement('thead', { className: 'bg-gray-50 sticky top-0' },
            React.createElement('tr', null,
              React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border' }, 'Lead Details'),
              React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border' }, 'Business Info'),
              ...salesUsers.map(user =>
                React.createElement('th', { 
                  key: user.email, 
                  className: 'px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase border min-w-24'
                }, user.name)
              )
            )
          ),
          React.createElement('tbody', null,
            unassignedLeads.map(lead =>
              React.createElement('tr', { key: lead.id, className: 'hover:bg-gray-50' },
                React.createElement('td', { className: 'px-4 py-3 border' },
                  React.createElement('div', { className: 'text-sm font-medium text-gray-900' }, lead.name),
                  React.createElement('div', { className: 'text-sm text-gray-500' }, lead.email),
                  React.createElement('div', { className: 'text-xs text-gray-400' }, lead.phone),
                  React.createElement('div', { className: 'text-xs text-blue-600' }, 
                    lead.date_of_enquiry ? new Date(lead.date_of_enquiry).toLocaleDateString() : ''
                  )
                ),
                React.createElement('td', { className: 'px-4 py-3 border' },
                  React.createElement('div', { className: 'text-sm text-gray-900' }, lead.company || 'N/A'),
                  React.createElement('div', { className: 'text-xs text-gray-500' }, lead.business_type || 'N/A'),
                  React.createElement('div', { className: 'text-xs text-gray-600' }, lead.lead_for_event || 'N/A'),
                  React.createElement('div', { className: 'text-xs text-green-600' }, 
                    lead.potential_value ? `₹${parseFloat(lead.potential_value).toLocaleString()}` : 'N/A'
                  )
                ),
                ...salesUsers.map(user =>
                  React.createElement('td', { 
                    key: `${lead.id}-${user.email}`, 
                    className: 'px-3 py-3 text-center border'
                  },
                    React.createElement('input', {
                      type: 'checkbox',
                      checked: bulkAssignSelections[lead.id] === user.email,
                      onChange: (e) => handleCheckboxChange(lead.id, user.email, e.target.checked),
                      className: 'w-4 h-4 text-blue-600 rounded focus:ring-blue-500'
                    })
                  )
                )
              )
            )
          )
        )
      ),

      React.createElement('div', { className: 'flex justify-between items-center mt-6 pt-4 border-t' },
        React.createElement('div', { className: 'text-sm text-gray-600' },
          `${Object.keys(bulkAssignSelections).length} leads selected for assignment`
        ),
        React.createElement('div', { className: 'flex space-x-4' },
          React.createElement('button', {
            onClick: () => setShowBulkAssignModal(false),
            className: 'px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50'
          }, 'Cancel'),
          React.createElement('button', {
            onClick: handleBulkAssignSubmit,
            disabled: bulkAssignLoading || Object.keys(bulkAssignSelections).length === 0,
            className: 'px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50'
          }, bulkAssignLoading ? 'Assigning...' : `Assign ${Object.keys(bulkAssignSelections).length} Leads`)
        )
      )
    )
  );
};

console.log('✅ Bulk Assign Modal component loaded successfully');
