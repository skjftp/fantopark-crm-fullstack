const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// GET all clients (grouped leads)
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching all clients...');
    const clients = await Lead.getAllClients();
    
    // Sort clients by last activity (most recent first)
    clients.sort((a, b) => new Date(b.last_activity) - new Date(a.last_activity));
    
    console.log(`Found ${clients.length} clients`);
    res.json({ data: clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET single client details
router.get('/:clientId', authenticateToken, async (req, res) => {
  try {
    const clientId = req.params.clientId;
    console.log('Fetching client details for:', clientId);
    
    const clientDetails = await Lead.getClientById(clientId);
    
    if (!clientDetails) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    res.json({ data: clientDetails });
  } catch (error) {
    console.error('Error fetching client details:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET client by phone number
router.get('/phone/:phone', authenticateToken, async (req, res) => {
  try {
    const phone = req.params.phone;
    console.log('Looking up client by phone:', phone);
    
    const clientInfo = await Lead.findClientByPhone(phone);
    
    if (clientInfo.exists) {
      const clientDetails = await Lead.getClientById(clientInfo.client_id);
      res.json({ data: clientDetails });
    } else {
      res.status(404).json({ error: 'Client not found' });
    }
  } catch (error) {
    console.error('Error finding client by phone:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Bulk reassign all leads for a client
router.post('/:clientId/reassign', authenticateToken, checkPermission('leads', 'assign'), async (req, res) => {
  try {
    const clientId = req.params.clientId;
    const { new_assigned_to, reason } = req.body;
    
    console.log(`Reassigning all leads for client ${clientId} to ${new_assigned_to}`);
    
    if (!new_assigned_to) {
      return res.status(400).json({ error: 'new_assigned_to is required' });
    }
    
    // Get all leads for this client
    const { db, collections } = require('../config/db');
    const snapshot = await db.collection(collections.leads)
      .where('client_id', '==', clientId)
      .get();
    
    if (snapshot.empty) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    // Update all leads
    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.update(doc.ref, {
        assigned_to: new_assigned_to,
        manual_assignment_override: true,
        reassignment_reason: reason || 'Bulk client reassignment',
        updated_date: new Date().toISOString(),
        client_last_activity: new Date().toISOString()
      });
    });
    
    await batch.commit();
    
    console.log(`Successfully reassigned ${snapshot.size} leads`);
    res.json({ 
      success: true, 
      message: `Successfully reassigned ${snapshot.size} leads to ${new_assigned_to}`,
      updated_leads: snapshot.size
    });
  } catch (error) {
    console.error('Error reassigning client leads:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET client statistics
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const clients = await Lead.getAllClients();
    
    const stats = {
      total_clients: clients.length,
      multi_lead_clients: clients.filter(c => c.total_leads > 1).length,
      total_client_value: clients.reduce((sum, c) => sum + c.total_value, 0),
      avg_leads_per_client: clients.length > 0 ? 
        (clients.reduce((sum, c) => sum + c.total_leads, 0) / clients.length).toFixed(2) : 0,
      top_events: {},
      assignment_distribution: {}
    };
    
    // Calculate top events across all clients
    clients.forEach(client => {
      client.events.forEach(event => {
        stats.top_events[event] = (stats.top_events[event] || 0) + 1;
      });
      
      // Count assignment distribution
      if (client.assigned_to) {
        stats.assignment_distribution[client.assigned_to] = 
          (stats.assignment_distribution[client.assigned_to] || 0) + 1;
      }
    });
    
    res.json({ data: stats });
  } catch (error) {
    console.error('Error getting client stats:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
