const { db } = require('./src/config/db');
const fs = require('fs');

async function backupInventory() {
  try {
    console.log('📦 Creating backup...');
    
    const snapshot = await db.collection('crm_inventory').get();
    const backup = [];
    
    snapshot.forEach(doc => {
      backup.push({
        id: doc.id,
        data: doc.data()
      });
    });
    
    const filename = `inventory-backup-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(backup, null, 2));
    
    console.log(`✅ Backup saved to ${filename}`);
    console.log(`📊 Total items backed up: ${backup.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

backupInventory();
