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
