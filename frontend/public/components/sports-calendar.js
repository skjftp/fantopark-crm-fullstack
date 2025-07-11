// Sports Calendar Component for FanToPark CRM - FIXED WITH INTEGRATION PATTERN
// ✅ PATTERN APPLIED: State extraction, function references, enhanced fallbacks

// Main Sports Calendar Content Function - FIXED WITH INTEGRATION PATTERN
window.renderSportsCalendarContent = () => {
  // ✅ STEP 1: Extract state with fallbacks (CRITICAL PATTERN)
  const {
    sportsEvents = window.sportsEvents || [],
    selectedDate = window.selectedDate || new Date(),
    calendarView = window.calendarView || "month",
    calendarFilters = window.calendarFilters || {},
    showEventForm = window.appState?.showEventForm || false,
    showImportModal = window.appState?.showImportModal || false,
    currentEvent = window.appState?.currentEvent || null,
    showEventDetail = window.appState?.showEventDetail || false,
    loading = window.loading || false
  } = window.appState || {};

  // ✅ STEP 2: Extract functions with enhanced fallbacks (CRITICAL PATTERN)
  const {
    setShowEventForm = window.setShowEventForm || ((show) => {
      console.log("🔍 setShowEventForm called:", show);
      window.showEventForm = show;
      window.appState.showEventForm = show;
    }),
    setShowImportModal = window.setShowImportModal || ((show) => {
      console.log("🔍 setShowImportModal called:", show);
      window.showImportModal = show;
      window.appState.showImportModal = show;
    }),
    setCurrentEvent = window.setCurrentEvent || ((event) => {
      console.log("🔍 setCurrentEvent called:", event);
      window.currentEvent = event;
      window.appState.currentEvent = event;
    }),
    setShowEventDetail = window.setShowEventDetail || ((show) => {
      console.log("🔍 setShowEventDetail called:", show);
      window.showEventDetail = show;
      window.appState.showEventDetail = show;
    }),
    setSelectedDate = window.setSelectedDate || ((date) => {
      console.log("🔍 setSelectedDate called:", date);
      window.selectedDate = date;
      window.appState.selectedDate = date;
    }),
    setCalendarView = window.setCalendarView || ((view) => {
      console.log("🔍 setCalendarView called:", view);
      window.calendarView = view;
      window.appState.calendarView = view;
    }),
    setCalendarFilters = window.setCalendarFilters || ((filters) => {
      console.log("🔍 setCalendarFilters called:", filters);
      window.calendarFilters = { ...window.calendarFilters, ...filters };
      window.appState.calendarFilters = window.calendarFilters;
    }),
    fetchAllEvents = window.fetchAllEvents || (() => {
      console.log("🔍 fetchAllEvents called");
      console.warn("⚠️ fetchAllEvents not implemented");
    }),
    exportEventsToExcel = window.exportEventsToExcel || (() => {
      console.log("🔍 exportEventsToExcel called");
      console.warn("⚠️ exportEventsToExcel not implemented");
    }),
    deleteEvent = window.deleteEvent || ((eventId) => {
      console.log("🔍 deleteEvent called:", eventId);
      console.warn("⚠️ deleteEvent not implemented");
    })
  } = window;

  // ✅ STEP 3: Add debug logging (CRITICAL FOR DEBUGGING)
  console.log('🔍 SPORTS CALENDAR DEBUG:');
  console.log('🔍 sportsEvents count:', sportsEvents.length);
  console.log('🔍 calendarView:', calendarView);
  console.log('🔍 showEventForm:', showEventForm);
  console.log('🔍 functions available:', {
    setShowEventForm: typeof setShowEventForm === 'function',
    fetchAllEvents: typeof fetchAllEvents === 'function',
    exportEventsToExcel: typeof exportEventsToExcel === 'function'
  });

  // Filter events with enhanced error handling
  const filteredEvents = (sportsEvents || []).filter(event => {
    try {
      const eventDate = new Date(event.date || event.start_date);
      const selectedMonth = selectedDate.getMonth();
      const selectedYear = selectedDate.getFullYear();

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
    } catch (error) {
      console.error('Error filtering event:', event, error);
      return false;
    }
  });

  return React.createElement('div', { className: 'space-y-6' },
    // Header with enhanced click handlers
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
            className: `px-2 py-1 rounded-full text-xs ${(sportsEvents || []).length > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`
          }, (sportsEvents || []).length > 0 ? `${filteredEvents.length}/${(sportsEvents || []).length} Events` : 'Loading Events...'),
          React.createElement('button', {
            onClick: () => {
              console.log('🔍 Refresh button clicked');
              fetchAllEvents();
            },
            disabled: loading,
            className: 'ml-3 text-blue-600 hover:text-blue-800 text-sm underline disabled:opacity-50'
          }, loading ? 'Refreshing...' : '🔄 Refresh Events')
        )
      ),
      React.createElement('div', { className: 'flex flex-wrap gap-2' },
        React.createElement('button', {
          onClick: () => {
            console.log('🔍 Add Event button clicked');
            setShowEventForm(true);
          },
          className: 'bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2'
        }, 
          React.createElement('span', null, '➕'),
          'Add Event'
        ),
        React.createElement('button', {
          onClick: () => {
            console.log('🔍 Export Excel button clicked');
            exportEventsToExcel();
          },
          className: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2'
        }, 
          React.createElement('span', null, '📥'),
          'Export Excel'
        ),
        React.createElement('button', {
          onClick: () => {
            console.log('🔍 Import Excel button clicked');
            setShowImportModal(true);
          },
          className: 'bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2'
        }, 
          React.createElement('span', null, '📤'),
          'Import Excel'
        )
      )
    ),

    // Calendar Filters with enhanced handlers
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4' },
      React.createElement('h3', { className: 'text-lg font-semibold mb-3' }, '🔍 Filters'),
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-4' },
        // Geography Filter
        React.createElement('div', null,
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Geography'),
          React.createElement('select', {
            value: calendarFilters.geography || '',
            onChange: (e) => {
              console.log('🔍 Geography filter changed:', e.target.value);
              setCalendarFilters({geography: e.target.value});
            },
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
            onChange: (e) => {
              console.log('🔍 Sport type filter changed:', e.target.value);
              setCalendarFilters({sport_type: e.target.value});
            },
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
            onChange: (e) => {
              console.log('🔍 Priority filter changed:', e.target.value);
              setCalendarFilters({priority: e.target.value});
            },
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
            onClick: () => {
              console.log('🔍 Clear filters clicked');
              setCalendarFilters({});
            },
            className: 'w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg'
          }, 'Clear Filters')
        )
      )
    ),
                               
    // Calendar Controls with enhanced navigation
    React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-4' },
      React.createElement('div', { className: 'flex justify-between items-center mb-4' },
        React.createElement('div', { className: 'flex items-center space-x-4' },
          React.createElement('button', {
            onClick: () => {
              console.log('🔍 Previous month clicked');
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
              console.log('🔍 Next month clicked');
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
              onClick: () => {
                console.log('🔍 View changed to:', view);
                setCalendarView(view);
              },
              className: `px-3 py-1 rounded text-sm ${calendarView === view ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`
            }, view.charAt(0).toUpperCase() + view.slice(1))
          )
        )
      ),

      // Events Display with enhanced event handlers
      calendarView === 'month' ? 
        window.renderMonthView ? window.renderMonthView(filteredEvents) : 
        React.createElement('div', { className: 'text-center py-8' }, 'Month view implementation needed') :
        window.renderListView ? window.renderListView(filteredEvents) :
        React.createElement('div', { className: 'text-center py-8' }, 'List view implementation needed'),

      // Import Modal
      showImportModal && window.renderImportModal ? window.renderImportModal() : null
    )
  );
};

// ✅ ENHANCED Month View Function with proper event handling
window.renderMonthView = (events) => {
  const today = new Date();
  const selectedDate = window.selectedDate || new Date();
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

  // Days of the month with enhanced event handling
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month, day);
    const dayEvents = events.filter(event => {
      try {
        const eventStartDate = new Date(event.date || event.start_date);
        const eventEndDate = event.end_date ? new Date(event.end_date) : eventStartDate;
        return eventStartDate.getDate() <= day && (eventEndDate.getDate() >= day || !event.end_date);
      } catch (error) {
        console.error('Error filtering day events:', error);
        return false;
      }
    });

    const isToday = currentDate.toDateString() === today.toDateString();

    days.push(
      React.createElement('div', {
        key: day,
        className: `p-2 h-24 border border-gray-200 ${isToday ? 'bg-blue-50' : 'bg-white'} hover:bg-gray-50 cursor-pointer`,
        onClick: () => {
          console.log('🔍 Day clicked:', day, 'events:', dayEvents.length);
          if (dayEvents.length > 0) {
            const setCurrentEvent = window.setCurrentEvent || (() => {});
            const setShowEventDetail = window.setShowEventDetail || (() => {});
            setCurrentEvent(dayEvents[0]);
            setShowEventDetail(true);
          }
        }
      },
        React.createElement('div', { className: `text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}` }, day),
        dayEvents.map((event, index) =>
          React.createElement('div', {
            key: event.id || index,
            className: `text-xs p-1 mt-1 rounded truncate cursor-pointer ${window.getPriorityStyles ? window.getPriorityStyles(event.priority) : 'bg-blue-100 text-blue-800'}`,
            onClick: (e) => {
              e.stopPropagation();
              console.log('🔍 Event clicked:', event.title || event.event_name);
              const setCurrentEvent = window.setCurrentEvent || (() => {});
              const setShowEventDetail = window.setShowEventDetail || (() => {});
              setCurrentEvent(event);
              setShowEventDetail(true);
            }
          }, event.title || event.event_name || 'Unnamed Event')
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

// ✅ ENHANCED List View Function with proper event handling
window.renderListView = (events) => {
  const sortedEvents = events.sort((a, b) => {
    try {
      return new Date(a.date || a.start_date) - new Date(b.date || b.start_date);
    } catch (error) {
      console.error('Error sorting events:', error);
      return 0;
    }
  });

  const setCurrentEvent = window.setCurrentEvent || (() => {});
  const setShowEventDetail = window.setShowEventDetail || (() => {});
  const setShowEventForm = window.setShowEventForm || (() => {});
  const deleteEvent = window.deleteEvent || (() => {});

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
            sortedEvents.map((event, index) => 
              React.createElement('tr', { 
                key: event.id || index,
                className: 'hover:bg-gray-50 cursor-pointer',
                onClick: () => {
                  console.log('🔍 Table row clicked:', event.title || event.event_name);
                  setCurrentEvent(event);
                  setShowEventDetail(true);
                }
              },
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                  React.createElement('div', { className: 'flex items-center' },
                    React.createElement('div', { 
                      className: `w-3 h-3 rounded mr-3 ${
                        event.priority === 'P1' ? 'bg-red-500' :
                        event.priority === 'P2' ? 'bg-yellow-500' : 'bg-green-500'
                      }`
                    }),
                    React.createElement('div', null,
                      React.createElement('div', { className: 'text-sm font-medium text-gray-900' }, event.title || event.event_name || 'Unnamed Event'),
                      React.createElement('div', { className: 'text-sm text-gray-500' }, event.sport_type || event.category || 'Unknown')
                    )
                  )
                ),
                React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900' },
                  (() => {
                    try {
                      const date = new Date(event.date || event.start_date);
                      return date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      });
                    } catch (error) {
                      return 'Invalid Date';
                    }
                  })(),
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
                      console.log('🔍 Edit event clicked:', event.title || event.event_name);
                      setCurrentEvent(event);
                      setShowEventForm(true);
                    },
                    className: 'text-indigo-600 hover:text-indigo-900 mr-4'
                  }, 'Edit'),
                  React.createElement('button', {
                    onClick: (e) => {
                      e.stopPropagation();
                      console.log('🔍 Delete event clicked:', event.title || event.event_name);
                      if (confirm('Delete this event?')) {
                        deleteEvent(event.id);
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

// ✅ ENHANCED Import Modal Function
window.renderImportModal = () => {
  const showImportModal = window.appState?.showImportModal || false;
  const setShowImportModal = window.setShowImportModal || (() => {});
  const importEventsFromExcel = window.importEventsFromExcel || (() => {});

  if (!showImportModal) return null;

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
    onClick: () => {
      console.log('🔍 Import modal backdrop clicked');
      setShowImportModal(false);
    }
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
            console.log('🔍 File selected for import');
            const file = e.target.files[0];
            if (file) {
              importEventsFromExcel(file);
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
          onClick: () => {
            console.log('🔍 Import modal cancel clicked');
            setShowImportModal(false);
          },
          className: 'px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50'
        }, 'Cancel')
      )
    )
  );
};

// ✅ ENHANCED Helper Functions
window.getPriorityStyles = window.getPriorityStyles || ((priority) => {
  switch (priority) {
    case 'P1':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'P2':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'P3':
    default:
      return 'bg-green-100 text-green-800 border-green-200';
  }
});

console.log('✅ FIXED Sports Calendar component loaded successfully with integration pattern applied');
