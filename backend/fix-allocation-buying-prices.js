#!/usr/bin/env node

/**
 * Script to fix buying prices in crm_allocations collection
 * This will populate buying_price and total_buying_price fields based on inventory data
 */

const { db, collections } = require('./src/config/db');

async function fixAllocationBuyingPrices() {
  console.log('🔧 Starting allocation buying price fix...');
  
  try {
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
    
    // 3. Process each allocation
    for (const allocDoc of allocationsSnapshot.docs) {
      const allocation = allocDoc.data();
      processed++;
      
      try {
        // Skip if already has buying price
        if (allocation.buying_price && allocation.total_buying_price) {
          skipped++;
          if (processed % 100 === 0) {
            console.log(`📈 Progress: ${processed}/${allocationsSnapshot.size} (${skipped} skipped, ${updated} updated, ${errors} errors)`);
          }
          continue;
        }
        
        const inventory = inventoryMap.get(allocation.inventory_id);
        if (!inventory) {
          console.log(`❌ No inventory found for allocation ${allocDoc.id} (inventory_id: ${allocation.inventory_id})`);
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
        
        // Update the allocation with buying prices
        await db.collection(collections.allocations).doc(allocDoc.id).update({
          buying_price: buyingPricePerTicket,
          total_buying_price: totalBuyingPrice,
          buying_price_updated_at: new Date().toISOString(),
          buying_price_source: 'script_fix_2025_01_26'
        });
        
        updated++;
        
        // Log first few updates for verification
        if (updated <= 5) {
          console.log(`✅ Updated allocation ${allocDoc.id}:`, {
            event: allocation.event_name || allocation.inventory_event,
            category: allocation.category_name,
            section: allocation.category_section,
            tickets: allocatedQty,
            buyingPricePerTicket,
            totalBuyingPrice
          });
        }
        
        // Progress update every 100 records
        if (processed % 100 === 0) {
          console.log(`📈 Progress: ${processed}/${allocationsSnapshot.size} (${skipped} skipped, ${updated} updated, ${errors} errors)`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing allocation ${allocDoc.id}:`, error);
        errors++;
      }
    }
    
    console.log('\n🎉 Allocation buying price fix completed!');
    console.log(`📊 Summary:`);
    console.log(`   Total processed: ${processed}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped (already had prices): ${skipped}`);
    console.log(`   Errors: ${errors}`);
    
    // Verify a few records
    console.log('\n🔍 Verification - checking a few updated records:');
    const verifySnapshot = await db.collection(collections.allocations)
      .where('buying_price_source', '==', 'script_fix_2025_01_26')
      .limit(3)
      .get();
    
    verifySnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`✅ ${doc.id}: ${data.tickets_allocated || 0} tickets @ ₹${data.buying_price || 0} = ₹${data.total_buying_price || 0}`);
    });
    
  } catch (error) {
    console.error('❌ Script error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the script
if (require.main === module) {
  fixAllocationBuyingPrices();
}

module.exports = { fixAllocationBuyingPrices };