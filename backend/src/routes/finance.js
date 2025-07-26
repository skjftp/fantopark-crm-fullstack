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

// Enhanced financial metrics with margin calculation and complete financial data
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const { period } = req.query; // 'current_fy', 'current_month', 'last_month'
    console.log('🔢 Starting backend financial metrics calculation for period:', period || 'all');

    // Fetch all required data in parallel
    // Note: Using .get() without where clause then filtering in memory because
    // Firestore where('isDeleted', '!=', true) doesn't match docs without isDeleted field
    const [ordersSnapshot, allocationsSnapshot, inventorySnapshot] = await Promise.all([
      db.collection('crm_orders').get(),
      db.collection('crm_allocations').get(),
      db.collection('crm_inventory').get()
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

    // Apply date filtering based on period
    let filteredOrders = orders;
    
    // CRITICAL: Filter orders to only include those with sales_person (to match sales-performance)
    filteredOrders = filteredOrders.filter(order => 
      order.sales_person || order.sales_person_email
    );
    if (period) {
      const now = new Date();
      let startDate, endDate;
      
      switch(period) {
        case 'current_fy':
          // Indian FY: April 1 to March 31
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          const fyYear = currentMonth >= 3 ? currentYear : currentYear - 1;
          startDate = new Date(fyYear, 3, 1); // April 1
          endDate = new Date();
          break;
          
        case 'current_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date();
          break;
          
        case 'last_month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of previous month
          break;
      }
      
      if (startDate && endDate) {
        filteredOrders = orders.filter(order => {
          // Use event_date for filtering
          const orderDate = order.event_date?.toDate ? order.event_date.toDate() : new Date(order.event_date);
          return orderDate >= startDate && orderDate <= endDate;
        });
      }
    }
    
    console.log(`📊 Processing ${filteredOrders.length} orders (filtered from ${orders.length}), ${allocations.length} allocations, ${inventory.length} inventory items`);
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
    
    filteredOrders.forEach(order => {
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

        // Match sales performance logic for selling price
        orderSellingPrice = order.payment_currency === 'INR' 
          ? parseFloat(order.total_amount || 0)
          : parseFloat(order.inr_equivalent || 0);

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

    // Calculate additional financial metrics based on period
    let totalSales = 0;
    let activeSales = 0;
    let totalReceivables = 0;
    let totalPayables = 0;

    // Get date range for the period
    let dateRange = null;
    const now = new Date();
    let startDate, endDate;
    
    // Always calculate date range, even for 'all' or no period (defaults to current FY)
    if (!period || period === 'all' || period === 'current_fy') {
      // Current financial year
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const fyYear = currentMonth >= 3 ? currentYear : currentYear - 1;
      startDate = new Date(fyYear, 3, 1); // April 1
      endDate = new Date();
    } else if (period === 'current_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date();
    } else if (period === 'last_month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
    }
    
    if (startDate && endDate) {
      dateRange = { startDate, endDate };
    }

    // Calculate total sales (all orders in period) - match sales performance logic
    const orderAmounts = [];
    totalSales = filteredOrders.reduce((sum, order) => {
      const amount = order.payment_currency === 'INR' 
        ? parseFloat(order.total_amount || 0)
        : parseFloat(order.inr_equivalent || 0);
      
      // Debug: Track each order amount
      if (amount > 0) {
        orderAmounts.push({
          order_id: order.id,
          order_number: order.order_number,
          amount: amount,
          currency: order.payment_currency,
          total_amount: order.total_amount,
          inr_equivalent: order.inr_equivalent
        });
      }
      
      return sum + amount;
    }, 0);
    
    console.log(`💰 Finance Total Sales Calculation:`, {
      totalOrders: filteredOrders.length,
      ordersWithAmount: orderAmounts.length,
      totalSales: totalSales,
      totalSalesInCr: (totalSales / 10000000).toFixed(2),
      sampleOrders: orderAmounts.slice(0, 5),
      ordersWithoutSalesPerson: filteredOrders.filter(o => !o.sales_person && !o.sales_person_email).length,
      uniqueSalesPersons: [...new Set(filteredOrders.filter(o => o.sales_person || o.sales_person_email).map(o => o.sales_person || o.sales_person_email))]
    });
    
    // Debug: Check if total_amount includes GST/TCS
    const ordersWithGST = filteredOrders.filter(o => o.gst_amount > 0 || o.tcs_amount > 0);
    console.log(`🔍 Orders with GST/TCS:`, {
      count: ordersWithGST.length,
      samples: ordersWithGST.slice(0, 3).map(o => ({
        order_number: o.order_number,
        total_amount: o.total_amount,
        base_amount: o.base_amount,
        gst_amount: o.gst_amount,
        tcs_amount: o.tcs_amount,
        final_amount: o.final_amount,
        invoice_total: o.invoice_total
      }))
    });

    // Calculate active sales (pending/processing orders)
    // Check all possible statuses first
    const allStatuses = [...new Set(filteredOrders.map(o => o.status))];
    console.log('📊 All order statuses found:', allStatuses);
    
    // If most orders don't have status field, consider them all as active
    const ordersWithoutStatus = filteredOrders.filter(o => !o.status && !o.order_status).length;
    console.log(`📊 Orders without status: ${ordersWithoutStatus} out of ${filteredOrders.length}`);
    
    // For now, if orders don't have status, consider them active
    // This matches the frontend behavior where active sales are calculated
    if (ordersWithoutStatus > filteredOrders.length * 0.8) {
      // Most orders don't have status - use the frontend logic
      // Active sales = orders created in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const activeSalesOrders = filteredOrders.filter(order => {
        const orderDate = order.event_date?.toDate ? order.event_date.toDate() : new Date(order.event_date);
        return orderDate >= thirtyDaysAgo;
      });
      
      console.log(`📊 Active sales (last 30 days): ${activeSalesOrders.length} orders`);
      
      activeSales = activeSalesOrders.reduce((sum, order) => {
        const amount = order.payment_currency === 'INR' 
          ? parseFloat(order.total_amount || 0)
          : parseFloat(order.inr_equivalent || 0);
        return sum + amount;
      }, 0);
    } else {
      // Orders have status field - use status-based filtering
      const activeSalesOrders = filteredOrders.filter(order => {
        const status = order.status || order.order_status || '';
        return status === 'pending' || status === 'processing' || status === 'active' || 
               status === 'in_progress' || status === 'confirmed';
      });
      
      console.log(`📊 Active sales (by status): ${activeSalesOrders.length} orders`);
      
      activeSales = activeSalesOrders.reduce((sum, order) => {
        const amount = order.payment_currency === 'INR' 
          ? parseFloat(order.total_amount || 0)
          : parseFloat(order.inr_equivalent || 0);
        return sum + amount;
      }, 0);
    }

    // Fetch receivables and payables
    const [receivablesSnapshot, payablesSnapshot] = await Promise.all([
      db.collection('crm_receivables').get(),
      db.collection('crm_payables').get()
    ]);

    // Process receivables for the period
    const receivables = [];
    receivablesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.isDeleted !== true && data.status !== 'paid') {
        // Check if receivable falls within the period
        if (!dateRange || (data.due_date && 
            new Date(data.due_date) >= dateRange.startDate && 
            new Date(data.due_date) <= dateRange.endDate)) {
          receivables.push(data);
        }
      }
    });
    totalReceivables = receivables.reduce((sum, rec) => sum + (rec.balance_amount || rec.amount || 0), 0);

    // Process payables for the period
    const payables = [];
    let allPayablesCount = 0;
    let unpaidPayablesCount = 0;
    
    payablesSnapshot.forEach(doc => {
      const data = doc.data();
      allPayablesCount++;
      
      if (data.isDeleted !== true && (data.status !== 'paid' && data.status !== 'completed')) {
        unpaidPayablesCount++;
        
        // For payables, if no period filter, include all unpaid
        if (!dateRange) {
          payables.push(data);
        } else {
          // Check multiple date fields for payables
          const payableDate = data.event_date || data.invoice_date || data.due_date || data.created_date;
          if (payableDate) {
            const date = payableDate.toDate ? payableDate.toDate() : new Date(payableDate);
            if (date >= dateRange.startDate && date <= dateRange.endDate) {
              payables.push(data);
            }
          }
        }
      }
    });
    
    console.log(`📊 Payables: ${payables.length} included (${unpaidPayablesCount} unpaid out of ${allPayablesCount} total)`);
    
    totalPayables = payables.reduce((sum, pay) => {
      // Use amount_inr if available, otherwise amount
      const amount = parseFloat(pay.amount_inr || pay.amount || 0);
      return sum + amount;
    }, 0);

    console.log('💰 Backend financial metrics results:', {
      period: period || 'all',
      totalSales: `₹${totalSales.toLocaleString()}`,
      activeSales: `₹${activeSales.toLocaleString()}`,
      totalReceivables: `₹${totalReceivables.toLocaleString()}`,
      totalPayables: `₹${totalPayables.toLocaleString()}`,
      totalMargin: `₹${totalMargin.toLocaleString()}`,
      marginPercentage: `${marginPercentage.toFixed(2)}%`
    });

    res.json({
      success: true,
      data: {
        // Financial totals
        totalSales,
        activeSales,
        totalReceivables,
        totalPayables,
        // Margin data
        totalMargin,
        marginPercentage: Math.round(marginPercentage * 100) / 100,
        totalSellingPrice,
        totalBuyingPrice,
        processedOrders,
        totalOrders: filteredOrders.length,
        period: period || 'all'
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
