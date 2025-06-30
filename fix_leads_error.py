#!/usr/bin/env python3
import re

print("Fixing leads page error...")

with open('frontend/public/index.html', 'r') as f:
    content = f.read()

# Find renderLeadsContent function
pattern = r"const renderLeadsContent = \(\) => {([\s\S]*?)^    };"
match = re.search(pattern, content, re.MULTILINE)

if match:
    leads_content = match.group(0)
    
    # Check if there's any 'order' reference that should be 'lead'
    if 'order.status === \'rejected\'' in leads_content or 'order.rejection_reason' in leads_content:
        print("Found 'order' references in leads content - fixing...")
        # Replace order with lead in the context of leads
        fixed_content = leads_content.replace('order.status === \'rejected\'', 'lead.status === \'rejected\'')
        fixed_content = fixed_content.replace('order.rejection_reason', 'lead.rejection_reason')
        
        # Replace in main content
        content = content.replace(leads_content, fixed_content)

# Save
with open('frontend/public/index.html', 'w') as f:
    f.write(content)

print("✅ Leads error fixed!")
