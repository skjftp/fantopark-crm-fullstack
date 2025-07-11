// ============================================================================
// FINANCIALS COMPONENT - INTEGRATION PATTERN APPLIED - FIXED DATA FLOW
// ============================================================================
// This component manages the financial dashboard with sales, receivables, payables,
// and expiring inventory tracking with comprehensive filtering and tabbed interface.

// Main render function for financials dashboard - FIXED STATE EXTRACTION
window.renderFinancials = () => {
    console.log('🔍 FINANCIALS COMPONENT DEBUG: Starting render');
    
    // 1. Extract state with fallbacks - PROVEN PATTERN
    const {
        financialData = window.appState?.financialData || {
            activeSales: [],
            sales: [],
            receivables: [],
            payables: [],
            expiringInventory: []
        },
        financialFilters = window.appState?.financialFilters || {
            clientName: '',
            assignedPerson: '',
            dateFrom: '',
            dateTo: '',
            status: 'all'
        },
        activeFinancialTab = window.appState?.activeFinancialTab || 'activesales',
        financialStats = window.appState?.financialStats || {
            expiringValue: 0
        },
        setFinancialFilters = window.setFinancialFilters || (() => {
            console.warn("setFinancialFilters not implemented");
        }),
        setActiveFinancialTab = window.setActiveFinancialTab || (() => {
            console.warn("setActiveFinancialTab not implemented");
        })
    } = window.appState || {};

    // 2. Enhanced debugging logs - CRITICAL FOR DEBUGGING
    console.log('🔍 FINANCIALS COMPONENT DEBUG:');
    console.log('🔍 financialData:', financialData);
    console.log('🔍 activeSales count:', financialData?.activeSales?.length || 0);
    console.log('🔍 sales count:', financialData?.sales?.length || 0);
    console.log('🔍 receivables count:', financialData?.receivables?.length || 0);
    console.log('🔍 payables count:', financialData?.payables?.length || 0);
    console.log('🔍 activeFinancialTab:', activeFinancialTab);
    console.log('🔍 financialFilters:', financialFilters);

    // Filter data based on filters - ENHANCED PATTERN
    const applyFilters = (data) => {
        if (!data || !Array.isArray(data)) {
            console.log('🔍 No data to filter or data is not array:', data);
            return [];
        }
        
        return data.filter(item => {
            if (financialFilters.clientName && !item.clientName?.toLowerCase().includes(financialFilters.clientName.toLowerCase())) return false;
            if (financialFilters.assignedPerson && !item.assignedTo?.toLowerCase().includes(financialFilters.assignedPerson.toLowerCase())) return false;
            if (financialFilters.dateFrom && new Date(item.date) < new Date(financialFilters.dateFrom)) return false;
            if (financialFilters.dateTo && new Date(item.date) > new Date(financialFilters.dateTo)) return false;
            if (financialFilters.status !== 'all' && item.status !== financialFilters.status) return false;
            return true;
        });
    };

    return React.createElement('div', { className: 'space-y-6' },
        // Header with stats cards
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-4 mb-6' },
            // Total Sales Card
            React.createElement('div', { className: 'bg-green-50 dark:bg-green-900 p-4 rounded-lg' },
                React.createElement('h3', { className: 'text-sm font-medium text-green-800 dark:text-green-200' }, 'Total Sales'),
                React.createElement('p', { className: 'text-2xl font-bold text-green-600' }, 
                    '₹' + ((financialData.sales || []).reduce((sum, sale) => 
                        sum + parseFloat(sale.amount || sale.total_amount || sale.final_amount || 0), 0
                    )).toLocaleString()
                )
            ),
            // Total Active Sales Card
            React.createElement('div', { className: 'bg-purple-50 dark:bg-purple-900 p-4 rounded-lg' },
                React.createElement('h3', { className: 'text-sm font-medium text-purple-800 dark:text-purple-200' }, 'Total Active Sales'),
                React.createElement('p', { className: 'text-2xl font-bold text-purple-600' }, 
                    '₹' + ((financialData.activeSales || []).reduce((sum, sale) => 
                        sum + parseFloat(sale.amount || 0), 0
                    )).toLocaleString()
                )
            ),
            // Total Receivables Card
            React.createElement('div', { className: 'bg-blue-50 dark:bg-blue-900 p-4 rounded-lg' },
                React.createElement('h3', { className: 'text-sm font-medium text-blue-800 dark:text-blue-200' }, 'Total Receivables'),
                React.createElement('p', { className: 'text-2xl font-bold text-blue-600' }, 
                    '₹' + ((financialData.receivables || []).reduce((sum, rec) => 
                        sum + parseFloat(rec.balance_amount || rec.expected_amount || rec.amount || 0), 0
                    )).toLocaleString()
                )
            ),
            // Total Payables Card
            React.createElement('div', { className: 'bg-red-50 dark:bg-red-900 p-4 rounded-lg' },
                React.createElement('h3', { className: 'text-sm font-medium text-red-800 dark:text-red-200' }, 'Total Payables'),
                React.createElement('p', { className: 'text-2xl font-bold text-red-600' }, 
                    '₹' + ((financialData.payables || []).reduce((sum, pay) => 
                        sum + parseFloat(pay.amount || 0), 0
                    )).toLocaleString()
                )
            )
        ),

        // Expiring Inventory Card (conditional)
        financialStats.expiringValue > 0 && React.createElement('div', { className: 'grid grid-cols-1 gap-4 mb-6' },
            React.createElement('div', { className: 'bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg' },
                React.createElement('h3', { className: 'text-sm font-medium text-yellow-800 dark:text-yellow-200' }, 'Expiring Inventory Value'),
                React.createElement('p', { className: 'text-2xl font-bold text-yellow-900 dark:text-yellow-100' }, 
                    '₹' + financialStats.expiringValue.toLocaleString()
                )
            )
        ),

        // Filters
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-4 rounded-lg shadow' },
            React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 'Filters'),
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-5 gap-4' },
                React.createElement('input', {
                    type: 'text',
                    placeholder: 'Client Name',
                    value: financialFilters.clientName,
                    onChange: (e) => {
                        console.log('🔍 Client name filter changed:', e.target.value);
                        setFinancialFilters(prev => ({ ...prev, clientName: e.target.value }));
                    },
                    className: 'px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600'
                }),
                React.createElement('input', {
                    type: 'text',
                    placeholder: 'Assigned Person',
                    value: financialFilters.assignedPerson,
                    onChange: (e) => {
                        console.log('🔍 Assigned person filter changed:', e.target.value);
                        setFinancialFilters(prev => ({ ...prev, assignedPerson: e.target.value }));
                    },
                    className: 'px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600'
                }),
                React.createElement('input', {
                    type: 'date',
                    value: financialFilters.dateFrom,
                    onChange: (e) => {
                        console.log('🔍 Date from filter changed:', e.target.value);
                        setFinancialFilters(prev => ({ ...prev, dateFrom: e.target.value }));
                    },
                    className: 'px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600'
                }),
                React.createElement('input', {
                    type: 'date',
                    value: financialFilters.dateTo,
                    onChange: (e) => {
                        console.log('🔍 Date to filter changed:', e.target.value);
                        setFinancialFilters(prev => ({ ...prev, dateTo: e.target.value }));
                    },
                    className: 'px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600'
                }),
                React.createElement('button', {
                    onClick: () => {
                        console.log('🔍 Clearing filters');
                        setFinancialFilters({
                            clientName: '',
                            assignedPerson: '',
                            dateFrom: '',
                            dateTo: '',
                            status: 'all'
                        });
                    },
                    className: 'bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600'
                }, 'Clear Filters')
            )
        ),

        // Tabs
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow' },
            React.createElement('div', { className: 'border-b dark:border-gray-700' },
                React.createElement('div', { className: 'flex space-x-1' },
                    ['activesales', 'sales', 'receivables', 'payables', 'expiring'].map(tab =>
                        React.createElement('button', {
                            key: tab,
                            onClick: () => {
                                console.log('🔍 Tab clicked:', tab);
                                setActiveFinancialTab(tab);
                            },
                            className: `px-4 py-2 font-medium ${
                                activeFinancialTab === tab
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`
                        }, tab.charAt(0).toUpperCase() + tab.slice(1))
                    )
                )
            ),

            // Tab Content - FIXED DATA PASSING
            React.createElement('div', { className: 'p-6' },
                activeFinancialTab === 'activesales' && (() => {
                    console.log('🔍 Calling renderActiveSalesTab with data:', applyFilters(financialData.activeSales || []));
                    return window.renderActiveSalesTab(applyFilters(financialData.activeSales || []));
                })(),
                activeFinancialTab === 'sales' && (() => {
                    console.log('🔍 Calling renderSalesTab with data:', applyFilters(financialData.sales || []));
                    return window.renderSalesTab(applyFilters(financialData.sales || []));
                })(),
                activeFinancialTab === 'receivables' && (() => {
                    console.log('🔍 Calling renderReceivablesTab with data:', applyFilters(financialData.receivables || []));
                    return window.renderReceivablesTab(applyFilters(financialData.receivables || []));
                })(),
                activeFinancialTab === 'payables' && (() => {
                    console.log('🔍 Calling renderPayablesTab with data:', applyFilters(financialData.payables || []));
                    return window.renderPayablesTab(applyFilters(financialData.payables || []));
                })(),
                activeFinancialTab === 'expiring' && (() => {
                    console.log('🔍 Calling renderExpiringTab with data:', financialData.expiringInventory || []);
                    return window.renderExpiringTab(financialData.expiringInventory || []);
                })()
            )
        )
    );
};

// Active Sales Tab Renderer - ENHANCED DEBUG LOGGING
window.renderActiveSalesTab = (activeSales) => {
    console.log('🔍 renderActiveSalesTab called with:', activeSales);
    console.log('🔍 activeSales.length:', activeSales?.length || 0);
    
    return React.createElement('div', { className: 'space-y-4' },
        React.createElement('h4', { className: 'text-lg font-semibold mb-4' }, 'Active Sales (Post-Service Payment Orders)'),

        React.createElement('div', { className: 'overflow-x-auto' },
            React.createElement('table', { className: 'w-full' },
                React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-700' },
                    React.createElement('tr', null,
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Date'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Invoice #'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Client'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Sales Person'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Amount')
                    )
                ),
                React.createElement('tbody', { className: 'divide-y divide-gray-200 dark:divide-gray-700' },
                    activeSales && activeSales.length > 0 ?
                        activeSales.map(sale => {
                            console.log('🔍 Rendering active sale:', sale);
                            return React.createElement('tr', { key: sale.id },
                                React.createElement('td', { className: 'px-4 py-2' }, 
                                    new Date(sale.date).toLocaleDateString()
                                ),
                                React.createElement('td', { className: 'px-4 py-2' }, sale.invoice_number),
                                React.createElement('td', { className: 'px-4 py-2' }, sale.clientName),
                                React.createElement('td', { className: 'px-4 py-2' }, sale.assignedTo),
                                React.createElement('td', { className: 'px-4 py-2' }, 
                                    '₹' + sale.amount.toLocaleString()
                                )
                            );
                        })
                        : React.createElement('tr', null,
                            React.createElement('td', { 
                                colSpan: 5, 
                                className: 'px-4 py-8 text-center text-gray-500' 
                            }, 'No active sales')
                        )
                )
            )
        )
    );
};

// Sales Tab Renderer
window.renderSalesTab = (sales) => {
    console.log('🔍 renderSalesTab called with:', sales);
    
    return React.createElement('div', { className: 'space-y-4' },
        // Sales Chart
        React.createElement('div', { className: 'h-64 bg-gray-50 dark:bg-gray-700 rounded-lg p-4' },
            React.createElement('h4', { className: 'text-lg font-semibold mb-4' }, 'Sales Trend'),
            React.createElement('div', { className: 'text-center text-gray-500 mt-20' }, 
                'Sales chart visualization would go here'
            )
        ),

        // Sales Table
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
                        sales.map(sale =>
                            React.createElement('tr', { key: sale.id },
                                React.createElement('td', { className: 'px-4 py-3 text-sm' }, 
                                    new Date(sale.date).toLocaleDateString()
                                ),
                                React.createElement('td', { className: 'px-4 py-3 text-sm' }, sale.invoiceNumber),
                                React.createElement('td', { className: 'px-4 py-3 text-sm' }, sale.clientName),
                                React.createElement('td', { className: 'px-4 py-3 text-sm' }, sale.assignedTo),
                                React.createElement('td', { className: 'px-4 py-3 text-sm font-medium' }, 
                                    '₹' + ((sale.amount || 0).toLocaleString())
                                ),
                                React.createElement('td', { className: 'px-4 py-3' },
                                    React.createElement('span', {
                                        className: `px-2 py-1 text-xs rounded ${
                                            sale.status === 'paid' ? 'bg-green-100 text-green-800' :
                                            sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`
                                    }, sale.status)
                                )
                            )
                        ) : React.createElement('tr', null,
                            React.createElement('td', { 
                                colSpan: 6, 
                                className: 'px-4 py-8 text-center text-gray-500' 
                            }, 'No sales data found')
                        )
                )
            )
        )
    );
};

// Receivables Tab Renderer
window.renderReceivablesTab = (receivables) => {
    console.log('🔍 renderReceivablesTab called with:', receivables);
    
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
                        receivables.map(rec => {
                            const dueDate = new Date(rec.due_date);
                            const today = new Date();
                            const daysDiff = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
                            const isOverdue = daysDiff > 0;

                            return React.createElement('tr', { key: rec.id },
                                React.createElement('td', { className: 'px-4 py-3 text-sm' }, 
                                    dueDate.toLocaleDateString()
                                ),
                                React.createElement('td', { className: 'px-4 py-3 text-sm' }, rec.invoice_number),
                                React.createElement('td', { className: 'px-4 py-3 text-sm' }, rec.client_name),
                                React.createElement('td', { className: 'px-4 py-3 text-sm font-medium' }, 
                                    '₹' + parseFloat(rec.balance_amount || rec.amount || 0).toLocaleString()
                                ),
                                React.createElement('td', { className: `px-4 py-3 text-sm ${isOverdue ? 'text-red-600' : 'text-green-600'}` }, 
                                    isOverdue ? `${Math.abs(daysDiff)} days overdue` : daysDiff === 0 ? 'Due today' : `Not due`
                                ),
                                React.createElement('td', { className: 'px-4 py-3' },
                                    React.createElement('div', { className: 'flex space-x-2' },
                                        React.createElement('button', {
                                            className: 'text-blue-600 hover:text-blue-800 font-medium',
                                            onClick: () => {
                                                console.log('🔍 Mark Payment clicked for receivable:', rec);
                                                if (window.handleMarkPaymentFromReceivable) {
                                                    window.handleMarkPaymentFromReceivable(rec);
                                                } else {
                                                    console.warn('handleMarkPaymentFromReceivable function not found');
                                                    alert('Payment function not available. Please refresh the page.');
                                                }
                                            },
                                            title: 'Mark Payment Received'
                                        }, 'Mark Payment'),
                                        React.createElement('button', {
                                            onClick: () => {
                                                console.log('🔍 Delete receivable clicked for:', rec.id);
                                                if (window.deleteReceivable) {
                                                    window.deleteReceivable(rec.id);
                                                } else {
                                                    console.warn('deleteReceivable function not found');
                                                    alert('Delete function not available. Please refresh the page.');
                                                }
                                            },
                                            className: 'text-red-600 hover:text-red-800 font-medium',
                                            title: 'Delete Receivable'
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
        )
    );
};

// Payables Tab Renderer - FIXED DATA ACCESS
window.renderPayablesTab = (payables) => {
    console.log('🔍 renderPayablesTab called with:', payables);
    
    return React.createElement('div', { className: 'overflow-x-auto' },
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
                    payables.map(payable =>
                        React.createElement('tr', { key: payable.id },
                            React.createElement('td', { className: 'px-4 py-3 text-sm' }, 
                                new Date(payable.dueDate || payable.due_date || payable.created_date).toLocaleDateString()
                            ),
                            React.createElement('td', { className: 'px-4 py-3 text-sm' }, 
                                payable.supplierName || payable.supplier_name || payable.supplier || 'N/A'
                            ),
                            React.createElement('td', { className: 'px-4 py-3 text-sm' }, 
                                payable.invoiceNumber || payable.supplier_invoice || payable.invoice_number || 'N/A'
                            ),
                            React.createElement('td', { className: 'px-4 py-3 text-sm font-medium' }, 
                                '₹' + parseFloat(payable.amount || 0).toLocaleString()
                            ),
                            React.createElement('td', { className: 'px-4 py-3' },
                                React.createElement('span', {
                                    className: `px-2 py-1 text-xs rounded ${
                                        (payable.payment_status || payable.status) === 'paid' ? 'bg-green-100 text-green-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`
                                }, payable.payment_status || payable.status || 'pending')
                            ),
                            React.createElement('td', { className: 'px-4 py-3' },
                                React.createElement('div', { className: 'flex space-x-2' },
                                    (payable.payment_status || payable.status) !== 'paid' &&
                                        React.createElement('button', {
                                            className: 'text-blue-600 hover:text-blue-800 font-medium',
                                            onClick: () => {
                                                console.log('🔍 Mark Paid clicked for payable:', payable);
                                                if (window.handleMarkAsPaid) {
                                                    window.handleMarkAsPaid(payable.id);
                                                } else {
                                                    console.warn('handleMarkAsPaid function not found');
                                                    alert('Mark Paid function not available. Please refresh the page.');
                                                }
                                            },
                                            title: 'Mark as Paid'
                                        }, 'Mark Paid'),
                                    React.createElement('button', {
                                        onClick: () => {
                                            console.log('🔍 Delete payable clicked for:', payable.id);
                                            if (window.deletePayable) {
                                                window.deletePayable(payable.id);
                                            } else {
                                                console.warn('deletePayable function not found');
                                                alert('Delete function not available. Please refresh the page.');
                                            }
                                        },
                                        className: 'text-red-600 hover:text-red-800 font-medium',
                                        title: 'Delete Payable'
                                    }, '🗑️ Delete')
                                )
                            )
                        )
                    ) : React.createElement('tr', null,
                        React.createElement('td', { 
                            colSpan: 6, 
                            className: 'px-4 py-8 text-center text-gray-500' 
                        }, 'No payables found')
                    )
            )
        )
    );
};

// Expiring Inventory Tab Renderer
window.renderExpiringTab = (expiringInventory) => {
    console.log('🔍 renderExpiringTab called with:', expiringInventory);
    
    return React.createElement('div', { className: 'space-y-4' },
        React.createElement('h4', { className: 'text-lg font-semibold mb-4' }, 'Expiring Inventory (Next 7 Days)'),

        React.createElement('div', { className: 'overflow-x-auto' },
            React.createElement('table', { className: 'w-full' },
                React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-700' },
                    React.createElement('tr', null,
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Item'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Event Date'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Days Left'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Cost Price'),
                        React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Potential Loss')
                    )
                ),
                React.createElement('tbody', { className: 'divide-y divide-gray-200 dark:divide-gray-700' },
                    expiringInventory && expiringInventory.length > 0 ?
                        expiringInventory.map(item => {
                            const daysLeft = Math.ceil((new Date(item.event_date) - new Date()) / (1000 * 60 * 60 * 24));
                            return React.createElement('tr', { key: item.id },
                                React.createElement('td', { className: 'px-4 py-3 text-sm' }, 
                                    item.item_name || item.name || 'N/A'
                                ),
                                React.createElement('td', { className: 'px-4 py-3 text-sm' }, 
                                    new Date(item.event_date).toLocaleDateString()
                                ),
                                React.createElement('td', { 
                                    className: `px-4 py-3 text-sm font-medium ${
                                        daysLeft <= 2 ? 'text-red-600' : 
                                        daysLeft <= 5 ? 'text-yellow-600' : 'text-green-600'
                                    }`
                                }, daysLeft + ' days'),
                                React.createElement('td', { className: 'px-4 py-3 text-sm' }, 
                                    '₹' + parseFloat(item.cost_price || 0).toLocaleString()
                                ),
                                React.createElement('td', { className: 'px-4 py-3 text-sm text-red-600 font-medium' }, 
                                    '₹' + parseFloat(item.cost_price || 0).toLocaleString()
                                )
                            );
                        }) : React.createElement('tr', null,
                            React.createElement('td', { 
                                colSpan: 5, 
                                className: 'px-4 py-8 text-center text-gray-500' 
                            }, 'No expiring inventory')
                        )
                )
            )
        )
    );
};

// Keep existing fetch function unchanged
window.fetchFinancialData = async () => {
    try {
        console.log('Fetching financial data...');
        const [ordersRes, invoicesRes, payablesRes, inventoryRes, receivablesRes] = await Promise.all([
            window.apiCall('/orders'),
            window.apiCall('/invoices'),
            window.apiCall('/payables'),
            window.apiCall('/inventory'),
            window.apiCall('/receivables').catch(() => ({ data: [] }))
        ]);

        const ordersData = ordersRes.data || [];
        const invoicesData = invoicesRes.data || [];
        const payablesData = payablesRes.data || [];
        const inventoryData = inventoryRes.data || [];
        const receivablesData = receivablesRes.data || [];

        console.log('Raw receivables data:', receivablesData);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Process active sales (orders in progress with event date in future)
        const activeSalesData = ordersData
            .filter(order => {
                // Include orders that are approved OR in service/delivery process
                const validStatuses = ['approved', 'service_assigned', 'in_progress', 'delivery_scheduled', 'pending_delivery'];

                if (!validStatuses.includes(order.status)) {
                    console.log(`Skipping order ${order.id} with status: ${order.status}`);
                    return false;
                }

                // Only include if event date is in future
                if (!order.event_date) {
                    console.log(`Skipping order ${order.id} - no event date`);
                    return false;
                }

                const eventDate = new Date(order.event_date);
                eventDate.setHours(0, 0, 0, 0);
                const isEventInFuture = eventDate >= today;

                console.log(`Order ${order.id}: status=${order.status}, eventDate=${order.event_date}, inFuture=${isEventInFuture}`);
                return isEventInFuture;
            })
            .map(order => ({
                id: order.id,
                date: order.created_at || order.created_date || new Date().toISOString(),
                invoice_number: order.invoice_number || 'INV-' + order.id,
                clientName: order.lead_name || order.client_name || 'N/A',
                assignedTo: order.assigned_to || order.sales_person || order.created_by || 'Unassigned',
                amount: parseFloat(order.final_amount || order.total_amount || 0),
                status: 'active',
                event_date: order.event_date,
                payment_status: order.payment_status || 'pending',
                order_type: order.order_type,
                order_status: order.status // Keep original status for reference
            }));

        // Process completed sales (orders where events have happened)
        const salesData = ordersData
            .filter(order => {
                return ['completed', 'delivered'].includes(order.status) ||
                       (order.event_date && new Date(order.event_date) < today);
            })
            .map(order => ({
                id: order.id,
                date: order.created_at || order.created_date || new Date().toISOString(),
                invoiceNumber: order.invoice_number || 'INV-' + order.id,
                clientName: order.lead_name || order.client_name || 'N/A',
                assignedTo: order.assigned_to || order.sales_person || order.created_by || 'Unassigned',
                amount: parseFloat(order.final_amount || order.total_amount || 0),
                status: order.payment_status === 'paid' ? 'paid' : 'completed',
                event_date: order.event_date,
                payment_status: order.payment_status || 'pending'
            }));

        // Process receivables - ensure all fields are properly mapped
        const processedReceivables = receivablesData.map(r => {
            console.log('Processing receivable:', r);
            return {
                ...r,
                // Ensure all required fields are present
                amount: parseFloat(r.expected_amount || r.amount || 0),
                balance_amount: parseFloat(r.balance_amount || r.expected_amount || r.amount || 0),
                invoice_number: r.invoice_number || r.invoice_id || 'N/A',
                due_date: r.due_date || r.expected_payment_date || new Date().toISOString(),
                client_name: r.client_name || 'N/A',
                assigned_to: r.assigned_to || 'Unassigned',
                status: r.status || 'pending'
            };
        });

        console.log('Processed receivables:', processedReceivables);

        // Filter only unpaid receivables
        const unpaidReceivables = processedReceivables.filter(r => r.status !== 'paid');

        console.log('Unpaid receivables to display:', unpaidReceivables);

        // Calculate totals
        const totalActiveSales = activeSalesData.reduce((sum, sale) => sum + sale.amount, 0);
        const totalSales = salesData.reduce((sum, sale) => sum + sale.amount, 0);
        const totalReceivables = unpaidReceivables.reduce((sum, rec) => 
            sum + (rec.balance_amount || rec.amount || 0), 0
        );
        const totalPayables = payablesData.reduce((sum, pay) => 
            sum + parseFloat(pay.amount || 0), 0
        );

        // Log the results
        console.log('=== FINANCIAL DATA SUMMARY ===');
        console.log(`Active Sales: ${activeSalesData.length} orders, Total: ₹${totalActiveSales.toLocaleString()}`);
        console.log(`Completed Sales: ${salesData.length} orders, Total: ₹${totalSales.toLocaleString()}`);
        console.log(`Receivables: ${unpaidReceivables.length} entries, Total: ₹${totalReceivables.toLocaleString()}`);
        console.log(`Payables: ${payablesData.length} entries, Total: ₹${totalPayables.toLocaleString()}`);

        // Update state - FIXED TO USE ENHANCED SETTERS
        if (window.setFinancialData) {
            window.setFinancialData({
                activeSales: activeSalesData,
                sales: salesData,
                receivables: unpaidReceivables,
                payables: payablesData,
                expiringInventory: inventoryData.filter(item => {
                    if (!item.event_date || item.allocated) return false;
                    const days = Math.ceil((new Date(item.event_date) - new Date()) / (1000 * 60 * 60 * 24));
                    return days <= 7 && days >= 0;
                })
            });
        }

        console.log('Financial data set:', {
            activeSales: activeSalesData.length,
            sales: salesData.length,
            receivables: unpaidReceivables.length,
            payables: payablesData.length
        });

    } catch (error) {
        console.error('Error fetching financial data:', error);
        alert('Failed to load financial data. Please refresh the page.');
    }
};

console.log('✅ FIXED Financial component loaded successfully - Integration pattern applied');
