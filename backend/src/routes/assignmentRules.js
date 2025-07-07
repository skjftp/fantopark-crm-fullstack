const express = require('express');
const router = express.Router();
const AssignmentRule = require('../models/AssignmentRule');
const { authenticateToken, checkPermission } = require('../middleware/auth');
const { db, collections } = require('../config/db');

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


// POST run assignment for all unassigned leads
router.post('/run-assignment', authenticateToken, checkPermission('leads', 'assign'), async (req, res) => {
  try {
    console.log('🚀 Starting bulk assignment process...');
    
    // Get all unassigned leads
    const unassignedSnapshot = await db.collection(collections.leads)
      .where('assigned_to', 'in', ['', null])
      .get();
    
    if (unassignedSnapshot.empty) {
      return res.json({
        success: true,
        message: 'No unassigned leads found',
        processedCount: 0,
        assignedCount: 0,
        results: []
      });
    }
    
    console.log(`📋 Found ${unassignedSnapshot.size} unassigned leads`);
    
    // Get all active assignment rules
    const rules = await AssignmentRule.getActive();
    
    if (!rules || rules.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active assignment rules found. Please create assignment rules first.',
        processedCount: 0,
        assignedCount: 0
      });
    }
    
    const results = [];
    let assignedCount = 0;
    let processedCount = 0;
    
    // Process each unassigned lead
    for (const leadDoc of unassignedSnapshot.docs) {
      const leadData = { id: leadDoc.id, ...leadDoc.data() };
      processedCount++;
      
      let assigned = false;
      
      // Try each rule in priority order
      for (const rule of rules) {
        if (AssignmentRule.evaluateConditions(leadData, rule.conditions)) {
          const assignee = AssignmentRule.selectAssignee(rule);
          
          if (assignee) {
            // Update the lead
            const updateData = {
              assigned_to: assignee,
              auto_assigned: true,
              assignment_reason: rule.description || `Matched rule: ${rule.name}`,
              assignment_rule_used: rule.name,
              assignment_rule_id: rule.id,
              assignment_date: new Date().toISOString(),
              updated_date: new Date().toISOString(),
              status: 'assigned'
            };
            
            await db.collection(collections.leads).doc(leadDoc.id).update(updateData);
            
            results.push({
              leadId: leadDoc.id,
              leadName: leadData.name,
              assignedTo: assignee,
              ruleName: rule.name,
              success: true
            });
            
            assignedCount++;
            assigned = true;
            break;
          }
        }
      }
      
      if (!assigned) {
        results.push({
          leadId: leadDoc.id,
          leadName: leadData.name,
          assignedTo: null,
          ruleName: null,
          success: false
        });
      }
    }
    
    res.json({
      success: true,
      message: `Assignment completed. ${assignedCount} out of ${processedCount} leads assigned.`,
      processedCount,
      assignedCount,
      unassignedCount: processedCount - assignedCount,
      results
    });
    
  } catch (error) {
    console.error('Error in bulk assignment:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      processedCount: 0,
      assignedCount: 0
    });
  }
});
module.exports = router;
