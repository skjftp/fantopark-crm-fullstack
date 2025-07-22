const { db, collections } = require('./src/config/db');

async function verifyFixResults() {
console.log('✅ Verifying timestamp fix results for July 21, 2025\n');

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
utcDate: new Date(lead.date_of_enquiry),
istDate: new Date(new Date(lead.date_of_enquiry).getTime() + (5.5 * 60 * 60 *
1000))
});
}
});

// Sort by date
july21Leads.sort((a, b) => a.utcDate - b.utcDate);

// Count by IST date
let july21IST = 0;
let july22IST = 0;

console.log('📅 UPDATED LEAD TIMESTAMPS:\n');
july21Leads.forEach((lead, i) => {
const istDateStr = lead.istDate.toISOString().split('T')[0];
const istTimeStr = lead.istDate.toTimeString().split(' ')[0];

if (istDateStr === '2025-07-21') july21IST++;
if (istDateStr === '2025-07-22') july22IST++;

console.log(`${i + 1}. ${lead.name}`);
console.log(`   UTC: ${lead.date_of_enquiry}`);
console.log(`   IST: ${istDateStr} ${istTimeStr}`);
if (istDateStr === '2025-07-22') {
console.log(`   ⚠️  Shows as July 22 in IST`);
}
console.log('');
});

console.log('📊 FINAL RESULTS:');
console.log('='.repeat(60));
console.log(`Total Instagram leads on July 21 UTC: ${july21Leads.length}`);
console.log(`Leads on July 21 IST: ${july21IST}`);
console.log(`Leads on July 22 IST: ${july22IST}`);
console.log('='.repeat(60));

console.log('\n🎯 MARKETING REPORT ALIGNMENT:');
console.log(`Expected in marketing report (IST timezone): ${july21IST} leads`);
console.log(`Your marketing report shows: 12 leads`);
if (july21IST === 12) {
console.log('✅ Numbers now match! (excluding manual lead)');
} else {
console.log(`Still a difference of ${Math.abs(july21IST - 12)} leads`);
}

console.log('\n📊 IMPRESSIONS ISSUE:');
console.log('Facebook Ads Manager: 62,994 impressions');
console.log('Marketing Report: 51,954 impressions');
console.log('Difference: 11,040 impressions');
console.log('\nThis might be because:');
console.log('1. Impressions are also filtered by IST timezone');
console.log('2. Some impressions are from Facebook placement (not Instagram)');
console.log('3. Impressions data is cached or delayed in sync');

console.log('\n�� NEXT STEPS:');
console.log('1. Refresh your marketing performance report');
console.log('2. Check if lead count now shows correctly');
console.log('3. For impressions discrepancy, check:');
console.log('   - Facebook Ads Manager placement breakdown');
console.log('   - Timezone settings in marketing report');
console.log('   - When impressions data was last synced');

} catch (error) {
console.error('❌ Error:', error.message);
}
}

verifyFixResults();
