const fs = require('fs');
const path = require('path');

const DIRS = ['frontend/public/components', 'frontend/public/utils'];

// Patterns to remove
const PATTERNS = [
  // Remove debug flag declarations
  /const\s+ENABLE_\w*DEBUG\s*=\s*(true|false);?\s*\n/g,
  
  // Remove conditional log variables
  /const\s+\w*[Ll]og\s*=\s*ENABLE_\w*DEBUG\s*\?\s*console\.log\s*:\s*\(\)\s*=>\s*{};?\s*\n/g,
  
  // Remove debug flag conditionals
  /if\s*\(ENABLE_\w*DEBUG\)\s*{\s*\n([^}]*)\n\s*}/g,
  
  // Clean up empty lines left behind
  /\n\s*\n\s*\n/g
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = content;
  let changes = 0;
  
  PATTERNS.forEach(pattern => {
    const before = modified.length;
    modified = modified.replace(pattern, (match, p1) => {
      // For if blocks, keep the content but remove the conditional
      if (match.includes('if')) {
        return p1 || '';
      }
      return '\n';
    });
    if (modified.length !== before) changes++;
  });
  
  // Clean up multiple blank lines
  modified = modified.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  if (changes > 0) {
    fs.writeFileSync(filePath, modified);
    console.log(`✓ ${path.basename(filePath)} - ${changes} debug patterns removed`);
  }
}

// Process all files
DIRS.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith('.js') && !f.includes('backup'))
      .map(f => path.join(dir, f));
    
    files.forEach(processFile);
  }
});

console.log('\nDebug flags cleanup complete!');
