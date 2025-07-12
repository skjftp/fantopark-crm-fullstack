// CSV Upload System Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Handles CSV/Excel upload, preview, and smart client detection

// CSV Upload Modal Component with Smart Client Detection
window.CSVUploadModal = ({ isOpen, onClose, type }) => {
  const [file, setFile] = React.useState(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadResult, setUploadResult] = React.useState(null);
  const [proceedAfterPreview, setProceedAfterPreview] = React.useState(false);

  // Enhanced file validation for both CSV and Excel
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    const isValidFile = allowedTypes.includes(selectedFile.type) || 
      selectedFile.name.endsWith('.csv') || 
      selectedFile.name.endsWith('.xlsx') || 
      selectedFile.name.endsWith('.xls');

    if (selectedFile && isValidFile) {
      setFile(selectedFile);
      window.currentUploadFile = selectedFile; // Store globally for preview flow
      setUploadResult(null); // Clear previous results
      setProceedAfterPreview(false); // Reset proceed flag
    } else {
      alert('Please select a valid CSV or Excel file (.csv, .xlsx, .xls)');
    }
  };

  // Preview function for smart client detection (only for leads)
  const handlePreview = async () => {
    if (!file) {
      alert('Please select a file first');
      return;
    }

    window.setPreviewLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${window.API_CONFIG.API_URL}/upload/leads/csv/preview`, {
        method: 'POST',
        headers: {
          'Authorization': window.authToken ? 'Bearer ' + window.authToken : undefined
        },
        body: formData
      });

      const result = await response.json();
      if (response.ok) {
        window.setUploadPreview(result);
        window.setShowPreview(true);
      } else {
        alert('Preview failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Preview error: ' + error.message);
    } finally {
      window.setPreviewLoading(false);
    }
  };

  // Enhanced upload function
  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${window.API_CONFIG.API_URL}/upload/${type}/csv`, {
        method: 'POST',
        headers: {
          'Authorization': window.authToken ? 'Bearer ' + window.authToken : undefined
        },
        body: formData
      });

      const result = await response.json();
      if (response.ok) {
        setUploadResult(result);

        // Handle smart client detection results
        if (result.clientDetectionResults && result.clientDetectionResults.length > 0) {
          window.setClientDetectionResults(result.clientDetectionResults);
          window.setShowClientDetectionResults(true);
        }

        // Refresh data
        if (type === 'leads') {
          const leadsData = await window.apicall('/leads');
          window.setLeads(leadsData.data || []);
        } else if (type === 'inventory') {
          const inventoryData = await window.apicall('/inventory');
          window.setInventory(inventoryData.data || []);
        }

        // Show enhanced success message
        showEnhancedUploadSummary(result);

      } else {
        alert('Upload failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Upload error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Function to handle proceed from preview
  const handleProceedFromPreview = () => {
    window.setShowPreview(false);
    setProceedAfterPreview(true);
    // Trigger upload after a small delay to ensure state is updated
    setTimeout(() => {
      handleUpload();
    }, 100);
  };

  // Enhanced upload summary function
  const showEnhancedUploadSummary = (result) => {
    let message = `🎉 Upload completed!\n\n`;
    message += `✅ Successfully imported: ${result.successCount} ${type}\n`;

    if (result.errorCount > 0) {
      message += `❌ Failed: ${result.errorCount} ${type}\n`;
    }

    // Smart client detection summary (only for leads)
    if (type === 'leads' && result.clientDetectionCount > 0) {
      message += `\n🔍 Smart Client Detection:\n`;
      message += `📞 Existing clients found: ${result.clientDetectionCount}\n`;
      message += `👤 New clients: ${result.summary?.new_clients || 0}\n`;
    }

    if (type === 'leads' && result.autoAssignmentCount > 0) {
      message += `\n🎯 Auto-assignments: ${result.autoAssignmentCount}\n`;
    }

    if (type === 'leads' && result.clientAssignmentCount > 0) {
      message += `📋 Client-based assignments: ${result.clientAssignmentCount}\n`;
    }

    if (type === 'leads' && result.summary) {
      message += `\n📊 Assignment Summary:\n`;
      message += `• Auto-assigned: ${result.summary.auto_assigned}\n`;
      message += `• Client-assigned: ${result.summary.client_assigned}\n`;
      message += `• Manually assigned: ${result.summary.manually_assigned}\n`;
      message += `• Unassigned: ${result.summary.unassigned}\n`;
    }

    alert(message);
  };

  if (!isOpen) return null;

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
  },
    React.createElement('div', {
      className: 'bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto'
    },
      // Modal Header
      React.createElement('div', {
        className: 'flex items-center justify-between mb-4'
      },
        React.createElement('h2', {
          className: 'text-2xl font-bold text-gray-900 dark:text-white'
        }, `Upload ${type === 'leads' ? 'Leads' : 'Inventory'} (CSV/Excel)`),

        React.createElement('button', {
          onClick: onClose,
          className: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        }, '✕')
      ),

      // Smart Client Detection Notice (only for leads)
      type === 'leads' && React.createElement('div', {
        className: 'mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg'
      },
        React.createElement('h3', {
          className: 'font-semibold text-blue-800 dark:text-blue-200 mb-2'
        }, '🔍 Smart Client Detection Enabled'),
        React.createElement('ul', {
          className: 'text-blue-700 dark:text-blue-300 text-sm space-y-1'
        },
          React.createElement('li', null, '• Automatically detects existing clients by phone number'),
          React.createElement('li', null, '• Auto-assigns leads to the same person who handled previous leads'),
          React.createElement('li', null, '• Groups leads by client with relationship tracking'),
          React.createElement('li', null, '• Preview your upload to review assignments before import')
        )
      ),

      // Instructions
      React.createElement('div', {
        className: 'mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg'
      },
        React.createElement('p', {
          className: 'text-blue-800 dark:text-blue-200 mb-2'
        }, '📋 Upload a CSV or Excel file to bulk import your data.'),
        React.createElement('p', {
          className: 'text-blue-700 dark:text-blue-300 text-sm'
        }, '💡 Excel files include validation guidance and clear instructions!')
      ),

      // Download Templates Section
      React.createElement('div', {
        className: 'mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg'
      },
        React.createElement('h3', {
          className: 'font-semibold mb-3 text-gray-900 dark:text-white'
        }, '📥 Download Sample Templates:'),

        React.createElement('div', {
          className: 'grid grid-cols-1 md:grid-cols-3 gap-2'
        },
          // CSV Download
          React.createElement('button', {
            onClick: window.downloadSampleCSV,
            className: 'bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors'
          }, '📄 CSV Template'),

          // Excel Method 1 - Advanced
          type === 'leads' && React.createElement('button', {
            onClick: window.downloadSampleExcel,
            className: 'bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors'
          }, '📊 Excel (Advanced)'),

          // Excel Method 2 - Instructions
          type === 'leads' && React.createElement('button', {
            onClick: window.downloadSampleExcelV2,
            className: 'bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors'
          }, '📋 Excel (Instructions)')
        ),

        type === 'leads' && React.createElement('p', {
          className: 'text-xs text-gray-600 dark:text-gray-400 mt-3 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded border-l-4 border-yellow-400'
        }, '🎯 Try "Excel (Instructions)" for the clearest guidance - includes validation options and examples!')
      ),

      // File Upload Section
      React.createElement('div', {
        className: 'mb-6 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg'
      },
        React.createElement('h3', {
          className: 'font-semibold mb-3 text-gray-900 dark:text-white'
        }, '📤 Upload Your File:'),

        React.createElement('input', {
          type: 'file',
          accept: '.csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          onChange: handleFileChange,
          className: 'block w-full mb-3 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
        }),

        file && React.createElement('div', {
          className: 'flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-green-50 dark:bg-green-900/20 p-2 rounded'
        },
          React.createElement('span', null, '✅'),
          React.createElement('span', null, `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`)
        )
      ),

      // Preview Section (only for leads)
      type === 'leads' && file && React.createElement('div', {
        className: 'mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg'
      },
        React.createElement('h3', {
          className: 'font-semibold mb-3 text-yellow-800 dark:text-yellow-200'
        }, '🔍 Smart Client Detection Preview'),
        React.createElement('p', {
          className: 'text-yellow-700 dark:text-yellow-300 text-sm mb-3'
        }, 'Preview your upload to see which leads will be assigned based on existing client relationships.'),
        React.createElement('button', {
          onClick: handlePreview,
          disabled: window.previewLoading,
          className: 'bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50'
        },
          window.previewLoading && React.createElement('div', {
            className: 'animate-spin rounded-full h-4 w-4 border-b-2 border-white'
          }),
          window.previewLoading ? 'Loading Preview...' : '🔍 Preview Upload'
        )
      ),

      // Upload Results
      uploadResult && React.createElement('div', {
        className: `mb-6 p-4 rounded-lg ${
          uploadResult.errorCount > 0 
            ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700' 
            : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700'
        }`
      },
        React.createElement('div', {
          className: 'flex items-center gap-2 mb-2'
        },
          React.createElement('span', {
            className: 'text-lg'
          }, uploadResult.errorCount > 0 ? '⚠️' : '✅'),
          React.createElement('p', {
            className: `font-semibold ${
              uploadResult.errorCount > 0 
                ? 'text-yellow-800 dark:text-yellow-200' 
                : 'text-green-800 dark:text-green-200'
            }`
          }, uploadResult.message)
        ),

        // Enhanced success metrics
        uploadResult.successCount > 0 && React.createElement('div', {
          className: 'text-sm text-green-700 dark:text-green-300 space-y-1'
        },
          React.createElement('p', null, `✅ Successfully imported: ${uploadResult.successCount} records`),

          // Smart client detection results (only for leads)
          type === 'leads' && uploadResult.clientDetectionCount > 0 && React.createElement('p', null, 
            `🔍 Existing clients detected: ${uploadResult.clientDetectionCount}`),

          type === 'leads' && uploadResult.autoAssignmentCount > 0 && React.createElement('p', null, 
            `🎯 Auto-assignments applied: ${uploadResult.autoAssignmentCount}`),

          type === 'leads' && uploadResult.clientAssignmentCount > 0 && React.createElement('p', null, 
            `📋 Client-based assignments: ${uploadResult.clientAssignmentCount}`)
        ),

        // Show client detection details button
        type === 'leads' && uploadResult.clientDetectionResults && uploadResult.clientDetectionResults.length > 0 && 
        React.createElement('button', {
          onClick: () => window.setShowClientDetectionResults(true),
          className: 'mt-2 text-blue-600 hover:text-blue-800 text-sm underline'
        }, 'View Smart Client Detection Details →'),

        // Error section
        uploadResult.errors && uploadResult.errors.length > 0 && React.createElement('div', {
          className: 'mt-3'
        },
          React.createElement('p', {
            className: 'text-sm font-semibold text-red-700 dark:text-red-300 mb-2'
          }, `❌ Errors found (${uploadResult.errors.length}):`),
          React.createElement('div', {
            className: 'max-h-32 overflow-y-auto bg-white dark:bg-gray-800 p-2 rounded border'
          },
            uploadResult.errors.map((error, index) => 
              React.createElement('p', {
                key: index,
                className: 'text-xs text-red-600 dark:text-red-400 mb-1'
              }, `Row ${error.row}: ${error.error}`)
            )
          )
        )
      ),

      // Action Buttons
      React.createElement('div', {
        className: 'flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600'
      },
        React.createElement('button', {
          onClick: onClose,
          className: 'px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors'
        }, 'Cancel'),

        React.createElement('button', {
          onClick: handleUpload,
          disabled: !file || uploading,
          className: `px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors ${
            uploading ? 'animate-pulse' : ''
          }`
        }, uploading ? 'Uploading...' : 'Upload File')
      )
    )
  );
};

// Upload Preview Modal Component
window.UploadPreviewModal = () => {
  if (!window.showPreview || !window.uploadPreview) return null;

  return React.createElement('div', {
    className: 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50'
  },
    React.createElement('div', {
      className: 'bg-white rounded-lg p-6 max-w-6xl max-h-5/6 overflow-auto'
    },
      React.createElement('div', {
        className: 'flex justify-between items-center mb-4'
      },
        React.createElement('h3', {
          className: 'text-lg font-semibold'
        }, 'Bulk Upload Preview - Smart Client Detection'),
        React.createElement('button', {
          onClick: () => window.setShowPreview(false),
          className: 'text-gray-400 hover:text-gray-600'
        }, '✕')
      ),

      // Summary
      React.createElement('div', {
        className: 'mb-6 p-4 bg-blue-50 rounded-lg'
      },
        React.createElement('h4', {
          className: 'font-semibold mb-2'
        }, '📊 Upload Summary'),
        React.createElement('div', {
          className: 'grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'
        },
          React.createElement('div', null,
            React.createElement('span', { className: 'font-medium' }, 'Total Rows: '),
            window.uploadPreview.total_rows
          ),
          React.createElement('div', null,
            React.createElement('span', { className: 'font-medium' }, 'Existing Clients: '),
            window.uploadPreview.client_detection_summary.existing_clients_found
          ),
          React.createElement('div', null,
            React.createElement('span', { className: 'font-medium' }, 'New Clients: '),
            window.uploadPreview.client_detection_summary.new_clients
          ),
          React.createElement('div', null,
            React.createElement('span', { className: 'font-medium' }, 'Will Auto-assign: '),
            window.uploadPreview.client_detection_summary.will_be_client_assigned
          )
        )
      ),

      // Preview Table
      React.createElement('div', {
        className: 'overflow-x-auto'
      },
        React.createElement('table', {
          className: 'min-w-full table-auto border-collapse border'
        },
          React.createElement('thead', null,
            React.createElement('tr', { className: 'bg-gray-50' },
              React.createElement('th', { className: 'border p-2 text-left' }, 'Row'),
              React.createElement('th', { className: 'border p-2 text-left' }, 'Name'),
              React.createElement('th', { className: 'border p-2 text-left' }, 'Phone'),
              React.createElement('th', { className: 'border p-2 text-left' }, 'CSV Assignment'),
              React.createElement('th', { className: 'border p-2 text-left' }, 'Client Status'),
              React.createElement('th', { className: 'border p-2 text-left' }, 'Final Assignment'),
              React.createElement('th', { className: 'border p-2 text-left' }, 'Existing Leads')
            )
          ),
          React.createElement('tbody', null,
            window.uploadPreview.preview.map((row, index) =>
              React.createElement('tr', {
                key: index,
                className: row.client_detected ? 'bg-yellow-50' : 'bg-white'
              },
                React.createElement('td', { className: 'border p-2' }, row.row),
                React.createElement('td', { className: 'border p-2' }, row.name),
                React.createElement('td', { className: 'border p-2' }, row.phone),
                React.createElement('td', { className: 'border p-2' }, row.assigned_to_in_csv || 'None'),
                React.createElement('td', { className: 'border p-2' },
                  row.client_detected ? 
                  React.createElement('span', {
                    className: 'bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs'
                  }, '📞 Existing Client') :
                  React.createElement('span', {
                    className: 'bg-green-200 text-green-800 px-2 py-1 rounded text-xs'
                  }, '👤 New Client')
                ),
                React.createElement('td', { className: 'border p-2' },
                  React.createElement('span', {
                    className: row.will_override_assignment ? 'bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs' : ''
                  }, row.final_assigned_to)
                ),
                React.createElement('td', { className: 'border p-2' },
                  row.existing_leads_count > 0 ? 
                  React.createElement('span', { className: 'text-sm' },
                    `${row.existing_leads_count} leads`,
                    row.existing_events.length > 0 && 
                    React.createElement('div', { className: 'text-xs text-gray-600' },
                      `Events: ${row.existing_events.join(', ')}`
                    )
                  ) : 'None'
                )
              )
            )
          )
        )
      ),

      // Action Buttons
      React.createElement('div', {
        className: 'mt-6 flex justify-end space-x-3'
      },
        React.createElement('button', {
          onClick: () => window.setShowPreview(false),
          className: 'px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50'
        }, 'Cancel'),
        React.createElement('button', {
          onClick: () => {
            window.handleProceedFromPreview();
          },
          className: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
        }, 'Continue to Upload')
      )
    )
  );
};

// Client Detection Results Modal Component
window.ClientDetectionResultsModal = () => {
  if (!window.showClientDetectionResults || !window.clientDetectionResults.length) return null;

  return React.createElement('div', {
    className: 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50'
  },
    React.createElement('div', {
      className: 'bg-white rounded-lg p-6 max-w-4xl max-h-5/6 overflow-auto'
    },
      React.createElement('div', {
        className: 'flex justify-between items-center mb-4'
      },
        React.createElement('h3', {
          className: 'text-lg font-semibold'
        }, '🔍 Smart Client Detection Results'),
        React.createElement('button', {
          onClick: () => window.setShowClientDetectionResults(false),
          className: 'text-gray-400 hover:text-gray-600'
        }, '✕')
      ),

      React.createElement('div', {
        className: 'overflow-x-auto'
      },
        React.createElement('table', {
          className: 'min-w-full table-auto border-collapse border'
        },
          React.createElement('thead', null,
            React.createElement('tr', { className: 'bg-gray-50' },
              React.createElement('th', { className: 'border p-2 text-left' }, 'Row'),
              React.createElement('th', { className: 'border p-2 text-left' }, 'Lead Name'),
              React.createElement('th', { className: 'border p-2 text-left' }, 'Phone'),
              React.createElement('th', { className: 'border p-2 text-left' }, 'Existing Leads'),
              React.createElement('th', { className: 'border p-2 text-left' }, 'Assigned To'),
              React.createElement('th', { className: 'border p-2 text-left' }, 'Previous Events')
            )
          ),
          React.createElement('tbody', null,
            window.clientDetectionResults.map((result, index) =>
              React.createElement('tr', {
                key: index,
                className: 'bg-yellow-50'
              },
                React.createElement('td', { className: 'border p-2' }, result.row),
                React.createElement('td', { className: 'border p-2' }, result.lead_name),
                React.createElement('td', { className: 'border p-2' }, result.phone),
                React.createElement('td', { className: 'border p-2' }, result.total_existing_leads),
                React.createElement('td', { className: 'border p-2' }, result.assigned_to_from_detection),
                React.createElement('td', { className: 'border p-2' },
                  result.existing_events?.length > 0 ?
                  React.createElement('div', { className: 'text-sm' },
                    result.existing_events.join(', ')
                  ) : 'None'
                )
              )
            )
          )
        )
      ),

      React.createElement('div', {
        className: 'mt-6 flex justify-end'
      },
        React.createElement('button', {
          onClick: () => window.setShowClientDetectionResults(false),
          className: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
        }, 'Close')
      )
    )
  );
};

// CORRECTED: Inventory CSV Template with actual FanToPark CRM fields
// Replace your existing downloadSampleCSV function with this:

window.downloadSampleCSV = function() {
  const type = window.csvUploadType || 'inventory';
  
  if (type === 'inventory') {
    downloadInventoryCSVTemplate();
  } else if (type === 'leads') {
    // Keep existing leads function since user said it's working fine
    if (typeof window.downloadLeadsCSVTemplate === 'function') {
      window.downloadLeadsCSVTemplate();
    } else {
      alert('Leads CSV template not found. Please use the existing working template.');
    }
  }
};

// CORRECTED: Actual inventory fields from your form
function downloadInventoryCSVTemplate() {
  // These are the EXACT fields from your inventory form
  const headers = [
    'event_name',           // Event Name (required)
    'event_date',           // Event Date (required) - YYYY-MM-DD format
    'event_type',           // Event Type (required) - IPL, India Cricket + ICC, Football, Tennis, F1, Miscellaneous
    'sports',               // Sports Category (required) - Cricket, Football, Tennis, etc.
    'venue',                // Venue (required) - Stadium name
    'day_of_match',         // Day of Match - Day 1, Day 2, Day 3, Day 4, Day 5, Not Applicable
    'category_of_ticket',   // Category of Ticket (required) - VIP, Premium, Gold, Silver, Bronze, General, Corporate Box, Hospitality
    'stand',                // Stand/Section - e.g., North Stand, East Pavilion
    'total_tickets',        // Total Tickets (required) - number
    'available_tickets',    // Available Tickets (required) - number
    'mrp_of_ticket',        // MRP of Ticket (₹) (required) - number
    'buying_price',         // Buying Price (₹) (required) - number
    'selling_price',        // Selling Price (₹) (required) - number
    'inclusions',           // Inclusions - Food, Beverages, Parking, etc.
    'booking_person',       // Booking Person (required) - Who purchased
    'procurement_type',     // Procurement Type - pre_inventory, on_demand, partnership, direct_booking
    'notes',                // Additional Notes
    'paymentStatus',        // Payment Status - paid, pending
    'supplierName',         // Supplier Name
    'supplierInvoice',      // Supplier Invoice #
    'totalPurchaseAmount',  // Total Purchase Amount - number
    'amountPaid',           // Amount Paid - number
    'paymentDueDate'        // Payment Due Date - YYYY-MM-DD format
  ];
  
  // Sample data with your actual field values
  const sampleData = [
    [
      'IPL Mumbai vs Chennai Final',           // event_name
      '2024-12-25',                           // event_date
      'IPL',                                  // event_type
      'Cricket',                              // sports
      'Wankhede Stadium',                     // venue
      'Not Applicable',                       // day_of_match
      'VIP',                                  // category_of_ticket
      'North Stand',                          // stand
      '100',                                  // total_tickets
      '100',                                  // available_tickets
      '8000',                                 // mrp_of_ticket
      '6000',                                 // buying_price
      '7500',                                 // selling_price
      'Premium food, beverages, parking',     // inclusions
      'Sports Events Ltd',                    // booking_person
      'pre_inventory',                        // procurement_type
      'Premium match tickets with hospitality', // notes
      'paid',                                 // paymentStatus
      'Mumbai Sports Supplier',               // supplierName
      'INV-2024-001',                        // supplierInvoice
      '600000',                              // totalPurchaseAmount
      '600000',                              // amountPaid
      '2024-12-20'                           // paymentDueDate
    ],
    [
      'Tennis Grand Slam Quarterfinal',       // event_name
      '2024-12-31',                          // event_date
      'Tennis',                              // event_type
      'Tennis',                              // sports
      'Delhi Tennis Complex',                // venue
      'Not Applicable',                      // day_of_match
      'Premium',                             // category_of_ticket
      'Center Court',                        // stand
      '50',                                  // total_tickets
      '45',                                  // available_tickets
      '5000',                                // mrp_of_ticket
      '3500',                                // buying_price
      '4500',                                // selling_price
      'Refreshments, reserved seating',      // inclusions
      'Tennis Pro Events',                   // booking_person
      'on_demand',                           // procurement_type
      'Center court premium seating',        // notes
      'pending',                             // paymentStatus
      'Delhi Sports Distributor',           // supplierName
      '',                                    // supplierInvoice
      '175000',                              // totalPurchaseAmount
      '100000',                              // amountPaid
      '2024-12-28'                          // paymentDueDate
    ]
  ];

  let csvContent = "data:text/csv;charset=utf-8,";
  
  // Add headers
  csvContent += headers.join(',') + '\n';
  
  // Add sample data
  sampleData.forEach(row => {
    csvContent += row.map(field => `"${field}"`).join(',') + '\n';
  });

  // Create download
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "fantopark_inventory_template.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log("✅ Corrected inventory CSV template downloaded with actual FanToPark fields");
}

// Make sure this function is available globally
window.downloadInventoryCSVTemplate = downloadInventoryCSVTemplate;

console.log('✅ Corrected CSV Download Functions loaded with actual inventory fields');

console.log('✅ CSV Upload System component loaded successfully');
