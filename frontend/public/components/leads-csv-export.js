// Leads CSV Export Functionality
// Exports all lead fields to CSV format

window.exportLeadsToCSV = async function(exportAll = false) {
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
    
    // Get all unique fields from all leads
    const allFields = new Set();
    leadsToExport.forEach(lead => {
      Object.keys(lead).forEach(key => allFields.add(key));
    });
    
    // Define field order (important fields first)
    const fieldOrder = [
      'id',
      'name',
      'email',
      'phone',
      'company',
      'status',
      'source',
      'lead_for_event',
      'event_name',
      'assigned_to',
      'assigned_to_name',
      'date_of_enquiry',
      'created_date',
      'updated_date',
      'business_type',
      'potential_value',
      'client_id',
      'address',
      'city',
      'state',
      'country',
      'requirements',
      'notes',
      'last_contact_date',
      'next_follow_up',
      'conversion_date',
      'lost_reason',
      'tags',
      'priority',
      'campaign_source',
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'referral_source',
      'website_source',
      'ip_address',
      'browser_info',
      'device_type',
      'operating_system',
      'page_visited',
      'form_submitted',
      'lead_quality_score',
      'engagement_score',
      'budget_range',
      'timeline',
      'decision_maker',
      'buying_stage',
      'competitors_considered',
      'pain_points',
      'custom_field_1',
      'custom_field_2',
      'custom_field_3',
      'custom_field_4',
      'custom_field_5'
    ];
    
    // Add any remaining fields not in fieldOrder
    allFields.forEach(field => {
      if (!fieldOrder.includes(field)) {
        fieldOrder.push(field);
      }
    });
    
    // Filter out fields that don't exist in any lead
    const fieldsToExport = fieldOrder.filter(field => allFields.has(field));
    
    // Create CSV headers with proper labels
    const headerLabels = {
      id: 'Lead ID',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      company: 'Company',
      status: 'Status',
      source: 'Source',
      lead_for_event: 'Lead For Event',
      event_name: 'Event Name',
      assigned_to: 'Assigned To (ID)',
      assigned_to_name: 'Assigned To (Name)',
      date_of_enquiry: 'Date of Enquiry',
      created_date: 'Created Date',
      updated_date: 'Updated Date',
      business_type: 'Business Type',
      potential_value: 'Potential Value',
      client_id: 'Client ID',
      address: 'Address',
      city: 'City',
      state: 'State',
      country: 'Country',
      requirements: 'Requirements',
      notes: 'Notes',
      last_contact_date: 'Last Contact Date',
      next_follow_up: 'Next Follow Up',
      conversion_date: 'Conversion Date',
      lost_reason: 'Lost Reason',
      tags: 'Tags',
      priority: 'Priority',
      campaign_source: 'Campaign Source',
      utm_source: 'UTM Source',
      utm_medium: 'UTM Medium',
      utm_campaign: 'UTM Campaign',
      referral_source: 'Referral Source',
      website_source: 'Website Source',
      ip_address: 'IP Address',
      browser_info: 'Browser Info',
      device_type: 'Device Type',
      operating_system: 'Operating System',
      page_visited: 'Page Visited',
      form_submitted: 'Form Submitted',
      lead_quality_score: 'Lead Quality Score',
      engagement_score: 'Engagement Score',
      budget_range: 'Budget Range',
      timeline: 'Timeline',
      decision_maker: 'Decision Maker',
      buying_stage: 'Buying Stage',
      competitors_considered: 'Competitors Considered',
      pain_points: 'Pain Points'
    };
    
    // Create CSV headers
    const headers = fieldsToExport.map(field => headerLabels[field] || field);
    
    // Create CSV rows
    const rows = leadsToExport.map(lead => {
      return fieldsToExport.map(field => {
        let value = lead[field];
        
        // Handle special formatting
        if (value === null || value === undefined) {
          return '';
        }
        
        // Format dates
        if (field.includes('date') || field.includes('Date')) {
          if (value && !isNaN(new Date(value).getTime())) {
            value = new Date(value).toLocaleString();
          }
        }
        
        // Format status with label
        if (field === 'status' && window.LEAD_STATUSES && window.LEAD_STATUSES[value]) {
          value = window.LEAD_STATUSES[value].label || value;
        }
        
        // Format assigned_to_name
        if (field === 'assigned_to_name' && !value && lead.assigned_to) {
          // Try to get user name from users list
          const users = window.appState?.users || window.users || [];
          const assignedUser = users.find(u => u.email === lead.assigned_to || u.id === lead.assigned_to);
          value = assignedUser ? assignedUser.name : lead.assigned_to;
        }
        
        // Handle arrays and objects
        if (typeof value === 'object') {
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