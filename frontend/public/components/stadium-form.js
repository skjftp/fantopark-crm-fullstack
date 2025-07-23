// Stadium Form Component for FanToPark CRM
// Simplified version without tabs to avoid React hooks error

window.renderStadiumForm = () => {
  if (!window.showStadiumForm) return null;

  const noteCategories = {
    tickets: { label: 'Ticket Information', icon: '🎫', placeholder: 'e.g., Best seats in Block A, Premium tickets include lounge access' },
    hospitality: { label: 'Hospitality & Premium Areas', icon: '🥂', placeholder: 'e.g., VIP lounge on Level 3, Corporate boxes have dedicated entrance' },
    access: { label: 'Access & Transportation', icon: '🚗', placeholder: 'e.g., Use Gate 5 for quickest entry, Parking available at North lot' },
    sun_weather: { label: 'Sun & Weather Exposure', icon: '☀️', placeholder: 'e.g., West stand faces direct sun 3-6pm, East stand has roof coverage' },
    facilities: { label: 'Stadium Facilities', icon: '🏢', placeholder: 'e.g., ATMs near Gate 2, Family restrooms on all levels' },
    restrictions: { label: 'Security & Restrictions', icon: '🔒', placeholder: 'e.g., No bags larger than A4, Metal detectors at all gates' },
    nearby: { label: 'Nearby Amenities', icon: '🏨', placeholder: 'e.g., Marriott 500m away, Multiple restaurants on Stadium Road' },
    technical: { label: 'Technical & AV Details', icon: '📺', placeholder: 'e.g., Giant screen visible from all stands except behind pavilion' },
    special: { label: 'Special Considerations', icon: '♿', placeholder: 'e.g., Wheelchair access via Gate 3, Sensory room available' }
  };

  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
  },
    React.createElement('div', {
      className: 'bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto'
    },
      // Header
      React.createElement('div', { className: 'bg-blue-600 text-white p-4 flex justify-between items-center' },
        React.createElement('h2', { className: 'text-xl font-bold' },
          window.editingStadium ? `Edit Stadium: ${window.editingStadium.name}` : 'Add New Stadium'
        ),
        React.createElement('button', {
          onClick: window.closeStadiumForm,
          className: 'text-white hover:text-gray-200 text-2xl'
        }, '×')
      ),

      // Form
      React.createElement('form', { 
        onSubmit: window.handleStadiumFormSubmit,
        className: 'p-6 space-y-6'
      },
        // Basic Information Section
        React.createElement('div', null,
          React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 dark:text-white mb-4' }, 
            '📋 Basic Information'
          ),
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
            // Stadium Name
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' },
                'Stadium Name *'
              ),
              React.createElement('input', {
                type: 'text',
                value: window.stadiumFormData.name || '',
                onChange: (e) => window.handleStadiumInputChange('name', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                required: true,
                placeholder: 'e.g., Wankhede Stadium'
              })
            ),

            // City
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' },
                'City *'
              ),
              React.createElement('input', {
                type: 'text',
                value: window.stadiumFormData.city || '',
                onChange: (e) => window.handleStadiumInputChange('city', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                required: true,
                placeholder: 'e.g., Mumbai'
              })
            ),

            // State
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' },
                'State/Province'
              ),
              React.createElement('input', {
                type: 'text',
                value: window.stadiumFormData.state || '',
                onChange: (e) => window.handleStadiumInputChange('state', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                placeholder: 'e.g., Maharashtra'
              })
            ),

            // Country
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' },
                'Country *'
              ),
              React.createElement('select', {
                value: window.stadiumFormData.country || '',
                onChange: (e) => window.handleStadiumInputChange('country', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                required: true
              },
                React.createElement('option', { value: '' }, 'Select Country'),
                ['India', 'United States', 'United Kingdom', 'Australia', 'Canada', 'South Africa',
                 'New Zealand', 'West Indies', 'Sri Lanka', 'Bangladesh', 'Pakistan', 'Afghanistan',
                 'Spain', 'Germany', 'France', 'Italy', 'Brazil', 'Argentina', 'Japan', 'China',
                 'Mexico', 'UAE', 'Singapore', 'Saudi Arabia', 'Bahrain', 'Qatar', 'Azerbaijan',
                 'Hungary', 'Netherlands', 'Belgium', 'Ireland', 'Other'
                ].map(country => 
                  React.createElement('option', { key: country, value: country }, country)
                )
              )
            ),

            // Sport Type
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' },
                'Primary Sport *'
              ),
              React.createElement('select', {
                value: window.stadiumFormData.sport_type || '',
                onChange: (e) => window.handleStadiumInputChange('sport_type', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                required: true
              },
                React.createElement('option', { value: '' }, 'Select Sport'),
                ['Cricket', 'Football', 'Basketball', 'Tennis', 'Hockey', 'Baseball', 
                 'Rugby', 'Athletics', 'Formula 1', 'Multi-Sport', 'Other'
                ].map(sport => 
                  React.createElement('option', { key: sport, value: sport }, sport)
                )
              )
            ),

            // Capacity
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' },
                'Seating Capacity'
              ),
              React.createElement('input', {
                type: 'number',
                value: window.stadiumFormData.capacity || '',
                onChange: (e) => window.handleStadiumInputChange('capacity', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                placeholder: 'e.g., 33000',
                min: 0
              })
            ),

            // Year Opened
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' },
                'Year Opened'
              ),
              React.createElement('input', {
                type: 'number',
                value: window.stadiumFormData.opened_year || '',
                onChange: (e) => window.handleStadiumInputChange('opened_year', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                placeholder: 'e.g., 1974',
                min: 1800,
                max: new Date().getFullYear()
              })
            ),

            // Nickname
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' },
                'Nickname'
              ),
              React.createElement('input', {
                type: 'text',
                value: window.stadiumFormData.nickname || '',
                onChange: (e) => window.handleStadiumInputChange('nickname', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                placeholder: 'e.g., The Home of Cricket'
              })
            ),

            // Website
            React.createElement('div', null,
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' },
                'Website'
              ),
              React.createElement('input', {
                type: 'url',
                value: window.stadiumFormData.website || '',
                onChange: (e) => window.handleStadiumInputChange('website', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                placeholder: 'https://example.com'
              })
            ),

            // Image URL
            React.createElement('div', { className: 'md:col-span-2' },
              React.createElement('label', { className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1' },
                'Stadium Image URL'
              ),
              React.createElement('input', {
                type: 'url',
                value: window.stadiumFormData.image_url || '',
                onChange: (e) => window.handleStadiumInputChange('image_url', e.target.value),
                className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                placeholder: 'https://example.com/stadium-image.jpg'
              }),
              React.createElement('p', { className: 'text-xs text-gray-500 mt-1' },
                'Provide a URL to an image of the stadium (preferably showing stands/seating areas)'
              )
            )
          )
        ),

        // Detailed Notes Section
        React.createElement('div', null,
          React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 dark:text-white mb-4' }, 
            '📝 Detailed Stadium Notes'
          ),
          React.createElement('div', { className: 'bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4' },
            React.createElement('p', { className: 'text-sm text-blue-800 dark:text-blue-300' },
              '💡 Add detailed notes about different aspects of the stadium to help sales teams provide better information to clients.'
            )
          ),

          React.createElement('div', { className: 'space-y-4' },
            Object.entries(noteCategories).map(([key, category]) => 
              React.createElement('div', { 
                key: key,
                className: 'bg-gray-50 dark:bg-gray-700 p-4 rounded-lg'
              },
                React.createElement('label', { 
                  className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' 
                },
                  React.createElement('span', { className: 'text-lg mr-2' }, category.icon),
                  category.label
                ),
                React.createElement('textarea', {
                  value: window.stadiumFormData[`notes_${key}`] || '',
                  onChange: (e) => window.handleStadiumInputChange(`notes_${key}`, e.target.value),
                  className: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500',
                  rows: 3,
                  placeholder: category.placeholder
                })
              )
            )
          )
        ),

        // Form Actions
        React.createElement('div', { 
          className: 'sticky bottom-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-6 py-4 -mx-6 mt-6 flex justify-end gap-3' 
        },
          React.createElement('button', {
            type: 'button',
            onClick: window.closeStadiumForm,
            className: 'px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700'
          }, 'Cancel'),
          React.createElement('button', {
            type: 'submit',
            disabled: window.loading,
            className: 'px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
          }, window.loading ? 'Saving...' : (window.editingStadium ? 'Update Stadium' : 'Add Stadium'))
        )
      )
    )
  );
};

console.log('✅ Stadium Form component loaded successfully');
