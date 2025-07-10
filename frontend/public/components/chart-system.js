// Chart Management System Component for FanToPark CRM
// Helper function for getting lead temperature
window.getDisplayTemperature = function(lead) {
    if (lead.temperature) return lead.temperature;
    if (lead.status === "hot") return "hot";
    if (lead.status === "warm") return "warm";
    if (lead.status === "cold") return "cold";
    return "warm"; // default
};
// Extracted from index.html - maintains 100% functionality
// Handles all Chart.js initialization, updates, and management

// Advanced Chart Initialization Function
window.initializeChartsAdvanced = () => {
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
    } catch (error) {
      console.error('Error creating advanced Temp Value chart:', error);
    }
  }

  console.log('Advanced chart initialization complete');
};

// Chart Update Function
window.updateCharts = (filteredLeads) => {
  console.log('Updating charts with', filteredLeads.length, 'leads');

  // Lead Split Chart (Qualified vs Junk)
  const qualifiedCount = filteredLeads.filter(l => l.status === 'qualified').length;
  const junkCount = filteredLeads.filter(l => l.status === 'junk').length;
  console.log('Lead Split:', { qualified: qualifiedCount, junk: junkCount });

  // Temperature Count (including parallel stages)
  const hotCount = filteredLeads.filter(l => window.getDisplayTemperature(l) === 'hot').length;
  const warmCount = filteredLeads.filter(l => window.getDisplayTemperature(l) === 'warm').length;
  const coldCount = filteredLeads.filter(l => window.getDisplayTemperature(l) === 'cold').length;
  console.log('Temperature Count:', { hot: hotCount, warm: warmCount, cold: coldCount });

  // Temperature Value (including parallel stages)
  const hotValue = filteredLeads.filter(l => window.getDisplayTemperature(l) === 'hot')
    .reduce((sum, l) => sum + (l.potential_value || 0), 0);
  const warmValue = filteredLeads.filter(l => window.getDisplayTemperature(l) === 'warm')
    .reduce((sum, l) => sum + (l.potential_value || 0), 0);
  const coldValue = filteredLeads.filter(l => window.getDisplayTemperature(l) === 'cold')
    .reduce((sum, l) => sum + (l.potential_value || 0), 0);
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

// Chart Utility Functions
window.formatValueInLacs = (value) => {
  if (value >= 100000) {
    return (value / 100000).toFixed(2) + 'L';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  } else {
    return value.toString();
  }
};

// Chart Data Processing Functions
window.processLeadDataForCharts = (leads, filters = {}) => {
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

window.calculateChartMetrics = (leads) => {
  const metrics = {
    leadSplit: {
      qualified: leads.filter(l => l.status === 'qualified').length,
      junk: leads.filter(l => l.status === 'junk').length,
      other: leads.filter(l => !['qualified', 'junk'].includes(l.status)).length
    },
    temperatureCount: {
      hot: leads.filter(l => window.getDisplayTemperature(l) === 'hot').length,
      warm: leads.filter(l => window.getDisplayTemperature(l) === 'warm').length,
      cold: leads.filter(l => window.getDisplayTemperature(l) === 'cold').length
    },
    temperatureValue: {
      hot: leads.filter(l => window.getDisplayTemperature(l) === 'hot')
        .reduce((sum, l) => sum + (l.potential_value || 0), 0),
      warm: leads.filter(l => window.getDisplayTemperature(l) === 'warm')
        .reduce((sum, l) => sum + (l.potential_value || 0), 0),
      cold: leads.filter(l => window.getDisplayTemperature(l) === 'cold')
        .reduce((sum, l) => sum + (l.potential_value || 0), 0)
    }
  };

  return metrics;
};

// Chart Cleanup and Management
window.destroyAllCharts = () => {
  console.log('Destroying all charts...');
  Object.keys(window.chartInstances).forEach(key => {
    if (window.chartInstances[key]) {
      window.chartInstances[key].destroy();
      window.chartInstances[key] = null;
    }
  });
};

window.refreshCharts = (leads) => {
  console.log('Refreshing all charts with new data...');
  const filteredLeads = window.getFilteredLeads ? window.getFilteredLeads() : leads;
  window.updateCharts(filteredLeads);
};

// Financial Charts (for Finance tab)
window.initializeFinancialCharts = () => {
  // Receivables Pie Chart
  const receivablesElement = document.getElementById('receivablesPieChart');
  if (receivablesElement && window.receivables && window.receivables.filter(r => r.status === 'pending').length > 0) {
    const ctx = receivablesElement.getContext('2d');

    // Destroy existing chart if any
    if (window.receivablesChart) {
      window.receivablesChart.destroy();
    }

    // Group receivables by salesperson
    const receivablesBySalesperson = {};
    window.receivables
      .filter(r => r.status === 'pending')
      .forEach(receivable => {
        const salesperson = receivable.assigned_to || 'Unassigned';
        receivablesBySalesperson[salesperson] = (receivablesBySalesperson[salesperson] || 0) + receivable.expected_amount;
      });

    window.receivablesChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: Object.keys(receivablesBySalesperson),
        datasets: [{
          data: Object.values(receivablesBySalesperson),
          backgroundColor: [
            '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
            '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${context.label}: ₹${value.toLocaleString()} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }
};

// Chart Export Functions
window.exportChartAsImage = (chartId, filename = 'chart.png') => {
  const canvas = document.getElementById(chartId);
  if (canvas) {
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();
  }
};

window.getChartDataForExport = (chartType) => {
  const chart = window.chartInstances[chartType];
  if (chart) {
    return {
      labels: chart.data.labels,
      data: chart.data.datasets[0].data,
      type: chart.config.type
    };
  }
  return null;
};

// Chart Animation and Interaction
window.animateChartUpdate = (chartInstance, newData) => {
  if (chartInstance) {
    chartInstance.data.datasets[0].data = newData;
    chartInstance.update('active');
  }
};

window.highlightChartSegment = (chartType, segmentIndex) => {
  const chart = window.chartInstances[chartType];
  if (chart) {
    chart.setActiveElements([{
      datasetIndex: 0,
      index: segmentIndex
    }]);
    chart.update('active');
  }
};

// Debug and Analysis Functions
window.debugCharts = () => {
  console.log('=== Chart Debug Info ===');
  console.log('Canvas elements:', {
    leadSplit: document.getElementById('leadSplitChart'),
    tempCount: document.getElementById('tempCountChart'),
    tempValue: document.getElementById('tempValueChart')
  });
  console.log('Chart instances:', window.chartInstances);
  console.log('Current leads:', window.leads);
  console.log('Lead statuses:', window.leads?.map(l => ({ name: l.name, status: l.status })));
};

window.forceInitCharts = () => {
  console.log('Force initializing charts...');
  window.initializeChartsAdvanced();
};

window.debugDashboard = () => {
  console.log('=== Dashboard Debug ===');
  console.log('Active tab:', window.activeTab);
  console.log('Leads count:', window.leads?.length);
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

  // Try to reinitialize
  if (window.activeTab === 'dashboard') {
    console.log('Attempting manual chart initialization...');
    window.initializeChartsAdvanced();
  }
};

// Chart Theme Management
window.updateChartsTheme = (isDarkMode) => {
  const textColor = isDarkMode ? '#f3f4f6' : '#374151';
  const borderColor = isDarkMode ? '#4b5563' : '#e5e7eb';

  Object.values(window.chartInstances).forEach(chart => {
    if (chart) {
      chart.options.plugins.legend.labels.color = textColor;
      chart.options.plugins.tooltip.titleColor = textColor;
      chart.options.plugins.tooltip.bodyColor = textColor;
      chart.options.plugins.tooltip.borderColor = borderColor;
      chart.update();
    }
  });
};

// Chart Resize Handler
window.handleChartResize = () => {
  Object.values(window.chartInstances).forEach(chart => {
    if (chart) {
      chart.resize();
    }
  });
};

// Global chart management setup
window.chartInstances = window.chartInstances || {
  leadSplit: null,
  tempCount: null,
  tempValue: null
};

// Set up global references for debugging
window.calculateDashboardStats = window.calculateDashboardStats || (() => {});

console.log('✅ Chart Management System component loaded successfully');
