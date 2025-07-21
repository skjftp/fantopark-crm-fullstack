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
  if (inventoryData.totalPurchaseAmount !== undefined) {
    inventoryData.totalPurchaseAmount_inr = currency === 'INR' 
      ? inventoryData.totalPurchaseAmount 
      : inventoryData.totalPurchaseAmount * exchangeRate;
  }
  
  // Calculate amount paid in INR
  if (inventoryData.amountPaid !== undefined) {
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

    
    form_ids: Array.isArray(data.form_ids) ? data.form_ids : [],
    
    // Payment Information - EXACT FIELD NAMES
    paymentStatus: data.paymentStatus || 'pending',
    supplierName: data.supplierName || '',
    supplierInvoice: data.supplierInvoice || '',
    purchasePrice: parseFloat(data.purchasePrice) || 0,
    totalPurchaseAmount: parseFloat(data.totalPurchaseAmount) || 0,
    amountPaid: parseFloat(data.amountPaid) || 0,  // This should be in purchase_currency
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
    
    // REVAMPED: Create payable with FULL amount and initial payment history
    if ((inventoryData.paymentStatus === 'pending' || inventoryData.paymentStatus === 'partial') && inventoryData.totalPurchaseAmount > 0) {
      try {
        // Use INR amounts for payables
        const totalAmountINR = inventoryData.totalPurchaseAmount_inr || inventoryData.totalPurchaseAmount || 0;
        const amountPaidINR = inventoryData.amountPaid_inr || inventoryData.amountPaid || 0;
        
        console.log('Creating payable with ledger system:', {
          totalAmountINR,
          amountPaidINR,
          hasInitialPayment: amountPaidINR > 0
        });
        
        // Always create payable with FULL amount if total > 0
        if (totalAmountINR > 0) {
          const originalCurrency = inventoryData.purchase_currency || inventoryData.price_currency || 'INR';
          const exchangeRate = inventoryData.purchase_exchange_rate || inventoryData.exchange_rate || 1;
          const originalTotalAmount = originalCurrency === 'INR' 
            ? totalAmountINR 
            : totalAmountINR / exchangeRate;

          // Initialize payment history array
          const paymentHistory = [];
          
          // If there's an initial payment, record it as the first transaction
          if (amountPaidINR > 0) {
            const initialPaymentRecord = {
              payment_id: 'PAY-INITIAL-' + Date.now(),
              date: new Date().toISOString(),
              amount_foreign: originalCurrency === 'INR' ? amountPaidINR : amountPaidINR / exchangeRate,
              currency: originalCurrency,
              exchange_rate: exchangeRate,
              amount_inr: amountPaidINR,
              creation_rate: exchangeRate, // Same as current rate for initial payment
              fx_difference: 0, // No FX difference on initial payment
              fx_type: null,
              reference: `Initial payment - Invoice: ${inventoryData.supplierInvoice || 'N/A'}`,
              notes: 'Initial payment recorded at inventory creation',
              created_by: req.user?.email || 'system',
              created_date: new Date().toISOString()
            };
            paymentHistory.push(initialPaymentRecord);
          }

          const payableData = {
            inventoryId: docRef.id,
            supplierName: inventoryData.supplierName || inventoryData.vendor_name || 'Unknown Supplier',
            eventName: inventoryData.event_name,
            event_name: inventoryData.event_name,
            event_date: inventoryData.event_date || null,
            invoiceNumber: inventoryData.supplierInvoice || 'INV-' + Date.now(),
            
            // Store FULL amount, not balance
            amount: totalAmountINR, // Always in INR for calculations
            currency: 'INR', // Keep as INR for compatibility
            
            // Original amount tracking
            original_currency: originalCurrency,
            original_amount: originalTotalAmount, // FULL amount in original currency
            exchange_rate: exchangeRate,
            
            // Creation tracking
            creation_exchange_rate: exchangeRate,
            creation_date: new Date().toISOString(),
            creation_amount_inr: totalAmountINR,
            
            // Payment tracking
            payment_history: paymentHistory,
            total_paid_foreign: amountPaidINR > 0 ? (originalCurrency === 'INR' ? amountPaidINR : amountPaidINR / exchangeRate) : 0,
            total_paid_inr: amountPaidINR,
            remaining_amount_foreign: originalTotalAmount - (amountPaidINR > 0 ? (originalCurrency === 'INR' ? amountPaidINR : amountPaidINR / exchangeRate) : 0),
            
            // Status based on payment
            status: amountPaidINR >= totalAmountINR ? 'paid' : (amountPaidINR > 0 ? 'partial' : 'pending'),
            
            // Metadata
            dueDate: inventoryData.paymentDueDate || null,
            priority: 'medium',
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString(),
            createdBy: req.user.id,
            totalPurchaseAmount: totalAmountINR,
            amountPaid: amountPaidINR,
            description: `Payment for inventory: ${inventoryData.event_name}`,
            payment_notes: `Payable created - Total: ${originalCurrency} ${originalTotalAmount.toFixed(2)} (₹${totalAmountINR.toFixed(2)}), Paid: ₹${amountPaidINR.toFixed(2)}`,
            
            // Add tracking fields
            last_payment_date: amountPaidINR > 0 ? new Date().toISOString() : null
          };
          
          const payableRef = await db.collection('crm_payables').add(payableData);
          console.log('✅ Payable created with ID:', payableRef.id, 
            `Total Amount: ${originalCurrency} ${originalTotalAmount} (INR: ${totalAmountINR}), Initial Payment: ${amountPaidINR}`);
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

    // Log form_ids specifically if present
if (req.body.form_ids !== undefined) {
  console.log('📘 Updating form_ids:', req.body.form_ids);
}
    
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
            const payableRef = db.collection('crm_payables').doc(payableId);
            
            console.log(`Processing payable ${payableId}:`, {
              original_currency: payableData.original_currency,
              currency: payableData.currency,
              status: payableData.status
            });
            
            // FIXED: Calculate payment increment correctly for foreign currency
            const oldAmountPaidINR = parseFloat(oldData.amountPaid_inr || oldData.amountPaid || 0);
            
            // For foreign currency, we need to work with the original currency amounts
            let paymentIncrementINR;
            let paymentIncrementForeign;
            
            if (currency === 'INR') {
              // For INR inventory, simple calculation
              paymentIncrementINR = newAmountPaidINR - oldAmountPaidINR;
              paymentIncrementForeign = paymentIncrementINR;
            } else {
              // For foreign currency inventory
              // The form should be sending amounts in the original currency (e.g., USD)
              const oldAmountPaidForeign = parseFloat(oldData.amountPaid || 0);
              const newAmountPaidForeign = parseFloat(updateData.amountPaid || 0);
              
              paymentIncrementForeign = newAmountPaidForeign - oldAmountPaidForeign;
              paymentIncrementINR = paymentIncrementForeign * currentExchangeRate;
              
              console.log('Foreign currency payment calculation:', {
                currency,
                oldAmountPaidForeign,
                newAmountPaidForeign,
                paymentIncrementForeign,
                currentExchangeRate,
                paymentIncrementINR
              });
            }
            
            console.log('Payment increment calculated:', {
              foreign: paymentIncrementForeign,
              inr: paymentIncrementINR
            });
            
            // Determine the update data based on payment status
            let payableUpdateData = {
              updated_date: new Date().toISOString(),
              updated_by: req.user?.email || 'system'
            };
            
            if (newBalanceINR <= 0 || updateData.paymentStatus === 'paid') {
              // MARKING AS PAID
              payableUpdateData = {
                ...payableUpdateData,
                status: 'paid',
                payment_date: new Date().toISOString(),
                amount: 0,
                payment_notes: 'Paid through inventory update',
                ...(currency !== 'INR' && { exchange_rate: currentExchangeRate })
              };
              
              // If there's a payment increment for the final payment, add it to history
              if (paymentIncrementForeign > 0) {
                const finalPaymentRecord = {
                  payment_id: 'PAY-FINAL-' + Date.now(),
                  date: new Date().toISOString(),
                  amount_foreign: paymentIncrementForeign,
                  currency: payableData.original_currency || payableData.currency || 'INR',
                  exchange_rate: currentExchangeRate,
                  amount_inr: paymentIncrementINR,
                  reference: `Final payment - Invoice: ${updateData.supplierInvoice || oldData.supplierInvoice || 'N/A'}`,
                  notes: 'Final payment recorded through inventory form',
                  created_by: req.user?.email || 'system'
                };
                
                payableUpdateData.payment_history = [
                  ...(payableData.payment_history || []),
                  finalPaymentRecord
                ];
                
                // Calculate total FX impact if foreign currency
                if (payableData.original_currency && payableData.original_currency !== 'INR') {
                  const creationRate = payableData.creation_exchange_rate || payableData.exchange_rate || 1;
                  const fxDifference = (finalPaymentRecord.amount_foreign * currentExchangeRate) - (finalPaymentRecord.amount_foreign * creationRate);
                  finalPaymentRecord.fx_difference = fxDifference;
                  finalPaymentRecord.fx_type = fxDifference > 0 ? 'loss' : 'gain';
                }
              }
            } else {
              // UPDATE BALANCE
              payableUpdateData = {
                ...payableUpdateData,
                amount: newBalanceINR,
                status: updateData.paymentStatus === 'partial' ? 'partial' : 'pending',
                payment_notes: `Balance updated to ₹${newBalanceINR.toFixed(2)} (Total: ₹${newTotalAmountINR} - Paid: ₹${newAmountPaidINR})`
              };
              
              // ADD PAYMENT HISTORY FOR PARTIAL PAYMENTS
              if (paymentIncrementForeign > 0 && updateData.paymentStatus === 'partial') {
                const paymentRecord = {
                  payment_id: 'PAY-' + Date.now(),
                  date: new Date().toISOString(),
                  amount_foreign: paymentIncrementForeign, // This will be exactly the difference (e.g., 1000 USD)
                  currency: payableData.original_currency || payableData.currency || 'INR',
                  exchange_rate: currentExchangeRate,
                  amount_inr: paymentIncrementINR,
                  reference: `Partial payment - Invoice: ${updateData.supplierInvoice || oldData.supplierInvoice || 'N/A'}`,
                  notes: 'Payment recorded through inventory form',
                  created_by: req.user?.email || 'system'
                };
                
                // Calculate FX impact if foreign currency
                if (payableData.original_currency && payableData.original_currency !== 'INR') {
                  const creationRate = payableData.creation_exchange_rate || payableData.exchange_rate || 1;
                  const expectedINR = paymentIncrementForeign * creationRate;
                  const actualINR = paymentIncrementForeign * currentExchangeRate;
                  const fxDifference = actualINR - expectedINR;
                  
                  paymentRecord.fx_difference = fxDifference;
                  paymentRecord.fx_type = fxDifference > 0 ? 'loss' : 'gain';
                  paymentRecord.creation_rate = creationRate;
                }
                
                payableUpdateData.payment_history = [
                  ...(payableData.payment_history || []),
                  paymentRecord
                ];
                
                // Update totals using foreign currency amounts
                const totalPaidForeign = (payableData.payment_history || [])
                  .reduce((sum, p) => sum + (p.amount_foreign || 0), 0) + paymentRecord.amount_foreign;
                
                payableUpdateData.total_paid_foreign = totalPaidForeign;
                payableUpdateData.total_paid_inr = newAmountPaidINR;
                payableUpdateData.last_payment_date = paymentRecord.date;
                payableUpdateData.remaining_amount_foreign = (payableData.original_amount || 0) - totalPaidForeign;
                
                console.log('Recording partial payment:', paymentRecord);
              }
            }
            
            // Update the payable
            await payableRef.update(payableUpdateData);
            console.log(`✅ Payable ${payableId} updated successfully with payment history`);
            
          }
          
          console.log('All payables updated successfully');
          
        } else {
          // REVAMPED: CREATE NEW PAYABLE IF NONE EXISTS AND TOTAL > 0
          if (newTotalAmountINR > 0 && updateData.paymentStatus !== 'paid') {
            console.log(`Creating new payable for total amount: ${newTotalAmountINR}`);

            // Calculate original currency values
            const originalCurrency = updateData.purchase_currency || oldData.purchase_currency || 
                                    updateData.price_currency || oldData.price_currency || 'INR';
            const exchangeRate = updateData.purchase_exchange_rate || oldData.purchase_exchange_rate || 
                                updateData.exchange_rate || oldData.exchange_rate || 1;
            const originalTotalAmount = originalCurrency === 'INR' 
              ? newTotalAmountINR 
              : newTotalAmountINR / exchangeRate;

            // Initialize payment history with any existing payment
            const paymentHistory = [];
            if (newAmountPaidINR > 0) {
              paymentHistory.push({
                payment_id: 'PAY-INITIAL-' + Date.now(),
                date: new Date().toISOString(),
                amount_foreign: originalCurrency === 'INR' ? newAmountPaidINR : newAmountPaidINR / exchangeRate,
                currency: originalCurrency,
                exchange_rate: exchangeRate,
                amount_inr: newAmountPaidINR,
                reference: `Initial payment - Invoice: ${updateData.supplierInvoice || oldData.supplierInvoice || 'N/A'}`,
                notes: 'Initial payment recorded during inventory update',
                created_by: req.user?.email || 'system'
              });
            }

            const newPayable = {
              inventoryId: id,
              amount: newTotalAmountINR, // Store FULL amount, not balance
              currency: originalCurrency,
              // Add original currency fields
              original_currency: originalCurrency,
              original_amount: originalTotalAmount, // FULL amount in original currency
              exchange_rate: exchangeRate,
              // Store creation exchange rate
              creation_exchange_rate: exchangeRate,
              creation_date: new Date().toISOString(),
              creation_amount_inr: newTotalAmountINR,
              // Payment tracking
              payment_history: paymentHistory,
              total_paid_foreign: newAmountPaidINR > 0 ? (originalCurrency === 'INR' ? newAmountPaidINR : newAmountPaidINR / exchangeRate) : 0,
              total_paid_inr: newAmountPaidINR,
              remaining_amount_foreign: originalTotalAmount - (newAmountPaidINR > 0 ? (originalCurrency === 'INR' ? newAmountPaidINR : newAmountPaidINR / exchangeRate) : 0),
              status: newAmountPaidINR >= newTotalAmountINR ? 'paid' : (newAmountPaidINR > 0 ? 'partial' : 'pending'),
              supplierName: updateData.supplierName || oldData.supplierName || updateData.vendor_name || oldData.vendor_name || 'Unknown Supplier',
              event_name: updateData.event_name || oldData.event_name || 'Unknown Event',
              event_date: updateData.event_date || oldData.event_date || null,
              totalPurchaseAmount: newTotalAmountINR,
              amountPaid: newAmountPaidINR,
              created_date: new Date().toISOString(),
              payment_notes: `Payable created - Total: ${originalCurrency} ${originalTotalAmount.toFixed(2)} (₹${newTotalAmountINR.toFixed(2)}), Paid: ₹${newAmountPaidINR.toFixed(2)}`,
              priority: 'medium',
              dueDate: updateData.paymentDueDate || oldData.paymentDueDate || null,
              last_payment_date: newAmountPaidINR > 0 ? new Date().toISOString() : null
            };

            console.log('About to create payable with data:', JSON.stringify(newPayable, null, 2));
            const docRef = await db.collection('crm_payables').add(newPayable);
            console.log(`✅ New payable created with ID: ${docRef.id} Total Amount: ${originalCurrency} ${originalTotalAmount} (INR: ${newTotalAmountINR})`);
            
          } else {
            console.log('No payable needed - total is 0 or item is fully paid');
          }
        }
        
      } catch (payableError) {
        console.error('Error in payables logic:', payableError);
        console.error('Error stack:', payableError.stack);
      }
    } else {
      console.log('No payment-related fields changed, skipping payable sync');
    }
    
// Verify form_ids were saved
const verifyDoc = await db.collection('crm_inventory').doc(id).get();
const verifyData = verifyDoc.data();
console.log('✅ After update - form_ids:', verifyData.form_ids);

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
    
    // Calculate payment increment
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
    
    // Handle payable updates with partial payment tracking
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
        
        // If this is a partial payment, track the payment history
        if (paymentIncrement > 0) {
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
    
    // Bulk delete is disabled
    return res.status(403).json({ error: 'Bulk delete functionality has been disabled' });
    
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




// DEBUG ENDPOINT - Remove after testing
router.get('/debug/forms', authenticateToken, async (req, res) => {
  try {
    const inventories = await db.collection('crm_inventory').get();
    const results = [];
    
    inventories.forEach(doc => {
      const data = doc.data();
      if (data.form_ids && data.form_ids.length > 0) {
        results.push({
          id: doc.id,
          event_name: data.event_name,
          form_ids: data.form_ids
        });
      }
    });
    
    res.json({
      total_inventories: inventories.size,
      inventories_with_forms: results.length,
      data: results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
