// ===== FANTOPARK CRM - CSV UPLOAD SYSTEM (CLEAN VERSION) =====
// Complete implementation with all functionality, no debug logs

// ===== MAIN CSV DOWNLOAD FUNCTION =====

window.downloadSampleCSV = function(eventOrType) {
  let type = eventOrType;
  if (typeof eventOrType !== 'string') {
    type = window.csvUploadType || 'inventory';
  }
  
  let csvContent, filename;
  
  if (type === 'leads') {
    filename = 'fantopark_leads_template.csv';
    csvContent = 'name,email,phone,company,business_type,source,date_of_enquiry,first_touch_base_done_by,city_of_residence,country_of_residence,lead_for_event,number_of_people,has_valid_passport,visa_available,attended_sporting_event_before,annual_income_bracket,potential_value,status,assigned_to,last_quoted_price,notes\n';
    csvContent += '"John Smith","john.smith@email.com","9876543210","Smith Enterprises","B2B","LinkedIn","2024-12-25","Ankita","Mumbai City North East","India","Cricket Match","4","Yes","Not Required","Yes","₹50-100 Lakhs","150000","contacted","Ankita","140000","Interested in VIP cricket packages"\n';
    csvContent += '"Sarah Johnson","sarah.j@email.com","9876543211","","B2C","Instagram","2024-12-31","Varun","Delhi NCR","India","Tennis Tournament","2","Yes","Yes","No","₹25-50 Lakhs","75000","qualified","Varun","70000","First time sports event attendee"\n';
    csvContent += '"Mike Brown","mike.brown@email.com","9876543212","Tech Solutions Ltd","B2B","Website","2025-01-15","Pratik","Bangalore City","India","Football Match","8","No","Processing","Yes","₹100+ Lakhs","200000","warm","Pratik","190000","Large group booking for international match"\n';
    csvContent += '"Lisa Davis","lisa.davis@email.com","9876543213","","B2C","Friends and Family","2025-02-20","Rahul","Chennai Metro","India","Basketball Game","1","Yes","Not Required","No","₹10-25 Lakhs","25000","hot","Rahul","24000","Ready to book premium basketball seats"';
  } else {
    filename = 'fantopark_inventory_template.csv';
    csvContent = 'event_name,event_date,event_type,sports,venue,day_of_match,category_of_ticket,stand,total_tickets,available_tickets,mrp_of_ticket,buying_price,selling_price,inclusions,booking_person,procurement_type,notes,paymentStatus,supplierName,supplierInvoice,totalPurchaseAmount,amountPaid,paymentDueDate\n';
    csvContent += '"IPL Mumbai Indians vs Chennai Super Kings Final","2024-12-25","IPL","Cricket","Wankhede Stadium","Not Applicable","VIP","North Stand Premium","100","100","8000","6000","7500","Premium food, beverages, parking, merchandise","Sports Events Pvt Ltd","pre_inventory","Premium match tickets with hospitality package","paid","Mumbai Sports Supplier","INV-2024-001","600000","600000","2024-12-20"\n';
    csvContent += '"Tennis Grand Slam Quarterfinal","2024-12-31","Tennis","Tennis","Delhi Tennis Complex","Not Applicable","Premium","Center Court","50","45","5000","3500","4500","Refreshments, reserved seating","Tennis Pro Events","on_demand","Center court premium seating with refreshments","pending","Delhi Sports Distributor","INV-TEN-001","175000","100000","2024-12-28"\n';
    csvContent += '"Football World Cup Group Stage","2025-01-15","Football","Football","Salt Lake Stadium","Not Applicable","Gold","East Block","200","180","3000","2200","2800","Match program, refreshments","Football Federation Events","partnership","Group stage match with good visibility","partial","Kolkata Sports Partners","INV-FB-102","440000","220000","2025-01-10"\n';
    csvContent += '"Basketball Championship Final","2025-02-20","Basketball","Basketball","Indira Gandhi Arena","Not Applicable","Premium","Court Side","80","75","4000","3000","3500","VIP seating, complimentary drinks","Basketball Pro League","on_demand","Championship final premium seats","paid","Delhi Basketball Suppliers","INV-BB-003","240000","240000","2025-02-15"';
  }
  
  if (!filename) {
    alert('ERROR: No filename generated!');
    return;
  }
  
  try {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    alert('Download failed: ' + error.message);
  }
};

// ===== STATE SYNCHRONIZATION FUNCTIONS =====

window.setCSVUploadType = function(type) {
  window.csvUploadType = type;
  
  let stateUpdated = false;
  
  if (window.appState && window.appState.setCSVUploadType) {
    window.appState.setCSVUploadType(type);
    stateUpdated = true;
  }
  
  if (window.state && window.state.setCSVUploadType) {
    window.state.setCSVUploadType(type);
    stateUpdated = true;
  }
  
  if (typeof setCSVUploadType !== 'undefined' && setCSVUploadType !== window.setCSVUploadType) {
    setCSVUploadType(type);
    stateUpdated = true;
  }
};

// ===== MODAL OPENING FUNCTIONS =====

window.openInventoryCSVUpload = function() {
  window.setCSVUploadType('inventory');
  
  setTimeout(() => {
    if (window.setShowCSVUploadModal) {
      window.setShowCSVUploadModal(true);
    } else {
      alert('Error: Modal function not available. Please check console.');
    }
  }, 100);
};

// ===== CSV MODAL BUTTON HANDLERS =====

window.getFixedCSVModalButtonHandlers = function(type) {
  return {
    csvTemplate: (e) => {
      if (e) e.preventDefault();
      
      const typeToUse = type || window.csvUploadType || 'inventory';
      window.csvUploadType = typeToUse;
      window.downloadSampleCSV(typeToUse);
    },
    
    excelAdvanced: (e) => {
      if (e) e.preventDefault();
      const typeToUse = type || window.csvUploadType || 'leads';
      window.csvUploadType = typeToUse;
      window.downloadSampleExcel();
    },
    
    excelInstructions: (e) => {
      if (e) e.preventDefault();
      const typeToUse = type || window.csvUploadType || 'leads';
      window.csvUploadType = typeToUse;
      window.downloadSampleExcelV2();
    }
  };
};

// ===== EXCEL DOWNLOAD FUNCTIONS =====

window.downloadSampleExcel = function() {
  const typeToUse = window.csvUploadType || 'inventory';
  window.downloadSampleCSV(typeToUse);
};

window.downloadSampleExcelV2 = function() {
  const typeToUse = window.csvUploadType || 'inventory';
  window.downloadSampleCSV(typeToUse);
};

// ===== DIRECT DOWNLOAD SHORTCUTS =====

window.downloadInventoryCSVDirect = function() {
  window.csvUploadType = 'inventory';
  window.downloadSampleCSV('inventory');
};

window.downloadLeadsCSVDirect = function() {
  window.csvUploadType = 'leads';
  window.downloadSampleCSV('leads');
};

// ===== DEBUG AND TEST FUNCTIONS =====

window.debugCSVSystem = function() {
  window.csvUploadType = 'inventory';
  window.downloadSampleCSV('inventory');
  
  window.csvUploadType = 'leads';
  window.downloadSampleCSV('leads');
};

window.testInventoryModal = function() {
  window.openInventoryCSVUpload();
  
  setTimeout(() => {
    window.csvUploadType = 'inventory';
    
    if (window.appState?.setShowCSVUploadModal) {
      window.appState.setShowCSVUploadModal(true);
    } else if (window.state?.setShowCSVUploadModal) {
      window.state.setShowCSVUploadModal(true);
    } else if (window.setShowCSVUploadModal) {
      window.setShowCSVUploadModal(true);
    }
  }, 1000);
};

// ===== CSV UPLOAD MODAL COMPONENT =====

window.CSVUploadModal = ({ isOpen, onClose, type }) => {
  const [file, setFile] = React.useState(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadResult, setUploadResult] = React.useState(null);

  React.useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setUploadResult(null);
    }
  }, [isOpen]);

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
    } else {
      alert('Please select a valid CSV or Excel file (.csv, .xlsx, .xls)');
      e.target.value = '';
    }
  };

  const handlePreview = async () => {
    if (!file) {
      alert('Please select a file first');
      return;
    }

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
      alert('Preview error: ' + error.message);
    } finally {
      window.setPreviewLoading && window.setPreviewLoading(false);
    }
  };

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

        if (result.clientDetectionResults && result.clientDetectionResults.length > 0) {
          window.setClientDetectionResults && window.setClientDetectionResults(result.clientDetectionResults);
          window.setShowClientDetectionResults && window.setShowClientDetectionResults(true);
        }

        try {
          if (type === 'leads' && window.fetchLeads) {
            await window.fetchLeads();
          } else if (type === 'inventory' && window.fetchInventory) {
            await window.fetchInventory();
          } else if (window.apicall) {
            if (type === 'leads') {
              const leadsData = await window.apicall('/leads');
              window.setLeads && window.setLeads(leadsData.data || []);
            } else if (type === 'inventory') {
              const inventoryData = await window.apicall('/inventory');
              window.setInventory && window.setInventory(inventoryData.data || []);
            }
          }
        } catch (refreshError) {
          // Silent fail for refresh
        }

        const message = `✅ Upload completed!\n📈 Imported: ${result.successCount || 0} ${type}\n${result.errorCount ? `⚠️ Errors: ${result.errorCount}\n` : ''}${result.clientDetectionCount ? `🔍 Existing clients: ${result.clientDetectionCount}` : ''}`;
        alert(message);
        
        setTimeout(() => onClose(), 1000);

      } else {
        alert('Upload failed: ' + (result.error || result.message || 'Unknown error'));
      }
    } catch (error) {
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

        React.createElement('div', {
          className: 'p-4 bg-gray-50 dark:bg-gray-700 rounded-lg'
        },
          React.createElement('h3', {
            className: 'font-semibold mb-3 text-gray-900 dark:text-white'
          }, '📥 Download Sample Templates:'),

          React.createElement('div', {
            className: 'grid grid-cols-1 md:grid-cols-3 gap-2'
          },
            React.createElement('button', {
              onClick: window.getFixedCSVModalButtonHandlers(type).csvTemplate,
              className: 'bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors'
            }, '📄 CSV Template'),

            type === 'leads' && React.createElement('button', {
              onClick: window.getFixedCSVModalButtonHandlers(type).excelAdvanced,
              className: 'bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors'
            }, '📊 Excel (Advanced)'),

            type === 'leads' && React.createElement('button', {
              onClick: window.getFixedCSVModalButtonHandlers(type).excelInstructions,
              className: 'bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors'
            }, '📋 Excel (Instructions)')
          ),

          type === 'leads' && React.createElement('p', {
            className: 'text-xs text-gray-600 dark:text-gray-400 mt-3 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded border-l-4 border-yellow-400'
          }, '🎯 Try "Excel (Instructions)" for the clearest guidance!')
        ),

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

          file && React.createElement('div', {
            className: 'p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded'
          },
            React.createElement('p', {
              className: 'text-green-800 dark:text-green-200 text-sm'
            }, `📁 Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`)
          )
        ),

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

        React.createElement('div', {
          className: 'flex justify-between items-center gap-3 pt-4'
        },
          type === 'leads' ? React.createElement('button', {
            onClick: handlePreview,
            disabled: !file || uploading,
            className: 'bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors'
          }, 
            window.previewLoading ? 'Loading...' : '🔍 Preview'
          ) : React.createElement('div'),

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

// ===== HELPER MODALS =====

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
        }, 'Upload Preview'),
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
          className: 'px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50'
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

// ===== INITIALIZATION =====

if (typeof window.csvUploadType === 'undefined') {
  window.csvUploadType = 'inventory';
}

if (typeof window.clientDetectionResults === 'undefined') {
  window.clientDetectionResults = [];
}
