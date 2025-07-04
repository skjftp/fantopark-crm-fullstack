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
// REPLACE the entire sample endpoint with this working version:

// Add this route to your upload.js file
// WORKING SOLUTION: Add this to your upload.js file
// This uses a more compatible approach for Excel validation

// WORKING SOLUTION: Replace your existing Excel routes with this approach
// Add this to your backend/src/routes/upload.js

// This creates a proper Excel file with working dropdown validation
router.get('/leads/sample-excel-with-validation', authenticateToken, async (req, res) => {
  try {
    const XLSX = require('xlsx');
    
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // === VALIDATION DATA SHEET ===
    const validationData = [
      ['Business_Types', 'Lead_Sources', 'Countries', 'Passport_Status', 'Visa_Status', 'Lead_Status'],
      ['B2B', 'Facebook', 'India', 'Yes', 'Required', 'unassigned'],
      ['B2C', 'WhatsApp', 'USA', 'No', 'Not Required', 'assigned'],
      ['', 'Instagram', 'UK', 'Not Sure', 'Processing', 'contacted'],
      ['', 'LinkedIn', 'Canada', '', 'Not Sure', 'qualified'],
      ['', 'Referral', 'Australia', '', '', 'converted'],
      ['', 'Website', 'UAE', '', '', 'dropped'],
      ['', 'Other', 'Singapore', '', '', 'junk'],
      ['', 'Email Campaign', 'Germany', '', '', ''],
      ['', 'Cold Call', 'France', '', '', ''],
      ['', '', 'Other', '', '', '']
    ];
    
    const validationWs = XLSX.utils.aoa_to_sheet(validationData);
    
    // Set column widths for validation sheet
    validationWs['!cols'] = [
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];
    
    XLSX.utils.book_append_sheet(wb, validationWs, 'Lists');
    
    // === MAIN LEADS SHEET ===
    const headers = [
      'Name', 'Email', 'Phone', 'Company', 'Business Type', 'Source', 
      'Date of Enquiry', 'First Touch Base Done By', 'City of Residence', 
      'Country of Residence', 'Lead for Event', 'Number of People', 
      'Has Valid Passport', 'Visa Available', 'Attended Sporting Event Before', 
      'Annual Income Bracket', 'Potential Value', 'Status', 'Assigned To', 
      'Last Quoted Price', 'Notes'
    ];
    
    // Create main data with examples and instructions
    const mainData = [
      headers,
      [
        'INSTRUCTIONS →', '← Click the Lists tab to see all valid options', '← Use the dropdowns in columns E, F, J, M, N, R', '', 
        '← Select from dropdown', '← Select from dropdown', 'YYYY-MM-DD format', 'Team member name', 'City name',
        '← Select from dropdown', 'Event name', 'Number 1-10', '← Select from dropdown', '← Select from dropdown', 'Yes or No',
        'Income range', 'Number value', '← Select from dropdown', 'Team member email', 'Number value', 'Additional notes'
      ],
      [
        'John Doe', 'john@example.com', '+919876543210', 'ABC Corp', 
        'B2B', 'Facebook', '2025-01-15', 'Sales Team', 'Mumbai', 
        'India', 'IPL 2025', '2', 'Yes', 'Not Required', 'No', 
        '₹25-50 Lakhs', '500000', 'unassigned', 'sales@fantopark.com', '0', 'Interested in VIP tickets'
      ],
      [
        'Jane Smith', 'jane@example.com', '+919876543211', 'XYZ Ltd', 
        'B2C', 'WhatsApp', '2025-01-16', 'Marketing Team', 'Delhi', 
        'India', 'FIFA World Cup 2026', '4', 'Not Sure', 'Required', 'Yes', 
        '₹50 Lakhs - ₹1 Crore', '1000000', 'unassigned', 'sales@fantopark.com', '0', 'Family trip planned'
      ]
    ];
    
    const mainWs = XLSX.utils.aoa_to_sheet(mainData);
    
    // === APPLY VALIDATION USING EXCEL FORMULAS ===
    // This is the key - we need to write the validation in Excel's XML format
    
    // Create validation rules that Excel will recognize
    const validationRules = {};
    
    // Business Type validation (Column E) - starts from row 3 (after header and instruction)
    for (let row = 3; row <= 1000; row++) {
      const cellAddress = `E${row}`;
      validationRules[cellAddress] = {
        type: 'list',
        allowBlank: true,
        formula1: 'Lists!$A$2:$A$3', // B2B, B2C
        showInputMessage: true,
        promptTitle: 'Business Type',
        prompt: 'Select B2B or B2C from the dropdown'
      };
    }
    
    // Source validation (Column F)
    for (let row = 3; row <= 1000; row++) {
      const cellAddress = `F${row}`;
      validationRules[cellAddress] = {
        type: 'list',
        allowBlank: true,
        formula1: 'Lists!$B$2:$B$10', // All sources
        showInputMessage: true,
        promptTitle: 'Lead Source',
        prompt: 'Select the source of this lead'
      };
    }
    
    // Country validation (Column J)
    for (let row = 3; row <= 1000; row++) {
      const cellAddress = `J${row}`;
      validationRules[cellAddress] = {
        type: 'list',
        allowBlank: true,
        formula1: 'Lists!$C$2:$C$11', // All countries
        showInputMessage: true,
        promptTitle: 'Country',
        prompt: 'Select country of residence'
      };
    }
    
    // Passport validation (Column M)
    for (let row = 3; row <= 1000; row++) {
      const cellAddress = `M${row}`;
      validationRules[cellAddress] = {
        type: 'list',
        allowBlank: true,
        formula1: 'Lists!$D$2:$D$4', // Yes, No, Not Sure
        showInputMessage: true,
        promptTitle: 'Passport',
        prompt: 'Does the person have a valid passport?'
      };
    }
    
    // Visa validation (Column N)
    for (let row = 3; row <= 1000; row++) {
      const cellAddress = `N${row}`;
      validationRules[cellAddress] = {
        type: 'list',
        allowBlank: true,
        formula1: 'Lists!$E$2:$E$5', // Visa options
        showInputMessage: true,
        promptTitle: 'Visa',
        prompt: 'What is the visa status?'
      };
    }
    
    // Status validation (Column R)
    for (let row = 3; row <= 1000; row++) {
      const cellAddress = `R${row}`;
      validationRules[cellAddress] = {
        type: 'list',
        allowBlank: true,
        formula1: 'Lists!$F$2:$F$7', // Status options
        showInputMessage: true,
        promptTitle: 'Status',
        prompt: 'Select the current status of this lead'
      };
    }
    
    // Apply all validation rules to the worksheet
    mainWs['!dataValidation'] = validationRules;
    
    // Style the instruction row (row 2)
    for (let col = 0; col < headers.length; col++) {
      const cellAddr = XLSX.utils.encode_cell({ r: 1, c: col });
      if (!mainWs[cellAddr]) continue;
      
      // Add cell styling for instructions
      mainWs[cellAddr].s = {
        fill: { fgColor: { rgb: 'FFFFCC' } },
        font: { italic: true, color: { rgb: '666666' }, sz: 9 },
        alignment: { wrapText: true }
      };
    }
    
    // Set column widths
    mainWs['!cols'] = [
      { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, 
      { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 18 }, 
      { wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 25 }, 
      { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 30 }
    ];
    
    // Set the range to include validation rows
    mainWs['!ref'] = 'A1:U1000';
    
    XLSX.utils.book_append_sheet(wb, mainWs, 'Leads');
    
    // Write workbook with specific options for Excel compatibility
    const workbookOut = XLSX.write(wb, {
      type: 'buffer',
      bookType: 'xlsx',
      compression: true
    });
    
    // Set headers
    res.setHeader('Content-Disposition', 'attachment; filename="leads_with_real_validation.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Length', workbookOut.length);
    
    res.send(workbookOut);
    
  } catch (error) {
    console.error('Excel validation error:', error);
    res.status(500).json({ error: 'Failed to create Excel with validation: ' + error.message });
  }
});

// ALTERNATIVE: Create Excel with clear visual indicators for dropdown columns
router.get('/leads/sample-excel-visual', authenticateToken, async (req, res) => {
  try {
    const XLSX = require('xlsx');
    
    const wb = XLSX.utils.book_new();
    
    // Create data with clear visual indicators
    const headers = [
      'Name', 'Email', 'Phone', 'Company', 
      '⬇️ Business Type ⬇️', '⬇️ Source ⬇️', 
      'Date of Enquiry', 'First Touch Base Done By', 'City of Residence', 
      '⬇️ Country ⬇️', 'Lead for Event', 'Number of People', 
      '⬇️ Passport ⬇️', '⬇️ Visa ⬇️', 'Attended Event Before', 
      'Annual Income Bracket', 'Potential Value', '⬇️ Status ⬇️', 
      'Assigned To', 'Last Quoted Price', 'Notes'
    ];
    
    const validationOptions = [
      'Valid Options →', 'Standard email format', 'Phone with country code', 'Company name',
      'B2B | B2C', 'Facebook | WhatsApp | Instagram | LinkedIn | Referral | Website | Other',
      'YYYY-MM-DD', 'Team member name', 'City name',
      'India | USA | UK | Canada | Australia | UAE | Singapore | Other',
      'Event name', '1-10', 'Yes | No | Not Sure', 'Required | Not Required | Processing | Not Sure',
      'Yes | No', 'Income bracket', 'Numeric value', 
      'unassigned | assigned | contacted | qualified | converted | dropped | junk',
      'Team member email', 'Numeric value', 'Free text'
    ];
    
    const sampleData1 = [
      'John Doe', 'john@example.com', '+919876543210', 'ABC Corp',
      'B2B', 'Facebook', '2025-01-15', 'Sales Team', 'Mumbai',
      'India', 'IPL 2025', '2', 'Yes', 'Not Required', 'No',
      '₹25-50 Lakhs', '500000', 'unassigned', 'sales@fantopark.com', '0', 'Interested in VIP tickets'
    ];
    
    const sampleData2 = [
      'Jane Smith', 'jane@example.com', '+919876543211', 'XYZ Ltd',
      'B2C', 'WhatsApp', '2025-01-16', 'Marketing Team', 'Delhi',
      'India', 'FIFA World Cup 2026', '4', 'Not Sure', 'Required', 'Yes',
      '₹50 Lakhs - ₹1 Crore', '1000000', 'unassigned', 'sales@fantopark.com', '0', 'Family trip planned'
    ];
    
    const data = [headers, validationOptions, sampleData1, sampleData2];
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Style dropdown columns with background color
    const dropdownColumns = [4, 5, 9, 12, 13, 17]; // E, F, J, M, N, R (0-indexed)
    
    dropdownColumns.forEach(col => {
      for (let row = 0; row < 100; row++) {
        const cellAddr = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[cellAddr]) {
          ws[cellAddr] = { t: 's', v: '' };
        }
        ws[cellAddr].s = {
          fill: { fgColor: { rgb: 'E6F3FF' } }, // Light blue background
          border: {
            top: { style: 'thin', color: { rgb: '4A90E2' } },
            bottom: { style: 'thin', color: { rgb: '4A90E2' } },
            left: { style: 'thin', color: { rgb: '4A90E2' } },
            right: { style: 'thin', color: { rgb: '4A90E2' } }
          }
        };
      }
    });
    
    // Style the validation options row
    for (let col = 0; col < headers.length; col++) {
      const cellAddr = XLSX.utils.encode_cell({ r: 1, c: col });
      if (!ws[cellAddr]) continue;
      ws[cellAddr].s = {
        fill: { fgColor: { rgb: 'FFFFCC' } },
        font: { italic: true, sz: 9 },
        alignment: { wrapText: true }
      };
    }
    
    ws['!cols'] = headers.map(() => ({ wch: 18 }));
    
    XLSX.utils.book_append_sheet(wb, ws, 'Leads with Visual Cues');
    
    const workbookOut = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', 'attachment; filename="leads_visual_validation.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    res.send(workbookOut);
    
  } catch (error) {
    console.error('Excel visual error:', error);
    res.status(500).json({ error: 'Failed to create visual Excel: ' + error.message });
  }
});

module.exports = router;
