const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const { authenticateToken } = require('../middleware/auth');
const csv = require('csv-parser');
const { Readable } = require('stream');
const Lead = require('../models/Lead');
const Inventory = require('../models/Inventory');
const User = require('../models/User'); // ADDED FOR SAMPLE ENDPOINT

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

// Add multer configuration for CSV files
const csvUpload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for CSV
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

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

// POST bulk upload leads from CSV - FIXED VERSION
router.post('/leads/csv', authenticateToken, csvUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const results = [];
    const errors = [];
    const stream = Readable.from(req.file.buffer.toString());

    stream
      .pipe(csv())
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', async () => {
        let successCount = 0;
        let errorCount = 0;

        for (const [index, row] of results.entries()) {
          try {
            // Get the assigned_to value and handle empty/invalid assignments
            const assignedToValue = row.assigned_to || row['Assigned To'] || '';
            
            // Map CSV columns to lead fields
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
      })
      .on('error', (error) => {
        res.status(500).json({ error: 'Error parsing CSV: ' + error.message });
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST bulk upload inventory from CSV - DIRECT DATABASE SAVE
router.post('/inventory/csv', authenticateToken, csvUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('📁 CSV file received:', req.file.originalname, 'Size:', req.file.size);

    const results = [];
    const errors = [];
    const stream = Readable.from(req.file.buffer.toString());

    stream
      .pipe(csv())
      .on('data', (row) => {
        console.log('🔍 Raw CSV row data:', row);
        results.push(row);
      })
      .on('end', async () => {
        console.log(`📊 Total rows parsed: ${results.length}`);
        
        let successCount = 0;
        let errorCount = 0;

        for (const [index, row] of results.entries()) {
          try {
            console.log(`\n🚀 Processing row ${index + 1}:`);
            console.log('Raw row keys:', Object.keys(row));
            
            // DIRECT field mapping - exactly what we see in logs
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
              
              // PAYMENT INFORMATION - DIRECT MAPPING
              paymentStatus: row.paymentStatus || row['Payment Status'] || 'pending',
              supplierName: row.supplierName || row['Supplier Name'] || '',
              supplierInvoice: row.supplierInvoice || row['Supplier Invoice'] || '',
              purchasePrice: parseFloat(row.purchasePrice || row['Purchase Price'] || '0'),
              totalPurchaseAmount: parseFloat(row.totalPurchaseAmount || row['Total Purchase Amount'] || '0'),
              amountPaid: parseFloat(row.amountPaid || row['Amount Paid'] || '0'),
              paymentDueDate: row.paymentDueDate || row['Payment Due Date'] || '',
              
              // Legacy fields for compatibility
              vendor_name: row.vendor_name || row['Vendor Name'] || row.supplierName || row['Supplier Name'] || '',
              price_per_ticket: parseFloat(row.price_per_ticket || row['Price per Ticket'] || row.selling_price || '0'),
              number_of_tickets: parseInt(row.number_of_tickets || row['Number of Tickets'] || row.total_tickets || '0'),
              total_value_of_tickets: parseFloat(row.total_value_of_tickets || row['Total Value of Tickets'] || '0'),
              currency: row.currency || row.Currency || 'INR',
              base_amount_inr: parseFloat(row.base_amount_inr || row['Base Amount INR'] || '0'),
              gst_18_percent: parseFloat(row.gst_18_percent || row['GST 18%'] || '0'),
              selling_price_per_ticket: parseFloat(row.selling_price_per_ticket || row['Selling Price per Ticket'] || row.selling_price || '0'),
              payment_due_date: row.payment_due_date || row['Payment Due Date'] || row.paymentDueDate || '',
              supplier_name: row.supplier_name || row['Supplier Name'] || row.supplierName || '',
              ticket_source: row.ticket_source || row['Ticket Source'] || 'Primary',
              status: row.status || row.Status || 'available',
              allocated_to_order: row.allocated_to_order || row['Allocated to Order'] || '',
              
              // System fields
              created_date: new Date().toISOString(),
              updated_date: new Date().toISOString(),
              created_by: req.user.name || 'CSV Import'
            };

            console.log('💰 Payment fields before save:');
            console.log('  paymentStatus:', inventoryData.paymentStatus);
            console.log('  supplierName:', inventoryData.supplierName);
            console.log('  supplierInvoice:', inventoryData.supplierInvoice);
            console.log('  totalPurchaseAmount:', inventoryData.totalPurchaseAmount);

            // Auto-calculate missing values
            if (!inventoryData.totalPurchaseAmount && inventoryData.buying_price && inventoryData.total_tickets) {
              inventoryData.totalPurchaseAmount = inventoryData.buying_price * inventoryData.total_tickets;
              console.log('🧮 Auto-calculated totalPurchaseAmount:', inventoryData.totalPurchaseAmount);
            }

            // Ensure available tickets don't exceed total tickets
            if (inventoryData.available_tickets > inventoryData.total_tickets) {
              inventoryData.available_tickets = inventoryData.total_tickets;
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

            console.log('💾 About to save directly to database...');
            console.log('Final data structure:');
            console.log('Payment Status:', inventoryData.paymentStatus);
            console.log('Supplier Name:', inventoryData.supplierName);
            console.log('Total Purchase Amount:', inventoryData.totalPurchaseAmount);

            // SAVE DIRECTLY TO DATABASE - BYPASS MODEL
            const { db } = require('../config/db');
            const docRef = await db.collection('crm_inventory').add(inventoryData);
            
            // Retrieve the saved document to verify
            const savedDoc = await db.collection('crm_inventory').doc(docRef.id).get();
            const savedData = savedDoc.data();
            
            console.log('✅ Successfully saved inventory with ID:', docRef.id);
            console.log('✅ Payment fields in ACTUALLY saved data:');
            console.log('  paymentStatus:', savedData.paymentStatus);
            console.log('  supplierName:', savedData.supplierName);
            console.log('  totalPurchaseAmount:', savedData.totalPurchaseAmount);
            console.log('  amountPaid:', savedData.amountPaid);
            
            // Create payable if payment is pending or partial
            if ((savedData.paymentStatus === 'pending' || savedData.paymentStatus === 'partial') && savedData.totalPurchaseAmount > 0) {
              try {
                const totalAmount = parseFloat(savedData.totalPurchaseAmount) || 0;
                const amountPaid = parseFloat(savedData.amountPaid) || 0;
                const pendingBalance = totalAmount - amountPaid;
                
                console.log('💳 Creating payable:', {
                  totalAmount,
                  amountPaid,
                  pendingBalance
                });
                
                if (pendingBalance > 0) {
                  const payableData = {
                    inventoryId: docRef.id,
                    supplierName: savedData.supplierName || 'Unknown Supplier',
                    eventName: savedData.event_name,
                    invoiceNumber: savedData.supplierInvoice || 'INV-' + Date.now(),
                    amount: pendingBalance,
                    dueDate: savedData.paymentDueDate || null,
                    status: 'pending',
                    created_date: new Date().toISOString(),
                    updated_date: new Date().toISOString(),
                    createdBy: req.user.id,
                    description: `Payment for inventory: ${savedData.event_name}`,
                    payment_notes: `Created from CSV import - Balance: ₹${pendingBalance.toFixed(2)}`
                  };
                  
                  const payableRef = await db.collection('crm_payables').add(payableData);
                  console.log('💳 Payable created with ID:', payableRef.id, 'Amount:', pendingBalance);
                }
              } catch (payableError) {
                console.error('Error creating payable:', payableError);
              }
            }
            
            successCount++;
          } catch (error) {
            console.error(`❌ Error processing row ${index + 2}:`, error);
            errors.push({
              row: index + 2,
              error: error.message
            });
            errorCount++;
          }
        }

        console.log(`🎉 CSV import completed: ${successCount} success, ${errorCount} failed`);
        res.json({
          success: true,
          message: `Import completed. ${successCount} inventory items imported successfully, ${errorCount} failed.`,
          totalProcessed: results.length,
          successCount,
          errorCount,
          errors: errors.slice(0, 10)
        });
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        res.status(500).json({ error: 'Error parsing CSV: ' + error.message });
      });
  } catch (error) {
    console.error('CSV upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET endpoint to generate sample CSV with dropdown validation
router.get('/sample/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    
    if (type === 'leads') {
      // Fetch all active users for assignment dropdown validation
      const users = await User.find({ status: 'active' });
      const salesUsers = users.filter(u => ['sales_executive', 'sales_manager'].includes(u.role));
      const validAssignees = salesUsers.map(u => u.email).join(',');
      
      // Define exact dropdown options from your system
      const dropdownValues = {
        business_type: 'B2B,B2C',
        source: 'Facebook,WhatsApp,Instagram,LinkedIn,Referral,Website,Other',
        country_of_residence: 'India,USA,UK,Canada,Australia,UAE,Singapore,Other',
        has_valid_passport: 'Yes,No,Not Sure',
        visa_available: 'Required,Not Required,Processing,Not Sure',
        attended_sporting_event_before: 'Yes,No,Not Sure',
        annual_income_bracket: '₹5-15 Lakhs,₹15-25 Lakhs,₹25-50 Lakhs,₹50 Lakhs - ₹1 Crore,₹1+ Crore',
        status: 'unassigned,assigned,contacted,qualified,converted,dropped'
      };

      // Create CSV with strict validation rules
      const csvContent = `Name,Email,Phone,Company,Business Type,Source,Date of Enquiry,First Touch Base Done By,City of Residence,Country of Residence,Lead for Event,Number of People,Has Valid Passport,Visa Available,Attended Sporting Event Before,Annual Income Bracket,Potential Value,Status,Assigned To,Last Quoted Price,Notes
John Doe,john@example.com,+919876543210,ABC Corp,B2B,Facebook,2025-01-15,Sales Team,Mumbai,India,IPL 2025,2,Yes,Not Required,No,₹25-50 Lakhs,500000,unassigned,,0,Interested in VIP tickets
Jane Smith,jane@example.com,+919876543211,XYZ Ltd,B2C,WhatsApp,2025-01-16,Marketing Team,Delhi,India,FIFA World Cup 2026,4,Not Sure,Required,Yes,₹50 Lakhs - ₹1 Crore,1000000,unassigned,,0,Family trip planned

DROPDOWN VALIDATION RULES - USE ONLY THESE EXACT VALUES:
Business Type: ${dropdownValues.business_type}
Source: ${dropdownValues.source}
Country of Residence: ${dropdownValues.country_of_residence}
Has Valid Passport: ${dropdownValues.has_valid_passport}
Visa Available: ${dropdownValues.visa_available}
Attended Sporting Event Before: ${dropdownValues.attended_sporting_event_before}
Annual Income Bracket: ${dropdownValues.annual_income_bracket}
Status: ${dropdownValues.status}
Valid Assignees: ${validAssignees || 'No active sales users found'}

EXCEL DROPDOWN SETUP INSTRUCTIONS:
1. Select column (e.g., Business Type column E)
2. Go to Data → Data Validation → List
3. Enter source: B2B,B2C
4. This restricts input to only valid values
5. Repeat for each dropdown column

IMPORTANT RULES:
- Business Type: Must be exactly "B2B" or "B2C" (case sensitive)
- Source: Must be one of the listed sources exactly
- Leave Assigned To blank for unassigned leads
- Assigned To must be a valid email from active sales users
- Number of People: Must be a positive integer
- Potential Value/Last Quoted Price: Must be numeric (no currency symbols)`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=sample_leads_with_dropdown_validation.csv');
      res.send(csvContent);

    } else if (type === 'inventory') {
      // Define inventory dropdown options
      const inventoryDropdowns = {
        event_type: 'cricket,football,tennis,basketball,hockey,formula1,other',
        sports: 'Cricket,Football,Tennis,Basketball,Hockey,Formula 1,Other',
        procurement_type: 'pre_inventory,on_demand',
        currency: 'INR,USD,EUR,GBP,AED',
        ticket_source: 'Primary,Secondary,Partner,Reseller',
        status: 'available,allocated,sold,reserved,blocked',
        payment_status: 'pending,partial,paid,overdue'
      };

      const csvContent = `Event Name,Event Date,Event Type,Sports,Venue,Day of Match,Category of Ticket,Stand,Total Tickets,Available Tickets,MRP of Ticket,Buying Price,Selling Price,Inclusions,Booking Person,Procurement Type,Payment Status,Supplier Name,Supplier Invoice,Total Purchase Amount,Amount Paid,Payment Due Date,Notes
IPL 2025 Final,2025-05-28,cricket,Cricket,Wankhede Stadium,Match Day,VIP,Upper Tier,100,100,20000,15000,18000,Food and Beverage,John Doe,pre_inventory,pending,BookMyShow,INV-001,1500000,500000,2025-04-15,Premium seats with hospitality
FIFA World Cup 2026,2026-06-15,football,Football,MetLife Stadium,Match Day,Premium,Lower Bowl,50,50,50000,40000,45000,Meet and Greet,Jane Smith,pre_inventory,paid,FIFA Official,INV-002,2000000,2000000,,Group stage match

DROPDOWN VALIDATION RULES - USE ONLY THESE EXACT VALUES:
Event Type: ${inventoryDropdowns.event_type}
Sports: ${inventoryDropdowns.sports}
Procurement Type: ${inventoryDropdowns.procurement_type}
Currency: ${inventoryDropdowns.currency}
Ticket Source: ${inventoryDropdowns.ticket_source}
Status: ${inventoryDropdowns.status}
Payment Status: ${inventoryDropdowns.payment_status}

EXCEL DROPDOWN SETUP INSTRUCTIONS:
1. Select Event Type column → Data → Data Validation → List
2. Enter: cricket,football,tennis,basketball,hockey,formula1,other
3. Repeat for each dropdown column with respective values

IMPORTANT RULES:
- Event Date: Format YYYY-MM-DD (e.g., 2025-05-28)
- Event Type: Must be lowercase (cricket, football, etc.)
- Sports: Title case (Cricket, Football, etc.)
- Numbers: Total/Available Tickets must be integers
- Prices: Must be numeric (no currency symbols)
- Payment Status: Use exact values - pending, partial, paid, overdue
- Available Tickets: Cannot exceed Total Tickets`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=sample_inventory_with_dropdown_validation.csv');
      res.send(csvContent);

    } else {
      res.status(400).json({ error: 'Invalid type. Use "leads" or "inventory"' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
