require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');
const { Firestore } = require('@google-cloud/firestore');

// Initialize Firestore with service account
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
const db = new Firestore({
  projectId: serviceAccount.project_id || process.env.GOOGLE_CLOUD_PROJECT,
  credentials: serviceAccount
});

// Collection names
const collections = {
  users: 'crm_users',
  leads: 'crm_leads',
  inventory: 'crm_inventory',
  orders: 'crm_orders',
  invoices: 'crm_invoices',
  allocations: 'crm_allocations',
  deliveries: 'crm_deliveries',
  receivables: 'crm_receivables'
};

async function exportAuditData() {
  console.log('Starting audit data export...');

  try {
    // Fetch all required data
    const [leadsSnapshot, ordersSnapshot, allocationsSnapshot, inventorySnapshot] = await Promise.all([
      db.collection(collections.leads).get(),
      db.collection(collections.orders).where('status', '==', 'approved').get(),
      db.collection(collections.allocations).get(),
      db.collection(collections.inventory).get()
    ]);

    // Convert snapshots to data arrays
    const leads = [];
    leadsSnapshot.forEach(doc => leads.push({ id: doc.id, ...doc.data() }));

    const orders = [];
    ordersSnapshot.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));

    const allocations = [];
    allocationsSnapshot.forEach(doc => allocations.push({ id: doc.id, ...doc.data() }));

    const inventory = [];
    inventorySnapshot.forEach(doc => inventory.push({ id: doc.id, ...doc.data() }));

    // Create lookup maps
    const leadMap = {};
    leads.forEach(lead => {
      leadMap[lead.id] = lead;
    });

    const inventoryMap = {};
    inventory.forEach(inv => {
      inventoryMap[inv.id] = inv;
    });

    // Process data for audit report
    const auditData = [];

    for (const order of orders) {
      // Skip orders without allocations
      const orderAllocations = allocations.filter(alloc => 
        alloc.order_id === order.id || alloc.order_id === order.order_number
      );

      if (orderAllocations.length === 0) continue;

      // Get lead information
      const lead = leadMap[order.lead_id] || {};
      const leadName = lead.name || lead.company_name || 'Unknown';
      const leadEvent = lead.lead_for_event || order.event_name || 'Unknown';

      // Process each allocation for this order
      for (const allocation of orderAllocations) {
        const inv = inventoryMap[allocation.inventory_id] || {};
        
        // Calculate values
        const quantity = allocation.quantity || 0;
        const unitPrice = allocation.unit_price || 0;
        const salesValue = quantity * unitPrice;
        
        // Get cost price from inventory or allocation
        const costPrice = allocation.cost_price || inv.cost_price || 0;
        const totalCost = quantity * costPrice;
        
        // Calculate margin
        const margin = salesValue - totalCost;
        const marginPercentage = salesValue > 0 ? (margin / salesValue * 100).toFixed(2) : '0.00';

        auditData.push({
          lead_name: leadName,
          lead_for_event: leadEvent,
          allocation_category: allocation.category_name || inv.category || 'Unknown',
          allocation_stand: allocation.stand_section || inv.stand || 'Unknown',
          order_id: order.order_number || order.id,
          sales_person: order.sales_person || lead.assigned_to || 'Unknown',
          quantity: quantity,
          unit_price: unitPrice,
          sales_value: salesValue,
          cost_price: costPrice,
          total_cost: totalCost,
          margin: margin,
          margin_percentage: marginPercentage,
          order_date: order.created_date || '',
          client_name: order.client_name || lead.company_name || lead.name || 'Unknown',
          payment_status: order.payment_status || 'pending',
          order_status: order.status || 'unknown'
        });
      }
    }

    // Sort by sales person and order date
    auditData.sort((a, b) => {
      if (a.sales_person !== b.sales_person) {
        return a.sales_person.localeCompare(b.sales_person);
      }
      return new Date(b.order_date) - new Date(a.order_date);
    });

    // Define CSV fields
    const fields = [
      'lead_name',
      'lead_for_event',
      'allocation_category',
      'allocation_stand',
      'order_id',
      'sales_person',
      'quantity',
      'unit_price',
      'sales_value',
      'cost_price',
      'total_cost',
      'margin',
      'margin_percentage',
      'order_date',
      'client_name',
      'payment_status',
      'order_status'
    ];

    // Create CSV
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(auditData);

    // Save to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const filename = `audit_data_export_${timestamp}.csv`;
    const filepath = path.join(__dirname, '..', '..', 'exports', filename);

    // Create exports directory if it doesn't exist
    const exportsDir = path.join(__dirname, '..', '..', 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    fs.writeFileSync(filepath, csv);

    // Calculate summary statistics
    const summary = {};
    auditData.forEach(row => {
      const salesPerson = row.sales_person;
      if (!summary[salesPerson]) {
        summary[salesPerson] = {
          total_sales: 0,
          total_cost: 0,
          total_margin: 0,
          order_count: new Set(),
          lead_count: new Set()
        };
      }
      summary[salesPerson].total_sales += row.sales_value;
      summary[salesPerson].total_cost += row.total_cost;
      summary[salesPerson].total_margin += row.margin;
      summary[salesPerson].order_count.add(row.order_id);
      summary[salesPerson].lead_count.add(row.lead_name);
    });

    console.log('\n=== AUDIT SUMMARY ===');
    console.log(`Total Records: ${auditData.length}`);
    console.log(`Export File: ${filename}`);
    console.log('\nSales Person Summary:');
    
    Object.entries(summary).forEach(([salesPerson, data]) => {
      console.log(`\n${salesPerson}:`);
      console.log(`  Total Sales: ₹${(data.total_sales / 10000000).toFixed(2)} Cr`);
      console.log(`  Total Cost: ₹${(data.total_cost / 10000000).toFixed(2)} Cr`);
      console.log(`  Total Margin: ₹${(data.total_margin / 10000000).toFixed(2)} Cr`);
      console.log(`  Margin %: ${data.total_sales > 0 ? (data.total_margin / data.total_sales * 100).toFixed(2) : '0.00'}%`);
      console.log(`  Unique Orders: ${data.order_count.size}`);
      console.log(`  Unique Leads: ${data.lead_count.size}`);
    });

    console.log('\n✅ Export completed successfully!');
    console.log(`📁 File saved to: ${filepath}`);

  } catch (error) {
    console.error('Error exporting audit data:', error);
    process.exit(1);
  }
}

// Run the export
exportAuditData();