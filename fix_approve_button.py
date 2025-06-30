#!/usr/bin/env python3
import re

with open('index.html', 'r') as f:
    content = f.read()

# Find the approve button and ensure it's calling handleOrderApproval correctly
pattern = r"React\.createElement\('button', \{\s*key: 'approve',\s*className: '[^']+',\s*onClick: \(\) => [^,]+,\s*disabled: loading\s*\}, '✅ Approve'\)"

# Check what's actually there
import re
matches = re.findall(r"onClick: \(\) => (\w+)\([^)]+\)[^}]*}, '✅ Approve'\)", content)
print(f"Found approve button calls: {matches}")

# Fix the approve button to ensure it calls handleOrderApproval
pattern = r"(React\.createElement\('button', \{\s*key: 'approve',\s*className: '[^']+',\s*)onClick: \(\) => [^,]+(,[^}]+}, '✅ Approve'\))"
replacement = r"\1onClick: () => handleOrderApproval(order.id, 'approve')\2"

content = re.sub(pattern, replacement, content)

# Also check if there's a handleDelete being called instead
if "handleDelete" in content and "approve" in content:
    # Find any misplaced handleDelete calls near approve buttons
    pattern = r"handleDelete\([^)]+\)([^}]*}, '✅)"
    if re.search(pattern, content):
        print("WARNING: Found handleDelete near approve button!")
        content = re.sub(r"handleDelete\(([^,]+), ([^,]+), [^)]+\)", r"handleOrderApproval(\1, 'approve')", content)

with open('index.html', 'w') as f:
    f.write(content)

print("✅ Fixed approve button")
