const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const { db, collections } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { convertToIST } = require('../utils/dateHelpers');
const csv = require('csv-parser');
const { Readable } = require('stream');
const Lead = require('../models/Lead');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const XLSX = require('xlsx'); // EXCEL SUPPORT

// Import AssignmentRule for auto-assignment logic
const AssignmentRule = require('../models/AssignmentRule');

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT
});
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME || 'fantopark-documents-bucket');

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
fileFilter: (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed'), false);
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
    console.log('⚠️ No date value provided, using current IST date');
    return convertToIST(new Date());
  }

    // Add handling for DD/MM/YY format
  if (typeof dateValue === 'string' && dateValue.match(/^\d{1,2}\/\d{1,2}\/\d{2}$/)) {
    const [day, month, year] = dateValue.split('/');
    const fullYear = year.length === 2 ? '20' + year : year;
    const isoDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    return convertToIST(isoDate);
  }
  
  // If it's already a Date object, convert to IST
  if (dateValue instanceof Date) {
    console.log('✅ Date object found, converting to IST');
    return convertToIST(dateValue);
  }
  
  // If it's a string, try to parse it
  if (typeof dateValue === 'string') {
    const trimmedValue = dateValue.trim();
    
    if (trimmedValue === '') {
      console.log('⚠️ Empty string date, using current IST date');
      return convertToIST(new Date());
    }
    
    // Handle YYYY-MM-DD format (most common CSV format)
    if (trimmedValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      console.log('✅ YYYY-MM-DD format detected');
      return convertToIST(trimmedValue);
    }
    
    // Handle DD/MM/YYYY format
    if (trimmedValue.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      console.log('✅ DD/MM/YYYY format detected');
      const [day, month, year] = trimmedValue.split('/');
      const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      console.log('✅ Converted to:', formattedDate);
      return convertToIST(formattedDate);
    }
    
    // Handle MM/DD/YYYY format (American style)
    if (trimmedValue.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/) && trimmedValue.indexOf('/') !== -1) {
      console.log('✅ Attempting MM/DD/YYYY format');
      const [month, day, year] = trimmedValue.split('/');
      const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      console.log('✅ Converted to:', formattedDate);
      return convertToIST(formattedDate);
    }
    
    // Handle DD-MM-YYYY format
    if (trimmedValue.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
      console.log('✅ DD-MM-YYYY format detected');
      const [day, month, year] = trimmedValue.split('-');
      const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      console.log('✅ Converted to:', formattedDate);
      return convertToIST(formattedDate);
    }
    
    // Handle ISO format with time
    if (trimmedValue.includes('T') || trimmedValue.includes('Z')) {
      console.log('✅ ISO format detected');
      return convertToIST(trimmedValue);
    }
    
    // Try general Date parsing as fallback
    const parsed = new Date(trimmedValue);
    if (!isNaN(parsed.getTime())) {
      console.log('✅ Successfully parsed with Date constructor');
      return convertToIST(parsed);
    }
    
    console.log('⚠️ String date parsing failed for:', trimmedValue, 'using current IST date');
  }
  
  // If it's a number (Excel serial date), convert it
  if (typeof dateValue === 'number' && dateValue > 0) {
    console.log('✅ Excel serial number detected:', dateValue);
    // Excel date serial number (days since 1900-01-01)
    const excelEpoch = new Date(1900, 0, 1);
    const msPerDay = 24 * 60 * 60 * 1000;
    const date = new Date(excelEpoch.getTime() + (dateValue - 2) * msPerDay);
    console.log('✅ Excel date converted to IST:', convertToIST(date));
    return convertToIST(date);
  }
  
  // Default to current IST date if parsing fails
  console.log('⚠️ All parsing methods failed, using current IST date');
  return convertToIST(new Date());
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

// 🔍 **NEW: Preview endpoint for smart client detection**
router.post('/leads/csv/preview', authenticateToken, csvUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('🔍 Preview request for file:', req.file.originalname);

    // Parse the file
    const results = await parseUploadedFile(req.file.buffer, req.file.originalname);
    const preview = [];

    // Process first 50 rows for preview
    const previewRows = results.slice(0, 50);
    
    for (const [index, row] of previewRows.entries()) {
      const phone = String(row.phone || row.Phone || row.PHONE || '');
      let clientInfo = null;
      let assignmentPreview = null;
      
      // Smart client detection for preview
      if (phone) {
        try {
          clientInfo = await Lead.getClientByPhone(phone);
        } catch (error) {
          console.log(`Preview: Client detection failed for row ${index + 1}:`, error.message);
        }
      }

      // Auto-assignment preview (only if no manual assignment and no client detection)
      const manualAssignment = row.assigned_to || row['Assigned To'] || '';
      if (!manualAssignment && !clientInfo) {
        try {
          const leadData = {
            name: row.name || row.Name || '',
            email: row.email || row.Email || '',
            phone: phone,
            business_type: row.business_type || row['Business Type'] || 'B2C',
            source: row.source || row.Source || 'Bulk Upload',
            lead_for_event: row.lead_for_event || row['Lead for Event'] || '',
            country_of_residence: row.country_of_residence || row['Country of Residence'] || 'India'
          };
          
          assignmentPreview = await AssignmentRule.testAssignment(leadData);
        } catch (error) {
          console.log(`Preview: Auto-assignment failed for row ${index + 1}:`, error.message);
        }
      }
      
      preview.push({
        row: index + 2,
        name: row.name || row.Name || '',
        phone: phone,
        email: row.email || row.Email || '',
        assigned_to_in_csv: manualAssignment,
        
        // Client detection results
        client_detected: !!clientInfo,
        existing_leads_count: clientInfo ? clientInfo.total_leads : 0,
        suggested_assigned_to: clientInfo ? clientInfo.primary_assigned_to : null,
        existing_events: clientInfo ? clientInfo.events : [],
        
        // Assignment logic preview
        will_override_assignment: !!(clientInfo && clientInfo.primary_assigned_to && !manualAssignment),
        auto_assignment_preview: assignmentPreview ? assignmentPreview.assigned_to : null,
        assignment_rule_preview: assignmentPreview ? assignmentPreview.rule_matched : null,
        
        // Final assignment prediction
        final_assigned_to: manualAssignment || 
                          (clientInfo && clientInfo.primary_assigned_to) || 
                          (assignmentPreview && assignmentPreview.assigned_to) || 
                          'Unassigned'
      });
    }

    const summary = {
      existing_clients_found: preview.filter(p => p.client_detected).length,
      will_be_auto_assigned: preview.filter(p => p.auto_assignment_preview).length,
      will_be_client_assigned: preview.filter(p => p.will_override_assignment).length,
      manually_assigned: preview.filter(p => p.assigned_to_in_csv).length,
      new_clients: preview.filter(p => !p.client_detected).length,
      will_remain_unassigned: preview.filter(p => p.final_assigned_to === 'Unassigned').length
    };

    res.json({
      success: true,
      preview,
      total_rows: results.length,
      preview_rows: previewRows.length,
      client_detection_summary: summary
    });
    
  } catch (error) {
    console.error('❌ Preview error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 🚀 **ENHANCED: POST bulk upload leads with SMART CLIENT DETECTION**
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
    let clientDetectionCount = 0;
    let autoAssignmentCount = 0;
    let clientAssignmentCount = 0;
    const uploadedLeads = [];
    const clientDetectionResults = [];

    for (const [index, row] of results.entries()) {
      try {
        // Get the assigned_to value and handle empty/invalid assignments
        const assignedToValue = row.assigned_to || row['Assigned To'] || '';
        
        // Enhanced date parsing (existing logic)
        const rawDateValue = row.date_of_enquiry || 
                            row['Date of Enquiry'] || 
                            row['date_of_enquiry'] || 
                            row['Date of enquiry'] ||
                            row['DATE OF ENQUIRY'] ||
                            row['enquiry_date'] ||
                            row['Enquiry Date'];

        console.log(`🔍 Processing lead ${index + 1}: ${row.name || row.Name}`);
        
        const parsedDate = parseDate(rawDateValue);
        
        // Map columns to lead fields (existing logic enhanced)
        let leadData = {
          name: row.name || row.Name || row.NAME || '',
          email: row.email || row.Email || row.EMAIL || '',
          phone: String(row.phone || row.Phone || row.PHONE || ''),
          company: row.company || row.Company || row.COMPANY || '',
          business_type: row.business_type || row['Business Type'] || 'B2C',
          source: row.source || row.Source || 'Bulk Upload',
          date_of_enquiry: parsedDate,
          first_touch_base_done_by: row.first_touch_base_done_by || 
                                   row['First Touch Base Done By'] || 'Bulk Import',
          city_of_residence: row.city_of_residence || 
                            row['City of Residence'] || '',
          country_of_residence: row.country_of_residence || 
                               row['Country of Residence'] || 'India',
          lead_for_event: row.lead_for_event || row['Lead for Event'] || '',
          number_of_people: parseInt(row.number_of_people || 
                                   row['Number of People'] || '1'),
          has_valid_passport: row.has_valid_passport || 
                             row['Has Valid Passport'] || 'Not Sure',
          visa_available: row.visa_available || row['Visa Available'] || 'Not Sure',
          attended_sporting_event_before: row.attended_sporting_event_before || 
                                         row['Attended Sporting Event Before'] || 'Not Sure',
          annual_income_bracket: row.annual_income_bracket || 
                                row['Annual Income Bracket'] || '',
          potential_value: parseFloat(row.potential_value || 
                                     row['Potential Value'] || '0'),
          status: assignedToValue.trim() === '' || assignedToValue === '0' ? 
                 'unassigned' : 'assigned',
          assigned_to: assignedToValue.trim() === '' || assignedToValue === '0' ? '' : assignedToValue,
          last_quoted_price: parseFloat(row.last_quoted_price || 
                                       row['Last Quoted Price'] || '0'),
          notes: row.notes || row.Notes || row.NOTES || '',
          
          // Bulk upload metadata
          bulk_upload: true,
          bulk_upload_date: convertToIST(new Date()),
          bulk_upload_user: req.user.email,
          created_date: convertToIST(new Date()),
          updated_date: convertToIST(new Date())
        };

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

        // Validate email format for assigned_to
        if (leadData.assigned_to && leadData.assigned_to !== '' && !leadData.assigned_to.includes('@')) {
          errors.push({
            row: index + 2,
            error: 'Assigned To must be a valid email address',
            data: leadData
          });
          errorCount++;
          continue;
        }

        // 🎯 **ENHANCED: Auto-Assignment Logic (before client detection)**
        if (!leadData.assigned_to || leadData.assigned_to === '') {
          console.log(`🎯 Row ${index + 1}: No assignment provided - attempting auto-assignment...`);
          
          try {
            const assignment = await AssignmentRule.testAssignment(leadData);
            
            if (assignment && assignment.assigned_to) {
              leadData.assigned_to = assignment.assigned_to;
              leadData.assignment_rule_used = assignment.rule_matched;
              leadData.assignment_reason = assignment.assignment_reason;
              leadData.auto_assigned = assignment.auto_assigned;
              leadData.assignment_rule_id = assignment.rule_id;
              leadData.status = 'assigned';
              autoAssignmentCount++;
              
              console.log(`✅ Row ${index + 1}: Auto-assignment successful: ${assignment.assigned_to}`);
            } else {
              console.log(`⚠️ Row ${index + 1}: No assignment rules matched`);
            }
          } catch (assignmentError) {
            console.error(`❌ Row ${index + 1}: Auto-assignment failed:`, assignmentError);
            // Continue with lead creation even if auto-assignment fails
          }
        }

        // 🔍 **NEW: SMART CLIENT DETECTION LOGIC**
        let clientDetectionResult = null;
        if (leadData.phone) {
          console.log(`🔍 Row ${index + 1}: Running smart client detection for phone: ${leadData.phone}`);
          
          try {
            const clientInfo = await Lead.getClientByPhone(leadData.phone);
            
            if (clientInfo) {
              console.log(`📞 Row ${index + 1}: Existing client found with ${clientInfo.total_leads} leads`);
              clientDetectionCount++;
              
              // Store client detection result for reporting
              clientDetectionResult = {
                phone: leadData.phone,
                client_id: clientInfo.client_id,
                total_existing_leads: clientInfo.total_leads,
                primary_assigned_to: clientInfo.primary_assigned_to,
                existing_events: clientInfo.events || [],
                first_contact: clientInfo.first_contact
              };
              
              // Apply smart client detection logic
              const originalAssignment = leadData.assigned_to;
              
              if (clientInfo.primary_assigned_to && (!originalAssignment || leadData.auto_assigned)) {
                // Override auto-assignment with client's preferred assignee
                leadData.assigned_to = clientInfo.primary_assigned_to;
                leadData.status = 'assigned';
                leadData.assignment_reason = `Smart client detection: Previous leads assigned to ${clientInfo.primary_assigned_to}`;
                leadData.auto_assigned = false; // This is client-based, not rule-based
                clientAssignmentCount++;
                console.log(`📋 Row ${index + 1}: Smart client assignment: ${clientInfo.primary_assigned_to}`);
              } else if (originalAssignment && originalAssignment !== clientInfo.primary_assigned_to) {
                leadData.manual_assignment_override = true;
                console.log(`🔄 Row ${index + 1}: Manual assignment differs from client history`);
              }
              
              // Add client metadata
              leadData.client_id = clientInfo.client_id;
              leadData.is_primary_lead = false; // Bulk uploads are typically not primary
              leadData.client_total_leads = clientInfo.total_leads + 1;
              
              // Merge events arrays safely
              const existingEvents = clientInfo.events || [];
              const newEvent = leadData.lead_for_event;
              leadData.client_events = newEvent && !existingEvents.includes(newEvent) 
                ? [...existingEvents, newEvent] 
                : existingEvents;
                
              leadData.client_first_contact = clientInfo.first_contact;
              leadData.client_last_activity = convertToIST(new Date());
              
              console.log(`✅ Row ${index + 1}: Smart client metadata applied`);
              
            } else {
              console.log(`👤 Row ${index + 1}: New client - creating primary lead`);
              
              // New client - set as primary if it's the first lead for this phone in the batch
              const isFirstInBatch = !uploadedLeads.some(uploaded => uploaded.phone === leadData.phone);
              leadData.is_primary_lead = isFirstInBatch;
              leadData.client_total_leads = 1;
              if (leadData.lead_for_event) {
                leadData.client_events = [leadData.lead_for_event];
              }
              leadData.client_first_contact = leadData.date_of_enquiry || convertToIST(new Date());
            }
            
          } catch (clientError) {
            console.log(`⚠️ Row ${index + 1}: Smart client detection failed (non-critical):`, clientError.message);
            // Continue with regular lead creation if client detection fails
          }
        }

        // Create the lead
        const lead = new Lead(leadData);
        const savedLead = await lead.save();
        
        console.log(`✅ Row ${index + 1}: Successfully saved lead: ${leadData.name}`);
        
        // Update existing client metadata if this was an existing client
        if (clientDetectionResult) {
          try {
            await Lead.updateClientMetadata(clientDetectionResult.client_id, {
              client_total_leads: clientDetectionResult.total_existing_leads + 1,
              client_events: leadData.client_events,
              client_last_activity: convertToIST(new Date())
            });
            console.log(`✅ Row ${index + 1}: Updated existing client metadata`);
          } catch (updateError) {
            console.log(`⚠️ Row ${index + 1}: Failed to update client metadata:`, updateError.message);
          }
        }
        
        // Store for reporting
        uploadedLeads.push({
          id: savedLead.id,
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
          company: leadData.company,
          source: leadData.source,
          date_of_enquiry: leadData.date_of_enquiry,
          status: leadData.status,
          assigned_to: leadData.assigned_to,
          business_type: leadData.business_type,
          auto_assigned: leadData.auto_assigned || false,
          assignment_reason: leadData.assignment_reason || '',
          client_detected: !!clientDetectionResult,
          client_id: leadData.client_id || null,
          is_primary_lead: leadData.is_primary_lead || false
        });
        
        // Store client detection results for reporting
        if (clientDetectionResult) {
          clientDetectionResults.push({
            row: index + 2,
            lead_name: leadData.name,
            phone: leadData.phone,
            ...clientDetectionResult,
            assigned_to_from_detection: leadData.assigned_to
          });
        }
        
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

    // Enhanced response with smart client detection statistics
    console.log(`📊 Bulk upload completed: ${successCount} successful, ${errorCount} failed`);
    console.log(`🔍 Smart client detection: ${clientDetectionCount} existing clients found`);
    console.log(`🎯 Auto-assignments: ${autoAssignmentCount} rules applied`);
    console.log(`📞 Client-based assignments: ${clientAssignmentCount} applied`);

    const summary = {
      new_clients: successCount - clientDetectionCount,
      existing_clients: clientDetectionCount,
      auto_assigned: autoAssignmentCount,
      client_assigned: clientAssignmentCount,
      manually_assigned: uploadedLeads.filter(lead => 
        lead.assigned_to && !lead.auto_assigned && !lead.client_detected).length,
      unassigned: uploadedLeads.filter(lead => !lead.assigned_to).length
    };

    res.json({
      success: true,
      message: `Import completed. ${successCount} leads imported successfully, ${errorCount} failed.`,
      totalProcessed: results.length,
      successCount,
      errorCount,
      autoAssignmentCount,
      clientDetectionCount,
      clientAssignmentCount,
      uploadedLeads: uploadedLeads,
      clientDetectionResults: clientDetectionResults.slice(0, 10), // Limit for response size
      errors: errors.slice(0, 10), // Limit error reporting
      summary,
      uploadSessionId: `upload_${Date.now()}_${req.user.email}`,
      fileName: req.file.originalname
    });
    
  } catch (error) {
    console.error('❌ Bulk upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST bulk upload inventory from CSV/Excel - ENHANCED VERSION (unchanged from your original)
// In backend/src/routes/upload.js
// Replace the inventory CSV upload endpoint with this updated version:

// POST bulk upload inventory from CSV/Excel - WITH CATEGORIES SUPPORT
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
    const createdInventoryIds = [];

    // Group rows by event_name and event_date for multi-category support
    const groupedEvents = {};
    
    results.forEach((row, index) => {
      // Skip empty rows or comment rows
      if (!row.event_name || row.event_name.startsWith('#')) {
        return;
      }
      
      // Create a unique key for grouping
      const eventKey = `${row.event_name}||${row.event_date}`;
      
      if (!groupedEvents[eventKey]) {
        groupedEvents[eventKey] = {
          eventInfo: {
            event_name: row.event_name || '',
            event_date: parseDate(row.event_date || ''),
            event_type: row.event_type || '',
            sports: row.sports || '',
            venue: row.venue || '',
            day_of_match: row.day_of_match || 'Not Applicable',
            booking_person: row.booking_person || '',
            procurement_type: row.procurement_type || 'pre_inventory',
            notes: row.notes || '',
            paymentStatus: row.paymentStatus || 'pending',
            supplierName: row.supplierName || '',
            supplierInvoice: row.supplierInvoice || '',
            paymentDueDate: row.paymentDueDate || ''
          },
          categories: [],
          rowIndices: []
        };
      }
      
      // Add category data
      const categoryData = {
        name: row.category_name || row.category_of_ticket || 'General',
        section: row.section || row.stand || '',
        total_tickets: parseInt(row.total_tickets) || 0,
        available_tickets: parseInt(row.available_tickets) || parseInt(row.total_tickets) || 0,
        buying_price: parseFloat(row.buying_price) || 0,
        selling_price: parseFloat(row.selling_price) || 0,
        inclusions: row.inclusions || ''
      };
      
      groupedEvents[eventKey].categories.push(categoryData);
      groupedEvents[eventKey].rowIndices.push(index + 2); // Excel row number (1-indexed + header)
    });

    console.log(`📦 Grouped into ${Object.keys(groupedEvents).length} unique events`);

    // Process each grouped event
    for (const [eventKey, eventData] of Object.entries(groupedEvents)) {
      try {
        const { eventInfo, categories, rowIndices } = eventData;
        
        // Validate required fields
        if (!eventInfo.event_name || !eventInfo.event_date) {
          errors.push({
            rows: rowIndices,
            error: 'Missing required fields (event_name or event_date)',
            event: eventKey
          });
          errorCount++;
          continue;
        }

        // Calculate aggregate values from categories
        const totals = categories.reduce((acc, cat) => {
          const catTotal = cat.total_tickets * cat.buying_price;
          return {
            total_tickets: acc.total_tickets + cat.total_tickets,
            available_tickets: acc.available_tickets + cat.available_tickets,
            total_purchase_amount: acc.total_purchase_amount + catTotal
          };
        }, { total_tickets: 0, available_tickets: 0, total_purchase_amount: 0 });

        // Create inventory data with categories
        const inventoryData = {
          ...eventInfo,
          categories: categories,
          total_tickets: totals.total_tickets,
          available_tickets: totals.available_tickets,
          totalPurchaseAmount: totals.total_purchase_amount,
          
          // Set amount paid based on payment status
          amountPaid: eventInfo.paymentStatus === 'paid' ? totals.total_purchase_amount : 0,
          
          // Legacy fields for backward compatibility (use first category values)
          category_of_ticket: categories[0].name,
          stand: categories[0].section,
          buying_price: categories[0].buying_price,
          selling_price: categories[0].selling_price,
          inclusions: categories[0].inclusions,
          
          // Metadata
          created_by: req.user.name,
          created_date: convertToIST(new Date()),
          updated_date: convertToIST(new Date())
        };

        console.log(`Creating inventory: ${eventInfo.event_name} with ${categories.length} categories`);

        // Save to database
        const docRef = await db.collection('crm_inventory').add(inventoryData);
        createdInventoryIds.push(docRef.id);
        
        // Create payable if needed
        if ((inventoryData.paymentStatus === 'pending' || inventoryData.paymentStatus === 'partial') && 
            inventoryData.totalPurchaseAmount > 0) {
          try {
            const pendingAmount = inventoryData.totalPurchaseAmount - (inventoryData.amountPaid || 0);
            
            if (pendingAmount > 0) {
              const payableData = {
                inventoryId: docRef.id,
                supplierName: inventoryData.supplierName || 'Unknown Supplier',
                eventName: inventoryData.event_name,
                invoiceNumber: inventoryData.supplierInvoice || `INV-${Date.now()}`,
                amount: pendingAmount,
                dueDate: inventoryData.paymentDueDate || null,
                status: 'pending',
                created_date: convertToIST(new Date()),
                updated_date: convertToIST(new Date()),
                createdBy: req.user.id,
                description: `Payment for inventory: ${inventoryData.event_name}`,
                payment_notes: `Created from CSV import - ${categories.length} categories`
              };
              
              await db.collection('crm_payables').add(payableData);
              console.log(`Payable created for ${eventInfo.event_name}`);
            }
          } catch (payableError) {
            console.error('Error creating payable:', payableError);
            // Don't fail the import if payable creation fails
          }
        }
        
        successCount++;
        console.log(`✅ Successfully created: ${eventInfo.event_name}`);
        
      } catch (error) {
        console.error(`❌ Error processing event ${eventKey}:`, error);
        errors.push({
          rows: rowIndices,
          error: error.message,
          event: eventKey
        });
        errorCount++;
      }
    }

    // Prepare summary with categories info
    const summary = {
      totalRows: results.length,
      uniqueEvents: Object.keys(groupedEvents).length,
      eventsWithMultipleCategories: Object.values(groupedEvents).filter(e => e.categories.length > 1).length,
      totalCategories: Object.values(groupedEvents).reduce((sum, e) => sum + e.categories.length, 0)
    };

    res.json({
      success: true,
      message: `Import completed. ${successCount} inventory items created with categories.`,
      summary: summary,
      successCount,
      errorCount,
      createdInventoryIds: createdInventoryIds,
      errors: errors.slice(0, 10), // Limit error reporting
      uploadSessionId: `inventory_upload_${Date.now()}_${req.user.email}`,
      fileName: req.file.originalname
    });
    
  } catch (error) {
    console.error('❌ Bulk upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET endpoint to generate sample CSV with dropdown validation (unchanged from your original)
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
- Phone format: +CountryCode followed by number

🔍 SMART CLIENT DETECTION:
- System will automatically detect existing clients by phone number
- New leads for existing clients will be assigned to the same person who handled previous leads
- Manual assignments in CSV will override smart client detection
- Preview your upload to see client detection results before importing`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=sample_leads_with_smart_client_detection.csv');
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

// Enhanced Excel sample generation with real validation (unchanged from your original)
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
        'SMART CLIENT DETECTION:', 'System detects existing clients by phone', 'Assigns to same person automatically', 'Override with manual assignment', 
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Leave blank for auto-assignment'
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
    res.setHeader('Content-Disposition', 'attachment; filename="leads_with_smart_client_detection.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Length', workbookOut.length);
    
    res.send(workbookOut);
    
  } catch (error) {
    console.error('Excel validation error:', error);
    res.status(500).json({ error: 'Failed to create Excel with validation: ' + error.message });
  }
});

// Add missing Excel download routes that frontend expects (unchanged from your original)
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
