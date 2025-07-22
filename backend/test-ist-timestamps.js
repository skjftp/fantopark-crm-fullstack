#!/usr/bin/env node

/**
 * Test script to verify IST timestamp implementation across all lead creation methods
 */

const { convertToIST, formatDateForQuery, getISTDateString, isOnISTDate } = require('./src/utils/dateHelpers');

console.log('🧪 Testing IST Timestamp Implementation');
console.log('=====================================\n');

// Test 1: convertToIST function
console.log('1️⃣ Testing convertToIST function:');
console.log('-----------------------------------');

const testDates = [
  new Date(),
  '2025-07-21',
  '2025-07-21T18:30:00Z',
  '2025-07-21T18:30:00+0000',
  'Mon Jul 21 2025 18:30:00 GMT+0000',
  null,
  undefined,
  ''
];

testDates.forEach(date => {
  try {
    const istTime = convertToIST(date);
    console.log(`Input: ${date || 'null/undefined'}`);
    console.log(`IST:   ${istTime}`);
    console.log(`Date:  ${getISTDateString(istTime)}`);
    console.log('');
  } catch (error) {
    console.error(`❌ Error with ${date}: ${error.message}`);
  }
});

// Test 2: formatDateForQuery function
console.log('\n2️⃣ Testing formatDateForQuery function:');
console.log('----------------------------------------');

const queryDates = [
  { date: '2025-07-21', type: 'start' },
  { date: '2025-07-21', type: 'end' },
  { date: '2025-07-21T00:00:00Z', type: 'start' },
  { date: '2025-07-21T23:59:59Z', type: 'end' }
];

queryDates.forEach(({ date, type }) => {
  const formatted = formatDateForQuery(date, type);
  console.log(`Input: ${date} (${type})`);
  console.log(`Query: ${formatted}`);
  console.log('');
});

// Test 3: Date comparison for July 21
console.log('\n3️⃣ Testing July 21 date comparison:');
console.log('------------------------------------');

const july21Dates = [
  '2025-07-21T18:29:59Z', // July 21 23:59:59 IST
  '2025-07-21T18:30:00Z', // July 22 00:00:00 IST
  '2025-07-20T18:30:00Z', // July 21 00:00:00 IST
  '2025-07-20T18:29:59Z'  // July 20 23:59:59 IST
];

july21Dates.forEach(date => {
  const isJuly21 = isOnISTDate(date, '2025-07-21');
  console.log(`${date} => July 21 in IST: ${isJuly21 ? '✅ YES' : '❌ NO'}`);
});

// Test 4: Meta webhook timestamp format
console.log('\n\n4️⃣ Testing Meta webhook timestamp formats:');
console.log('------------------------------------------');

const metaFormats = [
  'Mon Jul 21 2025 18:30:00 GMT+0000 (Coordinated Universal Time)',
  'Mon Jul 21 2025 18:30:00 GMT+0000',
  '2025-07-21T18:30:00+0000'
];

metaFormats.forEach(format => {
  const istTime = convertToIST(format);
  console.log(`Meta format: ${format}`);
  console.log(`IST time:    ${istTime}`);
  console.log(`IST date:    ${getISTDateString(istTime)}`);
  console.log('');
});

// Test 5: Demonstrate the fix for July 21 issue
console.log('\n5️⃣ Demonstrating July 21 Marketing Report Fix:');
console.log('-----------------------------------------------');

const problematicLeads = [
  { time: '2025-07-21T13:00:00Z', desc: 'July 21 18:30 IST (6:30 PM)' },
  { time: '2025-07-21T13:30:00Z', desc: 'July 21 19:00 IST (7:00 PM)' },
  { time: '2025-07-21T14:00:00Z', desc: 'July 21 19:30 IST (7:30 PM)' }
];

console.log('Leads created after 6:30 PM IST on July 21:');
problematicLeads.forEach(({ time, desc }) => {
  const istTime = convertToIST(time);
  const istDate = getISTDateString(istTime);
  console.log(`UTC: ${time} => IST: ${istTime} (${desc})`);
  console.log(`Date in IST: ${istDate} ${istDate === '2025-07-21' ? '✅' : '❌'}`);
});

console.log('\n✅ IST Timestamp Testing Complete!');