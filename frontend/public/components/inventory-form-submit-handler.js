// Inventory Form Submit Handler Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

window.renderInventoryFormSubmitHandler = () => {
  // This component provides the handleInventoryFormSubmit function to the global scope
  // The function is attached to window object for use by inventory forms

  window.handleInventoryFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      window.setLoading(true);

      // Enhanced debug logging
      console.log('=== FRONTEND INVENTORY SUBMISSION DEBUG ===');
      console.log('Inventory ID:', window.editingInventory.id);
      console.log('Complete form data being sent:', window.formData);
      console.log('Payment fields specifically:', {
        totalPurchaseAmount: window.formData.totalPurchaseAmount,
        amountPaid: window.formData.amountPaid,
        paymentStatus: window.formData.paymentStatus,
        supplierName: window.formData.supplierName,
        supplierInvoice: window.formData.supplierInvoice
      });
      console.log('Is from payables?', window.editingInventory._payableContext?.fromPayables);
      console.log('Payable amount:', window.editingInventory._payableContext?.payableAmount);

      if (window.editingInventory.id === null || window.editingInventory.id === undefined) {
        // CREATE NEW INVENTORY
        console.log('Creating new inventory item...');
        
        const response = await window.apicall('/inventory', {
          method: 'POST',
          body: JSON.stringify({
            ...window.formData,
            created_by: window.user.name || 'Unknown User',
            created_date: new Date().toISOString()
          })
        });

        console.log('Backend response:', response);

        if (response.error) {
          throw new Error(response.error);
        }

        // Add to local state
        window.setInventory(prev => [...prev, response.data]);
        alert('Inventory created successfully!');

      } else {
        // UPDATE EXISTING INVENTORY (original logic)
        console.log('Updating existing inventory...');
        
        const response = await window.apicall(`/inventory/${window.editingInventory.id}`, {
          method: 'PUT',
          body: JSON.stringify(window.formData)
        });

        console.log('Backend response:', response);

        if (response.error) {
          throw new Error(response.error);
        }

        // Update local state
        window.setInventory(prev => prev.map(item => 
          item.id === window.editingInventory.id ? { ...item, ...window.formData } : item
        ));

        // Refresh financial data to show updated payables
        await window.fetchFinancialData();
        alert('Inventory updated successfully! Payables have been synced automatically.');
      }

      window.closeInventoryForm();

    } catch (error) {
      console.error('Error with inventory:', error);
      alert('Error saving inventory: ' + error.message);
    } finally {
      window.setLoading(false);
    }
  };

  // This component doesn't render anything - it just provides the function
  return null;
};

console.log('✅ Inventory Form Submit Handler component loaded successfully');
