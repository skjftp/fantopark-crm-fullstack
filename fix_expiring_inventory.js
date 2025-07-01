const fs = require('fs');
let content = fs.readFileSync('frontend/public/index.html', 'utf8');

console.log('Fixing expiring inventory issues...');

// 1. Fix the renderExpiringTab to handle dates properly
const renderExpiringPattern = /const renderExpiringTab = \(inventory\) => \{[\s\S]*?return React\.createElement[\s\S]*?\);\s*\};/;

if (renderExpiringPattern.test(content)) {
    const newRenderExpiringTab = `const renderExpiringTab = (inventory) => {
        const daysFilter = financialFilters?.expiringDays || 7;
        
        return React.createElement('div', { className: 'space-y-4' },
            React.createElement('div', { className: 'flex items-center space-x-4 mb-4' },
                React.createElement('h4', { className: 'text-lg font-semibold' }, 
                    \`Inventory Expiring in Next \${daysFilter} Days\`
                ),
                React.createElement('div', { className: 'flex items-center space-x-2' },
                    React.createElement('label', { className: 'text-sm text-gray-600' }, 'Days:'),
                    React.createElement('input', {
                        type: 'number',
                        value: daysFilter,
                        onChange: (e) => {
                            setFinancialFilters(prev => ({ ...prev, expiringDays: parseInt(e.target.value) || 7 }));
                            fetchFinancialData(); // Refresh data with new filter
                        },
                        className: 'px-2 py-1 border rounded-md w-20',
                        min: 1,
                        max: 90
                    })
                )
            ),
            
            React.createElement('div', { className: 'overflow-x-auto' },
                React.createElement('table', { className: 'w-full' },
                    React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-700' },
                        React.createElement('tr', null,
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Product'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Batch #'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Expiry Date'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Days Until Expiry'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Quantity'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Value'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
                        )
                    ),
                    React.createElement('tbody', { className: 'divide-y divide-gray-200 dark:divide-gray-700' },
                        inventory.length > 0 ?
                            inventory.map(item => {
                                const expiryDate = item.event_date ? new Date(item.event_date) : null;
                                const daysUntilExpiry = expiryDate ? 
                                    Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24)) : 0;
                                const itemValue = (parseFloat(item.price || 0) * parseInt(item.quantity || 0));
                                
                                return React.createElement('tr', { 
                                    key: item.id,
                                    className: daysUntilExpiry <= 3 ? 'bg-red-50' : 
                                              daysUntilExpiry <= 7 ? 'bg-yellow-50' : ''
                                },
                                    React.createElement('td', { className: 'px-4 py-2' }, 
                                        item.name || item.product_name || 'N/A'
                                    ),
                                    React.createElement('td', { className: 'px-4 py-2' }, 
                                        item.batch_number || item.id || 'N/A'
                                    ),
                                    React.createElement('td', { className: 'px-4 py-2' }, 
                                        expiryDate ? expiryDate.toLocaleDateString() : 'Invalid Date'
                                    ),
                                    React.createElement('td', { className: 'px-4 py-2' }, 
                                        expiryDate ? (daysUntilExpiry + ' days') : 'N/A'
                                    ),
                                    React.createElement('td', { className: 'px-4 py-2' }, 
                                        item.quantity || 0
                                    ),
                                    React.createElement('td', { className: 'px-4 py-2' }, 
                                        '₹' + itemValue.toLocaleString()
                                    ),
                                    React.createElement('td', { className: 'px-4 py-2' },
                                        React.createElement('button', {
                                            className: 'text-blue-600 hover:text-blue-800',
                                            onClick: () => {
                                                setSelectedInventory(item);
                                                setShowAllocationForm(true);
                                            }
                                        }, 'Create Offer')
                                    )
                                );
                            })
                        : React.createElement('tr', null,
                            React.createElement('td', { 
                                colSpan: 7, 
                                className: 'px-4 py-8 text-center text-gray-500' 
                            }, \`No inventory expiring in the next \${daysFilter} days\`)
                        )
                    )
                )
            )
        );
    };`;
    
    content = content.replace(renderExpiringPattern, newRenderExpiringTab);
    console.log('✅ Fixed renderExpiringTab with proper date handling');
}

// 2. Update the expiring inventory filter in fetchFinancialData
content = content.replace(
    /const daysFilter = parseInt\(financialFilters\?\.expiringDays \|\| 7\);/g,
    'const daysFilter = parseInt(financialFilters?.expiringDays || 7);'
);

// 3. Ensure the order with pending payment shows in active sales
// Update the fetchFinancialData to properly filter active sales
const activeSalesFilterPattern = /const activeSalesData = ordersData[\s\S]*?status: 'active'[\s\S]*?\}\);/;

if (activeSalesFilterPattern.test(content)) {
    content = content.replace(activeSalesFilterPattern, 
        `const activeSalesData = ordersData
                .filter(order => 
                    (order.status === 'approved' && order.lead_status === 'payment_post_service') ||
                    (order.status === 'approved' && order.payment_status === 'pending')
                )
                .map(order => ({
                    id: order.id,
                    date: order.created_at || new Date().toISOString(),
                    invoice_number: order.invoice_number || \`INV-\${order.id}\`,
                    clientName: order.lead_name || order.client_name || 'N/A',
                    assignedTo: order.assigned_to || order.sales_person || 'Unassigned',
                    amount: parseFloat(order.total_amount || 0),
                    status: 'active'
                }));`
    );
    console.log('✅ Updated active sales filter to include approved orders with pending payment');
}

// 4. Initialize financialFilters with expiringDays if not exists
if (!content.includes("expiringDays: 7")) {
    content = content.replace(
        /const \[financialFilters, setFinancialFilters\] = useState\({/,
        `const [financialFilters, setFinancialFilters] = useState({
        clientName: '',
        assignedPerson: '',
        dateFrom: '',
        dateTo: '',
        status: 'all',
        expiringDays: 7,`
    );
    
    // Remove the duplicate if it was added elsewhere
    content = content.replace(/,\s*expiringDays: 7\s*}\);/, '});');
    console.log('✅ Added expiringDays to financialFilters initialization');
}

fs.writeFileSync('frontend/public/index.html', content);
console.log('✅ All expiring inventory fixes applied!');
