const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const whatsappService = require('../services/whatsappService');
const whatsappConfig = require('../config/whatsappConfig');

// WhatsApp webhook verification
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === whatsappConfig.webhookVerifyToken) {
      console.log('✅ WhatsApp webhook verified');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// WhatsApp webhook - receive messages
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.get('x-hub-signature-256');
    if (signature) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.META_APP_SECRET || '')
        .update(req.body)
        .digest('hex');
      
      if (signature !== `sha256=${expectedSignature}`) {
        console.error('❌ Invalid webhook signature');
        return res.sendStatus(403);
      }
    }

    const body = JSON.parse(req.body.toString());
    console.log('📨 WhatsApp webhook received:', JSON.stringify(body, null, 2));

    // Process the webhook data
    if (body.entry && body.entry.length > 0) {
      // Process messages asynchronously
      setImmediate(() => {
        whatsappService.processIncomingMessage(body);
      });
    }

    // Always return 200 OK immediately
    res.sendStatus(200);
  } catch (error) {
    console.error('❌ WhatsApp webhook error:', error);
    res.sendStatus(500);
  }
});

// Manual send welcome message (for testing)
router.post('/send-welcome', async (req, res) => {
  try {
    const { leadId } = req.body;
    
    if (!leadId) {
      return res.status(400).json({ error: 'Lead ID is required' });
    }

    // Get lead data
    const admin = require('../config/firebase');
    const db = admin.firestore();
    
    const leadDoc = await db.collection('crm_leads').doc(leadId).get();
    if (!leadDoc.exists) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const leadData = { id: leadDoc.id, ...leadDoc.data() };
    
    // Get assigned rep data
    if (!leadData.assigned_to) {
      return res.status(400).json({ error: 'Lead is not assigned to anyone' });
    }

    const userSnapshot = await db.collection('crm_users')
      .where('email', '==', leadData.assigned_to)
      .limit(1)
      .get();
    
    if (userSnapshot.empty) {
      return res.status(404).json({ error: 'Assigned user not found' });
    }

    const assignedRep = userSnapshot.docs[0].data();
    
    // Send welcome message
    const result = await whatsappService.sendWelcomeMessage(leadData, {
      name: assignedRep.name || assignedRep.email,
      phone: assignedRep.phone || ''
    });

    res.json({
      success: true,
      message: 'Welcome message sent successfully',
      result
    });
  } catch (error) {
    console.error('Error sending welcome message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get conversation state (for debugging)
router.get('/conversation/:phone', async (req, res) => {
  try {
    const phone = req.params.phone;
    const state = conversationCache.get(phone);
    
    res.json({
      phone,
      hasActiveConversation: !!state,
      state
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;