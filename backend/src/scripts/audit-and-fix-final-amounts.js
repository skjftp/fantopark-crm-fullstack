const admin = require('../config/firebase');
const db = admin.firestore();

async function auditAndFixFinalAmounts() {
  console.log('🔍 Starting comprehensive audit of order final amounts...\n');
  
  try {
    // Get all orders
    const ordersSnapshot = await db.collection('crm_orders').get();
    
    console.log(`📊 Found ${ordersSnapshot.size} total orders to audit\n`);
    
    const issues = {
      serviceFee: [],
      tourPackage: [],
      other: []
    };
    
    let correctCount = 0;
    
    for (const doc of ordersSnapshot.docs) {
      const order = doc.data();
      const orderId = doc.id;
      
      // Get amounts
      const invoiceTotal = order.invoice_total || 0;
      const serviceFeeAmount = order.service_fee_amount || order.service_fee || 0;
      const gstAmount = order.gst_amount || 0;
      const tcsAmount = order.tcs_amount || 0;
      
      // Calculate correct final amount based on type
      let correctFinalAmount;
      
      if (order.type_of_sale === 'Service Fee') {
        // For Service Fee: Invoice Total + Service Fee + GST + TCS
        correctFinalAmount = invoiceTotal + serviceFeeAmount + gstAmount + tcsAmount;
      } else {
        // For other types: Invoice Total + Service Fee + GST + TCS
        // (but typically service fee is 0 for non-Service Fee types)
        correctFinalAmount = invoiceTotal + serviceFeeAmount + gstAmount + tcsAmount;
      }
      
      const currentFinalAmount = order.final_amount || 0;
      
      // Check if there's a discrepancy
      if (Math.abs(currentFinalAmount - correctFinalAmount) > 0.01) {
        const issue = {
          orderId,
          orderNumber: order.order_number,
          clientName: order.client_name,
          typeOfSale: order.type_of_sale,
          currency: order.currency || 'INR',
          invoiceTotal,
          serviceFeeAmount,
          gstAmount,
          tcsAmount,
          currentFinalAmount,
          correctFinalAmount,
          difference: correctFinalAmount - currentFinalAmount,
          createdDate: order.created_date,
          status: order.status
        };
        
        if (order.type_of_sale === 'Service Fee') {
          issues.serviceFee.push(issue);
        } else if (order.type_of_sale === 'Tour Package') {
          issues.tourPackage.push(issue);
        } else {
          issues.other.push(issue);
        }
      } else {
        correctCount++;
      }
    }
    
    // Display audit results
    console.log('📊 AUDIT RESULTS:\n');
    console.log(`✅ Correct orders: ${correctCount}`);
    console.log(`❌ Orders with issues: ${issues.serviceFee.length + issues.tourPackage.length + issues.other.length}\n`);
    
    // Show Service Fee issues
    if (issues.serviceFee.length > 0) {
      console.log('🏷️  SERVICE FEE ORDERS WITH INCORRECT AMOUNTS:\n');
      issues.serviceFee.forEach(issue => {
        console.log(`Order: ${issue.orderNumber || issue.orderId}`);
        console.log(`  Client: ${issue.clientName}`);
        console.log(`  Invoice: ${issue.currency} ${issue.invoiceTotal}`);
        console.log(`  Service Fee: ${issue.currency} ${issue.serviceFeeAmount}`);
        console.log(`  GST: ${issue.currency} ${issue.gstAmount}`);
        console.log(`  TCS: ${issue.currency} ${issue.tcsAmount}`);
        console.log(`  Current Final: ${issue.currency} ${issue.currentFinalAmount}`);
        console.log(`  Should Be: ${issue.currency} ${issue.correctFinalAmount}`);
        console.log(`  Difference: ${issue.currency} ${issue.difference.toFixed(2)}\n`);
      });
    }
    
    // Show Tour Package issues
    if (issues.tourPackage.length > 0) {
      console.log('🎫 TOUR PACKAGE ORDERS WITH INCORRECT AMOUNTS:\n');
      issues.tourPackage.forEach(issue => {
        console.log(`Order: ${issue.orderNumber || issue.orderId}`);
        console.log(`  Client: ${issue.clientName}`);
        console.log(`  Current Final: ${issue.currency} ${issue.currentFinalAmount}`);
        console.log(`  Should Be: ${issue.currency} ${issue.correctFinalAmount}`);
        console.log(`  Difference: ${issue.currency} ${issue.difference.toFixed(2)}\n`);
      });
    }
    
    // Show other issues
    if (issues.other.length > 0) {
      console.log('📦 OTHER ORDERS WITH INCORRECT AMOUNTS:\n');
      issues.other.forEach(issue => {
        console.log(`Order: ${issue.orderNumber || issue.orderId} (${issue.typeOfSale})`);
        console.log(`  Client: ${issue.clientName}`);
        console.log(`  Current Final: ${issue.currency} ${issue.currentFinalAmount}`);
        console.log(`  Should Be: ${issue.currency} ${issue.correctFinalAmount}`);
        console.log(`  Difference: ${issue.currency} ${issue.difference.toFixed(2)}\n`);
      });
    }
    
    // Calculate total impact
    const allIssues = [...issues.serviceFee, ...issues.tourPackage, ...issues.other];
    if (allIssues.length > 0) {
      const totalDifference = allIssues.reduce((sum, issue) => sum + issue.difference, 0);
      console.log(`\n💰 TOTAL IMPACT: INR ${totalDifference.toFixed(2)} across ${allIssues.length} orders\n`);
      
      // Ask what to do
      console.log('What would you like to do?');
      console.log('1. Fix all issues');
      console.log('2. Fix only Service Fee orders');
      console.log('3. Export issues to CSV');
      console.log('4. Exit without changes\n');
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('Enter your choice (1-4): ', async (choice) => {
        switch(choice) {
          case '1':
            await fixAllIssues(allIssues);
            break;
          case '2':
            await fixAllIssues(issues.serviceFee);
            break;
          case '3':
            await exportToCSV(allIssues);
            break;
          default:
            console.log('\nNo changes made.');
        }
        readline.close();
        process.exit(0);
      });
    } else {
      console.log('\n🎉 All orders have correct final amounts!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

async function fixAllIssues(issues) {
  console.log(`\n🔧 Preparing to fix ${issues.length} orders...`);
  
  const batch = db.batch();
  
  issues.forEach(issue => {
    const orderRef = db.collection('crm_orders').doc(issue.orderId);
    
    batch.update(orderRef, {
      final_amount: issue.correctFinalAmount,
      final_amount_inr: issue.currency === 'INR' ? issue.correctFinalAmount : issue.correctFinalAmount * (issue.exchange_rate || 1),
      balance_due: issue.correctFinalAmount - (issue.advance_amount || 0),
      final_amount_fixed: true,
      final_amount_fixed_date: new Date().toISOString(),
      final_amount_fixed_reason: 'Bulk fix for final amount calculation'
    });
  });
  
  try {
    await batch.commit();
    console.log(`\n✅ Successfully updated ${issues.length} orders!`);
    
    // Log the update
    await db.collection('crm_maintenance_logs').add({
      timestamp: new Date().toISOString(),
      type: 'final_amount_bulk_fix',
      totalUpdated: issues.length,
      updates: issues.map(i => ({
        orderId: i.orderId,
        orderNumber: i.orderNumber,
        oldAmount: i.currentFinalAmount,
        newAmount: i.correctFinalAmount,
        difference: i.difference
      }))
    });
    
    console.log('📋 Update log saved');
  } catch (error) {
    console.error('❌ Error updating orders:', error);
  }
}

async function exportToCSV(issues) {
  const fs = require('fs');
  const path = require('path');
  
  const csv = [
    'Order ID,Order Number,Client Name,Type of Sale,Currency,Invoice Total,Service Fee,GST,TCS,Current Final,Correct Final,Difference,Status,Created Date'
  ];
  
  issues.forEach(issue => {
    csv.push([
      issue.orderId,
      issue.orderNumber || '',
      issue.clientName,
      issue.typeOfSale || '',
      issue.currency,
      issue.invoiceTotal,
      issue.serviceFeeAmount,
      issue.gstAmount,
      issue.tcsAmount,
      issue.currentFinalAmount,
      issue.correctFinalAmount,
      issue.difference.toFixed(2),
      issue.status,
      issue.createdDate || ''
    ].join(','));
  });
  
  const filename = `order-final-amount-issues-${Date.now()}.csv`;
  const filepath = path.join(process.cwd(), filename);
  
  fs.writeFileSync(filepath, csv.join('\n'));
  console.log(`\n✅ Issues exported to: ${filename}`);
}

// Run the audit
auditAndFixFinalAmounts();