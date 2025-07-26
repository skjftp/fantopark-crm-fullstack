const { db, collections } = require('../config/db');
const { convertToIST } = require('../utils/dateHelpers');

/**
 * Stats Aggregation Service
 * Calculates and stores all performance metrics in a single collection
 * Used by: Financials, Sales Performance, Marketing Performance
 */

class StatsAggregationService {
  constructor() {
    this.statsCollection = 'crm_performance_stats';
  }

  /**
   * Main aggregation function - calculates all stats
   */
  async aggregateAllStats() {
    console.log('🔄 Starting stats aggregation...');
    const startTime = Date.now();
    
    try {
      // Get all required data
      const [
        ordersSnapshot,
        leadsSnapshot,
        allocationsSnapshot,
        inventorySnapshot,
        usersSnapshot,
        salesMembersSnapshot,
        retailMembersSnapshot,
        receivablesSnapshot,
        payablesSnapshot
      ] = await Promise.all([
        db.collection(collections.orders).get(),
        db.collection(collections.leads).get(),
        db.collection(collections.allocations).get(),
        db.collection(collections.inventory).get(),
        db.collection('crm_users').get(),
        db.collection('sales_performance_members').get(),
        db.collection('retail_tracker_members').get(),
        db.collection(collections.receivables).get(),
        db.collection(collections.payables).get()
      ]);

      console.log(`📊 Loaded data: ${ordersSnapshot.size} orders, ${leadsSnapshot.size} leads, ${allocationsSnapshot.size} allocations`);

      // Process data
      const stats = {
        timestamp: new Date().toISOString(),
        lastUpdated: convertToIST(new Date()),
        
        // Global financials
        financials: await this.calculateFinancials(ordersSnapshot, receivablesSnapshot, payablesSnapshot, allocationsSnapshot),
        
        // Sales performance by user
        salesPerformance: await this.calculateSalesPerformance(
          ordersSnapshot, 
          leadsSnapshot, 
          allocationsSnapshot, 
          usersSnapshot, 
          salesMembersSnapshot
        ),
        
        // Retail tracker stats
        retailTracker: await this.calculateRetailTracker(
          leadsSnapshot, 
          usersSnapshot, 
          retailMembersSnapshot
        ),
        
        // Marketing performance
        marketingPerformance: await this.calculateMarketingPerformance(leadsSnapshot),
        
        // Metadata
        metadata: {
          processingTimeMs: Date.now() - startTime,
          dataSourceCounts: {
            orders: ordersSnapshot.size,
            leads: leadsSnapshot.size,
            allocations: allocationsSnapshot.size,
            users: usersSnapshot.size
          }
        }
      };

      // Store aggregated stats
      await this.storeStats(stats);
      
      console.log(`✅ Stats aggregation completed in ${Date.now() - startTime}ms`);
      return stats;
      
    } catch (error) {
      console.error('❌ Stats aggregation error:', error);
      throw error;
    }
  }

  /**
   * Calculate financial metrics for different periods
   */
  async calculateFinancials(ordersSnapshot, receivablesSnapshot, payablesSnapshot, allocationsSnapshot) {
    const periods = ['lifetime', 'current_fy', 'current_month', 'last_month'];
    const financials = {};
    
    // Create allocation map for quick lookup
    const allocationsByOrderId = new Map();
    allocationsSnapshot.forEach(doc => {
      const allocation = doc.data();
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

    // Calculate receivables and payables totals
    const totalReceivables = receivablesSnapshot.docs.reduce((sum, doc) => {
      const data = doc.data();
      return sum + (parseFloat(data.amount) || 0);
    }, 0);

    const totalPayables = payablesSnapshot.docs.reduce((sum, doc) => {
      const data = doc.data();
      return sum + (parseFloat(data.amount) || 0);
    }, 0);

    // Calculate for each period
    for (const period of periods) {
      const dateRange = this.getDateRange(period);
      let filteredOrders = ordersSnapshot.docs;
      
      // Filter orders by event_date for the period
      if (dateRange.startDate) {
        filteredOrders = filteredOrders.filter(doc => {
          const order = doc.data();
          if (!order.event_date) return period === 'lifetime';
          const eventDate = new Date(order.event_date);
          return eventDate >= dateRange.startDate && 
                 (!dateRange.endDate || eventDate <= dateRange.endDate);
        });
      }

      // Calculate metrics
      let totalSales = 0;
      let totalMargin = 0;
      let activeSales = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filteredOrders.forEach(orderDoc => {
        const order = orderDoc.data();
        
        // Calculate sales amount
        const salesAmount = order.payment_currency === 'INR'
          ? parseFloat(order.base_amount || order.total_amount || 0)
          : parseFloat(order.base_amount || 0) * parseFloat(order.exchange_rate || 1);
        
        totalSales += salesAmount;

        // Calculate buying price from allocations
        let totalBuyingPrice = 0;
        const orderAllocations = allocationsByOrderId.get(orderDoc.id) || [];
        
        orderAllocations.forEach(allocation => {
          totalBuyingPrice += parseFloat(allocation.total_buying_price || 0);
        });
        
        // Add buying_price_inclusions
        totalBuyingPrice += parseFloat(order.buying_price_inclusions || 0);
        
        // Calculate margin
        const margin = salesAmount - totalBuyingPrice;
        totalMargin += margin;

        // Check if it's active sale (future event)
        if (!order.event_date || new Date(order.event_date) >= today) {
          if (!['cancelled', 'rejected', 'refunded'].includes(order.status)) {
            activeSales += salesAmount;
          }
        }
      });

      financials[period] = {
        totalSales,
        activeSales,
        totalReceivables,
        totalPayables,
        totalMargin,
        marginPercentage: totalSales > 0 ? (totalMargin / totalSales * 100) : 0,
        orderCount: filteredOrders.length
      };
    }

    return financials;
  }

  /**
   * Calculate sales performance metrics by user
   */
  async calculateSalesPerformance(ordersSnapshot, leadsSnapshot, allocationsSnapshot, usersSnapshot, salesMembersSnapshot) {
    const salesMemberIds = new Set();
    const salesMemberTargets = new Map();
    
    // Get member IDs and targets
    salesMembersSnapshot.forEach(doc => {
      salesMemberIds.add(doc.id);
      const data = doc.data();
      if (data.target !== undefined) {
        salesMemberTargets.set(doc.id, data.target);
      }
    });
    
    // Filter to only sales team members
    const salesUsers = usersSnapshot.docs.filter(doc => salesMemberIds.has(doc.id));
    
    // Create name to email mapping
    const nameToEmail = new Map();
    salesUsers.forEach(doc => {
      const userData = doc.data();
      nameToEmail.set(userData.name, userData.email);
    });

    // Create allocation map
    const allocationsByOrderId = new Map();
    allocationsSnapshot.forEach(doc => {
      const allocation = doc.data();
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

    // Process each sales user
    const salesPerformance = {};
    const periods = ['lifetime', 'current_fy', 'current_month', 'last_month'];

    for (const userDoc of salesUsers) {
      const userData = userDoc.data();
      const userEmail = userData.email;
      const userName = userData.name;
      
      salesPerformance[userEmail] = {
        id: userDoc.id,
        name: userName,
        email: userEmail,
        target: salesMemberTargets.get(userDoc.id) || 0,
        periods: {}
      };

      // Get user's leads for pipeline
      const userLeads = leadsSnapshot.docs.filter(doc => {
        const lead = doc.data();
        return lead.assigned_to === userEmail;
      });

      // Calculate pipeline values
      let retailPipeline = 0;
      let corporatePipeline = 0;
      
      userLeads.forEach(doc => {
        const lead = doc.data();
        const potentialValue = parseFloat(lead.potential_value || 0);
        const status = (lead.status || '').toLowerCase();
        const temperature = (lead.temperature || '').toLowerCase();
        
        if (status === 'hot' || status === 'warm' || status === 'cold' ||
            ((status === 'quote_requested' || status === 'quote_received') && 
             (temperature === 'hot' || temperature === 'warm' || temperature === 'cold'))) {
          
          if (lead.business_type === 'B2C') {
            retailPipeline += potentialValue;
          } else if (lead.business_type === 'B2B') {
            corporatePipeline += potentialValue;
          } else {
            retailPipeline += potentialValue;
          }
        }
      });

      // Get user's orders
      const userOrders = ordersSnapshot.docs.filter(doc => {
        const order = doc.data();
        const salesPerson = order.sales_person || order.sales_person_email;
        
        if (!salesPerson) return false;
        
        // Handle both name and email in sales_person field
        if (salesPerson.includes('@')) {
          return salesPerson === userEmail;
        } else {
          return salesPerson === userName;
        }
      });

      // Calculate metrics for each period
      for (const period of periods) {
        const dateRange = this.getDateRange(period);
        let periodOrders = userOrders;
        
        if (dateRange.startDate) {
          periodOrders = periodOrders.filter(doc => {
            const order = doc.data();
            if (!order.event_date) return period === 'lifetime';
            const eventDate = new Date(order.event_date);
            return eventDate >= dateRange.startDate && 
                   (!dateRange.endDate || eventDate <= dateRange.endDate);
          });
        }

        let totalSales = 0;
        let totalMargin = 0;
        let actualizedSales = 0;
        let actualizedMargin = 0;
        const now = new Date();

        periodOrders.forEach(orderDoc => {
          const order = orderDoc.data();
          
          const salesAmount = order.payment_currency === 'INR'
            ? parseFloat(order.base_amount || order.total_amount || 0)
            : parseFloat(order.base_amount || 0) * parseFloat(order.exchange_rate || 1);
          
          totalSales += salesAmount;

          // Calculate buying price
          let totalBuyingPrice = 0;
          const orderAllocations = allocationsByOrderId.get(orderDoc.id) || [];
          
          orderAllocations.forEach(allocation => {
            totalBuyingPrice += parseFloat(allocation.total_buying_price || 0);
          });
          
          totalBuyingPrice += parseFloat(order.buying_price_inclusions || 0);
          
          const margin = salesAmount - totalBuyingPrice;
          totalMargin += margin;

          // Check if actualized
          if (order.event_date && new Date(order.event_date) < now) {
            actualizedSales += salesAmount;
            actualizedMargin += margin;
          }
        });

        salesPerformance[userEmail].periods[period] = {
          totalSales,
          actualizedSales,
          totalMargin,
          actualizedMargin,
          marginPercentage: totalSales > 0 ? (totalMargin / totalSales * 100) : 0,
          actualizedMarginPercentage: actualizedSales > 0 ? (actualizedMargin / actualizedSales * 100) : 0,
          retailPipeline,
          corporatePipeline,
          overallPipeline: retailPipeline + corporatePipeline,
          orderCount: periodOrders.length
        };
      }
    }

    return salesPerformance;
  }

  /**
   * Calculate retail tracker metrics
   */
  async calculateRetailTracker(leadsSnapshot, usersSnapshot, retailMembersSnapshot) {
    const retailMemberIds = new Set();
    retailMembersSnapshot.forEach(doc => retailMemberIds.add(doc.id));
    
    const retailUsers = usersSnapshot.docs.filter(doc => retailMemberIds.has(doc.id));
    const retailTracker = {};

    const touchBasedStatuses = [
      'contacted', 'attempt_1', 'attempt_2', 'attempt_3',
      'qualified', 'unqualified', 'junk', 'warm', 'hot', 'cold',
      'interested', 'not_interested', 'on_hold', 'dropped',
      'converted', 'invoiced', 'payment_received', 'payment_post_service',
      'pickup_later', 'quote_requested', 'quote_received'
    ];

    for (const userDoc of retailUsers) {
      const userData = userDoc.data();
      const userEmail = userData.email;
      
      const userLeads = leadsSnapshot.docs.filter(doc => {
        const lead = doc.data();
        return lead.assigned_to === userEmail;
      });

      const metrics = {
        assigned: userLeads.length,
        touchbased: 0,
        qualified: 0,
        hotWarm: 0,
        converted: 0,
        notTouchbased: 0
      };

      userLeads.forEach(doc => {
        const lead = doc.data();
        
        if (touchBasedStatuses.includes(lead.status)) {
          metrics.touchbased++;
        } else {
          metrics.notTouchbased++;
        }
        
        if (['qualified', 'hot', 'warm', 'cold', 'pickup_later', 'quote_requested', 
             'quote_received', 'converted', 'invoiced', 'payment_received', 
             'payment_post_service', 'dropped'].includes(lead.status)) {
          metrics.qualified++;
        }
        
        const status = (lead.status || '').toLowerCase();
        const temperature = (lead.temperature || '').toLowerCase();
        
        if (status === 'hot' || status === 'warm' ||
            ((status === 'quote_requested' || status === 'quote_received') && 
             (temperature === 'hot' || temperature === 'warm'))) {
          metrics.hotWarm++;
        }
        
        if (['converted', 'invoiced', 'payment_received', 'payment_post_service'].includes(lead.status)) {
          metrics.converted++;
        }
      });

      retailTracker[userEmail] = {
        id: userDoc.id,
        name: userData.name,
        email: userEmail,
        ...metrics
      };
    }

    return retailTracker;
  }

  /**
   * Calculate marketing performance metrics
   */
  async calculateMarketingPerformance(leadsSnapshot) {
    const sources = {};
    const campaigns = {};
    
    leadsSnapshot.forEach(doc => {
      const lead = doc.data();
      const source = lead.source || 'Unknown';
      const campaign = lead.campaign_name || 'Direct';
      
      // By source
      if (!sources[source]) {
        sources[source] = {
          total: 0,
          qualified: 0,
          converted: 0,
          pipeline: 0
        };
      }
      
      sources[source].total++;
      
      if (['qualified', 'hot', 'warm', 'cold'].includes(lead.status)) {
        sources[source].qualified++;
        sources[source].pipeline += parseFloat(lead.potential_value || 0);
      }
      
      if (['converted', 'invoiced', 'payment_received'].includes(lead.status)) {
        sources[source].converted++;
      }
      
      // By campaign
      if (!campaigns[campaign]) {
        campaigns[campaign] = {
          total: 0,
          qualified: 0,
          converted: 0,
          pipeline: 0
        };
      }
      
      campaigns[campaign].total++;
      
      if (['qualified', 'hot', 'warm', 'cold'].includes(lead.status)) {
        campaigns[campaign].qualified++;
        campaigns[campaign].pipeline += parseFloat(lead.potential_value || 0);
      }
      
      if (['converted', 'invoiced', 'payment_received'].includes(lead.status)) {
        campaigns[campaign].converted++;
      }
    });

    return { sources, campaigns };
  }

  /**
   * Get date range for a period
   */
  getDateRange(period) {
    const now = new Date();
    let startDate = null;
    let endDate = null;
    
    switch(period) {
      case 'current_fy':
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const fyYear = currentMonth >= 3 ? currentYear : currentYear - 1;
        startDate = new Date(fyYear, 3, 1);
        break;
        
      case 'current_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
        
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
        
      case 'lifetime':
      default:
        return { startDate: null, endDate: null };
    }
    
    return { startDate, endDate: endDate || now };
  }

  /**
   * Store aggregated stats in Firestore
   */
  async storeStats(stats) {
    const docId = 'latest'; // Always update the same document
    
    await db.collection(this.statsCollection).doc(docId).set(stats);
    
    // Also store a historical record
    const historyId = `history_${Date.now()}`;
    await db.collection(`${this.statsCollection}_history`).doc(historyId).set({
      ...stats,
      docId: historyId
    });
    
    console.log(`📊 Stats stored in ${this.statsCollection}/latest`);
  }
}

module.exports = new StatsAggregationService();