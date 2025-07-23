// Sales Person Edit Modal Component
// Allows editing sales person assignment with dropdown selection

(function() {
  'use strict';
  
  // Use direct console to bypass logger filtering
  if (window.console && window.console.log) {
    window.console.log('🚀 Loading sales-person-edit-modal.js...');
  }
  
  // Also try to use logger if available
  if (window.logger && window.logger.success) {
    window.logger.success('Loading sales-person-edit-modal.js');
  }

  // Define the show function FIRST, outside of try block
  window.showSalesPersonEditModal = (order) => {
    console.log('showSalesPersonEditModal called with order:', order);
    console.log('Available setters:', {
      setShowSalesPersonEditModal: !!window.setShowSalesPersonEditModal,
      setCurrentOrderForSalesPersonEdit: !!window.setCurrentOrderForSalesPersonEdit,
      appState: !!window.appState
    });
    
    // Try multiple times to ensure state setters are available
    const tryShowModal = (attempts = 0) => {
      if (window.setShowSalesPersonEditModal && window.setCurrentOrderForSalesPersonEdit) {
        window.setCurrentOrderForSalesPersonEdit(order);
        window.setShowSalesPersonEditModal(true);
        console.log('✅ Modal state setters called successfully');
      } else if (attempts < 10) {
        console.log(`⏳ Waiting for state setters... attempt ${attempts + 1}`);
        setTimeout(() => tryShowModal(attempts + 1), 100);
      } else {
        console.error('❌ State setters not available after 10 attempts');
        // Fallback to prompt
        const salesPerson = prompt('Enter sales person email:', order.sales_person || '');
        if (salesPerson !== null) {
          window.updateOrderSalesPerson(order.id, salesPerson);
        }
      }
    };
    
    tryShowModal();
  };

  try {
    // Create a proper React component
    const SalesPersonEditModal = () => {
      const {
        showSalesPersonEditModal = false,
        currentOrderForSalesPersonEdit = null,
        users = window.users || [],
        loading = false
      } = window.appState || {};

      // Use state hook at component level
      const [selectedSalesPerson, setSelectedSalesPerson] = React.useState(
        currentOrderForSalesPersonEdit?.sales_person || ''
      );

      // Update selected person when order changes
      React.useEffect(() => {
        if (currentOrderForSalesPersonEdit) {
          setSelectedSalesPerson(currentOrderForSalesPersonEdit.sales_person || '');
        }
      }, [currentOrderForSalesPersonEdit]);

      // Debug logging
      React.useEffect(() => {
        if (showSalesPersonEditModal) {
          console.log('Sales Person Edit Modal - Debug:', {
            showSalesPersonEditModal,
            currentOrderForSalesPersonEdit,
            usersCount: users.length,
            windowUsers: window.users?.length,
            appStateUsers: window.appState?.users?.length
          });
        }
      }, [showSalesPersonEditModal]);

      if (!showSalesPersonEditModal || !currentOrderForSalesPersonEdit) {
        return null;
      }

      // Filter users for sales roles
      const salesUsers = users.filter(u => 
        ['sales_executive', 'sales_manager', 'supply_sales_service_manager'].includes(u.role) && 
        u.status === 'active'
      ).sort((a, b) => a.name.localeCompare(b.name));

  const handleClose = () => {
    if (window.setShowSalesPersonEditModal) {
      window.setShowSalesPersonEditModal(false);
    }
    if (window.setCurrentOrderForSalesPersonEdit) {
      window.setCurrentOrderForSalesPersonEdit(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSalesPerson) {
      alert('Please select a sales person');
      return;
    }

    if (window.updateOrderSalesPerson) {
      await window.updateOrderSalesPerson(currentOrderForSalesPersonEdit.id, selectedSalesPerson);
      handleClose();
    }
  };

  return React.createElement('div', {
    className: 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full',
    style: { zIndex: 9999 },
    onClick: handleClose
  },
    React.createElement('div', {
      className: 'relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white',
      style: { zIndex: 10000 },
      onClick: (e) => e.stopPropagation()
    },
      React.createElement('div', { className: 'mt-3 text-center' },
        React.createElement('h3', { 
          className: 'text-lg leading-6 font-medium text-gray-900 mb-4' 
        }, 'Edit Sales Person'),
        
        React.createElement('div', { className: 'mt-4' },
          React.createElement('label', { 
            className: 'block text-sm font-medium text-gray-700 text-left mb-2' 
          }, 'Select Sales Person'),
          
          React.createElement('select', {
            value: selectedSalesPerson,
            onChange: (e) => setSelectedSalesPerson(e.target.value),
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            disabled: loading
          },
            React.createElement('option', { value: '' }, 'Select Sales Person'),
            salesUsers.map(user => 
              React.createElement('option', { 
                key: user.id || user.email, 
                value: user.email 
              }, `${user.name} (${user.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())})`)
            )
          )
        ),

        React.createElement('div', { className: 'mt-6 flex justify-end gap-3' },
          React.createElement('button', {
            className: 'px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400',
            onClick: handleClose,
            disabled: loading
          }, 'Cancel'),
          
          React.createElement('button', {
            className: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50',
            onClick: handleSubmit,
            disabled: loading || !selectedSalesPerson
          }, loading ? 'Updating...' : 'Update')
        )
      )
    )
  );
    };

    // Assign the component to the window render function
    window.renderSalesPersonEditModal = () => React.createElement(SalesPersonEditModal);

    // Match the pattern of other successful component loads
    console.log('✅ Sales Person Edit Modal Component loaded');
    
  } catch (error) {
    console.error('❌ Error loading sales-person-edit-modal.js:', error);
  }
})();

// Also add at the very end to ensure it's available
console.log('✅ Sales Person Edit Modal Component loaded');
console.log('showSalesPersonEditModal function available:', typeof window.showSalesPersonEditModal === 'function');

// Protect the function from being overwritten
Object.defineProperty(window, 'showSalesPersonEditModal', {
  writable: false,
  configurable: false,
  value: window.showSalesPersonEditModal
});

// Add a watcher to see if something tries to delete it
let checkInterval = setInterval(() => {
  if (!window.showSalesPersonEditModal) {
    console.error('❌ showSalesPersonEditModal was deleted!');
    clearInterval(checkInterval);
  }
}, 1000);