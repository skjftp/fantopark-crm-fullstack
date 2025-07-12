// ===== FANTOPARK CRM - CSV UPLOAD SYSTEM (FIXED VERSION) =====
// This version fixes the CSV download template issue permanently
// Version: 3.0 - Emergency fix integrated

console.log("🚀 Loading FanToPark CSV Upload System v3.0 (Fixed)");

// ===== PRIORITY FIX: CSV DOWNLOAD FUNCTIONS =====
// These functions MUST be defined first to override any broken versions

window.downloadSampleCSV = function() {
  console.log("📥 [FIXED] CSV template download starting...");
  
  const type = window.csvUploadType || 'inventory';
  console.log("📋 Upload type:", type);
  
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
    console.warn("⚠️ Unknown CSV type:", type, "- defaulting to inventory");
    filename = 'fantopark_template.csv';
    csvContent = 'Please select a valid upload type (inventory or leads)';
  }
  
  console.log("📄 CSV content prepared:", csvContent.length, "characters");
  console.log("📁 Filename:", filename);
  
  try {
    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create temporary download element
    const downloadElement = document.createElement('a');
    downloadElement.href = url;
    downloadElement.download = filename;
    downloadElement.style.display = 'none';
    
    // Trigger download
    document.body.appendChild(downloadElement);
    downloadElement.click();
    document.body.removeChild(downloadElement);
    
    // Clean up
    URL.revokeObjectURL(url);
    
    console.log("✅ CSV template downloaded successfully!");
    
  } catch (error) {
    console.error("❌ Primary download method failed:", error);
    
    // Fallback: Data URL method
    try {
      console.log("🔄 Attempting fallback download method...");
      const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
      const fallbackElement = document.createElement('a');
      fallbackElement.setAttribute("href", dataStr);
      fallbackElement.setAttribute("download", filename);
      fallbackElement.style.display = 'none';
      document.body.appendChild(fallbackElement);
      fallbackElement.click();
      document.body.removeChild(fallbackElement);
      console.log("✅ Fallback download successful!");
    } catch (fallbackError) {
      console.error("❌ Fallback download also failed:", fallbackError);
      alert('Download failed. Please check your browser settings and try again.');
    }
  }
};

// Excel download functions (redirect to CSV)
window.downloadSampleExcel = function() {
  console.log("📊 Excel download -> redirecting to CSV");
  window.downloadSampleCSV();
};

window.downloadSampleExcelV2 = function() {
  console.log("📋 Excel V2 download -> redirecting to CSV");
  window.downloadSampleCSV();
};

console.log("✅ Priority CSV download functions loaded successfully!");

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

  // Preview for leads only
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
        }

        // Success message
        const message = `✅ Upload completed successfully!\n📈 Imported: ${result.successCount || 0} ${type}\n${result.errorCount ? `⚠️ Errors: ${result.errorCount}\n` : ''}${result.clientDetectionCount ? `🔍 Existing clients: ${result.clientDetectionCount}` : ''}`;
        alert(message);
        
        // Close modal
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

        // Download Template Section
        React.createElement('div', {
          className: 'p-4 bg-gray-50 dark:bg-gray-700 rounded-lg'
        },
          React.createElement('h3', {
            className: 'font-semibold mb-3 text-gray-900 dark:text-white'
          }, '📥 Download Sample Template:'),
          React.createElement('button', {
            onClick: () => {
              console.log("🎯 Setting CSV upload type to:", type);
              window.csvUploadType = type;
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
              className: 'block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
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
          className: 'flex justify-between items-center gap-3 pt-4'
        },
          // Preview button (leads only)
          type === 'leads' ? React.createElement('button', {
            onClick: handlePreview,
            disabled: !file || uploading,
            className: 'bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors'
          }, '🔍 Preview') : React.createElement('div'),

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

// ===== CLIENT DETECTION RESULTS MODAL =====

window.ClientDetectionResultsModal = ({ isOpen, onClose }) => {
  if (!isOpen || !window.clientDetectionResults?.length) return null;

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
      React.createElement('div', { className: 'p-6' },
        React.createElement('p', {
          className: 'mb-4 text-gray-700 dark:text-gray-300'
        }, `Found ${window.clientDetectionResults.length} existing clients:`),
        React.createElement('div', { className: 'overflow-x-auto' },
          React.createElement('table', {
            className: 'min-w-full border-collapse border'
          },
            React.createElement('thead', null,
              React.createElement('tr', { className: 'bg-gray-50 dark:bg-gray-700' },
                ['Row', 'Name', 'Phone', 'Result', 'Assignment'].map(header =>
                  React.createElement('th', {
                    key: header,
                    className: 'border p-2 text-left font-medium'
                  }, header)
                )
              )
            ),
            React.createElement('tbody', null,
              window.clientDetectionResults.map((result, index) =>
                React.createElement('tr', {
                  key: index,
                  className: 'hover:bg-gray-50 dark:hover:bg-gray-700'
                },
                  React.createElement('td', { className: 'border p-2' }, result.row),
                  React.createElement('td', { className: 'border p-2 font-medium' }, result.name),
                  React.createElement('td', { className: 'border p-2' }, result.phone),
                  React.createElement('td', { className: 'border p-2' }, result.result),
                  React.createElement('td', { className: 'border p-2 font-medium' }, result.assigned_to)
                )
              )
            )
          )
        ),
        React.createElement('div', { className: 'mt-6 flex justify-end' },
          React.createElement('button', {
            onClick: onClose,
            className: 'px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
          }, 'Close')
        )
      )
    )
  );
};

// ===== HELPER FUNCTIONS =====

// Set CSV upload type
window.setCSVUploadType = function(type) {
  window.csvUploadType = type;
  console.log("📋 CSV upload type set to:", type);
};

// Test function
window.testCSVDownload = function(type = 'inventory') {
  console.log("🧪 Testing CSV download for type:", type);
  window.csvUploadType = type;
  window.downloadSampleCSV();
};

// Initialize state variables
if (typeof window.csvUploadType === 'undefined') {
  window.csvUploadType = '';
}
if (typeof window.clientDetectionResults === 'undefined') {
  window.clientDetectionResults = [];
}

console.log("✅ FanToPark CSV Upload System v3.0 loaded successfully!");
console.log("🎯 Available functions:");
console.log("  - window.downloadSampleCSV() [FIXED]");
console.log("  - window.downloadSampleExcel() [FIXED]");
console.log("  - window.CSVUploadModal (React component)");
console.log("  - window.testCSVDownload(type) [Test function]");
console.log("💡 CSV download issue has been permanently resolved!");
