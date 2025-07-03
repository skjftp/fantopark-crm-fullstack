#!/bin/bash

# ============================================================================
# COMPLETE INVENTORY-PAYABLES INTEGRATION AUTOMATION SCRIPT
# ============================================================================

echo "🚀 Starting automated inventory-payables integration implementation..."

# Create backup before changes
echo "📦 Creating backup..."
git add .
git commit -m "Backup before inventory-payables integration" || echo "Nothing to commit"
git tag -a "Before-Inventory-Payables-Integration" -m "Backup before automated integration"

# ============================================================================
# BACKEND CHANGES
# ============================================================================

echo "🔧 Implementing backend changes..."

# 1. ADD NEW ROUTE TO PAYABLES.JS
echo "Adding inventory lookup route to payables.js..."
cat >> backend/src/routes/payables.js << 'EOF'

// GET payables by inventory ID
router.get('/by-inventory/:inventoryId', authenticateToken, async (req, res) => {
  try {
    const { inventoryId } = req.params;
    console.log('Fetching payables for inventory:', inventoryId);
    
    const snapshot = await db.collection('crm_payables')
      .where('inventoryId', '==', inventoryId)
      .get();
    
    const payables = [];
    snapshot.forEach(doc => {
      payables.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`Found ${payables.length} payables for inventory ${inventoryId}`);
    res.json({ data: payables });
  } catch (error) {
    console.error('Error fetching payables by inventory:', error);
    res.status(500).json({ error: error.message });
  }
});

// Manual sync endpoint
router.post('/sync-with-inventory/:inventoryId', authenticateToken, async (req, res) => {
  try {
    const { inventoryId } = req.params;
    
    const inventoryDoc = await db.collection('crm_inventory').doc(inventoryId).get();
    if (!inventoryDoc.exists) {
      return res.status(404).json({ error: 'Inventory not found' });
    }
    
    const inventoryData = inventoryDoc.data();
    const totalAmount = parseFloat(inventoryData.totalPurchaseAmount || 0);
    const amountPaid = parseFloat(inventoryData.amountPaid || 0);
    const balance = totalAmount - amountPaid;
    
    const payablesSnapshot = await db.collection('crm_payables')
      .where('inventoryId', '==', inventoryId)
      .get();
    
    if (payablesSnapshot.empty) {
      return res.json({ message: 'No payables found for this inventory item' });
    }
    
    const batch = db.batch();
    let updatedCount = 0;
    
    payablesSnapshot.forEach(doc => {
      const updateData = {
        amount: Math.max(0, balance),
        status: balance <= 0 ? 'paid' : 'pending',
        updated_date: new Date().toISOString(),
        payment_notes: `Synced with inventory: Balance ₹${balance.toFixed(2)}`
      };
      
      if (balance <= 0) {
        updateData.paid_date = new Date().toISOString();
      }
      
      batch.update(doc.ref, updateData);
      updatedCount++;
    });
    
    await batch.commit();
    
    res.json({
      message: `Synchronized ${updatedCount} payables with inventory`,
      inventoryBalance: balance,
      payablesUpdated: updatedCount
    });
    
  } catch (error) {
    console.error('Error syncing payables:', error);
    res.status(500).json({ error: error.message });
  }
});
