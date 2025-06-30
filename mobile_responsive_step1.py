#!/usr/bin/env python3
import re

print("Step 1: Adding mobile menu state and hamburger...")

with open('index.html', 'r') as f:
    content = f.read()

# 1. Add mobileMenuOpen state if not exists
if "mobileMenuOpen, setMobileMenuOpen" not in content:
    pattern = r"(const \[darkMode, setDarkMode\] = useState\(\(\) => \{[^}]+\}\);)"
    addition = r"""\1
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);"""
    content = re.sub(pattern, addition, content)
    print("✅ Added mobile menu state")

# 2. Add hamburger button for mobile (simple version)
# Find the sidebar and add a mobile toggle before it
if "lg:hidden" not in content:
    pattern = r"(renderSidebar\(\),)"
    mobile_button = r'''// Mobile menu button
        React.createElement('button', {
            className: 'fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg lg:hidden',
            onClick: () => setMobileMenuOpen(!mobileMenuOpen)
        }, mobileMenuOpen ? '✕' : '☰'),
        
        \1'''
    content = re.sub(pattern, mobile_button, content)
    print("✅ Added mobile menu button")

with open('index.html', 'w') as f:
    f.write(content)

print("\nStep 1 complete. Test this first!")
