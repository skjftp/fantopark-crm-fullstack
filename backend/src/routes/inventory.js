const express = require('express');
const router = express.Router();
const { db, collections } = require('../config/db');
const admin = require('../config/firebase');
const { authenticateToken, checkPermission } = require('../middleware/auth');
// Don't import Inventory model since we're using direct database access

/**
 * Processes inventory data to ensure INR values for all categories
 * @param {Object} inventoryData - The inventory data from frontend
 * @returns {Object} - Inventory data with INR fields populated
 */
function processInventoryCurrency(inventoryData) {
  // ✅ FIXED: Use purchase_currency and purchase_exchange_rate
  const currency = inventoryData.purchase_currency || 'INR';
  const exchangeRate = inventoryData.purchase_exchange_rate || 1;
  
  // Process categories if they exist
  if (inventoryData.categories && Array.isArray(inventoryData.categories)) {
    inventoryData.categories = inventoryData.categories.map(category => {
      const buyingPrice = parseFloat(category.buying_price) || 0;
      const sellingPrice = parseFloat(category.selling_price) || 0;
      
      return {
        ...category,
        buying_price_inr: currency === 'INR' ? buyingPrice : buyingPrice * exchangeRate,
        selling_price_inr: currency === 'INR' ? sellingPrice : sellingPrice * exchangeRate
      };
    });
  }
  
  // Calculate total purchase amount in INR
  if (inventoryData.totalPurchaseAmount) {
    inventoryData.totalPurchaseAmount_inr = currency === 'INR' 
      ? inventoryData.totalPurchaseAmount 
      : inventoryData.totalPurchaseAmount * exchangeRate;
  }
  
  // Calculate amount paid in INR
  if (inventoryData.amountPaid) {
    inventoryData.amountPaid_inr = currency === 'INR' 
      ? inventoryData.amountPaid 
      : inventoryData.amountPaid * exchangeRate;
  }
  
  // For legacy single-category inventory items
  if (!inventoryData.categories && inventoryData.buying_price) {
    inventoryData.buying_price_inr = currency === 'INR' 
      ? inventoryData.buying_price 
      : inventoryData.buying_price * exchangeRate;
      
    inventoryData.selling_price_inr = currency === 'INR' 
      ? inventoryData.selling_price 
      : inventoryData.selling_price * exchangeRate;
  }
  
  return inventoryData;
}

// Helper function to sanitize and validate inventory data
const sanitizeInventoryData = (data) => {
  const sanitized = {
    // Basic Event Information
    event_name: data.event_name || '',
    event_date: data.event_date || '',
    event_type: data.event_type || '',
    sports: data.sports || '',
    venue: data.venue || '',
    day_of_match: data.day_of_match || 'Not Applicable',
    
    // Ticket Details - NOW HANDLED BY CATEGORIES
    category_of_ticket: data.category_of_ticket || '',
    stand: data.stand || '',
    total_tickets: parseInt(data.total_tickets) || 0,
    available_tickets: parseInt(data.available_tickets) || 0,
    
    // Pricing Information - NOW HANDLED BY CATEGORIES
    mrp_of_ticket: parseFloat(data.mrp_of_ticket) || 0,
    buying_price: parseFloat(data.buying_price) || 0,
    selling_price: parseFloat(data.selling_price) || 0,
    
    // Additional Information
    inclusions: data.inclusions || '',
    booking_person: data.booking_person || '',
    procurement_type: data.procurement_type || 'pre_inventory',
    notes: data.notes || '',
    
    // Payment Information - EXACT FIELD NAMES
    paymentStatus: data.paymentStatus || 'pending',
    supplierName: data.supplierName || '',
    supplierInvoice: data.supplierInvoice || '',
    purchasePrice: parseFloat(data.purchasePrice) || 0,
    totalPurchaseAmount: parseFloat(data.totalPurchaseAmount) || 0,
    amountPaid: parseFloat(data.amountPaid) || 0,
    paymentDueDate: data.paymentDueDate || '',
    
    // ✅ FIXED: Currency fields with correct names
    purchase_currency: data.purchase_currency || 'INR',
    purchase_exchange_rate: parseFloat(data.purchase_exchange_rate) || 1,
    totalPurchaseAmount_inr: parseFloat(data.totalPurchaseAmount_inr) || 0,
    amountPaid_inr: parseFloat(data.amountPaid_inr) || 0,
    
    // Legacy fields for backward compatibility (keep old field names too)
    price_currency: data.purchase_currency || data.price_currency || 'INR',
    exchange_rate: data.purchase_exchange_rate || data.exchange_rate || 1,
    vendor_name: data.vendor_name || data.supplierName || '',
    price_per_ticket: parseFloat(data.price_per_ticket) || parseFloat(data.selling_price) || 0,
    number_of_tickets: parseInt(data.number_of_tickets) || parseInt(data.total_tickets) || 0,
    total_value_of_tickets: parseFloat(data.total_value_of_tickets) || 0,
    currency: data.purchase_currency || data.currency || data.price_currency || 'INR',
    base_amount_inr: parseFloat(data.base_amount_inr) || 0,
    gst_18_percent: parseFloat(data.gst_18_percent) || 0,
    selling_price_per_ticket: parseFloat(data.selling_price_per_ticket) || parseFloat(data.selling_price) || 0,
    payment_due_date: data.payment_due_date || data.paymentDueDate || '',
    supplier_name: data.supplier_name || data.supplierName || '',
    ticket_source: data.ticket_source || 'Primary',
    status: data.status || 'available',
    allocated_to_order: data.allocated_to_order || ''
  };
  
  // Process categories if provided
  if (data.categories && Array.isArray(data.categories)) {
    // Calculate aggregate values from categories
    const aggregates = data.categories.reduce((acc, cat) => {
      const totalTickets = parseInt(cat.total_tickets) || 0;
      const availableTickets = parseInt(cat.available_tickets) || 0;
      const buyingPrice = parseFloat(cat.buying_price) || 0;
      
      return {
        total_tickets: acc.total_tickets + totalTickets,
        available_tickets: acc.available_tickets + availableTickets,
        total_cost: acc.total_cost + (buyingPrice * totalTickets)
      };
    }, { total_tickets: 0, available_tickets: 0, total_cost: 0 });
    
    // Update main fields with aggregates
    sanitized.total_tickets = aggregates.total_tickets;
    sanitized.available_tickets = aggregates.available_tickets;
    
    // If totalPurchaseAmount not explicitly set, use calculated value
    if (!data.totalPurchaseAmount) {
      sanitized.totalPurchaseAmount = aggregates.total_cost;
    }
    
    // Store categories
    sanitized.categories = data.categories.map(cat => ({
      name: cat.name || '',
      section: cat.section || '',
      total_tickets: parseInt(cat.total_tickets) || 0,
      available_tickets: parseInt(cat.available_tickets) || 0,
      buying_price: parseFloat(cat.buying_price) || 0,
      selling_price: parseFloat(cat.selling_price) || 0,
      buying_price_inr: parseFloat(cat.buying_price_inr) || 0,
      selling_price_inr: parseFloat(cat.selling_price_inr) || 0,
      inclusions: cat.inclusions || ''
    }));
  }
  
  // Auto-calculate fields if not provided
  if (!sanitized.totalPurchaseAmount && sanitized.purchasePrice && sanitized.total_tickets) {
    sanitized.totalPurchaseAmount = sanitized.purchasePrice * sanitized.total_tickets;
  }
  
  if (!sanitized.totalPurchaseAmount && sanitized.buying_price && sanitized.total_tickets) {
    sanitized.totalPurchaseAmount = sanitized.buying_price * sanitized.total_tickets;
  }
  
  if (!sanitized.total_value_of_tickets && sanitized.selling_price && sanitized.total_tickets) {
    sanitized.total_value_of_tickets = sanitized.selling_price * sanitized.total_tickets;
  }
  
  // Ensure available tickets don't exceed total tickets
  if (sanitized.available_tickets > sanitized.total_tickets) {
    sanitized.available_tickets = sanitized.total_tickets;
  }
  
  return sanitized;
};

// Create inventory - DIRECT DATABASE SAVE
router.post('/', authenticateToken, checkPermission('inventory', 'create'), async (req, res) => {
  try {
    console.log('Creating inventory with data:', JSON.stringify(req.body, null, 2));
    
    // Extract categories from request body
    const { categories, ...otherData } = req.body;
    
    // Validate categories if provided
    if (categories && Array.isArray(categories)) {
      if (categories.length === 0) {
        return res.status(400).json({ error: 'At least one ticket category is required' });
      }
      
      // Validate each category
      for (const cat of categories) {
        if (!cat.name) {
          return res.status(400).json({ error: 'All categories must have a name' });
        }
      }
    }
    
    const sanitizedData = sanitizeInventoryData(req.body);
    
    // Process currency fields
    const processedData = processInventoryCurrency(sanitizedData);
    
    const inventoryData = {
      ...processedData,
      created_by: req.user.name,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };
    
    console.log('Creating inventory with currency:', {
      currency: inventoryData.purchase_currency,
      exchange_rate: inventoryData.purchase_exchange_rate,
      totalPurchaseAmount_inr: inventoryData.totalPurchaseAmount_inr
    });
    
    console.log('Sanitized inventory data:', JSON.stringify(inventoryData, null, 2));
    console.log('Payment fields being saved:');
    console.log('  paymentStatus:', inventoryData.paymentStatus);
    console.log('  supplierName:', inventoryData.supplierName);
    console.log('  totalPurchaseAmount:', inventoryData.totalPurchaseAmount);
    console.log('  totalPurchaseAmount_inr:', inventoryData.totalPurchaseAmount_inr);
    
    // DIRECT DATABASE SAVE - Same as CSV upload
    const docRef = await db.collection('crm_inventory').add(inventoryData);
    
    // Verify saved data
    const savedDoc = await db.collection('crm_inventory').doc(docRef.id).get();
    const savedData = savedDoc.data();
    
    console.log('✅ Inventory saved with payment fields:');
    console.log('  paymentStatus:', savedData.paymentStatus);
    console.log('  supplierName:', savedData.supplierName);
    console.log('  totalPurchaseAmount:', savedData.totalPurchaseAmount);
    console.log('  totalPurchaseAmount_inr:', savedData.totalPurchaseAmount_inr);
    
    // Create payable if payment is pending or partial
    if ((inventoryData.paymentStatus === 'pending' || inventoryData.paymentStatus === 'partial') && inventoryData.totalPurchaseAmount > 0) {
      try {
        // Use INR amounts for payables
        const totalAmountINR = inventoryData.totalPurchaseAmount_inr || inventoryData.totalPurchaseAmount || 0;
        const amountPaidINR = inventoryData.amountPaid_inr || inventoryData.amountPaid || 0;
        const pendingBalanceINR = totalAmountINR - amountPaidINR;
        
        console.log('Creating payable on inventory creation:', {
          totalAmountINR,
          amountPaidINR,
          pendingBalanceINR
        });
        
if (pendingBalanceINR > 0) {
  // Calculate original currency values
  const originalCurrency = inventoryData.purchase_currency || inventoryData.price_currency || 'INR';
  const exchangeRate = inventoryData.purchase_exchange_rate || inventoryData.exchange_rate || 1;
  const originalPendingBalance = originalCurrency === 'INR' 
    ? pendingBalanceINR 
    : pendingBalanceINR / exchangeRate;

  const payableData = {
    inventoryId: docRef.id,
    supplierName: inventoryData.supplierName || inventoryData.vendor_name || 'Unknown Supplier',
    eventName: inventoryData.event_name,
    invoiceNumber: inventoryData.supplierInvoice || 'INV-' + Date.now(),
    amount: pendingBalanceINR, // Always in INR for calculations
    currency: 'INR', // Keep as INR for compatibility
    // Add original currency fields
    original_currency: originalCurrency,
    original_amount: originalPendingBalance,
    exchange_rate: exchangeRate,
    dueDate: inventoryData.paymentDueDate || null,
    status: 'pending',
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
    createdBy: req.user.id,
    description: `Payment for inventory: ${inventoryData.event_name}`,
    payment_notes: `Created from inventory - Balance: ${originalCurrency} ${originalPendingBalance.toFixed(2)} (₹${pendingBalanceINR.toFixed(2)})`
  };
  
  const payableRef = await db.collection('crm_payables').add(payableData);
  console.log('Payable created with ID:', payableRef.id, 
    `Amount: ${originalCurrency} ${originalPendingBalance} (INR: ${pendingBalanceINR})`);
}
      } catch (payableError) {
        console.error('Error creating payable:', payableError);
        // Don't fail the inventory creation if payable fails
      }
    }
    
    res.status(201).json({ 
      data: { 
        id: docRef.id, 
        ...inventoryData 
      },
      message: inventoryData.categories ? 'Inventory created successfully with categories' : 'Inventory created successfully'
    });
  } catch (error) {
    console.error('Error creating inventory:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all inventory - DIRECT DATABASE ACCESS
router.get('/', authenticateToken, checkPermission('inventory', 'read'), async (req, res) => {
  try {
    const snapshot = await db.collection('crm_inventory')
      .orderBy('event_date', 'desc')
      .get();
    const inventory = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Ensure backward compatibility - if no categories exist, create from legacy fields
      if (!data.categories && data.category_of_ticket) {
        data.categories = [{
          name: data.category_of_ticket || 'General',
          section: data.stand || '',
          total_tickets: parseInt(data.total_tickets) || 0,
          available_tickets: parseInt(data.available_tickets) || 0,
          buying_price: parseFloat(data.buying_price) || parseFloat(data.buyingPrice) || 0,
          selling_price: parseFloat(data.selling_price) || parseFloat(data.sellingPrice) || 0,
          buying_price_inr: parseFloat(data.buying_price_inr) || parseFloat(data.buying_price) || 0,
          selling_price_inr: parseFloat(data.selling_price_inr) || parseFloat(data.selling_price) || 0,
          inclusions: data.inclusions || ''
        }];
      }
      
      inventory.push({
        id: doc.id,
        ...data
      });
    });
    res.json({ data: inventory });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single inventory item
router.get('/:id', authenticateToken, checkPermission('inventory', 'read'), async (req, res) => {
  try {
    const doc = await db.collection('crm_inventory').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    const data = doc.data();
    
    // Ensure backward compatibility
    if (!data.categories && data.category_of_ticket) {
      data.categories = [{
        name: data.category_of_ticket || 'General',
        section: data.stand || '',
        total_tickets: parseInt(data.total_tickets) || 0,
        available_tickets: parseInt(data.available_tickets) || 0,
        buying_price: parseFloat(data.buying_price) || parseFloat(data.buyingPrice) || 0,
        selling_price: parseFloat(data.selling_price) || parseFloat(data.sellingPrice) || 0,
        buying_price_inr: parseFloat(data.buying_price_inr) || parseFloat(data.buying_price) || 0,
        selling_price_inr: parseFloat(data.selling_price_inr) || parseFloat(data.selling_price) || 0,
        inclusions: data.inclusions || ''
      }];
    }
    
    res.json({ data: { id: doc.id, ...data } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update inventory with complete payable sync logic
router.put('/:id', authenticateToken, checkPermission('inventory', 'write'), async (req, res) => {
  try {
    const { id } = req.params;
    console.log('=== INVENTORY UPDATE DEBUG ===');
    console.log('Inventory ID:', id);
    console.log('Update data received:', JSON.stringify(req.body, null, 2));
    
    // Get old data before update
    const oldDoc = await db.collection('crm_inventory').doc(id).get();
    if (!oldDoc.exists) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    const oldData = oldDoc.data();
    
    console.log('Old inventory data:', {
      totalPurchaseAmount: oldData.totalPurchaseAmount,
      amountPaid: oldData.amountPaid,
      paymentStatus: oldData.paymentStatus
    });
    
    // Extract categories from request body
    const { categories, ...otherData } = req.body;
    
    // Validate categories if provided
    if (categories && Array.isArray(categories)) {
      if (categories.length === 0) {
        return res.status(400).json({ error: 'At least one ticket category is required' });
      }
      
      // Validate each category
      for (const cat of categories) {
        if (!cat.name) {
          return res.status(400).json({ error: 'All categories must have a name' });
        }
      }
    }
    
    // Sanitize the update data
    const sanitizedData = sanitizeInventoryData(req.body);
    
    // Process currency fields for update
    const processedData = processInventoryCurrency(sanitizedData);
    
    const updateData = {
      ...processedData,
      updated_date: new Date().toISOString()
    };
    
    console.log('Sanitized update data:', JSON.stringify(updateData, null, 2));
    
    // Update inventory first
    await db.collection('crm_inventory').doc(id).update(updateData);
    
    // Update related payables if payment info changed
    if (updateData.paymentStatus !== undefined || 
        updateData.amountPaid !== undefined || 
        updateData.totalPurchaseAmount !== undefined) {
      
      try {
        console.log('Inventory payment info changed, updating payables...');
        
        // ✅ FIXED: Use correct field names for currency
        const currency = updateData.purchase_currency || oldData.purchase_currency || oldData.price_currency || 'INR';
        const currentExchangeRate = parseFloat(updateData.purchase_exchange_rate || oldData.purchase_exchange_rate || oldData.exchange_rate || 1);
        
        const newTotalAmountINR = updateData.totalPurchaseAmount_inr !== undefined 
          ? updateData.totalPurchaseAmount_inr 
          : (oldData.totalPurchaseAmount_inr || (oldData.totalPurchaseAmount || 0));
          
        const newAmountPaidINR = updateData.amountPaid_inr !== undefined 
          ? updateData.amountPaid_inr 
          : (oldData.amountPaid_inr || (oldData.amountPaid || 0));
          
        let newBalanceINR = newTotalAmountINR - newAmountPaidINR;
        
        // Ensure we don't have negative balances
        if (newBalanceINR < 0) {
          console.warn('Warning: Amount paid exceeds total amount! Setting balance to 0');
          newBalanceINR = 0;
        }
        
        console.log('Payment calculation (INR):', { 
          newTotalINR: newTotalAmountINR, 
          newPaidINR: newAmountPaidINR, 
          newBalanceINR: newBalanceINR 
        });

        // Find existing payables for this inventory
        console.log('Searching for payables with inventoryId:', id);
        const payablesSnapshot = await db.collection('crm_payables')
          .where('inventoryId', '==', id)
          .get();
        
        console.log('Payables query result:', payablesSnapshot.size, 'documents found');
        
        if (!payablesSnapshot.empty) {
          // UPDATE EXISTING PAYABLES - ENHANCED WITH EXCHANGE CALCULATION
          console.log(`Found ${payablesSnapshot.size} payables to update`);
          
          // Process each payable individually to trigger exchange calculation
          for (const doc of payablesSnapshot.docs) {
            const payableData = doc.data();
            const payableId = doc.id;
            
            console.log(`Processing payable ${payableId}:`, {
              original_currency: payableData.original_currency,
              currency: payableData.currency,
              status: payableData.status
            });
            
            // Determine the update data based on payment status
            let payableUpdateData = {
              updated_date: new Date().toISOString()
            };
            
            if (newBalanceINR <= 0 || updateData.paymentStatus === 'paid') {
              // MARKING AS PAID - Include exchange rate for calculation
              payableUpdateData = {
                ...payableUpdateData,
                status: 'paid',
                payment_date: new Date().toISOString(),
                amount: 0,
                payment_notes: 'Paid through inventory update',
                // Include current exchange rate if foreign currency
                ...(currency !== 'INR' && { exchange_rate: currentExchangeRate })
              };
              
              console.log(`Marking payable ${payableId} as paid with exchange rate:`, currentExchangeRate);
              
            } else {
              // UPDATE BALANCE
              payableUpdateData = {
                ...payableUpdateData,
                amount: newBalanceINR,
                payment_notes: `Balance updated to ₹${newBalanceINR.toFixed(2)} (Total: ₹${newTotalAmountINR} - Paid: ₹${newAmountPaidINR})`
              };
            }
            
            // Make internal API call to payables PUT endpoint to trigger exchange calculation
            try {
              // Use the payables collection to update via Firestore (similar to PUT endpoint logic)
              const payableRef = db.collection('crm_payables').doc(payableId);
              
              // If marking as paid and foreign currency, calculate exchange difference
              if (payableUpdateData.status === 'paid' && payableData.status !== 'paid') {
                // Check both currency and original_currency fields
                const payableCurrency = payableData.original_currency || payableData.currency;
                
                if (payableCurrency && payableCurrency !== 'INR') {
                  console.log('Calculating exchange difference for payable:', {
                    currency: payableCurrency,
                    original_amount: payableData.original_amount,
                    creation_rate: payableData.creation_exchange_rate || payableData.exchange_rate,
                    current_rate: currentExchangeRate
                  });
                  
                  const originalAmount = payableData.original_amount || (payableData.amount / payableData.exchange_rate);
                  const creationRate = payableData.creation_exchange_rate || payableData.exchange_rate || 1;
                  
                  const paymentAmountINR = originalAmount * currentExchangeRate;
                  const creationAmountINR = payableData.creation_amount_inr || (originalAmount * creationRate);
                  
                  payableUpdateData.payment_exchange_rate = currentExchangeRate;
                  payableUpdateData.payment_amount_inr = paymentAmountINR;
                  payableUpdateData.exchange_difference = paymentAmountINR - creationAmountINR;
                  payableUpdateData.exchange_difference_type = payableUpdateData.exchange_difference > 0 ? 'loss' : 'gain';
                  
                  console.log('Exchange calculation result:', {
                    creation_inr: creationAmountINR,
                    payment_inr: paymentAmountINR,
                    difference: payableUpdateData.exchange_difference,
                    type: payableUpdateData.exchange_difference_type
                  });

                  // Calculate FX impact (add this BEFORE const paymentRecord = {...})
                    const payableCreationRate = payableData.creation_exchange_rate || payableData.exchange_rate || exchangeRate;
                    const paymentAmountForeign = currency === 'INR' ? paymentIncrement : paymentIncrement / exchangeRate;
                    
                    // How much INR it would have cost at creation vs now
                    const creationValueINR = paymentAmountForeign * payableCreationRate;
                    const currentValueINR = paymentAmountForeign * exchangeRate;
                    const fxDifference = currentValueINR - creationValueINR;
                    const fxType = fxDifference > 0 ? 'loss' : 'gain';
                  
                  // Add to payment history
                  const paymentRecord = {
                    date: payableUpdateData.payment_date,
                    amount_foreign: originalAmount,
                    exchange_rate: currentExchangeRate,
                    amount_inr: paymentAmountINR,
                    difference: payableUpdateData.exchange_difference,
                    reference: 'Inventory payment',
                    created_by: req.user.email,
                    fx_difference: fxDifference,
                    fx_type: fxType,
                    fx_note: `Exchange ${fxType}: ₹${Math.abs(fxDifference).toFixed(2)}`
                  };
                  
                  payableUpdateData.payment_history = [...(payableData.payment_history || []), paymentRecord];
                }
              }
              
              // Update the payable
              await payableRef.update(payableUpdateData);
              console.log(`✅ Payable ${payableId} updated successfully`);
              
            } catch (payableUpdateError) {
              console.error(`Error updating payable ${payableId}:`, payableUpdateError);
            }
          }
          
          console.log('All payables updated successfully');
          
        } else {
          // CREATE NEW PAYABLE IF NONE EXISTS AND BALANCE > 0
          if (newBalanceINR > 0 && updateData.paymentStatus !== 'paid') {
            console.log(`Creating new payable for pending balance: ${newBalanceINR}`);

            // Calculate original currency values
            const originalCurrency = updateData.purchase_currency || oldData.purchase_currency || 
                                    updateData.price_currency || oldData.price_currency || 'INR';
            const exchangeRate = updateData.purchase_exchange_rate || oldData.purchase_exchange_rate || 
                                updateData.exchange_rate || oldData.exchange_rate || 1;
            const originalNewBalance = originalCurrency === 'INR' 
              ? newBalanceINR 
              : newBalanceINR / exchangeRate;

            const newPayable = {
              inventoryId: id,
              amount: newBalanceINR, // Always in INR for calculations
              currency: originalCurrency, // Set actual currency
              // Add original currency fields
              original_currency: originalCurrency,
              original_amount: originalNewBalance,
              exchange_rate: exchangeRate,
              // Store creation exchange rate
              creation_exchange_rate: exchangeRate,
              creation_date: new Date().toISOString(),
              creation_amount_inr: newBalanceINR,
              status: 'pending',
              supplierName: updateData.supplierName || oldData.supplierName || updateData.vendor_name || oldData.vendor_name || 'Unknown Supplier',
              event_name: updateData.event_name || oldData.event_name || 'Unknown Event',
              event_date: updateData.event_date || oldData.event_date || null,
              totalPurchaseAmount: newTotalAmountINR,
              amountPaid: newAmountPaidINR,
              created_date: new Date().toISOString(),
              payment_notes: `Created from inventory update - Balance: ${originalCurrency} ${originalNewBalance.toFixed(2)} (₹${newBalanceINR.toFixed(2)})`,
              priority: 'medium',
              dueDate: updateData.paymentDueDate || oldData.paymentDueDate || null
            };

            console.log('About to create payable with data:', JSON.stringify(newPayable, null, 2));
            const docRef = await db.collection('crm_payables').add(newPayable);
            console.log(`✅ New payable created with ID: ${docRef.id} Amount: ${originalCurrency} ${originalNewBalance} (INR: ${newBalanceINR})`);
            
          } else {
            console.log('No payable needed - balance is 0 or item is fully paid');
          }
        }
        
      } catch (payableError) {
        console.error('Error in payables logic:', payableError);
        console.error('Error stack:', payableError.stack);
      }
    } else {
      console.log('No payment-related fields changed, skipping payable sync');
    }
    
    res.json({ 
      data: { id, ...updateData },
      message: updateData.categories ? 'Inventory updated successfully with categories' : 'Inventory updated successfully'
    });
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST allocate inventory - Updated to handle categories
router.post('/:id/allocate', authenticateToken, checkPermission('inventory', 'write'), async (req, res) => {
  try {
    const { id } = req.params;
    const { tickets_allocated, lead_id, allocation_date, notes, category_name } = req.body;
    
    console.log('Allocation request:', { id, tickets_allocated, lead_id, allocation_date, notes, category_name });
    
    // Verify lead exists and is converted
    const leadDoc = await db.collection('crm_leads').doc(lead_id).get();
    if (!leadDoc.exists) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    const leadData = leadDoc.data();
    if (leadData.status !== 'converted') {
      return res.status(400).json({ error: 'Lead must be in converted status to allocate inventory' });
    }
    
    const inventoryDoc = await db.collection('crm_inventory').doc(id).get();
    if (!inventoryDoc.exists) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    const inventoryData = inventoryDoc.data();
    const allocatedTickets = parseInt(tickets_allocated) || 0;
    
    let newAvailableTickets;
    let updateData = {
      updated_date: new Date().toISOString()
    };
    
    // Handle allocation based on whether categories exist
    if (inventoryData.categories && Array.isArray(inventoryData.categories)) {
      // New system with categories
      if (!category_name) {
        return res.status(400).json({ error: 'Category name is required for allocation' });
      }
      
      const categoryIndex = inventoryData.categories.findIndex(cat => cat.name === category_name);
      if (categoryIndex === -1) {
        return res.status(404).json({ error: `Category '${category_name}' not found in inventory` });
      }
      
      const category = inventoryData.categories[categoryIndex];
      const categoryAvailable = parseInt(category.available_tickets) || 0;
      
      if (allocatedTickets > categoryAvailable) {
        return res.status(400).json({ 
          error: `Not enough tickets available in category '${category_name}'. Available: ${categoryAvailable}` 
        });
      }
      
      // Update category
      inventoryData.categories[categoryIndex].available_tickets = categoryAvailable - allocatedTickets;
      
      // Recalculate totals
      const totals = inventoryData.categories.reduce((acc, cat) => ({
        total_tickets: acc.total_tickets + (parseInt(cat.total_tickets) || 0),
        available_tickets: acc.available_tickets + (parseInt(cat.available_tickets) || 0)
      }), { total_tickets: 0, available_tickets: 0 });
      
      updateData.categories = inventoryData.categories;
      updateData.total_tickets = totals.total_tickets;
      updateData.available_tickets = totals.available_tickets;
      newAvailableTickets = totals.available_tickets;
      
    } else {
      // Legacy system without categories
      const availableTickets = parseInt(inventoryData.available_tickets) || 0;
      
      if (allocatedTickets > availableTickets) {
        return res.status(400).json({ error: 'Not enough tickets available for allocation' });
      }
      
      newAvailableTickets = availableTickets - allocatedTickets;
      updateData.available_tickets = newAvailableTickets;
    }
    
    // Update inventory
    await db.collection('crm_inventory').doc(id).update(updateData);
    
    // Create allocation record
    const allocationData = {
      inventory_id: id,
      lead_id: lead_id,
      tickets_allocated: allocatedTickets,
      category_name: category_name || inventoryData.category_of_ticket || 'General',
      allocation_date: allocation_date || new Date().toISOString().split('T')[0],
      notes: notes || '',
      created_date: new Date().toISOString(),
      created_by: req.user.id,
      lead_name: leadData.name,
      lead_email: leadData.email,
      inventory_event: inventoryData.event_name
    };
    
    const allocationRef = await db.collection('crm_allocations').add(allocationData);
    
    console.log(`Successfully allocated ${allocatedTickets} tickets to lead ${leadData.name}`);
    
    res.json({ 
      success: true, 
      message: `Successfully allocated ${allocatedTickets} tickets to ${leadData.name}`,
      allocation_id: allocationRef.id,
      remaining_tickets: newAvailableTickets,
      category: category_name || null
    });
  } catch (error) {
    console.error('Error allocating inventory:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get allocations for a specific inventory item
router.get('/:id/allocations', authenticateToken, checkPermission('inventory', 'read'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get allocations for this inventory
    const allocationsSnapshot = await db.collection('crm_allocations')
      .where('inventory_id', '==', id)
      .get();
    
    const allocations = [];
    for (const doc of allocationsSnapshot.docs) {
      const allocationData = doc.data();
      
      // Get lead details
      let leadDetails = null;
      if (allocationData.lead_id) {
        try {
          const leadDoc = await db.collection('crm_leads').doc(allocationData.lead_id).get();
          if (leadDoc.exists) {
            leadDetails = { id: leadDoc.id, ...leadDoc.data() };
          }
        } catch (leadError) {
          console.error('Error fetching lead details:', leadError);
        }
      }
      
      allocations.push({
        id: doc.id,
        ...allocationData,
        lead_details: leadDetails
      });
    }
    
    // Get inventory details
    const inventoryDoc = await db.collection('crm_inventory').doc(id).get();
    const inventoryData = inventoryDoc.exists ? inventoryDoc.data() : null;
    
    res.json({ 
      data: {
        inventory: { id, ...inventoryData },
        allocations: allocations
      }
    });
  } catch (error) {
    console.error('Error fetching allocations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Unallocate tickets (remove allocation) - Updated to handle categories
router.delete('/:id/allocations/:allocationId', authenticateToken, checkPermission('inventory', 'write'), async (req, res) => {
  try {
    const { id, allocationId } = req.params;
    
    // Get allocation details
    const allocationDoc = await db.collection('crm_allocations').doc(allocationId).get();
    if (!allocationDoc.exists) {
      return res.status(404).json({ error: 'Allocation not found' });
    }
    
    const allocationData = allocationDoc.data();
    const ticketsToReturn = parseInt(allocationData.tickets_allocated) || 0;
    const categoryName = allocationData.category_name;
    
    // Get current inventory
    const inventoryDoc = await db.collection('crm_inventory').doc(id).get();
    if (!inventoryDoc.exists) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    const inventoryData = inventoryDoc.data();
    let updateData = {
      updated_date: new Date().toISOString()
    };
    
    // Handle unallocation based on whether categories exist
    if (inventoryData.categories && Array.isArray(inventoryData.categories) && categoryName) {
      // New system with categories
      const categoryIndex = inventoryData.categories.findIndex(cat => cat.name === categoryName);
      if (categoryIndex !== -1) {
        const category = inventoryData.categories[categoryIndex];
        inventoryData.categories[categoryIndex].available_tickets = 
          (parseInt(category.available_tickets) || 0) + ticketsToReturn;
        
        // Recalculate totals
        const totals = inventoryData.categories.reduce((acc, cat) => ({
          total_tickets: acc.total_tickets + (parseInt(cat.total_tickets) || 0),
          available_tickets: acc.available_tickets + (parseInt(cat.available_tickets) || 0)
        }), { total_tickets: 0, available_tickets: 0 });
        
        updateData.categories = inventoryData.categories;
        updateData.total_tickets = totals.total_tickets;
        updateData.available_tickets = totals.available_tickets;
      }
    } else {
      // Legacy system
      const currentAvailable = parseInt(inventoryData.available_tickets) || 0;
      updateData.available_tickets = currentAvailable + ticketsToReturn;
    }
    
    // Update inventory (add tickets back)
    await db.collection('crm_inventory').doc(id).update(updateData);
    
    // Delete allocation record
    await db.collection('crm_allocations').doc(allocationId).delete();
    
    console.log(`Unallocated ${ticketsToReturn} tickets from inventory ${id}`);
    
    res.json({ 
      success: true, 
      message: `Successfully unallocated ${ticketsToReturn} tickets`,
      tickets_returned: ticketsToReturn,
      new_available_tickets: updateData.available_tickets,
      category: categoryName || null
    });
  } catch (error) {
    console.error('Error unallocating tickets:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete inventory
router.delete('/:id', authenticateToken, checkPermission('inventory', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete related payables first
    const payablesSnapshot = await db.collection('crm_payables')
      .where('inventoryId', '==', id)
      .get();
    
    if (!payablesSnapshot.empty) {
      const batch = db.batch();
      payablesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`Deleted ${payablesSnapshot.size} related payables`);
    }
    
    // Delete inventory item
    await db.collection('crm_inventory').doc(id).delete();
    
    res.json({ data: { message: 'Inventory and related payables deleted successfully' } });
  } catch (error) {
    console.error('Error deleting inventory:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get unpaid inventory for payables tracking
router.get('/unpaid', authenticateToken, checkPermission('finance', 'read'), async (req, res) => {
  try {
    const snapshot = await db.collection('crm_inventory')
      .where('paymentStatus', 'in', ['pending', 'partial'])
      .get();
    
    const unpaidInventory = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Use INR amounts for calculations
      const totalAmountINR = data.totalPurchaseAmount_inr || data.totalPurchaseAmount || 0;
      const paidAmountINR = data.amountPaid_inr || data.amountPaid || 0;
      const balance = totalAmountINR - paidAmountINR;
      
      if (balance > 0) {
        unpaidInventory.push({
          id: doc.id,
          ...data,
          balance: balance,
          balance_currency: 'INR',
          daysOverdue: data.paymentDueDate ? 
            Math.floor((new Date() - new Date(data.paymentDueDate)) / (1000 * 60 * 60 * 24)) : 0
        });
      }
    });
    
    res.json({ data: unpaidInventory });
  } catch (error) {
    console.error('Error fetching unpaid inventory:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update inventory payment specifically (alternative endpoint)
router.put('/:id/payment', authenticateToken, checkPermission('finance', 'write'), async (req, res) => {
  try {
    const { id } = req.params;
    const { amountPaid, paymentStatus, totalPurchaseAmount } = req.body;
    
    console.log('=== PAYMENT ENDPOINT CALLED ===');
    console.log('Inventory ID:', id);
    console.log('Payment data:', { amountPaid, paymentStatus, totalPurchaseAmount });
    
    const updateData = {
      amountPaid: parseFloat(amountPaid) || 0,
      paymentStatus: paymentStatus,
      updated_date: new Date().toISOString()
    };
    
    if (totalPurchaseAmount !== undefined) {
      updateData.totalPurchaseAmount = parseFloat(totalPurchaseAmount) || 0;
    }
    
    // Get current inventory data for currency processing
    const inventoryDoc = await db.collection('crm_inventory').doc(id).get();
    if (!inventoryDoc.exists) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    const currentData = inventoryDoc.data();
    
    // ADD THIS: Calculate payment increment for partial payments
    const oldAmountPaid = parseFloat(currentData.amountPaid || 0);
    const newAmountPaid = parseFloat(amountPaid || 0);
    const paymentIncrement = newAmountPaid - oldAmountPaid;
    
    console.log('Payment calculation:', {
      oldAmountPaid,
      newAmountPaid,
      paymentIncrement,
      paymentStatus: updateData.paymentStatus
    });
    
    // Use correct field names with fallback
    const currency = currentData.purchase_currency || currentData.price_currency || 'INR';
    const exchangeRate = currentData.purchase_exchange_rate || currentData.exchange_rate || 1;
    
    // Calculate INR equivalents
    if (currency !== 'INR') {
      updateData.amountPaid_inr = updateData.amountPaid * exchangeRate;
      if (updateData.totalPurchaseAmount !== undefined) {
        updateData.totalPurchaseAmount_inr = updateData.totalPurchaseAmount * exchangeRate;
      }
    } else {
      updateData.amountPaid_inr = updateData.amountPaid;
      if (updateData.totalPurchaseAmount !== undefined) {
        updateData.totalPurchaseAmount_inr = updateData.totalPurchaseAmount;
      }
    }
    
    await db.collection('crm_inventory').doc(id).update(updateData);
    
    // UPDATE THIS SECTION: Handle payable updates with partial payment tracking
    const payablesSnapshot = await db.collection('crm_payables')
      .where('inventoryId', '==', id)
      .get();
    
    if (!payablesSnapshot.empty) {
      const batch = db.batch();
      
      for (const doc of payablesSnapshot.docs) {
        const payableData = doc.data();
        const payableUpdate = {
          status: paymentStatus === 'paid' ? 'paid' : (paymentStatus === 'partial' ? 'partial' : 'pending'),
          updated_date: new Date().toISOString()
        };
        
        // ADD THIS: If this is a partial payment, track the payment history
        if (paymentIncrement > 0 && paymentStatus === 'partial') {
          // Initialize payment history if it doesn't exist
          const paymentHistory = payableData.payment_history || [];
          
          // Add new payment record
          const paymentRecord = {
            payment_id: 'PAY-' + Date.now(),
            date: new Date().toISOString(),
            amount_foreign: currency === 'INR' ? paymentIncrement : paymentIncrement / exchangeRate,
            currency: currency,
            exchange_rate: exchangeRate,
            amount_inr: paymentIncrement,
            reference: `Partial payment from inventory`,
            created_by: req.user.email
          };
          
          payableUpdate.payment_history = [...paymentHistory, paymentRecord];
          payableUpdate.total_paid_foreign = (payableData.total_paid_foreign || 0) + paymentRecord.amount_foreign;
          payableUpdate.total_paid_inr = (payableData.total_paid_inr || 0) + paymentIncrement;
          
          console.log('Adding payment record to payable:', paymentRecord);
        }
        
        batch.update(doc.ref, payableUpdate);
      }
      
      await batch.commit();
    }
    
    res.json({ 
      success: true, 
      message: paymentIncrement > 0 && paymentStatus === 'partial' 
        ? `Partial payment of ${currency} ${currency === 'INR' ? paymentIncrement : (paymentIncrement / exchangeRate).toFixed(2)} recorded successfully`
        : 'Payment updated and synced',
      data: { 
        id, 
        ...updateData,
        payment_increment: paymentIncrement
      }
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ error: error.message });
  }
});

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
    const snapshot = await db.collection('crm_inventory').get();
    
    if (snapshot.empty) {
      return res.json({ message: 'No inventory to delete', count: 0 });
    }
    
    // Delete related payables first
    const inventoryIds = [];
    snapshot.forEach(doc => {
      inventoryIds.push(doc.id);
    });
    
    // Delete payables in batches
    let payablesDeleted = 0;
    for (const inventoryId of inventoryIds) {
      const payablesSnapshot = await db.collection('crm_payables')
        .where('inventoryId', '==', inventoryId)
        .get();
      
      if (!payablesSnapshot.empty) {
        const batch = db.batch();
        payablesSnapshot.forEach(doc => {
          batch.delete(doc.ref);
          payablesDeleted++;
        });
        await batch.commit();
      }
    }
    
    // Delete inventory in batches
    const batch = db.batch();
    let count = 0;
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });
    
    await batch.commit();
    
    console.log(`Deleted ${count} inventory items and ${payablesDeleted} related payables`);
    res.json({ 
      message: `Successfully deleted ${count} inventory items and ${payablesDeleted} related payables`,
      count: count,
      payablesDeleted: payablesDeleted
    });
    
  } catch (error) {
    console.error('Bulk delete inventory error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
