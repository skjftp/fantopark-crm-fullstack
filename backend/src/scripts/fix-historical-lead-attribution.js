// Historical Lead Attribution Fix Script
// Fixes source attribution for existing leads that were incorrectly labeled

const { db, collections } = require('../config/db');

// Reuse the same detection logic from webhooks.js
function detectPlatformSourceFromData(leadData) {
  try {
    console.log(`🔍 Analyzing lead: ${leadData.name} (${leadData.email})`);
    
    // Method 1: Check form name for platform indicators
    const formName = leadData.form_name || '';
    if (formName.toLowerCase().includes('facebook') || formName.toLowerCase().includes('fb')) {
      console.log(`✅ Detected Facebook from form name: ${formName}`);
      return 'Facebook';
    }
    if (formName.toLowerCase().includes('instagram') || formName.toLowerCase().includes('ig')) {
      console.log(`✅ Detected Instagram from form name: ${formName}`);
      return 'Instagram';
    }
    
    // Method 2: Check campaign name for platform indicators
    const campaignName = leadData.campaign_name || '';
    if (campaignName.toLowerCase().includes('facebook') || campaignName.toLowerCase().includes('fb')) {
      console.log(`✅ Detected Facebook from campaign name: ${campaignName}`);
      return 'Facebook';
    }
    if (campaignName.toLowerCase().includes('instagram') || campaignName.toLowerCase().includes('ig')) {
      console.log(`✅ Detected Instagram from campaign name: ${campaignName}`);
      return 'Instagram';
    }
    
    // Method 3: Check lead_for_event for platform indicators
    const eventName = (leadData.lead_for_event || '').toLowerCase();
    if (eventName.includes('facebook') || eventName.includes('fb')) {
      console.log(`✅ Detected Facebook from event name: ${leadData.lead_for_event}`);
      return 'Facebook';
    }
    if (eventName.includes('instagram') || eventName.includes('ig')) {
      console.log(`✅ Detected Instagram from event name: ${leadData.lead_for_event}`);
      return 'Instagram';
    }
    
    // Method 4: Check adset name for platform indicators  
    const adsetName = leadData.adset_name || '';
    if (adsetName.toLowerCase().includes('facebook') || adsetName.toLowerCase().includes('fb')) {
      console.log(`✅ Detected Facebook from adset name: ${adsetName}`);
      return 'Facebook';
    }
    if (adsetName.toLowerCase().includes('instagram') || adsetName.toLowerCase().includes('ig')) {
      console.log(`✅ Detected Instagram from adset name: ${adsetName}`);
      return 'Instagram';
    }
    
    // Method 5: Check created_by field
    const createdBy = leadData.created_by || '';
    if (createdBy.toLowerCase().includes('facebook')) {
      console.log(`✅ Detected Facebook from created_by: ${createdBy}`);
      return 'Facebook';
    }
    if (createdBy.toLowerCase().includes('instagram')) {
      console.log(`✅ Detected Instagram from created_by: ${createdBy}`);
      return 'Instagram';
    }
    
    // Method 6: Advanced heuristics
    // If has Meta tracking fields and campaign data, likely Facebook (more sophisticated)
    if ((leadData.meta_lead_id || leadData.meta_created_time) && 
        (leadData.campaign_id || leadData.adset_id)) {
      console.log(`⚠️ Defaulting to Facebook (has Meta tracking + campaign data)`);
      return 'Facebook';
    }
    
    // If has Meta tracking but no campaign data, likely Instagram (simpler)
    if (leadData.meta_lead_id || leadData.meta_created_time) {
      console.log(`⚠️ Defaulting to Instagram (has Meta tracking, no campaign data)`);
      return 'Instagram';
    }
    
    // If no Meta fields at all, keep existing source (might be manual or other)
    console.log(`⚠️ No Meta indicators found, keeping existing source: ${leadData.source}`);
    return leadData.source;
    
  } catch (error) {
    console.error(`❌ Error detecting source for ${leadData.email}:`, error);
    return leadData.source; // Keep existing if error
  }
}

async function fixHistoricalAttribution(options = {}) {
  const {
    dryRun = true,
    batchSize = 100,
    dateFrom = null,
    dateTo = null,
    onlyIncorrectSources = true
  } = options;

  console.log('🚀 Starting historical lead attribution fix...');
  console.log(`📊 Mode: ${dryRun ? 'DRY RUN' : 'LIVE UPDATE'}`);
  console.log(`📦 Batch size: ${batchSize}`);
  
  const stats = {
    total: 0,
    analyzed: 0,
    needsUpdate: 0,
    updated: 0,
    errors: 0,
    sourceChanges: {}
  };

  try {
    // Build query
    let query = db.collection(collections.leads);
    
    // Add date filters if provided
    if (dateFrom) {
      query = query.where('date_of_enquiry', '>=', dateFrom);
      console.log(`📅 Date from: ${dateFrom}`);
    }
    if (dateTo) {
      query = query.where('date_of_enquiry', '<=', dateTo);
      console.log(`📅 Date to: ${dateTo}`);
    }
    
    // Only get potentially Meta leads if filtering
    if (onlyIncorrectSources) {
      query = query.where('source', 'in', ['Instagram', 'Facebook', '']);
      console.log('🎯 Filtering: Only Instagram/Facebook/empty sources');
    }
    
    // Order by date to process chronologically
    if (dateFrom || dateTo) {
      query = query.orderBy('date_of_enquiry', 'asc');
    }
    
    console.log('📊 Fetching leads...');
    const snapshot = await query.get();
    stats.total = snapshot.size;
    
    console.log(`📈 Found ${stats.total} leads to analyze`);
    
    if (stats.total === 0) {
      console.log('✅ No leads found matching criteria');
      return stats;
    }

    // Process in batches
    const leads = [];
    snapshot.forEach(doc => {
      leads.push({ id: doc.id, ...doc.data() });
    });

    // Group by date for reporting
    const byDate = {};
    
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);
      console.log(`\n📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(leads.length/batchSize)} (${batch.length} leads)`);
      
      const firestoreBatch = db.batch();
      let batchHasUpdates = false;
      
      for (const lead of batch) {
        stats.analyzed++;
        
        // Skip if no source or already has correct-looking source  
        if (!lead.source || (lead.source !== 'Instagram' && lead.source !== 'Facebook' && lead.source !== '')) {
          continue;
        }
        
        const currentSource = lead.source;
        const detectedSource = detectPlatformSourceFromData(lead);
        
        // Track by date for reporting
        const leadDate = lead.date_of_enquiry?.substring(0, 10) || 'unknown';
        if (!byDate[leadDate]) {
          byDate[leadDate] = { total: 0, updates: 0, sources: {} };
        }
        byDate[leadDate].total++;
        
        if (detectedSource !== currentSource) {
          stats.needsUpdate++;
          
          const changeKey = `${currentSource} → ${detectedSource}`;
          stats.sourceChanges[changeKey] = (stats.sourceChanges[changeKey] || 0) + 1;
          
          byDate[leadDate].updates++;
          byDate[leadDate].sources[changeKey] = (byDate[leadDate].sources[changeKey] || 0) + 1;
          
          console.log(`🔄 ${lead.name} (${lead.email}): ${currentSource} → ${detectedSource}`);
          
          if (!dryRun) {
            // Prepare update
            const docRef = db.collection(collections.leads).doc(lead.id);
            const updateData = {
              source: detectedSource,
              // Update related fields too
              form_name: lead.form_name?.replace('Instagram Lead Form', `${detectedSource} Lead Form`) || `${detectedSource} Lead Form`,
              created_by: lead.created_by?.replace('Instagram Lead Form', `${detectedSource} Lead Form`) || `${detectedSource} Lead Form`,
              // Add audit trail
              attribution_fixed_date: new Date().toISOString(),
              attribution_fixed_reason: 'Historical correction script',
              original_source: currentSource
            };
            
            firestoreBatch.update(docRef, updateData);
            batchHasUpdates = true;
          }
        }
        
        // Progress indicator
        if (stats.analyzed % 50 === 0) {
          console.log(`📊 Progress: ${stats.analyzed}/${stats.total} analyzed, ${stats.needsUpdate} need updates`);
        }
      }
      
      // Commit batch if we have updates and not dry run
      if (batchHasUpdates && !dryRun) {
        try {
          await firestoreBatch.commit();
          stats.updated += batch.filter(lead => {
            const detectedSource = detectPlatformSourceFromData(lead);
            return detectedSource !== lead.source;
          }).length;
          console.log(`✅ Batch committed successfully`);
        } catch (error) {
          stats.errors++;
          console.error(`❌ Batch commit error:`, error);
        }
      }
    }
    
    // Final report
    console.log('\n' + '='.repeat(80));
    console.log('📊 HISTORICAL ATTRIBUTION FIX REPORT');
    console.log('='.repeat(80));
    console.log(`📈 Total leads: ${stats.total}`);
    console.log(`🔍 Analyzed: ${stats.analyzed}`);
    console.log(`🔄 Need updates: ${stats.needsUpdate}`);
    console.log(`✅ Updated: ${stats.updated}`);
    console.log(`❌ Errors: ${stats.errors}`);
    
    if (Object.keys(stats.sourceChanges).length > 0) {
      console.log('\n📋 Source Changes:');
      Object.entries(stats.sourceChanges).forEach(([change, count]) => {
        console.log(`  ${change}: ${count} leads`);
      });
    }
    
    if (Object.keys(byDate).length > 0) {
      console.log('\n📅 Changes by Date:');
      Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([date, data]) => {
          if (data.updates > 0) {
            console.log(`  ${date}: ${data.updates}/${data.total} leads updated`);
            Object.entries(data.sources).forEach(([change, count]) => {
              console.log(`    ${change}: ${count}`);
            });
          }
        });
    }
    
    if (dryRun) {
      console.log('\n⚠️  This was a DRY RUN - no changes were made');
      console.log('🚀 To apply changes, run with dryRun: false');
    }
    
    console.log('='.repeat(80));
    
    return stats;
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    stats.errors++;
    return stats;
  }
}

// CLI execution
if (require.main === module) {
  console.log('🚀 Running historical lead attribution fix...');
  
  const args = process.argv.slice(2);
  const options = {
    dryRun: !args.includes('--live'),
    batchSize: 100
  };
  
  // Parse date arguments
  const dateFromArg = args.find(arg => arg.startsWith('--from='));
  if (dateFromArg) {
    options.dateFrom = dateFromArg.split('=')[1];
  }
  
  const dateToArg = args.find(arg => arg.startsWith('--to='));
  if (dateToArg) {
    options.dateTo = dateToArg.split('=')[1];
  }
  
  fixHistoricalAttribution(options)
    .then(stats => {
      console.log('\n✅ Script completed');
      process.exit(stats.errors > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixHistoricalAttribution, detectPlatformSourceFromData };