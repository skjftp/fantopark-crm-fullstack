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
// Supported filters:
// - status: all, pending, completed, snoozed, overdue
// - priority: all, urgent, high, medium, low
// - reminder_type: all, follow_up, call_back, quote_follow_up, manual
// - date_filter: all, overdue, today, tomorrow, week, month
// - search: text search across title, description
// - sort_by: due_date, priority, created_date
// - sort_order: asc, desc
router.get('/', authenticateToken, async (req, res) => {
  try {
    const filters = { ...req.query };
    
    // Filter reminders based on user role
    if (!['sales_manager', 'admin', 'super_admin'].includes(req.user.role)) {
      filters.assigned_to = req.user.email;
    }
    
    // Handle special date filters
    if (filters.date_filter) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today.getTime() + 24*60*60*1000);
      
      switch(filters.date_filter) {
        case 'overdue':
          filters.due_date_before = now.toISOString();
          filters.status = 'pending';
          break;
        case 'today':
          filters.due_date_start = today.toISOString();
          filters.due_date_end = tomorrow.toISOString();
          break;
        case 'tomorrow':
          filters.due_date_start = tomorrow.toISOString();
          filters.due_date_end = new Date(tomorrow.getTime() + 24*60*60*1000).toISOString();
          break;
        case 'week':
          filters.due_date_start = today.toISOString();
          filters.due_date_end = new Date(today.getTime() + 7*24*60*60*1000).toISOString();
          break;
        case 'month':
          filters.due_date_start = today.toISOString();
          filters.due_date_end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();
          break;
      }
      delete filters.date_filter; // Remove the processed filter
    }
    
    // Handle status filter for overdue
    if (filters.status === 'overdue') {
      filters.status = 'pending';
      filters.is_overdue = true;
    }
    
    // Validate sort parameters
    const validSortFields = ['due_date', 'priority', 'created_date'];
    const validSortOrders = ['asc', 'desc'];
    
    if (filters.sort_by && !validSortFields.includes(filters.sort_by)) {
      filters.sort_by = 'due_date'; // Default sort field
    }
    
    if (filters.sort_order && !validSortOrders.includes(filters.sort_order)) {
      filters.sort_order = 'asc'; // Default sort order
    }
    
    console.log('Fetching reminders with filters:', filters);
    
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
    
    // Filter based on user role if needed
    let filteredReminders = reminders;
    if (!['sales_manager', 'admin', 'super_admin'].includes(req.user.role)) {
      filteredReminders = reminders.filter(r => r.assigned_to === req.user.email);
    }
    
    res.json({ data: filteredReminders });
  } catch (error) {
    console.error('Error fetching lead reminders:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST create new reminder
router.post('/', authenticateToken, checkPermission('leads', 'write'), async (req, res) => {
  try {
    console.log('Creating reminder:', req.body);
    
    // Validate required fields
    const requiredFields = ['lead_id', 'assigned_to', 'due_date'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }
    
    // Validate priority
    const validPriorities = ['urgent', 'high', 'medium', 'low'];
    if (req.body.priority && !validPriorities.includes(req.body.priority)) {
      return res.status(400).json({ error: 'Invalid priority value' });
    }
    
    // Validate reminder type
    const validTypes = ['follow_up', 'call_back', 'quote_follow_up', 'manual'];
    if (req.body.reminder_type && !validTypes.includes(req.body.reminder_type)) {
      return res.status(400).json({ error: 'Invalid reminder type' });
    }
    
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
    
    // Validate priority if provided
    if (req.body.priority) {
      const validPriorities = ['urgent', 'high', 'medium', 'low'];
      if (!validPriorities.includes(req.body.priority)) {
        return res.status(400).json({ error: 'Invalid priority value' });
      }
    }
    
    // Validate status if provided
    if (req.body.status) {
      const validStatuses = ['pending', 'completed', 'snoozed', 'cancelled'];
      if (!validStatuses.includes(req.body.status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
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
    
    // Validate snooze_until is a future date
    const snoozeDate = new Date(snooze_until);
    if (snoozeDate <= new Date()) {
      return res.status(400).json({ error: 'snooze_until must be a future date' });
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

// GET reminder statistics with filter support
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    let filters = { ...req.query };
    
    // Filter by user role
    if (!['sales_manager', 'admin', 'super_admin'].includes(req.user.role)) {
      filters.assigned_to = req.user.email;
    }
    
    const allReminders = await Reminder.getAll(filters);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24*60*60*1000);
    
    const stats = {
      total: allReminders.length,
      pending: allReminders.filter(r => r.status === 'pending').length,
      completed: allReminders.filter(r => r.status === 'completed').length,
      snoozed: allReminders.filter(r => r.status === 'snoozed').length,
      overdue: allReminders.filter(r => 
        r.status === 'pending' && new Date(r.due_date) < now
      ).length,
      due_today: allReminders.filter(r => {
        if (r.status !== 'pending') return false;
        const dueDate = new Date(r.due_date);
        return dueDate >= today && dueDate < tomorrow;
      }).length,
      by_priority: {
        urgent: allReminders.filter(r => r.priority === 'urgent').length,
        high: allReminders.filter(r => r.priority === 'high').length,
        medium: allReminders.filter(r => r.priority === 'medium').length,
        low: allReminders.filter(r => r.priority === 'low').length
      },
      by_type: {
        follow_up: allReminders.filter(r => r.reminder_type === 'follow_up').length,
        call_back: allReminders.filter(r => r.reminder_type === 'call_back').length,
        quote_follow_up: allReminders.filter(r => r.reminder_type === 'quote_follow_up').length,
        manual: allReminders.filter(r => r.reminder_type === 'manual').length
      }
    };
    
    res.json({ data: stats });
  } catch (error) {
    console.error('Error fetching reminder stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET reminders search
// This endpoint specifically handles text search across reminders
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q, ...otherFilters } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query (q) is required' });
    }
    
    const filters = {
      ...otherFilters,
      search: q.trim()
    };
    
    // Filter by user role
    if (!['sales_manager', 'admin', 'super_admin'].includes(req.user.role)) {
      filters.assigned_to = req.user.email;
    }
    
    console.log('Searching reminders with query:', q);
    
    const reminders = await Reminder.getAll(filters);
    res.json({ data: reminders });
  } catch (error) {
    console.error('Error searching reminders:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
