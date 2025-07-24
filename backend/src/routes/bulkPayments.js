const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateToken, checkPermission } = require('../middleware/auth');
const bulkPaymentService = require('../services/bulkPaymentService');
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

// GET /api/bulk-payments/template - Download CSV template
router.get('/template', 
  authenticateToken,
  (req, res, next) => {
    // Allow both finance managers and supply_sales_service_manager
    if (req.user.role === 'supply_sales_service_manager' || 
        req.user.role === 'super_admin' ||
        (req.user.permissions && req.user.permissions.finance && req.user.permissions.finance.manage)) {
      return next();
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  (req, res) => {
  try {
    const csvContent = `lead_id,lead_name,lead_email,lead_phone,event_name,event_date,payment_date,payment_amount,payment_mode,bank_name,transaction_id,cheque_number,invoice_numbers,invoice_amounts,taxes,discount,processing_fee,total_amount,payment_status,payment_proof_url,collected_by,branch,notes
LEAD123,John Doe,john@example.com,9876543210,IPL 2025 - CSK vs MI,2025-04-15,2025-07-24,50000,UPI,HDFC Bank,UPI123456789,,"INV-001,INV-002","25000,25000","4500,4500",2000,500,58000,Full Payment,,Amisha,Mumbai,Payment for 2 premium tickets
LEAD456,Jane Smith,jane@example.com,9876543211,ICC World Cup Final,2025-06-20,2025-07-24,75000,Bank Transfer,ICICI Bank,NEFT987654321,,INV-003,75000,13500,5000,1000,84500,Full Payment,https://drive.google.com/payment1.pdf,Sumit,Delhi,Corporate booking

Instructions:
1. lead_id is REQUIRED - Get this from the CRM lead details page
2. payment_date format: YYYY-MM-DD
3. payment_mode options: UPI, Bank Transfer, Credit Card, Debit Card, Cash, Cheque, Online
4. For multiple invoices: Use comma-separated values in invoice_numbers and invoice_amounts
5. payment_status options: Full Payment, Partial Payment
6. Leave cheque_number empty for non-cheque payments
7. All amounts should be numeric values (no commas or currency symbols)`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=payment-upload-template.csv');
    res.send(csvContent);
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

// POST /api/bulk-payments/upload - Upload and process payments
router.post('/upload', 
  authenticateToken, 
  (req, res, next) => {
    // Allow both finance managers and supply_sales_service_manager
    if (req.user.role === 'supply_sales_service_manager' || 
        req.user.role === 'super_admin' ||
        (req.user.permissions && req.user.permissions.finance && req.user.permissions.finance.manage)) {
      return next();
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      console.log('📁 Processing bulk payment upload:', {
        filename: req.file.originalname,
        size: req.file.size,
        uploadedBy: req.user.email
      });

      // Process the CSV file
      const results = await bulkPaymentService.processBulkPayments(
        req.file.buffer,
        req.user.email
      );

      // Log the upload
      await admin.firestore().collection('crm_bulk_uploads').add({
        type: 'payment',
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
        message: `Processed ${results.summary.total} payment records`,
        results: results
      });

    } catch (error) {
      console.error('Bulk payment upload error:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to process payment upload',
        details: error.stack
      });
    }
  }
);

// GET /api/bulk-payments/history - Get upload history
router.get('/history', 
  authenticateToken,
  (req, res, next) => {
    // Allow both finance managers and supply_sales_service_manager
    if (req.user.role === 'supply_sales_service_manager' || 
        req.user.role === 'super_admin' ||
        (req.user.permissions && req.user.permissions.finance && req.user.permissions.finance.view)) {
      return next();
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async (req, res) => {
    try {
      const { limit = 10, offset = 0 } = req.query;
      const db = admin.firestore();

      const snapshot = await db.collection('crm_bulk_uploads')
        .where('type', '==', 'payment')
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

// GET /api/bulk-payments/validate - Validate CSV without processing
router.post('/validate',
  authenticateToken,
  (req, res, next) => {
    // Allow both finance managers and supply_sales_service_manager
    if (req.user.role === 'supply_sales_service_manager' || 
        req.user.role === 'super_admin' ||
        (req.user.permissions && req.user.permissions.finance && req.user.permissions.finance.manage)) {
      return next();
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const rows = await bulkPaymentService.parseCSV(req.file.buffer);
      const validationResults = [];
      const leadIds = new Set();

      // Validate each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const validation = bulkPaymentService.validateRow(row, i);
        
        // Check for duplicate lead IDs in the file
        if (row.lead_id && leadIds.has(row.lead_id)) {
          validation.errors.push(`Duplicate lead ID in file: ${row.lead_id}`);
          validation.isValid = false;
        }
        leadIds.add(row.lead_id);

        // Check if lead exists in database
        if (row.lead_id) {
          const leadDoc = await admin.firestore()
            .collection('crm_leads')
            .doc(row.lead_id)
            .get();
          
          if (!leadDoc.exists) {
            validation.errors.push(`Lead not found: ${row.lead_id}`);
            validation.isValid = false;
          }
        }

        validationResults.push({
          row: validation.rowNumber,
          lead_id: row.lead_id,
          isValid: validation.isValid,
          errors: validation.errors,
          data: row
        });
      }

      const summary = {
        total: rows.length,
        valid: validationResults.filter(r => r.isValid).length,
        invalid: validationResults.filter(r => !r.isValid).length
      };

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

// GET /api/bulk-payments/sample-data - Get sample lead IDs for testing
router.get('/sample-data', 
  authenticateToken,
  (req, res, next) => {
    // Allow both finance managers and supply_sales_service_manager
    if (req.user.role === 'supply_sales_service_manager' || 
        req.user.role === 'super_admin' ||
        (req.user.permissions && req.user.permissions.finance && req.user.permissions.finance.view)) {
      return next();
    }
    return res.status(403).json({ error: 'Access denied' });
  },
  async (req, res) => {
    try {
      const db = admin.firestore();
      
      // Get 5 sample leads that don't have orders yet
      const leadsSnapshot = await db.collection('crm_leads')
        .where('status', 'in', ['quote_requested', 'quote_sent', 'negotiation'])
        .limit(5)
        .get();

      const sampleLeads = [];
      leadsSnapshot.forEach(doc => {
        const lead = doc.data();
        sampleLeads.push({
          lead_id: doc.id,
          lead_name: lead.name,
          lead_email: lead.email,
          lead_phone: lead.phone,
          event_name: lead.event_name || 'N/A',
          status: lead.status
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