const fs = require('fs');
const path = require('path');

const DIRS = ['frontend/public/components', 'frontend/public/utils'];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  // Remove debug flag declarations and their usage
  content = content.replace(/const\s+ENABLE_\w*DEBUG\s*=\s*(true|false);?\s*\/\/.*\n/g, '');
  content = content.replace(/const\s+\w*[Ll]og\s*=\s*ENABLE_\w*DEBUG\s*\?\s*console\.log\s*:\s*\(\)\s*=>\s*{}.*\n/g, '');
  
  // Remove if statements that check debug flags
  content = content.replace(/if\s*\(ENABLE_\w*DEBUG\s*&&[^)]+\)\s*{\s*\n[^}]*}\n/g, '');
  content = content.replace(/if\s*\(ENABLE_\w*DEBUG\)\s*{\s*\n[^}]*}\n/g, '');
  
  // Replace debug log calls with window.log.debug
  content = content.replace(/allocLog\(/g, 'window.log.debug(');
  content = content.replace(/deliveryLog\(/g, 'window.log.debug(');
  content = content.replace(/chartLog\(/g, 'window.log.debug(');
  content = content.replace(/debugLog\(/g, 'window.log.debug(');
  
  // Remove window.debugLog assignments
  content = content.replace(/window\.debugLog\s*=\s*ENABLE_\w*\s*\?\s*console\.log\s*:\s*\(\)\s*=>\s*{}.*\n/g, '');
  
  // Clean up extra blank lines
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  if (content !== original) {
    // Backup
    fs.writeFileSync(filePath + '.bak', original);
    // Write cleaned
    fs.writeFileSync(filePath, content);
    console.log(`✓ ${path.basename(filePath)} - cleaned`);
  }
}

// Process all files
console.log('Starting enhanced debug cleanup...\n');

DIRS.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith('.js') && !f.includes('backup') && !f.includes('.bak'))
      .map(f => path.join(dir, f));
    
    files.forEach(processFile);
  }
});

console.log('\nEnhanced cleanup complete!');
