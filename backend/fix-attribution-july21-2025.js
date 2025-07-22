const { db, collections } = require('./src/config/db');

  // Platform detection logic
  function detectPlatformSource(lead) {
    const fields = [
      lead.form_name || '',
      lead.campaign_name || '',
      lead.adset_name || '',
      lead.ad_name || '',
      lead.created_by || ''
    ];

    const combinedText = fields.join(' ').toLowerCase();

    if (combinedText.includes('facebook') || combinedText.includes('fb')) {
      return 'Facebook';
    }
    if (combinedText.includes('instagram') || combinedText.includes('ig')) {
      return 'Instagram';
    }

    // Default based on campaign data presence
    if (lead.campaign_id || lead.adset_id) {
      return 'Facebook';
    }

    return 'Instagram';
  }

  async function fixJuly21Attribution() {
    const isDryRun = !process.argv.includes('--live');

    console.log('🚀 Starting July 21, 2025 lead attribution fix...');
    console.log(`📊 Mode: ${isDryRun ? 'DRY RUN' : 'LIVE UPDATE'}`);
    console.log('');

    try {
      // Fetch all leads from July 21, 2025
      console.log('📅 Fetching leads for July 21, 2025...');

      // First, let's get ALL leads and filter manually since date queries seem problematic
      const allLeadsSnapshot = await db.collection(collections.leads).get();
      
      const july21Leads = [];
      allLeadsSnapshot.forEach(doc => {
        const lead = doc.data();
        const dateStr = (lead.date_of_enquiry || '').toString();
        
        // Check for July 21, 2025 in various formats
        if (dateStr.includes('2025-07-21')) {
          july21Leads.push({ id: doc.id, ...lead });
        }
      });
      
      console.log(`✅ Found ${july21Leads.length} total leads for July 21, 2025`);
      
      if (july21Leads.length === 0) {
        console.log('\n❌ No leads found for July 21, 2025');
        return;
      }
      
      const stats = {
        total: july21Leads.length,
        analyzed: 0,
        needsUpdate: 0,
        updated: 0,
        bySource: {
          Instagram: { current: 0, willBe: 0 },
          Facebook: { current: 0, willBe: 0 },
          Other: { current: 0, willBe: 0 }
        }
      };
      
      const updates = [];
      const batch = db.batch();
      
      // Analyze each lead
      for (const lead of july21Leads) {
        stats.analyzed++;
        
        // Count current source
        const currentSource = lead.source || 'Other';
        if (currentSource === 'Instagram') stats.bySource.Instagram.current++;
        else if (currentSource === 'Facebook') stats.bySource.Facebook.current++;
        else stats.bySource.Other.current++;
        
        // Detect what source should be
        const detectedSource = detectPlatformSource(lead);
        
        // Count future source
        if (detectedSource === 'Instagram') stats.bySource.Instagram.willBe++;
        else if (detectedSource === 'Facebook') stats.bySource.Facebook.willBe++;
        else stats.bySource.Other.willBe++;
        
        // Check if update needed
        if (lead.source !== detectedSource) {
          stats.needsUpdate++;
          
          const updateInfo = {
            id: lead.id,
            name: lead.name,
            email: lead.email,
            currentSource: lead.source || 'undefined',
            newSource: detectedSource,
            indicators: {
              form_name: lead.form_name,
              campaign_name: lead.campaign_name,
              adset_name: lead.adset_name,
              created_by: lead.created_by
            }
          };
          
          updates.push(updateInfo);
          
          // Prepare update for batch
          if (!isDryRun) {
            const docRef = db.collection(collections.leads).doc(lead.id);
            batch.update(docRef, {
              source: detectedSource,
              attribution_fixed_date: new Date().toISOString(),
              attribution_fixed_reason: 'July 21, 2025 historical correction',
              original_source: lead.source
            });
          }
        }
      }
      
      // Show results
      console.log('\n📊 ANALYSIS COMPLETE:');
      console.log('='.repeat(60));
      console.log(`Total leads analyzed: ${stats.analyzed}`);
      console.log(`Leads needing update: ${stats.needsUpdate}`);
      console.log('');
      console.log('Current Attribution:');
      console.log(`  Instagram: ${stats.bySource.Instagram.current}`);
      console.log(`  Facebook: ${stats.bySource.Facebook.current}`);
      console.log(`  Other: ${stats.bySource.Other.current}`);
      console.log('');
      console.log('After Fix Attribution:');
      console.log(`  Instagram: ${stats.bySource.Instagram.willBe}`);
      console.log(`  Facebook: ${stats.bySource.Facebook.willBe}`);
      console.log(`  Other: ${stats.bySource.Other.willBe}`);
      console.log('='.repeat(60));
      
      if (updates.length > 0) {
        console.log('\n🔄 LEADS TO BE UPDATED:');
        updates.forEach((update, index) => {
          console.log(`\n${index + 1}. ${update.name} (${update.email})`);
          console.log(`   Current: ${update.currentSource} → New: ${update.newSource}`);
          console.log(`   Form: ${update.indicators.form_name || 'N/A'}`);
          console.log(`   Campaign: ${update.indicators.campaign_name || 'N/A'}`);
          console.log(`   Created By: ${update.indicators.created_by || 'N/A'}`);
        });
      }
      
      // Apply updates if not dry run
      if (!isDryRun && updates.length > 0) {
        console.log('\n🚀 Applying updates...');
        await batch.commit();
        stats.updated = updates.length;
        console.log(`✅ Successfully updated ${stats.updated} leads`);
      } else if (isDryRun && updates.length > 0) {
        console.log('\n⚠️  This was a DRY RUN - no changes were made');
        console.log('📌 To apply these changes, run: node fix-attribution-july21-2025.js --live');
      } else {
        console.log('\n✅ No updates needed - all leads have correct attribution');
      }
      
      // Show expected impact
      if (stats.needsUpdate > 0) {
        console.log('\n📈 EXPECTED IMPACT:');
        const fbIncrease = stats.bySource.Facebook.willBe - stats.bySource.Facebook.current;
        const igDecrease = stats.bySource.Instagram.current - stats.bySource.Instagram.willBe;
        console.log(`  Facebook leads will increase by: ${fbIncrease}`);
        console.log(`  Instagram leads will decrease by: ${igDecrease}`);
        console.log('  This should align your CRM data with Facebook Ads Manager');
      }
      
      // Show comparison with Facebook Ads Manager data
      console.log('\n📊 FACEBOOK ADS MANAGER COMPARISON:');
      console.log('Facebook Ads Manager (July 21, 2025):');
      console.log('  • Impressions: 62,994');
      console.log('  • Leads: 17');
      console.log('  • CPM: ₹123.81');
      console.log('  • CTR: 0.44%');
      console.log('  • CPL: ₹458.78');
      console.log('');
      console.log('CRM Data After Fix:');
      console.log(`  • Total Leads: ${stats.total}`);
      console.log(`  • Facebook: ${stats.bySource.Facebook.willBe}`);
      console.log(`  • Instagram: ${stats.bySource.Instagram.willBe}`);
      
    } catch (error) {
      console.error('\n❌ Error:', error.message);
      console.error(error.stack);
    }
  }

  // Run the fix
  fixJuly21Attribution();
