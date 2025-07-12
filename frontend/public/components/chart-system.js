// ===============================================
// FANTOPARK CRM - PRODUCTION-BASED CHART SYSTEM
// Replace your entire chart-system.js with this exact working copy
// ===============================================

console.log('📊 Loading FanToPark Chart System - PRODUCTION VERSION');

// Chart instances storage (global)
window.chartInstances = window.chartInstances || {};

// ===============================================
// PRODUCTION CHART FUNCTIONS - EXACT COPY
// ===============================================

// Temperature logic - EXACT from production
window.getDisplayTemperature = function(lead) {
  const status = (lead.status || '').toLowerCase();
  const temperature = (lead.temperature || '').toLowerCase();
  
  // If status is "quote assigned", use temperature field
  if (status === 'quote assigned') {
    if (temperature === 'hot') return 'hot';
    if (temperature === 'warm') return 'warm';
    if (temperature === 'cold') return 'cold';
    return 'cold'; // Default to cold
  }
  
  // For other statuses, check if they match temperature values
  if (['hot', 'warm', 'cold'].includes(status)) {
    return status;
  }
  
  // Use temperature field
  if (temperature === 'hot') return 'hot';
  if (temperature === 'warm') return 'warm';
  if (temperature === 'cold') return 'cold';
  
  return 'cold'; // Default to cold
};

// Filter function - EXACT from production
window.getFilteredLeads = function() {
  let filteredLeads = [...(window.leads || [])];

  if (window.dashboardFilter === 'salesPerson' && window.selectedSalesPerson) {
    filteredLeads = filteredLeads.filter(lead => lead.assigned_to === window.selectedSalesPerson);
  }

  if (window.dashboardFilter === 'event' && window.selectedEvent) {
    filteredLeads = filteredLeads.filter(lead => lead.lead_for_event === window.selectedEvent);
  }

  return filteredLeads;
};

// Chart initialization - EXACT from production
window.initializeChartsAdvanced = function() {
  console.log('Initializing advanced charts...');

  // Destroy existing charts first
  Object.keys(window.chartInstances).forEach(key => {
    if (window.chartInstances[key]) {
      window.chartInstances[key].destroy();
      window.chartInstances[key] = null;
    }
  });

  // Lead Split Chart 
  const ctx1 = document.getElementById('leadSplitChart');
  if (ctx1) {
    try {
      window.chartInstances.leadSplit = new Chart(ctx1, {
        type: 'pie',
        data: {
          labels: ['Qualified', 'Junk'],
          datasets: [{
            data: [0, 0],
            backgroundColor: ['#10b981', '#ef4444'],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 15,
                font: { size: 12, weight: 'bold' },
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              borderColor: '#ffffff',
              borderWidth: 1,
              cornerRadius: 8,
              displayColors: true,
              callbacks: {
                title: function(context) {
                  return 'Lead Split Analysis';
                },
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                  return [
                    `Status: ${label}`,
                    `Count: ${value} leads`,
                    `Percentage: ${percentage}%`
                  ];
                }
              }
            }
          }
        }
      });
      console.log('✅ Lead Split chart created');
    } catch (error) {
      console.error('Error creating advanced Lead Split chart:', error);
    }
  }

  // Temperature Count Chart
  const ctx2 = document.getElementById('tempCountChart');
  if (ctx2) {
    try {
      window.chartInstances.tempCount = new Chart(ctx2, {
        type: 'pie',
        data: {
          labels: ['Hot', 'Warm', 'Cold'],
          datasets: [{
            data: [0, 0, 0],
            backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 15,
                font: { size: 12, weight: 'bold' },
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              borderColor: '#ffffff',
              borderWidth: 1,
              cornerRadius: 8,
              displayColors: true,
              callbacks: {
                title: function(context) {
                  return 'Lead Temperature Count';
                },
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                  return [
                    `Temperature: ${label}`,
                    `Count: ${value} leads`,
                    `Percentage: ${percentage}%`
                  ];
                }
              }
            }
          }
        }
      });
      console.log('✅ Temperature Count chart created');
    } catch (error) {
      console.error('Error creating advanced Temp Count chart:', error);
    }
  }

  // Temperature Value Chart
  const ctx3 = document.getElementById('tempValueChart');
  if (ctx3) {
    try {
      window.chartInstances.tempValue = new Chart(ctx3, {
        type: 'pie',
        data: {
          labels: ['Hot', 'Warm', 'Cold'],
          datasets: [{
            data: [0, 0, 0],
            backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 15,
                font: { size: 12, weight: 'bold' },
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              borderColor: '#ffffff',
              borderWidth: 1,
              cornerRadius: 8,
              displayColors: true,
              callbacks: {
                title: function(context) {
                  return 'Lead Temperature Value';
                },
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;

                  // Format value in Lacs with better formatting
                  let formattedValue;
                  if (value >= 10000000) { // 1 Crore
                    formattedValue = (value / 10000000).toFixed(2) + ' Cr';
                  } else if (value >= 100000) { // 1 Lac
                    formattedValue = (value / 100000).toFixed(2) + ' L';
                  } else if (value >= 1000) { // 1 Thousand
                    formattedValue = (value / 1000).toFixed(1) + ' K';
                  } else {
                    formattedValue = value.toString();
                  }

                  return [
                    `Temperature: ${label}`,
                    `Value: ₹${formattedValue}`,
                    `Percentage: ${percentage}%`
                  ];
                }
              }
            }
          }
        }
      });
      console.log('✅ Temperature Value chart created');
    } catch (error) {
      console.error('Error creating advanced Temp Value chart:', error);
    }
  }

  console.log('Advanced chart initialization complete');
};

// Chart update function - EXACT from production
window.updateCharts = function(filteredLeads) {
  console.log('Updating charts with', filteredLeads.length, 'leads');

  // Lead Split Chart (Qualified vs Junk)
  const qualifiedCount = filteredLeads.filter(l => (l.status || '').toLowerCase() === 'qualified').length;
  const junkCount = filteredLeads.filter(l => (l.status || '').toLowerCase() === 'junk').length;
  console.log('Lead Split:', { qualified: qualifiedCount, junk: junkCount });

  // Temperature Count (using getDisplayTemperature)
  const hotCount = filteredLeads.filter(l => window.getDisplayTemperature(l) === 'hot').length;
  const warmCount = filteredLeads.filter(l => window.getDisplayTemperature(l) === 'warm').length;
  const coldCount = filteredLeads.filter(l => window.getDisplayTemperature(l) === 'cold').length;
  console.log('Temperature Count:', { hot: hotCount, warm: warmCount, cold: coldCount });

  // Temperature Value (using getDisplayTemperature)
  const hotValue = filteredLeads.filter(l => window.getDisplayTemperature(l) === 'hot')
    .reduce((sum, l) => sum + (parseFloat(l.potential_value) || 0), 0);
  const warmValue = filteredLeads.filter(l => window.getDisplayTemperature(l) === 'warm')
    .reduce((sum, l) => sum + (parseFloat(l.potential_value) || 0), 0);
  const coldValue = filteredLeads.filter(l => window.getDisplayTemperature(l) === 'cold')
    .reduce((sum, l) => sum + (parseFloat(l.potential_value) || 0), 0);
  console.log('Temperature Value:', { hot: hotValue, warm: warmValue, cold: coldValue });

  // Update charts if they exist
  if (window.chartInstances.leadSplit) {
    window.chartInstances.leadSplit.data.datasets[0].data = [qualifiedCount, junkCount];
    window.chartInstances.leadSplit.update();
    console.log('Lead Split chart updated');
  } else {
    console.log('Lead Split chart not found!');
  }

  if (window.chartInstances.tempCount) {
    window.chartInstances.tempCount.data.datasets[0].data = [hotCount, warmCount, coldCount];
    window.chartInstances.tempCount.update();
    console.log('Temp Count chart updated');
  } else {
    console.log('Temp Count chart not found!');
  }

  if (window.chartInstances.tempValue) {
    window.chartInstances.tempValue.data.datasets[0].data = [hotValue, warmValue, coldValue];
    window.chartInstances.tempValue.update();
    console.log('Temp Value chart updated');
  } else {
    console.log('Temp Value chart not found!');
  }
};

// ===============================================
// PRODUCTION INITIALIZATION LOGIC
// ===============================================

// Enhanced initialization that matches production useEffect
window.initializeProductionCharts = function() {
  console.log('Production chart initialization triggered', {
    activeTab: window.activeTab,
    leadsCount: (window.leads || []).length,
    chartExists: typeof Chart !== 'undefined'
  });

  if (window.activeTab === 'dashboard' && window.leads && window.leads.length > 0 && typeof Chart !== 'undefined') {
    // Wait for DOM to be ready - EXACT production timing
    const timeoutId = setTimeout(() => {
      console.log('Attempting to initialize charts...');

      // Check if canvas elements exist
      const canvas1 = document.getElementById('leadSplitChart');
      const canvas2 = document.getElementById('tempCountChart');  
      const canvas3 = document.getElementById('tempValueChart');

      console.log('Canvas elements found:', {
        leadSplit: !!canvas1,
        tempCount: !!canvas2,
        tempValue: !!canvas3
      });

      if (canvas1 && canvas2 && canvas3) {
        window.initializeChartsAdvanced();

        // Then update with current data
        setTimeout(() => {
          const filteredLeads = window.getFilteredLeads();
          window.updateCharts(filteredLeads);
        }, 100);
      } else {
        console.log('Canvas elements not ready yet, retrying...');
        // Retry after another delay
        setTimeout(() => {
          window.initializeChartsAdvanced();
          const filteredLeads = window.getFilteredLeads();
          window.updateCharts(filteredLeads);
        }, 500);
      }
    }, 200); // EXACT production delay

    return timeoutId;
  }

  // Cleanup when leaving dashboard
  if (window.activeTab !== 'dashboard') {
    if (window.chartInstances.leadSplit) {
      window.chartInstances.leadSplit.destroy();
      window.chartInstances.leadSplit = null;
    }
    if (window.chartInstances.tempCount) {
      window.chartInstances.tempCount.destroy();
      window.chartInstances.tempCount = null;
    }
    if (window.chartInstances.tempValue) {
      window.chartInstances.tempValue.destroy();
      window.chartInstances.tempValue = null;
    }
  }
};

// ===============================================
// FILTER INTEGRATION - PRODUCTION STYLE
// ===============================================

// Enhanced filter setters that trigger chart updates
const originalSetDashboardFilter = window.setDashboardFilter;
if (originalSetDashboardFilter) {
  window.setDashboardFilter = function(filter) {
    console.log('📊 Dashboard filter changed to:', filter);
    originalSetDashboardFilter(filter);
    
    // Update charts after filter change
    setTimeout(() => {
      if (window.chartInstances.leadSplit && window.leads && window.leads.length > 0) {
        const filteredLeads = window.getFilteredLeads();
        window.updateCharts(filteredLeads);
      }
    }, 100);
  };
}

const originalSetSelectedSalesPerson = window.setSelectedSalesPerson;
if (originalSetSelectedSalesPerson) {
  window.setSelectedSalesPerson = function(salesPersonId) {
    console.log('👤 Sales person filter changed to:', salesPersonId);
    originalSetSelectedSalesPerson(salesPersonId);
    
    // Update charts after filter change
    setTimeout(() => {
      if (window.chartInstances.leadSplit && window.leads && window.leads.length > 0) {
        const filteredLeads = window.getFilteredLeads();
        window.updateCharts(filteredLeads);
      }
    }, 100);
  };
}

const originalSetSelectedEvent = window.setSelectedEvent;
if (originalSetSelectedEvent) {
  window.setSelectedEvent = function(eventId) {
    console.log('🎟️ Event filter changed to:', eventId);
    originalSetSelectedEvent(eventId);
    
    // Update charts after filter change
    setTimeout(() => {
      if (window.chartInstances.leadSplit && window.leads && window.leads.length > 0) {
        const filteredLeads = window.getFilteredLeads();
        window.updateCharts(filteredLeads);
      }
    }, 100);
  };
}

// ===============================================
// DEBUG AND MANUAL FUNCTIONS
// ===============================================

window.debugCharts = function() {
  console.log('=== Chart Debug Info ===');
  console.log('Canvas elements:', {
    leadSplit: document.getElementById('leadSplitChart'),
    tempCount: document.getElementById('tempCountChart'),
    tempValue: document.getElementById('tempValueChart')
  });
  console.log('Chart instances:', window.chartInstances);
  console.log('Current leads:', window.leads);
  console.log('Lead statuses:', (window.leads || []).map(l => ({ name: l.name, status: l.status })));
};

window.forceInitCharts = function() {
  console.log('Force initializing charts...');
  window.initializeChartsAdvanced();
  
  // Update with data after initialization
  setTimeout(() => {
    if (window.leads && window.leads.length > 0) {
      const filteredLeads = window.getFilteredLeads();
      window.updateCharts(filteredLeads);
    }
  }, 200);
};

window.debugDashboard = function() {
  console.log('=== Dashboard Debug ===');
  console.log('Active tab:', window.activeTab);
  console.log('Leads count:', (window.leads || []).length);
  console.log('Chart.js loaded:', typeof Chart !== 'undefined');
  console.log('Canvas elements in DOM:', {
    leadSplit: !!document.getElementById('leadSplitChart'),
    tempCount: !!document.getElementById('tempCountChart'),
    tempValue: !!document.getElementById('tempValueChart')
  });
  console.log('Chart instances:', {
    leadSplit: !!window.chartInstances.leadSplit,
    tempCount: !!window.chartInstances.tempCount,
    tempValue: !!window.chartInstances.tempValue
  });
};

// ===============================================
// AUTO-INITIALIZATION AND DATA WATCHERS
// ===============================================

// Auto-initialize when data changes
let lastLeadsCount = 0;
setInterval(() => {
  if (window.activeTab === 'dashboard') {
    const currentLeadsCount = (window.leads || []).length;
    
    // If data changed and we have data
    if (currentLeadsCount !== lastLeadsCount && currentLeadsCount > 0) {
      console.log(`📊 Data changed: ${lastLeadsCount} → ${currentLeadsCount} leads`);
      lastLeadsCount = currentLeadsCount;
      
      // Initialize or update charts
      if (!window.chartInstances.leadSplit) {
        console.log('🎯 Charts not initialized, initializing...');
        window.initializeProductionCharts();
      } else {
        console.log('🔄 Updating existing charts...');
        const filteredLeads = window.getFilteredLeads();
        window.updateCharts(filteredLeads);
      }
    }
  }
}, 1000);

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (window.activeTab === 'dashboard') {
        window.initializeProductionCharts();
      }
    }, 1000);
  });
} else {
  setTimeout(() => {
    if (window.activeTab === 'dashboard') {
      window.initializeProductionCharts();
    }
  }, 1000);
}

// ===============================================
// SUCCESS MESSAGE
// ===============================================

console.log('📊 FanToPark Chart System - PRODUCTION VERSION loaded successfully!');
console.log('🎯 Production Features:');
console.log('   • Exact production chart logic and styling');
console.log('   • Pie charts (not doughnut) matching production');
console.log('   • Production temperature logic with getDisplayTemperature');
console.log('   • Production filter integration');
console.log('   • Auto-initialization and data watching');
console.log('🔧 Available commands:');
console.log('   • window.forceInitCharts() - Force chart initialization');
console.log('   • window.debugCharts() - Debug chart state');
console.log('   • window.debugDashboard() - Debug dashboard state');
console.log('   • window.initializeProductionCharts() - Production initialization');
