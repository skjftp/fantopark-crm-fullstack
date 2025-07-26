const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// Get payables for finance dashboard
router.get('/payables', authenticateToken, checkPermission('finance', 'read'), async (req, res) => {
  try {
    const snapshot = await db.collection('crm_payables')
      .where('status', 'in', ['pending', 'overdue'])
      .get();
    
    const payables = [];
    snapshot.forEach(doc => {
      payables.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({ data: payables });
  } catch (error) {
    console.error('Error fetching payables:', error);
    res.status(500).json({ error: error.message });
  }
});

// Note: finance/metrics endpoint removed - frontend now uses sales-performance API for financial data

// Sales performance margin calculation (by salesperson)
router.get('/sales-margins', authenticateToken, async (req, res) => {
  try {
    console.log('🔢 Starting sales performance margin calculation...');

    // Get the same data as main metrics endpoint
    const [ordersSnapshot, allocationsSnapshot, inventorySnapshot, usersSnapshot] = await Promise.all([
      db.collection('crm_orders').get(),
      db.collection('crm_allocations').get(),
      db.collection('crm_inventory').get(),
      db.collection('crm_users').get()
    ]);

    // Process orders - NO FILTERING to match sales performance
    const orders = [];
    ordersSnapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });

    // Process allocations (filter out deleted)
    const allocations = [];
    allocationsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.isDeleted !== true) {
        allocations.push({ id: doc.id, ...data });
      }
    });

    // Process inventory (filter out deleted)
    const inventory = [];
    inventorySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.isDeleted !== true) {
        inventory.push({ id: doc.id, ...data });
      }
    });

    // Process users
    const users = [];
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.isDeleted !== true && data.role !== 'viewer') {
        users.push({ id: doc.id, ...data });
      }
    });

    console.log(`📊 Processing margins for ${users.length} users across ${orders.length} orders`);

    // Calculate margin per salesperson
    const salesMargins = users.map(user => {
      // Match orders by sales_person field (can be name or email)
      const userOrders = orders.filter(order => 
        order.sales_person === user.name || 
        order.sales_person === user.email ||
        order.sales_person_email === user.email ||
        order.assigned_to === user.id
      );
      
      let totalSellingPrice = 0;
      let totalBuyingPrice = 0;
      let processedOrders = 0;

      userOrders.forEach(order => {
        // Find allocations for this order (same logic as main endpoint)
        const orderAllocations = allocations.filter(allocation => 
          (allocation.order_ids && allocation.order_ids.includes(order.id)) ||
          (allocation.order_ids && allocation.order_ids.includes(order.order_number)) ||
          (allocation.lead_id === order.lead_id && allocation.inventory_event === order.event_name)
        );

        if (orderAllocations.length > 0) {
          // Calculate order selling price (same logic as main endpoint)
          let orderSellingPrice = 0;

          // Match sales performance logic for selling price
          orderSellingPrice = order.payment_currency === 'INR' 
            ? parseFloat(order.total_amount || 0)
            : parseFloat(order.inr_equivalent || 0);

          // Calculate buying price from allocations (same logic as main endpoint)
          let orderBuyingPrice = 0;

          orderAllocations.forEach(allocation => {
            const inventoryItem = inventory.find(item => 
              item.id === allocation.inventory_id || 
              item.event_name === allocation.inventory_event
            );

            if (inventoryItem) {
              let buyingPrice = 0;

              // Category-specific buying price
              if (allocation.category_name && inventoryItem.categories) {
                const category = inventoryItem.categories.find(cat => 
                  cat.name === allocation.category_name && 
                  (!allocation.category_section || cat.section === allocation.category_section)
                );

                if (category) {
                  if (category.buying_price_inr) {
                    buyingPrice = parseFloat(category.buying_price_inr);
                  } else if (category.buying_price) {
                    const categoryBuyingPrice = parseFloat(category.buying_price);
                    if (inventoryItem.price_currency && inventoryItem.price_currency !== 'INR' && inventoryItem.exchange_rate) {
                      buyingPrice = categoryBuyingPrice * parseFloat(inventoryItem.exchange_rate);
                    } else {
                      buyingPrice = categoryBuyingPrice;
                    }
                  }
                }
              }

              // Fallback to inventory-level buying price
              if (buyingPrice === 0) {
                if (inventoryItem.buying_price_inr) {
                  buyingPrice = parseFloat(inventoryItem.buying_price_inr);
                } else if (inventoryItem.buying_price) {
                  const itemBuyingPrice = parseFloat(inventoryItem.buying_price);
                  if (inventoryItem.price_currency && inventoryItem.price_currency !== 'INR' && inventoryItem.exchange_rate) {
                    buyingPrice = itemBuyingPrice * parseFloat(inventoryItem.exchange_rate);
                  } else {
                    buyingPrice = itemBuyingPrice;
                  }
                }
              }

              orderBuyingPrice += (allocation.tickets_allocated || 0) * buyingPrice;
            }
          });

          totalSellingPrice += orderSellingPrice;
          totalBuyingPrice += orderBuyingPrice;
          processedOrders++;
        }
      });

      const margin = totalSellingPrice - totalBuyingPrice;
      const marginPercentage = totalSellingPrice > 0 ? (margin / totalSellingPrice * 100) : 0;

      // Debug logging for users with orders
      if (userOrders.length > 0) {
        console.log(`👤 ${user.name}: ${userOrders.length} orders, ${processedOrders} with allocations, margin: ${margin.toFixed(2)} (${marginPercentage.toFixed(2)}%)`);
      }

      return {
        userId: user.id,
        userName: user.name,
        totalOrders: userOrders.length,
        processedOrders,
        totalSellingPrice,
        totalBuyingPrice,
        margin,
        marginPercentage: Math.round(marginPercentage * 100) / 100
      };
    });

    console.log(`💰 Sales margins calculated for ${salesMargins.length} users`);

    res.json({
      success: true,
      data: salesMargins
    });

  } catch (error) {
    console.error('❌ Error calculating sales margins:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
