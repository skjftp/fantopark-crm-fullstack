const admin = require('firebase-admin');

async function updateOrderForTesting() {
    try {
        const db = admin.firestore();
        
        // Get the existing order
        const ordersSnapshot = await db.collection('crm_orders')
            .where('payment_status', '==', 'pending')
            .limit(1)
            .get();
        
        if (!ordersSnapshot.empty) {
            const orderDoc = ordersSnapshot.docs[0];
            const orderId = orderDoc.id;
            const orderData = orderDoc.data();
            
            console.log('Found order:', orderId);
            console.log('Current data:', {
                status: orderData.status,
                payment_status: orderData.payment_status,
                lead_status: orderData.lead_status
            });
            
            // Update to post-service payment
            await db.collection('crm_orders').doc(orderId).update({
                lead_status: 'payment_post_service',
                status: 'approved'
            });
            
            console.log('✅ Updated order to post-service payment status');
            
            // Check if a receivable was created
            const receivablesSnapshot = await db.collection('crm_receivables')
                .where('order_id', '==', orderId)
                .get();
                
            console.log(`Found ${receivablesSnapshot.size} receivables for this order`);
        } else {
            console.log('No pending orders found');
        }
        
    } catch (error) {
        console.error('Error updating order:', error);
    }
}

// Run if called directly
if (require.main === module) {
    updateOrderForTesting().then(() => process.exit(0));
}

module.exports = updateOrderForTesting;
