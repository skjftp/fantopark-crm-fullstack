#!/usr/bin/env python3
import re

with open('index.html', 'r') as f:
    content = f.read()

# Update CSS to force hide the entire sidebar section on mobile
old_css = r'<style>\s*\/\*[^}]*\.w-64\.bg-gray-900 \{\s*display: none !important;\s*\}'
new_css = '''<style>
        /* Mobile-first responsive design */
        @media screen and (max-width: 1023px) {
            /* Hide entire sidebar section on mobile */
            .w-64.bg-gray-900,
            .w-64.bg-gray-900.dark\\:bg-gray-950,
            .w-64 {
                display: none !important;
            }
            
            /* Also hide the sidebar container */
            .flex.h-screen > div:first-child {
                display: none !important;
            }'''

content = re.sub(old_css, new_css, content, flags=re.DOTALL)

# If pattern doesn't match, try a broader approach
if "display: none !important;" not in content:
    # Add a more specific CSS rule
    css_addition = '''
    <style>
        @media (max-width: 1023px) {
            /* Force hide sidebar on mobile */
            body .w-64.bg-gray-900 {
                display: none !important;
            }
        }
    </style>
    '''
    content = content.replace('</head>', css_addition + '</head>')

with open('index.html', 'w') as f:
    f.write(content)

print("✅ Sidebar should now be completely hidden on mobile")
