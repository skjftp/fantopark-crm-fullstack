// Enhanced Margin Calculation Based on Orders and Allocations
// Formula: Margin = (Selling Price - Buying Price) / Selling Price * 100

window.calculateOrderBasedMargin = async () => {
  try {
    console.log('🔢 Calculating margin from orders and allocations...');
    
    const financialData = window.appState?.financialData || {};
    const allSales = financialData.allSales || [];
    const inventory = window.inventory || [];
    
    if (allSales.length === 0) {
      console.log('⚠️ No sales data available for margin calculation');
      return { totalMargin: 0, marginPercentage: 0, totalSellingPrice: 0, totalBuyingPrice: 0, processedOrders: 0 };
    }
    
    // Get allocations data
    let allocations = [];
    try {
      const allocationsRes = await fetch(`${window.API_URL}/bulk-allocations/download`, {
        headers: { 'Authorization': `Bearer ${window.authToken}` }
      });
      const allocationsText = await allocationsRes.text();
      const allocationLines = allocationsText.split('\n').slice(1); // Skip header
      
      allocations = allocationLines
        .filter(line => line.trim())
        .map(line => {
          const parts = line.split(',');
          return {
            allocation_id: parts[0],
            event_name: parts[1],
            lead_name: parts[2],
            lead_id: parts[3],
            tickets_allocated: parseInt(parts[4]) || 0,
            category_name: parts[5],
            stand_section: parts[6],
            order_ids: parts[7] ? parts[7].split(';').map(id => id.trim()).filter(id => id) : [],
            price_per_ticket: parseFloat(parts[11]) || 0,
            total_value: parseFloat(parts[12]) || 0
          };
        });
    } catch (error) {
      console.error('❌ Error fetching allocations:', error);
    }
    
    console.log(`📊 Processing ${allSales.length} orders and ${allocations.length} allocations`);
    
    let totalSellingPrice = 0;
    let totalBuyingPrice = 0;
    let processedOrders = 0;
    
    // Process each order
    allSales.forEach(order => {
      // Find allocations for this order
      const orderAllocations = allocations.filter(allocation => 
        allocation.order_ids.includes(order.id) || 
        allocation.order_ids.includes(order.order_number) ||
        allocation.lead_id === order.lead_id // Fallback match by lead
      );
      
      if (orderAllocations.length > 0) {
        // Get order selling price (amount without GST/TCS, in INR)
        let orderSellingPrice = 0;
        
        // For foreign currency orders, prioritize INR equivalents
        if (order.payment_currency && order.payment_currency !== 'INR') {
          // Foreign currency order - use INR equivalents
          if (order.base_amount && order.exchange_rate) {
            orderSellingPrice = parseFloat(order.base_amount) * parseFloat(order.exchange_rate);
          } else if (order.final_amount_inr && order.gst_amount_inr && order.tcs_amount_inr) {
            // Calculate base amount from final amount INR
            orderSellingPrice = parseFloat(order.final_amount_inr) - parseFloat(order.gst_amount_inr || 0) - parseFloat(order.tcs_amount_inr || 0);
          } else if (order.final_amount_inr) {
            orderSellingPrice = parseFloat(order.final_amount_inr);
          }
        } else {
          // INR order - use base amount directly
          if (order.base_amount) {
            orderSellingPrice = parseFloat(order.base_amount);
          } else if (order.final_amount && order.gst_amount && order.tcs_amount) {
            // Calculate base amount from final amount
            orderSellingPrice = parseFloat(order.final_amount) - parseFloat(order.gst_amount || 0) - parseFloat(order.tcs_amount || 0);
          } else if (order.final_amount_inr) {
            orderSellingPrice = parseFloat(order.final_amount_inr);
          } else if (order.final_amount) {
            orderSellingPrice = parseFloat(order.final_amount);
          }
        }
        
        // Calculate buying price from allocations and inventory
        let orderBuyingPrice = 0;
        
        orderAllocations.forEach(allocation => {
          // Find inventory item for this allocation
          const inventoryItem = inventory.find(item => 
            item.event_name === allocation.event_name
          );
          
          if (inventoryItem) {
            let buyingPrice = 0;
            
            // Check if allocation has specific category
            if (allocation.category_name && inventoryItem.categories) {
              const category = inventoryItem.categories.find(cat => 
                cat.name === allocation.category_name && 
                (!allocation.stand_section || cat.section === allocation.stand_section)
              );
              
              if (category) {
                // Prioritize INR buying price, then convert if needed
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
            
            orderBuyingPrice += allocation.tickets_allocated * buyingPrice;
          } else {
            console.log(`⚠️ No inventory found for allocation: ${allocation.event_name}`);
          }
        });
        
        totalSellingPrice += orderSellingPrice;
        totalBuyingPrice += orderBuyingPrice;
        processedOrders++;
        
        // Debug log for first few orders
        if (processedOrders <= 3) {
          console.log(`📋 Order ${order.order_number}:`, {
            currency: order.payment_currency || 'INR',
            baseAmount: order.base_amount,
            finalAmountInr: order.final_amount_inr,
            sellingPrice: orderSellingPrice,
            buyingPrice: orderBuyingPrice,
            allocations: orderAllocations.length,
            margin: orderSellingPrice - orderBuyingPrice,
            marginPercent: orderSellingPrice > 0 ? ((orderSellingPrice - orderBuyingPrice) / orderSellingPrice * 100).toFixed(2) + '%' : '0%'
          });
        }
      }
    });
    
    const totalMargin = totalSellingPrice - totalBuyingPrice;
    const marginPercentage = totalSellingPrice > 0 ? (totalMargin / totalSellingPrice * 100) : 0;
    
    console.log('💰 Order-based Margin Results:', {
      processedOrders,
      totalOrders: allSales.length,
      totalSellingPrice: `₹${totalSellingPrice.toLocaleString()}`,
      totalBuyingPrice: `₹${totalBuyingPrice.toLocaleString()}`,
      totalMargin: `₹${totalMargin.toLocaleString()}`,
      marginPercentage: `${marginPercentage.toFixed(2)}%`
    });
    
    return {
      totalMargin,
      marginPercentage: Math.round(marginPercentage * 100) / 100,
      totalSellingPrice,
      totalBuyingPrice,
      processedOrders
    };
    
  } catch (error) {
    console.error('❌ Error calculating order-based margin:', error);
    return {
      totalMargin: 0,
      marginPercentage: 0,
      totalSellingPrice: 0,
      totalBuyingPrice: 0,
      processedOrders: 0
    };
  }
};

console.log('✅ Order-based Margin Calculation loaded');