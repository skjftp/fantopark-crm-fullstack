// === VERIFY COMPLETE PAYABLES FUNCTIONALITY ===
console.log('Testing complete payables functionality...\n');

// 1. Test all endpoints
Promise.all([
    apiCall('/orders'),
    apiCall('/invoices'), 
    apiCall('/payables'),
    apiCall('/inventory')
]).then(([orders, invoices, payables, inventory]) => {
    console.log('1. API Endpoints:');
    console.log('✅ Orders:', orders.data?.length || 0);
    console.log('✅ Invoices:', invoices.data?.length || 0);
    console.log('✅ Payables:', payables.data?.length || 0);
    console.log('✅ Inventory:', inventory.data?.length || 0);
    
    // 2. Calculate totals
    const totalPayables = (payables.data || []).reduce((sum, pay) => sum + pay.amount, 0);
    console.log('\n2. Calculations:');
    console.log('Total Payables: ₹' + totalPayables.toLocaleString());
    console.log('Expected: ₹600,000');
    
    // 3. Check UI elements
    setTimeout(() => {
        console.log('\n3. UI Elements:');
        
        // Check stats card
        const statsCards = document.querySelectorAll('[class*="text-2xl"][class*="font-bold"]');
        statsCards.forEach(card => {
            if (card.parentElement.textContent.includes('Total Payables')) {
                console.log('Total Payables Card shows:', card.textContent);
            }
        });
        
        // Check payables table
        const tables = document.querySelectorAll('table');
        let payablesTableFound = false;
        tables.forEach(table => {
            if (table.textContent.includes('IPL') || table.textContent.includes('Wimbledon')) {
                console.log('✅ Payables table found with data');
                payablesTableFound = true;
            }
        });
        if (!payablesTableFound) {
            console.log('❌ Payables table not found - click on Payables tab');
        }
    }, 1000);
});
