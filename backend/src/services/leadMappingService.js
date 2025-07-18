// backend/src/services/leadMappingService.js

const { db, collections } = require('../config/db');

class LeadMappingService {
  constructor() {
    // Cache for inventory lookups
    this.inventoryCache = null;
    this.cacheExpiry = null;
    // Manual mappings for current import session
    this.manualMappings = {};
    // Saved mappings cache
    this.savedMappings = null;
  }

  // Set manual mappings for current import
  setManualMappings(mappings) {
    this.manualMappings = mappings || {};
  }

  // Load saved event mappings
  async loadSavedMappings() {
    if (!this.savedMappings) {
      const EventMapping = require('../models/EventMapping');
      this.savedMappings = await EventMapping.getMappingsLookup();
    }
    return this.savedMappings;
  }

  // Get all inventory items (with caching)
  async getInventoryItems() {
    const now = new Date();
    
    // Cache for 5 minutes
    if (this.inventoryCache && this.cacheExpiry && this.cacheExpiry > now) {
      return this.inventoryCache;
    }

    const snapshot = await db.collection(collections.inventory).get();
    const inventory = [];
    
    snapshot.forEach(doc => {
      inventory.push({ id: doc.id, ...doc.data() });
    });

    this.inventoryCache = inventory;
    this.cacheExpiry = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
    
    return inventory;
  }

  // Get inventory by ID
  async getInventoryById(inventoryId) {
    const inventory = await this.getInventoryItems();
    return inventory.find(item => item.id === inventoryId);
  }

  // Find matching inventory item by event name
  async findInventoryByEventName(tourName) {
    const inventory = await this.getInventoryItems();
    
    // Try exact match first
    let match = inventory.find(item => 
      item.event_name && item.event_name.toLowerCase() === tourName.toLowerCase()
    );

    // If no exact match, try partial match
    if (!match) {
      match = inventory.find(item => 
        item.event_name && (
          item.event_name.toLowerCase().includes(tourName.toLowerCase()) ||
          tourName.toLowerCase().includes(item.event_name.toLowerCase())
        )
      );
    }

    return match;
  }

  // Find inventory for a tour/event name using all mapping methods
  async findInventoryForEvent(tourName, websiteLeadId) {
    // 1. Check manual mappings first (from current import session)
    if (this.manualMappings[websiteLeadId]) {
      const inventory = await this.getInventoryById(this.manualMappings[websiteLeadId]);
      if (inventory) {
        console.log(`✅ Using manual mapping for "${tourName}"`);
        return inventory;
      }
    }

    // 2. Check saved mappings
    await this.loadSavedMappings();
    if (this.savedMappings && this.savedMappings[tourName]) {
      const inventory = await this.getInventoryById(this.savedMappings[tourName].inventory_id);
      if (inventory) {
        console.log(`✅ Using saved mapping for "${tourName}"`);
        return inventory;
      }
    }

    // 3. Try auto-match by name
    const inventory = await this.findInventoryByEventName(tourName);
    if (inventory) {
      console.log(`✅ Auto-matched "${tourName}" to inventory`);
    }
    
    return inventory;
  }

  // Map website lead source to CRM lead source
  mapLeadSource(referralCode) {
    const sourceMap = {
      'facebook': 'facebook',
      'instagram': 'instagram',
      'email': 'email',
      'other': 'other',
      'google': 'google',
      'whatsapp': 'whatsapp'
    };

    return sourceMap[referralCode] || 'website';
  }

  // Map single website lead to CRM lead format
  async mapWebsiteLeadToCRM(websiteLead, importedBy) {
    // Find matching inventory using all mapping methods
    const inventory = await this.findInventoryForEvent(websiteLead.tours, websiteLead.id);
    
    const crmLead = {
      // Basic info
      name: websiteLead.name || '',
      email: websiteLead.email || '',
      phone: websiteLead.phone_number || '',
      
      // Source info
      lead_source: this.mapLeadSource(websiteLead.referral_code),
      website_lead_id: websiteLead.id, // Store original website lead ID
      
      // Event info
      event_name: websiteLead.tours || '',
      inventory_id: inventory ? inventory.id : null,
      match_date: websiteLead.trip_date ? new Date(websiteLead.trip_date).toISOString() : '',
      
      // Trip details
      trip_type: websiteLead.trip_type || 'generic',
      number_of_persons: websiteLead.persons || 1,
      budget: websiteLead.price || 0,
      currency: websiteLead.currency || '₹',
      
      // Location
      city: websiteLead.location || '',
      
      // Additional services
      additional_services: Array.isArray(websiteLead.additional_services) 
        ? websiteLead.additional_services.join(', ') 
        : '',
      
      // Status
      status: 'unassigned',
      stage: 'new',
      
      // Metadata
      created_by: importedBy,
      created_date: new Date().toISOString(),
      imported_from: 'website',
      import_date: new Date().toISOString(),
      
      // Notes
      notes: `Imported from website. Original ID: ${websiteLead.id}`
    };

    // Add warning if no inventory match found
    if (!inventory && websiteLead.tours) {
      crmLead.notes += `\n⚠️ No matching inventory found for tour: ${websiteLead.tours}`;
    }

    return crmLead;
  }

  // Group leads by group_id for multi-lead creation
  groupWebsiteLeads(websiteLeads) {
    const grouped = new Map();
    const singles = [];

    websiteLeads.forEach(lead => {
      if (lead.group_id) {
        if (!grouped.has(lead.group_id)) {
          grouped.set(lead.group_id, []);
        }
        grouped.get(lead.group_id).push(lead);
      } else {
        singles.push(lead);
      }
    });

    return { grouped, singles };
  }

  // Process website leads for import
  async processWebsiteLeadsForImport(websiteLeads, importedBy) {
    const { grouped, singles } = this.groupWebsiteLeads(websiteLeads);
    const processedLeads = [];
    const errors = [];

    // Process single leads
    for (const websiteLead of singles) {
      try {
        const crmLead = await this.mapWebsiteLeadToCRM(websiteLead, importedBy);
        processedLeads.push({
          type: 'single',
          lead: crmLead,
          originalLead: websiteLead
        });
      } catch (error) {
        errors.push({
          websiteLead,
          error: error.message
        });
      }
    }

    // Process grouped leads (multi-event bookings)
    for (const [groupId, groupLeads] of grouped) {
      try {
        // Use the first lead as the primary contact
        const primaryLead = groupLeads[0];
        const tours = groupLeads.map(l => l.tours).filter(Boolean);
        
        // Create multi-lead data
        const multiLeadData = {
          type: 'multi',
          primaryContact: {
            name: primaryLead.name,
            email: primaryLead.email,
            phone: primaryLead.phone_number
          },
          tours: tours,
          leads: []
        };

        // Map each lead in the group
        for (const websiteLead of groupLeads) {
          const crmLead = await this.mapWebsiteLeadToCRM(websiteLead, importedBy);
          crmLead.group_id = `website_group_${groupId}`;
          multiLeadData.leads.push(crmLead);
        }

        processedLeads.push({
          type: 'multi',
          data: multiLeadData,
          originalLeads: groupLeads
        });
      } catch (error) {
        errors.push({
          groupId,
          websiteLeads: groupLeads,
          error: error.message
        });
      }
    }

    return { processedLeads, errors };
  }

  // Check if a lead was already imported
  async checkIfLeadExists(websiteLeadId) {
    const snapshot = await db.collection(collections.leads)
      .where('website_lead_id', '==', websiteLeadId)
      .limit(1)
      .get();

    return !snapshot.empty;
  }

  // Filter out already imported leads
  async filterNewLeads(websiteLeads) {
    const newLeads = [];
    const existingLeads = [];

    for (const lead of websiteLeads) {
      const exists = await this.checkIfLeadExists(lead.id);
      if (exists) {
        existingLeads.push(lead);
      } else {
        newLeads.push(lead);
      }
    }

    return { newLeads, existingLeads };
  }
}

module.exports = new LeadMappingService();
