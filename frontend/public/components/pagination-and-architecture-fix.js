// ============================================================================
// QUICK FIX - FINANCIAL PAGINATION ERROR
// ============================================================================
// Fixes the "Cannot read properties of undefined (reading 'activesales')" error

// Initialize pagination state immediately (before any render calls)
window.financialPagination = window.financialPagination || {
    activesales: { currentPage: 1, itemsPerPage: 10 },
    sales: { currentPage: 1, itemsPerPage: 10 },
    receivables: { currentPage: 1, itemsPerPage: 10 },
    payables: { currentPage: 1, itemsPerPage: 10 },
    expiring: { currentPage: 1, itemsPerPage: 10 }
};

// Also set the alternative name for consistency
window.financialPaginationState = window.financialPagination;

// Fixed pagination function
window.setFinancialPage = (tabName, pageNumber) => {
    console.log(`🔄 Setting ${tabName} page to ${pageNumber}`);
    
    // Update pagination state
    window.financialPagination[tabName].currentPage = pageNumber;
    window.financialPaginationState[tabName].currentPage = pageNumber;
    
    // Force re-render using multiple methods
    if (window.setState) {
        window.setState({ forceUpdate: Date.now() });
    } else if (window.renderApp) {
        window.renderApp();
    } else {
        // Force React update
        const event = new CustomEvent('forceReactUpdate');
        document.dispatchEvent(event);
    }
    
    console.log(`✅ Page changed to ${pageNumber} for ${tabName}`);
};

// Enhanced pagination renderer that actually works
window.renderWorkingPagination = (tabName, totalItems) => {
    // Ensure pagination state exists
    if (!window.financialPagination || !window.financialPagination[tabName]) {
        console.warn(`No pagination state for ${tabName}, initializing...`);
        window.financialPagination = window.financialPagination || {};
        window.financialPagination[tabName] = { currentPage: 1, itemsPerPage: 10 };
    }

    const pagination = window.financialPagination[tabName];
    if (!pagination || totalItems <= pagination.itemsPerPage) return null;

    const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
    const currentPage = pagination.currentPage;

    console.log(`📄 Rendering pagination for ${tabName}: page ${currentPage} of ${totalPages} (${totalItems} items)`);

    return React.createElement('div', { className: 'px-6 py-4 border-t border-gray-200 dark:border-gray-700' },
        React.createElement('div', { className: 'flex items-center justify-between' },
            React.createElement('div', { className: 'text-sm text-gray-700 dark:text-gray-300' },
                `Showing ${((currentPage - 1) * pagination.itemsPerPage) + 1} to ${Math.min(currentPage * pagination.itemsPerPage, totalItems)} of ${totalItems} results`
            ),
            React.createElement('div', { className: 'flex items-center space-x-1' },
                // Previous button
                React.createElement('button', {
                    onClick: (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log(`🖱️ Previous clicked for ${tabName}, current page: ${currentPage}`);
                        if (currentPage > 1) {
                            window.setFinancialPage(tabName, currentPage - 1);
                        }
                    },
                    disabled: currentPage === 1,
                    className: 'px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                }, 'Previous'),
                
                // Page numbers
                ...Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = currentPage - 2 + i;
                    if (pageNum < 1) pageNum = i + 1;
                    if (pageNum > totalPages) return null;
                    
                    return React.createElement('button', {
                        key: pageNum,
                        onClick: (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log(`🖱️ Clicked page ${pageNum} for ${tabName}`);
                            window.setFinancialPage(tabName, pageNum);
                        },
                        className: `px-3 py-2 text-sm font-medium border transition-colors ${
                            currentPage === pageNum 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
                        }`
                    }, pageNum);
                }).filter(Boolean),
                
                // Next button
                React.createElement('button', {
                    onClick: (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log(`🖱️ Next clicked for ${tabName}, current page: ${currentPage}`);
                        if (currentPage < totalPages) {
                            window.setFinancialPage(tabName, currentPage + 1);
                        }
                    },
                    disabled: currentPage === totalPages,
                    className: 'px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                }, 'Next')
            )
        )
    );
};

// Safe getCurrentTabData function with better error handling
window.getSafeCurrentTabData = (activeFinancialTab, financialData, applyFilters) => {
    let data = [];
    
    console.log(`🔍 Getting data for tab: ${activeFinancialTab}`);
    console.log(`🔍 Available financial data:`, Object.keys(financialData));
    
    try {
        switch (activeFinancialTab) {
            case 'activesales':
                data = applyFilters(financialData.activeSales || []);
                break;
            case 'sales':
                data = applyFilters(financialData.sales || []);
                break;
            case 'receivables':
                data = applyFilters(financialData.receivables || []);
                break;
            case 'payables':
                data = applyFilters(financialData.payables || []);
                break;
            case 'expiring':
                data = window.getEnhancedExpiringInventory ? window.getEnhancedExpiringInventory() : [];
                break;
            default:
                data = [];
        }
        
        console.log(`🔍 Raw data for ${activeFinancialTab}:`, data.length, 'items');
        
        // Apply pagination
        const pagination = window.financialPagination[activeFinancialTab];
        if (pagination) {
            const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
            const endIndex = startIndex + pagination.itemsPerPage;
            const paginatedData = data.slice(startIndex, endIndex);
            
            console.log(`🔍 Paginated data for ${activeFinancialTab}: showing ${paginatedData.length} of ${data.length} total items`);
            
            return {
                data: paginatedData,
                totalItems: data.length
            };
        }
        
        return { data, totalItems: data.length };
        
    } catch (error) {
        console.error(`❌ Error getting data for ${activeFinancialTab}:`, error);
        return { data: [], totalItems: 0 };
    }
};

// Override existing broken functions
window.renderFinancialPagination = window.renderWorkingPagination;

// Enhanced initialization
window.initializeFinancialPagination = () => {
    console.log('🔄 Initializing financial pagination state');
    
    // Ensure both variable names are set
    window.financialPagination = window.financialPagination || {
        activesales: { currentPage: 1, itemsPerPage: 10 },
        sales: { currentPage: 1, itemsPerPage: 10 },
        receivables: { currentPage: 1, itemsPerPage: 10 },
        payables: { currentPage: 1, itemsPerPage: 10 },
        expiring: { currentPage: 1, itemsPerPage: 10 }
    };
    
    window.financialPaginationState = window.financialPagination;
    
    console.log('✅ Financial pagination initialized:', window.financialPagination);
};

// Initialize immediately
window.initializeFinancialPagination();

// Safe field value getter
window.getSafeFieldValue = (object, primaryField, fallbacks = [], defaultValue = 'N/A') => {
    if (!object || typeof object !== 'object') return defaultValue;
    
    // Try primary field first
    if (object[primaryField] !== undefined && object[primaryField] !== null && object[primaryField] !== '') {
        return object[primaryField];
    }
    
    // Try fallbacks
    for (const field of fallbacks) {
        if (object[field] !== undefined && object[field] !== null && object[field] !== '') {
            return object[field];
        }
    }
    
    return defaultValue;
};

// Safe date formatter
window.formatSafeDate = (dateValue) => {
    if (!dateValue) return 'No Date';
    
    try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString();
    } catch (error) {
        return 'Invalid Date';
    }
};

// Override broken functions with safe versions
window.getCurrentTabData = window.getSafeCurrentTabData;
window.formatFinancialDate = window.formatSafeDate;
window.formatFinancialDateRobust = (object, dateFields = ['due_date', 'date', 'created_date']) => {
    if (!object) return 'No Date';
    
    for (const field of dateFields) {
        if (object[field]) {
            return window.formatSafeDate(object[field]);
        }
    }
    
    return 'No Date';
};

// Enhanced error handling for render functions
window.safeRenderPayablesTab = (payables) => {
    console.log('🔍 Safe payables render called with:', payables);
    
    if (!payables || !Array.isArray(payables)) {
        payables = [];
    }
    
    const tabName = 'payables';
    
    return React.createElement('div', { className: 'space-y-4' },
        React.createElement('div', { className: 'overflow-x-auto' },
            React.createElement('table', { className: 'w-full' },
                React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-700' },
                    React.createElement('tr', null,
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Due Date'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Supplier'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Invoice #'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Amount'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Status'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
                    )
                ),
                React.createElement('tbody', { className: 'divide-y divide-gray-200 dark:divide-gray-700' },
                    payables.length > 0 ?
                        payables.map((payable, index) => {
                            const dueDate = window.formatFinancialDateRobust(payable);
                            const supplier = window.getSafeFieldValue(payable, 'supplier', ['supplier_name', 'vendor']);
                            const invoice = window.getSafeFieldValue(payable, 'invoice', ['invoice_number', 'reference']);
                            const amount = window.getSafeFieldValue(payable, 'amount', ['total'], 0);
                            const status = window.getSafeFieldValue(payable, 'status', ['payment_status'], 'pending');
                            
                            return React.createElement('tr', { key: payable.id || index, className: 'hover:bg-gray-50 dark:hover:bg-gray-700' },
                                React.createElement('td', { className: 'px-4 py-3 text-sm text-gray-900 dark:text-white' }, dueDate),
                                React.createElement('td', { className: 'px-4 py-3 text-sm text-gray-900 dark:text-white' }, supplier),
                                React.createElement('td', { className: 'px-4 py-3 text-sm text-gray-900 dark:text-white' }, invoice),
                                React.createElement('td', { className: 'px-4 py-3 text-sm font-medium text-gray-900 dark:text-white' }, 
                                    `₹${Number(amount || 0).toLocaleString()}`
                                ),
                                React.createElement('td', { className: 'px-4 py-3' },
                                    React.createElement('span', {
                                        className: `px-2 py-1 text-xs rounded-full ${
                                            status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`
                                    }, status)
                                ),
                                React.createElement('td', { className: 'px-4 py-3' },
                                    React.createElement('div', { className: 'flex space-x-2' },
                                        status === 'pending' && React.createElement('button', {
                                            className: 'text-blue-600 hover:text-blue-900 text-sm font-medium'
                                        }, 'Mark Paid'),
                                        React.createElement('button', {
                                            className: 'text-red-600 hover:text-red-800 font-medium'
                                        }, '🗑️ Delete')
                                    )
                                )
                            );
                        }) : React.createElement('tr', null,
                            React.createElement('td', { 
                                colSpan: 6, 
                                className: 'px-4 py-8 text-center text-gray-500' 
                            }, 'No payables found')
                        )
                )
            )
        ),
        
        // Working pagination
        window.renderWorkingPagination(tabName, payables.length)
    );
};

// Override the broken render functions
window.renderFixedPayablesTab = window.safeRenderPayablesTab;
window.renderPayablesTab = window.safeRenderPayablesTab;

console.log('✅ Financial Pagination Quick Fix loaded');
console.log('🔧 Pagination state initialized:', window.financialPagination);

// Test pagination state
setTimeout(() => {
    console.log('🧪 Testing pagination state access...');
    try {
        const testState = window.financialPagination.activesales;
        console.log('✅ Pagination state accessible:', testState);
    } catch (error) {
        console.error('❌ Pagination state error:', error);
    }
}, 1000);
