const express = require('express');
const router = express.Router();
const Role = require('../models/Role');
const { authenticateToken } = require('../middleware/auth');

// Middleware to check if user can manage roles
const canManageRoles = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can manage roles' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET all roles
router.get('/', authenticateToken, async (req, res) => {
  try {
    const roles = await Role.getAll();
    res.json({ data: roles });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single role
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const role = await Role.getById(req.params.id);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.json({ data: role });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create role (super admin only)
router.post('/', authenticateToken, canManageRoles, async (req, res) => {
  try {
    const role = new Role(req.body);
    const savedRole = await role.save();
    res.status(201).json({ data: savedRole });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update role (super admin only)
router.put('/:id', authenticateToken, canManageRoles, async (req, res) => {
  try {
    const updatedRole = await Role.update(req.params.id, req.body);
    res.json({ data: updatedRole });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE role (super admin only)
router.delete('/:id', authenticateToken, canManageRoles, async (req, res) => {
  try {
    await Role.delete(req.params.id);
    res.json({ data: { message: 'Role deleted successfully' } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize default roles
router.post('/initialize', authenticateToken, canManageRoles, async (req, res) => {
  try {
    await Role.initializeDefaultRoles();
    res.json({ data: { message: 'Default roles initialized successfully' } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
