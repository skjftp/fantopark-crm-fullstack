#!/usr/bin/env python3
import re

with open('index.html', 'r') as f:
    content = f.read()

# Find the handleOrderApproval function and add logging
pattern = r"(const updateData = \{[\s\S]*?\};)"

# Add console.log after updateData
replacement = r"""\1
                
                console.log('Sending order update:', updateData);
                console.log('Order ID:', orderId);
                console.log('Order ID type:', typeof orderId);"""

content = re.sub(pattern, replacement, content)

with open('index.html', 'w') as f:
    f.write(content)

print("✅ Added debug logging")
