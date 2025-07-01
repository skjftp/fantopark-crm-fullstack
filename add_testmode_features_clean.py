import re

# Read the current index.html
with open('frontend/public/index.html', 'r') as f:
    content = f.read()

print("Adding test mode features cleanly...")

# 1. First, let's add the Delete All buttons for Leads
# Find the "Add New Lead" button and add delete button after it
lead_button_pattern = r"(React\.createElement\('button',\s*\{\s*onClick:\s*\(\)\s*=>\s*setShowAddForm\(true\)[^}]+\},\s*'Add New Lead'\))"
lead_match = re.search(lead_button_pattern, content, re.DOTALL)

if lead_match:
    print("Found Add New Lead button, adding Delete All Leads button...")
    insert_pos = lead_match.end()
    
    delete_lead_button = """,
                    testMode && user.role === 'super_admin' && React.createElement('button', {
                        className: 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded ml-2',
                        onClick: async () => {
                            if (confirm('Delete ALL leads? This cannot be undone!')) {
                                try {
                                    setLoading(true);
                                    const response = await fetch(API_URL + '/api/leads', {
                                        method: 'DELETE',
                                        headers: {
                                            'Authorization': 'Bearer ' + authToken,
                                            'X-Delete-All': 'true',
                                            'X-Test-Mode': 'true'
                                        }
                                    });
                                    if (response.ok) {
                                        alert('All leads deleted!');
                                        window.location.reload();
                                    } else {
                                        throw new Error('Failed to delete leads');
                                    }
                                } catch (error) {
                                    alert('Error: ' + error.message);
                                } finally {
                                    setLoading(false);
                                }
                            }
                        }
                    }, '🗑️ Delete All Leads')"""
    
    content = content[:insert_pos] + delete_lead_button + content[insert_pos:]
    print("✅ Added Delete All Leads button")

# 2. Add Delete All button for Inventory
inv_button_pattern = r"(React\.createElement\('button',\s*\{\s*onClick:\s*\(\)\s*=>\s*setShowAddInventoryForm\(true\)[^}]+\},\s*'Add New Item'\))"
inv_match = re.search(inv_button_pattern, content, re.DOTALL)

if inv_match:
    print("Found Add New Item button, adding Delete All Inventory button...")
    insert_pos = inv_match.end()
    
    delete_inv_button = """,
                    testMode && user.role === 'super_admin' && React.createElement('button', {
                        className: 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded ml-2',
                        onClick: async () => {
                            if (confirm('Delete ALL inventory? This cannot be undone!')) {
                                try {
                                    setLoading(true);
                                    const response = await fetch(API_URL + '/api/inventory', {
                                        method: 'DELETE',
                                        headers: {
                                            'Authorization': 'Bearer ' + authToken,
                                            'X-Delete-All': 'true',
                                            'X-Test-Mode': 'true'
                                        }
                                    });
                                    if (response.ok) {
                                        alert('All inventory deleted!');
                                        window.location.reload();
                                    } else {
                                        throw new Error('Failed to delete inventory');
                                    }
                                } catch (error) {
                                    alert('Error: ' + error.message);
                                } finally {
                                    setLoading(false);
                                }
                            }
                        }
                    }, '🗑️ Delete All Inventory')"""
    
    content = content[:insert_pos] + delete_inv_button + content[insert_pos:]
    print("✅ Added Delete All Inventory button")

# 3. Add Fill Test Data button in Lead form
# Find the submit button in the lead form
lead_form_pattern = r"(React\.createElement\('button',\s*\{\s*type:\s*'submit'[^}]+\},\s*loading\s*\?\s*'Saving\.\.\.'\s*:\s*'Submit'\))"
lead_form_matches = list(re.finditer(lead_form_pattern, content, re.DOTALL))

if lead_form_matches:
    # Use the first match (should be the add lead form)
    match = lead_form_matches[0]
    print("Found Lead form submit button, adding Fill Test Data button...")
    insert_pos = match.end()
    
    fill_data_button = """,
                        testMode && React.createElement('button', {
                            type: 'button',
                            className: 'bg-yellow-500 text-white px-6 py-3 rounded-md hover:bg-yellow-600 font-medium ml-2',
                            onClick: () => {
                                const testData = {
                                    name: 'Test User ' + Math.floor(Math.random() * 1000),
                                    email: 'test' + Math.floor(Math.random() * 1000) + '@example.com',
                                    phone: '98' + Math.floor(Math.random() * 90000000 + 10000000),
                                    company: 'Test Company ' + Math.floor(Math.random() * 100),
                                    lead_for_event: 'General Inquiry',
                                    lead_source: 'Website',
                                    notes: 'This is a test lead created in test mode'
                                };
                                setFormData(testData);
                            }
                        }, '🧪 Fill Test Data')"""
    
    content = content[:insert_pos] + fill_data_button + content[insert_pos:]
    print("✅ Added Fill Test Data button in Lead form")

# 4. Add Fill Test Data button in Inventory form
inv_form_pattern = r"(React\.createElement\('button',\s*\{\s*type:\s*'submit'[^}]+\},\s*loading\s*\?\s*'Saving\.\.\.'\s*:\s*'Add Item'\))"
inv_form_match = re.search(inv_form_pattern, content, re.DOTALL)

if inv_form_match:
    print("Found Inventory form submit button, adding Fill Test Data button...")
    insert_pos = inv_form_match.end()
    
    fill_inv_button = """,
                        testMode && React.createElement('button', {
                            type: 'button',
                            className: 'bg-yellow-500 text-white px-6 py-3 rounded-md hover:bg-yellow-600 font-medium ml-2',
                            onClick: () => {
                                const categories = ['Stall', 'Equipment', 'Service', 'Package'];
                                const testData = {
                                    name: 'Test Item ' + Math.floor(Math.random() * 1000),
                                    category: categories[Math.floor(Math.random() * categories.length)],
                                    price: Math.floor(Math.random() * 90000) + 10000,
                                    quantity: Math.floor(Math.random() * 50) + 1,
                                    description: 'Test item created in test mode',
                                    size: '10x10',
                                    location: 'Zone ' + Math.floor(Math.random() * 5 + 1)
                                };
                                setInventoryFormData(testData);
                            }
                        }, '🧪 Fill Test Data')"""
    
    content = content[:insert_pos] + fill_inv_button + content[insert_pos:]
    print("✅ Added Fill Test Data button in Inventory form")

# 5. Add Test Mode Active banner
# Find where to add the banner (after the main element starts)
banner_pattern = r"(React\.createElement\('main',\s*\{\s*className:\s*'flex-1 overflow-y-auto p-6'\s*\},)"
banner_match = re.search(banner_pattern, content, re.DOTALL)

if banner_match:
    print("Adding Test Mode Active banner...")
    insert_pos = banner_match.end()
    
    test_banner = """
                testMode && user.role === 'super_admin' && React.createElement('div', {
                    className: 'bg-red-100 border-2 border-red-500 text-red-700 p-4 rounded-lg mb-4 text-center font-bold animate-pulse'
                }, 
                    '⚠️ TEST MODE ACTIVE - Delete buttons and test data fills are enabled!'
                ),"""
    
    content = content[:insert_pos] + test_banner + content[insert_pos:]
    print("✅ Added Test Mode Active banner")

# Write the updated content
with open('frontend/public/index.html', 'w') as f:
    f.write(content)

print("\n✅ All test mode features added successfully!")
