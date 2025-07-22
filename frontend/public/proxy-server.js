// Simple proxy server to avoid CORS and authentication issues
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files from current directory
app.use(express.static(__dirname));

// Proxy API calls to backend (local only - bypass Cloud Workstation auth)
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:8080',
  changeOrigin: true,
  logLevel: 'debug'
}));

// Default route serves fix-attribution.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'fix-attribution.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${__dirname}`);
  console.log(`🔗 Proxying API calls to: http://localhost:8080`);
  console.log('');
  console.log('✅ Open http://localhost:3000 to use the fix-attribution tool');
});