import re

# Read the current index.html
with open('index.html', 'r') as f:
    content = f.read()

# Fix 1: Update the addDelivery function to NOT include the id field
# Find the section where delivery is created
old_delivery_creation = r'''const newDelivery = {
                    id: `DEL-${Date.now()}`,
                    order_id: deliveryFormData.order_id,'''

new_delivery_creation = '''const newDelivery = {
                    order_id: deliveryFormData.order_id,'''

content = content.replace(old_delivery_creation, new_delivery_creation)

# Fix 2: Update how the response is handled after creating a delivery
# Find where the delivery is added to state after API call
old_state_update = r'''// Add to deliveries state with backend ID
                setDeliveries(prev => \[...prev, { ...newDelivery, id: response.data.id }\]);'''

new_state_update = '''// Add to deliveries state with backend response
                setDeliveries(prev => [...prev, response.data]);'''

content = content.replace(old_state_update, new_state_update)

# Fix 3: Make sure the temporary delivery update is removed
# Find and remove the temporary delivery state update
temp_delivery_pattern = r'''// Temporarily add to state while waiting for backend
                setDeliveries\(prev => \[\.\.\.prev, newDelivery\]\);'''

content = re.sub(temp_delivery_pattern, '', content, flags=re.DOTALL)

# Fix 4: Also update the scheduleDelivery function similarly
old_schedule_update = r'''setDeliveries\(prev => prev\.map\(d => 
                    d\.id === deliveryId \? { 
                        \.\.\.delivery, 
                        \.\.\.deliveryFormData,
                        status: 'scheduled',
                        scheduled_date: new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]
                    } 
                    : delivery
                \)
            \);'''

# Find the exact pattern in scheduleDelivery
schedule_pattern = r'''const delivery = deliveries\.find\(d => d\.id === deliveryId\);[\s\S]*?const response = await apiCall'''

def fix_schedule_delivery(match):
    return '''const delivery = deliveries.find(d => d.id === deliveryId);
            if (!delivery) {
                alert('Delivery not found');
                setLoading(false);
                return;
            }

            const updatedDelivery = {
                ...delivery,
                ...deliveryFormData,
                status: 'scheduled',
                scheduled_date: new Date().toISOString().split('T')[0]
            };

            const response = await apiCall'''

content = re.sub(schedule_pattern, fix_schedule_delivery, content, flags=re.DOTALL)

# After the API call in scheduleDelivery, update to use the response
old_schedule_state = r'''setDeliveries\(prev => prev\.map\(d => 
                    d\.id === deliveryId \? { 
                        \.\.\.delivery, 
                        \.\.\.deliveryFormData,
                        status: 'scheduled',
                        scheduled_date: new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]
                    } 
                    : delivery
                \)
            \);'''

new_schedule_state = '''// Update with backend response
            setDeliveries(prev => prev.map(d => 
                d.id === deliveryId ? response.data : d
            ));'''

content = re.sub(old_schedule_state, new_schedule_state, content, flags=re.DOTALL)

# Write the fixed content
with open('index.html', 'w') as f:
    f.write(content)

print("✅ Fixed delivery ID handling!")
print("\nChanges made:")
print("1. Removed hardcoded ID generation (DEL-timestamp)")
print("2. Using Firestore auto-generated IDs")
print("3. Updated state management to use backend responses")
print("4. Fixed both addDelivery and scheduleDelivery functions")
