import re

# Read the index.html file
with open('frontend/public/index.html', 'r') as f:
    content = f.read()

print("Applying delivery delete fix...")

# Fix 1: Remove the hardcoded ID from delivery creation
# Find the exact pattern where delivery is created
old_pattern = r"const newDelivery = \{\s*id: `DEL-\$\{Date\.now\(\)\}`,\s*order_id: deliveryFormData\.order_id,"

new_pattern = """const newDelivery = {
                    order_id: deliveryFormData.order_id,"""

if re.search(old_pattern, content):
    content = re.sub(old_pattern, new_pattern, content)
    print("✓ Fixed: Removed hardcoded delivery ID")
else:
    print("⚠ Pattern not found for delivery ID fix")

# Fix 2: Update how the delivery is added to state after API response
# Look for where we add the delivery to state
old_add_pattern = r"setDeliveries\(prev => \[\.\.\. ?prev, \{ \.\.\. ?newDelivery, id: response\.data\.id \}\]\)"

new_add_pattern = "setDeliveries(prev => [...prev, response.data])"

if re.search(old_add_pattern, content):
    content = re.sub(old_add_pattern, new_add_pattern, content)
    print("✓ Fixed: Using backend response for delivery state")
else:
    # Try alternative pattern
    alt_pattern = r"setDeliveries\(prev => \[\.\.\. ?prev, \{ \.\.\. ?newDelivery, id: response\.data\.id \}\]\)"
    if re.search(alt_pattern, content):
        content = re.sub(alt_pattern, new_add_pattern, content)
        print("✓ Fixed: Using backend response for delivery state (alt)")

# Fix 3: Remove any temporary state additions
temp_add_pattern = r"// Temporarily add to state while waiting for backend\s*setDeliveries\(prev => \[\.\.\. ?prev, newDelivery\]\);"
if re.search(temp_add_pattern, content, re.MULTILINE):
    content = re.sub(temp_add_pattern, "", content, flags=re.MULTILINE)
    print("✓ Fixed: Removed temporary state addition")

# Write the fixed content
with open('frontend/public/index.html', 'w') as f:
    f.write(content)

print("\n✅ All fixes applied successfully!")
