#!/usr/bin/env python3
import re

print("Improving mobile layout...")

with open('index.html', 'r') as f:
    content = f.read()

# Update the existing mobile CSS
old_css = r"<style>\s*\/\* Mobile improvements without changing desktop \*\/"
new_css = '''<style>
        /* Mobile improvements without changing desktop */
        @media (max-width: 768px) {
            /* Collapsible sidebar on mobile */
            .w-64 {
                width: 100%;
                position: relative;
            }
            
            /* Add border between sidebar and content */
            .w-64.bg-gray-900 {
                border-bottom: 2px solid #374151;
                margin-bottom: 1rem;
            }
            
            /* Make sidebar items more touch-friendly */
            .w-64 button {
                padding: 1rem;
                font-size: 1.1rem;
            }
            
            /* Stack the layout on mobile */
            .flex.h-screen {
                flex-direction: column;
                height: auto;
                min-height: 100vh;
            }
            
            /* Hide overflow on main container */
            .overflow-hidden {
                overflow: visible;
            }
            
            /* Make tables scrollable */
            .overflow-x-auto {
                -webkit-overflow-scrolling: touch;
            }
            
            /* Add horizontal scroll indicator */
            .overflow-x-auto::-webkit-scrollbar {
                height: 6px;
            }
            
            /* Smaller padding on mobile */
            .p-6 {
                padding: 0.75rem;
            }
            
            .px-6 {
                padding-left: 0.75rem;
                padding-right: 0.75rem;
            }
            
            /* Make dashboard cards stack */
            .grid.grid-cols-4 {
                grid-template-columns: 1fr;
                gap: 1rem;
            }
            
            .grid.grid-cols-2 {
                grid-template-columns: 1fr;
                gap: 1rem;
            }
            
            /* Make buttons full width in groups */
            .flex.flex-wrap.gap-1 {
                flex-direction: column;
            }
            
            .flex.flex-wrap.gap-1 > button {
                width: 100%;
                margin-bottom: 0.5rem;
                padding: 0.75rem;
            }
            
            /* Adjust modal sizes */
            .max-w-6xl, .max-w-4xl, .max-w-2xl {
                max-width: 95%;
                margin: 0.5rem;
            }
            
            /* Improve header on mobile */
            header {
                padding: 1rem;
            }
            
            /* Make cards more compact */
            .rounded-lg.shadow.p-6 {
                padding: 1rem;
            }
            
            /* Improve table readability */
            table {
                font-size: 0.875rem;
            }
            
            th, td {
                padding: 0.5rem;
            }
        }
        
        /* Ensure text is readable on all devices */
        body {
            -webkit-text-size-adjust: 100%;
        }
    </style>'''

content = re.sub(old_css, new_css, content)

with open('index.html', 'w') as f:
    f.write(content)

print("✅ Mobile layout improved!")
