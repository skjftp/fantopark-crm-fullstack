const fs = require('fs');
const data = JSON.parse(fs.readFileSync('inventory-after-migration.json', 'utf8'));

console.log('🔍 Finding unnamed events...\n');

const unnamed = data.data.filter(item => 
  !item.event_name || item.event_name === '' || item.event_name === 'Unnamed Event'
);

console.log(`Found ${unnamed.length} unnamed events:\n`);

unnamed.forEach((item, index) => {
  console.log(`${index + 1}. ID: ${item.id}`);
  console.log(`   Sports: ${item.sports || 'N/A'}`);
  console.log(`   Venue: ${item.venue || 'N/A'}`);
  console.log(`   Date: ${item.event_date || 'N/A'}`);
  console.log(`   Categories: ${item.categories ? item.categories.map(c => c.name).join(', ') : 'None'}`);
  console.log(`   Total tickets: ${item.total_tickets}`);
  console.log('');
});

// Save to fix list
const fixList = unnamed.map(item => ({
  id: item.id,
  sports: item.sports,
  venue: item.venue,
  date: item.event_date,
  categories: item.categories ? item.categories.map(c => c.name) : []
}));

fs.writeFileSync('unnamed-events.json', JSON.stringify(fixList, null, 2));
console.log('✅ Saved to unnamed-events.json');
