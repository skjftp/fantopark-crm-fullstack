// backend/src/routes/communications.js - Communication Tracking Routes
const express = require('express');
const router = express.Router();
const Communication = require('../models/Communication');
const Lead = require('../models/Lead');
const { authenticateToken } = require('../middleware/auth');

// Helper function to get user name from email
async function getUserName(email) {
  const { db } = require('../config/db');
  try {
    const snapshot = await db.collection('crm_users')
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (!snapshot.empty) {
      return snapshot.docs[0].data().name || email;
    }
    return email;
  } catch (error) {
    return email;
  }
}

// GET all communications (with filtering and pagination)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      lead_id,
      user_email,
      communication_type,
      start_date,
      end_date,
      limit = 50,
      page = 1
    } = req.query;

    console.log('Fetching communications with filters:', req.query);

    let communications = [];

    if (lead_id) {
      // Get communications for specific lead
      communications = await Communication.getByLeadId(lead_id, parseInt(limit));
    } else if (user_email) {
      // Get communications for specific user
      communications = await Communication.getByUser(user_email, start_date, end_date, parseInt(limit));
    } else {
      // Get recent communications
      communications = await Communication.getRecent(parseInt(limit), user_email);
    }

    // Apply additional filters
    if (communication_type) {
      communications = communications.filter(comm => comm.communication_type === communication_type);
    }

    console.log(`Found ${communications.length} communications`);
    res.json({ data: communications, total: communications.length });
  } catch (error) {
    console.error('Error fetching communications:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET communication by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const communication = await Communication.getById(req.params.id);
    if (!communication) {
      return res.status(404).json({ error: 'Communication not found' });
    }
    res.json({ data: communication });
  } catch (error) {
    console.error('Error fetching communication:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST create new communication
router.post('/', authenticateToken, async (req, res) => {
  try {
    const communicationData = req.body;
    
    // Validate required fields
    if (!communicationData.lead_id) {
      return res.status(400).json({ error: 'Lead ID is required' });
    }

    // Verify lead exists
    const lead = await Lead.getById(communicationData.lead_id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Enrich communication data
    communicationData.created_by = req.user.email;
    communicationData.created_by_name = req.user.name || await getUserName(req.user.email);
    communicationData.lead_name = lead.name;

    // Create communication
    const communication = new Communication(communicationData);
    const savedCommunication = await communication.save();

    console.log(`Communication created: ${savedCommunication.id} for lead: ${communicationData.lead_id}`);
    
    res.status(201).json({ 
      data: savedCommunication,
      message: 'Communication logged successfully' 
    });
  } catch (error) {
    console.error('Error creating communication:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update communication
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const communicationId = req.params.id;
    const updateData = req.body;

    // Verify communication exists
    const existingComm = await Communication.getById(communicationId);
    if (!existingComm) {
      return res.status(404).json({ error: 'Communication not found' });
    }

    // Check permissions (user can only update their own communications or admins can update all)
    if (existingComm.created_by !== req.user.email && 
        !['super_admin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const updatedCommunication = await Communication.update(communicationId, updateData);
    
    console.log(`Communication updated: ${communicationId}`);
    res.json({ 
      data: updatedCommunication,
      message: 'Communication updated successfully' 
    });
  } catch (error) {
    console.error('Error updating communication:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE communication
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const communicationId = req.params.id;

    // Verify communication exists
    const existingComm = await Communication.getById(communicationId);
    if (!existingComm) {
      return res.status(404).json({ error: 'Communication not found' });
    }

    // Check permissions (user can only delete their own communications or admins can delete all)
    if (existingComm.created_by !== req.user.email && 
        !['super_admin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    await Communication.delete(communicationId);
    
    console.log(`Communication deleted: ${communicationId}`);
    res.json({ message: 'Communication deleted successfully' });
  } catch (error) {
    console.error('Error deleting communication:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET communications for a specific lead
router.get('/lead/:leadId', authenticateToken, async (req, res) => {
  try {
    const leadId = req.params.leadId;
    const { limit = 50, startAfter } = req.query;

    // Verify lead exists
    const lead = await Lead.getById(leadId);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const communications = await Communication.getByLeadId(leadId, parseInt(limit), startAfter);
    
    console.log(`Found ${communications.length} communications for lead: ${leadId}`);
    res.json({ 
      data: communications,
      lead: {
        id: leadId,
        name: lead.name,
        email: lead.email
      }
    });
  } catch (error) {
    console.error('Error fetching communications for lead:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET communication analytics
router.get('/analytics/summary', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date, user_email } = req.query;
    
    // If not admin/super_admin, restrict to their own communications
    let userFilter = user_email;
    if (!['super_admin', 'admin'].includes(req.user.role)) {
      userFilter = req.user.email;
    }

    const analytics = await Communication.getAnalytics(start_date, end_date, userFilter);
    
    console.log('Communication analytics generated for:', userFilter || 'all users');
    res.json({ data: analytics });
  } catch (error) {
    console.error('Error getting communication analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST quick communication templates
router.post('/quick/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    const { lead_id, content, outcome, next_follow_up_date } = req.body;

    if (!lead_id) {
      return res.status(400).json({ error: 'Lead ID is required' });
    }

    // Verify lead exists
    const lead = await Lead.getById(lead_id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Quick communication templates
    const templates = {
      'call_completed': {
        communication_type: 'call',
        direction: 'outbound',
        subject: 'Call completed',
        content: content || 'Follow-up call completed',
        outcome: outcome || 'follow_up'
      },
      'email_sent': {
        communication_type: 'email',
        direction: 'outbound',
        subject: 'Email sent',
        content: content || 'Follow-up email sent',
        outcome: outcome || 'pending_response'
      },
      'whatsapp_sent': {
        communication_type: 'whatsapp',
        direction: 'outbound',
        subject: 'WhatsApp message sent',
        content: content || 'WhatsApp message sent',
        outcome: outcome || 'pending_response'
      },
      'meeting_scheduled': {
        communication_type: 'meeting',
        direction: 'outbound',
        subject: 'Meeting scheduled',
        content: content || 'Meeting scheduled with client',
        outcome: 'meeting_scheduled'
      }
    };

    const template = templates[type];
    if (!template) {
      return res.status(400).json({ error: 'Invalid quick communication type' });
    }

    // Create communication with template
    const communicationData = {
      ...template,
      lead_id,
      lead_name: lead.name,
      created_by: req.user.email,
      created_by_name: req.user.name || await getUserName(req.user.email),
      next_follow_up_date: next_follow_up_date
    };

    const communication = new Communication(communicationData);
    const savedCommunication = await communication.save();

    console.log(`Quick communication created: ${type} for lead: ${lead_id}`);
    res.status(201).json({ 
      data: savedCommunication,
      message: `${type.replace('_', ' ')} logged successfully` 
    });
  } catch (error) {
    console.error('Error creating quick communication:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET recent activity feed
router.get('/feed/recent', authenticateToken, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    // If not admin/super_admin, restrict to their own communications
    let userFilter = null;
    if (!['super_admin', 'admin'].includes(req.user.role)) {
      userFilter = req.user.email;
    }

    const communications = await Communication.getRecent(parseInt(limit), userFilter);
    
    // Enrich with lead information for the feed
    const enrichedCommunications = await Promise.all(
      communications.map(async (comm) => {
        try {
          const lead = await Lead.getById(comm.lead_id);
          return {
            ...comm,
            lead_info: lead ? {
              name: lead.name,
              email: lead.email,
              status: lead.status,
              assigned_to: lead.assigned_to
            } : null
          };
        } catch (error) {
          console.error('Error enriching communication with lead info:', error);
          return comm;
        }
      })
    );

    console.log(`Recent activity feed: ${enrichedCommunications.length} items`);
    res.json({ data: enrichedCommunications });
  } catch (error) {
    console.error('Error fetching recent activity feed:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET communication types and outcomes for dropdowns
router.get('/meta/options', authenticateToken, async (req, res) => {
  try {
    const options = {
      communication_types: [
        { value: 'call', label: 'Phone Call', icon: '📞' },
        { value: 'email', label: 'Email', icon: '📧' },
        { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
        { value: 'meeting', label: 'Meeting', icon: '🤝' },
        { value: 'sms', label: 'SMS', icon: '📱' },
        { value: 'in_person', label: 'In Person', icon: '👥' },
        { value: 'video_call', label: 'Video Call', icon: '📹' }
      ],
      directions: [
        { value: 'outbound', label: 'Outbound (We contacted them)', icon: '📤' },
        { value: 'inbound', label: 'Inbound (They contacted us)', icon: '📥' }
      ],
      outcomes: [
        { value: 'interested', label: 'Interested', color: 'green' },
        { value: 'not_interested', label: 'Not Interested', color: 'red' },
        { value: 'follow_up', label: 'Follow Up Required', color: 'yellow' },
        { value: 'closed', label: 'Closed/Completed', color: 'gray' },
        { value: 'pending_response', label: 'Pending Response', color: 'blue' },
        { value: 'meeting_scheduled', label: 'Meeting Scheduled', color: 'purple' },
        { value: 'quote_requested', label: 'Quote Requested', color: 'orange' },
        { value: 'objection_raised', label: 'Objection Raised', color: 'red' },
        { value: 'price_negotiation', label: 'Price Negotiation', color: 'yellow' }
      ],
      temperatures: [
        { value: 'hot', label: 'Hot', color: 'red', description: 'Ready to buy soon' },
        { value: 'warm', label: 'Warm', color: 'orange', description: 'Interested, needs nurturing' },
        { value: 'cold', label: 'Cold', color: 'blue', description: 'Low interest, long-term' }
      ],
      priorities: [
        { value: 'urgent', label: 'Urgent', color: 'red' },
        { value: 'high', label: 'High', color: 'orange' },
        { value: 'medium', label: 'Medium', color: 'yellow' },
        { value: 'low', label: 'Low', color: 'green' }
      ]
    };

    res.json({ data: options });
  } catch (error) {
    console.error('Error fetching communication options:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
