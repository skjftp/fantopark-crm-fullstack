window.renderQuoteUploadModal = () => {
  if (!window.showQuoteUploadModal) return null;

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50' 
  },
    React.createElement('div', { className: 'bg-white rounded-lg p-6 w-full max-w-md' },
      React.createElement('h2', { className: 'text-xl font-bold mb-4' }, 'Upload Quote'),
      
      React.createElement('form', { onSubmit: window.handleQuoteUpload },
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Quote PDF'),
          React.createElement('input', {
            type: 'file',
            accept: '.pdf',
            onChange: (e) => window.setQuoteUploadData(prev => ({ ...prev, pdf: e.target.files[0] })),
            className: 'w-full p-2 border rounded',
            required: true
          })
        ),
        
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Notes'),
          React.createElement('textarea', {
            value: window.quoteUploadData?.notes || '',
            onChange: (e) => window.setQuoteUploadData(prev => ({ ...prev, notes: e.target.value })),
            className: 'w-full p-2 border rounded h-20',
            placeholder: 'Add notes about the quote...'
          })
        ),
        
        React.createElement('div', { className: 'flex gap-2' },
          React.createElement('button', {
            type: 'submit',
            className: 'bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
          }, 'Upload & Progress'),
          React.createElement('button', {
            type: 'button',
            onClick: () => window.setShowQuoteUploadModal(false),
            className: 'bg-gray-300 px-4 py-2 rounded hover:bg-gray-400'
          }, 'Cancel')
        )
      )
    )
  );
};
