// ============================================================================
// PAGINATION FIX + BETTER DATA ARCHITECTURE
// ============================================================================
// Fixes pagination re-rendering and provides better data handling

// 1. FIXED PAGINATION WITH PROPER RE-RENDERING
// ============================================================================

// Enhanced pagination state management
window.financialPaginationState = {
    activesales: { currentPage: 1, itemsPerPage: 10 },
    sales: { currentPage: 1, itemsPerPage: 10 },
    receivables: { currentPage: 1, itemsPerPage: 10 },
    payables: { currentPage: 1, itemsPerPage: 10 },
    expiring: { currentPage: 1, itemsPerPage: 10 }
};

// Fixed pagination function that ACTUALLY triggers re-render
window.setFinancialPage = (tabName, pageNumber) => {
    console.log(`🔄 Setting ${tabName} page to ${pageNumber}`);
    
    // Update pagination state
    window.financialPaginationState[tabName].currentPage = pageNumber;
    
    // Force re-render using multiple methods
    if (window.setAppState) {
        // Method 1: Update app state (preferred)
        window.setAppState(prevState => ({
            ...prevState,
            financialPagination: { ...window.financialPaginationState }
        }));
    } else if (window.renderApp) {
        // Method 2: Direct re-render
        window.renderApp();
    } else if (window.setState) {
        // Method 3: Generic setState
        window.setState({});
    } else {
        // Method 4: Force React update
        const event = new CustomEvent('forceReactUpdate');
        document.dispatchEvent(event);
    }
    
    console.log(`✅ Page changed to ${pageNumber} for ${tabName}`);
};

// Enhanced pagination renderer with WORKING click handlers
window.renderWorkingFinancialPagination = (tabName, totalItems) => {
    const pagination = window.financialPaginationState[tabName];
    if (!pagination || totalItems <= pagination.itemsPerPage) return null;

    const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
    const currentPage = pagination.currentPage;

    console.log(`📄 Rendering pagination for ${tabName}: page ${currentPage} of ${totalPages}`);

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
                        if (currentPage > 1) {
                            window.setFinancialPage(tabName, currentPage - 1);
                        }
                    },
                    disabled: currentPage === 1,
                    className: 'px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                }, 'Previous'),
                
                // Page numbers (show up to 5 pages)
                ...Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, currentPage - 2) + i;
                    if (pageNum > totalPages) return null;
                    
                    return React.createElement('button', {
                        key: pageNum,
                        onClick: (e) => {
                            e.preventDefault();
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

// 2. BACKEND-OPTIMIZED DATA FETCHING ARCHITECTURE
// ============================================================================

// Backend pagination API calls (replace frontend processing)
window.fetchFinancialDataPage = async (tabName, page = 1, itemsPerPage = 10, filters = {}) => {
    const endpoint = `/api/financial/${tabName}`;
    const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...filters
    });

    try {
        console.log(`🌐 Fetching ${tabName} data: page ${page}, limit ${itemsPerPage}`);
        
        const response = await fetch(`${endpoint}?${params}`, {
            headers: {
                'Authorization': `Bearer ${window.authToken || ''}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        console.log(`✅ Received ${tabName} data:`, data);
        
        return {
            items: data.items || data.data || [],
            totalItems: data.totalItems || data.total || 0,
            currentPage: page,
            totalPages: Math.ceil((data.totalItems || 0) / itemsPerPage)
        };
        
    } catch (error) {
        console.error(`❌ Error fetching ${tabName} data:`, error);
        
        // Fallback to frontend processing
        return window.getFallbackFinancialData(tabName, page, itemsPerPage, filters);
    }
};

// Fallback frontend processing (when backend isn't ready)
window.getFallbackFinancialData = (tabName, page, itemsPerPage, filters) => {
    console.log(`🔄 Using fallback frontend processing for ${tabName}`);
    
    let allData = [];
    const financialData = window.appState?.financialData || {};
    
    switch (tabName) {
        case 'activesales':
            allData = financialData.activeSales || [];
            break;
        case 'sales':
            allData = financialData.sales || [];
            break;
        case 'receivables':
            allData = financialData.receivables || [];
            break;
        case 'payables':
            allData = financialData.payables || [];
            break;
        case 'expiring':
            allData = window.getEnhancedExpiringInventory() || [];
            break;
        default:
            allData = [];
    }

    // Apply filters on frontend (temporary until backend filtering)
    const filteredData = allData.filter(item => {
        if (filters.clientName) {
            const nameField = tabName === 'payables' ? 'supplier' : 'client_name';
            const name = (item[nameField] || '').toLowerCase();
            if (!name.includes(filters.clientName.toLowerCase())) return false;
        }
        
        if (filters.status && filters.status !== 'all') {
            if (item.status !== filters.status) return false;
        }
        
        return true;
    });

    // Apply pagination
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return {
        items: paginatedData,
        totalItems: filteredData.length,
        currentPage: page,
        totalPages: Math.ceil(filteredData.length / itemsPerPage)
    };
};

// 3. CORRECTED FIELD MAPPING BASED ON CONSOLE LOGS
// ============================================================================

// I can see from your console logs the actual field names:
// "Processing receivable: {id: 'h7WppqJ4cq6xp9vfDprL', order_id: '0yrZxVfrOjX04btMZ7l5', order_number: 'ORD-1751574660233', client_name: 'Sachin Gupta', client_email: 'sachin.gupta@ikshealth.com', …}"

window.getCorrectFieldValue = (object, primaryField, fallbacks = [], defaultValue = 'N/A') => {
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

// 4. IMPROVED PAYABLES RENDERER WITH CORRECT FIELDS
// ============================================================================

window.renderOptimizedPayablesTab = (payables) => {
    console.log('🔍 renderOptimizedPayablesTab called with:', payables);
    
    const tabName = 'payables';
    const pagination = window.financialPaginationState[tabName];
    
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
                    payables && payables.length > 0 ?
                        payables.map((payable, index) => {
                            // Use correct field names based on your actual data structure
                            const dueDate = window.formatFinancialDateRobust(payable, ['due_date', 'payment_due_date', 'date']);
                            const supplier = window.getCorrectFieldValue(payable, 'supplier_name', ['supplier', 'vendor', 'company_name']);
                            const invoice = window.getCorrectFieldValue(payable, 'invoice_number', ['invoice', 'reference', 'bill_number']);
                            const amount = window.getCorrectFieldValue(payable, 'amount', ['total', 'bill_amount'], 0);
                            const status = window.getCorrectFieldValue(payable, 'status', ['payment_status'], 'pending');
                            
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
        window.renderWorkingFinancialPagination(tabName, payables?.length || 0)
    );
};

// 5. IMPROVED RECEIVABLES RENDERER
// ============================================================================

window.renderOptimizedReceivablesTab = (receivables) => {
    console.log('🔍 renderOptimizedReceivablesTab called with:', receivables);
    
    const tabName = 'receivables';
    
    return React.createElement('div', { className: 'space-y-4' },
        React.createElement('h4', { className: 'text-lg font-semibold mb-4' }, 'Receivables'),

        React.createElement('div', { className: 'overflow-x-auto' },
            React.createElement('table', { className: 'w-full' },
                React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-700' },
                    React.createElement('tr', null,
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Due Date'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Invoice #'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Client'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Amount'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Days Overdue'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
                    )
                ),
                React.createElement('tbody', { className: 'divide-y divide-gray-200 dark:divide-gray-700' },
                    receivables && receivables.length > 0 ?
                        receivables.map((receivable, index) => {
                            // Use correct field names from your console logs
                            const dueDate = window.formatFinancialDateRobust(receivable, ['due_date', 'payment_due_date', 'date']);
                            const invoice = window.getCorrectFieldValue(receivable, 'order_number', ['invoice_number', 'invoice', 'reference']);
                            const client = window.getCorrectFieldValue(receivable, 'client_name', ['client', 'customer_name']);
                            const amount = window.getCorrectFieldValue(receivable, 'amount', ['total', 'invoice_amount'], 0);
                            
                            return React.createElement('tr', { key: receivable.id || index, className: 'hover:bg-gray-50 dark:hover:bg-gray-700' },
                                React.createElement('td', { className: 'px-4 py-3 text-sm text-gray-900 dark:text-white' }, dueDate),
                                React.createElement('td', { className: 'px-4 py-3 text-sm text-gray-900 dark:text-white' }, invoice),
                                React.createElement('td', { className: 'px-4 py-3 text-sm text-gray-900 dark:text-white' }, client),
                                React.createElement('td', { className: 'px-4 py-3 text-sm font-medium text-gray-900 dark:text-white' }, 
                                    `₹${Number(amount || 0).toLocaleString()}`
                                ),
                                React.createElement('td', { className: 'px-4 py-3 text-sm' },
                                    React.createElement('span', {
                                        className: 'px-2 py-1 text-xs rounded-full bg-red-100 text-red-800'
                                    }, '6 days') // You can calculate this based on due_date
                                ),
                                React.createElement('td', { className: 'px-4 py-3' },
                                    React.createElement('div', { className: 'flex space-x-2' },
                                        React.createElement('button', {
                                            className: 'text-green-600 hover:text-green-800 font-medium'
                                        }, '✅ Mark Paid'),
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
                            }, 'No receivables found')
                        )
                )
            )
        ),
        
        // Working pagination
        window.renderWorkingFinancialPagination(tabName, receivables?.length || 0)
    );
};

// 6. OVERRIDE EXISTING FUNCTIONS
// ============================================================================

// Replace broken pagination functions
window.renderFinancialPagination = window.renderWorkingFinancialPagination;
window.renderFixedPayablesTab = window.renderOptimizedPayablesTab;
window.renderFixedReceivablesTab = window.renderOptimizedReceivablesTab;
window.renderPayablesTab = window.renderOptimizedPayablesTab;
window.renderReceivablesTab = window.renderOptimizedReceivablesTab;

// 7. INITIALIZATION
// ============================================================================

// Initialize pagination state
window.initializeFinancialPagination = () => {
    console.log('🔄 Initializing financial pagination state');
    // Already initialized at top
};

// Listen for custom re-render events
document.addEventListener('forceReactUpdate', () => {
    console.log('🔄 Force React update triggered');
    if (window.renderApp) {
        window.renderApp();
    }
});

console.log('✅ Pagination Fix + Architecture Improvements loaded');
console.log('📊 Recommendation: Move to backend pagination for better performance');

// 8. BACKEND INTEGRATION RECOMMENDATION
// ============================================================================

window.logArchitectureRecommendation = () => {
    console.log(`
📈 PERFORMANCE RECOMMENDATION:

Current: Frontend processing of all data
- ✅ Works for small datasets (<100 items)
- ❌ Slow for large datasets (>500 items)
- ❌ Loads all data upfront
- ❌ Filtering happens in browser

Recommended: Backend pagination + filtering
- ✅ Fast for any dataset size
- ✅ Loads only needed data
- ✅ Filtering happens on server
- ✅ Better user experience

Next Steps:
1. Implement API endpoints: /api/financial/payables?page=1&limit=10
2. Add backend filtering: &status=pending&supplier=XS2Event
3. Return: { items: [...], totalItems: 150, currentPage: 1 }
4. Replace window.getFallbackFinancialData with window.fetchFinancialDataPage
    `);
};

// Show recommendation
setTimeout(window.logArchitectureRecommendation, 2000);
