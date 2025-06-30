#!/usr/bin/env python3
import re

with open('index.html', 'r') as f:
    content = f.read()

# Find and update the handleOrderApproval function
pattern = r"const handleOrderApproval = async \(orderId, action\) => {[\s\S]*?};"

replacement = """const handleOrderApproval = async (orderId, action) => {
        if (!hasPermission('orders', 'approve')) {
            alert('You do not have permission to approve/reject orders');
            return;
        }
        
        setLoading(true);
        
        try {
            // First get the current order to preserve all fields
            const currentOrder = orders.find(o => o.id === orderId);
            if (!currentOrder) {
                throw new Error('Order not found');
            }
            
            if (action === 'reject') {
                // Ask for rejection reason
                const reason = prompt('Please provide a reason for rejection:');
                if (!reason) {
                    setLoading(false);
                    return;
                }
                
                // Update order with rejection details
                const updateData = {
                    ...currentOrder,
                    status: 'rejected',
                    rejection_reason: reason,
                    rejected_date: new Date().toISOString(),
                    rejected_by: user?.name || 'Admin'
                };
                
                const response = await apiCall(`/orders/${orderId}`, {
                    method: 'PUT',
                    body: JSON.stringify(updateData)
                });
                
                // Update local state
                setOrders(prev => prev.map(order => 
                    order.id === orderId ? response.data : order
                ));
                
                alert('Order rejected successfully!');
            } else {
                // Approval - preserve all existing fields
                const updateData = {
                    ...currentOrder,
                    status: 'approved',
                    approved_date: new Date().toISOString(),
                    approved_by: user?.name || 'Admin'
                };
                
                const response = await apiCall(`/orders/${orderId}`, {
                    method: 'PUT',
                    body: JSON.stringify(updateData)
                });
                
                setOrders(prev => prev.map(order => 
                    order.id === orderId ? response.data : order
                ));
                
                alert('Order approved successfully!');
            }
        } catch (error) {
            console.error('Order approval error:', error);
            alert('Failed to process order: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };"""

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('index.html', 'w') as f:
    f.write(content)

print("✅ Fixed order approval to include all required fields")
