const { db, collections } = require('../config/db');

class Journey {
  constructor(data) {
    this.id = data.id || null;
    this.order_id = data.order_id;
    this.lead_id = data.lead_id;
    this.client_name = data.client_name;
    this.event_id = data.event_id;
    this.event_name = data.event_name;
    this.event_date = data.event_date;
    this.venue = data.venue;
    this.journey_url = data.journey_url;
    this.journey_token = data.journey_token || this.generateToken();
    
    // Journey milestones
    this.milestones = data.milestones || [
      {
        id: 'tickets_secured',
        title: 'Tickets Secured',
        description: 'Your premium tickets are confirmed',
        status: 'pending',
        icon: '✅',
        completed_date: null
      },
      {
        id: 'travel_arranged',
        title: 'Flight & Stay Arranged',
        description: 'Travel and accommodation confirmed',
        status: 'pending',
        icon: '✈️',
        completed_date: null
      },
      {
        id: 'pack_bags',
        title: 'Pack Your Bags',
        description: 'Prepare for your journey',
        status: 'pending',
        icon: '🎒',
        completed_date: null
      },
      {
        id: 'match_day',
        title: 'Match Day Experience',
        description: 'Your premium experience awaits',
        status: 'pending',
        icon: '🏟️',
        completed_date: null
      },
      {
        id: 'memories',
        title: 'Create Memories',
        description: 'Exclusive post-event experiences',
        status: 'pending',
        icon: '🏆',
        completed_date: null
      }
    ];
    
    // Premium experiences
    this.experiences = data.experiences || [];
    this.transport_details = data.transport_details || {};
    this.accommodation_details = data.accommodation_details || {};
    this.dining_options = data.dining_options || [];
    
    // Metadata
    this.created_date = data.created_date || new Date().toISOString();
    this.updated_date = new Date().toISOString();
    this.created_by = data.created_by;
  }
  
  generateToken() {
    return 'FTP' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
  
  generateJourneyUrl() {
    const baseUrl = process.env.FRONTEND_URL || 'https://fantopark-crm.web.app';
    return `${baseUrl}/journey/${this.journey_token}`;
  }
  
  async save() {
    this.journey_url = this.generateJourneyUrl();
    const docRef = await db.collection('crm_journeys').add({...this});
    return { id: docRef.id, ...this };
  }
  
  static async findByToken(token) {
    const snapshot = await db.collection('crm_journeys')
      .where('journey_token', '==', token)
      .limit(1)
      .get();
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  }
  
  async updateMilestone(milestoneId, status) {
    const milestoneIndex = this.milestones.findIndex(m => m.id === milestoneId);
    if (milestoneIndex !== -1) {
      this.milestones[milestoneIndex].status = status;
      if (status === 'completed') {
        this.milestones[milestoneIndex].completed_date = new Date().toISOString();
      }
      await db.collection('crm_journeys').doc(this.id).update({
        milestones: this.milestones,
        updated_date: new Date().toISOString()
      });
    }
  }
}

module.exports = Journey;
