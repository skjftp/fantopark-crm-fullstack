// Currency Ticker Component for FanToPark CRM - Full Version

// Initialize state in window
window.currencyTickerState = {
  showConverter: false,
  rates: {
    USD: 83.50,
    EUR: 90.20,
    GBP: 105.50,
    AED: 22.75,
    SGD: 61.80
  },
  conversionAmount: 1000,
  fromCurrency: 'USD',
  loading: false,
  lastUpdate: null
};

window.renderCurrencyTicker = () => {
  const state = window.currencyTickerState;
  
  const toggleConverter = () => {
    window.currencyTickerState.showConverter = !window.currencyTickerState.showConverter;
    if (window.forceUpdate) window.forceUpdate();
  };

  const updateAmount = (value) => {
    window.currencyTickerState.conversionAmount = parseFloat(value) || 0;
    if (window.forceUpdate) window.forceUpdate();
  };

  const updateCurrency = (value) => {
    window.currencyTickerState.fromCurrency = value;
    if (window.forceUpdate) window.forceUpdate();
  };

  const fetchRates = async () => {
    window.currencyTickerState.loading = true;
    if (window.forceUpdate) window.forceUpdate();
    
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/INR');
      const data = await response.json();
      
      // Convert to INR rates
      window.currencyTickerState.rates = {
        USD: Math.round(1 / data.rates.USD * 100) / 100,
        EUR: Math.round(1 / data.rates.EUR * 100) / 100,
        GBP: Math.round(1 / data.rates.GBP * 100) / 100,
        AED: Math.round(1 / data.rates.AED * 100) / 100,
        SGD: Math.round(1 / data.rates.SGD * 100) / 100
      };
      window.currencyTickerState.lastUpdate = new Date();
      window.currentExchangeRates = window.currencyTickerState.rates;
    } catch (error) {
      console.error('Failed to fetch rates:', error);
    }
    
    window.currencyTickerState.loading = false;
    if (window.forceUpdate) window.forceUpdate();
  };

  // Fetch rates on first load if not already done
  if (!state.lastUpdate && !state.loading) {
    fetchRates();
  }

  const currencySymbols = {
    USD: '🇺🇸 $',
    EUR: '🇪🇺 €',
    GBP: '🇬🇧 £',
    AED: '🇦🇪 د.إ',
    SGD: '🇸🇬 S$'
  };

  const convertedAmount = state.conversionAmount * state.rates[state.fromCurrency];

  return React.createElement('div', { className: 'relative' },
    // Main ticker display
    React.createElement('div', { 
      className: 'flex items-center gap-3 text-sm cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors',
      onClick: toggleConverter,
      title: 'Click to open currency converter'
    },
      React.createElement('span', { className: 'text-gray-500' }, '💱'),
      state.loading ? 
        React.createElement('span', { className: 'text-gray-400' }, 'Loading rates...') :
        React.createElement('div', { className: 'flex items-center gap-3' },
          Object.entries(state.rates).slice(0, 3).map(([currency, rate]) =>
            React.createElement('div', { 
              key: currency,
              className: 'flex items-center gap-1'
            },
              React.createElement('span', { className: 'text-gray-600 text-xs' }, 
                currency + ':'
              ),
              React.createElement('span', { className: 'font-medium text-gray-800' }, 
                '₹' + rate.toFixed(2)
              )
            )
          )
        )
    ),
    
    // Converter dropdown
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
          className: 'text-gray-400 hover:text-gray-600 p-1'
        }, '✕')
      ),
      
      // Converter form
      React.createElement('div', { className: 'space-y-3' },
        // From currency
        React.createElement('div', { className: 'flex gap-2' },
          React.createElement('select', {
            value: state.fromCurrency,
            onChange: (e) => updateCurrency(e.target.value),
            className: 'flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
          },
            Object.keys(state.rates).map(currency =>
              React.createElement('option', { key: currency, value: currency }, 
                currencySymbols[currency] + ' ' + currency
              )
            )
          ),
          React.createElement('input', {
            type: 'number',
            value: state.conversionAmount,
            onChange: (e) => updateAmount(e.target.value),
            className: 'w-32 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
            placeholder: 'Amount'
          })
        ),
        
        // Arrow
        React.createElement('div', { className: 'text-center text-gray-400' }, '↓'),
        
        // To INR
        React.createElement('div', { className: 'bg-gray-50 p-3 rounded-md' },
          React.createElement('div', { className: 'text-sm text-gray-600 mb-1' }, 'Indian Rupees'),
          React.createElement('div', { className: 'text-xl font-semibold text-gray-800' }, 
            '₹' + convertedAmount.toLocaleString('en-IN', { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2 
            })
          )
        ),
        
        // Exchange rate info
        React.createElement('div', { className: 'text-xs text-gray-500 text-center pt-2' },
          '1 ' + state.fromCurrency + ' = ₹' + state.rates[state.fromCurrency].toFixed(2)
        ),
        
        // Last update and refresh
        React.createElement('div', { className: 'flex justify-between items-center pt-2 border-t' },
          state.lastUpdate ? 
            React.createElement('span', { className: 'text-xs text-gray-500' },
              'Updated: ' + state.lastUpdate.toLocaleTimeString()
            ) : 
            React.createElement('span', { className: 'text-xs text-gray-500' }, 'Using default rates'),
          React.createElement('button', {
            onClick: (e) => {
              e.stopPropagation();
              fetchRates();
            },
            className: 'text-xs text-blue-600 hover:text-blue-800',
            disabled: state.loading
          }, state.loading ? 'Loading...' : 'Refresh Rates')
        )
      )
    ) : null
  );
};

// Helper function to convert any currency to INR
window.convertToINR = (amount, currency) => {
  if (currency === 'INR') return amount;
  
  const rates = window.currencyTickerState.rates;
  return amount * (rates[currency] || 83.50);
};

// Set up global exchange rates
window.currentExchangeRates = window.currencyTickerState.rates;

console.log('✅ Currency Ticker component loaded successfully');
