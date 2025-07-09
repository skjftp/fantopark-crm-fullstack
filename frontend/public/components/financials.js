// ============================================================================
// FINANCIALS COMPONENT - Extracted from index.html
// ============================================================================
// This component manages the financial dashboard with sales, receivables, payables,
// and expiring inventory tracking with comprehensive filtering and tabbed interface.

// Main render function for financials dashboard
window.renderFinancials = () => {
    // Filter data based on filters
    const applyFilters = (data) => {
        return data.filter(item => {
            if (window.financialFilters.clientName && !item.clientName?.toLowerCase().includes(window.financialFilters.clientName.toLowerCase())) return false;
            if (window.financialFilters.assignedPerson && !item.assignedTo?.toLowerCase().includes(window.financialFilters.assignedPerson.toLowerCase())) return false;
            if (window.financialFilters.dateFrom && new Date(item.date) < new Date(window.financialFilters.dateFrom)) return false;
            if (window.financialFilters.dateTo && new Date(item.date) > new Date(window.financialFilters.dateTo)) return false;
            if (window.financialFilters.status !== 'all' && item.status !== window.financialFilters.status) return false;
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
                    '₹' + ((window.financialData.sales || []).reduce((sum, sale) => 
                        sum + parseFloat(sale.amount || sale.total_amount || sale.final_amount || 0), 0
                    )).toLocaleString()
                )
            ),
            // Total Active Sales Card
            React.createElement('div', { className: 'bg-purple-50 dark:bg-purple-900 p-4 rounded-lg' },
                React.createElement('h3', { className: 'text-sm font-medium text-purple-800 dark:text-purple-200' }, 'Total Active Sales'),
                React.createElement('p', { className: 'text-2xl font-bold text-purple-600' }, 
                    '₹' + ((window.financialData.activeSales || []).reduce((sum, sale) => 
                        sum + parseFloat(sale.amount || 0), 0
                    )).toLocaleString()
                )
            ),
            // Total Receivables Card
            React.createElement('div', { className: 'bg-blue-50 dark:bg-blue-900 p-4 rounded-lg' },
                React.createElement('h3', { className: 'text-sm font-medium text-blue-800 dark:text-blue-200' }, 'Total Receivables'),
                React.createElement('p', { className: 'text-2xl font-bold text-blue-600' }, 
                    '₹' + ((window.financialData.receivables || []).reduce((sum, rec) => 
                        sum + parseFloat(rec.balance_amount || rec.expected_amount || rec.amount || 0), 0
                    )).toLocaleString()
                )
            ),
            // Total Payables Card
            React.createElement('div', { className: 'bg-red-50 dark:bg-red-900 p-4 rounded-lg' },
                React.createElement('h3', { className: 'text-sm font-medium text-red-800 dark:text-red-200' }, 'Total Payables'),
                React.createElement('p', { className: 'text-2xl font-bold text-red-600' }, 
                    '₹' + ((window.financialData.payables || []).reduce((sum, pay) => 
                        sum + parseFloat(pay.amount || 0), 0
                    )).toLocaleString()
                )
            ),

            // Expiring Inventory Card
            React.createElement('div', { className: 'bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg' },
                React.createElement('h3', { className: 'text-sm font-medium text-yellow-800 dark:text-yellow-200' }, 'Expiring Inventory Value'),
                React.createElement('p', { className: 'text-2xl font-bold text-yellow-900 dark:text-yellow-100' }, 
                    '₹' + (window.financialStats.expiringValue.toLocaleString())
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
                    value: window.financialFilters.clientName,
                    onChange: (e) => window.setFinancialFilters(prev => ({ ...prev, clientName: e.target.value })),
                    className: 'px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600'
                }),
                React.createElement('input', {
                    type: 'text',
                    placeholder: 'Assigned Person',
                    value: window.financialFilters.assignedPerson,
                    onChange: (e) => window.setFinancialFilters(prev => ({ ...prev, assignedPerson: e.target.value })),
                    className: 'px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600'
                }),
                React.createElement('input', {
                    type: 'date',
                    value: window.financialFilters.dateFrom,
                    onChange: (e) => window.setFinancialFilters(prev => ({ ...prev, dateFrom: e.target.value })),
                    className: 'px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600'
                }),
                React.createElement('input', {
                    type: 'date',
                    value: window.financialFilters.dateTo,
                    onChange: (e) => window.setFinancialFilters(prev => ({ ...prev, dateTo: e.target.value })),
                    className: 'px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600'
                }),
                React.createElement('button', {
                    onClick: () => window.setFinancialFilters({
                        clientName: '',
                        assignedPerson: '',
                        dateFrom: '',
                        dateTo: '',
                        status: 'all'
                    }),
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
                            onClick: () => window.setActiveFinancialTab(tab),
                            className: `px-4 py-2 font-medium ${
                                window.activeFinancialTab === tab
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`
                        }, tab.charAt(0).toUpperCase() + tab.slice(1))
                    )
                )
            ),

            // Tab Content
            React.createElement('div', { className: 'p-6' },
                window.activeFinancialTab === 'activesales' && window.renderActiveSalesTab(applyFilters(window.financialData.activeSales || [])),
                window.activeFinancialTab === 'sales' && window.renderSalesTab(applyFilters(window.financialData.sales)),
                window.activeFinancialTab === 'receivables' && window.renderReceivablesTab(applyFilters(window.financialData.receivables)),
                window.activeFinancialTab === 'payables' && window.renderPayablesTab(applyFilters(window.financialData.payables)),
                window.activeFinancialTab === 'expiring' && window.renderExpiringTab(window.financialData.expiringInventory)
            )
        )
    );
};

// Active Sales Tab Renderer
window.renderActiveSalesTab = (activeSales) => {
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
                    activeSales.length > 0 ?
                        activeSales.map(sale =>
                            React.createElement('tr', { key: sale.id },
                                React.createElement('td', { className: 'px-4 py-2' }, 
                                    new Date(sale.date).toLocaleDateString()
                                ),
                                React.createElement('td', { className: 'px-4 py-2' }, sale.invoice_number),
                                React.createElement('td', { className: 'px-4 py-2' }, sale.clientName),
                                React.createElement('td', { className: 'px-4 py-2' }, sale.assignedTo),
                                React.createElement('td', { className: 'px-4 py-2' }, 
                                    '₹' + sale.amount.toLocaleString()
                                )
                            )
                        )
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
                    sales.length > 0 ?
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
                    receivables.length > 0 ?
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
                                            onClick: () => window.handleMarkPaymentFromReceivable(rec),
                                            title: 'Mark Payment Received'
                                        }, 'Mark Payment'),
                                        React.createElement('button', {
                                            onClick: () => window.deleteReceivable(rec.id),
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

// Payables Tab Renderer
window.renderPayablesTab = (payables) => {
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
                window.financialData.payables && window.financialData.payables.length > 0 ?
                    window.financialData.payables.map(payable =>
                        React.createElement('tr', { key: payable.id },
                            React.createElement('td', { className: 'px-4 py-3 text-sm' }, 
                                new Date(payable.due_date || payable.created_date).toLocaleDateString()
                            ),
                            React.createElement('td', { className: 'px-4 py-3 text-sm' }, 
                                payable.supplier_name || payable.supplier || 'N/A'
                            ),
                            React.createElement('td', { className: 'px-4 py-3 text-sm' }, 
                                payable.supplier_invoice || payable.invoice_number || 'N/A'
                            ),
                            React.createElement('td', { className: 'px-4 py-3 text-sm font-medium' }, 
                                '₹' + parseFloat(payable.amount || 0).toLocaleString()
                            ),
                            React.createElement('td', { className: 'px-4 py-3' },
                                React.createElement('span', {
                                    className: `px-2 py-1 text-xs rounded ${
                                        payable.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`
                                }, payable.payment_status || 'pending')
                            ),
                            React.createElement('td', { className: 'px-4 py-3' },
                                React.createElement('div', { className: 'flex space-x-2' },
                                    payable.payment_status !== 'paid' &&
                                        React.createElement('button', {
                                            className: 'text-blue-600 hover:text-blue-800 font-medium',
                                            onClick: () => window.handleMarkAsPaid(payable.id),
                                            title: 'Mark as Paid'
                                        }, 'Mark Paid'),
                                    React.createElement('button', {
                                        onClick: () => window.deletePayable(payable.id),
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

// Fetch Financial Data Function
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

        // Update state
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

console.log('✅ Financial component loaded successfully');
