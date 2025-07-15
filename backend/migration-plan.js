const fs = require('fs');
const data = JSON.parse(fs.readFileSync('inventory-data.json', 'utf8'));
const items = data.data || [];

// Group by event
const grouped = {};
items.forEach(item => {
  const key = `${item.event_name}||${item.event_date}`;
  if (!grouped[key]) grouped[key] = [];
  grouped[key].push(item);
});

console.log('🔄 MIGRATION PLAN\n');

// Show what will be merged
Object.entries(grouped).forEach(([key, items]) => {
  if (items.length > 1) {
    const [name, date] = key.split('||');
    console.log(`📦 MERGE: ${name} (${date})`);
    console.log(`   Keep ID: ${items[0].id}`);
    
    const categories = items.map(item => ({
      name: item.category_of_ticket || 'General',
      section: item.stand || '',
      tickets: item.total_tickets || 0,
      available: item.available_tickets || 0,
      buying: item.buying_price || 0,
      selling: item.selling_price || 0
    }));
    
    console.log('   Categories:');
    categories.forEach(cat => {
      console.log(`     - ${cat.name}: ${cat.tickets} tickets @ ₹${cat.selling}`);
    });
    
    console.log(`   Delete IDs: ${items.slice(1).map(i => i.id).join(', ')}\n`);
  }
});

// Summary
console.log('📊 SUMMARY:');
console.log(`- Total items: ${items.length}`);
console.log(`- After migration: ${Object.keys(grouped).length}`);
console.log(`- Items to delete: ${items.length - Object.keys(grouped).length}`);

// Save migration commands
const commands = [];
Object.entries(grouped).forEach(([key, items]) => {
  if (items.length > 1) {
    const keepId = items[0].id;
    const deleteIds = items.slice(1).map(i => i.id);
    const categories = items.map(item => ({
      name: item.category_of_ticket || 'General',
      section: item.stand || '',
      total_tickets: parseInt(item.total_tickets) || 0,
      available_tickets: parseInt(item.available_tickets) || 0,
      buying_price: parseFloat(item.buying_price) || 0,
      selling_price: parseFloat(item.selling_price) || 0,
      inclusions: item.inclusions || ''
    }));
    
    commands.push({
      action: 'update',
      id: keepId,
      categories: categories,
      deleteIds: deleteIds
    });
  } else {
    // Single category - just add categories array
    commands.push({
      action: 'add_category',
      id: items[0].id,
      category: {
        name: items[0].category_of_ticket || 'General',
        section: items[0].stand || '',
        total_tickets: parseInt(items[0].total_tickets) || 0,
        available_tickets: parseInt(items[0].available_tickets) || 0,
        buying_price: parseFloat(items[0].buying_price) || 0,
        selling_price: parseFloat(items[0].selling_price) || 0,
        inclusions: items[0].inclusions || ''
      }
    });
  }
});

fs.writeFileSync('migration-commands.json', JSON.stringify(commands, null, 2));
console.log('\n✅ Migration commands saved to migration-commands.json');
