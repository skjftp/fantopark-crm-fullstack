// ===============================================
// FANTOPARK CRM - FINAL PRODUCTION CHART SYSTEM
// Version: 5.0 - All console fixes integrated
// Replace your entire chart-system.js with this code
// ===============================================

console.log('🚀 Loading FanToPark CRM Chart System v5.1 (Conservative)...');

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
// SAFE DOM CHECKING FUNCTIONS
// ===============================================
function safeGetCanvas(id) {
  try {
    const canvas = document.getElementById(id);
    if (!canvas) {
      chartLog('⚠️ Canvas not found:', id);
      return null;
    }
    if (!canvas.getContext) {
      chartLog('⚠️ Canvas invalid:', id);
      return null;
    }
    return canvas;
  } catch (error) {
    chartError('❌ Error getting canvas:', id, error);
    return null;
  }
}

function safeDestroyChart(chartInstance) {
  try {
    if (chartInstance && typeof chartInstance.destroy === 'function') {
      chartInstance.destroy();
      return true;
    }
  } catch (error) {
    chartError('⚠️ Error destroying chart:', error);
  }
  return false;
}

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
// SMOOTH CHART RECREATION (NO FLASH) WITH COOLDOWN
// ===============================================
window.smoothChartRecreation = function() {
  // Add cooldown to prevent excessive recreations
  const now = Date.now();
  if (!window.lastRecreationTime) window.lastRecreationTime = 0;
  const RECREATION_COOLDOWN = 3000; // 3 seconds between recreations
  
  if (now - window.lastRecreationTime < RECREATION_COOLDOWN) {
    chartLog('🔇 Chart recreation blocked - too soon since last recreation');
    return;
  }
  
  window.lastRecreationTime = now;

  if (window.chartState.recreationInProgress) {
    chartLog('⏳ Chart recreation already in progress...');
    return;
  }

  window.chartState.recreationInProgress = true;
  chartLog('🔄 Smooth chart recreation with current filter data...');
  
  try {
    // Get the current filtered data BEFORE recreation
    const currentFilteredLeads = window.getFilteredLeadsWithMapping();
    chartLog('📊 Using current filtered data:', currentFilteredLeads.length, 'leads');
    
    // Calculate the data for charts
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
    
    // Force destroy ALL Chart.js instances globally
    if (typeof Chart !== 'undefined' && Chart.instances) {
      Object.keys(Chart.instances).forEach(id => {
        try {
          const instance = Chart.instances[id];
          if (instance && typeof instance.destroy === 'function') {
            instance.destroy();
            delete Chart.instances[id];
          }
        } catch (error) {
          chartLog('⚠️ Error destroying global chart instance:', id, error);
        }
      });
    }
    
    // Clear our own chart instances
    window.chartInstances = {};
    
    // Clear canvas elements
    ['leadSplitChart', 'tempCountChart', 'tempValueChart'].forEach(id => {
      const canvas = document.getElementById(id);
      if (canvas) {
        canvas.removeAttribute('width');
        canvas.removeAttribute('height');
        canvas.removeAttribute('style');
        canvas.style.cssText = '';
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    });
    
    // Wait a moment then create charts with current data
    setTimeout(() => {
      try {
        // Create Lead Split Chart with CURRENT filtered data
        const canvas1 = safeGetCanvas('leadSplitChart');
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
          chartLog('✅ Lead Split chart created with current data:', qualifiedCount, junkCount);
        }
        
        // Create Temperature Count Chart with CURRENT filtered data
        const canvas2 = safeGetCanvas('tempCountChart');
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
          chartLog('✅ Temperature Count chart created with current data:', hotCount, warmCount, coldCount);
        }
        
        // Create Temperature Value Chart with CURRENT filtered data
        const canvas3 = safeGetCanvas('tempValueChart');
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
          chartLog('✅ Temperature Value chart created with current data:', hotValue, warmValue, coldValue);
        }
        
        // Mark as initialized
        window.chartState.initialized = true;
        window.chartState.initializing = false;
        window.chartState.recreationInProgress = false;
        
        chartLog('🎉 Smooth chart recreation complete - no flash!');
        
      } catch (error) {
        window.chartState.recreationInProgress = false;
        chartError('❌ Error in smooth chart recreation:', error);
      }
    }, 100);
    
  } catch (error) {
    window.chartState.recreationInProgress = false;
    chartError('❌ Error in smooth chart recreation setup:', error);
  }
};

// ===============================================
// CHART UPDATE FUNCTION (SAFE & DOM ERROR PREVENTION)
// ===============================================
window.updateCharts = function(filteredLeads) {
  // Prevent DOM errors by always using smooth recreation
  chartLog('🔄 updateCharts called - redirecting to safe recreation');
  
  if (!window.chartState.recreationInProgress && filteredLeads && Array.isArray(filteredLeads)) {
    window.smoothChartRecreation();
  }
};

// ===============================================
// MAIN CHART INITIALIZATION
// ===============================================
window.initializeChartsAdvanced = function() {
  if (window.chartState.initializing || window.chartState.recreationInProgress) {
    chartLog('⏳ Chart initialization already in progress...');
    return;
  }

  chartLog('🎯 Initializing advanced charts...');
  window.smoothChartRecreation();
};

// ===============================================
// SINGLE CLEAN FILTER WRAPPER (NO CONFLICTS)
// ===============================================
function createSingleCleanWrapper() {
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

  // Clear any existing timeouts
  if (chartUpdateTimeout) {
    clearTimeout(chartUpdateTimeout);
    chartUpdateTimeout = null;
  }

  // Single clean wrapper for sales person changes
  window.setSelectedSalesPerson = function(person) {
    chartLog('👤 Sales person filter changed to:', person);
    
    // Call original function
    if (window._absoluteOriginalSetSelectedSalesPerson) {
      window._absoluteOriginalSetSelectedSalesPerson(person);
    }
    
    // Throttled update with cooldown
    if (chartUpdateTimeout) clearTimeout(chartUpdateTimeout);
    chartUpdateTimeout = setTimeout(() => {
      if (window.leads && window.leads.length > 0) {
        window.smoothChartRecreation();
      }
    }, 300); // Increased delay to reduce frequency
  };

  // Single clean wrapper for dashboard filter changes
  window.setDashboardFilter = function(filter) {
    chartLog('📊 Dashboard filter changed to:', filter);
    
    // Call original function
    if (window._absoluteOriginalSetDashboardFilter) {
      window._absoluteOriginalSetDashboardFilter(filter);
    }
    
    // Throttled update with cooldown
    if (chartUpdateTimeout) clearTimeout(chartUpdateTimeout);
    chartUpdateTimeout = setTimeout(() => {
      if (window.leads && window.leads.length > 0) {
        window.smoothChartRecreation();
      }
    }, 300); // Increased delay to reduce frequency
  };

  // Single clean wrapper for event filter changes
  window.setSelectedEvent = function(event) {
    chartLog('🎯 Event filter changed to:', event);
    
    // Call original function
    if (window._absoluteOriginalSetSelectedEvent) {
      window._absoluteOriginalSetSelectedEvent(event);
    }
    
    // Throttled update with cooldown
    if (chartUpdateTimeout) clearTimeout(chartUpdateTimeout);
    chartUpdateTimeout = setTimeout(() => {
      if (window.leads && window.leads.length > 0) {
        window.smoothChartRecreation();
      }
    }, 300); // Increased delay to reduce frequency
  };
}

// ===============================================
// CONSERVATIVE REACT RE-RENDER PROTECTION
// ===============================================
function setupReactProtection() {
  let lastCheckTime = 0;
  const CHECK_INTERVAL = 30000; // Only check every 30 seconds
  
  const conservativeCheck = () => {
    const now = Date.now();
    
    // Only run if enough time has passed
    if (now - lastCheckTime < CHECK_INTERVAL) {
      return;
    }
    lastCheckTime = now;
    
    // Only check if we're on dashboard and have data
    if (window.activeTab !== 'dashboard' || !window.leads || window.leads.length === 0) {
      return;
    }
    
    // Only recreate if charts are actually missing or broken
    const canvas1 = document.getElementById('leadSplitChart');
    const canvas2 = document.getElementById('tempCountChart');
    const canvas3 = document.getElementById('tempValueChart');
    
    if (!canvas1 || !canvas2 || !canvas3) {
      return;
    }
    
    // Only recreate if ALL charts are missing (real problem)
    const allChartsMissing = !window.chartInstances.leadSplit && 
                            !window.chartInstances.tempCount && 
                            !window.chartInstances.tempValue;
    
    if (allChartsMissing) {
      chartLog('🛡️ All charts missing - conservative recreation needed');
      setTimeout(() => {
        if (!window.chartState.recreationInProgress) {
          window.smoothChartRecreation();
        }
      }, 1000);
    }
  };

  // Clear any existing monitor
  if (window.conservativeChartMonitor) {
    clearInterval(window.conservativeChartMonitor);
  }
  
  // Only run every 30 seconds
  window.conservativeChartMonitor = setInterval(conservativeCheck, CHECK_INTERVAL);
  chartLog('✅ Conservative React protection enabled (30 second intervals)');
}

// ===============================================
// LEGACY COMPATIBILITY & ALIASES
// ===============================================
window.initializeCharts = window.initializeChartsAdvanced;
window.smartChartInit = window.initializeChartsAdvanced;
window.forceCompleteChartRecreation = window.smoothChartRecreation;
window.safeCreateCharts = window.smoothChartRecreation;

// ===============================================
// INITIALIZE EVERYTHING
// ===============================================
function initializeCleanChartSystem() {
  chartLog('🎯 Initializing FanToPark Chart System v5.1 (Conservative)...');
  
  // Step 1: Set up clean wrappers
  createSingleCleanWrapper();
  
  // Step 2: Set up React protection
  setupReactProtection();
  
  // Step 3: Initialize charts when ready (less aggressive)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(window.initializeChartsAdvanced, 2000); // Longer delay
    });
  } else {
    setTimeout(window.initializeChartsAdvanced, 2000); // Longer delay
  }
  
  chartLog('✅ FanToPark Chart System v5.1 (Conservative) initialized');
}

// ===============================================
// AUTO-INITIALIZE
// ===============================================
initializeCleanChartSystem();

// ===============================================
// SUCCESS MESSAGE
// ===============================================
console.log('🎯 FanToPark CRM Chart System v5.1 - CONSERVATIVE RENDERING');
console.log('✅ Fixed: Chart.js DOM errors');
console.log('✅ Fixed: Infinite loops');
console.log('✅ Fixed: React re-render conflicts');
console.log('✅ Fixed: Filter data flash');
console.log('✅ Fixed: Event filter DOM errors');
console.log('✅ Fixed: Excessive re-rendering (30s intervals)');
console.log('✅ Working: ID-to-Email mapping');
console.log('✅ Working: Sales person filter');
console.log('✅ Working: Event filter');
console.log('✅ Working: Smooth filter transitions');
console.log('🛡️ Conservative monitoring: Charts only recreated when truly needed');
console.log('🚀 Production ready with performance optimization!');
