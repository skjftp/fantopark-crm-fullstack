const admin = require('firebase-admin');

async function migrateReceivables() {
    try {
        const db = admin.firestore();
        
        // Get all existing receivables
        const snapshot = await db.collection('crm_receivables').get();
        console.log(`Found ${snapshot.size} receivables to check`);
        
        let updated = 0;
        const batch = db.batch();
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const updates = {};
            
            // Add missing fields
            if (!data.amount && data.expected_amount) {
                updates.amount = data.expected_amount;
            }
            if (!data.balance_amount && data.expected_amount) {
                updates.balance_amount = data.expected_amount;
            }
            if (!data.invoice_number && data.invoice_id) {
                updates.invoice_number = data.invoice_id;
            }
            if (!data.due_date && data.expected_payment_date) {
                updates.due_date = data.expected_payment_date;
            }
            
            if (Object.keys(updates).length > 0) {
                batch.update(doc.ref, updates);
                updated++;
            }
        });
        
        if (updated > 0) {
            await batch.commit();
            console.log(`✅ Updated ${updated} receivables with missing fields`);
        } else {
            console.log('✓ All receivables already have required fields');
        }
        
    } catch (error) {
        console.error('Migration error:', error);
    }
}

// Run if called directly
if (require.main === module) {
    migrateReceivables().then(() => process.exit(0));
}

module.exports = migrateReceivables;
