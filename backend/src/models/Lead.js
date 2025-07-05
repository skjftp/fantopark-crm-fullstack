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

    // ===== NEW CLIENT MANAGEMENT FIELDS =====
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

  async save() {
    const docRef = await db.collection(collections.leads).add({...this});
    return { id: docRef.id, ...this };
  }

  static async update(id, data) {
    const updateData = { ...data, updated_date: new Date().toISOString() };
    await db.collection(collections.leads).doc(id).update(updateData);
    
    // Fetch and return the complete updated lead
    const doc = await db.collection(collections.leads).doc(id).get();
    return { id: doc.id, ...doc.data() };
  }

  static async delete(id) {
    await db.collection(collections.leads).doc(id).delete();
    return { success: true };
  }

  // ===== NEW CLIENT MANAGEMENT METHODS =====

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
        .orderBy('created_date', 'asc')
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
