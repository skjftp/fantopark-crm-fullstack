// Mobile Card Components for FanToPark CRM
// Optimized for touch interactions and mobile viewing

// Mobile Lead Card
window.MobileLeadCard = function({ lead, onClick }) {
  const getStatusColor = (status) => {
    const colors = {
      'unassigned': 'bg-gray-100 text-gray-800',
      'assigned': 'bg-blue-100 text-blue-800',
      'contacted': 'bg-yellow-100 text-yellow-800',
      'qualified': 'bg-green-100 text-green-800',
      'converted': 'bg-green-100 text-green-800',
      'junk': 'bg-red-100 text-red-800',
      'hot': 'bg-red-100 text-red-800',
      'warm': 'bg-orange-100 text-orange-800',
      'cold': 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    // Handle Firestore timestamp objects
    let date;
    if (dateString._seconds !== undefined) {
      date = new Date(dateString._seconds * 1000);
    } else if (typeof dateString === 'object' && dateString.seconds !== undefined) {
      date = new Date(dateString.seconds * 1000);
    } else {
      date = new Date(dateString);
    }
    
    const now = new Date();
    
    // Get local date strings for comparison
    const dateStr = date.toLocaleDateString();
    const todayStr = now.toLocaleDateString();
    
    // Create yesterday's date
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString();
    
    // Create tomorrow's date
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleDateString();
    
    // Compare date strings
    if (dateStr === todayStr) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';
    if (dateStr === tomorrowStr) return 'Tomorrow';
    
    // For other dates, calculate days difference
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 0) return 'Future';
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return React.createElement('div', {
    className: 'mobile-card'
  },
    // Clickable upper section
    React.createElement('div', {
      className: 'cursor-pointer',
      onClick: () => onClick(lead)
    },
      // Header row
      React.createElement('div', {
        className: 'flex items-start justify-between mb-3'
      },
        React.createElement('div', { className: 'flex-1' },
          React.createElement('h3', {
            className: 'font-semibold text-base text-gray-900 dark:text-white mb-1'
          }, lead.name || 'Unnamed Lead'),
          React.createElement('p', {
            className: 'text-sm text-gray-600 dark:text-gray-400'
          }, lead.company || lead.email || lead.phone)
        ),
        React.createElement('span', {
          className: `mobile-badge ${getStatusColor(lead.status)}`
        }, window.LEAD_STATUSES[lead.status]?.label || lead.status)
      ),

      // Info rows
      React.createElement('div', { className: 'space-y-2' },
        // Event and date
        React.createElement('div', { className: 'flex items-center justify-between text-sm' },
          React.createElement('span', { className: 'text-gray-500 dark:text-gray-400' },
            lead.lead_for_event || 'No event specified'
          ),
          React.createElement('span', { className: 'text-gray-500 dark:text-gray-400' },
            formatDate(lead.date_of_enquiry || lead.created_date)
          )
        ),

        // Assigned to and value
        lead.assigned_to && React.createElement('div', { 
          className: 'flex items-center justify-between text-sm'
        },
          React.createElement('span', { className: 'text-gray-500 dark:text-gray-400' },
            `Assigned to ${lead.assigned_to_name || lead.assigned_to}`
          ),
          lead.potential_value && React.createElement('span', { 
            className: 'font-medium text-gray-900 dark:text-white'
          }, `${window.formatCurrency(lead.potential_value)}`)
        )
      )
    ),

    // Quick action buttons
    React.createElement('div', {
      className: 'flex items-center gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 overflow-x-auto'
    },
      // Edit button
      window.hasPermission('leads', 'write') && React.createElement('button', {
        className: 'action-button px-2 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors whitespace-nowrap',
        onClick: () => {
          if (window.openEditForm) {
            window.openEditForm(lead);
          } else {
            console.error('window.openEditForm not found');
          }
        },
        title: 'Edit Lead'
      }, '✏️'),
      
      // Progress button
      window.hasPermission('leads', 'progress') && React.createElement('button', {
        className: 'action-button px-2 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded transition-colors whitespace-nowrap',
        onClick: () => {
          if (window.handleLeadProgressionClick) {
            window.handleLeadProgressionClick(lead);
          } else if (window.handleLeadProgression) {
            window.handleLeadProgression(lead);
          } else {
            console.error('No progression handler found');
          }
        },
        title: 'Progress Lead'
      }, '→'),
      
      // Assign button (only for unassigned leads)
      window.hasPermission('leads', 'assign') && !lead.assigned_to && lead.status === 'unassigned' &&
      React.createElement('button', {
        className: 'action-button px-2 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded transition-colors whitespace-nowrap',
        onClick: () => {
          if (window.openAssignForm) {
            window.openAssignForm(lead);
          } else {
            console.error('window.openAssignForm not found');
          }
        },
        title: 'Assign Lead'
      }, '👤'),
      
      // Payment form button (for converted leads or leads with orders)
      window.hasPermission('leads', 'write') && (lead.status === 'converted' || 
        (window.orders && window.orders.some(order => order.lead_id === lead.id && order.status !== 'rejected'))
      ) && React.createElement('button', {
        className: 'action-button px-2 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded transition-colors whitespace-nowrap',
        onClick: () => {
          if (window.openPaymentForm) {
            window.openPaymentForm(lead);
          } else {
            console.error('window.openPaymentForm not found');
          }
        },
        title: 'Collect Payment'
      }, '💳'),
      
      // Delete button
      window.hasPermission('leads', 'delete') && React.createElement('button', {
        className: 'action-button px-2 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors whitespace-nowrap',
        onClick: () => {
          if (window.handleDelete) {
            window.handleDelete('leads', lead.id, lead.name);
          } else {
            console.error('window.handleDelete not found');
          }
        },
        title: 'Delete Lead'
      }, '🗑️')
    )
  );
};

// Mobile Inventory Card
window.MobileInventoryCard = function({ item, onClick }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getAvailabilityColor = () => {
    const percentage = (item.available_tickets / item.total_tickets) * 100;
    if (percentage > 50) return 'text-green-600';
    if (percentage > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  return React.createElement('div', {
    className: 'mobile-card'
  },
    // Clickable upper section
    React.createElement('div', {
      className: 'cursor-pointer',
      onClick: () => onClick(item)
    },
      // Event name and date
      React.createElement('div', { className: 'mb-3' },
        React.createElement('h3', {
          className: 'font-semibold text-base text-gray-900 dark:text-white mb-1'
        }, item.event_name),
        React.createElement('p', {
          className: 'text-sm text-gray-600 dark:text-gray-400'
        }, `${formatDate(item.event_date)} • ${item.venue || 'Venue TBD'}`)
      ),

      // Category and availability
      React.createElement('div', {
        className: 'flex items-center justify-between mb-3'
      },
        React.createElement('span', {
          className: 'mobile-badge bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
        }, item.category_of_ticket || 'General'),
        React.createElement('span', {
          className: `text-sm font-medium ${getAvailabilityColor()}`
        }, `${item.available_tickets}/${item.total_tickets} available`)
      ),

      // Price info
      React.createElement('div', {
        className: 'flex items-center justify-between text-sm'
      },
        React.createElement('span', { className: 'text-gray-500 dark:text-gray-400' },
          'Selling Price'
        ),
        React.createElement('span', { className: 'font-semibold text-gray-900 dark:text-white' },
          `${window.formatCurrency(item.selling_price || 0)}`
        )
      ),

      // Sports type badge
      item.sports && React.createElement('div', {
        className: 'mt-3 flex items-center gap-2'
      },
        React.createElement('span', {
          className: 'text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full'
        }, item.sports)
      )
    ),

    // Quick action buttons
    React.createElement('div', {
      className: 'flex items-center gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700'
    },
      // View button
      React.createElement('button', {
        className: 'action-button px-2 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors',
        onClick: () => {
          if (window.openInventoryDetail) {
            window.openInventoryDetail(item);
          } else {
            onClick(item); // Fallback to regular click
          }
        },
        title: 'View Details'
      }, '👁️'),
      
      // Edit button
      window.hasPermission('inventory', 'write') && React.createElement('button', {
        className: 'action-button px-2 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded transition-colors',
        onClick: () => {
          if (window.openEditInventoryForm) {
            window.openEditInventoryForm(item);
          } else if (window.setEditingInventory && window.setShowInventoryForm) {
            window.setEditingInventory(item);
            window.setShowInventoryForm(true);
          }
        },
        title: 'Edit Event'
      }, '✏️'),
      
      // Allocate button
      React.createElement('button', {
        className: 'action-button px-2 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded transition-colors',
        onClick: () => {
          if (window.openAllocationManagement) {
            window.openAllocationManagement(item);
          }
        },
        title: 'Manage Allocations'
      }, '📦'),
      
      // Delete button
      window.hasPermission('inventory', 'delete') && React.createElement('button', {
        className: 'action-button px-2 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors',
        onClick: () => {
          if (window.handleDeleteInventory) {
            window.handleDeleteInventory(item.id);
          } else if (window.handleDelete) {
            window.handleDelete('inventory', item.id, item.event_name);
          }
        },
        title: 'Delete Event'
      }, '🗑️')
    )
  );
};

// Mobile Order Card
window.MobileOrderCard = function({ order, onClick }) {
  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'allocated': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusIcon = (status) => {
    switch(status) {
      case 'paid': return '✅';
      case 'partial': return '⚠️';
      case 'pending': return '⏳';
      default: return '❌';
    }
  };

  return React.createElement('div', {
    className: 'mobile-card'
  },
    // Clickable upper section
    React.createElement('div', {
      className: 'cursor-pointer',
      onClick: () => onClick(order)
    },
      // Order header
      React.createElement('div', {
        className: 'flex items-start justify-between mb-3'
      },
        React.createElement('div', { className: 'flex-1' },
          React.createElement('h3', {
            className: 'font-semibold text-base text-gray-900 dark:text-white mb-1'
          }, order.inventory_name || 'Order #' + order.id?.slice(-6)),
          React.createElement('p', {
            className: 'text-sm text-gray-600 dark:text-gray-400'
          }, order.client_name || 'Unknown Client')
        ),
        React.createElement('span', {
          className: `mobile-badge ${getStatusColor(order.status)}`
        }, order.status?.charAt(0).toUpperCase() + order.status?.slice(1))
      ),

      // Order details
      React.createElement('div', { className: 'space-y-2' },
        // Quantity and amount
        React.createElement('div', { className: 'flex items-center justify-between text-sm' },
          React.createElement('span', { className: 'text-gray-500 dark:text-gray-400' },
            `${order.tickets_allocated || order.quantity || 0} tickets`
          ),
          React.createElement('span', { className: 'font-medium text-gray-900 dark:text-white' },
            `${window.formatCurrency(order.total_amount || 0)}`
          )
        ),

        // Payment status
        React.createElement('div', { className: 'flex items-center justify-between text-sm' },
          React.createElement('span', { className: 'text-gray-500 dark:text-gray-400' },
            'Payment'
          ),
          React.createElement('span', { className: 'flex items-center gap-1' },
            React.createElement('span', null, getPaymentStatusIcon(order.payment_status)),
            React.createElement('span', { 
              className: 'font-medium'
            }, order.payment_status || 'pending')
          )
        )
      ),

      // Assigned to
      order.assigned_to && React.createElement('div', {
        className: 'mt-2 text-xs text-gray-500 dark:text-gray-400'
      }, `Assigned to ${order.assigned_to_name || order.assigned_to}`)
    ),

    // Quick action buttons
    React.createElement('div', {
      className: 'flex items-center gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 overflow-x-auto'
    },
      // Approve button (for pending_approval orders)
      order.status === 'pending_approval' && window.hasPermission('orders', 'approve') &&
      React.createElement('button', {
        className: 'action-button px-2 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded transition-colors whitespace-nowrap',
        onClick: () => {
          if (window.handleApproveOrder) {
            window.handleApproveOrder(order);
          }
        },
        title: 'Approve Order'
      }, '✅'),
      
      // View button
      React.createElement('button', {
        className: 'action-button px-2 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors whitespace-nowrap',
        onClick: () => {
          if (window.openOrderView) {
            window.openOrderView(order);
          } else {
            onClick(order); // Fallback to regular click
          }
        },
        title: 'View Order'
      }, '👁️'),
      
      // Edit button
      window.hasPermission('orders', 'write') && React.createElement('button', {
        className: 'action-button px-2 py-1.5 text-xs font-medium text-yellow-600 bg-yellow-50 hover:bg-yellow-100 rounded transition-colors whitespace-nowrap',
        onClick: () => {
          if (window.openOrderEdit) {
            window.openOrderEdit(order);
          } else if (window.openEditOrderForm) {
            window.openEditOrderForm(order);
          }
        },
        title: 'Edit Order'
      }, '✏️'),
      
      // Invoice button
      window.hasPermission('orders', 'invoice') && React.createElement('button', {
        className: 'action-button px-2 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded transition-colors whitespace-nowrap',
        onClick: () => {
          // Use the same logic as web version for invoice generation
          const isProforma = false; // Regular tax invoice
          
          // For tax invoices that don't have finance invoice number
          if (!isProforma && !order.finance_invoice_number) {
            console.log('📝 Tax invoice needs finance invoice number');
            
            // Check if modal functions are available
            if (window.setCurrentOrderForInvoice && window.setFinanceInvoiceNumber && window.setShowFinanceInvoiceModal) {
              console.log('✅ Opening finance invoice modal');
              window.setCurrentOrderForInvoice(order);
              window.setFinanceInvoiceNumber(order.finance_invoice_number || '');
              window.setShowFinanceInvoiceModal(true);
              return;
            } else {
              console.log('❌ Modal functions not available');
              alert('Finance invoice number is required. Please contact admin.');
              return;
            }
          }
          
          // Show invoice preview
          if (window.openInvoicePreviewDirectly) {
            window.openInvoicePreviewDirectly(order);
          }
        },
        title: 'Generate Invoice'
      }, '📄'),
      
      // Assign button
      window.hasPermission('orders', 'assign') && !order.assigned_to &&
      React.createElement('button', {
        className: 'action-button px-2 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors whitespace-nowrap',
        onClick: () => {
          if (window.handleAssignOrder) {
            window.handleAssignOrder(order);
          } else if (window.openAssignForm) {
            window.openAssignForm(order);
          }
        },
        title: 'Assign Order'
      }, '👤'),
      
      // Generate Premium Journey button
      window.hasPermission('orders', 'write') && window.JourneyGenerator &&
      React.createElement('button', {
        className: 'action-button px-2 py-1.5 text-xs font-medium text-yellow-600 bg-yellow-50 hover:bg-yellow-100 rounded transition-colors whitespace-nowrap',
        onClick: () => {
          console.log('Journey button clicked for order:', order.id);
          
          // Remove any existing modal
          const existing = document.getElementById('journey-modal-container');
          if (existing) existing.remove();
          
          // Create new modal
          const div = document.createElement('div');
          div.id = 'journey-modal-container';
          document.body.appendChild(div);
          
          ReactDOM.render(
            React.createElement(window.JourneyGenerator, {
              order: order,
              onClose: () => {
                ReactDOM.unmountComponentAtNode(div);
                div.remove();
              }
            }),
            div
          );
        },
        title: 'Generate Premium Journey'
      }, '✨'),
      
      // Reassign to original button
      window.hasPermission('orders', 'assign') && order.assigned_to && order.original_assignee &&
      React.createElement('button', {
        className: 'action-button px-2 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded transition-colors whitespace-nowrap',
        onClick: async () => {
          // Reassign to original assignee
          if (confirm(`Reassign this order back to ${order.original_assignee}?`)) {
            try {
              const response = await window.apiCall(`/orders/${order.id}/assign`, {
                method: 'PUT',
                body: JSON.stringify({
                  assigned_to: order.original_assignee,
                  assigned_team: order.original_team || 'sales'
                })
              });
              
              if (response.success) {
                alert('Order reassigned successfully');
                // Refresh the orders list
                if (window.fetchOrders) {
                  window.fetchOrders();
                }
              } else {
                alert('Failed to reassign order: ' + (response.message || 'Unknown error'));
              }
            } catch (error) {
              console.error('Error reassigning order:', error);
              alert('Error reassigning order: ' + error.message);
            }
          }
        },
        title: 'Reassign to Original'
      }, '🔄'),
      
      // Delete button
      window.hasPermission('orders', 'delete') && React.createElement('button', {
        className: 'action-button px-2 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors whitespace-nowrap',
        onClick: () => {
          if (window.handleDeleteOrder) {
            window.handleDeleteOrder(order.id);
          } else if (window.handleDelete) {
            window.handleDelete('orders', order.id, order.inventory_name || `Order #${order.id}`);
          }
        },
        title: 'Delete Order'
      }, '🗑️')
    )
  );
};

// Mobile Delivery Card
window.MobileDeliveryCard = function({ delivery, onClick }) {
  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_transit': 'bg-blue-100 text-blue-800',
      'delivered': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  return React.createElement('div', {
    className: 'mobile-card cursor-pointer',
    onClick: () => onClick(delivery)
  },
    // Header
    React.createElement('div', {
      className: 'flex items-start justify-between mb-3'
    },
      React.createElement('div', { className: 'flex-1' },
        React.createElement('h3', {
          className: 'font-semibold text-base text-gray-900 dark:text-white mb-1'
        }, delivery.order?.inventory_name || 'Delivery #' + delivery.id?.slice(-6)),
        React.createElement('p', {
          className: 'text-sm text-gray-600 dark:text-gray-400'
        }, delivery.client_name || delivery.order?.client_name || 'Unknown Client')
      ),
      React.createElement('span', {
        className: `mobile-badge ${getStatusColor(delivery.status)}`
      }, delivery.status?.replace('_', ' ').charAt(0).toUpperCase() + delivery.status?.slice(1).replace('_', ' '))
    ),

    // Delivery info
    React.createElement('div', { className: 'space-y-2' },
      // Schedule
      React.createElement('div', { className: 'flex items-center justify-between text-sm' },
        React.createElement('span', { className: 'text-gray-500 dark:text-gray-400' },
          '📅 Scheduled'
        ),
        React.createElement('span', { className: 'font-medium text-gray-900 dark:text-white' },
          formatDate(delivery.scheduled_date)
        )
      ),

      // Location
      delivery.delivery_address && React.createElement('div', { 
        className: 'text-sm text-gray-600 dark:text-gray-400 truncate'
      },
        React.createElement('span', null, '📍 '),
        React.createElement('span', null, delivery.delivery_address)
      )
    ),

    // Delivery person
    delivery.delivery_person && React.createElement('div', {
      className: 'mt-2 text-xs text-gray-500 dark:text-gray-400'
    }, `Assigned to ${delivery.delivery_person}`)
  );
};

// Mobile Empty State
window.MobileEmptyState = function({ icon, title, message, action }) {
  return React.createElement('div', {
    className: 'mobile-empty-state'
  },
    React.createElement('div', { className: 'mobile-empty-icon' }, icon || '📭'),
    React.createElement('h3', { className: 'mobile-empty-title' }, title || 'No data found'),
    React.createElement('p', { className: 'mobile-empty-text' }, 
      message || 'Start by adding your first item'
    ),
    action && React.createElement('button', {
      className: 'mobile-button mobile-button-primary',
      onClick: action.onClick
    }, action.label)
  );
};

// Mobile Loading State - Enhanced with logo loader
window.MobileLoadingState = function({ message = 'Loading...' } = {}) {
  return React.createElement('div', {
    className: 'fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900',
    style: { zIndex: 50 }
  },
    React.createElement('div', { className: 'text-center' },
      // Animated logo loader
      React.createElement('div', {
        className: 'relative w-24 h-24 mx-auto mb-4',
        style: {
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }
      },
        React.createElement('img', {
          src: document.documentElement.classList.contains('dark') ? 'images/logo-dark.png' : 'images/logo.png',
          alt: 'Loading...',
          className: 'w-full h-full object-contain',
          style: {
            filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))',
            animation: 'float 3s ease-in-out infinite'
          }
        })
      ),
      React.createElement('p', { 
        className: 'text-sm text-gray-500 dark:text-gray-400',
        style: {
          animation: 'fadeInOut 2s ease-in-out infinite'
        }
      }, message)
    )
  );
};

// Mobile Error State
window.MobileErrorState = function({ error, onRetry }) {
  return React.createElement('div', {
    className: 'mobile-empty-state'
  },
    React.createElement('div', { className: 'mobile-empty-icon' }, '⚠️'),
    React.createElement('h3', { className: 'mobile-empty-title' }, 'Something went wrong'),
    React.createElement('p', { className: 'mobile-empty-text' }, 
      error || 'Failed to load data. Please try again.'
    ),
    onRetry && React.createElement('button', {
      className: 'mobile-button mobile-button-primary',
      onClick: onRetry
    }, 'Retry')
  );
};

console.log('✅ Mobile Cards components loaded');