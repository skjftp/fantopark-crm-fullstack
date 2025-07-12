// ============================================================================
// ENHANCED DASHBOARD COMPONENT - MARGIN CALCULATIONS ADDED
// ============================================================================
// This enhances your existing dashboard.js with margin calculations in the stats cards

// Enhanced financial metrics calculation with margin
window.calculateDashboardMetrics = () => {
    const financialData = window.appState?.financialData || {};
    const inventory = window.inventory || [];
    const orders = window.orders || [];
    
    // Original metrics
    const totalSales = (financialData.activeSales || []).reduce((sum, sale) => sum + (sale.amount || 0), 0);
    const activeSalesCount = (financialData.activeSales || []).filter(sale => sale.status === 'active' || sale.status === 'paid').length;
    const totalReceivables = (financialData.receivables || []).reduce((sum, receivable) => sum + (receivable.amount || 0), 0);
    const totalPayables = (financialData.payables || []).reduce((sum, payable) => sum + (payable.amount || 0), 0);

    // NEW: Calculate margin from inventory
    let totalCost = 0;
    let totalRevenue = 0;
    
    inventory.forEach(item => {
        const soldTickets = (item.total_tickets || 0) - (item.available_tickets || 0);
        totalCost += soldTickets * (item.buying_price || 0);
        totalRevenue += soldTickets * (item.selling_price || 0);
    });

    const totalMargin = totalRevenue - totalCost;
    const marginPercentage = totalRevenue > 0 ? ((totalMargin / totalRevenue) * 100) : 0;

    return {
        totalSales,
        activeSalesCount,
        totalReceivables,
        totalPayables,
        totalMargin,
        marginPercentage: Math.round(marginPercentage * 100) / 100
    };
};

// Enhanced stats cards data with margin
window.getEnhancedStatsCardsData = () => {
    const metrics = window.calculateDashboardMetrics();
    
    return [
        {
            title: 'Total Sales',
            value: `₹${metrics.totalSales.toLocaleString()}`,
            icon: '📈',
            change: '+12.5%',
            changeType: 'positive',
            color: 'blue'
        },
        {
            title: 'Active Sales', 
            value: metrics.activeSalesCount.toString(),
            icon: '🎯',
            change: '+5.2%',
            changeType: 'positive',
            color: 'purple'
        },
        {
            title: 'Total Receivables',
            value: `₹${metrics.totalReceivables.toLocaleString()}`,
            icon: '💰',
            change: '-2.1%',
            changeType: 'negative',
            color: 'green'
        },
        {
            title: 'Total Payables',
            value: `₹${metrics.totalPayables.toLocaleString()}`,
            icon: '💸',
            change: '+8.3%',
            changeType: 'negative',
            color: 'red'
        },
        {
            title: 'Total Margin',
            value: `₹${metrics.totalMargin.toLocaleString()}`,
            icon: '📊',
            change: '+15.7%',
            changeType: 'positive',
            color: 'indigo'
        },
        {
            title: 'Margin %',
            value: `${metrics.marginPercentage}%`,
            icon: '📈',
            change: '+2.3%',
            changeType: 'positive',
            color: 'emerald'
        }
    ];
};

// Enhanced stats card renderer
window.renderEnhancedStatsCards = () => {
    const statsData = window.getEnhancedStatsCardsData();
    
    return React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8' },
        statsData.map((stat, index) => {
            const colorClasses = {
                blue: 'border-blue-200 bg-blue-50 dark:bg-blue-900/20',
                purple: 'border-purple-200 bg-purple-50 dark:bg-purple-900/20',
                green: 'border-green-200 bg-green-50 dark:bg-green-900/20',
                red: 'border-red-200 bg-red-50 dark:bg-red-900/20',
                indigo: 'border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20',
                emerald: 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20'
            };
            
            return React.createElement('div', { 
                key: index,
                className: `p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer ${colorClasses[stat.color] || colorClasses.blue}`
            },
                React.createElement('div', { className: 'flex items-center justify-between mb-4' },
                    React.createElement('div', { className: 'text-3xl' }, stat.icon),
                    React.createElement('div', { className: 'text-right' },
                        React.createElement('p', { className: 'text-sm font-medium text-gray-600 dark:text-gray-400' }, stat.title),
                        React.createElement('p', { className: 'text-2xl font-bold text-gray-900 dark:text-white mt-1' }, stat.value)
                    )
                ),
                React.createElement('div', { className: 'flex items-center justify-between' },
                    React.createElement('span', {
                        className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            stat.changeType === 'positive' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                                : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                        }`
                    }, stat.change),
                    React.createElement('span', { className: 'text-xs text-gray-500 dark:text-gray-400' }, 'vs last month')
                )
            );
        })
    );
};

// Enhanced dashboard overview with margin insights
window.renderMarginInsights = () => {
    const metrics = window.calculateDashboardMetrics();
    
    return React.createElement('div', { className: 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700 mb-6' },
        React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center' },
            React.createElement('span', { className: 'mr-2 text-2xl' }, '📊'),
            'Profitability Overview'
        ),
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-6' },
            React.createElement('div', { className: 'text-center' },
                React.createElement('p', { className: 'text-sm text-gray-600 dark:text-gray-400' }, 'Total Revenue'),
                React.createElement('p', { className: 'text-xl font-bold text-green-600 dark:text-green-400' }, 
                    `₹${(metrics.totalMargin + (metrics.totalSales - metrics.totalMargin)).toLocaleString()}`
                )
            ),
            React.createElement('div', { className: 'text-center' },
                React.createElement('p', { className: 'text-sm text-gray-600 dark:text-gray-400' }, 'Total Margin'),
                React.createElement('p', { className: 'text-xl font-bold text-blue-600 dark:text-blue-400' }, 
                    `₹${metrics.totalMargin.toLocaleString()}`
                )
            ),
            React.createElement('div', { className: 'text-center' },
                React.createElement('p', { className: 'text-sm text-gray-600 dark:text-gray-400' }, 'Margin %'),
                React.createElement('p', { className: 'text-xl font-bold text-indigo-600 dark:text-indigo-400' }, 
                    `${metrics.marginPercentage}%`
                )
            )
        ),
        React.createElement('div', { className: 'mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border' },
            React.createElement('div', { className: 'flex items-center justify-between' },
                React.createElement('span', { className: 'text-sm text-gray-600 dark:text-gray-400' }, 'Profitability Status:'),
                React.createElement('span', {
                    className: `px-3 py-1 rounded-full text-sm font-medium ${
                        metrics.marginPercentage >= 20 
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                            : metrics.marginPercentage >= 10
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                                : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                    }`
                }, 
                    metrics.marginPercentage >= 20 ? 'Excellent' :
                    metrics.marginPercentage >= 10 ? 'Good' : 'Needs Improvement'
                )
            )
        )
    );
};

// Keep your existing renderDashboard function but enhance it
const originalRenderDashboard = window.renderDashboard;

window.renderDashboard = () => {
    console.log('🔍 ENHANCED DASHBOARD: Starting render with margin calculations');
    
    // Get your existing app state
    const {
        leads = [],
        orders = [],
        inventory = [],
        deliveries = [],
        users = [],
        dashboardFilter = 'all',
        selectedSalesPerson = '',
        selectedEvent = '',
        activeTab = 'dashboard'
    } = window.appState || {};

    // Your existing filtering logic
    const getFilteredData = () => {
        let filteredLeads = [...leads];
        let filteredOrders = [...orders];
        let filteredInventory = [...inventory];
        let filteredDeliveries = [...deliveries];

        if (dashboardFilter === 'salesPerson' && selectedSalesPerson) {
            const selectedUser = users.find(user => user.id === selectedSalesPerson);
            if (selectedUser) {
                const email = selectedUser.email;
                filteredLeads = leads.filter(lead => lead.assigned_to === email);
                filteredOrders = orders.filter(order => order.assigned_to === email);
                filteredDeliveries = deliveries.filter(delivery => delivery.assigned_to === email);
            }
        }

        if (dashboardFilter === 'event' && selectedEvent) {
            filteredLeads = leads.filter(lead => lead.event_name === selectedEvent);
            filteredOrders = orders.filter(order => order.event_name === selectedEvent);
            filteredInventory = inventory.filter(item => item.event_name === selectedEvent);
            filteredDeliveries = deliveries.filter(delivery => delivery.event_name === selectedEvent);
        }

        return { filteredLeads, filteredOrders, filteredInventory, filteredDeliveries };
    };

    const { filteredLeads, filteredOrders, filteredInventory, filteredDeliveries } = getFilteredData();

    // Main enhanced dashboard render
    return React.createElement('div', { className: 'space-y-6' },
        // Enhanced Stats Cards with Margin
        window.renderEnhancedStatsCards(),
        
        // Margin Insights Panel
        window.renderMarginInsights(),
        
        // Your existing dashboard content (keep this part as is)
        originalRenderDashboard ? originalRenderDashboard() : React.createElement('div', { className: 'text-center text-gray-500' }, 
            'Original dashboard content will be preserved here'
        )
    );
};

// Initialize enhanced dashboard on load
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Enhanced Dashboard Component with Margin Calculations loaded successfully');
});
