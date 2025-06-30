#!/usr/bin/env python3
import re

with open('index.html', 'r') as f:
    content = f.read()

# Find the area around line 5060 - likely in the approve button area
# Look for any obvious syntax errors like duplicate commas or missing brackets

# Common syntax errors after our changes:
# 1. Double closing parentheses
content = re.sub(r'\)\)', r')', content)

# 2. onClick handlers with syntax errors
# Fix patterns like: onClick: () => 'approve')
pattern = r"onClick: \(\) => '(approve|reject)'\)"
replacement = r"onClick: () => handleOrderApproval(order.id, '\1')"
content = re.sub(pattern, replacement, content)

# 3. Look for malformed button elements
# Fix any broken approve button syntax
pattern = r"onClick: \(\) => handleOrderApproval\(order\.id, 'approve'\)\), disabled"
replacement = r"onClick: () => handleOrderApproval(order.id, 'approve'), disabled"
content = re.sub(pattern, replacement, content)

# Save and check
with open('index.html', 'w') as f:
    f.write(content)

# Show the area around common button locations
lines = content.split('\n')
for i, line in enumerate(lines):
    if "'✅ Approve'" in line:
        print(f"Line {i+1}: Found approve button")
        print(f"Context: {lines[i-1]}")
        print(f"Line: {line}")
        print(f"After: {lines[i+1] if i+1 < len(lines) else 'EOF'}")
        print()

print("✅ Attempted to fix syntax errors")
