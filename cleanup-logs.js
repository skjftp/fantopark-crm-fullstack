const fs = require('fs');
const path = require('path');

// Configuration
const DIRS_TO_PROCESS = [
  'frontend/public/components',
  'frontend/public/utils',
  'backend/src'
];

const BACKUP_DIR = `backup_logs_${new Date().toISOString().split('T')[0]}`;

// Patterns to replace
const REPLACEMENTS = [
  // Remove emoji-heavy console.logs
  { pattern: /console\.log\(['"]✅[^'"]*['"]\);?\n?/g, replacement: '' },
  { pattern: /console\.log\(['"]🔍[^'"]*['"]\);?\n?/g, replacement: '' },
  { pattern: /console\.log\(['"]🎯[^'"]*['"]\);?\n?/g, replacement: '' },
  { pattern: /console\.log\(['"]📊[^'"]*['"]\);?\n?/g, replacement: '' },
  
  // Replace console.error with window.log.error
  { pattern: /console\.error\(/g, replacement: 'window.log.error(' },
  
  // Replace console.warn with window.log.warn  
  { pattern: /console\.warn\(/g, replacement: 'window.log.warn(' },
  
  // Remove "loaded successfully" messages
  { pattern: /console\.log\([^)]*loaded successfully[^)]*\);?\n?/gi, replacement: '' }
];

// Process files
function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = content;
  let changeCount = 0;

  REPLACEMENTS.forEach(({ pattern, replacement }) => {
    const matches = modified.match(pattern);
    if (matches) {
      changeCount += matches.length;
      modified = modified.replace(pattern, replacement);
    }
  });

  if (changeCount > 0) {
    // Backup original
    const backupPath = path.join(BACKUP_DIR, path.relative('.', filePath));
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.writeFileSync(backupPath, content);
    
    // Write modified
    fs.writeFileSync(filePath, modified);
    console.log(`✓ ${filePath} - ${changeCount} replacements`);
  }
}

// Main
console.log('Starting log cleanup...');
fs.mkdirSync(BACKUP_DIR, { recursive: true });

DIRS_TO_PROCESS.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir, { recursive: true })
      .filter(f => f.endsWith('.js'))
      .map(f => path.join(dir, f));
    
    files.forEach(processFile);
  }
});

console.log(`\nDone! Backups saved to ${BACKUP_DIR}`);
