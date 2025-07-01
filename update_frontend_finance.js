const fs = require('fs');
let content = fs.readFileSync('frontend/public/index.html', 'utf8');

console.log('Implementing finance flow updates...');

// 1. Add Active Sales tab
if (!content.includes("'activesales'")) {
    // Find the financial tabs array
    content = content.replace(
        /\['sales', 'receivables', 'payables', 'expiring'\]/g,
        "['activesales', 'sales', 'receivables', 'payables', 'expiring']"
    );
    console.log('✅ Added Active Sales tab');
}

// 2. Update fetchFinancialData to include active sales
const fetchFinancialDataPattern = /const fetchFinancialData = async \(\) => \{[\s\S]*?\n    \};/;

if (fetchFinancialDataPattern.test(content)) {
    content = content.replace(fetchFinancialDataPattern, `const fetchFinancialData = async () => {
        try {
            console.log('Fetching financial data...');
            const [ordersRes, invoicesRes, payablesRes, inventoryRes, receivablesRes] = await Promise.all([
                apiCall('/orders'),
                apiCall('/invoices'),
                apiCall('/payables'),
                apiCall('/inventory'),
                apiCall('/receivables').catch(() => ({ data: [] }))
            ]);

            const ordersData = ordersRes.data || [];
            const invoicesData = invoicesRes.data || [];
            const payablesData = payablesRes.data || [];
            const inventoryData = inventoryRes.data || [];
            const receivablesData = (receivablesRes.data || []).map(r => ({
                ...r,
                amount: parseFloat(r.amount || r.expected_amount || 0),
                balance_amount: parseFloat(r.balance_amount || r.expected_amount || r.amount || 0),
                invoice_number: r.invoice_number || r.invoice_id || 'N/A',
                due_date: r.due_date || r.expected_payment_date || new Date().toISOString(),
                is_overdue: new Date(r.due_date || r.expected_payment_date) < new Date()
            }));

            // Process active sales (approved post-service payment orders)
            const activeSalesData = ordersData
                .filter(order => 
                    order.status === 'approved' && 
                    order.lead_status === 'payment_post_service' &&
                    order.payment_status !== 'paid'
                )
                .map(order => ({
                    id: order.id,
                    date: order.created_at || new Date().toISOString(),
                    invoice_number: order.invoice_number || \`INV-\${order.id}\`,
                    clientName: order.lead_name || order.client_name || 'N/A',
                    assignedTo: order.assigned_to || order.sales_person || 'Unassigned',
                    amount: parseFloat(order.total_amount || 0),
                    status: 'active'
                }));

            // Process completed sales (paid orders)
            const salesData = ordersData
                .filter(order => order.status === 'completed' || order.payment_status === 'paid')
                .map(order => ({
                    id: order.id,
                    date: order.created_at || new Date().toISOString(),
                    invoice_number: order.invoice_number || \`INV-\${order.id}\`,
                    clientName: order.lead_name || order.client_name || 'N/A',
                    assignedTo: order.assigned_to || order.sales_person || 'Unassigned',
                    amount: parseFloat(order.final_amount || order.total_amount || 0),
                    status: order.payment_status || 'paid'
                }));

            // Process receivables (only unpaid)
            const unpaidReceivables = receivablesData.filter(r => r.status !== 'paid');
            
            // Process expiring inventory (default 7 days, adjustable)
            const daysFilter = parseInt(financialFilters?.expiringDays || 7);
            const expiringInventory = inventoryData.filter(item => {
                if (!item.event_date || item.allocated) return false;
                const days = Math.ceil((new Date(item.event_date) - new Date()) / (1000 * 60 * 60 * 24));
                return days <= daysFilter && days >= 0;
            });

            // Calculate totals
            const totalActiveSales = activeSalesData.reduce((sum, sale) => sum + sale.amount, 0);
            const totalSales = salesData.reduce((sum, sale) => sum + sale.amount, 0);
            const totalReceivables = unpaidReceivables.reduce((sum, rec) => 
                sum + (rec.balance_amount || rec.amount || 0), 0
            );
            const totalPayables = payablesData.reduce((sum, pay) => sum + pay.amount, 0);
            const expiringValue = expiringInventory.reduce((sum, item) => 
                sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 0)), 0
            );

            console.log('Financial data processed:', {
                activeSales: activeSalesData.length,
                sales: salesData.length,
                receivables: unpaidReceivables.length,
                payables: payablesData.length,
                expiring: expiringInventory.length,
                totals: { totalActiveSales, totalSales, totalReceivables, totalPayables, expiringValue }
            });

            // Update state
            setFinancialData({
                activeSales: activeSalesData,
                sales: salesData,
                receivables: unpaidReceivables,
                payables: payablesData,
                expiringInventory: expiringInventory
            });
        } catch (error) {
            console.error('Error fetching financial data:', error);
            alert('Failed to load financial data. Please refresh the page.');
        }
    };`);
    console.log('✅ Updated fetchFinancialData with complete flow');
}

// 3. Add Active Sales tab renderer
const renderActiveSalesTab = `
    const renderActiveSalesTab = (activeSales) => {
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
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Amount'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
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
                                    ),
                                    React.createElement('td', { className: 'px-4 py-2' },
                                        React.createElement('button', {
                                            className: 'text-blue-600 hover:text-blue-800',
                                            onClick: () => console.log('Record payment for:', sale.id)
                                        }, 'Record Payment')
                                    )
                                )
                            )
                        : React.createElement('tr', null,
                            React.createElement('td', { 
                                colSpan: 6, 
                                className: 'px-4 py-8 text-center text-gray-500' 
                            }, 'No active sales')
                        )
                    )
                )
            )
        );
    };
`;

// Insert the renderActiveSalesTab function
const renderSalesTabPattern = /const renderSalesTab = \(sales\) => \{/;
if (renderSalesTabPattern.test(content) && !content.includes('renderActiveSalesTab')) {
    content = content.replace(renderSalesTabPattern, renderActiveSalesTab + '\n\n    const renderSalesTab = (sales) => {');
    console.log('✅ Added renderActiveSalesTab function');
}

// 4. Update renderFinancials to include Active Sales tab
content = content.replace(
    /activeFinancialTab === 'sales' && renderSalesTab/g,
    "activeFinancialTab === 'activesales' && renderActiveSalesTab(applyFilters(financialData.activeSales || [])),\n                    activeFinancialTab === 'sales' && renderSalesTab"
);

// 5. Update receivables rendering to show status colors
const renderReceivablesUpdate = `
                                React.createElement('tr', { 
                                    key: receivable.id,
                                    className: receivable.status === 'paid' ? 'bg-green-50' : 
                                              receivable.is_overdue ? 'bg-red-50' : ''
                                },`;

content = content.replace(
    /React\.createElement\('tr', { key: receivable\.id },/g,
    renderReceivablesUpdate
);

// 6. Add expiring days filter to the filters section
if (!content.includes('expiringDays')) {
    content = content.replace(
        /status: 'all'\s*}\);/,
        `status: 'all',
        expiringDays: 7
    });`);
    
    // Add the filter input
    const filterAddition = `,
                    React.createElement('input', {
                        type: 'number',
                        value: financialFilters.expiringDays || 7,
                        onChange: (e) => setFinancialFilters(prev => ({ ...prev, expiringDays: e.target.value })),
                        className: 'px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 w-32',
                        placeholder: 'Days',
                        min: 1,
                        max: 90
                    })`;
    
    content = content.replace(
        /'Clear Filters'\s*\)/,
        "'Clear Filters')," + filterAddition
    );
    console.log('✅ Added expiring days filter');
}

// 7. Update Total Active Sales in stats
content = content.replace(
    /React\.createElement\('h3', { className: 'text-sm font-medium text-green-800 dark:text-green-200' }, 'Total Sales'\)/,
    `React.createElement('h3', { className: 'text-sm font-medium text-green-800 dark:text-green-200' }, 'Total Sales')`
);

// Add Active Sales stat card if not exists
if (!content.includes('Total Active Sales')) {
    const activeSalesCard = `,
                // Total Active Sales Card
                React.createElement('div', { className: 'bg-purple-50 dark:bg-purple-900 p-4 rounded-lg' },
                    React.createElement('h3', { className: 'text-sm font-medium text-purple-800 dark:text-purple-200' }, 'Total Active Sales'),
                    React.createElement('p', { className: 'text-2xl font-bold text-purple-600' }, 
                        '₹' + ((financialData.activeSales || []).reduce((sum, sale) => 
                            sum + parseFloat(sale.amount || 0), 0
                        )).toLocaleString()
                    )
                )`;
    
    // Find the stats grid and update to 5 columns
    content = content.replace(
        /'grid grid-cols-1 md:grid-cols-4 gap-4'/g,
        "'grid grid-cols-1 md:grid-cols-5 gap-4'"
    );
    
    // Insert active sales card after total sales
    content = content.replace(
        /\),\s*\/\/ Total Receivables Card/,
        '),' + activeSalesCard + ',\n                // Total Receivables Card'
    );
    console.log('✅ Added Total Active Sales stat card');
}

fs.writeFileSync('frontend/public/index.html', content);
console.log('✅ All finance flow updates applied!');
