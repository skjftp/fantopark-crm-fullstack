const fs = require('fs');
const path = require('path');

const receivablesPath = path.join(__dirname, 'src/routes/receivables.js');
let content = fs.readFileSync(receivablesPath, 'utf8');

// Add payment recording endpoint if not exists
if (!content.includes('router.put(\'/record-payment')) {
    const routerExports = content.lastIndexOf('module.exports = router;');
    
    const paymentEndpoint = `
// PUT record payment for receivable
router.put('/record-payment/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { payment_amount, payment_date, payment_mode, transaction_id } = req.body;
        
        const receivableRef = db.collection('crm_receivables').doc(id);
        const receivable = await receivableRef.get();
        
        if (!receivable.exists) {
            return res.status(404).json({ error: 'Receivable not found' });
        }
        
        const data = receivable.data();
        const updateData = {
            status: 'paid',
            payment_amount: payment_amount || data.expected_amount,
            payment_date: payment_date || new Date().toISOString(),
            payment_mode: payment_mode || 'bank_transfer',
            transaction_id: transaction_id || '',
            updated_at: new Date().toISOString(),
            updated_by: req.user.email
        };
        
        await receivableRef.update(updateData);
        
        // Update the related order if exists
        if (data.order_id) {
            await db.collection('crm_orders').doc(data.order_id).update({
                payment_status: 'paid',
                status: 'completed',
                payment_date: updateData.payment_date
            });
        }
        
        res.json({ id, ...data, ...updateData });
    } catch (error) {
        console.error('Error recording payment:', error);
        res.status(500).json({ error: 'Failed to record payment' });
    }
});

`;
    
    content = content.slice(0, routerExports) + paymentEndpoint + '\n' + content.slice(routerExports);
    fs.writeFileSync(receivablesPath, content);
    console.log('✅ Added payment recording endpoint');
}
