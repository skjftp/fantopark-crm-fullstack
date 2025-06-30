#!/usr/bin/env python3
import re

print("Fixing leads page error only...")

with open('index.html', 'r') as f:
    content = f.read()

# Find renderLeadsContent function and fix any 'order' references that should be 'lead'
# In the leads content, we should be using 'lead' not 'order'
pattern = r"(renderLeadsContent.*?)(order\.status === 'rejected')"
if re.search(pattern, content, re.DOTALL):
    content = re.sub(r"(renderLeadsContent.*?)order\.(status|rejection_reason)", r"\1lead.\2", content, flags=re.DOTALL)
    print("Fixed 'order' references to 'lead' in renderLeadsContent")

# Also check for any other instances in leads section
leads_section = re.search(r"const renderLeadsContent = \(\) => {.*?^    };", content, re.MULTILINE | re.DOTALL)
if leads_section:
    section_content = leads_section.group(0)
    if 'order.' in section_content and 'lead.' in section_content:
        # Fix any remaining order references in leads section
        fixed_section = section_content.replace('order.status === \'rejected\'', 'lead.status === \'rejected\'')
        fixed_section = fixed_section.replace('order.rejection_reason', 'lead.rejection_reason')
        content = content.replace(section_content, fixed_section)
        print("Fixed additional order references in leads section")

with open('index.html', 'w') as f:
    f.write(content)

print("✅ Leads page fix applied!")
