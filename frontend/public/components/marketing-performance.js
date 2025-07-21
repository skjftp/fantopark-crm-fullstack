// Marketing Performance Component
// Displays marketing metrics based on Excel template specifications

window.renderMarketingPerformanceContent = function() {
    try {
        // Wrap in a stable container to prevent DOM issues
        return React.createElement('div', { 
            key: 'marketing-performance-container',
            className: 'marketing-performance-wrapper'
        },
            React.createElement(window.MarketingPerformance)
        );
    } catch (error) {
        console.error('Error rendering Marketing Performance:', error);
        return React.createElement('div', { className: 'p-6 text-center' },
            React.createElement('p', { className: 'text-red-500' }, 
                'Error loading Marketing Performance. Please refresh the page.'
            )
        );
    }
};

window.MarketingPerformance = React.memo(function MarketingPerformance() {
    const [loading, setLoading] = React.useState(false);
    const [marketingData, setMarketingData] = React.useState([]);
    const [rawLeads, setRawLeads] = React.useState([]); // Store raw leads for reprocessing
    const [filters, setFilters] = React.useState({
        dateFrom: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        dateTo: new Date().toISOString().split('T')[0],
        event: 'all',
        source: 'all',
        adSet: 'all'
    });
    const [showFilters, setShowFilters] = React.useState(true);
    const [filterOptions, setFilterOptions] = React.useState({
        events: [],
        sources: [],
        adSets: []
    });
    const [facebookImpressions, setFacebookImpressions] = React.useState({});
    
    // Define what statuses count as "touch based"
    const touchBasedStatuses = [
        'contacted', 'attempt_1', 'attempt_2', 'attempt_3',
        'qualified', 'unqualified', 'junk', 'warm', 'hot', 'cold',
        'interested', 'not_interested', 'on_hold', 'dropped',
        'converted', 'invoiced', 'payment_received', 'payment_post_service'
    ];
    
    // Fetch marketing data
    const fetchMarketingData = React.useCallback(async () => {
        setLoading(true);
        try {
            // Build query parameters
            const queryParams = new URLSearchParams({
                date_from: filters.dateFrom,
                date_to: filters.dateTo
            });
            
            // Add filters only if not 'all'
            if (filters.event !== 'all') queryParams.append('event', filters.event);
            if (filters.source !== 'all') queryParams.append('source', filters.source);
            if (filters.adSet !== 'all') queryParams.append('ad_set', filters.adSet);
            
            // Fetch leads with filters
            const response = await window.apiCall(`/leads/paginated?${queryParams}&limit=10000`);
            
            if (response.success) {
                const leads = response.data || [];
                setRawLeads(leads); // Store raw leads
                
                // Process leads by grouping them
                const groupedData = processLeadsData(leads);
                setMarketingData(groupedData);
                
                // Extract unique values for filters
                const uniqueEvents = [...new Set(leads.map(l => l.lead_for_event || l.event_name).filter(Boolean))];
                const uniqueSources = [...new Set(leads.map(l => l.source).filter(Boolean))];
                const uniqueAdSets = [...new Set(leads.map(l => l.ad_set || l.adset_name).filter(Boolean))];
                
                setFilterOptions({
                    events: uniqueEvents.sort(),
                    sources: uniqueSources.sort(),
                    adSets: uniqueAdSets.sort()
                });
                
                // Fetch Facebook impressions for ad sets or sources
                console.log('Current filters:', filters);
                if (filters.adSet !== 'all') {
                    console.log('Fetching ad set impressions for:', filters.adSet);
                    await fetchAdSetImpressions(filters.adSet);
                } else if (filters.source === 'all' || !filters.source) {
                    // When showing all sources, fetch impressions by source
                    console.log('Fetching impressions for all sources');
                    await fetchImpressionsBySource();
                } else if (filters.source === 'Facebook' || filters.source === 'Instagram') {
                    // Fetch impressions for specific social source
                    console.log('Fetching impressions for source:', filters.source);
                    await fetchSourceImpressions(filters.source);
                }
            }
        } catch (error) {
            console.error('Error fetching marketing data:', error);
            alert('Error loading marketing data');
        } finally {
            setLoading(false);
        }
    }, [filters]);
    
    // Process leads data to calculate metrics
    const processLeadsData = React.useCallback((leads) => {
        // Group by the appropriate dimension based on filters
        const groupBy = filters.adSet !== 'all' ? 'ad_set' :
                       filters.source !== 'all' ? 'source' :
                       filters.event !== 'all' ? 'event' :
                       'source'; // Default grouping
        
        const grouped = {};
        
        leads.forEach(lead => {
            let key = lead[groupBy] || lead.adset_name || 'Unknown';
            if (groupBy === 'event') {
                key = lead.lead_for_event || lead.event_name || 'Unknown';
            }
            
            if (!grouped[key]) {
                grouped[key] = {
                    name: key,
                    totalLeads: 0,
                    touchBased: 0,
                    notTouchBased: 0,
                    qualified: 0,
                    junk: 0,
                    dropped: 0,
                    converted: 0,
                    impressions: 0,
                    source: lead.source // Track source for impressions
                };
            }
            
            grouped[key].totalLeads++;
            
            // Check if touch based
            if (touchBasedStatuses.includes(lead.status)) {
                grouped[key].touchBased++;
                
                // Count specific statuses
                if (lead.status === 'qualified') {
                    grouped[key].qualified++;
                } else if (lead.status === 'junk') {
                    grouped[key].junk++;
                } else if (lead.status === 'dropped') {
                    grouped[key].dropped++;
                } else if (['converted', 'invoiced', 'payment_received', 'payment_post_service'].includes(lead.status)) {
                    grouped[key].converted++;
                }
            } else {
                grouped[key].notTouchBased++;
            }
        });
        
        // Calculate percentages and add impressions
        return Object.entries(grouped).map(([key, data]) => {
            const qualifiedPercent = data.touchBased > 0 
                ? ((data.qualified + data.dropped) / data.touchBased * 100).toFixed(2) 
                : 0;
            const convertedPercent = data.touchBased > 0 
                ? (data.converted / data.touchBased * 100).toFixed(2) 
                : 0;
            const junkPercent = data.touchBased > 0 
                ? (data.junk / data.touchBased * 100).toFixed(2) 
                : 0;
            
            // Get impressions based on context
            let impressions = 0;
            if (groupBy === 'source' && (key === 'Facebook' || key === 'Instagram')) {
                // For Facebook/Instagram sources, use the impressions data
                impressions = facebookImpressions[key] || 0;
                console.log(`Impressions for ${key}:`, impressions, 'from:', facebookImpressions);
            } else if (groupBy === 'ad_set') {
                // For ad sets, use the specific ad set impressions
                impressions = facebookImpressions[key] || 0;
            }
            
            return {
                ...data,
                qualifiedPercent,
                convertedPercent,
                junkPercent,
                impressions
            };
        });
    }, [filters, facebookImpressions, touchBasedStatuses]);
    
    // Fetch Facebook ad set impressions
    const fetchAdSetImpressions = async (adSetName) => {
        try {
            const response = await window.apiCall(`/marketing/facebook-impressions?ad_set=${adSetName}`);
            if (response.success && response.data) {
                setFacebookImpressions(response.data);
            }
        } catch (error) {
            console.error('Error fetching Facebook impressions:', error);
        }
    };
    
    // Fetch impressions by source (for all sources view)
    const fetchImpressionsBySource = async () => {
        try {
            console.log('Fetching impressions by source...');
            const response = await window.apiCall(`/marketing/impressions-by-source?date_from=${filters.dateFrom}&date_to=${filters.dateTo}`);
            console.log('Impressions response:', response);
            if (response.success && response.data) {
                setFacebookImpressions(response.data);
                console.log('Set impressions data:', response.data);
            }
        } catch (error) {
            console.error('Error fetching impressions by source:', error);
        }
    };
    
    // Fetch impressions for specific source (Facebook or Instagram)
    const fetchSourceImpressions = async (source) => {
        try {
            const response = await window.apiCall(`/marketing/facebook-impressions?source=${source}`);
            if (response.success && response.data) {
                setFacebookImpressions(response.data);
            }
        } catch (error) {
            console.error('Error fetching source impressions:', error);
        }
    };
    
    // Fetch data on filter change
    React.useEffect(() => {
        fetchMarketingData();
    }, [fetchMarketingData]);
    
    // Reprocess data when impressions are updated
    React.useEffect(() => {
        if (Object.keys(facebookImpressions).length > 0 && rawLeads.length > 0) {
            console.log('Reprocessing data with new impressions:', facebookImpressions);
            // Reprocess the existing leads data with new impressions
            const groupedData = processLeadsData(rawLeads);
            setMarketingData(groupedData);
        }
    }, [facebookImpressions, rawLeads, processLeadsData]);
    
    // Calculate totals
    const totals = React.useMemo(() => {
        return marketingData.reduce((acc, row) => {
            acc.totalImpressions += row.impressions;
            acc.totalLeads += row.totalLeads;
            acc.touchBased += row.touchBased;
            acc.notTouchBased += row.notTouchBased;
            acc.qualified += row.qualified;
            acc.junk += row.junk;
            acc.dropped += row.dropped;
            acc.converted += row.converted;
            return acc;
        }, {
            totalImpressions: 0,
            totalLeads: 0,
            touchBased: 0,
            notTouchBased: 0,
            qualified: 0,
            junk: 0,
            dropped: 0,
            converted: 0
        });
    }, [marketingData]);
    
    // Calculate total percentages
    const totalQualifiedPercent = totals.touchBased > 0 
        ? ((totals.qualified + totals.dropped) / totals.touchBased * 100).toFixed(2) 
        : 0;
    const totalConvertedPercent = totals.touchBased > 0 
        ? (totals.converted / totals.touchBased * 100).toFixed(2) 
        : 0;
    const totalJunkPercent = totals.touchBased > 0 
        ? (totals.junk / totals.touchBased * 100).toFixed(2) 
        : 0;
    
    return React.createElement('div', { className: 'p-6 space-y-6' },
        // Header
        React.createElement('div', { className: 'flex justify-between items-center' },
            React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' }, 
                'Marketing Performance'
            ),
            React.createElement('div', { className: 'flex gap-2' },
                React.createElement('button', {
                    onClick: () => setShowFilters(!showFilters),
                    className: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 px-4 py-2 rounded-lg flex items-center gap-2'
                },
                    React.createElement('span', null, showFilters ? '▼' : '►'),
                    'Filters'
                ),
                React.createElement('button', {
                    onClick: () => exportMarketingData(marketingData, totals),
                    className: 'bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2'
                },
                    React.createElement('i', { className: 'fas fa-download' }),
                    'Export CSV'
                )
            )
        ),
        
        // Filters Section
        showFilters && React.createElement('div', { 
            className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4' 
        },
            // Date Range
            React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 
                    'From Date (Enquiry)'
                ),
                React.createElement('input', {
                    type: 'date',
                    value: filters.dateFrom,
                    onChange: (e) => setFilters({...filters, dateFrom: e.target.value}),
                    className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white'
                })
            ),
            
            React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 
                    'To Date (Enquiry)'
                ),
                React.createElement('input', {
                    type: 'date',
                    value: filters.dateTo,
                    onChange: (e) => setFilters({...filters, dateTo: e.target.value}),
                    className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white'
                })
            ),
            
            // Event Filter
            React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 
                    'Event'
                ),
                React.createElement('select', {
                    value: filters.event,
                    onChange: (e) => setFilters({...filters, event: e.target.value}),
                    className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white'
                },
                    React.createElement('option', { value: 'all' }, 'All Events'),
                    filterOptions.events.map(event => 
                        React.createElement('option', { key: event, value: event }, event)
                    )
                )
            ),
            
            // Source Filter
            React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 
                    'Source'
                ),
                React.createElement('select', {
                    value: filters.source,
                    onChange: (e) => setFilters({...filters, source: e.target.value}),
                    className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white'
                },
                    React.createElement('option', { value: 'all' }, 'All Sources'),
                    filterOptions.sources.map(source => 
                        React.createElement('option', { key: source, value: source }, source)
                    )
                )
            ),
            
            // Ad Set Filter
            React.createElement('div', null,
                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' }, 
                    'Ad Set Name'
                ),
                React.createElement('select', {
                    value: filters.adSet,
                    onChange: (e) => setFilters({...filters, adSet: e.target.value}),
                    className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white'
                },
                    React.createElement('option', { value: 'all' }, 'All Ad Sets'),
                    filterOptions.adSets.map(adSet => 
                        React.createElement('option', { key: adSet, value: adSet }, adSet)
                    )
                )
            )
        ),
        
        // Performance Table
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden' },
            React.createElement('div', { className: 'px-6 py-4 border-b border-gray-200 dark:border-gray-700' },
                React.createElement('h2', { className: 'text-lg font-semibold text-gray-900 dark:text-white' }, 
                    'Marketing Metrics'
                ),
                React.createElement('p', { className: 'text-sm text-gray-500 dark:text-gray-400 mt-1' }, 
                    '* Impressions data available for Facebook and Instagram sources only'
                )
            ),
            
            loading ? 
                React.createElement('div', { className: 'p-6 text-center' }, 
                    React.createElement('div', { className: 'inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white' })
                ) :
                
            React.createElement('div', { className: 'overflow-x-auto' },
                React.createElement('table', { className: 'w-full' },
                    React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-900' },
                        React.createElement('tr', null,
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 
                                filters.adSet !== 'all' ? 'Ad Set' :
                                filters.source !== 'all' ? 'Source' :
                                filters.event !== 'all' ? 'Event' :
                                'Source'
                            ),
                            React.createElement('th', { className: 'px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider' }, 
                                'Total Impressions'
                            ),
                            React.createElement('th', { className: 'px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider' }, 
                                'Total Leads'
                            ),
                            React.createElement('th', { className: 'px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider' }, 
                                'Touch Based'
                            ),
                            React.createElement('th', { className: 'px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider' }, 
                                'Not Touch Based'
                            ),
                            React.createElement('th', { className: 'px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider' }, 
                                'Qualified'
                            ),
                            React.createElement('th', { className: 'px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider' }, 
                                'Junk'
                            ),
                            React.createElement('th', { className: 'px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider' }, 
                                'Dropped'
                            ),
                            React.createElement('th', { className: 'px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider' }, 
                                'Converted'
                            ),
                            React.createElement('th', { className: 'px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider' }, 
                                'Qualified %'
                            ),
                            React.createElement('th', { className: 'px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider' }, 
                                'Converted %'
                            ),
                            React.createElement('th', { className: 'px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider' }, 
                                'Junk %'
                            )
                        )
                    ),
                    React.createElement('tbody', { className: 'bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700' },
                        marketingData.map((row, index) => 
                            React.createElement('tr', { key: index },
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white' }, 
                                    row.name
                                ),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400' }, 
                                    window.formatIndianNumber(row.impressions)
                                ),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400' }, 
                                    row.totalLeads
                                ),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400' }, 
                                    row.touchBased
                                ),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400' }, 
                                    row.notTouchBased
                                ),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400' }, 
                                    row.qualified
                                ),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400' }, 
                                    row.junk
                                ),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400' }, 
                                    row.dropped
                                ),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400' }, 
                                    row.converted
                                ),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400' }, 
                                    `${row.qualifiedPercent}%`
                                ),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400' }, 
                                    `${row.convertedPercent}%`
                                ),
                                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400' }, 
                                    `${row.junkPercent}%`
                                )
                            )
                        ),
                        
                        // Totals Row
                        React.createElement('tr', { className: 'bg-gray-100 dark:bg-gray-900 font-semibold' },
                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white' }, 
                                'TOTAL'
                            ),
                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white' }, 
                                window.formatIndianNumber(totals.totalImpressions)
                            ),
                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white' }, 
                                totals.totalLeads
                            ),
                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white' }, 
                                totals.touchBased
                            ),
                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white' }, 
                                totals.notTouchBased
                            ),
                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white' }, 
                                totals.qualified
                            ),
                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white' }, 
                                totals.junk
                            ),
                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white' }, 
                                totals.dropped
                            ),
                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white' }, 
                                totals.converted
                            ),
                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white' }, 
                                `${totalQualifiedPercent}%`
                            ),
                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white' }, 
                                `${totalConvertedPercent}%`
                            ),
                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white' }, 
                                `${totalJunkPercent}%`
                            )
                        )
                    )
                )
            )
        )
    );
});

// Export marketing data to CSV
function exportMarketingData(data, totals) {
    const headers = [
        'Name',
        'Total Impressions',
        'Total Leads',
        'Touch Based',
        'Not Touch Based',
        'Qualified',
        'Junk',
        'Dropped',
        'Converted',
        'Qualified %',
        'Converted %',
        'Junk %'
    ];
    
    const rows = data.map(row => [
        row.name,
        row.impressions,
        row.totalLeads,
        row.touchBased,
        row.notTouchBased,
        row.qualified,
        row.junk,
        row.dropped,
        row.converted,
        `${row.qualifiedPercent}%`,
        `${row.convertedPercent}%`,
        `${row.junkPercent}%`
    ]);
    
    // Add totals row
    rows.push([
        'TOTAL',
        totals.totalImpressions,
        totals.totalLeads,
        totals.touchBased,
        totals.notTouchBased,
        totals.qualified,
        totals.junk,
        totals.dropped,
        totals.converted,
        `${((totals.qualified + totals.dropped) / totals.touchBased * 100).toFixed(2)}%`,
        `${(totals.converted / totals.touchBased * 100).toFixed(2)}%`,
        `${(totals.junk / totals.touchBased * 100).toFixed(2)}%`
    ]);
    
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
}

window.formatIndianNumber = window.formatIndianNumber || function(num) {
    const number = parseFloat(num);
    if (isNaN(number)) return '0';
    return number.toLocaleString('en-IN');
};

console.log('✅ Marketing Performance component loaded');