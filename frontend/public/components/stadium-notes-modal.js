// Stadium Notes Modal Component for FanToPark CRM
// Displays detailed notes and stadium images in a modal window

window.renderStadiumNotesModal = () => {
  const { selectedStadiumForNotes, showStadiumNotesModal } = window.appState || {};
  
  if (!showStadiumNotesModal || !selectedStadiumForNotes) return null;

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',
    onClick: (e) => {
      if (e.target === e.currentTarget) {
        window.closeStadiumNotesModal();
      }
    }
  },
    React.createElement('div', {
      className: 'bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col'
    },
      // Header
      React.createElement('div', { 
        className: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center' 
      },
        React.createElement('div', null,
          React.createElement('h2', { className: 'text-2xl font-bold' }, selectedStadiumForNotes.name),
          React.createElement('p', { className: 'text-blue-100 mt-1' }, 
            `${selectedStadiumForNotes.city}, ${selectedStadiumForNotes.state || selectedStadiumForNotes.country}`
          )
        ),
        React.createElement('button', {
          onClick: window.closeStadiumNotesModal,
          className: 'text-white hover:text-gray-200 text-3xl leading-none'
        }, '×')
      ),

      // Content Area
      React.createElement('div', { 
        className: 'flex-1 overflow-y-auto p-6' 
      },
        // Stadium Image Section
        selectedStadiumForNotes.image_url && React.createElement('div', { 
          className: 'mb-6' 
        },
          React.createElement('img', {
            src: selectedStadiumForNotes.image_url,
            alt: `${selectedStadiumForNotes.name} stadium view`,
            className: 'w-full h-auto max-h-96 object-cover rounded-lg shadow-lg',
            onError: (e) => {
              e.target.style.display = 'none';
            }
          })
        ),

        // Stadium Details Grid
        React.createElement('div', { 
          className: 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-6' 
        },
          React.createElement('div', { 
            className: 'bg-gray-50 dark:bg-gray-700 p-4 rounded-lg' 
          },
            React.createElement('h4', { 
              className: 'text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1' 
            }, 'Sport Type'),
            React.createElement('p', { 
              className: 'text-gray-900 dark:text-white font-medium' 
            }, selectedStadiumForNotes.sport_type || 'Not specified')
          ),
          React.createElement('div', { 
            className: 'bg-gray-50 dark:bg-gray-700 p-4 rounded-lg' 
          },
            React.createElement('h4', { 
              className: 'text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1' 
            }, 'Capacity'),
            React.createElement('p', { 
              className: 'text-gray-900 dark:text-white font-medium' 
            }, selectedStadiumForNotes.capacity ? selectedStadiumForNotes.capacity.toLocaleString() : 'Not specified')
          ),
          selectedStadiumForNotes.opened_year && React.createElement('div', { 
            className: 'bg-gray-50 dark:bg-gray-700 p-4 rounded-lg' 
          },
            React.createElement('h4', { 
              className: 'text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1' 
            }, 'Opened Year'),
            React.createElement('p', { 
              className: 'text-gray-900 dark:text-white font-medium' 
            }, selectedStadiumForNotes.opened_year)
          ),
          selectedStadiumForNotes.nickname && React.createElement('div', { 
            className: 'bg-gray-50 dark:bg-gray-700 p-4 rounded-lg' 
          },
            React.createElement('h4', { 
              className: 'text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1' 
            }, 'Nickname'),
            React.createElement('p', { 
              className: 'text-gray-900 dark:text-white font-medium' 
            }, selectedStadiumForNotes.nickname)
          )
        ),

        // Notes Section
        React.createElement('div', { 
          className: 'bg-blue-50 dark:bg-gray-700 p-6 rounded-lg' 
        },
          React.createElement('h3', { 
            className: 'text-lg font-semibold text-gray-900 dark:text-white mb-3' 
          }, '📝 Stadium Notes & Experience Details'),
          React.createElement('div', { 
            className: 'text-gray-700 dark:text-gray-300 whitespace-pre-wrap' 
          }, 
            selectedStadiumForNotes.notes || 
            React.createElement('p', { 
              className: 'italic text-gray-500' 
            }, 'No notes available for this stadium. Click the edit button to add notes about the stadium experience, including details about specific stands, sun exposure, facilities, or any other relevant information for sales teams.')
          )
        )
      ),

      // Footer with Actions
      React.createElement('div', { 
        className: 'bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end gap-3' 
      },
        window.hasPermission && window.hasPermission('stadiums', 'write') && 
        React.createElement('button', {
          onClick: () => {
            window.closeStadiumNotesModal();
            window.openStadiumForm(selectedStadiumForNotes);
