// ============================================================================
// ORDERS COMPONENT - Extracted from index.html - FIXED VIEW INVOICE BUTTON + GST DATA
// ============================================================================
// This component manages order management system with status tracking, 
// approvals, invoice generation, and comprehensive workflow processing.

// Main render function for orders management
window.renderOrdersContent = () => {
    console.log("All orders:", window.orders);
    console.log("Orders with is_deleted:", (window.orders || []).filter(o => o.is_deleted));
    console.log("Orders with status deleted:", (window.orders || []).filter(o => o.status === "deleted"));
    
    // ✅ EXTRACT FUNCTIONS WITH FALLBACKS (Fix integration pattern)
    const {
        openOrderDetail = window.openOrderDetail || (() => {
            console.warn("openOrderDetail not implemented");
        }),
        openEditOrderForm = window.openEditOrderForm || (() => {
            console.warn("openEditOrderForm not implemented");
        }),
        handleOrderApproval = window.handleOrderApproval || (() => {
            console.warn("handleOrderApproval not implemented");
        }),
        openInvoicePreview = window.openInvoicePreview || (() => {
            console.warn("openInvoicePreview not implemented");
        }),
        setSelectedOrderForAssignment = window.setSelectedOrderForAssignment || (() => {
            console.warn("setSelectedOrderForAssignment not implemented");
        }),
        setShowOrderAssignmentModal = window.setShowOrderAssignmentModal || (() => {
            console.warn("setShowOrderAssignmentModal not implemented");
        }),
        setOrders = window.setOrders || (() => {
            console.warn("setOrders not implemented");
        }),
        handleDelete = window.handleDelete || (() => {
            console.warn("handleDelete not implemented");
        }),
        hasPermission = window.hasPermission || (() => false),
        openAddForm = window.openAddForm || (() => {
            console.warn("openAddForm not implemented");
        }),
        loading = window.loading || false
    } = window.appState || {};
    
    return React.createElement('div', { className: 'space-y-6' },
        React.createElement('div', { className: 'flex justify-between items-center' },
            React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' }, 'Order Management'),
            React.createElement('div', { className: 'flex space-x-2' },
                hasPermission('orders', 'write') && React.createElement('button', { 
                    className: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700',
                    onClick: () => openAddForm('order')
                }, '+ Manual Order')
            )
        ),

        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow border' },
            (window.orders || []).length > 0 ? React.createElement('div', { className: 'overflow-x-auto' },
                React.createElement('table', { className: 'w-full' },
                    React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-900' },
                        React.createElement('tr', null,
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Order#'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Client'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Event'),
                            hasPermission('finance', 'read') && React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Amount'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Status'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Payment'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Assigned To'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
                        )
                    ),
                    React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
                        (window.orders || []).map(order => {
                            const status = window.ORDER_STATUSES[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-800', next: [] };

                            // ENHANCED: Handle both old and new order formats
                            const orderNumber = order.order_number || order.id || 'N/A';
                            const clientName = order.client_name || order.lead_name || 'Unknown Client';
                            const clientEmail = order.client_email || order.lead_email || '';
                            const clientPhone = order.client_phone || order.lead_phone || '';

                            // ✅ CRITICAL FIX: Check if invoice exists for this order
                            const hasInvoice = order.invoice_number || 
                                              (window.invoices || []).some(inv => inv.order_id === order.id);
                            
                            // ✅ ENHANCED: Find the actual invoice object for this order WITH PROPER GST DATA
                            const orderInvoice = order.invoice_number ? 
                                // If order has invoice_number, reconstruct from order data
                                {
                                    id: order.invoice_id || order.id,
                                    invoice_number: order.invoice_number,
                                    order_id: order.id,
                                    order_number: order.order_number,
                                    client_name: order.legal_name || order.client_name,
                                    client_email: order.client_email,
                                    gstin: order.gstin,
                                    legal_name: order.legal_name,
                                    category_of_sale: order.category_of_sale,
                                    type_of_sale: order.type_of_sale,
                                    registered_address: order.registered_address,
                                    indian_state: order.indian_state,
                                    is_outside_india: order.is_outside_india,
                                    invoice_items: order.invoice_items || [{
                                        description: order.event_name || 'Service',
                                        quantity: order.tickets_allocated || 1,
                                        rate: order.price_per_ticket || (order.total_amount || 0)
                                    }],
                                    base_amount: order.base_amount || order.total_amount || order.amount || 0,
                                    // ✅ CRITICAL FIX: Preserve actual GST data from order, don't override with defaults
                                    gst_calculation: order.gst_calculation ? {
                                        applicable: order.gst_calculation.applicable !== false && (order.gst_calculation.total > 0 || order.total_tax > 0),
                                        rate: order.gst_calculation.rate || order.gst_rate || 18,
                                        cgst: order.gst_calculation.cgst || 0,
                                        sgst: order.gst_calculation.sgst || 0,
                                        igst: order.gst_calculation.igst || 0,
                                        total: order.gst_calculation.total || order.total_tax || 0
                                    } : (order.total_tax > 0 ? {
                                        // Fallback: reconstruct from total_tax if gst_calculation is missing
                                        applicable: true,
                                        rate: order.gst_rate || 18,
                                        cgst: (order.indian_state === 'Haryana' && !order.is_outside_india) ? (order.total_tax / 2) : 0,
                                        sgst: (order.indian_state === 'Haryana' && !order.is_outside_india) ? (order.total_tax / 2) : 0,
                                        igst: (order.indian_state !== 'Haryana' || order.is_outside_india) ? order.total_tax : 0,
                                        total: order.total_tax
                                    } : {
                                        applicable: false, rate: 0, cgst: 0, sgst: 0, igst: 0, total: 0
                                    }),
                                    // ✅ PRESERVE TCS DATA
                                    tcs_calculation: order.tcs_calculation || { applicable: false, rate: 0, amount: 0 },
                                    total_tax: order.total_tax || 0,
                                    final_amount: order.final_amount || order.total_amount || order.amount || 0,
                                    invoice_date: order.approved_date || new Date().toISOString().split('T')[0],
                                    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                                    status: 'generated',
                                    generated_by: order.approved_by || 'System',
                                    payment_currency: order.payment_currency || 'INR'
                                } :
                                // Otherwise find in invoices array
                                (window.invoices || []).find(inv => inv.order_id === order.id);

                            // ENHANCED: Handle event display for multi-item orders
                            const getEventDisplay = (order) => {
                                if (order.invoice_items && Array.isArray(order.invoice_items) && order.invoice_items.length > 0) {
                                    // New multi-item format
                                    const firstItem = order.invoice_items[0].description;
                                    const itemCount = order.invoice_items.length;
                                    return itemCount > 1 ? `${firstItem} (+${itemCount-1} more)` : firstItem;
                                } else {
                                    // Old format
                                    return order.event_name || 'No Event';
                                }
                            };

                            // ENHANCED: Handle amount display for new GST/TCS format
                            const getAmountDisplay = (order) => {
                                // Try different amount fields in order of preference
                                if (order.final_amount) return order.final_amount;
                                if (order.total_amount) return order.total_amount;
                                if (order.amount) return order.amount;
                                if (order.base_amount) return order.base_amount;
                                return 0;
                            };

                            // ENHANCED: Handle tickets display for both formats
                            const getTicketDisplay = (order) => {
                                if (order.invoice_items && Array.isArray(order.invoice_items)) {
                                    // New format - sum quantities
                                    const totalQuantity = order.invoice_items.reduce((sum, item) => sum + (item.quantity || 0), 0);
                                    return `${totalQuantity} items - ${order.category_of_sale || 'Mixed'}`;
                                } else {
                                    // Old format
                                    return `${order.tickets_allocated || 0} tickets - ${order.ticket_category || ""}`;
                                }
                            };

                            return React.createElement('tr', { 
                                key: order.id, 
                                className: 'hover:bg-gray-50',
                                // ENHANCED: Highlight new format orders with subtle background
                                style: order.invoice_items ? { backgroundColor: '#fefbff' } : {}
                            },
                                React.createElement('td', { className: 'px-6 py-4' },
                                    React.createElement('div', { className: 'text-sm font-medium text-gray-900' }, orderNumber),
                                    React.createElement('div', { className: 'text-xs text-gray-500' }, 
                                        new Date(order.created_date || order.created_at || Date.now()).toLocaleDateString()
                                    ),
                                    // ENHANCED: Show format indicator
                                    order.invoice_items && React.createElement('div', { className: 'text-xs text-blue-600 font-medium' }, 
                                        '✓ Multi-Item'
                                    )
                                ),
                                React.createElement('td', { className: 'px-6 py-4' },
                                    React.createElement('div', { className: 'text-sm font-medium text-gray-900' }, clientName),
                                    clientEmail && React.createElement('div', { className: 'text-xs text-gray-500' }, clientEmail),
                                    clientPhone && React.createElement('div', { className: 'text-xs text-gray-500' }, clientPhone)
                                ),
                                React.createElement('td', { className: 'px-6 py-4' },
                                    React.createElement('div', { className: 'text-sm text-gray-900' }, getEventDisplay(order)),
                                    React.createElement('div', { className: 'text-xs text-gray-500' }, getTicketDisplay(order)),
                                    order.event_date && React.createElement('div', { className: 'text-xs text-blue-600' }, 
                                        new Date(order.event_date).toLocaleDateString()
                                    )
                                ),
                                hasPermission('finance', 'read') && React.createElement('td', { className: 'px-6 py-4' },
                                    React.createElement('div', { className: 'text-sm font-medium text-gray-900' }, 
                                        '₹' + getAmountDisplay(order).toLocaleString()
                                    ),
                                    // ENHANCED: Show GST/TCS info for new format
                                    order.gst_calculation && React.createElement('div', { className: 'text-xs text-green-600' }, 
                                        `+GST: ₹${(order.gst_calculation.total || 0).toLocaleString()}`
                                    ),
                                    order.tcs_calculation && order.tcs_calculation.applicable && React.createElement('div', { className: 'text-xs text-orange-600' }, 
                                        `+TCS: ₹${(order.tcs_calculation.amount || 0).toLocaleString()}`
                                    ),
                                    // PRESERVED: Original payment method display
                                    order.payment_method && React.createElement('div', { className: 'text-xs text-green-600' }, 
                                        'Paid via ' + order.payment_method
                                    )
                                ),
                                React.createElement('td', { className: 'px-6 py-4' },
                                    React.createElement('span', {
                                        className: 'px-2 py-1 text-xs rounded ' + (status.color)
                                    }, status.label)
                                ),
                                React.createElement('td', { className: 'px-6 py-4' },
                                    // PRESERVED: Original payment type logic
                                    order.payment_type === 'post_service' ? (
                                        order.payment_received ? 
                                            React.createElement('span', { className: 'px-2 py-1 text-xs rounded bg-green-100 text-green-800' }, 'Received') :
                                            React.createElement('span', { className: 'px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800' }, 'Pending')
                                    ) : React.createElement('span', { className: 'px-2 py-1 text-xs rounded bg-gray-100 text-gray-800' }, 'Prepaid')
                                ),
                                React.createElement('td', { className: 'px-6 py-4' },
                                    // PRESERVED: Original assignment logic
                                    (() => {
                                        // For pending approval orders
                                        if (order.status === 'pending_approval') {
                                            if (order.order_type === 'payment_post_service') {
                                                return React.createElement('div', null,
                                                    React.createElement('div', { className: 'text-sm font-medium text-purple-600' }, 'Sales Head'),
                                                    React.createElement('div', { className: 'text-xs text-gray-500' }, 'Awaiting Approval')
                                                );
                                            } else {
                                                return React.createElement('div', null,
                                                    React.createElement('div', { className: 'text-sm font-medium text-green-600' }, 'Finance Team'),
                                                    React.createElement('div', { className: 'text-xs text-gray-500' }, 'Awaiting Approval')
                                                );
                                            }
                                        }

                                        // For assigned orders
                                        if (order.assigned_to) {
                                            return React.createElement('div', null,
                                                React.createElement('div', { className: 'text-sm font-medium text-blue-600' }, order.assigned_to),
                                                React.createElement('div', { className: 'text-xs text-gray-500' }, 'Service Team')
                                            );
                                        }

                                        // Default unassigned
                                        return React.createElement('span', { className: 'text-sm text-gray-400' }, 'Unassigned');
                                    })()
                                ),
                                React.createElement('td', { className: 'px-6 py-4' },
                                    React.createElement('div', { className: 'flex flex-wrap gap-1' },
                                        // PRESERVED: View button - always visible for all orders
                                        React.createElement('button', {
                                            key: 'view',
                                            className: 'text-blue-600 hover:text-blue-900 text-xs px-2 py-1 rounded border border-blue-200 hover:bg-blue-50',
                                            onClick: () => openOrderDetail(order)
                                        }, '👁️ View'),

                                        // PRESERVED: Finance approval buttons
                                        hasPermission('orders', 'approve') && order.status === 'pending_approval' && [
                                            // Show if this requires sales head approval
                                            order.order_type === 'payment_post_service' && React.createElement('span', {
                                                key: 'sales-head-label',
                                                className: 'px-2 py-1 text-xs rounded bg-purple-100 text-purple-800'
                                            }, 'Sales Head Approval'),
                                            React.createElement('button', {
                                                key: 'approve',
                                                className: 'text-green-600 hover:text-green-900 text-xs px-2 py-1 rounded border border-green-200 hover:bg-green-50',
                                                onClick: () => handleOrderApproval(order.id, 'approve'),
                                                disabled: loading
                                            }, '✅ Approve'),
                                            React.createElement('button', {
                                                key: 'reject',
                                                className: 'text-red-600 hover:text-red-900 text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50',
                                                onClick: () => handleOrderApproval(order.id, 'reject'),
                                                disabled: loading
                                            }, '❌ Reject')
                                        ],

                                        // ✅ CRITICAL FIX: View Invoice button - now checks both order.invoice_number AND invoices array
                                        hasInvoice && React.createElement('button', {
                                            key: 'view-invoice',
                                            className: 'text-purple-600 hover:text-purple-900 text-xs px-2 py-1 rounded border border-purple-200 hover:bg-purple-50',
                                            onClick: () => {
                                                console.log('🔍 Looking for invoice for order:', order.id);
                                                console.log('🔍 Order invoice object:', orderInvoice);
                                                console.log('🔍 Available invoices:', window.invoices);

                                                if (orderInvoice) {
                                                    console.log('✅ Found invoice, opening preview:', orderInvoice);
                                                    openInvoicePreview(orderInvoice);
                                                } else {
                                                    console.log('❌ No invoice found for order:', order.id);
                                                    alert('Invoice not found for this order');
                                                }
                                            }
                                        }, '📄 View Invoice'),

                                        // PRESERVED: Service assignment
                                        hasPermission('orders', 'assign') && order.status === 'approved' && !order.assigned_to &&
                                        React.createElement('button', {
                                            className: 'text-blue-600 hover:text-blue-900 text-xs px-2 py-1 rounded border border-blue-200 hover:bg-blue-50',
                                            onClick: () => {
                                                setSelectedOrderForAssignment(order);
                                                setShowOrderAssignmentModal(true);
                                            },
                                            disabled: loading
                                        }, '→ Assign'),

                                        // PRESERVED: Complete order
                                        hasPermission('orders', 'write') && order.status === 'service_assigned' && React.createElement('button', {
                                            className: 'text-green-600 hover:text-green-900 text-xs px-2 py-1 rounded border border-green-200 hover:bg-green-50',
                                            onClick: () => {
                                                setOrders(prev => 
                                                    prev.map(o => 
                                                        o.id === order.id 
                                                            ? { ...o, status: 'completed', completed_date: new Date().toISOString().split('T')[0] }
                                                            : o
                                                    )
                                                );
                                                alert('Order marked as completed!');
                                            },
                                            disabled: loading
                                        }, '✅ Complete'),

                                        // PRESERVED: Edit button
                                        hasPermission('orders', 'write') && React.createElement('button', {
                                            className: 'text-purple-600 hover:text-purple-900 text-xs px-2 py-1 rounded border border-purple-200 hover:bg-purple-50',
                                            onClick: () => openEditOrderForm(order)
                                        }, '✏️ Edit'),

                                        // PRESERVED: Delete button
                                        hasPermission('orders', 'delete') && React.createElement('button', { 
                                            className: 'text-red-600 hover:text-red-900 text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50',
                                            onClick: () => handleDelete('orders', order.id, order.order_number),
                                            disabled: loading
                                        }, '🗑️ Delete')
                                    )
                                )
                            );
                        })
                    )
                )
            ) : React.createElement('div', { className: 'p-6 text-center text-gray-500' }, 'No orders found.')
        )
    );
};

// Order Assignment Modal Renderer (uses existing window.renderOrderAssignmentModal)
window.renderOrderAssignmentModal = () => {
    if (!window.showOrderAssignmentModal || !window.selectedOrderForAssignment) return null;

    // ✅ EXTRACT FUNCTIONS WITH FALLBACKS
    const {
        setShowOrderAssignmentModal = window.setShowOrderAssignmentModal || (() => {
            console.warn("setShowOrderAssignmentModal not implemented");
        }),
        setSelectedOrderForAssignment = window.setSelectedOrderForAssignment || (() => {
            console.warn("setSelectedOrderForAssignment not implemented");
        }),
        assignOrderToUser = window.assignOrderToUser || (() => {
            console.warn("assignOrderToUser not implemented");
        })
    } = window.appState || {};

    const supplyTeamUsers = (window.users || []).filter(u => 
        ['supply_executive', 'supply_sales_service_manager'].includes(u.role)
    );

    return React.createElement('div', { 
        className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
        onClick: (e) => {
            if (e.target === e.currentTarget) {
                setShowOrderAssignmentModal(false);
                setSelectedOrderForAssignment(null);
            }
        }
    },
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full' },
            React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 
                'Assign Order to Supply Team'
            ),
            React.createElement('div', { className: 'space-y-2' },
                supplyTeamUsers.map(user =>
                    React.createElement('button', {
                        key: user.email,
                        className: 'w-full text-left px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                        onClick: () => assignOrderToUser(window.selectedOrderForAssignment.id, user)
                    },
                        React.createElement('div', { className: 'font-medium' }, user.name),
                        React.createElement('div', { className: 'text-sm text-gray-500' }, user.email)
                    )
                )
            ),
            React.createElement('div', { className: 'mt-4 pt-4 border-t' },
                React.createElement('button', {
                    onClick: () => {
                        setShowOrderAssignmentModal(false);
                        setSelectedOrderForAssignment(null);
                    },
                    className: 'w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded'
                }, 'Cancel')
            )
        )
    );
};

// Order assignment function
window.assignOrderToUser = async (orderId, user) => {
    // ✅ EXTRACT FUNCTIONS WITH FALLBACKS
    const {
        setLoading = window.setLoading || (() => {}),
        apiCall = window.apiCall || (() => Promise.reject(new Error("apiCall not implemented"))),
        setOrders = window.setOrders || (() => {
            console.warn("setOrders not implemented");
        }),
        setShowOrderAssignmentModal = window.setShowOrderAssignmentModal || (() => {
            console.warn("setShowOrderAssignmentModal not implemented");
        }),
        setSelectedOrderForAssignment = window.setSelectedOrderForAssignment || (() => {
            console.warn("setSelectedOrderForAssignment not implemented");
        })
    } = window.appState || {};

    try {
        setLoading(true);

        const response = await apiCall(`/orders/${orderId}`, {
            method: 'PUT',
            body: JSON.stringify({
                assigned_to: user.name,
                assigned_email: user.email,
                status: 'service_assigned',
                assignment_date: new Date().toISOString()
            })
        });

        if (response.error) {
            throw new Error(response.error);
        }

        // Update local state
        setOrders(prev => 
            prev.map(order => 
                order.id === orderId 
                    ? { ...order, assigned_to: user.name, status: 'service_assigned' }
                    : order
            )
        );

        // Close modal
        setShowOrderAssignmentModal(false);
        setSelectedOrderForAssignment(null);

        alert(`Order assigned to ${user.name} successfully!`);

    } catch (error) {
        console.error('Error assigning order:', error);
        alert('Failed to assign order: ' + error.message);
    } finally {
        setLoading(false);
    }
};

console.log('✅ Orders component loaded successfully - FIXED VIEW INVOICE BUTTON + GST DATA PRESERVATION');
