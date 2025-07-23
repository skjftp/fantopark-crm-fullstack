#!/usr/bin/env node

/**
 * Analyze date_of_enquiry timezone inconsistencies
 * This script will check all leads and identify which ones have timezone issues
 */

const { db, collections } = require('./src/config/db');

async function analyzeDateTimezoneIssues() {
  console.log('🔍 Analyzing date_of_enquiry timezone issues...\n');
  
  try {
    // Get all leads
    const snapshot = await db.collection(collections.leads)
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
      
      if (recentIssues.matching.includes(lead)) sourceGroups[source].matching++;
      if (recentIssues.utcDates.includes(lead)) sourceGroups[source].utc++;
      if (recentIssues.suspicious.includes(lead)) sourceGroups[source].suspicious++;
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
    
    // Check specific patterns
    console.log('\n🔍 Pattern Analysis:');
    console.log('='.repeat(50));
    
    // Check webhook leads
    const webhookLeads = [...recentIssues.matching, ...recentIssues.utcDates, ...recentIssues.suspicious]
      .filter(l => l.created_by && (l.created_by.includes('Lead Form') || l.created_by === 'System'));
    console.log(`Webhook/System leads with issues: ${webhookLeads.length}`);
    
    // Check manual leads
    const manualLeads = [...recentIssues.matching, ...recentIssues.utcDates, ...recentIssues.suspicious]
      .filter(l => l.created_by && !l.created_by.includes('Lead Form') && l.created_by !== 'System' && l.created_by !== 'Bulk Import');
    console.log(`Manual leads with issues: ${manualLeads.length}`);
    
    // Check bulk upload leads
    const bulkLeads = [...recentIssues.matching, ...recentIssues.utcDates, ...recentIssues.suspicious]
      .filter(l => l.source === 'Bulk Upload' || l.created_by === 'Bulk Import');
    console.log(`Bulk upload leads with issues: ${bulkLeads.length}`);
    
    // Export results
    const results = {
      analysis_date: new Date().toISOString(),
      total_leads: snapshot.size,
      overall_issues: issues,
      recent_issues: recentIssues,
      source_breakdown: sourceGroups,
      pattern_analysis: {
        webhook_leads: webhookLeads.length,
        manual_leads: manualLeads.length,
        bulk_leads: bulkLeads.length
      }
    };
    
    const fs = require('fs');
    const filename = `date-timezone-analysis-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(results, null, 2));
    console.log(`\n📁 Full analysis saved to: ${filename}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run analysis
analyzeDateTimezoneIssues()
  .then(() => {
    console.log('\n✅ Analysis complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });