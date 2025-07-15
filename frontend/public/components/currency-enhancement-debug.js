// ============================================================================
// CURRENCY ENHANCEMENT DEBUG AND FIX
// ============================================================================
// This file fixes the integration issues with your multi-currency financial tables

// 1. FIRST - Create a proper initialization system
window.currencyEnhancementState = {
    initialized: false,
    originalFunctions: {},
    enhancedDataCache: null
};

// 2. ENHANCED DATA FETCHING WITH CURRENCY SUPPORT
window.fetchFinancialDataWithINR = async function() {
    console.log('🔄 Fetching financial data with INR conversion...');
    
    try {
        // Get the original financial data first
        const originalData = await window.fetchFinancialData();
        
        // Get current exchange rates
        const rates = window.currentExchangeRates || window.currencyTickerState?.rates || {
            USD: 83.50,
            EUR: 90.20,
            GBP: 105.50,
            AED: 22.75,
            SGD: 61.80
        };
        
        // Enhance receivables with currency data
        if (originalData.receivables) {
            originalData.receivables = originalData.receivables.map(rec => {
                // If already has currency data, keep it
                if (rec.original_currency) return rec;
                
                // Detect currency from amount or default to INR
                const currency = rec.currency || 'INR';
                const exchangeRate = currency === 'INR' ? 1 : (rates[currency] || 1);
                
                return {
                    ...rec,
                    amount: rec.amount || rec.balance_amount || 0, // INR value
                    original_amount: rec.original_amount || rec.amount || rec.balance_amount || 0,
                    original_currency: currency,
                    exchange_rate: exchangeRate
                };
            });
        }
        
        // Enhance payables with currency data
        if (originalData.payables) {
            originalData.payables = originalData.payables.map(pay => {
                if (pay.original_currency) return pay;
                
                const currency = pay.currency || 'INR';
                const exchangeRate = currency === 'INR' ? 1 : (rates[currency] || 1);
                
                return {
                    ...pay,
                    amount: pay.amount || 0, // INR value
                    original_amount: pay.original_amount || pay.amount || 0,
                    original_currency: currency,
                    exchange_rate: exchangeRate
                };
            });
        }
        
        // Enhance active sales with currency data
        if (originalData.activeSales) {
            originalData.activeSales = originalData.activeSales.map(sale => {
                if (sale.original_currency) return sale;
                
                const currency = sale.currency || 'INR';
                const exchangeRate = currency === 'INR' ? 1 : (rates[currency] || 1);
                
                return {
                    ...sale,
                    amount: sale.amount || 0, // INR value
                    original_amount: sale.original_amount || sale.amount || 0,
                    original_currency: currency,
                    exchange_rate: exchangeRate
                };
            });
        }
        
        // Cache the enhanced data
        window.currencyEnhancementState.enhancedDataCache = originalData;
        
        // Update global financial data
        window.financialData = originalData;
        window.appState.financialData = originalData;
        
        console.log('✅ Financial data enhanced with currency information');
        return originalData;
        
    } catch (error) {
        console.error('❌ Error fetching financial data with INR:', error);
        throw error;
    }
};

// 3. ENHANCED TABLE RENDERERS WITH CURRENCY COLUMNS
window.renderEnhancedReceivablesTable = function(receivables) {
    console.log('🎨 Rendering enhanced receivables table with currency...');
    
    return React.createElement('div', { className: 'overflow-x-auto' },
        React.createElement('table', { className: 'w-full' },
            React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-700' },
                React.createElement('tr', null,
                    React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Due Date'),
                    React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Invoice #'),
                    React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Client'),
                    React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Original Amount'),
                    React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'INR Amount'),
                    React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Days Overdue'),
                    React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
                )
            ),
            React.createElement('tbody', { className: 'divide-y divide-gray-200 dark:divide-gray-700' },
                receivables && receivables.length > 0 ?
                    receivables.map(rec => {
                        const dueDate = new Date(rec.due_date);
                        const today = new Date();
                        const daysDiff = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
                        const isOverdue = daysDiff > 0;
                        
                        // Currency display
                        const originalCurrency = rec.original_currency || 'INR';
                        const originalAmount = rec.original_amount || rec.amount || 0;
                        const inrAmount = rec.amount || 0;
                        
                        return React.createElement('tr', { key: rec.id },
                            React.createElement('td', { className: 'px-4 py-3 text-sm' }, 
                                window.formatFinancialDate(rec.due_date)
                            ),
                            React.createElement('td', { className: 'px-4 py-3 text-sm' }, rec.invoice_number || 'N/A'),
                            React.createElement('td', { className: 'px-4 py-3 text-sm' }, rec.client_name),
                            // Original Amount with Currency
                            React.createElement('td', { className: 'px-4 py-3 text-sm font-medium' }, 
                                originalCurrency === 'INR' ? 
                                    window.formatCurrency(originalAmount) :
                                    `${originalCurrency} ${originalAmount.toLocaleString()}`
                            ),
                            // INR Amount
                            React.createElement('td', { className: 'px-4 py-3 text-sm font-medium' }, 
                                window.formatCurrency(inrAmount)
                            ),
                            React.createElement('td', { className: 'px-4 py-3' },
                                React.createElement('span', {
                                    className: `text-sm ${isOverdue ? 'text-red-600' : 'text-green-600'}`
                                }, isOverdue ? `${Math.abs(daysDiff)} days overdue` : 'Not due')
                            ),
                            React.createElement('td', { className: 'px-4 py-3' },
                                React.createElement('div', { className: 'flex space-x-2' },
                                    React.createElement('button', {
                                        className: 'text-blue-600 hover:text-blue-800 font-medium',
                                        onClick: () => window.handleMarkPaymentFromReceivable(rec),
                                        title: 'Mark Payment Received'
                                    }, 'Mark Payment')
                                )
                            )
                        );
                    }) : 
                    React.createElement('tr', null,
                        React.createElement('td', { 
                            colSpan: 7, 
                            className: 'px-4 py-8 text-center text-gray-500' 
                        }, 'No receivables found')
                    )
            )
        )
    );
};

window.renderEnhancedPayablesTable = function(payables) {
    console.log('🎨 Rendering enhanced payables table with currency...');
    
    return React.createElement('div', { className: 'overflow-x-auto' },
        React.createElement('table', { className: 'w-full' },
            React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-700' },
                React.createElement('tr', null,
                    React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Due Date'),
                    React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Supplier'),
                    React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Invoice #'),
                    React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Original Amount'),
                    React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'INR Amount'),
                    React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Status'),
                    React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
                )
            ),
            React.createElement('tbody', { className: 'divide-y divide-gray-200 dark:divide-gray-700' },
                payables && payables.length > 0 ?
                    payables.map(payable => {
                        const originalCurrency = payable.original_currency || 'INR';
                        const originalAmount = payable.original_amount || payable.amount || 0;
                        const inrAmount = payable.amount || 0;
                        
                        return React.createElement('tr', { key: payable.id },
                            React.createElement('td', { className: 'px-4 py-3 text-sm' }, 
                                window.formatFinancialDate(payable.due_date)
                            ),
                            React.createElement('td', { className: 'px-4 py-3 text-sm' }, payable.supplier_name),
                            React.createElement('td', { className: 'px-4 py-3 text-sm' }, payable.invoice_number || 'N/A'),
                            // Original Amount with Currency
                            React.createElement('td', { className: 'px-4 py-3 text-sm font-medium' }, 
                                originalCurrency === 'INR' ? 
                                    window.formatCurrency(originalAmount) :
                                    `${originalCurrency} ${originalAmount.toLocaleString()}`
                            ),
                            // INR Amount
                            React.createElement('td', { className: 'px-4 py-3 text-sm font-medium' }, 
                                window.formatCurrency(inrAmount)
                            ),
                            React.createElement('td', { className: 'px-4 py-3' },
                                React.createElement('span', {
                                    className: `px-2 py-1 text-xs rounded ${
                                        payable.status === 'paid' ? 'bg-green-100 text-green-800' :
                                        payable.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`
                                }, payable.status || 'pending')
                            ),
                            React.createElement('td', { className: 'px-4 py-3' },
                                React.createElement('button', {
                                    className: 'text-blue-600 hover:text-blue-800 font-medium',
                                    onClick: () => window.handleMarkAsPaid(payable.id),
                                    disabled: payable.status === 'paid'
                                }, 'Mark Paid')
                            )
                        );
                    }) :
                    React.createElement('tr', null,
                        React.createElement('td', { 
                            colSpan: 7, 
                            className: 'px-4 py-8 text-center text-gray-500' 
                        }, 'No payables found')
                    )
            )
        )
    );
};

window.renderEnhancedActiveSalesTable = function(sales) {
    console.log('🎨 Rendering enhanced active sales table with currency...');
    
    return React.createElement('div', { className: 'overflow-x-auto' },
        React.createElement('table', { className: 'w-full' },
            React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-700' },
                React.createElement('tr', null,
                    React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Date'),
                    React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Invoice #'),
                    React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Client'),
                    React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Assigned To'),
                    React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Original Amount'),
                    React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'INR Amount'),
                    React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Status')
                )
            ),
            React.createElement('tbody', { className: 'divide-y divide-gray-200 dark:divide-gray-700' },
                sales && sales.length > 0 ?
                    sales.map(sale => {
                        const originalCurrency = sale.original_currency || 'INR';
                        const originalAmount = sale.original_amount || sale.amount || 0;
                        const inrAmount = sale.amount || 0;
                        
                        return React.createElement('tr', { key: sale.id },
                            React.createElement('td', { className: 'px-4 py-3 text-sm' }, 
                                window.formatFinancialDate(sale.date || sale.created_date)
                            ),
                            React.createElement('td', { className: 'px-4 py-3 text-sm' }, sale.invoiceNumber || sale.invoice_number || 'N/A'),
                            React.createElement('td', { className: 'px-4 py-3 text-sm' }, sale.clientName || sale.client_name),
                            React.createElement('td', { className: 'px-4 py-3 text-sm' }, sale.assignedTo || sale.assigned_to),
                            // Original Amount with Currency
                            React.createElement('td', { className: 'px-4 py-3 text-sm font-medium' }, 
                                originalCurrency === 'INR' ? 
                                    window.formatCurrency(originalAmount) :
                                    `${originalCurrency} ${originalAmount.toLocaleString()}`
                            ),
                            // INR Amount
                            React.createElement('td', { className: 'px-4 py-3 text-sm font-medium' }, 
                                window.formatCurrency(inrAmount)
                            ),
                            React.createElement('td', { className: 'px-4 py-3' },
                                React.createElement('span', {
                                    className: `px-2 py-1 text-xs rounded ${
                                        sale.status === 'paid' || sale.status === 'active' ? 'bg-green-100 text-green-800' :
                                        sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`
                                }, sale.status || 'active')
                            )
                        );
                    }) :
                    React.createElement('tr', null,
                        React.createElement('td', { 
                            colSpan: 7, 
                            className: 'px-4 py-8 text-center text-gray-500' 
                        }, 'No sales data found')
                    )
            )
        )
    );
};

// 4. ROBUST ENHANCEMENT FUNCTION WITH PROPER TIMING
window.enhanceFinancialsWithCurrency = function() {
    console.log('🚀 Enhancing financials with currency support...');
    
    // Check if already initialized
    if (window.currencyEnhancementState.initialized) {
        console.log('⚠️ Currency enhancement already initialized');
        return;
    }
    
    // Store original functions BEFORE overriding
    window.currencyEnhancementState.originalFunctions = {
        renderReceivablesTable: window.renderReceivablesTab || window.renderReceivablesTable,
        renderPayablesTable: window.renderPayablesTab || window.renderPayablesTable,
        renderActiveSalesTable: window.renderActiveSalesTab || window.renderActiveSalesTable,
        fetchFinancialData: window.fetchFinancialData
    };
    
    // Override the table rendering functions
    window.renderReceivablesTab = window.renderEnhancedReceivablesTable;
    window.renderReceivablesTable = window.renderEnhancedReceivablesTable;
    
    window.renderPayablesTab = window.renderEnhancedPayablesTable;
    window.renderPayablesTable = window.renderEnhancedPayablesTable;
    
    window.renderActiveSalesTab = window.renderEnhancedActiveSalesTable;
    window.renderActiveSalesTable = window.renderEnhancedActiveSalesTable;
    
    // Override the fetch function to use enhanced version
    const originalFetch = window.fetchFinancialData;
    window.fetchFinancialData = async function() {
        console.log('🔄 Intercepted fetchFinancialData - using enhanced version');
        return window.fetchFinancialDataWithINR();
    };
    
    // Also intercept the consolidated data fetch if it exists
    if (window.consolidatedDataFetch) {
        const originalConsolidated = window.consolidatedDataFetch;
        window.consolidatedDataFetch = async function() {
            console.log('🔄 Intercepted consolidatedDataFetch - ensuring currency enhancement');
            const result = await originalConsolidated.call(this);
            
            // Ensure financial data is enhanced
            if (window.financialData) {
                await window.fetchFinancialDataWithINR();
            }
            
            return result;
        };
    }
    
    // Mark as initialized
    window.currencyEnhancementState.initialized = true;
    
    console.log('✅ Currency enhancement initialized successfully');
    
    // If financial data already exists, enhance it
    if (window.financialData) {
        console.log('🔄 Enhancing existing financial data...');
        window.fetchFinancialDataWithINR().then(() => {
            // Force re-render if there's an update function
            if (window.forceUpdate) {
                window.forceUpdate();
            }
        });
    }
};

// 5. MONITORING FUNCTION TO PREVENT OVERRIDE
window.protectCurrencyEnhancement = function() {
    if (!window.currencyEnhancementState.initialized) return;
    
    // Check if functions have been overridden
    if (window.renderReceivablesTab !== window.renderEnhancedReceivablesTable) {
        console.log('⚠️ Receivables table function was overridden, restoring...');
        window.renderReceivablesTab = window.renderEnhancedReceivablesTable;
        window.renderReceivablesTable = window.renderEnhancedReceivablesTable;
    }
    
    if (window.renderPayablesTab !== window.renderEnhancedPayablesTable) {
        console.log('⚠️ Payables table function was overridden, restoring...');
        window.renderPayablesTab = window.renderEnhancedPayablesTable;
        window.renderPayablesTable = window.renderEnhancedPayablesTable;
    }
    
    if (window.renderActiveSalesTab !== window.renderEnhancedActiveSalesTable) {
        console.log('⚠️ Active sales table function was overridden, restoring...');
        window.renderActiveSalesTab = window.renderEnhancedActiveSalesTable;
        window.renderActiveSalesTable = window.renderEnhancedActiveSalesTable;
    }
};

// 6. INITIALIZATION WITH PROPER TIMING
console.log('💰 Currency Enhancement Debug Script Loaded');

// Method 1: Initialize after a delay
setTimeout(() => {
    if (!window.currencyEnhancementState.initialized) {
        window.enhanceFinancialsWithCurrency();
    }
}, 2000);

// Method 2: Initialize when financial component is ready
const checkFinancialComponent = setInterval(() => {
    if (window.renderFinancials && window.fetchFinancialData) {
        clearInterval(checkFinancialComponent);
        if (!window.currencyEnhancementState.initialized) {
            window.enhanceFinancialsWithCurrency();
        }
    }
}, 500);

// Method 3: Hook into React lifecycle if available
if (window.React && window.React.useEffect) {
    const originalUseEffect = window.React.useEffect;
    window.React.useEffect = function(callback, deps) {
        const callbackString = callback.toString();
        
        // Intercept financial component effects
        if (callbackString.includes('fetchFinancialData') || 
            callbackString.includes('financialData')) {
            
            const wrappedCallback = function() {
                const result = callback.apply(this, arguments);
                
                // Ensure enhancement after financial data loads
                setTimeout(() => {
                    if (!window.currencyEnhancementState.initialized) {
                        window.enhanceFinancialsWithCurrency();
                    }
                }, 100);
                
                return result;
            };
            
            return originalUseEffect.call(this, wrappedCallback, deps);
        }
        
        return originalUseEffect.apply(this, arguments);
    };
}

// Method 4: Protection interval to prevent overrides
setInterval(window.protectCurrencyEnhancement, 1000);

// 7. DEBUG FUNCTIONS
window.debugCurrencyEnhancement = function() {
    console.log('=== Currency Enhancement Debug Info ===');
    console.log('Initialized:', window.currencyEnhancementState.initialized);
    console.log('Current Functions:', {
        renderReceivablesTab: window.renderReceivablesTab?.name || 'undefined',
        renderPayablesTab: window.renderPayablesTab?.name || 'undefined',
        renderActiveSalesTab: window.renderActiveSalesTab?.name || 'undefined',
        fetchFinancialData: window.fetchFinancialData?.name || 'undefined'
    });
    console.log('Financial Data:', window.financialData);
    console.log('Exchange Rates:', window.currentExchangeRates || window.currencyTickerState?.rates);
    console.log('Enhanced Data Cache:', window.currencyEnhancementState.enhancedDataCache);
};

window.forceEnhanceFinancials = function() {
    console.log('🔧 Force enhancing financials...');
    window.currencyEnhancementState.initialized = false;
    window.enhanceFinancialsWithCurrency();
    window.fetchFinancialDataWithINR().then(() => {
        if (window.forceUpdate) {
            window.forceUpdate();
        }
    });
};

// 8. CONSOLE HELPER
console.log(`
💰 Currency Enhancement Debug Commands:
- debugCurrencyEnhancement() - Show debug info
- forceEnhanceFinancials() - Force re-enhancement
- window.currencyEnhancementState - View state
`);
