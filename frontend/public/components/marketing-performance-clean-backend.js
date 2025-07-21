// Marketing Performance Component - Clean Backend-only
// Single API call, no frontend calculations

function MarketingPerformanceBackend() {
    const [state, setState] = React.useState({
        loading: true,
        data: null,
        error: null,
        filters: {
            dateFrom: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
            dateTo: new Date().toISOString().split('T')[0],
            event: 'all',
            source: 'all',
            adSet: 'all'
        },
        showFilters: true
    });

    // Single API call to get everything
    const fetchMarketingData = async (filters) => {
        console.log('🚀 Fetching marketing performance from backend:', filters);
        
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        try {
            const queryParams = new URLSearchParams({
                date_from: filters.dateFrom,
                date_to: filters.dateTo
            });
            
            if (filters.event !== 'all') queryParams.append('event', filters.event);
            if (filters.source !== 'all') queryParams.append('source', filters.source);
            if (filters.adSet !== 'all') queryParams.append('ad_set', filters.adSet);
            
            const response = await window.apiCall(`/marketing/performance?${queryParams}`);
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to fetch marketing data');
            }
            
            console.log('✅ Marketing data received:', response.data);
            
            setState(prev => ({
                ...prev,
                loading: false,
                data: response.data,
                error: null
            }));
            
        } catch (error) {
            console.error('❌ Error fetching marketing data:', error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: error.message,
                data: null
            }));
        }
    };
    
    // Fetch data on mount
    React.useEffect(() => {
        fetchMarketingData(state.filters);
    }, []); // Empty dependency is correct here as we only want to run on mount
    
    // Log Facebook API status when data changes
    React.useEffect(() => {
        if (state.data?.facebookApi) {
            console.log('📊 Facebook API Status:', state.data.facebookApi);
            if (state.data.facebookApi.debugInfo) {
                console.log('🔍 Debug Info:', state.data.facebookApi.debugInfo);
            }
        }
    }, [state.data]);
    
    // Handle filter changes
    const handleFilterChange = (filterType, value) => {
        const newFilters = { ...state.filters, [filterType]: value };
        setState(prev => ({ 
            ...prev, 
            filters: newFilters
        }));
        fetchMarketingData(newFilters);
    };
    
    const toggleFilters = () => {
        setState(prev => ({ ...prev, showFilters: !prev.showFilters }));
    };
    
    if (state.error) {
        return React.createElement('div', { className: 'p-6' },
            React.createElement('div', { className: 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded' },
                React.createElement('strong', null, 'Error: '),
                state.error
            )
        );
    }
    
    const data = state.data || {};
    const marketingData = data.marketingData || [];
    const totals = data.totals || {};
    const filterOptions = data.filterOptions || { events: [], sources: [], adSets: [] };
    
    // Main render with unique key for the table container
    return React.createElement('div', { 
        className: 'p-6 space-y-6',
        key: 'marketing-performance-container'
    },
        // Header
        React.createElement('div', { className: 'flex justify-between items-center' },
            React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' }, 
                'Marketing Performance'
            ),
            React.createElement('div', { className: 'flex gap-2' },
                React.createElement('button', {
                    onClick: toggleFilters,
                    className: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 px-4 py-2 rounded-lg flex items-center gap-2',
                    type: 'button'
                },
                    React.createElement('span', null, state.showFilters ? '▼' : '►'),
                    'Filters'
                ),
                React.createElement('button', {
                    onClick: () => window.exportMarketingData(marketingData, totals),
                    className: 'bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2',
                    type: 'button',
                    disabled: state.loading || !marketingData.length
                },
                    React.createElement('i', { className: 'fas fa-download' }),
                    'Export CSV'
                )
            )
        ),
        
        // Filters
        state.showFilters && React.createElement('div', { 
            className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4' 
        },
            React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 
                    'From Date (Enquiry)'
                ),
                React.createElement('input', {
                    type: 'date',
                    value: state.filters.dateFrom,
                    onChange: (e) => handleFilterChange('dateFrom', e.target.value),
                    className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white'
                })
            ),
            
            React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 
                    'To Date (Enquiry)'
                ),
                React.createElement('input', {
                    type: 'date',
                    value: state.filters.dateTo,
                    onChange: (e) => handleFilterChange('dateTo', e.target.value),
                    className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white'
                })
            ),
            
            React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 
                    'Event'
                ),
                React.createElement('select', {
                    value: state.filters.event,
                    onChange: (e) => handleFilterChange('event', e.target.value),
                    className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white'
                },
                    React.createElement('option', { value: 'all' }, 'All Events'),
                    filterOptions.events && filterOptions.events.map(event =>
                        React.createElement('option', { key: event, value: event }, event)
                    )
                )
            ),
            
            React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 
                    'Source'
                ),
                React.createElement('select', {
                    value: state.filters.source,
                    onChange: (e) => handleFilterChange('source', e.target.value),
                    className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white'
                },
                    React.createElement('option', { value: 'all' }, 'All Sources'),
                    filterOptions.sources && filterOptions.sources.map(source =>
                        React.createElement('option', { key: source, value: source }, source)
                    )
                )
            ),
            
            React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 
                    'Ad Set Name'
                ),
                React.createElement('select', {
                    value: state.filters.adSet,
                    onChange: (e) => handleFilterChange('adSet', e.target.value),
                    className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white'
                },
                    React.createElement('option', { value: 'all' }, 'All Ad Sets'),
                    filterOptions.adSets && filterOptions.adSets.map(adSet =>
                        React.createElement('option', { key: adSet, value: adSet }, adSet)
                    )
                )
            )
        ),
        
        // Applied filters info
        data.appliedFilters && React.createElement('div', { 
            className: 'bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4'
        },
            React.createElement('div', { className: 'flex items-center justify-between' },
                React.createElement('div', { className: 'flex items-center' },
                    React.createElement('i', { className: 'fas fa-info-circle text-blue-500 mr-2' }),
                    React.createElement('span', { className: 'text-sm text-blue-700 dark:text-blue-300' },
                        `Showing data grouped by: ${data.groupBy || 'source'} | `,
                        `Filters: ${Object.entries(data.appliedFilters)
                            .filter(([key, value]) => value !== 'all')
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(', ') || 'None'}`
                    )
                ),
                // Facebook API Status
                data.facebookApi && React.createElement('div', { 
                    className: `text-sm px-3 py-1 rounded-full ${
                        data.facebookApi.status === 'success' ? 'bg-green-100 text-green-700' :
                        data.facebookApi.status === 'error' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                    }`
                },
                    React.createElement('i', { 
                        className: `fas ${
                            data.facebookApi.status === 'success' ? 'fa-check-circle' :
                            data.facebookApi.status === 'error' ? 'fa-exclamation-circle' :
                            'fa-question-circle'
                        } mr-1`
                    }),
                    data.facebookApi.status === 'success' ? 'Facebook API Connected' :
                    data.facebookApi.status === 'error' ? `API Error: ${data.facebookApi.error}` :
                    'Facebook API Not Connected'
                )
            )
        ),
        
        // Table container with unique key
        React.createElement('div', { 
            className: 'bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden',
            key: `table-container-${JSON.stringify(state.filters)}`
        },
            React.createElement('div', { className: 'px-6 py-4 border-b border-gray-200 dark:border-gray-700' },
                React.createElement('h2', { className: 'text-lg font-semibold text-gray-900 dark:text-white' }, 
                    'Marketing Metrics'
                ),
                React.createElement('p', { className: 'text-sm text-gray-500 dark:text-gray-400 mt-1' }, 
                    '* Impressions data available for Facebook and Instagram sources only'
                )
            ),
            
            state.loading ? 
                React.createElement('div', { className: 'p-6 text-center' }, 
                    React.createElement('div', { className: 'inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white' }),
                    React.createElement('p', { className: 'mt-2 text-gray-600' }, 'Loading marketing data...')
                ) :
                
            marketingData.length === 0 ?
                React.createElement('div', { className: 'p-6 text-center' },
                    React.createElement('p', { className: 'text-gray-500' }, 'No marketing data found for the selected filters.')
                ) :
                
            React.createElement('div', { className: 'overflow-x-auto' },
                React.createElement('table', { 
                    className: 'w-full',
                    key: `marketing-table-${Date.now()}`
                },
                    React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-900' },
                        React.createElement('tr', null,
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 
                                state.filters.adSet !== 'all' ? 'Ad Set' :
                                state.filters.source !== 'all' ? 'Source' :
                                state.filters.event !== 'all' ? 'Event' :
                                'Source'
                            ),
                            React.createElement('th', { className: 'px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Total Impressions'),
                            React.createElement('th', { className: 'px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Total Leads'),
                            React.createElement('th', { className: 'px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Touch Based'),
                            React.createElement('th', { className: 'px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Not Touch Based'),
                            React.createElement('th', { className: 'px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Qualified'),
                            React.createElement('th', { className: 'px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Junk'),
                            React.createElement('th', { className: 'px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Dropped'),
                            React.createElement('th', { className: 'px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Converted'),
                            React.createElement('th', { className: 'px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Qualified %'),
                            React.createElement('th', { className: 'px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Converted %'),
                            React.createElement('th', { className: 'px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Junk %')
                        )
                    ),
                    React.createElement('tbody', { className: 'bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700' },
                        marketingData.map((row, index) => 
                            React.createElement('tr', { key: `row-${row.name}-${index}` },
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white' }, row.name),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400' }, 
                                    window.formatIndianNumber ? window.formatIndianNumber(row.impressions) : row.impressions.toLocaleString()
                                ),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400' }, 
                                    window.formatIndianNumber ? window.formatIndianNumber(row.totalLeads) : row.totalLeads.toLocaleString()
                                ),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400' }, row.touchBased),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400' }, row.notTouchBased),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400' }, row.qualified),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400' }, row.junk),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400' }, row.dropped),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400' }, row.converted),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400' }, `${row.qualifiedPercent}%`),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400' }, `${row.convertedPercent}%`),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400' }, `${row.junkPercent}%`)
                            )
                        ),
                        
                        // Total row
                        totals && totals.totalLeads > 0 && React.createElement('tr', { 
                            key: 'total-row',
                            className: 'bg-gray-50 dark:bg-gray-900 font-semibold' 
                        },
                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white' }, 'TOTAL'),
                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white' }, 
                                window.formatIndianNumber ? window.formatIndianNumber(totals.totalImpressions || 0) : (totals.totalImpressions || 0).toLocaleString()
                            ),
                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white' }, 
                                window.formatIndianNumber ? window.formatIndianNumber(totals.totalLeads || 0) : (totals.totalLeads || 0).toLocaleString()
                            ),
                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white' }, totals.touchBased || 0),
                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white' }, totals.notTouchBased || 0),
                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white' }, totals.qualified || 0),
                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white' }, totals.junk || 0),
                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white' }, totals.dropped || 0),
                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white' }, totals.converted || 0),
                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white' }, `${totals.totalQualifiedPercent || '0.00'}%`),
                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white' }, `${totals.totalConvertedPercent || '0.00'}%`),
                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white' }, `${totals.totalJunkPercent || '0.00'}%`)
                        )
                    )
                )
            )
        )
    );
}

// Export data function
window.exportMarketingData = (marketingData, totals) => {
    const headers = [
        'Source', 'Total Impressions', 'Total Leads', 'Touch Based', 
        'Not Touch Based', 'Qualified', 'Junk', 'Dropped', 'Converted',
        'Qualified %', 'Converted %', 'Junk %'
    ];
    
    const rows = marketingData.map(row => [
        row.name,
        row.impressions || 0,
        row.totalLeads || 0,
        row.touchBased || 0,
        row.notTouchBased || 0,
        row.qualified || 0,
        row.junk || 0,
        row.dropped || 0,
        row.converted || 0,
        `${row.qualifiedPercent}%`,
        `${row.convertedPercent}%`,
        `${row.junkPercent}%`
    ]);
    
    if (totals && totals.totalLeads > 0) {
        rows.push([
            'TOTAL',
            totals.totalImpressions || 0,
            totals.totalLeads || 0,
            totals.touchBased || 0,
            totals.notTouchBased || 0,
            totals.qualified || 0,
            totals.junk || 0,
            totals.dropped || 0,
            totals.converted || 0,
            `${totals.totalQualifiedPercent || '0.00'}%`,
            `${totals.totalConvertedPercent || '0.00'}%`,
            `${totals.totalJunkPercent || '0.00'}%`
        ]);
    }
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `marketing-performance-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
};

// Memoized component to prevent multiple instances
const MemoizedMarketingPerformance = React.memo(MarketingPerformanceBackend);

// Single render function - proper React component pattern
window.renderMarketingPerformanceContent = function() {
    return React.createElement(MemoizedMarketingPerformance);
};

console.log('✅ Marketing Performance Clean Backend component loaded');

// Export data function
window.exportMarketingData = (marketingData, totals) => {
    const headers = [
        'Source', 'Total Impressions', 'Total Leads', 'Touch Based', 
        'Not Touch Based', 'Qualified', 'Junk', 'Dropped', 'Converted',
        'Qualified %', 'Converted %', 'Junk %'
    ];
    
    const rows = marketingData.map(row => [
        row.name,
        row.impressions || 0,
        row.totalLeads || 0,
        row.touchBased || 0,
        row.notTouchBased || 0,
        row.qualified || 0,
        row.junk || 0,
        row.dropped || 0,
        row.converted || 0,
        `${row.qualifiedPercent}%`,
        `${row.convertedPercent}%`,
        `${row.junkPercent}%`
    ]);
    
    if (totals && totals.totalLeads > 0) {
        rows.push([
            'TOTAL',
            totals.totalImpressions || 0,
            totals.totalLeads || 0,
            totals.touchBased || 0,
            totals.notTouchBased || 0,
            totals.qualified || 0,
            totals.junk || 0,
            totals.dropped || 0,
            totals.converted || 0,
            `${totals.totalQualifiedPercent || '0.00'}%`,
            `${totals.totalConvertedPercent || '0.00'}%`,
            `${totals.totalJunkPercent || '0.00'}%`
        ]);
    }
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `marketing-performance-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
};

// Memoized component to prevent multiple instances
const MemoizedMarketingPerformance = React.memo(MarketingPerformanceBackend);

// Single render function - proper React component pattern
window.renderMarketingPerformanceContent = function() {
    return React.createElement(MemoizedMarketingPerformance);
};

console.log('✅ Marketing Performance Clean Backend component loaded');
