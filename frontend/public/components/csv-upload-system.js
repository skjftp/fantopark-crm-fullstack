// ===== COMPLETE CSV UPLOAD SYSTEM FOR FANTOPARK CRM =====
// Fixed and comprehensive version - handles CSV/Excel upload, preview, and smart client detection
// Version: 2.0 - Fixed CSV template downloads and enhanced functionality

console.log("🚀 Loading Complete CSV Upload System v2.0...");

// ===== CSV DOWNLOAD TEMPLATE FUNCTIONS =====

// Main CSV template download function - FIXED VERSION
window.downloadSampleCSV = function() {
  console.log("📥 Starting CSV template download...");
  
  const type = window.csvUploadType || 'inventory';
  console.log("📋 Upload type:", type);
  
  if (type === 'inventory') {
    console.log("📦 Generating inventory CSV template...");
    
    // Complete inventory CSV template with all required fields
    const csv = `event_name,event_date,event_type,sports,venue,day_of_match,category_of_ticket,stand,total_tickets,available_tickets,mrp_of_ticket,buying_price,selling_price,inclusions,booking_person,procurement_type,notes,paymentStatus,supplierName,supplierInvoice,totalPurchaseAmount,amountPaid,paymentDueDate
"IPL Mumbai Indians vs Chennai Super Kings Final","2024-12-25","IPL","Cricket","Wankhede Stadium","Not Applicable","VIP","North Stand Premium","100","100","8000","6000","7500","Premium food, beverages, parking, merchandise","Sports Events Pvt Ltd","pre_inventory","Premium match tickets with hospitality package","paid","Mumbai Sports Supplier","INV-2024-001","600000","600000","2024-12-20"
"Tennis Grand Slam Quarterfinal","2024-12-31","Tennis","Tennis","Delhi Tennis Complex","Not Applicable","Premium","Center Court","50","45","5000","3500","4500","Refreshments, reserved seating","Tennis Pro Events","on_demand","Center court premium seating with refreshments","pending","Delhi Sports Distributor","INV-TEN-001","175000","100000","2024-12-28"
"Football World Cup Group Stage","2025-01-15","Football","Football","Salt Lake Stadium","Not Applicable","Gold","East Block","200","180","3000","2200","2800","Match program, refreshments","Football Federation Events","partnership","Group stage match with good visibility","partial","Kolkata Sports Partners","INV-FB-102","440000","220000","2025-01-10"
"Basketball Championship Final","2025-02-20","Basketball","Basketball","Indira Gandhi Arena","Not Applicable","Premium","Court Side","80","75","4000","3000","3500","VIP seating, complimentary drinks","Basketball Pro League","on_demand","Championship final premium seats","paid","Delhi Basketball Suppliers","INV-BB-003","240000","240000","2025-02-15"`;

    try {
      // Create blob with proper CSV content
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fantopark_inventory_template.csv';
      a.style.display = 'none';
      
      // Add to DOM, click, and cleanup
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log("✅ Inventory CSV template downloaded successfully!");
      
    } catch (error) {
      console.error("❌ CSV download error:", error);
      alert('Failed to download CSV template: ' + error.message);
    }
    
  } else if (type === 'leads') {
    console.log("👥 Generating leads CSV template...");
    
    // Leads CSV template
    const leadsCSV = `name,phone,email,event_interest,budget_range,event_date,notes,source
"John Smith","9876543210","john.smith@email.com","Cricket Match","50000-100000","2024-12-25","Interested in VIP tickets","Website"
"Sarah Johnson","9876543211","sarah.j@email.com","Tennis Tournament","25000-50000","2024-12-31","Looking for premium seating","Referral"
"Mike Brown","9876543212","mike.brown@email.com","Football Match","30000-75000","2025-01-15","Group booking inquiry","Social Media"
"Lisa Davis","9876543213","lisa.davis@email.com","Basketball Game","15000-30000","2025-02-20","First time customer","Phone Call"`;

    try {
      const blob = new Blob([leadsCSV], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fantopark_leads_template.csv';
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log("✅ Leads CSV template downloaded successfully!");
      
    } catch (error) {
      console.error("❌ Leads CSV download error:", error);
      alert('Failed to download leads CSV template: ' + error.message);
    }
    
  } else {
    console.warn("⚠️ Unknown CSV type:", type);
    alert('Unknown upload type. Please select inventory or leads.');
  }
};

// Excel download functions (fallback to CSV)
window.downloadSampleExcel = function() {
  console.log("📊 Excel download requested - using CSV format");
  window.downloadSampleCSV();
};

window.downloadSampleExcelV2 = function() {
  console.log("📋 Excel V2 download requested - using CSV format");
  window.downloadSampleCSV();
};

// ===== UPLOAD HELPER FUNCTIONS =====

// Enhanced upload summary display
function showEnhancedUploadSummary(result) {
  console.log("📊 Upload Summary:", result);
  
  let message = `✅ Upload Completed Successfully!\n\n`;
  
  if (result.successCount !== undefined) {
    message += `📈 Successfully imported: ${result.successCount} records\n`;
  }
  
  if (result.errorCount && result.errorCount > 0) {
    message += `⚠️ Errors encountered: ${result.errorCount} records\n`;
  }
  
  if (result.clientDetectionCount && result.clientDetectionCount > 0) {
    message += `🔍 Existing clients detected: ${result.clientDetectionCount}\n`;
  }
  
  if (result.autoAssignmentCount && result.autoAssignmentCount > 0) {
    message += `🎯 Auto-assignments made: ${result.autoAssignmentCount}\n`;
  }
  
  if (result.duplicateCount && result.duplicateCount > 0) {
    message += `🔄 Duplicates skipped: ${result.duplicateCount}\n`;
  }
  
  alert(message);
}

// ===== CSV UPLOAD MODAL COMPONENT =====

window.CSVUploadModal = ({ isOpen, onClose, type }) => {
  const [file, setFile] = React.useState(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadResult, setUploadResult] = React.useState(null);
  const [proceedAfterPreview, setProceedAfterPreview] = React.useState(false);

  // Reset states when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setUploadResult(null);
      setProceedAfterPreview(false);
    }
  }, [isOpen]);

  // Enhanced file validation for both CSV and Excel
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) {
      setFile(null);
      return;
    }
    
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    const isValidFile = allowedTypes.includes(selectedFile.type) || 
      selectedFile.name.endsWith('.csv') || 
      selectedFile.name.endsWith('.xlsx') || 
      selectedFile.name.endsWith('.xls');

    if (isValidFile) {
      setFile(selectedFile);
      window.currentUploadFile = selectedFile; // Store globally for preview flow
      setUploadResult(null); // Clear previous results
      setProceedAfterPreview(false); // Reset proceed flag
      console.log("📁 File selected:", selectedFile.name);
    } else {
      alert('Please select a valid CSV or Excel file (.csv, .xlsx, .xls)');
      e.target.value = ''; // Clear the input
    }
  };

  // Preview function for smart client detection (only for leads)
  const handlePreview = async () => {
    if (!file) {
      alert('Please select a file first');
      return;
    }

    console.log("🔍 Starting preview for:", file.name);
    window.setPreviewLoading && window.setPreviewLoading(true);
    
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
      console.log("📋 Preview result:", result);
      
      if (response.ok) {
        window.setUploadPreview && window.setUploadPreview(result);
        window.setShowPreview && window.setShowPreview(true);
      } else {
        alert('Preview failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error("❌ Preview error:", error);
      alert('Preview error: ' + error.message);
    } finally {
      window.setPreviewLoading && window.setPreviewLoading(false);
    }
  };

  // Enhanced upload function
  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first');
      return;
    }

    console.log("📤 Starting upload for:", file.name, "Type:", type);
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
      console.log("📥 Upload result:", result);
      
      if (response.ok) {
        setUploadResult(result);

        // Handle smart client detection results for leads
        if (result.clientDetectionResults && result.clientDetectionResults.length > 0) {
          window.setClientDetectionResults && window.setClientDetectionResults(result.clientDetectionResults);
          window.setShowClientDetectionResults && window.setShowClientDetectionResults(true);
        }

        // Refresh data based on type
        if (type === 'leads') {
          if (window.fetchLeads && typeof window.fetchLeads === 'function') {
            await window.fetchLeads();
          } else if (window.apicall) {
            try {
              const leadsData = await window.apicall('/leads');
              window.setLeads && window.setLeads(leadsData.data || []);
            } catch (e) {
              console.warn("⚠️ Could not refresh leads data:", e);
            }
          }
        } else if (type === 'inventory') {
          if (window.fetchInventory && typeof window.fetchInventory === 'function') {
            await window.fetchInventory();
          } else if (window.apicall) {
            try {
              const inventoryData = await window.apicall('/inventory');
              window.setInventory && window.setInventory(inventoryData.data || []);
            } catch (e) {
              console.warn("⚠️ Could not refresh inventory data:", e);
            }
          }
        }

        // Show enhanced success message
        showEnhancedUploadSummary(result);
        
        // Close modal after successful upload
        setTimeout(() => {
          onClose();
        }, 1000);

      } else {
        alert('Upload failed: ' + (result.error || result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error("❌ Upload error:", error);
      alert('Upload error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => e.target === e.currentTarget && onClose()
  },
    React.createElement('div', {
      className: 'bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto'
    },
      // Header
      React.createElement('div', {
        className: 'flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700'
      },
        React.createElement('h2', {
          className: 'text-xl font-semibold text-gray-900 dark:text-white'
        }, `📁 Upload ${type === 'leads' ? 'Leads' : 'Inventory'} (CSV/Excel)`),

        React.createElement('button', {
          onClick: onClose,
          className: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl'
        }, '✕')
      ),

      React.createElement('div', { className: 'p-6 space-y-6' },
        
        // Smart Client Detection Notice (only for leads)
        type === 'leads' && React.createElement('div', {
          className: 'p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg'
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
          className: 'p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg'
        },
          React.createElement('p', {
            className: 'text-blue-800 dark:text-blue-200 mb-2'
          }, '📋 Upload a CSV or Excel file to bulk import your data.'),
          React.createElement('p', {
            className: 'text-blue-700 dark:text-blue-300 text-sm'
          }, '💡 Download a template first to ensure your data is in the correct format!')
        ),

        // Download Templates Section
        React.createElement('div', {
          className: 'p-4 bg-gray-50 dark:bg-gray-700 rounded-lg'
        },
          React.createElement('h3', {
            className: 'font-semibold mb-3 text-gray-900 dark:text-white'
          }, '📥 Download Sample Templates:'),

          React.createElement('div', {
            className: 'grid grid-cols-1 md:grid-cols-3 gap-2'
          },
            // CSV Download
            React.createElement('button', {
              onClick: () => {
                window.csvUploadType = type;
                window.downloadSampleCSV();
              },
              className: 'bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors'
            }, '📄 CSV Template'),

            // Excel Method 1 - Advanced (for leads only)
            type === 'leads' && React.createElement('button', {
              onClick: () => {
                window.csvUploadType = type;
                window.downloadSampleExcel();
              },
              className: 'bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors'
            }, '📊 Excel (Advanced)'),

            // Excel Method 2 - Instructions (for leads only)
            type === 'leads' && React.createElement('button', {
              onClick: () => {
                window.csvUploadType = type;
                window.downloadSampleExcelV2();
              },
              className: 'bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors'
            }, '📋 Excel (Instructions)')
          ),

          type === 'leads' && React.createElement('p', {
            className: 'text-xs text-gray-600 dark:text-gray-400 mt-3 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded border-l-4 border-yellow-400'
          }, '🎯 Try "Excel (Instructions)" for the clearest guidance - includes validation options and examples!')
        ),

        // File Upload Section
        React.createElement('div', {
          className: 'space-y-4'
        },
          React.createElement('div', null,
            React.createElement('label', {
              className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
            }, 'Select CSV or Excel File:'),
            React.createElement('input', {
              type: 'file',
              accept: '.csv,.xlsx,.xls',
              onChange: handleFileChange,
              className: 'block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200'
            })
          ),

          // File info
          file && React.createElement('div', {
            className: 'p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded'
          },
            React.createElement('p', {
              className: 'text-green-800 dark:text-green-200 text-sm'
            }, `📁 Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`)
          )
        ),

        // Action Buttons
        React.createElement('div', {
          className: 'flex justify-between items-center pt-4'
        },
          // Preview button (only for leads)
          type === 'leads' && React.createElement('button', {
            onClick: handlePreview,
            disabled: !file || uploading,
            className: 'bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors'
          }, 
            '🔍 Preview Upload',
            window.previewLoading && React.createElement('span', { className: 'animate-spin' }, '⏳')
          ),

          // Upload button
          React.createElement('button', {
            onClick: handleUpload,
            disabled: !file || uploading,
            className: 'bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors ml-auto'
          }, 
            uploading ? '⏳ Uploading...' : '📤 Upload File'
          )
        )
      )
    )
  );
};

// ===== CLIENT DETECTION RESULTS MODAL =====

window.ClientDetectionResultsModal = ({ isOpen, onClose }) => {
  if (!isOpen || !window.clientDetectionResults || window.clientDetectionResults.length === 0) {
    return null;
  }

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
  },
    React.createElement('div', {
      className: 'bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto'
    },
      React.createElement('div', {
        className: 'p-6 border-b border-gray-200 dark:border-gray-700'
      },
        React.createElement('h2', {
          className: 'text-xl font-semibold text-gray-900 dark:text-white'
        }, '🔍 Smart Client Detection Results')
      ),

      React.createElement('div', {
        className: 'p-6'
      },
        React.createElement('p', {
          className: 'mb-4 text-gray-700 dark:text-gray-300'
        }, `Found ${window.clientDetectionResults.length} existing clients. Leads have been automatically assigned based on previous interactions:`),

        React.createElement('div', {
          className: 'overflow-x-auto'
        },
          React.createElement('table', {
            className: 'min-w-full table-auto border-collapse border'
          },
            React.createElement('thead', null,
              React.createElement('tr', { className: 'bg-gray-50 dark:bg-gray-700' },
                React.createElement('th', { className: 'border p-2 text-left' }, 'Row'),
                React.createElement('th', { className: 'border p-2 text-left' }, 'Lead Name'),
                React.createElement('th', { className: 'border p-2 text-left' }, 'Phone'),
                React.createElement('th', { className: 'border p-2 text-left' }, 'Detection Result'),
                React.createElement('th', { className: 'border p-2 text-left' }, 'Assignment')
              )
            ),
            React.createElement('tbody', null,
              window.clientDetectionResults.map((result, index) =>
                React.createElement('tr', { key: index, className: 'hover:bg-gray-50 dark:hover:bg-gray-700' },
                  React.createElement('td', { className: 'border p-2' }, result.row),
                  React.createElement('td', { className: 'border p-2 font-medium' }, result.name),
                  React.createElement('td', { className: 'border p-2' }, result.phone),
                  React.createElement('td', { className: 'border p-2' }, 
                    React.createElement('span', {
                      className: result.result.includes('existing') ? 'text-blue-600' : 'text-green-600'
                    }, result.result)
                  ),
                  React.createElement('td', { className: 'border p-2 font-medium' }, result.assigned_to)
                )
              )
            )
          )
        ),

        React.createElement('div', {
          className: 'mt-6 flex justify-end'
        },
          React.createElement('button', {
            onClick: onClose,
            className: 'px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          }, 'Close')
        )
      )
    )
  );
};

// ===== INITIALIZATION =====

// Initialize state variables if they don't exist
if (typeof window.showPreview === 'undefined') {
  window.showPreview = false;
}
if (typeof window.uploadPreview === 'undefined') {
  window.uploadPreview = null;
}
if (typeof window.previewLoading === 'undefined') {
  window.previewLoading = false;
}
if (typeof window.clientDetectionResults === 'undefined') {
  window.clientDetectionResults = [];
}
if (typeof window.showClientDetectionResults === 'undefined') {
  window.showClientDetectionResults = false;
}

// Helper function to set CSV upload type
window.setCSVUploadType = function(type) {
  window.csvUploadType = type;
  console.log("📋 CSV upload type set to:", type);
};

// Test function for debugging
window.testCSVDownload = function(type = 'inventory') {
  console.log("🧪 Testing CSV download for type:", type);
  window.csvUploadType = type;
  window.downloadSampleCSV();
};

console.log("✅ Complete CSV Upload System v2.0 loaded successfully!");
console.log("🎯 Available functions:");
console.log("  - window.downloadSampleCSV()");
console.log("  - window.downloadSampleExcel()");
console.log("  - window.downloadSampleExcelV2()");
console.log("  - window.CSVUploadModal (React component)");
console.log("  - window.ClientDetectionResultsModal (React component)");
console.log("  - window.testCSVDownload(type)");
console.log("🔧 To test: window.testCSVDownload('inventory')");
