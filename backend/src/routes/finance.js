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

// Enhanced financial metrics with margin calculation
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    console.log('🔢 Starting backend margin calculation...');

    // Fetch all required data in parallel
    // Note: Using .get() without where clause then filtering in memory because
    // Firestore where('isDeleted', '!=', true) doesn't match docs without isDeleted field
    const [ordersSnapshot, allocationsSnapshot, inventorySnapshot] = await Promise.all([
      db.collection('crm_orders').get(),
      db.collection('crm_allocations').get(),
      db.collection('crm_inventory').get()
    ]);

    // Process orders (filter out deleted)
    const orders = [];
    ordersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.isDeleted !== true) {
        orders.push({ id: doc.id, ...data });
      }
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

    console.log(`📊 Processing ${orders.length} orders, ${allocations.length} allocations, ${inventory.length} inventory items`);
    console.log(`📊 Raw snapshots: orders=${ordersSnapshot.size}, allocations=${allocationsSnapshot.size}, inventory=${inventorySnapshot.size}`);
    
    // Debug: Log first few raw orders to see structure
    if (ordersSnapshot.size > 0) {
      let count = 0;
      ordersSnapshot.forEach(doc => {
        if (count < 2) {
          const data = doc.data();
          console.log(`📋 Raw Order ${count + 1}:`, {
            id: doc.id,
            isDeleted: data.isDeleted,
            event_name: data.event_name,
            final_amount: data.final_amount,
            payment_currency: data.payment_currency
          });
          count++;
        }
      });
    }

    // Calculate margin using order-based approach
    let totalSellingPrice = 0;
    let totalBuyingPrice = 0;
    let processedOrders = 0;

    // Debug: Log first few orders and their allocation matching
    let debugCount = 0;
    
    orders.forEach(order => {
      // Find allocations for this order
      const orderAllocations = allocations.filter(allocation => 
        (allocation.order_ids && allocation.order_ids.includes(order.id)) ||
        (allocation.order_ids && allocation.order_ids.includes(order.order_number)) ||
        (allocation.lead_id === order.lead_id && allocation.inventory_event === order.event_name)
      );

      // Debug logging for first few orders
      if (debugCount < 3) {
        console.log(`🔍 Order ${debugCount + 1} Debug:`, {
          order_id: order.id,
          order_number: order.order_number,
          lead_id: order.lead_id,
          event_name: order.event_name,
          matchingAllocations: orderAllocations.length,
          allocationsWithThisOrderId: allocations.filter(a => a.order_ids && a.order_ids.includes(order.id)).length,
          allocationsWithThisOrderNumber: allocations.filter(a => a.order_ids && a.order_ids.includes(order.order_number)).length,
          allocationsWithLeadAndEvent: allocations.filter(a => a.lead_id === order.lead_id && a.inventory_event === order.event_name).length
        });
        debugCount++;
      }

      if (orderAllocations.length > 0) {
        // Calculate order selling price (amount without GST/TCS, in INR)
        let orderSellingPrice = 0;

        // Handle foreign currency orders
        if (order.payment_currency && order.payment_currency !== 'INR') {
          // Foreign currency - prioritize INR equivalents
          if (order.base_amount && order.exchange_rate) {
            orderSellingPrice = parseFloat(order.base_amount) * parseFloat(order.exchange_rate);
          } else if (order.final_amount_inr && order.gst_amount_inr && order.tcs_amount_inr) {
            orderSellingPrice = parseFloat(order.final_amount_inr) - parseFloat(order.gst_amount_inr || 0) - parseFloat(order.tcs_amount_inr || 0);
          } else if (order.final_amount_inr) {
            orderSellingPrice = parseFloat(order.final_amount_inr);
          }
        } else {
          // INR order
          if (order.base_amount) {
            orderSellingPrice = parseFloat(order.base_amount);
          } else if (order.final_amount && order.gst_amount && order.tcs_amount) {
            orderSellingPrice = parseFloat(order.final_amount) - parseFloat(order.gst_amount || 0) - parseFloat(order.tcs_amount || 0);
          } else if (order.final_amount_inr) {
            orderSellingPrice = parseFloat(order.final_amount_inr);
          } else if (order.final_amount) {
            orderSellingPrice = parseFloat(order.final_amount);
          }
        }

        // Calculate buying price from allocations
        let orderBuyingPrice = 0;

        orderAllocations.forEach(allocation => {
          // Find inventory item for this allocation
          const inventoryItem = inventory.find(item => 
            item.id === allocation.inventory_id || 
            item.event_name === allocation.inventory_event
          );

          if (inventoryItem) {
            let buyingPrice = 0;

            // Check for category-specific buying price
            if (allocation.category_name && inventoryItem.categories) {
              const category = inventoryItem.categories.find(cat => 
                cat.name === allocation.category_name && 
                (!allocation.category_section || cat.section === allocation.category_section)
              );

              if (category) {
                // Prioritize INR buying price
                if (category.buying_price_inr) {
                  buyingPrice = parseFloat(category.buying_price_inr);
                } else if (category.buying_price) {
                  const categoryBuyingPrice = parseFloat(category.buying_price);
                  // Convert to INR if needed
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
                // Convert to INR if needed
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

    const totalMargin = totalSellingPrice - totalBuyingPrice;
    const marginPercentage = totalSellingPrice > 0 ? (totalMargin / totalSellingPrice * 100) : 0;

    console.log('💰 Backend margin calculation results:', {
      processedOrders,
      totalOrders: orders.length,
      totalSellingPrice: `₹${totalSellingPrice.toLocaleString()}`,
      totalBuyingPrice: `₹${totalBuyingPrice.toLocaleString()}`,
      totalMargin: `₹${totalMargin.toLocaleString()}`,
      marginPercentage: `${marginPercentage.toFixed(2)}%`
    });

    res.json({
      success: true,
      data: {
        totalMargin,
        marginPercentage: Math.round(marginPercentage * 100) / 100,
        totalSellingPrice,
        totalBuyingPrice,
        processedOrders,
        totalOrders: orders.length
      }
    });

  } catch (error) {
    console.error('❌ Error calculating financial metrics:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

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

    // Process orders (filter out deleted)
    const orders = [];
    ordersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.isDeleted !== true) {
        orders.push({ id: doc.id, ...data });
      }
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

          if (order.payment_currency && order.payment_currency !== 'INR') {
            if (order.base_amount && order.exchange_rate) {
              orderSellingPrice = parseFloat(order.base_amount) * parseFloat(order.exchange_rate);
            } else if (order.final_amount_inr && order.gst_amount_inr && order.tcs_amount_inr) {
              orderSellingPrice = parseFloat(order.final_amount_inr) - parseFloat(order.gst_amount_inr || 0) - parseFloat(order.tcs_amount_inr || 0);
            } else if (order.final_amount_inr) {
              orderSellingPrice = parseFloat(order.final_amount_inr);
            }
          } else {
            if (order.base_amount) {
              orderSellingPrice = parseFloat(order.base_amount);
            } else if (order.final_amount && order.gst_amount && order.tcs_amount) {
              orderSellingPrice = parseFloat(order.final_amount) - parseFloat(order.gst_amount || 0) - parseFloat(order.tcs_amount || 0);
            } else if (order.final_amount_inr) {
              orderSellingPrice = parseFloat(order.final_amount_inr);
            } else if (order.final_amount) {
              orderSellingPrice = parseFloat(order.final_amount);
            }
          }

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
