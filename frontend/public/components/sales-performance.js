// Sales Performance Component for FanToPark CRM
// Tracks team targets, achievements, and pipeline metrics

window.renderSalesPerformanceContent = function() {
  // For now, let's return a simple component without hooks to test
  return React.createElement('div', { className: 'p-6 bg-gray-50 min-h-screen' },
    React.createElement('div', { className: 'max-w-7xl mx-auto' },
      // Header
      React.createElement('div', { className: 'mb-6' },
        React.createElement('h1', { className: 'text-2xl font-bold text-gray-900' }, 
          'Sales Team Performance Tracking'
        )
      ),
      
      // Main content
      React.createElement('div', { 
        className: 'bg-white rounded-lg shadow p-6' 
      },
        React.createElement('h2', { className: 'text-lg font-semibold mb-4' }, 
          'Performance Dashboard'
        ),
        React.createElement('p', { className: 'text-gray-600' }, 
          'Sales performance tracking will be displayed here.'
        ),
        React.createElement('button', {
          className: 'mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700',
          onClick: () => alert('Loading performance data...')
        }, 'Load Performance Data')
      )
    )
  );
};

console.log('✅ Sales Performance component loaded');
