#!/usr/bin/env python3
import re

with open('index.html', 'r') as f:
    content = f.read()

# Count changes
changes = 0

# Fix 1: Find approve button that's calling handleDelete
# Use simpler pattern
pattern1 = r"handleDelete\('orders', order\.id, order\.order_number\)([^}]*'✅ Approve')"
replacement1 = r"handleOrderApproval(order.id, 'approve')\1"

if "handleDelete('orders', order.id, order.order_number)" in content and "'✅ Approve'" in content:
    content = re.sub(pattern1, replacement1, content)
    changes += 1
    print("✅ Fixed approve button")

# Fix 2: Find reject button that might be calling handleDelete  
pattern2 = r"handleDelete\('orders', order\.id, order\.order_number\)([^}]*'❌ Reject')"
replacement2 = r"handleOrderApproval(order.id, 'reject')\1"

if "handleDelete('orders', order.id, order.order_number)" in content and "'❌ Reject'" in content:
    content = re.sub(pattern2, replacement2, content)
    changes += 1
    print("✅ Fixed reject button")

# Check current state
if changes == 0:
    print("\n⚠️  No handleDelete found for approve/reject buttons")
    # Search for current approve button setup
    approve_index = content.find("'✅ Approve'")
    if approve_index > 0:
        # Show context around approve button
        start = max(0, approve_index - 200)
        end = min(len(content), approve_index + 50)
        print("\nCurrent approve button context:")
        print(content[start:end])

# Save if we made changes
if changes > 0:
    with open('index.html', 'w') as f:
        f.write(content)
    print(f"\n✅ Total fixes applied: {changes}")

