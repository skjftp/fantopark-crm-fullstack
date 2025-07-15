// Add this function to your global window object or component file
// This can go in a new file: frontend/public/components/exchange-impact-preview.js

window.renderExchangeImpactPreview = (formData, existingRecord, recordType = 'payable') => {
  // Only show for foreign currency when marking as paid
  if (!existingRecord || 
      existingRecord.currency === 'INR' || 
      formData.status !== 'paid' || 
      existingRecord.status === 'paid') {
    return null;
  }
  
  // Get current exchange rates (from your currency ticker or API)
  const currentRates = window.currentExchangeRates || {
    USD: 86.00,
    EUR: 93.00,
    GBP: 108.00,
    AED: 23.50
  };
  
  const creationRate = existingRecord.creation_exchange_rate || existingRecord.exchange_rate;
  const currentRate = formData.exchange_rate || currentRates[existingRecord.currency] || creationRate;
  
  if (!creationRate || !currentRate) return null;
  
  const originalAmount = existingRecord.original_amount || existingRecord.totalPurchaseAmount || existingRecord.expected_amount;
  const originalINR = originalAmount * creationRate;
  const currentINR = originalAmount * currentRate;
  const difference = currentINR - originalINR;
  
  // For receivables, positive difference is gain; for payables, it's loss
  const impactType = recordType === 'receivable' 
    ? (difference > 0 ? 'gain' : 'loss')
    : (difference > 0 ? 'loss' : 'gain');
  
  return React.createElement('div', { 
    className: `mt-4 p-4 rounded-lg border ${impactType === 'gain' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`
  },
    React.createElement('h4', { className: 'font-semibold mb-2 flex items-center' }, 
      '💱 Exchange Rate Impact'
    ),
    React.createElement('div', { className: 'grid grid-cols-2 gap-2 text-sm' },
      React.createElement('div', null, 
        React.createElement('span', { className: 'text-gray-600' }, 'Created at: '),
        `₹${creationRate.toFixed(2)} = ₹${originalINR.toFixed(2)}`
      ),
      React.createElement('div', null, 
        React.createElement('span', { className: 'text-gray-600' }, 
          recordType === 'receivable' ? 'Receiving at: ' : 'Paying at: '
        ),
        `₹${currentRate.toFixed(2)} = ₹${currentINR.toFixed(2)}`
      ),
      React.createElement('div', { className: 'col-span-2 mt-2 font-semibold text-lg' },
        `Exchange ${impactType === 'gain' ? 'Gain' : 'Loss'}: ₹${Math.abs(difference).toFixed(2)}`
      )
    ),
    React.createElement('p', { className: 'text-xs text-gray-600 mt-2' },
      'This difference will be recorded in your financial reports'
    )
  );
};
