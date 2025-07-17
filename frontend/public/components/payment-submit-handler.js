// Payment Submit Handler Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality

window.renderPaymentSubmitHandler = () => {
  // This component provides the handlePaymentSubmit function to the global scope
  // The function is attached to window object for use by forms

  window.handlePaymentSubmit = async (e) => {
    e.preventDefault();

    // ADD THESE DEBUG LINES
    console.log('=== PAYMENT SUBMIT DEBUG ===');
    console.log('Full paymentData:', window.paymentData);
    console.log('GST Certificate:', window.paymentData.gst_certificate);
    console.log('PAN Card:', window.paymentData.pan_card);

    if (!window.hasPermission('leads', 'write')) {
      alert('You do not have permission to manage payments');
      return;
    }

    window.setLoading(true);

    try {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check if this is a post-service payment
  if (window.paymentData.payment_post_service && window.paymentData.receivable_id) {
    // Update receivable status
    if (window.setFinancialData) {
      window.setFinancialData(prev => ({
        ...prev,
        receivables: prev.receivables.map(r => 
          r.id === window.paymentData.receivable_id 
            ? { ...r, status: 'paid', paid_date: new Date().toISOString().split('T')[0] }
            : r
        )
      }));
    } else {
      // If setFinancialData doesn't exist, update the financialData object directly
      if (window.financialData && window.financialData.receivables) {
        window.financialData.receivables = window.financialData.receivables.map(r => 
          r.id === window.paymentData.receivable_id 
            ? { ...r, status: 'paid', paid_date: new Date().toISOString().split('T')[0] }
            : r
        );
      }
    }
    
    // Update order payment status
    // FIXED: Changed from payment_type to order_type
    const order = window.orders.find(o => 
      o.lead_id === window.currentLead.id && 
      o.order_type === 'payment_post_service'  // Fixed this line
    );
    
    if (order) {
      window.setOrders(prev => 
        prev.map(o => 
          o.id === order.id 
            ? { ...o, payment_received: true, payment_date: new Date().toISOString().split('T')[0] }
            : o
        )
      );
    }
    
    // Add this: Refresh financial data
    if (window.fetchFinancialData && typeof window.fetchFinancialData === 'function') {
      await window.fetchFinancialData();
    }
  }

      // FIXED: Use helper function and correct GST calculation
      const baseAmount = window.getBaseAmount(window.paymentData);
      const isIntraState = window.paymentData.indian_state === 'Haryana' && !window.paymentData.is_outside_india;

      // FIXED: Use the correct calculateGSTAndTCS function
      const calculation = window.calculateGSTAndTCS(baseAmount, window.paymentData);
      const totalTax = calculation.gst.total;
      const finalAmount = calculation.finalAmount;

      // Update lead with payment details
      const updatedLead = {
        ...window.currentLead,
        payment_details: {
          ...window.paymentData,
          advance_amount: parseFloat(window.paymentData.advance_amount) || 0,
          base_amount: baseAmount,
          gst_calculation: calculation.gst,
          tcs_calculation: calculation.tcs,
          total_tax: totalTax,
          final_amount: finalAmount
        },
        payment_received_date: new Date().toISOString().split('T')[0]
      };

      // Update local state with payment details
      window.setLeads(prev => 
        prev.map(lead => 
          lead.id === window.currentLead.id ? updatedLead : lead
        )
      );

      console.log('=== REACHED ORDER CREATION SECTION ===');

      // Check if order already exists for this lead
      const existingOrder = window.orders.find(order => 
        order.lead_id === window.currentLead.id && 
        order.status !== 'rejected'
      );

      if (existingOrder) {
        // UPDATE existing order
        console.log('Updating order with GST details:', {
          gstin: window.paymentData.gstin,
          legal_name: window.paymentData.legal_name,
          registered_address: window.paymentData.registered_address,
          category_of_sale: window.paymentData.category_of_sale,
          type_of_sale: window.paymentData.type_of_sale,
          indian_state: window.paymentData.indian_state
        });

        // FIXED: Correct API call format
        const updateResponse = await window.apiCall(`/orders/${existingOrder.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            // Start with existing order data
            ...existingOrder,

            // CRITICAL: Add these fields to convert proforma to tax invoice
    invoice_type: 'tax',              // Convert from proforma to tax
    status: 'payment_received',       // Update status
    payment_status: 'completed',      // Change from 'paid' to 'completed' for consistency

            // ADD: Auto-assign to finance team
    assigned_to: await window.getFinanceManager(),  // or specific finance user
    assigned_team: 'finance',
    assignment_date: new Date().toISOString(),
    assignment_notes: 'Auto-assigned to finance team after payment collection',
    

            // If this was a payment_post_service order, keep references
    ...(existingOrder.order_type === 'payment_post_service' && {
      proforma_invoice_number: existingOrder.invoice_number || existingOrder.order_number,
      proforma_order_number: existingOrder.order_number,
      order_number: 'ORD-' + Date.now(),  // Generate new order number for tax invoice
      original_order_type: 'payment_post_service',
      order_type: 'standard'  // Convert to standard order
    }),

            // Payment fields (will override existing)
            payment_amount: window.paymentData.advance_amount,
            payment_method: window.paymentData.payment_method,
            transaction_id: window.paymentData.transaction_id,
            payment_date: window.paymentData.payment_date,
            payment_proof: window.paymentData.payment_proof,
   

            // Amount fields
            amount: window.paymentData.advance_amount,
            total_amount: existingOrder.total_amount || existingOrder.final_amount,
            final_amount: existingOrder.final_amount || existingOrder.total_amount,

            // GST fields - IMPORTANT: These will override existing values
            legal_name: window.paymentData.legal_name || existingOrder.legal_name,
            gstin: window.paymentData.gstin || existingOrder.gstin,
            registered_address: window.paymentData.registered_address || existingOrder.registered_address,
            category_of_sale: window.paymentData.category_of_sale || existingOrder.category_of_sale,
            type_of_sale: window.paymentData.type_of_sale || existingOrder.type_of_sale,
            indian_state: window.paymentData.indian_state || existingOrder.indian_state,
            is_outside_india: window.paymentData.is_outside_india || existingOrder.is_outside_india,
            gst_certificate: window.paymentData.gst_certificate || existingOrder.gst_certificate,
            pan_card: window.paymentData.pan_card || existingOrder.pan_card,

            // Invoice details
            invoice_items: window.paymentData.invoice_items || existingOrder.invoice_items,
            base_amount: baseAmount,
            gst_calculation: calculation.gst,
            tcs_calculation: calculation.tcs,
            total_tax: totalTax,
            final_amount: finalAmount,
            gst_rate: calculation.gst.rate,
            service_fee_amount: window.paymentData.service_fee_amount || existingOrder.service_fee_amount,

            // Clear post-service fields if this was a post-service order
            expected_amount: null,
            expected_payment_date: null,
            order_type: 'standard',

            // Metadata
            notes: window.paymentData.notes || existingOrder.notes,
            updated_date: new Date().toISOString(),
            updated_by: window.user.name
          })
        });

        console.log('Order update response:', updateResponse);

        // FIXED: Handle response structure properly
        const updatedOrderData = updateResponse.data || updateResponse;
        window.setOrders(prev => prev.map(o => 
          o.id === existingOrder.id ? {...o, ...updatedOrderData} : o
        ));

        // IMPORTANT: Update lead status for payment_post_service to payment_received
        if (window.paymentData.payment_post_service) {
          await window.updateLeadStatus(window.currentLead.id, 'payment_received');
        }

        // Update lead status if this is payment collection after service
        if (window.paymentData.payment_post_service || window.currentLead.status === 'payment_post_service') {
          await window.updateLeadStatus(window.currentLead.id, 'payment_received');
        }

        // Handle receivable updates/deletion if payment is from receivables
        if (window.paymentData.from_receivable && window.paymentData.receivable_id) {
          console.log('Processing receivable payment...');
          console.log('Receivable ID:', window.paymentData.receivable_id);
          console.log('Original receivable amount:', window.paymentData.receivable_amount);

          // For receivable payments, the advance_amount field contains the actual payment amount
          const paidAmount = parseFloat(window.paymentData.advance_amount) || 0;
          const receivableAmount = parseFloat(window.paymentData.receivable_amount) || 0;

          console.log('Payment being collected:', paidAmount);
          console.log('Original receivable amount:', receivableAmount);
          console.log('Calculated invoice amount with GST:', finalAmount);

          if (paidAmount >= receivableAmount) {
            // Full payment - delete the receivable
            try {
              await window.apiCall(`/receivables/${window.paymentData.receivable_id}`, {
                method: 'DELETE'
              });

              // Remove from local state
              if (window.setFinancialData) {
  window.setFinancialData(prev => ({
    ...prev,
    receivables: prev.receivables.filter(r => r.id !== window.paymentData.receivable_id)
  }));
} else if (window.financialData && window.financialData.receivables) {
  window.financialData.receivables = window.financialData.receivables.filter(
    r => r.id !== window.paymentData.receivable_id
  );
}
              console.log('Receivable deleted after full payment');
            } catch (error) {
              console.error('Failed to delete receivable:', error);
            }
          } else {
            // Partial payment - ask user what to do
            const remainingAmount = receivableAmount - paidAmount;
            const userChoice = confirm(
              `You are receiving only partial payment of ₹${paidAmount.toFixed(2)} out of ₹${receivableAmount.toFixed(2)} (inclusive of GST).\n\n` +
              `Remaining balance: ₹${remainingAmount.toFixed(2)}\n\n` +
              `Click OK to update this receivable with the balance payment.\n` +
              `Click Cancel to mark this receivable as closed and update the order value.`
            );

            if (userChoice) {
              // Update receivable with remaining amount
              try {
                await window.apiCall(`/receivables/${window.paymentData.receivable_id}`, {
                  method: 'PUT',
                  body: JSON.stringify({
                    balance_amount: remainingAmount,
                    amount: remainingAmount,
                    expected_amount: remainingAmount,
                    partial_payment_received: paidAmount,
                    last_payment_date: new Date().toISOString(),
                    updated_date: new Date().toISOString()
                  })
                });

                // Update local state
                if (window.setFinancialData) {
  window.setFinancialData(prev => ({
    ...prev,
    receivables: prev.receivables.map(r => 
      r.id === window.paymentData.receivable_id 
        ? {
            ...r,
            balance_amount: remainingAmount,
            amount: remainingAmount,
            expected_amount: remainingAmount,
            partial_payment_received: paidAmount,
            last_payment_date: new Date().toISOString(),
            updated_date: new Date().toISOString()
          }
        : r
    )
  }));
}
                alert(`Receivable updated with remaining balance of ₹${remainingAmount.toFixed(2)}`);
              } catch (error) {
                console.error('Failed to update receivable:', error);
                alert('Failed to update receivable with remaining balance');
              }
            } else {
              // Close receivable and update order total
              try {
                // Delete the receivable
                await window.apiCall(`/receivables/${window.paymentData.receivable_id}`, {
                  method: 'DELETE'
                });

                // FIXED: Use existingOrder.id instead of undefined existingOrderId
                await window.apiCall(`/orders/${existingOrder.id}`, {
                  method: 'PUT',
                  body: JSON.stringify({
                    total_amount: paidAmount,
                    original_amount: receivableAmount,
                    amount_adjusted: true,
                    adjustment_reason: 'Partial payment accepted',
                    updated_date: new Date().toISOString()
                  })
                });

                // Update local states
                if (typeof window.setReceivables === 'function') {
                  window.setReceivables(prev => prev.filter(r => r.id !== window.paymentData.receivable_id));
                }
                window.setOrders(prev => prev.map(o => 
                  o.id === existingOrder.id 
                    ? { ...o, total_amount: paidAmount, amount_adjusted: true }
                    : o
                ));

                alert(`Receivable closed. Order value updated to ₹${paidAmount.toFixed(2)}`);
              } catch (error) {
                console.error('Failed to close receivable:', error);
                alert('Failed to close receivable');
              }
            }
          }
        }

        // FIXED: Refresh orders data to ensure updated order shows correctly
        try {
          console.log('Refreshing orders after update...');
          const freshOrdersResponse = await window.apiCall('/orders');
          const freshOrders = freshOrdersResponse.data || freshOrdersResponse || [];
          window.setOrders(freshOrders);
          console.log('Orders refreshed after update:', freshOrders.length);
        } catch (refreshError) {
          console.error('Failed to refresh orders after update:', refreshError);
        }

        window.setLoading(false);
        alert(window.paymentData.payment_post_service 
          ? 'Payment collected successfully! Invoice can now be generated.' 
          : 'Payment updated successfully!'
        );
        window.closeForm();
        return; // Exit here, don't create new order
      }

      // ENHANCED: Create NEW order after successful payment
      const orderData = {
        order_number: 'ORD-' + (Date.now()),
        lead_id: window.currentLead.id,
        lead_name: window.currentLead.name,
        client_name: window.currentLead.name,
        lead_email: window.currentLead.email,
        client_email: window.currentLead.email,
        lead_phone: window.currentLead.phone,
        client_phone: window.currentLead.phone,
        legal_name: window.paymentData.legal_name || window.currentLead.legal_name,
        gstin: window.paymentData.gstin,
        registered_address: window.paymentData.registered_address,
        category_of_sale: window.paymentData.category_of_sale,
        type_of_sale: window.paymentData.type_of_sale,
        indian_state: window.paymentData.indian_state,
        is_outside_india: window.paymentData.is_outside_india || false,
        payment_amount: window.paymentData.advance_amount,
        payment_method: window.paymentData.payment_method,
        transaction_id: window.paymentData.transaction_id,
        payment_date: window.paymentData.payment_date,
        payment_proof: window.paymentData.payment_proof,
        notes: window.paymentData.notes,
        gst_rate: calculation.gst.rate,
        service_fee_amount: window.paymentData.service_fee_amount,
        invoice_items: window.paymentData.invoice_items,
        status: 'pending_approval',
        requires_gst_invoice: true,

        // Add the missing fields by extracting from invoice items
        event_name: window.paymentData.invoice_items?.[0]?.description || window.currentLead?.lead_for_event || 'General Event',
        event_date: window.paymentData.payment_date || new Date().toISOString().split('T')[0],
        tickets_allocated: parseInt(window.paymentData.invoice_items?.[0]?.quantity) || 1,
        ticket_category: window.paymentData.category_of_sale || 'General',
        price_per_ticket: window.paymentData.invoice_items?.[0]?.rate || 0,
        total_amount: baseAmount,
        base_amount: baseAmount,
        gst_calculation: calculation.gst,
        tcs_calculation: calculation.tcs,
        total_tax: totalTax,
        final_amount: finalAmount,

        // CRITICAL: Add required fields that might be missing
        created_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        created_by: window.currentLead.assigned_to || window.currentLead.created_by || window.user.name,
        sales_person: window.user.email, // Add this line
        original_assignee: window.currentLead.assigned_to || window.currentLead.created_by,
        
        // 🔧 FIXED: Assign to finance manager instead of supply team
        assigned_to: await window.getFinanceManager(),
        assigned_team: 'finance',
        
        payment_currency: window.paymentData.payment_currency || 'INR',
        payment_status: 'paid',
        order_type: 'standard'
      };

      console.log('=== ENHANCED ORDER CREATION DEBUG ===');
      console.log('Order data to create:', JSON.stringify(orderData, null, 2));
      console.log('Order data size:', JSON.stringify(orderData).length, 'characters');

      let orderResponse;
      try {
        console.log('=== CREATING ORDER WITH FIXED API CALL ===');

        // FIXED: Use correct window.apiCall format
        orderResponse = await window.apiCall('/orders', {
          method: 'POST',
          body: JSON.stringify(orderData)
        });

        console.log('=== ORDER CREATION RESPONSE ===');
        console.log('Response:', orderResponse);
        console.log('Response type:', typeof orderResponse);
        console.log('Response keys:', Object.keys(orderResponse || {}));

        // CRITICAL CHECK: Validate this is actually a created order, not a list
        if (Array.isArray(orderResponse)) {
          console.error('❌ API RETURNED ARRAY INSTEAD OF CREATED ORDER');
          console.error('This means the POST request was treated as GET');
          throw new Error('API returned orders list instead of creating new order. Check backend routes.');
        }

        if (orderResponse && Array.isArray(orderResponse.data)) {
          console.error('❌ API RETURNED ORDERS LIST INSTEAD OF CREATED ORDER');
          console.error('Response data is array of length:', orderResponse.data.length);
          throw new Error('API returned existing orders list instead of creating new order. Backend routing issue.');
        }

        // Check if we got a valid order back
        const createdOrder = orderResponse.data || orderResponse;
        if (!createdOrder || (!createdOrder.id && !createdOrder.order_number)) {
          console.error('❌ INVALID ORDER RESPONSE');
          console.error('Expected: order object with id or order_number');
          console.error('Received:', createdOrder);
          throw new Error('Server did not return a valid created order');
        }

        console.log('✅ ORDER CREATED SUCCESSFULLY');
        console.log('Created order ID:', createdOrder.id);
        console.log('Created order number:', createdOrder.order_number);
        console.log('Created order status:', createdOrder.status);

      } catch (error) {
        console.error('=== ORDER CREATION FAILED ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Full error:', error);

        // Specific error messages for common issues
        if (error.message.includes('orders list')) {
          alert('❌ Backend Issue: The API is returning existing orders instead of creating a new one.\n\nThis indicates a problem with your backend routing for POST /orders.\n\nPlease check your backend orders.js route file.');
        } else {
          alert(`❌ Order creation failed: ${error.message}\n\nCheck console for full details.`);
        }

        window.setLoading(false);
        return;
      }

      console.log('=== VERIFYING ORDER IN BACKEND ===');

      // Wait a moment then verify
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        console.log('Verifying order was actually saved...');

        // FIXED: Use correct window.apiCall format for verification
        const verifyResponse = await window.apiCall('/orders');
        const allOrders = verifyResponse.data || verifyResponse;

        console.log('Total orders in backend after creation:', allOrders.length);
        console.log('Previous count was: 3');

        if (allOrders.length > 3) {
          console.log('✅ ORDER COUNT INCREASED - SUCCESS!');

          // Find our new order
          const newOrder = allOrders.find(o => 
            o.lead_id === window.currentLead.id || 
            o.order_number === orderData.order_number
          );

          if (newOrder) {
            console.log('✅ FOUND OUR NEW ORDER:', newOrder.id);
            console.log('New order details:', newOrder);
          }

          // Update local state with all fresh orders
          window.setOrders(allOrders);
          console.log('✅ LOCAL STATE UPDATED');

        } else {
          console.error('❌ ORDER COUNT DID NOT INCREASE');
          console.error('Expected more than 3 orders, got:', allOrders.length);
          alert('⚠️ Order creation may have failed. The order count did not increase.');
        }

      } catch (verifyError) {
        console.error('Failed to verify order creation:', verifyError);

        // Fallback: try using window.apiCall for refresh
        try {
          const fallbackResponse = await window.apiCall('/orders');
          const fallbackOrders = fallbackResponse.data || fallbackResponse || [];
          window.setOrders(fallbackOrders);
          console.log('Fallback refresh completed, orders:', fallbackOrders.length);
        } catch (fallbackError) {
          console.error('Fallback refresh also failed:', fallbackError);
        }
      }

      // Update lead status
      await window.updateLeadStatus(window.currentLead.id, 'payment_received');

      window.setLoading(false);
      alert(window.paymentData.payment_post_service 
        ? 'Payment collected successfully! Invoice can now be generated.' 
        : 'Payment details submitted successfully! Order created and assigned to finance for approval.'
      );
      window.closeForm();

      // Enhanced page refresh trigger
      setTimeout(() => {
        if (window.activeTab === 'orders') {
          console.log('Triggering orders page refresh...');
          // Force re-render of orders page
          window.setActiveTab('dashboard');
          setTimeout(() => window.setActiveTab('orders'), 100);
        }

        // Additional verification
        setTimeout(() => {
          console.log('=== FINAL VERIFICATION ===');
          console.log('Orders in state after 3 seconds:', window.orders.length);
          if (window.debugOrders) {
            console.log('Running final API check...');
            window.debugOrders().then(apiOrders => {
              console.log('Final API check shows:', apiOrders.length, 'orders');
              if (apiOrders.length > window.orders.length) {
                console.log('⚠️ API has more orders than local state - refreshing...');
                window.setOrders(apiOrders);
              }
            });
          }
        }, 3000);
      }, 1000);

    } catch (error) {
      console.error('=== PAYMENT SUBMISSION ERROR ===');
      console.error('Payment submission error:', error);
      window.setLoading(false);
      alert('Payment submission failed: ' + (error.message || 'Unknown error'));
    }
  };

  // This component doesn't render anything - it just provides the function
  return null;
};

console.log('✅ Payment Submit Handler component loaded with finance assignment fix');
