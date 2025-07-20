// Client API module for paginated operations
window.ClientsAPI = {
  currentPage: 1,
  perPage: 20,
  
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
        
        if (window.appState.setClientsPagination) {
          window.appState.setClientsPagination(fullPagination);
        }
        
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
      
      if (window.appState.setClientsPagination) {
        window.appState.setClientsPagination({
          page: 1,
          totalPages: 1,
          total: 0,
          hasNext: false,
          hasPrev: false,
          perPage: 20
        });
      }
      
      return { success: false, data: [], error: error.message };
    }
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
