// Fixed openAllocationManagement function with API data fetching
// Add this to app-business-logic.js or update the existing function

window.openAllocationManagement = async (inventory) => {
  console.log("👁️ openAllocationManagement called with:", inventory?.event_name);
  
  try {
    // Set loading state
    if (window.setLoading) {
      window.setLoading(true);
    }
    
    // Set the inventory for allocation management
    window.setAllocationManagementInventory(inventory);
    
    // CRITICAL FIX: Fetch allocations from API
    console.log("🔄 Fetching allocations for inventory:", inventory.id);
    const response = await window.apiCall(`/inventory/${inventory.id}/allocations`);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    // Set the fetched allocations data
    const allocations = response.data?.allocations || [];
    console.log("✅ Fetched allocations:", allocations.length);
    window.setCurrentAllocations(allocations);
    
    // Show the modal
    window.setShowAllocationManagement(true);
    
    console.log("✅ Allocation management modal setup completed with data");
    
  } catch (error) {
    console.error('❌ Error fetching allocations:', error);
    alert('Error fetching allocations: ' + error.message);
    
    // Still show modal but with empty allocations
    window.setCurrentAllocations([]);
    window.setShowAllocationManagement(true);
    
  } finally {
    if (window.setLoading) {
      window.setLoading(false);
    }
  }
};

// Also add the handleUnallocate function if missing
window.handleUnallocate = window.handleUnallocate || async (allocationId, ticketsToReturn) => {
  if (!confirm(`Are you sure you want to unallocate ${ticketsToReturn} tickets?`)) {
    return;
  }

  try {
    if (window.setLoading) {
      window.setLoading(true);
    }

    const response = await window.apiCall(
      `/inventory/${window.allocationManagementInventory.id}/allocations/${allocationId}`, 
      { method: 'DELETE' }
    );

    if (response.error) {
      throw new Error(response.error);
    }

    // Refresh allocations by calling openAllocationManagement again
    await window.openAllocationManagement(window.allocationManagementInventory);

    // Update inventory in main list
    if (window.setInventory) {
      window.setInventory(prev => 
        prev.map(item => 
          item.id === window.allocationManagementInventory.id 
            ? { ...item, available_tickets: response.new_available_tickets }
            : item
        )
      );
    }

    alert(`Successfully unallocated ${ticketsToReturn} tickets`);

  } catch (error) {
    console.error('Error unallocating tickets:', error);
    alert('Error unallocating tickets: ' + error.message);
  } finally {
    if (window.setLoading) {
      window.setLoading(false);
    }
  }
};
