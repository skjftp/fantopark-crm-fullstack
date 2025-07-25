const express = require('express');
const router = express.Router();
const { db } = require('../services/firebase');
const { authenticateToken, checkPermission } = require('../middleware/auth');
const { logUserActivity } = require('../services/auditService');

// Get allocations by lead_id and event_name
router.get('/', authenticateToken, checkPermission('inventory', 'read'), async (req, res) => {
  try {
    const { lead_id, event_name } = req.query;
    
    if (!lead_id || !event_name) {
      return res.status(400).json({
        success: false,
        error: 'lead_id and event_name are required'
      });
    }

    console.log(`Fetching allocations for lead_id: ${lead_id}, event: ${event_name}`);
    
    // Query allocations for the lead and event
    const allocationsSnapshot = await db.collection('crm_allocations')
      .where('lead_id', '==', lead_id)
      .where('inventory_event', '==', event_name)
      .where('isDeleted', '!=', true)
      .get();
    
    const allocations = [];
    const leadIds = new Set();
    
    allocationsSnapshot.forEach(doc => {
      const data = doc.data();
      allocations.push({
        id: doc.id,
        ...data
      });
      if (data.lead_id) leadIds.add(data.lead_id);
    });
    
    // Fetch lead details
    const leadDetailsMap = {};
    if (leadIds.size > 0) {
      const leadDocs = await Promise.all(
        Array.from(leadIds).map(leadId => 
          db.collection('crm_leads').doc(leadId).get()
        )
      );
      
      leadDocs.forEach(doc => {
        if (doc.exists) {
          const leadData = doc.data();
          leadDetailsMap[doc.id] = {
            name: leadData.name,
            phone: leadData.phone,
            email: leadData.email,
            company: leadData.company
          };
        }
      });
    }
    
    // Add lead details to allocations
    const enrichedAllocations = allocations.map(allocation => ({
      ...allocation,
      lead_details: leadDetailsMap[allocation.lead_id] || null
    }));
    
    console.log(`Found ${enrichedAllocations.length} allocations`);
    
    res.json({
      success: true,
      data: enrichedAllocations
    });
    
  } catch (error) {
    console.error('Error fetching allocations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;