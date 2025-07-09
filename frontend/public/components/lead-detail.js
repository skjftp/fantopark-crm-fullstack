// Lead Detail Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

window.renderLeadDetail = () => {
  if (!showLeadDetail || !currentLead) return null;

  const status = window.LEAD_STATUSES[currentLead.status] || { label: currentLead.status, color: 'bg-gray-100 text-gray-800', next: [] };
  const nextActions = status.next || [];

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => e.target === e.currentTarget && closeForm()
  },
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[95vh] overflow-y-auto' },
      React.createElement('div', { className: 'sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center' },
        React.createElement('div', null,
          React.createElement('h2', { className: 'text-2xl font-bold text-gray-900' }, currentLead.name),
          React.createElement('div', { className: 'flex items-center mt-2 space-x-4' },
            React.createElement('span', {
              className: 'px-3 py-1 text-sm rounded-full ' + (status.color)
            }, status.label),
            currentLead.assigned_to && React.createElement('span', { className: 'text-sm text-blue-600' }, 
              'Assigned to: ' + window.getUserDisplayName(currentLead.assigned_to, users)
            ),
            // Show auto-assignment info if available
            currentLead.auto_assigned && React.createElement('span', { className: 'text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded' }, 
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
              setTimeout(() => openEditForm(currentLead), 100);
            }
          }, '✏️ Edit Lead'),
          window.hasPermission('leads', 'assign') && !currentLead.assigned_to && currentLead.status === 'unassigned' &&
            React.createElement('button', { 
              className: 'bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700',
              onClick: () => {
                closeForm();
                setTimeout(() => openAssignForm(currentLead), 100);
              }
            }, '👤 Assign'),
          window.hasPermission('leads', 'progress') && nextActions.length > 0 && React.createElement('button', {
            className: 'bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700',
            onClick: () => {
              handleLeadProgression(currentLead);
            }
          }, '→ Progress Lead'),
          window.hasPermission('leads', 'write') && currentLead.status === 'converted' &&
            React.createElement('button', { 
              className: 'bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700',
              onClick: () => {
                closeForm();
                setTimeout(() => openPaymentForm(currentLead), 100);
              }
            }, '💳 Collect Payment')
        ),

        // Auto-assignment details section (NEW)
        currentLead.auto_assigned && React.createElement('div', { className: 'mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4' },
          React.createElement('h3', { className: 'text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2' },
            React.createElement('span', null, '🤖'),
            'Auto-Assignment Details'
          ),
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4 text-sm' },
            React.createElement('div', null,
              React.createElement('span', { className: 'font-medium text-purple-700' }, 'Rule Used: '),
              React.createElement('span', { className: 'text-purple-900' }, currentLead.assignment_rule_used || 'N/A')
            ),
            React.createElement('div', null,
              React.createElement('span', { className: 'font-medium text-purple-700' }, 'Reason: '),
              React.createElement('span', { className: 'text-purple-900' }, currentLead.assignment_reason || 'N/A')
            ),
            React.createElement('div', null,
              React.createElement('span', { className: 'font-medium text-purple-700' }, 'Assigned To: '),
              React.createElement('span', { className: 'text-purple-900' }, window.getUserDisplayName(currentLead.assigned_to, users) || currentLead.assigned_to)
            ),
            currentLead.assignment_date && React.createElement('div', null,
              React.createElement('span', { className: 'font-medium text-purple-700' }, 'Assignment Date: '),
              React.createElement('span', { className: 'text-purple-900' }, 
                new Date(currentLead.assignment_date).toLocaleDateString()
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
                React.createElement('span', { className: 'text-gray-900' }, currentLead.name)
              ),
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Email: '),
                React.createElement('a', { 
                  href: 'mailto:' + (currentLead.email),
                  className: 'text-blue-600 hover:underline' 
                }, currentLead.email)
              ),
              currentLead.phone && React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Phone: '),
                React.createElement('a', { 
                  href: 'tel:' + (currentLead.phone),
                  className: 'text-blue-600 hover:underline' 
                }, currentLead.phone)
              ),
              currentLead.company && React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Company: '),
                React.createElement('span', { className: 'text-gray-900' }, currentLead.company)
              )
            )
          ),

          React.createElement('div', { className: 'bg-gray-50 rounded-lg p-4' },
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-3' }, '🎫 Event Interest'),
            React.createElement('div', { className: 'space-y-2' },
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Event: '),
                React.createElement('span', { className: 'text-gray-900' }, currentLead.lead_for_event || 'Not specified')
              ),
              currentLead.number_of_people && React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Group Size: '),
                React.createElement('span', { className: 'text-gray-900' }, currentLead.number_of_people + ' people')
              ),
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Location: '),
                React.createElement('span', { className: 'text-gray-900' }, 
                  (currentLead.city_of_residence) + ', ' + (currentLead.country_of_residence)
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
                  '₹' + (currentLead.potential_value || 0).toLocaleString()
                )
              ),
              currentLead.last_quoted_price && React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Last Quote: '),
                React.createElement('span', { className: 'text-blue-600 font-semibold' }, 
                  '₹' + currentLead.last_quoted_price.toLocaleString()
                )
              ),
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Income Bracket: '),
                React.createElement('span', { className: 'text-gray-900' }, 
                  currentLead.annual_income_bracket || 'Not specified'
                )
              )
            )
          ),

          React.createElement('div', { className: 'bg-gray-50 rounded-lg p-4' },
            React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-3' }, '📊 Lead Source'),
            React.createElement('div', { className: 'space-y-2' },
              React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Source: '),
                React.createElement('span', { className: 'text-gray-900' }, currentLead.source || 'Not specified')
              ),
              currentLead.first_touch_base_done_by && React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'First Contact By: '),
                React.createElement('span', { className: 'text-gray-900' }, currentLead.first_touch_base_done_by)
              ),
              currentLead.date_of_enquiry && React.createElement('div', null,
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Enquiry Date: '),
                React.createElement('span', { className: 'text-gray-900' }, 
                  new Date(currentLead.date_of_enquiry).toLocaleDateString()
                )
              )
            )
          )
        ),

        currentLead.payment_details && React.createElement('div', { className: 'mt-6 bg-green-50 rounded-lg p-4' },
          React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-3' }, '💳 Payment Details'),
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
            React.createElement('div', null,
              React.createElement('span', { className: 'font-medium text-gray-700' }, 'Method: '),
              React.createElement('span', { className: 'text-gray-900' }, currentLead.payment_details.payment_method)
            ),
            React.createElement('div', null,
              React.createElement('span', { className: 'font-medium text-gray-700' }, 'Amount: '),
              React.createElement('span', { className: 'text-green-600 font-semibold' }, 
                '₹' + (currentLead.payment_details.payment_amount || 0).toLocaleString()
              )
            ),
            React.createElement('div', null,
              React.createElement('span', { className: 'font-medium text-gray-700' }, 'Transaction ID: '),
              React.createElement('span', { className: 'text-gray-900' }, currentLead.payment_details.transaction_id)
            ),
            React.createElement('div', null,
              React.createElement('span', { className: 'font-medium text-gray-700' }, 'Date: '),
              React.createElement('span', { className: 'text-gray-900' }, 
                new Date(currentLead.payment_details.payment_date).toLocaleDateString()
              )
            )
          )
        ),

        currentLead.notes && React.createElement('div', { className: 'mt-6 bg-yellow-50 rounded-lg p-4' },
          React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-3' }, '📝 Notes'),
          React.createElement('p', { className: 'text-gray-900 whitespace-pre-wrap' }, currentLead.notes)
        ),

        currentLead.status === 'pickup_later' && React.createElement('div', { 
          className: 'mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4' 
        },
          React.createElement('h3', { 
            className: 'text-lg font-semibold text-indigo-800 mb-3 flex items-center' 
          }, 
            React.createElement('span', { className: 'mr-2' }, '⏰'),
            'Pick Up Later Information'
          ),

          currentLead.next_follow_up_date && 
            React.createElement('div', { className: 'mb-3' },
              React.createElement('p', { className: 'text-sm font-medium text-indigo-700 mb-1' }, '📅 Follow-up Date:'),
              React.createElement('p', { className: 'text-indigo-900 font-semibold' },
                new Date(currentLead.next_follow_up_date).toLocaleString()
              )
            ),

          currentLead.follow_up_notes && 
            React.createElement('div', { className: 'mb-3' },
              React.createElement('p', { className: 'text-sm font-medium text-indigo-700 mb-1' }, '📝 Follow-up Notes:'),
              React.createElement('p', { className: 'text-indigo-900 whitespace-pre-wrap' }, currentLead.follow_up_notes)
            ),

          currentLead.previous_status && 
            React.createElement('div', { className: 'mb-3' },
              React.createElement('p', { className: 'text-sm font-medium text-indigo-700 mb-1' }, '↩️ Previous Status:'),
              React.createElement('span', { 
                className: `inline-block px-2 py-1 text-xs rounded-full ${window.LEAD_STATUSES[currentLead.previous_status]?.color || 'bg-gray-100 text-gray-800'}`
              }, window.LEAD_STATUSES[currentLead.previous_status]?.label || currentLead.previous_status)
            ),

          React.createElement('button', {
            onClick: () => {
              const confirmReactivate = confirm('Reactivate this lead? It will return to: ' + (window.LEAD_STATUSES[currentLead.previous_status]?.label || 'contacted'));
              if (confirmReactivate) {
                const targetStatus = currentLead.previous_status || 'contacted';
                updateLeadStatus(currentLead.id, targetStatus);
              }
            },
            className: 'mt-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center'
          }, 
            React.createElement('span', { className: 'mr-2' }, '🔄'),
            'Reactivate Lead'
          )
        ),                    

        // 📞 **NEW: COMMUNICATION TIMELINE** - This is the main addition!
        React.createElement(CommunicationTimeline, {
          leadId: currentLead.id,
          leadName: currentLead.name
        })
      )
    )
  );
};

console.log('✅ Lead Detail component loaded successfully');
