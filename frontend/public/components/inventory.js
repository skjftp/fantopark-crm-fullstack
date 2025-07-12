// components/inventory.js
// Inventory Content Component - Complete with CSV Upload Fix
// Complete inventory management functionality with advanced filtering, sorting, and allocation features

window.renderInventoryContent = () => {
    // ENHANCED FILTERING - includes event type filter
    const filteredInventory = (window.inventory || []).filter(item => {
        const daysUntilEvent = window.getInventoryDueInDays(item.event_date);

        // Event name filter
        if (window.inventoryEventFilter !== 'all' && item.event_name !== window.inventoryEventFilter) {
            return false;
        }

        // Event type filter
        if (window.inventoryEventTypeFilter !== 'all' && item.event_type !== window.inventoryEventTypeFilter) {
            return false;
        }

        // Due date filter
        switch (window.inventoryDueDateFilter) {
            case '3days':
                return daysUntilEvent >= 0 && daysUntilEvent <= 3;
            case '7days':
                return daysUntilEvent >= 0 && daysUntilEvent <= 7;
            case '15days':
                return daysUntilEvent >= 0 && daysUntilEvent <= 15;
            case '30days':
                return daysUntilEvent >= 0 && daysUntilEvent <= 30;
            case 'all':
            default:
                return true;
        }
    });

    // ENHANCED SORTING - works on ALL filtered data before pagination
    const sortedInventory = filteredInventory.sort((a, b) => {
        let aValue, bValue;

        switch (window.inventorySortField) {
            case 'event_date':
                aValue = new Date(a.event_date);
                bValue = new Date(b.event_date);
                break;
            case 'event_name':
                aValue = a.event_name.toLowerCase();
                bValue = b.event_name.toLowerCase();
                break;
            case 'event_type':
                aValue = (a.event_type || '').toLowerCase();
                bValue = (b.event_type || '').toLowerCase();
                break;
            case 'available_tickets':
                aValue = parseInt(a.available_tickets) || 0;
                bValue = parseInt(b.available_tickets) || 0;
                break;
            default:
                aValue = new Date(a.event_date);
                bValue = new Date(b.event_date);
        }

        if (window.inventorySortDirection === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    // Pagination logic for inventory (applied AFTER filtering and sorting)
    const indexOfLastInventory = window.currentInventoryPage * window.itemsPerPage;
    const indexOfFirstInventory = indexOfLastInventory - window.itemsPerPage;
    const currentInventoryItems = sortedInventory.slice(indexOfFirstInventory, indexOfLastInventory);
    const totalInventoryPages = Math.ceil(sortedInventory.length / window.itemsPerPage);

    return React.createElement('div', { className: 'space-y-6' },
        React.createElement('div', { className: 'flex justify-between items-center' },
            React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' }, 'Inventory Management'),
            
            // Action buttons container
            React.createElement('div', { className: 'flex gap-2' },
                // Add New Event button
                window.hasPermission('inventory', 'write') && React.createElement('button', { 
                    className: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700',
                    onClick: window.openAddInventoryForm
                }, '+ Add New Event'),
                
                // Upload CSV button - FIXED VERSION
                React.createElement('button', {
                    onClick: () => {
                        console.log("📦 Upload CSV button clicked from inventory page");
                        window.openInventoryCSVUpload();
                    },
                    className: 'bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded flex items-center gap-2'
                }, 
                    React.createElement('svg', {
                        className: 'w-5 h-5',
                        fill: 'none',
                        stroke: 'currentColor',
                        viewBox: '0 0 24 24'
                    },
                        React.createElement('path', {
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round',
                            strokeWidth: 2,
                            d: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
                        })
                    ),
                    'Upload CSV'
                ),
                
                // Direct Download button (for testing)
                React.createElement('button', {
                    onClick: () => {
                        console.log("📦 Direct download button clicked");
                        window.downloadInventoryCSVDirect();
                    },
                    className: 'bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2',
                    title: 'Download CSV template directly'
                }, 
                    React.createElement('svg', {
                        className: 'w-5 h-5',
                        fill: 'none',
                        stroke: 'currentColor',
                        viewBox: '0 0 24 24'
                    },
                        React.createElement('path', {
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round',
                            strokeWidth: 2,
                            d: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                        })
                    ),
                    'Download Template'
                )
            )
        ),

        // ENHANCED FILTERS SECTION
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow border p-4 mb-4' },
            React.createElement('div', { className: 'flex space-x-4' },
                React.createElement('div', { className: 'flex-1' },
                    React.createElement('div', {
                        style: {
                            display: window.currentUser?.role === 'super_admin' ? 'block' : 'none',
                            backgroundColor: window.testMode ? '#fef2f2' : '#fef3c7',
                            border: window.testMode ? '2px solid #dc2626' : '2px solid #f59e0b',
                            borderRadius: '8px',
                            padding: '12px 24px',
                            margin: '16px',
                            textAlign: 'center'
                        }
                    },
                        React.createElement('strong', {
                            style: { fontSize: '16px', marginRight: '16px' }
                        }, '🧪 Test Mode is ' + (window.testMode ? 'ACTIVE' : 'INACTIVE')),
                        React.createElement('button', {
                            onClick: () => {
                                const newValue = !window.testMode;
                                window.setTestMode(newValue);
                                localStorage.setItem('testMode', String(newValue));
                                window.location.reload();
                            },
                            style: {
                                padding: '6px 20px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: window.testMode ? '#dc2626' : '#10b981',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '14px'
                            }
                        }, window.testMode ? 'TURN OFF' : 'TURN ON')
                    ),

                    React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Filter by Due Date'),
                    React.createElement('select', {
                        value: window.inventoryDueDateFilter,
                        onChange: (e) => {
                            window.setInventoryDueDateFilter(e.target.value);
                            window.setCurrentInventoryPage(1);
                        },
                        className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                    },
                        React.createElement('option', { value: 'all' }, 'All Inventory'),
                        React.createElement('option', { value: '3days' }, 'Due in 3 Days'),
                        React.createElement('option', { value: '7days' }, 'Due in 7 Days'),
                        React.createElement('option', { value: '15days' }, 'Due in 15 Days'),
                        React.createElement('option', { value: '30days' }, 'Due in 1 Month')
                    )
                ),

                React.createElement('div', { className: 'flex-1' },
                    React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Filter by Event'),
                    React.createElement('select', {
                        value: window.inventoryEventFilter,
                        onChange: (e) => {
                            window.setInventoryEventFilter(e.target.value);
                            window.setCurrentInventoryPage(1);
                        },
                        className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                    },
                        React.createElement('option', { value: 'all' }, 'All Events'),
                        // Fixed to use ALL inventory data, not just current page
                        ...Array.from(new Set((window.inventory || []).map(item => item.event_name))).sort().map(event =>
                            React.createElement('option', { key: event, value: event }, event)
                        )
                    )
                ),

                // Event Type Filter
                React.createElement('div', { className: 'flex-1' },
                    React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Filter by Event Type'),
                    React.createElement('select', {
                        value: window.inventoryEventTypeFilter,
                        onChange: (e) => {
                            window.setInventoryEventTypeFilter(e.target.value);
                            window.setCurrentInventoryPage(1);
                        },
                        className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                    },
                        React.createElement('option', { value: 'all' }, 'All Event Types'),
                        ...Array.from(new Set((window.inventory || []).map(item => item.event_type).filter(Boolean))).sort().map(eventType =>
                            React.createElement('option', { key: eventType, value: eventType }, 
                                eventType.charAt(0).toUpperCase() + eventType.slice(1)
                            )
                        )
                    )
                ),

                // Sort Controls
                React.createElement('div', { className: 'flex-1' },
                    React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Sort By'),
                    React.createElement('div', { className: 'flex gap-2' },
                        React.createElement('select', {
                            value: window.inventorySortField,
                            onChange: (e) => {
                                window.setInventorySortField(e.target.value);
                                window.setCurrentInventoryPage(1);
                            },
                            className: 'flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                        },
                            React.createElement('option', { value: 'event_date' }, 'Event Date'),
                            React.createElement('option', { value: 'event_name' }, 'Event Name'),
                            React.createElement('option', { value: 'event_type' }, 'Event Type'),
                            React.createElement('option', { value: 'available_tickets' }, 'Available Tickets')
                        ),
                        React.createElement('button', {
                            onClick: () => {
                                window.setInventorySortDirection(window.inventorySortDirection === 'asc' ? 'desc' : 'asc');
                                window.setCurrentInventoryPage(1);
                            },
                            className: 'px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500',
                            title: window.inventorySortDirection === 'asc' ? 'Sort Descending' : 'Sort Ascending'
                        }, window.inventorySortDirection === 'asc' ? '↑' : '↓')
                    )
                )
            ),

            // Filter Status Summary
            React.createElement('div', { className: 'mt-4 flex justify-between items-center' },
                React.createElement('span', { className: 'text-sm text-gray-600' },
                    `Showing ${sortedInventory.length} of ${(window.inventory || []).length} events`
                ),
                (window.inventoryEventFilter !== 'all' || window.inventoryEventTypeFilter !== 'all' || window.inventoryDueDateFilter !== 'all') &&
                React.createElement('button', {
                    onClick: () => {
                        window.setInventoryEventFilter('all');
                        window.setInventoryEventTypeFilter('all');
                        window.setInventoryDueDateFilter('all');
                        window.setCurrentInventoryPage(1);
                    },
                    className: 'text-sm text-blue-600 hover:text-blue-800 underline'
                }, 'Clear All Filters')
            )
        ),

        // INVENTORY TABLE
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow border' },
            (window.inventory || []).length > 0 ? 
            React.createElement('div', { className: 'overflow-x-auto' },
                React.createElement('table', { className: 'w-full' },
                    React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-900' },
                        React.createElement('tr', null,
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Event'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Sports'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Category'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Date'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Available'),
                            window.hasPermission('finance', 'read') && React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Margin'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
                        )
                    ),
                    React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
                        (currentInventoryItems || []).map(item =>
                            React.createElement('tr', { key: item.id, className: 'hover:bg-gray-50' },
                                React.createElement('td', { className: 'px-6 py-4' },
                                    React.createElement('div', { 
                                        className: 'cursor-pointer hover:text-blue-600',
                                        onClick: () => window.openInventoryDetail(item)
                                    },
                                        React.createElement('div', { className: 'text-sm font-medium text-gray-900 hover:text-blue-600' }, item.event_name),
                                        React.createElement('div', { className: 'text-sm text-gray-500' }, item.venue),
                                        React.createElement('div', { className: 'text-xs text-gray-400' }, 
                                            new Date(item.event_date).toLocaleDateString('en-US', { 
                                                year: 'numeric', month: 'short', day: 'numeric' 
                                            })
                                        ),
                                        React.createElement('div', { className: 'text-xs text-blue-600 mt-1' }, '👁️ Click to view details')
                                    )
                                ),
                                React.createElement('td', { className: 'px-6 py-4 text-sm text-gray-900' }, item.sports || item.event_type),
                                React.createElement('td', { className: 'px-6 py-4' },
                                    React.createElement('span', {
                                        className: `px-2 py-1 text-xs rounded ${
                                            (item.category_of_ticket === 'VIP' || item.category_of_ticket === 'Premium') ? 'bg-purple-100 text-purple-800' :
                                            (item.category_of_ticket === 'Gold') ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-green-100 text-green-800'
                                        }`
                                    }, item.category_of_ticket || 'General'),
                                    item.stand ? React.createElement('div', { className: 'text-xs text-gray-500 mt-1' }, item.stand) : null
                                ),
                                React.createElement('td', { className: 'px-6 py-4 text-sm text-gray-900' }, new Date(item.event_date).toLocaleDateString()),
                                React.createElement('td', { className: 'px-6 py-4' },
                                    React.createElement('span', {
                                        className: `px-2 py-1 text-xs rounded ${
                                            item.available_tickets > 20 ? 'bg-green-100 text-green-800' :
                                            item.available_tickets > 5 ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`
                                    }, item.available_tickets + ' tickets')
                                ),
                                window.hasPermission('finance', 'read') && React.createElement('td', { className: 'px-6 py-4' },
                                    React.createElement('div', { className: 'text-sm text-gray-900' }, 
                                        (() => {
                                            const buyingPrice = item.buying_price || 0;
                                            const sellingPrice = item.selling_price || item.price_per_ticket || 0;
                                            const marginAmount = sellingPrice - buyingPrice;

                                            // Calculate margin percentage: (Selling Price - Buying Price) / Buying Price * 100
                                            const marginPercentage = buyingPrice > 0 ? ((marginAmount / sellingPrice) * 100) : 0;

                                            return '₹' + marginAmount.toLocaleString() + ' (' + marginPercentage.toFixed(1) + '%)';
                                        })()
                                    ),
                                    React.createElement('div', { className: 'text-xs text-gray-500' },
                                        'Buy: ₹' + (item.buying_price || 0).toLocaleString() + 
                                        ' | Sell: ₹' + (item.selling_price || item.price_per_ticket || 0).toLocaleString()
                                    )
                                ),
                                React.createElement('td', { className: 'px-6 py-4 text-sm' },
                                    React.createElement('div', { className: 'flex flex-wrap gap-1' },
                                        window.hasPermission('inventory', 'write') && React.createElement('button', { 
                                            className: 'text-blue-600 hover:text-blue-900 text-xs px-2 py-1 rounded border border-blue-200 hover:bg-blue-50',
                                            onClick: () => window.openEditInventoryForm(item)
                                        }, '✏️ Edit'),

                                        window.hasPermission('inventory', 'write') && React.createElement('button', { 
                                            className: 'text-indigo-600 hover:text-indigo-900 text-xs px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-50',
                                            onClick: () => window.handleCopyInventory(item),
                                            title: 'Create a copy of this inventory item',
                                            disabled: window.loading
                                        }, window.loading ? '⏳' : '📋 Copy'),

                                        window.hasPermission('inventory', 'allocate') && item.available_tickets > 0 && React.createElement('button', { 
                                            className: 'text-green-600 hover:text-green-900 text-xs px-2 py-1 rounded border border-green-200 hover:bg-green-50',
                                            onClick: () => window.openAllocationForm(item)
                                        }, '🎫 Allocate'),
                                        window.hasPermission('inventory', 'read') && React.createElement('button', { 
                                            className: 'text-purple-600 hover:text-purple-900 text-xs px-2 py-1 rounded border border-purple-200 hover:bg-purple-50',
                                            onClick: () => window.openAllocationManagement(item)
                                        }, '👁️ View Allocations'),
                                        window.hasPermission('inventory', 'delete') && React.createElement('button', { 
                                            className: 'text-red-600 hover:text-red-900 text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50',
                                            onClick: () => window.handleDelete('inventory', item.id, item.event_name),
                                            disabled: window.loading
                                        }, window.loading ? 'Deleting...' : '🗑️ Delete')
                                    )
                                )
                            )
                        )
                    )
                ),
                // Updated pagination controls
                sortedInventory.length > window.itemsPerPage && React.createElement('div', { className: 'flex justify-between items-center px-6 py-3 bg-gray-50 border-t' },
                    React.createElement('div', { className: 'text-sm text-gray-700' },
                        'Showing ' + (indexOfFirstInventory + 1) + ' to ' + (Math.min(indexOfLastInventory, sortedInventory.length)) + ' of ' + (sortedInventory.length) + ' events'
                    ),
                    React.createElement('div', { className: 'flex space-x-2' },
                        React.createElement('button', {
                            onClick: () => window.setCurrentInventoryPage(prev => Math.max(prev - 1, 1)),
                            disabled: window.currentInventoryPage === 1,
                            className: 'px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50'
                        }, 'Previous'),
                        React.createElement('span', { className: 'px-3 py-1' }, 'Page ' + (window.currentInventoryPage) + ' of ' + (totalInventoryPages)),
                        React.createElement('button', {
                            onClick: () => window.setCurrentInventoryPage(prev => Math.min(prev + 1, totalInventoryPages)),
                            disabled: window.currentInventoryPage === totalInventoryPages,
                            className: 'px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50'
                        }, 'Next')
                    )
                )
            ) : React.createElement('div', { className: 'p-6 text-center text-gray-500' }, 'No events found. Add your first event!')
        )
    );
};

console.log("✅ Complete inventory.js loaded with CSV upload fixes");
