// Update your handleFileChange function in the frontend:

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
    } else {
        alert('Please select a valid CSV or Excel file (.csv, .xlsx, .xls)');
    }
};

// Update the file input in your CSVUploadModal:
React.createElement('input', {
    type: 'file',
    accept: '.csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    onChange: handleFileChange,
    className: 'block w-full mb-4 text-gray-900 dark:text-white'
}),

// Update the download button text:
React.createElement('button', {
    onClick: downloadSampleCSV,
    className: 'bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mb-4'
}, 'Download Sample Excel with Validation'),

// Update the modal title:
React.createElement('h2', {
    className: 'text-2xl font-bold mb-4 text-gray-900 dark:text-white'
}, 'Upload ' + (type === 'leads' ? 'Leads' : 'Inventory') + ' (CSV/Excel)'),

// Update the description:
React.createElement('p', {
    className: 'text-gray-600 dark:text-gray-300 mb-4'
}, 'Upload a CSV or Excel file to bulk import your data. Excel files will have built-in dropdown validation.')
