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
              business_type: row.business_type || row['Business Type'] || '',
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

// POST bulk upload inventory from CSV - FIXED VERSION
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
            console.log('Raw row values:', Object.values(row));
            
            // EXACT field mapping based on your form data structure
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
              
              // PAYMENT INFORMATION - EXACT FIELD NAMES
              paymentStatus: row.paymentStatus || row['Payment Status'] || row.payment_status || 'pending',
              supplierName: row.supplierName || row['Supplier Name'] || row.supplier_name || '',
              supplierInvoice: row.supplierInvoice || row['Supplier Invoice'] || row.supplier_invoice || '',
              purchasePrice: parseFloat(row.purchasePrice || row['Purchase Price'] || row.purchase_price || '0'),
              totalPurchaseAmount: parseFloat(row.totalPurchaseAmount || row['Total Purchase Amount'] || row.total_purchase_amount || '0'),
              amountPaid: parseFloat(row.amountPaid || row['Amount Paid'] || row.amount_paid || '0'),
              paymentDueDate: row.paymentDueDate || row['Payment Due Date'] || row.payment_due_date || '',
              
              // Legacy fields for compatibility
              vendor_name: row.vendor_name || row['Vendor Name'] || row.supplierName || row['Supplier Name'] || '',
              price_per_ticket: parseFloat(row.price_per_ticket || row['Price per Ticket'] || row.selling_price || '0'),
              number_of_tickets: parseInt(row.number_of_tickets || row['Number of Tickets'] || row.total_tickets || '0'),
              currency: row.currency || row.Currency || 'INR',
              status: row.status || row.Status || 'available',
              
              // System fields
              created_date: new Date().toISOString(),
              updated_date: new Date().toISOString(),
              created_by: req.user.name || 'CSV Import'
            };

            console.log('💰 Payment fields extracted:');
            console.log('  paymentStatus:', inventoryData.paymentStatus);
            console.log('  supplierName:', inventoryData.supplierName);
            console.log('  supplierInvoice:', inventoryData.supplierInvoice);
            console.log('  purchasePrice:', inventoryData.purchasePrice);
            console.log('  totalPurchaseAmount:', inventoryData.totalPurchaseAmount);
            console.log('  amountPaid:', inventoryData.amountPaid);
            console.log('  paymentDueDate:', inventoryData.paymentDueDate);

            // Auto-calculate missing values
            if (!inventoryData.totalPurchaseAmount && inventoryData.purchasePrice && inventoryData.total_tickets) {
              inventoryData.totalPurchaseAmount = inventoryData.purchasePrice * inventoryData.total_tickets;
              console.log('🧮 Auto-calculated totalPurchaseAmount:', inventoryData.totalPurchaseAmount);
            }

            if (!inventoryData.totalPurchaseAmount && inventoryData.buying_price && inventoryData.total_tickets) {
              inventoryData.totalPurchaseAmount = inventoryData.buying_price * inventoryData.total_tickets;
              console.log('🧮 Auto-calculated totalPurchaseAmount from buying_price:', inventoryData.totalPurchaseAmount);
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

            console.log('💾 Final inventory data to save:');
            console.log(JSON.stringify(inventoryData, null, 2));

            // USE THE INVENTORY MODEL TO SAVE
            const inventory = new Inventory(inventoryData);
            const savedInventory = await inventory.save();
            
            console.log('✅ Successfully saved inventory with ID:', savedInventory.id);
            console.log('✅ Payment fields in saved data:');
            console.log('  paymentStatus:', savedInventory.paymentStatus);
            console.log('  supplierName:', savedInventory.supplierName);
            console.log('  totalPurchaseAmount:', savedInventory.totalPurchaseAmount);
            
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

module.exports = router;
