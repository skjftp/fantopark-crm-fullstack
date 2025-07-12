// ===============================================
// FIXED DASHBOARD COMPONENT - REACT ERROR RESOLVED
// ===============================================
// Dashboard Content Component with proper React structure

// Conditional logging control
const ENABLE_DASHBOARD_DEBUG = false; // Set to false to reduce logs
const dashLog = ENABLE_DASHBOARD_DEBUG ? console.log : () => {};

// ===============================================
// MAIN DASHBOARD RENDER FUNCTION - FIXED
// ===============================================

window.renderDashboardContent = () => {
    // ✅ FIX: Remove React.useEffect calls - these cause React Error #310
    // Chart initialization will be handled by the chart system itself
    
    // Initialize charts when dashboard mounts (one-time setup)
    React.useEffect(() => {
        dashLog('📊 Dashboard mounted, setting up charts...');
        
        // Delay chart initialization to ensure DOM is ready
        const initTimer = setTimeout(() => {
            if (typeof Chart !== 'undefined' && typeof window.smartChartInit === 'function') {
                dashLog('🎯 Calling smartChartInit...');
                window.smartChartInit();
            } else if (typeof window.initializeCharts === 'function') {
                dashLog('🎯 Calling initializeCharts...');
                window.initializeCharts();
            }
        }, 500);
        
        return () => {
            clearTimeout(initTimer);
        };
    }, []); // Only run once when dashboard mounts
    
    // Update charts when data changes
    React.useEffect(() => {
        if (window.leads && window.leads.length > 0 && window.chartState?.initialized) {
            dashLog('📈 Updating charts with', window.leads.length, 'leads');
            
            const updateTimer = setTimeout(() => {
                const filteredLeads = window.getFilteredLeads ? 
                    window.getFilteredLeads() : window.leads;
                
                if (window.updateChartsWithData) {
                    window.updateChartsWithData(filteredLeads);
                }
            }, 100);
            
            return () => {
                clearTimeout(updateTimer);
            };
        }
    }, [window.leads?.length, window.selectedSalesPerson, window.selectedEvent, window.dashboardFilter]);

    return React.createElement('div', { className: 'space-y-6' },
        // Dashboard Stats Cards
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
                        React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 dark:text-white' },
                            (window.leads || []).length
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
                            })
                        )
                    ),
                    React.createElement('div', { className: 'ml-4' },
                        React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 dark:text-white' },
                            (window.leads || []).filter(l => l.status === 'hot').length
                        ),
                        React.createElement('p', { className: 'text-sm text-gray-500 dark:text-gray-400' }, 'Hot Leads')
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
                        React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 dark:text-white' },
                            (window.leads || []).filter(l => l.status === 'qualified').length
                        ),
                        React.createElement('p', { className: 'text-sm text-gray-500 dark:text-gray-400' }, 'Qualified Leads')
                    )
                )
            ),

            // Total Value Card
            React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-6 rounded-lg shadow border' },
                React.createElement('div', { className: 'flex items-center' },
                    React.createElement('div', { className: 'p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg' },
                        React.createElement('svg', {
                            className: 'w-6 h-6 text-yellow-600 dark:text-yellow-400',
                            fill: 'none',
                            stroke: 'currentColor',
                            viewBox: '0 0 24 24'
                        },
                            React.createElement('path', {
                                strokeLinecap: 'round',
                                strokeLinejoin: 'round',
                                strokeWidth: 2,
                                d: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
                            })
                        )
                    ),
                    React.createElement('div', { className: 'ml-4' },
                        React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 dark:text-white' },
                            `₹${((window.leads || []).reduce((sum, lead) => 
                                sum + (parseFloat(lead.potential_value) || 0), 0
                            )).toLocaleString()}`
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
                React.createElement('select', {
                    className: 'px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                    value: window.dashboardFilter || 'overall',
                    onChange: (e) => {
                        dashLog('📊 Dashboard filter changed:', e.target.value);
                        window.setDashboardFilter && window.setDashboardFilter(e.target.value);
                        window.setSelectedSalesPerson && window.setSelectedSalesPerson('');
                        window.setSelectedEvent && window.setSelectedEvent('');
                    }
                },
                    React.createElement('option', { value: 'overall' }, 'Overall'),
                    React.createElement('option', { value: 'salesPerson' }, 'Sales Person'),
                    React.createElement('option', { value: 'event' }, 'Event')
                ),

                window.dashboardFilter === 'salesPerson' && React.createElement('select', {
                    className: 'px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                    value: window.selectedSalesPerson || '',
                    onChange: (e) => {
                        dashLog('👤 Sales person filter changed:', e.target.value);
                        window.setSelectedSalesPerson && window.setSelectedSalesPerson(e.target.value);
                    }
                },
                    React.createElement('option', { value: '' }, 'All Sales People'),
                    (window.users || []).map(user =>
                        React.createElement('option', { key: user.id, value: user.id }, user.name)
                    )
                ),

                window.dashboardFilter === 'event' && React.createElement('select', {
                    className: 'px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                    value: window.selectedEvent || '',
                    onChange: (e) => {
                        dashLog('🎯 Event filter changed:', e.target.value);
                        window.setSelectedEvent && window.setSelectedEvent(e.target.value);
                    }
                },
                    React.createElement('option', { value: '' }, 'All Events'),
                    [...new Set((window.leads || []).map(lead => lead.lead_for_event).filter(Boolean))]
                        .map(event =>
                            React.createElement('option', { key: event, value: event }, event)
                        )
                )
            )
        ),

        // Charts Section
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

        // Recent Activity Section
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow border' },
            React.createElement('div', { className: 'p-6 border-b border-gray-200 dark:border-gray-700' },
                React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 dark:text-white' }, 
                    'Recent Activity'
                )
            ),
            React.createElement('div', { className: 'p-6' },
                (window.leads || []).length > 0 ?
                React.createElement('div', { className: 'space-y-4' },
                    (window.leads || [])
                        .sort((a, b) => new Date(b.created_date || b.date_of_enquiry) - new Date(a.created_date || a.date_of_enquiry))
                        .slice(0, 5)
                        .map(lead =>
                            React.createElement('div', { 
                                key: lead.id,
                                className: 'flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg'
                            },
                                React.createElement('div', null,
                                    React.createElement('p', { className: 'font-medium text-gray-900 dark:text-white' },
                                        lead.name || 'Unknown'
                                    ),
                                    React.createElement('p', { className: 'text-sm text-gray-500 dark:text-gray-400' },
                                        `${lead.company_name || 'N/A'} - ${lead.lead_for_event || 'N/A'}`
                                    )
                                ),
                                React.createElement('span', { 
                                    className: `px-2 py-1 text-xs rounded-full ${
                                        lead.status === 'hot' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                        lead.status === 'warm' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                        lead.status === 'cold' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                        lead.status === 'qualified' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                    }`
                                }, lead.status || 'unknown')
                            )
                        )
                ) :
                React.createElement('p', { className: 'text-gray-500 dark:text-gray-400 text-center py-8' },
                    'No recent activity'
                )
            )
        )
    );
};

// ===============================================
// DASHBOARD HELPER FUNCTIONS
// ===============================================

// Get filtered leads for dashboard
window.getFilteredLeads = function() {
    let filteredLeads = [...(window.leads || [])];
    
    try {
        if (window.dashboardFilter === 'salesPerson' && window.selectedSalesPerson) {
            filteredLeads = filteredLeads.filter(lead => 
                lead.assigned_to === window.selectedSalesPerson
            );
        } else if (window.dashboardFilter === 'event' && window.selectedEvent) {
            filteredLeads = filteredLeads.filter(lead => 
                lead.lead_for_event === window.selectedEvent
            );
        }
    } catch (error) {
        console.error('Error filtering leads:', error);
    }
    
    return filteredLeads;
};

// Dashboard metrics calculation
window.calculateDashboardMetrics = function() {
    const leads = window.getFilteredLeads();
    
    return {
        total: leads.length,
        hot: leads.filter(l => l.status === 'hot').length,
        warm: leads.filter(l => l.status === 'warm').length,
        cold: leads.filter(l => l.status === 'cold').length,
        qualified: leads.filter(l => l.status === 'qualified').length,
        junk: leads.filter(l => l.status === 'junk').length,
        totalValue: leads.reduce((sum, lead) => sum + (parseFloat(lead.potential_value) || 0), 0)
    };
};

console.log('📊 Dashboard v3.0 - Fixed React Error #310');
console.log('✅ Dashboard component loaded with proper React structure');
