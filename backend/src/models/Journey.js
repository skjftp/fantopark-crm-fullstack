// backend/src/models/Journey.js - Enhanced version
const { db, collections } = require('../config/db');

class Journey {
  constructor(data) {
    // Basic fields
    this.order_id = data.order_id;
    this.lead_id = data.lead_id;
    this.client_name = data.client_name;
    this.event_id = data.event_id;
    this.event_name = data.event_name || data.event_type;
    this.event_date = data.event_date;
    this.venue = data.venue || data.event_venue;
    this.journey_token = data.journey_token || this.generateToken();
    
    // ✅ NEW: Package type and included services
    this.package_type = data.package_type || 'tickets_only'; // tickets_only, standard_package, premium_package, custom
    this.included_services = data.included_services || [];
    
    // ✅ Generate milestones based on package type
    this.milestones = this.generateMilestones(data);
    
    // Optional details based on package
    if (data.experiences) this.experiences = data.experiences;
    if (data.transport_details) this.transport_details = data.transport_details;
    if (data.accommodation_details) this.accommodation_details = data.accommodation_details;
    if (data.dining_options) this.dining_options = data.dining_options;
    if (data.custom_inclusions) this.custom_inclusions = data.custom_inclusions;
    
    // Metadata
    this.created_date = data.created_date || new Date().toISOString();
    this.updated_date = new Date().toISOString();
    this.created_by = data.created_by;
  }
  
  generateToken() {
    return 'FTP' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
  
  // ✅ NEW: Dynamic milestone generation based on package
  generateMilestones(data) {
    const milestones = [];
    
    // Always include ticket confirmation
    milestones.push({
      id: 'tickets_secured',
      title: 'Tickets Secured',
      description: 'Your premium tickets are confirmed',
      status: 'pending',
      icon: '✅',
      completed_date: null
    });
    
    // Add milestones based on included services
    const services = data.included_services || [];
    
    if (services.includes('flights') || data.transport_details) {
      milestones.push({
        id: 'travel_arranged',
        title: 'Flight & Transport Arranged',
        description: 'Your travel arrangements are confirmed',
        status: 'pending',
        icon: '✈️',
        completed_date: null
      });
    }
    
    if (services.includes('accommodation') || data.accommodation_details) {
      milestones.push({
        id: 'hotel_booked',
        title: 'Hotel Accommodation Secured',
        description: 'Your stay has been arranged',
        status: 'pending',
        icon: '🏨',
        completed_date: null
      });
    }
    
    if (services.includes('visa') || services.includes('visa_assistance')) {
      milestones.push({
        id: 'visa_processing',
        title: 'Visa Processing',
        description: 'Your visa application is being handled',
        status: 'pending',
        icon: '📄',
        completed_date: null
      });
    }
    
    if (services.includes('transfers') || services.includes('local_transport')) {
      milestones.push({
        id: 'transfers_arranged',
        title: 'Local Transfers Arranged',
        description: 'Airport and venue transfers confirmed',
        status: 'pending',
        icon: '🚗',
        completed_date: null
      });
    }
    
    if (services.includes('hospitality') || services.includes('vip_experience')) {
      milestones.push({
        id: 'vip_experience',
        title: 'VIP Experience Ready',
        description: 'Premium hospitality arrangements confirmed',
        status: 'pending',
        icon: '🥂',
        completed_date: null
      });
    }
    
    // Pack bags milestone (closer to event)
    milestones.push({
      id: 'pack_bags',
      title: 'Pack Your Bags',
      description: 'Prepare for your journey',
      status: 'pending',
      icon: '🎒',
      completed_date: null
    });
    
    // Match day
    milestones.push({
      id: 'match_day',
      title: data.event_name || 'Event Day Experience',
      description: 'Your premium experience awaits',
      status: 'pending',
      icon: '🏟️',
      completed_date: null
    });
    
    // Memories (always last)
    milestones.push({
      id: 'memories',
      title: 'Create Memories',
      description: 'Share your experience with us',
      status: 'pending',
      icon: '🏆',
      completed_date: null
    });
    
    return milestones;
  }
  
  generateJourneyUrl() {
    const baseUrl = process.env.FRONTEND_URL || 'https://lehrado.com';
    return `${baseUrl}/journey/${this.journey_token}`;
  }
  
  // Convert to plain object for Firestore
  toFirestore() {
    const data = {};
    
    // Only include defined properties
    if (this.order_id !== undefined) data.order_id = this.order_id;
    if (this.lead_id !== undefined) data.lead_id = this.lead_id;
    if (this.client_name !== undefined) data.client_name = this.client_name;
    if (this.event_id !== undefined) data.event_id = this.event_id;
    if (this.event_name !== undefined) data.event_name = this.event_name;
    if (this.event_date !== undefined) data.event_date = this.event_date;
    if (this.venue !== undefined) data.venue = this.venue;
    if (this.journey_url !== undefined) data.journey_url = this.journey_url;
    if (this.journey_token !== undefined) data.journey_token = this.journey_token;
    if (this.package_type !== undefined) data.package_type = this.package_type;
    if (this.included_services !== undefined) data.included_services = this.included_services;
    if (this.milestones !== undefined) data.milestones = this.milestones;
    if (this.experiences !== undefined) data.experiences = this.experiences;
    if (this.transport_details !== undefined) data.transport_details = this.transport_details;
    if (this.accommodation_details !== undefined) data.accommodation_details = this.accommodation_details;
    if (this.dining_options !== undefined) data.dining_options = this.dining_options;
    if (this.custom_inclusions !== undefined) data.custom_inclusions = this.custom_inclusions;
    if (this.created_date !== undefined) data.created_date = this.created_date;
    if (this.updated_date !== undefined) data.updated_date = this.updated_date;
    if (this.created_by !== undefined) data.created_by = this.created_by;
    
    return data;
  }
  
  async save() {
    this.journey_url = this.generateJourneyUrl();
    const dataToSave = this.toFirestore();
    
    try {
      const docRef = await db.collection('crm_journeys').add(dataToSave);
      return { id: docRef.id, ...dataToSave };
    } catch (error) {
      console.error('Error saving journey:', error);
      throw new Error(`Failed to save journey: ${error.message}`);
    }
  }
  
  static async findByToken(token) {
    try {
      const snapshot = await db.collection('crm_journeys')
        .where('journey_token', '==', token)
        .limit(1)
        .get();
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error finding journey:', error);
      throw error;
    }
  }
  
  static async findById(id) {
    try {
      const doc = await db.collection('crm_journeys').doc(id).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error finding journey by ID:', error);
      throw error;
    }
  }
  
  async updateMilestone(milestoneId, status) {
    const milestoneIndex = this.milestones.findIndex(m => m.id === milestoneId);
    if (milestoneIndex !== -1) {
      this.milestones[milestoneIndex].status = status;
      if (status === 'completed') {
        this.milestones[milestoneIndex].completed_date = new Date().toISOString();
      }
      
      try {
        await db.collection('crm_journeys').doc(this.id).update({
          milestones: this.milestones,
          updated_date: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error updating milestone:', error);
        throw error;
      }
    }
  }
}

module.exports = Journey;
