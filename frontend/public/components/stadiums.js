// ============================================================================
// STADIUMS COMPONENT - Extracted from index.html
// ============================================================================
// This component manages stadium/venue management with location data,
// filtering, sorting, and comprehensive facility administration.

// Main Stadiums Content Renderer
window.renderStadiumsContent = () => {
    // Filter and sort stadiums
    const filteredStadiums = window.stadiums.filter(stadium => {
        const matchesSearch = window.stadiumSearchQuery === '' || 
            stadium.name.toLowerCase().includes(window.stadiumSearchQuery.toLowerCase()) ||
            stadium.city.toLowerCase().includes(window.stadiumSearchQuery.toLowerCase()) ||
            stadium.country.toLowerCase().includes(window.stadiumSearchQuery.toLowerCase());

        const matchesSport = window.stadiumSportFilter === 'all' || stadium.sport_type === window.stadiumSportFilter;

        return matchesSearch && matchesSport;
    });

    const sortedStadiums = filteredStadiums.sort((a, b) => {
        let aValue = a[window.stadiumSortField] || '';
        let bValue = b[window.stadiumSortField] || '';

        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }

        if (window.stadiumSortDirection === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    return React.createElement('div', { className: 'space-y-6' },
        // Header
        React.createElement('div', { className: 'flex justify-between items-center' },
            React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' }, 'Stadium Management'),
            React.createElement('div', { className: 'flex gap-2' },
                window.hasPermission('admin', 'write') && React.createElement('button', {
                    onClick: () => window.openStadiumForm(),
                    className: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'
                }, '+ Add Stadium'),

                React.createElement('button', {
                    onClick: window.populateDefaultStadiums,
                    className: 'bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700'
                }, '🏟️ Add Popular Stadiums')
            )
        ),

        // Stats Cards
        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-4' },
            React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-4 rounded-lg shadow border' },
                React.createElement('h3', { className: 'text-sm font-medium text-gray-500' }, 'Total Stadiums'),
                React.createElement('p', { className: 'text-2xl font-bold text-blue-600' }, window.stadiums.length)
            ),
            React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-4 rounded-lg shadow border' },
                React.createElement('h3', { className: 'text-sm font-medium text-gray-500' }, 'Cricket Stadiums'),
                React.createElement('p', { className: 'text-2xl font-bold text-green-600' }, 
                    window.stadiums.filter(s => s.sport_type === 'Cricket').length
                )
            ),
            React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-4 rounded-lg shadow border' },
                React.createElement('h3', { className: 'text-sm font-medium text-gray-500' }, 'Football Stadiums'),
                React.createElement('p', { className: 'text-2xl font-bold text-orange-600' }, 
                    window.stadiums.filter(s => s.sport_type === 'Football').length
                )
            ),
            React.createElement('div', { className: 'bg-white dark:bg-gray-800 p-4 rounded-lg shadow border' },
                React.createElement('h3', { className: 'text-sm font-medium text-gray-500' }, 'Countries'),
                React.createElement('p', { className: 'text-2xl font-bold text-purple-600' }, 
                    new Set(window.stadiums.map(s => s.country)).size
                )
            )
        ),

        // Filters
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow border p-4' },
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-4' },
                // Search
                React.createElement('div', null,
                    React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Search'),
                    React.createElement('input', {
                        type: 'text',
                        placeholder: 'Search stadiums...',
                        value: window.stadiumSearchQuery,
                        onChange: (e) => window.setStadiumSearchQuery(e.target.value),
                        className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                    })
                ),

                // Sport filter
                React.createElement('div', null,
                    React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Sport'),
                    React.createElement('select', {
                        value: window.stadiumSportFilter,
                        onChange: (e) => window.setStadiumSportFilter(e.target.value),
                        className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                    },
                        React.createElement('option', { value: 'all' }, 'All Sports'),
                        ['Cricket', 'Football', 'Basketball', 'Tennis', 'Hockey', 'Formula 1', 'Multi-Sport', 'Other'].map(sport =>
                            React.createElement('option', { key: sport, value: sport }, sport)
                        )
                    )
                ),

                // Sort field
                React.createElement('div', null,
                    React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Sort By'),
                    React.createElement('select', {
                        value: window.stadiumSortField,
                        onChange: (e) => window.setStadiumSortField(e.target.value),
                        className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                    },
                        React.createElement('option', { value: 'name' }, 'Name'),
                        React.createElement('option', { value: 'city' }, 'City'),
                        React.createElement('option', { value: 'country' }, 'Country'),
                        React.createElement('option', { value: 'sport_type' }, 'Sport'),
                        React.createElement('option', { value: 'capacity' }, 'Capacity')
                    )
                ),

                // Sort direction
                React.createElement('div', null,
                    React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Order'),
                    React.createElement('button', {
                        onClick: () => window.setStadiumSortDirection(prev => prev === 'asc' ? 'desc' : 'asc'),
                        className: 'w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500',
                        title: window.stadiumSortDirection === 'asc' ? 'Sort Descending' : 'Sort Ascending'
                    }, window.stadiumSortDirection === 'asc' ? '↑ Ascending' : '↓ Descending')
                )
            ),

            React.createElement('div', { className: 'mt-4 text-sm text-gray-600' },
                `Showing ${sortedStadiums.length} of ${window.stadiums.length} stadiums`
            )
        ),

        // Stadiums Table
        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow border' },
            sortedStadiums.length > 0 ? React.createElement('div', { className: 'overflow-x-auto' },
                React.createElement('table', { className: 'w-full' },
                    React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-900' },
                        React.createElement('tr', null,
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Stadium'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Location'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Sport'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Capacity'),
                            React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
                        )
                    ),
                    React.createElement('tbody', { className: 'bg-white dark:bg-gray-700 divide-y divide-gray-200' },
                        sortedStadiums.map(stadium =>
                            React.createElement('tr', { key: stadium.id, className: 'hover:bg-gray-50 dark:hover:bg-gray-600' },
                                React.createElement('td', { className: 'px-6 py-4' },
                                    React.createElement('div', null,
                                        React.createElement('div', { className: 'text-sm font-medium text-gray-900 dark:text-white' }, stadium.name),
                                        stadium.nickname && React.createElement('div', { className: 'text-xs text-gray-500 dark:text-gray-400' }, `"${stadium.nickname}"`),
                                        stadium.opened_year && React.createElement('div', { className: 'text-xs text-gray-400' }, `Est. ${stadium.opened_year}`)
                                    )
                                ),
                                React.createElement('td', { className: 'px-6 py-4' },
                                    React.createElement('div', { className: 'text-sm text-gray-900 dark:text-white' }, 
                                        `${stadium.city}${stadium.state ? ', ' + stadium.state : ''}`
                                    ),
                                    React.createElement('div', { className: 'text-xs text-gray-500 dark:text-gray-400' }, stadium.country)
                                ),
                                React.createElement('td', { className: 'px-6 py-4' },
                                    React.createElement('span', {
                                        className: `px-2 py-1 text-xs rounded-full ${
                                            stadium.sport_type === 'Cricket' ? 'bg-green-100 text-green-800' :
                                            stadium.sport_type === 'Football' ? 'bg-blue-100 text-blue-800' :
                                            stadium.sport_type === 'Multi-Sport' ? 'bg-purple-100 text-purple-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`
                                    }, stadium.sport_type)
                                ),
                                React.createElement('td', { className: 'px-6 py-4 text-sm text-gray-900 dark:text-white' },
                                    stadium.capacity ? stadium.capacity.toLocaleString() : 'N/A'
                                ),
                                React.createElement('td', { className: 'px-6 py-4' },
                                    React.createElement('div', { className: 'flex gap-2' },
                                        window.hasPermission('admin', 'write') && React.createElement('button', {
                                            onClick: () => window.openStadiumForm(stadium),
                                            className: 'text-blue-600 hover:text-blue-900 text-sm px-2 py-1 rounded border border-blue-200 hover:bg-blue-50'
                                        }, '✏️'),
                                        window.hasPermission('admin', 'delete') && React.createElement('button', {
                                            onClick: () => window.handleDeleteStadium(stadium.id, stadium.name),
                                            className: 'text-red-600 hover:text-red-900 text-sm px-2 py-1 rounded border border-red-200 hover:bg-red-50'
                                        }, '🗑️'),
                                        stadium.website && React.createElement('a', {
                                            href: stadium.website,
                                            target: '_blank',
                                            className: 'text-green-600 hover:text-green-900 text-sm px-2 py-1 rounded border border-green-200 hover:bg-green-50'
                                        }, '🌐')
                                    )
                                )
                            )
                        )
                    )
                )
            ) : React.createElement('div', { className: 'p-8 text-center text-gray-500' },
                React.createElement('p', { className: 'text-lg mb-4' }, 'No stadiums found'),
                React.createElement('button', {
                    onClick: window.populateDefaultStadiums,
                    className: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'
                }, 'Add Popular Stadiums to Get Started')
            )
        )
    );
};

console.log('✅ Stadiums component loaded successfully');
