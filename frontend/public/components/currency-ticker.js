// Currency Ticker Component for FanToPark CRM - Step 1: Click functionality

window.renderCurrencyTicker = () => {
  const [showConverter, setShowConverter] = React.useState(false);
  
  // Static rates for now
  const rates = {
    USD: 83.50,
    EUR: 90.20,
    GBP: 105.50,
    AED: 22.75,
    SGD: 61.80
  };

  return React.createElement('div', { className: 'relative' },
    // Main ticker display
    React.createElement('div', { 
      className: 'flex items-center gap-3 text-sm cursor-pointer hover:bg-gray-100 px-2 py-1 rounded',
      onClick: () => setShowConverter(!showConverter)
    },
      React.createElement('span', null, '💱'),
      React.createElement('span', null, 'USD: ₹83.50'),
      React.createElement('span', null, '|'),
      React.createElement('span', null, 'EUR: ₹90.20'),
      React.createElement('span', null, '|'),
      React.createElement('span', null, 'GBP: ₹105.50')
    ),
    
    // Simple dropdown for testing
    showConverter && React.createElement('div', {
      className: 'absolute top-8 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 w-80'
    },
      React.createElement('div', { className: 'flex justify-between items-center mb-3' },
        React.createElement('h3', { className: 'font-semibold text-gray-800' }, 'Currency Converter'),
        React.createElement('button', {
          onClick: () => setShowConverter(false),
          className: 'text-gray-400 hover:text-gray-600'
        }, '✕')
      ),
      React.createElement('p', null, 'Converter coming soon...')
    )
  );
};

console.log('✅ Currency Ticker component loaded successfully');
