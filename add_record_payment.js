const fs = require('fs');
let content = fs.readFileSync('frontend/public/index.html', 'utf8');

// Add recordPayment function
const recordPaymentFunction = `
    // Record payment for receivable
    const recordPayment = async (receivableId) => {
        const paymentAmount = prompt('Enter payment amount:');
        if (!paymentAmount) return;
        
        const paymentMode = prompt('Enter payment mode (bank_transfer/cash/cheque):', 'bank_transfer');
        const transactionId = prompt('Enter transaction ID (optional):');
        
        try {
            setLoading(true);
            const response = await apiCall(\`/receivables/record-payment/\${receivableId}\`, 'PUT', {
                payment_amount: parseFloat(paymentAmount),
                payment_date: new Date().toISOString(),
                payment_mode: paymentMode,
                transaction_id: transactionId
            });
            
            alert('Payment recorded successfully!');
            fetchFinancialData(); // Refresh data
        } catch (error) {
            console.error('Error recording payment:', error);
            alert('Failed to record payment');
        } finally {
            setLoading(false);
        }
    };
`;

// Insert the function after fetchFinancialData
const insertPattern = /const fetchFinancialData = async[\s\S]*?\n    \};/;
if (insertPattern.test(content) && !content.includes('recordPayment')) {
    content = content.replace(insertPattern, '$&\n\n' + recordPaymentFunction);
    console.log('✅ Added recordPayment function');
}

// Update the Record Payment button to call the function
content = content.replace(
    /onClick: \(\) => console\.log\('Record payment for:', [^)]+\)/g,
    'onClick: () => recordPayment(receivable.id)'
);

content = content.replace(
    /onClick: \(\) => console\.log\('Record payment for:', sale\.id\)/g,
    'onClick: () => recordPayment(sale.id)'
);

fs.writeFileSync('frontend/public/index.html', content);
console.log('✅ Added record payment functionality');
