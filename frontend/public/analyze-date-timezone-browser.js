// Date Timezone Analysis Script
// Run this in your browser console while on Firebase Console

async function analyzeDateTimezoneIssues() {
    console.log('🔍 Analyzing date_of_enquiry timezone issues...\n');
    
    try {
        // Get reference to Firestore
        const db = firebase.firestore();
        
        // Get all leads
        const snapshot = await db.collection('crm_leads')
            .orderBy('created_date', 'desc')
            .get();
        
        console.log(`Found ${snapshot.size} total leads\n`);
        
        const issues = {
            matching: [],      // date_of_enquiry matches created_date
            utcDates: [],      // date_of_enquiry appears to be in UTC
            istDates: [],      // date_of_enquiry appears to be in IST
            suspicious: [],    // suspicious patterns
            noDateOfEnquiry: [] // missing date_of_enquiry
        };
        
        snapshot.forEach(doc => {
            const lead = { id: doc.id, ...doc.data() };
            
            // Skip if no date_of_enquiry
            if (!lead.date_of_enquiry) {
                issues.noDateOfEnquiry.push({
                    id: lead.id,
                    name: lead.name,
                    created_date: lead.created_date,
                    source: lead.source
                });
                return;
            }
            
            // Convert dates to compare
            const dateOfEnquiry = new Date(lead.date_of_enquiry);
            const createdDate = lead.created_date ? new Date(lead.created_date) : null;
            
            // Check if dates match exactly
            if (createdDate && dateOfEnquiry.toISOString() === createdDate.toISOString()) {
                issues.matching.push({
                    id: lead.id,
                    name: lead.name,
                    date: lead.date_of_enquiry,
                    source: lead.source,
                    created_by: lead.created_by
                });
            }
            
            // Check timezone patterns
            const dateStr = lead.date_of_enquiry.toString();
            
            // Check if it ends with Z (UTC)
            if (dateStr.endsWith('Z')) {
                // Check the hour to determine if it's actually IST stored as UTC
                const hour = dateOfEnquiry.getUTCHours();
                
                // If hour is between 18:30 and 23:59 UTC, it might be IST midnight to 5:29 AM
                // If hour is between 0:00 and 18:29 UTC, it might be IST 5:30 AM to 11:59 PM
                if (hour >= 0 && hour < 18) {
                    // Likely IST time stored as UTC (morning/afternoon in IST)
                    issues.suspicious.push({
                        id: lead.id,
                        name: lead.name,
                        date_of_enquiry: lead.date_of_enquiry,
                        created_date: lead.created_date,
                        source: lead.source,
                        created_by: lead.created_by,
                        reason: 'UTC time but hour suggests IST'
                    });
                } else {
                    issues.utcDates.push({
                        id: lead.id,
                        name: lead.name,
                        date_of_enquiry: lead.date_of_enquiry,
                        created_date: lead.created_date,
                        source: lead.source,
                        created_by: lead.created_by
                    });
                }
            } else {
                // Not UTC format
                issues.istDates.push({
                    id: lead.id,
                    name: lead.name,
                    date_of_enquiry: lead.date_of_enquiry,
                    created_date: lead.created_date,
                    source: lead.source,
                    created_by: lead.created_by
                });
            }
        });
        
        // Filter for July 23 onwards
        const july23 = new Date('2025-07-23T00:00:00Z');
        const recentIssues = {
            matching: issues.matching.filter(l => new Date(l.date) >= july23),
            utcDates: issues.utcDates.filter(l => new Date(l.date_of_enquiry) >= july23),
            istDates: issues.istDates.filter(l => new Date(l.date_of_enquiry) >= july23),
            suspicious: issues.suspicious.filter(l => new Date(l.date_of_enquiry) >= july23)
        };
        
        // Display results
        console.log('📊 Overall Analysis:');
        console.log('='.repeat(50));
        console.log(`Leads with matching date_of_enquiry and created_date: ${issues.matching.length}`);
        console.log(`Leads with UTC date_of_enquiry: ${issues.utcDates.length}`);
        console.log(`Leads with IST date_of_enquiry: ${issues.istDates.length}`);
        console.log(`Leads with suspicious patterns: ${issues.suspicious.length}`);
        console.log(`Leads missing date_of_enquiry: ${issues.noDateOfEnquiry.length}`);
        console.log();
        
        console.log('📅 July 23rd Onwards Analysis:');
        console.log('='.repeat(50));
        console.log(`Recent leads with matching dates: ${recentIssues.matching.length}`);
        console.log(`Recent leads with UTC dates: ${recentIssues.utcDates.length}`);
        console.log(`Recent leads with IST dates: ${recentIssues.istDates.length}`);
        console.log(`Recent leads with suspicious patterns: ${recentIssues.suspicious.length}`);
        console.log();
        
        // Group by source
        console.log('📍 Issues by Source (July 23 onwards):');
        console.log('='.repeat(50));
        const sourceGroups = {};
        
        [...recentIssues.matching, ...recentIssues.utcDates, ...recentIssues.suspicious].forEach(lead => {
            const source = lead.source || 'Unknown';
            if (!sourceGroups[source]) {
                sourceGroups[source] = { matching: 0, utc: 0, suspicious: 0 };
            }
            
            if (recentIssues.matching.find(l => l.id === lead.id)) sourceGroups[source].matching++;
            if (recentIssues.utcDates.find(l => l.id === lead.id)) sourceGroups[source].utc++;
            if (recentIssues.suspicious.find(l => l.id === lead.id)) sourceGroups[source].suspicious++;
        });
        
        Object.entries(sourceGroups).forEach(([source, counts]) => {
            console.log(`\n${source}:`);
            console.log(`  Matching dates: ${counts.matching}`);
            console.log(`  UTC dates: ${counts.utc}`);
            console.log(`  Suspicious: ${counts.suspicious}`);
        });
        
        // Sample suspicious leads
        if (recentIssues.suspicious.length > 0) {
            console.log('\n⚠️  Sample Suspicious Leads (July 23 onwards):');
            console.log('='.repeat(80));
            recentIssues.suspicious.slice(0, 5).forEach(lead => {
                console.log(`\nLead: ${lead.name} (${lead.id})`);
                console.log(`Source: ${lead.source}`);
                console.log(`Date of Enquiry: ${lead.date_of_enquiry}`);
                console.log(`Created Date: ${lead.created_date}`);
                console.log(`Created By: ${lead.created_by}`);
                console.log(`Reason: ${lead.reason}`);
            });
        }
        
        // Return results for further processing
        return {
            analysis_date: new Date().toISOString(),
            total_leads: snapshot.size,
            overall_issues: issues,
            recent_issues: recentIssues,
            source_breakdown: sourceGroups
        };
        
    } catch (error) {
        console.error('❌ Error:', error);
        return null;
    }
}

// Fix function for date_of_enquiry
async function fixDateOfEnquiryTimezone(dryRun = true) {
    console.log(`\n🔧 ${dryRun ? 'DRY RUN -' : ''} Fixing date_of_enquiry timezone issues...\n`);
    
    try {
        const db = firebase.firestore();
        
        // Get leads from July 23 onwards
        const july23 = new Date('2025-07-23T00:00:00Z');
        const snapshot = await db.collection('crm_leads')
            .where('created_date', '>=', july23.toISOString())
            .get();
        
        console.log(`Found ${snapshot.size} leads from July 23 onwards\n`);
        
        let fixed = 0;
        let skipped = 0;
        const updates = [];
        
        for (const doc of snapshot.docs) {
            const lead = { id: doc.id, ...doc.data() };
            
            // Skip if no date_of_enquiry
            if (!lead.date_of_enquiry) {
                console.log(`⚠️  Skipping ${lead.name} - no date_of_enquiry`);
                skipped++;
                continue;
            }
            
            // Check if date_of_enquiry needs fixing
            const dateOfEnquiry = new Date(lead.date_of_enquiry);
            const createdDate = lead.created_date ? new Date(lead.created_date) : null;
            
            // Case 1: date_of_enquiry matches created_date - use created_date as truth
            if (createdDate && dateOfEnquiry.toISOString() === createdDate.toISOString()) {
                console.log(`✅ ${lead.name} - dates already match, no fix needed`);
                skipped++;
                continue;
            }
            
            // Case 2: date_of_enquiry is in UTC but should be IST
            if (lead.date_of_enquiry.endsWith('Z')) {
                const hour = dateOfEnquiry.getUTCHours();
                
                // If created_date exists and is in IST format, use it
                if (createdDate && !lead.created_date.endsWith('Z')) {
                    const fixedDate = createdDate.toISOString();
                    console.log(`🔧 ${lead.name} - fixing to match created_date`);
                    console.log(`   From: ${lead.date_of_enquiry}`);
                    console.log(`   To:   ${fixedDate}`);
                    
                    updates.push({
                        id: doc.id,
                        name: lead.name,
                        oldDate: lead.date_of_enquiry,
                        newDate: fixedDate
                    });
                    
                    if (!dryRun) {
                        await doc.ref.update({ date_of_enquiry: fixedDate });
                    }
                    fixed++;
                } else if (hour >= 0 && hour < 18) {
                    // Suspicious UTC time - likely IST stored as UTC
                    // Convert by subtracting 5:30 hours
                    const istDate = new Date(dateOfEnquiry.getTime() - (5.5 * 60 * 60 * 1000));
                    const fixedDate = istDate.toISOString();
                    
                    console.log(`🔧 ${lead.name} - converting UTC to IST`);
                    console.log(`   From: ${lead.date_of_enquiry}`);
                    console.log(`   To:   ${fixedDate}`);
                    
                    updates.push({
                        id: doc.id,
                        name: lead.name,
                        oldDate: lead.date_of_enquiry,
                        newDate: fixedDate
                    });
                    
                    if (!dryRun) {
                        await doc.ref.update({ date_of_enquiry: fixedDate });
                    }
                    fixed++;
                } else {
                    console.log(`⚠️  ${lead.name} - UTC date looks correct, skipping`);
                    skipped++;
                }
            } else {
                // Already in IST format
                console.log(`✅ ${lead.name} - already in IST format`);
                skipped++;
            }
        }
        
        console.log('\n📊 Summary:');
        console.log('='.repeat(50));
        console.log(`Total leads processed: ${snapshot.size}`);
        console.log(`Leads fixed: ${fixed}`);
        console.log(`Leads skipped: ${skipped}`);
        
        if (dryRun) {
            console.log('\n⚠️  This was a DRY RUN - no changes were made');
            console.log('Run fixDateOfEnquiryTimezone(false) to apply changes');
        }
        
        return {
            processed: snapshot.size,
            fixed,
            skipped,
            updates
        };
        
    } catch (error) {
        console.error('❌ Error:', error);
        return null;
    }
}

console.log('Available commands:');
console.log('1. analyzeDateTimezoneIssues() - Analyze timezone issues');
console.log('2. fixDateOfEnquiryTimezone(true) - Dry run fix');
console.log('3. fixDateOfEnquiryTimezone(false) - Apply fixes');