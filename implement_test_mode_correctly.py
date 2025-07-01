import re

# Read the current index.html
with open('frontend/public/index.html', 'r') as f:
    content = f.read()
    lines = content.split('\n')

print("Implementing test mode correctly...")

# Find where to add test mode state (after other state declarations)
state_section_start = None
for i, line in enumerate(lines):
    if 'const [authToken, setAuthToken] = useState' in line:
        # Find the end of state declarations
        for j in range(i, min(i+50, len(lines))):
            if 'const [' in lines[j]:
                state_section_start = j
            elif state_section_start and 'const [' not in lines[j] and lines[j].strip():
                # Add test mode state here
                test_mode_state = """    const [testMode, setTestMode] = useState(() => {
        return localStorage.getItem('testMode') === 'true';
    });"""
                lines.insert(j, test_mode_state)
                print(f"Added test mode state at line {j+1}")
                break
        break

# Find where to add test mode toggle in header (after dark mode toggle)
for i, line in enumerate(lines):
    if 'darkMode ? \'bg-gray-800\' : \'bg-gray-200\'' in line and 'translate-x-6' in lines[i+5]:
        # Found dark mode toggle, add test mode after it
        for j in range(i+5, i+15):
            if ')' in lines[j] and not 'React.createElement' in lines[j]:
                # Add test mode toggle here
                test_mode_toggle = """,
                        currentUser?.role === 'super_admin' && React.createElement('div', { 
                            className: 'flex items-center gap-2',
                            style: { marginLeft: '1rem' }
                        },
                            React.createElement('button', {
                                onClick: () => {
                                    const newMode = !testMode;
                                    setTestMode(newMode);
                                    localStorage.setItem('testMode', newMode);
                                },
                                className: `relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${
                                    testMode ? 'bg-red-600' : 'bg-gray-300'
                                }`
                            },
                                React.createElement('span', {
                                    className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        testMode ? 'translate-x-6' : 'translate-x-1'
                                    }`
                                })
                            ),
                            testMode && React.createElement('span', { 
                                className: 'text-red-600 font-bold text-sm'
                            }, 'TEST MODE ACTIVE')
                        )"""
                lines[j] = lines[j].rstrip() + test_mode_toggle
                print(f"Added test mode toggle at line {j+1}")
                break
        break

# Add test mode visual indicator (red border)
for i, line in enumerate(lines):
    if 'React.createElement(\'div\', { className: \'min-h-screen' in line:
        # Add test mode class
        lines[i] = line.replace(
            'className: \'min-h-screen',
            'className: `min-h-screen ${testMode ? "border-4 border-red-500" : ""}`'.replace('`', "'")
        )
        print(f"Added test mode visual indicator at line {i+1}")
        break

# Add delete all buttons in each section when test mode is active
sections_to_update = [
    ('renderLeadsContent', 'Delete All Leads', '/leads'),
    ('renderInventoryContent', 'Delete All Inventory', '/inventory'),
    ('renderOrdersContent', 'Delete All Orders', '/orders'),
    ('renderFinancialContent', 'Delete All Financial Data', '/financial/all')
]

for section_name, button_text, endpoint in sections_to_update:
    for i, line in enumerate(lines):
        if f'const {section_name} = ()' in line:
            # Find where to add the delete button (after the "Add New" button)
            for j in range(i, min(i+100, len(lines))):
                if 'Add New' in lines[j] and 'onClick' in lines[j-2]:
                    # Find the closing of this button
                    for k in range(j, j+10):
                        if ')' in lines[k] and not 'React.createElement' in lines[k]:
                            # Add test mode delete button
                            delete_button = f""",
                            testMode && currentUser?.role === 'super_admin' && React.createElement('button', {{
                                onClick: async () => {{
                                    if (window.confirm('Are you sure you want to delete ALL {button_text.split()[-1].lower()}? This cannot be undone!')) {{
                                        try {{
                                            setLoading(true);
                                            const response = await apiCall('{endpoint}', {{
                                                method: 'DELETE'
                                            }});
                                            if (response.ok) {{
                                                alert('All {button_text.split()[-1].lower()} deleted successfully');
                                                window.location.reload();
                                            }}
                                        }} catch (error) {{
                                            alert('Error: ' + error.message);
                                        }} finally {{
                                            setLoading(false);
                                        }}
                                    }}
                                }},
                                className: 'bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2',
                                disabled: loading
                            }}, '🗑️ {button_text}')"""
                            lines[k] = lines[k].rstrip() + delete_button
                            print(f"Added {button_text} button in {section_name}")
                            break
                    break
            break

# Add fill test data buttons in forms
forms_to_update = [
    ('showAddForm && renderForm', 'lead', """{{
                                    name: 'Test User ' + Math.floor(Math.random() * 1000),
                                    email: 'test' + Math.floor(Math.random() * 1000) + '@example.com',
                                    phone: '98' + Math.floor(Math.random() * 90000000 + 10000000),
                                    company: 'Test Company ' + Math.floor(Math.random() * 100),
                                    event_type: ['Wedding', 'Birthday', 'Conference', 'Party'][Math.floor(Math.random() * 4)],
                                    event_date: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                                    lead_source: ['facebook', 'whatsapp', 'website', 'referral'][Math.floor(Math.random() * 4)]
                                }}"""),
    ('showAddInventoryForm && renderInventoryForm', 'inventory', """{{
                                    product_name: 'Test Product ' + Math.floor(Math.random() * 1000),
                                    category: ['Lighting', 'Sound', 'Stage', 'Decoration'][Math.floor(Math.random() * 4)],
                                    sku: 'SKU-' + Math.floor(Math.random() * 100000),
                                    price: Math.floor(Math.random() * 50000 + 1000),
                                    quantity: Math.floor(Math.random() * 100 + 1),
                                    min_quantity: Math.floor(Math.random() * 10 + 1)
                                }}""")
]

for form_check, form_type, test_data in forms_to_update:
    for i, line in enumerate(lines):
        if form_check in line:
            # Find the form submit button
            for j in range(i, min(i+200, len(lines))):
                if 'type: \'submit\'' in lines[j]:
                    # Add fill test data button before submit
                    for k in range(j-5, j):
                        if 'React.createElement(\'div\',' in lines[k] and 'flex' in lines[k]:
                            test_button = f""",
                            testMode && React.createElement('button', {{
                                type: 'button',
                                onClick: () => {{
                                    setFormData({test_data});
                                }},
                                className: 'bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600'
                            }}, '🧪 Fill Test Data')"""
                            # Find where to insert (after the div opening)
                            insert_pos = k + 1
                            while insert_pos < j and 'React.createElement' not in lines[insert_pos]:
                                insert_pos += 1
                            if insert_pos < j:
                                lines[insert_pos-1] = lines[insert_pos-1].rstrip() + test_button
                                print(f"Added fill test data button for {form_type} form")
                            break
                    break
            break

# Write the updated content
with open('frontend/public/index.html', 'w') as f:
    f.write('\n'.join(lines))

print("\nTest mode implementation complete!")
print("Features added:")
print("✓ Test mode state with localStorage persistence")
print("✓ Test mode toggle in header (super admin only)")
print("✓ Visual indicator (red border) when active")
print("✓ Delete all buttons in each section")
print("✓ Fill test data buttons in forms")
