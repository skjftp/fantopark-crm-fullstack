// ===============================================
// FANTOPARK CRM - FINAL PRODUCTION CHART SYSTEM
// Version: 6.0 - Based on Working Emergency Fix
// Replace your entire chart-system.js with this code
// ===============================================

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

// Chart update throttling
let chartUpdateTimeout = null;

// ===============================================
// ID-TO-EMAIL MAPPING FUNCTION (WORKING & TESTED)
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
        chartLog('🔍 Filtering by email:', '"' + salesPersonEmail + '"');
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
// WORKING CHART CREATION (EMERGENCY-TESTED)
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
    
    const hotCount = currentFilteredLeads.filter(l => getDisplayTemperature(l) === 'hot').length;
    const warmCount = currentFilteredLeads.filter(l => getDisplayTemperature(l) === 'warm').length;
    const coldCount = currentFilteredLeads.filter(l => getDisplayTemperature(l) === 'cold').length;
    
    const hotValue = currentFilteredLeads.filter(l => getDisplayTemperature(l) === 'hot')
      .reduce((sum, l) => sum + (parseFloat(l.potential_value) || 0), 0);
    const warmValue = currentFilteredLeads.filter(l => getDisplayTemperature(l) === 'warm')
      .reduce((sum, l) => sum + (parseFloat(l.potential_value) || 0), 0);
    const coldValue = currentFilteredLeads.filter(l => getDisplayTemperature(l) === 'cold')
      .reduce((sum, l) => sum + (parseFloat(l.potential_value) || 0), 0);
    
    // Create Lead Split Chart
    const canvas1 = document.getElementById('leadSplitChart');
    if (canvas1) {
      window.chartInstances.leadSplit = new Chart(canvas1, {
        type: 'pie',
        data: {
          labels: ['Qualified', 'Junk'],
          datasets: [{
            data: [qualifiedCount, junkCount],
            backgroundColor: ['#10B981', '#EF4444'],
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } }
        }
      });
      chartLog('✅ Lead Split chart created:', qualifiedCount, 'qualified,', junkCount, 'junk');
    } else {
      chartLog('❌ Canvas leadSplitChart not found');
    }
    
    // Create Temperature Count Chart
    const canvas2 = document.getElementById('tempCountChart');
    if (canvas2) {
      window.chartInstances.tempCount = new Chart(canvas2, {
        type: 'pie',
        data: {
          labels: ['Hot', 'Warm', 'Cold'],
          datasets: [{
            data: [hotCount, warmCount, coldCount],
            backgroundColor: ['#EF4444', '#F59E0B', '#3B82F6'],
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } }
        }
      });
      chartLog('✅ Temp Count chart created:', hotCount, 'hot,', warmCount, 'warm,', coldCount, 'cold');
    } else {
      chartLog('❌ Canvas tempCountChart not found');
    }
    
    // Create Temperature Value Chart
    const canvas3 = document.getElementById('tempValueChart');
    if (canvas3) {
      window.chartInstances.tempValue = new Chart(canvas3, {
        type: 'pie',
        data: {
          labels: ['Hot Value', 'Warm Value', 'Cold Value'],
          datasets: [{
            data: [hotValue, warmValue, coldValue],
            backgroundColor: ['#EF4444', '#F59E0B', '#3B82F6'],
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } }
        }
      });
      chartLog('✅ Temp Value chart created:', '₹' + hotValue, 'hot, ₹' + warmValue, 'warm, ₹' + coldValue, 'cold');
    } else {
      chartLog('❌ Canvas tempValueChart not found');
    }
    
    window.chartState.initialized = true;
    window.chartState.initializing = false;
    window.chartState.recreationInProgress = false;
    
    chartLog('🎉 All charts created successfully!');
    
  } catch (error) {
    chartError('❌ Chart creation failed:', error);
    window.chartState.initialized = false;
    window.chartState.initializing = false;
    window.chartState.recreationInProgress = false;
  }
};

// ===============================================
// MAIN CHART INITIALIZATION (WORKING)
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
// SIMPLE FILTER WRAPPERS (WORKING & TESTED)
// ===============================================
function createWorkingFilterWrappers() {
  // Store absolute originals ONCE
  if (!window._absoluteOriginalSetSelectedSalesPerson) {
    window._absoluteOriginalSetSelectedSalesPerson = window.setSelectedSalesPerson;
  }
  if (!window._absoluteOriginalSetDashboardFilter) {
    window._absoluteOriginalSetDashboardFilter = window.setDashboardFilter;
  }
  if (!window._absoluteOriginalSetSelectedEvent) {
    window._absoluteOriginalSetSelectedEvent = window.setSelectedEvent;
  }

  // Sales person filter wrapper
  window.setSelectedSalesPerson = function(person) {
    chartLog('👤 Sales person filter changed to:', person);
    
    // Call original function
    if (window._absoluteOriginalSetSelectedSalesPerson) {
      window._absoluteOriginalSetSelectedSalesPerson(person);
    }
    
    // Simple timeout to recreate charts
    if (chartUpdateTimeout) clearTimeout(chartUpdateTimeout);
    chartUpdateTimeout = setTimeout(() => {
      if (window.leads && window.leads.length > 0) {
        window.createChartsWithCurrentData();
      }
    }, 200);
  };

  // Dashboard filter wrapper
  window.setDashboardFilter = function(filter) {
    chartLog('📊 Dashboard filter changed to:', filter);
    
    // Call original function
    if (window._absoluteOriginalSetDashboardFilter) {
      window._absoluteOriginalSetDashboardFilter(filter);
    }
    
    // Simple timeout to recreate charts
    if (chartUpdateTimeout) clearTimeout(chartUpdateTimeout);
    chartUpdateTimeout = setTimeout(() => {
      if (window.leads && window.leads.length > 0) {
        window.createChartsWithCurrentData();
      }
    }, 200);
  };

  // Event filter wrapper
  window.setSelectedEvent = function(event) {
    chartLog('🎯 Event filter changed to:', event);
    
    // Call original function
    if (window._absoluteOriginalSetSelectedEvent) {
      window._absoluteOriginalSetSelectedEvent(event);
    }
    
    // Simple timeout to recreate charts
    if (chartUpdateTimeout) clearTimeout(chartUpdateTimeout);
    chartUpdateTimeout = setTimeout(() => {
      if (window.leads && window.leads.length > 0) {
        window.createChartsWithCurrentData();
      }
    }, 200);
  };
}

// ===============================================
// MINIMAL REACT PROTECTION (NON-AGGRESSIVE)
// ===============================================
function setupMinimalReactProtection() {
  let lastProtectionCheck = 0;
  const PROTECTION_INTERVAL = 15000; // Check every 15 seconds only
  
  const minimalCheck = () => {
    const now = Date.now();
    
    // Only run occasionally
    if (now - lastProtectionCheck < PROTECTION_INTERVAL) {
      return;
    }
    lastProtectionCheck = now;
    
    // Only check if we're on dashboard and have data
    if (window.activeTab !== 'dashboard' || !window.leads || window.leads.length === 0) {
      return;
    }
    
    // Only recreate if charts are completely missing
    const noChartsExist = !window.chartInstances.leadSplit && 
                         !window.chartInstances.tempCount && 
                         !window.chartInstances.tempValue;
    
    if (noChartsExist) {
      const canvas1 = document.getElementById('leadSplitChart');
      const canvas2 = document.getElementById('tempCountChart');
      const canvas3 = document.getElementById('tempValueChart');
      
      if (canvas1 && canvas2 && canvas3) {
        chartLog('🛡️ Minimal protection: Charts missing, recreating...');
        setTimeout(() => {
          window.createChartsWithCurrentData();
        }, 1000);
      }
    }
  };

  // Clear any existing protection
  if (window.minimalChartProtection) {
    clearInterval(window.minimalChartProtection);
  }
  
  // Set up minimal protection
  window.minimalChartProtection = setInterval(minimalCheck, PROTECTION_INTERVAL);
  chartLog('✅ Minimal React protection enabled (15 second intervals)');
}

// ===============================================
// LEGACY COMPATIBILITY & ALIASES
// ===============================================
window.initializeCharts = window.initializeChartsAdvanced;
window.smartChartInit = window.initializeChartsAdvanced;
window.forceCompleteChartRecreation = window.createChartsWithCurrentData;
window.smoothChartRecreation = window.createChartsWithCurrentData;
window.safeCreateCharts = window.createChartsWithCurrentData;
window.emergencyChartCreation = window.createChartsWithCurrentData;

// Redirect updateCharts to avoid DOM errors
window.updateCharts = function(filteredLeads) {
  chartLog('🔄 updateCharts called - redirecting to safe creation');
  window.createChartsWithCurrentData();
};

// ===============================================
// INITIALIZE EVERYTHING
// ===============================================
function initializeWorkingChartSystem() {
  chartLog('🎯 Initializing Working Chart System v6.0...');
  
  // Step 1: Set up working filter wrappers
  createWorkingFilterWrappers();
  
  // Step 2: Set up minimal React protection
  setupMinimalReactProtection();
  
  // Step 3: Initialize charts when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(window.initializeChartsAdvanced, 1000);
    });
  } else {
    setTimeout(window.initializeChartsAdvanced, 1000);
  }
  
  chartLog('✅ Working Chart System v6.0 initialized');
}

// ===============================================
// AUTO-INITIALIZE
// ===============================================
initializeWorkingChartSystem();

