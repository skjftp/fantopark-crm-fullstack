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

    // ===== NEW: ASSIGNMENT METADATA FIELDS =====
    this.auto_assigned = data.auto_assigned || false;
    this.assignment_reason = data.assignment_reason || '';
    this.assignment_rule_used = data.assignment_rule_used || '';
    this.assignment_rule_id = data.assignment_rule_id || '';
    this.assignment_date = data.assignment_date || null;
  }

  // Generate consistent client ID from phone number
  generateClientId(phone) {
    if (!phone) return null;
    return 'client_' + phone.replace(/\D/g, ''); // Remove non-digits
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

  // ENHANCED: Save method with auto-assignment and auto-reminder support
  async save() {
    try {
      const isNew = !this.id;
      
      // NEW: Auto-assignment logic for new leads
      if (isNew && !this.assigned_to) {
        console.log('🎯 Attempting auto-assignment for new lead...');
        try {
          const AssignmentRule = require('./AssignmentRule');
          const assignment = await AssignmentRule.testAssignment(this);
          
          if (assignment) {
            this.assigned_to = assignment.assigned_to;
            this.auto_assigned = true;
            this.assignment_reason = assignment.assignment_reason;
            this.assignment_rule_used = assignment.rule_matched;
            this.assignment_rule_id = assignment.rule_id;
            this.assignment_date = new Date().toISOString();
            this.status = 'assigned'; // Update status to assigned
            
            console.log(`✅ Auto-assigned lead to: ${this.assigned_to} via rule: ${this.assignment_rule_used}`);
          } else {
            console.log('⚠️ No assignment rules matched - lead remains unassigned');
          }
        } catch (assignmentError) {
          console.error('⚠️ Auto-assignment failed (non-critical):', assignmentError.message);
          // Don't fail the lead creation if auto-assignment fails
        }
      }
      
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
      const updateData = { 
        ...data, 
        updated_date: new Date().toISOString() 
      };

      await db.collection(collections.leads).doc(id).update(updateData);
      
      // NEW: Handle status change reminders
      if (oldStatus !== newStatus && newStatus) {
        console.log(`📈 Lead status changed: ${oldStatus} → ${newStatus}`);
        
        // Cancel old reminders and create new ones
        try {
          await Lead.cancelOldReminders(id, newStatus);
          
          // Get updated lead data for reminder creation
          const updatedLead = await Lead.getById(id);
          await Lead.createAutoReminder(id, updatedLead);
        } catch (reminderError) {
          console.error('⚠️ Reminder management failed (non-critical):', reminderError.message);
        }
      }

      // Return updated lead
      return await Lead.getById(id);
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  }

  static async delete(id) {
    await db.collection(collections.leads).doc(id).delete();
    return true;
  }

  // ===== AUTO-REMINDER LOGIC =====
  
  // Create automatic reminders based on lead status
  static async createAutoReminder(leadId, leadData, reminderType = 'follow_up') {
    console.log(`🔔 Creating auto-reminder for lead ${leadId} with status: ${leadData.status}`);
    
    // Define enhanced reminder rules
    const reminderRules = {
      'unassigned': { 
        days: 0, hours: 0, 
        priority: 'urgent', 
        title: 'URGENT: Unassigned Lead',
        description: 'This lead needs immediate assignment' 
      },
      'assigned': { 
        days: 0, hours: 2, 
        priority: 'high', 
        title: 'First Contact Required',
        description: 'Make first contact with this newly assigned lead' 
      },
      'contacted': { 
        days: 2, hours: 0, 
        priority: 'medium', 
        title: 'Follow up on initial contact',
        description: 'Check back with lead after initial conversation' 
      },
      'attempt_1': { 
        days: 1, hours: 0, 
        priority: 'medium', 
        title: 'Second contact attempt',
        description: 'Continue follow-up sequence' 
      },
      'attempt_2': { 
        days: 1, hours: 0, 
        priority: 'high', 
        title: 'Third contact attempt',
        description: 'Important: Multiple contact attempts needed' 
      },
      'attempt_3': { 
        days: 2, hours: 0, 
        priority: 'high', 
        title: 'Final contact attempt',
        description: 'Last chance to engage this lead' 
      },
      'qualified': { 
        days: 3, hours: 0, 
        priority: 'medium', 
        title: 'Nurture qualified lead',
        description: 'Qualified lead needs continued engagement' 
      },
      'hot': { 
        days: 1, hours: 0, 
        priority: 'urgent', 
        title: 'HOT LEAD - Priority follow-up',
        description: 'High priority lead - immediate attention required' 
      },
      'warm': { 
        days: 2, hours: 0, 
        priority: 'high', 
        title: 'Warm lead follow-up',
        description: 'Engaged lead needs regular follow-up' 
      },
      'cold': { 
        days: 7, hours: 0, 
        priority: 'low', 
        title: 'Cold lead check-in',
        description: 'Periodic check-in with cold lead' 
      },
      'quote_requested': { 
        days: 1, hours: 0, 
        priority: 'urgent', 
        title: 'URGENT: Quote Request',
        description: 'Customer has requested a quote - respond immediately' 
      }
    };

    const rule = reminderRules[leadData.status];
    if (!rule) {
      console.log(`⚠️ No reminder rule for status: ${leadData.status}`);
      return null;
    }

    if (!leadData.assigned_to) {
      console.log(`⚠️ No assignee for reminder - lead: ${leadId}`);
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
      const Reminder = require('./Reminder');
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

  // ===== YOUR EXISTING CLIENT MANAGEMENT METHODS =====

  // Get client info by phone for deduplication
  static async getClientByPhone(phone) {
    if (!phone) return null;
    
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      
      // Search for existing leads with this phone number
      const snapshot = await db.collection(collections.leads)
        .where('phone', '==', phone)
        .orderBy('created_date', 'asc')
        .limit(50)
        .get();

      if (snapshot.empty) {
        console.log('No existing client found for phone:', phone);
        return null;
      }

      // Analyze the leads to build client profile
      const leads = [];
      snapshot.forEach(doc => {
        leads.push({ id: doc.id, ...doc.data() });
      });

      // Find the primary lead (usually the first one)
      const primaryLead = leads.find(l => l.is_primary_lead) || leads[0];
      
      // Calculate client metadata
      const totalValue = leads.reduce((sum, lead) => sum + (lead.potential_value || 0), 0);
      const events = [...new Set(leads.map(l => l.lead_for_event).filter(Boolean))];
      const lastActivity = leads.reduce((latest, lead) => {
        const leadDate = new Date(lead.client_last_activity || lead.updated_date || lead.created_date);
        return leadDate > latest ? leadDate : latest;
      }, new Date(0));

      const clientInfo = {
        client_id: primaryLead.client_id,
        phone: phone,
        name: primaryLead.name,
        email: primaryLead.email,
        primary_assigned_to: primaryLead.assigned_to,
        total_leads: leads.length,
        total_value: totalValue,
        events: events,
        first_contact: primaryLead.created_date,
        last_activity: lastActivity.toISOString(),
        leads: leads.map(l => ({
          id: l.id,
          event: l.lead_for_event,
          status: l.status,
          value: l.potential_value,
          date: l.created_date
        }))
      };

      console.log(`Found existing client: ${clientInfo.name} with ${leads.length} leads`);
      return clientInfo;
    } catch (error) {
      console.error('Error searching for existing client:', error);
      return null;
    }
  }

  // Get all clients (grouped leads)
  static async getAllClients() {
    try {
      const snapshot = await db.collection(collections.leads)
        .orderBy('created_date', 'desc')
        .get();

      const leadsData = [];
      snapshot.forEach(doc => {
        leadsData.push({ id: doc.id, ...doc.data() });
      });

      // Group by client_id
      const clientsMap = new Map();
      
      leadsData.forEach(lead => {
        const clientId = lead.client_id || `single_${lead.id}`;
        
        if (!clientsMap.has(clientId)) {
          clientsMap.set(clientId, {
            client_id: clientId,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            assigned_to: lead.assigned_to,
            total_leads: 0,
            total_value: 0,
            events: [],
            leads: [],
            first_contact: lead.created_date,
            last_activity: lead.client_last_activity || lead.updated_date
          });
        }
        
        const client = clientsMap.get(clientId);
        client.total_leads++;
        client.total_value += (lead.potential_value || 0);
        
        if (lead.lead_for_event && !client.events.includes(lead.lead_for_event)) {
          client.events.push(lead.lead_for_event);
        }
        
        client.leads.push({
          id: lead.id,
          event: lead.lead_for_event,
          status: lead.status,
          value: lead.potential_value,
          date: lead.created_date
        });
        
        // Update last activity
        const leadActivity = new Date(lead.client_last_activity || lead.updated_date || lead.created_date);
        const currentActivity = new Date(client.last_activity);
        if (leadActivity > currentActivity) {
          client.last_activity = leadActivity.toISOString();
        }
      });

      return Array.from(clientsMap.values())
        .sort((a, b) => new Date(b.last_activity) - new Date(a.last_activity));
    } catch (error) {
      console.error('Error getting all clients:', error);
      throw error;
    }
  }

  // Update client metadata across all leads
  static async updateClientMetadata(clientId, metadata) {
    try {
      const snapshot = await db.collection(collections.leads)
        .where('client_id', '==', clientId)
        .get();

      const batch = db.batch();
      snapshot.forEach(doc => {
        batch.update(doc.ref, {
          ...metadata,
          updated_date: new Date().toISOString()
        });
      });

      await batch.commit();
      console.log(`Updated client metadata for ${snapshot.size} leads`);
    } catch (error) {
      console.error('Error updating client metadata:', error);
      throw error;
    }
  }
}

module.exports = Lead;
