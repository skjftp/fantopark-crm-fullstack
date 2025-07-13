// ===============================================
// UPDATED CHART SYSTEM - CONFLICT-FREE VERSION
// components/chart-system.js
// Fixed all duplicate variable declarations
// ===============================================

(function() {
  'use strict';
  
  // Prevent multiple loads and variable conflicts
  if (window.chartSystemLoaded) {
    console.log('⚠️ Chart system already loaded, skipping duplicate load');
    return;
  }
  window.chartSystemLoaded = true;

  // Performance and logging controls
  const ENABLE_CHART_DEBUG = true;
  const chartLog = ENABLE_CHART_DEBUG ? console.log : () => {};
  const chartError = console.error;

  // Global chart state management
  window.chartState = {
    initialized: false,
    initializing: false,
    recreationInProgress: false,
    lastUpdate: 0,
    updateThrottle: 500,
    errorCount: 0,
    maxErrors: 5
  };

  // Chart instances storage
  window.chartInstances = window.chartInstances || {};

  // ===============================================
  // SAFE ORIGINAL FUNCTION STORAGE
  // ===============================================
  
  // Store original functions safely to avoid conflicts
  if (!window._chartSystemOriginals) {
    window._chartSystemOriginals = {
      setActiveTab: window.setActiveTab,
      setSelectedSalesPerson: window.setSelectedSalesPerson,
      setDashboardFilter: window.setDashboardFilter,
      setSelectedEvent: window.setSelectedEvent
    };
  }

  // ===============================================
  // ID-TO-EMAIL MAPPING FUNCTION
  // ===============================================
  window.getFilteredLeadsWithMapping = function() {
    chartLog('🔄 Running filter with ID-to-Email mapping...');
    
    let filteredLeads = [...(window.leads || [])];
    chartLog('🔍 Starting with', filteredLeads.length, 'leads');
    
    // Apply dashboard filter
    if (window.dashboardFilter && window.selectedSalesPerson) {
      chartLog('🔍 Dashboard filter:', window.dashboardFilter);
      chartLog('🔍 Selected sales person ID:', window.selectedSalesPerson);
      
      if (window.dashboardFilter === 'salesPerson' || window.dashboardFilter === 'salesperson') {
        chartLog('🔍 Applying sales person filter with ID mapping...');
        
        // Map ID to email using users array
        const selectedUser = (window.users || []).find(user => user.id === window.selectedSalesPerson);
        if (selectedUser) {
          const salesPersonEmail = selectedUser.email;
          chartLog('🔍 Mapped ID "' + window.selectedSalesPerson + '" to email "' + salesPersonEmail + '"');
          
          filteredLeads = filteredLeads.filter(lead => lead.assigned_to === salesPersonEmail);
          chartLog('🔍 After sales person filter:', window.leads.length, '→', filteredLeads.length, 'leads');
        }
      }
    }
    
    if (window.dashboardFilter === 'event' && window.selectedEvent) {
      filteredLeads = filteredLeads.filter(lead => lead.lead_for_event === window.selectedEvent);
    }
    
    chartLog('🔍 Final filtered count:', filteredLeads.length);
    return filteredLeads;
  };

  // ===============================================
  // TEMPERATURE LOGIC FUNCTION
  // ===============================================
  function getDisplayTemperature(lead) {
    if (lead.temperature) return lead.temperature.toLowerCase();
    if (lead.status) {
      const status = lead.status.toLowerCase();
      if (status === 'qualified' || status === 'hot') return 'hot';
      if (status === 'warm') return 'warm';
      return 'cold';
    }
    return 'cold';
  }

  // ===============================================
  // MAIN CHART CREATION FUNCTION
  // ===============================================
  window.createChartsWithCurrentData = function() {
    chartLog('📊 Creating charts with current data...');
    
    try {
      // Clear any existing charts first
      if (typeof Chart !== 'undefined' && Chart.instances) {
        Object.keys(Chart.instances).forEach(id => {
          try {
            Chart.instances[id].destroy();
            delete Chart.instances[id];
          } catch (e) {
            chartLog('⚠️ Error destroying existing chart:', id);
          }
        });
      }
      
      window.chartInstances = {};
      
      // Get current filtered data
      const currentFilteredLeads = window.getFilteredLeadsWithMapping();
      chartLog('📊 Creating charts with', currentFilteredLeads.length, 'leads');
      
      // Calculate data
      const qualifiedCount = currentFilteredLeads.filter(l => (l.status || '').toLowerCase() === 'qualified').length;
      const junkCount = currentFilteredLeads.filter(l => (l.status || '').toLowerCase() === 'junk').length;
      
      // Temperature counts
      const hotCount = currentFilteredLeads.filter(l => getDisplayTemperature(l) === 'hot').length;
      const warmCount = currentFilteredLeads.filter(l => getDisplayTemperature(l) === 'warm').length;
      const coldCount = currentFilteredLeads.filter(l => getDisplayTemperature(l) === 'cold').length;
      
      // Temperature values
      const hotValue = currentFilteredLeads
        .filter(l => getDisplayTemperature(l) === 'hot')
        .reduce((sum, lead) => sum + (parseFloat(lead.potential_value) || 0), 0);
      const warmValue = currentFilteredLeads
        .filter(l => getDisplayTemperature(l) === 'warm')
        .reduce((sum, lead) => sum + (parseFloat(lead.potential_value) || 0), 0);
      const coldValue = currentFilteredLeads
        .filter(l => getDisplayTemperature(l) === 'cold')
        .reduce((sum, lead) => sum + (parseFloat(lead.potential_value) || 0), 0);
      
      // Create charts
      createLeadSplitChart(qualifiedCount, junkCount);
      createTemperatureCountChart(hotCount, warmCount, coldCount);
      createTemperatureValueChart(hotValue, warmValue, coldValue);
      
      window.chartState.initialized = true;
      window.chartState.initializing = false;
      chartLog('✅ All charts created successfully');
      
    } catch (error) {
      chartError('❌ Chart creation failed:', error);
      window.chartState.initialized = false;
      window.chartState.initializing = false;
      window.chartState.recreationInProgress = false;
    }
  };

  // ===============================================
  // INDIVIDUAL CHART CREATORS
  // ===============================================
  function createLeadSplitChart(qualified, junk) {
    const canvas = document.getElementById('leadSplitChart');
    if (!canvas) return;
    
    try {
      window.chartInstances.leadSplit = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: ['Qualified Leads', 'Junk Leads'],
          datasets: [{
            data: [qualified, junk],
            backgroundColor: ['#10b981', '#ef4444'],
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
      
      chartLog('✅ Lead Split chart created:', qualified, 'qualified,', junk, 'junk');
    } catch (error) {
      chartError('❌ Lead Split chart error:', error);
    }
  }

  function createTemperatureCountChart(hot, warm, cold) {
    const canvas = document.getElementById('tempCountChart');
    if (!canvas) return;
    
    try {
      window.chartInstances.tempCount = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: ['Hot Leads', 'Warm Leads', 'Cold Leads'],
          datasets: [{
            data: [hot, warm, cold],
            backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'],
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
      
      chartLog('✅ Temperature Count chart created:', hot, 'hot,', warm, 'warm,', cold, 'cold');
    } catch (error) {
      chartError('❌ Temperature Count chart error:', error);
    }
  }

  function createTemperatureValueChart(hot, warm, cold) {
    const canvas = document.getElementById('tempValueChart');
    if (!canvas) return;
    
    try {
      window.chartInstances.tempValue = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: ['Hot Value', 'Warm Value', 'Cold Value'],
          datasets: [{
            data: [hot, warm, cold],
            backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'],
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.label + ': ₹' + context.raw.toLocaleString('en-IN');
                }
              }
            }
          }
        }
      });
      
      const hotFormatted = '₹' + hot.toLocaleString('en-IN');
      const warmFormatted = '₹' + warm.toLocaleString('en-IN');
      const coldFormatted = '₹' + cold.toLocaleString('en-IN');
      
      chartLog('✅ Temperature Value chart created:', hotFormatted, 'hot,', warmFormatted, 'warm,', coldFormatted, 'cold');
    } catch (error) {
      chartError('❌ Temperature Value chart error:', error);
    }
  }

  // ===============================================
  // MAIN CHART INITIALIZATION
  // ===============================================
  window.initializeChartsAdvanced = function() {
    if (window.chartState.initializing) {
      chartLog('⏳ Chart initialization already in progress...');
      return;
    }

    window.chartState.initializing = true;
    chartLog('🎯 Initializing charts...');
    
    // Use the working creation function
    window.createChartsWithCurrentData();
  };

  // ===============================================
  // FILTER WRAPPERS (SAFE)
  // ===============================================
  function createWorkingFilterWrappers() {
    // Sales person filter wrapper
    if (window._chartSystemOriginals.setSelectedSalesPerson) {
      window.setSelectedSalesPerson = function(person) {
        chartLog('👤 Sales person filter changed to:', person);
        
        // Call original function
        window._chartSystemOriginals.setSelectedSalesPerson(person);
        
        // Update charts after filter change
        setTimeout(() => {
          if (window.chartState.initialized) {
            window.createChartsWithCurrentData();
          }
        }, 100);
      };
    }

    // Dashboard filter wrapper
    if (window._chartSystemOriginals.setDashboardFilter) {
      window.setDashboardFilter = function(filter) {
        chartLog('🎯 Dashboard filter changed to:', filter);
        
        // Call original function
        window._chartSystemOriginals.setDashboardFilter(filter);
        
        // Update charts after filter change
        setTimeout(() => {
          if (window.chartState.initialized) {
            window.createChartsWithCurrentData();
          }
        }, 100);
      };
    }

    // Event filter wrapper
    if (window._chartSystemOriginals.setSelectedEvent) {
      window.setSelectedEvent = function(event) {
        chartLog('🎪 Event filter changed to:', event);
        
        // Call original function
        window._chartSystemOriginals.setSelectedEvent(event);
        
        // Update charts after filter change
        setTimeout(() => {
          if (window.chartState.initialized) {
            window.createChartsWithCurrentData();
          }
        }, 100);
      };
    }
  }

  // ===============================================
  // TAB CHANGE WRAPPER (SAFE)
  // ===============================================
  function setupTabChangeWrapper() {
    if (window._chartSystemOriginals.setActiveTab) {
      window.setActiveTab = function(tab) {
        // Call original function
        window._chartSystemOriginals.setActiveTab(tab);
        
        // If switching to dashboard, try to init charts
        if (tab === 'dashboard') {
          setTimeout(() => {
            if (!window.chartState?.initialized) {
              chartLog('🎯 Dashboard activated, attempting chart initialization...');
              window.initializeChartsAdvanced();
            }
          }, 500);
        }
      };
    }
  }

  // ===============================================
  // LEGACY COMPATIBILITY & ALIASES
  // ===============================================
  window.initializeCharts = window.initializeChartsAdvanced;
  window.smartChartInit = window.initializeChartsAdvanced;
  window.updateCharts = window.createChartsWithCurrentData;
  window.refreshCharts = window.createChartsWithCurrentData;

  // ===============================================
  // INITIALIZE EVERYTHING
  // ===============================================
  function initializeWorkingChartSystem() {
    chartLog('🎯 Initializing Working Chart System v7.0...');
    
    // Set up safe filter wrappers
    createWorkingFilterWrappers();
    
    // Set up tab change wrapper
    setupTabChangeWrapper();
    
    // Initialize charts when ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(window.initializeChartsAdvanced, 1000);
      });
    } else {
      setTimeout(window.initializeChartsAdvanced, 1000);
    }
    
    chartLog('✅ Working Chart System v7.0 initialized');
  }

  // ===============================================
  // AUTO-INITIALIZE
  // ===============================================
  initializeWorkingChartSystem();

  console.log('🚀 Updated Chart System Loaded - All conflicts resolved!');
})();

// ===============================================
// CHART SYSTEM FIX - ADD MISSING FUNCTION
// Add this to your chart-system.js or as a separate script
// ===============================================

(function() {
  'use strict';
  
  console.log('🔧 Loading chart system fix for missing initializeOptimizedCharts...');
  
  // ===============================================
  // CREATE THE MISSING FUNCTION
  // ===============================================
  
  window.initializeOptimizedCharts = function() {
    console.log('🚀 initializeOptimizedCharts called - routing to working system...');
    
    // Route to the working chart initialization function
    if (window.initializeChartsAdvanced) {
      console.log('✅ Found initializeChartsAdvanced, using it...');
      window.initializeChartsAdvanced();
    } else if (window.smartChartInit) {
      console.log('✅ Found smartChartInit, using it...');
      window.smartChartInit();
    } else if (window.createDashboardCharts) {
      console.log('✅ Found createDashboardCharts, using it...');
      window.createDashboardCharts();
    } else {
      console.warn('❌ No chart initialization function found');
      // Fallback - try to create charts manually
      setTimeout(() => {
        if (window.Chart && window.leads) {
          console.log('🔧 Attempting manual chart creation...');
          window.createChartsManually();
        }
      }, 500);
    }
  };
  
  // ===============================================
  // MANUAL CHART CREATION FALLBACK
  // ===============================================
  
  window.createChartsManually = function() {
    console.log('🔧 Manual chart creation starting...');
    
    // Get chart canvases
    const canvas1 = document.getElementById('leadSplitChart');
    const canvas2 = document.getElementById('tempCountChart');
    const canvas3 = document.getElementById('tempValueChart');
    
    if (!canvas1 || !canvas2 || !canvas3) {
      console.warn('❌ Chart canvases not found');
      return;
    }
    
    // Destroy existing charts
    [canvas1, canvas2, canvas3].forEach(canvas => {
      const existingChart = Chart.getChart(canvas);
      if (existingChart) {
        existingChart.destroy();
      }
    });
    
    // Calculate data
    const leads = window.leads || [];
    const hotLeads = leads.filter(l => (l.temperature || l.status || '').toLowerCase() === 'hot');
    const warmLeads = leads.filter(l => (l.temperature || l.status || '').toLowerCase() === 'warm');
    const coldLeads = leads.filter(l => (l.temperature || l.status || '').toLowerCase() === 'cold');
    
    const hotValue = hotLeads.reduce((sum, lead) => sum + (parseFloat(lead.potential_value) || 0), 0);
    const warmValue = warmLeads.reduce((sum, lead) => sum + (parseFloat(lead.potential_value) || 0), 0);
    const coldValue = coldLeads.reduce((sum, lead) => sum + (parseFloat(lead.potential_value) || 0), 0);
    
    try {
      // Chart 1: Lead Split
      new Chart(canvas1, {
        type: 'doughnut',
        data: {
          labels: ['Hot Leads', 'Warm Leads', 'Cold Leads'],
          datasets: [{
            data: [hotLeads.length, warmLeads.length, coldLeads.length],
            backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'],
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
      
      // Chart 2: Temperature Count
      new Chart(canvas2, {
        type: 'bar',
        data: {
          labels: ['Hot', 'Warm', 'Cold'],
          datasets: [{
            label: 'Number of Leads',
            data: [hotLeads.length, warmLeads.length, coldLeads.length],
            backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
      
      // Chart 3: Temperature Value
      new Chart(canvas3, {
        type: 'doughnut',
        data: {
          labels: ['Hot Value', 'Warm Value', 'Cold Value'],
          datasets: [{
            data: [hotValue, warmValue, coldValue],
            backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'],
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.label + ': ₹' + context.raw.toLocaleString('en-IN');
                }
              }
            }
          }
        }
      });
      
      console.log('✅ Manual charts created successfully');
      
    } catch (error) {
      console.error('❌ Manual chart creation failed:', error);
    }
  };
  
  // ===============================================
  // ADD ADDITIONAL ALIASES FOR COMPATIBILITY
  // ===============================================
  
  // Make sure all the expected functions exist
  window.updateOptimizedCharts = window.updateChartsWithData || window.updateCharts || function() {
    console.log('🔧 updateOptimizedCharts called - attempting chart refresh...');
    if (window.initializeOptimizedCharts) {
      window.initializeOptimizedCharts();
    }
  };
  
  // ===============================================
  // FORCE UPDATE FILTER WRAPPERS
  // ===============================================
  
  function setupOptimizedFilterWrappers() {
    console.log('🔧 Setting up optimized filter wrappers...');
    
    // Store originals if not already stored
    if (!window._optimizedOriginals) {
      window._optimizedOriginals = {
        setDashboardFilter: window.setDashboardFilter,
        setSelectedSalesPerson: window.setSelectedSalesPerson,
        setSelectedEvent: window.setSelectedEvent
      };
    }
    
    // Wrap setDashboardFilter
    window.setDashboardFilter = function(filter) {
      console.log('🎯 Optimized: Dashboard filter changing to:', filter);
      
      if (window._optimizedOriginals.setDashboardFilter) {
        window._optimizedOriginals.setDashboardFilter(filter);
      } else {
        window.dashboardFilter = filter;
      }
      
      setTimeout(() => {
        console.log('📊 Optimized: Triggering chart update...');
        if (window.updateOptimizedCharts) {
          window.updateOptimizedCharts();
        } else if (window.initializeOptimizedCharts) {
          window.initializeOptimizedCharts();
        }
      }, 200);
    };
    
    // Wrap setSelectedSalesPerson
    window.setSelectedSalesPerson = function(person) {
      console.log('👤 Optimized: Sales person changing to:', person);
      
      if (window._optimizedOriginals.setSelectedSalesPerson) {
        window._optimizedOriginals.setSelectedSalesPerson(person);
      } else {
        window.selectedSalesPerson = person;
      }
      
      setTimeout(() => {
        console.log('📊 Optimized: Triggering chart update...');
        if (window.updateOptimizedCharts) {
          window.updateOptimizedCharts();
        } else if (window.initializeOptimizedCharts) {
          window.initializeOptimizedCharts();
        }
      }, 200);
    };
    
    // Wrap setSelectedEvent
    window.setSelectedEvent = function(event) {
      console.log('🎪 Optimized: Event changing to:', event);
      
      if (window._optimizedOriginals.setSelectedEvent) {
        window._optimizedOriginals.setSelectedEvent(event);
      } else {
        window.selectedEvent = event;
      }
      
      setTimeout(() => {
        console.log('📊 Optimized: Triggering chart update...');
        if (window.updateOptimizedCharts) {
          window.updateOptimizedCharts();
        } else if (window.initializeOptimizedCharts) {
          window.initializeOptimizedCharts();
        }
      }, 200);
    };
    
    console.log('✅ Optimized filter wrappers configured');
  }
  
  // ===============================================
  // INITIALIZE THE FIX
  // ===============================================
  
  function initializeFix() {
    // Setup the optimized filter wrappers
    setupOptimizedFilterWrappers();
    
    // Test if dashboard is active and needs charts
    if (window.activeTab === 'dashboard') {
      setTimeout(() => {
        console.log('🎯 Dashboard is active, testing chart initialization...');
        window.initializeOptimizedCharts();
      }, 1000);
    }
    
    console.log('✅ Chart system fix applied successfully');
  }
  
  // Start the fix
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initializeFix, 1500);
    });
  } else {
    setTimeout(initializeFix, 1500);
  }
  
  console.log('🔧 Chart system fix loaded - initializeOptimizedCharts function created');
  
})();

// ===============================================
// REACT STATE SYNC FIX FOR DROPDOWN DISPLAY
// Add this after your existing chart system fixes
// ===============================================

(function() {
  'use strict';
  
  console.log('🔧 Loading React state sync fix for dropdown display...');
  
  // ===============================================
  // ENHANCED FILTER WRAPPERS WITH REACT STATE SYNC
  // ===============================================
  
  function setupReactStateSyncWrappers() {
    console.log('🔧 Setting up React state sync wrappers...');
    
    // Store the original functions if not already stored
    if (!window._reactSyncOriginals) {
      window._reactSyncOriginals = {
        setDashboardFilter: window.setDashboardFilter,
        setSelectedSalesPerson: window.setSelectedSalesPerson,
        setSelectedEvent: window.setSelectedEvent
      };
    }
    
    // ===============================================
    // DASHBOARD FILTER WRAPPER
    // ===============================================
    window.setDashboardFilter = function(filter) {
      console.log('🎯 React Sync: Dashboard filter changing to:', filter);
      
      // Update window variable
      window.dashboardFilter = filter;
      
      // Call original function if it exists
      if (window._reactSyncOriginals.setDashboardFilter) {
        try {
          window._reactSyncOriginals.setDashboardFilter(filter);
        } catch (error) {
          console.warn('Original setDashboardFilter error:', error);
        }
      }
      
      // ✅ UPDATE REACT STATE
      if (window.appState && window.appState.setDashboardFilter) {
        console.log('✅ Updating React state for dashboard filter');
        window.appState.setDashboardFilter(filter);
      }
      
      // Reset selections when filter changes
      if (filter !== 'salesPerson') {
        window.selectedSalesPerson = '';
        if (window.appState && window.appState.setSelectedSalesPerson) {
          window.appState.setSelectedSalesPerson('');
        }
      }
      
      if (filter !== 'event') {
        window.selectedEvent = '';
        if (window.appState && window.appState.setSelectedEvent) {
          window.appState.setSelectedEvent('');
        }
      }
      
      // Trigger chart update
      setTimeout(() => {
        console.log('📊 React Sync: Triggering chart update after dashboard filter');
        if (window.updateOptimizedCharts) {
          window.updateOptimizedCharts();
        } else if (window.initializeOptimizedCharts) {
          window.initializeOptimizedCharts();
        }
      }, 100);
    };
    
    // ===============================================
    // SALES PERSON FILTER WRAPPER
    // ===============================================
    window.setSelectedSalesPerson = function(person) {
      console.log('👤 React Sync: Sales person changing to:', person);
      
      // Update window variable
      window.selectedSalesPerson = person;
      
      // Call original function if it exists
      if (window._reactSyncOriginals.setSelectedSalesPerson) {
        try {
          window._reactSyncOriginals.setSelectedSalesPerson(person);
        } catch (error) {
          console.warn('Original setSelectedSalesPerson error:', error);
        }
      }
      
      // ✅ UPDATE REACT STATE
      if (window.appState && window.appState.setSelectedSalesPerson) {
        console.log('✅ Updating React state for selected sales person');
        window.appState.setSelectedSalesPerson(person);
      }
      
      // Trigger chart update
      setTimeout(() => {
        console.log('📊 React Sync: Triggering chart update after sales person');
        if (window.updateOptimizedCharts) {
          window.updateOptimizedCharts();
        } else if (window.initializeOptimizedCharts) {
          window.initializeOptimizedCharts();
        }
      }, 100);
    };
    
    // ===============================================
    // EVENT FILTER WRAPPER
    // ===============================================
    window.setSelectedEvent = function(event) {
      console.log('🎪 React Sync: Event changing to:', event);
      
      // Update window variable
      window.selectedEvent = event;
      
      // Call original function if it exists
      if (window._reactSyncOriginals.setSelectedEvent) {
        try {
          window._reactSyncOriginals.setSelectedEvent(event);
        } catch (error) {
          console.warn('Original setSelectedEvent error:', error);
        }
      }
      
      // ✅ UPDATE REACT STATE
      if (window.appState && window.appState.setSelectedEvent) {
        console.log('✅ Updating React state for selected event');
        window.appState.setSelectedEvent(event);
      }
      
      // Trigger chart update
      setTimeout(() => {
        console.log('📊 React Sync: Triggering chart update after event');
        if (window.updateOptimizedCharts) {
          window.updateOptimizedCharts();
        } else if (window.initializeOptimizedCharts) {
          window.initializeOptimizedCharts();
        }
      }, 100);
    };
    
    console.log('✅ React state sync wrappers configured');
  }
  
  // ===============================================
  // FORCE REACT REFRESH FUNCTION
  // ===============================================
  
  window.forceReactRefresh = function() {
    console.log('🔄 Forcing React refresh...');
    
    if (window.appState && window.appState.setLoading) {
      window.appState.setLoading(true);
      setTimeout(() => {
        window.appState.setLoading(false);
        console.log('✅ React refresh complete');
      }, 50);
    }
  };
  
  // ===============================================
  // SYNC CURRENT VALUES WITH REACT STATE
  // ===============================================
  
  function syncCurrentValuesWithReact() {
    console.log('🔄 Syncing current values with React state...');
    
    if (window.appState) {
      // Sync dashboard filter
      if (window.dashboardFilter && window.appState.setDashboardFilter) {
        console.log('🔄 Syncing dashboard filter:', window.dashboardFilter);
        window.appState.setDashboardFilter(window.dashboardFilter);
      }
      
      // Sync selected sales person
      if (window.selectedSalesPerson && window.appState.setSelectedSalesPerson) {
        console.log('🔄 Syncing selected sales person:', window.selectedSalesPerson);
        window.appState.setSelectedSalesPerson(window.selectedSalesPerson);
      }
      
      // Sync selected event
      if (window.selectedEvent && window.appState.setSelectedEvent) {
        console.log('🔄 Syncing selected event:', window.selectedEvent);
        window.appState.setSelectedEvent(window.selectedEvent);
      }
      
      console.log('✅ Current values synced with React state');
    } else {
      console.warn('⚠️ window.appState not available for syncing');
    }
  }
  
  // ===============================================
  // TEST FUNCTION FOR DEBUGGING
  // ===============================================
  
  window.testDropdownSync = function() {
    console.log('🧪 Testing dropdown sync...');
    
    // Test dashboard filter
    console.log('🧪 Testing dashboard filter change to salesPerson...');
    window.setDashboardFilter('salesPerson');
    
    setTimeout(() => {
      console.log('🧪 Testing sales person selection...');
      const firstUser = window.users && window.users[0];
      if (firstUser) {
        window.setSelectedSalesPerson(firstUser.id);
        console.log('🧪 Selected sales person:', firstUser.name);
      }
    }, 1000);
    
    setTimeout(() => {
      console.log('🧪 Testing switch to event filter...');
      window.setDashboardFilter('event');
    }, 2000);
    
    setTimeout(() => {
      console.log('🧪 Testing event selection...');
      const firstEvent = window.leads && window.leads.length > 0 ? 
        window.leads.find(lead => lead.lead_for_event)?.lead_for_event : null;
      if (firstEvent) {
        window.setSelectedEvent(firstEvent);
        console.log('🧪 Selected event:', firstEvent);
      }
    }, 3000);
    
    console.log('🧪 Test sequence started. Watch console for results.');
  };
  
  // ===============================================
  // INITIALIZATION
  // ===============================================
  
  function initializeReactSync() {
    // Wait for appState to be available
    if (!window.appState) {
      console.log('⏳ Waiting for appState to be available...');
      setTimeout(initializeReactSync, 500);
      return;
    }
    
    // Setup the enhanced wrappers
    setupReactStateSyncWrappers();
    
    // Sync current values
    setTimeout(() => {
      syncCurrentValuesWithReact();
    }, 500);
    
    // Force a refresh to ensure UI is in sync
    setTimeout(() => {
      window.forceReactRefresh();
    }, 1000);
    
    console.log('✅ React state sync system initialized');
  }
  
  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initializeReactSync, 2000);
    });
  } else {
    setTimeout(initializeReactSync, 2000);
  }
  
  console.log('🔧 React state sync fix loaded');
  
})();
