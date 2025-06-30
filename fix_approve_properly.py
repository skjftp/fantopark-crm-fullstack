#!/usr/bin/env python3
import re

with open('index.html', 'r') as f:
    content = f.read()

# Find and fix just the approve/reject buttons
# Look for the button section and fix it carefully
pattern = r"""React\.createElement\('button', \{
        key: 'approve',
        className: 'text-green-600 hover:text-green-900 text-xs px-2 py-1 rounded border border-green-200 hover:bg-green-50',
        onClick: \(\) => handleOrderApproval\(order\.id, 'approve'\),
        disabled: loading
    \}, '✅ Approve'\)"""

# Ensure the pattern is correct
if pattern in content:
    print("Found correct approve button pattern")
else:
    # Try a more flexible pattern
    pattern = r"(onClick: \(\) => )handleDelete\('orders', order\.id, order\.order_number\)(.*?'✅ Approve')"
    replacement = r"\1handleOrderApproval(order.id, 'approve')\2"
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# Same for reject button
pattern = r"(onClick: \(\) => )handleDelete\('orders', order\.id, order\.order_number\)(.*?'❌ Reject')"
replacement = r"\1handleOrderApproval(order.id, 'reject')\2"
content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('index.html', 'w') as f:
    f.write(content)

print("✅ Fixed approve/reject buttons properly")
