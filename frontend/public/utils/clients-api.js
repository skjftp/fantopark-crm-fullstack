// Client API module for paginated operations
window.ClientsAPI = {
  currentPage: 1,
  perPage: 20,
  
  // Store pagination data directly
  paginationData: {
    page: 1,
    totalPages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false,
    perPage: 20
  },
  
  // Fetch paginated clients from backend
  fetchPaginatedClients: async function(params = {}) {
    try {
      const page = params.page || this.currentPage;
      const limit = params.limit || this.perPage;
      
      window.log.info(`📋 Fetching clients page ${page}`);
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: page,
        limit: limit
      });
      
      // Fetch paginated clients from API
      const response = await window.apiCall(`/clients?${queryParams.toString()}`);
      
      if (response.success) {
        // Update state with paginated data
        if (window.appState.setClients) {
          window.appState.setClients(response.data || []);
        }
        
        // Update pagination info
        const paginationData = response.pagination || {};
        const fullPagination = {
          page: paginationData.page || page,
          totalPages: paginationData.totalPages || 1,
          total: paginationData.total || 0,
          hasNext: paginationData.hasNext || false,
          hasPrev: paginationData.hasPrev || false,
          perPage: paginationData.limit || limit
        };
        
        // Store pagination data locally
        this.paginationData = fullPagination;

        setTimeout(() => {
    if (window.appState?.setClientsPagination) {
        console.log('🔄 Forcing pagination state update:', fullPagination);
        window.appState.setClientsPagination({ ...fullPagination });
        
        // Also trigger a custom event for additional sync
        window.dispatchEvent(new CustomEvent('clientsPaginationUpdated', { 
            detail: fullPagination 
        }));
    }
}, 50);
        
        // Try to update React state if available
        if (window.appState.setClientsPagination) {
          window.appState.setClientsPagination(fullPagination);
        }
        
        // Also store in appState for access
        if (!window.appState) window.appState = {};
        window.appState.clientsPagination = fullPagination;
        window.appState.totalClients = fullPagination.total;
        
        window.log.success(`✅ Loaded ${response.data?.length || 0} clients (page ${page} of ${fullPagination.totalPages})`);
        
        return response;
      } else {
        throw new Error(response.error || 'Failed to fetch clients');
      }
      
    } catch (error) {
      window.log.error('Error fetching clients:', error);
      
      // Set empty state on error
      if (window.appState.setClients) {
        window.appState.setClients([]);
      }
      
      const emptyPagination = {
        page: 1,
        totalPages: 1,
        total: 0,
        hasNext: false,
        hasPrev: false,
        perPage: 20
      };
      
      this.paginationData = emptyPagination;
      
      if (window.appState.setClientsPagination) {
        window.appState.setClientsPagination(emptyPagination);
      }
      
      if (!window.appState) window.appState = {};
      window.appState.clientsPagination = emptyPagination;
      window.appState.totalClients = 0;
      
      return { success: false, data: [], error: error.message };
    }
  },
  
  // Get current pagination data
  getPaginationData: function() {
    return this.paginationData;
  },
  
  // Change page
  changePage: function(newPage) {
    this.currentPage = newPage;
    return this.fetchPaginatedClients({ page: newPage });
  },
  
  // Refresh current page
  refresh: function() {
    return this.fetchPaginatedClients({ page: this.currentPage });
  }
};

// Log module loaded
window.log.success('✅ ClientsAPI module loaded - Server-side pagination');
