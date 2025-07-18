// backend/src/routes/websiteLeads.js

const express = require('express');
const router = express.Router();
const { authenticateToken, checkPermission } = require('../middleware/auth');  // FIXED: Import from auth.js
const websiteApiService = require('../services/websiteApiService');
const leadMappingService = require('../services/leadMappingService');
const { db, collections } = require('../config/db');

// Fetch available website leads (preview before import)
router.get('/preview', authenticateToken, checkPermission('leads', 'create'), async (req, res) => {
  try {
    const { page = 1, pageSize = 50, minLeadId = 794 } = req.query;
    
    console.log(`📋 Fetching website leads for preview (min ID: ${minLeadId})...`);
    
    // Fetch leads from website
    const websiteLeads = await websiteApiService.fetchLeads(page, pageSize, parseInt(minLeadId));
    
    // Check which leads are already imported
    const { newLeads, existingLeads } = await leadMappingService.filterNewLeads(websiteLeads);
    
    // Get inventory mapping preview
    const mappingPreview = [];
    for (const lead of newLeads) {
      const inventory = await leadMappingService.findInventoryByEventName(lead.tours);
      mappingPreview.push({
        websiteLeadId: lead.id,
        tourName: lead.tours,
        inventoryFound: !!inventory,
        inventoryId: inventory?.id,
        inventoryName: inventory?.event_name
      });
    }
    
    res.json({
      success: true,
      data: {
        minLeadId: parseInt(minLeadId),
        totalLeads: websiteLeads.length,
        newLeads: newLeads.length,
        alreadyImported: existingLeads.length,
        leads: newLeads,
        mappingPreview,
        summary: {
          bySource: newLeads.reduce((acc, lead) => {
            acc[lead.referral_code] = (acc[lead.referral_code] || 0) + 1;
            return acc;
          }, {}),
          multiLeadGroups: [...new Set(newLeads.filter(l => l.group_id).map(l => l.group_id))].length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching website leads:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Import website leads
router.post('/import', authenticateToken, checkPermission('leads', 'create'), async (req, res) => {
  try {
    const { leadIds, importAll = false, minLeadId = 794 } = req.body;
    const importedBy = req.user.name;
    
    console.log(`🚀 Starting website lead import (min ID: ${minLeadId})...`);
    
    let leadsToImport = [];
    
    if (importAll) {
      // Fetch all new leads with ID >= minLeadId
      const allLeads = await websiteApiService.fetchAllLeads(parseInt(minLeadId));
      const { newLeads } = await leadMappingService.filterNewLeads(allLeads);
      leadsToImport = newLeads;
    } else if (leadIds && leadIds.length > 0) {
      // Fetch specific leads
      const allLeads = await websiteApiService.fetchAllLeads(parseInt(minLeadId));
      leadsToImport = allLeads.filter(lead => leadIds.includes(lead.id));
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'No leads specified for import' 
      });
    }
    
    console.log(`📥 Importing ${leadsToImport.length} leads...`);
    
    // Process leads for import
    const { processedLeads, errors } = await leadMappingService.processWebsiteLeadsForImport(
      leadsToImport, 
      importedBy
    );
    
    // Import results
    const imported = {
      single: 0,
      multi: 0,
      total: 0
    };
    const createdLeads = [];
    
    // Process single leads
    for (const processedLead of processedLeads.filter(p => p.type === 'single')) {
      try {
        const docRef = await db.collection(collections.leads).add(processedLead.lead);
        createdLeads.push({ id: docRef.id, ...processedLead.lead });
        imported.single++;
        imported.total++;
      } catch (error) {
        errors.push({
          websiteLead: processedLead.originalLead,
          error: error.message
        });
      }
    }
    
    // Process multi-leads
    for (const processedMulti of processedLeads.filter(p => p.type === 'multi')) {
      try {
        const batch = db.batch();
        const multiLeadIds = [];
        
        // Create all leads in the group
        for (const lead of processedMulti.data.leads) {
          const docRef = db.collection(collections.leads).doc();
          batch.set(docRef, lead);
          multiLeadIds.push(docRef.id);
          createdLeads.push({ id: docRef.id, ...lead });
        }
        
        await batch.commit();
        imported.multi++;
        imported.total += processedMulti.data.leads.length;
      } catch (error) {
        errors.push({
          websiteLeads: processedMulti.originalLeads,
          error: error.message
        });
      }
    }
    
    console.log(`✅ Import complete: ${imported.total} leads imported`);
    
    res.json({
      success: true,
      data: {
        imported,
        createdLeads: createdLeads.slice(0, 10), // Return first 10 for preview
        errors: errors.length > 0 ? errors : undefined,
        summary: {
          totalProcessed: leadsToImport.length,
          successfulImports: imported.total,
          failedImports: errors.length,
          singleLeads: imported.single,
          multiLeadGroups: imported.multi
        }
      }
    });
  } catch (error) {
    console.error('Error importing website leads:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get import history
router.get('/import-history', authenticateToken, checkPermission('leads', 'read'), async (req, res) => {
  try {
    const snapshot = await db.collection(collections.leads)
      .where('imported_from', '==', 'website')
      .orderBy('import_date', 'desc')
      .limit(100)
      .get();
    
    const importedLeads = [];
    snapshot.forEach(doc => {
      importedLeads.push({ id: doc.id, ...doc.data() });
    });
    
    // Group by import date
    const importBatches = importedLeads.reduce((acc, lead) => {
      const importDate = lead.import_date.split('T')[0]; // Group by date
      if (!acc[importDate]) {
        acc[importDate] = {
          date: importDate,
          count: 0,
          importedBy: lead.created_by,
          leads: []
        };
      }
      acc[importDate].count++;
      acc[importDate].leads.push(lead);
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: {
        totalImported: importedLeads.length,
        importBatches: Object.values(importBatches).sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        )
      }
    });
  } catch (error) {
    console.error('Error fetching import history:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Test website API connection
router.get('/test-connection', authenticateToken, checkPermission('leads', 'create'), async (req, res) => {
  try {
    console.log('🔌 Testing website API connection...');
    
    // Try to authenticate
    await websiteApiService.authenticate();
    
    // Try to fetch 1 lead
    const leads = await websiteApiService.fetchLeads(1, 1);
    
    res.json({
      success: true,
      data: {
        connectionStatus: 'success',
        message: 'Successfully connected to website API',
        sampleLead: leads[0] || null
      }
    });
  } catch (error) {
    console.error('Website API connection test failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      connectionStatus: 'failed'
    });
  }
});

module.exports = router;
