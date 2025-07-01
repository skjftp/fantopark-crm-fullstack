// Find the line that checks for 'myactions' and add finance check
const fs = require('fs');
const content = fs.readFileSync('frontend/src/App.js', 'utf8');

// Replace the myactions effect to include finance
const newContent = content.replace(
    /if \(activeTab === 'myactions'\) \{[\s\S]*?fetchMyActions\(\);[\s\S]*?\}/,
    `if (activeTab === 'myactions') {
      fetchMyActions();
    } else if (activeTab === 'finance') {
      fetchFinancialData();
    }`
);

fs.writeFileSync('frontend/src/App.js', newContent);
console.log('✅ Finance data loading trigger added!');
