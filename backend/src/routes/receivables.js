const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET all receivables with currency support
router.get('/', authenticateToken, async (req, res) => {
  try {
    const snapshot = await db.collection(collections.receivables).get();
    const receivables = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Enhanced data with currency support
      const receivableData = {
        id: doc.id,
        ...data,
        // Map expected_amount to amount for consistency
        amount: data.amount || data.expected_amount || 0,
        // Ensure currency fields exist for frontend
        currency: data.currency || 'INR',
        original_amount: data.original_amount || data.expected_amount || data.amount || 0,
        exchange_rate: data.exchange_rate || 1,
        amount_inr: data.amount_inr || data.expected_amount_inr || data.expected_amount || data.amount || 0
      };
      
      // If currency is not INR but amount_inr is missing, calculate it
      if (receivableData.currency !== 'INR' && !data.amount_inr && !data.expected_amount_inr && data.exchange_rate) {
        receivableData.amount_inr = receivableData.original_amount * receivableData.exchange_rate;
      }
      
      receivables.push(receivableData);
    });
    
    res.json({ data: receivables });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create receivable with currency support
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      expected_amount,
      amount,
      currency = 'INR',
      exchange_rate = 1,
      ...otherData
    } = req.body;
    
    // Use amount or expected_amount
    const originalAmount = amount || expected_amount || 0;
    
    // Calculate INR amount
    let amount_inr = originalAmount;
    
    if (currency !== 'INR' && exchange_rate) {
      amount_inr = originalAmount * exchange_rate;
    }
    
    const receivableData = {
      ...otherData,
      expected_amount: amount_inr,  // Store INR amount for backward compatibility
      amount: amount_inr,           // Also store as amount for consistency
      original_amount: originalAmount,
      currency: currency,
      exchange_rate: exchange_rate,
      amount_inr: amount_inr,
      expected_amount_inr: amount_inr,
      created_date: new Date().toISOString(),
      created_by: req.user.email
    };
    
    console.log('Creating receivable with currency:', {
      currency,
      original_amount: originalAmount,
      exchange_rate,
      amount_inr
    });
    
    const docRef = await db.collection(collections.receivables).add(receivableData);
    res.status(201).json({ data: { id: docRef.id, ...receivableData } });
  } catch (error) {
    console.error('Error creating receivable:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT record payment for receivable with currency awareness
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
        
        // Use INR amount for payment
        const expectedAmountINR = data.amount_inr || data.expected_amount_inr || data.expected_amount || data.amount || 0;
        
        const updateData = {
            status: 'paid',
            payment_amount: payment_amount || expectedAmountINR,
            payment_amount_inr: payment_amount || expectedAmountINR,
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
        
        // Return complete updated data with currency info
        const responseData = {
            id,
            ...data,
            ...updateData,
            // Ensure currency fields are present
            currency: data.currency || 'INR',
            original_amount: data.original_amount || data.expected_amount || 0,
            exchange_rate: data.exchange_rate || 1,
            amount_inr: data.amount_inr || expectedAmountINR
        };
        
        res.json(responseData);
    } catch (error) {
        console.error('Error recording payment:', error);
        res.status(500).json({ error: 'Failed to record payment' });
    }
});

// PUT update receivable with currency support
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const receivableRef = db.collection(collections.receivables).doc(id);
    const receivable = await receivableRef.get();
    
    if (!receivable.exists) {
      return res.status(404).json({ error: 'Receivable not found' });
    }
    
    const existingData = receivable.data();
    const {
      expected_amount,
      amount,
      currency,
      exchange_rate,
      ...otherData
    } = req.body;
    
    // Handle currency updates
    let updateData = {
      ...otherData,
      updated_date: new Date().toISOString(),
      updated_by: req.user.email
    };
    
    // If amount or currency info is being updated
    if (expected_amount !== undefined || amount !== undefined || currency !== undefined || exchange_rate !== undefined) {
      const newCurrency = currency || existingData.currency || 'INR';
      const newExchangeRate = exchange_rate || existingData.exchange_rate || 1;
      const newAmount = amount || expected_amount || existingData.original_amount || existingData.expected_amount;
      
      updateData.original_amount = newAmount;
      updateData.currency = newCurrency;
      updateData.exchange_rate = newExchangeRate;
      
      // Calculate INR amount
      if (newCurrency !== 'INR') {
        updateData.amount_inr = newAmount * newExchangeRate;
        updateData.expected_amount_inr = updateData.amount_inr;
        updateData.expected_amount = updateData.amount_inr; // For backward compatibility
        updateData.amount = updateData.amount_inr;
      } else {
        updateData.amount_inr = newAmount;
        updateData.expected_amount_inr = newAmount;
        updateData.expected_amount = newAmount;
        updateData.amount = newAmount;
      }
    }
    
    await receivableRef.update(updateData);
    
    // Return updated receivable with all fields
    const responseData = {
      data: {
        id,
        ...existingData,
        ...updateData
      }
    };
    
    res.json(responseData);
  } catch (error) {
    console.error('Error updating receivable:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE receivable
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`DELETE request received for receivable: ${id}`);
    
    const receivableRef = db.collection(collections.receivables).doc(id);
    const receivable = await receivableRef.get();
    
    if (!receivable.exists) {
      console.log(`Receivable not found: ${id}`);
      return res.status(404).json({ error: 'Receivable not found' });
    }
    
    await receivableRef.delete();
    console.log(`Successfully deleted receivable: ${id}`);
    
    res.json({ message: 'Receivable deleted successfully', id });
  } catch (error) {
    console.error('Error deleting receivable:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
