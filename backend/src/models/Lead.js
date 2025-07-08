const { db, collections } = require('../config/db');

class Lead {
  constructor(data) {
    // Basic Contact Information
    this.name = data.name;
    this.email = data.email;
    this.phone = data.phone;
    this.company = data.company || '';
    this.business_type = data.business_type || 'B2C';
    this.is_premium = data.is_premium || false;
    // Lead Source & Initial Contact
    this.source = data.source || '';
    this.date_of_enquiry = data.date_of_enquiry;
    this.first_touch_base_done_by = data.first_touch_base_done_by || '';
    
    // Location Information
    this.city_of_residence = data.city_of_residence || '';
    this.country_of_residence = data.country_of_residence || 'India';
    
    // Event & Travel Details
    this.lead_for_event = data.lead_for_event || '';
    this.number_of_people = this.parseNumber(data.number_of_people, 1);
    this.has_valid_passport = data.has_valid_passport || 'Not Sure';
    this.visa_available = data.visa_available || 'Not Required';
    
    // Experience & Background
    this.attended_sporting_event_before = data.attended_sporting_event_before || 'No';
    
    // Business & Financial Information - FIXED: Ensure numbers
    this.annual_income_bracket = data.annual_income_bracket || '';
    this.potential_value = this.parseNumber(data.potential_value, 0);
    
    // Sales Information - FIXED: Ensure numbers
    this.status = data.status || 'unassigned';
    this.assigned_to = data.assigned_to || '';
    this.last_quoted_price = this.parseNumber(data.last_quoted_price, 0);
    
    // Additional
    this.notes = data.notes || '';
    this.created_date = data.created_date || new Date().toISOString();
    this.updated_date = new Date().toISOString();

    // Client Management Fields
    this.client_id = data.client_id || this.generateClientId(data.phone);
    this.is_primary_lead = data.is_primary_lead || false;
    this.client_total_leads = this.parseNumber(data.client_total_leads, 1);
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

  // FIXED: Helper method to safely parse numbers and prevent concatenation
  parseNumber(value, defaultValue = 0) {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    
    // Handle string numbers, remove commas, currency symbols, and spaces
    const cleanValue = String(value).replace(/[₹,\s]/g, '');
    const numValue = parseFloat(cleanValue);
    
    return isNaN(numValue) ? defaultValue : numValue;
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
    // Filter out undefined values to prevent Firestore errors
    const cleanData = {};
    for (const [key, value] of Object.entries(this)) {
      if (value !== undefined) {
        cleanData[key] = value;
      }
    }
    
    const docRef = await db.collection(collections.leads).add(cleanData);
    const savedLead = { id: docRef.id, ...cleanData };
    
    console.log(`✅ Lead saved successfully: ${docRef.id}`);
    return savedLead;
  } catch (error) {
    console.error('Error saving lead:', error);
    throw error;
  }
}

	
  static async update(id, data) {
    try {
      // FIXED: Parse numeric values before updating
      const updateData = { 
        ...data, 
        updated_date: new Date().toISOString() 
      };

      // Ensure numeric fields are properly parsed
      if (updateData.potential_value !== undefined) {
        updateData.potential_value = Lead.prototype.parseNumber(updateData.potential_value, 0);
      }
      if (updateData.last_quoted_price !== undefined) {
        updateData.last_quoted_price = Lead.prototype.parseNumber(updateData.last_quoted_price, 0);
      }
      if (updateData.number_of_people !== undefined) {
        updateData.number_of_people = Lead.prototype.parseNumber(updateData.number_of_people, 1);
      }

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

  // ===== FIXED: Client management methods =====
  
  static async getClientByPhone(phone) {
    if (!phone) return null;
    
    try {
      console.log(`🔍 Backend: Searching for phone: ${phone}`);
      
      // Normalize the search phone number
      const normalizedSearchPhone = phone.replace(/[\s\-\+]/g, '').replace(/^91/, '');
      
      console.log(`🔍 Backend: Normalized search phone: ${normalizedSearchPhone}`);
      
      // Search with multiple phone number formats
      const phoneVariations = [
        phone,                              // Original input
        normalizedSearchPhone,              // Normalized (remove +91, spaces, etc.)
        `+91${normalizedSearchPhone}`,      // With +91 prefix
        `91${normalizedSearchPhone}`,       // With 91 prefix
        `0${normalizedSearchPhone}`,        // With 0 prefix
      ];
      
      console.log(`🔍 Backend: Checking phone variations:`, phoneVariations);
      
      let snapshot = null;
      let searchPhone = null;
      
      // Try each phone variation until we find a match
      for (const phoneVar of phoneVariations) {
        console.log(`🔍 Backend: Trying phone format: ${phoneVar}`);
        
        const tempSnapshot = await db.collection(collections.leads)
          .where('phone', '==', phoneVar)
          .limit(50)
          .get();
        
        if (!tempSnapshot.empty) {
          snapshot = tempSnapshot;
          searchPhone = phoneVar;
          console.log(`✅ Backend: Found match with phone format: ${phoneVar}`);
          break;
        }
      }

      if (!snapshot || snapshot.empty) {
        console.log(`❌ Backend: No leads found for any phone variation of: ${phone}`);
        return null;
      }

      const leads = [];
      snapshot.forEach(doc => {
        leads.push({ id: doc.id, ...doc.data() });
      });

      console.log(`📞 Backend: Found ${leads.length} leads for phone: ${searchPhone}`);
      leads.forEach(lead => {
        console.log(`   - ${lead.name} assigned to: ${lead.assigned_to || 'unassigned'}`);
      });

      // Find primary lead or use first one
      const primaryLead = leads.find(l => l.is_primary_lead) || leads[0];
      
      // FIXED: Calculate aggregated data with proper number handling
      const totalValue = leads.reduce((sum, lead) => {
        const value = parseFloat(lead.potential_value) || 0;
        console.log(`   Adding value: ${value} (from ${lead.potential_value})`);
        return sum + value;
      }, 0);
      
      console.log(`📊 Backend: Total calculated value: ${totalValue}`);
      
      const events = [...new Set(leads.map(l => l.lead_for_event).filter(Boolean))];
      
      // Get the most common assigned_to person
      const assignedToCounts = {};
      leads.forEach(lead => {
        if (lead.assigned_to) {
          assignedToCounts[lead.assigned_to] = (assignedToCounts[lead.assigned_to] || 0) + 1;
        }
      });
      
      const primaryAssignedTo = Object.keys(assignedToCounts).length > 0 
        ? Object.keys(assignedToCounts).reduce((a, b) => assignedToCounts[a] > assignedToCounts[b] ? a : b)
        : null;

      const result = {
        client_id: primaryLead.client_id || primaryLead.id,
        phone: searchPhone,
        name: primaryLead.name,
        email: primaryLead.email,
        primary_assigned_to: primaryAssignedTo,
        total_leads: leads.length,
        total_value: totalValue, // This is now guaranteed to be a number
        leads: leads.map(l => ({
          id: l.id,
          name: l.name,
          email: l.email,
          phone: l.phone,
          company: l.company,
          assigned_to: l.assigned_to,
          status: l.status,
          lead_for_event: l.lead_for_event,
          created_date: l.created_date,
          city_of_residence: l.city_of_residence,
          country_of_residence: l.country_of_residence,
          business_type: l.business_type,
          annual_income_bracket: l.annual_income_bracket
        })),
        events: events,
        first_contact: primaryLead.created_date
      };

      console.log(`✅ Backend: Client data prepared for: ${primaryLead.name}`, {
        primary_assigned_to: result.primary_assigned_to,
        total_leads: result.total_leads,
        total_value: result.total_value
      });
      
      return result;

    } catch (error) {
      console.error('❌ Backend: Error in getClientByPhone:', error);
      throw error;
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
        
        // FIXED: Proper number handling for total value calculation
        const totalValue = leads.reduce((sum, lead) => {
          const value = parseFloat(lead.potential_value) || 0;
          console.log(`   Client ${primaryLead.name}: Adding ${value} (from ${lead.potential_value})`);
          return sum + value;
        }, 0);
        
        console.log(`📊 Client ${primaryLead.name} total value: ${totalValue}`);
        
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
          total_value: totalValue, // This is now guaranteed to be a number
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
