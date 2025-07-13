// =============================================================================
// FIXED GST INVOICE PREVIEW - Updated to match the PDF format exactly
// =============================================================================
// This component shows the invoice in the exact format as shown in the PDF

// GST Invoice Preview Component for FanToPark CRM
window.renderGSTInvoicePreview = () => {
  console.log('🧾 Rendering GST Invoice Preview');

  // Extract state from app state with better fallbacks
  const appState = window.appState || {};
  const {
    showInvoicePreview = false,
    currentInvoice = null,
    setCurrentInvoice = () => {},
    setShowInvoicePreview = () => {},
    closeForm = () => {}
  } = appState;

  // Also check window global state as fallback
  const invoice = currentInvoice || window.currentInvoice;
  const showModal = showInvoicePreview || window.showInvoicePreview;

  console.log('📊 Invoice preview state:', {
    showInvoicePreview: showModal,
    hasInvoice: !!invoice,
    invoiceNumber: invoice?.invoice_number
  });

  if (!showModal || !invoice) {
    console.log('❌ Not showing invoice preview - missing data');
    return null;
  }

  // Calculate amounts and determine tax structure
  const isIntraState = invoice.indian_state === 'Haryana' && !invoice.is_outside_india;
  
  // Calculate base amount
  const baseAmount = invoice.base_amount || 
    (invoice.invoice_items?.reduce((sum, item) => sum + ((item.quantity || 1) * (item.rate || 0)), 0)) ||
    invoice.final_amount || 
    0;

  // Get GST calculation or create default
  const gstCalculation = invoice.gst_calculation || {
    applicable: false,
    rate: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    total: 0
  };

  // Get TCS calculation or create default
  const tcsCalculation = invoice.tcs_calculation || {
    applicable: false,
    rate: 0,
    amount: 0
  };

  // Calculate final amount
  const finalAmount = invoice.final_amount || 
    (baseAmount + gstCalculation.total + tcsCalculation.amount);

  console.log('💰 Invoice calculations:', {
    baseAmount,
    gstCalculation,
    tcsCalculation,
    finalAmount,
    isIntraState
  });

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: (e) => {
      if (e.target === e.currentTarget) {
        console.log('🚪 Closing invoice preview');
        setShowInvoicePreview(false);
        setCurrentInvoice(null);
        if (window.setShowInvoicePreview) window.setShowInvoicePreview(false);
        if (window.setCurrentInvoice) window.setCurrentInvoice(null);
      }
    }
  },
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[95vh] overflow-y-auto' },
      // Header with action buttons
      React.createElement('div', { className: 'sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center action-buttons' },
        React.createElement('h2', { className: 'text-2xl font-bold text-gray-900' }, 
          'GST Invoice: ' + (invoice.invoice_number || 'Draft')
        ),
        React.createElement('div', { className: 'flex space-x-2' },
          React.createElement('button', {
            onClick: () => {
              window.print();
            },
            className: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'
          }, '🖨️ Print'),
          React.createElement('button', {
            onClick: () => {
              console.log('🚪 Closing invoice preview via X button');
              setShowInvoicePreview(false);
              setCurrentInvoice(null);
              if (window.setShowInvoicePreview) window.setShowInvoicePreview(false);
              if (window.setCurrentInvoice) window.setCurrentInvoice(null);
            },
            className: 'bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700'
          }, '✕ Close')
        )
      ),
      
      // Invoice content with proper styling
      React.createElement('div', { className: 'p-6' },
        React.createElement('style', null, `
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
            padding: 10px;
          }
          .company-footer {
            margin-top: 12px;
            border-top: 2px solid #2c3e50;
            padding: 8px;
            background: #f8f9fa;
            font-size: 8px;
            line-height: 1.1;
          }
          @media print {
            .action-buttons {
              display: none !important;
            }
            .invoice-preview {
              border: none;
              margin: 0;
              padding: 0;
            }
          }
        `),
        
        // Main invoice content - exactly matching the PDF format
        React.createElement('div', { className: 'invoice-preview' },
          // Header with logo and title
          React.createElement('div', { className: 'invoice-header-row' },
            React.createElement('div', { className: 'company-logo' },
              React.createElement('img', {
                src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjEwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIxMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRkZGRkZGIi8+Cjx0ZXh0IHg9IjEwNSIgeT0iNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9ImJvbGQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiMyQzNFNTAiPkZhblRvUGFyazwvdGV4dD4KPHN2ZyB4PSI3NSIgeT0iNTAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxjaXJjbGUgY3g9IjE1IiBjeT0iMTUiIHI9IjEwIiBmaWxsPSIjRkY2QjM1Ii8+CjxjaXJjbGUgY3g9IjQ1IiBjeT0iMTUiIHI9IjEwIiBmaWxsPSIjNDBCODgzIi8+CjxjaXJjbGUgY3g9IjE1IiBjeT0iNDUiIHI9IjEwIiBmaWxsPSIjMzc0MEZGIi8+CjxjaXJjbGUgY3g9IjQ1IiBjeT0iNDUiIHI9IjEwIiBmaWxsPSIjRkY0MDU2Ii8+Cjwvc3ZnPgo8dGV4dCB4PSIxMDUiIHk9IjEzMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjY2NjY2Ij5Zb3VyIFNwb3J0cyBQYXNzaW9uLCBPdXIgRXhwZXJ0aXNlPC90ZXh0Pgo8L3N2Zz4=',
                alt: 'FanToPark Logo',
                style: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }
              })
            ),
            React.createElement('div', null),
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
                React.createElement('strong', null, 'Transaction Type:'), ' ', invoice.category_of_sale || 'Corporate'
              ),
              React.createElement('div', null, 
                React.createElement('strong', null, 'Sale Type:'), ' ', invoice.type_of_sale || 'Tour'
              )
            )
          ),

          // Customer Section
          React.createElement('div', { className: 'customer-section' },
            React.createElement('div', { className: 'customer-title' }, 
              'Customer Name: ', invoice.legal_name || invoice.client_name || 'N/A'
            ),
            React.createElement('div', null, 
              React.createElement('strong', null, 'Address:'), ' ', invoice.registered_address || 'N/A'
            ),
            React.createElement('div', null, 
              React.createElement('strong', null, 'GSTIN:'), ' ', invoice.gstin || 'N/A',
              ' | ',
              React.createElement('strong', null, 'PAN:'), ' ', invoice.pan || 'N/A'
            )
          ),

          // Items Table - matching PDF format exactly
          React.createElement('table', { className: 'invoice-table' },
            React.createElement('thead', null,
              React.createElement('tr', null,
                React.createElement('th', null, 'Particulars'),
                React.createElement('th', { style: { textAlign: 'center' }}, 'Qty.'),
                React.createElement('th', { style: { textAlign: 'right' }}, 'Rate (INR)'),
                React.createElement('th', { style: { textAlign: 'right' }}, 'Value (INR)')
              )
            ),
            React.createElement('tbody', null,
              // Main items
              (invoice.invoice_items || []).map((item, index) =>
                React.createElement('tr', { key: index },
                  React.createElement('td', null, item.description || 'Service'),
                  React.createElement('td', { style: { textAlign: 'center' }}, item.quantity || 1),
                  React.createElement('td', { style: { textAlign: 'right' }}, 
                    window.formatCurrency ? window.formatCurrency(item.rate || 0).replace('₹', '') : (item.rate || 0).toFixed(2)
                  ),
                  React.createElement('td', { style: { textAlign: 'right' }}, 
                    window.formatCurrency ? window.formatCurrency((item.quantity || 1) * (item.rate || 0)).replace('₹', '') : 
                    ((item.quantity || 1) * (item.rate || 0)).toFixed(2)
                  )
                )
              )
            )
          ),

          // Tax calculation table - matching PDF format
          React.createElement('table', { className: 'totals-table' },
            React.createElement('tbody', null,
              // GST rows
              gstCalculation.applicable && isIntraState && [
                React.createElement('tr', { key: 'cgst' },
                  React.createElement('td', { style: { width: '70%' }}, 'CGST'),
                  React.createElement('td', { style: { textAlign: 'center', width: '15%' }}, gstCalculation.rate ? `${(gstCalculation.rate / 2).toFixed(2)}%` : '2.50%'),
                  React.createElement('td', { style: { textAlign: 'right', width: '15%' }}, 
                    window.formatCurrency ? window.formatCurrency(gstCalculation.cgst || 0).replace('₹', '') : (gstCalculation.cgst || 0).toFixed(2)
                  )
                ),
                React.createElement('tr', { key: 'sgst' },
                  React.createElement('td', null, 'SGST'),
                  React.createElement('td', { style: { textAlign: 'center' }}, gstCalculation.rate ? `${(gstCalculation.rate / 2).toFixed(2)}%` : '2.50%'),
                  React.createElement('td', { style: { textAlign: 'right' }}, 
                    window.formatCurrency ? window.formatCurrency(gstCalculation.sgst || 0).replace('₹', '') : (gstCalculation.sgst || 0).toFixed(2)
                  )
                )
              ],
              
              gstCalculation.applicable && !isIntraState && React.createElement('tr', { key: 'igst' },
                React.createElement('td', null, 'IGST'),
                React.createElement('td', { style: { textAlign: 'center' }}, `${(gstCalculation.rate || 0).toFixed(2)}%`),
                React.createElement('td', { style: { textAlign: 'right' }}, 
                  window.formatCurrency ? window.formatCurrency(gstCalculation.igst || 0).replace('₹', '') : (gstCalculation.igst || 0).toFixed(2)
                )
              ),

              // TCS row
              tcsCalculation.applicable && React.createElement('tr', { key: 'tcs' },
                React.createElement('td', null, 'TCS'),
                React.createElement('td', { style: { textAlign: 'center' }}, `${(tcsCalculation.rate || 0).toFixed(2)}%`),
                React.createElement('td', { style: { textAlign: 'right' }}, 
                  window.formatCurrency ? window.formatCurrency(tcsCalculation.amount || 0).replace('₹', '') : (tcsCalculation.amount || 0).toFixed(2)
                )
              ),

              // Grand Total
              React.createElement('tr', { key: 'grand-total', style: { fontWeight: 'bold' }},
                React.createElement('td', null, 'Grand Total'),
                React.createElement('td', null),
                React.createElement('td', { style: { textAlign: 'right' }}, 
                  window.formatCurrency ? window.formatCurrency(finalAmount).replace('₹', '') : finalAmount.toFixed(2)
                )
              ),

              // Round-off
              React.createElement('tr', { key: 'round-off' },
                React.createElement('td', null, 'Round-off'),
                React.createElement('td', null),
                React.createElement('td', { style: { textAlign: 'right' }}, '-')
              ),

              // Invoice Value
              React.createElement('tr', { key: 'invoice-value', style: { fontWeight: 'bold' }},
                React.createElement('td', null, 'Invoice Value'),
                React.createElement('td', null),
                React.createElement('td', { style: { textAlign: 'right' }}, 
                  window.formatCurrency ? window.formatCurrency(finalAmount).replace('₹', '') : finalAmount.toFixed(2)
                )
              )
            )
          ),

          // Payment Information and QR Code
          React.createElement('div', { className: 'bank-details' },
            React.createElement('div', { className: 'bank-info' },
              React.createElement('h4', null, 'Payment Information'),
              React.createElement('div', null, React.createElement('strong', null, 'Bank Name:'), ' Kotak Mahindra Bank Ltd.'),
              React.createElement('div', null, React.createElement('strong', null, 'Account Name:'), ' F2P Sports Private Limited'),
              React.createElement('div', null, React.createElement('strong', null, 'Account Number:'), ' 3750501346'),
              React.createElement('div', null, React.createElement('strong', null, 'IFSC Code:'), ' KKBK0000298'),
              React.createElement('div', null, React.createElement('strong', null, 'Bank Address:'), ' Shop No. 2 & 3, Vatika Business Park, Sohna Road, Badshahpur, Gurgaon, 122002, Haryana, India')
            ),
            React.createElement('div', { className: 'payment-qr' },
              React.createElement('h4', null, 'Scan to Pay'),
              React.createElement('div', { style: { 
                width: '80px', 
                height: '80px', 
                border: '1px solid #000', 
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px'
              }}, 'QR Code'),
              React.createElement('div', { style: { fontSize: '8px', marginTop: '4px' }}, 'Scan QR code for payment')
            )
          ),

          // Company Footer
          React.createElement('div', { className: 'company-footer' },
            React.createElement('div', { style: { textAlign: 'center', fontWeight: 'bold', marginBottom: '6px' }}, 'F2P SPORTS PRIVATE LIMITED'),
            React.createElement('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }},
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
            ),
            React.createElement('div', { style: { textAlign: 'center', borderTop: '1px solid #2c3e50', paddingTop: '4px', marginTop: '6px' }},
              React.createElement('p', { style: { fontWeight: 'bold', marginBottom: '2px', fontSize: '9px' }}, 'Thank you for your business!'),
              React.createElement('p', { style: { fontSize: '8px' }}, 'For any queries, please contact us at sales@fantopark.com')
            )
          )
        )
      )
    )
  );
};

// Make sure the function is properly exposed
window.openInvoicePreview = (invoice) => {
  console.log('🔍 Opening invoice preview for:', invoice);
  
  if (window.setCurrentInvoice && window.setShowInvoicePreview) {
    window.setCurrentInvoice(invoice);
    window.setShowInvoicePreview(true);
  } else {
    // Fallback: set directly on window
    window.currentInvoice = invoice;
    window.showInvoicePreview = true;
    
    // Force re-render if available
    if (window.forceRender) {
      window.forceRender();
    }
  }
};

console.log('✅ Fixed GST Invoice Preview component loaded with correct PDF format!');
