// Currency Ticker Component for FanToPark CRM - No Hooks Version

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
  previousRates: null,
  conversionAmount: 1000,
  fromCurrency: 'USD',
  loading: false,
  lastUpdate: null,
  error: null,
  updateInterval: null,
  initialized: false
};

// Currency configuration
window.CURRENCY_CONFIG = {
  API_URL: 'https://api.exchangerate-api.com/v4/latest/INR',
  UPDATE_INTERVAL: 30 * 60 * 1000, // 30 minutes
  CACHE_KEY: 'fantopark_currency_rates',
  CACHE_DURATION: 60 * 60 * 1000, // 1 hour
  MAIN_CURRENCIES: ['USD', 'EUR', 'GBP', 'AED'],
  ALL_CURRENCIES: ['USD', 'EUR', 'GBP', 'AED', 'SGD', 'JPY', 'CHF', 'CAD']
};

// Currency service
window.CurrencyService = {
  getCachedRates: function() {
    try {
      const cached = localStorage.getItem(window.CURRENCY_CONFIG.CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        const age = Date.now() - data.timestamp;
        if (age < window.CURRENCY_CONFIG.CACHE_DURATION) {
          return data;
        }
      }
    } catch (error) {
      console.error('Error reading cache:', error);
    }
    return null;
  },

  cacheRates: function(rates, timestamp) {
    try {
      localStorage.setItem(window.CURRENCY_CONFIG.CACHE_KEY, JSON.stringify({
        rates: rates,
        timestamp: timestamp,
        date: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  },

  saveDailyRates: function(rates) {
    const today = new Date().toDateString();
    const lastSaveDate = localStorage.getItem('fantopark_rates_date');
    
    if (lastSaveDate !== today) {
      localStorage.setItem('fantopark_daily_rates', JSON.stringify(rates));
      localStorage.setItem('fantopark_rates_date', today);
      return true;
    }
    return false;
  },

  getPreviousDayRates: function() {
    try {
      const stored = localStorage.getItem('fantopark_daily_rates');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  }
};

// Fetch rates function
window.fetchCurrencyRates = async function() {
  window.currencyTickerState.loading = true;
  window.currencyTickerState.error = null;
  if (window.forceUpdate) window.forceUpdate();
  
  try {
    // Check cache first
    const cached = window.CurrencyService.getCachedRates();
    if (cached && !window.currencyTickerState.showConverter) {
      window.currencyTickerState.rates = cached.rates;
      window.currencyTickerState.lastUpdate = new Date(cached.timestamp);
      window.currencyTickerState.loading = false;
      if (window.forceUpdate) window.forceUpdate();
      return;
    }

    const response = await fetch(window.CURRENCY_CONFIG.API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.rates) {
      throw new Error('Invalid API response');
    }
    
    // Get previous rates
    const previousRates = window.currencyTickerState.previousRates || 
                         window.CurrencyService.getPreviousDayRates() || 
                         window.currencyTickerState.rates;
    
    // Convert to INR rates
    const newRates = {};
    window.CURRENCY_CONFIG.ALL_CURRENCIES.forEach(currency => {
      if (data.rates[currency]) {
        newRates[currency] = Math.round(1 / data.rates[currency] * 100) / 100;
      }
    });
    
    const timestamp = Date.now();
    
    // Cache the rates
    window.CurrencyService.cacheRates(newRates, timestamp);
    
    // Save daily rates
    if (window.CurrencyService.saveDailyRates(newRates)) {
      window.currencyTickerState.previousRates = window.currencyTickerState.rates;
    } else if (!window.currencyTickerState.previousRates) {
      window.currencyTickerState.previousRates = previousRates;
    }
    
    // Update state
    window.currencyTickerState.rates = newRates;
    window.currencyTickerState.lastUpdate = new Date(timestamp);
    window.currencyTickerState.loading = false;
    window.currencyTickerState.error = null;
    
    // Update global rates
    window.currentExchangeRates = newRates;
    
  } catch (error) {
    console.error('Failed to fetch rates:', error);
    window.currencyTickerState.loading = false;
    window.currencyTickerState.error = 'Failed to update rates. Using cached values.';
    
    // Try cached rates
    const cached = window.CurrencyService.getCachedRates();
    if (cached) {
      window.currencyTickerState.rates = cached.rates;
      window.currencyTickerState.lastUpdate = new Date(cached.timestamp);
    }
  }

  // Add this to your fetchCurrencyRates function after updating rates
const oldUSD = window.currencyTickerState.rates.USD;
const newUSD = newRates.USD;

if (oldUSD !== newUSD) {
  console.log(`USD rate changed: ${oldUSD} → ${newUSD} (${newUSD > oldUSD ? '+' : ''}${(newUSD - oldUSD).toFixed(2)})`);
} else {
  console.log('USD rate unchanged at:', newUSD);
}
  
  if (window.forceUpdate) window.forceUpdate();
};

// Initialize rates
window.initializeCurrencyTicker = function() {
  if (window.currencyTickerState.initialized) return;
  
  window.currencyTickerState.initialized = true;
  
  // Load cached rates
  const cached = window.CurrencyService.getCachedRates();
  if (cached) {
    window.currencyTickerState.rates = cached.rates;
    window.currencyTickerState.lastUpdate = new Date(cached.timestamp);
  }
  
  // Set previous rates
  if (!window.currencyTickerState.previousRates) {
    const dailyRates = window.CurrencyService.getPreviousDayRates();
    if (dailyRates) {
      window.currencyTickerState.previousRates = dailyRates;
    }
  }
  
  // Fetch fresh rates
  window.fetchCurrencyRates();
  
  // Set up auto-refresh
  if (window.currencyTickerState.updateInterval) {
    clearInterval(window.currencyTickerState.updateInterval);
  }
  window.currencyTickerState.updateInterval = setInterval(
    window.fetchCurrencyRates, 
    window.CURRENCY_CONFIG.UPDATE_INTERVAL
  );
};

// Main render function
window.renderCurrencyTicker = () => {
  const state = window.currencyTickerState;
  
  // Initialize on first render
  if (!state.initialized) {
    window.initializeCurrencyTicker();
  }
  
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

  const getChangePercent = (currency) => {
    if (!state.previousRates || !state.previousRates[currency]) return 0;
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

  // Create ticker items
  const tickerItems = window.CURRENCY_CONFIG.MAIN_CURRENCIES.map((currency) => {
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

  return React.createElement('div', { className: 'relative max-w-xl' },
    // Wall Street Style Ticker
    React.createElement('div', { 
      className: 'bg-gray-900 text-white overflow-hidden cursor-pointer rounded-lg border border-gray-700 h-8 flex items-center',
      onClick: toggleConverter,
      title: 'Click to open currency converter'
    },
      React.createElement('div', { className: 'flex items-center h-full' },
        // Live indicator
        React.createElement('div', { className: 'bg-red-600 px-2 h-full flex items-center gap-1 border-r border-gray-700' },
          React.createElement('div', { 
            className: `w-1.5 h-1.5 rounded-full ${state.loading ? 'bg-white animate-pulse' : 'bg-white'}` 
          }),
          React.createElement('span', { className: 'text-xs font-bold' }, 
            state.loading ? 'UPDATING' : 'LIVE'
          )
        ),
        
        // Scrolling ticker
        React.createElement('div', { className: 'flex-1 overflow-hidden max-w-md' },
          React.createElement('div', { 
            className: 'flex animate-scroll',
            style: {
              animation: 'scroll 20s linear infinite',
              whiteSpace: 'nowrap'
            }
          },
            tickerItems,
            tickerItems
          )
        ),
        
        // Converter button
        React.createElement('div', { 
          className: 'bg-gray-800 px-2 h-full flex items-center border-l border-gray-700 hover:bg-gray-700 transition-colors' 
        },
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
    
    // CSS
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
      className: 'absolute top-10 right-0 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-5 z-50 w-96 text-white',
      onClick: (e) => e.stopPropagation()
    },
      React.createElement('div', { className: 'flex justify-between items-center mb-4' },
        React.createElement('h3', { className: 'text-lg font-bold flex items-center gap-2' }, 
          React.createElement('span', { className: 'text-green-500' }, '💹'),
          'Currency Converter'
        ),
        React.createElement('button', {
          onClick: toggleConverter,
          className: 'text-gray-400 hover:text-white transition-colors text-xl'
        }, '✕')
      ),
      
      // Error message
      state.error ? React.createElement('div', {
        className: 'bg-red-900 border border-red-700 text-red-300 px-3 py-2 rounded text-sm mb-4'
      }, state.error) : null,
      
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
              window.CURRENCY_CONFIG.ALL_CURRENCIES.map(currency =>
                React.createElement('option', { key: currency, value: currency }, currency)
              )
            ),
            React.createElement('input', {
              type: 'number',
              value: state.conversionAmount,
              onChange: (e) => updateAmount(e.target.value),
              className: 'w-32 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500',
              min: '0',
              step: '0.01'
            })
          )
        ),
        
        // To INR
        React.createElement('div', null,
          React.createElement('label', { className: 'text-xs font-medium text-gray-400 mb-1 block uppercase' }, 'To INR'),
          React.createElement('div', { className: 'px-3 py-2 bg-gray-700 rounded text-2xl font-mono text-green-400' },
            '₹' + convertedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          )
        ),
        
        // Exchange rate info
        React.createElement('div', { className: 'text-xs text-gray-400 border-t border-gray-700 pt-3 space-y-1' },
          React.createElement('p', null, 
            '1 ' + state.fromCurrency + ' = ₹' + state.rates[state.fromCurrency].toFixed(2)
          ),
          React.createElement('p', null, 
            'Change: ',
            React.createElement('span', { className: getChangeColor(state.fromCurrency) },
              getArrow(state.fromCurrency) + ' ' + Math.abs(getChangePercent(state.fromCurrency)) + '%'
            )
          ),
          React.createElement('p', null, 
            state.lastUpdate ? 
              'Updated: ' + state.lastUpdate.toLocaleTimeString() : 
              'Using cached rates'
          ),
          React.createElement('div', { className: 'flex gap-2 mt-2' },
            React.createElement('button', {
              onClick: () => {
                window.fetchCurrencyRates();
              },
              className: 'text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors disabled:opacity-50',
              disabled: state.loading
            }, state.loading ? 'Updating...' : 'Refresh Rates'),
            React.createElement('button', {
              onClick: toggleConverter,
              className: 'text-xs bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-600 transition-colors'
            }, 'Close')
          )
        )
      )
    ) : null
  );
};

// Helper functions
window.convertToINR = (amount, currency) => {
  if (!amount || currency === 'INR') return amount;
  
  const rates = window.currencyTickerState.rates;
  const rate = rates[currency] || 83.50;
  return amount * rate;
};

window.formatCurrencyAmount = (amount, currency = 'INR') => {
  if (currency === 'INR') {
    return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return amount.toLocaleString('en-US', { 
    style: 'currency', 
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Initialize global exchange rates
window.currentExchangeRates = window.currencyTickerState.rates;

// Cleanup function
window.cleanupCurrencyTicker = function() {
  if (window.currencyTickerState.updateInterval) {
    clearInterval(window.currencyTickerState.updateInterval);
    window.currencyTickerState.updateInterval = null;
  }
};

console.log('✅ Currency Ticker component loaded successfully (No Hooks Version)');
