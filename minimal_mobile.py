#!/usr/bin/env python3

with open('index.html', 'r') as f:
    content = f.read()

# 1. Add viewport meta only
if '<meta name="viewport"' not in content:
    content = content.replace(
        '<meta charset="UTF-8">',
        '<meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">'
    )
    print("Added viewport meta tag")

# 2. Make only the dashboard grid responsive
content = content.replace(
    "className: 'grid grid-cols-4 gap-6 mb-8'",
    "className: 'grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8'"
)

# 3. Make overflow tables scrollable
content = content.replace(
    "className: 'overflow-x-auto'",
    "className: 'overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0'"
)

print("Applied minimal mobile fixes")

with open('index.html', 'w') as f:
    f.write(content)
