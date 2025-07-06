const { db, collections } = require('../config/db');

class Lead {
  constructor(data) {
    // Basic Contact Information
    this.name = data.name;
    this.email = data.email;
    this.phone = data.phone;
    this.company = data.company || '';
    this.business_type = data.business_type || 'B2C';
    
    
    // Lead Source & Initial Contact
    this.source = data.source || '';
    this.date_of_enquiry = data.date_of_enquiry;
    this.first_touch_base_done_by = data.first_touch_base_done_by || '';
    
    // Location Information
    this.city_of_residence = data.city_of_residence || '';
    this.country_of_residence = data.country_of_residence || 'India';
    
    // Event & Travel Details
    this.lead_for_event = data.lead_for_event || '';
    this.number_of_people = data.number_of_people || 1;
    this.has_valid_passport = data.has_valid_passport || 'Not Sure';
    this.visa_available = data.visa_available || 'Not Required';
    
    // Experience & Background
    this.attended_sporting_event_before = data.attended_sporting_event_before || 'No';
    
    // Business & Financial Information
    this.annual_income_bracket = data.annual_income_bracket || '';
    this.potential_value = data.potential_value || 0;
    
    // Sales Information
    this.status = data.status || 'unassigned';
    this.assigned_to = data.assigned_to || '';
    this.last_quoted_price = data.last_quoted_price || 0;
    
    // Additional
    this.notes = data.notes || '';
    this.created_date = data.created_date || new Date().toISOString();
    this.updated_date = new Date().toISOString();

    // Client Management Fields
    this.client_id = data.client_id || this.generateClientId(data.phone);
    this.is_primary_lead = data.is_primary_lead || false;
    this.client_total_leads = data.client_total_leads || 1;
    this.client_events = data.client_events || (data.lead_for_event ? [data.lead_for_event] : []);
    this.client_first_contact = data.client_first_contact || this.created_date;
    this.client_last_activity = data.client_last_activity || this.created_date;
    this.manual_assignment_override = data.manual_assignment_override || false;

    // Assignment Metadata Fields
    this.auto_assigned = data.auto_assigned || false;
    this.assignment_reason = data.assignment_reason || '';
    this.assignment_rule_used = data.assignment_rule_used || '';
    this.assignment_rule_id = data.assignment_rule_id || '';
    this.assignment_date = data.assignment_date || null;
  }

  generateClientId(phone) {
    if (!phone) return null;
    return 'client_' + phone.replace(/\D/g, '');
  }

  static async getAll(filters = {}) {
    let query = db.collection(collections.leads);
    
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

  async save() {
    try {
      const docRef = await db.collection(collections.leads).add({...this});
      const savedLead = { id: docRef.id, ...this };
      
      console.log(`✅ Lead saved successfully: ${docRef.id}`);
      return savedLead;
    } catch (error) {
      console.error('Error saving lead:', error);
      throw error;
    }
  }

  static async update(id, data) {
    try {
      const updateData = { 
        ...data, 
        updated_date: new Date().toISOString() 
      };

      await db.collection(collections.leads).doc(id).update(updateData);
      return await Lead.getById(id);
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      await db.collection(collections.leads).doc(id).delete();
      return true;
    } catch (error) {
      console.error('Error deleting lead:', error);
      throw error;
    }
  }

  // Client management methods
  
  static async getClientByPhone(phone) {
    if (!phone) return null;
    
    try {
      const snapshot = await db.collection(collections.leads)
        .where('phone', '==', phone)
        .orderBy('created_date', 'asc')
        .limit(50)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const leads = [];
      snapshot.forEach(doc => {
        leads.push({ id: doc.id, ...doc.data() });
      });

      const primaryLead = leads.find(l => l.is_primary_lead) || leads[0];
      
      const totalValue = leads.reduce((sum, lead) => sum + (parseFloat(lead.potential_value) || 0), 0);
      const events = [...new Set(leads.map(l => l.lead_for_event).filter(Boolean))];

      return {
        client_id: primaryLead.client_id,
        phone: phone,
        name: primaryLead.name,
        email: primaryLead.email,
        primary_assigned_to: primaryLead.assigned_to,
        total_leads: leads.length,
        total_value: totalValue,
        events: events,
        first_contact: primaryLead.created_date,
        leads: leads
      };
    } catch (error) {
      console.error('Error searching for existing client:', error);
      return null;
    }
  }

static async getAllClients() {
  try {
    console.log('🔍 Getting all leads to group into clients...');
    
    // Get all leads from Firestore
    const snapshot = await db.collection(collections.leads)
      .orderBy('created_date', 'desc')
      .get();

    if (snapshot.empty) {
      console.log('No leads found');
      return [];
    }

    // Group leads by client_id
    const clientGroups = {};
    
    snapshot.forEach(doc => {
      const lead = { id: doc.id, ...doc.data() };
      const clientId = lead.client_id;
      
      if (!clientId) return; // Skip leads without client_id
      
      if (!clientGroups[clientId]) {
        clientGroups[clientId] = [];
      }
      clientGroups[clientId].push(lead);
    });

    // Convert grouped leads into client objects
    const clients = Object.entries(clientGroups).map(([clientId, leads]) => {
      const primaryLead = leads.find(l => l.is_primary_lead) || leads[0];
      const totalValue = leads.reduce((sum, lead) => sum + (lead.potential_value || 0), 0);
      const events = [...new Set(leads.map(l => l.lead_for_event).filter(Boolean))];
      const lastActivity = leads.reduce((latest, lead) => {
        const leadDate = new Date(lead.updated_date || lead.created_date);
        return leadDate > latest ? leadDate : latest;
      }, new Date(0));

      return {
        client_id: clientId,
        phone: primaryLead.phone,
        name: primaryLead.name,
        email: primaryLead.email,
        company: primaryLead.company,
        assigned_to: primaryLead.assigned_to,
        total_leads: leads.length,
        total_value: totalValue,
        events: events,
        first_contact: primaryLead.created_date,
        last_activity: lastActivity.toISOString(),
        leads: leads
      };
    });

    console.log(`✅ Found ${clients.length} clients from ${snapshot.size} leads`);
    return clients;
    
  } catch (error) {
    console.error('Error getting all clients:', error);
    throw error;
  }
}

  static async updateClientMetadata(clientId, metadata) {
    return true;
  }

  // Reminder methods (simplified to avoid conflicts)
  static async createAutoReminder(leadId, leadData) {
    console.log(`🔔 Auto-reminder placeholder for lead ${leadId}`);
    return null;
  }

  static async cancelOldReminders(leadId, reason) {
    console.log(`🔔 Cancel reminders placeholder for lead ${leadId}`);
    return null;
  }
}

module.exports = Lead;
