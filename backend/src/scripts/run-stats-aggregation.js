require('dotenv').config();
const statsAggregationService = require('../services/statsAggregationService');

async function runAggregation() {
  console.log('🚀 Running stats aggregation manually...');
  
  try {
    const stats = await statsAggregationService.aggregateAllStats();
    console.log('✅ Stats aggregation completed successfully!');
    console.log('📊 Summary:');
    console.log(`- Financials calculated for ${Object.keys(stats.financials).length} periods`);
    console.log(`- Sales performance for ${Object.keys(stats.salesPerformance).length} users`);
    console.log(`- Retail tracker for ${Object.keys(stats.retailTracker).length} users`);
    console.log(`- Marketing performance: ${Object.keys(stats.marketingPerformance.sources).length} sources, ${Object.keys(stats.marketingPerformance.campaigns).length} campaigns`);
    console.log(`- Processing time: ${stats.metadata.processingTimeMs}ms`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Aggregation failed:', error);
    process.exit(1);
  }
}

runAggregation();