const fs = require('fs');
const path = require('path');

const ordersPath = path.join(__dirname, 'backend/src/routes/orders.js');
let content = fs.readFileSync(ordersPath, 'utf8');

// Find the order update endpoint and add receivables creation
const updatePattern = /router\.put\('\/([^']+)'.*?async.*?\(req.*?res.*?\).*?{([\s\S]*?)^}\);/gm;

// Check if receivables creation already exists
if (!content.includes('crm_receivables')) {
    // Add receivables creation after order status update
    content = content.replace(
        /(await db\.collection\('crm_orders'\)\.doc\(id\)\.update\([\s\S]*?\);)/g,
        `$1
        
        // Create receivable for payment post service orders
        if (updateData.status === 'approved' && existingOrder.lead_status === 'payment_post_service') {
            const receivableData = {
                order_id: id,
                lead_id: existingOrder.lead_id,
                client_name: existingOrder.lead_name || existingOrder.client_name,
                invoice_number: existingOrder.invoice_number || \`INV-\${id}\`,
                amount: existingOrder.total_amount || 0,
                advance_amount: existingOrder.advance_amount || 0,
                balance_amount: (existingOrder.total_amount || 0) - (existingOrder.advance_amount || 0),
                assigned_to: existingOrder.assigned_to || existingOrder.sales_person,
                due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
                status: 'pending',
                created_at: new Date().toISOString(),
                created_by: req.user.email
            };
            
            await db.collection('crm_receivables').add(receivableData);
            console.log('Receivable created for post-service payment order:', id);
        }`
    );
    
    fs.writeFileSync(ordersPath, content);
    console.log('✅ Added receivables creation to order approval');
} else {
    console.log('✓ Receivables creation already exists in orders route');
}
