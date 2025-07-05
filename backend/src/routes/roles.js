const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const { authenticateToken, checkPermission } = require('../middleware/auth');

const db = admin.firestore();

// Get all roles
router.get('/', authenticateToken, checkPermission('users', 'manage_roles'), async (req, res) => {
    try {
        const snapshot = await db.collection('crm_roles').get();
        const roles = [];
        
        snapshot.forEach(doc => {
            roles.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        res.json({ data: roles });
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
});

// CREATE new role
router.post('/', authenticateToken, checkPermission('users', 'manage_roles'), async (req, res) => {
    try {
        const { name, label, description, permissions } = req.body;
        console.log('POST request to create role:', { name, label });
        
        // Validate required fields
        if (!name || !label) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                details: 'Role name and label are required'
            });
        }
        
        // Check if role name already exists
        const existingRole = await db.collection('crm_roles')
            .where('name', '==', name)
            .limit(1)
            .get();
        
        if (!existingRole.empty) {
            return res.status(400).json({ 
                error: 'Role name already exists',
                details: `A role with name "${name}" already exists`
            });
        }
        
        // Create the new role
        const newRole = {
            name: name.trim(),
            label: label.trim(),
            description: description ? description.trim() : '',
            permissions: permissions || {},
            is_system: false, // Custom roles are not system roles
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString()
        };
        
        // Add to database
        const docRef = await db.collection('crm_roles').add(newRole);
        console.log(`Role created successfully: ${docRef.id}`);
        
        // Return the created role with ID
        const createdRole = {
            id: docRef.id,
            ...newRole
        };
        
        res.status(201).json({ 
            success: true,
            message: 'Role created successfully',
            data: createdRole
        });
        
    } catch (error) {
        console.error('POST role error:', error);
        res.status(500).json({ 
            error: 'Failed to create role',
            details: error.message 
        });
    }
});

// UPDATE existing role
router.put('/:id', authenticateToken, checkPermission('users', 'manage_roles'), async (req, res) => {
    try {
        const roleId = req.params.id;
        const { name, label, description, permissions } = req.body;
        console.log('PUT request to update role:', roleId, { name, label });
        
        // Check if role exists
        const roleDoc = await db.collection('crm_roles').doc(roleId).get();
        if (!roleDoc.exists) {
            console.log(`Role not found: ${roleId}`);
            return res.status(404).json({ error: 'Role not found' });
        }
        
        const existingRoleData = roleDoc.data();
        
        // Prevent editing system roles (except by super_admin)
        if (existingRoleData.is_system && req.user.role !== 'super_admin') {
            console.log(`Non-super_admin attempting to edit system role: ${existingRoleData.name}`);
            return res.status(403).json({ 
                error: 'Only super admins can edit system roles',
                details: `Role "${existingRoleData.label}" is a system role`
            });
        }
        
        // Validate required fields
        if (!name || !label) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                details: 'Role name and label are required'
            });
        }
        
        // Check if new name conflicts with existing role (except current role)
        if (name !== existingRoleData.name) {
            const conflictingRole = await db.collection('crm_roles')
                .where('name', '==', name)
                .limit(1)
                .get();
            
            if (!conflictingRole.empty) {
                const conflictDoc = conflictingRole.docs[0];
                if (conflictDoc.id !== roleId) {
                    return res.status(400).json({ 
                        error: 'Role name already exists',
                        details: `A role with name "${name}" already exists`
                    });
                }
            }
        }
        
        // Prepare updated role data
        const updatedRole = {
            name: name.trim(),
            label: label.trim(),
            description: description ? description.trim() : '',
            permissions: permissions || {},
            updated_date: new Date().toISOString(),
            // Preserve original fields
            is_system: existingRoleData.is_system,
            created_date: existingRoleData.created_date
        };
        
        // Update the role in database
        await db.collection('crm_roles').doc(roleId).update(updatedRole);
        console.log(`Role updated successfully: ${roleId}`);
        
        // If role name changed, update all users with this role
        if (name !== existingRoleData.name) {
            console.log(`Role name changed from ${existingRoleData.name} to ${name}, updating users...`);
            
            const usersSnapshot = await db.collection('crm_users')
                .where('role', '==', existingRoleData.name)
                .get();
            
            if (!usersSnapshot.empty) {
                const userBatch = db.batch();
                let updatedUserCount = 0;
                
                usersSnapshot.forEach(userDoc => {
                    userBatch.update(userDoc.ref, {
                        role: name,
                        updated_date: new Date().toISOString()
                    });
                    updatedUserCount++;
                });
                
                await userBatch.commit();
                console.log(`Updated ${updatedUserCount} users with new role name`);
            }
        }
        
        // Return the updated role with ID
        const responseRole = {
            id: roleId,
            ...updatedRole
        };
        
        res.json({ 
            success: true,
            message: 'Role updated successfully',
            data: responseRole
        });
        
    } catch (error) {
        console.error('PUT role error:', error);
        res.status(500).json({ 
            error: 'Failed to update role',
            details: error.message 
        });
    }
});

// DELETE role by ID
router.delete('/:id', authenticateToken, checkPermission('users', 'manage_roles'), async (req, res) => {
    try {
        const roleId = req.params.id;
        console.log(`DELETE request for role: ${roleId}`);
        
        // Check if role exists
        const roleDoc = await db.collection('crm_roles').doc(roleId).get();
        if (!roleDoc.exists) {
            console.log(`Role not found: ${roleId}`);
            return res.status(404).json({ error: 'Role not found' });
        }
        
        const roleData = roleDoc.data();
        console.log(`Role data:`, roleData);
        
        // Check if any users have this role
        const usersSnapshot = await db.collection('crm_users')
            .where('role', '==', roleData.name)
            .limit(1)
            .get();
        
        if (!usersSnapshot.empty) {
            console.log(`Cannot delete role ${roleData.name} - users are assigned to it`);
            return res.status(400).json({ 
                error: 'Cannot delete role that is assigned to users',
                details: `Role "${roleData.label}" is currently assigned to one or more users`
            });
        }
        
        // Allow deletion of system roles only for super_admin (for cleanup purposes)
        if (roleData.is_system && req.user.role !== 'super_admin') {
            console.log(`Non-super_admin attempting to delete system role: ${roleData.name}`);
            return res.status(403).json({ 
                error: 'Only super admins can delete system roles',
                details: `Role "${roleData.label}" is a system role`
            });
        }
        
        // Delete the role
        await db.collection('crm_roles').doc(roleId).delete();
        console.log(`Role deleted successfully: ${roleId}`);
        
        res.json({ 
            success: true,
            message: 'Role deleted successfully',
            deleted_role: {
                id: roleId,
                name: roleData.name,
                label: roleData.label
            }
        });
        
    } catch (error) {
        console.error('DELETE role error:', error);
        res.status(500).json({ 
            error: 'Failed to delete role',
            details: error.message 
        });
    }
});

// Initialize default roles
router.post('/initialize', authenticateToken, checkPermission('users', 'manage_roles'), async (req, res) => {
    try {
        const defaultRoles = [
            {
                name: 'super_admin',
                label: 'Super Admin',
                description: 'Full system access',
                permissions: {
                    dashboard: { read: true, write: true, delete: true },
                    leads: { read: true, write: true, delete: true },
                    inventory: { read: true, write: true, delete: true },
                    orders: { read: true, write: true, delete: true },
                    finance: { read: true, write: true, delete: true },
                    delivery: { read: true, write: true, delete: true },
                    users: { read: true, write: true, delete: true, manage_roles: true }
                },
                is_system: true
            },
            {
                name: 'admin',
                label: 'Admin',
                description: 'Administrative access without role management',
                permissions: {
                    dashboard: { read: true, write: true, delete: true },
                    leads: { read: true, write: true, delete: true },
                    inventory: { read: true, write: true, delete: true },
                    orders: { read: true, write: true, delete: true },
                    finance: { read: true, write: true, delete: true },
                    delivery: { read: true, write: true, delete: true },
                    users: { read: true, write: true, delete: true, manage_roles: false }
                },
                is_system: true
            },
            {
                name: 'sales_manager',
                label: 'Sales Manager',
                description: 'Manages sales team and leads',
                permissions: {
                    dashboard: { read: true },
                    leads: { read: true, write: true, delete: true, assign: true },
                    inventory: { read: true },
                    orders: { read: true, write: true },
                    finance: { read: false },
                    delivery: { read: true },
                    users: { read: true }
                },
                is_system: true
            },
            {
                name: 'sales_executive',
                label: 'Sales Executive',
                description: 'Creates and manages leads',
                permissions: {
                    dashboard: { read: true },
                    leads: { read: true, write: true, progress: true },
                    inventory: { read: true },
                    orders: { read: true, write: true },
                    finance: { read: false },
                    delivery: { read: true },
                    users: { read: false }
                },
                is_system: true
            },
            {
                name: 'supply_sales_service_manager',
                label: 'Supply Sales Service Manager',
                description: 'Manages inventory and deliveries',
                permissions: {
                    dashboard: { read: true },
                    leads: { read: true },
                    inventory: { read: true, write: true, delete: true, allocate: true },
                    orders: { read: true },
                    finance: { read: false },
                    delivery: { read: true, write: true, delete: true },
                    users: { read: false }
                },
                is_system: true
            },
            {
                name: 'supply_service_manager',
                label: 'Supply & Service Manager',
                description: 'Manages supply chain and service operations',
                permissions: {
                    dashboard: { read: true, write: true, delete: true, manage_users: false },
                    leads: { read: true, write: true, delete: true, assign: true, progress: true },
                    inventory: { read: true, write: true, delete: true, allocate: true },
                    orders: { read: true, write: true, delete: true, approve: true, assign: true },
                    finance: { read: true, write: true, delete: true, approve: true },
                    delivery: { read: true, write: true, delete: true },
                    users: { read: true, write: true, delete: false, manage_roles: false }
                },
                is_system: true
            },
            {
                name: 'finance_manager',
                label: 'Finance Manager',
                description: 'Manages financial operations',
                permissions: {
                    dashboard: { read: true },
                    leads: { read: true },
                    inventory: { read: true },
                    orders: { read: true, approve: true },
                    finance: { read: true, write: true, delete: true, approve: true },
                    delivery: { read: true },
                    users: { read: false }
                },
                is_system: true
            },
            {
                name: 'viewer',
                label: 'Viewer',
                description: 'Read-only access',
                permissions: {
                    dashboard: { read: true },
                    leads: { read: true },
                    inventory: { read: true },
                    orders: { read: true },
                    finance: { read: true },
                    delivery: { read: true },
                    users: { read: false }
                },
                is_system: true
            }
        ];

        const batch = db.batch();
        
        for (const role of defaultRoles) {
            const docRef = db.collection('crm_roles').doc(role.name);
            batch.set(docRef, {
                ...role,
                created_at: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        
        await batch.commit();
        
        res.json({ 
            success: true, 
            message: 'Default roles initialized successfully',
            data: defaultRoles
        });
    } catch (error) {
        console.error('Error initializing roles:', error);
        res.status(500).json({ error: 'Failed to initialize roles' });
    }
});

module.exports = router;
