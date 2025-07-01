import re

# Read the current index.html
with open('frontend/public/index.html', 'r') as f:
    content = f.read()

print("Checking what's currently in the file...")

# Check if test mode features exist
delete_leads_exists = '🗑️ Delete All Leads' in content
delete_inventory_exists = '🗑️ Delete All Inventory' in content
fill_test_data_exists = '🧪 Fill Test Data' in content
test_banner_exists = 'TEST MODE ACTIVE' in content

print(f"\nCurrent status:")
print(f"Delete All Leads button: {'✅ EXISTS' if delete_leads_exists else '❌ MISSING'}")
print(f"Delete All Inventory button: {'✅ EXISTS' if delete_inventory_exists else '❌ MISSING'}")
print(f"Fill Test Data buttons: {'✅ EXISTS' if fill_test_data_exists else '❌ MISSING'}")
print(f"Test Mode Active banner: {'✅ EXISTS' if test_banner_exists else '❌ MISSING'}")

if not all([delete_leads_exists, delete_inventory_exists, fill_test_data_exists, test_banner_exists]):
    print("\nSome features are missing. Adding them now...")
    
    # 1. Add Delete All Leads button
    if not delete_leads_exists:
        print("\nAdding Delete All Leads button...")
        # Find the leads section more precisely
        pattern = r"(activeTab === 'leads'[^{]*?{[^}]*?React\.createElement\('button',\s*{\s*onClick:\s*\(\)\s*=>\s*setShowAddForm\(true\)[^}]*?},\s*'Add New Lead'\))"
        match = re.search(pattern, content, re.DOTALL)
        
        if match:
            insert_pos = match.end()
            delete_button = """,
                    testMode && user.role === 'super_admin' && React.createElement('button', {
                        className: 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded ml-2',
                        onClick: async () => {
                            if (confirm('Delete ALL leads? This cannot be undone!')) {
                                try {
                                    setLoading(true);
                                    const response = await apiCall('/leads', {
                                        method: 'DELETE',
                                        headers: { 'X-Delete-All': 'true', 'X-Test-Mode': 'true' }
                                    });
                                    alert('All leads deleted!');
                                    fetchLeads();
                                } catch (error) {
                                    alert('Error: ' + error.message);
                                } finally {
                                    setLoading(false);
                                }
                            }
                        }
                    }, '🗑️ Delete All Leads')"""
            
            content = content[:insert_pos] + delete_button + content[insert_pos:]
            print("✅ Added Delete All Leads button")
        else:
            print("❌ Could not find Add New Lead button location")
    
    # 2. Add Delete All Inventory button
    if not delete_inventory_exists:
        print("\nAdding Delete All Inventory button...")
        pattern = r"(activeTab === 'inventory'[^{]*?{[^}]*?React\.createElement\('button',\s*{\s*onClick:\s*\(\)\s*=>\s*setShowAddInventoryForm\(true\)[^}]*?},\s*'Add New Item'\))"
        match = re.search(pattern, content, re.DOTALL)
        
        if match:
            insert_pos = match.end()
            delete_button = """,
                    testMode && user.role === 'super_admin' && React.createElement('button', {
                        className: 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded ml-2',
                        onClick: async () => {
                            if (confirm('Delete ALL inventory? This cannot be undone!')) {
                                try {
                                    setLoading(true);
                                    const response = await apiCall('/inventory', {
                                        method: 'DELETE',
                                        headers: { 'X-Delete-All': 'true', 'X-Test-Mode': 'true' }
                                    });
                                    alert('All inventory deleted!');
                                    fetchInventory();
                                } catch (error) {
                                    alert('Error: ' + error.message);
                                } finally {
                                    setLoading(false);
                                }
                            }
                        }
                    }, '🗑️ Delete All Inventory')"""
            
            content = content[:insert_pos] + delete_button + content[insert_pos:]
            print("✅ Added Delete All Inventory button")
        else:
            print("❌ Could not find Add New Item button location")
    
    # 3. Add Fill Test Data in Lead Form
    if not fill_test_data_exists:
        print("\nAdding Fill Test Data button in Lead form...")
        # Find the lead form submit button
        pattern = r"(showAddForm[^{]*?{[^}]*?React\.createElement\('form'[^}]*?React\.createElement\('button',\s*{\s*type:\s*'submit'[^}]*?},\s*loading\s*\?\s*'Saving\.\.\.' :\s*'Submit'\))"
        match = re.search(pattern, content, re.DOTALL)
        
        if match:
            insert_pos = match.end()
            fill_button = """,
                        testMode && React.createElement('button', {
                            type: 'button',
                            className: 'bg-yellow-500 text-white px-6 py-3 rounded-md hover:bg-yellow-600 font-medium ml-2',
                            onClick: () => {
                                setFormData({
                                    name: 'Test User ' + Math.floor(Math.random() * 1000),
                                    email: 'test' + Math.floor(Math.random() * 1000) + '@example.com',
                                    phone: '98' + Math.floor(Math.random() * 90000000 + 10000000),
                                    company: 'Test Company ' + Math.floor(Math.random() * 100),
                                    lead_for_event: 'General Inquiry',
                                    lead_source: 'Website',
                                    notes: 'Test lead created in test mode'
                                });
                            }
                        }, '🧪 Fill Test Data')"""
            
            content = content[:insert_pos] + fill_button + content[insert_pos:]
            print("✅ Added Fill Test Data button in Lead form")
        else:
            print("❌ Could not find Lead form submit button")
    
    # 4. Add Test Mode Banner
    if not test_banner_exists:
        print("\nAdding Test Mode Active banner...")
        # Find the main element
        pattern = r"(React\.createElement\('main',\s*{\s*className:\s*'flex-1 overflow-y-auto p-6'\s*},)"
        match = re.search(pattern, content, re.DOTALL)
        
        if match:
            insert_pos = match.end()
            banner = """
                testMode && user && user.role === 'super_admin' && React.createElement('div', {
                    className: 'bg-red-100 border-2 border-red-500 text-red-700 p-4 rounded-lg mb-4 text-center font-bold animate-pulse'
                }, '⚠️ TEST MODE ACTIVE - Delete buttons and test data fills are enabled!'),"""
            
            content = content[:insert_pos] + banner + content[insert_pos:]
            print("✅ Added Test Mode Active banner")
        else:
            print("❌ Could not find main element")
    
    # Save the updated content
    with open('frontend/public/index.html', 'w') as f:
        f.write(content)
    
    print("\n✅ All missing features have been added!")
else:
    print("\n✅ All test mode features are already present!")

# Double-check by searching for specific patterns
print("\n\nDouble-checking implementation...")
print("Looking for test mode conditions...")

# Check if testMode variable is being used correctly
testmode_checks = re.findall(r'testMode\s*&&[^,\n]*', content)
print(f"\nFound {len(testmode_checks)} testMode conditional checks")
for i, check in enumerate(testmode_checks[:5]):  # Show first 5
    print(f"  {i+1}. {check[:60]}...")

# Also make sure testMode state is declared
if 'const [testMode, setTestMode] = React.useState' in content:
    print("\n✅ testMode state is properly declared")
else:
    print("\n❌ testMode state declaration not found!")
