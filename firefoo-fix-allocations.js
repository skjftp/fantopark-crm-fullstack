/**
 * Firefoo Script: Fix Allocation Buying Prices
 * 
 * Instructions:
 * 1. Open Firefoo
 * 2. Go to your Firestore database
 * 3. Open the JavaScript console in Firefoo
 * 4. Copy and paste this entire script
 * 5. Press Enter to run
 */

async function fixAllocationBuyingPrices() {
  console.log('🔧 Starting allocation buying price fix in Firefoo...');
  
  try {
    // Get all collections
    const allocationsRef = db.collection('crm_allocations');
    const inventoryRef = db.collection('crm_inventory');
    
    // 1. Get all inventory first for lookup
    console.log('📦 Loading inventory data...');
    const inventorySnapshot = await inventoryRef.get();
    const inventoryMap = new Map();
    
    inventorySnapshot.forEach(doc => {
      inventoryMap.set(doc.id, { id: doc.id, ...doc.data() });
    });
    
    console.log(`📦 Loaded ${inventorySnapshot.size} inventory items`);
    
    // 2. Get all allocations
    console.log('📊 Loading allocations...');
    const allocationsSnapshot = await allocationsRef.get();
    console.log(`📊 Found ${allocationsSnapshot.size} allocations to process`);
    
    let processed = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const batch = db.batch(); // Use batch for efficiency
    let batchCount = 0;
    
    // 3. Process each allocation
    for (const allocDoc of allocationsSnapshot.docs) {
      const allocation = allocDoc.data();
      processed++;
      
      try {
        // Skip if already has buying price
        if (allocation.buying_price && allocation.total_buying_price) {
          skipped++;
          continue;
        }
        
        // Skip if no inventory_id
        if (!allocation.inventory_id) {
          errors++;
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
        
        // Add to batch update
        batch.update(allocDoc.ref, {
          buying_price: buyingPricePerTicket,
          total_buying_price: totalBuyingPrice,
          buying_price_updated_at: new Date().toISOString(),
          buying_price_source: 'firefoo_fix_2025_01_26'
        });
        
        updated++;
        batchCount++;
        
        // Log first few updates for verification
        if (updated <= 5) {
          console.log(`✅ Will update allocation ${allocDoc.id}:`, {
            event: allocation.event_name || allocation.inventory_event,
            category: allocation.category_name,
            section: allocation.category_section,
            tickets: allocatedQty,
            buyingPricePerTicket,
            totalBuyingPrice
          });
        }
        
        // Commit batch every 450 operations (Firestore limit is 500)
        if (batchCount >= 450) {
          console.log(`💾 Committing batch of ${batchCount} updates...`);
          await batch.commit();
          console.log(`✅ Batch committed successfully`);
          batchCount = 0;
          // Create new batch
          batch = db.batch();
        }
        
        // Progress update every 100 records
        if (processed % 100 === 0) {
          console.log(`📈 Progress: ${processed}/${allocationsSnapshot.size} (${skipped} skipped, ${updated} queued for update, ${errors} errors)`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing allocation ${allocDoc.id}:`, error);
        errors++;
      }
    }
    
    // Commit final batch
    if (batchCount > 0) {
      console.log(`💾 Committing final batch of ${batchCount} updates...`);
      await batch.commit();
      console.log(`✅ Final batch committed successfully`);
    }
    
    console.log('\n🎉 Allocation buying price fix completed!');
    console.log(`📊 Summary:`);
    console.log(`   Total processed: ${processed}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped (already had prices): ${skipped}`);
    console.log(`   Errors: ${errors}`);
    
    return {
      processed,
      updated,
      skipped,
      errors
    };
    
  } catch (error) {
    console.error('❌ Script error:', error);
    throw error;
  }
}

// Run the script
console.log('🚀 Starting Firefoo allocation fix script...');
fixAllocationBuyingPrices()
  .then(result => {
    console.log('✅ Script completed successfully!', result);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
  });