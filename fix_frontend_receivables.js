const fs = require('fs');
const content = fs.readFileSync('frontend/public/index.html', 'utf8');

// Fix the fetchFinancialData to properly handle receivables
const newContent = content.replace(
    /const fetchFinancialData = async \(\) => \{([\s\S]*?)^\s{4}\};/m,
    `const fetchFinancialData = async () => {
        try {
            const [ordersRes, invoicesRes, payablesRes, inventoryRes, receivablesRes] = await Promise.all([
                apiCall('/orders'),
                apiCall('/invoices'),
                apiCall('/payables'),
                apiCall('/inventory'),
                apiCall('/receivables')
            ]);

            const ordersData = ordersRes.data || [];
            const invoicesData = invoicesRes.data || [];
            const payablesData = payablesRes.data || [];
            const inventoryData = inventoryRes.data || [];
            const receivablesData = receivablesRes.data || [];

            // Calculate sales (completed orders)
            const salesData = ordersData
                .filter(order => order.status === 'completed')
                .map(order => ({
                    ...order,
                    amount: parseFloat(order.final_amount || order.total_amount || 0),
                    clientName: order.lead_name || order.client_name || 'N/A',
                    assignedTo: order.assigned_to || order.sales_person || 'Unassigned',
                    date: order.created_at || new Date().toISOString(),
                    invoice_number: order.invoice_number || \`INV-\${order.id}\`,
                    status: order.payment_status || 'paid'
                }));

            // Combine receivables from both sources
            const allReceivables = [
                ...receivablesData,
                ...ordersData
                    .filter(order => order.payment_status === 'pending' && order.status !== 'rejected')
                    .map(order => ({
                        id: order.id,
                        order_id: order.id,
                        client_name: order.lead_name || order.client_name || 'N/A',
                        invoice_number: order.invoice_number || \`INV-\${order.id}\`,
                        amount: parseFloat(order.total_amount || 0),
                        balance_amount: parseFloat(order.balance_amount || order.total_amount || 0) - parseFloat(order.advance_amount || 0),
                        assigned_to: order.assigned_to || order.sales_person || 'Unassigned',
                        due_date: order.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        status: 'pending',
                        created_at: order.created_at
                    }))
            ];

            // Remove duplicates based on order_id
            const uniqueReceivables = allReceivables.reduce((acc, curr) => {
                if (!acc.find(r => r.order_id === curr.order_id)) {
                    acc.push(curr);
                }
                return acc;
            }, []);

            // Set financial data
            setFinancialData({
                sales: salesData,
                receivables: uniqueReceivables,
                payables: payablesData,
                expiringInventory: inventoryData.filter(item => {
                    if (!item.event_date) return false;
                    const daysUntilEvent = Math.ceil((new Date(item.event_date) - new Date()) / (1000 * 60 * 60 * 24));
                    return daysUntilEvent <= 30 && daysUntilEvent >= 0;
                })
            });

            // Calculate and update totals
            const totalSales = salesData.reduce((sum, sale) => sum + (parseFloat(sale.amount) || 0), 0);
            const totalReceivables = uniqueReceivables.reduce((sum, rec) => sum + (parseFloat(rec.balance_amount || rec.amount) || 0), 0);
            const totalPayables = payablesData.reduce((sum, pay) => sum + (parseFloat(pay.amount) || 0), 0);

            console.log('Financial data loaded:', {
                sales: salesData.length,
                totalSales,
                receivables: uniqueReceivables.length,
                totalReceivables,
                payables: payablesData.length,
                totalPayables
            });
        } catch (error) {
            console.error('Error fetching financial data:', error);
        }
    };`
);

// Also fix the NaN display in Total Sales
const fixedContent = newContent.replace(
    /₹'\s*\+\s*totalSales\.toLocaleString\(\)/g,
    `₹' + (isNaN(totalSales) ? '0' : totalSales.toLocaleString())`
).replace(
    /₹'\s*\+\s*financialData\.expiringInventory[\s\S]*?\.toLocaleString\(\)/g,
    `₹' + (financialData.expiringInventory.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0), 0)).toLocaleString()`
);

fs.writeFileSync('frontend/public/index.html', fixedContent);
console.log('✅ Fixed frontend receivables calculation and NaN display');
