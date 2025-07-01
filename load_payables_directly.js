// Add this to the finance tab's useEffect
// This is a patch to load payables directly if the main function fails

if (activeTab === 'finance') {
    // Load payables directly
    apiCall('/payables').then(response => {
        if (response.data) {
            console.log('Loaded payables:', response.data);
            // Find where to set this data
            if (typeof setFinancialData === 'function') {
                setFinancialData(prev => ({
                    ...prev,
                    payables: response.data
                }));
            }
        }
    }).catch(err => console.error('Error loading payables:', err));
}
