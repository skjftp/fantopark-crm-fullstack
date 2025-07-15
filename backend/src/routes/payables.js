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
        currency: data.currency || 'INR',
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
        original_amount: data.original_amount,
        exchange_rate: data.exchange_rate,
        amount_inr: data.amount_inr,
        status: data.status,
        supplierName: data.supplierName,
        created_date: data.created_date
      });
    });
    
    const summary = {
      total: payables.length,
      withInventoryId: payables.filter(p => p.hasInventoryId).length,
      withoutInventoryId: payables.filter(p => !p.hasInventoryId).length,
      withCurrency: payables.filter(p => p.currency && p.currency !== 'INR').length,
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
        currency: data.currency || 'INR',
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
// PUT update payable - ENHANCED version of your existing endpoint
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
    
    // Store creation exchange rate if this is the first time
    if (!existingData.creation_exchange_rate && existingData.exchange_rate) {
      updateData.creation_exchange_rate = existingData.exchange_rate;
      updateData.creation_amount_inr = existingData.amount_inr || existingData.amount;
    }
    
    // Handle currency/amount updates
    if (amount !== undefined || currency !== undefined || exchange_rate !== undefined) {
      const newCurrency = currency || existingData.currency || 'INR';
      const newExchangeRate = exchange_rate || existingData.exchange_rate || 1;
      const newAmount = amount !== undefined ? amount : existingData.original_amount;
      
      updateData.original_amount = newAmount;
      updateData.currency = newCurrency;
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
      
      // Calculate exchange difference
      if (existingData.currency !== 'INR') {
        const currentExchangeRate = exchange_rate || updateData.exchange_rate;
        const paymentAmountINR = (updateData.original_amount || existingData.original_amount) * currentExchangeRate;
        const creationAmountINR = existingData.creation_amount_inr || existingData.amount_inr;
        
        updateData.payment_exchange_rate = currentExchangeRate;
        updateData.payment_amount_inr = paymentAmountINR;
        updateData.exchange_difference = paymentAmountINR - creationAmountINR;
        updateData.exchange_difference_type = updateData.exchange_difference > 0 ? 'loss' : 'gain';
        
        // Add to payment history
        const paymentRecord = {
          date: updateData.payment_date,
          amount_foreign: updateData.original_amount || existingData.original_amount,
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

// PUT update payable with currency support
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
      ...otherData
    } = req.body;
    
    // Handle currency updates
    let updateData = {
      ...otherData,
      updated_date: new Date().toISOString(),
      updated_by: req.user.email
    };
    
    // If amount or currency info is being updated
    if (amount !== undefined || currency !== undefined || exchange_rate !== undefined) {
      const newCurrency = currency || existingData.currency || 'INR';
      const newExchangeRate = exchange_rate || existingData.exchange_rate || 1;
      const newAmount = amount !== undefined ? amount : existingData.original_amount;
      
      updateData.original_amount = newAmount;
      updateData.currency = newCurrency;
      updateData.exchange_rate = newExchangeRate;
      
      // Calculate INR amount
      if (newCurrency !== 'INR') {
        updateData.amount_inr = newAmount * newExchangeRate;
        updateData.amount = updateData.amount_inr; // For backward compatibility
      } else {
        updateData.amount_inr = newAmount;
        updateData.amount = newAmount;
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
    
    // Return the complete updated document
    const updatedData = { ...existingData, ...updateData };
    res.json({ data: { id, ...updatedData } });
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

module.exports = router;
// Deployment: 1751483422
