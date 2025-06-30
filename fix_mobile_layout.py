#!/usr/bin/env python3
import re

print("Fixing mobile layout issues...")

with open('frontend/public/index.html', 'r') as f:
    content = f.read()

# 1. Fix the main layout container to properly handle mobile sidebar
print("1. Fixing main layout container...")

# Update the main flex container
pattern = r"return React\.createElement\('div', { className: 'flex h-screen bg-gray-100 dark:bg-gray-900' },"
replacement = r"return React.createElement('div', { className: 'min-h-screen bg-gray-100 dark:bg-gray-900' },"
content = re.sub(pattern, replacement, content)

# 2. Fix the main content wrapper
print("2. Fixing content wrapper...")

# Find the div that wraps header and main
pattern = r"React\.createElement\('div', { className: 'flex-1 flex flex-col overflow-hidden' },"
replacement = r"React.createElement('div', { className: 'lg:ml-64 flex flex-col min-h-screen' },"
content = re.sub(pattern, replacement, content)

# 3. Update header to have proper padding on mobile
print("3. Updating header padding...")

pattern = r"React\.createElement\('header', { className: 'bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 px-4 lg:px-6 py-4 ml-0 lg:ml-0' },"
replacement = r"React.createElement('header', { className: 'bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 px-4 lg:px-6 py-4 pl-16 lg:pl-6' },"
content = re.sub(pattern, replacement, content)

# 4. Fix the mobile menu button positioning
print("4. Fixing mobile menu button...")

pattern = r"React\.createElement\('button', {\s*className: 'lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg',"
replacement = r"React.createElement('button', {\n                className: 'lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-lg',"
content = re.sub(pattern, replacement, content)

# 5. Fix sidebar to not overlap content on desktop
print("5. Fixing sidebar positioning...")

# Update sidebar classes
pattern = r"className: `\${mobileMenuOpen \? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 w-64 bg-gray-900 dark:bg-gray-950 text-white flex flex-col transition-transform duration-300 z-40`"
replacement = r"className: `${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed inset-y-0 left-0 w-64 bg-gray-900 dark:bg-gray-950 text-white flex flex-col transition-transform duration-300 z-40 lg:z-0`"
content = re.sub(pattern, replacement, content)

# 6. Update quick actions positioning on mobile
print("6. Fixing quick actions layout...")

# Find quick actions and make it stack on mobile
pattern = r"className: 'grid grid-cols-2 gap-4'"
replacement = r"className: 'grid grid-cols-1 sm:grid-cols-2 gap-4'"
content = re.sub(pattern, replacement, content)

# 7. Make cards responsive
print("7. Making cards more mobile-friendly...")

# Update card padding
pattern = r"className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-6'"
replacement = r"className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-4 lg:p-6'"
content = re.sub(pattern, replacement, content)

# 8. Fix table containers for mobile
print("8. Improving table mobile view...")

# Add responsive table wrapper
pattern = r"React\.createElement\('table', { className: 'w-full' },"
replacement = r"React.createElement('div', { className: 'w-full overflow-x-auto -mx-4 sm:mx-0' },\n                    React.createElement('table', { className: 'w-full min-w-full' },"
content = re.sub(pattern, replacement, content, count=1)

# 9. Close the navigation callback fix
print("9. Fixing navigation callbacks...")

# Fix setActiveTab calls to also close mobile menu
pattern = r"onClick: \(\) => setActiveTab\('(\w+)'\)"
replacement = r"onClick: () => { setActiveTab('\1'); setMobileMenuOpen(false); }"
content = re.sub(pattern, replacement, content)

# Save
with open('frontend/public/index.html', 'w') as f:
    f.write(content)

print("✅ Mobile layout fixed!")
