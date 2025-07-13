// =============================================================================
// COMPLETE MY ACTIONS COMPONENT - REPLACE components/my-actions.js
// =============================================================================
// Enhanced with pagination, search, customer names fix, and updateDeliveryStatus

// My Actions data arrays - safe defaults
window.myReceivables = window.myReceivables || [];
window.myLeads = window.myLeads || [];
window.myOrders = window.myOrders || [];
window.myDeliveries = window.myDeliveries || [];
window.myQuoteRequested = window.myQuoteRequested || [];

// Pagination state for My Actions
window.myActionsPagination = window.myActionsPagination || {
    leads: { currentPage: 1, itemsPerPage: 5 },
    orders: { currentPage: 1, itemsPerPage: 5 },
    deliveries: { currentPage: 1, itemsPerPage: 5 },
    quotes: { currentPage: 1, itemsPerPage: 5 },
    receivables: { currentPage: 1, itemsPerPage: 5 }
};

// Search state for My Actions
window.myActionsSearch = window.myActionsSearch || '';

// =============================================================================
// MISSING FUNCTION: updateDeliveryStatus
// =============================================================================

window.updateDeliveryStatus = async function(deliveryId) {
    console.log('🚚 updateDeliveryStatus called for delivery:', deliveryId);
    
    if (!window.hasPermission('delivery', 'write')) {
        alert('You do not have permission to update delivery status');
        return;
    }
    
    // Find the delivery
    const delivery = window.myDeliveries?.find(d => d.id === deliveryId);
    if (!delivery) {
        alert('Delivery not found');
        return;
    }
    
    // Show status options
    const statusOptions = [
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'in_transit', label: 'In Transit' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'failed', label: 'Failed' },
        { value: 'cancelled', label: 'Cancelled' }
    ];
    
    const currentStatus = delivery.status || 'scheduled';
    const newStatus = prompt(
        `Current status: ${currentStatus.replace(/_/g, ' ').toUpperCase()}\n\nSelect new status:\n` +
        statusOptions.map((opt, idx) => `${idx + 1}. ${opt.label}`).join('\n') +
        '\n\nEnter number (1-5):'
    );
    
    if (!newStatus || isNaN(newStatus) || newStatus < 1 || newStatus > 5) {
        return;
    }
    
    const selectedStatus = statusOptions[parseInt(newStatus) - 1];
    
    try {
        window.setLoading && window.setLoading(true);
        
        const updateData = {
            status: selectedStatus.value,
            updated_date: new Date().toISOString(),
            updated_by: window.user?.email || 'system'
        };
        
        if (selectedStatus.value === 'delivered') {
            updateData.delivered_date = new Date().toISOString();
        }
        
        const response = await window.apiCall(`/deliveries/${deliveryId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
        
        if (response.error) {
            throw new Error(response.error);
        }
        
        // Update local data
        window.myDeliveries = window.myDeliveries.map(d => 
            d.id === deliveryId ? { ...d, ...updateData } : d
        );
        
        // Also update main deliveries array if it exists
        if (window.setDeliveries) {
            window.setDeliveries(prev => prev.map(d => 
                d.id === deliveryId ? { ...d, ...updateData } : d
            ));
        }
        
        alert(`✅ Delivery status updated to: ${selectedStatus.label}`);
        
        // Refresh the data
        window.fetchMyActions && window.fetchMyActions();
        
    } catch (error) {
        console.error('Error updating delivery status:', error);
        alert('❌ Failed to update delivery status: ' + error.message);
    } finally {
        window.setLoading && window.setLoading(false);
    }
};

// =============================================================================
// PAGINATION HELPER FUNCTIONS
// =============================================================================

window.getMyActionsPaginatedData = function(data, section) {
    if (!data || !Array.isArray(data)) return { items: [], totalPages: 0, currentPage: 1 };
    
    // Apply search filter
    let filteredData = data;
    if (window.myActionsSearch) {
        const searchTerm = window.myActionsSearch.toLowerCase();
        filteredData = data.filter(item => {
            switch (section) {
                case 'leads':
                    return (item.name || '').toLowerCase().includes(searchTerm) ||
                           (item.company || '').toLowerCase().includes(searchTerm) ||
                           (item.lead_for_event || '').toLowerCase().includes(searchTerm);
                case 'orders':
                    return (item.client_name || '').toLowerCase().includes(searchTerm) ||
                           (item.event_name || '').toLowerCase().includes(searchTerm) ||
                           (item.order_number || '').toLowerCase().includes(searchTerm);
                case 'deliveries':
                    return (item.customer_name || item.client_name || '').toLowerCase().includes(searchTerm) ||
                           (item.order_id || '').toString().includes(searchTerm);
                case 'quotes':
                    return (item.name || '').toLowerCase().includes(searchTerm) ||
                           (item.company || '').toLowerCase().includes(searchTerm);
                case 'receivables':
                    return (item.client_name || '').toLowerCase().includes(searchTerm) ||
                           (item.invoice_number || '').toLowerCase().includes(searchTerm);
                default:
                    return true;
            }
        });
    }
    
    const pagination = window.myActionsPagination[section];
    const currentPage = pagination.currentPage;
    const itemsPerPage = pagination.itemsPerPage;
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return {
        items: filteredData.slice(startIndex, endIndex),
        totalPages,
        currentPage,
        totalItems: filteredData.length
    };
};

window.setMyActionsPage = function(section, page) {
    window.myActionsPagination[section].currentPage = page;
    // Force re-render by updating a dummy state
    if (window.setActiveTab && window.activeTab === 'myactions') {
        // Trigger re-render
        setTimeout(() => {
            const content = document.querySelector('#root');
            if (content) {
                // Force React to re-render by dispatching a custom event
                window.dispatchEvent(new Event('myActionsUpdate'));
            }
        }, 0);
    }
};

// =============================================================================
// PAGINATION COMPONENT
// =============================================================================

window.renderMyActionsPagination = function(section, totalPages, currentPage) {
    if (totalPages <= 1) return null;
    
    const createPageButton = (pageNum, isActive = false) => {
        return React.createElement('button', {
            key: pageNum,
            onClick: () => window.setMyActionsPage(section, pageNum),
            className: `px-3 py-1 mx-1 text-sm ${
                isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } rounded`
        }, pageNum);
    };
    
    const pages = [];
    const maxVisiblePages = 5;
    
    // Calculate page range
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Previous button
    if (currentPage > 1) {
        pages.push(React.createElement('button', {
            key: 'prev',
            onClick: () => window.setMyActionsPage(section, currentPage - 1),
            className: 'px-3 py-1 mx-1 text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 rounded'
        }, '‹'));
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        pages.push(createPageButton(i, i === currentPage));
    }
    
    // Next button
    if (currentPage < totalPages) {
        pages.push(React.createElement('button', {
            key: 'next',
            onClick: () => window.setMyActionsPage(section, currentPage + 1),
            className: 'px-3 py-1 mx-1 text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 rounded'
        }, '›'));
    }
    
    return React.createElement('div', { 
        className: 'flex justify-center items-center mt-4 mb-2' 
    }, pages);
};

// =============================================================================
// MAIN MY ACTIONS COMPONENT
// =============================================================================

window.renderMyActionsContent = () => {
    const totalOverdueAmount = (window.myReceivables || []).reduce((sum, rec) => sum + (rec.amount || 0), 0);
    const hasActions = window.myLeads.length > 0 || window.myOrders.length > 0 || window.myDeliveries.length > 0;
    
    // Get paginated data for each section
    const leadsData = window.getMyActionsPaginatedData(window.myLeads, 'leads');
    const ordersData = window.getMyActionsPaginatedData(window.myOrders, 'orders');
    const deliveriesData = window.getMyActionsPaginatedData(window.myDeliveries, 'deliveries');
    const quotesData = window.getMyActionsPaginatedData(window.myQuoteRequested, 'quotes');
    const receivablesData = window.getMyActionsPaginatedData(window.myReceivables, 'receivables');

    return React.createElement('div', { className: 'space-y-6' },
        // Header with search
        React.createElement('div', { className: 'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4' },
            React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' }, 'My Actions'),
            React.createElement('div', { className: 'flex gap-3' },
                // Search bar
                React.createElement('input', {
                    type: 'text',
                    placeholder: 'Search across all sections...',
                    value: window.myActionsSearch,
                    onChange: (e) => {
                        window.myActionsSearch = e.target.value;
                        // Force re-render
                        window.dispatchEvent(new Event('myActionsUpdate'));
                    },
                    className: 'px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64'
                }),
                // Refresh button
                React.createElement('button', {
                    onClick: window.fetchMyActions,
                    className: 'text-blue-600 hover:text-blue-700 flex items-center gap-2 px-4 py-2 border border-blue-300 rounded-lg hover:bg-blue-50'
                }, 
                    React.createElement('span', null, '↻'),
                    'Refresh'
                )
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
                            `${window.myReceivables.length} Overdue Receivables - Total: ₹${totalOverdueAmount.toLocaleString()}`
                        ),
                        React.createElement('p', { className: 'text-red-600' }, 'Immediate action required on these payments')
                    )
                )
            )
        ),

        // My Leads Section
        leadsData.items.length > 0 && React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow' },
            React.createElement('div', { className: 'p-4 border-b flex justify-between items-center' },
                React.createElement('h2', { className: 'text-xl font-semibold flex items-center gap-2' },
                    React.createElement('span', { className: 'text-blue-600' }, '👤'),
                    `My Leads (${leadsData.totalItems})`
                ),
                React.createElement('span', { className: 'text-sm text-gray-500' }, 
                    `Showing ${leadsData.items.length} of ${leadsData.totalItems}`
                )
            ),
            React.createElement('div', { className: 'overflow-x-auto' },
                React.createElement('table', { className: 'w-full' },
                    React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-900' },
                        React.createElement('tr', null,
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Name'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Company'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Event'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Status'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Value'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
                        )
                    ),
                    React.createElement('tbody', { className: 'divide-y divide-gray-200' },
                        leadsData.items.map(lead => 
                            React.createElement('tr', { key: lead.id, className: 'hover:bg-gray-50' },
                                React.createElement('td', { className: 'px-4 py-3 font-medium' }, lead.name || '-'),
                                React.createElement('td', { className: 'px-4 py-3 text-sm' }, lead.company || '-'),
                                React.createElement('td', { className: 'px-4 py-3 text-sm' }, lead.lead_for_event || '-'),
                                React.createElement('td', { className: 'px-4 py-3' },
                                    React.createElement('span', { 
                                        className: `px-2 py-1 text-xs rounded-full ${
                                            lead.temperature === 'hot' ? 'bg-red-100 text-red-800' :
                                            lead.temperature === 'warm' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`
                                    }, (lead.temperature || lead.status || 'cold').toUpperCase())
                                ),
                                React.createElement('td', { className: 'px-4 py-3 text-sm' }, 
                                    lead.potential_value ? `₹${parseInt(lead.potential_value).toLocaleString()}` : '-'
                                ),
                                React.createElement('td', { className: 'px-4 py-3' },
                                    React.createElement('button', {
                                        onClick: () => window.openLeadDetail && window.openLeadDetail(lead),
                                        className: 'text-blue-600 hover:text-blue-800 text-sm'
                                    }, 'View Details')
                                )
                            )
                        )
                    )
                )
            ),
            window.renderMyActionsPagination('leads', leadsData.totalPages, leadsData.currentPage)
        ),

        // Quote Requests Section
        quotesData.items.length > 0 && React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow' },
            React.createElement('div', { className: 'p-4 border-b flex justify-between items-center' },
                React.createElement('h2', { className: 'text-xl font-semibold flex items-center gap-2' },
                    React.createElement('span', { className: 'text-orange-600' }, '📋'),
                    `Quote Requests - Supply Team (${quotesData.totalItems})`
                ),
                React.createElement('span', { className: 'text-sm text-gray-500' }, 
                    `Showing ${quotesData.items.length} of ${quotesData.totalItems}`
                )
            ),
            React.createElement('div', { className: 'overflow-x-auto' },
                React.createElement('table', { className: 'w-full' },
                    React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-900' },
                        React.createElement('tr', null,
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Lead'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Company'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Temperature'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Value'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Original Assignee'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Quote Date'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
                        )
                    ),
                    React.createElement('tbody', { className: 'divide-y divide-gray-200' },
                        quotesData.items.map(lead => 
                            React.createElement('tr', { key: lead.id, className: 'hover:bg-gray-50' },
                                React.createElement('td', { className: 'px-4 py-3 font-medium' }, lead.name || '-'),
                                React.createElement('td', { className: 'px-4 py-3 text-sm' }, lead.company || 'N/A'),
                                React.createElement('td', { className: 'px-4 py-3' },
                                    React.createElement('span', { 
                                        className: `px-2 py-1 text-xs rounded-full ${
                                            lead.temperature === 'hot' ? 'bg-red-100 text-red-800' :
                                            lead.temperature === 'warm' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`
                                    }, (lead.temperature || 'COLD').toUpperCase())
                                ),
                                React.createElement('td', { className: 'px-4 py-3 text-sm' }, 
                                    lead.potential_value ? `₹${parseInt(lead.potential_value).toLocaleString()}` : '-'
                                ),
                                React.createElement('td', { className: 'px-4 py-3 text-sm' }, lead.assigned_to || '-'),
                                React.createElement('td', { className: 'px-4 py-3 text-sm' }, 
                                    lead.quote_requested_date ? new Date(lead.quote_requested_date).toLocaleDateString() : '-'
                                ),
                                React.createElement('td', { className: 'px-4 py-3' },
                                    React.createElement('div', { className: 'flex gap-2' },
                                        React.createElement('button', {
                                            onClick: () => window.openLeadDetail && window.openLeadDetail(lead),
                                            className: 'text-blue-600 hover:text-blue-900 text-sm px-2 py-1 rounded border border-blue-200 hover:bg-blue-50'
                                        }, 'View Details'),
                                        React.createElement('button', {
                                            onClick: () => window.updateLeadStatus && window.updateLeadStatus(lead.id, 'quoted'),
                                            className: 'text-green-600 hover:text-green-900 text-sm px-2 py-1 rounded border border-green-200 hover:bg-green-50'
                                        }, 'Progress')
                                    )
                                )
                            )
                        )
                    )
                )
            ),
            window.renderMyActionsPagination('quotes', quotesData.totalPages, quotesData.currentPage)
        ),

        // My Orders Section
        ordersData.items.length > 0 && React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow' },
            React.createElement('div', { className: 'p-4 border-b flex justify-between items-center' },
                React.createElement('h2', { className: 'text-xl font-semibold flex items-center gap-2' },
                    React.createElement('span', { className: 'text-green-600' }, '📦'),
                    `My Orders (${ordersData.totalItems})`
                ),
                React.createElement('span', { className: 'text-sm text-gray-500' }, 
                    `Showing ${ordersData.items.length} of ${ordersData.totalItems}`
                )
            ),
            React.createElement('div', { className: 'overflow-x-auto' },
                React.createElement('table', { className: 'w-full' },
                    React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-900' },
                        React.createElement('tr', null,
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Order #'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Client'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Event'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Amount'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Status'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
                        )
                    ),
                    React.createElement('tbody', { className: 'divide-y divide-gray-200' },
                        ordersData.items.map(order => 
                            React.createElement('tr', { key: order.id, className: 'hover:bg-gray-50' },
                                React.createElement('td', { className: 'px-4 py-3 font-medium' }, '#' + (order.order_number || order.id)),
                                React.createElement('td', { className: 'px-4 py-3 text-sm' }, order.client_name || '-'),
                                React.createElement('td', { className: 'px-4 py-3 text-sm' }, order.event_name || '-'),
                                React.createElement('td', { className: 'px-4 py-3 text-sm' }, 
                                    order.total_amount ? `₹${parseInt(order.total_amount).toLocaleString()}` : '-'
                                ),
                                React.createElement('td', { className: 'px-4 py-3' },
                                    React.createElement('span', { 
                                        className: `px-2 py-1 text-xs rounded-full ${
                                            order.status === 'approved' ? 'bg-green-100 text-green-800' :
                                            order.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`
                                    }, (order.status || 'pending').replace(/_/g, ' ').toUpperCase())
                                ),
                                React.createElement('td', { className: 'px-4 py-3' },
                                    React.createElement('button', {
                                        onClick: () => window.openOrderDetail && window.openOrderDetail(order),
                                        className: 'text-blue-600 hover:text-blue-800 text-sm'
                                    }, 'View Details')
                                )
                            )
                        )
                    )
                )
            ),
            window.renderMyActionsPagination('orders', ordersData.totalPages, ordersData.currentPage)
        ),

        // My Deliveries Section with Customer Name Fix
        deliveriesData.items.length > 0 && React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow' },
            React.createElement('div', { className: 'p-4 border-b flex justify-between items-center' },
                React.createElement('h2', { className: 'text-xl font-semibold flex items-center gap-2' },
                    React.createElement('span', { className: 'text-purple-600' }, '🚚'),
                    `My Deliveries (${deliveriesData.totalItems})`
                ),
                React.createElement('span', { className: 'text-sm text-gray-500' }, 
                    `Showing ${deliveriesData.items.length} of ${deliveriesData.totalItems}`
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
                        deliveriesData.items.map(delivery => 
                            React.createElement('tr', { key: delivery.id, className: 'hover:bg-gray-50' },
                                React.createElement('td', { className: 'px-4 py-3 font-medium' }, 
                                    '#' + (delivery.delivery_id || delivery.id)
                                ),
                                React.createElement('td', { className: 'px-4 py-3' }, 
                                    '#' + (delivery.order_id)
                                ),
                                React.createElement('td', { className: 'px-4 py-3 text-sm' }, 
                                    // Fix for customer name - try multiple fields
                                    delivery.customer_name || delivery.client_name || delivery.order_client_name || '-'
                                ),
                                React.createElement('td', { className: 'px-4 py-3 text-sm' }, 
                                    delivery.scheduled_date ? 
                                        new Date(delivery.scheduled_date).toLocaleDateString() : 
                                        delivery.delivery_date ? 
                                            new Date(delivery.delivery_date).toLocaleDateString() : '-'
                                ),
                                React.createElement('td', { className: 'px-4 py-3' },
                                    React.createElement('span', { 
                                        className: `px-2 py-1 text-xs rounded-full ${
                                            delivery.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                            delivery.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                                            delivery.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`
                                    }, (delivery.status || 'pending').replace(/_/g, ' ').toUpperCase())
                                ),
                                React.createElement('td', { className: 'px-4 py-3' },
                                    React.createElement('button', {
                                        onClick: () => window.updateDeliveryStatus(delivery.id),
                                        className: 'text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded border border-blue-200 hover:bg-blue-50'
                                    }, 'Update Status')
                                )
                            )
                        )
                    )
                )
            ),
            window.renderMyActionsPagination('deliveries', deliveriesData.totalPages, deliveriesData.currentPage)
        ),

        // No actions message
        !hasActions && !window.loading && React.createElement('div', { className: 'text-center py-12' },
            React.createElement('div', { className: 'text-6xl mb-4' }, '📋'),
            React.createElement('h3', { className: 'text-xl font-medium text-gray-900 mb-2' }, 'No Actions Required'),
            React.createElement('p', { className: 'text-gray-500' }, 'You have no pending leads, orders, or deliveries assigned to you.'),
            React.createElement('button', {
                onClick: window.fetchMyActions,
                className: 'mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'
            }, 'Check for Updates')
        )
    );
};

// =============================================================================
// EVENT LISTENER FOR SEARCH/PAGINATION UPDATES
// =============================================================================

// Add event listener for updates
window.addEventListener('myActionsUpdate', () => {
    // Force re-render by updating the component
    if (window.activeTab === 'myactions') {
        // Trigger a React re-render
        const rootElement = document.getElementById('root');
        if (rootElement && window.ReactDOM) {
            // This will trigger a re-render
            setTimeout(() => {
                if (window.renderContent) {
                    const content = window.renderContent();
                    window.ReactDOM.render(content, rootElement);
                }
            }, 0);
        }
    }
});

console.log('✅ Enhanced My Actions Component loaded successfully with pagination, search, and fixes');
