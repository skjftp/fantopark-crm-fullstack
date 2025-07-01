const admin = require('./src/config/firebase');
const db = admin.firestore();

async function testPayables() {
    console.log('=== TESTING PAYABLES SYSTEM ===\n');
    
    try {
        // 1. Check existing payables
        const payablesSnapshot = await db.collection('crm_payables').limit(5).get();
        console.log(`1. Current payables count: ${payablesSnapshot.size}`);
        
        if (payablesSnapshot.size > 0) {
            console.log('\nExisting payables:');
            payablesSnapshot.forEach(doc => {
                const data = doc.data();
                console.log(`- ${doc.id}: ${data.supplierName} - ₹${data.amount}`);
            });
        }
        
        // 2. Check recent inventory with pending status
        console.log('\n2. Checking recent inventory with pending payment...');
        const inventorySnapshot = await db.collection('crm_inventory')
            .where('paymentStatus', '==', 'pending')
            .orderBy('created_date', 'desc')
            .limit(5)
            .get();
            
        console.log(`Found ${inventorySnapshot.size} inventory items with pending payment`);
        
        if (inventorySnapshot.size > 0) {
            console.log('\nRecent pending inventory:');
            inventorySnapshot.forEach(doc => {
                const data = doc.data();
                console.log(`- ${data.event_name}: ₹${data.totalPurchaseAmount || 'N/A'} (Created: ${data.created_date})`);
            });
        }
        
        // 3. Manually create a test payable to ensure collection works
        console.log('\n3. Creating a test payable...');
        const testPayable = {
            supplierName: 'Test Supplier - Manual',
            eventName: 'Test Event',
            amount: 10000,
            amountPaid: 0,
            balance: 10000,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: 'system-test',
            description: 'Manual test payable'
        };
        
        const docRef = await db.collection('crm_payables').add(testPayable);
        console.log(`✅ Test payable created with ID: ${docRef.id}`);
        
    } catch (error) {
        console.error('Error:', error.message);
    }
    
    process.exit(0);
}

testPayables();
