const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/db');
const { authenticateToken, checkPermission } = require('../middleware/auth');
const { Parser } = require('json2csv');

// GET /api/audit-export - Export audit data
router.get('/', authenticateToken, checkPermission('super_admin'), async (req, res) => {
  try {
    console.log('Starting audit data export for user:', req.user.email);

    // Fetch all required data - include all orders, not just approved
    const [leadsSnapshot, ordersSnapshot, allocationsSnapshot, inventorySnapshot] = await Promise.all([
      db.collection(collections.leads).get(),
      db.collection(collections.orders).get(), // Get ALL orders for audit
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

    console.log('Data counts:', {
      leads: leads.length,
      orders: orders.length,
      allocations: allocations.length,
      inventory: inventory.length
    });

    // Log sample data to debug
    if (allocations.length > 0) {
      console.log('Sample allocation:', allocations[0]);
    }
    if (orders.length > 0) {
      console.log('Sample order:', {
        id: orders[0].id,
        order_number: orders[0].order_number,
        status: orders[0].status
      });
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

    let ordersWithAllocations = 0;
    let ordersWithoutAllocations = 0;

    for (const order of orders) {
      // Skip orders without allocations
      const orderAllocations = allocations.filter(alloc => 
        alloc.order_id === order.id || alloc.order_id === order.order_number
      );

      if (orderAllocations.length === 0) {
        ordersWithoutAllocations++;
        continue;
      }
      
      ordersWithAllocations++;

      // Get lead information
      const lead = leadMap[order.lead_id] || {};
      const leadName = lead.name || lead.company_name || order.client_name || 'Unknown';
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

    console.log('Audit processing results:', {
      ordersWithAllocations,
      ordersWithoutAllocations,
      totalAuditRecords: auditData.length
    });

    // Return based on format parameter
    if (req.query.format === 'json') {
      // Calculate summary
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

      // Convert sets to counts
      Object.keys(summary).forEach(key => {
        summary[key].order_count = summary[key].order_count.size;
        summary[key].lead_count = summary[key].lead_count.size;
      });

      res.json({
        success: true,
        data: auditData,
        summary: summary,
        total_records: auditData.length
      });
    } else {
      // Return as CSV (default)
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