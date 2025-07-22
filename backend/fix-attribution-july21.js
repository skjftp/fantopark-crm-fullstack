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

    console.log('🚀 Starting July 21, 2024 lead attribution fix...');
    console.log(`📊 Mode: ${isDryRun ? 'DRY RUN' : 'LIVE UPDATE'}`);
    console.log('');

    try {
      // Fetch all leads from July 21
      console.log('📅 Fetching leads for July 21, 2024...');
      const snapshot = await db.collection(collections.leads)
        .where('date_of_enquiry', '>=', '2024-07-21T00:00:00.000Z')
        .where('date_of_enquiry', '<=', '2024-07-21T23:59:59.999Z')
        .get();

      console.log(`✅ Found ${snapshot.size} total leads for July 21`);
      console.log('');

      const stats = {
        total: snapshot.size,
        analyzed: 0,
        needsUpdate: 0,
        updated: 0,
        bySource: {
          Instagram: { current: 0, willBe: 0 },
          Facebook: { current: 0, willBe: 0 }
        }
      };

      const updates = [];
      const batch = db.batch();

      // Analyze each lead
      for (const doc of snapshot.docs) {
        const lead = { id: doc.id, ...doc.data() };
        stats.analyzed++;

        // Count current source
        if (lead.source === 'Instagram') stats.bySource.Instagram.current++;
        if (lead.source === 'Facebook') stats.bySource.Facebook.current++;

        // Detect what source should be
        const detectedSource = detectPlatformSource(lead);

        // Count future source
        if (detectedSource === 'Instagram') stats.bySource.Instagram.willBe++;
        if (detectedSource === 'Facebook') stats.bySource.Facebook.willBe++;

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
              adset_name: lead.adset_name
            }
          };

          updates.push(updateInfo);

          // Prepare update for batch
          if (!isDryRun) {
            const docRef = db.collection(collections.leads).doc(lead.id);
            batch.update(docRef, {
              source: detectedSource,
              attribution_fixed_date: new Date().toISOString(),
              attribution_fixed_reason: 'July 21 historical correction',
              original_source: lead.source
            });
          }
        }
      }

      // Show results
      console.log('📊 ANALYSIS COMPLETE:');
      console.log('='.repeat(60));
      console.log(`Total leads analyzed: ${stats.analyzed}`);
      console.log(`Leads needing update: ${stats.needsUpdate}`);
      console.log('');
      console.log('Current Attribution:');
      console.log(`  Instagram: ${stats.bySource.Instagram.current}`);
      console.log(`  Facebook: ${stats.bySource.Facebook.current}`);
      console.log('');
      console.log('After Fix Attribution:');
      console.log(`  Instagram: ${stats.bySource.Instagram.willBe}`);
      console.log(`  Facebook: ${stats.bySource.Facebook.willBe}`);
      console.log('='.repeat(60));

      if (updates.length > 0) {
        console.log('\n�� LEADS TO BE UPDATED:');
        updates.forEach((update, index) => {
          console.log(`\n${index + 1}. ${update.name} (${update.email})`);
          console.log(`   Current: ${update.currentSource} → New: ${update.newSource}`);
          console.log(`   Form: ${update.indicators.form_name || 'N/A'}`);
          console.log(`   Campaign: ${update.indicators.campaign_name || 'N/A'}`);
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
        console.log('📌 To apply these changes, run: node fix-attribution-july21.js --live');
      } else {
        console.log('\n✅ No updates needed - all leads have correct attribution');
      }

      // Show expected impact
      if (stats.needsUpdate > 0) {
        console.log('\n📈 EXPECTED IMPACT:');
        const fbIncrease = stats.bySource.Facebook.willBe - stats.bySource.Facebook.current;
        const igDecrease = stats.bySource.Instagram.current -
  stats.bySource.Instagram.willBe;
        console.log(`  Facebook leads will increase by: ${fbIncrease}`);
        console.log(`  Instagram leads will decrease by: ${igDecrease}`);
        console.log('  This should align your CRM data with Facebook Ads Manager');
      }

    } catch (error) {
      console.error('\n❌ Error:', error.message);
      if (error.code === 9) {
        console.error('\n💡 This query requires a Firestore index.');
        console.error('Please create the index or contact your administrator.');
      }
    }
  }

  // Run the fix
  fixJuly21Attribution();
