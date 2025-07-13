// =============================================================================
// FIXED MY ACTIONS COMPONENT - REPLACE components/my-actions.js
// =============================================================================
// Enhanced with proper state synchronization and UI display logic

// My Actions data arrays - safe defaults with immediate initialization
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
    
    if (!window.hasPermission || !window.hasPermission('delivery', 'write')) {
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
        `\n\nEnter number (1-${statusOptions.length}):`
    );
    
    if (!newStatus) return;
    
    const selectedIndex = parseInt(newStatus) - 1;
    if (selectedIndex < 0 || selectedIndex >= statusOptions.length) {
        alert('Invalid selection');
        return;
    }
    
    const selectedStatus = statusOptions[selectedIndex].value;
    
    try {
        // Update delivery status via API
        const response = await window.apiCall(`/deliveries/${deliveryId}`, 'PUT', {
            status: selectedStatus,
            updated_date: new Date().toISOString(),
            updated_by: window.user?.email
        });
        
        if (response.success) {
            // Update local data
            const deliveryIndex = window.myDeliveries.findIndex(d => d.id === deliveryId);
            if (deliveryIndex >= 0) {
                window.myDeliveries[deliveryIndex].status = selectedStatus;
                window.myDeliveries[deliveryIndex].updated_date = new Date().toISOString();
            }
            
            alert(`Delivery status updated to: ${selectedStatus.replace(/_/g, ' ').toUpperCase()}`);
            
            // Force refresh of My Actions
            window.refreshMyActions && window.refreshMyActions();
        } else {
            alert('Failed to update delivery status');
        }
    } catch (error) {
        console.error('Error updating delivery status:', error);
        alert('Error updating delivery status');
    }
};

// =============================================================================
// PAGINATION FUNCTIONS
// =============================================================================

window.setMyActionsPage = function(section, page) {
    if (window.myActionsPagination[section]) {
        window.myActionsPagination[section].currentPage = page;
        // Force re-render by triggering state update
        if (window.setActiveTab) {
            window.setActiveTab('myactions');
        }
    }
};

// Get paginated data for a section
window.getPaginatedData = function(items, section) {
    const pagination = window.myActionsPagination[section];
    if (!pagination || !items) return { items: [], currentPage: 1, totalPages: 1 };
    
    const { currentPage, itemsPerPage } = pagination;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const totalPages = Math.ceil(items.length / itemsPerPage);
    
    return {
        items: items.slice(startIndex, endIndex),
        currentPage,
        totalPages,
        totalItems: items.length
    };
};

// Filter items by search query
window.filterBySearch = function(items, searchQuery) {
    if (!searchQuery || !items) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter(item => {
        const searchableText = [
            item.company_name,
            item.customer_name,
            item.client_name,
            item.name,
            item.email,
            item.phone,
            item.order_id,
            item.delivery_id,
            item.id,
            item.status,
            item.temperature
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchableText.includes(query);
    });
};

// Render pagination controls
window.renderMyActionsPagination = function(section, totalPages, currentPage) {
    if (totalPages <= 1) return null;
    
    const createPageButton = (pageNum, isActive) => {
        return React.createElement('button', {
            key: pageNum,
            onClick: () => window.setMyActionsPage(section, pageNum),
            className: `px-3 py-1 mx-1 text-sm ${
                isActive ? 
                    'bg-blue-600 text-white' 
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
    console.log('🔍 MY ACTIONS RENDER DEBUG:');
    console.log('myLeads length:', window.myLeads?.length || 0);
    console.log('myOrders length:', window.myOrders?.length || 0);
    console.log('myDeliveries length:', window.myDeliveries?.length || 0);
    console.log('myQuoteRequested length:', window.myQuoteRequested?.length || 0);
    console.log('myReceivables length:', window.myReceivables?.length || 0);

    // ✅ ENHANCED hasActions calculation with better debugging
    const totalOverdueAmount = (window.myReceivables || []).reduce((sum, rec) => sum + (rec.amount || 0), 0);
    const hasActions = (window.myLeads?.length || 0) > 0 || 
                      (window.myOrders?.length || 0) > 0 || 
                      (window.myDeliveries?.length || 0) > 0 ||
                      (window.myQuoteRequested?.length || 0) > 0 ||
                      (window.myReceivables?.length || 0) > 0;
    
    console.log('🎯 hasActions calculation result:', hasActions);
    console.log('🎯 loading state:', window.loading);
    
    // Get paginated data for each section (with search filtering)
    const searchQuery = window.myActionsSearch;
    
    const leadsData = window.getPaginatedData(
        window.filterBySearch(window.myLeads || [], searchQuery), 
        'leads'
    );
    
    const quotesData = window.getPaginatedData(
        window.filterBySearch(window.myQuoteRequested || [], searchQuery), 
        'quotes'
    );
    
    const ordersData = window.getPaginatedData(
        window.filterBySearch(window.myOrders || [], searchQuery), 
        'orders'
    );
    
    const deliveriesData = window.getPaginatedData(
        window.filterBySearch(window.myDeliveries || [], searchQuery), 
        'deliveries'
    );
    
    const receivablesData = window.getPaginatedData(
        window.filterBySearch(window.myReceivables || [], searchQuery), 
        'receivables'
    );

    return React.createElement('div', { className: 'space-y-6' },
        React.createElement('div', { className: 'flex justify-between items-center' },
            React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' }, 'My Actions'),
            React.createElement('button', {
                onClick: () => {
                    console.log('🔄 Manual refresh triggered');
                    window.fetchMyActions && window.fetchMyActions();
                },
                className: 'text-blue-600 hover:text-blue-700 flex items-center gap-2'
            }, 
                React.createElement('span', null, '↻'),
                'Refresh'
            )
        ),

        // Search Bar
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-4' },
            React.createElement('div', { className: 'flex items-center gap-4' },
                React.createElement('div', { className: 'flex-1' },
                    React.createElement('input', {
                        type: 'text',
                        placeholder: 'Search across all sections...',
                        value: window.myActionsSearch,
                        onChange: (e) => {
                            window.myActionsSearch = e.target.value;
                            // Force re-render
                            if (window.setActiveTab) {
                                window.setActiveTab('myactions');
                            }
                        },
                        className: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    })
                ),
                searchQuery && React.createElement('button', {
                    onClick: () => {
                        window.myActionsSearch = '';
                        if (window.setActiveTab) {
                            window.setActiveTab('myactions');
                        }
                    },
                    className: 'px-4 py-2 text-gray-600 hover:text-gray-800'
                }, 'Clear')
            )
        ),

        // Overdue Receivables Alert
        receivablesData.items.length > 0 && React.createElement('div', { 
            className: 'bg-red-50 border-2 border-red-200 rounded-lg p-4 animate-pulse' 
        },
            React.createElement('div', { className: 'flex items-center justify-between' },
                React.createElement('div', { className: 'flex items-center' },
                    React.createElement('span', { className: 'text-2xl mr-3' }, '⚠️'),
                    React.createElement('div', null,
                        React.createElement('h3', { className: 'text-lg font-semibold text-red-800' }, 
                            `${receivablesData.totalItems} Overdue Payment${receivablesData.totalItems > 1 ? 's' : ''}`
                        ),
                        React.createElement('p', { className: 'text-red-600' }, 
                            `Total overdue: ₹${totalOverdueAmount.toLocaleString()}`
                        )
                    )
                ),
                React.createElement('button', {
                    onClick: () => window.setActiveTab && window.setActiveTab('finance'),
                    className: 'bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700'
                }, 'View Details')
            )
        ),

        // ✅ ENHANCED: Show sections even if empty, but with different styling
        
        // My Leads Section
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow' },
            React.createElement('div', { className: 'p-4 border-b flex justify-between items-center' },
                React.createElement('h2', { className: 'text-xl font-semibold flex items-center gap-2' },
                    React.createElement('span', { className: 'text-blue-600' }, '👥'),
                    `My Leads (${leadsData.totalItems})`
                ),
                leadsData.totalItems > 0 && React.createElement('span', { 
                    className: 'bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium' 
                }, `${leadsData.totalItems} total`)
            ),
            leadsData.items.length > 0 ? React.createElement('div', { className: 'overflow-x-auto' },
                React.createElement('table', { className: 'w-full' },
                    React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-700' },
                        React.createElement('tr', null,
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Company'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Contact'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Status'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Value'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Actions')
                        )
                    ),
                    React.createElement('tbody', { className: 'bg-white dark:bg-gray-800 divide-y divide-gray-200' },
                        leadsData.items.map(lead => 
                            React.createElement('tr', { key: lead.id, className: 'hover:bg-gray-50' },
                                React.createElement('td', { className: 'px-4 py-3' },
                                    React.createElement('div', { className: 'font-medium text-gray-900' }, 
                                        lead.company_name || lead.name || 'Unknown'
                                    ),
                                    React.createElement('div', { className: 'text-sm text-gray-500' }, 
                                        lead.email || '-'
                                    )
                                ),
                                React.createElement('td', { className: 'px-4 py-3 text-sm' }, 
                                    lead.phone || '-'
                                ),
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
            ) : React.createElement('div', { className: 'p-8 text-center text-gray-500' },
                React.createElement('div', { className: 'text-4xl mb-2' }, '📋'),
                React.createElement('p', null, 'No leads assigned to you')
            ),
            window.renderMyActionsPagination('leads', leadsData.totalPages, leadsData.currentPage)
        ),

        // Quote Requests Section
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow' },
            React.createElement('div', { className: 'p-4 border-b flex justify-between items-center' },
                React.createElement('h2', { className: 'text-xl font-semibold flex items-center gap-2' },
                    React.createElement('span', { className: 'text-orange-600' }, '📋'),
                    `Quote Requests - Supply Team (${quotesData.totalItems})`
                ),
                quotesData.totalItems > 0 && React.createElement('span', { 
                    className: 'bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium' 
                }, `${quotesData.totalItems} pending`)
            ),
            quotesData.items.length > 0 ? React.createElement('div', { className: 'overflow-x-auto' },
                React.createElement('table', { className: 'w-full' },
                    React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-700' },
                        React.createElement('tr', null,
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Company'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Contact'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Requested'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Value'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Actions')
                        )
                    ),
                    React.createElement('tbody', { className: 'bg-white dark:bg-gray-800 divide-y divide-gray-200' },
                        quotesData.items.map(lead => 
                            React.createElement('tr', { key: lead.id, className: 'hover:bg-gray-50' },
                                React.createElement('td', { className: 'px-4 py-3' },
                                    React.createElement('div', { className: 'font-medium text-gray-900' }, 
                                        lead.company_name || lead.name || 'Unknown'
                                    ),
                                    React.createElement('div', { className: 'text-sm text-gray-500' }, 
                                        lead.email || '-'
                                    )
                                ),
                                React.createElement('td', { className: 'px-4 py-3 text-sm' }, 
                                    lead.phone || '-'
                                ),
                                React.createElement('td', { className: 'px-4 py-3 text-sm' }, 
                                    lead.date_of_enquiry ? new Date(lead.date_of_enquiry).toLocaleDateString() : '-'
                                ),
                                React.createElement('td', { className: 'px-4 py-3 text-sm' }, 
                                    lead.potential_value ? `₹${parseInt(lead.potential_value).toLocaleString()}` : '-'
                                ),
                                React.createElement('td', { className: 'px-4 py-3' },
                                    React.createElement('button', {
                                        onClick: () => window.openLeadDetail && window.openLeadDetail(lead),
                                        className: 'text-orange-600 hover:text-orange-800 text-sm'
                                    }, 'Create Quote')
                                )
                            )
                        )
                    )
                )
            ) : React.createElement('div', { className: 'p-8 text-center text-gray-500' },
                React.createElement('div', { className: 'text-4xl mb-2' }, '📋'),
                React.createElement('p', null, 'No quote requests pending')
            ),
            window.renderMyActionsPagination('quotes', quotesData.totalPages, quotesData.currentPage)
        ),

        // My Deliveries Section
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow' },
            React.createElement('div', { className: 'p-4 border-b flex justify-between items-center' },
                React.createElement('h2', { className: 'text-xl font-semibold flex items-center gap-2' },
                    React.createElement('span', { className: 'text-green-600' }, '🚚'),
                    `My Deliveries (${deliveriesData.totalItems})`
                ),
                deliveriesData.totalItems > 0 && React.createElement('span', { 
                    className: 'bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium' 
                }, `${deliveriesData.totalItems} active`)
            ),
            deliveriesData.items.length > 0 ? React.createElement('div', { className: 'overflow-x-auto' },
                React.createElement('table', { className: 'w-full' },
                    React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-700' },
                        React.createElement('tr', null,
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Delivery ID'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Customer'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Order ID'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Scheduled Date'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Status'),
                            React.createElement('th', { className: 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider' }, 'Actions')
                        )
                    ),
                    React.createElement('tbody', { className: 'bg-white dark:bg-gray-800 divide-y divide-gray-200' },
                        deliveriesData.items.map(delivery => 
                            React.createElement('tr', { key: delivery.id, className: 'hover:bg-gray-50' },
                                React.createElement('td', { className: 'px-4 py-3 font-mono text-sm' }, 
                                    delivery.id?.slice(-8) || '-'
                                ),
                                React.createElement('td', { className: 'px-4 py-3' },
                                    React.createElement('div', { className: 'font-medium text-gray-900' }, 
                                        delivery.customer_name || 'Unknown Customer'
                                    )
                                ),
                                React.createElement('td', { className: 'px-4 py-3 font-mono text-sm' }, 
                                    delivery.order_id?.slice(-8) || '-'
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
            ) : React.createElement('div', { className: 'p-8 text-center text-gray-500' },
                React.createElement('div', { className: 'text-4xl mb-2' }, '🚚'),
                React.createElement('p', null, 'No deliveries assigned to you')
            ),
            window.renderMyActionsPagination('deliveries', deliveriesData.totalPages, deliveriesData.currentPage)
        ),

        // ✅ ENHANCED: Show "No Actions Required" only when truly no data AND not loading
        !hasActions && !window.loading && React.createElement('div', { className: 'text-center py-12' },
            React.createElement('div', { className: 'text-6xl mb-4' }, '📋'),
            React.createElement('h3', { className: 'text-xl font-medium text-gray-900 mb-2' }, 'No Actions Required'),
            React.createElement('p', { className: 'text-gray-500 mb-4' }, 'You have no pending leads, orders, or deliveries assigned to you.'),
            React.createElement('button', {
                onClick: () => {
                    console.log('🔄 Check for Updates clicked');
                    window.fetchMyActions && window.fetchMyActions();
                },
                className: 'bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700'
            }, 'Check for Updates')
        ),

        // Loading state
        window.loading && React.createElement('div', { className: 'text-center py-12' },
            React.createElement('div', { className: 'text-4xl mb-4' }, '⏳'),
            React.createElement('p', { className: 'text-gray-500' }, 'Loading your actions...')
        )
    );
};

console.log('✅ Enhanced My Actions Component loaded successfully with pagination, search, and fixes');
