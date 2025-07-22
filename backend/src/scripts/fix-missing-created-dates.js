// Script to fix missing created_date fields in leads
const { db, collections } = require('../config/db');

async function fixMissingCreatedDates() {
  console.log('🔍 Starting to fix missing created_date fields...');
  
  try {
    // Get all leads
    const leadsSnapshot = await db.collection(collections.leads).get();
    console.log(`📊 Total leads in system: ${leadsSnapshot.size}`);
    
    let leadsWithoutDate = [];
    let leadsWithDate = 0;
    
    // Check each lead
    leadsSnapshot.forEach(doc => {
      const lead = doc.data();
      if (!lead.created_date) {
        leadsWithoutDate.push({
          id: doc.id,
          name: lead.name || 'Unknown',
          email: lead.email || 'No email',
          date_of_enquiry: lead.date_of_enquiry
        });
      } else {
        leadsWithDate++;
      }
    });
    
    console.log(`✅ Leads with created_date: ${leadsWithDate}`);
    console.log(`❌ Leads without created_date: ${leadsWithoutDate.length}`);
    
    if (leadsWithoutDate.length === 0) {
      console.log('🎉 All leads already have created_date!');
      return;
    }
    
    console.log('\n📋 Leads missing created_date:');
    leadsWithoutDate.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.name} (${lead.email}) - date_of_enquiry: ${lead.date_of_enquiry || 'None'}`);
    });
    
    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will update all leads without created_date.');
    console.log('The script will use date_of_enquiry if available, otherwise current date.');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Update leads in batches
    const batchSize = 500;
    let updatedCount = 0;
    
    for (let i = 0; i < leadsWithoutDate.length; i += batchSize) {
      const batch = db.batch();
      const batchLeads = leadsWithoutDate.slice(i, i + batchSize);
      
      for (const lead of batchLeads) {
        const docRef = db.collection(collections.leads).doc(lead.id);
        
        // Determine what date to use
        let dateToUse;
        if (lead.date_of_enquiry) {
          // Use date_of_enquiry if available
          dateToUse = lead.date_of_enquiry;
        } else {
          // Use current date as fallback
          dateToUse = new Date().toISOString();
        }
        
        batch.update(docRef, {
          created_date: dateToUse,
          updated_date: new Date().toISOString(),
          updated_by: 'system_fix_script'
        });
        
        updatedCount++;
      }
      
      await batch.commit();
      console.log(`✅ Updated ${updatedCount}/${leadsWithoutDate.length} leads...`);
    }
    
    console.log('\n🎉 Successfully updated all leads with missing created_date!');
    
    // Verify the fix
    console.log('\n🔍 Verifying the fix...');
    const verifySnapshot = await db.collection(collections.leads).get();
    let stillMissing = 0;
    
    verifySnapshot.forEach(doc => {
      if (!doc.data().created_date) {
        stillMissing++;
      }
    });
    
    if (stillMissing === 0) {
      console.log('✅ Verification complete: All leads now have created_date!');
    } else {
      console.log(`⚠️  Warning: ${stillMissing} leads still missing created_date`);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
fixMissingCreatedDates();