// frontend/public/utils/leads-api.js - API module for optimized leads operations

window.LeadsAPI = {
  // Debounce timer for search
  searchDebounceTimer: null,

  // Cache for filter options
  filterOptionsCache: null,
  filterOptionsCacheTime: null,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes

  // Replace the fetchPaginatedLeads function in your leads-api.js with this:

  // Replace the fetchPaginatedLeads function in your leads-api.js with this:

  // Fetch paginated leads from backend
  fetchPaginatedLeads: async function(params = {}) {
    try {
      // Get current filter values from the correct sources
      const currentFilters = {
        search: window.appState.searchQuery || '',
        status: window.statusFilter || 'all',
        source: window.appState.leadsSourceFilter || 'all',
        business_type: window.appState.leadsBusinessTypeFilter || 'all',
        event: window.appState.leadsEventFilter || 'all',
        assigned_to: window.leadsSalesPersonFilter || window.appState.leadsSalesPersonFilter || 'all',
        sort_by: window.appState.leadsSortField || 'date_of_enquiry',
        sort_order: window.appState.leadsSortDirection || 'desc'
      };

      // Build query parameters, using params to override if provided
      const queryParams = new URLSearchParams({
        page: params.page || window.appState.currentLeadsPage || 1,
        limit: params.limit || 20,
        search: params.search !== undefined ? params.search : currentFilters.search,
        status: params.status !== undefined ? params.status : currentFilters.status,
        source: params.source !== undefined ? params.source : currentFilters.source,
        business_type: params.business_type !== undefined ? params.business_type : currentFilters.business_type,
        event: params.event !== undefined ? params.event : currentFilters.event,
        assigned_to: params.assigned_to !== undefined ? params.assigned_to : currentFilters.assigned_to,
        sort_by: params.sort_by !== undefined ? params.sort_by : currentFilters.sort_by,
        sort_order: params.sort_order !== undefined ? params.sort_order : currentFilters.sort_order
      });

      // Handle multi-status filter
      if (window.selectedStatusFilters && window.selectedStatusFilters.length > 0) {
        queryParams.delete('status');
        queryParams.append('status', window.selectedStatusFilters.join(','));
      }

      // Remove 'all' values from query params as backend might not expect them
      ['status', 'source', 'business_type', 'event', 'assigned_to'].forEach(param => {
        if (queryParams.get(param) === 'all') {
          queryParams.delete(param);
        }
      });

      window.log.info('🔍 Fetching paginated leads with filters:', {
        page: queryParams.get('page'),
        source: queryParams.get('source') || 'all',
        business_type: queryParams.get('business_type') || 'all',
        event: queryParams.get('event') || 'all',
        assigned_to: queryParams.get('assigned_to') || 'all',
        search: queryParams.get('search') || 'none'
      });

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
        const paginationData = response.pagination || {};
        const fullPagination = {
          page: paginationData.page || parseInt(queryParams.get('page')) || 1,
          totalPages: paginationData.totalPages || paginationData.total_pages || 1,
          total: paginationData.total || 0,
          hasNext: paginationData.hasNext !== undefined ? paginationData.hasNext : (paginationData.page < paginationData.totalPages),
          hasPrev: paginationData.hasPrev !== undefined ? paginationData.hasPrev : (paginationData.page > 1),
          perPage: paginationData.perPage || paginationData.per_page || 20
        };

        // Update pagination state
        if (window.appState.setLeadsPagination) {
          window.appState.setLeadsPagination(fullPagination);
        }

        window.log.success(`✅ Loaded ${response.data?.length || 0} leads with filters applied`);
      } else {
        throw new Error(response.message || 'Failed to fetch leads');
      }

      return response;

    } catch (error) {
      window.handleError(error, 'fetching leads');
      
      // Set empty state on error
      window.appState.setLeads([]);
      if (window.appState.setLeadsPagination) {
        window.appState.setLeadsPagination({
          page: 1,
          totalPages: 1,
          total: 0,
          hasNext: false,
          hasPrev: false,
          perPage: 20
        });
      }
      
      return { success: false, data: [], pagination: {} };
    } finally {
      if (window.appState.setLoading) {
        window.appState.setLoading(false);
      }
    }
  },

  // Replace the fetchFilterOptions function in your leads-api.js with this:

  // Fetch filter options (cached)
  fetchFilterOptions: async function(forceRefresh = false) {
    try {
      // Check cache first
      if (!forceRefresh && this.filterOptionsCache && this.filterOptionsCacheTime) {
        const cacheAge = Date.now() - this.filterOptionsCacheTime;
        if (cacheAge < this.CACHE_DURATION) {
          window.log.debug('Using cached filter options');
          // Still set the state even from cache
          if (window.appState.setLeadsFilterOptions) {
            window.appState.setLeadsFilterOptions(this.filterOptionsCache);
          }
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
        
        // IMPORTANT: Call the setter if it exists
        if (window.appState.setLeadsFilterOptions) {
          window.appState.setLeadsFilterOptions(response.data);
        } else {
          // Fallback: directly set on window
          window.appState.leadsFilterOptions = response.data;
        }
        
        window.log.success('✅ Filter options loaded:', {
          sources: response.data.sources?.length || 0,
          businessTypes: response.data.business_types?.length || 0,
          events: response.data.events?.length || 0,
          users: response.data.users?.length || 0
        });
        
        return response.data;
      }
      
      return null;
    } catch (error) {
      window.log.error('Error fetching filter options:', error);
      // Set empty options on error
      const emptyOptions = {
        sources: [],
        business_types: [],
        events: [],
        users: []
      };
      
      if (window.appState.setLeadsFilterOptions) {
        window.appState.setLeadsFilterOptions(emptyOptions);
      }
      
      return null;
    }
  },

  // Replace the handleFilterChange function in your leads-api.js with this:

  // Handle filter changes with proper state sync
  handleFilterChange: async function(filterType, value) {
    window.log.debug(`🔍 Filter change: ${filterType} = ${value}`);
    
    // Update the appropriate filter state using appState setters
    switch(filterType) {
      case 'search':
        if (window.appState.setSearchQuery) {
          window.appState.setSearchQuery(value);
        }
        
        // Debounce search input
        clearTimeout(this.searchDebounceTimer);
        this.searchDebounceTimer = setTimeout(() => {
          this.applyFilters();
        }, 300);
        return; // Don't apply filters immediately for search
        
      case 'status':
        // Status is handled differently with multi-select
        if (window.setStatusFilter) {
          window.setStatusFilter(value);
        }
        break;
        
      case 'source':
        if (window.appState.setLeadsSourceFilter) {
          window.appState.setLeadsSourceFilter(value);
        }
        break;
        
      case 'business_type':
        if (window.appState.setLeadsBusinessTypeFilter) {
          window.appState.setLeadsBusinessTypeFilter(value);
        }
        break;
        
      case 'event':
        if (window.appState.setLeadsEventFilter) {
          window.appState.setLeadsEventFilter(value);
        }
        break;
        
      case 'assigned_to':
        // This needs special handling as it uses different state name
        if (window.appState.setLeadsSalesPersonFilter) {
          window.appState.setLeadsSalesPersonFilter(value);
        }
        // Also update the global filter that fetchPaginatedLeads reads
        window.leadsSalesPersonFilter = value;
        break;
        
      case 'sort_by':
        if (window.appState.setLeadsSortField) {
          window.appState.setLeadsSortField(value);
        }
        break;
        
      case 'sort_order':
        if (window.appState.setLeadsSortDirection) {
          window.appState.setLeadsSortDirection(value);
        }
        break;
    }

    // Log current filter state for debugging
    window.log.debug('📊 Current filters after change:', {
      source: window.appState.leadsSourceFilter,
      business_type: window.appState.leadsBusinessTypeFilter,
      event: window.appState.leadsEventFilter,
      assigned_to: window.leadsSalesPersonFilter || window.appState.leadsSalesPersonFilter,
      status: window.selectedStatusFilters?.length > 0 ? window.selectedStatusFilters : window.statusFilter
    });

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
