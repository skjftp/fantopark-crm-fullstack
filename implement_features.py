#!/usr/bin/env python3
import re

print("Implementing three features...")

# Read the file
with open('frontend/public/index.html', 'r') as f:
    content = f.read()

# Feature 1: Add rejection reason display after status.label
print("1. Adding rejection reason display...")
# Find the status.label pattern and add rejection reason after the closing parenthesis
pattern = r"(}, status\.label\)\s*\))"
replacement = r"""\1,
                                    order.status === 'rejected' && order.rejection_reason && React.createElement('div', {
                                        className: 'mt-1 text-xs text-red-600 italic'
                                    }, `Reason: ${order.rejection_reason}`)"""
content = re.sub(pattern, replacement, content, count=1)

# Feature 2: Fix activeTab initialization
print("2. Adding navigation persistence...")
pattern = r"const \[activeTab, setActiveTab\] = useState\('dashboard'\);"
replacement = """const [activeTab, setActiveTab] = useState(() => {
        const savedTab = localStorage.getItem('crm_active_tab');
        return savedTab || 'dashboard';
    });"""
content = content.replace(pattern, replacement)

# Add useEffect for activeTab persistence
useeffect_pattern = r"(useEffect\(\(\) => {\s*if \(isLoggedIn\) {\s*calculateDashboardStats\(\);\s*}\s*}, \[isLoggedIn, leads, orders, inventory\]\);)"
useeffect_addition = r"""\1

    // Persist active tab
    useEffect(() => {
        if (isLoggedIn && activeTab) {
            localStorage.setItem('crm_active_tab', activeTab);
        }
    }, [activeTab, isLoggedIn]);"""
content = re.sub(useeffect_pattern, useeffect_addition, content)

# Feature 3: Add Edit Order functionality
print("3. Adding edit order functionality...")

# Add state variables
state_pattern = r"(const \[showOrderDetail, setShowOrderDetail\] = useState\(false\);)"
state_addition = r"""\1
    const [showEditOrderForm, setShowEditOrderForm] = useState(false);
    const [currentOrderForEdit, setCurrentOrderForEdit] = useState(null);
    const [orderEditData, setOrderEditData] = useState({});"""
content = re.sub(state_pattern, state_addition, content)

# Add Edit button in the actions section
# Find where delete button is and add edit button before it
delete_pattern = r"(hasPermission\('orders', 'delete'\) && React\.createElement\('button', {[^}]+}, '🗑️ Delete'\))"
edit_button = r"""hasPermission('orders', 'write') && React.createElement('button', {
                                                className: 'text-purple-600 hover:text-purple-900 text-xs px-2 py-1 rounded border border-purple-200 hover:bg-purple-50',
                                                onClick: () => openEditOrderForm(order)
                                            }, '✏️ Edit'),
                                            \1"""
content = re.sub(delete_pattern, edit_button, content)

# Add openEditOrderForm function after handleOrderApproval
func_pattern = r"(const handleOrderApproval = async \(orderId, action\) => {[^}]+?}\s*};)"
func_addition = r"""\1

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
    };"""
content = re.sub(func_pattern, func_addition, content, flags=re.DOTALL)

# Save the updated file
with open('frontend/public/index.html', 'w') as f:
    f.write(content)

print("✅ All features implemented successfully!")
print("\nFeatures added:")
print("1. ✅ Rejection reason display")
print("2. ✅ Navigation persistence") 
print("3. ✅ Edit order functionality")
