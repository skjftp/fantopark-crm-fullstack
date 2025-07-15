// Inventory Form Submit Handler Component for FanToPark CRM
// Updated to support multiple ticket categories AND multi-currency
// Uses window.* globals for CDN-based React compatibility

window.renderInventoryFormSubmitHandler = () => {
  // This component provides the handleInventoryFormSubmit function to the global scope
  // The function is attached to window object for use by inventory forms

  window.handleInventoryFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      window.setLoading(true);

      // Get form data including categories
      const formData = window.formData || {};
      const categories = formData.categories || [];
      
      // ✅ CURRENCY SUPPORT - using correct field names
      const currency = formData.purchase_currency || 'INR';
      const exchangeRate = parseFloat(formData.purchase_exchange_rate) || 1;
      
      console.log('=== INVENTORY SUBMISSION WITH CATEGORIES ===');
      console.log('Form data:', formData);
      console.log('Categories:', categories);
      console.log('Currency:', currency);
      console.log('Exchange Rate:', exchangeRate);
      console.log('Is from payables?', window.editingInventory?._payableContext?.fromPayables);
      
      // Validation
      if (!formData.event_name) {
        throw new Error('Event name is required');
      }
      
      if (!formData.venue) {
        throw new Error('Venue is required');
      }
      
      if (!formData.event_date) {
        throw new Error('Event date is required');
      }
      
      if (!formData.sports) {
        throw new Error('Sports is required');
      }
      
      if (categories.length === 0) {
        throw new Error('At least one ticket category is required');
      }
      
      // Validate each category
      for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];
        if (!cat.name) {
          throw new Error(`Category ${i + 1}: Name is required`);
        }
        if (!cat.total_tickets || parseInt(cat.total_tickets) <= 0) {
          throw new Error(`Category ${i + 1}: Total tickets must be greater than 0`);
        }
        if (cat.available_tickets === '' || cat.available_tickets === null || cat.available_tickets === undefined) {
          throw new Error(`Category ${i + 1}: Available tickets is required`);
        }
        if (parseInt(cat.available_tickets) > parseInt(cat.total_tickets)) {
          throw new Error(`Category ${i + 1}: Available tickets cannot exceed total tickets`);
        }
        if (!cat.buying_price || parseFloat(cat.buying_price) < 0) {
          throw new Error(`Category ${i + 1}: Valid buying price is required`);
        }
        if (!cat.selling_price || parseFloat(cat.selling_price) < 0) {
          throw new Error(`Category ${i + 1}: Valid selling price is required`);
        }
      }

      // ✅ Calculate and save INR values if using foreign currency
      let updatedCategories = categories.map(cat => {
        const catData = {
          name: cat.name,
          section: cat.section || '',
          total_tickets: parseInt(cat.total_tickets),
          available_tickets: parseInt(cat.available_tickets),
          buying_price: parseFloat(cat.buying_price),
          selling_price: parseFloat(cat.selling_price),
          inclusions: cat.inclusions || ''
        };
        
        // Add INR values if currency is not INR
        if (currency !== 'INR') {
          catData.buying_price_inr = catData.buying_price * exchangeRate;
          catData.selling_price_inr = catData.selling_price * exchangeRate;
        }
        
        return catData;
      });

      // Calculate aggregate values
      const totals = updatedCategories.reduce((acc, cat) => {
        const totalTickets = cat.total_tickets;
        const availableTickets = cat.available_tickets;
        const buyingPrice = cat.buying_price;
        
        return {
          totalTickets: acc.totalTickets + totalTickets,
          availableTickets: acc.availableTickets + availableTickets,
          totalCost: acc.totalCost + (buyingPrice * totalTickets),
          totalCostINR: acc.totalCostINR + ((currency === 'INR' ? buyingPrice : buyingPrice * exchangeRate) * totalTickets)
        };
      }, { totalTickets: 0, availableTickets: 0, totalCost: 0, totalCostINR: 0 });

      // Prepare inventory data
      const inventoryData = {
        // Event details
        event_name: formData.event_name,
        venue: formData.venue,
        event_date: formData.event_date,
        sports: formData.sports,
        event_type: formData.event_type || 'match',
        booking_person: formData.booking_person || '',
        notes: formData.notes || '',
        
        // Aggregate values (for backward compatibility)
        total_tickets: totals.totalTickets,
        available_tickets: totals.availableTickets,
        totalPurchaseAmount: totals.totalCost,
        
        // ✅ Currency fields
        purchase_currency: currency,
        purchase_exchange_rate: exchangeRate,
        
        // ✅ INR totals if using foreign currency
        ...(currency !== 'INR' && {
          totalPurchaseAmount_inr: totals.totalCostINR,
          amountPaid_inr: (parseFloat(formData.amountPaid) || 0) * exchangeRate
        }),
        
        // Categories array - the new structure with currency support!
        categories: updatedCategories,
        
        // Payment/supplier fields (preserve existing)
        paymentStatus: formData.paymentStatus || 'pending',
        supplierName: formData.supplierName || '',
        supplierInvoice: formData.supplierInvoice || '',
        amountPaid: parseFloat(formData.amountPaid) || 0,
        paymentDueDate: formData.paymentDueDate || '',
        
        // Metadata
        day_of_match: formData.day_of_match || '',
        procurement_type: formData.procurement_type || '',
        created_by: window.user?.name || 'Unknown User',
        updated_date: new Date().toISOString(),
        
        // Keep backward compatibility fields (from first category)
        category_of_ticket: categories[0]?.name || '',
        stand: categories[0]?.section || '',
        buying_price: categories[0]?.buying_price || 0,
        selling_price: categories[0]?.selling_price || 0,
        inclusions: categories[0]?.inclusions || ''
      };

      // Preserve created_date if editing
      if (window.editingInventory?.id) {
        inventoryData.created_date = window.editingInventory.created_date;
      } else {
        inventoryData.created_date = new Date().toISOString();
      }

      console.log('Submitting inventory data:', inventoryData);
      if (currency !== 'INR') {
        console.log('INR calculations:', {
          totalPurchaseAmount_inr: inventoryData.totalPurchaseAmount_inr,
          amountPaid_inr: inventoryData.amountPaid_inr,
          categories_with_inr: inventoryData.categories.filter(c => c.buying_price_inr)
        });
      }

      // API call
      let response;
      if (window.editingInventory?.id && window.editingInventory.id !== null) {
        // UPDATE EXISTING INVENTORY
        console.log('Updating existing inventory...');
        
        response = await window.apiCall(`/inventory/${window.editingInventory.id}`, {
          method: 'PUT',
          body: JSON.stringify(inventoryData)
        });

        console.log('Backend response:', response);

        if (response.error) {
          throw new Error(response.error);
        }

        // Update local state
        window.setInventory(prev => prev.map(item => 
          item.id === window.editingInventory.id 
            ? { ...inventoryData, id: item.id } 
            : item
        ));

        // Refresh financial data if needed
        if (window.fetchFinancialData && window.editingInventory._payableContext?.fromPayables) {
          await window.fetchFinancialData();
        }

        alert(`Event updated successfully with ${categories.length} ticket categor${categories.length === 1 ? 'y' : 'ies'}!`);

      } else {
        // CREATE NEW INVENTORY
        console.log('Creating new inventory item...');
        
        response = await window.apiCall('/inventory', {
          method: 'POST',
          body: JSON.stringify(inventoryData)
        });

        console.log('Backend response:', response);

        if (response.error) {
          throw new Error(response.error);
        }

        // Add to local state
        const newItem = response.data || { ...inventoryData, id: response.id };
        window.setInventory(prev => [...prev, newItem]);

        alert(`Event created successfully with ${categories.length} ticket categor${categories.length === 1 ? 'y' : 'ies'}!`);
      }

      // Close form and reset
      window.closeInventoryForm();
      window.setFormData({});

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

console.log('✅ Inventory Form Submit Handler with categories and currency support loaded successfully');
