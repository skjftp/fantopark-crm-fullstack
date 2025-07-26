// Marketing Performance Component - Clean Backend-only
// Single API call, no frontend calculations

function MarketingPerformanceBackend() {
    const [state, setState] = React.useState({
        loading: true,
        data: null,
        error: null,
        filters: {
            dateFrom: new Date(new Date().setDate(new Date().getDate() - 14)).toISOString().split('T')[0],
            dateTo: new Date().toISOString().split('T')[0],
            event: 'all',
            source: 'all',
            sources: [], // New: array for multi-select
            adSet: 'all'
        },
        showSourceDropdown: false, // For dropdown visibility
        showFilters: true,
        lastUpdated: null,
        nextUpdateIn: null
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
            
            // Handle multi-select sources
            if (filters.sources && filters.sources.length > 0) {
                queryParams.append('sources', filters.sources.join(','));
            } else if (filters.source !== 'all') {
                // Fallback to single source for backward compatibility
                queryParams.append('source', filters.source);
            }
            
            if (filters.adSet !== 'all') queryParams.append('ad_set', filters.adSet);
            
            // First try to get cached data from performance-stats for timestamp info
            let lastUpdated = null;
            let nextUpdateIn = null;
            
            try {
                const statsResponse = await window.apiCall('/performance-stats/marketing-performance');
                if (statsResponse.success) {
                    lastUpdated = statsResponse.lastUpdated;
                    nextUpdateIn = statsResponse.nextUpdateIn;
                }
            } catch (e) {
                console.log('Could not fetch stats metadata');
            }
            
            // Use original marketing API for detailed data
            const response = await window.apiCall(`/marketing/performance?${queryParams}`);
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to fetch marketing data');
            }
            
            console.log('✅ Marketing data received:', response.data);
            
            setState(prev => ({
                ...prev,
                loading: false,
                data: response.data,
                error: null,
                lastUpdated: lastUpdated,
                nextUpdateIn: nextUpdateIn
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
    
    // Click outside handler for source dropdown
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (state.showSourceDropdown && !event.target.closest('.source-dropdown-container')) {
                setState(prev => ({ ...prev, showSourceDropdown: false }));
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [state.showSourceDropdown]);
    
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
    
    // Debug: Log render count
    React.useEffect(() => {
        console.log('Marketing component rendered, data length:', marketingData.length);
    }, [marketingData.length]);
    
    // Main render with unique key for the table container
    return React.createElement('div', { 
        className: 'p-6 space-y-6',
        key: 'marketing-performance-container'
    },
        // Header
        React.createElement('div', { className: 'flex justify-between items-center' },
            React.createElement('div', null,
                React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' }, 
                    'Marketing Performance'
                ),
                state.lastUpdated && React.createElement('p', { className: 'text-sm text-gray-500 dark:text-gray-400 mt-1 last-updated-blink' }, 
                    `Last updated: ${new Date(state.lastUpdated).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
                    state.nextUpdateIn && ` • Next update in: ${state.nextUpdateIn}`
                )
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
            
            React.createElement('div', { className: 'relative source-dropdown-container' },
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 
                    'Source'
                ),
                React.createElement('div', {
                    className: 'relative'
                },
                    // Multi-select button
                    React.createElement('button', {
                        type: 'button',
                        onClick: () => setState(prev => ({ ...prev, showSourceDropdown: !prev.showSourceDropdown })),
                        className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white bg-white text-left flex justify-between items-center'
                    },
                        React.createElement('span', { className: 'truncate' },
                            state.filters.sources.length === 0 
                                ? 'All Sources' 
                                : state.filters.sources.length === 1 
                                    ? state.filters.sources[0]
                                    : `${state.filters.sources.length} sources selected`
                        ),
                        React.createElement('i', { 
                            className: `fas fa-chevron-${state.showSourceDropdown ? 'up' : 'down'} text-gray-400`
                        })
                    ),
                    
                    // Dropdown menu
                    state.showSourceDropdown && React.createElement('div', {
                        className: 'absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto'
                    },
                        // Select All / Deselect All buttons
                        React.createElement('div', { 
                            className: 'sticky top-0 bg-gray-50 dark:bg-gray-700 p-2 border-b border-gray-200 dark:border-gray-600 flex gap-2'
                        },
                            React.createElement('button', {
                                type: 'button',
                                onClick: () => {
                                    const allSources = filterOptions.sources || [];
                                    setState(prev => ({ 
                                        ...prev, 
                                        filters: { ...prev.filters, sources: [...allSources] }
                                    }));
                                },
                                className: 'text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600'
                            }, 'Select All'),
                            React.createElement('button', {
                                type: 'button',
                                onClick: () => {
                                    setState(prev => ({ 
                                        ...prev, 
                                        filters: { ...prev.filters, sources: [] }
                                    }));
                                },
                                className: 'text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600'
                            }, 'Clear All'),
                            React.createElement('button', {
                                type: 'button',
                                onClick: () => {
                                    setState(prev => ({ ...prev, showSourceDropdown: false }));
                                    fetchMarketingData(state.filters);
                                },
                                className: 'text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 ml-auto'
                            }, 'Apply')
                        ),
                        
                        // Source checkboxes
                        filterOptions.sources && filterOptions.sources.map(source =>
                            React.createElement('label', { 
                                key: source,
                                className: 'flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                            },
                                React.createElement('input', {
                                    type: 'checkbox',
                                    checked: state.filters.sources.includes(source),
                                    onChange: (e) => {
                                        const newSources = e.target.checked
                                            ? [...state.filters.sources, source]
                                            : state.filters.sources.filter(s => s !== source);
                                        setState(prev => ({
                                            ...prev,
                                            filters: { ...prev.filters, sources: newSources }
                                        }));
                                    },
                                    className: 'mr-2 rounded text-blue-600'
                                }),
                                React.createElement('span', { className: 'text-sm' }, source)
                            )
                        )
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
        
        // Performance Charts Section
        React.createElement(MarketingPerformanceCharts, {
            filters: state.filters,
            loading: state.loading
        }),
        
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
                    key: 'marketing-metrics-table'
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
                            React.createElement('th', { className: 'px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'CPL'),
                            React.createElement('th', { className: 'px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'CPM'),
                            React.createElement('th', { className: 'px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'CTR %'),
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
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400' }, 
                                    row.cpl > 0 ? `₹${window.formatIndianNumber ? window.formatIndianNumber(parseFloat(row.cpl)) : row.cpl}` : '-'
                                ),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400' }, 
                                    row.cpm > 0 ? `₹${window.formatIndianNumber ? window.formatIndianNumber(parseFloat(row.cpm)) : row.cpm}` : '-'
                                ),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400' }, 
                                    row.ctr > 0 ? `${row.ctr}%` : '-'
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
                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white' }, 
                                totals.totalCPL > 0 ? `₹${window.formatIndianNumber ? window.formatIndianNumber(parseFloat(totals.totalCPL)) : totals.totalCPL}` : '-'
                            ),
                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white' }, 
                                totals.totalCPM > 0 ? `₹${window.formatIndianNumber ? window.formatIndianNumber(parseFloat(totals.totalCPM)) : totals.totalCPM}` : '-'
                            ),
                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white' }, 
                                totals.totalCTR > 0 ? `${totals.totalCTR}%` : '-'
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
        'Source', 'Total Impressions', 'Total Leads', 'CPL', 'CPM', 'CTR %',
        'Touch Based', 'Not Touch Based', 'Qualified', 'Junk', 'Dropped', 'Converted',
        'Qualified %', 'Converted %', 'Junk %'
    ];
    
    const rows = marketingData.map(row => [
        row.name,
        row.impressions || 0,
        row.totalLeads || 0,
        row.cpl || '0',
        row.cpm || '0',
        row.ctr || '0',
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
            totals.totalCPL || '0',
            totals.totalCPM || '0',
            totals.totalCTR || '0',
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

// Marketing Performance Charts Component
function MarketingPerformanceCharts({ filters, loading }) {
    const [chartData, setChartData] = React.useState({
        daily: null,
        weekly: null,
        loading: true,
        error: null,
        activeTab: 'daily'
    });
    
    // Fetch time-series data
    const fetchChartData = async () => {
        try {
            setChartData(prev => ({ ...prev, loading: true, error: null }));
            
            // Fetch both daily and weekly data in parallel
            const [dailyResponse, weeklyResponse] = await Promise.all([
                window.apiCall(`/marketing/performance-timeseries?${new URLSearchParams({
                    ...filters,
                    date_from: filters.dateFrom,
                    date_to: filters.dateTo,
                    event: filters.event === 'all' ? '' : filters.event,
                    source: filters.source === 'all' ? '' : filters.source,
                    ad_set: filters.adSet === 'all' ? '' : filters.adSet,
                    granularity: 'daily'
                })}`),
                window.apiCall(`/marketing/performance-timeseries?${new URLSearchParams({
                    ...filters,
                    date_from: filters.dateFrom,
                    date_to: filters.dateTo,
                    event: filters.event === 'all' ? '' : filters.event,
                    source: filters.source === 'all' ? '' : filters.source,
                    ad_set: filters.adSet === 'all' ? '' : filters.adSet,
                    granularity: 'weekly'
                })}`)
            ]);
            
            if (!dailyResponse.success || !weeklyResponse.success) {
                throw new Error('Failed to fetch chart data');
            }
            
            setChartData({
                daily: dailyResponse.data,
                weekly: weeklyResponse.data,
                loading: false,
                error: null,
                activeTab: chartData.activeTab
            });
            
            // Create the charts
            setTimeout(() => {
                createPerformanceCharts(dailyResponse.data, weeklyResponse.data, chartData.activeTab);
            }, 100);
            
        } catch (error) {
            console.error('Error fetching chart data:', error);
            setChartData(prev => ({ ...prev, loading: false, error: error.message }));
        }
    };
    
    // Create charts using Chart.js
    const createPerformanceCharts = (dailyData, weeklyData, activeTab) => {
        const data = activeTab === 'daily' ? dailyData : weeklyData;
        if (!data || !data.series || data.series.length === 0) return;
        
        // Leads Chart - Total Meta as default
        const leadsCtx = document.getElementById('marketing-leads-chart');
        if (leadsCtx) {
            const existingChart = Chart.getChart(leadsCtx);
            if (existingChart) existingChart.destroy();
            
            new Chart(leadsCtx, {
                type: 'line',
                data: {
                    labels: data.series.map(d => new Date(d.date).toLocaleDateString()),
                    datasets: [
                        {
                            label: 'Total Meta Leads',
                            data: data.series.map(d => d.total.leads),
                            borderColor: '#10B981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.1,
                            borderWidth: 3,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: `${activeTab === 'daily' ? 'Daily' : 'Weekly'} Lead Generation Trends`
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Number of Leads'
                            }
                        }
                    }
                }
            });
        }
        
        // Conversion Metrics Chart
        const metricsCtx = document.getElementById('marketing-metrics-chart');
        if (metricsCtx) {
            const existingChart = Chart.getChart(metricsCtx);
            if (existingChart) existingChart.destroy();
            
            new Chart(metricsCtx, {
                type: 'bar',
                data: {
                    labels: data.series.map(d => new Date(d.date).toLocaleDateString()),
                    datasets: [
                        {
                            label: 'Qualified %',
                            data: data.series.map(d => 
                                d.total.touchBased > 0 ? (d.total.qualified / d.total.touchBased * 100).toFixed(2) : 0
                            ),
                            backgroundColor: 'rgba(16, 185, 129, 0.7)',
                            borderColor: '#10B981',
                            borderWidth: 2
                        },
                        {
                            label: 'Converted %',
                            data: data.series.map(d => 
                                d.total.touchBased > 0 ? (d.total.converted / d.total.touchBased * 100).toFixed(2) : 0
                            ),
                            backgroundColor: 'rgba(99, 102, 241, 0.7)',
                            borderColor: '#6366F1',
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: `${activeTab === 'daily' ? 'Daily' : 'Weekly'} Qualified vs Converted %`
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                                display: true,
                                text: 'Percentage (%)'
                            }
                        }
                    }
                }
            });
        }
        
        // CPL and CPM Chart
        const cplCpmCtx = document.getElementById('marketing-cpl-cpm-chart');
        if (cplCpmCtx) {
            const existingChart = Chart.getChart(cplCpmCtx);
            if (existingChart) existingChart.destroy();
            
            new Chart(cplCpmCtx, {
                type: 'line',
                data: {
                    labels: data.series.map(d => new Date(d.date).toLocaleDateString()),
                    datasets: [
                        {
                            label: 'Cost Per Lead (CPL) ₹',
                            data: data.series.map(d => parseFloat(d.total.cpl) || 0),
                            borderColor: '#10B981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.1,
                            borderWidth: 3,
                            yAxisID: 'y',
                            pointRadius: 4,
                            pointHoverRadius: 6
                        },
                        {
                            label: 'Cost Per Mille (CPM) ₹',
                            data: data.series.map(d => parseFloat(d.total.cpm) || 0),
                            borderColor: '#6366F1',
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            tension: 0.1,
                            borderWidth: 3,
                            borderDash: [5, 5],
                            yAxisID: 'y1',
                            pointRadius: 4,
                            pointHoverRadius: 6
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: `${activeTab === 'daily' ? 'Daily' : 'Weekly'} Cost Per Lead (CPL) & Cost Per Mille (CPM)`
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ₹' + context.parsed.y;
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Cost Per Lead (₹)'
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: 'CPM (₹)'
                            },
                            grid: {
                                drawOnChartArea: false,
                            },
                        }
                    }
                }
            });
        }
        
        // Qualified % Trend Chart
        const qualifiedCtx = document.getElementById('marketing-qualified-chart');
        if (qualifiedCtx) {
            const existingChart = Chart.getChart(qualifiedCtx);
            if (existingChart) existingChart.destroy();
            
            new Chart(qualifiedCtx, {
                type: 'line',
                data: {
                    labels: data.series.map(d => new Date(d.date).toLocaleDateString()),
                    datasets: [
                        {
                            label: 'Qualified Lead Percentage',
                            data: data.series.map(d => parseFloat(d.total.qualifiedPercent) || 0),
                            borderColor: '#10B981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.1,
                            borderWidth: 3,
                            pointRadius: 4,
                            pointHoverRadius: 6,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: `${activeTab === 'daily' ? 'Daily' : 'Weekly'} Qualified Lead Percentage`
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + context.parsed.y + '%';
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                                display: true,
                                text: 'Qualified %'
                            }
                        }
                    }
                }
            });
        }
    };
    
    // Fetch data when filters change
    React.useEffect(() => {
        if (!loading) {
            fetchChartData();
        }
    }, [filters, loading]);
    
    // Re-create charts when tab changes
    React.useEffect(() => {
        if (chartData.daily && chartData.weekly && !chartData.loading) {
            createPerformanceCharts(chartData.daily, chartData.weekly, chartData.activeTab);
        }
    }, [chartData.activeTab]);
    
    if (chartData.loading) {
        return React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center' },
            React.createElement('div', { className: 'inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white' }),
            React.createElement('p', { className: 'mt-2 text-gray-600' }, 'Loading performance charts...')
        );
    }
    
    if (chartData.error) {
        return React.createElement('div', { className: 'bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4' },
            React.createElement('p', { className: 'text-red-700 dark:text-red-300' }, 'Error loading charts: ', chartData.error)
        );
    }
    
    return React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-6' },
        // Header with tabs
        React.createElement('div', { className: 'flex justify-between items-center mb-4' },
            React.createElement('h2', { className: 'text-lg font-semibold text-gray-900 dark:text-white' }, 
                'Performance Trends'
            ),
            React.createElement('div', { className: 'flex gap-2' },
                React.createElement('button', {
                    onClick: () => setChartData(prev => ({ ...prev, activeTab: 'daily' })),
                    className: `px-4 py-2 rounded-lg ${chartData.activeTab === 'daily' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'}`
                }, 'Daily'),
                React.createElement('button', {
                    onClick: () => setChartData(prev => ({ ...prev, activeTab: 'weekly' })),
                    className: `px-4 py-2 rounded-lg ${chartData.activeTab === 'weekly' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'}`
                }, 'Weekly')
            )
        ),
        
        // Charts grid - 4 charts
        React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6' },
            // Row 1: Leads Chart and Qualified % Chart
            React.createElement('div', { className: 'h-64' },
                React.createElement('canvas', { id: 'marketing-leads-chart' })
            ),
            React.createElement('div', { className: 'h-64' },
                React.createElement('canvas', { id: 'marketing-qualified-chart' })
            ),
            // Row 2: Conversion Metrics and CPL/CPM Chart
            React.createElement('div', { className: 'h-64' },
                React.createElement('canvas', { id: 'marketing-metrics-chart' })
            ),
            React.createElement('div', { className: 'h-64' },
                React.createElement('canvas', { id: 'marketing-cpl-cpm-chart' })
            )
        ),
        
        // Summary stats
        chartData[chartData.activeTab] && React.createElement('div', { className: 'mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700' },
            React.createElement('div', { className: 'text-center' },
                React.createElement('p', { className: 'text-sm text-gray-500 dark:text-gray-400' }, 'Total Facebook Leads'),
                React.createElement('p', { className: 'text-2xl font-bold text-blue-600' }, 
                    chartData[chartData.activeTab].summary.facebookLeads
                )
            ),
            React.createElement('div', { className: 'text-center' },
                React.createElement('p', { className: 'text-sm text-gray-500 dark:text-gray-400' }, 'Total Instagram Leads'),
                React.createElement('p', { className: 'text-2xl font-bold text-pink-600' }, 
                    chartData[chartData.activeTab].summary.instagramLeads
                )
            ),
            React.createElement('div', { className: 'text-center' },
                React.createElement('p', { className: 'text-sm text-gray-500 dark:text-gray-400' }, 'Total Meta Leads'),
                React.createElement('p', { className: 'text-2xl font-bold text-green-600' }, 
                    chartData[chartData.activeTab].summary.totalLeads
                )
            )
        )
    );
}

// Single render function - proper React component pattern
// Directly return the component without memoization to avoid duplicate declaration
window.renderMarketingPerformanceContent = function() {
    return React.createElement(MarketingPerformanceBackend);
};

console.log('✅ Marketing Performance Clean Backend component loaded');
