// Client Detail Modal Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

window.renderClientDetailModal = () => {
  if (!showClientDetail || !selectedClient) return null;

  const primaryLead = selectedClient.leads[0];
  const sortedLeads = selectedClient.leads.sort((a, b) => 
    new Date(a.date_of_enquiry || a.created_date) - new Date(b.date_of_enquiry || b.created_date)
  );

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50',
    onClick: (e) => {
      if (e.target === e.currentTarget) {
        setShowClientDetail(false);
        setSelectedClient(null);
      }
    }
  },
    React.createElement('div', {
      className: 'bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden',
      onClick: (e) => e.stopPropagation()
    },
      // Modal Header
      React.createElement('div', { className: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6' },
        React.createElement('div', { className: 'flex justify-between items-start' },
          React.createElement('div', null,
            React.createElement('h2', { className: 'text-2xl font-bold mb-2' }, 
              '👥 Client Profile: ' + primaryLead.name
            ),
            React.createElement('div', { className: 'flex flex-wrap gap-4 text-blue-100' },
              React.createElement('span', null, '📞 ' + primaryLead.phone),
              React.createElement('span', null, '📧 ' + primaryLead.email),
              React.createElement('span', null, '🏢 ' + (primaryLead.company || 'No Company')),
              React.createElement('span', null, '📍 ' + (primaryLead.city_of_residence || 'Unknown') + ', ' + (primaryLead.country_of_residence || 'Unknown'))
            )
          ),
          React.createElement('button', {
            onClick: () => {
              setShowClientDetail(false);
              setSelectedClient(null);
            },
            className: 'text-white hover:text-gray-200 text-2xl font-bold'
          }, '×')
        )
      ),

      // Modal Content
      React.createElement('div', { className: 'p-6 overflow-y-auto max-h-[calc(90vh-140px)]' },

        // Client Summary Cards
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-4 mb-6' },
          React.createElement('div', { className: 'bg-blue-50 border border-blue-200 rounded-lg p-4 text-center' },
            React.createElement('div', { className: 'text-2xl font-bold text-blue-900' }, selectedClient.total_leads),
            React.createElement('div', { className: 'text-sm text-blue-700' }, 'Total Leads'),
            React.createElement('div', { className: 'text-xs text-blue-600 mt-1' }, 
              selectedClient.total_leads > 1 ? 'Multi-lead client' : 'Single lead client'
            )
          ),
          React.createElement('div', { className: 'bg-green-50 border border-green-200 rounded-lg p-4 text-center' },
            React.createElement('div', { className: 'text-2xl font-bold text-green-900' }, 
              selectedClient.events.length
            ),
            React.createElement('div', { className: 'text-sm text-green-700' }, 'Events Interested'),
            React.createElement('div', { className: 'text-xs text-green-600 mt-1' }, 
              selectedClient.events.slice(0, 2).join(', ') || 'None specified'
            )
          ),
          React.createElement('div', { className: 'bg-purple-50 border border-purple-200 rounded-lg p-4 text-center' },
            React.createElement('div', { className: 'text-2xl font-bold text-purple-900' }, 
              '₹' + (selectedClient.total_value || 0).toLocaleString()
            ),
            React.createElement('div', { className: 'text-sm text-purple-700' }, 'Total Value'),
            React.createElement('div', { className: 'text-xs text-purple-600 mt-1' }, 
              'Across all leads'
            )
          ),
          React.createElement('div', { className: 'bg-orange-50 border border-orange-200 rounded-lg p-4 text-center' },
            React.createElement('div', { className: 'text-2xl font-bold text-orange-900' }, 
              Math.ceil((new Date() - new Date(selectedClient.first_contact)) / (1000 * 60 * 60 * 24))
            ),
            React.createElement('div', { className: 'text-sm text-orange-700' }, 'Days as Client'),
            React.createElement('div', { className: 'text-xs text-orange-600 mt-1' }, 
              'Since first contact'
            )
          )
        ),

        // Client Relationship Info
        React.createElement('div', { className: 'bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6' },
          React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-3 flex items-center' },
            React.createElement('span', { className: 'mr-2' }, '🔗'),
            'Client Relationship Summary'
          ),
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-4' },
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700' }, 'Assigned To'),
              React.createElement('div', { className: 'mt-1 text-sm text-gray-900' }, 
                selectedClient.assigned_to ? window.getUserDisplayName(selectedClient.assigned_to, users) : 'Unassigned'
              )
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700' }, 'Client Status'),
              React.createElement('span', { 
                className: `inline-flex mt-1 px-2 py-1 text-xs rounded-full ${
                  selectedClient.status === 'converted' ? 'bg-green-100 text-green-800' :
                  selectedClient.status === 'dropped' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`
              }, selectedClient.status || 'Active')
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700' }, 'Last Activity'),
              React.createElement('div', { className: 'mt-1 text-sm text-gray-900' }, 
                new Date(selectedClient.last_activity).toLocaleDateString()
              )
            )
          )
        ),

        // Lead Timeline Section
        React.createElement('div', { className: 'mb-6' },
          React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-4 flex items-center' },
            React.createElement('span', { className: 'mr-2' }, '📋'),
            'Complete Lead Timeline (' + sortedLeads.length + ' leads)'
          ),

          // Timeline Container
          React.createElement('div', { className: 'space-y-4' },
            sortedLeads.map((lead, index) => {
              const status = window.LEAD_STATUSES[lead.status] || { label: lead.status, color: 'bg-gray-100 text-gray-800' };
              const isLatest = index === sortedLeads.length - 1;

              return React.createElement('div', { 
                key: lead.id, 
                className: `relative ${isLatest ? 'ring-2 ring-blue-200' : ''} bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow`
              },
                // Timeline Connector (except for last item)
                index < sortedLeads.length - 1 && React.createElement('div', {
                  className: 'absolute left-8 -bottom-4 w-0.5 h-8 bg-gray-300'
                }),

                // Lead Content
                React.createElement('div', { className: 'flex items-start space-x-4' },
                  // Timeline Dot
                  React.createElement('div', { 
                    className: `flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      isLatest ? 'bg-blue-600' : 'bg-gray-400'
                    }`
                  }, index + 1),

                  // Lead Details
                  React.createElement('div', { className: 'flex-grow' },
                    React.createElement('div', { className: 'flex justify-between items-start mb-2' },
                      React.createElement('div', null,
                        React.createElement('h4', { 
                          className: `font-medium text-gray-900 ${isLatest ? 'text-blue-900' : ''}`
                        }, 
                          'Lead #' + (index + 1) + (isLatest ? ' (Latest)' : ''),
                          lead.lead_for_event && React.createElement('span', { className: 'ml-2 text-sm text-gray-600' }, 
                            '→ ' + lead.lead_for_event
                          )
                        ),
                        React.createElement('div', { className: 'text-sm text-gray-600 mt-1' },
                          'Created: ' + new Date(lead.date_of_enquiry || lead.created_date).toLocaleDateString(),
                          lead.updated_date && lead.updated_date !== lead.created_date && 
                          React.createElement('span', { className: 'ml-3' }, 
                            'Updated: ' + new Date(lead.updated_date).toLocaleDateString()
                          )
                        )
                      ),
                      React.createElement('div', { className: 'flex items-center space-x-2' },
                        React.createElement('span', {
                          className: 'px-2 py-1 text-xs rounded-full ' + status.color
                        }, status.label),
                        isLatest && React.createElement('span', {
                          className: 'px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800'
                        }, 'Current')
                      )
                    ),

                    // Lead Details Grid
                    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-4 mt-3' },
                      React.createElement('div', null,
                        React.createElement('label', { className: 'block text-xs font-medium text-gray-500' }, 'Event & People'),
                        React.createElement('div', { className: 'text-sm text-gray-900' }, 
                          (lead.lead_for_event || 'Not specified'),
                          lead.number_of_people && React.createElement('span', { className: 'text-gray-600 ml-2' }, 
                            '(' + lead.number_of_people + ' people)'
                          )
                        )
                      ),
                      React.createElement('div', null,
                        React.createElement('label', { className: 'block text-xs font-medium text-gray-500' }, 'Source & Type'),
                        React.createElement('div', { className: 'text-sm text-gray-900' }, 
                          (lead.source || 'Unknown') + ' • ' + (lead.business_type || 'B2C')
                        )
                      ),
                      React.createElement('div', null,
                        React.createElement('label', { className: 'block text-xs font-medium text-gray-500' }, 'Value'),
                        React.createElement('div', { className: 'text-sm text-gray-900' }, 
                          lead.potential_value ? '₹' + lead.potential_value.toLocaleString() : 'Not specified',
                          lead.last_quoted_price && React.createElement('div', { className: 'text-xs text-green-600' }, 
                            'Quoted: ₹' + lead.last_quoted_price.toLocaleString()
                          )
                        )
                      )
                    ),

                    // Notes Section (if exists)
                    lead.notes && React.createElement('div', { className: 'mt-3 p-3 bg-gray-50 rounded-md' },
                      React.createElement('label', { className: 'block text-xs font-medium text-gray-500 mb-1' }, 'Notes'),
                      React.createElement('div', { className: 'text-sm text-gray-700' }, lead.notes)
                    ),

                    // Action Buttons for this lead
                    React.createElement('div', { className: 'mt-3 flex space-x-2' },
                      React.createElement('button', {
                        onClick: () => {
                          setShowClientDetail(false);
                          setSelectedClient(null);
                          openLeadDetail(lead);
                        },
                        className: 'text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded border'
                      }, '👁️ View Details'),
                      window.hasPermission('leads', 'write') && React.createElement('button', {
                        onClick: () => {
                          setShowClientDetail(false);
                          setSelectedClient(null);
                          openEditForm(lead);
                        },
                        className: 'text-xs text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-2 py-1 rounded border'
                      }, '✏️ Edit Lead'),
                      window.hasPermission('leads', 'progress') && React.createElement('button', {
                        onClick: () => {
                          setShowClientDetail(false);
                          setSelectedClient(null);
                          if (lead.status === 'unassigned' && !lead.assigned_to) {
                            openAssignForm(lead);
                          } else {
                            handleLeadProgression(lead);
                          }
                        },
                        className: 'text-xs text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded border'
                      }, '→ Progress')
                    )
                  )
                )
              );
            })
          )
        ),

        // Client Actions Section
        React.createElement('div', { className: 'bg-gray-50 border border-gray-200 rounded-lg p-4' },
          React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-3 flex items-center' },
            React.createElement('span', { className: 'mr-2' }, '⚡'),
            'Client Actions'
          ),
          React.createElement('div', { className: 'flex flex-wrap gap-3' },
            window.hasPermission('leads', 'write') && React.createElement('button', {
              onClick: () => {
                setShowClientDetail(false);
                setSelectedClient(null);
                // Pre-fill lead form with client data
                setFormData({
                  name: primaryLead.name,
                  email: primaryLead.email,
                  phone: primaryLead.phone,
                  company: primaryLead.company || '',
                  business_type: primaryLead.business_type || 'B2C',
                  source: '',
                  date_of_enquiry: (() => {
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const day = String(now.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                  })(),
                  first_touch_base_done_by: '',
                  city_of_residence: primaryLead.city_of_residence || '',
                  country_of_residence: primaryLead.country_of_residence || 'India',
                  lead_for_event: '',
                  number_of_people: 1,
                  has_valid_passport: primaryLead.has_valid_passport || 'Not Sure',
                  visa_available: primaryLead.visa_available || 'Not Required',
                  attended_sporting_event_before: primaryLead.attended_sporting_event_before || 'No',
                  annual_income_bracket: primaryLead.annual_income_bracket || '',
                  potential_value: 0,
                  status: 'unassigned',
                  assigned_to: selectedClient.assigned_to || '',
                  last_quoted_price: 0,
                  notes: ''
                });
                setShowLeadForm(true);
              },
              className: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2'
            }, 
              React.createElement('span', null, '+'),
              'Add New Lead for this Client'
            ),
            window.hasPermission('leads', 'assign') && selectedClient.total_leads > 1 && React.createElement('button', {
              onClick: () => {
                // Bulk reassign functionality - placeholder for now
                if (confirm(`Reassign all ${selectedClient.total_leads} leads for this client to a new sales person?`)) {
                  alert(`Bulk reassign for ${selectedClient.total_leads} leads coming in next update!`);
                }
              },
              className: 'bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2'
            }, 
              React.createElement('span', null, '👥'),
              'Bulk Reassign All Leads'
            ),
            React.createElement('button', {
              onClick: () => setViewMode('leads'),
              className: 'bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2'
            }, 
              React.createElement('span', null, '📋'),
              'Switch to Lead View'
            ),
            React.createElement('button', {
              onClick: () => {
                setShowClientDetail(false);
                setSelectedClient(null);
              },
              className: 'bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-medium'
            }, 'Close')
          )
        )
      )
    )
  );
};

console.log('✅ Client Detail Modal component loaded successfully');
