#!/usr/bin/env node

/**
 * Check sales performance members persistence
 */

const { db } = require('./src/config/db');

async function checkSalesMembers() {
  console.log('🔍 Checking Sales Performance Members\n');
  
  // Check sales_performance_members collection
  console.log('📊 Sales Performance Members:');
  console.log('============================');
  const salesMembersSnapshot = await db.collection('sales_performance_members').get();
  
  if (salesMembersSnapshot.empty) {
    console.log('No sales performance members found');
  } else {
    salesMembersSnapshot.forEach(doc => {
      const member = doc.data();
      console.log(`- User ID: ${doc.id}`);
      console.log(`  Type: ${member.type}`);
      console.log(`  Added At: ${member.addedAt}`);
      console.log(`  Added By: ${member.addedBy}`);
      console.log('');
    });
  }
  
  // Check retail_tracker_members collection
  console.log('\n📊 Retail Tracker Members:');
  console.log('=========================');
  const retailMembersSnapshot = await db.collection('retail_tracker_members').get();
  
  if (retailMembersSnapshot.empty) {
    console.log('No retail tracker members found');
  } else {
    retailMembersSnapshot.forEach(doc => {
      const member = doc.data();
      console.log(`- User ID: ${doc.id}`);
      console.log(`  Type: ${member.type}`);
      console.log(`  Added At: ${member.addedAt}`);
      console.log(`  Added By: ${member.addedBy}`);
      console.log('');
    });
  }
  
  // Check all users with sales roles
  console.log('\n📊 All Users with Sales Roles:');
  console.log('==============================');
  const usersSnapshot = await db.collection('crm_users')
    .where('role', 'in', ['sales_person', 'sales_manager', 'sales_head'])
    .get();
  
  console.log(`Found ${usersSnapshot.size} users with sales roles`);
  usersSnapshot.forEach(doc => {
    const user = doc.data();
    console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
  });
}

checkSalesMembers()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });