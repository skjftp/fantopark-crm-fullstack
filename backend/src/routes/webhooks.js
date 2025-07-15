// backend/src/routes/webhooks.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../config/db');

// Meta webhook verification token - store this securely
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'your-unique-verify-token-here';
const APP_SECRET = process.env.META_APP_SECRET || 'your-app-secret-here';

// Webhook verification endpoint (GET)
router.get('/meta-leads', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Check if mode and token are correct
  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook verified successfully!');
      res.status(200).send(challenge);
    } else {
      console.error('❌ Webhook verification failed');
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// Webhook data receiver endpoint (POST)
router.post('/meta-leads', async (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-hub-signature-256'];
    if (signature) {
      const expectedSignature = crypto
        .createHmac('sha256', APP_SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex');
      
      if (signature !== `sha256=${expectedSignature}`) {
        console.error('❌ Invalid webhook signature');
        return res.sendStatus(403);
      }
    }

    const { entry } = req.body;

    // Process each entry
    for (const pageEntry of entry) {
      const { changes } = pageEntry;
      
      for (const change of changes) {
        if (change.field === 'leadgen') {
          const leadData = change.value;
          
          // Get lead details from Meta API
          const leadDetails = await getLeadDetails(
            leadData.leadgen_id,
            leadData.page_id
          );
          
          // Transform and save lead
          await saveLeadToDatabase(leadDetails, leadData);
        }
      }
    }

    // Send 200 OK to acknowledge receipt
    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.sendStatus(500);
  }
});

// Function to get lead details from Meta API
async function getLeadDetails(leadgenId, pageId) {
  const PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN;
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${leadgenId}?access_token=${PAGE_ACCESS_TOKEN}`,
      { method: 'GET' }
    );
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching lead details:', error);
    throw error;
  }
}

// Function to save lead to your database
async function saveLeadToDatabase(leadDetails, webhookData) {
  try {
    // Extract field values from Meta's format
    const fieldData = {};
    leadDetails.field_data.forEach(field => {
      fieldData[field.name] = field.values[0];
    });

    // Map Instagram fields to your CRM fields
    const leadRecord = {
      // Basic fields
      name: fieldData.full_name || fieldData.first_name + ' ' + fieldData.last_name || '',
      email: fieldData.email || '',
      phone: fieldData.phone_number || '',
      company: fieldData.company_name || '',
      
      // Source and metadata
      source: 'Instagram',
      form_name: leadDetails.form_id || 'Instagram Lead Form',
      campaign_name: leadDetails.campaign_name || '',
      
      // Business fields
      business_type: fieldData.business_type || 'B2C',
      city_of_residence: fieldData.city || '',
      country_of_residence: fieldData.country || 'India',
      
      // Event interest fields
      lead_for_event: fieldData.event_interest || '',
      number_of_people: fieldData.group_size || '1',
      
      // Additional fields
      notes: fieldData.message || fieldData.additional_info || '',
      
      // System fields
      status: 'unassigned',
      date_of_enquiry: new Date().toISOString(),
      created_date: new Date().toISOString(),
      created_by: 'Instagram Lead Form',
      
      // Meta tracking
      meta_lead_id: leadDetails.id,
      meta_form_id: leadDetails.form_id,
      meta_created_time: leadDetails.created_time,
      
      // Store raw data for reference
      raw_data: JSON.stringify(leadDetails)
    };

    // Save to Firestore
    const docRef = await db.collection('crm_leads').add(leadRecord);
    
    console.log('✅ Lead saved successfully:', {
      id: docRef.id,
      name: leadRecord.name,
      email: leadRecord.email
    });

    // Trigger auto-assignment if configured
    await triggerAutoAssignment(docRef.id, leadRecord);
    
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving lead:', error);
    throw error;
  }
}

// Optional: Trigger auto-assignment based on your rules
async function triggerAutoAssignment(leadId, leadData) {
  try {
    // Check if auto-assignment is enabled
    const rulesSnapshot = await db.collection('crm_assignment_rules')
      .where('status', '==', 'active')
      .where('source', 'array-contains', 'Instagram')
      .get();
    
    if (!rulesSnapshot.empty) {
      // Your auto-assignment logic here
      console.log('🔄 Triggering auto-assignment for lead:', leadId);
    }
  } catch (error) {
    console.error('Auto-assignment error:', error);
  }
}

module.exports = router;
