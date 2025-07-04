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

// POST bulk upload inventory from CSV
router.post('/inventory/csv', authenticateToken, csvUpload.single('file'), async (req, res) => {
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
            // Map CSV columns to inventory fields
            const inventoryData = {
              event_name: row.event_name || row['Event Name'] || '',
              event_date: row.event_date || row['Event Date'] || '',
              event_type: row.event_type || row['Event Type'] || '',
              sports: row.sports || row.Sports || '',
              venue: row.venue || row.Venue || '',
              day_of_match: row.day_of_match || row['Day of Match'] || '',
              category_of_ticket: row.category_of_ticket || row['Category of Ticket'] || '',
              price_per_ticket: parseFloat(row.price_per_ticket || row['Price per Ticket'] || '0'),
              number_of_tickets: parseInt(row.number_of_tickets || row['Number of Tickets'] || '0'),
              total_value_of_tickets: parseFloat(row.total_value_of_tickets || row['Total Value of Tickets'] || '0'),
              currency: row.currency || row.Currency || 'INR',
              base_amount_inr: parseFloat(row.base_amount_inr || row['Base Amount INR'] || '0'),
              gst_18: parseFloat(row.gst_18 || row['GST 18%'] || '0'),
              selling_price_per_ticket: parseFloat(row.selling_price_per_ticket || row['Selling Price per Ticket'] || '0'),
              payment_due_date: row.payment_due_date || row['Payment Due Date'] || '',
              supplier_name: row.supplier_name || row['Supplier Name'] || '',
              ticket_source: row.ticket_source || row['Ticket Source'] || '',
              status: row.status || row.Status || 'available',
              allocated_to_order: row.allocated_to_order || row['Allocated to Order'] || '',
              notes: row.notes || row.Notes || ''
            };

            // Validate required fields
            if (!inventoryData.event_name || !inventoryData.event_date) {
              errors.push({
                row: index + 2,
                error: 'Missing required fields (event_name or event_date)'
              });
              errorCount++;
              continue;
            }

            const inventory = new Inventory(inventoryData);
            await inventory.save();
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
      })
      .on('error', (error) => {
        res.status(500).json({ error: 'Error parsing CSV: ' + error.message });
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
      const salesUsers = users.filter(u => ['sales_executive', 'sales_manager'].includes(u.role));
      const validAssignees = salesUsers.map(u => u.email).join('|'); // For Excel validation
      
      // Define dropdown options
      const dropdownValues = {
        business_type: 'B2B|B2C',
        source: 'Facebook|WhatsApp|Instagram|LinkedIn|Referral|Website|Other',
        country_of_residence: 'India|USA|UK|Canada|Australia|UAE|Other',
        has_valid_passport: 'Yes|No|Not Sure',
        visa_available: 'Required|Not Required|Processing|Not Sure',
        attended_sporting_event_before: 'Yes|No|Not Sure',
        annual_income_bracket: '₹5-15 Lakhs|₹15-25 Lakhs|₹25-50 Lakhs|₹50 Lakhs - ₹1 Crore|₹1+ Crore',
        status: 'unassigned|assigned|contacted|qualified|converted|dropped',
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
- Leave Assigned To blank for unassigned leads
- Assigned To must be a valid email from the active user list
- Status will auto-update to 'assigned' when Assigned To is provided
- Number of People must be a positive integer
- Potential Value and Last Quoted Price must be numeric`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=sample_leads_with_validation.csv');
      res.send(csvContent);

    } else if (type === 'inventory') {
      const csvContent = `Event Name,Event Date,Event Type,Sports,Venue,Day of Match,Category of Ticket,Price per Ticket,Number of Tickets,Total Value of Tickets,Currency,Base Amount INR,GST 18%,Selling Price per Ticket,Payment Due Date,Supplier Name,Ticket Source,Status,Allocated to Order,Notes
IPL 2025 Final,2025-05-28,cricket,Cricket,Wankhede Stadium,Not Applicable,VIP,15000,10,150000,INR,150000,27000,17700,2025-04-15,Ticket Master,Primary,available,,Premium seats
FIFA World Cup 2026,2026-06-15,football,Football,MetLife Stadium,Not Applicable,Premium,25000,20,500000,USD,2000000,360000,118000,2026-03-01,FIFA Official,Primary,available,,Group stage match

VALIDATION RULES:
Event Type: cricket|football|tennis|basketball|other
Sports: Cricket|Football|Tennis|Basketball|Hockey|Other
Currency: INR|USD|EUR|GBP
Ticket Source: Primary|Secondary|Partner|Other
Status: available|allocated|sold|reserved

NOTES:
- Event Date format: YYYY-MM-DD
- Price fields must be numeric
- GST 18% is auto-calculated in the system
- Leave Allocated to Order blank for available inventory`;

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

module.exports = router;
