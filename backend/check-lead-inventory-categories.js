// Script to check lead and inventory details for allocation
const { db } = require('./src/config/db');

async function checkLeadAndInventory() {
  const leadId = 'GTgfjY6yJNpnQQWGA3y8';
  const inventoryId = 'jx2GQ4Sf7pqGiJe1Nnwl';
  
  console.log('🔍 Checking Lead and Inventory Details\n');
  console.log(`Lead ID: ${leadId}`);
  console.log(`Inventory ID: ${inventoryId}\n`);
  
  try {
    // Fetch Lead Details
    console.log('📋 LEAD DETAILS:');
    console.log('================');
    const leadDoc = await db.collection('leads').doc(leadId).get();
    
    if (!leadDoc.exists) {
      console.log('❌ Lead not found!');
    } else {
      const leadData = leadDoc.data();
      console.log(`Name: ${leadData.name || 'N/A'}`);
      console.log(`Status: ${leadData.status || 'N/A'}`);
      console.log(`Email: ${leadData.email || 'N/A'}`);
      console.log(`Phone: ${leadData.phone || 'N/A'}`);
      console.log(`Event: ${leadData.lead_for_event || leadData.event_name || 'N/A'}`);
      console.log(`Created: ${leadData.created_date ? new Date(leadData.created_date).toLocaleString() : 'N/A'}`);
      
      // Check if lead status allows allocation
      const allowedStatuses = ['converted', 'payment_received', 'payment_post_service'];
      const canAllocate = allowedStatuses.includes(leadData.status);
      console.log(`\n✅ Can Allocate: ${canAllocate ? 'YES' : 'NO'}`);
      if (!canAllocate) {
        console.log(`⚠️  Lead status "${leadData.status}" is not allowed for allocation.`);
        console.log(`   Allowed statuses: ${allowedStatuses.join(', ')}`);
      }
    }
    
    console.log('\n📦 INVENTORY DETAILS:');
    console.log('=====================');
    const inventoryDoc = await db.collection('inventory').doc(inventoryId).get();
    
    if (!inventoryDoc.exists) {
      console.log('❌ Inventory not found!');
    } else {
      const inventoryData = inventoryDoc.data();
      console.log(`Event Name: ${inventoryData.event_name || 'N/A'}`);
      console.log(`Event Date: ${inventoryData.event_date ? new Date(inventoryData.event_date).toLocaleDateString() : 'N/A'}`);
      console.log(`Venue: ${inventoryData.venue || 'N/A'}`);
      console.log(`Total Tickets: ${inventoryData.total_tickets || 0}`);
      console.log(`Available Tickets: ${inventoryData.available_tickets || 0}`);
      console.log(`Selling Price: ₹${inventoryData.selling_price || 0}`);
      
      // Check if inventory has categories
      if (inventoryData.categories && Array.isArray(inventoryData.categories) && inventoryData.categories.length > 0) {
        console.log(`\n🎫 TICKET CATEGORIES (${inventoryData.categories.length} total):`);
        console.log('================================');
        
        inventoryData.categories.forEach((category, index) => {
          console.log(`\n${index + 1}. ${category.name || 'Unnamed Category'}`);
          console.log(`   Section: ${category.section || 'General'}`);
          console.log(`   Available: ${category.available_tickets || 0} tickets`);
          console.log(`   Total: ${category.total_tickets || 0} tickets`);
          console.log(`   Price: ₹${category.selling_price || 0}`);
          console.log(`   Status: ${category.available_tickets > 0 ? '✅ AVAILABLE' : '❌ SOLD OUT'}`);
          
          if (category.inclusions) {
            console.log(`   Inclusions: ${category.inclusions}`);
          }
        });
        
        // Summary of available categories
        const availableCategories = inventoryData.categories.filter(cat => cat.available_tickets > 0);
        console.log(`\n📊 SUMMARY:`);
        console.log(`Total Categories: ${inventoryData.categories.length}`);
        console.log(`Available Categories: ${availableCategories.length}`);
        console.log(`Sold Out Categories: ${inventoryData.categories.length - availableCategories.length}`);
        
        if (availableCategories.length > 0) {
          console.log('\n✅ AVAILABLE CATEGORIES FOR ALLOCATION:');
          availableCategories.forEach((cat, idx) => {
            console.log(`   ${idx + 1}. ${cat.name} - ${cat.available_tickets} tickets @ ₹${cat.selling_price}`);
          });
        } else {
          console.log('\n❌ NO CATEGORIES AVAILABLE - All categories are sold out!');
        }
        
      } else {
        console.log('\n⚠️  This inventory does not have categories configured.');
        console.log(`   It uses general allocation with ${inventoryData.available_tickets || 0} tickets available.`);
      }
      
      // Check existing allocations
      console.log('\n📈 CHECKING EXISTING ALLOCATIONS:');
      console.log('==================================');
      const allocationsSnapshot = await db.collection('inventory')
        .doc(inventoryId)
        .collection('allocations')
        .get();
      
      console.log(`Total Allocations: ${allocationsSnapshot.size}`);
      
      // Check if this lead already has an allocation
      let leadAllocation = null;
      allocationsSnapshot.forEach(doc => {
        const allocation = doc.data();
        if (allocation.lead_id === leadId) {
          leadAllocation = { id: doc.id, ...allocation };
        }
      });
      
      if (leadAllocation) {
        console.log(`\n⚠️  THIS LEAD ALREADY HAS AN ALLOCATION:`);
        console.log(`   Allocation ID: ${leadAllocation.id}`);
        console.log(`   Tickets: ${leadAllocation.tickets_allocated || leadAllocation.quantity || 0}`);
        console.log(`   Category: ${leadAllocation.category_name || 'General'}`);
        console.log(`   Date: ${leadAllocation.allocation_date || 'N/A'}`);
      } else {
        console.log(`\n✅ No existing allocation found for this lead.`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

// Run the check
checkLeadAndInventory();