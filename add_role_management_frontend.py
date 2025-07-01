#!/usr/bin/env python3
import re

with open('frontend/public/index.html', 'r') as f:
    content = f.read()

# 1. Add state for available roles after other useState declarations
state_pattern = r"(const \[showCSVUploadModal, setShowCSVUploadModal\] = useState\(false\);)"
state_addition = r"""\1
const [availableRoles, setAvailableRoles] = useState([]);"""

content = re.sub(state_pattern, state_addition, content)

# 2. Add fetchAvailableRoles function after fetchData function
fetch_pattern = r"(const fetchData = async \(\) => \{[^}]+\};)"
fetch_addition = r"""\1

const fetchAvailableRoles = async () => {
    try {
        const response = await apiCall('/roles');
        setAvailableRoles(response.data || []);
    } catch (error) {
        console.error('Failed to fetch roles:', error);
    }
};"""

content = re.sub(fetch_pattern, fetch_addition, content, flags=re.DOTALL)

# 3. Add useEffect to fetch roles when logged in
effect_pattern = r"(useEffect\(\(\) => \{\s*if \(isLoggedIn\) \{\s*fetchData\(\);\s*\}\s*\}, \[isLoggedIn\]\);)"
effect_addition = r"""\1

useEffect(() => {
    if (isLoggedIn) {
        fetchAvailableRoles();
    }
}, [isLoggedIn]);"""

content = re.sub(effect_pattern, effect_addition, content)

# 4. Update hasPermission to use user.permissions
permission_pattern = r"const hasPermission = \(module, action\) => \{[^}]+\};"
permission_replacement = r"""const hasPermission = (module, action) => {
    if (!user || !user.permissions) return false;
    return user.permissions[module]?.[action] || false;
};"""

content = re.sub(permission_pattern, permission_replacement, content, flags=re.DOTALL)

# 5. Add Role Management to sidebar (this is tricky, let's find the right spot)
# Look for the Users button in sidebar and add after it
sidebar_pattern = r"(\{user && hasPermission\('users', 'read'\)[^}]+Users[^)]+\)\s*\})"
sidebar_addition = r"""\1,
                {user && user.role === 'super_admin' && React.createElement('button', {
                    onClick: () => setActiveTab('roles'),
                    className: `w-full text-left px-4 py-2 hover:bg-gray-700 ${activeTab === 'roles' ? 'bg-gray-700' : ''}`
                },
                    React.createElement('div', { className: 'flex items-center' },
                        React.createElement('svg', {
                            className: 'w-5 h-5 mr-3',
                            fill: 'none',
                            stroke: 'currentColor',
                            viewBox: '0 0 24 24'
                        },
                            React.createElement('path', {
                                strokeLinecap: 'round',
                                strokeLinejoin: 'round',
                                strokeWidth: 2,
                                d: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
                            })
                        ),
                        'Role Management'
                    )
                )}"""

content = re.sub(sidebar_pattern, sidebar_addition, content, flags=re.DOTALL)

# Save the updated content
with open('frontend/public/index.html', 'w') as f:
    f.write(content)

print("Added Role Management frontend components!")
