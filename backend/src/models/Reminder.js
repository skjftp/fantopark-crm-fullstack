const { db, collections } = require('../config/db');

class Reminder {
  constructor(data) {
    // Core reminder fields
    this.lead_id = data.lead_id; // Required - which lead this reminder is for
    this.client_id = data.client_id || null; // Optional - for client-level reminders
    this.assigned_to = data.assigned_to; // Required - who should be reminded
    this.reminder_type = data.reminder_type || 'follow_up'; // follow_up, call_back, quote_follow_up, etc.
    
    // Timing fields
    this.due_date = data.due_date; // Required - when reminder is due
    this.created_date = data.created_date || new Date().toISOString();
    this.updated_date = new Date().toISOString();
    
    // Status and priority
    this.status = data.status || 'pending'; // pending, completed, snoozed, overdue, cancelled
    this.priority = data.priority || 'medium'; // low, medium, high, urgent
    this.is_overdue = data.is_overdue || false;
    
    // Content and context
    this.title = data.title || 'Follow-up required';
    this.description = data.description || '';
    this.auto_generated = data.auto_generated || false; // Was this created automatically?
    
    // Action tracking
    this.completed_date = data.completed_date || null;
    this.completed_by = data.completed_by || null;
    this.completion_notes = data.completion_notes || '';
    
    // Snooze functionality
    this.snoozed_until = data.snoozed_until || null;
    this.snooze_count = data.snooze_count || 0;
    
    // Escalation
    this.escalated = data.escalated || false;
    this.escalated_to = data.escalated_to || null;
    this.escalated_date = data.escalated_date || null;
    
    // Metadata
    this.lead_status_at_creation = data.lead_status_at_creation || '';
    this.reminder_rules_used = data.reminder_rules_used || null;
  }

  // Save reminder to database
  async save() {
    const docRef = await db.collection('crm_reminders').add({...this});
    return { id: docRef.id, ...this };
  }

  // Static methods for reminder management
  static async getAll(filters = {}) {
    let query = db.collection('crm_reminders');

    // Apply filters
    if (filters.assigned_to) {
      query = query.where('assigned_to', '==', filters.assigned_to);
    }
    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }
    if (filters.is_overdue !== undefined) {
      query = query.where('is_overdue', '==', filters.is_overdue);
    }
    if (filters.reminder_type) {
      query = query.where('reminder_type', '==', filters.reminder_type);
    }

    const snapshot = await query.orderBy('due_date', 'asc').get();
    const reminders = [];
    snapshot.forEach(doc => {
      reminders.push({ id: doc.id, ...doc.data() });
    });
    
    return reminders;
  }

  static async getById(id) {
    const doc = await db.collection('crm_reminders').doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  static async getByLeadId(leadId) {
    const snapshot = await db.collection('crm_reminders')
      .where('lead_id', '==', leadId)
      .orderBy('due_date', 'asc')
      .get();
    
    const reminders = [];
    snapshot.forEach(doc => {
      reminders.push({ id: doc.id, ...doc.data() });
    });
    
    return reminders;
  }

  static async update(id, data) {
    const updateData = { ...data, updated_date: new Date().toISOString() };
    await db.collection('crm_reminders').doc(id).update(updateData);
    
    const doc = await db.collection('crm_reminders').doc(id).get();
    return { id: doc.id, ...doc.data() };
  }

  static async delete(id) {
    await db.collection('crm_reminders').doc(id).delete();
    return { success: true };
  }

  // Mark reminder as completed
  static async complete(id, completedBy, notes = '') {
    const updateData = {
      status: 'completed',
      completed_date: new Date().toISOString(),
      completed_by: completedBy,
      completion_notes: notes,
      updated_date: new Date().toISOString()
    };
    
    await db.collection('crm_reminders').doc(id).update(updateData);
    return { success: true };
  }

  // Snooze reminder
  static async snooze(id, snoozeUntil) {
    const reminder = await this.getById(id);
    if (!reminder) throw new Error('Reminder not found');
    
    const updateData = {
      status: 'snoozed',
      snoozed_until: snoozeUntil,
      snooze_count: (reminder.snooze_count || 0) + 1,
      is_overdue: false, // Reset overdue status when snoozed
      updated_date: new Date().toISOString()
    };
    
    await db.collection('crm_reminders').doc(id).update(updateData);
    return { success: true };
  }

  // Escalate reminder
  static async escalate(id, escalatedTo, reason = '') {
    const updateData = {
      escalated: true,
      escalated_to: escalatedTo,
      escalated_date: new Date().toISOString(),
      priority: 'urgent', // Escalated reminders become urgent
      description: reason ? `${reason}\n\n(Original reminder escalated)` : 'Escalated reminder',
      updated_date: new Date().toISOString()
    };
    
    await db.collection('crm_reminders').doc(id).update(updateData);
    return { success: true };
  }

  // Update overdue status for all reminders
  static async updateOverdueStatus() {
    const now = new Date().toISOString();
    
    // Get all pending or snoozed reminders
    const snapshot = await db.collection('crm_reminders')
      .where('status', 'in', ['pending', 'snoozed'])
      .get();
    
    const batch = db.batch();
    let updatedCount = 0;
    
    snapshot.forEach(doc => {
      const reminder = doc.data();
      const checkDate = reminder.status === 'snoozed' ? reminder.snoozed_until : reminder.due_date;
      
      if (checkDate && checkDate < now) {
        // This reminder is overdue
        batch.update(doc.ref, {
          is_overdue: true,
          status: 'pending', // Reset snoozed reminders to pending when they become overdue
          updated_date: now
        });
        updatedCount++;
      }
    });
    
    if (updatedCount > 0) {
      await batch.commit();
    }
    
    return { updated: updatedCount };
  }
}
