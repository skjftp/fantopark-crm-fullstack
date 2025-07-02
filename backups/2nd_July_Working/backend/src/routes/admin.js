const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const { authenticateToken, checkPermission } = require('../middleware/auth');

const db = admin.firestore();

// Admin health check
router.get('/health', authenticateToken, checkPermission('admin', 'read'), async (req, res) => {
    res.json({ status: 'OK', admin: true });
});

module.exports = router;
