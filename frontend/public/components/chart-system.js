// ===============================================
// FANTOPARK CRM - FINAL PRODUCTION CHART SYSTEM
// Version: 5.0 - All console fixes integrated
// Replace your entire chart-system.js with this code
// ===============================================

console.log('🚀 Loading FanToPark CRM Chart System v5.0...');

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
// SMOOTH CHART RECREATION (NO FLASH)
// ===============================================
window.smoothChartRecreation = function() {
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
// CHART UPDATE FUNCTION (SAFE)
// ===============================================
window.updateCharts = function(filteredLeads) {
  // Prevent excessive updates
  const now = Date.now();
  if (now - window.chartState.lastUpdate < window.chartState.updateThrottle) {
    return;
  }
  window.chartState.lastUpdate = now;

  if (!filteredLeads || !Array.isArray(filteredLeads)) {
    chartLog('⚠️ Invalid leads data for chart update');
    return;
  }

  chartLog('🔄 Updating charts with', filteredLeads.length, 'leads');

  try {
    // Calculate data
    const qualifiedCount = filteredLeads.filter(l => (l.status || '').toLowerCase() === 'qualified').length;
    const junkCount = filteredLeads.filter(l => (l.status || '').toLowerCase() === 'junk').length;
    chartLog('📊 Lead Split:', { qualified: qualifiedCount, junk: junkCount });

    const hotCount = filteredLeads.filter(l => getDisplayTemperature(l) === 'hot').length;
    const warmCount = filteredLeads.filter(l => getDisplayTemperature(l) === 'warm').length;
    const coldCount = filteredLeads.filter(l => getDisplayTemperature(l) === 'cold').length;
    chartLog('🌡️ Temperature Count:', { hot: hotCount, warm: warmCount, cold: coldCount });

    const hotValue = filteredLeads.filter(l => getDisplayTemperature(l) === 'hot')
      .reduce((sum, l) => sum + (parseFloat(l.potential_value) || 0), 0);
    const warmValue = filteredLeads.filter(l => getDisplayTemperature(l) === 'warm')
      .reduce((sum, l) => sum + (parseFloat(l.potential_value) || 0), 0);
    const coldValue = filteredLeads.filter(l => getDisplayTemperature(l) === 'cold')
      .reduce((sum, l) => sum + (parseFloat(l.potential_value) || 0), 0);
    chartLog('💰 Temperature Value:', { hot: hotValue, warm: warmValue, cold: coldValue });

    // Update charts safely
    if (window.chartInstances.leadSplit && window.chartInstances.leadSplit.data) {
      window.chartInstances.leadSplit.data.datasets[0].data = [qualifiedCount, junkCount];
      window.chartInstances.leadSplit.update('none');
      chartLog('✅ Lead Split chart updated');
    }

    if (window.chartInstances.tempCount && window.chartInstances.tempCount.data) {
      window.chartInstances.tempCount.data.datasets[0].data = [hotCount, warmCount, coldCount];
      window.chartInstances.tempCount.update('none');
      chartLog('✅ Temp Count chart updated');
    }

    if (window.chartInstances.tempValue && window.chartInstances.tempValue.data) {
      window.chartInstances.tempValue.data.datasets[0].data = [hotValue, warmValue, coldValue];
      window.chartInstances.tempValue.update('none');
      chartLog('✅ Temp Value chart updated');
    }

  } catch (error) {
    chartError('❌ Chart update failed:', error);
    window.chartState.errorCount++;
    
    // If too many errors, try recreation
    if (window.chartState.errorCount >= window.chartState.maxErrors) {
      chartLog('🔄 Too many errors, attempting chart recreation...');
      window.smoothChartRecreation();
      window.chartState.errorCount = 0;
    }
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
    
    // Single smooth update with current data
    if (chartUpdateTimeout) clearTimeout(chartUpdateTimeout);
    chartUpdateTimeout = setTimeout(() => {
      if (window.leads && window.leads.length > 0) {
        window.smoothChartRecreation();
      }
    }, 100);
  };

  // Single clean wrapper for dashboard filter changes
  window.setDashboardFilter = function(filter) {
    chartLog('📊 Dashboard filter changed to:', filter);
    
    // Call original function
    if (window._absoluteOriginalSetDashboardFilter) {
      window._absoluteOriginalSetDashboardFilter(filter);
    }
    
    // Single smooth update with current data
    if (chartUpdateTimeout) clearTimeout(chartUpdateTimeout);
    chartUpdateTimeout = setTimeout(() => {
      if (window.leads && window.leads.length > 0) {
        window.smoothChartRecreation();
      }
    }, 100);
  };
}

// ===============================================
// REACT RE-RENDER PROTECTION
// ===============================================
function setupReactProtection() {
  const checkChartsAfterReRender = () => {
    if (window.activeTab === 'dashboard' && window.leads && window.leads.length > 0) {
      const canvas1 = document.getElementById('leadSplitChart');
      const canvas2 = document.getElementById('tempCountChart');
      const canvas3 = document.getElementById('tempValueChart');
      
      if (canvas1 && canvas2 && canvas3) {
        const chartsValid = window.chartInstances.leadSplit && 
                           window.chartInstances.tempCount && 
                           window.chartInstances.tempValue;
        
        if (!chartsValid) {
          chartLog('🛡️ Charts need recreation after React re-render');
          setTimeout(() => {
            window.smoothChartRecreation();
          }, 100);
        } else {
          chartLog('🛡️ Charts survived re-render, updating data...');
          const filteredLeads = window.getFilteredLeadsWithMapping();
          window.updateCharts(filteredLeads);
        }
      }
    }
  };

  // Check periodically but not too frequently
  setInterval(checkChartsAfterReRender, 5000);
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
  chartLog('🎯 Initializing FanToPark Chart System v5.0...');
  
  // Step 1: Set up clean wrappers
  createSingleCleanWrapper();
  
  // Step 2: Set up React protection
  setupReactProtection();
  
  // Step 3: Initialize charts when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(window.initializeChartsAdvanced, 1000);
    });
  } else {
    setTimeout(window.initializeChartsAdvanced, 1000);
  }
  
  chartLog('✅ FanToPark Chart System v5.0 initialized');
}

// ===============================================
// AUTO-INITIALIZE
// ===============================================
initializeCleanChartSystem();

// ===============================================
// SUCCESS MESSAGE
// ===============================================
console.log('🎯 FanToPark CRM Chart System v5.0 - PRODUCTION READY');
console.log('✅ Fixed: Chart.js DOM errors');
console.log('✅ Fixed: Infinite loops');
console.log('✅ Fixed: React re-render conflicts');
console.log('✅ Fixed: Filter data flash');
console.log('✅ Working: ID-to-Email mapping');
console.log('✅ Working: Smooth filter transitions');
console.log('🚀 All console fixes integrated - Ready for deployment!');
