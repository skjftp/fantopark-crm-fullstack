const { db } = require('./src/config/db');

async function migrateToCategories() {
  try {
    console.log('🚀 Starting migration to categories format...\n');
    
    // Get all inventory
    const snapshot = await db.collection('crm_inventory').get();
    const inventory = [];
    
    snapshot.forEach(doc => {
      inventory.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Group by event_name and event_date
    const grouped = {};
    inventory.forEach(item => {
      const key = `${item.event_name}||${item.event_date}`;
      if (!grouped[key]) {
        grouped[key] = {
          eventInfo: null,
          items: []
        };
      }
      grouped[key].items.push(item);
    });
    
    console.log(`📊 Found ${Object.keys(grouped).length} unique events from ${inventory.length} items\n`);
    
    // Process each group
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const [key, group] of Object.entries(grouped)) {
      const items = group.items;
      
      // Skip if already has categories (already migrated)
      if (items[0].categories && Array.isArray(items[0].categories)) {
        console.log(`⏭️  Skipping ${items[0].event_name} - already has categories`);
        skippedCount++;
        continue;
      }
      
      if (items.length === 1) {
        // Single category - just add categories array
        const item = items[0];
        const category = {
          name: item.category_of_ticket || 'General',
          section: item.stand || '',
          total_tickets: parseInt(item.total_tickets) || 0,
          available_tickets: parseInt(item.available_tickets) || 0,
          buying_price: parseFloat(item.buying_price) || 0,
          selling_price: parseFloat(item.selling_price) || 0,
          inclusions: item.inclusions || ''
        };
        
        await db.collection('crm_inventory').doc(item.id).update({
          categories: [category],
          updated_date: new Date().toISOString()
        });
        
        console.log(`✅ Migrated: ${item.event_name} (single category)`);
        migratedCount++;
        
      } else {
        // Multiple categories - merge into first item, delete others
        const [firstItem, ...otherItems] = items;
        
        // Create categories array from all items
        const categories = items.map(item => ({
          name: item.category_of_ticket || 'General',
          section: item.stand || '',
          total_tickets: parseInt(item.total_tickets) || 0,
          available_tickets: parseInt(item.available_tickets) || 0,
          buying_price: parseFloat(item.buying_price) || 0,
          selling_price: parseFloat(item.selling_price) || 0,
          inclusions: item.inclusions || ''
        }));
        
        // Calculate totals
        const totals = categories.reduce((acc, cat) => ({
          total_tickets: acc.total_tickets + cat.total_tickets,
          available_tickets: acc.available_tickets + cat.available_tickets,
          total_amount: acc.total_amount + (cat.total_tickets * cat.buying_price)
        }), { total_tickets: 0, available_tickets: 0, total_amount: 0 });
        
        // Update first item with all categories
        await db.collection('crm_inventory').doc(firstItem.id).update({
          categories: categories,
          total_tickets: totals.total_tickets,
          available_tickets: totals.available_tickets,
          totalPurchaseAmount: totals.total_amount,
          updated_date: new Date().toISOString()
        });
        
        // Delete other items
        for (const item of otherItems) {
          await db.collection('crm_inventory').doc(item.id).delete();
        }
        
        console.log(`✅ Merged: ${firstItem.event_name} (${categories.length} categories)`);
        categories.forEach(cat => {
          console.log(`   - ${cat.name}: ${cat.total_tickets} tickets`);
        });
        migratedCount++;
      }
    }
    
    console.log('\n📈 Migration Summary:');
    console.log(`✅ Migrated: ${migratedCount} events`);
    console.log(`⏭️  Skipped: ${skippedCount} events (already had categories)`);
    console.log(`📊 Final event count: ${migratedCount + skippedCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

// Add confirmation prompt
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚠️  This will migrate your inventory to the new categories format.');
console.log('⚠️  Items with the same event name and date will be merged.');
console.log('⚠️  Make sure you have a backup!\n');

rl.question('Continue with migration? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes') {
    rl.close();
    migrateToCategories();
  } else {
    console.log('Migration cancelled.');
    rl.close();
    process.exit(0);
  }
});
