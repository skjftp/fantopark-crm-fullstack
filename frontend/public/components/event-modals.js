// Complete Event Modal Components - Exact Production Structure
// ✅ All fields from production.html with proper sections and styling

// ===== COMPLETE EVENT FORM FIELDS =====
const eventFormFields = [
  // Basic Information
  { name: 'event_name', label: 'Event Name', type: 'text', required: true, section: 'basic' },
  { name: 'event_type', label: 'Event Type', type: 'select', options: ['upcoming', 'live', 'completed', 'postponed'], required: true, section: 'basic' },
  { name: 'sport_type', label: 'Sport Type', type: 'select', options: ['Cricket', 'Football', 'Tennis', 'Formula 1', 'Olympics', 'Basketball', 'Badminton', 'Hockey', 'Golf', 'Wrestling', 'Cycling'], required: true, section: 'basic' },
  { name: 'geography', label: 'Geography', type: 'select', options: ['India', 'UAE - Dubai', 'UAE - Abu Dhabi', 'UK', 'USA', 'Australia', 'Europe', 'Asia', 'Other'], required: true, section: 'basic' },
  
  // Date and Time
  { name: 'start_date', label: 'Start Date', type: 'date', required: true, section: 'datetime' },
  { name: 'end_date', label: 'End Date', type: 'date', required: false, section: 'datetime' },
  { name: 'start_time', label: 'Start Time', type: 'time', required: false, section: 'datetime' },
  { name: 'end_time', label: 'End Time', type: 'time', required: false, section: 'datetime' },
  
  // Venue Information
  { name: 'venue', label: 'Venue Name', type: 'text', required: true, section: 'venue' },
  { name: 'venue_capacity', label: 'Venue Capacity', type: 'number', required: false, section: 'venue' },
  { name: 'venue_address', label: 'Venue Address', type: 'textarea', required: false, section: 'venue' },
  
  // Ticketing Information
  { name: 'official_ticketing_partners', label: 'Official Ticketing Partners', type: 'textarea', required: false, section: 'ticketing' },
  { name: 'primary_source', label: 'Primary Source', type: 'text', required: false, section: 'ticketing' },
  { name: 'secondary_source', label: 'Secondary Source', type: 'text', required: false, section: 'ticketing' },
  { name: 'ticket_available', label: 'Tickets Available for Sale', type: 'checkbox', required: false, section: 'ticketing' },
  
  // Priority and Status
  { name: 'priority', label: 'Priority', type: 'select', options: ['P1', 'P2', 'P3'], required: true, section: 'status' },
  { name: 'status', label: 'Status', type: 'select', options: ['upcoming', 'live', 'completed', 'cancelled', 'postponed'], required: true, section: 'status' },
  { name: 'sold_out_potential', label: 'Sold Out Potential', type: 'select', options: ['High', 'Medium', 'Low', 'No'], required: false, section: 'status' },
  
  // Additional Information
  { name: 'remarks', label: 'Remarks/Description', type: 'textarea', required: false, section: 'additional' },
  { name: 'fantopark_package', label: 'FanToPark Package Details', type: 'textarea', required: false, section: 'additional' }
];

// ===== EVENT FORM MODAL =====
window.renderEventFormModal = () => {
  // ✅ Extract state with fallbacks (your pattern)
  const {
    showEventForm = window.appState?.showEventForm || false,
    currentEvent = window.appState?.currentEvent || null,
    eventFormData = window.appState?.eventFormData || {},
    loading = window.loading || false
  } = window.appState || {};

  const {
    setShowEventForm = window.setShowEventForm || (() => {}),
    setCurrentEvent = window.setCurrentEvent || (() => {}),
    setEventFormData = window.setEventFormData || (() => {}),
    setLoading = window.setLoading || (() => {}),
    fetchAllEvents = window.fetchAllEvents || (() => {}),
    apiCall = window.apiCall || (() => Promise.resolve({}))
  } = window;

  if (!showEventForm) return null;

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      console.log('📅 Event form submission started:', eventFormData);

      if (!eventFormData.event_name) {
        alert('Please enter an event name');
        return;
      }

      // Clean event data (from production.html pattern)
      const cleanEventData = {
        event_name: eventFormData.event_name.trim(),
        title: eventFormData.event_name.trim(), // Sync title
        sport_type: eventFormData.sport_type || '',
        geography: eventFormData.geography || '',
        start_date: eventFormData.start_date || '',
        priority: eventFormData.priority || 'P3',
        status: eventFormData.status || 'upcoming',
        ticket_available: Boolean(eventFormData.ticket_available),
        created_by: window.user?.name || 'Unknown User',
        created_date: new Date().toISOString()
      };

      // Add optional fields only if they have values
      const optionalFields = [
        'end_date', 'start_time', 'end_time', 'venue', 'venue_capacity', 'venue_address',
        'official_ticketing_partners', 'primary_source', 'secondary_source', 
        'sold_out_potential', 'remarks', 'fantopark_package', 'event_type'
      ];

      optionalFields.forEach(field => {
        if (eventFormData[field] && eventFormData[field].toString().trim()) {
          cleanEventData[field] = eventFormData[field].toString().trim();
        }
      });

      console.log('Sending clean event data:', cleanEventData);

      if (currentEvent && currentEvent.id) {
        // Update existing event
        const response = await apiCall(`/events/${currentEvent.id}`, {
          method: 'PUT',
          body: JSON.stringify(cleanEventData)
        });
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        alert('✅ Event updated successfully!');
      } else {
        // Create new event
        const response = await apiCall('/events', {
          method: 'POST',
          body: JSON.stringify(cleanEventData)
        });
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        alert('✅ Event created successfully!');
      }
      
      // Refresh events and close modal
      await fetchAllEvents();
      setShowEventForm(false);
      setCurrentEvent(null);
      setEventFormData({});
      
    } catch (error) {
      console.error('❌ Error with event submission:', error);
      alert('❌ Error saving event: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to render form fields by section
  const renderSection = (sectionName, title, icon) => {
    const sectionFields = eventFormFields.filter(field => field.section === sectionName);
    if (sectionFields.length === 0) return null;

    return React.createElement('div', { className: 'mb-8' },
      React.createElement('h3', { className: 'text-lg font-semibold mb-4 flex items-center text-gray-900' },
        React.createElement('span', { className: 'mr-2 text-xl' }, icon),
        title
      ),
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
        sectionFields.map(field => {
          if (field.type === 'textarea') {
            return React.createElement('div', { key: field.name, className: 'md:col-span-2' },
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                field.label + (field.required ? ' *' : '')
              ),
              React.createElement('textarea', {
                value: eventFormData[field.name] || '',
                onChange: (e) => setEventFormData({...eventFormData, [field.name]: e.target.value}),
                className: 'w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                required: field.required,
                placeholder: field.placeholder || '',
                rows: 3
              })
            );
          } else if (field.type === 'select') {
            return React.createElement('div', { key: field.name },
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                field.label + (field.required ? ' *' : '')
              ),
              React.createElement('select', {
                value: eventFormData[field.name] || '',
                onChange: (e) => setEventFormData({...eventFormData, [field.name]: e.target.value}),
                className: 'w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                required: field.required
              },
                React.createElement('option', { value: '' }, `Select ${field.label}`),
                ...field.options.map(option =>
                  React.createElement('option', { key: option, value: option }, option)
                )
              )
            );
          } else if (field.type === 'checkbox') {
            return React.createElement('div', { key: field.name, className: 'flex items-center p-3 bg-gray-50 rounded-lg' },
              React.createElement('input', {
                type: 'checkbox',
                checked: eventFormData[field.name] || false,
                onChange: (e) => setEventFormData({...eventFormData, [field.name]: e.target.checked}),
                className: 'mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded',
                id: field.name
              }),
              React.createElement('label', { 
                htmlFor: field.name,
                className: 'text-sm font-medium text-gray-700' 
              }, field.label)
            );
          } else {
            return React.createElement('div', { key: field.name },
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
                field.label + (field.required ? ' *' : '')
              ),
              React.createElement('input', {
                type: field.type,
                value: eventFormData[field.name] || '',
                onChange: (e) => setEventFormData({...eventFormData, [field.name]: e.target.value}),
                className: 'w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                required: field.required,
                placeholder: field.placeholder || ''
              })
            );
          }
        })
      )
    );
  };

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',
    onClick: () => setShowEventForm(false)
  },
    React.createElement('div', {
      className: 'bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl',
      onClick: (e) => e.stopPropagation()
    },
      React.createElement('form', { onSubmit: handleEventSubmit },
        // Header
        React.createElement('div', { className: 'sticky top-0 bg-white border-b p-6 rounded-t-xl' },
          React.createElement('div', { className: 'flex justify-between items-center' },
            React.createElement('h2', { className: 'text-2xl font-bold text-gray-900' }, 
              currentEvent ? `Edit Event: ${currentEvent.event_name || currentEvent.title}` : 'Add New Event'
            ),
            React.createElement('button', {
              type: 'button',
              onClick: () => setShowEventForm(false),
              className: 'text-gray-400 hover:text-gray-600 text-3xl font-light'
            }, '×')
          )
        ),
        
        // Form Content
        React.createElement('div', { className: 'p-6 space-y-8' },
          renderSection('basic', 'Basic Information', '📋'),
          renderSection('datetime', 'Date & Time', '📅'),
          renderSection('venue', 'Venue Information', '🏟️'),
          renderSection('ticketing', 'Ticketing Information', '🎫'),
          renderSection('status', 'Status & Priority', '📊'),
          renderSection('additional', 'Additional Information', '📝')
        ),
        
        // Footer
        React.createElement('div', { className: 'sticky bottom-0 bg-gray-50 border-t p-6 flex justify-end space-x-4 rounded-b-xl' },
          React.createElement('button', {
            type: 'button',
            onClick: () => setShowEventForm(false),
            className: 'px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium'
          }, 'Cancel'),
          React.createElement('button', {
            type: 'submit',
            disabled: loading,
            className: 'px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center gap-2'
          }, 
            loading && React.createElement('div', { className: 'animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full' }),
            loading ? 'Saving...' : (currentEvent ? 'Update Event' : 'Create Event')
          )
        )
      )
    )
  );
};

// ===== EVENT DETAIL MODAL =====
window.renderEventDetailModal = () => {
  const {
    showEventDetail = window.appState?.showEventDetail || false,
    currentEvent = window.appState?.currentEvent || null
  } = window.appState || {};

  const {
    setShowEventDetail = window.setShowEventDetail || (() => {}),
    setShowEventForm = window.setShowEventForm || (() => {}),
    setEventFormData = window.setEventFormData || (() => {}),
    setCurrentEvent = window.setCurrentEvent || (() => {}),
    deleteEvent = window.deleteEvent || (() => {})
  } = window;

  if (!showEventDetail || !currentEvent) return null;

  // Priority styles (from production.html)
  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'P1': return 'bg-red-50 border-red-200';
      case 'P2': return 'bg-yellow-50 border-yellow-200';
      case 'P3': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 'P1': return 'bg-red-100 text-red-800';
      case 'P2': return 'bg-yellow-100 text-yellow-800';
      case 'P3': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'live': return 'bg-red-500 text-white animate-pulse';
      case 'upcoming': return 'bg-blue-500 text-white';
      case 'completed': return 'bg-gray-500 text-white';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'postponed': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-400 text-white';
    }
  };

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',
    style: { backdropFilter: 'blur(4px)' },
    onClick: (e) => {
      if (e.target === e.currentTarget) setShowEventDetail(false);
    }
  },
    React.createElement('div', {
      className: 'bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-auto shadow-2xl',
      onClick: (e) => e.stopPropagation()
    },
      // Header with Priority Badge
      React.createElement('div', {
        className: `p-6 border-b ${getPriorityStyles(currentEvent.priority)}`
      },
        React.createElement('div', { className: 'flex justify-between items-start' },
          React.createElement('div', { className: 'flex-1' },
            React.createElement('div', { className: 'flex items-center gap-3 mb-3' },
              React.createElement('h2', { className: 'text-3xl font-bold text-gray-900' },
                currentEvent.event_name || currentEvent.title
              ),
              React.createElement('span', {
                className: `px-3 py-1 text-sm font-semibold rounded-full ${getPriorityBadgeColor(currentEvent.priority)}`
              }, currentEvent.priority || 'P3')
            ),
            React.createElement('p', { className: 'text-lg text-gray-600 mb-2' },
              `${currentEvent.sport_type || currentEvent.category || 'Event'} • ${currentEvent.geography || 'Location TBD'}`
            ),
            // Status Badge
            React.createElement('div', { className: 'flex items-center gap-2' },
              React.createElement('span', {
                className: `px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeColor(currentEvent.status)}`
              }, (currentEvent.status || 'upcoming').toUpperCase())
            )
          ),
          React.createElement('button', {
            onClick: () => setShowEventDetail(false),
            className: 'text-gray-500 hover:text-gray-700 text-3xl p-2 rounded-lg hover:bg-gray-100'
          }, '×')
        )
      ),
      
      // Content Grid
      React.createElement('div', { className: 'p-6 grid md:grid-cols-2 gap-8' },
        // Left Column
        React.createElement('div', { className: 'space-y-6' },
          // Date & Time
          React.createElement('div', null,
            React.createElement('h3', { className: 'text-lg font-semibold mb-3 flex items-center' },
              React.createElement('span', { className: 'mr-2' }, '📅'),
              'Date & Time'
            ),
            React.createElement('div', { className: 'space-y-2 text-sm bg-gray-50 p-4 rounded-lg' },
              React.createElement('div', { className: 'flex justify-between' },
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Start Date:'),
                React.createElement('span', { className: 'text-gray-900' },
                  currentEvent.start_date ? new Date(currentEvent.start_date).toLocaleDateString() : 'TBD'
                )
              ),
              React.createElement('div', { className: 'flex justify-between' },
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'End Date:'),
                React.createElement('span', { className: 'text-gray-900' },
                  currentEvent.end_date ? new Date(currentEvent.end_date).toLocaleDateString() : 'Same day'
                )
              ),
              currentEvent.start_time && React.createElement('div', { className: 'flex justify-between' },
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Start Time:'),
                React.createElement('span', { className: 'text-gray-900' }, currentEvent.start_time)
              ),
              currentEvent.end_time && React.createElement('div', { className: 'flex justify-between' },
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'End Time:'),
                React.createElement('span', { className: 'text-gray-900' }, currentEvent.end_time)
              )
            )
          ),
          
          // Venue & Location
          React.createElement('div', null,
            React.createElement('h3', { className: 'text-lg font-semibold mb-3 flex items-center' },
              React.createElement('span', { className: 'mr-2' }, '🏟️'),
              'Venue & Location'
            ),
            React.createElement('div', { className: 'bg-gray-50 p-4 rounded-lg' },
              React.createElement('p', { className: 'text-gray-900 font-medium text-lg' }, currentEvent.venue || 'TBD'),
              React.createElement('p', { className: 'text-gray-600 text-sm mt-1' }, currentEvent.geography || 'Location TBD'),
              currentEvent.venue_address && React.createElement('p', { className: 'text-gray-600 text-sm mt-2' }, currentEvent.venue_address),
              currentEvent.venue_capacity && React.createElement('p', { className: 'text-blue-600 text-sm mt-2' }, `Capacity: ${currentEvent.venue_capacity.toLocaleString()}`)
            )
          )
        ),
        
        // Right Column
        React.createElement('div', { className: 'space-y-6' },
          // Primary Source
          currentEvent.primary_source && React.createElement('div', null,
            React.createElement('h3', { className: 'text-lg font-semibold mb-3 flex items-center' },
              React.createElement('span', { className: 'mr-2' }, '🔗'),
              'Primary Source'
            ),
            React.createElement('div', { className: 'bg-green-50 p-4 rounded-lg border border-green-200' },
              React.createElement('p', { className: 'text-green-900 text-sm font-medium' },
                currentEvent.primary_source
              )
            )
          ),
          
          // Secondary Source
          currentEvent.secondary_source && React.createElement('div', null,
            React.createElement('h3', { className: 'text-lg font-semibold mb-3 flex items-center' },
              React.createElement('span', { className: 'mr-2' }, '🔗'),
              'Secondary Source'
            ),
            React.createElement('div', { className: 'bg-purple-50 p-4 rounded-lg border border-purple-200' },
              React.createElement('p', { className: 'text-purple-900 text-sm font-medium' },
                currentEvent.secondary_source
              )
            )
          ),
          
          // Ticket Availability
          React.createElement('div', null,
            React.createElement('h3', { className: 'text-lg font-semibold mb-3 flex items-center' },
              React.createElement('span', { className: 'mr-2' }, '🎟️'),
              'Ticket Availability'
            ),
            React.createElement('div', { 
              className: `p-4 rounded-lg border ${currentEvent.ticket_available ? 
                'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`
            },
              React.createElement('p', { 
                className: `text-sm font-semibold ${currentEvent.ticket_available ? 
                  'text-green-900' : 'text-red-900'}`
              },
                currentEvent.ticket_available ? '✅ Tickets Available' : '❌ Tickets Not Available'
              )
            )
          ),
          
          // Additional Information
          currentEvent.sold_out_potential && React.createElement('div', null,
            React.createElement('h3', { className: 'text-lg font-semibold mb-3 flex items-center' },
              React.createElement('span', { className: 'mr-2' }, '📊'),
              'Sold Out Potential'
            ),
            React.createElement('div', { className: 'bg-orange-50 p-4 rounded-lg border border-orange-200' },
              React.createElement('p', { className: 'text-orange-900 text-sm font-medium' },
                currentEvent.sold_out_potential
              )
            )
          )
        )
      ),
      
      // Additional Sections (Full Width)
      React.createElement('div', { className: 'px-6 pb-4' },
        // Official Ticketing Partners
        currentEvent.official_ticketing_partners && React.createElement('div', { className: 'mb-6' },
          React.createElement('h3', { className: 'text-lg font-semibold mb-3 flex items-center' },
            React.createElement('span', { className: 'mr-2' }, '🎫'),
            'Official Ticketing Partners'
          ),
          React.createElement('div', { className: 'bg-yellow-50 p-4 rounded-lg border border-yellow-200' },
            React.createElement('p', { className: 'text-yellow-900 text-sm' },
              currentEvent.official_ticketing_partners
            )
          )
        ),
        
        // FanToPark Package
        currentEvent.fantopark_package && React.createElement('div', { className: 'mb-6' },
          React.createElement('h3', { className: 'text-lg font-semibold mb-3 flex items-center' },
            React.createElement('span', { className: 'mr-2' }, '📦'),
            'FanToPark Package'
          ),
          React.createElement('div', { className: 'bg-blue-50 p-4 rounded-lg border border-blue-200' },
            React.createElement('p', { className: 'text-blue-900 text-sm' },
              currentEvent.fantopark_package
            )
          )
        ),
        
        // Remarks
        currentEvent.remarks && React.createElement('div', { className: 'mb-6' },
          React.createElement('h3', { className: 'text-lg font-semibold mb-3 flex items-center' },
            React.createElement('span', { className: 'mr-2' }, '📝'),
            'Remarks'
          ),
          React.createElement('div', { className: 'bg-gray-50 p-4 rounded-lg border border-gray-200' },
            React.createElement('p', { className: 'text-gray-700 text-sm' },
              currentEvent.remarks
            )
          )
        )
      ),
      
      // Action Buttons Footer
      React.createElement('div', { className: 'border-t bg-gray-50 px-6 py-4 flex flex-wrap gap-3 rounded-b-xl' },
        React.createElement('button', {
          onClick: () => {
            // Pre-fill form with current event data
            setEventFormData({
              ...currentEvent,
              event_name: currentEvent.event_name || currentEvent.title,
              start_date: currentEvent.start_date || currentEvent.date,
              start_time: currentEvent.start_time || currentEvent.time
            });
            setShowEventDetail(false);
            setShowEventForm(true);
          },
          className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2'
        },
          React.createElement('span', null, '✏️'),
          'Edit Event'
        ),
        React.createElement('button', {
          onClick: () => {
            // Pre-fill inventory form with event data
            if (window.openAddInventoryForm) {
              window.setFormData && window.setFormData({
                event_name: currentEvent.event_name || currentEvent.title,
                event_date: currentEvent.start_date || currentEvent.date,
                venue: currentEvent.venue,
                sports: currentEvent.sport_type || currentEvent.category
              });
              setShowEventDetail(false);
              window.openAddInventoryForm();
            } else {
              alert('Inventory form not available');
            }
          },
          className: 'px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center gap-2'
        },
          React.createElement('span', null, '🎫'),
          'Create Inventory'
        ),
        React.createElement('button', {
          onClick: () => {
            if (confirm(`Are you sure you want to delete "${currentEvent.event_name || currentEvent.title}"? This action cannot be undone.`)) {
              deleteEvent(currentEvent.id);
              setShowEventDetail(false);
            }
          },
          className: 'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors flex items-center gap-2'
        },
          React.createElement('span', null, '🗑️'),
          'Delete Event'
        ),
        React.createElement('button', {
          onClick: () => setShowEventDetail(false),
          className: 'px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors ml-auto'
        }, 'Close')
      )
    )
  );
};

// ===== ENHANCED STATE SETTERS =====
if (!window.setEventFormData) {
  window.setEventFormData = (data) => {
    console.log("📅 setEventFormData called with:", data);
    window.eventFormData = data;
    window.appState.eventFormData = data;
    
    // Sync with React state if available
    if (window.appState.setEventFormData) {
      window.appState.setEventFormData(data);
    }
  };
}

// Initialize eventFormData if not present
if (!window.eventFormData) {
  window.eventFormData = {};
  window.appState.eventFormData = {};
}

console.log('✅ Complete Production Event Modal Components loaded successfully with all fields and exact styling');
