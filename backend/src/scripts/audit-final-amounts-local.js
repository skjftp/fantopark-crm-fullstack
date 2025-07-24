// This script runs locally without needing Google Cloud credentials
// It will generate a report that you can review and then manually update if needed

const fs = require('fs');
const path = require('path');

console.log('🔍 Order Final Amount Audit Report Generator\n');
console.log('This script will analyze your orders and create a report of any final amount discrepancies.\n');

// Simulated data structure for the report
const reportTemplate = {
  timestamp: new Date().toISOString(),
  summary: {
    totalOrders: 0,
    correctOrders: 0,
    ordersWithIssues: 0,
    totalDiscrepancy: 0
  },
  issues: {
    serviceFee: [],
    tourPackage: [],
    other: []
  }
};

console.log('📋 To run the audit on your live data, you have two options:\n');
console.log('Option 1: Run from Google Cloud Shell');
console.log('  1. Open https://console.cloud.google.com/cloudshell');
console.log('  2. Clone your repo: git clone https://github.com/skjftp/fantopark-crm-fullstack.git');
console.log('  3. cd fantopark-crm-fullstack/backend');
console.log('  4. npm install');
console.log('  5. node src/scripts/audit-and-fix-final-amounts.js\n');

console.log('Option 2: Set up local credentials');
console.log('  1. Install gcloud CLI: https://cloud.google.com/sdk/docs/install');
console.log('  2. Run: gcloud auth application-default login');
console.log('  3. Run: export GOOGLE_CLOUD_PROJECT=enduring-wharf-464005-h7');
console.log('  4. Run: node src/scripts/audit-and-fix-final-amounts.js\n');

console.log('Option 3: Manual Query in Firebase Console');
console.log('  1. Go to Firebase Console > Firestore');
console.log('  2. Filter orders by type_of_sale == "Service Fee"');
console.log('  3. Check each order manually\n');

// Create a sample report to show what the audit would look like
const sampleReport = `
SAMPLE AUDIT REPORT - What to Look For:
========================================

For Service Fee Orders, the correct formula is:
Final Amount = Invoice Total + Service Fee + GST + TCS

Example of an incorrect order:
- Order: ORD-123456
- Type: Service Fee
- Invoice Total: €40
- Service Fee: €60
- GST (18% on service fee): €10.80
- TCS: €0
- Current Final Amount: €70.80 ❌
- Should Be: €110.80 ✅
- Missing: €40 (invoice total)

What to check in Firebase Console:
1. Go to the 'crm_orders' collection
2. Filter by: type_of_sale == "Service Fee"
3. For each order, verify:
   - final_amount = invoice_total + service_fee_amount + gst_amount + tcs_amount

Common issues to look for:
- Service Fee orders where final_amount doesn't include invoice_total
- Orders where final_amount = service_fee_amount + gst_amount (missing invoice_total)
`;

console.log(sampleReport);

// Create a CSV template for manual audit
const csvTemplate = `Order ID,Order Number,Client Name,Type of Sale,Currency,Invoice Total,Service Fee,GST,TCS,Current Final Amount,Expected Final Amount,Difference,Notes
Example1,ORD-123456,John Doe,Service Fee,EUR,40,60,10.80,0,70.80,110.80,40,Missing invoice total
Example2,ORD-789012,Jane Smith,Tour Package,INR,5000,0,250,0,5250,5250,0,Correct
`;

const csvFilename = `order-audit-template-${Date.now()}.csv`;
fs.writeFileSync(csvFilename, csvTemplate);

console.log(`\n📄 Created audit template: ${csvFilename}`);
console.log('   You can use this template to manually audit your orders.\n');

console.log('🔧 Quick Fix Instructions:');
console.log('   If you find orders with incorrect final amounts:');
console.log('   1. Note down the order IDs');
console.log('   2. Run the fix script from Cloud Shell or with proper credentials');
console.log('   3. Or manually update them in Firebase Console\n');

console.log('Need help? The audit script will:');
console.log('   - Show all orders with incorrect final amounts');
console.log('   - Calculate the correct amounts');
console.log('   - Give you options to fix all or specific types');
console.log('   - Create a backup log of all changes\n');