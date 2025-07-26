const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Fix allocation buying prices using EXISTING fields
router.post('/fix-existing-fields', authenticateToken, async (req, res) => {
  try {
    // Only allow super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Only super admin can run this fix' 
      });
    }

    console.log('🔧 Starting fix for existing buying_price_per_ticket fields...');
    
    // 1. Get all allocations
    const allocationsSnapshot = await db.collection(collections.allocations).get();
    console.log(`📊 Found ${allocationsSnapshot.size} allocations to process`);
    
    // 2. Get all inventory for lookup
    const inventorySnapshot = await db.collection(collections.inventory).get();
    const inventoryMap = new Map();
    inventorySnapshot.forEach(doc => {
      inventoryMap.set(doc.id, { id: doc.id, ...doc.data() });
    });
    console.log(`📦 Loaded ${inventorySnapshot.size} inventory items`);
    
    let processed = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const updates = [];
    
    // 3. Process each allocation
    for (const allocDoc of allocationsSnapshot.docs) {
      const allocation = allocDoc.data();
      processed++;
      
      try {
        // Skip if no inventory_id
        if (!allocation.inventory_id) {
          errors++;
          continue;
        }
        
        const inventory = inventoryMap.get(allocation.inventory_id);
        if (!inventory) {
          errors++;
          continue;
        }
        
        const allocatedQty = allocation.tickets_allocated || allocation.quantity || 0;
        if (allocatedQty <= 0) {
          skipped++;
          continue;
        }
        
        let buyingPricePerTicket = 0;
        
        // Find buying price using the same logic as the API
        if (inventory.categories && Array.isArray(inventory.categories)) {
          const categoryName = allocation.category_name || allocation.category || '';
          const categorySection = allocation.category_section || allocation.stand_section || '';
          
          // Match both category name AND section for accurate buying price
          let category = inventory.categories.find(cat => 
            cat.name === categoryName && 
            cat.section === categorySection
          );
          
          // Fallback: if no exact match found, match by name only
          if (!category) {
            category = inventory.categories.find(cat => cat.name === categoryName);
          }
          
          if (category) {
            buyingPricePerTicket = parseFloat(category.buying_price) || 0;
          }
        } else if (inventory.buying_price) {
          // Fallback to legacy inventory structure
          buyingPricePerTicket = parseFloat(inventory.buying_price) || 0;
        }
        
        const totalBuyingPrice = buyingPricePerTicket * allocatedQty;
        
        // Check if update is needed
        const needsUpdate = allocation.buying_price_per_ticket !== buyingPricePerTicket || 
                           allocation.total_buying_price !== totalBuyingPrice;
        
        if (!needsUpdate) {
          skipped++;
          continue;
        }
        
        // Prepare update for EXISTING fields
        updates.push({
          id: allocDoc.id,
          data: {
            buying_price_per_ticket: buyingPricePerTicket,
            total_buying_price: totalBuyingPrice
          }
        });
        
        updated++;
        
        // Log first few updates for verification
        if (updated <= 5) {
          console.log(`✅ Will update allocation ${allocDoc.id}:`, {
            event: allocation.event_name || allocation.inventory_event,
            category: allocation.category_name,
            section: allocation.category_section,
            tickets: allocatedQty,
            old_buying_price_per_ticket: allocation.buying_price_per_ticket,
            new_buying_price_per_ticket: buyingPricePerTicket,
            old_total_buying_price: allocation.total_buying_price,
            new_total_buying_price: totalBuyingPrice
          });
        }
        
      } catch (error) {
        console.error(`❌ Error processing allocation ${allocDoc.id}:`, error);
        errors++;
      }
    }
    
    // Apply updates in batches
    console.log(`💾 Applying ${updates.length} updates to existing fields...`);
    const batchSize = 450; // Firestore batch limit is 500
    
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = db.batch();
      const batchUpdates = updates.slice(i, i + batchSize);
      
      batchUpdates.forEach(update => {
        const docRef = db.collection(collections.allocations).doc(update.id);
        batch.update(docRef, update.data);
      });
      
      await batch.commit();
      console.log(`✅ Applied batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(updates.length/batchSize)}`);
    }
    
    const summary = {
      processed,
      updated,
      skipped,
      errors
    };
    
    console.log('🎉 Existing fields update completed!', summary);
    
    res.json({
      success: true,
      message: 'Allocation buying_price_per_ticket and total_buying_price fields updated successfully',
      summary
    });
    
  } catch (error) {
    console.error('❌ Fix allocations error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get status of existing fields
router.get('/status', authenticateToken, async (req, res) => {
  try {
    // Count allocations with proper buying prices
    const allAllocations = await db.collection(collections.allocations).get();
    
    let withBuyingPrice = 0;
    let withoutBuyingPrice = 0;
    let withPartialData = 0;
    
    allAllocations.forEach(doc => {
      const data = doc.data();
      if (data.buying_price_per_ticket && data.total_buying_price) {
        withBuyingPrice++;
      } else if (data.buying_price_per_ticket || data.total_buying_price) {
        withPartialData++;
      } else {
        withoutBuyingPrice++;
      }
    });
    
    res.json({
      success: true,
      total: allAllocations.size,
      withBuyingPrice,
      withoutBuyingPrice,
      withPartialData,
      percentageFixed: ((withBuyingPrice / allAllocations.size) * 100).toFixed(1)
    });
    
  } catch (error) {
    console.error('❌ Get status error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;