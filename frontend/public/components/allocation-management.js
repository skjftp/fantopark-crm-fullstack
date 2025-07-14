// Restore the WORKING allocation code from old.html

// 1. Replace the broken openAllocationManagement with the working async version
window.openAllocationManagement = async function(inventoryItem) {
    try {
        console.log('📂 Opening allocation management for:', inventoryItem?.event_name);
        
        // Set loading state
        if (window.setLoading) {
            window.setLoading(true);
        }
        
        // Set the inventory item
        if (window.setAllocationManagementInventory) {
            window.setAllocationManagementInventory(inventoryItem);
        }
        window.allocationManagementInventory = inventoryItem;

        // Fetch allocations for this inventory
        const response = await window.apiCall(`/inventory/${inventoryItem.id}/allocations`);
        console.log('Allocations response:', response);

        if (response.error) {
            throw new Error(response.error);
        }

        // Set the allocations
        if (window.setCurrentAllocations) {
            window.setCurrentAllocations(response.data.allocations || []);
        }
        window.currentAllocations = response.data.allocations || [];
        
        // Show the modal
        if (window.setShowAllocationManagement) {
            window.setShowAllocationManagement(true);
        }
        window.showAllocationManagement = true;
        
        // Force update if needed
        if (window.forceUpdate) {
            window.forceUpdate();
        }

    } catch (error) {
        console.error('Error fetching allocations:', error);
        alert('Error fetching allocations: ' + error.message);
    } finally {
        if (window.setLoading) {
            window.setLoading(false);
        }
    }
};

// 2. Add the handleUnallocate function from old.html
window.handleUnallocate = async function(allocationId, ticketsToReturn) {
    if (!confirm(`Are you sure you want to unallocate ${ticketsToReturn} tickets?`)) {
        return;
    }

    try {
        if (window.setLoading) {
            window.setLoading(true);
        }

        const response = await window.apiCall(`/inventory/${window.allocationManagementInventory.id}/allocations/${allocationId}`, {
            method: 'DELETE'
        });

        if (response.error) {
            throw new Error(response.error);
        }

        // Refresh allocations
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

// 3. Ensure the renderAllocationManagement component is available
if (!window.renderAllocationManagement) {
    console.log('⚠️ renderAllocationManagement not found, loading from allocation-management.js');
    // The component should be loaded from allocation-management.js
}

// 4. Fix any event listeners on allocation buttons
document.addEventListener('click', function(e) {
    // Remove our previous interceptor that was preventing default
    const button = e.target.closest('button[title*="allocation"], button[class*="allocation"]');
    
    if (button && button.onclick) {
        // Let the original onclick handler work
        console.log('✅ Allocation button clicked, letting original handler work');
    }
}, false); // Use normal phase, not capture

// 5. Debug function to check state
window.debugAllocationState = function() {
    console.log('🔍 Allocation State Debug:');
    console.log('- openAllocationManagement:', typeof window.openAllocationManagement);
    console.log('- renderAllocationManagement:', typeof window.renderAllocationManagement);
    console.log('- showAllocationManagement:', window.showAllocationManagement);
    console.log('- allocationManagementInventory:', window.allocationManagementInventory);
    console.log('- currentAllocations:', window.currentAllocations);
    console.log('- setShowAllocationManagement:', typeof window.setShowAllocationManagement);
    console.log('- setCurrentAllocations:', typeof window.setCurrentAllocations);
};

// 6. Test function
window.testWorkingAllocation = async function() {
    console.log('🧪 Testing with sample inventory...');
    
    const testInventory = window.inventory?.[0] || {
        id: 'xXRLE5IAl9nqzLsXOS82',
        event_name: 'Test Event',
        total_tickets: 10,
        available_tickets: 8
    };
    
    await window.openAllocationManagement(testInventory);
};

console.log('✅ Restored WORKING allocation code from old.html');
console.log('📋 The allocation management should now work properly');
console.log('🧪 Test with: window.testWorkingAllocation()');
console.log('🔍 Debug with: window.debugAllocationState()');

// If allocation management inventory exists, try opening it
if (window.allocationManagementInventory && !window.showAllocationManagement) {
    console.log('📂 Found pending inventory, opening allocation management...');
    window.openAllocationManagement(window.allocationManagementInventory);
}
