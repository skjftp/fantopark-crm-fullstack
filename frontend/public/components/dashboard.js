// components/dashboard.js
// Dashboard Content Component - Extracted from index.html
// Complete dashboard functionality with charts, filters, recent leads, and quick actions

window.renderDashboardContent = () => {
    return React.createElement('div', { className: 'space-y-6' },
        // Filters for pie charts
        React.createElement('div', { className: 'bg-white p-4 rounded-lg shadow mb-6' },
            React.createElement('div', { className: 'flex items-center space-x-4' },
                React.createElement('label', { className: 'font-medium' }, 'View by:'),
                React.createElement('select', {
                    className: 'px-3 py-2 border rounded-md',
                    value: window.dashboardFilter,
                    onChange: (e) => {
                        window.setDashboardFilter(e.target.value);
                        window.setSelectedSalesPerson('');
                        window.setSelectedEvent('');
                    }
                },
                    React.createElement('option', { value: 'overall' }, 'Overall'),
                    React.createElement('option', { value: 'salesPerson' }, 'Sales Person'),
                    React.createElement('option', { value: 'event' }, 'Event')
                ),

                window.dashboardFilter === 'salesPerson' && React.createElement('select', {
                    className: 'px-3 py-2 border rounded-md',
                    value: window.selectedSalesPerson,
                    onChange: (e) => window.setSelectedSalesPerson(e.target.value)
                },
                    React.createElement('option', { value: '' }, 'Select Sales Person'),
                    window.salesPeople.map(sp => 
                        React.createElement('option', { key: sp.id, value: sp.email }, sp.name)
                    )
                ),

                window.dashboardFilter === 'event' && React.createElement('select', {
                    className: 'px-3 py-2 border rounded-md',
                    value: window.selectedEvent,
                    onChange: (e) => window.setSelectedEvent(e.target.value)
                },
                    React.createElement('option', { value: '' }, 'Select Event'),
                    window.events.map(event => 
                        React.createElement('option', { key: event, value: event }, event)
                    )
                )
            )
        ),

        // Pie Charts Section - Top Half with FIXED HEIGHT
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-6 mb-8' },
            React.createElement('div', { className: 'bg-white p-6 rounded-lg shadow' },
                React.createElement('h3', { className: 'text-lg font-medium mb-4' }, 'Lead Split'),
                React.createElement('div', { style: { height: '200px', position: 'relative' } },
                    React.createElement('canvas', { id: 'leadSplitChart' })
                )
            ),
            React.createElement('div', { className: 'bg-white p-6 rounded-lg shadow' },
                React.createElement('h3', { className: 'text-lg font-medium mb-4' }, 'Lead Temperature (Count)'),
                React.createElement('div', { style: { height: '200px', position: 'relative' } },
                    React.createElement('canvas', { id: 'tempCountChart' })
                )
            ),
            React.createElement('div', { className: 'bg-white p-6 rounded-lg shadow' },
                React.createElement('h3', { className: 'text-lg font-medium mb-4' }, 'Lead Temperature (Value)'),
                React.createElement('div', { style: { height: '200px', position: 'relative' } },
                    React.createElement('canvas', { id: 'tempValueChart' })
                )
            )
        ),

        // Recent Leads and Quick Actions - Bottom Half
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6' },
            // Recent Leads
            React.createElement('div', { className: 'bg-white rounded-lg shadow border p-6' },
                React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-4' }, 'Recent Leads'),
                React.createElement('div', { className: 'space-y-4' },
                    window.leads.slice(0, 5).length > 0 ? 
                    window.leads.slice(0, 5).map(lead => 
                        React.createElement('div', { 
                            key: lead.id, 
                            className: 'flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer',
                            onClick: () => {
                                window.setCurrentLead(lead);
                                window.setShowLeadDetail(true);
                            }
                        },
                            React.createElement('div', null,
                                React.createElement('p', { className: 'font-medium' }, lead.name),
                                React.createElement('p', { className: 'text-sm text-gray-600' }, 
                                    `${lead.source || 'No source'} • ₹${lead.potential_value || 0}`
                                ),
                                lead.assigned_to && React.createElement('p', { 
                                    className: 'text-xs text-gray-500' 
                                }, `Assigned to: ${window.getUserDisplayName(lead.assigned_to, window.users)}`)
                            ),
                            React.createElement('span', { 
                                className: 'px-2 py-1 text-xs rounded ' + 
                                (lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                                lead.status === 'hot' ? 'bg-red-100 text-red-800' :
                                lead.status === 'warm' ? 'bg-yellow-100 text-yellow-800' :
                                lead.status === 'cold' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800')
                            }, lead.status?.charAt(0).toUpperCase() + lead.status?.slice(1) || 'Unknown')
                        )
                    ) : 
                    React.createElement('p', { className: 'text-gray-500 text-center py-8' }, 'No leads found')
                )
            ),

            // Quick Actions
            React.createElement('div', { className: 'bg-white rounded-lg shadow border p-6' },
                React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-4' }, 'Quick Actions'),
                React.createElement('div', { className: 'space-y-3' },
                    window.hasPermission('leads', 'write') && React.createElement('button', {
                        onClick: () => window.openAddForm('lead'),
                        className: 'w-full flex items-center px-4 py-3 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors'
                    },
                        React.createElement('span', { className: 'mr-3' }, '+'),
                        'Add New Lead'
                    ),

                    window.hasPermission('inventory', 'write') && React.createElement('button', {
                        onClick: () => window.openAddInventoryForm(),
                        className: 'w-full flex items-center px-4 py-3 text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors'
                    },
                        React.createElement('span', { className: 'mr-3' }, '+'),
                        'Add Event to Inventory'
                    )
                )
            )
        )
    );
};
