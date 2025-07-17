// Sales Performance Component for FanToPark CRM
// Tracks team targets, achievements, and pipeline metrics

window.renderSalesPerformanceContent = function() {
  // Create a wrapper component that handles state properly
  return React.createElement(SalesPerformanceTracker);
};

// Main component with proper React structure
function SalesPerformanceTracker() {
  const [salesData, setSalesData] = React.useState([]);
  const [retailData, setRetailData] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [dateRange, setDateRange] = React.useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Initialize with sample data
  React.useEffect(() => {
    // Sales performance sample data
    const sampleSalesData = [
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
    setSalesData(sampleSalesData);
    
    // Retail tracker can have different team members
    const sampleRetailData = [
      {
        id: 'retail_1',
        salesMember: 'Pratik',
        assigned: 25,
        touchbased: 20,
        qualified: 15,
        hotWarm: 10,
        converted: 5,
        notTouchbased: 5
      },
      {
        id: 'retail_2',
        salesMember: 'Akshay',
        assigned: 30,
        touchbased: 25,
        qualified: 18,
        hotWarm: 12,
        converted: 8,
        notTouchbased: 5
      }
    ];
    setRetailData(sampleRetailData);
  }, []);

  // Handle target update
  const handleTargetUpdate = (id, newTarget) => {
    setSalesData(prevData =>
      prevData.map(person =>
        person.id === id ? { ...person, target: parseFloat(newTarget) || 0 } : person
      )
    );
  };

  // Add new sales team member
  const addSalesTeamMember = (name) => {
    if (!name || !name.trim()) return;

    const newMember = {
      id: `user_${Date.now()}`,
      name: name.trim(),
      target: 0,
      totalSales: 0,
      actualizedSales: 0,
      totalMargin: 0,
      actualizedMargin: 0,
      salesPersonPipeline: 0,
      retailPipeline: 0,
      corporatePipeline: 0,
      overallPipeline: 0
    };

    setSalesData([...salesData, newMember]);
  };

  // Add new retail team member
  const addRetailTeamMember = (name) => {
    if (!name || !name.trim()) return;

    const newMember = {
      id: `retail_${Date.now()}`,
      salesMember: name.trim(),
      assigned: 0,
      touchbased: 0,
      qualified: 0,
      hotWarm: 0,
      converted: 0,
      notTouchbased: 0
    };

    setRetailData([...retailData, newMember]);
  };

  // Remove sales team member
  const removeSalesTeamMember = (id) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      setSalesData(salesData.filter(member => member.id !== id));
    }
  };

  // Remove retail team member
  const removeRetailTeamMember = (id) => {
    if (window.confirm('Are you sure you want to remove this team member from retail tracking?')) {
      setRetailData(retailData.filter(member => member.id !== id));
    }
  };

  // Calculate totals
  const totals = salesData.reduce((acc, person) => ({
    target: acc.target + (person.target || 0),
    totalSales: acc.totalSales + (person.totalSales || 0),
    actualizedSales: acc.actualizedSales + (person.actualizedSales || 0),
    totalMargin: acc.totalMargin + (person.totalMargin || 0),
    actualizedMargin: acc.actualizedMargin + (person.actualizedMargin || 0)
  }), { target: 0, totalSales: 0, actualizedSales: 0, totalMargin: 0, actualizedMargin: 0 });

  // Calculate retail metrics
  const calculateRetailMetrics = (row) => {
    const qualTouchbased = row.touchbased > 0 ? (row.qualified / row.touchbased * 100).toFixed(0) : 0;
    const convertedQual = row.qualified > 0 ? (row.converted / row.qualified * 100).toFixed(0) : 0;
    return { qualTouchbased, convertedQual };
  };

  return React.createElement('div', { className: 'p-6 bg-gray-50 min-h-screen' },
    React.createElement('div', { className: 'max-w-7xl mx-auto space-y-6' },
      // Header
      React.createElement('div', { className: 'text-center mb-8' },
        React.createElement('h1', { className: 'text-3xl font-bold text-gray-900' }, 
          'Sales Team Performance/Productivity Tracking'
        )
      ),

      // Target vs Achievement Table
      React.createElement('div', { className: 'bg-white rounded-lg shadow' },
        React.createElement('div', { className: 'p-6' },
          React.createElement('div', { className: 'flex justify-between items-center mb-4' },
            React.createElement('h2', { className: 'text-xl font-semibold' }, 
              'Target vs achievement for each sales team member'
            ),
            React.createElement('button', {
              onClick: () => {
                const name = prompt('Enter sales team member name:');
                if (name) addSalesTeamMember(name);
              },
              className: 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2'
            }, 
              React.createElement('span', null, '+'),
              'Add Team Member'
            )
          ),
          
          // Sales Performance Table
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
                  }, 'Pipeline in Crs.'),
                  React.createElement('th', { 
                    rowSpan: 2, 
                    className: 'border border-gray-300 p-2 bg-gray-100' 
                  }, 'Actions')
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
                salesData.length === 0 ?
                  React.createElement('tr', null,
                    React.createElement('td', { 
                      colSpan: 11, 
                      className: 'border border-gray-300 p-4 text-center text-gray-500' 
                    }, 'No team members added yet. Click "Add Team Member" to get started.')
                  ) :
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
                      }, person.overallPipeline.toFixed(2)),
                      React.createElement('td', { 
                        className: 'border border-gray-300 p-2 text-center' 
                      },
                        React.createElement('button', {
                          onClick: () => removeSalesTeamMember(person.id),
                          className: 'text-red-600 hover:text-red-800',
                          title: 'Remove team member'
                        }, '🗑️')
                      )
                    )
                  ),
                
                // Totals Row
                salesData.length > 0 && React.createElement('tr', { className: 'bg-gray-100 font-bold' },
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
                    colSpan: 5, 
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
      ),

      // Retail Tracker Section - Now Independent
      React.createElement('div', { className: 'bg-white rounded-lg shadow' },
        React.createElement('div', { className: 'p-6' },
          React.createElement('div', { className: 'flex justify-between items-center mb-4' },
            React.createElement('h2', { className: 'text-xl font-semibold' }, 
              'Retail Tracker'
            ),
            React.createElement('button', {
              onClick: () => {
                const name = prompt('Enter retail team member name:');
                if (name) addRetailTeamMember(name);
              },
              className: 'px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2'
            }, 
              React.createElement('span', null, '+'),
              'Add Retail Member'
            )
          ),
          
          // Date Range Selector
          React.createElement('div', { className: 'flex items-center gap-4 mb-4' },
            React.createElement('span', { className: 'text-sm font-medium' }, 'Date Range:'),
            React.createElement('input', {
              type: 'date',
              value: dateRange.start,
              onChange: (e) => setDateRange({...dateRange, start: e.target.value}),
              className: 'px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
            }),
            React.createElement('span', null, 'to'),
            React.createElement('input', {
              type: 'date',
              value: dateRange.end,
              onChange: (e) => setDateRange({...dateRange, end: e.target.value}),
              className: 'px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
            })
          ),
          
          // Retail Table
          React.createElement('div', { className: 'overflow-x-auto' },
            React.createElement('table', { className: 'w-full border-collapse' },
              React.createElement('thead', null,
                React.createElement('tr', null,
                  ['Sales Team Member', 'Assigned', 'Touchbased', 'Qualified', 'Hot+Warm', 'Converted', 'Not Touchbased', 'Qual/Touchbased', 'Converted/Qual', 'Actions'].map(header =>
                    React.createElement('th', { 
                      key: header,
                      className: 'border border-gray-300 p-2 bg-gray-100' 
                    }, header)
                  )
                )
              ),
              React.createElement('tbody', null,
                retailData.length === 0 ?
                  React.createElement('tr', null,
                    React.createElement('td', { 
                      colSpan: 10, 
                      className: 'border border-gray-300 p-4 text-center text-gray-500' 
                    }, 'No retail team members added yet. Click "Add Retail Member" to get started.')
                  ) :
                  retailData.map(row => {
                    const metrics = calculateRetailMetrics(row);
                    return React.createElement('tr', { key: row.id },
                      React.createElement('td', { 
                        className: 'border border-gray-300 p-2 font-medium' 
                      }, row.salesMember),
                      React.createElement('td', { 
                        className: 'border border-gray-300 p-2 text-center' 
                      }, row.assigned),
                      React.createElement('td', { 
                        className: 'border border-gray-300 p-2 text-center' 
                      }, row.touchbased),
                      React.createElement('td', { 
                        className: 'border border-gray-300 p-2 text-center' 
                      }, row.qualified),
                      React.createElement('td', { 
                        className: 'border border-gray-300 p-2 text-center' 
                      }, row.hotWarm),
                      React.createElement('td', { 
                        className: 'border border-gray-300 p-2 text-center' 
                      }, row.converted),
                      React.createElement('td', { 
                        className: 'border border-gray-300 p-2 text-center' 
                      }, row.notTouchbased),
                      React.createElement('td', { 
                        className: 'border border-gray-300 p-2 text-center' 
                      }, metrics.qualTouchbased + '%'),
                      React.createElement('td', { 
                        className: 'border border-gray-300 p-2 text-center' 
                      }, metrics.convertedQual + '%'),
                      React.createElement('td', { 
                        className: 'border border-gray-300 p-2 text-center' 
                      },
                        React.createElement('button', {
                          onClick: () => removeRetailTeamMember(row.id),
                          className: 'text-red-600 hover:text-red-800',
                          title: 'Remove retail member'
                        }, '🗑️')
                      )
                    );
                  })
              )
            )
          )
        )
      ),

      // Summary Stats
      React.createElement('div', { className: 'bg-white rounded-lg shadow' },
        React.createElement('div', { className: 'p-6' },
          React.createElement('h2', { className: 'text-xl font-semibold mb-4' }, 
            'Performance Summary'
          ),
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-4' },
            React.createElement('div', { className: 'bg-blue-50 p-4 rounded' },
              React.createElement('h3', { className: 'text-sm text-blue-600 font-medium' }, 
                'Sales Team Members'
              ),
              React.createElement('p', { className: 'text-2xl font-bold text-blue-800' }, 
                salesData.length
              )
            ),
            React.createElement('div', { className: 'bg-green-50 p-4 rounded' },
              React.createElement('h3', { className: 'text-sm text-green-600 font-medium' }, 
                'Retail Team Members'
              ),
              React.createElement('p', { className: 'text-2xl font-bold text-green-800' }, 
                retailData.length
              )
            ),
            React.createElement('div', { className: 'bg-purple-50 p-4 rounded' },
              React.createElement('h3', { className: 'text-sm text-purple-600 font-medium' }, 
                'Achievement Rate'
              ),
              React.createElement('p', { className: 'text-2xl font-bold text-purple-800' }, 
                totals.target > 0 ? ((totals.actualizedSales / totals.target) * 100).toFixed(1) + '%' : '0%'
              )
            ),
            React.createElement('div', { className: 'bg-orange-50 p-4 rounded' },
              React.createElement('h3', { className: 'text-sm text-orange-600 font-medium' }, 
                'Average Margin'
              ),
              React.createElement('p', { className: 'text-2xl font-bold text-orange-800' }, 
                totals.actualizedSales > 0 ? ((totals.actualizedMargin / totals.actualizedSales) * 100).toFixed(1) + '%' : '0%'
              )
            )
          )
        )
      )
    )
  );
}

console.log('✅ Sales Performance component loaded');
