// =============================================================================
// FIXED MY ACTIONS COMPONENT - REPLACE components/my-actions.js
// =============================================================================
// Enhanced with proper React state management for search and pagination

// My Actions data arrays - safe defaults
window.myReceivables = window.myReceivables || [];
window.myLeads = window.myLeads || [];
window.myOrders = window.myOrders || [];
window.myDeliveries = window.myDeliveries || [];
window.myQuoteRequested = window.myQuoteRequested || [];

// =============================================================================
// DELIVERY STATUS UPDATE FUNCTION
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
            
            // Update React state if available
            if (window.setMyDeliveries) {
                window.setMyDeliveries([...window.myDeliveries]);
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
// PAGINATION AND FILTERING UTILITIES
// =============================================================================

// Get paginated and filtered data for a section
window.getMyActionsPaginatedData = function(items, section) {
    const appState = window.appState;
    if (!appState || !items) return { items: [], currentPage: 1, totalPages: 1, totalItems: 0 };
    
    const { myActionsFilters, myActionsPagination } = appState;
    if (!myActionsFilters || !myActionsPagination) {
        console.warn('My Actions state not available');
        return { items: [], currentPage: 1, totalPages: 1, totalItems: 0 };
    }
    
    const searchQuery = myActionsFilters.searchQuery.toLowerCase().trim();
    const pagination = myActionsPagination[section];
    
    // Filter by search query
    let filteredItems = items;
    if (searchQuery) {
        filteredItems = items.filter(item => {
            const searchableFields = [
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
                item.temperature,
                item.order_number,
                item.event_name
            ].filter(Boolean).join(' ').toLowerCase();
            
            return searchableFields.includes(searchQuery);
        });
    }
    
    // Calculate pagination
    const totalItems = filteredItems.length;
    const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
    const currentPage = Math.min(pagination.currentPage, totalPages || 1);
    const startIndex = (currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    
    return {
        items: filteredItems.slice(startIndex, endIndex),
        currentPage,
        totalPages,
        totalItems
    };
};

// Change page for a specific section
window.setMyActionsPage = function(section, page) {
    const appState = window.appState;
    if (!appState || !appState.setMyActionsPagination) {
        console.warn('My Actions pagination state not available');
        return;
    }
    
    console.log(`📄 Changing ${section} page to:`, page);
    
    appState.setMyActionsPagination(prev => ({
        ...prev,
        [section]: {
            ...prev[section],
            currentPage: page
        }
    }));
};

// Update search query
window.setMyActionsSearch = function(searchQuery) {
    const appState = window.appState;
    if (!appState || !appState.setMyActionsFilters) {
        console.warn('My Actions filters state not available');
        return;
    }
    
    console.log('🔍 Updating search query to:', searchQuery);
    
    appState.setMyActionsFilters(prev => ({
        ...prev,
        searchQuery: searchQuery
    }));
    
    // Reset all pages to 1 when searching
    appState.setMyActionsPagination(prev => {
        const newPagination = { ...prev };
        Object.keys(newPagination).forEach(section => {
            newPagination[section] = {
                ...newPagination[section],
                currentPage: 1
            };
        });
        return newPagination;
    });
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
            } rounded transition-colors duration-200`
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
            className: 'px-3 py-1 mx-1 text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 rounded transition-colors duration-200'
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
            className: 'px-3 py-1 mx-1 text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 rounded transition-colors duration-200'
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

    // Check if app state is available
    const appState = window.appState;
    if (!appState) {
        return React.createElement('div', { className: 'p-8 text-center' },
            React.createElement('div', { className: 'text-4xl mb-4' }, '⏳'),
            React.createElement('p', { className: 'text-gray-500' }, 'Loading My Actions...')
        );
    }

    const { myActionsFilters } = appState;
    
    // Calculate if we have actions
    const totalOverdueAmount = (window.myReceivables || []).reduce((sum, rec) => sum + (rec.amount || 0), 0);
    const hasActions = (window.myLeads?.length || 0) > 0 || 
                      (window.myOrders?.length || 0) > 0 || 
                      (window.myDeliveries?.length || 0) > 0 ||
                      (window.myQuoteRequested?.length || 0) > 0 ||
                      (window.myReceivables?.length || 0) > 0;
    
    console.log('🎯 hasActions calculation result:', hasActions);
    console.log('🎯 loading state:', window.loading);
    
    // Get paginated data for each section
    const leadsData = window.getMyActionsPaginatedData(window.myLeads || [], 'leads');
    const quotesData = window.getMyActionsPaginatedData(window.myQuoteRequested || [], 'quotes');
    const ordersData = window.getMyActionsPaginatedData(window.myOrders || [], 'orders');
    const deliveriesData = window.getMyActionsPaginatedData(window.myDeliveries || [], 'deliveries');
    const receivablesData = window.getMyActionsPaginatedData(window.myReceivables || [], 'receivables');

    const searchQuery = myActionsFilters?.searchQuery || '';

    return React.createElement('div', { className: 'space-y-6' },
        // Header
        React.createElement('div', { className: 'flex justify-between items-center' },
            React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' }, 'My Actions'),
            React.createElement('button', {
                onClick: () => {
                    console.log('🔄 Manual refresh triggered');
                    window.fetchMyActions && window.fetchMyActions();
                },
                className: 'text-blue-600 hover:text-blue-700 flex items-center gap-2 px-4 py-2 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors duration-200'
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
                        placeholder: 'Search across all sections (company, customer, order ID, etc.)...',
                        value: searchQuery,
                        onChange: (e) => {
                            console.log('🔍 Search input changed:', e.target.value);
                            window.setMyActionsSearch(e.target.value);
                        },
                        className: 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200'
                    })
                ),
                searchQuery && React.createElement('button', {
                    onClick: () => {
                        console.log('🔍 Clearing search');
                        window.setMyActionsSearch('');
                    },
                    className: 'px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200'
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
                    className: 'bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200'
                }, 'View Details')
            )
        ),

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
                            React.createElement('tr', { key: lead.id, className: 'hover:bg-gray-50 transition-colors duration-200' },
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
                                        className: 'text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors duration-200'
                                    }, 'View Details')
                                )
                            )
                        )
                    )
                )
            ) : React.createElement('div', { className: 'p-8 text-center text-gray-500' },
                React.createElement('div', { className: 'text-4xl mb-2' }, '📋'),
                React.createElement('p', null, searchQuery ? 'No leads found matching your search' : 'No leads assigned to you')
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
                            React.createElement('tr', { key: lead.id, className: 'hover:bg-gray-50 transition-colors duration-200' },
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
                                        className: 'text-orange-600 hover:text-orange-800 text-sm px-2 py-1 rounded border border-orange-200 hover:bg-orange-50 transition-colors duration-200'
                                    }, 'Create Quote')
                                )
                            )
                        )
                    )
                )
            ) : React.createElement('div', { className: 'p-8 text-center text-gray-500' },
                React.createElement('div', { className: 'text-4xl mb-2' }, '📋'),
                React.createElement('p', null, searchQuery ? 'No quote requests found matching your search' : 'No quote requests pending')
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
                            React.createElement('tr', { key: delivery.id, className: 'hover:bg-gray-50 transition-colors duration-200' },
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
                                        className: 'text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors duration-200'
                                    }, 'Update Status')
                                )
                            )
                        )
                    )
                )
            ) : React.createElement('div', { className: 'p-8 text-center text-gray-500' },
                React.createElement('div', { className: 'text-4xl mb-2' }, '🚚'),
                React.createElement('p', null, searchQuery ? 'No deliveries found matching your search' : 'No deliveries assigned to you')
            ),
            window.renderMyActionsPagination('deliveries', deliveriesData.totalPages, deliveriesData.currentPage)
        ),

        // No actions message (only when truly no data AND not loading AND no search)
        !hasActions && !window.loading && !searchQuery && React.createElement('div', { className: 'text-center py-12' },
            React.createElement('div', { className: 'text-6xl mb-4' }, '📋'),
            React.createElement('h3', { className: 'text-xl font-medium text-gray-900 mb-2' }, 'No Actions Required'),
            React.createElement('p', { className: 'text-gray-500 mb-4' }, 'You have no pending leads, orders, or deliveries assigned to you.'),
            React.createElement('button', {
                onClick: () => {
                    console.log('🔄 Check for Updates clicked');
                    window.fetchMyActions && window.fetchMyActions();
                },
                className: 'bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200'
            }, 'Check for Updates')
        ),

        // Loading state
        window.loading && React.createElement('div', { className: 'text-center py-12' },
            React.createElement('div', { className: 'text-4xl mb-4' }, '⏳'),
            React.createElement('p', { className: 'text-gray-500' }, 'Loading your actions...')
        )
    );
};

console.log('✅ Enhanced My Actions Component loaded successfully with proper React state management');
