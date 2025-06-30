const fs = require('fs');
const path = require('path');

// Read the Lead model
const leadModelPath = path.join(__dirname, 'backend/src/models/Lead.js');
let content = fs.readFileSync(leadModelPath, 'utf8');

console.log('Checking Lead.update method for issues...');

// Check if the update method is filtering out fields
if (content.includes('static async update')) {
    console.log('Found static update method');
    
    // Look for common issues:
    // 1. Not including all fields in update
    // 2. Missing the status field
    // 3. Using a whitelist that excludes status
    
    const updateMethodMatch = content.match(/static async update[\s\S]*?^  }/m);
    if (updateMethodMatch) {
        console.log('Current update method:', updateMethodMatch[0]);
    }
}

// Common fix patterns
const fixes = {
    // If using field filtering, ensure status is included
    'const allowedFields = [': 'const allowedFields = [\'status\', ',
    
    // If using destructuring without status
    'const { name, email': 'const { status, name, email',
    
    // If using Object.keys filter
    '.filter(key => !': '.filter(key => false && !'
};

console.log('\nPotential fixes to apply:');
Object.entries(fixes).forEach(([pattern, replacement]) => {
    if (content.includes(pattern)) {
        console.log(`- Replace "${pattern}" with "${replacement}"`);
    }
});
