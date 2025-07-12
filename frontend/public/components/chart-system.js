// ===============================================
// FANTOPARK CRM - COMPLETE CHART SYSTEM - PERMANENT FIX
// Replace your entire chart-system.js with this code
// ===============================================

console.log('📊 Loading FanToPark Chart System v5.0 - PERMANENT FIX');

// Chart state management
window.chartState = {
  initialized: false,
  initializing: false,
  lastUpdate: 0,
  updateThrottle: 300,
  errorCount: 0,
  maxErrors: 3,
  initAttempts: 0,
  maxInitAttempts: 10
};

// Chart instances storage
window.chartInstances = window.chartInstances || {};

// Chart configurations - UPDATED PER REQUIREMENTS
const CHART_CONFIGS = [
  {
    id: 'leadSplitChart',
    key: 'leadSplit',
    title: 'Lead Status Split',
    labels: ['Qualified', 'Junk'], // Only Qualified and Junk
    colors: ['#10B981', '#EF4444'] // Green for Qualified, Red for Junk
  },
  {
    id: 'tempCountChart',
    key: 'tempCount', 
    title: 'Temperature Count',
    labels: ['Hot', 'Warm', 'Cold'],
    colors: ['#EF4444', '#F59E0B', '#3B82F6']
  },
  {
    id: 'tempValueChart',
    key: 'tempValue',
    title: 'Temperature Value',
    labels: ['Hot', 'Warm', 'Cold'],
    colors: ['#EF4444', '#F59E0B', '#3B82F6']
  }
];

// ===============================================
// CHART LOGIC FUNCTIONS - UPDATED PER REQUIREMENTS
// ===============================================

// Function to determine temperature with special logic for "quote assigned"
window.getLeadTemperature = function(lead) {
  const status = (lead.status || '').toLowerCase();
  const temperature = (lead.temperature || '').toLowerCase();
  
  // If status is "quote assigned", use temperature field
  if (status === 'quote assigned') {
    if (temperature === 'hot') return 'hot';
    if (temperature === 'warm') return 'warm';
    if (temperature === 'cold') return 'cold';
    return 'cold'; // Default to cold if temperature is not specified
  }
  
  // For other statuses, check if they match temperature values
  if (['hot', 'warm', 'cold'].includes(status)) {
    return status;
  }
  
  // If status is not a temperature and not "quote assigned", use temperature field
  if (temperature === 'hot') return 'hot';
  if (temperature === 'warm') return 'warm';
  if (temperature === 'cold') return 'cold';
  
  return 'cold'; // Default to cold
};

// Function to check if lead should be included in temperature charts
window.shouldIncludeInTemperatureCharts = function(lead) {
  const status = (lead.status || '').toLowerCase();
  const temperature = (lead.temperature || '').toLowerCase();
  
  // Include if status is quote assigned (will use temperature field)
  if (status === 'quote assigned') {
    return true;
  }
  
  // Include if status is hot, warm, or cold
  if (['hot', 'warm', 'cold'].includes(status)) {
    return true;
  }
  
  // Include if temperature field is hot, warm, or cold
  if (['hot', 'warm', 'cold'].includes(temperature)) {
    return true;
  }
  
  return false;
};

// Function to apply dashboard filters
window.applyDashboardFilters = function(leads) {
  let filteredLeads = [...leads];

  // Apply sales person filter
  if (window.selectedSalesPerson && window.selectedSalesPerson !== '') {
    filteredLeads = filteredLeads.filter(l => l.assigned_to === window.selectedSalesPerson);
  }

  // Apply event filter
  if (window.selectedEvent && window.selectedEvent !== '') {
    filteredLeads = filteredLeads.filter(l => l.lead_for_event === window.selectedEvent);
  }

  // Apply date range filter if exists
  if (window.dateRangeFilter) {
    const { startDate, endDate } = window.dateRangeFilter;
    filteredLeads = filteredLeads.filter(l => {
      const leadDate = new Date(l.created_date || l.date_of_enquiry);
      return leadDate >= startDate && leadDate <= endDate;
    });
  }

  return filteredLeads;
};

// ===============================================
// CHART INITIALIZATION - ROBUST VERSION
// ===============================================

window.initializeCharts = function() {
  console.log('🎯 Starting robust chart initialization...');
  
  // Prevent multiple simultaneous initializations
  if (window.chartState.initialized) {
    console.log('✅ Charts already initialized');
    return Promise.resolve();
  }
  
  if (window.chartState.initializing) {
    console.log('⏳ Chart initialization already in progress...');
    return Promise.resolve();
  }
  
  window.chartState.initializing = true;
  window.chartState.initAttempts++;
  
  return new Promise((resolve, reject) => {
    const tryInit = () => {
      try {
        // Check max attempts
        if (window.chartState.initAttempts > window.chartState.maxInitAttempts) {
          window.chartState.initializing = false;
          console.error('❌ Chart initialization failed: Max attempts exceeded');
          reject(new Error('Max initialization attempts exceeded'));
          return;
        }
        
        // Check Chart.js availability
        if (typeof Chart === 'undefined') {
          console.log(`⏳ Chart.js not loaded, attempt ${window.chartState.initAttempts}`);
          setTimeout(tryInit, 500);
          window.chartState.initAttempts++;
          return;
        }
        
        // Check if we're on dashboard tab
        if (window.activeTab !== 'dashboard') {
          console.log('⏭️ Not on dashboard tab, skipping chart init');
          window.chartState.initializing = false;
          resolve();
          return;
        }
        
        // Check for canvas elements
        const missingElements = [];
        CHART_CONFIGS.forEach(config => {
          const element = document.getElementById(config.id);
          if (!element) {
            missingElements.push(config.id);
          }
        });
        
        if (missingElements.length > 0) {
          if (window.chartState.initAttempts <= window.chartState.maxInitAttempts) {
            console.log(`⏳ Waiting for elements: ${missingElements.join(', ')} (attempt ${window.chartState.initAttempts})`);
            setTimeout(tryInit, 500);
            window.chartState.initAttempts++;
            return;
          } else {
            console.warn('⚠️ Chart containers not found after max attempts');
            window.chartState.initializing = false;
            resolve();
            return;
          }
        }
        
        // All checks passed - create charts
        console.log('✅ All prerequisites met, creating charts...');
        
        let chartsCreated = 0;
        const totalCharts = CHART_CONFIGS.length;
        
        // Destroy existing charts first
        Object.values(window.chartInstances).forEach(chart => {
          if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
          }
        });
        window.chartInstances = {};
        
        CHART_CONFIGS.forEach(config => {
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
                animation: {
                  duration: 0 // Disable animation for immediate rendering
                },
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
            console.log(`✅ ${config.title} chart created successfully`);
            
          } catch (error) {
            console.error(`❌ Failed to create ${config.title} chart:`, error);
          }
        });
        
        // Check success
        if (chartsCreated === totalCharts) {
          window.chartState.initialized = true;
          window.chartState.initializing = false;
          window.chartState.errorCount = 0;
          console.log('🎉 All charts initialized successfully!');
          
          // Update with real data if available
          if (window.leads && window.leads.length > 0) {
            setTimeout(() => {
              window.updateChartsWithData(window.leads);
            }, 100);
          }
          
          resolve();
        } else {
          console.warn(`⚠️ Only ${chartsCreated}/${totalCharts} charts created successfully`);
          window.chartState.initializing = false;
          resolve(); // Don't reject, partial success is ok
        }
        
      } catch (error) {
        console.error('❌ Chart initialization error:', error);
        window.chartState.initializing = false;
        window.chartState.errorCount++;
        
        if (window.chartState.errorCount < window.chartState.maxErrors) {
          setTimeout(tryInit, 1000);
        } else {
          reject(error);
        }
      }
    };
    
    tryInit();
  });
};

// ===============================================
// CHART DATA UPDATE FUNCTION - UPDATED LOGIC
// ===============================================

window.updateChartsWithData = function(leads) {
  if (!window.chartState.initialized || !leads || leads.length === 0) {
    console.log('⏳ Charts not ready or no data available');
    return;
  }
  
  // Throttle updates
  const now = Date.now();
  if (now - window.chartState.lastUpdate < window.chartState.updateThrottle) {
    return;
  }
  window.chartState.lastUpdate = now;
  
  console.log('📊 Updating charts with filtered data...');
  
  try {
    // Apply dashboard filters first
    const filteredLeads = window.applyDashboardFilters(leads);
    
    console.log(`🔍 Filtered leads: ${filteredLeads.length} out of ${leads.length} total leads`);
    
    // === LEAD SPLIT CHART - Only Qualified and Junk ===
    const qualifiedLeads = filteredLeads.filter(l => (l.status || '').toLowerCase() === 'qualified').length;
    const junkLeads = filteredLeads.filter(l => (l.status || '').toLowerCase() === 'junk').length;
    
    // === TEMPERATURE CHARTS - Hot/Warm/Cold with special logic ===
    const temperatureLeads = filteredLeads.filter(lead => window.shouldIncludeInTemperatureCharts(lead));
    
    const hotLeads = temperatureLeads.filter(l => window.getLeadTemperature(l) === 'hot');
    const warmLeads = temperatureLeads.filter(l => window.getLeadTemperature(l) === 'warm');
    const coldLeads = temperatureLeads.filter(l => window.getLeadTemperature(l) === 'cold');
    
    // Calculate temperature values (potential_value)
    const hotValue = hotLeads.reduce((sum, lead) => sum + (parseFloat(lead.potential_value) || 0), 0);
    const warmValue = warmLeads.reduce((sum, lead) => sum + (parseFloat(lead.potential_value) || 0), 0);
    const coldValue = coldLeads.reduce((sum, lead) => sum + (parseFloat(lead.potential_value) || 0), 0);
    
    console.log('📈 Chart metrics calculated:', {
      leadSplit: { qualified: qualifiedLeads, junk: junkLeads },
      temperatureCount: { hot: hotLeads.length, warm: warmLeads.length, cold: coldLeads.length },
      temperatureValue: { hot: hotValue, warm: warmValue, cold: coldValue }
    });
    
    // Update Lead Split Chart (Qualified vs Junk only)
    if (window.chartInstances.leadSplit) {
      window.chartInstances.leadSplit.data.datasets[0].data = [qualifiedLeads, junkLeads];
      window.chartInstances.leadSplit.update('none'); // No animation
    }
    
    // Update Temperature Count Chart
    if (window.chartInstances.tempCount) {
      window.chartInstances.tempCount.data.datasets[0].data = [hotLeads.length, warmLeads.length, coldLeads.length];
      window.chartInstances.tempCount.update('none');
    }
    
    // Update Temperature Value Chart
    if (window.chartInstances.tempValue) {
      window.chartInstances.tempValue.data.datasets[0].data = [hotValue, warmValue, coldValue];
      window.chartInstances.tempValue.update('none');
    }
    
    console.log('✅ Charts updated with latest filtered data');
    
  } catch (error) {
    console.error('❌ Error updating charts:', error);
  }
};

// ===============================================
// SMART INITIALIZATION
// ===============================================

window.smartChartInit = function() {
  console.log('🚀 Smart chart initialization...');
  
  return new Promise((resolve) => {
    // Wait for DOM and Chart.js
    const checkAndInit = () => {
      if (typeof Chart === 'undefined') {
        setTimeout(checkAndInit, 200);
        return;
      }
      
      if (window.activeTab !== 'dashboard') {
        console.log('⏭️ Not on dashboard, skipping chart init');
        resolve();
        return;
      }
      
      window.initializeCharts()
        .then(() => {
          console.log('✅ Smart initialization completed');
          resolve();
        })
        .catch(error => {
          console.warn('⚠️ Smart initialization failed:', error.message);
          resolve(); // Don't block the app
        });
    };
    
    checkAndInit();
  });
};

// ===============================================
// DASHBOARD REFRESH AND FILTER HANDLERS
// ===============================================

window.forceDashboardRefresh = function() {
  console.log('🔄 Forcing dashboard refresh...');
  
  if (window.leads && window.leads.length > 0) {
    window.updateChartsWithData(window.leads);
  }
  
  // Trigger re-render if possible
  if (window.setLoading) {
    window.setLoading(true);
    setTimeout(() => {
      window.setLoading(false);
      console.log('✅ Dashboard refresh complete');
    }, 50);
  }
};

// Enhanced filter setters to trigger chart updates
const originalSetDashboardFilter = window.setDashboardFilter;
if (originalSetDashboardFilter) {
  window.setDashboardFilter = function(filter) {
    console.log('📊 Dashboard filter changed to:', filter);
    originalSetDashboardFilter(filter);
    
    // Trigger chart update after state change
    setTimeout(() => {
      if (window.updateChartsWithData && window.leads) {
        window.updateChartsWithData(window.leads);
      }
    }, 100);
  };
}

// Sales person filter handler
const originalSetSelectedSalesPerson = window.setSelectedSalesPerson;
if (originalSetSelectedSalesPerson) {
  window.setSelectedSalesPerson = function(salesPersonId) {
    console.log('👤 Sales person filter changed to:', salesPersonId);
    originalSetSelectedSalesPerson(salesPersonId);
    
    // Trigger chart update
    setTimeout(() => {
      if (window.updateChartsWithData && window.leads) {
        window.updateChartsWithData(window.leads);
      }
    }, 100);
  };
}

// Event filter handler
const originalSetSelectedEvent = window.setSelectedEvent;
if (originalSetSelectedEvent) {
  window.setSelectedEvent = function(eventId) {
    console.log('🎟️ Event filter changed to:', eventId);
    originalSetSelectedEvent(eventId);
    
    // Trigger chart update
    setTimeout(() => {
      if (window.updateChartsWithData && window.leads) {
        window.updateChartsWithData(window.leads);
      }
    }, 100);
  };
}

// ===============================================
// MANUAL CHART CREATION (FOR DEBUGGING)
// ===============================================

window.createChartsManually = function() {
  console.log('🎯 Creating charts manually...');
  
  if (typeof Chart === 'undefined') {
    console.error('❌ Chart.js not loaded!');
    return false;
  }
  
  let successCount = 0;
  
  // Destroy existing charts first
  Object.values(window.chartInstances).forEach(chart => {
    if (chart && typeof chart.destroy === 'function') {
      chart.destroy();
    }
  });
  window.chartInstances = {};
  
  CHART_CONFIGS.forEach(config => {
    try {
      const canvas = document.getElementById(config.id);
      if (!canvas) {
        console.error(`❌ Canvas ${config.id} not found`);
        return;
      }
      
      console.log(`🎯 Creating ${config.title}...`);
      
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
          animation: {
            duration: 0 // Disable animation for immediate rendering
          },
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
            }
          }
        }
      });
      
      successCount++;
      console.log(`✅ ${config.title} created successfully`);
      
    } catch (error) {
      console.error(`❌ Failed to create ${config.title}:`, error);
    }
  });
  
  if (successCount === CHART_CONFIGS.length) {
    window.chartState.initialized = true;
    console.log('🎉 All charts created successfully!');
    
    // Update with real data if available
    if (window.leads && window.updateChartsWithData) {
      console.log('📊 Updating with real data...');
      window.updateChartsWithData(window.leads);
    }
    
    return true;
  } else {
    console.error(`❌ Only ${successCount}/${CHART_CONFIGS.length} charts created`);
    return false;
  }
};

// ===============================================
// CLEANUP AND AUTO-INITIALIZATION
// ===============================================

// Cleanup function
window.cleanupCharts = function() {
  try {
    if (window.chartInstances) {
      Object.values(window.chartInstances).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
          chart.destroy();
        }
      });
      window.chartInstances = {};
    }
    
    window.chartState.initialized = false;
    window.chartState.initializing = false;
    
    console.log('🧹 Charts cleaned up');
  } catch (error) {
    console.error('❌ Chart cleanup failed:', error);
  }
};

// Auto-cleanup on page unload
window.addEventListener('beforeunload', window.cleanupCharts);

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(window.smartChartInit, 1000);
  });
} else {
  setTimeout(window.smartChartInit, 1000);
}

// ===============================================
// LEGACY COMPATIBILITY
// ===============================================

// For backward compatibility
window.initializeChartsFixed = window.initializeCharts;
window.updateChartsWithDataFixed = window.updateChartsWithData;

// Process lead data for charts (legacy compatibility)
window.processLeadDataForCharts = function(leads, filters = {}) {
  return window.applyDashboardFilters(leads);
};

// ===============================================
// SUCCESS MESSAGE AND DEBUGGING
// ===============================================

console.log('📊 FanToPark Chart System v5.0 - PERMANENT FIX loaded successfully!');
console.log('🎯 NEW Features:');
console.log('   • Lead Split: Only Qualified vs Junk');
console.log('   • Temperature Charts: Hot/Warm/Cold with quote assigned logic');
console.log('   • Robust initialization with auto-retry');
console.log('   • Filter integration with automatic updates');
console.log('🔧 Manual commands:');
console.log('   • window.smartChartInit() - Initialize charts');
console.log('   • window.createChartsManually() - Manual creation');
console.log('   • window.forceDashboardRefresh() - Force refresh');
console.log('   • window.updateChartsWithData(window.leads) - Update with data');

// Debug helper function
window.debugChartData = function() {
  if (!window.leads) {
    console.log('❌ No leads data available');
    return;
  }
  
  const filteredLeads = window.applyDashboardFilters(window.leads);
  
  console.log('🔍 Chart Data Debug:', {
    totalLeads: window.leads.length,
    filteredLeads: filteredLeads.length,
    qualified: filteredLeads.filter(l => (l.status || '').toLowerCase() === 'qualified').length,
    junk: filteredLeads.filter(l => (l.status || '').toLowerCase() === 'junk').length,
    temperatureLeads: filteredLeads.filter(lead => window.shouldIncludeInTemperatureCharts(lead)).length,
    hot: filteredLeads.filter(l => window.getLeadTemperature(l) === 'hot').length,
    warm: filteredLeads.filter(l => window.getLeadTemperature(l) === 'warm').length,
    cold: filteredLeads.filter(l => window.getLeadTemperature(l) === 'cold').length
  });
};
