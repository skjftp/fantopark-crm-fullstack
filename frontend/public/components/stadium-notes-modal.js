// Stadium Notes Modal Component for FanToPark CRM
// Displays detailed notes and stadium images in a modal window

// Enhanced Modal with Categorized Notes
window.renderStadiumNotesModal = () => {
  const { selectedStadiumForNotes, showStadiumNotesModal, showStadiumImageLightbox } = window.appState || {};
  
  if (!showStadiumNotesModal || !selectedStadiumForNotes) return null;

  const noteCategories = {
    tickets: { label: 'Ticket Information', icon: '🎫', color: 'blue' },
    hospitality: { label: 'Hospitality & Premium Areas', icon: '🥂', color: 'purple' },
    access: { label: 'Access & Transportation', icon: '🚗', color: 'green' },
    sun_weather: { label: 'Sun & Weather Exposure', icon: '☀️', color: 'yellow' },
    facilities: { label: 'Stadium Facilities', icon: '🏢', color: 'indigo' },
    restrictions: { label: 'Security & Restrictions', icon: '🔒', color: 'red' },
    nearby: { label: 'Nearby Amenities', icon: '🏨', color: 'teal' },
    technical: { label: 'Technical & AV Details', icon: '📺', color: 'gray' },
    special: { label: 'Special Considerations', icon: '♿', color: 'pink' }
  };

  const categorizedNotes = selectedStadiumForNotes.categorized_notes || {};
  const hasAnyNotes = Object.values(categorizedNotes).some(note => note && note.trim());

  return React.createElement(React.Fragment, null,
    // Main Modal
    React.createElement('div', {
      className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',
      onClick: (e) => {
        if (e.target === e.currentTarget) {
          window.closeStadiumNotesModal();
        }
      }
    },
      React.createElement('div', {
        className: 'bg-white dark:bg-gray-800 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col'
      },
        // Header with Stadium Info
        React.createElement('div', { 
          className: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6' 
        },
          React.createElement('div', { className: 'flex justify-between items-start' },
            React.createElement('div', null,
              React.createElement('h2', { className: 'text-2xl font-bold' }, selectedStadiumForNotes.name),
              React.createElement('p', { className: 'text-blue-100 mt-1' }, 
                `${selectedStadiumForNotes.city}, ${selectedStadiumForNotes.state || selectedStadiumForNotes.country}`
              ),
              React.createElement('div', { className: 'flex gap-4 mt-3 text-sm' },
                selectedStadiumForNotes.sport_type && React.createElement('span', { 
                  className: 'bg-blue-500 px-3 py-1 rounded-full' 
                }, selectedStadiumForNotes.sport_type),
                selectedStadiumForNotes.capacity && React.createElement('span', { 
                  className: 'bg-blue-500 px-3 py-1 rounded-full' 
                }, `Capacity: ${selectedStadiumForNotes.capacity.toLocaleString()}`),
                selectedStadiumForNotes.opened_year && React.createElement('span', { 
                  className: 'bg-blue-500 px-3 py-1 rounded-full' 
                }, `Est. ${selectedStadiumForNotes.opened_year}`)
              )
            ),
            React.createElement('button', {
              onClick: window.closeStadiumNotesModal,
              className: 'text-white hover:text-gray-200 text-3xl leading-none'
            }, '×')
          )
        ),

        // Content Area
        React.createElement('div', { 
          className: 'flex-1 overflow-y-auto' 
        },
          // Stadium Image - Now Clickable
          selectedStadiumForNotes.image_url && React.createElement('div', { 
            className: 'relative h-64 bg-gray-100 cursor-pointer group',
            onClick: () => window.openStadiumImageLightbox(selectedStadiumForNotes.image_url)
          },
            React.createElement('img', {
              src: selectedStadiumForNotes.image_url,
              alt: `${selectedStadiumForNotes.name} stadium view`,
              className: 'w-full h-full object-contain hover:opacity-90 transition-opacity',
              onError: (e) => {
                e.target.style.display = 'none';
              }
            }),
            React.createElement('div', { 
              className: 'absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20'
            },
              React.createElement('span', { 
                className: 'bg-white text-gray-800 px-4 py-2 rounded-lg shadow-lg font-medium'
              }, '🔍 Click to enlarge')
            )
          ),

          // Categorized Notes Grid
          React.createElement('div', { className: 'p-6' },
            hasAnyNotes ? 
              React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
                Object.entries(noteCategories).map(([key, category]) => {
                  const noteContent = categorizedNotes[key];
                  if (!noteContent || !noteContent.trim()) return null;

                  return React.createElement('div', { 
                    key: key,
                    className: `bg-${category.color}-50 dark:bg-gray-700 p-4 rounded-lg border border-${category.color}-200 dark:border-gray-600`
                  },
                    React.createElement('h4', { 
                      className: `text-lg font-semibold text-${category.color}-800 dark:text-${category.color}-300 mb-2 flex items-center gap-2` 
                    },
                      React.createElement('span', { className: 'text-xl' }, category.icon),
                      category.label
                    ),
                    React.createElement('div', { 
                      className: 'text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm' 
                    }, noteContent)
                  );
                }).filter(Boolean)
              ) :
              React.createElement('div', { 
                className: 'bg-gray-50 dark:bg-gray-700 p-8 rounded-lg text-center' 
              },
                React.createElement('p', { 
                  className: 'text-gray-500 dark:text-gray-400 mb-4' 
                }, 'No detailed notes have been added for this stadium yet.'),
                React.createElement('p', { 
                  className: 'text-sm text-gray-400' 
                }, 'Click "Edit Stadium Information" to add notes about tickets, hospitality, access, and more.')
              ),

            // Legacy Notes Section (if exists)
            selectedStadiumForNotes.notes && React.createElement('div', { 
              className: 'mt-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg' 
            },
              React.createElement('h4', { 
                className: 'text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2' 
              }, '📝 General Notes'),
              React.createElement('div', { 
                className: 'text-gray-700 dark:text-gray-300 whitespace-pre-wrap' 
              }, selectedStadiumForNotes.notes)
            )
          )
        ),

        // Footer with Actions
        React.createElement('div', { 
          className: 'bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-between items-center' 
        },
          React.createElement('div', { className: 'flex gap-2 text-sm' },
            selectedStadiumForNotes.website && React.createElement('a', {
              href: selectedStadiumForNotes.website,
              target: '_blank',
              className: 'text-blue-600 hover:text-blue-800 dark:text-blue-400'
            }, '🌐 Visit Website'),
            selectedStadiumForNotes.nickname && React.createElement('span', { 
              className: 'text-gray-500 dark:text-gray-400 italic' 
            }, `"${selectedStadiumForNotes.nickname}"`)
          ),
          React.createElement('div', { className: 'flex gap-3' },
            window.hasPermission && window.hasPermission('stadiums', 'write') && 
            React.createElement('button', {
              onClick: () => {
                window.closeStadiumNotesModal();
                window.openStadiumForm(selectedStadiumForNotes);
              },
              className: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'
            }, 'Edit Stadium Information'),
            React.createElement('button', {
              onClick: window.closeStadiumNotesModal,
              className: 'px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700'
            }, 'Close')
          )
        )
      )
    ),

    // Image Lightbox Modal
    showStadiumImageLightbox && React.createElement('div', {
      className: 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4',
      onClick: window.closeStadiumImageLightbox
    },
      React.createElement('div', { 
        className: 'relative max-w-full max-h-full'
      },
        React.createElement('img', {
          src: showStadiumImageLightbox,
          alt: 'Stadium view enlarged',
          className: 'max-w-full max-h-[90vh] object-contain',
          onClick: (e) => e.stopPropagation()
        }),
        React.createElement('button', {
          onClick: window.closeStadiumImageLightbox,
          className: 'absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70'
        }, '✕'),
        React.createElement('div', {
          className: 'absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded'
        }, 'Click anywhere to close')
      )
    )
  );
};

// Helper functions for stadium notes modal
window.openStadiumNotesModal = (stadium) => {
  window.appState.selectedStadiumForNotes = stadium;
  window.appState.showStadiumNotesModal = true;
  if (window.setSelectedStadiumForNotes) {
    window.setSelectedStadiumForNotes(stadium);
  }
  if (window.setShowStadiumNotesModal) {
    window.setShowStadiumNotesModal(true);
  }
};

window.closeStadiumNotesModal = () => {
  window.appState.selectedStadiumForNotes = null;
  window.appState.showStadiumNotesModal = false;
  window.appState.showStadiumImageLightbox = false;
  if (window.setSelectedStadiumForNotes) {
    window.setSelectedStadiumForNotes(null);
  }
  if (window.setShowStadiumNotesModal) {
    window.setShowStadiumNotesModal(false);
  }
  if (window.setShowStadiumImageLightbox) {
    window.setShowStadiumImageLightbox(false);
  }
};

// Image lightbox functions
window.openStadiumImageLightbox = (imageUrl) => {
  window.appState.showStadiumImageLightbox = imageUrl;
  if (window.setShowStadiumImageLightbox) {
    window.setShowStadiumImageLightbox(imageUrl);
  }
};

window.closeStadiumImageLightbox = () => {
  window.appState.showStadiumImageLightbox = false;
  if (window.setShowStadiumImageLightbox) {
    window.setShowStadiumImageLightbox(false);
  }
};

console.log('✅ Stadium Notes Modal component loaded');
