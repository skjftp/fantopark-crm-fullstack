#!/usr/bin/env python3
import re

print("Adding minimal mobile improvements without changing desktop...")

with open('index.html', 'r') as f:
    content = f.read()

# 1. Add viewport meta tag only
if '<meta name="viewport"' not in content:
    content = content.replace(
        '<meta charset="UTF-8">',
        '<meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">'
    )

# 2. Add simple CSS for mobile without changing structure
mobile_css = '''
    <style>
        /* Mobile improvements without changing desktop */
        @media (max-width: 768px) {
            /* Make sidebar scrollable on mobile */
            .w-64 {
                width: 100%;
                position: relative;
            }
            
            /* Stack the layout on mobile */
            .flex.h-screen {
                flex-direction: column;
                height: auto;
                min-height: 100vh;
            }
            
            /* Make tables scrollable */
            .overflow-x-auto {
                -webkit-overflow-scrolling: touch;
            }
            
            /* Smaller padding on mobile */
            .p-6 {
                padding: 1rem;
            }
            
            .px-6 {
                padding-left: 1rem;
                padding-right: 1rem;
            }
            
            /* Make dashboard cards stack */
            .grid.grid-cols-4 {
                grid-template-columns: 1fr;
            }
            
            .grid.grid-cols-2 {
                grid-template-columns: 1fr;
            }
            
            /* Make buttons full width in groups */
            .flex.flex-wrap.gap-1 {
                flex-direction: column;
            }
            
            .flex.flex-wrap.gap-1 > button {
                width: 100%;
            }
            
            /* Adjust modal sizes */
            .max-w-6xl, .max-w-4xl, .max-w-2xl {
                max-width: 95%;
                margin: 1rem;
            }
        }
    </style>
'''

# Add CSS before </head>
content = content.replace('</head>', mobile_css + '\n</head>')

with open('index.html', 'w') as f:
    f.write(content)

print("✅ Added minimal mobile CSS without changing desktop layout")
