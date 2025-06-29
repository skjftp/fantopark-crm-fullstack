const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const { authenticateToken } = require('../middleware/auth');

// GET all leads
router.get('/', authenticateToken, async (req, res) => {
  try {
    const leads = await Lead.getAll();
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
    const saved = await lead.save();
    res.status(201).json({ data: saved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update lead
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updated = await Lead.update(req.params.id, req.body);
    res.json({ data: updated });
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

module.exports = router;
