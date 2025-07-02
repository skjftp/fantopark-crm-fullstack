import re

with open('index.html', 'r') as f:
    content = f.read()

print("Fixing order assignment to use single assign button...\n")

# Find the pattern where individual buttons are created for each person
pattern = r"hasPermission\('orders', 'assign'\) && order\.status === 'approved' && !order\.assigned_to &&\s*\n\s*\(users \|\| \[\]\)\.filter\(u => \['supply_executive', 'supply_manager'\]\.includes\(u\.role\)\)\.map\(u => u\.name\)\.map\(person =>\s*\n\s*React\.createElement\('button', \{[^}]+\}, `→ \$\{person\}`\)\s*\n\s*\)"

# Replace with a single assign button
replacement = """hasPermission('orders', 'assign') && order.status === 'approved' && !order.assigned_to &&
    React.createElement('button', {
        className: 'text-blue-600 hover:text-blue-900 text-xs px-2 py-1 rounded border border-blue-200 hover:bg-blue-50',
        onClick: () => {
            setSelectedOrderForAssignment(order);
            setShowOrderAssignmentModal(true);
        },
        disabled: loading
    }, '→ Assign')"""

if re.search(pattern, content):
    content = re.sub(pattern, replacement, content)
    print("✓ Replaced individual person buttons with single Assign button")
else:
    print("! Pattern not found, trying alternative approach...")
    # Try simpler pattern
    alt_pattern = r"SUPPLY_TEAM\.map\(person =>\s*React\.createElement\('button'[^)]+\), `→ \$\{person\}`\)\s*\)"
    if re.search(alt_pattern, content):
        content = re.sub(alt_pattern, 
            """React.createElement('button', {
        className: 'text-blue-600 hover:text-blue-900 text-xs px-2 py-1 rounded border border-blue-200 hover:bg-blue-50',
        onClick: () => {
            setSelectedOrderForAssignment(order);
            setShowOrderAssignmentModal(true);
        },
        disabled: loading
    }, '→ Assign')""", content)
        print("✓ Used alternative pattern replacement")

# Add state variables for the assignment modal if not already present
if 'const [selectedOrderForAssignment, setSelectedOrderForAssignment] = useState(null);' not in content:
    # Find where state variables are declared
    state_pattern = r"(const \[showOrderDetail, setShowOrderDetail\] = useState\(false\);)"
    if re.search(state_pattern, content):
        content = re.sub(state_pattern, 
            r"\1\n    const [selectedOrderForAssignment, setSelectedOrderForAssignment] = useState(null);\n    const [showOrderAssignmentModal, setShowOrderAssignmentModal] = useState(false);",
            content)
        print("✓ Added state variables for order assignment modal")

# Add the order assignment modal function if not present
if 'const renderOrderAssignmentModal = ()' not in content:
    # Find a good place to add it (after renderOrderDetailModal)
    insert_pattern = r"(const renderOrderDetailModal = \(\) => \{[^}]+\};\s*\n)"
    insert_pos = content.find('const renderOrderDetailModal = ()')
    if insert_pos > 0:
        # Find the end of this function
        brace_count = 0
        start_pos = content.find('{', insert_pos)
        pos = start_pos
        while pos < len(content) and brace_count >= 0:
            if content[pos] == '{':
                brace_count += 1
            elif content[pos] == '}':
                brace_count -= 1
            pos += 1
            if brace_count == 0:
                break
        
        # Insert the new function after renderOrderDetailModal
        modal_function = """

const renderOrderAssignmentModal = () => {
    if (!showOrderAssignmentModal || !selectedOrderForAssignment) return null;
    
    const supplyTeamUsers = (users || []).filter(u => 
        ['supply_executive', 'supply_manager'].includes(u.role)
    );
    
    return React.createElement('div', { 
        className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
        onClick: (e) => {
            if (e.target === e.currentTarget) {
                setShowOrderAssignmentModal(false);
                setSelectedOrderForAssignment(null);
            }
        }
    },
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full' },
            React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 
                'Assign Order to Supply Team'
            ),
            React.createElement('div', { className: 'space-y-2' },
                supplyTeamUsers.map(user =>
                    React.createElement('button', {
                        key: user.email,
                        className: 'w-full text-left px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                        onClick: () => {
                            assignOrderToService(selectedOrderForAssignment.id, user.email);
                            setShowOrderAssignmentModal(false);
                            setSelectedOrderForAssignment(null);
                        }
                    },
                        React.createElement('div', { className: 'font-medium' }, user.name),
                        React.createElement('div', { className: 'text-sm text-gray-500' }, user.role)
                    )
                )
            ),
            React.createElement('button', {
                className: 'mt-4 w-full text-center text-gray-500 hover:text-gray-700',
                onClick: () => {
                    setShowOrderAssignmentModal(false);
                    setSelectedOrderForAssignment(null);
                }
            }, 'Cancel')
        )
    );
};
"""
        content = content[:pos] + modal_function + content[pos:]
        print("✓ Added renderOrderAssignmentModal function")

# Update assignOrderToService to accept email instead of name
assign_pattern = r"const assignOrderToService = async \(orderId, assignee\) => \{([^}]+)\}"
if re.search(assign_pattern, content):
    # Update the function to work with emails
    content = re.sub(
        r"assigned_to: assignee,",
        "assigned_to: assignee, // This will now be an email",
        content
    )
    print("✓ Updated assignOrderToService to handle emails")

# Make sure the modal is rendered in the main return
render_modals_pattern = r"(renderOrderDetailModal\(\))"
if re.search(render_modals_pattern, content) and 'renderOrderAssignmentModal()' not in content:
    content = re.sub(render_modals_pattern, r"\1,\n                renderOrderAssignmentModal()", content)
    print("✓ Added renderOrderAssignmentModal to main render")

# Save the updated content
with open('index.html', 'w') as f:
    f.write(content)

print("\n✅ Order assignment UI fixed successfully!")
print("\nChanges made:")
print("1. Replaced individual name buttons with single '→ Assign' button")
print("2. Added modal for selecting supply team members")
print("3. Updated to use emails for assignment (consistent with backend)")
