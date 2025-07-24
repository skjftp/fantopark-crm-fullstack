const admin = require('../config/firebase');
const db = admin.firestore();

async function fixServiceFeeFinalAmounts() {
  console.log('🔧 Starting to fix Service Fee orders with incorrect final amounts...\n');
  
  try {
    // Get all orders with type_of_sale = 'Service Fee'
    const ordersSnapshot = await db.collection('crm_orders')
      .where('type_of_sale', '==', 'Service Fee')
      .get();
    
    console.log(`📊 Found ${ordersSnapshot.size} Service Fee orders to check\n`);
    
    const batch = db.batch();
    let updateCount = 0;
    let skipCount = 0;
    const updates = [];
    
    for (const doc of ordersSnapshot.docs) {
      const order = doc.data();
      const orderId = doc.id;
      
      // Get amounts
      const invoiceTotal = order.invoice_total || 0;
      const serviceFeeAmount = order.service_fee_amount || order.service_fee || 0;
      const gstAmount = order.gst_amount || 0;
      const tcsAmount = order.tcs_amount || 0;
      
      // Calculate what the final amount should be
      const correctFinalAmount = invoiceTotal + serviceFeeAmount + gstAmount + tcsAmount;
      const currentFinalAmount = order.final_amount || 0;
      
      // Check if update is needed
      if (Math.abs(currentFinalAmount - correctFinalAmount) > 0.01) {
        console.log(`\n🔍 Order ${order.order_number || orderId}:`);
        console.log(`   Client: ${order.client_name}`);
        console.log(`   Type: ${order.type_of_sale}`);
        console.log(`   Invoice Total: ${order.currency || 'INR'} ${invoiceTotal}`);
        console.log(`   Service Fee: ${order.currency || 'INR'} ${serviceFeeAmount}`);
        console.log(`   GST: ${order.currency || 'INR'} ${gstAmount}`);
        console.log(`   TCS: ${order.currency || 'INR'} ${tcsAmount}`);
        console.log(`   ❌ Current Final Amount: ${order.currency || 'INR'} ${currentFinalAmount}`);
        console.log(`   ✅ Correct Final Amount: ${order.currency || 'INR'} ${correctFinalAmount}`);
        console.log(`   💰 Difference: ${order.currency || 'INR'} ${(correctFinalAmount - currentFinalAmount).toFixed(2)}`);
        
        // Update the order
        batch.update(doc.ref, {
          final_amount: correctFinalAmount,
          final_amount_inr: order.currency === 'INR' ? correctFinalAmount : correctFinalAmount * (order.exchange_rate || 1),
          // Update balance due if needed
          balance_due: correctFinalAmount - (order.advance_amount || 0),
          // Add metadata about the fix
          final_amount_fixed: true,
          final_amount_fixed_date: new Date().toISOString(),
          final_amount_fixed_reason: 'Added invoice total to Service Fee type final amount calculation'
        });
        
        updates.push({
          orderId,
          orderNumber: order.order_number,
          clientName: order.client_name,
          oldAmount: currentFinalAmount,
          newAmount: correctFinalAmount,
          difference: correctFinalAmount - currentFinalAmount
        });
        
        updateCount++;
      } else {
        skipCount++;
      }
    }
    
    if (updateCount > 0) {
      console.log(`\n\n📝 Summary of changes:`);
      console.log(`   Orders to update: ${updateCount}`);
      console.log(`   Orders already correct: ${skipCount}`);
      
      // Calculate total impact
      const totalDifference = updates.reduce((sum, u) => sum + u.difference, 0);
      console.log(`   Total amount difference: INR ${totalDifference.toFixed(2)}\n`);
      
      // Ask for confirmation
      console.log('⚠️  This will update the final_amount for all Service Fee orders listed above.');
      console.log('   Type "yes" to proceed with the update, or "no" to cancel:\n');
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('Proceed with update? (yes/no): ', async (answer) => {
        if (answer.toLowerCase() === 'yes') {
          await batch.commit();
          console.log('\n✅ Successfully updated', updateCount, 'orders!');
          
          // Save update log
          const logData = {
            timestamp: new Date().toISOString(),
            type: 'service_fee_final_amount_fix',
            updates: updates,
            totalUpdated: updateCount,
            totalSkipped: skipCount,
            totalDifference: totalDifference
          };
          
          await db.collection('crm_maintenance_logs').add(logData);
          console.log('📋 Update log saved to crm_maintenance_logs collection');
        } else {
          console.log('\n❌ Update cancelled. No changes were made.');
        }
        
        readline.close();
        process.exit(0);
      });
    } else {
      console.log('\n✅ All Service Fee orders already have correct final amounts!');
      console.log(`   Checked ${skipCount} orders - no updates needed.`);
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Run the fix
fixServiceFeeFinalAmounts();