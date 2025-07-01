import re

with open('frontend/public/index.html', 'r') as f:
    content = f.read()
    lines = content.split('\n')

print(f"Total lines in index.html: {len(lines)}")
print("\nAnalyzing delivery-related code...")

# Find the addDelivery function
add_delivery_start = None
for i, line in enumerate(lines):
    if 'const addDelivery = async' in line:
        add_delivery_start = i
        print(f"\n✓ Found addDelivery function at line {i+1}")
        break

# Find where deliveries are created
for i, line in enumerate(lines):
    if "id: `DEL-${Date.now()}`" in line:
        print(f"✓ Found delivery ID generation at line {i+1}")
        print(f"  Current: {line.strip()}")
        
# Find the deleteDelivery function
delete_delivery_start = None
for i, line in enumerate(lines):
    if 'const deleteDelivery = async' in line:
        delete_delivery_start = i
        print(f"\n✓ Found deleteDelivery function at line {i+1}")
        
# Check how deliveries are fetched
for i, line in enumerate(lines):
    if "apiCall('/deliveries')" in line and "setDeliveries" in lines[i:i+3]:
        print(f"\n✓ Found delivery fetch at line {i+1}")

# Find where delivery response is handled
for i, line in enumerate(lines):
    if "response.data.id" in line and "delivery" in line.lower():
        print(f"✓ Found response handling at line {i+1}")
        print(f"  Context: {line.strip()}")

print("\n" + "="*50)
print("ANALYSIS COMPLETE")
print("="*50)
