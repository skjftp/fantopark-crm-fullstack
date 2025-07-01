import re

# Read leads.js
with open('backend/src/routes/leads.js', 'r') as f:
    content = f.read()

# Check if bulk delete already exists
if 'X-Delete-All' in content:
    print("Bulk delete already exists in leads.js")
else:
    print("Adding bulk delete to leads.js...")
    
    # Find a good place to add the route (before the last module.exports)
    # Add the bulk delete route
    delete_route = '''
// DELETE all leads (bulk delete for test mode)
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
    
    console.log('Bulk delete leads requested by:', req.user.email);
    
    // Get all leads
    const snapshot = await db.collection(collections.leads).get();
    
    if (snapshot.empty) {
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
    
    console.log(`Deleted ${count} leads`);
    res.json({ 
      message: `Successfully deleted ${count} leads`,
      count: count 
    });
    
  } catch (error) {
    console.error('Bulk delete leads error:', error);
    res.status(500).json({ error: error.message });
  }
});

'''
    
    # Insert before module.exports
    if 'module.exports = router;' in content:
        content = content.replace('module.exports = router;', delete_route + 'module.exports = router;')
    else:
        content += '\n' + delete_route + '\nmodule.exports = router;'
    
    with open('backend/src/routes/leads.js', 'w') as f:
        f.write(content)
    
    print("✅ Added bulk delete to leads.js")
