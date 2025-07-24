const admin = require('../config/firebase');
const csv = require('csv-parser');
const { Readable } = require('stream');
const moment = require('moment-timezone');

class BulkPaymentService {
  constructor() {
    this.db = admin.firestore();
    this.batch = null;
    this.results = {
      successful: [],
      failed: [],
      summary: {
        total: 0,
        success: 0,
        failed: 0,
        totalAmount: 0,
        ordersCreated: 0
      }
    };
  }

  // Parse CSV buffer
  async parseCSV(buffer) {
    return new Promise((resolve, reject) => {
      const rows = [];
      const stream = Readable.from(buffer);
      
      stream
        .pipe(csv())
        .on('data', (row) => {
          // Clean up the data
          Object.keys(row).forEach(key => {
            row[key] = row[key].trim();
          });
          rows.push(row);
        })
        .on('end', () => resolve(rows))
        .on('error', reject);
    });
  }

  // Validate required fields
  validateRow(row, index) {
    const errors = [];
    
    // Required fields
    if (!row.lead_id) errors.push('Lead ID is required');
    if (!row.payment_amount || isNaN(row.payment_amount)) errors.push('Valid payment amount is required');
    if (!row.payment_date) errors.push('Payment date is required');
    if (!row.payment_mode) errors.push('Payment mode is required');
    
    // If invoice numbers are provided, amounts should match
    if (row.invoice_numbers && row.invoice_amounts) {
      const invoiceCount = row.invoice_numbers.split(',').length;
      const amountCount = row.invoice_amounts.split(',').length;
      if (invoiceCount !== amountCount) {
        errors.push(`Invoice count (${invoiceCount}) doesn't match amount count (${amountCount})`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      rowNumber: index + 2 // +2 because Excel rows start at 1 and we skip header
    };
  }

  // Process a single payment row
  async processPaymentRow(row, uploadedBy) {
    try {
      // 1. Verify lead exists
      const leadRef = this.db.collection('crm_leads').doc(row.lead_id);
      const leadDoc = await leadRef.get();
      
      if (!leadDoc.exists) {
        throw new Error(`Lead not found with ID: ${row.lead_id}`);
      }
      
      const leadData = leadDoc.data();
      
      // 2. Parse payment data
      const paymentAmount = parseFloat(row.payment_amount);
      const totalAmount = row.total_amount ? parseFloat(row.total_amount) : paymentAmount;
      const taxes = row.taxes ? row.taxes.split(',').map(t => parseFloat(t.trim())) : [];
      const discount = row.discount ? parseFloat(row.discount) : 0;
      const processingFee = row.processing_fee ? parseFloat(row.processing_fee) : 0;
      
      // 3. Create payment record
      const paymentRecord = {
        lead_id: row.lead_id,
        lead_name: row.lead_name || leadData.name,
        lead_email: row.lead_email || leadData.email,
        lead_phone: row.lead_phone || leadData.phone,
        event_name: row.event_name || leadData.event_name,
        event_date: row.event_date || leadData.event_date,
        
        payment_date: moment(row.payment_date).tz('Asia/Kolkata').format(),
        payment_amount: paymentAmount,
        payment_mode: row.payment_mode,
        bank_name: row.bank_name || '',
        transaction_id: row.transaction_id || '',
        cheque_number: row.cheque_number || '',
        
        invoice_numbers: row.invoice_numbers ? row.invoice_numbers.split(',').map(i => i.trim()) : [],
        invoice_amounts: row.invoice_amounts ? row.invoice_amounts.split(',').map(a => parseFloat(a.trim())) : [],
        taxes: taxes,
        total_tax: taxes.reduce((sum, tax) => sum + tax, 0),
        discount: discount,
        processing_fee: processingFee,
        total_amount: totalAmount,
        
        payment_status: row.payment_status || 'Full Payment',
        payment_proof_url: row.payment_proof_url || '',
        collected_by: row.collected_by || uploadedBy,
        branch: row.branch || '',
        notes: row.notes || '',
        
        uploaded_via: 'bulk_upload',
        uploaded_by: uploadedBy,
        uploaded_at: admin.firestore.FieldValue.serverTimestamp(),
        created_at: moment().tz('Asia/Kolkata').format()
      };
      
      // 4. Check if order already exists for this lead
      const ordersSnapshot = await this.db.collection('crm_orders')
        .where('lead_id', '==', row.lead_id)
        .limit(1)
        .get();
      
      let orderId;
      
      if (ordersSnapshot.empty) {
        // 5. Create new order
        const orderData = {
          lead_id: row.lead_id,
          customer_name: row.lead_name || leadData.name,
          customer_email: row.lead_email || leadData.email,
          customer_phone: row.lead_phone || leadData.phone,
          
          event_name: row.event_name || leadData.event_name,
          event_date: row.event_date || leadData.event_date,
          category: leadData.category || '',
          quantity: leadData.quantity || 1,
          
          payment_status: 'paid',
          lead_status: 'payment_received',
          
          base_amount: paymentAmount,
          tax_amount: paymentRecord.total_tax,
          discount_amount: discount,
          processing_fee: processingFee,
          final_amount: totalAmount,
          final_amount_inr: totalAmount, // Assuming INR, adjust if needed
          
          advance_amount: totalAmount,
          advance_amount_inr: totalAmount,
          balance_amount: 0,
          balance_amount_inr: 0,
          
          currency: leadData.currency || 'INR',
          exchange_rate: leadData.exchange_rate || 1,
          
          payment_terms: 'immediate',
          payment_details: paymentRecord,
          
          invoice_numbers: paymentRecord.invoice_numbers,
          
          created_by: uploadedBy,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        };
        
        const orderRef = await this.db.collection('crm_orders').add(orderData);
        orderId = orderRef.id;
        this.results.summary.ordersCreated++;
        
      } else {
        // Update existing order
        orderId = ordersSnapshot.docs[0].id;
        await this.db.collection('crm_orders').doc(orderId).update({
          payment_status: 'paid',
          lead_status: 'payment_received',
          payment_details: paymentRecord,
          advance_amount: paymentAmount,
          advance_amount_inr: paymentAmount,
          balance_amount: 0,
          balance_amount_inr: 0,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_by: uploadedBy
        });
      }
      
      // 6. Store payment record
      const paymentRef = await this.db.collection('crm_payments').add({
        ...paymentRecord,
        order_id: orderId
      });
      
      // 7. Update lead status
      await leadRef.update({
        status: 'payment_received',
        payment_status: 'paid',
        payment_date: paymentRecord.payment_date,
        payment_amount: paymentAmount,
        order_id: orderId,
        payment_id: paymentRef.id,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_by: uploadedBy
      });
      
      // 8. Create activity log
      await this.db.collection('crm_activity_logs').add({
        type: 'payment_received',
        lead_id: row.lead_id,
        description: `Payment of ₹${paymentAmount.toLocaleString('en-IN')} received via ${row.payment_mode}`,
        metadata: {
          payment_id: paymentRef.id,
          order_id: orderId,
          amount: paymentAmount,
          mode: row.payment_mode,
          transaction_id: row.transaction_id
        },
        created_by: uploadedBy,
        created_date: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return {
        success: true,
        lead_id: row.lead_id,
        payment_id: paymentRef.id,
        order_id: orderId,
        amount: paymentAmount
      };
      
    } catch (error) {
      console.error(`Error processing payment for lead ${row.lead_id}:`, error);
      throw error;
    }
  }

  // Main processing function
  async processBulkPayments(fileBuffer, uploadedBy) {
    try {
      // Reset results
      this.results = {
        successful: [],
        failed: [],
        summary: {
          total: 0,
          success: 0,
          failed: 0,
          totalAmount: 0,
          ordersCreated: 0
        }
      };
      
      // Parse CSV
      const rows = await this.parseCSV(fileBuffer);
      this.results.summary.total = rows.length;
      
      if (rows.length === 0) {
        throw new Error('CSV file is empty');
      }
      
      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        // Validate row
        const validation = this.validateRow(row, i);
        if (!validation.isValid) {
          this.results.failed.push({
            row: validation.rowNumber,
            lead_id: row.lead_id,
            errors: validation.errors
          });
          this.results.summary.failed++;
          continue;
        }
        
        try {
          // Process payment
          const result = await this.processPaymentRow(row, uploadedBy);
          
          this.results.successful.push({
            row: validation.rowNumber,
            ...result
          });
          
          this.results.summary.success++;
          this.results.summary.totalAmount += result.amount;
          
        } catch (error) {
          this.results.failed.push({
            row: validation.rowNumber,
            lead_id: row.lead_id,
            errors: [error.message]
          });
          this.results.summary.failed++;
        }
      }
      
      return this.results;
      
    } catch (error) {
      console.error('Bulk payment processing error:', error);
      throw error;
    }
  }
}

module.exports = new BulkPaymentService();