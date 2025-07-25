const csv = require('csv-parse/sync');
const admin = require('../config/firebase');
const db = admin.firestore();
const moment = require('moment-timezone');
const { v4: uuidv4 } = require('uuid');

class BulkOrderService {
  // Get a finance team member for assignment
  getFinanceTeamMember() {
    const financeTeam = ['jaya@fantopark.com', 'rishabh@fantopark.com'];
    // Round-robin assignment - alternate between team members
    const randomIndex = Math.floor(Math.random() * financeTeam.length);
    return financeTeam[randomIndex];
  }
  async processBulkOrders(csvBuffer, uploadedBy) {
    console.log('📋 Starting bulk order processing...');
    
    const results = {
      summary: {
        total: 0,
        success: 0,
        failed: 0,
        ordersCreated: 0,
        totalAmount: 0,
        errors: []
      },
      details: [],
      failed: []
    };

    try {
      // Parse CSV
      const records = csv.parse(csvBuffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      console.log(`📊 Found ${records.length} records to process`);
      results.summary.total = records.length;

      // Process each record
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const row = i + 2; // Account for header row

        try {
          const result = await this.processOrderRecord(record, row, uploadedBy);
          
          if (result.success) {
            results.summary.success++;
            results.summary.ordersCreated++;
            results.summary.totalAmount += result.totalAmount;
            results.details.push(result);
          } else {
            results.summary.failed++;
            results.failed.push({
              row,
              lead_id: record.lead_id,
              errors: result.errors
            });
          }
        } catch (error) {
          console.error(`❌ Error processing row ${row}:`, error);
          results.summary.failed++;
          results.failed.push({
            row,
            lead_id: record.lead_id,
            errors: [error.message]
          });
        }
      }

      console.log('✅ Bulk order processing completed:', results.summary);
      return results;
    } catch (error) {
      console.error('❌ Fatal error in bulk order processing:', error);
      throw error;
    }
  }

  async processOrderRecord(record, row, uploadedBy) {
    const errors = [];
    
    // Validate required fields
    if (!record.lead_id) {
      errors.push('Lead ID is required');
    }
    if (!record.client_name) {
      errors.push('Client name is required');
    }
    if (!record.event_name) {
      errors.push('Event name is required');
    }
    if (!record.rate || isNaN(parseFloat(record.rate))) {
      errors.push('Valid rate amount is required');
    }
    if (!record.quantity || isNaN(parseInt(record.quantity))) {
      errors.push('Valid quantity is required');
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    try {
      // Get lead data
      const leadRef = db.collection('crm_leads').doc(record.lead_id);
      const leadDoc = await leadRef.get();
      
      if (!leadDoc.exists) {
        return { 
          success: false, 
          errors: [`Lead with ID ${record.lead_id} not found`] 
        };
      }

      const leadData = leadDoc.data();

      // Get event date from inventory based on event_name
      let eventDate = record.event_date || leadData.event_date || leadData.event_start_date;
      
      if (!eventDate && record.event_name) {
        // Try to find the event in inventory
        const inventorySnapshot = await db.collection('crm_inventory')
          .where('event_name', '==', record.event_name)
          .limit(1)
          .get();
        
        if (!inventorySnapshot.empty) {
          const inventoryData = inventorySnapshot.docs[0].data();
          eventDate = inventoryData.event_date || inventoryData.event_start_date;
          console.log(`📅 Found event date from inventory: ${eventDate} for ${record.event_name}`);
        }
      }

      // Parse amounts
      const rate = parseFloat(record.rate) || 0;
      const quantity = parseInt(record.quantity) || 1;
      const invoiceTotal = rate * quantity;
      const serviceFeeAmount = parseFloat(record.service_fee_amount) || 0;
      const advanceAmount = parseFloat(record.advance_amount) || 0;
      const inclusionsCost = parseFloat(record.inclusions_cost) || 0;
      const gstRate = parseFloat(record.gst_rate) || 18;

      // Check location and customer type for GST calculation
      const isOutsideIndia = record.is_outside_india === 'true' || record.is_outside_india === 'TRUE' || record.is_outside_india === true || record.event_location === 'outside_india';
      const isIndian = record.customer_type === 'indian';
      const isINRPayment = record.payment_currency === 'INR';
      
      // Determine if GST applies based on business rules
      let gstApplicable = false;
      if (isIndian) {
        // Indian customers always get GST regardless of location
        gstApplicable = true;
      } else if (!isOutsideIndia) {
        // Event in India = GST applicable
        gstApplicable = true;
      } else if (isOutsideIndia && isINRPayment) {
        // Event outside India but paying in INR = GST applicable
        gstApplicable = true;
      }
      
      const effectiveGstRate = gstApplicable ? gstRate : 0;
      
      // Calculate GST based on type of sale
      let taxableAmount = 0;
      let gstAmount = 0;
      
      if (record.type_of_sale === 'Service Fee') {
        // For Service Fee: GST only on service fee amount
        taxableAmount = serviceFeeAmount;
        gstAmount = (serviceFeeAmount * effectiveGstRate) / 100;
      } else {
        // For other types (Tour Package, Ticket Sale): GST on total
        taxableAmount = invoiceTotal + serviceFeeAmount;
        gstAmount = (taxableAmount * effectiveGstRate) / 100;
      }
      
      // Determine if intra-state (CGST/SGST) or inter-state (IGST)
      const isIntraState = record.state_location === 'Haryana' && !isOutsideIndia;
      const cgst = gstAmount > 0 && isIntraState ? gstAmount / 2 : 0;
      const sgst = gstAmount > 0 && isIntraState ? gstAmount / 2 : 0;
      const igst = gstAmount > 0 && !isIntraState ? gstAmount : 0;

      // Calculate TCS if applicable
      const isCorporate = record.category_of_sale === 'corporate' || record.category_of_sale === 'Corporate';
      let tcsApplicable = false;
      let tcsRate = parseFloat(record.tcs_rate) || 5;
      
      // B2B clients NEVER get TCS
      if (!isCorporate && isOutsideIndia) {
        // Only B2C (Retail) clients can get TCS for events outside India
        if (isIndian || isINRPayment) {
          tcsApplicable = true;
        }
      }
      
      const tcsAmount = tcsApplicable ? ((invoiceTotal + serviceFeeAmount + gstAmount) * tcsRate) / 100 : 0;
      
      // Calculate final amount
      const totalBeforeTax = invoiceTotal + serviceFeeAmount;
      const finalAmount = invoiceTotal + serviceFeeAmount + gstAmount + tcsAmount;

      // Prepare order data
      const orderData = {
        // Lead information
        lead_id: record.lead_id,
        lead_name: record.lead_name || leadData.lead_name || record.client_name,
        lead_phone: record.client_phone || leadData.lead_phone,
        lead_email: record.client_email || leadData.lead_email,
        
        // Client information
        client_name: record.client_name,
        client_email: record.client_email || leadData.lead_email,
        client_phone: record.client_phone || leadData.lead_phone,
        
        // Customer classification
        customer_type: record.customer_type || 'indian',
        event_location: record.event_location || 'india',
        payment_currency: record.payment_currency || 'INR',
        
        // Event details
        event_name: record.event_name || leadData.event_name || 'Event',
        event_date: eventDate || null,
        
        // Ticket details
        quantity: quantity,
        tickets_allocated: quantity,
        ticket_category: record.category_of_sale || 'Corporate',
        
        // GST & Legal details
        gstin: record.gstin || '',
        legal_name: record.legal_name || record.client_name,
        category_of_sale: record.category_of_sale || 'corporate',
        type_of_sale: record.type_of_sale || 'Service Fee',
        gst_rate: gstRate,
        registered_address: record.registered_address || '',
        state_location: record.state_location || '',
        indian_state: record.state_location || '',  // Payment form expects this field
        is_outside_india: record.is_outside_india === 'true' || record.is_outside_india === 'TRUE' || record.is_outside_india === true,
        
        // Invoice items (payment form expects 'invoice_items' not 'items')
        invoice_items: [{
          description: record.event_description || record.event_name,
          quantity: quantity,
          rate: rate,
          amount: invoiceTotal,
          additional_info: record.additional_info || ''
        }],
        // Keep items for backward compatibility
        items: [{
          description: record.event_description || record.event_name,
          quantity: quantity,
          rate: rate,
          amount: invoiceTotal,
          additional_info: record.additional_info || ''
        }],
        
        // Amounts
        invoice_subtotal: invoiceTotal,
        service_fee_amount: serviceFeeAmount,
        cgst_amount: cgst,
        sgst_amount: sgst,
        igst_amount: igst,
        gst_amount: gstAmount,
        tcs_rate: tcsRate,
        tcs_amount: tcsAmount,
        total_amount_before_tax: totalBeforeTax,
        base_amount: totalBeforeTax, // Some views expect base_amount
        final_amount: finalAmount,
        advance_amount: advanceAmount,
        balance_due: finalAmount - advanceAmount,
        
        // Inclusions
        inclusions_cost: inclusionsCost,
        inclusions_description: record.inclusions_description || '',
        
        // Payment details
        payment_method: record.payment_method || 'Bank Transfer',
        transaction_id: record.transaction_id || '',
        payment_date: record.payment_date ? moment(record.payment_date, ['DD/MM/YY', 'DD/MM/YYYY', 'YYYY-MM-DD']).format('YYYY-MM-DD') : moment().tz('Asia/Kolkata').format('YYYY-MM-DD'),
        
        // Metadata
        order_number: `ORD-${Date.now()}-${row}`,
        status: 'pending_approval', // Always pending_approval for bulk uploads
        created_by: uploadedBy,
        created_date: moment().tz('Asia/Kolkata').toISOString(),
        created_at: moment().tz('Asia/Kolkata').toISOString(), // Some views expect created_at
        created_via: 'bulk_upload',
        notes: record.notes || '',
        
        // Assignment fields - auto-assign to finance team
        assigned_team: 'finance',
        assigned_to: this.getFinanceTeamMember(),
        assignment_date: moment().tz('Asia/Kolkata').toISOString(),
        assignment_notes: 'Auto-assigned to finance team via bulk upload',
        
        // Additional fields for compatibility with payment form
        advance_amount_inr: advanceAmount,
        final_amount_inr: finalAmount,
        exchange_rate: record.exchange_rate || 1,
        sales_person: uploadedBy,
        
        // Fields expected by payment form
        invoice_total: invoiceTotal,
        service_fee: serviceFeeAmount,
        service_fee_amount: serviceFeeAmount,
        total_before_tax: totalBeforeTax,
        tax_amount: gstAmount,
        tour_package: record.type_of_sale === 'Tour Package',
        type_of_sale: record.type_of_sale || 'Service Fee',
        
        // Payment status - always 'paid' for bulk uploads
        payment_status: 'paid',
        
        // Total amount field
        total_amount: finalAmount,
        amount: finalAmount.toString(), // Some views expect 'amount' as string
        
        // Currency fields
        currency: record.payment_currency || 'INR',
        
        // GST calculation object (expected by payment form)
        gst_calculation: {
          rate: effectiveGstRate,
          amount: gstAmount,
          cgst: cgst,
          sgst: sgst,
          igst: igst,
          total: gstAmount,
          applicable: gstApplicable,
          taxable_amount: taxableAmount,
          type_of_sale: record.type_of_sale || 'Service Fee',
          tcs_rate: tcsRate,
          tcs_amount: tcsAmount,
          tcs_applicable: tcsApplicable
        },
        
        // Approval tracking
        approval_status: 'pending',
        approved_by: null,
        approved_date: null
      };

      // Remove any undefined values to prevent Firestore errors
      const cleanedOrderData = Object.entries(orderData).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      // Debug log
      console.log('📝 Creating order with data:', {
        type_of_sale: cleanedOrderData.type_of_sale,
        payment_status: cleanedOrderData.payment_status,
        total_amount: cleanedOrderData.total_amount,
        currency: cleanedOrderData.currency,
        is_outside_india: cleanedOrderData.is_outside_india,
        event_location: cleanedOrderData.event_location
      });

      // Create the order
      const orderRef = await db.collection('crm_orders').add(cleanedOrderData);
      console.log(`✅ Order created: ${orderRef.id} for lead ${record.lead_id}`);

      // Generate invoice
      const invoiceData = {
        order_id: orderRef.id,
        order_number: orderData.order_number,
        invoice_number: `INV-${Date.now()}-${row}`,
        invoice_date: moment().tz('Asia/Kolkata').format('YYYY-MM-DD'),
        
        // Copy relevant fields from order
        client_name: orderData.client_name,
        client_email: orderData.client_email,
        client_phone: orderData.client_phone,
        gstin: orderData.gstin,
        legal_name: orderData.legal_name,
        registered_address: orderData.registered_address,
        
        // Amounts
        subtotal: invoiceTotal,
        service_fee: serviceFeeAmount,
        cgst: cgst,
        sgst: sgst,
        total: finalAmount,
        
        // Items
        items: orderData.items,
        
        // Metadata
        created_date: moment().tz('Asia/Kolkata').toISOString(),
        created_by: uploadedBy,
        status: 'generated'
      };

      // Remove undefined values from invoice data
      const cleanedInvoiceData = Object.entries(invoiceData).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const invoiceRef = await db.collection('crm_invoices').add(cleanedInvoiceData);
      console.log(`✅ Invoice created: ${invoiceRef.id}`);

      // Update lead status to payment_received for bulk uploads
      await leadRef.update({
        status: 'payment_received',
        'journey.payment_received': {
          timestamp: moment().tz('Asia/Kolkata').toISOString(),
          updated_by: uploadedBy,
          notes: `Payment received via bulk upload - Order ${orderData.order_number}`
        },
        updated_date: moment().tz('Asia/Kolkata').toISOString()
      });
      console.log(`✅ Lead ${record.lead_id} status updated to payment_received`);

      return {
        success: true,
        order_id: orderRef.id,
        order_number: orderData.order_number,
        invoice_id: invoiceRef.id,
        invoice_number: invoiceData.invoice_number,
        lead_id: record.lead_id,
        totalAmount: finalAmount,
        status: orderData.status
      };

    } catch (error) {
      console.error(`❌ Error processing order for lead ${record.lead_id}:`, error);
      return {
        success: false,
        errors: [error.message]
      };
    }
  }

  async validateBulkOrdersCsv(csvBuffer) {
    const validationResults = [];
    const summary = {
      total: 0,
      valid: 0,
      invalid: 0
    };

    try {
      const records = csv.parse(csvBuffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      summary.total = records.length;

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const row = i + 2;
        const errors = [];

        // Validate required fields
        if (!record.lead_id) errors.push('Lead ID is required');
        if (!record.client_name) errors.push('Client name is required');
        if (!record.event_name) errors.push('Event name is required');
        if (!record.rate) errors.push('Rate is required');
        if (!record.quantity) errors.push('Quantity is required');

        // Validate numeric fields
        if (record.rate && isNaN(parseFloat(record.rate))) {
          errors.push('Rate must be a valid number');
        }
        if (record.quantity && isNaN(parseInt(record.quantity))) {
          errors.push('Quantity must be a valid number');
        }
        if (record.service_fee_amount && isNaN(parseFloat(record.service_fee_amount))) {
          errors.push('Service fee must be a valid number');
        }
        if (record.advance_amount && isNaN(parseFloat(record.advance_amount))) {
          errors.push('Advance amount must be a valid number');
        }

        // Validate enums
        const validCustomerTypes = ['indian', 'foreign'];
        if (record.customer_type && !validCustomerTypes.includes(record.customer_type)) {
          errors.push(`Customer type must be one of: ${validCustomerTypes.join(', ')}`);
        }

        const validEventLocations = ['india', 'outside_india'];
        if (record.event_location && !validEventLocations.includes(record.event_location)) {
          errors.push(`Event location must be one of: ${validEventLocations.join(', ')}`);
        }

        const validPaymentMethods = ['Bank Transfer', 'UPI', 'Credit Card', 'Debit Card', 'Cash', 'Cheque', 'Online'];
        if (record.payment_method && !validPaymentMethods.includes(record.payment_method)) {
          errors.push(`Payment method must be one of: ${validPaymentMethods.join(', ')}`);
        }
        
        const validCategories = ['Corporate', 'Retail', 'corporate', 'retail'];
        if (record.category_of_sale && !validCategories.includes(record.category_of_sale)) {
          errors.push(`Category of sale must be one of: Corporate, Retail`);
        }

        const isValid = errors.length === 0;
        if (isValid) {
          summary.valid++;
        } else {
          summary.invalid++;
        }

        validationResults.push({
          row,
          lead_id: record.lead_id,
          isValid,
          errors,
          record
        });
      }

      return { summary, validationResults };
    } catch (error) {
      throw new Error(`CSV parsing error: ${error.message}`);
    }
  }
}

module.exports = new BulkOrderService();