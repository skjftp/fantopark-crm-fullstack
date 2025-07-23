// Leads CSV Export Functionality
// Exports all lead fields to CSV format

// Helper function to convert date to IST format
function toISTString(dateValue) {
  if (!dateValue) return '';
  
  let date;
  
  // Handle Firestore timestamp format
  if (dateValue._seconds !== undefined) {
    date = new Date(dateValue._seconds * 1000);
  } else if (typeof dateValue === 'object' && dateValue.seconds !== undefined) {
    date = new Date(dateValue.seconds * 1000);
  } else {
    date = new Date(dateValue);
  }
  
  if (isNaN(date.getTime())) return String(dateValue);
  
  // Add 5 hours 30 minutes to convert to IST
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffset);
  
  // Format as DD/MM/YYYY HH:MM:SS IST
  const day = istDate.getUTCDate().toString().padStart(2, '0');
  const month = (istDate.getUTCMonth() + 1).toString().padStart(2, '0');
  const year = istDate.getUTCFullYear();
  const hours = istDate.getUTCHours().toString().padStart(2, '0');
  const minutes = istDate.getUTCMinutes().toString().padStart(2, '0');
  const seconds = istDate.getUTCSeconds().toString().padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds} IST`;
}

window.exportLeadsToCSV = async function(exportAll = false, includeCommunications = true) {
  try {
    console.log('📊 Starting leads CSV export...');
    
    let leadsToExport = [];
    
    if (exportAll) {
      // Fetch all leads without pagination
      console.log('🔄 Fetching all leads for export...');
      
      const response = await window.apiCall('/leads/all');
      if (response.success && response.data) {
        leadsToExport = response.data;
      } else {
        // Fallback: fetch paginated leads with high limit
        const paginatedResponse = await window.apiCall('/leads/paginated?limit=10000&page=1');
        if (paginatedResponse.success && paginatedResponse.data) {
          leadsToExport = paginatedResponse.data;
        } else {
          throw new Error('Failed to fetch leads for export');
        }
      }
    } else {
      // Export only current page/filtered leads
      leadsToExport = window.appState?.leads || window.leads || [];
    }
    
    if (leadsToExport.length === 0) {
      alert('No leads to export');
      return;
    }
    
    console.log(`✅ Exporting ${leadsToExport.length} leads to CSV`);
    
    // Fetch inventory data to get event types (leads reference inventory, not events)
    console.log('🔄 Fetching inventory data for event types...');
    let eventTypeMap = {};
    try {
      const inventoryResponse = await window.apiCall('/inventory');
      console.log('Inventory Response:', inventoryResponse);
      
      if (inventoryResponse && inventoryResponse.data) {
        console.log(`Found ${inventoryResponse.data.length} inventory items`);
        
        // Create a map of event name to event type from inventory
        inventoryResponse.data.forEach(item => {
          if (item.event_name && item.event_type) {
            eventTypeMap[item.event_name.toLowerCase()] = item.event_type;
            console.log(`  Mapping: "${item.event_name}" -> "${item.event_type}"`);
          }
        });
        
        console.log(`✅ Loaded ${Object.keys(eventTypeMap).length} event types from inventory`);
        console.log('Event Type Map:', eventTypeMap);
        
        // Specifically check for Singapore GP'25
        const singaporeKey = "singapore gp'25".toLowerCase();
        console.log(`Singapore GP'25 in map: ${singaporeKey in eventTypeMap}`, eventTypeMap[singaporeKey]);
      } else if (inventoryResponse && Array.isArray(inventoryResponse)) {
        // Sometimes the response might be the array directly
        console.log(`Found ${inventoryResponse.length} inventory items (direct array)`);
        
        inventoryResponse.forEach(item => {
          if (item.event_name && item.event_type) {
            eventTypeMap[item.event_name.toLowerCase()] = item.event_type;
            console.log(`  Mapping: "${item.event_name}" -> "${item.event_type}"`);
          }
        });
        
        console.log(`✅ Loaded ${Object.keys(eventTypeMap).length} event types from inventory`);
        console.log('Event Type Map:', eventTypeMap);
      } else {
        console.error('❌ Invalid inventory response:', inventoryResponse);
      }
    } catch (error) {
      console.error('❌ Error fetching inventory data:', error);
      console.error('Error details:', error.message, error.stack);
    }
    
    // Define specific fields to export (in order)
    const fieldOrder = [
      'date_of_enquiry',      // Date of Lead
      'assigned_to_name',     // Alloted to Sales Person
      'name',                 // Name of Lead
      'phone',                // Phone No.
      'email',                // Email
      'business_type',        // Client Type
      'status',               // Current Status/Stage
      'source',               // Source
      'event_category',       // Event Category
      'lead_for_event',       // Event (using lead_for_event or event_name)
      'ad_set',               // Ad Set
      'ad_name',              // Ad Name
      'annual_income_bracket', // What is your annual income
      'number_of_people',      // How many tickets do you need
      'first_contact_date',   // First Touchbase Date
      'last_contact_date',    // Last Touchbase Date
    ];
    
    // Fetch communications for all leads
    const leadCommunications = {};
    
    if (includeCommunications) {
      console.log('🔄 Fetching communications for leads...');
      
      // Process in batches to avoid overwhelming the API
      const batchSize = 10;
      for (let i = 0; i < Math.min(leadsToExport.length, 50); i += batchSize) {
        const batch = leadsToExport.slice(i, i + batchSize);
        const batchPromises = batch.map(async (lead) => {
          try {
            // Log lead info to debug
            console.log(`Fetching communications for lead: ${lead.name} (${lead.email}) - ID: ${lead.id}`);
            
            // Special check for the lead you mentioned
            if (lead.email === 'garglvsh93@gmail.com') {
              console.log('🎯 Found the specific lead with email garglvsh93@gmail.com - ID:', lead.id);
            }
            
            const response = await window.apiCall(`/communications/lead/${lead.id}`);
            
            // Check response structure
            if (response && response.data && Array.isArray(response.data)) {
              leadCommunications[lead.id] = response.data;
              if (response.data.length > 0) {
                console.log(`✅ Fetched ${response.data.length} communications for lead ${lead.id} (${lead.name})`);
              }
            } else if (response && Array.isArray(response)) {
              // Sometimes the response might be the array directly
              leadCommunications[lead.id] = response;
              if (response.length > 0) {
                console.log(`✅ Fetched ${response.length} communications for lead ${lead.id} (${lead.name})`);
              }
            } else {
              console.log(`No communications found for lead ${lead.id} (${lead.name})`);
              leadCommunications[lead.id] = [];
            }
          } catch (error) {
            console.error(`Failed to fetch communications for lead ${lead.id} (${lead.name}):`, error);
            leadCommunications[lead.id] = [];
          }
        });
        
        await Promise.all(batchPromises);
      }
    }
    
    // Get all unique fields from all leads
    const allFields = new Set();
    leadsToExport.forEach(lead => {
      Object.keys(lead).forEach(key => allFields.add(key));
    });
    
    // Filter out fields that don't exist in any lead
    const fieldsToExport = fieldOrder.filter(field => 
      allFields.has(field) || 
      field === 'assigned_to_name' || // This is derived from assigned_to
      field === 'event_category' || // Might need special handling
      field === 'annual_income_bracket' || // Might be in different field name
      field === 'number_of_people' || // Might be in different field name
      field === 'first_contact_date' || // Might need to be calculated
      field === 'ad_set' || // Might be stored as adset_name
      field === 'ad_name' // Might be stored under different name
    );
    
    // Create CSV headers with proper labels
    const headerLabels = {
      date_of_enquiry: 'Date of Lead',
      assigned_to_name: 'Alloted to Sales Person',
      name: 'Name of Lead',
      phone: 'Phone No.',
      email: 'Email',
      business_type: 'Client Type',
      status: 'Current Status/Stage',
      source: 'Source',
      event_category: 'Event Category',
      lead_for_event: 'Event',
      event_name: 'Event',
      ad_set: 'Ad Set',
      ad_name: 'Ad Name',
      annual_income_bracket: 'What is your annual income',
      number_of_people: 'How many tickets do you need',
      first_contact_date: 'First Touchbase Date',
      last_contact_date: 'Last Touchbase Date'
    };
    
    // Find maximum number of communications across all leads
    let maxCommunications = 0;
    let totalCommunications = 0;
    leadsToExport.forEach(lead => {
      const commCount = leadCommunications[lead.id] ? leadCommunications[lead.id].length : 0;
      totalCommunications += commCount;
      maxCommunications = Math.max(maxCommunications, commCount);
    });
    
    console.log(`📊 Found ${totalCommunications} total communications, max ${maxCommunications} per lead`);
    
    // Add communication headers
    for (let i = 1; i <= maxCommunications; i++) {
      const commField = `communication_${i}`;
      fieldsToExport.push(commField);
      headerLabels[commField] = `Communication ${i}`;
    }
    
    // Create CSV headers
    const headers = fieldsToExport.map(field => headerLabels[field] || field);
    
    // Create CSV rows
    const rows = leadsToExport.map(lead => {
      return fieldsToExport.map(field => {
        let value = '';
        
        // Handle special fields
        if (field === 'assigned_to_name') {
          // Get user name from assigned_to
          if (lead.assigned_to_name) {
            value = lead.assigned_to_name;
          } else if (lead.assigned_to) {
            const users = window.appState?.users || window.users || [];
            const assignedUser = users.find(u => u.email === lead.assigned_to || u.id === lead.assigned_to);
            value = assignedUser ? assignedUser.name : lead.assigned_to;
          }
        } else if (field === 'event_category') {
          // First try to get event type from the event mapping
          const eventName = lead.lead_for_event || lead.event_name || lead.event || '';
          console.log(`Lead ${lead.name}: event_name="${eventName}", looking up in eventTypeMap...`);
          if (eventName && eventTypeMap[eventName.toLowerCase()]) {
            value = eventTypeMap[eventName.toLowerCase()];
            console.log(`  Found event type: ${value}`);
          } else {
            // Fallback to fields in lead object
            value = lead.event_category || lead.event_type || lead.category || '';
            console.log(`  No match found, using fallback: ${value || '(empty)'}`);
          }
        } else if (field === 'lead_for_event') {
          // Use lead_for_event or event_name
          value = lead.lead_for_event || lead.event_name || lead.event || '';
        } else if (field === 'annual_income_bracket') {
          // Look for annual income in various possible fields
          value = lead.annual_income_bracket || lead.annual_income || lead.income || '';
        } else if (field === 'number_of_people') {
          // Look for ticket quantity in various possible fields
          value = lead.number_of_people || lead.ticket_quantity || lead.tickets_needed || lead.quantity || '';
        } else if (field === 'first_contact_date') {
          // Calculate first contact date from communications or use created date
          const communications = leadCommunications[lead.id] || [];
          if (communications.length > 0) {
            // Sort communications by date to find the first one
            const sortedComms = [...communications].sort((a, b) => 
              new Date(a.created_date) - new Date(b.created_date)
            );
            value = toISTString(sortedComms[0].created_date);
          } else if (lead.first_contact_date) {
            value = toISTString(lead.first_contact_date);
          } else if (lead.created_date) {
            value = toISTString(lead.created_date);
          }
        } else if (field === 'ad_set') {
          // Handle ad_set field - check multiple possible field names
          value = lead.ad_set || lead.adset_name || lead.ad_set_name || lead.adset || '';
        } else if (field === 'ad_name') {
          // Handle ad_name field
          value = lead.ad_name || lead.ad || '';
        } else if (field.startsWith('communication_')) {
          // Handle communication fields
          const commIndex = parseInt(field.split('_')[1]) - 1;
          const communications = leadCommunications[lead.id] || [];
          
          if (communications && communications[commIndex]) {
            const comm = communications[commIndex];
            // Format communication entry
            const date = comm.created_date ? toISTString(comm.created_date) : '';
            const type = comm.communication_type || 'Note';
            const direction = comm.direction ? `[${comm.direction}]` : '';
            const subject = comm.subject ? `${comm.subject}: ` : '';
            const content = comm.content || '';
            const outcome = comm.outcome ? ` (Outcome: ${comm.outcome})` : '';
            const by = comm.created_by_name || comm.created_by || '';
            const duration = comm.duration_minutes ? ` (${comm.duration_minutes} mins)` : '';
            
            value = `${date} ${type}${direction}${duration} - ${subject}${content}${outcome}${by ? ` - by ${by}` : ''}`;
          } else {
            value = ''; // No communication at this index
          }
        } else {
          // Regular field
          value = lead[field];
        }
        
        // Handle null/undefined
        if (value === null || value === undefined) {
          return '';
        }
        
        // Format dates - use IST for touchbase dates, regular format for others
        if ((field.includes('date') || field.includes('Date')) && value && field !== 'first_contact_date') {
          // Handle Firestore timestamp
          if (value._seconds !== undefined || (typeof value === 'object' && value.seconds !== undefined)) {
            if (field === 'last_contact_date') {
              value = toISTString(value);
            } else {
              const date = value._seconds ? new Date(value._seconds * 1000) : new Date(value.seconds * 1000);
              value = date.toLocaleDateString();
            }
          } else if (!isNaN(new Date(value).getTime())) {
            if (field === 'last_contact_date') {
              value = toISTString(value);
            } else {
              value = new Date(value).toLocaleDateString();
            }
          }
        }
        
        // Format status with label
        if (field === 'status' && value) {
          if (window.LEAD_STATUSES && window.LEAD_STATUSES[value]) {
            value = window.LEAD_STATUSES[value].label || value;
          } else {
            // Format status string (replace underscores with spaces and capitalize)
            value = value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          }
        }
        
        // Handle arrays and objects
        if (typeof value === 'object' && !field.startsWith('communication_')) {
          value = JSON.stringify(value);
        }
        
        // Escape quotes and handle commas
        value = String(value).replace(/"/g, '""');
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = `"${value}"`;
        }
        
        return value;
      });
    });
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = exportAll ? 
      `all-leads-export-${timestamp}.csv` : 
      `leads-export-${timestamp}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success message
    const message = exportAll ? 
      `Successfully exported all ${leadsToExport.length} leads to CSV` :
      `Successfully exported ${leadsToExport.length} filtered leads to CSV`;
    alert(message);
    
    console.log('✅ CSV export completed');
    
  } catch (error) {
    console.error('❌ Error exporting leads to CSV:', error);
    alert('Error exporting leads: ' + error.message);
  }
};

// Helper function to get all leads (handles pagination)
window.fetchAllLeadsForExport = async function() {
  try {
    const allLeads = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const response = await window.apiCall(`/leads/paginated?page=${page}&limit=100`);
      
      if (response.success && response.data && response.data.length > 0) {
        allLeads.push(...response.data);
        
        // Check if there are more pages
        const pagination = response.pagination || {};
        hasMore = pagination.hasNext || (page < pagination.totalPages);
        page++;
      } else {
        hasMore = false;
      }
    }
    
    return allLeads;
  } catch (error) {
    console.error('Error fetching all leads:', error);
    throw error;
  }
};

// Export filtered leads (current view)
window.exportFilteredLeadsToCSV = function() {
  window.exportLeadsToCSV(false);
};

// Export all leads
window.exportAllLeadsToCSV = async function() {
  if (confirm('This will export ALL leads in the system. This may take a moment for large datasets. Continue?')) {
    // Show loading state
    if (window.appState?.setLoading) {
      window.appState.setLoading(true);
    }
    
    try {
      // Fetch all leads first
      const allLeads = await window.fetchAllLeadsForExport();
      
      // Temporarily set leads for export
      const originalLeads = window.appState?.leads || window.leads;
      if (window.appState) {
        window.appState.leads = allLeads;
      } else {
        window.leads = allLeads;
      }
      
      // Export
      await window.exportLeadsToCSV(false);
      
      // Restore original leads
      if (window.appState) {
        window.appState.leads = originalLeads;
      } else {
        window.leads = originalLeads;
      }
      
    } finally {
      if (window.appState?.setLoading) {
        window.appState.setLoading(false);
      }
    }
  }
};

console.log('✅ Leads CSV Export functionality loaded');