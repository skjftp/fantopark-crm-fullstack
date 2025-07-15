// Disable Firestore telemetry
process.env.FIRESTORE_ENABLE_TRACING = 'false';

const { db } = require('./src/config/db');

async function analyzeInventory() {
  try {
    console.log('🔍 Analyzing current inventory...\n');
    
    const snapshot = await db.collection('crm_inventory').get();
    const inventory = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      inventory.push({
        id: doc.id,
        event_name: data.event_name,
        event_date: data.event_date,
        category: data.category_of_ticket || 'General',
        total_tickets: data.total_tickets,
        available_tickets: data.available_tickets,
        buying_price: data.buying_price,
        selling_price: data.selling_price
      });
    });
    
    // Group by event_name and event_date
    const grouped = {};
    inventory.forEach(item => {
      const key = `${item.event_name}||${item.event_date}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });
    
    console.log(`📊 Total inventory items: ${inventory.length}`);
    console.log(`�� Unique events: ${Object.keys(grouped).length}\n`);
    
    // Show groups with multiple categories
    console.log('🎫 Events with multiple categories:');
    Object.entries(grouped).forEach(([key, items]) => {
      if (items.length > 1) {
        const [eventName, eventDate] = key.split('||');
        console.log(`\n${eventName} (${eventDate})`);
        items.forEach(item => {
          console.log(`  - ${item.category}: ${item.total_tickets} tickets @ ₹${item.selling_price}`);
        });
      }
    });
    
    // Show single category events
    console.log('\n📋 Events with single category:');
    let singleCount = 0;
    Object.entries(grouped).forEach(([key, items]) => {
      if (items.length === 1) {
        singleCount++;
      }
    });
    console.log(`Total: ${singleCount} events`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Add small delay to ensure DB is initialized
setTimeout(analyzeInventory, 1000);
