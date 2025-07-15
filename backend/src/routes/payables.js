const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET all payables with currency support
router.get('/test', (req, res) => res.json({ message: 'Payables router is working' }));

router.get('/', authenticateToken, async (req, res) => {
  try {
    const snapshot = await db.collection('crm_payables').get();
    const payables = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Enhanced data with currency support
      const payableData = {
        id: doc.id,
        ...data,
        // Ensure currency fields exist for frontend
        currency: data.currency || data.original_currency || 'INR',
        original_amount: data.original_amount || data.amount || 0,
        exchange_rate: data.exchange_rate || 1,
        amount_inr: data.amount_inr || data.amount || 0
      };
      
      // If currency is not INR but amount_inr is missing, calculate it
      if (payableData.currency !== 'INR' && !data.amount_inr && data.exchange_rate) {
        payableData.amount_inr = payableData.original_amount * payableData.exchange_rate;
      }
      
      payables.push(payableData);
    });
    
    res.json({ data: payables });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Diagnostic endpoint with currency info
router.get('/diagnostic', authenticateToken, async (req, res) => {
  try {
    console.log('Diagnostic endpoint called');
    const snapshot = await db.collection('crm_payables').get();
    const payables = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      payables.push({
        id: doc.id,
        hasInventoryId: !!data.inventoryId,
        inventoryId: data.inventoryId || 'NOT SET',
        amount: data.amount,
        currency: data.currency || 'INR',
        original_currency: data.original_currency,
        original_amount: data.original_amount,
        exchange_rate: data.exchange_rate,
        amount_inr: data.amount_inr,
        status: data.status,
        supplierName: data.supplierName,
        created_date: data.created_date,
        creation_exchange_rate: data.creation_exchange_rate,
        payment_exchange_rate: data.payment_exchange_rate,
        exchange_difference: data.exchange_difference,
        exchange_difference_type: data.exchange_difference_type
      });
    });
    
    const summary = {
      total: payables.length,
      withInventoryId: payables.filter(p => p.hasInventoryId).length,
      withoutInventoryId: payables.filter(p => !p.hasInventoryId).length,
      withCurrency: payables.filter(p => p.currency && p.currency !== 'INR').length,
      withOriginalCurrency: payables.filter(p => p.original_currency && p.original_currency !== 'INR').length,
      withExchangeDifference: payables.filter(p => p.exchange_difference).length,
      payables: payables
    };
    
    console.log('Payables diagnostic:', summary);
    res.json(summary);
  } catch (error) {
    console.error('Diagnostic error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET payables by inventory ID
router.get('/by-inventory/:inventoryId', authenticateToken, async (req, res) => {
  try {
    const { inventoryId } = req.params;
    console.log('Searching payables for inventory:', inventoryId);
    
    const snapshot = await db.collection('crm_payables')
      .where('inventoryId', '==', inventoryId)
      .get();
    
    const payables = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      payables.push({
        id: doc.id,
        ...data,
        // Ensure currency fields
        currency: data.currency || data.original_currency || 'INR',
        original_amount: data.original_amount || data.amount || 0,
        exchange_rate: data.exchange_rate || 1,
        amount_inr: data.amount_inr || data.amount || 0
      });
    });
    
    console.log(`Found ${payables.length} payables for inventory ${inventoryId}`);
    res.json({ data: payables });
  } catch (error) {
    console.error('Error fetching payables by inventory:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST create payable with currency support
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      amount,
      currency = 'INR',
      exchange_rate = 1,
      ...otherData
    } = req.body;
    
    // Calculate INR amount
    let amount_inr = amount;
    let original_amount = amount;
    
    if (currency !== 'INR' && exchange_rate) {
      amount_inr = amount * exchange_rate;
    }
    
    const payableData = {
      ...otherData,
      amount: amount_inr,  // Store INR amount in main amount field for backward compatibility
      original_amount: original_amount,
      currency: currency,
      original_currency: currency, // Store original currency
      exchange_rate: exchange_rate,
      amount_inr: amount_inr,
      // Store creation exchange rate info
      creation_exchange_rate: exchange_rate,
      creation_date: new Date().toISOString(),
      creation_amount_inr: amount_inr,
      created_date: new Date().toISOString(),
      created_by: req.user.email
    };
    
    console.log('Creating payable with currency:', {
      currency,
      original_amount,
      exchange_rate,
      amount_inr
    });
    
    const docRef = await db.collection('crm_payables').add(payableData);
    res.status(201).json({ data: { id: docRef.id, ...payableData } });
  } catch (error) {
    console.error('Error creating payable:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update payable - ENHANCED version with exchange difference calculation
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const payableRef = db.collection('crm_payables').doc(id);
    const payable = await payableRef.get();
    
    if (!payable.exists) {
      return res.status(404).json({ error: 'Payable not found' });
    }
    
    const existingData = payable.data();
    const {
      amount,
      currency,
      exchange_rate,
      status,
      payment_date,
      payment_reference,
      ...otherData
    } = req.body;
    
    let updateData = {
      ...otherData,
      updated_date: new Date().toISOString(),
      updated_by: req.user.email
    };
    
    // Store creation exchange rate if this is the first time and not already stored
    if (!existingData.creation_exchange_rate && existingData.exchange_rate) {
      updateData.creation_exchange_rate = existingData.exchange_rate;
      updateData.creation_amount_inr = existingData.amount_inr || existingData.amount;
    }
    
    // Handle currency/amount updates
    if (amount !== undefined || currency !== undefined || exchange_rate !== undefined) {
      const newCurrency = currency || existingData.currency || existingData.original_currency || 'INR';
      const newExchangeRate = exchange_rate || existingData.exchange_rate || 1;
      const newAmount = amount !== undefined ? amount : existingData.original_amount;
      
      updateData.original_amount = newAmount;
      updateData.currency = newCurrency;
      updateData.original_currency = newCurrency;
      updateData.exchange_rate = newExchangeRate;
      
      // Calculate INR amount
      if (newCurrency !== 'INR') {
        updateData.amount_inr = newAmount * newExchangeRate;
        updateData.amount = updateData.amount_inr;
      } else {
        updateData.amount_inr = newAmount;
        updateData.amount = newAmount;
      }
    }
    
    // ENHANCED: If marking as paid, calculate exchange difference
    if (status === 'paid' && existingData.status !== 'paid') {
      updateData.status = 'paid';
      updateData.payment_date = payment_date || new Date().toISOString();
      updateData.payment_reference = payment_reference;
      
      // Check both currency and original_currency fields for foreign currency
      const payableCurrency = existingData.original_currency || existingData.currency;
      
      // Calculate exchange difference for foreign currency
      if (payableCurrency && payableCurrency !== 'INR') {
        console.log('Calculating exchange difference for:', {
          currency: payableCurrency,
          original_amount: existingData.original_amount,
          creation_rate: existingData.creation_exchange_rate || existingData.exchange_rate,
          current_rate: exchange_rate || existingData.exchange_rate
        });
        
        const currentExchangeRate = exchange_rate || existingData.exchange_rate || 1;
        const originalAmount = existingData.original_amount || (existingData.amount / existingData.exchange_rate);
        const creationRate = existingData.creation_exchange_rate || existingData.exchange_rate || 1;
        
        const paymentAmountINR = originalAmount * currentExchangeRate;
        const creationAmountINR = existingData.creation_amount_inr || (originalAmount * creationRate);
        
        updateData.payment_exchange_rate = currentExchangeRate;
        updateData.payment_amount_inr = paymentAmountINR;
        updateData.exchange_difference = paymentAmountINR - creationAmountINR;
        updateData.exchange_difference_type = updateData.exchange_difference > 0 ? 'loss' : 'gain';
        
        console.log('Exchange calculation result:', {
          creation_inr: creationAmountINR,
          payment_inr: paymentAmountINR,
          difference: updateData.exchange_difference,
          type: updateData.exchange_difference_type
        });
        
        // Add to payment history
        const paymentRecord = {
          date: updateData.payment_date,
          amount_foreign: originalAmount,
          exchange_rate: currentExchangeRate,
          amount_inr: paymentAmountINR,
          difference: updateData.exchange_difference,
          reference: payment_reference,
          created_by: req.user.email
        };
        
        updateData.payment_history = [...(existingData.payment_history || []), paymentRecord];
      }
    }
    
    await payableRef.update(updateData);
    
    // If marking as paid and has inventoryId, update the related inventory
    if (updateData.status === 'paid' && existingData.inventoryId) {
      try {
        const inventoryRef = db.collection('crm_inventory').doc(existingData.inventoryId);
        const inventory = await inventoryRef.get();
        
        if (inventory.exists) {
          const inventoryData = inventory.data();
          const currentPaid = parseFloat(inventoryData.amountPaid || 0);
          // Use INR amount for payment tracking
          const paymentAmount = parseFloat(updateData.amount_inr || updateData.amount || existingData.amount_inr || existingData.amount || 0);
          const newAmountPaid = currentPaid + paymentAmount;
          const totalAmount = parseFloat(inventoryData.totalPurchaseAmount || 0);
          
          await inventoryRef.update({
            amountPaid: newAmountPaid,
            paymentStatus: newAmountPaid >= totalAmount ? 'paid' : 'pending',
            updated_date: new Date().toISOString()
          });
          
          console.log(`Updated inventory ${existingData.inventoryId} - Amount paid: ${newAmountPaid} INR`);
        }
      } catch (invError) {
        console.error('Error updating related inventory:', invError);
      }
    }
    
    // Return response with exchange difference info if applicable
    const response = { 
      data: { id, ...existingData, ...updateData },
      success: true
    };
    
    if (updateData.exchange_difference !== undefined) {
      response.exchange_impact = {
        amount: Math.abs(updateData.exchange_difference),
        type: updateData.exchange_difference_type,
        creation_rate: existingData.creation_exchange_rate || existingData.exchange_rate,
        payment_rate: updateData.payment_exchange_rate,
        message: `Exchange ${updateData.exchange_difference_type}: ₹${Math.abs(updateData.exchange_difference).toFixed(2)}`
      };
    }
    
    res.json(response);
  } catch (error) {
    console.error('Error updating payable:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE payable
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('crm_payables').doc(id).delete();
    res.json({ message: 'Payable deleted successfully', id });
  } catch (error) {
    console.error('Error deleting payable:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add this new endpoint to your backend/src/routes/payables.js file

// POST partial payment for a payable
router.post('/:id/partial-payment', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      payment_amount,      // Amount in original currency
      payment_exchange_rate, // Exchange rate at payment time
      payment_reference,
      payment_date,
      payment_notes
    } = req.body;
    
    // Get existing payable
    const payableRef = db.collection('crm_payables').doc(id);
    const payable = await payableRef.get();
    
    if (!payable.exists) {
      return res.status(404).json({ error: 'Payable not found' });
    }
    
    const existingData = payable.data();
    
    // Validate payment amount
    const originalAmount = existingData.original_amount || existingData.amount;
    const totalPaidSoFar = (existingData.payment_history || [])
      .reduce((sum, payment) => sum + payment.amount_foreign, 0);
    const remainingAmount = originalAmount - totalPaidSoFar;
    
    if (payment_amount > remainingAmount) {
      return res.status(400).json({ 
        error: 'Payment amount exceeds remaining balance',
        remaining: remainingAmount 
      });
    }
    
    // Calculate payment in INR
    const payableCurrency = existingData.original_currency || existingData.currency || 'INR';
    const paymentExchangeRate = payableCurrency === 'INR' ? 1 : (payment_exchange_rate || existingData.exchange_rate);
    const paymentAmountINR = payment_amount * paymentExchangeRate;
    
    // Calculate FX impact for this payment
    const creationRate = existingData.creation_exchange_rate || existingData.exchange_rate || 1;
    const creationAmountINR = payment_amount * creationRate;
    const exchangeDifference = paymentAmountINR - creationAmountINR;
    const exchangeDifferenceType = exchangeDifference > 0 ? 'loss' : 'gain';
    
    // Create payment record
    const paymentRecord = {
      payment_id: 'PAY-' + Date.now(),
      date: payment_date || new Date().toISOString(),
      amount_foreign: payment_amount,
      currency: payableCurrency,
      exchange_rate: paymentExchangeRate,
      amount_inr: paymentAmountINR,
      creation_rate: creationRate,
      exchange_difference: exchangeDifference,
      exchange_difference_type: exchangeDifferenceType,
      reference: payment_reference || '',
      notes: payment_notes || '',
      created_by: req.user.email,
      created_date: new Date().toISOString()
    };
    
    // Update payable
    const newTotalPaid = totalPaidSoFar + payment_amount;
    const isFullyPaid = newTotalPaid >= originalAmount;
    
    const updateData = {
      payment_history: [...(existingData.payment_history || []), paymentRecord],
      total_paid_foreign: newTotalPaid,
      total_paid_inr: (existingData.total_paid_inr || 0) + paymentAmountINR,
      remaining_amount_foreign: originalAmount - newTotalPaid,
      status: isFullyPaid ? 'paid' : 'partial',
      last_payment_date: paymentRecord.date,
      updated_date: new Date().toISOString(),
      updated_by: req.user.email
    };
    
    // If fully paid, calculate total FX impact
    if (isFullyPaid) {
      updateData.payment_date = paymentRecord.date;
      
      // Sum up all exchange differences
      const totalExchangeDifference = (existingData.payment_history || [])
        .reduce((sum, p) => sum + (p.exchange_difference || 0), 0) + exchangeDifference;
      
      updateData.total_exchange_difference = totalExchangeDifference;
      updateData.total_exchange_difference_type = totalExchangeDifference > 0 ? 'loss' : 'gain';
    }
    
    await payableRef.update(updateData);
    
    // Update related inventory if exists
    if (existingData.inventoryId) {
      try {
        const inventoryRef = db.collection('crm_inventory').doc(existingData.inventoryId);
        const inventory = await inventoryRef.get();
        
        if (inventory.exists) {
          const inventoryData = inventory.data();
          const currentPaidINR = parseFloat(inventoryData.amountPaid_inr || inventoryData.amountPaid || 0);
          const newAmountPaidINR = currentPaidINR + paymentAmountINR;
          const totalAmountINR = parseFloat(inventoryData.totalPurchaseAmount_inr || inventoryData.totalPurchaseAmount || 0);
          
          await inventoryRef.update({
            amountPaid: inventoryData.purchase_currency === 'INR' ? newAmountPaidINR : newTotalPaid,
            amountPaid_inr: newAmountPaidINR,
            paymentStatus: isFullyPaid ? 'paid' : 'partial',
            updated_date: new Date().toISOString()
          });
        }
      } catch (invError) {
        console.error('Error updating inventory:', invError);
      }
    }
    
    // Prepare response
    res.json({
      success: true,
      data: {
        id,
        payment_record: paymentRecord,
        remaining_amount: remainingAmount - payment_amount,
        remaining_amount_inr: (originalAmount - newTotalPaid) * paymentExchangeRate,
        status: updateData.status,
        exchange_impact: {
          amount: Math.abs(exchangeDifference),
          type: exchangeDifferenceType,
          creation_rate: creationRate,
          payment_rate: paymentExchangeRate,
          message: `Exchange ${exchangeDifferenceType}: ₹${Math.abs(exchangeDifference).toFixed(2)}`
        }
      }
    });
    
  } catch (error) {
    console.error('Error recording partial payment:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
// Deployment: 1751483422
