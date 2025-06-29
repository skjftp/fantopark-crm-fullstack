const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db, collections } = require('../config/db');

router.get('/create-admin', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await db.collection(collections.users).doc('admin').set({
      id: 'admin',
      email: 'admin@fantopark.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'super_admin',
      department: 'Administration',
      status: 'active',
      created_date: new Date().toISOString()
    });
    
    res.json({ message: 'Admin user created successfully!' });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
