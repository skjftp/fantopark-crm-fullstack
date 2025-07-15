// Create a new file: frontend/public/components/payment-history-modal.js

// Payment History Modal Component
window.PaymentHistoryModal = function() {
  const [showModal, setShowModal] = React.useState(false);
  const [payableData, setPayableData] = React.useState(null);
  
  // Expose function globally to be called from other components
  React.useEffect(() => {
    window.showPaymentHistoryModal = (payable) => {
      setPayableData(payable);
      setShowModal(true);
    };
  }, []);
  
  if (!showModal || !payableData) return null;
  
  // Calculate totals
  const paymentHistory = payableData.payment_history || [];
  const originalAmount = payableData.original_amount || payableData.amount || 0;
  const currency = payableData.original_currency || payableData.currency || 'INR';
  
  let totalPaidForeign = 0;
  let totalPaidINR = 0;
  let totalFxImpact = 0;
  
  paymentHistory.forEach(payment => {
    totalPaidForeign += payment.amount_foreign || 0;
    totalPaidINR += payment.amount_inr || 0;
    totalFxImpact += payment.fx_difference || 0;
  });
  
  const remainingAmount = originalAmount - totalPaidForeign;
  
  return React.createElement('div', {
    className: 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50',
    onClick: () => setShowModal(false)
  },
    React.createElement('div', {
      className: 'relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white dark:bg-gray-800',
      onClick: (e) => e.stopPropagation()
    },
      // Header
      React.createElement('div', { className: 'flex justify-between items-center mb-4' },
        React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 dark:text-white' }, 
          'Payment History'
        ),
        React.createElement('button', {
          onClick: () => setShowModal(false),
          className: 'text-gray-400 hover:text-gray-500'
        }, '✕')
      ),
      
      // Payable Info
      React.createElement('div', { className: 'bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4' },
        React.createElement('div', { className: 'grid grid-cols-2 gap-4 text-sm' },
          React.createElement('div', {},
            React.createElement('span', { className: 'text-gray-500 dark:text-gray-400' }, 'Supplier: '),
            React.createElement('span', { className: 'font-medium text-gray-900 dark:text-white' }, 
              payableData.supplierName || payableData.supplier_name || 'N/A'
            )
          ),
          React.createElement('div', {},
            React.createElement('span', { className: 'text-gray-500 dark:text-gray-400' }, 'Event: '),
            React.createElement('span', { className: 'font-medium text-gray-900 dark:text-white' }, 
              payableData.event_name || payableData.eventName || 'N/A'
            )
          ),
          React.createElement('div', {},
            React.createElement('span', { className: 'text-gray-500 dark:text-gray-400' }, 'Original Amount: '),
            React.createElement('span', { className: 'font-medium text-gray-900 dark:text-white' }, 
              `${currency} ${originalAmount.toLocaleString()}`
            )
          ),
          React.createElement('div', {},
            React.createElement('span', { className: 'text-gray-500 dark:text-gray-400' }, 'Status: '),
            React.createElement('span', {
              className: `inline-flex px-2 py-1 text-xs rounded-full ${
                payableData.status === 'paid' ? 'bg-green-100 text-green-800' :
                payableData.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`
            }, payableData.status || 'pending')
          )
        )
      ),
      
      // Payment History Table
      React.createElement('div', { className: 'mb-4' },
        React.createElement('h4', { className: 'text-md font-medium text-gray-900 dark:text-white mb-2' }, 
          'Payment Transactions'
        ),
        paymentHistory.length === 0 ? 
          React.createElement('p', { className: 'text-gray-500 dark:text-gray-400 text-sm' }, 
            'No payments recorded yet.'
          ) :
          React.createElement('div', { className: 'overflow-x-auto' },
            React.createElement('table', { className: 'min-w-full divide-y divide-gray-200 dark:divide-gray-600' },
              React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-700' },
                React.createElement('tr', {},
                  React.createElement('th', { className: 'px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase text-left' }, 
                    'Date'
                  ),
                  React.createElement('th', { className: 'px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase text-left' }, 
                    'Amount'
                  ),
                  React.createElement('th', { className: 'px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase text-left' }, 
                    'Exchange Rate'
                  ),
                  React.createElement('th', { className: 'px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase text-left' }, 
                    'INR Value'
                  ),
                  React.createElement('th', { className: 'px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase text-left' }, 
                    'FX Impact'
                  ),
                  React.createElement('th', { className: 'px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase text-left' }, 
                    'Reference'
                  )
                )
              ),
              React.createElement('tbody', { className: 'bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600' },
                paymentHistory.map((payment, index) =>
                  React.createElement('tr', { key: payment.payment_id || index },
                    React.createElement('td', { className: 'px-4 py-2 text-sm text-gray-900 dark:text-white' }, 
                      new Date(payment.date).toLocaleDateString()
                    ),
                    React.createElement('td', { className: 'px-4 py-2 text-sm text-gray-900 dark:text-white' }, 
                      `${payment.currency || currency} ${(payment.amount_foreign || 0).toFixed(2)}`
                    ),
                    React.createElement('td', { className: 'px-4 py-2 text-sm text-gray-900 dark:text-white' }, 
                      currency !== 'INR' ? `₹${(payment.exchange_rate || 1).toFixed(2)}` : 'N/A'
                    ),
                    React.createElement('td', { className: 'px-4 py-2 text-sm text-gray-900 dark:text-white' }, 
                      `₹${(payment.amount_inr || 0).toLocaleString()}`
                    ),
                    React.createElement('td', { className: 'px-4 py-2 text-sm' }, 
                      payment.fx_difference && payment.fx_difference !== 0 ?
                        React.createElement('span', {
                          className: payment.fx_type === 'gain' ? 'text-green-600' : 'text-red-600'
                        }, `${payment.fx_type === 'gain' ? '+' : '-'}₹${Math.abs(payment.fx_difference).toFixed(2)}`) :
                        React.createElement('span', { className: 'text-gray-400' }, 'N/A')
                    ),
                    React.createElement('td', { className: 'px-4 py-2 text-sm text-gray-500 dark:text-gray-400' }, 
                      payment.reference || payment.notes || 'N/A'
                    )
                  )
                )
              )
            )
          )
      ),
      
      // Summary Section
      React.createElement('div', { className: 'bg-blue-50 dark:bg-blue-900 p-4 rounded-lg' },
        React.createElement('h4', { className: 'text-md font-medium text-gray-900 dark:text-white mb-2' }, 
          'Payment Summary'
        ),
        React.createElement('div', { className: 'grid grid-cols-2 gap-4 text-sm' },
          React.createElement('div', {},
            React.createElement('span', { className: 'text-gray-600 dark:text-gray-300' }, 'Total Paid: '),
            React.createElement('span', { className: 'font-semibold text-gray-900 dark:text-white' }, 
              `${currency} ${totalPaidForeign.toFixed(2)} (₹${totalPaidINR.toLocaleString()})`
            )
          ),
          React.createElement('div', {},
            React.createElement('span', { className: 'text-gray-600 dark:text-gray-300' }, 'Remaining: '),
            React.createElement('span', { 
              className: `font-semibold ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`
            }, 
              `${currency} ${remainingAmount.toFixed(2)}`
            )
          ),
          totalFxImpact !== 0 && React.createElement('div', { className: 'col-span-2' },
            React.createElement('span', { className: 'text-gray-600 dark:text-gray-300' }, 'Total FX Impact: '),
            React.createElement('span', { 
              className: `font-semibold ${totalFxImpact > 0 ? 'text-red-600' : 'text-green-600'}`
            }, 
              `${totalFxImpact > 0 ? 'Loss' : 'Gain'} ₹${Math.abs(totalFxImpact).toFixed(2)}`
            )
          )
        )
      ),
      
      // Close Button
      React.createElement('div', { className: 'mt-4 flex justify-end' },
        React.createElement('button', {
          onClick: () => setShowModal(false),
          className: 'px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors'
        }, 'Close')
      )
    )
  );
};

// Replace the old showPaymentHistory function
window.showPaymentHistory = function(payable) {
  if (!payable.payment_history || payable.payment_history.length === 0) {
    alert('No payment history available for this payable.');
    return;
  }
  
  // Use the new modal
  if (window.showPaymentHistoryModal) {
    window.showPaymentHistoryModal(payable);
  } else {
    // Fallback to alert if modal not loaded
    console.error('Payment history modal not loaded');
    alert('Payment history modal is not available. Please refresh the page.');
  }
};

console.log('✅ Payment History Modal component loaded');
