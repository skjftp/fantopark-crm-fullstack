// Lookup inventory item by Facebook form ID
async function getInventoryByFormId(db, formId) {
  try {
    // Query inventory where form_ids array contains this formId
    const inventorySnapshot = await db.collection('crm_inventory')
      .where('form_ids', 'array-contains', formId)
      .limit(1)
      .get();
    
    if (!inventorySnapshot.empty) {
      const inventory = inventorySnapshot.docs[0];
      console.log('🎫 Found matching inventory:', inventory.data().event_name, '-', inventory.data().category_of_ticket);
      return {
        inventory_id: inventory.id,
        ...inventory.data()
      };
    }
  } catch (error) {
    console.error('Error looking up inventory by form ID:', error);
  }
  return null;
}

module.exports = { getInventoryByFormId };
