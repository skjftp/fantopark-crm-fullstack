const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Role = require('../models/Role');

// Get all roles
router.get('/', auth, async (req, res) => {
  try {
    const roles = await Role.getAll();
    res.json({ data: roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single role
router.get('/:id', auth, async (req, res) => {
  try {
    const role = await Role.getById(req.params.id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.json({ data: role });
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({ error: error.message });
  }
});

// Initialize default roles
router.post('/initialize', auth, async (req, res) => {
  try {
    // Check if user is super_admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can initialize roles' });
    }

    // Initialize default roles
    await Role.initializeDefaults();
    
    // Fetch all roles to return
    const roles = await Role.getAll();
    
    res.json({
      message: 'Default roles initialized successfully',
      data: roles
    });
  } catch (error) {
    console.error('Error initializing roles:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new role
router.post('/', auth, async (req, res) => {
  try {
    // Check if user is super_admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can create roles' });
    }

    const { name, label, description, permissions } = req.body;

    // Validate required fields
    if (!name || !label || !permissions) {
      return res.status(400).json({ error: 'Name, label, and permissions are required' });
    }

    // Check if role already exists
    const existing = await Role.getByName(name);
    if (existing) {
      return res.status(400).json({ error: 'Role with this name already exists' });
    }

    // Create the role
    const role = new Role({
      name,
      label,
      description,
      permissions,
      is_system: false
    });

    await role.save();
    
    res.json({ 
      message: 'Role created successfully',
      data: role.toJSON()
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update role
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if user is super_admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can update roles' });
    }

    const role = await Role.getById(req.params.id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Prevent modification of system roles (except description and label)
    const { label, description, permissions } = req.body;
    
    if (role.is_system && permissions) {
      // For system roles, only allow updating label and description
      role.label = label || role.label;
      role.description = description || role.description;
    } else {
      // For custom roles, allow all updates
      role.label = label || role.label;
      role.description = description || role.description;
      if (permissions) {
        role.permissions = permissions;
      }
    }

    await role.save();
    
    res.json({ 
      message: 'Role updated successfully',
      data: role.toJSON()
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete role
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is super_admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can delete roles' });
    }

    const role = await Role.getById(req.params.id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Prevent deletion of system roles
    if (role.is_system) {
      return res.status(400).json({ error: 'Cannot delete system roles' });
    }

    // Check if any users have this role
    const User = require('../models/User');
    const usersWithRole = await User.find({ role: role.name });
    if (usersWithRole.length > 0) {
      return res.status(400).json({ 
        error: `Cannot delete role. ${usersWithRole.length} users are assigned to this role.` 
      });
    }

    await role.delete();
    
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
