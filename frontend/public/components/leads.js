// components/leads.js
// Leads Content Component - Extracted from index.html
// Enhanced renderLeadsContent function with Client Toggle - PRESERVES ALL EXISTING FEATURES
// This includes advanced filtering, sorting, pagination, premium features, and client view

window.renderLeadsContent = () => {
    // EXISTING FILTERING LOGIC - UNCHANGED
    const filteredLeads = window.leads.filter(lead => {
        // Search filter
        const matchesSearch = window.searchQuery === '' || 
            lead.name.toLowerCase().includes(window.searchQuery.toLowerCase()) ||
            lead.email.toLowerCase().includes(window.searchQuery.toLowerCase()) ||
            (lead.company && lead.company.toLowerCase().includes(window.searchQuery.toLowerCase())) ||
            (lead.phone && lead.phone.includes(window.searchQuery));

        // Updated status filter - support both old single filter and new multi-select
        let matchesStatus = true;

        if (window.selectedStatusFilters.length > 0) {
            // Use new multi-select filter
            matchesStatus = window.selectedStatusFilters.includes(lead.status);
        } else if (window.statusFilter !== 'all') {
            // Fallback to old single filter for backward compatibility
            matchesStatus = lead.status === window.statusFilter;
        }

        // Source filter (EXISTING)
        const matchesSource = window.leadsSourceFilter === 'all' || lead.source === window.leadsSourceFilter;

        // Business type filter (EXISTING)
        const matchesBusinessType = window.leadsBusinessTypeFilter === 'all' || lead.business_type === window.leadsBusinessTypeFilter;

        // Event filter (EXISTING)
        const matchesEvent = window.leadsEventFilter === 'all' || lead.lead_for_event === window.leadsEventFilter;

        return matchesSearch && matchesStatus && matchesSource && matchesBusinessType && matchesEvent;
    });

    // EXISTING SORTING LOGIC - UNCHANGED
    const sortedLeads = filteredLeads.sort((a, b) => {
        let aValue, bValue;

        switch (window.leadsSortField) {
            case 'date_of_enquiry':
                aValue = new Date(a.date_of_enquiry || a.created_date);
                bValue = new Date(b.date_of_enquiry || b.created_date);
                break;
            case 'name':
                aValue = a.name.toLowerCase();
                bValue = b.name.toLowerCase();
                break;
            case 'potential_value':
                aValue = parseFloat(a.potential_value) || 0;
                bValue = parseFloat(b.potential_value) || 0;
                break;
            case 'company':
                aValue = (a.company || '').toLowerCase();
                bValue = (b.company || '').toLowerCase();
                break;
            default:
                aValue = new Date(a.date_of_enquiry || a.created_date);
                bValue = new Date(b.date_of_enquiry || b.created_date);
        }

        if (window.leadsSortDirection === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    // EXISTING PAGINATION LOGIC - UNCHANGED
    const indexOfLastItem = window.currentLeadsPage * window.itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - window.itemsPerPage;
    const currentLeads = sortedLeads.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedLeads.length / window.itemsPerPage);

    // EXISTING UNASSIGNED LEADS LOGIC - UNCHANGED
    const unassignedLeads = sortedLeads.filter(lead => !lead.assigned_to || lead.assigned_to === '' || lead.status === 'unassigned');

    return React.createElement('div', { className: 'space-y-6' },

        // NEW: View Mode Toggle Section (only addition to existing structure)
        React.createElement('div', { className: 'bg-white rounded-lg shadow-sm border p-4' },
            React.createElement('div', { className: 'flex items-center justify-between mb-4' },
                React.createElement('h2', { className: 'text-2xl font-bold text-gray-900' }, 'Lead & Client Management'),

                // Toggle Buttons
                React.createElement('div', { className: 'flex bg-gray-100 rounded-lg p-1' },
                    React.createElement('button', {
                        onClick: () => window.setViewMode('leads'),
                        className: `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            window.viewMode === 'leads' 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`
                    }, 
                        React.createElement('span', { className: 'mr-2' }, '📋'),
                        `Lead View (${window.leads.length})`
                    ),
                    React.createElement('button', {
                        onClick: () => window.setViewMode('clients'),
                        className: `px-4 py-2 rounded-md text-sm font-medium transition-colors ml-1 ${
                            window.viewMode === 'clients' 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`
                    }, 
                        React.createElement('span', { className: 'mr-2' }, '👥'),
                        `Client View (${window.clients.length})`
                    )
                )
            ),

            // Mode Description
            React.createElement('p', { className: 'text-sm text-gray-600' },
                window.viewMode === 'leads' 
                ? 'Individual lead management - Create, assign, and track each lead separately with advanced filtering'
                : 'Client-based view - See all leads grouped by phone number for complete client history and relationships'
            )
        ),

        // Conditional Content Based on View Mode
        window.viewMode === 'leads' ? 
        // EXISTING LEAD VIEW CONTENT - COMPLETELY UNCHANGED
        React.createElement('div', { className: 'space-y-6' },
            // EXISTING HEADER WITH BUTTONS - UNCHANGED
            React.createElement('div', { className: 'flex justify-between items-center' },
                React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' }, 'Lead Management'),
                React.createElement('div', { className: 'flex gap-2' },
                    window.hasPermission('leads', 'write') && React.createElement('button', { 
                        className: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700',
                        onClick: () => window.openAddForm('lead')
                    }, '+ Add New Lead'),

                    // EXISTING BULK ASSIGN BUTTON - UNCHANGED
                    window.hasPermission('leads', 'assign') && unassignedLeads.length > 0 && React.createElement('button', {
                        onClick: () => window.setShowBulkAssignModal(true),
                        className: 'bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2'
                    }, 
                        React.createElement('span', null, '👥'),
                        `Bulk Assign (${unassignedLeads.length})`
                    ),

                    // EXISTING CSV UPLOAD BUTTON - UNCHANGED
                    React.createElement('button', {
                        onClick: () => {
                            window.setCSVUploadType('leads');
                            window.setShowCSVUploadModal(true);
                        },
                        className: 'bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded flex items-center gap-2'
                    }, 
                        React.createElement('svg', {
                            className: 'w-5 h-5',
                            fill: 'none',
                            stroke: 'currentColor',
                            viewBox: '0 0 24 24'
                        },
                            React.createElement('path', {
                                strokeLinecap: 'round',
                                strokeLinejoin: 'round',
                                strokeWidth: 2,
                                d: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
                            })
                        ),
                        'Upload CSV'
                    )
                )
            ),

            // EXISTING ENHANCED FILTERS SECTION - COMPLETELY UNCHANGED
            React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow border p-4' },
                React.createElement('h2', { className: 'text-lg font-semibold text-gray-900 dark:text-white mb-4' }, 'Filters & Search'),
                React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4' },
                    // EXISTING SEARCH INPUT - UNCHANGED
                    React.createElement('div', null,
                        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Search'),
                        React.createElement('input', {
                            type: 'text',
                            placeholder: 'Name, email, company...',
                            value: window.searchQuery,
                            onChange: (e) => {
                                window.setSearchQuery(e.target.value);
                                window.setCurrentLeadsPage(1);
                            },
                            className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                        })
                    ),

                    // EXISTING MULTI-SELECT STATUS FILTER - COMPLETELY UNCHANGED
                    React.createElement('div', null,
                        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Status'),
                        React.createElement('div', { className: 'relative', ref: window.statusDropdownRef },
                            React.createElement('button', {
                                onClick: () => window.setShowStatusFilterDropdown(!window.showStatusFilterDropdown),
                                className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white flex items-center justify-between text-left'
                            },
                                React.createElement('span', { className: 'truncate' }, window.getStatusFilterDisplayText()),
                                React.createElement('svg', {
                                    className: `w-5 h-5 transition-transform ${window.showStatusFilterDropdown ? 'rotate-180' : ''}`,
                                    fill: 'none',
                                    stroke: 'currentColor',
                                    viewBox: '0 0 24 24'
                                },
                                    React.createElement('path', {
                                        strokeLinecap: 'round',
                                        strokeLinejoin: 'round',
                                        strokeWidth: 2,
                                        d: 'M19 9l-7 7-7-7'
                                    })
                                )
                            ),

                            // EXISTING STATUS DROPDOWN - COMPLETELY UNCHANGED
                            window.showStatusFilterDropdown && React.createElement('div', {
                                className: 'absolute z-10 w-80 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto'
                            },
                                // EXISTING SELECT/DESELECT ALL CONTROLS - UNCHANGED
                                React.createElement('div', { className: 'border-b border-gray-200 p-3 bg-gray-50' },
                                    React.createElement('div', { className: 'flex justify-between' },
                                        React.createElement('button', {
                                            onClick: window.handleSelectAllStatuses,
                                            className: 'text-sm text-blue-600 hover:text-blue-800 font-medium'
                                        }, window.selectedStatusFilters.length === Object.keys(window.LEAD_STATUSES).length ? 'Deselect All' : 'Select All'),
                                        React.createElement('button', {
                                            onClick: window.handleClearAllStatuses,
                                            className: 'text-sm text-red-600 hover:text-red-800 font-medium'
                                        }, 'Clear All')
                                    )
                                ),

                                // EXISTING STATUS OPTIONS GROUPED - COMPLETELY UNCHANGED
                                React.createElement('div', { className: 'py-1' },
                                    // Initial Contact Group
                                    React.createElement('div', { className: 'px-3 py-2 bg-gray-100 text-xs font-semibold text-gray-700 uppercase' }, 'Initial Contact'),
                                    ['unassigned', 'assigned', 'contacted', 'attempt_1', 'attempt_2', 'attempt_3'].map(status =>
                                        window.LEAD_STATUSES[status] && React.createElement('label', {
                                            key: status,
                                            className: 'flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer'
                                        },
                                            React.createElement('input', {
                                                type: 'checkbox',
                                                checked: window.selectedStatusFilters.includes(status),
                                                onChange: () => window.handleStatusFilterToggle(status),
                                                className: 'mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                                            }),
                                            React.createElement('span', {
                                                className: `px-2 py-1 rounded-full text-xs font-medium mr-2 ${window.LEAD_STATUSES[status].color}`
                                            }, window.LEAD_STATUSES[status].label)
                                        )
                                    ),

                                    // Qualification Group
                                    React.createElement('div', { className: 'px-3 py-2 bg-gray-100 text-xs font-semibold text-gray-700 uppercase' }, 'Qualification'),
                                    ['qualified', 'junk'].map(status =>
                                        window.LEAD_STATUSES[status] && React.createElement('label', {
                                            key: status,
                                            className: 'flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer'
                                        },
                                            React.createElement('input', {
                                                type: 'checkbox',
                                                checked: window.selectedStatusFilters.includes(status),
                                                onChange: () => window.handleStatusFilterToggle(status),
                                                className: 'mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                                            }),
                                            React.createElement('span', {
                                                className: `px-2 py-1 rounded-full text-xs font-medium mr-2 ${window.LEAD_STATUSES[status].color}`
                                            }, window.LEAD_STATUSES[status].label)
                                        )
                                    ),

                                    // Temperature Group
                                    React.createElement('div', { className: 'px-3 py-2 bg-gray-100 text-xs font-semibold text-gray-700 uppercase' }, 'Temperature'),
                                    ['hot', 'warm', 'cold'].map(status =>
                                        window.LEAD_STATUSES[status] && React.createElement('label', {
                                            key: status,
                                            className: 'flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer'
                                        },
                                            React.createElement('input', {
                                                type: 'checkbox',
                                                checked: window.selectedStatusFilters.includes(status),
                                                onChange: () => window.handleStatusFilterToggle(status),
                                                className: 'mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                                            }),
                                            React.createElement('span', {
                                                className: `px-2 py-1 rounded-full text-xs font-medium mr-2 ${window.LEAD_STATUSES[status].color}`
                                            }, window.LEAD_STATUSES[status].label)
                                        )
                                    ),

                                    // Sales Process Group
                                    React.createElement('div', { className: 'px-3 py-2 bg-gray-100 text-xs font-semibold text-gray-700 uppercase' }, 'Sales Process'),
                                    ['quote_requested', 'converted', 'dropped'].map(status =>
                                        window.LEAD_STATUSES[status] && React.createElement('label', {
                                            key: status,
                                            className: 'flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer'
                                        },
                                            React.createElement('input', {
                                                type: 'checkbox',
                                                checked: window.selectedStatusFilters.includes(status),
                                                onChange: () => window.handleStatusFilterToggle(status),
                                                className: 'mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                                            }),
                                            React.createElement('span', {
                                                className: `px-2 py-1 rounded-full text-xs font-medium mr-2 ${window.LEAD_STATUSES[status].color}`
                                            }, window.LEAD_STATUSES[status].label)
                                        )
                                    ),

                                    // Payment Group
                                    React.createElement('div', { className: 'px-3 py-2 bg-gray-100 text-xs font-semibold text-gray-700 uppercase' }, 'Payment'),
                                    ['payment', 'payment_post_service', 'payment_received'].map(status =>
                                        window.LEAD_STATUSES[status] && React.createElement('label', {
                                            key: status,
                                            className: 'flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer'
                                        },
                                            React.createElement('input', {
                                                type: 'checkbox',
                                                checked: window.selectedStatusFilters.includes(status),
                                                onChange: () => window.handleStatusFilterToggle(status),
                                                className: 'mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                                            }),
                                            React.createElement('span', {
                                                className: `px-2 py-1 rounded-full text-xs font-medium mr-2 ${window.LEAD_STATUSES[status].color}`
                                            }, window.LEAD_STATUSES[status].label)
                                        )
                                    )
                                )
                            )
                        ),

                        // EXISTING FILTER INDICATOR - UNCHANGED
                        window.selectedStatusFilters.length > 0 && React.createElement('div', {
                            className: 'mt-1 text-xs text-blue-600 font-medium'
                        }, `Filtering by ${window.selectedStatusFilters.length} status${window.selectedStatusFilters.length !== 1 ? 'es' : ''}`)
                    ),

                    // EXISTING SOURCE FILTER - COMPLETELY UNCHANGED
                    React.createElement('div', null,
                        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Source'),
                        React.createElement('select', {
                            value: window.leadsSourceFilter,
                            onChange: (e) => {
                                window.setLeadsSourceFilter(e.target.value);
                                window.setCurrentLeadsPage(1);
                            },
                            className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                        },
                            React.createElement('option', { value: 'all' }, 'All Sources'),
                            ...Array.from(new Set(window.leads.map(lead => lead.source).filter(Boolean))).sort().map(source =>
                                React.createElement('option', { key: source, value: source }, source)
                            )
                        )
                    ),

                    // EXISTING BUSINESS TYPE FILTER - COMPLETELY UNCHANGED
                    React.createElement('div', null,
                        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Business Type'),
                        React.createElement('select', {
                            value: window.leadsBusinessTypeFilter,
                            onChange: (e) => {
                                window.setLeadsBusinessTypeFilter(e.target.value);
                                window.setCurrentLeadsPage(1);
                            },
                            className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                        },
                            React.createElement('option', { value: 'all' }, 'All Business Types'),
                            ...Array.from(new Set(window.leads.map(lead => lead.business_type).filter(Boolean))).sort().map(type =>
                                React.createElement('option', { key: type, value: type }, type)
                            )
                        )
                    ),

                    // EXISTING EVENT FILTER - COMPLETELY UNCHANGED
                    React.createElement('div', null,
                        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Event'),
                        React.createElement('select', {
                            value: window.leadsEventFilter,
                            onChange: (e) => {
                                window.setLeadsEventFilter(e.target.value);
                                window.setCurrentLeadsPage(1);
                            },
                            className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                        },
                            React.createElement('option', { value: 'all' }, 'All Events'),
                            ...Array.from(new Set(window.leads.map(lead => lead.lead_for_event).filter(Boolean))).sort().map(event =>
                                React.createElement('option', { key: event, value: event }, event)
                            )
                        )
                    ),

                    // EXISTING SORT CONTROLS - COMPLETELY UNCHANGED
                    React.createElement('div', null,
                        React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Sort By'),
                        React.createElement('div', { className: 'flex gap-2' },
                            React.createElement('select', {
                                value: window.leadsSortField,
                                onChange: (e) => {
                                    window.setLeadsSortField(e.target.value);
                                    window.setCurrentLeadsPage(1);
                                },
                                className: 'flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
                            },
                                React.createElement('option', { value: 'date_of_enquiry' }, 'Date'),
                                React.createElement('option', { value: 'name' }, 'Name'),
                                React.createElement('option', { value: 'potential_value' }, 'Value'),
                                React.createElement('option', { value: 'company' }, 'Company')
                            ),
                            React.createElement('button', {
                                onClick: () => {
                                    window.setLeadsSortDirection(window.leadsSortDirection === 'asc' ? 'desc' : 'asc');
                                    window.setCurrentLeadsPage(1);
                                },
                                className: 'px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500',
                                title: window.leadsSortDirection === 'asc' ? 'Sort Descending' : 'Sort Ascending'
                            }, window.leadsSortDirection === 'asc' ? '↑' : '↓')
                        )
                    )
                ),

                // EXISTING FILTER STATUS SUMMARY - COMPLETELY UNCHANGED
                React.createElement('div', { className: 'mt-4 flex justify-between items-center' },
                    React.createElement('span', { className: 'text-sm text-gray-600' },
                        `Showing ${sortedLeads.length} of ${window.leads.length} leads`
                    ),
                    (window.searchQuery !== '' || window.selectedStatusFilters.length > 0 || window.statusFilter !== 'all' || window.leadsSourceFilter !== 'all' || 
                    window.leadsBusinessTypeFilter !== 'all' || window.leadsEventFilter !== 'all') &&
                    React.createElement('button', {
                        onClick: () => {
                            window.setSearchQuery('');
                            window.setStatusFilter('all');
                            window.setSelectedStatusFilters([]);
                            window.setLeadsSourceFilter('all');
                            window.setLeadsBusinessTypeFilter('all');
                            window.setLeadsEventFilter('all');
                            window.setCurrentLeadsPage(1);
                        },
                        className: 'text-sm text-blue-600 hover:text-blue-800 underline'
                    }, 'Clear All Filters')
                )
            ),

            // EXISTING WORKFLOW HINT - COMPLETELY UNCHANGED
            React.createElement('div', { className: 'bg-blue-50 border border-blue-200 rounded-lg p-4' },
                React.createElement('div', { className: 'flex items-center text-sm text-blue-800' },
                    React.createElement('span', { className: 'mr-2 text-lg' }, '💡'),
                    React.createElement('span', { className: 'font-medium mr-2' }, 'Lead Workflow:'),
                    React.createElement('span', null, 'Unassigned → Assigned → Contacted → Qualified/Junk → Hot/Warm/Cold → Converted/Dropped → Payment'),
                    React.createElement('span', { className: 'ml-4 font-mono bg-white px-2 py-1 rounded border' }, '→'),
                    React.createElement('span', { className: 'ml-1' }, 'Click arrow to progress leads')
                )
            ),

            // EXISTING TABLE - COMPLETELY UNCHANGED
            React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg shadow border' },
                filteredLeads.length > 0 ? React.createElement('div', { className: 'overflow-x-auto' },
                    React.createElement('table', { className: 'w-full' },
                        React.createElement('thead', { className: 'bg-gray-50 dark:bg-gray-900' },
                            React.createElement('tr', null,
                                React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Contact'),
                                React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Event'),
                                React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Assignment'),
                                React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Status'),
                                window.hasPermission('finance', 'read') && React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Value'),
                                React.createElement('th', { className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase' }, 'Actions')
                            )
                        ),
                        React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
                            currentLeads.map(lead => {
                                const status = window.LEAD_STATUSES[lead.status] || { label: lead.status, color: 'bg-gray-100 text-gray-800', next: [] };

                                return React.createElement('tr', { key: lead.id, className: `hover:bg-gray-50 ${lead.is_premium ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-l-4 border-yellow-400' : ''}` },
                                    React.createElement('td', { className: 'px-6 py-4' },
                                        React.createElement('div', { 
                                            className: 'cursor-pointer hover:text-blue-600',
                                            onClick: () => window.openLeadDetail(lead)
                                        },
                                            React.createElement('div', { className: `text-sm font-medium ${lead.is_premium ? 'text-yellow-800' : 'text-gray-900'} hover:text-blue-600 flex items-center gap-2` }, 
                                                lead.is_premium && React.createElement('span', { className: 'text-yellow-500' }, '👑'),
                                                lead.name,
                                                lead.is_premium && React.createElement('span', { className: 'px-2 py-1 text-xs bg-yellow-200 text-yellow-800 rounded-full font-semibold' }, 'PREMIUM')
                                            ),
                                            React.createElement('div', { className: 'text-sm text-gray-500' }, lead.email),
                                            lead.company && React.createElement('div', { className: 'text-xs text-gray-400' }, lead.company),
                                            React.createElement('div', { className: 'flex items-center justify-between mt-1' },
                                                React.createElement('div', { className: 'text-xs text-blue-600' }, '👁️ Click to view details'),
                                                React.createElement('button', {
                                                    onClick: (e) => {
                                                        e.stopPropagation();
                                                        window.togglePremiumStatus(lead.id, !lead.is_premium);
                                                    },
                                                    className: `text-sm px-2 py-1 rounded ${
                                                        lead.is_premium 
                                                            ? 'text-yellow-600 hover:text-yellow-800 bg-yellow-100 hover:bg-yellow-200' 
                                                            : 'text-gray-400 hover:text-yellow-600 bg-gray-100 hover:bg-yellow-100'
                                                    }`,
                                                    title: lead.is_premium ? 'Remove Premium Status' : 'Mark as Premium'
                                                }, 
                                                    lead.is_premium ? '⭐' : '☆'
                                                )
                                            )
                                        )
                                    ),
                                    React.createElement('td', { className: 'px-6 py-4' },
                                        React.createElement('div', { className: 'text-sm text-gray-900' }, 
                                            lead.lead_for_event || 'Not specified'
                                        ),
                                        lead.number_of_people && React.createElement('div', { className: 'text-xs text-gray-500' }, 
                                            lead.number_of_people + ' people'
                                        ),
                                        React.createElement('div', { className: 'text-xs text-gray-500' }, 
                                            (lead.city_of_residence) + ', ' + (lead.country_of_residence || 'Unknown')
                                        )
                                    ),
                                    React.createElement('td', { className: 'px-6 py-4' },
                                        lead.assigned_to ? React.createElement('div', null,
                                            React.createElement('div', { className: 'text-sm font-medium text-blue-600' }, window.getUserDisplayName(lead.assigned_to, window.users)),
                                            React.createElement('div', { className: 'text-xs text-gray-500' }, 
                                                lead.assigned_team === 'supply' ? 'Supply Team' : 'Sales Team'
                                            )
                                        ) : React.createElement('span', { className: 'text-sm text-gray-400' }, 'Unassigned')
                                    ),
                                    React.createElement('td', { className: 'px-6 py-4' },
                                        React.createElement('span', {
                                            className: 'px-2 py-1 text-xs rounded ' + (status.color)
                                        }, status.label),
                                        lead.status === 'rejected' && lead.rejection_reason && React.createElement('div', {
                                            className: 'mt-1 text-xs text-red-600 italic'
                                        }, 'Reason: ' + (lead.rejection_reason))
                                    ),
                                    window.hasPermission('finance', 'read') && React.createElement('td', { className: 'px-6 py-4' },
                                        React.createElement('div', { className: 'text-sm font-medium text-gray-900' }, 
                                            '₹' + (lead.potential_value || 0).toLocaleString()
                                        ),
                                        lead.last_quoted_price && React.createElement('div', { className: 'text-xs text-green-600' }, 
                                            'Quoted: ₹' + lead.last_quoted_price.toLocaleString()
                                        )
                                    ),
                                    React.createElement('td', { className: 'px-6 py-4' },
                                        React.createElement('div', { className: 'flex flex-wrap gap-1' },
                                            window.hasPermission('leads', 'write') && React.createElement('button', { 
                                                className: 'text-blue-600 hover:text-blue-900 text-xs px-2 py-1 rounded border border-blue-200 hover:bg-blue-50',
                                                onClick: () => window.openEditForm(lead)
                                            }, '✏️'),
                                            window.hasPermission('leads', 'assign') && !lead.assigned_to && lead.status === 'unassigned' &&
                                                React.createElement('button', { 
                                                    className: 'text-green-600 hover:text-green-900 text-xs px-2 py-1 rounded border border-green-200 hover:bg-green-50',
                                                    onClick: () => window.openAssignForm(lead)
                                                }, '👤'),
                                            window.hasPermission('leads', 'progress') && React.createElement('button', {
                                                className: 'text-purple-600 hover:text-purple-900 text-xs px-2 py-1 rounded border border-purple-200 hover:bg-purple-50',
                                                onClick: () => {
                                                    // If lead is unassigned and not assigned to anyone, open assign form
                                                    if (lead.status === 'unassigned' && !lead.assigned_to) {
                                                        window.openAssignForm(lead);
                                                    } else {
                                                        // Otherwise proceed with normal progression
                                                        window.handleLeadProgression(lead);
                                                    }
                                                },
                                                disabled: window.loading,
                                                title: lead.status === 'unassigned' && !lead.assigned_to 
                                                    ? 'Assign lead' 
                                                    : `Progress lead to next stage`
                                            }, window.loading ? '...' : '→'),
                                            window.hasPermission('leads', 'write') && lead.status === 'converted' &&
                                                React.createElement('button', { 
                                                    className: 'text-green-600 hover:text-green-900 text-xs px-2 py-1 rounded border border-green-200 hover:bg-green-50',
                                                    onClick: () => window.openPaymentForm(lead)
                                                }, '💳'),
                                            window.hasPermission('leads', 'delete') && React.createElement('button', { 
                                                className: 'text-red-600 hover:text-red-900 text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50',
                                                onClick: () => window.handleDelete('leads', lead.id, lead.name),
                                                disabled: window.loading
                                            }, '🗑️')
                                        )
                                    )
                                );
                            })
                        )
                    ),
                    // EXISTING PAGINATION - COMPLETELY UNCHANGED
                    sortedLeads.length > window.itemsPerPage && React.createElement('div', { className: 'flex justify-between items-center px-6 py-3 bg-gray-50 border-t' },
                        React.createElement('div', { className: 'text-sm text-gray-700' },
                            'Showing ' + (indexOfFirstItem + 1) + ' to ' + (Math.min(indexOfLastItem, sortedLeads.length)) + ' of ' + (sortedLeads.length) + ' leads'
                        ),
                        React.createElement('div', { className: 'flex space-x-2' },
                            React.createElement('button', {
                                onClick: () => window.setCurrentLeadsPage(prev => Math.max(prev - 1, 1)),
                                disabled: window.currentLeadsPage === 1,
                                className: 'px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50'
                            }, 'Previous'),
                            React.createElement('span', { className: 'px-3 py-1' }, 'Page ' + (window.currentLeadsPage) + ' of ' + (totalPages)),
                            React.createElement('button', {
                                onClick: () => window.setCurrentLeadsPage(prev => Math.min(prev + 1, totalPages)),
                                disabled: window.currentLeadsPage === totalPages,
                                className: 'px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50'
                            }, 'Next')
                        )
                    )
                ) : React.createElement('div', { className: 'p-6 text-center text-gray-500' }, 
                    sortedLeads.length === 0 && window.leads.length > 0 ? 
                    'No leads match your current filters.' : 
                    'No leads found. Add your first lead!'
                )
            )
        ) :
        // NEW: Client View Content
        window.renderClientViewContent()
    );
};
