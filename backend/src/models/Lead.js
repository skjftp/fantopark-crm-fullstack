const { db, collections } = require('../config/db');

class Lead {
  constructor(data) {
    // Basic Contact Information - matching v4working exactly
    this.name = data.name;
    this.email = data.email;
    this.phone = data.phone;
    this.company = data.company || '';
    
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
  }

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
    return { id, ...updateData };
  }

  static async delete(id) {
    await db.collection(collections.leads).doc(id).delete();
    return { success: true };
  }
}

module.exports = Lead;
