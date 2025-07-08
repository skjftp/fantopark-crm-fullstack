// Status Configuration - All status definitions and related utilities
window.ORDER_STATUSES = {
  pending_approval: { 
    label: 'Pending Approval', 
    color: 'bg-yellow-100 text-yellow-800', 
    next: ['approved', 'rejected'] 
  },
  approved: { 
    label: 'Approved', 
    color: 'bg-green-100 text-green-800', 
    next: ['service_assigned'] 
  },
  service_assigned: { 
    label: 'Service Assigned', 
    color: 'bg-blue-100 text-blue-800', 
    next: ['completed'] 
  },
  completed: { 
    label: 'Completed', 
    color: 'bg-gray-100 text-gray-800', 
    next: [] 
  },
  rejected: { 
    label: 'Rejected', 
    color: 'bg-red-100 text-red-800', 
    next: [] 
  }
};

// Status Icons
window.getStatusIcon = (status) => {
  const statusIcons = {
    'qualified': '✅',
    'junk': '🗑️',
    'hot': '🔥',
    'warm': '🌤️',
    'cold': '❄️',
    'quote_requested': '📋',
    'converted': '💰',
    'dropped': '❌',
    'pickup_later': '⏰',
    'contacted': '📞',
    'attempt_1': '📞¹',
    'attempt_2': '📞²',
    'attempt_3': '📞³',
    'payment': '💳',
    'payment_post_service': '📅',
    'payment_received': '✅'
  };
  return statusIcons[status] || '📝';
};

console.log('✅ Status configurations loaded');
