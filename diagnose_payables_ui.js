// Run this in browser console to diagnose the issue
console.log('=== DIAGNOSING PAYABLES UI ===');

// Check if payables data exists in React state
if (typeof React !== 'undefined') {
    // Try to find the payables state
    const allElements = document.querySelectorAll('*');
    let found = false;
    
    for (let el of allElements) {
        if (el._reactInternalFiber || el._reactInternalInstance) {
            try {
                const props = el._reactInternalFiber?.memoizedProps || el._reactInternalInstance?._currentElement?.props;
                if (props && (props.payables || props.financialStats)) {
                    console.log('Found React component with financial data:', props);
                    found = true;
                    break;
                }
            } catch (e) {}
        }
    }
    
    if (!found) {
        console.log('Could not find payables in React state');
    }
}

// Check if the payables tab content exists
const payablesContent = document.querySelector('[class*="payables"]');
console.log('Payables UI element:', payablesContent);

// Check localStorage for any cached data
console.log('Checking for cached financial data...');
Object.keys(localStorage).forEach(key => {
    if (key.includes('payable') || key.includes('financial')) {
        console.log(key, ':', localStorage.getItem(key));
    }
});

// Test loading payables data and manually updating UI
console.log('\nManually testing payables load...');
if (typeof apiCall !== 'undefined') {
    apiCall('/payables').then(response => {
        console.log('Payables loaded:', response.data);
        
        // Try to find where to inject this data
        const tabContent = document.querySelector('[class*="activeFinanceTab"]')?.parentElement;
        if (tabContent) {
            console.log('Found finance tab content area');
        }
    });
}
