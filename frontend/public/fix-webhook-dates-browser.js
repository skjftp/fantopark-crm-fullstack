// Fix webhook date conversion for leads
// Run this in Firebase Console

// Helper function to get IST date string from UTC date
function getISTDateString(dateInput) {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
        return '';
    }
    
    // Convert to IST by adding 5:30
    const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
    
    // Format as YYYY-MM-DD
    const year = istDate.getUTCFullYear();
    const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(istDate.getUTCDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

async function fixWebhookDateConversion(dryRun = true) {
    console.log(`🔧 ${dryRun ? 'DRY RUN -' : ''} Fixing webhook date conversion issues...\n`);
    
    try {
        const db = firebase.firestore();
        
        // Query leads that have meta_created_time
        const snapshot = await db.collection('crm_leads')
            .where('meta_created_time', '!=', null)
            .get();
        
        console.log(`Found ${snapshot.size} leads with meta_created_time\n`);
        
        let needsFix = 0;
        let fixed = 0;
        const updates = [];
        
        for (const doc of snapshot.docs) {
            const lead = { id: doc.id, ...doc.data() };
            
            // Skip if no meta_created_time
            if (!lead.meta_created_time) {
                continue;
            }
            
            // Get IST date from meta_created_time
            const metaCreatedTime = lead.meta_created_time;
            const istDateFromMeta = getISTDateString(metaCreatedTime);
            
            // Get current date_of_enquiry
            const currentDateOfEnquiry = lead.date_of_enquiry;
            let currentDateOnly = '';
            
            if (currentDateOfEnquiry) {
                // Extract just the date part (YYYY-MM-DD)
                if (currentDateOfEnquiry.includes('T')) {
                    currentDateOnly = currentDateOfEnquiry.split('T')[0];
                } else {
                    currentDateOnly = currentDateOfEnquiry;
                }
            }
            
            // Check if they match
            if (istDateFromMeta !== currentDateOnly) {
                needsFix++;
                
                console.log(`🔍 Lead: ${lead.name} (${lead.id})`);
                console.log(`   Meta created time: ${metaCreatedTime}`);
                console.log(`   IST date from meta: ${istDateFromMeta}`);
                console.log(`   Current date_of_enquiry: ${currentDateOfEnquiry}`);
                console.log(`   Current date only: ${currentDateOnly}`);
                console.log(`   Needs fix: ${istDateFromMeta} != ${currentDateOnly}`);
                
                // Create proper date_of_enquiry with IST date but UTC time
                // We want to store the IST date at midnight UTC
                const fixedDateOfEnquiry = `${istDateFromMeta}T00:00:00.000Z`;
                
                updates.push({
                    id: doc.id,
                    name: lead.name,
                    oldDate: currentDateOfEnquiry,
                    newDate: fixedDateOfEnquiry,
                    metaCreatedTime: metaCreatedTime,
                    istDate: istDateFromMeta
                });
                
                if (!dryRun) {
                    await doc.ref.update({
                        date_of_enquiry: fixedDateOfEnquiry
                    });
                    fixed++;
                }
                
                console.log(`   Fixed to: ${fixedDateOfEnquiry}\n`);
            }
        }
        
        // Summary
        console.log('\n📊 Summary:');
        console.log('='.repeat(50));
        console.log(`Total leads with meta_created_time: ${snapshot.size}`);
        console.log(`Leads needing fix: ${needsFix}`);
        console.log(`Leads fixed: ${fixed}`);
        
        if (dryRun && needsFix > 0) {
            console.log('\n⚠️  This was a DRY RUN - no changes were made');
            console.log('Run fixWebhookDateConversion(false) to apply changes');
            
            // Show sample fixes
            console.log('\nSample fixes (first 5):');
            updates.slice(0, 5).forEach((update, i) => {
                console.log(`${i + 1}. ${update.name}`);
                console.log(`   Old: ${update.oldDate}`);
                console.log(`   New: ${update.newDate}`);
                console.log(`   Meta time: ${update.metaCreatedTime}`);
                console.log(`   IST date: ${update.istDate}`);
            });
        } else if (!dryRun) {
            console.log('\n✅ Fixes applied successfully');
        }
        
        return {
            total: snapshot.size,
            needsFix,
            fixed,
            updates
        };
        
    } catch (error) {
        console.error('❌ Error:', error);
        return null;
    }
}

// Also create a function to check specific leads
async function checkLeadDates(leadId) {
    try {
        const db = firebase.firestore();
        const doc = await db.collection('crm_leads').doc(leadId).get();
        
        if (!doc.exists) {
            console.log('Lead not found');
            return;
        }
        
        const lead = doc.data();
        console.log('\n📋 Lead Details:');
        console.log(`Name: ${lead.name}`);
        console.log(`Source: ${lead.source}`);
        console.log('\n📅 Date Information:');
        console.log(`date_of_enquiry: ${lead.date_of_enquiry}`);
        console.log(`created_date: ${lead.created_date}`);
        console.log(`meta_created_time: ${lead.meta_created_time}`);
        console.log(`meta_created_time_utc: ${lead.meta_created_time_utc}`);
        
        if (lead.meta_created_time) {
            const istDate = getISTDateString(lead.meta_created_time);
            console.log(`\n🔍 Analysis:`);
            console.log(`Meta created time in IST: ${istDate}`);
            console.log(`Current date_of_enquiry date: ${lead.date_of_enquiry ? lead.date_of_enquiry.split('T')[0] : 'N/A'}`);
            console.log(`Match: ${istDate === (lead.date_of_enquiry ? lead.date_of_enquiry.split('T')[0] : '')}`);
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
}

console.log('Available commands:');
console.log('1. fixWebhookDateConversion(true) - Dry run to see what will be fixed');
console.log('2. fixWebhookDateConversion(false) - Apply fixes');
console.log('3. checkLeadDates("leadId") - Check dates for a specific lead');
console.log('');
console.log('Example: checkLeadDates("sgXTvotpzrVkg0XgS1QT")');