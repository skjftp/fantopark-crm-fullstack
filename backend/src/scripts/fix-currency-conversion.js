const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || 'enduring-wharf-464005-h7'
  });
}

const db = admin.firestore();

// Current exchange rates (approximate)
const EXCHANGE_RATES = {
  'EUR': 90,
  'USD': 83,
  'GBP': 105,
  'AED': 22.75,
  'INR': 1
};

async function fixCurrencyConversion() {
  console.log('🔄 Starting currency conversion fix for orders...');
  
  try {
    // Get all orders
    const ordersSnapshot = await db.collection('crm_orders').get();
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
        
        // Check if already fixed
        if (order.currency_conversion_fixed) {
          console.log(`⏭️  Order ${orderId} already fixed, skipping`);
          skippedCount++;
          continue;
        }
        
        const exchangeRate = EXCHANGE_RATES[currency];
        if (!exchangeRate) {
          console.log(`⚠️  Unknown currency ${currency} for order ${orderId}`);
          errorCount++;
          continue;
        }
        
        // Get current values
        const originalAmount = parseFloat(order.base_amount || order.total_amount || 0);
        const originalFinalAmount = parseFloat(order.final_amount || 0);
        const advanceAmount = parseFloat(order.advance_amount || 0);
        
        // Skip if amounts are already large (likely already in INR)
        if (originalAmount > 50000) {
          console.log(`⏭️  Order ${orderId} amounts seem already in INR (${originalAmount}), skipping`);
          skippedCount++;
          continue;
        }
        
        // Calculate INR equivalents
        const baseAmountINR = originalAmount * exchangeRate;
        const finalAmountINR = originalFinalAmount * exchangeRate;
        const advanceAmountINR = advanceAmount * exchangeRate;
        
        // Update order
        const updateData = {
          // Store original values
          original_base_amount: originalAmount,
          original_final_amount: originalFinalAmount,
          original_advance_amount: advanceAmount,
          original_currency: currency,
          
          // Update with INR values
          base_amount: baseAmountINR,
          final_amount: finalAmountINR,
          total_amount: baseAmountINR, // Update total_amount too
          advance_amount: advanceAmountINR,
          
          // Add metadata
          currency_conversion_applied: true,
          currency_conversion_fixed: true,
          exchange_rate_used: exchangeRate,
          conversion_date: new Date().toISOString(),
          updated_date: new Date().toISOString()
        };
        
        await db.collection('crm_orders').doc(orderId).update(updateData);
        
        console.log(`✅ Fixed order ${orderId} (${order.lead_name || 'Unknown'})`);
        console.log(`   ${currency} ${originalAmount} → INR ${baseAmountINR} (rate: ${exchangeRate})`);
        
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

// Run the fix
fixCurrencyConversion();