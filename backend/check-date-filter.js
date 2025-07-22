const { db, collections } = require('./src/config/db');

async function checkDateFilter() {
  console.log('🔍 Checking date filter issue for July 21\n');
  
  try {
    // Test different date query formats
    console.log('📅 Testing different date query approaches:\n');
    
    // Query 1: Exact date match
    console.log('1️⃣ Query: date_of_enquiry == "2025-07-21"');
    const q1 = await db.collection(collections.leads)
      .where('date_of_enquiry', '==', '2025-07-21')
      .where('source', '==', 'Instagram')
      .get();
    console.log(`   Results: ${q1.size} leads\n`);
    
    // Query 2: Date range (July 21 00:00 to 23:59 UTC)
    console.log('2️⃣ Query: July 21 UTC range');
    const q2 = await db.collection(collections.leads)
      .where('date_of_enquiry', '>=', '2025-07-21T00:00:00Z')
      .where('date_of_enquiry', '<=', '2025-07-21T23:59:59Z')
      .where('source', '==', 'Instagram')
      .get();
    console.log(`   Results: ${q2.size} leads\n`);
    
    // Query 3: Date range (July 21 IST - which is July 20 18:30 UTC to July 21 18:29 UTC)
    console.log('3️⃣ Query: July 21 IST range (UTC equivalent)');
    const q3 = await db.collection(collections.leads)
      .where('date_of_enquiry', '>=', '2025-07-20T18:30:00Z')
      .where('date_of_enquiry', '<', '2025-07-21T18:30:00Z')
      .where('source', '==', 'Instagram')
      .get();
    console.log(`   Results: ${q3.size} leads\n`);
    
    // Query 4: String prefix match
    console.log('4️⃣ Query: String prefix match "2025-07-21"');
    const q4 = await db.collection(collections.leads)
      .where('source', '==', 'Instagram')
      .get();
    let prefixCount = 0;
    q4.forEach(doc => {
      const date = doc.data().date_of_enquiry || '';
      if (date.toString().startsWith('2025-07-21')) {
        prefixCount++;
      }
    });
    console.log(`   Results: ${prefixCount} leads\n`);
    
    // Show all Instagram leads with their dates
    console.log('📋 ALL Instagram leads with dates:');
    const allInstagram = await db.collection(collections.leads)
      .where('source', '==', 'Instagram')
      .orderBy('date_of_enquiry', 'desc')
      .limit(20)
      .get();
    
    allInstagram.forEach(doc => {
      const lead = doc.data();
      const utcDate = new Date(lead.date_of_enquiry);
      const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
      
      console.log(`${lead.name}:`);
      console.log(`  Stored value: ${lead.date_of_enquiry}`);
      console.log(`  UTC: ${utcDate.toISOString()}`);
      console.log(`  IST: ${istDate.toISOString().split('T')[0]} ${istDate.toTimeString().split(' ')[0]}`);
    });
    
    console.log('\n💡 LIKELY ISSUE:');
    console.log('The marketing report might be:');
    console.log('1. Looking for exact string match "2025-07-21" (which no longer exists)');
    console.log('2. Using wrong timezone conversion');
    console.log('3. Not handling ISO timestamp format properly');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDateFilter();