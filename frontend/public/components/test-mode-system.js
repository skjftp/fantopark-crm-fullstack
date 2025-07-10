// Test Mode System Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Handles all test mode controls, data creation, and debugging functions

// Test Mode Panel Initialization
window.initializeTestModeSystem = () => {
  // Create and insert the test control panel HTML
  const testPanelHTML = `
    <div id="test-control-panel" style="position:fixed; bottom:80px; left:20px; background:#1f2937; color:white; padding:15px; border-radius:8px; box-shadow:0 4px 6px rgba(0,0,0,0.3); display:none; z-index:9999; max-height:400px; overflow-y:auto; min-width:200px;">
      <h3 style="margin:0 0 10px 0; font-size:16px; text-align:center;">🧪 Test Mode Controls</h3>
      <p style="margin:5px 0; font-size:12px; color:#10b981; text-align:center;">✅ Test Mode Active</p>
      <hr style="margin:10px 0; border:none; border-top:1px solid #4b5563;">
      <div style="margin-bottom:10px;">
        <h4 style="margin:5px 0; font-size:14px; color:#f59e0b;">Create Test Data:</h4>
        <button onclick="window.createTestLeadInline()" style="display:block; width:100%; margin:5px 0; padding:8px; background:#f59e0b; color:white; border:none; border-radius:4px; cursor:pointer; font-size:13px;">🧪 Create Test Lead</button>
        <button onclick="window.createTestInventoryInline()" style="display:block; width:100%; margin:5px 0; padding:8px; background:#f59e0b; color:white; border:none; border-radius:4px; cursor:pointer; font-size:13px;">🧪 Create Test Inventory</button>
      </div>
      <hr style="margin:10px 0; border:none; border-top:1px solid #4b5563;">
      <div style="margin-bottom:10px;">
        <h4 style="margin:5px 0; font-size:14px; color:#dc2626;">Delete All Data:</h4>
        <button onclick="window.deleteAllIndividually('leads')" style="display:block; width:100%; margin:5px 0; padding:8px; background:#dc2626; color:white; border:none; border-radius:4px; cursor:pointer; font-size:13px;">🗑️ Delete All Leads</button>
        <button onclick="window.deleteAllIndividually('inventory')" style="display:block; width:100%; margin:5px 0; padding:8px; background:#dc2626; color:white; border:none; border-radius:4px; cursor:pointer; font-size:13px;">🗑️ Delete All Inventory</button>
        <button onclick="window.deleteAllIndividually('orders')" style="display:block; width:100%; margin:5px 0; padding:8px; background:#dc2626; color:white; border:none; border-radius:4px; cursor:pointer; font-size:13px;">🗑️ Delete All Orders</button>
        <button onclick="window.deleteAllIndividually('deliveries')" style="display:block; width:100%; margin:5px 0; padding:8px; background:#dc2626; color:white; border:none; border-radius:4px; cursor:pointer; font-size:13px;">🗑️ Delete All Deliveries</button>
        <button onclick="window.deleteAllFinancials()" style="width: 100%; padding: 8px 16px; background-color: #dc2626; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#b91c1c'" onmouseout="this.style.backgroundColor='#dc2626'">🗑️ Delete All Financials</button>
      </div>
      <hr style="margin:10px 0; border:none; border-top:1px solid #4b5563;">
      <button onclick="window.location.reload();" style="display:block; width:100%; margin:5px 0; padding:8px; background:#3b82f6; color:white; border:none; border-radius:4px; cursor:pointer; font-size:13px;">🔄 Refresh Page</button>
      <button onclick="document.getElementById('test-control-panel').style.display='none';" style="display:block; width:100%; margin:5px 0; padding:6px; background:#6b7280; color:white; border:none; border-radius:4px; cursor:pointer; font-size:12px;">✖ Hide Panel</button>
    </div>
  `;

  // Additional test panel HTML
  const additionalPanelHTML = `
    <div id="test-control-panel" style="position:fixed; bottom:80px; right:20px; background:#1f2937; color:white; padding:15px; border-radius:8px; box-shadow:0 4px 6px rgba(0,0,0,0.3); display:none; z-index:9999;">
      <h3 style="margin:0 0 10px 0; font-size:16px;">🧪 Test Mode Controls</h3>
      <button onclick="if(confirm('Delete ALL leads?')) { window.testDeleteAll('leads'); }" style="display:block; width:100%; margin:5px 0; padding:8px; background:#dc2626; color:white; border:none; border-radius:4px; cursor:pointer;">🗑️ Delete All Leads</button>
      <button onclick="if(confirm('Delete ALL inventory?')) { window.testDeleteAll('inventory'); }" style="display:block; width:100%; margin:5px 0; padding:8px; background:#dc2626; color:white; border:none; border-radius:4px; cursor:pointer;">🗑️ Delete All Inventory</button>
    </div>
  `;

  // Insert panels into document body
  document.body.insertAdjacentHTML('beforeend', testPanelHTML);
  document.body.insertAdjacentHTML('beforeend', additionalPanelHTML);
};

// Show test control panel if test mode is on and user is super admin
window.updateTestPanel = function() {
  const testMode = localStorage.getItem('testMode') === 'true';
  const user = JSON.parse(localStorage.getItem('crm_user') || '{}');
  const panel = document.getElementById('test-control-panel');
  if (testMode && user.role === 'super_admin' && panel) {
    panel.style.display = 'block';
  }
};

// Delete all function
window.testDeleteAll = async function(type) {
  const authToken = localStorage.getItem('crm_auth_token');
  
  try {
    const response = await fetch(window.API_CONFIG.API_URL + '/' + type, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer ' + authToken,
        'X-Delete-All': 'true',
        'X-Test-Mode': 'true'
      }
    });

    if (response.ok) {
      alert('All ' + type + ' deleted successfully!');
      window.location.reload();
    } else {
      alert('Error: ' + response.statusText);
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
};

// Test data creation functions
window.fillTestLead = function() {
  if (confirm('Create a test lead?')) {
    const testData = {
      name: 'Test User ' + Math.floor(Math.random() * 1000),
      email: 'test' + Math.floor(Math.random() * 1000) + '@example.com',
      phone: '98' + Math.floor(Math.random() * 90000000 + 10000000),
      company: 'Test Company ' + Math.floor(Math.random() * 100),
      lead_for_event: 'General Inquiry',
      lead_source: 'Website',
      notes: 'Test lead created via test mode'
    };

    const authToken = localStorage.getItem('crm_auth_token');
    
    fetch(window.API_CONFIG.API_URL + '/leads', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + authToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    })
    .then(response => response.json())
    .then(data => {
      alert('Test lead created successfully!');
      window.location.reload();
    })
    .catch(error => {
      alert('Error creating test lead: ' + error.message);
    });
  }
};

window.fillTestInventory = function() {
  if (confirm('Create a test inventory item?')) {
    const categories = ['Stall', 'Equipment', 'Service', 'Package'];
    const testData = {
      name: 'Test Item ' + Math.floor(Math.random() * 1000),
      category: categories[Math.floor(Math.random() * categories.length)],
      price: Math.floor(Math.random() * 90000) + 10000,
      quantity: Math.floor(Math.random() * 50) + 1,
      description: 'Test inventory item created via test mode',
      size: '10x10 ft',
      location: 'Zone ' + Math.floor(Math.random() * 5 + 1)
    };

    const authToken = localStorage.getItem('crm_auth_token');
    
    fetch(window.API_CONFIG.API_URL + '/inventory', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + authToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    })
    .then(response => response.json())
    .then(data => {
      alert('Test inventory item created successfully!');
      window.location.reload();
    })
    .catch(error => {
      alert('Error creating test inventory: ' + error.message);
    });
  }
};

// Working delete function that deletes individually
window.deleteAllIndividually = async function(type) {
  if (!confirm('Delete ALL ' + type + '? This will delete them one by one.')) {
    return;
  }

  const authToken = localStorage.getItem('crm_auth_token');
  
  try {
    // Show loading
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'delete-loading';
    loadingDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.1);z-index:10000;';
    loadingDiv.innerHTML = '<h3>Fetching ' + type + '...</h3>';
    document.body.appendChild(loadingDiv);

    // Get all items
    const response = await fetch(window.API_CONFIG.API_URL + '/' + type, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + authToken,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch ' + type);
    }

    const result = await response.json();
    const items = result.data || [];

    if (items.length === 0) {
      document.body.removeChild(loadingDiv);
      alert('No ' + type + ' to delete');
      return;
    }

    // Update loading message
    loadingDiv.innerHTML = '<h3>Deleting ' + type + '...</h3><p>Progress: <span id="delete-progress">0</span> / ' + items.length + '</p>';

    let deleted = 0;
    let failed = 0;

    // Delete each item
    for (const item of items) {
      try {
        const deleteUrl = window.API_CONFIG.API_URL + '/' + type + '/' + item.id;
        console.log('Deleting:', deleteUrl);

        const deleteResponse = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer ' + authToken
          }
        });

        if (deleteResponse.ok) {
          deleted++;
          console.log('Deleted:', item.id);
        } else {
          failed++;
          console.log('Failed to delete:', item.id, deleteResponse.status);
        }

        document.getElementById('delete-progress').textContent = deleted;
      } catch (error) {
        console.error('Delete error:', error);
        failed++;
      }
    }

    // Remove loading
    document.body.removeChild(loadingDiv);

    // Show result
    if (failed === 0) {
      alert('Successfully deleted ' + deleted + ' ' + type + '!');
    } else {
      alert('Deleted ' + deleted + ' ' + type + ', but ' + failed + ' failed.');
    }

    // Reload
    window.location.reload();

  } catch (error) {
    console.error('Error:', error);
    alert('Error: ' + error.message);
    const loadingDiv = document.getElementById('delete-loading');
    if (loadingDiv) {
      document.body.removeChild(loadingDiv);
    }
  }
};

// Enhanced test lead creation with inline button support
window.createTestLeadInline = async function() {
  const authToken = localStorage.getItem('crm_auth_token');
  
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Get inventory items to pick a random event
    const invResponse = await fetch(window.API_CONFIG.API_URL + '/inventory', {
      headers: { 'Authorization': 'Bearer ' + authToken }
    });
    let eventName = 'General Inquiry';
    if (invResponse.ok) {
      const invData = await invResponse.json();
      if (invData.data && invData.data.length > 0) {
        eventName = invData.data[Math.floor(Math.random() * invData.data.length)].event_name;
      }
    }

    const cities = ['Mumbai City North East', 'Delhi NCR', 'Bangalore City', 'Chennai Metro', 'Kolkata Central'];
    const sources = ['LinkedIn', 'Facebook', 'Instagram', 'Website', 'Friends and Family', 'Through Champion'];
    const salesPeople = ['Ankita', 'Varun', 'Pratik', 'Rahul'];
    const incomeBrackets = ['₹10-25 Lakhs', '₹25-50 Lakhs', '₹50-100 Lakhs', 'Above ₹1 Crore'];

    const testData = {
      // Basic info
      name: 'Test Contact ' + Math.floor(Math.random() * 1000),
      email: 'test' + Math.floor(Math.random() * 1000) + '@example.com',
      phone: '8' + Math.floor(Math.random() * 900000000 + 100000000),
      company: Math.random() > 0.5 ? 'Test Company ' + Math.floor(Math.random() * 100) : '',

      // Business fields
      business_type: Math.random() > 0.5 ? 'B2B' : 'B2C',
      source: sources[Math.floor(Math.random() * sources.length)],

      // Required date field
      date_of_enquiry: today,

      // Sales fields
      first_touch_base_done_by: salesPeople[Math.floor(Math.random() * salesPeople.length)],

      // Location
      city_of_residence: cities[Math.floor(Math.random() * cities.length)],
      country_of_residence: 'India',

      // Event interest
      lead_for_event: eventName,
      number_of_people: String(Math.floor(Math.random() * 5) + 1),

      // Travel readiness
      has_valid_passport: Math.random() > 0.3 ? 'Yes' : 'No',
      visa_available: Math.random() > 0.5 ? 'Yes' : 'No',
      attended_sporting_event_before: Math.random() > 0.4 ? 'Yes' : 'No',

      // Financial
      annual_income_bracket: incomeBrackets[Math.floor(Math.random() * incomeBrackets.length)],
      potential_value: Math.floor(Math.random() * 200000) + 50000,

      // Status fields
      status: 'unassigned',
      assigned_to: '',
      last_quoted_price: 0,
      notes: 'Test lead created via test mode',

      // Timestamps
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };

    console.log('Creating lead:', testData);

    const response = await fetch(window.API_CONFIG.API_URL + '/leads', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + authToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (response.ok) {
      alert('Test lead created successfully!');
      window.location.reload();
    } else {
      console.error('Failed:', result);
      alert('Error: ' + (result.error || result.message || 'Failed to create lead'));
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error: ' + error.message);
  }
};

window.createTestInventoryInline = async function() {
  const authToken = localStorage.getItem('crm_auth_token');
  
  try {
    const testData = {
      event_name: 'Test Cricket Match ' + Math.floor(Math.random() * 1000),
      event_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      event_type: 'cricket',
      sports: 'Cricket',
      venue: 'Test Stadium Mumbai',
      category_of_ticket: 'VIP',
      total_tickets: 200,
      available_tickets: 200,
      mrp_of_ticket: 5000,
      buying_price: 4000,
      selling_price: 6000,
      day_of_match: 'Not Applicable',
      stand: 'North Stand',
      inclusions: 'Snacks, Beverages, Parking',
      booking_person: 'Test Supplier',
      procurement_type: 'pre_inventory',
      notes: 'Test inventory',
      paymentStatus: 'paid',
      created_by: JSON.parse(localStorage.getItem('crm_user') || '{}').name || 'Test User',
      created_date: new Date().toISOString()
    };

    console.log('Creating inventory:', testData);

    const response = await fetch(window.API_CONFIG.API_URL + '/inventory', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + authToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (response.ok) {
      alert('Test inventory created successfully!');
      window.location.reload();
    } else {
      console.error('Failed:', result);
      alert('Error: ' + (result.error || result.message || 'Failed to create inventory'));
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error: ' + error.message);
  }
};

// Working create functions (legacy)
window.oldCreateTestLead = async function() {
  // Get current date in YYYY-MM-DD format
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${day}`;

  // Create future date for follow up (3 days from now)
  const futureDate = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
  const futureYear = futureDate.getFullYear();
  const futureMonth = String(futureDate.getMonth() + 1).padStart(2, '0');
  const futureDay = String(futureDate.getDate()).padStart(2, '0');
  const followUpDate = `${futureYear}-${futureMonth}-${futureDay}`;

  const testData = {
    name: 'Test User ' + Math.floor(Math.random() * 1000),
    email: 'test' + Math.floor(Math.random() * 1000) + '@example.com',
    phone: '98' + Math.floor(Math.random() * 90000000 + 10000000),
    company: 'Test Company ' + Math.floor(Math.random() * 100),
    lead_for_event: 'General Inquiry',
    lead_source: 'Website',
    lead_type: 'warm',
    status: 'new',
    date_of_enquiry: today,
    follow_up_date: followUpDate,
    notes: 'Test lead created via test mode',
    requirements: 'Test requirements for stalls and equipment',
    budget: Math.floor(Math.random() * 50000) + 10000,
    event_date: followUpDate,
    location: 'Test Location',
    urgency: 'medium'
  };

  // Add created_by if user is logged in
  try {
    const user = JSON.parse(localStorage.getItem('crm_user') || '{}');
    if (user.id) {
      testData.created_by = user.id;
    }
  } catch (e) {
    console.log('Could not get user ID');
  }

  const authToken = localStorage.getItem('crm_auth_token');
  
  console.log('Creating lead with data:', testData);
  console.log('Date of enquiry:', testData.date_of_enquiry);

  try {
    const response = await fetch(window.API_CONFIG.API_URL + '/leads', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + authToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('Lead created successfully:', result);
      alert('Test lead created: ' + testData.name + '\nDate: ' + testData.date_of_enquiry);
      window.location.reload();
    } else {
      console.error('Failed to create lead:', result);
      alert('Error: ' + (result.error || result.message || 'Failed to create lead'));
    }
  } catch (error) {
    console.error('Create lead error:', error);
    alert('Error creating lead: ' + error.message);
  }
};

window.oldCreateTestInventory = async function() {
  const categories = ['Stall', 'Equipment', 'Service', 'Package'];
  const testData = {
    name: 'Test Item ' + Math.floor(Math.random() * 1000),
    category: categories[Math.floor(Math.random() * categories.length)],
    price: Math.floor(Math.random() * 90000) + 10000,
    quantity: Math.floor(Math.random() * 50) + 1,
    status: 'available',
    description: 'Test inventory item created via test mode at ' + new Date().toLocaleString(),
    size: '10x10 ft',
    location: 'Zone ' + Math.floor(Math.random() * 5 + 1)
  };

  const authToken = localStorage.getItem('crm_auth_token');
  
  try {
    const response = await fetch(window.API_CONFIG.API_URL + '/inventory', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + authToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('Inventory created:', result);
      alert('Test inventory created: ' + testData.name);
      window.location.reload();
    } else {
      console.error('Failed to create inventory:', result);
      alert('Error: ' + (result.error || 'Failed to create inventory'));
    }
  } catch (error) {
    console.error('Create inventory error:', error);
    alert('Error creating inventory: ' + error.message);
  }
};

// Debug function
window.debugLeads = async function() {
  const authToken = localStorage.getItem('crm_auth_token');
  
  const response = await fetch(window.API_CONFIG.API_URL + '/leads', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + authToken
    }
  });

  const result = await response.json();
  console.log('All leads:', result);
  return result;
};

// Add floating button to show test panel if hidden
window.initializeTestModeFloatingButton = () => {
  setTimeout(() => {
    if (localStorage.getItem('testMode') === 'true') {
      const showButton = document.createElement('button');
      showButton.id = 'show-test-panel';
      showButton.style.cssText = 'position:fixed;bottom:20px;left:20px;background:#1f2937;color:white;padding:10px;border-radius:50%;width:50px;height:50px;border:none;cursor:pointer;z-index:9998;font-size:20px;box-shadow:0 2px 4px rgba(0,0,0,0.2);';
      showButton.innerHTML = '🧪';
      showButton.title = 'Show Test Panel';
      showButton.onclick = () => {
        const panel = document.getElementById('test-control-panel');
        if (panel) {
          panel.style.display = 'block';
          showButton.style.display = 'none';
        }
      };

      document.body.appendChild(showButton);

      // Hide button if panel is visible
      const checkPanel = setInterval(() => {
        const panel = document.getElementById('test-control-panel');
        if (panel && panel.style.display !== 'none') {
          showButton.style.display = 'none';
        } else {
          showButton.style.display = 'block';
        }
      }, 500);
    }
  }, 1000);
};

// Debug function to see inventory structure
window.checkInventoryFields = async function() {
  const authToken = localStorage.getItem('crm_auth_token');
  
  const response = await fetch(window.API_CONFIG.API_URL + '/inventory', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + authToken
    }
  });

  const result = await response.json();
  if (result.data && result.data.length > 0) {
    console.log('Sample inventory structure:', result.data[0]);
    console.log('Fields:', Object.keys(result.data[0]));
  } else {
    console.log('No inventory found');
  }
  return result;
};

// Financial records deletion function
window.deleteAllFinancials = async function() {
  if (!confirm('Delete all financial records (payables and receivables)?')) return;

  const authToken = localStorage.getItem('crm_auth_token');
  
  try {
    console.log('Starting to delete all financials...');
    let deletedPayables = 0;
    let deletedReceivables = 0;

    // Delete all payables
    try {
      const payablesRes = await fetch(`${window.API_CONFIG.API_URL}/api/payables`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (payablesRes.ok) {
        const payablesData = await payablesRes.json();
        const payables = payablesData.data || [];
        console.log(`Found ${payables.length} payables to delete`);

        for (const payable of payables) {
          const delRes = await fetch(`${window.API_CONFIG.API_URL}/api/payables/${payable.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          });
          if (delRes.ok) {
            deletedPayables++;
            console.log(`Deleted payable: ${payable.id}`);
          }
        }
      }
    } catch (e) {
      console.error('Error deleting payables:', e);
    }

    // Delete all receivables
    try {
      console.log('Fetching receivables...');
      const receivablesRes = await fetch(`${window.API_CONFIG.API_URL}/api/receivables`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Receivables response status:', receivablesRes.status);

      if (receivablesRes.ok) {
        const receivablesData = await receivablesRes.json();
        const receivables = receivablesData.data || [];
        console.log(`Found ${receivables.length} receivables to delete`);

        // Delete each receivable
        for (const receivable of receivables) {
          console.log(`Deleting receivable: ${receivable.id}`);
          const delRes = await fetch(`${window.API_CONFIG.API_URL}/api/receivables/${receivable.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (delRes.ok) {
            deletedReceivables++;
            console.log(`Successfully deleted receivable: ${receivable.id}`);
          } else {
            console.error(`Failed to delete receivable ${receivable.id}:`, delRes.status);
          }
        }
      } else {
        console.error('Failed to fetch receivables:', receivablesRes.status);
      }
    } catch (e) {
      console.error('Error deleting receivables:', e);
    }

    alert(`Financial records deleted!\nPayables: ${deletedPayables}\nReceivables: ${deletedReceivables}`);
    window.location.reload();

  } catch (error) {
    console.error('Error:', error);
    alert('Error: ' + error.message);
  }
};

// Additional test functions for advanced debugging
window.testDateFormat = function() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${day}`;

  console.log('Current date:', now);
  console.log('Formatted date:', today);
  console.log('Type:', typeof today);

  return today;
};

window.createCustomLead = async function(leadData) {
  const authToken = localStorage.getItem('crm_auth_token');
  
  console.log('Creating lead with custom data:', leadData);

  try {
    const response = await fetch(window.API_CONFIG.API_URL + '/leads', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + authToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(leadData)
    });

    const result = await response.json();
    console.log('Response:', result);

    if (response.ok) {
      alert('Lead created successfully!');
      return result;
    } else {
      alert('Error: ' + (result.error || result.message));
      return null;
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error: ' + error.message);
    return null;
  }
};

window.analyzeLeadStructure = async function() {
  const authToken = localStorage.getItem('crm_auth_token');
  
  try {
    const response = await fetch(window.API_CONFIG.API_URL + '/leads', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + authToken
      }
    });

    const result = await response.json();
    console.log('Leads response:', result);

    if (result.data && result.data.length > 0) {
      const lead = result.data[0];
      console.log('Sample lead:', lead);
      console.log('Lead fields:', Object.keys(lead));
      console.log('Field types:');
      for (const key in lead) {
        console.log(`  ${key}: ${typeof lead[key]} = ${lead[key]}`);
      }

      if (lead.date_of_enquiry) {
        console.log('date_of_enquiry format:', lead.date_of_enquiry);
      }

      return lead;
    } else {
      console.log('No existing leads found');
      return null;
    }
  } catch (error) {
    console.error('Error analyzing leads:', error);
    return null;
  }
};

window.createMinimalLead = async function() {
  const authToken = localStorage.getItem('crm_auth_token');
  
  const minimalData = {
    name: 'Minimal Test ' + Math.floor(Math.random() * 1000),
    email: 'minimal' + Math.floor(Math.random() * 1000) + '@test.com',
    phone: '9876543210',
    status: 'new'
  };

  console.log('Creating minimal lead:', minimalData);

  try {
    const response = await fetch(window.API_CONFIG.API_URL + '/leads', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + authToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(minimalData)
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', result);

    if (response.ok) {
      alert('Minimal lead created successfully!');
      return result;
    } else {
      console.error('Failed:', result);
      alert('Failed: ' + (result.error || result.message || 'Unknown error'));
      return null;
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error: ' + error.message);
    return null;
  }
};

// Enhanced test data creation functions
window.createTestInventory = async function() {
  const authToken = localStorage.getItem('crm_auth_token');
  
  try {
    const testData = {
      // Required fields
      event_name: 'Test Cricket Match ' + Math.floor(Math.random() * 1000),
      event_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      event_type: ['football', 'cricket', 'tennis', 'formula1', 'olympics', 'basketball', 'badminton', 'hockey'][Math.floor(Math.random() * 8)],
      sports: ['Cricket', 'Football', 'Tennis', 'Formula 1', 'Olympics', 'Basketball', 'Badminton', 'Hockey', 'Golf', 'Wrestling'][Math.floor(Math.random() * 10)],
      venue: 'Test Stadium ' + ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'][Math.floor(Math.random() * 5)],

      // Ticket details
      category_of_ticket: ['VIP', 'Premium', 'Gold', 'Silver', 'Bronze', 'General', 'Corporate Box', 'Hospitality'][Math.floor(Math.random() * 8)],
      total_tickets: Math.floor(Math.random() * 500) + 100,
      available_tickets: Math.floor(Math.random() * 500) + 100,
      mrp_of_ticket: Math.floor(Math.random() * 5000) + 1000,
      buying_price: Math.floor(Math.random() * 4000) + 800,
      selling_price: Math.floor(Math.random() * 6000) + 1500,

      // Optional fields
      day_of_match: 'Not Applicable',
      stand: 'North Stand',
      inclusions: 'Snacks, Beverages, Parking',
      booking_person: 'Test Supplier ' + Math.floor(Math.random() * 100),
      procurement_type: ['pre_inventory', 'on_demand', 'partnership', 'direct_booking'][Math.floor(Math.random() * 4)],
      notes: 'Test inventory created via test mode',

      // Payment fields
      paymentStatus: 'paid',
      supplierName: 'Test Supplier Company',

      // System fields
      created_by: JSON.parse(localStorage.getItem('crm_user') || '{}').name || 'Test User',
      created_date: new Date().toISOString()
    };

    console.log('Creating inventory with correct fields:', testData);

    const response = await fetch(window.API_CONFIG.API_URL + '/inventory', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + authToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (response.ok) {
      alert('Test inventory created!\n' +
        'Event: ' + testData.event_name + '\n' +
        'Sports: ' + testData.sports + '\n' +
        'Venue: ' + testData.venue + '\n' +
        'Category: ' + testData.category_of_ticket + '\n' +
        'Available: ' + testData.available_tickets + ' tickets');
      window.location.reload();
    } else {
      console.error('Failed:', result);
      alert('Error: ' + (result.error || result.message || 'Failed to create inventory'));
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error: ' + error.message);
  }
};

window.createTestLead = async function() {
  const authToken = localStorage.getItem('crm_auth_token');
  
  try {
    const testData = {
      // Basic fields (required)
      name: 'Test Contact ' + Math.floor(Math.random() * 1000),
      email: 'test' + Math.floor(Math.random() * 1000) + '@example.com',
      phone: '98' + Math.floor(Math.random() * 90000000 + 10000000),
      company: 'Test Company ' + Math.floor(Math.random() * 100),
      business_type: ['B2C', 'B2B'][Math.floor(Math.random() * 2)],

      // Lead details
      source: ['Facebook', 'Instagram', 'LinkedIn', 'Friends and Family', 'Through Champion', 
        'Website', 'Existing Client', 'Contacted on Social Media', 'Middlemen'][Math.floor(Math.random() * 9)],

      // Business fields
      potential_value: Math.floor(Math.random() * 500000) + 50000,
      notes: 'Test lead interested in event tickets',

      // System fields
      status: 'unassigned',
      created_by: JSON.parse(localStorage.getItem('crm_user') || '{}').name || 'Test User',
      created_date: new Date().toISOString()
    };

    console.log('Creating lead with correct fields:', testData);

    const response = await fetch(window.API_CONFIG.API_URL + '/leads', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + authToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (response.ok) {
      alert('Test lead created!\n' +
        'Name: ' + testData.name + '\n' +
        'Company: ' + testData.company + '\n' +
        'Source: ' + testData.source);
      window.location.reload();
    } else {
      console.error('Failed:', result);
      alert('Error: ' + (result.error || result.message || 'Failed to create lead'));
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error: ' + error.message);
  }
};

// Initialize test mode system on page load
window.initializeTestModeComplete = () => {
  // Check on load
  setTimeout(window.updateTestPanel, 1000);
  
  // Initialize floating button
  window.initializeTestModeFloatingButton();
  
  // Initialize test panels
  window.initializeTestModeSystem();
  
  console.log('Test mode functions loaded with correct field names');
};

// Auto-initialize when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.initializeTestModeComplete);
} else {
  window.initializeTestModeComplete();
}

console.log('✅ Test Mode System component loaded successfully');
