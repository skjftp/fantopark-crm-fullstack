// backend/src/routes/webhooks.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../config/db');
const fetch = require('node-fetch');
const { getInventoryByFormId } = require('../utils/inventoryLookup');

// Meta webhook verification token and app secret - store these securely
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'your-unique-verify-token-here';
const APP_SECRET = process.env.META_APP_SECRET || 'your-app-secret-here';
const PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN || 'your-page-access-token';

router.get('/test', (req, res) => {
  res.json({ message: 'Webhook routes are working!' });
});

// ===============================================
// WEBHOOK VERIFICATION ENDPOINT (GET)
// Meta will call this to verify your webhook
// ===============================================
router.get('/meta-leads', (req, res) => {
  console.log('📡 Webhook verification request received');
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('Verification params:', { mode, token, challenge });

  // Check if mode and token are correct
  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook verified successfully!');
      res.status(200).send(challenge);
    } else {
      console.error('❌ Webhook verification failed - token mismatch');
      res.sendStatus(403);
    }
  } else {
    console.error('❌ Missing verification parameters');
    res.sendStatus(400);
  }
});

// ===============================================
// WEBHOOK DATA RECEIVER ENDPOINT (POST)
// Receives lead data from Instagram forms
// ===============================================
router.post('/meta-leads', async (req, res) => {
  console.log('📨 Webhook POST received at:', new Date().toISOString());
  
  try {
    // Verify webhook signature for security
    const signature = req.headers['x-hub-signature-256'];
    if (signature && APP_SECRET && APP_SECRET !== 'your-app-secret-here') {
      // Use raw body for signature verification
      const rawBody = req.rawBody || JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', APP_SECRET)
        .update(rawBody)
        .digest('hex');
      
      if (signature !== `sha256=${expectedSignature}`) {
        console.error('❌ Invalid webhook signature');
        console.error('Expected:', `sha256=${expectedSignature}`);
        console.error('Received:', signature);
        return res.sendStatus(403);
      }
      console.log('✅ Webhook signature verified');
    } else {
      console.warn('⚠️ Webhook signature verification skipped - configure APP_SECRET');
    }

    // Log the webhook payload for debugging
    console.log('📋 Webhook payload:', JSON.stringify(req.body, null, 2));

    const { entry } = req.body;

    if (!entry || !Array.isArray(entry)) {
      console.error('❌ Invalid webhook payload - no entry array');
      return res.sendStatus(400);
    }

    // Process each entry
    for (const pageEntry of entry) {
      const { changes } = pageEntry;
      
      if (!changes || !Array.isArray(changes)) {
        console.warn('⚠️ No changes array in entry');
        continue;
      }
      
      for (const change of changes) {
        if (change.field === 'leadgen') {
          console.log('🎯 Processing leadgen event');
          const leadData = change.value;
          
          try {
            // Get lead details from Meta API
            const leadDetails = await getLeadDetails(
              leadData.leadgen_id,
              leadData.page_id
            );
            
            // Transform and save lead
            const savedLeadId = await saveLeadToDatabase(leadDetails, leadData);
            console.log('✅ Lead processed successfully:', savedLeadId);
            
          } catch (leadError) {
            console.error('❌ Error processing individual lead:', leadError);
            // Continue processing other leads even if one fails
          }
        }
      }
    }

    // Always send 200 OK to acknowledge receipt
    res.sendStatus(200);
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    // Still send 200 to prevent Meta from retrying
    res.sendStatus(200);
  }
});

// ===============================================
// FUNCTION TO GET LEAD DETAILS FROM META API
// ===============================================
async function getLeadDetails(leadgenId, pageId) {
  console.log(`📞 Fetching lead details for ID: ${leadgenId}`);
  
  if (!PAGE_ACCESS_TOKEN || PAGE_ACCESS_TOKEN === 'your-page-access-token') {
    throw new Error('PAGE_ACCESS_TOKEN not configured');
  }
  
  try {
    // Explicitly request all campaign-related fields
    const fields = 'id,created_time,field_data,form_id,is_organic,campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name';
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${leadgenId}?fields=${fields}&access_token=${PAGE_ACCESS_TOKEN}`,
      { method: 'GET' }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Meta API error:', errorData);
      throw new Error(`Meta API error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    console.log('✅ Lead details fetched successfully');
    
    // Debug log to see the full structure
    console.log('📊 Full lead details with campaign data:', JSON.stringify(data, null, 2));
    
    // If campaign data is still missing, try to get it from the form
    if (!data.campaign_id && data.form_id) {
      console.log('🔍 Campaign data not in lead, fetching form details...');
      
      try {
        const formResponse = await fetch(
          `https://graph.facebook.com/v18.0/${data.form_id}?fields=name,leads_retrieval_method,questions,page&access_token=${PAGE_ACCESS_TOKEN}`,
          { method: 'GET' }
        );
        
        if (formResponse.ok) {
          const formData = await formResponse.json();
          console.log('📝 Form details:', JSON.stringify(formData, null, 2));
          
          // Add form name to the lead data
          data.form_name = formData.name || data.form_id;
        }
      } catch (formError) {
        console.error('⚠️ Error fetching form details:', formError);
      }
    }
    
    // If we still don't have campaign data, try another approach
    if (!data.campaign_id) {
      console.log('🔍 Attempting to fetch lead with additional context...');
      
      try {
        // Try to get more details about the lead including ad context
        const contextResponse = await fetch(
          `https://graph.facebook.com/v18.0/${leadgenId}?fields=id,created_time,field_data,form{id,name},campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,retailer_item_id&access_token=${PAGE_ACCESS_TOKEN}`,
          { method: 'GET' }
        );
        
        if (contextResponse.ok) {
          const contextData = await contextResponse.json();
          console.log('📊 Lead with additional context:', JSON.stringify(contextData, null, 2));
          
          // Merge the data
          Object.assign(data, contextData);
        }
      } catch (contextError) {
        console.error('⚠️ Error fetching lead context:', contextError);
      }
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching lead details:', error);
    throw error;
  }
}

// ===============================================
// FUNCTION TO SAVE LEAD TO FIRESTORE DATABASE
// ===============================================
async function saveLeadToDatabase(leadDetails, webhookData) {
  console.log('💾 Saving lead to database');
  
  try {
    // Extract field values from Meta's format
    const fieldData = {};
    if (leadDetails.field_data && Array.isArray(leadDetails.field_data)) {
      leadDetails.field_data.forEach(field => {
        fieldData[field.name] = field.values && field.values[0] ? field.values[0] : '';
      });
    }
    
    console.log('📋 Extracted field data:', fieldData);
    console.log('🎯 Webhook context data:', webhookData);
    console.log('📊 Lead details campaign info:', {
      campaign_id: leadDetails.campaign_id,
      campaign_name: leadDetails.campaign_name,
      adset_id: leadDetails.adset_id,
      adset_name: leadDetails.adset_name,
      ad_id: leadDetails.ad_id,
      ad_name: leadDetails.ad_name,
      form_id: leadDetails.form_id,
      form_name: leadDetails.form_name || leadDetails.form?.name
    });

    // Lookup inventory by form ID
    const inventory = await getInventoryByFormId(db, webhookData.form_id);
    if (inventory) {
      console.log('🎫 Linking to inventory:', inventory.event_name, '-', inventory.category_of_ticket);
    }

    // Map Instagram fields to your CRM fields
    const leadRecord = {
      // Basic fields from your form
      name: fieldData['full name'] || fieldData.full_name || fieldData.name || 'Instagram Lead',
      email: fieldData.email || '',
      phone: fieldData.phone || fieldData.phone_number || '',
      city_of_residence: fieldData.city || '',
      
      // Your custom questions mapping
      has_valid_passport: fieldData['do_you_have_a_valid_passport?'] || '',
      attended_sporting_event_before: fieldData['have_you_attended_any_sporting_event_abroad?'] || '',
      annual_income_bracket: fieldData['what_is_your_annual_income?'] || '',
      number_of_people: fieldData['how_may_tickets_do_you_need?'] || '1',
      
      // New field - add to your CRM if needed
      preferred_contact_time: fieldData['what_is_your_preferred_time_of_contact?'] || '',
      
      // Keep existing defaults
      company: fieldData.company_name || fieldData.company || '',
      country_of_residence: fieldData.country || 'India',
      business_type: 'B2C',
      source: 'Instagram',
      
      // Event and inventory linkage
      lead_for_event: inventory?.event_name || '',
      inventory_id: inventory?.inventory_id || '',
      category_of_ticket: inventory?.category_of_ticket || '',
      
      // Dynamic form and campaign information - UPDATED MAPPING
      form_name: leadDetails.form_name || leadDetails.form?.name || (inventory ? `${inventory.event_name} - ${inventory.category_of_ticket}` : 'Instagram Lead Form'),
      form_id: leadDetails.form_id || webhookData.form_id || '',
      campaign_name: leadDetails.campaign_name || webhookData.campaign_name || '',
      campaign_id: leadDetails.campaign_id || webhookData.campaign_id || '',
      adset_name: leadDetails.adset_name || webhookData.adset_name || '',
      adset_id: leadDetails.adset_id || webhookData.adgroup_id || '',
      ad_name: leadDetails.ad_name || webhookData.ad_name || '',
      ad_id: leadDetails.ad_id || webhookData.ad_id || '',
      
      // System fields
      status: 'unassigned',
      date_of_enquiry: new Date().toISOString(),
      created_date: new Date(),
      created_by: 'Instagram Lead Form',
      
      // Meta tracking
      meta_lead_id: leadDetails.id,
      meta_created_time: leadDetails.created_time || new Date().toISOString(),
      
      // Additional metadata
      notes: fieldData.notes || fieldData.comments || fieldData.message || '',
      platform: leadDetails.platform || 'instagram',
      
      // Analytics fields
      lead_source_details: {
        form_id: leadDetails.form_id || webhookData.form_id || '',
        form_name: leadDetails.form_name || leadDetails.form?.name || '',
        campaign_id: leadDetails.campaign_id || webhookData.campaign_id || '',
        campaign_name: leadDetails.campaign_name || webhookData.campaign_name || '',
        adset_id: leadDetails.adset_id || webhookData.adgroup_id || '',
        adset_name: leadDetails.adset_name || webhookData.adset_name || '',
        ad_id: leadDetails.ad_id || webhookData.ad_id || '',
        ad_name: leadDetails.ad_name || webhookData.ad_name || '',
        created_time: webhookData.created_time ? new Date(webhookData.created_time * 1000).toISOString() : new Date().toISOString()
      }
    };

    // Check for duplicate leads by email
    if (leadRecord.email) {
      const existingLeads = await db.collection('crm_leads')
        .where('email', '==', leadRecord.email)
        .get();
      
      if (!existingLeads.empty) {
        console.log('⚠️ Duplicate lead detected for email:', leadRecord.email);
        // You can choose to update the existing lead or skip
        // For now, we'll add a note and continue
        leadRecord.notes = `${leadRecord.notes}\n[Duplicate submission detected at ${new Date().toISOString()}]`;
      }
    }

    // Save to Firestore
    const docRef = await db.collection('crm_leads').add(leadRecord);
    
    console.log('✅ Lead saved successfully:', {
      id: docRef.id,
      name: leadRecord.name,
      email: leadRecord.email,
      source: leadRecord.source,
      event: leadRecord.lead_for_event,
      inventory: leadRecord.category_of_ticket,
      campaign: leadRecord.campaign_name,
      adset: leadRecord.adset_name,
      ad: leadRecord.ad_name,
      form: leadRecord.form_name
    });

    // Create activity log
    await db.collection('crm_activity_logs').add({
      type: 'lead_created',
      lead_id: docRef.id,
      description: `New Instagram lead created: ${leadRecord.name} from campaign: ${leadRecord.campaign_name || 'Unknown'}`,
      metadata: {
        source: 'Instagram',
        form_id: leadRecord.form_id,
        form_name: leadRecord.form_name,
        campaign_name: leadRecord.campaign_name,
        adset_name: leadRecord.adset_name,
        ad_name: leadRecord.ad_name,
        event: leadRecord.lead_for_event,
        inventory: leadRecord.category_of_ticket,
        auto_created: true
      },
      created_by: 'System',
      created_date: new Date()
    });

    // Trigger auto-assignment if configured
    await triggerAutoAssignment(docRef.id, leadRecord);
    
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving lead to database:', error);
    throw error;
  }
}

// ===============================================
// FUNCTION TO TRIGGER AUTO-ASSIGNMENT
// ===============================================
async function triggerAutoAssignment(leadId, leadData) {
  try {
    console.log('🔄 Checking auto-assignment rules for Instagram lead');
    
    // Check if auto-assignment is enabled
    const rulesSnapshot = await db.collection('crm_assignment_rules')
      .where('status', '==', 'active')
      .get();
    
    if (rulesSnapshot.empty) {
      console.log('ℹ️ No active assignment rules found');
      return;
    }

    // Find matching rule for Instagram source
    let matchingRule = null;
    rulesSnapshot.forEach(doc => {
      const rule = doc.data();
      if (rule.conditions && rule.conditions.sources && 
          rule.conditions.sources.includes('Instagram')) {
        matchingRule = { id: doc.id, ...rule };
      }
    });

    if (!matchingRule) {
      console.log('ℹ️ No assignment rule found for Instagram leads');
      return;
    }

    console.log('✅ Found matching assignment rule:', matchingRule.name);

    // Determine assignee based on rule strategy
    let assignedTo = null;
    
    if (matchingRule.strategy === 'round_robin' && matchingRule.assigned_users?.length > 0) {
      // Get the last assignment index
      const lastIndex = matchingRule.last_assigned_index || 0;
      const nextIndex = (lastIndex + 1) % matchingRule.assigned_users.length;
      assignedTo = matchingRule.assigned_users[nextIndex];
      
      // Update the rule with new index
      await db.collection('crm_assignment_rules').doc(matchingRule.id).update({
        last_assigned_index: nextIndex,
        last_assigned_date: new Date()
      });
    } else if (matchingRule.strategy === 'direct' && matchingRule.assigned_users?.length > 0) {
      assignedTo = matchingRule.assigned_users[0];
    }

    if (assignedTo) {
      // Update lead with assignment
      await db.collection('crm_leads').doc(leadId).update({
        assigned_to: assignedTo,
        status: 'assigned',
        assignment_date: new Date(),
        auto_assigned: true,
        assignment_rule_id: matchingRule.id
      });

      // Create activity log for assignment
      await db.collection('crm_activity_logs').add({
        type: 'lead_assigned',
        lead_id: leadId,
        description: `Lead auto-assigned to ${assignedTo} via rule: ${matchingRule.name}`,
        metadata: {
          rule_id: matchingRule.id,
          rule_name: matchingRule.name,
          strategy: matchingRule.strategy
        },
        created_by: 'System',
        created_date: new Date()
      });

      console.log(`✅ Lead auto-assigned to: ${assignedTo}`);
    }
    
  } catch (error) {
    console.error('❌ Auto-assignment error:', error);
    // Don't throw - assignment failure shouldn't break lead creation
  }
}

// ===============================================
// TEST ENDPOINT (for debugging)
// ===============================================
router.get('/meta-leads/test', (req, res) => {
  res.json({
    status: 'ok',
    webhook_url: `https://fantopark-backend-150582227311.us-central1.run.app/webhooks/meta-leads`,
    verify_token_configured: !!VERIFY_TOKEN && VERIFY_TOKEN !== 'your-unique-verify-token-here',
    app_secret_configured: !!APP_SECRET && APP_SECRET !== 'your-app-secret-here',
    page_token_configured: !!PAGE_ACCESS_TOKEN && PAGE_ACCESS_TOKEN !== 'your-page-access-token',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
