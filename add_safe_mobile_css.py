#!/usr/bin/env python3

with open('index.html', 'r') as f:
    content = f.read()

# 1. Add viewport meta tag if missing
if '<meta name="viewport"' not in content:
    content = content.replace(
        '<meta charset="UTF-8">',
        '<meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">'
    )
    print("✅ Added viewport meta tag")

# 2. Add simple, safe mobile CSS
mobile_css = '''    <style>
        /* Simple mobile responsiveness */
        @media screen and (max-width: 768px) {
            /* Sidebar takes full width on mobile */
            .w-64 {
                width: 100%;
            }
            
            /* Stack layout vertically */
            .flex.h-screen {
                flex-direction: column;
                height: auto;
            }
            
            /* Responsive grids */
            .grid.grid-cols-4 {
                grid-template-columns: 1fr;
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
            
            /* Stack buttons */
            .flex.flex-wrap.gap-1 {
                flex-direction: column;
            }
            
            .flex.flex-wrap.gap-1 button {
                width: 100%;
                margin-bottom: 0.25rem;
            }
        }
    </style>
'''

# Add CSS right before </head>
if '</style>' not in content:  # Only add if no styles exist
    content = content.replace('</head>', mobile_css + '\n</head>')
    print("✅ Added mobile CSS")
else:
    print("⚠️  Styles already exist, skipping to avoid conflicts")

with open('index.html', 'w') as f:
    f.write(content)

print("\n✅ Mobile CSS added safely!")
print("The page should now be more mobile-friendly without breaking desktop view")
