const { db, collections } = require('../config/db');

class Inventory {
  constructor(data) {
    console.log('🏗️ Inventory constructor called with data:', JSON.stringify(data, null, 2));
    
    // Basic Event Information
    this.event_name = data.event_name;
    this.event_date = data.event_date;
    this.event_type = data.event_type;
    this.sports = data.sports;
    this.venue = data.venue;
    this.day_of_match = data.day_of_match || 'Not Applicable';
    
    // Ticket Details
    this.category_of_ticket = data.category_of_ticket;
    this.stand = data.stand || '';
    this.total_tickets = parseInt(data.total_tickets) || 0;
    this.available_tickets = parseInt(data.available_tickets) || 0;
    
    // Pricing Information
    this.mrp_of_ticket = parseFloat(data.mrp_of_ticket) || 0;
    this.buying_price = parseFloat(data.buying_price) || 0;
    this.selling_price = parseFloat(data.selling_price) || 0;
    
    // Additional Information
    this.inclusions = data.inclusions || '';
    this.booking_person = data.booking_person;
    this.procurement_type = data.procurement_type;
    this.notes = data.notes || '';
    
    // PAYMENT INFORMATION - NEW FIELDS
    this.paymentStatus = data.paymentStatus || 'pending';
    this.supplierName = data.supplierName || '';
    this.supplierInvoice = data.supplierInvoice || '';
    this.purchasePrice = parseFloat(data.purchasePrice) || 0;
    this.totalPurchaseAmount = parseFloat(data.totalPurchaseAmount) || 0;
    this.amountPaid = parseFloat(data.amountPaid) || 0;
    this.paymentDueDate = data.paymentDueDate || '';
    
    // Legacy fields for backward compatibility
    this.vendor_name = data.vendor_name || data.supplierName || '';
    this.price_per_ticket = parseFloat(data.price_per_ticket) || parseFloat(data.selling_price) || 0;
    this.number_of_tickets = parseInt(data.number_of_tickets) || parseInt(data.total_tickets) || 0;
    this.total_value_of_tickets = parseFloat(data.total_value_of_tickets) || 0;
    this.currency = data.currency || 'INR';
    this.base_amount_inr = parseFloat(data.base_amount_inr) || 0;
    this.gst_18_percent = parseFloat(data.gst_18_percent) || 0;
    this.selling_price_per_ticket = parseFloat(data.selling_price_per_ticket) || parseFloat(data.selling_price) || 0;
    this.payment_due_date = data.payment_due_date || data.paymentDueDate || '';
    this.supplier_name = data.supplier_name || data.supplierName || '';
    this.ticket_source = data.ticket_source || 'Primary';
    this.status = data.status || 'available';
    this.allocated_to_order = data.allocated_to_order || '';
    
    // System fields
    this.created_date = data.created_date || new Date().toISOString();
    this.updated_date = new Date().toISOString();
    this.created_by = data.created_by || '';
    
    console.log('✅ Inventory object created with payment fields:');
    console.log('  paymentStatus:', this.paymentStatus);
    console.log('  supplierName:', this.supplierName);
    console.log('  totalPurchaseAmount:', this.totalPurchaseAmount);
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
    console.log('💾 Saving inventory to database...');
    console.log('Payment fields being saved:');
    console.log('  paymentStatus:', this.paymentStatus);
    console.log('  supplierName:', this.supplierName);
    console.log('  totalPurchaseAmount:', this.totalPurchaseAmount);
    
    // Create a clean object with all properties
    const dataToSave = {
      // Basic Event Information
      event_name: this.event_name,
      event_date: this.event_date,
      event_type: this.event_type,
      sports: this.sports,
      venue: this.venue,
      day_of_match: this.day_of_match,
      
      // Ticket Details
      category_of_ticket: this.category_of_ticket,
      stand: this.stand,
      total_tickets: this.total_tickets,
      available_tickets: this.available_tickets,
      
      // Pricing Information
      mrp_of_ticket: this.mrp_of_ticket,
      buying_price: this.buying_price,
      selling_price: this.selling_price,
      
      // Additional Information
      inclusions: this.inclusions,
      booking_person: this.booking_person,
      procurement_type: this.procurement_type,
      notes: this.notes,
      
      // PAYMENT INFORMATION - EXPLICITLY INCLUDED
      paymentStatus: this.paymentStatus,
      supplierName: this.supplierName,
      supplierInvoice: this.supplierInvoice,
      purchasePrice: this.purchasePrice,
      totalPurchaseAmount: this.totalPurchaseAmount,
      amountPaid: this.amountPaid,
      paymentDueDate: this.paymentDueDate,
      
      // Legacy fields
      vendor_name: this.vendor_name,
      price_per_ticket: this.price_per_ticket,
      number_of_tickets: this.number_of_tickets,
      total_value_of_tickets: this.total_value_of_tickets,
      currency: this.currency,
      base_amount_inr: this.base_amount_inr,
      gst_18_percent: this.gst_18_percent,
      selling_price_per_ticket: this.selling_price_per_ticket,
      payment_due_date: this.payment_due_date,
      supplier_name: this.supplier_name,
      ticket_source: this.ticket_source,
      status: this.status,
      allocated_to_order: this.allocated_to_order,
      
      // System fields
      created_date: this.created_date,
      updated_date: this.updated_date,
      created_by: this.created_by
    };
    
    console.log('🔍 Final data being saved to Firestore:');
    console.log('Payment fields in final data:');
    console.log('  paymentStatus:', dataToSave.paymentStatus);
    console.log('  supplierName:', dataToSave.supplierName);
    console.log('  totalPurchaseAmount:', dataToSave.totalPurchaseAmount);
    
    const docRef = await db.collection(collections.inventory).add(dataToSave);
    
    // Return the saved data with ID
    const savedData = { id: docRef.id, ...dataToSave };
    
    console.log('✅ Data saved successfully with ID:', docRef.id);
    console.log('✅ Returning saved data with payment fields:');
    console.log('  paymentStatus:', savedData.paymentStatus);
    console.log('  supplierName:', savedData.supplierName);
    console.log('  totalPurchaseAmount:', savedData.totalPurchaseAmount);
    
    return savedData;
  }

  static async update(id, data) {
    const updateData = { 
      ...data, 
      updated_date: new Date().toISOString() 
    };
    
    // Handle payment calculations
    if (updateData.purchasePrice && updateData.total_tickets) {
      updateData.totalPurchaseAmount = updateData.purchasePrice * updateData.total_tickets;
    }
    
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

  // New method for payment tracking
  static async updatePayment(id, paymentData) {
    const inventory = await this.getById(id);
    if (!inventory) throw new Error('Inventory not found');
    
    const updateData = {
      paymentStatus: paymentData.paymentStatus,
      amountPaid: parseFloat(paymentData.amountPaid) || 0,
      supplierName: paymentData.supplierName || inventory.supplierName,
      supplierInvoice: paymentData.supplierInvoice || inventory.supplierInvoice,
      paymentDueDate: paymentData.paymentDueDate || inventory.paymentDueDate,
      updated_date: new Date().toISOString()
    };
    
    await this.update(id, updateData);
    return { success: true, ...updateData };
  }
}

module.exports = Inventory;
