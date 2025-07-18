const express = require('express');
const router = express.Router();
const Reminder = require('../models/Reminder');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// GET all reminders with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    // console.log('Fetching reminders with filters:', req.query);
    
    // Users can only see their own reminders unless they're managers
    let filters = { ...req.query };
    
    // If not a manager, filter to only show user's reminders
    if (!['sales_manager', 'admin', 'super_admin'].includes(req.user.role)) {
      filters.assigned_to = req.user.email;
    }
    
    const reminders = await Reminder.getAll(filters);
    
    // Update overdue status before returning
    await Reminder.updateOverdueStatus();
    
    console.log(`Found ${reminders.length} reminders`);
    res.json({ data: reminders });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET reminders for specific lead
router.get('/lead/:leadId', authenticateToken, async (req, res) => {
  try {
    const leadId = req.params.leadId;
    console.log('Fetching reminders for lead:', leadId);
    
    const reminders = await Reminder.getByLeadId(leadId);
    
    console.log(`Found ${reminders.length} reminders for lead ${leadId}`);
    res.json({ data: reminders });
  } catch (error) {
    console.error('Error fetching lead reminders:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET single reminder
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const reminder = await Reminder.getById(req.params.id);
    
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    // Check if user can access this reminder
    if (reminder.assigned_to !== req.user.email && 
        !['sales_manager', 'admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({ data: reminder });
  } catch (error) {
    console.error('Error fetching reminder:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST create new reminder
router.post('/', authenticateToken, checkPermission('leads', 'write'), async (req, res) => {
  try {
    console.log('Creating reminder:', req.body);
    
    const reminderData = {
      ...req.body,
      auto_generated: false // Manual reminders
    };
    
    const reminder = new Reminder(reminderData);
    const savedReminder = await reminder.save();
    
    console.log('Reminder created:', savedReminder.id);
    res.status(201).json({ data: savedReminder });
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update reminder
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const reminderId = req.params.id;
    const reminder = await Reminder.getById(reminderId);
    
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    // Check if user can modify this reminder
    if (reminder.assigned_to !== req.user.email && 
        !['sales_manager', 'admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updatedReminder = await Reminder.update(reminderId, req.body);
    
    console.log('Reminder updated:', reminderId);
    res.json({ data: updatedReminder });
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST complete reminder
router.post('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const reminderId = req.params.id;
    const { notes } = req.body;
    
    const reminder = await Reminder.getById(reminderId);
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    // Check if user can complete this reminder
    if (reminder.assigned_to !== req.user.email && 
        !['sales_manager', 'admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await Reminder.complete(reminderId, req.user.email, notes || '');
    
    console.log('Reminder completed:', reminderId);
    res.json({ success: true, message: 'Reminder marked as completed' });
  } catch (error) {
    console.error('Error completing reminder:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST snooze reminder
router.post('/:id/snooze', authenticateToken, async (req, res) => {
  try {
    const reminderId = req.params.id;
    const { snooze_until } = req.body;
    
    if (!snooze_until) {
      return res.status(400).json({ error: 'snooze_until date is required' });
    }
    
    const reminder = await Reminder.getById(reminderId);
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    // Check if user can snooze this reminder
    if (reminder.assigned_to !== req.user.email && 
        !['sales_manager', 'admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await Reminder.snooze(reminderId, snooze_until);
    
    console.log('Reminder snoozed:', reminderId, 'until:', snooze_until);
    res.json({ success: true, message: 'Reminder snoozed successfully' });
  } catch (error) {
    console.error('Error snoozing reminder:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST escalate reminder
router.post('/:id/escalate', authenticateToken, checkPermission('leads', 'assign'), async (req, res) => {
  try {
    const reminderId = req.params.id;
    const { escalate_to, reason } = req.body;
    
    if (!escalate_to) {
      return res.status(400).json({ error: 'escalate_to is required' });
    }
    
    const reminder = await Reminder.getById(reminderId);
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    await Reminder.escalate(reminderId, escalate_to, reason || '');
    
    console.log('Reminder escalated:', reminderId, 'to:', escalate_to);
    res.json({ success: true, message: 'Reminder escalated successfully' });
  } catch (error) {
    console.error('Error escalating reminder:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE reminder
router.delete('/:id', authenticateToken, checkPermission('leads', 'delete'), async (req, res) => {
  try {
    const reminderId = req.params.id;
    
    const reminder = await Reminder.getById(reminderId);
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    await Reminder.delete(reminderId);
    
    console.log('Reminder deleted:', reminderId);
    res.json({ success: true, message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET reminder statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    // Get all reminders (managers see all, others see only theirs)
    let filters = {};
    if (!['sales_manager', 'admin', 'super_admin'].includes(req.user.role)) {
      filters.assigned_to = req.user.email;
    }
    
    const allReminders = await Reminder.getAll(filters);
    
    // Update overdue status
    await Reminder.updateOverdueStatus();
    
    const stats = {
      total_reminders: allReminders.length,
      pending: allReminders.filter(r => r.status === 'pending').length,
      overdue: allReminders.filter(r => r.is_overdue).length,
      completed_today: allReminders.filter(r => {
        if (r.status !== 'completed' || !r.completed_date) return false;
        const today = new Date().toISOString().split('T')[0];
        const completedDate = r.completed_date.split('T')[0];
        return completedDate === today;
      }).length,
      due_today: allReminders.filter(r => {
        if (r.status !== 'pending') return false;
        const today = new Date().toISOString().split('T')[0];
        const dueDate = r.due_date ? r.due_date.split('T')[0] : null;
        return dueDate === today;
      }).length,
      by_priority: {
        urgent: allReminders.filter(r => r.priority === 'urgent' && r.status === 'pending').length,
        high: allReminders.filter(r => r.priority === 'high' && r.status === 'pending').length,
        medium: allReminders.filter(r => r.priority === 'medium' && r.status === 'pending').length,
        low: allReminders.filter(r => r.priority === 'low' && r.status === 'pending').length
      },
      by_type: {}
    };
    
    // Calculate type distribution
    allReminders.filter(r => r.status === 'pending').forEach(reminder => {
      const type = reminder.reminder_type || 'follow_up';
      stats.by_type[type] = (stats.by_type[type] || 0) + 1;
    });
    
    res.json({ data: stats });
  } catch (error) {
    console.error('Error getting reminder stats:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// 3. AUTOMATIC REMINDER GENERATION LOGIC
// This will be added to your existing Lead model and routes

// Add these methods to your Lead model (backend/src/models/Lead.js):

// Add this to Lead class:
static async createAutoReminder(leadId, leadData, reminderType = 'follow_up') {
  const Reminder = require('./Reminder');
  
  // Define reminder rules based on lead status and type
  const reminderRules = {
    'unassigned': { days: 0, priority: 'high', title: 'Assign this lead' },
    'assigned': { days: 1, priority: 'medium', title: 'Initial contact required' },
    'contacted': { days: 2, priority: 'medium', title: 'Follow up on initial contact' },
    'attempt_1': { days: 1, priority: 'medium', title: 'Second contact attempt' },
    'attempt_2': { days: 1, priority: 'high', title: 'Third contact attempt' },
    'attempt_3': { days: 2, priority: 'high', title: 'Final contact attempt' },
    'qualified': { days: 3, priority: 'medium', title: 'Nurture qualified lead' },
    'hot': { days: 1, priority: 'urgent', title: 'Priority follow-up - Hot lead' },
    'warm': { days: 2, priority: 'high', title: 'Follow up warm lead' },
    'cold': { days: 7, priority: 'low', title: 'Check in with cold lead' },
    'quote_requested': { days: 1, priority: 'urgent', title: 'Provide quote' }
  };
  
  const rule = reminderRules[leadData.status];
  if (!rule || !leadData.assigned_to) {
    return null; // No reminder needed or no one to assign to
  }
  
  // Calculate due date
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + rule.days);
  
  // Create reminder
  const reminderData = {
    lead_id: leadId,
    assigned_to: leadData.assigned_to,
    reminder_type: reminderType,
    due_date: dueDate.toISOString(),
    priority: rule.priority,
    title: rule.title,
    description: `Automatic reminder for lead: ${leadData.name} (${leadData.email})`,
    auto_generated: true,
    lead_status_at_creation: leadData.status,
    reminder_rules_used: rule
  };
  
  try {
    const reminder = new Reminder(reminderData);
    const savedReminder = await reminder.save();
    console.log('Auto-reminder created:', savedReminder.id, 'for lead:', leadId);
    return savedReminder;
  } catch (error) {
    console.error('Failed to create auto-reminder:', error);
    return null;
  }
};

module.exports = router;
