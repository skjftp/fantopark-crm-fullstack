// components/content-router.js
// Main Content Router Component - Enhanced with Tab Overlay Fix
// Complete router functionality with all tabs, permission checks, and complex roles management

// The renderContent function that SimplifiedApp calls
window.renderContent = () => {
    // Create a wrapper div that forces React to properly unmount/remount content
    // The key prop ensures React treats each tab as a separate component tree
    return React.createElement('div', {
        key: `tab-${window.activeTab}`, // Unique key per tab only
        className: 'tab-content-wrapper',
        'data-active-tab': window.activeTab,
        style: {
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'hidden', // Prevent content from spilling out
            background: 'inherit', // Ensure proper background
            zIndex: 1
        }
    }, React.createElement('div', {
        className: 'tab-inner-content',
        style: {
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'auto'
        }
    }, (() => {
        // Add this check in your renderContent function where other forms are rendered
        if (window.appState?.currentForm === 'proforma_invoice' && window.appState?.showPaymentForm) {
            return window.renderProformaInvoiceForm();
        }
        
        if (window.loading && window.activeTab !== 'leads') {
            return React.createElement('div', { className: 'flex items-center justify-center h-64' },
                React.createElement('div', { className: 'text-gray-500' }, 'Loading...')
            );
        }

        // Handle individual tabs with original logic preserved
        switch (window.activeTab) {
            case 'dashboard':
                return window.renderDashboardContent();

            case 'leads':
                return window.hasPermission('leads', 'read') ? window.renderLeadsContent() : 
                    React.createElement('div', { className: 'text-center py-12' },
                        React.createElement('p', { className: 'text-red-500 text-lg' }, 
                            'Access Denied: You do not have permission to view leads.'
                        )
                    );

            case 'inventory':
                return window.hasPermission('inventory', 'read') ? window.renderInventoryContent() : 
                    React.createElement('div', { className: 'text-center py-12' },
                        React.createElement('p', { className: 'text-red-500 text-lg' }, 
                            'Access Denied: You do not have permission to view inventory.'
                        )
                    );

            case 'orders':
                return window.hasPermission('orders', 'read') ? window.renderOrdersContent() : 
                    React.createElement('div', { className: 'text-center py-12' },
                        React.createElement('p', { className: 'text-red-500 text-lg' }, 
                            'Access Denied: You do not have permission to view orders.'
                        )
                    );

            case 'finance':
            case 'financials': // Support both 'finance' and 'financials' tab names
                return window.hasPermission('finance', 'read') ? window.renderFinancials() : 
                    React.createElement('div', { className: 'text-center py-12' },
                        React.createElement('p', { className: 'text-red-500 text-lg' }, 
                            'Access Denied: You do not have permission to view financials.'
                        )
                    );
            case 'sales-performance':
            return window.hasPermission('finance', 'read') ? 
                window.renderSalesPerformanceContent() : 
                React.createElement('div', { className: 'text-center py-12' },
                    React.createElement('p', { className: 'text-red-500 text-lg' }, 
                        'Access Denied: You do not have permission to view sales performance.'
                    )
                );
            case 'marketing-performance':
            return window.hasPermission('finance', 'read') ? 
                window.renderMarketingPerformanceContent() : 
                React.createElement('div', { className: 'text-center py-12' },
                    React.createElement('p', { className: 'text-red-500 text-lg' }, 
                        'Access Denied: You do not have permission to view marketing performance.'
                    )
                );    
            case 'assignment-rules':
                // Return the stable memoized component
                return window.AssignmentRulesTab;

            case 'delivery':
                return window.hasPermission('delivery', 'read') ? window.renderDeliveryContent() : 
                    React.createElement('div', { className: 'text-center py-12' },
                        React.createElement('p', { className: 'text-red-500 text-lg' }, 
                            'Access Denied: You do not have permission to view delivery.'
                        )
                    );

            case 'users':
                return window.hasPermission('users', 'read') ? window.renderUserManagementContent() : 
                    React.createElement('div', { className: 'text-center py-12' },
                        React.createElement('p', { className: 'text-red-500 text-lg' }, 
                            'Access Denied: You do not have permission to view users.'
                        )
                    );

            case 'stadiums':
                return window.hasPermission('stadiums', 'read') ? window.renderStadiumsContent() : 
                    React.createElement('div', { className: 'text-center py-12' },
                        React.createElement('p', { className: 'text-red-500 text-lg' }, 
                        'Access Denied: You do not have permission to view stadiums.')
                    );

            case 'reminders':
                return window.hasPermission('leads', 'read') ? window.renderRemindersContent() : 
                    React.createElement('div', { className: 'text-center py-12' },
                        React.createElement('p', { className: 'text-red-500 text-lg' }, 
                            'Access Denied: You do not have permission to view reminders.'
                        )
                    );

            case 'myactions':
                return window.renderMyActionsContent();

            case 'sports-calendar':
                return window.renderSportsCalendarContent();

            case 'changePassword':
            return window.renderChangePassword();    

            case 'roles':
                // PRESERVED: Complete existing roles logic
                if (window.user?.role === 'super_admin' && !window.rolesInitialized) {
                    window.setRolesInitialized(true);
                    window.apiCall('/roles').then(response => {
                        window.setRoles(response.data || []);
                    }).catch(error => {
                        console.error('Failed to fetch roles:', error);
                        window.setRolesInitialized(false); // Allow retry on error
                    });
                }

                return window.user?.role === 'super_admin' ? React.createElement('div', { className: 'space-y-6' },
                    React.createElement('div', { className: 'flex justify-between items-center' },
                        React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 dark:text-white' }, 'Role Management'),
                        React.createElement('button', {
                            onClick: () => {
                                window.setShowRoleForm(true);
                                window.setEditingRole(null);
                                window.roleFormData = {
                                    name: '',
                                    label: '',
                                    description: '',
                                    permissions: {
                                    dashboard: { read: false, write: false, delete: false, manage_users: false },
                                    leads: { read: false, write: false, delete: false, assign: false, progress: false },
                                    inventory: { read: false, write: false, delete: false, allocate: false },
                                    orders: { read: false, write: false, delete: false, approve: false, assign: false },
                                    finance: { read: false, write: false, delete: false, approve: false },
                                    delivery: { read: false, write: false, delete: false },
                                    stadiums: { read: false, write: false, delete: false }, // ← ADD THIS LINE
                                    users: { read: false, write: false, delete: false, manage_roles: false }
                                    }
                                };
                            },
                            className: 'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'
                        }, '+ Add New Role')
                    ),

                    // Show initialize button if no roles
                    window.roles.length === 0 && React.createElement('div', { className: 'bg-yellow-50 border border-yellow-200 rounded-lg p-4' },
                        React.createElement('p', { className: 'text-yellow-800' }, 'No roles found. Initialize default roles to get started.'),
                        React.createElement('button', {
                            onClick: async () => {
                                try {
                                    const response = await window.apiCall('/roles/initialize', { method: 'POST', body: JSON.stringify({}) });
                                    console.log('Default roles initialized successfully');
                                    window.setRoles(response.data || []);
                                } catch (error) {
                                    console.error('Failed to initialize roles:', error);
                                    console.log('Failed to initialize default roles');
                                }
                            },
                            className: 'mt-2 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700'
                        }, 'Initialize Default Roles')
                    ),

                    // Display roles
                    React.createElement('div', { className: 'grid gap-4' },
                        window.roles.map(role => React.createElement('div', {
                            key: role.id,
                            className: 'bg-white dark:bg-gray-800 rounded-lg shadow p-6'
                        },
                            React.createElement('div', { className: 'flex justify-between items-start' },
                                React.createElement('div', null,
                                    React.createElement('h3', { className: 'text-xl font-semibold text-gray-900 dark:text-white' }, 
                                        role.label,
                                        role.is_system && React.createElement('span', { 
                                            className: 'ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded' 
                                        }, 'System')
                                    ),
                                    React.createElement('p', { className: 'text-sm text-gray-500 dark:text-gray-400' }, 'Name: ' + (role.name)),
                                    React.createElement('p', { className: 'text-gray-600 dark:text-gray-300 mt-1' }, role.description),
                                    React.createElement('p', { className: 'text-xs text-gray-500 mt-2' }, 'Users with this role: ' + (role.user_count || 0))
                                ),
                                React.createElement('div', { className: 'flex gap-2' },
                                    React.createElement('button', {
                                        onClick: () => {
                                            window.setEditingRole(role);
                                            window.setRoleFormData(JSON.parse(JSON.stringify(role)));
                                            window.setShowRoleForm(true);
                                        },
                                        className: 'text-blue-600 hover:text-blue-800'
                                    }, 'Edit'),
                                    React.createElement('button', {
                                        onClick: async () => {
                                            if (!confirm('Are you sure you want to delete this role?')) return;
                                            try {
                                                await window.apiCall('/roles/' + (role.id), { method: 'DELETE' });
                                                alert('Role deleted successfully!');
                                                window.roles = window.roles.filter(r => r._id !== role.id);
                                            } catch (error) {
                                                console.error('Error deleting role:', error);
                                                alert('Error: ' + (error.message || 'Failed to delete role'));
                                            }
                                        },
                                        className: 'text-red-600 hover:text-red-800'
                                    }, 'Delete')
                                )
                            ),
                            // Permission display
                            React.createElement('div', { className: 'mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' },
                                Object.entries(role.permissions || {}).map(([module, perms]) =>
                                    React.createElement('div', { key: module, className: 'text-sm' },
                                        React.createElement('div', { className: 'font-medium text-gray-700 dark:text-gray-300 capitalize' }, module),
                                        React.createElement('div', { className: 'text-xs text-gray-500 dark:text-gray-400' },
                                            Object.entries(perms)
                                                .filter(([_, value]) => value === true)
                                                .map(([perm, _]) => perm)
                                                .join(', ') || 'No permissions'
                                        )
                                    )
                                )
                            )
                        ))
                    ),

                    // Role Form Modal
                    window.showRoleForm && React.createElement('div', {
                        className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
                        onClick: (e) => {
                            if (e.target === e.currentTarget) {
                                window.setShowRoleForm(false);
                                window.setActiveTab('roles');
                            }
                        }
                    },
                        React.createElement('div', { className: 'bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto' },
                            React.createElement('h2', { className: 'text-2xl font-bold mb-4' }, 
                                window.editingRole ? 'Edit Role' : 'Create New Role'
                            ),
                            React.createElement('form', { 
                                onSubmit: async (e) => {
                                    e.preventDefault();
                                    try {
                                        if (window.editingRole) {
                                            await window.apiCall('/roles/' + (window.editingRole.id), { method: 'PUT', body: JSON.stringify(window.roleFormData) });
                                            console.log('Role updated successfully');
                                        } else {
                                            await window.apiCall('/roles', { method: 'POST', body: JSON.stringify(window.roleFormData) });
                                            console.log('Role created successfully');
                                        }

                                        // Refresh roles
                                        const response = await window.apiCall('/roles');
                                        window.setRoles(response.data || []);
                                        window.setShowRoleForm(false);
                                        window.setEditingRole(null);

                                    } catch (error) {
                                        console.error('Error saving role:', error);
                                        window.showNotification(error.message || 'Failed to save role', 'error');
                                    }
                                }
                            },
                                React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-6' },
                                    React.createElement('div', null,
                                        React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Role Name'),
                                        React.createElement('input', {
                                            type: 'text',
                                            value: window.roleFormData.name,
                                            onChange: (e) => {
                                                window.setRoleFormData(prev => ({
                                                    ...prev,
                                                    name: e.target.value
                                                }));
                                            },
                                            className: 'w-full border rounded px-3 py-2',
                                            required: true,
                                            disabled: window.editingRole?.is_system
                                        })
                                    ),
                                    React.createElement('div', null,
                                        React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Display Label'),
                                        React.createElement('input', {
                                            type: 'text',
                                            value: window.roleFormData.label,
                                            onChange: (e) => {
                                                window.setRoleFormData(prev => ({
                                                    ...prev,
                                                    label: e.target.value
                                                }));
                                            },
                                            className: 'w-full border rounded px-3 py-2',
                                            required: true
                                        })
                                    ),
                                    React.createElement('div', { className: 'md:col-span-2' },
                                        React.createElement('label', { className: 'block text-sm font-medium mb-1' }, 'Description'),
                                        React.createElement('textarea', {
                                            value: window.roleFormData.description,
                                            onChange: (e) => {
                                                window.setRoleFormData(prev => ({
                                                    ...prev,
                                                    description: e.target.value
                                                }));
                                            },
                                            className: 'w-full border rounded px-3 py-2',
                                            rows: 2
                                        })
                                    )
                                ),
                                // Permissions section
                                React.createElement('div', { className: 'mb-6' },
                                    React.createElement('h3', { className: 'text-lg font-semibold mb-4' }, 'Permissions'),
                                    React.createElement('div', { className: 'space-y-4' },
                                        Object.entries(window.roleFormData.permissions).map(([module, perms]) =>
                                            React.createElement('div', { key: module, className: 'border rounded-lg p-4' },
                                                React.createElement('h4', { className: 'font-medium capitalize mb-2' }, module),
                                                React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-4 gap-4' },
                                                    Object.entries(perms).map(([perm, value]) =>
                                                        React.createElement('label', {
                                                            key: perm,
                                                            className: 'flex items-center space-x-2'
                                                        },
                                                            React.createElement('input', {
                                                                type: 'checkbox',
                                                                checked: value,
                                                                onChange: (e) => {
                                                                    window.setRoleFormData(prev => ({
                                                                        ...prev,
                                                                        permissions: {
                                                                            ...prev.permissions,
                                                                            [module]: {
                                                                                ...prev.permissions[module],
                                                                                [perm]: e.target.checked
                                                                            }
                                                                        }
                                                                    }));
                                                                },
                                                                disabled: false  // Allow editing all permissions

                                                            }),
                                                            React.createElement('span', { className: 'text-sm capitalize' }, 
                                                                perm.replace(/_/g, ' ')
                                                            )
                                                        )
                                                    )
                                                )
                                            )
                                        )
                                    )
                                ),
                                React.createElement('div', { className: 'flex justify-end gap-2' },
                                    React.createElement('button', {
                                        type: 'button',
                                        onClick: () => {
                                            window.setShowRoleForm(false);
                                            window.setEditingRole(null);
                                        },
                                        className: 'px-4 py-2 border rounded hover:bg-gray-100'
                                    }, 'Cancel'),
                                    React.createElement('button', {
                                        type: 'submit',
                                        className: 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
                                    }, window.editingRole ? 'Update Role' : 'Create Role')
                                )
                            )
                        )
                    )
                ) : 
                React.createElement('div', { className: 'text-center py-12' },
                    React.createElement('p', { className: 'text-red-500 text-lg' }, 'Access Denied: Only super admins can manage roles.')
                );

            default:
                return window.renderDashboardContent();
        }
    })()));
};

// Enhanced tab cleanup function
window.cleanupTabContent = function(previousTab) {
    // Clean up modals and overlays
    const elementsToClean = [
        '.modal',
        '.modal-backdrop',
        '[role="dialog"]',
        '.dropdown-menu:not(.dropdown-menu-persistent)',
        '.tooltip',
        '.popover'
    ];
    
    elementsToClean.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            if (!el.classList.contains('persistent')) {
                el.remove();
            }
        });
    });
    
    // Tab-specific cleanup
    switch(previousTab) {
        case 'finance':
        case 'financials':
            if (window.setActiveFinancialTab) {
                window.setActiveFinancialTab('activesales');
            }
            if (window.setShowFinanceInvoiceModal) {
                window.setShowFinanceInvoiceModal(false);
            }
            break;
            
        case 'orders':
            if (window.setShowOrderModal) {
                window.setShowOrderModal(false);
            }
            if (window.setOrderToAssign) {
                window.setOrderToAssign(null);
            }
            break;
            
        case 'inventory':
            if (window.setShowInventoryForm) {
                window.setShowInventoryForm(false);
            }
            if (window.setEditingInventory) {
                window.setEditingInventory(null);
            }
            break;
            
        case 'roles':
            if (window.setShowRoleForm) {
                window.setShowRoleForm(false);
            }
            if (window.setEditingRole) {
                window.setEditingRole(null);
            }
            break;
            
        case 'reminders':
            if (window.setShowReminderForm) {
                window.setShowReminderForm(false);
            }
            if (window.setShowReminderDashboard) {
                window.setShowReminderDashboard(false);
            }
            break;
            
        case 'marketing-performance':
            if (window.cleanupMarketingPerformance) {
                window.cleanupMarketingPerformance();
            }
            break;
            
        case 'sports-calendar':
            if (window.setShowEventForm) {
                window.setShowEventForm(false);
            }
            if (window.setShowEventDetail) {
                window.setShowEventDetail(false);
            }
            if (window.setCurrentEvent) {
                window.setCurrentEvent(null);
            }
            break;
    }
    
    // Force garbage collection for any lingering references
    if (window.gc) {
        window.gc();
    }
};

// Initialize cleanup on tab switches if not already initialized
if (!window._tabCleanupInitialized) {
    window._tabCleanupInitialized = true;
    
    // Store original setActiveTab if exists
    const originalSetActiveTab = window.setActiveTab;
    
    // Create enhanced setActiveTab
    window.setActiveTab = function(newTab) {
        const previousTab = window.activeTab;
        
        // Only cleanup if actually changing tabs
        if (previousTab !== newTab && previousTab) {
            window.cleanupTabContent(previousTab);
        }
        
        // Call original or update activeTab
        if (originalSetActiveTab && typeof originalSetActiveTab === 'function') {
            originalSetActiveTab(newTab);
        } else {
            window.activeTab = newTab;
        }
        
        // Force update after tab switch
        setTimeout(() => {
            if (window.forceUpdate) {
                window.forceUpdate();
            }
        }, 50);
    };
}

console.log('✅ Enhanced content router with tab overlay fix loaded');
