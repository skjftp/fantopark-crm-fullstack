// frontend/public/utils/leads-api.js - API module for optimized leads operations

window.LeadsAPI = {
  // Debounce timer for search
  searchDebounceTimer: null,

  // Cache for filter options
  filterOptionsCache: null,
  filterOptionsCacheTime: null,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes

  // Fetch paginated leads from backend
  fetchPaginatedLeads: async function(params = {}) {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: params.page || window.appState.currentLeadsPage || 1,
        limit: params.limit || window.appState.itemsPerPage || 20,
        search: params.search !== undefined ? params.search : (window.appState.searchQuery || ''),
        status: params.status || window.statusFilter || 'all',
        source: params.source || window.appState.leadsSourceFilter || 'all',
        business_type: params.business_type || window.appState.leadsBusinessTypeFilter || 'all',
        event: params.event || window.appState.leadsEventFilter || 'all',
        assigned_to: params.assigned_to || window.appState.leadsSalesPersonFilter || 'all',
        sort_by: params.sort_by || window.appState.leadsSortField || 'date_of_enquiry',
        sort_order: params.sort_order || window.appState.leadsSortDirection || 'desc'
      });

      window.log.info('Fetching paginated leads with params:', queryParams.toString());

      // Show loading state
      if (window.appState.setLoading) {
        window.appState.setLoading(true);
      }

      // Make API call
      const response = await window.apiCall(`/leads/paginated?${queryParams.toString()}`);

      if (response.success) {
        // Update leads state
        window.appState.setLeads(response.data || []);

        // Update pagination info
        // Update pagination info
if (response.pagination) {
  window.appState.totalLeads = response.pagination.total;
  window.appState.totalLeadsPages = response.pagination.totalPages;
  
  // Use the setState function to properly update pagination
  if (window.appState.setLeadsPagination) {
    window.appState.setLeadsPagination({
      ...response.pagination,
      currentPage: response.pagination.page,
      hasNext: response.pagination.hasNext,
      hasPrev: response.pagination.hasPrev
    });
  } else {
    // Fallback if setState not available
    window.appState.leadsPagination = {
      ...response.pagination,
      currentPage: response.pagination.page,
      hasNext: response.pagination.hasNext,
      hasPrev: response.pagination.hasPrev
    };
  }
}

        window.log.success(`Loaded ${response.data.length} leads (page ${response.pagination.page} of ${response.pagination.totalPages})`);
      }

      return response;

    } catch (error) {
      window.handleError(error, 'fetching leads');
      return { success: false, data: [], pagination: {} };
    } finally {
      if (window.appState.setLoading) {
        window.appState.setLoading(false);
      }
    }
  },

  // Fetch filter options (cached)
  fetchFilterOptions: async function(forceRefresh = false) {
    try {
      // Check cache first
      if (!forceRefresh && this.filterOptionsCache && this.filterOptionsCacheTime) {
        const cacheAge = Date.now() - this.filterOptionsCacheTime;
        if (cacheAge < this.CACHE_DURATION) {
          window.log.debug('Using cached filter options');
          return this.filterOptionsCache;
        }
      }

      window.log.info('Fetching fresh filter options');
      const response = await window.apiCall('/leads/filter-options');
      
      if (response.success) {
        // Update cache
        this.filterOptionsCache = response.data;
        this.filterOptionsCacheTime = Date.now();
        
        // Store in app state for other components
        window.appState.leadsFilterOptions = response.data;
        
        return response.data;
      }
      
      return null;
    } catch (error) {
      window.log.error('Error fetching filter options:', error);
      return null;
    }
  },

  // Handle filter changes with debouncing for search
  handleFilterChange: async function(filterType, value) {
    // Update the appropriate filter state
    switch(filterType) {
      case 'search':
        window.setSearchQuery(value);
        
        // Debounce search input
        clearTimeout(this.searchDebounceTimer);
        this.searchDebounceTimer = setTimeout(() => {
          this.applyFilters();
        }, 300);
        return; // Don't apply filters immediately for search
        
      case 'status':
        window.setStatusFilter(value);
        break;
        
      case 'source':
        window.setLeadsSourceFilter(value);
        break;
        
      case 'business_type':
        window.setLeadsBusinessTypeFilter(value);
        break;
        
      case 'event':
        window.setLeadsEventFilter(value);
        break;
        
      case 'assigned_to':
        window.setLeadsSalesPersonFilter(value);
        break;
        
      case 'sort_by':
        window.setLeadsSortField(value);
        break;
        
      case 'sort_order':
        window.setLeadsSortDirection(value);
        break;
    }

    // Apply filters immediately for non-search filters
    await this.applyFilters();
  },

  // Apply all current filters and fetch data
  applyFilters: async function() {
    // Reset to first page when filters change
    window.appState.setCurrentLeadsPage(1);
    
    // Fetch new data
    await this.fetchPaginatedLeads();
  },

  // Handle pagination
  changePage: async function(newPage) {
    if (newPage < 1 || (window.appState.leadsPagination && newPage > window.appState.leadsPagination.totalPages)) {
      return;
    }

    window.appState.setCurrentLeadsPage(newPage);
    await this.fetchPaginatedLeads({ page: newPage });
  },

  // Refresh current page
  refresh: async function() {
    await this.fetchPaginatedLeads();
  },

  // Clear all filters and refresh
  clearAllFilters: async function() {
    window.setSearchQuery('');
    window.setStatusFilter('all');
    window.setSelectedStatusFilters([]);
    window.setLeadsSourceFilter('all');
    window.setLeadsBusinessTypeFilter('all');
    window.setLeadsEventFilter('all');
    window.setLeadsSalesPersonFilter('all');
    
    await this.applyFilters();
  }
};

// Initialize on load
window.log.info('LeadsAPI module loaded');
