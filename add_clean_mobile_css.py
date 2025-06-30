#!/usr/bin/env python3

with open('index.html', 'r') as f:
    content = f.read()

# Add viewport if missing
if '<meta name="viewport"' not in content:
    content = content.replace(
        '<meta charset="UTF-8">',
        '<meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">'
    )

# Add clean CSS properly formatted
clean_css = """    <style>
        @media (max-width: 768px) {
            .w-64 { width: 100%; position: relative; }
            .flex.h-screen { flex-direction: column; height: auto; min-height: 100vh; }
            .overflow-x-auto { -webkit-overflow-scrolling: touch; }
            .p-6 { padding: 1rem; }
            .px-6 { padding-left: 1rem; padding-right: 1rem; }
            .grid.grid-cols-4 { grid-template-columns: 1fr; }
            .grid.grid-cols-2 { grid-template-columns: 1fr; }
            .flex.flex-wrap.gap-1 { flex-direction: column; }
            .flex.flex-wrap.gap-1 > button { width: 100%; }
            .max-w-6xl, .max-w-4xl, .max-w-2xl { max-width: 95%; margin: 1rem; }
        }
    </style>
"""

# Add before </head>
content = content.replace('</head>', clean_css + '</head>')

with open('index.html', 'w') as f:
    f.write(content)

print("✅ Clean mobile CSS added")
