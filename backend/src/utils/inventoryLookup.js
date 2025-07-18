// Lookup inventory item by Facebook form ID
async function getInventoryByFormId(db, formId) {
  try {
    console.log(`🔍 Looking up inventory for form ID: ${formId}`);
    
    if (!formId) {
      console.log('❌ No form ID provided');
      return null;
    }
    
    // Query inventory where form_ids array contains this formId
    const inventorySnapshot = await db.collection('crm_inventory')
      .where('form_ids', 'array-contains', formId)
      .limit(1)
      .get();
    
    if (!inventorySnapshot.empty) {
      const inventory = inventorySnapshot.docs[0];
      const data = inventory.data();
      console.log('🎫 Found matching inventory:', data.event_name);
      console.log('📘 Form IDs in this inventory:', data.form_ids);
      
      // Handle both old single category and new multi-category format
      let categoryName = 'General';
      if (data.categories && data.categories.length > 0) {
        categoryName = data.categories[0].name;
      } else if (data.category_of_ticket) {
        categoryName = data.category_of_ticket;
      }
      
      return {
        inventory_id: inventory.id,
        event_name: data.event_name,
        category_of_ticket: categoryName,
        ...data
      };
    } else {
      console.log(`❌ No inventory found for form ID: ${formId}`);
      
      // Debug: List all inventories with form_ids
      const allInventories = await db.collection('crm_inventory').get();
      let foundAny = false;
      allInventories.forEach(doc => {
        const data = doc.data();
        if (data.form_ids && data.form_ids.length > 0) {
          console.log(`📦 Inventory "${data.event_name}" (${doc.id}) has form_ids:`, data.form_ids);
          foundAny = true;
        }
      });
      
      if (!foundAny) {
        console.log('⚠️ No inventories have any form_ids set!');
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error looking up inventory by form ID:', error);
    return null;
  }
}

module.exports = { getInventoryByFormId };
