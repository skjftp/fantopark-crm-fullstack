# Read the file
with open('frontend/public/index.html', 'r') as f:
    content = f.read()

# Add a simple test mode indicator right after the header
if 'TEST MODE INDICATOR' not in content:
    print("Adding simple test mode indicator...")
    
    # Find the header closing
    pattern = r"(</header>)"
    match = re.search(pattern, content)
    
    if match:
        insert_pos = match.start()
        indicator = """
            {testMode && React.createElement('div', {
                style: {
                    backgroundColor: '#dc2626',
                    color: 'white',
                    textAlign: 'center',
                    padding: '8px',
                    fontWeight: 'bold',
                    fontSize: '14px'
                }
            }, '🧪 TEST MODE IS ACTIVE - TEST MODE INDICATOR')}
            """
        
        content = content[:insert_pos] + indicator + content[insert_pos:]
        
        with open('frontend/public/index.html', 'w') as f:
            f.write(content)
        
        print("✅ Added test mode indicator")

print("\nIf test mode is ON, you should see a red bar saying 'TEST MODE IS ACTIVE'")
