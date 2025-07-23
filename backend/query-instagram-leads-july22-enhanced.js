#!/usr/bin/env node

/**
 * Enhanced query for Instagram leads on July 22nd, 2025
 * Features:
 * - Timezone-aware date filtering
 * - Multiple ad set field support
 * - Duplicate detection
 * - Export formats (CSV, JSON)
 * - Performance metrics
 */

const { db, collections } = require('./src/config/db');
const fs = require('fs').promises;
const path = require('path');

async function queryInstagramLeadsJuly22Enhanced() {
  const startTime = Date.now();
  
  console.log('📱 Instagram Leads Analysis - July 22nd, 2025');
  console.log('=' .repeat(60));
  console.log();
  
  // Define date range with IST consideration
  // July 22nd, 2025 00:00:00 IST to 23:59:59 IST
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const startDateIST = new Date('2025-07-22T00:00:00+05:30');
  const endDateIST = new Date('2025-07-22T23:59:59+05:30');
  
  // Convert to UTC for Firestore query
  const startDateUTC = new Date(startDateIST.getTime() - istOffset);
  const endDateUTC = new Date(endDateIST.getTime() - istOffset);
  
  console.log(`IST Date Range: ${startDateIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
  console.log(`                to ${endDateIST.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
  console.log(`UTC Query Range: ${startDateUTC.toISOString()} to ${endDateUTC.toISOString()}`);
  console.log();
  
  try {
    // Query Instagram leads
    const snapshot = await db.collection(collections.leads)
      .where('source', '==', 'Instagram')
      .where('date_of_enquiry', '>=', startDateUTC.toISOString())
      .where('date_of_enquiry', '<=', endDateUTC.toISOString())
      .orderBy('date_of_enquiry', 'asc')
      .get();
    
    if (snapshot.empty) {
      console.log('❌ No Instagram leads found for July 22nd, 2025');
      return;
    }
    
    // Process leads
    const adSetGroups = {};
    const allLeads = [];
    const phoneNumbers = new Set();
    const duplicates = [];
    
    snapshot.forEach(doc => {
      const lead = { id: doc.id, ...doc.data() };
      allLeads.push(lead);
      
      // Check for duplicates by phone number
      const phone = lead.phone || lead.mobile || '';
      if (phone && phoneNumbers.has(phone)) {
        duplicates.push({ ...lead, duplicatePhone: phone });
      }
      if (phone) phoneNumbers.add(phone);
      
      // Get ad set name (check multiple possible fields)
      const adSetName = lead.ad_set || 
                       lead.adset_name || 
                       lead.ad_set_name || 
                       lead.adset || 
                       lead.ad_name ||
                       'No Ad Set';
      
      if (!adSetGroups[adSetName]) {
        adSetGroups[adSetName] = {
          leads: [],
          campaigns: new Set(),
          forms: new Set(),
          firstLead: lead.date_of_enquiry,
          lastLead: lead.date_of_enquiry
        };
      }
      
      const group = adSetGroups[adSetName];
      
      // Update timestamps
      if (lead.date_of_enquiry < group.firstLead) group.firstLead = lead.date_of_enquiry;
      if (lead.date_of_enquiry > group.lastLead) group.lastLead = lead.date_of_enquiry;
      
      // Add campaign and form to sets
      if (lead.campaign_name) group.campaigns.add(lead.campaign_name);
      if (lead.form_name) group.forms.add(lead.form_name);
      
      // Add lead details
      group.leads.push({
        id: lead.id,
        name: lead.name || 'Unknown',
        phone: lead.phone || lead.mobile || 'No Phone',
        email: lead.email || 'No Email',
        date: lead.date_of_enquiry,
        campaign: lead.campaign_name || 'No Campaign',
        campaign_id: lead.campaign_id || 'No ID',
        form: lead.form_name || 'No Form',
        form_id: lead.form_id || 'No ID',
        created_by: lead.created_by || 'Unknown',
        meta_lead_id: lead.meta_lead_id || 'No Meta ID'
      });
    });
    
    // Sort ad sets by lead count
    const sortedAdSets = Object.entries(adSetGroups)
      .map(([name, data]) => ({
        name,
        count: data.leads.length,
        leads: data.leads,
        campaigns: Array.from(data.campaigns),
        forms: Array.from(data.forms),
        firstLead: data.firstLead,
        lastLead: data.lastLead
      }))
      .sort((a, b) => b.count - a.count);
    
    // Display detailed results
    console.log('📊 Overview:');
    console.log(`Total Instagram Leads: ${allLeads.length}`);
    console.log(`Unique Ad Sets: ${sortedAdSets.length}`);
    console.log(`Duplicate Phone Numbers: ${duplicates.length}`);
    console.log();
    
    // Detailed ad set breakdown
    console.log('📋 Ad Set Breakdown:');
    console.log('='.repeat(100));
    
    sortedAdSets.forEach((adSet, index) => {
      console.log();
      console.log(`${index + 1}. Ad Set: "${adSet.name}"`);
      console.log(`   Lead Count: ${adSet.count}`);
      console.log(`   Time Range: ${new Date(adSet.firstLead).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} - ${new Date(adSet.lastLead).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
      console.log(`   Campaigns: ${adSet.campaigns.join(', ') || 'None'}`);
      console.log(`   Forms: ${adSet.forms.join(', ') || 'None'}`);
      console.log();
      console.log('   Lead Details:');
      console.log('   ' + '-'.repeat(95));
      console.log('   No. | Name                  | Phone         | Time     | Campaign');
      console.log('   ' + '-'.repeat(95));
      
      adSet.leads.forEach((lead, leadIndex) => {
        const time = new Date(lead.date).toLocaleTimeString('en-IN', { 
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit'
        });
        const name = lead.name.substring(0, 20).padEnd(20);
        const phone = lead.phone.substring(0, 13).padEnd(13);
        const campaign = lead.campaign.substring(0, 30);
        
        console.log(`   ${String(leadIndex + 1).padStart(3)} | ${name} | ${phone} | ${time} | ${campaign}`);
      });
      
      console.log('   ' + '-'.repeat(95));
    });
    
    // Summary statistics
    console.log();
    console.log('📈 Summary Statistics:');
    console.log('='.repeat(40));
    console.log(`Total Leads: ${allLeads.length}`);
    console.log(`Ad Sets: ${sortedAdSets.length}`);
    console.log(`Average Leads/Ad Set: ${(allLeads.length / sortedAdSets.length).toFixed(2)}`);
    console.log(`Max Leads in Ad Set: ${sortedAdSets[0]?.count || 0} ("${sortedAdSets[0]?.name || 'N/A'}")`);
    console.log(`Min Leads in Ad Set: ${sortedAdSets[sortedAdSets.length - 1]?.count || 0}`);
    console.log();
    
    // Top performers
    console.log('🏆 Top 10 Ad Sets:');
    sortedAdSets.slice(0, 10).forEach((adSet, index) => {
      const percentage = ((adSet.count / allLeads.length) * 100).toFixed(1);
      console.log(`${index + 1}. "${adSet.name}" - ${adSet.count} leads (${percentage}%)`);
    });
    
    // Duplicate analysis
    if (duplicates.length > 0) {
      console.log();
      console.log('⚠️  Duplicate Phone Numbers Found:');
      console.log('='.repeat(40));
      duplicates.forEach((dup, index) => {
        console.log(`${index + 1}. ${dup.name} - ${dup.duplicatePhone}`);
      });
    }
    
    // Export data
    const exportData = {
      date: '2025-07-22',
      totalLeads: allLeads.length,
      adSetCount: sortedAdSets.length,
      queryTime: new Date().toISOString(),
      adSets: sortedAdSets.map(adSet => ({
        name: adSet.name,
        count: adSet.count,
        campaigns: adSet.campaigns,
        forms: adSet.forms,
        leads: adSet.leads.map(lead => ({
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          time: new Date(lead.date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        }))
      }))
    };
    
    // Save JSON export
    const jsonPath = path.join(__dirname, `instagram-leads-july22-${Date.now()}.json`);
    await fs.writeFile(jsonPath, JSON.stringify(exportData, null, 2));
    console.log();
    console.log(`📁 JSON export saved to: ${jsonPath}`);
    
    // Generate CSV
    const csvLines = ['Ad Set,Lead Count,Lead Names,Phone Numbers'];
    sortedAdSets.forEach(adSet => {
      const names = adSet.leads.map(l => l.name).join('; ');
      const phones = adSet.leads.map(l => l.phone).join('; ');
      csvLines.push(`"${adSet.name}",${adSet.count},"${names}","${phones}"`);
    });
    
    const csvPath = path.join(__dirname, `instagram-leads-july22-${Date.now()}.csv`);
    await fs.writeFile(csvPath, csvLines.join('\n'));
    console.log(`📁 CSV export saved to: ${csvPath}`);
    
    // Performance metrics
    const executionTime = Date.now() - startTime;
    console.log();
    console.log(`⏱️  Query executed in ${executionTime}ms`);
    
  } catch (error) {
    console.error('❌ Error querying leads:', error);
    throw error;
  }
}

// Run the enhanced query
queryInstagramLeadsJuly22Enhanced()
  .then(() => {
    console.log();
    console.log('✅ Analysis completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });