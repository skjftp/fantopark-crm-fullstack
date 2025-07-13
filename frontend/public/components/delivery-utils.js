// =============================================================================
// DELIVERY STATUS UTILITIES - ADD TO utils/delivery-utils.js (NEW FILE)
// =============================================================================
// Enhanced delivery status management and utilities

// Enhanced delivery status options with descriptions
window.DELIVERY_STATUS_OPTIONS = [
    { 
        value: 'scheduled', 
        label: 'Scheduled', 
        description: 'Delivery is scheduled and planned',
        color: 'bg-yellow-100 text-yellow-800'
    },
    { 
        value: 'in_transit', 
        label: 'In Transit', 
        description: 'Delivery is on the way to customer',
        color: 'bg-blue-100 text-blue-800'
    },
    { 
        value: 'delivered', 
        label: 'Delivered', 
        description: 'Successfully delivered to customer',
        color: 'bg-green-100 text-green-800'
    },
    { 
        value: 'failed', 
        label: 'Failed', 
        description: 'Delivery attempt failed',
        color: 'bg-red-100 text-red-800'
    },
    { 
        value: 'cancelled', 
        label: 'Cancelled', 
        description: 'Delivery was cancelled',
        color: 'bg-gray-100 text-gray-800'
    },
    { 
        value: 'returned', 
        label: 'Returned', 
        description: 'Package returned to sender',
        color: 'bg-orange-100 text-orange-800'
    }
];

// Get delivery status color class
window.getDeliveryStatusColor = function(status) {
    const statusOption = window.DELIVERY_STATUS_OPTIONS.find(opt => opt.value === status);
    return statusOption ? statusOption.color : 'bg-gray-100 text-gray-800';
};

// Get delivery status label
window.getDeliveryStatusLabel = function(status) {
    const statusOption = window.DELIVERY_STATUS_OPTIONS.find(opt => opt.value === status);
    return statusOption ? statusOption.label : status?.replace(/_/g, ' ').toUpperCase() || 'Unknown';
};

// Enhanced delivery status update with modal dialog
window.showDeliveryStatusModal = function(deliveryId) {
    const delivery = window.myDeliveries?.find(d => d.id === deliveryId);
    if (!delivery) {
        alert('Delivery not found');
        return;
    }

    const currentStatus = delivery.status || 'scheduled';
    const currentOption = window.DELIVERY_STATUS_OPTIONS.find(opt => opt.value === currentStatus);
    
    // Create modal content
    const modalContent = `
        <div style="font-family: Arial, sans-serif;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Update Delivery Status</h3>
            
            <div style="margin-bottom: 15px; padding: 10px; background: #f3f4f6; border-radius: 5px;">
                <strong>Delivery ID:</strong> #${delivery.delivery_id || delivery.id}<br>
                <strong>Order ID:</strong> #${delivery.order_id}<br>
                <strong>Customer:</strong> ${delivery.customer_name || 'Unknown'}<br>
                <strong>Current Status:</strong> ${currentOption ? currentOption.label : currentStatus}
            </div>
            
            <p style="margin: 0 0 10px 0; color: #555;">Select new status:</p>
            
            ${window.DELIVERY_STATUS_OPTIONS.map((opt, idx) => `
                <div style="margin-bottom: 8px;">
                    <strong>${idx + 1}.</strong> ${opt.label}
                    <span style="color: #666; font-size: 12px;"> - ${opt.description}</span>
                </div>
            `).join('')}
        </div>
    `;
    
    // Show modal (simple prompt for now, can be enhanced with actual modal)
    const choice = prompt(
        `Delivery ID: #${delivery.delivery_id || delivery.id}\n` +
        `Order ID: #${delivery.order_id}\n` +
        `Customer: ${delivery.customer_name || 'Unknown'}\n` +
        `Current Status: ${currentOption ? currentOption.label : currentStatus}\n\n` +
        `Select new status:\n` +
        window.DELIVERY_STATUS_OPTIONS.map((opt, idx) => `${idx + 1}. ${opt.label} - ${opt.description}`).join('\n') +
        `\n\nEnter number (1-${window.DELIVERY_STATUS_OPTIONS.length}):`
    );
    
    return choice;
};

// Delivery customer name resolver
window.resolveDeliveryCustomerName = function(delivery, orders = []) {
    // Try multiple possible customer name fields
    const possibleNames = [
        delivery.customer_name,
        delivery.client_name,
        delivery.order_client_name,
        delivery.recipient_name
    ];
    
    // Check if any direct name exists
    for (const name of possibleNames) {
        if (name && name.trim()) {
            return name;
        }
    }
    
    // Try to find customer name from order data
    if (delivery.order_id && orders.length > 0) {
        const relatedOrder = orders.find(order => order.id === delivery.order_id);
        if (relatedOrder) {
            return relatedOrder.client_name || relatedOrder.customer_name || 'Unknown Customer';
        }
    }
    
    return 'Unknown Customer';
};

// Batch update delivery customer names
window.enhanceDeliveriesWithCustomerNames = function(deliveries, orders) {
    console.log('🔄 Enhancing deliveries with customer names...');
    
    if (!deliveries || !Array.isArray(deliveries)) {
        console.warn('Invalid deliveries array');
        return deliveries;
    }
    
    const orderLookup = {};
    if (orders && Array.isArray(orders)) {
        orders.forEach(order => {
            orderLookup[order.id] = {
                customer_name: order.client_name || order.customer_name,
                client_email: order.client_email,
                event_name: order.event_name
            };
        });
    }
    
    return deliveries.map(delivery => {
        const enhancedDelivery = { ...delivery };
        
        // Try to get customer name from order lookup
        if (delivery.order_id && orderLookup[delivery.order_id]) {
            const orderInfo = orderLookup[delivery.order_id];
            enhancedDelivery.customer_name = orderInfo.customer_name || delivery.customer_name || 'Unknown Customer';
            enhancedDelivery.client_email = orderInfo.client_email || delivery.client_email;
            enhancedDelivery.order_event_name = orderInfo.event_name || delivery.order_event_name;
            
            console.log(`✅ Enhanced delivery ${delivery.id} with customer: ${enhancedDelivery.customer_name}`);
        } else {
            // Use existing customer name or default
            enhancedDelivery.customer_name = window.resolveDeliveryCustomerName(delivery);
            console.log(`⚠️ Could not find order for delivery ${delivery.id}, using: ${enhancedDelivery.customer_name}`);
        }
        
        return enhancedDelivery;
    });
};

// Delivery actions based on status
window.getDeliveryActions = function(delivery, userPermissions = {}) {
    const actions = [];
    const status = delivery.status || 'scheduled';
    const hasWritePermission = userPermissions.write || window.hasPermission('delivery', 'write');
    
    if (!hasWritePermission) {
        return [
            {
                label: 'View Details',
                action: () => window.showDeliveryDetails(delivery),
                className: 'text-blue-600 hover:text-blue-800 text-sm'
            }
        ];
    }
    
    // Status-specific actions
    switch (status) {
        case 'scheduled':
            actions.push({
                label: 'Start Delivery',
                action: () => window.updateDeliveryStatus(delivery.id, 'in_transit'),
                className: 'text-blue-600 hover:text-blue-800 text-sm'
            });
            break;
            
        case 'in_transit':
            actions.push({
                label: 'Mark Delivered',
                action: () => window.updateDeliveryStatus(delivery.id, 'delivered'),
                className: 'text-green-600 hover:text-green-800 text-sm'
            });
            actions.push({
                label: 'Mark Failed',
                action: () => window.updateDeliveryStatus(delivery.id, 'failed'),
                className: 'text-red-600 hover:text-red-800 text-sm'
            });
            break;
            
        case 'failed':
            actions.push({
                label: 'Retry Delivery',
                action: () => window.updateDeliveryStatus(delivery.id, 'scheduled'),
                className: 'text-blue-600 hover:text-blue-800 text-sm'
            });
            break;
    }
    
    // Always add update status option
    actions.push({
        label: 'Update Status',
        action: () => window.updateDeliveryStatus(delivery.id),
        className: 'text-gray-600 hover:text-gray-800 text-sm'
    });
    
    return actions;
};

// Show delivery details
window.showDeliveryDetails = function(delivery) {
    const details = `
Delivery Details:
━━━━━━━━━━━━━━━━━━━━
Delivery ID: #${delivery.delivery_id || delivery.id}
Order ID: #${delivery.order_id}
Customer: ${delivery.customer_name || 'Unknown'}
Status: ${window.getDeliveryStatusLabel(delivery.status)}

📅 Scheduled Date: ${delivery.scheduled_date ? new Date(delivery.scheduled_date).toLocaleDateString() : 'Not set'}
📍 Delivery Type: ${delivery.delivery_type || 'Not specified'}
📝 Notes: ${delivery.delivery_notes || 'No notes'}

${delivery.delivery_address ? `📍 Address: ${delivery.delivery_address}` : ''}
${delivery.contact_details ? `📞 Contact: ${delivery.contact_details}` : ''}
    `.trim();
    
    alert(details);
};

// Validate delivery status transition
window.validateDeliveryStatusTransition = function(currentStatus, newStatus) {
    const validTransitions = {
        'scheduled': ['in_transit', 'cancelled', 'failed'],
        'in_transit': ['delivered', 'failed', 'returned'],
        'delivered': [], // Terminal state
        'failed': ['scheduled', 'cancelled'],
        'cancelled': ['scheduled'],
        'returned': ['scheduled']
    };
    
    const allowed = validTransitions[currentStatus] || [];
    return allowed.includes(newStatus);
};

console.log('✅ Delivery Status Utilities loaded successfully');
