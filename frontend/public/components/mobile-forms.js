// Mobile Form Components for FanToPark CRM
// Optimized forms for mobile input and touch interaction

// Mobile Lead Form
window.MobileLeadForm = function() {
  const state = window.appState;
  const { formData, loading, phoneCheckLoading } = state;
  const isEdit = state.showEditForm && state.currentLead;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEdit) {
      window.handleUpdate(e);
    } else {
      window.handleSubmit(e);
    }
  };

  const handlePhoneCheck = async () => {
    if (formData.phone && formData.phone.length >= 10) {
      await window.checkExistingPhone(formData.phone);
    }
  };

  return React.createElement('div', {
    className: 'mobile-modal'
  },
    // Backdrop
    React.createElement('div', {
      className: 'mobile-modal-backdrop',
      onClick: () => {
        state.setShowAddForm(false);
        state.setShowEditForm(false);
        state.setFormData({});
      }
    }),

    // Form content
    React.createElement('div', {
      className: 'mobile-modal-content'
    },
      // Handle
      React.createElement('div', { className: 'mobile-modal-handle' }),

      // Header
      React.createElement('div', { className: 'mobile-modal-header' },
        React.createElement('h2', { 
          className: 'text-lg font-semibold' 
        }, isEdit ? 'Edit Lead' : 'Add New Lead'),
        React.createElement('button', {
          onClick: () => {
            state.setShowAddForm(false);
            state.setShowEditForm(false);
            state.setFormData({});
          },
          className: 'mobile-header-action'
        }, '✕')
      ),

      // Form body
      React.createElement('form', {
        onSubmit: handleSubmit,
        className: 'mobile-modal-body'
      },
        // Basic Information Section
        React.createElement('div', { className: 'mb-6' },
          React.createElement('h3', { 
            className: 'text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4' 
          }, 'Basic Information'),

          // Name
          React.createElement('input', {
            type: 'text',
            placeholder: 'Full Name *',
            required: true,
            className: 'mobile-input',
            value: formData.name || '',
            onChange: (e) => state.setFormData({ ...formData, name: e.target.value })
          }),

          // Phone with check
          React.createElement('div', { className: 'relative' },
            React.createElement('input', {
              type: 'tel',
              placeholder: 'Phone Number *',
              required: true,
              className: 'mobile-input pr-12',
              value: formData.phone || '',
              onChange: (e) => state.setFormData({ ...formData, phone: e.target.value }),
              onBlur: handlePhoneCheck,
              pattern: '[0-9]{10}'
            }),
            phoneCheckLoading && React.createElement('div', {
              className: 'absolute right-4 top-4'
            }, React.createElement('div', { className: 'pull-to-refresh-spinner w-5 h-5' }))
          ),

          // Email
          React.createElement('input', {
            type: 'email',
            placeholder: 'Email Address',
            className: 'mobile-input',
            value: formData.email || '',
            onChange: (e) => state.setFormData({ ...formData, email: e.target.value })
          }),

          // Company
          React.createElement('input', {
            type: 'text',
            placeholder: 'Company Name',
            className: 'mobile-input',
            value: formData.company || '',
            onChange: (e) => state.setFormData({ ...formData, company: e.target.value })
          })
        ),

        // Lead Information Section
        React.createElement('div', { className: 'mb-6' },
          React.createElement('h3', { 
            className: 'text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4' 
          }, 'Lead Information'),

          // Event Interest
          React.createElement('select', {
            className: 'mobile-input',
            value: formData.lead_for_event || '',
            onChange: (e) => state.setFormData({ ...formData, lead_for_event: e.target.value })
          },
            React.createElement('option', { value: '' }, 'Select Event Interest'),
            (window.events || []).map(event =>
              React.createElement('option', { 
                key: event.id, 
                value: event.name 
              }, event.name)
            )
          ),

          // Source
          React.createElement('select', {
            className: 'mobile-input',
            value: formData.source || '',
            onChange: (e) => state.setFormData({ ...formData, source: e.target.value })
          },
            React.createElement('option', { value: '' }, 'Lead Source'),
            ['Facebook', 'Instagram', 'LinkedIn', 'Website', 'Friends and Family', 
             'Through Champion', 'Existing Client', 'Contacted on Social Media', 
             'Middlemen'].map(source =>
              React.createElement('option', { 
                key: source, 
                value: source 
              }, source)
            )
          ),

          // Business Type
          React.createElement('div', { className: 'flex gap-4 mb-4' },
            React.createElement('label', { 
              className: 'flex items-center gap-2' 
            },
              React.createElement('input', {
                type: 'radio',
                name: 'business_type',
                value: 'B2C',
                checked: formData.business_type === 'B2C',
                onChange: (e) => state.setFormData({ ...formData, business_type: e.target.value }),
                className: 'w-5 h-5'
              }),
              React.createElement('span', null, 'B2C')
            ),
            React.createElement('label', { 
              className: 'flex items-center gap-2' 
            },
              React.createElement('input', {
                type: 'radio',
                name: 'business_type',
                value: 'B2B',
                checked: formData.business_type === 'B2B',
                onChange: (e) => state.setFormData({ ...formData, business_type: e.target.value }),
                className: 'w-5 h-5'
              }),
              React.createElement('span', null, 'B2B')
            )
          ),

          // Notes
          React.createElement('textarea', {
            placeholder: 'Additional Notes',
            className: 'mobile-input',
            rows: 3,
            value: formData.notes || '',
            onChange: (e) => state.setFormData({ ...formData, notes: e.target.value })
          })
        ),

        // Submit buttons
        React.createElement('div', { className: 'flex gap-3 mt-6' },
          React.createElement('button', {
            type: 'button',
            className: 'mobile-button mobile-button-secondary flex-1',
            onClick: () => {
              state.setShowAddForm(false);
              state.setShowEditForm(false);
              state.setFormData({});
            }
          }, 'Cancel'),
          
          React.createElement('button', {
            type: 'submit',
            disabled: loading,
            className: 'mobile-button mobile-button-primary flex-1'
          }, loading ? 'Saving...' : (isEdit ? 'Update' : 'Create Lead'))
        )
      )
    )
  );
};

// Mobile Inventory Form
window.MobileInventoryForm = function() {
  const state = window.appState;
  const { formData, loading } = state;
  const isEdit = state.showEditInventoryForm && state.currentInventory;

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Call existing inventory form submit handler
    if (window.handleInventorySubmit) {
      await window.handleInventorySubmit(e);
    }
  };

  return React.createElement('div', {
    className: 'mobile-modal'
  },
    // Backdrop
    React.createElement('div', {
      className: 'mobile-modal-backdrop',
      onClick: () => {
        state.setShowInventoryForm(false);
        state.setShowEditInventoryForm(false);
        state.setFormData({});
      }
    }),

    // Form content
    React.createElement('div', {
      className: 'mobile-modal-content'
    },
      // Handle
      React.createElement('div', { className: 'mobile-modal-handle' }),

      // Header
      React.createElement('div', { className: 'mobile-modal-header' },
        React.createElement('h2', { 
          className: 'text-lg font-semibold' 
        }, isEdit ? 'Edit Inventory' : 'Add Inventory'),
        React.createElement('button', {
          onClick: () => {
            state.setShowInventoryForm(false);
            state.setShowEditInventoryForm(false);
            state.setFormData({});
          },
          className: 'mobile-header-action'
        }, '✕')
      ),

      // Form body
      React.createElement('form', {
        onSubmit: handleSubmit,
        className: 'mobile-modal-body'
      },
        // Event Information
        React.createElement('div', { className: 'mb-6' },
          React.createElement('h3', { 
            className: 'text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4' 
          }, 'Event Information'),

          React.createElement('input', {
            type: 'text',
            placeholder: 'Event Name *',
            required: true,
            className: 'mobile-input',
            value: formData.event_name || '',
            onChange: (e) => state.setFormData({ ...formData, event_name: e.target.value })
          }),

          React.createElement('input', {
            type: 'date',
            placeholder: 'Event Date *',
            required: true,
            className: 'mobile-input',
            value: formData.event_date || '',
            onChange: (e) => state.setFormData({ ...formData, event_date: e.target.value })
          }),

          React.createElement('input', {
            type: 'text',
            placeholder: 'Venue *',
            required: true,
            className: 'mobile-input',
            value: formData.venue || '',
            onChange: (e) => state.setFormData({ ...formData, venue: e.target.value })
          }),

          React.createElement('select', {
            className: 'mobile-input',
            required: true,
            value: formData.sports || '',
            onChange: (e) => state.setFormData({ ...formData, sports: e.target.value })
          },
            React.createElement('option', { value: '' }, 'Select Sport *'),
            ['Cricket', 'Football', 'Tennis', 'Formula 1', 'Olympics', 
             'Basketball', 'Badminton', 'Hockey', 'Golf', 'Wrestling'].map(sport =>
              React.createElement('option', { key: sport, value: sport }, sport)
            )
          )
        ),

        // Ticket Information
        React.createElement('div', { className: 'mb-6' },
          React.createElement('h3', { 
            className: 'text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4' 
          }, 'Ticket Information'),

          React.createElement('input', {
            type: 'text',
            placeholder: 'Category (e.g. VIP, Premium) *',
            required: true,
            className: 'mobile-input',
            value: formData.category_of_ticket || '',
            onChange: (e) => state.setFormData({ ...formData, category_of_ticket: e.target.value })
          }),

          React.createElement('div', { className: 'grid grid-cols-2 gap-3' },
            React.createElement('input', {
              type: 'number',
              placeholder: 'Total Tickets *',
              required: true,
              min: '1',
              className: 'mobile-input',
              value: formData.total_tickets || '',
              onChange: (e) => state.setFormData({ ...formData, total_tickets: e.target.value })
            }),

            React.createElement('input', {
              type: 'number',
              placeholder: 'Available *',
              required: true,
              min: '0',
              className: 'mobile-input',
              value: formData.available_tickets || '',
              onChange: (e) => state.setFormData({ ...formData, available_tickets: e.target.value })
            })
          )
        ),

        // Pricing
        React.createElement('div', { className: 'mb-6' },
          React.createElement('h3', { 
            className: 'text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4' 
          }, 'Pricing'),

          React.createElement('div', { className: 'grid grid-cols-2 gap-3' },
            React.createElement('input', {
              type: 'number',
              placeholder: 'Buying Price *',
              required: true,
              min: '0',
              className: 'mobile-input',
              value: formData.buying_price || '',
              onChange: (e) => state.setFormData({ ...formData, buying_price: e.target.value })
            }),

            React.createElement('input', {
              type: 'number',
              placeholder: 'Selling Price *',
              required: true,
              min: '0',
              className: 'mobile-input',
              value: formData.selling_price || '',
              onChange: (e) => state.setFormData({ ...formData, selling_price: e.target.value })
            })
          )
        ),

        // Submit buttons
        React.createElement('div', { className: 'flex gap-3 mt-6' },
          React.createElement('button', {
            type: 'button',
            className: 'mobile-button mobile-button-secondary flex-1',
            onClick: () => {
              state.setShowInventoryForm(false);
              state.setShowEditInventoryForm(false);
              state.setFormData({});
            }
          }, 'Cancel'),
          
          React.createElement('button', {
            type: 'submit',
            disabled: loading,
            className: 'mobile-button mobile-button-primary flex-1'
          }, loading ? 'Saving...' : (isEdit ? 'Update' : 'Add Inventory'))
        )
      )
    )
  );
};

// Mobile Filter Sheet
window.MobileFilterSheet = function() {
  const state = window.appState;
  const { showMobileFilters, activeTab } = state;

  if (!showMobileFilters) return null;

  const renderFilters = () => {
    switch(activeTab) {
      case 'leads':
        return React.createElement('div', null,
          // Status filter
          React.createElement('div', { className: 'mb-4' },
            React.createElement('label', { 
              className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' 
            }, 'Status'),
            React.createElement('select', {
              className: 'mobile-input',
              value: state.leadsStatusFilter || 'all',
              onChange: (e) => state.setLeadsStatusFilter && state.setLeadsStatusFilter(e.target.value === 'all' ? '' : e.target.value)
            },
              React.createElement('option', { value: 'all' }, 'All Status'),
              Object.entries(window.LEAD_STATUSES || {}).map(([key, status]) =>
                React.createElement('option', { key: key, value: key }, status.label)
              )
            )
          ),

          // Source filter
          React.createElement('div', { className: 'mb-4' },
            React.createElement('label', { 
              className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' 
            }, 'Source'),
            React.createElement('select', {
              className: 'mobile-input',
              value: state.leadsSourceFilter || 'all',
              onChange: (e) => state.setLeadsSourceFilter(e.target.value)
            },
              React.createElement('option', { value: 'all' }, 'All Sources'),
              ['Facebook', 'Instagram', 'LinkedIn', 'Website', 'Friends and Family'].map(source =>
                React.createElement('option', { key: source, value: source }, source)
              )
            )
          ),

          // Date range
          React.createElement('div', { className: 'mb-4' },
            React.createElement('label', { 
              className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' 
            }, 'Date Range'),
            React.createElement('div', { className: 'grid grid-cols-2 gap-3' },
              React.createElement('input', {
                type: 'date',
                className: 'mobile-input',
                placeholder: 'From'
              }),
              React.createElement('input', {
                type: 'date',
                className: 'mobile-input',
                placeholder: 'To'
              })
            )
          )
        );

      case 'inventory':
        return React.createElement('div', null,
          // Event type filter
          React.createElement('div', { className: 'mb-4' },
            React.createElement('label', { 
              className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' 
            }, 'Sport'),
            React.createElement('select', {
              className: 'mobile-input',
              value: state.inventorySportFilter || 'all',
              onChange: (e) => state.setInventorySportFilter && state.setInventorySportFilter(e.target.value)
            },
              React.createElement('option', { value: 'all' }, 'All Sports'),
              ['Cricket', 'Football', 'Tennis', 'Formula 1'].map(sport =>
                React.createElement('option', { key: sport, value: sport }, sport)
              )
            )
          ),

          // Availability filter
          React.createElement('div', { className: 'mb-4' },
            React.createElement('label', { 
              className: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2' 
            }, 'Availability'),
            React.createElement('div', { className: 'space-y-2' },
              React.createElement('label', { className: 'flex items-center gap-2' },
                React.createElement('input', { 
                  type: 'checkbox', 
                  className: 'w-5 h-5',
                  checked: state.showAvailableOnly || false,
                  onChange: (e) => state.setShowAvailableOnly && state.setShowAvailableOnly(e.target.checked)
                }),
                React.createElement('span', null, 'Show available only')
              )
            )
          )
        );

      default:
        return React.createElement('p', { 
          className: 'text-center text-gray-500 dark:text-gray-400' 
        }, 'No filters available');
    }
  };

  return React.createElement('div', {
    className: 'mobile-modal'
  },
    // Backdrop
    React.createElement('div', {
      className: 'mobile-modal-backdrop',
      onClick: () => state.setShowMobileFilters(false)
    }),

    // Filter content
    React.createElement('div', {
      className: 'mobile-modal-content'
    },
      // Handle
      React.createElement('div', { className: 'mobile-modal-handle' }),

      // Header
      React.createElement('div', { className: 'mobile-modal-header' },
        React.createElement('h2', { className: 'text-lg font-semibold' }, 'Filters'),
        React.createElement('button', {
          onClick: () => state.setShowMobileFilters(false),
          className: 'mobile-header-action'
        }, '✕')
      ),

      // Filter body
      React.createElement('div', { className: 'mobile-modal-body' },
        renderFilters(),

        // Action buttons
        React.createElement('div', { className: 'flex gap-3 mt-6' },
          React.createElement('button', {
            className: 'mobile-button mobile-button-secondary flex-1',
            onClick: () => {
              // Reset filters
              switch(activeTab) {
                case 'leads':
                  state.setLeadsStatusFilter && state.setLeadsStatusFilter('');
                  state.setLeadsSourceFilter && state.setLeadsSourceFilter('all');
                  break;
                case 'inventory':
                  state.setInventorySportFilter && state.setInventorySportFilter('all');
                  state.setShowAvailableOnly && state.setShowAvailableOnly(false);
                  break;
              }
            }
          }, 'Reset'),
          
          React.createElement('button', {
            className: 'mobile-button mobile-button-primary flex-1',
            onClick: () => state.setShowMobileFilters(false)
          }, 'Apply')
        )
      )
    )
  );
};

// Override existing forms when on mobile
if (window.innerWidth <= 768) {
  // Override the lead form render
  const originalRenderForm = window.renderForm;
  window.renderForm = function() {
    if (window.innerWidth <= 768 && 
        (window.appState.showAddForm || window.appState.showEditForm) && 
        window.appState.currentForm === 'lead') {
      return React.createElement(window.MobileLeadForm);
    }
    return originalRenderForm ? originalRenderForm() : null;
  };

  // Override the inventory form render
  const originalRenderInventoryForm = window.renderInventoryForm;
  window.renderInventoryForm = function() {
    if (window.innerWidth <= 768 && 
        (window.appState?.showInventoryForm || window.appState?.showEditInventoryForm ||
         window.showInventoryForm || window.showEditInventoryForm)) {
      return React.createElement(window.MobileInventoryForm);
    }
    return originalRenderInventoryForm ? originalRenderInventoryForm() : null;
  };
}

// Add filter sheet to mobile modals
window.renderMobileFilterSheet = function() {
  return React.createElement(window.MobileFilterSheet);
};

console.log('✅ Mobile Forms components loaded');