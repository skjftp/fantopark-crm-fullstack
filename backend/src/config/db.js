const { Firestore } = require('@google-cloud/firestore');

const db = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT
});

// Collection names matching v4working
const collections = {
  users: 'crm_users',
  leads: 'crm_leads',
  inventory: 'crm_inventory',
  orders: 'crm_orders',
  invoices: 'crm_invoices',
  deliveries: 'crm_deliveries',
  receivables: 'crm_receivables',
  emailNotifications: 'crm_email_notifications'
};

module.exports = { db, collections };
