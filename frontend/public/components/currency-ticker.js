// Currency Ticker Component for FanToPark CRM
// Shows live currency rates and allows quick conversion
// Uses exchangerate-api.com for free currency data

window.renderCurrencyTicker = () => {
  const [rates, setRates] = React.useState({
    USD: 83.50,
    EUR: 90.20,
    GBP: 105.50,
    AED: 22.75,
    SGD: 61.80
  });
  const [loading, setLoading] = React.useState(true);
  const [lastUpdate, setLastUpdate] = React.useState(null);
  const [showConverter, setShowConverter] = React.useState(false);
  const [conversionAmount, setConversionAmount] = React.useState(1000);
  const [fromCurrency, setFromCurrency] = React.useState('USD');

  // Fetch currency rates
  const fetchCurrencyRates = async () => {
    try {
      setLoading(true);
      // Using exchangerate-api.com free tier
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/INR');
      const data = await response.json();
      
      // Convert to INR rates (API gives rates FROM INR, we need TO INR)
      const inrRates = {
        USD: Math.round(1 / data.rates.USD * 100) / 100,
        EUR: Math.round(1 / data.rates.EUR * 100) / 100,
        GBP: Math.round(1 / data.rates.GBP * 100) / 100,
        AED: Math.round(1 / data.rates.AED * 100) / 100,
        SGD: Math.round(1 / data.rates.SGD * 100) / 100
      };
      
      setRates(inrRates);
      setLastUpdate(new Date());
      
      // Store rates globally for use in forms
      window.currentExchangeRates = inrRates;
      
    } catch (error) {
      console.error('Failed to fetch currency rates:', error);
      // Use default rates if API fails
      setLoading(false);
    }
    setLoading(false);
  };

  // Fetch rates on mount and every 30 minutes
  React.useEffect(() => {
    fetchCurrencyRates();
    const interval = setInterval(fetchCurrencyRates, 30 * 60 * 1000); // 30 minutes
    return () => clearInterval(interval);
  }, []);

  // Format currency display
  const formatRate = (rate) => {
    return '₹' + rate.toFixed(2);
  };

  // Currency flags/symbols
  const currencySymbols = {
    USD: '🇺🇸 $',
    EUR: '🇪🇺 €',
    GBP: '🇬🇧 £',
    AED: '🇦🇪 د.إ',
    SGD: '🇸🇬 S$'
  };

  return React.createElement('div', { className: 'relative' },
    // Main ticker display
    React.createElement('div', { 
      className: 'flex items-center gap-3 text-sm cursor-pointer',
      onClick: () => setShowConverter(!showConverter)
    },
      // Currency icon
      React.createElement('div', { className: 'text-gray-500' },
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
            d: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
          })
        )
      ),
      
      // Ticker content
      loading ? 
        React.createElement('span', { className: 'text-gray-400' }, 'Loading rates...') :
        React.createElement('div', { className: 'flex items-center gap-4 overflow-x-auto max-w-md' },
          Object.entries(rates).map(([currency, rate]) =>
            React.createElement('div', { 
              key: currency,
              className: 'flex items-center gap-1 whitespace-nowrap'
            },
              React.createElement('span', { className: 'text-gray-600' }, currencySymbols[currency]),
              React.createElement('span', { className: 'font-medium text-gray-800' }, formatRate(rate))
            )
          )
        )
    ),

    // Converter dropdown
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
      
      // Converter form
      React.createElement('div', { className: 'space-y-3' },
        // From currency
        React.createElement('div', { className: 'flex gap-2' },
          React.createElement('select', {
            value: fromCurrency,
            onChange: (e) => setFromCurrency(e.target.value),
            className: 'flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm'
          },
            Object.keys(rates).map(currency =>
              React.createElement('option', { key: currency, value: currency }, 
                currencySymbols[currency] + ' ' + currency
              )
            )
          ),
          React.createElement('input', {
            type: 'number',
            value: conversionAmount,
            onChange: (e) => setConversionAmount(parseFloat(e.target.value) || 0),
            className: 'w-32 px-3 py-2 border border-gray-300 rounded-md text-sm',
            placeholder: 'Amount'
          })
        ),
        
        // Arrow
        React.createElement('div', { className: 'text-center text-gray-400' }, '↓'),
        
        // To INR
        React.createElement('div', { className: 'bg-gray-50 p-3 rounded-md' },
          React.createElement('div', { className: 'text-sm text-gray-600 mb-1' }, 'Indian Rupees'),
          React.createElement('div', { className: 'text-xl font-semibold text-gray-800' }, 
            '₹' + (conversionAmount * rates[fromCurrency]).toLocaleString('en-IN', { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2 
            })
          )
        ),
        
        // Last update
        lastUpdate && React.createElement('div', { className: 'text-xs text-gray-500 text-center pt-2 border-t' },
          'Rates updated: ' + lastUpdate.toLocaleTimeString()
        ),
        
        // Refresh button
        React.createElement('button', {
          onClick: fetchCurrencyRates,
          className: 'w-full text-xs text-blue-600 hover:text-blue-800'
        }, 'Refresh Rates')
      )
    )
  );
};

// Helper function to convert any currency to INR
window.convertToINR = (amount, currency) => {
  if (currency === 'INR') return amount;
  
  const rates = window.currentExchangeRates || {
    USD: 83.50,
    EUR: 90.20,
    GBP: 105.50,
    AED: 22.75,
    SGD: 61.80
  };
  
  return amount * (rates[currency] || 83.50); // Default to USD rate if currency not found
};

console.log('✅ Currency Ticker component loaded successfully');
