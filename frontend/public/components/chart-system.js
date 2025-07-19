// ===============================================
// SIMPLIFIED CHART SYSTEM - API BASED
// All chart data comes from backend API
// ===============================================

(function() {
  'use strict';
  
  console.log('📊 Loading simplified API-based chart system...');
  
  // ===============================================
  // CHART ALIASES FOR COMPATIBILITY
  // ===============================================
  
  // All these functions now just call the API
  window.initializeOptimizedCharts = window.createDashboardCharts;
  window.initializeChartsAdvanced = window.createDashboardCharts;
  window.smartChartInit = window.createDashboardCharts;
  window.createChartsWithCurrentData = window.createDashboardCharts;
  window.createOptimizedCharts = window.createDashboardCharts;
  window.updateOptimizedCharts = window.createDashboardCharts;
  window.initializeChartsWhenReady = window.createDashboardCharts;
  window.initializeCharts = window.createDashboardCharts;
  window.updateCharts = window.createDashboardCharts;
  window.refreshCharts = window.createDashboardCharts;
  
  // ===============================================
  // FILTER CHANGE HANDLERS
  // ===============================================
  
  // Helper to get filtered leads (for other components that might need it)
  window.getFilteredLeads = function() {
    let filteredLeads = [...(window.leads || [])];
    
    if (window.dashboardFilter === 'salesPerson' && window.selectedSalesPerson) {
      const selectedUser = (window.users || []).find(user => user.id === window.selectedSalesPerson);
      if (selectedUser) {
        filteredLeads = filteredLeads.filter(lead => lead.assigned_to === selectedUser.email);
      }
    } else if (window.dashboardFilter === 'event' && window.selectedEvent) {
      filteredLeads = filteredLeads.filter(lead => lead.lead_for_event === window.selectedEvent);
    }
    
    return filteredLeads;
  };
  
  console.log('✅ Simplified chart system loaded - all functions use API');
  
})();
