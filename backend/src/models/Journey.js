// backend/src/models/Journey.js - Sports-Enhanced Version
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
    
    // Package and services
    this.package_type = data.package_type || 'tickets_only';
    this.included_services = data.included_services || [];
    
    // ✅ NEW: Sports-specific fields
    this.sport_type = data.sport_type || 'cricket'; // cricket, football, tennis, etc.
    this.event_format = data.event_format || 'match'; // match, tournament, series
    this.teams = data.teams || {}; // { home: 'Team A', away: 'Team B' }
    this.is_local_event = data.is_local_event || false;
    this.stadium_info = data.stadium_info || {};
    this.match_format = data.match_format; // T20, ODI, Test for cricket
    
    // Generate appropriate milestones
    this.milestones = this.generateSmartMilestones(data);
    
    // Optional details
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
  
  // ✅ NEW: Smart milestone generation based on context
  generateSmartMilestones(data) {
    const milestones = [];
    const isLocal = data.is_local_event;
    const services = data.included_services || [];
    const sportType = data.sport_type || 'cricket';
    
    // 1. Ticket/Booking confirmation (always first)
    milestones.push({
      id: 'tickets_secured',
      title: 'Tickets Confirmed',
      description: this.getTicketDescription(sportType, data.match_format),
      status: 'completed',
      icon: '🎫',
      completed_date: new Date().toISOString()
    });
    
    // 2. Travel arrangements (only if NOT local and has travel services)
    if (!isLocal && (services.includes('flights') || services.includes('accommodation'))) {
      if (services.includes('visa_assistance')) {
        milestones.push({
          id: 'visa_processing',
          title: 'Travel Documents',
          description: 'Visa and travel documentation in progress',
          status: 'pending',
          icon: '📄',
          completed_date: null
        });
      }
      
      if (services.includes('flights')) {
        milestones.push({
          id: 'travel_arranged',
          title: 'Flight Bookings',
          description: 'Your flight arrangements are being finalized',
          status: 'pending',
          icon: '✈️',
          completed_date: null
        });
      }
      
      if (services.includes('accommodation')) {
        milestones.push({
          id: 'hotel_booked',
          title: 'Accommodation Ready',
          description: 'Your stay near the venue is confirmed',
          status: 'pending',
          icon: '🏨',
          completed_date: null
        });
      }
    }
    
    // 3. Local event specific milestones
    if (isLocal) {
      milestones.push({
        id: 'parking_info',
        title: 'Venue Information',
        description: 'Parking passes and gate information will be shared',
        status: 'pending',
        icon: '🚗',
        completed_date: null
      });
    }
    
    // 4. Pre-match preparations (context-aware)
    if (!isLocal && services.length > 0) {
      milestones.push({
        id: 'pack_bags',
        title: 'Travel Preparations',
        description: 'Get ready for your journey',
        status: 'pending',
        icon: '🎒',
        completed_date: null
      });
    } else {
      milestones.push({
        id: 'match_prep',
        title: 'Match Day Prep',
        description: this.getMatchPrepDescription(sportType),
        status: 'pending',
        icon: '📋',
        completed_date: null
      });
    }
    
    // 5. Match day experience
    milestones.push({
      id: 'match_day',
      title: this.getMatchDayTitle(sportType, data.event_format),
      description: 'Experience the thrill of live sports',
      status: 'pending',
      icon: this.getSportIcon(sportType),
      completed_date: null
    });
    
    // 6. Post-match (always last)
    milestones.push({
      id: 'memories',
      title: 'Share Your Experience',
      description: 'Tell us about your experience and share memories',
      status: 'pending',
      icon: '📸',
      completed_date: null
    });
    
    return milestones;
  }
  
  // Helper methods for sport-specific content
  getTicketDescription(sport, format) {
    const descriptions = {
      cricket: format === 'T20' ? 'Your T20 match tickets are secured' : 
               format === 'Test' ? 'Your Test match tickets for all days secured' :
               'Your cricket match tickets are confirmed',
      football: 'Your football match tickets are confirmed',
      tennis: 'Your tennis match tickets are secured',
      f1: 'Your F1 race weekend passes are confirmed'
    };
    return descriptions[sport] || 'Your event tickets are confirmed';
  }
  
  getMatchPrepDescription(sport) {
    const descriptions = {
      cricket: 'Check weather, download stadium app, plan your day',
      football: 'Check team lineups, plan stadium arrival',
      tennis: 'Check order of play, plan your courts schedule',
      f1: 'Download track map, check race schedule'
    };
    return descriptions[sport] || 'Prepare for match day';
  }
  
  getMatchDayTitle(sport, format) {
    const titles = {
      cricket: format === 'series' ? 'Cricket Series Experience' : 'Match Day',
      football: 'Kick-Off Time',
      tennis: format === 'tournament' ? 'Tournament Days' : 'Match Day',
      f1: 'Race Weekend'
    };
    return titles[sport] || 'Event Day';
  }
  
  getSportIcon(sport) {
    const icons = {
      cricket: '🏏',
      football: '⚽',
      tennis: '🎾',
      basketball: '🏀',
      f1: '🏎️',
      rugby: '🏉',
      golf: '⛳'
    };
    return icons[sport] || '🏟️';
  }
  
  generateJourneyUrl() {
    const baseUrl = process.env.FRONTEND_URL || 'https://crm.fantopark.com';
    return `${baseUrl}/journey/${this.journey_token}`;
  }
  
  // Convert to plain object for Firestore
  toFirestore() {
    const data = {};
    
    // Include all defined properties
    const fields = [
      'order_id', 'lead_id', 'client_name', 'event_id', 'event_name',
      'event_date', 'venue', 'journey_url', 'journey_token', 'package_type',
      'included_services', 'sport_type', 'event_format', 'teams',
      'is_local_event', 'stadium_info', 'match_format', 'milestones',
      'experiences', 'transport_details', 'accommodation_details',
      'dining_options', 'custom_inclusions', 'created_date', 'updated_date',
      'created_by'
    ];
    
    fields.forEach(field => {
      if (this[field] !== undefined) {
        data[field] = this[field];
      }
    });
    
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
