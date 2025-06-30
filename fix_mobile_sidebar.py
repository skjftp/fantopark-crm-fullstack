#!/usr/bin/env python3
import re

print("Fixing mobile sidebar visibility...")

with open('index.html', 'r') as f:
    content = f.read()

# Find the renderSidebar call and wrap it properly
pattern = r"renderSidebar\(\),"
replacement = """React.createElement('div', { 
            className: 'hidden lg:block' 
        }, renderSidebar()),"""

content = re.sub(pattern, replacement, content)

# Also update the main content wrapper to not have margin on mobile
pattern = r"React\.createElement\('div', \{ className: 'flex-1 flex flex-col overflow-hidden' \},"
replacement = r"React.createElement('div', { className: 'w-full lg:ml-64 flex flex-col overflow-hidden' },"
content = re.sub(pattern, replacement, content)

# Update the main container
pattern = r"return React\.createElement\('div', \{ className: 'flex h-screen bg-gray-100 dark:bg-gray-900' \},"
replacement = r"return React.createElement('div', { className: 'relative min-h-screen bg-gray-100 dark:bg-gray-900' },"
content = re.sub(pattern, replacement, content)

with open('index.html', 'w') as f:
    f.write(content)

print("✅ Sidebar should now be hidden on mobile")
