// This file contains the changes needed for receivable payment handling

/* 
IMPLEMENTATION GUIDE:

1. First, update handleMarkPaymentFromReceivable to add tracking flags
2. Then update handlePaymentSubmit to handle receivable deletion/updates
3. Finally, update closeForm to clear receivable data

SEARCH AND REPLACE INSTRUCTIONS:

=== CHANGE 1: Update handleMarkPaymentFromReceivable ===
Find this line:
    advance_amount: receivable.balance_amount || receivable.expected_amount || receivable.amount || ''

Add these lines after it:
    from_receivable: true,
    receivable_id: receivable.id,
    receivable_amount: receivable.balance_amount || receivable.expected_amount || receivable.amount || 0

=== CHANGE 2: Add to handlePaymentSubmit ===
Find this section in handlePaymentSubmit (after order update, before alert):
    await updateLeadStatus(currentLead.id, 'payment_received');
}

Add this code AFTER that closing brace:

// Handle receivable updates/deletion if payment is from receivables
if (paymentData.from_receivable && paymentData.receivable_id) {
    const paidAmount = parseFloat(paymentData.advance_amount) || 0;
    const receivableAmount = parseFloat(paymentData.receivable_amount) || 0;
    
    if (paidAmount >= receivableAmount) {
        // Full payment - delete the receivable
        try {
            await apiCall('/receivables/' + paymentData.receivable_id, {
                method: 'DELETE'
            });
            // Remove from local state
            if (typeof setReceivables === 'function') {
                setReceivables(prev => prev.filter(r => r.id !== paymentData.receivable_id));
            }
            console.log('Receivable deleted after full payment');
        } catch (error) {
            console.error('Failed to delete receivable:', error);
        }
    } else {
        // Partial payment - ask user what to do
        const remainingAmount = receivableAmount - paidAmount;
        const userChoice = confirm(
            'You are receiving only partial payment of ₹' + paidAmount.toFixed(2) + ' out of ₹' + receivableAmount.toFixed(2) + '.\\n\\n' +
            'Remaining balance: ₹' + remainingAmount.toFixed(2) + '\\n\\n' +
            'Click OK to update this receivable with the balance payment.\\n' +
            'Click Cancel to mark this receivable as closed and update the order value.'
        );
        
        if (userChoice) {
            // Update receivable with remaining amount
            try {
                await apiCall('/receivables/' + paymentData.receivable_id, {
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
                if (typeof setReceivables === 'function') {
                    setReceivables(prev => prev.map(r => 
                        r.id === paymentData.receivable_id 
                            ? { ...r, balance_amount: remainingAmount, amount: remainingAmount }
                            : r
                    ));
                }
                alert('Receivable updated with remaining balance of ₹' + remainingAmount.toFixed(2));
            } catch (error) {
                console.error('Failed to update receivable:', error);
                alert('Failed to update receivable with remaining balance');
            }
        } else {
            // Close receivable and update order total
            try {
                // Delete the receivable
                await apiCall('/receivables/' + paymentData.receivable_id, {
                    method: 'DELETE'
                });
                
                // Update the order with the actual paid amount
                await apiCall('/orders/' + existingOrderId, {
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
                if (typeof setReceivables === 'function') {
                    setReceivables(prev => prev.filter(r => r.id !== paymentData.receivable_id));
                }
                setOrders(prev => prev.map(o => 
                    o.id === existingOrderId 
                        ? { ...o, total_amount: paidAmount, amount_adjusted: true }
                        : o
                ));
                
                alert('Receivable closed. Order value updated to ₹' + paidAmount.toFixed(2));
            } catch (error) {
                console.error('Failed to close receivable:', error);
                alert('Failed to close receivable');
            }
        }
    }
}

=== CHANGE 3: Update closeForm function ===
Find the closeForm function and add this before the last closing brace:

// Clear receivable-related data
setPaymentData(prev => ({
    ...prev,
    from_receivable: false,
    receivable_id: null,
    receivable_amount: null
}));

*/
