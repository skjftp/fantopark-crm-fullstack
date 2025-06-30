#!/usr/bin/env python3
import re

print("Fixing rejection reason prompt and tab persistence...")

with open('frontend/public/index.html', 'r') as f:
    content = f.read()

# Fix 1: Make handleOrderApproval ask for rejection reason
print("1. Fixing rejection reason prompt...")

# Find the current handleOrderApproval function
pattern = r"const handleOrderApproval = async \(orderId, action\) => {[\s\S]*?};"

# Replace with the correct implementation
replacement = """const handleOrderApproval = async (orderId, action) => {
        if (!hasPermission('orders', 'approve')) {
            alert('You do not have permission to approve/reject orders');
            return;
        }
        
        setLoading(true);
        
        try {
            if (action === 'reject') {
                // Ask for rejection reason
                const reason = prompt('Please provide a reason for rejection:');
                if (!reason) {
                    setLoading(false);
                    return;
                }
                
                // Update order with rejection details
                await apiCall(`/orders/${orderId}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        status: 'rejected',
                        rejection_reason: reason,
                        rejected_date: new Date().toISOString(),
                        rejected_by: user?.name || 'Admin'
                    })
                });
                
                // Update local state
                setOrders(prev => prev.map(order => 
                    order.id === orderId 
                        ? { 
                            ...order, 
                            status: 'rejected',
                            rejection_reason: reason,
                            rejected_date: new Date().toISOString(),
                            rejected_by: user?.name || 'Admin'
                        }
                        : order
                ));
                
                alert('Order rejected successfully!');
            } else {
                // Original approval logic
                await apiCall(`/orders/${orderId}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        status: 'approved',
                        approved_date: new Date().toISOString(),
                        approved_by: user?.name || 'Admin'
                    })
                });
                
                setOrders(prev => prev.map(order => 
                    order.id === orderId 
                        ? { 
                            ...order, 
                            status: 'approved',
                            approved_date: new Date().toISOString(),
                            approved_by: user?.name || 'Admin'
                        }
                        : order
                ));
                
                alert('Order approved successfully!');
            }
        } catch (error) {
            alert('Failed to process order: ' + error.message);
        } finally {
            setLoading(false);
        }
    };"""

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# Fix 2: Tab persistence - ensure useEffect is properly added
print("2. Ensuring tab persistence useEffect...")

# Check if the useEffect for tab persistence exists
if "localStorage.setItem('crm_active_tab', activeTab)" not in content:
    # Find a good place to add it (after the dashboard stats useEffect)
    pattern = r"(}, \[isLoggedIn, leads, orders, inventory\]\);)"
    addition = r"""\1

    // Persist active tab
    useEffect(() => {
        if (isLoggedIn && activeTab) {
            localStorage.setItem('crm_active_tab', activeTab);
        }
    }, [activeTab, isLoggedIn]);"""
    content = re.sub(pattern, addition, content)

# Fix 3: Ensure rejection reason is displayed in the orders table
print("3. Ensuring rejection reason displays in table...")

# Check if rejection reason display is properly added
if "order.rejection_reason &&" not in content or "Reason:" not in content:
    # Find where status is displayed and add rejection reason
    pattern = r"(}, status\.label\)\s*\),)"
    replacement = r"""\1
                                    order.status === 'rejected' && order.rejection_reason && React.createElement('div', {
                                        className: 'mt-1 text-xs text-red-600 italic'
                                    }, `Reason: ${order.rejection_reason}`),"""
    content = re.sub(pattern, replacement, content)

# Save
with open('frontend/public/index.html', 'w') as f:
    f.write(content)

print("✅ All fixes applied!")
