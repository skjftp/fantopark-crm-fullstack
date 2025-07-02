#!/usr/bin/env python3
import re

with open('index.html', 'r') as f:
    content = f.read()

# Find the script tag content
script_match = re.search(r'<script>\s*const { useState, useEffect } = React;(.*?)</script>', content, re.DOTALL)

if script_match:
    script_content = script_match.group(1)
    
    # Check if App function exists
    if 'const App = () => {' not in script_content:
        print("App function not found! This is the issue.")
        
        # Find where to add it (after all the constants/states)
        # Let's add a simple App function for testing
        test_app = '''
// Temporary test App
const App = () => {
    return React.createElement('div', null, 
        React.createElement('h1', null, 'CRM is loading...'),
        React.createElement('p', null, 'If you see this, we need to fix the main App function.')
    );
};

'''
        # Add before ReactDOM.render
        content = content.replace('ReactDOM.render(', test_app + 'ReactDOM.render(')
        
        with open('index.html', 'w') as f:
            f.write(content)
        print("Added test App function")
    else:
        print("App function found at:", content.find('const App = () => {'))

