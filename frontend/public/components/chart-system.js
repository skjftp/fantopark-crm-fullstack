// ===============================================
// OPTIMIZED CHART SYSTEM - API-BASED VERSION
// Replace your existing chart-system.js with this optimized version
// ===============================================

(function() {
  'use strict';
  
  // Prevent variable redeclaration conflicts
  if (window.chartSystemLoaded) {
    console.log('⚠️ Chart system already loaded, skipping duplicate load');
    return;
  }
  window.chartSystemLoaded = true;

  // Chart state management
  window.optimizedChartState = {
    initialized: false,
    loading: false,
    lastApiCall: 0,
    throttleDelay: 1000,
    currentFilters: null,
    chartData: null,
    error: null
  };

  // Chart instances storage
  window.chartInstances = window.chartInstances || {};

  // ✅ FIXED: Only declare if not already exists
  if (typeof window.originalSetActiveTab === 'undefined') {
    window.originalSetActiveTab = window.setActiveTab;
  }

  // Your existing chart system code goes here...
  // (Keep all the functions from the optimized chart system artifact)

  console.log('✅ Optimized Chart System Loaded - Variable conflicts resolved!');
})();


// Chart state management
window.optimizedChartState = {
  initialized: false,
  loading: false,
  lastApiCall: 0,
  throttleDelay: 1000, // 1 second throttle
  currentFilters: null,
  chartData: null,
  error: null
};

// Chart instances storage
window.chartInstances = window.chartInstances || {};

// ===============================================
// MAIN API-BASED CHART INITIALIZATION
// ===============================================
window.initializeOptimizedCharts = async function() {
  console.log('🚀 Initializing optimized API-based charts...');
  
  if (window.optimizedChartState.loading) {
    console.log('⏳ Charts already loading, skipping...');
    return;
  }
  
  window.optimizedChartState.loading = true;
  
  try {
    // Show loading state
    showChartLoadingState();
    
    // Fetch chart data from backend API
    const chartData = await fetchChartDataFromAPI();
    
    if (chartData) {
      // Store data
      window.optimizedChartState.chartData = chartData;
      
      // Render all charts with API data
      await renderChartsWithApiData(chartData);
      
      // Update dashboard stats
      updateDashboardStats(chartData);
      
      window.optimizedChartState.initialized = true;
      console.log('✅ Optimized charts initialized successfully');
    }
    
  } catch (error) {
    console.error('❌ Failed to initialize optimized charts:', error);
    window.optimizedChartState.error = error.message;
    showChartErrorState();
  } finally {
    window.optimizedChartState.loading = false;
  }
};

// ===============================================
// API DATA FETCHING
// ===============================================
async function fetchChartDataFromAPI() {
  console.log('📡 Fetching chart data from backend API...');
  
  // Build query parameters based on current filters
  const params = new URLSearchParams();
  
  if (window.dashboardFilter && window.dashboardFilter !== 'overall') {
    params.append('filter_type', window.dashboardFilter);
    
    if (window.dashboardFilter === 'salesPerson' && window.selectedSalesPerson) {
      params.append('sales_person_id', window.selectedSalesPerson);
    } else if (window.dashboardFilter === 'event' && window.selectedEvent) {
      params.append('event_name', window.selectedEvent);
    }
  }
  
  const queryString = params.toString();
  const url = `/dashboard/charts${queryString ? '?' + queryString : ''}`;
  
  console.log('📡 API URL:', url);
  
  try {
    const response = await window.apiCall(url, {
      method: 'GET'
    });
    
    if (response.success) {
      console.log('✅ Chart data received:', response.data);
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to fetch chart data');
    }
    
  } catch (error) {
    console.error('❌ API call failed:', error);
    throw error;
  }
}

// ===============================================
// CHART RENDERING WITH API DATA
// ===============================================
async function renderChartsWithApiData(apiData) {
  console.log('🎨 Rendering charts with API data...');
  
  // Destroy existing charts
  destroyExistingCharts();
  
  const { charts } = apiData;
  
  // Render Lead Split Chart
  renderLeadSplitChart(charts.leadSplit);
  
  // Render Temperature Count Chart
  renderTemperatureCountChart(charts.temperatureCount);
  
  // Render Temperature Value Chart
  renderTemperatureValueChart(charts.temperatureValue);
  
  // Hide loading state
  hideChartLoadingState();
}

// ===============================================
// INDIVIDUAL CHART RENDERERS
// ===============================================
function renderLeadSplitChart(data) {
  const canvas = document.getElementById('leadSplitChart');
  if (!canvas) {
    console.warn('❌ Lead Split chart canvas not found');
    return;
  }
  
  try {
    window.chartInstances.leadSplit = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.data,
          backgroundColor: data.colors,
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
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((context.raw / total) * 100).toFixed(1);
                return `${context.label}: ${context.raw} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
    
    console.log('✅ Lead Split chart rendered:', data.qualified, 'qualified,', data.junk, 'junk');
  } catch (error) {
    console.error('❌ Lead Split chart error:', error);
  }
}

function renderTemperatureCountChart(data) {
  const canvas = document.getElementById('tempCountChart');
  if (!canvas) {
    console.warn('❌ Temperature Count chart canvas not found');
    return;
  }
  
  try {
    window.chartInstances.tempCount = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.data,
          backgroundColor: data.colors,
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
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((context.raw / total) * 100).toFixed(1);
                return `${context.label}: ${context.raw} leads (${percentage}%)`;
              }
            }
          }
        }
      }
    });
    
    console.log('✅ Temperature Count chart rendered:', data.hot, 'hot,', data.warm, 'warm,', data.cold, 'cold');
  } catch (error) {
    console.error('❌ Temperature Count chart error:', error);
  }
}

function renderTemperatureValueChart(data) {
  const canvas = document.getElementById('tempValueChart');
  if (!canvas) {
    console.warn('❌ Temperature Value chart canvas not found');
    return;
  }
  
  try {
    window.chartInstances.tempValue = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.data,
          backgroundColor: data.colors,
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
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
                const formattedValue = '₹' + context.raw.toLocaleString('en-IN');
                return `${context.label}: ${formattedValue} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
    
    const hotValue = '₹' + data.hot.toLocaleString('en-IN');
    const warmValue = '₹' + data.warm.toLocaleString('en-IN');
    const coldValue = '₹' + data.cold.toLocaleString('en-IN');
    
    console.log('✅ Temperature Value chart rendered:', hotValue, 'hot,', warmValue, 'warm,', coldValue, 'cold');
  } catch (error) {
    console.error('❌ Temperature Value chart error:', error);
  }
}

// ===============================================
// DASHBOARD STATS UPDATE
// ===============================================
function updateDashboardStats(apiData) {
  const { summary, totalLeads } = apiData;
  
  try {
    // Update total leads count
    const totalLeadsElements = document.querySelectorAll('[data-stat="total-leads"]');
    totalLeadsElements.forEach(el => {
      el.textContent = totalLeads.toString();
    });
    
    // Update qualified leads count
    const qualifiedLeadsElements = document.querySelectorAll('[data-stat="qualified-leads"]');
    qualifiedLeadsElements.forEach(el => {
      el.textContent = summary.qualifiedLeads.toString();
    });
    
    // Update hot leads count
    const hotLeadsElements = document.querySelectorAll('[data-stat="hot-leads"]');
    hotLeadsElements.forEach(el => {
      el.textContent = summary.hotLeads.toString();
    });
    
    // Update pipeline value
    const pipelineElements = document.querySelectorAll('[data-stat="pipeline-value"]');
    pipelineElements.forEach(el => {
      el.textContent = '₹' + summary.totalPipelineValue.toLocaleString('en-IN');
    });
    
    console.log('📊 Dashboard stats updated');
    
  } catch (error) {
    console.warn('⚠️ Failed to update dashboard stats:', error);
  }
}

// ===============================================
// FILTER CHANGE HANDLER (OPTIMIZED)
// ===============================================
window.handleChartFilterChange = async function() {
  console.log('🔄 Chart filter changed, refreshing...');
  
  // Throttle API calls
  const now = Date.now();
  if (now - window.optimizedChartState.lastApiCall < window.optimizedChartState.throttleDelay) {
    console.log('⏳ Throttling chart refresh...');
    return;
  }
  
  window.optimizedChartState.lastApiCall = now;
  
  // Check if filters actually changed
  const currentFilters = {
    filter: window.dashboardFilter,
    salesPerson: window.selectedSalesPerson,
    event: window.selectedEvent
  };
  
  if (JSON.stringify(currentFilters) === JSON.stringify(window.optimizedChartState.currentFilters)) {
    console.log('📊 Filters unchanged, skipping refresh');
    return;
  }
  
  window.optimizedChartState.currentFilters = currentFilters;
  
  // Refresh charts
  await window.initializeOptimizedCharts();
};

// ===============================================
// UI STATE MANAGEMENT
// ===============================================
function showChartLoadingState() {
  const chartContainers = document.querySelectorAll('#leadSplitChart, #tempCountChart, #tempValueChart');
  chartContainers.forEach(canvas => {
    const container = canvas.closest('.bg-white, .bg-gray-800');
    if (container && !container.querySelector('.chart-loading')) {
      const loading = document.createElement('div');
      loading.className = 'chart-loading absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 bg-opacity-90';
      loading.innerHTML = `
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Loading charts...</p>
        </div>
      `;
      container.style.position = 'relative';
      container.appendChild(loading);
    }
  });
}

function hideChartLoadingState() {
  document.querySelectorAll('.chart-loading').forEach(loading => {
    loading.remove();
  });
}

function showChartErrorState() {
  hideChartLoadingState();
  
  const chartContainers = document.querySelectorAll('#leadSplitChart, #tempCountChart, #tempValueChart');
  chartContainers.forEach(canvas => {
    const container = canvas.closest('.bg-white, .bg-gray-800');
    if (container && !container.querySelector('.chart-error')) {
      const error = document.createElement('div');
      error.className = 'chart-error absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 bg-opacity-90';
      error.innerHTML = `
        <div class="text-center">
          <p class="text-sm text-red-600 dark:text-red-400 mb-2">Failed to load chart data</p>
          <button onclick="window.initializeOptimizedCharts()" 
                  class="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">
            Retry
          </button>
        </div>
      `;
      container.style.position = 'relative';
      container.appendChild(error);
    }
  });
}

function destroyExistingCharts() {
  Object.keys(window.chartInstances).forEach(key => {
    if (window.chartInstances[key] && typeof window.chartInstances[key].destroy === 'function') {
      try {
        window.chartInstances[key].destroy();
      } catch (error) {
        console.warn('⚠️ Error destroying chart:', key, error);
      }
    }
  });
  window.chartInstances = {};
}

// ===============================================
// INTEGRATION HOOKS
// ===============================================

// Replace the old chart initialization
window.smartChartInit = window.initializeOptimizedCharts;
window.createChartsWithCurrentData = window.initializeOptimizedCharts;

// Also override any existing chart functions to use the new system
window.updateCharts = window.initializeOptimizedCharts;
window.refreshCharts = window.initializeOptimizedCharts;

// Hook into filter changes
const originalSetDashboardFilter = window.setDashboardFilter;
if (originalSetDashboardFilter) {
  window.setDashboardFilter = function(value) {
    originalSetDashboardFilter(value);
    setTimeout(() => window.handleChartFilterChange(), 100);
  };
}

// Hook into tab changes
const originalSetActiveTab = window.setActiveTab;
if (originalSetActiveTab) {
  window.setActiveTab = function(tab) {
    originalSetActiveTab(tab);
    if (tab === 'dashboard') {
      setTimeout(() => window.initializeOptimizedCharts(), 500);
    }
  };
}

// ===============================================
// AUTO-INITIALIZATION
// ===============================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => window.initializeOptimizedCharts(), 1000);
  });
} else {
  setTimeout(() => window.initializeOptimizedCharts(), 1000);
}

console.log('🚀 Optimized Chart System Loaded - API-based performance boost active!');
