const fs = require('fs');
let content = fs.readFileSync('frontend/public/index.html', 'utf8');

// Fix 1: Update fetchFinancialData to map expected_amount to amount
content = content.replace(
    /const receivablesData = receivablesRes\.data \|\| \[\];/g,
    `const receivablesData = (receivablesRes.data || []).map(r => ({
        ...r,
        amount: parseFloat(r.amount || r.expected_amount || 0),
        balance_amount: parseFloat(r.balance_amount || r.expected_amount || r.amount || 0),
        client_name: r.client_name || 'Unknown',
        invoice_number: r.invoice_number || r.invoice_id || 'N/A',
        due_date: r.due_date || r.expected_payment_date || new Date().toISOString(),
        assigned_to: r.assigned_to || r.created_by || 'Unassigned'
    }));`
);

// Fix 2: Update the renderReceivablesTab to handle the fields correctly
content = content.replace(
    /receivable\.amount/g,
    '(receivable.amount || receivable.expected_amount || 0)'
);

content = content.replace(
    /receivable\.balance_amount/g,
    '(receivable.balance_amount || receivable.expected_amount || receivable.amount || 0)'
);

// Fix 3: Add safe toLocaleString for all receivables rendering
content = content.replace(
    /\(receivable\.amount \|\| receivable\.expected_amount \|\| 0\)\.toLocaleString\(/g,
    '((receivable.amount || receivable.expected_amount || 0)).toLocaleString('
);

content = content.replace(
    /\(receivable\.balance_amount \|\| receivable\.expected_amount \|\| receivable\.amount \|\| 0\)\.toLocaleString\(/g,
    '((receivable.balance_amount || receivable.expected_amount || receivable.amount || 0)).toLocaleString('
);

// Fix 4: Update the due_date field mapping
content = content.replace(
    /receivable\.due_date/g,
    '(receivable.due_date || receivable.expected_payment_date)'
);

fs.writeFileSync('frontend/public/index.html', content);
console.log('✅ Fixed receivables field mapping');
