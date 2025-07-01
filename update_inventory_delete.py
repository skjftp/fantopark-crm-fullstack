import re

# Read inventory.js
with open('backend/src/routes/inventory.js', 'r') as f:
    content = f.read()

# Check if bulk delete already exists
if 'X-Delete-All' in content:
    print("Bulk delete already exists in inventory.js")
else:
    print("Adding bulk delete to inventory.js...")
    
    delete_route = '''
// DELETE all inventory (bulk delete for test mode)
router.delete('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is super_admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can perform bulk delete' });
    }
    
    // Check if bulk delete headers are present
    if (req.headers['x-delete-all'] !== 'true' || req.headers['x-test-mode'] !== 'true') {
      return res.status(403).json({ error: 'Bulk delete requires test mode headers' });
    }
    
    console.log('Bulk delete inventory requested by:', req.user.email);
    
    // Get all inventory
    const snapshot = await db.collection(collections.inventory).get();
    
    if (snapshot.empty) {
      return res.json({ message: 'No inventory to delete', count: 0 });
    }
    
    // Delete in batches
    const batch = db.batch();
    let count = 0;
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });
    
    await batch.commit();
    
    console.log(`Deleted ${count} inventory items`);
    res.json({ 
      message: `Successfully deleted ${count} inventory items`,
      count: count 
    });
    
  } catch (error) {
    console.error('Bulk delete inventory error:', error);
    res.status(500).json({ error: error.message });
  }
});

'''
    
    # Insert before module.exports
    if 'module.exports = router;' in content:
        content = content.replace('module.exports = router;', delete_route + 'module.exports = router;')
    else:
        content += '\n' + delete_route + '\nmodule.exports = router;'
    
    with open('backend/src/routes/inventory.js', 'w') as f:
        f.write(content)
    
    print("✅ Added bulk delete to inventory.js")
