#!/usr/bin/env python3
import re

print("Fixing CSS syntax error...")

with open('index.html', 'r') as f:
    content = f.read()

# Find and fix the broken style tag
# The issue is likely an unclosed style tag or malformed CSS
pattern = r'<style>[\s\S]*?</style>'
matches = re.findall(pattern, content)

if len(matches) > 1:
    print(f"Found {len(matches)} style tags, might be duplicates")

# Remove any broken CSS that's showing in the body
if '@media (max-width: 768px)' in content and '<body>' in content:
    body_start = content.find('<body>')
    style_in_body = content.find('@media (max-width: 768px)', body_start)
    if style_in_body > body_start and style_in_body != -1:
        print("Found CSS in body content, removing...")
        # Find where the CSS ends (look for common HTML tags)
        css_end = content.find('<', style_in_body + 1)
        if css_end != -1:
            content = content[:style_in_body] + content[css_end:]

# Ensure style tag is properly closed
content = re.sub(r'<style>([^<]*?)(?:</style>)?</head>', r'<style>\1</style>\n</head>', content)

# Save the fixed file
with open('index.html', 'w') as f:
    f.write(content)

print("✅ CSS error should be fixed")
