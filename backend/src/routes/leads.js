// Enhanced backend/src/routes/leads.js - FULLY BACKWARD COMPATIBLE + AUTO-REMINDERS + ASSIGNMENT RULES + COMMUNICATION TRACKING + PDF DOWNLOAD
const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const AssignmentRule = require('../models/AssignmentRule');
const { authenticateToken } = require('../middleware/auth');
const Communication = require('../models/Communication');
const { Storage } = require('@google-cloud/storage');

// Import db for bulk operations (you already had this)
const { db, collections } = require('../config/db');

// Initialize Google Cloud Storage for PDF downloads
const storage = new Storage({
  projectId: 'enduring-wharf-464005-h7',
});
const bucket = storage.bucket('fantopark-quotes-bucket');

// FIXED: Helper function to get user name by email (for suggestions)
async function getUserName(email) {
  try {
    if (!email) return 'Unassigned';
    
    const snapshot = await db.collection(collections.users)
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (!snapshot.empty) {
      const userData = snapshot.docs[0].data();
      return userData.name || email;
    }
    
    return email; // fallback to email if name not found
  } catch (error) {
    console.error('Error getting user name:', error);
    return email || 'Unknown'; // fallback on error
  }
}

// 🔧 **COMPLETE: Enhanced Auto-Assignment Function**
async function performEnhancedAutoAssignment(leadData) {
  console.log('🎯 === ENHANCED AUTO-ASSIGNMENT START ===');
  console.log('Lead name:', leadData.name);
  console.log('Potential value:', leadData.potential_value);
  console.log('Business type:', leadData.business_type);
  
  try {
    // Use direct database query to ensure it works
    const snapshot = await db.collection('crm_assignment_rules')
      .where('is_active', '==', true)
      .orderBy('priority', 'asc')
      .get();
    
    console.log(`📋 Found ${snapshot.size} active assignment rules`);
    
    if (snapshot.empty) {
      console.log('⚠️ No active assignment rules found');
      return null;
    }
    
    // Evaluate each rule
    for (const doc of snapshot.docs) {
      const rule = { id: doc.id, ...doc.data() };
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
  
  for (const [field, condition] of Object.entries(conditions)) {
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
  if (assignees[0] && typeof assignees[0] === 'object' && assignees[0].email) {
    // For weighted round robin, create a pool based on weights
    const weightedPool = [];
    assignees.forEach(assignee => {
      const weight = assignee.weight || 50; // Default weight 50
      for (let i = 0; i < weight; i++) {
        weightedPool.push(assignee.email);
      }
    });
    
    if (weightedPool.length === 0) {
      return assignees[0].email; // Fallback to first assignee
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
  const fallback = assignees[0]?.email || assignees[0];
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

// PUT update lead - ENHANCED WITH AUTO-REMINDERS + COMMUNICATION TRACKING
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
    const oldAssignment = currentLead.assigned_to;
    const newAssignment = updates.assigned_to;
    const oldTemperature = currentLead.temperature;
    const newTemperature = updates.temperature;
    
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

    // 📞 **NEW: AUTO-LOG SIGNIFICANT CHANGES**
    try {
      if (newStatus && newStatus !== oldStatus) {
        await Communication.autoLog(leadId, updatedLead, 'status_change', {
          oldStatus: oldStatus,
          newStatus: newStatus,
          message: `Status changed from ${oldStatus} to ${newStatus}`
        });
        console.log('📝 Auto-logged status change communication');
      }
      
      if (newAssignment && newAssignment !== oldAssignment) {
        await Communication.autoLog(leadId, updatedLead, 'assignment_change', {
          oldAssignment: oldAssignment,
          newAssignment: newAssignment,
          message: `Lead reassigned from ${oldAssignment || 'unassigned'} to ${newAssignment}`
        });
        console.log('📝 Auto-logged assignment change communication');
      }
      
      if (newTemperature && newTemperature !== oldTemperature) {
        await Communication.autoLog(leadId, updatedLead, 'temperature_change', {
          oldTemperature: oldTemperature,
          newTemperature: newTemperature,
          message: `Temperature changed from ${oldTemperature} to ${newTemperature}`
        });
        console.log('📝 Auto-logged temperature change communication');
      }
    } catch (commError) {
      console.error('⚠️ Failed to auto-log change communications (non-critical):', commError);
      // Don't fail the lead update if communication logging fails
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
    
    // NEW: Also delete all reminders and communications when bulk deleting leads
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

    try {
      const commSnapshot = await db.collection('crm_communications').get();
      if (!commSnapshot.empty) {
        const commBatch = db.batch();
        commSnapshot.docs.forEach((doc) => {
          commBatch.delete(doc.ref);
        });
        await commBatch.commit();
        console.log(`Deleted ${commSnapshot.size} communications`);
      }
    } catch (commError) {
      console.error('Failed to delete communications during bulk delete:', commError.message);
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

// ===== FIXED: NEW ROUTES FOR CLIENT MANAGEMENT =====

// FIXED: Check if phone number exists (for frontend suggestions)
router.get('/check-phone/:phone', authenticateToken, async (req, res) => {
  try {
    const phone = req.params.phone;
    console.log(`🔍 Route: Received phone check request for: ${phone}`);
    
    const clientInfo = await Lead.getClientByPhone(phone);
    
    if (clientInfo) {
      console.log(`✅ Route: Client found:`, {
        name: clientInfo.name,
        total_leads: clientInfo.total_leads,
        primary_assigned_to: clientInfo.primary_assigned_to
      });
      
      // FIXED: Handle case where primary_assigned_to might be null
      let primaryAssignedToName = 'Unassigned';
      if (clientInfo.primary_assigned_to) {
        try {
          primaryAssignedToName = await getUserName(clientInfo.primary_assigned_to);
          console.log(`📝 Route: Got user name: ${primaryAssignedToName}`);
        } catch (nameError) {
          console.warn(`⚠️ Route: Could not get name for ${clientInfo.primary_assigned_to}:`, nameError);
          primaryAssignedToName = clientInfo.primary_assigned_to; // Fallback to email
        }
      }
      
      const response = {
        exists: true,
        suggestion: {
          suggested_assigned_to: clientInfo.primary_assigned_to,
          suggested_assigned_to_name: primaryAssignedToName,
          suggested_reason: `This client has ${clientInfo.total_leads} other lead(s) assigned to ${primaryAssignedToName}`,
          client_history: clientInfo.leads,
          events_interested: clientInfo.events
        }
      };

      console.log(`✅ Route: Sending response:`, response);
      res.json(response);
    } else {
      console.log(`❌ Route: No client found for: ${phone}`);
      res.json({ exists: false });
    }
  } catch (error) {
    console.error('❌ Route: Error checking phone:', error);
    res.status(500).json({ error: error.message });
  }
});

// 🔧 **ENHANCED: POST create lead - WITH AUTO-ASSIGNMENT + COMMUNICATION TRACKING**
router.post('/', authenticateToken, async (req, res) => {
  try {
    let newLeadData = { ...req.body };
    
    console.log(`🆕 Creating new lead: ${newLeadData.name} (${newLeadData.phone}) with status: ${newLeadData.status || 'unassigned'}`);
    
    // 🚀 **FIXED: Enhanced Auto-Assignment Logic (BEFORE client detection)**
    if (!newLeadData.assigned_to || newLeadData.assigned_to === '') {
      console.log('🎯 No assignment provided - attempting enhanced auto-assignment...');
      
      try {
        const assignment = await AssignmentRule.testAssignment(newLeadData);        
        if (assignment && assignment.assigned_to) {
          // Apply assignment fields with correct mapping
          newLeadData.assigned_to = assignment.assigned_to;
          newLeadData.assignment_rule_used = assignment.rule_matched;
          newLeadData.assignment_reason = assignment.assignment_reason;
          newLeadData.auto_assigned = assignment.auto_assigned;
          newLeadData.assignment_rule_id = assignment.rule_id;
          newLeadData.status = 'assigned';
          
          console.log(`✅ Auto-assignment successful: ${assignment.assigned_to}`);
          console.log(`📋 Rule matched: ${assignment.rule_matched}`);
        } else {
          console.log('⚠️ Enhanced auto-assignment - no rules matched');
        }
      } catch (assignmentError) {
        console.error('❌ Enhanced auto-assignment failed:', assignmentError);
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
    
    // 📞 **NEW: AUTO-LOG LEAD CREATION COMMUNICATION**
    try {
      const communicationDetails = {
        message: `Lead created from ${savedLead.source || 'unknown source'}`,
        ruleName: savedLead.assignment_rule_used
      };

      if (savedLead.auto_assigned) {
        // Auto-log assignment communication
        await Communication.autoLog(savedLead.id, savedLead, 'auto_assignment', communicationDetails);
        console.log('📝 Auto-logged assignment communication');
      } else {
        // Auto-log general lead creation
        await Communication.autoLog(savedLead.id, savedLead, 'lead_creation', communicationDetails);
        console.log('📝 Auto-logged lead creation communication');
      }
    } catch (commError) {
      console.error('⚠️ Failed to auto-log communication (non-critical):', commError);
      // Don't fail the lead creation if communication logging fails
    }
    
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

// 📞 **NEW: Get communications for a specific lead**
router.get('/:id/communications', authenticateToken, async (req, res) => {
  try {
    const leadId = req.params.id;
    const { limit = 50 } = req.query;
    
    // Verify lead exists
    const lead = await Lead.getById(leadId);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    const communications = await Communication.getByLeadId(leadId, parseInt(limit));
    
    console.log(`Found ${communications.length} communications for lead: ${leadId}`);
    res.json({ 
      data: communications,
      lead: {
        id: leadId,
        name: lead.name,
        email: lead.email,
        status: lead.status
      }
    });
  } catch (error) {
    console.error('Error fetching communications for lead:', error);
    res.status(500).json({ error: error.message });
  }
});

// 📞 **NEW: Add communication to a specific lead**
router.post('/:id/communications', authenticateToken, async (req, res) => {
  try {
    const leadId = req.params.id;
    const communicationData = req.body;
    
    // Verify lead exists
    const lead = await Lead.getById(leadId);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    // Enrich communication data
    communicationData.lead_id = leadId;
    communicationData.lead_name = lead.name;
    communicationData.created_by = req.user.email;
    communicationData.created_by_name = req.user.name || req.user.email;
    
    // Create communication
    const communication = new Communication(communicationData);
    const savedCommunication = await communication.save();
    
    console.log(`Communication added to lead ${leadId}: ${savedCommunication.id}`);
    res.status(201).json({ 
      data: savedCommunication,
      message: 'Communication logged successfully' 
    });
  } catch (error) {
    console.error('Error adding communication to lead:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== NEW QUOTE PDF DOWNLOAD ENDPOINTS =====

// Quote download endpoint
router.get('/:id/quote/download', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📄 Quote download request for lead: ${id}`);
    
    // Get the lead from Firestore
    const leadDoc = await db.collection('crm_leads').doc(id).get();
    
    if (!leadDoc.exists) {
      console.log(`❌ Lead not found: ${id}`);
      return res.status(404).json({ 
        success: false, 
        error: 'Lead not found' 
      });
    }
    
    const leadData = leadDoc.data();
    const filename = leadData.quote_pdf_filename;
    
    if (!filename) {
      console.log(`❌ No quote file found for lead: ${id}`);
      return res.status(404).json({ 
        success: false, 
        error: 'No quote file found for this lead' 
      });
    }
    
    // Construct the file path in Google Cloud Storage
    const filePath = `quotes/${id}/${filename}`;
    const file = bucket.file(filePath);
    
    console.log(`📄 Looking for file: ${filePath}`);
    
    // Check if file exists in GCS
    const [exists] = await file.exists();
    if (!exists) {
      console.log(`❌ File not found in storage: ${filePath}`);
      return res.status(404).json({ 
        success: false, 
        error: 'Quote file not found in storage' 
      });
    }
    
    // Generate a signed URL for secure download
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour expiry
    });
    
    console.log(`✅ Generated download URL for: ${filename}`);
    
    res.json({
      success: true,
      downloadUrl: signedUrl,
      filename: filename
    });
    
  } catch (error) {
    console.error('❌ Quote download error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error: ' + error.message 
    });
  }
});

// Alternative direct file serving endpoint
router.get('/files/quotes/:leadId/:filename', authenticateToken, async (req, res) => {
  try {
    const { leadId, filename } = req.params;
    
    console.log(`📄 Direct file serve request: ${leadId}/${filename}`);
    
    // Verify the lead exists
    const leadDoc = await db.collection('crm_leads').doc(leadId).get();
    if (!leadDoc.exists) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    // Verify the filename matches what's stored in the lead
    const leadData = leadDoc.data();
    if (leadData.quote_pdf_filename !== filename) {
      return res.status(403).json({ error: 'File access denied' });
    }
    
    // Construct file path
    const filePath = `quotes/${leadId}/${filename}`;
    const file = bucket.file(filePath);
    
    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Stream the file
    const stream = file.createReadStream();
    stream.pipe(res);
    
    stream.on('error', (error) => {
      console.error('❌ File stream error:', error);
      if (!res.headersSent) {
        res.status(500).send('Error downloading file');
      }
    });
    
    console.log(`✅ File streaming started: ${filename}`);
    
  } catch (error) {
    console.error('❌ File serving error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// ===== ADD THIS TO YOUR backend/src/routes/leads.js =====
// Add this endpoint before the module.exports = router; line

const multer = require('multer');

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Quote upload endpoint with file handling
router.post('/:id/quote/upload', authenticateToken, upload.single('quote_pdf'), async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const file = req.file;
    
    console.log(`📄 Quote upload for lead: ${id}`);
    console.log(`📄 Notes: ${notes}`);
    console.log(`📄 File: ${file ? file.originalname : 'No file'}`);
    
    // Get the lead
    const leadDoc = await db.collection('crm_leads').doc(id).get();
    if (!leadDoc.exists) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }
    
    const leadData = leadDoc.data();
    
    let updateData = {
      quote_notes: notes || '',
      quote_uploaded_date: new Date().toISOString(),
      status: 'quote_received',
      updated_date: new Date().toISOString(),
      // Restore original assignee
      assigned_to: leadData.original_assignee || leadData.assigned_to,
      assigned_team: null
    };
    
  
let uniqueFilename, filePath;

if (file) {
  try {
    // Create unique filename ONCE
    const timestamp = Date.now();
    uniqueFilename = `quote_${timestamp}_${file.originalname}`;
    filePath = `quotes/${id}/${uniqueFilename}`;
    
    console.log(`📄 Uploading to GCS with exact filename: ${uniqueFilename}`);
    console.log(`📄 Full path: ${filePath}`);
        
    // Upload to Google Cloud Storage with the EXACT filename
    const gcsFile = bucket.file(filePath);
    const stream = gcsFile.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });
    
    await new Promise((resolve, reject) => {
      stream.on('error', (error) => {
        console.error('❌ GCS stream error:', error);
        reject(error);
      });
      stream.on('finish', () => {
        console.log(`✅ GCS upload completed for: ${uniqueFilename}`);
        resolve();
      });
      stream.end(file.buffer);
    });
    
    console.log(`✅ File uploaded to GCS with filename: ${uniqueFilename}`);
        
        console.log(`📄 Uploading to GCS: ${filePath}`);
        
        // Upload to Google Cloud Storage
        const gcsFile = bucket.file(filePath);
        const stream = gcsFile.createWriteStream({
          metadata: {
            contentType: file.mimetype,
          },
        });
        
        await new Promise((resolve, reject) => {
          stream.on('error', reject);
          stream.on('finish', resolve);
          stream.end(file.buffer);
        });
        
        // Add file info to update data
        updateData.quote_pdf_filename = uniqueFilename;
        updateData.quote_file_size = file.size;
        updateData.quote_file_path = filePath;
        
        console.log(`✅ File uploaded to GCS: ${filePath}`);
        
      } catch (uploadError) {
        console.error('❌ GCS upload error:', uploadError);
        return res.status(500).json({ 
          success: false, 
          error: 'File upload failed: ' + uploadError.message 
        });
      }
    }
    
    // Update the lead in Firestore
    await db.collection('crm_leads').doc(id).update(updateData);
    
    // Get updated lead data
    const updatedLeadDoc = await db.collection('crm_leads').doc(id).get();
    const updatedLead = { id, ...updatedLeadDoc.data() };
    
    console.log(`✅ Quote upload completed for lead: ${id}`);
    
res.json({
  success: true,
  data: updatedLead,
  message: file ? 'Quote uploaded successfully' : 'Quote processed successfully (no file)',
  // Add file information for frontend
  ...(file && {
    filePath: `quotes/${id}/${uniqueFilename}`,
    fileName: uniqueFilename,
    originalName: file.originalname,
    fileSize: file.size
  })
});
    
  } catch (error) {
    console.error('❌ Quote upload error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Upload failed: ' + error.message 
    });
  }
});

module.exports = router;
