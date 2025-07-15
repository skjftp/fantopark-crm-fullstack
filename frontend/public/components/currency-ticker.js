// Currency Ticker Component for FanToPark CRM - Fixed Width Version

// Initialize state in window
window.currencyTickerState = {
  showConverter: false,
  rates: {
    USD: 83.50,
    EUR: 90.20,
    GBP: 105.50,
    AED: 22.75,
    SGD: 61.80,
    JPY: 0.56,
    CHF: 91.20,
    CAD: 61.50
  },
  previousRates: {
    USD: 83.45,
    EUR: 90.10,
    GBP: 105.30,
    AED: 22.75,
    SGD: 61.75,
    JPY: 0.55,
    CHF: 91.10,
    CAD: 61.60
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
      
      // Store previous rates
      window.currencyTickerState.previousRates = { ...window.currencyTickerState.rates };
      
      // Convert to INR rates
      window.currencyTickerState.rates = {
        USD: Math.round(1 / data.rates.USD * 100) / 100,
        EUR: Math.round(1 / data.rates.EUR * 100) / 100,
        GBP: Math.round(1 / data.rates.GBP * 100) / 100,
        AED: Math.round(1 / data.rates.AED * 100) / 100,
        SGD: Math.round(1 / data.rates.SGD * 100) / 100,
        JPY: Math.round(1 / data.rates.JPY * 100) / 100,
        CHF: Math.round(1 / data.rates.CHF * 100) / 100,
        CAD: Math.round(1 / data.rates.CAD * 100) / 100
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

  const getChangePercent = (currency) => {
    const current = state.rates[currency];
    const previous = state.previousRates[currency];
    return ((current - previous) / previous * 100).toFixed(2);
  };

  const getChangeColor = (currency) => {
    const change = getChangePercent(currency);
    return change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-gray-500';
  };

  const getArrow = (currency) => {
    const change = getChangePercent(currency);
    return change > 0 ? '▲' : change < 0 ? '▼' : '—';
  };

  const convertedAmount = state.conversionAmount * state.rates[state.fromCurrency];

  // Create ticker items for scrolling - only show most important currencies
  const mainCurrencies = ['USD', 'EUR', 'GBP', 'AED'];
  const tickerItems = mainCurrencies.map((currency) => {
    const rate = state.rates[currency];
    const change = getChangePercent(currency);
    const color = getChangeColor(currency);
    const arrow = getArrow(currency);
    
    return React.createElement('div', {
      key: currency,
      className: 'flex items-center gap-1 px-3 border-r border-gray-700 whitespace-nowrap'
    },
      React.createElement('span', { className: 'font-bold text-gray-300 text-xs' }, currency),
      React.createElement('span', { className: 'font-mono text-white text-sm' }, '₹' + rate.toFixed(2)),
      React.createElement('span', { className: color + ' font-mono text-xs flex items-center gap-0.5' },
        arrow,
        Math.abs(change) + '%'
      )
    );
  });

  return React.createElement('div', { className: 'relative max-w-xl' }, // Added max-width constraint
    // Wall Street Style Ticker
    React.createElement('div', { 
      className: 'bg-gray-900 text-white overflow-hidden cursor-pointer rounded-lg border border-gray-700 h-8 flex items-center', // Fixed height
      onClick: toggleConverter,
      title: 'Click to open currency converter'
    },
      React.createElement('div', { className: 'flex items-center h-full' },
        // Live indicator
        React.createElement('div', { className: 'bg-red-600 px-2 h-full flex items-center gap-1 border-r border-gray-700' },
          React.createElement('div', { className: 'w-1.5 h-1.5 bg-white rounded-full animate-pulse' }),
          React.createElement('span', { className: 'text-xs font-bold' }, 'LIVE')
        ),
        
        // Scrolling ticker content with fixed width
        React.createElement('div', { 
          className: 'flex-1 overflow-hidden max-w-md' // Added max-width to prevent overflow
        },
          React.createElement('div', { 
            className: 'flex animate-scroll',
            style: {
              animation: 'scroll 20s linear infinite',
              whiteSpace: 'nowrap'
            }
          },
            // Double the items for seamless scrolling
            tickerItems,
            tickerItems
          )
        ),
        
        // Converter button
        React.createElement('div', { className: 'bg-gray-800 px-2 h-full flex items-center border-l border-gray-700 hover:bg-gray-700' },
          React.createElement('svg', {
            className: 'w-3 h-3',
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24'
          },
            React.createElement('path', {
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              strokeWidth: 2,
              d: 'M3 10h18M3 14h18m-9-4v8m0-8l3 3m-3-3l-3 3'
            })
          )
        )
      )
    ),
    
    // Add CSS for scrolling animation
    React.createElement('style', null, `
      @keyframes scroll {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      .animate-scroll:hover {
        animation-play-state: paused;
      }
    `),
    
    // Converter dropdown
    state.showConverter ? React.createElement('div', {
      className: 'absolute top-10 right-0 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-5 z-50 w-96 text-white'
    },
      React.createElement('div', { className: 'flex justify-between items-center mb-4' },
        React.createElement('h3', { className: 'text-lg font-bold flex items-center gap-2' }, 
          React.createElement('span', { className: 'text-green-500' }, '💹'),
          'Currency Converter'
        ),
        React.createElement('button', {
          onClick: (e) => {
            e.stopPropagation();
            toggleConverter();
          },
          className: 'text-gray-400 hover:text-white transition-colors'
        }, '✕')
      ),
      
      // Converter form
      React.createElement('div', { className: 'space-y-4' },
        // From currency
        React.createElement('div', null,
          React.createElement('label', { className: 'text-xs font-medium text-gray-400 mb-1 block uppercase' }, 'From'),
          React.createElement('div', { className: 'flex gap-2' },
            React.createElement('select', {
              value: state.fromCurrency,
              onChange: (e) => updateCurrency(e.target.value),
              className: 'flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
            },
              Object.keys(state.rates).map(currency =>
                React.createElement('option', { key: currency, value: currency }, currency)
              )
            ),
            React.createElement('input', {
              type: 'number',
              value: state.conversionAmount,
              onChange: (e) => updateAmount(e.target.value),
              className: 'w-32 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500'
            })
          )
        ),
        
        // To INR
        React.createElement('div', null,
          React.createElement('label', { className: 'text-xs font-medium text-gray-400 mb-1 block uppercase' }, 'To INR'),
          React.createElement('div', { className: 'px-3 py-2 bg-gray-700 rounded text-2xl font-mono text-green-400' },
            '₹' + convertedAmount.toFixed(2)
          )
        ),
        
        // Exchange rate display
        React.createElement('div', { className: 'text-xs text-gray-400 border-t border-gray-700 pt-3' },
          React.createElement('p', null, 
            '1 ' + state.fromCurrency + ' = ₹' + state.rates[state.fromCurrency].toFixed(2)
          ),
          React.createElement('p', { className: 'mt-1' }, 
            state.lastUpdate ? 
              'Last updated: ' + state.lastUpdate.toLocaleTimeString() : 
              'Using cached rates'
          ),
          React.createElement('button', {
            onClick: (e) => {
              e.stopPropagation();
              fetchRates();
            },
            className: 'text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors mt-2',
            disabled: state.loading
          }, state.loading ? 'Updating...' : 'Refresh')
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
