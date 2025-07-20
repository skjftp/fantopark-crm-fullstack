// Client API module for paginated operations
window.ClientsAPI = {
  currentPage: 1,
  perPage: 20,
  
  // Fetch paginated clients
  fetchPaginatedClients: async function(params = {}) {
    try {
      const page = params.page || this.currentPage;
      const limit = params.limit || this.perPage;
      
      // For now, fetch all and paginate client-side
      // (Backend pagination can be added later)
      const response = await window.apiCall('/clients');
      const allClients = response.data || [];
      
      // Client-side pagination
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedClients = allClients.slice(start, end);
      
      // Update state
      if (window.appState.setClients) {
        window.appState.setClients(paginatedClients);
      }
      
      // Set pagination info
      if (window.appState.setClientsPagination) {
        window.appState.setClientsPagination({
          page: page,
          totalPages: Math.ceil(allClients.length / limit),
          total: allClients.length,
          hasNext: end < allClients.length,
          hasPrev: page > 1,
          perPage: limit
        });
      }
      
      // Store all clients for filtering
      window.allClientsCache = allClients;
      
      return { success: true, data: paginatedClients };
    } catch (error) {
      console.error('Error fetching clients:', error);
      return { success: false, data: [] };
    }
  },
  
  changePage: function(newPage) {
    this.currentPage = newPage;
    return this.fetchPaginatedClients({ page: newPage });
  }
};
