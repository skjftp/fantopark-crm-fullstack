const express = require('express');
const router = express.Router();
const AssignmentRule = require('../models/AssignmentRule');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// GET all assignment rules
router.get('/', authenticateToken, checkPermission('leads', 'read'), async (req, res) => {
  try {
    const rules = await AssignmentRule.getAll();
    res.json({ data: rules });
  } catch (error) {
    console.error('Error fetching assignment rules:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET active assignment rules only
router.get('/active', authenticateToken, checkPermission('leads', 'read'), async (req, res) => {
  try {
    const rules = await AssignmentRule.getActive();
    res.json({ data: rules });
  } catch (error) {
    console.error('Error fetching active assignment rules:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET assignment rule by ID
router.get('/:id', authenticateToken, checkPermission('leads', 'read'), async (req, res) => {
  try {
    const rule = await AssignmentRule.getById(req.params.id);
    if (!rule) {
      return res.status(404).json({ error: 'Assignment rule not found' });
    }
    res.json({ data: rule });
  } catch (error) {
    console.error('Error fetching assignment rule:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST create new assignment rule
router.post('/', authenticateToken, checkPermission('leads', 'assign'), async (req, res) => {
  try {
    const ruleData = {
      ...req.body,
      created_by: req.user.email
    };
    
    const rule = new AssignmentRule(ruleData);
    const savedRule = await rule.save();
    
    console.log('Assignment rule created:', savedRule.id);
    res.status(201).json({ data: savedRule });
  } catch (error) {
    console.error('Error creating assignment rule:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update assignment rule
router.put('/:id', authenticateToken, checkPermission('leads', 'assign'), async (req, res) => {
  try {
    const updatedRule = await AssignmentRule.update(req.params.id, req.body);
    if (!updatedRule) {
      return res.status(404).json({ error: 'Assignment rule not found' });
    }
    
    console.log('Assignment rule updated:', req.params.id);
    res.json({ data: updatedRule });
  } catch (error) {
    console.error('Error updating assignment rule:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE assignment rule
router.delete('/:id', authenticateToken, checkPermission('leads', 'assign'), async (req, res) => {
  try {
    const success = await AssignmentRule.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Assignment rule not found' });
    }
    
    console.log('Assignment rule deleted:', req.params.id);
    res.json({ message: 'Assignment rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment rule:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST test assignment rules with lead data
router.post('/test', authenticateToken, checkPermission('leads', 'read'), async (req, res) => {
  try {
    const leadData = req.body;
    console.log('Testing assignment rules with lead data:', leadData);
    
    const assignment = await AssignmentRule.testAssignment(leadData);
    
    if (assignment) {
      console.log('Assignment result:', assignment);
      res.json({ 
        success: true,
        assignment: assignment,
        message: `Lead would be assigned to ${assignment.assigned_to} via rule: ${assignment.rule_matched}`
      });
    } else {
      console.log('No assignment rules matched');
      res.json({ 
        success: false,
        assignment: null,
        message: 'No assignment rules matched this lead'
      });
    }
  } catch (error) {
    console.error('Error testing assignment rules:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST create default assignment rules
router.post('/initialize-defaults', authenticateToken, checkPermission('leads', 'assign'), async (req, res) => {
  try {
    console.log('Creating default assignment rules...');
    
    const defaultRules = [
      {
        name: 'High Value Events',
        description: 'High-value leads (₹100k+) assigned to senior team',
        priority: 1,
        conditions: {
          potential_value: { gte: 100000 }
        },
        assignment_strategy: 'weighted_round_robin',
        assignees: [
          { email: 'manmeet@fantopark.com', weight: 60 },
          { email: 'admin@fantopark.com', weight: 40 }
        ],
        is_active: true,
        created_by: req.user.email
      },
      {
        name: 'Corporate Events',
        description: 'B2B leads assigned to corporate specialists',
        priority: 2,
        conditions: {
          business_type: 'B2B'
        },
        assignment_strategy: 'weighted_round_robin',
        assignees: [
          { email: 'admin@fantopark.com', weight: 70 },
          { email: 'manmeet@fantopark.com', weight: 30 }
        ],
        is_active: true,
        created_by: req.user.email
      },
      {
        name: 'General Lead Distribution',
        description: 'Default load balancing for all other leads',
        priority: 10,
        conditions: {}, // No conditions = matches all
        assignment_strategy: 'least_busy',
        assignees: [
          { email: 'manmeet@fantopark.com', weight: 50 },
          { email: 'admin@fantopark.com', weight: 50 }
        ],
        is_active: true,
        created_by: req.user.email
      }
    ];

    const createdRules = [];
    
    for (const ruleData of defaultRules) {
      // Check if rule already exists
      const existingRules = await AssignmentRule.getAll();
      const exists = existingRules.find(r => r.name === ruleData.name);
      
      if (!exists) {
        const rule = new AssignmentRule(ruleData);
        const savedRule = await rule.save();
        createdRules.push(savedRule);
        console.log(`Created default rule: ${ruleData.name}`);
      } else {
        console.log(`Rule already exists: ${ruleData.name}`);
      }
    }

    res.json({ 
      success: true,
      message: `Created ${createdRules.length} default assignment rules`,
      created_rules: createdRules
    });
  } catch (error) {
    console.error('Error creating default assignment rules:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
