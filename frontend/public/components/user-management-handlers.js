// User Management Functions Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Handles user form operations, deletion, and data fetching

// User form opening function with permission checks
window.openUserForm = function(editUser = null) {
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

// Enhanced user deletion function with permission checks
window.handleDeleteUser = async function(userId, userName) {
  if (!window.hasPermission('users', 'delete')) {
    alert('You do not have permission to delete users');
    return;
  }

  if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
    return;
  }

  window.setLoading(true);
  try {
    await window.apicall(`/users/${userId}`, { method: 'DELETE' });
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

// User form closing function with cleanup
window.closeUserForm = function() {
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

// User data fetching function
window.fetchUsers = async function() {
  try {
    const response = await window.apicall('/users');
    if (response.data) {
      window.setUsers(response.data);
    }
  } catch (error) {
    console.error('Failed to fetch users:', error);
  }
};

// Additional user management utilities
window.validateUserData = function(userData) {
  const errors = [];

  // Required field validation
  if (!userData.name || userData.name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!userData.email || userData.email.trim().length === 0) {
    errors.push('Email is required');
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (userData.email && !emailRegex.test(userData.email)) {
    errors.push('Invalid email format');
  }

  // Role validation
  if (!userData.role || userData.role.trim().length === 0) {
    errors.push('Role is required');
  }

  // Password validation (only for new users)
  if (!userData.id && (!userData.password || userData.password.length < 6)) {
    errors.push('Password must be at least 6 characters long');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

// User role management
window.getRoleDisplayName = function(roleKey) {
  const roleLabels = {
    'super_admin': 'Super Admin',
    'admin': 'Admin',
    'sales_manager': 'Sales Manager',
    'sales_executive': 'Sales Executive',
    'supply_manager': 'Supply Manager',
    'supply_sales_service_manager': 'Supply Sales Service Manager',
    'finance_manager': 'Finance Manager',
    'finance_executive': 'Finance Executive',
    'viewer': 'Viewer'
  };

  return roleLabels[roleKey] || roleKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Get available roles for current user
window.getAvailableRoles = function() {
  const currentUserRole = window.user?.role;
  
  // Super admin can assign any role
  if (currentUserRole === 'super_admin') {
    return Object.keys(window.USER_ROLES || {});
  }
  
  // Admin can assign roles below admin level
  if (currentUserRole === 'admin') {
    return ['sales_manager', 'sales_executive', 'supply_manager', 'supply_sales_service_manager', 'finance_manager', 'finance_executive', 'viewer'];
  }
  
  // Other roles cannot create users (but this should be handled by permissions)
  return ['viewer'];
};

// User status management
window.toggleUserStatus = async function(userId, currentStatus) {
  if (!window.hasPermission('users', 'write')) {
    alert('You do not have permission to change user status');
    return;
  }

  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  
  if (!confirm(`Change user status to ${newStatus}?`)) {
    return;
  }

  try {
    window.setLoading(true);
    
    const response = await window.apicall(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });

    if (response.error) {
      throw new Error(response.error);
    }

    // Update user in local state
    window.setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ));

    window.showNotification(`User status changed to ${newStatus}`, 'success');
  } catch (error) {
    console.error('Error changing user status:', error);
    window.showNotification(error.message || 'Failed to change user status', 'error');
  } finally {
    window.setLoading(false);
  }
};

// Reset user password
window.resetUserPassword = async function(userId, userName) {
  if (!window.hasPermission('users', 'write')) {
    alert('You do not have permission to reset passwords');
    return;
  }

  const newPassword = prompt(`Enter new password for ${userName}:`);
  if (!newPassword || newPassword.length < 6) {
    alert('Password must be at least 6 characters long');
    return;
  }

  if (!confirm(`Reset password for ${userName}?`)) {
    return;
  }

  try {
    window.setLoading(true);
    
    const response = await window.apicall(`/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ new_password: newPassword })
    });

    if (response.error) {
      throw new Error(response.error);
    }

    window.showNotification('Password reset successfully', 'success');
  } catch (error) {
    console.error('Error resetting password:', error);
    window.showNotification(error.message || 'Failed to reset password', 'error');
  } finally {
    window.setLoading(false);
  }
};

// Bulk user operations
window.bulkUpdateUsers = async function(userIds, updateData) {
  if (!window.hasPermission('users', 'write')) {
    alert('You do not have permission to update users');
    return;
  }

  if (!confirm(`Update ${userIds.length} users?`)) {
    return;
  }

  window.setLoading(true);
  let successCount = 0;
  let errorCount = 0;

  try {
    for (const userId of userIds) {
      try {
        const response = await window.apicall(`/users/${userId}`, {
          method: 'PUT',
          body: JSON.stringify(updateData)
        });

        if (response.error) {
          errorCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        console.error(`Error updating user ${userId}:`, error);
        errorCount++;
      }
    }

    alert(`Bulk update completed!\n✅ ${successCount} users updated\n❌ ${errorCount} failed`);
    
    // Refresh users list
    await window.fetchUsers();
  } catch (error) {
    console.error('Bulk update error:', error);
    alert('Error during bulk update: ' + error.message);
  } finally {
    window.setLoading(false);
  }
};

// Get user statistics
window.getUserStatistics = function(users) {
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    byRole: {}
  };

  // Count by role
  users.forEach(user => {
    const role = user.role || 'unknown';
    stats.byRole[role] = (stats.byRole[role] || 0) + 1;
  });

  return stats;
};

// Search and filter users
window.filterUsers = function(users, searchQuery, roleFilter, statusFilter) {
  let filtered = [...users];

  // Search by name or email
  if (searchQuery && searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(user => 
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  }

  // Filter by role
  if (roleFilter && roleFilter !== 'all') {
    filtered = filtered.filter(user => user.role === roleFilter);
  }

  // Filter by status
  if (statusFilter && statusFilter !== 'all') {
    filtered = filtered.filter(user => user.status === statusFilter);
  }

  return filtered;
};

// Export users data
window.exportUsersData = function(users, format = 'csv') {
  if (format === 'csv') {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Header
    csvContent += "Name,Email,Role,Status,Created Date\n";
    
    // Data rows
    users.forEach(user => {
      csvContent += `"${user.name}","${user.email}","${window.getRoleDisplayName(user.role)}","${user.status}","${user.created_date || 'N/A'}"\n`;
    });

    // Download file
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Check if user can be deleted
window.canDeleteUser = function(userId) {
  // Cannot delete current user
  if (userId === window.user?.id) {
    return { canDelete: false, reason: 'Cannot delete your own account' };
  }

  // Only super admin can delete admin users
  const userToDelete = window.users?.find(u => u.id === userId);
  if (userToDelete?.role === 'admin' && window.user?.role !== 'super_admin') {
    return { canDelete: false, reason: 'Only super admin can delete admin users' };
  }

  return { canDelete: true };
};

// Initialize user management system
window.initializeUserManagement = function() {
  console.log('Initializing user management system...');
  
  // Fetch users if user has permission
  if (window.hasPermission('users', 'read')) {
    window.fetchUsers();
  }
};

console.log('✅ User Management Functions component loaded successfully');
