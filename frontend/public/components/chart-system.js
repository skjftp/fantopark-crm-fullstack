// ===============================================
// FANTOPARK CRM - OPTIMIZED CHART SYSTEM
// Complete chart-system.js with performance optimizations
// ===============================================

// Logging controls
const ENABLE_CHART_DEBUG = false; // Set to false to reduce chart logs
const chartLog = ENABLE_CHART_DEBUG ? console.log : () => {};
const chartError = console.error; // Always log errors

// Chart instances storage
window.chartInstances = window.chartInstances || {};

// Chart update throttling
let chartUpdateTimeout = null;
let isInitializing = false;

// ===============================================
// CHART INITIALIZATION - OPTIMIZED
// ===============================================

window.initializeCharts = function() {
  chartLog('🎯 Starting chart initialization...');
  
  // Prevent multiple simultaneous initializations
  if (isInitializing) {
    chartLog('⏳ Chart initialization already in progress...');
    return;
  }
  
  isInitializing = true;
  
  const initCharts = () => {
    try {
      // Check if Chart.js is available
      if (typeof Chart === 'undefined') {
        chartLog('⏳ Chart.js not loaded, waiting...');
        setTimeout(initCharts, 200);
        return;
      }
      
      // Check if chart containers exist
      const leadSplitEl = document.getElementById('leadSplitChart');
      const tempCountEl = document.getElementById('tempCountChart'); 
      const tempValueEl = document.getElementById('tempValueChart');
      
      if (!leadSplitEl || !tempCountEl || !tempValueEl) {
        chartLog('⏳ Chart containers not ready, waiting...');
        setTimeout(initCharts, 200);
        return;
      }
      
      // Destroy existing charts first
      window.destroyAllCharts();
      
      // Initialize chart instances object
      window.chartInstances = {};
      
      // Chart configuration with performance optimizations
      const getChartConfig = (title) => ({
        responsive: true,
        maintainAspectRatio: false,
        animation: false, // Disable animations for faster loading
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 12
              }
            }
          },
          title: {
            display: true,
            text: title,
            font: {
              size: 14,
              weight: 'bold'
            },
            padding: {
              top: 10,
              bottom: 20
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      });
      
      // Create Lead Split Chart
      try {
        window.chartInstances.leadSplit = new Chart(leadSplitEl, {
          type: 'pie',
          data: {
            labels: ['Qualified', 'Junk'],
            datasets: [{
              data: [1, 1], // Default data to prevent empty chart
              backgroundColor: ['#10b981', '#ef4444'],
              borderWidth: 2,
              borderColor: '#ffffff',
              hoverOffset: 4
            }]
          },
          options: getChartConfig('Lead Quality Split')
        });
        chartLog('✅ Lead Split chart created');
      } catch (error) {
        chartError('❌ Lead Split chart error:', error);
      }
      
      // Create Temperature Count Chart
      try {
        window.chartInstances.tempCount = new Chart(tempCountEl, {
          type: 'pie',
          data: {
            labels: ['Hot', 'Warm', 'Cold'],
            datasets: [{
              data: [1, 1, 1], // Default data to prevent empty chart
              backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'],
              borderWidth: 2,
              borderColor: '#ffffff',
              hoverOffset: 4
            }]
          },
          options: getChartConfig('Lead Temperature Count')
        });
        chartLog('✅ Temperature Count chart created');
      } catch (error) {
        chartError('❌ Temperature Count chart error:', error);
      }
      
      // Create Temperature Value Chart
      try {
        window.chartInstances.tempValue = new Chart(tempValueEl, {
          type: 'pie', 
          data: {
            labels: ['Hot Value', 'Warm Value', 'Cold Value'],
            datasets: [{
              data: [1, 1, 1], // Default data to prevent empty chart
              backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'],
              borderWidth: 2,
              borderColor: '#ffffff',
              hoverOffset: 4
            }]
          },
          options: {
            ...getChartConfig('Lead Temperature Value'),
            plugins: {
              ...getChartConfig('Lead Temperature Value').plugins,
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const label = context.label || '';
                    const value = context.parsed || 0;
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                    return `${label}: ₹${window.formatValueInLacs ? window.formatValueInLacs(value) : value.toLocaleString()} (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
        chartLog('✅ Temperature Value chart created');
      } catch (error) {
        chartError('❌ Temperature Value chart error:', error);
      }
      
      chartLog('🎉 All charts initialized successfully!');
      
      // Update with real data if available
      if (window.leads && window.leads.length > 0) {
        setTimeout(() => {
          window.updateChartsWithData(window.leads);
        }, 100);
      }
      
      isInitializing = false;
      
    } catch (error) {
      chartError('❌ Chart initialization error:', error);
      isInitializing = false;
    }
  };
  
  // Start initialization based on DOM state
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCharts);
  } else {
    // DOM is already ready, but give React a moment to render
    setTimeout(initCharts, 100);
  }
};

// ===============================================
// CHART UPDATE FUNCTIONS - OPTIMIZED
// ===============================================

window.updateChartsWithData = function(leads) {
  // Throttle chart updates to prevent excessive calls
  if (chartUpdateTimeout) {
    clearTimeout(chartUpdateTimeout);
  }
  
  chartUpdateTimeout = setTimeout(() => {
    try {
      if (!leads || leads.length === 0) {
        chartLog('No leads data for charts');
        return;
      }
      
      chartLog('📊 Updating charts with', leads.length, 'leads');
      
      // Calculate metrics using the helper function
      const metrics = window.calculateChartMetrics(leads);
      
      // Update Lead Split Chart
      if (window.chartInstances?.leadSplit) {
        try {
          const { qualified, junk } = metrics.leadSplit;
          window.chartInstances.leadSplit.data.datasets[0].data = [qualified || 1, junk || 1];
          window.chartInstances.leadSplit.update('none');
          chartLog('✅ Lead Split chart updated:', { qualified, junk });
        } catch (error) {
          chartError('❌ Lead Split update error:', error);
        }
      } else {
        chartLog('⚠️ Lead Split chart not found');
      }
      
      // Update Temperature Count Chart  
      if (window.chartInstances?.tempCount) {
        try {
          const { hot, warm, cold } = metrics.tempCount;
          window.chartInstances.tempCount.data.datasets[0].data = [hot || 1, warm || 1, cold || 1];
          window.chartInstances.tempCount.update('none');
          chartLog('✅ Temperature Count chart updated:', { hot, warm, cold });
        } catch (error) {
          chartError('❌ Temperature Count update error:', error);
        }
      } else {
        chartLog('⚠️ Temperature Count chart not found');
      }
      
      // Update Temperature Value Chart
      if (window.chartInstances?.tempValue) {
        try {
          const { hot, warm, cold } = metrics.tempValue;
          window.chartInstances.tempValue.data.datasets[0].data = [hot || 1, warm || 1, cold || 1];
          window.chartInstances.tempValue.update('none');
          chartLog('✅ Temperature Value chart updated:', { hot, warm, cold });
        } catch (error) {
          chartError('❌ Temperature Value update error:', error);
        }
      } else {
        chartLog('⚠️ Temperature Value chart not found');
      }
      
    } catch (error) {
      chartError('❌ Chart update error:', error);
    }
  }, 100); // 100ms throttle
};

// ===============================================
// CHART METRICS CALCULATION
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
    // Lead Split metrics
    const qualified = leads.filter(l => l.status === 'qualified').length;
    const junk = leads.filter(l => l.status === 'junk').length;
    const other = leads.length - qualified - junk;
    
    // Temperature Count metrics
    const hot = leads.filter(l => l.status === 'hot').length;
    const warm = leads.filter(l => l.status === 'warm').length;
    const cold = leads.filter(l => l.status === 'cold').length;
    
    // Temperature Value metrics
    const hotValue = leads.filter(l => l.status === 'hot')
      .reduce((sum, l) => sum + (parseFloat(l.potential_value) || 0), 0);
    const warmValue = leads.filter(l => l.status === 'warm')
      .reduce((sum, l) => sum + (parseFloat(l.potential_value) || 0), 0);
    const coldValue = leads.filter(l => l.status === 'cold')
      .reduce((sum, l) => sum + (parseFloat(l.potential_value) || 0), 0);
    
    return {
      leadSplit: { 
        qualified: qualified || 1, 
        junk: junk || 1,
        other: other || 0
      },
      tempCount: { 
        hot: hot || 1, 
        warm: warm || 1, 
        cold: cold || 1 
      },
      tempValue: { 
        hot: hotValue || 1, 
        warm: warmValue || 1, 
        cold: coldValue || 1 
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

// Destroy all chart instances
window.destroyAllCharts = function() {
  try {
    if (window.chartInstances) {
      Object.entries(window.chartInstances).forEach(([key, chart]) => {
        try {
          if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
            chartLog(`🗑️ Destroyed ${key} chart`);
          }
        } catch (error) {
          chartLog(`⚠️ Error destroying ${key} chart:`, error.message);
        }
      });
      window.chartInstances = {};
    }
  } catch (error) {
    chartError('❌ Error destroying charts:', error);
  }
};

// Resize all charts
window.resizeAllCharts = function() {
  try {
    if (window.chartInstances) {
      Object.entries(window.chartInstances).forEach(([key, chart]) => {
        try {
          if (chart && typeof chart.resize === 'function') {
            chart.resize();
            chartLog(`📏 Resized ${key} chart`);
          }
        } catch (error) {
          chartLog(`⚠️ Error resizing ${key} chart:`, error.message);
        }
      });
    }
  } catch (error) {
    chartError('❌ Error resizing charts:', error);
  }
};

// ===============================================
// CHART EVENT HANDLERS
// ===============================================

// Handle window resize
let resizeTimeout;
window.addEventListener('resize', () => {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
  }
  resizeTimeout = setTimeout(() => {
    window.resizeAllCharts();
  }, 250);
});

// Handle visibility change (when tab becomes active/inactive)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && window.chartInstances) {
    // Tab became visible - refresh charts
    setTimeout(() => {
      if (window.leads && window.leads.length > 0) {
        window.updateChartsWithData(window.leads);
      }
    }, 100);
  }
});

// ===============================================
// CLEANUP AND INITIALIZATION
// ===============================================

// Cleanup function
window.cleanupCharts = function() {
  if (chartUpdateTimeout) {
    clearTimeout(chartUpdateTimeout);
    chartUpdateTimeout = null;
  }
  
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
    resizeTimeout = null;
  }
  
  window.destroyAllCharts();
  
  chartLog('🧹 Chart system cleaned up');
};

// Cleanup on page unload
window.addEventListener('beforeunload', window.cleanupCharts);

// ===============================================
// LEGACY COMPATIBILITY
// ===============================================

// For backward compatibility, create aliases for old function names
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
// INITIALIZATION
// ===============================================

// Auto-initialize charts when the script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(window.initializeCharts, 500);
  });
} else {
  // DOM is already ready
  setTimeout(window.initializeCharts, 500);
}

chartLog('✅ Chart system loaded successfully');
console.log('📊 FanToPark CRM Chart System v2.0 - Optimized for Performance');
