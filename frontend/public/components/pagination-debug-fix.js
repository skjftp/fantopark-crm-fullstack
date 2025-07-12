// ============================================================================
// PAGINATION DEBUG & DIRECT FIX
// ============================================================================
// Let's debug and fix the actual state management issue

// 1. DEBUG CURRENT STATE MANAGEMENT
// ============================================================================
window.debugFinancialState = () => {
    console.log('🔍 === FINANCIAL STATE DEBUG ===');
    console.log('window.appState:', window.appState ? Object.keys(window.appState) : 'undefined');
    console.log('window.appState.financialPagination:', window.appState?.financialPagination);
    console.log('window.financialPagination:', window.financialPagination);
    console.log('window.setState:', typeof window.setState);
    console.log('window.setAppState:', typeof window.setAppState);
    console.log('window.renderApp:', typeof window.renderApp);
    
    // Check if there are any pagination-related state variables
    const stateKeys = window.appState ? Object.keys(window.appState) : [];
    const paginationKeys = stateKeys.filter(key => key.toLowerCase().includes('pagination'));
    console.log('Pagination-related state keys:', paginationKeys);
    
    // Check for React setState methods
    if (window.appState) {
        const setterKeys = Object.keys(window).filter(key => key.startsWith('set') && typeof window[key] === 'function');
        console.log('Available setter functions:', setterKeys.slice(0, 10)); // Show first 10
    }
    
    console.log('🔍 === END DEBUG ===');
};

// Run debug immediately
window.debugFinancialState();

// 2. MULTIPLE STATE UPDATE STRATEGIES
// ============================================================================
window.forceFinancialUpdate = (tabName, newPage) => {
    console.log(`🚀 FORCE UPDATE: ${tabName} to page ${newPage}`);
    
    // Strategy 1: Update all possible pagination state variables
    if (window.financialPagination && window.financialPagination[tabName]) {
        window.financialPagination[tabName].currentPage = newPage;
        console.log('✅ Updated window.financialPagination');
    }
    
    if (window.appState && window.appState.financialPagination && window.appState.financialPagination[tabName]) {
        window.appState.financialPagination[tabName].currentPage = newPage;
        console.log('✅ Updated window.appState.financialPagination');
    }
    
    // Strategy 2: Try to update appState directly
    if (window.appState) {
        window.appState.lastUpdate = Date.now();
        window.appState.forceRerender = Date.now();
        console.log('✅ Updated appState timestamps');
    }
    
    // Strategy 3: Find and use the correct setState function
    const setFunctions = [
        'setAppState',
        'setState', 
        'setFinancialPagination',
        'setFinancialState',
        'updateFinancialState'
    ];
    
    for (const funcName of setFunctions) {
        if (window[funcName] && typeof window[funcName] === 'function') {
            try {
                console.log(`🔄 Trying ${funcName}...`);
                if (funcName === 'setAppState') {
                    window[funcName](prev => ({
                        ...prev,
                        financialPagination: {
                            ...window.financialPagination
                        },
                        forceUpdate: Date.now()
                    }));
                } else {
                    window[funcName]({ 
                        forceUpdate: Date.now(),
                        currentPage: newPage,
                        [`${tabName}Page`]: newPage
                    });
                }
                console.log(`✅ ${funcName} called successfully`);
                return true; // Success, exit early
            } catch (error) {
                console.log(`❌ ${funcName} failed:`, error.message);
            }
        }
    }
    
    // Strategy 4: Direct DOM manipulation as last resort
    setTimeout(() => {
        const financialTabs = document.querySelectorAll('[data-tab]');
        financialTabs.forEach(tab => {
            if (tab.getAttribute('data-tab') === tabName) {
                tab.setAttribute('data-page', newPage);
                tab.setAttribute('data-updated', Date.now());
            }
        });
        console.log('✅ DOM attributes updated');
    }, 10);
    
    // Strategy 5: Dispatch multiple events
    const events = ['financialUpdate', 'paginationChange', 'stateUpdate', 'forceRender'];
    events.forEach(eventName => {
        try {
            const event = new CustomEvent(eventName, {
                detail: { tabName, newPage, timestamp: Date.now() }
            });
            document.dispatchEvent(event);
        } catch (error) {
            console.log(`Event ${eventName} failed:`, error.message);
        }
    });
    
    console.log('🚀 All update strategies attempted');
};

// 3. FIXED PAGE NUMBER GENERATION
// ============================================================================
window.getCorrectPageNumbers = (currentPage, totalPages) => {
    const pages = [];
    
    console.log(`🔢 Generating pages: current=${currentPage}, total=${totalPages}`);
    
    if (totalPages <= 5) {
        // Show all pages
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
    } else {
        // Always show first page
        pages.push(1);
        
        // Add dots if needed
        if (currentPage > 3) {
            pages.push('...');
        }
        
        // Show pages around current
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        
        for (let i = start; i <= end; i++) {
            if (!pages.includes(i)) {
                pages.push(i);
            }
        }
        
        // Add dots if needed
        if (currentPage < totalPages - 2) {
            pages.push('...');
        }
        
        // Always show last page
        if (!pages.includes(totalPages)) {
            pages.push(totalPages);
        }
    }
    
    console.log(`🔢 Generated pages:`, pages);
    return pages;
};

// 4. COMPLETELY NEW PAGINATION COMPONENT
// ============================================================================
window.renderDirectPagination = (tabName, totalItems) => {
    // Get current page
    let currentPage = 1;
    if (window.financialPagination && window.financialPagination[tabName]) {
        currentPage = window.financialPagination[tabName].currentPage;
    } else if (window.appState?.financialPagination?.[tabName]) {
        currentPage = window.appState.financialPagination[tabName].currentPage;
    }
    
    const itemsPerPage = 10;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) return null;
    
    console.log(`📄 Direct pagination: ${tabName}, page ${currentPage}/${totalPages}, ${totalItems} items`);
    
    const pageNumbers = window.getCorrectPageNumbers(currentPage, totalPages);
    const startItem = ((currentPage - 1) * itemsPerPage) + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    
    return React.createElement('div', { 
        className: 'px-6 py-4 border-t border-gray-200 dark:border-gray-700',
        key: `pagination-${tabName}-${currentPage}-${Date.now()}` // Force re-render
    },
        React.createElement('div', { className: 'flex items-center justify-between' },
            // Results info
            React.createElement('div', { className: 'text-sm text-gray-700 dark:text-gray-300' },
                `Showing ${startItem} to ${endItem} of ${totalItems} results`
            ),
            
            // Pagination controls
            React.createElement('div', { className: 'flex items-center space-x-1' },
                // Previous
                React.createElement('button', {
                    onClick: () => {
                        console.log(`🖱️ DIRECT Previous: ${tabName}, current: ${currentPage}`);
                        if (currentPage > 1) {
                            window.forceFinancialUpdate(tabName, currentPage - 1);
                        }
                    },
                    disabled: currentPage === 1,
                    className: `px-3 py-2 text-sm font-medium border rounded-l-md ${
                        currentPage === 1 
                            ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                            : 'text-gray-700 bg-white hover:bg-gray-50'
                    }`
                }, 'Previous'),
                
                // Page numbers
                ...pageNumbers.map((pageNum, index) => {
                    if (pageNum === '...') {
                        return React.createElement('span', {
                            key: `dots-${index}`,
                            className: 'px-3 py-2 text-sm text-gray-500'
                        }, '...');
                    }
                    
                    return React.createElement('button', {
                        key: `page-${pageNum}`,
                        onClick: () => {
                            console.log(`🖱️ DIRECT Page ${pageNum}: ${tabName}, current: ${currentPage}`);
                            if (pageNum !== currentPage) {
                                window.forceFinancialUpdate(tabName, pageNum);
                            }
                        },
                        className: `px-3 py-2 text-sm font-medium border ${
                            currentPage === pageNum 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'text-gray-700 bg-white hover:bg-gray-50'
                        }`
                    }, pageNum);
                }),
                
                // Next
                React.createElement('button', {
                    onClick: () => {
                        console.log(`🖱️ DIRECT Next: ${tabName}, current: ${currentPage}`);
                        if (currentPage < totalPages) {
                            window.forceFinancialUpdate(tabName, currentPage + 1);
                        }
                    },
                    disabled: currentPage >= totalPages,
                    className: `px-3 py-2 text-sm font-medium border rounded-r-md ${
                        currentPage >= totalPages 
                            ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                            : 'text-gray-700 bg-white hover:bg-gray-50'
                    }`
                }, 'Next')
            )
        )
    );
};

// 5. OVERRIDE ALL PAGINATION FUNCTIONS
// ============================================================================
window.renderFinancialPagination = window.renderDirectPagination;
window.renderWorkingPagination = window.renderDirectPagination;
window.renderWorkingFinancialPagination = window.renderDirectPagination;
window.renderFixedPagination = window.renderDirectPagination;

// 6. EVENT LISTENERS FOR ALL POSSIBLE EVENTS
// ============================================================================
const eventNames = ['financialUpdate', 'paginationChange', 'stateUpdate', 'forceRender'];
eventNames.forEach(eventName => {
    document.addEventListener(eventName, (event) => {
        console.log(`🔔 Event received: ${eventName}`, event.detail);
        
        // Try multiple re-render approaches
        setTimeout(() => {
            if (window.renderApp) {
                try {
                    window.renderApp();
                    console.log('✅ renderApp called after event');
                } catch (error) {
                    console.log('❌ renderApp failed:', error.message);
                }
            }
        }, 5);
        
        setTimeout(() => {
            if (window.forceUpdate) {
                try {
                    window.forceUpdate();
                    console.log('✅ forceUpdate called after event');
                } catch (error) {
                    console.log('❌ forceUpdate failed:', error.message);
                }
            }
        }, 10);
    });
});

// 7. INITIALIZE AND TEST
// ============================================================================
console.log('✅ Pagination Debug Fix loaded');

// Test the debug function
setTimeout(() => {
    console.log('🧪 Running financial state debug...');
    window.debugFinancialState();
    
    // Test page generation
    const testPages = window.getCorrectPageNumbers(2, 5);
    console.log('🧪 Test page generation (2 of 5):', testPages);
}, 2000);

// Manual testing functions
window.testPaginationClick = (tabName = 'sales', pageNum = 2) => {
    console.log(`🧪 Manual test: ${tabName} page ${pageNum}`);
    window.forceFinancialUpdate(tabName, pageNum);
};

console.log('🧪 Manual test available: window.testPaginationClick("sales", 2)');

// 8. IMMEDIATE DIAGNOSIS
// ============================================================================
// Run diagnosis right after loading to see what's available
setTimeout(() => {
    console.log('🔬 === IMMEDIATE DIAGNOSIS ===');
    
    // Check what happens when we update financialPagination
    const beforeUpdate = window.financialPagination?.sales?.currentPage;
    console.log('Before update - sales page:', beforeUpdate);
    
    if (window.financialPagination?.sales) {
        window.financialPagination.sales.currentPage = 999; // Test value
        console.log('After update - sales page:', window.financialPagination.sales.currentPage);
        
        // Reset it back
        window.financialPagination.sales.currentPage = beforeUpdate || 1;
    }
    
    // Check if changing appState triggers anything
    if (window.appState) {
        const beforeAppState = JSON.stringify(window.appState.financialPagination || {});
        window.appState.testValue = Date.now();
        console.log('AppState modified, checking if this triggers re-render...');
        
        setTimeout(() => {
            console.log('AppState test complete');
        }, 100);
    }
    
    console.log('🔬 === DIAGNOSIS COMPLETE ===');
}, 500);
