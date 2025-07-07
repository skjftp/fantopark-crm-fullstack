const { db, collections } = require('../config/db');

class Event {
  constructor(data) {
    // Core Event Information
    this.event_name = data.event_name || data.title; // Support both formats
    this.event_type = data.event_type;
    this.sport_type = data.sport_type || data.category;
    this.geography = data.geography || data.location;
    this.start_date = data.start_date || data.date;
    this.end_date = data.end_date;
    this.start_time = data.start_time || data.time;
    this.end_time = data.end_time;
    
    // Venue Information
    this.venue = data.venue;
    this.venue_capacity = data.venue_capacity;
    this.venue_address = data.venue_address;
    
    // Ticketing Information
    this.official_ticketing_partners = data.official_ticketing_partners;
    this.primary_source = data.primary_source;
    this.secondary_source = data.secondary_source;
    this.ticket_available = data.ticket_available || false;
    
    // Priority and Status
    this.priority = data.priority; // P1, P2, P3
    this.status = data.status || 'upcoming';
    this.sold_out_potential = data.sold_out_potential;
    
    // Additional Information
    this.remarks = data.remarks || data.description;
    this.fantopark_package = data.fantopark_package || '';
    
    // Metadata
    this.created_date = data.created_date || new Date().toISOString();
    this.updated_date = new Date().toISOString();
    this.created_by = data.created_by;
  }

  static async getAll() {
    const snapshot = await db.collection(collections.events || 'crm_events')
      .orderBy('start_date', 'desc')
      .get();
    const events = [];
    snapshot.forEach(doc => {
      events.push({ id: doc.id, ...doc.data() });
    });
    return events;
  }

  static async getById(id) {
    const doc = await db.collection(collections.events || 'crm_events').doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  async save() {
    const docRef = await db.collection(collections.events || 'crm_events').add({...this});
    return { id: docRef.id, ...this };
  }

  static async update(id, data) {
    const updateData = { ...data, updated_date: new Date().toISOString() };
    await db.collection(collections.events || 'crm_events').doc(id).update(updateData);
    return { id, ...updateData };
  }

  static async delete(id) {
    await db.collection(collections.events || 'crm_events').doc(id).delete();
    return { success: true };
  }

  static async getByDateRange(startDate, endDate) {
    const snapshot = await db.collection(collections.events || 'crm_events')
      .where('start_date', '>=', startDate)
      .where('start_date', '<=', endDate)
      .orderBy('start_date', 'asc')
      .get();
    const events = [];
    snapshot.forEach(doc => {
      events.push({ id: doc.id, ...doc.data() });
    });
    return events;
  }

  static async getByFilters(filters) {
    let query = db.collection(collections.events || 'crm_events');
    
    if (filters.geography) {
      query = query.where('geography', '==', filters.geography);
    }
    if (filters.sport_type) {
      query = query.where('sport_type', '==', filters.sport_type);
    }
    if (filters.priority) {
      query = query.where('priority', '==', filters.priority);
    }
    if (filters.start_date) {
      query = query.where('start_date', '>=', filters.start_date);
    }
    if (filters.end_date) {
      query = query.where('start_date', '<=', filters.end_date);
    }
    
    const snapshot = await query.orderBy('start_date', 'desc').get();
    const events = [];
    snapshot.forEach(doc => {
      events.push({ id: doc.id, ...doc.data() });
    });
    return events;
  }
}

module.exports = Event;
