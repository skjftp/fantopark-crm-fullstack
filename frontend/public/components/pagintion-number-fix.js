// ============================================================================
// FIX PAGINATION NUMBERS AND CLICKING
// ============================================================================
// Fixes the duplicate page numbers (1,2,1) and non-working clicks

// 1. FIXED PAGE NUMBER CALCULATION
// ============================================================================
window.generatePageNumbers = (currentPage, totalPages, maxVisible = 5) => {
    const pages = [];
    
    if (totalPages <= maxVisible) {
        // Show all pages if total is small
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
    } else {
        // Show pages around current page
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        // Adjust if we're near the end
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
    }
    
    console.log(`📄 Generated page numbers for page ${currentPage} of ${totalPages}:`, pages);
    return pages;
};

// 2. ENHANCED RE-RENDER MECHANISM
// ============================================================================
window.triggerFinancialReRender = (tabName, newPage) => {
    console.log(`🔄 Triggering re-render for ${tabName}, page ${newPage}`);
    
    // Update pagination state
    window.financialPagination[tabName].currentPage = newPage;
    
    // Try multiple re-render methods
    let renderTriggered = false;
    
    // Method 1: Update React state if available
    if (window.setAppState && typeof window.setAppState === 'function') {
        try {
            window.setAppState(prevState => ({
                ...prevState,
                financialPagination: { ...window.financialPagination },
                lastUpdate: Date.now() // Force change detection
            }));
            renderTriggered = true;
            console.log('✅ Re-render triggered via setAppState');
        } catch (error) {
            console.log('❌ setAppState failed:', error.message);
        }
    }
    
    // Method 2: Force React update via state setter
    if (!renderTriggered && window.setState && typeof window.setState === 'function') {
        try {
            window.setState({ 
                forceUpdate: Date.now(),
                financialPagination: { ...window.financialPagination }
            });
            renderTriggered = true;
            console.log('✅ Re-render triggered via setState');
        } catch (error) {
            console.log('❌ setState failed:', error.message);
        }
    }
    
    // Method 3: Direct app re-render
    if (!renderTriggered && window.renderApp && typeof window.renderApp === 'function') {
        try {
            setTimeout(() => window.renderApp(), 10);
            renderTriggered = true;
            console.log('✅ Re-render triggered via renderApp');
        } catch (error) {
            console.log('❌ renderApp failed:', error.message);
        }
    }
    
    // Method 4: Force component update via event
    if (!renderTriggered) {
        try {
            const event = new CustomEvent('financialPaginationUpdate', {
                detail: { tabName, newPage }
            });
            document.dispatchEvent(event);
            console.log('✅ Re-render event dispatched');
        } catch (error) {
            console.log('❌ Event dispatch failed:', error.message);
        }
    }
    
    // Method 5: Last resort - direct DOM manipulation signal
    setTimeout(() => {
        const paginationElement = document.querySelector(`[data-tab="${tabName}"]`);
        if (paginationElement) {
            paginationElement.setAttribute('data-page', newPage);
        }
    }, 50);
};

// 3. COMPLETELY FIXED PAGINATION RENDERER
// ============================================================================
window.renderFixedPagination = (tabName, totalItems) => {
    // Safety checks
    if (!window.financialPagination || !window.financialPagination[tabName]) {
        console.warn(`No pagination state for ${tabName}`);
        return null;
    }

    const pagination = window.financialPagination[tabName];
    const { currentPage, itemsPerPage } = pagination;
    
    if (totalItems <= itemsPerPage) {
        console.log(`📄 Not showing pagination for ${tabName}: ${totalItems} items <= ${itemsPerPage} per page`);
        return null;
    }

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = ((currentPage - 1) * itemsPerPage) + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    
    console.log(`📄 Rendering pagination for ${tabName}: page ${currentPage}/${totalPages}, showing ${startItem}-${endItem} of ${totalItems}`);

    // Generate correct page numbers
    const pageNumbers = window.generatePageNumbers(currentPage, totalPages);

    return React.createElement('div', { 
        className: 'px-6 py-4 border-t border-gray-200 dark:border-gray-700',
        'data-tab': tabName,
        'data-page': currentPage
    },
        React.createElement('div', { className: 'flex items-center justify-between' },
            // Results info
            React.createElement('div', { className: 'text-sm text-gray-700 dark:text-gray-300' },
                `Showing ${startItem} to ${endItem} of ${totalItems} results`
            ),
            
            // Pagination controls
            React.createElement('div', { className: 'flex items-center space-x-1' },
                // Previous button
                React.createElement('button', {
                    onClick: (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log(`🖱️ Previous clicked for ${tabName} (current: ${currentPage})`);
                        if (currentPage > 1) {
                            window.triggerFinancialReRender(tabName, currentPage - 1);
                        }
                    },
                    disabled: currentPage === 1,
                    className: `px-3 py-2 text-sm font-medium rounded-l-md border transition-colors ${
                        currentPage === 1 
                            ? 'text-gray-400 bg-gray-100 border-gray-300 cursor-not-allowed' 
                            : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                    }`
                }, 'Previous'),
                
                // Page number buttons
                ...pageNumbers.map(pageNum => 
                    React.createElement('button', {
                        key: `page-${pageNum}`,
                        onClick: (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log(`🖱️ Page ${pageNum} clicked for ${tabName} (current: ${currentPage})`);
                            if (pageNum !== currentPage) {
                                window.triggerFinancialReRender(tabName, pageNum);
                            }
                        },
                        className: `px-3 py-2 text-sm font-medium border transition-colors ${
                            currentPage === pageNum 
                                ? 'bg-blue-600 text-white border-blue-600 z-10' 
                                : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                        }`
                    }, pageNum)
                ),
                
                // Next button
                React.createElement('button', {
                    onClick: (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log(`🖱️ Next clicked for ${tabName} (current: ${currentPage})`);
                        if (currentPage < totalPages) {
                            window.triggerFinancialReRender(tabName, currentPage + 1);
                        }
                    },
                    disabled: currentPage === totalPages,
                    className: `px-3 py-2 text-sm font-medium rounded-r-md border transition-colors ${
                        currentPage === totalPages 
                            ? 'text-gray-400 bg-gray-100 border-gray-300 cursor-not-allowed' 
                            : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                    }`
                }, 'Next')
            )
        )
    );
};

// 4. UPDATED FINANCIAL TAB RENDERERS WITH WORKING PAGINATION
// ============================================================================

// Enhanced sales tab with fixed pagination
window.renderSalesTabWithPagination = (sales) => {
    console.log('🔍 Rendering sales tab with working pagination:', sales?.length || 0, 'items');
    
    // Initialize chart
    setTimeout(() => {
        if (window.createFinancialSalesChart) {
            window.createFinancialSalesChart();
        }
    }, 100);
    
    return React.createElement('div', { className: 'space-y-4' },
        // Sales Chart
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border' },
            React.createElement('h4', { className: 'text-lg font-semibold mb-4 text-gray-900 dark:text-white' }, 'Sales Trend'),
            React.createElement('div', { className: 'h-64 relative' },
                React.createElement('canvas', { 
                    id: 'financialSalesChart',
                    style: { maxHeight: '250px' }
                })
            )
        ),

        // Sales Table
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border' },
            React.createElement('div', { className: 'overflow-x-auto' },
                React.createElement('table', { className: 'w-full' },
                    React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-700' },
                        React.createElement('tr', null,
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Date'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Invoice #'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Client'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Sales Person'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Amount'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Status')
                        )
                    ),
                    React.createElement('tbody', { className: 'divide-y divide-gray-200 dark:divide-gray-700' },
                        sales && sales.length > 0 ? 
                            sales.map((sale, index) => {
                                const date = window.formatSafeDate(sale.date || sale.created_date);
                                const invoice = window.getSafeFieldValue(sale, 'invoice', ['invoice_number', 'order_number'], 'N/A');
                                const client = window.getSafeFieldValue(sale, 'client', ['client_name', 'customer'], 'N/A');
                                const salesPerson = window.getSafeFieldValue(sale, 'sales_person', ['assigned_to'], 'N/A');
                                const amount = window.getSafeFieldValue(sale, 'amount', ['total'], 0);
                                const status = window.getSafeFieldValue(sale, 'status', [], 'paid');
                                
                                return React.createElement('tr', { key: sale.id || index, className: 'hover:bg-gray-50 dark:hover:bg-gray-700' },
                                    React.createElement('td', { className: 'px-4 py-3 text-sm text-gray-900 dark:text-white' }, date),
                                    React.createElement('td', { className: 'px-4 py-3 text-sm text-gray-900 dark:text-white' }, invoice),
                                    React.createElement('td', { className: 'px-4 py-3 text-sm text-gray-900 dark:text-white' }, client),
                                    React.createElement('td', { className: 'px-4 py-3 text-sm text-gray-900 dark:text-white' }, salesPerson),
                                    React.createElement('td', { className: 'px-4 py-3 text-sm font-medium text-gray-900 dark:text-white' }, 
                                        `₹${Number(amount || 0).toLocaleString()}`
                                    ),
                                    React.createElement('td', { className: 'px-4 py-3' },
                                        React.createElement('span', {
                                            className: `px-2 py-1 text-xs rounded-full ${
                                                status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`
                                        }, status)
                                    )
                                );
                            }) : 
                            React.createElement('tr', null,
                                React.createElement('td', { 
                                    colSpan: 6, 
                                    className: 'px-4 py-8 text-center text-gray-500' 
                                }, 'No sales data available')
                            )
                    )
                )
            ),
            
            // Fixed pagination
            window.renderFixedPagination('sales', sales?.length || 0)
        )
    );
};

// Enhanced payables tab with fixed pagination
window.renderPayablesTabWithPagination = (payables) => {
    console.log('🔍 Rendering payables tab with working pagination:', payables?.length || 0, 'items');
    
    return React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border' },
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
                            const dueDate = window.formatSafeDate(payable.due_date || payable.date);
                            const supplier = window.getSafeFieldValue(payable, 'supplier', ['supplier_name'], 'N/A');
                            const invoice = window.getSafeFieldValue(payable, 'invoice', ['invoice_number'], 'N/A');
                            const amount = window.getSafeFieldValue(payable, 'amount', ['total'], 0);
                            const status = window.getSafeFieldValue(payable, 'status', [], 'pending');
                            
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
        
        // Fixed pagination
        window.renderFixedPagination('payables', payables?.length || 0)
    );
};

// 5. OVERRIDE EXISTING FUNCTIONS
// ============================================================================

// Replace all pagination functions with working versions
window.renderFinancialPagination = window.renderFixedPagination;
window.renderWorkingPagination = window.renderFixedPagination;
window.renderWorkingFinancialPagination = window.renderFixedPagination;

// Replace tab renderers with working pagination versions
window.renderFixedSalesTab = window.renderSalesTabWithPagination;
window.renderSalesTab = window.renderSalesTabWithPagination;
window.renderFixedPayablesTab = window.renderPayablesTabWithPagination;
window.renderPayablesTab = window.renderPayablesTabWithPagination;

// 6. EVENT LISTENERS FOR CUSTOM EVENTS
// ============================================================================

// Listen for pagination update events
document.addEventListener('financialPaginationUpdate', (event) => {
    console.log('🔄 Financial pagination update event received:', event.detail);
    
    // Force a React update
    setTimeout(() => {
        if (window.renderApp) {
            window.renderApp();
        }
    }, 10);
});

console.log('✅ Pagination Number Fix loaded');
console.log('🔧 Fixed issues: Page number calculation & click handlers');

// Test pagination functions
setTimeout(() => {
    console.log('🧪 Testing pagination functions...');
    const testPages = window.generatePageNumbers(1, 5);
    console.log('📄 Test page generation (current=1, total=5):', testPages);
    
    const testPages2 = window.generatePageNumbers(3, 10);
    console.log('📄 Test page generation (current=3, total=10):', testPages2);
}, 1000);
