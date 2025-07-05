const { db, collections } = require('../config/db');

class Lead {
  constructor(data) {
    // Basic Contact Information - matching v4working exactly (YOUR EXISTING FIELDS)
    this.name = data.name;
    this.email = data.email;
    this.phone = data.phone;
    this.company = data.company || '';
    this.business_type = data.business_type || 'B2C';
    
    // Lead Source & Initial Contact (YOUR EXISTING FIELDS)
    this.source = data.source || '';
    this.date_of_enquiry = data.date_of_enquiry;
    this.first_touch_base_done_by = data.first_touch_base_done_by || '';
    
    // Location Information (YOUR EXISTING FIELDS)
    this.city_of_residence = data.city_of_residence || '';
    this.country_of_residence = data.country_of_residence || 'India';
    
    // Event & Travel Details (YOUR EXISTING FIELDS)
    this.lead_for_event = data.lead_for_event || '';
    this.number_of_people = data.number_of_people || 1;
    this.has_valid_passport = data.has_valid_passport || 'Not Sure';
    this.visa_available = data.visa_available || 'Not Required';
    
    // Experience & Background (YOUR EXISTING FIELDS)
    this.attended_sporting_event_before = data.attended_sporting_event_before || 'No';
    
    // Business & Financial Information (YOUR EXISTING FIELDS)
    this.annual_income_bracket = data.annual_income_bracket || '';
    this.potential_value = data.potential_value || 0;
    
    // Sales Information (YOUR EXISTING FIELDS)
    this.status = data.status || 'unassigned';
    this.assigned_to = data.assigned_to || '';
    this.last_quoted_price = data.last_quoted_price || 0;
    
    // Additional (YOUR EXISTING FIELDS)
    this.notes = data.notes || '';
    this.created_date = data.created_date || new Date().toISOString();
    this.updated_date = new Date().toISOString();

    // ===== CLIENT MANAGEMENT FIELDS (YOUR EXISTING) =====
    this.client_id = data.client_id || this.generateClientId(data.phone);
    this.is_primary_lead = data.is_primary_lead || false;
    this.client_total_leads = data.client_total_leads || 1;
    this.client_events = data.client_events || (data.lead_for_event ? [data.lead_for_event] : []);
    this.client_first_contact = data.client_first_contact || this.created_date;
    this.client_last_activity = data.client_last_activity || this.created_date;
    this.manual_assignment_override = data.manual_assignment_override || false;
  }

  // ===== YOUR EXISTING METHODS (UNCHANGED) =====

  static async getAll(filters = {}) {
    let query = db.collection(collections.leads);
    
    // Apply filters
    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }
    if (filters.assigned_to) {
      query = query.where('assigned_to', '==', filters.assigned_to);
    }
    
    const snapshot = await query.orderBy('created_date', 'desc').get();
    const leads = [];
    snapshot.forEach(doc => {
      leads.push({ id: doc.id, ...doc.data() });
    });
    return leads;
  }

  static async getById(id) {
    const doc = await db.collection(collections.leads).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  // ENHANCED: Save method with auto-reminder support
  async save() {
    try {
      const isNew = !this.id;
      
      // Save the lead
      const docRef = await db.collection(collections.leads).add({...this});
      const savedLead = { id: docRef.id, ...this };
      
      // NEW: Auto-reminder logic for new leads
      if (isNew) {
        console.log(`🆕 New lead created: ${docRef.id} with status: ${this.status}`);
        try {
          await Lead.createAutoReminder(docRef.id, savedLead);
        } catch (reminderError) {
          console.error('⚠️ Auto-reminder creation failed (non-critical):', reminderError.message);
          // Don't fail the lead creation if reminder fails
        }
      }

      return savedLead;
    } catch (error) {
      console.error('Error saving lead:', error);
      throw error;
    }
  }

  // ENHANCED: Update method with auto-reminder support
  static async update(id, data) {
    try {
      // Get current lead to compare status changes
      const currentLead = await Lead.getById(id);
      if (!currentLead) {
        throw new Error('Lead not found');
      }

      const oldStatus = currentLead.status;
      const newStatus = data.status;
      
      // Update the lead
      const updateData = { ...data, updated_date: new Date().toISOString() };
      await db.collection(collections.leads).doc(id).update(updateData);
      
      // Fetch the updated lead
      const updatedLead = await Lead.getById(id);
      
      // NEW: Auto-reminder logic for status changes
      if (newStatus && newStatus !== oldStatus) {
        console.log(`📝 Lead status changed: ${id} from ${oldStatus} to ${newStatus}`);
        
        try {
          // Cancel old reminders
          await Lead.cancelOldReminders(id, newStatus);
          
          // Create new reminder for new status
          await Lead.createAutoReminder(id, updatedLead);
        } catch (reminderError) {
          console.error('⚠️ Auto-reminder update failed (non-critical):', reminderError.message);
          // Don't fail the lead update if reminder fails
        }
      }

      return updatedLead;
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  }

  static async delete(id) {
    await db.collection(collections.leads).doc(id).delete();
    return { success: true };
  }

  // ===== NEW AUTO-REMINDER METHODS =====

  // Create automatic reminder when lead status changes
  static async createAutoReminder(leadId, leadData, reminderType = 'follow_up') {
    // Dynamically import Reminder to avoid circular dependency
    const Reminder = require('./Reminder');
    
    // Define reminder rules based on lead status
    const reminderRules = {
      'unassigned': { 
        days: 0, 
        hours: 1, 
        priority: 'high', 
        title: 'Assign this lead',
        description: 'This lead needs to be assigned to a sales person'
      },
      'assigned': { 
        days: 1, 
        hours: 0, 
        priority: 'medium', 
        title: 'Initial contact required',
        description: 'Make first contact with this lead'
      },
      'contacted': { 
        days: 2, 
        hours: 0, 
        priority: 'medium', 
        title: 'Follow up on initial contact',
        description: 'Follow up on the initial conversation'
      },
      'attempt_1': { 
        days: 1, 
        hours: 0, 
        priority: 'medium', 
        title: 'Second contact attempt',
        description: 'Make second contact attempt'
      },
      'attempt_2': { 
        days: 1, 
        hours: 0, 
        priority: 'high', 
        title: 'Third contact attempt',
        description: 'Make third contact attempt - lead getting cold'
      },
      'attempt_3': { 
        days: 2, 
        hours: 0, 
        priority: 'high', 
        title: 'Final contact attempt',
        description: 'Last attempt before marking lead as cold'
      },
      'hot': { 
        days: 1, 
        hours: 0, 
        priority: 'urgent', 
        title: 'Priority follow-up - Hot lead',
        description: 'This is a hot lead - follow up immediately'
      },
      'warm': { 
        days: 2, 
        hours: 0, 
        priority: 'high', 
        title: 'Follow up warm lead',
        description: 'Follow up with this warm lead'
      },
      'cold': { 
        days: 7, 
        hours: 0, 
        priority: 'low', 
        title: 'Check in with cold lead',
        description: 'Periodic check-in with cold lead'
      },
      'quote_requested': { 
        days: 1, 
        hours: 0, 
        priority: 'urgent', 
        title: 'Provide quote',
        description: 'Customer has requested a quote - respond urgently'
      },
      'qualified': { 
        days: 3, 
        hours: 0, 
        priority: 'medium', 
        title: 'Nurture qualified lead',
        description: 'Continue nurturing this qualified lead'
      },
      'new': { 
        days: 1, 
        hours: 0, 
        priority: 'medium', 
        title: 'Process new lead',
        description: 'Review and assign this new lead'
      }
    };
    
    const rule = reminderRules[leadData.status];
    if (!rule) {
      console.log(`No reminder rule for status: ${leadData.status}`);
      return null;
    }

    // Don't create reminders for completed statuses
    const completedStatuses = ['converted', 'payment_received', 'closed', 'cancelled', 'won', 'lost'];
    if (completedStatuses.includes(leadData.status)) {
      console.log(`No reminder needed for completed status: ${leadData.status}`);
      return null;
    }

    // Don't create reminder if no one is assigned (except for unassigned status)
    if (leadData.status !== 'unassigned' && !leadData.assigned_to) {
      console.log('No reminder created - no assigned user');
      return null;
    }
    
    // Calculate due date
    const dueDate = new Date();
    if (rule.days > 0) {
      dueDate.setDate(dueDate.getDate() + rule.days);
    }
    if (rule.hours > 0) {
      dueDate.setHours(dueDate.getHours() + rule.hours);
    }
    
    // Create reminder data
    const reminderData = {
      lead_id: leadId,
      assigned_to: leadData.assigned_to || 'unassigned',
      type: reminderType,
      title: rule.title,
      description: rule.description + ` - Lead: ${leadData.name} (${leadData.email || leadData.phone})`,
      due_date: dueDate.toISOString(),
      priority: rule.priority,
      status: 'pending',
      auto_generated: true,
      lead_status_when_created: leadData.status,
      reminder_rule: rule,
      created_by: 'system',
      notes: `Auto-generated reminder for lead status: ${leadData.status}`
    };
    
    try {
      const reminder = new Reminder(reminderData);
      const savedReminder = await reminder.save();
      console.log(`✅ Auto-reminder created: ${savedReminder.id} for lead: ${leadId} (${leadData.status})`);
      return savedReminder;
    } catch (error) {
      console.error('❌ Failed to create auto-reminder:', error);
      return null;
    }
  }

  // Cancel old reminders when lead status changes
  static async cancelOldReminders(leadId, newStatus) {
    try {
      // Dynamically import Reminder to avoid circular dependency
      const Reminder = require('./Reminder');
      
      // Get all pending reminders for this lead
      const reminders = await Reminder.getByLead(leadId);
      const pendingReminders = reminders.filter(r => r.status === 'pending');
      
      if (pendingReminders.length === 0) {
        return;
      }

      // Cancel all pending reminders
      for (const reminder of pendingReminders) {
        await Reminder.update(reminder.id, {
          status: 'cancelled',
          cancelled_date: new Date().toISOString(),
          cancelled_reason: `Lead status changed to: ${newStatus}`,
          notes: (reminder.notes || '') + ` | Cancelled due to status change to: ${newStatus}`
        });
      }
      
      console.log(`✅ Cancelled ${pendingReminders.length} old reminders for lead: ${leadId}`);
    } catch (error) {
      console.error('❌ Failed to cancel old reminders:', error);
    }
  }

  // ===== YOUR EXISTING CLIENT MANAGEMENT METHODS (UNCHANGED) =====

  // Generate consistent client ID from phone number
  generateClientId(phone) {
    if (!phone) return `client_unknown_${Date.now()}`;
    
    const cleanPhone = this.normalizePhone(phone);
    return `client_${cleanPhone}`;
  }

  // Normalize phone number for consistent matching
  normalizePhone(phone) {
    if (!phone) return '';
    
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Handle Indian numbers (+91, 0, or direct 10 digits)
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      cleaned = cleaned.substring(2); // Remove country code
    }
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      cleaned = cleaned.substring(1); // Remove leading 0
    }
    
    return cleaned; // Should be 10 digits for Indian numbers
  }

  // Check if two phone numbers are the same
  static phoneMatches(phone1, phone2) {
    const lead = new Lead({ phone: phone1 });
    const normalized1 = lead.normalizePhone(phone1);
    const normalized2 = lead.normalizePhone(phone2);
    return normalized1 === normalized2 && normalized1.length >= 10;
  }

  // Find existing client by phone number
  static async findClientByPhone(phone) {
    if (!phone) return { exists: false };

    const lead = new Lead({ phone });
    const clientId = lead.generateClientId(phone);
    
    try {
      const existingLeads = await db.collection(collections.leads)
        .where('client_id', '==', clientId)
        .get();
      
      if (existingLeads.empty) {
        return { exists: false };
      }
      
      const leads = existingLeads.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const primaryLead = leads.find(l => l.is_primary_lead) || leads[0];
      
      return {
        exists: true,
        client_id: clientId,
        total_leads: leads.length,
        primary_assigned_to: primaryLead.assigned_to,
        first_contact: primaryLead.created_date,
        events: [...new Set(leads.map(l => l.lead_for_event))],
        leads: leads.map(l => ({
          id: l.id,
          event: l.lead_for_event,
          status: l.status,
          created_date: l.created_date,
          potential_value: l.potential_value
        }))
      };
    } catch (error) {
      console.error('Error finding client by phone:', error);
      return { exists: false, error: error.message };
    }
  }

  // Update client metadata for all leads of this client
  static async updateClientMetadata(clientId, updates) {
    try {
      const snapshot = await db.collection(collections.leads)
        .where('client_id', '==', clientId)
        .get();
      
      const batch = db.batch();
      snapshot.forEach(doc => {
        batch.update(doc.ref, {
          ...updates,
          updated_date: new Date().toISOString()
        });
      });
      
      await batch.commit();
      return { success: true, updated_count: snapshot.size };
    } catch (error) {
      console.error('Error updating client metadata:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all clients (grouped leads)
  static async getAllClients() {
    try {
      const snapshot = await db.collection(collections.leads).get();
      const clientMap = {};
      
      snapshot.forEach(doc => {
        const lead = { id: doc.id, ...doc.data() };
        const clientId = lead.client_id || `client_${lead.phone || 'unknown'}`;
        
        if (!clientMap[clientId]) {
          clientMap[clientId] = {
            client_id: clientId,
            phone: lead.phone,
            name: lead.name,
            email: lead.email,
            company: lead.company,
            assigned_to: lead.assigned_to,
            first_contact: lead.client_first_contact || lead.created_date,
            last_activity: lead.client_last_activity || lead.updated_date,
            total_leads: 0,
            total_value: 0,
            events: [],
            statuses: [],
            sources: [],
            leads: []
          };
        }
        
        const client = clientMap[clientId];
        client.total_leads++;
        client.total_value += (lead.potential_value || 0);
        
        if (lead.lead_for_event && !client.events.includes(lead.lead_for_event)) {
          client.events.push(lead.lead_for_event);
        }
        
        if (!client.statuses.includes(lead.status)) {
          client.statuses.push(lead.status);
        }
        
        if (lead.source && !client.sources.includes(lead.source)) {
          client.sources.push(lead.source);
        }
        
        client.leads.push({
          id: lead.id,
          event: lead.lead_for_event,
          status: lead.status,
          potential_value: lead.potential_value,
          source: lead.source,
          created_date: lead.created_date,
          updated_date: lead.updated_date
        });
        
        // Update last activity
        if (new Date(lead.updated_date) > new Date(client.last_activity)) {
          client.last_activity = lead.updated_date;
        }
      });
      
      // Sort leads within each client by date (newest first)
      Object.values(clientMap).forEach(client => {
        client.leads.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      });
      
      return Object.values(clientMap);
    } catch (error) {
      console.error('Error getting all clients:', error);
      return [];
    }
  }

  // Get single client details
  static async getClientById(clientId) {
    try {
      const snapshot = await db.collection(collections.leads)
        .where('client_id', '==', clientId)
        .orderBy('created_date', 'desc')
        .get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const leads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const primaryLead = leads.find(l => l.is_primary_lead) || leads[0];
      
      const clientDetails = {
        client_id: clientId,
        phone: primaryLead.phone,
        name: primaryLead.name,
        email: primaryLead.email,
        company: primaryLead.company,
        assigned_to: primaryLead.assigned_to,
        first_contact: primaryLead.client_first_contact || primaryLead.created_date,
        last_activity: Math.max(...leads.map(l => new Date(l.updated_date))),
        total_leads: leads.length,
        total_value: leads.reduce((sum, lead) => sum + (lead.potential_value || 0), 0),
        events: [...new Set(leads.map(l => l.lead_for_event))],
        sources: [...new Set(leads.map(l => l.source))],
        statuses: [...new Set(leads.map(l => l.status))],
        leads: leads
      };
      
      return clientDetails;
    } catch (error) {
      console.error('Error getting client by ID:', error);
      return null;
    }
  }
}

module.exports = Lead;
