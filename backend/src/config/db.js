const { Firestore } = require('@google-cloud/firestore');

// Initialize Firestore with support for multiple credential methods
let db;

if (process.env.GOOGLE_CREDENTIALS_BASE64) {
  // Option 1: Base64 encoded credentials (good for CI/CD)
  try {
    const credentialsJSON = Buffer.from(
      process.env.GOOGLE_CREDENTIALS_BASE64, 
      'base64'
    ).toString('utf-8');
    
    const credentials = JSON.parse(credentialsJSON);
    
    db = new Firestore({
      projectId: process.env.GOOGLE_CLOUD_PROJECT || credentials.project_id,
      credentials: credentials
    });
    console.log('🔐 Using base64 encoded credentials');
  } catch (error) {
    console.error('❌ Failed to parse base64 credentials:', error.message);
    throw error;
  }
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  // Option 2: Path to service account JSON file
  db = new Firestore({
    projectId: process.env.GOOGLE_CLOUD_PROJECT
  });
  console.log('🔐 Using service account file:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
} else {
  // Option 3: Default credentials (gcloud auth or Cloud Run/GKE)
  db = new Firestore({
    projectId: process.env.GOOGLE_CLOUD_PROJECT
  });
  console.log('🔐 Using default application credentials');
}

// Collection names matching v4working
const collections = {
  users: 'crm_users',
  leads: 'crm_leads',
  inventory: 'crm_inventory',
  events: 'crm_events', // Add this line
  orders: 'crm_orders',
  invoices: 'crm_invoices',
  allocations: 'crm_allocations',
  deliveries: 'crm_deliveries',
  receivables: 'crm_receivables',
  payables: 'crm_payables',
  emailNotifications: 'crm_email_notifications',
  roles: 'crm_roles'
};

module.exports = { db, collections };
