const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { authenticateToken, checkPermission } = require('../middleware/auth');
const XLSX = require('xlsx');

// Enhanced parseDate function for handling various date formats
const parseDate = (dateValue) => {
  console.log('🔍 [EVENTS] Parsing date value:', dateValue, 'Type:', typeof dateValue);
  
  // Handle null, undefined, or empty values
  if (!dateValue || dateValue === '' || dateValue === null || dateValue === undefined) {
    console.log('⚠️ [EVENTS] Empty/null date value, returning null');
    return null;
  }
  
  // If it's already a Date object, validate and convert to ISO string
  if (dateValue instanceof Date) {
    if (isNaN(dateValue.getTime())) {
      console.log('⚠️ [EVENTS] Invalid Date object, returning null');
      return null;
    }
    console.log('✅ [EVENTS] Valid Date object found, converting to ISO');
    return dateValue.toISOString();
  }
  
  // If it's a string, try to parse it
  if (typeof dateValue === 'string') {
    const trimmedValue = dateValue.trim();
    
    if (trimmedValue === '' || trimmedValue.toLowerCase() === 'null' || 
        trimmedValue.toLowerCase() === 'undefined' || trimmedValue.toLowerCase() === 'tbd' || 
        trimmedValue.toLowerCase() === 'n/a') {
      console.log('⚠️ [EVENTS] Empty/null/invalid string date, returning null');
      return null;
    }
    
    // Handle YYYY-MM-DD format (most common CSV format)
    if (trimmedValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      console.log('✅ [EVENTS] YYYY-MM-DD format detected');
      const date = new Date(trimmedValue + 'T00:00:00Z');
      if (isNaN(date.getTime())) {
        console.log('⚠️ [EVENTS] Invalid YYYY-MM-DD date, returning null');
        return null;
      }
      return date.toISOString();
    }
    
    // Handle DD/MM/YYYY format
    if (trimmedValue.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      console.log('✅ [EVENTS] DD/MM/YYYY format detected');
      const [day, month, year] = trimmedValue.split('/');
      
      // Validate day and month ranges
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12) {
        console.log('⚠️ [EVENTS] Invalid day/month values, returning null');
        return null;
      }
      
      const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00Z`;
      const date = new Date(formattedDate);
      if (isNaN(date.getTime())) {
        console.log('⚠️ [EVENTS] Invalid DD/MM/YYYY date, returning null');
        return null;
      }
      console.log('✅ [EVENTS] Converted to:', formattedDate);
      return date.toISOString();
    }
    
    // Handle MM/DD/YYYY format (American style)
    if (trimmedValue.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      console.log('✅ [EVENTS] Attempting MM/DD/YYYY format');
      const [month, day, year] = trimmedValue.split('/');
      
      // Validate day and month ranges
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12) {
        console.log('⚠️ [EVENTS] Invalid day/month values, returning null');
        return null;
      }
      
      const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00Z`;
      const date = new Date(formattedDate);
      if (isNaN(date.getTime())) {
        console.log('⚠️ [EVENTS] Invalid MM/DD/YYYY date, returning null');
        return null;
      }
      console.log('✅ [EVENTS] Converted to:', formattedDate);
      return date.toISOString();
    }
    
    // Handle DD-MM-YYYY format
    if (trimmedValue.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
      console.log('✅ [EVENTS] DD-MM-YYYY format detected');
      const [day, month, year] = trimmedValue.split('-');
      
      // Validate day and month ranges
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12) {
        console.log('⚠️ [EVENTS] Invalid day/month values, returning null');
        return null;
      }
      
      const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00Z`;
      const date = new Date(formattedDate);
      if (isNaN(date.getTime())) {
        console.log('⚠️ [EVENTS] Invalid DD-MM-YYYY date, returning null');
        return null;
      }
      console.log('✅ [EVENTS] Converted to:', formattedDate);
      return date.toISOString();
    }
    
    // Handle ISO format with time
    if (trimmedValue.includes('T') || trimmedValue.includes('Z')) {
      console.log('✅ [EVENTS] ISO format detected');
      const parsed = new Date(trimmedValue);
      if (isNaN(parsed.getTime())) {
        console.log('⚠️ [EVENTS] Invalid ISO date, returning null');
        return null;
      }
      return parsed.toISOString();
    }
    
    // Try general Date parsing as fallback
    const parsed = new Date(trimmedValue);
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1970) {
      console.log('✅ [EVENTS] Successfully parsed with Date constructor');
      return parsed.toISOString();
    }
    
    console.log('⚠️ [EVENTS] String date parsing failed for:', trimmedValue, 'returning null');
    return null;
  }
  
  // If it's a number (Excel serial date), convert it
  if (typeof dateValue === 'number' && dateValue > 0) {
    console.log('✅ [EVENTS] Excel serial number detected:', dateValue);
    // Excel date serial number (days since 1900-01-01)
    const excelEpoch = new Date(1900, 0, 1);
    const msPerDay = 24 * 60 * 60 * 1000;
    const date = new Date(excelEpoch.getTime() + (dateValue - 2) * msPerDay);
    
    if (isNaN(date.getTime())) {
      console.log('⚠️ [EVENTS] Invalid Excel date conversion, returning null');
      return null;
    }
    
    console.log('✅ [EVENTS] Excel date converted to:', date.toISOString());
    return date.toISOString();
  }
  
  // Default to null if all parsing methods fail
  console.log('⚠️ [EVENTS] All parsing methods failed, returning null');
  return null;
};

// Get all events with optional filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { geography, sport_type, priority, start_date, end_date } = req.query;
    
    let events;
    if (geography || sport_type || priority || start_date || end_date) {
      events = await Event.getByFilters({ geography, sport_type, priority, start_date, end_date });
    } else {
      events = await Event.getAll();
    }
    
    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single event
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const event = await Event.getById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new event
router.post('/', authenticateToken, checkPermission('events', 'write'), async (req, res) => {
  try {
    const eventData = { ...req.body, created_by: req.user.email };
    const event = new Event(eventData);
    const savedEvent = await event.save();
    res.status(201).json({ success: true, data: savedEvent });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update event
router.put('/:id', authenticateToken, checkPermission('events', 'write'), async (req, res) => {
  try {
    const updatedEvent = await Event.update(req.params.id, req.body);
    res.json({ success: true, data: updatedEvent });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete event
router.delete('/:id', authenticateToken, checkPermission('events', 'write'), async (req, res) => {
  try {
    await Event.delete(req.params.id);
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Export events to Excel
router.get('/export/excel', authenticateToken, async (req, res) => {
  try {
    const { sort_by = 'date', geography, sport_type, priority } = req.query;
    
    let events;
    if (geography || sport_type || priority) {
      events = await Event.getByFilters({ geography, sport_type, priority });
    } else {
      events = await Event.getAll();
    }

    // Sort events based on request
    switch (sort_by) {
      case 'date':
        events.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
        break;
      case 'event':
        events.sort((a, b) => a.event_name.localeCompare(b.event_name));
        break;
      case 'sport':
        events.sort((a, b) => a.sport_type.localeCompare(b.sport_type));
        break;
      case 'priority':
        events.sort((a, b) => a.priority.localeCompare(b.priority));
        break;
    }

    // Prepare data for Excel with enhanced date formatting
    const excelData = events.map(event => ({
      'Event Name': event.event_name,
      'Event Type': event.event_type,
      'Sport Type': event.sport_type,
      'Geography': event.geography,
      'Start Date': event.start_date ? 
        (new Date(event.start_date).getTime() === 0 || new Date(event.start_date).getFullYear() === 1970 ? 
          'Date Not Set' : new Date(event.start_date).toLocaleDateString()) : 'Date Not Set',
      'End Date': event.end_date ? 
        (new Date(event.end_date).getTime() === 0 || new Date(event.end_date).getFullYear() === 1970 ? 
          'Date Not Set' : new Date(event.end_date).toLocaleDateString()) : 'Date Not Set',
      'Start Time': event.start_time || '',
      'End Time': event.end_time || '',
      'Venue': event.venue,
      'Official Ticketing Partners': event.official_ticketing_partners,
      'Primary Source': event.primary_source,
      'Secondary Source': event.secondary_source,
      'Priority': event.priority,
      'Status': event.status,
      'Sold Out Potential': event.sold_out_potential,
      'Remarks': event.remarks,
      'Ticket Available': event.ticket_available ? 'true' : 'false',
      'FanToPark Package': event.fantopark_package
    }));

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Events Calendar');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename=events_calendar_${new Date().toISOString().split('T')[0]}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (error) {
    console.error('Error exporting events:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Import events from Excel - ENHANCED VERSION WITH ROBUST DATE PARSING
router.post('/import/excel', authenticateToken, checkPermission('events', 'write'), async (req, res) => {
  try {
    if (!req.body.excelData) {
      return res.status(400).json({ success: false, error: 'No Excel data provided' });
    }

    console.log('📊 [EVENTS] Processing Excel import with', req.body.excelData.length, 'rows');

    const errors = [];
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const savedEvents = [];

    for (const [index, row] of req.body.excelData.entries()) {
      try {
        console.log(`🔍 [EVENTS] Processing row ${index + 1}:`, Object.keys(row));

        // Parse dates with enhanced validation
        const startDate = parseDate(row['Start Date']);
        const endDate = parseDate(row['End Date']);

        // Skip events without start dates (required field)
        if (!startDate) {
          console.log(`⚠️ [EVENTS] Row ${index + 1}: Missing start date, skipping`);
          errors.push({
            row: index + 1,
            error: 'Missing or invalid Start Date - event skipped'
          });
          skippedCount++;
          continue;
        }

        // Create event object with enhanced data validation
        const eventData = {
          event_name: (row['Event Name'] || '').toString().trim(),
          event_type: (row['Event Type'] || '').toString().trim(),
          sport_type: (row['Sport Type'] || '').toString().trim(),
          geography: (row['Geography'] || '').toString().trim(),
          start_date: startDate, // Will be null or valid ISO string
          end_date: endDate,     // Will be null or valid ISO string
          start_time: (row['Start Time'] || '').toString().trim(),
          end_time: (row['End Time'] || '').toString().trim(),
          venue: (row['Venue'] || '').toString().trim(),
          venue_capacity: row['Venue Capacity'] ? parseInt(row['Venue Capacity']) || 0 : 0,
          venue_address: (row['Venue Address'] || '').toString().trim(),
          official_ticketing_partners: (row['Official Ticketing Partners'] || '').toString().trim(),
          primary_source: (row['Primary Source'] || '').toString().trim(),
          secondary_source: (row['Secondary Source'] || '').toString().trim(),
          priority: (row['Priority'] || 'P3').toString().trim(),
          status: (row['Status'] || 'upcoming').toString().trim(),
          sold_out_potential: (row['Sold Out Potential'] || '').toString().trim(),
          remarks: (row['Remarks'] || '').toString().trim(),
          ticket_available: row['Ticket Available'] ? 
            (row['Ticket Available'].toString().toLowerCase() === 'true' || row['Ticket Available'] === '1') : false,
          fantopark_package: (row['FanToPark Package'] || '').toString().trim(),
          created_by: req.user.email,
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString()
        };

        // Enhanced validation for required fields
        const missingFields = [];
        if (!eventData.event_name) missingFields.push('Event Name');
        if (!eventData.venue) missingFields.push('Venue');
        if (!eventData.sport_type && !eventData.event_type) missingFields.push('Sport Type or Event Type');

        if (missingFields.length > 0) {
          errors.push({
            row: index + 1,
            error: `Missing required fields: ${missingFields.join(', ')}`
          });
          errorCount++;
          continue;
        }

        console.log(`✅ [EVENTS] Row ${index + 1}: Creating event -`, eventData.event_name);

        // Create new Event instance
        const event = new Event(eventData);
        const savedEvent = await event.save();
        savedEvents.push(savedEvent);
        successCount++;

      } catch (error) {
        console.error(`❌ [EVENTS] Row ${index + 1} error:`, error.message);
        errors.push({
          row: index + 1,
          error: error.message
        });
        errorCount++;
      }
    }

    // Enhanced response with better summary
    const summary = {
      totalRows: req.body.excelData.length,
      successful: successCount,
      failed: errorCount,
      skipped: skippedCount,
      dateIssues: errors.filter(e => e.error.includes('Date')).length
    };

    console.log('📊 [EVENTS] Import summary:', summary);

    res.json({ 
      success: true, 
      message: `Successfully imported ${successCount} events${errorCount > 0 ? `, ${errorCount} failed` : ''}${skippedCount > 0 ? `, ${skippedCount} skipped` : ''}`,
      summary,
      data: savedEvents,
      errors: errors.slice(0, 10), // Limit errors for response size
      uploadSessionId: `events_import_${Date.now()}_${req.user.email}`
    });

  } catch (error) {
    console.error('❌ [EVENTS] Import error:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message,
      details: 'Check server logs for detailed error information'
    });
  }
});

module.exports = router;
