// Bulk Payment Upload Component for FanToPark CRM
// Handles CSV upload for bulk payment processing
// Version: 2.0 - Vanilla JavaScript implementation

window.BulkPaymentUpload = () => {
  console.log('🔄 BulkPaymentUpload v2.0 - Vanilla JS implementation');
  
  // Create a unique ID for this component instance
  const componentId = 'bulk-payment-' + Date.now();
  
  // State management
  let state = {
    file: null,
    uploading: false,
    validating: false,
    results: null,
    error: null,
    showHistory: false,
    uploadHistory: [],
    sampleData: null,
    dragActive: false
  };

  // Handle file selection
  const handleFileSelect = (file) => {
    if (file && file.name.endsWith('.csv')) {
      state.file = file;
      state.error = null;
      state.results = null;
      render();
    } else {
      state.error = 'Please select a valid CSV file';
      render();
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      state.dragActive = true;
    } else if (e.type === "dragleave") {
      state.dragActive = false;
    }
    render();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    state.dragActive = false;
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Download template
  const downloadTemplate = async () => {
    try {
      const response = await fetch(`${window.API_CONFIG.API_URL}/bulk-payments/template`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('crm_auth_token')}`
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
      state.error = 'Failed to download template';
      render();
    }
  };

  // Validate CSV
  const validateFile = async () => {
    if (!state.file) return;

    state.validating = true;
    state.error = null;
    render();

    const formData = new FormData();
    formData.append('file', state.file);

    try {
      const response = await fetch(`${window.API_CONFIG.API_URL}/bulk-payments/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('crm_auth_token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Validation failed');
      }

      state.validating = false;
      state.results = {
        validation: data,
        type: 'validation'
      };
      render();
    } catch (error) {
      console.error('Validation error:', error);
      state.validating = false;
      state.error = error.message;
      render();
    }
  };

  // Upload and process file
  const uploadFile = async () => {
    if (!state.file) return;

    state.uploading = true;
    state.error = null;
    render();

    const formData = new FormData();
    formData.append('file', state.file);

    try {
      const response = await fetch(`${window.API_CONFIG.API_URL}/bulk-payments/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('crm_auth_token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      state.uploading = false;
      state.results = {
        upload: data,
        type: 'upload'
      };
      state.file = null;
      render();

      // Show success notification
      if (window.showNotification) {
        window.showNotification(`Successfully processed ${data.results.summary.success} payments`, 'success');
      }
    } catch (error) {
      console.error('Upload error:', error);
      state.uploading = false;
      state.error = error.message;
      render();
    }
  };

  // Get upload history
  const fetchHistory = async () => {
    try {
      const response = await fetch(`${window.API_CONFIG.API_URL}/bulk-payments/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('crm_auth_token')}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        state.uploadHistory = data.uploads;
        state.showHistory = true;
        render();
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  // Get sample data
  const fetchSampleData = async () => {
    try {
      const response = await fetch(`${window.API_CONFIG.API_URL}/bulk-payments/sample-data`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('crm_auth_token')}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        state.sampleData = data.sampleLeads;
        render();
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

  // Attach event listeners
  const attachEventListeners = () => {
    const container = document.getElementById(componentId);
    if (!container) return;

    // File input
    const fileInput = container.querySelector('#file-upload');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));
    }

    // Drag and drop
    const dropZone = container.querySelector('.drop-zone');
    if (dropZone) {
      dropZone.addEventListener('dragenter', handleDrag);
      dropZone.addEventListener('dragleave', handleDrag);
      dropZone.addEventListener('dragover', handleDrag);
      dropZone.addEventListener('drop', handleDrop);
    }

    // Button clicks
    container.querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        switch (action) {
          case 'download-template':
            downloadTemplate();
            break;
          case 'fetch-history':
            fetchHistory();
            break;
          case 'fetch-sample':
            fetchSampleData();
            break;
          case 'validate':
            validateFile();
            break;
          case 'upload':
            uploadFile();
            break;
          case 'close-history':
            state.showHistory = false;
            render();
            break;
          case 'close-sample':
            state.sampleData = null;
            render();
            break;
        }
      });
    });

    // Modal close on backdrop click
    container.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          state.showHistory = false;
          state.sampleData = null;
          render();
        }
      });
    });
  };

  // Render function
  const render = () => {
    const container = document.getElementById(componentId);
    if (container) {
      container.innerHTML = renderComponent();
      attachEventListeners();
    }
  };

  // Main render function
  const renderComponent = () => {
    return `
      <div class="p-6">
        <!-- Header -->
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-gray-800 mb-2">💳 Bulk Payment Upload</h2>
          <p class="text-gray-600">Upload CSV files to process multiple payment records at once</p>
        </div>

        <!-- Action buttons -->
        <div class="flex flex-wrap gap-4 mb-6">
          <button data-action="download-template" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
            <i class="fas fa-download"></i>
            Download Template
          </button>
          <button data-action="fetch-history" class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2">
            <i class="fas fa-history"></i>
            Upload History
          </button>
          <button data-action="fetch-sample" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
            <i class="fas fa-database"></i>
            Get Sample Lead IDs
          </button>
        </div>

        <!-- Upload area -->
        <div class="drop-zone border-2 border-dashed rounded-lg p-8 text-center ${
          state.dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }">
          <div class="mb-4">
            <i class="fas fa-cloud-upload-alt text-6xl text-gray-400"></i>
          </div>
          <p class="text-gray-600 mb-4">
            ${state.file 
              ? `Selected: ${state.file.name}` 
              : 'Drag and drop your CSV file here, or click to browse'}
          </p>
          <input type="file" accept=".csv" class="hidden" id="file-upload">
          <label for="file-upload" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer inline-block">
            Choose File
          </label>
        </div>

        <!-- File actions -->
        ${state.file ? `
          <div class="mt-6 flex gap-4 justify-center">
            <button data-action="validate" 
              ${state.validating || state.uploading ? 'disabled' : ''} 
              class="px-6 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2">
              ${state.validating ? '<i class="fas fa-spinner fa-spin"></i>' : ''}
              Validate
            </button>
            <button data-action="upload" 
              ${state.uploading || state.validating ? 'disabled' : ''} 
              class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
              ${state.uploading ? '<i class="fas fa-spinner fa-spin"></i>' : ''}
              Upload & Process
            </button>
          </div>
        ` : ''}

        <!-- Error display -->
        ${state.error ? `
          <div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            ${state.error}
          </div>
        ` : ''}

        <!-- Validation results -->
        ${state.results?.type === 'validation' ? renderValidationResults() : ''}

        <!-- Upload results -->
        ${state.results?.type === 'upload' ? renderUploadResults() : ''}

        <!-- Upload history modal -->
        ${state.showHistory ? renderHistoryModal() : ''}

        <!-- Sample data modal -->
        ${state.sampleData ? renderSampleDataModal() : ''}
      </div>
    `;
  };

  // Render validation results
  const renderValidationResults = () => {
    const validation = state.results.validation;
    const errors = validation.validationResults.filter(r => !r.isValid);

    return `
      <div class="mt-6">
        <h3 class="text-lg font-semibold mb-4">Validation Results</h3>
        <div class="grid grid-cols-3 gap-4 mb-4">
          <div class="bg-gray-50 p-4 rounded">
            <div class="text-2xl font-bold text-gray-800">${validation.summary.total}</div>
            <div class="text-sm text-gray-600">Total Rows</div>
          </div>
          <div class="bg-green-50 p-4 rounded">
            <div class="text-2xl font-bold text-green-600">${validation.summary.valid}</div>
            <div class="text-sm text-gray-600">Valid</div>
          </div>
          <div class="bg-red-50 p-4 rounded">
            <div class="text-2xl font-bold text-red-600">${validation.summary.invalid}</div>
            <div class="text-sm text-gray-600">Invalid</div>
          </div>
        </div>
        
        ${errors.length > 0 ? `
          <div class="mt-4">
            <h4 class="font-medium mb-2">Validation Errors:</h4>
            <div class="space-y-2 max-h-60 overflow-y-auto">
              ${errors.map(result => `
                <div class="p-2 bg-red-50 border border-red-200 rounded text-sm">
                  <div class="font-medium">Row ${result.row}: Lead ID ${result.lead_id || 'Missing'}</div>
                  <ul class="text-red-600 mt-1">
                    ${result.errors.map(error => `<li>• ${error}</li>`).join('')}
                  </ul>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  };

  // Render upload results
  const renderUploadResults = () => {
    const upload = state.results.upload;
    const failed = upload.results.failed;

    return `
      <div class="mt-6">
        <h3 class="text-lg font-semibold mb-4">Upload Results</h3>
        <div class="grid grid-cols-4 gap-4 mb-4">
          <div class="bg-gray-50 p-4 rounded">
            <div class="text-2xl font-bold text-gray-800">${upload.results.summary.total}</div>
            <div class="text-sm text-gray-600">Total Processed</div>
          </div>
          <div class="bg-green-50 p-4 rounded">
            <div class="text-2xl font-bold text-green-600">${upload.results.summary.success}</div>
            <div class="text-sm text-gray-600">Successful</div>
          </div>
          <div class="bg-blue-50 p-4 rounded">
            <div class="text-2xl font-bold text-blue-600">${upload.results.summary.ordersCreated}</div>
            <div class="text-sm text-gray-600">Orders Created</div>
          </div>
          <div class="bg-indigo-50 p-4 rounded">
            <div class="text-xl font-bold text-indigo-600">${formatCurrency(upload.results.summary.totalAmount)}</div>
            <div class="text-sm text-gray-600">Total Amount</div>
          </div>
        </div>

        ${failed.length > 0 ? `
          <div class="mt-4">
            <h4 class="font-medium mb-2 text-red-600">Failed Records (${failed.length})</h4>
            <div class="space-y-2 max-h-40 overflow-y-auto">
              ${failed.map(failure => `
                <div class="p-2 bg-red-50 border border-red-200 rounded text-sm">
                  <span class="font-medium">Row ${failure.row}: ${failure.lead_id} - </span>
                  <span class="text-red-600">${failure.errors.join(', ')}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  };

  // Render history modal
  const renderHistoryModal = () => {
    return `
      <div class="modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto" onclick="event.stopPropagation()">
          <h3 class="text-xl font-bold mb-4">Upload History</h3>
          <div class="space-y-3">
            ${state.uploadHistory.map(upload => `
              <div class="border rounded-lg p-4 hover:bg-gray-50">
                <div class="flex justify-between items-start">
                  <div>
                    <div class="font-medium">${upload.filename}</div>
                    <div class="text-sm text-gray-600">
                      Uploaded by ${upload.uploaded_by} on ${new Date(upload.created_at).toLocaleString()}
                    </div>
                    <div class="flex gap-4 mt-2 text-sm">
                      <span class="text-green-600">✓ ${upload.results.success} successful</span>
                      ${upload.results.failed > 0 ? `<span class="text-red-600">✗ ${upload.results.failed} failed</span>` : ''}
                      <span class="text-blue-600">Total: ${formatCurrency(upload.results.totalAmount || 0)}</span>
                    </div>
                  </div>
                  <span class="px-3 py-1 rounded-full text-xs ${
                    upload.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }">${upload.status}</span>
                </div>
              </div>
            `).join('')}
          </div>
          <button data-action="close-history" class="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
            Close
          </button>
        </div>
      </div>
    `;
  };

  // Render sample data modal
  const renderSampleDataModal = () => {
    return `
      <div class="modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto" onclick="event.stopPropagation()">
          <h3 class="text-xl font-bold mb-4">Sample Lead IDs for Testing</h3>
          <p class="text-gray-600 mb-4">Use these lead IDs in your CSV file for testing the bulk payment upload:</p>
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-gray-50">
                <th class="border px-4 py-2 text-left">Lead ID</th>
                <th class="border px-4 py-2 text-left">Name</th>
                <th class="border px-4 py-2 text-left">Email</th>
                <th class="border px-4 py-2 text-left">Phone</th>
                <th class="border px-4 py-2 text-left">Event</th>
                <th class="border px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              ${state.sampleData.map(lead => `
                <tr class="hover:bg-gray-50">
                  <td class="border px-4 py-2 font-mono text-sm">${lead.lead_id}</td>
                  <td class="border px-4 py-2">${lead.lead_name}</td>
                  <td class="border px-4 py-2">${lead.lead_email}</td>
                  <td class="border px-4 py-2">${lead.lead_phone}</td>
                  <td class="border px-4 py-2">${lead.event_name}</td>
                  <td class="border px-4 py-2">
                    <span class="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">${lead.status}</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <button data-action="close-sample" class="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
            Close
          </button>
        </div>
      </div>
    `;
  };

  // Return the initial HTML with container
  const html = `<div id="${componentId}">${renderComponent()}</div>`;
  
  // Attach event listeners after DOM update
  setTimeout(() => {
    attachEventListeners();
  }, 0);
  
  return html;
};