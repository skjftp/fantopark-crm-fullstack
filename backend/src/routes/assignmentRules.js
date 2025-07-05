const express = require('express');
const router = express.Router();
const AssignmentRule = require('../models/AssignmentRule');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// GET all assignment rules
router.get('/', authenticateToken, checkPermission('leads', 'read'), async (req, res) => {
  try {
    const rules = await AssignmentRule.getAll();
    console.log(`Found ${rules.length} assignment rules`);
    res.json({ data: rules });
  } catch (error) {
    console.error('Error fetching assignment rules:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET active assignment rules only
router.get('/active', authenticateToken, checkPermission('leads', 'read'), async (req, res) => {
  try {
    const rules = await AssignmentRule.getActiveRules();
    console.log(`Found ${rules.length} active assignment rules`);
    res.json({ data: rules });
  } catch (error) {
    console.error('Error fetching active assignment rules:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST create assignment rule
router.post('/', authenticateToken, checkPermission('leads', 'assign'), async (req, res) => {
  try {
    const ruleData = {
      ...req.body,
      created_by: req.user.email
    };
    
    const rule = new AssignmentRule(ruleData);
    const savedRule = await rule.save();
    
    console.log('Assignment rule created:', savedRule.id, savedRule.name);
    res.status(201).json({ data: savedRule });
  } catch (error) {
    console.error('Error creating assignment rule:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update assignment rule
router.put('/:id', authenticateToken, checkPermission('leads', 'assign'), async (req, res) => {
  try {
    const ruleId = req.params.id;
    const updatedRule = await AssignmentRule.update(ruleId, req.body);
    
    console.log('Assignment rule updated:', ruleId);
    res.json({ data: updatedRule });
  } catch (error) {
    console.error('Error updating assignment rule:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE assignment rule
router.delete('/:id', authenticateToken, checkPermission('leads', 'delete'), async (req, res) => {
  try {
    const ruleId = req.params.id;
    await AssignmentRule.delete(ruleId);
    
    console.log('Assignment rule deleted:', ruleId);
    res.json({ success: true, message: 'Assignment rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment rule:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST test assignment for a lead (preview who would be assigned)
router.post('/test', authenticateToken, checkPermission('leads', 'assign'), async (req, res) => {
  try {
    const leadData = req.body;
    const assignment = await AssignmentRule.evaluateLeadAssignment(leadData);
    
    res.json({ 
      data: assignment,
      message: assignment.assigned_to ? 
        `Would assign to: ${assignment.assigned_to}` : 
        'No assignment could be determined'
    });
  } catch (error) {
    console.error('Error testing assignment:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET assignment statistics
router.get('/stats', authenticateToken, checkPermission('leads', 'read'), async (req, res) => {
  try {
    const rules = await AssignmentRule.getAll();
    
    const stats = {
      total_rules: rules.length,
      active_rules: rules.filter(r => r.active).length,
      inactive_rules: rules.filter(r => !r.active).length,
      total_usage: rules.reduce((sum, r) => sum + (r.usage_count || 0), 0),
      most_used_rule: rules.reduce((max, r) => 
        (r.usage_count || 0) > (max.usage_count || 0) ? r : max, {}
      )
    };
    
    res.json({ data: stats });
  } catch (error) {
    console.error('Error getting assignment stats:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
