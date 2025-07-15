// Enhanced Financials UI Component with Currency Display
// This updates the financials tables to show original currency and INR values

// Enhanced Receivables Table with Currency Info
window.renderEnhancedReceivablesTable = () => {
  const { financialData, financialFilters } = window.appState || {};
  const receivables = financialData?.receivables || [];
  
  // Apply filters
  const filteredReceivables = receivables.filter(r => {
    if (financialFilters.clientName && !r.client_name.toLowerCase().includes(financialFilters.clientName.toLowerCase())) return false;
    if (financialFilters.assignedPerson && !r.assigned_to.toLowerCase().includes(financialFilters.assignedPerson.toLowerCase())) return false;
    if (financialFilters.status !== 'all' && r.status !== financialFilters.status) return false;
    return true;
  });
  
  return React.createElement('div', { className: 'overflow-x-auto' },
    React.createElement('table', { className: 'min-w-full divide-y divide-gray-200' },
      React.createElement('thead', { className: 'bg-gray-50' },
        React.createElement('tr', null,
          React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Client'),
          React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Invoice #'),
          React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Original Amount'),
          React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'INR Amount'),
          React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Due Date'),
          React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Assigned To'),
          React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Status'),
          React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Actions')
        )
      ),
      React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
        filteredReceivables.map((receivable, index) => {
          const isOverdue = new Date(receivable.due_date) < new Date() && receivable.status !== 'paid';
          const showCurrency = receivable.original_currency && receivable.original_currency !== 'INR';
          
          return React.createElement('tr', { 
            key: receivable.id || index,
            className: isOverdue ? 'bg-red-50' : ''
          },
            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900' }, 
              receivable.client_name
            ),
            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-500' }, 
              receivable.invoice_number
            ),
            // Original Amount with Currency
            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900' }, 
              showCurrency ? 
                `${receivable.original_currency} ${(receivable.original_amount || 0).toLocaleString()}` :
                '—'
            ),
            // INR Amount
            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900' }, 
              '₹ ' + (receivable.amount || 0).toLocaleString(),
              showCurrency && React.createElement('div', { className: 'text-xs text-gray-500' },
                `@ ${receivable.exchange_rate || 1}`
              )
            ),
            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-500' }, 
              new Date(receivable.due_date).toLocaleDateString()
            ),
            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-500' }, 
              receivable.assigned_to
            ),
            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
              React.createElement('span', { 
                className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  receivable.status === 'paid' ? 'bg-green-100 text-green-800' :
                  isOverdue ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`
              }, receivable.status)
            ),
            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm font-medium' },
              receivable.status !== 'paid' && React.createElement('button', {
                onClick: () => window.recordPayment(receivable.id),
                className: 'text-indigo-600 hover:text-indigo-900 mr-2'
              }, 'Record Payment'),
              React.createElement('button', {
                onClick: () => console.log('View details:', receivable),
                className: 'text-blue-600 hover:text-blue-900'
              }, 'View')
            )
          );
        })
      )
    )
  );
};

// Enhanced Payables Table with Currency Info
window.renderEnhancedPayablesTable = () => {
  const { financialData, financialFilters } = window.appState || {};
  const payables = financialData?.payables || [];
  
  // Apply filters
  const filteredPayables = payables.filter(p => {
    if (financialFilters.status !== 'all' && p.status !== financialFilters.status) return false;
    return true;
  });
  
  return React.createElement('div', { className: 'overflow-x-auto' },
    React.createElement('table', { className: 'min-w-full divide-y divide-gray-200' },
      React.createElement('thead', { className: 'bg-gray-50' },
        React.createElement('tr', null,
          React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Supplier'),
          React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Description'),
          React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Original Amount'),
          React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'INR Amount'),
          React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Due Date'),
          React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Status'),
          React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Actions')
        )
      ),
      React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
        filteredPayables.map((payable, index) => {
          const isOverdue = payable.due_date && new Date(payable.due_date) < new Date() && payable.status !== 'paid';
          const showCurrency = payable.original_currency && payable.original_currency !== 'INR';
          
          return React.createElement('tr', { 
            key: payable.id || index,
            className: isOverdue ? 'bg-red-50' : ''
          },
            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900' }, 
              payable.supplierName || payable.supplier_name || 'Unknown'
            ),
            React.createElement('td', { className: 'px-6 py-4 text-sm text-gray-500' }, 
              payable.description || payable.event_name || 'N/A'
            ),
            // Original Amount with Currency
            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900' }, 
              showCurrency ? 
                `${payable.original_currency} ${(payable.original_amount || 0).toLocaleString()}` :
                '—'
            ),
            // INR Amount
            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900' }, 
              '₹ ' + (payable.amount || 0).toLocaleString(),
              showCurrency && React.createElement('div', { className: 'text-xs text-gray-500' },
                `@ ${payable.exchange_rate || 1}`
              )
            ),
            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-500' }, 
              payable.due_date ? new Date(payable.due_date).toLocaleDateString() : 'N/A'
            ),
            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
              React.createElement('span', { 
                className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  payable.status === 'paid' ? 'bg-green-100 text-green-800' :
                  isOverdue ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`
              }, payable.status || 'pending')
            ),
            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm font-medium' },
              payable.status !== 'paid' && React.createElement('button', {
                onClick: () => window.markPayableAsPaid(payable.id),
                className: 'text-green-600 hover:text-green-900 mr-2'
              }, 'Mark Paid'),
              React.createElement('button', {
                onClick: () => console.log('View details:', payable),
                className: 'text-blue-600 hover:text-blue-900'
              }, 'View')
            )
          );
        })
      )
    )
  );
};

// Enhanced Active Sales Table with Currency Info
window.renderEnhancedActiveSalesTable = () => {
  const { financialData } = window.appState || {};
  const activeSales = financialData?.activeSales || [];
  
  return React.createElement('div', { className: 'overflow-x-auto' },
    React.createElement('table', { className: 'min-w-full divide-y divide-gray-200' },
      React.createElement('thead', { className: 'bg-gray-50' },
        React.createElement('tr', null,
          React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Event'),
          React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Client'),
          React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Original Amount'),
          React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'INR Amount'),
          React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Event Date'),
          React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Payment Status'),
          React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Actions')
        )
      ),
      React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
        activeSales.map((sale, index) => {
          const showCurrency = sale.original_currency && sale.original_currency !== 'INR';
          
          return React.createElement('tr', { key: sale.id || index },
            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900' }, 
              sale.event_name
            ),
            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-500' }, 
              sale.client_name
            ),
            // Original Amount with Currency
            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900' }, 
              showCurrency ? 
                `${sale.original_currency} ${(sale.original_amount || 0).toLocaleString()}` :
                '—'
            ),
            // INR Amount
            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900' }, 
              '₹ ' + (sale.amount || 0).toLocaleString(),
              showCurrency && React.createElement('div', { className: 'text-xs text-gray-500' },
                `@ ${sale.exchange_rate || 1}`
              )
            ),
            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-500' }, 
              sale.event_date ? new Date(sale.event_date).toLocaleDateString() : 'N/A'
            ),
            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
              React.createElement('span', { 
                className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  sale.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                  'bg-yellow-100 text-yellow-800'
                }`
              }, sale.payment_status || 'pending')
            ),
            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm font-medium' },
              React.createElement('button', {
                onClick: () => console.log('View sale:', sale),
                className: 'text-blue-600 hover:text-blue-900'
              }, 'View')
            )
          );
        })
      )
    )
  );
};

// Update the main financials render to use enhanced tables
window.updateFinancialsRenderForCurrency = () => {
  const originalRenderFinancials = window.renderFinancials;
  
  window.renderFinancials = () => {
    const { activeFinancialTab } = window.appState || {};
    
    // Replace table rendering based on active tab
    if (activeFinancialTab === 'receivables') {
      return window.renderEnhancedReceivablesTable();
    } else if (activeFinancialTab === 'payables') {
      return window.renderEnhancedPayablesTable();
    } else if (activeFinancialTab === 'sales') {
      return window.renderEnhancedActiveSalesTable();
    } else {
      // Fall back to original for other tabs
      return originalRenderFinancials ? originalRenderFinancials() : null;
    }
  };
};

// Initialize on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    window.updateFinancialsRenderForCurrency();
    console.log('✅ Enhanced Financials UI with currency display loaded');
  });
}
