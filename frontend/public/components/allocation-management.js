// Fix for Allocation Modal State Management - Corrected Version

// 1. First, let's find where the state should be
window.findAllocationModalState = function() {
    console.log('🔍 Searching for allocation modal state...\n');
    
    // Check window object
    console.log('window.showAllocationManagement:', window.showAllocationManagement);
    console.log('window.setShowAllocationManagement:', typeof window.setShowAllocationManagement);
    
    // Check appState
    if (window.appState) {
        console.log('\nIn appState:');
        console.log('- showAllocationManagement:', window.appState.showAllocationManagement);
        console.log('- setShowAllocationManagement:', typeof window.appState.setShowAllocationManagement);
    }
    
    // Check for any state-related variables
    const stateVars = Object.keys(window).filter(key => 
        key.toLowerCase().includes('allocation') && 
        (key.includes('show') || key.includes('open') || key.includes('visible'))
    );
    console.log('\nAllocation-related state variables:', stateVars);
    
    // Check React components
    const components = Object.keys(window).filter(key => 
        key.includes('AllocationManagement') || 
        key.includes('renderAllocation')
    );
    console.log('\nAllocation components:', components);
};

// 2. Initialize the state if it doesn't exist
window.initializeAllocationModalState = function() {
    console.log('🔧 Initializing allocation modal state...');
    
    // Create state if it doesn't exist
    if (!window.showAllocationManagement) {
        window.showAllocationManagement = false;
        console.log('✅ Created showAllocationManagement state');
    }
    
    // Create setter if it doesn't exist
    if (!window.setShowAllocationManagement || typeof window.setShowAllocationManagement !== 'function') {
        window.setShowAllocationManagement = function(value) {
            console.log('📝 setShowAllocationManagement called with: ' + value);
            window.showAllocationManagement = value;
            
            // Also update appState if it exists
            if (window.appState) {
                window.appState.showAllocationManagement = value;
            }
            
            // Force re-render
            if (window.forceUpdate) {
                window.forceUpdate();
            }
            
            // If renderApp exists, call it
            if (window.renderApp) {
                window.renderApp();
            }
            
            // Trigger custom event for any listeners
            const event = new CustomEvent('allocationModalStateChanged', { detail: { show: value } });
            document.dispatchEvent(event);
        };
        console.log('✅ Created setShowAllocationManagement function');
    }
};

// 3. Create a manual modal opener that definitely works
window.openAllocationModalManually = function(inventory) {
    console.log('🚀 Manually opening allocation modal...');
    
    // Set inventory
    if (!inventory && window.inventory && window.inventory.length > 0) {
        inventory = window.inventory[0];
        console.log('Using first inventory item:', inventory.event_name);
    }
    
    if (inventory) {
        window.allocationManagementInventory = inventory;
        if (window.setAllocationManagementInventory) {
            window.setAllocationManagementInventory(inventory);
        }
    }
    
    // Create and inject modal directly into DOM
    const existingModal = document.querySelector('.allocation-management-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'allocation-management-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.setAttribute('role', 'dialog');
    
    const eventName = inventory?.event_name || 'Unknown Event';
    const totalTickets = inventory?.total_tickets || 0;
    const availableTickets = inventory?.available_tickets || 0;
    const allocatedTickets = totalTickets - availableTickets;
    
    modal.innerHTML = '<div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">' +
        '<div class="flex justify-between items-center mb-6">' +
            '<h2 class="text-2xl font-bold text-gray-900 dark:text-white">Allocations for ' + eventName + '</h2>' +
            '<button onclick="this.closest(\'.allocation-management-modal\').remove()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl">✕</button>' +
        '</div>' +
        '<div class="mb-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">' +
            '<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">' +
                '<div>' +
                    '<span class="font-medium text-gray-600 dark:text-gray-400">Total Tickets:</span>' +
                    '<span class="ml-2 font-bold">' + totalTickets + '</span>' +
                '</div>' +
                '<div>' +
                    '<span class="font-medium text-gray-600 dark:text-gray-400">Available:</span>' +
                    '<span class="ml-2 font-bold text-green-600">' + availableTickets + '</span>' +
                '</div>' +
                '<div>' +
                    '<span class="font-medium text-gray-600 dark:text-gray-400">Allocated:</span>' +
                    '<span class="ml-2 font-bold text-blue-600">' + allocatedTickets + '</span>' +
                '</div>' +
                '<div>' +
                    '<button onclick="window.refreshAllocationsInModal()" class="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600">🔄 Refresh</button>' +
                '</div>' +
            '</div>' +
        '</div>' +
        '<div class="allocations-list-container">' +
            '<div class="text-center py-8 text-gray-500">Loading allocations...</div>' +
        '</div>' +
        '<div class="mt-6 flex justify-between">' +
            '<button onclick="window.openAllocationForm(window.allocationManagementInventory)" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">+ Add New Allocation</button>' +
            '<button onclick="this.closest(\'.allocation-management-modal\').remove()" class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">Close</button>' +
        '</div>' +
    '</div>';
    
    document.body.appendChild(modal);
    console.log('✅ Modal added to DOM');
    
    // Fetch allocations
    if (inventory?.id) {
        window.refreshAllocationsInModal();
    }
};

// 4. Function to refresh allocations in the manual modal
window.refreshAllocationsInModal = async function() {
    const container = document.querySelector('.allocations-list-container');
    if (!container) return;
    
    const inventoryId = window.allocationManagementInventory?.id;
    if (!inventoryId) {
        container.innerHTML = '<div class="text-center py-8 text-red-500">No inventory selected</div>';
        return;
    }
    
    try {
        container.innerHTML = '<div class="text-center py-8 text-gray-500">Loading allocations...</div>';
        
        const response = await window.apiCall('/inventory/' + inventoryId + '/allocations');
        let allocations = [];
        
        if (response.data && response.data.allocations) {
            allocations = response.data.allocations;
        }
        
        if (allocations.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-gray-500">No allocations found for this inventory item.</div>';
        } else {
            let html = '';
            allocations.forEach(function(alloc, i) {
                const leadName = alloc.lead_name || alloc.client_name || ('Allocation #' + (i + 1));
                const tickets = alloc.tickets_allocated || alloc.quantity || 0;
                const dateStr = alloc.allocation_date ? ('<p class="text-sm text-gray-500">Date: ' + new Date(alloc.allocation_date).toLocaleDateString() + '</p>') : '';
                
                html += '<div class="p-4 mb-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">' +
                    '<div class="flex justify-between items-start">' +
                        '<div>' +
                            '<p class="font-semibold text-gray-900 dark:text-white">' + leadName + '</p>' +
                            '<p class="text-sm text-gray-600 dark:text-gray-400">Tickets: ' + tickets + '</p>' +
                            dateStr +
                        '</div>' +
                    '</div>' +
                '</div>';
            });
            container.innerHTML = html;
        }
        
        console.log('✅ Displayed ' + allocations.length + ' allocations');
        
    } catch (error) {
        console.error('❌ Error fetching allocations:', error);
        container.innerHTML = '<div class="text-center py-8 text-red-500">Error loading allocations</div>';
    }
};

// 5. Fix the original openAllocationManagement function
window.fixOpenAllocationManagement = function() {
    window.openAllocationManagement = function(inventory) {
        console.log('🔄 Fixed openAllocationManagement called');
        
        // Try the manual approach since React state seems broken
        window.openAllocationModalManually(inventory);
    };
    console.log('✅ Replaced openAllocationManagement with manual version');
};

// Run diagnostics and apply fixes
console.log('🚀 Running allocation modal fixes...\n');

// First, find the current state
window.findAllocationModalState();

// Initialize state if needed
window.initializeAllocationModalState();

// Fix the open function
window.fixOpenAllocationManagement();

console.log('\n✅ Allocation modal fixes applied!');
console.log('\n📋 Available commands:');
console.log('- window.openAllocationModalManually() - Open modal manually');
console.log('- window.refreshAllocationsInModal() - Refresh allocations in modal');
console.log('- Click the allocation icon again - it should work now');

// Also try to open if there's a pending inventory
if (window.allocationManagementInventory) {
    console.log('\n📂 Found pending inventory, opening modal...');
    window.openAllocationModalManually(window.allocationManagementInventory);
}
