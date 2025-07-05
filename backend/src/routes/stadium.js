const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Collection name for stadiums
const STADIUMS_COLLECTION = 'crm_stadiums';

// GET all stadiums
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('📍 Fetching all stadiums...');
    
    const stadiumsSnapshot = await db.collection(STADIUMS_COLLECTION)
      .orderBy('name', 'asc')
      .get();
    
    const stadiums = [];
    stadiumsSnapshot.forEach(doc => {
      stadiums.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`✅ Found ${stadiums.length} stadiums`);
    res.json({ 
      data: stadiums,
      count: stadiums.length 
    });
    
  } catch (error) {
    console.error('❌ Error fetching stadiums:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET stadium by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const stadiumDoc = await db.collection(STADIUMS_COLLECTION).doc(req.params.id).get();
    
    if (!stadiumDoc.exists) {
      return res.status(404).json({ error: 'Stadium not found' });
    }

    res.json({ 
      data: { 
        id: stadiumDoc.id, 
        ...stadiumDoc.data() 
      } 
    });
    
  } catch (error) {
    console.error('❌ Error fetching stadium:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST create new stadium
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('🏟️ Creating new stadium:', req.body);
    
    // Validate required fields
    const { name, city, country, sport_type } = req.body;
    if (!name || !city || !country || !sport_type) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, city, country, sport_type' 
      });
    }

    // Check for duplicate stadium name in same city
    const existingStadium = await db.collection(STADIUMS_COLLECTION)
      .where('name', '==', name.trim())
      .where('city', '==', city.trim())
      .get();
    
    if (!existingStadium.empty) {
      return res.status(400).json({ 
        error: `Stadium "${name}" already exists in ${city}` 
      });
    }

    const stadiumData = {
      name: name.trim(),
      city: city.trim(),
      state: req.body.state?.trim() || '',
      country: country.trim(),
      sport_type: sport_type,
      capacity: req.body.capacity ? parseInt(req.body.capacity) : null,
      opened_year: req.body.opened_year ? parseInt(req.body.opened_year) : null,
      nickname: req.body.nickname?.trim() || '',
      website: req.body.website?.trim() || '',
      notes: req.body.notes?.trim() || '',
      created_by: req.user?.name || req.body.created_by || 'System',
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      status: 'active'
    };

    const docRef = await db.collection(STADIUMS_COLLECTION).add(stadiumData);
    
    const newStadium = {
      id: docRef.id,
      ...stadiumData
    };

    console.log('✅ Stadium created successfully:', newStadium.name);
    res.status(201).json({ data: newStadium });
    
  } catch (error) {
    console.error('❌ Error creating stadium:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update stadium
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    console.log('📝 Updating stadium:', req.params.id);
    
    const stadiumRef = db.collection(STADIUMS_COLLECTION).doc(req.params.id);
    const stadiumDoc = await stadiumRef.get();
    
    if (!stadiumDoc.exists) {
      return res.status(404).json({ error: 'Stadium not found' });
    }

    const updateData = {
      name: req.body.name?.trim(),
      city: req.body.city?.trim(),
      state: req.body.state?.trim() || '',
      country: req.body.country?.trim(),
      sport_type: req.body.sport_type,
      capacity: req.body.capacity ? parseInt(req.body.capacity) : null,
      opened_year: req.body.opened_year ? parseInt(req.body.opened_year) : null,
      nickname: req.body.nickname?.trim() || '',
      website: req.body.website?.trim() || '',
      notes: req.body.notes?.trim() || '',
      updated_by: req.user?.name || 'System',
      updated_date: new Date().toISOString()
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await stadiumRef.update(updateData);
    
    const updatedDoc = await stadiumRef.get();
    const updatedStadium = {
      id: updatedDoc.id,
      ...updatedDoc.data()
    };

    console.log('✅ Stadium updated successfully:', updatedStadium.name);
    res.json({ data: updatedStadium });
    
  } catch (error) {
    console.error('❌ Error updating stadium:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE stadium
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    console.log('🗑️ Deleting stadium:', req.params.id);
    
    const stadiumRef = db.collection(STADIUMS_COLLECTION).doc(req.params.id);
    const stadiumDoc = await stadiumRef.get();
    
    if (!stadiumDoc.exists) {
      return res.status(404).json({ error: 'Stadium not found' });
    }

    // Check if stadium is being used in any inventory/events
    const inventoryUsingStadium = await db.collection('crm_inventory')
      .where('venue', '==', stadiumDoc.data().name)
      .get();
    
    if (!inventoryUsingStadium.empty) {
      return res.status(400).json({ 
        error: `Cannot delete stadium. It is being used in ${inventoryUsingStadium.size} event(s).` 
      });
    }

    await stadiumRef.delete();
    
    console.log('✅ Stadium deleted successfully');
    res.json({ message: 'Stadium deleted successfully' });
    
  } catch (error) {
    console.error('❌ Error deleting stadium:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET stadiums by sport type
router.get('/sport/:sportType', authenticateToken, async (req, res) => {
  try {
    const sportType = req.params.sportType;
    console.log(`🏆 Fetching ${sportType} stadiums...`);
    
    const stadiumsSnapshot = await db.collection(STADIUMS_COLLECTION)
      .where('sport_type', '==', sportType)
      .orderBy('name', 'asc')
      .get();
    
    const stadiums = [];
    stadiumsSnapshot.forEach(doc => {
      stadiums.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({ 
      data: stadiums,
      count: stadiums.length 
    });
    
  } catch (error) {
    console.error('❌ Error fetching stadiums by sport:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST bulk import stadiums
router.post('/bulk', authenticateToken, async (req, res) => {
  try {
    const stadiums = req.body.stadiums || req.body;
    
    if (!Array.isArray(stadiums)) {
      return res.status(400).json({ error: 'Expected array of stadiums' });
    }

    console.log(`📥 Bulk importing ${stadiums.length} stadiums...`);
    
    const results = [];
    const errors = [];
    
    for (const [index, stadiumData] of stadiums.entries()) {
      try {
        // Validate required fields
        if (!stadiumData.name || !stadiumData.city || !stadiumData.country) {
          errors.push({ index: index + 1, error: 'Missing required fields: name, city, country' });
          continue;
        }

        // Check for duplicate
        const existingStadium = await db.collection(STADIUMS_COLLECTION)
          .where('name', '==', stadiumData.name.trim())
          .where('city', '==', stadiumData.city.trim())
          .get();
        
        if (!existingStadium.empty) {
          errors.push({ index: index + 1, error: `Stadium "${stadiumData.name}" already exists in ${stadiumData.city}` });
          continue;
        }

        const processedData = {
          name: stadiumData.name.trim(),
          city: stadiumData.city.trim(),
          state: stadiumData.state?.trim() || '',
          country: stadiumData.country.trim(),
          sport_type: stadiumData.sport_type || 'Other',
          capacity: stadiumData.capacity ? parseInt(stadiumData.capacity) : null,
          opened_year: stadiumData.opened_year ? parseInt(stadiumData.opened_year) : null,
          nickname: stadiumData.nickname?.trim() || '',
          website: stadiumData.website?.trim() || '',
          notes: stadiumData.notes?.trim() || '',
          created_by: req.user?.name || 'Bulk Import',
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString(),
          status: 'active'
        };

        const docRef = await db.collection(STADIUMS_COLLECTION).add(processedData);
        results.push({ id: docRef.id, ...processedData });
        
      } catch (error) {
        errors.push({ index: index + 1, error: error.message });
      }
    }

    console.log(`✅ Bulk import completed: ${results.length} success, ${errors.length} errors`);
    
    res.json({
      success: results.length,
      errors: errors.length,
      data: results,
      errorDetails: errors,
      message: `Successfully imported ${results.length} stadiums${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
    });
    
  } catch (error) {
    console.error('❌ Error in bulk import:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
