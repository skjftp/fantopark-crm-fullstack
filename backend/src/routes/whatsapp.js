const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// WhatsApp webhook verification
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('WhatsApp webhook verification request:', { mode, token, challenge });

  if (mode && token) {
    // Use the same verify token as Meta webhook
    const verifyToken = process.env.META_VERIFY_TOKEN || 'fantopark-webhook-verify-2024';
    
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('✅ WhatsApp webhook verified');
      res.status(200).send(challenge);
    } else {
      console.log('❌ WhatsApp webhook verification failed - token mismatch');
      res.sendStatus(403);
    }
  } else {
    console.log('❌ WhatsApp webhook verification failed - missing parameters');
    res.sendStatus(400);
  }
});

// WhatsApp webhook - receive messages (simplified for now)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    console.log('📨 WhatsApp webhook POST received');
    
    // For now, just acknowledge receipt
    res.sendStatus(200);
  } catch (error) {
    console.error('❌ WhatsApp webhook error:', error);
    res.sendStatus(500);
  }
});

// Temporarily disabled complex endpoints
// TODO: Re-enable after basic webhook is working

module.exports = router;