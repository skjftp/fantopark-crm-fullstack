const fs = require('fs');
const path = require('path');

const ordersPath = path.join(__dirname, 'backend/src/routes/orders.js');
if (!fs.existsSync(ordersPath)) {
    console.log('❌ Orders route not found at:', ordersPath);
    process.exit(1);
}

let content = fs.readFileSync(ordersPath, 'utf8');

// Check if receivables creation already exists
if (!content.includes('Create receivable for payment post service')) {
    // Find the order update section
    const updatePattern = /(await db\.collection\('crm_orders'\)\.doc\(id\)\.update\(updateData\);)/;
    
    if (updatePattern.test(content)) {
        const receivableCreation = `
        
        // Create receivable for payment post service orders when approved
        if (updateData.status === 'approved') {
            const orderDoc = await db.collection('crm_orders').doc(id).get();
            const orderData = orderDoc.data();
            
            if (orderData.lead_status === 'payment_post_service') {
                const receivableData = {
                    order_id: id,
                    lead_id: orderData.lead_id,
                    client_name: orderData.lead_name || orderData.client_name,
                    invoice_number: orderData.invoice_number || \`INV-\${id}\`,
                    amount: parseFloat(orderData.total_amount || 0),
                    advance_amount: parseFloat(orderData.advance_amount || 0),
                    balance_amount: parseFloat(orderData.total_amount || 0) - parseFloat(orderData.advance_amount || 0),
                    assigned_to: orderData.assigned_to || orderData.sales_person,
                    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'pending',
                    created_at: new Date().toISOString(),
                    created_by: req.user.email
                };
                
                await db.collection('crm_receivables').add(receivableData);
                console.log('Receivable created for post-service payment order:', id);
            }
        }`;
        
        content = content.replace(updatePattern, `$1${receivableCreation}`);
        fs.writeFileSync(ordersPath, content);
        console.log('✅ Added automatic receivables creation to orders route');
    } else {
        console.log('❌ Could not find order update pattern');
    }
} else {
    console.log('✓ Receivables creation already exists');
}
