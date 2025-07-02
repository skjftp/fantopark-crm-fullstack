const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// GET all users (admin only)
router.get('/', authenticateToken, authorizeRoles('admin', 'super_admin'), async (req, res) => {
  try {
    const snapshot = await db.collection(collections.users).get();
    const users = [];
    snapshot.forEach(doc => {
      const userData = doc.data();
      delete userData.password; // Remove password from response
      users.push({ id: doc.id, ...userData });
    });
    res.json({ data: users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create user (admin only)
router.post('/', authenticateToken, authorizeRoles('admin', 'super_admin'), async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    
    // Check if user already exists
    const existing = await db.collection(collections.users)
      .where('email', '==', email)
      .get();
    
    if (!existing.empty) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const userData = {
      email,
      password: hashedPassword,
      name,
      role,
      created_date: new Date().toISOString()
    };
    
    const docRef = await db.collection(collections.users).add(userData);
    delete userData.password; // Don't return password
    res.status(201).json({ data: { id: docRef.id, ...userData } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
