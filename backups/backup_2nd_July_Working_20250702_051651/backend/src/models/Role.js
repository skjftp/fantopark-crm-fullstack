const { db, collections } = require('../config/db');

class Role {
  constructor(data) {
    this.name = data.name; // e.g., 'sales_manager'
    this.label = data.label; // e.g., 'Sales Manager'
    this.description = data.description || '';
    this.permissions = data.permissions || {};
    this.is_system = data.is_system || false; // true for default roles that can't be deleted
    this.created_date = data.created_date || new Date().toISOString();
    this.updated_date = new Date().toISOString();
  }

  static async getAll() {
    const snapshot = await db.collection(collections.roles).orderBy('label').get();
    const roles = [];
    snapshot.forEach(doc => {
      roles.push({ id: doc.id, ...doc.data() });
    });
    return roles;
  }

  static async getById(id) {
    const doc = await db.collection(collections.roles).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  static async getByName(name) {
    const snapshot = await db.collection(collections.roles)
      .where('name', '==', name)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  async save() {
    // Check if role name already exists
    const existing = await Role.getByName(this.name);
    if (existing) {
      throw new Error('Role name already exists');
    }
    
    const docRef = await db.collection(collections.roles).add({...this});
    return { id: docRef.id, ...this };
  }

  static async update(id, data) {
    // Don't allow updating system roles' name or deleting them
    const existingRole = await Role.getById(id);
    if (existingRole.is_system && data.name && data.name !== existingRole.name) {
      throw new Error('Cannot change name of system role');
    }
    
    const updateData = { ...data, updated_date: new Date().toISOString() };
    await db.collection(collections.roles).doc(id).update(updateData);
    return await Role.getById(id);
  }

  static async delete(id) {
    const role = await Role.getById(id);
    if (role.is_system) {
      throw new Error('Cannot delete system role');
    }
    
    // Check if any users have this role
    const usersSnapshot = await db.collection(collections.users)
      .where('role', '==', role.name)
      .limit(1)
      .get();
    
    if (!usersSnapshot.empty) {
      throw new Error('Cannot delete role that is assigned to users');
    }
    
    await db.collection(collections.roles).doc(id).delete();
    return { success: true };
  }

  // Initialize default roles if they don't exist
  static async initializeDefaultRoles() {
    const defaultRoles = [
      {
        name: 'super_admin',
        label: 'Super Admin',
        description: 'Full system access with user and role management',
        is_system: true,
        permissions: {
          dashboard: { read: true, write: true, delete: true, manage_users: true },
          leads: { read: true, write: true, delete: true, assign: true, progress: true },
          inventory: { read: true, write: true, delete: true, allocate: true },
          orders: { read: true, write: true, delete: true, approve: true, assign: true },
          finance: { read: true, write: true, delete: true, approve: true },
          delivery: { read: true, write: true, delete: true },
          users: { read: true, write: true, delete: true, manage_roles: true }
        }
      },
      {
        name: 'admin',
        label: 'Admin',
        description: 'Full business operations access without role management',
        is_system: true,
        permissions: {
          dashboard: { read: true, write: true, delete: true, manage_users: false },
          leads: { read: true, write: true, delete: true, assign: true, progress: true },
          inventory: { read: true, write: true, delete: true, allocate: true },
          orders: { read: true, write: true, delete: true, approve: false, assign: true },
          finance: { read: true, write: false, delete: false, approve: false },
          delivery: { read: true, write: true, delete: true },
          users: { read: true, write: false, delete: false, manage_roles: false }
        }
      },
      {
        name: 'sales_manager',
        label: 'Sales Manager',
        description: 'Manage leads and sales team',
        is_system: true,
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
      {
        name: 'sales_executive',
        label: 'Sales Executive',
        description: 'Create and manage leads and orders',
        is_system: true,
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
      {
        name: 'supply_manager',
        label: 'Supply Manager',
        description: 'Manage inventory and deliveries',
        is_system: true,
        permissions: {
          dashboard: { read: true, write: false, delete: false, manage_users: false },
          leads: { read: true, write: false, delete: false, assign: false, progress: false },
          inventory: { read: true, write: true, delete: true, allocate: true },
          orders: { read: true, write: true, delete: false, approve: false, assign: false },
          finance: { read: true, write: false, delete: false, approve: false },
          delivery: { read: true, write: true, delete: false },
          users: { read: false, write: false, delete: false, manage_roles: false }
        }
      },
      {
        name: 'finance_manager',
        label: 'Finance Manager',
        description: 'Manage finances and approve payments',
        is_system: true,
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
      {
        name: 'viewer',
        label: 'Viewer',
        description: 'Read-only access to all modules',
        is_system: true,
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
    ];

    for (const roleData of defaultRoles) {
      try {
        const existing = await Role.getByName(roleData.name);
        if (!existing) {
          const role = new Role(roleData);
          await role.save();
          console.log(`Initialized default role: ${roleData.label}`);
        }
      } catch (error) {
        console.error(`Error initializing role ${roleData.name}:`, error.message);
      }
    }
  }
}

module.exports = Role;
