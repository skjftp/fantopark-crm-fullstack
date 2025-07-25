// Enhanced Financial System with Multi-Currency INR Support
// This updates the financial calculations to use INR values

// Enhanced fetch financial data with INR support
window.fetchFinancialDataWithINR = async () => {
  try {
    window.setLoading(true);
    console.log('Fetching financial data with INR support...');

    // Fetch all required data
    const [inventoryRes, ordersRes, receivablesRes, payablesRes] = await Promise.all([
      window.apiCall('/inventory'),
      window.apiCall('/orders'),
      window.apiCall('/receivables'),
      window.apiCall('/payables')
    ]);

    // Process inventory with INR values
    const inventoryData = inventoryRes.data || [];
    console.log('Inventory data:', inventoryData);

    // Process orders with INR values
    const ordersData = ordersRes.data || [];
    console.log('Orders data:', ordersData);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Process active sales (future events) - matching financial-system.js logic
    const activeSalesData = ordersData
      .filter(order => {
        // REMOVED STATUS FILTERING to match sales performance tab
        // Only filter by event date now
        
        // If no event date, include it in active sales
        if (!order.event_date) {
          return true;
        }
        
        // Check if event date is in the future
        const eventDate = new Date(order.event_date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
      })
      .map(order => ({
        ...order,
        // Use INR equivalent if available, otherwise original amount
        amount: order.inr_equivalent || order.final_amount_inr || order.final_amount || 0,
        event_name: order.event_name,
        client_name: order.client_name,
        delivery_date: order.delivery_date || order.event_date,
        status: order.payment_status === 'paid' ? 'paid' : 'completed',
        event_date: order.event_date,
        payment_status: order.payment_status || 'pending',
        // Currency info for display
        original_currency: order.payment_currency || 'INR',
        original_amount: order.final_amount || 0,
        exchange_rate: order.exchange_rate || 1
      }));

    // Process ALL orders for total sales (matching sales performance logic)
    // REMOVED STATUS FILTERING - include all orders like sales performance tab
    const allSalesData = ordersData
      .map(order => {
        // Use INR equivalent for foreign currency orders (matching sales performance)
        const isForeignCurrency = order.payment_currency && order.payment_currency !== 'INR';
        const orderAmount = parseFloat(
          isForeignCurrency && order.final_amount_inr 
            ? order.final_amount_inr 
            : (order.inr_equivalent || order.final_amount || order.total_amount || 0)
        );
        
        return {
          ...order,
          amount: orderAmount,
          event_name: order.event_name,
          client_name: order.client_name,
          sale_date: order.created_date,
          status: order.payment_status === 'paid' ? 'paid' : 'completed',
          event_date: order.event_date,
          payment_status: order.payment_status || 'pending',
          // Currency info
          original_currency: order.payment_currency || 'INR',
          original_amount: order.final_amount || 0,
          is_actualized: false // Will be set below
        };
      });

    // Mark actualized sales (past event dates)
    allSalesData.forEach(sale => {
      if (sale.event_date) {
        const eventDate = new Date(sale.event_date);
        eventDate.setHours(0, 0, 0, 0);
        sale.is_actualized = eventDate < today;
      }
    });

    // For backward compatibility, keep salesData as actualized sales only
    const salesData = allSalesData.filter(sale => sale.is_actualized);

    // Process receivables - properly preserve original amounts
    const receivablesData = receivablesRes.data || [];
    const processedReceivables = receivablesData.map(r => {
      console.log('Processing receivable with currency:', r);
      
      // IMPORTANT: First, determine and preserve the original foreign currency amount
      let originalAmount;
      let originalCurrency = r.currency || r.payment_currency || 'INR';
      
      // Check if we have a specific foreign currency amount field
      if (r.original_amount !== undefined) {
        originalAmount = r.original_amount;
      } else if (r.expected_amount !== undefined) {
        originalAmount = r.expected_amount;
      } else {
        originalAmount = r.amount || 0;
      }
      
      // Now determine the INR amount
      let inrAmount;
      
      // If we have a pre-calculated INR amount, use it
      if (r.amount_inr !== undefined) {
        inrAmount = r.amount_inr;
      } else if (r.expected_amount_inr !== undefined) {
        inrAmount = r.expected_amount_inr;
      } else if (r.inr_equivalent !== undefined) {
        inrAmount = r.inr_equivalent;
      }
      // If currency is not INR and we have exchange rate, calculate INR
      else if (originalCurrency && originalCurrency !== 'INR' && r.exchange_rate) {
        inrAmount = originalAmount * r.exchange_rate;
      }
      // If currency is INR or no exchange rate, use original amount
      else {
        inrAmount = originalAmount;
      }
      
      return {
        ...r,
        // Use INR amount for calculations
        amount: parseFloat(inrAmount),
        balance_amount: parseFloat(r.balance_amount_inr || inrAmount),
        invoice_number: r.invoice_number || r.invoice_id || 'N/A',
        due_date: r.due_date || r.expected_payment_date || new Date().toISOString(),
        client_name: r.client_name || 'N/A',
        assigned_to: r.assigned_to || 'Unassigned',
        status: r.status || 'pending',
        // Keep original currency info for display
        original_currency: originalCurrency,
        original_amount: parseFloat(originalAmount),
        exchange_rate: r.exchange_rate || 1
      };
    });

    // Filter only unpaid receivables
    const unpaidReceivables = processedReceivables.filter(r => r.status !== 'paid');

    // Process payables - properly preserve original amounts
    const payablesData = (payablesRes.data || []).map(p => {
      console.log('Processing payable with currency:', p);
      
      // IMPORTANT: First, determine and preserve the original foreign currency amount
      let originalAmount;
      let originalCurrency = p.currency || p.price_currency || 'INR';
      
      // Check if we have a specific foreign currency amount field
      if (p.original_amount !== undefined) {
        originalAmount = p.original_amount;
      } else if (p.totalPurchaseAmount !== undefined) {
        originalAmount = p.totalPurchaseAmount;
      } else {
        originalAmount = p.amount || 0;
      }
      
      // Now determine the INR amount
      let inrAmount;
      
      // If we have a pre-calculated INR amount, use it
      if (p.amount_inr !== undefined) {
        inrAmount = p.amount_inr;
      } else if (p.totalPurchaseAmount_inr !== undefined) {
        inrAmount = p.totalPurchaseAmount_inr;
      }
      // If currency is not INR and we have exchange rate, calculate INR
      else if (originalCurrency && originalCurrency !== 'INR' && p.exchange_rate) {
        inrAmount = originalAmount * p.exchange_rate;
      }
      // If currency is INR or no exchange rate, use original amount
      else {
        inrAmount = originalAmount;
      }
      
      return {
        ...p,
        // Use INR amount for calculations
        amount: parseFloat(inrAmount),
        // Keep original currency info
        original_currency: originalCurrency,
        original_amount: parseFloat(originalAmount),
        exchange_rate: p.exchange_rate || 1
      };
    });

    // Calculate totals using INR values (matching sales performance logic)
    const totalActiveSales = activeSalesData.reduce((sum, sale) => sum + sale.amount, 0);
    const totalSales = allSalesData.reduce((sum, sale) => sum + sale.amount, 0); // ALL orders
    const totalActualizedSales = salesData.reduce((sum, sale) => sum + sale.amount, 0); // Past events only
    const totalReceivables = unpaidReceivables.reduce((sum, rec) => 
      sum + (rec.balance_amount || rec.amount || 0), 0
    );
    const totalPayables = payablesData.reduce((sum, pay) => 
      sum + parseFloat(pay.amount || 0), 0
    );

    // Calculate expiring inventory value in INR
    const expiringInventory = inventoryData.filter(item => {
      if (!item.event_date || item.allocated) return false;
      const days = Math.ceil((new Date(item.event_date) - new Date()) / (1000 * 60 * 60 * 24));
      return days <= 7 && days >= 0;
    }).map(item => {
      // Calculate total value in INR
      let totalValueINR = 0;
      
      if (item.categories && Array.isArray(item.categories)) {
        // Multi-category inventory
        totalValueINR = item.categories.reduce((sum, cat) => {
          const sellingPriceINR = cat.selling_price_inr || cat.selling_price || 0;
          const availableTickets = cat.available_tickets || 0;
          return sum + (sellingPriceINR * availableTickets);
        }, 0);
      } else {
        // Single category (legacy)
        const sellingPriceINR = item.selling_price_inr || item.selling_price || 0;
        const availableTickets = item.available_tickets || 0;
        totalValueINR = sellingPriceINR * availableTickets;
      }
      
      return {
        ...item,
        value_inr: totalValueINR
      };
    });

    // Log the results
    console.log('=== FINANCIAL DATA SUMMARY (INR) ===');
    console.log(`Active Sales: ${activeSalesData.length} orders, Total: ₹${totalActiveSales.toLocaleString()}`);
    console.log(`Total Sales (All): ${allSalesData.length} orders, Total: ₹${totalSales.toLocaleString()}`);
    console.log(`Actualized Sales: ${salesData.length} orders, Total: ₹${totalActualizedSales.toLocaleString()}`);
    console.log(`Receivables: ${unpaidReceivables.length} entries, Total: ₹${totalReceivables.toLocaleString()}`);
    console.log(`Payables: ${payablesData.length} entries, Total: ₹${totalPayables.toLocaleString()}`);
    
    // Debug log for currency verification
    if (payablesData.length > 0) {
      const samplePayable = payablesData[0];
      console.log('Sample payable currency data:', {
        original_currency: samplePayable.original_currency,
        original_amount: samplePayable.original_amount,
        amount_inr: samplePayable.amount,
        exchange_rate: samplePayable.exchange_rate
      });
    }

    // Update state
    window.setFinancialData({
      activeSales: activeSalesData,
      sales: salesData, // Keep for backward compatibility (actualized sales)
      allSales: allSalesData, // NEW: All sales data
      totalSales: totalSales, // NEW: Total sales amount
      totalActualizedSales: totalActualizedSales, // NEW: Actualized sales amount
      receivables: unpaidReceivables,
      payables: payablesData,
      expiringInventory: expiringInventory
    });

    console.log('Financial data set with INR values:', {
      activeSales: activeSalesData.length,
      sales: salesData.length,
      receivables: unpaidReceivables.length,
      payables: payablesData.length
    });

  } catch (error) {
    console.error('Error fetching financial data:', error);
    alert('Failed to load financial data. Please refresh the page.');
  } finally {
    window.setLoading(false);
  }
};

// Enhanced dashboard metrics calculation with INR
window.calculateDashboardMetricsINR = () => {
  const financialData = window.appState?.financialData || {};
  const inventory = window.inventory || [];
  const orders = window.orders || [];
  
  // Calculate sales totals (already in INR from fetchFinancialDataWithINR)
  const totalSales = (financialData.activeSales || []).reduce((sum, sale) => 
    sum + (sale.amount || 0), 0
  );
  const activeSalesCount = (financialData.activeSales || []).filter(sale => 
    sale.status === 'active' || sale.status === 'paid'
  ).length;
  const totalReceivables = (financialData.receivables || []).reduce((sum, receivable) => 
    sum + (receivable.amount || 0), 0
  );
  const totalPayables = (financialData.payables || []).reduce((sum, payable) => 
    sum + (payable.amount || 0), 0
  );

  // Calculate margin from inventory using INR values
  let totalCost = 0;
  let totalRevenue = 0;
  
  inventory.forEach(item => {
    if (item.categories && Array.isArray(item.categories)) {
      // Multi-category inventory
      item.categories.forEach(cat => {
        const soldTickets = (cat.total_tickets || 0) - (cat.available_tickets || 0);
        const buyingPriceINR = cat.buying_price_inr || cat.buying_price || 0;
        const sellingPriceINR = cat.selling_price_inr || cat.selling_price || 0;
        
        totalCost += soldTickets * buyingPriceINR;
        totalRevenue += soldTickets * sellingPriceINR;
      });
    } else {
      // Single category (legacy)
      const soldTickets = (item.total_tickets || 0) - (item.available_tickets || 0);
      const buyingPriceINR = item.buying_price_inr || item.buying_price || 0;
      const sellingPriceINR = item.selling_price_inr || item.selling_price || 0;
      
      totalCost += soldTickets * buyingPriceINR;
      totalRevenue += soldTickets * sellingPriceINR;
    }
  });

  const totalMargin = totalRevenue - totalCost;
  const marginPercentage = totalRevenue > 0 ? ((totalMargin / totalRevenue) * 100) : 0;

  return {
    totalSales,
    activeSalesCount,
    totalReceivables,
    totalPayables,
    totalMargin,
    marginPercentage: Math.round(marginPercentage * 100) / 100,
    totalCost,
    totalRevenue
  };
};

// Enhanced financial summary with currency details
window.calculateFinancialSummaryINR = function(financialData) {
  const summary = {
    totalActiveSales: financialData.activeSales.reduce((sum, sale) => sum + sale.amount, 0),
    totalCompletedSales: financialData.sales.reduce((sum, sale) => sum + sale.amount, 0),
    totalReceivables: financialData.receivables.reduce((sum, rec) => sum + (rec.balance_amount || rec.amount || 0), 0),
    totalPayables: financialData.payables.reduce((sum, pay) => sum + parseFloat(pay.amount || 0), 0),
    netPosition: 0,
    // Currency breakdown
    currencyBreakdown: {
      receivables: {},
      payables: {},
      sales: {}
    }
  };

  // Calculate currency breakdown for receivables
  financialData.receivables.forEach(r => {
    const currency = r.original_currency || 'INR';
    if (!summary.currencyBreakdown.receivables[currency]) {
      summary.currencyBreakdown.receivables[currency] = {
        count: 0,
        originalAmount: 0,
        inrAmount: 0
      };
    }
    summary.currencyBreakdown.receivables[currency].count++;
    summary.currencyBreakdown.receivables[currency].originalAmount += (r.original_amount || 0);
    summary.currencyBreakdown.receivables[currency].inrAmount += (r.amount || 0);
  });

  // Calculate currency breakdown for payables
  financialData.payables.forEach(p => {
    const currency = p.original_currency || 'INR';
    if (!summary.currencyBreakdown.payables[currency]) {
      summary.currencyBreakdown.payables[currency] = {
        count: 0,
        originalAmount: 0,
        inrAmount: 0
      };
    }
    summary.currencyBreakdown.payables[currency].count++;
    summary.currencyBreakdown.payables[currency].originalAmount += (p.original_amount || 0);
    summary.currencyBreakdown.payables[currency].inrAmount += (p.amount || 0);
  });

  summary.netPosition = summary.totalReceivables - summary.totalPayables;

  return summary;
};

// Override the existing fetchFinancialData with the enhanced version
window.fetchFinancialData = window.fetchFinancialDataWithINR;

// Enhanced financial report export with currency details
window.exportFinancialDataWithCurrency = function(financialData, format = 'csv') {
  const report = window.generateFinancialReport(financialData);
  
  if (format === 'csv') {
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add summary
    csvContent += "Financial Summary (All amounts in INR)\n";
    csvContent += `Total Active Sales,₹${report.summary.totalActiveSales.toLocaleString()}\n`;
    csvContent += `Total Completed Sales,₹${report.summary.totalCompletedSales.toLocaleString()}\n`;
    csvContent += `Total Receivables,₹${report.summary.totalReceivables.toLocaleString()}\n`;
    csvContent += `Total Payables,₹${report.summary.totalPayables.toLocaleString()}\n`;
    csvContent += `Net Position,₹${report.summary.netPosition.toLocaleString()}\n\n`;

    // Add currency breakdown
    csvContent += "Currency Breakdown\n";
    csvContent += "Type,Currency,Count,Original Amount,INR Amount\n";
    
    // Receivables breakdown
    Object.entries(report.summary.currencyBreakdown.receivables).forEach(([currency, data]) => {
      csvContent += `Receivables,${currency},${data.count},${data.originalAmount.toFixed(2)},₹${data.inrAmount.toFixed(2)}\n`;
    });
    
    // Payables breakdown
    Object.entries(report.summary.currencyBreakdown.payables).forEach(([currency, data]) => {
      csvContent += `Payables,${currency},${data.count},${data.originalAmount.toFixed(2)},₹${data.inrAmount.toFixed(2)}\n`;
    });
    
    csvContent += "\n";

    // Add receivables details
    csvContent += "Receivables Details\n";
    csvContent += "Client,Original Amount,Currency,Exchange Rate,INR Amount,Due Date,Assigned To,Status\n";
    financialData.receivables.forEach(r => {
      csvContent += `"${r.client_name}",${r.original_amount || 0},${r.original_currency || 'INR'},${r.exchange_rate || 1},₹${(r.amount || 0).toLocaleString()},"${r.due_date}","${r.assigned_to}","${r.status}"\n`;
    });
    
    csvContent += "\n";
    
    // Add payables details
    csvContent += "Payables Details\n";
    csvContent += "Supplier,Original Amount,Currency,Exchange Rate,INR Amount,Due Date,Status\n";
    financialData.payables.forEach(p => {
      csvContent += `"${p.supplierName || 'Unknown'}",${p.original_amount || 0},${p.original_currency || 'INR'},${p.exchange_rate || 1},₹${(p.amount || 0).toLocaleString()},"${p.due_date || 'N/A'}","${p.status || 'pending'}"\n`;
    });

    // Download file
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financial_report_INR_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

console.log('✅ Enhanced Financial System with INR support loaded successfully');
