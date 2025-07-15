const fs = require('fs');
const data = JSON.parse(fs.readFileSync('inventory-data.json', 'utf8'));
const commands = JSON.parse(fs.readFileSync('migration-commands.json', 'utf8'));

console.log('📊 ALLOCATION SUMMARY FOR ITEMS TO BE DELETED\n');

let totalItemsWithAllocations = 0;
let totalAllocatedTickets = 0;

commands.forEach(cmd => {
  if (cmd.deleteIds) {
    const mainItem = data.data.find(i => i.id === cmd.id);
    console.log(`\n${mainItem.event_name}:`);
    
    cmd.deleteIds.forEach(deleteId => {
      const item = data.data.find(i => i.id === deleteId);
      if (item) {
        const allocated = (item.total_tickets || 0) - (item.available_tickets || 0);
        console.log(`  ${deleteId}: ${item.category_of_ticket} - ${allocated} allocated out of ${item.total_tickets}`);
        
        if (allocated > 0) {
          totalItemsWithAllocations++;
          totalAllocatedTickets += allocated;
        }
      }
    });
  }
});

console.log('\n📈 SUMMARY:');
console.log(`Total items with allocations: ${totalItemsWithAllocations}`);
console.log(`Total allocated tickets: ${totalAllocatedTickets}`);

if (totalItemsWithAllocations > 0) {
  console.log('\n⚠️  WARNING: Some items have allocations!');
  console.log('Migration must preserve these allocations.');
} else {
  console.log('\n✅ No allocations found - safe to proceed with migration');
}
