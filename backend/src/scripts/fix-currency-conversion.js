require('dotenv').config();
const { db, collections } = require('../config/db');

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

async function fixCurrencyConversion() {
  console.log('🔄 Starting currency conversion fix for orders...');
  
  try {
    // Get all orders
    const ordersSnapshot = await db.collection(collections.orders).get();
    console.log(`Found ${ordersSnapshot.size} orders to check`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const orderDoc of ordersSnapshot.docs) {
      const order = orderDoc.data();
      const orderId = orderDoc.id;
      
      try {
        const currency = order.payment_currency || 'INR';
        
        // Skip INR orders
        if (currency === 'INR') {
          skippedCount++;
          continue;
        }
        
        // Check if already fixed (but allow re-fix if exchange rate is wrong)
        const savedExchangeRate = parseFloat(order.exchange_rate || 1);
        const correctExchangeRate = EXCHANGE_RATES[currency];
        
        if (!correctExchangeRate) {
          console.log(`⚠️  Unknown currency ${currency} for order ${orderId}`);
          errorCount++;
          continue;
        }
        
        // Determine if this order needs fixing
        const needsFix = (
          !order.currency_conversion_fixed ||  // Never been fixed
          savedExchangeRate === 1 ||          // Wrong exchange rate saved
          Math.abs(savedExchangeRate - correctExchangeRate) > (correctExchangeRate * 0.1) // Rate differs by more than 10%
        );
        
        if (!needsFix) {
          console.log(`⏭️  Order ${orderId} already properly fixed, skipping`);
          skippedCount++;
          continue;
        }
        
        // Get current values - check multiple field names
        const originalAmount = parseFloat(order.base_amount || order.total_amount || 0);
        const originalFinalAmount = parseFloat(order.final_amount || order.final_amount_inr || 0);
        const originalInrEquivalent = parseFloat(order.inr_equivalent || 0);
        const advanceAmount = parseFloat(order.advance_amount || 0);
        
        // If amounts are very large and exchange rate is correct, likely already converted
        if (originalAmount > 50000 && Math.abs(savedExchangeRate - correctExchangeRate) < (correctExchangeRate * 0.1)) {
          console.log(`⏭️  Order ${orderId} amounts seem already in INR (${originalAmount}) with correct rate, skipping`);
          skippedCount++;
          continue;
        }
        
        // Use the correct exchange rate from our mapping
        const useExchangeRate = correctExchangeRate;
        
        // Calculate INR equivalents
        const baseAmountINR = originalAmount * useExchangeRate;
        const finalAmountINR = originalFinalAmount * useExchangeRate;
        const advanceAmountINR = advanceAmount * useExchangeRate;
        const inrEquivalentAmount = originalAmount * useExchangeRate;  // This should match base amount
        
        // Update order with correct values
        const updateData = {
          // Store original values (if not already stored)
          ...((!order.original_base_amount) && { original_base_amount: originalAmount }),
          ...((!order.original_final_amount) && { original_final_amount: originalFinalAmount }),
          ...((!order.original_advance_amount) && { original_advance_amount: advanceAmount }),
          ...((!order.original_currency) && { original_currency: currency }),
          ...((!order.original_exchange_rate) && { original_exchange_rate: savedExchangeRate }),
          
          // Update with corrected INR values
          base_amount: baseAmountINR,
          total_amount: baseAmountINR,  // Keep total_amount same as base_amount
          final_amount_inr: finalAmountINR,
          inr_equivalent: inrEquivalentAmount,
          advance_amount: advanceAmountINR,
          
          // Update exchange rate to correct value
          exchange_rate: useExchangeRate,
          
          // Add metadata
          currency_conversion_applied: true,
          currency_conversion_fixed: true,
          currency_fix_version: '2.0',  // Version 2 of the fix
          last_conversion_date: new Date().toISOString(),
          updated_date: new Date().toISOString()
        };
        
        await db.collection(collections.orders).doc(orderId).update(updateData);
        
        console.log(`✅ Fixed order ${orderId} (${order.order_number || 'Unknown'}) - ${order.lead_name || order.client_name || 'Unknown'}`);
        console.log(`   Currency: ${currency}`);
        console.log(`   Old exchange rate: ${savedExchangeRate} → New: ${useExchangeRate}`);
        console.log(`   Base amount: ${originalAmount} ${currency} → INR ${baseAmountINR.toFixed(2)}`);
        console.log(`   Final amount: ${originalFinalAmount} ${currency} → INR ${finalAmountINR.toFixed(2)}`);
        console.log(`   INR equivalent: ${originalInrEquivalent} → ${inrEquivalentAmount.toFixed(2)}`);
        console.log(``);
        
        fixedCount++;
        
      } catch (error) {
        console.error(`❌ Error processing order ${orderId}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n=== Currency Conversion Fix Summary ===');
    console.log(`Total orders checked: ${ordersSnapshot.size}`);
    console.log(`✅ Successfully fixed: ${fixedCount}`);
    console.log(`⏭️  Skipped (INR/already fixed): ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
    if (fixedCount > 0) {
      console.log('\n🎉 Currency conversion issues have been fixed!');
      console.log('💡 Sales performance data should now show correct figures.');
      console.log('🔄 Consider clearing the sales performance cache to see updated data.');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    process.exit(0);
  }
}

async function analyzeOnly() {
  console.log('🔍 Analyzing currency conversion issues (DRY RUN)...');
  
  try {
    const ordersSnapshot = await db.collection(collections.orders).get();
    console.log(`Found ${ordersSnapshot.size} orders to analyze`);
    
    let totalForeignOrders = 0;
    let ordersNeedingFix = 0;
    let correctOrders = 0;
    
    console.log('\n📊 Foreign Currency Orders Analysis:');
    console.log('='.repeat(100));
    
    for (const orderDoc of ordersSnapshot.docs) {
      const order = orderDoc.data();
      const orderId = orderDoc.id;
      const currency = order.payment_currency || 'INR';
      
      // Skip INR orders
      if (currency === 'INR') continue;
      
      totalForeignOrders++;
      
      const savedExchangeRate = parseFloat(order.exchange_rate || 1);
      const correctExchangeRate = EXCHANGE_RATES[currency];
      
      if (!correctExchangeRate) {
        console.log(`⚠️  Unknown currency ${currency} for order ${orderId}`);
        continue;
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
        
        console.log(`❌ NEEDS FIX: ${order.order_number || orderId} - ${order.lead_name || order.client_name || 'Unknown'}`);
        console.log(`   Currency: ${currency}, Current Rate: ${savedExchangeRate}, Should be: ${correctExchangeRate}`);
        console.log(`   Base: ${originalAmount} ${currency} → Should be: ${(originalAmount * correctExchangeRate).toFixed(2)} INR`);
        console.log(`   Final: ${originalFinalAmount} ${currency} → Should be: ${(originalFinalAmount * correctExchangeRate).toFixed(2)} INR`);
        console.log('');
      } else {
        correctOrders++;
      }
    }
    
    console.log('\n📈 Analysis Summary:');
    console.log(`Total foreign currency orders: ${totalForeignOrders}`);
    console.log(`Orders needing currency fix: ${ordersNeedingFix}`);
    console.log(`Orders already correct: ${correctOrders}`);
    
    if (ordersNeedingFix > 0) {
      console.log('\n💡 To fix these issues, run:');
      console.log('node src/scripts/fix-currency-conversion.js --fix');
    } else {
      console.log('\n✅ All foreign currency orders have correct conversion!');
    }
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    process.exit(0);
  }
}

// Check command line arguments
const args = process.argv.slice(2);

if (args.includes('--analyze') || args.includes('--dry-run')) {
  console.log('Running in ANALYZE mode - no changes will be made\n');
  analyzeOnly();
} else if (args.includes('--fix')) {
  console.log('Running in FIX mode - will update database\n');
  fixCurrencyConversion();
} else {
  console.log('Currency Conversion Fix Script');
  console.log('================================');
  console.log('');
  console.log('Usage:');
  console.log('  node src/scripts/fix-currency-conversion.js --analyze    # Analyze issues only');
  console.log('  node src/scripts/fix-currency-conversion.js --fix        # Apply fixes to database');
  console.log('');
  console.log('Examples:');
  console.log('  # First, analyze what needs to be fixed');
  console.log('  node src/scripts/fix-currency-conversion.js --analyze');
  console.log('');
  console.log('  # Then apply the fixes');
  console.log('  node src/scripts/fix-currency-conversion.js --fix');
}