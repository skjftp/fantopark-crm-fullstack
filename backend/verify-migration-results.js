const fs = require('fs');

// Fetch updated inventory
console.log('🔍 Fetching updated inventory...\n');

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwiZW1haWwiOiJhZG1pbkBmYW50b3BhcmsuY29tIiwicm9sZSI6InN1cGVyX2FkbWluIiwibmFtZSI6IlN1cGVyIEFkbWluIiwiaWF0IjoxNzUyNTA4MjYwLCJleHAiOjE3NTMxMTMwNjB9.weGRDc3lHHl3bZ4aK2r2ijgOCvT0jzD8wRGLazMx7XI";

const { exec } = require('child_process');

exec(`curl -s -X GET "https://fantopark-backend-150582227311.us-central1.run.app/api/inventory" -H "Authorization: Bearer ${TOKEN}"`, (error, stdout) => {
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  const data = JSON.parse(stdout);
  const items = data.data || [];
  
  console.log(`📊 Total inventory items: ${items.length}`);
  
  // Count items with categories
  const withCategories = items.filter(i => i.categories && Array.isArray(i.categories)).length;
  const withoutCategories = items.filter(i => !i.categories || !Array.isArray(i.categories)).length;
  
  console.log(`✅ With categories: ${withCategories}`);
  console.log(`❌ Without categories: ${withoutCategories}`);
  
  // Check multi-category items
  const multiCategory = items.filter(i => i.categories && i.categories.length > 1);
  console.log(`🎫 Multi-category events: ${multiCategory.length}`);
  
  console.log('\nMulti-category events:');
  multiCategory.forEach(item => {
    console.log(`\n${item.event_name}:`);
    item.categories.forEach(cat => {
      console.log(`  - ${cat.name}: ${cat.total_tickets} tickets`);
    });
  });
  
  // Check Lords Test specifically
  console.log('\n📌 Lords Test status:');
  const lordsItems = items.filter(i => i.event_name.includes('Lords Test'));
  lordsItems.forEach(item => {
    console.log(`  ${item.id}: ${item.categories ? item.categories.map(c => c.name).join(', ') : item.category_of_ticket} (${item.total_tickets} tickets, ${item.available_tickets} available)`);
  });
  
  // Save updated data
  fs.writeFileSync('inventory-after-migration.json', JSON.stringify(data, null, 2));
  console.log('\n✅ Updated inventory saved to inventory-after-migration.json');
});
