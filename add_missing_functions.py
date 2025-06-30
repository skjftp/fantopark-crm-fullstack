#!/usr/bin/env python3
import re

print("Adding missing functions...")

with open('frontend/public/index.html', 'r') as f:
    content = f.read()

# Find where to add the functions (after handleOrderApproval)
# Look for the end of handleOrderApproval function
pattern = r"(const handleOrderApproval = async \(orderId, action\) => {[\s\S]*?};\s*?\n)"

# Add the missing functions
addition = r"""\1
    // Edit order functionality
    const openEditOrderForm = (order) => {
        if (!hasPermission('orders', 'write')) {
            alert('You do not have permission to edit orders');
            return;
        }
        
        setCurrentOrderForEdit(order);
        setOrderEditData({
            ...order,
            status: order.status,
            rejection_reason: order.rejection_reason || ''
        });
        setShowEditOrderForm(true);
    };

    const handleOrderEditSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            if (currentOrderForEdit.status === 'rejected' && orderEditData.status !== 'rejected') {
                orderEditData.rejection_reason = null;
                orderEditData.rejected_date = null;
                orderEditData.rejected_by = null;
            }
            
            const response = await apiCall(`/orders/${currentOrderForEdit.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    ...orderEditData,
                    modified_date: new Date().toISOString(),
                    modified_by: user?.name || 'Admin'
                })
            });
            
            setOrders(prev => prev.map(order => 
                order.id === currentOrderForEdit.id ? response.data : order
            ));
            
            alert('Order updated successfully!');
            setShowEditOrderForm(false);
            setCurrentOrderForEdit(null);
            setOrderEditData({});
        } catch (error) {
            alert('Failed to update order: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

"""

# Apply the addition
content = re.sub(pattern, addition, content, flags=re.DOTALL)

# Also add the renderEditOrderForm function
render_pattern = r"(const renderOrderDetail = \(\) => {)"
render_addition = r"""const renderEditOrderForm = () => {
        if (!showEditOrderForm || !currentOrderForEdit) return null;

        return React.createElement('div', { 
            className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
            onClick: (e) => e.target === e.currentTarget && setShowEditOrderForm(false)
        },
            React.createElement('div', { className: 'bg-white rounded-lg p-6 w-full max-w-2xl max-h-[95vh] overflow-y-auto' },
                React.createElement('h2', { className: 'text-xl font-bold mb-4' }, 'Edit Order'),
                React.createElement('form', { onSubmit: handleOrderEditSubmit },
                    React.createElement('div', { className: 'mb-4' },
                        React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Order Number'),
                        React.createElement('input', {
                            type: 'text',
                            value: orderEditData.order_number || '',
                            disabled: true,
                            className: 'w-full px-3 py-2 border rounded-md bg-gray-100'
                        })
                    ),
                    React.createElement('div', { className: 'mb-4' },
                        React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Status'),
                        React.createElement('select', {
                            value: orderEditData.status || '',
                            onChange: (e) => setOrderEditData(prev => ({ ...prev, status: e.target.value })),
                            className: 'w-full px-3 py-2 border rounded-md'
                        },
                            Object.keys(ORDER_STATUSES).map(status =>
                                React.createElement('option', { key: status, value: status }, 
                                    ORDER_STATUSES[status].label
                                )
                            )
                        )
                    ),
                    orderEditData.status === 'rejected' && React.createElement('div', { className: 'mb-4' },
                        React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 'Rejection Reason'),
                        React.createElement('textarea', {
                            value: orderEditData.rejection_reason || '',
                            onChange: (e) => setOrderEditData(prev => ({ ...prev, rejection_reason: e.target.value })),
                            className: 'w-full px-3 py-2 border rounded-md',
                            rows: 3,
                            required: true
                        })
                    ),
                    React.createElement('div', { className: 'flex justify-end gap-2' },
                        React.createElement('button', {
                            type: 'button',
                            onClick: () => setShowEditOrderForm(false),
                            className: 'px-4 py-2 border rounded-md hover:bg-gray-50'
                        }, 'Cancel'),
                        React.createElement('button', {
                            type: 'submit',
                            disabled: loading,
                            className: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
                        }, loading ? 'Saving...' : 'Save Changes')
                    )
                )
            )
        );
    };

    \1"""
content = re.sub(render_pattern, render_addition, content)

# Add renderEditOrderForm to the main render
main_render_pattern = r"(renderOrderDetail\(\),)"
main_render_addition = r"""\1
        renderEditOrderForm(),"""
content = re.sub(main_render_pattern, main_render_addition, content)

# Save
with open('frontend/public/index.html', 'w') as f:
    f.write(content)

print("✅ Functions added successfully!")
