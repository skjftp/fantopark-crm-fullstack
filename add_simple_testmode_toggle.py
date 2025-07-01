import re

with open('frontend/public/index.html', 'r') as f:
    content = f.read()

# Find where the main app content starts (after login)
# Look for the dashboard button which is always visible
dashboard_btn_pattern = r"(React\.createElement\('button',\s*\{[^}]*onClick:[^}]*setActiveTab\('dashboard'\)[^}]*\},\s*'Dashboard'\))"
match = re.search(dashboard_btn_pattern, content)

if match:
    print("Found dashboard button, adding test mode toggle before it...")
    
    # Add a simple, always-visible test mode section for super admins
    simple_toggle = """React.createElement('div', {
                    style: { 
                        display: currentUser?.role === 'super_admin' ? 'block' : 'none',
                        textAlign: 'center',
                        padding: '20px',
                        backgroundColor: testMode ? '#dc2626' : '#eab308',
                        color: testMode ? 'white' : 'black',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        marginBottom: '20px',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    },
                    onClick: () => {
                        const newValue = !testMode;
                        setTestMode(newValue);
                        localStorage.setItem('testMode', String(newValue));
                        console.log('Test mode is now:', newValue);
                        alert('Test mode is now: ' + (newValue ? 'ON' : 'OFF') + '\\n\\nPage will reload to apply changes.');
                        window.location.reload();
                    }
                }, 
                    testMode ? '🧪 TEST MODE IS ON - CLICK TO TURN OFF' : '🧪 TEST MODE IS OFF - CLICK TO TURN ON'
                ),
                """
    
    content = content[:match.start()] + simple_toggle + content[match.start():]
    print("✓ Added simple test mode toggle")
    
    with open('frontend/public/index.html', 'w') as f:
        f.write(content)
else:
    print("Could not find dashboard button")

# Also ensure the debug logs are added
if 'console.log(\'Test mode state:\', testMode);' not in content:
    # Add right after testMode state declaration
    state_pattern = r'(const \[testMode, setTestMode\] = useState[^;]+;)'
    match = re.search(state_pattern, content)
    if match:
        debug_log = """
    console.log('Test mode state:', testMode);
    console.log('Current user role:', currentUser?.role);"""
        content = content[:match.end()] + debug_log + content[match.end():]
        print("✓ Added debug logging")
        
        with open('frontend/public/index.html', 'w') as f:
            f.write(content)
