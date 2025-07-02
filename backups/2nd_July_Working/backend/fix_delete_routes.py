import os

# Fix leads.js
print("Fixing leads.js DELETE route...")
with open('src/routes/leads.js', 'r') as f:
    content = f.read()

# Replace the existing DELETE route with a more robust one
if "router.delete('/'," in content:
    # Find and replace the bulk delete route
    import re
    pattern = r"router\.delete\('/',.*?\}\);(?=\n\n|\nmodule\.exports)"
    
    new_route = '''router.delete('/', authenticateToken, async (req, res) => {
  try {
    console.log('DELETE /leads - Bulk delete request');
    console.log('Headers:', req.headers);
    console.log('User:', req.user);
    
    // Check if user is super_admin
    if (!req.user || req.user.role !== 'super_admin') {
      console.log('Access denied - not super_admin');
      return res.status(403).json({ error: 'Only super admins can perform bulk delete' });
    }
    
    // Check headers (case-insensitive)
    const deleteAll = req.headers['x-delete-all'] || req.headers['X-Delete-All'];
    const testMode = req.headers['x-test-mode'] || req.headers['X-Test-Mode'];
    
    if (deleteAll !== 'true' || testMode !== 'true') {
      console.log('Missing required headers');
      return res.status(403).json({ error: 'Bulk delete requires test mode headers' });
    }
    
    console.log('Authorized - proceeding with bulk delete');
    
    // Get all leads
    const snapshot = await db.collection(collections.leads).get();
    
    if (snapshot.empty) {
      console.log('No leads to delete');
      return res.json({ message: 'No leads to delete', count: 0 });
    }
    
    // Delete in batches of 500 (Firestore limit)
    const batchSize = 500;
    let deleted = 0;
    
    while (deleted < snapshot.size) {
      const batch = db.batch();
      const currentBatch = snapshot.docs.slice(deleted, deleted + batchSize);
      
      currentBatch.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      deleted += currentBatch.length;
      console.log(`Deleted batch: ${currentBatch.length} docs (total: ${deleted})`);
    }
    
    console.log(`Successfully deleted ${deleted} leads`);
    res.json({ 
      message: `Successfully deleted ${deleted} leads`,
      count: deleted 
    });
    
  } catch (error) {
    console.error('Bulk delete leads error:', error);
    res.status(500).json({ 
      error: 'Failed to delete leads', 
      details: error.message 
    });
  }
});'''
    
    content = re.sub(pattern, new_route, content, flags=re.DOTALL)
    
    with open('src/routes/leads.js', 'w') as f:
        f.write(content)
    print("✅ Fixed leads.js DELETE route")
else:
    print("Need to add DELETE route to leads.js")
    # Add it before module.exports
    content = content.replace('module.exports = router;', '''
// DELETE all leads (bulk delete for test mode)
router.delete('/', authenticateToken, async (req, res) => {
  try {
    console.log('DELETE /leads - Bulk delete request');
    console.log('Headers:', req.headers);
    console.log('User:', req.user);
    
    // Check if user is super_admin
    if (!req.user || req.user.role !== 'super_admin') {
      console.log('Access denied - not super_admin');
      return res.status(403).json({ error: 'Only super admins can perform bulk delete' });
    }
    
    // Check headers (case-insensitive)
    const deleteAll = req.headers['x-delete-all'] || req.headers['X-Delete-All'];
    const testMode = req.headers['x-test-mode'] || req.headers['X-Test-Mode'];
    
    if (deleteAll !== 'true' || testMode !== 'true') {
      console.log('Missing required headers');
      return res.status(403).json({ error: 'Bulk delete requires test mode headers' });
    }
    
    console.log('Authorized - proceeding with bulk delete');
    
    // Get all leads
    const snapshot = await db.collection(collections.leads).get();
    
    if (snapshot.empty) {
      console.log('No leads to delete');
      return res.json({ message: 'No leads to delete', count: 0 });
    }
    
    // Delete in batches
    const batch = db.batch();
    let count = 0;
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });
    
    await batch.commit();
    
    console.log(`Successfully deleted ${count} leads`);
    res.json({ 
      message: `Successfully deleted ${count} leads`,
      count: count 
    });
    
  } catch (error) {
    console.error('Bulk delete leads error:', error);
    res.status(500).json({ 
      error: 'Failed to delete leads', 
      details: error.message 
    });
  }
});

module.exports = router;''')
    
    with open('src/routes/leads.js', 'w') as f:
        f.write(content)
    print("✅ Added DELETE route to leads.js")

# Do the same for inventory.js
print("\nFixing inventory.js...")
# Similar fix for inventory.js...
