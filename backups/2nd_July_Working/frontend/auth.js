const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, collections } = require('../config/db');

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const userSnapshot = await db.collection(collections.users)
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (userSnapshot.empty) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    let userData;
    let userId;
    userSnapshot.forEach(doc => {
      userData = doc.data();
      userId = doc.id;
    });
    
    // Verify password
    const validPassword = await bcrypt.compare(password, userData.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { 
        id: userId, 
        email: userData.email, 
        role: userData.role,
        name: userData.name 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Remove password from response
    delete userData.password;
    
    res.json({ 
      data: {
        token,
        user: { id: userId, ...userData }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
