// User Roles and Permissions Configuration
window.USER_ROLES = {
  super_admin: {
    label: 'Super Admin',
    permissions: {
      dashboard: { read: true, write: true, delete: true, manage_users: true },
      leads: { read: true, write: true, delete: true, assign: true, progress: true },
      inventory: { read: true, write: true, delete: true, allocate: true },
      orders: { read: true, write: true, delete: true, approve: true, assign: true },
      finance: { read: true, write: true, delete: true, approve: true },
      delivery: { read: true, write: true, delete: true },
      users: { read: true, write: true, delete: true, manage_roles: true },
      stadiums: { read: true, write: true, delete: true },
    }
  },
  admin: {
    label: 'Admin',
    permissions: {
      dashboard: { read: true, write: true, delete: true, manage_users: false },
      leads: { read: true, write: true, delete: true, assign: true, progress: true },
      inventory: { read: true, write: true, delete: true, allocate: true },
      orders: { read: true, write: true, delete: true, approve: false, assign: true },
      finance: { read: true, write: false, delete: false, approve: false },
      delivery: { read: true, write: true, delete: true },
      users: { read: true, write: false, delete: false, manage_roles: false },
      stadiums: { read: true, write: true, delete: true },
    }
  },
  sales_manager: {
    label: 'Sales Manager',
    permissions: {
      dashboard: { read: true, write: false, delete: false, manage_users: false },
      leads: { read: true, write: true, delete: false, assign: true, progress: true },
      inventory: { read: true, write: false, delete: false, allocate: false },
      orders: { read: true, write: false, delete: false, approve: false, assign: false },
      finance: { read: true, write: false, delete: false, approve: false },
      delivery: { read: true, write: false, delete: false },
      users: { read: false, write: false, delete: false, manage_roles: false }
    }
  },
  sales_executive: {
    label: 'Sales Executive',
    permissions: {
      dashboard: { read: true, write: false, delete: false, manage_users: false },
      leads: { read: true, write: true, delete: true, assign: false, progress: true },
      inventory: { read: true, write: false, delete: false, allocate: false },
      orders: { read: true, write: true, delete: false, approve: false, assign: false },
      finance: { read: false, write: false, delete: false, approve: false },
      delivery: { read: true, write: false, delete: false },
      users: { read: false, write: false, delete: false, manage_roles: false }
    }
  },
  supply_sales_service_manager: {
    label: 'Supply Sales Service Manager',
    permissions: {
      dashboard: { read: true, write: true, delete: true, manage_users: false },
      leads: { read: true, write: true, delete: true, assign: true, progress: true },
      inventory: { read: true, write: true, delete: true, allocate: true },
      orders: { read: true, write: true, delete: true, approve: true, assign: true },
      finance: { read: true, write: true, delete: true, approve: true },
      delivery: { read: true, write: true, delete: true },
      stadiums: { read: true, write: true, delete: true },
      users: { read: false, write: false, delete: false, manage_roles: false }
    }
  },
  finance_manager: {
    label: 'Finance Manager',
    permissions: {
      dashboard: { read: true, write: false, delete: false, manage_users: false },
      leads: { read: true, write: false, delete: false, assign: false, progress: false },
      inventory: { read: true, write: false, delete: false, allocate: false },
      orders: { read: true, write: false, delete: false, approve: true, assign: false },
      finance: { read: true, write: true, delete: true, approve: true },
      delivery: { read: true, write: false, delete: false },
      users: { read: false, write: false, delete: false, manage_roles: false }
    }
  },
  viewer: {
    label: 'Viewer',
    permissions: {
      dashboard: { read: true, write: false, delete: false, manage_users: false },
      leads: { read: true, write: false, delete: false, assign: false, progress: false },
      inventory: { read: true, write: false, delete: false, allocate: false },
      orders: { read: true, write: false, delete: false, approve: false, assign: false },
      finance: { read: true, write: false, delete: false, approve: false },
      delivery: { read: true, write: false, delete: false },
      users: { read: false, write: false, delete: false, manage_roles: false }
    }
  }
};

console.log('✅ User roles and permissions loaded');
