// backend/src/models/Communication.js - Communication Tracking Model
const { db } = require('../config/db');

class Communication {
  constructor(data) {
    this.id = data.id || null;
    this.lead_id = data.lead_id || '';
    this.lead_name = data.lead_name || '';
    this.communication_type = data.communication_type || 'call'; // call, email, whatsapp, meeting, sms
    this.direction = data.direction || 'outbound'; // outbound, inbound
    this.subject = data.subject || '';
    this.content = data.content || '';
    this.duration_minutes = data.duration_minutes || null; // for calls/meetings
    this.outcome = data.outcome || ''; // interested, not_interested, follow_up, closed, etc.
    this.next_follow_up_date = data.next_follow_up_date || null;
    this.next_follow_up_type = data.next_follow_up_type || null;
    this.tags = data.tags || []; // Array of tags like ['quotation_sent', 'pricing_discussed']
    this.attachments = data.attachments || []; // Array of file references
    this.created_by = data.created_by || '';
    this.created_by_name = data.created_by_name || '';
    this.created_date = data.created_date || new Date().toISOString();
    this.updated_date = data.updated_date || new Date().toISOString();
    this.is_auto_logged = data.is_auto_logged || false; // true for system-generated communications
    this.auto_log_trigger = data.auto_log_trigger || null; // 'lead_creation', 'status_change', etc.
    this.sentiment = data.sentiment || 'neutral'; // positive, negative, neutral
    this.temperature = data.temperature || 'warm'; // hot, warm, cold
    this.priority = data.priority || 'medium'; // high, medium, low
    this.internal_notes = data.internal_notes || ''; // Private notes, not visible to client
    this.client_visible = data.client_visible || false; // Whether this comm is visible to client portal
  }

  // Validate communication data
  validate() {
    const errors = [];

    if (!this.lead_id) {
      errors.push('Lead ID is required');
    }

    if (!this.communication_type) {
      errors.push('Communication type is required');
    }

    const validTypes = ['call', 'email', 'whatsapp', 'meeting', 'sms', 'in_person', 'video_call'];
    if (!validTypes.includes(this.communication_type)) {
      errors.push('Invalid communication type');
    }

    const validDirections = ['outbound', 'inbound'];
    if (!validDirections.includes(this.direction)) {
      errors.push('Invalid direction');
    }

    if (!this.created_by) {
      errors.push('Created by is required');
    }

    return errors;
  }

  // Save communication to database
  async save() {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    const communicationData = {
      lead_id: this.lead_id,
      lead_name: this.lead_name,
      communication_type: this.communication_type,
      direction: this.direction,
      subject: this.subject,
      content: this.content,
      duration_minutes: this.duration_minutes,
      outcome: this.outcome,
      next_follow_up_date: this.next_follow_up_date,
      next_follow_up_type: this.next_follow_up_type,
      tags: this.tags,
      attachments: this.attachments,
      created_by: this.created_by,
      created_by_name: this.created_by_name,
      created_date: this.created_date,
      updated_date: new Date().toISOString(),
      is_auto_logged: this.is_auto_logged,
      auto_log_trigger: this.auto_log_trigger,
      sentiment: this.sentiment,
      temperature: this.temperature,
      priority: this.priority,
      internal_notes: this.internal_notes,
      client_visible: this.client_visible
    };

    try {
      if (this.id) {
        // Update existing communication
        await db.collection('crm_communications').doc(this.id).update(communicationData);
        console.log('Communication updated:', this.id);
      } else {
        // Create new communication
        const docRef = await db.collection('crm_communications').add(communicationData);
        this.id = docRef.id;
        console.log('Communication created:', this.id);
        
        // Auto-update lead's last_contact_date
        await this.updateLeadLastContact();
      }

      return { id: this.id, ...communicationData };
    } catch (error) {
      console.error('Error saving communication:', error);
      throw error;
    }
  }

  // Update lead's last contact date and temperature
  async updateLeadLastContact() {
    try {
      const updateData = {
        last_contact_date: this.created_date,
        last_communication_type: this.communication_type,
        last_communication_outcome: this.outcome,
        updated_date: new Date().toISOString()
      };

      // Update temperature if it's set
      if (this.temperature && this.temperature !== 'warm') {
        updateData.temperature = this.temperature;
      }

      await db.collection('crm_leads').doc(this.lead_id).update(updateData);
      console.log('Lead last contact updated:', this.lead_id);
    } catch (error) {
      console.error('Error updating lead last contact:', error);
      // Don't throw - communication should still be saved even if lead update fails
    }
  }

  // Static methods for querying communications

  // Get all communications for a lead (with pagination)
  static async getByLeadId(leadId, limit = 50, startAfter = null) {
    try {
      let query = db.collection('crm_communications')
        .where('lead_id', '==', leadId)
        .orderBy('created_date', 'desc')
        .limit(limit);

      if (startAfter) {
        query = query.startAfter(startAfter);
      }

      const snapshot = await query.get();

      const communications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return communications;
    } catch (error) {
      console.error('Error fetching communications for lead:', error);
      throw error;
    }
  }

  // Get communication by ID
  static async getById(id) {
    try {
      const doc = await db.collection('crm_communications').doc(id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error fetching communication:', error);
      throw error;
    }
  }

  // Get communications by user (for dashboard)
  static async getByUser(userEmail, startDate = null, endDate = null, limit = 100) {
    try {
      let query = db.collection('crm_communications')
        .where('created_by', '==', userEmail)
        .orderBy('created_date', 'desc');

      if (startDate) {
        query = query.where('created_date', '>=', startDate);
      }
      if (endDate) {
        query = query.where('created_date', '<=', endDate);
      }

      const snapshot = await query.limit(limit).get();

      const communications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return communications;
    } catch (error) {
      console.error('Error fetching communications for user:', error);
      throw error;
    }
  }

  // Get recent communications across all leads
  static async getRecent(limit = 20, userEmail = null) {
    try {
      let query = db.collection('crm_communications')
        .orderBy('created_date', 'desc')
        .limit(limit);

      if (userEmail) {
        query = query.where('created_by', '==', userEmail);
      }

      const snapshot = await query.get();

      const communications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return communications;
    } catch (error) {
      console.error('Error fetching recent communications:', error);
      throw error;
    }
  }

  // Update communication
  static async update(id, updateData) {
    try {
      const updateFields = {
        ...updateData,
        updated_date: new Date().toISOString()
      };

      await db.collection('crm_communications').doc(id).update(updateFields);
      
      // Return updated document
      return await Communication.getById(id);
    } catch (error) {
      console.error('Error updating communication:', error);
      throw error;
    }
  }

  // Delete communication
  static async delete(id) {
    try {
      await db.collection('crm_communications').doc(id).delete();
      return true;
    } catch (error) {
      console.error('Error deleting communication:', error);
      throw error;
    }
  }

  // Get communication analytics
  static async getAnalytics(startDate, endDate, userEmail = null) {
    try {
      let query = db.collection('crm_communications');

      if (userEmail) {
        query = query.where('created_by', '==', userEmail);
      }
      if (startDate) {
        query = query.where('created_date', '>=', startDate);
      }
      if (endDate) {
        query = query.where('created_date', '<=', endDate);
      }

      const snapshot = await query.get();
      const communications = snapshot.docs.map(doc => doc.data());

      // Calculate analytics
      const analytics = {
        total_communications: communications.length,
        by_type: {},
        by_direction: {},
        by_outcome: {},
        by_temperature: {},
        total_call_minutes: 0,
        average_call_duration: 0,
        follow_ups_scheduled: 0,
        auto_logged_count: 0,
        manual_logged_count: 0
      };

      let totalCallDuration = 0;
      let callCount = 0;

      communications.forEach(comm => {
        // By type
        analytics.by_type[comm.communication_type] = (analytics.by_type[comm.communication_type] || 0) + 1;
        
        // By direction
        analytics.by_direction[comm.direction] = (analytics.by_direction[comm.direction] || 0) + 1;
        
        // By outcome
        if (comm.outcome) {
          analytics.by_outcome[comm.outcome] = (analytics.by_outcome[comm.outcome] || 0) + 1;
        }
        
        // By temperature
        analytics.by_temperature[comm.temperature] = (analytics.by_temperature[comm.temperature] || 0) + 1;
        
        // Call duration tracking
        if (comm.communication_type === 'call' && comm.duration_minutes) {
          totalCallDuration += comm.duration_minutes;
          callCount++;
        }
        
        analytics.total_call_minutes += comm.duration_minutes || 0;
        
        // Follow-ups
        if (comm.next_follow_up_date) {
          analytics.follow_ups_scheduled++;
        }
        
        // Auto vs manual logging
        if (comm.is_auto_logged) {
          analytics.auto_logged_count++;
        } else {
          analytics.manual_logged_count++;
        }
      });

      // Calculate average call duration
      if (callCount > 0) {
        analytics.average_call_duration = Math.round(totalCallDuration / callCount);
      }

      return analytics;
    } catch (error) {
      console.error('Error getting communication analytics:', error);
      throw error;
    }
  }

  // Auto-log system communications (called from other parts of the system)
  static async autoLog(leadId, leadData, trigger, details = {}) {
    try {
      const autoLogMessages = {
        'lead_creation': `Lead created: ${leadData.name} from ${leadData.source}`,
        'status_change': `Status changed from ${details.oldStatus} to ${leadData.status}`,
        'assignment_change': `Lead assigned to ${leadData.assigned_to}`,
        'auto_assignment': `Auto-assigned to ${leadData.assigned_to} via ${details.ruleName}`,
        'temperature_change': `Temperature changed to ${leadData.temperature}`
      };

      const communicationData = {
        lead_id: leadId,
        lead_name: leadData.name || 'Unknown',
        communication_type: 'system',
        direction: 'internal',
        subject: autoLogMessages[trigger] || `System action: ${trigger}`,
        content: details.message || autoLogMessages[trigger] || '',
        created_by: 'system',
        created_by_name: 'System',
        is_auto_logged: true,
        auto_log_trigger: trigger,
        sentiment: 'neutral',
        temperature: leadData.temperature || 'warm',
        priority: 'low',
        client_visible: false
      };

      const communication = new Communication(communicationData);
      const saved = await communication.save();
      
      console.log(`Auto-logged communication: ${trigger} for lead ${leadId}`);
      return saved;
    } catch (error) {
      console.error('Error auto-logging communication:', error);
      // Don't throw - auto-logging should not break the main flow
      return null;
    }
  }
}

module.exports = Communication;
