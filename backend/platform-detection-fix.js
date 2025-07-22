
// Helper function to detect platform source (Facebook vs Instagram)
async function detectPlatformSource(leadDetails, inventory) {
  try {
    console.log('🔍 Detecting platform source...');
    console.log('   Lead details:', {
      form_name: leadDetails.form_name || 'N/A',
      campaign_name: leadDetails.campaign_name || 'N/A',
      adset_name: leadDetails.adset_name || 'N/A',
      ad_name: leadDetails.ad_name || 'N/A',
      platform: leadDetails.platform || 'N/A'
    });
    
    // Method 0: Check if platform is explicitly provided by Meta
    if (leadDetails.platform) {
      console.log('✅ Platform explicitly provided:', leadDetails.platform);
      return leadDetails.platform === 'instagram' ? 'Instagram' : 'Facebook';
    }
    
    // Method 1: Check form name for platform indicators
    const formName = leadDetails.form_name || leadDetails.form?.name || '';
    if (formName.toLowerCase().includes('facebook') || formName.toLowerCase().includes('fb')) {
      console.log('✅ Detected Facebook from form name:', formName);
      return 'Facebook';
    }
    if (formName.toLowerCase().includes('instagram') || formName.toLowerCase().includes('ig')) {
      console.log('✅ Detected Instagram from form name:', formName);
      return 'Instagram';
    }
    
    // Method 2: Check campaign name for platform indicators
    const campaignName = leadDetails.campaign_name || '';
    if (campaignName.toLowerCase().includes('facebook') || campaignName.toLowerCase().includes('fb')) {
      console.log('✅ Detected Facebook from campaign name:', campaignName);
      return 'Facebook';
    }
    if (campaignName.toLowerCase().includes('instagram') || campaignName.toLowerCase().includes('ig')) {
      console.log('✅ Detected Instagram from campaign name:', campaignName);
      return 'Instagram';
    }
    
    // Method 3: Check inventory context
    if (inventory?.event_name) {
      const eventName = inventory.event_name.toLowerCase();
      if (eventName.includes('facebook') || eventName.includes('fb')) {
        console.log('✅ Detected Facebook from inventory event:', inventory.event_name);
        return 'Facebook';
      }
      if (eventName.includes('instagram') || eventName.includes('ig')) {
        console.log('✅ Detected Instagram from inventory event:', inventory.event_name);
        return 'Instagram';
      }
    }
    
    // Method 4: Check adset name for platform indicators
    const adsetName = leadDetails.adset_name || '';
    if (adsetName.toLowerCase().includes('facebook') || adsetName.toLowerCase().includes('fb')) {
      console.log('✅ Detected Facebook from adset name:', adsetName);
      return 'Facebook';
    }
    if (adsetName.toLowerCase().includes('instagram') || adsetName.toLowerCase().includes('ig')) {
      console.log('✅ Detected Instagram from adset name:', adsetName);
      return 'Instagram';
    }
    
    // Method 5: Check ad name for platform indicators
    const adName = leadDetails.ad_name || '';
    if (adName.toLowerCase().includes('facebook') || adName.toLowerCase().includes('fb')) {
      console.log('✅ Detected Facebook from ad name:', adName);
      return 'Facebook';
    }
    if (adName.toLowerCase().includes('instagram') || adName.toLowerCase().includes('ig')) {
      console.log('✅ Detected Instagram from ad name:', adName);
      return 'Instagram';
    }
    
    // Method 6: Check if lead has NO campaign data at all - these are typically direct/organic leads
    const hasCampaignData = leadDetails.campaign_id || leadDetails.campaign_name || 
                           leadDetails.adset_id || leadDetails.adset_name ||
                           leadDetails.ad_id || leadDetails.ad_name;
    
    if (!hasCampaignData) {
      // No campaign data usually means organic/direct lead
      // These could come from either platform's organic posts or direct messages
      // Default to Facebook as it's the parent platform
      console.log('⚠️ No campaign data - likely organic lead, defaulting to Facebook');
      return 'Facebook';
    }
    
    // Final fallback: If we have campaign data but no platform indicators
    // This suggests a generic campaign running on both platforms
    // Check the lead source pattern - Instagram leads often come through different API endpoints
    console.log('⚠️ No platform indicators found, defaulting to Facebook');
    return 'Facebook';
    
  } catch (error) {
    console.error('❌ Error detecting platform source:', error);
    return 'Facebook'; // Safe default
  }
}
