const { db, collections } = require('../config/db');

class Event {
  constructor(data) {
  // Helper function to safely assign values, filtering out undefined
  const safeAssign = (value, defaultValue = '') => {
    if (value === undefined || value === null) return defaultValue;
    if (typeof value === 'string' && value.trim() === '') return defaultValue;
    return value;
  };

  const safeNumber = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const num = parseInt(value);
    return isNaN(num) ? null : num;
  };

  // Only assign fields that are actually provided and not undefined
  if (data.event_name !== undefined) this.event_name = safeAssign(data.event_name || data.title);
  if (data.event_type !== undefined) this.event_type = safeAssign(data.event_type);
  if (data.sport_type !== undefined || data.category !== undefined) {
    this.sport_type = safeAssign(data.sport_type || data.category);
  }
  if (data.geography !== undefined || data.location !== undefined) {
    this.geography = safeAssign(data.geography || data.location);
  }
  if (data.start_date !== undefined || data.date !== undefined) {
    this.start_date = safeAssign(data.start_date || data.date);
  }
  if (data.end_date !== undefined) this.end_date = data.end_date || null;
  if (data.start_time !== undefined || data.time !== undefined) {
    this.start_time = safeAssign(data.start_time || data.time);
  }
  if (data.end_time !== undefined) this.end_time = safeAssign(data.end_time);
  if (data.venue !== undefined) this.venue = safeAssign(data.venue);
  if (data.venue_capacity !== undefined) this.venue_capacity = safeNumber(data.venue_capacity);
  if (data.venue_address !== undefined) this.venue_address = safeAssign(data.venue_address);
  if (data.official_ticketing_partners !== undefined) {
    this.official_ticketing_partners = safeAssign(data.official_ticketing_partners);
  }
  if (data.primary_source !== undefined) this.primary_source = safeAssign(data.primary_source);
  if (data.secondary_source !== undefined) this.secondary_source = safeAssign(data.secondary_source);
  if (data.ticket_available !== undefined) this.ticket_available = Boolean(data.ticket_available);
  if (data.priority !== undefined) this.priority = safeAssign(data.priority);
  if (data.status !== undefined) this.status = safeAssign(data.status, 'upcoming');
  if (data.sold_out_potential !== undefined) this.sold_out_potential = safeAssign(data.sold_out_potential);
  if (data.remarks !== undefined || data.description !== undefined) {
    this.remarks = safeAssign(data.remarks || data.description);
  }
  if (data.fantopark_package !== undefined) this.fantopark_package = safeAssign(data.fantopark_package);
  
  // Metadata
  this.created_date = data.created_date || new Date().toISOString();
  this.updated_date = new Date().toISOString();
  if (data.created_by !== undefined) this.created_by = safeAssign(data.created_by);
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
    // Check for duplicate event name before saving
    const existingEvent = await db.collection(collections.events || 'crm_events')
      .where('event_name', '==', this.event_name)
      .limit(1)
      .get();
    
    if (!existingEvent.empty) {
      throw new Error(`Event with name "${this.event_name}" already exists`);
    }
    
    const docRef = await db.collection(collections.events || 'crm_events').add({...this});
    return { id: docRef.id, ...this };
  }

  static async update(id, data) {
    // If event_name is being updated, check for duplicates
    if (data.event_name) {
      const existingEvent = await db.collection(collections.events || 'crm_events')
        .where('event_name', '==', data.event_name)
        .limit(1)
        .get();
      
      // Check if the found event is not the same one we're updating
      if (!existingEvent.empty && existingEvent.docs[0].id !== id) {
        throw new Error(`Event with name "${data.event_name}" already exists`);
      }
    }
    
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
