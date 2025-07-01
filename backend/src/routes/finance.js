const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { authenticateToken, checkPermission } = require('../middleware/auth');

const db = admin.firestore();

// Get sales data
router.get('/sales', authenticateToken, checkPermission('finance', 'read'), async (req, res) => {
    try {
        const { dateFrom, dateTo, clientName, assignedPerson } = req.query;
        
        let query = db.collection('crm_invoices').where('status', 'in', ['paid', 'partially_paid']);
        
        if (dateFrom) {
            query = query.where('date', '>=', new Date(dateFrom));
        }
        if (dateTo) {
            query = query.where('date', '<=', new Date(dateTo));
        }
        
        const snapshot = await query.get();
        const sales = [];
        
        for (const doc of snapshot.docs) {
            const data = doc.data();
            
            // Apply additional filters
            if (clientName && !data.clientName?.toLowerCase().includes(clientName.toLowerCase())) continue;
            if (assignedPerson && !data.assignedTo?.toLowerCase().includes(assignedPerson.toLowerCase())) continue;
            
            sales.push({
                id: doc.id,
                ...data,
                date: data.date?.toDate ? data.date.toDate() : data.date,
                amount: data.totalAmount || 0
            });
        }
        
        res.json({ data: sales });
    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).json({ error: 'Failed to fetch sales data' });
    }
});

// Get receivables
router.get('/receivables', authenticateToken, checkPermission('finance', 'read'), async (req, res) => {
    try {
        const { clientName, daysOverdue } = req.query;
        
        // Get unpaid or partially paid invoices
        const snapshot = await db.collection('crm_invoices')
            .where('status', 'in', ['pending', 'partially_paid'])
            .get();
        
        const receivables = [];
        const today = new Date();
        
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const dueDate = data.dueDate?.toDate ? data.dueDate.toDate() : new Date(data.dueDate);
            const overdueDays = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
            
            // Apply filters
            if (clientName && !data.clientName?.toLowerCase().includes(clientName.toLowerCase())) continue;
            if (daysOverdue && overdueDays < parseInt(daysOverdue)) continue;
            
            receivables.push({
                id: doc.id,
                ...data,
                dueDate: dueDate,
                amount: data.pendingAmount || data.totalAmount || 0,
                daysOverdue: overdueDays
            });
        }
        
        res.json({ data: receivables });
    } catch (error) {
        console.error('Error fetching receivables:', error);
        res.status(500).json({ error: 'Failed to fetch receivables' });
    }
});

// Get payables
router.get('/payables', authenticateToken, checkPermission('finance', 'read'), async (req, res) => {
    try {
        const { supplierName, status } = req.query;
        
        let query = db.collection('crm_payables');
        
        if (status && status !== 'all') {
            query = query.where('status', '==', status);
        }
        
        const snapshot = await query.get();
        const payables = [];
        
        for (const doc of snapshot.docs) {
            const data = doc.data();
            
            // Apply supplier filter
            if (supplierName && !data.supplierName?.toLowerCase().includes(supplierName.toLowerCase())) continue;
            
            payables.push({
                id: doc.id,
                ...data,
                dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : data.dueDate,
                amount: data.amount || 0
            });
        }
        
        res.json({ data: payables });
    } catch (error) {
        console.error('Error fetching payables:', error);
        res.status(500).json({ error: 'Failed to fetch payables' });
    }
});

// Get expiring inventory
router.get('/expiring-inventory', authenticateToken, checkPermission('finance', 'read'), async (req, res) => {
    try {
        const { daysUntilExpiry = 180 } = req.query; // Default to 6 months
        
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + parseInt(daysUntilExpiry));
        
        const snapshot = await db.collection('crm_inventory')
            .where('expiryDate', '<=', futureDate)
            .where('quantity', '>', 0)
            .get();
        
        const expiringItems = [];
        
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const expiryDate = data.expiryDate?.toDate ? data.expiryDate.toDate() : new Date(data.expiryDate);
            const daysUntil = Math.floor((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
            
            if (daysUntil > 0) { // Only show items not yet expired
                expiringItems.push({
                    id: doc.id,
                    productName: data.name || data.productName,
                    batchNumber: data.batchNumber || 'N/A',
                    expiryDate: expiryDate,
                    quantity: data.quantity || 0,
                    price: data.price || 0,
                    daysUntilExpiry: daysUntil
                });
            }
        }
        
        // Sort by expiry date (soonest first)
        expiringItems.sort((a, b) => a.expiryDate - b.expiryDate);
        
        res.json({ data: expiringItems });
    } catch (error) {
        console.error('Error fetching expiring inventory:', error);
        res.status(500).json({ error: 'Failed to fetch expiring inventory' });
    }
});

// Create payable entry
router.post('/payables', authenticateToken, checkPermission('finance', 'write'), async (req, res) => {
    try {
        const { supplierName, invoiceNumber, amount, dueDate, description } = req.body;
        
        const payable = {
            supplierName,
            invoiceNumber,
            amount: parseFloat(amount),
            dueDate: new Date(dueDate),
            description,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: req.user.uid
        };
        
        const docRef = await db.collection('crm_payables').add(payable);
        
        res.json({ 
            success: true, 
            id: docRef.id,
            data: { ...payable, id: docRef.id }
        });
    } catch (error) {
        console.error('Error creating payable:', error);
        res.status(500).json({ error: 'Failed to create payable' });
    }
});

// Update payable status
router.put('/payables/:id', authenticateToken, checkPermission('finance', 'write'), async (req, res) => {
    try {
        const { status, paidAmount, paidDate } = req.body;
        
        const update = {
            status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: req.user.uid
        };
        
        if (status === 'paid') {
            update.paidAmount = parseFloat(paidAmount) || 0;
            update.paidDate = paidDate ? new Date(paidDate) : new Date();
        }
        
        await db.collection('crm_payables').doc(req.params.id).update(update);
        
        res.json({ success: true, message: 'Payable updated successfully' });
    } catch (error) {
        console.error('Error updating payable:', error);
        res.status(500).json({ error: 'Failed to update payable' });
    }
});

// Send payment reminder
router.post('/receivables/:id/remind', authenticateToken, checkPermission('finance', 'write'), async (req, res) => {
    try {
        const receivableDoc = await db.collection('crm_invoices').doc(req.params.id).get();
        
        if (!receivableDoc.exists) {
            return res.status(404).json({ error: 'Receivable not found' });
        }
        
        const receivable = receivableDoc.data();
        
        // Create reminder record
        await db.collection('crm_payment_reminders').add({
            invoiceId: req.params.id,
            clientName: receivable.clientName,
            clientEmail: receivable.clientEmail,
            amount: receivable.pendingAmount || receivable.totalAmount,
            dueDate: receivable.dueDate,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            sentBy: req.user.uid
        });
        
        // Here you would integrate with your email service
        // For now, we'll just log it
        console.log(`Payment reminder sent for invoice ${receivable.invoiceNumber}`);
        
        res.json({ success: true, message: 'Payment reminder sent successfully' });
    } catch (error) {
        console.error('Error sending reminder:', error);
        res.status(500).json({ error: 'Failed to send payment reminder' });
    }
});

module.exports = router;
