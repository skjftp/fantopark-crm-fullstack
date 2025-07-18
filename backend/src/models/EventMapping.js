// backend/src/models/EventMapping.js

const { db, collections } = require('../config/db');

class EventMapping {
  constructor(data) {
    this.website_event_name = data.website_event_name;
    this.crm_inventory_id = data.crm_inventory_id;
    this.crm_inventory_name = data.crm_inventory_name;
    this.created_by = data.created_by;
    this.created_date = data.created_date || new Date().toISOString();
    this.updated_date = new Date().toISOString();
  }

  // Get all mappings
  static async getAll() {
    const snapshot = await db.collection('crm_event_mappings').get();
    const mappings = [];
    snapshot.forEach(doc => {
      mappings.push({ id: doc.id, ...doc.data() });
    });
    return mappings;
  }

  // Get mapping by website event name
  static async getByWebsiteEventName(eventName) {
    const snapshot = await db.collection('crm_event_mappings')
      .where('website_event_name', '==', eventName)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  // Save new mapping
  async save() {
    // Check if mapping already exists
    const existing = await EventMapping.getByWebsiteEventName(this.website_event_name);
    
    if (existing) {
      // Update existing mapping
      await db.collection('crm_event_mappings').doc(existing.id).update({
        crm_inventory_id: this.crm_inventory_id,
        crm_inventory_name: this.crm_inventory_name,
        updated_date: this.updated_date,
        updated_by: this.created_by
      });
      return { id: existing.id, ...this };
    } else {
      // Create new mapping
      const docRef = await db.collection('crm_event_mappings').add({...this});
      return { id: docRef.id, ...this };
    }
  }

  // Delete mapping
  static async delete(id) {
    await db.collection('crm_event_mappings').doc(id).delete();
    return { success: true };
  }

  // Get mappings as a lookup object
  static async getMappingsLookup() {
    const mappings = await this.getAll();
    const lookup = {};
    mappings.forEach(mapping => {
      lookup[mapping.website_event_name] = {
        inventory_id: mapping.crm_inventory_id,
        inventory_name: mapping.crm_inventory_name
      };
    });
    return lookup;
  }
}

module.exports = EventMapping;
