// Sales Performance Component for FanToPark CRM
// Tracks team targets, achievements, and pipeline metrics

window.renderSalesPerformanceContent = function() {
  const [salesData, setSalesData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [dateRange, setDateRange] = React.useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Fetch sales performance data
  const fetchSalesPerformance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('crm_auth_token');
      const response = await fetch(`${window.API_CONFIG.API_URL}/api/sales-performance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSalesData(data.salesTeam || []);
      }
    } catch (error) {
      console.error('Error fetching sales performance:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSalesPerformance();
  }, []);

  // Create the performance tracking dashboard component
  return React.createElement('div', { className: 'p-6 bg-gray-50 min-h-screen' },
    React.createElement('div', { className: 'max-w-7xl mx-auto' },
      // Header
      React.createElement('div', { className: 'mb-6' },
        React.createElement('h1', { className: 'text-2xl font-bold text-gray-900' }, 
          'Sales Team Performance Tracking'
        )
      ),

      // Main content area
      loading ? 
        React.createElement('div', { className: 'flex justify-center items-center h-64' },
          React.createElement('div', { className: 'text-gray-500' }, 'Loading performance data...')
        ) :
        React.createElement('div', null,
          // Placeholder for now - we'll add the full dashboard next
          React.createElement('div', { 
            className: 'bg-white rounded-lg shadow p-6 text-center' 
          },
            React.createElement('p', { className: 'text-gray-600' }, 
              'Sales Performance Dashboard will be loaded here'
            ),
            React.createElement('p', { className: 'text-sm text-gray-500 mt-2' }, 
              'Team: ' + salesData.length + ' members'
            )
          )
        )
    )
  );
};

console.log('✅ Sales Performance component loaded');
