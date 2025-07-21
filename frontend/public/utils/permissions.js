// Permission check function - exposed globally
window.hasPermission = (module, action) => {
  const user = window.appState?.user;
  if (user?.role === 'super_admin') return true;
  if (!user || !user.role) {
    console.log('No user or role found');
    return false;
  }

  // Get role permissions from USER_ROLES
  const rolePermissions = window.USER_ROLES[user.role]?.permissions;
  if (!rolePermissions) {
    console.log('No permissions found for role:', user.role);
    return false;
  }

  const modulePermissions = rolePermissions[module];
  if (!modulePermissions) {
    console.log('No permissions found for module:', module);
    return false;
  }

  const hasAccess = modulePermissions[action] === true;
  console.log(`Permission check: ${user.role} -> ${module}.${action} = ${hasAccess}`);
  return hasAccess;
};

// Keep local version for backward compatibility
const hasPermission = window.hasPermission;

const canAccessTab = (tabId) => {
  if (!user) return false;
  // My Actions is available to all logged-in users
  if (tabId === 'myactions') return true;
  // Reminders available to users who can read leads
  if (tabId === 'reminders') return hasPermission('leads', 'read');
  // Sports Calendar available to users who can read leads (for now, or adjust as needed)
  if (tabId === 'sports-calendar') return hasPermission('leads', 'read');
  
  // Sales Performance - grant access to specific roles
  if (tabId === 'sales-performance') {
    const allowedRoles = [
      'super_admin',
      'admin',
      'sales_manager',
      'supply_sales_service_manager', // Added this role
      'finance_manager'
    ];
    return allowedRoles.includes(user.role);
  }
  
  return hasPermission(tabId, 'read');
};

// Helper function to get proper role display label
const getRoleDisplayLabel = (roleName) => {
// Map of role names to display labels
const roleLabels = {
'super_admin': 'Super Admin',
'admin': 'Admin', 
'sales_manager': 'Sales Manager',
'sales_executive': 'Sales Executive',
'supply_manager': 'Supply Manager', // Legacy
'supply_sales_service_manager': 'Supply Sales Service Manager', // Updated
'finance_manager': 'Finance Manager',
'viewer': 'Viewer'
};
return roleLabels[roleName] || roleName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};
