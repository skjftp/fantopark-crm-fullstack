// components/my-actions.js
// My Actions Content Component - Extracted from index.html
// Handles all "My Actions" page functionality including assigned leads, orders, deliveries, and quote requests

window.renderMyActionsContent = () => {

    const totalOverdueAmount = window.myReceivables.reduce((sum, rec) => sum + (rec.amount || 0), 0);
    const hasActions = window.myLeads.length > 0 || window.myOrders.length > 0 || window.myDeliveries.length > 0;

    return React.createElement('div', { className: 'space-y-6' },
        React.createElement('div', { className: 'flex justify-between items-center' },
            React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' }, 'My Actions'),
            React.createElement('button', {
                onClick: window.fetchMyActions,
                className: 'text-blue-600 hover:text-blue-700 flex items-center gap-2'
            }, 
                React.createElement('span', null, '↻'),
                'Refresh'
            )
        ),

        // Overdue Receivables Alert
        window.myReceivables.length > 0 && React.createElement('div', { 
            className: 'bg-red-50 border-2 border-red-200 rounded-lg p-4 animate-pulse' 
        },
            React.createElement('div', { className: 'flex items-center justify-between' },
                React.createElement('div', { className: 'flex items-center' },
                    React.createElement('span', { className: 'text-2xl mr-3' }, '⚠️'),
                    React.createElement('div', null,
                        React.createElement('h3', { className: 'text-lg font-semibold text-red-800' }, 
                            (window.myReceivables.length) + ' Overdue Receivables'
                        ),
                        React.createElement('p', { className: 'text-red-600' }, 
                            'Total Amount Due: ₹' + (totalOverdueAmount.toLocaleString())
                        )
                    )
                ),
                React.createElement('button', {
                    onClick: () => window.setActiveTab('finance'),
                    className: 'bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700'
                }, 'View Receivables')
            )
        ),

        // User Info
        React.createElement('div', { className: 'bg-gray-50 dark:bg-gray-900 rounded-lg p-4' },
            React.createElement('p', { className: 'text-sm text-gray-600 dark:text-gray-400' }, 
                'Logged in as: ' + (window.user?.name) + ' (' + (window.user?.email) + ') - ' + (window.user?.role?.replace(/_/g, ' ').toUpperCase())
            )
        ),

        window.loading ? React.createElement('div', { className: 'text-center py-8' }, 'Loading...') :
        !hasActions ? React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center' },
            React.createElement('p', { className: 'text-gray-500 text-lg' }, 'No pending actions at the moment.'),
            React.createElement('p', { className: 'text-gray-400 mt-2' }, 'Actions will appear here when:'),
            React.createElement('ul', { className: 'mt-4 text-sm text-gray-600 space-y-1' },
                React.createElement('li', null, '• Leads are assigned to you'),
                React.createElement('li', null, '• Orders need your approval (Finance)'),
                React.createElement('li', null, '• Orders need delivery (Supply)'),
                React.createElement('li', null, '• Deliveries are assigned to you')
            )
        ) : React.createElement('div', { className: 'space-y-6' },

            // My Leads Section
            window.myLeads.length > 0 && React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow' },
                React.createElement('div', { className: 'p-4 border-b' },
                    React.createElement('h2', { className: 'text-xl font-semibold flex items-center gap-2' },
                        React.createElement('span', { className: 'text-blue-600' }, '📋'),
                        'My Leads (' + (window.myLeads.length) + ')'
                    )
                ),
                React.createElement('div', { className: 'overflow-x-auto' },
                    React.createElement('table', { className: 'w-full' },
                        React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-900' },
                            React.createElement('tr', null,
                                React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Contact'),
                                React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Company'),
                                React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Event'),
                                React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Status'),
                                React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
                            )
                        ),
                        React.createElement('tbody', { className: 'divide-y divide-gray-200' },
                            window.myLeads.map(lead => {
                                const status = window.LEAD_STATUSES[lead.status] || { label: lead.status, color: 'bg-gray-100 text-gray-800' };
                                return React.createElement('tr', { key: lead.id, className: 'hover:bg-gray-50' },
                                    React.createElement('td', { className: 'px-4 py-3' },
                                        React.createElement('div', null,
                                            React.createElement('div', { className: 'font-medium text-gray-900' }, lead.name),
                                            React.createElement('div', { className: 'text-sm text-gray-500' }, lead.email)
                                        )
                                    ),
                                    React.createElement('td', { className: 'px-4 py-3 text-sm' }, lead.company || '-'),
                                    React.createElement('td', { className: 'px-4 py-3 text-sm' }, lead.lead_for_event || '-'),
                                    React.createElement('td', { className: 'px-4 py-3' },
                                        React.createElement('span', { 
                                            className: 'px-2 py-1 text-xs rounded-full ' + (status.color)
                                        }, status.label)
                                    ),
                                    React.createElement('td', { className: 'px-4 py-3' },
                                        React.createElement('button', {
                                            onClick: () => window.viewLeadDetails(lead),
                                            className: 'text-blue-600 hover:text-blue-800 text-sm'
                                        }, 'View Details')
                                    )
                                );
                            })
                        )
                    )
                )
            ),

            // My Orders Section  
            window.myOrders.length > 0 && React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow' },
                React.createElement('div', { className: 'p-4 border-b' },
                    React.createElement('h2', { className: 'text-xl font-semibold flex items-center gap-2' },
                        React.createElement('span', { className: 'text-green-600' }, '📦'),
                        'My Orders (' + (window.myOrders.length) + ')'
                    )
                ),
                React.createElement('div', { className: 'overflow-x-auto' },
                    React.createElement('table', { className: 'w-full' },
                        React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-900' },
                            React.createElement('tr', null,
                                React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Order ID'),
                                React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Customer'),
                                React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Event'),
                                React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Amount'),
                                React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Status'),
                                React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
                            )
                        ),
                        React.createElement('tbody', { className: 'divide-y divide-gray-200' },
                            window.myOrders.map(order => 
                                React.createElement('tr', { key: order.id, className: 'hover:bg-gray-50' },
                                    React.createElement('td', { className: 'px-4 py-3 font-medium' }, '#' + (order.id)),
                                    React.createElement('td', { className: 'px-4 py-3' },
                                        React.createElement('div', null,
                                            React.createElement('div', { className: 'font-medium' }, order.customer_name),
                                            React.createElement('div', { className: 'text-sm text-gray-500' }, order.customer_email)
                                        )
                                    ),
                                    React.createElement('td', { className: 'px-4 py-3 text-sm' }, order.event_name || '-'),
                                    React.createElement('td', { className: 'px-4 py-3 font-medium' }, '₹' + ((order.total_amount || 0).toLocaleString())),
                                    React.createElement('td', { className: 'px-4 py-3' },
                                        React.createElement('span', { 
                                            className: `px-2 py-1 text-xs rounded-full ${
                                                order.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                                                order.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`
                                        }, order.status.replace(/_/g, ' ').toUpperCase())
                                    ),
                                    React.createElement('td', { className: 'px-4 py-3' },
                                        window.user.role === 'finance_manager' && order.status === 'pending_approval' ?
                                        React.createElement('button', {
                                            onClick: () => window.approveOrder(order.id),
                                            className: 'bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700'
                                        }, 'Approve') :
                                        React.createElement('button', {
                                            onClick: () => window.viewOrderDetails(order),
                                            className: 'text-blue-600 hover:text-blue-800 text-sm'
                                        }, 'View Details')
                                    )
                                )
                            )
                        )
                    )
                )
            ),

            // My Quote Requested Section (for Supply Managers)
            (window.user.role === 'supply_manager' || window.user.role === 'supply_sales_service_manager') && 
            React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow mb-6' },
                React.createElement('div', { className: 'p-6' },
                    React.createElement('div', { className: 'flex items-center justify-between mb-4' },
                        React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 dark:text-white flex items-center' },
                            React.createElement('span', { className: 'text-purple-500 mr-2' }, '📋'),
                            'My Quote Requested (',
                            window.myQuoteRequested.length,
                            ')'
                        )
                    ),
                    window.myQuoteRequested.length === 0 ? 
                    React.createElement('p', { className: 'text-gray-500 dark:text-gray-400 text-center py-8' }, 
                        'No quote requests assigned to you'
                    ) :
                    React.createElement('div', { className: 'overflow-x-auto' },
                        React.createElement('table', { className: 'min-w-full' },
                            React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-700' },
                                React.createElement('tr', null,
                                    React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider' }, 'Lead'),
                                    React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider' }, 'Company'),
                                    React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider' }, 'Temperature'),
                                    React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider' }, 'Value'),
                                    React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider' }, 'Original Assignee'),
                                    React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider' }, 'Quote Date'),
                                    React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider' }, 'Actions')
                                )
                            ),
                            React.createElement('tbody', { className: 'bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700' },
                                window.myQuoteRequested.map(lead => 
                                    React.createElement('tr', { key: lead.id, className: 'hover:bg-gray-50 dark:hover:bg-gray-700' },
                                        React.createElement('td', { className: 'px-6 py-4' },
                                            React.createElement('div', null,
                                                React.createElement('div', { className: 'text-sm font-medium text-gray-900 dark:text-white' }, lead.name),
                                                React.createElement('div', { className: 'text-sm text-gray-500 dark:text-gray-400' }, lead.email)
                                            )
                                        ),
                                        React.createElement('td', { className: 'px-6 py-4 text-sm text-gray-900 dark:text-white' }, lead.company || '-'),
                                        React.createElement('td', { className: 'px-6 py-4' },
                                            React.createElement('span', { 
                                                className: `px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    window.getDisplayTemperature(lead) === 'hot' ? 'bg-red-100 text-red-800' :
                                                    window.getDisplayTemperature(lead) === 'warm' ? 'bg-orange-100 text-orange-800' :
                                                    window.getDisplayTemperature(lead) === 'cold' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`
                                            }, 
                                                window.getDisplayTemperature(lead)?.toUpperCase() || 'N/A'
                                            )
                                        ),
                                        React.createElement('td', { className: 'px-6 py-4 text-sm text-gray-900 dark:text-white' }, 
                                            lead.potential_value ? '₹' + lead.potential_value.toLocaleString() : '-'
                                        ),
                                        React.createElement('td', { className: 'px-6 py-4 text-sm text-gray-900 dark:text-white' }, 
                                            window.getUserDisplayName(lead.assigned_to, window.users)
                                        ),
                                        React.createElement('td', { className: 'px-6 py-4 text-sm text-gray-500 dark:text-gray-400' }, 
                                            lead.quote_requested_date ? new Date(lead.quote_requested_date).toLocaleDateString() : '-'
                                        ),
                                        React.createElement('td', { className: 'px-6 py-4' },
                                            React.createElement('div', { className: 'flex space-x-2' },
                                                React.createElement('button', {
                                                    onClick: () => {
                                                        window.setCurrentLead(lead);
                                                        window.setShowLeadDetail(true);
                                                    },
                                                    className: 'text-blue-600 hover:text-blue-800 text-sm'
                                                }, 'View Details'),
                                                React.createElement('button', {
                                                    onClick: () => window.handleLeadProgression(lead),
                                                    className: 'text-purple-600 hover:text-purple-800 text-sm'
                                                }, 'Progress')
                                            )
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            ),

            // My Deliveries Section
            window.myDeliveries.length > 0 && React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow' },
                React.createElement('div', { className: 'p-4 border-b' },
                    React.createElement('h2', { className: 'text-xl font-semibold flex items-center gap-2' },
                        React.createElement('span', { className: 'text-purple-600' }, '🚚'),
                        'My Deliveries (' + (window.myDeliveries.length) + ')'
                    )
                ),
                React.createElement('div', { className: 'overflow-x-auto' },
                    React.createElement('table', { className: 'w-full' },
                        React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-900' },
                            React.createElement('tr', null,
                                React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Delivery ID'),
                                React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Order ID'),
                                React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Customer'),
                                React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Delivery Date'),
                                React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Status'),
                                React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
                            )
                        ),
                        React.createElement('tbody', { className: 'divide-y divide-gray-200' },
                            window.myDeliveries.map(delivery => 
                                React.createElement('tr', { key: delivery.id, className: 'hover:bg-gray-50' },
                                    React.createElement('td', { className: 'px-4 py-3 font-medium' }, '#' + (delivery.id)),
                                    React.createElement('td', { className: 'px-4 py-3' }, '#' + (delivery.order_id)),
                                    React.createElement('td', { className: 'px-4 py-3 text-sm' }, delivery.customer_name || '-'),
                                    React.createElement('td', { className: 'px-4 py-3 text-sm' }, 
                                        delivery.scheduled_date ? new Date(delivery.scheduled_date).toLocaleDateString() : '-'
                                    ),
                                    React.createElement('td', { className: 'px-4 py-3' },
                                        React.createElement('span', { 
                                            className: `px-2 py-1 text-xs rounded-full ${
                                                delivery.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                delivery.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`
                                        }, delivery.status.replace(/_/g, ' ').toUpperCase())
                                    ),
                                    React.createElement('td', { className: 'px-4 py-3' },
                                        React.createElement('button', {
                                            onClick: () => window.updateDeliveryStatus(delivery.id),
                                            className: 'text-blue-600 hover:text-blue-800 text-sm'
                                        }, 'Update Status')
                                    )
                                )
                            )
                        )
                    )
                )
            )
        )
    );
};
