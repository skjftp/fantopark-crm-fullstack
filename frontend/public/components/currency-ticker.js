// Currency Ticker Component for FanToPark CRM - Enhanced Design

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
    USD: '🇺🇸',
    EUR: '🇪🇺',
    GBP: '🇬🇧',
    AED: '🇦🇪',
    SGD: '🇸🇬'
  };

  const currencyColors = {
    USD: 'bg-green-100 text-green-800 border-green-300',
    EUR: 'bg-blue-100 text-blue-800 border-blue-300',
    GBP: 'bg-purple-100 text-purple-800 border-purple-300'
  };

  const convertedAmount = state.conversionAmount * state.rates[state.fromCurrency];

  return React.createElement('div', { className: 'relative' },
    // Main ticker display - Enhanced styling
    React.createElement('div', { 
      className: 'flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1.5 rounded-lg cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 border border-blue-200',
      onClick: toggleConverter,
      title: 'Click to open currency converter'
    },
      // Currency icon with animation
      React.createElement('div', { 
        className: 'text-blue-600 animate-pulse' 
      }, '💱'),
      
      state.loading ? 
        React.createElement('span', { className: 'text-blue-600 font-medium text-sm' }, 'Loading rates...') :
        React.createElement('div', { className: 'flex items-center gap-3' },
          Object.entries(state.rates).slice(0, 3).map(([currency, rate]) =>
            React.createElement('div', { 
              key: currency,
              className: 'flex items-center gap-1.5 px-2 py-0.5 rounded-md ' + (currencyColors[currency] || 'bg-gray-100 text-gray-800 border-gray-300') + ' border'
            },
              React.createElement('span', { className: 'text-sm' }, 
                currencySymbols[currency]
              ),
              React.createElement('span', { className: 'font-semibold text-sm' }, 
                '₹' + rate.toFixed(2)
              )
            )
          )
        ),
      
      // Dropdown indicator
      React.createElement('svg', {
        className: 'w-4 h-4 text-blue-600 ml-1',
        fill: 'none',
        stroke: 'currentColor',
        viewBox: '0 0 24 24'
      },
        React.createElement('path', {
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: 2,
          d: state.showConverter ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'
        })
      )
    ),
    
    // Converter dropdown - Enhanced design
    state.showConverter ? React.createElement('div', {
      className: 'absolute top-10 right-0 bg-white border-2 border-blue-200 rounded-lg shadow-xl p-5 z-50 w-96'
    },
      React.createElement('div', { className: 'flex justify-between items-center mb-4' },
        React.createElement('h3', { className: 'text-lg font-bold text-gray-800' }, '💱 Currency Converter'),
        React.createElement('button', {
          onClick: (e) => {
            e.stopPropagation();
            toggleConverter();
          },
          className: 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors'
        }, 
          React.createElement('svg', {
            className: 'w-5 h-5',
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24'
          },
            React.createElement('path', {
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              strokeWidth: 2,
              d: 'M6 18L18 6M6 6l12 12'
            })
          )
        )
      ),
      
      // Converter form
      React.createElement('div', { className: 'space-y-4' },
        // From currency
        React.createElement('div', null,
          React.createElement('label', { className: 'text-sm font-medium text-gray-700 mb-1 block' }, 'From Currency'),
          React.createElement('div', { className: 'flex gap-2' },
            React.createElement('select', {
              value: state.fromCurrency,
              onChange: (e) => updateCurrency(e.target.value),
              className: 'flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium'
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
              className: 'w-32 px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium',
              placeholder: 'Amount'
            })
          )
        ),
        
        // Visual arrow
        React.createElement('div', { className: 'flex justify-center' },
          React.createElement('div', { className: 'bg-blue-100 rounded-full p-2' },
            React.createElement('svg', {
              className: 'w-5 h-5 text-blue-600',
              fill: 'none',
              stroke: 'currentColor',
              viewBox: '0 0 24 24'
            },
              React.createElement('path', {
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                strokeWidth: 2,
                d: 'M19 14l-7 7m0 0l-7-7m7 7V3'
              })
            )
          )
        ),
        
        // To INR - Enhanced result display
        React.createElement('div', { className: 'bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-200' },
          React.createElement('div', { className: 'text-sm font-medium text-gray-600 mb-1' }, 'Indian Rupees'),
          React.createElement('div', { className: 'text-2xl font-bold text-green-700' }, 
            '₹' + convertedAmount.toLocaleString('en-IN', { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2 
            })
          ),
          React.createElement('div', { className: 'text-xs text-green-600 mt-1' },
            '1 ' + state.fromCurrency + ' = ₹' + state.rates[state.fromCurrency].toFixed(2)
          )
        ),
        
        // Footer with last update and refresh
        React.createElement('div', { className: 'flex justify-between items-center pt-3 border-t border-gray-200' },
          state.lastUpdate ? 
            React.createElement('span', { className: 'text-xs text-gray-500' },
              '🕐 Updated: ' + state.lastUpdate.toLocaleTimeString()
            ) : 
            React.createElement('span', { className: 'text-xs text-gray-500' }, '📊 Using default rates'),
          React.createElement('button', {
            onClick: (e) => {
              e.stopPropagation();
              fetchRates();
            },
            className: 'text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors font-medium',
            disabled: state.loading
          }, state.loading ? 'Refreshing...' : '🔄 Refresh Rates')
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
