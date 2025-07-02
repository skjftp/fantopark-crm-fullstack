#!/usr/bin/env python3
import re

with open('index.html', 'r') as f:
    content = f.read()

# Fix 1: Ensure orderId is converted to string in handleOrderApproval
pattern = r"const handleOrderApproval = async \(orderId, action\) => {"
replacement = r"""const handleOrderApproval = async (orderId, action) => {
        // Ensure orderId is a string
        orderId = String(orderId);"""

content = re.sub(pattern, replacement, content)

# Fix 2: Also fix in the apiCall URL
pattern = r"await apiCall\(`/orders/\${orderId}`,"
replacement = r"await apiCall(`/orders/${String(orderId)}`,"
content = re.sub(pattern, replacement, content)

# Fix 3: When creating new orders, ensure ID is string
pattern = r"id: Date\.now\(\),"
replacement = r"id: String(Date.now()),"
content = re.sub(pattern, replacement, content)

with open('index.html', 'w') as f:
    f.write(content)

print("✅ Fixed order ID type issues")
