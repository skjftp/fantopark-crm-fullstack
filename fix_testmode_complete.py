import re

with open('frontend/public/index.html', 'r') as f:
    content = f.read()

# Fix 1: Fix the testMode state declaration syntax error
# Current broken code has console.log inside useState callback
broken_pattern = r'const \[testMode, setTestMode\] = useState\(\(\) => \{\s*return localStorage\.getItem\(\'testMode\'\) === \'true\';\s*console\.log[^}]+\}\);'
fixed_testmode = """const [testMode, setTestMode] = useState(() => {
        return localStorage.getItem('testMode') === 'true';
    });"""

content = re.sub(broken_pattern, fixed_testmode, content, flags=re.DOTALL)

# Fix 2: Remove the orphaned console.log statements
content = re.sub(r"console\.log\('Test mode state:', testMode\);\s*console\.log\('Current user:', currentUser\);\s*console\.log\('Is super admin:', currentUser\?\.role === 'super_admin'\);", "", content)

# Fix 3: Add proper test mode logging after state declarations
# Find where to add the logging effect
auth_effect_pattern = r'(// Persist authentication state\s*useEffect\(\(\) => \{)'
if re.search(auth_effect_pattern, content):
    test_mode_effect = """
    // Test mode logging
    useEffect(() => {
        console.log('Test mode state:', testMode);
        console.log('Current user:', currentUser);
        console.log('Is super admin:', currentUser?.role === 'super_admin');
    }, [testMode, currentUser]);

    """
    content = re.sub(auth_effect_pattern, test_mode_effect + r'\1', content)

# Fix 4: Ensure test mode toggle is visible
# The toggle already exists in the code but let's make sure it's properly placed
# Check if the test mode toggle UI exists
if 'Toggle Test Mode' in content:
    print("✓ Test mode toggle UI already exists")
else:
    print("⚠ Test mode toggle UI missing - adding it")
    # Add test mode toggle in header after dark mode toggle
    darkmode_toggle_pattern = r'(\)\s*\)\s*\)\s*\),?\s*)(React\.createElement\(\'main\')'
    
    test_toggle_ui = """React.createElement('div', {
                    style: {
                        display: currentUser?.role === 'super_admin' ? 'flex' : 'none',
                        alignItems: 'center',
                        gap: '8px',
                        marginRight: '16px'
                    }
                },
                    React.createElement('span', {
                        style: { fontWeight: 'bold', fontSize: '14px' }
                    }, 'Test Mode:'),
                    React.createElement('button', {
                        onClick: () => {
                            const newMode = !testMode;
                            setTestMode(newMode);
                            localStorage.setItem('testMode', newMode.toString());
                            console.log('Test mode toggled to:', newMode);
                            alert('Test mode ' + (newMode ? 'enabled' : 'disabled') + '. Page will reload.');
                            window.location.reload();
                        },
                        style: {
                            padding: '6px 12px',
                            borderRadius: '6px',
                            backgroundColor: testMode ? '#dc2626' : '#e5e7eb',
                            color: testMode ? 'white' : 'black',
                            border: '1px solid ' + (testMode ? '#dc2626' : '#d1d5db'),
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '14px'
                        }
                    }, testMode ? 'ON' : 'OFF')
                ),
            ),
            """
    
    content = re.sub(darkmode_toggle_pattern, r'\1' + test_toggle_ui + r'\2', content)

# Write the fixed content
with open('frontend/public/index.html', 'w') as f:
    f.write(content)

print("✅ Frontend fixes applied")
