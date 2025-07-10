// Delete Handler Component for FanToPark CRM
// Extracted from index.html - maintains 100% functionality
// Uses window.* globals for CDN-based React compatibility

window.renderDeleteHandler = () => {
  // This component provides the handleDelete function to the global scope
  // The function is attached to window object for use by delete buttons

  window.handleDelete = async (type, id, name) => {
    console.log("handleDelete called:", type, id, name);
    
    const modulePermissions = {
      'leads': 'leads',
      'inventory': 'inventory',
      'orders': 'orders'
    };

    if (!window.hasPermission(modulePermissions[type], 'delete')) {
      alert('You do not have permission to delete ' + (type));
      return;
    }

    if (!confirm('Are you sure you want to delete ' + (name) + '?')) return;

    window.setLoading(true);
    
    try {
      // Special handling for orders - convert delete to cancel
      console.log("Processing order deletion as cancellation");
      
      if (type === 'orders') {
        console.log("Deleting order permanently");
        
        try {
          // Actually delete the order
          await window.apiCall('/' + (type) + '/' + (id), {
            method: 'DELETE'
          });

          // If successful, remove from local state
          window.setOrders(prev => prev.filter(order => order.id !== id));
          window.setLoading(false);
          alert('Order deleted successfully!');
          
        } catch (deleteError) {
          console.error("Delete failed:", deleteError);
          console.log("Delete error details:", deleteError.message, deleteError.status);
          
          // If backend doesn't support DELETE, mark as deleted instead
          if (deleteError.message && (deleteError.message.includes('404') || deleteError.message.includes('405'))) {
            console.log("Backend doesn't support DELETE, marking as deleted");
            
            try {
              await window.apiCall('/orders/' + (id), {
                method: 'PUT',
                body: JSON.stringify({
                  status: 'deleted',
                  deleted_date: new Date().toISOString(),
                  deleted_by: window.user?.name || 'Admin',
                  is_deleted: true
                })
              });

              // Remove from local view
              window.setOrders(prev => prev.filter(order => order.id !== id));
              alert('Order marked as deleted successfully!');
              return;
              
            } catch (putError) {
              console.error("PUT also failed:", putError);
            }
          }

          // If DELETE not supported, remove locally with warning
          window.setOrders(prev => prev.filter(order => order.id !== id));
          window.setLoading(false);
          alert('Order removed. Note: This may reappear on refresh if server delete is not supported.');
        }

        window.setLoading(false);
        alert('Order cancelled successfully!');
        
      } else {
        // For leads and inventory, try actual DELETE
        try {
          console.log("Making API call to:", '/' + (type) + '/' + (id));
          
          await window.apiCall('/' + (type) + '/' + (id), {
            method: 'DELETE'
          });

          // If successful, update local state
          switch (type) {
            case 'leads':
              window.setLeads(prev => prev.filter(item => item.id !== id));
              break;
            case 'inventory':
              window.setInventory(prev => prev.filter(item => item.id !== id));
              break;
          }

          window.setLoading(false);
          alert((type === 'inventory' ? 'Event' : type.slice(0, -1)) + ' deleted successfully!');
          
        } catch (deleteError) {
          // If DELETE fails, just remove from local state with warning
          switch (type) {
            case 'leads':
              window.setLeads(prev => prev.filter(item => item.id !== id));
              break;
            case 'inventory':
              window.setInventory(prev => prev.filter(item => item.id !== id));
              break;
          }

          window.setLoading(false);
          alert((type === 'inventory' ? 'Event' : type.slice(0, -1)) + ' removed locally. May reappear on refresh if server delete is not supported.');
        }
      }
      
    } catch (error) {
      window.setLoading(false);
      alert('Failed to process ' + (type === 'inventory' ? 'event' : type.slice(0, -1)) + ': ' + (error.message));
    }
  };

  // This component doesn't render anything - it just provides the function
  return null;
};

console.log('✅ Delete Handler component loaded successfully');
