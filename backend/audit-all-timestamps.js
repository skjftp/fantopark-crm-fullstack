#!/usr/bin/env node

/**
 * Comprehensive audit script to check all timestamp fields across all collections
 * Identifies records that don't follow proper UTC ISO format or have date inconsistencies
 */

const { db, collections } = require('./src/config/db');
const { getISTDateString, displayInIST } = require('./src/utils/dateHelpers');

// Collections to audit
const COLLECTIONS_TO_AUDIT = [
  {
    name: 'crm_leads',
    timestampFields: ['date_of_enquiry', 'created_date', 'updated_date', 'assignment_date', 'client_last_activity', 'import_date'],
    displayName: 'Leads'
  },
  {
    name: 'crm_inventory',
    timestampFields: ['created_date', 'updated_date', 'event_date', 'payment_due_date'],
    displayName: 'Inventory'
  },
  {
    name: 'crm_orders',
    timestampFields: ['created_date', 'updated_date', 'delivery_date', 'payment_date'],
    displayName: 'Orders'
  },
  {
    name: 'crm_payables',
    timestampFields: ['created_date', 'updated_date', 'due_date', 'payment_date'],
    displayName: 'Payables'
  },
  {
    name: 'crm_receivables',
    timestampFields: ['created_date', 'updated_date', 'due_date', 'received_date'],
    displayName: 'Receivables'
  },
  {
    name: 'crm_deliveries',
    timestampFields: ['created_date', 'updated_date', 'scheduled_date', 'delivered_date'],
    displayName: 'Deliveries'
  },
  {
    name: 'crm_clients',
    timestampFields: ['created_date', 'updated_date', 'last_activity_date'],
    displayName: 'Clients'
  },
  {
    name: 'crm_reminders',
    timestampFields: ['created_date', 'reminder_date', 'completed_date'],
    displayName: 'Reminders'
  },
  {
    name: 'crm_activity_logs',
    timestampFields: ['created_date', 'timestamp'],
    displayName: 'Activity Logs'
  },
  {
    name: 'crm_communications',
    timestampFields: ['created_date', 'updated_date', 'follow_up_date'],
    displayName: 'Communications'
  }
];

// Patterns to identify problematic timestamps
const TIMESTAMP_ISSUES = {
  INVALID_FORMAT: 'Invalid Format',
  MISSING_TIMEZONE: 'Missing Timezone Info',
  STRING_DATE: 'Plain String Date (YYYY-MM-DD)',
  FIRESTORE_TIMESTAMP: 'Firestore Timestamp Object',
  FUTURE_DATE: 'Future Date',
  VERY_OLD_DATE: 'Very Old Date (before 2020)',
  IST_STORED_AS_UTC: 'IST Time Stored as UTC',
  NULL_OR_EMPTY: 'Null or Empty'
};

/**
 * Check if a timestamp is valid and properly formatted
 */
function analyzeTimestamp(value, fieldName) {
  const issues = [];
  
  // Check for null or empty
  if (!value) {
    return { valid: false, issues: [TIMESTAMP_ISSUES.NULL_OR_EMPTY] };
  }
  
  // Check for Firestore Timestamp object
  if (value._seconds !== undefined || value.seconds !== undefined) {
    return { valid: false, issues: [TIMESTAMP_ISSUES.FIRESTORE_TIMESTAMP], firestoreTimestamp: true };
  }
  
  // Check if it's a string
  if (typeof value !== 'string') {
    return { valid: false, issues: [TIMESTAMP_ISSUES.INVALID_FORMAT] };
  }
  
  // Check for plain date string (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { valid: false, issues: [TIMESTAMP_ISSUES.STRING_DATE] };
  }
  
  // Try to parse as date
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return { valid: false, issues: [TIMESTAMP_ISSUES.INVALID_FORMAT] };
  }
  
  // Check if it's a proper ISO string with timezone
  if (!value.includes('T') || (!value.endsWith('Z') && !value.includes('+') && !value.includes('-'))) {
    issues.push(TIMESTAMP_ISSUES.MISSING_TIMEZONE);
  }
  
  // Check for future dates (more than 1 day in future)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date > tomorrow) {
    issues.push(TIMESTAMP_ISSUES.FUTURE_DATE);
  }
  
  // Check for very old dates
  const oldDate = new Date('2020-01-01');
  if (date < oldDate && fieldName !== 'event_date') { // event_date can be in the past
    issues.push(TIMESTAMP_ISSUES.VERY_OLD_DATE);
  }
  
  // Check for potential IST stored as UTC issue
  // If hour is between 18:30 and 23:59, it might be IST stored as UTC
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  if ((hours === 18 && minutes >= 30) || (hours > 18 && hours < 24)) {
    // Check if this could be IST time stored as UTC
    const potentialIssue = checkPotentialISTAsUTC(value);
    if (potentialIssue) {
      issues.push(TIMESTAMP_ISSUES.IST_STORED_AS_UTC);
    }
  }
  
  return { valid: issues.length === 0, issues };
}

/**
 * Check if a timestamp might be IST time stored as UTC
 */
function checkPotentialISTAsUTC(timestamp) {
  // This is a heuristic check
  // If the time component suggests it could be IST business hours stored as UTC
  const date = new Date(timestamp);
  const hours = date.getUTCHours();
  
  // IST business hours (9 AM - 6 PM) would appear as 3:30 AM - 12:30 PM UTC
  // But if we see 9:00 - 18:00 in UTC, it might be IST stored incorrectly
  if (hours >= 9 && hours <= 18) {
    return false; // Likely correct UTC
  }
  
  return true; // Potentially IST stored as UTC
}

/**
 * Audit a single collection
 */
async function auditCollection(collectionInfo) {
  console.log(`\n📊 Auditing ${collectionInfo.displayName} (${collectionInfo.name})...`);
  console.log('='.repeat(60));
  
  const issues = {
    total: 0,
    withIssues: 0,
    byField: {},
    byIssueType: {},
    samples: []
  };
  
  // Initialize counters
  collectionInfo.timestampFields.forEach(field => {
    issues.byField[field] = 0;
  });
  
  Object.values(TIMESTAMP_ISSUES).forEach(issueType => {
    issues.byIssueType[issueType] = 0;
  });
  
  try {
    const snapshot = await db.collection(collectionInfo.name).get();
    issues.total = snapshot.size;
    
    console.log(`Total documents: ${snapshot.size}`);
    
    if (snapshot.empty) {
      console.log('No documents found in this collection.');
      return issues;
    }
    
    // Process each document
    snapshot.forEach(doc => {
      const data = doc.data();
      let docHasIssues = false;
      const docIssues = {};
      
      // Check each timestamp field
      collectionInfo.timestampFields.forEach(field => {
        if (field in data) {
          const analysis = analyzeTimestamp(data[field], field);
          
          if (!analysis.valid) {
            docHasIssues = true;
            docIssues[field] = analysis.issues;
            issues.byField[field]++;
            
            // Count by issue type
            analysis.issues.forEach(issueType => {
              issues.byIssueType[issueType]++;
            });
          }
        }
      });
      
      if (docHasIssues) {
        issues.withIssues++;
        
        // Collect samples (limit to 5)
        if (issues.samples.length < 5) {
          const sample = {
            id: doc.id,
            fields: {}
          };
          
          // Add relevant fields to sample
          collectionInfo.timestampFields.forEach(field => {
            if (field in data) {
              sample.fields[field] = {
                value: data[field],
                issues: docIssues[field] || []
              };
              
              // Convert Firestore timestamp if needed
              if (data[field] && data[field]._seconds) {
                const date = new Date(data[field]._seconds * 1000);
                sample.fields[field].converted = date.toISOString();
                sample.fields[field].istDisplay = displayInIST(date);
              }
            }
          });
          
          // Add identifying info
          if (data.name) sample.name = data.name;
          if (data.email) sample.email = data.email;
          if (data.event_name) sample.event_name = data.event_name;
          
          issues.samples.push(sample);
        }
      }
    });
    
  } catch (error) {
    console.error(`❌ Error auditing ${collectionInfo.name}:`, error.message);
    issues.error = error.message;
  }
  
  return issues;
}

/**
 * Generate summary report
 */
function generateReport(auditResults) {
  console.log('\n\n' + '='.repeat(80));
  console.log('📋 TIMESTAMP AUDIT SUMMARY REPORT');
  console.log('='.repeat(80));
  console.log(`Generated at: ${displayInIST(new Date())}`);
  console.log('\n');
  
  let totalDocs = 0;
  let totalIssues = 0;
  
  // Summary by collection
  console.log('📊 Summary by Collection:');
  console.log('-'.repeat(60));
  
  Object.entries(auditResults).forEach(([collection, data]) => {
    if (data.total > 0) {
      const percentage = ((data.withIssues / data.total) * 100).toFixed(1);
      console.log(`${collection.padEnd(20)} | Total: ${String(data.total).padStart(6)} | Issues: ${String(data.withIssues).padStart(6)} (${percentage}%)`);
      totalDocs += data.total;
      totalIssues += data.withIssues;
    }
  });
  
  console.log('-'.repeat(60));
  console.log(`${'TOTAL'.padEnd(20)} | Total: ${String(totalDocs).padStart(6)} | Issues: ${String(totalIssues).padStart(6)} (${((totalIssues / totalDocs) * 100).toFixed(1)}%)`);
  
  // Summary by issue type
  console.log('\n\n📊 Summary by Issue Type:');
  console.log('-'.repeat(60));
  
  const allIssueTypes = {};
  Object.values(auditResults).forEach(data => {
    Object.entries(data.byIssueType || {}).forEach(([issueType, count]) => {
      allIssueTypes[issueType] = (allIssueTypes[issueType] || 0) + count;
    });
  });
  
  Object.entries(allIssueTypes)
    .sort((a, b) => b[1] - a[1])
    .forEach(([issueType, count]) => {
      console.log(`${issueType.padEnd(40)} | ${String(count).padStart(6)}`);
    });
  
  // Detailed findings by collection
  console.log('\n\n📋 Detailed Findings:');
  console.log('='.repeat(80));
  
  Object.entries(auditResults).forEach(([collection, data]) => {
    if (data.withIssues > 0) {
      console.log(`\n\n🗂️  ${collection}`);
      console.log('-'.repeat(40));
      
      // Issues by field
      console.log('\nFields with issues:');
      Object.entries(data.byField).forEach(([field, count]) => {
        if (count > 0) {
          console.log(`  - ${field}: ${count} documents`);
        }
      });
      
      // Sample documents
      if (data.samples && data.samples.length > 0) {
        console.log('\nSample documents with issues:');
        data.samples.forEach((sample, idx) => {
          console.log(`\n  ${idx + 1}. Document ID: ${sample.id}`);
          if (sample.name) console.log(`     Name: ${sample.name}`);
          if (sample.email) console.log(`     Email: ${sample.email}`);
          if (sample.event_name) console.log(`     Event: ${sample.event_name}`);
          
          Object.entries(sample.fields).forEach(([field, fieldData]) => {
            if (fieldData.issues && fieldData.issues.length > 0) {
              console.log(`     ${field}:`);
              console.log(`       Current: ${JSON.stringify(fieldData.value)}`);
              if (fieldData.converted) {
                console.log(`       Converted: ${fieldData.converted}`);
                console.log(`       IST: ${fieldData.istDisplay}`);
              }
              console.log(`       Issues: ${fieldData.issues.join(', ')}`);
            }
          });
        });
      }
    }
  });
  
  // Recommendations
  console.log('\n\n💡 Recommendations:');
  console.log('='.repeat(80));
  
  if (allIssueTypes[TIMESTAMP_ISSUES.FIRESTORE_TIMESTAMP] > 0) {
    console.log('\n1. Firestore Timestamp Objects:');
    console.log('   Run a migration script to convert all Firestore timestamp objects to ISO strings.');
  }
  
  if (allIssueTypes[TIMESTAMP_ISSUES.STRING_DATE] > 0) {
    console.log('\n2. Plain Date Strings (YYYY-MM-DD):');
    console.log('   Convert these to proper ISO timestamps with time component.');
  }
  
  if (allIssueTypes[TIMESTAMP_ISSUES.IST_STORED_AS_UTC] > 0) {
    console.log('\n3. Potential IST as UTC:');
    console.log('   Review timestamps that might be IST times stored as UTC.');
    console.log('   These need careful analysis to determine if correction is needed.');
  }
  
  if (allIssueTypes[TIMESTAMP_ISSUES.NULL_OR_EMPTY] > 0) {
    console.log('\n4. Missing Timestamps:');
    console.log('   Set appropriate default timestamps for documents with missing values.');
  }
}

/**
 * Main audit function
 */
async function runAudit() {
  console.log('🔍 Starting Comprehensive Timestamp Audit...');
  console.log('This will check all timestamp fields across all collections.\n');
  
  const auditResults = {};
  
  for (const collection of COLLECTIONS_TO_AUDIT) {
    const result = await auditCollection(collection);
    auditResults[collection.displayName] = result;
  }
  
  generateReport(auditResults);
  
  console.log('\n\n✅ Audit complete!');
  
  // Create a summary file
  const summaryData = {
    auditDate: new Date().toISOString(),
    auditDateIST: displayInIST(new Date()),
    results: auditResults
  };
  
  const fs = require('fs');
  fs.writeFileSync('timestamp-audit-results.json', JSON.stringify(summaryData, null, 2));
  console.log('\n📄 Detailed results saved to: timestamp-audit-results.json');
}

// Run the audit
runAudit()
  .then(() => {
    console.log('\n👋 Exiting...');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });