#!/usr/bin/env python3
import re

with open('index.html', 'r') as f:
    content = f.read()

# Count how many times we'll be making changes
changes = 0

# Fix 1: Find approve button that's calling handleDelete and change it to handleOrderApproval
pattern = r"onClick: \(\) => handleDelete\('orders', order\.id, order\.order_number\)(.*?}\s*,\s*'✅ Approve'\)"
if re.search(pattern, content, re.DOTALL):
    content = re.sub(pattern, r"onClick: () => handleOrderApproval(order.id, 'approve')\1", content, flags=re.DOTALL)
    changes += 1
    print("✅ Fixed approve button")

# Fix 2: Find reject button that might be calling handleDelete
pattern = r"onClick: \(\) => handleDelete\('orders', order\.id, order\.order_number\)(.*?}\s*,\s*'❌ Reject'\)"
if re.search(pattern, content, re.DOTALL):
    content = re.sub(pattern, r"onClick: () => handleOrderApproval(order.id, 'reject')\1", content, flags=re.DOTALL)
    changes += 1
    print("✅ Fixed reject button")

# Only save if we made changes
if changes > 0:
    with open('index.html', 'w') as f:
        f.write(content)
    print(f"\n✅ Made {changes} fixes")
else:
    print("⚠️  No changes needed - buttons might already be fixed")
    # Let's check what the current onClick handlers are
    approve_matches = re.findall(r"onClick: \(\) => ([^}]+).*?'✅ Approve'", content, re.DOTALL)
    print(f"\nCurrent approve button calls: {approve_matches[:2]}")

