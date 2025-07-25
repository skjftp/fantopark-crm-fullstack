// API Configuration
window.API_CONFIG = {
  // Always use production backend
  API_URL: "https://fantopark-backend-150582227311.us-central1.run.app/api",
  
  UPLOAD_URL_FUNCTION: 'https://asia-south1-enduring-wharf-464005-h7.cloudfunctions.net/getSignedUploadUrl',
  READ_URL_FUNCTION: 'https://asia-south1-enduring-wharf-464005-h7.cloudfunctions.net/getSignedReadUrl'
};

// Lead Statuses
// Lead Statuses - Complete Definition
window.LEAD_STATUSES = {
  unassigned: { 
    label: 'Unassigned', 
    color: 'bg-gray-100 text-gray-800', 
    next: ['assigned', 'attempt_1', 'attempt_2', 'attempt_3'] 
  },
  assigned: { 
    label: 'Assigned', 
    color: 'bg-blue-100 text-blue-800', 
    next: ['contacted', 'attempt_1', 'attempt_2', 'attempt_3'] 
  },
  contacted: { 
    label: 'Contacted', 
    color: 'bg-yellow-100 text-yellow-800', 
    next: ['qualified', 'junk', 'pickup_later']
  },
  attempt_1: { 
    label: 'Attempt 1', 
    color: 'bg-yellow-50 text-yellow-700', 
    next: ['contacted', 'attempt_2', 'junk', 'pickup_later']
  },
  attempt_2: { 
    label: 'Attempt 2', 
    color: 'bg-orange-50 text-orange-700', 
    next: ['contacted', 'attempt_3', 'junk', 'pickup_later']
  },
  attempt_3: { 
    label: 'Attempt 3', 
    color: 'bg-red-50 text-red-700', 
    next: ['contacted', 'junk', 'pickup_later']
  },
  qualified: { 
    label: 'Qualified', 
    color: 'bg-green-100 text-green-800', 
    next: ['hot', 'warm', 'cold', 'pickup_later']
  },
  junk: { 
    label: 'Junk', 
    color: 'bg-red-100 text-red-800', 
    next: [] 
  },
  hot: { 
    label: 'Hot Lead', 
    color: 'bg-red-100 text-red-800', 
    next: ['quote_requested', 'converted', 'dropped', 'pickup_later'],
    temperature: 'hot'
  },
  warm: { 
    label: 'Warm Lead', 
    color: 'bg-orange-100 text-orange-800', 
    next: ['quote_requested', 'converted', 'dropped', 'pickup_later'],
    temperature: 'warm'
  },
  cold: { 
    label: 'Cold Lead', 
    color: 'bg-blue-100 text-blue-800', 
    next: ['quote_requested', 'converted', 'dropped', 'pickup_later'],
    temperature: 'cold'
  },
  quote_requested: {
    label: 'Quote Requested',
    color: 'bg-purple-100 text-purple-800',
    next: ['quote_received'],
    parallel: true
  },
    quote_received: {
    label: 'Quote Received',
    color: 'bg-purple-100 text-purple-800',
    next: ['converted', 'dropped', 'pickup_later'],
    parallel: true
  },
  converted: { 
    label: 'Converted', 
    color: 'bg-green-100 text-green-800', 
    next: ['payment', 'payment_post_service', 'payment_received', 'pickup_later']
  },
  // ADD THIS NEW STATUS
  generate_proforma: {
    label: 'Generate Proforma Invoice',
    color: 'bg-purple-100 text-purple-800',
    next: ['converted', 'payment'],
    is_action: true  // This indicates it's an action, not a status change
  },
  payment_received: { 
    label: 'Payment Received', 
    color: 'bg-green-100 text-green-800', 
    next: [] 
  },
  dropped: { 
    label: 'Dropped', 
    color: 'bg-gray-100 text-gray-800', 
    next: ['pickup_later']
  },
  payment: { 
    label: 'Payment Received',
    color: 'bg-emerald-100 text-emerald-800', 
    next: [] 
  },
  payment_post_service: {
    label: 'Payment Post Service',
    color: 'bg-purple-100 text-purple-800',
    next: ['payment']
  },
  pickup_later: {
    label: 'Pick Up Later',
    color: 'bg-indigo-100 text-indigo-800',
    next: ['contacted', 'qualified', 'hot', 'warm', 'cold', 'quote_requested', 'converted', 'dropped'],
    requires_followup_date: true
  }
};
console.log('✅ Constants loaded');
