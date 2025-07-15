const fs = require('fs');
const data = JSON.parse(fs.readFileSync('inventory-data.json', 'utf8'));
const items = data.data || [];

// Get all inventory IDs that will be deleted
const commands = JSON.parse(fs.readFileSync('migration-commands.json', 'utf8'));
const deleteIds = [];
const idMapping = {}; // old_id -> new_id

commands.forEach(cmd => {
  if (cmd.deleteIds) {
    cmd.deleteIds.forEach(deleteId => {
      deleteIds.push(deleteId);
      idMapping[deleteId] = cmd.id; // Map to the ID we're keeping
    });
  }
});

console.log('🔍 CHECKING REFERENCES TO INVENTORY ITEMS\n');
console.log(`📊 Items to be deleted: ${deleteIds.length}`);
console.log(`🗺️  ID Mappings (old → new):`);
Object.entries(idMapping).forEach(([oldId, newId]) => {
  const oldItem = items.find(i => i.id === oldId);
  const newItem = items.find(i => i.id === newId);
  if (oldItem && newItem) {
    console.log(`   ${oldId} (${oldItem.category_of_ticket}) → ${newId} (${newItem.category_of_ticket})`);
  }
});

console.log('\n⚠️  IMPORTANT: Before deleting, we need to update:');
console.log('1. Allocations (inventory_id references)');
console.log('2. Leads (if they reference specific inventory IDs)');
console.log('3. Orders/Bookings (if they reference inventory IDs)');
console.log('4. Payables (inventoryId references)');
