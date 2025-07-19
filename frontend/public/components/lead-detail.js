// Lead Detail Component for FanToPark CRM
// Updated with Inclusions Tab Integration
// Uses window.* globals for CDN-based React compatibility

// ===== PDF DOWNLOAD FUNCTION =====
window.downloadQuotePDF = async function(lead) {
  console.log('📄 Starting quote PDF download for:', lead.name);
  console.log('📄 File:', lead.quote_pdf_filename);
  
  if (!lead.quote_pdf_filename) {
    alert('No quote PDF file found for this lead.');
    return;
  }
  
  try {
    // Call the backend API to get the file
    const response = await window.apiCall(`/leads/${lead.id}/quote/download`, {
      method: 'GET'
    });
    
    if (response.success && response.downloadUrl) {
      // If backend returns a direct download URL
      const link = document.createElement('a');
      link.href = response.downloadUrl;
      link.download = lead.quote_pdf_filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ PDF download initiated successfully');
    } else if (response.fileData) {
      // If backend returns file data as base64
      const byteCharacters = atob(response.fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = lead.quote_pdf_filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('✅ PDF download completed successfully');
    } else {
      throw new Error(response.error || 'Failed to get download URL');
    }
    
  } catch (error) {
    console.error('❌ Quote PDF download error:', error);
    alert('Failed to download quote PDF: ' + error.message);
  }
};

// ===== QUOTE SECTION COMPONENT =====
window.renderQuoteSection = function(lead) {
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
          
          // File Information - MODIFIED TO ADD CLICKABLE DOWNLOAD
          lead.quote_pdf_filename && React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700' }, 'Quote File: '),
            React.createElement('div', { className: 'flex items-center mt-1' },
              React.createElement('span', { className: 'mr-2' }, '📄'),
              React.createElement('button', { 
                className: 'text-blue-600 text-sm hover:text-blue-800 hover:underline cursor-pointer',
                onClick: () => window.downloadQuotePDF(lead),
                title: 'Click to download PDF'
              }, lead.quote_pdf_filename),
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

// ===== LEAD DETAILS TAB CONTENT =====
window.renderLeadDetailsContent = function(lead, status) {
  return React.createElement('div', null,
    // Action Buttons at top
    React.createElement('div', { className: 'mb-6 flex flex-wrap gap-2' },
      window.hasPermission('leads', 'write') && React.createElement('button', { 
        className: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700',
        onClick: () => {
          window.closeForm();
          setTimeout(() => window.openEditForm(lead), 100);
        }
      }, '✏️ Edit Lead'),
      
      window.hasPermission('leads', 'assign') && !lead.assigned_to && lead.status === 'unassigned' &&
        React.createElement('button', { 
          className: 'bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700',
          onClick: () => {
            window.closeForm();
            setTimeout(() => window.openAssignForm(lead), 100);
          }
        }, '👤 Assign'),
        
      window.hasPermission('leads', 'write') && lead.status === 'converted' &&
        React.createElement('button', { 
          className: 'bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700',
          onClick: () => {
            window.closeForm();
            setTimeout(() => window.openPaymentForm(lead), 100);
          }
        }, '💳 Collect Payment')
    ),

    // Auto-assignment details section
    lead.auto_assigned && React.createElement('div', { className: 'mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4' },
      React.createElement('h3', { className: 'text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2' },
        React.createElement('span', null, '🤖'),
        'Auto-Assignment Details'
      ),
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4 text-sm' },
        React.createElement('div', null,
          React.createElement('span', { className: 'font-medium text-purple-700' }, 'Rule Used: '),
          React.createElement('span', { className: 'text-purple-900' }, lead.assignment_rule_used || 'N/A')
        ),
        React.createElement('div', null,
          React.createElement('span', { className: 'font-medium text-purple-700' }, 'Reason: '),
          React.createElement('span', { className: 'text-purple-900' }, lead.assignment_reason || 'N/A')
        ),
        React.createElement('div', null,
          React.createElement('span', { className: 'font-medium text-purple-700' }, 'Assigned To: '),
          React.createElement('span', { className: 'text-purple-900' }, 
            window.getUserDisplayName(lead.assigned_to, window.appState.users) || lead.assigned_to
          )
        ),
        lead.assignment_date && React.createElement('div', null,
          React.createElement('span', { className: 'font-medium text-purple-700' }, 'Assignment Date: '),
          React.createElement('span', { className: 'text-purple-900' }, 
            new Date(lead.assignment_date).toLocaleDateString()
          )
        )
      )
    ),

    // Main content grid
    React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6' },
      // Contact Information
      React.createElement('div', { className: 'bg-gray-50 rounded-lg p-4' },
        React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-3' }, '📞 Contact Information'),
        React.createElement('div', { className: 'space-y-2' },
          React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700' }, 'Name: '),
            React.createElement('span', { className: 'text-gray-900' }, lead.name)
          ),
          React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700' }, 'Email: '),
            React.createElement('a', { 
              href: 'mailto:' + lead.email,
              className: 'text-blue-600 hover:underline' 
            }, lead.email)
          ),
          lead.phone && React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700' }, 'Phone: '),
            React.createElement('a', { 
              href: 'tel:' + lead.phone,
              className: 'text-blue-600 hover:underline' 
            }, lead.phone)
          ),
          lead.company && React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700' }, 'Company: '),
            React.createElement('span', { className: 'text-gray-900' }, lead.company)
          ),
          lead.preferred_contact_time && React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700' }, 
              React.createElement('span', null, '🕐 '),
              'Preferred Contact Time: '
            ),
            React.createElement('span', { className: 'text-purple-600 font-medium' }, 
              lead.preferred_contact_time
            )
          )
        )
      ),

      // Event Interest
      React.createElement('div', { className: 'bg-gray-50 rounded-lg p-4' },
        React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-3' }, '🎫 Event Interest'),
        React.createElement('div', { className: 'space-y-2' },
          React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700' }, 'Event: '),
            React.createElement('span', { className: 'text-gray-900' }, lead.lead_for_event || 'Not specified')
          ),
          lead.number_of_people && React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700' }, 'Group Size: '),
            React.createElement('span', { className: 'text-gray-900' }, lead.number_of_people + ' people')
          ),
          React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700' }, 'Location: '),
            React.createElement('span', { className: 'text-gray-900' }, 
              (lead.city_of_residence || '') + ', ' + (lead.country_of_residence || '')
            )
          )
        )
      ),

      // Financial Details
      window.hasPermission('finance', 'read') && React.createElement('div', { className: 'bg-gray-50 rounded-lg p-4' },
        React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-3' }, '💰 Financial Details'),
        React.createElement('div', { className: 'space-y-2' },
          React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700' }, 'Potential Value: '),
            React.createElement('span', { className: 'text-green-600 font-semibold' }, 
              '₹' + (lead.potential_value || 0).toLocaleString()
            )
          ),
          lead.last_quoted_price && React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700' }, 'Last Quote: '),
            React.createElement('span', { className: 'text-blue-600 font-semibold' }, 
              '₹' + lead.last_quoted_price.toLocaleString()
            )
          ),
          React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700' }, 'Income Bracket: '),
            React.createElement('span', { className: 'text-gray-900' }, 
              lead.annual_income_bracket || 'Not specified'
            )
          )
        )
      ),

      // Lead Source
      React.createElement('div', { className: 'bg-gray-50 rounded-lg p-4' },
        React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-3' }, '📊 Lead Source'),
        React.createElement('div', { className: 'space-y-2' },
          React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700' }, 'Source: '),
            React.createElement('span', { className: 'text-gray-900' }, lead.source || 'Not specified')
          ),
          lead.form_name && React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700' }, 
              React.createElement('span', null, '📘 '),
              'Form: '
            ),
            React.createElement('span', { className: 'text-blue-600' }, lead.form_name)
          ),
          lead.campaign_name && React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700' }, 'Campaign: '),
            React.createElement('span', { className: 'text-purple-600' }, lead.campaign_name)
          ),
          lead.adset_name && React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700' }, 'Ad Set: '),
            React.createElement('span', { className: 'text-green-600' }, lead.adset_name)
          ),
          lead.ad_name && React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700' }, 'Ad: '),
            React.createElement('span', { className: 'text-orange-600' }, lead.ad_name)
          ),
          lead.first_touch_base_done_by && React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700' }, 'First Contact By: '),
            React.createElement('span', { className: 'text-gray-900' }, lead.first_touch_base_done_by)
          ),
          React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700' }, 'Business Type: '),
            React.createElement('span', { className: 'text-gray-900' }, lead.business_type || 'B2C')
          ),
          lead.date_of_enquiry && React.createElement('div', null,
            React.createElement('span', { className: 'font-medium text-gray-700' }, 'Enquiry Date: '),
            React.createElement('span', { className: 'text-gray-900' }, 
              new Date(lead.date_of_enquiry).toLocaleDateString()
            )
          )
        )
      )
    ),

    // Quote Section
    window.renderQuoteSection(lead),

    // Payment Details
    lead.payment_details && React.createElement('div', { className: 'mt-6 bg-green-50 rounded-lg p-4' },
      React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-3' }, '💳 Payment Details'),
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
        React.createElement('div', null,
          React.createElement('span', { className: 'font-medium text-gray-700' }, 'Method: '),
          React.createElement('span', { className: 'text-gray-900' }, lead.payment_details.payment_method)
        ),
        React.createElement('div', null,
          React.createElement('span', { className: 'font-medium text-gray-700' }, 'Amount: '),
          React.createElement('span', { className: 'text-green-600 font-semibold' }, 
            '₹' + (lead.payment_details.payment_amount || 0).toLocaleString()
          )
        ),
        React.createElement('div', null,
          React.createElement('span', { className: 'font-medium text-gray-700' }, 'Transaction ID: '),
          React.createElement('span', { className: 'text-gray-900' }, lead.payment_details.transaction_id)
        ),
        React.createElement('div', null,
          React.createElement('span', { className: 'font-medium text-gray-700' }, 'Date: '),
          React.createElement('span', { className: 'text-gray-900' }, 
            new Date(lead.payment_details.payment_date).toLocaleDateString()
          )
        )
      )
    ),

    // Notes
    lead.notes && React.createElement('div', { className: 'mt-6 bg-yellow-50 rounded-lg p-4' },
      React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-3' }, '📝 Notes'),
      React.createElement('p', { className: 'text-gray-900 whitespace-pre-wrap' }, lead.notes)
    ),

    // Pick Up Later Information
    lead.status === 'pickup_later' && React.createElement('div', { 
      className: 'mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4' 
    },
      React.createElement('h3', { 
        className: 'text-lg font-semibold text-indigo-800 mb-3 flex items-center' 
      }, 
        React.createElement('span', { className: 'mr-2' }, '⏰'),
        'Pick Up Later Information'
      ),

      lead.next_follow_up_date && 
        React.createElement('div', { className: 'mb-3' },
          React.createElement('p', { className: 'text-sm font-medium text-indigo-700 mb-1' }, '📅 Follow-up Date:'),
          React.createElement('p', { className: 'text-indigo-900 font-semibold' },
            new Date(lead.next_follow_up_date).toLocaleString()
          )
        ),

      lead.follow_up_notes && 
        React.createElement('div', { className: 'mb-3' },
          React.createElement('p', { className: 'text-sm font-medium text-indigo-700 mb-1' }, '📝 Follow-up Notes:'),
          React.createElement('p', { className: 'text-indigo-900 whitespace-pre-wrap' }, lead.follow_up_notes)
        ),

      lead.previous_status && 
        React.createElement('div', { className: 'mb-3' },
          React.createElement('p', { className: 'text-sm font-medium text-indigo-700 mb-1' }, '↩️ Previous Status:'),
          React.createElement('span', { 
            className: `inline-block px-2 py-1 text-xs rounded-full ${window.LEAD_STATUSES[lead.previous_status]?.color || 'bg-gray-100 text-gray-800'}`
          }, window.LEAD_STATUSES[lead.previous_status]?.label || lead.previous_status)
        ),

      React.createElement('button', {
        onClick: () => {
          const confirmReactivate = confirm('Reactivate this lead? It will return to: ' + (window.LEAD_STATUSES[lead.previous_status]?.label || 'contacted'));
          if (confirmReactivate) {
            const targetStatus = lead.previous_status || 'contacted';
            window.updateLeadStatus(lead.id, targetStatus);
          }
        },
        className: 'mt-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 flex items-center'
      }, 
        React.createElement('span', { className: 'mr-2' }, '🔄'),
        'Reactivate Lead'
      )
    )
  );
};

// ===== PROGRESS LEAD TAB CONTENT =====
window.renderProgressLeadContent = function(lead, status) {
  const nextActions = status.next || [];
  
  return React.createElement('div', null,
    React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 
      'Lead Progression'
    ),
    
    React.createElement('div', { className: 'mb-6' },
      React.createElement('p', { className: 'text-gray-600 mb-4' }, 
        'Current Status: ',
        React.createElement('span', {
          className: 'px-3 py-1 rounded-full text-sm ' + status.color
        }, status.label)
      ),
      
      nextActions.length > 0 ? 
      React.createElement('div', null,
        React.createElement('p', { className: 'text-gray-600 mb-4' }, 
          'Select next action:'
        ),
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-3' },
          nextActions.map(action => {
            const actionStatus = window.LEAD_STATUSES[action];
            return React.createElement('button', {
              key: action,
              onClick: () => {
                window.handleLeadProgression(lead);
                window.closeForm();
              },
              className: 'p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors'
            },
              React.createElement('div', { className: 'font-medium' }, 
                actionStatus.label
              ),
              actionStatus.description && React.createElement('div', { 
                className: 'text-sm text-gray-600 mt-1' 
              }, actionStatus.description)
            );
          })
        )
      ) :
      React.createElement('p', { className: 'text-gray-600' }, 
        'This lead is at the final stage. No further progression available.'
      )
    ),
    
    // Special actions for dropped/junk leads
    (lead.status === 'dropped' || lead.status === 'junk') && 
    React.createElement('div', { className: 'mt-6 p-4 bg-yellow-50 rounded-lg' },
      React.createElement('p', { className: 'text-yellow-800 mb-3' }, 
        'This lead has been marked as ' + lead.status + '. You can reactivate it if needed.'
      ),
      React.createElement('button', {
        onClick: () => {
          const confirmReactivate = confirm(
            'Are you sure you want to reactivate this lead? ' +
            'It will return to: ' + 
            (window.LEAD_STATUSES[lead.previous_status]?.label || 'contacted')
          );
          if (confirmReactivate) {
            const targetStatus = lead.previous_status || 'contacted';
            window.updateLeadStatus(lead.id, targetStatus);
            window.closeForm();
          }
        },
        className: 'px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700'
      }, '🔄 Reactivate Lead')
    )
  );
};

// ===== MAIN RENDER FUNCTION WITH TABS =====
window.renderLeadDetail = () => {
  if (!window.appState.showLeadDetail || !window.appState.currentLead) return null;

  const lead = window.appState.currentLead;
  const status = window.LEAD_STATUSES[lead.status] || { 
    label: lead.status, 
    color: 'bg-gray-100 text-gray-800', 
    next: [] 
  };
  const nextActions = status.next || [];
  
  // State for active tab
  const [activeTab, setActiveTab] = React.useState('details');

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]',
    onClick: (e) => e.target === e.currentTarget && window.closeForm()
  },
    React.createElement('div', { 
      className: 'bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col'
    },
      // Header
      React.createElement('div', { 
        className: 'sticky top-0 bg-white dark:bg-gray-800 border-b px-6 py-4 flex justify-between items-center z-10'
      },
        React.createElement('div', null,
          React.createElement('h2', { 
            className: 'text-2xl font-bold text-gray-900 dark:text-white' 
          }, lead.name),
          React.createElement('div', { className: 'flex items-center mt-2 space-x-4' },
            React.createElement('span', {
              className: 'px-3 py-1 text-sm rounded-full ' + status.color
            }, status.label),
            lead.assigned_to && React.createElement('span', { 
              className: 'text-sm text-blue-600 dark:text-blue-400' 
            }, 
              'Assigned to: ' + window.getUserDisplayName(lead.assigned_to, window.appState.users)
            ),
            // Show auto-assignment info if available
            lead.auto_assigned && React.createElement('span', { 
              className: 'text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded' 
            }, '🤖 Auto-assigned')
          )
        ),
        React.createElement('button', {
          onClick: window.closeForm,
          className: 'text-gray-400 hover:text-gray-600 text-2xl'
        }, '✕')
      ),
      
      // Tab Navigation
      React.createElement('div', { 
        className: 'border-b bg-gray-50 dark:bg-gray-900 px-6'
      },
        React.createElement('nav', { className: 'flex space-x-8' },
          // Details Tab
          React.createElement('button', {
            onClick: () => setActiveTab('details'),
            className: `py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400'
            }`
          }, '📋 Details'),
          
          // Progress Lead Tab
          nextActions.length > 0 && React.createElement('button', {
            onClick: () => setActiveTab('progress'),
            className: `py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'progress'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400'
            }`
          }, '➡️ Progress Lead'),
          
          // Inclusions Tab (NEW)
          React.createElement('button', {
            onClick: () => setActiveTab('inclusions'),
            className: `py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'inclusions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400'
            }`
          }, 
            '✈️ Inclusions',
            // Show notification badge if in quote_requested status
            lead.status === 'quote_requested' && 
            React.createElement('span', { 
              className: 'ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs'
            }, 'Action Required')
          ),
          
          // Communication Tab
          React.createElement('button', {
            onClick: () => setActiveTab('communication'),
            className: `py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'communication'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400'
            }`
          }, '💬 Communication')
        )
      ),
      
      // Tab Content
      React.createElement('div', { 
        className: 'flex-1 overflow-y-auto'
      },
        // Details Tab Content
        activeTab === 'details' && React.createElement('div', { className: 'p-6' },
          window.renderLeadDetailsContent(lead, status)
        ),
        
        // Progress Lead Tab Content
        activeTab === 'progress' && React.createElement('div', { className: 'p-6' },
          window.renderProgressLeadContent(lead, status)
        ),
        
        // Inclusions Tab Content (NEW)
        activeTab === 'inclusions' && (
          window.renderLeadInclusions ? 
          window.renderLeadInclusions(lead) :
          React.createElement('div', { className: 'p-6 text-center text-gray-500' },
            'Inclusions component not loaded. Please include lead-inclusions.js'
          )
        ),
        
        // Communication Tab Content
        activeTab === 'communication' && React.createElement('div', { className: 'p-6' },
          window.CommunicationTimeline ?
          React.createElement(window.CommunicationTimeline, {
            leadId: lead.id,
            leadName: lead.name
          }) :
          React.createElement('div', { className: 'text-center text-gray-500' },
            'Communication timeline not available'
          )
        )
      )
    )
  );
};

console.log('✅ Lead Detail component with Inclusions Tab loaded successfully');
