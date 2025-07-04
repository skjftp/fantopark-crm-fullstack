const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const { authenticateToken } = require('../middleware/auth');
const csv = require('csv-parser');
const { Readable } = require('stream');
const Lead = require('../models/Lead');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const XLSX = require('xlsx'); // EXCEL SUPPORT

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT
});
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME || 'fantopark-crm-uploads');

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Enhanced multer configuration for CSV and Excel files
const csvUpload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const isCSV = file.mimetype === 'text/csv' || file.originalname.endsWith('.csv');
    const isExcel = allowedTypes.includes(file.mimetype) || 
                   file.originalname.endsWith('.xlsx') || 
                   file.originalname.endsWith('.xls');
    
    if (isCSV || isExcel) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  }
});

// Helper function to parse both CSV and Excel files
const parseUploadedFile = (fileBuffer, filename) => {
  return new Promise((resolve, reject) => {
    try {
      if (filename.endsWith('.csv')) {
        // Parse CSV
        const results = [];
        const stream = Readable.from(fileBuffer.toString());
        stream
          .pipe(csv())
          .on('data', (row) => results.push(row))
          .on('end', () => resolve(results))
          .on('error', reject);
      } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
        // Parse Excel
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } else {
        reject(new Error('Unsupported file format'));
      }
    } catch (error) {
      reject(error);
    }
  });
};

// POST upload file
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const file = bucket.file(fileName);
    
    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype
      }
    });
    
    stream.on('error', (err) => {
      res.status(500).json({ error: err.message });
    });
    
    stream.on('finish', async () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      res.json({ data: { url: publicUrl, fileName } });
    });
    
    stream.end(req.file.buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST bulk upload leads from CSV/Excel - ENHANCED VERSION
router.post('/leads/csv', authenticateToken, csvUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('📁 File received:', req.file.originalname, 'Type:', req.file.mimetype);

    // Parse the file (CSV or Excel)
    const results = await parseUploadedFile(req.file.buffer, req.file.originalname);
    console.log('📊 Parsed rows:', results.length);

    const errors = [];
    let successCount = 0;
    let errorCount = 0;

    for (const [index, row] of results.entries()) {
      try {
        // Get the assigned_to value and handle empty/invalid assignments
        const assignedToValue = row.assigned_to || row['Assigned To'] || '';
        
        // Map columns to lead fields
        const leadData = {
          name: row.name || row.Name || '',
          email: row.email || row.Email || '',
          phone: row.phone || row.Phone || '',
          company: row.company || row.Company || '',
          source: row.source || row.Source || '',
          date_of_enquiry: row.date_of_enquiry || row['Date of Enquiry'] || new Date().toISOString(),
          first_touch_base_done_by: row.first_touch_base_done_by || row['First Touch Base Done By'] || '',
          city_of_residence: row.city_of_residence || row['City of Residence'] || '',
          country_of_residence: row.country_of_residence || row['Country of Residence'] || 'India',
          lead_for_event: row.lead_for_event || row['Lead for Event'] || '',
          number_of_people: parseInt(row.number_of_people || row['Number of People'] || '1'),
          has_valid_passport: row.has_valid_passport || row['Has Valid Passport'] || 'Not Sure',
          visa_available: row.visa_available || row['Visa Available'] || 'Not Required',
          attended_sporting_event_before: row.attended_sporting_event_before || row['Attended Sporting Event Before'] || 'No',
          annual_income_bracket: row.annual_income_bracket || row['Annual Income Bracket'] || '',
          potential_value: parseFloat(row.potential_value || row['Potential Value'] || '0'),
          
          // FIX: Properly handle assignment status
          status: assignedToValue.trim() === '' || assignedToValue === '0' ? 'unassigned' : 'assigned',
          assigned_to: assignedToValue.trim() === '' || assignedToValue === '0' ? null : assignedToValue,
          
          last_quoted_price: parseFloat(row.last_quoted_price || row['Last Quoted Price'] || '0'),
          notes: row.notes || row.Notes || ''
        };

        // Validate required fields
        if (!leadData.name || !leadData.email || !leadData.phone) {
          errors.push({
            row: index + 2,
            error: 'Missing required fields (name, email, or phone)'
          });
          errorCount++;
          continue;
        }

        // Additional validation: Check if assigned_to is a valid email when provided
        if (leadData.assigned_to && !leadData.assigned_to.includes('@')) {
          errors.push({
            row: index + 2,
            error: 'Assigned To must be a valid email address'
          });
          errorCount++;
          continue;
        }

        const lead = new Lead(leadData);
        await lead.save();
        successCount++;
      } catch (error) {
        errors.push({
          row: index + 2,
          error: error.message
        });
        errorCount++;
      }
    }

    res.json({
      success: true,
      message: `Import completed. ${successCount} leads imported successfully, ${errorCount} failed.`,
      totalProcessed: results.length,
      successCount,
      errorCount,
      errors: errors.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST bulk upload inventory from CSV/Excel - ENHANCED VERSION
router.post('/inventory/csv', authenticateToken, csvUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('📁 Inventory file received:', req.file.originalname, 'Type:', req.file.mimetype);

    // Parse the file (CSV or Excel)
    const results = await parseUploadedFile(req.file.buffer, req.file.originalname);
    console.log('📊 Parsed inventory rows:', results.length);

    const errors = [];
    let successCount = 0;
    let errorCount = 0;

    for (const [index, row] of results.entries()) {
      try {
        // DIRECT field mapping
        const inventoryData = {
          // Basic Event Information
          event_name: row.event_name || row['Event Name'] || '',
          event_date: row.event_date || row['Event Date'] || '',
          event_type: row.event_type || row['Event Type'] || '',
          sports: row.sports || row.Sports || '',
          venue: row.venue || row.Venue || '',
          day_of_match: row.day_of_match || row['Day of Match'] || 'Not Applicable',
          
          // Ticket Details
          category_of_ticket: row.category_of_ticket || row['Category of Ticket'] || '',
          stand: row.stand || row['Stand/Section'] || row['Stand'] || '',
          total_tickets: parseInt(row.total_tickets || row['Total Tickets'] || '0'),
          available_tickets: parseInt(row.available_tickets || row['Available Tickets'] || '0'),
          
          // Pricing Information
          mrp_of_ticket: parseFloat(row.mrp_of_ticket || row['MRP of Ticket'] || '0'),
          buying_price: parseFloat(row.buying_price || row['Buying Price'] || '0'),
          selling_price: parseFloat(row.selling_price || row['Selling Price'] || '0'),
          
          // Additional Information
          inclusions: row.inclusions || row['Inclusions'] || '',
          booking_person: row.booking_person || row['Booking Person'] || '',
          procurement_type: row.procurement_type || row['Procurement Type'] || 'pre_inventory',
          notes: row.notes || row['Notes'] || '',
          
          // PAYMENT INFORMATION
          paymentStatus: row.paymentStatus || row['Payment Status'] || 'pending',
          supplierName: row.supplierName || row['Supplier Name'] || '',
          supplierInvoice: row.supplierInvoice || row['Supplier Invoice'] || '',
          purchasePrice: parseFloat(row.purchasePrice || row['Purchase Price'] || '0'),
          totalPurchaseAmount: parseFloat(row.totalPurchaseAmount || row['Total Purchase Amount'] || '0'),
          amountPaid: parseFloat(row.amountPaid || row['Amount Paid'] || '0'),
          paymentDueDate: row.paymentDueDate || row['Payment Due Date'] || '',
          
          // System fields
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString(),
          created_by: req.user.name || 'Excel/CSV Import'
        };

        // Auto-calculate missing values
        if (!inventoryData.totalPurchaseAmount && inventoryData.buying_price && inventoryData.total_tickets) {
          inventoryData.totalPurchaseAmount = inventoryData.buying_price * inventoryData.total_tickets;
        }

        // Validate required fields
        if (!inventoryData.event_name || !inventoryData.event_date || !inventoryData.venue) {
          errors.push({
            row: index + 2,
            error: 'Missing required fields (Event Name, Event Date, or Venue)'
          });
          errorCount++;
          continue;
        }

        // SAVE DIRECTLY TO DATABASE
        const { db } = require('../config/db');
        const docRef = await db.collection('crm_inventory').add(inventoryData);
        
        // Create payable if needed
        if ((inventoryData.paymentStatus === 'pending' || inventoryData.paymentStatus === 'partial') && inventoryData.totalPurchaseAmount > 0) {
          const totalAmount = parseFloat(inventoryData.totalPurchaseAmount) || 0;
          const amountPaid = parseFloat(inventoryData.amountPaid) || 0;
          const pendingBalance = totalAmount - amountPaid;
          
          if (pendingBalance > 0) {
            const payableData = {
              inventoryId: docRef.id,
              supplierName: inventoryData.supplierName || 'Unknown Supplier',
              eventName: inventoryData.event_name,
              invoiceNumber: inventoryData.supplierInvoice || 'INV-' + Date.now(),
              amount: pendingBalance,
              dueDate: inventoryData.paymentDueDate || null,
              status: 'pending',
              created_date: new Date().toISOString(),
              createdBy: req.user.id,
              description: `Payment for inventory: ${inventoryData.event_name}`
            };
            
            await db.collection('crm_payables').add(payableData);
          }
        }
        
        successCount++;
      } catch (error) {
        errors.push({
          row: index + 2,
          error: error.message
        });
        errorCount++;
      }
    }

    res.json({
      success: true,
      message: `Import completed. ${successCount} inventory items imported successfully, ${errorCount} failed.`,
      totalProcessed: results.length,
      successCount,
      errorCount,
      errors: errors.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET endpoint to generate Excel files with actual dropdown validation
router.get('/sample/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    
    if (type === 'leads') {
      // Fetch active sales users
      const users = await User.find({ status: 'active' });
      const salesUsers = users.filter(u => ['sales_executive', 'sales_manager'].includes(u.role));
      const validAssignees = salesUsers.map(u => u.email);
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Sample data
      const sampleData = [
        {
          'Name': 'John Doe',
          'Email': 'john@example.com',
          'Phone': '+919876543210',
          'Company': 'ABC Corp',
          'Business Type': 'B2B',
          'Source': 'Facebook',
          'Date of Enquiry': '2025-01-15',
          'First Touch Base Done By': 'Sales Team',
          'City of Residence': 'Mumbai',
          'Country of Residence': 'India',
          'Lead for Event': 'IPL 2025',
          'Number of People': 2,
          'Has Valid Passport': 'Yes',
          'Visa Available': 'Not Required',
          'Attended Sporting Event Before': 'No',
          'Annual Income Bracket': '₹25-50 Lakhs',
          'Potential Value': 500000,
          'Status': 'unassigned',
          'Assigned To': '',
          'Last Quoted Price': 0,
          'Notes': 'Interested in VIP tickets'
        },
        {
          'Name': 'Jane Smith',
          'Email': 'jane@example.com',
          'Phone': '+919876543211',
          'Company': 'XYZ Ltd',
          'Business Type': 'B2C',
          'Source': 'WhatsApp',
          'Date of Enquiry': '2025-01-16',
          'First Touch Base Done By': 'Marketing Team',
          'City of Residence': 'Delhi',
          'Country of Residence': 'India',
          'Lead for Event': 'FIFA World Cup 2026',
          'Number of People': 4,
          'Has Valid Passport': 'Not Sure',
          'Visa Available': 'Required',
          'Attended Sporting Event Before': 'Yes',
          'Annual Income Bracket': '₹50 Lakhs - ₹1 Crore',
          'Potential Value': 1000000,
          'Status': 'unassigned',
          'Assigned To': '',
          'Last Quoted Price': 0,
          'Notes': 'Family trip planned'
        }
      ];
      
      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(sampleData);
      
      // Add data validation for dropdown columns
      const validations = {
        'E3:E1000': { // Business Type column
          type: 'list',
          allowBlank: false,
          formula1: '"B2B,B2C"'
        },
        'F3:F1000': { // Source column
          type: 'list',
          allowBlank: false,
          formula1: '"Facebook,WhatsApp,Instagram,LinkedIn,Referral,Website,Other"'
        },
        'J3:J1000': { // Country of Residence
          type: 'list',
          allowBlank: false,
          formula1: '"India,USA,UK,Canada,Australia,UAE,Singapore,Other"'
        },
        'M3:M1000': { // Has Valid Passport
          type: 'list',
          allowBlank: false,
          formula1: '"Yes,No,Not Sure"'
        },
        'N3:N1000': { // Visa Available
          type: 'list',
          allowBlank: false,
          formula1: '"Required,Not Required,Processing,Not Sure"'
        },
        'O3:O1000': { // Attended Sporting Event Before
          type: 'list',
          allowBlank: false,
          formula1: '"Yes,No,Not Sure"'
        },
        'P3:P1000': { // Annual Income Bracket
          type: 'list',
          allowBlank: false,
          formula1: '"₹5-15 Lakhs,₹15-25 Lakhs,₹25-50 Lakhs,₹50 Lakhs - ₹1 Crore,₹1+ Crore"'
        },
        'R3:R1000': { // Status
          type: 'list',
          allowBlank: false,
          formula1: '"unassigned,assigned,contacted,qualified,converted,dropped"'
        }
      };
      
      // Add validation for Assigned To if we have users
      if (validAssignees.length > 0) {
        validations['S3:S1000'] = {
          type: 'list',
          allowBlank: true,
          formula1: `"${validAssignees.join(',')}"`
        };
      }
      
      // Apply data validation
      ws['!dataValidation'] = validations;
      
      // Set column widths
      ws['!cols'] = [
        { width: 15 }, // Name
        { width: 25 }, // Email
        { width: 15 }, // Phone
        { width: 20 }, // Company
        { width: 15 }, // Business Type
        { width: 12 }, // Source
        { width: 15 }, // Date of Enquiry
        { width: 20 }, // First Touch Base Done By
        { width: 15 }, // City of Residence
        { width: 18 }, // Country of Residence
        { width: 20 }, // Lead for Event
        { width: 12 }, // Number of People
        { width: 18 }, // Has Valid Passport
        { width: 15 }, // Visa Available
        { width: 25 }, // Attended Sporting Event Before
        { width: 20 }, // Annual Income Bracket
        { width: 15 }, // Potential Value
        { width: 12 }, // Status
        { width: 25 }, // Assigned To
        { width: 15 }, // Last Quoted Price
        { width: 30 }  // Notes
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, 'Leads');
      
      // Generate buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=sample_leads_with_validation.xlsx');
      res.send(buffer);

    } else if (type === 'inventory') {
      // Create inventory Excel with validation
      const wb = XLSX.utils.book_new();
      
      const sampleData = [
        {
          'Event Name': 'IPL 2025 Final',
          'Event Date': '2025-05-28',
          'Event Type': 'cricket',
          'Sports': 'Cricket',
          'Venue': 'Wankhede Stadium',
          'Day of Match': 'Match Day',
          'Category of Ticket': 'VIP',
          'Stand': 'Upper Tier',
          'Total Tickets': 100,
          'Available Tickets': 100,
          'MRP of Ticket': 20000,
          'Buying Price': 15000,
          'Selling Price': 18000,
          'Inclusions': 'Food and Beverage',
          'Booking Person': 'John Doe',
          'Procurement Type': 'pre_inventory',
          'Payment Status': 'pending',
          'Supplier Name': 'BookMyShow',
          'Supplier Invoice': 'INV-001',
          'Total Purchase Amount': 1500000,
          'Amount Paid': 500000,
          'Payment Due Date': '2025-04-15',
          'Notes': 'Premium seats with hospitality'
        }
      ];
      
      const ws = XLSX.utils.json_to_sheet(sampleData);
      
      // Add data validation for inventory
      const validations = {
        'C3:C1000': { // Event Type
          type: 'list',
          allowBlank: false,
          formula1: '"cricket,football,tennis,basketball,hockey,formula1,other"'
        },
        'D3:D1000': { // Sports
          type: 'list',
          allowBlank: false,
          formula1: '"Cricket,Football,Tennis,Basketball,Hockey,Formula 1,Other"'
        },
        'P3:P1000': { // Procurement Type
          type: 'list',
          allowBlank: false,
          formula1: '"pre_inventory,on_demand"'
        },
        'Q3:Q1000': { // Payment Status
          type: 'list',
          allowBlank: false,
          formula1: '"pending,partial,paid,overdue"'
        }
      };
      
      ws['!dataValidation'] = validations;
      
      // Set column widths for inventory
      ws['!cols'] = Array(23).fill({ width: 15 });
      
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=sample_inventory_with_validation.xlsx');
      res.send(buffer);

    } else {
      res.status(400).json({ error: 'Invalid type. Use "leads" or "inventory"' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
