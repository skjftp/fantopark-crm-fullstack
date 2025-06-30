#!/usr/bin/env python3
import re

print("Step 2 (Simplified): Basic mobile sidebar...")

with open('index.html', 'r') as f:
    content = f.read()

# Just hide sidebar on mobile, show on desktop
pattern = r"React\.createElement\('div', \{ className: 'w-64 bg-gray-900 dark:bg-gray-950 text-white flex flex-col' \}"
replacement = r"React.createElement('div', { className: 'hidden lg:block w-64 bg-gray-900 dark:bg-gray-950 text-white flex flex-col' }"

content = re.sub(pattern, replacement, content)

# Make main content full width on mobile
pattern = r"React\.createElement\('div', \{ className: 'flex-1 flex flex-col overflow-hidden' \}"
replacement = r"React.createElement('div', { className: 'flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64' }"

content = re.sub(pattern, replacement, content)

with open('index.html', 'w') as f:
    f.write(content)

print("✅ Simple step 2 complete.")
