const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/db');
const { authenticateToken, checkPermission } = require('../middleware/auth');
const { Parser } = require('json2csv');

// GET /api/audit-export - Export audit data
router.get('/', authenticateToken, checkPermission('super_admin'), async (req, res) => {
  try {
    console.log('Starting audit data export for user:', req.user.email);

    // Fetch all required data
    const [leadsSnapshot, ordersSnapshot, allocationsSnapshot, inventorySnapshot, usersSnapshot] = await Promise.all([
      db.collection(collections.leads).get(),
      db.collection(collections.orders).get(),
      db.collection(collections.allocations).get(),
      db.collection(collections.inventory).get(),
      db.collection(collections.users).get()
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

    const users = [];
    usersSnapshot.forEach(doc => users.push({ id: doc.id, ...doc.data() }));

    console.log('Data counts:', {
      leads: leads.length,
      orders: orders.length,
      allocations: allocations.length,
      inventory: inventory.length,
      users: users.length
    });

    // Create name to email mapping for conversion
    const nameToEmail = new Map();
    const emailToName = new Map();
    users.forEach(user => {
      nameToEmail.set(user.name, user.email);
      emailToName.set(user.email, user.name);
    });

    // Log sample data to debug
    if (allocations.length > 0) {
      console.log('Sample allocation:', JSON.stringify(allocations[0], null, 2));
    }
    if (orders.length > 0) {
      console.log('Sample order:', JSON.stringify({
        id: orders[0].id,
        order_number: orders[0].order_number,
        status: orders[0].status,
        payment_currency: orders[0].payment_currency,
        total_amount: orders[0].total_amount,
        final_amount_inr: orders[0].final_amount_inr,
        inr_equivalent: orders[0].inr_equivalent,
        exchange_rate: orders[0].exchange_rate,
        base_amount: orders[0].base_amount
      }, null, 2));
    }

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
    const now = new Date();

    for (const order of orders) {
      // Get sales person information
      const salesPersonField = order.sales_person || order.sales_person_email;
      if (!salesPersonField) continue;

      // Convert to email if it's a name
      let salesPersonEmail = salesPersonField;
      let salesPersonName = salesPersonField;
      if (!salesPersonField.includes('@')) {
        // It's a name, convert to email
        salesPersonEmail = nameToEmail.get(salesPersonField);
        if (!salesPersonEmail) continue;
        salesPersonName = salesPersonField;
      } else {
        // It's an email, get the name
        salesPersonName = emailToName.get(salesPersonField) || salesPersonField;
      }

      // Get lead information
      const lead = leadMap[order.lead_id] || {};
      const leadName = lead.name || lead.company_name || order.client_name || order.customer_name || 'Unknown';
      const leadEvent = order.event_name || lead.lead_for_event || 'Unknown';

      // Use correct field based on currency for sales value
      const sellingPrice = order.payment_currency === 'INR' 
        ? parseFloat(order.total_amount || 0)
        : parseFloat(order.inr_equivalent || 0);
      
      // Don't use order buying price - will get from allocations
      const buyingPriceInclusions = parseFloat(order.buying_price_inclusions || 0);

      // Check if actualized (event date has passed)
      let isActualized = false;
      if (order.event_date) {
        const eventDate = new Date(order.event_date);
        isActualized = eventDate < now;
      }

      // Get allocation details for this order
      const orderAllocations = allocations.filter(alloc => 
        alloc.order_id === order.id || 
        alloc.order_id === order.order_number ||
        alloc.order_number === order.order_number ||
        alloc.order_number === order.id ||
        (alloc.order_ids && alloc.order_ids.includes(order.id)) || // Check if order is in order_ids array
        (order.allocation_ids && order.allocation_ids.includes(alloc.id)) // Check if allocation is in order's allocation_ids array
      );
      
      // Debug allocation matching
      if (orderAllocations.length === 0 && order.order_number) {
        console.log(`No allocations found for order ${order.order_number} (${order.id})`);
        if (order.allocation_ids && order.allocation_ids.length > 0) {
          console.log(`Order has allocation_ids: ${order.allocation_ids.join(', ')}`);
          // Check if these allocations exist
          order.allocation_ids.forEach(allocId => {
            const allocExists = allocations.some(a => a.id === allocId);
            if (!allocExists) {
              console.log(`  - Allocation ${allocId} not found in allocations collection`);
            }
          });
        }
      }

      // If no allocations, still include the order with basic info
      if (orderAllocations.length === 0) {
        // No allocations = no buying price from allocations
        const totalBuyingPrice = buyingPriceInclusions; // Only inclusions, no ticket buying price
        const margin = sellingPrice - totalBuyingPrice;
        const marginPercentage = sellingPrice > 0 ? (margin / sellingPrice * 100) : 0;
        
        auditData.push({
          lead_name: leadName,
          lead_for_event: leadEvent,
          allocation_category: 'No Allocation',
          allocation_stand: 'No Allocation',
          order_id: order.order_number || order.id,
          order_date: order.created_date || order.updated_date || '',
          sales_person_name: salesPersonName,
          sales_person_email: salesPersonEmail,
          client_name: order.client_name || order.customer_name || leadName,
          event_name: order.event_name || leadEvent,
          event_date: order.event_date || '',
          is_actualized: isActualized,
          payment_currency: order.payment_currency || 'INR',
          exchange_rate: order.exchange_rate || 1,
          base_amount: order.base_amount || order.total_amount || 0,
          total_amount: order.total_amount || 0,
          inr_equivalent: order.inr_equivalent || 0,
          selling_price_inr: sellingPrice,
          buying_price_tickets: 0, // No allocations = no ticket buying price
          buying_price_inclusions: buyingPriceInclusions,
          total_buying_price: totalBuyingPrice,
          margin: margin,
          margin_percentage: marginPercentage.toFixed(2),
          payment_status: order.payment_status || 'pending',
          order_status: order.status || 'unknown',
          number_of_people: order.number_of_people || 0
        });
      } else {
        // Process each allocation
        for (const allocation of orderAllocations) {
          const inv = inventoryMap[allocation.inventory_id] || {};
          
          // Get buying price from inventory based on category and stand
          let buyingPricePerTicket = 0;
          const allocatedQty = allocation.tickets_allocated || allocation.quantity || 0;
          
          // Debug logging for Nandini's order
          if (order.order_number === 'ORD-1753256861487') {
            console.log('Processing Nandini order:', {
              allocation_id: allocation.id,
              inventory_id: allocation.inventory_id,
              category: allocation.category_name || allocation.category,
              stand: allocation.stand_section || allocation.stand,
              qty: allocatedQty,
              inv_categories: inv.categories ? inv.categories.length : 'none'
            });
          }
          
          // First try to get from inventory categories
          if (inv.categories && Array.isArray(inv.categories)) {
            const categoryName = allocation.category_name || allocation.category || '';
            const category = inv.categories.find(cat => cat.name === categoryName);
            if (category) {
              buyingPricePerTicket = parseFloat(category.buying_price) || 0;
              if (order.order_number === 'ORD-1753256861487') {
                console.log('Found category buying price:', buyingPricePerTicket);
              }
            }
          } else if (inv.buying_price) {
            // Fallback to legacy inventory structure
            buyingPricePerTicket = parseFloat(inv.buying_price) || 0;
          }
          
          const allocationBuyingPrice = buyingPricePerTicket * allocatedQty;
          const totalBuyingPrice = allocationBuyingPrice + buyingPriceInclusions;
          const margin = sellingPrice - totalBuyingPrice;
          const marginPercentage = sellingPrice > 0 ? (margin / sellingPrice * 100) : 0;
          
          auditData.push({
            lead_name: leadName,
            lead_for_event: leadEvent,
            allocation_category: allocation.category_name || allocation.category || inv.category || 'Unknown',
            allocation_stand: allocation.stand_section || allocation.stand || inv.stand || 'Unknown',
            allocation_qty: allocation.tickets_allocated || allocation.quantity || 0,
            allocation_unit_price: allocation.unit_price || allocation.price || 0,
            order_id: order.order_number || order.id,
            order_date: order.created_date || order.updated_date || '',
            sales_person_name: salesPersonName,
            sales_person_email: salesPersonEmail,
            client_name: order.client_name || order.customer_name || leadName,
            event_name: order.event_name || leadEvent,
            event_date: order.event_date || '',
            is_actualized: isActualized,
            payment_currency: order.payment_currency || 'INR',
            exchange_rate: order.exchange_rate || 1,
            base_amount: order.base_amount || order.total_amount || 0,
            total_amount: order.total_amount || 0,
            inr_equivalent: order.inr_equivalent || 0,
            selling_price_inr: sellingPrice,
            buying_price_tickets: allocationBuyingPrice,
            buying_price_inclusions: buyingPriceInclusions,
            total_buying_price: totalBuyingPrice,
            margin: margin,
            margin_percentage: marginPercentage.toFixed(2),
            payment_status: order.payment_status || 'pending',
            order_status: order.status || 'unknown',
            number_of_people: order.number_of_people || 0
          });
        }
      }
    }

    // Sort by sales person and order date
    auditData.sort((a, b) => {
      if (a.sales_person_name !== b.sales_person_name) {
        return a.sales_person_name.localeCompare(b.sales_person_name);
      }
      return new Date(b.order_date) - new Date(a.order_date);
    });

    console.log('Audit processing complete. Total records:', auditData.length);

    // Return based on format parameter
    if (req.query.format === 'json') {
      // Calculate summary by sales person
      const summary = {};
      const salesPersonTotals = new Map();
      
      auditData.forEach(row => {
        const salesPerson = row.sales_person_name;
        if (!salesPersonTotals.has(row.order_id)) {
          salesPersonTotals.set(row.order_id, {
            salesPerson: salesPerson,
            totalSales: row.final_amount_inr,
            actualizedSales: row.is_actualized ? row.final_amount_inr : 0,
            totalMargin: row.margin,
            actualizedMargin: row.is_actualized ? row.margin : 0,
            orderProcessed: false
          });
        }
        
        if (!summary[salesPerson]) {
          summary[salesPerson] = {
            total_sales: 0,
            actualized_sales: 0,
            total_margin: 0,
            actualized_margin: 0,
            order_count: new Set(),
            lead_count: new Set()
          };
        }
        
        // Only count each order once for totals
        const orderData = salesPersonTotals.get(row.order_id);
        if (!orderData.orderProcessed) {
          summary[salesPerson].total_sales += orderData.totalSales;
          summary[salesPerson].actualized_sales += orderData.actualizedSales;
          summary[salesPerson].total_margin += orderData.totalMargin;
          summary[salesPerson].actualized_margin += orderData.actualizedMargin;
          orderData.orderProcessed = true;
        }
        
        summary[salesPerson].order_count.add(row.order_id);
        summary[salesPerson].lead_count.add(row.lead_name);
      });

      // Convert sets to counts
      Object.keys(summary).forEach(key => {
        summary[key].order_count = summary[key].order_count.size;
        summary[key].lead_count = summary[key].lead_count.size;
        summary[key].margin_percentage = summary[key].total_sales > 0 
          ? ((summary[key].total_margin / summary[key].total_sales) * 100).toFixed(2)
          : '0.00';
      });

      res.json({
        success: true,
        data: auditData,
        summary: summary,
        total_records: auditData.length
      });
    } else {
      // Return as CSV (default) - simplified fields as requested with custom headers
      const fields = [
        { label: 'lead_name', value: 'lead_name' },
        { label: 'lead_for_event', value: 'lead_for_event' },
        { label: 'allocation_category', value: 'allocation_category' },
        { label: 'allocation_stand', value: 'allocation_stand' },
        { label: 'allocation_qty', value: 'allocation_qty' },
        { label: 'order_id', value: 'order_id' },
        { label: 'sales_person', value: 'sales_person_name' },
        { label: 'currency', value: 'payment_currency' },
        { label: 'inr_equivalent', value: 'inr_equivalent' },
        { label: 'total_amount', value: 'total_amount' },
        { label: 'buying_price', value: 'total_buying_price' },
        { label: 'margin', value: 'margin' }
      ];

      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(auditData);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit_export_${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    }

  } catch (error) {
    console.error('Error exporting audit data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export audit data',
      message: error.message 
    });
  }
});

module.exports = router;