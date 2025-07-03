const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const { authenticateToken } = require('../middleware/auth');
const csv = require('csv-parser');
const { Readable } = require('stream');
const Lead = require('../models/Lead');
const Inventory = require('../models/Inventory');

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

// POST bulk upload leads from CSV
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
              status: row.status || row.Status || 'unassigned',
              assigned_to: row.assigned_to || row['Assigned To'] || '',
              last_quoted_price: parseFloat(row.last_quoted_price || row['Last Quoted Price'] || '0'),
              notes: row.notes || row.Notes || ''
            };

            // Validate required fields
            if (!leadData.name || !leadData.email || !leadData.phone) {
              errors.push({
                row: index + 2, // +2 because CSV has header row and arrays are 0-indexed
                error: 'Missing required fields (name, email, or phone)'
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
          errors: errors.slice(0, 10) // Return first 10 errors
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
// Updated inventory CSV upload route in backend/src/routes/upload.js
// POST bulk upload inventory from CSV
// Updated inventory CSV upload handler in backend/src/routes/upload.js
// Replace the existing inventory CSV upload section

// POST bulk upload inventory from CSV
// CORRECTED inventory CSV upload handler in backend/src/routes/upload.js
// Replace the existing inventory CSV upload section

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
            console.log(`Processing CSV row ${index + 1}:`, row);
            
            // Map CSV columns to EXACT inventory field names from your form data
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
              stand: row.stand || row['Stand/Section'] || '',
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
              
              // Payment Information - EXACT FIELD NAMES FROM YOUR FORM
              paymentStatus: row.paymentStatus || row['Payment Status'] || 'pending',
              supplierName: row.supplierName || row['Supplier Name'] || '',
              supplierInvoice: row.supplierInvoice || row['Supplier Invoice'] || '',
              purchasePrice: parseFloat(row.purchasePrice || row['Purchase Price'] || '0'),
              totalPurchaseAmount: parseFloat(row.totalPurchaseAmount || row['Total Purchase Amount'] || '0'),
              amountPaid: parseFloat(row.amountPaid || row['Amount Paid'] || '0'),
              paymentDueDate: row.paymentDueDate || row['Payment Due Date'] || '',
              
              // Legacy/Calculated fields (keeping for compatibility)
              vendor_name: row.vendor_name || row['Vendor Name'] || row.supplierName || row['Supplier Name'] || '',
              price_per_ticket: parseFloat(row.price_per_ticket || row['Price per Ticket'] || row.selling_price || row['Selling Price'] || '0'),
              number_of_tickets: parseInt(row.number_of_tickets || row['Number of Tickets'] || row.total_tickets || row['Total Tickets'] || '0'),
              total_value_of_tickets: parseFloat(row.total_value_of_tickets || row['Total Value of Tickets'] || '0'),
              currency: row.currency || row.Currency || 'INR',
              base_amount_inr: parseFloat(row.base_amount_inr || row['Base Amount INR'] || '0'),
              gst_18_percent: parseFloat(row.gst_18_percent || row['GST 18%'] || '0'),
              selling_price_per_ticket: parseFloat(row.selling_price_per_ticket || row['Selling Price per Ticket'] || row.selling_price || row['Selling Price'] || '0'),
              payment_due_date: row.payment_due_date || row['Payment Due Date'] || row.paymentDueDate || '',
              supplier_name: row.supplier_name || row['Supplier Name'] || row.supplierName || '',
              ticket_source: row.ticket_source || row['Ticket Source'] || 'Primary',
              status: row.status || row.Status || 'available',
              allocated_to_order: row.allocated_to_order || row['Allocated to Order'] || '',
              
              // System fields
              created_date: new Date().toISOString(),
              updated_date: new Date().toISOString()
            };

            // Auto-calculate missing values based on your form logic
            if (!inventoryData.totalPurchaseAmount && inventoryData.buying_price && inventoryData.total_tickets) {
              inventoryData.totalPurchaseAmount = inventoryData.buying_price * inventoryData.total_tickets;
            }

            if (!inventoryData.total_value_of_tickets && inventoryData.selling_price && inventoryData.total_tickets) {
              inventoryData.total_value_of_tickets = inventoryData.selling_price * inventoryData.total_tickets;
            }

            if (!inventoryData.purchasePrice && inventoryData.buying_price) {
              inventoryData.purchasePrice = inventoryData.buying_price;
            }

            // Sync legacy fields with new ones
            if (!inventoryData.vendor_name && inventoryData.supplierName) {
              inventoryData.vendor_name = inventoryData.supplierName;
            }
            if (!inventoryData.supplier_name && inventoryData.supplierName) {
              inventoryData.supplier_name = inventoryData.supplierName;
            }
            if (!inventoryData.payment_due_date && inventoryData.paymentDueDate) {
              inventoryData.payment_due_date = inventoryData.paymentDueDate;
            }
            if (!inventoryData.price_per_ticket && inventoryData.selling_price) {
              inventoryData.price_per_ticket = inventoryData.selling_price;
            }
            if (!inventoryData.selling_price_per_ticket && inventoryData.selling_price) {
              inventoryData.selling_price_per_ticket = inventoryData.selling_price;
            }
            if (!inventoryData.number_of_tickets && inventoryData.total_tickets) {
              inventoryData.number_of_tickets = inventoryData.total_tickets;
            }

            // Ensure available tickets don't exceed total tickets
            if (inventoryData.available_tickets > inventoryData.total_tickets) {
              inventoryData.available_tickets = inventoryData.total_tickets;
            }

            console.log(`Processed inventory data for row ${index + 1}:`, {
              event_name: inventoryData.event_name,
              paymentStatus: inventoryData.paymentStatus,
              supplierName: inventoryData.supplierName,
              supplierInvoice: inventoryData.supplierInvoice,
              totalPurchaseAmount: inventoryData.totalPurchaseAmount,
              amountPaid: inventoryData.amountPaid,
              paymentDueDate: inventoryData.paymentDueDate
            });

            // Validate required fields
            if (!inventoryData.event_name || !inventoryData.event_date || !inventoryData.venue) {
              errors.push({
                row: index + 2,
                error: 'Missing required fields (Event Name, Event Date, or Venue)'
              });
              errorCount++;
              continue;
            }

            // Validate ticket quantities
            if (inventoryData.total_tickets <= 0) {
              errors.push({
                row: index + 2,
                error: 'Total tickets must be greater than 0'
              });
              errorCount++;
              continue;
            }

            // Validate pricing - only check if they are provided
            if ((inventoryData.mrp_of_ticket && inventoryData.mrp_of_ticket <= 0) || 
                (inventoryData.buying_price && inventoryData.buying_price <= 0) || 
                (inventoryData.selling_price && inventoryData.selling_price <= 0)) {
              errors.push({
                row: index + 2,
                error: 'Pricing values must be greater than 0 when provided'
              });
              errorCount++;
              continue;
            }

            const inventory = new Inventory(inventoryData);
            const savedInventory = await inventory.save();
            console.log(`✅ Successfully saved inventory with ID: ${savedInventory.id}`);
            console.log(`Payment info saved:`, {
              paymentStatus: savedInventory.paymentStatus,
              supplierName: savedInventory.supplierName,
              totalPurchaseAmount: savedInventory.totalPurchaseAmount
            });
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
          errors: errors.slice(0, 10) // Return first 10 errors
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
module.exports = router;
