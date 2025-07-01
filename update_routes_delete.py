import os

routes = ['leads', 'inventory', 'orders']

for route_name in routes:
    file_path = f'backend/src/routes/{route_name}.js'
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Check if DELETE route exists
        if 'router.delete(' not in content:
            print(f"Adding DELETE route to {route_name}.js...")
            
            # Add before module.exports
            delete_route = '''
// DELETE all (test mode only)
router.delete('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is super_admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can delete all' });
    }
    
    // Check if delete all header is present
    if (req.headers['x-delete-all'] !== 'true' || req.headers['x-test-mode'] !== 'true') {
      return res.status(403).json({ error: 'Test mode delete all not enabled' });
    }
    
    const snapshot = await db.collection(collections.''' + route_name + ''').get();
    const batch = db.batch();
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    res.json({ 
      message: 'Deleted ' + snapshot.size + ' ''' + route_name + '''',
      count: snapshot.size 
    });
  } catch (error) {
    console.error('Delete all ''' + route_name + ''' error:', error);
    res.status(500).json({ error: error.message });
  }
});

'''
            # Insert before module.exports
            if 'module.exports' in content:
                content = content.replace('module.exports', delete_route + 'module.exports')
                
                with open(file_path, 'w') as f:
                    f.write(content)
                print(f"✅ Added DELETE route to {route_name}.js")
        else:
            print(f"DELETE route already exists in {route_name}.js")

print("\n✅ All routes updated!")
