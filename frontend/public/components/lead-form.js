// Lead Form Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

window.renderForm = () => {
  // Extract needed variables from window for local scope
  const { showClientSuggestion, clientSuggestion, formData, currentLead, phoneCheckLoading, loading, handleFormSubmit, setClientSuggestion, setFormData, setPhoneCheckTimeout, setSelectedClient, inventory, users, events, phoneCheckTimeout, checkPhoneForClient } = {
    showClientSuggestion: window.showClientSuggestion,
    clientSuggestion: window.clientSuggestion,
    formData: window.formData,
    currentLead: window.currentLead,
    phoneCheckLoading: window.phoneCheckLoading,
    loading: window.loading,
    handleFormSubmit: window.handleFormSubmit,
    setClientSuggestion: window.setClientSuggestion,
    setFormData: window.setFormData,
    setPhoneCheckTimeout: window.setPhoneCheckTimeout,
    setSelectedClient: window.setSelectedClient,
    inventory: window.inventory,
    users: window.users || window.appState?.users || [],
    events: window.events
    ,phoneCheckTimeout: window.phoneCheckTimeout
    ,checkPhoneForClient: window.checkPhoneForClient
  };
  if (!window.appState.showAddForm && !window.appState.showEditForm) return null;

  const isEdit = window.appState.showEditForm;
  const title = isEdit ? 'Edit Lead' : 'Create New Lead';

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',
    onClick: (e) => {
      if (e.target === e.currentTarget) {
        closeForm();
      }
    }
  },
    React.createElement('div', {
      className: 'bg-white rounded-lg w-full max-w-4xl max-h-[95vh] overflow-hidden',
      onClick: (e) => e.stopPropagation()
    },
      // Header
      React.createElement('div', { className: 'bg-blue-600 text-white p-6' },
        React.createElement('div', { className: 'flex justify-between items-center' },
          React.createElement('h2', { className: 'text-2xl font-bold' }, title),
          React.createElement('button', {
            onClick: closeForm,
            className: 'text-white hover:text-gray-200 text-2xl font-bold'
          }, '×')
        )
      ),

      // Form Content
      React.createElement('div', { className: 'p-6 overflow-y-auto max-h-[calc(95vh-140px)]' },

        // Client Detection Alert (New Feature)
        showClientSuggestion && clientSuggestion && React.createElement('div', { 
          className: 'mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg'
        },
          React.createElement('div', { className: 'flex items-start' },
            React.createElement('div', { className: 'flex-shrink-0' },
              React.createElement('span', { className: 'text-2xl' }, '⚠️')
            ),
            React.createElement('div', { className: 'ml-3 flex-1' },
              React.createElement('h3', { className: 'text-lg font-medium text-yellow-800 mb-2' }, 
                '🔍 Existing Client Detected!'
              ),
              React.createElement('div', { className: 'text-sm text-yellow-700 mb-3' },
                React.createElement('p', { className: 'mb-2' }, 
                  `This phone number belongs to an existing client with ${clientSuggestion.client_history.length} previous lead(s).`
                ),
                React.createElement('p', { className: 'font-medium' }, 
                  clientSuggestion.suggested_reason
                )
              ),

              // Client History Preview
              React.createElement('div', { className: 'bg-white rounded-lg p-3 mb-3 border border-yellow-200' },
                React.createElement('h4', { className: 'font-medium text-gray-900 mb-2' }, 
                  '📋 Previous Leads:'
                ),
                React.createElement('div', { className: 'space-y-2' },
                  clientSuggestion.client_history.slice(0, 2).map((lead, index) =>
                    React.createElement('div', { 
                      key: index, 
                      className: 'flex justify-between text-sm border-b border-gray-100 pb-1'
                    },
                      React.createElement('span', null, 
                        `${lead.lead_for_event || 'General'} - ${lead.status}`
                      ),
                      React.createElement('span', { className: 'text-gray-500' }, 
                        new Date(lead.date_of_enquiry || lead.created_date).toLocaleDateString()
                      )
                    )
                  ),
                  clientSuggestion.client_history.length > 2 && 
                    React.createElement('div', { className: 'text-xs text-gray-500 italic' },
                      `+${clientSuggestion.client_history.length - 2} more leads`
                    )
                )
              ),

              // Events Interested
              clientSuggestion.events_interested && clientSuggestion.events_interested.length > 0 &&
                React.createElement('div', { className: 'mb-3' },
                  React.createElement('span', { className: 'text-sm font-medium text-yellow-800' }, 
                    '🎫 Previously interested in: '
                  ),
                  React.createElement('span', { className: 'text-sm text-yellow-700' }, 
                    clientSuggestion.events_interested.join(', ')
                  )
                ),

              // Action Buttons
              React.createElement('div', { className: 'flex space-x-3' },
                React.createElement('button', {
                  onClick: applyClientSuggestion,
                  className: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium'
                }, '✓ Use Suggested Assignment'),
                React.createElement('button', {
                  onClick: () => setShowClientSuggestion(false),
                  className: 'bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium'
                }, 'Continue Anyway'),
React.createElement('button', {
  onClick: () => {
    console.log("👁️ View Client Details clicked");
    console.log("📞 Current phone:", formData.phone);
    
    // Hide the client suggestion banner first
    setShowClientSuggestion(false);
    
    // Fetch clients and then find the specific client
    fetchClients().then(() => {
      console.log("📊 Total clients available:", window.clients?.length || 0);
      
      // Use the enhanced client finder function
      const client = window.findClientByPhone(formData.phone);
      
      if (client) {
        console.log("✅ Found client, opening detail modal:", client);
        // Set the selected client using window function
        window.setSelectedClient(client);
        // Show the client detail modal using window function
        window.setShowClientDetail(true);
        // Close the lead form
        closeForm();
      } else {
        console.log("❌ Client not found, showing alert");
        // Show user-friendly message instead of silent failure
        alert(`No client details found for phone number ${formData.phone}.\n\nThis might be due to:\n• Data synchronization issue\n• Client data stored in different format\n\nYou can still create the lead normally.`);
        
        // Don't close the form, let user continue
        setShowClientSuggestion(true); // Show the suggestion back
      }
    }).catch(error => {
      console.error("❌ Error fetching clients:", error);
      alert("Error loading client details. Please try again later.");
      setShowClientSuggestion(true); // Show the suggestion back
    });
  },
  className: 'bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium'
}, '👁️ View Client Details')
              )
            )
          )
        ),

        // Phone Check Loading Indicator
        phoneCheckLoading && React.createElement('div', { 
          className: 'mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-center'
        },
          React.createElement('div', { className: 'flex items-center justify-center' },
            React.createElement('div', { className: 'animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2' }),
            React.createElement('span', { className: 'text-sm text-blue-700' }, 'Checking for existing client...')
          )
        ),

        // Complete Form Fields (All Your Original Fields + Smart Detection)
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },

          // Basic Information Section
          React.createElement('div', { className: 'space-y-4' },
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 border-b pb-2' }, 
              '👤 Basic Information'
            ),

            // Name Field
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Contact Name *'
              ),
              React.createElement('input', {
                type: 'text',
                value: formData.name || '',
                onChange: (e) => setFormData(prev => ({ ...prev, name: e.target.value })),
                className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                required: true,
                placeholder: 'Enter full name'
              })
            ),

            // Email Field
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Email *'
              ),
              React.createElement('input', {
                type: 'email',
                value: formData.email || '',
                onChange: (e) => setFormData(prev => ({ ...prev, email: e.target.value })),
                className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                required: true,
                placeholder: 'Enter email address'
              })
            ),

            // Phone Field with Smart Detection (Enhanced)
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Phone *',
                phoneCheckLoading && React.createElement('span', { className: 'ml-2 text-blue-600' }, '🔍')
              ),
              React.createElement('input', {
                type: 'tel',
                value: formData.phone || '',
                onChange: (e) => {
                  const value = e.target.value;
                  // Update form data immediately for responsive typing
                  setFormData(prev => ({ ...prev, phone: value }));

                  // Clear existing timeout
                  if (phoneCheckTimeout) {
                    clearTimeout(phoneCheckTimeout);
                  }

                  // Only check for clients if phone has enough digits
                  if (value && value.length >= 10) {
                    // Set new timeout for phone check (debounce)
                    const newTimeout = setTimeout(() => {
                      checkPhoneForClient(value);
                    }, 1000); // Check after 1 second of no typing

                    setPhoneCheckTimeout(newTimeout);
                  } else {
                    // Clear suggestions if phone is too short
                    setClientSuggestion(null);
                    setShowClientSuggestion(false);
                  }
                },
                className: `w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  showClientSuggestion ? 'border-yellow-400 bg-yellow-50' : ''
                }`,
                required: true,
                placeholder: 'Enter phone number'
              }),
              React.createElement('div', { className: 'text-xs text-gray-500 mt-1' }, 
                'Phone numbers help detect existing clients and suggest smart assignments'
              )
            ),

            // Company Field
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Company'
              ),
              React.createElement('input', {
                type: 'text',
                value: formData.company || '',
                onChange: (e) => setFormData(prev => ({ ...prev, company: e.target.value })),
                className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                placeholder: 'Enter company name'
              })
            ),

            // Business Type
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Business Type *'
              ),
              React.createElement('select', {
                value: formData.business_type || 'B2C',
                onChange: (e) => setFormData(prev => ({ ...prev, business_type: e.target.value })),
                className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                required: true
              },
                React.createElement('option', { value: 'B2C' }, 'B2C (Business to Consumer)'),
                React.createElement('option', { value: 'B2B' }, 'B2B (Business to Business)')
              )
            )
          ),

          // Source & Initial Contact Section
          React.createElement('div', { className: 'space-y-4' },
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 border-b pb-2' }, 
              '📱 Source & Initial Contact'
            ),

            // Source Field - Extended Options
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Source of Lead *'
              ),
              React.createElement('select', {
                value: formData.source || '',
                onChange: (e) => setFormData(prev => ({ ...prev, source: e.target.value })),
                className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                required: true
              },
                React.createElement('option', { value: '' }, 'Select source'),
                ['Facebook', 'Instagram', 'LinkedIn', 'Friends and Family', 'Through Champion', 
                'Website', 'Existing Client', 'Contacted on Social Media', 'Middlemen', 
                'Wealth Management Firm', 'Media Agency', 'Concierge Desk', 
                'Travel Partner', 'Travel OTA', 'WhatsApp', 'Email Campaign', 'Cold Call', 'Exhibition', 'Other'].map(source =>
                  React.createElement('option', { key: source, value: source }, source)
                )
              )
            ),

            // Date of Enquiry
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Date of Enquiry *'
              ),
              React.createElement('input', {
                type: 'date',
                value: formData.date_of_enquiry || '',
                onChange: (e) => setFormData(prev => ({ ...prev, date_of_enquiry: e.target.value })),
                className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                required: true
              })
            ),

            // First Touch Base Done By
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'First Touch Base Done By'
              ),
              React.createElement('input', {
                type: 'text',
                value: formData.first_touch_base_done_by || '',
                onChange: (e) => setFormData(prev => ({ ...prev, first_touch_base_done_by: e.target.value })),
                className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                placeholder: 'Who made first contact'
              })
            ),

            // Assignment Field (Enhanced with Client Suggestion)
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Assign To',
                clientSuggestion && React.createElement('span', { className: 'ml-2 text-blue-600 text-xs' }, 
                  '(Suggested based on client history)'
                )
              ),
              React.createElement('select', {
                value: formData.assigned_to || '',
                onChange: (e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value })),
                className: `w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  clientSuggestion && formData.assigned_to === clientSuggestion.suggested_assigned_to ? 'bg-blue-50 border-blue-400' : ''
                }`
              },
                React.createElement('option', { value: '' }, 'Select sales person'),
users.filter(u => u.status === 'active')  // ✅ Changed from !== 'inactive' to === 'active'
                  .map(user =>
                    React.createElement('option', { 
                      key: user.email, 
                      value: user.email,
                      selected: clientSuggestion && user.email === clientSuggestion.suggested_assigned_to
                    }, user.name || user.email)
                  )
              ),
              clientSuggestion && formData.assigned_to === clientSuggestion.suggested_assigned_to &&
                React.createElement('div', { className: 'text-xs text-blue-600 mt-1' }, 
                  '✓ Smart suggestion applied - keeping client with same sales person'
                )
            )
          )
        ),

        // Location Information Section
        React.createElement('div', { className: 'mt-6' },
          React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 border-b pb-2 mb-4' }, 
            '📍 Location Information'
          ),
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'City of Residence'
              ),
              React.createElement('input', {
                type: 'text',
                value: formData.city_of_residence || '',
                onChange: (e) => setFormData(prev => ({ ...prev, city_of_residence: e.target.value })),
                className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                placeholder: 'Enter city'
              })
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Country of Residence'
              ),
              React.createElement('input', {
                type: 'text',
                value: formData.country_of_residence || 'India',
                onChange: (e) => setFormData(prev => ({ ...prev, country_of_residence: e.target.value })),
                className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              })
            )
          )
        ),

        // Event & Travel Details Section
        React.createElement('div', { className: 'mt-6' },
          React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 border-b pb-2 mb-4' }, 
            '🎫 Event & Travel Details'
          ),
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
            // Event Field
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Lead for Event'
              ),
              React.createElement('select', {
                value: formData.lead_for_event || '',
                onChange: (e) => setFormData(prev => ({ ...prev, lead_for_event: e.target.value })),
                className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              },
                React.createElement('option', { value: '' }, 'Select an event'),
                // Get events from inventory dynamically
                inventory && inventory.length > 0 ? 
                  Array.from(new Set(inventory.map(item => item.event_name).filter(Boolean))).sort().map(event =>
                    React.createElement('option', { key: event, value: event }, event)
                  ) :
                  // Fallback events if inventory not loaded
                  events && events.length > 0 ? events.map(event =>
                    React.createElement('option', { key: event, value: event }, event)
                  ) : [
                    React.createElement('option', { key: 'general', value: 'General Inquiry' }, 'General Inquiry'),
                    React.createElement('option', { key: 'cricket', value: 'Cricket Events' }, 'Cricket Events'),
                    React.createElement('option', { key: 'football', value: 'Football Events' }, 'Football Events'),
                    React.createElement('option', { key: 'tennis', value: 'Tennis Events' }, 'Tennis Events')
                  ]
              )
            ),

            // Number of People
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Number of People'
              ),
              React.createElement('input', {
                type: 'number',
                min: '1',
                value: formData.number_of_people || 1,
                onChange: (e) => setFormData(prev => ({ ...prev, number_of_people: parseInt(e.target.value) || 1 })),
                className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              })
            ),

            // Has Valid Passport
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Has Valid Passport'
              ),
              React.createElement('select', {
                value: formData.has_valid_passport || 'Not Sure',
                onChange: (e) => setFormData(prev => ({ ...prev, has_valid_passport: e.target.value })),
                className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              },
                React.createElement('option', { value: 'Yes' }, 'Yes'),
                React.createElement('option', { value: 'No' }, 'No'),
                React.createElement('option', { value: 'Not Sure' }, 'Not Sure')
              )
            ),

            // Visa Available
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Visa Available'
              ),
              React.createElement('select', {
                value: formData.visa_available || 'Not Required',
                onChange: (e) => setFormData(prev => ({ ...prev, visa_available: e.target.value })),
                className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              },
                React.createElement('option', { value: 'Required' }, 'Required'),
                React.createElement('option', { value: 'Not Required' }, 'Not Required'),
                React.createElement('option', { value: 'Processing' }, 'Processing'),
                React.createElement('option', { value: 'In Process' }, 'In Process'),
                React.createElement('option', { value: 'Not Sure' }, 'Not Sure')
              )
            )
          )
        ),

        // Experience & Background Section
        React.createElement('div', { className: 'mt-6' },
          React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 border-b pb-2 mb-4' }, 
            '🏆 Experience & Background'
          ),
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Attended Sporting Event Before'
              ),
              React.createElement('select', {
                value: formData.attended_sporting_event_before || 'No',
                onChange: (e) => setFormData(prev => ({ ...prev, attended_sporting_event_before: e.target.value })),
                className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              },
                React.createElement('option', { value: 'Yes' }, 'Yes'),
                React.createElement('option', { value: 'No' }, 'No')
              )
            )
          )
        ),

        // Business & Financial Information Section  
        React.createElement('div', { className: 'mt-6' },
          React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 border-b pb-2 mb-4' }, 
            '💰 Business & Financial Information'
          ),
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Annual Income Bracket'
              ),
              React.createElement('select', {
                value: formData.annual_income_bracket || '',
                onChange: (e) => setFormData(prev => ({ ...prev, annual_income_bracket: e.target.value })),
                className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              },
                React.createElement('option', { value: '' }, 'Select income bracket'),
                React.createElement('option', { value: '₹5-10 Lakhs' }, '₹5-10 Lakhs'),
                React.createElement('option', { value: '₹10-25 Lakhs' }, '₹10-25 Lakhs'),
                React.createElement('option', { value: '₹25-50 Lakhs' }, '₹25-50 Lakhs'),
                React.createElement('option', { value: '₹50 Lakhs - ₹1 Crore' }, '₹50 Lakhs - ₹1 Crore'),
                React.createElement('option', { value: '₹1-2 Crores' }, '₹1-2 Crores'),
                React.createElement('option', { value: '₹2-5 Crores' }, '₹2-5 Crores'),
                React.createElement('option', { value: 'Above ₹5 Crores' }, 'Above ₹5 Crores'),
                React.createElement('option', { value: 'Prefer not to say' }, 'Prefer not to say')
              )
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Potential Value (₹)'
              ),
              React.createElement('input', {
                type: 'number',
                min: '0',
                value: formData.potential_value || 0,
                onChange: (e) => setFormData(prev => ({ ...prev, potential_value: parseInt(e.target.value) || 0 })),
                className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                placeholder: 'Estimated deal value'
              })
            )
          )
        ),

        // Sales Information Section
        React.createElement('div', { className: 'mt-6' },
          React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 border-b pb-2 mb-4' }, 
            '💼 Sales Information'
          ),
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Status'
              ),
              React.createElement('select', {
                value: formData.status || 'unassigned',
                onChange: (e) => setFormData(prev => ({ ...prev, status: e.target.value })),
                className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              },
                // Initial Contact Statuses
                React.createElement('option', { value: 'unassigned' }, 'Unassigned'),
                React.createElement('option', { value: 'assigned' }, 'Assigned'),
                React.createElement('option', { value: 'contacted' }, 'Contacted'),
                React.createElement('option', { value: 'attempt_1' }, 'Attempt 1'),
                React.createElement('option', { value: 'attempt_2' }, 'Attempt 2'),
                React.createElement('option', { value: 'attempt_3' }, 'Attempt 3'),

                // Qualification Statuses
                React.createElement('option', { value: 'qualified' }, 'Qualified'),
                React.createElement('option', { value: 'junk' }, 'Junk'),

                // Temperature Statuses
                React.createElement('option', { value: 'hot' }, 'Hot'),
                React.createElement('option', { value: 'warm' }, 'Warm'),
                React.createElement('option', { value: 'cold' }, 'Cold'),

                // Sales Process Statuses
                React.createElement('option', { value: 'quote_requested' }, 'Quote Requested'),
                React.createElement('option', { value: 'converted' }, 'Converted'),
                React.createElement('option', { value: 'dropped' }, 'Dropped'),

                // Payment Statuses
                React.createElement('option', { value: 'payment' }, 'Payment'),
                React.createElement('option', { value: 'payment_post_service' }, 'Payment Post Service'),
                React.createElement('option', { value: 'payment_received' }, 'Payment Received')
              )
            ),
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                'Last Quoted Price (₹)'
              ),
              React.createElement('input', {
                type: 'number',
                min: '0',
                value: formData.last_quoted_price || 0,
                onChange: (e) => setFormData(prev => ({ ...prev, last_quoted_price: parseInt(e.target.value) || 0 })),
                className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                placeholder: 'Last quoted amount'
              })
            )
          )
        ),

        // Notes Section
        React.createElement('div', { className: 'mt-6' },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
            'Notes'
          ),
          React.createElement('textarea', {
            value: formData.notes || '',
            onChange: (e) => setFormData(prev => ({ ...prev, notes: e.target.value })),
            className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            rows: 3,
            placeholder: 'Add any additional notes or comments...'
          })
        )
      ),

      // Footer with Action Buttons
      React.createElement('div', { className: 'bg-gray-50 px-6 py-4 flex justify-between items-center border-t' },
        React.createElement('div', { className: 'text-sm text-gray-600' },
          showClientSuggestion ? 
            '⚠️ This phone number belongs to an existing client' :
            '✨ Smart client detection active'
        ),
        React.createElement('div', { className: 'flex space-x-3' },
          React.createElement('button', {
            onClick: closeForm,
            className: 'px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50'
          }, 'Cancel'),
          React.createElement('button', {
            onClick: handleFormSubmit,
            disabled: loading || !formData.name || !formData.email,
            className: 'px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
          }, loading ? 'Saving...' : (isEdit ? 'Update Lead' : 'Create Lead'))
        )
      )
    )
  );
};

console.log('✅ Lead Form component loaded successfully');
