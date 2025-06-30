#!/usr/bin/env python3
import re

with open('index.html', 'r') as f:
    content = f.read()

# Replace with CSS that hides sidebar
old_css = r'<style>\s*\/\*[^<]*<\/style>'
hide_sidebar_css = '''    <style>
        /* Hide sidebar on mobile, show content only */
        @media screen and (max-width: 768px) {
            /* Hide sidebar completely */
            .w-64.bg-gray-900 {
                display: none;
            }
            
            /* Make content full width */
            .flex.h-screen {
                display: block;
            }
            
            .flex-1 {
                width: 100%;
            }
            
            /* Responsive grids */
            .grid.grid-cols-4 {
                grid-template-columns: 1fr;
                gap: 1rem;
            }
            
            .grid.grid-cols-2 {
                grid-template-columns: 1fr;
            }
            
            /* Mobile-friendly tables */
            .overflow-x-auto {
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
            }
            
            /* Smaller padding */
            .p-6 {
                padding: 1rem;
            }
            
            /* Responsive buttons */
            .flex.flex-wrap.gap-1 button {
                min-width: 120px;
            }
        }
    </style>'''

content = re.sub(old_css, hide_sidebar_css, content, flags=re.DOTALL)

with open('index.html', 'w') as f:
    f.write(content)

print("✅ Sidebar hidden on mobile!")
