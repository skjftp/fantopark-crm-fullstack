const { db, collections } = require('../config/db');

class Inventory {
  constructor(data) {
    // All fields from v4working inventoryFormFields
    this.event_name = data.event_name;
    this.event_date = data.event_date;
    this.event_type = data.event_type;
    this.sports = data.sports;
    this.venue = data.venue;
    this.day_of_match = data.day_of_match || 'Not Applicable';
    this.category_of_ticket = data.category_of_ticket;
    this.stand = data.stand || '';
    this.total_tickets = parseInt(data.total_tickets) || 0;
    this.available_tickets = parseInt(data.available_tickets) || 0;
    this.mrp_of_ticket = parseFloat(data.mrp_of_ticket) || 0;
    this.buying_price = parseFloat(data.buying_price) || 0;
    this.selling_price = parseFloat(data.selling_price) || 0;
    this.inclusions = data.inclusions || '';
    this.booking_person = data.booking_person;
    this.procurement_type = data.procurement_type;
    this.notes = data.notes || '';
    this.created_date = data.created_date || new Date().toISOString();
    this.updated_date = new Date().toISOString();
  }

  static async getAll() {
    const snapshot = await db.collection(collections.inventory)
      .orderBy('event_date', 'desc')
      .get();
    const inventory = [];
    snapshot.forEach(doc => {
      inventory.push({ id: doc.id, ...doc.data() });
    });
    return inventory;
  }

  static async getById(id) {
    const doc = await db.collection(collections.inventory).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  async save() {
    const docRef = await db.collection(collections.inventory).add({...this});
    return { id: docRef.id, ...this };
  }

  static async update(id, data) {
    const updateData = { ...data, updated_date: new Date().toISOString() };
    await db.collection(collections.inventory).doc(id).update(updateData);
    return { id, ...updateData };
  }

  static async delete(id) {
    await db.collection(collections.inventory).doc(id).delete();
    return { success: true };
  }

  static async allocate(id, allocationData) {
    const inventory = await this.getById(id);
    if (!inventory) throw new Error('Inventory not found');
    
    const newAvailable = inventory.available_tickets - allocationData.tickets_allocated;
    if (newAvailable < 0) throw new Error('Not enough tickets available');
    
    await this.update(id, { available_tickets: newAvailable });
    return { success: true, remaining_tickets: newAvailable };
  }
}

module.exports = Inventory;
