const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { convertToIST } = require('../utils/dateHelpers');

// Define touch-based statuses - same as marketing performance
const touchBasedStatuses = [
  'contacted', 'attempt_1', 'attempt_2', 'attempt_3',
  'qualified', 'unqualified', 'junk', 'warm', 'hot', 'cold',
  'interested', 'not_interested', 'on_hold', 'dropped',
  'converted', 'invoiced', 'payment_received', 'payment_post_service',
  'pickup_later', 'quote_requested', 'quote_received'
];

// Cache structure for sales performance data
const performanceCache = {
  salesData: null,
  salesDataTimestamp: null,
  retailData: new Map(), // Map to store different date ranges
  CACHE_DURATION: 6 * 60 * 60 * 1000 // 6 hours in milliseconds
};

// Helper function to check if cache is valid
function isCacheValid(timestamp) {
  if (!timestamp) return false;
  return (Date.now() - timestamp) < performanceCache.CACHE_DURATION;
}

// Helper function to generate cache key for retail data
function getRetailCacheKey(start_date, end_date) {
  return `${start_date || 'all'}_${end_date || 'all'}`;
}

// Helper function to get date range based on period
function getDateRange(period) {
  const now = new Date();
  let startDate = null;
  let endDate = null;
  
  switch(period) {
    case 'current_fy':
      // Indian FY: April 1 to March 31
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const fyYear = currentMonth >= 3 ? currentYear : currentYear - 1;
      startDate = new Date(fyYear, 3, 1); // April 1
      break;
      
    case 'previous_fy':
      const prevMonth = now.getMonth();
      const prevYear = now.getFullYear();
      const prevFyYear = prevMonth >= 3 ? prevYear - 1 : prevYear - 2;
      startDate = new Date(prevFyYear, 3, 1);
      endDate = new Date(prevFyYear + 1, 2, 31); // March 31
      break;
      
    case 'current_quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      break;
      
    case 'previous_quarter':
      const prevQuarter = Math.floor(now.getMonth() / 3) - 1;
      const year = prevQuarter < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const actualQuarter = prevQuarter < 0 ? 3 : prevQuarter;
      startDate = new Date(year, actualQuarter * 3, 1);
      endDate = new Date(year, (actualQuarter + 1) * 3, 0);
      break;
      
    case 'last_3_months':
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);
      break;
      
    case 'last_6_months':
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6);
      break;
      
    case 'lifetime':
    default:
      return { startDate: null, endDate: null };
  }
  
  return { startDate, endDate: endDate || now };
}

// GET sales team performance data - SHOWS ONLY MEMBERS IN sales_performance_members
router.get('/', authenticateToken, async (req, res) => {
  try {
    const period = req.query.period || 'lifetime'; // Default to lifetime
    const forceRefresh = req.query.force === 'true'; // Force refresh parameter
    const cacheKey = `sales_${period}`;
    
    // Check if we have valid cached data for this period (and not currently clearing cache or forcing refresh)
    if (!forceRefresh && !performanceCache.clearingInProgress && performanceCache[cacheKey] && isCacheValid(performanceCache[`${cacheKey}_timestamp`])) {
      // console.log(`📊 Returning cached sales performance data for period: ${period}`);
      return res.json({
        success: true,
        salesTeam: performanceCache[cacheKey],
        period: period,
        cached: true,
        cacheAge: Math.round((Date.now() - performanceCache[`${cacheKey}_timestamp`]) / 1000 / 60) + ' minutes'
      });
    }

    console.log(`📊 Cache expired or not found, fetching fresh sales performance data for period: ${period}`);
    const startTime = Date.now();
    
    // Get date range based on period
    const { startDate, endDate } = getDateRange(period);
    
    // 1. Get sales performance members first
    const salesMembersSnapshot = await db.collection('sales_performance_members').get();
    const salesMemberIds = new Set();
    salesMembersSnapshot.forEach(doc => {
      salesMemberIds.add(doc.id);
    });
    console.log(`📊 Found ${salesMemberIds.size} sales performance members`);
    
    // 2. Get ALL users and filter to only those in sales_performance_members
    const allUsersSnapshot = await db.collection('crm_users').get();
    
    // Filter to only users who are in sales_performance_members
    const allUserDocs = allUsersSnapshot.docs.filter(doc => {
      return salesMemberIds.has(doc.id);
    });
    console.log(`📊 Filtered to ${allUserDocs.length} users who are sales members`);
    
    // Create name to email mapping for conversion
    const nameToEmail = new Map();
    const emailToName = new Map();
    allUserDocs.forEach(doc => {
      const userData = doc.data();
      nameToEmail.set(userData.name, userData.email);
      emailToName.set(userData.email, userData.name);
    });
    
    // 2. Get orders based on date range
    let allOrdersSnapshot;
    let ordersQuery = db.collection(collections.orders);
    
    // Apply date filters if not lifetime - filter by event_date
    if (startDate) {
      try {
        const startDateIST = convertToIST(startDate);
        ordersQuery = ordersQuery.where('event_date', '>=', startDateIST);
        
        if (endDate) {
          const endDateIST = convertToIST(endDate);
          ordersQuery = ordersQuery.where('event_date', '<=', endDateIST);
        }
        
        allOrdersSnapshot = await ordersQuery.get();
        console.log(`Found ${allOrdersSnapshot.size} orders for period: ${period} (filtered by event_date)`);
      } catch (err) {
        // If date filter fails, get all orders
        console.log('Date filter failed, fetching all orders');
        allOrdersSnapshot = await db.collection(collections.orders).get();
        console.log(`Found ${allOrdersSnapshot.size} total orders`);
      }
    } else {
      // Lifetime - get all orders
      allOrdersSnapshot = await db.collection(collections.orders).get();
      console.log(`Found ${allOrdersSnapshot.size} total orders (lifetime)`);
    }
    
    // 3. Get active leads only (not converted/junk)
    let allLeadsSnapshot;
    try {
      allLeadsSnapshot = await db.collection(collections.leads)
        .where('status', 'in', ['hot', 'warm', 'cold', 'qualified', 'attempt_1', 'attempt_2', 'attempt_3', 'quote_requested', 'quote_received'])
        .get();
      console.log(`Found ${allLeadsSnapshot.size} active leads`);
    } catch (err) {
      // If status filter fails, get all leads
      console.log('Status filter failed, fetching all leads');
      allLeadsSnapshot = await db.collection(collections.leads).get();
      console.log(`Found ${allLeadsSnapshot.size} total leads`);
    }
    
    // 3.5 Get allocations and inventory for buying price calculation
    const [allocationsSnapshot, inventorySnapshot] = await Promise.all([
      db.collection(collections.allocations).get(),
      db.collection(collections.inventory).get()
    ]);
    
    // Create allocation and inventory maps
    const allocationsByOrderId = new Map();
    allocationsSnapshot.forEach(doc => {
      const allocation = { id: doc.id, ...doc.data() };
      // Group allocations by order
      const orderIds = [
        allocation.order_id,
        allocation.order_number,
        ...(allocation.order_ids || [])
      ].filter(Boolean);
      
      orderIds.forEach(orderId => {
        if (!allocationsByOrderId.has(orderId)) {
          allocationsByOrderId.set(orderId, []);
        }
        allocationsByOrderId.get(orderId).push(allocation);
      });
    });
    
    const inventoryMap = new Map();
    inventorySnapshot.forEach(doc => {
      inventoryMap.set(doc.id, { id: doc.id, ...doc.data() });
    });
    
    console.log(`Found ${allocationsSnapshot.size} allocations and ${inventorySnapshot.size} inventory items`);
    
    // 4. Create maps for quick lookup
    const ordersByUser = new Map();
    const leadsByUser = new Map();
    
    // Map orders to users - handle both name and email in sales_person field
    allOrdersSnapshot.docs.forEach(doc => {
      const order = doc.data();
      
      // Get sales_person field (could be name or email)
      const salesPersonField = order.sales_person || order.sales_person_email;
      
      if (salesPersonField) {
        // Convert to email if it's a name
        let salesPersonEmail = salesPersonField;
        if (!salesPersonField.includes('@')) {
          // It's a name, convert to email
          salesPersonEmail = nameToEmail.get(salesPersonField);
          if (!salesPersonEmail) {
            return;
          }
        }
        
        if (!ordersByUser.has(salesPersonEmail)) {
          ordersByUser.set(salesPersonEmail, []);
        }
        ordersByUser.get(salesPersonEmail).push(order);
      }
    });
    
    // Map leads to users (these already use emails)
    allLeadsSnapshot.docs.forEach(doc => {
      const lead = doc.data();
      const assignedTo = lead.assigned_to;
      
      if (assignedTo) {
        if (!leadsByUser.has(assignedTo)) {
          leadsByUser.set(assignedTo, []);
        }
        leadsByUser.get(assignedTo).push(lead);
      }
    });
    
    // 5. Process each user with their data
    const salesTeam = [];
    const now = new Date();
    
    for (const userDoc of allUserDocs) {
      const userData = userDoc.data();
      const userEmail = userData.email;
      
      // Get user's orders
      const userOrders = ordersByUser.get(userEmail) || [];
      
      // Calculate metrics from orders
      let totalSales = 0;
      let actualizedSales = 0;
      let totalMargin = 0;
      let actualizedMargin = 0;
      
      userOrders.forEach(order => {
        // Use INR equivalent amounts for foreign currency orders
        const isForeignCurrency = order.payment_currency && order.payment_currency !== 'INR';
        const orderAmount = parseFloat(order.final_amount_inr || order.total_amount || 0);
        
        if (isForeignCurrency && userOrders.indexOf(order) < 3) {
          console.log(`💱 Foreign currency order detected:`, {
            currency: order.payment_currency,
            originalAmount: order.total_amount,
            inrAmount: order.final_amount_inr,
            exchangeRate: order.exchange_rate
          });
        }
        
        // New margin calculation:
        // Selling Price = total_amount for INR, inr_equivalent for other currencies
        // Buying Price = calculated from inventory based on allocations + buying_price_inclusions
        const sellingPrice = order.payment_currency === 'INR' 
          ? parseFloat(order.total_amount || 0)
          : parseFloat(order.inr_equivalent || 0);
        
        // Calculate buying price from allocations and inventory
        let buyingPriceTickets = 0;
        const orderAllocations = allocationsByOrderId.get(order.id) || 
                                allocationsByOrderId.get(order.order_number) || 
                                (order.allocation_ids ? order.allocation_ids.flatMap(aid => 
                                  Array.from(allocationsSnapshot.docs)
                                    .filter(doc => doc.id === aid)
                                    .map(doc => ({ id: doc.id, ...doc.data() }))
                                ) : []);
        
        orderAllocations.forEach(allocation => {
          const inventory = inventoryMap.get(allocation.inventory_id);
          if (inventory) {
            const allocatedQty = allocation.tickets_allocated || allocation.quantity || 0;
            let buyingPricePerTicket = 0;
            
            // Get buying price from inventory categories
            if (inventory.categories && Array.isArray(inventory.categories)) {
              const categoryName = allocation.category_name || allocation.category || '';
              const category = inventory.categories.find(cat => cat.name === categoryName);
              if (category) {
                buyingPricePerTicket = parseFloat(category.buying_price) || 0;
              }
            } else if (inventory.buying_price) {
              // Fallback to legacy inventory structure
              buyingPricePerTicket = parseFloat(inventory.buying_price) || 0;
            }
            
            buyingPriceTickets += buyingPricePerTicket * allocatedQty;
          }
        });
        
        const buyingPriceInclusions = parseFloat(order.buying_price_inclusions || 0);
        const totalBuyingPrice = buyingPriceTickets + buyingPriceInclusions;
        
        // Calculate margin
        const margin = sellingPrice - totalBuyingPrice;
        
        // Calculate margin percentage (avoid division by zero)
        const marginPercentage = sellingPrice > 0 ? (margin / sellingPrice) * 100 : 0;
        
        // Debug logging for first 5 orders
        if (userOrders.indexOf(order) < 5) {
          console.log(`📊 DEBUG Order for ${userData.name}:`, {
            orderId: order.id || 'N/A',
            customer: order.customer_name || 'N/A',
            currency: order.payment_currency || 'INR',
            exchangeRate: order.exchange_rate || 1,
            totalAmount: orderAmount,
            originalAmount: order.total_amount || 0,
            finalAmountINR: order.final_amount_inr || 'N/A',
            baseAmount: order.base_amount || 0,
            inrEquivalent: order.inr_equivalent || 'N/A',
            sellingPrice: sellingPrice,
            buyingPriceTickets: buyingPriceTickets,
            buyingPriceInclusions: buyingPriceInclusions,
            totalBuyingPrice: totalBuyingPrice,
            calculatedMargin: margin,
            marginPercentage: marginPercentage.toFixed(2) + '%',
            hasBuyingPrice: buyingPriceTickets > 0
          });
        }
        
        totalSales += orderAmount;
        totalMargin += margin;
        
        // Check if event date has passed
        if (order.event_date) {
          const eventDate = new Date(order.event_date);
          if (eventDate < now) {
            actualizedSales += orderAmount;  // orderAmount already uses INR equivalent
            actualizedMargin += margin;
          }
        }
      });
      
      // Get user's leads for pipeline
      const userLeads = leadsByUser.get(userEmail) || [];
      
      let salesPersonPipeline = 0;
      let retailPipeline = 0;
      let corporatePipeline = 0;
      
      userLeads.forEach(lead => {
        const potentialValue = parseFloat(lead.potential_value || 0);
        const status = (lead.status || '').toLowerCase();
        const temperature = (lead.temperature || '').toLowerCase();
        
        // Only include in pipeline if status is hot/warm/cold OR quote statuses with temperature
        // This matches the dashboard pipeline logic
        if (status === 'hot' || status === 'warm' || status === 'cold' ||
            ((status === 'quote_requested' || status === 'quote_received') && 
             (temperature === 'hot' || temperature === 'warm' || temperature === 'cold'))) {
          
          // Check business_type for leads (B2B/B2C)
          if (lead.business_type === 'B2C') {
            retailPipeline += potentialValue;
          } else if (lead.business_type === 'B2B') {
            corporatePipeline += potentialValue;
          } else {
            // If business_type is not set, default to retail
            retailPipeline += potentialValue;
          }
        }
      });
      
      const overallPipeline = salesPersonPipeline + retailPipeline + corporatePipeline;
      
      // Get target
      let target = userData.sales_target || 0;
      try {
        const targetDoc = await db.collection('sales_targets').doc(userDoc.id).get();
        if (targetDoc.exists) {
          target = targetDoc.data().target;
        }
      } catch (err) {
        // Use default
      }
      
      // Calculate margin percentages
      const marginPercentage = totalSales > 0 ? (totalMargin / totalSales) * 100 : 0;
      const actualizedMarginPercentage = actualizedSales > 0 ? (actualizedMargin / actualizedSales) * 100 : 0;
      
      salesTeam.push({
        id: userDoc.id,
        name: userData.name,
        email: userEmail,
        target: target / 10000000, // Convert to Crores
        totalSales: totalSales / 10000000,
        actualizedSales: actualizedSales / 10000000,
        totalMargin: totalMargin / 10000000,
        actualizedMargin: actualizedMargin / 10000000,
        marginPercentage: marginPercentage,
        actualizedMarginPercentage: actualizedMarginPercentage,
        salesPersonPipeline: salesPersonPipeline / 10000000,
        retailPipeline: retailPipeline / 10000000,
        corporatePipeline: corporatePipeline / 10000000,
        overallPipeline: overallPipeline / 10000000
      });
    }
    
    const endTime = Date.now();
    console.log(`Performance API took ${endTime - startTime}ms`);
    
    // Debug: Log summary of buying price issues
    let ordersWithBuyingPrice = 0;
    let ordersWithoutBuyingPrice = 0;
    let totalOrdersProcessed = 0;
    
    ordersByUser.forEach((orders, userEmail) => {
      orders.forEach(order => {
        totalOrdersProcessed++;
        if (parseFloat(order.buying_price || 0) > 0) {
          ordersWithBuyingPrice++;
        } else {
          ordersWithoutBuyingPrice++;
        }
      });
    });
    
    console.log('\n📊 BUYING PRICE SUMMARY:');
    console.log(`Total orders processed: ${totalOrdersProcessed}`);
    console.log(`Orders WITH buying_price: ${ordersWithBuyingPrice} (${((ordersWithBuyingPrice / totalOrdersProcessed) * 100).toFixed(1)}%)`);
    console.log(`Orders WITHOUT buying_price: ${ordersWithoutBuyingPrice} (${((ordersWithoutBuyingPrice / totalOrdersProcessed) * 100).toFixed(1)}%)`);
    console.log('This is why margin equals sales for many users!\n');
    
    // Update cache for this period
    performanceCache[cacheKey] = salesTeam;
    performanceCache[`${cacheKey}_timestamp`] = Date.now();
    
    res.json({
      success: true,
      salesTeam: salesTeam,
      period: period,
      responseTime: endTime - startTime,
      cached: false
    });
    
  } catch (error) {
    console.error('❌ Sales performance error:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

// GET retail tracker data - SHOWS ONLY MEMBERS IN retail_tracker_members
router.get('/retail-tracker', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    // Check cache for this specific date range
    const cacheKey = getRetailCacheKey(start_date, end_date);
    const cachedEntry = performanceCache.retailData.get(cacheKey);
    
    if (cachedEntry && isCacheValid(cachedEntry.timestamp)) {
      // console.log('📊 Returning cached retail tracker data for range:', cacheKey);
      return res.json({
        success: true,
        retailData: cachedEntry.data,
        totalSystemLeads: cachedEntry.totalSystemLeads || 0,
        totalSystemLeadsInDateRange: cachedEntry.totalSystemLeadsInDateRange || 0,
        cached: true,
        cacheAge: Math.round((Date.now() - cachedEntry.timestamp) / 1000 / 60) + ' minutes'
      });
    }
    
    console.log('📊 Cache expired or not found for retail range:', cacheKey);
    const startTime = Date.now();
    
    // Get retail tracker members first
    const retailMembersSnapshot = await db.collection('retail_tracker_members').get();
    const retailMemberIds = new Set();
    retailMembersSnapshot.forEach(doc => {
      retailMemberIds.add(doc.id);
    });
    
    // Get ALL users and filter to only those in retail_tracker_members
    const allUsersSnapshot = await db.collection('crm_users').get();
    
    // Filter to only users who are in retail_tracker_members
    const allRetailDocs = allUsersSnapshot.docs.filter(doc => {
      return retailMemberIds.has(doc.id);
    });
    
    // Get total system leads count (matching dashboard logic)
    let totalSystemLeads = 0;
    let totalSystemLeadsInDateRange = 0;
    
    try {
      const allLeadsSnapshot = await db.collection(collections.leads).get();
      totalSystemLeads = allLeadsSnapshot.size;
      console.log(`📊 Sales Performance - Total system leads: ${totalSystemLeads}`);
      
      // Debug: Check for leads without created_date
      let leadsWithoutDate = 0;
      allLeadsSnapshot.docs.forEach(doc => {
        const lead = doc.data();
        if (!lead.created_date) {
          leadsWithoutDate++;
        }
      });
      console.log(`📊 Leads without created_date: ${leadsWithoutDate}`);
      
      // If date range is provided, count leads in that range
      if (start_date && end_date) {
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        endDate.setHours(23, 59, 59, 999);
        
        totalSystemLeadsInDateRange = allLeadsSnapshot.docs.filter(doc => {
          const lead = doc.data();
          if (lead.created_date) {
            const createdDate = new Date(lead.created_date);
            return createdDate >= startDate && createdDate <= endDate;
          }
          return false; // Exclude leads without created_date from date range filtering
        }).length;
      }
    } catch (error) {
      console.error('Error counting total system leads:', error);
    }
    
    const retailData = [];
    
    for (const userDoc of allRetailDocs) {
      const userData = userDoc.data();
      const userEmail = userData.email;
      
      // Get ALL leads for this user first (no date filter in query)
      const allLeadsSnapshot = await db.collection(collections.leads)
        .where('assigned_to', '==', userEmail)
        .get();
      
      // Filter by date in memory if dates provided
      let leadsToProcess = allLeadsSnapshot.docs;
      
      if (start_date && end_date) {
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        endDate.setHours(23, 59, 59, 999); // Include full end date
        
        leadsToProcess = allLeadsSnapshot.docs.filter(doc => {
          const lead = doc.data();
          if (lead.created_date) {
            const createdDate = new Date(lead.created_date);
            return createdDate >= startDate && createdDate <= endDate;
          }
          return false;
        });
      }
      
      // Calculate metrics
      const metrics = {
        assigned: leadsToProcess.length,
        touchbased: 0,
        qualified: 0,
        hotWarm: 0,
        converted: 0,
        notTouchbased: 0
      };
      
      leadsToProcess.forEach(doc => {
        const lead = doc.data();
        
        // Touch-based: lead status is in touchBasedStatuses array
        if (touchBasedStatuses.includes(lead.status)) {
          metrics.touchbased++;
        } else {
          metrics.notTouchbased++;
        }
        
        // Qualified: includes qualified, temperature statuses, quote statuses, converted, and dropped
        if (['qualified', 'hot', 'warm', 'cold', 'pickup_later', 'quote_requested', 'quote_received', 'converted', 'invoiced', 'payment_received', 'payment_post_service', 'dropped'].includes(lead.status)) {
          metrics.qualified++;
        }
        
        // Hot/Warm: New unified logic
        // Count if status is hot/warm OR (status is quote_requested/quote_received AND temperature is hot/warm)
        const status = (lead.status || '').toLowerCase();
        const temperature = (lead.temperature || '').toLowerCase();
        
        if (status === 'hot' || status === 'warm' ||
            ((status === 'quote_requested' || status === 'quote_received') && 
             (temperature === 'hot' || temperature === 'warm'))) {
          metrics.hotWarm++;
        }
        
        // Converted: includes converted and all payment statuses
        if (['converted', 'invoiced', 'payment_received', 'payment_post_service'].includes(lead.status)) {
          metrics.converted++;
        }
      });
      
      retailData.push({
        id: userDoc.id,
        salesMember: userData.name,
        ...metrics
      });
    }
    
    const endTime = Date.now();
    console.log(`Retail tracker API took ${endTime - startTime}ms`);
    
    // Update cache for this date range
    performanceCache.retailData.set(cacheKey, {
      data: retailData,
      totalSystemLeads: totalSystemLeads,
      totalSystemLeadsInDateRange: start_date && end_date ? totalSystemLeadsInDateRange : totalSystemLeads,
      timestamp: Date.now()
    });
    
    // Clean up old cache entries (keep max 10 different date ranges)
    if (performanceCache.retailData.size > 10) {
      const oldestKey = performanceCache.retailData.keys().next().value;
      performanceCache.retailData.delete(oldestKey);
    }
    
    res.json({
      success: true,
      retailData: retailData,
      totalSystemLeads: totalSystemLeads,
      totalSystemLeadsInDateRange: start_date && end_date ? totalSystemLeadsInDateRange : totalSystemLeads,
      responseTime: endTime - startTime,
      cached: false
    });
    
  } catch (error) {
    console.error('❌ Retail tracker error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

// Get ALL users lead counts (not just retail)
router.get('/all-users-leads', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Fetching all users lead counts...');
    
    // Get all users
    const usersSnapshot = await db.collection('crm_users').get();
    const allUsers = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      allUsers.push({
        id: doc.id,
        name: userData.name,
        email: userData.email,
        department: userData.department || 'Not Set',
        role: userData.role
      });
    });
    
    // Get all leads
    const leadsSnapshot = await db.collection(collections.leads).get();
    
    // Count leads per user
    const userLeadCounts = {};
    let unassignedCount = 0;
    
    leadsSnapshot.forEach(doc => {
      const lead = doc.data();
      const assignedTo = lead.assigned_to;
      
      if (!assignedTo) {
        unassignedCount++;
      } else {
        if (!userLeadCounts[assignedTo]) {
          userLeadCounts[assignedTo] = 0;
        }
        userLeadCounts[assignedTo]++;
      }
    });
    
    // Build result with user details
    const result = allUsers.map(user => ({
      ...user,
      leadCount: userLeadCounts[user.email] || 0
    })).filter(user => user.leadCount > 0);
    
    // Sort by lead count descending
    result.sort((a, b) => b.leadCount - a.leadCount);
    
    res.json({
      success: true,
      totalLeads: leadsSnapshot.size,
      assignedLeads: leadsSnapshot.size - unassignedCount,
      unassignedLeads: unassignedCount,
      userCounts: result,
      summary: {
        totalUsers: allUsers.length,
        usersWithLeads: result.length,
        retailUsers: allUsers.filter(u => u.department === 'retail').length
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching all users leads:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

// UPDATE sales target
router.put('/target/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { target } = req.body;
    
    // Save to both user document and separate targets collection
    await db.collection('sales_targets').doc(userId).set({
      target: target * 10000000, // Convert from Crores to actual value
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.email
    });
    
    // Also update in user document if it exists
    await db.collection('crm_users').doc(userId).update({
      sales_target: target * 10000000
    }).catch(() => {
      // Ignore error if user doesn't have this field
    });
    
    // Invalidate cache when targets are updated
    performanceCache.salesData = null;
    performanceCache.salesDataTimestamp = null;
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Update target error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ADD sales team member manually
router.post('/add-member', authenticateToken, async (req, res) => {
  try {
    const { userId, type } = req.body;
    
    if (type === 'sales') {
      // Add to sales_performance_members collection
      await db.collection('sales_performance_members').doc(userId).set({
        userId: userId,
        type: 'sales',
        addedAt: new Date().toISOString(),
        addedBy: req.user.email
      });
      
      // Invalidate sales cache
      performanceCache.salesData = null;
      performanceCache.salesDataTimestamp = null;
    } else if (type === 'retail') {
      // Add to retail_tracker_members collection
      await db.collection('retail_tracker_members').doc(userId).set({
        userId: userId,
        type: 'retail',
        addedAt: new Date().toISOString(),
        addedBy: req.user.email
      });
      
      // Invalidate retail cache
      performanceCache.retailData.clear();
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Add member error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// REMOVE member
router.delete('/remove-member/:userId/:type', authenticateToken, async (req, res) => {
  try {
    const { userId, type } = req.params;
    
    if (type === 'sales') {
      await db.collection('sales_performance_members').doc(userId).delete();
      
      // Invalidate sales cache
      performanceCache.salesData = null;
      performanceCache.salesDataTimestamp = null;
    } else if (type === 'retail') {
      await db.collection('retail_tracker_members').doc(userId).delete();
      
      // Invalidate retail cache
      performanceCache.retailData.clear();
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Remove member error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Clear cache endpoint (for admin use)
router.post('/clear-cache', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can clear cache' });
    }
    
    performanceCache.salesData = null;
    performanceCache.salesDataTimestamp = null;
    performanceCache.retailData.clear();
    
    console.log('🧹 Sales performance cache cleared');
    
    res.json({ 
      success: true, 
      message: 'Cache cleared successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get cache status endpoint
router.get('/cache-status', authenticateToken, async (req, res) => {
  try {
    const salesCacheAge = performanceCache.salesDataTimestamp 
      ? Math.round((Date.now() - performanceCache.salesDataTimestamp) / 1000 / 60)
      : null;
    
    res.json({
      salesData: {
        cached: isCacheValid(performanceCache.salesDataTimestamp),
        age: salesCacheAge ? `${salesCacheAge} minutes` : 'Not cached',
        expiresIn: salesCacheAge ? `${360 - salesCacheAge} minutes` : 'N/A'
      },
      retailData: {
        entries: performanceCache.retailData.size,
        ranges: Array.from(performanceCache.retailData.keys())
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TEMPORARY: Update all orders with sales_person field
router.post('/update-sales-person-field', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const ordersSnapshot = await db.collection(collections.orders).get();
    console.log(`Found ${ordersSnapshot.size} orders to process`);
    
    let updated = 0;
    let skipped = 0;
    
    const financeTeam = ['jaya@fantopark.com', 'rishabh@fantopark.com'];
    
    for (const doc of ordersSnapshot.docs) {
      const order = doc.data();
      
      if (order.sales_person) {
        skipped++;
        continue;
      }
      
      let salesPerson = null;
      
      if (order.created_by) {
        salesPerson = order.created_by;
      } else if (order.assigned_to && !financeTeam.includes(order.assigned_to)) {
        salesPerson = order.assigned_to;
      }
      
      if (salesPerson) {
        await db.collection(collections.orders).doc(doc.id).update({
          sales_person: salesPerson
        });
        updated++;
        console.log(`Updated order ${doc.id} with sales_person: ${salesPerson}`);
      }
    }
    
    res.json({
      success: true,
      message: `Updated ${updated} orders, skipped ${skipped}`,
      details: {
        updated,
        skipped,
        total: ordersSnapshot.size
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET available periods for filtering
router.get('/periods', authenticateToken, async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const currentFY = currentMonth >= 3 ? currentYear : currentYear - 1;
    
    res.json({
      success: true,
      periods: [
        { value: 'lifetime', label: 'Lifetime', default: true },
        { value: 'current_fy', label: `FY ${currentFY}-${(currentFY + 1).toString().substr(-2)}` },
        { value: 'previous_fy', label: `FY ${currentFY - 1}-${currentFY.toString().substr(-2)}` },
        { value: 'current_quarter', label: 'Current Quarter' },
        { value: 'previous_quarter', label: 'Previous Quarter' },
        { value: 'last_6_months', label: 'Last 6 Months' },
        { value: 'last_3_months', label: 'Last 3 Months' }
      ]
    });
  } catch (error) {
    console.error('Error fetching periods:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear cache endpoint - for super admin only
router.post('/clear-cache', authenticateToken, async (req, res) => {
  try {
    // Check if user is super admin
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    // Decode token to get user info
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(token);
    const userEmail = decoded?.email;

    if (!userEmail) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    // Check if user is super admin
    const userDoc = await db.collection('crm_users').where('email', '==', userEmail).get();
    if (userDoc.empty) {
      return res.status(403).json({ success: false, error: 'User not found' });
    }

    const userData = userDoc.docs[0].data();
    if (userData.role !== 'super_admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Super admin role required.' });
    }

    // Clear all cache data
    const clearedCaches = [];
    
    // Get all current cache keys before clearing
    const cacheKeysBefore = Object.keys(performanceCache);
    console.log('📊 Cache keys before clearing:', cacheKeysBefore);
    
    // Clear ALL sales performance caches (more aggressive)
    Object.keys(performanceCache).forEach(key => {
      if (key.startsWith('sales_') || key === 'salesData' || key === 'salesDataTimestamp') {
        const oldValue = performanceCache[key];
        delete performanceCache[key];
        if (oldValue) {
          clearedCaches.push(key);
        }
      }
    });
    
    // Force clear legacy cache
    performanceCache.salesData = null;
    performanceCache.salesDataTimestamp = null;
    
    // Clear retail data cache
    const retailSize = performanceCache.retailData.size;
    performanceCache.retailData.clear();
    if (retailSize > 0) {
      clearedCaches.push(`retailData(${retailSize} entries)`);
    }
    
    // Add a cache invalidation flag to prevent immediate repopulation
    performanceCache.clearingInProgress = true;
    setTimeout(() => {
      delete performanceCache.clearingInProgress;
    }, 2000); // 2 second delay to prevent immediate cache repopulation
    
    console.log(`🧹 Cache cleared by super admin: ${userEmail}`);
    console.log(`🧹 Cleared cache keys: ${clearedCaches.join(', ')}`);

    res.json({
      success: true,
      message: 'All sales performance caches cleared successfully',
      clearedCaches: clearedCaches,
      clearedBy: userEmail,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
