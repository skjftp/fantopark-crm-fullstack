// Sports Calendar Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

// Main Sports Calendar Content Function
window.renderSportsCalendarContent = () => {
  const filteredEvents = sportsEvents.filter(event => {
    const eventDate = new Date(event.date || event.start_date);
    const selectedMonth = selectedDate.getMonth();
    const selectedYear = selectedDate.getFullYear();

    // Apply filters
    let passesFilter = true;

    // Date filter for month view
    if (calendarView === 'month') {
      passesFilter = eventDate.getMonth() === selectedMonth && eventDate.getFullYear() === selectedYear;
    }

    // Geography filter
    if (calendarFilters.geography && passesFilter) {
      passesFilter = event.geography === calendarFilters.geography;
    }

    // Sport type filter
    if (calendarFilters.sport_type && passesFilter) {
      passesFilter = event.sport_type === calendarFilters.sport_type || event.category === calendarFilters.sport_type;
    }

    // Priority filter
    if (calendarFilters.priority && passesFilter) {
      passesFilter = event.priority === calendarFilters.priority;
    }

    return passesFilter;
  });

  return React.createElement('div', { className: 'space-y-6' },
    // Header
    React.createElement('div', { className: 'flex justify-between items-center' },
      React.createElement('div', null,
        React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' }, '📅 Sports Calendar'),
        React.createElement('p', { className: 'text-gray-600 dark:text-gray-400 mt-1' }, 'Manage your sporting events with advanced filters and Excel integration'),
        React.createElement('div', { className: 'flex items-center gap-4 mt-3' },
          React.createElement('span', { className: 'text-sm font-medium text-gray-700' }, 'Priority Legend:'),
          React.createElement('div', { className: 'flex items-center gap-1' },
            React.createElement('div', { className: 'w-3 h-3 bg-red-500 rounded' }),
            React.createElement('span', { className: 'text-xs' }, 'P1 High')
          ),
          React.createElement('div', { className: 'flex items-center gap-1' },
            React.createElement('div', { className: 'w-3 h-3 bg-yellow-500 rounded' }),
            React.createElement('span', { className: 'text-xs' }, 'P2 Medium')
          ),
          React.createElement('div', { className: 'flex items-center gap-1' },
            React.createElement('div', { className: 'w-3 h-3 bg-green-500 rounded' }),
            React.createElement('span', { className: 'text-xs' }, 'P3 Low')
          )
        ),
        React.createElement('div', { className: 'flex items-center mt-2 text-sm' },
          React.createElement('span', { 
            className: `px-2 py-1 rounded-full text-xs ${sportsEvents.length > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`
          }, sportsEvents.length > 0 ? `${filteredEvents.length}/${sportsEvents.length} Events` : 'Loading Events...'),
          React.createElement('button', {
            onClick: fetchAllEvents,
            disabled: loading,
            className: 'ml-3 text-blue-600 hover:text-blue-800 text-sm underline disabled:opacity-50'
          }, loading ? 'Refreshing...' : '🔄 Refresh Events')
        )
      ),
      React.createElement('div', { className: 'flex flex-wrap gap-2' },
        React.createElement('button', {
          onClick: () => setShowEventForm(true),
          className: 'bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2'
        }, 
          React.createElement('span', null, '➕'),
          'Add Event'
        ),
        React.createElement('button', {
          onClick: window.exportEventsToExcel,
          className: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2'
        }, 
          React.createElement('span', null, '📥'),
          'Export Excel'
        ),
        React.createElement('button', {
          onClick: () => setShowImportModal(true),
          className: 'bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2'
        }, 
          React.createElement('span', null, '📤'),
          'Import Excel'
        )
      )
    ),

    // Calendar Filters
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4' },
      React.createElement('h3', { className: 'text-lg font-semibold mb-3' }, '🔍 Filters'),
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-4' },
        // Geography Filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Geography'),
          React.createElement('select', {
            value: calendarFilters.geography || '',
            onChange: (e) => setCalendarFilters({...calendarFilters, geography: e.target.value}),
            className: 'w-full p-2 border border-gray-300 rounded-lg'
          },
            React.createElement('option', { value: '' }, 'All Locations'),
            React.createElement('option', { value: 'India' }, 'India'),
            React.createElement('option', { value: 'UAE - Dubai' }, 'UAE - Dubai'),
            React.createElement('option', { value: 'UAE - Abu Dhabi' }, 'UAE - Abu Dhabi'),
            React.createElement('option', { value: 'UK' }, 'UK'),
            React.createElement('option', { value: 'USA' }, 'USA'),
            React.createElement('option', { value: 'Australia' }, 'Australia')
          )
        ),
        // Sport Type Filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Sport Type'),
          React.createElement('select', {
            value: calendarFilters.sport_type || '',
            onChange: (e) => setCalendarFilters({...calendarFilters, sport_type: e.target.value}),
            className: 'w-full p-2 border border-gray-300 rounded-lg'
          },
            React.createElement('option', { value: '' }, 'All Sports'),
            React.createElement('option', { value: 'Cricket' }, 'Cricket'),
            React.createElement('option', { value: 'Football' }, 'Football'),
            React.createElement('option', { value: 'Tennis' }, 'Tennis'),
            React.createElement('option', { value: 'Golf' }, 'Golf'),
            React.createElement('option', { value: 'Formula 1' }, 'Formula 1'),
            React.createElement('option', { value: 'Basketball' }, 'Basketball')
          )
        ),
        // Priority Filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Priority'),
          React.createElement('select', {
            value: calendarFilters.priority || '',
            onChange: (e) => setCalendarFilters({...calendarFilters, priority: e.target.value}),
            className: 'w-full p-2 border border-gray-300 rounded-lg'
          },
            React.createElement('option', { value: '' }, 'All Priorities'),
            React.createElement('option', { value: 'P1' }, 'P1 - High'),
            React.createElement('option', { value: 'P2' }, 'P2 - Medium'),
            React.createElement('option', { value: 'P3' }, 'P3 - Low')
          )
        ),
        // Clear Filters Button
        React.createElement('div', { className: 'flex items-end' },
          React.createElement('button', {
            onClick: () => setCalendarFilters({}),
            className: 'w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg'
          }, 'Clear Filters')
        )
      )
    ),
                               
    // Calendar Controls
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-4' },
      React.createElement('div', { className: 'flex justify-between items-center mb-4' },
        React.createElement('div', { className: 'flex items-center space-x-4' },
          React.createElement('button', {
            onClick: () => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() - 1);
              setSelectedDate(newDate);
            },
            className: 'p-2 hover:bg-gray-100 rounded'
          }, '←'),
          React.createElement('h2', { className: 'text-xl font-semibold' }, 
            selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          ),
          React.createElement('button', {
            onClick: () => {
              const newDate = new Date(selectedDate);
              newDate.setMonth(newDate.getMonth() + 1);
              setSelectedDate(newDate);
            },
            className: 'p-2 hover:bg-gray-100 rounded'
          }, '→')
        ),
        React.createElement('div', { className: 'flex space-x-2' },
          ['month', 'list'].map(view =>
            React.createElement('button', {
              key: view,
              onClick: () => setCalendarView(view),
              className: `px-3 py-1 rounded text-sm ${calendarView === view ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`
            }, view.charAt(0).toUpperCase() + view.slice(1))
          )
        )
      ),

      // Events Display
      calendarView === 'month' ? window.renderMonthView(filteredEvents) : window.renderListView(filteredEvents),

      // Import Modal
      window.renderImportModal()
    )
  );
};

// Month View Function
window.renderMonthView = (events) => {
  const today = new Date();
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const days = [];

  // Empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(React.createElement('div', { key: `empty-${i}`, className: 'p-2 h-24' }));
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month, day);
    const dayEvents = events.filter(event => {
      const eventStartDate = new Date(event.date || event.start_date);
      const eventEndDate = event.end_date ? new Date(event.end_date) : eventStartDate;
      return eventStartDate.getDate() <= day && (eventEndDate.getDate() >= day || !event.end_date);
    });

    const isToday = currentDate.toDateString() === today.toDateString();

    days.push(
      React.createElement('div', {
        key: day,
        className: `p-2 h-24 border border-gray-200 ${isToday ? 'bg-blue-50' : 'bg-white'} hover:bg-gray-50 cursor-pointer`,
        onClick: () => {
          if (dayEvents.length > 0) {
            setCurrentEvent(dayEvents[0]);
            setShowEventDetail(true);
          }
        }
      },
        React.createElement('div', { className: `text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}` }, day),
        dayEvents.map(event =>
          React.createElement('div', {
            key: event.id,
            className: `text-xs p-1 mt-1 rounded truncate cursor-pointer ${window.getPriorityStyles(event.priority)}`,
            onClick: (e) => {
              e.stopPropagation();
              setCurrentEvent(event);
              setShowEventDetail(true);
            }
          }, event.title)
        )
      )
    );
  }

  return React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow' },
    React.createElement('div', { className: 'grid grid-cols-7 gap-0 border-b' },
      ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day =>
        React.createElement('div', {
          key: day,
          className: 'p-3 text-center font-medium text-gray-600 bg-gray-50'
        }, day)
      )
    ),
    React.createElement('div', { className: 'grid grid-cols-7 gap-0' }, days)
  );
};

// List View Function
window.renderListView = (events) => {
  const sortedEvents = events.sort((a, b) => new Date(a.date || a.start_date) - new Date(b.date || b.start_date));

  return React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow' },
    React.createElement('div', { className: 'overflow-x-auto' },
      React.createElement('table', { className: 'w-full' },
        React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-700' },
          React.createElement('tr', null,
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Event'),
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Date & Time'),
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Venue'),
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Sport'),
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Priority'),
            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
          )
        ),
        React.createElement('tbody', { className: 'divide-y divide-gray-200 dark:divide-gray-700' },
          sortedEvents.length > 0 ?
            sortedEvents.map(event => 
              React.createElement('tr', { 
                key: event.id,
                className: 'hover:bg-gray-50 cursor-pointer',
                onClick: () => {
                  setCurrentEvent(event);
                  setShowEventDetail(true);
                }
              },
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                  React.createElement('div', { className: 'flex items-center' },
                    React.createElement('div', { className: `w-3 h-3 rounded mr-3 ${window.getPriorityStyles(event.priority).includes('bg-red') ? 'bg-red-500' : window.getPriorityStyles(event.priority).includes('bg-yellow') ? 'bg-yellow-500' : 'bg-green-500'}` }),
                    React.createElement('div', null,
                      React.createElement('div', { className: 'text-sm font-medium text-gray-900' }, event.title || event.event_name),
                      React.createElement('div', { className: 'text-sm text-gray-500' }, event.sport_type || event.category)
                    )
                  )
                ),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900' },
                  new Date(event.date || event.start_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }),
                  event.start_time && React.createElement('div', { className: 'text-xs text-gray-500' }, event.start_time)
                ),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900' }, event.venue || '-'),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900' }, event.sport_type || event.category || '-'),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                  React.createElement('span', { 
                    className: `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      event.priority === 'P1' ? 'bg-red-100 text-red-800' :
                      event.priority === 'P2' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`
                  }, event.priority || 'P3')
                ),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm font-medium' },
                  React.createElement('button', {
                    onClick: (e) => {
                      e.stopPropagation();
                      setCurrentEvent(event);
                      setShowEventForm(true);
                    },
                    className: 'text-indigo-600 hover:text-indigo-900 mr-4'
                  }, 'Edit'),
                  React.createElement('button', {
                    onClick: (e) => {
                      e.stopPropagation();
                      if (confirm('Delete this event?')) {
                        window.deleteEvent(event.id);
                      }
                    },
                    className: 'text-red-600 hover:text-red-900'
                  }, 'Delete')
                )
              )
            ) :
            React.createElement('tr', null,
              React.createElement('td', { 
                className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center',
                colSpan: 6
              }, 'No events found for the selected filters')
            )
        )
      )
    )
  );
};

// Import Modal Function
window.renderImportModal = () => {
  if (!showImportModal) return null;

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: () => setShowImportModal(false)
  },
    React.createElement('div', {
      className: 'bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6',
      onClick: (e) => e.stopPropagation()
    },
      React.createElement('h2', { className: 'text-2xl font-bold mb-4' }, 'Import Events from Excel'),
      React.createElement('div', { className: 'mb-4' },
        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Select Excel File'),
        React.createElement('input', {
          type: 'file',
          accept: '.xlsx,.xls',
          onChange: (e) => {
            const file = e.target.files[0];
            if (file) {
              window.importEventsFromExcel(file);
            }
          },
          className: 'w-full p-2 border border-gray-300 rounded-lg'
        })
      ),
      React.createElement('div', { className: 'text-sm text-gray-600 mb-4' },
        React.createElement('p', null, 'Expected columns:'),
        React.createElement('ul', { className: 'list-disc list-inside text-xs mt-1' },
          React.createElement('li', null, 'Event Name'),
          React.createElement('li', null, 'Event Type'),
          React.createElement('li', null, 'Sport Type'),
          React.createElement('li', null, 'Geography'),
          React.createElement('li', null, 'Start Date'),
          React.createElement('li', null, 'End Date'),
          React.createElement('li', null, 'Start Time'),
          React.createElement('li', null, 'End Time'),
          React.createElement('li', null, 'Venue'),
          React.createElement('li', null, 'Official Ticketing Partners'),
          React.createElement('li', null, 'Priority')
        )
      ),
      React.createElement('div', { className: 'flex justify-end space-x-2' },
        React.createElement('button', {
          onClick: () => setShowImportModal(false),
          className: 'px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50'
        }, 'Cancel')
      )
    )
  );
};

// Export Events to Excel Function
window.exportEventsToExcel = async () => {
  try {
    const params = new URLSearchParams();
    if (calendarFilters.geography) params.append('geography', calendarFilters.geography);
    if (calendarFilters.sport_type) params.append('sport_type', calendarFilters.sport_type);
    if (calendarFilters.priority) params.append('priority', calendarFilters.priority);
    params.append('sort_by', 'date'); // Default sort by date

    const response = await fetch(`${API_URL}/events/export/excel?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('crm_auth_token')}`
      }
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `events_calendar_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      alert('Events exported successfully!');
    } else {
      throw new Error('Export failed');
    }
  } catch (error) {
    console.error('Export error:', error);
    alert('Failed to export events: ' + error.message);
  }
};

// Import Events from Excel Function
window.importEventsFromExcel = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/events/import/excel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('crm_auth_token')}`
      },
      body: formData
    });

    const result = await response.json();
    
    if (response.ok) {
      alert(`Successfully imported ${result.imported_count} events!`);
      setShowImportModal(false);
      fetchAllEvents(); // Refresh the events
    } else {
      throw new Error(result.message || 'Import failed');
    }
  } catch (error) {
    console.error('Import error:', error);
    alert('Failed to import events: ' + error.message);
  }
};

// Priority Styles Helper Function
window.getPriorityStyles = (priority) => {
  switch (priority) {
    case 'P1':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'P2':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'P3':
    default:
      return 'bg-green-100 text-green-800 border-green-200';
  }
};

console.log('✅ Sports Calendar component loaded successfully');
