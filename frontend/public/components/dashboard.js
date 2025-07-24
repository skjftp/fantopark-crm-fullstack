// ===============================================
// COMPLETE OPTIMIZED DASHBOARD COMPONENT
// Integrated with Backend API Chart Optimization
// Fixed: Chart visibility on tab switching
// ===============================================

// Global flag to prevent duplicate chart updates
window._chartUpdateInProgress = false;
window._dashboardChartInstances = {
    leadSplit: null,
    tempCount: null,
    tempValue: null
};

// ===============================================
// MAIN DASHBOARD RENDER FUNCTION
// ===============================================

// Create a proper React component for the dashboard
const DashboardComponent = () => {
    // Use React hooks to manage chart initialization
    const [chartsInitialized, setChartsInitialized] = React.useState(false);
    
    React.useEffect(() => {
        // Only initialize if not already initialized
        if (!chartsInitialized && window.activeTab === 'dashboard') {
            console.log('📊 Dashboard mounted, initializing charts...');
            
            // Small delay to ensure DOM is ready
            const initTimer = setTimeout(() => {
                if (window.fetchChartDataFromAPI) {
                    console.log('📊 Fetching chart data from API...');
                    window.fetchChartDataFromAPI().then(() => {
                        setChartsInitialized(true);
                    }).catch(error => {
                        console.error('❌ Error fetching chart data:', error);
                    });
                }
            }, 500); // Increased delay to ensure DOM is ready
            
            return () => clearTimeout(initTimer);
        }
    }, []); // Remove chartsInitialized dependency to prevent re-runs
    
    return React.createElement('div', { className: 'space-y-6' },
        // Dashboard Stats Cards - API DRIVEN
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-6 mb-6' },
            // Total Leads Card
            React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-6 rounded-lg shadow border' },
                React.createElement('div', { className: 'flex items-center' },
                    React.createElement('div', { className: 'p-2 bg-blue-100 dark:bg-blue-900 rounded-lg' },
                        React.createElement('svg', {
                            className: 'w-6 h-6 text-blue-600 dark:text-blue-400',
                            fill: 'none',
                            stroke: 'currentColor',
                            viewBox: '0 0 24 24'
                        },
                            React.createElement('path', {
                                strokeLinecap: 'round',
                                strokeLinejoin: 'round',
                                strokeWidth: 2,
                                d: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
                            })
                        )
                    ),
                    React.createElement('div', { className: 'ml-4' },
                        React.createElement('h3', { 
                            className: 'text-lg font-semibold text-gray-900 dark:text-white',
                            'data-stat': 'total-leads'
                        },
                            '0' // Initial value, updated by API
                        ),
                        React.createElement('p', { className: 'text-sm text-gray-500 dark:text-gray-400' }, 'Total Leads')
                    )
                )
            ),

            // Hot Leads Card
            React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-6 rounded-lg shadow border' },
                React.createElement('div', { className: 'flex items-center' },
                    React.createElement('div', { className: 'p-2 bg-red-100 dark:bg-red-900 rounded-lg' },
                        React.createElement('svg', {
                            className: 'w-6 h-6 text-red-600 dark:text-red-400',
                            fill: 'none',
                            stroke: 'currentColor',
                            viewBox: '0 0 24 24'
                        },
                            React.createElement('path', {
                                strokeLinecap: 'round',
                                strokeLinejoin: 'round',
                                strokeWidth: 2,
                                d: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z'
                            }),
                            React.createElement('path', {
                                strokeLinecap: 'round',
                                strokeLinejoin: 'round',
                                strokeWidth: 2,
                                d: 'M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z'
                            })
                        )
                    ),
                    React.createElement('div', { className: 'ml-4' },
                        React.createElement('h3', { 
                            className: 'text-lg font-semibold text-gray-900 dark:text-white',
                            'data-stat': 'hot-leads'
                        },
                            '0' // Initial value, updated by API
                        ),
                        React.createElement('p', { className: 'text-sm text-gray-500 dark:text-gray-400' }, 'Hot+Warm')
                    )
                )
            ),

            // Qualified Leads Card
            React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-6 rounded-lg shadow border' },
                React.createElement('div', { className: 'flex items-center' },
                    React.createElement('div', { className: 'p-2 bg-green-100 dark:bg-green-900 rounded-lg' },
                        React.createElement('svg', {
                            className: 'w-6 h-6 text-green-600 dark:text-green-400',
                            fill: 'none',
                            stroke: 'currentColor',
                            viewBox: '0 0 24 24'
                        },
                            React.createElement('path', {
                                strokeLinecap: 'round',
                                strokeLinejoin: 'round',
                                strokeWidth: 2,
                                d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                            })
                        )
                    ),
                    React.createElement('div', { className: 'ml-4' },
                        React.createElement('h3', { 
                            className: 'text-lg font-semibold text-gray-900 dark:text-white',
                            'data-stat': 'qualified-leads'
                        },
                            '0' // Initial value, updated by API
                        ),
                        React.createElement('p', { className: 'text-sm text-gray-500 dark:text-gray-400' }, 'Qualified Leads')
                    )
                )
            ),

            // Pipeline Value Card
            React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-6 rounded-lg shadow border' },
                React.createElement('div', { className: 'flex items-center' },
                    React.createElement('div', { className: 'p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg' },
                        React.createElement('span', { className: 'text-2xl' }, '₹')
                    ),
                    React.createElement('div', { className: 'ml-4' },
                        React.createElement('h3', { 
                            className: 'text-lg font-semibold text-gray-900 dark:text-white',
                            'data-stat': 'pipeline-value'
                        },
                            '₹0' // Initial value, updated by API
                        ),
                        React.createElement('p', { className: 'text-sm text-gray-500 dark:text-gray-400' }, 'Total Pipeline Value')
                    )
                )
            )
        ),

        // Filters for pie charts
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6' },
            React.createElement('div', { className: 'flex items-center space-x-4 flex-wrap gap-2' },
                React.createElement('label', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'View by:'),
                
                // Main Filter Dropdown
                React.createElement('select', {
                    className: 'px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                    value: window.dashboardFilter || 'overall',
                    onChange: (e) => {
                        const newValue = e.target.value;
                        
                        window.dashboardFilter = newValue;
                        window.selectedSalesPerson = '';
                        window.selectedEvent = '';
                        
                        try {
                            if (window.setDashboardFilter) window.setDashboardFilter(newValue);
                            if (window.setSelectedSalesPerson) window.setSelectedSalesPerson('');
                            if (window.setSelectedEvent) window.setSelectedEvent('');
                        } catch (error) {
                            // Silent fail
                        }
                        
                        // Trigger chart refresh
                        if (window.fetchChartDataFromAPI) {
                            window.fetchChartDataFromAPI();
                        }
                    }
                },
                    React.createElement('option', { value: 'overall' }, 'Overall'),
                    React.createElement('option', { value: 'salesPerson' }, 'By Sales Person'),
                    React.createElement('option', { value: 'event' }, 'By Event')
                ),

                // Sales Person Filter
                (window.dashboardFilter === 'salesPerson') && React.createElement('select', {
                    className: 'px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                    value: window.selectedSalesPerson || '',
                    onChange: (e) => {
                        const newValue = e.target.value;
                        window.selectedSalesPerson = newValue;
                        
                        try {
                            if (window.setSelectedSalesPerson) window.setSelectedSalesPerson(newValue);
                        } catch (error) {
                            // Silent fail
                        }
                        
                        // Trigger chart refresh
                        if (window.fetchChartDataFromAPI) {
                            window.fetchChartDataFromAPI();
                        }
                    }
                },
                    React.createElement('option', { value: '' }, 'Select Sales Person'),
                    (window.users || []).map(user =>
                        React.createElement('option', { key: user.id, value: user.id }, user.name)
                    )
                ),

                // Event Filter
                (window.dashboardFilter === 'event') && React.createElement('select', {
                    className: 'px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                    value: window.selectedEvent || '',
                    onChange: (e) => {
                        const newValue = e.target.value;
                        window.selectedEvent = newValue;
                        
                        try {
                            if (window.setSelectedEvent) window.setSelectedEvent(newValue);
                        } catch (error) {
                            // Silent fail
                        }
                        
                        // Trigger chart refresh
                        if (window.fetchChartDataFromAPI) {
                            window.fetchChartDataFromAPI();
                        }
                    }
                },
                    React.createElement('option', { value: '' }, 'Select Event'),
                    (window.appState?.leadsFilterOptions?.events || 
                     [...new Set((window.leads || []).map(lead => lead.lead_for_event).filter(Boolean))]
                    ).map(event =>
                        React.createElement('option', { key: event, value: event }, event)
                    )
                )
            )
        ),

        // Pie Charts Section with Loader
        React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-6' },
            // Lead Split Chart
            React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-6 rounded-lg shadow border' },
                React.createElement('h3', { className: 'text-lg font-semibold mb-4 text-gray-900 dark:text-white' }, 
                    'Lead Split'
                ),
                React.createElement('div', { className: 'relative h-64' },
                    // Show loader until chart is ready
                    React.createElement('div', {
                        id: 'leadSplitLoader',
                        className: 'absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800',
                        style: { zIndex: 10 }
                    },
                        React.createElement('div', { className: 'text-center' },
                            // Animated logo loader
                            React.createElement('div', {
                                className: 'relative w-24 h-24 mx-auto mb-4',
                                style: {
                                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                                }
                            },
                                React.createElement('img', {
                                    src: document.documentElement.classList.contains('dark') ? 'images/logo-dark.png' : 'images/logo.png',
                                    alt: 'Loading...',
                                    className: 'w-full h-full object-contain',
                                    style: {
                                        filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))',
                                        animation: 'float 3s ease-in-out infinite'
                                    }
                                })
                            ),
                            React.createElement('p', { 
                                className: 'text-sm text-gray-500 dark:text-gray-400',
                                style: {
                                    animation: 'fadeInOut 2s ease-in-out infinite'
                                }
                            }, 'Loading chart data...')
                        )
                    ),
                    React.createElement('canvas', { 
                        id: 'leadSplitChart',
                        className: 'w-full h-full'
                    })
                )
            ),

            // Temperature Count Chart
            React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-6 rounded-lg shadow border' },
                React.createElement('h3', { className: 'text-lg font-semibold mb-4 text-gray-900 dark:text-white' }, 
                    'Lead Temperature Count'
                ),
                React.createElement('div', { className: 'relative h-64' },
                    // Show loader until chart is ready
                    React.createElement('div', {
                        id: 'tempCountLoader',
                        className: 'absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800',
                        style: { zIndex: 10 }
                    },
                        React.createElement('div', { className: 'text-center' },
                            // Animated logo loader
                            React.createElement('div', {
                                className: 'relative w-24 h-24 mx-auto mb-4',
                                style: {
                                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                                    animationDelay: '0.5s'
                                }
                            },
                                React.createElement('img', {
                                    src: document.documentElement.classList.contains('dark') ? 'images/logo-dark.png' : 'images/logo.png',
                                    alt: 'Loading...',
                                    className: 'w-full h-full object-contain',
                                    style: {
                                        filter: 'drop-shadow(0 0 20px rgba(34, 197, 94, 0.5))',
                                        animation: 'float 3s ease-in-out infinite',
                                        animationDelay: '0.5s'
                                    }
                                })
                            ),
                            React.createElement('p', { 
                                className: 'text-sm text-gray-500 dark:text-gray-400',
                                style: {
                                    animation: 'fadeInOut 2s ease-in-out infinite',
                                    animationDelay: '0.5s'
                                }
                            }, 'Loading temperature data...')
                        )
                    ),
                    React.createElement('canvas', { 
                        id: 'tempCountChart',
                        className: 'w-full h-full'
                    })
                )
            ),

            // Temperature Value Chart
            React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-6 rounded-lg shadow border' },
                React.createElement('h3', { className: 'text-lg font-semibold mb-4 text-gray-900 dark:text-white' }, 
                    'Lead Temperature Value'
                ),
                React.createElement('div', { className: 'relative h-64' },
                    // Show loader until chart is ready
                    React.createElement('div', {
                        id: 'tempValueLoader',
                        className: 'absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800',
                        style: { zIndex: 10 }
                    },
                        React.createElement('div', { className: 'text-center' },
                            // Animated logo loader
                            React.createElement('div', {
                                className: 'relative w-24 h-24 mx-auto mb-4',
                                style: {
                                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                                    animationDelay: '1s'
                                }
                            },
                                React.createElement('img', {
                                    src: document.documentElement.classList.contains('dark') ? 'images/logo-dark.png' : 'images/logo.png',
                                    alt: 'Loading...',
                                    className: 'w-full h-full object-contain',
                                    style: {
                                        filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.5))',
                                        animation: 'float 3s ease-in-out infinite',
                                        animationDelay: '1s'
                                    }
                                })
                            ),
                            React.createElement('p', { 
                                className: 'text-sm text-gray-500 dark:text-gray-400',
                                style: {
                                    animation: 'fadeInOut 2s ease-in-out infinite',
                                    animationDelay: '1s'
                                }
                            }, 'Calculating values...')
                        )
                    ),
                    React.createElement('canvas', { 
                        id: 'tempValueChart',
                        className: 'w-full h-full'
                    })
                )
            )
        ),

        // Recent Activity Section
        window.renderEnhancedRecentActivity ? window.renderEnhancedRecentActivity() :
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow border' },
            React.createElement('div', { className: 'p-6 border-b border-gray-200 dark:border-gray-700' },
                React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 dark:text-white' }, 
                    'Recent Activity'
                )
            ),
            React.createElement('div', { className: 'p-6' },
                React.createElement('p', { className: 'text-gray-500 dark:text-gray-400 text-center' },
                    'Loading recent activity...'
                )
            )
        )
    );
};

// Wrapper function that renders the component
window.renderDashboardContent = () => {
    return React.createElement(DashboardComponent);
};

// ===============================================
// API-BASED CHART DATA FETCHING
// ===============================================

// Add debounce mechanism to prevent multiple simultaneous calls
window._chartDataFetchInProgress = false;
window._chartDataFetchDebounceTimer = null;
window._lastChartDataFetch = 0;

window.fetchChartDataFromAPI = async function(forceUpdate = false) {
    // Prevent calls within 2 seconds of each other
    const now = Date.now();
    if (now - window._lastChartDataFetch < 2000 && !forceUpdate) {
        console.log('📊 Chart data recently fetched, skipping...');
        return window.apiChartData || null;
    }
    
    // Debounce multiple rapid calls
    if (window._chartDataFetchDebounceTimer) {
        clearTimeout(window._chartDataFetchDebounceTimer);
    }
    
    return new Promise((resolve, reject) => {
        window._chartDataFetchDebounceTimer = setTimeout(async () => {
            // Prevent multiple simultaneous calls
            if (window._chartDataFetchInProgress && !forceUpdate) {
                console.log('📊 Chart data fetch already in progress, skipping...');
                resolve(window.apiChartData || null);
                return;
            }
            
            // Only proceed if we're on dashboard tab
            if (window.activeTab !== 'dashboard') {
                console.log('📊 Not on dashboard tab, skipping chart fetch');
                resolve(null);
                return;
            }
            
            window._chartDataFetchInProgress = true;
            window._lastChartDataFetch = Date.now();
            console.log('🚀 Fetching chart data from API...');
            
            try {
        // Build query parameters based on current filters
        const params = new URLSearchParams();
        
        if (window.dashboardFilter === 'salesPerson' && window.selectedSalesPerson) {
            params.append('filter_type', 'salesPerson');
            params.append('sales_person_id', window.selectedSalesPerson);
        } else if (window.dashboardFilter === 'event' && window.selectedEvent) {
            params.append('filter_type', 'event');
            params.append('event_name', window.selectedEvent);
        }
        
        // Fetch from API
        const response = await fetch(`${window.API_CONFIG.API_URL}/dashboard/charts?${params}`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('crm_auth_token'),
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch chart data');
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            console.log('✅ Chart data received:', result.data);
            
            // Store the data globally for chart updates
            window.apiChartData = result.data;
            
            // Update the charts with API data
            updateChartsFromAPIData(result.data);
            
            // ALWAYS update summary stats from API
            if (result.data.summary) {
                updateDashboardSummary(result.data.summary);
            }
            
            resolve(result.data);
            } else {
                throw new Error(result.error || 'Invalid response format');
            }
            
        } catch (error) {
            console.error('❌ Error fetching chart data:', error);
            
            // Show empty charts instead of falling back
            const emptyData = {
                charts: {
                    leadSplit: {
                        labels: ['Qualified', 'Junk'],
                        data: [0, 0],
                        colors: ['#10B981', '#EF4444']
                    },
                    temperatureCount: {
                        labels: ['Hot', 'Warm', 'Cold'],
                        data: [0, 0, 0],
                        colors: ['#EF4444', '#F59E0B', '#3B82F6']
                    },
                    temperatureValue: {
                        labels: ['Hot Value', 'Warm Value', 'Cold Value'],
                        data: [0, 0, 0],
                        colors: ['#EF4444', '#F59E0B', '#3B82F6']
                    }
                },
                summary: {
                    totalLeads: 0,
                    hotLeads: 0,
                    qualifiedLeads: 0,
                    totalPipelineValue: 0
                }
            };
            
            updateChartsFromAPIData(emptyData);
            updateDashboardSummary(emptyData.summary);
            reject(error);
        } finally {
            window._chartDataFetchInProgress = false;
        }
        
        }, 100); // 100ms debounce delay
    });
};

// ===============================================
// UPDATE CHARTS WITH API DATA
// ===============================================

window.updateChartsFromAPIData = function(apiData) {
    console.log('📊 Updating charts with API data...');
    
    // Prevent duplicate updates
    if (window._chartUpdateInProgress) {
        console.log('Chart update already in progress, skipping...');
        return;
    }
    
    window._chartUpdateInProgress = true;
    
    if (!apiData || !apiData.charts) {
        console.error('Invalid API data format');
        window._chartUpdateInProgress = false;
        return;
    }
    
    // Check if we're on the dashboard tab
    if (window.activeTab !== 'dashboard') {
        console.log('Not on dashboard tab, skipping chart creation');
        window._chartUpdateInProgress = false;
        return;
    }
    
    const { leadSplit, temperatureCount, temperatureValue } = apiData.charts;
    
    // Helper function to safely create a chart
    const createChart = (canvasId, chartType, chartData, chartOptions) => {
        console.log(`🔍 Looking for canvas: ${canvasId}`);
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.warn(`❌ Canvas ${canvasId} not found in DOM`);
            // Log what elements are actually available
            const allCanvases = document.querySelectorAll('canvas');
            console.log('📊 Available canvas elements:', Array.from(allCanvases).map(c => c.id));
            return null;
        }
        
        console.log(`✅ Found canvas ${canvasId}, creating chart...`);
        
        // Hide corresponding loader
        const loaderId = canvasId.replace('Chart', 'Loader');
        const loader = document.getElementById(loaderId);
        if (loader) {
            console.log(`🔄 Hiding loader: ${loaderId}`);
            loader.style.display = 'none';
        } else {
            console.warn(`⚠️ Loader ${loaderId} not found`);
        }
        
        // Destroy existing chart
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
            existingChart.destroy();
        }
        
        // Clear canvas
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Create new chart
        try {
            const newChart = new Chart(ctx, {
                type: chartType,
                data: chartData,
                options: {
                    ...chartOptions,
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 500
                    }
                }
            });
            
            return newChart;
        } catch (error) {
            console.error(`Error creating chart ${canvasId}:`, error);
            return null;
        }
    };
    
    // Delay to ensure DOM is ready with retry mechanism
    const attemptChartCreation = (retryCount = 0) => {
        const maxRetries = 5;
        const delay = 300 * (retryCount + 1); // Increasing delay: 300ms, 600ms, 900ms
        
        setTimeout(() => {
            console.log(`📊 Attempting chart creation (attempt ${retryCount + 1}/${maxRetries + 1})`);
            
            // Check if Chart.js is loaded
            if (typeof Chart === 'undefined') {
                console.error('❌ Chart.js is not loaded!');
                if (retryCount < maxRetries) {
                    attemptChartCreation(retryCount + 1);
                }
                return;
            }
            
            // Check if any canvas elements exist
            const canvasElements = document.querySelectorAll('#leadSplitChart, #tempCountChart, #tempValueChart');
            console.log(`📊 Found ${canvasElements.length}/3 canvas elements`);
            
            // Log the actual DOM structure for debugging
            const dashboardEl = document.querySelector('[data-active-tab="dashboard"]');
            console.log('📊 Dashboard element found:', !!dashboardEl);
            
            if (canvasElements.length === 0 && retryCount < maxRetries) {
                console.log(`⏳ No canvas elements found, retrying in ${300 * (retryCount + 2)}ms...`);
                attemptChartCreation(retryCount + 1);
                return;
            } else if (canvasElements.length === 0 && retryCount >= maxRetries) {
                console.error('❌ Failed to find canvas elements after all retries');
                // Hide all loaders as final fallback
                ['leadSplitLoader', 'tempCountLoader', 'tempValueLoader'].forEach(loaderId => {
                    const loader = document.getElementById(loaderId);
                    if (loader) {
                        loader.style.display = 'none';
                    }
                });
                window._chartUpdateInProgress = false;
                return;
            }
            
        try {
            // Create Lead Split Chart
            if (leadSplit) {
                createChart('leadSplitChart', 'doughnut', {
                    labels: leadSplit.labels.map((label, i) => 
                        `${label} (${leadSplit.data[i]})`
                    ),
                    datasets: [{
                        data: leadSplit.data,
                        backgroundColor: leadSplit.colors,
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                }, {
                    plugins: {
                        legend: { 
                            position: 'bottom',
                            labels: {
                                padding: 15,
                                usePointStyle: true
                            }
                        }
                    }
                });
                console.log('✅ Created Lead Split Chart');
            }
            
            // Create Temperature Count Chart
            if (temperatureCount) {
                createChart('tempCountChart', 'doughnut', {
                    labels: temperatureCount.labels.map((label, i) => 
                        `${label} (${temperatureCount.data[i]})`
                    ),
                    datasets: [{
                        data: temperatureCount.data,
                        backgroundColor: temperatureCount.colors,
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                }, {
                    plugins: {
                        legend: { 
                            position: 'bottom',
                            labels: {
                                padding: 15,
                                usePointStyle: true
                            }
                        }
                    }
                });
                console.log('✅ Created Temperature Count Chart');
            }
            
            // Create Temperature Value Chart
            if (temperatureValue) {
                createChart('tempValueChart', 'doughnut', {
                    labels: temperatureValue.labels.map((label, i) => {
                        const value = temperatureValue.data[i];
                        return `${label} (₹${value.toLocaleString('en-IN')})`;
                    }),
                    datasets: [{
                        data: temperatureValue.data,
                        backgroundColor: temperatureValue.colors,
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                }, {
                    plugins: {
                        legend: { 
                            position: 'bottom',
                            labels: {
                                padding: 15,
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    return `${label}: ₹${value.toLocaleString('en-IN')}`;
                                }
                            }
                        }
                    }
                });
                console.log('✅ Created Temperature Value Chart');
            }
            
            console.log('✅ All charts updated successfully');
            
        } catch (error) {
            console.error('❌ Error creating charts:', error);
            // Hide all loaders on error
            ['leadSplitLoader', 'tempCountLoader', 'tempValueLoader'].forEach(loaderId => {
                const loader = document.getElementById(loaderId);
                if (loader) {
                    loader.style.display = 'none';
                }
            });
        } finally {
            window._chartUpdateInProgress = false;
        }
        
        }, delay);
    };
    
    // Start the chart creation process
    attemptChartCreation();
};

// ===============================================
// UPDATE DASHBOARD SUMMARY WITH API DATA
// ===============================================

window.updateDashboardSummary = function(summary) {
    if (!summary) return;
    
    console.log('📊 Updating dashboard summary:', summary);
    
    // Update stat cards with API data
    const statElements = {
        'total-leads': summary.totalLeads,
        'hot-leads': summary.hotWarmLeads || summary.hotLeads, // Use hotWarmLeads if available, fallback to hotLeads
        'qualified-leads': summary.qualifiedLeads,
        'pipeline-value': summary.totalPipelineValue
    };
    
    Object.keys(statElements).forEach(stat => {
        const elements = document.querySelectorAll(`[data-stat="${stat}"]`);
        elements.forEach(element => {
            if (element && statElements[stat] !== undefined) {
                if (stat === 'pipeline-value') {
                    element.textContent = '₹' + statElements[stat].toLocaleString('en-IN');
                } else {
                    element.textContent = statElements[stat].toString();
                }
            }
        });
    });
    
    // Store summary data globally
    window.dashboardSummary = summary;
};

// Tab switching is now handled by the DashboardComponent
// This prevents duplicate chart initializations

// ===============================================
// DASHBOARD API INTEGRATION
// ===============================================

(function() {
    'use strict';
    
    console.log('📊 Dashboard API Integration: Loading...');
    
    // Dashboard initialization is now handled by the DashboardComponent useEffect
    // This prevents duplicate calls during page load
    
    console.log('✅ Dashboard API Integration loaded');
})();

console.log('✅ Dashboard component loaded - API driven version');
