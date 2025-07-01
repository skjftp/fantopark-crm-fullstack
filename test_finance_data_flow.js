// Run this in console to test the data flow
console.log('=== TESTING FINANCE DATA FLOW ===');

// Test each endpoint
Promise.all([
    apiCall('/orders').then(r => console.log('Orders:', r.data?.length || 0)),
    apiCall('/invoices').then(r => console.log('Invoices:', r.data?.length || 0)),
    apiCall('/payables').then(r => console.log('Payables:', r.data?.length || 0)),
    apiCall('/inventory').then(r => console.log('Inventory:', r.data?.length || 0))
]).then(() => {
    console.log('\nAll endpoints working!');
    
    // Check if financialData exists
    if (typeof financialData !== 'undefined') {
        console.log('financialData exists:', financialData);
    } else {
        console.log('financialData not in global scope');
    }
});

// Try to find the payables in the DOM
setTimeout(() => {
    const payablesSection = document.querySelector('[class*="payables"]');
    console.log('Payables section in DOM:', payablesSection);
    
    // Look for table with payables
    const tables = document.querySelectorAll('table');
    tables.forEach((table, i) => {
        const text = table.textContent;
        if (text.includes('Supplier') || text.includes('Due Date')) {
            console.log(`Table ${i} might be payables table:`, table);
        }
    });
}, 1000);
