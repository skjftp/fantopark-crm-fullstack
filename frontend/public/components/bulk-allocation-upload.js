// Bulk Allocation Upload Component
// Allows bulk uploading allocations via CSV file

window.renderBulkAllocationUpload = () => {
  const { useState, useEffect } = React;
  
  // State management
  const [isOpen, setIsOpen] = useState(window.showBulkAllocationUpload || false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Sync with window state
  useEffect(() => {
    window.showBulkAllocationUpload = isOpen;
  }, [isOpen]);

  // Global function to open modal
  window.openBulkAllocationUpload = () => {
    setIsOpen(true);
    setFile(null);
    setPreviewData(null);
    loadUploadHistory();
  };

  // Load upload history
  const loadUploadHistory = async () => {
    try {
      // For now, we'll store history in localStorage
      const history = JSON.parse(localStorage.getItem('bulk_allocation_history') || '[]');
      setUploadHistory(history.slice(0, 10)); // Keep last 10 uploads
    } catch (error) {
      console.error('Error loading upload history:', error);
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setPreviewData(null);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  // Preview allocations
  const handlePreview = async () => {
    if (!file) {
      alert('Please select a file first');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await window.apiCall('/bulk-allocations/preview', {
        method: 'POST',
        body: formData
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setPreviewData(response.data);
    } catch (error) {
      alert('Error previewing allocations: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Process allocations
  const handleProcess = async () => {
    if (!file || !previewData || !previewData.canProceed) {
      alert('Cannot process allocations. Please check the preview.');
      return;
    }

    if (!confirm(`Are you sure you want to allocate ${previewData.summary.total_tickets} tickets across ${previewData.summary.valid_rows} allocations?`)) {
      return;
    }

    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await window.apiCall('/bulk-allocations/process', {
        method: 'POST',
        body: formData
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Save to history
      const historyEntry = {
        id: Date.now(),
        date: new Date().toISOString(),
        filename: file.name,
        processed: response.data.processed_count,
        user: window.user?.name || 'Unknown'
      };

      const history = JSON.parse(localStorage.getItem('bulk_allocation_history') || '[]');
      history.unshift(historyEntry);
      localStorage.setItem('bulk_allocation_history', JSON.stringify(history.slice(0, 10)));

      alert(`Successfully processed ${response.data.processed_count} allocations!`);
      
      // Reset and close
      setFile(null);
      setPreviewData(null);
      setIsOpen(false);

      // Refresh inventory page
      if (window.refreshInventory) {
        window.refreshInventory();
      }
    } catch (error) {
      alert('Error processing allocations: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  // Download template
  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`${window.API_URL}/bulk-allocations/template`, {
        headers: {
          'Authorization': `Bearer ${window.authToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bulk_allocation_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Error downloading template: ' + error.message);
    }
  };

  if (!isOpen) return null;

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
  },
    React.createElement('div', {
      className: 'bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col'
    },
      // Header
      React.createElement('div', {
        className: 'flex justify-between items-center p-6 border-b dark:border-gray-700'
      },
        React.createElement('h2', {
          className: 'text-2xl font-bold dark:text-white'
        }, 'Bulk Allocation Upload'),
        React.createElement('button', {
          onClick: () => setIsOpen(false),
          className: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        }, '✕')
      ),

      // Main Content
      React.createElement('div', {
        className: 'flex-1 overflow-y-auto p-6'
      },
        // Instructions
        React.createElement('div', {
          className: 'mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4'
        },
          React.createElement('h3', {
            className: 'font-semibold text-blue-900 dark:text-blue-100 mb-2'
          }, 'Instructions'),
          React.createElement('ul', {
            className: 'space-y-1 text-sm text-blue-800 dark:text-blue-200'
          },
            React.createElement('li', null, '• CSV must contain: event_name, lead_identifier (phone/email), tickets_to_allocate'),
            React.createElement('li', null, '• Optional fields: category_name, notes, order_id, price_override'),
            React.createElement('li', null, '• Lead identifier can be phone number or email address'),
            React.createElement('li', null, '• System will validate inventory availability and lead existence'),
            React.createElement('li', null, '• All allocations in a batch will succeed or fail together')
          ),
          React.createElement('button', {
            onClick: handleDownloadTemplate,
            className: 'mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline'
          }, '📥 Download Sample Template')
        ),

        // File Upload Section
        !previewData && React.createElement('div', {
          className: 'mb-6'
        },
          React.createElement('div', {
            className: 'border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center'
          },
            React.createElement('input', {
              type: 'file',
              accept: '.csv',
              onChange: handleFileSelect,
              className: 'hidden',
              id: 'csv-file-input'
            }),
            React.createElement('label', {
              htmlFor: 'csv-file-input',
              className: 'cursor-pointer'
            },
              React.createElement('div', {
                className: 'mb-4'
              },
                React.createElement('span', {
                  className: 'text-5xl'
                }, '📁')
              ),
              React.createElement('p', {
                className: 'text-lg font-medium dark:text-white mb-2'
              }, file ? file.name : 'Click to select CSV file'),
              React.createElement('p', {
                className: 'text-sm text-gray-500 dark:text-gray-400'
              }, 'or drag and drop')
            )
          ),

          file && React.createElement('div', {
            className: 'mt-4 flex justify-center'
          },
            React.createElement('button', {
              onClick: handlePreview,
              disabled: uploading,
              className: 'bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50'
            }, uploading ? 'Validating...' : 'Preview Allocations')
          )
        ),

        // Preview Section
        previewData && React.createElement('div', {
          className: 'space-y-6'
        },
          // Summary
          React.createElement('div', {
            className: 'bg-gray-50 dark:bg-gray-700 rounded-lg p-4'
          },
            React.createElement('h3', {
              className: 'font-semibold dark:text-white mb-3'
            }, 'Upload Summary'),
            React.createElement('div', {
              className: 'grid grid-cols-2 md:grid-cols-5 gap-4 text-sm'
            },
              React.createElement('div', null,
                React.createElement('p', {
                  className: 'text-gray-600 dark:text-gray-400'
                }, 'Total Rows'),
                React.createElement('p', {
                  className: 'text-lg font-semibold dark:text-white'
                }, previewData.summary.total_rows)
              ),
              React.createElement('div', null,
                React.createElement('p', {
                  className: 'text-gray-600 dark:text-gray-400'
                }, 'Valid'),
                React.createElement('p', {
                  className: 'text-lg font-semibold text-green-600 dark:text-green-400'
                }, previewData.summary.valid_rows)
              ),
              React.createElement('div', null,
                React.createElement('p', {
                  className: 'text-gray-600 dark:text-gray-400'
                }, 'Errors'),
                React.createElement('p', {
                  className: 'text-lg font-semibold text-red-600 dark:text-red-400'
                }, previewData.summary.error_rows)
              ),
              React.createElement('div', null,
                React.createElement('p', {
                  className: 'text-gray-600 dark:text-gray-400'
                }, 'Warnings'),
                React.createElement('p', {
                  className: 'text-lg font-semibold text-yellow-600 dark:text-yellow-400'
                }, previewData.summary.warning_rows)
              ),
              React.createElement('div', null,
                React.createElement('p', {
                  className: 'text-gray-600 dark:text-gray-400'
                }, 'Total Tickets'),
                React.createElement('p', {
                  className: 'text-lg font-semibold text-blue-600 dark:text-blue-400'
                }, previewData.summary.total_tickets)
              )
            )
          ),

          // Validation Results
          React.createElement('div', {
            className: 'overflow-x-auto'
          },
            React.createElement('h3', {
              className: 'font-semibold dark:text-white mb-3'
            }, 'Validation Results'),
            React.createElement('table', {
              className: 'min-w-full divide-y divide-gray-200 dark:divide-gray-700'
            },
              React.createElement('thead', {
                className: 'bg-gray-50 dark:bg-gray-700'
              },
                React.createElement('tr', null,
                  React.createElement('th', {
                    className: 'px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'
                  }, 'Row'),
                  React.createElement('th', {
                    className: 'px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'
                  }, 'Status'),
                  React.createElement('th', {
                    className: 'px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'
                  }, 'Event'),
                  React.createElement('th', {
                    className: 'px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'
                  }, 'Lead'),
                  React.createElement('th', {
                    className: 'px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'
                  }, 'Tickets'),
                  React.createElement('th', {
                    className: 'px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'
                  }, 'Category'),
                  React.createElement('th', {
                    className: 'px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'
                  }, 'Issues')
                )
              ),
              React.createElement('tbody', {
                className: 'bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700'
              },
                previewData.validationResults.map((result, index) => 
                  React.createElement('tr', {
                    key: index,
                    className: result.status === 'error' ? 'bg-red-50 dark:bg-red-900/20' : 
                               result.warnings.length > 0 ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                  },
                    React.createElement('td', {
                      className: 'px-4 py-2 text-sm dark:text-gray-300'
                    }, result.row),
                    React.createElement('td', {
                      className: 'px-4 py-2'
                    },
                      React.createElement('span', {
                        className: `inline-flex px-2 py-1 text-xs rounded-full ${
                          result.status === 'valid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          result.status === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`
                      }, result.status)
                    ),
                    React.createElement('td', {
                      className: 'px-4 py-2 text-sm dark:text-gray-300'
                    }, result.data.event_name || '-'),
                    React.createElement('td', {
                      className: 'px-4 py-2 text-sm dark:text-gray-300'
                    }, result.enrichedData?.lead?.name || result.data.lead_identifier || '-'),
                    React.createElement('td', {
                      className: 'px-4 py-2 text-sm text-center dark:text-gray-300'
                    }, result.data.tickets_to_allocate || '-'),
                    React.createElement('td', {
                      className: 'px-4 py-2 text-sm dark:text-gray-300'
                    }, result.data.category_name || '-'),
                    React.createElement('td', {
                      className: 'px-4 py-2 text-sm'
                    },
                      result.errors.length > 0 && React.createElement('div', {
                        className: 'text-red-600 dark:text-red-400'
                      }, result.errors.join(', ')),
                      result.warnings.length > 0 && React.createElement('div', {
                        className: 'text-yellow-600 dark:text-yellow-400'
                      }, result.warnings.join(', '))
                    )
                  )
                )
              )
            )
          ),

          // Action Buttons
          React.createElement('div', {
            className: 'flex justify-between items-center'
          },
            React.createElement('button', {
              onClick: () => {
                setFile(null);
                setPreviewData(null);
              },
              className: 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            }, '← Back to Upload'),
            previewData.canProceed && React.createElement('button', {
              onClick: handleProcess,
              disabled: processing,
              className: 'bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 disabled:opacity-50'
            }, processing ? 'Processing...' : `Process ${previewData.summary.valid_rows} Allocations`)
          )
        ),

        // Upload History
        showHistory && uploadHistory.length > 0 && React.createElement('div', {
          className: 'mt-8 border-t pt-6'
        },
          React.createElement('h3', {
            className: 'font-semibold dark:text-white mb-3'
          }, 'Recent Uploads'),
          React.createElement('div', {
            className: 'space-y-2'
          },
            uploadHistory.map(entry => 
              React.createElement('div', {
                key: entry.id,
                className: 'flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded'
              },
                React.createElement('div', null,
                  React.createElement('p', {
                    className: 'text-sm font-medium dark:text-white'
                  }, entry.filename),
                  React.createElement('p', {
                    className: 'text-xs text-gray-500 dark:text-gray-400'
                  }, `${entry.processed} allocations by ${entry.user}`)
                ),
                React.createElement('p', {
                  className: 'text-xs text-gray-500 dark:text-gray-400'
                }, new Date(entry.date).toLocaleString())
              )
            )
          )
        )
      ),

      // Footer
      React.createElement('div', {
        className: 'flex justify-between items-center p-6 border-t dark:border-gray-700'
      },
        React.createElement('button', {
          onClick: () => setShowHistory(!showHistory),
          className: 'text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
        }, showHistory ? 'Hide History' : 'Show History'),
        React.createElement('button', {
          onClick: () => setIsOpen(false),
          className: 'bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600'
        }, 'Close')
      )
    )
  );
};

// Initialize when loaded
console.log('✅ Bulk Allocation Upload component loaded');