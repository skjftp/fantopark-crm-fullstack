// GST Invoice Preview Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

window.renderGSTInvoicePreview = () => {
  if (!showInvoicePreview || !currentInvoice) return null;

  const invoice = currentInvoice;
  const isIntraState = invoice.indian_state === 'Haryana' && !invoice.is_outside_india;

  // FIX 1: Calculate baseAmount FIRST before using it anywhere
  const baseAmount = window.getBaseAmount(invoice);

  // FIX 2: Use the stored calculation from the invoice, or recalculate if needed
  let calculation;
  if (invoice.gst_calculation && invoice.tcs_calculation) {
    // Use the stored calculation from the order
    calculation = {
      gst: {
        applicable: invoice.gst_calculation.applicable || (invoice.gst_calculation.total > 0),
        rate: invoice.gst_rate || invoice.gst_calculation.rate || 5,
        cgst: invoice.gst_calculation.cgst || 0,
        sgst: invoice.gst_calculation.sgst || 0,
        igst: invoice.gst_calculation.igst || 0,
        total: invoice.gst_calculation.total || invoice.total_tax || 0
      },
      tcs: {
        applicable: invoice.tcs_calculation.applicable || false,
        rate: invoice.tcs_rate || invoice.tcs_calculation.rate || 5, // Use stored rate
        amount: invoice.tcs_calculation.amount || 0
      },
      finalAmount: invoice.final_amount || (baseAmount + (invoice.total_tax || 0))
    };
  } else {
    // Fallback: recalculate using the function
    calculation = calculateGSTAndTCS(baseAmount, invoice);
  }

  const gstRate = calculation.gst.rate;

  // Calculate GST amounts (use stored values if available, otherwise calculate)
  const gstAmount = calculation.gst.total;
  const cgstAmount = calculation.gst.cgst;
  const sgstAmount = calculation.gst.sgst; 
  const igstAmount = calculation.gst.igst;
  const tcsAmount = calculation.tcs.amount;

  // Update invoice with calculated values (ensure they're set)
  invoice.gst_calculation = calculation.gst;
  invoice.tcs_calculation = calculation.tcs;
  invoice.total_tax = gstAmount;
  invoice.final_amount = calculation.finalAmount;

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop',
    onClick: (e) => e.target === e.currentTarget && closeForm()
  },
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[95vh] overflow-y-auto' },
      React.createElement('div', { className: 'sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center action-buttons' },
        React.createElement('h2', { className: 'text-2xl font-bold text-gray-900' }, 
          'GST Invoice: ' + (invoice.invoice_number)
        ),
        React.createElement('div', { className: 'flex space-x-2' },
          React.createElement('button', {
            onClick: () => {
              // Create a new window for printing
              const printWindow = window.open('', '_blank');

              // Get the invoice content
              const invoiceContent = document.querySelector('.invoice-preview').innerHTML;

              // Create a complete HTML document for printing
              const printDocument = `
<!DOCTYPE html>
<html>
<head>
<title>Invoice - ${invoice.invoice_number}</title>
<style>
${document.querySelector('style').innerHTML}
body {
margin: 0;
padding: 20px;
background: white;
}
.invoice-preview {
max-width: 210mm;
margin: 0 auto;
}
@media print {
body {
margin: 0;
padding: 0;
}
.invoice-preview {
margin: 0;
border: none;
}
}

/* Invoice Styles - Updated to match invoice module */
.invoice-preview {
background: white;
border: 2px solid #000;
font-family: Arial, sans-serif;
font-size: 10px;
line-height: 1.2;
margin: 0 auto;
max-width: 210mm;
height: fit-content;
padding: 8mm;
box-sizing: border-box;
display: block;
overflow: hidden;
}
.invoice-header-row {
display: grid;
grid-template-columns: 300px 1fr auto;
padding: 10px 8px;
border-bottom: 2px solid #000;
align-items: center;
margin-bottom: 10px;
background: #f8f9fa;
}
.company-logo {
width: 210px;
height: 150px;
margin: 0;
}
.company-logo img {
max-width: 210px;
max-height: 150px;
object-fit: contain;
}
.invoice-title {
text-align: right;
font-size: 16px;
font-weight: bold;
padding-top: 10px;
color: #2c3e50;
}
.invoice-meta {
display: grid;
grid-template-columns: 1fr 1fr;
padding: 8px;
border-bottom: 1px solid #000;
font-size: 10px;
margin-bottom: 10px;
background: #f8f9fa;
}
.customer-section {
padding: 10px 8px;
border-bottom: 1px solid #000;
margin-bottom: 12px;
background: #f8f9fa;
}
.customer-title {
font-weight: bold;
margin-bottom: 4px;
font-size: 10px;
}
.invoice-table {
width: 100%;
border-collapse: collapse;
font-size: 10px;
margin-bottom: 12px;
}
.invoice-table th {
background: #2c3e50;
color: white;
padding: 6px 4px;
text-align: left;
border: 1px solid #000;
font-weight: bold;
font-size: 10px;
}
.invoice-table td {
padding: 6px 4px;
border: 1px solid #000;
text-align: left;
background: white;
}
.totals-table {
width: 100%;
border-collapse: collapse;
font-size: 10px;
margin-bottom: 12px;
}
.totals-table td {
padding: 4px;
border: 1px solid #000;
}
.bank-details {
display: grid;
grid-template-columns: 1fr 1fr;
padding: 10px 8px;
border: 2px solid #2c3e50;
font-size: 9px;
gap: 10px;
background: #f8f9fa;
margin-top: 10px;
}
.bank-info h4 {
margin-bottom: 6px;
font-size: 10px;
color: #2c3e50;
border-bottom: 1px solid #2c3e50;
padding-bottom: 2px;
}
.bank-info div {
margin-bottom: 2px;
line-height: 1.1;
}
.payment-qr {
text-align: center;
}
.payment-qr img {
width: 120px;
height: 120px;
border: 2px solid #ddd;
padding: 5px;
background: white;
}
.invoice-footer {
margin-top: 10px;
text-align: center;
font-size: 8px;
color: #666;
}
.company-info-section {
background: white;
padding: 8px;
border: 1px solid #ddd;
border-radius: 3px;
margin-bottom: 8px;
}
.company-info-section h4 {
color: #2c3e50;
margin-bottom: 6px;
border-bottom: 1px solid #2c3e50;
padding-bottom: 2px;
text-align: center;
font-size: 9px;
}
.additional-info {
font-size: 9px;
color: #666;
margin-top: 2px;
font-style: italic;
}
@media print {
body { background: white; padding: 0; margin: 0; }
.invoice-preview { border: none; box-shadow: none; margin: 0; padding: 5mm; }
.modal-backdrop { display: none; }
.sticky { position: relative !important; }
@page { margin: 10mm; size: A4; }
}
</style>
</head>
<body>
<div class="invoice-preview">
${invoiceContent}
</div>
</body>
</html>`;

              // Write the content to the new window
              printWindow.document.write(printDocument);
              printWindow.document.close();

              // Wait for content to load, then print
              printWindow.onload = function() {
                printWindow.print();
                // Close the window after printing
                printWindow.onafterprint = function() {
                  printWindow.close();
                };
              };
            },
            className: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'
          }, '🖨️ Print'),
          React.createElement('button', {
            onClick: closeForm,
            className: 'text-gray-400 hover:text-gray-600 text-2xl'
          }, '✕')
        )
      ),

      // Enhanced GST Invoice Preview Content
      React.createElement('div', { className: 'invoice-preview p-6' },
        // Header with logo
        React.createElement('div', { className: 'invoice-header-row' },
          React.createElement('div', { style: { textAlign: 'left' } },
            React.createElement('div', { className: 'company-logo' },
              React.createElement('img', {
                src: 'images/logo.png',
                alt: 'FanToPark Logo',
                style: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }
              })
            )
          ),
          React.createElement('div', { style: { textAlign: 'center' }},
            // Empty space for balance
          ),
          React.createElement('div', { className: 'invoice-title' }, 'Tax Invoice')
        ),

        // Invoice Meta Information
        React.createElement('div', { className: 'invoice-meta' },
          React.createElement('div', null,
            React.createElement('div', null, 
              React.createElement('strong', null, 'Date:'), ' ',
              new Date(invoice.invoice_date || invoice.created_date || Date.now()).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })
            ),
            React.createElement('div', null, 
              React.createElement('strong', null, 'Invoice No:'), ' ', invoice.invoice_number
            ),
            React.createElement('div', null, 
              React.createElement('strong', null, 'POS:'), ' ', invoice.indian_state || 'Haryana'
            )
          ),
          React.createElement('div', { style: { textAlign: 'right' }},
            React.createElement('div', null, 
              React.createElement('strong', null, 'Transaction Type:'), ' ', invoice.category_of_sale
            ),
            React.createElement('div', null, 
              React.createElement('strong', null, 'Sale Type:'), ' ', invoice.type_of_sale,
              invoice.type_of_sale === 'Service Fee' && 
                React.createElement('span', { style: { fontSize: '8px', color: '#dc2626', marginLeft: '4px' }}, '(18% GST)')
            )
          )
        ),

        // Customer Section
        React.createElement('div', { className: 'customer-section' },
          React.createElement('div', { className: 'customer-title' }, 
            'Customer Name: ', invoice.legal_name || invoice.client_name
          ),
          React.createElement('div', null, 
            React.createElement('strong', null, 'Address:'), ' ', invoice.registered_address
          ),
          React.createElement('div', null, 
            React.createElement('strong', null, 'GSTIN:'), ' ', invoice.gstin || 'N/A',
            ' | ',
            React.createElement('strong', null, 'PAN:'), ' ', invoice.pan || 'N/A'
          )
        ),

        // Enhanced Items Table with Multi-Row Support and Additional Info
        React.createElement('table', { className: 'invoice-table' },
          React.createElement('thead', null,
            React.createElement('tr', null,
              React.createElement('th', null, 'Particulars'),
              React.createElement('th', { style: { textAlign: 'center' }}, 'Qty.'),
              React.createElement('th', { style: { textAlign: 'center' }}, 'Rate (INR)'),
              React.createElement('th', { style: { textAlign: 'right' }}, 'Value (INR)')
            )
          ),
          React.createElement('tbody', null,
            // Enhanced: Multiple invoice items with additional info support
            invoice.invoice_items?.map((item, index) =>
              React.createElement('tr', { key: index },
                React.createElement('td', null, 
                  React.createElement('div', null,
                    // Main description
                    React.createElement('div', null, item.description),
                    // NEW: Additional info in brackets (like your example)
                    item.additional_info && 
                      React.createElement('div', { 
                        className: 'additional-info',
                        style: { fontSize: '9px', color: '#666', marginTop: '2px', fontStyle: 'italic' } 
                      }, '(' + item.additional_info + ')')
                  )
                ),
                React.createElement('td', { style: { textAlign: 'center' }}, item.quantity),
                React.createElement('td', { style: { textAlign: 'center' }}, formatCurrency(item.rate)),
                React.createElement('td', { style: { textAlign: 'right' }}, formatCurrency(item.quantity * item.rate))
              )
            ),
            // Service Charge row for Service Fee type (when base amount > 0)
            invoice.type_of_sale === 'Service Fee' && invoice.base_amount > 0 && React.createElement('tr', null,
              React.createElement('td', { colSpan: 3, style: { textAlign: 'right', fontWeight: 'bold' }}, 'Service Charge'),
              React.createElement('td', { style: { textAlign: 'right', fontWeight: 'bold' }}, formatCurrency(invoice.base_amount))
            )
          )
        ),

        // FIX 3: Enhanced Tax Table with better calculation handling
        React.createElement('table', { className: 'totals-table' },
          React.createElement('tr', null,
            React.createElement('td', { style: { width: '60%' }}),
            React.createElement('td', { style: { textAlign: 'center', fontWeight: 'bold', width: '20%' }}, 'Rate'),
            React.createElement('td', { style: { textAlign: 'right', fontWeight: 'bold', width: '20%' }}, `Value (${invoice.payment_currency || 'INR'})`)
          ),
          (() => {
            const taxRows = [];

            // FIX 4: GST Rows - ensure they show when GST is applicable
            if (calculation.gst.applicable && calculation.gst.total > 0) {
              if (isIntraState) {
                // CGST Row
                taxRows.push(
                  React.createElement('tr', { key: 'cgst' },
                    React.createElement('td', null, invoice.type_of_sale === 'Service Fee' ? 'CGST on Service Charge' : 'CGST'),
                    React.createElement('td', { style: { textAlign: 'center' }}, (calculation.gst.rate/2).toFixed(2) + '%'),
                    React.createElement('td', { style: { textAlign: 'right' }}, formatCurrency(calculation.gst.cgst))
                  )
                );
                // SGST Row
                taxRows.push(
                  React.createElement('tr', { key: 'sgst' },
                    React.createElement('td', null, invoice.type_of_sale === 'Service Fee' ? 'SGST on Service Charge' : 'SGST'),
                    React.createElement('td', { style: { textAlign: 'center' }}, (calculation.gst.rate/2).toFixed(2) + '%'),
                    React.createElement('td', { style: { textAlign: 'right' }}, formatCurrency(calculation.gst.sgst))
                  )
                );
              } else {
                // IGST Row
                taxRows.push(
                  React.createElement('tr', { key: 'igst' },
                    React.createElement('td', null, invoice.type_of_sale === 'Service Fee' ? 'IGST on Service Charge' : 'IGST'),
                    React.createElement('td', { style: { textAlign: 'center' }}, calculation.gst.rate.toFixed(2) + '%'),
                    React.createElement('td', { style: { textAlign: 'right' }}, formatCurrency(calculation.gst.igst))
                  )
                );
              }
            }

            // TCS Row - Use stored rate from invoice
            if (calculation.tcs.applicable && calculation.tcs.amount > 0) {
              taxRows.push(
                React.createElement('tr', { key: 'tcs' },
                  React.createElement('td', null, `TCS (${calculation.tcs.rate}%)`), // Show actual rate
                  React.createElement('td', { style: { textAlign: 'center' }}, calculation.tcs.rate.toFixed(2) + '%'),
                  React.createElement('td', { style: { textAlign: 'right' }}, formatCurrency(calculation.tcs.amount))
                )
              );
            } else {
              taxRows.push(
                React.createElement('tr', { key: 'tcs' },
                  React.createElement('td', null, 'TCS'),
                  React.createElement('td', { style: { textAlign: 'center' }}, '0.00%'),
                  React.createElement('td', { style: { textAlign: 'right' }}, '-')
                )
              );
            }

            // Grand Total Row
            taxRows.push(
              React.createElement('tr', { key: 'grand-total', style: { fontWeight: 'bold' }},
                React.createElement('td', null, 'Grand Total'),
                React.createElement('td', null),
                React.createElement('td', { style: { textAlign: 'right' }}, formatCurrency(calculation.finalAmount))
              )
            );

            // Round-off Row
            taxRows.push(
              React.createElement('tr', { key: 'round-off' },
                React.createElement('td', null, 'Round-off'),
                React.createElement('td', null),
                React.createElement('td', { style: { textAlign: 'right' }}, '-')
              )
            );

            // Final Invoice Value Row
            taxRows.push(
              React.createElement('tr', { key: 'invoice-value', style: { fontWeight: 'bold' }},
                React.createElement('td', null, 'Invoice Value'),
                React.createElement('td', null),
                React.createElement('td', { style: { textAlign: 'right' }}, formatCurrency(calculation.finalAmount))
              )
            );

            return taxRows;
          })()
        ),

        // Bank Details with QR Code (existing)
        React.createElement('div', { className: 'bank-details' },
          React.createElement('div', { className: 'bank-info' },
            React.createElement('h4', null, 'Payment Information'),
            React.createElement('div', null, React.createElement('strong', null, 'Bank Name:'), ' Kotak Mahindra Bank Ltd.'),
            React.createElement('div', null, React.createElement('strong', null, 'Account Name:'), ' F2P Sports Private Limited'),
            React.createElement('div', null, React.createElement('strong', null, 'Account Number:'), ' 3750501346'),
            React.createElement('div', null, React.createElement('strong', null, 'IFSC Code:'), ' KKBK0000298'),
            React.createElement('div', null, React.createElement('strong', null, 'Bank Address:'), ' Shop No. 2 & 3, Vatika Business Park, Sohna Road, Badshahpur, Gurgaon, 122002, Haryana, India')
          ),
          React.createElement('div', { className: 'bank-info', style: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }},
            React.createElement('h4', { style: { marginBottom: '10px' }}, 'Scan to Pay'),
            React.createElement('img', {
              src: 'images/qr.png',
              alt: 'Payment QR Code',
              style: { width: '120px', height: '120px', objectFit: 'contain', border: '1px solid #ddd' }
            }),
            React.createElement('div', { style: { marginTop: '5px', textAlign: 'center', fontSize: '8px' }}, 'Scan QR code for payment')
          )
        ),

        // Company Information Footer (existing)
        React.createElement('div', { className: 'invoice-footer' },
          React.createElement('div', { className: 'company-info-section', style: { background: 'white', padding: '8px', border: '1px solid #ddd', borderRadius: '3px', marginBottom: '8px' } },
            React.createElement('h4', { style: { color: '#2c3e50', marginBottom: '6px', borderBottom: '1px solid #2c3e50', paddingBottom: '2px', textAlign: 'center', fontSize: '9px' }}, 'F2P SPORTS PRIVATE LIMITED'),
            React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }},
              React.createElement('div', { style: { fontSize: '8px', lineHeight: '1.1' }},
                React.createElement('div', null, React.createElement('strong', null, 'Regd. Office:'), ' D 104, Pioneer Urban Square, Sector 62, Gurgaon 122102, Haryana, India'),
                React.createElement('div', { style: { marginTop: '3px' }}, React.createElement('strong', null, 'Email:'), ' sales@fantopark.com'),
                React.createElement('div', null, React.createElement('strong', null, 'Mobile:'), ' +91 9934463729')
              ),
              React.createElement('div', { style: { fontSize: '8px', lineHeight: '1.1' }},
                React.createElement('div', null, React.createElement('strong', null, 'CIN:'), ' U52291HR2024PTC127089'),
                React.createElement('div', null, React.createElement('strong', null, 'GST:'), ' 06AAGCF1773L1ZE'),
                React.createElement('div', null, React.createElement('strong', null, 'PAN:'), ' AAGCF1773L'),
                React.createElement('div', null, React.createElement('strong', null, 'HSN Code:'), ' 998554'),
                React.createElement('div', null, React.createElement('strong', null, 'UDYAM Reg. No.:'), ' UDYAM-HR-05-0130233'),
                React.createElement('div', null, React.createElement('strong', null, 'Category:'), ' Micro')
              )
            )
          ),
          React.createElement('div', { style: { textAlign: 'center', borderTop: '1px solid #2c3e50', paddingTop: '4px' }},
            React.createElement('p', { style: { fontWeight: 'bold', marginBottom: '2px', fontSize: '9px' }}, 'Thank you for your business!'),
            React.createElement('p', { style: { fontSize: '8px' }}, 'For any queries, please contact us at sales@fantopark.com')
          )
        )
      )
    )
  );
};

console.log('✅ GST Invoice Preview component loaded successfully');
