const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');
const bulkOrderService = require('../services/bulkOrderService');
const admin = require('../config/firebase');
const moment = require('moment-timezone');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// GET /api/bulk-orders/template - Download CSV template
router.get('/template', 
  authenticateToken,
  (req, res) => {
    console.log('🔍 Template endpoint called by:', req.user?.email);
    try {
      const csvContent = `lead_id,lead_name,client_name,client_email,client_phone,customer_type,event_location,payment_currency,payment_method,advance_amount,transaction_id,payment_date,gstin,legal_name,category_of_sale,type_of_sale,gst_rate,registered_address,state_location,is_outside_india,event_name,event_description,quantity,rate,service_fee_amount,inclusions_cost,inclusions_description,notes
LEAD123,John Doe,Vision 11 Sports,john@example.com,9876543210,indian,india,INR,Bank Transfer,100000,NEFT123456,2025-07-24,27AAACV1234M1Z5,Vision 11 Sports Pvt Ltd,corporate,Service Fee,18,123 Business Park Delhi,Delhi,false,IPL 2025 - CSK vs MI,IPL'25 Chennai vs Mumbai Match,2,500000,50000,10000,Team jerseys and VIP lounge access,Premium corporate package
LEAD456,Jane Smith,ABC Corp,jane@example.com,9876543211,foreign,outside_india,USD,Credit Card,5000,CC789012,2025-07-24,,ABC Corporation,retail,Ticket Sale,0,456 Main St New York,New York,true,ICC World Cup Final,ICC World Cup 2025 Final,1,1000,100,0,,International client booking

Instructions:
1. lead_id: REQUIRED - Get from CRM lead details
2. customer_type: indian, foreign
3. event_location: india, outside_india  
4. payment_currency: INR, USD, EUR, GBP, etc.
5. payment_method: Bank Transfer, UPI, Credit Card, Debit Card, Cash, Cheque, Online
6. payment_date: YYYY-MM-DD format
7. category_of_sale: corporate, retail, affiliate, others
8. type_of_sale: Service Fee, Ticket Sale
9. gst_rate: 18 (for service fee), 0 (for foreign/outside india)
10. is_outside_india: true, false
11. All amounts should be numeric (no commas or symbols)
12. Leave gstin empty if not applicable
13. Multiple items not supported in bulk - use rate*quantity for total`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=bulk-order-template.csv');
      res.send(csvContent);
    } catch (error) {
      console.error('Error generating template:', error);
      res.status(500).json({ error: 'Failed to generate template' });
    }
  }
);

// POST /api/bulk-orders/upload - Upload and process orders
router.post('/upload', 
  authenticateToken, 
  upload.single('file'),
  async (req, res) => {
    console.log('🔍 Upload endpoint called by:', req.user?.email);
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      console.log('📁 Processing bulk order upload:', {
        filename: req.file.originalname,
        size: req.file.size,
        uploadedBy: req.user.email
      });

      // Process the CSV file
      const results = await bulkOrderService.processBulkOrders(
        req.file.buffer,
        req.user.email
      );

      // Log the upload
      await admin.firestore().collection('crm_bulk_uploads').add({
        type: 'order',
        filename: req.file.originalname,
        file_size: req.file.size,
        uploaded_by: req.user.email,
        uploaded_at: admin.firestore.FieldValue.serverTimestamp(),
        results: results.summary,
        status: results.summary.failed === 0 ? 'success' : 'partial',
        created_at: moment().tz('Asia/Kolkata').format()
      });

      res.json({
        success: true,
        message: `Processed ${results.summary.total} order records`,
        results: results
      });

    } catch (error) {
      console.error('Bulk order upload error:', error);
      res.status(500).json({ 
        error: 'Failed to process bulk orders',
        details: error.message 
      });
    }
  }
);

// GET /api/bulk-orders/history - Get upload history
router.get('/history', 
  authenticateToken,
  async (req, res) => {
    console.log('🔍 History endpoint called by:', req.user?.email);
    try {
      const { limit = 10, offset = 0 } = req.query;
      const db = admin.firestore();

      const snapshot = await db.collection('crm_bulk_uploads')
        .where('type', '==', 'order')
        .orderBy('uploaded_at', 'desc')
        .limit(parseInt(limit))
        .offset(parseInt(offset))
        .get();

      const uploads = [];
      snapshot.forEach(doc => {
        uploads.push({
          id: doc.id,
          ...doc.data()
        });
      });

      res.json({
        success: true,
        uploads,
        total: uploads.length
      });

    } catch (error) {
      console.error('Error fetching upload history:', error);
      res.status(500).json({ error: 'Failed to fetch upload history' });
    }
  }
);

// POST /api/bulk-orders/validate - Validate CSV without processing
router.post('/validate',
  authenticateToken,
  upload.single('file'),
  async (req, res) => {
    console.log('🔍 Validate endpoint called by:', req.user?.email);
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { summary, validationResults } = await bulkOrderService.validateBulkOrdersCsv(
        req.file.buffer
      );

      res.json({
        success: true,
        summary,
        validationResults,
        canProceed: summary.invalid === 0
      });

    } catch (error) {
      console.error('Validation error:', error);
      res.status(500).json({ error: 'Failed to validate file' });
    }
  }
);

// GET /api/bulk-orders/sample-data - Get sample lead IDs for testing
router.get('/sample-data', 
  authenticateToken,
  async (req, res) => {
    console.log('🔍 Sample Data endpoint called by:', req.user?.email);
    try {
      const db = admin.firestore();
      
      // Get 5 sample leads that don't have orders yet
      const snapshot = await db.collection('crm_leads')
        .where('status', 'in', ['new', 'quoted', 'negotiation'])
        .limit(5)
        .get();

      const sampleLeads = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        sampleLeads.push({
          lead_id: doc.id,
          lead_name: data.lead_name,
          lead_email: data.lead_email,
          lead_phone: data.lead_phone,
          event_name: data.event_name,
          event_date: data.event_date,
          status: data.status
        });
      });

      res.json({
        success: true,
        sampleLeads,
        message: 'Use these lead IDs in your CSV file for testing'
      });

    } catch (error) {
      console.error('Error fetching sample data:', error);
      res.status(500).json({ error: 'Failed to fetch sample data' });
    }
  }
);

module.exports = router;