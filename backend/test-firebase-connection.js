require('dotenv').config();
const { db, collections } = require('./src/config/db');

async function testConnection() {
  console.log('🔍 Testing Firebase connection...');
  console.log('📋 Environment check:');
  console.log(`  - GOOGLE_CLOUD_PROJECT: ${process.env.GOOGLE_CLOUD_PROJECT || 'NOT SET'}`);
  console.log(`  - GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'SET' : 'NOT SET'}`);
  console.log(`  - GOOGLE_CREDENTIALS_BASE64: ${process.env.GOOGLE_CREDENTIALS_BASE64 ? 'SET' : 'NOT SET'}`);
  
  try {
    // Test basic connection
    const testDoc = await db.collection(collections.users).limit(1).get();
    console.log('\n✅ Successfully connected to Firebase!');
    console.log(`📊 Found ${testDoc.size} user document(s)`);
    
    // Test collections access
    console.log('\n📁 Testing collection access:');
    for (const [key, collectionName] of Object.entries(collections)) {
      try {
        const count = await db.collection(collectionName).limit(1).get();
        console.log(`  ✓ ${collectionName}: accessible`);
      } catch (error) {
        console.log(`  ✗ ${collectionName}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 All tests passed! Firebase is properly configured.');
    
  } catch (error) {
    console.error('\n❌ Firebase connection failed!');
    console.error('Error:', error.message);
    console.error('\n📚 Please check FIREBASE_CREDENTIALS_SETUP.md for setup instructions');
  }
}

testConnection();