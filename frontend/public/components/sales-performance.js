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
  const [allUsers, setAllUsers] = React.useState([]);
  const [showUserModal, setShowUserModal] = React.useState(false);
  const [modalType, setModalType] = React.useState('sales'); // 'sales' or 'retail'
  const [period, setPeriod] = React.useState('lifetime'); // Default to lifetime
  const [availablePeriods, setAvailablePeriods] = React.useState([]);
  // Calculate last 7 days date range
const getDefaultDateRange = () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7); // 7 days ago
  
  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0]
  };
};

const [dateRange, setDateRange] = React.useState(getDefaultDateRange());

  const [usersFetched, setUsersFetched] = React.useState(false);

  // Fetch all users for selection
// Fetch all users for selection
const fetchAllUsers = async () => {
  // Prevent multiple fetches
  if (usersFetched || allUsers.length > 0) return;
  
  try {
    const token = localStorage.getItem('crm_auth_token');
    const response = await fetch(`${window.API_CONFIG.API_URL}/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Fetched users:', result);
      const users = Array.isArray(result) ? result : (result.users || result.data || []);
      setAllUsers(users);
      setUsersFetched(true);
    }
  } catch (error) {
    console.error('Error fetching users:', error);
  }
};

// Fetch available periods
const fetchPeriods = async () => {
  try {
    const token = localStorage.getItem('crm_auth_token');
    const response = await fetch(`${window.API_CONFIG.API_URL}/sales-performance/periods`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const result = await response.json();
      setAvailablePeriods(result.periods || []);
    }
  } catch (error) {
    console.error('Error fetching periods:', error);
  }
};

 // Fetch sales performance data
const fetchSalesPerformance = async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem('crm_auth_token');
    
    // Fetch sales team data with period filter
    const salesResponse = await fetch(`${window.API_CONFIG.API_URL}/sales-performance?period=${period}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (salesResponse.ok) {
      const salesResult = await salesResponse.json();
      setSalesData(salesResult.salesTeam || []);
      
      // Optional: Show cache status
      if (salesResult.cached && salesResult.cacheAge) {
        console.log(`📊 Using cached data (${salesResult.cacheAge} old)`);
      }
    }
    
    // Fetch retail tracker data - remove /api prefix
    const retailResponse = await fetch(`${window.API_CONFIG.API_URL}/sales-performance/retail-tracker?start_date=${dateRange.start}&end_date=${dateRange.end}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (retailResponse.ok) {
      const retailResult = await retailResponse.json();
      setRetailData(retailResult.retailData || []);
      // Store total system leads in state or window for display
      if (retailResult.totalSystemLeadsInDateRange !== undefined) {
        window.totalSystemLeadsInDateRange = retailResult.totalSystemLeadsInDateRange;
      }
    }
    
  } catch (error) {
    console.error('Error fetching performance data:', error);
    alert('Error loading performance data');
  } finally {
    setLoading(false);
  }
};

  // Fetch retail data separately
  const fetchRetailData = async () => {
  try {
    const token = localStorage.getItem('crm_auth_token');
    // Remove /api prefix
    const retailResponse = await fetch(`${window.API_CONFIG.API_URL}/sales-performance/retail-tracker?start_date=${dateRange.start}&end_date=${dateRange.end}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (retailResponse.ok) {
      const retailResult = await retailResponse.json();
      setRetailData(retailResult.retailData || []);
      // Store total system leads in state or window for display
      if (retailResult.totalSystemLeadsInDateRange !== undefined) {
        window.totalSystemLeadsInDateRange = retailResult.totalSystemLeadsInDateRange;
      }
    }
  } catch (error) {
    console.error('Error fetching retail data:', error);
  }
};

  // Fetch data on component mount
  React.useEffect(() => {
    fetchAllUsers();
    fetchPeriods();
    fetchSalesPerformance();
  }, []);
  
  // Refetch when period changes
  React.useEffect(() => {
    if (period) {
      fetchSalesPerformance();
    }
  }, [period]);

  // Refresh retail data when date range changes
  React.useEffect(() => {
    if (!loading) {
      fetchRetailData();
    }
  }, [dateRange.start, dateRange.end]);

  // Handle target update
  const handleTargetUpdate = async (id, newTarget) => {
  // Update local state immediately
  setSalesData(prevData =>
    prevData.map(person =>
      person.id === id ? { ...person, target: parseFloat(newTarget) || 0 } : person
    )
  );
  
  // Send update to backend
  try {
    const token = localStorage.getItem('crm_auth_token');
    // Remove /api prefix
    await fetch(`${window.API_CONFIG.API_URL}/sales-performance/target/${id}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ target: parseFloat(newTarget) || 0 })
    });
  } catch (error) {
    console.error('Error updating target:', error);
  }
};

 // Add selected user to sales team
const addUserToSalesTeam = async (user) => {
  // Check if user already exists
  if (salesData.some(member => member.email === user.email)) {
    alert('User already in sales team');
    return;
  }

  try {
    const token = localStorage.getItem('crm_auth_token');
    
    // Save to backend first
    const response = await fetch(`${window.API_CONFIG.API_URL}/sales-performance/add-member`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        userId: user.id,
        type: 'sales'
      })
    });
    
    if (response.ok) {
      // Add to local state only after successful save
      const newMember = {
        id: user.id,
        name: user.name,
        email: user.email,
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
      setShowUserModal(false);
      
      // Refresh data to get calculated metrics
      setTimeout(() => fetchSalesPerformance(), 1000);
    } else {
      alert('Failed to add team member');
    }
  } catch (error) {
    console.error('Error adding sales team member:', error);
    alert('Error adding team member');
  }
};

// Add selected user to retail team
const addUserToRetailTeam = async (user) => {
  // Check if user already exists
  if (retailData.some(member => member.salesMember === user.name)) {
    alert('User already in retail tracking');
    return;
  }

  try {
    const token = localStorage.getItem('crm_auth_token');
    
    // Save to backend first
    const response = await fetch(`${window.API_CONFIG.API_URL}/sales-performance/add-member`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        userId: user.id,
        type: 'retail'
      })
    });
    
    if (response.ok) {
      // Add to local state only after successful save
      const newMember = {
        id: user.id,
        salesMember: user.name,
        assigned: 0,
        touchbased: 0,
        qualified: 0,
        hotWarm: 0,
        converted: 0,
        notTouchbased: 0
      };

      setRetailData([...retailData, newMember]);
      setShowUserModal(false);
      
      // Refresh data
      setTimeout(() => fetchRetailData(), 1000);
    } else {
      alert('Failed to add retail member');
    }
  } catch (error) {
    console.error('Error adding retail member:', error);
    alert('Error adding retail member');
  }
};

// Remove sales team member
const removeSalesTeamMember = async (id) => {
  if (window.confirm('Are you sure you want to remove this team member?')) {
    try {
      const token = localStorage.getItem('crm_auth_token');
      
      // Delete from backend first
      const response = await fetch(`${window.API_CONFIG.API_URL}/sales-performance/remove-member/${id}/sales`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        // Remove from local state only after successful delete
        setSalesData(salesData.filter(member => member.id !== id));
      } else {
        alert('Failed to remove team member');
      }
    } catch (error) {
      console.error('Error removing team member:', error);
      alert('Error removing team member');
    }
  }
};

// Remove retail team member
const removeRetailTeamMember = async (id) => {
  if (window.confirm('Are you sure you want to remove this team member from retail tracking?')) {
    try {
      const token = localStorage.getItem('crm_auth_token');
      
      // Delete from backend first
      const response = await fetch(`${window.API_CONFIG.API_URL}/sales-performance/remove-member/${id}/retail`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        // Remove from local state only after successful delete
        setRetailData(retailData.filter(member => member.id !== id));
      } else {
        alert('Failed to remove retail member');
      }
    } catch (error) {
      console.error('Error removing retail member:', error);
      alert('Error removing retail member');
    }
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
  // Calculate retail metrics
const calculateRetailMetrics = (row) => {
  // Qual/(Touchbased + Qual)
  const qualTouchbasedDenominator = row.touchbased + row.qualified;
  const qualTouchbased = qualTouchbasedDenominator > 0 ? 
    (row.qualified / qualTouchbasedDenominator * 100).toFixed(0) : 0;
  
  // Converted/(Converted + Qualified)
  const convertedQualDenominator = row.converted + row.qualified;
  const convertedQual = convertedQualDenominator > 0 ? 
    (row.converted / convertedQualDenominator * 100).toFixed(0) : 0;
  
  return { qualTouchbased, convertedQual };
};

  // User Selection Modal
  // User Selection Modal
const renderUserModal = () => {
  if (!showUserModal) return null;

  // Debug: Check if users are loaded
  console.log('All users:', allUsers);
  console.log('Modal type:', modalType);

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
  },
    React.createElement('div', {
      className: 'bg-white rounded-lg p-6 max-w-md w-full max-h-96 overflow-y-auto'
    },
      React.createElement('h3', {
        className: 'text-lg font-semibold mb-4'
      }, modalType === 'sales' ? 'Select Sales Team Member' : 'Select Retail Team Member'),
      
      // Show loading or empty state
      allUsers.length === 0 ? 
        React.createElement('p', {
          className: 'text-gray-500 text-center py-4'
        }, 'Loading users...') :
        
        React.createElement('div', {
          className: 'space-y-2'
        },
          allUsers
            .filter(user => {
              // For now, show all users regardless of filter
              return true;
              // Uncomment below to re-enable filtering
              /*
              if (modalType === 'sales') {
                return !salesData.some(member => member.email === user.email);
              } else {
                return !retailData.some(member => member.salesMember === user.name);
              }
              */
            })
            .map(user =>
              React.createElement('button', {
                key: user.id || user.email,
                onClick: () => modalType === 'sales' ? addUserToSalesTeam(user) : addUserToRetailTeam(user),
                className: 'w-full text-left p-3 hover:bg-gray-100 rounded flex justify-between items-center border border-gray-200'
              },
                React.createElement('div', null,
                  React.createElement('div', { className: 'font-medium' }, user.name || 'Unknown User'),
                  React.createElement('div', { className: 'text-sm text-gray-500' }, 
                    `${user.role || 'No role'} - ${user.department || 'No department'}`
                  )
                ),
                React.createElement('span', { className: 'text-blue-600' }, 'Select')
              )
            )
      ),
      
      allUsers.length === 0 && React.createElement('p', {
        className: 'text-sm text-gray-500 mt-2'
      }, 'If no users appear, check console for errors.'),
      
      React.createElement('button', {
        onClick: () => setShowUserModal(false),
        className: 'mt-4 w-full py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400'
      }, 'Cancel')
    )
  );
};

  // Show loading state
  // Show loading state with better UI
if (loading) {
  return React.createElement('div', { className: 'p-6 bg-gray-50 min-h-screen' },
    React.createElement('div', { className: 'max-w-7xl mx-auto' },
      React.createElement('div', { className: 'text-center mb-8' },
        React.createElement('h1', { className: 'text-3xl font-bold text-gray-900' }, 
          'Sales Team Performance/Productivity Tracking'
        )
      ),
      React.createElement('div', { className: 'bg-white rounded-lg shadow p-8' },
        React.createElement('div', { className: 'flex flex-col items-center justify-center' },
          React.createElement('div', { 
            className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4' 
          }),
          React.createElement('p', { className: 'text-gray-600' }, 
            'Loading performance data...'
          ),
          React.createElement('p', { className: 'text-sm text-gray-500 mt-2' }, 
            'This may take a few seconds'
          )
        )
      )
    )
  );
}

  return React.createElement('div', { className: 'p-6 bg-gray-50 min-h-screen' },
    renderUserModal(),
    React.createElement('div', { className: 'max-w-7xl mx-auto space-y-6' },
      // Header
      React.createElement('div', { className: 'text-center mb-8' },
        React.createElement('h1', { className: 'text-3xl font-bold text-gray-900' }, 
          'Sales Team Performance/Productivity Tracking'
        ),
        // Period Filter
        React.createElement('div', { className: 'mt-4' },
          React.createElement('select', {
            value: period,
            onChange: (e) => setPeriod(e.target.value),
            className: 'px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
          },
            availablePeriods.map(p => 
              React.createElement('option', { key: p.value, value: p.value }, p.label)
            )
          )
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
                setModalType('sales');
                setShowUserModal(true);
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
                    }, 'No sales team members found. Click "Add Team Member" to add users.')
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
                      }, (person.totalSales || 0).toFixed(2)),
                      React.createElement('td', { 
                        className: 'border border-gray-300 p-2 text-center' 
                      }, (person.actualizedSales || 0).toFixed(2)),
                      React.createElement('td', { 
                        className: 'border border-gray-300 p-2 text-center' 
                      }, (person.totalMargin || 0).toFixed(2)),
                      React.createElement('td', { 
                        className: 'border border-gray-300 p-2 text-center' 
                      }, (person.actualizedMargin || 0).toFixed(2)),
                      React.createElement('td', { 
                        className: 'border border-gray-300 p-2 text-center' 
                      }, (person.salesPersonPipeline || 0).toFixed(2)),
                      React.createElement('td', { 
                        className: 'border border-gray-300 p-2 text-center' 
                      }, (person.retailPipeline || 0).toFixed(2)),
                      React.createElement('td', { 
                        className: 'border border-gray-300 p-2 text-center' 
                      }, (person.corporatePipeline || 0).toFixed(2)),
                      React.createElement('td', { 
                        className: 'border border-gray-300 p-2 text-center' 
                      }, (person.overallPipeline || 0).toFixed(2)),
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

      // Retail Tracker Section
      React.createElement('div', { className: 'bg-white rounded-lg shadow' },
        React.createElement('div', { className: 'p-6' },
          React.createElement('div', { className: 'flex justify-between items-center mb-4' },
            React.createElement('h2', { className: 'text-xl font-semibold' }, 
              'Retail Tracker'
            ),
            React.createElement('button', {
              onClick: () => {
                setModalType('retail');
                setShowUserModal(true);
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
          
          // Total System Leads Display
          window.totalSystemLeadsInDateRange !== undefined && React.createElement('div', { 
            className: 'mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg' 
          },
            React.createElement('div', { className: 'text-sm text-blue-800' },
              React.createElement('span', { className: 'font-semibold' }, 'Total System Leads: '),
              React.createElement('span', { className: 'text-lg font-bold' }, 
                window.totalSystemLeadsInDateRange || 0
              ),
              React.createElement('span', { className: 'ml-2 text-xs' }, 
                '(All leads in the system for selected date range)'
              )
            )
          ),
          
          // Retail Table (rest remains the same)
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
                    }, 'No retail team members found. Click "Add Retail Member" to add users.')
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
