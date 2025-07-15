// Currency Ticker Component for FanToPark CRM - No Hooks Version

// Initialize state in window
window.currencyTickerState = {
  showConverter: false,
  rates: {
    USD: 83.50,
    EUR: 90.20,
    GBP: 105.50,
    AED: 22.75,
    SGD: 61.80
  }
};

window.renderCurrencyTicker = () => {
  const state = window.currencyTickerState;
  
  const toggleConverter = () => {
    window.currencyTickerState.showConverter = !window.currencyTickerState.showConverter;
    // Force re-render of the main app
    if (window.forceUpdate) window.forceUpdate();
  };

  return React.createElement('div', { className: 'relative' },
    // Main ticker display
    React.createElement('div', { 
      className: 'flex items-center gap-3 text-sm cursor-pointer hover:bg-gray-100 px-2 py-1 rounded',
      onClick: toggleConverter
    },
      React.createElement('span', null, '💱'),
      React.createElement('span', null, 'USD: ₹' + state.rates.USD),
      React.createElement('span', null, '|'),
      React.createElement('span', null, 'EUR: ₹' + state.rates.EUR),
      React.createElement('span', null, '|'),
      React.createElement('span', null, 'GBP: ₹' + state.rates.GBP)
    ),
    
    // Dropdown
    state.showConverter ? React.createElement('div', {
      className: 'absolute top-8 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 w-80'
    },
      React.createElement('div', { className: 'flex justify-between items-center mb-3' },
        React.createElement('h3', { className: 'font-semibold text-gray-800' }, 'Currency Converter'),
        React.createElement('button', {
          onClick: (e) => {
            e.stopPropagation();
            toggleConverter();
          },
          className: 'text-gray-400 hover:text-gray-600'
        }, '✕')
      ),
      React.createElement('p', null, 'Converter functionality coming soon...')
    ) : null
  );
};

// Set up global exchange rates
window.currentExchangeRates = window.currencyTickerState.rates;

console.log('✅ Currency Ticker component loaded successfully');
