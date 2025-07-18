// Replace your existing website-leads-import.js with this enhanced version

window.WebsiteLeadsImport = function() {
  const [showModal, setShowModal] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [websiteLeads, setWebsiteLeads] = React.useState([]);
  const [mappingPreview, setMappingPreview] = React.useState([]);
  const [selectedLeads, setSelectedLeads] = React.useState(new Set());
  const [importHistory, setImportHistory] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState('preview'); // preview, history
  const [summary, setSummary] = React.useState(null);
  const [testStatus, setTestStatus] = React.useState(null);
  const [minLeadId, setMinLeadId] = React.useState(794);
  const [manualMappings, setManualMappings] = React.useState({});
  const [savedMappings, setSavedMappings] = React.useState({});
  const [hasUnsavedMappings, setHasUnsavedMappings] = React.useState(false);

  // Test connection to website API
  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await window.apiCall('/website-leads/test-connection');
      setTestStatus({
        success: response.success,
        message: response.data?.message || response.error
      });
    } catch (error) {
      setTestStatus({
        success: false,
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Fetch website leads for preview with proper saved mapping handling
  const fetchWebsiteLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        minLeadId: minLeadId
      });
      
      const response = await window.apiCall(`/website-leads/preview?${params}`);
      
      if (response.success) {
        setWebsiteLeads(response.data.leads);
        setMappingPreview(response.data.mappingPreview);
        setSummary(response.data.summary);
        setSavedMappings(response.data.savedMappings || {});
        setSelectedLeads(new Set(response.data.leads.map(l => l.id)));
        
        // Initialize manual mappings with BOTH saved mappings and auto-matched mappings
        const initialMappings = {};
        response.data.mappingPreview.forEach(mapping => {
          if (mapping.inventoryFound && mapping.inventoryId) {
            initialMappings[mapping.websiteLeadId] = mapping.inventoryId;
          }
        });
        
        // ADDED: Also check savedMappings directly for any leads that might not have been auto-matched
        response.data.leads.forEach(lead => {
          if (!initialMappings[lead.id] && response.data.savedMappings[lead.tours]) {
            initialMappings[lead.id] = response.data.savedMappings[lead.tours].inventory_id;
          }
        });
        
        setManualMappings(initialMappings);
        
        // Debug logging
        console.log('Fetched leads:', response.data.leads.length);
        console.log('Saved mappings:', response.data.savedMappings);
        console.log('Initial mappings set:', initialMappings);
      } else {
        alert('Failed to fetch website leads: ' + response.error);
      }
    } catch (error) {
      console.error('Error fetching website leads:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Save event mappings
  const saveEventMappings = async () => {
    setLoading(true);
    try {
      // Collect new mappings to save
      const mappingsToSave = [];
      const uniqueEvents = new Map();
      
      websiteLeads.forEach(lead => {
        const inventoryId = manualMappings[lead.id];
        if (inventoryId && !savedMappings[lead.tours]) {
          // Only save if not already saved
          if (!uniqueEvents.has(lead.tours)) {
            const inventory = window.inventory.find(inv => inv.id === inventoryId);
            uniqueEvents.set(lead.tours, {
              website_event_name: lead.tours,
              crm_inventory_id: inventoryId,
              crm_inventory_name: inventory?.event_name || ''
            });
          }
        }
      });
      
      if (uniqueEvents.size === 0) {
        alert('No new mappings to save');
        return;
      }
      
      const response = await window.apiCall('/website-leads/event-mappings', {
        method: 'POST',
        body: JSON.stringify({
          mappings: Array.from(uniqueEvents.values())
        })
      });
      
      if (response.success) {
        alert(`✅ Saved ${uniqueEvents.size} event mapping(s) for future use`);
        setHasUnsavedMappings(false);
        // Refresh to get updated saved mappings
        await fetchWebsiteLeads();
      } else {
        alert('Failed to save mappings: ' + response.error);
      }
    } catch (error) {
      console.error('Error saving mappings:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch import history
  const fetchImportHistory = async () => {
    setLoading(true);
    try {
      const response = await window.apiCall('/website-leads/import-history');
      if (response.success) {
        setImportHistory(response.data);
      }
    } catch (error) {
      console.error('Error fetching import history:', error);
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Import selected leads with debug logging
  const importLeads = async (importAll = false) => {
    if (!importAll && selectedLeads.size === 0) {
      alert('Please select at least one lead to import');
      return;
    }

    // Check if all selected leads have inventory mapped
    const unmappedLeads = Array.from(selectedLeads).filter(leadId => {
      const lead = websiteLeads.find(l => l.id === leadId);
      return lead && !manualMappings[leadId];
    });

    if (unmappedLeads.length > 0) {
      const leadNames = unmappedLeads.slice(0, 3).map(id => {
        const lead = websiteLeads.find(l => l.id === id);
        return lead?.tours;
      }).join(', ');
      
      if (!confirm(`${unmappedLeads.length} lead(s) don't have inventory mapped (${leadNames}${unmappedLeads.length > 3 ? '...' : ''}). Continue anyway?`)) {
        return;
      }
    }

    const confirmMsg = importAll 
      ? `Import all ${websiteLeads.length} new leads (ID >= ${minLeadId})?` 
      : `Import ${selectedLeads.size} selected leads?`;

    if (!confirm(confirmMsg)) return;

    setLoading(true);
    try {
      // ADDED: Debug logging
      console.log('Manual mappings being sent:', manualMappings);
      console.log('Lead IDs being sent:', importAll ? 'ALL' : Array.from(selectedLeads));
      
      // Log sample lead data
      if (!importAll && selectedLeads.size > 0) {
        const sampleLeadId = Array.from(selectedLeads)[0];
        const sampleLead = websiteLeads.find(l => l.id === sampleLeadId);
        console.log('Sample lead being imported:', {
          id: sampleLead?.id,
          name: sampleLead?.name,
          tours: sampleLead?.tours,
          inventory_mapped: manualMappings[sampleLeadId] || 'NONE'
        });
      }
      
      const response = await window.apiCall('/website-leads/import', {
        method: 'POST',
        body: JSON.stringify({
          importAll,
          leadIds: importAll ? null : Array.from(selectedLeads),
          minLeadId: minLeadId,
          manualMappings: manualMappings
        })
      });

      if (response.success) {
        const { summary } = response.data;
        alert(`✅ Import successful!\n\n` +
          `Total imported: ${summary.successfulImports}\n` +
          `Single leads: ${summary.singleLeads}\n` +
          `Multi-lead groups: ${summary.multiLeadGroups}\n` +
          `Failed: ${summary.failedImports}`
        );

        // Refresh main leads list
        if (window.fetchLeads) {
          await window.fetchLeads();
        }

        // Refresh preview
        fetchWebsiteLeads();
        
        // Switch to history tab
        setActiveTab('history');
        fetchImportHistory();
      } else {
        alert('Import failed: ' + response.error);
      }
    } catch (error) {
      console.error('Error importing leads:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle lead selection
  const toggleLeadSelection = (leadId) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  // Handle inventory mapping change
  const handleMappingChange = (leadId, inventoryId) => {
    setManualMappings(prev => ({
      ...prev,
      [leadId]: inventoryId
    }));
    setHasUnsavedMappings(true);
  };

  // Open modal and fetch data
  const openImportModal = () => {
    setShowModal(true);
    // Don't auto-fetch, let user click Fetch Leads button
  };

  React.useEffect(() => {
    if (showModal && activeTab === 'history' && !importHistory) {
      fetchImportHistory();
    }
  }, [showModal, activeTab]);

  // ADDED: Debug functions for testing
  window.debugWebsiteLeadsImport = {
    testEventMappings: async () => {
      const response = await window.apiCall('/website-leads/event-mappings');
      console.log('Current saved mappings:', response.data);
      return response.data;
    },
    
    debugLeadImport: async (leadId) => {
      const lead = websiteLeads.find(l => l.id === leadId);
      console.log('Website lead:', lead);
      console.log('Manual mapping:', manualMappings[leadId]);
      console.log('Event name will be:', lead?.tours || 'NOT SET');
    },
    
    checkImportHistory: async () => {
      const response = await window.apiCall('/website-leads/import-history');
      console.log('Import history:', response.data);
      return response.data;
    },
    
    getCurrentState: () => {
      console.log('Current state:', {
        websiteLeads: websiteLeads.length,
        selectedLeads: Array.from(selectedLeads),
        manualMappings,
        savedMappings
      });
    }
  };

  // Main component render
  return React.createElement('div', null,
    // Import button
    React.createElement('button', {
      className: 'px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2',
      onClick: openImportModal
    },
      React.createElement('span', null, '🌐'),
      'Import Website Leads'
    ),

    // Modal
    showModal && React.createElement('div', {
      className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
    },
      React.createElement('div', {
        className: 'bg-white dark:bg-gray-800 rounded-lg w-full max-w-7xl max-h-[90vh] flex flex-col'
      },
        // Header
        React.createElement('div', {
          className: 'p-6 border-b border-gray-200 dark:border-gray-700'
        },
          React.createElement('div', { className: 'flex justify-between items-center' },
            React.createElement('h2', { 
              className: 'text-2xl font-bold text-gray-800 dark:text-white' 
            }, '🌐 Import Website Leads'),
            React.createElement('button', {
              className: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
              onClick: () => setShowModal(false)
            }, '✕')
          ),

          // Tabs
          React.createElement('div', { className: 'flex gap-4 mt-4' },
            React.createElement('button', {
              className: `px-4 py-2 rounded-md ${activeTab === 'preview' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`,
              onClick: () => setActiveTab('preview')
            }, 'Preview & Import'),
            React.createElement('button', {
              className: `px-4 py-2 rounded-md ${activeTab === 'history' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`,
              onClick: () => setActiveTab('history')
            }, 'Import History')
          )
        ),

        // Content
        React.createElement('div', { className: 'flex-1 overflow-y-auto p-6' },
          loading ? React.createElement('div', { 
            className: 'text-center py-12' 
          }, 'Loading...') :
          
          activeTab === 'preview' ? (
            // Preview tab content
            React.createElement('div', null,
              // Lead ID Filter
              React.createElement('div', { 
                className: 'mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700' 
              },
                React.createElement('h4', { className: 'font-semibold text-blue-800 dark:text-blue-200 mb-3' }, 
                  '🔍 Lead Filter Settings'
                ),
                React.createElement('div', { className: 'flex gap-4 items-end flex-wrap' },
                  React.createElement('div', { className: 'flex-1' },
                    React.createElement('label', { 
                      className: 'block text-sm font-medium text-blue-700 dark:text-blue-300 mb-1' 
                    }, 'Minimum Lead ID'),
                    React.createElement('input', {
                      type: 'number',
                      value: minLeadId,
                      onChange: (e) => setMinLeadId(parseInt(e.target.value) || 794),
                      className: 'px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white w-full',
                      min: 1,
                      placeholder: '794'
                    })
                  ),
                  React.createElement('button', {
                    className: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700',
                    onClick: fetchWebsiteLeads,
                    disabled: loading
                  }, '🔍 Fetch Leads')
                ),
                React.createElement('p', { 
                  className: 'text-sm text-blue-700 dark:text-blue-300 mt-2' 
                }, 
                  '💡 Only leads with ID >= 794 will be shown to prevent importing old historical data.'
                )
              ),

              // Connection test
              !websiteLeads.length && !loading && React.createElement('div', { 
                className: 'mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg' 
              },
                React.createElement('button', {
                  className: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700',
                  onClick: testConnection,
                  disabled: loading
                }, '🔌 Test Website Connection'),
                testStatus && React.createElement('div', {
                  className: `mt-2 p-2 rounded ${testStatus.success 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'}`
                }, testStatus.message)
              ),

              // Summary
              summary && React.createElement('div', { 
                className: 'mb-6 grid grid-cols-1 md:grid-cols-3 gap-4' 
              },
                React.createElement('div', { 
                  className: 'p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg' 
                },
                  React.createElement('h4', { className: 'font-semibold' }, 'Total New Leads'),
                  React.createElement('p', { className: 'text-2xl font-bold' }, websiteLeads.length)
                ),
                React.createElement('div', { 
                  className: 'p-4 bg-green-50 dark:bg-green-900/20 rounded-lg' 
                },
                  React.createElement('h4', { className: 'font-semibold' }, 'Multi-Lead Groups'),
                  React.createElement('p', { className: 'text-2xl font-bold' }, summary.multiLeadGroups)
                ),
                React.createElement('div', { 
                  className: 'p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg' 
                },
                  React.createElement('h4', { className: 'font-semibold' }, 'Sources'),
                  Object.entries(summary.bySource || {}).map(([source, count]) =>
                    React.createElement('p', { key: source, className: 'text-sm' },
                      `${source}: ${count}`
                    )
                  )
                )
              ),

              // Action buttons
              websiteLeads.length > 0 && React.createElement('div', { 
                className: 'mb-4 flex gap-4 flex-wrap' 
              },
                React.createElement('button', {
                  className: 'px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700',
                  onClick: () => importLeads(true),
                  disabled: loading
                }, `Import All ${websiteLeads.length} Leads`),
                React.createElement('button', {
                  className: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700',
                  onClick: () => importLeads(false),
                  disabled: loading || selectedLeads.size === 0
                }, `Import Selected (${selectedLeads.size})`),
                hasUnsavedMappings && React.createElement('button', {
                  className: 'px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700',
                  onClick: saveEventMappings,
                  disabled: loading
                }, '💾 Save Event Mappings'),
                React.createElement('button', {
                  className: 'px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white rounded-md',
                  onClick: fetchWebsiteLeads,
                  disabled: loading
                }, '🔄 Refresh')
              ),

              // UPDATED: Enhanced leads table with better mapping display
              websiteLeads.length > 0 && React.createElement('div', { 
                className: 'overflow-x-auto' 
              },
                React.createElement('table', { 
                  className: 'w-full border-collapse' 
                },
                  React.createElement('thead', null,
                    React.createElement('tr', { 
                      className: 'bg-gray-100 dark:bg-gray-700' 
                    },
                      React.createElement('th', { className: 'p-2 text-left' },
                        React.createElement('input', {
                          type: 'checkbox',
                          checked: selectedLeads.size === websiteLeads.length,
                          onChange: (e) => {
                            if (e.target.checked) {
                              setSelectedLeads(new Set(websiteLeads.map(l => l.id)));
                            } else {
                              setSelectedLeads(new Set());
                            }
                          }
                        })
                      ),
                      React.createElement('th', { className: 'p-2 text-left' }, 'Name'),
                      React.createElement('th', { className: 'p-2 text-left' }, 'Email'),
                      React.createElement('th', { className: 'p-2 text-left' }, 'Phone'),
                      React.createElement('th', { className: 'p-2 text-left' }, 'Tour/Event'),
                      React.createElement('th', { className: 'p-2 text-left' }, 'Inventory Match'),
                      React.createElement('th', { className: 'p-2 text-left' }, 'Select Inventory'),
                      React.createElement('th', { className: 'p-2 text-left' }, 'Source'),
                      React.createElement('th', { className: 'p-2 text-left' }, 'Group')
                    )
                  ),
                  React.createElement('tbody', null,
                    websiteLeads.map(lead => {
                      const mapping = mappingPreview.find(m => m.websiteLeadId === lead.id);
                      const selectedInventoryId = manualMappings[lead.id];
                      const isManuallyMapped = selectedInventoryId && selectedInventoryId !== mapping?.inventoryId;
                      
                      return React.createElement('tr', { 
                        key: lead.id,
                        className: 'border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      },
                        React.createElement('td', { className: 'p-2' },
                          React.createElement('input', {
                            type: 'checkbox',
                            checked: selectedLeads.has(lead.id),
                            onChange: () => toggleLeadSelection(lead.id)
                          })
                        ),
                        React.createElement('td', { className: 'p-2' }, lead.name),
                        React.createElement('td', { className: 'p-2 text-sm' }, lead.email),
                        React.createElement('td', { className: 'p-2 text-sm' }, lead.phone_number),
                        React.createElement('td', { className: 'p-2' }, lead.tours),
                        React.createElement('td', { className: 'p-2' },
                          mapping?.isSavedMapping ? (
                            React.createElement('span', { 
                              className: 'text-purple-600 font-medium flex items-center gap-1' 
                            }, 
                              React.createElement('span', null, '🔗'),
                              'Saved: ' + mapping.inventoryName
                            )
                          ) : mapping?.inventoryFound ? (
                            React.createElement('span', { 
                              className: 'text-green-600' 
                            }, '✅ ' + mapping.inventoryName)
                          ) : isManuallyMapped ? (
                            React.createElement('span', { 
                              className: 'text-blue-600 font-medium' 
                            }, '✏️ Manually mapped')
                          ) : (
                            React.createElement('span', { 
                              className: 'text-red-600' 
                            }, '❌ No match')
                          )
                        ),
                        // UPDATED: Enhanced inventory select with visual feedback
                        React.createElement('td', { className: 'p-2' },
                          React.createElement('div', { className: 'flex items-center gap-2' },
                            React.createElement('select', {
                              value: manualMappings[lead.id] || '',
                              onChange: (e) => handleMappingChange(lead.id, e.target.value),
                              className: `px-3 py-1 border rounded-md text-sm ${
                                manualMappings[lead.id] 
                                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                                  : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                              }`,
                              style: { minWidth: '200px' }
                            },
                              React.createElement('option', { value: '' }, '-- Select Inventory --'),
                              ...window.inventory
                                .filter(inv => inv.event_name)
                                .sort((a, b) => a.event_name.localeCompare(b.event_name))
                                .map(inv =>
                                  React.createElement('option', { 
                                    key: inv.id, 
                                    value: inv.id 
                                  }, inv.event_name)
                                )
                            ),
                            // Show if it's a saved mapping
                            savedMappings[lead.tours] && manualMappings[lead.id] === savedMappings[lead.tours].inventory_id &&
                              React.createElement('span', { 
                                className: 'text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded' 
                              }, '📌 Saved')
                          )
                        ),
                        React.createElement('td', { className: 'p-2' }, lead.referral_code),
                        React.createElement('td', { className: 'p-2' }, 
                          lead.group_id ? `Group ${lead.group_id}` : '-'
                        )
                      );
                    })
                  )
                )
              ),

              // Mapping notice
              hasUnsavedMappings && React.createElement('div', {
                className: 'mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700'
              },
                React.createElement('p', { className: 'text-yellow-800 dark:text-yellow-200' },
                  '💡 You have unsaved event mappings. Click "Save Event Mappings" to remember these mappings for future imports.'
                )
              )
            )
          ) : (
            // History tab content
            React.createElement('div', null,
              importHistory && React.createElement('div', null,
                React.createElement('h3', { 
                  className: 'text-lg font-semibold mb-4' 
                }, `Total Imported: ${importHistory.totalImported}`),
                
                importHistory.importBatches.map(batch =>
                  React.createElement('div', { 
                    key: batch.date,
                    className: 'mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg'
                  },
                    React.createElement('div', { className: 'flex justify-between items-center' },
                      React.createElement('div', null,
                        React.createElement('h4', { className: 'font-semibold' }, 
                          new Date(batch.date).toLocaleDateString()
                        ),
                        React.createElement('p', { className: 'text-sm text-gray-600 dark:text-gray-400' },
                          `${batch.count} leads imported by ${batch.importedBy}`
                        )
                      ),
                      React.createElement('button', {
                        className: 'text-blue-600 hover:text-blue-800 text-sm',
                        onClick: () => {
                          // Could expand to show lead details
                          console.log('Show batch details:', batch);
                        }
                      }, 'View Details')
                    )
                  )
                )
              )
            )
          )
        )
      )
    )
  );
};

console.log('✅ Enhanced Website Leads Import with Event Mapping loaded');
