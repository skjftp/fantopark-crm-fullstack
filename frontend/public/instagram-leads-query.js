// Instagram Leads Query for July 22nd, 2025
// Run this in your browser console while on Firebase Console

async function getInstagramLeadsJuly22() {
    console.log('📱 Fetching Instagram leads for July 22nd, 2025...\n');
    
    // Date range for July 22nd (considering IST timezone)
    const startDate = new Date('2025-07-22T00:00:00+05:30'); // IST midnight
    const endDate = new Date('2025-07-22T23:59:59+05:30');   // IST end of day
    
    // Convert to UTC for Firestore query
    const startUTC = startDate.toISOString();
    const endUTC = endDate.toISOString();
    
    console.log('Date range (IST):', startDate.toLocaleString('en-IN'), 'to', endDate.toLocaleString('en-IN'));
    console.log('Date range (UTC):', startUTC, 'to', endUTC);
    
    try {
        // Get reference to Firestore
        const db = firebase.firestore();
        
        // Query Instagram leads for July 22nd
        const querySnapshot = await db.collection('leads')
            .where('source', '==', 'Instagram')
            .where('date_of_enquiry', '>=', startUTC)
            .where('date_of_enquiry', '<=', endUTC)
            .get();
        
        console.log(`\n✅ Found ${querySnapshot.size} Instagram leads on July 22nd\n`);
        
        // Group by ad set
        const adSetGroups = {};
        const allLeads = [];
        
        querySnapshot.forEach(doc => {
            const lead = { id: doc.id, ...doc.data() };
            allLeads.push(lead);
            
            // Check multiple possible ad set field names
            const adSet = lead.ad_set || lead.adset_name || lead.ad_set_name || lead.adset || 'No Ad Set';
            
            if (!adSetGroups[adSet]) {
                adSetGroups[adSet] = {
                    count: 0,
                    leads: []
                };
            }
            
            adSetGroups[adSet].count++;
            adSetGroups[adSet].leads.push({
                name: lead.name || lead.company_name || 'Unknown',
                phone: lead.phone || lead.contact_number || 'No phone',
                email: lead.email || 'No email',
                event: lead.lead_for_event || lead.event_name || 'No event',
                date: new Date(lead.date_of_enquiry).toLocaleString('en-IN'),
                status: lead.status || 'No status'
            });
        });
        
        // Display results
        console.log('========== AD SET WISE BREAKDOWN ==========\n');
        
        Object.entries(adSetGroups)
            .sort(([, a], [, b]) => b.count - a.count)
            .forEach(([adSet, data]) => {
                console.log(`📊 Ad Set: "${adSet}"`);
                console.log(`   Count: ${data.count} leads`);
                console.log('   Leads:');
                data.leads.forEach((lead, index) => {
                    console.log(`   ${index + 1}. ${lead.name} - ${lead.phone} - ${lead.event} - ${lead.status}`);
                });
                console.log('');
            });
        
        // Summary
        console.log('========== SUMMARY ==========');
        console.log(`Total Instagram leads: ${querySnapshot.size}`);
        console.log(`Number of ad sets: ${Object.keys(adSetGroups).length}`);
        console.log('\nTop 5 Ad Sets:');
        Object.entries(adSetGroups)
            .sort(([, a], [, b]) => b.count - a.count)
            .slice(0, 5)
            .forEach(([adSet, data], index) => {
                console.log(`${index + 1}. "${adSet}" - ${data.count} leads`);
            });
        
        // Check for Facebook leads too
        const fbQuery = await db.collection('leads')
            .where('source', '==', 'Facebook')
            .where('date_of_enquiry', '>=', startUTC)
            .where('date_of_enquiry', '<=', endUTC)
            .get();
        
        console.log(`\n📘 Facebook leads on July 22nd: ${fbQuery.size}`);
        console.log(`📱 Instagram leads on July 22nd: ${querySnapshot.size}`);
        console.log(`📊 Total Meta (FB + IG) leads: ${fbQuery.size + querySnapshot.size}`);
        
        // Export data
        console.log('\n========== EXPORT DATA ==========');
        console.log('Copy the data below for further analysis:');
        console.log(JSON.stringify({
            date: 'July 22, 2025',
            instagram_total: querySnapshot.size,
            facebook_total: fbQuery.size,
            meta_total: fbQuery.size + querySnapshot.size,
            ad_sets: Object.entries(adSetGroups).map(([name, data]) => ({
                name,
                count: data.count,
                leads: data.leads
            }))
        }, null, 2));
        
        return {
            instagram: querySnapshot.size,
            facebook: fbQuery.size,
            total: fbQuery.size + querySnapshot.size,
            adSets: adSetGroups
        };
        
    } catch (error) {
        console.error('❌ Error:', error);
        return null;
    }
}

// Alternative: Get all leads for July 22nd to debug
async function getAllLeadsJuly22() {
    console.log('📋 Getting ALL leads for July 22nd to check source distribution...\n');
    
    const startDate = new Date('2025-07-22T00:00:00+05:30');
    const endDate = new Date('2025-07-22T23:59:59+05:30');
    
    try {
        const db = firebase.firestore();
        const querySnapshot = await db.collection('leads')
            .where('date_of_enquiry', '>=', startDate.toISOString())
            .where('date_of_enquiry', '<=', endDate.toISOString())
            .get();
        
        const sourceCount = {};
        
        querySnapshot.forEach(doc => {
            const lead = doc.data();
            const source = lead.source || 'No Source';
            sourceCount[source] = (sourceCount[source] || 0) + 1;
        });
        
        console.log(`Total leads on July 22nd: ${querySnapshot.size}`);
        console.log('\nBreakdown by source:');
        Object.entries(sourceCount)
            .sort(([, a], [, b]) => b - a)
            .forEach(([source, count]) => {
                console.log(`${source}: ${count} leads`);
            });
        
        return sourceCount;
    } catch (error) {
        console.error('❌ Error:', error);
        return null;
    }
}

// Run the queries
console.log('Run these commands:');
console.log('1. getInstagramLeadsJuly22() - Get Instagram leads grouped by ad set');
console.log('2. getAllLeadsJuly22() - Get all leads to see source distribution');