// Financial System Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Handles financial data processing, payment management, and receivables

// Replace the beginning of your handleMarkAsPaid function with this:
window.handleMarkAsPaid = async function(payableIdOrObject) {
  try {
    // Log what we received
    console.log('handleMarkAsPaid called with:', payableIdOrObject);
    
    // Extract the ID whether we received a string or object
    let payableId;
    if (typeof payableIdOrObject === 'string') {
      payableId = payableIdOrObject;
    } else if (payableIdOrObject && typeof payableIdOrObject === 'object') {
      payableId = payableIdOrObject.id;
    } else {
      console.error('Invalid payable parameter:', payableIdOrObject);
      alert('Invalid payable data.');
      return;
    }
    
    console.log('Looking for payable with ID:', payableId);
    
    // Find the payable in the array
    const payable = window.financialData.payables?.find(p => p.id === payableId);

    if (!payable) {
      // If not found in array but we have the object, use it directly
      if (typeof payableIdOrObject === 'object' && payableIdOrObject.inventoryId) {
        console.log('Using payable object directly as it was not found in financialData.payables');
        // Use the passed object but make sure it has an id
        const payableToUse = {
          ...payableIdOrObject,
          id: payableIdOrObject.id || payableId
        };
        
        // Continue with the rest of the function using payableToUse instead of payable
        processPayable(payableToUse);
        return;
      }
      
      console.error('Payable not found in array:', payableId);
      console.error('Available payables:', window.financialData.payables?.map(p => p.id));
      alert('Payable not found. Please refresh the page and try again.');
      return;
    }

    // Continue with the found payable
    processPayable(payable);
    
    // Helper function to avoid code duplication
    async function processPayable(payable) {
      console.log('Processing payable:', payable);

      // If linked to inventory, open inventory edit form
      if (payable.inventoryId) {
        console.log('Payable is linked to inventory:', payable.inventoryId);

        const inventoryItem = window.inventory.find(inv => inv.id === payable.inventoryId);

        if (!inventoryItem) {
          console.error('Related inventory item not found:', payable.inventoryId);
          alert('Related inventory item not found. Please refresh and try again.');
          await window.fetchInventory();
          return;
        }

        console.log('Found inventory item:', inventoryItem);
        console.log('Opening inventory edit form for payable payment...');

        // Set up for editing with payment focus
        const inventoryWithContext = {
          ...inventoryItem,
          _payableContext: {
            payableId: payable.id,
            payableAmount: payable.amount,
            fromPayables: true
          }
        };

        window.setEditingInventory(inventoryWithContext);

        // Calculate correct payment amounts
        const currentTotal = parseFloat(inventoryItem.totalPurchaseAmount || 0);
        const currentPaid = parseFloat(inventoryItem.amountPaid || 0);
        const pendingBalance = parseFloat(payable.amount || 0);

        console.log('Payable form pre-fill calculation:', {
          currentTotal,
          currentPaid,
          pendingBalance,
          action: 'Setting form to mark as fully paid'
        });

        // NEW: Handle exchange rate for foreign currency inventory
        let exchangeRateToUse = inventoryItem.purchase_exchange_rate || '1';
        
        if (inventoryItem.purchase_currency && inventoryItem.purchase_currency !== 'INR') {
          const currentRates = window.currentExchangeRates || {
            USD: 86.00,
            EUR: 93.00,
            GBP: 108.00,
            AED: 23.50
          };
          
          const suggestedRate = currentRates[inventoryItem.purchase_currency] || inventoryItem.purchase_exchange_rate;
          const inputRate = prompt(
            `Enter current exchange rate for ${inventoryItem.purchase_currency} (original: ₹${inventoryItem.purchase_exchange_rate}, current market: ₹${suggestedRate}):`,
            suggestedRate
          );
          
          if (!inputRate) {
            window.setLoading(false);
            return; // User cancelled
          }
          
          exchangeRateToUse = inputRate;
        }

        // Pre-fill form to mark as FULLY PAID by default
        window.setFormData({
          ...inventoryItem,
          totalPurchaseAmount: currentTotal,
          amountPaid: currentTotal, // Set to total to mark as fully paid
          paymentStatus: 'paid',
          // Add currency fields with current exchange rate
          purchase_currency: inventoryItem.purchase_currency || 'INR',
          purchase_exchange_rate: exchangeRateToUse
        });

        console.log('✅ Form data set with currency fields:', {
          currency: inventoryItem.purchase_currency || 'INR',
          rate: exchangeRateToUse,
          fromPayables: true
        });

        window.setShowInventoryForm(true);
        return;
      }

      // For non-inventory payables, use traditional mark as paid
      console.log('Processing non-inventory payable...');
      
      // NEW: Handle exchange rate for non-inventory foreign currency payables
      let paymentData = {
        status: 'paid',
        paid_date: new Date().toISOString(),
        payment_notes: 'Marked as paid manually'
      };
      
      if (payable.currency && payable.currency !== 'INR') {
        const currentRates = window.currentExchangeRates || {
          USD: 86.00,
          EUR: 93.00,
          GBP: 108.00,
          AED: 23.50
        };
        
        const suggestedRate = currentRates[payable.currency] || payable.exchange_rate;
        const inputRate = prompt(
          `Enter current exchange rate for ${payable.currency} (original: ₹${payable.exchange_rate}, current market: ₹${suggestedRate}):`,
          suggestedRate
        );
        
        if (!inputRate) {
          window.setLoading(false);
          return; // User cancelled
        }
        
        paymentData.exchange_rate = parseFloat(inputRate);
        paymentData.payment_reference = prompt('Enter payment reference:') || '';
      }
      
      const confirmAmount = payable.currency && payable.currency !== 'INR' 
        ? `${payable.currency} ${payable.original_amount || payable.amount}`
        : `₹${payable.amount}`;
        
      const confirmPaid = confirm(`Mark payable of ${confirmAmount} as paid?`);
      if (!confirmPaid) return;

      window.setLoading(true);

      const response = await window.apiCall(`/payables/${payable.id}`, {
        method: 'PUT',
        body: JSON.stringify(paymentData)
      });

      if (response.error) {
        throw new Error(response.error);
      }

      console.log('Payable marked as paid successfully');
      
      // Show exchange impact if applicable
      if (response.exchange_impact) {
        alert(`Payable marked as paid!\n\nExchange ${response.exchange_impact.type}: ₹${response.exchange_impact.amount.toFixed(2)}`);
      } else {
        alert('Payable marked as paid!');
      }
      
      await window.fetchFinancialData();
    }

  } catch (error) {
    console.error('Error marking payable as paid:', error);
    alert('Failed to mark payable as paid: ' + error.message);
  } finally {
    window.setLoading(false);
  }
};

// Create alias for enhanced UI compatibility
window.markPayableAsPaid = window.handleMarkAsPaid;

// Comprehensive financial data fetching and processing function
window.fetchFinancialData = async function() {
  try {
    console.log('Fetching financial data...');
    const [ordersRes, invoicesRes, payablesRes, inventoryRes, receivablesRes] = await Promise.all([
      window.apiCall('/orders'),
      window.apiCall('/invoices'),
      window.apiCall('/payables'),
      window.apiCall('/inventory'),
      window.apiCall('/receivables').catch(() => ({ data: [] }))
    ]);

    const ordersData = ordersRes.data || [];
    const invoicesData = invoicesRes.data || [];
    const payablesData = payablesRes.data || [];
    const inventoryData = inventoryRes.data || [];
    const receivablesData = receivablesRes.data || [];

    console.log('Raw receivables data:', receivablesData);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // FIXED: Process active sales (orders in progress with event date in future)
   const activeSalesData = ordersData
  .filter(order => {
    // Exclude orders that haven't reached approved stage yet
    const preApprovalStatuses = ['new', 'pending', 'rejected', 'cancelled', 'draft', 'pending_approval'];
    if (preApprovalStatuses.includes(order.status)) {
      return false;
    }
    
    // Include all orders at approved stage or beyond
    // This includes: approved, service_assigned, in_progress, delivery_scheduled, completed, delivered
    
    // If no event date, include it in active sales
    if (!order.event_date) {
      console.log(`Including order without event date ${order.id}: status=${order.status}`);
      return true;
    }
    
    // Check if event date is in the future
    const eventDate = new Date(order.event_date);
    eventDate.setHours(0, 0, 0, 0);
    const isEventFuture = eventDate >= today;
    
    if (isEventFuture) {
      console.log(`Including future event order ${order.id}: eventDate=${order.event_date}, status=${order.status}`);
      return true;
    }
    
    return false;
  })
  .map(order => ({
    id: order.id,
    date: order.created_at || order.created_date || new Date().toISOString(),
    order_number: order.order_number || order.id,
    clientName: order.lead_name || order.client_name || order.legal_name || 'N/A',
    client: order.lead_name || order.client_name || order.legal_name || 'N/A',
    assignedTo: order.assigned_to || order.sales_person || order.created_by || 'Unassigned',
    amount: parseFloat(order.final_amount || order.total_amount || 0),
    status: order.payment_status || order.status || 'pending',
    event_date: order.event_date,
    event_name: order.event_name || 'N/A',
    payment_status: order.payment_status || 'pending',
    original_currency: order.payment_currency || 'INR',
    original_amount: order.final_amount || order.total_amount || 0
  }));

// Process ALL orders for total sales (matching sales performance logic)
const allSalesData = ordersData
  .filter(order => {
    // Exclude orders that haven't reached approved stage yet
    const preApprovalStatuses = ['new', 'pending', 'rejected', 'cancelled', 'draft', 'pending_approval'];
    if (preApprovalStatuses.includes(order.status)) {
      return false;
    }
    return true;
  })
  .map(order => {
    // Use INR equivalent for foreign currency orders (matching sales performance)
    const isForeignCurrency = order.payment_currency && order.payment_currency !== 'INR';
    const orderAmount = parseFloat(
      isForeignCurrency && order.final_amount_inr 
        ? order.final_amount_inr 
        : (order.final_amount || order.total_amount || 0)
    );
    
    return {
      id: order.id,
      date: order.created_at || order.created_date || new Date().toISOString(),
      invoice_number: order.invoice_number || 'INV-' + order.id,
      clientName: order.lead_name || order.client_name || 'N/A',
      assignedTo: order.assigned_to || order.sales_person || order.created_by || 'Unassigned',
      amount: orderAmount,
      status: order.payment_status === 'paid' ? 'paid' : 'completed',
      event_date: order.event_date,
      event_name: order.event_name || 'N/A',
      payment_status: order.payment_status || 'pending',
      original_currency: order.payment_currency || 'INR',
      original_amount: order.final_amount || order.total_amount || 0,
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

    // Process receivables - ensure all fields are properly mapped
    const processedReceivables = receivablesData.map(r => {
      console.log('Processing receivable:', r);
      return {
        ...r,
        // Ensure all required fields are present
        amount: parseFloat(r.expected_amount || r.amount || 0),
        balance_amount: parseFloat(r.balance_amount || r.expected_amount || r.amount || 0),
        invoice_number: r.invoice_number || r.invoice_id || 'N/A',
        due_date: r.due_date || r.expected_payment_date || new Date().toISOString(),
        client_name: r.client_name || 'N/A',
        assigned_to: r.assigned_to || 'Unassigned',
        status: r.status || 'pending',
        // Ensure currency fields for receivables
        currency: r.currency || 'INR',
        original_amount: r.original_amount || r.expected_amount || r.amount || 0,
        exchange_rate: r.exchange_rate || 1
      };
    });

    console.log('Processed receivables:', processedReceivables);

    // Filter only unpaid receivables
    const unpaidReceivables = processedReceivables.filter(r => r.status !== 'paid');

    console.log('Unpaid receivables to display:', unpaidReceivables);

    // Calculate totals (matching sales performance logic)
    const totalActiveSales = activeSalesData.reduce((sum, sale) => sum + sale.amount, 0);
    const totalSales = allSalesData.reduce((sum, sale) => sum + sale.amount, 0); // ALL orders
    const totalActualizedSales = salesData.reduce((sum, sale) => sum + sale.amount, 0); // Past events only
    const totalReceivables = unpaidReceivables.reduce((sum, rec) => 
      sum + (rec.balance_amount || rec.amount || 0), 0
    );
    const totalPayables = payablesData.reduce((sum, pay) => 
      sum + parseFloat(pay.amount || 0), 0
    );

    // Log the results
    console.log('=== FINANCIAL DATA SUMMARY ===');
    console.log(`Active Sales: ${activeSalesData.length} orders, Total: ₹${totalActiveSales.toLocaleString()}`);
    console.log(`Total Sales (All): ${allSalesData.length} orders, Total: ₹${totalSales.toLocaleString()}`);
    console.log(`Actualized Sales: ${salesData.length} orders, Total: ₹${totalActualizedSales.toLocaleString()}`);
    console.log(`Receivables: ${unpaidReceivables.length} entries, Total: ₹${totalReceivables.toLocaleString()}`);
    console.log(`Payables: ${payablesData.length} entries, Total: ₹${totalPayables.toLocaleString()}`);

    // Update state
    window.setFinancialData({
      activeSales: activeSalesData,
      sales: salesData, // Keep for backward compatibility (actualized sales)
      allSales: allSalesData, // NEW: All sales data
      totalSales: totalSales, // NEW: Total sales amount
      totalActualizedSales: totalActualizedSales, // NEW: Actualized sales amount
      receivables: unpaidReceivables,
      payables: payablesData,
      expiringInventory: inventoryData.filter(item => {
        if (!item.event_date || item.allocated) return false;
        const days = Math.ceil((new Date(item.event_date) - new Date()) / (1000 * 60 * 60 * 24));
        return days <= 7 && days >= 0;
      })
    });

    console.log('Financial data set:', {
      activeSales: activeSalesData.length,
      sales: salesData.length,
      receivables: unpaidReceivables.length,
      payables: payablesData.length
    });

  } catch (error) {
    console.error('Error fetching financial data:', error);
    alert('Failed to load financial data. Please refresh the page.');
  }
};

// UPDATED: Record payment for receivable with exchange rate handling
window.recordPayment = async function(receivableId) {
  try {
    // Find the receivable
    const receivable = window.financialData.receivables?.find(r => r.id === receivableId);
    if (!receivable) {
      alert('Receivable not found. Please refresh and try again.');
      return;
    }
    
    // Get payment amount
    const paymentAmount = prompt(`Enter payment amount in ${receivable.currency || 'INR'}:`, receivable.original_amount || receivable.amount);
    if (!paymentAmount) return;

    // Handle exchange rate for foreign currency
    let exchangeRate = receivable.exchange_rate || 1;
    
    if (receivable.currency && receivable.currency !== 'INR') {
      const currentRates = window.currentExchangeRates || {
        USD: 86.00,
        EUR: 93.00,
        GBP: 108.00,
        AED: 23.50
      };
      
      const suggestedRate = currentRates[receivable.currency] || receivable.exchange_rate;
      const inputRate = prompt(
        `Enter current exchange rate for ${receivable.currency} (original: ₹${receivable.exchange_rate}, current market: ₹${suggestedRate}):`,
        suggestedRate
      );
      
      if (!inputRate) return; // User cancelled
      
      exchangeRate = parseFloat(inputRate);
      if (isNaN(exchangeRate)) {
        alert('Invalid exchange rate');
        return;
      }
    }

    const paymentMode = prompt('Enter payment mode (bank_transfer/cash/cheque):', 'bank_transfer');
    const transactionId = prompt('Enter transaction ID/reference:');

    window.setLoading(true);
    const response = await window.apiCall('/receivables/record-payment/' + receivableId, 'PUT', {
      payment_amount: parseFloat(paymentAmount),
      payment_date: new Date().toISOString(),
      payment_mode: paymentMode,
      transaction_id: transactionId,
      // NEW: Add exchange rate fields
      receipt_exchange_rate: exchangeRate,
      receipt_reference: transactionId
    });

    // Show exchange impact if applicable
    if (response.exchange_impact) {
      alert(`Payment recorded successfully!\n\nExchange ${response.exchange_impact.type}: ₹${response.exchange_impact.amount.toFixed(2)}`);
    } else {
      alert('Payment recorded successfully!');
    }
    
    window.fetchFinancialData(); // Refresh data
  } catch (error) {
    console.error('Error recording payment:', error);
    alert('Failed to record payment');
  } finally {
    window.setLoading(false);
  }
};

// Financial calculations and utilities
window.calculateFinancialSummary = function(financialData) {
  const summary = {
    totalActiveSales: financialData.activeSales.reduce((sum, sale) => sum + sale.amount, 0),
    totalCompletedSales: financialData.sales.reduce((sum, sale) => sum + sale.amount, 0),
    totalReceivables: financialData.receivables.reduce((sum, rec) => sum + (rec.balance_amount || rec.amount || 0), 0),
    totalPayables: financialData.payables.reduce((sum, pay) => sum + parseFloat(pay.amount || 0), 0),
    netPosition: 0,
    // NEW: Add exchange impact totals
    totalExchangeGain: 0,
    totalExchangeLoss: 0
  };

  // Calculate exchange impacts
  financialData.payables.forEach(p => {
    if (p.exchange_difference) {
      if (p.exchange_difference_type === 'gain') {
        summary.totalExchangeGain += Math.abs(p.exchange_difference);
      } else {
        summary.totalExchangeLoss += Math.abs(p.exchange_difference);
      }
    }
  });
  
  financialData.receivables.forEach(r => {
    if (r.exchange_difference) {
      if (r.exchange_difference_type === 'gain') {
        summary.totalExchangeGain += Math.abs(r.exchange_difference);
      } else {
        summary.totalExchangeLoss += Math.abs(r.exchange_difference);
      }
    }
  });

  summary.netPosition = summary.totalReceivables - summary.totalPayables;
  summary.netExchangeImpact = summary.totalExchangeGain - summary.totalExchangeLoss;

  return summary;
};

window.getOverdueReceivables = function(receivables) {
  const today = new Date();
  return receivables.filter(r => {
    if (r.status === 'paid') return false;
    const dueDate = new Date(r.due_date);
    return dueDate < today;
  });
};

window.getReceivablesByAssignee = function(receivables) {
  const grouped = {};
  receivables.forEach(r => {
    const assignee = r.assigned_to || 'Unassigned';
    if (!grouped[assignee]) {
      grouped[assignee] = {
        count: 0,
        totalAmount: 0,
        items: []
      };
    }
    grouped[assignee].count++;
    grouped[assignee].totalAmount += (r.balance_amount || r.amount || 0);
    grouped[assignee].items.push(r);
  });
  return grouped;
};

window.getPayablesBySupplier = function(payables) {
  const grouped = {};
  payables.forEach(p => {
    const supplier = p.supplierName || p.supplier_name || 'Unknown Supplier';
    if (!grouped[supplier]) {
      grouped[supplier] = {
        count: 0,
        totalAmount: 0,
        items: []
      };
    }
    grouped[supplier].count++;
    grouped[supplier].totalAmount += parseFloat(p.amount || 0);
    grouped[supplier].items.push(p);
  });
  return grouped;
};

// Financial reporting functions
window.generateFinancialReport = function(financialData, options = {}) {
  const summary = window.calculateFinancialSummary(financialData);
  const overdueReceivables = window.getOverdueReceivables(financialData.receivables);
  const receivablesByAssignee = window.getReceivablesByAssignee(financialData.receivables);
  const payablesBySupplier = window.getPayablesBySupplier(financialData.payables);

  return {
    summary,
    overdueReceivables,
    receivablesByAssignee,
    payablesBySupplier,
    generatedAt: new Date().toISOString(),
    ...options
  };
};

window.exportFinancialData = function(financialData, format = 'csv') {
  const report = window.generateFinancialReport(financialData);
  
  if (format === 'csv') {
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add summary
    csvContent += "Financial Summary\n";
    csvContent += `Total Active Sales,₹${report.summary.totalActiveSales.toLocaleString()}\n`;
    csvContent += `Total Completed Sales,₹${report.summary.totalCompletedSales.toLocaleString()}\n`;
    csvContent += `Total Receivables,₹${report.summary.totalReceivables.toLocaleString()}\n`;
    csvContent += `Total Payables,₹${report.summary.totalPayables.toLocaleString()}\n`;
    csvContent += `Net Position,₹${report.summary.netPosition.toLocaleString()}\n\n`;
    
    // NEW: Add exchange impact summary
    if (report.summary.totalExchangeGain > 0 || report.summary.totalExchangeLoss > 0) {
      csvContent += "Exchange Rate Impact\n";
      csvContent += `Total Exchange Gain,₹${report.summary.totalExchangeGain.toLocaleString()}\n`;
      csvContent += `Total Exchange Loss,₹${report.summary.totalExchangeLoss.toLocaleString()}\n`;
      csvContent += `Net Exchange Impact,₹${report.summary.netExchangeImpact.toLocaleString()}\n\n`;
    }

    // Add receivables
    csvContent += "Receivables\n";
    csvContent += "Client,Amount,Due Date,Assigned To,Status\n";
    financialData.receivables.forEach(r => {
      csvContent += `"${r.client_name}",₹${(r.balance_amount || r.amount || 0).toLocaleString()},"${r.due_date}","${r.assigned_to}","${r.status}"\n`;
    });

    // Download file
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financial_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Mark receivable as paid - keeping your existing function
window.markReceivableAsPaid = async function(receivableId, paymentDetails = {}) {
  try {
    window.setLoading(true);
    
    const updateData = {
      status: 'paid',
      paid_date: new Date().toISOString(),
      payment_amount: paymentDetails.amount || 0,
      payment_mode: paymentDetails.mode || 'manual',
      transaction_id: paymentDetails.transactionId || '',
      payment_notes: paymentDetails.notes || 'Marked as paid manually'
    };

    const response = await window.apiCall(`/receivables/${receivableId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });

    if (response.error) {
      throw new Error(response.error);
    }

    alert('Receivable marked as paid successfully!');
    await window.fetchFinancialData();

  } catch (error) {
    console.error('Error marking receivable as paid:', error);
    alert('Failed to mark receivable as paid: ' + error.message);
  } finally {
    window.setLoading(false);
  }
};

// Financial data filtering
window.filterFinancialData = function(data, filters) {
  let filtered = { ...data };

  if (filters.dateFrom || filters.dateTo) {
    const startDate = filters.dateFrom ? new Date(filters.dateFrom) : new Date('1900-01-01');
    const endDate = filters.dateTo ? new Date(filters.dateTo) : new Date('2100-12-31');

    filtered.activeSales = filtered.activeSales.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= endDate;
    });

    filtered.sales = filtered.sales.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= endDate;
    });

    filtered.receivables = filtered.receivables.filter(item => {
      const itemDate = new Date(item.due_date);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }

  if (filters.assignee) {
    filtered.receivables = filtered.receivables.filter(item => 
      item.assigned_to && item.assigned_to.toLowerCase().includes(filters.assignee.toLowerCase())
    );
  }

  if (filters.status && filters.status !== 'all') {
    filtered.receivables = filtered.receivables.filter(item => 
      item.status === filters.status
    );
  }

  return filtered;
};

// NEW: Add handleMarkPaymentFromReceivable for the button in receivables table
window.handleMarkPaymentFromReceivable = window.recordPayment;

window.showPaymentHistory = function(payable) {
  // Check if there's payment history
  if (!payable.payment_history || payable.payment_history.length === 0) {
    alert('No payment history available for this payable.');
    return;
  }
  
  // Build payment history text
  let historyText = `Payment History for ${payable.eventName || payable.supplierName}\n`;
  historyText += `Original Amount: ${payable.original_currency || 'INR'} ${payable.original_amount || payable.amount}\n`;
  historyText += `\n--- Payments ---\n`;
  
  // Track totals
  let totalPaid = 0;
  let totalFxImpact = 0;
  
  payable.payment_history.forEach((payment, index) => {
    historyText += `\n${index + 1}. Date: ${new Date(payment.date).toLocaleDateString()}\n`;
    historyText += `   Amount: ${payment.currency} ${payment.amount_foreign.toFixed(2)} @ ₹${payment.exchange_rate}\n`;
    historyText += `   INR Value: ₹${payment.amount_inr.toFixed(2)}\n`;
    if (payment.fx_difference && payment.fx_difference !== 0) {
      historyText += `   FX ${payment.fx_type}: ₹${Math.abs(payment.fx_difference).toFixed(2)}\n`;
      totalFxImpact += payment.fx_difference;
    }
    totalPaid += payment.amount_foreign;
  });
  
  // Add summary
  historyText += `\n--- Summary ---\n`;
  historyText += `Total Paid: ${payable.original_currency || 'INR'} ${totalPaid.toFixed(2)}\n`;
  historyText += `Remaining: ${payable.original_currency || 'INR'} ${((payable.original_amount || payable.amount) - totalPaid).toFixed(2)}\n`;
  if (totalFxImpact !== 0) {
    historyText += `Total FX ${totalFxImpact > 0 ? 'Loss' : 'Gain'}: ₹${Math.abs(totalFxImpact).toFixed(2)}\n`;
  }
  
  // Show in alert
  alert(historyText);
};

console.log('✅ Financial System component loaded successfully with exchange rate handling');
