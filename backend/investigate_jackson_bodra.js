// Set the project ID
process.env.GOOGLE_CLOUD_PROJECT = 'enduring-wharf-464005-h7';

const { db, collections } = require('./src/config/db');

async function investigateJacksonBodra() {
  const email = 'jackson.bodra@fantopark.com';
  
  console.log('=== Investigating jackson.bodra@fantopark.com ===\n');
  
  try {
    // 1. Check if user exists
    console.log('1. Checking if Jackson Bodra exists in users collection...');
    const usersSnapshot = await db.collection(collections.users)
      .where('email', '==', email)
      .get();
    
    if (usersSnapshot.empty) {
      console.log('   ❌ User NOT found in users collection');
    } else {
      usersSnapshot.forEach(doc => {
        const user = doc.data();
        console.log('   ✅ User found:');
        console.log(`      - ID: ${doc.id}`);
        console.log(`      - Name: ${user.name}`);
        console.log(`      - Email: ${user.email}`);
        console.log(`      - Role: ${user.role}`);
        console.log(`      - Department: ${user.department}`);
        console.log(`      - Status: ${user.status}`);
      });
    }
    
    // 2. Check orders where jackson.bodra@fantopark.com appears
    console.log('\n2. Checking orders where jackson.bodra@fantopark.com appears...');
    
    // Check as sales_person
    const salesPersonOrders = await db.collection(collections.orders)
      .where('sales_person', '==', email)
      .get();
    
    console.log(`   - Found ${salesPersonOrders.size} orders where sales_person = ${email}`);
    
    // Check as assigned_to
    const assignedToOrders = await db.collection(collections.orders)
      .where('assigned_to', '==', email)
      .get();
    
    console.log(`   - Found ${assignedToOrders.size} orders where assigned_to = ${email}`);
    
    // 3. Look for conflicts where assigned_to and sales_person are different
    console.log('\n3. Looking for orders where assigned_to and sales_person have different values...');
    
    let conflictCount = 0;
    const conflicts = [];
    
    // Get all orders to check for conflicts
    const allOrdersSnapshot = await db.collection(collections.orders).get();
    
    allOrdersSnapshot.forEach(doc => {
      const order = doc.data();
      
      // Check if jackson.bodra is involved and there's a conflict
      if ((order.assigned_to === email || order.sales_person === email) &&
          order.assigned_to && order.sales_person && 
          order.assigned_to !== order.sales_person) {
        conflictCount++;
        conflicts.push({
          id: doc.id,
          order_number: order.order_number,
          client_name: order.client_name,
          assigned_to: order.assigned_to,
          sales_person: order.sales_person,
          status: order.status,
          created_date: order.created_date
        });
      }
    });
    
    console.log(`   - Found ${conflictCount} orders with conflicts involving Jackson Bodra`);
    
    if (conflicts.length > 0) {
      console.log('\n   Conflict details (first 10):');
      conflicts.slice(0, 10).forEach((conflict, index) => {
        console.log(`\n   ${index + 1}. Order: ${conflict.order_number}`);
        console.log(`      Client: ${conflict.client_name}`);
        console.log(`      assigned_to: ${conflict.assigned_to}`);
        console.log(`      sales_person: ${conflict.sales_person}`);
        console.log(`      Status: ${conflict.status}`);
        console.log(`      Created: ${conflict.created_date}`);
      });
    }
    
    // 4. Check leads assigned to Jackson Bodra
    console.log('\n4. Checking leads assigned to Jackson Bodra...');
    const leadsSnapshot = await db.collection(collections.leads)
      .where('assigned_to', '==', email)
      .get();
    
    console.log(`   - Found ${leadsSnapshot.size} leads assigned to ${email}`);
    
    if (leadsSnapshot.size > 0) {
      console.log('   Lead status breakdown:');
      const statusCount = {};
      leadsSnapshot.forEach(doc => {
        const lead = doc.data();
        statusCount[lead.status] = (statusCount[lead.status] || 0) + 1;
      });
      
      Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`      - ${status}: ${count}`);
      });
    }
    
    // 5. Check department and retail_tracker_members
    console.log('\n5. Checking department and retail_tracker_members...');
    
    // Since we don't have a specific retail_tracker_members collection, let's check:
    // a) User's department
    if (!usersSnapshot.empty) {
      const user = usersSnapshot.docs[0].data();
      console.log(`   - User department: ${user.department || 'Not specified'}`);
      
      if (user.department === 'retail') {
        console.log('   ✅ User is in the retail department');
      } else {
        console.log('   ❌ User is NOT in the retail department');
      }
    }
    
    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`User exists: ${!usersSnapshot.empty ? 'Yes' : 'No'}`);
    console.log(`Orders as sales_person: ${salesPersonOrders.size}`);
    console.log(`Orders as assigned_to: ${assignedToOrders.size}`);
    console.log(`Orders with conflicts: ${conflictCount}`);
    console.log(`Leads assigned: ${leadsSnapshot.size}`);
    
    // Additional analysis
    console.log('\n=== ADDITIONAL ANALYSIS ===');
    
    // Check if there's a pattern in the conflicts
    if (conflicts.length > 0) {
      const assignedToSet = new Set(conflicts.map(c => c.assigned_to));
      const salesPersonSet = new Set(conflicts.map(c => c.sales_person));
      
      console.log('\nUnique assigned_to values in conflicts:');
      assignedToSet.forEach(value => console.log(`   - ${value}`));
      
      console.log('\nUnique sales_person values in conflicts:');
      salesPersonSet.forEach(value => console.log(`   - ${value}`));
    }
    
    // Check orders where both fields are jackson.bodra
    let matchingCount = 0;
    allOrdersSnapshot.forEach(doc => {
      const order = doc.data();
      if (order.assigned_to === email && order.sales_person === email) {
        matchingCount++;
      }
    });
    
    console.log(`\nOrders where both assigned_to AND sales_person = ${email}: ${matchingCount}`);
    
  } catch (error) {
    console.error('Error during investigation:', error);
  }
  
  process.exit(0);
}

investigateJacksonBodra();