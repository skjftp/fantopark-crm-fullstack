#!/usr/bin/env node

/**
 * Migration script to fix all timestamp issues found in the audit
 * This will:
 * 1. Convert Firestore timestamp objects to ISO strings
 * 2. Convert plain date strings (YYYY-MM-DD) to proper timestamps
 * 3. Fix IST times stored as UTC
 * 4. Set appropriate defaults for null/empty timestamps
 */

const { db, collections } = require('./src/config/db');
const { convertToIST, getISTDateString } = require('./src/utils/dateHelpers');

// Define fixes for each collection
const COLLECTION_FIXES = [
  {
    name: 'crm_leads',
    fixes: {
      date_of_enquiry: 'convert_date_string',
      created_date: 'convert_firestore_timestamp',
      updated_date: 'set_current_if_null',
      assignment_date: 'skip_if_null', // Only set when actually assigned
      client_last_activity: 'set_current_if_null'
    }
  },
  {
    name: 'crm_inventory',
    fixes: {
      created_date: 'convert_firestore_timestamp',
      updated_date: 'set_current_if_null',
      event_date: 'convert_date_string',
      payment_due_date: 'skip_if_null' // Optional field
    }
  },
  {
    name: 'crm_orders',
    fixes: {
      created_date: 'fix_ist_as_utc',
      updated_date: 'fix_ist_as_utc',
      payment_date: 'convert_date_string'
    }
  },
  {
    name: 'crm_payables',
    fixes: {
      created_date: 'fix_ist_as_utc',
      updated_date: 'fix_ist_as_utc'
    }
  },
  {
    name: 'crm_receivables',
    fixes: {
      created_date: 'fix_ist_as_utc',
      due_date: 'convert_date_string'
    }
  },
  {
    name: 'crm_deliveries',
    fixes: {
      created_date: 'fix_ist_as_utc'
    }
  },
  {
    name: 'crm_reminders',
    fixes: {
      completed_date: 'skip_if_null' // Only set when completed
    }
  },
  {
    name: 'crm_activity_logs',
    fixes: {
      created_date: 'convert_firestore_timestamp'
    }
  },
  {
    name: 'crm_communications',
    fixes: {
      created_date: 'fix_ist_as_utc',
      updated_date: 'fix_ist_as_utc'
    }
  }
];

/**
 * Apply fix based on type
 */
function applyFix(value, fixType, fieldName, docData) {
  switch (fixType) {
    case 'convert_firestore_timestamp':
      if (value && (value._seconds !== undefined || value.seconds !== undefined)) {
        const seconds = value._seconds || value.seconds;
        const date = new Date(seconds * 1000);
        return date.toISOString();
      }
      return value;
    
    case 'convert_date_string':
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        // For date_of_enquiry, use noon IST
        return convertToIST(value);
      }
      return value;
    
    case 'fix_ist_as_utc':
      if (typeof value === 'string' && value.includes('T')) {
        const date = new Date(value);
        const hours = date.getUTCHours();
        
        // Check if this looks like IST time stored as UTC
        if ((hours >= 18 && hours <= 23) || (hours >= 0 && hours <= 3)) {
          // This is likely IST business hours stored as UTC
          // We need to subtract 5.5 hours to get actual UTC
          const correctedDate = new Date(date.getTime() - (5.5 * 60 * 60 * 1000));
          
          // Log for verification
          console.log(`    Fixing IST as UTC: ${value} => ${correctedDate.toISOString()}`);
          return correctedDate.toISOString();
        }
      }
      return value;
    
    case 'set_current_if_null':
      if (!value || value === '') {
        // Use created_date if available, otherwise current time
        if (fieldName === 'updated_date' && docData.created_date) {
          return docData.created_date;
        }
        return new Date().toISOString();
      }
      return value;
    
    case 'skip_if_null':
      // Don't set a value if it's null - these are optional fields
      return value;
    
    default:
      return value;
  }
}

/**
 * Fix a single collection
 */
async function fixCollection(collectionConfig) {
  console.log(`\n📊 Fixing ${collectionConfig.name}...`);
  console.log('='.repeat(60));
  
  const stats = {
    total: 0,
    fixed: 0,
    errors: 0,
    skipped: 0
  };
  
  try {
    const snapshot = await db.collection(collectionConfig.name).get();
    stats.total = snapshot.size;
    
    console.log(`Total documents: ${snapshot.size}`);
    
    if (snapshot.empty) {
      console.log('No documents found.');
      return stats;
    }
    
    // Process in batches
    const batch = db.batch();
    let batchCount = 0;
    const BATCH_SIZE = 500;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const updates = {};
      let hasUpdates = false;
      
      // Check each field that needs fixing
      for (const [field, fixType] of Object.entries(collectionConfig.fixes)) {
        if (field in data) {
          const originalValue = data[field];
          const fixedValue = applyFix(originalValue, fixType, field, data);
          
          // Only update if value actually changed
          if (fixedValue !== originalValue && fixedValue !== undefined) {
            updates[field] = fixedValue;
            hasUpdates = true;
          }
        }
      }
      
      // If we have updates, add to batch
      if (hasUpdates) {
        batch.update(doc.ref, updates);
        batchCount++;
        stats.fixed++;
        
        // Commit batch if it's full
        if (batchCount >= BATCH_SIZE) {
          console.log(`  Committing batch of ${batchCount} updates...`);
          await batch.commit();
          batchCount = 0;
        }
      } else {
        stats.skipped++;
      }
    }
    
    // Commit remaining updates
    if (batchCount > 0) {
      console.log(`  Committing final batch of ${batchCount} updates...`);
      await batch.commit();
    }
    
    console.log(`✅ Fixed ${stats.fixed} documents, skipped ${stats.skipped}`);
    
  } catch (error) {
    console.error(`❌ Error fixing ${collectionConfig.name}:`, error.message);
    stats.errors++;
  }
  
  return stats;
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('🔧 Starting Timestamp Fix Migration...');
  console.log('This will fix all timestamp issues found in the audit.\n');
  
  const overallStats = {
    collections: 0,
    totalDocs: 0,
    totalFixed: 0,
    totalErrors: 0
  };
  
  // Add a safety check
  console.log('⚠️  WARNING: This will modify production data!');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('Starting migration...\n');
  
  for (const collection of COLLECTION_FIXES) {
    const stats = await fixCollection(collection);
    
    overallStats.collections++;
    overallStats.totalDocs += stats.total;
    overallStats.totalFixed += stats.fixed;
    overallStats.totalErrors += stats.errors;
  }
  
  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📋 MIGRATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Collections processed: ${overallStats.collections}`);
  console.log(`Total documents: ${overallStats.totalDocs}`);
  console.log(`Documents fixed: ${overallStats.totalFixed}`);
  console.log(`Errors: ${overallStats.totalErrors}`);
  console.log('\n✅ Migration complete!');
  
  // Save migration log
  const migrationLog = {
    runDate: new Date().toISOString(),
    stats: overallStats,
    collectionDetails: COLLECTION_FIXES
  };
  
  const fs = require('fs');
  const logFileName = `timestamp-migration-${Date.now()}.json`;
  fs.writeFileSync(logFileName, JSON.stringify(migrationLog, null, 2));
  console.log(`\n📄 Migration log saved to: ${logFileName}`);
}

// Add command line argument for dry run
const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
  console.log('🔍 DRY RUN MODE - No changes will be made\n');
  // You could implement a dry run mode that shows what would be changed
  console.log('Dry run not implemented. Run without --dry-run to apply fixes.');
  process.exit(0);
}

// Run the migration
runMigration()
  .then(() => {
    console.log('\n👋 Exiting...');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });