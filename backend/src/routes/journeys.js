const express = require('express');
const router = express.Router();
const Journey = require('../models/Journey');
const { authenticateToken } = require('../middleware/auth');

// Create journey for an order
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const journeyData = {
      ...req.body,
      created_by: req.user.email
    };
    
    const journey = new Journey(journeyData);
    const saved = await journey.save();
    
    res.json({
      success: true,
      data: saved,
      journey_url: saved.journey_url
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get journey by token (public route)
// Get journey by token (public route)
router.get('/public/:token', async (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  try {
    const journey = await Journey.findByToken(req.params.token);
    if (!journey) {
      return res.status(404).json({ success: false, error: 'Journey not found' });
    }
    
    // Get event details if event_id exists
    let event = null;
    if (journey.event_id) {
      try {
        const Event = require('../models/Event');
        event = await Event.getById(journey.event_id);
      } catch (eventError) {
        console.log('Event not found or error:', eventError.message);
        // Continue without event data
      }
    }
    
    // Add weather data (mock for now, integrate with weather API)
    const weatherData = {
      temperature: 22,
      condition: 'Partly Cloudy',
      wind_speed: 12,
      precipitation: 15
    };
    
    res.json({
      success: true,
      data: {
        ...journey,
        event_details: event,
        weather: weatherData
      }
    });
  } catch (error) {
    console.error('Error in /public/:token route:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update milestone status
router.put('/:id/milestone/:milestoneId', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const journey = new Journey(await Journey.findById(req.params.id));
    
    await journey.updateMilestone(req.params.milestoneId, status);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
