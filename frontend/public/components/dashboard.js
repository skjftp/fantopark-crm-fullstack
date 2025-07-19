// ===============================================
// COMPLETE OPTIMIZED DASHBOARD COMPONENT
// Integrated with Backend API Chart Optimization
// ===============================================

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
                            (window.getFilteredLeads ? window.getFilteredLeads() : window.leads || []).length
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
                            (window.getFilteredLeads ? window.getFilteredLeads() : window.leads || [])
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
                            (window.getFilteredLeads ? window.getFilteredLeads() : window.leads || [])
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
                            '₹' + ((window.getFilteredLeads ? window.getFilteredLeads() : window.leads || [])
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
                    [...new Set((window.leads || []).map(lead => lead.lead_for_event).filter(Boolean))].map(event =>
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
                (window.getFilteredLeads ? window.getFilteredLeads() : window.leads || []).length > 0 ?
                React.createElement('div', { className: 'space-y-4' },
                    (window.getFilteredLeads ? window.getFilteredLeads() : window.leads || [])
                        .sort((a, b) => new Date(b.created_date || b.created_at) - new Date(a.created_date || a.created_at))
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
    let filteredLeads = [...(window.leads || [])];
    
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
// CHART INTEGRATION HOOKS - FOR OPTIMIZED SYSTEM
// ===============================================

// Initialize charts when dashboard loads
window.initializeDashboardCharts = function() {
    console.log('🚀 Dashboard: Initializing optimized charts...');
    
    // Wait for DOM to be ready
    setTimeout(() => {
        if (window.initializeOptimizedCharts) {
            window.initializeOptimizedCharts();
        } else {
            console.warn('⚠️ Optimized chart system not loaded, falling back to legacy');
            if (window.smartChartInit) {
                window.smartChartInit();
            }
        }
    }, 500);
};

// Auto-initialize when dashboard becomes active
const originalSetActiveTab = window.setActiveTab;
if (originalSetActiveTab) {
    window.setActiveTab = function(tab) {
        originalSetActiveTab(tab);
        
        if (tab === 'dashboard') {
            console.log('📊 Dashboard activated, initializing charts...');
            window.initializeDashboardCharts();
        }
    };
}

// Initialize on page load if dashboard is active
document.addEventListener('DOMContentLoaded', function() {
    if (window.activeTab === 'dashboard' || !window.activeTab) {
        setTimeout(() => {
            window.initializeDashboardCharts();
        }, 1000);
    }
});

// Mobile Responsive Dashboard Updates
// Add to your dashboard.js

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

console.log('✅ Optimized Dashboard Component Loaded - Backend API Integration Active!');
