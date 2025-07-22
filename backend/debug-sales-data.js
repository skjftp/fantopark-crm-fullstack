// Debug script to extract sales person wise data using Sales Performance logic
const { db, collections } = require('./src/config/db');
const { convertToIST } = require('./src/utils/dateHelpers');

// Touch-based statuses (same as in sales-performance.js)
const touchBasedStatuses = [
  'contacted', 'attempt_1', 'attempt_2', 'attempt_3',
  'qualified', 'unqualified', 'junk', 'warm', 'hot', 'cold',
  'interested', 'not_interested', 'on_hold', 'dropped',
  'converted', 'invoiced', 'payment_received', 'payment_post_service',
  'pickup_later', 'quote_requested', 'quote_received'
];

async function extractSalesData() {
  try {
    console.log('🔍 Starting Sales Performance data extraction...\n');

    // 1. Get sales performance members first
    const salesMembersSnapshot = await db.collection('sales_performance_members').get();
    const salesMemberIds = new Set();
    salesMembersSnapshot.forEach(doc => {
      salesMemberIds.add(doc.id);
    });
    console.log(`📊 Found ${salesMemberIds.size} sales performance members:`, Array.from(salesMemberIds));

    // 2. Get ALL users and filter to only those in sales_performance_members
    const allUsersSnapshot = await db.collection('crm_users').get();
    const allUserDocs = allUsersSnapshot.docs.filter(doc => {
      return salesMemberIds.has(doc.id);
    });
    console.log(`📊 Filtered to ${allUserDocs.length} users who are sales members\n`);

    // Create name to email mapping
    const nameToEmail = new Map();
    const emailToName = new Map();
    const userDetails = {};
    
    allUserDocs.forEach(doc => {
      const userData = doc.data();
      nameToEmail.set(userData.name, userData.email);
      emailToName.set(userData.email, userData.name);
      userDetails[userData.email] = {
        id: doc.id,
        name: userData.name,
        email: userData.email,
        role: userData.role
      };
    });

    console.log('👥 Sales Team Members:');
    Object.values(userDetails).forEach(user => {
      console.log(`   - ${user.name} (${user.email}) [Role: ${user.role}]`);
    });
    console.log('');

    // 3. Get ALL orders (lifetime)
    console.log('📦 Fetching all orders...');
    const allOrdersSnapshot = await db.collection(collections.orders).get();
    console.log(`📦 Found ${allOrdersSnapshot.size} total orders\n`);

    // 4. Group orders by sales person
    const ordersBySalesPerson = new Map();
    const orderDetails = [];
    let processedOrders = 0;
    let assignedToSalesTeam = 0;

    allOrdersSnapshot.docs.forEach(doc => {
      const order = { id: doc.id, ...doc.data() };
      processedOrders++;
      
      // Get sales_person field (could be name or email)
      const salesPersonField = order.sales_person || order.sales_person_email;
      
      if (salesPersonField) {
        // Convert to email if it's a name
        let salesPersonEmail = salesPersonField;
        if (!salesPersonField.includes('@')) {
          // It's a name, convert to email
          salesPersonEmail = nameToEmail.get(salesPersonField);
        }
        
        // Only include if this person is in our sales team
        if (salesPersonEmail && userDetails[salesPersonEmail]) {
          assignedToSalesTeam++;
          
          if (!ordersBySalesPerson.has(salesPersonEmail)) {
            ordersBySalesPerson.set(salesPersonEmail, []);
          }
          ordersBySalesPerson.get(salesPersonEmail).push(order);
          
          // Store order details for analysis
          orderDetails.push({
            orderId: order.id,
            salesPerson: salesPersonEmail,
            salesPersonName: emailToName.get(salesPersonEmail),
            totalAmount: parseFloat(order.total_amount || 0),
            finalAmount: parseFloat(order.final_amount || 0),
            status: order.status,
            eventDate: order.event_date,
            createdDate: order.created_date,
            eventName: order.event_name || 'No Event'
          });
        }
      }
    });

    console.log(`📊 Order Assignment Summary:`);
    console.log(`   Total orders in database: ${processedOrders}`);
    console.log(`   Orders assigned to sales team: ${assignedToSalesTeam}`);
    console.log(`   Unassigned/Other orders: ${processedOrders - assignedToSalesTeam}\n`);

    // 5. Calculate sales person wise totals
    const salesPersonSummary = [];
    let grandTotalAmount = 0;
    let grandFinalAmount = 0;

    ordersBySalesPerson.forEach((orders, salesPersonEmail) => {
      const salesPersonName = emailToName.get(salesPersonEmail);
      let totalSales = 0;
      let finalSales = 0;
      const orderCount = orders.length;
      const statusBreakdown = {};

      orders.forEach(order => {
        const totalAmount = parseFloat(order.total_amount || 0);
        const finalAmount = parseFloat(order.final_amount || 0);
        
        totalSales += totalAmount;
        finalSales += finalAmount;
        
        // Status breakdown
        const status = order.status || 'unknown';
        statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
      });

      grandTotalAmount += totalSales;
      grandFinalAmount += finalSales;

      salesPersonSummary.push({
        name: salesPersonName,
        email: salesPersonEmail,
        orderCount,
        totalSales: totalSales,
        finalSales: finalSales,
        difference: finalSales - totalSales,
        statusBreakdown
      });
    });

    // Sort by total sales descending
    salesPersonSummary.sort((a, b) => b.totalSales - a.totalSales);

    // 6. Display results
    console.log('💰 SALES PERSON WISE BREAKDOWN (Using Sales Performance Logic):\n');
    console.log('=' .repeat(120));
    console.log('| Sales Person                    | Orders | Total Amount  | Final Amount  | Difference   | Top Statuses');
    console.log('=' .repeat(120));

    salesPersonSummary.forEach(person => {
      const topStatuses = Object.entries(person.statusBreakdown)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([status, count]) => `${status}(${count})`)
        .join(', ');

      console.log(
        `| ${person.name.padEnd(30)} | ${person.orderCount.toString().padStart(6)} | ` +
        `₹${(person.totalSales/100000).toFixed(2)}L`.padStart(12) + ' | ' +
        `₹${(person.finalSales/100000).toFixed(2)}L`.padStart(12) + ' | ' +
        `₹${(person.difference/100000).toFixed(2)}L`.padStart(11) + ' | ' +
        topStatuses.substring(0, 25)
      );
    });

    console.log('=' .repeat(120));
    console.log(`| ${'TOTAL'.padEnd(30)} | ${assignedToSalesTeam.toString().padStart(6)} | ` +
      `₹${(grandTotalAmount/10000000).toFixed(2)}Cr`.padStart(12) + ' | ' +
      `₹${(grandFinalAmount/10000000).toFixed(2)}Cr`.padStart(12) + ' | ' +
      `₹${((grandFinalAmount-grandTotalAmount)/10000000).toFixed(2)}Cr`.padStart(11) + ' |'
    );
    console.log('=' .repeat(120));

    console.log(`\n📈 KEY INSIGHTS:`);
    console.log(`   • Sales Performance uses: total_amount field`);
    console.log(`   • Financials likely uses: final_amount field`);
    console.log(`   • Total Amount Sum: ₹${(grandTotalAmount/10000000).toFixed(2)} Crore`);
    console.log(`   • Final Amount Sum: ₹${(grandFinalAmount/10000000).toFixed(2)} Crore`);
    console.log(`   • Difference: ₹${((grandFinalAmount-grandTotalAmount)/10000000).toFixed(2)} Crore`);

    // 7. Status analysis
    console.log(`\n📊 ORDER STATUS ANALYSIS:`);
    const allStatuses = {};
    orderDetails.forEach(order => {
      const status = order.status || 'unknown';
      allStatuses[status] = (allStatuses[status] || 0) + 1;
    });

    Object.entries(allStatuses)
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count]) => {
        const percentage = ((count / assignedToSalesTeam) * 100).toFixed(1);
        console.log(`   • ${status}: ${count} orders (${percentage}%)`);
      });

    return {
      salesPersonSummary,
      totals: {
        totalOrders: assignedToSalesTeam,
        grandTotalAmount,
        grandFinalAmount,
        difference: grandFinalAmount - grandTotalAmount
      }
    };

  } catch (error) {
    console.error('❌ Error extracting sales data:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the extraction
extractSalesData().then(() => {
  console.log('\n✅ Sales data extraction complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Failed to extract sales data:', error);
  process.exit(1);
});