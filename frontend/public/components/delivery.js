// ============================================================================
// DELIVERY COMPONENT - Extracted from index.html
// ============================================================================
// This component manages delivery tracking and management with logistics,
// scheduling, and comprehensive delivery workflow processing.

// Main Delivery Content Renderer
window.renderDeliveryContent = () => {
    const DELIVERY_STATUSES = {
        pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
        scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
        in_transit: { label: 'In Transit', color: 'bg-purple-100 text-purple-800' },
        delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800' },
        failed: { label: 'Failed', color: 'bg-red-100 text-red-800' }
    };

    return React.createElement('div', { className: 'space-y-6' },
        React.createElement('div', { className: 'flex justify-between items-center' },
            React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' }, 'Delivery Management'),
            React.createElement('div', { className: 'text-sm text-gray-600 dark:text-gray-400' },
                'Track and manage ticket deliveries'
            )
        ),

        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow border' },
            window.deliveries.length > 0 ? React.createElement('div', { className: 'overflow-x-auto' },
                React.createElement('table', { className: 'w-full' },
                    React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-900' },
                        React.createElement('tr', null,
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Delivery#'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Order Details'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Client'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Type'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Assigned To'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Status'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
                        )
                    ),
                    React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
                        window.deliveries.map(delivery => {
                            const status = DELIVERY_STATUSES[delivery.status] || { label: delivery.status, color: 'bg-gray-100 text-gray-800' };

                            return React.createElement('tr', { key: delivery.id, className: 'hover:bg-gray-50' },
                                React.createElement('td', { className: 'px-6 py-4' },
                                    React.createElement('div', { className: 'text-sm font-medium text-gray-900' }, delivery.delivery_number),
                                    React.createElement('div', { className: 'text-xs text-gray-500' }, 
                                        new Date(delivery.created_date).toLocaleDateString()
                                    )
                                ),
                                React.createElement('td', { className: 'px-6 py-4' },
                                    React.createElement('div', { className: 'text-sm text-gray-900' }, delivery.order_number),
                                    React.createElement('div', { className: 'text-xs text-gray-500' }, delivery.event_name),
                                    React.createElement('div', { className: 'text-xs text-blue-600' }, 
                                        (delivery.tickets_count) + ' tickets'
                                    )
                                ),
                                React.createElement('td', { className: 'px-6 py-4' },
                                    React.createElement('div', { className: 'text-sm font-medium text-gray-900' }, delivery.client_name),
                                    React.createElement('div', { className: 'text-xs text-gray-500' }, delivery.client_phone)
                                ),
                                React.createElement('td', { className: 'px-6 py-4' },
                                    delivery.delivery_type ? React.createElement('span', {
                                        className: `px-2 py-1 text-xs rounded ${
                                            delivery.delivery_type === 'online' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                        }`
                                    }, delivery.delivery_type.charAt(0).toUpperCase() + delivery.delivery_type.slice(1)) :
                                    React.createElement('span', { className: 'text-xs text-gray-400' }, 'Not Set')
                                ),
                                React.createElement('td', { className: 'px-6 py-4' },
                                    React.createElement('div', { className: 'text-sm font-medium text-blue-600' }, delivery.assigned_to),
                                    React.createElement('div', { className: 'text-xs text-gray-500' }, 'Supply Team')
                                ),
                                React.createElement('td', { className: 'px-6 py-4' },
                                    React.createElement('span', {
                                        className: 'px-2 py-1 text-xs rounded ' + (status.color)
                                    }, status.label)
                                ),
                                React.createElement('td', { className: 'px-6 py-4' },
                                    React.createElement('div', { className: 'flex flex-wrap gap-1' },
                                        window.hasPermission('delivery', 'write') && delivery.status === 'pending' && 
                                        React.createElement('button', {
                                            className: 'text-blue-600 hover:text-blue-900 text-xs px-2 py-1 rounded border border-blue-200 hover:bg-blue-50',
                                            onClick: () => window.openDeliveryForm(delivery)
                                        }, '📅 Schedule'),
                                        window.hasPermission('delivery', 'write') && 
                                        React.createElement('button', {
                                            className: 'text-red-600 hover:text-red-900 text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50',
                                            onClick: () => window.deleteDelivery(delivery.id),
                                            disabled: window.loading
                                        }, '🗑️ Delete'),
                                        window.hasPermission('delivery', 'write') && delivery.status === 'scheduled' && 
                                        React.createElement('button', {
                                            className: 'text-purple-600 hover:text-purple-900 text-xs px-2 py-1 rounded border border-purple-200 hover:bg-purple-50',
                                            onClick: () => {
                                                window.setDeliveries(prev => 
                                                    prev.map(d => 
                                                        d.id === delivery.id 
                                                            ? { ...d, status: 'in_transit' }
                                                            : d
                                                    )
                                                );
                                                alert('Delivery marked as in transit!');
                                            }
                                        }, '🚚 Start'),
                                        window.hasPermission('delivery', 'write') && delivery.status === 'in_transit' && 
                                        React.createElement('button', {
                                            className: 'text-green-600 hover:text-green-900 text-xs px-2 py-1 rounded border border-green-200 hover:bg-green-50',
                                            onClick: () => {
                                                window.setDeliveries(prev => 
                                                    prev.map(d => 
                                                        d.id === delivery.id 
                                                            ? { ...d, status: 'delivered', delivered_date: new Date().toISOString().split('T')[0] }
                                                            : d
                                                    )
                                                );
                                                alert('Delivery completed successfully!');
                                            }
                                        }, '✅ Complete'),
                                        delivery.status === 'scheduled' && delivery.delivery_type && 
                                        React.createElement('button', {
                                            className: 'text-gray-600 hover:text-gray-900 text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50',
                                            onClick: () => {
                                                let details = 'Delivery Type: ' + (delivery.delivery_type) + '\n';
                                                if (delivery.delivery_type === 'online') {
                                                    details += 'Platform: ' + (delivery.online_platform) + '\n';
                                                    details += 'Link: ' + (delivery.online_link);
                                                } else {
                                                    details += 'Delivery Location: ' + (delivery.delivery_location) + '\n';
                                                    details += 'Date: ' + (delivery.delivery_date) + ' ' + (delivery.delivery_time);
                                                    if (delivery.pickup_location) {
                                                        details += '\nPickup: ' + (delivery.pickup_location);
                                                    }
                                                }
                                                alert(details);
                                            }
                                        }, '👁️ View Details')
                                    )
                                )
                            );
                        })
                    )
                )
            ) : React.createElement('div', { className: 'p-6 text-center text-gray-500' }, 
                'No deliveries found. Deliveries will appear here when orders are assigned to supply team.'
            )
        )
    );
};

console.log('✅ Delivery component loaded successfully');
