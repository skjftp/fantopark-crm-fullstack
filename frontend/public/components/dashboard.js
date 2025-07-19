// ===============================================
// COMPLETE OPTIMIZED DASHBOARD COMPONENT
// Integrated with Backend API Chart Optimization
// Fixed: Chart visibility on tab switching
// Fixed: Recent Activity with API pagination
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

window.renderDashboardContent = () => {
    return React.createElement('div', { className: 'space-y-6' },
        // Dashboard Stats Cards - OPTIMIZED WITH DATA ATTRIBUTES
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-6 mb-6' },
            // Total Leads Card - UPDATED WITH DATA ATTRIBUTE
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
                            'data-stat': 'total-leads' // ✅ ADDED FOR API INTEGRATION
                        },
                            window.getFilteredLeads().length
                        ),
                        React.createElement('p', { className: 'text-sm text-gray-500 dark:text-gray-400' }, 'Total Leads')
                    )
                )
            ),

            // Hot Leads Card - UPDATED WITH DATA ATTRIBUTE
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
                            'data-stat': 'hot-leads' // ✅ ADDED FOR API INTEGRATION
                        },
                            window.getFilteredLeads()
                                .filter(l => (l.temperature || l.status || '').toLowerCase() === 'hot').length
                        ),
                        React.createElement('p', { className: 'text-sm text-gray-500 dark:text-gray-400' }, 'Hot Leads')
                    )
                )
            ),

            // Qualified Leads Card - UPDATED WITH DATA ATTRIBUTE
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
                            'data-stat': 'qualified-leads' // ✅ ADDED FOR API INTEGRATION
                        },
                            window.getFilteredLeads()
                                .filter(l => (l.status || '').toLowerCase() === 'qualified').length
                        ),
                        React.createElement('p', { className: 'text-sm text-gray-500 dark:text-gray-400' }, 'Qualified Leads')
                    )
                )
            ),

            // Pipeline Value Card - UPDATED WITH DATA ATTRIBUTE
            React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-6 rounded-lg shadow border' },
                React.createElement('div', { className: 'flex items-center' },
                    React.createElement('div', { className: 'p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg' },
                        React.createElement('span', { className: 'text-2xl' }, '₹')
                    ),
                    React.createElement('div', { className: 'ml-4' },
                        React.createElement('h3', { 
                            className: 'text-lg font-semibold text-gray-900 dark:text-white',
                            'data-stat': 'pipeline-value' // ✅ ADDED FOR API INTEGRATION
                        },
                            '₹' + (window.getFilteredLeads()
                                .filter(lead => !['converted', 'payment_received', 'dropped', 'junk'].includes(lead.status))
                                .reduce((sum, lead) => sum + (parseFloat(lead.potential_value) || 0), 0)
                                .toLocaleString('en-IN'))
                        ),
                        React.createElement('p', { className: 'text-sm text-gray-500 dark:text-gray-400' }, 'Total Pipeline Value')
                    )
                )
            )
        ),

        // Filters for pie charts - OPTIMIZED WITH CHART REFRESH
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6' },
            React.createElement('div', { className: 'flex items-center space-x-4 flex-wrap gap-2' },
                React.createElement('label', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'View by:'),
                
                // Main Filter Dropdown - UPDATED WITH CHART REFRESH
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
                        
                        // ✅ TRIGGER OPTIMIZED CHART REFRESH
                        if (window.handleChartFilterChange) {
                            window.handleChartFilterChange();
                        }
                        
                        if (window.setLoading) {
                            window.setLoading(true);
                            setTimeout(() => window.setLoading(false), 100);
                        }
                    }
                },
                    React.createElement('option', { value: 'overall' }, 'Overall'),
                    React.createElement('option', { value: 'salesPerson' }, 'By Sales Person'),
                    React.createElement('option', { value: 'event' }, 'By Event')
                ),

                // Sales Person Filter - UPDATED WITH CHART REFRESH
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
                        
                        // ✅ TRIGGER OPTIMIZED CHART REFRESH
                        if (window.handleChartFilterChange) {
                            window.handleChartFilterChange();
                        }
                    }
                },
                    React.createElement('option', { value: '' }, 'Select Sales Person'),
                    (window.users || []).map(user =>
                        React.createElement('option', { key: user.id, value: user.id }, user.name)
                    )
                ),

                // Event Filter - UPDATED WITH CHART REFRESH
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
                        
                        // ✅ TRIGGER OPTIMIZED CHART REFRESH
                        if (window.handleChartFilterChange) {
                            window.handleChartFilterChange();
                        }
                    }
                },
                    React.createElement('option', { value: '' }, 'Select Event'),
                    [...new Set((window.appState?.leads || window.leads || []).map(lead => lead.lead_for_event).filter(Boolean))].map(event =>
                        React.createElement('option', { key: event, value: event }, event)
                    )
                )
            )
        ),

        // Pie Charts Section - OPTIMIZED FOR BACKEND API
        React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-6' },
            // Lead Split Chart
            React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-6 rounded-lg shadow border' },
                React.createElement('h3', { className: 'text-lg font-semibold mb-4 text-gray-900 dark:text-white' }, 
                    'Lead Split'
                ),
                React.createElement('div', { className: 'relative h-64' },
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
                    React.createElement('canvas', { 
                        id: 'tempValueChart',
                        className: 'w-full h-full'
                    })
                )
            )
        ),

        // Enhanced Recent Activity Section
        window.renderEnhancedRecentActivity ? window.renderEnhancedRecentActivity() :
        // Fallback to basic Recent Activity if enhanced component not loaded
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow border' },
            React.createElement('div', { className: 'p-6 border-b border-gray-200 dark:border-gray-700' },
                React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 dark:text-white' }, 
                    'Recent Activity'
                )
            ),
            React.createElement('div', { className: 'p-6' },
                window.getFilteredLeads().length > 0 ?
                React.createElement('div', { className: 'space-y-4' },
                    window.getFilteredLeads()
                        .sort((a, b) => {
                            const dateA = new Date(b.updated_date || b.created_date || 0);
                            const dateB = new Date(a.updated_date || a.created_date || 0);
                            return dateA - dateB;
                        })
                        .slice(0, 5)
                        .map(lead =>
                            React.createElement('div', { 
                                key: lead.id, 
                                className: 'flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg' 
                            },
                                React.createElement('div', { className: 'flex-1' },
                                    React.createElement('p', { className: 'font-medium text-gray-900 dark:text-white' }, 
                                        lead.name || 'Unknown'
                                    ),
                                    React.createElement('p', { className: 'text-sm text-gray-500 dark:text-gray-400' }, 
                                        `${lead.status || 'No status'} • ${lead.phone || 'No phone'}`
                                    )
                                ),
                                React.createElement('span', { 
                                    className: `px-2 py-1 text-xs font-medium rounded-full ${
                                        (lead.status || '').toLowerCase() === 'qualified' ? 'bg-green-100 text-green-800' :
                                        (lead.status || '').toLowerCase() === 'hot' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`
                                }, 
                                    lead.status || 'Unknown'
                                )
                            )
                        )
                ) :
                React.createElement('p', { className: 'text-gray-500 dark:text-gray-400 text-center' },
                    'No recent activity to show'
                )
            )
        )
    );
};

// ===============================================
// DASHBOARD HELPER FUNCTIONS - OPTIMIZED
// ===============================================

window.getFilteredLeads = function() {
    // Use the actual leads data from appState or window.leads
    let allLeads = window.appState?.leads || window.leads || [];
    
    // If no filter is selected, return all leads
    if (!window.dashboardFilter || window.dashboardFilter === 'overall') {
        return allLeads;
    }
    
    // Apply filters based on dashboard selection
    let filteredLeads = [...allLeads];
    
    try {
        if (window.dashboardFilter === 'salesPerson' && window.selectedSalesPerson) {
            // Use the same ID to email mapping as the backend
            const selectedUser = (window.users || []).find(user => user.id === window.selectedSalesPerson);
            if (selectedUser) {
                const salesPersonEmail = selectedUser.email;
                filteredLeads = filteredLeads.filter(lead => lead.assigned_to === salesPersonEmail);
            }
        } else if (window.dashboardFilter === 'event' && window.selectedEvent) {
            filteredLeads = filteredLeads.filter(lead => 
                lead.lead_for_event === window.selectedEvent
            );
        }
    } catch (error) {
        console.warn('Filter error:', error);
    }
    
    return filteredLeads;
};

window.calculateDashboardMetrics = function() {
    const leads = window.getFilteredLeads();
    
    const getTemperature = (lead) => {
        let temp = lead.temperature || lead.status || '';
        return temp.toLowerCase();
    };
    
    return {
        total: leads.length,
        hot: leads.filter(l => getTemperature(l) === 'hot').length,
        warm: leads.filter(l => getTemperature(l) === 'warm').length,
        cold: leads.filter(l => getTemperature(l) === 'cold').length,
        qualified: leads.filter(l => (l.status || '').toLowerCase() === 'qualified').length,
        junk: leads.filter(l => (l.status || '').toLowerCase() === 'junk').length,
        totalValue: leads.reduce((sum, lead) => sum + (parseFloat(lead.potential_value) || 0), 0)
    };
};

// ===============================================
// API-BASED CHART DATA FETCHING
// ===============================================

window.fetchChartDataFromAPI = async function() {
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
            
            // Update summary stats if needed
            if (result.data.summary) {
                updateDashboardSummary(result.data.summary);
            }
            
            return result.data;
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
            }
        };
        
        updateChartsFromAPIData(emptyData);
        return null;
    }
};

// ===============================================
// FIXED: Update charts with API data - PREVENTS BLANK CHARTS ON TAB SWITCH
// ===============================================
window.updateChartsFromAPIData = function(apiData) {
    console.log('📊 Updating charts with API data (fixed version)...');
    
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
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.warn(`Canvas ${canvasId} not found`);
            return null;
        }
        
        // Check if canvas is visible
        if (canvas.offsetParent === null) {
            console.warn(`Canvas ${canvasId} is not visible, waiting...`);
            return null;
        }
        
        // Destroy existing chart from both sources
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
            existingChart.destroy();
        }
        
        // Also check our stored instances
        const instanceKey = canvasId.replace('Chart', '');
        if (window._dashboardChartInstances[instanceKey]) {
            window._dashboardChartInstances[instanceKey].destroy();
            window._dashboardChartInstances[instanceKey] = null;
        }
        
        // Clear canvas
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set canvas dimensions
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        
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
            
            // Store reference
            window._dashboardChartInstances[instanceKey] = newChart;
            
            return newChart;
        } catch (error) {
            console.error(`Error creating chart ${canvasId}:`, error);
            return null;
        }
    };
    
    // Delay to ensure DOM is ready
    setTimeout(() => {
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
        } finally {
            window._chartUpdateInProgress = false;
        }
        
    }, 100); // Small delay for DOM readiness
};

// Update dashboard summary with API data
window.updateDashboardSummary = function(summary) {
    if (!summary) return;
    
    console.log('📊 Updating dashboard summary:', summary);
    
    // Update stat cards with API data
    const statElements = {
        'total-leads': summary.totalLeads,
        'hot-leads': summary.hotLeads,
        'qualified-leads': summary.qualifiedLeads,
        'pipeline-value': summary.totalPipelineValue
    };
    
    Object.keys(statElements).forEach(stat => {
        const element = document.querySelector(`[data-stat="${stat}"]`);
        if (element && statElements[stat] !== undefined) {
            if (stat === 'pipeline-value') {
                element.textContent = '₹' + statElements[stat].toLocaleString('en-IN');
            } else {
                element.textContent = statElements[stat];
            }
        }
    });
    
    // Store summary data globally if needed
    window.dashboardSummary = summary;
};

// ===============================================
// DASHBOARD STATS API INTEGRATION
// ===============================================

// Fetch dashboard stats from API
window.fetchDashboardStats = async function() {
    console.log('📊 Fetching dashboard stats from API...');
    
    try {
        const response = await fetch(`${window.API_CONFIG.API_URL}/dashboard/stats`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('crm_auth_token'),
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch dashboard stats');
        }
        
        const result = await response.json();
        
        if (result.data) {
            console.log('✅ Dashboard stats received:', result.data);
            
            // Update the global dashboardStats
            window.dashboardStats = {
                totalLeads: result.data.totalLeads || 0,
                activeDeals: result.data.activeDeals || 0,
                totalInventory: result.data.totalInventory || 0,
                totalInventoryValue: result.data.totalInventoryValue || 0,
                pendingOrders: result.data.pendingOrders || 0,
                totalReceivables: result.data.totalReceivables || 0,
                thisMonthRevenue: result.data.thisMonthRevenue || 0,
                totalRevenue: result.data.totalRevenue || 0
            };
            
            // Trigger a re-render of the dashboard
            if (window.renderDashboard) {
                window.renderDashboard();
            }
            
            return window.dashboardStats;
        }
        
    } catch (error) {
        console.error('❌ Error fetching dashboard stats:', error);
        // Calculate stats locally as fallback
        console.log('⚠️ Falling back to local stats calculation');
        calculateLocalDashboardStats();
    }
};

// Calculate stats locally (fallback)
window.calculateLocalDashboardStats = function() {
    // This is a fallback method that calculates stats from local data
    const leads = window.appState?.leads || window.leads || [];
    const filtered = window.getFilteredLeads();
    
    window.dashboardStats = {
        totalLeads: filtered.length,
        activeDeals: filtered.filter(l => ['qualified', 'hot', 'warm'].includes(l.status)).length,
        totalInventory: 0, // Would need inventory data
        totalInventoryValue: 0, // Would need inventory data
        pendingOrders: 0, // Would need order data
        totalReceivables: 0, // Would need receivables data
        thisMonthRevenue: 0, // Would need payment data
        totalRevenue: 0 // Would need payment data
    };
};

// ===============================================
// CHART INITIALIZATION - API VERSION
// ===============================================

// Initialize charts when dashboard loads - API VERSION
window.initializeDashboardCharts = function() {
    console.log('🚀 Dashboard: Initializing charts with API data...');
    
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.warn('⏳ Chart.js not loaded yet, retrying...');
        setTimeout(window.initializeDashboardCharts, 500);
        return;
    }
    
    // Wait for DOM to be ready
    setTimeout(() => {
        // First, ensure chart containers exist
        const containers = ['leadSplitChart', 'tempCountChart', 'tempValueChart'];
        const allContainersExist = containers.every(id => document.getElementById(id));
        
        if (!allContainersExist) {
            console.warn('⏳ Chart containers not ready, retrying...');
            setTimeout(window.initializeDashboardCharts, 500);
            return;
        }
        
        // Directly fetch data from API and create charts
        window.fetchChartDataFromAPI().then(data => {
            if (data) {
                console.log('✅ Charts initialized with API data');
            } else {
                console.log('⚠️ No data received from API');
            }
        });
        
        // Also fetch dashboard stats
        window.fetchDashboardStats();
        
    }, 100);
};

// Create empty charts (skip loading state to avoid grey charts)
window.createEmptyCharts = function() {
    // Don't create empty charts - let the API data create them directly
    console.log('📊 Waiting for API data to create charts...');
};

// Handle chart filter changes
window.handleChartFilterChange = function() {
    console.log('🔄 Filter changed, refreshing charts...');
    
    // Fetch new chart data from API
    window.fetchChartDataFromAPI();
    
    // Also update dashboard stats if needed
    if (window.renderDashboard) {
        window.renderDashboard();
    }
};

// Override the existing chart update function to use API
window.updateChartsWithData = window.fetchChartDataFromAPI;

// ===============================================
// FIXED: TAB SWITCHING OBSERVER
// ===============================================
(function() {
    'use strict';
    
    console.log('📊 Initializing tab switching fix for dashboard charts...');
    
    // Store the original setActiveTab function
    const originalSetActiveTab = window.setActiveTab;
    
    // Flag to track dashboard visibility
    window._dashboardWasVisible = false;
    
    // Override setActiveTab to handle chart recreation
    window.setActiveTab = function(tab) {
        const previousTab = window.activeTab;
        
        // Call original function
        if (originalSetActiveTab) {
            originalSetActiveTab(tab);
        }
        
        // If switching TO dashboard from another tab
        if (tab === 'dashboard' && previousTab !== 'dashboard') {
            console.log('📊 Switching to dashboard tab, scheduling chart refresh...');
            
            // Clear any existing chart instances
            Object.values(window._dashboardChartInstances).forEach(chart => {
                if (chart) {
                    chart.destroy();
                }
            });
            window._dashboardChartInstances = {
                leadSplit: null,
                tempCount: null,
                tempValue: null
            };
            
            // Schedule chart recreation after tab animation
            setTimeout(() => {
                // Double-check we're still on dashboard
                if (window.activeTab === 'dashboard' && window.fetchChartDataFromAPI) {
                    console.log('📊 Recreating dashboard charts...');
                    window.fetchChartDataFromAPI().then(() => {
                        console.log('✅ Dashboard charts recreated successfully');
                    }).catch(error => {
                        console.error('❌ Error recreating charts:', error);
                    });
                }
            }, 300); // Adjust based on your tab animation duration
        }
        
        // If switching AWAY from dashboard
        if (previousTab === 'dashboard' && tab !== 'dashboard') {
            console.log('📊 Leaving dashboard tab');
            window._dashboardWasVisible = true;
        }
    };
    
    // Also add mutation observer as backup
    document.addEventListener('DOMContentLoaded', () => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && 
                    (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
                    
                    const target = mutation.target;
                    if ((target.getAttribute('data-tab') === 'dashboard' || 
                         target.classList.contains('dashboard-content')) &&
                        window.activeTab === 'dashboard' &&
                        window._dashboardWasVisible) {
                        
                        // Dashboard became visible again
                        window._dashboardWasVisible = false;
                        console.log('📊 Dashboard visibility changed, refreshing charts...');
                        
                        setTimeout(() => {
                            if (window.fetchChartDataFromAPI) {
                                window.fetchChartDataFromAPI();
                            }
                        }, 200);
                    }
                }
            });
        });
        
        // Start observing
        const mainContent = document.querySelector('.flex-1.overflow-auto') || 
                           document.querySelector('main') || 
                           document.body;
        
        if (mainContent) {
            observer.observe(mainContent, {
                attributes: true,
                attributeFilter: ['style', 'class'],
                subtree: true
            });
        }
    });
    
    console.log('✅ Tab switching fix initialized');
})();

// ===============================================
// MOBILE RESPONSIVE DASHBOARD
// ===============================================

window.renderResponsiveDashboard = () => {
    const { 
        dashboardStats, 
        dashboardFilter, 
        selectedSalesPerson, 
        selectedEvent,
        events,
        salesPeople,
        leads 
    } = window.appState;
    
    return React.createElement('div', { className: 'space-y-4 md:space-y-6' },
        // Dashboard Header - Stack on mobile
        React.createElement('div', { className: 'flex flex-col md:flex-row md:items-center md:justify-between gap-4' },
            React.createElement('h2', { className: 'text-xl md:text-2xl font-bold' }, 'Dashboard Overview'),
            
            // Filters - Stack vertically on mobile
            React.createElement('div', { className: 'flex flex-col sm:flex-row gap-2' },
                // Filter Type Selector
                React.createElement('select', {
                    value: dashboardFilter,
                    onChange: (e) => window.handleDashboardFilterChange(e.target.value),
                    className: 'px-3 py-2 border rounded-md text-sm w-full sm:w-auto'
                },
                    React.createElement('option', { value: 'overall' }, 'Overall'),
                    React.createElement('option', { value: 'salesPerson' }, 'By Sales Person'),
                    React.createElement('option', { value: 'event' }, 'By Event')
                ),
                
                // Conditional filters
                dashboardFilter === 'salesPerson' && React.createElement('select', {
                    value: selectedSalesPerson,
                    onChange: (e) => window.setSelectedSalesPerson(e.target.value),
                    className: 'px-3 py-2 border rounded-md text-sm w-full sm:w-auto'
                },
                    React.createElement('option', { value: '' }, 'Select Sales Person'),
                    salesPeople.map(person => 
                        React.createElement('option', { key: person.id, value: person.id }, person.name)
                    )
                ),
                
                dashboardFilter === 'event' && React.createElement('select', {
                    value: selectedEvent,
                    onChange: (e) => window.setSelectedEvent(e.target.value),
                    className: 'px-3 py-2 border rounded-md text-sm w-full sm:w-auto'
                },
                    React.createElement('option', { value: '' }, 'Select Event'),
                    events.map(event => 
                        React.createElement('option', { key: event, value: event }, event)
                    )
                )
            )
        ),
        
        // Stats Cards - Responsive Grid
        React.createElement('div', { 
            className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4'
        },
            // Total Leads Card
            React.createElement('div', { 
                className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6'
            },
                React.createElement('div', { className: 'flex items-center justify-between' },
                    React.createElement('div', null,
                        React.createElement('p', { className: 'text-sm text-gray-500' }, 'Total Leads'),
                        React.createElement('p', { className: 'text-xl md:text-2xl font-bold' }, 
                            dashboardStats.totalLeads || 0
                        )
                    ),
                    React.createElement('span', { className: 'text-2xl md:text-3xl' }, '👥')
                )
            ),
            
            // Active Deals Card
            React.createElement('div', { 
                className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6'
            },
                React.createElement('div', { className: 'flex items-center justify-between' },
                    React.createElement('div', null,
                        React.createElement('p', { className: 'text-sm text-gray-500' }, 'Active Deals'),
                        React.createElement('p', { className: 'text-xl md:text-2xl font-bold' }, 
                            dashboardStats.activeDeals || 0
                        )
                    ),
                    React.createElement('span', { className: 'text-2xl md:text-3xl' }, '💼')
                )
            ),
            
            // Revenue Card
            React.createElement('div', { 
                className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6'
            },
                React.createElement('div', { className: 'flex items-center justify-between' },
                    React.createElement('div', null,
                        React.createElement('p', { className: 'text-sm text-gray-500' }, 'This Month Revenue'),
                        React.createElement('p', { className: 'text-xl md:text-2xl font-bold' }, 
                            `₹${(dashboardStats.thisMonthRevenue || 0).toLocaleString('en-IN')}`
                        )
                    ),
                    React.createElement('span', { className: 'text-2xl md:text-3xl' }, '💰')
                )
            ),
            
            // Pending Deliveries Card
            React.createElement('div', { 
                className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6'
            },
                React.createElement('div', { className: 'flex items-center justify-between' },
                    React.createElement('div', null,
                        React.createElement('p', { className: 'text-sm text-gray-500' }, 'Pending Deliveries'),
                        React.createElement('p', { className: 'text-xl md:text-2xl font-bold' }, 
                            dashboardStats.pendingDeliveries || 0
                        )
                    ),
                    React.createElement('span', { className: 'text-2xl md:text-3xl' }, '🚚')
                )
            ),
            
            // Inventory Value Card
            React.createElement('div', { 
                className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6'
            },
                React.createElement('div', { className: 'flex items-center justify-between' },
                    React.createElement('div', null,
                        React.createElement('p', { className: 'text-sm text-gray-500' }, 'Inventory Value'),
                        React.createElement('p', { className: 'text-xl md:text-2xl font-bold' }, 
                            `₹${(dashboardStats.inventoryValue || 0).toLocaleString('en-IN')}`
                        )
                    ),
                    React.createElement('span', { className: 'text-2xl md:text-3xl' }, '📦')
                )
            )
        ),
        
        // Charts Section - Stack on mobile
        React.createElement('div', { 
            className: 'grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6'
        },
            // Lead Split Chart
            React.createElement('div', { 
                className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6'
            },
                React.createElement('h3', { className: 'text-base md:text-lg font-semibold mb-4' }, 'Lead Split'),
                React.createElement('div', { className: 'h-48 md:h-64' },
                    React.createElement('canvas', { 
                        id: 'leadSplitChart',
                        className: 'max-w-full'
                    })
                )
            ),
            
            // Temperature Count Chart
            React.createElement('div', { 
                className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6'
            },
                React.createElement('h3', { className: 'text-base md:text-lg font-semibold mb-4' }, 'Lead Temperature Count'),
                React.createElement('div', { className: 'h-48 md:h-64' },
                    React.createElement('canvas', { 
                        id: 'tempCountChart',
                        className: 'max-w-full'
                    })
                )
            ),
            
            // Temperature Value Chart
            React.createElement('div', { 
                className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6'
            },
                React.createElement('h3', { className: 'text-base md:text-lg font-semibold mb-4' }, 'Lead Temperature Value'),
                React.createElement('div', { className: 'h-48 md:h-64' },
                    React.createElement('canvas', { 
                        id: 'tempValueChart',
                        className: 'max-w-full'
                    })
                )
            )
        ),
        
        // Recent Activity - Mobile optimized table
        React.createElement('div', { 
            className: 'bg-white dark:bg-gray-800 rounded-lg shadow'
        },
            React.createElement('div', { className: 'p-4 md:p-6 border-b' },
                React.createElement('h3', { className: 'text-base md:text-lg font-semibold' }, 'Recent Activity')
            ),
            React.createElement('div', { className: 'overflow-x-auto' },
                window.renderRecentActivity && window.renderRecentActivity()
            )
        )
    );
};

// Override dashboard renderer
window.dashboardResponsiveOverride = () => {
    const originalRenderDashboard = window.renderDashboard;
    window.renderDashboard = window.renderResponsiveDashboard || originalRenderDashboard;
};

// ===============================================
// RECENT ACTIVITY RENDER FUNCTION
// ===============================================

window.renderRecentActivity = function() {
    const leads = window.getFilteredLeads();
    
    // Format relative time
    const formatRelativeTime = (dateString) => {
        if (!dateString) return 'No date';
        
        try {
            let date;
            
            // Handle different date formats
            if (typeof dateString === 'object' && dateString._seconds) {
                // Firestore timestamp
                date = new Date(dateString._seconds * 1000);
            } else if (typeof dateString === 'string' || typeof dateString === 'number') {
                date = new Date(dateString);
            } else {
                return 'Invalid date';
            }
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }
            
            const now = new Date();
            const diffMs = now - date;
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffMinutes < 1) return 'Just now';
            if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
            if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
            if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
            
            // For older dates, show the actual date
            return date.toLocaleDateString();
            
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
        }
    };
    
    // Get recent leads sorted by last activity
    const recentLeads = leads
        .filter(lead => lead && (lead.updated_date || lead.created_date))
        .sort((a, b) => {
            const dateA = new Date(a.updated_date || a.created_date || 0);
            const dateB = new Date(b.updated_date || b.created_date || 0);
            return dateB - dateA;
        })
        .slice(0, 10);
    
    if (recentLeads.length === 0) {
        return React.createElement('div', { className: 'p-6 text-center text-gray-500' },
            'No recent activity to display'
        );
    }
    
    return React.createElement('div', { className: 'overflow-x-auto' },
        React.createElement('table', { className: 'min-w-full divide-y divide-gray-200' },
            React.createElement('thead', { className: 'bg-gray-50' },
                React.createElement('tr', null,
                    React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Name'),
                    React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Company'),
                    React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Status'),
                    React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Last Activity')
                )
            ),
            React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
                recentLeads.map(lead =>
                    React.createElement('tr', { 
                        key: lead.id, 
                        className: 'hover:bg-gray-50 cursor-pointer',
                        onClick: () => window.openLeadDetail && window.openLeadDetail(lead)
                    },
                        React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900' },
                            lead.name || 'Unknown'
                        ),
                        React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-500' },
                            lead.company || '-'
                        ),
                        React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                            React.createElement('span', {
                                className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                                    lead.status === 'hot' ? 'bg-red-100 text-red-800' :
                                    lead.status === 'warm' ? 'bg-yellow-100 text-yellow-800' :
                                    lead.status === 'cold' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                }`
                            }, lead.status || 'unknown')
                        ),
                        React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-500' },
                            formatRelativeTime(lead.updated_date || lead.created_date)
                        )
                    )
                )
            )
        )
    );
};

// ===============================================
// OPTIMIZED DASHBOARD CHART FIX - SINGLE RENDER
// ===============================================

(function() {
  'use strict';
  
  console.log('📊 Loading optimized dashboard chart fix...');
  
  // State tracking to prevent multiple renders
  window._dashboardChartState = {
    rendered: false,
    rendering: false,
    lastRenderTime: 0,
    renderTimeout: null
  };
  
  // Debounced chart creation to prevent multiple renders
  window.createDashboardChartsOnce = function(apiData) {
    // Prevent concurrent renders
    if (window._dashboardChartState.rendering) {
      console.log('📊 Chart render already in progress, skipping...');
      return;
    }
    
    // Prevent re-rendering within 5 seconds
    const now = Date.now();
    if (window._dashboardChartState.lastRenderTime && 
        (now - window._dashboardChartState.lastRenderTime) < 5000) {
      console.log('📊 Charts recently rendered, skipping...');
      return;
    }
    
    // Check if charts already exist
    const chartsExist = ['leadSplitChart', 'tempCountChart', 'tempValueChart'].every(id => {
      const canvas = document.getElementById(id);
      return canvas && Chart.getChart(canvas);
    });
    
    if (chartsExist) {
      console.log('📊 Charts already exist, skipping render...');
      window._dashboardChartState.rendered = true;
      return;
    }
    
    // Use stored data if no apiData provided
    if (!apiData && window.apiChartData) {
      apiData = window.apiChartData;
    }
    
    if (!apiData || !apiData.charts) {
      console.log('📊 No chart data available');
      return;
    }
    
    console.log('📊 Creating dashboard charts (single render)...');
    window._dashboardChartState.rendering = true;
    
    const { leadSplit, temperatureCount, temperatureValue } = apiData.charts;
    
    // Destroy any existing charts first
    ['leadSplitChart', 'tempCountChart', 'tempValueChart'].forEach(id => {
      const canvas = document.getElementById(id);
      if (canvas) {
        const chart = Chart.getChart(canvas);
        if (chart) {
          chart.destroy();
        }
      }
    });
    
    try {
      // Create Lead Split Chart
      const canvas1 = document.getElementById('leadSplitChart');
      if (canvas1 && leadSplit) {
        new Chart(canvas1, {
          type: 'doughnut',
          data: {
            labels: leadSplit.labels.map((label, i) => `${label} (${leadSplit.data[i]})`),
            datasets: [{
              data: leadSplit.data,
              backgroundColor: leadSplit.colors || ['#10B981', '#EF4444'],
              borderWidth: 2,
              borderColor: '#fff'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 500 },
            plugins: {
              legend: { position: 'bottom' }
            }
          }
        });
      }
      
      // Create Temperature Count Chart
      const canvas2 = document.getElementById('tempCountChart');
      if (canvas2 && temperatureCount) {
        new Chart(canvas2, {
          type: 'doughnut',
          data: {
            labels: temperatureCount.labels.map((label, i) => `${label} (${temperatureCount.data[i]})`),
            datasets: [{
              data: temperatureCount.data,
              backgroundColor: temperatureCount.colors || ['#EF4444', '#F59E0B', '#3B82F6'],
              borderWidth: 2,
              borderColor: '#fff'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 500 },
            plugins: {
              legend: { position: 'bottom' }
            }
          }
        });
      }
      
      // Create Temperature Value Chart
      const canvas3 = document.getElementById('tempValueChart');
      if (canvas3 && temperatureValue) {
        new Chart(canvas3, {
          type: 'doughnut',
          data: {
            labels: temperatureValue.labels.map((label, i) => {
              const value = temperatureValue.data[i];
              return `${label} (₹${value.toLocaleString('en-IN')})`;
            }),
            datasets: [{
              data: temperatureValue.data,
              backgroundColor: temperatureValue.colors || ['#EF4444', '#F59E0B', '#3B82F6'],
              borderWidth: 2,
              borderColor: '#fff'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 500 },
            plugins: {
              legend: { position: 'bottom' },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const value = context.parsed || 0;
                    return `₹${value.toLocaleString('en-IN')}`;
                  }
                }
              }
            }
          }
        });
      }
      
      console.log('✅ Dashboard charts created successfully');
      window._dashboardChartState.rendered = true;
      window._dashboardChartState.lastRenderTime = Date.now();
      
    } catch (error) {
      console.error('❌ Error creating charts:', error);
    } finally {
      window._dashboardChartState.rendering = false;
    }
  };
  
  // Simple tab change detection
  let previousTab = window.activeTab;
  let tabCheckInterval = setInterval(() => {
    if (window.activeTab !== previousTab) {
      const wasNotDashboard = previousTab !== 'dashboard';
      previousTab = window.activeTab;
      
      if (window.activeTab === 'dashboard' && wasNotDashboard) {
        console.log('📊 Switched to dashboard tab');
        
        // Reset render state when entering dashboard
        window._dashboardChartState.rendered = false;
        
        // Single delayed call to fetch data
        setTimeout(() => {
          if (window.activeTab === 'dashboard' && window.fetchChartDataFromAPI) {
            console.log('📊 Fetching chart data...');
            window.fetchChartDataFromAPI();
          }
        }, 300);
      }
    }
  }, 100);
  
  // Manual refresh function (resets the render state)
  window.refreshDashboardCharts = function() {
    console.log('📊 Manual refresh requested');
    window._dashboardChartState.rendered = false;
    window._dashboardChartState.lastRenderTime = 0;
    
    if (window.fetchChartDataFromAPI) {
      window.fetchChartDataFromAPI();
    } else if (window.apiChartData) {
      window.createDashboardChartsOnce(window.apiChartData);
    }
  };
  
  // Clean up function
  window.cleanupDashboardChartFix = function() {
    if (tabCheckInterval) {
      clearInterval(tabCheckInterval);
    }
    if (window._dashboardChartState.renderTimeout) {
      clearTimeout(window._dashboardChartState.renderTimeout);
    }
  };
  
  console.log('✅ Optimized dashboard chart fix loaded (single render)');
})();

// ===============================================
// DASHBOARD API FIX
// ===============================================

(function() {
  'use strict';
  
  console.log('📊 Dashboard API Fix: Ensuring dashboard uses API for stats and charts');
  
  // Override the calculateDashboardStats to always use API
  window.calculateDashboardStats = async function() {
    console.log('📊 Dashboard: Fetching stats from API (not calculating locally)');
    
    try {
      // Fetch stats from API
      await window.fetchDashboardStats();
      
      // Extract filters for chart data
      await window.extractFiltersData();
      
      // Trigger a re-render if needed
      if (window.renderDashboard) {
        window.renderDashboard();
      }
    } catch (error) {
      console.error('❌ Error in calculateDashboardStats:', error);
    }
  };
  
  // Override extractFiltersData to work with API
  window.extractFiltersData = async function() {
    console.log('📊 Extracting filter data for dashboard');
    
    try {
      // Fetch filter options from the leads API if available
      if (window.LeadsAPI && window.LeadsAPI.fetchFilterOptions) {
        const filterOptions = await window.LeadsAPI.fetchFilterOptions();
        
        if (filterOptions) {
          // Set events
          const events = filterOptions.events || [];
          if (window.appState.setEvents) {
            window.appState.setEvents(events);
          }
          
          // Set sales people
          const salesUsers = (filterOptions.users || []).filter(u => 
            u.role === 'sales_executive' || u.role === 'sales_manager'
          );
          if (window.appState.setSalesPeople) {
            window.appState.setSalesPeople(salesUsers);
          }
        }
      } else {
        // Fallback to using whatever data is available
        const users = window.appState.users || window.users || [];
        const salesUsers = users.filter(u => 
          u.role === 'sales_executive' || u.role === 'sales_manager'
        );
        if (window.appState.setSalesPeople) {
          window.appState.setSalesPeople(salesUsers);
        }
      }
    } catch (error) {
      console.error('❌ Error extracting filter data:', error);
    }
  };
  
  // Ensure dashboard initializes with API data when switching to dashboard tab
  const originalSetActiveTab = window.setActiveTab;
  if (originalSetActiveTab) {
    window.setActiveTab = function(tab) {
      originalSetActiveTab(tab);
      
      if (tab === 'dashboard') {
        console.log('📊 Switched to dashboard tab, fetching API data...');
        
        // Add a small delay to ensure DOM is ready
        setTimeout(async () => {
          // Fetch dashboard stats
          if (window.fetchDashboardStats) {
            await window.fetchDashboardStats();
          }
          
          // Fetch chart data
          if (window.fetchChartDataFromAPI) {
            await window.fetchChartDataFromAPI();
          }
          
          // Extract filter data
          if (window.extractFiltersData) {
            await window.extractFiltersData();
          }
        }, 300);
      }
    };
  }
  
  // Initialize dashboard with API data on page load
  document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the dashboard tab
    if (window.appState && window.appState.activeTab === 'dashboard') {
      console.log('📊 Dashboard active on load, initializing with API data...');
      
      setTimeout(async () => {
        // Fetch all dashboard data
        try {
          await window.fetchDashboardStats();
          await window.fetchChartDataFromAPI();
          await window.extractFiltersData();
        } catch (error) {
          console.error('❌ Error initializing dashboard:', error);
        }
      }, 1000);
    }
  });
  
  // Ensure updateCharts always uses API
  window.updateCharts = async function(filteredLeads) {
    console.log('📊 updateCharts called - redirecting to API fetch');
    
    // Ignore the passed filteredLeads and use API instead
    if (window.fetchChartDataFromAPI) {
      await window.fetchChartDataFromAPI();
    }
  };
  
  console.log('✅ Dashboard API fix loaded - dashboard will now use API for all data');
})();

console.log('✅ API-based dashboard system with tab switching fix loaded');
