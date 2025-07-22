const fs = require('fs');
const path = require('path');

console.log('Building production version...');

// Read the index.html
let html = fs.readFileSync('./public/index.html', 'utf8');

// In production, replace localhost API URL
if (process.env.NODE_ENV === 'production') {
    html = html.replace(
        'http://localhost:8080/api',
        process.env.BACKEND_API_URL || 'https://fantopark-backend-150582227311.us-central1.run.app/api'
    );
}

// Create build directory
if (!fs.existsSync('./build')) {
    fs.mkdirSync('./build');
}

// Write the processed HTML
fs.writeFileSync('./build/index.html', html);

// Copy other static assets if any
// fs.copyFileSync('./public/favicon.ico', './build/favicon.ico');

console.log('Build complete!');
