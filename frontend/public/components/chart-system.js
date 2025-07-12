// ===============================================
// FANTOPARK CRM - COMPLETE OPTIMIZED CHART SYSTEM - FIXED
// Replace your entire chart-system.js with this code
// ===============================================

// Performance and logging controls
const ENABLE_CHART_DEBUG = false; // Set to false to reduce chart logs
const chartLog = ENABLE_CHART_DEBUG ? console.log : () => {};
const chartError = console.error; // Always log errors

// Global chart state management
window.chartState = {
  initialized: false,
  initializing: false,
  lastUpdate: 0,
  updateThrottle: 300, // Min 300ms between updates
  errorCount: 0,
  maxErrors: 3,
  initAttempts: 0,
  maxInitAttempts: 20
};

// Chart instances storage
window.chartInstances = window.chartInstances || {};

// Chart update throttling
let chartUpdateTimeout = null;
let chartInitTimeout = null;

// ===============================================
// CHART INITIALIZATION - COMPLETELY OPTIMIZED
// ===============================================

window.initializeCharts = function() {
  chartLog('🎯 Starting chart initialization...');
  
  // Prevent multiple simultaneous initializations
  if (window.chartState.initialized) {
    chartLog('✅ Charts already initialized');
    return Promise.resolve();
  }
  
  if (window.chartState.initializing) {
    chartLog('⏳ Chart initialization already in progress...');
    return Promise.resolve();
  }
  
  window.chartState.initializing = true;
  window.chartState.initAttempts++;
  
  return new Promise((resolve, reject) => {
    const tryInit = () => {
      try {
        // Check if we've exceeded max attempts
        if (window.chartState.initAttempts > window.chartState.maxInitAttempts) {
          window.chartState.initializing = false;
          chartError('❌ Chart initialization failed: Max attempts exceeded');
          reject(new Error('Max initialization attempts exceeded'));
          return;
        }
        
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
          chartLog('⏳ Chart.js not loaded, attempt', window.chartState.initAttempts);
          setTimeout(tryInit, 300);
          window.chartState.initAttempts++;
          return;
        }
        
        // Check if chart containers exist
        const containers = {
          leadSplit: document.getElementById('leadSplitChart'),
          tempCount: document.getElementById('tempCountChart'),
          tempValue: document.getElementById('tempValueChart')
        };
        
        const missingContainers = Object.entries(containers)
          .filter(([key, element]) => !element)
          .map(([key]) => key);
        
        if (missingContainers.length > 0) {
          chartLog('⏳ Waiting for containers:', missingContainers, 'attempt', window.chartState.initAttempts);
          setTimeout(tryInit, 300);
          window.chartState.initAttempts++;
          return;
        }
        
        // All prerequisites met - initialize charts
        chartLog('🚀 All prerequisites met, initializing charts...');
        
        // Destroy existing charts first
        window.destroyAllCharts();
        
        // Reset chart instances
        window.chartInstances = {};
        
        // Create each chart with error handling
        const chartConfigs = [
          {
            id: 'leadSplitChart',
            key: 'leadSplit',
            title: 'Lead Split',
            labels: ['Qualified', 'Junk'],
            colors: ['#10b981', '#ef4444']
          },
          {
            id: 'tempCountChart',
            key: 'tempCount',
            title: 'Temperature Count',
            labels: ['Hot', 'Warm', 'Cold'],
            colors: ['#ef4444', '#f59e0b', '#6b7280']
          },
          {
            id: 'tempValueChart',
            key: 'tempValue',
            title: 'Temperature Value',
            labels: ['Hot', 'Warm', 'Cold'],
            colors: ['#ef4444', '#f59e0b', '#6b7280']
          }
        ];
        
        let chartsCreated = 0;
        
        chartConfigs.forEach(config => {
          try {
            const canvas = document.getElementById(config.id);
            if (!canvas) {
              throw new Error(`Canvas ${config.id} not found`);
            }
            
            const ctx = canvas.getContext('2d');
            
            window.chartInstances[config.key] = new Chart(ctx, {
              type: 'doughnut',
              data: {
                labels: config.labels,
                datasets: [{
                  data: config.labels.map(() => 1), // Default equal data
                  backgroundColor: config.colors,
                  borderWidth: 2,
                  borderColor: '#ffffff',
                  hoverBorderWidth: 3
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false, // Disable animations for performance
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      usePointStyle: true,
                      padding: 15,
                      font: { size: 12 }
                    }
                  },
                  title: {
                    display: true,
                    text: config.title,
                    font: { size: 14, weight: 'bold' },
                    padding: { top: 10, bottom: 20 }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        
                        if (config.key === 'tempValue') {
                          return `${label}: ₹${window.formatValueInLacs ? window.formatValueInLacs(value) : value.toLocaleString()} (${percentage}%)`;
                        } else {
                          return `${label}: ${value} (${percentage}%)`;
                        }
                      }
                    }
                  }
                }
              }
            });
            
            chartsCreated++;
            chartLog(`✅ ${config.title} chart created`);
            
          } catch (error) {
            chartError(`❌ Failed to create ${config.title} chart:`, error);
          }
        });
        
        // Check if all charts were created successfully
        if (chartsCreated === chartConfigs.length) {
          window.chartState.initialized = true;
          window.chartState.initializing = false;
          window.chartState.errorCount = 0;
          
          console.log('✅ All charts initialized successfully!');
          
          // Update with real data if available
          if (window.leads && window.leads.length > 0) {
            setTimeout(() => {
              window.updateChartsWithData(window.leads);
            }, 100);
          }
          
          resolve();
        } else {
          throw new Error(`Only ${chartsCreated}/${chartConfigs.length} charts created`);
        }
        
      } catch (error) {
        window.chartState.initializing = false;
        window.chartState.errorCount++;
        chartError('❌ Chart initialization error:', error);
        
        // Retry if not too many errors
        if (window.chartState.errorCount < window.chartState.maxErrors) {
          setTimeout(tryInit, 1000);
          window.chartState.initAttempts++;
        } else {
          reject(error);
        }
      }
    };
    
    // Start initialization
    tryInit();
  });
};

// ===============================================
// CHART UPDATE FUNCTIONS - HEAVILY OPTIMIZED
// ===============================================

window.updateChartsWithData = function(leads) {
  // Prevent excessive updates with throttling
  const now = Date.now();
  if (now - window.chartState.lastUpdate < window.chartState.updateThrottle) {
    chartLog('🚫 Chart update throttled');
    return;
  }
  
  // Stop updates if too many errors
  if (window.chartState.errorCount >= window.chartState.maxErrors) {
    if (!window._chartErrorWarningShown) {
      console.warn('⚠️ Chart updates disabled due to repeated errors');
      window._chartErrorWarningShown = true;
    }
    return;
  }
  
  // Clear any pending update
  if (chartUpdateTimeout) {
    clearTimeout(chartUpdateTimeout);
    chartUpdateTimeout = null;
  }
  
  chartUpdateTimeout = setTimeout(() => {
    try {
      if (!leads || leads.length === 0) {
        // Only log this once per session
        if (!window._noLeadsLoggedForCharts) {
          chartLog('📊 No leads data available for charts');
          window._noLeadsLoggedForCharts = true;
        }
        return;
      }
      
      // Reset no-leads flag when we have data
      window._noLeadsLoggedForCharts = false;
      
      chartLog('📊 Updating charts with', leads.length, 'leads');
      window.chartState.lastUpdate = now;
      
      // Get filtered leads for dashboard
      const filteredLeads = window.getFilteredLeads ? window.getFilteredLeads() : leads;
      
      // Calculate metrics efficiently
      const metrics = window.calculateChartMetrics(filteredLeads);
      
      // Update each chart safely
      const updateResults = {
        leadSplit: updateChartSafely('leadSplit', metrics.leadSplit, 'Lead Split'),
        tempCount: updateChartSafely('tempCount', metrics.tempCount, 'Temperature Count'),
        tempValue: updateChartSafely('tempValue', metrics.tempValue, 'Temperature Value')
      };
      
      const successfulUpdates = Object.values(updateResults).filter(Boolean).length;
      chartLog(`📈 Chart update complete: ${successfulUpdates}/3 charts updated`);
      
    } catch (error) {
      window.chartState.errorCount++;
      chartError('❌ Chart update failed:', error);
    }
  }, 50); // 50ms delay for batching
};

// Safe chart update helper
function updateChartSafely(chartKey, data, displayName) {
  try {
    const chart = window.chartInstances?.[chartKey];
    
    if (!chart) {
      // Only log missing charts once per type
      const logKey = `missing-${chartKey}`;
      if (!window._missingChartLogs) window._missingChartLogs = {};
      
      if (!window._missingChartLogs[logKey]) {
        chartLog(`⚠️ ${displayName} chart not available - skipping update`);
        window._missingChartLogs[logKey] = true;
        
        // Auto-reset the flag after 30 seconds
        setTimeout(() => {
          if (window._missingChartLogs) {
            delete window._missingChartLogs[logKey];
          }
        }, 30000);
      }
      return false;
    }
    
    // Clear missing chart flag when found
    if (window._missingChartLogs?.[`missing-${chartKey}`]) {
      delete window._missingChartLogs[`missing-${chartKey}`];
      chartLog(`✅ ${displayName} chart is now available`);
    }
    
    // Update chart data based on type
    let newData;
    if (chartKey === 'leadSplit') {
      newData = [data.qualified || 1, data.junk || 1];
    } else {
      newData = [data.hot || 1, data.warm || 1, data.cold || 1];
    }
    
    // Only update if data actually changed
    const currentData = chart.data.datasets[0].data;
    const dataChanged = !currentData || 
      currentData.length !== newData.length || 
      currentData.some((val, i) => val !== newData[i]);
    
    if (dataChanged) {
      chart.data.datasets[0].data = newData;
      chart.update('none'); // Fast update without animation
      chartLog(`📊 ${displayName} updated:`, newData);
    } else {
      chartLog(`📊 ${displayName} data unchanged, skipping update`);
    }
    
    return true;
    
  } catch (error) {
    chartError(`❌ Failed to update ${displayName} chart:`, error);
    window.chartState.errorCount++;
    return false;
  }
}

// ===============================================
// CHART METRICS CALCULATION - FIXED FOR TEMPERATURE VALUE
// ===============================================

window.calculateChartMetrics = function(leads) {
  if (!leads || leads.length === 0) {
    return {
      leadSplit: { qualified: 1, junk: 1 },
      tempCount: { hot: 1, warm: 1, cold: 1 },
      tempValue: { hot: 1, warm: 1, cold: 1 }
    };
  }
  
  try {
    console.log('🔍 Calculating metrics for', leads.length, 'leads');
    
    // Helper function to get temperature - check multiple fields
    const getTemperature = (lead) => {
      // Check temperature field first, then status, then fallback
      let temp = lead.temperature || lead.status || '';
      return temp.toLowerCase();
    };
    
    // Use reduce for efficient single-pass calculation
    const metrics = leads.reduce((acc, lead) => {
      const status = (lead.status || '').toLowerCase();
      const temperature = getTemperature(lead);
      const value = parseFloat(lead.potential_value) || 0;
      
      // Debug log for first few leads
      if (acc.debugCount < 3) {
        console.log('🔍 Lead debug:', {
          name: lead.name,
          status: status,
          temperature: temperature,
          potential_value: value,
          raw_temperature_field: lead.temperature,
          raw_status_field: lead.status
        });
        acc.debugCount++;
      }
      
      // Lead split metrics (based on status)
      if (status === 'qualified') acc.qualified++;
      else if (status === 'junk') acc.junk++;
      
      // Temperature metrics - FIXED: Use temperature field for both count and value
      if (temperature === 'hot') {
        acc.hotCount++;
        acc.hotValue += value; // This accumulates potential_value
      } else if (temperature === 'warm') {
        acc.warmCount++;
        acc.warmValue += value; // This accumulates potential_value
      } else if (temperature === 'cold') {
        acc.coldCount++;
        acc.coldValue += value; // This accumulates potential_value
      }
      
      return acc;
    }, {
      qualified: 0, junk: 0,
      hotCount: 0, warmCount: 0, coldCount: 0,
      hotValue: 0, warmValue: 0, coldValue: 0,
      debugCount: 0
    });
    
    console.log('📊 Calculated metrics:', {
      leadSplit: { qualified: metrics.qualified, junk: metrics.junk },
      tempCount: { hot: metrics.hotCount, warm: metrics.warmCount, cold: metrics.coldCount },
      tempValue: { hot: metrics.hotValue, warm: metrics.warmValue, cold: metrics.coldValue }
    });
    
    return {
      leadSplit: {
        qualified: metrics.qualified || 1,
        junk: metrics.junk || 1
      },
      tempCount: {
        hot: metrics.hotCount || 1,
        warm: metrics.warmCount || 1,
        cold: metrics.coldCount || 1
      },
      tempValue: {
        hot: metrics.hotValue || 1,
        warm: metrics.warmValue || 1,
        cold: metrics.coldValue || 1
      }
    };
    
  } catch (error) {
    chartError('❌ Error calculating chart metrics:', error);
    return {
      leadSplit: { qualified: 1, junk: 1 },
      tempCount: { hot: 1, warm: 1, cold: 1 },
      tempValue: { hot: 1, warm: 1, cold: 1 }
    };
  }
};

// ===============================================
// CHART UTILITY FUNCTIONS
// ===============================================

// Format large values for display
window.formatValueInLacs = function(value) {
  if (value >= 10000000) { // 1 Crore
    return (value / 10000000).toFixed(2) + 'Cr';
  } else if (value >= 100000) { // 1 Lac
    return (value / 100000).toFixed(2) + 'L';
  } else if (value >= 1000) { // 1 Thousand
    return (value / 1000).toFixed(1) + 'K';
  } else {
    return value.toString();
  }
};

// Destroy all chart instances safely
window.destroyAllCharts = function() {
  try {
    if (window.chartInstances) {
      let destroyedCount = 0;
      Object.entries(window.chartInstances).forEach(([key, chart]) => {
        try {
          if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
            destroyedCount++;
            chartLog(`🗑️ Destroyed ${key} chart`);
          }
        } catch (error) {
          chartLog(`⚠️ Error destroying ${key} chart:`, error.message);
        }
      });
      window.chartInstances = {};
      if (destroyedCount > 0) {
        chartLog(`🧹 Destroyed ${destroyedCount} charts`);
      }
    }
  } catch (error) {
    chartError('❌ Error destroying charts:', error);
  }
};

// Resize all charts
window.resizeAllCharts = function() {
  try {
    if (window.chartInstances) {
      let resizedCount = 0;
      Object.entries(window.chartInstances).forEach(([key, chart]) => {
        try {
          if (chart && typeof chart.resize === 'function') {
            chart.resize();
            resizedCount++;
          }
        } catch (error) {
          chartLog(`⚠️ Error resizing ${key} chart:`, error.message);
        }
      });
      if (resizedCount > 0) {
        chartLog(`📏 Resized ${resizedCount} charts`);
      }
    }
  } catch (error) {
    chartError('❌ Error resizing charts:', error);
  }
};

// ===============================================
// EVENT HANDLERS - OPTIMIZED
// ===============================================

// Handle window resize with throttling
let resizeTimeout;
window.addEventListener('resize', () => {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
  }
  resizeTimeout = setTimeout(() => {
    if (window.chartState.initialized) {
      window.resizeAllCharts();
    }
  }, 250);
});

// Handle visibility change (when tab becomes active/inactive)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && window.chartState.initialized) {
    // Tab became visible - refresh charts if data available
    setTimeout(() => {
      if (window.leads && window.leads.length > 0) {
        window.updateChartsWithData(window.leads);
      }
    }, 100);
  }
});

// ===============================================
// INITIALIZATION AND CLEANUP
// ===============================================

// Smart initialization based on DOM state
window.smartChartInit = function() {
  if (window.chartState.initialized || window.chartState.initializing) {
    return Promise.resolve();
  }
  
  chartLog('🎯 Starting smart chart initialization...');
  
  return window.initializeCharts()
    .then(() => {
      chartLog('✅ Smart chart initialization completed');
    })
    .catch(error => {
      chartError('❌ Smart chart initialization failed:', error);
    });
};

// Cleanup function
window.cleanupCharts = function() {
  try {
    // Clear timeouts
    if (chartUpdateTimeout) {
      clearTimeout(chartUpdateTimeout);
      chartUpdateTimeout = null;
    }
    
    if (chartInitTimeout) {
      clearTimeout(chartInitTimeout);
      chartInitTimeout = null;
    }
    
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
      resizeTimeout = null;
    }
    
    // Destroy charts
    window.destroyAllCharts();
    
    // Reset state
    window.chartState = {
      initialized: false,
      initializing: false,
      lastUpdate: 0,
      updateThrottle: 300,
      errorCount: 0,
      maxErrors: 3,
      initAttempts: 0,
      maxInitAttempts: 20
    };
    
    // Clear log flags
    window._noLeadsLoggedForCharts = false;
    window._missingChartLogs = {};
    window._chartErrorWarningShown = false;
    
    chartLog('🧹 Chart system cleaned up');
    
  } catch (error) {
    chartError('❌ Chart cleanup failed:', error);
  }
};

// Auto-cleanup on page unload
window.addEventListener('beforeunload', window.cleanupCharts);

// ===============================================
// AUTO-INITIALIZATION
// ===============================================

// Initialize charts when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(window.smartChartInit, 500);
  });
} else {
  // DOM is already ready
  setTimeout(window.smartChartInit, 500);
}

// ===============================================
// LEGACY COMPATIBILITY
// ===============================================

// For backward compatibility
window.initializeChartsFixed = window.initializeCharts;
window.updateChartsWithDataFixed = window.updateChartsWithData;

// Process lead data for charts (legacy compatibility)
window.processLeadDataForCharts = function(leads, filters = {}) {
  let filteredLeads = [...leads];

  // Apply dashboard filters
  if (filters.salesPerson) {
    filteredLeads = filteredLeads.filter(l => l.assigned_to === filters.salesPerson);
  }
  if (filters.event) {
    filteredLeads = filteredLeads.filter(l => l.lead_for_event === filters.event);
  }
  if (filters.dateRange) {
    const { startDate, endDate } = filters.dateRange;
    filteredLeads = filteredLeads.filter(l => {
      const leadDate = new Date(l.created_date || l.date_of_enquiry);
      return leadDate >= startDate && leadDate <= endDate;
    });
  }

  return filteredLeads;
};

// ===============================================
// SUCCESS MESSAGE
// ===============================================

console.log('📊 FanToPark CRM Chart System v3.1 - TEMPERATURE VALUE FIXED');
console.log('✅ Chart system loaded successfully with enhanced error handling');
console.log('🎯 Features: Throttled updates, Smart initialization, Auto-retry, Memory cleanup');
console.log('🔥 FIXED: Temperature Value chart now shows potential_value instead of count');
