// Demo script to show bulk payment upload functionality
const fs = require('fs');
const csv = require('csv-parser');

// Sample CSV data
const csvContent = `lead_id,lead_name,lead_email,lead_phone,event_name,event_date,payment_date,payment_amount,payment_mode,bank_name,transaction_id,cheque_number,invoice_numbers,invoice_amounts,taxes,discount,processing_fee,total_amount,payment_status,payment_proof_url,collected_by,branch,notes
LEAD001,John Doe,john@example.com,9876543210,IPL 2025 - CSK vs MI,2025-04-15,2025-07-24,50000,UPI,HDFC Bank,UPI123456789,,"INV-001,INV-002","25000,25000","4500,4500",2000,500,58000,Full Payment,,Amisha,Mumbai,Payment for 2 premium tickets
LEAD002,Jane Smith,jane@example.com,9876543211,ICC World Cup Final,2025-06-20,2025-07-24,75000,Bank Transfer,ICICI Bank,NEFT987654321,,INV-003,75000,13500,5000,1000,84500,Full Payment,https://drive.google.com/payment1.pdf,Sumit,Delhi,Corporate booking
LEAD003,Bob Wilson,bob@example.com,9876543212,IPL 2025 Final,2025-05-25,2025-07-24,30000,Credit Card,AXIS Bank,CC456789,,INV-004,30000,2700,1000,300,32000,Full Payment,,Pratik,Bangalore,Online booking`;

// Write sample CSV
fs.writeFileSync('demo-payments.csv', csvContent);
console.log('✅ Created demo-payments.csv');

// Parse and validate CSV
console.log('\n📋 Parsing CSV file...\n');

const results = [];
fs.createReadStream('demo-payments.csv')
  .pipe(csv())
  .on('data', (row) => {
    // Validate each row
    const errors = [];
    
    if (!row.lead_id) errors.push('Lead ID is required');
    if (!row.payment_amount || isNaN(row.payment_amount)) errors.push('Valid payment amount is required');
    if (!row.payment_date) errors.push('Payment date is required');
    if (!row.payment_mode) errors.push('Payment mode is required');
    
    // Parse complex fields
    const invoiceNumbers = row.invoice_numbers ? row.invoice_numbers.split(',').map(i => i.trim()) : [];
    const invoiceAmounts = row.invoice_amounts ? row.invoice_amounts.split(',').map(a => parseFloat(a.trim())) : [];
    const taxes = row.taxes ? row.taxes.split(',').map(t => parseFloat(t.trim())) : [];
    
    const processedRow = {
      lead_id: row.lead_id,
      lead_name: row.lead_name,
      payment_amount: parseFloat(row.payment_amount),
      payment_mode: row.payment_mode,
      invoice_count: invoiceNumbers.length,
      total_tax: taxes.reduce((sum, tax) => sum + tax, 0),
      total_amount: parseFloat(row.total_amount || row.payment_amount),
      validation: {
        isValid: errors.length === 0,
        errors: errors
      }
    };
    
    results.push(processedRow);
  })
  .on('end', () => {
    console.log('📊 Validation Results:\n');
    console.log('Total rows:', results.length);
    console.log('Valid rows:', results.filter(r => r.validation.isValid).length);
    console.log('Invalid rows:', results.filter(r => !r.validation.isValid).length);
    
    console.log('\n💰 Payment Summary:\n');
    const totalAmount = results.reduce((sum, r) => sum + r.total_amount, 0);
    console.log('Total payment amount:', `₹${totalAmount.toLocaleString('en-IN')}`);
    
    console.log('\n📝 Row Details:\n');
    results.forEach((row, index) => {
      console.log(`Row ${index + 1}:`);
      console.log(`  Lead ID: ${row.lead_id}`);
      console.log(`  Name: ${row.lead_name}`);
      console.log(`  Amount: ₹${row.payment_amount.toLocaleString('en-IN')}`);
      console.log(`  Mode: ${row.payment_mode}`);
      console.log(`  Invoices: ${row.invoice_count}`);
      console.log(`  Status: ${row.validation.isValid ? '✅ Valid' : '❌ Invalid'}`);
      if (!row.validation.isValid) {
        console.log(`  Errors: ${row.validation.errors.join(', ')}`);
      }
      console.log('');
    });
    
    console.log('\n🚀 In production, these payments would:');
    console.log('  1. Create payment records in crm_payments collection');
    console.log('  2. Create or update orders for each lead');
    console.log('  3. Update lead status to payment_received');
    console.log('  4. Create activity logs for audit trail');
    console.log('  5. Send confirmation emails to customers');
    
    // Clean up
    fs.unlinkSync('demo-payments.csv');
  });