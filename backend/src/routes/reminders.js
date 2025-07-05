const express = require('express');
const router = express.Router();
const Reminder = require('../models/Reminder');
const { authenticateToken } = require('../middleware/auth');

// Helper function for permission checks
const checkPermission = (module, action) => {
  return (req, res, next) => {
    // For now, allow all authenticated users to access reminders
    // You can add more granular permissions later
    next();
  };
};

// GET all reminders with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const filters = req.query;
    
    // Filter reminders based on user role
    if (!['sales_manager', 'admin', 'super_admin'].includes(req.user.role)) {
      filters.assigned_to = req.user.email;
    }
    
    const reminders = await Reminder.getAll(filters);
    res.json({ data: reminders });
  } catch (error) {
    console.error('Error fetching reminders:', error);
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

// GET reminders by lead ID
router.get('/lead/:leadId', authenticateToken, async (req, res) => {
  try {
    const reminders = await Reminder.getByLead(req.params.leadId);
    res.json({ data: reminders });
  } catch (error) {
    console.error('Error fetching lead reminders:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST create new reminder
router.post('/', authenticateToken, checkPermission('leads', 'write'), async (req, res) => {
  try {
    console.log('Creating reminder:', req.body);
    
    const reminderData = {
      ...req.body,
      auto_generated: false,
      created_by: req.user.email
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
    res.json({ success: true, message: 'Reminder completed successfully' });
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
      return res.status(400).json({ error: 'snooze_until is required' });
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

// DELETE reminder
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const reminderId = req.params.id;
    
    const reminder = await Reminder.getById(reminderId);
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    // Check permissions
    if (reminder.assigned_to !== req.user.email && 
        !['sales_manager', 'admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
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
    let filters = {};
    
    // Filter by user role
    if (!['sales_manager', 'admin', 'super_admin'].includes(req.user.role)) {
      filters.assigned_to = req.user.email;
    }
    
    const allReminders = await Reminder.getAll(filters);
    const now = new Date();
    
    const stats = {
      total: allReminders.length,
      pending: allReminders.filter(r => r.status === 'pending').length,
      completed: allReminders.filter(r => r.status === 'completed').length,
      overdue: allReminders.filter(r => 
        r.status === 'pending' && new Date(r.due_date) < now
      ).length,
      due_today: allReminders.filter(r => {
        if (r.status !== 'pending') return false;
        const dueDate = new Date(r.due_date);
        const today = new Date();
        return dueDate.toDateString() === today.toDateString();
      }).length
    };
    
    res.json({ data: stats });
  } catch (error) {
    console.error('Error fetching reminder stats:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
