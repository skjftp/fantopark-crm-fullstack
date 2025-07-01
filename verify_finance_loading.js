// Verify finance data loading
console.log('=== VERIFYING FINANCE DATA LOADING ===');

// Check if fetchFinancialData exists
if (typeof fetchFinancialData !== 'undefined') {
    console.log('✅ fetchFinancialData function exists');
    
    // Call it manually
    console.log('Calling fetchFinancialData manually...');
    fetchFinancialData();
    
    // Check results after a delay
    setTimeout(() => {
        if (typeof financialStats !== 'undefined') {
            console.log('Financial Stats:', financialStats);
        }
        if (typeof financialData !== 'undefined') {
            console.log('Financial Data:', financialData);
        }
    }, 2000);
} else {
    console.log('❌ fetchFinancialData not found in scope');
    
    // Try to call it directly
    console.log('Attempting direct API calls...');
    Promise.all([
        apiCall('/orders'),
        apiCall('/invoices'),
        apiCall('/payables'),
        apiCall('/inventory')
    ]).then(([orders, invoices, payables, inventory]) => {
        console.log('Manual load results:');
        console.log('- Orders:', orders.data?.length || 0);
        console.log('- Invoices:', invoices.data?.length || 0);
        console.log('- Payables:', payables.data?.length || 0);
        console.log('- Inventory:', inventory.data?.length || 0);
        
        const totalPayables = (payables.data || []).reduce((sum, p) => sum + p.amount, 0);
        console.log('\nTotal Payables should be: ₹' + totalPayables.toLocaleString());
    });
}
