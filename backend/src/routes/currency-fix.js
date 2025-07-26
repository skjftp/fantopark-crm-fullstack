const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/db');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// Current exchange rates (approximate - update these with current rates)
const EXCHANGE_RATES = {
  'EUR': 89.5,  // Updated EUR rate
  'USD': 83.2,  // Updated USD rate
  'GBP': 105.8, // Updated GBP rate
  'AED': 22.75,
  'SGD': 62.1,
  'AUD': 53.8,
  'CAD': 60.2,
  'CHF': 92.3,
  'JPY': 0.56,
  'INR': 1
};

// GET /api/currency-fix/analyze - Analyze currency conversion issues
router.get('/analyze', authenticateToken, checkPermission('super_admin'), async (req, res) => {
  try {
    console.log('Analyzing currency conversion issues for user:', req.user.email);

    const ordersSnapshot = await db.collection(collections.orders).get();
    
    let totalForeignOrders = 0;
    let ordersNeedingFix = 0;
    let ordersCorrect = 0;
    const problematicOrders = [];

    ordersSnapshot.forEach(doc => {
      const order = doc.data();
      const orderId = doc.id;
      const currency = order.payment_currency || 'INR';
      
      // Skip INR orders
      if (currency === 'INR') return;
      
      totalForeignOrders++;
      
      const savedExchangeRate = parseFloat(order.exchange_rate || 1);
      const correctExchangeRate = EXCHANGE_RATES[currency];
      
      if (!correctExchangeRate) {
        console.log(`Unknown currency ${currency} for order ${orderId}`);
        return;
      }
      
      const needsFix = (
        !order.currency_conversion_fixed ||
        savedExchangeRate === 1 ||
        Math.abs(savedExchangeRate - correctExchangeRate) > (correctExchangeRate * 0.1)
      );
      
      if (needsFix) {
        ordersNeedingFix++;
        const originalAmount = parseFloat(order.base_amount || order.total_amount || 0);
        const originalFinalAmount = parseFloat(order.final_amount || order.final_amount_inr || 0);
        
        problematicOrders.push({
          order_id: orderId,
          order_number: order.order_number || orderId,
          client_name: order.lead_name || order.client_name || 'Unknown',
          currency: currency,
          current_rate: savedExchangeRate,
          correct_rate: correctExchangeRate,
          base_amount: originalAmount,
          final_amount: originalFinalAmount,
          should_be_inr: (originalAmount * correctExchangeRate).toFixed(2),
          should_be_final_inr: (originalFinalAmount * correctExchangeRate).toFixed(2)
        });
      } else {
        ordersCorrect++;
      }
    });

    res.json({
      success: true,
      total_foreign_orders: totalForeignOrders,
      orders_needing_fix: ordersNeedingFix,
      orders_correct: ordersCorrect,
      problematic_orders: problematicOrders.slice(0, 20), // Limit to first 20 for display
      exchange_rates_used: EXCHANGE_RATES
    });

  } catch (error) {
    console.error('Error analyzing currency conversion:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to analyze currency conversion',
      message: error.message 
    });
  }
});

// POST /api/currency-fix/apply - Apply currency conversion fixes
router.post('/apply', authenticateToken, checkPermission('super_admin'), async (req, res) => {
  try {
    console.log('Applying currency conversion fixes for user:', req.user.email);

    const ordersSnapshot = await db.collection(collections.orders).get();
    
    let ordersProcessed = 0;
    let ordersFixed = 0;
    let ordersSkipped = 0;
    let ordersErrored = 0;
    const fixedOrders = [];

    const batch = db.batch();

    ordersSnapshot.forEach(doc => {
      const order = doc.data();
      const orderId = doc.id;
      const currency = order.payment_currency || 'INR';
      
      ordersProcessed++;
      
      // Skip INR orders
      if (currency === 'INR') {
        ordersSkipped++;
        return;
      }
      
      const savedExchangeRate = parseFloat(order.exchange_rate || 1);
      const correctExchangeRate = EXCHANGE_RATES[currency];
      
      if (!correctExchangeRate) {
        console.log(`Unknown currency ${currency} for order ${orderId}`);
        ordersErrored++;
        return;
      }
      
      // Determine if this order needs fixing
      const needsFix = (
        !order.currency_conversion_fixed ||
        savedExchangeRate === 1 ||
        Math.abs(savedExchangeRate - correctExchangeRate) > (correctExchangeRate * 0.1)
      );
      
      if (!needsFix) {
        ordersSkipped++;
        return;
      }
      
      // Get current values
      const originalAmount = parseFloat(order.base_amount || order.total_amount || 0);
      const originalFinalAmount = parseFloat(order.final_amount || order.final_amount_inr || 0);
      const originalInrEquivalent = parseFloat(order.inr_equivalent || 0);
      const advanceAmount = parseFloat(order.advance_amount || 0);
      
      // If amounts are very large and exchange rate is correct, likely already converted
      if (originalAmount > 50000 && Math.abs(savedExchangeRate - correctExchangeRate) < (correctExchangeRate * 0.1)) {
        ordersSkipped++;
        return;
      }
      
      // Calculate INR equivalents using correct exchange rate
      const baseAmountINR = originalAmount * correctExchangeRate;
      const finalAmountINR = originalFinalAmount * correctExchangeRate;
      const advanceAmountINR = advanceAmount * correctExchangeRate;
      const inrEquivalentAmount = originalAmount * correctExchangeRate;
      
      // Prepare update data
      const updateData = {
        // Store original values (if not already stored)
        ...((!order.original_base_amount) && { original_base_amount: originalAmount }),
        ...((!order.original_final_amount) && { original_final_amount: originalFinalAmount }),
        ...((!order.original_advance_amount) && { original_advance_amount: advanceAmount }),
        ...((!order.original_currency) && { original_currency: currency }),
        ...((!order.original_exchange_rate) && { original_exchange_rate: savedExchangeRate }),
        
        // Update with corrected INR values
        base_amount: baseAmountINR,
        total_amount: baseAmountINR,
        final_amount_inr: finalAmountINR,
        inr_equivalent: inrEquivalentAmount,
        advance_amount: advanceAmountINR,
        
        // Update exchange rate to correct value
        exchange_rate: correctExchangeRate,
        
        // Add metadata
        currency_conversion_applied: true,
        currency_conversion_fixed: true,
        currency_fix_version: '2.0',
        last_conversion_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
      };
      
      // Add to batch update
      batch.update(doc.ref, updateData);
      ordersFixed++;
      
      fixedOrders.push({
        order_id: orderId,
        order_number: order.order_number || orderId,
        client_name: order.lead_name || order.client_name || 'Unknown',
        currency: currency,
        old_exchange_rate: savedExchangeRate,
        new_exchange_rate: correctExchangeRate,
        old_base_amount: originalAmount,
        new_base_amount_inr: baseAmountINR,
        old_final_amount: originalFinalAmount,
        new_final_amount_inr: finalAmountINR
      });
    });

    // Apply all updates
    if (ordersFixed > 0) {
      await batch.commit();
      console.log(`Successfully fixed ${ordersFixed} orders`);
    }

    res.json({
      success: true,
      orders_processed: ordersProcessed,
      orders_fixed: ordersFixed,
      orders_skipped: ordersSkipped,
      orders_errored: ordersErrored,
      fixed_orders: fixedOrders.slice(0, 10), // Return first 10 for verification
      exchange_rates_used: EXCHANGE_RATES,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error applying currency conversion fixes:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to apply currency conversion fixes',
      message: error.message 
    });
  }
});

module.exports = router;