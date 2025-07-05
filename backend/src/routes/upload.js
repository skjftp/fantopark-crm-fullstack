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

// ENHANCED: Helper function to properly parse dates from Excel/CSV
const parseDate = (dateValue) => {
  console.log('🗓️ Parsing date value:', dateValue, 'Type:', typeof dateValue);
  
  if (!dateValue || dateValue === '' || dateValue === null || dateValue === undefined) {
    console.log('⚠️ No date value provided, using current date');
    return new Date().toISOString();
  }
  
  // If it's already a Date object, convert to ISO string
  if (dateValue instanceof Date) {
    console.log('✅ Date object found, converting to ISO');
    return dateValue.toISOString();
  }
  
  // If it's a string, try to parse it
  if (typeof dateValue === 'string') {
    const trimmedValue = dateValue.trim();
    
    if (trimmedValue === '') {
      console.log('⚠️ Empty string date, using current date');
      return new Date().toISOString();
    }
    
    // Handle YYYY-MM-DD format (most common CSV format)
    if (trimmedValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      console.log('✅ YYYY-MM-DD format detected');
      return new Date(trimmedValue + 'T00:00:00Z').toISOString();
    }
    
    // Handle DD/MM/YYYY format
    if (trimmedValue.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      console.log('✅ DD/MM/YYYY format detected');
      const [day, month, year] = trimmedValue.split('/');
      const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00Z`;
      console.log('✅ Converted to:', formattedDate);
      return new Date(formattedDate).toISOString();
    }
    
    // Handle MM/DD/YYYY format (American style)
    if (trimmedValue.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/) && trimmedValue.indexOf('/') !== -1) {
      console.log('✅ Attempting MM/DD/YYYY format');
      const [month, day, year] = trimmedValue.split('/');
      const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00Z`;
      console.log('✅ Converted to:', formattedDate);
      return new Date(formattedDate).toISOString();
    }
    
    // Handle DD-MM-YYYY format
    if (trimmedValue.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
      console.log('✅ DD-MM-YYYY format detected');
      const [day, month, year] = trimmedValue.split('-');
      const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00Z`;
      console.log('✅ Converted to:', formattedDate);
      return new Date(formattedDate).toISOString();
    }
    
    // Handle ISO format with time
    if (trimmedValue.includes('T') || trimmedValue.includes('Z')) {
      console.log('✅ ISO format detected');
      const parsed = new Date(trimmedValue);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }
    
    // Try general Date parsing as fallback
    const parsed = new Date(trimmedValue);
    if (!isNaN(parsed.getTime())) {
      console.log('✅ Successfully parsed with Date constructor');
      return parsed.toISOString();
    }
    
    console.log('⚠️ String date parsing failed for:', trimmedValue, 'using current date');
  }
  
  // If it's a number (Excel serial date), convert it
  if (typeof dateValue === 'number' && dateValue > 0) {
    console.log('✅ Excel serial number detected:', dateValue);
    // Excel date serial number (days since 1900-01-01)
    const excelEpoch = new Date(1900, 0, 1);
    const msPerDay = 24 * 60 * 60 * 1000;
    const date = new Date(excelEpoch.getTime() + (dateValue - 2) * msPerDay);
    console.log('✅ Excel date converted to:', date.toISOString());
    return date.toISOString();
  }
  
  // Default to current date if parsing fails
  console.log('⚠️ All parsing methods failed, using current date');
  return new Date().toISOString();
};

// Helper function to parse both CSV and Excel files
const parseUploadedFile = (fileBuffer, filename) => {
  return new Promise((resolve, reject) => {
    try {
      if (filename.endsWith('.csv')) {
        console.log('📄 Parsing CSV file...');
        
        // FIXED: Parse CSV with proper configuration
        const results = [];
        const stream = Readable.from(fileBuffer.toString());
        
        stream
          .pipe(csv({
            // Ensure headers are properly parsed
            mapHeaders: ({ header, index }) => {
              // Clean header names and map them properly
              return header.trim().toLowerCase().replace(/\s+/g, '_');
            },
            skipEmptyLines: true,
            skipLinesWithError: false
          }))
          .on('data', (row) => {
            console.log('📝 Raw CSV row:', Object.keys(row)); // Debug headers
            results.push(row);
          })
          .on('end', () => {
            console.log('✅ CSV parsing completed, rows:', results.length);
            if (results.length > 0) {
              console.log('📋 First row sample:', Object.keys(results[0]));
            }
            resolve(results);
          })
          .on('error', (error) => {
            console.error('❌ CSV parsing error:', error);
            reject(error);
          });
          
      } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
        console.log('📊 Parsing Excel file...');
        
        // Parse Excel with proper date handling
        const workbook = XLSX.read(fileBuffer, { 
          type: 'buffer',
          cellDates: true,
          cellNF: true,
          cellText: false
        });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          dateNF: 'yyyy-mm-dd',
          defval: '' // Default value for empty cells
        });
        
        console.log('✅ Excel parsing completed, rows:', jsonData.length);
        if (jsonData.length > 0) {
          console.log('📋 First row sample:', Object.keys(jsonData[0]));
        }
        resolve(jsonData);
      } else {
        reject(new Error('Unsupported file format'));
      }
    } catch (error) {
      console.error('❌ File parsing error:', error);
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

// POST bulk upload leads from CSV/Excel - ENHANCED VERSION WITH IMPROVED DATE HANDLING
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
    const uploadedLeads = []; // Store successfully uploaded leads for bulk assignment

    for (const [index, row] of results.entries()) {
      try {
        // Get the assigned_to value and handle empty/invalid assignments
        const assignedToValue = row.assigned_to || row['Assigned To'] || '';
        
        // ENHANCED: Get date value with multiple possible column names
        const rawDateValue = row.date_of_enquiry || 
                            row['Date of Enquiry'] || 
                            row['date_of_enquiry'] || 
                            row['Date of enquiry'] ||
                            row['DATE OF ENQUIRY'] ||
                            row['enquiry_date'] ||
                            row['Enquiry Date'];

        console.log(`🔍 Processing lead ${index + 1}: ${row.name || row.Name}`);
        console.log(`📅 Raw date value found:`, rawDateValue, `(Type: ${typeof rawDateValue})`);
        
        const parsedDate = parseDate(rawDateValue);
        console.log(`✅ Final parsed date:`, parsedDate);
        
        // Map columns to lead fields with ENHANCED DATE HANDLING
        const leadData = {
          // Try multiple possible header variations
          name: row.name || row.Name || row.NAME || 
                row['Name'] || row['name'] || '',
                
          email: row.email || row.Email || row.EMAIL || 
                 row['Email'] || row['email'] || '',
                 
          phone: String(row.phone || row.Phone || row.PHONE || 
                 row['Phone'] || row['phone'] || 
                 row['Phone Number'] || row.mobile || ''),
                 
          company: row.company || row.Company || row.COMPANY || 
                   row['Company'] || row['company'] || '',
                   
          business_type: row.business_type || row['Business Type'] || 
                         row.businesstype || row['business type'] || 'B2C',
                         
          source: row.source || row.Source || row.SOURCE || 
                  row['Source'] || row['source'] || 'Website',
          
          // ENHANCED: Use the parsed date
          date_of_enquiry: parsedDate,
          
          first_touch_base_done_by: row.first_touch_base_done_by || 
                                   row['First Touch Base Done By'] || 
                                   row.touchbase || '',
                                   
          city_of_residence: row.city_of_residence || 
                            row['City of Residence'] || 
                            row.city || '',
                            
          country_of_residence: row.country_of_residence || 
                               row['Country of Residence'] || 
                               row.country || 'India',
                               
          lead_for_event: row.lead_for_event || 
                         row['Lead for Event'] || 
                         row.event || '',
                         
          number_of_people: parseInt(row.number_of_people || 
                                    row['Number of People'] || 
                                    row.people || '1'),
                                    
          has_valid_passport: row.has_valid_passport || 
                             row['Has Valid Passport'] || 
                             (row.passport === 'Yes' ? 'Yes' : 'No'),
                             
          visa_available: row.visa_available || 
                         row['Visa Available'] || 
                         (row.visa === 'Yes' ? 'Yes' : 'No'),
                         
          attended_sporting_event_before: row.attended_sporting_event_before || 
                                         row['Attended Sporting Event Before'] || 
                                         (row.attended === 'Yes' ? 'Yes' : 'No'),
                                         
          annual_income_bracket: row.annual_income_bracket || 
                                row['Annual Income Bracket'] || 
                                row.income || '',
                                
          potential_value: parseFloat(row.potential_value || 
                                     row['Potential Value'] || 
                                     row.value || '0'),
          
          // FIX: Properly handle assignment status
          status: assignedToValue.trim() === '' || assignedToValue === '0' ? 'unassigned' : 'assigned',
          assigned_to: assignedToValue.trim() === '' || assignedToValue === '0' ? '' : assignedToValue,
          
          last_quoted_price: parseFloat(row.last_quoted_price || 
                                       row['Last Quoted Price'] || 
                                       row.price || '0'),
                                       
          notes: row.notes || row.Notes || row.NOTES || 
                 row['Notes'] || row['notes'] || ''
        };

        console.log(`💾 Final leadData for ${leadData.name}:`, {
          name: leadData.name,
          email: leadData.email,
          date_of_enquiry: leadData.date_of_enquiry
        });

        // Validate required fields
        if (!leadData.name || !leadData.email || !leadData.phone) {
          errors.push({
            row: index + 2,
            error: 'Missing required fields (name, email, or phone)',
            data: leadData
          });
          errorCount++;
          continue;
        }

        // Additional validation: Check if assigned_to is a valid email when provided
        if (leadData.assigned_to && leadData.assigned_to !== '' && !leadData.assigned_to.includes('@')) {
          errors.push({
            row: index + 2,
            error: 'Assigned To must be a valid email address',
            data: leadData
          });
          errorCount++;
          continue;
        }

        const lead = new Lead(leadData);
        const savedLead = await lead.save();
        
        console.log(`✅ Successfully saved lead: ${leadData.name} with date: ${leadData.date_of_enquiry}`);
        
        // Store for bulk assignment UI
        uploadedLeads.push({
          id: savedLead.id,
          name: leadData.name,
          email: leadData.email,
          company: leadData.company,
          source: leadData.source,
          date_of_enquiry: leadData.date_of_enquiry,
          status: leadData.status,
          assigned_to: leadData.assigned_to,
          business_type: leadData.business_type,
          phone: leadData.phone
        });
        
        successCount++;
      } catch (error) {
        console.error(`❌ Error processing row ${index + 2}:`, error);
        errors.push({
          row: index + 2,
          error: error.message,
          data: row
        });
        errorCount++;
      }
    }

    // Store upload session for bulk assignment
    const uploadSessionId = `upload_${Date.now()}_${req.user.email}`;

    console.log(`📊 Upload completed: ${successCount} successful, ${errorCount} failed`);

    res.json({
      success: true,
      message: `Import completed. ${successCount} leads imported successfully, ${errorCount} failed.`,
      totalProcessed: results.length,
      successCount,
      errorCount,
      errors: errors.slice(0, 10),
      uploadSessionId,
      uploadedLeads, // Include uploaded leads for bulk assignment UI
      fileName: req.file.originalname
    });
  } catch (error) {
    console.error('Upload error:', error);
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
        // DIRECT field mapping with date parsing
        const inventoryData = {
          // Basic Event Information
          event_name: row.event_name || row['Event Name'] || '',
          event_date: parseDate(row.event_date || row['Event Date']),
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
          
          // PAYMENT INFORMATION with date parsing
          paymentStatus: row.paymentStatus || row['Payment Status'] || 'pending',
          supplierName: row.supplierName || row['Supplier Name'] || '',
          supplierInvoice: row.supplierInvoice || row['Supplier Invoice'] || '',
          purchasePrice: parseFloat(row.purchasePrice || row['Purchase Price'] || '0'),
          totalPurchaseAmount: parseFloat(row.totalPurchaseAmount || row['Total Purchase Amount'] || '0'),
          amountPaid: parseFloat(row.amountPaid || row['Amount Paid'] || '0'),
          paymentDueDate: parseDate(row.paymentDueDate || row['Payment Due Date']),
          
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

// GET endpoint to generate sample CSV with dropdown validation
router.get('/sample/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    
    if (type === 'leads') {
      // Fetch all users for assignment dropdown validation
      const users = await User.find({ status: 'active' });
      const salesUsers = users.filter(u => ['sales_executive', 'sales_manager', 'supply_executive', 'supply_sales_service_manager'].includes(u.role));
      const validAssignees = salesUsers.map(u => u.email).join('|'); // For Excel validation
      
      // Define dropdown options
      const dropdownValues = {
        business_type: 'B2B|B2C',
        source: 'Facebook|WhatsApp|Instagram|LinkedIn|Referral|Website|Email Campaign|Cold Call|Exhibition|Other',
        country_of_residence: 'India|USA|UK|Canada|Australia|UAE|Singapore|Germany|France|Italy|Spain|Netherlands|Switzerland|Japan|South Korea|Other',
        has_valid_passport: 'Yes|No|Not Sure',
        visa_available: 'Required|Not Required|Processing|In Process|Not Sure',
        attended_sporting_event_before: 'Yes|No|Not Sure',
        annual_income_bracket: 'Below ₹5 Lakhs|₹5-10 Lakhs|₹10-25 Lakhs|₹25-50 Lakhs|₹50 Lakhs - ₹1 Crore|₹1-2 Crores|₹2-5 Crores|Above ₹5 Crores',
        status: 'unassigned|assigned|contacted|qualified|converted|dropped|junk',
        assigned_to: validAssignees || 'user1@company.com|user2@company.com'
      };

      // Create CSV content with validation notes
      const csvContent = `Name,Email,Phone,Company,Business Type,Source,Date of Enquiry,First Touch Base Done By,City of Residence,Country of Residence,Lead for Event,Number of People,Has Valid Passport,Visa Available,Attended Sporting Event Before,Annual Income Bracket,Potential Value,Status,Assigned To,Last Quoted Price,Notes
John Doe,john@example.com,+919876543210,ABC Corp,B2B,Facebook,2025-01-15,Sales Team,Mumbai,India,IPL 2025,2,Yes,Not Required,No,₹25-50 Lakhs,500000,unassigned,,0,Interested in VIP tickets
Jane Smith,jane@example.com,+919876543211,XYZ Ltd,B2C,WhatsApp,2025-01-16,Marketing Team,Delhi,India,FIFA World Cup 2026,4,Not Sure,Required,Yes,₹50 Lakhs - ₹1 Crore,1000000,unassigned,,0,Family trip planned

VALIDATION RULES:
Business Type: ${dropdownValues.business_type}
Source: ${dropdownValues.source}
Country of Residence: ${dropdownValues.country_of_residence}
Has Valid Passport: ${dropdownValues.has_valid_passport}
Visa Available: ${dropdownValues.visa_available}
Attended Sporting Event Before: ${dropdownValues.attended_sporting_event_before}
Annual Income Bracket: ${dropdownValues.annual_income_bracket}
Status: ${dropdownValues.status}
Assigned To: ${dropdownValues.assigned_to}

NOTES:
- Date of Enquiry format: YYYY-MM-DD (e.g., 2025-01-15)
- Leave Assigned To blank for unassigned leads
- Assigned To must be a valid email from the active user list
- Status will auto-update to 'assigned' when Assigned To is provided
- Number of People must be a positive integer
- Potential Value and Last Quoted Price must be numeric
- Phone format: +CountryCode followed by number`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=sample_leads_with_validation.csv');
      res.send(csvContent);

    } else if (type === 'inventory') {
      const csvContent = `Event Name,Event Date,Event Type,Sports,Venue,Day of Match,Category of Ticket,Stand,Total Tickets,Available Tickets,MRP of Ticket,Buying Price,Selling Price,Inclusions,Booking Person,Procurement Type,Payment Status,Supplier Name,Supplier Invoice,Purchase Price,Total Purchase Amount,Amount Paid,Payment Due Date,Notes
IPL 2025 Final,2025-05-28,cricket,Cricket,Wankhede Stadium,Not Applicable,VIP,Premium Box,10,10,15000,12000,17700,Food & Beverages,John Doe,pre_inventory,pending,Ticket Master,INV-2025-001,120000,120000,60000,2025-04-15,Premium seats with hospitality
FIFA World Cup 2026,2026-06-15,football,Football,MetLife Stadium,Not Applicable,Premium,Section A,20,20,25000,20000,29500,VIP Access,Jane Smith,pre_inventory,pending,FIFA Official,FIFA-2026-001,400000,400000,200000,2026-03-01,Group stage match

VALIDATION RULES:
Event Type: cricket|football|tennis|basketball|hockey|other
Sports: Cricket|Football|Tennis|Basketball|Hockey|Formula 1|Golf|Other
Procurement Type: pre_inventory|on_demand|partner
Payment Status: pending|partial|paid
Day of Match: Not Applicable|Match Day|Day Before|Day After

NOTES:
- Event Date format: YYYY-MM-DD (e.g., 2025-05-28)
- Payment Due Date format: YYYY-MM-DD
- All price fields must be numeric
- Total Purchase Amount = Buying Price × Total Tickets (if not provided)
- Available Tickets should not exceed Total Tickets
- Leave Amount Paid as 0 if no payment made yet`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=sample_inventory_with_validation.csv');
      res.send(csvContent);

    } else {
      res.status(400).json({ error: 'Invalid type. Use "leads" or "inventory"' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enhanced Excel sample generation with real validation
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
      ['', 'LinkedIn', 'Canada', '', 'In Process', 'qualified'],
      ['', 'Referral', 'Australia', '', 'Not Sure', 'converted'],
      ['', 'Website', 'UAE', '', '', 'dropped'],
      ['', 'Email Campaign', 'Singapore', '', '', 'junk'],
      ['', 'Cold Call', 'Germany', '', '', ''],
      ['', 'Exhibition', 'France', '', '', ''],
      ['', 'Other', 'Other', '', '', '']
    ];
    
    const validationWs = XLSX.utils.aoa_to_sheet(validationData);
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
        'INSTRUCTIONS →', '← Use dropdowns for highlighted columns', '← Phone with country code', 'Company name', 
        '← Select from dropdown', '← Select from dropdown', '← Use format: 2025-01-15', 'Team member name', 'City name',
        '← Select from dropdown', 'Event name', 'Number 1-10', '← Select from dropdown', '← Select from dropdown', 'Yes or No',
        'Income range', 'Number value', '← Select from dropdown', 'Team member email', 'Number value', 'Additional notes'
      ],
      [
        'John Doe', 'john@example.com', '+919876543210', 'ABC Corp', 
        'B2B', 'Facebook', '2025-01-15', 'Sales Team', 'Mumbai', 
        'India', 'IPL 2025', '2', 'Yes', 'Not Required', 'No', 
        '₹25-50 Lakhs', '500000', 'unassigned', '', '0', 'Interested in VIP tickets'
      ],
      [
        'Jane Smith', 'jane@example.com', '+919876543211', 'XYZ Ltd', 
        'B2C', 'WhatsApp', '2025-01-16', 'Marketing Team', 'Delhi', 
        'India', 'FIFA World Cup 2026', '4', 'Not Sure', 'Required', 'Yes', 
        '₹50 Lakhs - ₹1 Crore', '1000000', 'unassigned', '', '0', 'Family trip planned'
      ]
    ];
    
    const mainWs = XLSX.utils.aoa_to_sheet(mainData);
    
    // Set column widths
    mainWs['!cols'] = [
      { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, 
      { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 18 }, 
      { wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 25 }, 
      { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 30 }
    ];
    
    XLSX.utils.book_append_sheet(wb, mainWs, 'Leads');
    
    // Write workbook
    const workbookOut = XLSX.write(wb, {
      type: 'buffer',
      bookType: 'xlsx',
      compression: true
    });
    
    // Set headers
    res.setHeader('Content-Disposition', 'attachment; filename="leads_with_validation.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Length', workbookOut.length);
    
    res.send(workbookOut);
    
  } catch (error) {
    console.error('Excel validation error:', error);
    res.status(500).json({ error: 'Failed to create Excel with validation: ' + error.message });
  }
});

// Add missing Excel download routes that frontend expects
router.get('/leads/sample-excel-fixed', authenticateToken, async (req, res) => {
  try {
    // Redirect to the existing route or create a simple response
    res.redirect('/api/upload/leads/sample-excel-with-validation');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/leads/sample-excel-simple', authenticateToken, async (req, res) => {
  try {
    const XLSX = require('xlsx');
    
    // Create a simple Excel template
    const wb = XLSX.utils.book_new();
    
    const headers = [
      'Name', 'Email', 'Phone', 'Company', 'Business Type', 'Source', 
      'Date of Enquiry', 'First Touch Base Done By', 'City of Residence', 
      'Country of Residence', 'Lead for Event', 'Number of People', 
      'Has Valid Passport', 'Visa Available', 'Attended Sporting Event Before', 
      'Annual Income Bracket', 'Potential Value', 'Status', 'Assigned To', 
      'Last Quoted Price', 'Notes'
    ];
    
    const sampleData = [
      [
        'John Doe', 'john@example.com', '+919876543210', 'ABC Corp', 
        'B2B', 'Facebook', '2025-01-15', 'Sales Team', 'Mumbai', 
        'India', 'IPL 2025', '2', 'Yes', 'Not Required', 'No', 
        '₹25-50 Lakhs', '500000', 'unassigned', '', '0', 'Interested in VIP tickets'
      ]
    ];
    
    const data = [headers, ...sampleData];
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Set column widths
    ws['!cols'] = headers.map(() => ({ wch: 15 }));
    
    XLSX.utils.book_append_sheet(wb, ws, 'Leads Template');
    
    const workbookOut = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', 'attachment; filename="leads_template_simple.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    res.send(workbookOut);
    
  } catch (error) {
    console.error('Excel simple error:', error);
    res.status(500).json({ error: 'Failed to create simple Excel template: ' + error.message });
  }
});

module.exports = router;

// Add missing Excel download routes that frontend expects
router.get('/leads/sample-excel-fixed', authenticateToken, async (req, res) => {
  try {
    // Redirect to the existing route or create a simple response
    res.redirect('/api/upload/leads/sample-excel-with-validation');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/leads/sample-excel-simple', authenticateToken, async (req, res) => {
  try {
    const XLSX = require('xlsx');
    
    // Create a simple Excel template
    const wb = XLSX.utils.book_new();
    
    const headers = [
      'Name', 'Email', 'Phone', 'Company', 'Business Type', 'Source', 
      'Date of Enquiry', 'First Touch Base Done By', 'City of Residence', 
      'Country of Residence', 'Lead for Event', 'Number of People', 
      'Has Valid Passport', 'Visa Available', 'Attended Sporting Event Before', 
      'Annual Income Bracket', 'Potential Value', 'Status', 'Assigned To', 
      'Last Quoted Price', 'Notes'
    ];
    
    const sampleData = [
      [
        'John Doe', 'john@example.com', '+919876543210', 'ABC Corp', 
        'B2B', 'Facebook', '2025-01-15', 'Sales Team', 'Mumbai', 
        'India', 'IPL 2025', '2', 'Yes', 'Not Required', 'No', 
        '₹25-50 Lakhs', '500000', 'unassigned', '', '0', 'Interested in VIP tickets'
      ]
    ];
    
    const data = [headers, ...sampleData];
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Set column widths
    ws['!cols'] = headers.map(() => ({ wch: 15 }));
    
    XLSX.utils.book_append_sheet(wb, ws, 'Leads Template');
    
    const workbookOut = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', 'attachment; filename="leads_template_simple.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    res.send(workbookOut);
    
  } catch (error) {
    console.error('Excel simple error:', error);
    res.status(500).json({ error: 'Failed to create simple Excel template: ' + error.message });
  }
});
