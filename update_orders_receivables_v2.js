const fs = require('fs');
const path = require('path');

const ordersPath = path.join(__dirname, 'backend/src/routes/orders.js');
let content = fs.readFileSync(ordersPath, 'utf8');

// Check if we already have receivables creation
if (!content.includes('crm_receivables')) {
    // Find the order update section
    const updatePattern = /(await db\.collection\('crm_orders'\)\.doc\(id\)\.update\(updateData\);)/;
    
    const receivableCreation = `
        
        // Create receivable for pending payment orders when approved
        if (updateData.status === 'approved') {
            const orderDoc = await db.collection('crm_orders').doc(id).get();
            const orderData = orderDoc.data();
            
            if (orderData.payment_status === 'pending' || orderData.lead_status === 'payment_post_service') {
                // Use the same field names as existing receivables
                const receivableData = {
                    order_id: id,
                    lead_id: orderData.lead_id,
                    client_name: orderData.lead_name || orderData.client_name,
                    client_email: orderData.lead_email || orderData.client_email || '',
                    client_phone: orderData.lead_phone || orderData.client_phone || '',
                    expected_amount: parseFloat(orderData.total_amount || 0) - parseFloat(orderData.advance_amount || 0),
                    expected_payment_date: orderData.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    service_date: orderData.event_date || orderData.created_at,
                    payment_terms: orderData.payment_terms || 'Net 30',
                    status: 'pending',
                    created_by: req.user.email,
                    created_date: new Date().toISOString(),
                    invoice_id: orderData.invoice_number || \`INV-\${id}\`,
                    assigned_to: orderData.assigned_to || orderData.sales_person
                };
                
                await db.collection('crm_receivables').add(receivableData);
                console.log('Receivable created for order:', id);
            }
        }`;
    
    content = content.replace(updatePattern, `$1${receivableCreation}`);
    fs.writeFileSync(ordersPath, content);
    console.log('✅ Updated orders route to create receivables with correct fields');
} else {
    console.log('✓ Receivables creation already exists');
}
