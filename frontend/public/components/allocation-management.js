// Enhanced Allocation Management Component for FanToPark CRM
// Now displays category information and category-wise summaries

// Define the unallocation handler first so it's available to the render function
window.handleUnallocate = window.handleUnallocate || (async (allocationId, ticketsToReturn, categoryName) => {
  console.log("🗑️ [ALLOC-MGMT] Unallocate called:", allocationId, ticketsToReturn, categoryName);
  
  if (!confirm(`Are you sure you want to unallocate ${ticketsToReturn} tickets${categoryName ? ' from ' + categoryName + ' category' : ''}?`)) {
    return;
  }

  // Prevent concurrent unallocations
  if (window._unallocationInProgress) {
    console.warn('⚠️ Unallocation already in progress, skipping');
    return;
  }
  
  window._unallocationInProgress = true;
  
  // CRITICAL: Store modal state before any async operations
  const modalOpenAtStart = window.showAllocationManagement || window.appState?.showAllocationManagement;
  console.log("📊 [ALLOC-MGMT] Modal open at start:", modalOpenAtStart);

  try {
    if (window.setLoading) {
      window.setLoading(true);
    }
    
    const inventoryId = window.allocationManagementInventory.id;
    console.log("🔄 [ALLOC-MGMT] Deleting allocation for inventory:", inventoryId);
    
    const response = await window.apiCall(`/inventory/${inventoryId}/allocations/${allocationId}`, {
      method: 'DELETE'
    });

    if (response.error) {
      throw new Error(response.error);
    }

    console.log("✅ [ALLOC-MGMT] Unallocation API success:", response);

    // CRITICAL FIX: Close modal first to avoid React DOM conflicts
    console.log("🚪 [ALLOC-MGMT] Closing modal to prevent DOM errors");
    
    // Close the modal immediately
    if (window.setShowAllocationManagement) {
      window.setShowAllocationManagement(false);
    }
    
    // Update inventory state after modal is closed
    setTimeout(() => {
      console.log("🔄 [ALLOC-MGMT] Updating inventory after modal closed");
      
      try {
        if (window.setInventory) {
          if (response.categories) {
            window.setInventory(prev => prev.map(item => 
              item.id === inventoryId 
                ? { ...item, categories: response.categories, available_tickets: response.new_available_tickets }
                : item
            ));
          } else {
            window.setInventory(prev => prev.map(item => 
              item.id === inventoryId 
                ? { ...item, available_tickets: response.new_available_tickets }
                : item
            ));
          }
        }
      } catch (stateError) {
        console.warn('⚠️ Error updating inventory state:', stateError.message);
      }
      
      // Show success message after state updates
      alert(`Successfully unallocated ${ticketsToReturn} tickets${categoryName ? ' from ' + categoryName : ''}`);
      
    }, 50); // Small delay to ensure modal unmounts cleanly

  } catch (error) {
    console.error('Unallocate error:', error);
    alert('Failed to unallocate: ' + error.message);
  } finally {
    if (window.setLoading) {
      window.setLoading(false);
    }
    // Clear the lock
    window._unallocationInProgress = false;
  }
});

window.exportAllocationsToCSV = (allocations, inventoryName, hasCategories) => {
  try {
    // Define CSV headers based on whether categories exist
    const headers = hasCategories ? [
      'Lead Name',
      'Lead Phone',
      'Company',
      'Category',
      'Section/Stand',
      'Tickets Allocated',
      'Price per Ticket',
      'Total Amount',
      'Allocated By',
      'Notes'
    ] : [
      'Lead Name',
      'Lead Phone',
      'Company',
      'Section/Stand',
      'Tickets Allocated',
      'Price per Ticket',
      'Total Amount',
      'Allocated By',
      'Notes'
    ];

    // Build CSV content
    let csvContent = headers.join(',') + '\n';

    allocations.forEach(allocation => {
      // Get lead details
      const leadName = allocation.lead_details?.name || allocation.lead_name || 'Unknown';
      const leadPhone = allocation.lead_details?.phone || '';
      const leadCompany = allocation.lead_details?.company || '';

      // Get pricing info
      let pricePerTicket = 0;
      let sectionInfo = '';
      
      // Get section/stand info
      if (allocation.category_section) {
        sectionInfo = allocation.category_section;
      } else if (allocation.category_details && allocation.category_details.section) {
        sectionInfo = allocation.category_details.section;
      } else if (hasCategories && allocation.category_name) {
        const category = window.allocationManagementInventory.categories.find(cat => cat.name === allocation.category_name);
        if (category && category.section) {
          sectionInfo = category.section;
        }
      }
      
      if (allocation.category_details?.selling_price) {
        pricePerTicket = allocation.category_details.selling_price;
      } else if (window.allocationManagementInventory?.selling_price) {
        pricePerTicket = window.allocationManagementInventory.selling_price;
      }

      const totalAmount = (allocation.tickets_allocated || 0) * pricePerTicket;
      const allocatedBy = allocation.created_by || '';
      const notes = (allocation.notes || '').replace(/,/g, ';'); // Replace commas to avoid CSV issues

      // Build row based on whether categories exist
      const row = hasCategories ? [
        `"${leadName}"`,
        `"${leadPhone}"`,
        `"${leadCompany}"`,
        `"${allocation.category_name || 'General'}"`,
        `"${sectionInfo}"`,
        allocation.tickets_allocated || 0,
        pricePerTicket,
        totalAmount,
        `"${allocatedBy}"`,
        `"${notes}"`
      ] : [
        `"${leadName}"`,
        `"${leadPhone}"`,
        `"${leadCompany}"`,
        `"${sectionInfo}"`,
        allocation.tickets_allocated || 0,
        pricePerTicket,
        totalAmount,
        `"${allocatedBy}"`,
        `"${notes}"`
      ];

      csvContent += row.join(',') + '\n';
    });

    // Add summary at the end
    csvContent += '\n\nSUMMARY\n';
    csvContent += `Total Allocations,${allocations.length}\n`;
    csvContent += `Total Tickets Allocated,${allocations.reduce((sum, a) => sum + (a.tickets_allocated || 0), 0)}\n`;
    csvContent += `Total Value,₹${allocations.reduce((sum, a) => {
      let price = 0;
      if (a.category_details?.selling_price) {
        price = a.category_details.selling_price;
      } else if (window.allocationManagementInventory?.selling_price) {
        price = window.allocationManagementInventory.selling_price;
      }
      return sum + ((a.tickets_allocated || 0) * price);
    }, 0).toLocaleString()}\n`;

    // Category-wise summary if applicable with unique category+section combinations
    if (hasCategories && window.allocationManagementInventory?.categories) {
      csvContent += '\nCATEGORY-WISE BREAKDOWN\n';
      csvContent += 'Category - Section,Total Tickets,Available,Allocated\n';
      
      const categoryStats = {};
      window.allocationManagementInventory.categories.forEach(cat => {
        const uniqueKey = `${cat.name}${cat.section ? ' - ' + cat.section : ''}`;
        categoryStats[uniqueKey] = {
          total: cat.total_tickets || 0,
          available: cat.available_tickets || 0,
          allocated: 0
        };
      });

      allocations.forEach(a => {
        if (a.category_name) {
          // Get section info for this allocation
          let sectionInfo = '';
          if (a.category_section) {
            sectionInfo = a.category_section;
          } else if (a.category_details && a.category_details.section) {
            sectionInfo = a.category_details.section;
          } else {
            const category = window.allocationManagementInventory.categories.find(cat => cat.name === a.category_name);
            if (category && category.section) {
              sectionInfo = category.section;
            }
          }
          
          const uniqueKey = `${a.category_name}${sectionInfo ? ' - ' + sectionInfo : ''}`;
          if (categoryStats[uniqueKey]) {
            categoryStats[uniqueKey].allocated += (a.tickets_allocated || 0);
          }
        }
      });

      Object.entries(categoryStats).forEach(([catName, stats]) => {
        csvContent += `"${catName}",${stats.total},${stats.available},${stats.allocated}\n`;
      });
    }

    // Create filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${inventoryName.replace(/[^a-z0-9]/gi, '_')}_allocations_${timestamp}.csv`;

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (navigator.msSaveBlob) { // IE 10+
      navigator.msSaveBlob(blob, filename);
    } else {
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    console.log(`✅ Exported ${allocations.length} allocations to ${filename}`);
    return true;
  } catch (error) {
    console.error('Export error:', error);
    alert('Failed to export allocations: ' + error.message);
    return false;
  }
};

window.renderAllocationManagement = () => {
  // ✅ PATTERN 1: State Variable Extraction (CRITICAL FIX)
  const {
    showAllocationManagement = window.appState?.showAllocationManagement || window.showAllocationManagement,
    allocationManagementInventory = window.appState?.allocationManagementInventory || window.allocationManagementInventory,
    currentAllocations = window.appState?.currentAllocations || window.currentAllocations || [],
    loading = window.appState?.loading || window.loading
  } = window.appState || {};
  
  // Check if allocations are still being loaded (when modal is open but allocations not yet set)
  const allocationsLoading = showAllocationManagement && allocationManagementInventory && 
    (currentAllocations === null || (loading && (!Array.isArray(currentAllocations) || currentAllocations.length === 0)));

  // ✅ PATTERN 2: Function References with Fallbacks
  const setShowAllocationManagement = window.setShowAllocationManagement || (() => {
    console.warn("setShowAllocationManagement not implemented");
  });
  
  const openAllocationForm = window.openAllocationForm || ((inventory) => {
    console.warn("openAllocationForm not implemented");
    console.log("Would open allocation form for:", inventory);
  });
  
  const handleUnallocate = window.handleUnallocate || ((allocationId, tickets, categoryName) => {
    console.warn("⚠️ [ALLOC-MGMT] handleUnallocate fallback called - global function not available");
    console.log("📊 [ALLOC-MGMT] Would unallocate:", allocationId, tickets, "from category:", categoryName);
    console.log("🔍 [ALLOC-MGMT] window.handleUnallocate type:", typeof window.handleUnallocate);
  });

  if (!showAllocationManagement || !allocationManagementInventory) {
    console.log("❌ Not showing allocation management:", {
      showAllocationManagement,
      hasInventory: !!allocationManagementInventory
    });
    return null;
  }

  // NEW: Check if inventory has categories (MOVED UP to fix hoisting error)
  const hasCategories = allocationManagementInventory.categories && 
    Array.isArray(allocationManagementInventory.categories) && 
    allocationManagementInventory.categories.length > 0;

  // Track expanded categories in window state
  if (!window.expandedAllocationCategories) {
    window.expandedAllocationCategories = {};
  }

  // Toggle category expansion
  const toggleCategory = (categoryKey) => {
    window.expandedAllocationCategories[categoryKey] = !window.expandedAllocationCategories[categoryKey];
    // Force re-render by updating a state variable
    if (window.setShowAllocationManagement) {
      window.setShowAllocationManagement(true);
    }
  };

  // ✅ Enhanced Debug Logging
  console.log("🔍 ALLOCATION MANAGEMENT DEBUG:");
  console.log("showAllocationManagement:", showAllocationManagement);
  console.log("allocationManagementInventory:", allocationManagementInventory?.event_name);
  console.log("currentAllocations count:", currentAllocations?.length || 0);
  console.log("🔍 Current allocations data:", currentAllocations);
  console.log("🔍 Inventory has categories:", hasCategories);
  console.log("🔍 Inventory categories:", allocationManagementInventory?.categories);

  // NEW: Calculate category-wise allocation summary with unique category+section combinations
  const categoryAllocationSummary = {};
  if (hasCategories && Array.isArray(currentAllocations)) {
    // Initialize summary for each unique category+section combination
    allocationManagementInventory.categories.forEach(cat => {
      const uniqueKey = `${cat.name}${cat.section ? ' - ' + cat.section : ''}`;
      categoryAllocationSummary[uniqueKey] = {
        categoryName: cat.name,
        section: cat.section || '',
        totalTickets: cat.total_tickets || 0,
        originalAvailable: cat.available_tickets || 0,
        allocated: 0,
        allocations: []
      };
    });

    // Count allocations per unique category+section combination
    currentAllocations.forEach(allocation => {
      const categoryName = allocation.category_name || allocation.category_of_ticket || 'General';
      
      // Get section info for this allocation
      let sectionInfo = '';
      if (allocation.category_section) {
        sectionInfo = allocation.category_section;
      } else if (allocation.category_details && allocation.category_details.section) {
        sectionInfo = allocation.category_details.section;
      } else if (allocation.category_name) {
        const category = allocationManagementInventory.categories.find(cat => cat.name === allocation.category_name);
        if (category && category.section) {
          sectionInfo = category.section;
        }
      }
      
      const uniqueKey = `${categoryName}${sectionInfo ? ' - ' + sectionInfo : ''}`;
      
      if (categoryAllocationSummary[uniqueKey]) {
        categoryAllocationSummary[uniqueKey].allocated += (allocation.tickets_allocated || 0);
        categoryAllocationSummary[uniqueKey].allocations.push(allocation);
      }
    });
  } else if (!hasCategories && Array.isArray(currentAllocations)) {
    // No categories - create a single "General" category for all allocations
    categoryAllocationSummary['General'] = {
      categoryName: 'General',
      section: '',
      totalTickets: allocationManagementInventory.total_tickets || 0,
      originalAvailable: allocationManagementInventory.available_tickets || 0,
      allocated: currentAllocations.reduce((sum, a) => sum + (a.tickets_allocated || 0), 0),
      allocations: currentAllocations
    };
  }

  // Calculate total allocation value
  const totalAllocationValue = Array.isArray(currentAllocations) ? 
    currentAllocations.reduce((sum, allocation) => {
      const tickets = allocation.tickets_allocated || 0;
      let pricePerTicket = allocationManagementInventory.selling_price || 0;
      
      // Use category-specific pricing if available
      if (allocation.category_details && allocation.category_details.selling_price) {
        pricePerTicket = allocation.category_details.selling_price;
      } else if (hasCategories && allocation.category_name) {
        const category = allocationManagementInventory.categories.find(cat => cat.name === allocation.category_name);
        if (category && category.selling_price) {
          pricePerTicket = category.selling_price;
        }
      }
      
      return sum + (tickets * pricePerTicket);
    }, 0) : 0;

  return React.createElement('div', { 
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40'
  },
    React.createElement('div', { 
      className: 'bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto'
    },
      React.createElement('div', { className: 'flex justify-between items-center mb-4' },
        React.createElement('h2', { className: 'text-xl font-bold dark:text-white' }, 
          'Allocations for ' + (allocationManagementInventory.event_name || 'Unknown Event')
        ),
        React.createElement('button', {
          onClick: () => setShowAllocationManagement(false),
          className: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        }, '✕')
      ),

      // Enhanced Inventory Details with Category Breakdown
      React.createElement('div', { className: 'mb-6' },
        // Overall Summary
        React.createElement('div', { className: 'mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded' },
          React.createElement('h3', { className: 'font-semibold dark:text-white mb-2' }, 'Overall Summary'),
          React.createElement('div', { className: 'grid grid-cols-4 gap-4' },
            React.createElement('div', null,
              React.createElement('p', { className: 'text-sm text-gray-600 dark:text-gray-400' }, 'Total Tickets'),
              React.createElement('p', { className: 'text-lg font-bold dark:text-white' }, 
                allocationManagementInventory.total_tickets || 'N/A'
              )
            ),
            React.createElement('div', null,
              React.createElement('p', { className: 'text-sm text-gray-600 dark:text-gray-400' }, 'Available'),
              React.createElement('p', { className: 'text-lg font-bold text-green-600 dark:text-green-400' }, 
                allocationManagementInventory.available_tickets || 0
              )
            ),
            React.createElement('div', null,
              React.createElement('p', { className: 'text-sm text-gray-600 dark:text-gray-400' }, 'Allocated'),
              React.createElement('p', { className: 'text-lg font-bold text-blue-600 dark:text-blue-400' }, 
                (allocationManagementInventory.total_tickets || 0) - (allocationManagementInventory.available_tickets || 0)
              )
            ),
            React.createElement('div', null,
              React.createElement('p', { className: 'text-sm text-gray-600 dark:text-gray-400' }, 'Total Value'),
              React.createElement('p', { className: 'text-lg font-bold text-purple-600 dark:text-purple-400' }, 
                `₹${totalAllocationValue.toLocaleString()}`
              )
            )
          )
        ),

      ),

      // Loading State
      allocationsLoading ? 
      React.createElement('div', { className: 'flex items-center justify-center py-16' },
        React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4' }),
          React.createElement('p', { className: 'text-gray-600 dark:text-gray-400' }, 'Loading allocations...')
        )
      ) :
      // Collapsible Category-wise Allocations
      !Array.isArray(currentAllocations) || currentAllocations.length === 0 ? 
      React.createElement('div', { className: 'text-center py-8 text-gray-500 dark:text-gray-400' },
        'No allocations found for this inventory item.'
      ) :
      React.createElement('div', { className: 'space-y-3' },
        Object.entries(categoryAllocationSummary).map(([categoryKey, summary]) => {
          const isExpanded = window.expandedAllocationCategories[categoryKey] || false;
          
          return React.createElement('div', { 
            key: `category-section-${categoryKey}`,
            className: 'border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden'
          },
            // Category Header
            React.createElement('div', { 
              className: 'bg-gray-50 dark:bg-gray-700 p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600',
              onClick: () => toggleCategory(categoryKey)
            },
              React.createElement('div', { className: 'flex justify-between items-center' },
                React.createElement('div', { className: 'flex items-center space-x-3' },
                  // Expand/Collapse Icon
                  React.createElement('span', { className: 'text-lg' }, isExpanded ? '−' : '+'),
                  // Category Name
                  React.createElement('h4', { className: 'font-semibold text-lg dark:text-white' }, categoryKey),
                  // Allocation Count Badge
                  React.createElement('span', { 
                    className: 'px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                  }, `${summary.allocations.length} allocations`)
                ),
                // Category Summary
                React.createElement('div', { className: 'flex space-x-4 text-sm' },
                  React.createElement('span', { className: 'text-gray-600 dark:text-gray-400' },
                    `Total: ${summary.totalTickets}`
                  ),
                  React.createElement('span', { className: 'text-green-600 dark:text-green-400' },
                    `Available: ${Math.max(0, summary.totalTickets - summary.allocated)}`
                  ),
                  React.createElement('span', { className: 'text-blue-600 dark:text-blue-400' },
                    `Allocated: ${summary.allocated}`
                  )
                )
              )
            ),
            
            // Expanded Content - Allocations Table
            isExpanded && React.createElement('div', { className: 'p-4 bg-white dark:bg-gray-800' },
              React.createElement('div', { className: 'overflow-x-auto' },
                React.createElement('table', { className: 'min-w-full' },
                  React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-700' },
                    React.createElement('tr', null,
                      React.createElement('th', { className: 'px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider' }, 'Lead Name'),
                      React.createElement('th', { className: 'px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider' }, 'Phone'),
                      React.createElement('th', { className: 'px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider' }, 'Company'),
                      React.createElement('th', { className: 'px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider' }, 'Tickets'),
                      React.createElement('th', { className: 'px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider' }, 'Price/Ticket'),
                      React.createElement('th', { className: 'px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider' }, 'Total'),
                      React.createElement('th', { className: 'px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider' }, 'Notes'),
                      React.createElement('th', { className: 'px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider' }, 'Actions')
                    )
                  ),
                  React.createElement('tbody', { className: 'bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700' },
                    summary.allocations.map((allocation, index) => {
                      // Determine price per ticket for this allocation
                      let pricePerTicket = allocationManagementInventory.selling_price || 0;
                      if (allocation.category_details && allocation.category_details.selling_price) {
                        pricePerTicket = allocation.category_details.selling_price;
                      } else if (hasCategories && allocation.category_name) {
                        const category = allocationManagementInventory.categories.find(cat => cat.name === allocation.category_name);
                        if (category && category.selling_price) {
                          pricePerTicket = category.selling_price;
                        }
                      }
                      
                      const totalValue = (allocation.tickets_allocated || 0) * pricePerTicket;
                      const leadPhone = allocation.lead_details?.phone || '';
                      const leadCompany = allocation.lead_details?.company || '';

                      return React.createElement('tr', { 
                        key: allocation.id || `allocation-${categoryKey}-${index}`,
                        className: 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      },
                        React.createElement('td', { className: 'px-4 py-2 text-sm dark:text-gray-300' },
                          allocation.lead_details?.name || allocation.lead_name || 'Unknown'
                        ),
                        React.createElement('td', { className: 'px-4 py-2 text-sm dark:text-gray-300' },
                          leadPhone || '-'
                        ),
                        React.createElement('td', { className: 'px-4 py-2 text-sm dark:text-gray-300' },
                          leadCompany || '-'
                        ),
                        React.createElement('td', { className: 'px-4 py-2 text-sm dark:text-gray-300 text-center' }, 
                          allocation.tickets_allocated || 0
                        ),
                        React.createElement('td', { className: 'px-4 py-2 text-sm dark:text-gray-300' }, 
                          `₹${pricePerTicket.toLocaleString()}`
                        ),
                        React.createElement('td', { className: 'px-4 py-2 text-sm dark:text-gray-300 font-medium' }, 
                          `₹${totalValue.toLocaleString()}`
                        ),
                        React.createElement('td', { className: 'px-4 py-2 text-sm dark:text-gray-300' }, 
                          allocation.notes || '-'
                        ),
                        React.createElement('td', { className: 'px-4 py-2 text-center' },
                          React.createElement('div', { className: 'flex space-x-2 justify-center' },
                            // Link/Reassign button
                            allocation.order_ids && allocation.order_ids.length > 0 ? 
                            React.createElement('button', {
                              onClick: () => window.showReassignAllocationModal(allocation),
                              className: 'bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:opacity-50',
                              disabled: loading,
                              title: `Reassign allocation to different order`
                            }, '🔄') :
                            React.createElement('button', {
                              onClick: () => window.showReassignAllocationModal(allocation),
                              className: 'bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:opacity-50',
                              disabled: loading,
                              title: `Link allocation to order`
                            }, '🔗'),
                            // Unallocate button
                            React.createElement('button', {
                              onClick: () => handleUnallocate(allocation.id, allocation.tickets_allocated, allocation.category_name),
                              className: 'bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 disabled:opacity-50',
                              disabled: loading,
                              title: `Unallocate ${allocation.tickets_allocated} tickets from ${allocation.category_name}`
                            }, loading ? 'Processing...' : 'Unallocate')
                          )
                        )
                      );
                    })
                  )
                )
              )
            )
          );
        })
      ),

      // Footer Actions
      React.createElement('div', { className: 'mt-6 flex justify-between items-center' },
        React.createElement('div', { className: 'flex items-center space-x-4' },
    React.createElement('span', { className: 'text-sm text-gray-600 dark:text-gray-400' },
      `Total Allocations: ${Array.isArray(currentAllocations) ? currentAllocations.length : 0}`
    ),
    // NEW: Export button
    Array.isArray(currentAllocations) && currentAllocations.length > 0 && React.createElement('button', {
      onClick: () => window.exportAllocationsToCSV(
        currentAllocations, 
        allocationManagementInventory.event_name || 'inventory',
        hasCategories
      ),
      className: 'text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 flex items-center space-x-1',
      title: 'Export allocations to CSV'
    }, 
      React.createElement('span', null, '📥'),
      React.createElement('span', null, 'Export CSV')
    )
  ),
  React.createElement('div', { className: 'flex space-x-3' },
    React.createElement('button', {
      onClick: () => openAllocationForm(allocationManagementInventory),
      className: 'bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50',
      disabled: (allocationManagementInventory.available_tickets || 0) <= 0
    }, 'Add New Allocation'),
    React.createElement('button', {
      onClick: () => setShowAllocationManagement(false),
      className: 'bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600'
    }, 'Close')
  )
)
    )
  );
};

// REMOVED: Duplicate handleUnallocate function - now defined at the top of the file

console.log('✅ Enhanced Allocation Management with Category Support loaded successfully');
