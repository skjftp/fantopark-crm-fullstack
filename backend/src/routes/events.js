const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { authenticateToken, checkPermission } = require('../middleware/auth');
const XLSX = require('xlsx');

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

    // Prepare data for Excel
    const excelData = events.map(event => ({
      'Event Name': event.event_name,
      'Event Type': event.event_type,
      'Sport Type': event.sport_type,
      'Geography': event.geography,
      'Start Date': event.start_date ? new Date(event.start_date).toLocaleDateString() : '',
      'End Date': event.end_date ? new Date(event.end_date).toLocaleDateString() : '',
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

// Import events from Excel
router.post('/import/excel', authenticateToken, checkPermission('events', 'write'), async (req, res) => {
  try {
    if (!req.body.excelData) {
      return res.status(400).json({ success: false, error: 'No Excel data provided' });
    }

    const events = req.body.excelData.map(row => new Event({
      event_name: row['Event Name'],
      event_type: row['Event Type'],
      sport_type: row['Sport Type'],
      geography: row['Geography'],
      start_date: row['Start Date'],
      end_date: row['End Date'],
      start_time: row['Start Time'],
      end_time: row['End Time'],
      venue: row['Venue'],
      official_ticketing_partners: row['Official Ticketing Partners'],
      primary_source: row['Primary Source'],
      secondary_source: row['Secondary Source'],
      priority: row['Priority'],
      sold_out_potential: row['Sold Out Potential'],
      remarks: row['Remarks'],
      created_by: req.user.email
    }));

    const savedEvents = [];
    for (const event of events) {
      const saved = await event.save();
      savedEvents.push(saved);
    }

    res.json({ 
      success: true, 
      message: `Successfully imported ${savedEvents.length} events`,
      data: savedEvents 
    });

  } catch (error) {
    console.error('Error importing events:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
