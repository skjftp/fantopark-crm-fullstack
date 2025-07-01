with open('backend/src/routes/orders.js', 'r') as f:
    content = f.read()

if 'X-Delete-All' not in content:
    delete_route = '''
// DELETE all orders (bulk delete for test mode)
router.delete('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can perform bulk delete' });
    }
    
    if (req.headers['x-delete-all'] !== 'true' || req.headers['x-test-mode'] !== 'true') {
      return res.status(403).json({ error: 'Bulk delete requires test mode headers' });
    }
    
    const snapshot = await db.collection(collections.orders).get();
    
    if (snapshot.empty) {
      return res.json({ message: 'No orders to delete', count: 0 });
    }
    
    const batch = db.batch();
    let count = 0;
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });
    
    await batch.commit();
    
    res.json({ 
      message: `Successfully deleted ${count} orders`,
      count: count 
    });
  } catch (error) {
    console.error('Bulk delete orders error:', error);
    res.status(500).json({ error: error.message });
  }
});

'''
    
    if 'module.exports = router;' in content:
        content = content.replace('module.exports = router;', delete_route + 'module.exports = router;')
    
    with open('backend/src/routes/orders.js', 'w') as f:
        f.write(content)
    
    print("✅ Added bulk delete to orders.js")
else:
    print("Bulk delete already exists in orders.js")
