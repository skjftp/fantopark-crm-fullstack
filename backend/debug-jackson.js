// Debug Jackson Bodra's status in the system
const { db, collections } = require('./src/config/db');

async function debugJackson() {
  try {
    console.log('🔍 Debugging Jackson Bodra\'s status...\n');

    // 1. Find Jackson in crm_users
    console.log('1. Checking crm_users collection...');
    const usersQuery = await db.collection('crm_users')
      .where('email', '==', 'jackson@fantopark.com')
      .get();
    
    if (!usersQuery.empty) {
      const jacksonUser = usersQuery.docs[0];
      const userData = jacksonUser.data();
      console.log('✅ Found Jackson in crm_users:');
      console.log(`   ID: ${jacksonUser.id}`);
      console.log(`   Name: ${userData.name}`);
      console.log(`   Email: ${userData.email}`);
      console.log(`   Role: ${userData.role}`);
      console.log(`   Department: ${userData.department}`);
      
      // 2. Check if he's in sales_performance_members
      console.log('\n2. Checking sales_performance_members...');
      const salesMemberDoc = await db.collection('sales_performance_members').doc(jacksonUser.id).get();
      
      if (salesMemberDoc.exists) {
        console.log('✅ Jackson is ALREADY in sales_performance_members:');
        const memberData = salesMemberDoc.data();
        console.log(`   Added at: ${memberData.addedAt}`);
        console.log(`   Added by: ${memberData.addedBy}`);
        console.log(`   Type: ${memberData.type}`);
      } else {
        console.log('❌ Jackson is NOT in sales_performance_members');
      }
      
      // 3. Check his orders
      console.log('\n3. Checking Jackson\'s orders...');
      const ordersQuery = await db.collection(collections.orders)
        .where('sales_person', '==', 'Jackson Bodra')
        .get();
      
      const ordersByEmail = await db.collection(collections.orders)
        .where('sales_person', '==', 'jackson@fantopark.com')
        .get();
        
      console.log(`   Orders with name "Jackson Bodra": ${ordersQuery.size}`);
      console.log(`   Orders with email "jackson@fantopark.com": ${ordersByEmail.size}`);
      
      // 4. Check all Jackson's orders (any field)
      const allOrdersSnapshot = await db.collection(collections.orders).get();
      let jacksonOrdersCount = 0;
      let fieldVariations = new Set();
      
      allOrdersSnapshot.docs.forEach(doc => {
        const order = doc.data();
        const salesPerson = order.sales_person || order.sales_person_email || '';
        
        if (salesPerson.toLowerCase().includes('jackson') || 
            salesPerson.includes('jackson@fantopark.com')) {
          jacksonOrdersCount++;
          fieldVariations.add(salesPerson);
        }
      });
      
      console.log(`   Total Jackson orders found: ${jacksonOrdersCount}`);
      console.log(`   Sales person field variations: ${Array.from(fieldVariations).join(', ')}`);
      
    } else {
      console.log('❌ Jackson NOT found in crm_users collection');
      
      // Search by name
      console.log('\nSearching by name pattern...');
      const nameQuery = await db.collection('crm_users').get();
      const jacksonUsers = [];
      
      nameQuery.docs.forEach(doc => {
        const userData = doc.data();
        if (userData.name && userData.name.toLowerCase().includes('jackson')) {
          jacksonUsers.push({
            id: doc.id,
            name: userData.name,
            email: userData.email,
            role: userData.role
          });
        }
      });
      
      if (jacksonUsers.length > 0) {
        console.log('Found users with "jackson" in name:');
        jacksonUsers.forEach(user => {
          console.log(`   ${user.name} (${user.email}) - ID: ${user.id}`);
        });
      } else {
        console.log('No users found with "jackson" in name');
      }
    }

    // 5. List all sales_performance_members for comparison
    console.log('\n5. Current sales_performance_members:');
    const salesMembersSnapshot = await db.collection('sales_performance_members').get();
    
    for (const memberDoc of salesMembersSnapshot.docs) {
      // Get user details
      const userDoc = await db.collection('crm_users').doc(memberDoc.id).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log(`   ${userData.name} (${userData.email}) - ID: ${memberDoc.id}`);
      } else {
        console.log(`   [UNKNOWN USER] - ID: ${memberDoc.id}`);
      }
    }

  } catch (error) {
    console.error('❌ Error debugging Jackson:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the debug
debugJackson().then(() => {
  console.log('\n✅ Jackson debug complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Failed to debug Jackson:', error);
  process.exit(1);
});