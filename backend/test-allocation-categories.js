// Test script to verify category allocation fixes
const axios = require('axios');

async function testCategoryAllocation() {
  const API_URL = 'http://localhost:5001/api';
  const AUTH_TOKEN = 'YOUR_AUTH_TOKEN'; // Replace with actual token
  
  // Test data
  const testData = {
    inventoryId: 'YOUR_INVENTORY_ID', // Replace with actual inventory ID
    leadId: 'YOUR_LEAD_ID', // Replace with actual lead ID
    allocations: [
      {
        category_name: 'VIP',
        category_section: 'North Stand',
        tickets_allocated: 2
      },
      {
        category_name: 'VIP',
        category_section: 'South Stand',
        tickets_allocated: 1
      },
      {
        category_name: 'Premium',
        category_section: '',
        tickets_allocated: 3
      }
    ]
  };
  
  console.log('Testing category-based allocation...\n');
  
  for (const allocation of testData.allocations) {
    try {
      console.log(`Allocating ${allocation.tickets_allocated} tickets for ${allocation.category_name} - ${allocation.category_section || 'General'}`);
      
      const response = await axios.post(
        `${API_URL}/inventory/${testData.inventoryId}/allocate`,
        {
          lead_id: testData.leadId,
          tickets_allocated: allocation.tickets_allocated,
          category_name: allocation.category_name,
          category_section: allocation.category_section,
          allocation_date: new Date().toISOString().split('T')[0],
          notes: 'Test allocation with category section'
        },
        {
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Success:', response.data.message);
      console.log('   Remaining tickets:', response.data.remaining_tickets);
      console.log('   Category:', response.data.category);
      console.log('');
      
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.error || error.message);
      console.log('');
    }
  }
}

// Instructions for use:
console.log('=== Category Allocation Test Script ===');
console.log('To use this script:');
console.log('1. Replace YOUR_AUTH_TOKEN with a valid auth token');
console.log('2. Replace YOUR_INVENTORY_ID with an inventory ID that has categories');
console.log('3. Replace YOUR_LEAD_ID with a valid lead ID (status: converted/payment_received)');
console.log('4. Run: node test-allocation-categories.js');
console.log('');

// Uncomment to run:
// testCategoryAllocation();