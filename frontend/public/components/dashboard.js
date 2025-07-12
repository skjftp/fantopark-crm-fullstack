// ===============================================
// EMERGENCY FIXED DASHBOARD COMPONENT - REACT ERROR RESOLVED + FILTER FIXES
// ===============================================
// Dashboard Content Component - NO useEffect calls that cause React Error #310

// Conditional logging control
const ENABLE_DASHBOARD_DEBUG = false; // Set to false to reduce logs
const dashLog = ENABLE_DASHBOARD_DEBUG ? console.log : () => {};

// ===============================================
// MAIN DASHBOARD RENDER FUNCTION - EMERGENCY FIXED
// ===============================================

window.renderDashboardContent = () => {
    // ✅ CRITICAL FIX: REMOVE ALL React.useEffect CALLS
    // These were causing React Error #310 - useEffect can't be called in regular functions
    
    // Chart initialization will be handled by the chart system itself
    // No useEffect needed here - this caused the error!
    
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
                            (window.getFilteredLeads ? window.getFilteredLeads() : window.leads || []).length
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
                        React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 dark:text-white' },
                            (window.getFilteredLeads ? window.getFilteredLeads() : window.leads || [])
                                .filter(l => (l.temperature || l.status || '').toLowerCase() === 'hot').length
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
                            (window.getFilteredLeads ? window.getFilteredLeads() : window.leads || [])
                                .filter(l => (l.status || '').toLowerCase() === 'qualified').length
                        ),
                        React.createElement('p', { className: 'text-sm text-gray-500 dark:text-gray-400' }, 'Qualified Leads')
                    )
                )
            ),

            // Total Pipeline Value Card
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
                            `₹${((window.getFilteredLeads ? window.getFilteredLeads() : window.leads || []).reduce((sum, lead) => 
                                sum + (parseFloat(lead.potential_value) || 0), 0
                            )).toLocaleString()}`
                        ),
                        React.createElement('p', { className: 'text-sm text-gray-500 dark:text-gray-400' }, 'Total Pipeline Value')
                    )
                )
            )
        ),

        // Filters for pie charts - FIXED TO TRIGGER CHART UPDATES
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6' },
            React.createElement('div', { className: 'flex items-center space-x-4 flex-wrap gap-2' },
                React.createElement('label', { className: 'font-medium text-gray-700 dark:text-gray-300' }, 'View by:'),
                React.createElement('select', {
                    className: 'px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                    value: window.dashboardFilter || 'overall',
                    onChange: (e) => {
                        dashLog('📊 Dashboard filter changed:', e.target.value);
                        
                        // Update state
                        if (window.setDashboardFilter) window.setDashboardFilter(e.target.value);
                        if (window.setSelectedSalesPerson) window.setSelectedSalesPerson('');
                        if (window.setSelectedEvent) window.setSelectedEvent('');
                        
                        // FIXED: Trigger chart update immediately
                        setTimeout(() => {
                            if (window.updateChartsWithData && window.leads) {
                                dashLog('🔄 Triggering chart update after filter change');
                                window.updateChartsWithData(window.leads);
                            }
                        }, 100);
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
                        
                        // Update state
                        if (window.setSelectedSalesPerson) window.setSelectedSalesPerson(e.target.value);
                        
                        // FIXED: Trigger chart update immediately
                        setTimeout(() => {
                            if (window.updateChartsWithData && window.leads) {
                                dashLog('🔄 Triggering chart update after sales person filter change');
                                window.updateChartsWithData(window.leads);
                            }
                        }, 100);
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
                        
                        // Update state
                        if (window.setSelectedEvent) window.setSelectedEvent(e.target.value);
                        
                        // FIXED: Trigger chart update immediately
                        setTimeout(() => {
                            if (window.updateChartsWithData && window.leads) {
                                dashLog('🔄 Triggering chart update after event filter change');
                                window.updateChartsWithData(window.leads);
                            }
                        }, 100);
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

            // Temperature Value Chart - FIXED: Now shows potential_value
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
                (window.getFilteredLeads ? window.getFilteredLeads() : window.leads || []).length > 0 ?
                React.createElement('div', { className: 'space-y-4' },
                    (window.getFilteredLeads ? window.getFilteredLeads() : window.leads || [])
                        .slice(0, 5)
                        .map((lead, index) => 
                            React.createElement('div', { key: index, className: 'flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0' },
                                React.createElement('div', { className: 'flex-1' },
                                    React.createElement('p', { className: 'font-medium text-gray-900 dark:text-white' }, lead.name),
                                    React.createElement('p', { className: 'text-sm text-gray-500 dark:text-gray-400' }, 
                                        `${lead.company || 'Unknown Company'} - ₹${(parseFloat(lead.potential_value) || 0).toLocaleString()}`
                                    )
                                ),
                                React.createElement('span', {
                                    className: `px-2 py-1 text-xs font-medium rounded-full ${
                                        (lead.temperature || lead.status) === 'hot' ? 
                                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                        (lead.temperature || lead.status) === 'warm' ? 
                                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                        (lead.temperature || lead.status) === 'cold' ? 
                                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                        lead.status === 'qualified' ? 
                                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                    }`
                                }, (lead.temperature || lead.status || 'unknown'))
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
// DASHBOARD HELPER FUNCTIONS - FIXED
// ===============================================

// Get filtered leads for dashboard - FIXED: Better filtering logic
window.getFilteredLeads = function() {
    let filteredLeads = [...(window.leads || [])];
    
    try {
        dashLog('🔍 Filtering leads:', {
            total: filteredLeads.length,
            filter: window.dashboardFilter,
            salesPerson: window.selectedSalesPerson,
            event: window.selectedEvent
        });
        
        if (window.dashboardFilter === 'salesPerson' && window.selectedSalesPerson) {
            filteredLeads = filteredLeads.filter(lead => 
                lead.assigned_to === window.selectedSalesPerson
            );
            dashLog('🔍 After sales person filter:', filteredLeads.length);
        } else if (window.dashboardFilter === 'event' && window.selectedEvent) {
            filteredLeads = filteredLeads.filter(lead => 
                lead.lead_for_event === window.selectedEvent
            );
            dashLog('🔍 After event filter:', filteredLeads.length);
        }
    } catch (error) {
        console.error('Error filtering leads:', error);
    }
    
    return filteredLeads;
};

// Dashboard metrics calculation - FIXED: Use filtered leads
window.calculateDashboardMetrics = function() {
    const leads = window.getFilteredLeads();
    
    return {
        total: leads.length,
        hot: leads.filter(l => (l.temperature || l.status || '').toLowerCase() === 'hot').length,
        warm: leads.filter(l => (l.temperature || l.status || '').toLowerCase() === 'warm').length,
        cold: leads.filter(l => (l.temperature || l.status || '').toLowerCase() === 'cold').length,
        qualified: leads.filter(l => (l.status || '').toLowerCase() === 'qualified').length,
        junk: leads.filter(l => (l.status || '').toLowerCase() === 'junk').length,
        totalValue: leads.reduce((sum, lead) => sum + (parseFloat(lead.potential_value) || 0), 0)
    };
};

// ===============================================
// ENHANCED FILTER SETTERS - FIXED TO TRIGGER UPDATES
// ===============================================

// Override the original setters to trigger chart updates
const originalSetDashboardFilter = window.setDashboardFilter;
if (originalSetDashboardFilter) {
    window.setDashboardFilter = function(filter) {
        dashLog('📊 Setting dashboard filter:', filter);
        originalSetDashboardFilter(filter);
        
        // Trigger chart update after state change
        setTimeout(() => {
            if (window.updateChartsWithData && window.leads) {
                dashLog('🔄 Auto-triggering chart update after filter change');
                window.updateChartsWithData(window.leads);
            }
        }, 150);
    };
}

const originalSetSelectedSalesPerson = window.setSelectedSalesPerson;
if (originalSetSelectedSalesPerson) {
    window.setSelectedSalesPerson = function(person) {
        dashLog('👤 Setting selected sales person:', person);
        originalSetSelectedSalesPerson(person);
        
        // Trigger chart update after state change
        setTimeout(() => {
            if (window.updateChartsWithData && window.leads) {
                dashLog('🔄 Auto-triggering chart update after sales person change');
                window.updateChartsWithData(window.leads);
            }
        }, 150);
    };
}

const originalSetSelectedEvent = window.setSelectedEvent;
if (originalSetSelectedEvent) {
    window.setSelectedEvent = function(event) {
        dashLog('🎯 Setting selected event:', event);
        originalSetSelectedEvent(event);
        
        // Trigger chart update after state change
        setTimeout(() => {
            if (window.updateChartsWithData && window.leads) {
                dashLog('🔄 Auto-triggering chart update after event change');
                window.updateChartsWithData(window.leads);
            }
        }, 150);
    };
}

console.log('📊 Dashboard v4.1 - FILTERS & TEMPERATURE VALUE FIXED');
console.log('✅ Removed ALL React.useEffect calls that caused Error #310');
console.log('✅ Dashboard component will now render without React errors');
console.log('🔄 FIXED: Chart filters now trigger immediate chart updates');
console.log('🔥 FIXED: Temperature Value chart now shows potential_value instead of count');
