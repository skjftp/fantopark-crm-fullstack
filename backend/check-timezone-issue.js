const { db, collections } = require('./src/config/db');

async function checkTimezoneIssue() {
console.log('🕐 Checking Timezone and Date Issues\n');

try {
const snapshot = await db.collection(collections.leads).get();
const july21Leads = [];

snapshot.forEach(doc => {
const lead = doc.data();
const dateStr = (lead.date_of_enquiry || '').toString();

if (dateStr.includes('2025-07-21') && lead.source === 'Instagram') {
july21Leads.push({
name: lead.name,
date_of_enquiry: lead.date_of_enquiry,
meta_created_time: lead.meta_created_time,
created_date: lead.created_date,
lead_source_details: lead.lead_source_details
});
}
});

console.log('📊 Analyzing date fields for all 15 Instagram leads:\n');

// Group by different date fields
const enquiryDates = {};
const metaDates = {};
const createdDates = {};

july21Leads.forEach((lead, i) => {
console.log(`${i + 1}. ${lead.name}`);
console.log(`   date_of_enquiry: ${lead.date_of_enquiry}`);
console.log(`   meta_created_time: ${lead.meta_created_time || 'N/A'}`);

if (lead.lead_source_details?.created_time) {
console.log(`   lead_source_created_time:
${lead.lead_source_details.created_time}`);
}

// Check IST conversion
if (lead.date_of_enquiry) {
const utcDate = new Date(lead.date_of_enquiry);
const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
console.log(`   IST equivalent: ${istDate.toISOString().split('T')[0]}
${istDate.toTimeString().split(' ')[0]}`);

// Check if it falls on July 21 in IST
const istDateOnly = istDate.toISOString().split('T')[0];
if (istDateOnly !== '2025-07-21') {
console.log(`   ⚠️  This lead is NOT July 21 in IST (it's ${istDateOnly})`);
}
}
console.log('');
});

// Count by IST date
console.log('📅 TIMEZONE ANALYSIS:');
let july21IST = 0;
let july22IST = 0;

july21Leads.forEach(lead => {
if (lead.date_of_enquiry) {
const utcDate = new Date(lead.date_of_enquiry);
const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
const istDateOnly = istDate.toISOString().split('T')[0];

if (istDateOnly === '2025-07-21') july21IST++;
if (istDateOnly === '2025-07-22') july22IST++;
}
});

console.log(`\n📊 Date Distribution:`);
console.log(`  July 21 in UTC: 15 leads`);
console.log(`  July 21 in IST: ${july21IST} leads`);
console.log(`  July 22 in IST: ${july22IST} leads`);

console.log('\n💡 KEY FINDING:');
console.log(`The marketing report shows 12 leads because it's likely using IST
timezone!`);
console.log(`${july22IST} leads created after 6:30 PM IST on July 21 are counted as
July 22 in IST.`);

// Check impressions issue
console.log('\n📊 IMPRESSIONS DISCREPANCY:');
console.log('Facebook Ads Manager: 62,994 impressions');
console.log('Marketing Report: 51,954 impressions');
console.log('Difference: 11,040 impressions');
console.log('\nThis suggests the marketing report is:');
console.log('1. Using cached/delayed impression data');
console.log('2. Or filtering by a specific placement (Instagram only)');
console.log('3. Or using IST timezone for impressions too');

} catch (error) {
console.error('❌ Error:', error.message);
}
}

checkTimezoneIssue();
