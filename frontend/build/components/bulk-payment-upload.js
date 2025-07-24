// Bulk Payment Upload Component for FanToPark CRM
// Handles CSV upload for bulk payment processing

window.BulkPaymentUpload = () => {
  const [state, setState] = React.useState({
    file: null,
    uploading: false,
    validating: false,
    results: null,
    error: null,
    showHistory: false,
    uploadHistory: [],
    sampleData: null,
    dragActive: false
  });

  // Handle file selection
  const handleFileSelect = (file) => {
    if (file && file.name.endsWith('.csv')) {
      setState(prev => ({
        ...prev,
        file,
        error: null,
        results: null
      }));
    } else {
      setState(prev => ({
        ...prev,
        error: 'Please select a valid CSV file'
      }));
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setState(prev => ({ ...prev, dragActive: true }));
    } else if (e.type === "dragleave") {
      setState(prev => ({ ...prev, dragActive: false }));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setState(prev => ({ ...prev, dragActive: false }));
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Download template
  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/bulk-payments/template', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to download template');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'payment-upload-template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Template download error:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to download template'
      }));
    }
  };

  // Validate CSV
  const validateFile = async () => {
    if (!state.file) return;

    setState(prev => ({ ...prev, validating: true, error: null }));

    const formData = new FormData();
    formData.append('file', state.file);

    try {
      const response = await fetch('/api/bulk-payments/validate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Validation failed');
      }

      setState(prev => ({
        ...prev,
        validating: false,
        results: {
          validation: data,
          type: 'validation'
        }
      }));
    } catch (error) {
      console.error('Validation error:', error);
      setState(prev => ({
        ...prev,
        validating: false,
        error: error.message
      }));
    }
  };

  // Upload and process file
  const uploadFile = async () => {
    if (!state.file) return;

    setState(prev => ({ ...prev, uploading: true, error: null }));

    const formData = new FormData();
    formData.append('file', state.file);

    try {
      const response = await fetch('/api/bulk-payments/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setState(prev => ({
        ...prev,
        uploading: false,
        results: {
          upload: data,
          type: 'upload'
        },
        file: null
      }));

      // Show success notification
      if (window.showNotification) {
        window.showNotification(`Successfully processed ${data.results.summary.success} payments`, 'success');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setState(prev => ({
        ...prev,
        uploading: false,
        error: error.message
      }));
    }
  };

  // Get upload history
  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/bulk-payments/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setState(prev => ({
          ...prev,
          uploadHistory: data.uploads,
          showHistory: true
        }));
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  // Get sample data
  const fetchSampleData = async () => {
    try {
      const response = await fetch('/api/bulk-payments/sample-data', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setState(prev => ({
          ...prev,
          sampleData: data.sampleLeads
        }));
      }
    } catch (error) {
      console.error('Error fetching sample data:', error);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return React.createElement('div', { className: 'p-6' },
    // Header
    React.createElement('div', { className: 'mb-6' },
      React.createElement('h2', { className: 'text-2xl font-bold text-gray-800 mb-2' }, 
        '💳 Bulk Payment Upload'
      ),
      React.createElement('p', { className: 'text-gray-600' },
        'Upload CSV files to process multiple payment records at once'
      )
    ),

    // Action buttons
    React.createElement('div', { className: 'flex flex-wrap gap-4 mb-6' },
      React.createElement('button', {
        onClick: downloadTemplate,
        className: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2'
      },
        React.createElement('i', { className: 'fas fa-download' }),
        'Download Template'
      ),
      React.createElement('button', {
        onClick: fetchHistory,
        className: 'px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2'
      },
        React.createElement('i', { className: 'fas fa-history' }),
        'Upload History'
      ),
      React.createElement('button', {
        onClick: fetchSampleData,
        className: 'px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2'
      },
        React.createElement('i', { className: 'fas fa-database' }),
        'Get Sample Lead IDs'
      )
    ),

    // Upload area
    React.createElement('div', {
      className: `border-2 border-dashed rounded-lg p-8 text-center ${
        state.dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`,
      onDragEnter: handleDrag,
      onDragLeave: handleDrag,
      onDragOver: handleDrag,
      onDrop: handleDrop
    },
      React.createElement('div', { className: 'mb-4' },
        React.createElement('i', { 
          className: 'fas fa-cloud-upload-alt text-6xl text-gray-400' 
        })
      ),
      React.createElement('p', { className: 'text-gray-600 mb-4' },
        state.file 
          ? `Selected: ${state.file.name}` 
          : 'Drag and drop your CSV file here, or click to browse'
      ),
      React.createElement('input', {
        type: 'file',
        accept: '.csv',
        onChange: (e) => handleFileSelect(e.target.files[0]),
        className: 'hidden',
        id: 'file-upload'
      }),
      React.createElement('label', {
        htmlFor: 'file-upload',
        className: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer inline-block'
      }, 'Choose File')
    ),

    // File actions
    state.file && React.createElement('div', { className: 'mt-6 flex gap-4 justify-center' },
      React.createElement('button', {
        onClick: validateFile,
        disabled: state.validating || state.uploading,
        className: 'px-6 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2'
      },
        state.validating && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
        'Validate'
      ),
      React.createElement('button', {
        onClick: uploadFile,
        disabled: state.uploading || state.validating,
        className: 'px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2'
      },
        state.uploading && React.createElement('i', { className: 'fas fa-spinner fa-spin' }),
        'Upload & Process'
      )
    ),

    // Error display
    state.error && React.createElement('div', {
      className: 'mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700'
    }, state.error),

    // Validation results
    state.results?.type === 'validation' && React.createElement('div', { className: 'mt-6' },
      React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 'Validation Results'),
      React.createElement('div', { className: 'grid grid-cols-3 gap-4 mb-4' },
        React.createElement('div', { className: 'bg-gray-50 p-4 rounded' },
          React.createElement('div', { className: 'text-2xl font-bold text-gray-800' }, 
            state.results.validation.summary.total
          ),
          React.createElement('div', { className: 'text-sm text-gray-600' }, 'Total Rows')
        ),
        React.createElement('div', { className: 'bg-green-50 p-4 rounded' },
          React.createElement('div', { className: 'text-2xl font-bold text-green-600' }, 
            state.results.validation.summary.valid
          ),
          React.createElement('div', { className: 'text-sm text-gray-600' }, 'Valid')
        ),
        React.createElement('div', { className: 'bg-red-50 p-4 rounded' },
          React.createElement('div', { className: 'text-2xl font-bold text-red-600' }, 
            state.results.validation.summary.invalid
          ),
          React.createElement('div', { className: 'text-sm text-gray-600' }, 'Invalid')
        )
      ),
      
      // Show errors if any
      state.results.validation.validationResults
        .filter(r => !r.isValid)
        .length > 0 && React.createElement('div', { className: 'mt-4' },
        React.createElement('h4', { className: 'font-medium mb-2' }, 'Validation Errors:'),
        React.createElement('div', { className: 'space-y-2 max-h-60 overflow-y-auto' },
          state.results.validation.validationResults
            .filter(r => !r.isValid)
            .map((result, idx) => 
              React.createElement('div', {
                key: idx,
                className: 'p-2 bg-red-50 border border-red-200 rounded text-sm'
              },
                React.createElement('div', { className: 'font-medium' }, 
                  `Row ${result.row}: Lead ID ${result.lead_id || 'Missing'}`
                ),
                React.createElement('ul', { className: 'text-red-600 mt-1' },
                  result.errors.map((error, i) => 
                    React.createElement('li', { key: i }, `• ${error}`)
                  )
                )
              )
            )
        )
      )
    ),

    // Upload results
    state.results?.type === 'upload' && React.createElement('div', { className: 'mt-6' },
      React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 'Upload Results'),
      React.createElement('div', { className: 'grid grid-cols-4 gap-4 mb-4' },
        React.createElement('div', { className: 'bg-gray-50 p-4 rounded' },
          React.createElement('div', { className: 'text-2xl font-bold text-gray-800' }, 
            state.results.upload.results.summary.total
          ),
          React.createElement('div', { className: 'text-sm text-gray-600' }, 'Total Processed')
        ),
        React.createElement('div', { className: 'bg-green-50 p-4 rounded' },
          React.createElement('div', { className: 'text-2xl font-bold text-green-600' }, 
            state.results.upload.results.summary.success
          ),
          React.createElement('div', { className: 'text-sm text-gray-600' }, 'Successful')
        ),
        React.createElement('div', { className: 'bg-blue-50 p-4 rounded' },
          React.createElement('div', { className: 'text-2xl font-bold text-blue-600' }, 
            state.results.upload.results.summary.ordersCreated
          ),
          React.createElement('div', { className: 'text-sm text-gray-600' }, 'Orders Created')
        ),
        React.createElement('div', { className: 'bg-indigo-50 p-4 rounded' },
          React.createElement('div', { className: 'text-xl font-bold text-indigo-600' }, 
            formatCurrency(state.results.upload.results.summary.totalAmount)
          ),
          React.createElement('div', { className: 'text-sm text-gray-600' }, 'Total Amount')
        )
      ),

      // Failed records
      state.results.upload.results.failed.length > 0 && React.createElement('div', { className: 'mt-4' },
        React.createElement('h4', { className: 'font-medium mb-2 text-red-600' }, 
          `Failed Records (${state.results.upload.results.failed.length})`
        ),
        React.createElement('div', { className: 'space-y-2 max-h-40 overflow-y-auto' },
          state.results.upload.results.failed.map((failure, idx) => 
            React.createElement('div', {
              key: idx,
              className: 'p-2 bg-red-50 border border-red-200 rounded text-sm'
            },
              React.createElement('span', { className: 'font-medium' }, 
                `Row ${failure.row}: ${failure.lead_id} - `
              ),
              React.createElement('span', { className: 'text-red-600' }, 
                failure.errors.join(', ')
              )
            )
          )
        )
      )
    ),

    // Upload history modal
    state.showHistory && React.createElement('div', {
      className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
      onClick: () => setState(prev => ({ ...prev, showHistory: false }))
    },
      React.createElement('div', {
        className: 'bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto',
        onClick: (e) => e.stopPropagation()
      },
        React.createElement('h3', { className: 'text-xl font-bold mb-4' }, 'Upload History'),
        React.createElement('div', { className: 'space-y-3' },
          state.uploadHistory.map((upload, idx) => 
            React.createElement('div', {
              key: idx,
              className: 'border rounded-lg p-4 hover:bg-gray-50'
            },
              React.createElement('div', { className: 'flex justify-between items-start' },
                React.createElement('div', null,
                  React.createElement('div', { className: 'font-medium' }, upload.filename),
                  React.createElement('div', { className: 'text-sm text-gray-600' }, 
                    `Uploaded by ${upload.uploaded_by} on ${new Date(upload.created_at).toLocaleString()}`
                  ),
                  React.createElement('div', { className: 'flex gap-4 mt-2 text-sm' },
                    React.createElement('span', { className: 'text-green-600' }, 
                      `✓ ${upload.results.success} successful`
                    ),
                    upload.results.failed > 0 && React.createElement('span', { className: 'text-red-600' }, 
                      `✗ ${upload.results.failed} failed`
                    ),
                    React.createElement('span', { className: 'text-blue-600' }, 
                      `Total: ${formatCurrency(upload.results.totalAmount || 0)}`
                    )
                  )
                ),
                React.createElement('span', {
                  className: `px-3 py-1 rounded-full text-xs ${
                    upload.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`
                }, upload.status)
              )
            )
          )
        ),
        React.createElement('button', {
          onClick: () => setState(prev => ({ ...prev, showHistory: false })),
          className: 'mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700'
        }, 'Close')
      )
    ),

    // Sample data modal
    state.sampleData && React.createElement('div', {
      className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
      onClick: () => setState(prev => ({ ...prev, sampleData: null }))
    },
      React.createElement('div', {
        className: 'bg-white rounded-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto',
        onClick: (e) => e.stopPropagation()
      },
        React.createElement('h3', { className: 'text-xl font-bold mb-4' }, 'Sample Lead IDs for Testing'),
        React.createElement('p', { className: 'text-gray-600 mb-4' }, 
          'Use these lead IDs in your CSV file for testing the bulk payment upload:'
        ),
        React.createElement('table', { className: 'w-full border-collapse' },
          React.createElement('thead', null,
            React.createElement('tr', { className: 'bg-gray-50' },
              React.createElement('th', { className: 'border px-4 py-2 text-left' }, 'Lead ID'),
              React.createElement('th', { className: 'border px-4 py-2 text-left' }, 'Name'),
              React.createElement('th', { className: 'border px-4 py-2 text-left' }, 'Email'),
              React.createElement('th', { className: 'border px-4 py-2 text-left' }, 'Phone'),
              React.createElement('th', { className: 'border px-4 py-2 text-left' }, 'Event'),
              React.createElement('th', { className: 'border px-4 py-2 text-left' }, 'Status')
            )
          ),
          React.createElement('tbody', null,
            state.sampleData.map((lead, idx) => 
              React.createElement('tr', { key: idx, className: 'hover:bg-gray-50' },
                React.createElement('td', { className: 'border px-4 py-2 font-mono text-sm' }, 
                  lead.lead_id
                ),
                React.createElement('td', { className: 'border px-4 py-2' }, lead.lead_name),
                React.createElement('td', { className: 'border px-4 py-2' }, lead.lead_email),
                React.createElement('td', { className: 'border px-4 py-2' }, lead.lead_phone),
                React.createElement('td', { className: 'border px-4 py-2' }, lead.event_name),
                React.createElement('td', { className: 'border px-4 py-2' },
                  React.createElement('span', {
                    className: 'px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800'
                  }, lead.status)
                )
              )
            )
          )
        ),
        React.createElement('button', {
          onClick: () => setState(prev => ({ ...prev, sampleData: null })),
          className: 'mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700'
        }, 'Close')
      )
    )
  );
};