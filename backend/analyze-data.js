const fs = require('fs');

const data = JSON.parse(fs.readFileSync('inventory-data.json', 'utf8'));
const items = data.data || [];

console.log(`📊 Total inventory items: ${items.length}`);

// Group by event name and date
const grouped = {};
items.forEach(item => {
  const key = `${item.event_name}||${item.event_date}`;
  if (!grouped[key]) {
    grouped[key] = [];
  }
  grouped[key].push(item);
});

console.log(`📁 Unique events: ${Object.keys(grouped).length}\n`);

// Show multi-category events
console.log('🎫 Events with multiple categories:');
Object.entries(grouped).forEach(([key, items]) => {
  if (items.length > 1) {
    const [name, date] = key.split('||');
    console.log(`\n${name} (${date}):`);
    items.forEach(item => {
      console.log(`  - ${item.category_of_ticket || 'General'}: ${item.total_tickets} tickets`);
    });
  }
});

// Count single category events
const singleCount = Object.values(grouped).filter(items => items.length === 1).length;
console.log(`\n📋 Events with single category: ${singleCount}`);
