// ===============================================
// OPTIMIZED DASHBOARD COMPONENT - PERFORMANCE ENHANCED
// ===============================================
// Dashboard Content Component with fast chart loading and reduced logging

// Conditional logging control
const ENABLE_DASHBOARD_DEBUG = false; // Set to false to reduce logs
const dashLog = ENABLE_DASHBOARD_DEBUG ? console.log : () => {};

// ===============================================
// MAIN DASHBOARD RENDER FUNCTION - OPTIMIZED
// ===============================================

window.renderDashboardContent = () => {
    // Initialize charts only once when dashboard loads
    React.useEffect(() => {
        if (typeof Chart !== 'undefined') {
            dashLog('📊 Initializing dashboard charts...');
            // Use the optimized chart initialization
            setTimeout(() => {
                window.initializeCharts();
            }, 100);
        }
    }, []); // Only run once on mount

    // Update charts when leads data changes
    React.useEffect(() => {
        if (window.leads && window.leads.length > 0) {
            dashLog('📈 Updating charts with', window.leads.length, 'leads');
            // Use throttled chart update
            setTimeout(() => {
                const filteredLeads = window.getFilteredLeads ? window.getFilteredLeads() : window.leads;
                window.updateChartsWithData(filteredLeads);
            }, 200);
        }
    }, [window.leads, window.selectedSalesPerson, window.selectedEvent, window.dashboardFilter]);

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
                            fill: 'currentColor',
                            viewBox: '0 0 20 20'
                        },
                            React.createElement('path', {
                                fillRule: 'evenodd',
                                d: 'M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z',
                                clipRule: 'evenodd'
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

        // Filters for pie charts - OPTIMIZED
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
                    React.createElement('option', { value: '' }, 'Select Sales Person'),
                    (window.salesPeople || []).map(sp => 
                        React.createElement('option', { key: sp.id, value: sp.email }, sp.name)
                    )
                ),

                window.dashboardFilter === 'event' && React.createElement('select', {
                    className: 'px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                    value: window.selectedEvent || '',
                    onChange: (e) => {
                        dashLog('🎪 Event filter changed:', e.target.value);
                        window.setSelectedEvent && window.setSelectedEvent(e.target.value);
                    }
                },
                    React.createElement('option', { value: '' }, 'Select Event'),
                    (window.events || []).map(event => 
                        React.createElement('option', { key: event, value: event }, event)
                    )
                )
            )
        ),

        // Pie Charts Section - OPTIMIZED WITH FIXED HEIGHT
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-6 mb-8' },
            // Lead Split Chart
            React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-6 rounded-lg shadow border' },
                React.createElement('h3', { className: 'text-lg font-medium mb-4 text-gray-900 dark:text-white text-center' }, 
                    'Lead Quality Split'
                ),
                React.createElement('div', { 
                    style: { height: '250px', position: 'relative' },
                    className: 'flex items-center justify-center'
                },
                    React.createElement('canvas', { 
                        id: 'leadSplitChart',
                        style: { maxHeight: '250px', maxWidth: '100%' }
                    })
                )
            ),

            // Temperature Count Chart
            React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-6 rounded-lg shadow border' },
                React.createElement('h3', { className: 'text-lg font-medium mb-4 text-gray-900 dark:text-white text-center' }, 
                    'Lead Temperature Count'
                ),
                React.createElement('div', { 
                    style: { height: '250px', position: 'relative' },
                    className: 'flex items-center justify-center'
                },
                    React.createElement('canvas', { 
                        id: 'tempCountChart',
                        style: { maxHeight: '250px', maxWidth: '100%' }
                    })
                )
            ),

            // Temperature Value Chart
            React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-6 rounded-lg shadow border' },
                React.createElement('h3', { className: 'text-lg font-medium mb-4 text-gray-900 dark:text-white text-center' }, 
                    'Lead Temperature Value'
                ),
                React.createElement('div', { 
                    style: { height: '250px', position: 'relative' },
                    className: 'flex items-center justify-center'
                },
                    React.createElement('canvas', { 
                        id: 'tempValueChart',
                        style: { maxHeight: '250px', maxWidth: '100%' }
                    })
                )
            )
        ),

        // Recent Leads Section - OPTIMIZED
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow border' },
            React.createElement('div', { className: 'px-6 py-4 border-b border-gray-200 dark:border-gray-700' },
                React.createElement('h3', { className: 'text-lg font-medium text-gray-900 dark:text-white' }, 
                    'Recent Leads'
                )
            ),
            React.createElement('div', { className: 'p-6' },
                (window.leads && window.leads.length > 0) ? 
                    React.createElement('div', { className: 'space-y-4' },
                        window.leads.slice(0, 5).map(lead => 
                            React.createElement('div', { 
                                key: lead.id,
                                className: 'flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer',
                                onClick: () => {
                                    dashLog('🔍 Opening lead detail:', lead.name);
                                    window.openLeadDetail && window.openLeadDetail(lead);
                                }
                            },
                                React.createElement('div', { className: 'flex items-center space-x-4' },
                                    React.createElement('div', { 
                                        className: `w-3 h-3 rounded-full ${
                                            lead.status === 'hot' ? 'bg-red-500' :
                                            lead.status === 'warm' ? 'bg-yellow-500' :
                                            lead.status === 'cold' ? 'bg-blue-500' :
                                            lead.status === 'qualified' ? 'bg-green-500' :
                                            'bg-gray-400'
                                        }`
                                    }),
                                    React.createElement('div', null,
                                        React.createElement('h4', { className: 'font-medium text-gray-900 dark:text-white' }, 
                                            lead.name
                                        ),
                                        React.createElement('p', { className: 'text-sm text-gray-500 dark:text-gray-400' }, 
                                            lead.email
                                        )
                                    )
                                ),
                                React.createElement('div', { className: 'text-right' },
                                    React.createElement('span', { 
                                        className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            lead.status === 'hot' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                                            lead.status === 'warm' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                                            lead.status === 'cold' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                                            lead.status === 'qualified' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                                            'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
                                        }`
                                    }, lead.status || 'new'),
                                    React.createElement('p', { className: 'text-sm text-gray-500 dark:text-gray-400 mt-1' },
                                        `₹${(lead.potential_value || 0).toLocaleString()}`
                                    )
                                )
                            )
                        )
                    ) :
                    React.createElement('div', { className: 'text-center py-8' },
                        React.createElement('svg', {
                            className: 'mx-auto h-12 w-12 text-gray-400',
                            fill: 'none',
                            viewBox: '0 0 24 24',
                            stroke: 'currentColor'
                        },
                            React.createElement('path', {
                                strokeLinecap: 'round',
                                strokeLinejoin: 'round',
                                strokeWidth: 2,
                                d: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
                            })
                        ),
                        React.createElement('h3', { className: 'mt-2 text-sm font-medium text-gray-900 dark:text-white' }, 
                            'No leads yet'
                        ),
                        React.createElement('p', { className: 'mt-1 text-sm text-gray-500 dark:text-gray-400' }, 
                            'Get started by adding your first lead'
                        )
                    )
            )
        ),

        // Quick Actions Section
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-6' },
            React.createElement('div', { className: 'bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white' },
                React.createElement('h3', { className: 'text-lg font-medium mb-2' }, 'Add New Lead'),
                React.createElement('p', { className: 'text-blue-100 mb-4' }, 'Quickly add a new lead to your pipeline'),
                React.createElement('button', {
                    onClick: () => {
                        dashLog('🆕 Opening add lead form');
                        window.openAddForm && window.openAddForm();
                    },
                    className: 'bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 transition-colors font-medium'
                }, 'Add Lead')
            ),

            React.createElement('div', { className: 'bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white' },
                React.createElement('h3', { className: 'text-lg font-medium mb-2' }, 'View Inventory'),
                React.createElement('p', { className: 'text-green-100 mb-4' }, 'Check available events and tickets'),
                React.createElement('button', {
                    onClick: () => {
                        dashLog('📦 Navigating to inventory');
                        window.setActiveTab && window.setActiveTab('inventory');
                    },
                    className: 'bg-white text-green-600 px-4 py-2 rounded-md hover:bg-green-50 transition-colors font-medium'
                }, 'View Inventory')
            ),

            React.createElement('div', { className: 'bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white' },
                React.createElement('h3', { className: 'text-lg font-medium mb-2' }, 'Financial Overview'),
                React.createElement('p', { className: 'text-purple-100 mb-4' }, 'Check sales and financial reports'),
                React.createElement('button', {
                    onClick: () => {
                        dashLog('💰 Navigating to financials');
                        window.setActiveTab && window.setActiveTab('financials');
                    },
                    className: 'bg-white text-purple-600 px-4 py-2 rounded-md hover:bg-purple-50 transition-colors font-medium'
                }, 'View Financials')
            )
        )
    );
};

// ===============================================
// DASHBOARD UTILITY FUNCTIONS - OPTIMIZED
// ===============================================

// Optimized filtered leads function
window.getFilteredLeads = () => {
    const leads = window.leads || [];
    
    if (window.dashboardFilter === 'salesPerson' && window.selectedSalesPerson) {
        return leads.filter(lead => lead.assigned_to === window.selectedSalesPerson);
    }
    
    if (window.dashboardFilter === 'event' && window.selectedEvent) {
        return leads.filter(lead => lead.lead_for_event === window.selectedEvent);
    }
    
    return leads;
};

// Throttled dashboard stats calculation
let dashboardStatsTimeout;
window.calculateDashboardStats = () => {
    clearTimeout(dashboardStatsTimeout);
    dashboardStatsTimeout = setTimeout(() => {
        const leads = window.getFilteredLeads();
        dashLog('📊 Calculating dashboard stats for', leads.length, 'leads');
        
        // Update charts with filtered data
        if (window.updateChartsWithData) {
            window.updateChartsWithData(leads);
        }
    }, 100);
};

dashLog('✅ Optimized Dashboard component loaded');
console.log('📊 Dashboard v2.0 - Performance Optimized with Fast Charts');
