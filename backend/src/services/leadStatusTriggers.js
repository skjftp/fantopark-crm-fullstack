// services/leadStatusTriggers.js
const FacebookConversionsService = require('./facebookConversionsService');
const { db } = require('../config/db');

class LeadStatusTriggers {
  constructor() {
    this.fbConversions = new FacebookConversionsService();
  }

  // Main function to handle status changes
  async handleStatusChange(leadId, oldStatus, newStatus, updatedData = {}) {
    try {
      console.log(`🔄 Processing status change for lead ${leadId}: ${oldStatus} → ${newStatus}`);

      // Get the full lead data
      const leadDoc = await db.collection('crm_leads').doc(leadId).get();
      if (!leadDoc.exists) {
        throw new Error('Lead not found');
      }

      const leadData = { id: leadId, ...leadDoc.data() };

      // Only process Facebook/Instagram leads with campaign data
      if (!this.isMetaLead(leadData)) {
        console.log('ℹ️ Skipping conversion tracking - not a Meta lead or missing campaign data');
        return;
      }

      // Process different status changes
      switch (newStatus) {
        case 'qualified':
          await this.handleQualifiedStatus(leadData);
          break;
        
        case 'converted':
          await this.handleConvertedStatus(leadData, updatedData);
          break;
          
        // You can add more status triggers here
        case 'contacted':
          // Optional: Track initial contact events
          break;
      }

      // Log the trigger activity
      await this.logTriggerActivity(leadId, newStatus, 'facebook_conversion');

    } catch (error) {
      console.error('❌ Error in status change trigger:', error);
      // Don't throw - we don't want to break the main status update
      await this.logTriggerError(leadId, newStatus, error.message);
    }
  }

  // Check if this is a Meta (Facebook/Instagram) lead with campaign data
  isMetaLead(leadData) {
    return (
      leadData.source === 'Instagram' || 
      leadData.source === 'Facebook' ||
      leadData.platform === 'instagram' ||
      leadData.platform === 'facebook'
    ) && (
      leadData.campaign_id || 
      leadData.ad_id || 
      leadData.meta_lead_id
    );
  }

  // Handle qualified status
  async handleQualifiedStatus(leadData) {
    try {
      console.log(`📈 Sending qualified lead event for: ${leadData.email}`);
      
      const result = await this.fbConversions.sendQualifiedLeadEvent(leadData);
      
      console.log('✅ Qualified lead event sent successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to send qualified lead event:', error);
      throw error;
    }
  }

  // Handle converted status
  async handleConvertedStatus(leadData, updatedData) {
    try {
      console.log(`🎯 Sending conversion event for: ${leadData.email}`);
      
      // Get conversion value from updated data or use last quoted price
      const conversionValue = updatedData.conversion_value || 
                            updatedData.last_quoted_price || 
                            leadData.last_quoted_price || 
                            0;
      
      const result = await this.fbConversions.sendConvertedLeadEvent(leadData, conversionValue);
      
      console.log('✅ Conversion event sent successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to send conversion event:', error);
      throw error;
    }
  }

  // Log trigger activity
  async logTriggerActivity(leadId, status, triggerType) {
    try {
      await db.collection('crm_activity_logs').add({
        type: 'trigger_executed',
        lead_id: leadId,
        description: `${triggerType} trigger executed for status: ${status}`,
        metadata: {
          trigger_type: triggerType,
          new_status: status,
          executed_at: new Date().toISOString()
        },
        created_by: 'System',
        created_date: new Date()
      });
    } catch (error) {
      console.error('Error logging trigger activity:', error);
    }
  }

  // Log trigger errors
  async logTriggerError(leadId, status, errorMessage) {
    try {
      await db.collection('crm_activity_logs').add({
        type: 'trigger_error',
        lead_id: leadId,
        description: `Failed to execute trigger for status: ${status}`,
        metadata: {
          error: errorMessage,
          new_status: status,
          failed_at: new Date().toISOString()
        },
        created_by: 'System',
        created_date: new Date()
      });
    } catch (error) {
      console.error('Error logging trigger error:', error);
    }
  }

  // Batch process multiple status changes (useful for bulk updates)
  async batchProcessStatusChanges(statusChanges) {
    const results = [];
    
    for (const change of statusChanges) {
      try {
        await this.handleStatusChange(
          change.leadId, 
          change.oldStatus, 
          change.newStatus, 
          change.updatedData
        );
        results.push({ leadId: change.leadId, success: true });
      } catch (error) {
        results.push({ 
          leadId: change.leadId, 
          success: false, 
          error: error.message 
        });
      }
    }
    
    return results;
  }
}

module.exports = LeadStatusTriggers;
