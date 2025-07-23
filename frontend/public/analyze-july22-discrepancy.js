// Analyze July 22nd Instagram leads discrepancy
// Run this in Firebase Console

async function analyzeJuly22Discrepancy() {
    console.log('🔍 Analyzing July 22nd Instagram leads discrepancy...\n');
    
    try {
        const db = firebase.firestore();
        
        // Method 1: Direct Firebase query (your method - 27 leads)
        console.log('Method 1: Direct Firebase Query');
        console.log('='.repeat(50));
        
        const july22Start = new Date('2025-07-22T00:00:00+05:30');
        const july22End = new Date('2025-07-22T23:59:59+05:30');
        
        console.log('Date range (IST):', july22Start.toLocaleString('en-IN'), 'to', july22End.toLocaleString('en-IN'));
        
        const directQuery = await db.collection('crm_leads')
            .where('source', '==', 'Instagram')
            .where('date_of_enquiry', '>=', july22Start.toISOString())
            .where('date_of_enquiry', '<=', july22End.toISOString())
            .get();
        
        console.log(`Found ${directQuery.size} leads with direct query\n`);
        
        // Method 2: Marketing Performance query (36 leads)
        console.log('Method 2: Marketing Performance Query (using formatDateForQuery logic)');
        console.log('='.repeat(50));
        
        // This mimics formatDateForQuery from dateHelpers.js
        const marketingStart = new Date('2025-07-22T00:00:00+05:30').toISOString(); // = 2025-07-21T18:30:00.000Z
        const marketingEnd = new Date('2025-07-22T23:59:59+05:30').toISOString();   // = 2025-07-22T18:29:59.000Z
        
        console.log('Date range (UTC):', marketingStart, 'to', marketingEnd);
        
        const marketingQuery = await db.collection('crm_leads')
            .where('source', '==', 'Instagram')
            .where('date_of_enquiry', '>=', marketingStart)
            .where('date_of_enquiry', '<=', marketingEnd)
            .get();
        
        console.log(`Found ${marketingQuery.size} leads with marketing query\n`);
        
        // Find the extra leads
        const directLeadIds = new Set();
        directQuery.forEach(doc => directLeadIds.add(doc.id));
        
        const extraLeads = [];
        marketingQuery.forEach(doc => {
            if (!directLeadIds.has(doc.id)) {
                const data = doc.data();
                extraLeads.push({
                    id: doc.id,
                    name: data.name,
                    date_of_enquiry: data.date_of_enquiry,
                    created_date: data.created_date,
                    source: data.source,
                    created_by: data.created_by
                });
            }
        });
        
        console.log(`\n⚠️  Found ${extraLeads.length} extra leads in marketing query\n`);
        
        if (extraLeads.length > 0) {
            console.log('Extra leads details:');
            console.log('='.repeat(80));
            
            extraLeads.forEach((lead, index) => {
                console.log(`\n${index + 1}. ${lead.name} (${lead.id})`);
                console.log(`   Date of Enquiry: ${lead.date_of_enquiry}`);
                console.log(`   Created Date: ${lead.created_date}`);
                console.log(`   Created By: ${lead.created_by}`);
                
                // Analyze the date
                const enquiryDate = new Date(lead.date_of_enquiry);
                const istTime = enquiryDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
                console.log(`   Date of Enquiry (IST): ${istTime}`);
                
                // Check if it's actually July 21st IST
                if (istTime.includes('21/7/2025')) {
                    console.log(`   ⚠️  This lead is actually from July 21st IST!`);
                }
            });
        }
        
        // Method 3: Get all Instagram leads and manually filter
        console.log('\n\nMethod 3: Manual Analysis of All Instagram Leads');
        console.log('='.repeat(50));
        
        const allInstagramLeads = await db.collection('crm_leads')
            .where('source', '==', 'Instagram')
            .get();
        
        const july22IST = [];
        const july21Late = [];
        const july23Early = [];
        
        allInstagramLeads.forEach(doc => {
            const data = doc.data();
            const enquiryDate = new Date(data.date_of_enquiry);
            const istDateStr = enquiryDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
            
            if (istDateStr.includes('22/7/2025')) {
                july22IST.push({ id: doc.id, name: data.name, date: data.date_of_enquiry, istTime: istDateStr });
            } else if (istDateStr.includes('21/7/2025') && enquiryDate >= new Date('2025-07-21T18:30:00Z')) {
                july21Late.push({ id: doc.id, name: data.name, date: data.date_of_enquiry, istTime: istDateStr });
            } else if (istDateStr.includes('23/7/2025') && enquiryDate <= new Date('2025-07-22T18:30:00Z')) {
                july23Early.push({ id: doc.id, name: data.name, date: data.date_of_enquiry, istTime: istDateStr });
            }
        });
        
        console.log(`\nManual count by IST date:`);
        console.log(`July 22 IST: ${july22IST.length} leads`);
        console.log(`July 21 late (after 18:30 UTC): ${july21Late.length} leads`);
        console.log(`July 23 early (before 18:30 UTC): ${july23Early.length} leads`);
        
        // Summary
        console.log('\n\n📊 SUMMARY');
        console.log('='.repeat(50));
        console.log(`Firebase direct query (IST boundaries): ${directQuery.size} leads`);
        console.log(`Marketing query (UTC boundaries): ${marketingQuery.size} leads`);
        console.log(`Difference: ${marketingQuery.size - directQuery.size} extra leads`);
        console.log(`\nThe extra ${extraLeads.length} leads are likely from late July 21st IST`);
        console.log(`that fall within the UTC range but not the IST range.`);
        
        return {
            directQueryCount: directQuery.size,
            marketingQueryCount: marketingQuery.size,
            extraLeads: extraLeads,
            july22IST: july22IST.length,
            july21Late: july21Late.length
        };
        
    } catch (error) {
        console.error('❌ Error:', error);
        return null;
    }
}

// Run the analysis
analyzeJuly22Discrepancy();