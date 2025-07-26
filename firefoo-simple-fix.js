/**
 * Simplified Firefoo Script: Fix Allocation Buying Prices
 * 
 * Instructions:
 * 1. First, run this to check what methods are available:
 */

// Step 1: Check available methods
console.log('🔍 Checking available methods...');
console.log('db:', typeof db);
console.log('db methods:', Object.getOwnPropertyNames(db.__proto__));

// Step 2: Check collection methods
if (db.collection) {
  const allocationsRef = db.collection('crm_allocations');
  console.log('allocationsRef:', typeof allocationsRef);
  console.log('allocationsRef methods:', Object.getOwnPropertyNames(allocationsRef.__proto__));
}

/**
 * Alternative approach: Manual batch updates
 * Run this step by step after checking the methods above
 */