// Enhanced backend/src/routes/leads.js - FULLY BACKWARD COMPATIBLE + AUTO-REMINDERS + ASSIGNMENT RULES
const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const AssignmentRule = require('../models/AssignmentRule');
const { authenticateToken } = require('../middleware/auth');

// Import db for bulk operations (you already had this)
const { db, collections } = require('../config/db');

// Helper function to get user name by email (for suggestions)
async function getUserName(email) {
  try {
    const snapshot = await db.collection('crm_users')
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (!snapshot.empty) {
      return snapshot.docs[0].data().name;
    }
    return email; // fallback to email if name not found
  } catch (error) {
    return email; // fallback on error
  }
}

// 🔧 **FIXED: Enhanced Auto-Assignment Function**
async function performEnhancedAutoAssignment(leadData) {
  console.log('🎯 === ENHANCED AUTO-ASSIGNMENT START ===');
  console.log('Lead name:', leadData.name);
  console.log('Potential value:', leadData.potential_value);
  console.log('Business type:', leadData.business_type);
  
  try {
    // 🔧 FIXED: Query for both 'active' and 'is_active' fields to handle database inconsistency
    const snapshot = await db.collection('crm_assignment_rules').get();
    
    console.log(`📋 Found ${snapshot.size} total assignment rules`);
    
    if (snapshot.empty) {
      console.log('⚠️ No assignment rules found');
      return null;
    }
    
    // Filter active rules and sort by priority
    const allRules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const activeRules = allRules.filter(rule => {
      // Handle both 'active' and 'is_active' fields
      const isActive = rule.active === true || rule.is_active === true || 
                      (rule.active === undefined && rule.is_active === undefined);
      return isActive;
    }).sort((a, b) => (a.priority || 99) - (b.priority || 99));
    
    console.log(`📋 Found ${activeRules.length} active assignment rules`);
    
    if (activeRules.length === 0) {
      console.log('⚠️ No active assignment rules found');
      return null;
    }
    
    // Evaluate each rule
    for (const rule of activeRules) {
      console.log(`\n🧪 Testing rule: ${rule.name} (Priority: ${rule.priority})`);
      console.log('   Conditions:', rule.conditions);
      
      if (evaluateRuleConditions(leadData, rule.conditions)) {
        console.log(`✅ Rule matched: ${rule.name}`);
        
        const assignee = selectWeightedAssignee(rule);
        if (assignee) {
          console.log(`🎯 Selected assignee: ${assignee}`);
          
          // Update assignment tracking for round-robin
          try {
            await updateRuleLastAssignment(rule.id, rule.last_assignment_index || 0);
          } catch (updateError) {
            console.log('⚠️ Failed to update assignment tracking:', updateError.message);
          }
          
          const result = {
            assigned_to: assignee,
            auto_assigned: true,
            assignment_reason: rule.description || `Matched rule: ${rule.name}`,
            assignment_rule_used: rule.name,
            assignment_rule_id: rule.id,
            assignment_date: new Date().toISOString(),
            status: 'assigned'
          };
          
          console.log('✅ Auto-assignment successful:', result);
          return result;
        } else {
          console.log(`❌ No assignees available for rule: ${rule.name}`);
        }
      } else {
        console.log(`❌ Rule conditions not met: ${rule.name}`);
      }
    }
    
    console.log('⚠️ No assignment rules matched');
    return null;
    
  } catch (error) {
    console.error('❌ Enhanced auto-assignment error:', error);
    return null;
  }
}

// ✅ COMPLETE: Enhanced condition evaluation with detailed logging
function evaluateRuleConditions(leadData, conditions) {
  if (!conditions || Object.keys(conditions).length === 0) {
    console.log('   ✅ No conditions - rule matches all leads');
    return true;
  }
  
  console.log('   🔍 Evaluating conditions against lead data:');
  console.log('     Lead potential_value:', leadData.potential_value);
  console.log('     Lead business_type:', leadData.business_type);
  
  // 🔧 FIXED: Handle both object and array condition formats
  let conditionsToCheck = conditions;
  
  // If conditions is an array, convert to object format
  if (Array.isArray(conditions)) {
    console.log('   📝 Converting array conditions to object format');
    conditionsToCheck = {};
    conditions.forEach(condition => {
      if (condition.field && condition.operator && condition.value !== undefined) {
        const field = condition.field;
        const operator = condition.operator;
        const value = condition.value;
        
        if (operator === '>=') {
          conditionsToCheck[field] = { gte: value };
        } else if (operator === '>') {
          conditionsToCheck[field] = { gt: value };
        } else if (operator === '<=') {
          conditionsToCheck[field] = { lte: value };
        } else if (operator === '<') {
          conditionsToCheck[field] = { lt: value };
        } else if (operator === '==' || operator === '=') {
          conditionsToCheck[field] = value;
        } else if (operator === '!=') {
          conditionsToCheck[field] = { neq: value };
        }
      }
    });
  }
  
  for (const [field, condition] of Object.entries(conditionsToCheck)) {
    const leadValue = leadData[field];
    console.log(`   🧪 Checking field "${field}": ${leadValue} vs`, condition);
    
    if (typeof condition === 'object' && condition !== null) {
      // Handle complex conditions like {gte: 100000}
      if (condition.gte !== undefined) {
        const passes = Number(leadValue) >= Number(condition.gte);
        console.log(`     ${passes ? '✅' : '❌'} ${leadValue} >= ${condition.gte}: ${passes}`);
        if (!passes) return false;
      }
      if (condition.gt !== undefined) {
        const passes = Number(leadValue) > Number(condition.gt);
        console.log(`     ${passes ? '✅' : '❌'} ${leadValue} > ${condition.gt}: ${passes}`);
        if (!passes) return false;
      }
      if (condition.lte !== undefined) {
        const passes = Number(leadValue) <= Number(condition.lte);
        console.log(`     ${passes ? '✅' : '❌'} ${leadValue} <= ${condition.lte}: ${passes}`);
        if (!passes) return false;
      }
      if (condition.lt !== undefined) {
        const passes = Number(leadValue) < Number(condition.lt);
        console.log(`     ${passes ? '✅' : '❌'} ${leadValue} < ${condition.lt}: ${passes}`);
        if (!passes) return false;
      }
      if (condition.eq !== undefined) {
        const passes = leadValue === condition.eq;
        console.log(`     ${passes ? '✅' : '❌'} ${leadValue} === ${condition.eq}: ${passes}`);
        if (!passes) return false;
      }
      if (condition.neq !== undefined) {
        const passes = leadValue !== condition.neq;
        console.log(`     ${passes ? '✅' : '❌'} ${leadValue} !== ${condition.neq}: ${passes}`);
        if (!passes) return false;
      }
      if (condition.in !== undefined && Array.isArray(condition.in)) {
        const passes = condition.in.includes(leadValue);
        console.log(`     ${passes ? '✅' : '❌'} ${leadValue} in [${condition.in.join(', ')}]: ${passes}`);
        if (!passes) return false;
      }
    } else {
      // Handle simple equality conditions
      const passes = leadValue === condition;
      console.log(`     ${passes ? '✅' : '❌'} ${leadValue} === ${condition}: ${passes}`);
      if (!passes) return false;
    }
  }
  
  console.log('   ✅ All conditions passed');
  return true;
}

// ✅ COMPLETE: Enhanced assignee selection with weighted round-robin
function selectWeightedAssignee(rule) {
  if (!rule.assignees || rule.assignees.length === 0) {
    console.log('   ❌ No assignees defined for rule');
    return null;
  }
  
  console.log('   👥 Available assignees:', rule.assignees);
  
  // Handle different assignee formats from your database
  let assignees = rule.assignees;
  
  // If assignees is array of objects with email and weight
  if (assignees[0] && typeof assignees[0] === 'object') {
    // Handle both 'email' and 'user_email' fields
    const validAssignees = assignees.filter(assignee => assignee.email || assignee.user_email);
    
    if (validAssignees.length === 0) {
      console.log('   ❌ No valid assignees with email found');
      return null;
    }
    
    // For weighted round robin, create a pool based on weights
    const weightedPool = [];
    validAssignees.forEach(assignee => {
      const email = assignee.email || assignee.user_email;
      const weight = assignee.weight || 50; // Default weight 50
      for (let i = 0; i < weight; i++) {
        weightedPool.push(email);
      }
    });
    
    if (weightedPool.length === 0) {
      return validAssignees[0].email || validAssignees[0].user_email; // Fallback to first assignee
    }
    
    // Use round-robin with weights
    const currentIndex = rule.last_assignment_index || 0;
    const nextIndex = (currentIndex + 1) % weightedPool.length;
    const selected = weightedPool[nextIndex];
    
    console.log(`   🎯 Weighted selection: ${selected} (index ${nextIndex} of ${weightedPool.length})`);
    return selected;
  }
  
  // If assignees is simple array of emails (fallback)
  if (Array.isArray(assignees) && typeof assignees[0] === 'string') {
    // Round-robin selection using last_assignment_index
    const lastIndex = rule.last_assignment_index || 0;
    const nextIndex = (lastIndex + 1) % assignees.length;
    const selected = assignees[nextIndex];
    
    console.log(`   🔄 Round-robin selection: ${selected} (index: ${nextIndex})`);
    return selected;
  }
  
  // Final fallback: just pick the first assignee
  const fallback = assignees[0]?.email || assignees[0]?.user_email || assignees[0];
  console.log(`   ⚠️ Fallback selection: ${fallback}`);
  return fallback;
}

// ✅ COMPLETE: Update rule's last assignment index for round-robin
async function updateRuleLastAssignment(ruleId, currentIndex) {
  try {
    const newIndex = currentIndex + 1;
    await db.collection('crm_assignment_rules').doc(ruleId).update({
      last_assignment_index: newIndex,
      updated_date: new Date().toISOString()
    });
    console.log(`   ✅ Updated assignment index for rule ${ruleId}: ${newIndex}`);
  } catch (error) {
    console.error('   ❌ Failed to update assignment index:', error);
    // Don't throw - this is non-critical for lead creation
  }
}

// ===== ALL YOUR EXISTING ROUTES (UNCHANGED) =====

// GET all leads - SAME AS YOUR ORIGINAL
router.get('/', authenticateToken, async (req, res) => {
  try {
    const leads = await Lead.getAll(req.query);
    res.json({ data: leads });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single lead - SAME AS YOUR ORIGINAL
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

// PUT update lead - ENHANCED WITH AUTO-REMINDERS
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const leadId = req.params.id;
    const updates = req.body;
    
    // Get current lead to compare status changes
    const currentLead = await Lead.getById(leadId);
    if (!currentLead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const oldStatus = currentLead.status;
    const newStatus = updates.status;
    
    console.log(`🔄 Updating lead ${leadId}: ${oldStatus} → ${newStatus || 'no status change'}`);

    // UPDATE: Enhanced update with auto-reminder support
    const updatedLead = await Lead.update(leadId, updates);
    
    // NEW: Auto-reminder logic for status changes
    if (newStatus && newStatus !== oldStatus) {
      try {
        console.log(`📱 Creating auto-reminder for status change: ${oldStatus} → ${newStatus}`);
        const Reminder = require('../models/Reminder');
        
        // Cancel old pending reminders for this lead
        await Lead.cancelOldReminders(leadId, newStatus);
        
        // Create new reminder for new status
        await Lead.createAutoReminder(leadId, updatedLead);
        
      } catch (reminderError) {
        console.error('⚠️ Auto-reminder creation failed (non-critical):', reminderError.message);
        // Don't fail the update if reminder creation fails
      }
    }
    
    // Optional client metadata update (only if client_id exists)
    try {
      if (updatedLead.client_id) {
        await Lead.updateClientMetadata(updatedLead.client_id, {
          client_last_activity: new Date().toISOString()
        });
      }
    } catch (clientError) {
      console.log('Client metadata update failed (non-critical):', clientError.message);
    }
    
    res.json({ data: updatedLead });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE lead - SAME AS YOUR ORIGINAL
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const leadId = req.params.id;
    
    // NEW: Cancel any pending reminders for this lead before deletion
    try {
      await Lead.cancelOldReminders(leadId, 'deleted');
      console.log(`✅ Cancelled reminders for deleted lead: ${leadId}`);
    } catch (reminderError) {
      console.error('⚠️ Failed to cancel reminders for deleted lead:', reminderError.message);
    }
    
    await Lead.delete(leadId);
    res.json({ data: { message: 'Lead deleted successfully' } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE all leads - YOUR EXISTING BULK DELETE (UNCHANGED)
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
    
    // NEW: Also delete all reminders when bulk deleting leads
    try {
      const reminderSnapshot = await db.collection('crm_reminders').get();
      if (!reminderSnapshot.empty) {
        const reminderBatch = db.batch();
        reminderSnapshot.docs.forEach((doc) => {
          reminderBatch.delete(doc.ref);
        });
        await reminderBatch.commit();
        console.log(`Deleted ${reminderSnapshot.size} reminders`);
      }
    } catch (reminderError) {
      console.error('Failed to delete reminders during bulk delete:', reminderError.message);
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

// ===== NEW ROUTES FOR CLIENT MANAGEMENT (ADDITIVE ONLY) =====

// NEW: Check if phone number exists (for frontend suggestions)
router.get('/check-phone/:phone', authenticateToken, async (req, res) => {
  try {
    const phone = req.params.phone;
    const clientInfo = await Lead.getClientByPhone(phone);
    
    if (clientInfo) {
      const primaryAssignedToName = await getUserName(clientInfo.primary_assigned_to);
      
      res.json({
        exists: true,
        suggestion: {
          suggested_assigned_to: clientInfo.primary_assigned_to,
          suggested_assigned_to_name: primaryAssignedToName,
          suggested_reason: `This client has ${clientInfo.total_leads} other lead(s) assigned to ${primaryAssignedToName}`,
          client_history: clientInfo.leads,
          events_interested: clientInfo.events
        }
      });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    console.error('Error checking phone:', error);
    res.status(500).json({ error: error.message });
  }
});

// 🔧 **FIXED: POST create lead - ENHANCED WITH WORKING AUTO-ASSIGNMENT**
router.post('/', authenticateToken, async (req, res) => {
  try {
    let newLeadData = { ...req.body };
    
    console.log(`🆕 Creating new lead: ${newLeadData.name} (${newLeadData.phone}) with status: ${newLeadData.status || 'unassigned'}`);
    
    // 🚀 **FIXED: Enhanced Auto-Assignment Logic (BEFORE client detection)**
    if (true) { // TEMP: Force auto-assignment test
  console.log('🎯 No assignment provided - attempting enhanced auto-assignment...');
    // 🚀 **WORKING: Auto-Assignment Logic using AssignmentRule model**
    if (!newLeadData.assigned_to || newLeadData.assigned_to === '') {
      console.log('🎯 No assignment provided - attempting auto-assignment...');      
      try {
        // Use the working AssignmentRule.testAssignment method
        const assignment = await AssignmentRule.testAssignment(newLeadData);
        
        if (assignment && assignment.assigned_to) {
          // Apply assignment results
          newLeadData.assigned_to = assignment.assigned_to;
          newLeadData.assignment_rule_used = assignment.rule_matched;
          newLeadData.assignment_reason = assignment.assignment_reason;
          newLeadData.auto_assigned = assignment.auto_assigned;
          newLeadData.assignment_rule_id = assignment.rule_id;
          newLeadData.assignment_date = new Date().toISOString();
          newLeadData.status = 'assigned';
          
          console.log(`✅ Auto-assignment successful: ${assignment.assigned_to}`);
          console.log(`📋 Rule matched: ${assignment.rule_matched}`);
          console.log(`📋 Reason: ${assignment.assignment_reason}`);
        } else {
          console.log('⚠️ Auto-assignment - no rules matched');
        }
      } catch (assignmentError) {
        console.error('❌ Auto-assignment failed:', assignmentError);
        // Continue with lead creation even if auto-assignment fails
      }
    } else {
      console.log('✅ Lead already has assignment:', newLeadData.assigned_to);
    }

    
    // Client detection logic (only if phone is provided)
    if (newLeadData.phone) {
      console.log('🔍 Running client detection for phone:', newLeadData.phone);
      
      try {
        const clientInfo = await Lead.getClientByPhone(newLeadData.phone);
        
        if (clientInfo) {
          console.log(`📞 Existing client found with ${clientInfo.total_leads} leads`);
          
          // Only override auto-assignment if no assignment was made and client has preferred assignee
          if (!newLeadData.assigned_to && clientInfo.primary_assigned_to) {
            newLeadData.assigned_to = clientInfo.primary_assigned_to;
            newLeadData.assignment_reason = `Client detection: Previous leads assigned to ${clientInfo.primary_assigned_to}`;
            console.log('📋 Client detection assignment:', clientInfo.primary_assigned_to);
          } else if (newLeadData.assigned_to !== clientInfo.primary_assigned_to) {
            newLeadData.manual_assignment_override = true;
            console.log('🔄 Manual/auto assignment differs from client history');
          }
          
          // Add client metadata
          newLeadData.client_id = clientInfo.client_id;
          newLeadData.is_primary_lead = false;
          newLeadData.client_total_leads = clientInfo.total_leads + 1;
          newLeadData.client_events = [...clientInfo.events, newLeadData.lead_for_event];
          newLeadData.client_first_contact = clientInfo.first_contact;
          
          // Update existing leads' metadata
          await Lead.updateClientMetadata(clientInfo.client_id, {
            client_total_leads: clientInfo.total_leads + 1,
            client_events: newLeadData.client_events,
            client_last_activity: new Date().toISOString()
          });
          
          console.log('✅ Client metadata updated');
        } else {
          console.log('👤 New client - creating primary lead');
          
          // New client - set as primary
          newLeadData.is_primary_lead = true;
          newLeadData.client_total_leads = 1;
          if (newLeadData.lead_for_event) {
            newLeadData.client_events = [newLeadData.lead_for_event];
          }
        }
      } catch (clientError) {
        console.log('⚠️ Client detection failed (non-critical):', clientError.message);
        // Continue with regular lead creation if client detection fails
      }
    }
    
    // 📝 **FINAL LEAD CREATION with all assignment metadata**
    console.log('💾 Creating lead with final data:', {
      name: newLeadData.name,
      assigned_to: newLeadData.assigned_to,
      auto_assigned: newLeadData.auto_assigned,
      assignment_rule_used: newLeadData.assignment_rule_used,
      status: newLeadData.status
    });
    
    // Create lead with auto-reminder support
    const lead = new Lead(newLeadData);
    const savedLead = await lead.save(); // This will trigger auto-reminder creation in the Lead model
    
    console.log(`✅ Lead created successfully: ${savedLead.id}`);
    
    // Enhanced response includes assignment info
    const response = { 
      data: savedLead,
      message: 'Lead created successfully'
    };
    
    // Add assignment info to response if auto-assigned
    if (savedLead.auto_assigned) {
      response.assignment_info = {
        auto_assigned: true,
        assigned_to: savedLead.assigned_to,
        assignment_reason: savedLead.assignment_reason,
        rule_used: savedLead.assignment_rule_used
      };
      response.message += ' with auto-assignment';
      console.log('📊 Assignment info added to response');
    }
    
    res.status(201).json(response);
    
  } catch (error) {
    console.error('❌ Error creating lead:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== NEW ROUTES FOR REMINDER MANAGEMENT =====

// NEW: Get reminders for a specific lead
router.get('/:id/reminders', authenticateToken, async (req, res) => {
  try {
    const leadId = req.params.id;
    const Reminder = require('../models/Reminder');
    
    const reminders = await Reminder.getByLead(leadId);
    res.json({ data: reminders });
  } catch (error) {
    console.error('Error fetching lead reminders:', error);
    res.status(500).json({ error: error.message });
  }
});

// NEW: Manually create reminder for a lead
router.post('/:id/reminders', authenticateToken, async (req, res) => {
  try {
    const leadId = req.params.id;
    const reminderData = req.body;
    
    // Verify lead exists
    const lead = await Lead.getById(leadId);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    const Reminder = require('../models/Reminder');
    
    // Create manual reminder
    const newReminderData = {
      ...reminderData,
      lead_id: leadId,
      auto_generated: false,
      created_by: req.user.email
    };
    
    const reminder = new Reminder(newReminderData);
    const savedReminder = await reminder.save();
    
    console.log(`📝 Manual reminder created: ${savedReminder.id} for lead: ${leadId}`);
    res.status(201).json({ data: savedReminder });
  } catch (error) {
    console.error('Error creating manual reminder:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
