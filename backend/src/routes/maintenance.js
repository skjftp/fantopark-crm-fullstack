const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/db');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// Fix missing created_date fields
router.post('/fix-created-dates', authenticateToken, checkPermission('admin', 'write'), async (req, res) => {
  console.log('🔍 Starting to fix missing created_date fields...');
  
  try {
    // Get all leads
    const leadsSnapshot = await db.collection(collections.leads).get();
    console.log(`📊 Total leads in system: ${leadsSnapshot.size}`);
    
    let leadsWithoutDate = [];
    let leadsWithDate = 0;
    
    // Check each lead
    leadsSnapshot.forEach(doc => {
      const lead = doc.data();
      if (!lead.created_date) {
        leadsWithoutDate.push({
          id: doc.id,
          name: lead.name || 'Unknown',
          email: lead.email || 'No email',
          date_of_enquiry: lead.date_of_enquiry
        });
      } else {
        leadsWithDate++;
      }
    });
    
    console.log(`✅ Leads with created_date: ${leadsWithDate}`);
    console.log(`❌ Leads without created_date: ${leadsWithoutDate.length}`);
    
    if (leadsWithoutDate.length === 0) {
      return res.json({
        success: true,
        message: 'All leads already have created_date!',
        stats: {
          totalLeads: leadsSnapshot.size,
          leadsWithDate: leadsWithDate,
          leadsWithoutDate: 0,
          updated: 0
        }
      });
    }
    
    // Update leads in batches
    const batchSize = 500;
    let updatedCount = 0;
    const updateResults = [];
    
    for (let i = 0; i < leadsWithoutDate.length; i += batchSize) {
      const batch = db.batch();
      const batchLeads = leadsWithoutDate.slice(i, i + batchSize);
      
      for (const lead of batchLeads) {
        const docRef = db.collection(collections.leads).doc(lead.id);
        
        // Determine what date to use
        let dateToUse;
        let dateSource;
        
        if (lead.date_of_enquiry) {
          // Use date_of_enquiry if available
          dateToUse = lead.date_of_enquiry;
          dateSource = 'date_of_enquiry';
        } else {
          // Use current date as fallback
          dateToUse = new Date().toISOString();
          dateSource = 'current_date';
        }
        
        batch.update(docRef, {
          created_date: dateToUse,
          updated_date: new Date().toISOString(),
          updated_by: 'system_fix_maintenance'
        });
        
        updateResults.push({
          id: lead.id,
          name: lead.name,
          email: lead.email,
          dateUsed: dateToUse,
          dateSource: dateSource
        });
        
        updatedCount++;
      }
      
      await batch.commit();
      console.log(`✅ Updated ${updatedCount}/${leadsWithoutDate.length} leads...`);
    }
    
    // Verify the fix
    console.log('🔍 Verifying the fix...');
    const verifySnapshot = await db.collection(collections.leads).get();
    let stillMissing = 0;
    
    verifySnapshot.forEach(doc => {
      if (!doc.data().created_date) {
        stillMissing++;
      }
    });
    
    res.json({
      success: true,
      message: `Successfully updated ${updatedCount} leads with missing created_date`,
      stats: {
        totalLeads: leadsSnapshot.size,
        leadsWithDate: leadsWithDate,
        leadsWithoutDate: leadsWithoutDate.length,
        updated: updatedCount,
        stillMissing: stillMissing
      },
      details: updateResults
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Check for 1970 dates
router.get('/check-1970-dates', authenticateToken, async (req, res) => {
  try {
    const leadsSnapshot = await db.collection(collections.leads).get();
    
    let leads1970 = [];
    let normalDates = 0;
    let invalidDates = 0;
    
    leadsSnapshot.forEach(doc => {
      const lead = doc.data();
      if (lead.created_date) {
        const date = new Date(lead.created_date);
        const year = date.getFullYear();
        
        if (year === 1970 || year < 2000) {
          leads1970.push({
            id: doc.id,
            name: lead.name || 'Unknown',
            email: lead.email || 'No email',
            created_date: lead.created_date,
            date_of_enquiry: lead.date_of_enquiry,
            parsedDate: date.toISOString(),
            year: year
          });
        } else if (isNaN(date.getTime())) {
          invalidDates++;
        } else {
          normalDates++;
        }
      }
    });
    
    res.json({
      success: true,
      stats: {
        totalLeads: leadsSnapshot.size,
        leadsWithNormalDates: normalDates,
        leadsWith1970: leads1970.length,
        leadsWithInvalidDates: invalidDates
      },
      leads1970: leads1970
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get stats about missing created_date fields
router.get('/missing-dates-stats', authenticateToken, async (req, res) => {
  try {
    const leadsSnapshot = await db.collection(collections.leads).get();
    
    let leadsWithoutDate = [];
    let leadsWithDate = 0;
    
    leadsSnapshot.forEach(doc => {
      const lead = doc.data();
      if (!lead.created_date) {
        leadsWithoutDate.push({
          id: doc.id,
          name: lead.name || 'Unknown',
          email: lead.email || 'No email',
          date_of_enquiry: lead.date_of_enquiry
        });
      } else {
        leadsWithDate++;
      }
    });
    
    res.json({
      success: true,
      stats: {
        totalLeads: leadsSnapshot.size,
        leadsWithDate: leadsWithDate,
        leadsWithoutDate: leadsWithoutDate.length
      },
      missingDateLeads: leadsWithoutDate
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;