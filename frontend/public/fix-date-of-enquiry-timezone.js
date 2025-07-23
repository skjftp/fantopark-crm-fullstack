// Fix date_of_enquiry timezone issues
// This script ensures all date_of_enquiry values are properly stored in UTC

async function fixDateOfEnquiryTimezone(startDate = '2025-07-23', dryRun = true) {
    console.log(`🔧 ${dryRun ? 'DRY RUN -' : ''} Fixing date_of_enquiry timezone issues from ${startDate}...\n`);
    
    try {
        const db = firebase.firestore();
        
        // Get leads from specified date onwards
        const startDateObj = new Date(startDate + 'T00:00:00Z');
        const snapshot = await db.collection('crm_leads')
            .where('created_date', '>=', startDateObj.toISOString())
            .orderBy('created_date', 'desc')
            .get();
        
        console.log(`Found ${snapshot.size} leads from ${startDate} onwards\n`);
        
        let analyzed = 0;
        let needsFix = 0;
        let fixed = 0;
        const updates = [];
        
        for (const doc of snapshot.docs) {
            const lead = { id: doc.id, ...doc.data() };
            analyzed++;
            
            // Skip if no date_of_enquiry
            if (!lead.date_of_enquiry) {
                console.log(`⚠️  ${lead.name} - Missing date_of_enquiry, using created_date`);
                
                if (lead.created_date) {
                    const fixedDate = new Date(lead.created_date).toISOString();
                    updates.push({
                        id: doc.id,
                        name: lead.name,
                        type: 'missing',
                        oldDate: null,
                        newDate: fixedDate
                    });
                    
                    if (!dryRun) {
                        await doc.ref.update({ date_of_enquiry: fixedDate });
                    }
                    fixed++;
                }
                continue;
            }
            
            const dateOfEnquiry = new Date(lead.date_of_enquiry);
            const createdDate = lead.created_date ? new Date(lead.created_date) : null;
            
            // Check if date needs fixing
            let needsUpdate = false;
            let fixedDate = null;
            let fixType = '';
            
            // Case 1: date_of_enquiry exactly matches created_date - this is fine
            if (createdDate && dateOfEnquiry.toISOString() === createdDate.toISOString()) {
                // This is already correct
                continue;
            }
            
            // Case 2: date_of_enquiry is not in ISO format (missing Z)
            if (!lead.date_of_enquiry.endsWith('Z')) {
                // This date is not in proper UTC format
                // If created_date exists and is in proper format, use it
                if (createdDate && lead.created_date.endsWith('Z')) {
                    fixedDate = createdDate.toISOString();
                    fixType = 'non-iso-use-created';
                } else {
                    // Assume it's IST and convert to UTC
                    const istDate = new Date(lead.date_of_enquiry + '+05:30');
                    if (!isNaN(istDate.getTime())) {
                        fixedDate = istDate.toISOString();
                        fixType = 'non-iso-convert';
                    }
                }
                needsUpdate = true;
            }
            
            // Case 3: Check if the hour suggests wrong timezone
            // If created_by indicates manual/system creation, trust created_date more
            if (!needsUpdate && createdDate) {
                const hourDiff = Math.abs(dateOfEnquiry.getHours() - createdDate.getHours());
                if (hourDiff >= 5) {
                    // Significant hour difference, might be timezone issue
                    fixedDate = createdDate.toISOString();
                    fixType = 'timezone-mismatch';
                    needsUpdate = true;
                }
            }
            
            if (needsUpdate && fixedDate) {
                needsFix++;
                console.log(`🔧 ${lead.name} - ${fixType}`);
                console.log(`   From: ${lead.date_of_enquiry}`);
                console.log(`   To:   ${fixedDate}`);
                
                updates.push({
                    id: doc.id,
                    name: lead.name,
                    type: fixType,
                    oldDate: lead.date_of_enquiry,
                    newDate: fixedDate,
                    source: lead.source,
                    created_by: lead.created_by
                });
                
                if (!dryRun) {
                    await doc.ref.update({ date_of_enquiry: fixedDate });
                    fixed++;
                }
            }
            
            // Progress indicator
            if (analyzed % 100 === 0) {
                console.log(`... Analyzed ${analyzed} leads, found ${needsFix} that need fixing`);
            }
        }
        
        // Summary
        console.log('\n📊 Summary:');
        console.log('='.repeat(50));
        console.log(`Total leads analyzed: ${analyzed}`);
        console.log(`Leads needing fix: ${needsFix}`);
        console.log(`Leads fixed: ${fixed}`);
        
        // Group by fix type
        const byType = {};
        updates.forEach(update => {
            byType[update.type] = (byType[update.type] || 0) + 1;
        });
        
        console.log('\nFixes by type:');
        Object.entries(byType).forEach(([type, count]) => {
            console.log(`  ${type}: ${count}`);
        });
        
        // Group by source
        const bySource = {};
        updates.forEach(update => {
            bySource[update.source || 'Unknown'] = (bySource[update.source] || 0) + 1;
        });
        
        console.log('\nFixes by source:');
        Object.entries(bySource).forEach(([source, count]) => {
            console.log(`  ${source}: ${count}`);
        });
        
        if (dryRun) {
            console.log('\n⚠️  This was a DRY RUN - no changes were made');
            console.log('Run fixDateOfEnquiryTimezone("2025-07-23", false) to apply changes');
            
            // Show sample updates
            if (updates.length > 0) {
                console.log('\nSample updates (first 5):');
                updates.slice(0, 5).forEach((update, i) => {
                    console.log(`\n${i + 1}. ${update.name}`);
                    console.log(`   Type: ${update.type}`);
                    console.log(`   Old: ${update.oldDate}`);
                    console.log(`   New: ${update.newDate}`);
                });
            }
        } else {
            console.log('\n✅ Fixes applied successfully');
        }
        
        return {
            analyzed,
            needsFix,
            fixed,
            updates
        };
        
    } catch (error) {
        console.error('❌ Error:', error);
        return null;
    }
}

// Helper function to verify the fix worked
async function verifyJuly22Counts() {
    console.log('\n🔍 Verifying July 22 Instagram lead counts...\n');
    
    try {
        const db = firebase.firestore();
        
        // Direct query
        const july22Start = new Date('2025-07-22T00:00:00+05:30');
        const july22End = new Date('2025-07-22T23:59:59+05:30');
        
        const directQuery = await db.collection('crm_leads')
            .where('source', '==', 'Instagram')
            .where('date_of_enquiry', '>=', july22Start.toISOString())
            .where('date_of_enquiry', '<=', july22End.toISOString())
            .get();
        
        // Marketing query
        const marketingStart = new Date('2025-07-22T00:00:00+05:30').toISOString();
        const marketingEnd = new Date('2025-07-22T23:59:59+05:30').toISOString();
        
        const marketingQuery = await db.collection('crm_leads')
            .where('source', '==', 'Instagram')
            .where('date_of_enquiry', '>=', marketingStart)
            .where('date_of_enquiry', '<=', marketingEnd)
            .get();
        
        console.log('Results:');
        console.log(`Direct query (IST): ${directQuery.size} leads`);
        console.log(`Marketing query (UTC): ${marketingQuery.size} leads`);
        console.log(`Difference: ${Math.abs(directQuery.size - marketingQuery.size)}`);
        
        if (directQuery.size === marketingQuery.size) {
            console.log('\n✅ Counts match! The issue has been resolved.');
        } else {
            console.log('\n⚠️  Counts still don\'t match. Further investigation needed.');
        }
        
        return {
            direct: directQuery.size,
            marketing: marketingQuery.size
        };
        
    } catch (error) {
        console.error('❌ Error:', error);
        return null;
    }
}

console.log('Available commands:');
console.log('1. analyzeJuly22Discrepancy() - Analyze the discrepancy');
console.log('2. fixDateOfEnquiryTimezone("2025-07-23", true) - Dry run fix from July 23');
console.log('3. fixDateOfEnquiryTimezone("2025-07-23", false) - Apply fixes from July 23');
console.log('4. verifyJuly22Counts() - Verify if counts match after fix');