# Read the deliveries.js file
with open('src/routes/deliveries.js', 'r') as f:
    content = f.read()

# Check if DELETE route already exists
if 'router.delete' in content:
    print("DELETE route already exists!")
else:
    # Find where to insert the DELETE route (after the PUT route)
    lines = content.split('\n')
    insert_index = None
    
    for i, line in enumerate(lines):
        if 'router.put' in line and '/:id' in line:
            # Find the closing of the PUT route
            brace_count = 0
            for j in range(i, len(lines)):
                brace_count += lines[j].count('{')
                brace_count -= lines[j].count('}')
                if brace_count == 0 and j > i:
                    insert_index = j + 1
                    break
            break
    
    if insert_index:
        # Add the DELETE route
        delete_route = '''
// DELETE delivery
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    console.log('DELETE request for delivery:', req.params.id);
    
    // Check if delivery exists
    const doc = await db.collection(collections.deliveries).doc(req.params.id).get();
    if (!doc.exists) {
      console.log('Delivery not found:', req.params.id);
      return res.status(404).json({ error: 'Delivery not found' });
    }
    
    // Delete the delivery
    await db.collection(collections.deliveries).doc(req.params.id).delete();
    console.log('Delivery deleted successfully:', req.params.id);
    
    res.json({ message: 'Delivery deleted successfully' });
  } catch (error) {
    console.error('DELETE delivery error:', error);
    res.status(500).json({ error: error.message });
  }
});'''
        
        lines.insert(insert_index, delete_route)
        content = '\n'.join(lines)
        
        # Write the updated content
        with open('src/routes/deliveries.js', 'w') as f:
            f.write(content)
        
        print("✅ DELETE route added successfully!")
    else:
        print("❌ Could not find where to add DELETE route")

# Show the result
print("\nDelivery routes now include:")
with open('src/routes/deliveries.js', 'r') as f:
    for i, line in enumerate(f, 1):
        if 'router.' in line and '/' in line:
            print(f"  Line {i}: {line.strip()}")
