// Event Modal Components - Exact Pattern from production.html
// ✅ Using your established modal structure and patterns

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

  // Event form fields (based on your production.html pattern)
  const eventFormFields = [
    { name: 'event_name', label: 'Event Name', type: 'text', required: true, placeholder: 'e.g., England vs India - 2nd Test' },
    { name: 'sport_type', label: 'Sport Type', type: 'select', required: true, options: ['Cricket', 'Football', 'Tennis', 'Formula 1', 'Basketball', 'Golf', 'Hockey', 'Other'] },
    { name: 'geography', label: 'Geography', type: 'select', required: true, options: ['India', 'UAE - Dubai', 'UAE - Abu Dhabi', 'UK', 'USA', 'Australia', 'Other'] },
    { name: 'start_date', label: 'Start Date', type: 'date', required: true },
    { name: 'end_date', label: 'End Date', type: 'date', required: false },
    { name: 'start_time', label: 'Start Time', type: 'time', required: false },
    { name: 'end_time', label: 'End Time', type: 'time', required: false },
    { name: 'venue', label: 'Venue', type: 'text', required: true, placeholder: 'e.g., Lord\'s Cricket Ground' },
    { name: 'priority', label: 'Priority', type: 'select', required: true, options: ['P1', 'P2', 'P3'] },
    { name: 'status', label: 'Status', type: 'select', required: false, options: ['upcoming', 'ongoing', 'completed', 'cancelled'] },
    { name: 'ticket_available', label: 'Tickets Available', type: 'checkbox', required: false },
    { name: 'official_ticketing_partners', label: 'Official Ticketing Partners', type: 'text', required: false },
    { name: 'fantopark_package', label: 'FanToPark Package', type: 'text', required: false },
    { name: 'sold_out_potential', label: 'Sold Out Potential', type: 'text', required: false },
    { name: 'remarks', label: 'Remarks', type: 'textarea', required: false },
    { name: 'description', label: 'Description', type: 'textarea', required: false }
  ];

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      console.log('📅 Event form submission started:', eventFormData);

      if (!eventFormData.event_name) {
        alert('Please enter an event name');
        return;
      }

      const submitData = {
        ...eventFormData,
        title: eventFormData.event_name, // Sync title with event_name
        created_by: window.user?.name || 'Unknown User',
        created_date: new Date().toISOString()
      };

      if (currentEvent && currentEvent.id) {
        // Update existing event
        const response = await apiCall(`/events/${currentEvent.id}`, {
          method: 'PUT',
          body: JSON.stringify(submitData)
        });
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        alert('✅ Event updated successfully!');
      } else {
        // Create new event
        const response = await apiCall('/events', {
          method: 'POST',
          body: JSON.stringify(submitData)
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

  // Helper function to render form fields (your pattern)
  const renderFormFields = () => {
    return React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
      eventFormFields.map(field => {
        if (field.type === 'textarea') {
          return React.createElement('div', { key: field.name, className: 'md:col-span-2' },
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 
              field.label + (field.required ? ' *' : '')
            ),
            React.createElement('textarea', {
              value: eventFormData[field.name] || '',
              onChange: (e) => setEventFormData({...eventFormData, [field.name]: e.target.value}),
              className: 'w-full p-2 border border-gray-300 rounded-lg',
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
              className: 'w-full p-2 border border-gray-300 rounded-lg',
              required: field.required
            },
              React.createElement('option', { value: '' }, `Select ${field.label}`),
              ...field.options.map(option =>
                React.createElement('option', { key: option, value: option }, option)
              )
            )
          );
        } else if (field.type === 'checkbox') {
          return React.createElement('div', { key: field.name, className: 'flex items-center' },
            React.createElement('input', {
              type: 'checkbox',
              checked: eventFormData[field.name] || false,
              onChange: (e) => setEventFormData({...eventFormData, [field.name]: e.target.checked}),
              className: 'mr-2',
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
              className: 'w-full p-2 border border-gray-300 rounded-lg',
              required: field.required,
              placeholder: field.placeholder || ''
            })
          );
        }
      })
    );
  };

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: () => setShowEventForm(false)
  },
    React.createElement('div', {
      className: 'bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto',
      onClick: (e) => e.stopPropagation()
    },
      React.createElement('form', { onSubmit: handleEventSubmit, className: 'p-6' },
        React.createElement('div', { className: 'flex justify-between items-center mb-6' },
          React.createElement('h2', { className: 'text-2xl font-bold' }, 
            currentEvent ? `Edit Event: ${currentEvent.event_name || currentEvent.title}` : 'Add New Event'
          ),
          React.createElement('button', {
            type: 'button',
            onClick: () => setShowEventForm(false),
            className: 'text-gray-400 hover:text-gray-600 text-2xl'
          }, '✕')
        ),
        renderFormFields(),
        React.createElement('div', { className: 'flex justify-end space-x-3 mt-6' },
          React.createElement('button', {
            type: 'button',
            onClick: () => setShowEventForm(false),
            className: 'px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50'
          }, 'Cancel'),
          React.createElement('button', {
            type: 'submit',
            disabled: loading,
            className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50'
          }, loading ? 'Saving...' : 'Save Event')
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
    setCurrentEvent = window.setCurrentEvent || (() => {})
  } = window;

  if (!showEventDetail || !currentEvent) return null;

  // Priority styles helper (from your production.html)
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

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',
    style: { backdropFilter: 'blur(4px)' },
    onClick: (e) => {
      if (e.target === e.currentTarget) setShowEventDetail(false);
    }
  },
    React.createElement('div', {
      className: 'bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto shadow-2xl',
      onClick: (e) => e.stopPropagation()
    },
      React.createElement('div', {
        className: `p-6 border-b ${getPriorityStyles(currentEvent.priority)}`
      },
        React.createElement('div', { className: 'flex justify-between items-start' },
          React.createElement('div', { className: 'flex-1' },
            React.createElement('div', { className: 'flex items-center gap-3 mb-2' },
              React.createElement('h2', { className: 'text-2xl font-bold' },
                currentEvent.event_name || currentEvent.title
              ),
              React.createElement('span', {
                className: `px-3 py-1 text-sm font-semibold rounded-full ${getPriorityBadgeColor(currentEvent.priority)}`
              }, currentEvent.priority || 'N/A')
            ),
            React.createElement('p', { className: 'text-sm opacity-75' },
              `${currentEvent.sport_type || currentEvent.category || 'Event'} • ${currentEvent.geography || 'Location TBD'}`
            )
          ),
          React.createElement('button', {
            onClick: () => setShowEventDetail(false),
            className: 'text-gray-500 hover:text-gray-700 text-2xl p-2 rounded-lg hover:bg-gray-100'
          }, '✕')
        )
      ),
      React.createElement('div', { className: 'p-6 grid md:grid-cols-2 gap-6' },
        React.createElement('div', { className: 'space-y-6' },
          React.createElement('div', null,
            React.createElement('h3', { className: 'text-lg font-semibold mb-3 flex items-center' },
              React.createElement('span', { className: 'mr-2' }, '📅'),
              'Date & Time'
            ),
            React.createElement('div', { className: 'space-y-2 text-sm bg-gray-50 p-4 rounded-lg' },
              React.createElement('div', { className: 'flex justify-between' },
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'Start Date:'),
                React.createElement('span', { className: 'text-gray-900' },
                  new Date(currentEvent.start_date || currentEvent.date).toLocaleDateString()
                )
              ),
              React.createElement('div', { className: 'flex justify-between' },
                React.createElement('span', { className: 'font-medium text-gray-700' }, 'End Date:'),
                React.createElement('span', { className: 'text-gray-900' },
                  currentEvent.end_date ? 
                    new Date(currentEvent.end_date).toLocaleDateString() : 
                    'Same day'
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
          React.createElement('div', null,
            React.createElement('h3', { className: 'text-lg font-semibold mb-3 flex items-center' },
              React.createElement('span', { className: 'mr-2' }, '🏟️'),
              'Venue & Location'
            ),
            React.createElement('div', { className: 'bg-gray-50 p-4 rounded-lg' },
              React.createElement('p', { className: 'text-gray-900 font-medium' }, currentEvent.venue || 'TBD'),
              React.createElement('p', { className: 'text-gray-600 text-sm' }, currentEvent.geography || 'Location TBD')
            )
          )
        ),
        React.createElement('div', { className: 'space-y-6' },
          currentEvent.ticket_available !== undefined && React.createElement('div', null,
            React.createElement('h3', { className: 'text-lg font-semibold mb-3 flex items-center' },
              React.createElement('span', { className: 'mr-2' }, '🎫'),
              'Ticket Status'
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
          ),
          currentEvent.remarks && React.createElement('div', null,
            React.createElement('h3', { className: 'text-lg font-semibold mb-3 flex items-center' },
              React.createElement('span', { className: 'mr-2' }, '📝'),
              'Remarks'
            ),
            React.createElement('div', { className: 'bg-gray-50 p-4 rounded-lg border border-gray-200' },
              React.createElement('p', { className: 'text-gray-700 text-sm' },
                currentEvent.remarks
              )
            )
          ),
          currentEvent.description && React.createElement('div', null,
            React.createElement('h3', { className: 'text-lg font-semibold mb-3 flex items-center' },
              React.createElement('span', { className: 'mr-2' }, '📝'),
              'Description'
            ),
            React.createElement('div', { className: 'bg-gray-50 p-4 rounded-lg' },
              React.createElement('p', { className: 'text-gray-700 text-sm' },
                currentEvent.description
              )
            )
          )
        )
      ),
      React.createElement('div', { className: 'px-6 pb-6 flex flex-wrap gap-3' },
        React.createElement('button', {
          onClick: () => {
            setEventFormData({
              ...currentEvent,
              event_name: currentEvent.event_name || currentEvent.title,
              start_date: currentEvent.start_date || currentEvent.date,
              start_time: currentEvent.start_time || currentEvent.time,
              venue: currentEvent.venue,
              sport_type: currentEvent.sport_type || currentEvent.category,
              priority: currentEvent.priority,
              status: currentEvent.status,
              description: currentEvent.description,
              fantopark_package: currentEvent.fantopark_package
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
            // Pre-fill form data with event information for creating inventory
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
          onClick: () => setShowEventDetail(false),
          className: 'px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors'
        }, 'Close')
      )
    )
  );
};

// ===== ENHANCED STATE SETTERS FOR EVENT FORM DATA =====
// Add to simplified-app-component.js if not already present

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

console.log('✅ Event Modal Components loaded successfully with exact production.html pattern');
