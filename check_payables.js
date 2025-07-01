const admin = require('./src/config/firebase');
const db = admin.firestore();

async function checkPayables() {
    try {
        // Check if payables collection exists and has documents
        const payablesSnapshot = await db.collection('crm_payables').limit(5).get();
        console.log(`Payables collection has ${payablesSnapshot.size} documents (showing max 5)`);
        
        if (payablesSnapshot.size > 0) {
            console.log("\nSample payables:");
            payablesSnapshot.forEach(doc => {
                const data = doc.data();
                console.log(`- ${doc.id}: ${data.supplierName} - ₹${data.amount} - Status: ${data.status}`);
            });
        }
        
        // Check recent inventory with pending payment
        const inventorySnapshot = await db.collection('crm_inventory')
            .where('paymentStatus', '==', 'pending')
            .limit(5)
            .get();
            
        console.log(`\nInventory with pending payment: ${inventorySnapshot.size} items`);
        if (inventorySnapshot.size > 0) {
            console.log("Items with pending payment:");
            inventorySnapshot.forEach(doc => {
                const data = doc.data();
                console.log(`- ${data.event_name}: ₹${data.totalPurchaseAmount || 'N/A'}`);
            });
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
    process.exit(0);
}

checkPayables();
