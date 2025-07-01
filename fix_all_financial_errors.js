const fs = require('fs');
let content = fs.readFileSync('frontend/public/index.html', 'utf8');

// Fix 1: Add safe number formatting helper
const safeFormatHelper = `
    // Safe number formatting helper
    const safeFormatNumber = (value) => {
        const num = parseFloat(value) || 0;
        return num.toLocaleString('en-IN');
    };
    
    const safeFormatCurrency = (value) => {
        const num = parseFloat(value) || 0;
        return '₹' + num.toLocaleString('en-IN');
    };
`;

// Insert the helper functions after formatCurrency definition
if (!content.includes('safeFormatNumber')) {
    content = content.replace(
        /const formatCurrency = \(amount\) => {[\s\S]*?};/,
        `$&\n${safeFormatHelper}`
    );
}

// Fix 2: Replace all unsafe toLocaleString calls in financial renders
// Fix sales tab
content = content.replace(
    /sale\.amount\.toLocaleString\(\)/g,
    'safeFormatNumber(sale.amount)'
);

// Fix receivables tab
content = content.replace(
    /receivable\.amount\.toLocaleString\(\)/g,
    'safeFormatNumber(receivable.amount || receivable.balance_amount || 0)'
);
content = content.replace(
    /receivable\.balance_amount\.toLocaleString\(\)/g,
    'safeFormatNumber(receivable.balance_amount || receivable.amount || 0)'
);

// Fix payables tab
content = content.replace(
    /payable\.amount\.toLocaleString\(\)/g,
    'safeFormatNumber(payable.amount)'
);

// Fix 3: Update fetchFinancialData to properly map all data
content = content.replace(
    /const fetchFinancialData = async \(\) => \{[\s\S]*?\n    \};/,
    `const fetchFinancialData = async () => {
        try {
            console.log('Fetching financial data...');
            const [ordersRes, invoicesRes, payablesRes, inventoryRes, receivablesRes] = await Promise.all([
                apiCall('/orders'),
                apiCall('/invoices'),
                apiCall('/payables'),
                apiCall('/inventory'),
                apiCall('/receivables').catch(() => ({ data: [] })) // Fallback if receivables endpoint doesn't exist
            ]);

            const ordersData = ordersRes.data || [];
            const invoicesData = invoicesRes.data || [];
            const payablesData = payablesRes.data || [];
            const inventoryData = inventoryRes.data || [];
            const receivablesData = receivablesRes.data || [];

            // Process sales data (completed orders)
            const salesData = ordersData
                .filter(order => order.status === 'completed')
                .map(order => ({
                    id: order.id,
                    date: order.created_at || new Date().toISOString(),
                    invoice_number: order.invoice_number || \`INV-\${order.id}\`,
                    clientName: order.lead_name || order.client_name || 'N/A',
                    assignedTo: order.assigned_to || order.sales_person || 'Unassigned',
                    amount: parseFloat(order.final_amount || order.total_amount || 0),
                    status: order.payment_status || 'paid'
                }));

            // Process receivables (pending payments + post-service orders)
            const orderReceivables = ordersData
                .filter(order => 
                    (order.payment_status === 'pending' || order.lead_status === 'payment_post_service') 
                    && order.status !== 'rejected'
                )
                .map(order => ({
                    id: order.id,
                    order_id: order.id,
                    due_date: order.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    invoice_number: order.invoice_number || \`INV-\${order.id}\`,
                    client_name: order.lead_name || order.client_name || 'N/A',
                    amount: parseFloat(order.total_amount || 0),
                    balance_amount: parseFloat(order.total_amount || 0) - parseFloat(order.advance_amount || 0),
                    assigned_to: order.assigned_to || order.sales_person || 'Unassigned',
                    status: 'pending',
                    created_at: order.created_at
                }));

            // Combine with receivables from API
            const allReceivables = [...receivablesData, ...orderReceivables];
            
            // Remove duplicates based on order_id
            const uniqueReceivables = allReceivables.reduce((acc, curr) => {
                const existing = acc.find(r => r.order_id === curr.order_id);
                if (!existing) {
                    acc.push(curr);
                }
                return acc;
            }, []);

            // Process payables
            const processedPayables = payablesData.map(payable => ({
                ...payable,
                amount: parseFloat(payable.amount || 0),
                vendor_name: payable.vendor_name || 'N/A',
                due_date: payable.due_date || new Date().toISOString()
            }));

            // Process expiring inventory
            const expiringInventory = inventoryData.filter(item => {
                if (!item.event_date) return false;
                const daysUntilEvent = Math.ceil((new Date(item.event_date) - new Date()) / (1000 * 60 * 60 * 24));
                return daysUntilEvent <= 30 && daysUntilEvent >= 0;
            });

            // Calculate totals
            const totalSales = salesData.reduce((sum, sale) => sum + sale.amount, 0);
            const totalReceivables = uniqueReceivables.reduce((sum, rec) => 
                sum + (rec.balance_amount || rec.amount || 0), 0
            );
            const totalPayables = processedPayables.reduce((sum, pay) => sum + pay.amount, 0);
            const expiringValue = expiringInventory.reduce((sum, item) => 
                sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 0)), 0
            );

            console.log('Financial data processed:', {
                sales: salesData.length,
                receivables: uniqueReceivables.length,
                payables: processedPayables.length,
                expiring: expiringInventory.length,
                totals: { totalSales, totalReceivables, totalPayables, expiringValue }
            });

            // Update state
            setFinancialData({
                sales: salesData,
                receivables: uniqueReceivables,
                payables: processedPayables,
                expiringInventory: expiringInventory
            });
        } catch (error) {
            console.error('Error fetching financial data:', error);
            alert('Failed to load financial data. Please refresh the page.');
        }
    };`
);

// Fix 4: Update the stats display to handle NaN
content = content.replace(
    /React\.createElement\('p'.*?'₹'\s*\+\s*totalSales\.toLocaleString\(\)/g,
    `React.createElement('p', { className: 'text-2xl font-bold text-green-600' }, safeFormatCurrency(totalSales)`
);

content = content.replace(
    /React\.createElement\('p'.*?'₹'\s*\+\s*totalReceivables\.toLocaleString\(\)/g,
    `React.createElement('p', { className: 'text-2xl font-bold text-blue-600' }, safeFormatCurrency(totalReceivables)`
);

content = content.replace(
    /React\.createElement\('p'.*?'₹'\s*\+\s*totalPayables\.toLocaleString\(\)/g,
    `React.createElement('p', { className: 'text-2xl font-bold text-red-600' }, safeFormatCurrency(totalPayables)`
);

fs.writeFileSync('frontend/public/index.html', content);
console.log('✅ Fixed all financial display errors');
