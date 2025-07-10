// Financial System Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Handles financial data processing, payment management, and receivables

// Enhanced handleMarkAsPaid function with inventory integration
window.handleMarkAsPaid = async function(payableId) {
  try {
    console.log('handleMarkAsPaid called with payableId:', payableId);

    const payable = window.financialData.payables?.find(p => p.id === payableId);

    if (!payable) {
      console.error('Payable not found:', payableId);
      alert('Payable not found.');
      return;
    }

    console.log('Found payable:', payable);

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
      // Pre-fill form data with payment context
      const inventoryWithContext = {
        ...inventoryItem,
        _payableContext: {
          payableId: payable.id,
          payableAmount: payable.amount,
          fromPayables: true
        }
      };

      window.setEditingInventory(inventoryWithContext);

      // Pre-fill form data for payment
      // Calculate correct payment amounts
      // When coming from payables, we're paying off the pending balance
      const currentTotal = parseFloat(inventoryItem.totalPurchaseAmount || 0);
      const currentPaid = parseFloat(inventoryItem.amountPaid || 0);
      const pendingBalance = parseFloat(payable.amount || 0); // What we owe

      console.log('Payable form pre-fill calculation:', {
        currentTotal,
        currentPaid,
        pendingBalance,
        action: 'Setting form to mark as fully paid'
      });

      // Pre-fill form to mark as FULLY PAID by default
      window.setFormData({
        ...inventoryItem,
        totalPurchaseAmount: currentTotal, // Keep original total
        amountPaid: currentTotal, // Set paid amount = total amount (fully paid)
        paymentStatus: 'paid' // Mark as paid by default
      });

      window.setShowInventoryForm(true);

      return;
    }

    // For non-inventory payables, use traditional mark as paid
    console.log('Processing non-inventory payable...');
    const confirmPaid = confirm(`Mark payable of ₹${payable.amount} as paid?`);
    if (!confirmPaid) return;

    window.setLoading(true);

    const response = await window.apicall(`/finance/payables/${payableId}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: 'paid',
        paid_date: new Date().toISOString(),
        payment_notes: 'Marked as paid manually'
      })
    });

    if (response.error) {
      throw new Error(response.error);
    }

    console.log('Payable marked as paid successfully');
    alert('Payable marked as paid!');
    await window.fetchFinancialData();

  } catch (error) {
    console.error('Error handling mark as paid:', error);
    alert('Failed to process payment: ' + error.message);
  } finally {
    window.setLoading(false);
  }
};

// Comprehensive financial data fetching and processing function
window.fetchFinancialData = async function() {
  try {
    console.log('Fetching financial data...');
    const [ordersRes, invoicesRes, payablesRes, inventoryRes, receivablesRes] = await Promise.all([
      window.apicall('/orders'),
      window.apicall('/invoices'),
      window.apicall('/payables'),
      window.apicall('/inventory'),
      window.apicall('/receivables').catch(() => ({ data: [] }))
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
        // Include orders that are approved OR in service/delivery process
        const validStatuses = ['approved', 'service_assigned', 'in_progress', 'delivery_scheduled', 'pending_delivery'];

        if (!validStatuses.includes(order.status)) {
          // Skip completed, cancelled, rejected orders
          console.log(`Skipping order ${order.id} with status: ${order.status}`);
          return false;
        }

        // Only include if event date is in future
        if (!order.event_date) {
          console.log(`Skipping order ${order.id} - no event date`);
          return false;
        }

        const eventDate = new Date(order.event_date);
        eventDate.setHours(0, 0, 0, 0);
        const isEventInFuture = eventDate >= today;

        console.log(`Order ${order.id}: status=${order.status}, eventDate=${order.event_date}, inFuture=${isEventInFuture}`);
        return isEventInFuture;
      })
      .map(order => ({
        id: order.id,
        date: order.created_at || order.created_date || new Date().toISOString(),
        invoice_number: order.invoice_number || 'INV-' + order.id,
        clientName: order.lead_name || order.client_name || 'N/A',
        assignedTo: order.assigned_to || order.sales_person || order.created_by || 'Unassigned',
        amount: parseFloat(order.final_amount || order.total_amount || 0),
        status: 'active',
        event_date: order.event_date,
        payment_status: order.payment_status || 'pending',
        order_type: order.order_type,
        order_status: order.status // Keep original status for reference
      }));

    // FIXED: Process completed sales - orders that are completed OR have past event dates
    const salesData = ordersData
      .filter(order => {
        // Include if explicitly completed or delivered
        if (order.status === 'completed' || order.status === 'delivered') {
          console.log(`Including completed order ${order.id} with status: ${order.status}`);
          return true;
        }

        // Include if event date has passed (regardless of status, except rejected/cancelled)
        if (order.status !== 'rejected' && order.status !== 'cancelled' && order.event_date) {
          const eventDate = new Date(order.event_date);
          eventDate.setHours(0, 0, 0, 0);
          const isEventPast = eventDate < today;

          if (isEventPast) {
            console.log(`Including past event order ${order.id}: eventDate=${order.event_date}, status=${order.status}`);
            return true;
          }
        }

        return false;
      })
      .map(order => ({
        id: order.id,
        date: order.created_at || order.created_date || new Date().toISOString(),
        invoice_number: order.invoice_number || 'INV-' + order.id,
        clientName: order.lead_name || order.client_name || 'N/A',
        assignedTo: order.assigned_to || order.sales_person || order.created_by || 'Unassigned',
        amount: parseFloat(order.final_amount || order.total_amount || 0),
        status: order.payment_status === 'paid' ? 'paid' : 'completed',
        event_date: order.event_date,
        payment_status: order.payment_status || 'pending'
      }));

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
        status: r.status || 'pending'
      };
    });

    console.log('Processed receivables:', processedReceivables);

    // Filter only unpaid receivables
    const unpaidReceivables = processedReceivables.filter(r => r.status !== 'paid');

    console.log('Unpaid receivables to display:', unpaidReceivables);

    // Calculate totals
    const totalActiveSales = activeSalesData.reduce((sum, sale) => sum + sale.amount, 0);
    const totalSales = salesData.reduce((sum, sale) => sum + sale.amount, 0);
    const totalReceivables = unpaidReceivables.reduce((sum, rec) => 
      sum + (rec.balance_amount || rec.amount || 0), 0
    );
    const totalPayables = payablesData.reduce((sum, pay) => 
      sum + parseFloat(pay.amount || 0), 0
    );

    // Log the results
    console.log('=== FINANCIAL DATA SUMMARY ===');
    console.log(`Active Sales: ${activeSalesData.length} orders, Total: ₹${totalActiveSales.toLocaleString()}`);
    console.log(`Completed Sales: ${salesData.length} orders, Total: ₹${totalSales.toLocaleString()}`);
    console.log(`Receivables: ${unpaidReceivables.length} entries, Total: ₹${totalReceivables.toLocaleString()}`);
    console.log(`Payables: ${payablesData.length} entries, Total: ₹${totalPayables.toLocaleString()}`);

    // Update state
    window.setFinancialData({
      activeSales: activeSalesData,
      sales: salesData,
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

// Record payment for receivable
window.recordPayment = async function(receivableId) {
  const paymentAmount = prompt('Enter payment amount:');
  if (!paymentAmount) return;

  const paymentMode = prompt('Enter payment mode (bank_transfer/cash/cheque):', 'bank_transfer');
  const transactionId = prompt('Enter transaction ID (optional):');

  try {
    window.setLoading(true);
    const response = await window.apicall('/receivables/record-payment/' + receivableId, 'PUT', {
      payment_amount: parseFloat(paymentAmount),
      payment_date: new Date().toISOString(),
      payment_mode: paymentMode,
      transaction_id: transactionId
    });

    alert('Payment recorded successfully!');
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
    netPosition: 0
  };

  summary.netPosition = summary.totalReceivables - summary.totalPayables;

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

// Mark receivable as paid
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

    const response = await window.apicall(`/receivables/${receivableId}`, {
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

console.log('✅ Financial System component loaded successfully');
