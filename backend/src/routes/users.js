const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db, collections } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET all users
router.get('/', authenticateToken, async (req, res) => {
  try {
    const snapshot = await db.collection(collections.users).get();
    const users = [];
    snapshot.forEach(doc => {
      const userData = { id: doc.id, ...doc.data() };
      delete userData.password; // Don't send passwords
      users.push(userData);
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create user
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { email, password, name, role, department, status } = req.body;
    
    // Check if user already exists
    const existing = await db.collection(collections.users)
      .where('email', '==', email)
      .get();
    
    if (!existing.empty) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const userData = {
      email,
      password: hashedPassword,
      name,
      role: role || 'sales_executive',
      department: department || 'sales',
      status: status || 'active',
      created_date: new Date().toISOString()
    };
    
    const docRef = await db.collection(collections.users).add(userData);
    
    // Return user without password
    delete userData.password;
    res.status(201).json({ id: docRef.id, ...userData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update user
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updates = { ...req.body };
    
    // If password is being updated, hash it
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    
    updates.updated_date = new Date().toISOString();
    
    await db.collection(collections.users).doc(req.params.id).update(updates);
    
    // Return updated user without password
    delete updates.password;
    res.json({ id: req.params.id, ...updates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE user
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.collection(collections.users).doc(req.params.id).delete();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
