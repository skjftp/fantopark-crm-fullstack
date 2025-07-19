// frontend/public/utils/leads-api.js - API module for optimized leads operations

window.LeadsAPI = {
  // Debounce timer for search
  searchDebounceTimer: null,

  // Cache for filter options
  filterOptionsCache: null,
  filterOptionsCacheTime: null,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes

  // Store current filter values directly to avoid async state issues
  currentFilters: {
    search: '',
    status: 'all',
    source: 'all',
    business_type: 'all',
    event: 'all',
    assigned_to: 'all',
    sort_by: 'date_of_enquiry',
    sort_order: 'desc'
  },

  // Fetch paginated leads from backend
  fetchPaginatedLeads: async function(params = {}) {
    try {
      // If filters are passed in params, update our cache
      if (params.source !== undefined) this.currentFilters.source = params.source;
      if (params.business_type !== undefined) this.currentFilters.business_type = params.business_type;
      if (params.event !== undefined) this.currentFilters.event = params.event;
      if (params.assigned_to !== undefined) this.currentFilters.assigned_to = params.assigned_to;
      if (params.status !== undefined) this.currentFilters.status = params.status;
      if (params.search !== undefined) this.currentFilters.search = params.search;
      if (params.sort_by !== undefined) this.currentFilters.sort_by = params.sort_by;
      if (params.sort_order !== undefined) this.currentFilters.sort_order = params.sort_order;

      // Build query parameters using the cached filter values
      const queryParams = new URLSearchParams({
        page: params.page || window.appState.currentLeadsPage || 1,
        limit: params.limit || 20,
        search: this.currentFilters.search,
        status: this.currentFilters.status,
        source: this.currentFilters.source,
        business_type: this.currentFilters.business_type,
        event: this.currentFilters.event,
        assigned_to: this.currentFilters.assigned_to,
        sort_by: this.currentFilters.sort_by,
        sort_order: this.currentFilters.sort_order
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

      window.log.info('🔍 Fetching with filters:', {
        page: queryParams.get('page'),
        source: this.currentFilters.source,
        business_type: this.currentFilters.business_type,
        event: this.currentFilters.event,
        assigned_to: this.currentFilters.assigned_to,
        search: this.currentFilters.search || 'none'
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

        window.log.success(`✅ Loaded ${response.data?.length || 0} leads`);
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

  // Handle filter changes with immediate value storage
  handleFilterChange: async function(filterType, value) {
    window.log.debug(`🔍 Filter change: ${filterType} = ${value}`);
    
    // Update our local filter cache immediately
    this.currentFilters[filterType] = value;
    
    // Also update the React state for UI sync
    switch(filterType) {
      case 'search':
        if (window.appState.setSearchQuery) {
          window.appState.setSearchQuery(value);
        }
        
        // Debounce search input
        clearTimeout(this.searchDebounceTimer);
        this.searchDebounceTimer = setTimeout(() => {
          this.fetchPaginatedLeads({ 
            page: 1,
            ...this.currentFilters 
          });
        }, 300);
        return; // Don't apply filters immediately for search
        
      case 'status':
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
        if (window.appState.setLeadsSalesPersonFilter) {
          window.appState.setLeadsSalesPersonFilter(value);
        }
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

    // Reset to page 1 when filters change
    if (window.appState.setCurrentLeadsPage) {
      window.appState.setCurrentLeadsPage(1);
    }

    // Apply filters immediately with the new values
    await this.fetchPaginatedLeads({ 
      page: 1,
      ...this.currentFilters 
    });
  },

  // Apply all current filters and fetch data
  applyFilters: async function() {
    // Reset to first page when filters change
    if (window.appState.setCurrentLeadsPage) {
      window.appState.setCurrentLeadsPage(1);
    }
    
    // Fetch with current filter values
    await this.fetchPaginatedLeads({
      page: 1,
      ...this.currentFilters
    });
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
    window.log.info('🧹 Clearing all filters');
    
    // Reset cache
    this.currentFilters = {
      search: '',
      status: 'all',
      source: 'all',
      business_type: 'all',
      event: 'all',
      assigned_to: 'all',
      sort_by: 'date_of_enquiry',
      sort_order: 'desc'
    };
    
    // Reset all filter states
    if (window.appState.setSearchQuery) {
      window.appState.setSearchQuery('');
    }
    
    if (window.setStatusFilter) {
      window.setStatusFilter('all');
    }
    
    if (window.setSelectedStatusFilters) {
      window.setSelectedStatusFilters([]);
    }
    
    if (window.appState.setLeadsSourceFilter) {
      window.appState.setLeadsSourceFilter('all');
    }
    
    if (window.appState.setLeadsBusinessTypeFilter) {
      window.appState.setLeadsBusinessTypeFilter('all');
    }
    
    if (window.appState.setLeadsEventFilter) {
      window.appState.setLeadsEventFilter('all');
    }
    
    if (window.appState.setLeadsSalesPersonFilter) {
      window.appState.setLeadsSalesPersonFilter('all');
    }
    
    window.leadsSalesPersonFilter = 'all';
    
    if (window.appState.setLeadsSortField) {
      window.appState.setLeadsSortField('date_of_enquiry');
    }
    
    if (window.appState.setLeadsSortDirection) {
      window.appState.setLeadsSortDirection('desc');
    }
    
    if (window.appState.setCurrentLeadsPage) {
      window.appState.setCurrentLeadsPage(1);
    }
    
    // Apply filters
    await this.applyFilters();
  },

  // Initialize filters on load
  initializeFilters: function() {
    // Sync initial values from state
    this.currentFilters.search = window.appState?.searchQuery || '';
    this.currentFilters.status = window.statusFilter || 'all';
    this.currentFilters.source = window.appState?.leadsSourceFilter || 'all';
    this.currentFilters.business_type = window.appState?.leadsBusinessTypeFilter || 'all';
    this.currentFilters.event = window.appState?.leadsEventFilter || 'all';
    this.currentFilters.assigned_to = window.leadsSalesPersonFilter || window.appState?.leadsSalesPersonFilter || 'all';
    this.currentFilters.sort_by = window.appState?.leadsSortField || 'date_of_enquiry';
    this.currentFilters.sort_order = window.appState?.leadsSortDirection || 'desc';
    
    window.log.debug('🔧 Initialized filters:', this.currentFilters);
  }
};

// Initialize filters when module loads
window.LeadsAPI.initializeFilters();

// Initialize on load
window.log.info('✅ LeadsAPI module loaded with filter cache');
