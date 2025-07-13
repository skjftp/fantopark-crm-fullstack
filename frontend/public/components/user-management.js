// ============================================================================
// USER MANAGEMENT COMPONENT - Extracted from index.html
// ============================================================================
// This component manages user CRUD operations, role assignments, and user administration
// with comprehensive permission-based access control.

// Main User Management Modal Renderer
window.renderUserManagement = () => {
    if (!window.showUserManagement) return null;

    return React.createElement('div', { 
        className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
        onClick: (e) => e.target === e.currentTarget && window.closeUserForm()
    },
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[95vh] overflow-y-auto' },
            React.createElement('div', { className: 'sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center' },
                React.createElement('h2', { className: 'text-2xl font-bold text-gray-900' }, 'User Management'),
                React.createElement('div', { className: 'flex space-x-2' },
                    window.hasPermission('users', 'write') && React.createElement('button', {
                        onClick: () => window.openUserForm(window.user),
                        className: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'
                    }, '+ Add User'),
                    React.createElement('button', {
                        onClick: () => window.setShowUserManagement(false),
                        className: 'text-gray-400 hover:text-gray-600 text-2xl'
                    }, '✕')
                )
            ),
            React.createElement('div', { className: 'p-6' },
                React.createElement('div', { className: 'overflow-x-auto' },
                    React.createElement('table', { className: 'w-full' },
                        React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-900' },
                            React.createElement('tr', null,
                                React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'User'),
                                React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Role'),
                                React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Department'),
                                React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Status'),
                                React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Payment'),
                                React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Created'),
                                React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
                            )
                        ),
                        React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
                            window.users.map(user =>
                                React.createElement('tr', { key: user.id, className: 'hover:bg-gray-50' },
                                    React.createElement('td', { className: 'px-6 py-4' },
                                        React.createElement('div', { className: 'text-sm font-medium text-gray-900' }, user.name),
                                        React.createElement('div', { className: 'text-sm text-gray-500' }, user.email)
                                    ),
                                    React.createElement('td', { className: 'px-6 py-4' },
                                        React.createElement('span', {
                                            className: `px-2 py-1 text-xs rounded ${
                                                user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                                                user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                                                user.role.includes('manager') ? 'bg-green-100 text-green-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`
                                        }, window.getRoleDisplayLabel(user.role))
                                    ),
                                    React.createElement('td', { className: 'px-6 py-4 text-sm text-gray-900' }, user.department),
                                    React.createElement('td', { className: 'px-6 py-4' },
                                        React.createElement('span', {
                                            className: `px-2 py-1 text-xs rounded ${
                                                user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`
                                        }, user.status.charAt(0).toUpperCase() + user.status.slice(1))
                                    ),
                                    React.createElement('td', { className: 'px-6 py-4 text-sm text-gray-900' }, 
                                        new Date(user.created_date).toLocaleDateString()
                                    ),
                                    React.createElement('td', { className: 'px-6 py-4' },
                                        React.createElement('div', { className: 'flex space-x-2' },
                                            window.hasPermission('users', 'write') && React.createElement('button', {
                                                onClick: () => window.openUserForm(),
                                                className: 'text-blue-600 hover:text-blue-900 text-sm px-2 py-1 rounded border border-blue-200 hover:bg-blue-50'
                                            }, 'Edit'),
                                            window.hasPermission('users', 'delete') && user.id !== 1 && React.createElement('button', {
                                                onClick: () => window.handleDeleteUser(user.id, user.name),
                                                className: 'text-red-600 hover:text-red-900 text-sm px-2 py-1 rounded border border-red-200 hover:bg-red-50',
                                                disabled: window.loading
                                            }, window.loading ? 'Deleting...' : 'Delete')
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            )
        )
    );
};

// User Management Helper Functions
window.openUserManagement = () => {
    if (!window.hasPermission('users', 'read')) {
        alert('You do not have permission to access user management');
        return;
    }
    window.setShowUserManagement(true);
};

window.openUserForm = (editUser = null) => {
    if (editUser && !window.hasPermission('users', 'write')) {
        alert('You do not have permission to edit users');
        return;
    }
    if (!editUser && !window.hasPermission('users', 'write')) {
        alert('You do not have permission to create users');
        return;
    }

    window.setCurrentUser(editUser);
    if (editUser) {
        // Editing existing user
        window.setUserFormData({
            name: editUser.name,
            email: editUser.email,
            role: editUser.role,
            status: editUser.status || 'active'
        });
    } else {
        // Creating new user
        window.setUserFormData({
            name: '',
            email: '',
            role: '',
            password: '',
            status: 'active'
        });
    }
    window.setShowUserForm(true);
};

window.handleDeleteUser = async (userId, userName) => {
    if (!window.hasPermission('users', 'delete')) {
        alert('You do not have permission to delete users');
        return;
    }

    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
        return;
    }

    window.setLoading(true);
    try {
        await window.apiCall(`/users/${userId}`, { method: 'DELETE' });
        console.log('User deleted successfully');

        // Remove user from the list
        window.setUsers(prev => prev.filter(u => u.id !== userId));
        window.showNotification('User deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting user:', error);
        window.showNotification(error.message || 'Failed to delete user', 'error');
    } finally {
        window.setLoading(false);
    }
};

window.closeUserForm = () => {
    window.setShowUserForm(false);
    window.setEditingUser(null);
    window.setUserFormData({
        name: '',
        email: '',
        password: '',
        role: 'viewer',
        department: '',
        status: 'active'
    });
};

window.handleUserSubmit = async (e) => {
    e.preventDefault();
    window.setLoading(true);

    try {
        const endpoint = window.editingUser ? '/users/' + (window.editingUser.id) : '/users';
        const method = window.editingUser ? 'PUT' : 'POST';

        const response = await window.apiCall(endpoint, {
            method: method,
            body: JSON.stringify(window.userFormData)
        });

        if (response.error) {
            throw new Error(response.error);
        }

        console.log(window.editingUser ? 'User updated successfully' : 'User created successfully');

        // Refresh users list
        window.fetchUsers();

        // Close form
        window.setShowUserForm(false);
        window.setEditingUser(null);
        window.setUserFormData({
            name: '',
            email: '',
            password: '',
            role: 'viewer',
            department: '',
            payment_status: 'paid'
        });
    } catch (error) {
        console.error('Error saving user:', error);
        alert(error.message || 'Failed to save user');
    } finally {
        window.setLoading(false);
    }
};

window.fetchUsers = async () => {
    console.log("🔍 fetchUsers called");
    
    try {
        console.log("🌐 Making API call to /users");
        const response = await window.apiCall('/users');
        
        console.log("📡 API response received");
        
        if (response.data) {
            console.log("✅ Users fetched successfully:", response.data.length, "users");
            
            // Use the enhanced setUsers function
            window.setUsers(response.data);
            
            // Force a manual sync to appState as well
            if (window.appState) {
                window.appState.users = response.data;
            }
            
        } else {
            console.warn("⚠️ No users data in API response");
            window.setUsers([]);
        }
    } catch (error) {
        console.error('❌ Failed to fetch users:', error);
        // Set empty array on error to prevent undefined issues
        window.setUsers([]);
    }
};

console.log('✅ User Management component loaded successfully');
