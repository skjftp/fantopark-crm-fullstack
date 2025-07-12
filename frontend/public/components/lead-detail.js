// Lead Detail Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

// ===== QUOTE SECTION COMPONENT =====
const QuoteSection = () => {
  const lead = window.appState.currentLead;
  
  // Only show if lead has been through quote process
  if (!lead.quote_uploaded_date && !lead.quote_notes && !lead.quote_pdf_filename && lead.status !== 'quote_requested' && lead.status !== 'quote_received') {
    return null;
  }

  return React.createElement('div', { className: 'mt-6 bg-white rounded-lg border p-4' },
    React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-4 flex items-center' },
      React.createElement('span', { className: 'mr-2' }, '📄'),
      'Quote Information'
    ),
    
    React.createElement('div', { className: 'space-y-4' },
      
      // Quote Status
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
        React.createElement('div', null,
          React.createElement('span', { className: 'font-medium text-gray-700' }, 'Quote Status: '),
          React.createElement('span', { 
            className: `px-2 py-1 rounded text-sm ${
              lead.status === 'quote_requested' ? 'bg-yellow-100 text-yellow-800' :
              lead.status === 'quote_received' ? 'bg-green-100 text-green-800' : 
              'bg-gray-100 text-gray-800'
            }`
          }, 
            lead.status === 'quote_requested' ? '⏳ Quote Requested' :
            lead.status === 'quote_received' ? '✅ Quote Received' :
            'No Quote Process'
          )
        ),
        
        // Quote Assignment Info
        lead.status === 'quote_requested' && lead.assigned_team === 'supply' && React.createElement('div', null,
          React.createElement('span', { className: 'font-medium text-gray-700' }, 'Assigned to: '),
          React.createElement('span', { className: 'text-blue-600' }, 
            window.getUserDisplayName(lead.assigned_to, window.users) + ' (Supply Team)'
          )
        )
      ),
      
      // Original Assignment Info (when restored)
      lead.original_assignee && lead.status === 'quote_received' && React.createElement('div', { className: 'bg-blue-50 border border-blue-200 rounded-md p-3' },
        React.createElement('div', { className: 'flex items-start' },
          React.createElement('div', { className: 'flex-shrink-0' },
            React.createElement('span', { className: 'text-blue-500 text-sm' }, '🔄')
          ),
          React.createElement('div', { className: 'ml-2' },
            React.createElement('p', { className: 'text-sm text-blue-800' },
              `Lead has been reassigned back to: ${window.getUserDisplayName(lead.original_assignee, window.users)}`
            )
          )
        )
      ),
      
      // Quote Upload Information
      (lead.quote_uploaded_date || lead.quote_notes || lead.quote_pdf_filename) && React.createElement('div', { className: 'border-t pt-4' },
        React.createElement('h4', { className: 'font-medium text-gray-900 mb-3' }, 'Quote Details'),
        
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
          
          // Upload Date
          lead.quote_uploaded_date && React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700' }, 'Processed Date: '),
            React.createElement('span', { className: 'text-gray-900' }, 
              new Date(lead.quote_uploaded_date).toLocaleDateString() + ' ' + 
              new Date(lead.quote_uploaded_date).toLocaleTimeString()
            )
          ),
          
          // File Information
          lead.quote_pdf_filename && React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700' }, 'Quote File: '),
            React.createElement('div', { className: 'flex items-center mt-1' },
              React.createElement('span', { className: 'mr-2' }, '📄'),
              React.createElement('span', { className: 'text-blue-600 text-sm' }, lead.quote_pdf_filename),
              lead.quote_file_size && React.createElement('span', { className: 'text-gray-500 text-xs ml-2' },
                `(${(lead.quote_file_size / 1024).toFixed(1)} KB)`
              )
            )
          )
        ),
        
        // Quote Notes
        lead.quote_notes && React.createElement('div', { className: 'mt-4' },
          React.createElement('span', { className: 'font-medium text-gray-700' }, 'Quote Notes: '),
          React.createElement('div', { className: 'mt-2 p-3 bg-gray-50 rounded-md border' },
            React.createElement('p', { className: 'text-sm text-gray-800 whitespace-pre-wrap' }, lead.quote_notes)
          )
        )
      )
    )
  );
};

window.renderLeadDetail = () => {
  if (!window.appState.showLeadDetail || !window.appState.currentLead) return null;

  const status = window.LEAD_STATUSES[window.appState.currentLead.status] || { label: window.appState.currentLead.status, color: 'bg-gray-100 text-gray-800', next: [] };
  const nextActions = status.next || [];

  return React.createElement('div', { 
    onClick: (e) => e.target === e.currentTarget && closeForm()
  },
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[95vh] overflow-y-auto' },
      React.createElement('div', { className: 'sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center' },
        React.createElement('div', null,
          React.createElement('h2', { className: 'text-2xl font-bold text-gray-900' }, window.appState.currentLead.name),
          React.createElement('div', { className: 'flex items-center mt-2 space-x-4' },
            React.createElement('span', {
              className: 'px-3 py-1 text-sm rounded-full ' + (status.color)
            }, status.label),
            window.appState.currentLead.assigned_to && React.createElement('span', { className: 'text-sm text-blue-600' }, 
              'Assigned to: ' + window.getUserDisplayName(window.appState.currentLead.assigned_to, window.appState.users)
            ),
            // Show auto-assignment info if available
            window.appState.currentLead.auto_assigned && React.createElement('span', { className: 'text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded' }, 
              '🤖 Auto-assigned'
            )
          )
        ),
        React.createElement('button', {
          onClick: closeForm,
          className: 'text-gray-400 hover:text-gray-600 text-2xl'
        }, '✕')
      ),

      React.createElement('div', { className: 'p-6' },
        React.createElement('div', { className: 'mb-6 flex flex-wrap gap-2' },
          window.hasPermission('leads', 'write') && React.createElement('button', { 
            className: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700',
            onClick: () => {
              closeForm();
              setTimeout(() => openEditForm(window.appState.currentLead), 100);
            }
          }, '✏️ Edit Lead'),
          window.hasPermission('leads', 'assign') && !window.appState.currentLead.assigned_to && window.appState.currentLead.status === 'unassigned' &&
            React.createElement('button', { 
              className: 'bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700',
              onClick: () => {
                closeForm();
                setTimeout(() => openAssignForm(window.appState.currentLead), 100);
              }
            }, '👤 Assign'),
          window.hasPermission('leads', 'progress') && nextActions.length > 0 && React.createElement('button', {
            className: 'bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700',
            onClick: () => {
              handleLeadProgression(window.appState.currentLead);
            }
          }, '→ Progress Lead'),
          window.hasPermission('leads', 'write') && window.appState.currentLead.status === 'converted' &&
            React.createElement('button', { 
              className: 'bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700',
              onClick: () => {
                closeForm();
                setTimeout(() => openPaymentForm(window.appState.currentLead), 100);
              }
            }, '💳 Collect Payment')
        ),

        // Auto-assignment details section (NEW)
        window.appState.currentLead.auto_assigned && React.createElement('div', { className: 'mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4' },
          React.createElement('h3', { className: 'text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2' },
            React.createElement('span', null, '🤖'),
            'Auto-Assignment Details'
          ),
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4 text-sm' },
            React.createElement('div', null,
              React.createElement('span', { className: 'font-medium text-purple-700' }, 'Rule Used: '),
              React.createElement('span', { className: 'text-purple-900' }, window.appState.currentLead.assignment_rule_used || 'N/A')
            ),
            React.createElement('div', null,
              React.createElement('span', { className: 'font-medium text-purple-700' }, 'Reason: '),
              React.createElement('span', { className: 'text-purple-900' }, window.appState.currentLead.assignment_reason || 'N/A')
            ),
            React.createElement('div', null,
              React.createElement('span', { className: 'font-medium text-purple-700' }, 'Assigned To: '),
              React.createElement('span', { className: 'text-purple-900' }, window.getUserDisplayName(window.appState.currentLead.assigned_to, window.appState.users) || window.appState.currentLead.assigned_to)
            ),
            window.appState.currentLead.assignment_date && React.createElement('div', null,
              React.createElement('span', { className: 'font-medium text-purple-700' }, 'Assignment Date: '),
              React.createElement('span', { className: 'text-purple-900' }, 
                new Date(window.appState.currentLead.assignment_date).toLocaleDateString()
              )
            )
          )
        ),

        React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6' },
          React.createElement('div', { className: 'bg-gray-50 rounded-lg p-4' },
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-3' }, '📞 Contact Information'),
            React.createElement('div', { className: 'space-y-2' },
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Name: '),
                React.createElement('span', { className: 'text-gray-900' }, window.appState.currentLead.name)
              ),
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Email: '),
                React.createElement('a', { 
                  href: 'mailto:' + (window.appState.currentLead.email),
                  className: 'text-blue-600 hover:underline' 
                }, window.appState.currentLead.email)
              ),
              window.appState.currentLead.phone && React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Phone: '),
                React.createElement('a', { 
                  href: 'tel:' + (window.appState.currentLead.phone),
                  className: 'text-blue-600 hover:underline' 
                }, window.appState.currentLead.phone)
              ),
              window.appState.currentLead.company && React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Company: '),
                React.createElement('span', { className: 'text-gray-900' }, window.appState.currentLead.company)
              )
            )
          ),

          React.createElement('div', { className: 'bg-gray-50 rounded-lg p-4' },
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-3' }, '🎫 Event Interest'),
            React.createElement('div', { className: 'space-y-2' },
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Event: '),
                React.createElement('span', { className: 'text-gray-900' }, window.appState.currentLead.lead_for_event || 'Not specified')
              ),
              window.appState.currentLead.number_of_people && React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Group Size: '),
                React.createElement('span', { className: 'text-gray-900' }, window.appState.currentLead.number_of_people + ' people')
              ),
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Location: '),
                React.createElement('span', { className: 'text-gray-900' }, 
                  (window.appState.currentLead.city_of_residence) + ', ' + (window.appState.currentLead.country_of_residence)
                )
              )
            )
          ),

          window.hasPermission('finance', 'read') && React.createElement('div', { className: 'bg-gray-50 rounded-lg p-4' },
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-3' }, '💰 Financial Details'),
            React.createElement('div', { className: 'space-y-2' },
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Potential Value: '),
                React.createElement('span', { className: 'text-green-600 font-semibold' }, 
                  '₹' + (window.appState.currentLead.potential_value || 0).toLocaleString()
                )
              ),
              window.appState.currentLead.last_quoted_price && React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Last Quote: '),
                React.createElement('span', { className: 'text-blue-600 font-semibold' }, 
                  '₹' + window.appState.currentLead.last_quoted_price.toLocaleString()
                )
              ),
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Income Bracket: '),
                React.createElement('span', { className: 'text-gray-900' }, 
                  window.appState.currentLead.annual_income_bracket || 'Not specified'
                )
              )
            )
          ),

          React.createElement('div', { className: 'bg-gray-50 rounded-lg p-4' },
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-3' }, '📊 Lead Source'),
            React.createElement('div', { className: 'space-y-2' },
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Source: '),
                React.createElement('span', { className: 'text-gray-900' }, window.appState.currentLead.source || 'Not specified')
              ),
              window.appState.currentLead.first_touch_base_done_by && React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'First Contact By: '),
                React.createElement('span', { className: 'text-gray-900' }, window.appState.currentLead.first_touch_base_done_by)
              ),
              window.appState.currentLead.date_of_enquiry && React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Enquiry Date: '),
                React.createElement('span', { className: 'text-gray-900' }, 
                  new Date(window.appState.currentLead.date_of_enquiry).toLocaleDateString()
                )
              )
            )
          )
        ),

        // ===== QUOTE SECTION - ADDED HERE =====
        React.createElement(QuoteSection),

        window.appState.currentLead.payment_details && React.createElement('div', { className: 'mt-6 bg-green-50 rounded-lg p-4' },
          React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-3' }, '💳 Payment Details'),
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
            React.createElement('div', null,
              React.createElement('span', { className: 'font-medium text-gray-700' }, 'Method: '),
              React.createElement('span', { className: 'text-gray-900' }, window.appState.currentLead.payment_details.payment_method)
            ),
            React.createElement('div', null,
              React.createElement('span', { className: 'font-medium text-gray-700' }, 'Amount: '),
              React.createElement('span', { className: 'text-green-600 font-semibold' }, 
                '₹' + (window.appState.currentLead.payment_details.payment_amount || 0).toLocaleString()
              )
            ),
            React.createElement('div', null,
              React.createElement('span', { className: 'font-medium text-gray-700' }, 'Transaction ID: '),
              React.createElement('span', { className: 'text-gray-900' }, window.appState.currentLead.payment_details.transaction_id)
            ),
            React.createElement('div', null,
              React.createElement('span', { className: 'font-medium text-gray-700' }, 'Date: '),
              React.createElement('span', { className: 'text-gray-900' }, 
                new Date(window.appState.currentLead.payment_details.payment_date).toLocaleDateString()
              )
            )
          )
        ),

        window.appState.currentLead.notes && React.createElement('div', { className: 'mt-6 bg-yellow-50 rounded-lg p-4' },
          React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-3' }, '📝 Notes'),
          React.createElement('p', { className: 'text-gray-900 whitespace-pre-wrap' }, window.appState.currentLead.notes)
        ),

        window.appState.currentLead.status === 'pickup_later' && React.createElement('div', { 
          className: 'mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4' 
        },
          React.createElement('h3', { 
            className: 'text-lg font-semibold text-indigo-800 mb-3 flex items-center' 
          }, 
            React.createElement('span', { className: 'mr-2' }, '⏰'),
            'Pick Up Later Information'
          ),

          window.appState.currentLead.next_follow_up_date && 
            React.createElement('div', { className: 'mb-3' },
              React.createElement('p', { className: 'text-sm font-medium text-indigo-700 mb-1' }, '📅 Follow-up Date:'),
              React.createElement('p', { className: 'text-indigo-900 font-semibold' },
                new Date(window.appState.currentLead.next_follow_up_date).toLocaleString()
              )
            ),

          window.appState.currentLead.follow_up_notes && 
            React.createElement('div', { className: 'mb-3' },
              React.createElement('p', { className: 'text-sm font-medium text-indigo-700 mb-1' }, '📝 Follow-up Notes:'),
              React.createElement('p', { className: 'text-indigo-900 whitespace-pre-wrap' }, window.appState.currentLead.follow_up_notes)
            ),

          window.appState.currentLead.previous_status && 
            React.createElement('div', { className: 'mb-3' },
              React.createElement('p', { className: 'text-sm font-medium text-indigo-700 mb-1' }, '↩️ Previous Status:'),
              React.createElement('span', { 
                className: `inline-block px-2 py-1 text-xs rounded-full ${window.LEAD_STATUSES[window.appState.currentLead.previous_status]?.color || 'bg-gray-100 text-gray-800'}`
              }, window.LEAD_STATUSES[window.appState.currentLead.previous_status]?.label || window.appState.currentLead.previous_status)
            ),

          React.createElement('button', {
            onClick: () => {
              const confirmReactivate = confirm('Reactivate this lead? It will return to: ' + (window.LEAD_STATUSES[window.appState.currentLead.previous_status]?.label || 'contacted'));
              if (confirmReactivate) {
                const targetStatus = window.appState.currentLead.previous_status || 'contacted';
                updateLeadStatus(window.appState.currentLead.id, targetStatus);
              }
            },
            className: 'mt-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center'
          }, 
            React.createElement('span', { className: 'mr-2' }, '🔄'),
            'Reactivate Lead'
          )
        ),                    

        // 📞 **COMMUNICATION TIMELINE** - This is the main addition!
        React.createElement(CommunicationTimeline, {
          leadId: window.appState.currentLead.id,
          leadName: window.appState.currentLead.name
        })
      )
    )
  );
};

console.log('✅ Lead Detail component with Quote Section loaded successfully');
