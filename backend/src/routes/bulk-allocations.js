const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parse');
const { db } = require('../config/db');
const admin = require('../config/firebase');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// Configure multer for CSV uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Parse and validate bulk allocation CSV
router.post('/preview', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const fileContent = req.file.buffer.toString('utf-8');
    const records = [];
    
    // Parse CSV
    const parser = csv.parse({
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    parser.on('readable', function() {
      let record;
      while ((record = parser.read()) !== null) {
        records.push(record);
      }
    });

    parser.on('error', function(err) {
      console.error('CSV parsing error:', err);
    });

    parser.write(fileContent);
    parser.end();

    // Wait for parsing to complete
    await new Promise((resolve) => {
      parser.on('end', resolve);
    });

    console.log(`Parsed ${records.length} records from CSV`);

    // Validate and enrich each record
    const validationResults = [];
    const inventoryCache = new Map();
    const leadCache = new Map();

    for (const [index, record] of records.entries()) {
      const result = {
        row: index + 2, // Row number in CSV (1-indexed, skipping header)
        data: record,
        status: 'pending',
        errors: [],
        warnings: [],
        enrichedData: {}
      };

      // Validate required fields
      if (!record.event_name) {
        result.errors.push('Event name is required');
      }
      if (!record.lead_identifier) {
        result.errors.push('Lead identifier (phone/email) is required');
      }
      if (!record.tickets_to_allocate || isNaN(record.tickets_to_allocate) || parseInt(record.tickets_to_allocate) <= 0) {
        result.errors.push('Valid number of tickets is required');
      }

      if (result.errors.length > 0) {
        result.status = 'error';
        validationResults.push(result);
        continue;
      }

      // Look up inventory
      let inventory = inventoryCache.get(record.event_name);
      if (!inventory) {
        const inventorySnapshot = await db.collection('crm_inventory')
          .where('event_name', '==', record.event_name)
          .limit(1)
          .get();

        // Filter out deleted items
        const validDocs = inventorySnapshot.docs.filter(doc => 
          doc.data().isDeleted !== true
        );
        
        if (validDocs.length > 0) {
          const doc = validDocs[0];
          inventory = { id: doc.id, ...doc.data() };
          inventoryCache.set(record.event_name, inventory);
        }
      }

      if (!inventory) {
        result.errors.push(`Event "${record.event_name}" not found in inventory`);
        result.status = 'error';
        validationResults.push(result);
        continue;
      }

      result.enrichedData.inventory = {
        id: inventory.id,
        event_name: inventory.event_name,
        available_tickets: inventory.available_tickets,
        has_categories: inventory.categories && inventory.categories.length > 0
      };

      // Look up lead by phone or email + event name
      const leadIdentifier = record.lead_identifier.trim();
      const cacheKey = `${leadIdentifier}_${record.event_name}`;
      let lead = leadCache.get(cacheKey);
      
      if (!lead) {
        // Try phone first (remove non-digits and check)
        const cleanPhone = leadIdentifier.replace(/\D/g, '');
        let allLeadsSnapshots = [];

        if (cleanPhone.length >= 10) {
          // Search by phone - get ALL matching leads
          const phoneQueries = [
            db.collection('crm_leads').where('phone', '==', leadIdentifier).get(),
            db.collection('crm_leads').where('phone', '==', cleanPhone).get()
          ];
          
          if (!leadIdentifier.startsWith('+91')) {
            phoneQueries.push(
              db.collection('crm_leads').where('phone', '==', '+91' + cleanPhone).get()
            );
          }
          
          const phoneResults = await Promise.all(phoneQueries);
          phoneResults.forEach(snapshot => {
            if (!snapshot.empty) {
              allLeadsSnapshots.push(...snapshot.docs);
            }
          });
        }

        // If not found by phone, try email
        if (allLeadsSnapshots.length === 0 && leadIdentifier.includes('@')) {
          const emailSnapshot = await db.collection('crm_leads')
            .where('email', '==', leadIdentifier.toLowerCase())
            .get();
          
          if (!emailSnapshot.empty) {
            allLeadsSnapshots.push(...emailSnapshot.docs);
          }
        }

        if (allLeadsSnapshots.length > 0) {
          // Filter out deleted leads and find the one matching the event
          const validLeads = allLeadsSnapshots
            .filter(doc => doc.data().isDeleted !== true)
            .map(doc => ({ id: doc.id, ...doc.data() }));
          
          console.log(`Found ${validLeads.length} valid leads for identifier ${leadIdentifier}`);
          
          // First try to find exact event match in lead_for_event
          let matchingLead = validLeads.find(leadData => 
            leadData.lead_for_event === record.event_name
          );
          
          // If no exact match, check client_events array
          if (!matchingLead) {
            matchingLead = validLeads.find(leadData => 
              leadData.client_events && 
              leadData.client_events.includes(record.event_name)
            );
          }
          
          // If still no match but we have leads, take the first one and add warning
          if (!matchingLead && validLeads.length > 0) {
            matchingLead = validLeads[0];
            result.warnings.push(`No lead found for exact event match. Using lead for ${matchingLead.lead_for_event || 'unknown event'}`);
          }
          
          if (matchingLead) {
            lead = matchingLead;
            leadCache.set(cacheKey, lead);
            console.log(`Matched lead ${lead.id} for event ${record.event_name}`);
          }
        }
      }

      if (!lead) {
        result.errors.push(`Lead not found with identifier: ${leadIdentifier}`);
        result.status = 'error';
        validationResults.push(result);
        continue;
      }

      result.enrichedData.lead = {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        company: lead.company,
        lead_for_event: lead.lead_for_event
      };

      // Validate category if specified
      const ticketsToAllocate = parseInt(record.tickets_to_allocate);
      
      if (record.category_name && inventory.categories) {
        // Match by both category name AND section/stand
        const category = inventory.categories.find(cat => {
          const categoryMatches = cat.name.toLowerCase() === record.category_name.toLowerCase();
          const sectionMatches = !record.stand_section || 
            (cat.section && cat.section.toLowerCase() === record.stand_section.toLowerCase());
          return categoryMatches && sectionMatches;
        });

        if (!category) {
          if (record.stand_section) {
            result.errors.push(`Category "${record.category_name}" with section "${record.stand_section}" not found for this event`);
          } else {
            result.errors.push(`Category "${record.category_name}" not found for this event`);
          }
          result.status = 'error';
        } else {
          result.enrichedData.category = {
            name: category.name,
            section: category.section || '',
            available_tickets: category.available_tickets || 0,
            selling_price: category.selling_price || inventory.selling_price || 0
          };

          // Check availability for category
          if (category.available_tickets < ticketsToAllocate) {
            result.errors.push(`Not enough tickets available in category. Available: ${category.available_tickets}, Requested: ${ticketsToAllocate}`);
            result.status = 'error';
          }
        }
      } else if (record.category_name && !inventory.categories) {
        result.warnings.push('Category specified but inventory has no categories - will allocate from general pool');
      } else if (!record.category_name && inventory.categories && inventory.categories.length > 0) {
        result.warnings.push('No category specified for categorized inventory - allocation may fail');
      }

      // Check overall availability
      if (!result.enrichedData.category && inventory.available_tickets < ticketsToAllocate) {
        result.errors.push(`Not enough tickets available. Available: ${inventory.available_tickets}, Requested: ${ticketsToAllocate}`);
        result.status = 'error';
      }

      // Check for existing allocation
      const existingAllocationSnapshot = await db.collection('crm_allocations')
        .where('inventory_id', '==', inventory.id)
        .where('lead_id', '==', lead.id)
        .get();

      if (!existingAllocationSnapshot.empty) {
        // Filter out deleted allocations
        const validAllocations = existingAllocationSnapshot.docs.filter(doc => 
          doc.data().isDeleted !== true
        );
        
        if (validAllocations.length > 0) {
          const totalExisting = validAllocations.reduce((sum, doc) => 
            sum + (doc.data().tickets_allocated || 0), 0
          );
          result.warnings.push(`Lead already has ${totalExisting} tickets allocated for this event`);
          result.enrichedData.existingAllocations = validAllocations.map(doc => ({
            id: doc.id,
            tickets: doc.data().tickets_allocated,
            category: doc.data().category_name
          }));
        }
      }

      // Validate order_id if provided (can be either document ID or order_number)
      if (record.order_id) {
        let orderSnapshot;
        
        // First try as document ID
        if (record.order_id.length === 20 && !record.order_id.includes('-')) {
          orderSnapshot = await db.collection('crm_orders')
            .doc(record.order_id)
            .get();
        }
        
        // If not found or not a valid doc ID format, search by order_number
        if (!orderSnapshot || !orderSnapshot.exists) {
          const orderQuery = await db.collection('crm_orders')
            .where('order_number', '==', record.order_id)
            .limit(1)
            .get();
          
          if (!orderQuery.empty) {
            orderSnapshot = orderQuery.docs[0];
          }
        }

        if (!orderSnapshot || !orderSnapshot.exists) {
          result.warnings.push(`Order "${record.order_id}" not found - will create allocation without order link`);
        } else {
          const orderData = orderSnapshot.data();
          
          // FIXED: Allow multiple allocations for the same lead-order combination
          // Only error if the order belongs to a completely different lead
          // If the CSV has the same lead as the order, it's valid (multiple allocations)
          if (orderData.lead_id && orderData.lead_id !== lead.id) {
            // Double check if the order's lead_name matches the current lead
            if (orderData.lead_name && 
                (orderData.lead_name.toLowerCase() === lead.name?.toLowerCase() ||
                 orderData.client_name?.toLowerCase() === lead.name?.toLowerCase() ||
                 orderData.legal_name?.toLowerCase() === lead.name?.toLowerCase())) {
              // Names match, this is likely the same lead - allow it
              result.enrichedData.order = {
                id: orderSnapshot.id,
                order_number: orderData.order_number
              };
              result.warnings.push(`Order lead_id mismatch but names match - proceeding with allocation`);
            } else {
              result.errors.push(`Order "${record.order_id}" belongs to a different lead`);
              result.status = 'error';
            }
          } else {
            // No lead_id in order or it matches - proceed normally
            result.enrichedData.order = {
              id: orderSnapshot.id,
              order_number: orderData.order_number
            };
          }
        }
      }

      // Set final status
      if (result.errors.length === 0) {
        result.status = 'valid';
        result.enrichedData.tickets_to_allocate = ticketsToAllocate;
        result.enrichedData.notes = record.notes || '';
        result.enrichedData.price_override = record.price_override ? parseFloat(record.price_override) : null;
      } else {
        result.status = 'error';
      }

      validationResults.push(result);
    }

    // Summary statistics
    const summary = {
      total_rows: validationResults.length,
      valid_rows: validationResults.filter(r => r.status === 'valid').length,
      error_rows: validationResults.filter(r => r.status === 'error').length,
      warning_rows: validationResults.filter(r => r.warnings.length > 0).length,
      total_tickets: validationResults
        .filter(r => r.status === 'valid')
        .reduce((sum, r) => sum + r.enrichedData.tickets_to_allocate, 0)
    };

    res.json({
      success: true,
      data: {
        summary,
        validationResults,
        canProceed: summary.valid_rows > 0
      }
    });

  } catch (error) {
    console.error('Error in bulk allocation preview:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Process bulk allocation upload
router.post('/process', authenticateToken, upload.single('file'), async (req, res) => {
  const batch = db.batch();
  const processedAllocations = [];
  
  try {
    // First, validate the file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Parse and validate CSV (duplicate validation logic from preview)
    const fileContent = req.file.buffer.toString('utf-8');
    const records = [];
    
    const parser = csv.parse({
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    parser.on('readable', function() {
      let record;
      while ((record = parser.read()) !== null) {
        records.push(record);
      }
    });

    parser.write(fileContent);
    parser.end();

    await new Promise((resolve) => {
      parser.on('end', resolve);
    });

    console.log(`Processing ${records.length} records from CSV`);

    // Run the same validation logic as preview
    const validationResults = [];
    const inventoryCache = new Map();
    const leadCache = new Map();

    // Validate each record (simplified validation for processing)
    for (const record of records) {
      console.log('Processing record:', JSON.stringify(record));
      
      if (!record.event_name || !record.lead_identifier || !record.tickets_to_allocate) {
        console.log('Skipping record - missing required fields');
        continue; // Skip invalid records
      }

      const result = {
        data: record,
        enrichedData: {}
      };

      // Look up inventory
      let inventory = inventoryCache.get(record.event_name);
      if (!inventory) {
        const inventorySnapshot = await db.collection('crm_inventory')
          .where('event_name', '==', record.event_name)
          .limit(1)
          .get();

        // Filter out deleted items
        const validDocs = inventorySnapshot.docs.filter(doc => 
          doc.data().isDeleted !== true
        );
        
        if (validDocs.length > 0) {
          const doc = validDocs[0];
          inventory = { id: doc.id, ...doc.data() };
          inventoryCache.set(record.event_name, inventory);
        }
      }

      if (!inventory) {
        console.log('Inventory not found for:', record.event_name);
        continue;
      }

      result.enrichedData.inventory = inventory;

      // Look up lead by phone or email + event name (FIXED: use same logic as preview)
      const leadIdentifier = record.lead_identifier.trim();
      const cacheKey = `${leadIdentifier}_${record.event_name}`;
      let lead = leadCache.get(cacheKey);
      
      if (!lead) {
        // Try phone first (remove non-digits and check)
        const cleanPhone = leadIdentifier.replace(/\D/g, '');
        let allLeadsSnapshots = [];

        if (cleanPhone.length >= 10) {
          // Search by phone - get ALL matching leads (not just first one)
          const phoneQueries = [
            db.collection('crm_leads').where('phone', '==', leadIdentifier).get(),
            db.collection('crm_leads').where('phone', '==', cleanPhone).get()
          ];
          
          if (!leadIdentifier.startsWith('+91')) {
            phoneQueries.push(
              db.collection('crm_leads').where('phone', '==', '+91' + cleanPhone).get()
            );
          }
          
          const phoneResults = await Promise.all(phoneQueries);
          phoneResults.forEach(snapshot => {
            if (!snapshot.empty) {
              allLeadsSnapshots.push(...snapshot.docs);
            }
          });
        }

        // If not found by phone, try email
        if (allLeadsSnapshots.length === 0 && leadIdentifier.includes('@')) {
          const emailSnapshot = await db.collection('crm_leads')
            .where('email', '==', leadIdentifier.toLowerCase())
            .get();
          
          if (!emailSnapshot.empty) {
            allLeadsSnapshots.push(...emailSnapshot.docs);
          }
        }

        if (allLeadsSnapshots.length > 0) {
          // Filter out deleted leads and find the one matching the event
          const validLeads = allLeadsSnapshots
            .filter(doc => doc.data().isDeleted !== true)
            .map(doc => ({ id: doc.id, ...doc.data() }));
          
          console.log(`Found ${validLeads.length} valid leads for identifier ${leadIdentifier}`);
          
          // First try to find exact event match in lead_for_event
          let matchingLead = validLeads.find(leadData => 
            leadData.lead_for_event === record.event_name
          );
          
          // If no exact match, check client_events array
          if (!matchingLead) {
            matchingLead = validLeads.find(leadData => 
              leadData.client_events && 
              leadData.client_events.includes(record.event_name)
            );
          }
          
          // If still no match but we have leads, take the first one (fallback)
          if (!matchingLead && validLeads.length > 0) {
            matchingLead = validLeads[0];
            console.log(`WARNING: No exact event match for ${leadIdentifier}, using lead for ${matchingLead.lead_for_event || 'unknown event'}`);
          }
          
          if (matchingLead) {
            lead = matchingLead;
            leadCache.set(cacheKey, lead);
            console.log(`Matched lead ${lead.id} for event ${record.event_name}`);
          }
        }
      }

      if (!lead) {
        console.log('Lead not found for:', record.lead_identifier);
        continue;
      }

      result.enrichedData.lead = lead;
      result.enrichedData.tickets_to_allocate = parseInt(record.tickets_to_allocate);
      result.enrichedData.notes = record.notes || '';
      result.enrichedData.price_override = record.price_override ? parseFloat(record.price_override) : null;

      // Validate category if specified
      if (record.category_name && inventory.categories) {
        const category = inventory.categories.find(cat => {
          const categoryMatches = cat.name.toLowerCase() === record.category_name.toLowerCase();
          const sectionMatches = !record.stand_section || 
            (cat.section && cat.section.toLowerCase() === record.stand_section.toLowerCase());
          return categoryMatches && sectionMatches;
        });
        if (category) {
          result.enrichedData.category = category;
        }
      }

      // Validate order if specified (can be either document ID or order_number)
      if (record.order_id) {
        let orderSnapshot;
        
        // First try as document ID
        if (record.order_id.length === 20 && !record.order_id.includes('-')) {
          orderSnapshot = await db.collection('crm_orders')
            .doc(record.order_id)
            .get();
        }
        
        // If not found or not a valid doc ID format, search by order_number
        if (!orderSnapshot || !orderSnapshot.exists) {
          const orderQuery = await db.collection('crm_orders')
            .where('order_number', '==', record.order_id)
            .limit(1)
            .get();
          
          if (!orderQuery.empty) {
            orderSnapshot = orderQuery.docs[0];
          }
        }
        
        if (orderSnapshot && orderSnapshot.exists && orderSnapshot.data().lead_id === lead.id) {
          result.enrichedData.order = {
            id: orderSnapshot.id,
            order_number: orderSnapshot.data().order_number
          };
        }
      }

      result.status = 'valid';
      validationResults.push(result);
    }

    const validRows = validationResults.filter(r => r.status === 'valid');
    
    console.log(`Found ${validRows.length} valid rows out of ${validationResults.length} total validation results`);
    
    // Process each valid row
    for (const row of validRows) {
      const { inventory, lead, category, tickets_to_allocate, notes, order, price_override } = row.enrichedData;
      
      // Create allocation document
      const allocationData = {
        inventory_id: inventory.id,
        lead_id: lead.id,
        lead_name: lead.name,
        tickets_allocated: tickets_to_allocate,
        notes: notes || `Bulk allocated by ${req.user.name}`,
        created_by: req.user.id,
        created_by_name: req.user.name,
        created_date: admin.firestore.FieldValue.serverTimestamp(),
        isDeleted: false,
        inventory_event: inventory.event_name
      };

      // Add category info if applicable
      if (category) {
        allocationData.category_name = category.name;
        allocationData.category_section = category.section || '';
        allocationData.category_details = {
          name: category.name,
          section: category.section || '',
          selling_price: price_override || category.selling_price
        };
      }

      // Add order link if provided
      if (order) {
        allocationData.order_ids = [order.id];
        allocationData.primary_order_id = order.id;
      } else {
        allocationData.order_ids = [];
        allocationData.primary_order_id = null;
      }

      // Create allocation
      const allocationRef = db.collection('crm_allocations').doc();
      batch.set(allocationRef, allocationData);

      // Update inventory availability
      const inventoryRef = db.collection('crm_inventory').doc(inventory.id);
      
      console.log(`Updating inventory ${inventory.id} - has_categories: ${inventory.has_categories}, categories exist: ${!!inventory.categories}, category: ${category?.name}`);
      
      // Check if inventory has categories array instead of has_categories flag
      if (category && inventory.categories && inventory.categories.length > 0) {
        // Update category-specific availability
        const updatedCategories = [...(inventory.categories || [])];
        const categoryIndex = updatedCategories.findIndex(cat => 
          cat.name === category.name && cat.section === category.section
        );
        
        console.log(`Found category at index: ${categoryIndex}`);
        
        if (categoryIndex >= 0) {
          updatedCategories[categoryIndex].available_tickets -= tickets_to_allocate;
          batch.update(inventoryRef, {
            categories: updatedCategories,
            available_tickets: admin.firestore.FieldValue.increment(-tickets_to_allocate)
          });
          console.log(`Updating category tickets and total tickets by -${tickets_to_allocate}`);
        }
      } else {
        // Update general availability
        console.log(`Updating general availability by -${tickets_to_allocate}`);
        batch.update(inventoryRef, {
          available_tickets: admin.firestore.FieldValue.increment(-tickets_to_allocate)
        });
      }

      // Update order if linked
      if (order) {
        const orderRef = db.collection('crm_orders').doc(order.id);
        batch.update(orderRef, {
          allocation_ids: admin.firestore.FieldValue.arrayUnion(allocationRef.id)
        });
      }

      processedAllocations.push({
        allocation_id: allocationRef.id,
        lead_name: lead.name,
        event_name: inventory.event_name,
        tickets: tickets_to_allocate,
        category: category?.name || 'General'
      });
    }

    // Commit all changes
    console.log(`Committing batch with ${processedAllocations.length} allocations`);
    await batch.commit();
    console.log('Batch committed successfully');

    res.json({
      success: true,
      data: {
        processed_count: processedAllocations.length,
        allocations: processedAllocations
      }
    });

  } catch (error) {
    console.error('Error processing bulk allocations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Download sample CSV template
router.get('/template', authenticateToken, (req, res) => {
  const csvContent = `event_name,lead_identifier,tickets_to_allocate,category_name,stand_section,notes,order_id,price_override
"Abu Dhabi Grand Prix'25","+919876543210",2,"Premium","A1","VIP Client","",""
"India Tour of Australia, 2025 - MCG T20","john@example.com",4,"Standard","B2","Corporate booking","ORD-2025-001",""
"Manchester City vs Aston Villa","9988776655",1,"General","","Single ticket allocation","",5000`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="bulk_allocation_template.csv"');
  res.send(csvContent);
});

// Download all allocations as CSV
router.get('/download', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching all allocations for download...');
    
    // Fetch all allocations and filter in memory to avoid index requirements
    const allocationsSnapshot = await db.collection('crm_allocations')
      .orderBy('created_date', 'desc')
      .get();
    
    // Filter out deleted allocations
    const validAllocations = allocationsSnapshot.docs.filter(doc => 
      doc.data().isDeleted !== true
    );
    
    console.log(`Found ${validAllocations.length} valid allocations out of ${allocationsSnapshot.size} total`);
    
    // Build CSV content
    let csvContent = 'allocation_id,event_name,lead_name,lead_id,tickets_allocated,category_name,stand_section,order_ids,notes,created_by,created_date,price_per_ticket,total_value\n';
    
    for (const doc of validAllocations) {
      const allocation = doc.data();
      const allocationId = doc.id;
      
      // Format date to IST
      let createdDate = '';
      if (allocation.created_date) {
        const date = allocation.created_date.toDate ? allocation.created_date.toDate() : new Date(allocation.created_date);
        createdDate = new Date(date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      }
      
      // Get price information
      let pricePerTicket = '';
      let totalValue = '';
      if (allocation.category_details && allocation.category_details.selling_price) {
        pricePerTicket = allocation.category_details.selling_price;
        totalValue = allocation.category_details.selling_price * (allocation.tickets_allocated || 0);
      }
      
      // Escape CSV fields
      const escapeCSV = (field) => {
        if (!field) return '';
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      
      // Build CSV row
      const row = [
        allocationId,
        escapeCSV(allocation.inventory_event || ''),
        escapeCSV(allocation.lead_name || ''),
        allocation.lead_id || '',
        allocation.tickets_allocated || 0,
        escapeCSV(allocation.category_name || ''),
        escapeCSV(allocation.category_section || allocation.category_details?.section || ''),
        escapeCSV((allocation.order_ids || []).join('; ')),
        escapeCSV(allocation.notes || ''),
        escapeCSV(allocation.created_by_name || ''),
        createdDate,
        pricePerTicket,
        totalValue
      ].join(',');
      
      csvContent += row + '\n';
    }
    
    // Set headers for download
    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="allocations_export_${timestamp}.csv"`);
    res.send(csvContent);
    
  } catch (error) {
    console.error('Error downloading allocations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;