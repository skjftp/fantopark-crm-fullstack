require('dotenv').config();
const { Firestore } = require('@google-cloud/firestore');
const moment = require('moment-timezone');

// Initialize Firestore the same way as the app
const db = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT
});

// Test inventory ID
const INVENTORY_ID = 'jx2GQ4Sf7pqGiJe1Nnwl';

// Helper function to measure execution time
async function measureTime(fn, label) {
  console.log(`\n${label}:`);
  console.log('='.repeat(50));
  const start = Date.now();
  const result = await fn();
  const end = Date.now();
  console.log(`Execution time: ${end - start}ms`);
  return { result, time: end - start };
}

// 1. Count allocations for the inventory
async function countAllocations() {
  const allocationsSnapshot = await db.collection('crm_allocations')
    .where('inventory_id', '==', INVENTORY_ID)
    .get();
  
  console.log(`Total allocations found: ${allocationsSnapshot.size}`);
  return allocationsSnapshot.size;
}

// 2. Current slow approach (N+1 problem)
async function currentSlowApproach() {
  // Get allocations
  const allocationsSnapshot = await db.collection('crm_allocations')
    .where('inventory_id', '==', INVENTORY_ID)
    .get();
  
  const allocations = [];
  let leadFetchCount = 0;
  
  // Process each allocation (N+1 queries)
  for (const doc of allocationsSnapshot.docs) {
    const allocation = { id: doc.id, ...doc.data() };
    
    // Fetch lead data individually (THIS IS THE PROBLEM!)
    if (allocation.lead_id) {
      leadFetchCount++;
      const leadDoc = await db.collection('crm_leads').doc(allocation.lead_id).get();
      if (leadDoc.exists) {
        allocation.lead = { id: leadDoc.id, ...leadDoc.data() };
      }
    }
    
    allocations.push(allocation);
  }
  
  console.log(`Total allocations processed: ${allocations.length}`);
  console.log(`Individual lead queries made: ${leadFetchCount}`);
  console.log(`Sample allocation with lead:`, JSON.stringify(allocations[0], null, 2).substring(0, 200) + '...');
  
  return allocations;
}

// 3. Optimized batch approach
async function optimizedBatchApproach() {
  // Get allocations
  const allocationsSnapshot = await db.collection('crm_allocations')
    .where('inventory_id', '==', INVENTORY_ID)
    .get();
  
  const allocations = [];
  const lead_ids = new Set();
  
  // First pass: collect all allocations and unique lead IDs
  allocationsSnapshot.forEach(doc => {
    const allocation = { id: doc.id, ...doc.data() };
    allocations.push(allocation);
    if (allocation.lead_id) {
      lead_ids.add(allocation.lead_id);
    }
  });
  
  console.log(`Total allocations: ${allocations.length}`);
  console.log(`Unique lead IDs to fetch: ${lead_ids.size}`);
  
  // Batch fetch leads (Firestore allows up to 10 items per 'in' query)
  const leadMap = new Map();
  const lead_idsArray = Array.from(lead_ids);
  const batchSize = 10;
  let batchCount = 0;
  
  for (let i = 0; i < lead_idsArray.length; i += batchSize) {
    batchCount++;
    const batch = lead_idsArray.slice(i, i + batchSize);
    const leadsSnapshot = await db.collection('crm_leads')
      .where(Firestore.FieldPath.documentId(), 'in', batch)
      .get();
    
    leadsSnapshot.forEach(doc => {
      leadMap.set(doc.id, { id: doc.id, ...doc.data() });
    });
  }
  
  console.log(`Batch queries made: ${batchCount}`);
  
  // Attach lead data to allocations
  allocations.forEach(allocation => {
    if (allocation.lead_id && leadMap.has(allocation.lead_id)) {
      allocation.lead = leadMap.get(allocation.lead_id);
    }
  });
  
  console.log(`Sample allocation with lead:`, JSON.stringify(allocations[0], null, 2).substring(0, 200) + '...');
  
  return allocations;
}

// 4. Alternative: Using Firestore document references
async function documentReferenceApproach() {
  // Get allocations
  const allocationsSnapshot = await db.collection('crm_allocations')
    .where('inventory_id', '==', INVENTORY_ID)
    .get();
  
  const allocations = [];
  const leadRefs = [];
  
  // Collect all allocations and lead references
  allocationsSnapshot.forEach(doc => {
    const allocation = { id: doc.id, ...doc.data() };
    allocations.push(allocation);
    if (allocation.lead_id) {
      leadRefs.push(db.collection('crm_leads').doc(allocation.lead_id));
    }
  });
  
  console.log(`Total allocations: ${allocations.length}`);
  console.log(`Lead references to fetch: ${leadRefs.length}`);
  
  // Batch get all documents
  const leadDocs = await db.getAll(...leadRefs);
  
  // Create lead map
  const leadMap = new Map();
  leadDocs.forEach(doc => {
    if (doc.exists) {
      leadMap.set(doc.id, { id: doc.id, ...doc.data() });
    }
  });
  
  console.log(`Leads fetched in single batch: ${leadMap.size}`);
  
  // Attach lead data to allocations
  allocations.forEach(allocation => {
    if (allocation.lead_id && leadMap.has(allocation.lead_id)) {
      allocation.lead = leadMap.get(allocation.lead_id);
    }
  });
  
  console.log(`Sample allocation with lead:`, JSON.stringify(allocations[0], null, 2).substring(0, 200) + '...');
  
  return allocations;
}

// Main execution
async function main() {
  try {
    console.log('ALLOCATIONS PERFORMANCE ANALYSIS');
    console.log('================================');
    console.log(`Analyzing inventory: ${INVENTORY_ID}`);
    console.log(`Timestamp: ${moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss')} IST`);
    
    // Count allocations
    await measureTime(countAllocations, '1. Counting Allocations');
    
    // Run performance tests
    const slowResult = await measureTime(currentSlowApproach, '2. Current Slow Approach (N+1 Problem)');
    const batchResult = await measureTime(optimizedBatchApproach, '3. Optimized Batch Approach');
    const refResult = await measureTime(documentReferenceApproach, '4. Document Reference Approach (Best)');
    
    // Performance comparison
    console.log('\nPERFORMANCE COMPARISON:');
    console.log('='.repeat(50));
    console.log(`Current approach: ${slowResult.time}ms`);
    console.log(`Batch approach: ${batchResult.time}ms (${Math.round(slowResult.time / batchResult.time)}x faster)`);
    console.log(`Reference approach: ${refResult.time}ms (${Math.round(slowResult.time / refResult.time)}x faster)`);
    
    // Memory usage estimate
    console.log('\nMEMORY USAGE ESTIMATE:');
    console.log('='.repeat(50));
    const allocationSize = JSON.stringify(slowResult.result).length;
    console.log(`Total data size: ${(allocationSize / 1024).toFixed(2)} KB`);
    console.log(`Average per allocation: ${(allocationSize / slowResult.result.length / 1024).toFixed(2)} KB`);
    
    // Recommendations
    console.log('\nRECOMMENDATIONS:');
    console.log('='.repeat(50));
    console.log('1. Use the Document Reference approach (db.getAll) for best performance');
    console.log('2. Implement pagination for large datasets (> 1000 allocations)');
    console.log('3. Consider caching lead data if it doesn\'t change frequently');
    console.log('4. Add indexes on frequently queried fields');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the analysis
main();