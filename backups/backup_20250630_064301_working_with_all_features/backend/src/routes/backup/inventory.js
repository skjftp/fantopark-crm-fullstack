const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const { authenticateToken } = require('../middleware/auth');

// GET all inventory
router.get('/', authenticateToken, async (req, res) => {
  try {
    const inventory = await Inventory.getAll();
    res.json({ data: inventory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single inventory item
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Inventory.getById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.json({ data: item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create inventory
router.post('/', authenticateToken, async (req, res) => {
  try {
    const inventory = new Inventory(req.body);
    const saved = await inventory.save();
    res.status(201).json({ data: saved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update inventory
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updated = await Inventory.update(req.params.id, req.body);
    res.json({ data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST allocate inventory
router.post('/:id/allocate', authenticateToken, async (req, res) => {
  try {
    const result = await Inventory.allocate(req.params.id, req.body);
    res.json({ data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE inventory
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await Inventory.delete(req.params.id);
    res.json({ data: { message: 'Inventory deleted successfully' } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
