// Fix for Allocation Management Modal to Display Allocations

// 1. Enhanced openAllocationManagement function
window.openAllocationManagement = function(inventory) {
    console.log('👁️ openAllocationManagement called with:', inventory?.event_name);
    
    // Set the inventory
    if (window.setAllocationManagementInventory) {
        window.setAllocationManagementInventory(inventory);
    }
    window.allocationManagementInventory = inventory;
    
    // Clear any existing allocations first
    if (window.setCurrentAllocations) {
        window.setCurrentAllocations([]);
    }
    
    // Show the modal
    if (window.setShowAllocationManagement) {
        window.setShowAllocationManagement(true);
    }
    
    // Fetch allocations for this inventory item
    if (inventory && inventory.id) {
        fetchAllocationsForManagement(inventory.id);
    }
};

// 2. Function to fetch allocations for the management modal
async function fetchAllocationsForManagement(inventoryId) {
    try {
        console.log(`📡 Fetching allocations for inventory ${inventoryId}...`);
        
        // Use the correct endpoint we discovered
        const response = await window.apiCall(`/inventory/${inventoryId}/allocations`);
        console.log('Allocations API response:', response);
        
        // Extract allocations from response
        let allocations = [];
        if (response.data && response.data.allocations) {
            allocations = response.data.allocations;
        } else if (response.allocations) {
            allocations = response.allocations;
        } else if (Array.isArray(response)) {
            allocations = response;
        }
        
        console.log(`✅ Found ${allocations.length} allocations`);
        
        // Update state
        if (window.setCurrentAllocations) {
            window.setCurrentAllocations(allocations);
        } else {
            window.currentAllocations = allocations;
        }
        
        // Force re-render
        if (window.forceUpdate) {
            window.forceUpdate();
        }
        
        // Also update the DOM directly if React isn't updating
        setTimeout(() => {
            updateAllocationManagementDisplay(allocations);
        }, 100);
        
    } catch (error) {
        console.error('❌ Failed to fetch allocations:', error);
        if (window.setCurrentAllocations) {
            window.setCurrentAllocations([]);
        }
    }
}

// 3. Function to directly update the DOM if needed
function updateAllocationManagementDisplay(allocations) {
    // Find the container that shows "No allocations found"
    const noAllocationsElement = Array.from(document.querySelectorAll('*')).find(el => 
        el.textContent === 'No allocations found for this inventory item.'
    );
    
    if (!noAllocationsElement) {
        console.log('Could not find allocations container');
        return;
    }
    
    const container = noAllocationsElement.parentElement;
    
    if (allocations.length > 0) {
        console.log('📝 Updating DOM with allocations...');
        
        // Clear the container
        container.innerHTML = '';
        
        // Add allocations
        allocations.forEach((allocation, index) => {
            const allocationDiv = document.createElement('div');
            allocationDiv.className = 'p-4 mb-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600';
            
            allocationDiv.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-semibold text-gray-900 dark:text-white">
                            ${allocation.lead_name || allocation.client_name || `Allocation #${index + 1}`}
                        </p>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Tickets: ${allocation.tickets_allocated || allocation.quantity || 0}
                        </p>
                        ${allocation.allocation_date ? `
                            <p class="text-sm text-gray-500 dark:text-gray-400">
                                Date: ${new Date(allocation.allocation_date).toLocaleDateString()}
                            </p>
                        ` : ''}
                        ${allocation.notes ? `
                            <p class="text-sm text-gray-500 dark:text-gray-400 italic mt-1">
                                "${allocation.notes}"
                            </p>
                        ` : ''}
                    </div>
                    <div class="text-right">
                        ${allocation.status ? `
                            <span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full
                                ${allocation.status === 'confirmed' || allocation.status === 'active' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}">
                                ${allocation.status}
                            </span>
                        ` : ''}
                    </div>
                </div>
            `;
            
            container.appendChild(allocationDiv);
        });
        
        console.log('✅ DOM updated with allocations');
    }
}

// 4. Enhanced setAllocationManagementInventory to fetch allocations
const originalSetAllocationManagementInventory = window.setAllocationManagementInventory;
window.setAllocationManagementInventory = function(inventory) {
    console.log('📦 ENHANCED setAllocationManagementInventory called with:', inventory);
    
    // Call original if exists
    if (originalSetAllocationManagementInventory) {
        originalSetAllocationManagementInventory(inventory);
    }
    
    // Also set on window
    window.allocationManagementInventory = inventory;
    
    // Fetch allocations whenever inventory is set
    if (inventory && inventory.id) {
        fetchAllocationsForManagement(inventory.id);
    }
};

// 5. Fix for renderAllocationManagement if it exists
if (window.renderAllocationManagement) {
    const originalRenderAllocationManagement = window.renderAllocationManagement;
    window.renderAllocationManagement = function() {
        // Get current allocations
        const allocations = window.currentAllocations || [];
        console.log(`🎨 renderAllocationManagement called with ${allocations.length} allocations`);
        
        // Call original render
        const result = originalRenderAllocationManagement();
        
        // If no allocations, try to fetch them
        if (allocations.length === 0 && window.allocationManagementInventory?.id) {
            fetchAllocationsForManagement(window.allocationManagementInventory.id);
        }
        
        return result;
    };
}

// 6. Set up observer to detect when modal opens
const allocationModalObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.textContent?.includes('Allocations for')) {
                console.log('📢 Allocation Management modal detected!');
                
                // Try to fetch allocations if we have inventory
                if (window.allocationManagementInventory?.id) {
                    setTimeout(() => {
                        fetchAllocationsForManagement(window.allocationManagementInventory.id);
                    }, 100);
                }
            }
        });
    });
});

allocationModalObserver.observe(document.body, {
    childList: true,
    subtree: true
});

// 7. Manual refresh function
window.refreshAllocationManagement = function() {
    if (window.allocationManagementInventory?.id) {
        console.log('🔄 Manually refreshing allocations...');
        fetchAllocationsForManagement(window.allocationManagementInventory.id);
    } else {
        console.error('No inventory selected for allocation management');
    }
};

// 8. Debug function to check state
window.debugAllocationManagement = function() {
    console.log('🔍 Allocation Management Debug:');
    console.log('- allocationManagementInventory:', window.allocationManagementInventory);
    console.log('- currentAllocations:', window.currentAllocations);
    console.log('- showAllocationManagement:', window.showAllocationManagement);
    
    // Try to find the modal in DOM
    const modal = document.querySelector('[role="dialog"]');
    console.log('- Modal found:', !!modal);
    
    if (modal) {
        const hasNoAllocationsText = modal.textContent.includes('No allocations found');
        console.log('- Shows "No allocations" text:', hasNoAllocationsText);
    }
};

console.log('✅ Allocation Management fix loaded!');
console.log('📋 Commands:');
console.log('- window.refreshAllocationManagement() - Manually refresh allocations');
console.log('- window.debugAllocationManagement() - Debug current state');

// Auto-fetch if modal is already open
if (window.showAllocationManagement && window.allocationManagementInventory?.id) {
    console.log('🔄 Modal already open, fetching allocations...');
    fetchAllocationsForManagement(window.allocationManagementInventory.id);
}
