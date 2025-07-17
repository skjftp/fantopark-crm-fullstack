// Sales Performance Component for FanToPark CRM
// Tracks team targets, achievements, and pipeline metrics

window.renderSalesPerformanceContent = function() {
  // Create a wrapper component that handles state properly
  return React.createElement(SalesPerformanceTracker);
};

// Main component with proper React structure
function SalesPerformanceTracker() {
  const [salesData, setSalesData] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [showAddMember, setShowAddMember] = React.useState(false);
  const [newMemberName, setNewMemberName] = React.useState('');

  // Initialize with sample data
  React.useEffect(() => {
    // In production, fetch from API
    const sampleData = [
      {
        id: 'user_1',
        name: 'Pratik',
        target: 18.00,
        totalSales: 2.84,
        actualizedSales: 2.83,
        totalMargin: 0.55,
        actualizedMargin: 0.55,
        salesPersonPipeline: 0.01,
        retailPipeline: 3.03,
        corporatePipeline: 3.05,
        overallPipeline: 3.05
      },
      {
        id: 'user_2',
        name: 'Akshay',
        target: 9.00,
        totalSales: 3.20,
        actualizedSales: 3.17,
        totalMargin: 0.64,
        actualizedMargin: 0.63,
        salesPersonPipeline: 0.01,
        retailPipeline: 0.00,
        corporatePipeline: 0.01,
        overallPipeline: 0.01
      },
      {
        id: 'user_3',
        name: 'Varun',
        target: 18.00,
        totalSales: 3.83,
        actualizedSales: 3.79,
        totalMargin: 0.68,
        actualizedMargin: 0.66,
        salesPersonPipeline: 0.01,
        retailPipeline: 1.51,
        corporatePipeline: 1.52,
        overallPipeline: 1.52
      }
    ];
    setSalesData(sampleData);
  }, []);

  // Handle target update
  const handleTargetUpdate = (id, newTarget) => {
    setSalesData(prevData =>
      prevData.map(person =>
        person.id === id ? { ...person, target: parseFloat(newTarget) || 0 } : person
      )
    );
  };

  // Calculate totals
  const totals = salesData.reduce((acc, person) => ({
    target: acc.target + (person.target || 0),
    totalSales: acc.totalSales + (person.totalSales || 0),
    actualizedSales: acc.actualizedSales + (person.actualizedSales || 0),
    totalMargin: acc.totalMargin + (person.totalMargin || 0),
    actualizedMargin: acc.actualizedMargin + (person.actualizedMargin || 0)
  }), { target: 0, totalSales: 0, actualizedSales: 0, totalMargin: 0, actualizedMargin: 0 });

  return React.createElement('div', { className: 'p-6 bg-gray-50 min-h-screen' },
    React.createElement('div', { className: 'max-w-7xl mx-auto' },
      // Header
      React.createElement('div', { className: 'text-center mb-8' },
        React.createElement('h1', { className: 'text-3xl font-bold text-gray-900' }, 
          'Sales Team Performance/Productivity Tracking'
        )
      ),

      // Main Table Card
      React.createElement('div', { className: 'bg-white rounded-lg shadow' },
        React.createElement('div', { className: 'p-6' },
          React.createElement('h2', { className: 'text-xl font-semibold mb-4' }, 
            'Target vs achievement for each sales team member'
          ),
          
          // Table
          React.createElement('div', { className: 'overflow-x-auto' },
            React.createElement('table', { className: 'w-full border-collapse' },
              // Table Header
              React.createElement('thead', null,
                React.createElement('tr', null,
                  React.createElement('th', { 
                    rowSpan: 2, 
                    className: 'border border-gray-300 p-2 bg-gray-100 text-left' 
                  }, 'Sales Person'),
                  React.createElement('th', { 
                    rowSpan: 2, 
                    className: 'border border-gray-300 p-2 bg-gray-100' 
                  }, 'Targets in Crs.'),
                  React.createElement('th', { 
                    colSpan: 4, 
                    className: 'border border-gray-300 p-2 bg-gray-100' 
                  }, 'Achievement in Crs.'),
                  React.createElement('th', { 
                    colSpan: 4, 
                    className: 'border border-gray-300 p-2 bg-gray-100' 
                  }, 'Pipeline in Crs.')
                ),
                React.createElement('tr', null,
                  ['Total Sales', 'Actualized Sales', 'Total Margin', 'Actualized Margin'].map(header =>
                    React.createElement('th', { 
                      key: header,
                      className: 'border border-gray-300 p-2 bg-gray-100 text-sm' 
                    }, header)
                  ),
                  ['Sales Person', 'Retail', 'Corporate', 'Overall'].map(header =>
                    React.createElement('th', { 
                      key: header + '_pipeline',
                      className: 'border border-gray-300 p-2 bg-gray-100 text-sm' 
                    }, header)
                  )
                )
              ),
              
              // Table Body
              React.createElement('tbody', null,
                salesData.map(person =>
                  React.createElement('tr', { key: person.id, className: 'hover:bg-gray-50' },
                    React.createElement('td', { 
                      className: 'border border-gray-300 p-2 font-medium' 
                    }, person.name),
                    React.createElement('td', { 
                      className: 'border border-gray-300 p-2' 
                    },
                      React.createElement('input', {
                        type: 'number',
                        value: person.target,
                        onChange: (e) => handleTargetUpdate(person.id, e.target.value),
                        className: 'w-20 px-2 py-1 border rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500',
                        step: '0.01'
                      })
                    ),
                    React.createElement('td', { 
                      className: 'border border-gray-300 p-2 text-center' 
                    }, person.totalSales.toFixed(2)),
                    React.createElement('td', { 
                      className: 'border border-gray-300 p-2 text-center' 
                    }, person.actualizedSales.toFixed(2)),
                    React.createElement('td', { 
                      className: 'border border-gray-300 p-2 text-center' 
                    }, person.totalMargin.toFixed(2)),
                    React.createElement('td', { 
                      className: 'border border-gray-300 p-2 text-center' 
                    }, person.actualizedMargin.toFixed(2)),
                    React.createElement('td', { 
                      className: 'border border-gray-300 p-2 text-center' 
                    }, person.salesPersonPipeline.toFixed(2)),
                    React.createElement('td', { 
                      className: 'border border-gray-300 p-2 text-center' 
                    }, person.retailPipeline.toFixed(2)),
                    React.createElement('td', { 
                      className: 'border border-gray-300 p-2 text-center' 
                    }, person.corporatePipeline.toFixed(2)),
                    React.createElement('td', { 
                      className: 'border border-gray-300 p-2 text-center' 
                    }, person.overallPipeline.toFixed(2))
                  )
                ),
                
                // Totals Row
                React.createElement('tr', { className: 'bg-gray-100 font-bold' },
                  React.createElement('td', { 
                    className: 'border border-gray-300 p-2' 
                  }, 'Total Sales'),
                  React.createElement('td', { 
                    className: 'border border-gray-300 p-2 text-center' 
                  }, totals.target.toFixed(2)),
                  React.createElement('td', { 
                    className: 'border border-gray-300 p-2 text-center' 
                  }, totals.totalSales.toFixed(2)),
                  React.createElement('td', { 
                    className: 'border border-gray-300 p-2 text-center' 
                  }, totals.actualizedSales.toFixed(2)),
                  React.createElement('td', { 
                    className: 'border border-gray-300 p-2 text-center' 
                  }, totals.totalMargin.toFixed(2)),
                  React.createElement('td', { 
                    className: 'border border-gray-300 p-2 text-center' 
                  }, totals.actualizedMargin.toFixed(2)),
                  React.createElement('td', { 
                    colSpan: 4, 
                    className: 'border border-gray-300 p-2' 
                  })
                )
              )
            )
          ),
          
          // Notes
          React.createElement('div', { className: 'mt-2 text-sm text-gray-600' },
            React.createElement('p', null, 
              'Total Sales = Total sales logged by the sales team'
            ),
            React.createElement('p', null, 
              'Actualized sales = Total sales logged by the sales team whose event date has passed'
            )
          )
        )
      )
    )
  );
}

console.log('✅ Sales Performance component loaded');
