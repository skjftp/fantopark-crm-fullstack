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
    const clientInfo = await Lead.findClientByPhone(phone);
    
    if (clientInfo.exists) {
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

// POST create lead - ENHANCED WITH AUTO-REMINDERS + CLIENT MANAGEMENT + ASSIGNMENT RULES
router.post('/', authenticateToken, async (req, res) => {
  try {
    const newLeadData = req.body;
    
    console.log(`🆕 Creating new lead: ${newLeadData.name} (${newLeadData.phone}) with status: ${newLeadData.status || 'new'}`);
    
    // Client detection logic (only if phone is provided)
    if (newLeadData.phone) {
      console.log('Creating lead with client detection:', newLeadData.name, newLeadData.phone);
      
      try {
        const clientInfo = await Lead.findClientByPhone(newLeadData.phone);
        
        if (clientInfo.exists) {
          console.log(`Existing client found with ${clientInfo.total_leads} leads`);
          
          // Auto-suggest assignment but don't force it
          if (!newLeadData.assigned_to) {
            newLeadData.assigned_to = clientInfo.primary_assigned_to;
            console.log('Auto-assigned to existing sales person:', clientInfo.primary_assigned_to);
          } else if (newLeadData.assigned_to !== clientInfo.primary_assigned_to) {
            newLeadData.manual_assignment_override = true;
            console.log('Manual override detected');
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
          
          // Create lead with auto-reminder support
          const lead = new Lead(newLeadData);
          const savedLead = await lead.save(); // This will trigger auto-reminder creation
          
          // Return enhanced response with suggestion info
          res.status(201).json({ 
            data: savedLead,
            client_suggestion: {
              suggested_assigned_to: clientInfo.primary_assigned_to,
              suggested_reason: `This client has ${clientInfo.total_leads + 1} total leads`,
              client_history: clientInfo.leads
            },
            message: `Lead created and linked to existing client with auto-reminder`
          });
          return;
        } else {
          console.log('New client - creating primary lead');
          
          // New client - set as primary
          newLeadData.is_primary_lead = true;
          newLeadData.client_total_leads = 1;
          if (newLeadData.lead_for_event) {
            newLeadData.client_events = [newLeadData.lead_for_event];
          }
        }
      } catch (clientError) {
        console.log('Client detection failed (non-critical):', clientError.message);
        // Continue with regular lead creation if client detection fails
      }
    }
    
    // 🚀 NEW: AUTOMATED ASSIGNMENT RULES INTEGRATION
    if (!newLeadData.assigned_to || newLeadData.assigned_to === '') {
      try {
        console.log('🤖 Evaluating auto-assignment for new lead:', newLeadData.name);
        const assignment = await AssignmentRule.evaluateLeadAssignment(newLeadData);
        
        if (assignment.assigned_to) {
          newLeadData.assigned_to = assignment.assigned_to;
          newLeadData.assignment_rule_used = assignment.assignment_rule_used;
          newLeadData.assignment_reason = assignment.assignment_reason;
          newLeadData.auto_assigned = true;
          console.log(`✅ Auto-assigned to: ${assignment.assigned_to} via ${assignment.assignment_reason}`);
        } else {
          console.log('⚠️ No assignment could be determined');
        }
      } catch (assignmentError) {
        console.error('❌ Auto-assignment failed (non-critical):', assignmentError);
        // Don't fail the lead creation if assignment fails
      }
    }
    
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
    }
    
    res.status(201).json(response);
    
  } catch (error) {
    console.error('Error creating lead:', error);
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
