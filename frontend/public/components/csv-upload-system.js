// ===== FANTOPARK CRM - CSV UPLOAD SYSTEM (FINAL WORKING VERSION) =====
// Based on the console script that worked - bulletproof and reliable
// Version: 5.0 - Console-tested and confirmed working

console.log("🚀 Loading FanToPark CSV Upload System v5.0 (Console-Tested & Working)");

// ===== BULLETPROOF CSV DOWNLOAD FUNCTIONS (CONSOLE-TESTED) =====

window.downloadSampleCSV = function() {
  console.log("🚨 BULLETPROOF CSV DOWNLOAD STARTING...");
  
  // Force detect type from context if not set
  let type = window.csvUploadType;
  
  if (!type) {
    // Try to detect from current page or modal context
    if (window.location.href.includes('inventory') || window.viewMode === 'inventory') {
      type = 'inventory';
      console.log("🎯 Auto-detected type: inventory");
    } else if (window.location.href.includes('leads') || window.viewMode === 'leads') {
      type = 'leads';
      console.log("🎯 Auto-detected type: leads");
    } else {
      type = 'inventory'; // Default fallback
      console.log("🎯 Using default type: inventory");
    }
  }
  
  console.log("📋 Final type:", type);
  
  let csvContent = '';
  let filename = '';
  
  if (type === 'inventory') {
    filename = 'fantopark_inventory_template.csv';
    csvContent = 'event_name,event_date,event_type,sports,venue,day_of_match,category_of_ticket,stand,total_tickets,available_tickets,mrp_of_ticket,buying_price,selling_price,inclusions,booking_person,procurement_type,notes,paymentStatus,supplierName,supplierInvoice,totalPurchaseAmount,amountPaid,paymentDueDate\n';
    csvContent += '"IPL Mumbai Indians vs Chennai Super Kings Final","2024-12-25","IPL","Cricket","Wankhede Stadium","Not Applicable","VIP","North Stand Premium","100","100","8000","6000","7500","Premium food, beverages, parking, merchandise","Sports Events Pvt Ltd","pre_inventory","Premium match tickets with hospitality package","paid","Mumbai Sports Supplier","INV-2024-001","600000","600000","2024-12-20"\n';
    csvContent += '"Tennis Grand Slam Quarterfinal","2024-12-31","Tennis","Tennis","Delhi Tennis Complex","Not Applicable","Premium","Center Court","50","45","5000","3500","4500","Refreshments, reserved seating","Tennis Pro Events","on_demand","Center court premium seating with refreshments","pending","Delhi Sports Distributor","INV-TEN-001","175000","100000","2024-12-28"\n';
    csvContent += '"Football World Cup Group Stage","2025-01-15","Football","Football","Salt Lake Stadium","Not Applicable","Gold","East Block","200","180","3000","2200","2800","Match program, refreshments","Football Federation Events","partnership","Group stage match with good visibility","partial","Kolkata Sports Partners","INV-FB-102","440000","220000","2025-01-10"\n';
    csvContent += '"Basketball Championship Final","2025-02-20","Basketball","Basketball","Indira Gandhi Arena","Not Applicable","Premium","Court Side","80","75","4000","3000","3500","VIP seating, complimentary drinks","Basketball Pro League","on_demand","Championship final premium seats","paid","Delhi Basketball Suppliers","INV-BB-003","240000","240000","2025-02-15"';
  } else if (type === 'leads') {
    filename = 'fantopark_leads_template.csv';
    csvContent = 'name,phone,email,event_interest,budget_range,event_date,notes,source\n';
    csvContent += '"John Smith","9876543210","john.smith@email.com","Cricket Match","50000-100000","2024-12-25","Interested in VIP tickets","Website"\n';
    csvContent += '"Sarah Johnson","9876543211","sarah.j@email.com","Tennis Tournament","25000-50000","2024-12-31","Looking for premium seating","Referral"\n';
    csvContent += '"Mike Brown","9876543212","mike.brown@email.com","Football Match","30000-75000","2025-01-15","Group booking inquiry","Social Media"\n';
    csvContent += '"Lisa Davis","9876543213","lisa.davis@email.com","Basketball Game","15000-30000","2025-02-20","First time customer","Phone Call"';
  } else {
    console.warn("⚠️ Unknown type, using inventory as fallback");
    filename = 'fantopark_inventory_template.csv';
    csvContent = 'event_name,event_date,event_type,sports,venue,day_of_match,category_of_ticket,stand,total_tickets,available_tickets,mrp_of_ticket,buying_price,selling_price,inclusions,booking_person,procurement_type,notes,paymentStatus,supplierName,supplierInvoice,totalPurchaseAmount,amountPaid,paymentDueDate\n';
    csvContent += '"Sample Event","2024-12-25","Sample","Cricket","Sample Stadium","Not Applicable","VIP","Premium","100","100","5000","3500","4500","Sample inclusions","Sample Organizer","pre_inventory","Sample notes","paid","Sample Supplier","INV-001","350000","350000","2024-12-20"';
  }
  
  console.log("📄 CSV content length:", csvContent.length);
  console.log("📁 Filename:", filename);
  
  try {
    // Method 1: Blob download (proven to work in console)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const element = document.createElement('a');
    element.href = url;
    element.download = filename;
    element.style.display = 'none';
    
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(url);
    
    console.log("✅ BULLETPROOF DOWNLOAD SUCCESS!");
    
  } catch (error) {
    console.error("❌ Blob method failed:", error);
    
    // Method 2: Data URL fallback (also proven to work)
    try {
      const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", filename);
      downloadAnchorNode.style.display = 'none';
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      console.log("✅ Fallback method successful!");
    } catch (fallbackError) {
      console.error("❌ Both methods failed:", fallbackError);
      alert('❌ Download failed: ' + fallbackError.message);
    }
  }
};

// Excel download functions (redirect to CSV)
window.downloadSampleExcel = function() {
  console.log("📊 Excel -> CSV redirect");
  window.downloadSampleCSV();
};

window.downloadSampleExcelV2 = function() {
  console.log("📋 Excel V2 -> CSV redirect");
  window.downloadSampleCSV();
};

console.log("✅ Bulletproof CSV download functions loaded!");

// ===== ENHANCED CSV TYPE SETTER =====

window.setCSVUploadType = function(type) {
  console.log("📋 Setting CSV upload type to:", type);
  window.csvUploadType = type;
  
  // Force set in multiple places to ensure it sticks
  if (window.appState) {
    window.appState.csvUploadType = type;
  }
  
  console.log("✅ CSV upload type set successfully");
};

// ===== CSV UPLOAD MODAL COMPONENT =====

window.CSVUploadModal = ({ isOpen, onClose, type }) => {
  const [file, setFile] = React.useState(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadResult, setUploadResult] = React.useState(null);

  // Reset when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setUploadResult(null);
    }
  }, [isOpen]);

  // File validation
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
      window.currentUploadFile = selectedFile;
      setUploadResult(null);
      console.log("📁 File selected:", selectedFile.name, selectedFile.type);
    } else {
      alert('Please select a valid CSV or Excel file (.csv, .xlsx, .xls)');
      e.target.value = '';
    }
  };

  // Preview function (leads only)
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

  // Upload function
  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first');
      return;
    }

    console.log("📤 Starting upload:", file.name, "Type:", type);
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

        // Handle client detection for leads
        if (result.clientDetectionResults && result.clientDetectionResults.length > 0) {
          window.setClientDetectionResults && window.setClientDetectionResults(result.clientDetectionResults);
          window.setShowClientDetectionResults && window.setShowClientDetectionResults(true);
        }

        // Refresh data
        if (type === 'leads' && window.fetchLeads) {
          await window.fetchLeads();
        } else if (type === 'inventory' && window.fetchInventory) {
          await window.fetchInventory();
        } else if (window.apicall) {
          try {
            if (type === 'leads') {
              const leadsData = await window.apicall('/leads');
              window.setLeads && window.setLeads(leadsData.data || []);
            } else if (type === 'inventory') {
              const inventoryData = await window.apicall('/inventory');
              window.setInventory && window.setInventory(inventoryData.data || []);
            }
          } catch (refreshError) {
            console.warn("⚠️ Could not refresh data:", refreshError);
          }
        }

        // Show success message
        const message = `✅ Upload completed successfully!\n📈 Imported: ${result.successCount || 0} ${type}\n${result.errorCount ? `⚠️ Errors: ${result.errorCount}\n` : ''}${result.clientDetectionCount ? `🔍 Existing clients: ${result.clientDetectionCount}` : ''}`;
        alert(message);
        
        // Close modal after success
        setTimeout(() => onClose(), 1000);

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
        
        // Smart Client Detection Notice (leads only)
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
          }, '💡 Download the template first to ensure your data format is correct!')
        ),

        // Download Template Section - FIXED VERSION
        React.createElement('div', {
          className: 'p-4 bg-gray-50 dark:bg-gray-700 rounded-lg'
        },
          React.createElement('h3', {
            className: 'font-semibold mb-3 text-gray-900 dark:text-white'
          }, '📥 Download Sample Template:'),
          React.createElement('button', {
            onClick: () => {
              console.log("🎯 Template button clicked - Setting type to:", type);
              window.csvUploadType = type;
              window.setCSVUploadType && window.setCSVUploadType(type);
              console.log("📋 Calling downloadSampleCSV...");
              window.downloadSampleCSV();
            },
            className: 'bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors w-full sm:w-auto'
          }, '📄 Download CSV Template')
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

        // Upload Results
        uploadResult && React.createElement('div', {
          className: `p-4 rounded-lg ${
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
            }, uploadResult.errorCount > 0 ? 'Upload Completed with Issues' : 'Upload Successful!')
          ),
          React.createElement('div', {
            className: `text-sm ${
              uploadResult.errorCount > 0 
                ? 'text-yellow-700 dark:text-yellow-300' 
                : 'text-green-700 dark:text-green-300'
            }`
          },
            React.createElement('p', null, `✅ Successfully imported: ${uploadResult.successCount} ${type}`),
            uploadResult.errorCount > 0 && React.createElement('p', null, `❌ Failed: ${uploadResult.errorCount} ${type}`)
          )
        ),

        // Action Buttons
        React.createElement('div', {
          className: 'flex justify-between items-center gap-3 pt-4'
        },
          // Preview button (leads only)
          type === 'leads' ? React.createElement('button', {
            onClick: handlePreview,
            disabled: !file || uploading,
            className: 'bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors'
          }, 
            window.previewLoading ? 'Loading...' : '🔍 Preview'
          ) : React.createElement('div'),

          // Upload button
          React.createElement('button', {
            onClick: handleUpload,
            disabled: !file || uploading,
            className: 'bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors'
          }, uploading ? '⏳ Uploading...' : '📤 Upload File')
        )
      )
    )
  );
};

// ===== ADDITIONAL MODALS (Simplified versions) =====

window.UploadPreviewModal = () => {
  if (!window.showPreview || !window.uploadPreview) return null;

  return React.createElement('div', {
    className: 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50'
  },
    React.createElement('div', {
      className: 'bg-white dark:bg-gray-800 rounded-lg p-6 max-w-6xl max-h-[90vh] overflow-auto'
    },
      React.createElement('div', {
        className: 'flex justify-between items-center mb-4'
      },
        React.createElement('h3', {
          className: 'text-lg font-semibold text-gray-900 dark:text-white'
        }, 'Upload Preview - Smart Client Detection'),
        React.createElement('button', {
          onClick: () => window.setShowPreview(false),
          className: 'text-gray-400 hover:text-gray-600 text-2xl'
        }, '✕')
      ),
      React.createElement('div', {
        className: 'mt-6 flex justify-end space-x-3'
      },
        React.createElement('button', {
          onClick: () => window.setShowPreview(false),
          className: 'px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700'
        }, 'Cancel'),
        React.createElement('button', {
          onClick: () => {
            window.handleProceedFromPreview && window.handleProceedFromPreview();
          },
          className: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
        }, 'Continue to Upload')
      )
    )
  );
};

window.ClientDetectionResultsModal = () => {
  if (!window.showClientDetectionResults || !window.clientDetectionResults?.length) return null;

  return React.createElement('div', {
    className: 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50'
  },
    React.createElement('div', {
      className: 'bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto'
    },
      React.createElement('div', {
        className: 'flex justify-between items-center mb-4'
      },
        React.createElement('h3', {
          className: 'text-lg font-semibold text-gray-900 dark:text-white'
        }, '🔍 Smart Client Detection Results'),
        React.createElement('button', {
          onClick: () => window.setShowClientDetectionResults(false),
          className: 'text-gray-400 hover:text-gray-600 text-2xl'
        }, '✕')
      ),
      React.createElement('div', {
        className: 'mt-6 flex justify-end'
      },
        React.createElement('button', {
          onClick: () => window.setShowClientDetectionResults(false),
          className: 'px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
        }, 'Close')
      )
    )
  );
};

// ===== INITIALIZATION & AUTO-DETECTION =====

// Auto-detect CSV type on load
if (window.location.href.includes('inventory') || window.viewMode === 'inventory') {
  console.log("🎯 Auto-detected inventory context");
  window.csvUploadType = 'inventory';
} else if (window.location.href.includes('leads') || window.viewMode === 'leads') {
  console.log("🎯 Auto-detected leads context");
  window.csvUploadType = 'leads';
}

// Initialize state variables
if (typeof window.csvUploadType === 'undefined') {
  window.csvUploadType = '';
}
if (typeof window.clientDetectionResults === 'undefined') {
  window.clientDetectionResults = [];
}

// Test function
window.testCSVDownload = function(type = 'inventory') {
  console.log("🧪 Testing CSV download for type:", type);
  window.csvUploadType = type;
  window.downloadSampleCSV();
};

console.log("✅ FanToPark CSV Upload System v5.0 loaded successfully!");
console.log("🎯 Console-tested and confirmed working!");
console.log("📋 Current CSV type:", window.csvUploadType);
console.log("🧪 To test: window.testCSVDownload('inventory')");
