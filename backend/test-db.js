process.env.FIRESTORE_ENABLE_TRACING = 'false';
const { db } = require('./src/config/db');

async function test() {
  try {
    console.log('Testing database connection...');
    const snapshot = await db.collection('crm_inventory').limit(1).get();
    console.log('✅ Database connection successful');
    console.log(`Found ${snapshot.size} items`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

test();
