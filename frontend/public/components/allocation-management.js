// Complete fix for Allocation Management - Prevents page refresh and ensures modal opens

// 1. First, ensure the render function is available
if (!window.renderAllocationManagement) {
    console.error('❌ renderAllocationManagement not found! Please ensure allocation-management.js is loaded');
}

// 2. Fix the openAllocationManagement function to match old.html working version
window.openAllocationManagement = async function(inventoryItem) {
    console.log('📂 Opening allocation management for:', inventoryItem?.event_name);
    
    try {
        // Prevent any default behaviors
        if (window.event) {
            window.event.preventDefault();
            window.event.stopPropagation();
        }
        
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
        console.log('📡 Fetching allocations...');
        const response = await window.apiCall(`/inventory/${inventoryItem.id}/allocations`);
        console.log('Allocations response:', response);

        if (response.error) {
            throw new Error(response.error);
        }

        // Set the allocations
        const allocations = response.data?.allocations || [];
        if (window.setCurrentAllocations) {
            window.setCurrentAllocations(allocations);
        }
        window.currentAllocations = allocations;
        
        // Show the modal
        if (window.setShowAllocationManagement) {
            window.setShowAllocationManagement(true);
        }
        window.showAllocationManagement = true;
        
        // Also update appState if it exists
        if (window.appState) {
            window.appState.showAllocationManagement = true;
            window.appState.allocationManagementInventory = inventoryItem;
            window.appState.currentAllocations = allocations;
        }
        
        // Force update
        if (window.forceUpdate) {
            window.forceUpdate();
        }
        
        // If renderApp exists, call it
        if (window.renderApp) {
            window.renderApp();
        }
        
        console.log('✅ Modal should now be visible');

    } catch (error) {
        console.error('❌ Error in openAllocationManagement:', error);
        alert('Error fetching allocations: ' + error.message);
    } finally {
        if (window.setLoading) {
            window.setLoading(false);
        }
    }
    
    // Return false to prevent any default behavior
    return false;
};

// 3. Intercept ALL allocation button clicks to prevent page refresh
document.addEventListener('click', function(e) {
    const target = e.target;
    
    // Check if it's an allocation button
    if (target.matches('button[title*="allocation" i], button[class*="allocation" i]') || 
        target.closest('button[title*="allocation" i], button[class*="allocation" i]')) {
        
        console.log('🛑 Allocation button clicked - preventing default');
        e.preventDefault();
        e.stopPropagation();
        
        // Find the inventory data
        const button = target.closest('button');
        const row = button?.closest('tr');
        
        if (row) {
            // Extract inventory data from the row
            const cells = row.querySelectorAll('td');
            const inventory = {
                id: row.getAttribute('data-id') || row.id,
                event_name: cells[0]?.textContent?.trim(),
                event_date: cells[1]?.textContent?.trim(),
                event_type: cells[2]?.textContent?.trim(),
                total_tickets: parseInt(cells[3]?.textContent) || 0,
                available_tickets: parseInt(cells[4]?.textContent) || 0
            };
            
            // Call our function
            window.openAllocationManagement(inventory);
        }
        
        return false;
    }
}, true); // Use capture phase

// 4. Also override onclick handlers on existing buttons
setTimeout(() => {
    const allocationButtons = document.querySelectorAll('button[title*="allocation" i], button[class*="allocation" i]');
    allocationButtons.forEach(button => {
        const originalOnclick = button.onclick;
        button.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Call original onclick if it exists
            if (originalOnclick) {
                originalOnclick.call(this, e);
            }
            
            return false;
        };
    });
    console.log(`✅ Fixed ${allocationButtons.length} allocation button(s)`);
}, 1000);

// 5. Ensure state setters exist
if (!window.setShowAllocationManagement) {
    window.setShowAllocationManagement = function(value) {
        console.log('📝 setShowAllocationManagement:', value);
        window.showAllocationManagement = value;
        
        if (window.appState) {
            window.appState.showAllocationManagement = value;
        }
        
        // Force re-render
        if (window.forceUpdate) {
            window.forceUpdate();
        }
        if (window.renderApp) {
            window.renderApp();
        }
    };
}

if (!window.setCurrentAllocations) {
    window.setCurrentAllocations = function(value) {
        console.log('📝 setCurrentAllocations:', value?.length || 0, 'items');
        window.currentAllocations = value;
        
        if (window.appState) {
            window.appState.currentAllocations = value;
        }
        
        // Force re-render
        if (window.forceUpdate) {
            window.forceUpdate();
        }
    };
}

if (!window.setAllocationManagementInventory) {
    window.setAllocationManagementInventory = function(value) {
        console.log('📝 setAllocationManagementInventory:', value?.event_name);
        window.allocationManagementInventory = value;
        
        if (window.appState) {
            window.appState.allocationManagementInventory = value;
        }
    };
}

// 6. Debug function
window.debugAllocation = function() {
    console.log('🔍 Allocation Debug:');
    console.log('- renderAllocationManagement exists:', !!window.renderAllocationManagement);
    console.log('- showAllocationManagement:', window.showAllocationManagement);
    console.log('- allocationManagementInventory:', window.allocationManagementInventory);
    console.log('- currentAllocations:', window.currentAllocations?.length || 0);
    console.log('- Modal in DOM:', !!document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50'));
    
    // Try to render the modal manually
    if (window.renderAllocationManagement) {
        const result = window.renderAllocationManagement();
        console.log('- renderAllocationManagement result:', result ? 'React element' : 'null');
    }
};

// 7. Manual test function
window.testAllocation = async function() {
    const testInventory = {
        id: 'xXRLE5IAl9nqzLsXOS82',
        event_name: 'Test Event',
        total_tickets: 10,
        available_tickets: 8
    };
    
    await window.openAllocationManagement(testInventory);
    
    // Check if modal appeared
    setTimeout(() => {
        window.debugAllocation();
    }, 1000);
};

console.log('✅ Complete allocation management fix applied');
console.log('📋 Debug with: window.debugAllocation()');
console.log('🧪 Test with: window.testAllocation()');
console.log('🔄 Try clicking the allocation button again - it should work now');
