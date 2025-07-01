const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const { authenticateToken } = require('../middleware/auth');

// GET all leads
router.get('/', authenticateToken, async (req, res) => {
  try {
    const leads = await Lead.getAll(req.query);
    res.json({ data: leads });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single lead
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const lead = await Lead.getById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json({ data: lead });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create lead
router.post('/', authenticateToken, async (req, res) => {
  try {
    const lead = new Lead(req.body);
    const savedLead = await lead.save();
    res.status(201).json({ data: savedLead });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update lead
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updatedLead = await Lead.update(req.params.id, req.body);
    res.json({ data: updatedLead });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE lead
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await Lead.delete(req.params.id);
    res.json({ data: { message: 'Lead deleted successfully' } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// DELETE all leads (bulk delete for test mode)
router.delete('/', authenticateToken, async (req, res) => {
  try {
    console.log('DELETE /leads - Bulk delete request');
    console.log('Headers:', req.headers);
    console.log('User:', req.user);
    
    // Check if user is super_admin
    if (!req.user || req.user.role !== 'super_admin') {
      console.log('Access denied - not super_admin');
      return res.status(403).json({ error: 'Only super admins can perform bulk delete' });
    }
    
    // Check headers (case-insensitive)
    const deleteAll = req.headers['x-delete-all'] || req.headers['X-Delete-All'];
    const testMode = req.headers['x-test-mode'] || req.headers['X-Test-Mode'];
    
    if (deleteAll !== 'true' || testMode !== 'true') {
      console.log('Missing required headers');
      return res.status(403).json({ error: 'Bulk delete requires test mode headers' });
    }
    
    console.log('Authorized - proceeding with bulk delete');
    
    // Get all leads
    const snapshot = await db.collection(collections.leads).get();
    
    if (snapshot.empty) {
      console.log('No leads to delete');
      return res.json({ message: 'No leads to delete', count: 0 });
    }
    
    // Delete in batches of 500 (Firestore limit)
    const batchSize = 500;
    let deleted = 0;
    
    while (deleted < snapshot.size) {
      const batch = db.batch();
      const currentBatch = snapshot.docs.slice(deleted, deleted + batchSize);
      
      currentBatch.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      deleted += currentBatch.length;
      console.log(`Deleted batch: ${currentBatch.length} docs (total: ${deleted})`);
    }
    
    console.log(`Successfully deleted ${deleted} leads`);
    res.json({ 
      message: `Successfully deleted ${deleted} leads`,
      count: deleted 
    });
    
  } catch (error) {
    console.error('Bulk delete leads error:', error);
    res.status(500).json({ 
      error: 'Failed to delete leads', 
      details: error.message 
    });
  }
});

module.exports = router;
