// frontend/public/components/market-rate-tab.js

// Market Rate Tab Component for Inventory Detail
window.MarketRateTab = function({ inventory }) {
  const [marketData, setMarketData] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [searchName, setSearchName] = React.useState(inventory.event_name || '');
  const [alternativeName, setAlternativeName] = React.useState('');
  const [showAlternativeSearch, setShowAlternativeSearch] = React.useState(false);
  const [rateLimit, setRateLimit] = React.useState(null);

  // Fetch market rates
  const fetchMarketRates = React.useCallback(async (eventName, altName = null) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        eventName: eventName,
        ...(altName && { alternativeName: altName })
      });

      const response = await window.apiCall(
        `/market-rates/${inventory.id}?${params.toString()}`,
        { method: 'GET' }
      );

      if (response.success) {
        setMarketData(response.results);
        
        // Check if no results found
        const hasResults = response.results.some(r => r.found);
        if (!hasResults && !showAlternativeSearch) {
          setShowAlternativeSearch(true);
        }
      } else {
        throw new Error(response.error || 'Failed to fetch market rates');
      }

      // Fetch rate limit status
      const rateLimitResponse = await window.apiCall(
        '/market-rates/status/rate-limits?partner=xs2event',
        { method: 'GET' }
      );
      
      if (rateLimitResponse.success) {
        setRateLimit(rateLimitResponse.status);
      }

    } catch (err) {
      console.error('Error fetching market rates:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [inventory.id, showAlternativeSearch]);

  // Initial load
  React.useEffect(() => {
    if (inventory.event_name) {
      fetchMarketRates(inventory.event_name);
    }
  }, [inventory.event_name]);

  // Handle alternative search
  const handleAlternativeSearch = () => {
    if (alternativeName.trim()) {
      fetchMarketRates(searchName, alternativeName.trim());
      setShowAlternativeSearch(false);
    }
  };

  // Calculate price statistics
  const calculatePriceStats = (tickets) => {
    if (!tickets || tickets.length === 0) return null;
    
    const prices = tickets.map(t => t.price).filter(p => p > 0);
    if (prices.length === 0) return null;

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: prices.reduce((a, b) => a + b, 0) / prices.length,
      count: tickets.length
    };
  };

  return React.createElement('div', { className: 'p-4' },
    // Header with rate limit info
    React.createElement('div', { className: 'mb-4' },
      React.createElement('div', { className: 'flex justify-between items-center' },
        React.createElement('h3', { 
          className: 'text-lg font-semibold text-gray-900 dark:text-white' 
        }, '💹 Available Market Rates'),
        
        rateLimit && React.createElement('div', { 
          className: 'text-sm text-gray-500 dark:text-gray-400' 
        },
          `API Limit: ${rateLimit.used}/${rateLimit.limit} requests`,
          rateLimit.remaining < 10 && React.createElement('span', { 
            className: 'text-orange-500 ml-2' 
          }, '⚠️ Low quota')
        )
      )
    ),

    // Alternative search form
    showAlternativeSearch && React.createElement('div', { 
      className: 'mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg' 
    },
      React.createElement('p', { 
        className: 'text-sm text-yellow-800 dark:text-yellow-200 mb-2' 
      }, 'No results found. Try searching with an alternative name:'),
      
      React.createElement('div', { className: 'flex gap-2' },
        React.createElement('input', {
          type: 'text',
          value: alternativeName,
          onChange: (e) => setAlternativeName(e.target.value),
          placeholder: 'Alternative event name',
          className: 'flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white',
          onKeyPress: (e) => e.key === 'Enter' && handleAlternativeSearch()
        }),
        
        React.createElement('button', {
          onClick: handleAlternativeSearch,
          disabled: loading || !alternativeName.trim(),
          className: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
        }, 'Search')
      )
    ),

    // Loading state
    loading && React.createElement('div', { 
      className: 'flex items-center justify-center py-8' 
    },
      React.createElement('div', { className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600' })
    ),

    // Error state
    error && React.createElement('div', { 
      className: 'p-4 bg-red-50 dark:bg-red-900/20 rounded-lg mb-4' 
    },
      React.createElement('p', { className: 'text-red-600 dark:text-red-400' }, 
        '❌ ', error
      )
    ),

    // Results
    !loading && !error && marketData.map((partnerData, index) => {
      const stats = partnerData.found ? calculatePriceStats(partnerData.tickets) : null;

      return React.createElement('div', { 
        key: index,
        className: 'mb-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden' 
      },
        // Partner header
        React.createElement('div', { 
          className: 'bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700' 
        },
          React.createElement('div', { className: 'flex justify-between items-center' },
            React.createElement('h4', { className: 'font-medium text-gray-900 dark:text-white' }, 
              '🏪 ', PARTNER_CONFIGS[partnerData.partner]?.name || partnerData.partner
            ),
            
            partnerData.found && stats && React.createElement('div', { 
              className: 'text-sm text-gray-600 dark:text-gray-400' 
            },
              `${stats.count} tickets • `,
              React.createElement('span', { className: 'font-medium' }, 
                `₹${window.formatIndianNumber(Math.floor(stats.min))} - ₹${window.formatIndianNumber(Math.floor(stats.max))}`
              )
            )
          )
        ),

        // Content
        React.createElement('div', { className: 'p-4' },
          partnerData.error ? 
            // Error state
            React.createElement('p', { className: 'text-red-600 dark:text-red-400' }, 
              '❌ ', partnerData.error
            ) :
          
          !partnerData.found ?
            // Not found state
            React.createElement('p', { className: 'text-gray-500 dark:text-gray-400' }, 
              'No tickets found for this event'
            ) :
          
          // Tickets table
          React.createElement('div', { className: 'overflow-x-auto' },
            React.createElement('table', { className: 'min-w-full divide-y divide-gray-200 dark:divide-gray-700' },
              React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-800' },
                React.createElement('tr', null,
                  ['Category', 'Section', 'Row', 'Qty', 'Price', 'Seller', 'Delivery'].map(header =>
                    React.createElement('th', { 
                      key: header,
                      className: 'px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider' 
                    }, header)
                  )
                )
              ),
              
              React.createElement('tbody', { 
                className: 'bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700' 
              },
                partnerData.tickets.slice(0, 10).map((ticket, idx) =>
                  React.createElement('tr', { 
                    key: idx,
                    className: 'hover:bg-gray-50 dark:hover:bg-gray-800' 
                  },
                    React.createElement('td', { className: 'px-3 py-2 text-sm text-gray-900 dark:text-white' }, 
                      ticket.category
                    ),
                    React.createElement('td', { className: 'px-3 py-2 text-sm text-gray-900 dark:text-white' }, 
                      ticket.section || '-'
                    ),
                    React.createElement('td', { className: 'px-3 py-2 text-sm text-gray-900 dark:text-white' }, 
                      ticket.row || '-'
                    ),
                    React.createElement('td', { className: 'px-3 py-2 text-sm text-gray-900 dark:text-white' }, 
                      ticket.quantity
                    ),
                    React.createElement('td', { className: 'px-3 py-2 text-sm font-medium text-gray-900 dark:text-white' }, 
                      `₹${window.formatIndianNumber(ticket.price)}`
                    ),
                    React.createElement('td', { className: 'px-3 py-2 text-sm text-gray-500 dark:text-gray-400' }, 
                      ticket.sellerType
                    ),
                    React.createElement('td', { className: 'px-3 py-2 text-sm text-gray-500 dark:text-gray-400' }, 
                      ticket.deliveryMethod
                    )
                  )
                ),
                
                partnerData.tickets.length > 10 && React.createElement('tr', null,
                  React.createElement('td', { 
                    colSpan: 7,
                    className: 'px-3 py-2 text-center text-sm text-gray-500 dark:text-gray-400' 
                  }, `... and ${partnerData.tickets.length - 10} more tickets`)
                )
              )
            )
          )
        )
      );
    }),

    // Refresh button
    !loading && React.createElement('div', { className: 'mt-4 flex justify-end' },
      React.createElement('button', {
        onClick: () => fetchMarketRates(searchName, alternativeName),
        className: 'px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600'
      }, '🔄 Refresh Rates')
    )
  );
};

// Partner configurations for display
const PARTNER_CONFIGS = {
  xs2event: {
    name: 'XS2Event',
    icon: '🎫'
  }
  // Add more partners here as needed
};

console.log('✅ Market Rate Tab component loaded');
