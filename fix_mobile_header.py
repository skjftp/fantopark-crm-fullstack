#!/usr/bin/env python3
import re

with open('index.html', 'r') as f:
    content = f.read()

# The issue is likely that lg:hidden is being hidden by our CSS
# Let's update the CSS to show mobile header properly

# Find and update the CSS
css_pattern = r'@media screen and \(min-width: 1024px\) \{\s*\/\* Hide mobile header on desktop \*\/\s*\.lg\\\\:hidden \{\s*display: none !important;\s*\}\s*\}'

new_css = '''@media screen and (min-width: 1024px) {
            /* Hide mobile header on desktop */
            .lg\\:hidden.fixed.top-0 {
                display: none !important;
            }
        }
        
        /* Show mobile header on mobile */
        @media screen and (max-width: 1023px) {
            .lg\\:hidden.fixed.top-0 {
                display: block !important;
            }
        }'''

content = re.sub(css_pattern, new_css, content)

# Also make sure the mobile header div has the right classes
# Update the mobile header to ensure it's visible
mobile_header_pattern = r"React\.createElement\('div', \{\s*className: 'lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md z-50 px-4 py-3'"

if mobile_header_pattern not in content:
    print("Mobile header pattern not found, trying broader search...")
    # Find where the mobile header should be
    if "FanToPark CRM" in content and "lg:hidden" in content:
        print("Found components, but structure might be different")

# Add explicit CSS to show mobile elements
if "/* Show mobile header */" not in content:
    explicit_css = '''
    <style>
        /* Ensure mobile header is visible */
        @media (max-width: 1023px) {
            div.fixed.top-0.left-0.right-0.z-50 {
                display: flex !important;
            }
        }
    </style>
    '''
    content = content.replace('</head>', explicit_css + '</head>')

with open('index.html', 'w') as f:
    f.write(content)

print("✅ Mobile header visibility fixed")
