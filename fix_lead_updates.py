#!/usr/bin/env python3
import re

print("Fixing lead status updates to include all fields...")

with open('frontend/public/index.html', 'r') as f:
    content = f.read()

# Find and fix the updateLeadStatus function (around line 1109)
# Look for the pattern where only partial fields are sent
pattern = r'(const response = await apiCall\(`/leads/\$\{leadId\}`, \{\s*method: \'PUT\',\s*body: JSON\.stringify\(\{)([\s\S]*?)(\}\)\s*\}\);)'

matches = list(re.finditer(pattern, content))
print(f"Found {len(matches)} lead update patterns")

for match in matches:
    update_body = match.group(2)
    if 'status: newStatus' in update_body and '...lead' not in update_body:
        print(f"Found partial update at position {match.start()}")
        print(f"Current update body: {update_body.strip()}")
        
        # This is a partial update - need to fix it
        # Replace with full update including all fields
        old_pattern = match.group(0)
        new_pattern = match.group(1) + '''
                ...leads.find(l => l.id === leadId), // Include ALL current fields
''' + match.group(2) + match.group(3)
        
        content = content.replace(old_pattern, new_pattern)
        print("Fixed to include all fields")

# Also check for collectPostServicePayment
payment_pattern = r'const collectPostServicePayment[^{]*{([^}]+(?:{[^}]*}[^}]*)*[^}]+)}'
payment_match = re.search(payment_pattern, content, re.DOTALL)

if payment_match:
    print("\nFound collectPostServicePayment function")
    # Check if it's updating lead status properly

# Save the fixed content
with open('frontend/public/index.html', 'w') as f:
    f.write(content)

print("\n✅ Fixed lead updates to include all fields")
